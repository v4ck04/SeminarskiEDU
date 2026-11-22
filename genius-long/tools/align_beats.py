# Word timings for the long voice-over: faster-whisper word timestamps mapped onto the script's own words, per beat.
# usage: python align_beats.py   -> voice/words.json  [{w, s, e, beat}]
import json, re, difflib, os
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
H = os.path.dirname(os.path.abspath(__file__)) + "/.."
model = WhisperModel("small.en", device="cpu", compute_type="int8")
y, sr = sf.read(f"{H}/voice/voice.wav", dtype="float32")
y = y if y.ndim == 1 else y.mean(1)
audio = resample_poly(y, 16000, sr).astype(np.float32)
segs, _ = model.transcribe(audio, word_timestamps=True, beam_size=5, language="en", vad_filter=False, condition_on_previous_text=False,
                           initial_prompt="Isaac Newton, South Sea Company, Mark Twain, James Paige, Linotype, Irving Fisher, Yale, John Meriwether, Long-Term Capital Management, Myron Scholes, Robert Merton, Ronald Read, Brattleboro.")
rec = [w for s in segs for w in s.words]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
beats = json.load(open(f"{H}/voice/beats_timed.json"))
script = [(b["id"], w) for b in beats for w in b["text"].split()]
A = [norm(w.word) for w in rec]; B = [norm(w) for _, w in script]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
out = [None] * len(B)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag in ("equal", "replace") and (i2 - i1) == (j2 - j1):
        for k in range(j2 - j1): out[j1 + k] = (rec[i1 + k].start, rec[i1 + k].end)
    elif tag == "replace" and i2 > i1:
        s0, e0 = rec[i1].start, rec[i2 - 1].end
        for k in range(j2 - j1): out[j1 + k] = (s0 + (e0 - s0) * k / (j2 - j1), s0 + (e0 - s0) * (k + 1) / (j2 - j1))
span = {b["id"]: (b["start"], b["end"]) for b in beats}
miss = 0
for j in range(len(B)):
    if out[j] is None:
        miss += 1
        p = next((out[k] for k in range(j - 1, -1, -1) if out[k]), (0, 0)); n = next((out[k] for k in range(j + 1, len(B)) if out[k]), (p[1] + 0.3, p[1] + 0.6))
        out[j] = (p[1], max(p[1] + 0.05, min(n[0], p[1] + 0.5)))
res = []
for (bid, w), (s, e) in zip(script, out):
    a, b = span[bid]
    s = min(max(s, a - 0.1), b); e = min(max(e, s + 0.03), b + 0.15)
    res.append({"w": w, "s": round(float(s), 3), "e": round(float(e), 3), "beat": bid})
json.dump(res, open(f"{H}/voice/words.json", "w"))
print("words", len(res), "recognised", len(rec), "interpolated", miss)
