# Попуњава Canva шаблон („White and Black Modern Financial Report“) садржајем
# мини пројекта: сваки слајд одговара на питања из обрасца (1а–4).
# Употреба: python3 prezentacija_sablon.py <sablon.pptx> <dir_sa_slikama> <izlaz.pptx>
import copy
import sys

from lxml import etree
from PIL import ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR
from pptx.util import Emu, Inches, Pt

TPL, ASSETS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
E = 914400
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": A, "p": P, "r": R}
FONT = "Inter"
LANG = "sr-Cyrl-RS"
INTER = {False: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Regular.otf", 1000),
         True: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 1000)}


def q(tag):
    pre, name = tag.split(":")
    return "{%s}%s" % (NS[pre], name)


# ---------- мерење текста (за проверу да ли стаје у оквир) ----------
def width_in(text, size, bold=False):
    return INTER[bold].getlength(text) * size / 1000 / 72


def n_lines(text, size, w, bold=False):
    lines, cur = 1, ""
    for word in text.replace("**", "").split():
        t = (cur + " " + word).strip()
        if width_in(t, size, bold) <= w:
            cur = t
        else:
            lines, cur = lines + 1, word
    return lines


def fit(text, w, start, bold=True, minimum=10):
    s = start
    while s > minimum and width_in(text, s, bold) > w:
        s -= 1
    return s


# ---------- проналажење и измена облика ----------
def shapes_by_name(slide):
    out = {}
    def walk(shs):
        for s in shs:
            out[s.name] = s
            if s.shape_type == 6:
                walk(s.shapes)
    walk(slide.shapes)
    return out


def geom(shape, x=None, y=None, w=None, h=None):
    if x is not None: shape.left = Emu(round(x * E))
    if y is not None: shape.top = Emu(round(y * E))
    if w is not None: shape.width = Emu(round(w * E))
    if h is not None: shape.height = Emu(round(h * E))


def remove(shape):
    el = shape._element
    el.getparent().remove(el)


def fix_rpr(rpr, bold=None, size=None, color=None):
    """Фонт Inter, српски језик, по потреби подебљање, величина и боја."""
    was_bold = False
    for tag in ("a:latin", "a:ea", "a:cs", "a:sym"):
        el = rpr.find(q(tag))
        if el is not None:
            if "Bold" in el.get("typeface", ""):
                was_bold = True
            el.set("typeface", FONT)
    if rpr.get("b") in ("true", "1"):
        was_bold = True
    b = was_bold if bold is None else bold
    if b:
        rpr.set("b", "1")
    elif "b" in rpr.attrib:
        del rpr.attrib["b"]
    rpr.set("lang", LANG)
    if size is not None:
        rpr.set("sz", str(round(size * 100)))
    if color is not None:
        fill = rpr.find(q("a:solidFill"))
        if fill is None:
            fill = etree.SubElement(rpr, q("a:solidFill"))
            rpr.insert(0, fill)
        for c in list(fill):
            fill.remove(c)
        etree.SubElement(fill, q("a:srgbClr")).set("val", color)


def fill(shape, paras, align=None):
    """paras: листа ставки; ставка је текст (**подебљано**) или (текст, опције).
    Опције: size, bold, color, bullet, before (pt)."""
    body = shape._element.find(".//" + q("p:txBody"))
    ps = body.findall(q("a:p"))
    p0 = next((p for p in ps if p.find(q("a:r")) is not None), ps[0])
    ppr0 = p0.find(q("a:pPr"))
    r0 = p0.find(q("a:r"))
    rpr0 = r0.find(q("a:rPr")) if r0 is not None else etree.Element(q("a:rPr"))
    size0 = int(rpr0.get("sz", "1800")) / 100
    for p in ps:
        body.remove(p)
    for item in paras:
        text, o = (item, {}) if isinstance(item, str) else item
        size = o.get("size", size0)
        p = etree.SubElement(body, q("a:p"))
        ppr = copy.deepcopy(ppr0) if ppr0 is not None else etree.Element(q("a:pPr"))
        if align:
            ppr.set("algn", align)
        ln = ppr.find(q("a:lnSpc"))
        if ln is not None:
            pts = ln.find(q("a:spcPts"))
            if pts is not None:
                ratio = o.get("lnf", int(pts.get("val")) / 100 / size0)
                pts.set("val", str(round(size * ratio * 100)))
        for old in ppr.findall(q("a:spcBef")) + ppr.findall(q("a:buChar")) + ppr.findall(q("a:buFont")) + ppr.findall(q("a:buNone")):
            ppr.remove(old)
        if o.get("before"):
            sb = etree.Element(q("a:spcBef"))
            etree.SubElement(sb, q("a:spcPts")).set("val", str(round(o["before"] * 100)))
            idx = 1 if ln is not None else 0
            ppr.insert(idx, sb)
        if o.get("bullet"):
            ppr.set("marL", str(round(size * 1.25 * 12700)))
            ppr.set("indent", str(-round(size * 1.25 * 12700)))
            bf = etree.SubElement(ppr, q("a:buFont")); bf.set("typeface", "Arial")
            etree.SubElement(ppr, q("a:buChar")).set("char", "•")
        p.append(ppr)
        parts = text.split("**")
        for i, part in enumerate(parts):
            if not part:
                continue
            r = etree.SubElement(p, q("a:r"))
            rpr = copy.deepcopy(rpr0)
            bold = True if i % 2 == 1 else o.get("bold")
            fix_rpr(rpr, bold=bold, size=size, color=o.get("color"))
            if rpr.get("spc"):
                rpr.set("spc", str(round(int(rpr.get("spc")) * size / size0)))
            r.append(rpr)
            etree.SubElement(r, q("a:t")).text = part


def set_image_fill(slide, shape, path):
    """Замена слике у облику испуњеном сликом (Canva фотографије)."""
    el = shape._element
    blip = el.find(".//" + q("a:blip"))
    old = blip.get(q("r:embed"))
    _, rid = slide.part.get_or_add_image_part(path)
    blip.set(q("r:embed"), rid)
    for ext in blip.findall(q("a:extLst")):
        blip.remove(ext)
    fr = el.find(".//" + q("a:fillRect"))
    if fr is not None:
        for k in ("l", "t", "r", "b"):
            fr.set(k, "0")
    xml = etree.tostring(slide._element).decode()
    if old and old != rid and ('r:embed="%s"' % old) not in xml and ('"%s"' % old) not in xml:
        slide.part.drop_rel(old)


def shapes_by_name_el(slide, el):
    for s in slide.shapes:
        if s._element is el:
            return s
    raise KeyError


def add_textbox_like(slide, proto, text_paras, x, y, w, h, align=None):
    el = copy.deepcopy(proto._element)
    slide.shapes._spTree.append(el)
    s = shapes_by_name_el(slide, el)
    geom(s, x, y, w, h)
    fill(s, text_paras, align=align)
    return s


def renumber(slide):
    for i, c in enumerate(slide._element.iter(q("p:cNvPr")), start=2):
        c.set("id", str(i))


def header(slide):
    for s in shapes_by_name(slide).values():
        if s.has_text_frame:
            t = s.text_frame.text.strip()
            if t == "Salford Company":
                fill(s, ["БАПУСС · Менаџмент квалитета"])
                geom(s, w=8.0)
            elif t.startswith("15, December"):
                fill(s, ["Београд, новембар 2026."])


def body_lines(text, size, w, lnf=1.36):
    return n_lines(text, size, w) * size * lnf / 72


prs = Presentation(TPL)
S = list(prs.slides)   # S[0] = шаблон 1 ... S[9] = шаблон 10
NOTES = {}

# ===== Шаблон 1 → насловни слајд =====
s = S[0]; sh = shapes_by_name(s); header(s)
big = fit("АНАЛИЗА И УНАПРЕЂЕЊЕ", 13.6, 92)
fill(sh["TextBox 12"], [("АНАЛИЗА И УНАПРЕЂЕЊЕ", {"size": big}), ("КВАЛИТЕТА УСЛУГЕ", {"size": big})])
fill(sh["TextBox 13"], [("ДОСТАВЕ ХРАНЕ", {"size": big})])
lh = big * 1.08 / 72
geom(sh["TextBox 12"], y=4.05, h=2 * lh)
geom(sh["TextBox 13"], y=4.05 + 2 * lh, h=lh)
add_textbox_like(s, sh["TextBox 19"], [("СЕМИНАРСКИ РАД ИЗ ПРЕДМЕТА МЕНАЏМЕНТ КВАЛИТЕТА", {"size": 24, "bold": True, "color": "636161"})],
                 1.12, 3.35, 14.0, 0.45)
fill(sh["TextBox 14"], [("Пример компаније Wolt", {"size": fit("Пример компаније Wolt", 5.8, 40, bold=False)})])
fill(sh["TextBox 15"], ["Кандидат:"])
fill(sh["TextBox 16"], ["Ментор:"])
fill(sh["TextBox 17"], [("Вељко Павловић", {"size": 22}), ("бр. индекса 1B1/0057/25", {"size": 22})])
fill(sh["TextBox 18"], [("Проф. др Зорана Антић", {"size": 22})])
NOTES[0] = ("Тема рада је анализа и унапређење квалитета услуге доставе хране на примеру компаније Wolt у Србији. "
            "Рад је урађен по обрасцу мини пројекта из уџбеника за предмет Менаџмент квалитета, а презентација прати питања из обрасца.")

# ===== Шаблон 2 → увод =====
s = S[1]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 26"], ["УВОД"])
p1 = ("Предмет рада је оцена квалитета услуге доставе хране компаније Wolt у Србији. Циљ је да се кроз мини пројекат "
      "из уџбеника сагледају потребе и очекивања корисника, процени у којој мери услуга испуњава захтеве и предложе мере за унапређење.")
p2 = ("Мини пројекат има четири фазе. Подаци су прикупљени 18. новембра 2026. из три извора. Истраживање на терену замењено је "
      "анализом јавних оцена и рецензија, па налази указују на могуће слабе тачке, али нису репрезентативни.")
fill(sh["TextBox 29"], [p1]); fill(sh["TextBox 30"], [p2])
h1 = body_lines(p1, 18, 10.76)
geom(sh["TextBox 29"], y=4.2, h=h1)
geom(sh["TextBox 30"], y=4.2 + h1 + 0.18, h=body_lines(p2, 18, 10.88))
for tb, lines in (("TextBox 31", ["Услови коришћења", "Wolt"]), ("TextBox 32", ["Закон о заштити", "потрошача"]),
                  ("TextBox 33", ["Оцене и рецензије", "корисника"])):
    fill(sh[tb], lines)
for ff, icon in (("Freeform 23", "LuFileText"), ("Freeform 24", "LuScale"), ("Freeform 25", "LuStar")):
    f = sh[ff]
    cx, cy = (f.left + f.width / 2) / E, (f.top + f.height / 2) / E
    set_image_fill(s, f, f"{ASSETS}/{icon}.png")
    geom(f, cx - 0.6, cy - 0.6, 1.2, 1.2)
NOTES[1] = ("Предмет рада је оцена квалитета услуге доставе хране компаније Wolt у Србији. Циљ је да се сагледају потребе и очекивања корисника, "
            "процени у којој мери услуга испуњава те захтеве и предложе мере за унапређење. Коришћена су три извора: услови коришћења, "
            "Закон о заштити потрошача и јавне оцене корисника. Истраживање на терену замењено је анализом рецензија, па налази нису репрезентативни.")

# ===== Шаблон 3 → Фаза 1 (1а, 1б, 1в) =====
s = S[2]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 18"], [("ФАЗА 1", {"size": 96}), ("Истраживање за рачунаром", {"size": 36, "lnf": 1.25}),
                         ("пре одлуке о коришћењу услуге", {"size": 26, "bold": False, "lnf": 1.3})])
boxes = [("TextBox 24", "TextBox 23", "1а) Очекивања",
          "Корисник очекује велики избор ресторана, једноставно наручивање, тачне податке о цени и времену доставе, "
          "потпуну и топлу храну, љубазног курира и брзу помоћ када нешто пође наопако."),
         ("TextBox 22", "TextBox 20", "1б) Информације",
          "Оцене апликације: App Store (Србија) 4,7 и Google Play 4,3 од 5. Време у апликацији је само процена, без гаранције. "
          "Wolt+ кошта 399 дин. месечно, уз доставу без накнаде до 4 km."),
         ("TextBox 21", "TextBox 19", "1в) Посебне потребе",
          "Податке о алергенима за јела из ресторана партнер даје на захтев. Корисник мора бити доступан при достави. "
          "Одговор на рекламацију стиже до 8, а решење до 15 дана.")]
for tt, tx, title, text in boxes:
    fill(sh[tt], [(title, {"size": fit(title, 4.9, 32)})])
    fill(sh[tx], [text])
NOTES[2] = ("У првој фази сагледане су потребе и очекивања корисника и информације које су доступне пре поруџбине. "
            "Корисник очекује тачне податке о цени и времену доставе, потпуну и топлу храну и брзу помоћ. Услови коришћења наводе да је време доставе само процена. "
            "Претплата Wolt+ кошта 399 динара месечно. Податке о алергенима за храну из ресторана корисник добија на захтев, а на рекламацију се одговара у року од 8 дана.")

# ===== Шаблон 8 → Фаза 2: оцене (2а) =====
s = S[7]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 7"], ["ФАЗА 2"])
fill(sh["TextBox 14"], [("Истраживање на терену: испуњеност захтева (2а)", {"size": 24, "bold": True}),
                         ("Збирне оцене зависе од платформе. Рецензије хвале избор ресторана и брзу, топлу доставу, "
                          "а замерају кашњења, спору подршку и истек Wolt кредита.", {"size": 18, "before": 6})])
geom(sh["TextBox 14"], x=2.6, y=3.2, w=14.8)
for num, lab, desc, n, l, d in (("TextBox 18", "TextBox 20", "TextBox 15", "4,7", "App Store (Србија)", "15.044 оцене корисника"),
                                 ("TextBox 19", "TextBox 21", "TextBox 16", "4,3", "Google Play", "511.355 оцена корисника"),
                                 ("TextBox 23", "TextBox 24", "TextBox 22", "1,2", "Trustpilot", "8.409 рецензија, 86% са оценом 1")):
    fill(sh[num], [n]); fill(sh[lab], [l]); fill(sh[desc], [d])
    geom(sh[lab], w=4.5)
remove(sh["Picture 17"]); remove(sh["Picture 25"])
s.shapes.add_picture(f"{ASSETS}/grafikon_ocene.png", Inches(8.57), Inches(6.05), Inches(10.0), Inches(3.9))
NOTES[7] = ("Збирне оцене дају различиту слику у зависности од платформе: App Store за Србију 4,7, Google Play 4,3, а профил на Trustpilot-у 1,2. "
            "На Trustpilot-у 86% од 8.409 рецензија има најнижу оцену, али тај профил није ограничен на Србију. "
            "Рецензије хвале избор и брзу, топлу доставу, а замерају кашњења, спору подршку и истек кредита.")

# ===== Шаблон 5 → Фаза 2: тачност информација (2б, 2в) =====
s = S[4]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 15"], [("ФАЗА 2", {"size": 96}), ("Тачност информација", {"size": 36, "lnf": 1.25}),
                         ("о услузи и посебним захтевима (2б, 2в)", {"size": 24, "bold": False, "lnf": 1.3})])
geom(sh["TextBox 15"], y=1.95)
cards = [("TextBox 21", "TextBox 17", "2б) Време доставе",
          "Услови јасно наводе да је време само процена, али рецензије о кашњењима показују да га корисници доживљавају као обећање."),
         ("TextBox 23", "TextBox 19", "2б) Цена и Wolt+",
          "Тачност информација о цени и условима претплате не може се проверити без коришћења услуге."),
         ("TextBox 20", "TextBox 16", "2в) Wolt кредити",
          "Корисник наводи да су му кредити истекли после мање од месец дана, па рок важења није довољно уочљив."),
         ("TextBox 22", "TextBox 18", "2в) Алергени",
          "Подаци за јела из ресторана дају се на захтев, што значи додатни корак. Тачност се не може проверити.")]
for tt, tx, title, text in cards:
    fill(sh[tt], [(title, {"size": fit(title, 3.95, 26)})])
    fill(sh[tx], [(text, {"size": 18})])
set_image_fill(s, sh["Freeform 12"], f"{ASSETS}/recenzija_a.png")
add_textbox_like(s, sh["TextBox 13"], [("Рецензија са App Store (Србија), подршка и кашњења", {"size": 15, "color": "636161"})],
                 11.46, 10.28, 7.41, 0.3)
NOTES[4] = ("Кључна информација за корисника је процењено време доставе. Услови га наводе само као процену, али рецензије о кашњењима показују да га корисници доживљавају као обећање. "
            "Тачност цене и услова претплате не може се проверити без коришћења услуге. Рецензија о истеку Wolt кредита показује да рок важења није довољно уочљив, "
            "а подаци о алергенима за храну из ресторана дају се на захтев.")

# ===== Шаблон 7 → Фаза 2: процена по SERVQUAL (2г) =====
s = S[6]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 7"], [("ФАЗА 2", {"size": 96}), ("Карактеристике квалитета (2г)", {"size": 36, "lnf": 1.25})])
q1 = "Карактеристике квалитета процењене су према пет димензија модела SERVQUAL, уз описну оцену: добра, задовољавајућа, променљива или слаба тачка."
q2 = "Најбоље је оцењена апликација, а најслабије одзивност и емпатија корисничке подршке. Налази нису репрезентативни, јер рецензије пишу корисници по сопственом избору."
fill(sh["TextBox 29"], [q1]); fill(sh["TextBox 30"], [q2])
hq1 = body_lines(q1, 18, 7.55)
geom(sh["TextBox 29"], y=5.9, h=hq1)
geom(sh["TextBox 30"], y=5.9 + hq1 + 0.25, h=body_lines(q2, 18, 7.55))
sets = [["Group 8", "TextBox 16", "TextBox 14", "TextBox 18", "AutoShape 20"],
        ["Group 11", "TextBox 17", "TextBox 15", "TextBox 19", "AutoShape 21"],
        ["Group 22", "TextBox 26", "TextBox 25", "TextBox 27", "AutoShape 28"]]
boxes = [[sh[n] for n in names] for names in sets]
for _ in range(2):
    new = []
    for shp in boxes[2]:
        el = copy.deepcopy(shp._element)
        s.shapes._spTree.append(el)
        new.append(shapes_by_name_el(s, el))
    boxes.append(new)
dims = [("Опипљиви елементи", "Добра", "Високе оцене апликације, похвале за паковање"),
        ("Поузданост", "Променљива", "Притужбе на кашњења, хладну и непотпуну храну"),
        ("Одзивност", "Слаба тачка", "Споро и шаблонско одговарање подршке"),
        ("Сигурност", "Задовољавајућа", "Услови у складу са законом; притужба на кредите"),
        ("Емпатија", "Слаба тачка", "Недовољна спремност да се проблем реши")]
for i, ((grp, name, val, txt, line), (n, v, t)) in enumerate(zip(boxes, dims)):
    y = 1.65 + i * 1.73
    geom(grp, y=y, h=1.55)
    fill(name, [(n, {"size": 24})]); geom(name, x=11.87, y=y + 0.27, w=4.6)
    fill(val, [(v, {"size": 22})], align="r"); geom(val, x=15.55, y=y + 0.29, w=3.05)
    fill(txt, [(t, {"size": 17})]); geom(txt, x=11.88, y=y + 0.86, w=6.7)
    x0 = 11.87 + width_in(n, 24, True) + 0.22
    x1 = 18.6 - width_in(v, 22, False) - 0.22
    if x1 - x0 < 0.3:
        remove(line)
    else:
        geom(line, x=x0, y=y + 0.27 + 0.2, w=x1 - x0)
NOTES[6] = ("Карактеристике квалитета процењене су према пет димензија модела SERVQUAL. Опипљиви елементи, пре свега апликација, оцењени су као добри. "
            "Поузданост је променљива, јер део корисника хвали брзу доставу, а други наводе кашњења и хладну храну. Одзивност и емпатија су слабе тачке, "
            "због спорих и шаблонских одговора подршке, а сигурност је задовољавајућа.")

# ===== Шаблон 6 → Фаза 3: анализа (3а, 3б) =====
s = S[5]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 12"], ["ФАЗА 3"])
fill(sh["TextBox 15"], [("Анализа прикупљених података", {"size": 24, "bold": True}),
                         ("Поређење прве и друге фазе (3а) и анализа остварености карактеристика квалитета (3б)", {"size": 18, "before": 6})])
geom(sh["TextBox 15"], x=3.6, y=3.55, w=12.8)
a3 = ("**3а)** Највећи јаз између очекивања и искуства јавља се код времена доставе: услови га наводе као процену, "
      "а корисници га доживљавају као обећање. Слаба тачка је и корисничка подршка.")
b3 = ("**3б)** Најбоље су остварени опипљиви елементи, поузданост је променљива, а најслабије одзивност и емпатија. "
      "Разлика међу платформама показује да оцена зависи од извора.")
fill(sh["TextBox 13"], [a3]); fill(sh["TextBox 14"], [b3])
ha = body_lines(a3, 18, 7.55)
geom(sh["TextBox 13"], y=6.2, h=ha)
geom(sh["TextBox 14"], y=6.2 + ha + 0.22, h=body_lines(b3, 18, 7.55))
# десна половина картице: уместо фотографије табела поређења
photo = sh["Freeform 6"]._element
left = sh["Freeform 8"]._element
sppr = photo.find(q("p:spPr"))
bf = sppr.find(q("a:blipFill"))
old_rid = bf.find(q("a:blip")).get(q("r:embed"))
lfill = left.find(q("p:spPr")).find(q("a:solidFill"))
bf.addprevious(copy.deepcopy(lfill)); sppr.remove(bf)
if lfill is not None and old_rid not in etree.tostring(s._element).decode():
    s.part.drop_rel(old_rid)
rows = [("Елемент", "Фаза 1", "Фаза 2", "Закључак"),
        ("Време доставе", "Процена, без гаранције", "Притужбе на кашњења", "Јаз очекивања и искуства"),
        ("Стање хране", "Потпуна и топла поруџбина", "Похвале, али и хладна храна", "Делимично испуњено"),
        ("Подршка", "Чет; одговор до 8 дана", "Спор, шаблонски одговор", "Слаба тачка"),
        ("Кредити", "Рок одређује компанија", "Притужба на истек кредита", "Нејасна комуникација")]
gf = s.shapes.add_table(len(rows), 4, Inches(10.5), Inches(6.12), Inches(8.15), Inches(3.75))
tbl = gf.table
tblPr = tbl._tbl.find(q("a:tblPr"))
tblPr.set("firstRow", "1"); tblPr.set("bandRow", "0")
sid = tblPr.find(q("a:tableStyleId"))
if sid is None:
    sid = etree.SubElement(tblPr, q("a:tableStyleId"))
sid.text = "{5940675A-B579-460E-94D1-54222C63F5DA}"   # No Style, Table Grid
for i, w in enumerate((1.62, 2.13, 2.15, 2.25)):
    tbl.columns[i].width = Inches(w)
for ri, row in enumerate(rows):
    tbl.rows[ri].height = Inches(0.62 if ri == 0 else 0.78)
    for ci, val in enumerate(row):
        cell = tbl.cell(ri, ci)
        cell.margin_left = cell.margin_right = Inches(0.08)
        cell.margin_top = cell.margin_bottom = Inches(0.04)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.text = val
        r = tf.paragraphs[0].runs[0]
        r.font.size = Pt(15)
        r.font.name = FONT
        head = ri == 0
        r.font.bold = head or ci == 0 or ci == 3
        r.font.color.rgb = RGBColor.from_string("FFFFFF" if head else "222223")
        r._r.get_or_add_rPr().set("lang", LANG)
        if head:
            cell.fill.solid(); cell.fill.fore_color.rgb = RGBColor.from_string("403D39")
NOTES[5] = ("Поређење прве и друге фазе показује да се највећа одступања јављају код времена доставе и корисничке подршке. "
            "Информације које компанија објављује углавном су јасне и усклађене са законом, али се очекивања корисника не поклапају увек са оним што услови формално обећавају. "
            "Најбоље остварена димензија су опипљиви елементи, а најслабије одзивност и емпатија. Велика разлика међу платформама показује да резултат зависи од извора.")

# ===== Шаблон 9 → Фаза 3: усаглашеност и рекламације (3в) =====
s = S[8]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 18"], [("ФАЗА 3", {"size": 96}), ("Усаглашеност и реакција", {"size": 32, "lnf": 1.25}),
                         ("на рекламацију (3в)", {"size": 32, "lnf": 1.25})])
fill(sh["TextBox 19"], ["8 и 15 дана"]); geom(sh["TextBox 19"], w=6.5)
fill(sh["TextBox 21"], ["Рокови за одговор и решавање рекламације из услова коришћења усклађени су са Законом о заштити потрошача."])
fill(sh["TextBox 20"], ["99%"])
fill(sh["TextBox 22"], ["Негативних рецензија на Trustpilot-у добило је одговор, али део корисника наводи шаблонске одговоре без решења."])
fill(sh["TextBox 23"], ["Члан 100 Закона"])
fill(sh["TextBox 24"], ["При кашњењу потрошач може да раскине уговор, али услови процењено време не сматрају гаранцијом."])
set_image_fill(s, sh["Freeform 15"], f"{ASSETS}/recenzija_b.png")
add_textbox_like(s, sh["TextBox 16"], [("Рецензија са App Store (Србија), истек Wolt кредита", {"size": 15, "color": "636161"})],
                 10.75, 10.28, 8.12, 0.3)
NOTES[8] = ("Рокови из услова коришћења, одговор у року од осам дана и решавање у року од 15 дана, усклађени су са Законом о заштити потрошача. "
            "Према члану 100 Закона, потрошач може да раскине уговор ако трговац касни, али пошто процењено време није гаранција, остаје отворено када кашњење постаје повреда уговора. "
            "Компанија је одговорила на 99% негативних рецензија на Trustpilot-у, али поједини корисници наводе да су одговори шаблонски.")

# ===== Шаблон 4 → Фаза 4: предлог за унапређење =====
s = S[3]; sh = shapes_by_name(s); header(s)
fill(sh["TextBox 5"], [("ФАЗА 4", {"size": 96}), ("Предлог за унапређење", {"size": 36, "lnf": 1.25})])
geom(sh["TextBox 5"], w=10.0)
remove(sh["Picture 14"]); remove(sh["Picture 12"]); remove(sh["Picture 13"])
IW = 2.85 * 1360 / 720
s.shapes.add_picture(f"{ASSETS}/ishikawa.png", Inches(15.165 - IW / 2), Inches(1.98), Inches(IW), Inches(2.85))
cap = "Ишикава дијаграм: закашњела или хладна поруџбина"
fill(sh["TextBox 20"], [(cap, {"size": fit(cap, 6.9, 20)})])
geom(sh["TextBox 20"], x=11.6, y=4.92, w=7.1)
mere = ["Време доставе као распон и обавештење чим поруџбина касни",
        "Стандард термичког паковања за партнере",
        "Рок за први одговор у чету и брз прелазак на оператера",
        "Јавно објављена правила надокнаде",
        "Обавештење пре истека Wolt кредита",
        "Редовна анкета корисника по моделу SERVQUAL"]
fill(sh["TextBox 19"], [("Корективне мере (отклањају узрок, а не само последицу):", {"size": 20, "bold": True})] +
     [(m, {"size": 20, "bullet": True, "before": 5}) for m in mere] +
     [("Увођење: планирање → примена → провера → деловање", {"size": 20, "bold": True, "before": 10})])
geom(sh["TextBox 19"], x=1.5, y=5.45, w=8.4)
NOTES[3] = ("Узроци најчешћег проблема, закашњеле или хладне поруџбине, груписани су у Ишикава дијаграму у пет категорија: платформа, ресторан, достављач, окружење и корисник. "
            "Предложене мере су корективне, јер отклањају узрок, а не само последицу. Највећи ефекат имале би мере за време доставе и корисничку подршку. "
            "Мере се уводе у четири корака сталног побољшавања: планирање, пробна примена, провера показатеља и деловање.")

# ===== Шаблон 10 → закључак =====
s = S[9]; sh = shapes_by_name(s); header(s)
t3 = shapes_by_name(S[2])
def clone_from(src_shape):
    el = copy.deepcopy(src_shape._element)
    s.shapes._spTree.append(el)
    return shapes_by_name_el(s, el)
zh = add_textbox_like(s, t3["TextBox 18"], [("ЗАКЉУЧАК", {"size": 54})], 1.12, 1.55, 10.0, 0.9)
concl = [("Group 11", "TextBox 24", "TextBox 23", "Јака страна",
          "Добро развијена апликација и јасни услови коришћења; рокови за рекламације усклађени са законом."),
         ("Group 8", "TextBox 22", "TextBox 20", "Слабе тачке",
          "Поузданост доставе и одзивност подршке. Највећи јаз је процењено време доставе."),
         ("Group 5", "TextBox 21", "TextBox 19", "Препорука",
          "Предложене мере и сопствено истраживање: евиденција поруџбина и анкета корисника у Србији.")]
for i, (g, tt, tx, title, text) in enumerate(concl):
    x = 1.11 + i * 6.155
    grp = clone_from(t3[g]); geom(grp, x=x, y=2.65, h=2.75)
    a = clone_from(t3[tt]); fill(a, [title]); geom(a, x=x + 0.41, y=2.98)
    b = clone_from(t3[tx]); fill(b, [text]); geom(b, x=x + 0.41, y=3.68, h=1.6)
hs = 104
fill(sh["TextBox 9"], [("ХВАЛА", {"size": hs})]); fill(sh["TextBox 10"], [("НА ПАЖЊИ", {"size": hs})])
geom(sh["TextBox 9"], y=5.75, h=1.5); geom(sh["TextBox 10"], y=7.25, h=1.5)
fill(sh["TextBox 11"], ["Кандидат:"]); fill(sh["TextBox 12"], ["Ментор:"])
fill(sh["TextBox 13"], [("Вељко Павловић", {"size": 22})]); fill(sh["TextBox 14"], [("Проф. др Зорана Антић", {"size": 22})])
NOTES[9] = ("Мини пројекат је показао да квалитет услуге доставе хране зависи од рада платформе, ресторана и курира, а корисник оцењује целину. "
            "Wolt има добро развијену апликацију и јасне услове коришћења. Најслабије тачке су поузданост доставе и одзивност подршке, а највећи јаз је код процењеног времена доставе. "
            "За поуздану оцену квалитета потребно је сопствено истраживање на терену, јер јавне рецензије дају корисну, али непотпуну и пристрасну слику.")

# ---------- фонтови и језик у свим преосталим текстовима ----------
for sl in S:
    for rpr in list(sl._element.iter(q("a:rPr"))) + list(sl._element.iter(q("a:endParaRPr"))) + list(sl._element.iter(q("a:defRPr"))):
        fix_rpr(rpr)
    renumber(sl)

# ---------- белешке за излагање ----------
for i, text in NOTES.items():
    S[i].notes_slide.notes_text_frame.text = text

# ---------- редослед: 1, 2, 3, 8, 5, 7, 6, 9, 4, 10 ----------
lst = prs.slides._sldIdLst
ids = list(lst)
for el in ids:
    lst.remove(el)
for i in (1, 2, 3, 8, 5, 7, 6, 9, 4, 10):
    lst.append(ids[i - 1])

# ---------- уграђени Canva фонтови (без ћирилице) се уклањају ----------
pres_el = prs.part._element
efl = pres_el.find(q("p:embeddedFontLst"))
if efl is not None:
    for rid_el in efl.iter():
        rid = rid_el.get(q("r:id"))
        if rid:
            prs.part.drop_rel(rid)
    pres_el.remove(efl)
prs.core_properties.title = "Анализа и унапређење квалитета услуге доставе хране – пример компаније Wolt"
prs.core_properties.author = "Вељко Павловић"
prs.save(OUT)
print("OK", OUT)
