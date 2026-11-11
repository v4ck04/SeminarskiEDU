#!/usr/bin/env bash
# Joins the 2D timeline (finance-short/out/genius/2d/part*.mp4) with the 3D beats (out/genius/3d/<beat>.mp4) and any
# re-rendered 2D beats (out/genius/2d/patch_<beat>.mp4) at their places on the timeline, adds the soundtrack and writes 4-geniuses.mp4.
set -euo pipefail
cd "$(dirname "$0")"
G=../finance-short/out/genius
ls $G/2d/part*.mp4 | sort | sed "s|.*|file '$(pwd)/&'|" > $G/2d/parts.txt
ffmpeg -y -v error -f concat -safe 0 -i $G/2d/parts.txt -c copy $G/2d_full.mp4
python3 - "$G" <<'PY' > $G/assemble.cmd
import json, sys
G = sys.argv[1]
t = json.load(open('../finance-short/src/videos/genius/timing.json'))
total = t['total'] + 240
import os
# clips cut into the 2D timeline: the 3D beats, plus re-rendered 2D beats (2d/patch_<beat>.mp4) where one exists
def clip(b): return f"{G}/3d/{b['id']}.mp4" if b['mode'] == '3d' else f"{G}/2d/patch_{b['id']}.mp4"
d3 = [b for b in t['beats'] if b['mode'] == '3d' or os.path.exists(clip(b))]
segs, pos = [], 0   # (kind, a, b) on the global timeline
for b in d3:
    if b['f0'] > pos: segs.append(('2d', pos, b['f0']))
    segs.append((b['id'], b['f0'], b['f1'])); pos = b['f1']
if pos < total: segs.append(('2d', pos, total))
n2 = sum(1 for s in segs if s[0] == '2d')
inputs = [f"-i {G}/2d_full.mp4"] + [f"-i {clip(b)}" for b in d3]
fc = [f"[0:v]split={n2}" + "".join(f"[s{i}]" for i in range(n2))]
lab, k2, k3 = [], 0, 1
for kind, a, b in segs:
    if kind == '2d':
        fc.append(f"[s{k2}]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{len(lab)}]"); k2 += 1
    else:
        fc.append(f"[{k3}:v]trim=end_frame={b - a},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{len(lab)}]"); k3 += 1
    lab.append(f"[v{len(lab)}]")
fc.append("".join(lab) + f"concat=n={len(lab)}:v=1:a=0,format=yuv420p[out]")
print("ffmpeg -y -v error -stats " + " ".join(inputs) + f" -i audio/mix.wav -filter_complex \"{';'.join(fc)}\" -map \"[out]\" -map {len(d3) + 1}:a:0 -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest 4-geniuses.mp4")
PY
bash $G/assemble.cmd
ffprobe -v error -show_entries format=duration:stream=codec_name,nb_frames,width,height -of compact 4-geniuses.mp4
