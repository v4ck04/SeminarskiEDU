// "One Fishing Net Explains It": an original money parable. Three men fish from the same wooden landing stage on the
// river (the London world of the Newton short: the Thames with its quays, the town and the Tower behind). Shots are
// timed to the voice (net-short/voice/words.json, frame = word onset x 30). Camera grammar as in the other shorts.
export const FPS = 30;
export const TOTAL = 1695;
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
export type Place = "p1" | "p1night" | "p2" | "p3" | "group" | "laugh" | "loan" | "throw" | "haul" | "nets" | "job" | "aerial" | "lesson" | "end";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 112, light: "day", place: "p1" },             // why do some people work every day and stay broke?
  { id: 2, a: 112, b: 163, light: "day", place: "p3" },           // one fishing net explains it
  { id: 3, a: 163, b: 318, light: "day", place: "group" },        // three men, one line each, nothing else
  { id: 4, a: 318, b: 386, light: "day", place: "p1" },           // the first catches one fish a day
  { id: 5, a: 386, b: 487, light: "golden", place: "p1night" },   // eats it that night; same fish, same hunger
  { id: 6, a: 487, b: 652, light: "day", place: "p2" },           // the second catches two, eats one, dries one
  { id: 7, a: 652, b: 786, light: "day", place: "p3" },           // the third stops fishing, ties knots for a week
  { id: 8, a: 786, b: 828, light: "day", place: "laugh" },        // everyone laughs at him
  { id: 9, a: 828, b: 1012, light: "day", place: "loan" },        // day five: starving; lend me ten, I'll pay back twenty
  { id: 10, a: 1012, b: 1090, light: "day", place: "throw" },     // day eight: one throw
  { id: 11, a: 1090, b: 1120, light: "day", place: "haul" },      // fifty fish
  { id: 12, a: 1120, b: 1210, light: "day", place: "nets" },      // two nets, then five; too many to pull alone
  { id: 13, a: 1210, b: 1372, light: "day", place: "job" },       // offers the first man a job: three fish a day
  { id: 14, a: 1372, b: 1424, light: "golden", place: "aerial" }, // same river, same start
  { id: 15, a: 1424, b: 1578, light: "golden", place: "lesson" }, // sold his time / saved it / built something
  { id: 16, a: 1578, b: TOTAL, light: "golden", place: "end" },   // the fish were never the difference. the net was.
];
export const XFADE: Record<number, number> = { 5: 10, 6: 8, 14: 12 };
export const FLASHES: [number, number][] = [[112, 4], [1092, 3]];

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
// 1: the first man close, a little low from the river side; his line runs down to the water at frame right
const S1a = (f: number) => dolly(add(P1, [0.6, 1.3, -3.9]), add(P1, [0.25, 1.35, 0]), pushK(f, 0, 0.0024, 0.007, 22), { fov: 44 });
// 2: the third man holds up his net (hero close-up)
const S2a = (f: number) => dolly(add(P3, [-0.6, 1.45, -2.9]), add(P3, [0, 1.6, 0]), pushK(f, 112, 0.003), { fov: 40, roll: 0.03 });
// 3: aerial over the river down onto the landing stage; the three in a row along it
const S3a = (f: number) => dolly([4, D0 + 15, 2], [13.4, D0 + 0.4, 25.6], pushK(f, 163, 0.0016), { fov: 46 });
const S3b = (f: number) => dolly([4.5, D0 + 2.6, 21.5], [13.2, D0 + 0.9, 25.4], pushK(f, 212, 0.0018), { fov: 52 });
// 4: catching the fish
const S4a = (f: number) => dolly(add(P1, [-0.2, 1.25, -3.9]), add(P1, [0.3, 1.15, -0.6]), pushK(f, 318, 0.0024), { fov: 46 });
// 5: evening, sitting on his crate, eating
const S5a = (f: number) => dolly(add(P1S, [0.8, 1.05, -2.9]), add(P1S, [0, 0.95, 0]), pushK(f, 380, 0.0024), { fov: 40 });
// 6: the second man in front of his drying rack
const S6a = (f: number) => dolly(add(P2, [-0.6, 1.3, -4.6]), add(P2, [-0.35, 1.3, 0.4]), pushK(f, 483, 0.002, 0.006, 24), { fov: 46 });
// 7: the third man on his crate tying knots, the net growing in his lap
const S7a = (f: number) => dolly(add(P3S, [0.9, 1.25, -3.4]), add(P3S, [-0.15, 0.55, -0.55]), pushK(f, 652, 0.0022), { fov: 44 });
// 8: the other two laughing (staged side by side for this shot)
export const L1: V3 = [12.0, D0, 25.1], L2: V3 = [13.4, D0, 25.0];
const S8a = (f: number) => dolly([12.6, D0 + 1.5, 19.6], [12.7, D0 + 1.35, 25.0], pushK(f, 786, 0.003, 0.008, 20), { fov: 44, roll: -0.03 });
// 9: starving on the crate; then the walk to the rack and the deal
const S9a = (f: number) => dolly(add(P3S, [-0.3, 1.2, -2.9]), add(P3S, [-0.15, 0.7, -0.4]), pushK(f, 828, 0.0028), { fov: 42 });
export const LOAN3: V3 = [14.55, D0, 25.15];
const S9b = (f: number) => dolly([13.9, D0 + 1.55, 19.6], [13.9, D0 + 1.45, 25.2], pushK(f, 875, 0.002), { fov: 46 });
// 10: from the water side and off the end: he throws the net out over the river
export const THROWER: V3 = [17.4, D0, 24.0];
export const NET_LAND: V3 = [17.0, WATER_Y, 19.9];
const S10a = (f: number) => dolly([20.5, D0 + 4.0, 14.0], [16.8, D0 - 2.0, 21.5], pushK(f, 1012, 0.0018, 0.005, 20), { fov: 62 });
// 11: the net comes up full
const S11a = (f: number) => dolly(add(THROWER, [-0.4, 1.3, -3.4]), add(THROWER, [0.1, 0.9, -0.6]), pushK(f, 1090, 0.004, 0.01, 18), { fov: 42 });
// 12: the net rack: two nets, then five; the third man struggling with a full one
export const NETMAN: V3 = [19.0, D0, 25.3];
const S12a = (f: number) => dolly([19.6, D0 + 1.7, 19.9], [19.7, D0 + 1.5, 26.0], pushK(f, 1120, 0.0022), { fov: 44 });
// 13: the third man offers the first man a job
export const J1: V3 = [10.0, D0, 25.0], J3: V3 = [11.5, D0, 25.2];
const S13a = (f: number) => dolly([10.7, D0 + 1.5, 20.2], [10.75, D0 + 1.35, 25.1], pushK(f, 1210, 0.002), { fov: 42 });
const S13b = (f: number) => dolly(add(J1, [0.4, 1.4, -2.7]), add(J1, [0.05, 1.45, 0]), pushK(f, 1306, 0.003, 0.008, 22), { fov: 40, roll: 0.035 });
// 14: golden aerial, the stage and the river
const S14a = (f: number) => dolly([1, D0 + 13, 3], [14, D0 + 0.5, 25.8], pushK(f, 1366, 0.0018), { fov: 48 });
// 15: three quick portraits: hauling for wages / the full rack / asleep while the net works
const S15a = (f: number) => dolly(add(P1, [0.8, 1.3, -3.1]), add(P1, [0.2, 1.25, -0.2]), pushK(f, 1424, 0.003), { fov: 42 });
const S15b = (f: number) => dolly(add(P2, [-1.2, 1.3, -3.6]), add(P2, [-0.5, 1.35, 0.5]), pushK(f, 1460, 0.003), { fov: 42 });
const S15c = (f: number) => dolly(add(P3S, [0.3, 1.3, -3.6]), add(P3S, [0, 0.8, -0.3]), pushK(f, 1491, 0.0022), { fov: 44 });
// 16: low over the water on the floating net full of fish, then up and back to the stage in the sunset
export const NET_WATER: V3 = [15.0, WATER_Y, 19.2];
const S16a = (f: number) => dolly(add(NET_WATER, [1.6, 1.3, -3.2]), add(NET_WATER, [0, 0.1, 0.4]), pushK(f, 1578, 0.0024), { fov: 44 });
const S16b = (f: number): Shot => {
  const a = S16a(1618), s = glide((f - 1618) / 70), r = 1 - s;
  const C = add(NET_WATER, [2.5, 3.5, -6]), E = add(NET_WATER, [4, 8.5, -13]), L = [14.6, D0 + 1.0, 25.5] as V3;
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 44 + 4 * s, roll: 0 };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 112, s: S2a }],
  3: [{ f: 163, s: S3a }, { f: 210, dur: 34, s: S3b }],
  4: [{ f: 318, s: S4a }],
  5: [{ f: 380, s: S5a }],
  6: [{ f: 483, s: S6a }],
  7: [{ f: 652, s: S7a }],
  8: [{ f: 786, s: S8a }],
  9: [{ f: 828, s: S9a }, { f: 875, cut: true, s: S9b }],
  10: [{ f: 1012, s: S10a }],
  11: [{ f: 1090, s: S11a }],
  12: [{ f: 1120, s: S12a }],
  13: [{ f: 1210, s: S13a }, { f: 1306, cut: true, s: S13b }],
  14: [{ f: 1366, s: S14a }],
  15: [{ f: 1424, s: S15a }, { f: 1460, cut: true, s: S15b }, { f: 1491, cut: true, s: S15c }],
  16: [{ f: 1578, s: S16a }, { f: 1618, dur: 30, s: S16b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(90), 0.35], [T(1058), 0.7], [T(1092), 1.4], [T(1279), 0.5]];
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
  { f: 0, cInf: 14, focus: eyesAt(P1) },
  { f: 112, cInf: 15, focus: eyesAt(P3) },
  { f: 163, cInf: 0 },
  { f: 212, dur: 30, cInf: 6, focus: eyesAt(P2) },
  { f: 318, cInf: 12, focus: eyesAt(P1) },
  { f: 386, cInf: 13, focus: eyesAt(P1S, 1.2) },
  { f: 487, cInf: 11, focus: eyesAt(P2) },
  { f: 652, cInf: 12, focus: eyesAt(P3S, 1.2) },
  { f: 786, cInf: 10, focus: () => [12.7, D0 + 1.6, 25.05] },
  { f: 828, cInf: 14, focus: eyesAt(P3S, 1.2) },
  { f: 875, cInf: 9, focus: () => [13.9, D0 + 1.6, 25.1] },
  { f: 1012, cInf: 0 },
  { f: 1090, cInf: 12, focus: () => [THROWER[0], D0 + 1.0, THROWER[2] - 0.5] },
  { f: 1120, cInf: 9, focus: eyesAt(NETMAN) },
  { f: 1210, cInf: 10, focus: () => [10.75, D0 + 1.6, 25.1] },
  { f: 1306, cInf: 14, focus: eyesAt(J1) },
  { f: 1372, cInf: 0 },
  { f: 1424, cInf: 12, focus: eyesAt(P1) },
  { f: 1460, cInf: 11, focus: eyesAt(P2) },
  { f: 1491, cInf: 9, focus: eyesAt(P3S, 1.2) },
  { f: 1578, cInf: 12, focus: () => NET_WATER },
  { f: 1618, dur: 40, cInf: 0 },
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
