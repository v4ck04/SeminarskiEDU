"""Colour grading and visual composition summaries from scan samples."""
from __future__ import annotations

import cv2
import numpy as np

from ..utils import bgr_to_hex
from .scan import ScanResult


def _med(vals) -> float | None:
    v = [x for x in vals if x is not None]
    return round(float(np.median(v)), 4) if v else None


def palette(scan: ScanResult, k: int = 5) -> list[dict]:
    if not scan.palette_pixels:
        return []
    px = np.concatenate(scan.palette_pixels).astype(np.float32)
    k = min(k, len(px))
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _c, labels, centers = cv2.kmeans(px, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=k)
    out = []
    for idx in np.argsort(-counts):
        lab = centers[idx].reshape(1, 1, 3).astype(np.uint8)
        bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)[0, 0]
        out.append({"hex": bgr_to_hex(bgr), "share": round(float(counts[idx] / counts.sum()), 3)})
    return out


def summarize(scan: ScanResult, shots: list[dict]) -> dict:
    cs = scan.color_samples
    if not cs:
        return {}
    L = [c["L_mean"] for c in cs]
    grade = {
        "brightness_L": _med(L),
        "contrast_L_std": _med(c["L_std"] for c in cs),
        "saturation": _med(c["sat_mean"] for c in cs),
        "colorfulness": _med(c["colorfulness"] for c in cs),
        "warmth_b": _med(c["b_mean"] for c in cs),
        "tint_a": _med(c["a_mean"] for c in cs),
        "b_shadows": _med(c["b_shadows"] for c in cs),
        "b_highlights": _med(c["b_highlights"] for c in cs),
        "black_clip": _med(c["black_clip"] for c in cs),
        "white_clip": _med(c["white_clip"] for c in cs),
        "corner_center_ratio": _med(c["corner_center_ratio"] for c in cs),
    }
    temp = "neutral"
    if grade["warmth_b"] is not None:
        if grade["warmth_b"] > 6:
            temp = "warm"
        elif grade["warmth_b"] < -4:
            temp = "cool"
    grade["temperature"] = temp
    bs, bh = grade["b_shadows"], grade["b_highlights"]
    grade["teal_orange"] = bool(bs is not None and bh is not None and bs < -3 and bh > 5)
    vig = [c["corner_center_ratio"] < 0.72 for c in cs]
    grade["vignette_share"] = round(float(np.mean(vig)), 3)
    grade["vignette_likely"] = grade["vignette_share"] > 0.6

    # per-shot consistency
    shot_L, shot_S = [], []
    for sh in shots:
        sel = [c for c in cs if sh["start"] <= c["t"] < sh["end"]]
        if sel:
            shot_L.append(np.mean([c["L_mean"] for c in sel]))
            shot_S.append(np.mean([c["sat_mean"] for c in sel]))
    grade["shot_brightness_std"] = round(float(np.std(shot_L)), 4) if len(shot_L) > 1 else None
    grade["shot_saturation_std"] = round(float(np.std(shot_S)), 4) if len(shot_S) > 1 else None

    # composition / layout
    layouts = []
    for c in cs:
        if c["bar_top"] > 0.03 and c["bar_bottom"] > 0.03:
            layouts.append("letterboxed")
        elif c["sharp_mid"] > 20 and c["sharp_top"] < 0.2 * c["sharp_mid"] and c["sharp_bottom"] < 0.2 * c["sharp_mid"]:
            layouts.append("blurred_fill")
        else:
            layouts.append("full_bleed")
    lay_dist = {k: round(layouts.count(k) / len(layouts), 3) for k in set(layouts)}
    face_known = [c for c in cs if c.get("faces") is not None]
    faces = [c for c in face_known if c["faces"]]
    face_y = [f[1] + f[3] / 2 for c in faces for f in c["faces"]]
    face_size = [f[2] for c in faces for f in c["faces"]]
    comp = {
        "layout_distribution": lay_dist,
        "dominant_layout": max(lay_dist, key=lay_dist.get),
        "edge_center_x": _med(c["edge_cx"] for c in cs),
        "edge_center_y": _med(c["edge_cy"] for c in cs),
        "edge_density": _med(c["edge_density"] for c in cs),
        "face_frame_share": round(len(faces) / len(face_known), 3) if face_known else None,
        "face_center_y": _med(face_y),
        "face_width": _med(face_size),
        "bar_top": _med(c["bar_top"] for c in cs),
        "bar_bottom": _med(c["bar_bottom"] for c in cs),
    }
    return {"grade": grade, "composition": comp, "palette": palette(scan), "samples": len(cs)}
