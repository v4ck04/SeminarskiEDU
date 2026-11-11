# Builds the shared timeline for the 2D and 3D compositions from the voice timings.
# in:  voice/beats_timed.json (tts_beats.py), voice/words.json (align.py, optional)
# out: ../finance-short/src/videos/genius/timing.json  { fps, total, beats: [{id, ch, mode, f0, f1, fe, title, words}] }
#   f0 = first frame of the beat, f1 = first frame of the next beat, fe = frame where the speech ends,
#   words = [[word, frame]] with frames on the global timeline (whisper onsets; evenly spread if not aligned yet)
import json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)) + "/.."
FPS = 30
bt = json.load(open(f"{H}/voice/beats_timed.json"))
src = {b["id"]: b for b in json.load(open(f"{H}/beats.json"))}
wpath = f"{H}/voice/words.json"
ww = json.load(open(wpath)) if os.path.exists(wpath) else None
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
out = []
import soundfile as sf
dur = sf.info(f"{H}/voice/voice.wav").duration
for i, b in enumerate(bt):
    f0 = round(b["start"] * FPS); f1 = round(bt[i + 1]["start"] * FPS) if i + 1 < len(bt) else round(dur * FPS)
    fe = round(b["end"] * FPS)
    toks = b["text"].split()
    words = []
    if ww is not None:
        words = [[norm(w["w"]), round(w["s"] * FPS)] for w in ww if w["beat"] == b["id"] and norm(w["w"])]
    if not words and toks:
        # spread by character position
        tot = sum(len(t) + 1 for t in toks); acc = 0
        for t in toks:
            words.append([norm(t), f0 + round((fe - f0) * acc / tot)]); acc += len(t) + 1
    out.append({"id": b["id"], "ch": b["ch"], "mode": b["mode"], "f0": f0, "f1": f1, "fe": fe, "title": src[b["id"]].get("title", ""), "text": b["text"], "words": words})
total = out[-1]["f1"]
dst = f"{H}/../finance-short/src/videos/genius/timing.json"
json.dump({"fps": FPS, "total": total, "aligned": ww is not None, "beats": out}, open(dst, "w"))
print("beats", len(out), "frames", total, "sec", round(total / FPS, 1), "3d frames", sum(b["f1"] - b["f0"] for b in out if b["mode"] == "3d"), "aligned", ww is not None)
