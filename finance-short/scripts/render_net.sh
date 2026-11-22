#!/usr/bin/env bash
# renders the net short in chunks from the frozen bundle: scripts/render_net.sh <from> <to> <name>
cd "$(dirname "$0")/.."
mkdir -p out/net/parts
o=out/net/parts/$3.mp4
[ -f $o ] && { echo "skip $o"; exit 0; }
SERVE=$(pwd)/out/net/bundle node scripts/render.mjs NetShort ${o%.mp4}.tmp.mp4 $1 $2 1 1 > ${o%.mp4}.log 2>&1 && mv ${o%.mp4}.tmp.mp4 $o && echo "ok $o" || echo "FAILED $o"
