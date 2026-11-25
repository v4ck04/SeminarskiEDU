# Слика 1: ефекти међународног кретања капитала на благостање (дијаграм „маказа“, према MacDougall-у).
# Цртеж је илустративан: линеарне криве граничног производа капитала, без стварних података.
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

DIR = os.path.dirname(os.path.abspath(__file__))
plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 11})

K = 10.0                      # укупан светски капитал (O1 ... O2)
mpk1 = lambda k: 9 - 0.8 * k  # земља увозница, капитал се мери од O1 (лево)
mpk2 = lambda k: 9 - 0.8 * (K - k)  # земља извозница, капитал се мери од O2 (десно)
A, E = 2.5, 5.0               # почетна расподела и равнотежа (mpk1(E) = mpk2(E))

fig, ax = plt.subplots(figsize=(6.4, 4.0), dpi=200)
xs = [0, K]
ax.plot(xs, [mpk1(x) for x in xs], color="#1f4e79", lw=2)
ax.plot(xs, [mpk2(x) for x in xs], color="#a33", lw=2)

# добитак светске производње (троугао између кривих од A до E)
ax.fill([A, E, A], [mpk1(A), mpk1(E), mpk2(A)], color="#cfcfcf", zorder=0)
for x in (A, E):
    ax.plot([x, x], [0, max(mpk1(x), mpk2(x))], color="black", lw=0.8, ls="--")
ax.plot([0, K], [mpk1(E)] * 2, color="black", lw=0.6, ls=":")

ax.annotate("", xy=(E, 0.6), xytext=(A, 0.6), arrowprops=dict(arrowstyle="->", lw=1.2))
ax.text((A + E) / 2, 0.85, "прилив капитала", ha="center", fontsize=10)
ax.text(A, -0.55, "A", ha="center", fontsize=11)
ax.text(E, -0.55, "E", ha="center", fontsize=11)
ax.text(-0.15, -0.55, "O₁", ha="center", fontsize=11)
ax.text(K + 0.15, -0.55, "O₂", ha="center", fontsize=11)
ax.text(K + 0.15, mpk1(E), "r*", va="center", fontsize=11)
ax.text(3.15, 5.25, "добитак", fontsize=10)
ax.text(0.0, 9.45, "ГПК земље увознице", color="#1f4e79", fontsize=10)
ax.text(K + 0.1, 9.45, "ГПК земље извознице", color="#a33", fontsize=10, ha="right")

ax.set_xlim(-0.3, K + 0.5)
ax.set_ylim(-1.0, 10.0)
ax.set_xticks([]); ax.set_yticks([])
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
ax.set_xlabel("Укупан капитал две земље", labelpad=12)
ax.set_ylabel("Гранични производ капитала (ГПК)")
fig.tight_layout()
fig.savefig(os.path.join(DIR, "slika1.png"))
print("slika1.png")
