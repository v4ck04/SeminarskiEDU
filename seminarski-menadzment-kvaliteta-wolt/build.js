// Гради Word документ семинарског рада „Менаџмент квалитета – Wolt“ (образац „Мини пројекат“).
// Формат је привремен (TNR 12, прорeд 1,5, маргине 2,5 cm) док не стигне упутство школе.
// Употреба: node build.js <izlaz.docx> [strane.json]
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow,
  TableCell, WidthType, BorderStyle, ShadingType, Footer, PageNumber, TabStopType,
  LevelFormat, SectionType, VerticalAlign, NumberFormat, ImageRun,
} = require("docx");
const { meta, telo, literatura, dopuna } = require("./sadrzaj.js");

const out = process.argv[2] || "rad.docx";
const strane = process.argv[3] && fs.existsSync(process.argv[3])
  ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : {};

const FONT = "Times New Roman";
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1417;
const TEXT_W = A4.width - 2 * MARGIN;

function runs(text, base = {}) {
  const r = [];
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    const hl = part.includes("[ДОПУНИТИ") ? { highlight: "yellow" } : {};
    if (part.startsWith("**")) r.push(new TextRun({ text: part.slice(2, -2), bold: true, ...base, ...hl }));
    else if (part.startsWith("*")) r.push(new TextRun({ text: part.slice(1, -1), italics: true, ...base, ...hl }));
    else if (hl.highlight) {
      // истакни само део у угластим заградама
      part.split(/(\[ДОПУНИТИ[^\]]*\])/).forEach((q) => { if (q) r.push(new TextRun({ text: q, ...base, ...(q.startsWith("[ДОПУНИТИ") ? hl : {}) })); });
    } else r.push(new TextRun({ text: part, ...base }));
  });
  return r;
}

const tocEntries = [];
const H1 = (text, newPage = false) => { tocEntries.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: newPage, children: [new TextRun(text)] }); };
const H2 = (text) => { tocEntries.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); };
const H3 = (text) => new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 160, after: 80, line: 300 },
  children: [new TextRun({ text, bold: false })] });
const P = (text) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 709 },
  spacing: { line: 360, after: 0 }, children: runs(text) });
const LI = (text, extra = {}) => new Paragraph({ numbering: { reference: "bul", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, after: 0 }, children: runs(text), ...extra });

// оквир као у обрасцу: пасуси са истим ивицама спајају се у један правоугаоник
const boxLine = { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 6 };
const boxBorder = { top: boxLine, bottom: boxLine, left: boxLine, right: boxLine };
const boxPara = (text) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, border: boxBorder,
  indent: { left: 140, right: 140 }, spacing: { line: 360, after: 60 }, children: runs(text) });
const boxLi = (text) => new Paragraph({ numbering: { reference: "bulbox", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  border: boxBorder, indent: { left: 500, hanging: 300, right: 140 }, spacing: { line: 360, after: 40 }, children: runs(text) });

const centered = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, keepNext: !!o.keepNext,
  spacing: { before: o.before || 0, after: o.after || 0, line: o.line || 276 },
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
    body.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
  }
  else if (b.figure) body.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, b.figure.file)),
      transformation: { width: b.figure.width, height: b.figure.height },
      altText: { title: "Слика", description: "Графикон", name: b.figure.file } })] }));
  else if (b.figcaption) body.push(centered(b.figcaption, { italics: true, keepNext: true }));
  else if (b.figsource) body.push(centered(b.figsource, { italics: true, size: 22, after: 200 }));
  else if (b.tcaption) body.push(centered(b.tcaption, { italics: true, keepNext: true, before: 160, after: 80 }));
  else if (b.table) body.push(table(b.table));
  else if (b.tsource) body.push(centered(b.tsource, { italics: true, size: 22, before: 60, after: 200 }));
}
body.push(H1("Литература", true));
[...literatura, ...(dopuna ? [dopuna] : [])].forEach((t) => body.push(new Paragraph({
  numbering: { reference: "lit", level: 0 }, alignment: AlignmentType.LEFT,
  spacing: { line: 300, after: 80 }, children: runs(t) })));

// насловна страна (привремено, док не стигне упутство школе)
const noB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noB, bottom: noB, left: noB, right: noB };
const half = TEXT_W / 2;
const sig = (lines, align) => new TableCell({ borders: noBorders, width: { size: half, type: WidthType.DXA },
  children: lines.map((t) => new Paragraph({ alignment: align, spacing: { line: 276, after: 0 }, children: [new TextRun({ text: t, size: 28 })] })) });
const naslovna = [
  centered(meta.skola[0], { bold: true, size: 28, line: 360 }),
  centered(meta.skola[1], { bold: true, size: 28, line: 360, after: 2400 }),
  centered(meta.vrsta, { italics: true, size: 28, after: 240 }),
  centered(meta.predmet, { size: 28, after: 600 }),
  centered(meta.naslov, { bold: true, size: 36, line: 320 }),
  new Paragraph({ spacing: { before: 2400, after: 0 }, children: [] }),
  new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [half, half],
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [new TableRow({ children: [sig([meta.mentorLabel, meta.mentor], AlignmentType.LEFT), sig([meta.studentLabel, meta.student], AlignmentType.RIGHT)] })] }),
  centered(meta.mestoDatum, { size: 28, before: 2400 }),
];

const sadrzaj = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360, line: 360 },
    children: [new TextRun({ text: "Садржај", bold: true, size: 28 })] }),
  ...tocEntries.map((e) => new Paragraph({ style: e.level === 1 ? "TOC1" : "TOC2",
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: "dot" }],
    children: [new TextRun({ text: e.text }), new TextRun({ text: "\t" + (strane[e.text] != null ? strane[e.text] : "0") })] })),
];

const doc = new Document({
  creator: "Veljko Pavlovic", title: meta.naslov,
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 160, line: 360 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 200, after: 80, line: 360 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { spacing: { before: 60, after: 0, line: 360 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { indent: { left: 440 }, spacing: { before: 0, after: 0, line: 360 } } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bulbox", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } }] },
    { reference: "lit", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 567 } } } }] },
  ] },
  sections: [
    { properties: { page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } }, children: [...naslovna, ...sadrzaj] },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
      children: body },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  fs.writeFileSync(out + ".toc.json", JSON.stringify(tocEntries.map((e) => e.text), null, 1));
  console.log("OK", out);
});
