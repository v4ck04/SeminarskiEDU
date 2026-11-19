// Презентација семинарског рада (10 слајдова) за излагање на вежбама.
// Употреба: NODE_PATH=<node_modules са pptxgenjs, react-icons, sharp> node prezentacija.js <izlaz.pptx> <apply_theme.js>
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const OUT = process.argv[2] || "prezentacija.pptx";
const { applyTheme } = require(process.argv[3]);
const IMG = (f) => path.join(__dirname, f);

const THEME = {
  name: "Wolt kvalitet usluge",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A37", lt1: "FFFFFF", dk2: "12304A", lt2: "EEF4F8",
    accent1: "0B7FB3", accent2: "E07B24", accent3: "2B8A5E", accent4: "C93C36",
    accent5: "C98A10", accent6: "5F7488", hlink: "0B7FB3", folHlink: "5F7488",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5,625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Анализа и унапређење квалитета услуге доставе хране – пример компаније Wolt";
pres.author = "Вељко Павловић";
pres.subject = "Менаџмент квалитета";
const C = pres.SchemeColor;

// ---------- иконе ----------
async function icon(name, color = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + color, size: 256 }));
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
// икона у обојеном кругу (мотив целе презентације)
async function badge(slide, name, x, y, d, fill, key) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: key + "-krug" });
  const p = d * 0.25;
  slide.addImage({ data: await icon(name), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: key, objectName: key + "-ikona" });
}
// језик текста: српски (ћирилица) уместо подразумеваног en-US
async function setLang(file, lang) {
  const fs = require("fs");
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files)) {
    if (!/^ppt\/(slides|slideLayouts|slideMasters|charts|notesSlides)\/[^/]+\.xml$/.test(name)) continue;
    const xml = await zip.file(name).async("string");
    zip.file(name, xml.replace(/lang="en-US"/g, `lang="${lang}"`).replace(/<c:lang val="en-US"\/>/g, `<c:lang val="${lang}"/>`));
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}
const shadow = () => ({ type: "outer", color: "1F2A37", blur: 6, offset: 2, angle: 90, opacity: 0.12 });

// ---------- распореди ----------
const FOOT = "Вељко Павловић · Менаџмент квалитета · БАПУСС";
pres.defineSlideMaster({
  title: "NASLOVNI",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.5, w: 6.2, h: 1.55, fontSize: 30, bold: true, align: "left",
      color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SADRZAJ",
  background: { color: C.background1 },
  margin: [0.4, 0.5, 0.5, 0.5],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.28, w: 9.0, h: 0.72, fontSize: 28, bold: true, align: "left",
      color: C.text2, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.5, y: 5.2, w: 6.0, h: 0.28, fontSize: 10, color: C.accent6, valign: "top", margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.28, fontSize: 10, color: C.accent6, align: "right", margin: 0 },
});
pres.defineSlideMaster({
  title: "ZAVRSNI",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.28, w: 9.0, h: 0.72, fontSize: 28, bold: true, align: "left",
      color: C.background1, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.5, y: 5.2, w: 6.0, h: 0.28, fontSize: 10, color: C.background2, valign: "top", margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.28, fontSize: 10, color: C.background2, align: "right", margin: 0 },
});

const izvor = (slide, text) => slide.addText(text, {
  x: 0.5, y: 4.9, w: 9.0, h: 0.26, fontSize: 10, color: C.accent6, margin: 0, isTextBox: true, objectName: "izvor",
});
const card = (slide, x, y, w, h, key, fill = C.background2) => slide.addShape(pres.ShapeType.roundRect, {
  x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: key,
});

async function build() {
  // ===== 1. Насловни слајд =====
  pres.addSection({ title: "Увод" });
  let s = pres.addSlide({ masterName: "NASLOVNI", sectionTitle: "Увод" });
  s.addText("Београдска академија пословних и уметничких струковних студија", {
    x: 0.6, y: 0.45, w: 6.4, h: 0.3, fontSize: 12, color: C.background2, margin: 0, isTextBox: true, objectName: "skola" });
  s.addText("СЕМИНАРСКИ РАД ИЗ ПРЕДМЕТА МЕНАЏМЕНТ КВАЛИТЕТА", {
    x: 0.6, y: 1.1, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: C.accent2, charSpacing: 1, margin: 0, isTextBox: true, objectName: "vrsta" });
  s.addText([
    { text: "Анализа и унапређење", options: { breakLine: true } },
    { text: "квалитета услуге", options: { breakLine: true } },
    { text: "доставе хране" },
  ], { placeholder: "title" });
  s.addText("Пример компаније Wolt", {
    x: 0.6, y: 3.15, w: 6.1, h: 0.45, fontSize: 22, color: C.background2, margin: 0, isTextBox: true, objectName: "podnaslov" });
  s.addText([
    { text: "Кандидат: Вељко Павловић, бр. индекса 1B1/0057/25", options: { breakLine: true } },
    { text: "Ментор: Проф. др Зорана Антић", options: { breakLine: true } },
    { text: "Београд, новембар 2026." },
  ], { x: 0.6, y: 4.0, w: 6.1, h: 0.95, fontSize: 14, color: C.background2, margin: 0, paraSpaceAfter: 3, isTextBox: true, objectName: "autor" });
  await badge(s, "FaMotorcycle", 7.05, 1.3, 2.3, C.accent1, "dostava");
  await badge(s, "FaUtensils", 6.85, 3.55, 1.05, C.accent2, "hrana");
  await badge(s, "FaStar", 8.45, 3.75, 0.85, C.accent3, "ocena");
  s.addNotes("Тема рада је анализа и унапређење квалитета услуге доставе хране на примеру компаније Wolt у Србији. Рад је урађен по обрасцу мини пројекта из уџбеника за предмет Менаџмент квалитета.");

  // ===== 2. Циљ и ток мини пројекта =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Увод" });
  s.addText("Циљ рада и ток мини пројекта", { placeholder: "title" });
  card(s, 0.5, 1.2, 3.75, 3.55, "cilj-kartica");
  s.addText([
    { text: "Предмет", options: { bold: true, color: C.accent1, fontSize: 15, breakLine: true } },
    { text: "Оцена квалитета услуге доставе хране компаније Wolt у Србији", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Циљ", options: { bold: true, color: C.accent1, fontSize: 15, breakLine: true } },
    { text: "Сагледати очекивања корисника, проценити колико их услуга испуњава и предложити мере унапређења", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Подаци (18.11.2026)", options: { bold: true, color: C.accent1, fontSize: 15, breakLine: true } },
    { text: "Услови коришћења Wolt, Закон о заштити потрошача, App Store, Google Play и Trustpilot" },
  ], { x: 0.75, y: 1.38, w: 3.3, h: 3.2, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "cilj-tekst" });
  const faze = [
    ["Истраживање за рачунаром", "потребе корисника и информације пре поруџбине"],
    ["Истраживање на терену", "јавне оцене и рецензије корисника"],
    ["Анализа прикупљених података", "поређење фаза 1 и 2, усаглашеност са законом"],
    ["Предлог унапређења", "узроци проблема и корективне мере"],
  ];
  s.addShape(pres.ShapeType.line, { x: 4.98, y: 1.6, w: 0, h: 2.6, line: { color: C.accent1, width: 1.5, dashType: "dash" }, objectName: "faze-linija" });
  faze.forEach(([h, d], i) => {
    const y = 1.22 + i * 0.88;
    s.addShape(pres.ShapeType.ellipse, { x: 4.63, y, w: 0.7, h: 0.7, fill: { color: C.accent1 }, line: { color: C.background1, width: 2 }, objectName: `faza${i + 1}-krug` });
    s.addText(String(i + 1), { x: 4.63, y, w: 0.7, h: 0.7, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `faza${i + 1}-broj` });
    s.addText([
      { text: `Фаза ${i + 1}: ${h}`, options: { bold: true, fontSize: 15, color: C.text2, breakLine: true } },
      { text: d, options: { fontSize: 14, color: C.text1 } },
    ], { x: 5.55, y: y - 0.02, w: 3.95, h: 0.74, valign: "middle", margin: 0, isTextBox: true, objectName: `faza${i + 1}-tekst` });
  });
  izvor(s, "Образац мини пројекта: Антић, З. (2022), Менаџмент квалитета, БАПУСС, Београд");
  s.addNotes("Предмет рада је оцена квалитета услуге доставе хране компаније Wolt у Србији. Циљ је да се кроз мини пројекат сагледају потребе и очекивања корисника, процени у којој мери услуга испуњава те захтеве и предложе мере за унапређење. Мини пројекат има четири фазе. Истраживање на терену замењено је анализом јавно доступних оцена и рецензија корисника, па налази указују на могуће слабе тачке, али нису репрезентативни.");

  // ===== 3. Теоријски оквир =====
  pres.addSection({ title: "Теоријски оквир" });
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Теоријски оквир" });
  s.addText("Квалитет услуге: ISO 9000 и SERVQUAL", { placeholder: "title" });
  card(s, 0.5, 1.2, 4.1, 3.55, "iso-kartica");
  s.addText("ISO 9000:2015", { x: 0.75, y: 1.35, w: 3.6, h: 0.35, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "iso-naslov" });
  s.addText("„Квалитет је степен до кога скуп својствених карактеристика неког објекта испуњава захтеве.“", {
    x: 0.75, y: 1.75, w: 3.6, h: 1.25, fontSize: 18, fontFace: THEME.headFontFace, color: C.text2, valign: "top", margin: 0, isTextBox: true, objectName: "iso-definicija" });
  s.addText([
    { text: "Захтев: ", options: { bold: true } },
    { text: "наведена, подразумевана или обавезна потреба или очекивање", options: { breakLine: true } },
    { text: "Корективна мера: ", options: { bold: true } },
    { text: "отклања узрок неусаглашености, а не само њену последицу" },
  ], { x: 0.75, y: 3.1, w: 3.6, h: 1.5, fontSize: 14, color: C.text1, paraSpaceAfter: 6, valign: "top", margin: 0, isTextBox: true, objectName: "iso-pojmovi" });
  s.addText("SERVQUAL: пет димензија квалитета услуге", { x: 5.0, y: 1.2, w: 4.5, h: 0.35, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "sq-naslov" });
  const dim = [
    ["FaMobileAlt", "Опипљиви елементи", "изглед опреме, особља и материјала"],
    ["FaCheckCircle", "Поузданост", "тачно и поуздано извршење обећаног"],
    ["FaBolt", "Одзивност", "спремност да се помогне брзо"],
    ["FaShieldAlt", "Сигурност", "знање и љубазност који уливају поверење"],
    ["FaHeart", "Емпатија", "индивидуална пажња кориснику"],
  ];
  for (let i = 0; i < dim.length; i++) {
    const [ic, n, d] = dim[i];
    const y = 1.68 + i * 0.63;
    await badge(s, ic, 5.0, y + 0.04, 0.48, C.accent1, "sq" + (i + 1));
    s.addText([
      { text: n, options: { bold: true, color: C.text2, breakLine: true } },
      { text: d, options: { color: C.text1 } },
    ], { x: 5.65, y, w: 3.85, h: 0.56, fontSize: 14, valign: "middle", margin: 0, isTextBox: true, objectName: "sq" + (i + 1) + "-tekst" });
  }
  izvor(s, "Извор: ISO 9000:2015; Parasuraman, Zeithaml, Berry (1988), Journal of Retailing, 64(1)");
  s.addNotes("Према стандарду ISO 9000:2015 квалитет је степен до кога скуп својствених карактеристика испуњава захтеве, а захтев може бити наведен, уобичајено подразумеван или обавезан. За четврту фазу важна је разлика између корекције, која отклања неусаглашеност, и корективне мере, која отклања њен узрок. Модел SERVQUAL мери квалитет услуге као разлику између очекивања и перцепције корисника кроз пет димензија.");

  // ===== 4. Wolt и ток услуге =====
  pres.addSection({ title: "Мини пројекат" });
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Wolt: платформа, ресторан и курир", { placeholder: "title" });
  s.addImage({ path: IMG("slika_tok.png"), x: 0.4, y: 1.25, w: 6.1, h: 6.1 * 580 / 1320,
    altText: "Ток услуге: корисник, платформа Wolt, ресторан, достављач и корисничка подршка", objectName: "slika-tok" });
  s.addText("Слика 1. Ток услуге доставе хране и учесници у њеном пружању", {
    x: 0.5, y: 3.95, w: 5.9, h: 0.28, fontSize: 11, color: C.accent6, margin: 0, isTextBox: true, objectName: "slika1-natpis" });
  s.addText("Уговор о куповини закључују корисник и партнер (ресторан), а доставу обављају партнери достављачи", {
    x: 0.5, y: 4.27, w: 5.9, h: 0.55, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "ugovor" });
  const stat = [["2014", "основан у Хелсинкију"], ["2022", "део компаније DoorDash"], ["23 од 27", "земаља DoorDash-а под брендом Wolt"]];
  stat.forEach(([n, l], i) => {
    const y = 1.2 + i * 1.2;
    card(s, 6.85, y, 2.65, 1.08, "stat" + (i + 1) + "-kartica");
    s.addText([
      { text: n, options: { fontSize: 28, bold: true, color: C.accent1, fontFace: THEME.headFontFace, breakLine: true } },
      { text: l, options: { fontSize: 14, color: C.text1 } },
    ], { x: 7.05, y: y + 0.06, w: 2.3, h: 0.96, valign: "middle", margin: 0, isTextBox: true, objectName: "stat" + (i + 1) });
  });
  izvor(s, "Извор: Wolt (2022), DoorDash Completes Acquisition of Wolt; Wolt (2025), User Terms of Service – Serbia");
  s.addNotes("Wolt је технолошка компанија из Хелсинкија, основана 2014. године, која је 2022. постала део компаније DoorDash. У Србији услугу пружа Wolt d.o.o. из Београда. Услуга има три дела: избор и плаћање у апликацији, припрему у ресторану и доставу. Уговор о куповини закључују корисник и партнер, а доставу обављају партнери достављачи. Када дође до проблема, корисник се обраћа подршци преко чета, која поступа у име партнера.");

  // ===== 5. Фаза 1 =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Фаза 1: информације пре поруџбине", { placeholder: "title" });
  const info = [
    ["FaStar", C.accent5, "Оцене апликације", "App Store (Србија) 4,7 и Google Play 4,3 од 5"],
    ["FaClock", C.accent1, "Време доставе", "Приказано време је само процена, без гаранције"],
    ["FaMotorcycle", C.accent2, "Претплата Wolt+", "399 дин. месечно, достава без накнаде до 4 km"],
    ["FaClipboardCheck", C.accent3, "Рекламације", "Одговор до 8 дана, решење најкасније до 15 дана"],
    ["FaUserClock", C.accent6, "Обавезе корисника", "Без одзива 5 мин. и после два позива: отказ и пуна наплата"],
    ["FaExclamationTriangle", C.accent4, "Алергени", "Код ресторана подаци се дају на захтев корисника"],
  ];
  for (let i = 0; i < info.length; i++) {
    const [ic, col, h, t] = info[i];
    const x = 0.5 + (i % 3) * 3.05, y = 1.2 + Math.floor(i / 3) * 1.85;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 2.9, h: 1.7, rectRadius: 0.08, fill: { color: C.background1 },
      line: { color: C.background2, width: 1 }, shadow: shadow(), objectName: "info" + (i + 1) + "-kartica" });
    await badge(s, ic, x + 0.18, y + 0.18, 0.5, col, "info" + (i + 1));
    s.addText(h, { x: x + 0.8, y: y + 0.18, w: 1.95, h: 0.5, fontSize: 15, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: "info" + (i + 1) + "-naslov" });
    s.addText(t, { x: x + 0.18, y: y + 0.78, w: 2.56, h: 0.82, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "info" + (i + 1) + "-tekst" });
  }
  izvor(s, "Извор: App Store, Google Play (18.11.2026); Wolt (2025), User Terms of Service – Serbia; Wolt (2026), Wolt+");
  s.addNotes("Пре прве поруџбине корисник може да провери оцене апликације, услове претплате Wolt+ и услове коришћења. Услови изричито наводе да је време доставе само процена. Претплата Wolt+ кошта 399 динара месечно, уз најмању корпу од 699 динара за ресторане и 2.499 за продавнице и 30 дана бесплатног пробног периода. На рекламацију се одговара у року од 8 дана, а решава се најкасније у року од 15 дана. Корисник са алергијом податке о храни из ресторана добија на захтев.");

  // ===== 6. Фаза 2: оцене =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Фаза 2: оцена зависи од извора", { placeholder: "title" });
  s.addChart(pres.ChartType.bar, [{ name: "Просечна оцена", labels: ["App Store (Србија)", "Google Play", "Trustpilot"], values: [4.7, 4.3, 1.2] }], {
    x: 0.4, y: 1.15, w: 5.4, h: 2.75, barDir: "col", barGapWidthPct: 70,
    chartColors: [HEX.accent3, HEX.accent1, HEX.accent4],
    showTitle: true, title: "Просечна оцена (1–5)", titleFontSize: 13, titleColor: C.text2, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelColor: C.text1,
    dataLabelFormatCode: "0.0", dataLabelFontFace: "+mn-lt",
    valAxisMinVal: 0, valAxisMaxVal: 5, valAxisMajorUnit: 1, valAxisLabelFontSize: 11, valAxisLabelColor: C.accent6, valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, catAxisLabelColor: C.text1, catAxisLabelFontFace: "+mn-lt",
    valGridLine: { color: "DCE3EA", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false,
    objectName: "grafikon-ocene", altText: "Просечне оцене: App Store 4,7, Google Play 4,3, Trustpilot 1,2",
  });
  card(s, 0.5, 4.0, 5.2, 0.8, "trustpilot-kartica");
  s.addText([
    { text: "Trustpilot: ", options: { bold: true, color: C.accent4 } },
    { text: "8.409 рецензија, 86% са најнижом оценом; профил није ограничен на Србију" },
  ], { x: 0.7, y: 4.05, w: 4.85, h: 0.7, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "trustpilot" });
  s.addImage({ path: IMG("slika2.png"), x: 6.3, y: 1.15, w: 3.4 * 820 / 976, h: 3.4,
    altText: "Три рецензије са App Store: подршка и кашњења, истек кредита, позитивна рецензија са промотивним кодом", objectName: "slika-recenzije" });
  s.addText("Најкорисније рецензије, App Store (Србија)", {
    x: 6.2, y: 4.58, w: 3.3, h: 0.28, fontSize: 11, color: C.accent6, align: "center", margin: 0, isTextBox: true, objectName: "slika3-natpis" });
  izvor(s, "Извор: App Store (15.044 оцене), Google Play (511.355 оцена), Trustpilot (8.409 рецензија), 18.11.2026");
  s.addNotes("Збирне оцене дају различиту слику у зависности од платформе. На App Store продавници за Србију апликација има оцену 4,7, на Google Play 4,3, а профил на платформи Trustpilot 1,2. Рецензије које App Store приказује као најкорисније замерају споро одговарање подршке, кашњења и истек Wolt кредита. Позитивна рецензија хвали брзу и топлу доставу, али садржи и лични промотивни код, што показује да ни позитивне оцене нису увек непристрасне.");

  // ===== 7. Фаза 2: SERVQUAL процена =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Фаза 2: процена по моделу SERVQUAL", { placeholder: "title" });
  const proc = [
    ["FaMobileAlt", "Опипљиви елементи", "Високе оцене апликације, похвале за паковање", "Добра", C.accent3],
    ["FaCheckCircle", "Поузданост", "Притужбе на кашњења, хладну и непотпуну храну", "Променљива", C.accent5],
    ["FaBolt", "Одзивност", "Споро и шаблонско одговарање подршке", "Слаба тачка", C.accent4],
    ["FaShieldAlt", "Сигурност", "Услови усклађени са законом; притужба на истек кредита", "Задовољавајућа", C.accent1],
    ["FaHeart", "Емпатија", "Недовољна спремност да се проблем реши", "Слаба тачка", C.accent4],
  ];
  for (let i = 0; i < proc.length; i++) {
    const [ic, n, f, v, col] = proc[i];
    const y = 1.2 + i * 0.68;
    card(s, 0.5, y, 9.0, 0.6, "red" + (i + 1));
    await badge(s, ic, 0.62, y + 0.08, 0.44, C.accent1, "dim" + (i + 1));
    s.addText(n, { x: 1.2, y, w: 2.0, h: 0.6, fontSize: 15, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: "dim" + (i + 1) + "-naziv" });
    s.addText(f, { x: 3.4, y, w: 4.15, h: 0.6, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "dim" + (i + 1) + "-nalaz" });
    s.addShape(pres.ShapeType.roundRect, { x: 7.65, y: y + 0.11, w: 1.7, h: 0.38, rectRadius: 0.19, fill: { color: col }, line: { color: col }, objectName: "dim" + (i + 1) + "-ocena-oblik" });
    s.addText(v, { x: 7.65, y: y + 0.11, w: 1.7, h: 0.38, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "dim" + (i + 1) + "-ocena" });
  }
  s.addText("Ограничење: рецензије пишу корисници по сопственом избору, па налази нису репрезентативни", {
    x: 0.5, y: 4.6, w: 9.0, h: 0.28, fontSize: 12, color: C.text1, margin: 0, isTextBox: true, objectName: "ogranicenje" });
  izvor(s, "Извор: приказ аутора на основу података из прве и друге фазе мини пројекта (Табела 2)");
  s.addNotes("Карактеристике квалитета процењене су према пет димензија модела SERVQUAL. Најбоље је оцењена апликација, односно опипљиви елементи. Поузданост је променљива, јер део корисника хвали брзу и топлу доставу, а други наводе кашњења и хладну храну. Одзивност и емпатија су слабе тачке, због спорих и шаблонских одговора подршке. Сигурност је задовољавајућа, јер су услови усклађени са законом, али корисници замерају истек кредита.");

  // ===== 8. Фаза 3 =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Фаза 3: највећи јаз је време доставе", { placeholder: "title" });
  const th = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 } });
  const td = (t, o = {}) => ({ text: t, options: { color: C.text1, fontSize: 13, ...o } });
  const zak = (t, col) => td(t, { bold: true, color: col });
  s.addTable([
    [th("Елемент"), th("Фаза 1: очекивање"), th("Фаза 2: налаз"), th("Закључак")],
    [td("Време доставе", { bold: true }), td("Процена, без гаранције"), td("Притужбе на кашњења"), zak("Јаз очекивања и искуства", C.accent4)],
    [td("Стање хране", { bold: true }), td("Потпуна и топла поруџбина"), td("Похвале, али и хладна храна"), zak("Делимично испуњено", C.accent5)],
    [td("Подршка", { bold: true }), td("Чет; одговор до 8 дана"), td("Спор и шаблонски одговор"), zak("Слаба тачка", C.accent4)],
    [td("Кредити", { bold: true }), td("Рок важења одређује компанија"), td("Притужба на истек кредита"), zak("Нејасна комуникација", C.accent5)],
  ], {
    x: 0.5, y: 1.2, w: 6.0, colW: [1.42, 1.55, 1.5, 1.53], rowH: 0.62, valign: "middle", margin: [3, 5, 3, 5],
    border: { type: "solid", pt: 0.75, color: "C9D3DD" }, fill: { color: C.background1 }, objectName: "tabela-poredjenje",
  });
  card(s, 6.8, 1.2, 2.7, 3.25, "zakon-kartica");
  await badge(s, "FaBalanceScale", 6.98, 1.36, 0.5, C.accent1, "zakon");
  s.addText("Закон о заштити потрошача", { x: 7.58, y: 1.33, w: 1.8, h: 0.56, fontSize: 14, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: "zakon-naslov" });
  s.addText([
    { text: "Рокови 8 и 15 дана ", options: { bold: true } },
    { text: "усклађени су са Законом", options: { breakLine: true } },
    { text: "Чл. 100: ", options: { bold: true } },
    { text: "при кашњењу потрошач може да раскине уговор, али процена није гаранција", options: { breakLine: true } },
    { text: "Одговорност ", options: { bold: true } },
    { text: "партнера и платформе кориснику није јасна" },
  ], { x: 6.98, y: 2.0, w: 2.38, h: 2.7, fontSize: 14, color: C.text1, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true, objectName: "zakon-tekst" });
  izvor(s, "Извор: приказ аутора (Табела 3); Закон о заштити потрошача, „Службени гласник РС“, бр. 35/2026, чл. 100");
  s.addNotes("Поређење прве и друге фазе показује да су информације које компанија објављује углавном јасне и усклађене са законом, али да се очекивања корисника не поклапају увек са искуством. Највећи јаз је код времена доставе: услови га наводе као процену, а корисници га доживљавају као обећање. Рокови за рекламације усклађени су са Законом о заштити потрошача. По члану 100 потрошач може да раскине уговор ако трговац касни, али пошто процењено време није гаранција, остаје отворено када кашњење постаје повреда уговора.");

  // ===== 9. Фаза 4 =====
  s = pres.addSlide({ masterName: "SADRZAJ", sectionTitle: "Мини пројекат" });
  s.addText("Фаза 4: узроци и корективне мере", { placeholder: "title" });
  s.addImage({ path: IMG("slika_ishikawa.png"), x: 0.4, y: 1.15, w: 5.4, h: 5.4 * 720 / 1360,
    altText: "Ишикава дијаграм: узроци закашњеле или хладне поруџбине у пет категорија", objectName: "slika-ishikawa" });
  s.addText("Слика 4. Узроци закашњеле или хладне поруџбине (Ишикава дијаграм)", {
    x: 0.5, y: 4.03, w: 5.3, h: 0.26, fontSize: 11, color: C.accent6, margin: 0, isTextBox: true, objectName: "slika4-natpis" });
  const pdca = ["Планирање", "Примена", "Провера", "Деловање"];
  pdca.forEach((t, i) => {
    s.addShape(i === 0 ? pres.ShapeType.homePlate : pres.ShapeType.chevron, { x: 0.5 + i * 1.32, y: 4.36, w: 1.4, h: 0.44,
      fill: { color: i % 2 ? C.accent2 : C.text2 }, line: { color: C.background1, width: 1 }, objectName: "pdca" + (i + 1) + "-oblik" });
    s.addText(t, { x: 0.62 + i * 1.32, y: 4.36, w: 1.2, h: 0.44, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "pdca" + (i + 1) });
  });
  s.addText("Кључне мере", { x: 6.2, y: 1.15, w: 3.3, h: 0.36, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "mere-naslov" });
  const mere = [
    ["FaClock", "Време доставе као распон и обавештење о кашњењу"],
    ["FaThermometerHalf", "Стандард термичког паковања за партнере"],
    ["FaComments", "Рок за први одговор у чету"],
    ["FaCoins", "Јавно објављена правила надокнаде"],
    ["FaClipboardList", "Редовна анкета корисника по моделу SERVQUAL"],
  ];
  for (let i = 0; i < mere.length; i++) {
    const [ic, t] = mere[i];
    const y = 1.6 + i * 0.64;
    await badge(s, ic, 6.2, y + 0.04, 0.46, C.accent2, "mera" + (i + 1));
    s.addText(t, { x: 6.8, y, w: 2.7, h: 0.56, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "mera" + (i + 1) + "-tekst" });
  }
  izvor(s, "Извор: приказ и предлог аутора (Слика 4 и Табела 4)");
  s.addNotes("Да би се предложиле корективне мере, прво су утврђени могући узроци најчешћег проблема, закашњеле или хладне поруџбине, помоћу Ишикава дијаграма са пет категорија: платформа, ресторан, достављач, окружење и корисник. Предложене мере отклањају узроке, а не само последице. Највећи ефекат могле би да имају мере за време доставе и корисничку подршку. Мере се уводе у четири корака сталног побољшавања: планирање, пробна примена, провера показатеља и деловање, односно проширење успешних мера.");

  // ===== 10. Закључак =====
  pres.addSection({ title: "Закључак" });
  s = pres.addSlide({ masterName: "ZAVRSNI", sectionTitle: "Закључак" });
  s.addText("Закључак", { placeholder: "title" });
  const zakl = [
    ["FaMobileAlt", C.accent3, "Јака страна", "Добра апликација и јасни услови; рокови за рекламације усклађени са законом"],
    ["FaExclamationTriangle", C.accent4, "Слабе тачке", "Поузданост доставе (кашњења, хладна храна) и одзивност подршке"],
    ["FaClock", C.accent2, "Највећи јаз", "Процењено време доставе корисници доживљавају као обећање"],
  ];
  for (let i = 0; i < zakl.length; i++) {
    const [ic, col, h, t] = zakl[i];
    const x = 0.5 + i * 3.05;
    card(s, x, 1.2, 2.9, 2.3, "zakljucak" + (i + 1) + "-kartica", C.background1);
    await badge(s, ic, x + 0.2, 1.4, 0.6, col, "zakljucak" + (i + 1));
    s.addText(h, { x: x + 0.95, y: 1.4, w: 1.8, h: 0.6, fontSize: 17, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: "zakljucak" + (i + 1) + "-naslov" });
    s.addText(t, { x: x + 0.2, y: 2.15, w: 2.5, h: 1.25, fontSize: 16, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "zakljucak" + (i + 1) + "-tekst" });
  }
  await badge(s, "FaLightbulb", 0.5, 3.86, 0.5, C.accent2, "preporuka");
  s.addText("За поуздану оцену потребно је сопствено истраживање на терену: евиденција поруџбина и анкета корисника у Србији", {
    x: 1.15, y: 3.78, w: 5.6, h: 0.74, fontSize: 15, color: C.background1, valign: "middle", margin: 0, isTextBox: true, objectName: "preporuka-tekst" });
  s.addText("Хвала на пажњи", { x: 6.75, y: 3.78, w: 2.75, h: 0.74, fontSize: 18, bold: true, fontFace: THEME.headFontFace,
    color: C.accent2, align: "right", valign: "middle", margin: 0, isTextBox: true, objectName: "hvala" });
  s.addNotes("Мини пројекат је показао да квалитет услуге доставе хране зависи од рада платформе, ресторана и курира, а корисник оцењује целину. Wolt има добро развијену апликацију и јасне услове коришћења. Најслабије тачке су поузданост доставе и одзивност корисничке подршке, а највећи јаз је код процењеног времена доставе. Предложене мере усмерене су на узроке проблема. За поуздану оцену квалитета било би потребно сопствено истраживање на терену, јер јавне рецензије дају корисну, али непотпуну и пристрасну слику.");

  await pres.writeFile({ fileName: OUT });
  await setLang(OUT, "sr-Cyrl-RS");
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
}
build().catch((e) => { console.error(e); process.exit(1); });
