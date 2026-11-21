"""Representative frame extraction and contact sheets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .. import ffmpeg, paths
from ..utils import fmt_time


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("Poppins-Bold.ttf", "Poppins-ExtraBold.ttf"):
        p = paths.fonts_dir() / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def extract_frame(video: str | Path, t: float, out: Path, width: int = 540) -> Path | None:
    out.parent.mkdir(parents=True, exist_ok=True)
    proc = ffmpeg.ffmpeg(["-y", "-v", "error", "-ss", f"{max(0.0, t):.3f}", "-i", str(video), "-frames:v", "1",
                          "-vf", f"scale={width}:-2", "-q:v", "3", str(out)], check=False)
    return out if proc.returncode == 0 and out.exists() else None


def contact_sheet(items: list[tuple[Path, str]], out: Path, cols: int = 6, thumb_w: int = 180,
                  title: str | None = None) -> Path | None:
    imgs = []
    for p, label in items:
        try:
            im = Image.open(p).convert("RGB")
        except Exception:
            continue
        r = thumb_w / im.width
        imgs.append((im.resize((thumb_w, max(1, int(im.height * r)))), label))
    if not imgs:
        return None
    th = max(im.height for im, _ in imgs)
    label_h = 22
    top = 36 if title else 0
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (thumb_w + 6) + 6, top + rows * (th + label_h + 6) + 6), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    f = _font(14)
    if title:
        d.text((8, 8), title, fill=(240, 240, 240), font=_font(18))
    for i, (im, label) in enumerate(imgs):
        r, c = divmod(i, cols)
        x, y = 6 + c * (thumb_w + 6), top + 6 + r * (th + label_h + 6)
        sheet.paste(im, (x, y))
        d.text((x + 2, y + th + 3), label, fill=(220, 220, 220), font=f)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)
    return out


def build_sheets(video: str | Path, vid_id: str, duration: float, shots: list[dict],
                 caption_segments: list[dict], max_frames: int = 60, cols: int = 6) -> dict:
    out_dir = paths.frames_dir() / vid_id
    out_dir.mkdir(parents=True, exist_ok=True)
    result: dict = {"dir": str(out_dir), "shot_frames": [], "sheets": {}}
    # shot midpoints (evenly subsampled if many shots)
    sel = shots
    if len(shots) > max_frames:
        step = len(shots) / max_frames
        sel = [shots[int(i * step)] for i in range(max_frames)]
    items = []
    for sh in sel:
        t = (sh["start"] + sh["end"]) / 2
        p = extract_frame(video, t, out_dir / f"shot_{sh['index']:03d}_{t:07.2f}s.jpg")
        if p:
            items.append((p, f"#{sh['index']} {fmt_time(t)} ({sh['duration']:.1f}s)"))
            result["shot_frames"].append({"shot": sh["index"], "time": round(t, 3), "file": p.name})
    s = contact_sheet(items, out_dir / "contact_shots.jpg", cols=cols, title=f"{vid_id} - one frame per shot")
    if s:
        result["sheets"]["shots"] = s.name
    # one frame per second (capped)
    n = int(min(duration, max_frames))
    times = [i + 0.5 for i in range(n)] if duration >= 1 else [duration / 2]
    items = []
    for t in times:
        p = extract_frame(video, t, out_dir / "timeline" / f"t_{t:07.2f}s.jpg", width=270)
        if p:
            items.append((p, fmt_time(t)))
    s = contact_sheet(items, out_dir / "contact_timeline.jpg", cols=10, thumb_w=120, title=f"{vid_id} - 1 frame/second")
    if s:
        result["sheets"]["timeline"] = s.name
    # caption crops
    items = []
    for k, seg in enumerate(caption_segments[:40]):
        t = (seg["start"] + seg["end"]) / 2
        p = extract_frame(video, t, out_dir / "captions" / f"cap_{k:03d}.jpg", width=1080)
        if not p:
            continue
        try:
            im = Image.open(p)
            H, W = im.height, im.width
            cy, hh = seg["cy"] * H, max(seg["text_h"] * H * (2.6 + 1.6 * (seg.get("lines", 1) - 1)), 40)
            crop = im.crop((0, max(0, int(cy - hh)), W, min(H, int(cy + hh))))
            cp = out_dir / "captions" / f"crop_{k:03d}.jpg"
            crop.save(cp, quality=90)
            items.append((cp, f"{fmt_time(seg['start'])}-{fmt_time(seg['end'])}"))
        except Exception:
            continue
    s = contact_sheet(items, out_dir / "contact_captions.jpg", cols=2, thumb_w=540, title=f"{vid_id} - caption crops")
    if s:
        result["sheets"]["captions"] = s.name
    return result
