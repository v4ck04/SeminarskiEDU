#!/usr/bin/env bash
# renders the 3D beats of the long video, one mp4 per beat (out/genius/3d/<beat>.mp4); skips finished ones
# usage: scripts/render_g3.sh beat [beat ...]
cd "$(dirname "$0")/.."
mkdir -p out/genius/3d
for b in "$@"; do
  [ -f out/genius/3d/$b.mp4 ] && { echo "skip $b"; continue; }
  R=$(python3 -c "
import json
t=json.load(open('src/videos/genius/timing.json')); acc=0
for x in t['beats']:
    if x['mode']=='3d':
        n=x['f1']-x['f0']
        if x['id']=='$b': print(acc, acc+n-1)
        acc+=n")
  echo "render $b $R"
  SERVE=$(pwd)/out/genius/bundle3d node scripts/render.mjs Genius3D out/genius/3d/$b.tmp.mp4 $R 1 1 '{"post":{"dpr":0.75}}' > out/genius/3d/$b.log 2>&1 && mv out/genius/3d/$b.tmp.mp4 out/genius/3d/$b.mp4 && echo "ok $b" || echo "FAILED $b"
done
