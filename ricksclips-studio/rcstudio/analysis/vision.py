"""Optional visual AI review of contact sheets through the Claude API.

Inside Claude Code the skill asks Claude to look at the contact sheets
directly (no API key needed) and record notes with `studio.py notes`. This
module is the stand-alone equivalent for CLI runs with ANTHROPIC_API_KEY set
and `analysis.vision.provider` = "anthropic".
"""
from __future__ import annotations

import base64
import importlib.util
import json
from pathlib import Path

from .. import log
from ..utils import env_key

_log = log.get("analysis.vision")

PROMPT = """You are reviewing contact sheets extracted from a vertical short-form video
(frames sampled per shot, one per second, and crops of burned-in captions).
Describe only what is visible. For each observation give a confidence and the
evidence (which sheet / timestamp). Cover: subtitle typography (weight, case,
colours, outline, shadow, highlight style, approximate font category - do NOT
claim an exact font name unless the glyph shapes clearly identify it), on-screen
overlays (stickers, arrows, progress bars, emojis, watermarks), framing and
composition, footage type (stock, screen recordings, AI images, photos, talking
head), colour grading look, and any visible transition or motion styles.
Do not guess editing software, audio, or anything not visible in the images."""

SCHEMA = {
    "type": "object",
    "properties": {
        "observations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ["subtitles", "overlays", "composition", "footage",
                                                            "color", "transitions", "motion", "other"]},
                    "description": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
                    "evidence": {"type": "string"},
                },
                "required": ["category", "description", "confidence", "evidence"],
                "additionalProperties": False,
            },
        },
        "font_category_guess": {"type": "string"},
    },
    "required": ["observations", "font_category_guess"],
    "additionalProperties": False,
}


def available() -> bool:
    return bool(env_key("ANTHROPIC_API_KEY")) and importlib.util.find_spec("anthropic") is not None


def review_sheets(sheets: list[Path], model: str = "claude-opus-5-5") -> dict | None:
    if not available() or not sheets:
        return None
    import anthropic

    content: list[dict] = []
    for p in sheets:
        data = base64.standard_b64encode(Path(p).read_bytes()).decode("ascii")
        content.append({"type": "text", "text": f"Sheet: {Path(p).name}"})
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": data}})
    content.append({"type": "text", "text": PROMPT})
    client = anthropic.Anthropic()
    try:
        resp = client.beta.messages.create(
            model=model,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "medium", "format": {"type": "json_schema", "schema": SCHEMA}},
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.AuthenticationError:
        _log.warning("visual review skipped: ANTHROPIC_API_KEY was rejected")
        return None
    except anthropic.RateLimitError:
        _log.warning("visual review skipped: rate limited")
        return None
    except anthropic.APIStatusError as e:
        _log.warning("visual review failed: HTTP %s %s", e.status_code, e.message)
        return None
    except anthropic.APIConnectionError:
        _log.warning("visual review skipped: no connection to the Claude API")
        return None
    if resp.stop_reason == "refusal":
        _log.warning("visual review declined by the model")
        return None
    text = next((b.text for b in resp.content if b.type == "text"), "")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        _log.warning("visual review returned invalid JSON")
        return None
    data["model"] = resp.model
    return data
