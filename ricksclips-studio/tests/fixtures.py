"""Synthetic test media with known ground truth (no copyrighted material).

`make_reference_video` renders a Short-like clip whose cuts, transitions,
camera moves, captions and audio layout are all known, so the analyzer can be
checked against ground truth.
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

import cv2
import numpy as np

from rcstudio import ffmpeg, paths

W, H, FPS = 540, 960, 30
SR = 48000


def textured_image(seed: int, w: int = 900, h: int = 1600) -> np.ndarray:
    rng = np.random.default_rng(seed)
    base = np.zeros((h, w, 3), np.float32)
    c1, c2 = rng.uniform(30, 220, 3), rng.uniform(30, 220, 3)
    yy = np.linspace(0, 1, h)[:, None, None]
    base[:] = c1 * (1 - yy) + c2 * yy
    img = base.astype(np.uint8)
    for _ in range(160):
        color = tuple(int(c) for c in rng.uniform(0, 255, 3))
        x, y = int(rng.uniform(0, w)), int(rng.uniform(0, h))
        r = int(rng.uniform(8, 60))
        if rng.random() < 0.5:
            cv2.circle(img, (x, y), r, color, -1, cv2.LINE_AA)
        else:
            cv2.rectangle(img, (x, y), (x + r * 2, y + r), color, -1)
    noise = rng.normal(0, 10, img.shape)
    return np.clip(img + noise, 0, 255).astype(np.uint8)


def _render_shot_frame(img: np.ndarray, motion: str, p: float, amount: float = 0.12) -> np.ndarray:
    ih, iw = img.shape[:2]
    s0 = max(W / iw, H / ih) * 1.15
    z = 1.0
    dx = dy = 0.0
    if motion == "zoom_in":
        z = 1 + amount * p
    elif motion == "zoom_out":
        z = 1 + amount * (1 - p)
    elif motion == "pan_right":
        dx = -0.08 * W * (p - 0.5) * 2   # content moves left -> camera pans right
    elif motion == "pan_left":
        dx = 0.08 * W * (p - 0.5) * 2
    s = s0 * z
    M = np.array([[s, 0, W / 2 - s * iw / 2 + dx], [0, s, H / 2 - s * ih / 2 + dy]], np.float32)
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


SHOTS = [  # (duration s, motion, transition into the next shot)
    (1.6, "zoom_in", "cut"),
    (1.4, "pan_right", "cut"),
    (1.8, "zoom_out", "dissolve"),
    (1.5, "static", "cut"),
    (1.6, "zoom_in", "dip_black"),
    (1.4, "pan_left", "flash"),
    (1.7, "zoom_in", "cut"),
    (1.5, "zoom_out", "end"),
]


def ground_truth() -> dict:
    t = 0.0
    bounds = []
    for d, mot, tr in SHOTS:
        t += d
        if tr != "end":
            bounds.append((round(t, 3), tr))
    return {"duration": round(t, 3), "boundaries": bounds, "motions": [m for _, m, _ in SHOTS]}


def _video_frames(seed: int = 7):
    imgs = [textured_image(seed + k) for k in range(len(SHOTS))]
    starts = np.cumsum([0] + [d for d, _, _ in SHOTS])
    total = starts[-1]
    n = int(round(total * FPS))
    for i in range(n):
        t = i / FPS
        k = int(np.searchsorted(starts, t, side="right") - 1)
        k = min(k, len(SHOTS) - 1)
        d, mot, _ = SHOTS[k]
        p = (t - starts[k]) / d
        frame = _render_shot_frame(imgs[k], mot, p)
        # transition windows around the boundary that ends shot k-1 / starts shot k
        for kb in (k, k + 1):
            if kb <= 0 or kb >= len(SHOTS):
                continue
            tb = starts[kb]
            tr = SHOTS[kb - 1][2]
            if tr == "dissolve" and abs(t - tb) < 0.25:
                q = (t - (tb - 0.25)) / 0.5
                a = _render_shot_frame(imgs[kb - 1], SHOTS[kb - 1][1], min(1.2, (t - starts[kb - 1]) / SHOTS[kb - 1][0]))
                b = _render_shot_frame(imgs[kb], SHOTS[kb][1], max(0.0, (t - tb) / SHOTS[kb][0]))
                frame = cv2.addWeighted(a, 1 - q, b, q, 0)
            elif tr == "dip_black" and abs(t - tb) < 0.3:
                fade = abs(t - tb) / 0.3
                frame = (frame.astype(np.float32) * max(0.0, fade - 0.25) / 0.75).astype(np.uint8)
            elif tr == "flash" and abs(t - tb) < 0.05:
                frame = np.full_like(frame, 250)
        yield frame


def _speech_like(duration: float, rng) -> tuple[np.ndarray, list[tuple[float, float]]]:
    """Harmonic 'syllables' grouped into phrases with pauses (ground-truth speech spans)."""
    x = np.zeros(int(duration * SR), np.float32)
    t = 0.25
    spans = []
    while t < duration - 0.8:
        phrase = rng.uniform(1.0, 2.0)
        end = min(duration - 0.4, t + phrase)
        n = int((end - t) * SR)
        tt = np.arange(n) / SR
        f0 = 120 + 15 * np.sin(2 * np.pi * 0.7 * tt)
        ph = 2 * np.pi * np.cumsum(f0) / SR
        sig = sum((0.6 / k) * np.sin(k * ph) for k in range(1, 12))
        syl = 0.5 + 0.5 * np.sin(2 * np.pi * 4.5 * tt - np.pi / 2)
        env = np.minimum(1, np.minimum(tt / 0.03, (tt[-1] - tt) / 0.05 + 1e-3))
        x[int(t * SR): int(t * SR) + n] += (0.25 * sig * syl ** 1.5 * env).astype(np.float32)
        spans.append((round(t, 3), round(end, 3)))
        t = end + rng.uniform(0.35, 0.6)
    return x, spans


def make_audio(path: Path, duration: float, cuts: list[float], music_db: float = -22.0, seed: int = 3) -> dict:
    rng = np.random.default_rng(seed)
    speech, spans = _speech_like(duration, rng)
    tt = np.arange(len(speech)) / SR
    chord = sum(np.sin(2 * np.pi * f * tt) for f in (130.81, 155.56, 196.0, 261.63)) / 4
    music = (10 ** (music_db / 20) * 0.5 * chord).astype(np.float32)
    sfx = np.zeros_like(speech)
    for c in cuts:
        n = int(0.35 * SR)
        a = int(max(0, c - 0.12) * SR)
        noise = rng.normal(0, 1, n)
        spec = np.fft.rfft(noise)
        f = np.fft.rfftfreq(n, 1 / SR)
        spec[f < 3000] = 0
        wh = np.fft.irfft(spec, n)
        wh = wh / (np.abs(wh).max() + 1e-9) * 0.25 * np.sin(np.pi * np.arange(n) / n) ** 2
        sfx[a:a + n] += wh[: len(sfx[a:a + n])].astype(np.float32)
    mix = speech + music + sfx
    mix = mix / max(1.0, float(np.abs(mix).max()) / 0.9)
    ffmpeg.write_wav(path, mix, SR)
    return {"speech_spans": spans, "music_db": music_db}


ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Poppins Black,118,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,8,3,5,90,130,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

CAPTION_WORDS = ("THE UNIVERSE IS FULL OF SIGNALS NOBODY CAN EXPLAIN AND ONE OF THEM LASTED "
                 "SEVENTY TWO SECONDS BEFORE IT VANISHED FOREVER INTO THE DARK").split()


def _ts(t: float) -> str:
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def make_ass(path: Path, duration: float, y_frac: float = 0.62, words_per: int = 2, step: float = 0.6) -> dict:
    lines = [ASS_HEADER]
    t, k, n = 0.1, 0, 0
    while t + step <= duration - 0.1 and k < len(CAPTION_WORDS):
        ws = CAPTION_WORDS[k:k + words_per]
        ws = [f"{{\\c&H00D4FF&}}{w}{{\\c&HFFFFFF&}}" if j == len(ws) - 1 and n % 2 == 0 else w for j, w in enumerate(ws)]
        text = " ".join(ws)
        lines.append(f"Dialogue: 0,{_ts(t)},{_ts(t + step - 0.02)},Main,,0,0,0,,{{\\pos(540,{int(1920 * y_frac)})}}{text}\n")
        t += step
        k += words_per
        n += 1
    path.write_text("".join(lines), encoding="utf-8")
    return {"y": y_frac, "count": n, "words_per": words_per}


def make_reference_video(out: Path, with_captions: bool = True, seed: int = 7) -> dict:
    """Render the synthetic reference Short and return its ground truth."""
    out = Path(out)
    work = out.parent / (out.stem + "_work")
    work.mkdir(parents=True, exist_ok=True)
    gt = ground_truth()
    silent = work / "video.mp4"
    wr = ffmpeg.FrameWriter(silent, W, H, FPS, crf=20, preset="veryfast")
    for fr in _video_frames(seed):
        wr.write(fr)
    wr.close()
    cuts = [b for b, _ in gt["boundaries"]]
    aud = make_audio(work / "audio.wav", gt["duration"], cuts)
    gt.update(aud)
    args = ["-y", "-v", "error", "-i", "video.mp4", "-i", "audio.wav"]
    if with_captions:
        for f in paths.fonts_dir().glob("*.ttf"):
            shutil.copy(f, work / f.name)
        gt["captions"] = make_ass(work / "caps.ass", gt["duration"])
        args += ["-vf", "subtitles=caps.ass:fontsdir=."]
    args += ["-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", str(out.resolve())]
    ffmpeg.ffmpeg(args, cwd=work)
    return gt
