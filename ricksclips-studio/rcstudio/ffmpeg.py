"""FFmpeg / FFprobe wrappers.

FFmpeg is the rendering and decoding backbone. Everything goes through
argument lists (never a shell) so paths with spaces work on Windows.
"""
from __future__ import annotations

import glob
import json
import os
import re
import shutil
import subprocess
import threading
import wave
from functools import lru_cache
from pathlib import Path
from typing import Iterator

import numpy as np

from . import log
from .config import load_settings
from .utils import StudioError, run

_log = log.get("ffmpeg")


def _windows_candidates(name: str) -> list[str]:
    exe = name + ".exe"
    local = os.environ.get("LOCALAPPDATA", "")
    pats = [
        os.path.join(local, "Microsoft", "WinGet", "Links", exe),
        os.path.join(local, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "*", "bin", exe),
        os.path.join(local, "Microsoft", "WinGet", "Packages", "BtbN.FFmpeg*", "*", "bin", exe),
        os.path.join("C:\\ProgramData", "chocolatey", "bin", exe),
        os.path.join("C:\\ffmpeg", "bin", exe),
        os.path.join(os.environ.get("ProgramFiles", "C:\\Program Files"), "ffmpeg", "bin", exe),
        os.path.join(os.environ.get("USERPROFILE", ""), "scoop", "shims", exe),
    ]
    out = []
    for p in pats:
        out.extend(sorted(glob.glob(p)))
    return out


@lru_cache(maxsize=4)
def _find(name: str) -> str | None:
    cfg = load_settings().get("ffmpeg", {})
    configured = cfg.get(f"{name}_path") or os.environ.get(f"RCSTUDIO_{name.upper()}")
    if configured and Path(configured).exists():
        return str(configured)
    found = shutil.which(name)
    if found:
        return found
    if os.name == "nt":
        for c in _windows_candidates(name):
            if Path(c).exists():
                return c
    return None


def ffmpeg_bin() -> str:
    b = _find("ffmpeg")
    if not b:
        raise StudioError("FFmpeg was not found. Install it (Windows: `winget install Gyan.FFmpeg`) "
                          "or set ffmpeg.ffmpeg_path in config/settings.json.")
    return b


def ffprobe_bin() -> str:
    b = _find("ffprobe")
    if not b:
        raise StudioError("FFprobe was not found (it ships with FFmpeg). Set ffmpeg.ffprobe_path in config/settings.json.")
    return b


def available() -> bool:
    return _find("ffmpeg") is not None and _find("ffprobe") is not None


@lru_cache(maxsize=1)
def version() -> str:
    out = run([ffmpeg_bin(), "-hide_banner", "-version"]).stdout.decode("utf-8", "replace")
    return out.splitlines()[0] if out else "unknown"


@lru_cache(maxsize=1)
def filters() -> frozenset[str]:
    out = run([ffmpeg_bin(), "-hide_banner", "-filters"]).stdout.decode("utf-8", "replace")
    names = set()
    for line in out.splitlines():
        m = re.match(r"^\s*[TSC.]{3}\s+(\S+)\s", line)
        if m:
            names.add(m.group(1))
    return frozenset(names)


@lru_cache(maxsize=1)
def encoders() -> frozenset[str]:
    out = run([ffmpeg_bin(), "-hide_banner", "-encoders"]).stdout.decode("utf-8", "replace")
    names = set()
    for line in out.splitlines():
        m = re.match(r"^\s*[VAS][F.][S.][X.][B.][D.]\s+(\S+)\s", line)
        if m:
            names.add(m.group(1))
    return frozenset(names)


def has_filter(name: str) -> bool:
    return name in filters()


def has_encoder(name: str) -> bool:
    return name in encoders()


def ffmpeg(args: list[str], *, cwd: str | Path | None = None, timeout: float | None = None,
           check: bool = True) -> subprocess.CompletedProcess:
    return run([ffmpeg_bin(), "-hide_banner", "-nostdin", *args], cwd=cwd, timeout=timeout, check=check)


# --- probing ----------------------------------------------------------------------
def probe_raw(path: str | Path) -> dict:
    p = Path(path)
    if not p.exists():
        raise StudioError(f"File not found: {p}")
    out = run([ffprobe_bin(), "-v", "error", "-print_format", "json", "-show_format",
               "-show_streams", str(p)]).stdout
    return json.loads(out.decode("utf-8", "replace") or "{}")


def _ratio(s: str | None) -> float:
    if not s or s in ("0/0", "N/A"):
        return 0.0
    if "/" in s:
        a, b = s.split("/", 1)
        try:
            return float(a) / float(b) if float(b) else 0.0
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def media_info(path: str | Path) -> dict:
    """Summarised stream information (rotation-aware display size)."""
    raw = probe_raw(path)
    fmt = raw.get("format", {})
    info: dict = {
        "path": str(path),
        "container": fmt.get("format_name"),
        "duration": float(fmt.get("duration") or 0.0),
        "size_bytes": int(fmt.get("size") or 0),
        "bit_rate": int(fmt.get("bit_rate") or 0),
        "video": None,
        "audio": None,
    }
    for s in raw.get("streams", []):
        if s.get("codec_type") == "video" and info["video"] is None and s.get("disposition", {}).get("attached_pic", 0) == 0:
            w, h = int(s.get("width") or 0), int(s.get("height") or 0)
            rot = 0
            for sd in s.get("side_data_list", []) or []:
                if "rotation" in sd:
                    rot = int(float(sd["rotation"]))
            if "rotate" in (s.get("tags") or {}):
                rot = int(float(s["tags"]["rotate"]))
            dw, dh = (h, w) if abs(rot) % 180 == 90 else (w, h)
            fps = _ratio(s.get("avg_frame_rate")) or _ratio(s.get("r_frame_rate"))
            sar = s.get("sample_aspect_ratio") or "1:1"
            sar_v = _ratio(sar.replace(":", "/")) or 1.0
            info["video"] = {
                "codec": s.get("codec_name"),
                "profile": s.get("profile"),
                "width": w, "height": h,
                "display_width": int(round(dw * (sar_v if abs(rot) % 180 != 90 else 1))),
                "display_height": dh,
                "rotation": rot,
                "fps": round(fps, 3),
                "r_frame_rate": s.get("r_frame_rate"),
                "avg_frame_rate": s.get("avg_frame_rate"),
                "nb_frames": int(s["nb_frames"]) if str(s.get("nb_frames", "")).isdigit() else None,
                "pix_fmt": s.get("pix_fmt"),
                "sar": sar,
                "dar": s.get("display_aspect_ratio"),
                "duration": float(s.get("duration") or info["duration"] or 0.0),
                "bit_rate": int(s.get("bit_rate") or 0),
                "color_space": s.get("color_space"),
                "color_range": s.get("color_range"),
                "start_time": float(s.get("start_time") or 0.0),
            }
        elif s.get("codec_type") == "audio" and info["audio"] is None:
            info["audio"] = {
                "codec": s.get("codec_name"),
                "sample_rate": int(s.get("sample_rate") or 0),
                "channels": int(s.get("channels") or 0),
                "channel_layout": s.get("channel_layout"),
                "duration": float(s.get("duration") or info["duration"] or 0.0),
                "bit_rate": int(s.get("bit_rate") or 0),
                "start_time": float(s.get("start_time") or 0.0),
            }
    return info


# --- audio ----------------------------------------------------------------------------
def decode_audio(path: str | Path, sr: int = 16000, mono: bool = True,
                 start: float | None = None, duration: float | None = None) -> np.ndarray:
    """Decode to float32 numpy. Mono -> shape (n,), stereo -> (n, 2). Empty if no audio."""
    args = ["-v", "error"]
    if start:
        args += ["-ss", f"{start:.3f}"]
    args += ["-i", str(path)]
    if duration:
        args += ["-t", f"{duration:.3f}"]
    args += ["-vn", "-sn", "-ac", "1" if mono else "2", "-ar", str(sr), "-f", "f32le", "-"]
    proc = ffmpeg(args, check=False)
    data = np.frombuffer(proc.stdout or b"", dtype=np.float32).copy()
    if proc.returncode != 0 and data.size == 0:
        err = (proc.stderr or b"").decode("utf-8", "replace")
        if "does not contain any stream" in err or "matches no streams" in err or "Output file #0 does not contain" in err:
            return np.zeros(0, dtype=np.float32)
        raise StudioError(f"Audio decode failed for {path}: {err.strip()[-400:]}")
    if not mono:
        data = data[: data.size // 2 * 2].reshape(-1, 2)
    return data


def write_wav(path: str | Path, data: np.ndarray, sr: int) -> Path:
    """Write float audio (-1..1) as 16-bit PCM WAV. data: (n,) or (n, ch)."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    a = np.asarray(data, dtype=np.float64)
    if a.ndim == 1:
        a = a[:, None]
    pcm = np.clip(np.round(a * 32767.0), -32768, 32767).astype("<i2")
    with wave.open(str(p), "wb") as w:
        w.setnchannels(pcm.shape[1])
        w.setsampwidth(2)
        w.setframerate(int(sr))
        w.writeframes(pcm.tobytes())
    return p


def loudness(path: str | Path, target_i: float = -14.0, target_tp: float = -1.0,
             pre_filter: str | None = None) -> dict:
    """EBU R128 measurement via loudnorm (first pass)."""
    af = f"loudnorm=I={target_i}:TP={target_tp}:LRA=11:print_format=json"
    if pre_filter:
        af = pre_filter + "," + af
    proc = ffmpeg(["-i", str(path), "-vn", "-af", af, "-f", "null", "-"], check=False)
    err = (proc.stderr or b"").decode("utf-8", "replace")
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", err, flags=re.S)
    if not m:
        raise StudioError(f"Loudness measurement failed for {path}: {err.strip()[-300:]}")
    d = json.loads(m[-1])

    def f(k):
        try:
            return float(d.get(k))
        except (TypeError, ValueError):
            return float("-inf")

    return {
        "integrated_lufs": f("input_i"),
        "true_peak_db": f("input_tp"),
        "lra": f("input_lra"),
        "threshold": f("input_thresh"),
        "target_offset": f("target_offset"),
        "raw": d,
    }


def null_run(path: str | Path, vf: str | None = None, af: str | None = None,
             extra_in: list[str] | None = None) -> str:
    """Run a detection filter over a file and return stderr text."""
    args = list(extra_in or []) + ["-i", str(path)]
    if vf:
        args += ["-vf", vf]
    else:
        args += ["-vn"]
    if af:
        args += ["-af", af]
    elif vf:
        args += ["-an"]
    args += ["-f", "null", "-"]
    proc = ffmpeg(args, check=False)
    return (proc.stderr or b"").decode("utf-8", "replace")


# --- frame pipes ------------------------------------------------------------------------
class _Drain(threading.Thread):
    def __init__(self, stream):
        super().__init__(daemon=True)
        self.stream = stream
        self.buf = bytearray()

    def run(self):
        for chunk in iter(lambda: self.stream.read(4096), b""):
            if len(self.buf) < 1_000_000:
                self.buf.extend(chunk)

    def text(self) -> str:
        return self.buf.decode("utf-8", "replace")


class FrameReader:
    """Decode frames as BGR numpy arrays at a fixed size (and optional fps)."""

    def __init__(self, path: str | Path, width: int, height: int, fps: float | None = None,
                 start: float | None = None, duration: float | None = None,
                 vf_pre: str | None = None, speed: float = 1.0, loop: bool = False):
        self.w, self.h = int(width), int(height)
        self.frame_bytes = self.w * self.h * 3
        vf = []
        if vf_pre:
            vf.append(vf_pre)
        if speed and abs(speed - 1.0) > 1e-3:
            vf.append(f"setpts=PTS/{speed:.4f}")
        if fps:
            vf.append(f"fps={fps}")
        if not vf_pre or "scale" not in vf_pre:
            vf.append(f"scale={self.w}:{self.h}:flags=bicubic")
        vf.append("format=bgr24")
        args = [ffmpeg_bin(), "-hide_banner", "-nostdin", "-v", "error"]
        if loop:
            args += ["-stream_loop", "-1"]
        if start:
            args += ["-ss", f"{start:.3f}"]
        args += ["-i", str(path)]
        if duration:
            args += ["-t", f"{duration:.3f}"]
        args += ["-an", "-sn", "-vf", ",".join(vf), "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
        _log.debug("FrameReader: %s", " ".join(args))
        self.proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=10 ** 7)
        self._drain = _Drain(self.proc.stderr)
        self._drain.start()
        self.count = 0
        self.closed = False

    def read(self) -> np.ndarray | None:
        if self.closed:
            return None
        buf = bytearray(self.frame_bytes)
        view = memoryview(buf)
        got = 0
        while got < self.frame_bytes:
            n = self.proc.stdout.readinto(view[got:])
            if not n:
                break
            got += n
        if got < self.frame_bytes:
            return None
        self.count += 1
        return np.frombuffer(buf, dtype=np.uint8).reshape(self.h, self.w, 3)

    def __iter__(self) -> Iterator[np.ndarray]:
        while True:
            f = self.read()
            if f is None:
                break
            yield f
        self.close()

    def close(self) -> None:
        if self.closed:
            return
        self.closed = True
        try:
            self.proc.stdout.close()
        except Exception:
            pass
        try:
            self.proc.terminate()
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()

    def errors(self) -> str:
        return self._drain.text()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


class FrameWriter:
    """Encode BGR frames piped from Python, optionally muxing an audio file."""

    def __init__(self, out_path: str | Path, width: int, height: int, fps: float,
                 audio_path: str | Path | None = None, vf: str | None = None,
                 crf: int = 18, preset: str = "medium", codec: str = "libx264",
                 audio_codec: str = "aac", audio_bitrate: str = "192k", sample_rate: int = 48000,
                 duration: float | None = None, cwd: str | Path | None = None,
                 pix_fmt: str = "yuv420p"):
        self.out_path = Path(out_path)
        self.out_path.parent.mkdir(parents=True, exist_ok=True)
        self.w, self.h = int(width), int(height)
        args = [ffmpeg_bin(), "-hide_banner", "-nostdin", "-y", "-v", "error",
                "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{self.w}x{self.h}", "-r", str(fps), "-i", "-"]
        if audio_path:
            args += ["-i", str(Path(audio_path).resolve())]
        args += ["-map", "0:v:0"]
        if audio_path:
            args += ["-map", "1:a:0"]
        vchain = [vf] if vf else []
        vchain.append(f"format={pix_fmt}")
        args += ["-vf", ",".join(vchain)]
        args += ["-c:v", codec]
        if codec == "libx264":
            args += ["-preset", preset, "-crf", str(crf), "-profile:v", "high", "-level:v", "4.1"]
        args += ["-g", str(int(round(fps * 2))), "-r", str(fps), "-pix_fmt", pix_fmt]
        if audio_path:
            args += ["-c:a", audio_codec, "-b:a", audio_bitrate, "-ar", str(sample_rate)]
        if duration:
            args += ["-t", f"{duration:.3f}"]
        args += ["-movflags", "+faststart", str(self.out_path.resolve())]
        _log.debug("FrameWriter: %s", " ".join(args))
        self.proc = subprocess.Popen(args, stdin=subprocess.PIPE, stderr=subprocess.PIPE,
                                     cwd=str(cwd) if cwd else None, bufsize=10 ** 7)
        self._drain = _Drain(self.proc.stderr)
        self._drain.start()
        self.frames = 0

    def write(self, frame: np.ndarray) -> None:
        if frame.shape[0] != self.h or frame.shape[1] != self.w:
            raise StudioError(f"Frame size {frame.shape[1]}x{frame.shape[0]} != {self.w}x{self.h}")
        try:
            self.proc.stdin.write(np.ascontiguousarray(frame, dtype=np.uint8).tobytes())
        except (BrokenPipeError, OSError) as e:
            self.proc.wait(timeout=10)
            raise StudioError(f"FFmpeg encoder stopped: {self._drain.text().strip()[-600:]}") from e
        self.frames += 1

    def close(self) -> Path:
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        rc = self.proc.wait()
        self._drain.join(timeout=5)
        if rc != 0:
            raise StudioError(f"FFmpeg encode failed ({rc}): {self._drain.text().strip()[-800:]}")
        return self.out_path

    def abort(self) -> None:
        try:
            self.proc.kill()
        except Exception:
            pass


def even(x: float) -> int:
    v = int(round(x))
    return v if v % 2 == 0 else v + 1


def scaled_size(src_w: int, src_h: int, target_w: int) -> tuple[int, int]:
    h = even(src_h * target_w / max(1, src_w))
    return even(target_w), max(2, h)
