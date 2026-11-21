"""Style learning engine.

Aggregates every analysis report in training/analysis/ into a shared style
profile:

* each feature gets a status - **frequent** (seen consistently in >= 3
  videos), **occasional** (seen in some videos / variable) or **uncertain**
  (too little or too weak evidence). One video is never enough for a rule.
* production parameters are derived only from features with sufficient
  evidence; everything else keeps the defaults in config/editing-settings.json.
* every rebuild that changes the profile is saved as a new version in
  training/profile-history/ and logged in training/training-history.json.
"""
from __future__ import annotations

import copy
import math
from pathlib import Path

import numpy as np

from .. import log, paths
from ..config import load_settings
from ..utils import fmt_time, now_iso, read_json, say, text_hash, write_json, write_text

_log = log.get("style.profile")

# key: (section, label, format, tolerance kind, tolerance)
NUMERIC = {
    "duration": ("Storytelling structure", "video length", "{:.0f}s", "rel", 0.35),
    "words_per_sentence": ("Storytelling structure", "words per sentence", "{:.1f}", "rel", 0.3),
    "numbers_per_10s": ("Storytelling structure", "numbers/statistics per 10 s", "{:.1f}", "rel", 0.6),
    "hook_duration": ("Hook patterns", "hook sentence length", "{:.1f}s", "rel", 0.4),
    "hook_words": ("Hook patterns", "hook word count", "{:.0f} words", "rel", 0.4),
    "time_to_first_word": ("Hook patterns", "time to first spoken word", "{:.2f}s", "abs", 0.4),
    "hook_cuts_per_s": ("Hook patterns", "cuts per second in the first 3 s", "{:.2f}/s", "rel", 0.5),
    "wpm": ("Narration pacing", "narration pace", "{:.0f} wpm", "rel", 0.15),
    "speech_ratio": ("Narration pacing", "share of runtime with speech", "{:.0%}", "abs", 0.15),
    "pause_median": ("Narration pacing", "median pause", "{:.2f}s", "abs", 0.15),
    "pauses_per_min": ("Narration pacing", "pauses per minute of speech", "{:.0f}", "rel", 0.4),
    "shot_len_median": ("Scene duration patterns", "median shot length", "{:.2f}s", "rel", 0.35),
    "cuts_per_min": ("Scene duration patterns", "cuts per minute", "{:.0f}", "rel", 0.35),
    "shot_len_cv": ("Scene duration patterns", "shot-length variation (CV)", "{:.2f}", "abs", 0.2),
    "pace_change_ratio": ("Scene duration patterns", "2nd-half / 1st-half shot length", "{:.2f}", "abs", 0.25),
    "cut_word_alignment": ("Scene duration patterns", "cuts on word boundaries", "{:.0%}", "abs", 0.2),
    "cut_sentence_alignment": ("Scene duration patterns", "cuts on sentence boundaries", "{:.0%}", "abs", 0.2),
    "cuts_per_sentence": ("Scene duration patterns", "cuts per narrated sentence", "{:.1f}", "rel", 0.5),
    "caption_coverage": ("Subtitle design", "caption coverage", "{:.0%}", "abs", 0.2),
    "caption_y": ("Subtitle design", "caption vertical position (0=top)", "{:.2f}", "abs", 0.06),
    "caption_text_h": ("Subtitle design", "caption letter height (frame fraction)", "{:.3f}", "abs", 0.008),
    "caption_words": ("Subtitle design", "words per caption", "{:.1f}", "abs", 1.0),
    "caption_words_p80": ("Subtitle design", "words per caption (80th percentile)", "{:.1f}", "abs", 1.0),
    "caption_lines": ("Subtitle design", "lines per caption", "{:.1f}", "abs", 0.6),
    "caption_duration": ("Subtitle design", "caption on-screen time", "{:.2f}s", "rel", 0.4),
    "caption_highlight_share": ("Subtitle design", "captions with highlighted words", "{:.0%}", "abs", 0.25),
    "caption_outline_share": ("Subtitle design", "captions with dark outline", "{:.0%}", "abs", 0.25),
    "caption_outline_frac": ("Subtitle design", "outline thickness (frame-width fraction)", "{:.4f}", "abs", 0.004),
    "caption_caps_share": ("Subtitle design", "ALL CAPS likelihood", "{:.0%}", "abs", 0.3),
    "caption_stroke_ratio": ("Subtitle design", "stroke/height ratio (weight)", "{:.2f}", "abs", 0.06),
    "caption_char_aspect": ("Subtitle design", "letter width/height", "{:.2f}", "abs", 0.15),
    "transition_share_cut": ("Transitions", "hard cuts", "{:.0%}", "abs", 0.15),
    "transition_share_dissolve": ("Transitions", "dissolves", "{:.0%}", "abs", 0.15),
    "transition_share_flash": ("Transitions", "flash transitions", "{:.0%}", "abs", 0.15),
    "transition_share_dip_black": ("Transitions", "dips to black", "{:.0%}", "abs", 0.15),
    "transition_share_whip_or_blur": ("Transitions", "whip/blur transitions", "{:.0%}", "abs", 0.15),
    "transition_share_zoom_transition": ("Transitions", "zoom transitions", "{:.0%}", "abs", 0.15),
    "motion_share_zoom_in": ("Camera movement", "zoom-in shots", "{:.0%}", "abs", 0.2),
    "motion_share_zoom_out": ("Camera movement", "zoom-out shots", "{:.0%}", "abs", 0.2),
    "motion_share_pan_left": ("Camera movement", "pan-left shots", "{:.0%}", "abs", 0.2),
    "motion_share_pan_right": ("Camera movement", "pan-right shots", "{:.0%}", "abs", 0.2),
    "motion_share_pan_up": ("Camera movement", "pan-up shots", "{:.0%}", "abs", 0.2),
    "motion_share_pan_down": ("Camera movement", "pan-down shots", "{:.0%}", "abs", 0.2),
    "motion_share_static": ("Camera movement", "static shots", "{:.0%}", "abs", 0.2),
    "moving_shot_share": ("Camera movement", "shots with camera/zoom movement", "{:.0%}", "abs", 0.2),
    "zoom_rate_median": ("Camera movement", "zoom speed", "{:.1%}/s", "rel", 0.5),
    "shake_share": ("Camera movement", "shots with shake", "{:.0%}", "abs", 0.2),
    "animated_still_share": ("Camera movement", "animated still images (Ken Burns)", "{:.0%}", "abs", 0.25),
    "brightness": ("Visual composition", "brightness (L)", "{:.2f}", "abs", 0.08),
    "contrast": ("Visual composition", "contrast (L std)", "{:.3f}", "abs", 0.04),
    "saturation": ("Visual composition", "saturation", "{:.2f}", "abs", 0.1),
    "colorfulness": ("Visual composition", "colourfulness", "{:.0f}", "rel", 0.3),
    "warmth": ("Visual composition", "warmth (Lab b*)", "{:+.1f}", "abs", 5.0),
    "face_frame_share": ("Visual composition", "frames with faces", "{:.0%}", "abs", 0.25),
    "lufs": ("Sound design", "integrated loudness", "{:.1f} LUFS", "abs", 2.5),
    "true_peak": ("Sound design", "true peak", "{:.1f} dBTP", "abs", 2.0),
    "sfx_per_min": ("Sound design", "effect-like events per minute", "{:.0f}", "rel", 0.6),
    "cuts_with_sfx_share": ("Sound design", "cuts with an effect", "{:.0%}", "abs", 0.25),
    "bed_below_speech_db": ("Music characteristics", "background bed below speech", "{:.0f} dB", "abs", 5.0),
}

CATEGORICAL = {
    "layout": ("Visual composition", "frame layout"),
    "temperature": ("Visual composition", "colour temperature"),
    "teal_orange": ("Visual composition", "teal/orange split tone"),
    "vignette_likely": ("Visual composition", "vignette"),
    "dominant_motion": ("Camera movement", "most common camera move"),
    "caption_zone": ("Subtitle design", "caption zone"),
    "caption_fill_color": ("Subtitle design", "caption text colour"),
    "caption_fill_hex": ("Subtitle design", "caption text colour (hex)"),
    "caption_highlight_color": ("Subtitle design", "highlight colour"),
    "caption_highlight_hex": ("Subtitle design", "highlight colour (hex)"),
    "caption_highlight_mode": ("Subtitle design", "highlight style"),
    "caption_shadow": ("Subtitle design", "drop shadow"),
    "caption_boxed": ("Subtitle design", "caption background box"),
    "caption_weight_class": ("Subtitle design", "letter weight"),
    "caption_width_class": ("Subtitle design", "letter width"),
    "caption_animation": ("Subtitle design", "caption onset animation"),
    "music_likely": ("Music characteristics", "music bed under narration"),
    "ending_cta": ("Ending patterns", "ends with a call to action"),
    "footage_type": ("Visual composition", "footage type (reviewed)"),
    "caption_case": ("Subtitle design", "caption letter case (reviewed)"),
    "overlay_graphics": ("Visual composition", "overlay graphics (reviewed)"),
}
LIST_FEATURES = {
    "hook_features": ("Hook patterns", "hook uses"),
    "ending_types": ("Ending patterns", "ending"),
    "transitions_present": ("Transitions", "uses"),
}
SECTIONS = ["Overall editing identity", "Hook patterns", "Storytelling structure", "Narration pacing",
            "Scene duration patterns", "Subtitle design", "Transitions", "Camera movement",
            "Visual composition", "Sound design", "Music characteristics", "Ending patterns"]


def load_reports() -> list[dict]:
    out = []
    for p in sorted(paths.analysis_dir().glob("*.json")):
        if p.name.endswith((".transcript.json", ".notes.json")):
            continue
        r = read_json(p)
        if r and "metrics" in r and "video" in r:
            out.append(r)
    return out


def _tol(kind: str, tol: float, ref: float) -> float:
    return tol if kind == "abs" else max(1e-6, tol * abs(ref))


def _cfg() -> dict:
    s = load_settings().get("style_learning", {})
    return {"min_frequent": int(s.get("min_videos_for_frequent", 3)),
            "frequent_share": float(s.get("frequent_share", 0.7)),
            "occasional_share": float(s.get("occasional_share", 0.3))}


def aggregate(reports: list[dict]) -> dict:
    cfg = _cfg()
    n_total = len(reports)
    feats: dict = {}
    for key, (section, label, fmt, kind, tol) in NUMERIC.items():
        vals, confs = {}, []
        for r in reports:
            if key in r["metrics"]:
                vals[r["video"]["id"]] = r["metrics"][key]
                confs.append(r["metrics_confidence"].get(key, 0.5))
        if not vals:
            continue
        arr = np.array(list(vals.values()), dtype=float)
        med = float(np.median(arr))
        std = float(arr.std()) if len(arr) > 1 else 0.0
        c = float(np.mean(confs))
        consistent = std <= _tol(kind, tol, med)
        n = len(arr)
        if n >= cfg["min_frequent"] and c >= 0.5 and consistent:
            status = "frequent"
        elif n >= 2 and c >= 0.35:
            status = "occasional"
        else:
            status = "uncertain"
        feats[key] = {"kind": "numeric", "section": section, "label": label, "format": fmt,
                      "median": round(med, 4), "mean": round(float(arr.mean()), 4),
                      "min": round(float(arr.min()), 4), "max": round(float(arr.max()), 4),
                      "std": round(std, 4), "iqr": [round(float(np.percentile(arr, 25)), 4), round(float(np.percentile(arr, 75)), 4)],
                      "n": n, "confidence": round(c, 2), "consistent": bool(consistent), "status": status,
                      "values": vals}
    for key, (section, label) in CATEGORICAL.items():
        vals = {r["video"]["id"]: r["categorical"][key] for r in reports
                if key in r.get("categorical", {}) and r["categorical"][key] is not None}
        if not vals:
            continue
        counts: dict = {}
        for v in vals.values():
            counts[str(v)] = counts.get(str(v), 0) + 1
        mode = max(counts, key=counts.get)
        share = counts[mode] / max(1, n_total)
        feats[key] = {"kind": "categorical", "section": section, "label": label, "mode": mode,
                      "share": round(share, 3), "counts": counts, "n": len(vals), "of": n_total,
                      "status": _cat_status(share, n_total, cfg), "values": vals}
    for key, (section, label) in LIST_FEATURES.items():
        per_item: dict = {}
        seen = 0
        for r in reports:
            items = r.get("categorical", {}).get(key)
            if items is None:
                continue
            seen += 1
            for it in set(items):
                per_item.setdefault(it, []).append(r["video"]["id"])
        for it, vids in per_item.items():
            share = len(vids) / max(1, n_total)
            feats[f"{key}:{it}"] = {"kind": "presence", "section": section, "label": f"{label} {it.replace('_', ' ')}",
                                    "share": round(share, 3), "n": len(vids), "of": seen,
                                    "status": _cat_status(share, n_total, cfg), "videos": vids}
    return feats


def _cat_status(share: float, n_total: int, cfg: dict) -> str:
    if n_total >= cfg["min_frequent"] and share >= cfg["frequent_share"]:
        return "frequent"
    if n_total >= 2 and share >= cfg["occasional_share"]:
        return "occasional"
    return "uncertain"


def describe(key: str, f: dict) -> str:
    if f["kind"] == "numeric":
        fmt = f["format"]
        try:
            core = fmt.format(f["median"])
            rng = f"{fmt.format(f['min'])}-{fmt.format(f['max'])}" if f["n"] > 1 else "single video"
        except (ValueError, TypeError):
            core, rng = str(f["median"]), ""
        cons = "consistent" if f["consistent"] and f["n"] > 1 else ("varies" if f["n"] > 1 else "")
        return f"{f['label']}: {core} ({rng}{', ' + cons if cons else ''}; {f['n']} video(s), conf {f['confidence']})"
    if f["kind"] == "categorical":
        return f"{f['label']}: {f['mode']} ({f['counts'][f['mode']]}/{f.get('of') or sum(f['counts'].values())} videos)"
    return f"{f['label']} ({f['n']}/{f.get('of', f['n'])} videos)"


# ------------------------------------------------------------------------------------------------
# production parameters
# ------------------------------------------------------------------------------------------------
FONT_CHOICES = {
    ("heavy/black", "condensed"): ("Anton", "Anton-Regular.ttf"),
    ("heavy/black", "normal"): ("Poppins Black", "Poppins-Black.ttf"),
    ("heavy/black", "wide"): ("Archivo Black", "ArchivoBlack-Regular.ttf"),
    ("bold", "condensed"): ("Bebas Neue", "BebasNeue-Regular.ttf"),
    ("bold", "normal"): ("Poppins ExtraBold", "Poppins-ExtraBold.ttf"),
    ("bold", "wide"): ("Poppins ExtraBold", "Poppins-ExtraBold.ttf"),
    ("regular/medium", "normal"): ("Poppins", "Poppins-Bold.ttf"),
}
ANIM_MAP = {"scale_in": "pop", "scale_down_in": "pop", "fade_in": "fade", "slide_in": "slide",
            "word_reveal": "word_reveal", "word_reveal_next": "word_reveal", "none": "none"}
TRANSITION_MAP = {"cut": "cut", "dissolve": "crossfade", "flash": "flash", "dip_black": "dip_black",
                  "cut_through_black": "dip_black", "whip_or_blur": "whip", "zoom_transition": "zoom"}
MOTIONS = ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "static"]


def _worst(*statuses: str) -> str:
    order = {"frequent": 2, "occasional": 1, "uncertain": 0}
    return min(statuses, key=lambda s: order.get(s, 0)) if statuses else "uncertain"


def derive_production(feats: dict) -> dict:
    prod: dict = {}

    def put(param, value, *keys, note=None):
        fs = [feats[k] for k in keys if k in feats]
        if not fs or value is None:
            return
        prod[param] = {"value": value, "status": _worst(*[f["status"] for f in fs]),
                       "n_videos": min(f["n"] for f in fs), "source": list(keys),
                       "confidence": round(float(np.mean([f.get("confidence", 0.5) for f in fs])), 2)}
        if note:
            prod[param]["note"] = note

    g = lambda k: feats[k]["median"] if k in feats and feats[k]["kind"] == "numeric" else None
    if g("shot_len_median"):
        put("editing.target_shot_seconds", round(float(np.clip(g("shot_len_median"), 0.6, 6.0)), 2), "shot_len_median")
    motion_keys = [f"motion_share_{m}" for m in MOTIONS if f"motion_share_{m}" in feats]
    if motion_keys:
        mix = {m: max(0.0, feats[f"motion_share_{m}"]["mean"]) for m in MOTIONS if f"motion_share_{m}" in feats}
        tot = sum(mix.values())
        if tot > 0:
            put("editing.motion_mix", {k: round(v / tot, 3) for k, v in mix.items()}, *motion_keys)
    if g("zoom_rate_median") and g("shot_len_median"):
        put("editing.motion_intensity", round(float(np.clip(g("zoom_rate_median") * g("shot_len_median"), 0.02, 0.3)), 3),
            "zoom_rate_median", "shot_len_median")
    if g("shake_share") is not None:
        put("editing.shake_amount", 0.006 if g("shake_share") > 0.3 else 0.0, "shake_share")
    tkeys = [k for k in feats if k.startswith("transition_share_")]
    if tkeys:
        mix: dict = {}
        for k in tkeys:
            t = TRANSITION_MAP.get(k.replace("transition_share_", ""))
            if t:
                mix[t] = mix.get(t, 0.0) + feats[k]["mean"]
        tot = sum(mix.values())
        if tot > 0:
            put("transitions.mix", {k: round(v / tot, 3) for k, v in mix.items()}, *tkeys)
    if g("caption_y") is not None:
        put("captions.position_y", round(float(np.clip(g("caption_y"), 0.25, 0.78)), 3), "caption_y")
    # max_words is an upper bound for chunking, so it follows the high end of the distribution
    if g("caption_words_p80") is not None:
        put("captions.max_words", int(np.clip(round(g("caption_words_p80")), 1, 6)), "caption_words_p80")
    elif g("caption_words") is not None:
        put("captions.max_words", int(np.clip(round(g("caption_words")), 1, 6)), "caption_words")
    if g("caption_caps_share") is not None:
        put("captions.uppercase", bool(g("caption_caps_share") > 0.6), "caption_caps_share")
    if g("caption_outline_frac") is not None and g("caption_outline_share") is not None:
        put("captions.outline_width", int(round(g("caption_outline_frac") * 1080)) if g("caption_outline_share") > 0.5 else 0,
            "caption_outline_frac", "caption_outline_share")
    def mean_hex(name_key: str, hex_key: str) -> str | None:
        """Average the hex values of the videos whose colour name matches the mode."""
        if name_key not in feats or hex_key not in feats:
            return None
        mode = feats[name_key]["mode"]
        hexes = [feats[hex_key]["values"][v] for v, n in feats[name_key]["values"].items()
                 if str(n) == mode and v in feats[hex_key]["values"]]
        if not hexes:
            return None
        rgb = np.mean([[int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)] for h in hexes], axis=0)
        return "#" + "".join(f"{int(round(c)):02X}" for c in rgb)

    if "caption_fill_color" in feats:
        hexv = "#FFFFFF" if feats["caption_fill_color"]["mode"] == "white" else mean_hex("caption_fill_color", "caption_fill_hex")
        if hexv:
            put("captions.primary_color", hexv, "caption_fill_color")
    # highlight style from how often a coloured word appears (measured consistently per caption)
    if g("caption_highlight_share") is not None:
        share = g("caption_highlight_share")
        moving = feats.get("caption_highlight_mode", {}).get("mode") == "active_word"
        mode = "none" if share < 0.08 else ("active_word" if share > 0.5 and moving else "emphasis")
        put("captions.highlight_mode", mode, "caption_highlight_share",
            note=f"{share:.0%} of reference captions contain a coloured word")
    elif "caption_highlight_mode" in feats:
        put("captions.highlight_mode", feats["caption_highlight_mode"]["mode"], "caption_highlight_mode")
    hl = mean_hex("caption_highlight_color", "caption_highlight_hex")
    if hl:
        put("captions.highlight_color", hl, "caption_highlight_color")
    if "caption_shadow" in feats:
        put("captions.shadow", 3 if feats["caption_shadow"]["mode"] == "True" else 0, "caption_shadow")
    if "caption_animation" in feats:
        put("captions.animation", ANIM_MAP.get(feats["caption_animation"]["mode"], "none"), "caption_animation")
    if g("caption_stroke_ratio") is not None and g("caption_char_aspect") is not None:
        font = None
        try:
            from ..production.subtitles import closest_font
            fam, ffile, _m = closest_font(g("caption_stroke_ratio"), g("caption_char_aspect"))
            font = (fam, ffile)
        except Exception as e:  # rendering unavailable: fall back to the class table
            _log.info("font calibration unavailable (%s); using class table", e)
            if "caption_weight_class" in feats and "caption_width_class" in feats:
                key = (feats["caption_weight_class"]["mode"], feats["caption_width_class"]["mode"])
                font = FONT_CHOICES.get(key) or FONT_CHOICES.get((key[0], "normal"))
        if font:
            note = "closest bundled font by measured weight/width - not an identification of the reference font"
            put("captions.font", font[0], "caption_stroke_ratio", "caption_char_aspect", note=note)
            put("captions.font_file", font[1], "caption_stroke_ratio", "caption_char_aspect", note=note)
    if g("caption_text_h") is not None:
        # size for the font that will actually be used: the suggested one only if it is applied
        from ..config import load_editing_defaults
        allow_occ = bool(load_settings().get("style_learning", {}).get("apply_occasional_params", False))
        ff = prod.get("captions.font_file")
        use_suggested = ff and (ff["status"] == "frequent" or (allow_occ and ff["status"] == "occasional"))
        font_file = ff["value"] if use_suggested else load_editing_defaults()["captions"].get("font_file", "Poppins-Black.ttf")
        upper = (g("caption_caps_share") or 0) > 0.5
        size = font_size_for_height(font_file, g("caption_text_h"), upper)
        if size:
            put("captions.font_size", size, "caption_text_h", "caption_caps_share",
                note=f"letter height matched for {font_file} ({'upper' if upper else 'lower'} case)")
    if g("saturation") is not None:
        put("color.target_saturation", round(g("saturation"), 3), "saturation")
    if g("contrast") is not None:
        put("color.target_contrast", round(g("contrast"), 3), "contrast")
    if "vignette_likely" in feats:
        put("color.vignette", 0.35 if feats["vignette_likely"]["mode"] == "True" else 0.0, "vignette_likely")
    if g("lufs") is not None:
        put("audio.target_lufs", round(float(np.clip(g("lufs"), -18, -9)), 1), "lufs")
    if "music_likely" in feats:
        put("audio.music_enabled", feats["music_likely"]["mode"] == "True", "music_likely")
    if g("bed_below_speech_db") is not None:
        put("audio.music_db_below_voice", round(float(np.clip(g("bed_below_speech_db"), 6, 32)), 1), "bed_below_speech_db")
    if g("cuts_with_sfx_share") is not None:
        put("audio.sfx_on_cuts_prob", round(float(np.clip(g("cuts_with_sfx_share"), 0, 1)), 2), "cuts_with_sfx_share")
    if g("wpm") is not None:
        put("voice.target_wpm", int(round(np.clip(g("wpm"), 110, 280))), "wpm")
    if g("pause_median") is not None:
        put("voice.sentence_pause_s", round(float(np.clip(g("pause_median"), 0.08, 0.8)), 2), "pause_median")
    if g("hook_duration") is not None:
        put("story.hook_max_seconds", round(float(np.clip(g("hook_duration") * 1.2, 1.5, 8)), 1), "hook_duration")
    if g("duration") is not None:
        put("story.target_duration_s", int(round(np.clip(g("duration"), 10, 180))), "duration")
    return prod


def font_size_for_height(font_file: str, text_h_frac: float, upper: bool = True) -> int | None:
    """ASS font size whose rendered letter height matches the measured fraction.
    Lower-case captions are measured by their x-height, so calibrate with the same case."""
    try:
        from ..production.subtitles import font_height_ratio
        ratio = font_height_ratio(font_file, upper)
    except Exception as e:  # rendering unavailable - use a typical value
        _log.debug("font calibration unavailable: %s", e)
        ratio = 0.5
    if not ratio:
        return None
    return int(round(np.clip(text_h_frac * 1920 / ratio, 48, 160)))


# ------------------------------------------------------------------------------------------------
# comparison, rebuild, markdown
# ------------------------------------------------------------------------------------------------
def compare_to_previous(report: dict) -> dict:
    vid = report["video"]["id"]
    prev = [r for r in load_reports() if r["video"]["id"] != vid]
    out = {"n_previous": len(prev), "consistent": [], "different": []}
    if not prev:
        return out
    for key, (section, label, fmt, kind, tol) in NUMERIC.items():
        if key not in report["metrics"]:
            continue
        vals = [r["metrics"][key] for r in prev if key in r["metrics"]]
        if not vals:
            continue
        x = report["metrics"][key]
        mu = float(np.mean(vals))
        scale = max(float(np.std(vals)) if len(vals) > 1 else 0.0, _tol(kind, tol, mu))
        z = (x - mu) / scale if scale > 0 else 0.0
        try:
            xs, ms = fmt.format(x), fmt.format(mu)
        except (ValueError, TypeError):
            xs, ms = str(x), str(mu)
        if abs(z) <= 1.0:
            out["consistent"].append(label)
        elif abs(z) > 2.0:
            out["different"].append(f"{label}: {xs} vs typical {ms} ({section})")
    for key, (section, label) in CATEGORICAL.items():
        x = report.get("categorical", {}).get(key)
        vals = [str(r.get("categorical", {}).get(key)) for r in prev if r.get("categorical", {}).get(key) is not None]
        if x is None or not vals:
            continue
        mode = max(set(vals), key=vals.count)
        if str(x) == mode:
            out["consistent"].append(label)
        else:
            out["different"].append(f"{label}: {x} vs usual {mode} ({section})")
    return out


def _summary(feats: dict, n: int) -> list[str]:
    """Plain-language identity statement from frequent features only."""
    fr = {k: f for k, f in feats.items() if f["status"] == "frequent"}
    lines = []
    if n < _cfg()["min_frequent"]:
        lines.append(f"Only {n} reference video(s) analysed - at least {_cfg()['min_frequent']} are needed before any "
                     "characteristic is treated as a recurring rule. Everything below is provisional.")
    if "shot_len_median" in fr:
        lines.append(f"Fast vertical edit with ~{fr['shot_len_median']['median']:.1f}s shots "
                     f"({fr.get('cuts_per_min', {}).get('median', 0):.0f} cuts/min).")
    if "caption_y" in fr:
        lines.append(f"Burned-in captions at {fr['caption_y']['median']:.0%} of frame height"
                     + (f", ~{fr['caption_words']['median']:.0f} words at a time" if "caption_words" in fr else "") + ".")
    if "wpm" in fr:
        lines.append(f"Narration around {fr['wpm']['median']:.0f} words per minute.")
    if "dominant_motion" in fr:
        lines.append(f"Most shots use {fr['dominant_motion']['mode'].replace('_', ' ')} movement.")
    if len(lines) <= 1 and n >= _cfg()["min_frequent"]:
        lines.append("No strongly recurring characteristics yet - the references vary a lot.")
    return lines


def to_markdown(profile: dict) -> str:
    feats = profile["features"]
    md = ["# RickClips style profile", "",
          f"_Version {profile['version']} - updated {profile['updated_at']} - built from {profile['n_videos']} reference video(s)._", "",
          "Status meanings: **frequently observed** = consistent in at least "
          f"{_cfg()['min_frequent']} videos; **occasionally observed** = present in some videos or variable; "
          "**uncertain** = too little or too weak evidence (never used as a production rule).", ""]
    for sec in SECTIONS:
        md += [f"## {sec}", ""]
        if sec == "Overall editing identity":
            md += [f"- {l}" for l in _summary(feats, profile["n_videos"])] + [""]
            continue
        items = {k: f for k, f in feats.items() if f["section"] == sec}
        if not items:
            md += ["_No measurements yet._", ""]
            continue
        for status, title in (("frequent", "Frequently observed"), ("occasional", "Occasionally observed"),
                              ("uncertain", "Uncertain")):
            sel = [describe(k, f) for k, f in items.items() if f["status"] == status]
            if sel:
                md += [f"**{title}**", ""] + [f"- {s}" for s in sel] + [""]
        notes = [n for n in profile.get("reviewed_notes", []) if n["section"] == sec]
        if notes:
            md += ["**Reviewed observations (per video, not yet rules)**", ""]
            md += [f"- {n['description']} ({n['confidence']}, {n['video']})" for n in notes[:12]] + [""]
    md += ["## Differences between references", ""]
    md += ([f"- {d}" for d in profile["differences"]] or ["_None significant._"]) + [""]
    md += ["## Production parameters derived from the profile", "",
           "Only **frequent** parameters are applied automatically (see `style_learning` in config/settings.json).", "",
           "| Parameter | Value | Status | Videos | Source |", "|---|---|---|---|---|"]
    for k, p in sorted(profile["production"].items()):
        md.append(f"| `{k}` | {p['value']} | {p['status']} | {p['n_videos']} | {', '.join(p['source'])} |")
    md.append("")
    prefs = read_json(paths.preferences_file(), {}) or {}
    md += ["## Feedback-driven preferences", ""]
    if prefs.get("params"):
        for k, v in prefs["params"].items():
            md.append(f"- `{k}`: {v.get('op')} {v.get('value')} (from {v.get('evidence', 0)} feedback reports)")
    else:
        md.append("_No repeated feedback applied yet._")
    md += ["", "## Reference videos", ""]
    md += [f"- `{v}`" for v in profile["videos"]] + [""]
    return "\n".join(md)


def _reviewed_notes(reports: list[dict]) -> list[dict]:
    sec_map = {"subtitles": "Subtitle design", "overlays": "Visual composition", "composition": "Visual composition",
               "footage": "Visual composition", "color": "Visual composition", "transitions": "Transitions",
               "motion": "Camera movement", "camera": "Camera movement", "story": "Storytelling structure",
               "hook": "Hook patterns", "ending": "Ending patterns", "audio": "Sound design", "music": "Music characteristics",
               "pacing": "Narration pacing", "editing": "Scene duration patterns"}
    out = []
    for r in reports:
        for ob in r["observations"]:
            if ob["evidence"].startswith(("reviewer notes", "claude-vision")):
                out.append({"section": sec_map.get(ob["category"], "Visual composition"), "description": ob["description"],
                            "confidence": ob["confidence"], "video": r["video"]["id"]})
    return out


def rebuild(event: str = "rebuild", videos: list[str] | None = None, note: str | None = None, quiet: bool = False) -> dict:
    reports = load_reports()
    old = read_json(paths.style_profile_json(), None)
    feats = aggregate(reports)
    prod = derive_production(feats)
    diffs = [f"{f['label']}: {describe(k, f)}" for k, f in feats.items()
             if f["kind"] == "numeric" and f["n"] > 1 and not f["consistent"]]
    profile = {
        "version": (old or {}).get("version", 0),
        "updated_at": now_iso(),
        "n_videos": len(reports),
        "videos": [r["video"]["id"] for r in reports],
        "features": feats,
        "production": prod,
        "differences": diffs,
        "reviewed_notes": _reviewed_notes(reports),
    }
    content_hash = text_hash({k: {kk: vv for kk, vv in v.items() if kk != "values"} for k, v in feats.items()}, prod, profile["videos"])
    changed = not old or old.get("content_hash") != content_hash
    changes = _changes(old, profile) if old else ["initial profile"]
    if changed:
        profile["version"] = (old or {}).get("version", 0) + 1
    profile["content_hash"] = content_hash
    write_json(paths.style_profile_json(), profile)
    md = to_markdown(profile)
    write_text(paths.style_profile_md(), md)
    if changed:
        vdir = paths.profile_history_dir()
        write_json(vdir / f"style-profile-v{profile['version']:03d}.json", profile)
        write_text(vdir / f"style-profile-v{profile['version']:03d}.md", md)
    hist = read_json(paths.training_history(), {"events": []})
    hist["events"].append({"time": now_iso(), "event": event, "videos": videos or [], "n_videos": len(reports),
                           "profile_version": profile["version"], "profile_changed": changed,
                           "changes": changes[:60], "note": note})
    write_json(paths.training_history(), hist)
    if not quiet:
        n_freq = sum(1 for f in feats.values() if f["status"] == "frequent")
        n_occ = sum(1 for f in feats.values() if f["status"] == "occasional")
        say(f"Style profile v{profile['version']} ({'updated' if changed else 'unchanged'}): {len(reports)} video(s), "
            f"{n_freq} frequent / {n_occ} occasional / {len(feats) - n_freq - n_occ} uncertain characteristics",
            level="ok")
        for c in changes[:10]:
            say(f"  {c}")
    return profile


def _changes(old: dict, new: dict) -> list[str]:
    out = []
    of, nf = old.get("features", {}), new["features"]
    for k, f in nf.items():
        if k not in of:
            out.append(f"new: {describe(k, f)} [{f['status']}]")
        elif of[k].get("status") != f["status"]:
            out.append(f"{f['label']}: {of[k].get('status')} -> {f['status']}")
    op, np_ = old.get("production", {}), new["production"]
    for k, p in np_.items():
        if k not in op:
            out.append(f"production param {k} = {p['value']} [{p['status']}]")
        elif op[k]["value"] != p["value"] or op[k]["status"] != p["status"]:
            out.append(f"production param {k}: {op[k]['value']} -> {p['value']} [{p['status']}]")
    if old.get("n_videos") != new["n_videos"]:
        out.insert(0, f"reference videos: {old.get('n_videos')} -> {new['n_videos']}")
    return out


def status_summary() -> dict:
    prof = read_json(paths.style_profile_json(), None)
    hist = read_json(paths.training_history(), {"events": []})
    return {"profile": prof, "history": hist}
