// "One Golden Egg Explains Inflation": episode 4 of the money-parable series. The same three men on the same landing
// stage: the mayor finds a goose that lays golden eggs and hands them out; the river has the same fish, so a basket goes
// from one egg to three. The saver's jar shrinks, the borrower's debt shrinks, the owner of boats and nets keeps up.
// Shots are timed to the voice (egg-short/voice/words.json, frame = word onset x 30).
export const FPS = 30;
export const TOTAL = 1425;
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
  { id: 1, a: 0, b: 158, light: "day" },          // if you hid a hundred dollars in 2000, today it buys only half as much
  { id: 2, a: 158, b: 232, light: "day" },        // nobody stole it; so where did the other half go?
  { id: 3, a: 232, b: 283, light: "day" },        // one golden egg explains it
  { id: 4, a: 283, b: 378, light: "day" },        // in the river town one basket of fish costs one golden egg
  { id: 5, a: 378, b: 508, light: "day" },        // the mayor finds a goose that lays golden eggs, hands them out
  { id: 6, a: 508, b: 605, light: "day" },        // everyone feels rich; the river still has the same fish
  { id: 7, a: 605, b: 675, light: "day" },        // a basket costs two eggs; then three
  { id: 8, a: 675, b: 805, light: "day" },        // the second man's hundred eggs in a jar buy a third of the fish
  { id: 9, a: 805, b: 938, light: "day" },        // the first man owes fifty eggs; pays it back with a few baskets
  { id: 10, a: 938, b: 1090, light: "day" },      // the third man kept no eggs; boats and nets; his fish cost three eggs
  { id: 11, a: 1090, b: 1178, light: "golden" },  // the eggs didn't get stolen; there were just more of them
  { id: 12, a: 1178, b: 1322, light: "golden" },  // that's inflation: +3.7 % in twelve months
  { id: 13, a: 1322, b: TOTAL, light: "golden" }, // jar, or boat?
];
export const XFADE: Record<number, number> = { 11: 12 };
export const FLASHES: [number, number][] = [[234, 4], [1097, 3]];

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
// staging points for this episode
export const BOARD: V3 = [15.0, D0, 26.5];                 // the market price board on its post (card base)
export const J1: V3 = [10.0, D0, 25.0], LEND: V3 = [9.05, D0, 25.15];
export const MAYOR: V3 = [12.2, D0, 25.2], GOOSE: V3 = [13.05, D0, 25.35];
export const JAR: V3 = [14.0, D0, 25.1];                   // the second man's jar of eggs, beside him
export const BOAT: V3 = [18.1, WATER_Y, 22.3];             // the third man's boats moored under the stage (card base on the water)
export const BOAT2: V3 = [20.6, WATER_Y, 22.6];
export const EDGE3: V3 = [17.3, D0, 23.95], EDGE2: V3 = [15.2, D0, 23.95], JAR2: V3 = [14.55, D0, 23.9];
export const BUYER: V3 = [15.6, D0, 25.15];
export const CROWD: V3[] = [[10.4, D0, 25.9], [11.2, D0, 26.2], [13.9, D0, 26.2], [14.7, D0, 25.9]];
export const DECK: V3[] = [[11.7, D0, 24.4], [12.4, D0, 24.55], [13.1, D0, 24.4]]; // the day's few baskets of fish

const H = (p: V3, d: V3) => add(p, d);
const S1a = (f: number) => dolly(H(P2, [0.0, 1.3, -3.4]), H(P2, [0.0, 1.15, 0]), pushK(f, 0, 0.002, 0.004, 20), { fov: 42 });
const S2a = (f: number) => dolly(H(P2, [-0.6, 1.2, -2.9]), H(P2, [0.0, 1.2, 0]), pushK(f, 158, 0.003), { fov: 42, roll: -0.03 });
const S3a = (f: number) => dolly(H(P3, [-0.85, 1.45, -3.1]), H(P3, [-0.3, 1.55, 0]), pushK(f, 232, 0.003), { fov: 42, roll: 0.03 });
const S4a = (f: number) => dolly([4, D0 + 15, 2], [12.5, D0 + 0.6, 25.6], pushK(f, 283, 0.0016), { fov: 46 });
const S4b = (f: number) => dolly([10.6, D0 + 1.5, 21.0], [10.6, D0 + 1.15, 25.4], pushK(f, 318, 0.002), { fov: 46 });
const S5a = (f: number) => dolly([12.85, D0 + 1.4, 21.2], [12.75, D0 + 1.0, 25.3], pushK(f, 378, 0.0018), { fov: 47 });
const S5b = (f: number) => dolly([12.6, D0 + 2.4, 19.6], [12.6, D0 + 1.0, 25.6], pushK(f, 462, 0.0015), { fov: 52 });
const S6a = (f: number) => dolly([12.6, D0 + 1.6, 20.4], [12.6, D0 + 1.1, 25.8], pushK(f, 508, 0.0018), { fov: 52 });
const S6b = (f: number) => dolly([12.4, D0 + 0.7, 21.6], [12.4, D0 + 0.25, 24.5], pushK(f, 552, 0.002), { fov: 44, roll: 0.02 });
const S7a = (f: number) => dolly(H(BOARD, [0.0, 1.3, -5.2]), H(BOARD, [0, 1.25, 0]), pushK(f, 605, 0.0022, 0.006, 20), { fov: 40 });
const S8a = (f: number) => dolly([13.2, D0 + 1.45, 20.6], [13.2, D0 + 0.95, 25.1], pushK(f, 675, 0.002), { fov: 50 });
const S9a = (f: number) => dolly([9.55, D0 + 1.4, 20.9], [9.5, D0 + 1.05, 25.1], pushK(f, 805, 0.0018), { fov: 44 });
const S10a = (f: number) => dolly([18.6, 4.1, 14.8], [18.0, 3.7, 23.0], pushK(f, 938, 0.0016, 0.004, 20), { fov: 63 });
const S10b = (f: number) => dolly([16.1, D0 + 1.35, 21.2], [16.1, D0 + 1.05, 25.1], pushK(f, 1030, 0.002), { fov: 46 });
const S11a = (f: number) => dolly([12.5, D0 + 3.0, 19.0], [12.6, D0 + 0.6, 25.4], pushK(f, 1090, 0.001), { fov: 50 });
const S11b = (f: number) => dolly([8, D0 + 13, 6], [12.8, D0 + 0.6, 25.6], 1, { fov: 48 });
const S12a = (f: number) => dolly(H(BOARD, [0.2, 1.35, -5.6]), H(BOARD, [0, 1.3, 0]), pushK(f, 1178, 0.0018, 0.004, 20), { fov: 40 });
const S13a = (f: number) => dolly([16.7, 4.4, 13.2], [16.6, 4.3, 23.0], pushK(f, 1322, 0.0016), { fov: 62 });
const S13b = (f: number) => dolly([16.7, 9.5, 8.5], [16.6, 4.6, 23.0], 1, { fov: 62 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 158, s: S2a }],
  3: [{ f: 232, s: S3a }],
  4: [{ f: 283, s: S4a }, { f: 316, dur: 30, s: S4b }],
  5: [{ f: 378, s: S5a }, { f: 460, dur: 30, s: S5b }],
  6: [{ f: 508, s: S6a }, { f: 552, cut: true, s: S6b }],
  7: [{ f: 605, s: S7a }],
  8: [{ f: 675, s: S8a }],
  9: [{ f: 805, s: S9a }],
  10: [{ f: 938, s: S10a }, { f: 1030, cut: true, s: S10b }],
  11: [{ f: 1090, s: S11a }, { f: 1118, dur: 56, s: S11b }],
  12: [{ f: 1178, s: S12a }],
  13: [{ f: 1322, s: S13a }, { f: 1400, dur: 30, s: S13b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(129), 0.6], [T(634), 0.5], [T(656), 0.7], [T(1100), 0.8], [T(1278), 0.5]];
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
const boardAt = (): V3 => [BOARD[0], D0 + 1.3, BOARD[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 13, focus: eyesAt(P2, 1.3) },
  { f: 158, cInf: 13, focus: eyesAt(P2, 1.35) },
  { f: 232, cInf: 15, focus: eyesAt(P3) },
  { f: 283, cInf: 0 },
  { f: 318, dur: 30, cInf: 7, focus: () => [10.6, D0 + 1.4, 25.4] },
  { f: 378, cInf: 9, focus: () => [12.6, D0 + 1.3, 25.3] },
  { f: 462, dur: 30, cInf: 5, focus: () => [12.6, D0 + 1.3, 25.6] },
  { f: 508, cInf: 6, focus: () => [12.6, D0 + 1.3, 25.8] },
  { f: 552, cInf: 10, focus: () => [12.4, D0 + 0.25, 24.5] },
  { f: 605, cInf: 12, focus: boardAt },
  { f: 675, cInf: 9, focus: () => [13.6, D0 + 1.2, 25.1] },
  { f: 805, cInf: 9, focus: () => [9.5, D0 + 1.4, 25.1] },
  { f: 938, cInf: 5, focus: () => [17.8, 3.6, 23.0] },
  { f: 1030, cInf: 9, focus: () => [16.1, D0 + 1.3, 25.1] },
  { f: 1090, cInf: 4, focus: () => [12.6, D0 + 0.8, 25.4] },
  { f: 1118, dur: 40, cInf: 0 },
  { f: 1178, cInf: 12, focus: boardAt },
  { f: 1322, cInf: 4, focus: () => [16.4, 4.4, 23.2] },
  { f: 1400, dur: 30, cInf: 0 },
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
