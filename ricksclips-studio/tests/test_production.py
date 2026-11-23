"""Script, storyboard, voice, subtitles, mixing, rendering, QC and the full pipeline."""
from __future__ import annotations

import json
import re
import shutil

import numpy as np
import pytest

from conftest import SAMPLE_SCRIPT, media, small_export
from rcstudio import ffmpeg, paths
from rcstudio.utils import read_json


def settings():
    from rcstudio.config import resolve_production_settings
    return resolve_production_settings()[0]


def app():
    from rcstudio.config import load_settings
    return load_settings()


# ----------------------------------------------------------------------------- script
def test_script_validation(workspace):
    from rcstudio.production import script
    s = json.loads(SAMPLE_SCRIPT.read_text())
    val = script.validate(s, settings(), app())
    assert not val["errors"], val["errors"]
    assert val["stats"]["words"] > 50
    bad = json.loads(SAMPLE_SCRIPT.read_text())
    bad["beats"][1]["text"] = ""
    bad["beats"][2]["visual"] = {"type": "generated", "generator": "nope"}
    bad["beats"][3]["text"] += " In this video, let's dive in."
    bad["sources"] = []
    v2 = script.validate(bad, settings(), app())
    assert any("empty" in e for e in v2["errors"])
    assert any("generator" in e for e in v2["errors"])
    assert any("filler" in w for w in v2["warnings"])
    assert any("no sources" in w for w in v2["warnings"])


def test_originality_check_against_reference_transcripts(workspace):
    from rcstudio.production import script
    (paths.analysis_dir() / "ref-1.transcript.json").write_text(json.dumps(
        {"text": "then suddenly an object from another star system flew past us"}))
    s = json.loads(SAMPLE_SCRIPT.read_text())
    val = script.validate(s, settings(), app())
    assert any(w.startswith("originality") for w in val["warnings"])


def test_storyboard_from_estimate_and_timing(workspace):
    from rcstudio.production import script, storyboard
    s = script.normalize(json.loads(SAMPLE_SCRIPT.read_text()))
    sb = storyboard.build(s, settings(), "t")
    sc = sb["scenes"]
    assert sb["timing_source"] == "estimate"
    assert sc[0]["start"] == 0 and sc[-1]["end"] == pytest.approx(sb["duration"])
    for a, b in zip(sc, sc[1:]):
        assert a["end"] == pytest.approx(b["start"])               # contiguous
        if a["beat_id"] == b["beat_id"]:
            assert b["transition_in"]["type"] == "cut"            # fancy transitions only between beats
    assert sc[0]["motion"]["type"] == "punch_in"
    assert all(x["required_footage"] and x["visual_description"] for x in sc)
    assert sb == storyboard.build(s, settings(), "t") | {"created_at": sb["created_at"]}  # deterministic


# ----------------------------------------------------------------------------- voice
def test_pronunciation_and_word_alignment():
    from rcstudio.production.voice import align_words, apply_pronunciations
    assert apply_pronunciations("Named Oumuamua, really.", {"Oumuamua": "oh moo ah moo ah"}) == "Named oh moo ah moo ah, really."
    orig = "Named Oumuamua, really.".split()
    spoken = [{"word": w, "start": i * 0.3, "end": i * 0.3 + 0.25} for i, w in enumerate("Named oh moo ah moo ah, really.".split())]
    al = align_words(orig, spoken)
    assert [w["word"] for w in al] == orig
    assert al[1]["start"] == pytest.approx(0.3) and al[1]["end"] == pytest.approx(1.75)
    assert al[2]["start"] == pytest.approx(1.8)


def test_voice_generation_with_timings(workspace, synthetic_tts):
    from rcstudio.config import load_voice_settings
    from rcstudio.production import project, script, voice
    project.create("t", "v")
    s = script.normalize(json.loads(SAMPLE_SCRIPT.read_text()))
    timing = voice.generate("v", s, settings(), load_voice_settings(), provider_name=synthetic_tts)
    n_sent = sum(len(re.split(r"(?<=[.!?])\s+", b["text"])) for b in s["beats"])
    assert len(timing["sentences"]) == n_sent
    prev = 0
    for st in timing["sentences"]:
        assert st["start"] >= prev and st["end"] > st["start"]
        assert [w["word"] for w in st["words"]] == st["text"].split()
        for w in st["words"]:
            assert st["start"] - 0.01 <= w["start"] <= w["end"] <= st["end"] + 0.01
        prev = st["end"]
    nar = paths.root() / timing["narration_file"]
    assert media(nar)["duration"] == pytest.approx(timing["duration"], abs=0.05)
    again = voice.generate("v", s, settings(), load_voice_settings(), provider_name=synthetic_tts)
    assert again["sentences"][0]["file"] == timing["sentences"][0]["file"]        # cached


def test_flite_provider_if_available(workspace):
    from rcstudio.production import tts
    p = tts.FliteTTS({"voice": "slt"})
    ok, why = p.status()
    if not ok:
        pytest.skip(why)
    r = p.synthesize("Testing the offline voice.", workspace / "f.wav")
    assert r.duration > 0.5


# ----------------------------------------------------------------------------- subtitles
def _timing(text_sentences):
    sents, t = [], 0.1
    for i, s in enumerate(text_sentences):
        ws = []
        for w in s.split():
            ws.append({"word": w, "start": round(t, 3), "end": round(t + 0.25, 3)})
            t += 0.3
        sents.append({"index": i, "beat_id": i + 1, "text": s, "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
        t += 0.4
    return {"sentences": sents}


def test_caption_chunking_rules():
    from rcstudio.production.subtitles import chunk
    timing = _timing(["This signal lasted seventy-two seconds, and then it vanished.", "Nobody knows why."])
    caps = chunk(timing, {"max_words": 3, "max_chars_per_line": 16, "max_lines": 2, "hold_s": 0.1, "min_duration_s": 0.3},
                 {"seventy-two"})
    assert all(len(c["words"]) <= 3 for c in caps)
    assert not any(c["words"][-1]["word"].lower() in ("and", "the", "a") and i < len(caps) - 1
                   for i, c in enumerate(caps) if c["sentence"] == caps[min(i + 1, len(caps) - 1)]["sentence"])
    assert {c["sentence"] for c in caps if "Nobody" in c["text"]} == {1}           # no sentence spanning
    assert any(c["text"].endswith("seconds,") for c in caps)                        # breaks after punctuation
    for a, b in zip(caps, caps[1:]):
        assert a["end"] <= b["start"] + 1e-6
    words = [w["word"] for c in caps for w in c["words"]]
    assert words == " ".join(s["text"] for s in timing["sentences"]).split()
    hl = [c for c in caps if c["emphasis"]]
    assert hl and "seventy-two" in hl[0]["text"]


def test_srt_and_ass_output():
    from rcstudio.production.subtitles import chunk, to_ass, to_srt
    caps = chunk(_timing(["One small step for man.", "A giant leap."]), {"max_words": 2}, set())
    srt = to_srt(caps)
    blocks = srt.strip().split("\n\n")
    assert len(blocks) == len(caps)
    assert re.match(r"1\n00:00:00,100 --> 00:00:00,\d{3}\nOne small", blocks[0])
    cap = {"font_size": 110, "effective_font_size": 110, "position_y": 0.6, "animation": "pop",
           "highlight_mode": "active_word", "uppercase": True, "primary_color": "#FFFFFF", "highlight_color": "#FFD400"}
    ass = to_ass(caps, cap, "Poppins Black")
    assert "PlayResX: 1080" in ass and "Style: Main,Poppins Black,110" in ass
    events = [l for l in ass.splitlines() if l.startswith("Dialogue:")]
    assert len(events) == sum(len(c["words"]) for c in caps)                       # one event per active word
    assert "\\c&H0000D4FF" in ass                                                   # highlight colour BGR
    assert "\\t(0,80,\\fscx108" in events[0]                                        # pop animation
    assert "\\pos(" in events[0]


def test_font_calibration(workspace):
    from rcstudio.production.subtitles import font_metrics
    m = font_metrics("Poppins-Black.ttf")
    assert 0.25 < m["height_ratio"] < 0.8 and m["stroke_ratio"] > 0.1
    a = font_metrics("Anton-Regular.ttf")
    assert a["char_aspect"] < m["char_aspect"]          # Anton is condensed


# ----------------------------------------------------------------------------- audio
def test_sfx_and_music_generation(workspace):
    from rcstudio.production import audio_gen
    for k in audio_gen.SFX_TYPES:
        p, meta = audio_gen.sfx_file(k)
        assert p.exists() and meta["source"] == "generated"
    x = audio_gen.music("upbeat", 6.0, 1)
    assert x.shape == (6 * 48000, 2) and 0.5 < np.abs(x).max() <= 1.0


def test_mixer_loudness_ducking_and_clipping(workspace):
    from rcstudio.config import load_voice_settings
    from rcstudio.production import audio_gen, mixer
    from conftest import SyntheticTTS
    v = SyntheticTTS().synthesize("one two three four five six seven eight nine ten eleven twelve", workspace / "v.wav")
    mus = workspace / "m.wav"
    ffmpeg.write_wav(mus, audio_gen.music("mysterious", v.duration + 1, 2), 48000)
    sfx, _ = audio_gen.sfx_file("impact")
    st = settings()
    rep = mixer.mix(v.path, mus, [{"type": "impact", "time": 0.1, "file": str(sfx)}], v.duration + 0.5,
                    workspace / "mix", st, load_voice_settings())
    m = rep["master"]
    assert m["integrated_lufs"] == pytest.approx(st["audio"]["target_lufs"], abs=1.0)
    assert m["true_peak_db"] <= st["audio"]["true_peak_db"] + 0.3
    assert m["clipped_samples"] == 0
    assert rep["voice_to_music_db"] >= 10
    assert m["duration"] == pytest.approx(v.duration + 0.5, abs=0.02)


# ----------------------------------------------------------------------------- rendering
def test_compositor_motion_and_transitions(workspace):
    import cv2
    from rcstudio.production import compositor
    W, H = 180, 320
    img = np.zeros((900, 600, 3), np.uint8)
    cv2.circle(img, (300, 450), 120, (0, 200, 255), -1)
    p = workspace / "img.png"
    cv2.imwrite(str(p), img)
    src = compositor.ImageSource(p, W, H, 1.2, normalize=False)
    M0 = compositor.motion_matrix("zoom_in", 0.2, 0.0, 0.0, src.size, src.margin, W, H)
    M1 = compositor.motion_matrix("zoom_in", 0.2, 1.0, 1.0, src.size, src.margin, W, H)
    assert M1[0, 0] == pytest.approx(M0[0, 0] * 1.2)
    a, b = np.zeros((H, W, 3), np.uint8), np.full((H, W, 3), 200, np.uint8)
    for kind in ("crossfade", "dip_black", "flash", "whip", "zoom", "cut"):
        mid = compositor.blend(kind, a, b, 0.5)
        assert mid.shape == a.shape
        assert compositor.blend(kind, a, b, 1.0).mean() == pytest.approx(200, abs=25)
    assert compositor.blend("dip_black", a, b, 0.5).mean() < 5


def test_render_qc_and_negative_qc(workspace, synthetic_tts):
    """Full pipeline at reduced size, QC must pass; a corrupted copy must fail QC."""
    small_export(workspace)
    from rcstudio.production import pipeline, qc
    res = pipeline.produce(topic="Space mysteries test", script_file=str(SAMPLE_SCRIPT), auto_approve=True,
                           provider=synthetic_tts)
    slug = res["slug"]
    assert res["stopped_at"] is None
    assert res["qc"]["verdict"] in ("PASS", "PASS WITH WARNINGS"), [c for c in res["qc"]["checks"] if c["status"] != "pass"]
    ex = paths.project_dirs(slug)["export"]
    for f in ("final-video.mp4", "subtitles.srt", "storyboard.json", "script.md", "quality-report.md",
              "asset-manifest.json", "preview.mp4", "narration.wav", "production.log", "credits.txt"):
        assert (ex / f).exists(), f
    info = media(ex / "final-video.mp4")
    assert (info["video"]["width"], info["video"]["height"]) == (360, 640)
    assert info["video"]["codec"] == "h264" and info["audio"]["codec"] == "aac"
    # negative: black out 1.5 s in the middle -> QC must report accidental black frames
    bad = ex / "bad.mp4"
    ffmpeg.ffmpeg(["-y", "-v", "error", "-i", str(ex / "final-video.mp4"), "-vf",
                   "drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:enable='between(t,10,11.5)'",
                   "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "copy", str(bad)])
    rep = qc.run(slug, bad, final=True, settings=pipeline.settings_for({"overrides": {}}))
    black = next(c for c in rep["checks"] if c["check"] == "no accidental black frames")
    assert black["status"] == "fail" and rep["verdict"] == "FAIL"
    # resuming a finished project does not re-render
    again = pipeline.produce(slug=slug, provider=synthetic_tts)
    assert again["stopped_at"] is None and again["qc"]["verdict"] == res["qc"]["verdict"]


def test_approval_gates_and_script_change(workspace, synthetic_tts):
    small_export(workspace)
    from rcstudio.production import pipeline, project, script
    r = pipeline.produce(topic="gate test", script_file=str(SAMPLE_SCRIPT), provider=synthetic_tts)
    assert r["stopped_at"] == "script approval"
    proj = project.load(r["slug"])
    project.approve(proj, "script")
    assert project.is_approved(project.load(r["slug"]), "script")
    s = script.load(r["slug"])
    s["beats"][0]["text"] = "A completely different hook sentence here."
    script.save(r["slug"], s)
    r2 = pipeline.produce(slug=r["slug"], provider=synthetic_tts)
    assert r2["stopped_at"] == "script approval"           # edited script needs a new approval


def test_placeholder_reported_when_asset_missing(workspace):
    small_export(workspace)
    from rcstudio.production import assets
    sb = {"scenes": [{"scene": 1, "visual": {"type": "footage", "query": "zebra crossing the moon", "description": "x",
                                              "variant": 0}}]}
    man = assets.fetch("ph", sb)
    e = man["scenes"][0]
    assert e["status"] == "placeholder" and "no relevant" in e["reason"]
    assert man["summary"]["placeholder"] == 1


def test_library_asset_with_licence(workspace):
    import cv2
    small_export(workspace)
    from rcstudio.production import assets
    lib = paths.footage_library()
    cv2.imwrite(str(lib / "radio_telescope_dish.jpg"), np.full((400, 300, 3), 120, np.uint8))
    (lib / "radio_telescope_dish.jpg.json").write_text(json.dumps({"license": "CC0", "attribution": "Me"}))
    sb = {"scenes": [{"scene": 1, "visual": {"type": "image", "query": "radio telescope", "description": "dish", "variant": 0}}]}
    man = assets.fetch("lib", sb)
    e = man["scenes"][0]
    assert e["status"] == "ok" and e["provider"] == "library" and e["license"] == "CC0"
    assert (paths.root() / e["file"]).exists()


def test_licence_filter():
    from rcstudio.production.assets import license_allowed, relevance
    allowed = ["public domain", "cc0", "cc by", "cc by-sa", "pexels license"]
    assert license_allowed("CC BY-SA 4.0", allowed) and license_allowed("Public domain", allowed)
    assert not license_allowed("CC BY-NC 2.0", allowed) and not license_allowed("All rights reserved", allowed)
    # 2 of 3 keywords, 1 of 2 keyword pairs in order -> 2/3 * (0.8 + 0.2 * 1/2)
    assert relevance("radio telescope dish", "Radio telescope at night") == pytest.approx(2 / 3 * 0.9)
    assert relevance("radio telescope", "Radio telescope array") > relevance("radio telescope", "Telescope sees radio galaxy")


def test_face_detector_available():
    from rcstudio import faces
    ok, why = faces.available()
    assert ok, why
    import numpy as np
    assert faces.detect(np.zeros((480, 270, 3), np.uint8)) == []


def test_reject_and_generator_review_flow(workspace):
    import cv2
    small_export(workspace)
    from rcstudio.production import assets
    lib = paths.footage_library()
    for name in ("night_sky_stars_a.jpg", "night_sky_stars_b.jpg"):
        cv2.imwrite(str(lib / name), np.random.default_rng(len(name)).integers(0, 255, (400, 300, 3), dtype=np.uint8))
    sb = {"scenes": [{"scene": 1, "visual": {"type": "image", "query": "night sky stars", "description": "stars", "variant": 0}}]}
    first = assets.fetch("rv", sb)["scenes"][0]
    assert first["status"] == "ok"
    second = next(e for e in assets.reject("rv", 1, "not good enough", sb)["scenes"] if e["scene"] == 1)
    assert second["status"] == "ok" and second["asset_id"] != first["asset_id"]
    third = next(e for e in assets.reject("rv", 1, "still not good", sb)["scenes"] if e["scene"] == 1)
    assert third["status"] == "placeholder"                     # no more candidates -> reported, not substituted
    man = assets.use_generator("rv", 1, "starfield")
    e = man["scenes"][0]
    assert e["status"] == "user" and e["generator"] == "starfield" and e["file"] is None
    assert len(man["rejected"]) == 2


def test_pace_matching_reaches_target_wpm(workspace, synthetic_tts):
    """The learned pace (e.g. 257 wpm) must be reached even if the voice speaks slower by default."""
    from rcstudio.config import load_voice_settings
    from rcstudio.production import project, script, voice
    project.create("t", "pace")
    s = script.normalize(json.loads(SAMPLE_SCRIPT.read_text()))
    st = settings()
    st["voice"].update({"target_wpm": 185, "match_pace": True, "speed": 1.0})
    timing = voice.generate("pace", s, st, load_voice_settings(), provider_name=synthetic_tts)
    assert timing["speed"] > 1.05 and "capped" not in timing["pace_note"]
    assert timing["pace_wpm"] == pytest.approx(185, rel=0.15)
    st["voice"]["match_pace"] = False
    slow = voice.generate("pace", s, st, load_voice_settings(), provider_name=synthetic_tts)
    assert slow["speed"] == 1.0 and slow["duration"] > timing["duration"] * 1.05


def test_qc_caption_band_check_detects_presence_and_absence(workspace):
    import cv2
    from rcstudio.production.generators import create
    from rcstudio.production.qc import _band_has_outlined_text
    from rcstudio.production.subtitles import to_ass
    shutil.copy(paths.fonts_dir() / "Poppins-Black.ttf", workspace / "Poppins-Black.ttf")
    for gen in ("grid", "waves", "starfield", "gradient_flow"):
        bg = create(gen, 540, 960, 3).frame(1.0)
        assert not _band_has_outlined_text(bg, 0.7), gen               # no caption -> must not pass
        cv2.imwrite(str(workspace / "bg.png"), bg)
        words = [{"word": "it", "start": 0, "end": 1}]
        cap = {"font_size": 131, "effective_font_size": 131, "position_y": 0.7, "animation": "none",
               "highlight_mode": "none", "uppercase": False, "outline_width": 8, "shadow": 3}
        (workspace / "c.ass").write_text(to_ass([{"words": words, "start": 0, "end": 2, "emphasis": []}], cap, "Poppins Black"))
        ffmpeg.ffmpeg(["-y", "-v", "error", "-loop", "1", "-i", "bg.png", "-vf", "subtitles=c.ass:fontsdir=.",
                       "-frames:v", "1", "out.png"], cwd=workspace)
        assert _band_has_outlined_text(cv2.imread(str(workspace / "out.png")), 0.7), gen


def test_storyboard_follows_dominant_motion(workspace):
    from rcstudio.production import script, storyboard
    st = settings()
    st["editing"]["motion_mix"] = {"zoom_in": 0.6, "zoom_out": 0.2, "pan_right": 0.2}
    s = script.normalize(json.loads(SAMPLE_SCRIPT.read_text()))
    moves = [x["motion"]["type"] for x in storyboard.build(s, st, "m")["scenes"][1:]]
    assert moves.count("zoom_in") >= len(moves) * 0.35
    assert not any(a == b == c for a, b, c in zip(moves, moves[1:], moves[2:]))   # never 3 identical in a row


def test_generators_respect_project_palette():
    """Composite generators must use the project palette, not the default one."""
    from rcstudio.production.generators import create
    red = ["#050000", "#300000", "#A00000", "#FF2000"]
    for name in ("particles", "text_card", "gradient_flow", "signal", "screen"):
        f = create(name, 270, 480, 2, red, text="2040").frame(1.0).astype(float)
        b, g, r = f[..., 0].mean(), f[..., 1].mean(), f[..., 2].mean()
        assert r >= b and r >= g, (name, r, g, b)


def test_radio_voice_fx_is_band_limited():
    from rcstudio.production.voice import SR, radio_fx
    rng = np.random.default_rng(0)
    x = rng.normal(0, 0.2, SR).astype(np.float32)
    y = radio_fx(x)
    spec = np.abs(np.fft.rfft(y))
    f = np.fft.rfftfreq(len(y), 1 / SR)
    inband = spec[(f > 800) & (f < 2500)].mean()
    assert spec[f < 120].mean() < inband * 0.1 and spec[f > 8000].mean() < inband * 0.1


def test_script_fiction_flag_and_beat_transition(workspace):
    from rcstudio.production import script, storyboard
    s = script.normalize(json.loads(SAMPLE_SCRIPT.read_text()))
    s["sources"] = []
    assert any("no sources" in w for w in script.validate(s, settings(), app())["warnings"])
    s["fiction"] = True
    assert not any("no sources" in w for w in script.validate(s, settings(), app())["warnings"])
    s["beats"][3]["transition"] = "dip_black"
    sb = storyboard.build(s, settings(), "fx")
    first_of_beat = next(x for x in sb["scenes"] if x["beat_id"] == s["beats"][3]["id"])
    assert first_of_beat["transition_in"]["type"] == "dip_black" and first_of_beat["transition_in"]["duration"] > 0


def test_shared_sfx_library(workspace):
    """Files of the shared library (catalog.json) take over their effect types, trimmed to the onset."""
    import json as _json
    from rcstudio import ffmpeg as ff
    from rcstudio.production import audio_gen
    lib = workspace / "sharedlib"; lib.mkdir()
    sr = 48000; t = np.arange(int(1.2 * sr)) / sr
    x = np.where(t > 0.4, np.sin(2 * np.pi * 500 * t) * np.exp(-((t - 0.8) / 0.15) ** 2), 0.0)
    ff.write_wav(lib / "w.wav", x * 0.5, sr)
    (lib / "catalog.json").write_text(_json.dumps({"sounds": [{"id": "w", "file": "w.wav", "studio_kinds": ["whoosh"],
                                                                "onset": 0.45, "peak": 0.8, "end": 1.15}]}))
    p = workspace / "config" / "settings.json"; d = _json.loads(p.read_text())
    d["assets"]["shared_sfx_library"] = str(lib); p.write_text(_json.dumps(d))
    f, meta = audio_gen.sfx_file("whoosh")
    assert meta["source"] == "shared library" and abs(meta["lead"] - 0.355) < 0.01
    y = ff.decode_audio(f, sr=sr, mono=True)
    assert abs(len(y) / sr - (1.2 - 0.445)) < 0.02          # leading silence trimmed
    assert audio_gen.sfx_file("powerdown")[1]["source"] == "generated"
