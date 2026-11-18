# Slika 1: incidencija dijabetesa tipa 2 u studiji DPP (Knowler et al., 2002)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 12})
grupe = ["Плацебо", "Метформин", "Промена\nначина живота"]
vrednosti = [11.0, 7.8, 4.8]
boje = ["#9e9e9e", "#5b7fa6", "#2e5e3e"]

fig, ax = plt.subplots(figsize=(6.2, 3.4), dpi=200)
bars = ax.bar(grupe, vrednosti, color=boje, width=0.55)
for b, v in zip(bars, vrednosti):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.25, f"{v:.1f}".replace(".", ","),
            ha="center", va="bottom", fontsize=12)
ax.set_ylabel("Случајева на 100 особа-година")
ax.set_ylim(0, 13)
ax.spines[["top", "right"]].set_visible(False)
ax.yaxis.grid(True, color="#e0e0e0", linewidth=0.8)
ax.set_axisbelow(True)
fig.tight_layout()
fig.savefig("slika1.png")
print("ok")
