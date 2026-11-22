# Burned-in caption chunks from word timings: merge spoken numbers into their written form, upper-case,
# then group into chunks of <= 3 tokens / <= 20 characters, breaking after punctuation.
# usage: python captions.py voice/words.json voice/lines.json out.json
import json, sys, re
words, lines, out = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
FPS = 30
# snap the first word of each line to the TTS line start (the recogniser tends to start late)
for li in lines:
    w = next(w for w in words if w["line"] == li["line"])
    w["start"] = min(w["start"], li["start"])
MERGE = [
    ("four and a half trillion dollar", "$4.5 TRILLION"),
    ("two hundred billion dollars.", "$200 BILLION."),
    ("nineteen ninety-three,", "1993,"),
    ("forty thousand dollars.", "$40,000."),
    ("November eighth,", "NOVEMBER 8,"),
    ("four percent.", "4%."),
    ("seven percent", "7%"),
    ("S and P five hundred.", "S&P 500."),
    ("Seven cents", "7 CENTS"),
]
toks, i = [], 0
while i < len(words):
    for src, dst in MERGE:
        n = len(src.split())
        if " ".join(w["w"] for w in words[i:i + n]) == src:
            toks.append({"t": dst, "start": words[i]["start"], "end": words[i + n - 1]["end"], "line": words[i]["line"]}); i += n; break
    else:
        w = words[i]; toks.append({"t": w["w"].upper(), "start": w["start"], "end": w["end"], "line": w["line"]}); i += 1
chunks, cur = [], []
for k, t in enumerate(toks):
    nxt = toks[k + 1] if k + 1 < len(toks) else None
    cur.append(t)
    full = len(cur) >= 3 or sum(len(x["t"]) + 1 for x in cur) + (len(nxt["t"]) if nxt else 0) > 20
    if not nxt or full or re.search(r"[,.?:!]$", t["t"]) or nxt["line"] != t["line"]:
        chunks.append(cur); cur = []
res = []
for c in chunks:
    res.append([{"t": x["t"], "s": round(x["start"] * FPS), "e": round(x["end"] * FPS), "line": x["line"]} for x in c])
# hold each word until the next word starts (short gaps) or 10 frames after it ends
flat = [x for c in res for x in c]
for a, b in zip(flat, flat[1:] + [None]):
    a["e"] = max(a["e"], b["s"]) if b and b["s"] - a["e"] < 12 else a["e"] + 10
json.dump(res, open(out, "w"), indent=0)
print(len(res), "chunks"); print(" | ".join(" ".join(x["t"] for x in c) for c in res))
