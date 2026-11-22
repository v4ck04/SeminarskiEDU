#!/bin/bash
# Join the rendered parts, mux the soundtrack, run the frame-by-frame QA.
# usage (from the repo root): bash eight-short/finalize.sh
set -e
cd "$(dirname "$0")/../finance-short"
D=out/eight/final
ls $D/part*.mp4 | sort | sed "s|^$D/|file '|; s/$/'/" > $D/parts.txt
ffmpeg -y -v error -f concat -safe 0 -i $D/parts.txt -c copy $D/video.mp4
ffmpeg -y -v error -i $D/video.mp4 -i public/eight/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart -shortest $D/the-bank-that-wanted-eight.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration -of compact $D/the-bank-that-wanted-eight.mp4
python3 scripts/short_qa.py $D/the-bank-that-wanted-eight.mp4 out/eight/qa ../eight-short/shots.json
