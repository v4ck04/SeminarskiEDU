"""Quality control for rendered videos.

Each check is measured on the actual output file and reported as pass /
warn / fail with the measured value. A video is only "complete" when no
check fails.
"""
from __future__ import annotations

import re
from pathlib import Path

import cv2
import numpy as np

from .. import ffmpeg, paths
from ..config import load_settings
from ..utils import fmt_time, normalize_word, now_iso, read_json, say, write_json, write_text

SR = 48000


class Report:
    def __init__(self):
        self.checks: list[dict] = []

    def add(self, name: str, status: str, detail: str, value=None):
        self.checks.append({"check": name, "status": status, "detail": detail, "value": value})

    @property
    def verdict(self) -> str:
        if any(c["status"] == "fail" for c in self.checks):
            return "FAIL"
        if any(c["status"] == "warn" for c in self.checks):
            return "PASS WITH WARNINGS"
        return "PASS"


def _env(x: np.ndarray, hop: int) -> np.ndarray:
    k = len(x) // hop
    return np.sqrt(np.mean(x[: k * hop].reshape(k, hop) ** 2, axis=1) + 1e-12)


def run(slug: str, video: Path, final: bool, settings: dict) -> dict:
    app = load_settings()
    exp = app["export"]
    d = paths.project_dirs(slug)
    sb = read_json(d["storyboard"] / "storyboard.json") or {}
    timing = read_json(d["voice"] / "timing.json") or {}
    caps = read_json(d["subtitles"] / "captions.json") or {}
    man = read_json(d["footage"] / "asset-manifest.json") or {}
    mixrep = read_json(d["audio"] / "mix-report.json") or {}
    W, H = (exp["width"], exp["height"]) if final else (exp["preview"]["width"], exp["preview"]["height"])
    fps = float(exp.get("fps", 30))
    expected = float(sb.get("duration", 0))
    r = Report()
    say(f"Quality control: {video.name}", level="step")

    if not video.exists():
        r.add("file exists", "fail", f"{video} not found")
        return _finish(r, slug, video, final)
    # 1. decode
    proc = ffmpeg.ffmpeg(["-v", "error", "-i", str(video), "-map", "0", "-f", "null", "-"], check=False)
    err_lines = [l for l in (proc.stderr or b"").decode("utf-8", "replace").splitlines() if l.strip()]
    if proc.returncode != 0 and not err_lines:
        err_lines = [f"ffmpeg exited with code {proc.returncode}"]
    r.add("decodes without errors", "pass" if not err_lines else "fail",
          "full decode clean" if not err_lines else f"{len(err_lines)} decoder errors: {err_lines[0][:120]}", len(err_lines))
    info = ffmpeg.media_info(video)
    v, a = info.get("video"), info.get("audio")
    if not v:
        r.add("video stream", "fail", "no video stream")
        return _finish(r, slug, video, final)
    # 2. format
    r.add("resolution", "pass" if (v["width"], v["height"]) == (W, H) else "fail", f"{v['width']}x{v['height']} (expected {W}x{H})")
    dar = v["display_width"] / max(1, v["display_height"])
    r.add("aspect ratio 9:16", "pass" if abs(dar - 9 / 16) < 0.005 and v["sar"] in ("1:1", None) else "fail",
          f"DAR {dar:.4f}, SAR {v['sar']}")
    r.add("frame rate", "pass" if abs(v["fps"] - fps) < 0.02 else "fail", f"{v['fps']} fps (expected {fps:g})")
    codec_ok = v["codec"] == "h264" and v["pix_fmt"] == "yuv420p" and a and a["codec"] == "aac"
    r.add("codecs", "pass" if codec_ok else "fail",
          f"video {v['codec']}/{v['pix_fmt']}, audio {a['codec'] if a else 'none'}{'/' + str(a['sample_rate']) if a else ''}")
    # 3. duration
    vd = v["duration"]
    r.add("duration", "pass" if abs(vd - expected) <= 0.1 else "fail", f"{vd:.3f}s (storyboard {expected:.3f}s)", vd)
    if vd > float(exp.get("max_duration_s", 180)):
        r.add("Shorts length limit", "fail", f"{vd:.1f}s exceeds {exp.get('max_duration_s')}s")
    elif vd > float(exp.get("recommended_max_duration_s", 60)):
        r.add("Shorts length", "warn", f"{vd:.1f}s is over {exp.get('recommended_max_duration_s')}s (allowed, but most Shorts are shorter)")
    pk = ffmpeg.run([ffmpeg.ffprobe_bin(), "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                     "stream=nb_read_packets", "-of", "csv=p=0", str(video)], check=False).stdout.decode().strip()
    try:
        nf = int(pk.split(",")[0])
        r.add("frame count", "pass" if abs(nf - round(expected * fps)) <= 1 else "fail",
              f"{nf} frames (expected {round(expected * fps)})", nf)
    except ValueError:
        r.add("frame count", "warn", "could not count frames")
    if a:
        r.add("audio/video length match", "pass" if abs(a["duration"] - vd) <= 0.1 else "fail",
              f"audio {a['duration']:.3f}s vs video {vd:.3f}s")
    else:
        r.add("audio stream", "fail", "no audio stream")
    # 4. black / frozen frames
    txt = ffmpeg.null_run(video, vf="blackdetect=d=0.08:pic_th=0.98:pix_th=0.05")
    blacks = [(float(m.group(1)), float(m.group(2))) for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", txt)]
    intended = [(s["start"] - s["transition_in"]["duration"], s["start"] + s["transition_in"]["duration"])
                for s in sb.get("scenes", []) if s["transition_in"]["type"] == "dip_black"]
    accidental = [b for b in blacks if not any(b[0] >= i0 - 0.05 and b[1] <= i1 + 0.05 for i0, i1 in intended)]
    r.add("no accidental black frames", "pass" if not accidental else "fail",
          "none" if not accidental else ", ".join(f"{fmt_time(s)}-{fmt_time(e)}" for s, e in accidental[:5]),
          [list(b) for b in accidental])
    txt = ffmpeg.null_run(video, vf="freezedetect=n=-60dB:d=1.5")
    freezes = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", txt)]
    r.add("no frozen picture (>1.5s)", "pass" if not freezes else "warn",
          "none" if not freezes else "frozen at " + ", ".join(fmt_time(f) for f in freezes[:5]))
    # 5. audio
    if a:
        tgt = float(settings["audio"].get("target_lufs", -14.0))
        tp_t = float(settings["audio"].get("true_peak_db", -1.0))
        L = ffmpeg.loudness(video, tgt, tp_t)
        r.add("loudness", "pass" if abs(L["integrated_lufs"] - tgt) <= 1.5 else "warn",
              f"{L['integrated_lufs']:.1f} LUFS (target {tgt})", L["integrated_lufs"])
        r.add("true peak", "pass" if L["true_peak_db"] <= tp_t + 0.5 else "fail",
              f"{L['true_peak_db']:.2f} dBTP (limit {tp_t})", L["true_peak_db"])
        x = ffmpeg.decode_audio(video, sr=SR, mono=False)
        clipped = int(np.sum(np.abs(x) >= 0.999))
        r.add("no clipping", "pass" if clipped == 0 else "fail", f"{clipped} clipped samples", clipped)
        mono = x.mean(axis=1) if x.ndim == 2 else x
        missing = []
        lv = []
        for s in timing.get("sentences", []):
            a0, a1 = int((s["start"] + 0.05) * SR), int((s["end"] - 0.05) * SR)
            seg = mono[a0:a1]
            lv.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9) if seg.size else -120)
        med = float(np.median(lv)) if lv else -120
        for s, l in zip(timing.get("sentences", []), lv):
            if l < max(-45.0, med - 14):
                missing.append(f"#{s['index'] + 1} at {fmt_time(s['start'])} ({l:.0f} dBFS)")
        r.add("narration present", "pass" if timing.get("sentences") and not missing else "fail",
              f"all {len(lv)} sentences audible" if not missing else "quiet/missing: " + ", ".join(missing[:5]))
        vp = d["audio"] / "voice_processed.wav"
        if vp.exists():
            ref = ffmpeg.decode_audio(vp, sr=SR, mono=True)
            hop = SR // 200
            e1, e2 = _env(mono, hop), _env(ref, hop)
            n = min(len(e1), len(e2))
            e1, e2 = np.log(e1[:n]), np.log(e2[:n])
            e1, e2 = e1 - e1.mean(), e2 - e2.mean()
            lags = range(-60, 61)
            corr = [float(np.dot(e1[max(0, k):n + min(0, k)], e2[max(0, -k):n - max(0, k)])) for k in lags]
            lag = list(lags)[int(np.argmax(corr))] / 200.0
            r.add("audio sync (narration vs picture timeline)", "pass" if abs(lag) <= 0.04 else "fail",
                  f"narration offset {lag * 1000:+.0f} ms", lag)
        if mixrep.get("voice_to_music_db") is not None:
            vm = mixrep["voice_to_music_db"]
            r.add("narration clarity", "pass" if vm >= 10 else "warn", f"voice {vm} dB above music while speaking", vm)
    # 6. subtitles
    cl = caps.get("captions", [])
    if not cl:
        r.add("subtitles", "fail", "no captions")
    else:
        off = [abs(c["start"] - c["words"][0]["start"]) for c in cl]
        overlaps = sum(1 for c1, c2 in zip(cl, cl[1:]) if c2["start"] < c1["end"] - 1e-3)
        late = sum(1 for c in cl if c["end"] > vd + 0.05)
        r.add("subtitle sync", "pass" if max(off) <= 0.05 and not overlaps and not late else "fail",
              f"max start offset {max(off) * 1000:.0f} ms, {overlaps} overlaps, {late} past the end")
        cap_words = [normalize_word(w["word"]) for c in cl for w in c["words"]]
        nar_words = [normalize_word(w) for s in timing.get("sentences", []) for w in s["text"].split()]
        r.add("subtitle text matches narration", "pass" if cap_words == nar_words else "fail",
              f"{len(cap_words)} caption words / {len(nar_words)} narration words")
        st = caps.get("style", {})
        sa = settings["captions"].get("safe_area", {})
        y = float(st.get("position_y", 0.62))
        in_safe = sa.get("top", 0.12) <= y <= 1 - sa.get("bottom", 0.22)
        r.add("captions inside safe area", "pass" if in_safe else "warn", f"y={y:.2f} (safe {sa.get('top', 0.12)}-{1 - sa.get('bottom', 0.22):.2f})")
        size = int(st.get("effective_font_size") or 0)
        r.add("caption size readable on mobile", "pass" if size >= 64 else "warn", f"font size {size} at 1080x1920")
        # visible in the rendered frames
        from ..analysis.captions import detect_frame
        from ..analysis.frames import extract_frame
        sample = cl[:: max(1, len(cl) // 8)][:8]
        hits = 0
        tmp = (d["export"] if final else d["preview"]) / "qc_frames"
        for k, c in enumerate(sample):
            t = (c["start"] + c["end"]) / 2
            p = extract_frame(video, t, tmp / f"cap_{k}.jpg", width=540)
            if not p:
                continue
            img = cv2.imread(str(p))
            dets = detect_frame(img)
            if any(abs(dd["cy"] - y) < 0.1 for dd in dets):
                hits += 1
        share = hits / max(1, len(sample))
        r.add("captions visible in picture", "pass" if share >= 0.75 else "warn",
              f"caption detector found text at the caption position in {hits}/{len(sample)} sampled frames", share)
    # 7. assets
    ph = [e["scene"] for e in man.get("scenes", []) if e["status"] == "placeholder"]
    if ph:
        r.add("no placeholder visuals", "fail" if final and not app["workflow"].get("allow_placeholders_in_final") else "warn",
              f"placeholders in scenes {ph}")
    else:
        r.add("no placeholder visuals", "pass", "all scenes have real or generated visuals")
    missing_files = [e["scene"] for e in man.get("scenes", []) if e.get("file") and not (paths.root() / e["file"]).exists()]
    r.add("asset files present", "pass" if not missing_files else "fail",
          "all present" if not missing_files else f"missing for scenes {missing_files}")
    unlicensed = [e["scene"] for e in man.get("scenes", []) if e["status"] in ("ok", "user") and not e.get("license")]
    r.add("licences recorded", "pass" if not unlicensed else "fail",
          "every asset has licence info" if not unlicensed else f"no licence for scenes {unlicensed}")
    return _finish(r, slug, video, final)


def _finish(r: Report, slug: str, video: Path, final: bool) -> dict:
    d = paths.project_dirs(slug)
    out_dir = d["export"] if final else d["preview"]
    rep = {"slug": slug, "video": str(video), "final": final, "checked_at": now_iso(), "verdict": r.verdict,
           "checks": r.checks}
    # the canonical reports belong to the canonical files; any other file gets its own report
    canonical = {"final-video.mp4": "quality-report", "preview.mp4": "preview-quality-report"}
    name = canonical.get(Path(video).name, f"{Path(video).stem}-quality-report")
    write_json(out_dir / f"{name}.json", rep)
    md = [f"# Quality report - {slug}", "", f"- **File:** `{Path(video).name}`", f"- **Checked:** {rep['checked_at']}",
          f"- **Verdict:** **{r.verdict}**", "", "| Check | Status | Detail |", "|---|---|---|"]
    for c in r.checks:
        md.append(f"| {c['check']} | {c['status'].upper()} | {c['detail']} |")
    write_text(out_dir / f"{name}.md", "\n".join(md) + "\n")
    for c in r.checks:
        say(f"{c['check']}: {c['detail']}", level={"pass": "ok", "warn": "warn", "fail": "fail"}[c["status"]])
    say(f"QC verdict: {r.verdict}", level="ok" if r.verdict != "FAIL" else "fail")
    return rep
