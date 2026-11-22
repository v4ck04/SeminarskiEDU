# Voice-over with Kokoro (ONNX, runs on CPU): one file per script line, joined with fixed pauses.
# usage: python tts.py <models dir> <out dir> <voice> <speed> [--sample]
import sys, json, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, OUT, VOICE, SPEED = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
sample = "--sample" in sys.argv
md = open(__file__.rsplit("/", 2)[0] + "/SCRIPT.md").read()
lines = [m.group(1).strip() for m in re.finditer(r"^\| \d+ \| [^|]+ \| (.+) \|$", md, re.M)]
if sample: lines = lines[:2]
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
SR = 24000
# pause after each line (s): longer at beat changes
GAP = [0.4, 0.3, 0.4, 0.35, 0.35, 0.45, 0.3, 0.4, 0.0]
parts, segs, t = [], [], 0.35
parts.append(np.zeros(int(0.35 * SR), np.float32))
for i, ln in enumerate(lines):
    a, sr = k.create(ln, voice=VOICE, speed=SPEED, lang="en-us" if VOICE[0] == "a" else "en-gb")
    a = a.astype(np.float32)
    # trim leading/trailing near-silence
    nz = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else a
    segs.append({"line": i + 1, "text": ln, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
    parts.append(a); t += len(a) / SR
    g = GAP[i] if i < len(GAP) else 0.45
    parts.append(np.zeros(int(g * SR), np.float32)); t += g
parts.append(np.zeros(int(0.6 * SR), np.float32))
y = np.concatenate(parts)
y = y / max(1e-6, np.abs(y).max()) * 0.89
sf.write(f"{OUT}/voice_{VOICE}.wav", y, SR)
json.dump(segs, open(f"{OUT}/lines_{VOICE}.json", "w"), indent=1)
print(VOICE, "dur", round(len(y) / SR, 2), "words", sum(len(s["text"].split()) for s in segs))
