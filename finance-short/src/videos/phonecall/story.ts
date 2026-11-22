// "The $100 Million Phone Call": a FICTIONAL finance story (not a real event), in the cartoon 3D style. Every shot is
// one painted New York set (a backdrop card standing on the landing stage, props as cards) around one centre point;
// no shot holds longer than about 3 s. Shots are timed to the voice (phonecall-short/voice/words.json).
export const FPS = 30;
export const TOTAL = 1710;
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
export type SetName = "night" | "day" | "mansion" | "car" | "jet" | "money" | "phone" | "office" | "advisor" | "screens" | "bankers" | "empty" | "window" | "sunrise";
export type Frame = "CU" | "CU2" | "MCU" | "MED" | "LOW" | "WIDE" | "WIDE2" | "PHONE" | "SCREEN" | "SIT" | "AERIAL";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; frame: Frame; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 36, light: "golden", set: "night", frame: "CU" },
  { id: 2, a: 36, b: 72, light: "golden", set: "night", frame: "LOW" },
  { id: 3, a: 72, b: 110, light: "golden", set: "night", frame: "WIDE" },
  { id: 4, a: 110, b: 172, light: "golden", set: "night", frame: "CU2" },
  { id: 5, a: 172, b: 245, light: "day", set: "day", frame: "MED" },
  { id: 6, a: 245, b: 288, light: "day", set: "mansion", frame: "WIDE" },
  { id: 7, a: 288, b: 318, light: "day", set: "car", frame: "MED" },
  { id: 8, a: 318, b: 346, light: "day", set: "jet", frame: "WIDE2" },
  { id: 9, a: 346, b: 410, light: "day", set: "money", frame: "MCU" },
  { id: 10, a: 410, b: 460, light: "day", set: "phone", frame: "PHONE" },
  { id: 11, a: 460, b: 498, light: "day", set: "office", frame: "MED" },
  { id: 12, a: 498, b: 560, light: "day", set: "advisor", frame: "MCU" },
  { id: 13, a: 560, b: 625, light: "day", set: "office", frame: "MCU" },
  { id: 14, a: 625, b: 660, light: "day", set: "office", frame: "CU" },
  { id: 15, a: 660, b: 748, light: "day", set: "office", frame: "CU2" },
  { id: 16, a: 748, b: 800, light: "day", set: "screens", frame: "MED" },
  { id: 17, a: 800, b: 850, light: "day", set: "screens", frame: "SCREEN" },
  { id: 18, a: 850, b: 915, light: "day", set: "bankers", frame: "WIDE" },
  { id: 19, a: 915, b: 1000, light: "golden", set: "empty", frame: "SIT" },
  { id: 20, a: 1000, b: 1075, light: "golden", set: "empty", frame: "WIDE" },
  { id: 21, a: 1075, b: 1150, light: "golden", set: "window", frame: "MED" },
  { id: 22, a: 1150, b: 1230, light: "golden", set: "window", frame: "CU" },
  { id: 23, a: 1230, b: 1305, light: "golden", set: "window", frame: "LOW" },
  { id: 24, a: 1305, b: 1375, light: "golden", set: "sunrise", frame: "WIDE" },
  { id: 25, a: 1375, b: 1460, light: "golden", set: "sunrise", frame: "MCU" },
  { id: 26, a: 1460, b: 1545, light: "golden", set: "sunrise", frame: "CU" },
  { id: 27, a: 1545, b: 1630, light: "golden", set: "sunrise", frame: "WIDE2" },
  { id: 28, a: 1630, b: TOTAL, light: "golden", set: "sunrise", frame: "AERIAL" },
];
export const XFADE: Record<number, number> = { 5: 8, 19: 10, 24: 12 };
export const FLASHES: [number, number][] = [[0, 4], [172, 3], [708, 3]];

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
/** the centre of every set (where the businessman stands); the sitting shot centres on the crate */
export const BP: V3 = [12.6, D0, 25.0];
export const centreOf = (id: number): V3 => (SHOTS[id - 1].frame === "SIT" || (SHOTS[id - 1].set === "empty") ? [P1S[0], D0, P1S[2]] : BP);
export const backdropAt = (id: number): V3 => { const c = centreOf(id); return [c[0], D0 + 3.6, 26.3]; };

const H = (p: V3, d: V3) => add(p, d);
const FR: Record<Frame, (c: V3) => [V3, V3, number, number]> = {
  CU: (c) => [H(c, [0.05, 1.5, -1.9]), H(c, [0, 1.42, 0]), 38, 0.0],
  CU2: (c) => [H(c, [-0.2, 1.4, -1.8]), H(c, [0, 1.45, 0]), 38, -0.04],
  MCU: (c) => [H(c, [0.25, 1.4, -2.8]), H(c, [0, 1.3, 0]), 42, 0.02],
  MED: (c) => [H(c, [-0.35, 1.3, -4.2]), H(c, [-0.1, 1.1, 0]), 46, 0],
  LOW: (c) => [H(c, [0.35, 0.35, -2.9]), H(c, [0, 1.75, 0]), 48, 0.03],
  WIDE: (c) => [H(c, [0.4, 1.7, -6.4]), H(c, [0, 1.5, 0]), 50, 0],
  WIDE2: (c) => [H(c, [-0.8, 1.2, -6.0]), H(c, [-0.3, 1.3, 0]), 52, 0],
  PHONE: (c) => [H(c, [-0.55, 1.15, -1.25]), H(c, [-0.55, 0.95, 0]), 40, 0.03],
  SCREEN: (c) => [H(c, [0, 2.4, -3.0]), H(c, [0, 2.45, 1.2]), 44, 0],
  SIT: (c) => [H(c, [0.2, 1.2, -3.2]), H(c, [0.05, 0.85, 0]), 44, 0],
  AERIAL: (c) => [H(c, [0.5, 4.5, -9.0]), H(c, [0, 2.6, 0]), 52, 0],
};
const camFor = (id: number) => (f: number): Shot => {
  const s = SHOTS[id - 1], [pos, look, fov, roll] = FR[s.frame](centreOf(id));
  const fast = s.id === 1 || s.frame === "CU2";
  return dolly(pos, look, pushK(f, s.a, fast ? 0.004 : 0.0025, fast ? 0.012 : 0.006, 16), { fov, roll });
};
export const CAMS: Record<number, Key[]> = Object.fromEntries(SHOTS.map((s) => [s.id, [{ f: s.a, s: camFor(s.id) }]]));

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(4), 0.6], [T(98), 0.5], [T(428), 0.4], [T(708), 1.0], [T(764), 0.5], [T(1034), 0.4]];
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
export const DOF: Dof[] = SHOTS.map((s) => {
  const c = centreOf(s.id), wide = s.frame === "WIDE" || s.frame === "WIDE2" || s.frame === "AERIAL";
  const y = s.frame === "SIT" ? 1.2 : s.frame === "PHONE" ? 0.95 : s.frame === "SCREEN" ? 2.4 : 1.62;
  return { f: s.a, cInf: wide ? 4 : s.frame.startsWith("CU") ? 14 : 11, focus: () => [c[0] - (s.frame === "PHONE" ? 0.55 : 0), D0 + y, c[2] + (s.frame === "SCREEN" ? 1.3 : 0)] as V3 };
});
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing objects (built by world.ts): kit = a cartoon plant name; visible a <= f < b */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
