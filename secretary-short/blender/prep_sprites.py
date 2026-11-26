# Prepares the character sprites for Blender: crops each transparent PNG in sprites_raw/ to its drawing (feet on the
# bottom edge), limits the height to 1600 px, writes sprites/<name>.png and sprites/sprites.json (pixel size + aspect).
#   python prep_sprites.py        (needs Pillow; run once after adding or replacing sprites)
import glob, json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, "sprites_raw"), os.path.join(HERE, "sprites")
os.makedirs(DST, exist_ok=True)
info = {}
for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert("RGBA")
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    pad = 6
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), bb[3]))
    # de-fringe: transparent and edge pixels carry the ink colour, so filtering never bleeds the generator's key colour
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 250:
                px[x, y] = (36, 23, 38, a)
    if im.height > 1600:
        im = im.resize((round(im.width * 1600 / im.height), 1600), Image.LANCZOS)
    im.save(os.path.join(DST, name + ".png"), optimize=True)
    info[name] = {"w": im.width, "h": im.height, "aspect": round(im.width / im.height, 4)}
json.dump(info, open(os.path.join(DST, "sprites.json"), "w"), indent=1)
print(len(info), "sprites ->", DST)
