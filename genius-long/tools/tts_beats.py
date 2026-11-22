# Voice-over with Kokoro (ONNX, CPU): one clip per beat of beats.json, joined with each beat's pause.
# Title beats (no text) are silent holds of TITLE_HOLD seconds (chapter cards).
# usage: python tts_beats.py <models dir> <voice> <speed>
import sys, json, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, VOICE, SPEED = sys.argv[1], sys.argv[2], float(sys.argv[3])
HERE = os.path.dirname(os.path.abspath(__file__)) + "/.."
beats = json.load(open(f"{HERE}/beats.json"))
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
SR, TITLE_HOLD, LEAD = 24000, 2.4, 0.4
parts, segs, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
for b in beats:
    if b["text"]:
        a, sr = k.create(b["text"], voice=VOICE, speed=SPEED, lang="en-us")
        a = a.astype(np.float32)
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else a
    else:
        a = np.zeros(int(TITLE_HOLD * SR), np.float32)
    segs.append({"id": b["id"], "ch": b["ch"], "mode": b["mode"], "start": round(t, 3), "end": round(t + len(a) / SR, 3), "text": b["text"]})
    parts.append(a); t += len(a) / SR
    parts.append(np.zeros(int(b["gap"] * SR), np.float32)); t += b["gap"]
    print(b["id"], round(t, 1), flush=True)
parts.append(np.zeros(int(1.5 * SR), np.float32))
y = np.concatenate(parts)
y = y / max(1e-6, np.abs(y).max()) * 0.89
sf.write(f"{HERE}/voice/voice.wav", y, SR)
json.dump(segs, open(f"{HERE}/voice/beats_timed.json", "w"), indent=1)
print("dur", round(len(y) / SR, 2))
