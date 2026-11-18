# Voice-over with Kokoro (ONNX, CPU): one clip per line of lines.json, joined with each line's pause.
# usage: python tools/tts.py <models dir> <voice> <speed>   -> voice/voice.wav, voice/lines_timed.json
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, VOICE, SPEED = sys.argv[1], sys.argv[2], float(sys.argv[3])
lines = json.load(open("lines.json"))
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
SR, LEAD = 24000, 0.15
parts, segs, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
for b in lines:
    a, sr = k.create(b["text"], voice=VOICE, speed=SPEED, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, nz[0] - 240): nz[-1] + 1200]
    segs.append({"id": b["id"], "start": round(t, 3), "end": round(t + len(a) / SR, 3), "text": b["text"]})
    parts += [a, np.zeros(int(b["gap"] * SR), np.float32)]; t += len(a) / SR + b["gap"]
parts.append(np.zeros(int(0.3 * SR), np.float32))
y = np.concatenate(parts); y = y / np.abs(y).max() * 0.89
sf.write("voice/voice.wav", y, SR)
json.dump(segs, open("voice/lines_timed.json", "w"), indent=1)
print("dur", round(len(y) / SR, 2))
