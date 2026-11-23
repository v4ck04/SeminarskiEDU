"""The project's shared sound-effects library (the files in this folder, described in catalog.json).

    import sys; sys.path.insert(0, "<repo>/sfx-library"); import sfxlib
    x = sfxlib.load("whoosh_soft")            # (2, n) float64 at 48 kHz, trimmed to its onset, level-matched
    t0 = t_cut - sfxlib.lead("whoosh_soft")    # start it so that its peak lands on t_cut
    sfxlib.ids("whoosh")                       # every sound with that role

load() trims each file to 5 ms before its onset (some files start with up to 1 s of silence), scales it so its
active part sits at -20 dBFS RMS (peak capped at -1 dBFS) and decodes through ffmpeg (wav / mp3 / anything).
`python sfxlib.py --measure` re-measures every file and rewrites the numbers in catalog.json (roles and notes are
kept); run it after adding files, then give the new entries their roles.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
PRE = 0.005  # seconds kept before the onset
_cat: dict | None = None


def catalog() -> dict:
    global _cat
    if _cat is None:
        with open(os.path.join(HERE, "catalog.json"), encoding="utf-8") as f:
            _cat = json.load(f)
    return _cat


def entry(key: str) -> dict:
    for e in catalog()["sounds"]:
        if key in (e["id"], e["file"]):
            return e
    raise KeyError(f"no sound '{key}' in sfx-library/catalog.json")


def ids(role: str | None = None) -> list[str]:
    return [e["id"] for e in catalog()["sounds"] if role is None or role in e["roles"]]


def decode(path: str, sr: int = SR) -> np.ndarray:
    """any audio file -> (n, 2) float32"""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def lead(key: str) -> float:
    """seconds from the start of load(key) to its peak (place it at t - lead to put the peak on t)"""
    e = entry(key)
    return max(0.0, e["peak"] - max(0.0, e["onset"] - PRE))


def load(key: str, sr: int = SR, rms_db: float = -20.0, max_peak_db: float = -1.0) -> np.ndarray:
    e = entry(key)
    x = decode(os.path.join(HERE, e["file"]), sr).astype(np.float64)
    a = int(max(0.0, e["onset"] - PRE) * sr)
    b = min(len(x), int((e["end"] + 0.05) * sr))
    x = x[a:b]
    act = x[: max(1, int((e["end"] - max(0.0, e["onset"] - PRE)) * sr))]
    rms = float(np.sqrt(np.mean(act ** 2))) or 1e-9
    g = 10 ** (rms_db / 20) / rms
    pk = float(np.abs(x).max()) * g or 1e-9
    g *= min(1.0, 10 ** (max_peak_db / 20) / pk)
    y = x * g
    n = min(len(y), int(0.004 * sr))  # click-free edges
    y[:n] *= np.linspace(0, 1, n)[:, None]
    y[-n:] *= np.linspace(1, 0, n)[:, None]
    return y.T.copy()


def measure(path: str) -> dict:
    x = decode(path).astype(np.float64)
    m = np.abs(x).max(1)
    pk = float(m.max()) or 1e-9
    on = int(np.argmax(m > pk * 0.03))
    end = len(m) - int(np.argmax(m[::-1] > pk * 0.01))
    mono = x.mean(1)
    sp = np.abs(np.fft.rfft(mono * np.hanning(len(mono))))
    fr = np.fft.rfftfreq(len(mono), 1 / SR)
    stereo = bool(x[:, 0].std() > 0 and np.corrcoef(x[:, 0], x[:, 1])[0, 1] < 0.98)
    return {"duration": round(len(x) / SR, 3), "onset": round(on / SR, 3), "peak": round(int(np.argmax(m)) / SR, 3),
            "end": round(end / SR, 3), "peak_dbfs": round(20 * np.log10(pk), 1),
            "rms_dbfs": round(20 * np.log10(np.sqrt(np.mean(mono[on:end] ** 2)) + 1e-12), 1),
            "centroid_hz": int((sp * fr).sum() / (sp.sum() or 1)), "stereo": stereo}


if __name__ == "__main__" and "--measure" in sys.argv:
    cat = catalog()
    for e in cat["sounds"]:
        e.update(measure(os.path.join(HERE, e["file"])))
    with open(os.path.join(HERE, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(cat, f, indent=1, ensure_ascii=False)
    print("re-measured", len(cat["sounds"]), "sounds")
