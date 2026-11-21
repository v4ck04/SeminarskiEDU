"""Audio mixing and mastering.

1. Voice: high-pass, de-esser, compressor, two-pass loudness normalisation.
2. Music: levelled relative to the voice (music_db_below_voice), faded,
   and ducked under speech by `ducking_db` with smooth attack/release.
3. SFX placed at their storyboard times.
4. Master: two-pass loudnorm to the target LUFS / true peak + limiter.
5. Checks: integrated loudness, true peak, clipped samples, and the
   voice-to-music ratio while speaking (narration clarity).
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

import numpy as np

from .. import ffmpeg, log
from ..utils import StudioError, say

_log = log.get("mixer")
SR = 48000


def _two_pass_loudnorm(src: Path, dst: Path, target_i: float, tp: float, lra: float = 11.0,
                       pre: str | None = None, channels: int = 2) -> dict:
    m = ffmpeg.loudness(src, target_i, tp, pre_filter=pre)["raw"]
    if str(m.get("input_i")) in ("-inf", "inf"):
        raise StudioError(f"{src.name} is silent - nothing to normalise")
    ln = (f"loudnorm=I={target_i}:TP={tp}:LRA={lra}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
          f"linear=true:print_format=json")
    af = (pre + "," if pre else "") + ln + f",aresample={SR}"
    proc = ffmpeg.ffmpeg(["-y", "-i", str(src), "-af", af, "-ac", str(channels), "-ar", str(SR), "-c:a", "pcm_s16le", str(dst)])
    err = (proc.stderr or b"").decode("utf-8", "replace")
    js = re.findall(r"\{[^{}]*\"normalization_type\"[^{}]*\}", err, re.S)
    return json.loads(js[-1]) if js else {}


def process_voice(narration: Path, out: Path, vcfg: dict) -> dict:
    p = vcfg.get("processing", {})
    chain = [f"highpass=f={p.get('highpass_hz', 70)}"]
    if p.get("deesser", True) and ffmpeg.has_filter("deesser"):
        chain.append("deesser=i=0.4:m=0.5:f=0.5")
    if p.get("compressor", True):
        chain.append("acompressor=threshold=0.125:ratio=3:attack=5:release=80:makeup=1.6")
    info = _two_pass_loudnorm(narration, out, float(p.get("target_lufs", -16)), -2.0, 7.0, pre=",".join(chain), channels=1)
    return {"chain": chain, "loudnorm": info.get("normalization_type")}


def _duck_curve(voice: np.ndarray, duck_db: float, attack: float = 0.06, release: float = 0.35) -> np.ndarray:
    hop = SR // 100
    n = len(voice) // hop + 1
    pad = np.pad(voice, (0, n * hop - len(voice)))
    rms = np.sqrt(np.mean(pad.reshape(n, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    active = db > (db.max() - 30)
    target = np.where(active, -abs(duck_db), 0.0)
    g = np.zeros(n)
    a_c, r_c = math.exp(-0.01 / attack), math.exp(-0.01 / release)
    cur = 0.0
    for i in range(n):
        c = a_c if target[i] < cur else r_c
        cur = c * cur + (1 - c) * target[i]
        g[i] = cur
    gl = np.interp(np.arange(len(voice)) / hop, np.arange(n), g)
    return 10 ** (gl / 20)



def mix(narration: Path, music: Path | None, sfx: list[dict], duration: float, out_dir: Path,
        settings: dict, vcfg: dict) -> dict:
    au = settings["audio"]
    out_dir.mkdir(parents=True, exist_ok=True)
    voice_p = out_dir / "voice_processed.wav"
    vinfo = process_voice(narration, voice_p, vcfg)
    n = int(round(duration * SR))
    v = ffmpeg.decode_audio(voice_p, sr=SR, mono=True)[:n]
    v = np.pad(v, (0, n - len(v)))
    voice_lufs = ffmpeg.loudness(voice_p)["integrated_lufs"]
    total = np.stack([v, v], axis=1).astype(np.float64)
    report: dict = {"voice": {**vinfo, "lufs": round(voice_lufs, 2)}, "music": None, "sfx": []}

    m_ducked = np.zeros_like(total)
    if music is not None and au.get("music_enabled", True):
        mus = ffmpeg.decode_audio(music, sr=SR, mono=False)
        if len(mus) == 0:
            raise StudioError(f"music file {music} has no audio")
        if len(mus) < n:   # loop user tracks that are shorter than the video
            reps = int(math.ceil(n / len(mus)))
            mus = np.concatenate([mus] * reps)
        mus = mus[:n].astype(np.float64)
        fi, fo = int(au.get("music_fade_in_s", 0.8) * SR), int(au.get("music_fade_out_s", 1.5) * SR)
        env = np.ones(n)
        if fi:
            env[:fi] = np.linspace(0, 1, fi)
        if fo:
            env[-fo:] *= np.linspace(1, 0, fo)
        mus *= env[:, None]
        tmp = out_dir / "music_aligned.wav"
        ffmpeg.write_wav(tmp, np.clip(mus, -1, 1), SR)
        mus_lufs = ffmpeg.loudness(tmp)["integrated_lufs"]
        target = voice_lufs - float(au.get("music_db_below_voice", 16.0))
        gain_db = target - mus_lufs if np.isfinite(mus_lufs) else -30.0
        duck = _duck_curve(v, float(au.get("ducking_db", 6.0)))
        m_ducked = mus * (10 ** (gain_db / 20)) * duck[:, None]
        total += m_ducked
        report["music"] = {"file": str(music.name), "source_lufs": round(mus_lufs, 2), "gain_db": round(gain_db, 2),
                           "target_lufs_before_ducking": round(target, 2), "ducking_db": au.get("ducking_db", 6.0)}
    gain_sfx = float(au.get("sfx_gain_db", -9.0))
    for ev in sfx:
        x = ffmpeg.decode_audio(ev["file"], sr=SR, mono=False).astype(np.float64)
        s = int(max(0.0, ev["time"]) * SR)
        if s >= n or len(x) == 0:
            continue
        e = min(n, s + len(x))
        g = 10 ** ((gain_sfx + float(ev.get("gain_db", 0.0))) / 20)
        total[s:e] += x[: e - s] * g
        report["sfx"].append({"type": ev["type"], "time": round(ev["time"], 3), "file": Path(ev["file"]).name})

    # narration clarity while speaking
    hop = SR // 100
    k = n // hop
    vr = np.sqrt(np.mean(v[: k * hop].reshape(k, hop) ** 2, axis=1) + 1e-12)
    mr = np.sqrt(np.mean(m_ducked[: k * hop, 0].reshape(k, hop) ** 2, axis=1) + 1e-12)
    speaking = 20 * np.log10(vr) > 20 * np.log10(vr.max()) - 25
    if speaking.any() and m_ducked.any():
        report["voice_to_music_db"] = round(float(20 * np.log10(np.median(vr[speaking]) / np.median(mr[speaking]))), 1)

    peak = float(np.max(np.abs(total))) or 1.0
    pre_gain = min(1.0, 0.89 / peak)
    premix = out_dir / "premix.wav"
    ffmpeg.write_wav(premix, total * pre_gain, SR)
    final = out_dir / "mixed.wav"
    tp = float(au.get("true_peak_db", -1.0))
    lim = 10 ** ((tp - 0.3) / 20)
    _two_pass_loudnorm(premix, out_dir / "mixed_ln.wav", float(au.get("target_lufs", -14.0)), tp)
    ffmpeg.ffmpeg(["-y", "-i", str(out_dir / "mixed_ln.wav"), "-af",
                   f"alimiter=limit={lim:.4f}:attack=2:release=50:level=disabled,aresample={SR}",
                   "-ac", "2", "-ar", str(SR), "-c:a", "pcm_s16le", str(final)])
    (out_dir / "mixed_ln.wav").unlink(missing_ok=True)
    meas = ffmpeg.loudness(final, float(au.get("target_lufs", -14.0)), tp)
    x = ffmpeg.decode_audio(final, sr=SR, mono=False)
    clipped = int(np.sum(np.abs(x) >= 0.999))
    report["master"] = {"file": str(final), "integrated_lufs": round(meas["integrated_lufs"], 2),
                        "true_peak_db": round(meas["true_peak_db"], 2), "lra": round(meas["lra"], 2),
                        "clipped_samples": clipped, "target_lufs": au.get("target_lufs", -14.0),
                        "duration": round(len(x) / SR, 3)}
    say(f"Mix: {meas['integrated_lufs']:.1f} LUFS, true peak {meas['true_peak_db']:.1f} dBTP, "
        f"{clipped} clipped samples" + (f", voice {report['voice_to_music_db']} dB above music while speaking"
                                         if "voice_to_music_db" in report else ""), level="ok")
    return report
