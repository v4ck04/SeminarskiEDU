// "One Basket Explains It": episode 2 of the money-parable series. The same three men on the same landing stage as the
// net episode (the London river world). Debt cuts holes in the first man's basket; the second saves in a barrel; the
// third saves, then lends, and holds his basket under the holes. Shots are timed to the voice
// (basket-short/voice/words.json, frame = word onset x 30). Camera grammar as in the other shorts.
export const FPS = 30;
export const TOTAL = 1450;
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
  { id: 1, a: 0, b: 97, light: "day" },          // why do some people earn more every year, and still have nothing?
  { id: 2, a: 97, b: 141, light: "day" },        // one basket explains it
  { id: 3, a: 141, b: 285, light: "day" },       // three men, the same river, one full basket each
  { id: 4, a: 285, b: 394, light: "day" },       // the first wants a new boat. not next year. now. so he borrows.
  { id: 5, a: 394, b: 468, light: "day" },       // every loan cuts a little hole in his basket
  { id: 6, a: 468, b: 561, light: "day" },       // leaves the river with a full basket, gets home with half
  { id: 7, a: 561, b: 669, light: "golden" },    // fishes longer; borrows again; more holes
  { id: 8, a: 669, b: 733, light: "golden" },    // the holes don't care how hard he works
  { id: 9, a: 733, b: 891, light: "day" },       // the second borrows nothing; one fish a night into a barrel
  { id: 10, a: 891, b: 1026, light: "day" },     // the third saves too; barrel full; walks over to the first
  { id: 11, a: 1026, b: 1059, light: "day" },    // "need another loan?"
  { id: 12, a: 1059, b: 1157, light: "day" },    // every fish that falls through those holes lands in his basket
  { id: 13, a: 1157, b: 1232, light: "day" },    // a basket under every hole in town
  { id: 14, a: 1232, b: 1327, light: "golden" }, // one paid the interest / avoided it / collected it
  { id: 15, a: 1327, b: TOTAL, light: "golden" },// if your basket has holes, someone is holding the basket underneath
];
export const XFADE: Record<number, number> = { 7: 10, 9: 8, 14: 12 };
export const FLASHES: [number, number][] = [[97, 4], [1059, 3]];

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
export const EDGE1: V3 = [10.0, D0, 23.75];                 // the first man at the edge, looking at the boat below
export const BOAT: V3 = [10.9, WATER_Y, 22.3];              // the new boat moored under the stage (card base on the water)
export const INBOAT: V3 = [10.75, WATER_Y + 0.22, 22.45];   // standing in it
export const B7: V3 = [10.85, D0, 24.75];                   // his basket on the deck while he fishes on (golden)
export const BAR2: V3 = [14.15, D0, 25.1], BAR3: V3 = [17.55, D0, 25.1], BAR3B: V3 = [18.2, D0, 25.3];
export const J1: V3 = [10.0, D0, 25.0], J3: V3 = [10.95, D0, 25.15];
/** the walk home along the stage (shot 6): x of the walker */
export const walkX = (f: number) => 7.8 + 3.4 * smooth((f - 472) / 64);
export const WALKZ = 24.9;
/** the town row (shot 13): five people with holed baskets, the third man and his barrels at the end */
export const ROW: V3[] = [[8.0, D0, 25.0], [9.45, D0, 25.2], [10.9, D0, 25.0], [12.35, D0, 25.2], [13.8, D0, 25.0]];
export const ROW3: V3 = [15.4, D0, 25.3];

const H = (p: V3, d: V3) => add(p, d);
const S1a = (f: number) => dolly(H(P1, [0.6, 1.3, -3.9]), H(P1, [0.25, 1.1, 0]), pushK(f, 0, 0.0024, 0.007, 22), { fov: 44 });
const S2a = (f: number) => dolly(H(P3, [-0.85, 1.45, -3.1]), H(P3, [-0.3, 1.55, 0]), pushK(f, 97, 0.003), { fov: 42, roll: 0.03 });
const S3a = (f: number) => dolly([4, D0 + 15, 2], [13.4, D0 + 0.4, 25.6], pushK(f, 141, 0.0016), { fov: 46 });
const S3b = (f: number) => dolly([4.5, D0 + 2.6, 21.5], [13.2, D0 + 0.8, 25.4], pushK(f, 190, 0.0018), { fov: 52 });
const S4a = (f: number) => dolly([12.0, 4.1, 14.8], [10.5, 3.6, 23.0], pushK(f, 285, 0.0018, 0.006, 20), { fov: 63 });
const S4b = (f: number) => dolly([10.6, 1.3, 18.5], [10.7, 1.0, 22.4], pushK(f, 362, 0.003), { fov: 46, roll: 0.035 });
const S5a = (f: number) => dolly(H(P1, [-0.05, 1.05, -2.2]), H(P1, [-0.17, 0.85, 0]), pushK(f, 394, 0.003, 0.008, 20), { fov: 44 });
const S6a = (f: number): Shot => { const x = walkX(f); return { pos: [x + 0.45, D0 + 1.35, 20.9], look: [x + 0.25, D0 + 0.95, WALKZ], fov: 46 }; };
const S7a = (f: number) => dolly(H(P1, [0.5, 1.3, -3.7]), H(P1, [0.45, 1.0, 0]), pushK(f, 556, 0.0022), { fov: 46 });
const S8a = (f: number) => dolly(H(P1, [-0.05, 1.2, -2.7]), H(P1, [-0.12, 0.95, 0]), pushK(f, 669, 0.003), { fov: 44, roll: 0.02 });
const S9a = (f: number) => dolly(H(P2, [0.2, 1.3, -4.3]), H(P2, [0.38, 1.0, 0.2]), pushK(f, 729, 0.002, 0.006, 20), { fov: 46 });
const S10a = (f: number) => dolly(H(P3, [0.25, 1.3, -4.0]), H(P3, [0.45, 1.05, 0.2]), pushK(f, 891, 0.0022), { fov: 46 });
const S10b = (f: number) => dolly([10.75, D0 + 1.45, 19.4], [10.75, D0 + 1.05, 25.1], pushK(f, 980, 0.002), { fov: 46 });
const S11a = (f: number) => dolly(H(J3, [-0.4, 1.45, -3.0]), H(J3, [-0.38, 1.5, 0]), pushK(f, 1026, 0.004, 0.009, 16), { fov: 42, roll: 0.03 });
const S12a = (f: number) => dolly([10.18, D0 + 1.1, 20.5], [10.15, D0 + 0.85, 25.1], pushK(f, 1059, 0.0022), { fov: 44 });
const S13a = (f: number) => dolly([5.2, D0 + 2.3, 19.6], [12.9, D0 + 0.8, 25.1], pushK(f, 1157, 0.0018), { fov: 50 });
const S14a = (f: number) => dolly(H(P1, [-0.1, 1.2, -3.0]), H(P1, [-0.15, 0.95, -0.2]), pushK(f, 1232, 0.003), { fov: 42 });
const S14b = (f: number) => dolly(H(P2, [-0.3, 1.25, -3.4]), H(P2, [0.45, 1.0, 0.2]), pushK(f, 1266, 0.003), { fov: 42 });
const S14c = (f: number) => dolly(H(P3S, [0.3, 1.3, -3.9]), H(P3S, [0.3, 0.75, 0]), pushK(f, 1292, 0.0022), { fov: 50 });
const S15a = (f: number) => dolly([9.9, D0 + 1.0, 22.9], [9.74, D0 + 0.62, 25.0], pushK(f, 1327, 0.0025), { fov: 40 });
const S15b = (f: number) => dolly([10.05, D0 + 0.55, 22.95], [9.9, D0 + 0.35, 25.0], pushK(f, 1373, 0.002), { fov: 48 });
const S15c = (f: number) => dolly([8.6, D0 + 5.2, 14.8], [11.0, D0 + 0.8, 25.2], pushK(f, 1405, 0.0015), { fov: 48 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 97, s: S2a }],
  3: [{ f: 141, s: S3a }, { f: 188, dur: 34, s: S3b }],
  4: [{ f: 285, s: S4a }, { f: 362, cut: true, s: S4b }],
  5: [{ f: 394, s: S5a }],
  6: [{ f: 468, s: S6a }],
  7: [{ f: 556, s: S7a }],
  8: [{ f: 669, s: S8a }],
  9: [{ f: 729, s: S9a }],
  10: [{ f: 891, s: S10a }, { f: 980, cut: true, s: S10b }],
  11: [{ f: 1026, s: S11a }],
  12: [{ f: 1059, s: S12a }],
  13: [{ f: 1157, s: S13a }],
  14: [{ f: 1226, s: S14a }, { f: 1266, cut: true, s: S14b }, { f: 1292, cut: true, s: S14c }],
  15: [{ f: 1327, s: S15a }, { f: 1373, dur: 28, s: S15b }, { f: 1405, dur: 44, s: S15c }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(77), 0.4], [T(356), 0.5], [T(433), 0.7], [T(644), 0.5], [T(1059), 0.6]];
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
  { f: 0, cInf: 13, focus: eyesAt(P1, 1.2) },
  { f: 97, cInf: 15, focus: eyesAt(P3) },
  { f: 141, cInf: 0 },
  { f: 190, dur: 30, cInf: 6, focus: eyesAt(P2) },
  { f: 285, cInf: 0 },
  { f: 362, cInf: 10, focus: eyesAt(INBOAT, 1.4) },
  { f: 394, cInf: 13, focus: eyesAt(P1, 0.9) },
  { f: 468, cInf: 9, focus: (f) => [walkX(f), D0 + 1.2, WALKZ] },
  { f: 561, cInf: 11, focus: eyesAt(P1, 1.2) },
  { f: 669, cInf: 13, focus: eyesAt(P1, 1.2) },
  { f: 733, cInf: 11, focus: eyesAt(P2, 1.2) },
  { f: 891, cInf: 11, focus: eyesAt(P3, 1.2) },
  { f: 980, cInf: 8, focus: () => [10.6, D0 + 1.3, 25.1] },
  { f: 1026, cInf: 14, focus: eyesAt(J3) },
  { f: 1059, cInf: 9, focus: () => [10.4, D0 + 0.9, 25.1] },
  { f: 1157, cInf: 0 },
  { f: 1232, cInf: 12, focus: eyesAt(P1, 1.2) },
  { f: 1266, cInf: 11, focus: eyesAt(P2, 1.2) },
  { f: 1292, cInf: 10, focus: eyesAt(P3S, 1.0) },
  { f: 1327, cInf: 13, focus: () => [9.74, D0 + 0.6, 25.0] },
  { f: 1373, dur: 20, cInf: 12, focus: () => [9.75, D0 + 0.35, 25.0] },
  { f: 1405, dur: 40, cInf: 0 },
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
