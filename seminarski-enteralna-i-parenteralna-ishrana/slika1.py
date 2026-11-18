# Slika 1: smrtnost uz enteralnu i parenteralnu ishranu u studijama CALORIES i NUTRIREA-2
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 12})
studije = ["CALORIES\n(смртност до 30. дана)", "NUTRIREA-2\n(смртност до 28. дана)"]
en = [34.2, 37.0]
pn = [33.1, 35.0]
x = np.arange(len(studije)); w = 0.34

fig, ax = plt.subplots(figsize=(6.2, 3.5), dpi=200)
b1 = ax.bar(x - w / 2, en, w, label="Ентерална исхрана", color="#2e5e3e")
b2 = ax.bar(x + w / 2, pn, w, label="Парентерална исхрана", color="#5b7fa6")
for bars in (b1, b2):
    for b in bars:
        v = b.get_height()
        ax.text(b.get_x() + b.get_width() / 2, v + 0.6, f"{v:.1f}%".replace(".", ","), ha="center", va="bottom", fontsize=11)
ax.set_xticks(x, studije)
ax.set_ylabel("Умрли болесници (%)")
ax.set_ylim(0, 45)
ax.spines[["top", "right"]].set_visible(False)
ax.yaxis.grid(True, color="#e0e0e0", linewidth=0.8); ax.set_axisbelow(True)
ax.legend(frameon=False, loc="upper center", ncol=2, bbox_to_anchor=(0.5, 1.12))
fig.tight_layout()
fig.savefig("slika1.png")
print("ok")
