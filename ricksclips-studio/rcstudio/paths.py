"""Project paths.

All paths are resolved lazily so tests (or a second workspace) can point the
studio at another directory with the RCSTUDIO_ROOT environment variable.
Static resources (default config, bundled fonts) fall back to the repository
copy when the workspace does not have its own.
"""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def root() -> Path:
    env = os.environ.get("RCSTUDIO_ROOT")
    return Path(env).resolve() if env else REPO_ROOT


def _d(*parts: str, create: bool = True) -> Path:
    p = root().joinpath(*parts)
    if create:
        p.mkdir(parents=True, exist_ok=True)
    return p


# --- configuration -----------------------------------------------------------
def config_file(name: str) -> Path:
    """Workspace config file, falling back to the repository default."""
    p = root() / "config" / name
    if p.exists():
        return p
    return REPO_ROOT / "config" / name


def config_dir() -> Path:
    return _d("config")


# --- training ------------------------------------------------------------------
def training_dir() -> Path:
    return _d("training")


def training_input() -> Path:
    return _d("training", "input")


def analysis_dir() -> Path:
    return _d("training", "analysis")


def frames_dir() -> Path:
    return _d("training", "extracted_frames")


def feedback_dir() -> Path:
    return _d("training", "feedback")


def profile_history_dir() -> Path:
    return _d("training", "profile-history")


def style_profile_md() -> Path:
    return training_dir() / "style-profile.md"


def style_profile_json() -> Path:
    return training_dir() / "style-profile.json"


def training_history() -> Path:
    return training_dir() / "training-history.json"


def preferences_file() -> Path:
    return training_dir() / "preferences.json"


# --- production ----------------------------------------------------------------
def production_dir() -> Path:
    return _d("production")


def project_dirs(slug: str) -> dict[str, Path]:
    """Per-project folders inside the shared production tree."""
    return {
        "script": _d("production", "scripts", slug),
        "storyboard": _d("production", "storyboards", slug),
        "voice": _d("production", "voice", slug),
        "footage": _d("production", "footage", slug),
        "subtitles": _d("production", "subtitles", slug),
        "audio": _d("production", "voice", slug, "mix"),
        "preview": _d("production", "previews", slug),
        "export": _d("production", "exports", slug),
    }


def scripts_root() -> Path:
    return _d("production", "scripts")


def footage_library() -> Path:
    return _d("production", "footage", "library")


def music_library() -> Path:
    return _d("production", "music")


def sfx_library() -> Path:
    return _d("production", "sound-effects")


def generated_sfx_dir() -> Path:
    return _d("production", "sound-effects", "generated")


# --- assets & logs ---------------------------------------------------------------
def fonts_dir() -> Path:
    p = root() / "assets" / "fonts"
    if p.exists() and any(p.glob("*.ttf")):
        return p
    return REPO_ROOT / "assets" / "fonts"


def overlays_dir() -> Path:
    return _d("assets", "overlays")


def logs_dir() -> Path:
    return _d("logs")
