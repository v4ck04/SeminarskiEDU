"""Audio analysis of reference videos.

Measures loudness (EBU R128), speech activity and pauses, the background
(music) bed level in speech pauses, sound-effect-like events and their
alignment with cuts, and the start/end envelope.

Speech segments come from transcription word timestamps when available
(reliable) and otherwise from an energy/spectral VAD (lower confidence).
Sound-effect classification is heuristic and always reported as such.
"""
from __future__ import annotations

import numpy as np

from .. import ffmpeg

SR = 32000
HOP = 320      # 10 ms
NFFT = 1024


def _stft_power(x: np.ndarray) -> np.ndarray:
    if len(x) < NFFT:
        x = np.pad(x, (0, NFFT - len(x)))
    n = 1 + (len(x) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    win = np.hanning(NFFT).astype(np.float32)
    frames = x[idx] * win
    spec = np.fft.rfft(frames, axis=1)
    # scale so that P.sum(axis=1) is the frame's mean-square level (dBFS: full-scale sine = -3 dB)
    scale = 2.0 / (NFFT * float(np.sum(win ** 2)))
    return (np.abs(spec) ** 2 * scale).astype(np.float32)


def _db(x: np.ndarray, floor: float = 1e-10) -> np.ndarray:
    return 10.0 * np.log10(np.maximum(x, floor))


def _band(P: np.ndarray, lo: float, hi: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(NFFT, 1.0 / SR)
    m = (freqs >= lo) & (freqs < hi)
    return P[:, m].sum(axis=1)


def _segments(mask: np.ndarray, hop_s: float, min_len: float, merge_gap: float) -> list[list[float]]:
    segs, start = [], None
    for i, m in enumerate(mask):
        if m and start is None:
            start = i
        elif not m and start is not None:
            segs.append([start * hop_s, i * hop_s])
            start = None
    if start is not None:
        segs.append([start * hop_s, len(mask) * hop_s])
    merged: list[list[float]] = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < merge_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= min_len]


def _otsu_1d(vals: np.ndarray) -> float:
    hist, edges = np.histogram(vals, bins=64)
    centers = (edges[:-1] + edges[1:]) / 2
    best, thr = -1.0, float(np.median(vals))
    total = hist.sum()
    for i in range(1, 64):
        w0, w1 = hist[:i].sum(), hist[i:].sum()
        if w0 == 0 or w1 == 0:
            continue
        m0 = (hist[:i] * centers[:i]).sum() / w0
        m1 = (hist[i:] * centers[i:]).sum() / w1
        var = w0 * w1 * (m0 - m1) ** 2 / total ** 2
        if var > best:
            best, thr = var, centers[i]
    return float(thr)


def analyze(path: str, info: dict, cut_times: list[float], words: list[dict] | None) -> dict:
    if not info.get("audio"):
        return {"present": False}
    x = ffmpeg.decode_audio(path, sr=SR, mono=True)
    if x.size < SR * 0.2:
        return {"present": False}
    res: dict = {"present": True, "duration": round(len(x) / SR, 3)}
    try:
        res["loudness"] = {k: v for k, v in ffmpeg.loudness(path).items() if k != "raw"}
    except Exception as e:  # pragma: no cover - reported, not fatal
        res["loudness"] = {"error": str(e)}
    peak = float(np.max(np.abs(x)))
    res["sample_peak_db"] = round(float(20 * np.log10(max(peak, 1e-9))), 2)
    res["clipped_samples"] = int(np.sum(np.abs(x) >= 0.999))

    P = _stft_power(x)
    hop_s = HOP / SR
    total = _db(P.sum(axis=1))
    speech_band = _db(_band(P, 300, 3400))
    sub = _db(_band(P, 40, 150))
    high = _db(_band(P, 4000, 12000))
    hi_band = _band(P, 300, 12000)
    freqs = np.fft.rfftfreq(NFFT, 1.0 / SR)
    sel = P[:, (freqs >= 300) & (freqs < 12000)] + 1e-14
    flat = np.exp(np.mean(np.log(sel), axis=1)) / np.mean(sel, axis=1)
    hsel = P[:, (freqs >= 4000) & (freqs < 12000)] + 1e-14
    flat_high = np.exp(np.mean(np.log(hsel), axis=1)) / np.mean(hsel, axis=1)
    n = len(total)

    # --- speech segments ------------------------------------------------------------------
    if words:
        mask = np.zeros(n, dtype=bool)
        for w in words:
            a, b = int(w["start"] / hop_s), int(w["end"] / hop_s) + 1
            mask[max(0, a):min(n, b)] = True
        segs = _segments(mask, hop_s, 0.08, 0.15)
        res["speech_source"] = "transcript word timestamps"
        speech_conf = 0.85
    else:
        active = total[total > -75]
        thr = _otsu_1d(active) if active.size > 50 else -40.0
        speechy = (speech_band - total) > -8.0
        mask = (total > thr) & speechy
        segs = _segments(mask, hop_s, 0.12, 0.15)
        res["speech_source"] = "energy/spectral VAD (no transcript)"
        res["vad_threshold_db"] = round(thr, 1)
        speech_conf = 0.45
    speech_time = sum(b - a for a, b in segs)
    pauses = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
    pauses = [p for p in pauses if p >= 0.15]
    res["speech"] = {
        "segments": [[round(a, 3), round(b, 3)] for a, b in segs],
        "speech_ratio": round(speech_time / (n * hop_s), 3),
        "first_speech": round(segs[0][0], 3) if segs else None,
        "last_speech_end": round(segs[-1][1], 3) if segs else None,
        "pause_count": len(pauses),
        "pauses_per_minute": round(len(pauses) / max(1e-6, speech_time) * 60, 2) if speech_time else None,
        "pause_mean": round(float(np.mean(pauses)), 3) if pauses else None,
        "pause_median": round(float(np.median(pauses)), 3) if pauses else None,
        "pause_max": round(float(np.max(pauses)), 3) if pauses else None,
        "confidence": speech_conf,
    }
    if words and speech_time:
        res["speech"]["words_per_minute"] = round(len(words) / speech_time * 60, 1)
        res["speech"]["words_per_minute_overall"] = round(len(words) / (n * hop_s) * 60, 1)
    elif speech_time:
        # syllable-rate estimate from the speech-band envelope (low confidence)
        env = np.convolve(10 ** (speech_band / 20), np.ones(5) / 5, mode="same")
        peaks = 0
        smask = np.zeros(n, dtype=bool)
        for a, b in segs:
            smask[int(a / hop_s):int(b / hop_s)] = True
        for i in range(2, n - 2):
            if smask[i] and env[i] > env[i - 1] and env[i] >= env[i + 1] and env[i] > 1.4 * np.min(env[max(0, i - 8):i + 8]):
                peaks += 1
        syl_rate = peaks / speech_time
        res["speech"]["syllables_per_second_est"] = round(syl_rate, 2)
        res["speech"]["words_per_minute_est"] = round(syl_rate * 60 / 1.45, 1)

    # --- background bed in pauses ---------------------------------------------------------------
    speech_mask = np.zeros(n, dtype=bool)
    for a, b in segs:
        speech_mask[int(a / hop_s):min(n, int(b / hop_s) + 1)] = True
    gap_idx = []
    for i in range(len(segs) - 1):
        a, b = segs[i][1] + 0.06, segs[i + 1][0] - 0.06
        if b - a >= 0.15:
            gap_idx.extend(range(int(a / hop_s), int(b / hop_s)))
    if segs and segs[0][0] > 0.4:
        gap_idx.extend(range(int(0.05 / hop_s), int((segs[0][0] - 0.06) / hop_s)))
    bed: dict = {"measured_frames": len(gap_idx)}
    if segs:
        speech_level = float(np.median(total[speech_mask])) if speech_mask.any() else None
        bed["speech_level_db"] = round(speech_level, 1) if speech_level is not None else None
        if len(gap_idx) >= 20:
            gl = total[gap_idx]
            gap_level = float(np.median(gl))
            bed["gap_level_db"] = round(gap_level, 1)
            bed["below_speech_db"] = round(speech_level - gap_level, 1) if speech_level is not None else None
            bed["gap_flatness"] = round(float(np.median(flat[gap_idx])), 3)
            bed["audible_bed"] = bool(gap_level > -55)
            bed["tonal"] = bool(bed["gap_flatness"] < 0.3)
            bed["music_likely"] = bool(bed["audible_bed"] and bed["tonal"])
            bed["confidence"] = 0.6 if words else 0.4
        else:
            bed["note"] = "not enough pause time to measure the background bed"
    res["background"] = bed

    # --- sound-effect-like events --------------------------------------------------------------------
    events = []
    win = int(0.5 / hop_s)
    for i in range(win, n - 2):
        base = np.median(sub[i - win:i])
        rise = sub[i] - base
        # a voiced syllable raises the low band and the speech band together; an impact is
        # low-frequency dominated, so its low-band rise must clearly exceed the speech-band rise
        speech_rise = speech_band[i] - np.median(speech_band[i - win:i])
        if rise > 12 and rise - speech_rise > 8 and sub[i] > -45 and sub[i] >= sub[i + 1] - 1 and sub[i] > sub[i - 1] + 3:
            events.append({"time": round(i * hop_s, 3), "type": "impact/boom", "confidence": 0.4})
    # whooshes: noise-like, high-band-dominant bursts 0.15-1.2 s
    hb_rel = high - speech_band
    cand = (hb_rel > -6) & (flat_high > 0.3) & (high > -50)
    for a, b in _segments(cand, hop_s, 0.15, 0.05):
        if b - a <= 1.2:
            ia, ib = int(a / hop_s), max(int(a / hop_s) + 1, int(b / hop_s))
            peak = (ia + int(np.argmax(high[ia:ib]))) * hop_s
            events.append({"time": round(peak, 3), "start": round(a, 3), "end": round(b, 3),
                           "type": "whoosh/noise-sweep", "confidence": 0.35})
    # risers: high band rising steadily for >= 0.8 s
    step = int(0.1 / hop_s)
    hb_s = np.convolve(high, np.ones(step) / step, mode="same")
    L = int(0.8 / hop_s)
    i = 0
    while i + L < n:
        seg = hb_s[i:i + L]
        if seg[-1] - seg[0] > 12 and np.all(np.diff(seg[::step]) > -1.0) and seg[-1] > -45:
            events.append({"time": round(i * hop_s, 3), "end": round((i + L) * hop_s, 3), "type": "riser", "confidence": 0.3})
            i += L
        else:
            i += step
    # short clicks/pops outside speech
    flux = np.concatenate([[0], np.maximum(0, np.diff(_db(hi_band)))])
    for i in range(5, n - 5):
        if not speech_mask[i] and flux[i] > 18 and total[i] > -40 and total[i + 4] < total[i] - 10:
            events.append({"time": round(i * hop_s, 3), "type": "click/pop", "confidence": 0.3})
    events.sort(key=lambda e: e["time"])
    deduped = []
    for e in events:
        if deduped and abs(e["time"] - deduped[-1]["time"]) < 0.08 and e["type"] == deduped[-1]["type"]:
            continue
        deduped.append(e)
    events = deduped
    near_cut = 0
    for e in events:
        if any(abs(e["time"] - c) <= 0.15 for c in cut_times):
            e["near_cut"] = True
            near_cut += 1
    cuts_with_sfx = sum(1 for c in cut_times if any(abs(e["time"] - c) <= 0.15 for e in events))
    types = [e["type"] for e in events]
    res["sfx"] = {
        "events": events,
        "count": len(events),
        "per_minute": round(len(events) / (n * hop_s) * 60, 2),
        "type_counts": {t: types.count(t) for t in set(types)},
        "share_near_cuts": round(near_cut / len(events), 3) if events else None,
        "cuts_with_sfx_share": round(cuts_with_sfx / len(cut_times), 3) if cut_times else None,
        "note": "heuristic detection - speech fricatives and music hits can be mistaken for effects",
    }

    # --- envelope at start/end ---------------------------------------------------------------------------
    def lvl(a, b):
        seg = total[int(a / hop_s):int(b / hop_s)]
        return float(np.mean(seg)) if seg.size else -100.0
    dur = n * hop_s
    res["envelope"] = {
        "start_level_db": round(lvl(0, 0.1), 1), "start_body_db": round(lvl(0.3, 0.8), 1),
        "end_level_db": round(lvl(dur - 0.15, dur), 1), "end_body_db": round(lvl(dur - 1.0, dur - 0.4), 1),
    }
    e = res["envelope"]
    e["fade_in"] = bool(e["start_body_db"] - e["start_level_db"] > 10)
    e["fade_out"] = bool(e["end_body_db"] - e["end_level_db"] > 10)
    e["abrupt_end"] = bool(not e["fade_out"] and e["end_level_db"] > -35)
    return res
