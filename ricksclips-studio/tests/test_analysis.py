"""Reference analysis: metadata, frames, scene detection, motion, captions, audio, story."""
from __future__ import annotations

import cv2
import numpy as np
import pytest

from rcstudio import ffmpeg
from rcstudio.config import load_settings


def test_metadata_extraction(workspace):
    out = workspace / "t.mp4"
    ffmpeg.ffmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=360x640:r=25:d=2", "-f", "lavfi",
                   "-i", "sine=f=440:d=2:sample_rate=44100", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                   "-c:a", "aac", "-shortest", str(out)])
    info = ffmpeg.media_info(out)
    assert info["video"]["display_width"] == 360 and info["video"]["display_height"] == 640
    assert info["video"]["fps"] == pytest.approx(25, abs=0.01)
    assert info["duration"] == pytest.approx(2.0, abs=0.1)
    assert info["audio"]["sample_rate"] == 44100 and info["audio"]["codec"] == "aac"


def test_frame_extraction_and_contact_sheet(workspace, reference_video):
    from rcstudio.analysis.frames import contact_sheet, extract_frame
    path, _ = reference_video
    items = []
    for t in (0.5, 3.0, 6.0):
        p = extract_frame(path, t, workspace / f"f{t}.jpg", width=270)
        assert p and p.exists()
        img = cv2.imread(str(p))
        assert img.shape[1] == 270
        items.append((p, f"{t}s"))
    sheet = contact_sheet(items, workspace / "sheet.jpg", cols=3)
    assert sheet and cv2.imread(str(sheet)).shape[1] > 500


@pytest.fixture(scope="module")
def scanned(reference_video):
    from rcstudio.analysis import motion, scan, scenes
    path, gt = reference_video
    info = ffmpeg.media_info(path)
    sc = scan.scan(str(path), info, load_settings()["analysis"])
    det = scenes.detect(sc)
    mots = motion.classify_shots(sc, det["shots"], det["transitions"])
    return path, gt, info, sc, det, mots


def test_scene_detection_matches_ground_truth(scanned):
    _, gt, _, sc, det, _ = scanned
    found = [t for t in det["transitions"] if t["type"] in ("cut", "dissolve", "dip_black", "flash")]
    assert len(found) == len(gt["boundaries"])
    for (t_true, kind), tr in zip(gt["boundaries"], found):
        tol = 0.16 if kind == "dissolve" else 2.5 / sc.fps
        assert abs(tr["time"] - t_true) <= tol, (kind, tr)
        assert tr["type"] == kind
    assert len(det["shots"]) == len(gt["boundaries"]) + 1


def test_camera_motion_classification(scanned):
    _, gt, _, _, _, mots = scanned
    got = [m["type"] for m in mots]
    correct = sum(1 for a, b in zip(got, gt["motions"]) if a == b)
    assert correct >= len(gt["motions"]) - 1, (got, gt["motions"])
    assert all(m.get("animated_still") for m in mots if m["type"] not in ("static", "unknown"))


def test_caption_detector_on_rendered_frame(workspace):
    from rcstudio.analysis.captions import detect_frame
    from rcstudio.production.subtitles import to_ass
    import shutil
    from rcstudio import paths
    shutil.copy(paths.fonts_dir() / "Poppins-Black.ttf", workspace / "Poppins-Black.ttf")
    words = [{"word": w, "start": 0, "end": 1} for w in ["THE", "MOST", "MYSTERIOUS"]]
    cap = {"font_size": 118, "effective_font_size": 118, "position_y": 0.62, "animation": "none",
           "highlight_mode": "emphasis", "uppercase": True, "outline_width": 8, "shadow": 3, "max_chars_per_line": 30}
    (workspace / "c.ass").write_text(to_ass([{"words": words, "start": 0, "end": 2, "emphasis": [2]}], cap, "Poppins Black"))
    ffmpeg.ffmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=1080x1920:d=1", "-vf",
                   "subtitles=c.ass:fontsdir=.", "-frames:v", "1", "f.png"], cwd=workspace)
    img = cv2.resize(cv2.imread(str(workspace / "f.png")), (540, 960), interpolation=cv2.INTER_AREA)
    dets = detect_frame(img)
    assert dets, "caption not detected"
    d = max(dets, key=lambda x: x["w"])
    assert d["cy"] == pytest.approx(0.62, abs=0.02)
    assert d["fill_color"] == "white"
    assert d["highlight"] and d["highlight"]["color"] == "yellow"
    assert d["outline_px"] >= 2
    assert d["words"] == 3
    assert d["caps_spread"] is not None and d["caps_spread"] < 0.08


def test_caption_analysis_over_time(reference_video):
    from rcstudio.analysis import captions
    path, gt = reference_video
    caps = captions.analyze(str(path), ffmpeg.media_info(path), load_settings()["analysis"])
    assert caps["present"]
    assert caps["position_y"] == pytest.approx(gt["captions"]["y"], abs=0.03)
    assert caps["count"] == pytest.approx(gt["captions"]["count"], abs=2)
    assert caps["duration_median"] == pytest.approx(0.6, abs=0.15)
    assert caps["words_per_caption_visual"] == pytest.approx(gt["captions"]["words_per"], abs=0.6)
    assert caps["fill_color"] == "white" and caps["highlight_color"] == "yellow"
    assert caps["outline_share"] > 0.8 and caps["caps_likely_share"] > 0.6
    assert "word_reveal" not in caps["animation_distribution"]


def test_audio_analysis(reference_video):
    from rcstudio.analysis import audio
    path, gt = reference_video
    cuts = [b for b, _ in gt["boundaries"]]
    a = audio.analyze(str(path), ffmpeg.media_info(path), cuts, None)
    sp = a["speech"]
    assert len(sp["segments"]) == pytest.approx(len(gt["speech_spans"]), abs=1)
    for (s0, s1), (t0, t1) in zip(sp["segments"], gt["speech_spans"]):
        assert abs(s0 - t0) < 0.15 and abs(s1 - t1) < 0.15
    assert a["background"]["music_likely"]
    assert 4 <= a["background"]["below_speech_db"] <= 25
    assert a["sfx"]["cuts_with_sfx_share"] >= 0.7
    assert a["clipped_samples"] == 0
    assert -40 < a["loudness"]["integrated_lufs"] < -5


def test_story_analysis_from_transcript():
    from rcstudio.analysis import story
    words, t = [], 0.2
    text = "Why does nobody talk about this? It lasted seventy two seconds. And it never came back."
    for w in text.split():
        words.append({"word": w, "start": t, "end": t + 0.25})
        t += 0.3
    r = story.analyze({"text": text, "words": words}, t + 0.5, [1.5, 3.0])
    assert r["available"] and r["sentence_count"] == 3
    assert "question" in r["hook"]["features"] and "curiosity gap" in r["hook"]["features"]
    assert r["cut_alignment"]["word_boundary_share"] is not None


def test_full_analyze_command_writes_report(workspace, reference_video):
    import shutil
    from rcstudio import paths
    from rcstudio.analysis import pipeline
    src, _ = reference_video
    dst = paths.training_input() / "ref.mp4"
    shutil.copy(src, dst)
    reps = pipeline.analyze_all(transcribe_mode="none")
    assert len(reps) == 1
    r = reps[0]
    vid = r["video"]["id"]
    assert (paths.analysis_dir() / f"{vid}.md").exists()
    assert (paths.frames_dir() / vid / "contact_shots.jpg").exists()
    for ob in r["observations"]:
        assert ob["confidence"] in ("low", "medium", "high") and ob["evidence"] and ob["description"]
    assert paths.style_profile_md().exists() and paths.training_history().exists()
