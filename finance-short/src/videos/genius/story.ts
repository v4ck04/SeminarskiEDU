// "4 Geniuses Who Lost a Fortune": the 3D key scenes of the long video (16:9). One world (the river town of the
// Read and Jensen shorts): the columned exchange with a price board, the glass office block, a store, the bench by the
// river. The shots are the "3d" beats of genius-long/beats.json laid end to end on a local timeline; their lengths
// come from the voice (timing.json), so re-timing the voice re-times the shots.
import TIMING from "./timing.json";
export const FPS = 30;
export const D0 = 6.0;
export type V3 = [number, number, number];
type Beat = { id: string; ch: string; mode: string; f0: number; f1: number; fe: number; words: [string, number][] };
const BEATS = (TIMING as unknown as { beats: Beat[] }).beats;
const B3 = BEATS.filter((b) => b.mode === "3d");
let acc = 0;
/** one segment per 3D beat: local frames [a, b), g0 = its first frame on the film's global timeline */
export const SEG = B3.map((b, i) => { const a = acc; acc += b.f1 - b.f0; return { id: i + 1, beat: b.id, a, b: acc, g0: b.f0, fe: a + (b.fe - b.f0), words: b.words }; });
export const TOTAL = acc;
export const seg = (beat: string) => SEG.find((x) => x.beat === beat)!;
/** local frame at which `word` (nth occurrence) is spoken in a beat; the beat's start if it is not found */
export const cue = (beat: string, word: string, nth = 0) => {
  const sg = seg(beat); let n = 0;
  for (const [w, f] of sg.words) if (w === word.toLowerCase() && n++ === nth) return sg.a + (f - sg.g0);
  return sg.a;
};

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

// extra marks for this film
export const NEWT: V3 = [-61.5, D0, 33.5];       // Newton, in front of the price board
export const TWAIN: V3 = [-6.2, D0, 33.9];       // Twain, on the quay by the bench
export const FISH: V3 = [-70.6, D0, 36.2];       // Fisher, in front of the exchange
export const MERI: V3 = [-52.6, D0, 38.4];       // Meriwether and his partners, in front of the glass block
export const FED: V3 = [-73.0, D0, 37.0];        // the bankers' line-up in front of the columns
export const READP: V3 = [-37.6, D0, 37.2];      // Read with his mop, in front of the store

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "exchange" | "ticker" | "diner" | "hq" | "news" | "board" | "bench" | "end";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number; beat: string };
const LIGHTS3: Record<string, Light> = { t10: "golden", r8: "golden", r9: "golden" };
export const SHOTS: ShotDef[] = SEG.map((x) => ({ id: x.id, a: x.a, b: x.b, light: LIGHTS3[x.beat] ?? "day", place: "exchange", beat: x.beat,
  ...(x.beat === "r8" || x.beat === "r9" ? { sunAz: 140, sunEl: 12 } : x.beat === "t10" ? { sunAz: 150, sunEl: 16 } : {}) }));
export const XFADE: Record<number, number> = {};
export const FLASHES: [number, number][] = [];
/** lower thirds (place and year) over the first seconds of a shot */
const lower = (beat: string, t: string, s: string, from = 6, len = 96) => ({ a: seg(beat).a + from, b: seg(beat).a + from + len, t, s });
export const LOWER = [
  lower("n1", "London", "1720"), lower("t1", "Hartford, Connecticut", "1880"), lower("f2", "Irving Fisher", "PROFESSOR OF ECONOMICS, YALE"),
  lower("l2", "Greenwich, Connecticut", "1994"), lower("l12", "New York", "SEPTEMBER 23, 1998"), lower("r1", "Brattleboro, Vermont", "RONALD READ"),
];
/** what the price board shows */
export type Board = "ss1000" | "ss150" | "ss890" | "dowUp" | "dowDown" | "blank";
export const boardAt = (id: number, f: number): Board => {
  const b = SHOTS[id - 1].beat;
  if (b === "h1") return f < cue("h1", "lose") ? "ss1000" : "ss150";
  if (b === "n8" || b === "n1") return "ss890";
  if (b === "f2") return "dowUp";
  if (b === "f8") return f < cue("f8", "crashes") ? "dowUp" : "dowDown";
  return "blank";
};

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

const at = (beat: string) => seg(beat).a;
// h1: Newton in front of the price board, the investors behind him; the board flips at "lose"
const Ch1 = (f: number) => dolly([-55.4, D0 + 1.45, 30.2], [-64.0, D0 + 2.6, 36.4], pushK(f, at("h1"), 0.0016, 0.006, 26), { fov: 40 });
// n1: London: wide on the exchange and its crowd, then Newton
const Cn1a = (f: number) => dolly([-51.0, D0 + 2.6, 26.5], [-68.5, D0 + 2.6, 38.5], pushK(f, at("n1"), 0.0014), { fov: 38 });
const Cn1b = (f: number) => dolly([-58.3, D0 + 1.5, 30.5], add(NEWT, [0, 1.5, 0]), pushK(f, cue("n1", "he"), 0.0014), { fov: 34 });
// n8: he buys back in: Newton with his money bags at the board, the happy crowd
const Cn8 = (f: number) => dolly([-55.6, D0 + 1.6, 30.6], [-63.0, D0 + 1.75, 35.6], pushK(f, at("n8"), 0.0018), { fov: 40 });
// t1: Twain on the quay; t10: the same man at dusk, pockets empty
const Ct1 = (f: number) => dolly(add(TWAIN, [-2.4, 1.5, -5.0]), add(TWAIN, [0.5, 1.45, 0]), pushK(f, at("t1"), 0.0015), { fov: 38 });
const Ct10 = (f: number) => dolly(add(TWAIN, [-1.2, 1.35, -4.2]), add(TWAIN, [0.3, 1.35, 0]), pushK(f, at("t10"), 0.002), { fov: 36 });
// f2: Fisher and the reporters in front of the exchange; f8: the board and the crowd, the crash
const Cf2 = (f: number) => dolly(add(FISH, [1.6, 1.5, -5.6]), add(FISH, [-0.4, 1.6, 0]), pushK(f, at("f2"), 0.0015), { fov: 38 });
const Cf8 = (f: number) => dolly(add(TICKER, [1.2, 1.5, -9.4]), add(TICKER, [0.2, 2.6, 0]), pushK(f, at("f8"), 0.002, 0.008, 24), { fov: 40 });
// l2: the partners in front of the glass block; l12: the bankers under the columns
const Cl2 = (f: number) => dolly(add(MERI, [1.2, 1.25, -5.6]), add(MERI, [0, 1.6, 0.4]), pushK(f, at("l2"), 0.0016), { fov: 36 });
const Cl12 = (f: number) => dolly(add(FED, [-1.0, 1.7, -9.5]), add(FED, [0, 1.75, 0]), pushK(f, at("l12"), 0.0012), { fov: 40 });
// r1: Read with his mop in front of the store; r8-r9: the bench at sunset, then the crane out over the river
const Cr1 = (f: number) => dolly(add(READP, [1.3, 1.4, -4.2]), add(READP, [-0.35, 1.4, 0]), pushK(f, at("r1"), 0.0016), { fov: 36 });
const YB = YOU_BENCH;
const Cr8 = (f: number) => dolly(add(YB, [1.6, 1.15, -4.6]), add(YB, [-0.5, 0.95, 0]), pushK(f, at("r8"), 0.0016), { fov: 38 });
const R9 = () => at("r9") + 20;
const Cr9 = (f: number): Shot => {
  const a = Cr8(R9()), n = seg("r9").b - R9(), s = glide((f - R9()) / n), r = 1 - s;
  const C = add(BENCH, [4, 4, -10]), E = add(BENCH, [9, 11, -24]), L = add(BENCH, [-14, 3, 10]);
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 38 + 8 * s, roll: 0 };
};

const CAMBY: Record<string, Key[]> = {
  h1: [{ f: at("h1"), s: Ch1 }],
  n1: [{ f: at("n1"), s: Cn1a }, { f: cue("n1", "he"), cut: true, s: Cn1b }],
  n8: [{ f: at("n8"), s: Cn8 }],
  t1: [{ f: at("t1"), s: Ct1 }],
  t10: [{ f: at("t10"), s: Ct10 }],
  f2: [{ f: at("f2"), s: Cf2 }],
  f8: [{ f: at("f8"), s: Cf8 }],
  l2: [{ f: at("l2"), s: Cl2 }],
  l12: [{ f: at("l12"), s: Cl12 }],
  r1: [{ f: at("r1"), s: Cr1 }],
  r8: [{ f: at("r8"), s: Cr8 }],
  r9: [{ f: at("r9"), s: Cr8 }, { f: R9(), dur: 30, s: Cr9 }],
};
export const CAMS: Record<number, Key[]> = Object.fromEntries(SHOTS.map((x) => [x.id, CAMBY[x.beat]]));

const KICKS: [number, number][] = [[T(cue("h1", "lose") + 1), 0.6], [T(cue("f8", "crashes") + 1), 0.7]];
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
  { f: at("h1"), cInf: 9, focus: eyesAt(NEWT) },
  { f: at("n1"), cInf: 0 },
  { f: cue("n1", "he"), cInf: 10, focus: eyesAt(NEWT) },
  { f: at("n8"), cInf: 7, focus: eyesAt(NEWT) },
  { f: at("t1"), cInf: 9, focus: eyesAt(TWAIN) },
  { f: at("t10"), cInf: 11, focus: eyesAt(TWAIN) },
  { f: at("f2"), cInf: 8, focus: eyesAt(FISH) },
  { f: at("f8"), cInf: 3 },
  { f: at("l2"), cInf: 5, focus: eyesAt(MERI) },
  { f: at("l12"), cInf: 4, focus: eyesAt(FED) },
  { f: at("r1"), cInf: 9, focus: eyesAt(READP) },
  { f: at("r8"), cInf: 9, focus: eyesAt(YOU_BENCH, 0.82) },
  { f: R9(), dur: 50, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
