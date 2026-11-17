# Word timings: faster-whisper word timestamps on voice.wav, mapped onto the script's own words (difflib), so the
# captions use the script's spelling. -> voice/words.json [{w, s, e, line}]
import json, re, difflib, numpy as np, soundfile as sf
from scipy import signal
from faster_whisper import WhisperModel
a, sr = sf.read("voice/voice.wav"); a = a if a.ndim == 1 else a.mean(1)
a16 = signal.resample_poly(a, 16000, sr).astype(np.float32)
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a16, language="en", word_timestamps=True, initial_prompt=" ".join(l["text"] for l in json.load(open("lines.json"))))
hw = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
lines = json.load(open("voice/lines_timed.json"))
sw = [(w, l["id"], l["start"], l["end"]) for l in lines for w in l["text"].split()]
norm = lambda x: re.sub(r"[^a-z0-9']", "", x.lower())
sm = difflib.SequenceMatcher(a=[norm(x[0]) for x in sw], b=[norm(x[0]) for x in hw], autojunk=False)
out = [None] * len(sw)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
        for k in range(i2 - i1): out[i1 + k] = (hw[j1 + k][1], hw[j1 + k][2])
# fill gaps by spreading inside the line's span between known neighbours
for i, x in enumerate(out):
    if x is None:
        j = i
        while j < len(out) and out[j] is None: j += 1
        s0 = out[i - 1][1] if i else sw[i][2]
        s1 = out[j][0] if j < len(out) else sw[-1][3]
        n = j - i
        for k in range(n): out[i + k] = (s0 + (s1 - s0) * k / n, s0 + (s1 - s0) * (k + 1) / n)
res = [{"w": w, "s": round(s, 3), "e": round(e, 3), "line": lid} for (w, lid, _, _), (s, e) in zip(sw, out)]
# keep each word inside its own line's span (whisper can drift across pauses)
L = {l["id"]: l for l in lines}
for r in res:
    l = L[r["line"]]; r["s"] = min(max(r["s"], l["start"] - 0.05), l["end"]); r["e"] = min(max(r["e"], r["s"] + 0.05), l["end"] + 0.05)
json.dump(res, open("voice/words.json", "w"), indent=0)
print(len(res), "words;", sum(1 for t, *_ in sm.get_opcodes() if t != "equal"), "non-equal blocks")
