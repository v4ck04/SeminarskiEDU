"""Shot boundary and transition detection.

* Hard cuts: combined histogram/pixel difference against an adaptive local
  baseline (robust to fast motion inside a shot).
* Dip-to-black / fades: runs of near-black frames with ramps around them.
* Flash transitions: short near-white runs or luminance spikes.
* Dissolves: a middle frame that is (almost) the average of the frames on
  either side while those frames are stable - a pure blend test.
* Whip / zoom transitions at cuts: strong motion blur or scale change in the
  frames around the cut (reported with low confidence).
"""
from __future__ import annotations

import numpy as np

from .scan import ScanResult


def _rolling_baseline(x: np.ndarray, k: int) -> np.ndarray:
    n = len(x)
    out = np.zeros(n)
    for i in range(n):
        lo, hi = max(0, i - k), min(n, i + k + 1)
        win = np.concatenate([x[lo:max(lo, i - 1)], x[min(hi, i + 2):hi]])
        out[i] = np.median(win) if len(win) else 0.0
    return out


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    runs, start = [], None
    for i, m in enumerate(mask):
        if m and start is None:
            start = i
        elif not m and start is not None:
            runs.append((start, i - 1))
            start = None
    if start is not None:
        runs.append((start, len(mask) - 1))
    return runs


def detect(scan: ScanResult) -> dict:
    fps, n = scan.fps, scan.n
    hd, mad = scan.arr("hist_dist"), scan.arr("mad")
    luma, lstd = scan.arr("luma"), scan.arr("luma_std")
    sharp = scan.arr("sharp")
    score = 0.55 * hd + 0.45 * np.clip(mad * 4.0, 0.0, 1.0)
    k = max(4, int(round(fps * 0.35)))
    base = _rolling_baseline(score, k)
    transitions: list[dict] = []
    blocked = np.zeros(n, dtype=bool)

    def ramp(idx: int, direction: int, increasing_away: bool) -> int:
        """Count frames of monotonic luminance ramp leading into a run."""
        cnt, j = 0, idx
        while 0 <= j + direction < n and cnt < int(fps):
            a, b = luma[j], luma[j + direction]
            if (b > a + 0.004) if increasing_away else (b < a - 0.004):
                cnt += 1
                j += direction
            else:
                break
        return cnt

    # --- black runs (fades / dips) -------------------------------------------------
    black = (luma < 0.04) & (lstd < 0.035)
    for s, e in _runs(black):
        pre = ramp(s, -1, True)   # luminance rises going backwards = fade-out before run
        post = ramp(e, +1, True)  # rises going forwards = fade-in after run
        t0, t1 = scan.times[s], scan.times[e] + 1 / fps
        if s == 0:
            ttype = "fade_in_from_black" if post >= 2 else "starts_on_black"
            transitions.append({"type": ttype, "time": round(t1, 3), "duration": round((e + 1 + post) / fps, 3),
                                "frame": e + 1, "confidence": 0.8, "evidence": "opencv:luminance"})
        elif e == n - 1:
            ttype = "fade_out_to_black" if pre >= 2 else "ends_on_black"
            transitions.append({"type": ttype, "time": round(t0, 3), "duration": round((n - s + pre) / fps, 3),
                                "frame": s, "confidence": 0.8, "evidence": "opencv:luminance"})
        else:
            ttype = "dip_black" if (pre >= 2 or post >= 2) else "cut_through_black"
            transitions.append({"type": ttype, "time": round((t0 + t1) / 2, 3),
                                "duration": round((e - s + 1 + pre + post) / fps, 3), "frame": (s + e) // 2,
                                "confidence": 0.8, "evidence": "opencv:luminance"})
        blocked[max(0, s - pre - 2): min(n, e + post + 3)] = True

    # --- white flashes ---------------------------------------------------------------
    white = (luma > 0.86) & (lstd < 0.09)
    for s, e in _runs(white):
        if e - s + 1 > fps * 0.4 or s == 0 or e == n - 1:
            continue
        transitions.append({"type": "flash", "time": round((scan.times[s] + scan.times[e]) / 2, 3),
                            "duration": round((e - s + 1) / fps, 3), "frame": (s + e) // 2,
                            "confidence": 0.75, "evidence": "opencv:luminance"})
        blocked[max(0, s - 3): min(n, e + 4)] = True
    # luminance spikes that are not fully white (overlay flash)
    for i in range(2, n - 2):
        if blocked[i]:
            continue
        nb = np.median([luma[i - 2], luma[i + 2]])
        if luma[i] - nb > 0.28 and luma[i] > 0.6 and luma[i - 1] < luma[i] and luma[i + 1] < luma[i]:
            transitions.append({"type": "flash", "time": round(scan.times[i], 3), "duration": round(2 / fps, 3),
                                "frame": i, "confidence": 0.5, "evidence": "opencv:luminance-spike"})
            blocked[max(0, i - 3): min(n, i + 4)] = True

    # --- hard cuts ----------------------------------------------------------------------
    cand = [i for i in range(1, n) if not blocked[i] and score[i] >= 0.2 and score[i] >= 3.0 * base[i] + 0.04]
    min_gap = max(2, int(round(fps * 0.12)))
    cuts: list[int] = []
    for i in sorted(cand, key=lambda j: -score[j]):
        if all(abs(i - c) >= min_gap for c in cuts):
            cuts.append(i)
    cuts.sort()
    med_sharp = float(np.median(sharp)) if n else 0.0
    for i in cuts:
        conf = float(min(0.95, 0.5 + (score[i] - 3.0 * base[i]) * 0.8))
        ttype, ev = "cut", "opencv:hist+pixel-diff"
        # whip / motion-blur transition: frames around the cut are much blurrier than usual
        around = sharp[max(0, i - 2): min(n, i + 2)]
        mot = [scan.motion[j] for j in range(max(1, i - 2), min(n, i + 3)) if j != i and scan.motion[j]]
        fast = [m for m in mot if m.get("ok") and (abs(m["tx"]) > 0.06 or abs(m["ty"]) > 0.06)]
        if med_sharp > 0 and len(around) and around.min() < 0.3 * med_sharp and (fast or around.mean() < 0.4 * med_sharp):
            ttype, ev, conf = "whip_or_blur", "opencv:sharpness-drop+motion", 0.4
        else:
            post = [scan.motion[j] for j in range(i + 1, min(n, i + 5)) if scan.motion[j] and scan.motion[j].get("ok")]
            if len(post) >= 3:
                sc = np.array([m["scale"] for m in post])
                if np.all(sc < 0.985) or np.all(sc > 1.015):
                    ttype, ev, conf = "zoom_transition", "opencv:optical-flow scale after cut", 0.4
        transitions.append({"type": ttype, "time": round(scan.times[i], 3), "duration": 0.0, "frame": i,
                            "confidence": round(conf, 2), "evidence": ev, "score": round(float(score[i]), 3)})
        blocked[max(0, i - 2): min(n, i + 3)] = True

    # --- dissolves ------------------------------------------------------------------------
    T = np.stack(scan.thumbs).astype(np.float32) / 255.0 if n else np.zeros((0, 1, 1))
    for N in sorted({max(4, int(round(fps * f))) for f in (0.27, 0.47, 0.73)}):
        half = N // 2
        best: list[tuple[float, int]] = []
        for c in range(half + 3, n - half - 3):
            if blocked[c - half: c + half + 1].any():
                continue
            a, b = T[c - half], T[c + half]
            D = float(np.mean(np.abs(a - b)))
            if D < 0.07:
                continue
            E = float(np.mean(np.abs(T[c] - 0.5 * (a + b)))) / D
            stab_a = float(np.mean(np.abs(a - T[c - half - 3]))) / D
            stab_b = float(np.mean(np.abs(b - T[c + half + 3]))) / D
            if E < 0.28 and stab_a < 0.45 and stab_b < 0.45:
                best.append((E, c))
        for E, c in sorted(best):
            if blocked[c - half: c + half + 1].any():
                continue
            transitions.append({"type": "dissolve", "time": round(scan.times[c], 3), "duration": round(N / fps, 3),
                                "frame": c, "confidence": round(float(min(0.85, 0.9 - E)), 2),
                                "evidence": "opencv:blend-test"})
            blocked[max(0, c - half - 2): min(n, c + half + 3)] = True

    transitions.sort(key=lambda d: d["time"])
    return {"transitions": transitions, "shots": _shots(transitions, scan)}


BOUNDARY_TYPES = {"cut", "whip_or_blur", "zoom_transition", "dissolve", "dip_black", "cut_through_black", "flash"}


def _shots(transitions: list[dict], scan: ScanResult) -> list[dict]:
    dur = scan.n / scan.fps
    bounds = [0.0]
    types = ["start"]
    for tr in transitions:
        if tr["type"] in BOUNDARY_TYPES:
            bounds.append(tr["time"])
            types.append(tr["type"])
        elif tr["type"] in ("fade_in_from_black", "starts_on_black"):
            types[0] = tr["type"]
    bounds.append(dur)
    shots = []
    for k in range(len(bounds) - 1):
        s, e = bounds[k], bounds[k + 1]
        if e - s <= 0:
            continue
        shots.append({"index": len(shots), "start": round(s, 3), "end": round(e, 3),
                      "duration": round(e - s, 3), "transition_in": types[k]})
    return shots


def cut_times(result: dict) -> list[float]:
    return [t["time"] for t in result["transitions"] if t["type"] in BOUNDARY_TYPES]
