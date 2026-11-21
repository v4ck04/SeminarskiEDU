"""Original procedural audio: sound effects and music beds.

Everything here is synthesised from scratch (numpy), so it is royalty free
and needs no network. User-supplied, licensed files take priority:
  production/sound-effects/<type>*.wav|mp3   (e.g. whoosh_01.wav)
  production/music/*.mp3|wav  + optional sidecar .json {"moods": [...], "license": "...", "attribution": "..."}
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np

from .. import ffmpeg, paths
from ..utils import read_json

SR = 48000
SFX_TYPES = ["whoosh", "impact", "riser", "pop", "ding"]


# ----------------------------------------------------------------------------- helpers
def _norm(x: np.ndarray, peak_db: float = -3.0) -> np.ndarray:
    p = float(np.max(np.abs(x))) or 1.0
    return x * (10 ** (peak_db / 20) / p)


def _band_sweep(noise: np.ndarray, centers: np.ndarray, width_oct: float = 0.9) -> np.ndarray:
    """Time-varying band-pass via overlap-add FFT blocks."""
    n_fft, hop = 2048, 512
    win = np.hanning(n_fft)
    out = np.zeros(len(noise) + n_fft)
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    lf = np.log2(np.maximum(freqs, 1.0))
    for i, start in enumerate(range(0, len(noise) - n_fft, hop)):
        seg = noise[start:start + n_fft] * win
        fc = centers[min(len(centers) - 1, start + n_fft // 2)]
        gain = np.exp(-0.5 * ((lf - math.log2(fc)) / width_oct) ** 2)
        out[start:start + n_fft] += np.fft.irfft(np.fft.rfft(seg) * gain, n_fft) * win
    return out[: len(noise)] / 1.5


def _stereo(x: np.ndarray, pan: np.ndarray | float = 0.0) -> np.ndarray:
    pan = np.broadcast_to(np.asarray(pan, dtype=float), x.shape)
    l = x * np.cos((pan + 1) * math.pi / 4)
    r = x * np.sin((pan + 1) * math.pi / 4)
    return np.stack([l, r], axis=1) * math.sqrt(2)


# ----------------------------------------------------------------------------- sound effects
def whoosh(rng, dur: float = 0.55) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    centers = 400 * (14 ** np.sin(np.pi * np.clip(t * 1.1, 0, 1)) )
    x = _band_sweep(rng.normal(0, 1, n), centers)
    env = np.where(t < 0.62, (t / 0.62) ** 2.2, np.exp(-(t - 0.62) * 9))
    return _norm(_stereo(x * env, np.linspace(-0.6, 0.6, n)), -4)


def impact(rng, dur: float = 1.1) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 38 + 85 * np.exp(-t * 9)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    burst = rng.normal(0, 1, n) * np.exp(-t * 60)
    spec = np.fft.rfft(burst)
    spec[np.fft.rfftfreq(n, 1 / SR) > 500] *= 0.08
    burst = np.fft.irfft(spec, n)
    x = np.tanh(1.6 * (body + 0.8 * burst / (np.abs(burst).max() + 1e-9)))
    return _norm(_stereo(x), -2)


def riser(rng, dur: float = 1.3) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = _band_sweep(rng.normal(0, 1, n), 300 * (30 ** t), 1.2)
    f = 180 * (4 ** t)
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.15
    env = t ** 2.5
    return _norm(_stereo((noise + tone) * env, 0.0), -4)


def pop(rng, dur: float = 0.12) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 1100 - 500 * (t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) + rng.normal(0, 0.15, n) * np.exp(-t * 300)
    return _norm(_stereo(x), -6)


def ding(rng, dur: float = 1.6) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * 1046.5 * r * t) * np.exp(-t * d)
            for r, a, d in ((1, 1, 3), (2.76, 0.4, 6), (5.4, 0.2, 10), (8.93, 0.1, 16)))
    return _norm(_stereo(x * (1 - np.exp(-t * 400))), -6)


SFX_FUNCS = {"whoosh": whoosh, "impact": impact, "riser": riser, "pop": pop, "ding": ding}


def sfx_file(kind: str, variant: int = 0) -> tuple[Path, dict]:
    """A user-provided effect if present, else a generated (cached) one."""
    lib = sorted(p for p in paths.sfx_library().glob(f"{kind}*") if p.suffix.lower() in (".wav", ".mp3", ".ogg", ".flac"))
    if lib:
        p = lib[variant % len(lib)]
        side = read_json(p.with_suffix(p.suffix + ".json"), {}) or {}
        return p, {"source": "user library", "file": p.name, "license": side.get("license", "user-provided"),
                   "attribution": side.get("attribution")}
    kind = kind if kind in SFX_FUNCS else "whoosh"
    out = paths.generated_sfx_dir() / f"{kind}_v{variant % 3}.wav"
    if not out.exists():
        rng = np.random.default_rng(1000 + SFX_TYPES.index(kind) * 10 + variant % 3)
        ffmpeg.write_wav(out, SFX_FUNCS[kind](rng), SR)
    return out, {"source": "generated", "file": out.name, "license": "original (procedurally generated)", "attribution": None}


# ----------------------------------------------------------------------------- music
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
MOODS = {
    #            key  mode     bpm  progression (scale degrees) bars/chord  layers
    "mysterious": ("A", "minor", 70, [0, 5, 2, 6], 2, {"arp": 0.35, "drums": None, "pulse": False}),
    "epic":       ("D", "minor", 88, [0, 5, 6, 0], 1, {"arp": 0.0, "drums": "toms", "pulse": True}),
    "upbeat":     ("C", "major", 112, [0, 4, 5, 3], 1, {"arp": 0.9, "drums": "pop", "pulse": True}),
    "tense":      ("E", "minor", 96, [0, 0, 5, 4], 1, {"arp": 0.2, "drums": "ticks", "pulse": True}),
    "calm":       ("F", "major", 70, [0, 2, 5, 3], 2, {"arp": 0.4, "drums": None, "pulse": False}),
    "inspiring":  ("G", "major", 84, [3, 0, 4, 5], 1, {"arp": 0.7, "drums": "soft", "pulse": False}),
}
SCALES = {"minor": [0, 2, 3, 5, 7, 8, 10], "major": [0, 2, 4, 5, 7, 9, 11]}


def _hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def _chord(root_midi: int, scale: list[int], degree: int) -> list[int]:
    def deg(d):
        o, i = divmod(degree + d, 7)
        return root_midi + scale[i] + 12 * o
    return [deg(0), deg(2), deg(4), deg(7)]


def _pad_note(f: float, n: int, rng) -> np.ndarray:
    t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.004, 0.004):
        ph = rng.uniform(0, 6.28)
        for k in range(1, 9):
            x += np.sin(2 * np.pi * f * k * (1 + det) * t + ph * k) / (k ** 1.6)
    return x


def _env(n: int, attack: float, release: float) -> np.ndarray:
    a, r = min(n, int(attack * SR)), min(n, int(release * SR))
    e = np.ones(n)
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.5
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return e


def _reverb(x: np.ndarray, rng, seconds: float = 2.2, wet: float = 0.28) -> np.ndarray:
    n_ir = int(seconds * SR)
    out = np.zeros_like(x)
    size = 1 << int(math.ceil(math.log2(len(x) + n_ir)))
    for ch in range(x.shape[1]):
        ir = rng.normal(0, 1, n_ir) * np.exp(-np.arange(n_ir) / SR * (6.9 / seconds))
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[: len(x)]
        out[:, ch] = (1 - wet) * x[:, ch] + wet * y
    return out


def music(mood: str, duration: float, seed: int = 0) -> np.ndarray:
    key, mode, bpm, prog, bars, layers = MOODS.get(mood, MOODS["mysterious"])
    rng = np.random.default_rng(seed)
    scale = SCALES[mode]
    root = 48 + NOTE[key]
    beat = 60.0 / bpm
    chord_len = beat * 4 * bars
    total = int((duration + 2.5) * SR)
    pad = np.zeros((total, 2))
    bass = np.zeros(total)
    arp = np.zeros((total, 2))
    drums = np.zeros(total)
    n_chords = int(math.ceil((duration + 2.5) / chord_len))
    for c in range(n_chords):
        notes = _chord(root, scale, prog[c % len(prog)])
        s = int(c * chord_len * SR)
        n = int((chord_len + 0.8) * SR)
        e = min(total, s + n)
        env = _env(e - s, 0.9, 0.9)
        for j, m in enumerate(notes):
            v = _pad_note(_hz(m), e - s, rng) * env * 0.16
            pan = (-0.5, 0.5, -0.2, 0.2)[j]
            pad[s:e] += _stereo(v, pan)
        tb = np.arange(e - s) / SR
        bass[s:e] += np.sin(2 * np.pi * _hz(notes[0] - 12) * tb) * env * 0.45
        if layers["pulse"]:
            steps = int(chord_len / (beat / 2))
            for k in range(steps):
                ps = s + int(k * beat / 2 * SR)
                pn = min(total, ps + int(beat / 2 * SR))
                tt = np.arange(pn - ps) / SR
                bass[ps:pn] += np.sin(2 * np.pi * _hz(notes[0] - 12) * tt) * np.exp(-tt * 9) * 0.35
        if layers["arp"] > 0:
            steps = int(chord_len / (beat / 2))
            for k in range(steps):
                if rng.random() > layers["arp"]:
                    continue
                m = notes[rng.integers(0, 4)] + 24
                ps = s + int(k * beat / 2 * SR)
                pn = min(total, ps + int(1.2 * SR))
                tt = np.arange(pn - ps) / SR
                tone = (np.sin(2 * np.pi * _hz(m) * tt) + 0.3 * np.sin(4 * np.pi * _hz(m) * tt)) * np.exp(-tt * 4.5) * 0.12
                arp[ps:pn] += _stereo(tone, rng.uniform(-0.7, 0.7))
    if layers["drums"]:
        nb = int(total / (beat * SR))
        for k in range(nb):
            ps = int(k * beat * SR)
            kind = layers["drums"]
            if kind in ("pop", "soft") or (kind == "toms" and k % 2 == 0):
                pn = min(total, ps + int(0.35 * SR))
                tt = np.arange(pn - ps) / SR
                f = (45 + 80 * np.exp(-tt * 30)) if kind != "toms" else (85 + 90 * np.exp(-tt * 12))
                drums[ps:pn] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (12 if kind != "toms" else 6)) * \
                    (0.6 if kind != "soft" else 0.35)
            if kind in ("pop", "ticks"):
                hs = ps + int(beat / 2 * SR)
                hn = min(total, hs + int(0.04 * SR))
                if hn > hs:
                    noise = rng.normal(0, 1, hn - hs)
                    noise = np.diff(np.concatenate([[0], noise]))
                    drums[hs:hn] += noise * np.exp(-np.arange(hn - hs) / SR * 90) * 0.08
    mix = pad + arp * 0.9
    mix = _reverb(mix, rng)
    mix += _stereo(bass * 0.8) + _stereo(drums * 0.7)
    mix = mix[: int(duration * SR)]
    mix *= _env(len(mix), 1.0, 2.0)[:, None]
    return _norm(mix, -3)


def music_file(slug: str, mood: str, duration: float, seed: int) -> tuple[Path, dict]:
    """A user track matching the mood if available, else a generated bed."""
    lib = sorted(p for p in paths.music_library().glob("*") if p.suffix.lower() in (".wav", ".mp3", ".ogg", ".flac", ".m4a"))
    tagged = []
    for p in lib:
        side = read_json(p.with_suffix(p.suffix + ".json"), {}) or {}
        moods = [m.lower() for m in side.get("moods", [])] + [w for w in p.stem.lower().replace("-", "_").split("_")]
        if mood.lower() in moods:
            tagged.append((p, side))
    if tagged:
        p, side = tagged[seed % len(tagged)]
        return p, {"source": "user library", "file": p.name, "license": side.get("license", "user-provided"),
                   "attribution": side.get("attribution"), "mood": mood}
    out = paths.project_dirs(slug)["audio"] / f"music_{mood}.wav"
    ffmpeg.write_wav(out, music(mood, duration, seed), SR)
    return out, {"source": "generated", "file": out.name, "license": "original (procedurally generated)",
                 "attribution": None, "mood": mood}
