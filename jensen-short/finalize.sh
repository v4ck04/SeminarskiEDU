#!/usr/bin/env bash
# joins the rendered parts (A: 0-805, B1: 806-1208, B2: 1209-1611) and muxes the soundtrack
set -euo pipefail
cd "$(dirname "$0")"
R=../finance-short/out/jenfinal
: > $R/parts.txt
for p in partA partB1 partB2; do printf "file '%s'\n" "$(realpath $R/$p.mp4)" >> $R/parts.txt; done
ffmpeg -y -v error -f concat -safe 0 -i $R/parts.txt -c copy $R/video.mp4
ffmpeg -y -v error -i $R/video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest nvidia-scandal.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,nb_frames -of compact nvidia-scandal.mp4
