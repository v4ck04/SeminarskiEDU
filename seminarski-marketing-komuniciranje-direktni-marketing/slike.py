# Слике за семинарски рад „Главни канали директног маркетинга“ (Liberation Serif ≈ Times New Roman).
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
plt.rcParams["font.family"] = "Liberation Serif"

def box(ax, x, y, w, h, text, fc="#FFFFFF", bold=False, fs=11):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.06", fc=fc, ec="#333333", lw=1))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", linespacing=1.15)

def line(ax, x1, y1, x2, y2):
    ax.plot([x1, x2], [y1, y2], color="#333333", lw=1)

# ---------- Слика 1: подела канала директног маркетинга ----------
fig, ax = plt.subplots(figsize=(8.2, 4.25), dpi=200)
ax.set_xlim(0, 16.4); ax.set_ylim(0.7, 9.2); ax.axis("off")
box(ax, 5.2, 7.9, 6.0, 1.0, "Канали директног маркетинга", fc="#D9D9D9", bold=True, fs=12)
box(ax, 0.3, 5.7, 7.4, 1.1, "Медији директне пропаганде", fc="#EDEDED", bold=True)
box(ax, 8.7, 5.7, 7.4, 1.1, "Класични медији са могућношћу\nповратне спреге", fc="#EDEDED", bold=True)
line(ax, 8.2, 7.9, 8.2, 7.3); line(ax, 4.0, 7.3, 12.4, 7.3); line(ax, 4.0, 7.3, 4.0, 6.8); line(ax, 12.4, 7.3, 12.4, 6.8)
leaves = [
    (0.3, "Штампани", "адресиране пошиљке:\nдиректна пошта,\nкаталози;\nнеадресиране пошиљке:\nлеци, проспекти"),
    (4.1, "Електронски", "телефон (телемаркетинг,\nSMS и MMS),\ne-mail, newsletter"),
    (8.7, "Штампани", "новине и часописи\n(купони, карте за\nодговор), спољна\nреклама"),
    (12.5, "Електронски", "телевизија (спот са\nдиректним одговором,\nинфомерцијал,\nTele-Shopping),\nрадио, интернет"),
]
for x, t, d in leaves:
    box(ax, x, 4.0, 3.6, 0.9, t, fc="#FFFFFF", bold=True, fs=11)
    box(ax, x, 0.9, 3.6, 2.7, d, fc="#FFFFFF", fs=10.5)
    line(ax, x + 1.8, 4.0, x + 1.8, 3.6)
for cx, xs in ((4.0, (2.1, 5.9)), (12.4, (10.5, 14.3))):
    line(ax, cx, 5.7, cx, 5.25); line(ax, xs[0], 5.25, xs[1], 5.25)
    for xx in xs: line(ax, xx, 5.25, xx, 4.9)
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
fig.savefig("slika1.png"); plt.close(fig)

# ---------- Слика 2: најпоузданије информације (Станковић и Ђукић, 2021) ----------
fig, ax = plt.subplots(figsize=(7.2, 3.3), dpi=200)
names = ["Мобилни телефон", "Каталог", "Директна пошта", "Телемаркетинг"]
vals = [67.0, 20.2, 8.3, 4.6]
y = range(len(names))[::-1]
ax.barh(list(y), vals, color=["#3A3A3A", "#7A7A7A", "#A6A6A6", "#C8C8C8"], height=0.55)
for yi, v in zip(y, vals):
    ax.text(v + 1, yi, f"{v:.1f}%".replace(".", ","), va="center", fontsize=11)
ax.set_yticks(list(y), names, fontsize=11)
ax.set_xlim(0, 80); ax.set_xlabel("Удео испитаника (%)", fontsize=10.5)
ax.tick_params(axis="x", labelsize=10)
for s in ("top", "right"): ax.spines[s].set_visible(False)
fig.tight_layout(); fig.savefig("slika2.png"); plt.close(fig)

# ---------- Слика 3: врсте коришћења интернета у Србији 2024 (РЗС) ----------
fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=200)
names = ["Слање онлајн порука\n(Viber, WhatsApp и сл.)", "Читање онлајн новина\nи часописа",
         "Учешће у друштвеним\nмрежама", "Тражење информација\nо роби и услугама", "Слање и примање\nимејла"]
vals = [91.6, 84.3, 81.5, 79.1, 65.3]
y = range(len(names))[::-1]
ax.barh(list(y), vals, color=["#7A7A7A"] * 4 + ["#3A3A3A"], height=0.55)
for yi, v in zip(y, vals):
    ax.text(v + 1, yi, f"{v:.1f}%".replace(".", ","), va="center", fontsize=11)
ax.set_yticks(list(y), names, fontsize=10.5)
ax.set_xlim(0, 105); ax.set_xlabel("Удео корисника интернета у последња три месеца (%)", fontsize=10.5)
ax.tick_params(axis="x", labelsize=10)
for s in ("top", "right"): ax.spines[s].set_visible(False)
fig.tight_layout(); fig.savefig("slika3.png"); plt.close(fig)
print("ok")
