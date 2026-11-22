# Слике за семинарски рад „Личност потрошача“ (Liberation Serif ≈ Times New Roman).
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
plt.rcParams["font.family"] = "Liberation Serif"

def box(ax, x, y, w, h, text, fc="#FFFFFF", bold=False, fs=11, ha="center"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fc, ec="#333333", lw=1))
    tx = x + w / 2 if ha == "center" else x + 0.25
    ax.text(tx, y + h / 2, text, ha=ha, va="center", fontsize=fs, fontweight="bold" if bold else "normal", linespacing=1.2)

def arrow(ax, x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="<->", color="#333333", lw=1))

# ---------- Слика 1: Фројдов структурални модел личности ----------
fig, ax = plt.subplots(figsize=(8.0, 3.7), dpi=200)
ax.set_xlim(0, 16); ax.set_ylim(0, 7.4); ax.axis("off")
box(ax, 5.3, 5.4, 5.4, 1.6, "ЕГО (ја)\nсвесна контрола понашања\nпринцип реалности", fc="#D9D9D9", bold=False, fs=11)
box(ax, 0.3, 0.4, 5.6, 2.2, "ИД (оно)\nнесвесни, биолошки део;\nнагони и потребе\nпринцип задовољства", fc="#F2F2F2", fs=11)
box(ax, 10.1, 0.4, 5.6, 2.2, "СУПЕРЕГО (над ја)\nунутрашњи морал\nи друштвене норме", fc="#F2F2F2", fs=11)
arrow(ax, 6.8, 5.3, 4.2, 2.7); arrow(ax, 9.2, 5.3, 11.8, 2.7)
ax.text(8.0, 1.5, "его посредује између\nзахтева ида, суперега\nи стварности", ha="center", va="center", fontsize=10.5, style="normal", color="#333333")
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
fig.savefig("slika1.png"); plt.close(fig)

# ---------- Слика 2: димензије и аспекти личности бренда (Акер) ----------
dims = [
    ("Искреност", ["реалистичност", "поштење", "доброта", "ведрина"]),
    ("Узбудљивост", ["одважност", "смелост", "маштовитост", "модерност"]),
    ("Компетентност", ["поузданост", "интелигентност", "успешност"]),
    ("Софистицираност", ["припадност\nвишој класи", "шарм"]),
    ("Чврстина", ["активност\nван куће", "упорност"]),
]
fig, ax = plt.subplots(figsize=(8.2, 3.0), dpi=200)
ax.set_xlim(0, 16.4); ax.set_ylim(0, 6.0); ax.axis("off")
box(ax, 4.7, 5.0, 7.0, 0.9, "Личност бренда", fc="#D9D9D9", bold=True, fs=12)
ax.plot([1.7, 14.7], [4.6, 4.6], color="#333333", lw=1); ax.plot([8.2, 8.2], [5.0, 4.6], color="#333333", lw=1)
for i, (d, fac) in enumerate(dims):
    x = 0.2 + i * 3.25
    ax.plot([x + 1.5, x + 1.5], [4.6, 4.3], color="#333333", lw=1)
    box(ax, x, 3.5, 3.0, 0.8, d, fc="#EDEDED", bold=True, fs=10.5)
    box(ax, x, 0.15, 3.0, 3.05, "\n".join("• " + f.replace("\n", "\n   ") for f in fac), fc="#FFFFFF", fs=10.5)
    ax.plot([x + 1.5, x + 1.5], [3.5, 3.2], color="#333333", lw=1)
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
fig.savefig("slika2.png"); plt.close(fig)
print("ok")
