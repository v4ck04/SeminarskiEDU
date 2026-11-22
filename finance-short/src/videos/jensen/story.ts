// "The $4.5 Trillion Scandal": Jensen Huang and Nvidia, November 2026. Shots are timed to the voice
// (jensen-short/voice/words.json, frame = word onset x 30). One world: a town on a river; on the far bank a row of
// buildings (stock exchange with a quote board, the chipmaker's glass HQ, a store, a diner) with an office block
// behind; the bench on the far quay by the river. Camera grammar as in the Newton and Read shorts.
export const FPS = 30;
export const TOTAL = 1612;
export const D0 = 6.0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- places (far bank, buildings face the river = -z) ----------------
export const EXCH: V3 = [-73, D0, 40.5];         // stock exchange (columned hall), front centre
export const TICKER: V3 = [-62.4, D0, 37.6];     // the big quote board between the exchange and the HQ
export const HQ: V3 = [-52.5, D0, 42];           // the chipmaker's glass HQ, front centre
export const STORE: V3 = [-38, D0, 41];          // front centre
export const DINER: V3 = [-21, D0, 40];          // front centre
export const HOSPITAL: V3 = [-57, D0, 72];       // office block behind the row
export const BENCH: V3 = [-3, D0, 33.3];
export const TABLE: V3 = [-21, D0, 37.4];        // diner terrace table
export const JEN: V3 = [-52.2, D0, 38.6];        // where the CEO stands, in front of the HQ
export const BOARDC: V3 = [-55.0, D0, 38.9];     // centre of the board line-up
export const YOU_BENCH: V3 = [BENCH[0] + 0.25, D0 + 0.34, BENCH[2] - 0.12];
export const FOUNDERS: V3[] = [[-21.75, D0 + 0.38, 37.5], [-20.25, D0 + 0.38, 37.5], [-21.0, D0, 38.3]];
// legacy names used by the shared world code
export const LIBRARY = EXCH, GAS = HQ;
export const carAt = (_id: number): { p: V3; yaw: number } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "exchange" | "ticker" | "diner" | "hq" | "news" | "board" | "bench" | "end";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 137, light: "day", place: "exchange" },     // a $4.5 trillion company; the boss confessed a secret
  { id: 2, a: 137, b: 252, light: "day", place: "ticker" },     // the next day: almost $200 billion gone
  { id: 3, a: 252, b: 416, light: "day", place: "diner" },      // 1993, a Denny's, $40,000
  { id: 4, a: 416, b: 548, light: "day", place: "hq" },         // chips for video games... perfect for AI
  { id: 5, a: 548, b: 684, light: "day", place: "hq" },         // the email
  { id: 6, a: 684, b: 866, light: "day", place: "news" },       // reports: spying for China; China: groundless
  { id: 7, a: 866, b: 1008, light: "day", place: "board" },     // the board's review; no reason to think secrets leaked
  { id: 8, a: 1008, b: 1088, light: "day", place: "ticker" },   // the stock still fell more than 4 %
  { id: 9, a: 1088, b: 1290, light: "day", place: "bench" },    // your problem: ~7 % of the S&P 500, index fund
  { id: 10, a: 1290, b: 1404, light: "day", place: "bench" },   // 7 cents of every dollar; one company... and one man
  { id: 11, a: 1404, b: 1466, light: "day", place: "hq" },      // key person risk
  { id: 12, a: 1466, b: TOTAL, light: "golden", place: "end" }, // spread it out; people make mistakes
];
export const XFADE: Record<number, number> = { 3: 8, 9: 8, 12: 12 };
export const FLASHES: [number, number][] = [[167, 4]];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// 1: investors in front of the exchange, the quote board green; cut to the CEO, nervous, in front of his HQ
const S1a = (f: number) => dolly([-67.6, D0 + 1.9, 27.6], [-68.4, D0 + 2.2, 38.6], pushK(f, 0, 0.0022), { fov: 48 });
const S1b = (f: number) => dolly(add(JEN, [0.7, 1.55, -3.3]), add(JEN, [-0.1, 1.5, 0]), pushK(f, 95, 0.0028, 0.007, 30), { fov: 40, roll: 0.03 });
// 2 + 8: the quote board turns red over the crowd
const S2a = (f: number) => dolly(add(TICKER, [-0.6, 1.4, -9.6]), add(TICKER, [0, 2.5, 0]), pushK(f, 137, 0.0022, 0.006, 30), { fov: 48 });
const S8a = (f: number) => dolly(add(TICKER, [0.5, 2.2, -7.6]), add(TICKER, [0, 3.5, 0]), pushK(f, 1008, 0.0026), { fov: 50, roll: -0.03 });
// 3: the diner terrace, 1993
const S3a = (f: number) => dolly(add(TABLE, [1.2, 1.55, -5.6]), add(TABLE, [0, 1.1, 0.2]), pushK(f, 248, 0.0022), { fov: 44 });
// 4: low on the HQ, the CEO in front; 5: his close-up; 11: medium with the warning
const S4a = (f: number) => dolly(add(JEN, [1.1, 1.1, -5.6]), add(JEN, [-0.2, 1.8, 0]), pushK(f, 412, 0.002), { fov: 54 });
const S5a = (f: number) => dolly(add(JEN, [0.35, 1.5, -3.3]), add(JEN, [0.05, 1.55, 0]), pushK(f, 548, 0.0024), { fov: 42 });
const S11a = (f: number) => dolly(add(JEN, [-0.6, 1.5, -4.0]), add(JEN, [0.1, 1.75, 0]), pushK(f, 1404, 0.003, 0.008, 30), { fov: 44 });
// 6: the crowd with the papers in front of the store
const S6a = (f: number) => dolly([-37.4, D0 + 1.8, 28.6], [-37.6, D0 + 2.0, 39.0], pushK(f, 684, 0.0022), { fov: 46 });
// 7: the board line-up, the CEO facing them
const S7a = (f: number) => dolly(add(BOARDC, [0.9, 1.3, -8.6]), add(BOARDC, [0.75, 1.05, 0]), pushK(f, 862, 0.002), { fov: 58 });
// 9-10: the viewer on the bench by the river
const YB = YOU_BENCH;
const S9a = (f: number) => dolly(add(YB, [-1.0, 1.3, -4.6]), add(YB, [0.1, 0.95, 0]), pushK(f, 1084, 0.0022), { fov: 46 });
const S10a = (f: number) => dolly(add(YB, [-0.4, 1.1, -2.8]), add(YB, [0.15, 0.95, 0]), pushK(f, 1290, 0.0025), { fov: 44 });
const S10b = (f: number) => dolly(add(JEN, [0.4, 1.5, -10.5]), add(JEN, [0, 1.25, 0]), pushK(f, 1366, 0.004, 0.012, 24), { fov: 40 });
// 12: golden, the viewer relaxed, the crane out over the river
const S12a = (f: number) => dolly(add(YB, [1.4, 1.2, -4.4]), add(YB, [-0.2, 0.95, 0]), pushK(f, 1462, 0.002), { fov: 46 });
const S12b = (f: number): Shot => {
  const a = S12a(1530), s = glide((f - 1530) / 82), r = 1 - s;
  const C = add(BENCH, [4, 4, -10]), E = add(BENCH, [9, 11, -24]), L = add(BENCH, [-14, 3, 10]);
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 46 + 4 * s, roll: 0 };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 95, cut: true, s: S1b }],
  2: [{ f: 137, s: S2a }],
  3: [{ f: 248, s: S3a }],
  4: [{ f: 412, s: S4a }],
  5: [{ f: 548, s: S5a }],
  6: [{ f: 684, s: S6a }],
  7: [{ f: 862, s: S7a }],
  8: [{ f: 1008, s: S8a }],
  9: [{ f: 1084, s: S9a }],
  10: [{ f: 1290, s: S10a }, { f: 1366, cut: true, s: S10b }],
  11: [{ f: 1404, s: S11a }],
  12: [{ f: 1462, s: S12a }, { f: 1530, dur: 30, s: S12b }],
};

const KICKS: [number, number][] = [[T(168), 0.7], [T(1031), 0.5], [T(1430), 0.4]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyesAt = (p: V3, h = 1.36): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 95, cInf: 14, focus: eyesAt(JEN) },
  { f: 137, cInf: 4 },
  { f: 252, cInf: 10, focus: () => [TABLE[0], D0 + 1.2, TABLE[2]] },
  { f: 416, cInf: 0 },
  { f: 548, cInf: 14, focus: eyesAt(JEN) },
  { f: 684, cInf: 0 },
  { f: 866, cInf: 8, focus: () => [BOARDC[0] + 0.6, D0 + 1.5, BOARDC[2]] },
  { f: 1008, cInf: 6 },
  { f: 1088, cInf: 10, focus: eyesAt(YOU_BENCH, 0.82) },
  { f: 1366, cInf: 6, focus: eyesAt(JEN) },
  { f: 1404, cInf: 12, focus: eyesAt(JEN) },
  { f: 1466, cInf: 9, focus: eyesAt(YOU_BENCH, 0.82) },
  { f: 1530, dur: 50, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
