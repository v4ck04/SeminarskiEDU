// "Eleven Days Without Jensen": Jensen Huang steps down as Nvidia CEO (12 Nov 2026) and is reinstated (23 Nov 2026).
// Five sets side by side on the far-bank meadow, away from the town: the keynote stage, the trading floor, the
// boardroom, the HQ plaza (glass building, steps, sign), a restaurant. Shots are timed to nvidia-short/voice/words.json.
export const FPS = 30;
export const TOTAL = 2230;
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
export const STG: Room = { x0: 280, x1: 304, z0: 58, z1: 76, h: 9 };     // keynote hall
export const STAGE = { x0: 284, x1: 300, z0: 68.5, z1: 75, y: D0 + 0.9 }; // the stage platform
export const SCREEN = { x0: 287.6, x1: 296.4, y0: D0 + 2.3, y1: D0 + 8.3, z: 75.98 }; // keynote screen (back wall)
export const JS: V3 = [292, STAGE.y, 71.6];                                // Jensen on stage
export const STOOL: V3 = [292.7, STAGE.y, 71.9];
export const TRD: Room = { x0: 320, x1: 346, z0: 58, z1: 80, h: 7.5 };    // trading floor
export const WALL = { x0: 325, x1: 341, y0: D0 + 2.0, y1: D0 + 6.5, z: 79.9 }; // the big market screen
export const DESKS = [{ z0: 67.6, z1: 68.4 }, { z0: 72.6, z1: 73.4 }];
export const DESK_Y = D0 + 0.72;
export const TRADERS: V3[] = [[327.6, D0, 68.9], [330.6, D0, 68.9], [333.6, D0, 68.9], [336.6, D0, 68.9], [339.6, D0, 68.9],
  [329.1, D0, 73.9], [332.1, D0, 73.9], [335.1, D0, 73.9], [338.1, D0, 73.9]];
export const ANALYST: V3 = [334.0, D0, 66.4];
export const BRD: Room = { x0: 360, x1: 378, z0: 56, z1: 72, h: 4.6 };    // boardroom
export const TABLE = { x0: 363.5, x1: 372.5, z0: 65.2, z1: 67.4, y: D0 + 0.74 };
export const BOARD: V3[] = [[364.6, D0, 67.95], [366.6, D0, 67.95], [368.6, D0, 67.95], [370.6, D0, 67.95]];
export const BDOOR = { x: 377.95, z0: 61.2, z1: 63.2, h: 2.6 };          // door in the left wall (seen from the room)
export const HQ = { x0: 420, x1: 452, zf: 120, zb: 140, h: 18 };         // glass HQ, front at zf facing -z
export const HQDOOR = { x0: 434.2, x1: 437.8, y1: D0 + 0.45 + 2.9 };
export const HQSTEP = (z: number) => (z >= 119.2 ? 0.45 : z >= 118.4 ? 0.3 : z >= 117.6 ? 0.15 : 0);
export const SIGN: V3 = [425.5, D0, 112.0];
export const RST: Room = { x0: 480, x1: 496, z0: 56, z1: 70, h: 4.2 };    // restaurant
export const RTABLES: V3[] = [[484.6, D0, 63.4], [488.0, D0, 64.2], [491.4, D0, 63.4]];
export const PASS = { x0: 486.2, x1: 489.8, y0: D0 + 1.05, y1: D0 + 2.3, z: 69.98 };
export const CHEF: V3 = [488.0, D0, 69.3];
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- the market screen ----------------
/** the big screen's chart in shot id at frame f: values 0..1 (left to right), trend colour and caption */
export const chartAt = (id: number, f: number): { v: number[]; up: boolean; label: string } => {
  const N = 48, v: number[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), w = 0.03 * Math.sin(i * 1.7) + 0.02 * Math.sin(i * 4.3);
    if (id === 1) { const k = easeOut((f - 110) / 24); v.push(0.22 + w + (u > 0.5 ? k * (u - 0.5) * 1.5 : 0)); }
    else if (id === 6) { const k = clamp01((f - 840) / 70); v.push(0.62 + w - (u > 0.35 ? k * (u - 0.35) * 0.8 : 0)); }
    else if (id === 13) { const k = easeOut((f - 1890) / 40); v.push(0.25 + w + u * 0.25 + (u > 0.6 ? k * (u - 0.6) * 1.3 : 0)); }
    else v.push(0.45 + w);
  }
  const lab = id === 1 ? (f >= 120 ? "NVDA  +30%" : "NVDA") : id === 6 ? (f >= 870 ? "NVDA  16-MONTH LOW" : "NVDA") : id === 13 ? (f >= 1975 ? "NASDAQ  \u25B2" : "NVDA  +30%") : "NVDA";
  return { v, up: id !== 6, label: lab };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 195, light: "day" },        // eleven days after its boss quit ... thirty percent in one morning
  { id: 2, a: 195, b: 398, light: "day" },      // Jensen Huang co-founded Nvidia in 1993 ... the leather jacket
  { id: 3, a: 398, b: 472, light: "day" },      // on November the twelfth, he stepped down
  { id: 4, a: 472, b: 680, light: "day" },      // reports said ... China denied it
  { id: 5, a: 680, b: 812, light: "day" },      // the FBI, Congress and Nvidia's own board
  { id: 6, a: 812, b: 998, light: "day" },      // lowest close in sixteen months; price target cut in half
  { id: 7, a: 998, b: 1136, light: "day" },     // a petition ... a hundred and seventy thousand
  { id: 8, a: 1136, b: 1205, light: "day" },    // the board said it wasn't even considering it
  { id: 9, a: 1205, b: 1350, light: "day" },    // Monday morning: unanimously, his job back
  { id: 10, a: 1350, b: 1520, light: "day" },   // luckily, the President called; unluckily, the investigation
  { id: 11, a: 1520, b: 1694, light: "day" },   // why forgive so fast? one man's plan
  { id: 12, a: 1694, b: 1862, light: "day" },   // a restaurant losing its famous chef
  { id: 13, a: 1862, b: 2015, light: "day" },   // close to a trillion dollars more
  { id: 14, a: 2015, b: TOTAL, light: "golden" },// eleven days ... a leather jacket
];
export const XFADE: Record<number, number> = { 7: 10, 12: 10, 14: 12 };
export const FLASHES: [number, number][] = [[195, 4], [1276, 3]];
export const DARK = { a: 445, b: 472 };  // shot 3: the hall lights go out

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// door angles (radians, 0 = shut)
export const boardDoor = (id: number, f: number) => id === 5 ? ease([[684, 0], [692, 1.6], [790, 1.6], [805, 0.2]], f) : id === 9 ? ease([[1306, 0], [1313, 1.7]], f) : id === 10 ? 1.7 : 0;
export const hqDoor = (id: number, f: number) => id === 7 ? 0 : id === 8 ? ease([[1136, 1.2], [1166, 1.2], [1178, 0]], f) : id === 14 ? ease([[2130, 0], [2145, 1.2]], f) : 0;

// walkers
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

const C1 = (f: number) => dolly([333.2, D0 + 2.2, 62.0], [333.0, D0 + 3.3, 79.0], pushK(f, 0, 0.0016, 0.006, 20), { fov: 58 });
const C2a = (f: number) => dolly([292.4, D0 + 2.4, 61.0], [292.0, D0 + 3.6, 74.0], pushK(f, 195, 0.0012), { fov: 52 });
const C2b = (f: number) => dolly([292.2, D0 + 2.2, 66.2], [292.0, D0 + 2.35, 71.6], pushK(f, 300, 0.0018, 0.005, 16), { fov: 44 });
const C3 = (f: number) => dolly([292.5, D0 + 2.3, 67.2], [292.3, D0 + 2.25, 71.8], pushK(f, 398, 0.0016), { fov: 44, roll: 0.03 });
const C4 = (f: number) => dolly([333.4, D0 + 1.9, 63.4], [333.5, D0 + 2.3, 70.0], pushK(f, 472, 0.0012), { fov: 50 });
const C5 = (f: number) => dolly([370.3, D0 + 1.65, 58.6], [370.2, D0 + 1.4, 66.0], pushK(f, 680, 0.0012), { fov: 56 });
const C6 = (f: number) => dolly([333.85, D0 + 1.75, 60.6], [333.7, D0 + 2.05, 70.0], pushK(f, 812, 0.0012, 0.005, 18), { fov: 54 });
const C7 = (f: number) => dolly([436.4, D0 + 1.45, 107.0], [436.1, D0 + 1.1, 116.5], pushK(f, 998, 0.0012), { fov: 54 });
const C8 = (f: number) => dolly([436.6, D0 + 1.6, 112.8], [436.0, D0 + 1.8, 119.6], pushK(f, 1136, 0.002, 0.006, 16), { fov: 48 });
const C9 = (f: number) => dolly([369.2, D0 + 1.7, 61.4], [369.2, D0 + 1.5, 67.0], pushK(f, 1205, 0.0012, 0.006, 16), { fov: 56 });
const C10a = (f: number) => dolly([367.8, D0 + 1.6, 61.5], [367.6, D0 + 1.35, 66.8], pushK(f, 1350, 0.0016), { fov: 48 });
const C10b = (f: number) => dolly([364.6, D0 + 1.6, 58.6], [362.6, D0 + 1.45, 62.6], pushK(f, 1440, 0.0016), { fov: 48 });
const C11 = (f: number) => dolly([333.6, D0 + 1.3, 60.6], [333.5, D0 + 3.4, 79.0], pushK(f, 1520, 0.0014, 0.005, 16), { fov: 54 });
const C12 = (f: number) => dolly([488.3, D0 + 1.75, 57.6], [488.0, D0 + 1.45, 66.0], pushK(f, 1694, 0.0012), { fov: 56 });
const C13 = (f: number) => dolly([333.8, D0 + 2.4, 60.4], [333.5, D0 + 3.2, 79.0], pushK(f, 1862, 0.0016, 0.006, 20), { fov: 56 });
const C14a = (f: number) => dolly([435.9, D0 + 1.55, 111.6], [435.6, D0 + 1.85, 117.0], pushK(f, 2015, 0.0012), { fov: 52 });
const C14b = (f: number) => dolly([440.0, D0 + 12.0, 86.0], [436.0, D0 + 7.0, 125.0], pushK(f, 2150, 0.0008), { fov: 54 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1 }], 2: [{ f: 195, s: C2a }, { f: 296, dur: 30, s: C2b }], 3: [{ f: 398, s: C3 }], 4: [{ f: 472, s: C4 }],
  5: [{ f: 680, s: C5 }], 6: [{ f: 812, s: C6 }], 7: [{ f: 993, s: C7 }], 8: [{ f: 1136, s: C8 }], 9: [{ f: 1205, s: C9 }],
  10: [{ f: 1350, s: C10a }, { f: 1440, dur: 26, s: C10b }], 11: [{ f: 1520, s: C11 }], 12: [{ f: 1689, s: C12 }], 13: [{ f: 1862, s: C13 }],
  14: [{ f: 2009, s: C14a }, { f: 2150, dur: 70, s: C14b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(115), 0.5], [T(445), 0.35], [T(658), 0.45], [T(981), 0.35], [T(1276), 0.5], [T(1325), 0.4], [T(1987), 0.4]];
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
  { f: 0, cInf: 7, focus: eyesAt(TRADERS[2]) }, { f: 195, cInf: 0 }, { f: 296, dur: 30, cInf: 9, focus: eyesAt(JS) },
  { f: 398, cInf: 11, focus: eyesAt(JS) }, { f: 472, cInf: 14, focus: () => [333.6, D0 + 2.3, 67.4] }, { f: 680, cInf: 6, focus: () => [369.6, D0 + 1.6, 64.0] },
  { f: 812, cInf: 9, focus: eyesAt(ANALYST) }, { f: 998, cInf: 5, focus: () => [436.0, D0 + 1.6, 114.5] }, { f: 1136, cInf: 10, focus: () => [436.0, D0 + 2.0, 119.6] },
  { f: 1205, cInf: 5, focus: () => [369.0, D0 + 1.6, 66.0] }, { f: 1350, cInf: 10, focus: eyesAt(BOARD[1]) }, { f: 1520, cInf: 6, focus: () => [333.5, D0 + 1.6, 65.6] },
  { f: 1694, cInf: 6, focus: () => [488.0, D0 + 1.5, 64.0] }, { f: 1862, cInf: 5, focus: eyesAt(TRADERS[2]) }, { f: 2015, cInf: 7, focus: () => [436.0, D0 + 1.8, 116.0] },
  { f: 2150, dur: 50, cInf: 0 },
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
