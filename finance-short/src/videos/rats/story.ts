// "The City That Paid for Rat Tails": Hanoi, 1902. Sets on the far-bank meadow, away from the town: the boulevard of
// the French quarter (villas, manhole, street lamp), the sewer tunnel, a villa bathroom, the bounty office, a rat farm.
// First film with real 3D characters (fig3d.ts). Shots are timed to rats-short/voice/words.json.
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
// the boulevard of the French quarter: road along z, villas on both sides
export const ROAD = { x0: 291, x1: 301, z0: 56, z1: 136 };
export const WALK_W = { x0: 287.5, x1: 291 }, WALK_E = { x0: 301, x1: 304.5 };
export const CURB = 0.15;
export const VILLA_Z = [64, 76, 88, 100, 112, 124];
export const MAN: V3 = [296, D0, 92];           // the manhole
export const LAMP: V3 = [301.9, D0 + CURB, 104.6];
export const CRATE: V3 = [300.0, D0, 103.8]; export const CRATE_H = 0.5;
export const POSTER: V3 = [304.45, D0 + CURB + 1.75, 101.2];
export const DRAINS: V3[] = [[301.08, D0 + 0.06, 96.5], [301.08, D0 + 0.06, 99.5], [301.08, D0 + 0.06, 105.6]];
export const SEWER: Room = { x0: 340, x1: 346, z0: 56, z1: 100, h: 3.4 };
export const LEDGE_H = 0.3;
export const BATH: Room = { x0: 360, x1: 366, z0: 56, z1: 62, h: 3.2 };
export const DRAIN_B: V3 = [362.6, D0, 59.7];
export const CHAIR: V3 = [361.0, D0, 60.7]; export const SEAT_H = 0.5;
export const OFFICE: Room = { x0: 380, x1: 394, z0: 56, z1: 68, h: 4 };
export const DESK = { x0: 389.6, x1: 392.4, z0: 64.2, z1: 65.0, y: D0 + 0.76 };
export const COUNTER = { x0: 381.5, x1: 387.5, z0: 62.6, z1: 63.4, y: D0 + 1.0 };
export const BOARD = { x0: 389.3, x1: 393.3, y0: D0 + 1.15, y1: D0 + 3.0, z: 67.96 };
export const FARM = { x0: 425, x1: 480, z0: 125, z1: 180 };
export const HUT = { x0: 452, x1: 458, z0: 152, z1: 158, h: 2.6 };
export const CAGES: V3[] = [444.4, 445.6, 446.8, 448.0].flatMap((x) => [[x, D0, 149.4], [x, D0 + 0.62, 149.4]] as V3[]);
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const TOTAL = 1880;
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 155, light: "golden" },     // in 1902 a city paid people to kill rats ... more rats than ever
  { id: 2, a: 155, b: 310, light: "day" },      // Hanoi, a French colony; a new quarter with modern sewers
  { id: 3, a: 310, b: 396, light: "golden" },   // the sewers: a perfect highway for rats
  { id: 4, a: 396, b: 470, light: "day" },      // straight into the fanciest houses in town
  { id: 5, a: 470, b: 592, light: "day" },      // plague spreading across Asia
  { id: 6, a: 592, b: 722, light: "day" },      // workers go down into the sewers; paid for every rat
  { id: 7, a: 722, b: 838, light: "day" },      // June 12th: over twenty thousand rats
  { id: 8, a: 838, b: 1015, light: "day" },     // disgusting; just bring us the tail; one cent per tail
  { id: 9, a: 1015, b: 1157, light: "day" },    // something strange: rats with no tails
  { id: 10, a: 1157, b: 1316, light: "golden" },// cutting off the tails and letting them go
  { id: 11, a: 1316, b: 1452, light: "golden" },// breeding rats outside the city
  { id: 12, a: 1452, b: 1561, light: "golden" },// cancelled; the rats stayed; the plague came anyway
  { id: 13, a: 1561, b: 1737, light: "day" },   // the cobra effect
  { id: 14, a: 1737, b: TOTAL, light: "golden" },// it started the rat business
];
export const XFADE: Record<number, number> = { 5: 8, 11: 12, 14: 12 };
export const FLASHES: [number, number][] = [[155, 4], [1057, 3]];
export const DARK = { a: -1, b: -1 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** manhole lid slide (0 = closed, 1 = pushed aside) */
export const lidAt = (id: number, f: number) => (id === 2 ? smooth((f - 262) / 16) : id === 6 ? 1 : 0);
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

const C1a = (f: number) => dolly([298.4, D0 + 1.05, 101.5], [299.95, D0 + 0.8, 103.8], pushK(f, 0, 0.0016, 0.006, 20), { fov: 44 });
const C1b = (f: number) => dolly([292.6, D0 + 7.5, 89.5], [298.4, D0 + 0.2, 103.4], pushK(f, 108, 0.001), { fov: 50 });
const C2 = (f: number) => dolly([294.0, D0 + 1.7, 85.6], [296.7, D0 + 1.25, 92.2], pushK(f, 155, 0.0014, 0.005, 18), { fov: 50 });
const C3 = (f: number) => dolly([343.1, D0 + 1.0, 58.6], [341.6, D0 + 0.55, 70.0], pushK(f, 310, 0.0016, 0.006, 14), { fov: 54 });
const C4 = (f: number) => dolly([363.7, D0 + 1.55, 56.2], [362.0, D0 + 1.25, 60.2], pushK(f, 396, 0.0018, 0.006, 14), { fov: 54 });
const C5 = (f: number) => dolly([390.7, D0 + 1.65, 58.6], [390.7, D0 + 1.8, 66.4], pushK(f, 470, 0.0016), { fov: 50 });
const C6 = (f: number) => dolly([292.6, D0 + 1.8, 85.8], [296.3, D0 + 0.85, 92.0], pushK(f, 592, 0.0012), { fov: 52 });
const C7 = (f: number) => dolly([384.4, D0 + 1.7, 58.4], [384.5, D0 + 2.0, 65.5], pushK(f, 722, 0.0016, 0.005, 14), { fov: 50 });
const C8 = (f: number) => dolly([386.4, D0 + 1.8, 57.0], [383.8, D0 + 1.65, 63.4], pushK(f, 838, 0.0012), { fov: 52 });
const C9 = (f: number) => dolly([296.3, D0 + 0.3, 92.2], [297.0, D0 + 0.85, 96.0], pushK(f, 1015, 0.0012), { fov: 54 });
const C10 = (f: number) => dolly([343.5, D0 + 1.25, 66.4], [341.4, D0 + 0.75, 70.2], pushK(f, 1157, 0.0014, 0.005, 14), { fov: 52 });
const C11 = (f: number) => dolly([446.4, D0 + 1.5, 142.4], [446.9, D0 + 0.9, 148.6], pushK(f, 1316, 0.0014), { fov: 52 });
const C12 = (f: number) => dolly([299.0, D0 + 1.4, 97.2], [303.6, D0 + 1.15, 100.6], pushK(f, 1452, 0.0016, 0.005, 14), { fov: 52 });
const C13 = (f: number) => dolly([391.0, D0 + 1.7, 57.6], [391.0, D0 + 1.85, 66.6], pushK(f, 1561, 0.0014), { fov: 50 });
const C14a = (f: number) => dolly([298.4, D0 + 1.05, 101.5], [299.95, D0 + 0.8, 103.8], pushK(f, 1737, 0.0016), { fov: 44 });
const C14b = (f: number) => dolly([293.0, D0 + 9.0, 86.0], [298.6, D0 + 0.5, 103.6], pushK(f, 1840, 0.0006), { fov: 50 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1a }, { f: 108, cut: true, s: C1b }], 2: [{ f: 155, s: C2 }], 3: [{ f: 310, s: C3 }], 4: [{ f: 396, s: C4 }],
  5: [{ f: 466, s: C5 }], 6: [{ f: 592, s: C6 }], 7: [{ f: 722, s: C7 }], 8: [{ f: 838, s: C8 }], 9: [{ f: 1015, s: C9 }],
  10: [{ f: 1157, s: C10 }], 11: [{ f: 1310, s: C11 }], 12: [{ f: 1452, s: C12 }], 13: [{ f: 1561, s: C13 }],
  14: [{ f: 1731, s: C14a }, { f: 1840, dur: 40, s: C14b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(959), 0.3], [T(1470), 0.5], [T(1203), 0.25]];
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
  { f: 0, cInf: 12, focus: () => [300.0, D0 + 0.8, 103.8] }, { f: 108, cInf: 0 }, { f: 155, cInf: 8, focus: () => [297.6, D0 + 1.5, 92.4] },
  { f: 310, cInf: 6, focus: () => [341.2, D0 + 0.5, 64.0] }, { f: 396, cInf: 8, focus: () => [362.2, D0 + 0.8, 60.0] },
  { f: 470, cInf: 9, focus: () => [391.0, D0 + 1.6, 66.0] }, { f: 592, cInf: 6, focus: () => [296.3, D0 + 1.0, 92.0] },
  { f: 722, cInf: 8, focus: () => [384.5, D0 + 1.6, 64.4] }, { f: 838, cInf: 7, focus: () => [383.4, D0 + 1.5, 62.4] },
  { f: 1015, cInf: 6, focus: () => [297.0, D0 + 0.4, 95.0] }, { f: 1157, cInf: 9, focus: () => [341.4, D0 + 0.7, 70.0] },
  { f: 1316, cInf: 6, focus: () => [447.2, D0 + 1.0, 147.0] }, { f: 1452, cInf: 7, focus: () => [303.6, D0 + 1.4, 101.2] },
  { f: 1561, cInf: 8, focus: () => [390.6, D0 + 1.8, 66.6] }, { f: 1737, cInf: 12, focus: () => [300.0, D0 + 0.8, 103.8] }, { f: 1840, dur: 40, cInf: 0 },
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
