"""Configuration loading and the production-settings resolver.

Resolution order for every editing parameter (later wins):

1. ``config/editing-settings.json``   - defaults
2. ``training/style-profile.json``     - learned from reference videos, applied
   only when the evidence is strong enough ("frequent" status, or
   "occasional" when ``style_learning.apply_occasional_params`` is true)
3. ``training/preferences.json``       - repeated user feedback
4. project ``overrides``               - per-video tweaks
5. explicit call overrides             - CLI flags

Every resolved value carries its provenance so ``status --settings`` can show
where it came from.
"""
from __future__ import annotations

import copy
from typing import Any

from . import paths
from .utils import read_json

# bounds keep learned / feedback-driven values sane
PARAM_BOUNDS: dict[str, tuple[float, float]] = {
    "editing.target_shot_seconds": (0.5, 8.0),
    "editing.motion_intensity": (0.0, 0.35),
    "editing.punch_in_amount": (0.0, 0.4),
    "editing.shake_amount": (0.0, 0.03),
    "captions.font_size": (48, 160),
    "captions.font_scale": (0.6, 1.8),
    "captions.position_y": (0.25, 0.78),
    "captions.max_words": (1, 8),
    "captions.outline_width": (0, 16),
    "captions.shadow": (0, 12),
    "color.saturation": (0.6, 1.6),
    "color.contrast": (0.7, 1.5),
    "color.brightness": (-0.15, 0.15),
    "color.vignette": (0.0, 0.8),
    "color.warmth": (-0.3, 0.3),
    "audio.target_lufs": (-18.0, -9.0),
    "audio.music_db_below_voice": (6.0, 32.0),
    "audio.ducking_db": (0.0, 18.0),
    "audio.sfx_on_cuts_prob": (0.0, 1.0),
    "audio.sfx_gain_db": (-24.0, 0.0),
    "voice.target_wpm": (110, 280),
    "voice.speed": (0.7, 1.6),
    "story.hook_max_seconds": (1.0, 8.0),
    "story.target_duration_s": (10, 180),
    "story.hook_intensity": (0.5, 2.0),
    "transitions.fancy_scale": (0.0, 3.0),
    "audio.music_gain_scale": (0.0, 2.0),
}


def load_settings() -> dict:
    return read_json(paths.config_file("settings.json"), {}) or {}


def load_voice_settings() -> dict:
    return read_json(paths.config_file("voice-settings.json"), {}) or {}


def load_editing_defaults() -> dict:
    d = read_json(paths.config_file("editing-settings.json"), {}) or {}
    d.pop("_comment", None)
    return d


def deep_merge(base: dict, over: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def get_path(d: dict, dotted: str, default: Any = None) -> Any:
    cur: Any = d
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def set_path(d: dict, dotted: str, value: Any) -> None:
    parts = dotted.split(".")
    cur = d
    for part in parts[:-1]:
        cur = cur.setdefault(part, {})
    cur[parts[-1]] = value


def clamp_param(key: str, value: Any) -> Any:
    if key in PARAM_BOUNDS and isinstance(value, (int, float)) and not isinstance(value, bool):
        lo, hi = PARAM_BOUNDS[key]
        v = min(hi, max(lo, value))
        return int(round(v)) if isinstance(value, int) and key.endswith(("max_words", "font_size")) else v
    return value


def apply_preference(current: Any, pref: dict) -> Any:
    op = pref.get("op", "set")
    val = pref.get("value")
    if op == "set" or not isinstance(current, (int, float)) or isinstance(current, bool):
        return val
    if op == "mul":
        return current * float(val)
    if op == "add":
        return current + float(val)
    return val


def resolve_production_settings(project: dict | None = None,
                                overrides: dict | None = None) -> tuple[dict, dict]:
    """Return (settings, provenance) where provenance maps dotted keys to source."""
    settings = load_editing_defaults()
    provenance: dict[str, str] = {}

    # 2. learned style profile
    profile = read_json(paths.style_profile_json(), None)
    sl_cfg = load_settings().get("style_learning", {})
    allow_occ = bool(sl_cfg.get("apply_occasional_params", False))
    if profile:
        for key, item in (profile.get("production") or {}).items():
            status = item.get("status")
            if status == "frequent" or (allow_occ and status == "occasional"):
                set_path(settings, key, clamp_param(key, item.get("value")))
                provenance[key] = f"learned ({status}, {item.get('n_videos', '?')} videos)"

    # 3. feedback preferences
    prefs = read_json(paths.preferences_file(), None) or {}
    for key, pref in (prefs.get("params") or {}).items():
        cur = get_path(settings, key)
        set_path(settings, key, clamp_param(key, apply_preference(cur, pref)))
        provenance[key] = f"feedback ({pref.get('op', 'set')} {pref.get('value')}, {pref.get('evidence', 0)} reports)"

    # 4./5. project + call overrides
    for src_name, src in (("project", (project or {}).get("overrides") or {}), ("override", overrides or {})):
        for key, value in _flatten(src).items():
            set_path(settings, key, clamp_param(key, value))
            provenance[key] = src_name

    # derived convenience values
    cap = settings.setdefault("captions", {})
    cap["effective_font_size"] = int(round(cap.get("font_size", 92) * cap.get("font_scale", 1.0)))
    return settings, provenance


def _flatten(d: dict, prefix: str = "") -> dict:
    out = {}
    for k, v in (d or {}).items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict) and not key.endswith(("motion_mix", "mix", "durations", "safe_area")):
            out.update(_flatten(v, key))
        else:
            out[key] = v
    return out


def flatten(d: dict) -> dict:
    return _flatten(d)
