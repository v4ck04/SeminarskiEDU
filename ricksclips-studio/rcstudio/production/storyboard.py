"""Storyboard: narration beats -> timed scenes with visuals, motion,
transitions, sound effects and subtitle text.

Before the voice exists, timings are estimated from the word budget; after
voice generation the storyboard is rebuilt from the real sentence/word
timings so cuts land on word boundaries.
"""
from __future__ import annotations

import random

from .. import paths
from ..utils import fmt_time, now_iso, split_sentences, stable_seed, write_json, write_text

FANCY = ("crossfade", "whip", "zoom", "flash", "dip_black")


def _estimate_timing(script: dict, settings: dict) -> dict:
    v = settings["voice"]
    wps = float(v.get("target_wpm", 165)) * float(v.get("speed", 1.0)) / 60.0
    t = float(v.get("lead_in_s", 0.12))
    sents = []
    for bi, b in enumerate(script["beats"]):
        for si, s in enumerate(split_sentences(b["text"])):
            words = s.split()
            dur = len(words) / wps
            ws, wt = [], t
            per = dur / max(1, len(words))
            for w in words:
                ws.append({"word": w, "start": round(wt, 3), "end": round(wt + per * 0.92, 3)})
                wt += per
            sents.append({"beat_id": b["id"], "text": s, "start": round(t, 3), "end": round(t + dur, 3), "words": ws})
            t += dur + float(v.get("sentence_pause_s", 0.2))
        t += float(v.get("beat_pause_s", 0.3)) - float(v.get("sentence_pause_s", 0.2))
    return {"sentences": sents, "source": "estimate"}


def _weighted(rng: random.Random, mix: dict, exclude: str | None = None) -> str:
    items = [(k, max(0.0, float(w))) for k, w in mix.items() if k != exclude and w > 0]
    if not items:
        items = [(k, 1.0) for k in mix]
    total = sum(w for _, w in items)
    r = rng.random() * total
    for k, w in items:
        r -= w
        if r <= 0:
            return k
    return items[-1][0]


def _snap(t: float, words: list[dict], lo: float, hi: float) -> float:
    """Move a cut to the nearest gap between words inside [lo, hi]."""
    best, bd = t, 0.45
    for a, b in zip(words, words[1:]):
        g = (a["end"] + b["start"]) / 2
        if lo <= g <= hi and abs(g - t) < bd:
            best, bd = g, abs(g - t)
    return best


def build(script: dict, settings: dict, slug: str, timing: dict | None = None) -> dict:
    ed, tr, au, cap = settings["editing"], settings["transitions"], settings["audio"], settings["captions"]
    rng = random.Random(stable_seed(slug, script.get("title", "")))
    timing = timing or _estimate_timing(script, settings)
    sents = timing["sentences"]
    words_all = [w for s in sents for w in s["words"]]
    end_pad = float(ed.get("end_padding_s", 0.6))
    total = round((sents[-1]["end"] if sents else 0) + end_pad, 3)

    # beat spans: each beat's visuals run until the next beat starts speaking
    beats = script["beats"]
    starts = {}
    for s in sents:
        starts.setdefault(s["beat_id"], s["start"])
    spans = []
    for i, b in enumerate(beats):
        a = 0.0 if i == 0 else starts.get(b["id"], spans[-1][1] if spans else 0.0)
        spans.append([a, None])
        if i:
            spans[i - 1][1] = a
    if spans:
        spans[-1][1] = total

    target = float(ed.get("target_shot_seconds", 2.2))
    min_shot = min(float(ed.get("min_shot_seconds", 0.8)), target * 0.6)
    mix = ed.get("motion_mix") or {"zoom_in": 1}
    tmix = dict(tr.get("mix") or {"cut": 1})
    p_cut = float(tmix.get("cut", 1.0))
    fancy_total = sum(float(tmix.get(k, 0)) for k in FANCY)
    fancy_p = min(0.9, (1 - p_cut) * float(tr.get("fancy_scale", 1.0))) if fancy_total > 0 else 0.0
    durs = tr.get("durations", {})

    scenes: list[dict] = []
    prev_motion = prev2_motion = None
    for bi, (b, (a, e)) in enumerate(zip(beats, spans)):
        visuals = [b["visual"]] + list(b.get("extra_shots", []))
        span = max(0.01, e - a)
        n = max(len(visuals) if span / len(visuals) >= min_shot else 1, int(round(span / target)) or 1)
        while n > 1 and span / n < min_shot:
            n -= 1
        bounds = [a] + [a + span * k / n for k in range(1, n)] + [e]
        bwords = [w for w in words_all if a - 0.05 <= w["start"] < e]
        for k in range(1, n):
            bounds[k] = _snap(bounds[k], bwords, bounds[k - 1] + min_shot, bounds[k + 1] - min_shot)
        for k in range(n):
            s0, s1 = round(bounds[k], 3), round(bounds[k + 1], 3)
            vis = dict(visuals[k % len(visuals)])
            vis["variant"] = k // len(visuals)
            first_scene = not scenes
            beat_start = k == 0
            # motion
            if first_scene and ed.get("hook_punch_in", True):
                motion = "punch_in"
            else:
                # follow the learned mix; only avoid three identical moves in a row
                motion = _weighted(rng, mix, exclude=prev_motion if prev_motion == prev2_motion else None)
            prev2_motion, prev_motion = prev_motion, motion
            dur = s1 - s0
            intensity = float(ed.get("motion_intensity", 0.08)) * min(1.6, max(0.6, dur / target))
            if motion == "punch_in":
                intensity = float(ed.get("punch_in_amount", 0.12))
            # transition into this scene
            ttype = "cut"
            if not first_scene and (beat_start or not tr.get("only_at_beat_boundaries", True)) and fancy_p > 0:
                if rng.random() < fancy_p:
                    ttype = _weighted(rng, {t: tmix.get(t, 0) for t in FANCY})
            tdur = float(durs.get(ttype, 0.0)) if ttype != "cut" else 0.0
            # sound effects
            sfx = []
            if au.get("sfx_enabled", True):
                if first_scene and au.get("hook_impact", True) and b.get("sfx") in ("auto", "impact"):
                    sfx.append({"type": "impact", "time": round(max(0.0, s0 + 0.02), 3)})
                elif beat_start and b.get("sfx") not in ("auto", "none"):
                    sfx.append({"type": b["sfx"], "time": round(max(0.0, s0 - (0.1 if b["sfx"] == "whoosh" else 0)), 3)})
                elif ttype in ("whip", "zoom", "flash") and b.get("sfx") != "none":
                    sfx.append({"type": "whoosh", "time": round(max(0.0, s0 - 0.12), 3)})
                elif beat_start and not first_scene and b.get("sfx") == "auto" and rng.random() < float(au.get("sfx_on_cuts_prob", 0.25)):
                    sfx.append({"type": "whoosh", "time": round(max(0.0, s0 - 0.12), 3)})
            sw = [w for w in words_all if s0 - 0.01 <= w["start"] < s1]
            narration = " ".join(w["word"] for w in sw)
            req = (f"{vis['type']}: {vis.get('query') or vis.get('generator')}"
                   + (f" (alternative #{vis['variant'] + 1})" if vis["variant"] else ""))
            scenes.append({
                "scene": len(scenes) + 1, "start": s0, "end": s1, "duration": round(dur, 3),
                "beat_id": b["id"], "beat_role": b.get("role", "body"),
                "narration": narration,
                "subtitle_text": narration.upper() if cap.get("uppercase") else narration,
                "visual": vis, "visual_description": vis.get("description", ""),
                "required_footage": req,
                "motion": {"type": motion, "intensity": round(intensity, 4)},
                "transition_in": {"type": ttype, "duration": tdur},
                "sfx": sfx, "speed": 1.0,
                "emphasis": b.get("emphasis", []),
            })
    return {"slug": slug, "title": script.get("title", ""), "created_at": now_iso(),
            "timing_source": timing.get("source", "voice"), "duration": total,
            "music_mood": script.get("music_mood", "mysterious"), "scenes": scenes}


def to_markdown(sb: dict) -> str:
    md = [f"# Storyboard: {sb['title']}", "",
          f"- Duration: {sb['duration']:.2f}s, {len(sb['scenes'])} scenes, timings from **{sb['timing_source']}**",
          f"- Music mood: {sb['music_mood']}", "",
          "| # | Time | Narration | Visual | Motion | Transition in | SFX |", "|---|---|---|---|---|---|---|"]
    for s in sb["scenes"]:
        sfx = ", ".join(f"{x['type']}@{x['time']:.2f}" for x in s["sfx"]) or "-"
        tin = s["transition_in"]["type"] + (f" {s['transition_in']['duration']}s" if s["transition_in"]["duration"] else "")
        md.append(f"| {s['scene']} | {fmt_time(s['start'])}-{fmt_time(s['end'])} | {s['narration']} | "
                  f"{s['required_footage']} - {s['visual_description']} | {s['motion']['type']} | {tin} | {sfx} |")
    return "\n".join(md) + "\n"


def save(sb: dict) -> None:
    d = paths.project_dirs(sb["slug"])["storyboard"]
    write_json(d / "storyboard.json", sb)
    write_text(d / "storyboard.md", to_markdown(sb))
