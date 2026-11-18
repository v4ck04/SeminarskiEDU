// Gradi Word dokument seminarskog rada iz sadrzaj.js.
// Upotreba: node build.js <izlaz.docx> [stranice.json]
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, FootnoteReferenceRun, AlignmentType,
  HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Footer, PageNumber, TabStopType, LevelFormat, SectionType, VerticalAlign,
  NumberFormat,
} = require("docx");
const { meta, izvori, telo, literatura, dopuna } = require("./sadrzaj.js");

const out = process.argv[2] || "seminarski.docx";
const strane = process.argv[3] && fs.existsSync(process.argv[3])
  ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : {};

const FONT = "Times New Roman";
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1417; // 2,5 cm
const TEXT_W = A4.width - 2 * MARGIN; // 9072

// ---------- fusnote ----------
const footnotes = {};
let fnId = 0;
const used = new Set();
let prev = null; // {key, p}

function fnText(key, p) {
  const src = izvori[key];
  if (!src) throw new Error("Nepoznat izvor: " + key);
  const unit = src.unit || "str.";
  let t;
  if (prev && prev.key === key) {
    t = prev.p === p ? "Isto." : `Isto, ${unit} ${p}.`;
  } else if (!used.has(key)) {
    t = src.full.replace("{p}", p);
  } else {
    t = src.short.replace("{p}", p);
  }
  used.add(key);
  prev = { key, p };
  return t;
}

// *kurziv* -> TextRun italics
function inlineRuns(text, base = {}) {
  const runs = [];
  text.split(/(\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith("*") && part.endsWith("*")) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, ...base }));
    } else {
      runs.push(new TextRun({ text: part, ...base }));
    }
  });
  return runs;
}

function bodyRuns(text) {
  const runs = [];
  text.split(/(\[\[fn:[^\]]+\]\])/).forEach((part) => {
    if (!part) return;
    const m = part.match(/^\[\[fn:([^|\]]+)\|([^\]]+)\]\]$/);
    if (m) {
      const id = ++fnId;
      footnotes[id] = {
        children: [new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 240, after: 0 },
          children: inlineRuns(" " + fnText(m[1], m[2]), { size: 20, font: FONT }),
        })],
      };
      runs.push(new FootnoteReferenceRun(id));
    } else {
      runs.push(...inlineRuns(part));
    }
  });
  return runs;
}

// ---------- blokovi ----------
const P = (text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  indent: { firstLine: 709 },
  spacing: { line: 360, after: 0 },
  children: bodyRuns(text),
});

const tocEntries = [];
function H1(text) {
  tocEntries.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function H2(text) {
  tocEntries.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function caption(text) {
  const m = text.match(/^(Tabela \d+\.)\s*(.*)$/);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: 200, after: 80, line: 276 },
    children: [
      new TextRun({ text: m[1] + " ", bold: true, size: 22 }),
      new TextRun({ text: m[2], size: 22 }),
    ],
  });
}

function sourceLine(text) {
  return new Paragraph({
    spacing: { before: 60, after: 200, line: 240 },
    children: [new TextRun({ text, size: 20 })],
  });
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };

function table(def) {
  const total = def.widths.reduce((a, b) => a + b, 0);
  const cell = (text, w, opts = {}) => new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 25, bottom: 25, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.head ? { fill: "D9D9D9", type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      keepNext: true,
      spacing: { line: 240, after: 0 },
      children: [new TextRun({ text, bold: !!opts.bold, size: 20 })],
    })],
  });
  const rows = [new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: def.header.map((h, i) => cell(h, def.widths[i], { head: true, bold: true, align: AlignmentType.CENTER })),
  })];
  def.rows.forEach((r, ri) => {
    const last = def.boldLast && ri === def.rows.length - 1;
    rows.push(new TableRow({
      cantSplit: true,
      children: r.map((c, i) => cell(c, def.widths[i], {
        bold: last || (!def.numeric && i === 0),
        align: def.numeric && i > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
      })),
    }));
  });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: def.widths, rows });
}

const bodyChildren = [];
for (const b of telo) {
  if (b.h1) bodyChildren.push(H1(b.h1));
  else if (b.h2) bodyChildren.push(H2(b.h2));
  else if (b.p) bodyChildren.push(P(b.p));
  else if (b.caption) bodyChildren.push(caption(b.caption));
  else if (b.table) bodyChildren.push(table(b.table));
  else if (b.source) bodyChildren.push(sourceLine(b.source));
}

// Literatura (bez fusnota), numerisana lista
bodyChildren.push(H1("LITERATURA"));
literatura.forEach((t) => bodyChildren.push(new Paragraph({
  numbering: { reference: "lit", level: 0 },
  alignment: AlignmentType.LEFT,
  spacing: { line: 240, after: 100 },
  children: inlineRuns(t),
})));
if (dopuna) bodyChildren.push(new Paragraph({
  numbering: { reference: "lit", level: 0 },
  alignment: AlignmentType.LEFT,
  spacing: { line: 240, after: 100 },
  children: inlineRuns(dopuna, { highlight: "yellow" }),
}));

// ---------- naslovna strana ----------
const C = (text, o = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: o.before || 0, after: o.after || 0, line: 276 },
  children: [new TextRun({ text, bold: !!o.bold, size: o.size || 24 })],
});

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const half = TEXT_W / 2;
const sigCell = (lines, align) => new TableCell({
  borders: noBorders,
  width: { size: half, type: WidthType.DXA },
  children: lines.map((t) => new Paragraph({ alignment: align, spacing: { line: 276, after: 0 }, children: [new TextRun({ text: t, size: 24 })] })),
});
const potpisi = new Table({
  width: { size: TEXT_W, type: WidthType.DXA },
  columnWidths: [half, half],
  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
  rows: [new TableRow({ children: [
    sigCell(["Mentor:", meta.mentor], AlignmentType.LEFT),
    sigCell(["Student:", meta.student], AlignmentType.RIGHT),
  ] })],
});

const naslovna = [
  C(meta.fakultet[0], { bold: true }),
  C(meta.fakultet[1], { bold: true, after: 240 }),
  C(meta.predmet),
  C("Seminarski rad", { before: 3600, size: 28, after: 120 }),
  C(meta.naslov, { bold: true, size: 32 }),
  new Paragraph({ spacing: { before: 3000, after: 0 }, children: [] }),
  potpisi,
  C(meta.mestoGodina, { before: 3400 }),
];

// ---------- sadržaj ----------
function tocPara(e) {
  const num = strane[e.text] != null ? String(strane[e.text]) : "0";
  return new Paragraph({
    style: e.level === 1 ? "TOC1" : "TOC2",
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: "dot" }],
    children: [new TextRun({ text: e.text }), new TextRun({ text: "\t" + num })],
  });
}
const sadrzaj = [
  new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: 360 },
    children: [new TextRun({ text: "SADRŽAJ", bold: true, size: 28 })],
  }),
  ...tocEntries.map(tocPara),
];

// ---------- dokument ----------
const doc = new Document({
  creator: "Anđela Denić",
  title: meta.naslov,
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 28, bold: true, allCaps: true },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120, line: 360 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 24, bold: true },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80, line: 360 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal",
        run: { font: FONT, size: 24 },
        paragraph: { spacing: { before: 60, after: 0, line: 360 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal",
        run: { font: FONT, size: 24 },
        paragraph: { indent: { left: 440 }, spacing: { before: 0, after: 0, line: 360 } } },
      { id: "FootnoteText", name: "footnote text", basedOn: "Normal", next: "FootnoteText",
        run: { font: FONT, size: 20 },
        paragraph: { spacing: { line: 240, after: 0 } } },
    ],
    characterStyles: [
      { id: "FootnoteReference", name: "footnote reference", run: { superScript: true } },
    ],
  },
  numbering: {
    config: [{
      reference: "lit",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 567, hanging: 567 } } } }],
    }],
  },
  footnotes,
  sections: [
    {
      properties: { page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      children: [...naslovna, ...sadrzaj],
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: A4,
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 24 })],
        })] }),
      },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  fs.writeFileSync(out + ".toc.json", JSON.stringify(tocEntries.map((e) => e.text), null, 1));
  console.log("OK", out, "fusnota:", fnId);
});
