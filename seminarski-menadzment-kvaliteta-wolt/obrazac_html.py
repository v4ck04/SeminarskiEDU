# Попуњен образац „Мини пројекат“ (Антић, 2022, стр. 301–304) као HTML за штампу у PDF.
# Одговори се узимају из оквира семинарског рада (sadrzaj.js, извезен у JSON).
# Употреба: python3 obrazac_html.py <mp.json> <izlaz.html>
import html
import json
import os
import re
import sys

SRC, OUT = sys.argv[1], sys.argv[2]
DIR = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(SRC, encoding="utf8"))
blocks = d["blocks"]

FIG = [("Слика 2", "Слика 1"), ("Слика 3", "Слика 2"), ("Слика 4", "Слика 3")]


def renum(t):
    for a, b in FIG:
        t = t.replace(a, b)
    return t


def inline(t):
    t = re.sub(r"\[\[fn:[^\]]*\]\]", "", t)
    t = renum(t)
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", t)
    return t


def box_html(items):
    out = []
    for it in items:
        if isinstance(it, str):
            out.append(f"<p>{inline(it)}</p>")
        else:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in it["list"]) + "</ul>")
    return "".join(out)


def table_html(t):
    tot = sum(t["widths"])
    cols = "".join(f'<col style="width:{w / tot * 100:.1f}%">' for w in t["widths"])
    head = "".join(f"<th>{inline(h)}</th>" for h in t["header"])
    rows = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in t["rows"])
    return f"<table><colgroup>{cols}</colgroup><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>"


FIGW = {"slika1.png": "78%", "slika2.png": "52%", "slika_ishikawa.png": "92%"}

# ---------- од фазе 1 до краја: питања образца и оквири са одговорима ----------
start = next(i for i, b in enumerate(blocks) if b.get("h2", "").startswith("ФАЗА 1"))
body, cur, used = [], None, set()


def flush():
    global cur
    if cur is not None:
        body.append(f'<div class="box">{"".join(cur)}</div>')
    cur = None


def into_box(fragment):
    global cur
    if cur is None:
        cur = []
    cur.append(fragment)


for b in blocks[start:]:
    for m in re.finditer(r"\[\[fn:([^|\]]+)", json.dumps(b, ensure_ascii=False)):
        used.add(m.group(1))
    k, v = next(iter(b.items()))
    if k == "h2":
        flush()
        body.append(f"<h2>{inline(v)}</h2>")
        if v.startswith("ФАЗА 2"):
            body.append('<p class="note">Истраживање на терену замењено је анализом јавно доступних оцена и рецензија корисника '
                        '(App Store за Србију, Google Play и Trustpilot), прикупљених 18. новембра 2026. Налази указују на могуће '
                        'слабе тачке услуге, али нису репрезентативни.</p>')
    elif k == "h3":
        flush()
        body.append(f'<h3>{inline(v)}</h3>')
    elif k == "p":
        if body and body[-1].startswith('<p class="note">'):
            continue
        into_box(f"<p>{inline(v)}</p>")
    elif k == "box":
        into_box(box_html(v))
    elif k == "figure":
        into_box(f'<figure><img src="file://{DIR}/{v["file"]}" style="width:{FIGW.get(v["file"], "80%")}">')
    elif k == "figcaption":
        into_box(f"<figcaption>{inline(v)}</figcaption>")
    elif k == "figsource":
        into_box(f'<div class="src">{inline(v)}</div></figure>')
    elif k == "tcaption":
        into_box(f'<div class="tcap">{inline(v)}</div>')
    elif k == "table":
        into_box(table_html(v))
    elif k == "tsource":
        into_box(f'<div class="src">{inline(v)}</div>')
flush()
# напомена о методологији из фазе 2 у раду не улази у оквир (замењена је напоменом испод наслова фазе)

# ---------- извори: само они на које се позивају одговори ----------
PREFIX = {"terms": "Wolt (2025)", "woltplus": "Wolt (2026)", "ray": "Ray,", "iso": "ISO (2015)", "zakon": "Закон о заштити",
          "appstore": "App Store", "gplay": "Google Play", "trust": "Trustpilot", "par88": "Parasuraman, A., Zeithaml, V. A., Berry, L. L. (1988)",
          "koay": "Koay", "suh": "Suhartanto", "kapoor": "Kapoor", "par85": "Parasuraman, A., Zeithaml, V. A., Berry, L. L. (1985)",
          "wolt22": "Wolt (2022)", "udzbenik": "Антић"}
used.add("udzbenik")
lit = [x for x in d["literatura"] if any(x.startswith(PREFIX[k]) for k in used if k in PREFIX)]
lit_html = "".join(f"<li>{inline(x)}</li>" for x in lit)

page = f"""<!doctype html><html lang="sr-Cyrl"><head><meta charset="utf-8"><title>Мини пројекат – Wolt</title>
<style>
@page {{ size: A4; margin: 22mm 20mm 20mm 22mm; }}
body {{ font-family: "Times New Roman", "Liberation Serif", serif; font-size: 12pt; color: #000; margin: 0; font-feature-settings: "locl" 0; }}
h1 {{ font-size: 18pt; margin: 0 0 10pt; }}
.intro {{ text-align: justify; line-height: 1.4; margin: 0 0 14pt; }}
.field {{ display: flex; align-items: baseline; gap: 10pt; margin: 0 0 8pt; }}
.field b {{ white-space: nowrap; }}
.line {{ flex: 1; border-bottom: 1px solid #000; padding: 0 4pt 1pt; }}
.team {{ display: grid; grid-template-columns: max-content 1fr; column-gap: 14pt; row-gap: 6pt; margin: 0 0 14pt; }}
h2 {{ font-size: 12.5pt; font-weight: bold; text-transform: uppercase; text-align: justify; line-height: 1.3; margin: 18pt 0 6pt; break-after: avoid; }}
h3 {{ font-size: 12pt; font-weight: normal; text-align: justify; line-height: 1.35; margin: 10pt 0 4pt; break-after: avoid; }}
.note {{ font-size: 10.5pt; font-style: italic; text-align: justify; margin: 0 0 6pt; }}
.box {{ border: 1px solid #000; padding: 8pt 10pt; margin: 0 0 8pt; font-size: 11.5pt; line-height: 1.38; text-align: justify; }}
.box p {{ margin: 0 0 5pt; }}
.box p:last-child {{ margin-bottom: 0; }}
.box ul {{ margin: 2pt 0 5pt; padding-left: 16pt; }}
.box li {{ margin: 0 0 3pt; }}
figure {{ margin: 8pt 0 6pt; text-align: center; break-inside: avoid; }}
figure img {{ display: block; margin: 0 auto 4pt; }}
figcaption {{ font-style: italic; font-size: 10.5pt; text-align: center; }}
.src {{ font-size: 9pt; text-align: center; color: #222; margin: 2pt 0 6pt; line-height: 1.25; }}
.tcap {{ font-style: italic; font-size: 10.5pt; text-align: center; margin: 8pt 0 3pt; break-after: avoid; }}
table {{ width: 100%; border-collapse: collapse; font-size: 10pt; line-height: 1.25; text-align: left; break-inside: auto; }}
th, td {{ border: 1px solid #555; padding: 3pt 4pt; vertical-align: top; }}
th {{ background: #E6E6E6; text-align: center; }}
tr {{ break-inside: avoid; }}
.lit h2 {{ text-transform: none; font-size: 12.5pt; }}
.lit ol {{ font-size: 10.5pt; line-height: 1.35; padding-left: 18pt; margin: 0; }}
.lit li {{ margin: 0 0 3pt; text-align: justify; }}
</style></head><body>
<h1>МИНИ ПРОЈЕКАТ</h1>
<p class="intro">Мини пројекат је могуће урадити на примеру производне или услужне организације. Спроводи се кроз четири фазе и обухвата сагледавање и процену карактеристика квалитета пре, за време и након куповине или коришћења производа, односно услуге.</p>
<div class="team"><b>Пројектни тим:</b><div><div class="field">1.<span class="line">Вељко Павловић, бр. индекса 1B1/0057/25</span></div><div class="field">2.<span class="line">&nbsp;</span></div></div></div>
<div class="field" style="margin-top:4pt"><b>Пројектни задатак:</b></div>
<div class="field" style="margin-bottom:6pt">Оцена квалитета производа/услуге<span class="line">достава хране преко платформе Wolt (Србија)</span></div>
{"".join(body)}
<div class="lit"><h2>Извори коришћени у одговорима</h2><ol>{lit_html}</ol></div>
</body></html>"""
open(OUT, "w", encoding="utf8").write(page)
print("OK", OUT, "izvori:", len(lit), sorted(used))
