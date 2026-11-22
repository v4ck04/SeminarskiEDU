"""Procedural, original visuals (no third-party footage).

Each generator renders animated frames at the output size. They are used
when the script asks for a generated visual (abstract/space backgrounds,
kinetic text cards) and for clearly-labelled placeholders when a requested
asset could not be found.
"""
from __future__ import annotations

import math
import textwrap

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .. import paths
from ..utils import hex_to_bgr

NAMES = ["starfield", "planet", "gradient_flow", "particles", "grid", "waves", "text_card", "screen", "signal", "static", "placeholder"]


def _palette(pal: list[str] | None) -> list[np.ndarray]:
    pal = pal or ["#070B1F", "#2B1660", "#7A2E8E", "#F0A35E"]
    return [np.array(hex_to_bgr(c), np.float32) for c in pal]


def fractal_noise(h: int, w: int, rng: np.random.Generator, octaves: int = 5) -> np.ndarray:
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gh, gw = max(2, h // (2 ** (octaves - o + 1))), max(2, w // (2 ** (octaves - o + 1)))
        g = rng.random((gh, gw)).astype(np.float32)
        out += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
        tot += amp
        amp *= 0.55
    out /= tot
    out -= out.min()
    return out / max(1e-6, out.max())


def _font(size: int, font_file: str = "Anton-Regular.ttf") -> ImageFont.FreeTypeFont:
    p = paths.fonts_dir() / font_file
    if not p.exists():
        p = next(iter(sorted(paths.fonts_dir().glob("*.ttf"))), None)
    return ImageFont.truetype(str(p), size) if p else ImageFont.load_default()


class Generator:
    def __init__(self, w: int, h: int, seed: int, palette: list[str] | None = None, text: str = "",
                 description: str = "", font_file: str = "Anton-Regular.ttf"):
        self.w, self.h = w, h
        self.rng = np.random.default_rng(seed)
        self.pal = _palette(palette)
        self.text, self.description, self.font_file = text, description, font_file
        self.setup()

    def setup(self):
        pass

    def frame(self, t: float) -> np.ndarray:  # pragma: no cover
        raise NotImplementedError


class Starfield(Generator):
    def setup(self):
        h, w = self.h, self.w
        sh, sw = h // 4, w // 4
        n1 = fractal_noise(sh, sw, self.rng)
        n2 = fractal_noise(sh, sw, self.rng)
        c0, c1, c2 = self.pal[0], self.pal[1], self.pal[2 % len(self.pal)]
        neb = (c0[None, None] * (1 - n1[..., None]) + c1[None, None] * n1[..., None]) * 0.9
        neb += c2[None, None] * np.clip(n2 - 0.55, 0, 1)[..., None] * 1.6
        neb *= (0.45 + 0.75 * fractal_noise(sh, sw, self.rng, 4))[..., None]
        neb += 10.0
        big = cv2.resize(np.clip(neb, 0, 255).astype(np.uint8), (int(w * 1.25), int(h * 1.25)), interpolation=cv2.INTER_CUBIC)
        self.neb = cv2.GaussianBlur(big, (0, 0), 3)
        self.layers = []
        for n, size, speed in ((380, 1, 8), (160, 2, 18), (45, 3, 34)):
            self.layers.append({
                "x": self.rng.uniform(0, w, n), "y": self.rng.uniform(0, h, n),
                "b": self.rng.uniform(120, 255, n), "ph": self.rng.uniform(0, 6.28, n),
                "f": self.rng.uniform(0.5, 2.5, n), "size": size, "speed": speed})

    def background(self, t: float) -> np.ndarray:
        dx, dy = -6 * t, -10 * t
        bh, bw = self.neb.shape[:2]
        M = np.float32([[1, 0, -(bw - self.w) / 2 + dx], [0, 1, -(bh - self.h) / 2 + dy]])
        return cv2.warpAffine(self.neb, M, (self.w, self.h), borderMode=cv2.BORDER_REFLECT)

    def stars(self, img: np.ndarray, t: float) -> None:
        for L in self.layers:
            ys = (L["y"] - L["speed"] * t) % self.h
            tw = L["b"] * (0.75 + 0.25 * np.sin(L["ph"] + L["f"] * t * 2))
            for x, y, b in zip(L["x"].astype(int), ys.astype(int), tw.astype(int)):
                c = (int(b), int(b), int(min(255, b * 1.05)))
                if L["size"] == 1:
                    img[y % self.h, x % self.w] = c
                else:
                    cv2.circle(img, (int(x), int(y)), L["size"] - 1, c, -1, cv2.LINE_AA)
                    if L["size"] >= 3:
                        cv2.circle(img, (int(x), int(y)), L["size"] + 2, (int(b * .25),) * 3, 1, cv2.LINE_AA)

    def frame(self, t):
        img = self.background(t)
        self.stars(img, t)
        return img


class Planet(Starfield):
    def setup(self):
        super().setup()
        r = int(self.w * 0.42)
        self.r = r
        size = 2 * r
        yy, xx = np.mgrid[-r:r, -r:r].astype(np.float32) + 0.5
        d2 = (xx ** 2 + yy ** 2) / r ** 2
        self.mask = (d2 <= 1).astype(np.float32)
        z = np.sqrt(np.clip(1 - d2, 0, 1))
        lon = np.arctan2(xx / r, z)
        lat = np.arcsin(np.clip(yy / r, -1, 1))
        tex_w, tex_h = 1024, 512
        n = fractal_noise(tex_h, tex_w, self.rng, 6)
        bands = 0.5 + 0.5 * np.sin(np.linspace(0, 18, tex_h))[:, None] * 0.6
        tex = np.clip(0.55 * n + 0.45 * bands, 0, 1)
        ca, cb = self.pal[2 % len(self.pal)], self.pal[3 % len(self.pal)]
        self.tex = (ca[None, None] * (1 - tex[..., None]) + cb[None, None] * tex[..., None]).astype(np.float32)
        self.tex = np.concatenate([self.tex, self.tex], axis=1)
        self.mx = ((lon / np.pi + 0.5) * tex_w * 0.5).astype(np.float32)
        self.my = ((lat / np.pi + 0.5) * (tex_h - 1)).astype(np.float32)
        light = np.clip(0.15 + 0.85 * (-0.55 * xx / r - 0.35 * yy / r + 0.75 * z), 0.05, 1.0)
        self.light = (light * self.mask)[..., None]
        rim = np.clip(1 - np.abs(np.sqrt(d2) - 1) * 18, 0, 1) * (np.sqrt(d2) > 0.9)
        self.glow = rim[..., None] * np.array([255, 200, 140], np.float32)[None, None] * 0.5
        self.cx, self.cy = self.w // 2, int(self.h * 0.55)
        self.size = size

    def frame(self, t):
        img = super().frame(t)
        shift = (t * 18.0) % (self.tex.shape[1] / 2)
        surf = cv2.remap(self.tex, self.mx + shift, self.my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        planet = surf * self.light + self.glow
        x0, y0 = self.cx - self.r, self.cy - self.r
        x1, y1 = x0 + self.size, y0 + self.size
        cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(self.w, x1), min(self.h, y1)
        m = np.clip(self.mask + (self.glow[..., 0] > 1) * 0.6, 0, 1)[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0, None]
        roi = img[cy0:cy1, cx0:cx1].astype(np.float32)
        p = planet[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
        img[cy0:cy1, cx0:cx1] = np.clip(roi * (1 - m) + p * m, 0, 255).astype(np.uint8)
        return img


class GradientFlow(Generator):
    def setup(self):
        self.sw, self.sh = 135, 240
        self.blobs = [{"c": self.pal[(i + 1) % len(self.pal)], "fx": self.rng.uniform(0.05, 0.15),
                       "fy": self.rng.uniform(0.04, 0.12), "px": self.rng.uniform(0, 6.28), "py": self.rng.uniform(0, 6.28),
                       "r": self.rng.uniform(0.35, 0.6)} for i in range(4)]
        yy, xx = np.mgrid[0:self.sh, 0:self.sw].astype(np.float32)
        self.xx, self.yy = xx / self.sw, yy / self.sh
        self.grain = (self.rng.normal(0, 4, (self.h, self.w, 1))).astype(np.float32)

    def frame(self, t):
        img = np.zeros((self.sh, self.sw, 3), np.float32) + self.pal[0][None, None]
        for b in self.blobs:
            cx = 0.5 + 0.38 * math.sin(b["px"] + 2 * math.pi * b["fx"] * t)
            cy = 0.5 + 0.38 * math.sin(b["py"] + 2 * math.pi * b["fy"] * t)
            g = np.exp(-(((self.xx - cx) * 1.0) ** 2 + ((self.yy - cy) * 0.6) ** 2) / (b["r"] ** 2 * 0.25))
            img += g[..., None] * (b["c"][None, None] - img) * 0.85
        big = cv2.resize(img, (self.w, self.h), interpolation=cv2.INTER_CUBIC) + self.grain
        return np.clip(big, 0, 255).astype(np.uint8)


class Particles(Generator):
    def setup(self):
        self.bg = GradientFlow(self.w // 2, self.h // 2, int(self.rng.integers(1e6)), None)
        self.bg.pal = [p * 0.45 for p in self.pal]
        self.bg.setup()      # rebuild the blobs with the project palette (setup ran with the default one)
        self.n = 70
        self.x = self.rng.uniform(0, self.w // 2, self.n)
        self.y = self.rng.uniform(0, self.h // 2, self.n)
        self.r = self.rng.uniform(3, 22, self.n)
        self.v = self.rng.uniform(4, 20, self.n)
        self.a = self.rng.uniform(0.15, 0.6, self.n)
        # muted, palette-derived dust (bright pastel orbs looked like a fantasy scene, not dust)
        self.col = [self.pal[int(i) % len(self.pal)] * 0.45 + 55 for i in self.rng.integers(1, 4, self.n)]

    def frame(self, t):
        base = self.bg.frame(t).astype(np.float32)
        layer = np.zeros_like(base)
        hh = self.h // 2
        for i in range(self.n):
            y = (self.y[i] - self.v[i] * t) % hh
            x = self.x[i] + 6 * math.sin(t * 0.5 + i)
            cv2.circle(layer, (int(x), int(y)), int(self.r[i]), tuple(float(c) * self.a[i] for c in self.col[i]), -1, cv2.LINE_AA)
        layer = cv2.GaussianBlur(layer, (0, 0), 4)
        out = np.clip(base + layer, 0, 255).astype(np.uint8)
        return cv2.resize(out, (self.w, self.h), interpolation=cv2.INTER_CUBIC)


class Grid(Generator):
    def frame(self, t):
        w, h = self.w // 2, self.h // 2
        img = np.zeros((h, w, 3), np.float32)
        top, bot = self.pal[0], self.pal[1] * 0.6
        ramp = np.linspace(0, 1, h)[:, None, None]
        img[:] = top * (1 - ramp) + bot * ramp
        hor = int(h * 0.42)
        col = tuple(float(c) for c in (self.pal[2 % len(self.pal)] * 0.6 + 100))
        lines = np.zeros_like(img)
        vx = w / 2
        for k in range(-12, 13):
            cv2.line(lines, (int(vx), hor), (int(vx + k * w * 0.22), h), col, 1, cv2.LINE_AA)
        off = (t * 0.6) % 1.0
        for k in range(0, 18):
            z = (k + 1 - off)
            y = hor + (h - hor) * (1 / (1 + 6 / max(0.05, z)))
            cv2.line(lines, (0, int(y)), (w, int(y)), col, 1, cv2.LINE_AA)
        glow = cv2.GaussianBlur(lines, (0, 0), 6)
        sun = np.zeros_like(img)
        cv2.circle(sun, (int(vx), hor), int(w * 0.18), tuple(float(c) for c in self.pal[3 % len(self.pal)]), -1, cv2.LINE_AA)
        sun = cv2.GaussianBlur(sun, (0, 0), 14)
        out = np.clip(img + lines + glow * 1.5 + sun * 0.8, 0, 255).astype(np.uint8)
        return cv2.resize(out, (self.w, self.h), interpolation=cv2.INTER_CUBIC)


class Waves(Generator):
    def frame(self, t):
        w, h = self.w // 2, self.h // 2
        img = np.zeros((h, w, 3), np.uint8)
        img[:] = self.pal[0].astype(np.uint8)
        xs = np.arange(0, w + 8, 8)
        for k in range(5):
            base = h * (0.45 + 0.1 * k)
            amp = h * (0.03 + 0.012 * k)
            ys = base + amp * np.sin(xs / w * 2 * math.pi * (1.2 + 0.3 * k) + t * (0.6 + 0.25 * k) + k)
            pts = np.array([[0, h]] + [[int(x), int(y)] for x, y in zip(xs, ys)] + [[w, h]], np.int32)
            c = self.pal[(k % (len(self.pal) - 1)) + 1] * (0.55 + 0.1 * k)
            cv2.fillPoly(img, [pts], tuple(int(min(255, v)) for v in c), cv2.LINE_AA)
        return cv2.resize(img, (self.w, self.h), interpolation=cv2.INTER_CUBIC)


class TextCard(Generator):
    def setup(self):
        self.bg = GradientFlow(self.w, self.h, int(self.rng.integers(1e6)), None)
        self.bg.pal = [p * 0.55 for p in self.pal]
        self.bg.setup()
        text = (self.text or self.description or "").upper().strip() or " "
        lines = textwrap.wrap(text, width=12) or [text]
        size = int(self.w * 0.2)
        while size > 40:
            f = _font(size, self.font_file)
            widest = max(f.getbbox(l)[2] for l in lines)
            if widest <= self.w * 0.84:
                break
            size -= 6
        f = _font(size, self.font_file)
        lh = int(size * 1.08)
        img = Image.new("RGBA", (self.w, lh * len(lines) + 40), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for i, l in enumerate(lines):
            tw = f.getbbox(l)[2]
            d.text(((self.w - tw) / 2, 20 + i * lh), l, font=f, fill=(255, 255, 255, 255),
                   stroke_width=max(3, size // 22), stroke_fill=(0, 0, 0, 255))
        a = np.asarray(img).astype(np.float32)
        self.txt = a[..., :3][..., ::-1]
        self.alpha = a[..., 3:] / 255.0
        # upper third, clear of the caption zone (~0.55-0.70 of the height)
        self.y0 = max(0, int(self.h * 0.30) - a.shape[0] // 2)

    def frame(self, t):
        img = self.bg.frame(t).astype(np.float32)
        y0, y1 = self.y0, self.y0 + self.txt.shape[0]
        img[y0:y1] = img[y0:y1] * (1 - self.alpha) + self.txt * self.alpha
        return np.clip(img, 0, 255).astype(np.uint8)


class Screen(Generator):
    """A dark monitor / clock display: glowing monospace text in the scene (upper third, clear of
    the captions), scanlines, soft glow, flicker and a blinking cursor."""

    def setup(self):
        w, h = self.w, self.h
        bg = np.zeros((h, w, 3), np.float32) + self.pal[0][None, None] * 0.9
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h * 0.32) / (h * 0.55)) ** 2)
        bg += (self.pal[1][None, None] * 0.55) * np.clip(1 - r, 0, 1)[..., None]
        self.scan = (0.82 + 0.18 * (np.arange(h) % 4 < 2)).astype(np.float32)[:, None, None]
        text = (self.text or self.description or "").strip() or " "
        lines = textwrap.wrap(text, width=16) or [text]
        size = int(w * 0.26)
        while size > 28:
            f = _font(size, "VT323-Regular.ttf")
            if max(f.getbbox(l)[2] for l in lines) <= w * 0.82:
                break
            size -= 4
        f = _font(size, "VT323-Regular.ttf")
        lh = int(size * 1.0)
        img = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(img)
        y0 = int(h * 0.30) - lh * len(lines) // 2
        last_box = (0, 0, 0, 0)
        for i, l in enumerate(lines):
            tw = f.getbbox(l)[2]
            x0 = (w - tw) / 2
            d.text((x0, y0 + i * lh), l, font=f, fill=255)
            last_box = (int(x0 + tw + size * 0.12), y0 + i * lh + int(size * 0.18), int(size * 0.45), int(size * 0.75))
        a = np.asarray(img).astype(np.float32) / 255.0
        col = self.pal[3 % len(self.pal)].astype(np.float32)
        self.text_layer = a[..., None] * col[None, None]
        small = cv2.resize(a, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
        glow = cv2.resize(cv2.GaussianBlur(small, (0, 0), 6), (w, h), interpolation=cv2.INTER_CUBIC)
        self.glow_layer = glow[..., None] * col[None, None] * 1.6
        self.bg = bg
        self.cursor = last_box

    def frame(self, t):
        flick = 0.92 + 0.08 * math.sin(t * 37.0) * math.sin(t * 11.0 + 1.3)
        img = self.bg + (self.text_layer + self.glow_layer) * flick
        if int(t * 2) % 2 == 0:
            x, y, cw, ch = self.cursor
            img[y:y + ch, x:x + cw] += self.pal[3 % len(self.pal)][None, None] * 0.9
        img *= self.scan
        return np.clip(img, 0, 255).astype(np.uint8)


class Signal(Generator):
    """Oscilloscope / radio receiver display: grid and a glowing, voice-like waveform."""

    def setup(self):
        w, h = self.w // 2, self.h // 2
        self.sw, self.sh = w, h
        bg = np.zeros((h, w, 3), np.float32) + self.pal[0][None, None]
        grid = np.zeros((h, w), np.float32)
        for x in range(0, w, max(8, w // 10)):
            grid[:, x] = 1
        for y in range(0, h, max(8, w // 10)):
            grid[y, :] = 1
        self.bg = bg + grid[..., None] * (self.pal[1][None, None] * 0.9 + 12)
        self.col = self.pal[3 % len(self.pal)].astype(np.float32)
        self.ph = self.rng.uniform(0, 6.28, 6)

    def frame(self, t):
        w, h = self.sw, self.sh
        xs = np.arange(w, dtype=np.float32)
        env = 0.35 + 0.65 * abs(math.sin(t * 2.3 + self.ph[0])) * (0.6 + 0.4 * math.sin(t * 5.1 + self.ph[1]))
        y = sum(math.sin(t * f + p) * np.sin(xs / w * k * 2 * math.pi + t * f * 0.7 + p)
                for f, k, p in zip((3.1, 7.3, 13.7), (2.0, 5.0, 11.0), self.ph[2:5]))
        y = y / 3.0 * env + 0.08 * np.sin(xs * 0.9 + t * 40)
        yc = h * 0.42
        pts = np.stack([xs, yc + y * h * 0.13], axis=1).astype(np.int32)
        line = np.zeros((h, w), np.float32)
        cv2.polylines(line, [pts], False, 1.0, 2, cv2.LINE_AA)
        glow = cv2.GaussianBlur(line, (0, 0), 5) * 2.2
        img = self.bg + (line + glow)[..., None] * self.col[None, None]
        out = cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (self.w, self.h), interpolation=cv2.INTER_LINEAR)
        return out


class Static(Generator):
    """Analogue radio/TV static: coarse noise, scanlines, rolling bar, dark tint."""

    def setup(self):
        self.bw, self.bh = max(2, self.w // 4), max(2, self.h // 4)
        self.tint = (self.pal[1] * 0.6 + 40).astype(np.float32)
        self.scan = (0.75 + 0.25 * (np.arange(self.h) % 3 == 0)).astype(np.float32)[:, None, None]

    def frame(self, t):
        rng = np.random.default_rng(int(t * 1000) % (2 ** 31))
        n = rng.random((self.bh, self.bw)).astype(np.float32)
        n = cv2.resize(n, (self.w, self.h), interpolation=cv2.INTER_NEAREST)
        img = n[..., None] * (self.tint[None, None] * 1.6)
        bar = int((t * 0.35 % 1.0) * self.h)
        img[max(0, bar - 40):bar + 40] *= 1.35
        img *= self.scan
        return np.clip(img, 0, 255).astype(np.uint8)


class Placeholder(Generator):
    """Deliberately obvious stand-in for a missing asset."""

    def setup(self):
        img = Image.new("RGB", (self.w, self.h), (38, 38, 44))
        d = ImageDraw.Draw(img)
        step = max(20, self.w // 14)
        for k in range(-self.h, self.w + self.h, step):
            d.line([(k, 0), (k + self.h, self.h)], fill=(52, 52, 60), width=step // 3)
        f1 = _font(max(24, self.w // 6), "Anton-Regular.ttf")
        f2 = _font(max(14, self.w // 15), "Poppins-Bold.ttf")
        d.text((self.w * 0.08, self.h * 0.12), "PLACEHOLDER", font=f1, fill=(255, 196, 0),
               stroke_width=max(2, self.w // 200), stroke_fill=(0, 0, 0))
        y = self.h * 0.12 + self.w // 4.5
        for line in textwrap.wrap("missing: " + (self.description or self.text or "asset"), 22)[:9]:
            d.text((self.w * 0.08, y), line, font=f2, fill=(235, 235, 235))
            y += self.w // 11
        self.img = np.asarray(img)[..., ::-1].copy()

    def frame(self, t):
        return self.img.copy()


CLASSES = {"starfield": Starfield, "planet": Planet, "gradient_flow": GradientFlow, "particles": Particles,
           "grid": Grid, "waves": Waves, "text_card": TextCard, "screen": Screen, "signal": Signal, "static": Static,
           "placeholder": Placeholder}


def create(name: str, w: int, h: int, seed: int, palette: list[str] | None = None, text: str = "",
           description: str = "", font_file: str = "Anton-Regular.ttf") -> Generator:
    cls = CLASSES.get(name) or GradientFlow
    return cls(w, h, seed, palette, text=text, description=description, font_file=font_file)


def render_still(name: str, path, w: int = 1080, h: int = 1920, seed: int = 1, **kw) -> None:
    g = create(name, w, h, seed, **kw)
    cv2.imwrite(str(path), g.frame(1.0))
