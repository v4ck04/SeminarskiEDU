// "The Bats That Bombed America": Project X-Ray, 1942-44. Sets on the far-bank meadow, away from the town: Carlsbad
// Caverns, the President's office, the lab with its fridge, the desert test base (hangar, fuel tank, flagpole,
// crates) and a street of wooden houses. Shots are timed to batbomb-short/voice/words.json.
export const FPS = 30;
export const TOTAL = 1900;
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
export const CAVE: Room = { x0: 280, x1: 300, z0: 56, z1: 72, h: 7 };
export const DENT: V3 = [290, D0, 64.6];
export const OFFICE: Room = { x0: 320, x1: 336, z0: 56, z1: 68, h: 4.2 };
export const DESK = { x0: 326.5, x1: 329.5, z0: 63.4, z1: 64.4, y: D0 + 0.76 };
export const FDR: V3 = [328, D0, 65.0];
export const LAB: Room = { x0: 360, x1: 376, z0: 56, z1: 68, h: 4 };
export const BENCH = { x0: 362, x1: 370, z0: 64, z1: 64.8, y: D0 + 0.9 };
export const CHEM: V3 = [365.6, D0, 65.4];
export const OFFICER_LAB: V3 = [366.95, D0, 63.4];
export const FRIDGE = { x0: 372.4, x1: 374.2, z0: 66.0, z1: 67.6, h: 1.9 };
export const BASE = { x0: 395, x1: 540, z0: 80, z1: 210 };
export const HANGAR = { x0: 430, x1: 452, z0: 150, z1: 168, h: 7 };
export const TANK: V3 = [466, D0, 140]; export const TANK_R = 2.4, TANK_LEG = 2.2, TANK_H = 3.6;
export const POLE: V3 = [458, D0, 127]; export const POLE_H = 9;
export const CRATES: V3[] = [[451.6, D0, 130.2], [452.6, D0, 130.6], [452.1, D0, 131.5]];
export const OFFICER_BASE: V3 = [446.0, D0, 141.0];
export const STREET = { x0: 580, x1: 620, z0: 60, z1: 96 };
export const HOUSES: { x: number; z: number; side: number }[] = [
  ...[64, 71, 78, 85, 92].map((z) => ({ x: 595, z, side: 1 })), ...[64, 71, 78, 85, 92].map((z) => ({ x: 605, z, side: -1 })),
];
export const EAVE_Y = D0 + 3.1;
export const WATER_Y = 0.04;
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 160, light: "golden" },     // in 1943 the US Army set fire to its own air base. with bats.
  { id: 2, a: 160, b: 358, light: "day" },      // a dentist; Carlsbad Caverns
  { id: 3, a: 358, b: 540, light: "day" },      // his idea: a firebomb on every bat, hide under the roofs
  { id: 4, a: 540, b: 698, light: "day" },      // the White House; "this man is not a nut"
  { id: 5, a: 698, b: 860, light: "day" },      // the military said yes; napalm's inventor designed the bombs
  { id: 6, a: 860, b: 970, light: "day" },      // cooled in fridges until they fell asleep
  { id: 7, a: 970, b: 1100, light: "golden" },  // a test in May 1943: a few armed bats escaped
  { id: 8, a: 1100, b: 1220, light: "golden" }, // under a fuel tank; the base went up in flames
  { id: 9, a: 1220, b: 1348, light: "golden" }, // luckily ... unluckily, they worked on America
  { id: 10, a: 1348, b: 1572, light: "day" },   // a normal bomb lands wherever it falls; a bat hides under your roof
  { id: 11, a: 1572, b: 1740, light: "day" },   // the Navy took over ... cancelled in 1944
  { id: 12, a: 1740, b: TOTAL, light: "golden" },// never reached Japan; their only victory
];
export const XFADE: Record<number, number> = { 3: 10, 10: 10, 12: 14 };
export const FLASHES: [number, number][] = [[160, 4], [975, 3], [1193, 3]];
export const DARK = { a: -1, b: -1 };
export const FIRE_HOOK = 79, FIRE_TANK = 1193;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fridgeDoor = (id: number, f: number) => (id === 6 ? 1.7 : id === 5 ? 0 : 0);
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

const C1a = (f: number) => dolly([444.0, D0 + 3.4, 108.0], [448.0, D0 + 4.0, 150.0], pushK(f, 0, 0.0016, 0.006, 20), { fov: 54 });
const C1b = (f: number) => dolly([450.6, D0 + 3.1, 131.6], [452.0, D0 + 3.4, 140.0], pushK(f, 128, 0.003), { fov: 44 });
const C2 = (f: number) => dolly([290.3, D0 + 1.5, 58.8], [290.0, D0 + 2.9, 66.0], pushK(f, 160, 0.0014, 0.005, 18), { fov: 54 });
const C3 = (f: number) => dolly([599.6, D0 + 1.9, 61.0], [600.4, D0 + 2.7, 80.0], pushK(f, 358, 0.0014), { fov: 52 });
const C4 = (f: number) => dolly([328.2, D0 + 1.6, 59.8], [328.0, D0 + 1.45, 65.0], pushK(f, 540, 0.0016, 0.005, 16), { fov: 50 });
const C5 = (f: number) => dolly([366.4, D0 + 1.6, 59.4], [366.3, D0 + 1.45, 64.8], pushK(f, 698, 0.0016), { fov: 52 });
const C6 = (f: number) => dolly([373.1, D0 + 1.3, 62.6], [373.3, D0 + 1.05, 66.8], pushK(f, 860, 0.0022, 0.006, 16), { fov: 48 });
const C7 = (f: number) => dolly([451.2, D0 + 1.7, 125.0], [452.2, D0 + 1.7, 131.0], pushK(f, 970, 0.0016, 0.006, 16), { fov: 52 });
const C8 = (f: number) => dolly([461.0, D0 + 2.6, 129.0], [466.0, D0 + 3.2, 140.0], pushK(f, 1100, 0.0016, 0.006, 16), { fov: 54 });
const C9 = (f: number) => dolly([446.4, D0 + 1.7, 135.2], [446.0, D0 + 2.4, 143.0], pushK(f, 1220, 0.0016), { fov: 52 });
const C10 = (f: number) => dolly([599.4, D0 + 2.2, 64.0], [600.0, D0 + 2.8, 80.0], pushK(f, 1348, 0.0014), { fov: 52 });
const C11 = (f: number) => dolly([451.6, D0 + 1.8, 122.4], [452.4, D0 + 1.6, 131.0], pushK(f, 1572, 0.0014, 0.006, 16), { fov: 52 });
const C12a = (f: number) => dolly([456.2, D0 + 5.5, 121.5], [458.0, D0 + 8.2, 127.0], pushK(f, 1740, 0.0016), { fov: 48 });
const C12b = (f: number) => dolly([452.0, D0 + 12.0, 104.0], [450.0, D0 + 4.0, 145.0], pushK(f, 1820, 0.0008), { fov: 54 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1a }, { f: 128, cut: true, s: C1b }], 2: [{ f: 160, s: C2 }], 3: [{ f: 353, s: C3 }], 4: [{ f: 540, s: C4 }],
  5: [{ f: 698, s: C5 }], 6: [{ f: 860, s: C6 }], 7: [{ f: 970, s: C7 }], 8: [{ f: 1100, s: C8 }], 9: [{ f: 1220, s: C9 }],
  10: [{ f: 1343, s: C10 }], 11: [{ f: 1572, s: C11 }], 12: [{ f: 1733, s: C12a }, { f: 1820, dur: 70, s: C12b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(79), 0.5], [T(1077), 0.35], [T(1193), 0.7], [T(1424), 0.35], [T(1666), 0.45]];
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
  { f: 0, cInf: 0 }, { f: 128, cInf: 15, focus: () => [452.0, D0 + 3.3, 135.4] }, { f: 160, cInf: 8, focus: eyesAt(DENT) },
  { f: 358, cInf: 4, focus: () => [601.0, D0 + 2.5, 76.0] }, { f: 540, cInf: 10, focus: eyesAt(FDR) }, { f: 698, cInf: 9, focus: eyesAt(CHEM) },
  { f: 860, cInf: 12, focus: () => [373.3, D0 + 1.0, 66.0] }, { f: 970, cInf: 9, focus: () => [452.1, D0 + 1.2, 130.6] }, { f: 1100, cInf: 4, focus: () => [466.0, D0 + 2.6, 140.0] },
  { f: 1220, cInf: 9, focus: eyesAt(OFFICER_BASE) }, { f: 1348, cInf: 4, focus: () => [603.5, D0 + 2.8, 80.0] }, { f: 1572, cInf: 8, focus: () => [452.3, D0 + 1.4, 130.5] },
  { f: 1740, cInf: 8, focus: () => [458.0, D0 + 8.6, 127.0] }, { f: 1820, dur: 50, cInf: 0 },
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
