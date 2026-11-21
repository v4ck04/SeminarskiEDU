"""Speech transcription with word timestamps (optional).

Providers, in "auto" order:
  * faster-whisper  - local, free (pip install faster-whisper)
  * openai          - Whisper API, needs OPENAI_API_KEY
If neither is available the analysis continues without a transcript and every
speech-derived observation is marked as lower confidence.
"""
from __future__ import annotations

import importlib.util
import tempfile
from pathlib import Path

import requests

from .. import ffmpeg, log
from ..utils import env_key

_log = log.get("analysis.transcribe")


def available_providers() -> list[str]:
    out = []
    if importlib.util.find_spec("faster_whisper") is not None:
        out.append("faster-whisper")
    if env_key("OPENAI_API_KEY"):
        out.append("openai")
    return out


LAST_ERRORS: list[str] = []


def transcribe(path: str | Path, cfg: dict) -> dict | None:
    LAST_ERRORS.clear()
    want = (cfg or {}).get("provider", "auto")
    if want == "none":
        return None
    provs = available_providers()
    order = provs if want == "auto" else [want]
    errors = []
    for p in order:
        if p not in provs:
            errors.append(f"{p}: not available")
            continue
        try:
            if p == "faster-whisper":
                return _faster_whisper(path, cfg)
            if p == "openai":
                return _openai(path, cfg)
        except Exception as e:  # keep going with the next provider
            _log.warning("transcription with %s failed: %s", p, e)
            errors.append(f"{p}: {e}")
    if errors:
        _log.info("no transcript: %s", "; ".join(errors))
        LAST_ERRORS.extend(errors)
    return None


def _faster_whisper(path, cfg) -> dict:
    from faster_whisper import WhisperModel
    device = cfg.get("device", "auto")
    model = WhisperModel(cfg.get("faster_whisper_model", "small"), device=device,
                         compute_type="int8" if device in ("cpu", "auto") else "float16")
    # decode with FFmpeg ourselves (16 kHz mono float32): avoids faster-whisper's PyAV decoder,
    # whose arguments are not compatible with every PyAV release
    audio = ffmpeg.decode_audio(path, sr=16000, mono=True)
    segments, info = model.transcribe(audio, language=cfg.get("language"), word_timestamps=True,
                                      vad_filter=True)
    segs, words = [], []
    for s in segments:
        segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                          "prob": round(float(w.probability), 3)})
    return {"provider": "faster-whisper", "model": cfg.get("faster_whisper_model", "small"),
            "language": info.language, "text": " ".join(s["text"] for s in segs).strip(),
            "segments": segs, "words": words}


def _openai(path, cfg) -> dict:
    key = env_key("OPENAI_API_KEY")
    with tempfile.TemporaryDirectory() as td:
        mp3 = Path(td) / "audio.mp3"
        ffmpeg.ffmpeg(["-y", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", str(mp3)])
        with open(mp3, "rb") as f:
            r = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {key}"},
                data=[("model", cfg.get("openai_model", "whisper-1")), ("response_format", "verbose_json"),
                      ("timestamp_granularities[]", "word"), ("timestamp_granularities[]", "segment")]
                + ([("language", cfg["language"])] if cfg.get("language") else []),
                files={"file": ("audio.mp3", f, "audio/mpeg")}, timeout=300)
    if r.status_code != 200:
        raise RuntimeError(f"OpenAI transcription HTTP {r.status_code}: {r.text[:200]}")
    d = r.json()
    words = [{"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
             for w in d.get("words", [])]
    segs = [{"start": round(s["start"], 3), "end": round(s["end"], 3), "text": s["text"].strip()}
            for s in d.get("segments", [])]
    return {"provider": "openai", "model": cfg.get("openai_model", "whisper-1"), "language": d.get("language"),
            "text": d.get("text", "").strip(), "segments": segs, "words": words}
