"""Per-shot camera movement classification from the scan's global motion."""
from __future__ import annotations

import math

import numpy as np

from .scan import ScanResult

ZOOM_THR = 0.015   # log-scale per second (1.5 %/s)
PAN_THR = 0.02     # frame widths per second


def classify_shots(scan: ScanResult, shots: list[dict], transitions: list[dict]) -> list[dict]:
    fps = scan.fps
    # frames inside transition windows are excluded from motion statistics
    excl = np.zeros(scan.n, dtype=bool)
    for tr in transitions:
        f = int(tr.get("frame", 0))
        half = int(math.ceil(tr.get("duration", 0) * fps / 2)) + 1
        excl[max(0, f - half): min(scan.n, f + half + 1)] = True
    mad = scan.arr("mad")
    out = []
    for sh in shots:
        i0 = int(round(sh["start"] * fps)) + 1
        i1 = int(round(sh["end"] * fps)) - 1
        recs = [scan.motion[i] for i in range(i0 + 1, min(i1 + 1, scan.n)) if not excl[i] and scan.motion[i]]
        good = [m for m in recs if m.get("ok") and m["inliers"] > 0.35]
        res = {"shot": sh["index"], "start": sh["start"], "end": sh["end"], "type": "unknown",
               "confidence": 0.2, "evidence": "opencv:optical-flow"}
        if len(recs) < 3 or len(good) < max(3, 0.4 * len(recs)):
            res["note"] = "too few trackable features (flat graphics or very short shot)"
            # duplicate-frame shots with near-zero difference are static
            seg = mad[max(1, i0): max(2, i1)]
            if len(seg) >= 3 and float(np.median(seg)) < 0.002:
                res.update(type="static", confidence=0.5, evidence="opencv:frame-diff")
            out.append(res)
            continue
        log_s = np.array([math.log(max(1e-6, m["scale"])) for m in good])
        tx = np.array([m["tx"] for m in good])
        ty = np.array([m["ty"] for m in good])
        rot = np.array([m["rot"] for m in good])
        residual = np.array([m["residual"] for m in good if m.get("residual") is not None])
        dur = len(good) / fps
        zoom_rate = float(log_s.sum() / dur)
        # content moving left (tx<0) means the camera pans right
        pan_x = float(-tx.sum() / dur)
        pan_y = float(-ty.sum() / dur)
        k = 5
        if len(tx) > k:
            sm = np.convolve(tx, np.ones(k) / k, mode="same")
            smy = np.convolve(ty, np.ones(k) / k, mode="same")
            jitter = float(np.sqrt(np.mean((tx - sm) ** 2 + (ty - smy) ** 2)))
        else:
            jitter = 0.0
        zn, pn = abs(zoom_rate) / ZOOM_THR, max(abs(pan_x), abs(pan_y)) / PAN_THR
        if zn < 1 and pn < 1:
            mtype = "static"
        elif zn >= pn:
            mtype = "zoom_in" if zoom_rate > 0 else "zoom_out"
        elif abs(pan_x) >= abs(pan_y):
            mtype = "pan_right" if pan_x > 0 else "pan_left"
        else:
            mtype = "pan_down" if pan_y > 0 else "pan_up"
        shake = jitter > 0.004
        inl = float(np.median([m["inliers"] for m in good]))
        conf = min(0.9, 0.35 + 0.5 * inl + (0.1 if max(zn, pn) > 2 or mtype == "static" else 0.0))
        med_res = float(np.median(residual)) if len(residual) else None
        still = bool(med_res is not None and med_res < 0.012 and mtype != "static")
        seg = mad[max(1, i0): max(2, i1)]
        dup_ratio = float(np.mean(seg < 0.0015)) if len(seg) else 0.0
        res.update({
            "type": mtype, "confidence": round(conf, 2),
            "zoom_rate_per_s": round(zoom_rate, 4), "total_zoom": round(math.exp(log_s.sum()), 4),
            "pan_x_per_s": round(pan_x, 4), "pan_y_per_s": round(pan_y, 4),
            "rotation_deg_total": round(float(rot.sum()), 3),
            "jitter": round(jitter, 5), "shake": shake,
            "inlier_ratio": round(inl, 3), "residual": None if med_res is None else round(med_res, 4),
            "animated_still": still, "duplicate_frame_ratio": round(dup_ratio, 3),
        })
        # speed change hints (low confidence by nature)
        mags = np.abs(log_s) * 5 + np.abs(tx) + np.abs(ty)
        hints = []
        if len(mags) >= int(fps * 1.2):
            h1, h2 = float(np.mean(mags[: len(mags) // 2])), float(np.mean(mags[len(mags) // 2:]))
            if min(h1, h2) > 0.002 and max(h1, h2) / max(1e-6, min(h1, h2)) > 3.0:
                hints.append("motion speed changes >3x within the shot (possible speed ramp)")
        if 0.3 <= dup_ratio <= 0.7 and mtype != "static":
            hints.append("regular repeated frames while moving (possible slow motion by frame repetition, "
                         "or lower-frame-rate source footage)")
        if hints:
            res["speed_hints"] = hints
        out.append(res)
    return out


def summarize(motions: list[dict]) -> dict:
    known = [m for m in motions if m["type"] != "unknown"]
    total = len(known)
    dist: dict[str, float] = {}
    for m in known:
        dist[m["type"]] = dist.get(m["type"], 0) + 1
    dist = {k: round(v / total, 3) for k, v in dist.items()} if total else {}
    moving = [m for m in known if m["type"] not in ("static",)]
    zoom_rates = [abs(m.get("zoom_rate_per_s", 0)) for m in known if m["type"].startswith("zoom")]
    return {
        "classified_shots": total,
        "unknown_shots": len(motions) - total,
        "distribution": dist,
        "moving_share": round(len(moving) / total, 3) if total else None,
        "median_zoom_rate_per_s": round(float(np.median(zoom_rates)), 4) if zoom_rates else None,
        "shake_share": round(sum(1 for m in known if m.get("shake")) / total, 3) if total else None,
        "animated_still_share": round(sum(1 for m in known if m.get("animated_still")) / total, 3) if total else None,
        "speed_hint_shots": [m["shot"] for m in known if m.get("speed_hints")],
    }
