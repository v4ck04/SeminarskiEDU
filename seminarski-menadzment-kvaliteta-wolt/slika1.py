# Slika 1: prosečne ocene usluge Wolt na tri platforme (pristupljeno 18.11.2026)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 12})
platforme = ["App Store\n(Србија)", "Google Play", "Trustpilot\n(профил wolt.com)"]
ocene = [4.7, 4.3, 1.2]
broj = ["15.044 оцене", "511.355 оцена", "8.409 рецензија"]
boje = ["#2e5e3e", "#5b7fa6", "#b04a3a"]

fig, ax = plt.subplots(figsize=(6.2, 3.4), dpi=200)
bars = ax.bar(platforme, ocene, color=boje, width=0.5)
for b, v, n in zip(bars, ocene, broj):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.08, f"{v:.1f}".replace(".", ","), ha="center", va="bottom", fontsize=12)
    ax.text(b.get_x() + b.get_width() / 2, 0.15, n, ha="center", va="bottom", fontsize=10, color="white")
ax.set_ylabel("Просечна оцена (1–5)")
ax.set_ylim(0, 5.4)
ax.spines[["top", "right"]].set_visible(False)
ax.yaxis.grid(True, color="#e0e0e0", linewidth=0.8); ax.set_axisbelow(True)
fig.tight_layout()
fig.savefig("slika1.png")
print("ok")
