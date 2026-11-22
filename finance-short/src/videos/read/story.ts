// "The Janitor Who Had $8 Million": Ronald Read, Brattleboro, Vermont. Shots are timed to the voice
// (read-short/voice/words.json, frame = word onset x 30). One world: an autumn New England town on a river; on the far
// bank a row of town buildings (library, gas station, department store, diner) with the hospital behind; the bench
// on the far quay by the river. Camera grammar as in the Newton short.
export const FPS = 30;
export const TOTAL = 1110;
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
export const LIBRARY: V3 = [-73, D0, 40.5];      // front centre
export const GAS: V3 = [-56, D0, 41.5];          // canopy centre
export const STORE: V3 = [-38, D0, 41];          // front centre
export const DINER: V3 = [-21, D0, 40];          // front centre
export const HOSPITAL: V3 = [-57, D0, 72];       // front centre (behind the row)
export const BENCH: V3 = [-3, D0, 33.3];
export const TABLE: V3 = [-21, D0, 37.4];        // diner terrace table
export const READ_GAS: V3 = [-55.0, D0, 38.6];
export const READ_STORE: V3 = [-38.4, D0, 39.4];
export const READ_CAR: V3 = [-47.4, D0, 33.8];
export const READ_DINER: V3 = [-21.75, D0 + 0.38, 37.5];
export const READ_BENCH: V3 = [BENCH[0] + 0.25, D0 + 0.34, BENCH[2] - 0.12];
/** the car: position + yaw per shot (at the pump for the gas shot, parked at the far end of the quay later) */
export const carAt = (id: number): { p: V3; yaw: number } | null =>
  id === 2 ? { p: [-56.8, D0, 40.2], yaw: 0 } : id === 4 ? { p: [-48.6, D0, 35.4], yaw: 0 } : null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "street" | "gas" | "store" | "car" | "diner" | "bench" | "library" | "hospital" | "end";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 136, light: "day", place: "street" },        // the town finds out: $8 million
  { id: 2, a: 136, b: 218, light: "day", place: "gas" },         // pumped gas for 25 years
  { id: 3, a: 218, b: 296, light: "day", place: "store" },       // cleaned a department store
  { id: 4, a: 296, b: 405, light: "day", place: "car" },         // used car, safety pin
  { id: 5, a: 405, b: 532, light: "day", place: "diner" },       // a stranger paid for his breakfast
  { id: 6, a: 532, b: 674, light: "day", place: "bench" },       // boring companies: soap, medicine, electricity
  { id: 7, a: 674, b: 764, light: "golden", place: "bench" },    // reinvested, held for decades
  { id: 8, a: 764, b: 880, light: "day", place: "library" },     // $1.2 million to the library
  { id: 9, a: 880, b: 962, light: "day", place: "hospital" },    // $4.8 million to the hospital
  { id: 10, a: 962, b: TOTAL, light: "golden", place: "end" },   // no lottery, no crypto... and wait
];
export const XFADE: Record<number, number> = { 6: 8, 7: 10, 8: 8, 10: 12 };
export const FLASHES: [number, number][] = [[136, 4]];

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

// 1: the townsfolk read the news in front of the store
const S1a = (f: number) => dolly([-37.4, D0 + 1.8, 28.6], [-37.6, D0 + 2.9, 39.0], pushK(f, 0, 0.0022), { fov: 46 });
const S1b = (f: number) => dolly([-37.6, D0 + 1.6, 31.8], [-38.2, D0 + 1.8, 37.2], pushK(f, 86, 0.0025, 0.007, 30), { fov: 42, roll: -0.04 });
// 2: at the pump, canopy overhead
const S2a = (f: number) => dolly(add(READ_GAS, [3.0, 1.8, -7.2]), add(READ_GAS, [-0.9, 2.0, 0.4]), pushK(f, 132, 0.0022), { fov: 46 });
// 3: mopping in front of the store windows
const S3a = (f: number) => dolly(add(READ_STORE, [2.2, 1.9, -6.6]), add(READ_STORE, [-0.3, 1.8, 0]), pushK(f, 218, 0.0022), { fov: 44 });
// 4: the used car, then the safety pin close-up
const S4a = (f: number) => dolly(add(READ_CAR, [2.0, 1.6, -6.4]), add(READ_CAR, [-0.9, 1.2, 0.6]), pushK(f, 296, 0.0022), { fov: 44 });
const S4b = (f: number) => dolly(add(READ_CAR, [0.28, 1.36, -1.25]), add(READ_CAR, [0.05, 1.28, 0]), pushK(f, 375, 0.003), { fov: 36, roll: 0.04 });
// 5: the diner terrace
const S5a = (f: number) => dolly(add(READ_DINER, [2.6, 1.6, -5.6]), add(READ_DINER, [0.6, 1.05, 0]), pushK(f, 405, 0.0022), { fov: 42 });
const S5b = (f: number) => dolly(add(READ_DINER, [0.9, 1.3, -3.4]), add(READ_DINER, [0.15, 1.0, 0]), pushK(f, 488, 0.0025), { fov: 38, roll: -0.035 });
// 6-7: the bench by the river
const RB = READ_BENCH;
const S6a = (f: number) => dolly(add(RB, [-1.0, 1.4, -4.3]), add(RB, [0.1, 1.15, 0]), pushK(f, 528, 0.0022), { fov: 44 });
const S6b = (f: number) => dolly(add(RB, [-0.5, 1.15, -3.2]), add(RB, [0.1, 1.35, 0]), pushK(f, 610, 0.0022), { fov: 46 });
const S7a = (f: number) => dolly(add(RB, [1.6, 1.3, -4.6]), add(RB, [-0.3, 1.0, 0]), pushK(f, 670, 0.0025), { fov: 44 });
// 8: the library, 9: the hospital
const S8a = (f: number) => dolly([-71.2, D0 + 2.2, 27.4], [-73, D0 + 4.6, 41], pushK(f, 760, 0.002), { fov: 50 });
const S9a = (f: number) => dolly([-56.2, D0 + 1.9, 58.0], [-57, D0 + 5.6, 72], pushK(f, 876, 0.002), { fov: 52 });
// 10: sunset, the empty bench (his cap left on it), then the crane out over the river
const S10a = (f: number) => dolly(add(BENCH, [1.6, 1.25, -4.4]), add(BENCH, [-0.2, 0.75, 0]), pushK(f, 958, 0.002), { fov: 42 });
const S10b = (f: number): Shot => {
  const a = S10a(1012), s = glide((f - 1012) / 98), r = 1 - s;
  const C = add(BENCH, [4, 4, -10]), E = add(BENCH, [9, 11, -24]), L = add(BENCH, [-14, 3, 10]);
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 42 + 6 * s, roll: 0 };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 86, cut: true, s: S1b }],
  2: [{ f: 132, s: S2a }],
  3: [{ f: 218, s: S3a }],
  4: [{ f: 292, s: S4a }, { f: 376, cut: true, s: S4b }],
  5: [{ f: 401, s: S5a }, { f: 488, cut: true, s: S5b }],
  6: [{ f: 528, s: S6a }, { f: 610, dur: 26, s: S6b }],
  7: [{ f: 669, s: S7a }],
  8: [{ f: 760, s: S8a }],
  9: [{ f: 876, s: S9a }],
  10: [{ f: 956, s: S10a }, { f: 1012, cut: true, s: S10b }],
};

const KICKS: [number, number][] = [[T(97), 0.6], [T(387), 0.4]];
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
const eyesAt = (p: V3, h = 1.62): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 86, cInf: 12 },
  { f: 136, cInf: 11, focus: eyesAt(READ_GAS) },
  { f: 218, cInf: 11, focus: eyesAt(READ_STORE) },
  { f: 296, cInf: 8, focus: eyesAt(READ_CAR) },
  { f: 376, cInf: 15 },
  { f: 405, cInf: 11, focus: eyesAt(READ_DINER, 1.1) },
  { f: 532, cInf: 10, focus: eyesAt(READ_BENCH, 1.1) },
  { f: 674, cInf: 6 },
  { f: 764, cInf: 0 },
  { f: 962, cInf: 9, focus: () => [BENCH[0], D0 + 0.7, BENCH[2]] },
  { f: 1012, dur: 50, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
