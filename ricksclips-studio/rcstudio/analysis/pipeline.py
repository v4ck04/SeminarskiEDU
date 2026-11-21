"""Reference-video analysis orchestration (`studio.py analyze`)."""
from __future__ import annotations

import time
from pathlib import Path

from .. import ANALYZER_VERSION, ffmpeg, log, paths
from ..config import load_settings
from ..utils import StudioError, file_fingerprint, now_iso, read_json, say, slugify, write_json, write_text
from . import audio, captions, color, frames, motion, report, scan, scenes, story, transcribe, vision

_log = log.get("analysis")

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}


def video_id(path: Path) -> str:
    return f"{slugify(path.stem, 40)}-{file_fingerprint(path)[:6]}"


def report_path(vid: str) -> Path:
    return paths.analysis_dir() / f"{vid}.json"


def list_inputs(input_dir: Path | None = None) -> list[Path]:
    d = input_dir or paths.training_input()
    return sorted(p for p in d.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXT)


def analyze_video(path: str | Path, force: bool = False, transcribe_mode: str | None = None,
                  use_vision: bool | None = None) -> dict:
    path = Path(path).resolve()
    if not path.exists():
        raise StudioError(f"Video not found: {path}")
    cfg = load_settings().get("analysis", {})
    vid = video_id(path)
    rp = report_path(vid)
    existing = read_json(rp)
    if existing and not force and existing.get("video", {}).get("analyzer_version") == ANALYZER_VERSION:
        say(f"{path.name}: already analysed ({vid}) - use --force to redo", level="ok")
        return existing

    t0 = time.time()
    say(f"Analysing {path.name}  [{vid}]", level="step")
    info = ffmpeg.media_info(path)
    if not info.get("video"):
        raise StudioError(f"{path.name} has no video stream")
    v = info["video"]
    say(f"{info['duration']:.1f}s, {v['display_width']}x{v['display_height']}, {v['fps']} fps")

    say("1/7 scanning frames (shots, motion, colour)...")
    sc = scan.scan(str(path), info, cfg)
    det = scenes.detect(sc)
    mots = motion.classify_shots(sc, det["shots"], det["transitions"])
    msum = motion.summarize(mots)
    col = color.summarize(sc, det["shots"])
    cuts = scenes.cut_times(det)
    say(f"   {len(det['shots'])} shots, {len(cuts)} transitions")

    say("2/7 detecting burned-in captions...")
    caps = captions.analyze(str(path), info, cfg)
    say(f"   captions: {'found ' + str(caps.get('count', 0)) + ' caption changes' if caps.get('present') else 'none detected'}")

    say("3/7 transcribing speech (if a provider is available)...")
    tcfg = dict(cfg.get("transcription", {}))
    if transcribe_mode:
        tcfg["provider"] = transcribe_mode
    tr_path = paths.analysis_dir() / f"{vid}.transcript.json"
    tr = read_json(tr_path) if tr_path.exists() and not force else None
    if tr is None:
        tr = transcribe.transcribe(path, tcfg)
        if tr:
            write_json(tr_path, tr)
    say(f"   transcript: {tr['provider'] + ', ' + str(len(tr['words'])) + ' words' if tr else 'not available (speech metrics use lower-confidence estimates)'}")
    words = tr.get("words") if tr else None

    say("4/7 analysing audio...")
    aud = audio.analyze(str(path), info, cuts, words)
    captions.attach_spoken_words(caps, words or [])

    say("5/7 storytelling structure...")
    st = story.analyze(tr, info["duration"], cuts)

    say("6/7 extracting frames and contact sheets...")
    sheets = frames.build_sheets(path, vid, info["duration"], det["shots"], caps.get("segments", []),
                                 max_frames=int(cfg.get("max_extracted_frames", 60)),
                                 cols=int(cfg.get("contact_sheet_columns", 6)))

    vis = None
    want_vision = use_vision if use_vision is not None else cfg.get("vision", {}).get("provider") == "anthropic"
    if want_vision:
        if vision.available():
            say("   visual AI review of contact sheets (Claude API)...")
            d = Path(sheets["dir"])
            vis = vision.review_sheets([d / s for s in sheets["sheets"].values()],
                                       model=cfg.get("vision", {}).get("model", "claude-opus-5-5"))
        else:
            say("   visual AI review skipped (needs ANTHROPIC_API_KEY and `pip install anthropic`)", level="warn")
    notes = read_json(paths.analysis_dir() / f"{vid}.notes.json")

    say("7/7 writing report...")
    vid_meta = {"id": vid, "file": path.name, "fingerprint": file_fingerprint(path),
                "analyzed_at": now_iso(), "analyzer_version": ANALYZER_VERSION,
                "processing_seconds": round(time.time() - t0, 1)}
    rep = report.build(vid_meta, info, det, mots, msum, col, caps, aud, tr, st, sheets, vis, notes)
    from ..style import profile as style_profile
    comparison = style_profile.compare_to_previous(rep)
    rep["comparison"] = comparison
    write_json(rp, rep)
    write_text(paths.analysis_dir() / f"{vid}.md", report.to_markdown(rep, comparison))
    say(f"report: training/analysis/{vid}.md ({len(rep['observations'])} observations, "
        f"{time.time() - t0:.0f}s)", level="ok")
    return rep


def analyze_all(input_dir: Path | None = None, force: bool = False, transcribe_mode: str | None = None,
                use_vision: bool | None = None, rebuild_profile: bool = True) -> list[dict]:
    vids = list_inputs(input_dir)
    if not vids:
        raise StudioError(f"No reference videos found in {input_dir or paths.training_input()}. "
                          "Copy 5-20 MP4 files there and run `studio.py analyze` again.")
    say(f"Found {len(vids)} reference video(s)", level="step")
    reports, failed = [], []
    for p in vids:
        try:
            reports.append(analyze_video(p, force=force, transcribe_mode=transcribe_mode, use_vision=use_vision))
        except StudioError as e:
            say(f"{p.name}: {e}", level="fail")
            failed.append(p.name)
        except Exception as e:  # keep going with the others
            _log.exception("analysis failed for %s", p)
            say(f"{p.name}: unexpected error {type(e).__name__}: {e}", level="fail")
            failed.append(p.name)
    if rebuild_profile and reports:
        from ..style import profile as style_profile
        style_profile.rebuild(event="analyze", videos=[r["video"]["id"] for r in reports])
    if failed:
        say(f"{len(failed)} video(s) failed: {', '.join(failed)}", level="warn")
    return reports


def add_notes(vid: str, notes: dict) -> Path:
    """Store reviewed observations (e.g. from Claude looking at the contact sheets)."""
    if not report_path(vid).exists():
        raise StudioError(f"No analysis report for video id {vid!r}. Run `studio.py analyze` first.")
    obs = notes.get("observations")
    if not isinstance(obs, list) or not obs:
        raise StudioError("Notes must contain a non-empty 'observations' list.")
    for i, ob in enumerate(obs):
        for k in ("category", "description", "confidence", "evidence"):
            if not ob.get(k):
                raise StudioError(f"observation {i} is missing '{k}'")
        if ob["confidence"] not in ("low", "medium", "high"):
            raise StudioError(f"observation {i}: confidence must be low/medium/high")
    p = paths.analysis_dir() / f"{vid}.notes.json"
    existing = read_json(p, {"observations": [], "categorical": {}})
    existing["observations"].extend(obs)
    existing.setdefault("categorical", {}).update(notes.get("categorical") or {})
    existing["updated_at"] = now_iso()
    write_json(p, existing)
    # merge into the stored report so the profile sees it without re-analysis
    rep = read_json(report_path(vid))
    cmap = {"low": 0.35, "medium": 0.6, "high": 0.8}
    for ob in obs:
        rep["observations"].append({"category": ob["category"], "feature": ob.get("feature", "review"),
                                    "description": ob["description"], "timestamp": ob.get("timestamp"),
                                    "value": ob.get("value"), "confidence": ob["confidence"],
                                    "confidence_score": cmap[ob["confidence"]],
                                    "evidence": f"reviewer notes: {ob['evidence']}"})
    rep.setdefault("categorical", {}).update(notes.get("categorical") or {})
    write_json(report_path(vid), rep)
    write_text(paths.analysis_dir() / f"{vid}.md", report.to_markdown(rep, rep.get("comparison")))
    return p
