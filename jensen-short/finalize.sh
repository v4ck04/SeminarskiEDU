#!/usr/bin/env bash
# Join the two rendered halves, lay the final mix under them and encode the upload file.
set -euo pipefail
cd "$(dirname "$0")"
R=../finance-short/out/jenfinal
printf "file '%s'\nfile '%s'\n" "$(realpath $R/partA.mp4)" "$(realpath $R/partB.mp4)" > $R/parts.txt
ffmpeg -y -v error -f concat -safe 0 -i $R/parts.txt -c copy $R/video.mp4
ffmpeg -y -v error -i $R/video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest nvidia-scandal.mp4
