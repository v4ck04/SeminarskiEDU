"""Scripts: schema, validation, Markdown and generation.

Who writes the script:
  * inside Claude Code, Claude writes `script.json` itself (the skill gives it
    the schema, the learned hook/ending patterns and the word budget), then
    runs `studio.py script <slug> --validate`;
  * on the command line with ANTHROPIC_API_KEY set, `generate()` asks the
    Claude API (structured JSON output, optional web research);
  * otherwise a template is written for the user to fill in.
No template-based "automatic" text is ever passed off as a finished script.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import re
from pathlib import Path

from .. import log, paths
from ..utils import StudioError, env_key, now_iso, read_json, say, split_sentences, text_hash, write_json, write_text
from . import project as projmod

_log = log.get("script")

GENERATORS = ["starfield", "planet", "gradient_flow", "particles", "grid", "waves", "text_card"]
SFX_CHOICES = ["auto", "none", "whoosh", "impact", "riser", "pop", "ding"]
MOODS = ["mysterious", "epic", "upbeat", "tense", "calm", "inspiring"]
FILLER = ["in this video", "let's dive in", "without further ado", "make sure to subscribe", "basically",
          "so yeah", "hey guys", "today we're going to", "stay tuned", "smash that like", "let's get started",
          "you won't believe", "as you can see"]
NUMBER_WORDS = re.compile(r"\b\d[\d,.]*\b|\b(hundred|thousand|million|billion|trillion|percent)\b", re.I)
CLAIM_WORDS = re.compile(r"\b(largest|biggest|smallest|first|oldest|fastest|only|most|never|discovered|scientists|according)\b", re.I)

VISUAL_SCHEMA = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": ["footage", "image", "generated"]},
        "query": {"type": "string", "description": "2-5 stock-search keywords"},
        "description": {"type": "string"},
        "generator": {"type": "string", "enum": GENERATORS + [""]},
        "on_screen_text": {"type": "string"},
    },
    "required": ["type", "query", "description", "generator", "on_screen_text"],
    "additionalProperties": False,
}
BEAT_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "role": {"type": "string", "enum": ["hook", "body", "ending"]},
        "text": {"type": "string"},
        "visual": VISUAL_SCHEMA,
        "extra_shots": {"type": "array", "items": VISUAL_SCHEMA},
        "emphasis": {"type": "array", "items": {"type": "string"}},
        "sfx": {"type": "string", "enum": SFX_CHOICES},
    },
    "required": ["id", "role", "text", "visual", "extra_shots", "emphasis", "sfx"],
    "additionalProperties": False,
}
SCRIPT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "topic": {"type": "string"},
        "angle": {"type": "string"},
        "target_duration_s": {"type": "integer"},
        "music_mood": {"type": "string", "enum": MOODS},
        "beats": {"type": "array", "items": BEAT_SCHEMA},
        "sources": {"type": "array", "items": {
            "type": "object",
            "properties": {"claim": {"type": "string"}, "source": {"type": "string"}},
            "required": ["claim", "source"], "additionalProperties": False}},
        "pronunciations": {"type": "array", "items": {
            "type": "object",
            "properties": {"word": {"type": "string"}, "say_as": {"type": "string"}},
            "required": ["word", "say_as"], "additionalProperties": False}},
        "notes": {"type": "string"},
    },
    "required": ["title", "topic", "angle", "target_duration_s", "music_mood", "beats", "sources",
                 "pronunciations", "notes"],
    "additionalProperties": False,
}
VARIANTS_SCHEMA = {"type": "object", "properties": {"variants": {"type": "array", "items": SCRIPT_SCHEMA}},
                   "required": ["variants"], "additionalProperties": False}


def script_path(slug: str) -> Path:
    return paths.scripts_root() / slug / "script.json"


def load(slug: str) -> dict:
    p = script_path(slug)
    if not p.exists():
        raise StudioError(f"No script yet for '{slug}'. Write production/scripts/{slug}/script.json "
                          f"(see script.template.json) or run `studio.py script {slug} --generate`.")
    return normalize(read_json(p))


def normalize(s: dict) -> dict:
    """Fill optional fields so hand-written scripts work with the pipeline."""
    s = copy.deepcopy(s)
    s.setdefault("angle", "")
    s.setdefault("music_mood", "mysterious")
    s.setdefault("sources", [])
    s.setdefault("notes", "")
    pr = s.get("pronunciations") or []
    if isinstance(pr, dict):
        pr = [{"word": k, "say_as": v} for k, v in pr.items()]
    s["pronunciations"] = pr
    for i, b in enumerate(s.get("beats", [])):
        b.setdefault("id", i + 1)
        b.setdefault("role", "hook" if i == 0 else "ending" if i == len(s["beats"]) - 1 else "body")
        b.setdefault("emphasis", [])
        b.setdefault("sfx", "auto")
        b.setdefault("extra_shots", [])
        v = b.setdefault("visual", {})
        v.setdefault("type", "generated")
        v.setdefault("query", "")
        v.setdefault("description", v.get("query", ""))
        v.setdefault("generator", "")
        v.setdefault("on_screen_text", "")
        for x in b["extra_shots"]:
            for k, d in (("type", "generated"), ("query", ""), ("description", ""), ("generator", ""), ("on_screen_text", "")):
                x.setdefault(k, d)
    return s


def save(slug: str, script: dict, note: str = "") -> Path:
    d = paths.scripts_root() / slug
    d.mkdir(parents=True, exist_ok=True)
    versions = sorted(d.glob("script.v*.json"))
    n = len(versions) + 1
    script = normalize(script)
    write_json(d / f"script.v{n}.json", {**script, "_saved_at": now_iso(), "_note": note})
    write_json(d / "script.json", script)
    return d / "script.json"


def template(topic: str, target: int) -> dict:
    return {
        "title": "", "topic": topic, "angle": "", "target_duration_s": target, "music_mood": "mysterious",
        "beats": [
            {"id": 1, "role": "hook", "text": "", "emphasis": [], "sfx": "impact", "extra_shots": [],
             "visual": {"type": "footage", "query": "", "description": "", "generator": "", "on_screen_text": ""}},
            {"id": 2, "role": "body", "text": "", "emphasis": [], "sfx": "auto", "extra_shots": [],
             "visual": {"type": "footage", "query": "", "description": "", "generator": "", "on_screen_text": ""}},
            {"id": 3, "role": "ending", "text": "", "emphasis": [], "sfx": "auto", "extra_shots": [],
             "visual": {"type": "generated", "query": "", "description": "", "generator": "starfield", "on_screen_text": ""}},
        ],
        "sources": [{"claim": "", "source": ""}],
        "pronunciations": [],
        "notes": "Fill in every beat. visual.type: footage | image | generated. generated needs a generator: "
                 + ", ".join(GENERATORS),
    }


# ------------------------------------------------------------------------------------------- validation
def _reference_ngrams(n: int = 6) -> dict[tuple, str]:
    grams: dict[tuple, str] = {}
    for p in paths.analysis_dir().glob("*.transcript.json"):
        tr = read_json(p) or {}
        toks = re.findall(r"[a-z0-9']+", (tr.get("text") or "").lower())
        for i in range(len(toks) - n + 1):
            grams[tuple(toks[i:i + n])] = p.name.replace(".transcript.json", "")
    return grams


def estimate_duration(script: dict, settings: dict) -> float:
    v = settings.get("voice", {})
    wpm = float(v.get("target_wpm", 165)) * float(v.get("speed", 1.0))
    words = sum(len(b["text"].split()) for b in script["beats"])
    sents = sum(len(split_sentences(b["text"])) for b in script["beats"])
    pauses = sents * float(v.get("sentence_pause_s", 0.2)) + len(script["beats"]) * float(v.get("beat_pause_s", 0.3))
    return words / wpm * 60.0 + pauses + float(settings.get("editing", {}).get("end_padding_s", 0.6))


def validate(script: dict, settings: dict, app_settings: dict) -> dict:
    s = normalize(script)
    errors, warnings = [], []
    scfg = app_settings.get("script", {})
    if not s.get("title", "").strip():
        errors.append("title is empty")
    beats = s.get("beats", [])
    if len(beats) < 2:
        errors.append("a script needs at least 2 beats (hook + ending)")
    for b in beats:
        if not b.get("text", "").strip():
            errors.append(f"beat {b['id']}: narration text is empty")
        v = b["visual"]
        for shot in [v] + b.get("extra_shots", []):
            if shot["type"] not in ("footage", "image", "generated"):
                errors.append(f"beat {b['id']}: visual.type must be footage, image or generated")
            elif shot["type"] == "generated":
                if shot["generator"] not in GENERATORS:
                    errors.append(f"beat {b['id']}: generated visual needs generator in {GENERATORS}")
                if shot["generator"] == "text_card" and not shot.get("on_screen_text"):
                    errors.append(f"beat {b['id']}: text_card needs on_screen_text")
            elif not shot.get("query", "").strip():
                errors.append(f"beat {b['id']}: {shot['type']} visual needs a search query")
        if b.get("sfx", "auto") not in SFX_CHOICES:
            errors.append(f"beat {b['id']}: sfx must be one of {SFX_CHOICES}")
        for sent in split_sentences(b.get("text", "")):
            n = len(sent.split())
            if n > int(scfg.get("max_sentence_words", 28)):
                warnings.append(f"beat {b['id']}: long sentence ({n} words) - harder to follow on mobile")
        for e in b.get("emphasis", []):
            if e.lower() not in b["text"].lower():
                warnings.append(f"beat {b['id']}: emphasis word '{e}' does not appear in the narration")
    if beats:
        if beats[0].get("role") != "hook":
            warnings.append("first beat should have role 'hook'")
        hook_words = len(beats[0]["text"].split())
        if hook_words > int(scfg.get("max_hook_words", 18)):
            warnings.append(f"hook is {hook_words} words - aim for <= {scfg.get('max_hook_words', 18)}")
        wpm = settings["voice"].get("target_wpm", 165) * settings["voice"].get("speed", 1.0)
        hook_s = hook_words / wpm * 60
        if hook_s > settings["story"].get("hook_max_seconds", 3.5) * 1.3:
            warnings.append(f"hook takes ~{hook_s:.1f}s to say; learned/default limit is {settings['story']['hook_max_seconds']}s")
    text = " ".join(b.get("text", "") for b in beats)
    low = text.lower()
    for f in FILLER:
        if f in low:
            warnings.append(f"filler phrase: '{f}'")
    est = estimate_duration(s, settings) if beats else 0
    target = float(s.get("target_duration_s") or settings["story"].get("target_duration_s", 40))
    max_d = float(app_settings.get("export", {}).get("max_duration_s", 180))
    if est > max_d:
        errors.append(f"estimated {est:.0f}s exceeds the maximum Shorts length ({max_d:.0f}s)")
    elif est > target * 1.35:
        warnings.append(f"estimated {est:.0f}s is much longer than the {target:.0f}s target - tighten the script")
    elif est < target * 0.5:
        warnings.append(f"estimated {est:.0f}s is far below the {target:.0f}s target (fine if the story is complete - never pad)")
    claims = [x for x in split_sentences(text) if NUMBER_WORDS.search(x) or CLAIM_WORDS.search(x)]
    real_sources = [x for x in s.get("sources", []) if x.get("source", "").strip()]
    if claims and not real_sources:
        warnings.append(f"{len(claims)} factual-sounding sentence(s) but no sources listed - add sources for every claim")
    grams = _reference_ngrams()
    if grams:
        toks = re.findall(r"[a-z0-9']+", low)
        copied = set()
        for i in range(len(toks) - 5):
            g = tuple(toks[i:i + 6])
            if g in grams:
                copied.add((" ".join(g), grams[g]))
        for phrase, vid in sorted(copied)[:5]:
            warnings.append(f"originality: '{phrase}' also appears in reference {vid} - reword it")
    starts = [b["text"].split()[0].lower() for b in beats if b.get("text", "").split()]
    for w in set(starts):
        if starts.count(w) >= 3 and w not in ("the", "a"):
            warnings.append(f"{starts.count(w)} beats start with '{w}' - vary the rhythm")
    return {"errors": errors, "warnings": warnings,
            "stats": {"words": len(text.split()), "beats": len(beats), "estimated_duration_s": round(est, 1),
                      "target_duration_s": target, "sentences": len(split_sentences(text)),
                      "factual_sentences": len(claims), "sources": len(real_sources)}}


def to_markdown(script: dict, val: dict | None = None) -> str:
    s = normalize(script)
    md = [f"# {s.get('title') or '(untitled)'}", "",
          f"- **Topic:** {s.get('topic', '')}", f"- **Angle:** {s.get('angle', '')}",
          f"- **Target:** {s.get('target_duration_s')}s, music mood: {s.get('music_mood')}"]
    if val:
        st = val["stats"]
        md.append(f"- **Estimate:** {st['estimated_duration_s']}s, {st['words']} words, {st['beats']} beats")
    md += ["", "## Narration", ""]
    for b in s["beats"]:
        md.append(f"**{b['id']}. [{b['role']}]** {b['text']}")
        md.append("")
    md += ["## Beat plan", "", "| # | Role | Narration | Visual | SFX |", "|---|---|---|---|---|"]
    for b in s["beats"]:
        v = b["visual"]
        vis = f"{v['type']}: {v['generator'] or v['query']} - {v['description']}"
        if b.get("extra_shots"):
            vis += f" (+{len(b['extra_shots'])} shots)"
        md.append(f"| {b['id']} | {b['role']} | {b['text']} | {vis} | {b.get('sfx')} |")
    md += ["", "## Sources", ""]
    md += [f"- {x['claim']} - {x['source']}" for x in s.get("sources", []) if x.get("source")] or ["_none listed_"]
    if val:
        md += ["", "## Validation", ""]
        md += [f"- ERROR: {e}" for e in val["errors"]] + [f"- warning: {w}" for w in val["warnings"]]
        if not val["errors"] and not val["warnings"]:
            md.append("- no issues found")
    if s.get("notes"):
        md += ["", "## Notes", "", s["notes"]]
    return "\n".join(md) + "\n"


# ------------------------------------------------------------------------------------------- generation
def claude_available() -> bool:
    return bool(env_key("ANTHROPIC_API_KEY")) and importlib.util.find_spec("anthropic") is not None


def style_brief(settings: dict) -> str:
    """Learned storytelling guidance for the writer (Claude Code or the API)."""
    prof = read_json(paths.style_profile_json(), None) or {}
    feats = prof.get("features", {})
    lines = []
    v, st = settings["voice"], settings["story"]
    budget = int(st.get("target_duration_s", 40) * v.get("target_wpm", 165) * v.get("speed", 1.0) / 60)
    lines.append(f"Target length ~{st.get('target_duration_s')}s (~{budget} spoken words at {v.get('target_wpm')} wpm). "
                 "Shorter is fine if the story is complete - never pad.")
    lines.append(f"Hook: one sentence, said within {st.get('hook_max_seconds')}s.")
    for status in ("frequent", "occasional"):
        hooks = [k.split(":", 1)[1] for k, f in feats.items() if k.startswith("hook_features:") and f["status"] == status]
        ends = [k.split(":", 1)[1] for k, f in feats.items() if k.startswith("ending_types:") and f["status"] == status]
        if hooks:
            lines.append(f"Reference hooks {'often' if status == 'frequent' else 'sometimes'} use: {', '.join(hooks)}.")
        if ends:
            lines.append(f"Reference endings {'often' if status == 'frequent' else 'sometimes'}: {', '.join(ends)}.")
    if "words_per_sentence" in feats:
        lines.append(f"Reference sentences average {feats['words_per_sentence']['median']:.0f} words.")
    if "cuts_per_sentence" in feats:
        lines.append(f"About {feats['cuts_per_sentence']['median']:.1f} visual cuts per sentence - plan extra_shots for long beats.")
    reviewed = {k: f for k, f in feats.items() if k in ("footage_type", "overlay_graphics", "caption_case")
                and f.get("status") == "frequent"}
    if "footage_type" in reviewed:
        lines.append(f"Reference visuals are {reviewed['footage_type']['mode']}. This pipeline cannot animate characters: "
                     "plan visuals that read well as stills with camera motion (AI illustrations in an original style, "
                     "your own animation clips in production/footage/library/, or matching stock) - never copy the "
                     "reference channel's characters.")
    if "overlay_graphics" in reviewed:
        lines.append(f"Overlay graphics in the references: {reviewed['overlay_graphics']['mode']} - use text_card sparingly.")
    endings = feats.get("ending_cta")
    if endings and endings.get("status") == "frequent" and endings.get("mode") == "False":
        lines.append("References never end with a call to action - end on the payoff line.")
    if st.get("hook_intensity", 1.0) > 1.05:
        lines.append("Feedback asked for a stronger opening: lead with the most surprising concrete fact, no warm-up.")
    return "\n".join(f"- {l}" for l in lines)


SYSTEM_PROMPT = """You write narration scripts for original vertical YouTube Shorts.

Rules:
- Original wording only. Never reuse sentences or recognisable phrasing from other creators.
- Every factual claim must be accurate and listed in `sources` with a reputable source (agency, journal, encyclopedia).
  If you are not sure a fact is true, leave it out.
- Conversational, concrete, no filler ("in this video", "let's dive in", "make sure to subscribe").
- Beat 1 is the hook: one punchy sentence that creates curiosity immediately.
- Each beat is 1-2 short sentences that build on the previous one; the last beat (role "ending") lands the payoff.
- Plan visuals per beat: visual.type "footage" or "image" with 2-5 concrete stock-search keywords in `query`
  (things a stock library would have), or "generated" with a generator when no real footage fits.
  Use extra_shots for beats longer than ~2 shots of the target shot length.
- emphasis: 1-2 key words per beat that should be highlighted in the captions (must appear in the text).
- sfx: "auto" unless a specific effect clearly helps ("impact" on a reveal, "whoosh" on a jump in time/place).
- pronunciations: unusual names with a phonetic respelling for text-to-speech.
"""


def generate(topic: str, settings: dict, variants: int = 1, research: bool = True,
             angle: str = "", model: str = "claude-opus-5-5", effort: str = "high") -> list[dict]:
    if not claude_available():
        raise StudioError("Automatic script writing needs ANTHROPIC_API_KEY and `pip install anthropic`. "
                          "Inside Claude Code, let Claude write the script instead (see the skill).")
    import anthropic

    user = (f"Topic: {topic}\n" + (f"Preferred angle: {angle}\n" if angle else "")
            + f"Write {variants} distinct script variant(s) (different angles or hooks).\n\n"
            + "Style guidance learned from the reference channel:\n" + style_brief(settings)
            + f"\n\nAvailable generators: {', '.join(GENERATORS)}."
            + (" Research the facts with web search before writing." if research else ""))
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": 6}] if research else []
    messages: list[dict] = [{"role": "user", "content": user}]
    client = anthropic.Anthropic()
    kwargs = dict(model=model, max_tokens=32000, system=SYSTEM_PROMPT,
                  betas=["server-side-fallback-2026-07-01"], fallbacks="default",
                  output_config={"effort": effort, "format": {"type": "json_schema", "schema": VARIANTS_SCHEMA}})
    if tools:
        kwargs["tools"] = tools
    say(f"asking Claude ({model}) for {variants} script variant(s){' with web research' if research else ''}...")
    try:
        with client.beta.messages.stream(messages=messages, **kwargs) as stream:
            resp = stream.get_final_message()
        continuations = 0
        while resp.stop_reason == "pause_turn" and continuations < 5:
            messages = [{"role": "user", "content": user}, {"role": "assistant", "content": resp.content}]
            with client.beta.messages.stream(messages=messages, **kwargs) as stream:
                resp = stream.get_final_message()
            continuations += 1
    except anthropic.AuthenticationError as e:
        raise StudioError("ANTHROPIC_API_KEY was rejected by the Claude API.") from e
    except anthropic.RateLimitError as e:
        raise StudioError("Claude API rate limit reached - try again in a minute.") from e
    except anthropic.APIStatusError as e:
        raise StudioError(f"Claude API error {e.status_code}: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise StudioError("Could not reach the Claude API (network).") from e
    if resp.stop_reason == "refusal":
        raise StudioError("The model declined to write this script. Try rephrasing the topic.")
    if resp.stop_reason == "max_tokens":
        raise StudioError("Script generation was cut off (max_tokens). Ask for fewer variants.")
    texts = [b.text for b in resp.content if b.type == "text"]
    if not texts:
        raise StudioError("Claude returned no script text.")
    try:
        data = json.loads(texts[-1])
    except json.JSONDecodeError as e:
        raise StudioError("Claude returned malformed JSON for the script.") from e
    out = [normalize(v) for v in data.get("variants", [])]
    if not out:
        raise StudioError("Claude returned no script variants.")
    return out


def script_hash(script: dict) -> str:
    return text_hash(normalize(script))


def write_outputs(slug: str, script: dict, settings: dict, app_settings: dict, note: str = "") -> dict:
    save(slug, script, note=note)
    val = validate(script, settings, app_settings)
    write_text(paths.scripts_root() / slug / "script.md", to_markdown(script, val))
    write_json(paths.scripts_root() / slug / "validation.json", val)
    proj = projmod.load(slug)
    if val["errors"]:
        projmod.set_stage(proj, "script", "failed", errors=val["errors"])
    else:
        projmod.set_stage(proj, "script", "done", words=val["stats"]["words"],
                          estimated_duration_s=val["stats"]["estimated_duration_s"], hash=script_hash(script))
    return val
