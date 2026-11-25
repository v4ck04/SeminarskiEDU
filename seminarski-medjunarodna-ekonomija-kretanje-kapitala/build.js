// Гради Word документ семинарског рада „Међународно кретање капитала“ (Економски факултет, Косовска Митровица).
// Насловна страна прати образац ранијег рада студенткиње (лого, назив универзитета и факултета, ментор и студент).
// A4, маргине 2,5 cm, TNR 12, проред 1,5, фусноте TNR 10.
// Употреба: node build.js <izlaz.docx> [strane.json]
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, FootnoteReferenceRun, AlignmentType, HeadingLevel, Table,
  TableRow, TableCell, WidthType, BorderStyle, ShadingType, Footer, PageNumber, TabStopType,
  LevelFormat, SectionType, VerticalAlign, NumberFormat, ImageRun,
} = require("docx");
const { meta, izvori, telo, literatura } = require("./sadrzaj.js");

const out = process.argv[2] || "rad.docx";
const strane = process.argv[3] && fs.existsSync(process.argv[3])
  ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : {};

const FONT = "Times New Roman";
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1417;
const TEXT_W = A4.width - 2 * MARGIN;
const LINE = 360; // проред 1,5

// ---------- курзив и подебљано ----------
function runs(text, base = {}) {
  const r = [];
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith("**")) r.push(new TextRun({ text: part.slice(2, -2), bold: true, ...base }));
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
  if (prev && prev.key === key) t = prev.p === p ? "Исто." : `Исто, ${unit} ${p}.`;
  else if (!used.has(key)) t = src.full.replace("{p}", p);
  else t = src.short.replace("{p}", p);
  used.add(key); prev = { key, p };
  return t;
}
function bodyRuns(text, base = {}) {
  const r = [];
  text.split(/(\[\[fn:[^\]]*\]\])/).forEach((part) => {
    if (!part) return;
    const m = part.match(/^\[\[fn:([^|\]]+)\|([^\]]*)\]\]$/);
    if (m) {
      const id = ++fnId;
      footnotes[id] = { children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 0 },
        children: runs(" " + fnText(m[1], m[2]), { size: 20, font: FONT }) })] };
      r.push(new FootnoteReferenceRun(id));
    } else r.push(...runs(part, base));
  });
  return r;
}

// ---------- блокови ----------
const tocEntries = [];
const H1 = (text, newPage = false) => { tocEntries.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: newPage, children: [new TextRun(text)] }); };
const H2 = (text) => { tocEntries.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); };
const P = (text) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 709 },
  spacing: { line: LINE, after: 0 }, children: bodyRuns(text) });
const LI = (text) => new Paragraph({ numbering: { reference: "bul", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  spacing: { line: LINE, after: 0 }, children: bodyRuns(text) });

const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(def) {
  const total = def.widths.reduce((a, b) => a + b, 0);
  const cell = (text, w, head, first, num) => new TableCell({ borders, width: { size: w, type: WidthType.DXA },
    margins: { top: 30, bottom: 30, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
    shading: head ? { fill: "E2E2E2", type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [new Paragraph({ alignment: head ? AlignmentType.CENTER : (num ? AlignmentType.RIGHT : AlignmentType.LEFT),
      keepNext: true, spacing: { line: 240, after: 0 }, children: [new TextRun({ text, bold: head || first, size: 20 })] })] });
  const rows = [new TableRow({ tableHeader: true, cantSplit: true, children: def.header.map((h, i) => cell(h, def.widths[i], true)) })];
  def.rows.forEach((r) => rows.push(new TableRow({ cantSplit: true,
    children: r.map((c, i) => cell(c, def.widths[i], false, i === 0, def.numeric && i > 0)) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: def.widths, rows });
}
const caption = (text) => new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true,
  spacing: { before: 200, after: 80, line: 276 }, children: bodyRuns(text, { size: 22 }) });
const source = (text) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 60, after: 200, line: 240 },
  children: runs(text, { size: 20 }) });

const body = [];
for (const b of telo) {
  if (b.h1) body.push(H1(b.h1, !!b.newPage));
  else if (b.h2) body.push(H2(b.h2));
  else if (b.p) body.push(P(b.p));
  else if (b.list) b.list.forEach((t) => body.push(LI(t)));
  else if (b.figure) body.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, b.figure.file)),
      transformation: { width: b.figure.width, height: b.figure.height },
      altText: { title: "Слика", description: b.figure.alt || "Слика", name: b.figure.file } })] }));
  else if (b.caption) body.push(caption(b.caption));
  else if (b.table) body.push(table(b.table));
  else if (b.source) body.push(source(b.source));
}
body.push(H1("Литература", true));
[...literatura.filter((t) => /^[*„]?[Ѐ-ӿ]/.test(t)), ...literatura.filter((t) => !/^[*„]?[Ѐ-ӿ]/.test(t))]
  .forEach((t) => body.push(new Paragraph({ numbering: { reference: "lit", level: 0 }, alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 276, after: 100 }, children: runs(t) })));

// ---------- насловна страна (по обрасцу ранијег рада) ----------
const noB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noB, bottom: noB, left: noB, right: noB };
const C = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER,
  spacing: { before: o.before || 0, after: o.after || 0, line: 276 },
  children: [new TextRun({ text, bold: !!o.bold, size: o.size || 24 })] });
const L = (text) => new Paragraph({ spacing: { line: 276, after: 0 }, children: [new TextRun({ text, size: 24 })] });
const leftW = 6100;
const naslovna = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 900, after: 480 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, "logo.png")),
      transformation: { width: 156, height: 101 }, altText: { title: "Лого", description: "Лого Економског факултета у Приштини", name: "logo" } })] }),
  C(meta.univerzitet[0], { bold: true }),
  C(meta.univerzitet[1], { bold: true, after: 60 }),
  C(meta.fakultet, { bold: true }),
  C(meta.predmet, { before: 1100 }),
  C("СЕМИНАРСКИ РАД", { bold: true, size: 36, before: 700, after: 240 }),
  C(meta.tema, { bold: true, size: 28 }),
  new Paragraph({ spacing: { before: 3000, after: 0 }, children: [] }),
  new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [leftW, TEXT_W - leftW],
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [new TableRow({ children: [
      new TableCell({ borders: noBorders, width: { size: leftW, type: WidthType.DXA }, children: [L("Ментор:"), L(meta.mentor)] }),
      new TableCell({ borders: noBorders, width: { size: TEXT_W - leftW, type: WidthType.DXA }, children: [L("Студент:"), L(meta.student)] }),
    ] })] }),
  C(meta.mestoDatum, { before: 1300 }),
];

// ---------- садржај ----------
const sadrzaj = [
  new Paragraph({ pageBreakBefore: true, spacing: { after: 240, line: 276 },
    children: [new TextRun({ text: "Садржај", bold: true, size: 28 })] }),
  ...tocEntries.map((e) => new Paragraph({ style: e.level === 1 ? "TOC1" : "TOC2",
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: "dot" }],
    children: [new TextRun({ text: e.text }), new TextRun({ text: "\t" + (strane[e.text] != null ? strane[e.text] : "0") })] })),
];

const doc = new Document({
  creator: meta.student, title: meta.tema,
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 360, after: 180, line: LINE }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 120, line: LINE }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { spacing: { before: 80, after: 0, line: 300 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 24 }, paragraph: { indent: { left: 567 }, spacing: { before: 20, after: 0, line: 300 } } },
      { id: "FootnoteText", name: "footnote text", basedOn: "Normal", next: "FootnoteText", run: { font: FONT, size: 20 }, paragraph: { spacing: { line: 240, after: 0 } } },
    ],
    characterStyles: [{ id: "FootnoteReference", name: "footnote reference", run: { superScript: true } }],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
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
