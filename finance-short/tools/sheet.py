# contact sheet: python sheet.py out.jpg cols img1 img2 ... (labels = file names)
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = 270, 480
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * (h + 18)), "#222")
d = ImageDraw.Draw(S)
for k, (im, f) in enumerate(zip(ims, files)):
    x, y = (k % cols) * w, (k // cols) * (h + 18)
    S.paste(im.resize((w, h)), (x, y + 18)); d.text((x + 4, y + 3), f.split("/")[-1], fill="#fff")
S.save(out, quality=88)
