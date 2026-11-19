import sys
from PIL import Image
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
SRC = "/home/user/SeminarskiEDU/seminarski-menadzment-kvaliteta-wolt"
OUT = "assets"
for f in ["Inter-Regular.otf", "Inter-Bold.otf", "Inter-SemiBold.otf"]:
    fm.fontManager.addfont("/usr/share/fonts/opentype/inter/" + f)
plt.rcParams["font.family"] = "Inter"

# 1) Grafikon ocena (sivi tonovi sablona), providna pozadina, 10.0 x 3.9 in
fig, ax = plt.subplots(figsize=(10.0, 3.9), dpi=200)
fig.patch.set_alpha(0)
ax.set_facecolor("none")
names = ["App Store (Србија)", "Google Play", "Trustpilot"]
vals = [4.7, 4.3, 1.2]
cols = ["#222223", "#636161", "#A9A6A2"]
y = [2, 1, 0]
ax.barh(y, [5] * 3, color="#E6E4E1", height=0.56, zorder=1)
ax.barh(y, vals, color=cols, height=0.56, zorder=2)
for yi, v in zip(y, vals):
    ax.text(5.1, yi, f"{v:.1f}".replace(".", ","), va="center", ha="left", fontsize=20, fontweight="bold", color="#222223", zorder=3)
ax.set_yticks(y, names, fontsize=17, color="#222223")
ax.set_xlim(0, 5.62)
ax.set_xticks([0, 1, 2, 3, 4, 5], ["0", "1", "2", "3", "4", "5"], fontsize=13, color="#636161")
for s in ["top", "right", "left"]:
    ax.spines[s].set_visible(False)
ax.spines["bottom"].set_color("#BDBAB6")
ax.tick_params(axis="y", length=0, pad=10)
ax.tick_params(axis="x", length=0)
fig.text(0.01, 0.95, "Просечна оцена корисника (1–5)", fontsize=19, fontweight="bold", color="#222223", va="top")
fig.text(0.01, 0.02, "Извор: App Store, Google Play и Trustpilot, 18.11.2026.", fontsize=12, color="#636161", va="bottom")
fig.subplots_adjust(left=0.235, right=0.98, top=0.80, bottom=0.17)
fig.savefig(f"{OUT}/grafikon_ocene.png", transparent=True)

# 2) Isecci recenzija u razmeri okvira (pozadina boje kartice)
im = Image.open(f"{SRC}/slika2.png").convert("RGB")
BG = im.getpixel((400, 10))
cards = {"a": (84, 16, 806, 278), "b": (84, 322, 806, 625), "v": (84, 669, 806, 974)}
def pad(card, ratio, name, margin=48):
    c = im.crop(cards[card])
    w = c.width + 2 * margin
    h = round(w / ratio)
    if h < c.height + 2 * margin:
        h = c.height + 2 * margin
        w = round(h * ratio)
    can = Image.new("RGB", (w, h), BG)
    can.paste(c, ((w - c.width) // 2, (h - c.height) // 2))
    can = can.resize((w * 2, h * 2), Image.LANCZOS)
    can.save(f"{OUT}/{name}.png")
    print(name, can.size, round(can.width / can.height, 3))
pad("a", float(sys.argv[1]), "recenzija_a")
pad("b", float(sys.argv[2]), "recenzija_b")

# 3) Isikava dijagram: bela pozadina -> boja okvira F5F5F5
ish = Image.open(f"{SRC}/slika_ishikawa.png").convert("RGB")
px = ish.load()
for yy in range(ish.height):
    for xx in range(ish.width):
        r, g, b = px[xx, yy]
        if r > 248 and g > 248 and b > 248:
            px[xx, yy] = (245, 245, 245)
ish.save(f"{OUT}/ishikawa.png")
print("ok")
