#!/bin/bash
# join the rendered parts, mux the soundtrack, run frame-by-frame QA
set -e
cd "$(dirname "$0")/.."
ls out/final/part*.mp4 | sort | sed "s/^/file '/; s/$/'/; s|file 'out/final/|file '|" > out/final/parts.txt
ffmpeg -y -v error -f concat -safe 0 -i out/final/parts.txt -c copy out/final/video.mp4
ffmpeg -y -v error -i out/final/video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest out/final/newton-south-sea-bubble.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration -of compact out/final/newton-south-sea-bubble.mp4
