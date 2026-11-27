#!/usr/bin/env python3
"""ENGINE tool: tile the stills from stills.mjs into contact sheets (5 x 4, frame + seconds burned in).
usage: python3 tile.py <dir with fNNNNN.jpg> [width=216]"""
import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 216
fs = sorted(glob.glob(os.path.join(d, 'f*.jpg'))); n = 20
for s in range(0, len(fs), n):
    ims = [Image.open(f) for f in fs[s:s + n]]; w = W; h = int(ims[0].height * W / ims[0].width)
    sh = Image.new('RGB', (5 * w, 4 * h), 'black'); dr = ImageDraw.Draw(sh)
    for k, (im, f) in enumerate(zip(ims, fs[s:s + n])):
        x, y = (k % 5) * w, (k // 5) * h; sh.paste(im.resize((w, h)), (x, y)); fr = int(os.path.basename(f)[1:6])
        dr.rectangle([x, y, x + 74, y + 14], fill='black'); dr.text((x + 2, y + 1), f'{fr} {fr / 30:.1f}s', fill='yellow')
    sh.save(os.path.join(d, f'sheet_{s // n:02d}.jpg'), quality=85); print('sheet', s // n)
