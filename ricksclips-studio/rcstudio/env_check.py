"""`studio.py doctor` - inspect the environment before doing any work.

Reports Python, FFmpeg/FFprobe (with the filters the pipeline needs), Git,
disk space, GPU, Python packages, API keys (presence only, never values),
fonts and which TTS providers can run right now.
"""
from __future__ import annotations

import importlib
import os
import platform
import shutil
import subprocess
import sys

from . import ffmpeg, paths
from .utils import now_iso, say, write_json

REQUIRED_PACKAGES = {"numpy": "numpy", "cv2": "opencv-python-headless", "PIL": "Pillow",
                     "requests": "requests", "dotenv": "python-dotenv"}
OPTIONAL_PACKAGES = {
    "edge_tts": "edge-tts (free Microsoft neural voices, online)",
    "pyttsx3": "pyttsx3 (offline Windows SAPI5 voices)",
    "faster_whisper": "faster-whisper (local transcription of reference videos)",
    "anthropic": "anthropic (Claude API: script generation, visual analysis)",
    "pytesseract": "pytesseract (OCR of burned-in captions; needs Tesseract installed)",
    "pytest": "pytest (test suite)",
}
REQUIRED_FILTERS = ["subtitles", "loudnorm", "sidechaincompress", "blackdetect", "freezedetect",
                    "silencedetect", "amix", "adelay", "afade", "eq", "colorbalance", "vignette", "acompressor",
                    "highpass", "volume", "aresample", "atempo"]
OPTIONAL_FILTERS = ["deesser", "rubberband", "flite", "ebur128"]
API_KEYS = {
    "ANTHROPIC_API_KEY": "script generation + visual analysis via Claude API (optional inside Claude Code)",
    "ELEVENLABS_API_KEY": "ElevenLabs TTS",
    "OPENAI_API_KEY": "OpenAI TTS / Whisper API / image generation",
    "PEXELS_API_KEY": "Pexels stock footage",
    "PIXABAY_API_KEY": "Pixabay stock footage",
}


def _cmd_version(cmd: list[str]) -> str | None:
    try:
        out = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=15)
        txt = out.stdout.decode("utf-8", "replace").strip().splitlines()
        return txt[0] if txt else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def gpu_info() -> dict:
    info: dict = {"nvidia": None, "ffmpeg_hw_encoders": []}
    if shutil.which("nvidia-smi"):
        try:
            out = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version",
                                  "--format=csv,noheader"], stdout=subprocess.PIPE, timeout=15)
            info["nvidia"] = out.stdout.decode().strip() or None
        except (OSError, subprocess.TimeoutExpired):
            pass
    if os.name == "nt" and not info["nvidia"]:
        try:
            out = subprocess.run(["powershell", "-NoProfile", "-Command",
                                  "(Get-CimInstance Win32_VideoController).Name"],
                                 stdout=subprocess.PIPE, timeout=20)
            info["windows_video_controllers"] = out.stdout.decode(errors="replace").strip().splitlines()
        except (OSError, subprocess.TimeoutExpired):
            pass
    if ffmpeg.available():
        enc = ffmpeg.encoders()
        info["ffmpeg_hw_encoders"] = sorted(e for e in enc if any(k in e for k in ("nvenc", "qsv", "amf", "videotoolbox")))
    try:
        import torch  # noqa: F401 - only for reporting
        info["torch_cuda"] = bool(torch.cuda.is_available())
    except Exception:
        info["torch_cuda"] = None
    return info


def check(verbose: bool = True) -> dict:
    report: dict = {"checked_at": now_iso(), "platform": platform.platform(), "ok": True,
                    "problems": [], "warnings": []}

    # Python
    py_ok = sys.version_info >= (3, 10)
    report["python"] = {"version": sys.version.split()[0], "executable": sys.executable,
                        "venv": sys.prefix != getattr(sys, "base_prefix", sys.prefix), "ok": py_ok}
    if not py_ok:
        report["problems"].append("Python 3.10+ is required.")
    if not report["python"]["venv"]:
        report["warnings"].append("Not running inside a virtual environment (run install.ps1 to create .venv).")

    # FFmpeg
    ff: dict = {"ffmpeg": None, "ffprobe": None, "version": None, "missing_filters": [], "optional_missing": []}
    if ffmpeg.available():
        ff["ffmpeg"] = ffmpeg.ffmpeg_bin()
        ff["ffprobe"] = ffmpeg.ffprobe_bin()
        ff["version"] = ffmpeg.version()
        fl = ffmpeg.filters()
        ff["missing_filters"] = [f for f in REQUIRED_FILTERS if f not in fl]
        ff["optional_missing"] = [f for f in OPTIONAL_FILTERS if f not in fl]
        ff["libx264"] = ffmpeg.has_encoder("libx264")
        ff["aac"] = ffmpeg.has_encoder("aac")
        if ff["missing_filters"]:
            report["problems"].append(f"FFmpeg is missing filters: {', '.join(ff['missing_filters'])} "
                                      "(install a full build, e.g. `winget install Gyan.FFmpeg`).")
        if not ff["libx264"] or not ff["aac"]:
            report["problems"].append("FFmpeg needs the libx264 and aac encoders.")
    else:
        report["problems"].append("FFmpeg/FFprobe not found. Windows: `winget install Gyan.FFmpeg`, then reopen the terminal.")
    report["ffmpeg"] = ff

    # Git
    report["git"] = _cmd_version(["git", "--version"])
    if not report["git"]:
        report["warnings"].append("Git not found (optional, but recommended for versioning your studio).")

    # Disk
    du = shutil.disk_usage(paths.root())
    report["disk"] = {"free_gb": round(du.free / 1e9, 1), "total_gb": round(du.total / 1e9, 1)}
    if du.free < 5e9:
        report["warnings"].append(f"Only {report['disk']['free_gb']} GB free; renders and footage need several GB.")

    # GPU
    report["gpu"] = gpu_info()

    # packages
    pk: dict = {}
    for mod, name in {**REQUIRED_PACKAGES, **OPTIONAL_PACKAGES}.items():
        try:
            m = importlib.import_module(mod)
            pk[mod] = getattr(m, "__version__", "installed")
        except Exception:
            pk[mod] = None
            if mod in REQUIRED_PACKAGES:
                report["problems"].append(f"Missing Python package: {name} (pip install -r requirements.txt)")
    report["packages"] = pk

    # keys (presence only)
    report["api_keys"] = {k: bool(os.environ.get(k, "").strip()) for k in API_KEYS}

    # fonts
    fonts = sorted(p.name for p in paths.fonts_dir().glob("*.ttf"))
    report["fonts"] = fonts
    if not fonts:
        report["warnings"].append("No fonts in assets/fonts - subtitles will fall back to a system font.")

    from . import faces
    ok, why = faces.available()
    report["face_detector"] = why
    if not ok:
        report["warnings"].append("No face detector: composition face stats and the 'unwanted person' asset check are off.")

    # TTS
    try:
        from .production import tts
        report["tts"] = {name: tts.provider_status(name) for name in tts.PROVIDERS}
    except Exception as e:  # pragma: no cover - defensive
        report["tts"] = {"error": str(e)}

    report["ok"] = not report["problems"]
    write_json(paths.logs_dir() / "doctor.json", report)
    if verbose:
        _print(report)
    return report


def _print(r: dict) -> None:
    say("RickClips Studio - environment check", level="step")
    say(f"Platform: {r['platform']}")
    py = r["python"]
    say(f"Python {py['version']} ({'venv' if py['venv'] else 'no venv'})", level="ok" if py["ok"] else "fail")
    ff = r["ffmpeg"]
    if ff.get("ffmpeg"):
        say(f"{ff['version']}", level="ok" if not ff["missing_filters"] else "warn")
        if ff["optional_missing"]:
            say(f"Optional FFmpeg filters not present: {', '.join(ff['optional_missing'])}")
    say(f"Git: {r['git'] or 'not found'}", level="ok" if r["git"] else "warn")
    say(f"Disk free: {r['disk']['free_gb']} GB")
    g = r["gpu"]
    say(f"GPU: {g.get('nvidia') or ', '.join(g.get('windows_video_controllers') or []) or 'none detected (CPU rendering)'}")
    if g.get("ffmpeg_hw_encoders"):
        say(f"FFmpeg hardware encoders: {', '.join(g['ffmpeg_hw_encoders'])}")
    for mod, ver in r["packages"].items():
        req = mod in REQUIRED_PACKAGES
        if ver:
            say(f"{mod} {ver}", level="ok")
        else:
            say(f"{mod} not installed" + ("" if req else f" (optional: {OPTIONAL_PACKAGES.get(mod)})"),
                level="fail" if req else "info")
    for k, present in r["api_keys"].items():
        say(f"{k}: {'set' if present else 'not set'} - {API_KEYS[k]}", level="ok" if present else "info")
    say(f"Fonts: {', '.join(r['fonts']) or 'none'}")
    say(f"Face detector: {r.get('face_detector')}")
    if isinstance(r.get("tts"), dict):
        for name, st in r["tts"].items():
            if isinstance(st, dict):
                say(f"TTS {name}: {'available' if st.get('available') else 'unavailable'} - {st.get('reason', '')}",
                    level="ok" if st.get("available") else "info")
    for w in r["warnings"]:
        say(w, level="warn")
    for p in r["problems"]:
        say(p, level="fail")
    say("Environment OK" if r["ok"] else "Environment has problems (see above)", level="ok" if r["ok"] else "fail")
