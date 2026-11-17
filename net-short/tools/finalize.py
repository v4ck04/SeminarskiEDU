# Finishing: word-group captions (ASS, 1-3 words, key words in gold), the two render halves joined, the soundtrack
# muxed and the captions burned in. -> net-short/net-parable.mp4 (1080x1920, 30 fps, H.264 + AAC)
# usage: python3 tools/finalize.py      (from net-short/)
import json, subprocess, os
FPS = 30
W = json.load(open("voice/words.json"))
GOLD = {"net", "net.", "fifty", "ten", "twenty.", "three", "five,", "eight,", "twenty", "rich", "time.", "saved", "built", "net.", "difference."}
caps, grp = [], []
def flush():
    global grp
    if grp: caps.append((grp[0]["s"], grp[-1]["e"], grp)); grp = []
for i, w in enumerate(W):
    if grp and (w["line"] != grp[-1]["line"] or w["s"] - grp[-1]["e"] > 0.25): flush()
    grp.append(w)
    txt = " ".join(x["w"] for x in grp)
    if len(grp) == 3 or w["w"][-1] in ".,?!" or len(txt) > 15: flush()
flush()
for i in range(len(caps) - 1):   # hold each caption until the next starts if the gap is short
    s, e, g = caps[i]
    if caps[i + 1][0] - e < 0.5: caps[i] = (s, caps[i + 1][0], g)
def ts(x): x = max(0, x); return f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
def word(w):
    t = w["w"].upper()
    return "{\\c&H3CC9FF&}" + t + "{\\c&HFFFFFF&}" if w["w"].lower() in GOLD else t
with open("captions.ass", "w") as fh:
    fh.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n[V4+ Styles]\n"
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
             "Style: Cap,Inter Display Black,92,&H00FFFFFF,&H00FFFFFF,&H00141016,&H78000000,0,0,0,0,100,100,0,0,1,8,4,2,70,70,560,1\n\n"
             "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    for s, e, g in caps:
        fh.write(f"Dialogue: 0,{ts(s)},{ts(e)},Cap,,0,0,0,,{{\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}}" + " ".join(word(w) for w in g) + "\n")
print(len(caps), "captions")
P = "../finance-short/out/net/parts"
open(f"{P}/list.txt", "w").write("".join(f"file '{os.path.abspath(P)}/{k}.mp4'\n" for k in ("a", "b")))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{P}/list.txt", "-c", "copy", f"{P}/video.mp4"], check=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{P}/video.mp4", "-i", "audio/mix.wav", "-map", "0:v:0", "-map", "1:a:0",
                "-vf", "subtitles=captions.ass:fontsdir=/usr/share/fonts/opentype/inter", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-shortest", "net-parable.mp4"], check=True)
print(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,nb_frames,width,height", "-of", "compact", "net-parable.mp4"], capture_output=True, text=True).stdout)
