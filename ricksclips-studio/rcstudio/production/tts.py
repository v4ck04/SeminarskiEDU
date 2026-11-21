"""Text-to-speech provider abstraction.

Every provider turns one sentence into a 48 kHz mono WAV and, when the
service supports it, word timestamps:

  elevenlabs  ELEVENLABS_API_KEY + elevenlabs.voice_id   character timestamps
  openai      OPENAI_API_KEY                               no timestamps
  edge        free Microsoft neural voices (online)        word boundaries
  pyttsx3     offline system voices (Windows SAPI5)        no timestamps
  flite       FFmpeg's built-in offline voice (robotic)    no timestamps

Missing timestamps are filled in by voice.py (whisper alignment when
available, otherwise proportional estimation inside the detected speech).
API keys are only read from the environment and never logged.

Voice policy: use stock/licensed voices only. Do not configure a voice
cloned from another creator (including the reference channel) without
their written authorisation.
"""
from __future__ import annotations

import asyncio
import base64
import importlib.util
import os
import platform
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import requests

from .. import ffmpeg, log
from ..utils import StudioError, env_key

_log = log.get("tts")
SR = 48000


@dataclass
class SynthResult:
    path: Path
    duration: float
    words: list[dict] | None
    native_speed: bool
    native_pitch: bool


def _to_wav(src: Path, dst: Path) -> None:
    ffmpeg.ffmpeg(["-y", "-v", "error", "-i", str(src), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(dst)])


def _duration(p: Path) -> float:
    return ffmpeg.media_info(p)["duration"]


class Provider:
    name = "base"
    quality = ""
    word_timings = False

    def __init__(self, cfg: dict):
        self.cfg = cfg or {}

    def status(self) -> tuple[bool, str]:  # pragma: no cover - overridden
        return False, "not implemented"

    def synthesize(self, text: str, out: Path, speed: float = 1.0) -> SynthResult:  # pragma: no cover
        raise NotImplementedError

    def describe(self) -> str:
        return self.name


class ElevenLabs(Provider):
    name, quality, word_timings = "elevenlabs", "premium neural (paid)", True

    def status(self):
        if not env_key("ELEVENLABS_API_KEY"):
            return False, "ELEVENLABS_API_KEY not set"
        if not self.cfg.get("voice_id"):
            return False, "set elevenlabs.voice_id in config/voice-settings.json (a stock voice you are licensed to use)"
        return True, f"voice {self.cfg['voice_id']}, model {self.cfg.get('model_id')}"

    def describe(self):
        return f"elevenlabs:{self.cfg.get('voice_id')}"

    def synthesize(self, text, out, speed=1.0):
        fmt = self.cfg.get("output_format", "mp3_44100_128")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.cfg['voice_id']}/with-timestamps"
        body = {"text": text, "model_id": self.cfg.get("model_id", "eleven_multilingual_v2"),
                "voice_settings": {"stability": self.cfg.get("stability", 0.45),
                                   "similarity_boost": self.cfg.get("similarity_boost", 0.75),
                                   "style": self.cfg.get("style", 0.15),
                                   "use_speaker_boost": self.cfg.get("use_speaker_boost", True),
                                   "speed": max(0.7, min(1.2, speed))}}
        r = requests.post(url, params={"output_format": fmt}, json=body, timeout=120,
                          headers={"xi-api-key": env_key("ELEVENLABS_API_KEY") or "", "Content-Type": "application/json"})
        if r.status_code != 200:
            raise StudioError(f"ElevenLabs HTTP {r.status_code}: {r.text[:200]}")
        d = r.json()
        with tempfile.TemporaryDirectory() as td:
            raw = Path(td) / "raw.mp3"
            raw.write_bytes(base64.b64decode(d["audio_base64"]))
            _to_wav(raw, out)
        al = d.get("alignment") or {}
        words, cur, start, end = [], "", None, None
        for ch, s, e in zip(al.get("characters", []), al.get("character_start_times_seconds", []),
                            al.get("character_end_times_seconds", [])):
            if ch.isspace():
                if cur:
                    words.append({"word": cur, "start": start, "end": end})
                cur, start = "", None
            else:
                if start is None:
                    start = s
                cur += ch
                end = e
        if cur:
            words.append({"word": cur, "start": start, "end": end})
        return SynthResult(out, _duration(out), words or None, True, False)


class OpenAITTS(Provider):
    name, quality, word_timings = "openai", "neural (paid)", False

    def status(self):
        return (True, f"{self.cfg.get('model')} / {self.cfg.get('voice')}") if env_key("OPENAI_API_KEY") \
            else (False, "OPENAI_API_KEY not set")

    def describe(self):
        return f"openai:{self.cfg.get('model')}:{self.cfg.get('voice')}"

    def synthesize(self, text, out, speed=1.0):
        body = {"model": self.cfg.get("model", "gpt-4o-mini-tts"), "voice": self.cfg.get("voice", "onyx"),
                "input": text, "response_format": "wav", "speed": max(0.25, min(4.0, speed))}
        if body["model"].startswith("gpt-4o") and self.cfg.get("instructions"):
            body["instructions"] = self.cfg["instructions"]
        r = requests.post("https://api.openai.com/v1/audio/speech", json=body, timeout=120,
                          headers={"Authorization": f"Bearer {env_key('OPENAI_API_KEY') or ''}"})
        if r.status_code != 200:
            raise StudioError(f"OpenAI TTS HTTP {r.status_code}: {r.text[:200]}")
        with tempfile.TemporaryDirectory() as td:
            raw = Path(td) / "raw.wav"
            raw.write_bytes(r.content)
            _to_wav(raw, out)
        return SynthResult(out, _duration(out), None, True, False)


class EdgeTTS(Provider):
    name, quality, word_timings = "edge", "neural (free, online; check Microsoft's terms for commercial use)", True

    def status(self):
        if importlib.util.find_spec("edge_tts") is None:
            return False, "pip install edge-tts"
        return True, f"voice {self.cfg.get('voice', 'en-US-AndrewNeural')} (needs internet)"

    def describe(self):
        return f"edge:{self.cfg.get('voice', 'en-US-AndrewNeural')}"

    def synthesize(self, text, out, speed=1.0):
        import edge_tts

        rate = self.cfg.get("rate", "+0%")
        if abs(speed - 1.0) > 1e-3:
            rate = f"{int(round((speed - 1.0) * 100)):+d}%"

        async def run(mp3: Path):
            kw = {"rate": rate, "pitch": self.cfg.get("pitch", "+0Hz")}
            try:
                comm = edge_tts.Communicate(text, self.cfg.get("voice", "en-US-AndrewNeural"), boundary="WordBoundary", **kw)
            except TypeError:  # older edge-tts without the boundary argument
                comm = edge_tts.Communicate(text, self.cfg.get("voice", "en-US-AndrewNeural"), **kw)
            words = []
            with open(mp3, "wb") as f:
                async for ch in comm.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        s = ch["offset"] / 1e7
                        words.append({"word": ch["text"], "start": s, "end": s + ch["duration"] / 1e7})
            return words

        with tempfile.TemporaryDirectory() as td:
            mp3 = Path(td) / "raw.mp3"
            try:
                words = asyncio.run(run(mp3))
            except Exception as e:
                raise StudioError(f"Edge TTS failed ({type(e).__name__}: {e}). It needs an internet connection.") from e
            if not mp3.exists() or mp3.stat().st_size == 0:
                raise StudioError("Edge TTS returned no audio")
            _to_wav(mp3, out)
        return SynthResult(out, _duration(out), words or None, True, False)


class Pyttsx3TTS(Provider):
    name, quality, word_timings = "pyttsx3", "offline system voice (Windows SAPI5)", False

    def status(self):
        if importlib.util.find_spec("pyttsx3") is None:
            return False, "pip install pyttsx3"
        sysname = platform.system()
        if sysname == "Windows":
            return True, "Windows SAPI5 voices (offline)"
        if sysname == "Darwin":
            return True, "macOS system voices (offline)"
        if shutil.which("espeak") or shutil.which("espeak-ng"):
            return True, "espeak voices (offline)"
        return False, "no system speech engine (Windows SAPI5 / macOS / espeak)"

    def describe(self):
        return f"pyttsx3:{self.cfg.get('voice_name_contains') or 'default'}"

    def synthesize(self, text, out, speed=1.0):
        rate = int(round(float(self.cfg.get("rate_wpm", 180)) * speed))
        with tempfile.TemporaryDirectory() as td:
            tf = Path(td) / "text.txt"
            tf.write_text(text, encoding="utf-8")
            raw = Path(td) / "raw.wav"
            # separate process: pyttsx3's event loop is unreliable when reused in one process
            cmd = [sys.executable, "-m", "rcstudio.production.tts_worker", str(tf), str(raw), str(rate),
                   self.cfg.get("voice_name_contains", "")]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180,
                                  cwd=str(Path(__file__).resolve().parents[2]))
            if proc.returncode != 0 or not raw.exists() or raw.stat().st_size < 100:
                raise StudioError(f"pyttsx3 failed: {proc.stderr.decode('utf-8', 'replace')[-300:]}")
            _to_wav(raw, out)
        return SynthResult(out, _duration(out), None, True, False)


class FliteTTS(Provider):
    name, quality, word_timings = "flite", "offline robotic test voice (FFmpeg libflite)", False

    def status(self):
        if not ffmpeg.available():
            return False, "FFmpeg not found"
        return (True, "FFmpeg built-in (testing only)") if ffmpeg.has_filter("flite") \
            else (False, "this FFmpeg build has no libflite")

    def describe(self):
        return f"flite:{self.cfg.get('voice', 'slt')}"

    def synthesize(self, text, out, speed=1.0):
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / "t.txt").write_text(text, encoding="utf-8")
            af = f"atempo={max(0.5, min(2.0, speed)):.4f}" if abs(speed - 1) > 1e-3 else "anull"
            ffmpeg.ffmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", f"flite=textfile=t.txt:voice={self.cfg.get('voice', 'slt')}",
                           "-af", af, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(Path(out).resolve())], cwd=td)
        return SynthResult(out, _duration(out), None, True, False)


PROVIDERS: dict[str, type[Provider]] = {"elevenlabs": ElevenLabs, "openai": OpenAITTS, "edge": EdgeTTS,
                                        "pyttsx3": Pyttsx3TTS, "flite": FliteTTS}


def _voice_cfg() -> dict:
    from ..config import load_voice_settings
    return load_voice_settings()


def provider_status(name: str, voice_cfg: dict | None = None) -> dict:
    vc = voice_cfg or _voice_cfg()
    p = PROVIDERS[name](vc.get(name, {}))
    ok, reason = p.status()
    return {"available": ok, "reason": reason, "quality": p.quality, "word_timings": p.word_timings}


def get_provider(name: str | None = None, voice_cfg: dict | None = None) -> Provider:
    vc = voice_cfg or _voice_cfg()
    want = name or vc.get("provider", "auto")
    if want != "auto":
        if want not in PROVIDERS:
            raise StudioError(f"Unknown TTS provider '{want}'. Choose from {', '.join(PROVIDERS)}")
        p = PROVIDERS[want](vc.get(want, {}))
        ok, reason = p.status()
        if not ok:
            raise StudioError(f"TTS provider '{want}' is not available: {reason}")
        return p
    tried = []
    for n in vc.get("provider_priority", list(PROVIDERS)):
        if n not in PROVIDERS:
            continue
        p = PROVIDERS[n](vc.get(n, {}))
        ok, reason = p.status()
        if ok:
            return p
        tried.append(f"{n}: {reason}")
    raise StudioError("No text-to-speech provider is available:\n  " + "\n  ".join(tried))


def probe_provider(p: Provider) -> tuple[bool, str]:
    """Synthesize a short phrase to confirm the provider really works (network etc.)."""
    with tempfile.TemporaryDirectory() as td:
        try:
            r = p.synthesize("Testing one two three.", Path(td) / "probe.wav")
            return (r.duration > 0.3, f"{r.duration:.2f}s of audio")
        except Exception as e:
            return False, str(e)[:200]
