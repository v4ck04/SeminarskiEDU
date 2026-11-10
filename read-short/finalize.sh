#!/bin/bash
# join the rendered parts, mux the soundtrack, encode the delivery file, run frame QA
set -e
cd "$(dirname "$0")"
R=../finance-short/out/readfinal
printf "file '%s'\nfile '%s'\n" "$(realpath $R/partA.mp4)" "$(realpath $R/partB.mp4)" > $R/parts.txt
ffmpeg -y -v error -f concat -safe 0 -i $R/parts.txt -c copy $R/video.mp4
ffmpeg -y -v error -i $R/video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest janitor-8-million.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration -of compact janitor-8-million.mp4
