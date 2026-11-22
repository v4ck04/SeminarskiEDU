// "He Sold a Country That Didn't Exist": Gregor MacGregor and Poyais (London 1822, the Black River coast 1823).
// The London river world of the other shorts: MacGregor sells his country on the landing stage; a painted jungle
// backdrop stands in for the Mosquito Coast. Shots are timed to the voice (poyais-short/voice/words.json).
export const FPS = 30;
export const TOTAL = 1650;
export const D0 = 6.0; // bank top (m)
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
/** keyframed value with smoothstep easing between keys */
export const ease = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + (y1 - y0) * smooth((x - x0) / (x1 - x0));
  }
  return pts[pts.length - 1][1];
};

// ---------------- places: the landing stage on the far bank (deck top = D0, river side z = 23.5) ----------------
export const PIER = { x0: 6.5, x1: 22.5, z0: 23.5, z1: 30 };
export const P1: V3 = [10, D0, 25.0];   // the first man (sells his time)
export const P2: V3 = [13.2, D0, 25.0]; // the second man (saves)
export const P3: V3 = [16.6, D0, 25.0]; // the third man (builds the net)
export const SEAT = 0.34;               // card y offset when sitting on a crate
export const CRATES: V3[] = [[10.95, D0, 25.7], [17.55, D0, 25.7]]; // stools beside the first and third man
export const RACK: { x0: number; x1: number; z: number; y: number } = { x0: 11.35, x1: 12.65, z: 26.6, y: D0 + 1.62 }; // drying rack (fish)
export const NETRACK: { x0: number; x1: number; z: number; y: number } = { x0: 18.0, x1: 21.6, z: 26.8, y: D0 + 2.05 }; // net rack
export const WATER_Y = 0.04;
// legacy names the shared world code still reads
export const TREE: V3 = [70.2, D0, -74.8];
export const PRESS: V3 = [-31.8, D0, 48.55];
export const GATE: V3 = [-48, D0, 37.5];
export const BENCH: V3 = [-3, D0, 33.3];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 145, light: "day" },        // in 1822 a Scottish soldier sold London a country that did not exist
  { id: 2, a: 145, b: 183, light: "day" },      // it was called Poyais
  { id: 3, a: 183, b: 410, light: "day" },      // its prince; rich land, rivers full of fish, a capital with a theater
  { id: 4, a: 410, b: 555, light: "day" },      // a guidebook by Captain Thomas Strangeways; there was no Strangeways
  { id: 5, a: 555, b: 748, light: "day" },      // Poyais money, land, bonds: two hundred thousand pounds
  { id: 6, a: 748, b: 797, light: "day" },      // and people started packing
  { id: 7, a: 797, b: 870, light: "day" },      // two ships of settlers sailed for Central America
  { id: 8, a: 870, b: 982, light: "day" },      // no capital, no theater, no town; just jungle
  { id: 9, a: 982, b: 1117, light: "day" },     // luckily, Poyais money; unluckily, nobody had heard of it
  { id: 10, a: 1117, b: 1170, light: "golden" },// most of them never came home
  { id: 11, a: 1170, b: 1358, light: "day" },   // why did it work? like buying a house from photos
  { id: 12, a: 1358, b: 1478, light: "golden" },// MacGregor was in France, selling Poyais again
  { id: 13, a: 1478, b: 1540, light: "day" },   // put on trial, and walked free
  { id: 14, a: 1540, b: TOTAL, light: "golden" },// the best lie is a place nobody can visit
];
export const XFADE: Record<number, number> = { 10: 10, 11: 8, 12: 10, 13: 8, 14: 12 };
export const FLASHES: [number, number][] = [[145, 4], [870, 3]];

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
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];





const sat = (c: V3): V3 => [c[0], c[1] + SEAT, c[2] - 0.12];
export const P1S = sat(CRATES[0]), P3S = sat(CRATES[1]);
// staging points
export const MG: V3 = [12.6, D0, 25.3];
export const CROWD: V3[] = [[11.35, D0, 25.7], [11.85, D0, 26.05], [13.35, D0, 26.05], [13.85, D0, 25.7]];
export const SETTLERS: V3[] = [[11.4, D0, 25.3], [12.2, D0, 25.6], [13.0, D0, 25.2], [13.8, D0, 25.5]];
export const JUNGLE: V3 = [12.6, D0 + 5.0, 29.5];
export const shipX = (f: number) => 4.5 + 8.5 * clamp01((f - 790) / 85);
export const SHIPZ = 19.0;
export const mgX = (f: number) => 12.6 - 4.4 * smooth((f - 1515) / 95);
/** the packers walking along the stage (shot 6) */
export const packX = (f: number, k: number) => 15.2 + 0.9 * k - 3.2 * clamp01((f - 748) / 49);

const H = (p: V3, d: V3) => add(p, d);
const C1 = (f: number) => dolly([12.4, D0 + 1.6, 18.6], [12.6, D0 + 1.3, 25.6], pushK(f, 0, 0.0018, 0.005, 20), { fov: 50 });
const C2 = (f: number) => dolly(H(MG, [-0.5, 1.45, -3.0]), H(MG, [-0.25, 1.6, 0]), pushK(f, 145, 0.003), { fov: 42, roll: 0.03 });
const C3 = (f: number) => dolly(H(MG, [0.35, 1.6, -4.4]), H(MG, [0.35, 1.6, 0]), pushK(f, 183, 0.0016, 0.005, 20), { fov: 46 });
const C4 = (f: number) => dolly(H(MG, [-0.45, 1.5, -3.0]), H(MG, [-0.45, 1.65, 0]), pushK(f, 410, 0.0025, 0.007, 18), { fov: 40 });
const C5 = (f: number) => dolly(H(MG, [0, 1.5, -5.0]), H(MG, [0, 1.25, 0]), pushK(f, 555, 0.0016), { fov: 48 });
const C6 = (f: number) => dolly([11.0, D0 + 1.8, 19.0], [14.0, D0 + 1.0, 25.4], pushK(f, 748, 0.002), { fov: 50 });
const C7 = (f: number) => dolly([10.0, D0 + 0.4, 9.5], [10.2, 3.6, 22.0], pushK(f, 797, 0.0018), { fov: 52 });
const C8a = (f: number) => dolly([12.6, D0 + 1.4, 20.6], [12.6, D0 + 1.3, 25.6], pushK(f, 870, 0.0022, 0.008, 16), { fov: 48 });
const C8b = (f: number) => dolly([12.6, D0 + 2.2, 17.4], [12.6, D0 + 2.0, 26.0], pushK(f, 952, 0.0015), { fov: 54 });
const C9 = (f: number) => dolly(H(SETTLERS[1], [-0.2, 1.4, -2.8]), H(SETTLERS[1], [-0.25, 1.5, 0]), pushK(f, 982, 0.0025), { fov: 42 });
const C10 = (f: number) => dolly([12.6, D0 + 1.0, 21.5], [12.6, D0 + 0.8, 25.6], pushK(f, 1112, 0.002), { fov: 46 });
const C11 = (f: number) => dolly(H(MG, [-0.15, 1.55, -4.8]), H(MG, [-0.15, 1.45, 0]), pushK(f, 1166, 0.0016, 0.005, 20), { fov: 48 });
const C12 = (f: number) => dolly(H(MG, [0.15, 1.6, -4.8]), H(MG, [0.15, 1.5, 0]), pushK(f, 1353, 0.0018), { fov: 50 });
const C13 = (f: number): Shot => { const x = mgX(f); return { pos: [x, D0 + 1.5, 20.4], look: [x, D0 + 1.1, 25.3], fov: 46 }; };
const C14a = (f: number): Shot => { const x = mgX(f); return { pos: [x + 0.3, D0 + 1.6, 20.0], look: [x, D0 + 1.1, 25.3], fov: 48 }; };
const C14b = (f: number) => dolly([10.5, D0 + 7.0, 11.0], [9.5, D0 + 0.4, 25.0], pushK(f, 1575, 0.0012), { fov: 50 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1 }], 2: [{ f: 145, s: C2 }], 3: [{ f: 183, s: C3 }], 4: [{ f: 410, s: C4 }], 5: [{ f: 555, s: C5 }],
  6: [{ f: 748, s: C6 }], 7: [{ f: 797, s: C7 }], 8: [{ f: 870, s: C8a }, { f: 952, dur: 26, s: C8b }], 9: [{ f: 982, s: C9 }],
  10: [{ f: 1112, s: C10 }], 11: [{ f: 1166, s: C11 }], 12: [{ f: 1353, s: C12 }], 13: [{ f: 1474, s: C13 }],
  14: [{ f: 1534, s: C14a }, { f: 1575, dur: 60, s: C14b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(116), 0.4], [T(157), 0.45], [T(508), 0.4], [T(870), 0.6], [T(1055), 0.4]];
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
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyesAt = (p: V3, h = 1.62): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 7, focus: eyesAt(MG) }, { f: 145, cInf: 15, focus: eyesAt(MG) }, { f: 183, cInf: 9, focus: eyesAt(MG) },
  { f: 410, cInf: 13, focus: eyesAt(MG) }, { f: 555, cInf: 8, focus: eyesAt(MG) }, { f: 748, cInf: 0 }, { f: 797, cInf: 0 },
  { f: 870, cInf: 6, focus: () => [12.6, D0 + 1.5, 25.4] }, { f: 952, dur: 20, cInf: 0 }, { f: 982, cInf: 13, focus: eyesAt(SETTLERS[1]) },
  { f: 1117, cInf: 8, focus: () => [12.6, D0 + 0.6, 25.5] }, { f: 1170, cInf: 8, focus: eyesAt(MG) }, { f: 1358, cInf: 9, focus: eyesAt(MG) },
  { f: 1478, cInf: 8, focus: (f) => [mgX(f), D0 + 1.5, 25.3] }, { f: 1575, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing objects (built by world.ts): kit = a cartoon plant name; visible a <= f < b */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
