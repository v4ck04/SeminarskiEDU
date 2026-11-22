#!/usr/bin/env bash
# Renders "One Basket Explains It" here (software WebGL): a frozen bundle, six chunks (three workers), joined, with the
# soundtrack muxed in (render.mjs writes muted video). -> ../basket-short/basket-short.mp4. Skips finished chunks.
# Long here (~13 s a frame per worker): run it detached, e.g. setsid nohup scripts/render_basket.sh > out/basket/run.log 2>&1 &
cd "$(dirname "$0")/.."
D=out/basket; mkdir -p $D/parts
[ -f $D/bundle/index.html ] || node scripts/bundle.mjs $D/bundle > $D/bundle.log 2>&1 || { echo "bundle FAILED"; exit 1; }
part() { local o=$D/parts/$3.mp4; [ -f $o ] && { echo "skip $o"; return; }
  SERVE=$(pwd)/$D/bundle CRF=16 node scripts/render.mjs BasketShort ${o%.mp4}.tmp.mp4 $1 $2 1 1 > ${o%.mp4}.log 2>&1 && mv ${o%.mp4}.tmp.mp4 $o && echo "ok $o" || echo "FAILED $o"; }
(part 0 241 a1; part 242 483 a2) & (part 484 725 b1; part 726 967 b2) & (part 968 1208 c1; part 1209 1449 c2) & wait
for k in a1 a2 b1 b2 c1 c2; do [ -f $D/parts/$k.mp4 ] || { echo "missing $k"; exit 1; }; done
for k in a1 a2 b1 b2 c1 c2; do echo "file '$(pwd)/$D/parts/$k.mp4'"; done > $D/parts/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $D/parts/list.txt -i public/basket/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest ../basket-short/basket-short.mp4 && echo "ok basket-short.mp4"
