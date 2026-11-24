// "Victorian London Was So Disgusting...": the Great Stink, 1858. The river town's river is the filthy Thames; on the
// far bank a stone embankment and the Palace of Westminster, on the near bank factories with smoking chimneys; a
// committee room inside Parliament; two of Bazalgette's brick sewers (one being built, one finished in 1875).
// 2D characters with real shadows in the 3D world. Shots are timed to stink-short/voice/words.json.
export const FPS = 30;
export const D0 = 6.0; // ground level of both banks (m)
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

// ---------------- places ----------------
export type Room = { x0: number; x1: number; z0: number; z1: number; h: number };
export const PROM = { x0: 268, x1: 520, z0: 30.0, z1: 41.5 };          // the embankment walk on the far bank (top = D0)
export const PALACE = { x0: 318, x1: 402, z0: 44, z1: 62, h: 17 };
export const CLOCK = { x: 312, z: 51, w: 6, h: 62 };                     // the clock tower (west end)
export const VTOWER = { x: 408, z: 51, w: 11, h: 52 };                   // the Victoria Tower (east end)
export const FACTORY = { x0: 330, x1: 470, z0: -78, z1: -36 };          // the near bank across the river
export const STACKS: V3[] = [[350, D0, -52], [384, D0, -60], [418, D0, -48], [452, D0, -58]];
export const STACK_H = 34;
export const PIPE: V3 = [430, 2.6, -30.2];                               // a factory outflow in the near-bank wall
export const ROOM: Room = { x0: 560, x1: 576, z0: 60, z1: 72, h: 6.5 };
export const TABLE = { x0: 563.5, x1: 572.5, z0: 64.6, z1: 66.4, y: D0 + 0.78 };
export const DOOR = { x: 575.95, z0: 67.2, z1: 68.8 };
export const TUN_A = { x: 610, z0: 76, z1: 132, r: 2.4, built: 104 };   // under construction: brick up to z = built
export const TUN_B = { x: 630, z0: 76, z1: 132, r: 2.4 };               // finished, 1875
export const TUN_FLOOR = D0 - 4.0;                                       // the sewers lie under the meadow
export const POL: V3 = [345.0, D0, 33.6];                                // the politician of the hook and the ending
export const BAZ: V3 = [380.0, D0, 33.2];
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const TOTAL = 1720;
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 145, light: "day" },        // so bad even Parliament wanted to escape
  { id: 2, a: 145, b: 284, light: "day" },      // the Thames: London's giant open sewer
  { id: 3, a: 284, b: 432, light: "day" },      // waste, dead animals, industrial garbage
  { id: 4, a: 432, b: 494, light: "day" },      // the summer of 1858
  { id: 5, a: 494, b: 586, light: "day" },      // above thirty degrees (the thermometer)
  { id: 6, a: 586, b: 648, light: "day" },      // the river baking in the heat
  { id: 7, a: 648, b: 736, light: "day" },      // unbearable; people couldn't stand near the river
  { id: 8, a: 736, b: 776, light: "day" },      // and inside Parliament?
  { id: 9, a: 776, b: 930, light: "day" },      // windows closed, curtains soaked
  { id: 10, a: 930, b: 1025, light: "day" },    // it didn't work; talk of moving Parliament
  { id: 11, a: 1025, b: 1146, light: "day" },   // enough; a law in 18 days
  { id: 12, a: 1146, b: 1240, light: "day" },   // Joseph Bazalgette, the green light
  { id: 13, a: 1240, b: 1305, light: "day" },   // a massive underground sewer system (being built)
  { id: 14, a: 1305, b: 1462, light: "day" },   // by 1875 the network was in place
  { id: 15, a: 1462, b: 1530, light: "golden" },// the Great Stink didn't just embarrass London
  { id: 16, a: 1530, b: TOTAL, light: "golden" },// it forced a city to rebuild what was underneath it
];
export const XFADE: Record<number, number> = { 6: 8, 14: 12, 15: 10 };
export const FLASHES: [number, number][] = [[145, 3], [936, 3], [1185, 4]];
export const DARK = { a: -1, b: -1 };
/** on-screen titles (scene cards) */
export const TITLES: { a: number; b: number; text: string }[] = [
  { a: 6, b: 145, text: "EVEN PARLIAMENT WANTED TO ESCAPE" }, { a: 150, b: 432, text: "LONDON'S OPEN SEWER" },
  { a: 437, b: 648, text: "THE SUMMER OF 1858" }, { a: 936, b: 1025, text: "EVEN THIS DIDN'T WORK" },
  { a: 1082, b: 1240, text: "18 DAYS TO PASS THE LAW" }, { a: 1466, b: TOTAL, text: "THE GREAT STINK CHANGED LONDON" },
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const walk = (f: number, f0: number, a: V3, b: V3, speed = 1.0): { p: V3; moving: boolean } => {
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]), u = clamp01(((f - f0) / FPS) * speed / (L || 1));
  return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], moving: f >= f0 && u < 1 };
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
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const H = (p: V3, d: V3) => add(p, d);

const C1a = (f: number) => ({ pos: [292 + 0.05 * f, D0 + 52 - 0.05 * f, -70 + 0.06 * f] as V3, look: [344, D0 + 4, 40] as V3, fov: 46 });
const C1b = (f: number) => dolly([345.4, D0 + 1.6, 38.4], [345.0, D0 + 1.45, 33.6], pushK(f, 70, 0.0018, 0.006, 16), { fov: 46 });
const C2 = (f: number) => ({ pos: [286 + 0.09 * (f - 145), 1.25, -5.5] as V3, look: [300 + 0.09 * (f - 145), 1.0, 22] as V3, fov: 52 });
const C3 = (f: number) => dolly([417.2, D0 + 1.7, 37.0], [420.6, D0 + 0.4, 29.2], pushK(f, 284, 0.0012), { fov: 54 });
const C4 = (f: number) => ({ pos: [392, D0 + 1.8, 36] as V3, look: [392 + 0.0, D0 + 14 + 0.18 * (f - 432), -60] as V3, fov: 52 });
const C5 = (f: number) => dolly([451.9, D0 + 2.0, 35.4], [452.0, D0 + 2.05, 33.5], pushK(f, 494, 0.0016, 0.006, 14), { fov: 50 });
const C6 = (f: number) => dolly([440.0, 0.9, 10.0], [452.0, 2.4, 26.0], pushK(f, 586, 0.002), { fov: 54 });
const C7 = (f: number) => dolly([467.2, D0 + 1.5, 39.4], [470.6, D0 + 1.2, 33.2], pushK(f, 648, 0.0012), { fov: 54 });
const C8 = (f: number) => dolly([360.0, D0 + 4.5, 31.0], [360.0, D0 + 8.5, 44.0], pushK(f, 736, 0.004), { fov: 50 });
const C9 = (f: number) => dolly([568.0, D0 + 1.75, 69.2], [568.0, D0 + 2.0, 60.2], pushK(f, 776, 0.0012), { fov: 54 });
const C10 = (f: number) => dolly([566.0, D0 + 1.65, 70.4], [570.5, D0 + 1.5, 64.0], pushK(f, 930, 0.0014, 0.006, 12), { fov: 54 });
const C11 = (f: number) => dolly([568.0, D0 + 1.8, 70.6], [568.0, D0 + 2.5, 60.4], pushK(f, 1025, 0.0014), { fov: 54 });
const C12 = (f: number) => dolly([380.3, D0 + 1.55, 39.6], [380.0, D0 + 1.45, 33.0], pushK(f, 1146, 0.0012, 0.006, 16), { fov: 50 });
const C13 = (f: number) => ({ pos: [TUN_A.x + 0.4, TUN_FLOOR + 1.5, 79 + 0.09 * (f - 1240)] as V3, look: [TUN_A.x - 0.2, TUN_FLOOR + 1.3, 112] as V3, fov: 56 });
const C14 = (f: number) => ({ pos: [TUN_B.x + 0.3, TUN_FLOOR + 1.5, 79 + 0.08 * (f - 1305)] as V3, look: [TUN_B.x, TUN_FLOOR + 1.4, 120] as V3, fov: 56 });
const C15 = (f: number) => dolly([345.4, D0 + 1.6, 38.4], [345.0, D0 + 1.45, 33.6], pushK(f, 1462, 0.0016), { fov: 46 });
const C16 = (f: number) => { const u = glide((f - 1530) / 190); return { pos: [338 - 40 * u, D0 + 2 + 50 * u, 31 - 95 * u] as V3, look: [352 + 8 * u, D0 + 3 + 3 * u, 40 + 4 * u] as V3, fov: 46 + 4 * u }; };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1a }, { f: 72, cut: true, s: C1b }], 2: [{ f: 145, s: C2 }], 3: [{ f: 284, s: C3 }], 4: [{ f: 432, s: C4 }],
  5: [{ f: 494, s: C5 }], 6: [{ f: 582, s: C6 }], 7: [{ f: 648, s: C7 }], 8: [{ f: 736, s: C8 }], 9: [{ f: 776, s: C9 }],
  10: [{ f: 930, s: C10 }], 11: [{ f: 1025, s: C11 }], 12: [{ f: 1146, s: C12 }], 13: [{ f: 1240, s: C13 }], 14: [{ f: 1299, s: C14 }],
  15: [{ f: 1457, s: C15 }], 16: [{ f: 1530, s: C16 }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(4), 0.5], [T(936), 0.35], [T(1061), 0.5], [T(1140), 0.4], [T(1185), 0.45]];
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
  { f: 0, cInf: 0 }, { f: 72, cInf: 10, focus: () => [345.0, D0 + 1.5, 33.6] }, { f: 145, cInf: 3, focus: () => [305.0, 0.6, 12.0] },
  { f: 284, cInf: 6, focus: () => [420.4, D0 + 1.2, 31.0] }, { f: 432, cInf: 0 }, { f: 494, cInf: 14, focus: () => [452.0, D0 + 2.0, 33.5] },
  { f: 586, cInf: 4, focus: () => [452.0, 2.0, 25.0] }, { f: 648, cInf: 6, focus: () => [469.0, D0 + 1.4, 33.0] }, { f: 736, cInf: 0 },
  { f: 776, cInf: 7, focus: () => [567.6, D0 + 1.6, 63.0] }, { f: 930, cInf: 7, focus: () => [569.5, D0 + 1.6, 64.5] },
  { f: 1025, cInf: 7, focus: () => [568.0, D0 + 1.8, 63.0] }, { f: 1146, cInf: 10, focus: () => [380.0, D0 + 1.5, 33.2] },
  { f: 1240, cInf: 5, focus: () => [TUN_A.x, TUN_FLOOR + 1.3, 91.0] }, { f: 1305, cInf: 3, focus: () => [TUN_B.x, TUN_FLOOR + 1.3, 96.0] },
  { f: 1462, cInf: 10, focus: () => [345.0, D0 + 1.5, 33.6] }, { f: 1530, cInf: 6, focus: () => [345.0, D0 + 1.5, 33.6] }, { f: 1600, dur: 60, cInf: 0 },
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
