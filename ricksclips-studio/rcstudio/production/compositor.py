"""Frame compositor: sources + motion + transitions -> FFmpeg.

Python builds each output frame (sub-pixel motion with OpenCV, transitions
in numpy) and pipes raw frames to one FFmpeg process that applies the global
colour grade, burns the ASS subtitles with libass and muxes the mixed audio.
Each frame is encoded exactly once (no generational loss).
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from .. import ffmpeg, log
from ..utils import StudioError, clamp, ease_in_out, ease_out, say
from . import generators

_log = log.get("compositor")


def imread(path: str | Path) -> np.ndarray:
    data = np.fromfile(str(path), dtype=np.uint8)      # works with non-ASCII Windows paths
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise StudioError(f"Cannot read image {path}")
    return img


def cover(img: np.ndarray, w: int, h: int) -> np.ndarray:
    ih, iw = img.shape[:2]
    s = max(w / iw, h / ih)
    nw, nh = max(w, int(math.ceil(iw * s))), max(h, int(math.ceil(ih * s)))
    r = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    x0, y0 = (nw - w) // 2, (nh - h) // 2
    return r[y0:y0 + h, x0:x0 + w].copy()


def blur_fill(img: np.ndarray, w: int, h: int) -> np.ndarray:
    bg = cover(img, w // 8, h // 8)
    bg = cv2.GaussianBlur(bg, (0, 0), 3)
    bg = cv2.resize(bg, (w, h), interpolation=cv2.INTER_CUBIC)
    bg = cv2.convertScaleAbs(bg, alpha=0.7, beta=0)
    ih, iw = img.shape[:2]
    s = w / iw
    fg = cv2.resize(img, (w, max(2, int(ih * s))), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    y0 = (h - fg.shape[0]) // 2
    if y0 >= 0:
        bg[y0:y0 + fg.shape[0]] = fg
    else:
        bg = cover(img, w, h)
    return bg


def norm_params(img: np.ndarray) -> tuple[float, float]:
    g = cv2.cvtColor(cv2.resize(img, (96, 170), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    mu, sd = float(g.mean()), float(g.std()) + 1e-3
    alpha = clamp(0.21 * 255 / sd, 0.88, 1.2)
    beta = clamp(0.46 * 255 - alpha * mu, -22, 22)
    return alpha, beta


# ----------------------------------------------------------------------------- sources
class ImageSource:
    def __init__(self, path, W, H, margin, layout="cover", normalize=True):
        img = imread(path)
        Wc, Hc = int(round(W * margin)), int(round(H * margin))
        ih, iw = img.shape[:2]
        wide = iw / ih > 0.8
        base = blur_fill(img, Wc, Hc) if (layout == "blur_fill" and wide) else cover(img, Wc, Hc)
        if normalize:
            a, b = norm_params(base)
            base = cv2.convertScaleAbs(base, alpha=a, beta=b)
        self.base, self.margin, self.size = base, margin, (Wc, Hc)

    def frame(self, tau: float) -> np.ndarray:
        return self.base

    def sample(self) -> np.ndarray:
        return self.base

    def close(self):
        pass


class VideoSource:
    def __init__(self, path, W, H, margin, fps, need: float, speed=1.0, layout="cover", normalize=True):
        self.path, self.fps, self.speed, self.need = str(path), fps, speed, need
        self.Wc, self.Hc = ffmpeg.even(W * margin), ffmpeg.even(H * margin)
        self.margin = self.Wc / W
        self.size = (self.Wc, self.Hc)
        info = ffmpeg.media_info(path)
        v = info["video"]
        self.src_dur = info["duration"]
        avail = self.src_dur / max(1e-3, speed)
        self.offset = clamp((avail - need) / 3.0, 0.0, 1.0) * speed if avail > need + 0.3 else 0.0
        self.loop = avail < need
        wide = v["display_width"] / max(1, v["display_height"]) > 0.8
        Wc, Hc = self.Wc, self.Hc
        if layout == "blur_fill" and wide:
            self.vf = (f"split[a][b];[a]scale={Wc // 8}:{Hc // 8}:force_original_aspect_ratio=increase,"
                       f"crop={Wc // 8}:{Hc // 8},gblur=sigma=3,scale={Wc}:{Hc},eq=brightness=-0.12[bg];"
                       f"[b]scale={Wc}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2")
        else:
            self.vf = f"scale={Wc}:{Hc}:force_original_aspect_ratio=increase:flags=bicubic,crop={Wc}:{Hc}"
        self.normalize = normalize
        self.reader = None
        self.last = None
        self.ab = None

    def _open(self):
        self.reader = ffmpeg.FrameReader(self.path, self.Wc, self.Hc, fps=self.fps, start=self.offset or None,
                                         vf_pre=self.vf, speed=self.speed, loop=self.loop)

    def frame(self, tau: float) -> np.ndarray:
        if self.reader is None:
            self._open()
        f = self.reader.read()
        if f is None:
            if self.last is None:
                raise StudioError(f"Could not decode {self.path}: {self.reader.errors()[-300:]}")
            return self.last
        if self.normalize:
            if self.ab is None:
                self.ab = norm_params(f)
            f = cv2.convertScaleAbs(f, alpha=self.ab[0], beta=self.ab[1])
        self.last = f
        return f

    def sample(self) -> np.ndarray:
        with ffmpeg.FrameReader(self.path, self.Wc, self.Hc, start=min(self.offset + 0.5, max(0, self.src_dur - 0.1)),
                                vf_pre=self.vf) as r:
            f = r.read()
        if f is None:
            raise StudioError(f"Could not decode {self.path}")
        return cv2.convertScaleAbs(f, alpha=norm_params(f)[0], beta=norm_params(f)[1]) if self.normalize else f

    def close(self):
        if self.reader:
            self.reader.close()


class GenSource:
    def __init__(self, name, W, H, seed, palette, text="", description="", font_file="Anton-Regular.ttf"):
        self.gen = generators.create(name, W, H, seed, palette, text=text, description=description, font_file=font_file)
        self.margin, self.size = 1.0, (W, H)
        self.t0 = (seed % 97) / 10.0

    def frame(self, tau: float) -> np.ndarray:
        return self.gen.frame(self.t0 + tau)

    def sample(self) -> np.ndarray:
        return self.gen.frame(self.t0 + 1.0)

    def close(self):
        pass


# ----------------------------------------------------------------------------- motion & transitions
def motion_matrix(mtype: str, intensity: float, p: float, tau: float, size: tuple[int, int], margin: float,
                  W: int, H: int, shake: float = 0.0) -> np.ndarray:
    e = ease_in_out(p)
    z, px, py = 1.0, 0.0, 0.0
    if mtype == "zoom_in":
        z = 1 + intensity * e
    elif mtype == "zoom_out":
        z = 1 + intensity * (1 - e)
    elif mtype == "pan_left":
        z, px = 1 + intensity, (0.5 - e) * 1.8
    elif mtype == "pan_right":
        z, px = 1 + intensity, (e - 0.5) * 1.8
    elif mtype == "pan_up":
        z, py = 1 + intensity, (0.5 - e) * 1.8
    elif mtype == "pan_down":
        z, py = 1 + intensity, (e - 0.5) * 1.8
    elif mtype == "punch_in":
        z = 1 + intensity * ease_out(min(1.0, max(0.0, tau) / 0.3)) + 0.025 * p
    Wc, Hc = size
    k = z / margin
    mx, my = max(0.0, Wc / 2 - W / (2 * k)), max(0.0, Hc / 2 - H / (2 * k))
    cx, cy = Wc / 2 + px * mx, Hc / 2 + py * my
    if shake > 0:
        cx += shake * Wc * (math.sin(tau * 13.1) + 0.6 * math.sin(tau * 23.7 + 1.3))
        cy += shake * Hc * 0.6 * (math.sin(tau * 11.3 + 0.7) + 0.5 * math.sin(tau * 29.1))
    return np.float32([[k, 0, W / 2 - k * cx], [0, k, H / 2 - k * cy]])


def _scale_center(img: np.ndarray, s: float) -> np.ndarray:
    h, w = img.shape[:2]
    M = np.float32([[s, 0, w / 2 * (1 - s)], [0, s, h / 2 * (1 - s)]])
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def blend(kind: str, A: np.ndarray, B: np.ndarray, q: float) -> np.ndarray:
    q = clamp(q, 0.0, 1.0)
    if kind == "crossfade":
        return cv2.addWeighted(A, 1 - q, B, q, 0)
    if kind == "dip_black":
        return cv2.convertScaleAbs(A, alpha=max(0.0, 1 - 2 * q)) if q < 0.5 else cv2.convertScaleAbs(B, alpha=max(0.0, 2 * q - 1))
    if kind == "flash":
        base = A if q < 0.5 else B
        amt = max(0.0, 1 - abs(q - 0.5) * 2) ** 1.5
        return cv2.addWeighted(base, 1 - amt, np.full_like(base, 255), amt, 0)
    h, w = A.shape[:2]
    if kind == "whip":
        off = int(round(ease_in_out(q) * w))
        out = np.empty_like(A)
        out[:, : w - off] = A[:, off:]
        out[:, w - off:] = B[:, : off]
        k = int(1 + 0.08 * w * math.sin(math.pi * q))
        return cv2.blur(out, (k, 1)) if k > 1 else out
    if kind == "zoom":
        if q < 0.5:
            img = _scale_center(A, 1 + 0.5 * ease_in_out(q * 2))
        else:
            img = _scale_center(B, 1.35 - 0.35 * ease_out((q - 0.5) * 2))
        k = int(1 + 0.03 * w * math.sin(math.pi * q))
        return cv2.blur(img, (k, k)) if k > 1 else img
    return B if q >= 0.5 else A


@dataclass
class TimelineScene:
    number: int
    start: float
    end: float
    r0: float
    r1: float
    source: object
    motion: str
    intensity: float
    trans_in: str = "cut"
    trans_dur: float = 0.0
    label: str = ""
    meta: dict = field(default_factory=dict)


# ----------------------------------------------------------------------------- grade
def grade_filters(scenes: list[TimelineScene], color: dict, defaults: dict) -> tuple[str, dict]:
    sats, cons = [], []
    for sc in scenes:
        try:
            f = sc.source.sample()
        except Exception as e:
            _log.info("grade sample failed for scene %s: %s", sc.number, e)
            continue
        small = cv2.resize(f, (90, 160), interpolation=cv2.INTER_AREA)
        sats.append(float(cv2.cvtColor(small, cv2.COLOR_BGR2HSV)[:, :, 1].mean() / 255))
        cons.append(float(cv2.cvtColor(small, cv2.COLOR_BGR2LAB)[:, :, 0].std() / 255))
    sat_pref = float(color.get("saturation", 1.08)) / float(defaults.get("saturation", 1.08) or 1.0)
    con_pref = float(color.get("contrast", 1.05)) / float(defaults.get("contrast", 1.05) or 1.0)
    info = {"measured_saturation": round(float(np.mean(sats)), 3) if sats else None,
            "measured_contrast": round(float(np.mean(cons)), 3) if cons else None}
    if color.get("target_saturation") and sats:
        S = clamp(color["target_saturation"] / max(0.05, np.mean(sats)), 0.75, 1.4) * sat_pref
        info["saturation_source"] = "matched to learned reference saturation"
    else:
        S = float(color.get("saturation", 1.08))
        info["saturation_source"] = "settings"
    if color.get("target_contrast") and cons:
        C = clamp(color["target_contrast"] / max(0.03, np.mean(cons)), 0.85, 1.3) * con_pref
        info["contrast_source"] = "matched to learned reference contrast"
    else:
        C = float(color.get("contrast", 1.05))
        info["contrast_source"] = "settings"
    S, C = clamp(S, 0.6, 1.6), clamp(C, 0.7, 1.5)
    parts = [f"eq=contrast={C:.3f}:saturation={S:.3f}:brightness={float(color.get('brightness', 0)):.3f}"
             f":gamma={float(color.get('gamma', 1.0)):.3f}"]
    w = float(color.get("warmth", 0.0))
    if abs(w) > 0.005:
        a = clamp(w * 0.3, -0.3, 0.3)
        parts.append(f"colorbalance=rm={a:.3f}:gm={a * 0.2:.3f}:bm={-a:.3f}:rh={a * 0.6:.3f}:bh={-a * 0.6:.3f}")
    vig = float(color.get("vignette", 0.0))
    if vig > 0.01:
        parts.append(f"vignette=angle={0.25 + 0.6 * vig:.3f}")
    info.update({"saturation": round(S, 3), "contrast": round(C, 3), "warmth": w, "vignette": vig})
    return ",".join(parts), info


# ----------------------------------------------------------------------------- render
def render(scenes: list[TimelineScene], out: Path, W: int, H: int, fps: float, duration: float,
           audio: Path, vf: str, cwd: Path, crf: int, preset: str, watermark: str | None = None,
           shake: float = 0.0, grain: float = 0.0) -> dict:
    n = int(round(duration * fps))
    writer = ffmpeg.FrameWriter(out, W, H, fps, audio_path=audio, vf=vf, crf=crf, preset=preset,
                                duration=duration, cwd=cwd)
    grain_tile = None
    if grain > 0:
        grain_tile = np.random.default_rng(3).normal(0, 255 * grain * 0.06, (H + 64, W + 64, 1)).astype(np.int16)
    t0 = time.time()
    closed = set()
    last = None
    try:
        for i in range(n):
            t = i / fps
            active = [s for s in scenes if s.r0 <= t < s.r1] or [scenes[-1] if t >= scenes[-1].r0 else scenes[0]]
            frames = []
            for s in active[:2]:
                tau = t - s.r0
                p = tau / max(1e-6, s.r1 - s.r0)
                base = s.source.frame(tau)
                M = motion_matrix(s.motion, s.intensity, p, tau, s.source.size, s.source.margin, W, H, shake)
                frames.append(cv2.warpAffine(base, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT))
            if len(frames) == 2:
                inc = active[1]
                q = (t - inc.r0) / max(1e-6, inc.trans_dur) if inc.trans_dur > 0 else 1.0
                frame = blend(inc.trans_in, frames[0], frames[1], q)
            else:
                frame = frames[0]
            if grain_tile is not None:
                ox, oy = (i * 37) % 64, (i * 53) % 64
                frame = np.clip(frame.astype(np.int16) + grain_tile[oy:oy + H, ox:ox + W], 0, 255).astype(np.uint8)
            if watermark:
                cv2.putText(frame, watermark, (int(W * 0.04), int(H * 0.05)), cv2.FONT_HERSHEY_SIMPLEX,
                            W / 900, (255, 255, 255), max(1, W // 400), cv2.LINE_AA)
            writer.write(frame)
            last = frame
            for s in scenes:
                if s.number not in closed and s.r1 < t - 0.5:
                    s.source.close()
                    closed.add(s.number)
            if i and i % int(fps * 5) == 0:
                el = time.time() - t0
                say(f"rendered {i}/{n} frames ({i / el:.1f} fps, ~{(n - i) / max(1e-6, i / el):.0f}s left)")
    except Exception:
        writer.abort()
        for s in scenes:
            s.source.close()
        raise
    for s in scenes:
        s.source.close()
    writer.close()
    el = time.time() - t0
    return {"frames": n, "seconds": round(el, 1), "fps": round(n / max(1e-6, el), 1), "last_frame_ok": last is not None}
