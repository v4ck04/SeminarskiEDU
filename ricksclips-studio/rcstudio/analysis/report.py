"""Analysis report: observations (timestamp, description, confidence, evidence),
flat metrics for the style learner, and a human-readable Markdown report."""
from __future__ import annotations

import numpy as np

from ..utils import fmt_time


def conf_label(c: float) -> str:
    return "high" if c >= 0.75 else "medium" if c >= 0.5 else "low"


class Obs:
    def __init__(self):
        self.items: list[dict] = []

    def add(self, category: str, feature: str, description: str, confidence: float, evidence: str,
            timestamp=None, value=None) -> None:
        self.items.append({
            "category": category, "feature": feature, "description": description,
            "timestamp": timestamp, "value": value,
            "confidence": conf_label(confidence), "confidence_score": round(float(confidence), 2),
            "evidence": evidence,
        })


def _r(x, n=3):
    return None if x is None else round(float(x), n)


def build(vid: dict, info: dict, scenes: dict, motions: list[dict], motion_sum: dict, color: dict,
          caps: dict, audio: dict, transcript: dict | None, story: dict, sheets: dict,
          vision: dict | None, notes: dict | None) -> dict:
    o = Obs()
    v = info["video"]
    dur = info["duration"]
    shots = scenes["shots"]
    trans = scenes["transitions"]
    metrics: dict = {}
    mconf: dict = {}
    cats: dict = {}

    def m(key, val, conf):
        if val is None:
            return
        metrics[key] = round(float(val), 4)
        mconf[key] = round(float(conf), 2)

    # --- metadata ---------------------------------------------------------------------
    aspect = v["display_width"] / max(1, v["display_height"])
    o.add("video", "metadata", f"{fmt_time(dur)} long, {v['display_width']}x{v['display_height']} "
          f"({'9:16 vertical' if abs(aspect - 9 / 16) < 0.02 else f'aspect {aspect:.3f}'}), {v['fps']} fps, {v['codec']}",
          1.0, "ffprobe", value={"duration": dur, "width": v["display_width"], "height": v["display_height"], "fps": v["fps"]})
    m("duration", dur, 1.0)
    m("fps", v["fps"], 1.0)
    m("aspect", aspect, 1.0)

    # --- editing rhythm -------------------------------------------------------------------
    lens = np.array([s["duration"] for s in shots]) if shots else np.array([dur])
    cuts = [t for t in trans if t["type"] not in ("fade_in_from_black", "starts_on_black", "fade_out_to_black", "ends_on_black")]
    cpm = len(cuts) / max(1e-6, dur) * 60
    det_conf = 0.8 if len(shots) >= 3 else 0.6
    o.add("editing", "shot_length", f"{len(shots)} shots; median {np.median(lens):.2f}s, mean {lens.mean():.2f}s "
          f"(min {lens.min():.2f}s, max {lens.max():.2f}s); {cpm:.1f} cuts/min", det_conf, "opencv:shot-detection",
          value={"median": _r(np.median(lens)), "mean": _r(lens.mean()), "cuts_per_min": _r(cpm, 1)})
    m("shot_count", len(shots), det_conf)
    m("shot_len_median", np.median(lens), det_conf)
    m("shot_len_mean", lens.mean(), det_conf)
    m("cuts_per_min", cpm, det_conf)
    cv = float(lens.std() / lens.mean()) if lens.mean() > 0 else 0.0
    m("shot_len_cv", cv, det_conf * 0.9)
    o.add("editing", "rhythm", ("regular rhythm (similar shot lengths)" if cv < 0.4 else
                                "varied rhythm (mix of quick and longer shots)") + f", CV {cv:.2f}",
          det_conf * 0.9, "opencv:shot-detection")
    if len(shots) >= 4:
        i_min, i_max = int(np.argmin(lens)), int(np.argmax(lens))
        o.add("editing", "extremes", f"shortest shot {lens[i_min]:.2f}s", det_conf, "opencv:shot-detection",
              timestamp=[shots[i_min]["start"], shots[i_min]["end"]])
        o.add("editing", "extremes", f"longest shot {lens[i_max]:.2f}s", det_conf, "opencv:shot-detection",
              timestamp=[shots[i_max]["start"], shots[i_max]["end"]])
    hook_cuts = [c for c in cuts if c["time"] < 3.0]
    hook_rate = len(hook_cuts) / min(3.0, dur)
    rest_rate = (len(cuts) - len(hook_cuts)) / max(1e-6, dur - 3.0) if dur > 3.5 else None
    m("hook_cuts_per_s", hook_rate, det_conf)
    if rest_rate is not None:
        m("body_cuts_per_s", rest_rate, det_conf)
        o.add("editing", "hook_pacing", f"first 3 s: {hook_rate:.2f} cuts/s vs {rest_rate:.2f} cuts/s afterwards",
              det_conf * 0.9, "opencv:shot-detection", timestamp=[0, 3])
    # second half vs first half shot lengths (acceleration)
    if len(shots) >= 6:
        half = dur / 2
        a = [s["duration"] for s in shots if s["end"] <= half]
        b = [s["duration"] for s in shots if s["start"] >= half]
        if a and b:
            ratio = float(np.median(b) / np.median(a))
            m("pace_change_ratio", ratio, det_conf * 0.8)
            if ratio < 0.8 or ratio > 1.25:
                o.add("editing", "pace_change", f"shots in the second half are {'shorter' if ratio < 1 else 'longer'} "
                      f"(median ratio {ratio:.2f})", det_conf * 0.8, "opencv:shot-detection")

    # --- transitions ----------------------------------------------------------------------------
    tcount: dict = {}
    for t in cuts:
        tcount[t["type"]] = tcount.get(t["type"], 0) + 1
        if t["type"] != "cut":
            o.add("transitions", t["type"], f"{t['type'].replace('_', ' ')} transition"
                  + (f" (~{t['duration']:.2f}s)" if t.get("duration") else ""), t["confidence"], t["evidence"],
                  timestamp=t["time"])
    for t in trans:
        if t["type"] in ("fade_in_from_black", "fade_out_to_black", "starts_on_black", "ends_on_black"):
            o.add("transitions", t["type"], t["type"].replace("_", " "), t["confidence"], t["evidence"], timestamp=t["time"])
    total_b = max(1, len(cuts))
    shares = {k: tcount.get(k, 0) / total_b for k in ("cut", "dissolve", "flash", "dip_black", "whip_or_blur",
                                                       "zoom_transition", "cut_through_black")}
    for k, sv in shares.items():
        m(f"transition_share_{k}", sv, 0.7 if k == "cut" else 0.5)
    if cuts:
        o.add("transitions", "mix", "transition mix: " + ", ".join(f"{k} {v / total_b:.0%}" for k, v in sorted(tcount.items(), key=lambda x: -x[1])),
              0.7, "opencv:transition-detection", value={k: round(v / total_b, 3) for k, v in tcount.items()})
    cats["transitions_present"] = sorted(k for k, v in tcount.items() if v > 0)

    # --- motion -------------------------------------------------------------------------------------
    dist = motion_sum.get("distribution", {})
    if dist:
        o.add("camera", "motion_mix", "camera/zoom movement per shot: " + ", ".join(f"{k} {v:.0%}" for k, v in sorted(dist.items(), key=lambda x: -x[1])),
              0.65, "opencv:optical-flow", value=dist)
        for k in ("zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "static"):
            m(f"motion_share_{k}", dist.get(k, 0.0), 0.6)
        cats["dominant_motion"] = max(dist, key=dist.get)
        m("moving_shot_share", motion_sum.get("moving_share"), 0.6)
        m("zoom_rate_median", motion_sum.get("median_zoom_rate_per_s"), 0.55)
        m("shake_share", motion_sum.get("shake_share"), 0.45)
        m("animated_still_share", motion_sum.get("animated_still_share"), 0.45)
        if motion_sum.get("animated_still_share", 0) and motion_sum["animated_still_share"] > 0.3:
            o.add("camera", "ken_burns", f"{motion_sum['animated_still_share']:.0%} of shots look like still images "
                  "animated with digital zoom/pan (motion-compensated residual ~0)", 0.5, "opencv:optical-flow residual")
    for mo in motions:
        if mo["type"] in ("zoom_in", "zoom_out") and abs(mo.get("zoom_rate_per_s", 0)) > 0.06:
            o.add("camera", "strong_zoom", f"strong {mo['type'].replace('_', ' ')} ({mo['zoom_rate_per_s'] * 100:.0f}%/s)",
                  mo["confidence"], "opencv:optical-flow", timestamp=[mo["start"], mo["end"]])
        if mo.get("shake"):
            o.add("camera", "shake", "handheld feel / camera shake", 0.45, "opencv:optical-flow jitter",
                  timestamp=[mo["start"], mo["end"]])
        for h in mo.get("speed_hints", []):
            o.add("editing", "speed_change", h, 0.3, "opencv:optical-flow/frame-duplicates", timestamp=[mo["start"], mo["end"]])

    # --- colour & composition -------------------------------------------------------------------
    g = color.get("grade", {})
    if g:
        o.add("color", "grade", f"brightness L {g['brightness_L']:.2f}, contrast {g['contrast_L_std']:.2f}, "
              f"saturation {g['saturation']:.2f}, {g['temperature']} temperature (b* {g['warmth_b']:+.1f})",
              0.7, "opencv:Lab/HSV stats", value=g)
        m("brightness", g["brightness_L"], 0.7)
        m("contrast", g["contrast_L_std"], 0.7)
        m("saturation", g["saturation"], 0.7)
        m("colorfulness", g["colorfulness"], 0.65)
        m("warmth", g["warmth_b"], 0.6)
        m("vignette_share", g["vignette_share"], 0.4)
        cats["temperature"] = g["temperature"]
        cats["teal_orange"] = g["teal_orange"]
        cats["vignette_likely"] = g["vignette_likely"]
        if g["teal_orange"]:
            o.add("color", "teal_orange", "cool shadows with warm highlights (teal/orange-style grade)", 0.45, "opencv:Lab split-tone")
        if g["vignette_likely"]:
            o.add("color", "vignette", "corners consistently darker than centre (vignette likely)", 0.45, "opencv:corner/centre luminance")
        if g.get("shot_brightness_std") is not None:
            cons = g["shot_brightness_std"] < 0.06 and (g.get("shot_saturation_std") or 0) < 0.06
            o.add("color", "consistency", "consistent look across shots" if cons else "look varies between shots (mixed sources / no unified grade)",
                  0.5, "opencv:per-shot Lab/HSV")
            m("shot_brightness_std", g["shot_brightness_std"], 0.5)
    comp = color.get("composition", {})
    if comp:
        o.add("composition", "layout", f"dominant layout: {comp['dominant_layout'].replace('_', ' ')} "
              f"({', '.join(f'{k} {v:.0%}' for k, v in comp['layout_distribution'].items())})",
              0.6, "opencv:band sharpness/letterbox", value=comp["layout_distribution"])
        cats["layout"] = comp["dominant_layout"]
        m("face_frame_share", comp["face_frame_share"], 0.55)
        if comp["face_frame_share"] is None:
            o.add("composition", "faces", "face statistics unavailable (no face detector in this OpenCV build)",
                  1.0, "pipeline")
        elif comp["face_frame_share"] > 0.25:
            o.add("composition", "faces", f"faces visible in {comp['face_frame_share']:.0%} of sampled frames"
                  + (f", typically at y={comp['face_center_y']:.2f}" if comp.get("face_center_y") else ""),
                  0.55, "opencv:face detector (YuNet/Haar)")
        if comp.get("edge_center_y") is not None:
            o.add("composition", "visual_weight", f"visual detail centred at x={comp['edge_center_x']:.2f}, y={comp['edge_center_y']:.2f}",
                  0.4, "opencv:edge centre of mass")
    if color.get("palette"):
        o.add("color", "palette", "dominant colours: " + ", ".join(f"{p['hex']} ({p['share']:.0%})" for p in color["palette"]),
              0.6, "opencv:k-means", value=color["palette"])

    # --- captions ------------------------------------------------------------------------------------
    if caps.get("present"):
        cconf = min(0.85, 0.4 + 0.02 * caps["count"])
        o.add("subtitles", "presence", f"burned-in captions cover {caps['coverage']:.0%} of the video "
              f"({caps['count']} caption changes, {caps['per_minute']}/min, median {caps['duration_median']:.2f}s each)",
              cconf, "opencv:caption-detector")
        m("caption_coverage", caps["coverage"], cconf)
        m("caption_duration", caps["duration_median"], cconf)
        m("caption_per_min", caps["per_minute"], cconf)
        o.add("subtitles", "position", f"captions at y={caps['position_y']:.2f} of frame height ({caps['position_zone'].replace('_', ' ')})",
              cconf, "opencv:caption-detector", value=caps["zone_distribution"])
        m("caption_y", caps["position_y"], cconf)
        cats["caption_zone"] = caps["position_zone"]
        o.add("subtitles", "size", f"letter height {caps['text_height_frac'] * 100:.1f}% of frame height "
              f"(~{caps['text_height_frac'] * 1920:.0f}px at 1080x1920)", cconf * 0.9, "opencv:caption-detector")
        m("caption_text_h", caps["text_height_frac"], cconf * 0.9)
        wpc = caps.get("words_per_caption_spoken") or caps.get("words_per_caption_visual")
        src = "transcript words per caption" if caps.get("words_per_caption_spoken") else "word-gap analysis"
        o.add("subtitles", "words_per_caption", f"~{wpc:.0f} words per caption, {caps['lines_median']:.0f} line(s)",
              cconf * (0.95 if caps.get("words_per_caption_spoken") else 0.7), f"opencv:caption-detector + {src}")
        m("caption_words", wpc, cconf * (0.95 if caps.get("words_per_caption_spoken") else 0.7))
        m("caption_lines", caps["lines_median"], cconf * 0.8)
        p80 = caps.get("words_per_caption_p80") or float(np.percentile(
            [sg["words_est"] for sg in caps["segments"]], 80)) if caps.get("segments") else None
        if p80:
            m("caption_words_p80", p80, cconf * (0.95 if caps.get("words_per_caption_p80") else 0.7))
        o.add("subtitles", "color", f"{caps['fill_color']} text ({caps['fill_hex']})", cconf, "opencv:caption-detector")
        cats["caption_fill_color"] = caps["fill_color"]
        cats["caption_fill_hex"] = caps["fill_hex"]
        m("caption_highlight_share", caps["highlight_share"], cconf)
        if caps["highlight_share"] > 0.15:
            o.add("subtitles", "highlight", f"{caps['highlight_share']:.0%} of captions highlight words in {caps['highlight_color']} ({caps['highlight_hex']})"
                  + (", highlight moves word to word (karaoke style)" if caps["moving_highlight_share"] > 0.2 else ""),
                  cconf * 0.85, "opencv:caption colour clusters")
            cats["caption_highlight_color"] = caps["highlight_color"]
            cats["caption_highlight_hex"] = caps["highlight_hex"]
            cats["caption_highlight_mode"] = "active_word" if caps["moving_highlight_share"] > 0.2 else "emphasis"
        else:
            cats["caption_highlight_mode"] = "none"
        m("caption_outline_share", caps["outline_share"], cconf)
        m("caption_outline_frac", caps.get("outline_frac_of_width"), cconf * 0.7)
        if caps["outline_share"] > 0.5:
            o.add("subtitles", "outline", f"dark outline on {caps['outline_share']:.0%} of captions "
                  f"(~{(caps.get('outline_frac_of_width') or 0) * 1080:.0f}px at 1080 wide)", cconf * 0.8, "opencv:outline rings")
        if caps.get("boxed_share", 0) > 0.5:
            o.add("subtitles", "box", "captions sit on a dark box/background", cconf * 0.7, "opencv:caption background")
        cats["caption_boxed"] = caps.get("boxed_share", 0) > 0.5
        if caps.get("shadow"):
            o.add("subtitles", "shadow", f"drop shadow offset {caps['shadow']}", 0.4, "opencv:offset darkness")
        cats["caption_shadow"] = bool(caps.get("shadow"))
        if caps.get("caps_likely_share") is not None:
            m("caption_caps_share", caps["caps_likely_share"], 0.5)
            o.add("subtitles", "case", "ALL CAPS likely" if caps["caps_likely_share"] > 0.6 else
                  "mixed/lower case likely" if caps["caps_likely_share"] < 0.3 else "case varies",
                  0.5, "opencv:letter top alignment")
        if caps.get("weight_class"):
            o.add("subtitles", "font_weight", f"{caps['weight_class']} weight, {caps['width_class']} letter width "
                  f"(stroke/height {caps['stroke_ratio']:.2f}, width/height {caps['char_aspect']:.2f}). "
                  "Exact font family not identifiable from pixels.", 0.45, "opencv:stroke width")
            m("caption_stroke_ratio", caps["stroke_ratio"], 0.45)
            m("caption_char_aspect", caps["char_aspect"], 0.45)
            cats["caption_weight_class"] = caps["weight_class"]
            cats["caption_width_class"] = caps["width_class"]
        anim = caps.get("animation_distribution", {})
        if anim:
            main = max(anim, key=anim.get)
            o.add("subtitles", "animation", "caption onset animation: " + ", ".join(f"{k.replace('_', ' ')} {v:.0%}" for k, v in anim.items()),
                  0.35, "opencv:caption onset tracking (10 fps)", value=anim)
            cats["caption_animation"] = main if anim[main] >= 0.3 else "none"
        else:
            cats["caption_animation"] = "none"
        if caps.get("caption_word_sync") is not None:
            o.add("subtitles", "timing", f"{caps['caption_word_sync']:.0%} of captions contain spoken words at the same time "
                  "(captions follow the narration)", 0.6, "caption-detector + transcript")
        for ov in caps.get("overlay_texts", [])[:5]:
            o.add("overlays", "persistent_text", f"persistent on-screen text at y={ov['cy']:.2f}", 0.45,
                  "opencv:caption-detector (static track)", timestamp=[ov["start"], ov["end"]])
    else:
        o.add("subtitles", "presence", "no burned-in captions detected", 0.5, "opencv:caption-detector")
        m("caption_coverage", 0.0, 0.5)

    # --- audio ------------------------------------------------------------------------------------
    if audio.get("present"):
        lo = audio.get("loudness", {})
        if "integrated_lufs" in lo:
            o.add("audio", "loudness", f"integrated {lo['integrated_lufs']:.1f} LUFS, true peak {lo['true_peak_db']:.1f} dBTP, LRA {lo['lra']:.1f} LU",
                  0.95, "ffmpeg:loudnorm (EBU R128)")
            m("lufs", lo["integrated_lufs"], 0.95)
            m("true_peak", lo["true_peak_db"], 0.95)
        sp = audio["speech"]
        o.add("audio", "speech", f"speech {sp['speech_ratio']:.0%} of the runtime, first words at {sp['first_speech']}s; "
              f"{sp['pause_count']} pauses (median {sp['pause_median']}s)", sp["confidence"], audio["speech_source"])
        m("speech_ratio", sp["speech_ratio"], sp["confidence"])
        m("pause_median", sp.get("pause_median"), sp["confidence"])
        m("pauses_per_min", sp.get("pauses_per_minute"), sp["confidence"])
        if sp.get("words_per_minute"):
            o.add("audio", "pace", f"narration pace {sp['words_per_minute']:.0f} words/min while speaking", 0.85, "transcript")
            m("wpm", sp["words_per_minute"], 0.85)
        elif sp.get("words_per_minute_est"):
            o.add("audio", "pace", f"estimated pace ~{sp['words_per_minute_est']:.0f} words/min (syllable-rate estimate, no transcript)",
                  0.3, "audio:speech envelope peaks")
            m("wpm", sp["words_per_minute_est"], 0.3)
        bg = audio.get("background", {})
        if "below_speech_db" in bg:
            desc = (f"background bed ~{bg['below_speech_db']:.0f} dB below speech in pauses, "
                    + ("tonal (music likely)" if bg.get("tonal") else "noise-like (room tone/noise)")) if bg.get("audible_bed") \
                else "near-silence in speech pauses (no continuous music bed, or music ducked out)"
            o.add("audio", "music", desc, bg.get("confidence", 0.4), "audio:pause-gap level/flatness")
            if bg.get("audible_bed"):
                m("bed_below_speech_db", bg["below_speech_db"], bg.get("confidence", 0.4))
            cats["music_likely"] = bool(bg.get("music_likely"))
        sfx = audio.get("sfx", {})
        if sfx:
            m("sfx_per_min", sfx["per_minute"], 0.35)
            m("cuts_with_sfx_share", sfx.get("cuts_with_sfx_share"), 0.35)
            if sfx["count"]:
                o.add("audio", "sfx", f"{sfx['count']} effect-like events ({sfx['per_minute']}/min): "
                      + ", ".join(f"{k} x{v}" for k, v in sfx["type_counts"].items())
                      + (f"; {sfx['cuts_with_sfx_share']:.0%} of cuts have an effect within 150 ms" if sfx.get("cuts_with_sfx_share") is not None else ""),
                      0.35, "audio:sub-band/high-band onset heuristics")
                for e in sfx["events"][:25]:
                    o.add("audio", "sfx_event", e["type"] + (" (at a cut)" if e.get("near_cut") else ""), e["confidence"],
                          "audio:onset heuristics", timestamp=e["time"])
        env = audio.get("envelope", {})
        if env:
            o.add("audio", "envelope", ("fades in" if env["fade_in"] else "starts immediately") + ", " +
                  ("fades out" if env["fade_out"] else "ends abruptly" if env["abrupt_end"] else "ends quietly"),
                  0.6, "audio:start/end level")
    else:
        o.add("audio", "presence", "no audio stream", 1.0, "ffprobe")

    # --- story -------------------------------------------------------------------------------------
    if story.get("available"):
        hk = story["hook"]
        o.add("story", "hook", f"hook ({hk['duration']:.1f}s, {hk['words']} words): \"{hk['text']}\" - "
              + (", ".join(hk["features"]) or "plain statement"), 0.7, "transcript + text rules", timestamp=[hk["start"], hk["end"]])
        m("hook_duration", hk["duration"], 0.7)
        m("hook_words", hk["words"], 0.7)
        m("time_to_first_word", hk["time_to_first_word"], 0.8)
        cats["hook_features"] = hk["features"]
        en = story["ending"]
        o.add("story", "ending", f"ending: \"{en['text']}\" - {', '.join(en['types'])}", 0.55, "transcript + text rules")
        cats["ending_types"] = en["types"]
        cats["ending_cta"] = "call to action" in en["types"]
        m("words_per_sentence", story["words_per_sentence"], 0.7)
        m("numbers_per_10s", story["numbers_per_10s"], 0.6)
        prog = story["progression"]
        o.add("story", "progression", "pace by thirds (words/s | cuts/s): " + " -> ".join(f"{p['words_per_s']}|{p['cuts_per_s']}" for p in prog),
              0.55, "transcript + shot detection")
        ca = story["cut_alignment"]
        if ca["word_boundary_share"] is not None:
            o.add("editing", "cut_timing", f"{ca['word_boundary_share']:.0%} of cuts land on word boundaries, "
                  f"{ca['sentence_boundary_share']:.0%} on sentence boundaries; {ca['cuts_per_sentence']:.1f} cuts per sentence",
                  0.6, "transcript + shot detection")
            m("cut_word_alignment", ca["word_boundary_share"], 0.6)
            m("cut_sentence_alignment", ca["sentence_boundary_share"], 0.6)
            m("cuts_per_sentence", ca["cuts_per_sentence"], 0.6)
    else:
        o.add("story", "transcript", story.get("reason", "no transcript"), 1.0, "pipeline")

    # --- visual AI / reviewer notes --------------------------------------------------------------------
    for src, data in (("claude-vision (contact sheets)", vision), ("reviewer notes", notes)):
        if not data:
            continue
        for ob in data.get("observations", []):
            cmap = {"low": 0.35, "medium": 0.6, "high": 0.8}
            o.add(ob.get("category", "other"), ob.get("feature", "review"), ob["description"],
                  cmap.get(ob.get("confidence", "low"), 0.35), f"{src}: {ob.get('evidence', '')}".strip(),
                  timestamp=ob.get("timestamp"))
        for k, val in (data.get("categorical") or {}).items():
            cats[k] = val

    return {
        "video": vid,
        "metadata": info,
        "shots": shots,
        "transitions": trans,
        "motion": {"shots": motions, "summary": motion_sum},
        "color": color,
        "captions": caps,
        "audio": audio,
        # full text stays in <id>.transcript.json (git-ignored); the report keeps only counts
        "transcript": {"available": bool(transcript), "provider": (transcript or {}).get("provider"),
                       "words": len((transcript or {}).get("words", [])), "language": (transcript or {}).get("language")},
        # sentence-by-sentence text stays in the git-ignored transcript; keep only structure here
        "story": {k: v for k, v in story.items() if k != "sentences"},
        "frames": sheets,
        "vision": vision,
        "metrics": metrics,
        "metrics_confidence": mconf,
        "categorical": cats,
        "observations": o.items,
    }


def to_markdown(r: dict, comparison: dict | None = None) -> str:
    v = r["video"]
    md = [f"# Reference analysis: {v['file']}", "",
          f"- **Video id:** `{v['id']}`  ",
          f"- **Analyzed:** {v['analyzed_at']} (analyzer {v['analyzer_version']})  ",
          f"- **Transcript:** {r['transcript']['provider'] or 'not available'}  ",
          f"- **Contact sheets:** `training/extracted_frames/{v['id']}/`", ""]
    md += ["## Key metrics", "", "| Metric | Value | Confidence |", "|---|---|---|"]
    for k, val in r["metrics"].items():
        md.append(f"| {k} | {val} | {r['metrics_confidence'].get(k, '')} |")
    md += ["", "## Observations", "",
           "Each line: timestamp - description - confidence - evidence source.", ""]
    by_cat: dict = {}
    for ob in r["observations"]:
        by_cat.setdefault(ob["category"], []).append(ob)
    for cat, items in by_cat.items():
        md += [f"### {cat.capitalize()}", ""]
        for ob in items:
            ts = ob["timestamp"]
            if isinstance(ts, list):
                ts_s = f"{fmt_time(ts[0])}-{fmt_time(ts[1])}"
            elif ts is not None:
                ts_s = fmt_time(ts)
            else:
                ts_s = "whole video"
            md.append(f"- `{ts_s}` {ob['description']} - **{ob['confidence']}** _({ob['evidence']})_")
        md.append("")
    if r["shots"]:
        md += ["## Shot list", "", "| # | Start | End | Duration | In | Motion |", "|---|---|---|---|---|---|"]
        mo = {m["shot"]: m for m in r["motion"]["shots"]}
        for s in r["shots"][:200]:
            mt = mo.get(s["index"], {})
            md.append(f"| {s['index']} | {fmt_time(s['start'])} | {fmt_time(s['end'])} | {s['duration']:.2f}s | "
                      f"{s['transition_in']} | {mt.get('type', '')} |")
        md.append("")
    if comparison:
        md += ["## Comparison with previous references", ""]
        if comparison.get("n_previous", 0) == 0:
            md.append("First reference video - nothing to compare yet.")
        else:
            md.append(f"Compared with {comparison['n_previous']} earlier reference(s).")
            md.append("")
            if comparison["consistent"]:
                md.append("**Consistent with earlier videos:** " + ", ".join(comparison["consistent"]))
            if comparison["different"]:
                md.append("")
                md.append("**Different from earlier videos:**")
                for d in comparison["different"]:
                    md.append(f"- {d}")
        md.append("")
    md += ["## Limitations", "",
           "- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.",
           "- Sound-effect and speed-change detection are heuristic (low confidence).",
           "- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.", ""]
    return "\n".join(md)
