// "Voicemail From Tomorrow": an original horror short. Mara (a detailed 2D character card, toon.ts drawMara) in a 3D
// night world: a rainy street, a 1960s brick building with fire escapes, apartment 4B (kitchen, hallway, front door),
// the building corridor. Practical lights (phone, oven clock, street glow, corridor tube) are real point/spot lights.
// No captions. Shots are timed to horror-short/voice/words.json.
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
export const FZ = 52.0;                                                  // the building's street facade (faces -z)
export const BLD = { x0: 294, x1: 316, z0: FZ, z1: 70, floors: 6, fh: 3.3 };
export const FLOOR = D0 + 3 * 3.3;                                       // apartment 4B (fourth floor)
export const KIT = { x0: 302.0, x1: 306.2, z0: 52.25, z1: 55.25, h: 2.6 };
export const HALL = { x0: 302.0, x1: 303.2, z0: 55.25, z1: 59.25, h: 2.6 };
export const CORR = { x0: 297.0, x1: 309.0, z0: 59.4, z1: 61.2, h: 2.6 };
export const WIN = { x0: 303.4, x1: 304.8, y0: 0.95, y1: 2.45 };         // kitchen window (in the facade), y above FLOOR
export const DOOR = { x0: 302.15, x1: 303.05, z: 59.25, h: 2.05 };
export const OVEN = { x0: 302.0, x1: 302.62, z0: 53.9, z1: 54.5, clockY: 1.02 };
export const TABLE = { x: 304.9, z: 53.55, r: 0.45, y: 0.74 };
export const PHONE_T: V3 = [304.95, 0, 53.5];                            // the phone on the table (y = FLOOR + TABLE.y)
export const LAMPS: V3[] = [[292, D0, 49.6], [304, D0, 49.6], [316, D0, 49.6]];
export const STREET = { z0: 36, z1: 52 };
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const TOTAL = 1500;
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 108, light: "golden" },     // the rainy street, crane up to the lit window of 4B
  { id: 2, a: 108, b: 142, light: "day" },      // Mara at the table; the phone: from her own number
  { id: 3, a: 142, b: 206, light: "day" },      // "It's me. You're standing in the kitchen."
  { id: 4, a: 206, b: 262, light: "day" },      // "You haven't turned on the light." (the dark lamp)
  { id: 5, a: 262, b: 318, light: "day" },      // she played it again
  { id: 6, a: 318, b: 390, light: "day" },      // the timestamp: tomorrow
  { id: 7, a: 390, b: 470, light: "day" },      // "someone will knock": pan to the hallway door
  { id: 8, a: 470, b: 556, light: "day" },      // "Do not open the door."
  { id: 9, a: 556, b: 600, light: "day" },      // Mara laughed
  { id: 10, a: 600, b: 700, light: "day" },     // the oven clock: 3:16 -> 3:17
  { id: 11, a: 700, b: 722, light: "day" },     // silence
  { id: 12, a: 722, b: 800, light: "day" },     // three knocks; "Mara? It's me."
  { id: 13, a: 800, b: 872, light: "day" },     // she tiptoes to the door
  { id: 14, a: 872, b: 891, light: "day" },     // her eye at the peephole
  { id: 15, a: 891, b: 918, light: "day" },     // fisheye: the empty corridor
  { id: 16, a: 918, b: 995, light: "day" },     // under the door: two feet
  { id: 17, a: 995, b: 1056, light: "day" },    // she slides down the wall; the knocking stops
  { id: 18, a: 1056, b: 1130, light: "day" },   // the phone buzzes: one new voicemail
  { id: 19, a: 1130, b: 1222, light: "day" },   // "Why didn't you let me in?"
  { id: 20, a: 1222, b: 1318, light: "day" },   // "It's standing behind you." (dolly zoom)
  { id: 21, a: 1318, b: 1352, light: "day" },   // she turns
  { id: 22, a: 1352, b: 1455, light: "day" },   // the reflection smiles; the phone dies
  { id: 23, a: 1455, b: TOTAL, light: "day" },  // black
];
export const XFADE: Record<number, number> = {};
export const FLASHES: [number, number][] = [];
export const DARK = { a: -1, b: -1 };
export const BLACK = { a: 1452, b: TOTAL };                              // full black at the end
export const FISHEYE = { a: 891, b: 918 };
export const TITLES: { a: number; b: number; text: string }[] = [];
export const KNOCKS = [720, 735, 750, 994, 1006];
export const PHONE_OFF = 1440;
export const CORR_OFF = 1040;
export const STREET_OFF = 1290;                                          // the street lamp under the window dies
/** the phone screen state */
export const phoneUI = (f: number) => (f < 59 ? "off" : f < 300 ? "lock" : f < 560 ? "player" : f < 1062 ? "off" : f < 1440 ? "lock2" : "off");
/** corridor tube flicker 0..1 */
export const flickerAt = (f: number) => {
  if (f >= CORR_OFF) return 0;
  const k = Math.floor(f / 3), h = Math.sin(k * 91.7) * 43758.5; const r = h - Math.floor(h);
  return r < 0.06 ? 0.35 : r < 0.1 ? 0.7 : 1;
};
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

const F = FLOOR;
const C1 = (f: number) => { const u = glide(f / 104); return { pos: [300 + 4.1 * u, D0 + 1.2 + (F + 1.75 - D0 - 1.2) * u, 36 + 14.4 * u] as V3, look: [304 + 0.1 * u, D0 + 8 + (F + 1.45 - D0 - 8) * u, 52 + 1.6 * u] as V3, fov: 50 - 8 * u }; };
const C2a = (f: number) => dolly([305.25, F + 1.6, 55.3], [304.45, F + 1.15, 53.75], pushK(f, 108, 0.002), { fov: 46 });
const C2b = (f: number) => dolly([305.25, F + 1.12, 53.95], [304.95, F + 0.76, 53.5], pushK(f, 126, 0.004), { fov: 34 });
const C3 = (f: number) => dolly([304.35, F + 1.5, 55.25], [304.0, F + 1.38, 53.95], pushK(f, 142, 0.0025), { fov: 44 });
const C4 = (f: number) => { const u = glide((f - 238) / 18); return { pos: [304.6, F + 1.0, 55.1] as V3, look: [304.9 - 0.9 * u, F + 2.0 - 0.55 * u, 53.55 + 0.4 * u] as V3, fov: 46 }; };
const C5 = (f: number) => dolly([304.45, F + 1.95, 55.2], [304.0, F + 1.15, 53.95], pushK(f, 262, 0.002), { fov: 44 });
const C6 = (f: number) => dolly([305.12, F + 1.06, 53.75], [304.95, F + 0.76, 53.5], pushK(f, 318, 0.006), { fov: 30 });
const C7 = (f: number) => { const u = glide((f - 445) / 22); return { pos: [303.3, F + 1.35, 52.7] as V3, look: [304.0 - 1.4 * u, F + 1.4 - 0.4 * u, 54.0 + 5.2 * u] as V3, fov: 48, roll: 0 }; };
const C8 = (f: number) => { const u = glide((f - 470) / 86); return { pos: [303.0 - 0.3 * u, F + 1.5 - 0.1 * u, 54.3 + 1.2 * u] as V3, look: [302.6, F + 1.1, 59.2] as V3, fov: 46, roll: 0.06 * smooth((f - 505) / 30) }; };
const C9 = (f: number) => dolly([304.45, F + 1.5, 55.3], [304.2, F + 1.35, 54.0], pushK(f, 556, 0.002), { fov: 44 });
const C10 = (f: number) => dolly([303.3, F + 0.97, 54.24], [302.62, F + OVEN.clockY, 54.2], pushK(f, 600, 0.0025), { fov: 30 });
const C11 = (f: number) => dolly([305.95, F + 2.45, 55.15], [304.0, F + 0.8, 53.7], pushK(f, 700, 0.003), { fov: 54 });
const C12 = (f: number) => { const u = glide((f - 760) / 40); return { pos: [303.2 - 0.3 * u, F + 0.95 + 0.4 * u, 54.3 + 0.5 * u] as V3, look: [302.6, F + 1.05, 59.2] as V3, fov: 50 - 6 * u }; };
const C13 = (f: number) => { const z = 55.6 + 3.0 * smooth((f - 800) / 62); return { pos: [302.75, F + 1.35, z - 1.4] as V3, look: [302.6, F + 1.2, z + 2.0] as V3, fov: 50 }; };
const C14 = (f: number) => dolly([302.6, F + 1.56, 59.2], [302.62, F + 1.5, 58.5], pushK(f, 872, 0.004), { fov: 34 });
const C15 = (f: number) => ({ pos: [302.6, F + 1.55, 59.38] as V3, look: [302.6 + 0.02 * Math.sin(f * 0.3), F + 1.25, 61.2] as V3, fov: 150 });
const C16 = (f: number) => { const u = glide((f - 918) / 40); return { pos: [302.62, F + 1.5 - 0.4 * u, 58.0 + 0.15 * u] as V3, look: [302.6, F + 0.5 - 0.5 * u, 58.98] as V3, fov: 40 }; };
const C17 = (f: number) => dolly([302.72, F + 1.3, 58.9], [302.5, F + 0.85, 56.5], pushK(f, 995, 0.0015), { fov: 50 });
const C18 = (f: number) => dolly([304.45, F + 1.05, 54.35], [304.95, F + 0.76, 53.5], pushK(f, 1056, 0.004), { fov: 34 });
const C19 = (f: number) => { const u = glide((f - 1130) / 92); return { pos: [305.2 - 0.9 * u, F + 1.5, 55.25 + 0.1 * u] as V3, look: [304.2, F + 1.38, 54.0] as V3, fov: 44 }; };
const C20 = (f: number) => { const u = glide((f - 1270) / 40); return { pos: [304.25, F + 1.5, 55.35 - 0.6 * u] as V3, look: [304.2, F + 1.42, 54.0] as V3, fov: 40 + 30 * u }; };
const C21 = (f: number) => dolly([304.3, F + 1.5, 55.1], [304.1, F + 1.42, 53.6], pushK(f, 1318, 0.003), { fov: 44 });
const C22 = (f: number) => { const u = glide((f - 1352) / 90); return { pos: [304.95, F + 1.62, 55.15 - 0.5 * u] as V3, look: [304.05, F + 1.5, 51.3] as V3, fov: 36 - 6 * u }; };
const C23 = (_f: number) => ({ pos: [304.95, F + 1.62, 54.65] as V3, look: [304.05, F + 1.5, 51.3] as V3, fov: 30 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1 }], 2: [{ f: 108, s: C2a }, { f: 126, cut: true, s: C2b }], 3: [{ f: 142, s: C3 }], 4: [{ f: 206, s: C4 }], 5: [{ f: 262, s: C5 }],
  6: [{ f: 318, s: C6 }], 7: [{ f: 390, s: C7 }], 8: [{ f: 470, s: C8 }], 9: [{ f: 556, s: C9 }], 10: [{ f: 600, s: C10 }], 11: [{ f: 700, s: C11 }],
  12: [{ f: 722, s: C12 }], 13: [{ f: 800, s: C13 }], 14: [{ f: 872, s: C14 }], 15: [{ f: 891, s: C15 }], 16: [{ f: 918, s: C16 }], 17: [{ f: 995, s: C17 }],
  18: [{ f: 1056, s: C18 }], 19: [{ f: 1130, s: C19 }], 20: [{ f: 1222, s: C20 }], 21: [{ f: 1318, s: C21 }], 22: [{ f: 1352, s: C22 }], 23: [{ f: 1455, s: C23 }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(720), 0.35], [T(735), 0.35], [T(750), 0.45], [T(994), 0.25], [T(1006), 0.25]];
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
const MF = (x: number, z: number, h = 1.5): (() => V3) => () => [x, F + h, z];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, { f: 108, cInf: 8, focus: MF(304.6, 53.7, 1.1) }, { f: 126, cInf: 16, focus: MF(304.95, 53.5, 0.77) }, { f: 142, cInf: 14, focus: MF(304.0, 53.95) },
  { f: 206, cInf: 10, focus: MF(304.2, 53.8, 1.7) }, { f: 262, cInf: 12, focus: MF(304.0, 54.0, 1.2) }, { f: 318, cInf: 18, focus: MF(304.95, 53.5, 0.77) },
  { f: 390, cInf: 6, focus: MF(304.3, 54.2, 1.4) }, { f: 470, cInf: 6, focus: MF(302.6, 59.2, 1.1) }, { f: 556, cInf: 14, focus: MF(304.2, 54.0) },
  { f: 600, cInf: 18, focus: MF(302.62, 54.2, OVEN.clockY) }, { f: 700, cInf: 6, focus: MF(304.0, 53.8, 1.0) }, { f: 722, cInf: 6, focus: MF(302.6, 59.2, 1.1) },
  { f: 800, cInf: 6, focus: () => [302.6, F + 1.3, 55.6 + 3.0 * smooth(0.5)] }, { f: 872, cInf: 22, focus: MF(302.6, 58.95, 1.55) }, { f: 891, cInf: 0 },
  { f: 918, cInf: 10, focus: MF(302.6, 59.1, 0.05) }, { f: 995, cInf: 8, focus: MF(302.5, 56.6, 0.8) }, { f: 1056, cInf: 12, focus: MF(304.9, 53.5, 0.8) },
  { f: 1130, cInf: 14, focus: MF(304.2, 54.0) }, { f: 1222, cInf: 14, focus: MF(304.2, 54.0) }, { f: 1318, cInf: 12, focus: MF(304.1, 53.6) },
  { f: 1352, cInf: 10, focus: MF(304.1, 53.2) }, { f: 1395, dur: 20, cInf: 10, focus: MF(304.1, 51.3) },
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
