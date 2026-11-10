# Word timings for the voice-over: faster-whisper word timestamps, mapped onto the script's own words
# (so spelling and punctuation follow SCRIPT.md, not the recogniser). usage: python align.py voice.wav lines.json out.json
import sys, json, re, difflib
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
wav, lines_p, out_p = sys.argv[1:4]
model = WhisperModel("small.en", device="cpu", compute_type="int8")
y, sr = sf.read(wav, dtype='float32')
y = y if y.ndim == 1 else y.mean(1)
audio = resample_poly(y, 16000, sr).astype(np.float32)
segs, _ = model.transcribe(audio, word_timestamps=True, beam_size=5, language="en", vad_filter=False,
                           initial_prompt="Jensen Huang, Nvidia, Denny's, AI, S and P five hundred, index fund.")
rec = [w for s in segs for w in s.words]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
lines = json.load(open(lines_p))
script = [(li["line"], w) for li in lines for w in li["text"].split()]
A = [norm(w.word) for w in rec]; B = [norm(w) for _, w in script]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
out = [None] * len(B)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag in ("equal", "replace") and (i2 - i1) == (j2 - j1):
        for k in range(j2 - j1): out[j1 + k] = (rec[i1 + k].start, rec[i1 + k].end)
    elif tag == "replace" and i2 > i1:
        s0, e0 = rec[i1].start, rec[i2 - 1].end
        for k in range(j2 - j1): out[j1 + k] = (s0 + (e0 - s0) * k / (j2 - j1), s0 + (e0 - s0) * (k + 1) / (j2 - j1))
# fill gaps by interpolation inside the line's span
for j in range(len(B)):
    if out[j] is None:
        p = next((out[k] for k in range(j - 1, -1, -1) if out[k]), (0, 0)); n = next((out[k] for k in range(j + 1, len(B)) if out[k]), (p[1] + 0.3, p[1] + 0.6))
        out[j] = (p[1], max(p[1] + 0.05, n[0]))
words = [{"i": j, "line": script[j][0], "w": script[j][1], "start": round(out[j][0], 3), "end": round(out[j][1], 3)} for j in range(len(B))]
json.dump(words, open(out_p, "w"), indent=0)
eq = sum(b - a for t, a, b, _, _ in sm.get_opcodes() if t == "equal")
print("recognised", len(A), "script", len(B), "matched", eq, "WER~", round(1 - eq / len(B), 3))
print(" ".join(w.word for w in rec))
