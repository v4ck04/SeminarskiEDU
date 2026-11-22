# Short (1080x1920) cut from the long video: the Long-Term Capital story (Nobel winners), with a new first line.
#   hook (new voice line over the l2 shot) + beats l3..l7 + l8 (from its second sentence) ..l11 of the long video. Audio: voice.wav + audio/bed.wav (music and effects, written by STEMS=1 soundtrack.py).
# usage (from genius-long/):  <venv>/bin/python shorts/ltcm.py <kokoro models dir>
import sys, os, json, subprocess, numpy as np, soundfile as sf
from scipy import signal
sys.path.insert(0, "audio")
from dsp import integrated, true_peak, read_wav, write_wav
M = sys.argv[1]
OUT, TMP = "shorts/ltcm-nobel.mp4", "shorts/tmp"; os.makedirs(TMP, exist_ok=True)
SR, FPS = 48000, 30
HOOK = "You'd trust two Nobel Prize winners with your money. So how did they lose four point six billion dollars in four months?"
HOOK_WORDS = "You'd trust two Nobel Prize winners with your money. So how did they lose $4.6 billion in four months?".split()
T = {b["id"]: b for b in json.load(open("../finance-short/src/videos/genius/timing.json"))["beats"]}
WORDS = json.load(open("voice/words.json"))
f0 = lambda b: T[b]["f0"]; f1 = lambda b: T[b]["f1"]

# ---------------- hook voice
from kokoro_onnx import Kokoro
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
a, sr = k.create(HOOK, voice="am_fenrir", speed=1.0, lang="en-us")
nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 1200].astype(np.float64)
hook = signal.resample_poly(a, SR, sr)
LEAD = 0.25
hook_frames = int(np.ceil((LEAD + len(hook) / SR + 0.45) * FPS))
# word times of the hook (whisper)
from faster_whisper import WhisperModel
wm = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = wm.transcribe(signal.resample_poly(a, 16000, sr).astype(np.float32), language="en", word_timestamps=True)
hw = [(w.start + LEAD, w.end + LEAD) for s in segs for w in s.words]
if len(hw) != len(HOOK_WORDS):   # fall back to even spacing if whisper splits words differently
    d = len(hook) / SR / len(HOOK_WORDS); hw = [(LEAD + i * d, LEAD + (i + 1) * d) for i in range(len(HOOK_WORDS))]

# ---------------- pieces on the long video's timeline (frames)
# l8 starts with "Remember Fisher's math." (a reference back to the Fisher chapter): the Short picks it up at "At that level"
l8_at = round(next(w["s"] for w in WORDS if w["beat"] == "l8" and w["w"] == "At") * FPS) - 4
pieces = [("hook", f0("l2"), f0("l2") + hook_frames), ("body", f0("l3"), f1("l7")), ("body", l8_at, f1("l11"))]

# ---------------- audio
v, vsr = read_wav("voice/voice.wav"); v = v if v.ndim == 1 else v.mean(axis=0)
v = signal.resample_poly(v, SR, vsr)
bed, bsr = read_wav("audio/bed.wav"); assert bsr == SR
def cut(x, a, b):
    s, e = round(a / FPS * SR), round(b / FPS * SR); return x[..., s:e]
body_voice = np.concatenate([cut(v, a, b) for kind, a, b in pieces if kind == "body"])
hook = hook * 10 ** ((integrated(np.stack([body_voice, body_voice])) - integrated(np.stack([hook, hook]))) / 20)
parts = []
for kind, a, b in pieces:
    bd = cut(bed, a, b).copy(); n = bd.shape[1]
    if kind == "hook":
        vo = np.zeros(n); s = round(LEAD * SR); vo[s:s + len(hook)] = hook[:n - s]
        bd *= 0.8   # the bed under l2 was ducked for other speech; keep it a little lower under the new line
    else:
        vo = cut(v, a, b)[:n]
    x = bd + vo[None, :]
    fade = np.minimum(1, np.minimum(np.arange(n), n - 1 - np.arange(n)) / (0.02 * SR))
    parts.append(x * fade[None, :])
mix = np.concatenate(parts, axis=1)
end = np.minimum(1, (mix.shape[1] - np.arange(mix.shape[1])) / (0.35 * SR)); mix *= end[None, :]
from soundtrack import limiter   # the long video's own look-ahead limiter (oversampled peaks)
for _ in range(2):
    mix = limiter(mix * 10 ** ((-14 - integrated(mix)) / 20), -1.5)
write_wav(f"{TMP}/audio.wav", mix)
print("audio", round(mix.shape[1] / SR, 2), "s,", round(integrated(mix), 2), "LUFS,", round(true_peak(mix), 2), "dBTP")

# numbers are spoken as words; the captions show them as figures
NUM = [("a hundred and twenty-five billion", "$125 billion"), ("four point six billion dollars", "$4.6 billion"),
       ("nineteen ninety-seven", "1997"), ("nineteen ninety-eight", "1998"), ("twenty-one percent", "21%"),
       ("forty-three", "43"), ("forty-one", "41"), ("five billion dollars", "$5 billion"), ("twenty-five dollars", "$25"),
       ("four percent", "4%")]
def merge_numbers(ws):
    out, i = [], 0
    while i < len(ws):
        for pat, rep in NUM:
            k = len(pat.split())
            seg = ws[i:i + k]
            if len(seg) == k and " ".join(x[0] for x in seg).lower().rstrip(".,?!") == pat:
                tail = seg[-1][0][-1] if seg[-1][0][-1] in ".,?!" else ""
                for part in rep.split():
                    out.append((part, seg[0][1], seg[-1][2]))
                out[-1] = (out[-1][0] + tail, out[-1][1], out[-1][2]); i += k; break
        else:
            out.append(ws[i]); i += 1
    return out

# ---------------- captions (ASS), 1-3 words per line, on the Short's timeline
cap, t0 = [], 0.0
for kind, a, b in pieces:
    if kind == "hook":
        ws = [(w, s, e) for w, (s, e) in zip(HOOK_WORDS, hw)]
    else:
        ws = merge_numbers([(w["w"], w["s"] - a / FPS, w["e"] - a / FPS) for w in WORDS if a / FPS - 0.05 <= w["s"] and w["e"] <= b / FPS])
    grp = []
    for w, s, e in ws:
        grp.append((w, s, e))
        if len(grp) == 3 or w[-1] in ".,?!:" or len(" ".join(g[0] for g in grp)) > 16:
            cap.append((t0 + grp[0][1], t0 + grp[-1][2], " ".join(g[0] for g in grp))); grp = []
    if grp: cap.append((t0 + grp[0][1], t0 + grp[-1][2], " ".join(g[0] for g in grp)))
    t0 += (b - a) / FPS
for i in range(len(cap) - 1):   # hold each line until the next one starts (no flicker in short gaps)
    s, e, txt = cap[i]
    if cap[i + 1][0] - e < 0.6: cap[i] = (s, cap[i + 1][0], txt)
def ts(x): x = max(0, x); return f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
with open(f"{TMP}/cap.ass", "w") as fh:
    fh.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n[V4+ Styles]\n"
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
             "Style: Cap,Inter Display Black,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,3,8,60,60,1330,1\n\n"
             "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    for s, e, txt in cap:
        fh.write(f"Dialogue: 0,{ts(s)},{ts(e)},Cap,,0,0,0,,{{\\fad(40,0)}}{txt.upper()}\n")

# ---------------- picture: blurred fill, the 16:9 film in the middle, title on top, captions under the film
F = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
n = len(pieces)
fc = [f"[0:v]split={n}" + "".join(f"[p{i}]" for i in range(n))]
for i, (kind, a, b) in enumerate(pieces):
    fc.append(f"[p{i}]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[c{i}]")
fc.append("".join(f"[c{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0,split[a][b]")
fc.append("[a]scale=-2:1920,crop=1080:1920,boxblur=28:2,eq=brightness=-0.22:saturation=0.8[bg]")
fc.append("[b]scale=1080:-2[fg]")
dur = sum(b - a for _, a, b in pieces) / FPS
fc.append("[bg][fg]overlay=0:(H-h)/2-110[m]")
fc.append(f"[m]drawtext=fontfile={F}:text='2 NOBEL WINNERS':fontsize=96:fontcolor=white:borderw=6:bordercolor=black@0.85:x=(w-tw)/2:y=250,"
          f"drawtext=fontfile={F}:text='$125 BILLION IN DEBT':fontsize=78:fontcolor=0xFFC93C:borderw=6:bordercolor=black@0.85:x=(w-tw)/2:y=375,"
          f"subtitles={TMP}/cap.ass:fontsdir=/usr/share/fonts/opentype/inter,format=yuv420p[out]")
cmd = ["ffmpeg", "-y", "-v", "error", "-stats", "-i", "4-geniuses.mp4", "-i", f"{TMP}/audio.wav", "-filter_complex", ";".join(fc),
       "-map", "[out]", "-map", "1:a", "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-t", f"{dur:.3f}", OUT]
subprocess.run(cmd, check=True)
print("wrote", OUT, round(dur, 2), "s")
