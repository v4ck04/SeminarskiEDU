"""RickClips Studio command line interface.

Every command prints progress and only reports success for work that was
actually completed. Run `python studio.py <command> --help` for options.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from . import log, paths
from .config import flatten, load_settings, load_voice_settings, resolve_production_settings
from .utils import StudioError, load_dotenv_if_present, read_json, say


# ----------------------------------------------------------------------------- environment
def cmd_doctor(args) -> int:
    from .env_check import check
    r = check(verbose=True)
    return 0 if r["ok"] else 1


# ----------------------------------------------------------------------------- training
def cmd_analyze(args) -> int:
    from .analysis import pipeline
    if args.file:
        rep = pipeline.analyze_video(args.file, force=args.force, transcribe_mode=args.transcribe,
                                     use_vision=True if args.vision else None, retranscribe=args.retranscribe)
        from .style import profile
        profile.rebuild(event="analyze", videos=[rep["video"]["id"]])
    else:
        pipeline.analyze_all(Path(args.input) if args.input else None, force=args.force,
                             transcribe_mode=args.transcribe, use_vision=True if args.vision else None,
                             retranscribe=args.retranscribe)
    say("Review the learned style in training/style-profile.md", level="step")
    return 0


def cmd_profile(args) -> int:
    from .style import profile
    if args.rebuild or not paths.style_profile_json().exists():
        profile.rebuild(event="rebuild")
    if args.show:
        print(paths.style_profile_md().read_text(encoding="utf-8"))
    return 0


def cmd_notes(args) -> int:
    from .analysis import pipeline
    from .style import profile
    data = json.loads(Path(args.file).read_text(encoding="utf-8"))
    p = pipeline.add_notes(args.video_id, data)
    say(f"Stored reviewed notes in {p.relative_to(paths.root())}", level="ok")
    profile.rebuild(event="notes", videos=[args.video_id])
    return 0


# ----------------------------------------------------------------------------- production
def cmd_new(args) -> int:
    from .production import pipeline, project
    proj = project.create(args.topic, args.slug)
    pipeline.write_brief(proj)
    say(f"Created project '{proj['slug']}'. Write production/scripts/{proj['slug']}/script.json "
        "(template + STYLE-BRIEF.md are in the same folder), then run `studio.py script "
        f"{proj['slug']}` to validate.", level="ok")
    print(proj["slug"])
    return 0


def cmd_produce(args) -> int:
    from .production import pipeline
    if not args.topic and not args.project:
        raise StudioError("Give a topic, e.g. studio.py produce \"The most mysterious discoveries in space\", or --project <slug>")
    res = pipeline.produce(topic=args.topic, slug=args.project, script_file=args.script, auto_approve=args.auto_approve,
                           provider=args.voice, allow_placeholders=args.allow_placeholders,
                           generate=True if args.generate else None, variants=args.variants)
    print(json.dumps({"slug": res["slug"], "stopped_at": res.get("stopped_at")}))
    return 0 if not res.get("qc") or res["qc"]["verdict"] != "FAIL" else 3


def cmd_script(args) -> int:
    from .production import pipeline, project, script
    proj = project.load(args.slug)
    sdir = paths.scripts_root() / args.slug
    if args.use_variant:
        v = sdir / f"script.variant{args.use_variant}.json"
        if not v.exists():
            raise StudioError(f"{v.name} not found")
        pipeline.stage_script(proj, script_file=str(v))
    elif args.import_file:
        pipeline.stage_script(proj, script_file=args.import_file)
    elif args.generate:
        pipeline.stage_script(proj, generate=True, variants=args.variants, research=not args.no_research, angle=args.angle or "")
    else:
        pipeline.stage_script(proj)
    if args.show and script.script_path(args.slug).exists():
        print((sdir / "script.md").read_text(encoding="utf-8"))
    return 0


def cmd_approve(args) -> int:
    from .production import project
    proj = project.load(args.slug)
    project.approve(proj, args.stage, args.note or "")
    say(f"Approved {args.stage} for '{args.slug}'. Continue with `studio.py produce --project {args.slug}`.", level="ok")
    return 0


def cmd_voice(args) -> int:
    from .production import pipeline, project
    pipeline.stage_voice(project.load(args.slug), args.provider, force=args.force)
    return 0


def cmd_storyboard(args) -> int:
    from .production import pipeline, project
    pipeline.stage_storyboard(project.load(args.slug))
    return 0


def cmd_assets(args) -> int:
    from .production import assets, pipeline, project
    proj = project.load(args.slug)
    if args.reject:
        sb = read_json(paths.project_dirs(args.slug)["storyboard"] / "storyboard.json")
        man = assets.reject(args.slug, args.reject, args.reason or "rejected in review", sb)
        e = next(x for x in man["scenes"] if x["scene"] == args.reject)
        say(f"Scene {args.reject}: rejected the previous asset; now {e['status']} ({e.get('provider')}: "
            f"{e.get('title') or e.get('reason', '')})", level="ok" if e["status"] != "placeholder" else "warn")
        project.set_stage(proj, "assets", "done")
        return 0
    if args.scene:
        if args.generator:
            assets.use_generator(args.slug, args.scene, args.generator, args.text or "")
            say(f"Scene {args.scene} now uses the '{args.generator}' generator", level="ok")
        elif args.file:
            assets.assign_file(args.slug, args.scene, args.file, args.license or "user-provided", args.attribution)
            say(f"Scene {args.scene} now uses {args.file}", level="ok")
        else:
            raise StudioError("--scene needs --file or --generator")
        project.set_stage(proj, "assets", "done")
        return 0
    if args.status:
        for n, (ok, why) in assets.provider_status().items():
            say(f"{n}: {'available' if ok else 'unavailable'} - {why}", level="ok" if ok else "info")
        return 0
    pipeline.stage_assets(proj, refresh=args.refresh)
    return 0


def cmd_subtitles(args) -> int:
    from .production import pipeline, project
    pipeline.stage_subtitles(project.load(args.slug))
    return 0


def cmd_mix(args) -> int:
    from .production import pipeline, project, render
    proj = project.load(args.slug)
    render.build_audio(args.slug, pipeline.settings_for(proj), force=True)
    return 0


def cmd_preview(args) -> int:
    from .production import pipeline, project
    pipeline.stage_preview(project.load(args.slug))
    say(f"Preview: production/previews/{args.slug}/preview.mp4 - approve with `studio.py approve {args.slug} preview`", level="step")
    return 0


def cmd_render(args) -> int:
    from .production import pipeline, project
    proj = project.load(args.slug)
    if load_settings()["workflow"].get("require_preview_approval", True) and not project.is_approved(proj, "preview") \
            and not args.skip_approval:
        raise StudioError(f"The preview is not approved yet. Watch it and run `studio.py approve {args.slug} preview` "
                          "(or pass --skip-approval).")
    out = pipeline.stage_final(proj, allow_placeholders=args.allow_placeholders)
    return 0 if out["qc"]["verdict"] != "FAIL" else 3


def cmd_qc(args) -> int:
    from .production import pipeline, project, qc
    proj = project.load(args.slug)
    d = paths.project_dirs(args.slug)
    f = Path(args.file) if args.file else (d["preview"] / "preview.mp4" if args.preview else d["export"] / "final-video.mp4")
    rep = qc.run(args.slug, f, final=not args.preview, settings=pipeline.settings_for(proj))
    return 0 if rep["verdict"] != "FAIL" else 3


# ----------------------------------------------------------------------------- feedback
def cmd_feedback(args) -> int:
    from .production import project
    from .style import feedback
    project.load(args.slug)
    ratings = {}
    for r in args.rating or []:
        if "=" not in r:
            raise StudioError("Ratings look like hook=4 subtitles=3")
        k, v = r.split("=", 1)
        ratings[k.strip()] = int(v)
    comment = args.comment or ""
    if not ratings and not comment:
        if not sys.stdin.isatty():
            raise StudioError("Pass --rating key=1..5 and/or --comment \"...\"")
        say("Rate 1-5 (Enter to skip):", level="step")
        for k in feedback.RATING_KEYS:
            v = input(f"  {k.replace('_', ' ')}: ").strip()
            if v:
                ratings[k] = int(v)
        comment = input("  Free-form feedback: ").strip()
    p = feedback.record(args.slug, ratings, comment, apply_globally=args.apply_globally)
    data = read_json(p)
    say(f"Feedback saved: {p.relative_to(paths.root())}", level="ok")
    for d in data["directives"]:
        say(f"  understood: {d['note']} -> {d['param']}")
    if comment and not data["directives"]:
        say("  (no automatic adjustment recognised - the comment is kept for review)")
    say("Run `studio.py improve` to apply preferences that have been repeated across videos.")
    return 0


def cmd_improve(args) -> int:
    from .style import feedback
    feedback.improve(force=args.force, dry_run=args.dry_run)
    return 0


# ----------------------------------------------------------------------------- status & info
def cmd_status(args) -> int:
    from .analysis.pipeline import list_inputs
    from .production import assets, project, tts
    if args.slug:
        proj = project.load(args.slug)
        say(f"Project {proj['slug']}: {proj['topic']}", level="step")
        say(project.summary(proj))
        for st, info in proj["stages"].items():
            extra = {k: v for k, v in info.items() if k not in ("status", "at")}
            if extra:
                say(f"  {st}: {json.dumps(extra)[:160]}")
        return 0
    say("RickClips Studio status", level="step")
    try:
        vids = list_inputs()
    except Exception:
        vids = []
    reports = [p for p in paths.analysis_dir().glob("*.json") if not p.name.endswith((".transcript.json", ".notes.json"))]
    say(f"Reference videos: {len(vids)} in training/input, {len(reports)} analysed")
    prof = read_json(paths.style_profile_json())
    if prof:
        feats = prof["features"]
        cnt = {s: sum(1 for f in feats.values() if f["status"] == s) for s in ("frequent", "occasional", "uncertain")}
        say(f"Style profile v{prof['version']} ({prof['updated_at']}): {cnt['frequent']} frequent, "
            f"{cnt['occasional']} occasional, {cnt['uncertain']} uncertain characteristics")
        applied = [k for k, p in prof.get("production", {}).items() if p["status"] == "frequent"]
        say(f"Learned parameters applied in production: {len(applied)} ({', '.join(applied[:8])}{'...' if len(applied) > 8 else ''})")
    else:
        say("No style profile yet - run `studio.py analyze`")
    hist = read_json(paths.training_history(), {"events": []})
    say(f"Training events: {len(hist['events'])}")
    fb = list(paths.feedback_dir().glob("*.json"))
    prefs = read_json(paths.preferences_file(), {}) or {}
    say(f"Feedback reports: {len(fb)}; applied preferences: {len(prefs.get('params', {}))}")
    for n in tts.PROVIDERS:
        st = tts.provider_status(n)
        say(f"Voice {n}: {'available' if st['available'] else 'unavailable'} - {st['reason']}",
            level="ok" if st["available"] else "info")
    for n, (ok, why) in assets.provider_status().items():
        say(f"Assets {n}: {'available' if ok else 'unavailable'} - {why}", level="ok" if ok else "info")
    lib = [p for p in paths.footage_library().rglob("*") if p.is_file() and not p.name.startswith(".") and p.suffix != ".json"]
    say(f"Your footage library: {len(lib)} file(s); music library: "
        f"{len([p for p in paths.music_library().glob('*') if p.suffix.lower() in ('.mp3', '.wav', '.m4a', '.ogg', '.flac')])} track(s)")
    slugs = project.list_slugs()
    say(f"Projects: {len(slugs)}")
    for s in slugs[-10:]:
        say(f"  {s}: {project.summary(project.load(s))}")
    if args.settings:
        settings, prov = resolve_production_settings()
        say("Resolved production settings (source):", level="step")
        for k, v in sorted(flatten(settings).items()):
            print(f"  {k} = {v}   [{prov.get(k, 'default')}]")
    return 0


def cmd_voices(args) -> int:
    from .production import tts
    vc = load_voice_settings()
    for n in tts.PROVIDERS:
        st = tts.provider_status(n, vc)
        line = f"{n}: {'available' if st['available'] else 'unavailable'} - {st['reason']} [{st['quality']}]"
        if st["available"] and args.test:
            ok, msg = tts.probe_provider(tts.PROVIDERS[n](vc.get(n, {})))
            line += f" -> test {'OK' if ok else 'FAILED'}: {msg}"
        say(line, level="ok" if st["available"] else "info")
    say("Voice policy: use stock/licensed voices only - never a clone of another creator's voice without written permission.")
    return 0


def cmd_sample(args) -> int:
    """Create the bundled sample project and (optionally) run it end to end."""
    from .production import pipeline, project
    src = paths.REPO_ROOT / "samples" / "space-mysteries" / ("script-online.json" if args.online else "script.json")
    proj = project.create("The most mysterious discoveries in space", "sample-space-mysteries")
    say(f"Sample project '{proj['slug']}' from {src.relative_to(paths.REPO_ROOT)}", level="step")
    res = pipeline.produce(slug=proj["slug"], script_file=str(src), auto_approve=args.auto_approve,
                           provider=args.voice, allow_placeholders=True)
    print(json.dumps({"slug": res["slug"], "stopped_at": res.get("stopped_at")}))
    return 0


# ----------------------------------------------------------------------------- parser
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="studio.py", description="RickClips Studio - YouTube Shorts production")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("doctor", help="Inspect the environment (Python, FFmpeg, GPU, keys, TTS)")
    s.set_defaults(func=cmd_doctor)

    s = sub.add_parser("analyze", help="Analyse reference videos in training/input and update the style profile")
    s.add_argument("--input", help="folder with reference videos (default training/input)")
    s.add_argument("--file", help="analyse a single video file")
    s.add_argument("--force", action="store_true", help="re-analyse videos that were already analysed")
    s.add_argument("--retranscribe", action="store_true", help="redo speech transcription (otherwise cached)")
    s.add_argument("--transcribe", choices=["auto", "faster-whisper", "openai", "none"], help="transcription provider")
    s.add_argument("--vision", action="store_true", help="visual AI review of contact sheets via the Claude API")
    s.set_defaults(func=cmd_analyze)

    s = sub.add_parser("profile", help="Rebuild or print the style profile")
    s.add_argument("--rebuild", action="store_true")
    s.add_argument("--show", action="store_true")
    s.set_defaults(func=cmd_profile)

    s = sub.add_parser("notes", help="Add reviewed observations (JSON) to an analysed video")
    s.add_argument("video_id")
    s.add_argument("--file", required=True, help="JSON: {\"observations\": [{category, description, confidence, evidence, timestamp?}]}")
    s.set_defaults(func=cmd_notes)

    s = sub.add_parser("produce", help="Topic -> finished Short (stops at approval gates)")
    s.add_argument("topic", nargs="?")
    s.add_argument("--project", help="continue an existing project")
    s.add_argument("--script", help="use this script.json")
    s.add_argument("--generate", action="store_true", help="generate the script with the Claude API")
    s.add_argument("--variants", type=int, default=1)
    s.add_argument("--voice", help="TTS provider (elevenlabs, openai, edge, pyttsx3, flite)")
    s.add_argument("--auto-approve", action="store_true", help="skip the script and preview approval gates")
    s.add_argument("--allow-placeholders", action="store_true")
    s.set_defaults(func=cmd_produce)

    s = sub.add_parser("new", help="Create a project for a topic")
    s.add_argument("topic")
    s.add_argument("--slug")
    s.set_defaults(func=cmd_new)

    s = sub.add_parser("script", help="Validate / generate / import a project's script")
    s.add_argument("slug")
    s.add_argument("--generate", action="store_true")
    s.add_argument("--variants", type=int, default=1)
    s.add_argument("--no-research", action="store_true")
    s.add_argument("--angle")
    s.add_argument("--import", dest="import_file")
    s.add_argument("--use-variant", type=int)
    s.add_argument("--show", action="store_true")
    s.set_defaults(func=cmd_script)

    s = sub.add_parser("approve", help="Approve the script or preview")
    s.add_argument("slug")
    s.add_argument("stage", choices=["script", "preview", "final"])
    s.add_argument("--note")
    s.set_defaults(func=cmd_approve)

    s = sub.add_parser("voice", help="Generate the AI narration")
    s.add_argument("slug")
    s.add_argument("--provider")
    s.add_argument("--force", action="store_true", help="ignore cached sentences")
    s.set_defaults(func=cmd_voice)

    s = sub.add_parser("storyboard", help="Rebuild the storyboard from the narration timing")
    s.add_argument("slug")
    s.set_defaults(func=cmd_storyboard)

    s = sub.add_parser("assets", help="Find/download visuals, or assign your own file to a scene")
    s.add_argument("slug")
    s.add_argument("--refresh", action="store_true")
    s.add_argument("--status", action="store_true", help="show which asset sources are available")
    s.add_argument("--scene", type=int)
    s.add_argument("--file")
    s.add_argument("--license")
    s.add_argument("--attribution")
    s.add_argument("--generator", help="with --scene: use a procedural visual (starfield, planet, gradient_flow, particles, grid, waves, text_card)")
    s.add_argument("--text", help="on-screen text for --generator text_card")
    s.add_argument("--reject", type=int, metavar="SCENE", help="reject this scene's asset and fetch the next candidate")
    s.add_argument("--reason", help="why the asset was rejected (kept in the manifest)")
    s.set_defaults(func=cmd_assets)

    s = sub.add_parser("subtitles", help="Build SRT + ASS subtitles")
    s.add_argument("slug")
    s.set_defaults(func=cmd_subtitles)

    s = sub.add_parser("mix", help="Re-mix the audio (voice, music, effects)")
    s.add_argument("slug")
    s.set_defaults(func=cmd_mix)

    s = sub.add_parser("preview", help="Render the low-resolution preview")
    s.add_argument("slug")
    s.set_defaults(func=cmd_preview)

    s = sub.add_parser("render", help="Render the final 1080x1920 video + QC + deliverables")
    s.add_argument("slug")
    s.add_argument("--allow-placeholders", action="store_true")
    s.add_argument("--skip-approval", action="store_true")
    s.set_defaults(func=cmd_render)

    s = sub.add_parser("qc", help="Run quality control on a rendered file")
    s.add_argument("slug")
    s.add_argument("--preview", action="store_true")
    s.add_argument("--file")
    s.set_defaults(func=cmd_qc)

    s = sub.add_parser("feedback", help="Rate a finished video (interactive, or --rating/--comment)")
    s.add_argument("slug")
    s.add_argument("--rating", action="append", help="e.g. --rating hook=4 --rating subtitles=2")
    s.add_argument("--comment")
    s.add_argument("--global", dest="apply_globally", action="store_true", help="apply immediately as a global rule")
    s.set_defaults(func=cmd_feedback)

    s = sub.add_parser("improve", help="Turn repeated feedback into style preferences")
    s.add_argument("--force", action="store_true", help="apply single (non-repeated) feedback too")
    s.add_argument("--dry-run", action="store_true")
    s.set_defaults(func=cmd_improve)

    s = sub.add_parser("status", help="Training progress, profile, providers, projects")
    s.add_argument("slug", nargs="?")
    s.add_argument("--settings", action="store_true", help="show resolved production settings and their source")
    s.set_defaults(func=cmd_status)

    s = sub.add_parser("voices", help="List text-to-speech providers")
    s.add_argument("--test", action="store_true", help="synthesize a test phrase with each available provider")
    s.set_defaults(func=cmd_voices)

    s = sub.add_parser("sample", help="Build the bundled sample Short end to end")
    s.add_argument("--online", action="store_true", help="use the sample that sources NASA/Wikimedia images")
    s.add_argument("--voice", help="TTS provider")
    s.add_argument("--auto-approve", action="store_true")
    s.set_defaults(func=cmd_sample)
    return p


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    load_dotenv_if_present()
    log.setup(load_settings().get("logging", {}).get("level", "INFO"))
    args = build_parser().parse_args(argv)
    try:
        return int(args.func(args) or 0)
    except StudioError as e:
        say(str(e), level="fail")
        log.get().error("StudioError: %s", e)
        return 2
    except KeyboardInterrupt:
        say("Interrupted.", level="warn")
        return 130
    except Exception as e:  # unexpected: short message for the user, full traceback in the log
        log.get().exception("unexpected error in %s", args.command)
        say(f"Unexpected error: {type(e).__name__}: {e} (details in logs/studio.log)", level="fail")
        return 1
