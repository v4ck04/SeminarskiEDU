"""Subtitles: caption chunking, SRT and styled ASS (libass) output.

The visual style (font, size, colours, outline, shadow, position, words per
caption, animation, highlighting) comes from the resolved production
settings, i.e. the learned style profile + feedback preferences.
"""
from __future__ import annotations

import re
import shutil
import tempfile
from pathlib import Path

import cv2
import numpy as np

from .. import ffmpeg, log, paths
from ..utils import StudioError, normalize_word, read_json, write_json, write_text

_log = log.get("subtitles")
PLAY_W, PLAY_H = 1080, 1920
WEAK = {"a", "an", "the", "of", "to", "and", "in", "on", "for", "with", "at", "by", "from", "my", "your",
        "our", "is", "was", "its", "it's", "that", "but", "or", "as", "into"}
NUMBER = re.compile(r"\d|^(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|percent)", re.I)


# ----------------------------------------------------------------------------- chunking
def chunk(timing: dict, cap: dict, emphasis: set[str]) -> list[dict]:
    max_words = int(cap.get("max_words", 3))
    max_chars = int(cap.get("max_chars_per_line", 16)) * int(cap.get("max_lines", 2))
    hold = float(cap.get("hold_s", 0.12))
    min_dur = float(cap.get("min_duration_s", 0.3))
    captions: list[dict] = []
    for s in timing["sentences"]:
        words = s["words"]
        cur: list[dict] = []

        def flush():
            nonlocal cur
            if cur:
                captions.append({"words": cur, "sentence": s["index"]})
            cur = []

        for i, w in enumerate(words):
            nxt = words[i + 1] if i + 1 < len(words) else None
            cur.append(w)
            text_len = len(" ".join(x["word"] for x in cur))
            brk = len(cur) >= max_words
            if nxt is not None:
                if text_len + 1 + len(nxt["word"]) > max_chars:
                    brk = True
                if re.search(r"[,;:—-]$", w["word"]):
                    brk = True
                if nxt["start"] - w["end"] > 0.35:
                    brk = True
            if brk and nxt is not None and len(cur) > 1 and normalize_word(cur[-1]["word"]) in WEAK:
                carry = cur.pop()
                flush()
                cur = [carry]
                continue
            if brk:
                flush()
        flush()
    # timing
    for i, c in enumerate(captions):
        c["start"] = c["words"][0]["start"]
        nxt_start = captions[i + 1]["words"][0]["start"] if i + 1 < len(captions) else None
        end = c["words"][-1]["end"] + hold
        if end - c["start"] < min_dur:
            end = c["start"] + min_dur
        if nxt_start is not None:
            if nxt_start - end < 0.25:      # close gaps -> no flicker
                end = nxt_start
            end = min(end, nxt_start)
        c["end"] = round(end, 3)
        c["start"] = round(c["start"], 3)
        c["text"] = " ".join(w["word"] for w in c["words"])
        c["emphasis"] = [j for j, w in enumerate(c["words"])
                         if normalize_word(w["word"]) in emphasis or NUMBER.search(normalize_word(w["word"]) or "")]
    return captions


# ----------------------------------------------------------------------------- SRT
def _srt_ts(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def to_srt(captions: list[dict]) -> str:
    out = []
    for i, c in enumerate(captions, 1):
        out += [str(i), f"{_srt_ts(c['start'])} --> {_srt_ts(c['end'])}", c["text"], ""]
    return "\n".join(out)


# ----------------------------------------------------------------------------- ASS
def ass_color(hex_color: str, alpha: int = 0) -> str:
    h = hex_color.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


def _ass_ts(t: float) -> str:
    cs = int(round(max(0.0, t) * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def _esc(t: str) -> str:
    return t.replace("\\", "/").replace("{", "(").replace("}", ")")


def font_family(font_file: str) -> str:
    """Name libass can match uniquely: the full name ("Poppins Black"), not the shared family."""
    from PIL import ImageFont
    p = paths.fonts_dir() / font_file
    if not p.exists():
        raise StudioError(f"Caption font {font_file} not found in assets/fonts")
    fam, style = ImageFont.truetype(str(p), 20).getname()
    return fam if (style or "Regular").lower() in ("regular", "normal", "book") else f"{fam} {style}"


def _balance(words: list[str], max_line: int) -> list[list[int]]:
    """Split word indices into 1-2 lines of similar length."""
    total = len(" ".join(words))
    if total <= max_line or len(words) < 2:
        return [list(range(len(words)))]
    best, bi = 1e9, 1
    for k in range(1, len(words)):
        a, b = len(" ".join(words[:k])), len(" ".join(words[k:]))
        if max(a, b) < best:
            best, bi = max(a, b), k
    return [list(range(bi)), list(range(bi, len(words)))]


def to_ass(captions: list[dict], cap: dict, font_name: str) -> str:
    size = int(cap.get("effective_font_size") or cap.get("font_size", 118))
    size = max(56, size)
    sa = cap.get("safe_area", {})
    ml, mr = int(sa.get("left", 0.06) * PLAY_W), int(sa.get("right", 0.12) * PLAY_W)
    x = int((ml + PLAY_W - mr) / 2)
    y = int(float(cap.get("position_y", 0.62)) * PLAY_H)
    prim, hl = cap.get("primary_color", "#FFFFFF"), cap.get("highlight_color", "#FFD400")
    outline = cap.get("outline_width", 8)
    shadow = cap.get("shadow", 3)
    style = (f"Style: Main,{font_name},{size},{ass_color(prim)},{ass_color(hl)},{ass_color(cap.get('outline_color', '#000000'))},"
             f"{ass_color(cap.get('shadow_color', '#000000'), 0x60)},0,0,0,0,100,100,{cap.get('letter_spacing', 0)},0,1,"
             f"{outline},{shadow},5,{ml},{mr},0,1")
    head = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {PLAY_W}", f"PlayResY: {PLAY_H}",
            "ScaledBorderAndShadow: yes", "WrapStyle: 0", "YCbCr Matrix: TV.709", "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
            "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
            "MarginR, MarginV, Encoding", style, "", "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    anim = cap.get("animation", "pop")
    mode = cap.get("highlight_mode", "active_word")
    upper = bool(cap.get("uppercase", True))
    max_line = int(cap.get("max_chars_per_line", 16))
    hl_tag, base_tag = "{\\c" + ass_color(hl) + "}", "{\\c" + ass_color(prim) + "}"
    events = []

    def render(words: list[str], colored: set[int], hidden_from: int | None = None) -> str:
        lines = _balance(words, max_line)
        parts = []
        for li in lines:
            seg = []
            for j in li:
                w = _esc(words[j])
                if hidden_from is not None and j >= hidden_from:
                    seg.append("{\\alpha&HFF&}" + w + "{\\alpha&H00&}")
                elif j in colored:
                    seg.append(hl_tag + w + base_tag)
                else:
                    seg.append(w)
            parts.append(" ".join(seg))
        return "\\N".join(parts)

    for c in captions:
        words = [w["word"].upper() if upper else w["word"] for w in c["words"]]
        pos = f"\\an5\\pos({x},{y})"
        intro = {"pop": "\\fscx78\\fscy78\\t(0,80,\\fscx108\\fscy108)\\t(80,150,\\fscx100\\fscy100)",
                 "fade": "\\fad(90,0)", "slide": f"\\move({x},{y + 40},{x},{y},0,120)\\fad(60,0)"}.get(anim, "")
        if anim == "slide":
            pos = "\\an5"
        emph = set(c["emphasis"]) if mode in ("emphasis", "active_word") else set()
        if anim == "word_reveal" or mode == "active_word":
            for j, w in enumerate(c["words"]):
                s = c["start"] if j == 0 else w["start"]
                e = c["words"][j + 1]["start"] if j + 1 < len(c["words"]) else c["end"]
                if e - s < 0.01:
                    continue
                colored = ({j} if mode == "active_word" else emph)
                hidden = j + 1 if anim == "word_reveal" else None
                tag = pos + (intro if (j == 0 and anim not in ("word_reveal",)) else "")
                if anim == "word_reveal":
                    tag += "\\fscx92\\fscy92\\t(0,70,\\fscx100\\fscy100)" if j == 0 else ""
                events.append(f"Dialogue: 0,{_ass_ts(s)},{_ass_ts(e)},Main,,0,0,0,,{{{tag}}}{render(words, colored, hidden)}")
        else:
            colored = emph if mode == "emphasis" else set()
            events.append(f"Dialogue: 0,{_ass_ts(c['start'])},{_ass_ts(c['end'])},Main,,0,0,0,,{{{pos}{intro}}}{render(words, colored)}")
    return "\n".join(head + events) + "\n"


# ----------------------------------------------------------------------------- font calibration
def _calib_file() -> Path:
    return paths.training_dir() / "font-calibration.json"


def font_metrics(font_file: str) -> dict:
    """Render the font with libass and measure it with the analyzer's caption detector."""
    from ..analysis.captions import detect_frame
    cache = read_json(_calib_file(), {}) or {}
    if font_file in cache:
        return cache[font_file]
    fam = font_family(font_file)
    with tempfile.TemporaryDirectory() as td:
        tdp = Path(td)
        shutil.copy(paths.fonts_dir() / font_file, tdp / font_file)
        cap = {"font_size": 100, "effective_font_size": 100, "outline_width": 6, "shadow": 0, "position_y": 0.5,
               "animation": "none", "highlight_mode": "none", "uppercase": True, "max_chars_per_line": 40,
               "safe_area": {"left": 0.05, "right": 0.05}}
        words = [{"word": w, "start": 0.0, "end": 1.0} for w in "MYSTERY SIGNAL FOUND".split()]
        ass = to_ass([{"words": words, "start": 0.0, "end": 2.0, "emphasis": []}], cap, fam)
        (tdp / "c.ass").write_text(ass, encoding="utf-8")
        ffmpeg.ffmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x303030:s=1080x1920:d=1",
                       "-vf", "subtitles=c.ass:fontsdir=.", "-frames:v", "1", "f.png"], cwd=tdp)
        img = cv2.imread(str(tdp / "f.png"))
    dets = detect_frame(cv2.resize(img, (540, 960), interpolation=cv2.INTER_AREA))
    if not dets:
        raise StudioError(f"Could not measure font {font_file}")
    d = max(dets, key=lambda x: x["w"])
    m = {"family": fam, "height_ratio": round(d["text_h"] * PLAY_H / 100.0, 4),
         "stroke_ratio": round(d["stroke_ratio"], 4), "char_aspect": round(d["char_aspect"], 4)}
    cache[font_file] = m
    write_json(_calib_file(), cache)
    return m


def font_height_ratio(font_file: str) -> float:
    return font_metrics(font_file)["height_ratio"]


def closest_font(stroke_ratio: float, char_aspect: float) -> tuple[str, str, dict]:
    """Bundled font whose measured weight/width is closest to the reference captions."""
    best = None
    for f in sorted(paths.fonts_dir().glob("*.ttf")):
        try:
            m = font_metrics(f.name)
        except Exception as e:
            _log.info("font %s not measurable: %s", f.name, e)
            continue
        d = ((m["stroke_ratio"] - stroke_ratio) / 0.05) ** 2 + ((m["char_aspect"] - char_aspect) / 0.12) ** 2
        if best is None or d < best[0]:
            best = (d, m["family"], f.name, m)
    if best is None:
        raise StudioError("No measurable fonts in assets/fonts")
    return best[1], best[2], best[3]


# ----------------------------------------------------------------------------- build
def build(slug: str, timing: dict, storyboard: dict, settings: dict) -> dict:
    cap = settings["captions"]
    emphasis = {normalize_word(w) for s in storyboard["scenes"] for e in s.get("emphasis", []) for w in e.split()}
    caps = chunk(timing, cap, emphasis)
    if not caps:
        raise StudioError("No captions produced (empty narration timing)")
    font_file = cap.get("font_file", "Poppins-Black.ttf")
    fam = font_family(font_file)
    d = paths.project_dirs(slug)["subtitles"]
    srt = to_srt(caps)
    ass = to_ass(caps, cap, fam)
    write_text(d / "subtitles.srt", srt)
    write_text(d / "captions.ass", ass)
    fdir = d / "fonts"
    fdir.mkdir(exist_ok=True)
    shutil.copy(paths.fonts_dir() / font_file, fdir / font_file)
    data = {"count": len(caps), "font": fam, "font_file": font_file, "captions": caps,
            "style": {k: cap.get(k) for k in ("effective_font_size", "position_y", "primary_color", "highlight_color",
                                               "outline_width", "shadow", "animation", "highlight_mode", "uppercase",
                                               "max_words")}}
    write_json(d / "captions.json", data)
    return data
