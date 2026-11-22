// "The Bank That Wanted Eight of Everything": Wells Fargo's eight-products goal and the fake-accounts scandal.
// The far-bank quay of the river town: a red-brick bank with a columned portico and a gold 8 in its pediment, the
// lobby inside (teller counter, chalkboard of daily goals, the card tower), the boss's panelled corner, a house porch
// along the quay and a vegetable patch in the park on the near bank. Shots are timed to eight-short/voice/words.json.
export const FPS = 30;
export const TOTAL = 1845;
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
// the bank: outer walls x BX0..BX1, facade z BZF (facing the river, -z), back wall z BZB; WT thick
export const BANK = { x0: 34, x1: 50, zf: 36.5, zb: 50.5, h: 9.5, wt: 0.35 };
export const IN = { x0: BANK.x0 + BANK.wt, x1: BANK.x1 - BANK.wt, z0: BANK.zf + BANK.wt, z1: BANK.zb - BANK.wt }; // lobby floor
export const COUNTER = { x0: 37.4, x1: 48.6, z0: 43.3, z1: 44.1, y: D0 + 0.82 };
export const CY = COUNTER.y;
/** tellers behind the counter, in screen order from the lobby (screen right = -x when looking +z) */
export const TL: V3[] = [[46.1, D0, 44.9], [43.8, D0, 44.9], [41.5, D0, 44.9], [39.2, D0, 44.9]];
export const BOARD = { x0: 40.8, x1: 44.6, y0: D0 + 1.55, y1: D0 + 3.45, z: IN.z1 };
export const MGR: V3 = [44.95, D0, 49.35];        // the branch manager, beside the chalkboard
export const MGR5: V3 = [42.65, D0, 46.3];       // ... behind the tellers (bonus / glare)
export const MGR14: V3 = [42.7, D0, 48.55];      // ... hugging his number in front of the board
export const TOWER: V3 = [40.05, CY, 43.7];      // the card tower on the counter, beside the stamping teller (TL[3])
export const MONITORS: V3[] = [[46.85, CY, 43.75], [44.55, CY, 43.75], [42.25, CY, 43.75]];
export const STAMP: V3 = [38.85, CY, 43.7];       // ink pad + forms of the stamping teller
export const TRAY: V3 = [45.45, CY, 43.7];       // the envelope tray of the first teller
export const CAL: V3 = [38.25, D0 + 2.75, IN.z1 - 0.03]; // wall calendar
// the boss's panelled corner (behind the counter, left end of the lobby seen from the street side)
export const BOSS3: V3 = [35.95, D0, 46.95];
export const FRAME8: V3 = [IN.x0 + 0.04, D0 + 2.45, 47.65]; // framed 8 on the side wall
// exterior
export const PORTICO = { x0: 37.0, x1: 47.0, zc: 35.0, top: D0 + 6.6 };  // columns at zc, entablature to top + 0.8
export const STEP = (z: number) => (z >= 34.6 ? 0.45 : z >= 34.2 ? 0.3 : z >= 33.8 ? 0.15 : 0); // height of the steps / porch at z
export const EIGHT: V3 = [42.0, D0 + 8.35, 34.38];  // the gold 8 in the pediment
export const FENCE = { x0: 33.0, x1: 51.0, z0: 33.0, z1: 51.2, h: 2.3 };
export const DOOR: V3 = [42.0, D0 + 0.45, 36.45];
export const HOUSE = { x: 60.0, z: 40.5, w: 7, d: 8, h: 8.4 };            // the porch house, front at z 36.5
export const MAT: V3 = [60.0, D0, 35.55];                                // doormat in front of its door step
export const GARDEN = { x0: 69.2, x1: 72.4, z0: -69.4, z1: -67.6 };       // vegetable patch (near bank park)
export const KIDP: V3 = [70.3, D0, -66.95];
export const PARENTP: V3 = [71.4, D0, -66.55];
export const WATER_Y = 0.04;
// legacy names the shared world code reads
export const TREE: V3 = [70.2, D0, -74.8];
export const bubble = (_f: number): { r: number; c: V3 } | null => null;

// ---------------- the card tower ----------------
export const CARD_H = 0.0145;   // thickness of one cartoon card (m)
export const COLLAPSE = 968;    // the tower comes down ("two million accounts")
/** cards in the tower at frame f (it keeps growing between the shots that show it) */
export const towerN = (f: number) => Math.floor(lin([[0, 6], [134, 62], [583, 92], [690, 104], [830, 118], [848, 132], [868, 150], [890, 168], [905, 182], [912, 186]], f));

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 140, light: "day" },        // a bank's favorite number ... three and a half million fake accounts
  { id: 2, a: 140, b: 274, light: "day" },      // it's Wells Fargo ... its favorite number is eight
  { id: 3, a: 274, b: 396, light: "day" },      // why eight? ... eight rhymed with great
  { id: 4, a: 396, b: 497, light: "day" },      // every branch got targets, and every worker got a daily number
  { id: 5, a: 497, b: 583, light: "day" },      // hit it, a bonus; miss it, and you heard about it
  { id: 6, a: 583, b: 690, light: "day" },      // accounts for customers who never asked
  { id: 7, a: 690, b: 772, light: "day" },      // debit cards, PINs ...
  { id: 8, a: 772, b: 830, light: "day" },      // ... and even invented email addresses (the doormat)
  { id: 9, a: 830, b: 912, light: "day" },      // one card here, one account there. every single day
  { id: 10, a: 912, b: 1040, light: "day" },    // in 2016, regulators reported two million accounts nobody had asked for
  { id: 11, a: 1040, b: 1112, light: "day" },   // and 5,300 workers were fired
  { id: 12, a: 1112, b: 1288, light: "day" },   // luckily ... credit cards. unluckily ... the fees
  { id: 13, a: 1288, b: 1421, light: "day" },   // pay a kid for every weed he pulls
  { id: 14, a: 1421, b: 1557, light: "day" },   // when the number becomes the goal
  { id: 15, a: 1557, b: 1703, light: "day" },   // three billion dollars; banned from getting any bigger
  { id: 16, a: 1703, b: TOTAL, light: "golden" },// for seven years ... wasn't allowed to grow
];
export const XFADE: Record<number, number> = { 13: 8, 14: 8, 16: 12 };
export const FLASHES: [number, number][] = [[140, 4], [COLLAPSE, 3]];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the fence (shot 15 on) ----------------
/** 0..1 height of a fence panel at frame f; c = 0 (front centre) .. 1 (middle of the back): they shoot up in a ripple */
export const FENCE_AT = 1646;
export const fenceUp = (f: number, c: number) => (f < 1557 ? 0 : easeOut((f - FENCE_AT - 16 * c) / 7));

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

// the walkers in shot 11: out of the door, down the steps toward the lens, then off to the sides
export const OUT_X = [41.5, 42.5, 42.0];
export const outAt = (f: number, k: number): { p: V3; walking: boolean } => {
  const f0 = 1040 + 12 + k * 17, u = Math.max(0, (f - f0) / FPS);
  const z = 36.3 - 1.05 * u, side = k === 1 ? -1 : 1, x = OUT_X[k] + (z < 33.6 ? side * (33.6 - z) * 0.9 : 0);
  return { p: [x, D0 + STEP(z), z], walking: f >= f0 };
};
// the inspectors in shot 10: they come in from the left of the lobby and stop facing the counter
export const INSPX = (f: number, k: number) => lin([[912 + 6 * k, 44.9 + 0.6 * k], [946 + 6 * k, 42.75 - 0.8 * k]], f);
export const INSPZ = [42.55, 42.25, 42.7];
// the street walkers in shot 2
export const WALK: { x0: number; z: number; v: number }[] = [
  { x0: 36.5, z: 31.4, v: 0.95 }, { x0: 47.5, z: 32.4, v: -0.9 }, { x0: 31.0, z: 32.9, v: 1.05 }, { x0: 52.0, z: 31.2, v: -1.0 },
  { x0: 40.5, z: 33.0, v: -0.85 }, { x0: 44.0, z: 31.0, v: 0.9 },
];
export const walkX = (f: number, k: number) => WALK[k].x0 + WALK[k].v * (f - 140) / FPS;

const C1 = (f: number) => dolly([39.55, D0 + 1.3, 40.9], [39.45, D0 + 1.15, 44.4], pushK(f, 0, 0.0016, 0.004, 20), { fov: 50 });
const C2a = (f: number) => dolly([43.2, D0 + 4.2, 6.0], [42.0, D0 + 4.9, 36.0], pushK(f, 140, 0.0009), { fov: 50 });
const C2b = (f: number) => dolly([42.25, D0 + 7.0, 26.2], EIGHT, pushK(f, 216, 0.0016, 0.006, 16), { fov: 40 });
const C3 = (f: number) => dolly([40.4, D0 + 1.6, 47.0], [35.0, D0 + 1.75, 47.15], pushK(f, 274, 0.0018, 0.005, 16), { fov: 44, roll: -0.03 });
const C4a = (f: number) => dolly([43.1, D0 + 1.7, 45.4], [42.7, D0 + 2.35, 50.0], pushK(f, 396, 0.0015), { fov: 52 });
const C4b = (f: number) => dolly([43.85, D0 + 1.6, 45.4], [44.35, D0 + 1.8, 50.0], pushK(f, 404, 0.002, 0.006, 16), { fov: 52 });
const C4 = (f: number) => dolly([42.65, D0 + 1.45, 40.0], [42.65, D0 + 1.65, 45.0], pushK(f, 452, 0.0015, 0.005, 20), { fov: 54 });
const C5 = (f: number) => dolly([42.75, D0 + 1.65, 39.4], [42.7, D0 + 1.6, 45.4], pushK(f, 497, 0.0016, 0.005, 16), { fov: 56 });
const C6 = (f: number) => dolly([43.6, D0 + 1.65, 38.0], [43.9, D0 + 1.3, 43.4], pushK(f, 583, 0.0016), { fov: 52, roll: 0.03 });
const C7 = (f: number) => dolly([46.2, D0 + 1.45, 40.6], [46.15, D0 + 1.25, 44.0], pushK(f, 690, 0.0018, 0.005, 16), { fov: 60 });
const C8 = (f: number) => dolly([60.35, D0 + 1.4, 32.1], [60.0, D0 + 1.0, 36.0], pushK(f, 772, 0.002, 0.006, 18), { fov: 46 });
const C9 = (f: number) => dolly([40.75, D0 + 0.95, 39.5], [40.15, D0 + 2.0, 44.2], pushK(f, 830, 0.0022), { fov: 54, roll: -0.04 });
const C10 = (f: number) => dolly([41.9, D0 + 2.4, 37.25], [41.45, D0 + 1.45, 44.0], pushK(f, 912, 0.0012, 0.006, 16), { fov: 58 });
const C11 = (f: number) => dolly([41.6, D0 + 1.35, 30.4], [42.0, D0 + 1.55, 35.4], pushK(f, 1040, 0.0014), { fov: 50 });
const C12 = (f: number) => dolly([60.4, D0 + 1.45, 32.0], [60.0, D0 + 1.15, 36.0], pushK(f, 1112, 0.0014, 0.005, 16), { fov: 46 });
const C13 = (f: number) => dolly([70.8, D0 + 2.3, -62.2], [70.75, D0 + 0.7, -67.3], pushK(f, 1288, 0.0012), { fov: 50 });
const C14 = (f: number) => dolly(H(MGR14, [0.35, 1.6, -3.4]), H(MGR14, [0.1, 1.55, 0]), pushK(f, 1421, 0.0018, 0.005, 20), { fov: 44 });
const C15a = (f: number) => dolly([42.3, D0 + 1.3, 25.6], [42.0, D0 + 1.25, 33.6], pushK(f, 1557, 0.0016, 0.005, 18), { fov: 50 });
const C15b = (f: number) => dolly([45.0, D0 + 8.5, 14.0], [42.0, D0 + 3.0, 40.0], pushK(f, 1655, 0.0012), { fov: 50 });
const C16a = (f: number) => dolly([42.6, D0 + 1.6, 26.8], [42.0, D0 + 3.4, 34.0], pushK(f, 1703, 0.0014), { fov: 52 });
const C16b = (f: number) => dolly([44.0, D0 + 9.0, 13.5], [42.0, D0 + 4.6, 38.0], pushK(f, 1745, 0.0008), { fov: 52 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1 }], 2: [{ f: 140, s: C2a }, { f: 214, dur: 40, s: C2b }], 3: [{ f: 274, s: C3 }], 4: [{ f: 396, s: C4a }, { f: 403, dur: 16, s: C4b }, { f: 452, cut: true, s: C4 }],
  5: [{ f: 497, s: C5 }], 6: [{ f: 583, s: C6 }], 7: [{ f: 690, s: C7 }], 8: [{ f: 772, s: C8 }], 9: [{ f: 830, s: C9 }],
  10: [{ f: 912, s: C10 }], 11: [{ f: 1040, s: C11 }], 12: [{ f: 1112, s: C12 }], 13: [{ f: 1284, s: C13 }], 14: [{ f: 1417, s: C14 }],
  15: [{ f: 1557, s: C15a }, { f: 1655, dur: 40, s: C15b }], 16: [{ f: 1697, s: C16a }, { f: 1745, dur: 90, s: C16b }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T(254), 0.4], [T(419), 0.35], [T(COLLAPSE), 0.6], [T(1262), 0.35], [T(FENCE_AT), 0.5]];
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
  { f: 0, cInf: 13, focus: eyesAt(TL[3], 1.4) }, { f: 140, cInf: 0 }, { f: 216, dur: 30, cInf: 6, focus: () => EIGHT },
  { f: 274, cInf: 12, focus: eyesAt(BOSS3) }, { f: 396, cInf: 11, focus: eyesAt(MGR) }, { f: 452, cInf: 6, focus: eyesAt(TL[1]) }, { f: 497, cInf: 10, focus: eyesAt(TL[1]) },
  { f: 583, cInf: 6, focus: eyesAt(TL[1]) }, { f: 690, cInf: 13, focus: eyesAt(TL[0]) }, { f: 772, cInf: 11, focus: () => [60.0, D0 + 1.6, 35.9] },
  { f: 830, cInf: 9, focus: () => [TOWER[0], CY + 1.2, TOWER[2]] }, { f: 912, cInf: 5, focus: () => [42.2, D0 + 1.4, 42.5] },
  { f: 1040, cInf: 8, focus: () => [42.0, D0 + 1.6, 34.5] }, { f: 1112, cInf: 11, focus: () => [60.0, D0 + 1.8, 35.9] },
  { f: 1288, cInf: 9, focus: eyesAt(KIDP, 1.3) }, { f: 1421, cInf: 13, focus: eyesAt(MGR14) }, { f: 1557, cInf: 7, focus: () => [42.0, D0 + 1.6, 32.4] },
  { f: 1655, dur: 30, cInf: 0 }, { f: 1703, cInf: 6, focus: () => [42.0, D0 + 1.6, 32.2] }, { f: 1745, dur: 50, cInf: 0 },
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
