#!/usr/bin/env bash
# renders the 2D timeline of the long video in chunks (out/genius/2d/part<k>.mp4) from a frozen bundle; skips finished chunks
cd "$(dirname "$0")/.."
mkdir -p out/genius/2d
N=$(python3 -c "import json;print(json.load(open('src/videos/genius/timing.json'))['total']+240)")
STEP=${STEP:-4000}; k=0
for ((a=0; a<N; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $N ] && b=$((N-1))
  o=out/genius/2d/part$(printf %02d $k).mp4; k=$((k+1))
  [ -f $o ] && { echo "skip $o"; continue; }
  echo "render $o $a $b"
  SERVE=$(pwd)/out/genius/bundle2d node scripts/render.mjs Genius2D ${o%.mp4}.tmp.mp4 $a $b 1 ${CONC:-4} > ${o%.mp4}.log 2>&1 && mv ${o%.mp4}.tmp.mp4 $o && echo "ok $o" || echo "FAILED $o"
done
