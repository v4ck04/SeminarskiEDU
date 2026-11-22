// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build; cravat?: string; trim?: string; plaid?: string; pin?: boolean;
  /** frame colour of glasses; leather jacket with an open collar + zip; shirt + tie (tie colour) */
  glasses?: string; zip?: boolean; tie?: string;
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

// ---- Vermont cast (Ronald Read) ----
/** Ronald Read: red flannel shirt (plaid), jeans, a green cap over white hair, a safety pin on his jacket */
export const READ: Outfit = { jacket: "#b04a3c", plaid: "#3a2228", pants: "#4f6a8f", boots: "#3b2c22", hat: "cap", cap: "#4d6b3c", hair: "#eeeae2", skin: "#f5d2b3", pin: true, buttons: "#e9e3d6" };
export const STRANGER: Outfit = { jacket: "#2f3a4a", pants: "#2b2f3a", boots: "#1f1a22", hat: "hair", hair: "#5a3b2a", buttons: "#c9ccd2", skin: SKINS[1] };
export const NURSE = (v = 0): Outfit => ({ jacket: v % 2 ? "#f4f4f2" : "#8fc2dc", pants: v % 2 ? "#3b3f52" : "#8fc2dc", boots: "#f4f1ea", hat: "hair", hair: ["#5a3b2a", "#2a2026", "#c99a5a"][v % 3], skin: SKINS[(v + 1) % 4], buttons: "#c9ccd2" });
/** modern townsfolk: jackets / hoodies, jeans, hair or caps, some dresses */
export const townie = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#c2913a", "#5d7a3a", "#2f5f6a", "#b5653f", "#7b5ac9", "#a8434f", "#3f8f84"];
  const o: Outfit = { jacket: coats[v % 8], pants: ["#4f6a8f", "#3b3f52", "#6b5a4a"][v % 3], boots: ["#f4f1ea", "#3a2a22", "#2a2230"][v % 3], skin: SKINS[v % 4] };
  if (v % 4 === 1) return { ...o, hat: "hair", hair: ["#5a3b2a", "#c99a5a", "#2a2026", "#a0522d"][(v >> 2) % 4], dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#8fb65a"][(v >> 2) % 4] };
  if (v % 4 === 3) return { ...o, hat: "cap", cap: ["#e2453c", "#2f5f6a", "#f2c94c"][(v >> 2) % 3] };
  return { ...o, hat: "hair", hair: ["#3a2a22", "#7a5230", "#1f1a22", "#b5b0a8"][(v >> 1) % 4] };
};

// ---- Nvidia cast (2026) ----
/** the CEO as a cartoon: silver swept-back hair, dark-framed glasses, black leather jacket over a black tee */
export const JENSEN: Outfit = { jacket: "#2e2c34", pants: "#232229", boots: "#18171c", hat: "hair", hair: "#c4c7ce", skin: "#f3c9a2", glasses: "#1c1a20", zip: true };
/** 1993: dark hair, glasses, a blue sweater */
export const JENSEN_YOUNG: Outfit = { jacket: "#3f6f9a", pants: "#4f5a6a", boots: "#3a2a22", hat: "hair", hair: "#1f1a22", skin: "#f3c9a2", glasses: "#1c1a20", buttons: "#3f6f9a" };
export const FOUNDER = (v = 0): Outfit => v % 2
  ? { jacket: "#8a5a3c", pants: "#3b3f52", boots: "#3a2a22", hat: "hair", hair: "#7a5230", skin: SKINS[0], moustache: "#6a4a30", buttons: "#8a5a3c" }
  : { jacket: "#5d7a3a", pants: "#4f6a8f", boots: "#2a2230", hat: "hair", hair: "#3a2a22", skin: SKINS[2], glasses: "#4a3b2a", buttons: "#5d7a3a" };
/** board members: dark suits, white shirts, ties */
export const BOARD = (v = 0): Outfit => {
  const suits = ["#4a5a75", "#5a5f6e", "#3f5a8a", "#6a6070", "#4a6070"], ties = ["#a8434f", "#3f6fb5", "#c2913a", "#5d7a3a", "#7b5ac9"];
  const o: Outfit = { jacket: suits[v % 5], pants: suits[v % 5], boots: "#1f1a22", skin: SKINS[v % 4], tie: ties[v % 5] };
  if (v % 3 === 1) return { ...o, hat: "hair", hair: ["#5a3b2a", "#2a2026", "#c99a5a"][v % 3], dress: suits[v % 5], tie: undefined, cravat: "#f4f4f2" };
  return { ...o, hat: "hair", hair: ["#b5b0a8", "#3a2a22", "#7a5230", "#1f1a22", "#d8d4cc"][v % 5], glasses: v % 2 ? "#3a3440" : undefined };
};
/** the viewer: an orange hoodie (the channel's colour), jeans */
export const YOU: Outfit = { jacket: "#f08a2c", pants: "#4f6a8f", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", skin: SKINS[0], buttons: "#f08a2c" };

// ---- 1720 London cast ----
/** Isaac Newton at 77: long white periwig, dark plum coat, white cravat, gold buttons */
export const NEWTON: Outfit = { jacket: "#4a3b63", pants: "#33303f", boots: "#2a2230", hat: "wig", hair: "#ddd6c8", cravat: "#fbf8f2", buttons: "#e2c069", skin: "#ffe0c4" };
/** the Chancellor (John Aislabie): stout, brown wig, wine coat with gold trim */
export const AISLABIE: Outfit = { jacket: "#8a2f45", pants: "#3a2f3a", boots: "#2a2230", hat: "wig", hair: "#b98a5a", cravat: "#fbf8f2", buttons: "#e8c45a", trim: "#e8c45a", build: "stout", skin: "#f5c9a0" };
/** Yeoman warder: red coat, black tricorn, pike */
export const GUARD: Outfit = { jacket: "#c23b3b", pants: "#2c2a35", boots: INK, hat: "tricorn", buttons: "#e8c45a", belt: "#e8c45a", rifle: true, moustache: "#4a3020" };
/** investors of 1720: tricorns over bright coats with cravats; ladies in bonnets */
export const investor = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#b5653f", "#5d7a3a", "#2f5f6a", "#c2913a", "#7b5ac9", "#a8434f", "#3f8f84"];
  const o: Outfit = { jacket: coats[v % 8], pants: ["#3b3f52", "#5a4636", "#2f3a4a"][v % 3], boots: "#3a2a22", skin: SKINS[v % 4], cravat: "#f6f1e6", buttons: "#e2c069" };
  if (v % 4 === 1) return { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#8fb65a"][(v >> 2) % 4], cravat: undefined };
  if (v % 4 === 3) return { ...o, hat: "wig", hair: ["#f1ece2", "#d8c39c", "#9a7350"][(v >> 2) % 3] };
  return { ...o, hat: "tricorn", moustache: v % 3 === 2 ? "#4a3426" : undefined };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick" | "sad";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
  sad: { eye: ["lid", "lid"], brow: [-4, 3], mouth: "frown" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, glasses?: string) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  if (glasses) {
    // rectangular dark frames: two rounded lenses, a bridge, temples running to the sides of the head
    const lw = 15 * u, lh = 10.5 * u, gy = ey - 1 * u;
    for (const side of [-1, 1]) {
      const x = fx + side * ex, lens = rrect(x - lw, gy - lh, x + lw, gy + lh, 5 * u);
      const g = p.g; g.save(); g.globalAlpha = 0.16; p.poly(lens, "#ffffff", 0); g.restore();
      p.poly(lens, null, 0); p.stroke([...lens, lens[0]], 3.6 * u, glasses);
      p.stroke([[x + side * lw, gy - 3 * u], [cx + side * 47 * u, gy - 5 * u]], 3 * u, glasses);
    }
    p.stroke([[fx - ex + lw, gy - 2 * u], [fx, gy - 4 * u], [fx + ex - lw, gy - 2 * u]], 3 * u, glasses);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "wig") {
    // full-bottomed periwig: a curly mass behind the head that falls past the chin onto the shoulders
    const col = o.hair ?? "#f1ece2", dark = mul(col, [0.8, 0.8, 0.88]);
    const curl = (x: number, y: number, r: number) => { const c = ellPts(x, y, r, r * 1.08); p.shadedFill(c, col, dark, light, r, 0.35); p.inkRing(c, ow * 0.7, thick, 0.4); };
    const cols = side ? [cx - 0.62 * H.a] : [cx - 0.98 * H.a, cx + 0.98 * H.a];
    const back = blobPts(cx - (side ? 0.35 * H.a : 0), hc + 0.45 * H.b, { ...H, a: H.a * (side ? 0.95 : 1.12), b: H.b * 1.35, asym: 0, egg: -0.05, seed: H.seed + 5 });
    p.shadedFill(back, col, dark, light, H.a * 1.1); p.inkRing(back, ow * 0.85, thick);
    for (const x of cols) for (let k = 0; k < 4; k++) curl(x + (k % 2 ? 0.06 : -0.04) * H.a * (x < cx ? -1 : 1), hc - 0.15 * H.b + k * 0.5 * H.b, 0.34 * H.a);
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "tricorn") {
    // three-cornered hat: two upturned side wings meeting at a front point, gold edging
    const yb = crown + 0.2 * HH, col = "#2a2533", gold = o.trim ?? "#c9a24e";
    let shape: P2[];
    if (side) {
      shape = R([...curve([cx - 0.58 * W, yb - 0.14 * HH], [cx - 0.1 * W, yb - 0.5 * HH], [cx + 0.6 * W, yb - 0.02 * HH], 14),
        ...curve([cx + 0.6 * W, yb - 0.02 * HH], [cx + 0.05 * W, yb + 0.1 * HH], [cx - 0.58 * W, yb - 0.14 * HH], 10)]);
    } else {
      const f = 5 * u * facing;
      shape = R([...curve([cx - 0.66 * W, yb - 0.1 * HH], [cx + f, yb - 0.56 * HH], [cx + 0.66 * W, yb - 0.1 * HH], 16),
        ...curve([cx + 0.66 * W, yb - 0.1 * HH], [cx + 0.3 * W + f, yb + 0.02 * HH], [cx + f, yb + 0.1 * HH], 6),
        ...curve([cx + f, yb + 0.1 * HH], [cx - 0.3 * W + f, yb + 0.02 * HH], [cx - 0.66 * W, yb - 0.1 * HH], 6)]);
    }
    p.shadedFill(shape, col, mul(col, SH_FELT), light, 0.6 * W, 0.4);
    p.clip(shape, () => {
      const edge = side ? R(curve([cx + 0.6 * W, yb - 0.02 * HH], [cx + 0.05 * W, yb + 0.1 * HH], [cx - 0.58 * W, yb - 0.14 * HH], 10))
        : R([...curve([cx + 0.66 * W, yb - 0.1 * HH], [cx + 0.3 * W, yb + 0.02 * HH], [cx, yb + 0.1 * HH], 6), ...curve([cx, yb + 0.1 * HH], [cx - 0.3 * W, yb + 0.02 * HH], [cx - 0.66 * W, yb - 0.1 * HH], 6)]);
      p.stroke(edge, 7 * u, gold);
    });
    p.poly(shape, null, ow);
  } else if (o.hat === "cap" || o.hat === "hair" || o.hat === "wig") {
    const cut = crown + (o.hat === "cap" ? 0.3 : o.hat === "wig" ? 0.34 : 0.42) * HH;
    const keep = (x: number, y: number) => y < cut || (side && o.hat !== "cap" && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair" || o.hat === "wig") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "wig") { // centre parting + rolled curls at the temples
      const s = side ? -1 : 0;
      p.stroke([[cx + s * 20 * u, crown + 4 * u], [cx + s * 22 * u, cut - 14 * u]], 1.4 * u);
      if (!side) for (const k of [-1, 1]) p.arc(cx + k * 28 * u, cut - 10 * u, 13 * u, 7 * u, 200, 340, 1.4 * u);
    }
    if (o.hat === "hair") {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number] | "bag" | "bags" | "paper" | "coin" | "pockets" | "news" | "mop" | "nozzle" | "money" | "magnifier" | "phone";

/** money sack hanging from a hand at (hx, hy): tied neck, coin badge (no text) */
export const drawBag = (p: Pen, hx: number, hy: number, u: number, light = DEF_LIGHT, k = 1) => {
  const B: Blob = { a: 24 * u * k, b: 27 * u * k, nTop: 2.1, nBot: 2.5, egg: 0.28, asym: 0, rot: 0, noise: 0.01, seed: 31 };
  const pts = blobPts(hx, hy + 33 * u * k, B);
  p.shadedFill(pts, "#d2ab6c", "#a07a4a", light, 26 * u * k, 0.4);
  p.inkRing(pts, 4 * u, thickAngle(light));
  p.poly([[hx - 9 * u * k, hy + 9 * u * k], [hx + 9 * u * k, hy + 9 * u * k], [hx + 5 * u * k, hy - 2 * u * k], [hx - 5 * u * k, hy - 2 * u * k]], "#c79d5e", 3 * u);
  p.band([[hx - 11 * u * k, hy + 9 * u * k], [hx + 11 * u * k, hy + 9 * u * k]], "#8a5a34", 3 * u * k, 1.2 * u);
  p.ell(hx, hy + 36 * u * k, 9 * u * k, 9 * u * k, "#f2c94c", 2.4 * u);
  p.ell(hx, hy + 36 * u * k, 5 * u * k, 5 * u * k, null, 1.4 * u);
  p.dot(hx, hy, 5.5 * u);
};
/** share certificate held at (hx, hy): cream sheet, ruled lines, red wax seal (no text) */
export const drawPaper = (p: Pen, hx: number, hy: number, u: number, ang = -0.15) => {
  const pts = rotPts([[hx - 18 * u, hy - 50 * u], [hx + 18 * u, hy - 50 * u], [hx + 18 * u, hy + 2 * u], [hx - 18 * u, hy + 2 * u]], ang, hx, hy);
  p.poly(pts, "#f8f1dc", 3 * u);
  p.clip(pts, () => {
    for (let i = 0; i < 4; i++) p.stroke(rotPts([[hx - 12 * u, hy - 40 * u + i * 8 * u], [hx + (i === 3 ? 2 : 12) * u, hy - 40 * u + i * 8 * u]], ang, hx, hy), 1.6 * u, "#9a8f7a");
    const [sx, sy] = rotPts([[hx + 9 * u, hy - 7 * u]], ang, hx, hy)[0];
    p.ell(sx, sy, 6 * u, 6 * u, "#c8323a", 1.2 * u);
  });
  p.dot(hx, hy, 5.5 * u);
};

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave,
    light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    if (prop === "pockets") {
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.2 * T.a + 6 * u), sh(side)[1] + 0.42 * HH], [tcx + side * (1.12 * T.a + 8 * u), torsoBot + 0.04 * HH]], front: true });
    } else arms.push({ pts: prop === "shako" || prop === "bags" ? hang(-1, 0) : hang(-1, -sw), front: prop === "bags" });
    if (prop === "news") { arms.pop(); for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.05 * T.a + 4 * u), sh(side)[1] + 0.36 * HH], [tcx + side * 0.62 * T.a, chin + 0.62 * HH]], front: true }); }
    else if (prop === "mop") { const S = sh(1), k = wave ?? 0; arms.push({ pts: [S, [tcx + 1.1 * T.a + 6 * u, S[1] + 0.3 * HH], [tcx + 0.95 * T.a + 10 * u + 10 * u * k, chin + 0.72 * HH]], front: true }); }
    else if (prop === "nozzle" || prop === "money") { const S = sh(1); arms.push({ pts: [S, [tcx + 1.2 * T.a + 12 * u, S[1] + 0.2 * HH], [tcx + 1.45 * T.a + 26 * u, S[1] + 0.32 * HH]], front: true }); }
    else if (prop === "pockets") { /* both arms placed above */ }
    else if (prop === "bag" || prop === "bags") arms.push({ pts: hang(1, 0), front: true });
    else if (prop === "coin" || prop === "magnifier" || prop === "phone") { const S = sh(1); arms.push({ pts: [S, [tcx + 1.12 * T.a + 6 * u, S[1] + 0.18 * HH], [tcx + 0.95 * T.a + 6 * u, S[1] - 0.32 * HH]], front: true }); }
    else if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (prop === "icecream") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit") {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (dress) {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(300, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(sp, ow * 0.9, thick);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      if (o.plaid) {
        const g = p.g; g.save(); g.globalAlpha = 0.32;
        for (let x = tcx - 1.2 * T.a; x < tcx + 1.2 * T.a; x += 17 * u) p.stroke([[x, chin - 0.2 * HH], [x, torsoBot + 0.1 * HH]], 6 * u, o.plaid);
        for (let y = chin; y < torsoBot + 0.1 * HH; y += 17 * u) p.stroke([[tcx - 1.3 * T.a, y], [tcx + 1.3 * T.a, y]], 6 * u, o.plaid);
        g.globalAlpha = 0.18;
        for (let x = tcx - 1.2 * T.a + 8 * u; x < tcx + 1.2 * T.a; x += 17 * u) p.stroke([[x, chin - 0.2 * HH], [x, torsoBot + 0.1 * HH]], 1.6 * u, "#ffe9c8");
        g.restore();
      }
      if (o.pin) {
        const px = tcx - 0.42 * T.a, py = chin + 0.36 * HH;
        p.stroke([[px - 9 * u, py - 4 * u], [px + 11 * u, py + 3 * u]], 2.4 * u, "#cfd6de");
        p.stroke([[px - 9 * u, py - 1 * u], [px + 11 * u, py + 6 * u]], 2.4 * u, "#cfd6de");
        p.ell(px - 10 * u, py - 2.5 * u, 3 * u, 3 * u, null, 1.6 * u);
        p.ell(px + 12 * u, py + 4.5 * u, 3.6 * u, 3.2 * u, "#cfd6de", 1.4 * u);
      }
      if (o.trim) for (const s2 of [-1, 1]) p.band([[tcx + s2 * 0.12 * T.a, chin], [tcx + s2 * 0.2 * T.a, torsoBot + 0.05 * HH]], o.trim, 3.5 * u, 1 * u);
      if (o.cravat) {
        const cx2 = tcx + 2 * u * facing;
        p.poly([[cx2 - 9 * u, chin - 0.02 * HH], [cx2 + 9 * u, chin - 0.02 * HH], [cx2 + 6 * u, chin + 0.2 * HH], [cx2, chin + 0.27 * HH], [cx2 - 6 * u, chin + 0.2 * HH]], o.cravat, 2.4 * u);
        p.stroke([[cx2 - 4 * u, chin + 0.06 * HH], [cx2 - 2 * u, chin + 0.22 * HH]], 1.2 * u, "#c9c2b4");
      }
      if (o.zip) {
        // open collar over a black tee, a zip down the front, glossy leather highlights on the lit side
        const vx = tcx + 2 * u * facing;
        p.poly([[vx - 15 * u, chin - 0.06 * HH], [vx + 15 * u, chin - 0.06 * HH], [vx + 2 * u, chin + 0.3 * HH]], "#141317", 0);
        for (const sd of [-1, 1]) p.poly([[vx + sd * 15 * u, chin - 0.08 * HH], [vx + sd * 30 * u, chin - 0.02 * HH], [vx + sd * 22 * u, chin + 0.2 * HH], [vx + sd * 3 * u, chin + 0.3 * HH]], "#3a3842", 2.4 * u);
        p.stroke([[vx + 3 * u, chin + 0.3 * HH], [vx + 4 * u, torsoBot + 0.1 * HH]], 2.6 * u, "#9aa0a8");
        const g = p.g; g.save(); g.globalAlpha = 0.28;
        const lx = tcx + Math.cos(light) * 0.45 * T.a, ly = tcy + Math.sin(light) * 0.3 * T.b;
        p.stroke(curve([lx - 6 * u, ly - 0.3 * HH], [lx + 4 * u, ly], [lx - 2 * u, ly + 0.35 * HH]), 5 * u, "#ffffff");
        p.stroke(curve([lx + 9 * u, ly - 0.2 * HH], [lx + 15 * u, ly + 0.05 * HH], [lx + 10 * u, ly + 0.25 * HH]), 2.6 * u, "#ffffff");
        g.restore();
      }
      if (o.tie) {
        const vx = tcx + 2 * u * facing;
        p.poly([[vx - 14 * u, chin - 0.06 * HH], [vx + 14 * u, chin - 0.06 * HH], [vx, chin + 0.42 * HH]], "#f4f4f2", 2 * u);
        p.poly([[vx - 4 * u, chin - 0.02 * HH], [vx + 4 * u, chin - 0.02 * HH], [vx + 6 * u, chin + 0.3 * HH], [vx, chin + 0.38 * HH], [vx - 6 * u, chin + 0.3 * HH]], o.tie, 1.8 * u);
        for (const sd of [-1, 1]) p.stroke([[vx + sd * 14 * u, chin - 0.06 * HH], [vx + sd * 2 * u, chin + 0.44 * HH]], 2.4 * u, mul(o.jacket, [0.7, 0.7, 0.75]));
      }
      if (!o.zip) for (let i = o.tie ? 2 : 0; i < (o.tie ? 4 : 4); i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop)) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "news") {
    const x0 = tcx - 0.95 * T.a, x1 = tcx + 0.95 * T.a, y0 = chin + 0.3 * HH, y1 = chin + 0.98 * HH;
    p.poly([[x0, y0], [x1, y0 - 3 * u], [x1, y1 - 3 * u], [x0, y1]], "#ecebe4", 3 * u);
    p.poly([[x0 + 6 * u, y0 + 5 * u], [x1 - 6 * u, y0 + 2 * u], [x1 - 6 * u, y0 + 14 * u], [x0 + 6 * u, y0 + 17 * u]], "#2a2630", 0);
    p.poly([[x0 + 7 * u, y0 + 22 * u], [tcx - 2 * u, y0 + 21 * u], [tcx - 2 * u, y0 + 44 * u], [x0 + 7 * u, y0 + 45 * u]], "#9aa3ad", 1.5 * u);
    for (let i = 0; i < 6; i++) p.stroke([[tcx + 3 * u, y0 + 24 * u + i * 7 * u], [x1 - 7 * u, y0 + 23 * u + i * 7 * u]], 2 * u, "#8a8790");
    for (let i = 0; i < 3; i++) p.stroke([[x0 + 7 * u, y0 + 52 * u + i * 7 * u], [x1 - 7 * u, y0 + 50 * u + i * 7 * u]], 2 * u, "#8a8790");
    for (const a of arms) p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
  }
  if (prop === "mop") {
    const a = arms[arms.length - 1], [hx, hy] = a.pts[2], bx = hx + 22 * u + 14 * u * (wave ?? 0), by = sole - 12 * u;
    p.band([[hx - 6 * u, hy - 30 * u], [bx, by]], "#c9a26a", 4 * u, 1.4 * u, "round");
    for (let i = -4; i <= 4; i++) p.stroke([[bx + i * 3 * u, by - 4 * u], [bx + i * 5 * u + 4 * u * (wave ?? 0), sole + 2 * u]], 3.2 * u, "#e9e3cf");
    p.ell(bx, by - 3 * u, 10 * u, 4 * u, "#9a8f7a", 1.4 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "nozzle") {
    const a = arms[arms.length - 1], [hx, hy] = a.pts[2];
    p.stroke(curve([hx - 4 * u, hy + 6 * u], [hx - 30 * u, hy + 70 * u], [hx - 70 * u, sole - 40 * u]), 4 * u, "#1f1a22");
    p.poly([[hx - 6 * u, hy - 6 * u], [hx + 18 * u, hy - 8 * u], [hx + 26 * u, hy - 2 * u], [hx + 18 * u, hy + 4 * u], [hx - 4 * u, hy + 8 * u]], "#2a2630", 2 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "money") {
    const a = arms[arms.length - 1], [hx, hy] = a.pts[2];
    p.poly([[hx - 2 * u, hy - 14 * u], [hx + 34 * u, hy - 18 * u], [hx + 36 * u, hy + 2 * u], [hx, hy + 6 * u]], "#9fd18a", 2.4 * u);
    p.ell(hx + 17 * u, hy - 6 * u, 6 * u, 7 * u, null, 1.4 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "bag" || prop === "bags") for (const a of arms) if (a.front) drawBag(p, a.pts[2][0], a.pts[2][1], u, light);
  if (prop === "paper" && wave !== undefined) { const a = arms[arms.length - 1]; drawPaper(p, a.pts[2][0], a.pts[2][1], u, -0.25 + 0.3 * wave); }
  if (prop === "magnifier") {
    const a = arms[arms.length - 1], [hx, hy] = a.pts[2];
    p.band([[hx, hy + 4 * u], [hx - 6 * u, hy - 16 * u]], "#5a3b2a", 5 * u, 1.4 * u, "round");
    const g = p.g; p.ell(hx - 10 * u, hy - 32 * u, 17 * u, 17 * u, "#cfe8f5", 4 * u); g.save(); g.globalAlpha = 0.6; p.arc(hx - 14 * u, hy - 36 * u, 9 * u, 9 * u, 200, 290, 3 * u, "#ffffff"); g.restore();
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "phone") {
    const a = arms[arms.length - 1], [hx, hy] = a.pts[2];
    p.poly(rrect(hx - 9 * u, hy - 30 * u, hx + 9 * u, hy + 2 * u, 3 * u), "#2a2630", 2 * u);
    p.poly(rrect(hx - 6.5 * u, hy - 27 * u, hx + 6.5 * u, hy - 2 * u, 2 * u), "#8fd0ff", 0);
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "coin") { const a = arms[arms.length - 1], [hx, hy] = a.pts[2]; p.ell(hx, hy - 14 * u, 13 * u, 13 * u, "#f2c94c", 3 * u); p.ell(hx, hy - 14 * u, 8 * u, 8 * u, null, 1.6 * u); p.dot(hx, hy, 5.5 * u); }
  if (prop === "pockets") for (const a of arms) {
    const [hx, hy] = a.pts[2], sd = hx < tcx ? -1 : 1, ex = tcx + sd * 0.78 * T.a;
    // the lining comes out of a slit at the coat's side and is pulled out to the hand: a limp white flap
    p.poly([[ex, torsoBot - 0.26 * HH], [ex + sd * 2 * u, torsoBot - 0.08 * HH], [hx + sd * 4 * u, hy + 16 * u], [hx - sd * 8 * u, hy + 20 * u], [hx - sd * 6 * u, hy - 2 * u]], "#f7f3ea", 3 * u);
    p.stroke([[ex + sd * 3 * u, torsoBot - 0.18 * HH], [hx - sd * 2 * u, hy + 10 * u]], 1.4 * u, "#c9c2b4");
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (o.hat === "cap" && o.hair) for (const sd of [-1, 1]) { const tp = ellPts(300 + sd * 0.92 * H.a, hc - 0.18 * H.b, 0.16 * H.a, 0.24 * H.b); p.shadedFill(tp, o.hair, mul(o.hair, SH_FELT), light, 0.2 * H.a); p.inkRing(tp, ow * 0.6, thick); }
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "wig";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout", o.glasses);
  p.rot = null;
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (o.cravat) p.poly([[tcx + 0.55 * T.a, chin - 0.02 * HH], [tcx + 1.05 * T.a, chin + 0.04 * HH], [tcx + 0.95 * T.a, chin + 0.26 * HH], [tcx + 0.6 * T.a, chin + 0.2 * HH]], o.cravat, 2.4 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "wig";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

// ---------------- 1720 effects ----------------
/** red apple with a leaf on a 200 x 200 canvas */
export const fxApple = (p: Pen) => {
  const pts = blobPts(100, 112, { a: 70, b: 64, nTop: 2.0, nBot: 2.3, egg: -0.1, asym: 0.03, rot: 0.1, noise: 0.012, seed: 4 });
  p.shadedFill(pts, "#e2453c", "#a52b35", rad(-130), 70, 0.4);
  p.inkRing(pts, 9, rad(60));
  p.arc(78, 80, 18, 12, 200, 300, 6, "#ff9d8a");
  p.stroke([[100, 52], [106, 24]], 8);
  p.poly([[106, 34], [140, 18], [158, 30], [124, 46]], "#5aa83c", 6);
};
/** gold coin on a 200 x 200 canvas; spin 0..1 squashes it edge-on */
export const fxCoin = (p: Pen, spin: number) => {
  const sx = Math.max(0.12, Math.abs(Math.cos(spin * Math.PI)));
  p.ell(100, 100, 80 * sx, 80, "#f2c94c", 9);
  if (sx > 0.35) { p.ell(100, 100, 52 * sx, 52, null, 5); p.ell(100, 100, 20 * sx, 20, "#e0b23a", 4); }
  if (sx > 0.5) p.arc(100, 100, 66 * sx, 66, 200, 260, 6, "#fff2b0");
};
/** flying money sack on a 300 x 300 canvas */
export const fxBag = (p: Pen) => drawBag(p, 150, 70, 3.2);
/** share certificate on a 220 x 280 canvas (no text): sheet, ruled lines, red seal */
export const fxPaper = (p: Pen, curl: number) => {
  const c = 18 * curl;
  p.poly([[20, 20 + c], [200, 20 - c], [200, 260 - c], [20, 260 + c]], "#f8f1dc", 7);
  for (let i = 0; i < 6; i++) p.stroke([[44, 62 + i * 26 + c * 0.6], [i === 5 ? 120 : 176, 62 + i * 26 - c * 0.6]], 6, "#9a8f7a");
  p.ell(160, 222 - c, 22, 22, "#c8323a", 5);
};
/** red and white ball on a 200 x 200 canvas */
export const fxBall = (p: Pen, spin: number) => {
  p.ell(100, 100, 82, 82, "#f4efe4", 9);
  p.clip(ellPts(100, 100, 82, 82), () => {
    const a = spin * Math.PI * 2;
    for (const k of [0, 1]) {
      const b = a + k * Math.PI;
      p.poly([[100, 100], [100 + 140 * Math.cos(b - 0.55), 100 + 140 * Math.sin(b - 0.55)], [100 + 140 * Math.cos(b + 0.55), 100 + 140 * Math.sin(b + 0.55)]], "#e2453c", 0);
    }
  });
  p.ell(100, 100, 82, 82, null, 9);
  p.arc(78, 74, 30, 20, 200, 290, 8, "#ffffff");
};
/** small grey moth on a 240 x 160 canvas; flap 0..1 */
export const fxMoth = (p: Pen, flap: number) => {
  const h = 30 + 40 * Math.abs(Math.sin(flap * Math.PI));
  for (const s of [-1, 1]) p.poly([[120, 86], [120 + s * 100, 86 - h], [120 + s * 86, 96], [120 + s * 40, 120]], "#b8ad9c", 6);
  p.ell(120, 92, 14, 30, "#7d7266", 6);
  p.stroke([[114, 64], [100, 40]], 4); p.stroke([[126, 64], [140, 40]], 4);
};
/** cartoon "bonk" ring of short lines on a 400 x 400 canvas; t 0..1 */
export const fxBonk = (p: Pen, t: number) => {
  const e = 1 - (1 - t) ** 2;
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45 + 22), r0 = 60 + 90 * e, r1 = r0 + 50 * (1 - t);
    p.stroke([[200 + r0 * Math.cos(a), 200 + r0 * Math.sin(a)], [200 + r1 * Math.cos(a), 200 + r1 * Math.sin(a)]], 12 * (1 - t) + 3);
  }
};
/** soap-bubble pop on a 600 x 600 canvas; t 0..1: a broken iridescent ring, droplets flying out, thin white streaks */
export const fxPop = (p: Pen, t: number) => {
  const c = 300, e = 1 - (1 - t) ** 2.2, R = 205 + 70 * e, fade = 1 - t;
  const g = p.g;
  g.lineCap = "round";
  if (t < 0.55) for (let i = 0; i < 9; i++) { // ring shards
    const a0 = (i / 9) * Math.PI * 2 + 0.2, a1 = a0 + 0.42 * (1 - t * 1.4);
    g.beginPath(); g.arc(c, c, R, a0, a1);
    g.strokeStyle = `hsla(${(i * 40) % 360},85%,78%,${fade})`; g.lineWidth = 16 * (1 - t); g.stroke();
  }
  for (let i = 0; i < 22; i++) { // droplets
    const a = (i / 22) * Math.PI * 2 + 0.13 * (i % 3), d = R * (0.9 + 0.5 * e * (0.6 + 0.4 * ((i * 7) % 5) / 4)), r = (9 + (i % 4) * 3) * (1 - 0.6 * t);
    p.ell(c + d * Math.cos(a), c + d * Math.sin(a), r, r, "#dff3ff", 3 * fade + 1);
  }
  for (let i = 0; i < 12; i++) { // streaks
    const a = (i / 12) * Math.PI * 2 + 0.26, r0 = R * (0.75 + 0.35 * e), r1 = r0 + 60 * (1 - t);
    p.stroke([[c + r0 * Math.cos(a), c + r0 * Math.sin(a)], [c + r1 * Math.cos(a), c + r1 * Math.sin(a)]], 7 * fade + 1, "#ffffff");
  }
};

// ---------------- Vermont effects ----------------
/** green banknote on a 300 x 150 canvas (no text) */
export const fxBill = (p: Pen) => {
  p.poly(rrect(10, 10, 290, 140, 10), "#9fd18a", 7);
  p.poly(rrect(26, 24, 274, 126, 6), null, 3);
  p.ell(150, 75, 34, 40, "#c8e8b4", 4);
  for (const x of [56, 244]) p.ell(x, 75, 14, 14, "#7fb86a", 3);
};
/** soap pump bottle with bubbles on a 240 x 300 canvas */
export const fxSoap = (p: Pen) => {
  p.poly(rrect(60, 110, 180, 286, 26), "#7fd4e0", 8);
  p.poly(rrect(98, 70, 142, 112, 6), "#f4f1ea", 7);
  p.poly([[110, 70], [110, 40], [176, 40], [176, 56], [130, 56], [130, 70]], "#f4f1ea", 7);
  p.poly(rrect(78, 160, 162, 236, 12), "#f4f1ea", 5);
  for (const [x, y, r] of [[196, 120, 18], [214, 80, 12], [40, 140, 14]] as const) p.ell(x, y, r, r, "#e6f8ff", 5);
};
/** medicine capsule on a 300 x 160 canvas */
export const fxPill = (p: Pen) => {
  p.clip(rrect(20, 30, 280, 130, 50), () => { p.poly([[0, 0], [150, 0], [150, 160], [0, 160]], "#e2453c", 0); p.poly([[150, 0], [300, 0], [300, 160], [150, 160]], "#f4f1ea", 0); });
  p.poly(rrect(20, 30, 280, 130, 50), null, 9);
  p.stroke([[150, 32], [150, 128]], 6);
  p.arc(80, 62, 40, 14, 200, 330, 7, "#ff9d8a");
};
/** light bulb with rays on a 260 x 300 canvas */
export const fxBulb = (p: Pen) => {
  for (let i = 0; i < 7; i++) { const a = rad(-180 + i * 30); p.stroke([[130 + 100 * Math.cos(a), 120 + 100 * Math.sin(a)], [130 + 124 * Math.cos(a), 120 + 124 * Math.sin(a)]], 9, "#f2c94c"); }
  p.ell(130, 120, 70, 72, "#ffe27a", 8);
  p.poly(rrect(98, 186, 162, 252, 8), "#b9c0c8", 7);
  for (const y of [206, 226]) p.stroke([[100, y], [160, y]], 5);
  p.arc(108, 100, 30, 34, 200, 280, 8, "#fff6c8");
};
/** a scratch-style lottery ticket (circles, no text) crossed out with a red X, on a 300 x 220 canvas */
export const fxTicket = (p: Pen) => {
  p.poly(rrect(30, 40, 270, 180, 12), "#f6b8d0", 8);
  for (let i = 0; i < 6; i++) p.ell(70 + (i % 3) * 80, 82 + Math.floor(i / 3) * 58, 22, 22, "#fff4b0", 5);
  for (const [a, b] of [[[40, 30], [260, 196]], [[260, 30], [40, 196]]] as [[number, number], [number, number]][]) { p.stroke([a, b], 30, "#ffffff"); p.stroke([a, b], 20, "#d42f2f"); }
};
/** a generic crypto coin (circuit pattern, no logo) crossed out, on a 260 x 260 canvas */
export const fxCrypto = (p: Pen) => {
  p.ell(130, 130, 96, 96, "#f2b84c", 9);
  p.ell(130, 130, 70, 70, null, 5);
  for (const [x0, y0, x1, y1] of [[96, 100, 164, 100], [96, 130, 150, 130], [96, 160, 164, 160], [110, 86, 110, 174]]) p.stroke([[x0, y0], [x1, y1]], 8, "#8a5a1e");
  for (const [a, b] of [[[34, 34], [226, 226]], [[226, 34], [34, 226]]] as [[number, number], [number, number]][]) { p.stroke([a, b], 30, "#ffffff"); p.stroke([a, b], 20, "#d42f2f"); }
};
/** a stack of n stock certificates, side-on, on a 300 x 400 canvas (bottom aligned) */
export const fxStack = (p: Pen, n: number) => {
  for (let i = 0; i < n; i++) {
    const y = 388 - i * 9, dx = ((i * 37) % 9) - 4;
    p.poly(rrect(40 + dx, y - 10, 260 + dx, y, 3), i % 2 ? "#f8f1dc" : "#efe6c8", 3);
  }
  if (n > 2) p.ell(150, 388 - n * 9 + 2, 16, 6, "#c8323a", 3);
};
/** coffee mug and a muffin on a plate, on a 320 x 200 canvas */
export const fxBreakfast = (p: Pen) => {
  p.ell(200, 168, 100, 18, "#f4f1ea", 6);
  p.poly([[160, 160], [240, 160], [228, 124], [172, 124]], "#c9873a", 6);
  p.ell(200, 118, 34, 22, "#e0b46a", 6);
  p.poly(rrect(40, 70, 120, 168, 14), "#f4f1ea", 7);
  p.arc(128, 116, 18, 24, -80, 80, 9);
  p.ell(80, 74, 36, 8, "#5a3b2a", 4);
};
/** an autumn leaf on a 120 x 120 canvas; kind picks the colour */
export const fxLeaf = (p: Pen, kind: number) => {
  const col = ["#e07a2c", "#c84a2c", "#e8b23a", "#b5642f"][kind % 4], pts: P2[] = [];
  for (let i = 0; i < 10; i++) { const a = rad(-90 + i * 36), r = i % 2 ? 26 : 52; pts.push([60 + r * Math.cos(a), 58 + r * Math.sin(a)]); }
  p.poly(pts, col, 5);
  p.stroke([[60, 58], [60, 112]], 4);
};
/** the green cap lying on the bench, on a 260 x 140 canvas */
export const fxCapItem = (p: Pen) => {
  p.ell(120, 92, 92, 52, "#4d6b3c", 8, 180, 360);
  p.poly([[34, 92], [206, 92], [206, 104], [34, 104]], "#4d6b3c", 6);
  p.ell(214, 102, 46, 12, "#3e5830", 6);
  p.ell(120, 42, 8, 6, "#3e5830", 4);
};

// ---------------- Nvidia effects ----------------
/** bold label with an ink outline (Inter Display Black) */
const label = (p: Pen, s: string, x: number, y: number, size: number, fill: string, ow = size * 0.16, align: CanvasTextAlign = "center") => {
  const g = p.g; g.save();
  g.font = `900 ${size}px "Inter Display", Inter, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.lineJoin = "round";
  if (ow) { g.lineWidth = ow * 2; g.strokeStyle = INK; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y); g.restore();
};
/** a game controller on a 320 x 220 canvas */
export const fxGamepad = (p: Pen) => {
  const body: P2[] = [...curve([40, 150], [30, 50], [120, 60], 10), ...curve([120, 60], [160, 52], [200, 60], 6), ...curve([200, 60], [290, 50], [280, 150], 10),
    ...curve([280, 150], [270, 200], [220, 170], 8), ...curve([220, 170], [160, 150], [100, 170], 8), ...curve([100, 170], [50, 200], [40, 150], 8)];
  p.poly(body, "#5a5f73", 8);
  p.poly([[78, 96], [94, 96], [94, 80], [110, 80], [110, 96], [126, 96], [126, 112], [110, 112], [110, 128], [94, 128], [94, 112], [78, 112]], "#2a2630", 4);
  for (const [x, y, c] of [[222, 84, "#e2453c"], [246, 108, "#3f6fb5"], [198, 108, "#f2c94c"], [222, 132, "#5dbb63"]] as const) p.ell(x, y, 12, 12, c, 4);
};
/** a green AI chip (pins on four sides, "AI" on the die) on a 300 x 300 canvas */
export const fxChip = (p: Pen) => {
  for (let i = 0; i < 6; i++) {
    const t = 78 + i * 29;
    p.band([[t, 28], [t, 60]], "#c9ccd2", 9, 3); p.band([[t, 240], [t, 272]], "#c9ccd2", 9, 3);
    p.band([[28, t], [60, t]], "#c9ccd2", 9, 3); p.band([[240, t], [272, t]], "#c9ccd2", 9, 3);
  }
  p.poly(rrect(54, 54, 246, 246, 18), "#3d4048", 9);
  p.poly(rrect(84, 84, 216, 216, 10), "#76b900", 6);
  label(p, "AI", 150, 154, 92, "#ffffff", 9);
};
/** the staff email: a white card with a header bar and the quoted line, on a 640 x 420 canvas */
export const fxLetter = (p: Pen) => {
  p.poly(rrect(20, 20, 620, 400, 24), "#fbfaf6", 9);
  p.clip(rrect(20, 20, 620, 400, 24), () => p.poly([[0, 0], [640, 0], [640, 96], [0, 96]], "#2b3a55", 0));
  p.stroke([[20, 96], [620, 96]], 6);
  for (const [x, c] of [[62, "#e2453c"], [98, "#f2c94c"], [134, "#5dbb63"]] as const) p.ell(x, 58, 12, 12, c, 3);
  label(p, "To: All staff", 190, 58, 34, "#ffffff", 0, "left");
  label(p, "“I was unfaithful", 320, 196, 58, "#241726", 0);
  label(p, "to my wife.”", 320, 266, 58, "#241726", 0);
  for (let i = 0; i < 2; i++) p.stroke([[80, 330 + i * 30], [i ? 380 : 560, 330 + i * 30]], 9, "#c9c4b8");
};
/** a big question mark in a yellow disc, on a 300 x 300 canvas */
export const fxQuestion = (p: Pen) => {
  p.ell(150, 150, 120, 120, "#f2c94c", 10);
  label(p, "?", 150, 160, 200, "#ffffff", 14);
};
/** a red rubber stamp reading DENIED, tilted, on a 420 x 200 canvas */
export const fxDenied = (p: Pen) => {
  p.rot = [rad(-8), 210, 100];
  p.poly(rrect(24, 34, 396, 166, 18), "#ffffff", 0);
  p.poly(rrect(24, 34, 396, 166, 18), null, 0);
  p.stroke([...rrect(30, 40, 390, 160, 14), [376, 40]], 12, "#d42f2f");
  p.rot = null;
  const g = p.g; g.save(); g.translate(210, 100); g.rotate(rad(-8)); label(p, "DENIED", 0, 4, 92, "#d42f2f", 0); g.restore();
};
/** a closed padlock, on a 240 x 300 canvas */
export const fxLock = (p: Pen) => {
  p.arc(120, 120, 62, 70, 180, 360, 26, INK); p.arc(120, 120, 62, 70, 180, 360, 16, "#b9c0c8");
  p.poly(rrect(40, 120, 200, 272, 22), "#f2c94c", 9);
  p.ell(120, 186, 18, 18, INK, 0); p.poly([[112, 190], [128, 190], [132, 236], [108, 236]], INK, 0);
};
/** pie chart of the S&P 500 with Nvidia's ~7 % slice pulled out in green, on a 420 x 420 canvas; t = slice pull 0..1 */
export const fxPie = (p: Pen, t: number) => {
  const c = 210, r = 160, a0 = -90, a1 = -90 + 0.07 * 360;
  const cols = ["#3f6fb5", "#5a8fc2", "#2f5f6a", "#7b5ac9", "#3f8f84", "#c2913a", "#a8434f", "#5d7a3a"];
  let a = a1;
  for (let i = 0; i < 8; i++) { const b = a + (360 - (a1 - a0)) / 8; p.poly([[c, c], ...ellPts(c, c, r, r, a, b, 0, 12)], cols[i], 6); a = b; }
  const m = rad((a0 + a1) / 2), off = 34 * t;
  p.poly([[c + off * Math.cos(m), c + off * Math.sin(m)], ...ellPts(c + off * Math.cos(m), c + off * Math.sin(m), r * 1.04, r * 1.04, a0, a1, 0, 8)], "#76b900", 8);
  label(p, "7%", c + 112 * Math.cos(m) + 30, c + 96 * Math.sin(m) - 40, 64, "#ffffff", 9);
};
/** a coin stamped 7¢, on a 220 x 220 canvas */
export const fxCent = (p: Pen) => {
  p.ell(110, 110, 92, 92, "#d9a441", 9); p.ell(110, 110, 70, 70, null, 4);
  label(p, "7¢", 110, 116, 78, "#fff4c8", 7);
};
/** an index fund as a basket of many little coins, on a 320 x 260 canvas */
export const fxBasket = (p: Pen) => {
  for (let i = 0; i < 14; i++) p.ell(70 + (i % 7) * 30, 96 - Math.floor(i / 7) * 22 + (i % 2) * 6, 20, 20, ["#f2c94c", "#d9a441", "#9fd18a", "#76b900"][i % 4], 4);
  p.poly([[30, 110], [290, 110], [260, 240], [60, 240]], "#c9873a", 8);
  for (let i = 1; i < 6; i++) p.stroke([[30 + i * 43, 112], [60 + i * 33, 238]], 4);
  p.stroke([[44, 160], [276, 160]], 4); p.stroke([[52, 200], [268, 200]], 4);
};
/** yellow warning triangle, on a 300 x 270 canvas */
export const fxWarning = (p: Pen) => {
  p.poly([[150, 20], [282, 250], [18, 250]], "#f2c94c", 11);
  p.poly(rrect(136, 82, 164, 180, 12), INK, 0); p.ell(150, 214, 15, 15, INK, 0);
};
/** stock chart: a line that climbs, then falls off a cliff in red, on a 400 x 280 canvas; t = how much of the fall is drawn */
export const fxChart = (p: Pen, t: number) => {
  p.poly(rrect(14, 14, 386, 266, 20), "#16223a", 8);
  for (let i = 1; i < 4; i++) p.stroke([[40, 40 + i * 52], [360, 40 + i * 52]], 2, "#2f4060");
  const up: P2[] = [[44, 220], [100, 190], [150, 200], [200, 140], [250, 110], [290, 84]];
  p.stroke(up, 11, "#5dbb63");
  const fall: P2[] = [[290, 84], [312, 130], [330, 120], [356, 228]];
  const n = Math.max(1, Math.round(t * 3)), pts = fall.slice(0, n + 1);
  p.stroke(pts, 11, "#ff4d4d");
  const [ex, ey] = pts[pts.length - 1];
  if (t > 0.9) p.poly([[ex - 22, ey - 16], [ex + 14, ey - 22], [ex + 4, ey + 16]], "#ff4d4d", 4);
};
/** a stack of banknotes (the $40,000), on a 320 x 240 canvas */
export const fxCash = (p: Pen) => {
  for (let i = 0; i < 6; i++) { const y = 196 - i * 22, dx = ((i * 29) % 13) - 6; p.poly(rrect(40 + dx, y - 40, 280 + dx, y, 8), i % 2 ? "#9fd18a" : "#8cc477", 6); }
  p.ell(160 + 1, 196 - 5 * 22 - 20, 22, 14, "#c8e8b4", 4);
  p.poly([[150, 50], [170, 50], [170, 196], [150, 196]], "#e8d9a8", 3);
};
/** a little house, on a 240 x 240 canvas */
export const fxHouse = (p: Pen) => {
  p.poly([[40, 116], [120, 40], [200, 116]], "#c2463c", 8);
  p.poly([[60, 110], [180, 110], [180, 210], [60, 210]], "#f4f1ea", 8);
  p.poly([[104, 150], [136, 150], [136, 210], [104, 210]], "#8a5a3c", 6);
};
/** a globe, on a 240 x 240 canvas */
export const fxGlobe = (p: Pen) => {
  p.ell(120, 120, 96, 96, "#5a8fc2", 9);
  p.clip(ellPts(120, 120, 96, 96), () => {
    p.poly([[60, 60], [120, 50], [140, 90], [100, 120], [70, 110]], "#8fb65a", 0);
    p.poly([[130, 130], [190, 120], [200, 170], [150, 200]], "#8fb65a", 0);
  });
  p.ell(120, 120, 44, 96, null, 4); p.stroke([[24, 120], [216, 120]], 4);
};
