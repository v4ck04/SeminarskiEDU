"""Style profile learning and feedback."""
from __future__ import annotations

import copy
import json

import pytest

from rcstudio import paths
from rcstudio.utils import read_json, write_json


def fake_report(vid: str, shot: float = 1.6, cap_y: float = 0.62, wpm: float = 180, conf: float = 0.8,
                caps: bool = True) -> dict:
    metrics = {"duration": 40.0, "shot_len_median": shot, "cuts_per_min": 60 / shot, "caption_y": cap_y,
               "wpm": wpm, "caption_caps_share": 0.9 if caps else 0.1, "motion_share_zoom_in": 0.5,
               "motion_share_static": 0.5, "transition_share_cut": 0.9, "transition_share_dissolve": 0.1,
               "lufs": -14.0, "saturation": 0.4, "contrast": 0.2}
    return {"video": {"id": vid}, "metrics": metrics, "metrics_confidence": {k: conf for k in metrics},
            "categorical": {"caption_fill_color": "white", "caption_fill_hex": "#FFFFFF", "layout": "full_bleed",
                            "hook_features": ["question"], "ending_types": ["reveal/twist"]},
            "observations": []}


def write_reports(reports):
    for r in reports:
        write_json(paths.analysis_dir() / f"{r['video']['id']}.json", r)


def test_single_video_is_never_a_rule(workspace):
    from rcstudio.style import profile
    write_reports([fake_report("a")])
    prof = profile.rebuild(quiet=True)
    assert prof["n_videos"] == 1
    assert all(f["status"] == "uncertain" for f in prof["features"].values())
    assert all(p["status"] == "uncertain" for p in prof["production"].values())
    md = paths.style_profile_md().read_text()
    for section in ("Hook patterns", "Storytelling structure", "Narration pacing", "Scene duration patterns",
                    "Subtitle design", "Transitions", "Camera movement", "Visual composition", "Sound design",
                    "Music characteristics", "Ending patterns", "Overall editing identity"):
        assert f"## {section}" in md


def test_consistent_videos_become_frequent_and_drive_settings(workspace):
    from rcstudio.config import resolve_production_settings
    from rcstudio.style import profile
    write_reports([fake_report(v, shot=s) for v, s in (("a", 1.5), ("b", 1.6), ("c", 1.7))])
    prof = profile.rebuild(quiet=True)
    f = prof["features"]
    assert f["shot_len_median"]["status"] == "frequent"
    assert f["caption_fill_color"]["status"] == "frequent"
    assert f["hook_features:question"]["status"] == "frequent"
    assert prof["production"]["editing.target_shot_seconds"]["value"] == pytest.approx(1.6)
    settings, prov = resolve_production_settings()
    assert settings["editing"]["target_shot_seconds"] == pytest.approx(1.6)
    assert prov["editing.target_shot_seconds"].startswith("learned")
    assert settings["captions"]["uppercase"] is True


def test_inconsistent_values_are_occasional_and_not_applied(workspace):
    from rcstudio.config import resolve_production_settings
    from rcstudio.style import profile
    write_reports([fake_report(v, shot=s) for v, s in (("a", 0.8), ("b", 2.5), ("c", 5.0))])
    prof = profile.rebuild(quiet=True)
    assert prof["features"]["shot_len_median"]["status"] == "occasional"
    assert any("median shot length" in d for d in prof["differences"])
    settings, prov = resolve_production_settings()
    assert "editing.target_shot_seconds" not in prov


def test_profile_versions_and_history(workspace):
    from rcstudio.style import profile
    write_reports([fake_report("a")])
    p1 = profile.rebuild(quiet=True)
    p1b = profile.rebuild(quiet=True)
    assert p1b["version"] == p1["version"]          # unchanged content -> same version
    write_reports([fake_report("b"), fake_report("c")])
    p2 = profile.rebuild(quiet=True)
    assert p2["version"] == p1["version"] + 1
    assert (paths.profile_history_dir() / f"style-profile-v{p2['version']:03d}.json").exists()
    hist = read_json(paths.training_history())
    assert len(hist["events"]) == 3 and hist["events"][-1]["profile_changed"]


def test_comparison_with_previous_references(workspace):
    from rcstudio.style import profile
    write_reports([fake_report("a"), fake_report("b")])
    new = fake_report("c", shot=4.5, cap_y=0.3)
    cmp = profile.compare_to_previous(new)
    assert cmp["n_previous"] == 2
    assert any("median shot length" in d for d in cmp["different"])
    assert "narration pace" in cmp["consistent"]


@pytest.mark.parametrize("text,param,direction", [
    ("The subtitles are too small.", "captions.font_scale", 1),
    ("Make the cuts faster.", "editing.target_shot_seconds", -1),
    ("Use fewer transitions.", "transitions.fancy_scale", -1),
    ("Make the opening more engaging.", "story.hook_intensity", 1),
    ("The music is too loud, I can't hear the voice", "audio.music_db_below_voice", 1),
    ("The narration should sound more natural.", "voice.naturalness", "flag"),
])
def test_feedback_parsing(text, param, direction):
    from rcstudio.style.feedback import parse_comment
    ds = parse_comment(text)
    assert any(d["param"] == param and d["direction"] == direction for d in ds), ds


def test_feedback_needs_repetition_before_global_change(workspace):
    from rcstudio.config import resolve_production_settings
    from rcstudio.style import feedback
    base, _ = resolve_production_settings()
    feedback.record("vid1", {"subtitles": 2}, "The subtitles are too small.")
    res = feedback.improve()
    assert not res["applied"] and any("font_scale" in p for p in res["pending"])
    s, _ = resolve_production_settings()
    assert s["captions"]["font_scale"] == base["captions"]["font_scale"]
    feedback.record("vid2", {"subtitles": 2}, "subtitles still too small")
    res = feedback.improve()
    assert res["applied"]
    s, prov = resolve_production_settings()
    assert s["captions"]["font_scale"] > base["captions"]["font_scale"]
    assert prov["captions.font_scale"].startswith("feedback")
    assert s["captions"]["effective_font_size"] > base["captions"]["effective_font_size"]


def test_explicit_global_feedback_applies_immediately(workspace):
    from rcstudio.config import resolve_production_settings
    from rcstudio.style import feedback
    feedback.record("vid1", {}, "Make the cuts faster.", apply_globally=True)
    feedback.improve()
    s, _ = resolve_production_settings()
    assert s["editing"]["target_shot_seconds"] < 2.2


def test_caption_derivations_follow_measurements(workspace):
    from rcstudio.style import profile
    reps = []
    for v in ("a", "b", "c"):
        r = fake_report(v, caps=False)
        r["metrics"].update({"caption_words": 1.0, "caption_words_p80": 2.0, "caption_highlight_share": 0.15,
                             "caption_text_h": 0.022})
        r["metrics_confidence"].update({k: 0.8 for k in ("caption_words", "caption_words_p80", "caption_highlight_share",
                                                          "caption_text_h")})
        r["categorical"].update({"ending_cta": False, "footage_type": "original 3D cartoon animation"})
        reps.append(r)
    write_reports(reps)
    prod = profile.rebuild(quiet=True)["production"]
    assert prod["captions.max_words"]["value"] == 2                  # upper bound from the 80th percentile
    assert prod["captions.highlight_mode"]["value"] == "emphasis"    # sparse coloured words
    assert prod["captions.uppercase"]["value"] is False
    lower = prod["captions.font_size"]["value"]
    assert 100 <= lower <= 160 and prod["captions.font_size"]["status"] == "frequent"
    feats = profile.load_reports()
    from rcstudio.production.script import style_brief
    from rcstudio.config import resolve_production_settings
    brief = style_brief(resolve_production_settings()[0])
    assert "cartoon animation" in brief and "call to action" in brief
