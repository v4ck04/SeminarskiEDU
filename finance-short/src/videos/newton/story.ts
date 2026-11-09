// "What Goes Up": Isaac Newton and the South Sea Bubble, 1720. Shots are timed to the voice (voice/words.json, frame =
// word onset x 30). One world: London on the Thames (river along x, banks at y = D0), the Tower of London on the far
// bank, Exchange Alley = the main street on the near bank, Newton's garden with the apple tree in the park.
// Camera grammar from the skill: cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (push-in), 7-frame
// flip kicks on impacts, 4-5 degree rolls on punch words.
export const FPS = 30;
export const TOTAL = 1935;
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

// ---------------- places ----------------
export const TREE: V3 = [70.2, D0, -74.8];        // the apple tree in Newton's garden (park on the near bank)
export const GARDEN_NEWTON: V3 = [68.7, D0, -73.0];
export const PRESS: V3 = [-31.8, D0, 48.55];       // coin screw press in the Tower courtyard east of the keep (the Mint)
export const MINT_NEWTON: V3 = [-31.5, D0, 49.8];
export const GATE: V3 = [-48, D0, 37.5];          // river gate in the Tower's curtain wall
export const BENCH: V3 = [-3, D0, 33.3];         // bench on the far quay, facing the river (-z)
export const STREET_Z = -56;                       // Exchange Alley crowd centre (main street, near bank)
export const PARK_KIDS: V3 = [66.2, D0, -71.5];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "garden" | "aerial" | "mint" | "street" | "gate" | "quay" | "park";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 121, light: "day", place: "garden" },          // hook: the apple comes down
  { id: 2, a: 121, b: 189, light: "day", place: "garden" },        // "then he lost a fortune": the bag bursts
  { id: 3, a: 189, b: 283, light: "day", place: "aerial", sunAz: 120 }, // London, 1720
  { id: 4, a: 283, b: 381, light: "day", place: "mint" },          // runs the Royal Mint
  { id: 5, a: 381, b: 464, light: "day", place: "street" },        // everyone is buying shares
  { id: 6, a: 464, b: 535, light: "day", place: "street" },        // the price nearly triples
  { id: 7, a: 535, b: 644, light: "day", place: "street" },        // Newton sells, walks away richer
  { id: 8, a: 644, b: 744, light: "day", place: "street" },        // price climbing, friends richer
  { id: 9, a: 744, b: 837, light: "day", place: "street" },        // can't take it anymore
  { id: 10, a: 837, b: 925, light: "day", place: "street" },       // buys back in with everything
  { id: 11, a: 925, b: 997, light: "golden", place: "street" },    // August: a thousand pounds
  { id: 12, a: 997, b: 1071, light: "day", place: "street" },      // September: it falls off a cliff (POP)
  { id: 13, a: 1071, b: 1186, light: "day", place: "street" },     // luckily / unluckily
  { id: 14, a: 1186, b: 1322, light: "day", place: "park" },       // a ball thrown in the air
  { id: 15, a: 1322, b: 1449, light: "day", place: "park" },       // new buyers push; gravity takes over
  { id: 16, a: 1449, b: 1532, light: "day", place: "gate" },       // the Chancellor locked in the Tower
  { id: 17, a: 1532, b: 1610, light: "day", place: "mint" },       // where Newton made the coins
  { id: 18, a: 1610, b: 1681, light: "golden", place: "quay" },    // lost all his profit
  { id: 19, a: 1681, b: 1769, light: "golden", place: "quay" },    // pockets empty
  { id: 20, a: 1769, b: TOTAL, light: "golden", place: "garden" }, // the apple, again
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 4: 6, 5: 6, 11: 8, 12: 8, 14: 10, 16: 8, 18: 10, 20: 12 };
/** white flashes: [frame, length] (after the hook; the bubble's pop) */
export const FLASHES: [number, number][] = [[188, 4], [1020, 3]];
export const FLASH_AT = 188;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story physics ----------------
/** the South Sea bubble over Exchange Alley: radius (m) by frame; pops at POP */
export const POP = 1020;
const BUB_R: [number, number][] = [[396, 0], [440, 3.6], [470, 4.0], [500, 6], [512, 9.5], [520, 9.2], [600, 9.8], [660, 10.2], [676, 12.8], [700, 13.2],
  [716, 15], [740, 15.4], [850, 16.5], [910, 18.5], [935, 19], [975, 22], [1000, 22.5], [POP, 23]];
export const bubble = (f: number) => {
  if (f < 396 || f >= POP) return null;
  let r = lin(BUB_R, f);
  // grow beats: a quick overshoot settle after each jump
  r *= 1 + 0.025 * Math.sin(f * 0.21) * clamp01((f - 396) / 30);
  if (f > 1001) r *= 1 + 0.03 * Math.sin((f - 1001) * 1.9) * ((f - 1001) / 19); // trembles before it goes
  const c: V3 = [0, D0 + 12 + 1.05 * r, -98];
  return { r, c };
};
/** falling share papers after the pop: deterministic flutter */
export const PAPERS = 46;
export const paperAt = (i: number, f: number): { p: V3; rot: number; curl: number } | null => {
  const h = (k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const t = (f - POP - 2 - h(1) * 12) / FPS;
  if (t < 0) return null;
  const x0 = (h(2) - 0.5) * 12, z0 = STREET_Z - 4 + (h(3) - 0.5) * 18, y0 = D0 + 5 + h(4) * 13;
  const y = Math.max(D0 + 0.03, y0 - 1.5 * t);
  const sway = 0.9 * Math.sin(t * (2.2 + h(5)) + h(6) * 6);
  return { p: [x0 + sway, y, z0 + 0.5 * Math.cos(t * 1.7 + h(7) * 6)], rot: 0.6 * Math.sin(t * 3 + h(8) * 6), curl: Math.sin(t * 4 + h(9) * 6) };
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

const G = GARDEN_NEWTON, M = MINT_NEWTON;
// 1: garden MS (Newton + the tree), the apple falls through frame right
const S1a = (f: number) => dolly(add(G, [-1.5, 1.5, 4.4]), add(G, [0.5, 1.75, 0]), pushK(f, 0, 0.0022), { fov: 40 });
const S1b = (f: number) => dolly(add(G, [-1.2, 1.2, 3.9]), add(G, [0.55, 1.15, 0]), pushK(f, 92, 0.002), { fov: 40, roll: 0.03 });
// 2: CU Newton with the bag; punch in on "lost"
const S2a = (f: number) => dolly(add(G, [-0.9, 1.75, 2.9]), add(G, [0.05, 1.55, 0]), pushK(f, 121, 0.0025, 0.006, 30), { fov: 38, roll: -0.03 });
// 3: aerial over the Thames toward the Tower
const S3a = (f: number) => zoom([22, 46, -46], [-44, 10, 50], 42, pushK(f, 185, 0.0022));
const S3b = (f: number) => zoom([-8, 30, -26], [-46, 12, 52], 40, pushK(f, 236, 0.002));
// 4: the Mint: Newton at the press in the Tower courtyard, the keep behind
const S4a = (f: number) => dolly(add(M, [7.2, 1.75, -0.2]), add(M, [0, 1.75, -0.7]), pushK(f, 283, 0.0022), { fov: 42 });
const S4b = (f: number) => dolly(add(M, [4.4, 1.6, -0.2]), add(M, [0, 1.55, -0.6]), pushK(f, 321, 0.002), { fov: 40, roll: 0.035 });
// 5-13: Exchange Alley (main street, near bank, crowd around z -56; the bubble over the far end of the street)
const S5a = (f: number) => dolly([1.4, D0 + 1.45, -44.5], [-0.4, D0 + 3.6, -66], pushK(f, 381, 0.0022), { fov: 44 });
const S6a = (f: number) => dolly([0.6, D0 + 1.3, -46.5], [0, D0 + 11, -92], pushK(f, 464, 0.0015, 0.005, 30), { fov: 50, roll: -0.035 });
const S7a = (f: number) => dolly([1.3, D0 + 1.6, -46.2], [0.2, D0 + 2.4, -58], pushK(f, 535, 0.0022), { fov: 42 });
const S8a = (f: number) => dolly([-0.8, D0 + 1.6, -46.8], [0.2, D0 + 5.5, -66], pushK(f, 644, 0.002), { fov: 46 });
const S8b = (f: number) => dolly([-2.6, D0 + 1.7, -47.6], [0.2, D0 + 1.7, -55.6], pushK(f, 678, 0.0025), { fov: 40, roll: 0.03 });
const N9: V3 = [-1.7, D0, -51.4];
const S9a = (f: number) => dolly(add(N9, [0.5, 1.72, 3.1]), add(N9, [0, 1.62, 0]), pushK(f, 744, 0.0025, 0.007, 40), { fov: 38 });
const S9b = (f: number) => dolly(add(N9, [0.3, 1.66, 2.2]), add(N9, [0, 1.6, 0]), pushK(f, 815, 0.003), { fov: 36, roll: -0.04 });
export const N10: V3 = [0.9, D0, -54.6];
const S10a = (f: number) => dolly([4.8, D0 + 1.8, -50.0], [-1.0, D0 + 2.4, -58.5], pushK(f, 837, 0.0022), { fov: 44 });
const S11a = (f: number) => zoom([0.5, D0 + 4.5, 34], [0, D0 + 26, -96], 46, pushK(f, 921, 0.0018));
const S12a = (f: number) => dolly([0.8, D0 + 2.0, -31.5], [0, D0 + 19, -95], pushK(f, 997, 0.0018, 0.004, 22), { fov: 56 });
const S12b = (f: number) => dolly([1.2, D0 + 2.4, -45.2], [0, D0 + 4, -60], pushK(f, 1022, 0.0022), { fov: 48 });
export const N13: V3 = [0.2, D0, -53.9];
const S13a = (f: number) => dolly(add(N13, [-0.8, 1.35, 3.6]), add(N13, [0, 0.95, 0]), pushK(f, 1071, 0.0022), { fov: 40 });
const S13b = (f: number) => dolly(add(N13, [-0.5, 1.2, 2.5]), add(N13, [0, 0.9, 0]), pushK(f, 1117, 0.0025), { fov: 38, roll: 0.04 });
// 14-15: the park (ball analogy)
const P = PARK_KIDS;
const S14a = (f: number) => dolly(add(P, [-1.3, 1.0, 6.2]), add(P, [0.9, 2.5, 0]), pushK(f, 1186, 0.0016), { fov: 46 });
const S14b = (f: number) => dolly(add(P, [-1.0, 1.0, 7.2]), add(P, [2.0, 3.3, -0.2]), pushK(f, 1254, 0.0016), { fov: 48 });
const S15a = (f: number) => dolly(add(P, [0.2, 1.1, 8.2]), add(P, [2.9, 3.6, -0.2]), pushK(f, 1322, 0.0015), { fov: 50 });
const S15b = (f: number) => dolly(add(P, [4.6, 1.5, 4.6]), add(P, [5.9, 1.9, 0]), pushK(f, 1399, 0.003, 0.006, 20), { fov: 40, roll: 0.035 });
// 16: the Tower's river gate seen from the far quay edge
const S16a = (f: number) => dolly([-42.0, D0 + 2.4, 24.5], [-48.4, D0 + 5.5, 40], pushK(f, 1449, 0.0022), { fov: 50 });
// 17: back in the courtyard: tilt from the keep down to Newton at the press
const S17a = (f: number) => dolly(add(M, [7.6, 2.0, 1.4]), add(M, [-4.5, 13, -0.6]), pushK(f, 1532, 0.0015), { fov: 48 });
const S17b = (f: number) => dolly(add(M, [5.6, 1.7, 0.6]), add(M, [0, 1.75, -0.7]), pushK(f, 1555, 0.0022), { fov: 42 });
// 18-19: the far quay at sunset, the Tower behind
const B = BENCH;
const S18a = (f: number) => dolly([4.5, D0 + 1.9, 28.2], [-6, D0 + 3.2, 35.6], pushK(f, 1602, 0.0018), { fov: 48 });
export const N19: V3 = [-1.6, D0, 33.0];
const S19a = (f: number) => dolly(add(N19, [-0.7, 1.55, -3.6]), add(N19, [0, 1.35, 0]), pushK(f, 1681, 0.0022), { fov: 40 });
const S19b = (f: number) => dolly(add(N19, [-0.4, 1.45, -2.8]), add(N19, [0, 1.3, 0]), pushK(f, 1718, 0.0022), { fov: 40, roll: -0.03 });
// 20: back under the apple tree at sunset, the apple lands, then the crane pulls out over the town
export const N20: V3 = [69.0, D0, -73.1];
const S20a = (f: number) => dolly(add(N20, [-1.9, 1.35, 5.4]), add(N20, [0.45, 1.35, 0]), pushK(f, 1765, 0.0022), { fov: 42 });
const S20b = (f: number) => dolly(add(N20, [-1.0, 1.1, 3.4]), add(N20, [0.2, 0.95, 0]), pushK(f, 1808, 0.0025, 0.005, 24), { fov: 40, roll: 0.04 });
const CRANE: V3[] = [add(N20, [-2.0, 2.8, 6.5]), add(N20, [-2.6, 5.2, 11])];
const S20c = (f: number): Shot => {
  const a = S20b(1862), s = glide((f - 1862) / 73), r = 1 - s, [C, E] = CRANE;
  const lookEnd: V3 = add(N20, [0.7, 2.2, -2]);
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * E[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (lookEnd[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 40) + (46 - (a.fov ?? 40)) * s, roll: 0.04 * r };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 88, dur: 26, s: S1b }],
  2: [{ f: 121, s: S2a }],
  3: [{ f: 185, s: S3a }, { f: 236, dur: 30, s: S3b }],
  4: [{ f: 280, s: S4a }, { f: 321, dur: 22, s: S4b }],
  5: [{ f: 378, s: S5a }],
  6: [{ f: 461, s: S6a }],
  7: [{ f: 535, s: S7a }],
  8: [{ f: 644, s: S8a }, { f: 678, cut: true, s: S8b }],
  9: [{ f: 744, s: S9a }, { f: 815, dur: 20, s: S9b }],
  10: [{ f: 837, s: S10a }],
  11: [{ f: 921, s: S11a }],
  12: [{ f: 993, s: S12a }, { f: 1022, cut: true, s: S12b }],
  13: [{ f: 1071, s: S13a }, { f: 1117, dur: 22, s: S13b }],
  14: [{ f: 1181, s: S14a }, { f: 1250, dur: 30, s: S14b }],
  15: [{ f: 1322, s: S15a }, { f: 1399, cut: true, s: S15b }],
  16: [{ f: 1445, s: S16a }],
  17: [{ f: 1532, s: S17a }, { f: 1552, dur: 28, s: S17b }],
  18: [{ f: 1605, s: S18a }],
  19: [{ f: 1681, s: S19a }, { f: 1718, dur: 22, s: rolled(S19b, -0.03) }],
  20: [{ f: 1763, s: S20a }, { f: 1808, cut: true, s: S20b }, { f: 1862, cut: true, s: S20c }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(130), 0.4], [T(POP), 1.6], [T(1413), 0.9], [T(1817), 0.9]];
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
  { f: 0, cInf: 12, focus: eyesAt(G) },                 // garden MS
  { f: 121, cInf: 15, focus: eyesAt(G, 1.55) },          // CU with the bag
  { f: 189, cInf: 0 },                                    // aerial
  { f: 283, cInf: 11, focus: eyesAt(M) },                // Mint MS
  { f: 381, cInf: 0 },                                    // crowd + bubble (busy, sharp)
  { f: 535, cInf: 10, focus: () => [0.6, D0 + 1.6, -56.0 + 0] }, // Newton walking out of the crowd
  { f: 644, cInf: 0 },
  { f: 678, cInf: 10, focus: () => [0.6, D0 + 1.6, -55.6] }, // friends
  { f: 744, cInf: 15, focus: eyesAt(N9) },                // CU Newton
  { f: 837, cInf: 7, focus: () => [N10[0], D0 + 1.6, N10[2]] },
  { f: 925, cInf: 0 },                                    // August wide
  { f: 1022, cInf: 7 },                                   // paper rain
  { f: 1071, cInf: 13, focus: eyesAt(N13, 1.0) },         // Newton sitting
  { f: 1186, cInf: 0 },                                    // park wides
  { f: 1399, cInf: 10 },                                  // bonk MS
  { f: 1449, cInf: 0 },                                   // the gate
  { f: 1555, cInf: 10, focus: eyesAt(M) },                // Newton at the press again
  { f: 1610, cInf: 5 },                                   // bench wide, golden
  { f: 1681, cInf: 12, focus: eyesAt(N19, 1.45) },        // pockets
  { f: 1769, cInf: 10, focus: eyesAt(N20, 1.2) },         // under the tree
  { f: 1862, dur: 40, cInf: 0 },                          // crane out
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing objects (built by world.ts): kit = a cartoon plant name; visible a <= f < b */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 0, b: 121, kit: "plant_bushDetailed", pos: [66.9, D0, -68.6], s: 1.1, yaw: 0.4 },     // garden MS: bush bottom-left
  { a: 1186, b: 1322, kit: "plant_bushDetailed", pos: [61.9, D0, -64.4], s: 1.2, yaw: 0.9 }, // park wide: bush bottom-left
];
