// "How $10,000 Turns Into $1,000,000": the 3D key scenes (forked from "4 Geniuses") of the long video (16:9). One world (the river town of the
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

// marks for this film
export const QUAY: V3 = [-6.2, D0, 33.9];        // the hero on the quay by the bench (h1)
export const SHOP: V3 = [-37.6, D0, 37.2];       // the hero in front of the store window (s1a)
export const CALM: V3 = [-65.0, D0, 34.8];       // the hero, calm, in front of the falling board (s6a)

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "exchange" | "ticker" | "diner" | "hq" | "news" | "board" | "bench" | "end";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number; beat: string };
const LIGHTS3: Record<string, Light> = { o3: "golden" };
export const SHOTS: ShotDef[] = SEG.map((x) => ({ id: x.id, a: x.a, b: x.b, light: LIGHTS3[x.beat] ?? "day", place: "exchange", beat: x.beat,
  ...(x.beat === "o3" ? { sunAz: 140, sunEl: 12 } : {}) }));
export const XFADE: Record<number, number> = {};
export const FLASHES: [number, number][] = [];
export const LOWER: { a: number; b: number; t: string; s: string }[] = [];
/** what the price board shows */
export type Board = "ss1000" | "ss150" | "ss890" | "dowUp" | "dowDown" | "blank";
export const boardAt = (id: number, f: number): Board => {
  const b = SHOTS[id - 1].beat;
  if (b === "s6a") return f < cue("s6a", "fall") ? "dowUp" : "dowDown";
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
// h1: the hero on the quay, money in hand, the river behind him
const Ch1 = (f: number) => dolly(add(QUAY, [-2.4, 1.5, -5.0]), add(QUAY, [0.5, 1.45, 0]), pushK(f, at("h1"), 0.0016), { fov: 38 });
// s1a: in front of the store window, saying no to everything in it
const Cs1 = (f: number) => dolly(add(SHOP, [1.6, 1.5, -6.6]), add(SHOP, [-0.2, 1.6, 0]), pushK(f, at("s1a"), 0.0016), { fov: 38 });
// s6a: the board and the brokers, the crash at "fall"; the hero stays calm in the front
const Cs6 = (f: number) => dolly(add(TICKER, [-0.4, 1.5, -10.4]), add(TICKER, [-0.6, 2.4, 0]), pushK(f, at("s6a"), 0.002, 0.008, 24), { fov: 42 });
// o3: golden, the hero on the bench by the river, then the crane out over the water
const YB = YOU_BENCH;
const Co3a = (f: number) => dolly(add(YB, [1.6, 1.15, -4.6]), add(YB, [-0.5, 0.95, 0]), pushK(f, at("o3"), 0.0016), { fov: 38 });
const O3 = () => Math.max(at("o3") + 60, cue("o3", "helped") - 16);
const Co3b = (f: number): Shot => {
  const a = Co3a(O3()), n = seg("o3").b - O3(), s = glide((f - O3()) / n), r = 1 - s;
  const C = add(BENCH, [4, 4, -10]), E = add(BENCH, [9, 11, -24]), L = add(BENCH, [-14, 3, 10]);
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 38 + 8 * s, roll: 0 };
};

const CAMBY: Record<string, Key[]> = {
  h1: [{ f: at("h1"), s: Ch1 }],
  s1a: [{ f: at("s1a"), s: Cs1 }],
  s6a: [{ f: at("s6a"), s: Cs6 }],
  o3: [{ f: at("o3"), s: Co3a }, { f: O3(), dur: 30, s: Co3b }],
};
export const CAMS: Record<number, Key[]> = Object.fromEntries(SHOTS.map((x) => [x.id, CAMBY[x.beat]]));

const KICKS: [number, number][] = [[T(cue("s6a", "fall") + 1), 0.7]];
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
  { f: at("h1"), cInf: 9, focus: eyesAt(QUAY) },
  { f: at("s1a"), cInf: 9, focus: eyesAt(SHOP) },
  { f: at("s6a"), cInf: 3, focus: eyesAt(CALM) },
  { f: at("o3"), cInf: 9, focus: eyesAt(YOU_BENCH, 0.82) },
  { f: O3(), dur: 50, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
