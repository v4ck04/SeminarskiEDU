"""User feedback capture and the `improve` step.

Feedback is stored per video in training/feedback/. Free-form comments are
parsed into directives ("subtitles are too small" -> captions.font_scale up).
`improve` only turns a directive into a global preference once it has been
given in at least `feedback.repeat_threshold` separate feedback reports (or
when the user explicitly marks the feedback as global). Single isolated
corrections stay pending. Every applied change is versioned through the
style profile rebuild.
"""
from __future__ import annotations

import re
from pathlib import Path

from .. import paths
from ..config import PARAM_BOUNDS, get_path, load_editing_defaults, load_settings
from ..utils import StudioError, now_iso, read_json, say, slugify, write_json

RATING_KEYS = ["hook", "narration", "editing_rhythm", "subtitles", "visuals", "sound_effects", "overall"]

# step per directive: (op, value)
STEPS = {
    "captions.font_scale": ("mul", 1.12),
    "captions.position_y": ("add", 0.04),
    "captions.max_words": ("add", 1),
    "editing.target_shot_seconds": ("mul", 1.18),
    "editing.motion_intensity": ("mul", 1.3),
    "transitions.fancy_scale": ("mul", 1.6),
    "voice.speed": ("mul", 1.06),
    "audio.music_db_below_voice": ("add", 3.0),
    "audio.sfx_on_cuts_prob": ("add", 0.15),
    "audio.sfx_gain_db": ("add", 3.0),
    "story.target_duration_s": ("mul", 1.15),
    "story.hook_intensity": ("mul", 1.25),
    "color.saturation": ("mul", 1.08),
    "color.contrast": ("mul", 1.06),
}

COLORS = {"white": "#FFFFFF", "yellow": "#FFD400", "green": "#3DFF6E", "red": "#FF3B3B", "orange": "#FF9F1A",
          "blue": "#3BA4FF", "cyan": "#2EF2FF", "pink": "#FF4FD8", "purple": "#A35CFF", "black": "#000000"}

# (regex, param, direction, note). direction +1 increases, -1 decreases, or "set:<value>"
RULES: list[tuple[str, str, object, str]] = [
    (r"(subtitle|caption|text|font)s?\b.{0,30}\b(too )?(small|tiny|bigger|larger|hard to read)", "captions.font_scale", +1, "bigger captions"),
    (r"(bigger|larger) (subtitle|caption|text|font)s?", "captions.font_scale", +1, "bigger captions"),
    (r"(subtitle|caption|text|font)s?\b.{0,30}\b(too )?(big|large|huge|smaller)", "captions.font_scale", -1, "smaller captions"),
    (r"smaller (subtitle|caption|text|font)s?", "captions.font_scale", -1, "smaller captions"),
    (r"(subtitle|caption)s?\b.{0,30}\b(higher|move up|too low)", "captions.position_y", -1, "captions higher"),
    (r"(subtitle|caption)s?\b.{0,30}\b(lower|move down|too high)", "captions.position_y", +1, "captions lower"),
    (r"(fewer|less) words (per|in each|on) (caption|subtitle|screen)|(subtitle|caption)s? .{0,20}too (long|much text)", "captions.max_words", -1, "fewer words per caption"),
    (r"more words (per|in each|on) (caption|subtitle|screen)", "captions.max_words", +1, "more words per caption"),
    (r"(cuts?|editing|pacing|pace|edit)\b.{0,25}\b(faster|quicker|snappier)|(faster|quicker) (cuts|editing|pacing)|more cuts|(cuts?|editing) (are |is )?too slow", "editing.target_shot_seconds", -1, "faster cuts"),
    (r"(cuts?|editing)\b.{0,25}\b(slower|calmer)|(slower|fewer) cuts|too many cuts|(cuts?|editing) (are |is )?too fast", "editing.target_shot_seconds", +1, "slower cuts"),
    (r"(fewer|less|too many|reduce( the)?|no) (fancy )?transitions", "transitions.fancy_scale", -1, "fewer transitions"),
    (r"more transitions", "transitions.fancy_scale", +1, "more transitions"),
    (r"(more|stronger|bigger) (zoom|movement|motion)", "editing.motion_intensity", +1, "more motion"),
    (r"(less|fewer|too much|weaker|subtler) (zoom|zooming|movement|motion)", "editing.motion_intensity", -1, "less motion"),
    (r"(narration|voice|narrator)\b.{0,30}\b(too fast|faster than|slow (it )?down|speak slower)", "voice.speed", -1, "slower narration"),
    (r"(narration|voice|narrator)\b.{0,30}\b(too slow|speed (it )?up|speak faster)", "voice.speed", +1, "faster narration"),
    (r"(narration|voice)\b.{0,40}\b(natural|robotic|unnatural|monotone|flat)", "voice.naturalness", "flag", "voice should sound more natural"),
    (r"music\b.{0,20}\b(too loud|louder than|lower)|lower the music|can'?t hear (the )?(voice|narration)", "audio.music_db_below_voice", +1, "quieter music"),
    (r"music\b.{0,20}\b(too quiet|too low|louder)|more music", "audio.music_db_below_voice", -1, "louder music"),
    (r"(fewer|less|too many|too much) (sound effects|sfx|whoosh|effects)", "audio.sfx_on_cuts_prob", -1, "fewer sound effects"),
    (r"more (sound effects|sfx|whoosh)", "audio.sfx_on_cuts_prob", +1, "more sound effects"),
    (r"(opening|hook|intro|beginning|start)\b.{0,40}\b(engaging|boring|weak|stronger|better|punchier|slow)", "story.hook_intensity", +1, "stronger hook"),
    (r"(video|it)\b.{0,15}\b(too long|shorter)|make it shorter", "story.target_duration_s", -1, "shorter video"),
    (r"(video|it)\b.{0,15}\b(too short|longer)|make it longer", "story.target_duration_s", +1, "longer video"),
    (r"(more|too) (saturated|colorful|colourful)|less colou?r", "color.saturation", "contextual", "saturation"),
]


def parse_comment(text: str) -> list[dict]:
    t = (text or "").lower()
    out: list[dict] = []
    seen = set()
    for pat, param, direction, note in RULES:
        m = re.search(pat, t)
        if not m:
            continue
        if direction == "contextual":
            direction = -1 if re.search(r"too (saturated|colorful|colourful)|less colou?r", t) else +1
        key = (param, direction)
        if key in seen:
            continue
        seen.add(key)
        out.append({"param": param, "direction": direction, "note": note, "matched": m.group(0)})
    # explicit colours: "highlight in green", "make the subtitles yellow"
    for cname, hexv in COLORS.items():
        if re.search(rf"highlight\w*\b.{{0,20}}\b{cname}|{cname} highlight", t):
            out.append({"param": "captions.highlight_color", "direction": f"set:{hexv}", "note": f"{cname} highlight",
                        "matched": cname})
        elif re.search(rf"(subtitle|caption|text)s?\b.{{0,20}}\b{cname}\b", t) and "highlight" not in t:
            out.append({"param": "captions.primary_color", "direction": f"set:{hexv}", "note": f"{cname} captions",
                        "matched": cname})
    if re.search(r"no (sound effects|sfx)", t):
        out.append({"param": "audio.sfx_enabled", "direction": "set:false", "note": "no sound effects", "matched": "no sfx"})
    if re.search(r"no music|without music", t):
        out.append({"param": "audio.music_enabled", "direction": "set:false", "note": "no music", "matched": "no music"})
    if re.search(r"(lowercase|lower case|no caps|not all caps)", t):
        out.append({"param": "captions.uppercase", "direction": "set:false", "note": "lowercase captions", "matched": "lowercase"})
    elif re.search(r"(all caps|uppercase|upper case|capital letters)", t):
        out.append({"param": "captions.uppercase", "direction": "set:true", "note": "uppercase captions", "matched": "caps"})
    return out


def record(project: str, ratings: dict[str, int], comment: str = "", apply_globally: bool = False) -> Path:
    for k, v in ratings.items():
        if k not in RATING_KEYS:
            raise StudioError(f"Unknown rating '{k}'. Use: {', '.join(RATING_KEYS)}")
        if not (1 <= int(v) <= 5):
            raise StudioError(f"Rating {k} must be 1-5")
    directives = parse_comment(comment)
    # a low rating without any comment is recorded as "needs attention" (no automatic change)
    attention = [k for k, v in ratings.items() if int(v) <= 2]
    entry = {
        "id": f"{slugify(project, 30)}-{now_iso().replace(':', '').replace('-', '')[:15]}",
        "project": project, "created_at": now_iso(),
        "ratings": {k: int(v) for k, v in ratings.items()},
        "comment": comment, "apply_globally": bool(apply_globally),
        "directives": directives, "needs_attention": attention,
        "processed": False,
    }
    p = paths.feedback_dir() / f"{entry['id']}.json"
    write_json(p, entry)
    return p


def load_all() -> list[dict]:
    return [read_json(p) for p in sorted(paths.feedback_dir().glob("*.json"))]


def _tally(entries: list[dict]) -> dict:
    """Net votes per (param) across separate feedback reports."""
    tally: dict = {}
    for e in entries:
        per_entry = set()
        for d in e.get("directives", []):
            k = (d["param"], str(d["direction"]))
            if k in per_entry:
                continue
            per_entry.add(k)
            t = tally.setdefault(d["param"], {"up": [], "down": [], "set": {}, "flag": [], "global": False, "notes": set()})
            t["notes"].add(d["note"])
            if e.get("apply_globally"):
                t["global"] = True
            if d["direction"] == 1:
                t["up"].append(e["id"])
            elif d["direction"] == -1:
                t["down"].append(e["id"])
            elif isinstance(d["direction"], str) and d["direction"].startswith("set:"):
                t["set"].setdefault(d["direction"][4:], []).append(e["id"])
            else:
                t["flag"].append(e["id"])
    return tally


def improve(force: bool = False, dry_run: bool = False) -> dict:
    entries = load_all()
    if not entries:
        say("No feedback recorded yet. Use `studio.py feedback <project>` after reviewing a video.", level="warn")
        return {"applied": [], "pending": []}
    thr = int(load_settings().get("feedback", {}).get("repeat_threshold", 2))
    tally = _tally(entries)
    prefs = read_json(paths.preferences_file(), {"params": {}, "history": []})
    defaults = load_editing_defaults()
    applied, pending, flags = [], [], []
    for param, t in tally.items():
        if t["flag"]:
            flags.append(f"{param}: {', '.join(sorted(t['notes']))} ({len(t['flag'])} report(s)) - "
                         "consider a premium TTS provider/voice in config/voice-settings.json")
            continue
        net = len(t["up"]) - len(t["down"])
        votes = max(len(t["up"]), len(t["down"]))
        ok = force or t["global"]
        if t["set"]:
            val, ids = max(t["set"].items(), key=lambda kv: len(kv[1]))
            if ok or len(ids) >= thr:
                v = {"true": True, "false": False}.get(val, val)
                cur = prefs["params"].get(param)
                if not cur or cur.get("value") != v:
                    applied.append((param, {"op": "set", "value": v, "evidence": len(ids), "feedback": ids}))
            else:
                pending.append(f"{param} = {val} ({len(ids)}/{thr} reports)")
            continue
        if net == 0:
            if votes:
                pending.append(f"{param}: conflicting feedback ({len(t['up'])} up / {len(t['down'])} down)")
            continue
        if not ok and abs(net) < thr:
            pending.append(f"{param}: {', '.join(sorted(t['notes']))} ({abs(net)}/{thr} reports)")
            continue
        op, step = STEPS.get(param, ("mul", 1.1))
        ids = t["up"] if net > 0 else t["down"]
        # 'target_shot_seconds' and 'music_db_below_voice' directions are inverted by the rule definition
        sign = 1 if net > 0 else -1
        cur = prefs["params"].get(param)
        n_steps = (cur or {}).get("steps", 0) + sign
        if op == "mul":
            value = round(step ** n_steps, 4)
        else:
            value = round(step * n_steps, 4)
        base = get_path(defaults, param)
        if param in PARAM_BOUNDS and isinstance(base, (int, float)):
            lo, hi = PARAM_BOUNDS[param]
            eff = base * value if op == "mul" else base + value
            if eff < lo or eff > hi:
                pending.append(f"{param}: already at its limit")
                continue
        applied.append((param, {"op": op, "value": value, "steps": n_steps, "evidence": len(ids), "feedback": ids,
                                "reason": ", ".join(sorted(t["notes"]))}))
    if not dry_run:
        for param, pref in applied:
            prefs["params"][param] = {**pref, "updated_at": now_iso()}
        if applied:
            prefs.setdefault("history", []).append({"time": now_iso(), "applied": [{p: v} for p, v in applied]})
        write_json(paths.preferences_file(), prefs)
        consumed = {i for _, v in applied for i in v.get("feedback", [])}
        for e in entries:
            if e["id"] in consumed and not e.get("processed"):
                e["processed"] = True
                e["processed_at"] = now_iso()
                write_json(paths.feedback_dir() / f"{e['id']}.json", e)
        if applied:
            from . import profile
            profile.rebuild(event="improve", note="; ".join(f"{p}: {v['op']} {v['value']}" for p, v in applied))
    for param, v in applied:
        say(f"{'would apply' if dry_run else 'applied'}: {param} {v['op']} {v['value']} "
            f"(from {v['evidence']} feedback report(s))", level="ok")
    for p in pending:
        say(f"pending (needs repetition): {p}")
    for f in flags:
        say(f"note: {f}", level="warn")
    ratings_summary = {}
    for k in RATING_KEYS:
        vals = [e["ratings"][k] for e in entries if k in e.get("ratings", {})]
        if vals:
            ratings_summary[k] = round(sum(vals) / len(vals), 2)
    if ratings_summary:
        say("average ratings: " + ", ".join(f"{k} {v}" for k, v in ratings_summary.items()))
    return {"applied": applied, "pending": pending, "flags": flags, "ratings": ratings_summary}
