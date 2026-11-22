// Гради Word документ семинарског рада „Главни канали директног маркетинга“ према Упутству БАПУСС:
// A4, маргине 2,5 cm, проред 1, текст TNR 12, наслови 16/14, фусноте TNR 10 (и за изворе слика и табела).
// Употреба: node build.js <izlaz.docx> [strane.json]
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, FootnoteReferenceRun, AlignmentType, HeadingLevel, Table,
  TableRow, TableCell, WidthType, BorderStyle, ShadingType, Footer, PageNumber, TabStopType,
  LevelFormat, SectionType, VerticalAlign, NumberFormat, ImageRun,
} = require("docx");
const { meta, izvori, telo, literatura, dopuna } = require("./sadrzaj.js");

const out = process.argv[2] || "rad.docx";
const strane = process.argv[3] && fs.existsSync(process.argv[3])
  ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : {};

const FONT = "Times New Roman";
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1417;
const TEXT_W = A4.width - 2 * MARGIN;
const LINE = 240; // проред 1

// ---------- курзив, подебљано, истицање допуна ----------
function runs(text, base = {}) {
  const r = [];
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[ДОПУНИТИ[^\]]*\])/).forEach((part) => {
    if (!part) return;
    if (part.startsWith("[ДОПУНИТИ")) {
      // допуна може садржати курзив
      part.split(/(\*[^*]+\*)/).forEach((q) => { if (!q) return;
        r.push(new TextRun({ text: q.startsWith("*") ? q.slice(1, -1) : q, italics: q.startsWith("*"), highlight: "yellow", ...base })); });
    } else if (part.startsWith("**")) r.push(new TextRun({ text: part.slice(2, -2), bold: true, ...base }));
    else if (part.startsWith("*")) r.push(new TextRun({ text: part.slice(1, -1), italics: true, ...base }));
    else r.push(new TextRun({ text: part, ...base }));
  });
  return r;
}

// ---------- фусноте ----------
const footnotes = {};
let fnId = 0;
const used = new Set();
let prev = null;
function fnText(key, p) {
  const src = izvori[key];
  if (!src) throw new Error("Непознат извор: " + key);
  const unit = src.unit || "стр.";
  let t;
  if (prev && prev.key === key) t = (src.nopage || prev.p === p) ? "Исто." : `Исто, ${unit} ${p}.`;
  else if (!used.has(key)) t = src.full.replace("{p}", p);
  else t = src.short.replace("{p}", p);
  used.add(key); prev = { key, p };
  return t;
}
function bodyRuns(text, base = {}) {
  const r = [];
  let lastWasFn = false;
  text.split(/(\[\[fn:[^\]]*\]\])/).forEach((part) => {
    if (!part) return;
    const m = part.match(/^\[\[fn:([^|\]]+)\|([^\]]*)\]\]$/);
    if (m) {
      const id = ++fnId;
      footnotes[id] = { children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 0 },
        children: runs(" " + fnText(m[1], m[2]), { size: 20, font: FONT }) })] };
      if (lastWasFn) r.push(new TextRun({ text: ",", superScript: true }));
      r.push(new FootnoteReferenceRun(id));
      lastWasFn = true;
    } else { r.push(...runs(part, base)); lastWasFn = false; }
  });
  return r;
}

// ---------- блокови ----------
const tocEntries = [];
const H1 = (text, newPage = false) => { tocEntries.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: newPage, children: [new TextRun(text)] }); };
const H2 = (text) => { tocEntries.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); };
const H3 = (text) => new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 120, after: 60, line: LINE },
  children: [new TextRun({ text })] });
const P = (text) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 567 },
  spacing: { line: LINE, after: 120 }, children: bodyRuns(text) });
const LI = (text) => new Paragraph({ numbering: { reference: "bul", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  spacing: { line: LINE, after: 40 }, children: bodyRuns(text) });

const boxLine = { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 6 };
const boxBorder = { top: boxLine, bottom: boxLine, left: boxLine, right: boxLine };
const boxPara = (text) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, border: boxBorder,
  indent: { left: 140, right: 140 }, spacing: { line: LINE, after: 80 }, children: bodyRuns(text) });
const boxLi = (text) => new Paragraph({ numbering: { reference: "bulbox", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  border: boxBorder, indent: { left: 500, hanging: 300, right: 140 }, spacing: { line: LINE, after: 60 }, children: bodyRuns(text) });

const centered = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, keepNext: !!o.keepNext,
  spacing: { before: o.before || 0, after: o.after || 0, line: o.line || LINE },
  children: [new TextRun({ text, italics: !!o.italics, bold: !!o.bold, size: o.size || 24 })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(def) {
  const total = def.widths.reduce((a, b) => a + b, 0);
  const cell = (text, w, head, first) => new TableCell({ borders, width: { size: w, type: WidthType.DXA },
    margins: { top: 30, bottom: 30, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
    shading: head ? { fill: "E2E2E2", type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [new Paragraph({ alignment: head ? AlignmentType.CENTER : AlignmentType.LEFT, keepNext: true,
      spacing: { line: 240, after: 0 }, children: [new TextRun({ text, bold: head || first, size: 20 })] })] });
  const rows = [new TableRow({ tableHeader: true, cantSplit: true, children: def.header.map((h, i) => cell(h, def.widths[i], true)) })];
  def.rows.forEach((r) => rows.push(new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, def.widths[i], false, i === 0)) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: def.widths, rows });
}

const body = [];
for (const b of telo) {
  if (b.h1) body.push(H1(b.h1, !!b.newPage));
  else if (b.h2) body.push(H2(b.h2));
  else if (b.h3) body.push(H3(b.h3));
  else if (b.p) body.push(P(b.p));
  else if (b.list) b.list.forEach((t) => body.push(LI(t)));
  else if (b.box) {
    b.box.forEach((it) => { if (typeof it === "string") body.push(boxPara(it)); else it.list.forEach((t) => body.push(boxLi(t))); });
    body.push(new Paragraph({ spacing: { after: 60, line: LINE }, children: [] }));
  }
  else if (b.figure) body.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, b.figure.file)),
      transformation: { width: b.figure.width, height: b.figure.height },
      altText: { title: "Слика", description: "Графикон", name: b.figure.file } })] }));
  else if (b.figcaption) body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 240, line: LINE }, children: bodyRuns(b.figcaption) }));
  else if (b.figsource) body.push(centered(b.figsource, { size: 20, after: 200 }));
  else if (b.tcaption) body.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 80, line: LINE }, children: bodyRuns(b.tcaption) }));
  else if (b.table) { body.push(table(b.table)); body.push(new Paragraph({ spacing: { after: 120, line: LINE }, children: [] })); }
  else if (b.tsource) body.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 60, after: 200, line: 240 },
    children: [new TextRun({ text: b.tsource, size: 20 })] }));
}
body.push(H1("Литература", true));
[...literatura.filter((t) => /^[\u0400-\u04FF]/.test(t)), ...(dopuna ? [dopuna] : []), ...literatura.filter((t) => !/^[\u0400-\u04FF]/.test(t))].forEach((t) => body.push(new Paragraph({
  numbering: { reference: "lit", level: 0 }, alignment: AlignmentType.LEFT,
  spacing: { line: LINE, after: 100 }, children: runs(t) })));

// ---------- насловна страна према Упутству ----------
const noB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noB, bottom: noB, left: noB, right: noB };
const plain = (t, o = {}) => new TextRun({ text: t, size: o.size || 24, bold: !!o.bold, underline: o.u ? {} : undefined,
  smallCaps: !!o.sc, highlight: t.startsWith("[") ? "yellow" : undefined });
const para = (children, o = {}) => new Paragraph({ alignment: o.align || AlignmentType.CENTER,
  spacing: { before: o.before || 0, after: o.after || 0, line: LINE }, children });
const half = Math.round(TEXT_W / 2);
const cellL = (paras) => new TableCell({ borders: noBorders, width: { size: half, type: WidthType.DXA }, children: paras });
const naslovna = [
  para([plain(meta.skola[0], { bold: true, size: 26 })]),
  para([plain(meta.skola[1], { bold: true, size: 26 })], { after: 120 }),
  para([plain(meta.odsek, { bold: true, size: 22, sc: true })], { after: 240 }),
  para([plain("Семинарски рад из предмета: "), plain(meta.predmet)], { before: 4200 }),
  para([plain("Тема: "), plain(meta.tema, { u: true, bold: true })], { before: 120 }),
  new Paragraph({ spacing: { before: 3600, after: 0 }, children: [] }),
  new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [half, TEXT_W - half],
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [new TableRow({ children: [
      cellL([para([plain("Наставник:")], { align: AlignmentType.LEFT, after: 120 }),
        ...meta.nastavnici.map((n) => para([plain(n, { u: true })], { align: AlignmentType.LEFT, after: 60 }))]),
      new TableCell({ borders: noBorders, width: { size: TEXT_W - half, type: WidthType.DXA }, children: [
        para([plain("Студент:")], { align: AlignmentType.LEFT, after: 120 }),
        para([plain(meta.student, { u: true })], { align: AlignmentType.LEFT, after: 60 }),
        para([plain("Бр. индекса: "), plain(meta.indeks, { u: true })], { align: AlignmentType.LEFT })] }),
    ] })] }),
  para([plain(meta.mesto)], { before: 2400 }),
  para([plain(meta.godina)]),
];

const sadrzaj = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360, line: LINE },
    children: [new TextRun({ text: "Садржај", bold: true, size: 28 })] }),
  ...tocEntries.map((e) => new Paragraph({ style: e.level === 1 ? "TOC1" : "TOC2",
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: "dot" }],
    children: [new TextRun({ text: e.text }), new TextRun({ text: "\t" + (strane[e.text] != null ? strane[e.text] : "0") })] })),
];

const doc = new Document({
  creator: "Andjela Gorcic", title: meta.tema,
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 32, bold: true },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 600, after: 480, line: LINE }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 600, after: 480, line: LINE }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { spacing: { before: 80, after: 0, line: 276 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { indent: { left: 440 }, spacing: { before: 20, after: 0, line: 276 } } },
      { id: "FootnoteText", name: "footnote text", basedOn: "Normal", next: "FootnoteText", run: { font: FONT, size: 20 }, paragraph: { spacing: { line: 240, after: 0 } } },
    ],
    characterStyles: [{ id: "FootnoteReference", name: "footnote reference", run: { superScript: true } }],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bulbox", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } }] },
    { reference: "lit", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 567 } } } }] },
  ] },
  footnotes,
  sections: [
    { properties: { page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } }, children: [...naslovna, ...sadrzaj] },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
      children: body },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  fs.writeFileSync(out + ".toc.json", JSON.stringify(tocEntries.map((e) => e.text), null, 1));
  console.log("OK", out, "фуснота:", fnId);
});
