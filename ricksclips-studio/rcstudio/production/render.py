"""Audio mix + preview/final rendering for a project."""
from __future__ import annotations

import shutil
from pathlib import Path

from .. import ffmpeg, log, paths
from ..config import load_editing_defaults, load_settings, load_voice_settings
from ..utils import StudioError, now_iso, read_json, say, stable_seed, write_json
from . import audio_gen, compositor, mixer
from . import project as projmod

_log = log.get("render")


def _load_inputs(slug: str) -> dict:
    d = paths.project_dirs(slug)
    sb = read_json(d["storyboard"] / "storyboard.json")
    timing = read_json(d["voice"] / "timing.json")
    man = read_json(d["footage"] / "asset-manifest.json")
    caps = read_json(d["subtitles"] / "captions.json")
    missing = [n for n, v in (("storyboard", sb), ("voice timing", timing), ("asset manifest", man), ("subtitles", caps)) if not v]
    if missing:
        raise StudioError(f"Missing {', '.join(missing)} for '{slug}'. Run the earlier stages first (`studio.py produce --project {slug}`).")
    if sb.get("timing_source") != "voice":
        raise StudioError("Storyboard still uses estimated timings - regenerate it after the voice (`studio.py storyboard`).")
    return {"dirs": d, "storyboard": sb, "timing": timing, "manifest": man, "captions": caps}


def build_audio(slug: str, settings: dict, force: bool = False) -> dict:
    inp = _load_inputs(slug)
    d, sb = inp["dirs"], inp["storyboard"]
    mixdir = d["audio"]
    report_path = mixdir / "mix-report.json"
    narration = paths.root() / inp["timing"]["narration_file"]
    duration = sb["duration"]
    music = None
    mus_meta = None
    if settings["audio"].get("music_enabled", True):
        music, mus_meta = audio_gen.music_file(slug, sb.get("music_mood", "mysterious"), duration + 0.5,
                                               stable_seed(slug, "music"))
    sfx, sfx_meta = [], []
    k = 0
    for sc in sb["scenes"]:
        for ev in sc.get("sfx", []):
            f, meta = audio_gen.sfx_file(ev["type"], k)
            t = ev["time"]
            if ev["type"] == "whoosh" and "lead" in meta:   # storyboard: whoosh 0.1 s before the cut -> its peak on the cut
                t = round(max(0.0, t + 0.1 - meta["lead"]), 3)
            sfx.append({"type": ev["type"], "time": t, "file": str(f), "gain_db": ev.get("gain_db", 0.0)})
            sfx_meta.append({**meta, "type": ev["type"], "time": t})
            k += 1
    say("Mixing audio (voice processing, music, effects, mastering)...", level="step")
    rep = mixer.mix(narration, music, sfx, duration, mixdir, settings, load_voice_settings())
    rep["created_at"] = now_iso()
    write_json(report_path, rep)
    # audio entries in the asset manifest
    man_path = d["footage"] / "asset-manifest.json"
    man = read_json(man_path)
    man["audio"] = ([{"role": "music", **mus_meta}] if mus_meta else []) + [{"role": "sfx", **m} for m in sfx_meta] + \
                   [{"role": "narration", "source": "text-to-speech", "provider": inp["timing"]["provider"],
                     "license": "generated narration - check the TTS provider's terms", "file": inp["timing"]["narration_file"]}]
    write_json(man_path, man)
    proj = projmod.load(slug)
    projmod.set_stage(proj, "audio", "done", lufs=rep["master"]["integrated_lufs"])
    return rep


def build_timeline(slug: str, settings: dict, W: int, H: int, fps: float, inp: dict) -> list[compositor.TimelineScene]:
    sb, man = inp["storyboard"], inp["manifest"]
    by_scene = {e["scene"]: e for e in man["scenes"]}
    ed = settings["editing"]
    pal = settings.get("visuals", {}).get("palette")
    scenes = []
    margin = 1.0 + max(0.06, float(ed.get("motion_intensity", 0.08)) * 1.7, float(ed.get("punch_in_amount", 0.12)) + 0.04)
    margin = min(1.45, margin)
    for i, sc in enumerate(sb["scenes"]):
        e = by_scene.get(sc["scene"])
        if not e:
            raise StudioError(f"Scene {sc['scene']} has no asset - run `studio.py assets {slug}`")
        pre = sc["transition_in"]["duration"] / 2
        nxt = sb["scenes"][i + 1] if i + 1 < len(sb["scenes"]) else None
        post = nxt["transition_in"]["duration"] / 2 if nxt else 0.0
        r0, r1 = max(0.0, sc["start"] - pre), sc["end"] + post
        seed = stable_seed(slug, sc["scene"])
        if e["status"] in ("ok", "user") and e.get("file"):
            f = paths.root() / e["file"]
            if not f.exists():
                raise StudioError(f"Asset file missing for scene {sc['scene']}: {e['file']}")
            if e.get("kind") == "video":
                src = compositor.VideoSource(f, W, H, margin, fps, need=r1 - r0, speed=sc.get("speed", 1.0),
                                             layout=ed.get("horizontal_footage_layout", "cover"),
                                             normalize=ed.get("normalize_sources", True))
            else:
                src = compositor.ImageSource(f, W, H, margin, layout=ed.get("horizontal_footage_layout", "cover"),
                                             normalize=ed.get("normalize_sources", True))
        else:
            gen = e.get("generator") or "placeholder"
            src = compositor.GenSource(gen, W, H, seed, pal, text=e.get("on_screen_text") or sc["visual"].get("on_screen_text", ""),
                                       description=e.get("description") or sc.get("visual_description", ""))
        mtype = sc["motion"]["type"]
        scenes.append(compositor.TimelineScene(sc["scene"], sc["start"], sc["end"], r0, r1, src, mtype,
                                               float(sc["motion"]["intensity"]), sc["transition_in"]["type"],
                                               sc["transition_in"]["duration"], label=e["status"]))
    return scenes


def _vf_and_fonts(inp: dict, grade_vf: str) -> tuple[str, Path]:
    sdir = inp["dirs"]["subtitles"]
    if not (sdir / "captions.ass").exists():
        raise StudioError("captions.ass missing - run the subtitles stage")
    if not ffmpeg.has_filter("subtitles"):
        raise StudioError("This FFmpeg build has no 'subtitles' (libass) filter. Install a full build (winget install Gyan.FFmpeg).")
    # relative paths + cwd avoid Windows drive-letter escaping problems in filter arguments
    return f"{grade_vf},subtitles=captions.ass:fontsdir=fonts", sdir


def render(slug: str, settings: dict, preview: bool, allow_placeholders: bool = False) -> dict:
    app = load_settings()
    exp = app["export"]
    inp = _load_inputs(slug)
    d = inp["dirs"]
    proj = projmod.load(slug)
    placeholders = [e["scene"] for e in inp["manifest"]["scenes"] if e["status"] == "placeholder"]
    if not preview and placeholders and not (allow_placeholders or app["workflow"].get("allow_placeholders_in_final")):
        raise StudioError(f"Scenes {placeholders} still use placeholders. Supply footage (`studio.py assets {slug} --scene N --file ...`), "
                          "add API keys, or pass --allow-placeholders to export anyway.")
    if not (d["audio"] / "mixed.wav").exists() or proj["stages"].get("audio", {}).get("status") != "done":
        build_audio(slug, settings)
    if preview:
        W, H, crf, preset = exp["preview"]["width"], exp["preview"]["height"], exp["preview"]["crf"], exp["preview"]["preset"]
        out = d["preview"] / "preview.mp4"
    else:
        W, H, crf, preset = exp["width"], exp["height"], exp["crf"], exp["preset"]
        out = d["export"] / "final-video.mp4"
    fps = float(exp.get("fps", 30))
    scenes = build_timeline(slug, settings, W, H, fps, inp)
    grade_vf, grade_info = compositor.grade_filters(scenes, settings["color"], load_editing_defaults().get("color", {}))
    vf, cwd = _vf_and_fonts(inp, grade_vf)
    say(f"Rendering {'preview' if preview else 'final'} {W}x{H} @ {fps:g} fps, {inp['storyboard']['duration']:.1f}s, "
        f"{len(scenes)} scenes...", level="step")
    stats = compositor.render(scenes, out, W, H, fps, inp["storyboard"]["duration"], d["audio"] / "mixed.wav", vf, cwd,
                              crf, preset, watermark="PREVIEW" if preview and exp["preview"].get("watermark", True) else None,
                              shake=float(settings["editing"].get("shake_amount", 0.0)),
                              grain=float(settings.get("visuals", {}).get("grain", 0.0)))
    say(f"{out.name}: {stats['frames']} frames in {stats['seconds']}s ({stats['fps']} fps)", level="ok")
    result = {"file": str(out), "width": W, "height": H, "fps": fps, "grade": grade_info, "render": stats,
              "placeholders": placeholders, "created_at": now_iso()}
    if preview:
        _contact(out, inp["storyboard"], d["preview"] / "preview-contact.jpg")
        result["contact_sheet"] = str(d["preview"] / "preview-contact.jpg")
        projmod.set_stage(proj, "preview", "done", file=str(out.relative_to(paths.root())), hash=result["created_at"])
    else:
        projmod.set_stage(proj, "final", "done", file=str(out.relative_to(paths.root())), hash=result["created_at"])
    write_json(out.with_suffix(".render.json"), result)
    return result


def _contact(video: Path, sb: dict, out: Path) -> None:
    from ..analysis.frames import contact_sheet, extract_frame
    items = []
    tmp = out.parent / "frames"
    for sc in sb["scenes"]:
        t = (sc["start"] + sc["end"]) / 2
        p = extract_frame(video, t, tmp / f"scene_{sc['scene']:03d}.jpg", width=270)
        if p:
            items.append((p, f"#{sc['scene']} {t:.1f}s {sc['motion']['type']}"))
    contact_sheet(items, out, cols=6, thumb_w=180, title=f"{sb['title']} - preview, one frame per scene")


def export_deliverables(slug: str) -> dict:
    d = paths.project_dirs(slug)
    ex = d["export"]
    copies = {
        d["subtitles"] / "subtitles.srt": ex / "subtitles.srt",
        d["subtitles"] / "captions.ass": ex / "captions.ass",
        d["storyboard"] / "storyboard.json": ex / "storyboard.json",
        d["storyboard"] / "storyboard.md": ex / "storyboard.md",
        paths.scripts_root() / slug / "script.md": ex / "script.md",
        paths.scripts_root() / slug / "script.json": ex / "script.json",
        d["footage"] / "asset-manifest.json": ex / "asset-manifest.json",
        d["audio"] / "mixed.wav": ex / "audio-mix.wav",
        d["voice"] / "narration.wav": ex / "narration.wav",
        d["preview"] / "preview.mp4": ex / "preview.mp4",
    }
    done = []
    for src, dst in copies.items():
        if src.exists():
            shutil.copy(src, dst)
            done.append(dst.name)
    log_src = paths.logs_dir() / f"{slug}.log"
    if log_src.exists():
        shutil.copy(log_src, ex / "production.log")
        done.append("production.log")
    _credits(slug, ex)
    done.append("credits.txt")
    return {"dir": str(ex), "files": sorted(done)}


def _credits(slug: str, ex: Path) -> None:
    man = read_json(paths.project_dirs(slug)["footage"] / "asset-manifest.json", {}) or {}
    lines = ["Credits / attributions (paste into the video description where required)", ""]
    for e in man.get("scenes", []):
        if e["status"] in ("ok", "user") and e.get("file"):
            lines.append(f"Scene {e['scene']}: {e.get('title') or e.get('file')} - {e.get('attribution') or 'unknown author'} "
                         f"({e.get('provider')}, {e.get('license')}) {e.get('page_url') or ''}".strip())
    for a in man.get("audio", []):
        lines.append(f"{a['role']}: {a.get('file')} - {a.get('license')}" + (f" - {a['attribution']}" if a.get("attribution") else ""))
    (ex / "credits.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
