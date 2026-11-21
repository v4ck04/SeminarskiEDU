"""Single decode pass over a reference video.

For every frame (at <= max_analysis_fps, analysis_width wide) we record:
  * HSV histogram distance and mean absolute difference to the previous frame
  * luminance mean/std and Laplacian sharpness
  * global motion between consecutive frames (pyramidal Lucas-Kanade on
    corner features + RANSAC similarity transform): scale, rotation,
    translation, inlier ratio and motion-compensated residual
  * a tiny grayscale thumbnail (for dissolve detection)
and, at ~color_sample_fps, colour / composition statistics.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import cv2
import numpy as np

from .. import faces, ffmpeg, log
from ..utils import say

_log = log.get("analysis.scan")

THUMB_W, THUMB_H = 68, 120


@dataclass
class ScanResult:
    fps: float
    width: int
    height: int
    n: int = 0
    times: list = field(default_factory=list)
    hist_dist: list = field(default_factory=list)      # vs previous frame, [0] = 0
    mad: list = field(default_factory=list)            # mean abs diff (0..1)
    luma: list = field(default_factory=list)
    luma_std: list = field(default_factory=list)
    sharp: list = field(default_factory=list)
    motion: list = field(default_factory=list)         # dicts per frame pair (index i: i-1 -> i)
    thumbs: list = field(default_factory=list)          # uint8 THUMB_H x THUMB_W
    color_samples: list = field(default_factory=list)   # dicts
    palette_pixels: list = field(default_factory=list)  # small Lab arrays

    def arr(self, name: str) -> np.ndarray:
        return np.asarray(getattr(self, name), dtype=np.float64)


def _hist(hsv: np.ndarray) -> np.ndarray:
    h = cv2.calcHist([hsv], [0, 1, 2], None, [16, 4, 4], [0, 180, 0, 256, 0, 256]).flatten()
    s = h.sum()
    return h / s if s > 0 else h


def _global_motion(prev: np.ndarray, cur: np.ndarray) -> dict:
    """Similarity transform prev->cur on small grayscale frames."""
    out = {"ok": False, "scale": 1.0, "rot": 0.0, "tx": 0.0, "ty": 0.0, "inliers": 0.0,
           "points": 0, "residual": None}
    pts = cv2.goodFeaturesToTrack(prev, maxCorners=220, qualityLevel=0.01, minDistance=7, blockSize=7)
    if pts is None or len(pts) < 12:
        return out
    nxt, st, _err = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, winSize=(21, 21), maxLevel=3,
                                            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 20, 0.03))
    if nxt is None:
        return out
    good = st.reshape(-1) == 1
    p0, p1 = pts.reshape(-1, 2)[good], nxt.reshape(-1, 2)[good]
    out["points"] = int(len(p0))
    if len(p0) < 10:
        return out
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.5,
                                         maxIters=500, confidence=0.98)
    if M is None:
        return out
    a, b = M[0, 0], M[1, 0]
    h, w = prev.shape
    # express translation about the frame centre so pure zoom gives ~0 translation
    cx, cy = w / 2.0, h / 2.0
    tx = M[0, 0] * cx + M[0, 1] * cy + M[0, 2] - cx
    ty = M[1, 0] * cx + M[1, 1] * cy + M[1, 2] - cy
    out.update(ok=True, scale=float(math.hypot(a, b)), rot=float(math.degrees(math.atan2(b, a))),
               tx=float(tx / w), ty=float(ty / h),
               inliers=float(inl.mean()) if inl is not None and len(inl) else 0.0)
    warped = cv2.warpAffine(prev, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    m = int(w * 0.12), int(h * 0.12)
    out["residual"] = float(np.mean(cv2.absdiff(warped[m[1]:-m[1], m[0]:-m[0]], cur[m[1]:-m[1], m[0]:-m[0]])) / 255.0)
    return out


def _colorfulness(bgr: np.ndarray) -> float:
    b, g, r = [c.astype(np.float32) for c in cv2.split(bgr)]
    rg = r - g
    yb = 0.5 * (r + g) - b
    return float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))


def _bar_rows(gray: np.ndarray, from_top: bool) -> int:
    rows = gray if from_top else gray[::-1]
    means = rows.mean(axis=1)
    stds = rows.std(axis=1)
    n = 0
    for mu, sd in zip(means, stds):
        if mu < 14 and sd < 6:
            n += 1
        else:
            break
    return n


def color_sample(bgr: np.ndarray, gray: np.ndarray, t: float) -> tuple[dict, np.ndarray]:
    h, w = gray.shape
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    L = lab[:, :, 0].astype(np.float32) / 255.0
    A = lab[:, :, 1].astype(np.float32) - 128
    B = lab[:, :, 2].astype(np.float32) - 128
    shadows, highs = L < 0.35, L > 0.65
    c = {
        "t": round(t, 3),
        "L_mean": float(L.mean()), "L_std": float(L.std()),
        "a_mean": float(A.mean()), "b_mean": float(B.mean()),
        "b_shadows": float(B[shadows].mean()) if shadows.any() else None,
        "b_highlights": float(B[highs].mean()) if highs.any() else None,
        "sat_mean": float(hsv[:, :, 1].mean() / 255.0),
        "colorfulness": _colorfulness(bgr),
        "black_clip": float((gray < 10).mean()), "white_clip": float((gray > 245).mean()),
    }
    # vignette: corners vs centre
    cw, ch = int(w * 0.18), int(h * 0.12)
    corners = np.concatenate([L[:ch, :cw].ravel(), L[:ch, -cw:].ravel(), L[-ch:, :cw].ravel(), L[-ch:, -cw:].ravel()])
    centre = L[int(h * 0.3):int(h * 0.7), int(w * 0.25):int(w * 0.75)]
    c["corner_center_ratio"] = float(corners.mean() / max(1e-3, centre.mean()))
    # letterbox bars
    top, bot = _bar_rows(gray, True), _bar_rows(gray, False)
    c["bar_top"], c["bar_bottom"] = top / h, bot / h
    # sharpness bands (blurred-background fill detection)
    lap = cv2.Laplacian(gray, cv2.CV_32F)
    b1, b2 = int(h * 0.22), int(h * 0.78)
    c["sharp_top"] = float(lap[top:b1].var()) if b1 > top + 2 else 0.0
    c["sharp_mid"] = float(lap[b1:b2].var())
    c["sharp_bottom"] = float(lap[b2:h - bot].var()) if h - bot > b2 + 2 else 0.0
    # edge centre of mass (composition)
    edges = cv2.Canny(gray, 80, 160)
    ys, xs = np.nonzero(edges)
    if len(xs) > 50:
        c["edge_cx"], c["edge_cy"] = float(xs.mean() / w), float(ys.mean() / h)
        c["edge_density"] = float(len(xs) / edges.size)
    else:
        c["edge_cx"] = c["edge_cy"] = None
        c["edge_density"] = float(len(xs) / edges.size)
    found = faces.detect(bgr)
    c["faces"] = None if found is None else [[x, y, fw, fh] for (x, y, fw, fh, _s) in found if fw >= 0.06]
    small = cv2.resize(lab, (24, 42), interpolation=cv2.INTER_AREA).reshape(-1, 3)
    return c, small


def scan(path: str, info: dict, cfg: dict) -> ScanResult:
    v = info["video"]
    aw = int(cfg.get("analysis_width", 270))
    w, h = ffmpeg.scaled_size(v["display_width"], v["display_height"], aw)
    fps = min(float(v["fps"] or 30.0), float(cfg.get("max_analysis_fps", 30)))
    if fps <= 0:
        fps = 30.0
    res = ScanResult(fps=fps, width=w, height=h)
    color_every = max(1, int(round(fps / float(cfg.get("color_sample_fps", 2)))))
    mw, mh = int(w * 2 / 3) // 2 * 2, int(h * 2 / 3) // 2 * 2

    reader = ffmpeg.FrameReader(path, w, h, fps=fps)
    prev_hist = prev_gray = prev_small = None
    expected = int(info["duration"] * fps) or 1
    i = 0
    for frame in reader:
        t = i / fps
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist = _hist(hsv)
        small = cv2.resize(gray, (mw, mh), interpolation=cv2.INTER_AREA)
        res.times.append(t)
        res.luma.append(float(gray.mean() / 255.0))
        res.luma_std.append(float(gray.std() / 255.0))
        res.sharp.append(float(cv2.Laplacian(small, cv2.CV_32F).var()))
        res.thumbs.append(cv2.resize(gray, (THUMB_W, THUMB_H), interpolation=cv2.INTER_AREA))
        if prev_hist is None:
            res.hist_dist.append(0.0)
            res.mad.append(0.0)
            res.motion.append(None)
        else:
            res.hist_dist.append(float(0.5 * np.abs(hist - prev_hist).sum()))
            res.mad.append(float(np.mean(cv2.absdiff(gray, prev_gray)) / 255.0))
            res.motion.append(_global_motion(prev_small, small))
        if i % color_every == 0:
            cs, pal = color_sample(frame, gray, t)
            res.color_samples.append(cs)
            res.palette_pixels.append(pal)
        prev_hist, prev_gray, prev_small = hist, gray, small
        i += 1
        if i % 300 == 0:
            say(f"scanned {i}/{expected} frames ({100 * i / expected:.0f}%)")
    res.n = i
    if i == 0:
        raise RuntimeError(f"No frames decoded from {path}: {reader.errors()[-300:]}")
    return res
