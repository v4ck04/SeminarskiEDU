# Slika: tok usluge dostave (slika_tok.png) i dijagram uzroka i posledice (slika_ishikawa.png)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 11})

# ---------- ток услуге ----------
fig, ax = plt.subplots(figsize=(6.6, 2.9), dpi=200); ax.set_xlim(0, 100); ax.set_ylim(0, 44); ax.axis("off")
def box(x, y, w, h, title, sub, fc, ts=11):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6", fc=fc, ec="#333333", lw=0.9))
    if sub:
        ax.text(x + w / 2, y + h * 0.66, title, ha="center", va="center", fontsize=ts, weight="bold")
        ax.text(x + w / 2, y + h * 0.28, sub, ha="center", va="center", fontsize=9)
    else:
        ax.text(x + w / 2, y + h / 2, title, ha="center", va="center", fontsize=ts, weight="bold")
def arrow(x1, y1, x2, y2, style="-|>", ls="-", rad=0.0):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=12, lw=1.1, color="#333333",
                                 linestyle=ls, connectionstyle=f"arc3,rad={rad}"))
Y, H, W = 27, 13, 19
xs = [2, 27, 52, 77]
box(xs[0], Y, W, H, "Корисник", "поруџбина и\nплаћање", "#e8f0e8")
box(xs[1], Y, W, H, "Платформа Wolt", "пријем поруџбине,\nпроцена времена", "#e3ebf5")
box(xs[2], Y, W, H, "Ресторан", "припрема и\nпаковање", "#f5ede3")
box(xs[3], Y, W, H, "Достављач", "преузимање\nи достава", "#f2e6e6")
for i in range(3):
    arrow(xs[i] + W + 0.8, Y + H / 2, xs[i + 1] - 0.8, Y + H / 2)
arrow(xs[3] + W / 2, Y - 0.8, xs[0] + W - 3, Y - 0.8, rad=-0.2)
ax.text(54, 13.5, "предаја поруџбине кориснику", ha="center", fontsize=9, style="italic")
box(2, 1.2, 30, 7.5, "Корисничка подршка (чет)", "", "#eeeeee", ts=9.5)
arrow(7, 9.4, 7, Y - 0.8, style="<|-|>", ls="--")
fig.tight_layout(); fig.savefig("slika_tok.png"); plt.close(fig)

# ---------- Ишикава дијаграм ----------
fig, ax = plt.subplots(figsize=(6.8, 3.6), dpi=200); ax.set_xlim(0, 100); ax.set_ylim(0, 60); ax.axis("off")
ax.annotate("", xy=(78, 30), xytext=(4, 30), arrowprops=dict(arrowstyle="-|>", lw=1.6, color="#222222", mutation_scale=16))
ax.add_patch(FancyBboxPatch((79, 22), 19, 16, boxstyle="round,pad=0.5", fc="#f2e6e6", ec="#333333", lw=1))
ax.text(88.5, 30, "Закашњела\nили хладна\nпоруџбина", ha="center", va="center", fontsize=10.5, weight="bold")
bones = [
    (14, True, "Платформа", ["процена времена\nкао тачан број", "касно обавештење\nо кашњењу"]),
    (38, True, "Ресторан", ["дуже време\nприпреме", "неодговарајуће\nпаковање"]),
    (62, True, "Достављач", ["чекање\nу ресторану", "дужина руте"]),
    (26, False, "Окружење", ["гужве у саобраћају\nи шпиц", "временски услови\n(зима)"]),
    (50, False, "Корисник", ["нетачна\nадреса", "недоступност\nпри достави"]),
]
for x, top, name, causes in bones:
    y0, y1 = (30, 55) if top else (30, 5)
    xe = x + 12
    ax.plot([x, xe], [y1, y0], color="#333333", lw=1.2)
    ax.text(x - 1, y1 + (1.5 if top else -1.5), name, ha="center", va="bottom" if top else "top", fontsize=10.5, weight="bold")
    for j, c in enumerate(causes):
        t = (j + 1) / 3.0
        yy = y1 + (y0 - y1) * t; xx = x + (xe - x) * t
        ax.plot([xx - 9, xx], [yy, yy], color="#666666", lw=0.8)
        ax.text(xx - 9.5, yy, c, ha="right", va="center", fontsize=8.2)
fig.tight_layout(); fig.savefig("slika_ishikawa.png"); plt.close(fig)
print("ok")
