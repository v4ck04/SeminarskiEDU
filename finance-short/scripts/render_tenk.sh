#!/usr/bin/env bash
# renders "How $10,000 Turns Into $1,000,000" here (cloud machine): a frozen bundle, the 2D timeline in chunks
# (out/tenk/2d/part*.mp4 -> out/tenk/2d.mp4) and the 3D shots (out/tenk/3d.mp4); skips finished pieces.
# then: (cd ../tenk-long && FFMPEG=ffmpeg node assemble.mjs)
set -u
cd "$(dirname "$0")/.."
mkdir -p out/tenk/2d
[ -d out/tenk/bundle_final ] || node scripts/bundle.mjs out/tenk/bundle_final > out/tenk/bundle.log 2>&1
B=$(pwd)/out/tenk/bundle_final
N=$(python3 -c "import json;print(json.load(open('src/videos/tenk/timing.json'))['total']+240)")
STEP=3000; k=0
for ((a=0; a<N; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $N ] && b=$((N-1))
  o=out/tenk/2d/part$(printf %02d $k).mp4; k=$((k+1))
  [ -f $o ] && { echo "skip $o"; continue; }
  echo "render $o $a $b"
  SERVE=$B node scripts/render.mjs Tenk2D ${o%.mp4}.tmp.mp4 $a $b 1 4 > ${o%.mp4}.log 2>&1 && mv ${o%.mp4}.tmp.mp4 $o && echo "ok $o" || { echo "FAILED $o"; exit 1; }
done
if [ ! -f out/tenk/2d.mp4 ]; then
  ls out/tenk/2d/part*.mp4 | sort | sed "s|.*|file '$(pwd)/&'|" > out/tenk/2d/parts.txt
  ffmpeg -y -v error -f concat -safe 0 -i out/tenk/2d/parts.txt -c copy out/tenk/2d.mp4 && echo "ok out/tenk/2d.mp4"
fi
N3=$(python3 -c "import json;t=json.load(open('src/videos/tenk/timing.json'));print(sum(b['f1']-b['f0'] for b in t['beats'] if b['mode']=='3d'))")
if [ ! -f out/tenk/3d.mp4 ]; then
  echo "render 3d 0 $((N3-1))"
  SERVE=$B node scripts/render.mjs Tenk3D out/tenk/3d.tmp.mp4 0 $((N3-1)) 1 1 '{"post":{"dpr":0.75}}' > out/tenk/3d.log 2>&1 && mv out/tenk/3d.tmp.mp4 out/tenk/3d.mp4 && echo "ok out/tenk/3d.mp4" || { echo "FAILED 3d"; exit 1; }
fi
