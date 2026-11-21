"""Shared test fixtures.

Every test runs in its own workspace (RCSTUDIO_ROOT) so the real training/
and production/ folders are never touched. A synthetic TTS provider makes
voice tests work on any machine without network or system voices.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

import numpy as np
import pytest

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(Path(__file__).resolve().parent))


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    monkeypatch.setenv("RCSTUDIO_ROOT", str(tmp_path))
    (tmp_path / "config").mkdir()
    for f in ("settings.json", "voice-settings.json", "editing-settings.json"):
        shutil.copy(REPO / "config" / f, tmp_path / "config" / f)
    from rcstudio import log
    log.setup(console=False)
    return tmp_path


def small_export(ws: Path, w: int = 360, h: int = 640, pw: int = 270, ph: int = 480):
    """Shrink render sizes in the workspace config to keep end-to-end tests fast."""
    p = ws / "config" / "settings.json"
    d = json.loads(p.read_text())
    d["export"].update({"width": w, "height": h, "preset": "ultrafast", "crf": 26})
    d["export"]["preview"].update({"width": pw, "height": ph, "preset": "ultrafast"})
    d["assets"]["providers"] = ["library", "generated"]       # no network in tests
    p.write_text(json.dumps(d, indent=2))


class SyntheticTTS:
    """Speech-like harmonic syllables, one per word, with exact word timings."""
    name, quality, word_timings = "synthetic", "test signal", True

    def __init__(self, cfg=None):
        self.cfg = cfg or {}

    def status(self):
        return True, "test provider"

    def describe(self):
        return "synthetic:test"

    def synthesize(self, text, out, speed=1.0):
        from rcstudio import ffmpeg
        from rcstudio.production.tts import SR, SynthResult
        words = text.split()
        x, t, timings = [], 0.05, []
        x.append(np.zeros(int(0.05 * SR)))
        for w in words:
            d = (0.12 + 0.045 * len(w)) / speed
            n = int(d * SR)
            tt = np.arange(n) / SR
            sig = sum(np.sin(2 * np.pi * 130 * k * tt) / k for k in range(1, 9))
            env = np.sin(np.pi * tt / d) ** 0.8
            x.append(0.25 * sig * env)
            timings.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
            gap = 0.06 + (0.15 if w.endswith((",", ".", "?", "!", ":")) else 0)
            x.append(np.zeros(int(gap * SR)))
            t += d + gap
        x.append(np.zeros(int(0.05 * SR)))
        ffmpeg.write_wav(out, np.concatenate(x), SR)
        return SynthResult(Path(out), len(np.concatenate(x)) / SR, timings, True, False)


@pytest.fixture
def synthetic_tts(monkeypatch):
    from rcstudio.production import tts
    monkeypatch.setitem(tts.PROVIDERS, "synthetic", SyntheticTTS)
    return "synthetic"


@pytest.fixture(scope="session")
def reference_video(tmp_path_factory):
    """The synthetic reference Short (rendered once per test session)."""
    from fixtures import make_reference_video
    d = tmp_path_factory.mktemp("ref")
    os.environ.setdefault("RCSTUDIO_ROOT", str(d))
    out = d / "synthetic_ref.mp4"
    gt = make_reference_video(out)
    return out, gt


SAMPLE_SCRIPT = REPO / "samples" / "space-mysteries" / "script.json"


def media(path):
    from rcstudio import ffmpeg
    return ffmpeg.media_info(path)
