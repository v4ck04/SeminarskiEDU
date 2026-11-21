"""Burned-in caption (subtitle) detection and style measurement.

Short-form captions are usually heavy, high-contrast text (bright fill with a
dark outline or shadow) centred horizontally. The detector:

1. finds text-like line regions with a morphological gradient + horizontal
   closing, filtered by size, aspect and horizontal centring;
2. verifies them (bright fill, dark ring/outline or dark box behind, several
   letter-like components, consistent stroke width);
3. measures style: position, text height, fill colour, highlight colour,
   outline thickness, drop shadow, ALL-CAPS likelihood, stroke weight,
   letter width, words per line (gap analysis) and line count;
4. tracks lines over time to find caption changes (timing) and onset
   animation (scale pop, slide, fade, word-by-word reveal, moving highlight).

Font families are NOT identified - only measurable properties are reported.
"""
from __future__ import annotations

import cv2
import numpy as np

from .. import ffmpeg
from ..utils import bgr_to_hex

HUE_NAMES = [(8, "red"), (20, "orange"), (35, "yellow"), (85, "green"), (100, "cyan"),
             (130, "blue"), (155, "purple"), (170, "pink"), (181, "red")]


def hue_name(h: float) -> str:
    for lim, name in HUE_NAMES:
        if h < lim:
            return name
    return "red"


def _components(mask: np.ndarray, min_area: int = 12):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    comps = [stats[i] for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= min_area]
    return comps, lab


def _tight(mask: np.ndarray) -> np.ndarray:
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return mask
    return mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def _analyze_text(roi_bgr: np.ndarray) -> dict | None:
    """Verify a candidate line region and measure its style. None if not text."""
    gray = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2HSV)
    V, S, Hh = hsv[:, :, 2], hsv[:, :, 1], hsv[:, :, 0]
    raw_bright = (V >= 175).astype(np.uint8)
    # letters are enclosed by their outline/shadow/box: keep bright components that
    # do not touch the region border (bright background bleeds to the border)
    rh, rw = raw_bright.shape
    n, lab, stats, _ = cv2.connectedComponentsWithStats(raw_bright, connectivity=8)
    keep = np.zeros(n, dtype=bool)
    min_area = max(8, int(rh * 0.25))
    for i in range(1, n):
        x, y, w_, h_, a = stats[i]
        touches = x <= 0 or y <= 0 or x + w_ >= rw or y + h_ >= rh
        if not touches and a >= min_area and h_ >= 0.2 * rh:
            keep[i] = True
    bright = keep[lab].astype(np.uint8)
    frac = float(bright.mean())
    if not (0.04 <= frac <= 0.7):
        return None
    comps, _ = _components(bright, min_area=min_area)
    if len(comps) < 2:
        return None
    heights = np.array([c[cv2.CC_STAT_HEIGHT] for c in comps], dtype=np.float32)
    widths = np.array([c[cv2.CC_STAT_WIDTH] for c in comps], dtype=np.float32)
    tops = np.array([c[cv2.CC_STAT_TOP] for c in comps], dtype=np.float32)
    text_h = float(np.median(heights))
    if text_h < 5:
        return None
    asp = widths / np.maximum(1.0, heights)
    if not (0.12 <= float(np.median(asp)) <= 1.8):
        return None
    k3 = np.ones((3, 3), np.uint8)
    ring1 = cv2.dilate(bright, k3, iterations=2) & (1 - bright)
    if ring1.sum() < 10:
        return None
    ring_dark = float(gray[ring1 > 0].mean())
    non_bright = gray[bright == 0]
    boxed = bool(non_bright.size and np.median(non_bright) < 45 and non_bright.std() < 30)
    if ring_dark > 95 and not boxed:
        return None
    # stroke width via distance transform of the fill
    dt = cv2.distanceTransform(bright, cv2.DIST_L2, 3)
    stroke = float(2.0 * np.percentile(dt[bright > 0], 90)) if bright.any() else 0.0
    # outline thickness: consecutive dark rings
    outline = 0
    prev = bright.copy()
    for r in range(1, 9):
        dil = cv2.dilate(bright, k3, iterations=r)
        ring = dil & (1 - prev)
        prev = dil
        if ring.sum() == 0:
            break
        if float(gray[ring > 0].mean()) < 70:
            outline = r
        else:
            break
    # drop shadow: compare darkness of offset regions
    d = max(2, outline + 2)
    halo = cv2.dilate(bright, k3, iterations=max(1, outline))
    h, w = bright.shape
    dr = np.zeros_like(bright)
    dr[d:, d:] = bright[:-d, :-d]
    ul = np.zeros_like(bright)
    ul[:-d, :-d] = bright[d:, d:]
    dr_reg, ul_reg = (dr & (1 - halo)) > 0, (ul & (1 - halo)) > 0
    shadow = None
    if dr_reg.sum() > 10 and ul_reg.sum() > 10:
        a, b = float(gray[dr_reg].mean()), float(gray[ul_reg].mean())
        if b - a > 25:
            shadow = "down-right"
        elif a - b > 25:
            shadow = "up-left"
    # fill colours / highlight
    fill = bright > 0
    s_fill, h_fill = S[fill], Hh[fill]
    px = roi_bgr[fill]
    white = s_fill < 60
    white_share = float(white.mean()) if white.size else 0.0
    colored_h = h_fill[~white]
    colored_px = px[~white]
    # white base text with a coloured highlight word is the common pattern, so white
    # stays the base colour even when a long highlighted word outweighs it
    main_color, main_hex = ("white", bgr_to_hex(np.median(px[white], axis=0))) if white_share >= 0.25 else \
        (hue_name(float(np.median(colored_h))) if colored_h.size else "white",
         bgr_to_hex(np.median(colored_px, axis=0)) if colored_px.size else "#FFFFFF")
    highlight = None
    hl_cx = None
    if 0.08 <= (1 - white_share) <= 0.92 and colored_h.size > 30:
        highlight = {"color": hue_name(float(np.median(colored_h))), "hex": bgr_to_hex(np.median(colored_px, axis=0)),
                     "share": round(1 - white_share, 3)}
        ys, xs = np.nonzero(fill)
        cx = xs[~white]
        hl_cx = float(cx.mean() / w) if cx.size else None
    # case: tops of letters align for ALL CAPS
    big = heights >= 0.6 * text_h
    caps_spread = float(np.std(tops[big]) / text_h) if big.sum() >= 3 else None
    # words: column gaps in the fill
    cols = fill.any(axis=0)
    gaps, run = [], 0
    started = False
    for c in cols:
        if c:
            if started and run:
                gaps.append(run)
            run, started = 0, True
        else:
            run += 1
    word_gaps = sum(1 for g in gaps if g > 0.3 * text_h)
    rows = fill.any(axis=1)
    lines, inrun = 0, False
    gap = 0
    for r in rows:
        if r and not inrun:
            if lines == 0 or gap > 0.12 * text_h:
                lines += 1
            inrun = True
            gap = 0
        elif not r:
            inrun = False
            gap += 1
    return {
        "text_h_px": text_h, "stroke_px": stroke, "stroke_ratio": stroke / text_h,
        "char_aspect": float(np.median(asp)), "components": len(comps),
        "fill_color": main_color, "fill_hex": main_hex, "white_share": round(white_share, 3),
        "highlight": highlight, "highlight_cx": hl_cx,
        "outline_px": outline, "ring_dark": ring_dark, "boxed": boxed, "shadow": shadow,
        "caps_spread": caps_spread, "words": word_gaps + 1, "lines": max(1, lines),
        "signature": cv2.resize(bright * 255, (48, 12), interpolation=cv2.INTER_AREA),
        "mask": _tight(bright),
    }


def detect_frame(bgr: np.ndarray) -> list[dict]:
    H, W = bgr.shape[:2]
    # Caption text = bright fill touching genuinely dark pixels (outline, shadow
    # or a dark box). "Dark" uses the max channel so saturated blue is not dark.
    V = bgr.max(axis=2)
    bright = (V >= 175).astype(np.uint8)
    # drop 1-2 px bright structures (grid lines, stars, thin texture); letter strokes survive
    bright = cv2.morphologyEx(bright, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    dark = (V < 70).astype(np.uint8)
    near_dark = cv2.dilate(dark, np.ones((3, 3), np.uint8), iterations=2)
    edge_text = bright & near_dark
    kx = max(5, int(W * 0.035))
    closed = cv2.morphologyEx(edge_text, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (kx, 3)))
    closed = cv2.dilate(closed, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
    closed = cv2.morphologyEx(closed, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w < 0.08 * W or h < 0.014 * H or h > 0.2 * H or w / max(1, h) < 1.3:
            continue
        cx = (x + w / 2) / W
        if abs(cx - 0.5) > 0.2:
            continue
        pad = 3
        x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
        feat = _analyze_text(bgr[y0:y1, x0:x1])
        if feat is None:
            continue
        feat.update({"x": x / W, "y": y / H, "w": w / W, "h": h / H, "cx": cx, "cy": (y + h / 2) / H,
                     "text_h": feat["text_h_px"] / H, "outline_frac": feat["outline_px"] / W,
                     "stroke_frac": feat["stroke_px"] / W})
        out.append(feat)
    return out


def _same_track(a: dict, b: dict) -> bool:
    return abs(a["cy"] - b["cy"]) < 0.045 and abs(a["cx"] - b["cx"]) < 0.15 and \
        0.6 < (a["text_h"] / max(1e-6, b["text_h"])) < 1.65


def _sig_corr(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32).ravel() - a.mean()
    b = b.astype(np.float32).ravel() - b.mean()
    d = float(np.linalg.norm(a) * np.linalg.norm(b))
    return float(a @ b / d) if d > 0 else 0.0


def analyze(path: str, info: dict, cfg: dict) -> dict:
    v = info["video"]
    cw = int(cfg.get("caption_width", 540))
    w, h = ffmpeg.scaled_size(v["display_width"], v["display_height"], cw)
    sfps = float(cfg.get("caption_sample_fps", 10))
    frames = []
    with ffmpeg.FrameReader(path, w, h, fps=sfps) as reader:
        for i, fr in enumerate(reader):
            frames.append((i / sfps, detect_frame(fr)))
    return summarize(frames, sfps, info["duration"])


def summarize(frames: list[tuple[float, list[dict]]], sfps: float, duration: float) -> dict:
    tracks: list[dict] = []   # {"items": [(t, det)], "last_t"}
    for t, dets in frames:
        for d in dets:
            match = None
            for tr in tracks:
                if t - tr["last_t"] <= 1.5 / sfps + 1e-6 and _same_track(tr["items"][-1][1], d):
                    match = tr
                    break
            if match is None:
                match = {"items": [], "last_t": t}
                tracks.append(match)
            match["items"].append((t, d))
            match["last_t"] = t
    # split tracks into text segments
    segments = []
    overlays = []
    for tr in tracks:
        items = tr["items"]
        if len(items) < 2:
            continue
        seg = [items[0]]
        segs = []
        for prev, cur in zip(items, items[1:]):
            pd, cd = prev[1], cur[1]
            gap = cur[0] - prev[0] > 1.5 / sfps
            changed = gap or abs(cd["w"] - pd["w"]) / max(1e-6, pd["w"]) > 0.12 or \
                _sig_corr(cd["signature"], pd["signature"]) < 0.55
            if changed:
                segs.append(seg)
                seg = [cur]
            else:
                seg.append(cur)
        segs.append(seg)
        segs = [s for s in segs if len(s) >= 2]
        persistent = len(segs) <= 2 and (items[-1][0] - items[0][0]) > 4.0
        for s in segs:
            entry = _segment_stats(s, sfps)
            (overlays if persistent else segments).append(entry)
    segments.sort(key=lambda s: s["start"])
    _detect_reveals(segments)
    return _aggregate(segments, overlays, frames, duration, sfps)


def _segment_stats(seg: list[tuple[float, dict]], sfps: float) -> dict:
    dets = [d for _, d in seg]
    med = lambda k: float(np.median([d[k] for d in dets if d.get(k) is not None])) if any(d.get(k) is not None for d in dets) else None
    first, rest = dets[0], dets[1:] or dets
    anim = []
    h_rest = float(np.median([d["text_h"] for d in rest]))
    if first["text_h"] < 0.85 * h_rest:
        anim.append("scale_in")
    elif first["text_h"] > 1.12 * h_rest:
        anim.append("scale_down_in")
    if abs(first["cy"] - float(np.median([d["cy"] for d in rest]))) > 0.02:
        anim.append("slide_in")
    if first["ring_dark"] > 1.25 * float(np.median([d["ring_dark"] for d in rest])) + 5:
        anim.append("fade_in")
    hl = [d["highlight_cx"] for d in dets if d.get("highlight_cx") is not None]
    moving_hl = len(hl) >= 3 and (max(hl) - min(hl)) > 0.15
    colors = [d["fill_color"] for d in dets]
    hcolors = [d["highlight"]["color"] for d in dets if d.get("highlight")]
    return {
        "start": round(seg[0][0], 3), "end": round(seg[-1][0] + 1 / sfps, 3),
        "duration": round(seg[-1][0] - seg[0][0] + 1 / sfps, 3),
        "cy": med("cy"), "cx": med("cx"), "text_h": med("text_h"), "w": med("w"),
        "words_est": int(round(med("words"))), "lines": int(round(med("lines"))),
        "fill_color": max(set(colors), key=colors.count),
        "fill_hex": dets[len(dets) // 2]["fill_hex"],
        "highlight_color": max(set(hcolors), key=hcolors.count) if hcolors else None,
        "highlight_hex": next((d["highlight"]["hex"] for d in dets if d.get("highlight")), None),
        "highlight_share": round(len(hcolors) / len(dets), 3),
        "moving_highlight": moving_hl,
        "outline_frac": med("outline_frac"), "outline_px": med("outline_px"),
        "shadow": max(set([d["shadow"] for d in dets]), key=[d["shadow"] for d in dets].count),
        "boxed": float(np.mean([d["boxed"] for d in dets])) > 0.5,
        "caps_spread": med("caps_spread"), "stroke_ratio": med("stroke_ratio"),
        "char_aspect": med("char_aspect"), "animation": anim,
        "first_sig": seg[0][1]["signature"],
        "first_mask": seg[0][1]["mask"], "last_mask": seg[-1][1]["mask"],
        "x_left": float(np.median([d["x"] for d in dets])),
    }


def _prefix_match(prev: np.ndarray, new: np.ndarray) -> float:
    """Correlation between the previous text and the left part of the new text."""
    ph, pw = prev.shape
    nh, nw = new.shape
    if nw <= pw * 1.08 or abs(nh - ph) > 0.35 * max(ph, nh):
        return 0.0
    left = new[:, :int(round(pw * nh / max(1, ph)))]
    a = cv2.resize(prev.astype(np.float32), (64, 16), interpolation=cv2.INTER_AREA)
    b = cv2.resize(left.astype(np.float32), (64, 16), interpolation=cv2.INTER_AREA)
    a, b = a - a.mean(), b - b.mean()
    d = float(np.linalg.norm(a) * np.linalg.norm(b))
    return float((a * b).sum() / d) if d > 0 else 0.0


def _detect_reveals(segments: list[dict]) -> None:
    """Consecutive segments where the new text starts with the old text = word-by-word reveal."""
    for a, b in zip(segments, segments[1:]):
        if b["start"] - a["end"] > 0.15 or abs(a["cy"] - b["cy"]) > 0.02:
            continue
        if _prefix_match(a["last_mask"], b["first_mask"]) > 0.75:
            a.setdefault("animation", []).append("word_reveal_next")
            b.setdefault("animation", []).append("word_reveal")


def _zone(y: float) -> str:
    if y < 0.33:
        return "upper_third"
    if y < 0.58:
        return "center"
    if y < 0.76:
        return "lower_middle"
    return "bottom"


def _weight(r: float | None) -> str | None:
    if r is None:
        return None
    if r >= 0.19:
        return "heavy/black"
    if r >= 0.13:
        return "bold"
    return "regular/medium"


def _width(a: float | None) -> str | None:
    if a is None:
        return None
    if a < 0.5:
        return "condensed"
    if a > 0.72:
        return "wide"
    return "normal"


def _aggregate(segments: list[dict], overlays: list[dict], frames, duration: float, sfps: float) -> dict:
    n_frames = len(frames)
    covered = 0
    for s in segments:
        covered += s["duration"]
    drop = ("first_sig", "first_mask", "last_mask")
    res: dict = {"segments": [{k: v for k, v in s.items() if k not in drop} for s in segments],
                 "overlay_texts": [{k: v for k, v in s.items() if k not in drop} for s in overlays],
                 "sample_fps": sfps, "frames_sampled": n_frames}
    if not segments:
        res.update({"present": False, "coverage": 0.0})
        return res
    arr = lambda k: [s[k] for s in segments if s.get(k) is not None]
    med = lambda k: round(float(np.median(arr(k))), 4) if arr(k) else None
    mode = lambda k: max(set(arr(k)), key=arr(k).count) if arr(k) else None
    anims = [a for s in segments for a in s["animation"]]

    def hex_for(name_key: str, hex_key: str) -> str | None:
        """Median RGB of the segments whose colour name is the dominant one."""
        name = mode(name_key)
        hexes = [s[hex_key] for s in segments if s.get(name_key) == name and s.get(hex_key)]
        if not hexes:
            return None
        rgb = np.median([[int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)] for h in hexes], axis=0)
        return "#" + "".join(f"{int(round(c)):02X}" for c in rgb)

    zones = [_zone(s["cy"]) for s in segments]
    caps_vals = arr("caps_spread")
    res.update({
        "present": True,
        "coverage": round(min(1.0, covered / max(1e-6, duration)), 3),
        "count": len(segments),
        "per_minute": round(len(segments) / max(1e-6, duration) * 60, 1),
        "duration_median": med("duration"),
        "words_per_caption_visual": med("words_est"),
        "lines_median": med("lines"),
        "position_y": med("cy"),
        "position_zone": max(set(zones), key=zones.count),
        "zone_distribution": {z: round(zones.count(z) / len(zones), 3) for z in set(zones)},
        "text_height_frac": med("text_h"),
        "fill_color": mode("fill_color"),
        "fill_hex": hex_for("fill_color", "fill_hex"),
        "highlight_share": round(float(np.mean([s["highlight_share"] > 0.3 for s in segments])), 3),
        "highlight_color": mode("highlight_color"),
        "highlight_hex": hex_for("highlight_color", "highlight_hex"),
        "moving_highlight_share": round(float(np.mean([s["moving_highlight"] for s in segments])), 3),
        "outline_share": round(float(np.mean([(s["outline_px"] or 0) >= 1 for s in segments])), 3),
        "outline_frac_of_width": med("outline_frac"),
        "shadow": mode("shadow"),
        "boxed_share": round(float(np.mean([s["boxed"] for s in segments])), 3),
        "caps_likely_share": round(float(np.mean([c < 0.08 for c in caps_vals])), 3) if caps_vals else None,
        "stroke_ratio": med("stroke_ratio"),
        "weight_class": _weight(med("stroke_ratio")),
        "char_aspect": med("char_aspect"),
        "width_class": _width(med("char_aspect")),
        "animation_distribution": {a: round(anims.count(a) / len(segments), 3) for a in set(anims)},
    })
    return res


def attach_spoken_words(caps: dict, words: list[dict]) -> None:
    """Count transcript words whose midpoint falls inside each caption segment."""
    if not caps.get("present") or not words:
        return
    counts = []
    for s in caps["segments"]:
        n = sum(1 for w in words if s["start"] <= (w["start"] + w["end"]) / 2 < s["end"])
        s["words_spoken"] = n
        if n:
            counts.append(n)
    if counts:
        caps["words_per_caption_spoken"] = float(np.median(counts))
        caps["words_per_caption_p80"] = float(np.percentile(counts, 80))
        caps["caption_word_sync"] = round(len(counts) / max(1, len(caps["segments"])), 3)
