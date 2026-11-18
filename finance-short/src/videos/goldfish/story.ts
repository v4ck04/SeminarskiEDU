// "One Golden Fish Explains It": episode 3 of the money-parable series, on the bitcoin crash of November 2026. The same
// three men on the same landing stage: the price of the golden fish halves; the first man bought with borrowed fish and
// has to sell at the bottom, the second bought none, the third bought one he could afford to lose. Shots are timed to
// the voice (goldfish-short/voice/words.json, frame = word onset x 30). Camera grammar as in the other shorts.
export const FPS = 30;
export const TOTAL = 1745;
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
  { id: 1, a: 0, b: 112, light: "day" },          // bitcoin has lost almost half its value since its record a year ago
  { id: 2, a: 112, b: 157, light: "day" },        // some people lost everything
  { id: 3, a: 157, b: 201, light: "day" },        // others didn't even blink
  { id: 4, a: 201, b: 255, light: "day" },        // one golden fish explains it
  { id: 5, a: 255, b: 398, light: "day" },        // everyone wants the golden fish; its price goes up every week
  { id: 6, a: 398, b: 578, light: "day" },        // the first borrows twenty baskets and buys at the top
  { id: 7, a: 578, b: 663, light: "day" },        // the second thinks it's a silly fish; buys none
  { id: 8, a: 663, b: 800, light: "day" },        // the third buys one he can afford to lose; borrows nothing
  { id: 9, a: 800, b: 873, light: "day" },        // one morning the price falls by half
  { id: 10, a: 873, b: 958, light: "day" },       // the second laughs; the third shrugs and waits
  { id: 11, a: 958, b: 1056, light: "day" },      // the lender at the door: pay me back, today
  { id: 12, a: 1056, b: 1214, light: "day" },     // worth half; he sells every one, at the bottom, to the third man
  { id: 13, a: 1214, b: 1342, light: "golden" },  // maybe the price comes back; he will never find out
  { id: 14, a: 1342, b: 1410, light: "golden" },  // the crash didn't ruin him; the loan did
  { id: 15, a: 1410, b: 1594, light: "golden" },  // november 13: 1.6 billion dollars of borrowed bets force-sold in a day
  { id: 16, a: 1594, b: TOTAL, light: "golden" }, // prices fall for everyone; only borrowed money makes you sell at the bottom
];
export const XFADE: Record<number, number> = { 13: 12 };
export const FLASHES: [number, number][] = [[201, 4], [837, 3]];

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
export const BOARD: V3 = [15.0, D0, 26.5];                  // the market price board on its post (card base)
export const J1: V3 = [10.0, D0, 25.0], J3: V3 = [10.95, D0, 25.15], LEND: V3 = [9.05, D0, 25.15];
export const LEND3: V3 = [15.95, D0, 25.2];
export const BOARD13: V3 = [12.3, D0, 26.15];             // the board as seen behind the first man at sunset                 // the lender offering the third man a loan
export const BAR2: V3 = [14.15, D0, 25.1], BAR3: V3 = [17.55, D0, 25.1];
export const CROWD: V3[] = [[13.9, D0, 25.75], [14.5, D0, 26.05], [15.6, D0, 26.05], [16.2, D0, 25.75]];
export const ROW: V3[] = [[8.0, D0, 25.0], [9.45, D0, 25.2], [10.9, D0, 25.0], [12.35, D0, 25.2], [13.8, D0, 25.0]];
/** the lender walking in (shot 11) and down the row collecting (shot 15) */
export const lenderInX = (f: number) => 7.4 + (LEND[0] - 7.4) * smooth((f - 965) / 36);
export const collectX = (f: number) => 7.0 + 7.4 * clamp01((f - 1420) / 165);
export const COLLECTZ = 24.45;

const H = (p: V3, d: V3) => add(p, d);
const S1a = (f: number) => dolly(H(BOARD, [0.25, 1.35, -5.4]), H(BOARD, [0, 1.3, 0]), pushK(f, 0, 0.0018, 0.004, 20), { fov: 40 });
const S2a = (f: number) => dolly(H(P1S, [0.3, 1.2, -3.2]), H(P1S, [0.2, 0.85, 0]), pushK(f, 112, 0.003), { fov: 42 });
const S3a = (f: number) => dolly(H(P3S, [0.3, 1.2, -3.0]), H(P3S, [0.15, 0.85, 0]), pushK(f, 157, 0.003), { fov: 42, roll: 0.02 });
const S4a = (f: number) => dolly(H(P3, [-0.85, 1.45, -3.1]), H(P3, [-0.3, 1.55, 0]), pushK(f, 201, 0.003), { fov: 42, roll: 0.03 });
const S5a = (f: number) => dolly([4, D0 + 15, 2], [13.0, D0 + 0.6, 26.0], pushK(f, 255, 0.0016), { fov: 46 });
const S5b = (f: number) => dolly([14.7, D0 + 1.7, 20.3], [15.0, D0 + 1.2, 26.0], pushK(f, 300, 0.0018), { fov: 50 });
const S6a = (f: number) => dolly([9.55, D0 + 1.4, 20.9], [9.5, D0 + 1.05, 25.1], pushK(f, 398, 0.0018, 0.005, 20), { fov: 44 });
const S7a = (f: number) => dolly(H(P2, [0.05, 1.3, -3.6]), H(P2, [0.0, 1.05, 0]), pushK(f, 578, 0.003), { fov: 44 });
const S8a = (f: number) => dolly([16.4, D0 + 1.3, 20.5], [16.45, D0 + 1.05, 25.2], pushK(f, 663, 0.002), { fov: 46 });
const S9a = (f: number) => dolly(H(BOARD, [0.0, 1.3, -5.2]), H(BOARD, [0, 1.25, 0]), pushK(f, 800, 0.0022, 0.008, 20), { fov: 40 });
const S10a = (f: number) => dolly(H(P2, [0.05, 1.3, -3.6]), H(P2, [0.0, 1.05, 0]), pushK(f, 873, 0.003), { fov: 44 });
const S10b = (f: number) => dolly(H(P3S, [0.3, 1.2, -3.0]), H(P3S, [0.15, 0.85, 0]), pushK(f, 908, 0.003), { fov: 42, roll: 0.02 });
const S11a = (f: number) => dolly([9.55, D0 + 1.4, 20.9], [9.5, D0 + 1.1, 25.1], pushK(f, 958, 0.0022), { fov: 44 });
const S12a = (f: number) => dolly([10.0, D0 + 1.45, 19.9], [10.0, D0 + 1.05, 25.1], pushK(f, 1056, 0.0018), { fov: 48 });
const S13a = (f: number) => dolly(H(P1S, [0.75, 1.3, -5.0]), H(P1S, [0.75, 0.95, 0.5]), pushK(f, 1208, 0.0022), { fov: 48 });
const S14a = (f: number) => dolly(H(P1S, [0.2, 1.15, -2.6]), H(P1S, [0.1, 0.9, 0]), pushK(f, 1342, 0.003), { fov: 42 });
const S14b = (f: number) => dolly(H(LEND, [0.3, 1.3, -3.1]), H(LEND, [0.3, 1.0, 0]), pushK(f, 1380, 0.003, 0.008, 16), { fov: 44, roll: -0.03 });
const S15a = (f: number) => dolly([5.2, D0 + 2.3, 19.6], [12.9, D0 + 0.8, 25.1], pushK(f, 1410, 0.0018), { fov: 50 });
const S16a = (f: number) => dolly(H(P3S, [0.4, 1.2, -3.0]), H(P3S, [0.3, 0.85, 0]), pushK(f, 1594, 0.0025), { fov: 42 });
const S16b = (f: number) => dolly([P3S[0] - 2.2, D0 + 5.5, 15.0], [P3S[0] - 2.0, D0 + 0.8, 25.4], pushK(f, 1660, 0.0015), { fov: 48 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 112, s: S2a }],
  3: [{ f: 157, s: S3a }],
  4: [{ f: 201, s: S4a }],
  5: [{ f: 255, s: S5a }, { f: 298, dur: 34, s: S5b }],
  6: [{ f: 398, s: S6a }],
  7: [{ f: 578, s: S7a }],
  8: [{ f: 663, s: S8a }],
  9: [{ f: 800, s: S9a }],
  10: [{ f: 873, s: S10a }, { f: 908, cut: true, s: S10b }],
  11: [{ f: 958, s: S11a }],
  12: [{ f: 1056, s: S12a }],
  13: [{ f: 1208, s: S13a }],
  14: [{ f: 1342, s: S14a }, { f: 1380, cut: true, s: S14b }],
  15: [{ f: 1410, s: S15a }],
  16: [{ f: 1594, s: S16a }, { f: 1650, dur: 60, s: S16b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(41), 0.4], [T(837), 0.9], [T(1022), 0.45], [T(1170), 0.4]];
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
  { f: 0, cInf: 12, focus: boardAt },
  { f: 112, cInf: 13, focus: eyesAt(P1S, 1.2) },
  { f: 157, cInf: 13, focus: eyesAt(P3S, 1.2) },
  { f: 201, cInf: 15, focus: eyesAt(P3) },
  { f: 255, cInf: 0 },
  { f: 300, dur: 30, cInf: 6, focus: () => [15.0, D0 + 1.5, 25.8] },
  { f: 398, cInf: 9, focus: () => [9.5, D0 + 1.4, 25.1] },
  { f: 578, cInf: 12, focus: eyesAt(P2) },
  { f: 663, cInf: 9, focus: () => [16.6, D0 + 1.4, 25.2] },
  { f: 800, cInf: 12, focus: boardAt },
  { f: 873, cInf: 12, focus: eyesAt(P2) },
  { f: 908, cInf: 13, focus: eyesAt(P3S, 1.2) },
  { f: 958, cInf: 9, focus: () => [9.5, D0 + 1.4, 25.1] },
  { f: 1056, cInf: 8, focus: () => [10.0, D0 + 1.4, 25.1] },
  { f: 1214, cInf: 10, focus: eyesAt(P1S, 1.2) },
  { f: 1342, cInf: 13, focus: eyesAt(P1S, 1.2) },
  { f: 1380, cInf: 11, focus: eyesAt(LEND) },
  { f: 1410, cInf: 0 },
  { f: 1594, cInf: 12, focus: eyesAt(P3S, 1.2) },
  { f: 1650, dur: 40, cInf: 0 },
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
