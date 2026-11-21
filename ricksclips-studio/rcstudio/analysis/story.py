"""Storytelling structure from the transcript (heuristic, evidence-tagged).

Every label here comes from simple, inspectable text rules; deeper narrative
judgement is added by Claude in the skill workflow as reviewed notes
(training/analysis/<id>.notes.json).
"""
from __future__ import annotations

import re

import numpy as np

from ..utils import split_sentences

SUPERLATIVE = re.compile(r"\b(most|biggest|largest|smallest|fastest|oldest|strangest|craziest|weirdest|only|first|last|never|ever|best|worst|deadliest)\b", re.I)
CURIOSITY = re.compile(r"\b(secret|mystery|mysterious|why|how|what happens|nobody|no one|hidden|truth|actually|turns out|unknown|strange|weird)\b", re.I)
CONTRARIAN = re.compile(r"\b(isn't|wasn't|aren't|don't|doesn't|myth|wrong|lie|actually|but)\b", re.I)
IMPERATIVE = re.compile(r"^(imagine|look|watch|stop|listen|think|picture|meet|this is|here's|wait)\b", re.I)
SECOND_PERSON = re.compile(r"\b(you|your|you're)\b", re.I)
CTA = re.compile(r"\b(follow|subscribe|like|comment|share|part \d|part two|let me know|link)\b", re.I)
REVEAL = re.compile(r"\b(but|turns out|actually|in fact|the answer|the truth|the reason|that's why|which means|meant|means|was really|it was)\b", re.I)
INTENSITY = re.compile(r"\b(insane|crazy|terrifying|incredible|shocking|unbelievable|massive|huge|impossible|scary|wild|mind|bizarre)\w*", re.I)
NUMBER = re.compile(r"\b\d[\d,.]*\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|trillion)\b", re.I)


def hook_features(text: str) -> list[str]:
    feats = []
    if text.strip().endswith("?"):
        feats.append("question")
    if NUMBER.search(text):
        feats.append("number/statistic")
    if SECOND_PERSON.search(text):
        feats.append("direct address (you)")
    if SUPERLATIVE.search(text):
        feats.append("superlative/extreme claim")
    if CURIOSITY.search(text):
        feats.append("curiosity gap")
    if CONTRARIAN.search(text):
        feats.append("contrarian/negation")
    if IMPERATIVE.search(text.strip()):
        feats.append("imperative/scene-setting opener")
    return feats


def analyze(transcript: dict | None, duration: float, cut_times: list[float]) -> dict:
    if not transcript or not transcript.get("words"):
        return {"available": False, "reason": "no transcript (install faster-whisper or set OPENAI_API_KEY)"}
    words = transcript["words"]
    text = transcript.get("text", "")
    sentences = split_sentences(text)
    # map sentences to word timings by sequential word counting
    sent_times = []
    wi = 0
    for s in sentences:
        n = len(s.split())
        chunk = words[wi: wi + n] if wi < len(words) else []
        if chunk:
            sent_times.append({"text": s, "start": chunk[0]["start"], "end": chunk[-1]["end"], "words": len(chunk)})
        wi += n
    if not sent_times:
        sent_times = [{"text": text, "start": words[0]["start"], "end": words[-1]["end"], "words": len(words)}]
    hook = sent_times[0]
    last = sent_times[-1]
    first_toks = set(re.findall(r"[a-z']+", hook["text"].lower()))
    last_toks = set(re.findall(r"[a-z']+", last["text"].lower()))
    overlap = len(first_toks & last_toks) / max(1, min(len(first_toks), len(last_toks)))
    ending = []
    if last["text"].strip().endswith("?"):
        ending.append("question to viewer")
    if CTA.search(last["text"]):
        ending.append("call to action")
    if REVEAL.search(last["text"]):
        ending.append("reveal/twist")
    if overlap > 0.35:
        ending.append("loops back to the opening")
    if duration - last["end"] < 0.35:
        ending.append("abrupt end right after last word")
    if not ending:
        ending.append("statement/conclusion")

    thirds = []
    for k in range(3):
        a, b = duration * k / 3, duration * (k + 1) / 3
        ws = [w for w in words if a <= w["start"] < b]
        cuts = [c for c in cut_times if a <= c < b]
        seg_text = " ".join(w["word"] for w in ws)
        thirds.append({"range": [round(a, 2), round(b, 2)], "words_per_s": round(len(ws) / max(1e-6, b - a), 2),
                       "cuts_per_s": round(len(cuts) / max(1e-6, b - a), 2),
                       "numbers": len(NUMBER.findall(seg_text)), "intensity_words": len(INTENSITY.findall(seg_text))})

    # cut alignment with narration
    def near(t, pts, tol):
        return any(abs(t - p) <= tol for p in pts)
    word_bounds = [w["start"] for w in words] + [w["end"] for w in words]
    sent_bounds = [s["start"] for s in sent_times] + [s["end"] for s in sent_times]
    inner_cuts = [c for c in cut_times if 0.2 < c < duration - 0.2]
    align_word = float(np.mean([near(c, word_bounds, 0.12) for c in inner_cuts])) if inner_cuts else None
    align_sent = float(np.mean([near(c, sent_bounds, 0.25) for c in inner_cuts])) if inner_cuts else None
    cuts_per_sentence = len(inner_cuts) / max(1, len(sent_times))

    nums = len(NUMBER.findall(text))
    return {
        "available": True,
        "sentence_count": len(sent_times),
        "words": len(words),
        "words_per_sentence": round(float(np.mean([s["words"] for s in sent_times])), 2),
        "hook": {"text": hook["text"], "start": round(hook["start"], 3), "end": round(hook["end"], 3),
                 "duration": round(hook["end"] - hook["start"], 3), "words": hook["words"],
                 "features": hook_features(hook["text"]), "time_to_first_word": round(words[0]["start"], 3)},
        "ending": {"text": last["text"], "types": ending, "tail_after_last_word": round(duration - last["end"], 3)},
        "progression": thirds,
        "numbers_per_10s": round(nums / max(1e-6, duration) * 10, 2),
        "cut_alignment": {"word_boundary_share": None if align_word is None else round(align_word, 3),
                          "sentence_boundary_share": None if align_sent is None else round(align_sent, 3),
                          "cuts_per_sentence": round(cuts_per_sentence, 2)},
        "sentences": sent_times,
    }
