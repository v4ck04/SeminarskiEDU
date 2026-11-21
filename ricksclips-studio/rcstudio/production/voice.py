"""Narration: sentence-level TTS, pronunciation fixes, timing metadata.

Output (production/voice/<slug>/):
  sentences/s###_<hash>.wav   one file per sentence (cached by text+voice)
  narration.wav               assembled narration with pauses (48 kHz mono)
  timing.json                 sentence + word timings (absolute seconds)
"""
from __future__ import annotations

import difflib
import importlib.util
import re
from pathlib import Path

import numpy as np

from .. import ffmpeg, log, paths
from ..utils import StudioError, normalize_word, now_iso, say, split_sentences, text_hash, write_json
from . import tts

_log = log.get("voice")
SR = tts.SR


def apply_pronunciations(sentence: str, pron: dict[str, str]) -> str:
    out = sentence
    for word, say_as in sorted(pron.items(), key=lambda kv: -len(kv[0])):
        out = re.sub(rf"(?<![\w']){re.escape(word)}(?![\w'])", say_as, out, flags=re.I)
    return out


def _load(path: Path) -> np.ndarray:
    return ffmpeg.decode_audio(path, sr=SR, mono=True)


def _speech_bounds(x: np.ndarray, rel_db: float = -38.0) -> tuple[int, int]:
    if x.size == 0:
        return 0, 0
    win = int(0.01 * SR)
    n = len(x) // win
    if n == 0:
        return 0, len(x)
    rms = np.sqrt(np.mean(x[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    thr = db.max() + rel_db
    idx = np.nonzero(db > thr)[0]
    if not len(idx):
        return 0, len(x)
    return int(idx[0] * win), int(min(len(x), (idx[-1] + 1) * win))


def estimate_words(words: list[str], x: np.ndarray) -> list[dict]:
    """Proportional word timing inside the detected speech region."""
    a, b = _speech_bounds(x)
    t0, t1 = a / SR, b / SR
    weights = []
    for w in words:
        core = re.sub(r"[^\w']", "", w)
        wt = len(core) + 2.0
        if re.search(r"[,;:]$", w):
            wt += 2.5
        weights.append(wt)
    total = sum(weights) or 1.0
    out, t = [], t0
    for w, wt in zip(words, weights):
        d = (t1 - t0) * wt / total
        trail = 0.25 * d if re.search(r"[,;:.!?]$", w) else 0.06 * d
        out.append({"word": w, "start": round(t, 3), "end": round(t + d - trail, 3)})
        t += d
    return out


def align_words(original: list[str], spoken: list[dict]) -> list[dict] | None:
    """Map provider/whisper word timings back onto the script's original words."""
    if not spoken:
        return None
    o = [normalize_word(w) for w in original]
    s = [normalize_word(w["word"]) for w in spoken]
    sm = difflib.SequenceMatcher(a=o, b=s, autojunk=False)
    times: list[tuple[float, float] | None] = [None] * len(original)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (spoken[j1 + k]["start"], spoken[j1 + k]["end"])
        elif tag == "replace" and j2 > j1:
            # e.g. a respelled name "Oumuamua" -> "oh moo ah moo ah": spread the span
            a, b = spoken[j1]["start"], spoken[j2 - 1]["end"]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
    # interpolate anything unmatched
    known = [i for i, t in enumerate(times) if t]
    if len(known) < max(1, len(original) // 2):
        return None
    for i in range(len(times)):
        if times[i] is None:
            prev = max((k for k in known if k < i), default=None)
            nxt = min((k for k in known if k > i), default=None)
            a = times[prev][1] if prev is not None else (times[nxt][0] if nxt is not None else 0.0)
            b = times[nxt][0] if nxt is not None else a + 0.25
            times[i] = (a, max(a + 0.05, b))
    return [{"word": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(original, times)]


def _whisper_words(path: Path) -> list[dict] | None:
    if importlib.util.find_spec("faster_whisper") is None:
        return None
    try:
        from faster_whisper import WhisperModel
        global _WM
        if "_WM" not in globals():
            _WM = WhisperModel("base", device="auto", compute_type="int8")
        segs, _ = _WM.transcribe(ffmpeg.decode_audio(path, sr=16000, mono=True), word_timestamps=True)
        return [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segs for w in (s.words or [])]
    except Exception as e:  # alignment is optional
        _log.info("whisper alignment unavailable: %s", e)
        return None


def _pitch_filter(semitones: float) -> str | None:
    if abs(semitones) < 0.01:
        return None
    r = 2 ** (semitones / 12.0)
    if ffmpeg.has_filter("rubberband"):
        return f"rubberband=pitch={r:.5f}"
    return f"asetrate={int(SR * r)},aresample={SR},atempo={1 / r:.5f}"


def _tempo_filter(factor: float) -> str | None:
    if abs(factor - 1.0) < 0.01:
        return None
    parts, f = [], factor
    while f > 2.0:          # atempo accepts 0.5..2.0 per instance
        parts.append("atempo=2.0")
        f /= 2.0
    parts.append(f"atempo={f:.4f}")
    return ",".join(parts)


def measure_wpm(words: int, x: np.ndarray) -> float:
    a, b = _speech_bounds(x, -40.0)
    dur = max(0.2, (b - a) / SR)
    return words / dur * 60.0


def resolve_speed(prov, vset: dict, sample: str, sdir: Path) -> tuple[float, str]:
    """Speed so the voice matches the target pace (learned from the references).

    The provider's natural pace is measured once on a sample sentence; the user's
    `voice.speed` preference multiplies the result."""
    base = float(vset.get("speed", 1.0))
    target = vset.get("target_wpm")
    if not vset.get("match_pace", True) or not target or not sample.strip():
        return base, ""
    from ..utils import read_json
    cal_path = sdir / "pace-calibration.json"
    cal = read_json(cal_path, {}) or {}
    key = prov.describe()
    if key not in cal:
        tmp = sdir / "pace_probe.wav"
        res = prov.synthesize(sample, tmp, speed=1.0)
        cal[key] = round(measure_wpm(len(sample.split()), _load(tmp)), 1)
        tmp.unlink(missing_ok=True)
        write_json(cal_path, cal)
    natural = cal[key]
    wanted = float(target) / max(60.0, natural)
    factor = max(0.8, min(1.6, wanted))        # beyond ~1.6x time-stretching sounds unnatural
    note = f"pace matched: natural {natural:.0f} wpm -> target {float(target):.0f} wpm"
    if factor < wanted - 0.01:
        note += f" (capped at {factor:.1f}x - expect ~{natural * factor:.0f} wpm; pick a faster voice to get closer)"
    return round(base * factor, 3), note


def generate(slug: str, script: dict, settings: dict, voice_cfg: dict, provider_name: str | None = None,
             force: bool = False) -> dict:
    prov = tts.get_provider(provider_name, voice_cfg)
    vset = settings["voice"]
    pitch = float(voice_cfg.get("pitch_semitones", 0.0))
    pron = dict(voice_cfg.get("pronunciations", {}))
    for p in script.get("pronunciations", []):
        if p.get("word") and p.get("say_as"):
            pron[p["word"]] = p["say_as"]
    vdir = paths.project_dirs(slug)["voice"]
    sdir = vdir / "sentences"
    sdir.mkdir(parents=True, exist_ok=True)
    first = next((s for b in script["beats"] for s in split_sentences(b["text"])), "")
    speed, pace = resolve_speed(prov, vset, apply_pronunciations(first, pron), sdir)
    native = min(speed, getattr(prov, "max_speed", 2.0))
    post = speed / native
    say(f"Voice: {prov.describe()} ({prov.quality}), speed {speed:.2f}"
        + (f" ({native:.2f} native x {post:.2f} time-stretch)" if post > 1.01 else "")
        + (f" - {pace}" if pace else ""))

    lead = float(vset.get("lead_in_s", 0.12))
    sent_pause = float(vset.get("sentence_pause_s", 0.2))
    beat_pause = float(vset.get("beat_pause_s", 0.3))
    hook_pause = float(vset.get("hook_pause_s", 0.35))
    pieces: list[np.ndarray] = [np.zeros(int(lead * SR), np.float32)]
    t = lead
    sentences = []
    idx = 0
    beats = script["beats"]
    for bi, b in enumerate(beats):
        sents = split_sentences(b["text"])
        for si, sent in enumerate(sents):
            spoken = apply_pronunciations(sent, pron)
            key = text_hash(prov.describe(), voice_cfg.get(prov.name, {}), spoken, round(speed, 3), pitch)
            wav = sdir / f"s{idx:03d}_{key}.wav"
            words_src = "provider"
            meta_path = wav.with_suffix(".json")
            if wav.exists() and meta_path.exists() and not force:
                from ..utils import read_json
                meta = read_json(meta_path)
                local_words, words_src = meta["words"], meta["words_source"]
                x = _load(wav)
            else:
                say(f"  sentence {idx + 1}: {sent[:70]}")
                raw = sdir / f"raw_{idx:03d}.wav"
                res = prov.synthesize(spoken, raw, speed=native)
                x = _load(raw)
                chain = [f for f in (_pitch_filter(pitch), _tempo_filter(post)) if f]
                if chain:
                    tmp = sdir / f"post_{idx:03d}.wav"
                    ffmpeg.ffmpeg(["-y", "-v", "error", "-i", str(raw), "-af", ",".join(chain), "-ar", str(SR), str(tmp)])
                    x = _load(tmp)
                    tmp.unlink(missing_ok=True)
                # trim leading/trailing silence (keep 30 ms)
                a, e = _speech_bounds(x, -45.0)
                pad = int(0.03 * SR)
                a0, e0 = max(0, a - pad), min(len(x), e + pad)
                shift = a0 / SR
                x = x[a0:e0]
                ffmpeg.write_wav(wav, x, SR)
                raw.unlink(missing_ok=True)
                original = sent.split()
                local_words = None
                if res.words:
                    # provider timings are at native speed; time-stretching scales them by 1/post
                    w2 = [{"word": w["word"], "start": max(0.0, w["start"] / post - shift),
                           "end": max(0.0, w["end"] / post - shift)} for w in res.words]
                    local_words = align_words(original, w2)
                if local_words is None and voice_cfg.get("align_with_whisper", "auto") != "off":
                    ww = _whisper_words(wav)
                    if ww:
                        local_words = align_words(original, ww)
                        words_src = "whisper alignment"
                if local_words is None:
                    local_words = estimate_words(original, x)
                    words_src = "estimated (proportional within detected speech)"
                write_json(meta_path, {"text": sent, "spoken": spoken, "words": local_words, "words_source": words_src,
                                       "provider": prov.describe()})
            dur = len(x) / SR
            sentences.append({
                "index": idx, "beat_id": b["id"], "text": sent, "spoken_text": spoken,
                "start": round(t, 3), "end": round(t + dur, 3), "file": str(wav.relative_to(paths.root())),
                "words": [{"word": w["word"], "start": round(t + w["start"], 3), "end": round(t + min(w["end"], dur), 3)}
                          for w in local_words],
                "words_source": words_src,
            })
            pieces.append(x.astype(np.float32))
            t += dur
            last = si == len(sents) - 1
            gap = sent_pause if not last else (hook_pause if bi == 0 else beat_pause)
            if not (last and bi == len(beats) - 1):
                pieces.append(np.zeros(int(gap * SR), np.float32))
                t += gap
            idx += 1
    if not sentences:
        raise StudioError("Script has no narration sentences")
    narration = np.concatenate(pieces)
    out = vdir / "narration.wav"
    ffmpeg.write_wav(out, narration, SR)
    total_words = sum(len(x["words"]) for x in sentences)
    speech_s = sum(x["end"] - x["start"] for x in sentences)
    timing = {"slug": slug, "provider": prov.describe(), "provider_quality": prov.quality,
              "created_at": now_iso(), "sample_rate": SR, "speed": speed, "pitch_semitones": pitch,
              "pace_wpm": round(total_words / max(0.1, speech_s) * 60, 1), "pace_note": pace,
              "duration": round(len(narration) / SR, 3), "narration_file": str(out.relative_to(paths.root())),
              "sentences": sentences, "source": "voice"}
    write_json(vdir / "timing.json", timing)
    srcs = sorted({s["words_source"] for s in sentences})
    say(f"Narration {timing['duration']:.1f}s, {len(sentences)} sentences; word timings: {', '.join(srcs)}", level="ok")
    return timing
