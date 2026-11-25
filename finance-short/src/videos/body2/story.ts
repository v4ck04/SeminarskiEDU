// "Body Number 2": a shot-by-shot sci-fi mystery from the user's doc. Darko wakes in a different body every day (today
// the President, tomorrow a baker); his yellow-green eyes never change. 2D characters (toon.ts drawChar) in 3D sets:
// the presidential bedroom, a marble hallway, the office (drawer, note, hologram globe), the press room, a balcony over
// the city, an operating room, a cockpit, a fishing boat on the river, a bakery and its street at dawn.
// Shots are timed to body2-short/voice/words.json. No captions; the title card is an overlay (Body2.tsx).
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
export const BED: Room = { x0: 300, x1: 310, z0: 60, z1: 70, h: 4.4 };
export const BED_DOOR = { x0: 303.9, x1: 306.1, h: 2.9 };                 // double doors in the z0 wall
export const CLOCK_B: V3 = [302.55, D0 + 0.66, 68.9];                    // the bedside clock (display faces -z)
export const MIRROR = { x: 300.0, z: 64.5, y: 1.6, w: 1.1, h: 1.6 };
export const HALL: Room = { x0: 320, x1: 344, z0: 62, z1: 66, h: 4.2 };
export const OFF: Room = { x0: 350, x1: 364, z0: 58, z1: 70, h: 4.2 };
export const DESK = { x0: 355.5, x1: 359.5, z0: 65.5, z1: 66.6, y: D0 + 0.78 };
export const GLOBE: V3 = [357.5, D0 + 2.0, 64.4];
export const PRESS: Room = { x0: 380, x1: 396, z0: 56, z1: 72, h: 5 };
export const SIGN: V3 = [388, D0, 67.0];
export const BALC: V3 = [276.5, D0 + 14, 39.0];
export const OR: Room = { x0: 420, x1: 428, z0: 60, z1: 68, h: 3.2 };
export const COCK: Room = { x0: 440, x1: 444, z0: 60, z1: 62.8, h: 2.2 };
export const BOAT: V3 = [300, 0.05, 8];
export const BAK: Room = { x0: 460, x1: 470, z0: 60, z1: 68, h: 3.1 };
export const BAK_WIN = { x0: 461.6, x1: 468.4, y0: 0.85, y1: 2.6 };       // the shop window in the z0 wall
export const STREET = { x0: 440, x1: 490, z0: 38, z1: 60 };
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const TOTAL = 1560;
const S = (id: number, a: number, b: number, light: Light = "day"): ShotDef => ({ id, a, b, light });
export const SHOTS: ShotDef[] = [
  S(1, 0, 100), S(2, 100, 172), S(3, 172, 240), S(4, 240, 292), S(5, 292, 350), S(6, 350, 395), S(7, 395, 424), S(8, 424, 480),
  S(9, 480, 580), S(10, 580, 625), S(11, 625, 655), S(12, 655, 697), S(13, 697, 745), S(14, 745, 800), S(15, 800, 830),
  S(16, 830, 860, "golden"), S(17, 860, 890, "golden"), S(18, 890, 922), S(19, 922, 955), S(20, 955, 1021), S(21, 1021, 1081, "golden"),
  S(22, 1081, 1150), S(23, 1150, 1195), S(24, 1195, 1290), S(25, 1290, 1357, "golden"), S(26, 1357, TOTAL, "golden"),
];
export const XFADE: Record<number, number> = {};
export const FLASHES: [number, number][] = [[1150, 3]];
export const DARK = { a: -1, b: -1 };
export const BLACK = { a: -1, b: -1 };
export const FISHEYE = { a: -1, b: -1 };
export const TITLE = { a: 1395, b: TOTAL };
export const ENDCARD = { a: 1470, b: TOTAL };
export const doorsOpen = (f: number) => (f < 292 ? 0 : f < 300 ? smooth((f - 292) / 8) : 1);
export const drawerOut = (f: number) => (f < 430 ? 0 : smooth((f - 430) / 14));
export const clockB = (f: number) => (f < 1081 ? "6:59" : f < 1115 ? "11:59" : "12:00");
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

const orbit = (c: V3, r: number, a0: number, a1: number, f: number, f0: number, f1: number, h: number, look: V3, fov: number) => {
  const u = glide((f - f0) / (f1 - f0)), a = a0 + (a1 - a0) * u;
  return { pos: [c[0] + Math.sin(a) * r, h, c[2] - Math.cos(a) * r] as V3, look, fov };
};
const C1 = (f: number) => dolly([302.45, D0 + 0.74, 68.25], [302.62, D0 + 0.71, 69.1], pushK(f, 0, 0.0015), { fov: 34 });
const C2 = (f: number) => { const u = glide((f - 100) / 60); return { pos: [305.0, D0 + 0.4 + 0.4 * u, 63.6 + 1.6 * u] as V3, look: [305.0, D0 + 1.4, 68.6] as V3, fov: 50 }; };
const C3 = (f: number) => dolly([302.3, D0 + 1.62, 62.6], [300.1, D0 + 1.55, 64.5], pushK(f, 172, 0.002), { fov: 44, roll: 0.14 });
const C4 = (f: number) => { const a = 0.6 + 1.6 * glide((f - 240) / 52), r = 2.8, h = D0 + 3.9 + 0.3 * glide((f - 240) / 52); return { pos: [305 + Math.sin(a) * r, h, 65 - Math.cos(a) * r] as V3, look: [305, D0 + 0.4, 65.2] as V3, fov: 54 }; };
const C5 = (f: number) => dolly([305.0, D0 + 1.45, 68.2], [305.0, D0 + 1.45, 60.2], pushK(f, 292, 0.0015), { fov: 52 });
const C6 = (f: number) => { const w = glide((f - 384) / 8); return { pos: [306.45 - 0.6 * w, D0 + 1.65, 65.0] as V3, look: [305.0 + 2.4 * w, D0 + 1.45 + 0.1 * w, 62.0 + 1.6 * w] as V3, fov: 44 }; };
const C7 = (f: number) => { const x = 326 + 0.36 * (f - 395); return { pos: [x + 3.0, D0 + 0.35, 63.4] as V3, look: [x - 2, D0 + 1.0, 64.2] as V3, fov: 56 }; };
const C8 = (f: number) => dolly([357.5, D0 + 0.98, 64.35], [357.5, D0 + 0.6, 65.25], pushK(f, 424, 0.003), { fov: 40 });
const C9 = (f: number) => dolly([357.5, D0 + 1.85, 65.35], [357.5, D0 + 0.79, 66.05], pushK(f, 480, 0.001), { fov: 40 });
const C10 = (f: number) => { const u = glide((f - 584) / 30); return { pos: [357.5, D0 + 1.6, 64.9 + 0.9 * u] as V3, look: [357.5, D0 + 1.55, 67.3] as V3, fov: 34 + 34 * u }; };
const C11 = (f: number) => ({ pos: [362.8, D0 + 2.9, 59.0] as V3, look: [357.0, D0 + 0.9, 65.4] as V3, fov: 56 });
const C12 = (f: number) => orbit([357.7, 0, 65.7], 3.7, -0.45, 0.6, f, 655, 697, D0 + 1.7, [357.7, D0 + 1.35, 65.7], 50);
const C13 = (f: number) => dolly([358.15, D0 + 1.56, 63.95], [358.4, D0 + 1.52, 64.6], pushK(f, 697, 0.005), { fov: 30 });
const C14 = (f: number) => { const u = glide((f - 750) / 46); return { pos: [GLOBE[0] + 0.15, GLOBE[1] + 0.1, GLOBE[2] - 0.75 - 2.4 * u] as V3, look: GLOBE, fov: 44 }; };
const C15 = (f: number) => dolly([424.2, D0 + 2.9, 62.6], [424.0, D0 + 1.3, 66.6], pushK(f, 800, 0.003), { fov: 50 });
const C16 = (f: number) => dolly([442.1, D0 + 1.25, 62.45], [442.0, D0 + 1.15, 60.3], pushK(f, 830, 0.003), { fov: 52 });
const C17 = (f: number) => dolly([297.0, 1.5, 4.4], [301.4, 1.6, 7.8], pushK(f, 860, 0.0015), { fov: 44 });
const C18 = (f: number) => { const u = glide((f - 890) / 30); return { pos: [357.5, D0 + 3.9 - 1.8 * u, 64.0 + 0.3 * u] as V3, look: [357.6, D0 + 0.8, 66.0] as V3, fov: 50 }; };
const C19 = (f: number) => dolly([357.75, D0 + 1.05, 65.55], [357.6, D0 + 0.79, 65.95], pushK(f, 922, 0.003), { fov: 30 });
const C20 = (f: number) => orbit([SIGN[0], 0, SIGN[2] - 0.2], 2.8, -0.7, 0.4, f, 955, 1021, D0 + 0.9, [SIGN[0], D0 + 1.25, SIGN[2]], 46);
const C21 = (f: number) => { const u = glide((f - 1021) / 56); return { pos: [BALC[0] + 2.0 - 0.8 * u, BALC[1] + 1.4 + 2.6 * u, BALC[2] + 0.6 * u] as V3, look: [BALC[0] - 30, BALC[1] - 4 - 4 * u, BALC[2] - 2] as V3, fov: 50 + 6 * u }; };
const C22a = (f: number) => dolly([304.5, D0 + 1.7, 66.5], [305.0, D0 + 1.42, 68.9], pushK(f, 1081, 0.003), { fov: 40 });
const C22b = (f: number) => dolly([302.55, D0 + 0.72, 68.15], [302.55, D0 + 0.68, 69.1], pushK(f, 1112, 0.0015), { fov: 36 });
const C23 = (f: number) => dolly([466.0, D0 + 1.35, 64.6], [468.6, D0 + 0.95, 61.8], pushK(f, 1150, 0.003, 0.006, 12), { fov: 50 });
const C24 = (f: number) => { const u = glide((f - 1195) / 90); return { pos: [464.6 + 0.02 * Math.sin(f * 0.3), D0 + 1.45 - 0.2 * u + 0.01 * Math.sin(f * 0.21), 63.6 + 0.9 * u] as V3, look: [464.6, D0 + 1.0, 65.6] as V3, fov: 46 }; };
const C25 = (f: number) => { const u = glide((f - 1295) / 45); return { pos: [465.0, D0 + 1.5, 66.6] as V3, look: [464.6 + 0.4 * u, D0 + 1.0 + 0.6 * u, 65.6 - 7.6 * u] as V3, fov: 46 }; };
const C26 = (f: number) => { const u = glide((f - 1362) / 140); return { pos: [465.0, D0 + 1.6 + 9 * u, 59.2 - 18 * u] as V3, look: [465.0, D0 + 1.4 + 0.6 * u, 60.0] as V3, fov: 46 + 6 * u }; };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1 }], 2: [{ f: 100, s: C2 }], 3: [{ f: 172, s: C3 }], 4: [{ f: 240, s: C4 }], 5: [{ f: 292, s: C5 }], 6: [{ f: 350, s: C6 }],
  7: [{ f: 395, s: C7 }], 8: [{ f: 424, s: C8 }], 9: [{ f: 480, s: C9 }], 10: [{ f: 580, s: C10 }], 11: [{ f: 625, s: C11 }], 12: [{ f: 655, s: C12 }],
  13: [{ f: 697, s: C13 }], 14: [{ f: 745, s: C14 }], 15: [{ f: 800, s: C15 }], 16: [{ f: 830, s: C16 }], 17: [{ f: 860, s: C17 }], 18: [{ f: 890, s: C18 }],
  19: [{ f: 922, s: C19 }], 20: [{ f: 955, s: C20 }], 21: [{ f: 1021, s: C21 }], 22: [{ f: 1081, s: C22a }, { f: 1112, cut: true, s: C22b }], 23: [{ f: 1150, s: C23 }],
  24: [{ f: 1195, s: C24 }], 25: [{ f: 1290, s: C25 }], 26: [{ f: 1357, s: C26 }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(292), 0.5], [T(584), 0.3], [T(1150), 0.45]];
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
  { f: 0, cInf: 22, focus: () => [302.6, D0 + 0.68, 68.9] }, { f: 55, dur: 14, cInf: 22, focus: () => [302.8, D0 + 0.9, 69.8] },
  { f: 100, cInf: 8, focus: () => [305.0, D0 + 1.4, 68.0] }, { f: 172, cInf: 10, focus: () => [300.2, D0 + 1.6, 64.6] }, { f: 240, cInf: 3 },
  { f: 292, cInf: 6, focus: () => [305.0, D0 + 1.5, 61.2] }, { f: 350, cInf: 12, focus: () => [305.0, D0 + 1.5, 62.1] }, { f: 395, cInf: 5, focus: () => [327, D0 + 1.0, 63.8] },
  { f: 424, cInf: 16, focus: () => [357.5, D0 + 0.62, 65.2] }, { f: 480, cInf: 18, focus: () => [357.5, D0 + 0.79, 65.85] }, { f: 540, dur: 30, cInf: 18, focus: () => [357.5, D0 + 0.79, 66.15] },
  { f: 580, cInf: 10, focus: () => [357.5, D0 + 1.55, 67.3] }, { f: 625, cInf: 4, focus: () => [357.2, D0 + 1.0, 65.6] }, { f: 655, cInf: 8, focus: () => [357.7, D0 + 1.4, 65.7] },
  { f: 697, cInf: 18, focus: () => [358.4, D0 + 1.52, 64.6] }, { f: 745, cInf: 8, focus: () => GLOBE }, { f: 800, cInf: 6, focus: () => [424.0, D0 + 1.5, 67.1] },
  { f: 830, cInf: 8, focus: () => [442.0, D0 + 1.3, 61.6] }, { f: 860, cInf: 6, focus: () => [301.6, 1.6, 7.8] }, { f: 890, cInf: 8, focus: () => [357.6, D0 + 1.0, 66.0] },
  { f: 922, cInf: 20, focus: () => [357.6, D0 + 0.79, 65.95] }, { f: 955, cInf: 8, focus: () => [SIGN[0], D0 + 1.2, SIGN[2]] }, { f: 1021, cInf: 0 },
  { f: 1081, cInf: 14, focus: () => [305.0, D0 + 1.42, 68.9] }, { f: 1112, cInf: 22, focus: () => [302.6, D0 + 0.68, 68.9] }, { f: 1150, cInf: 8, focus: () => [468.7, D0 + 1.0, 61.8] },
  { f: 1195, cInf: 10, focus: () => [464.6, D0 + 1.0, 65.6] }, { f: 1290, cInf: 6, focus: () => [465.0, D0 + 1.2, 57.0] }, { f: 1357, cInf: 4, focus: () => [465.0, D0 + 1.2, 57.0] }, { f: 1420, dur: 60, cInf: 0 },
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
