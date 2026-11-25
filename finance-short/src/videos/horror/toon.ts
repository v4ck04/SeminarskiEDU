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
  build?: Build; cravat?: string; trim?: string;
  /** leather jacket: open collar lapels, zip line, a glossy highlight; label: letters on the chest (FBI) */
  leather?: boolean; label?: string;
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
  skin: string, moustache?: string, stout = false) => {
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
  } else if (o.hat === "pith") {
    // colonial sun helmet: a white dome on a wide brim with a khaki band
    const yb = crown + 0.32 * HH, col = o.cap ?? "#f3efe2";
    const [bx, by] = R([[cx, yb]])[0];
    p.ell(bx, by, 0.8 * W, 0.075 * HH, col, ow, 0, 360, (a * 180) / Math.PI);
    const dome: P2[] = [];
    for (let i = 0; i <= 18; i++) { const t = (Math.PI * i) / 18; dome.push([cx - 0.53 * W * Math.cos(t), yb - 0.02 * HH - 0.46 * HH * Math.sin(t)]); }
    p.shadedFill(R(dome), col, mul(col, SH_FELT), light, 0.53 * W, 0.4);
    p.clip(R(dome), () => p.band(R([[cx - 0.6 * W, yb - 0.08 * HH], [cx + 0.6 * W, yb - 0.08 * HH]]), "#7a6440", 0.08 * HH, 0.8 * u));
    p.poly(R(dome), null, ow);
  } else if (o.hat === "nonla") {
    // Vietnamese conical hat
    const yb = crown + 0.26 * HH, col = o.cap ?? "#e2cb86";
    const cone = R([[cx - 0.95 * W, yb], [cx, crown - 0.4 * HH], [cx + 0.95 * W, yb], [cx, yb + 0.07 * HH]]);
    p.shadedFill(cone, col, mul(col, SH_FELT), light, 0.95 * W, 0.45);
    for (const k of [0.35, 0.62]) p.stroke(R([[cx - 0.95 * W * k, yb - 0.66 * HH * (1 - k) + 0.02 * HH * k], [cx + 0.95 * W * k, yb - 0.66 * HH * (1 - k) + 0.02 * HH * k]]), 1.6 * u, mul(col, [0.75, 0.7, 0.6]));
    p.poly(cone, null, ow);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number] | "bag" | "bags" | "paper" | "coin" | "pockets" | "rod" | ["fish", number] | "eat" | "rope" | ["basket", number, number] | ["gold", number]
  | ["stamp", number] | "box" | "slate" | "present";
/** fishing-rod tip and the rope's exit point in design units (the line / rope continue in the world from here) */
export const ROD_TIP: P2 = [585, 150];
export const ROPE_END: P2 = [598, 640];

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
  if (mode === "sit") for (const side of [-1, 1]) {
    const S = sh(side);
    if (side === 1 && prop === "eat") arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.42 * T.a, S[1] + 0.12 * HH]], front: true });
    else if (side === 1 && Array.isArray(prop) && (prop[0] === "fish" || prop[0] === "gold")) arms.push({ pts: [S, [tcx + 1.12 * T.a + 6 * u, S[1] + 0.18 * HH], [tcx + 0.95 * T.a + 6 * u, S[1] - 0.32 * HH]], front: true });
    else arms.push({ pts: [S, [tcx + side * (1.1 * T.a + 6 * u), S[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  }
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    if (prop === "pockets") {
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.2 * T.a + 6 * u), sh(side)[1] + 0.42 * HH], [tcx + side * (1.12 * T.a + 8 * u), torsoBot + 0.04 * HH]], front: true });
    } else if (prop === "box") {
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.18 * T.a + 6 * u), sh(side)[1] + 0.42 * HH], [tcx + side * (1.02 * T.a + 2 * u), torsoBot - 0.24 * HH]], front: true });
    } else if (prop === "slate") {
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.05 * T.a + 4 * u), sh(side)[1] + 0.5 * HH], [tcx - side * 0.3 * T.a, chin + 0.62 * HH]], front: true });
    } else if (prop === "present") {
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.25 * T.a + 8 * u), sh(side)[1] + 0.2 * HH], [tcx + side * (1.05 * T.a + 10 * u), chin + 0.05 * HH]], front: true });
    } else if (prop === "rope") {
      const S = sh(-1);
      arms.push({ pts: [S, [tcx - 0.2 * T.a, S[1] + 0.5 * HH], [tcx + 0.75 * T.a, S[1] + 0.52 * HH]], front: true });
    } else arms.push({ pts: prop === "shako" || prop === "bags" ? hang(-1, 0) : hang(-1, -sw), front: prop === "bags" });
    if (prop === "pockets" || prop === "box" || prop === "slate" || prop === "present") { /* both arms placed above */ }
    else if (prop === "bag" || prop === "bags" || (Array.isArray(prop) && prop[0] === "basket")) arms.push({ pts: hang(1, 0), front: true });
    else if (prop === "coin" || (Array.isArray(prop) && (prop[0] === "fish" || prop[0] === "gold"))) { const S = sh(1); arms.push({ pts: [S, [tcx + 1.12 * T.a + 6 * u, S[1] + 0.18 * HH], [tcx + 0.95 * T.a + 6 * u, S[1] - 0.32 * HH]], front: true }); }
    else if (prop === "rod") { const S = sh(1); arms.push({ pts: [S, [tcx + 1.1 * T.a + 8 * u, S[1] + 0.32 * HH], [tcx + 1.02 * T.a + 18 * u, S[1] + 0.4 * HH]], front: true }); }
    else if (prop === "eat") { const S = sh(1); arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.42 * T.a, S[1] + 0.12 * HH]], front: true }); }
    else if (prop === "rope") { const S = sh(1); arms.push({ pts: [S, [tcx + 1.1 * T.a + 6 * u, S[1] + 0.4 * HH], [tcx + 1.28 * T.a + 16 * u, S[1] + 0.5 * HH]], front: true }); }
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
      if (o.trim) for (const s2 of [-1, 1]) p.band([[tcx + s2 * 0.12 * T.a, chin], [tcx + s2 * 0.2 * T.a, torsoBot + 0.05 * HH]], o.trim, 3.5 * u, 1 * u);
      if (o.leather) {
        for (const s2 of [-1, 1]) p.poly([[tcx + s2 * 2 * u, chin - 0.02 * HH], [tcx + s2 * 0.62 * T.a, chin - 0.04 * HH], [tcx + s2 * 0.3 * T.a, chin + 0.42 * HH], [tcx + s2 * 4 * u, chin + 0.3 * HH]], mix(o.jacket, "#ffffff", 0.08), 2.2 * u);
        p.poly([[tcx - 7 * u, chin - 0.02 * HH], [tcx + 7 * u, chin - 0.02 * HH], [tcx + 4 * u, chin + 0.3 * HH], [tcx - 4 * u, chin + 0.3 * HH]], "#121116", 1.4 * u);
        p.stroke([[tcx + 0.5 * u, chin + 0.3 * HH], [tcx + 0.5 * u, torsoBot]], 1.6 * u, "#8a8a92");
        p.stroke([[tcx - 0.55 * T.a, chin + 0.35 * HH], [tcx - 0.66 * T.a, chin + 0.8 * HH]], 5 * u, "rgba(255,255,255,0.22)");
      }
      if (o.label) { const g = p.g; g.font = `900 ${17 * u}px 'Inter Display', Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f2e04a"; g.fillText(o.label, tcx, chin + 0.42 * HH); }
      if (o.cravat) {
        const cx2 = tcx + 2 * u * facing;
        p.poly([[cx2 - 9 * u, chin - 0.02 * HH], [cx2 + 9 * u, chin - 0.02 * HH], [cx2 + 6 * u, chin + 0.2 * HH], [cx2, chin + 0.27 * HH], [cx2 - 6 * u, chin + 0.2 * HH]], o.cravat, 2.4 * u);
        p.stroke([[cx2 - 4 * u, chin + 0.06 * HH], [cx2 - 2 * u, chin + 0.22 * HH]], 1.2 * u, "#c9c2b4");
      }
      for (let i = 0; i < (o.leather || o.label ? 0 : 4); i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  // held in front of the body, under the hands
  if (prop === "box") drawBox(p, tcx, chin + 0.42 * HH, torsoBot + 0.04 * HH, 1.12 * T.a, u);
  if (prop === "slate") drawSlate(p, tcx, chin + 0.62 * HH, u);
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "rod") {
      p.band([[hx - 14 * u, hy + 34 * u], [hx + 0.55 * (ROD_TIP[0] - hx), hy + 0.55 * (ROD_TIP[1] - hy)]], "#7a5232", 4.2 * u, 1.3 * u, "round");
      p.band([[hx + 0.5 * (ROD_TIP[0] - hx), hy + 0.5 * (ROD_TIP[1] - hy)], ROD_TIP], "#8f6a44", 2.6 * u, 1.0 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "gold") {
      const n = Math.max(1, Math.round(prop[1]));
      for (let i = 0; i < n; i++) drawGold(p, hx + (i - (n - 1) / 2) * 15 * u, hy - 38 * u, 68 * u, rad(-90 + (i - (n - 1) / 2) * 22), u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "fish") {
      const n = Math.max(1, Math.round(prop[1]));
      for (let i = 0; i < n; i++) drawFish(p, hx + (i - (n - 1) / 2) * 12 * u, hy - 30 * u, 52 * u, rad(-90 + (i - (n - 1) / 2) * 22), "#9fb4c4", u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "eat") {
      drawFish(p, hx - 6 * u, hy - 8 * u, 50 * u, rad(-12), "#c98a4a", u, true);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "rope") {
      if (hx > tcx + 0.9 * T.a) p.band([[tcx - 0.1 * T.a, hy + 2 * u], [ROPE_END[0], ROPE_END[1]]], "#c9a46a", 4.5 * u, 1.4 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "basket") {
      drawBasket(p, hx, hy, KB, prop[1], prop[2]);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "stamp") {
      p.poly([[hx - 17 * u, hy + 9 * u], [hx + 17 * u, hy + 9 * u], [hx + 17 * u, hy + 22 * u], [hx - 17 * u, hy + 22 * u]], "#2a2a35", 2.2 * u);
      p.poly([[hx - 5 * u, hy - 2 * u], [hx + 5 * u, hy - 2 * u], [hx + 5 * u, hy + 9 * u], [hx - 5 * u, hy + 9 * u]], "#8a5a34", 1.8 * u);
      p.ell(hx, hy - 6 * u, 10 * u, 9 * u, "#c0262e", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop)) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "bag" || prop === "bags") for (const a of arms) if (a.front) drawBag(p, a.pts[2][0], a.pts[2][1], u, light);
  if (prop === "paper" && wave !== undefined) { const a = arms[arms.length - 1]; drawPaper(p, a.pts[2][0], a.pts[2][1], u, -0.25 + 0.3 * wave); }
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
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "wig";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
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


// ================= the net parable: fish, nets, bones, the deal bubble, sleep Zs =================
/** a fish centred at (x, y), length L, pointing along ang (radians; 0 = to the right) */
export const drawFish = (p: Pen, x: number, y: number, L: number, ang: number, col = "#9fb4c4", u = L / 50, cooked = false) => {
  const R = (q: P2[]) => rotPts(q.map(([a, b]) => [x + a, y + b] as P2), ang, x, y);
  const body: P2[] = [];
  for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI * 2; body.push([0.36 * L * Math.cos(t), 0.16 * L * Math.sin(t) * (1 - 0.3 * Math.cos(t))]); }
  p.poly(R([[-0.3 * L, 0], [-0.56 * L, -0.17 * L], [-0.5 * L, 0], [-0.56 * L, 0.17 * L]]), shade(col, 0.85), 2.4 * u);
  p.poly(R(body), col, 2.6 * u);
  p.clip(R(body), () => { p.poly(R([[-0.4 * L, 0.03 * L], [0.4 * L, 0.03 * L], [0.4 * L, 0.3 * L], [-0.4 * L, 0.3 * L]]), mix(col, "#ffffff", 0.45), 0); });
  p.stroke(R([[0.16 * L, -0.12 * L], [0.12 * L, 0], [0.16 * L, 0.11 * L]]), 1.6 * u);
  if (cooked) for (const k of [-0.12, 0.02]) p.stroke(R([[k * L, -0.1 * L], [(k + 0.06) * L, 0.1 * L]]), 1.6 * u, "#7a4524");
  p.dot(...R([[0.25 * L, -0.03 * L]])[0], 2.4 * u);
};
/** one fish on a 240 x 120 canvas, body bent by `bend` (-1..1) */
export const fxFish = (p: Pen, bend: number) => {
  p.rot = [bend * 0.25, 120, 60];
  drawFish(p, 120, 60, 200, 0, "#9fb4c4", 4);
  p.rot = null;
};
/** fish skeleton on a 240 x 120 canvas */
export const fxBones = (p: Pen) => {
  p.ell(186, 60, 26, 20, "#f3eee2", 6);
  p.dot(192, 54, 5);
  p.stroke([[160, 60], [40, 60]], 7);
  for (let i = 0; i < 5; i++) { const x = 146 - i * 22; p.stroke([[x, 36], [x - 6, 60], [x, 84]], 5); }
  p.poly([[40, 60], [14, 36], [24, 60], [14, 84]], "#f3eee2", 5);
};
const ROPE = "#c9a46a", CORK = "#d9673a";
/** a square of knotted net on a 400 x 400 canvas, k = how much of it is tied (0..1), grows from the top-left */
export const fxNetPatch = (p: Pen, k: number) => {
  const n = 9, s = 380 / n, m = Math.max(1, Math.round(n * Math.max(0.12, k)));
  for (let i = 0; i <= m; i++) {
    p.stroke([[10, 10 + i * s], [10 + m * s, 10 + i * s]], 5, ROPE);
    p.stroke([[10 + i * s, 10], [10 + i * s, 10 + m * s]], 5, ROPE);
  }
  for (let i = 0; i <= m; i++) for (let j = 0; j <= m; j++) p.dot(10 + i * s, 10 + j * s, 6, "#8a6a3a");
};
/** a bundled net (held up / thrown) on a 360 x 360 canvas */
export const fxNetBall = (p: Pen, open = 0) => {
  const r = 120 + 50 * open, pts: P2[] = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; pts.push([180 + r * Math.cos(a) * (1 + 0.08 * Math.sin(i * 2.3)), 180 + r * 0.82 * Math.sin(a)]); }
  p.poly(pts, "rgba(201,164,106,0.25)", 0);
  p.clip(pts, () => {
    for (let i = -8; i <= 8; i++) { p.stroke([[180 + i * 26 - 200, -20], [180 + i * 26 + 200, 380]], 4, ROPE); p.stroke([[180 + i * 26 + 200, -20], [180 + i * 26 - 200, 380]], 4, ROPE); }
  });
  p.inkRing(pts, 6, 0.8, 0.4, "#6b4f2a");
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; p.ell(180 + r * Math.cos(a), 180 + r * 0.82 * Math.sin(a), 13, 9, CORK, 4); }
};
/** a net hauled up full of fish on a 400 x 440 canvas, n fish visible */
export const fxNetFull = (p: Pen, n: number, wig: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 30; i++) { const a = Math.PI * (i / 30); pts.push([200 - 170 * Math.cos(a), 70 + 330 * Math.sin(a) ** 0.85]); }
  p.poly(pts, "#cfe6ef", 0);
  p.clip(pts, () => {
    for (let i = 0; i < n; i++) {
      const h = (k: number) => { const v = Math.sin(i * 91.7 + k * 37.3) * 4375.85; return v - Math.floor(v); };
      drawFish(p, 50 + 300 * h(1), 110 + 270 * h(2), 82 + 26 * h(3), rad(-30 + 60 * h(4) + 18 * Math.sin(wig * 6 + i)), ["#9fb4c4", "#b7c7a2", "#c9b49a", "#8fa8c0"][i % 4], 1.6);
    }
    for (let i = -8; i <= 8; i++) { p.stroke([[200 + i * 30 - 230, 40], [200 + i * 30 + 230, 440]], 3.5, ROPE); p.stroke([[200 + i * 30 + 230, 40], [200 + i * 30 - 230, 440]], 3.5, ROPE); }
  });
  p.stroke(pts, 7, "#6b4f2a");
  p.stroke([[30, 70], [370, 70]], 9, "#6b4f2a");
  for (const x of [60, 140, 220, 300]) p.ell(x, 70, 14, 10, CORK, 4);
};
/** an empty net hanging over a pole on a 300 x 420 canvas */
export const fxNetHang = (p: Pen, full = 0) => {
  const pts: P2[] = [[30, 20], [270, 20], [245, 300 + 60 * full], [150, 400], [55, 300 + 60 * full]];
  if (full > 0) p.clip(pts, () => { for (let i = 0; i < 9; i++) drawFish(p, 70 + (i % 3) * 80, 120 + Math.floor(i / 3) * 80, 70, rad(-60 + i * 20), ["#9fb4c4", "#b7c7a2", "#c9b49a"][i % 3], 1.5); });
  p.clip(pts, () => {
    for (let i = -8; i <= 8; i++) { p.stroke([[150 + i * 26 - 230, 0], [150 + i * 26 + 230, 420]], 4, ROPE); p.stroke([[150 + i * 26 + 230, 0], [150 + i * 26 - 230, 420]], 4, ROPE); }
  });
  p.stroke([...pts, pts[0]], 6, "#6b4f2a");
  for (const x of [50, 110, 190, 250]) p.ell(x, 22, 14, 10, CORK, 4);
};
/** the net floating on the water, seen from above, on a 600 x 600 canvas: cork ring, mesh, fish flashing inside */
export const fxNetWater = (p: Pen, n: number, t: number) => {
  const pts: P2[] = [];
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; pts.push([300 + 250 * Math.cos(a) * (1 + 0.05 * Math.sin(i * 3.1)), 300 + 250 * Math.sin(a) * (1 + 0.05 * Math.cos(i * 2.3))]); }
  p.clip(pts, () => {
    for (let i = 0; i < n; i++) {
      const h = (k: number) => { const v = Math.sin(i * 51.7 + k * 17.3) * 4375.85; return v - Math.floor(v); };
      drawFish(p, 90 + 420 * h(1), 90 + 420 * h(2), 80, rad(360 * h(3) + 40 * Math.sin(t * 5 + i)), ["#9fb4c4", "#b7c7a2", "#c9b49a"][i % 3], 1.6);
    }
    for (let i = -12; i <= 12; i++) { p.stroke([[300 + i * 34 - 320, -20], [300 + i * 34 + 320, 620]], 3.5, ROPE); p.stroke([[300 + i * 34 + 320, -20], [300 + i * 34 - 320, 620]], 3.5, ROPE); }
  });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.ell(300 + 255 * Math.cos(a), 300 + 255 * Math.sin(a), 20, 20, CORK, 5); }
};
/** speech bubble with the deal on a 640 x 300 canvas: "10 (fish) -> 20 (fish)" */
export const fxDeal = (p: Pen, k: number) => {
  const g = p.g;
  p.poly([[110, 250], [150, 210], [190, 236]], "#ffffff", 8);
  p.poly(rrect(20, 20, 620, 230, 70), "#ffffff", 8);
  g.font = "900 104px 'Inter Display', Inter, sans-serif"; g.fillStyle = INK; g.textBaseline = "middle"; g.textAlign = "center";
  g.fillText("10", 120, 128);
  drawFish(p, 232, 128, 90, 0, "#c9a46a", 1.8);
  if (k > 0.5) {
    g.fillStyle = "#2f9e57"; g.fillText("→", 340, 122);
    g.fillStyle = INK; g.fillText("20", 448, 128);
    drawFish(p, 560, 128, 90, 0, "#c9a46a", 1.8);
  }
};
/** sleeping Zs on a 300 x 300 canvas, t in 0..1 (rises and fades) */
export const fxZzz = (p: Pen, t: number) => {
  const g = p.g;
  g.font = "900 72px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = "#ffffff";
  for (let i = 0; i < 3; i++) {
    const u = (t + i / 3) % 1, x = 90 + 120 * u + 14 * Math.sin(u * 7), y = 250 - 200 * u, sz = 0.6 + 0.6 * u;
    g.save(); g.globalAlpha = Math.min(1, 3 * (1 - u)); g.translate(x, y); g.scale(sz, sz); g.strokeText("Z", 0, 0); g.fillText("Z", 0, 0); g.restore();
  }
};
/** a plain dark strip (fishing line / rope segment) */
export const fxStrip = (p: Pen, col: string) => { p.g.fillStyle = col; p.g.fillRect(0, 0, 8, 64); };


// ================= the basket parable: wicker basket with holes, barrel, the new boat, the "another loan?" bubble =================
const WICKER = "#c8995a", WICKER_D = "#9a6a36";
/** where the hanging basket hangs from (design units, standing adult, no tilt) and its holes, in hole order */
export const BASKET_HAND: P2 = [416, 651];
/** hole offsets from the hand (basket units) and the size of the carried basket relative to them */
export const BASKET_HOLES: P2[] = [[-18, 155], [30, 139], [-44, 119], [42, 171], [8, 177]];
export const KB = 1.3;
/** wicker basket hanging from a hand at (hx, hy) in design units x k: handle, rim, weave; fill 0..1 = fish peeking
 *  over the rim; holes = how many dark holes (the first n of BASKET_HOLES, relative to the standing hand) */
export const drawBasket = (p: Pen, hx: number, hy: number, k: number, fill: number, holes: number) => {
  const X = (x: number) => hx + x * k, Y = (y: number) => hy + y * k, s = k;
  const rimY = 62, botY = 182, tw = 84, bw = 64;
  // handle
  p.arc(X(0), Y(rimY), tw * 0.78 * s, (rimY - 6) * s, 180, 360, 12 * s, INK);
  p.arc(X(0), Y(rimY), tw * 0.78 * s, (rimY - 6) * s, 180, 360, 6 * s, WICKER_D);
  // fish peeking over the rim (behind the front wall)
  const n = Math.round(clamp(fill, 0, 1) * 5);
  for (let i = 0; i < n; i++) {
    const fx = [-38, 30, -8, 52, -56][i], ang = [-100, -70, -88, -60, -118][i];
    drawFish(p, X(fx), Y(rimY - 8), 74 * s, rad(ang), ["#9fb4c4", "#b7c7a2", "#c9b49a", "#8fa8c0", "#9fb4c4"][i], 1.5 * s);
  }
  const body: P2[] = [[X(-tw), Y(rimY)], [X(tw), Y(rimY)], [X(bw), Y(botY)], [X(-bw), Y(botY)]];
  p.poly(body, WICKER, 5 * s);
  p.clip(body, () => {
    for (let r = 0; r < 6; r++) {
      const y = rimY + 14 + r * 19;
      for (let c = -5; c <= 5; c++) p.ell(X(c * 17 + (r % 2) * 8.5), Y(y), 7.5 * s, 8 * s, r % 2 ? "#b8884c" : "#d4a666", 1.6 * s);
    }
    p.poly([[X(-tw), Y(rimY)], [X(-tw * 0.55), Y(rimY)], [X(-bw * 0.4), Y(botY)], [X(-bw), Y(botY)]], "rgba(90,50,20,0.22)", 0);
  });
  p.stroke([...body, body[0]], 5 * s, INK);
  p.band([[X(-tw - 6), Y(rimY)], [X(tw + 6), Y(rimY)]], WICKER_D, 12 * s, 3 * s);
  // holes: ragged dark openings with a light torn edge
  for (let i = 0; i < Math.min(holes, BASKET_HOLES.length); i++) {
    const [ax, ay] = BASKET_HOLES[i], cx = X(ax), cy = Y(ay);
    const pts: P2[] = [];
    for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2, r = (j % 2 ? 10 : 15) * s; pts.push([cx + r * 1.15 * Math.cos(a), cy + r * 0.85 * Math.sin(a)]); }
    p.poly(pts, "#2a1a14", 3 * s);
    p.stroke([[cx - 9 * s, cy - 11 * s], [cx + 7 * s, cy - 12 * s]], 2.5 * s, "#f0d9a8");
  }
};
/** a standalone basket on a 400 x 400 canvas (on the deck, held up, under a hole) */
export const fxBasket = (p: Pen, fill: number, holes: number) => drawBasket(p, 200, 30, 1.85, fill, holes);
/** a wooden barrel on a 360 x 440 canvas; fill 0..1 = fish tails sticking out of the top */
export const fxBarrel = (p: Pen, fill: number) => {
  const n = Math.round(clamp(fill, 0, 1) * 7);
  for (let i = 0; i < n; i++) drawFish(p, 70 + i * 36, 70 - (i % 2) * 14, 92, rad(-90 + (i - 3) * 14), ["#9fb4c4", "#b7c7a2", "#c9b49a", "#8fa8c0"][i % 4], 1.7);
  const pts: P2[] = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([180 - 128 - 26 * Math.sin(Math.PI * t), 70 + 350 * t]); }
  for (let i = 20; i >= 0; i--) { const t = i / 20; pts.push([180 + 128 + 26 * Math.sin(Math.PI * t), 70 + 350 * t]); }
  p.poly(pts, "#a8743f", 7);
  p.clip(pts, () => {
    for (let i = -4; i <= 4; i++) p.stroke([[180 + i * 34, 60], [180 + i * 38, 430]], 3, "#7a5028");
    p.poly([[20, 60], [120, 60], [100, 430], [20, 430]], "rgba(60,30,10,0.25)", 0);
    for (const y of [120, 245, 370]) p.band([[0, y], [360, y]], "#5c5f66", 16, 3);
  });
  p.stroke([...pts, pts[0]], 7, INK);
  p.ell(180, 70, 128, 22, "#6b4524", 6);
};
/** the shiny new boat seen from the side on a 700 x 320 canvas */
export const fxBoat = (p: Pen) => {
  const hull: P2[] = [[30, 120], [670, 104], [610, 230], [520, 272], [150, 272], [80, 220]];
  p.poly(hull, "#d8343a", 8);
  p.clip(hull, () => {
    p.poly([[0, 160], [700, 146], [700, 176], [0, 190]], "#ffffff", 0);
    p.poly([[0, 240], [700, 240], [700, 330], [0, 330]], "#8a1f26", 0);
  });
  p.stroke([...hull, hull[0]], 8, INK);
  p.band([[30, 118], [670, 102]], "#e8c45a", 12, 4);
  p.band([[470, 104], [470, 20]], "#6b4524", 9, 3);
  p.poly([[470, 22], [560, 42], [470, 64]], "#e8c45a", 5);
  for (const [x, y, r] of [[200, 60, 18], [610, 70, 14], [330, 40, 11]] as [number, number, number][]) {
    p.poly([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], "#fff3b0", 3);
  }
};
/** speech bubble on a 520 x 300 canvas: a fish and a question mark */
export const fxAsk = (p: Pen) => {
  const g = p.g;
  p.poly([[330, 250], [300, 290], [390, 236]], "#ffffff", 8);
  p.poly(rrect(20, 20, 500, 240, 70), "#ffffff", 8);
  drawFish(p, 190, 128, 170, 0, "#c9a46a", 3.2);
  g.font = "900 150px 'Inter Display', Inter, sans-serif"; g.fillStyle = "#2f9e57"; g.textBaseline = "middle"; g.textAlign = "center";
  g.fillText("?", 390, 136);
};


// ================= the golden fish parable: the golden fish, the price board, the lender's demand =================
export const GOLD = "#f2c230";
const star4 = (p: Pen, x: number, y: number, r: number, col = "#fff3b0", ol = 3) =>
  p.poly([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], col, ol);
/** a golden fish (as drawFish) with a few sparkles around it */
export const drawGold = (p: Pen, x: number, y: number, L: number, ang: number, u = L / 50) => {
  drawFish(p, x, y, L, ang, GOLD, u);
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const [a, b, r] of [[0.42, -0.22, 0.13], [-0.3, 0.3, 0.09], [0.1, 0.34, 0.07]] as [number, number, number][])
    star4(p, x + (a * c - b * s) * L, y + (a * s + b * c) * L, r * L, "#fff3b0", 0.9 * u);
};
/** one golden fish on a 300 x 200 canvas, the sparkles turning with t */
export const fxGold = (p: Pen, t: number) => {
  p.rot = [0.15 * Math.sin(t * 6.28), 150, 100];
  drawFish(p, 150, 100, 230, 0, GOLD, 4.2);
  p.rot = null;
  const k = 0.75 + 0.25 * Math.sin(t * 6.28 * 2);
  star4(p, 250, 40, 22 * k, "#fff3b0", 3); star4(p, 52, 150, 15 * (1.75 - k), "#fff3b0", 3); star4(p, 120, 30, 11 * k, "#ffffff", 2);
};
/** the market price board on a post, on a 520 x 640 canvas: (golden fish) = n (basket), trend 1 up / -1 down / 0;
 *  ask = a question mark instead of the number and both arrows */
export const fxPrice = (p: Pen, n: number, trend: number, ask = false) => {
  const g = p.g;
  p.poly([[238, 330], [282, 330], [286, 636], [234, 636]], "#7a5232", 7);
  p.poly(rrect(14, 14, 506, 344, 30), "#8a5a34", 9);
  p.poly(rrect(36, 36, 484, 322, 20), "#fbf3df", 6);
  drawFish(p, 120, 120, 150, rad(-8), GOLD, 2.6);
  g.font = "900 120px 'Inter Display', Inter, sans-serif"; g.textBaseline = "middle"; g.textAlign = "center"; g.fillStyle = INK;
  g.fillText("=", 232, 118);
  g.fillText(ask ? "?" : String(Math.round(n)), 322, 124);
  drawBasket(p, 428, 52, 0.62, 0.8, 0);
  const band = trend > 0 ? "#2f9e57" : trend < 0 ? "#d8343a" : "#8a8f98";
  p.poly(rrect(56, 226, 464, 304, 18), ask ? "#8a8f98" : band, 5);
  const arrow = (cx: number, up: boolean, col: string) => {
    const d = up ? -1 : 1;
    p.poly([[cx, 265 + d * 30], [cx + 34, 265 - d * 6], [cx + 13, 265 - d * 6], [cx + 13, 265 - d * 30], [cx - 13, 265 - d * 30], [cx - 13, 265 - d * 6], [cx - 34, 265 - d * 6]], col, 4);
  };
  if (ask) { arrow(200, true, "#7be39a"); arrow(320, false, "#ff8a8f"); }
  else if (trend !== 0) for (const cx of [140, 260, 380]) arrow(cx, trend > 0, "#ffffff");
};
/** the lender's demand on a 560 x 300 canvas: "20 (basket) !" */
export const fxOwe = (p: Pen) => {
  const g = p.g;
  p.poly([[170, 250], [130, 292], [240, 236]], "#ffffff", 8);
  p.poly(rrect(20, 20, 540, 240, 70), "#ffffff", 8);
  g.font = "900 120px 'Inter Display', Inter, sans-serif"; g.textBaseline = "middle"; g.textAlign = "center"; g.fillStyle = INK;
  g.fillText("20", 150, 134);
  drawBasket(p, 320, 40, 0.75, 0.8, 0);
  g.fillStyle = "#d8343a"; g.fillText("!", 470, 134);
};

// ================= Poyais: the map, the dream, the guidebook, the money, the ship, the jungle, the photo =================
const TXT = (p: Pen, s: string, x: number, y: number, px: number, col = INK, w = 900) => {
  const g = p.g; g.font = `${w} ${px}px 'Inter Display', Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
/** MacGregor: red general's coat, gold sash and buttons, tall plumed shako */
export const MACGREGOR: Outfit = { ...OFFICER, jacket: "#b8262e", sash: "#e8c45a", buttons: "#e8c45a", trim: "#e8c45a", sword: true, moustache: "#6a3a22", skin: "#f5c9a0" };
/** the map of Poyais on a 520 x 400 canvas: parchment, a green coast, a river, a castle */
export const fxMap = (p: Pen) => {
  p.poly(rrect(10, 10, 510, 390, 18), "#f3e2b8", 8);
  p.poly([[30, 360], [60, 120], [150, 70], [260, 110], [330, 60], [470, 90], [490, 360]], "#7cc07a", 6);
  p.stroke([[120, 360], [170, 260], [150, 180], [230, 130]], 10, "#4fa3d9");
  p.poly([[300, 230], [300, 160], [320, 160], [320, 145], [340, 145], [340, 160], [360, 160], [360, 145], [380, 145], [380, 160], [400, 160], [400, 230]], "#e9d9b0", 5);
  p.poly([[338, 230], [338, 195], [362, 195], [362, 230]], "#6b4524", 4);
  p.poly([[350, 145], [350, 110], [385, 122], [350, 132]], "#d8343a", 4);
  TXT(p, "POYAIS", 260, 315, 72, "#6b2a1a");
};
/** a dream bubble of Poyais on a 600 x 520 canvas: k = 1 rich land, 2 + fish in the river, 3 + the theater */
export const fxDream = (p: Pen, k: number) => {
  const pts: P2[] = [];
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 230 + 18 * Math.sin(i * 2.7); pts.push([300 + r * Math.cos(a), 240 + 0.85 * r * Math.sin(a)]); }
  for (const [x, y, r] of [[120, 470, 22], [80, 505, 12]] as [number, number, number][]) p.ell(x, y, r, r, "#ffffff", 6);
  p.poly(pts, "#ffffff", 8);
  p.clip(pts, () => {
    p.poly([[0, 0], [600, 0], [600, 520], [0, 520]], "#bfe3fb", 0);
    p.poly([[0, 300], [150, 200], [300, 260], [450, 180], [600, 260], [600, 520], [0, 520]], "#7cc07a", 5);
    for (let i = 0; i < 9; i++) p.ell(60 + i * 62, 300 + (i % 2) * 30, 22, 26, "#f2c94c", 3);
    p.poly([[0, 420], [600, 380], [600, 470], [0, 500]], "#4fa3d9", 5);
    if (k >= 2) for (let i = 0; i < 4; i++) drawFish(p, 120 + i * 110, 440 - i * 9, 70, rad(i % 2 ? 160 : -10), "#9fb4c4", 1.4);
    if (k >= 3) {
      p.poly([[330, 260], [330, 160], [510, 160], [510, 260]], "#f4ead2", 5);
      p.ell(420, 160, 70, 55, "#e8c45a", 5, 180, 360);
      for (let i = 0; i < 5; i++) p.poly([[345 + i * 34, 255], [345 + i * 34, 180], [358 + i * 34, 180], [358 + i * 34, 255]], "#ffffff", 3);
      p.poly([[420, 105], [420, 70], [455, 82], [420, 94]], "#d8343a", 3);
    }
  });
};
/** the guidebook on a 400 x 520 canvas */
export const fxBook = (p: Pen) => {
  p.poly(rrect(20, 20, 380, 500, 14), "#2f5f6a", 8);
  p.poly(rrect(44, 44, 356, 476, 8), null, 4);
  TXT(p, "POYAIS", 200, 150, 62, "#e8c45a");
  TXT(p, "a guide", 200, 215, 38, "#e8c45a", 700);
  TXT(p, "Capt. T. Strangeways", 200, 420, 28, "#f3e2b8", 700);
  p.ell(200, 310, 46, 46, "#e8c45a", 5);
};
/** a Bank of Poyais banknote on a 560 x 300 canvas */
export const fxBanknote = (p: Pen) => {
  p.poly(rrect(10, 10, 550, 290, 16), "#e7f0d6", 7);
  p.poly(rrect(30, 30, 530, 270, 10), null, 4);
  TXT(p, "BANK OF POYAIS", 280, 80, 42, "#2f6a3a");
  TXT(p, "ONE DOLLAR", 280, 215, 40, "#2f6a3a", 800);
  p.ell(280, 148, 44, 36, "#cfe3b5", 4);
  TXT(p, "1", 280, 150, 56, "#2f6a3a");
  TXT(p, "1", 70, 150, 54, "#2f6a3a"); TXT(p, "1", 490, 150, 54, "#2f6a3a");
};
/** a sailing ship seen from the side on a 700 x 760 canvas */
export const fxShip = (p: Pen, sway: number) => {
  p.rot = [0.03 * sway, 350, 640];
  p.stroke([[300, 80], [300, 560]], 12, "#6b4524"); p.stroke([[470, 140], [470, 560]], 12, "#6b4524");
  for (const [x, y0, w, h] of [[300, 110, 220, 200], [300, 330, 260, 200], [470, 170, 180, 170], [470, 360, 210, 170]] as [number, number, number, number][])
    p.poly([[x - w / 2, y0], [x + w / 2, y0], [x + w / 2 + 14, y0 + h], [x - w / 2 - 14, y0 + h]], "#f7f1e3", 6);
  p.poly([[300, 60], [300, 30], [360, 45]], "#d8343a", 4);
  p.poly([[40, 560], [660, 560], [600, 690], [110, 690]], "#7a4a2a", 8);
  p.band([[60, 590], [645, 590]], "#e8c45a", 10, 3);
  for (let i = 0; i < 6; i++) p.ell(150 + i * 80, 630, 14, 14, "#2a1a14", 3);
  p.rot = null;
};
/** a wall of jungle on a 1200 x 1000 canvas (a backdrop card) */
export const fxJungle = (p: Pen) => {
  p.poly([[0, 0], [1200, 0], [1200, 1000], [0, 1000]], "#2f6b3a", 0);
  const h = (i: number, k: number) => { const v = Math.sin(i * 91.3 + k * 47.1) * 43758.5; return v - Math.floor(v); };
  for (let i = 0; i < 9; i++) { const x = 60 + i * 135 + 40 * h(i, 1); p.poly([[x - 14, 1000], [x - 8, 200 + 150 * h(i, 2)], [x + 8, 200 + 150 * h(i, 2)], [x + 14, 1000]], "#6b4a2a", 5); }
  for (let i = 0; i < 140; i++) {
    const x = 1200 * h(i, 3), y = 1000 * h(i, 4) ** 0.8, r = 50 + 70 * h(i, 5);
    p.ell(x, y, r * 1.3, r * 0.7, ["#3f8f4a", "#2f7a3e", "#57a35a", "#256b35", "#6cb862"][i % 5], 4, 0, 360, h(i, 6) * 3);
  }
  for (let i = 0; i < 10; i++) {
    const x = 60 + i * 125, y = 180 + 120 * h(i, 7);
    for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j - 2.5) * 0.55; p.poly([[x, y], [x + 150 * Math.cos(a - 0.12), y + 150 * Math.sin(a - 0.12) + 60], [x + 170 * Math.cos(a), y + 170 * Math.sin(a) + 70], [x + 150 * Math.cos(a + 0.12), y + 150 * Math.sin(a + 0.12) + 60]], "#4f9e52", 4); }
  }
};
/** a framed picture of a house on a 460 x 400 canvas; nice = 0 plain .. 1 lovely (sun, flowers, sparkles) */
export const fxPhoto = (p: Pen, nice: number) => {
  p.poly(rrect(10, 10, 450, 390, 10), "#c8995a", 8);
  p.poly([[44, 44], [416, 44], [416, 356], [44, 356]], "#bfe3fb", 5);
  p.poly([[44, 290], [416, 290], [416, 356], [44, 356]], "#7cc07a", 0);
  p.poly([[150, 290], [150, 190], [310, 190], [310, 290]], "#f4ead2", 5);
  p.poly([[135, 195], [230, 120], [325, 195]], "#c8553d", 5);
  p.poly([[214, 290], [214, 238], [246, 238], [246, 290]], "#6b4524", 4);
  if (nice > 0.5) {
    p.ell(360, 100, 34, 34, "#ffd23f", 4);
    for (let i = 0; i < 7; i++) p.ell(70 + i * 50, 320, 12, 12, ["#ff7a9c", "#ffd23f", "#ffffff"][i % 3], 3);
    for (const [x, y] of [[100, 90], [280, 75], [390, 230]] as P2[]) star4(p, x, y, 22, "#fff3b0", 3);
  }
};
/** the French tricolour on a pole, on a 300 x 420 canvas */
export const fxFlagFR = (p: Pen, wave: number) => {
  p.stroke([[30, 20], [30, 410]], 10, "#6b4524");
  const y = (x: number) => 30 + 10 * Math.sin(x / 50 + wave * 6.28);
  const band = (x0: number, x1: number, col: string) => p.poly([[x0, y(x0)], [x1, y(x1)], [x1, y(x1) + 180], [x0, y(x0) + 180]], col, 4);
  band(36, 120, "#2a4fa0"); band(120, 204, "#ffffff"); band(204, 288, "#d8343a");
};
/** a floating question mark on a 200 x 240 canvas */
export const fxQ = (p: Pen) => { const g = p.g; g.font = "900 200px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 14; g.strokeStyle = INK; g.strokeText("?", 100, 125); g.fillStyle = "#ffffff"; g.fillText("?", 100, 125); };

// ================= The Bank That Wanted Eight of Everything =================
/** a cardboard box carried in both hands, a little plant and a picture frame sticking out of it */
const drawBox = (p: Pen, cx: number, y0: number, y1: number, hw: number, u: number) => {
  p.poly([[cx - 0.55 * hw, y0 + 6 * u], [cx - 0.55 * hw, y0 - 30 * u], [cx - 0.15 * hw, y0 - 30 * u], [cx - 0.15 * hw, y0 + 6 * u]], "#f4ead2", 2.2 * u);
  p.poly([[cx - 0.48 * hw, y0 - 22 * u], [cx - 0.22 * hw, y0 - 22 * u], [cx - 0.22 * hw, y0], [cx - 0.48 * hw, y0]], "#7fb6e0", 1.6 * u);
  for (const [dx, dy, r] of [[0.32, -26, 11], [0.45, -36, 9], [0.22, -38, 8]] as [number, number, number][]) p.ell(cx + dx * hw, y0 + dy * u, r * u, r * 1.25 * u, "#5aa83c", 2 * u);
  p.stroke([[cx + 0.33 * hw, y0 + 4 * u], [cx + 0.33 * hw, y0 - 22 * u]], 2.4 * u, "#3f7a2e");
  p.poly([[cx - hw, y0], [cx + hw, y0], [cx + hw, y1], [cx - hw, y1]], "#c8955a", 3.2 * u);
  p.poly([[cx - hw, y0], [cx + hw, y0], [cx + hw, y0 + 9 * u], [cx - hw, y0 + 9 * u]], "#b5824a", 2 * u);
  p.stroke([[cx - 0.2 * hw, y0 + 26 * u], [cx + 0.2 * hw, y0 + 26 * u]], 2 * u, "#8a5a34");
};
/** a little chalk slate with a big 8, hugged to the chest */
const drawSlate = (p: Pen, cx: number, cy: number, u: number) => {
  p.poly(rrect(cx - 34 * u, cy - 40 * u, cx + 34 * u, cy + 40 * u, 6 * u), "#8a5a34", 2.6 * u);
  p.poly([[cx - 27 * u, cy - 33 * u], [cx + 27 * u, cy - 33 * u], [cx + 27 * u, cy + 33 * u], [cx - 27 * u, cy + 33 * u]], "#2f4a3e", 1.2 * u);
  const g = p.g; g.font = `900 ${60 * u}px 'Inter Display', Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(246,244,232,0.95)"; g.fillText("8", cx, cy + 3 * u);
};
const CARD_RED = "#c0262e", CARD_GOLD = "#e8b53a";
/** a bank card on a 400 x 260 canvas: kind 0 debit, 1 credit (with a star) */
export const fxBankCard = (p: Pen, kind = 0) => {
  p.poly(rrect(12, 12, 388, 248, 24), CARD_RED, 8);
  p.poly([[16, 160], [384, 160], [384, 196], [16, 196]], CARD_GOLD, 0);
  p.poly(rrect(44, 70, 112, 124, 8), "#f2d27a", 4);
  TXT(p, "8", 330, 76, 74, "#f5d36a");
  TXT(p, kind ? "CREDIT" : "DEBIT", 210, 222, 30, "#ffffff", 800);
  if (kind) star4(p, 258, 100, 22, "#fff3b0", 3);
};
/** an envelope on a 440 x 300 canvas; gold = the bonus envelope ($ seal), open = flap up */
export const fxEnvelope = (p: Pen, gold = false, open = false) => {
  const body = gold ? "#f2c94c" : "#f6f0e0", flap = gold ? "#e0b03a" : "#e6dcc4";
  if (open) p.poly([[16, 110], [220, 8], [424, 110]], flap, 7);
  p.poly(rrect(16, 100, 424, 288, 14), body, 8);
  p.poly([[16, 112], [220, 210], [424, 112]], null, 5);
  if (!open) p.poly([[16, 104], [220, 214], [424, 104]], flap, 6);
  if (gold) { p.ell(220, 206, 40, 40, "#c0262e", 5); TXT(p, "$", 220, 208, 52, "#ffffff"); }
};
/** a gold badge with an 8 (the daily number) on a 240 x 240 canvas */
export const fxBadge8 = (p: Pen) => {
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.ell(120 + 92 * Math.cos(a), 120 + 92 * Math.sin(a), 22, 22, "#e0a92c", 5); }
  p.ell(120, 120, 96, 96, "#f2c230", 7);
  p.ell(120, 120, 74, 74, null, 4);
  TXT(p, "8", 120, 126, 120, INK);
};
/** a sweat drop on a 120 x 170 canvas */
export const fxDrop = (p: Pen) => {
  p.poly([[60, 10], [100, 100], [96, 130], [60, 160], [24, 130], [20, 100]], "#8fd0f5", 6);
  p.ell(48, 112, 10, 18, "#ffffff", 0, 0, 360, -20);
};
/** a red anger mark (four strokes around a cross) on a 180 x 180 canvas */
export const fxAnger = (p: Pen) => {
  for (const [a, b] of [[[40, 72], [72, 40]], [[108, 40], [140, 72]], [[140, 108], [108, 140]], [[72, 140], [40, 108]]] as [P2, P2][]) {
    p.stroke([a, b], 24, INK);
    p.stroke([a, b], 13, "#e23a3a");
  }
};
/** a heart on a 200 x 180 canvas */
export const fxHeart = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([100 + 70 * Math.sin(t) ** 3, 82 - (58 * Math.cos(t) - 22 * Math.cos(2 * t) - 9 * Math.cos(3 * t) - 4 * Math.cos(4 * t))]); }
  p.poly(pts, "#ef4f6c", 7);
  p.ell(70, 60, 12, 18, "#ffffff", 0, 0, 360, 30);
};
/** a weed with a dandelion head (and dangling roots once pulled) on a 260 x 420 canvas */
export const fxWeed = (p: Pen, roots = true) => {
  if (roots) for (const dx of [-26, -8, 12, 28]) p.stroke([[130, 300], [130 + dx * 0.6, 340], [130 + dx, 400]], 5, "#8a6a4a");
  p.stroke([[130, 300], [128, 150], [132, 70]], 9, "#4f8f3a");
  for (const s of [-1, 1]) for (const [y, L] of [[290, 110], [240, 90], [200, 70]] as [number, number][]) {
    const pts: P2[] = [[130, y]];
    for (let k = 1; k <= 4; k++) pts.push([130 + s * L * (k / 4), y - (30 * k) / 4 - (k % 2) * 16]);
    pts.push([130 + s * L * 0.55, y + 10]);
    p.poly(pts, "#6fb547", 5);
  }
  p.ell(132, 58, 40, 36, "#ffd23f", 6);
  p.ell(132, 58, 16, 14, "#f0a830", 3);
};
/** the fee bill on a 300 x 1400 canvas, unrolled to k (0..1) from the top; the rest of the canvas stays empty */
export const fxBill = (p: Pen, k: number) => {
  const L = Math.max(80, 1370 * k);
  const edge: P2[] = [];
  for (let x = 270, i = 0; x >= 30; x -= 12, i++) edge.push([x, L + (i % 2 ? 12 : 0)]);
  p.poly([[30, 10], [270, 10], ...edge], "#fbf8ef", 6);
  p.clip([[30, 10], [270, 10], [270, L], [30, L]], () => {
    TXT(p, "FEES", 150, 64, 52, "#c0262e");
    for (let y = 124, i = 0; y < L - 24; y += 58, i++) {
      TXT(p, ["FEE", "FEE", "LATE FEE", "FEE", "CARD FEE"][i % 5], 98, y, 26, INK, 800);
      TXT(p, `$${[25, 35, 15, 39, 12, 29][i % 6]}`, 222, y, 28, "#c0262e", 900);
    }
  });
  p.poly([[22, 4], [278, 4], [278, 26], [22, 26]], "#e8e0cc", 5);
};
/** the giant settlement cheque on a 1000 x 460 canvas */
export const fxCheque = (p: Pen) => {
  p.poly(rrect(14, 14, 986, 446, 26), "#e9f3df", 10);
  p.poly(rrect(36, 36, 964, 424, 16), null, 4);
  TXT(p, "PAY TO THE ORDER OF", 230, 92, 30, "#3f6a46", 800);
  TXT(p, "THE UNITED STATES", 640, 92, 46, INK, 900);
  p.poly(rrect(560, 148, 948, 252, 12), "#ffffff", 5);
  TXT(p, "$3,000,000,000", 754, 202, 52, INK, 900);
  TXT(p, "THREE BILLION DOLLARS", 290, 202, 38, "#3f6a46", 900);
  p.stroke([[70, 248], [520, 248]], 4, "#3f6a46");
  p.stroke([[600, 360], [640, 330], [670, 372], [700, 320], [740, 368], [790, 340], [860, 352]], 6, "#1f2a44");
  p.stroke([[580, 392], [920, 392]], 4, "#3f6a46");
  TXT(p, "8", 110, 362, 96, "#c0262e");
};

// ================= Eleven Days Without Jensen =================
/** Jensen Huang as our house caricature: swept grey hair, black leather jacket, black shirt */
export const JENSEN: Outfit = { jacket: "#232228", pants: "#18171c", boots: "#101014", hat: "hair", hair: "#cfcfd4", leather: true, skin: "#f1c9a2" };
/** a framed portrait of a character (head and shoulders) on a 600 x 700 canvas */
export const fxPortrait = (p: Pen, o: Outfit, expr: Expr = "smile") => {
  p.poly(rrect(10, 10, 590, 690, 18), "#c9a04a", 10);
  p.poly([[40, 40], [560, 40], [560, 660], [40, 660]], "#2a4a6a", 0);
  const g = p.g; g.save();
  g.beginPath(); g.rect(40, 40, 520, 620); g.clip();
  g.translate(-210, -90); g.scale(1.7, 1.7);
  bodyFront(p, o, { mode: "stand", expr, look: 0, seed: 3 });
  g.restore();
  p.poly([[40, 40], [560, 40], [560, 660], [40, 660]], null, 6);
};
/** a newspaper front page on a 520 x 680 canvas; k picks the headline */
export const fxPaper3 = (p: Pen, k: number) => {
  p.poly([[10, 10], [510, 10], [510, 670], [10, 670]], "#f4f0e4", 7);
  TXT(p, "THE DAILY MARKET", 260, 52, 40, INK, 900);
  p.stroke([[30, 84], [490, 84]], 4, INK);
  const H = [["NVIDIA CEO", "STEPS DOWN"], ["SPY PROBE", "REPORTS"], ["CHINA", "DENIES IT"]][k % 3];
  TXT(p, H[0], 260, 140, 62, INK, 900); TXT(p, H[1], 260, 208, 62, k === 1 ? "#c0262e" : INK, 900);
  p.poly([[30, 260], [270, 260], [270, 480], [30, 480]], "#c9c2b0", 4);
  if (k === 1) { p.ell(150, 330, 38, 40, "#2a2530", 0); p.poly([[95, 480], [110, 380], [190, 380], [205, 480]], "#2a2530", 0); p.poly([[96, 318], [204, 318], [196, 300], [104, 300]], "#2a2530", 0); }
  else { p.ell(150, 340, 44, 44, "#e8cfb4", 4); p.poly([[90, 480], [100, 400], [200, 400], [210, 480]], "#232228", 4); }
  for (let i = 0; i < 9; i++) p.stroke([[290, 272 + i * 24], [490, 272 + i * 24]], 5, "#b8b0a0");
  for (let i = 0; i < 6; i++) p.stroke([[30, 510 + i * 26], [490, 510 + i * 26]], 5, "#b8b0a0");
};
/** the red DENIED stamp on a 460 x 180 canvas */
export const fxDenied = (p: Pen) => {
  p.rot = [-0.12, 230, 90];
  p.poly(rrect(14, 24, 446, 156, 14), null, 0);
  p.g.lineWidth = 12; p.g.strokeStyle = "#d8343a"; p.g.strokeRect(20, 30, 420, 120);
  TXT(p, "DENIED", 230, 94, 96, "#d8343a", 900);
  p.rot = null;
};
/** a price-target sign on a 520 x 300 canvas; cut = 0 whole ($400) .. 1 cut in half, showing $200 */
export const fxTarget = (p: Pen, cut: number) => {
  const half = cut >= 1;
  p.poly(rrect(14, 14, half ? 266 : 506, 286, 16), "#ffffff", 8);
  TXT(p, "PRICE TARGET", half ? 140 : 260, 74, half ? 28 : 40, "#5a6070", 800);
  TXT(p, half ? "$200" : "$400", half ? 140 : 260, 184, half ? 84 : 130, half ? "#d8343a" : "#2f9e57", 900);
  if (cut > 0 && !half) p.stroke([[260, 10], [260 + 6, 140 * cut + 10]], 6, INK);
};
/** big scissors on a 300 x 300 canvas, open 0..1 */
export const fxScissors = (p: Pen, open: number) => {
  const a = 0.15 + 0.35 * open;
  for (const s of [-1, 1]) {
    p.rot = [s * a, 150, 150];
    p.poly([[150, 150], [290, 140 + s * 6], [150, 160]], "#c9ccd4", 5);
    p.ell(70, 150 + s * 36, 34, 22, "#d8343a", 6);
    p.rot = null;
  }
  p.dot(150, 150, 9);
};
/** a big number counter on a 600 x 220 canvas */
export const fxCounter = (p: Pen, n: number) => {
  p.poly(rrect(14, 14, 586, 206, 30), "#ffffff", 8);
  TXT(p, `${n.toLocaleString("en-US")}+`, 300, 92, 100, INK, 900);
  TXT(p, "SIGNATURES", 300, 170, 36, "#2f9e57", 800);
};
/** a ringing desk phone (from the phone-call episode) on a 300 x 540 canvas */
export const fxPhone = (p: Pen, t: number, ringing: boolean) => {
  const a = ringing ? 0.06 * Math.sin(t * 6.28 * 4) : 0;
  p.rot = [a, 150, 270];
  p.poly(rrect(20, 20, 280, 520, 34), "#141016", 6);
  p.poly(rrect(34, 50, 266, 490, 20), "#1f3b5a", 0);
  const g = p.g; g.font = "800 30px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.fillStyle = "#ffffff"; g.textBaseline = "middle";
  g.fillText("WASHINGTON", 150, 170); g.font = "600 20px 'Inter Display', Inter, sans-serif"; g.fillStyle = "#c9d6e6"; g.fillText(ringing ? "incoming call" : "00:12", 150, 205);
  p.ell(150, 110, 34, 34, "#c9ccd4", 4);
  p.ell(90, 420, 30, 30, "#d8343a", 4); p.ell(210, 420, 30, 30, "#2f9e57", 4);
  p.rot = null;
  if (ringing) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.arc(150 + s * 150, 270, 30 + k * 22, 60 + k * 30, s > 0 ? -40 : 140, s > 0 ? 40 : 220, 5, "#ffd23f");
};
/** a notepad with scribbles on a 260 x 320 canvas */
export const fxNotes = (p: Pen, k: number) => {
  p.poly([[14, 14], [246, 14], [246, 306], [14, 306]], "#fbf6dc", 6);
  for (let i = 0; i < 6; i++) p.stroke([[36, 60 + i * 40], [36 + 150 + 30 * Math.sin(i + k), 60 + i * 40]], 6, "#3a4a8a");
};
/** one confetti strip on a 64 x 128 canvas */
export const fxConfetti = (p: Pen, col: string) => { p.poly([[4, 4], [60, 4], [60, 124], [4, 124]], col, 3); };
/** a glowing chip on a 700 x 700 canvas (the keynote screen / the investors' screen) */
export const fxChip = (p: Pen) => {
  p.poly([[0, 0], [700, 0], [700, 700], [0, 700]], "#06120a", 0);
  for (let i = 0; i < 12; i++) for (const s of [0, 1]) {
    const x = 150 + i * 36;
    p.stroke(s ? [[x, 120], [x, 60]] : [[x, 580], [x, 640]], 8, "#76b900");
    p.stroke(s ? [[120, x], [60, x]] : [[580, x], [640, x]], 8, "#76b900");
  }
  p.poly(rrect(130, 130, 570, 570, 30), "#1a2a12", 10);
  p.poly(rrect(200, 200, 500, 500, 20), "#2a3a1a", 6);
  TXT(p, "GPU", 350, 360, 120, "#a8e060", 900);
};

/** the petition: a long cream scroll of signatures on a 1400 x 200 canvas */
export const fxScroll = (p: Pen) => {
  p.poly(rrect(30, 20, 1370, 180, 10), "#f8f1dc", 6);
  for (const x of [30, 1370]) p.ell(x, 100, 26, 92, "#e6d8b4", 6);
  for (let i = 0; i < 64; i++) {
    const x = 70 + (i % 16) * 80, y = 52 + Math.floor(i / 16) * 34, w = 40 + 25 * Math.abs(Math.sin(i * 1.3));
    p.stroke([[x, y + 6], [x + w * 0.3, y - 6], [x + w * 0.6, y + 8], [x + w, y - 2]], 4, i % 3 ? "#2f3f8a" : "#3a2a4a");
  }
};

// ================= The Bats That Bombed America =================
/** a bat on a 300 x 200 canvas: flap 0..1 (wings up .. down), bomb = a little firebomb under it, glow = it's lit */
export const fxBat = (p: Pen, flap: number, bomb = false, glow = false) => {
  const up = Math.cos(flap * Math.PI * 2), body = "#3a2f3a";
  for (const s of [-1, 1]) {
    const tip: P2 = [150 + s * 140, 100 - 60 * up], mid: P2 = [150 + s * 80, 90 - 30 * up];
    p.poly([[150 + s * 14, 86], mid, tip, [150 + s * 120, 112 - 30 * up], [150 + s * 95, 104 - 10 * up], [150 + s * 70, 118 - 14 * up], [150 + s * 40, 108]], body, 5);
  }
  p.ell(150, 100, 24, 30, body, 5);
  p.poly([[134, 78], [140, 56], [148, 76]], body, 4); p.poly([[152, 76], [160, 56], [166, 78]], body, 4);
  p.dot(141, 92, 4.5, "#ffffff"); p.dot(159, 92, 4.5, "#ffffff"); p.dot(142, 93, 2.2); p.dot(160, 93, 2.2);
  if (bomb) {
    p.stroke([[150, 128], [150, 140]], 3, INK);
    p.poly(rrect(136, 140, 164, 176, 8), "#8a8f98", 4);
    p.stroke([[150, 176], [150, 186]], 3, glow ? "#ffb02e" : INK);
    if (glow) p.ell(150, 190, 9, 9, "#ffd23f", 0);
  }
};
/** a bat hanging upside down, asleep, on a 120 x 160 canvas */
export const fxBatSleep = (p: Pen) => {
  p.stroke([[60, 8], [60, 26]], 4, INK);
  p.ell(60, 70, 30, 44, "#3a2f3a", 5);
  p.poly([[44, 112], [50, 132], [56, 110]], "#3a2f3a", 4); p.poly([[64, 110], [70, 132], [76, 112]], "#3a2f3a", 4);
  p.stroke([[46, 96], [54, 94]], 3, "#ffffff"); p.stroke([[66, 94], [74, 96]], 3, "#ffffff");
};
/** a flame on a 220 x 320 canvas, t animates the flicker */
export const fxFlame = (p: Pen, t: number) => {
  const w = (k: number) => 10 * Math.sin(t * 6.28 + k);
  p.poly([[110, 20 + w(0)], [170, 140 + w(1)], [200, 250], [160, 310], [60, 310], [20, 250], [50, 140 + w(2)]], "#ff7a1a", 6);
  p.poly([[110, 90 + w(3)], [150, 170], [160, 250], [130, 300], [90, 300], [60, 250], [70, 170]], "#ffc93c", 0);
  p.poly([[110, 170 + w(4)], [130, 230], [120, 290], [100, 290], [90, 230]], "#fff3b0", 0);
};
/** a puff of dark smoke on a 260 x 220 canvas */
export const fxSmoke = (p: Pen) => {
  for (const [x, y, r] of [[90, 130, 70], [160, 110, 80], [130, 70, 60], [190, 150, 55]] as [number, number, number][]) p.ell(x, y, r, r * 0.85, "#4a4450", 0);
};
/** a typed note on a 520 x 300 canvas */
export const fxNoteWH = (p: Pen) => {
  p.poly([[14, 14], [506, 14], [506, 286], [14, 286]], "#fbf8ef", 6);
  TXT(p, "THE WHITE HOUSE", 260, 56, 30, "#3a4a8a", 800);
  TXT(p, "“This man is", 260, 140, 52, INK, 900);
  TXT(p, "not a nut.”", 260, 206, 52, INK, 900);
  p.stroke([[300, 250], [330, 232], [360, 256], [400, 236], [440, 250]], 5, "#1f2a44");
};
/** a red CANCELLED stamp on a 560 x 180 canvas */
export const fxCancelled = (p: Pen) => {
  p.rot = [-0.1, 280, 90];
  p.g.lineWidth = 12; p.g.strokeStyle = "#d8343a"; p.g.strokeRect(20, 30, 520, 120);
  TXT(p, "CANCELLED", 280, 94, 92, "#d8343a", 900);
  p.rot = null;
};
/** the tiny incendiary next to a peanut on a 300 x 200 canvas */
export const fxTinyBomb = (p: Pen) => {
  p.poly(rrect(40, 60, 170, 130, 30), "#8a8f98", 6);
  p.stroke([[170, 95], [196, 95]], 5, INK);
  p.ell(208, 95, 10, 10, "#ffb02e", 4);
  p.ell(255, 95, 30, 18, "#d9b36a", 5);
};
/** a crate's lid on a 300 x 120 canvas */
export const fxLid = (p: Pen) => { p.poly([[10, 20], [290, 20], [290, 100], [10, 100]], "#b5824a", 6); p.stroke([[20, 60], [280, 60]], 4, "#7a4f33"); };

/** a thumbs-up hand on a 200 x 200 canvas */
export const fxThumb = (p: Pen) => {
  p.poly(rrect(50, 90, 150, 180, 18), "#f5c9a0", 6);
  p.poly(rrect(78, 20, 118, 110, 18), "#f5c9a0", 6);
  for (let i = 0; i < 3; i++) p.stroke([[60, 115 + i * 22], [140, 115 + i * 22]], 4, "#c99067");
};

// ================= The City That Paid for Rat Tails =================
/** map of Asia on a 600 x 440 canvas; dark plague stain spreads with k 0..1 (from the west and south toward Hanoi) */
export const fxAsia = (p: Pen, k: number) => {
  p.poly(rrect(10, 10, 590, 430, 18), "#f3e6c4", 8);
  p.clip(rrect(14, 14, 586, 426, 16), () => {
    p.g.fillStyle = "#a9d3e6"; p.g.fillRect(14, 14, 572, 412);
    const land: P2[] = [[30, 60], [200, 40], [420, 50], [560, 90], [575, 170], [520, 200], [500, 250], [455, 230], [430, 290], [470, 360], [430, 400], [400, 330], [370, 270], [330, 300], [300, 390], [262, 330], [240, 250], [180, 280], [120, 230], [60, 210], [30, 150]];
    p.poly(land, "#d9c98e", 6);
    p.poly([[505, 300], [555, 315], [540, 350], [500, 340]], "#d9c98e", 5);
    p.poly([[560, 230], [585, 250], [575, 290], [555, 270]], "#d9c98e", 5);
    if (k > 0) p.clip(land, () => {
      for (const [x, y, r] of [[120, 160, 150], [300, 280, 140], [250, 120, 130], [380, 230, 110]] as [number, number, number][]) {
        const gr = p.g.createRadialGradient(x, y, 0, x, y, r * k * 1.3); gr.addColorStop(0, "rgba(40,20,45,0.85)"); gr.addColorStop(0.75, "rgba(60,25,55,0.6)"); gr.addColorStop(1, "rgba(60,25,55,0)");
        p.g.fillStyle = gr; p.g.fillRect(0, 0, 600, 440);
      }
    });
  });
  p.dot(405, 262, 11, "#d8343a"); p.ell(405, 262, 11, 11, null, 4);
  TXT(p, "HANOI", 405, 300, 30, INK, 900);
  TXT(p, "ASIA", 170, 92, 40, "#7a6a4a", 900);
  if (k > 0.2) TXT(p, "PLAGUE", 210, 210, 46, "#ffffff", 900);
};
/** a notice "1 CENT PER TAIL" on a 520 x 360 canvas, with a little tail drawing */
export const fxTailSign = (p: Pen) => {
  p.poly(rrect(14, 14, 506, 346, 20), "#fbf6e6", 8);
  TXT(p, "BOUNTY", 260, 64, 40, "#b8262e", 900);
  TXT(p, "1 CENT", 260, 140, 92, INK, 900);
  TXT(p, "PER TAIL", 260, 222, 60, INK, 900);
  p.line([[150, 290], [200, 270], [260, 300], [320, 274], [370, 292]], "#e9a3a6", 12);
};
/** the day's rat count on a 600 x 240 canvas */
export const fxRatCount = (p: Pen, n: number) => {
  p.poly(rrect(14, 14, 586, 226, 28), "#2b2c33", 8);
  TXT(p, n.toLocaleString("en-US"), 300, 100, 110, "#ffd23f", 900);
  TXT(p, "RATS - 12 JUNE 1902", 300, 186, 36, "#ffffff", 800);
};
/** chalk drawing of the loop (cobra effect) on a 640 x 300 canvas, revealed by k 0..1 */
export const fxChalk = (p: Pen, k: number, cobra: number) => {
  const chalk = "#f4f1e6";
  const T2 = (s: string, x: number, y: number, px: number, a: number) => { if (k > a) TXT(p, s, x, y, px, chalk, 800); };
  T2("1¢ PER TAIL", 150, 70, 46, 0.0);
  T2("MORE TAILS", 490, 70, 46, 0.3);
  T2("MORE RATS", 320, 240, 52, 0.6);
  if (k > 0.15) p.stroke([[290, 70], [370, 70]], 7, chalk);
  if (k > 0.15) p.stroke([[355, 58], [372, 70], [355, 82]], 7, chalk);
  if (k > 0.45) { p.arc(480, 160, 60, 60, -60, 80, 7, chalk); p.stroke([[470, 216], [445, 225], [470, 236]], 7, chalk); }
  if (k > 0.75) { p.arc(160, 160, 60, 60, 100, 240, 7, chalk); p.stroke([[130, 110], [150, 92], [165, 114]], 7, chalk); }
  if (cobra > 0) {
    p.g.globalAlpha = Math.min(1, cobra);
    p.line([[560, 290], [600, 270], [580, 240], [610, 210]], "#5f9e45", 16);
    p.ell(612, 196, 24, 18, "#5f9e45", 5);
    p.dot(606, 192, 3.5); p.dot(618, 192, 3.5);
    p.stroke([[612, 212], [612, 224], [606, 230]], 3, "#d8343a"); p.stroke([[612, 224], [618, 230]], 3, "#d8343a");
    p.g.globalAlpha = 1;
  }
};
/** a wanted-style poster for the wall on a 360 x 480 canvas */
export const fxPoster = (p: Pen) => {
  p.poly(rrect(10, 10, 350, 470, 10), "#f4e7c4", 7);
  TXT(p, "BOUNTY", 180, 60, 48, "#b8262e", 900);
  p.ell(180, 190, 80, 48, "#8b8078", 6); p.ell(240, 170, 34, 30, "#8b8078", 6); p.dot(250, 162, 6); p.ell(258, 150, 14, 14, "#e9a3a6", 4);
  p.line([[100, 200], [60, 230], [40, 210]], "#e9a3a6", 9);
  TXT(p, "1 CENT", 180, 330, 70, INK, 900);
  TXT(p, "PER TAIL", 180, 400, 50, INK, 900);
};
/** glowing pair of eyes on a 120 x 60 canvas */
export const fxEyes = (p: Pen) => { for (const x of [36, 84]) { p.ell(x, 30, 16, 12, "#ffe066", 0); p.dot(x + 2, 30, 5, "#2a1a10"); } };

// ---------------- rats (2D characters, drawn on the 600 x 1000 character card, feet on y 975) ----------------
export type RatDraw = { view: "side" | "front" | "up"; tail?: boolean; hat?: boolean; tip?: number; run?: number; expr?: "neutral" | "grin" | "shock";
  paw?: number; wave?: number; glow?: boolean; blink?: number };
const FUR = "#8b8078", FUR_D = "#6e645d", BELLY = "#d2c6b8", PINK = "#e9a3a6";
const ratFace = (p: Pen, cx: number, cy: number, s: number, o: RatDraw) => {
  for (const d of [-1, 1]) { p.ell(cx + d * 62 * s, cy - 78 * s, 50 * s, 50 * s, FUR, 9); p.ell(cx + d * 62 * s, cy - 78 * s, 30 * s, 30 * s, PINK, 0); }
  p.ell(cx, cy, 112 * s, 96 * s, FUR, 10);
  p.ell(cx, cy + 46 * s, 56 * s, 40 * s, BELLY, 7);
  for (const d of [-1, 1]) {
    if ((o.blink ?? 0) > 0.5) p.stroke([[cx + d * 42 * s - 14 * s, cy - 10 * s], [cx + d * 42 * s + 14 * s, cy - 10 * s]], 7 * s);
    else { p.ell(cx + d * 42 * s, cy - 12 * s, 19 * s, (o.expr === "shock" ? 25 : 21) * s, o.glow ? "#ffe066" : "#ffffff", 5); p.dot(cx + d * 40 * s, cy - 8 * s, 10 * s, o.glow ? "#3a2010" : INK); p.dot(cx + d * 36 * s, cy - 16 * s, 4 * s, "#ffffff"); }
    for (const k of [-1, 1]) p.stroke([[cx + d * 34 * s, cy + 50 * s + k * 7 * s], [cx + d * 120 * s, cy + 40 * s + k * 20 * s]], 3 * s);
  }
  p.ell(cx, cy + 28 * s, 16 * s, 12 * s, PINK, 5);
  if (o.expr === "grin") { p.poly([[cx - 26 * s, cy + 58 * s], [cx + 26 * s, cy + 58 * s], [cx, cy + 82 * s]], "#5a1f2a", 5); p.poly([[cx - 10 * s, cy + 58 * s], [cx + 10 * s, cy + 58 * s], [cx + 10 * s, cy + 70 * s], [cx - 10 * s, cy + 70 * s]], "#ffffff", 3); }
  else if (o.expr === "shock") p.ell(cx, cy + 68 * s, 12 * s, 16 * s, "#5a1f2a", 5);
  else p.arc(cx, cy + 56 * s, 16 * s, 10 * s, 20, 160, 5 * s);
};
const topHat = (p: Pen, cx: number, cy: number, s: number, tip: number) => {
  p.rot = [-0.5 * tip, cx, cy + 20 * s, 30 * tip * s, -60 * tip * s];
  p.ell(cx, cy, 110 * s, 20 * s, "#1c1a22", 8);
  p.poly([[cx - 70 * s, cy - 2 * s], [cx - 76 * s, cy - 170 * s], [cx + 76 * s, cy - 170 * s], [cx + 70 * s, cy - 2 * s]], "#26232e", 8);
  p.poly([[cx - 71 * s, cy - 18 * s], [cx - 72 * s, cy - 48 * s], [cx + 72 * s, cy - 48 * s], [cx + 71 * s, cy - 18 * s]], "#b8262e", 0);
  p.rot = null;
};
export const drawRat = (p: Pen, o: RatDraw) => {
  const ph = (o.run ?? 0) * Math.PI * 2, run = o.run !== undefined;
  if (o.view === "side") {
    // profile facing right
    const by = 830 - (run ? 10 * Math.abs(Math.sin(ph)) : 0);
    if (o.tail !== false) p.line([[150, by + 40], [80, by + 70], [30, by + 20], [10, by - 40]], PINK, 14);
    else p.ell(140, by + 20, 18, 16, PINK, 6);
    for (const [x, k] of [[200, 0], [250, Math.PI], [380, Math.PI / 2], [420, Math.PI * 1.5]] as [number, number][]) {
      const dx = run ? 30 * Math.sin(ph + k) : 0, lift = run ? Math.max(0, 22 * Math.cos(ph + k)) : 0;
      p.ell(x + dx, 958 - lift, 28, 14, PINK, 6);
    }
    p.ell(300, by, 175, 115, FUR, 10);
    p.ell(320, by + 50, 120, 50, BELLY, 0);
    p.ell(455, by - 60, 46, 46, FUR, 9); p.ell(455, by - 60, 28, 28, PINK, 0);
    p.poly([[400, by - 80], [470, by - 90], [585, by - 20], [470, by + 40], [400, by + 20]], FUR, 10);
    p.dot(585, by - 22, 14, PINK);
    if ((o.blink ?? 0) > 0.5) p.stroke([[480, by - 40], [510, by - 42]], 7); else { p.ell(495, by - 40, 16, 19, o.glow ? "#ffe066" : "#ffffff", 5); p.dot(500, by - 38, 9, INK); }
    for (const k of [-1, 1]) p.stroke([[560, by - 10 + k * 6], [620, by - 18 + k * 18]], 3);
    return;
  }
  const up = o.view === "up";
  const by = up ? 780 : 840, s = up ? 1.05 : 1;
  if (o.tail !== false) p.line([[400, 950], [520, 940], [580, 880], [560, 800]], PINK, 14);
  else p.ell(400, 945, 16, 14, PINK, 6);
  p.ell(300, by, up ? 150 : 165, up ? 190 : 140, FUR, 10);
  p.ell(300, by + (up ? 30 : 20), up ? 95 : 105, up ? 130 : 95, BELLY, 0);
  for (const d of [-1, 1]) p.ell(300 + d * 70, 960, 42, 18, PINK, 6);
  const hy = up ? 520 : 640;
  for (const [d, a] of [[-1, o.paw ?? 0], [1, o.wave ?? 0]] as [number, number][]) {
    const sx = 300 + d * 95, sy = by - (up ? 110 : 60);
    const ex = sx + d * 40 * (1 - a) + d * 30 * a, ey = sy + 90 * (1 - a) - 150 * a;
    p.line([[sx, sy], [ex, ey]], FUR, 26);
    p.ell(ex, ey, 20, 18, PINK, 5);
  }
  ratFace(p, 300, hy, s, o);
  if (o.hat) topHat(p, 300, hy - 92, 0.9, o.tip ?? 0);
};
/** a lit oil lamp held by a worker, on a 160 x 240 canvas */
export const fxLamp = (p: Pen) => {
  p.arc(80, 50, 30, 30, 180, 360, 6, INK);
  p.poly([[50, 60], [110, 60], [104, 80], [56, 80]], "#3a3a40", 6);
  p.poly([[56, 80], [104, 80], [110, 180], [50, 180]], "#ffd86a", 6);
  p.ell(80, 135, 16, 26, "#fff3b0", 0);
  p.poly([[44, 180], [116, 180], [116, 200], [44, 200]], "#3a3a40", 6);
};
/** a cut rat tail on a 300 x 120 canvas */
export const fxTailCut = (p: Pen) => p.line([[20, 60], [90, 40], [170, 80], [280, 50]], "#e9a3a6", 14);
/** a feed bowl on a 240 x 140 canvas */
export const fxBowl = (p: Pen) => { p.ell(120, 50, 100, 26, "#efe3b8", 6); p.poly([[20, 50], [220, 50], [180, 120], [60, 120]], "#8a6a4a", 7); };
/** a long wooden pointer on a 400 x 60 canvas */
export const fxPointer = (p: Pen) => p.line([[20, 40], [380, 20]], "#7a4f33", 10);

// ================= The Great Stink (London, 1858) =================
/** a soft green stink cloud on a 300 x 240 canvas (drawn with alpha; use as a soft card) */
export const fxHaze = (p: Pen, col = "120,150,60") => {
  for (const [x, y, r, a] of [[110, 150, 80, 0.35], [190, 130, 90, 0.3], [150, 90, 70, 0.28], [220, 170, 60, 0.3], [80, 110, 55, 0.25]] as [number, number, number, number][]) {
    const gr = p.g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    p.g.fillStyle = gr; p.g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
};
/** cartoon stink lines rising (t animates the wiggle) on a 200 x 300 canvas */
export const fxStink = (p: Pen, t: number) => {
  for (const k of [0, 1, 2]) {
    const pts: P2[] = [];
    for (let i = 0; i <= 10; i++) { const y = 280 - i * 26; pts.push([50 + k * 50 + 14 * Math.sin(i * 0.9 + t * 6.28 + k), y]); }
    p.line(pts, "#9ccf4a", 9, true);
  }
};
/** a white handkerchief pressed to the nose, on a 200 x 150 canvas */
export const fxHanky = (p: Pen) => { p.poly([[20, 40], [150, 20], [185, 90], [60, 130]], "#f6f3ea", 6); p.stroke([[50, 70], [160, 55]], 3, "#c9c4b4"); p.stroke([[30, 55], [70, 120]], 3, "#c9c4b4"); };
/** a huge blazing sun on a 400 x 400 canvas */
export const fxSun = (p: Pen, t: number) => {
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + t; p.poly([[200 + Math.cos(a - 0.08) * 120, 200 + Math.sin(a - 0.08) * 120], [200 + Math.cos(a) * 190, 200 + Math.sin(a) * 190], [200 + Math.cos(a + 0.08) * 120, 200 + Math.sin(a + 0.08) * 120]], "#ffcf3f", 0); }
  p.ell(200, 200, 125, 125, "#ffe066", 9); p.ell(200, 200, 95, 95, "#fff3a0", 0);
};
/** a thermometer (Celsius) on a 220 x 600 canvas; v = degrees shown */
export const fxThermo = (p: Pen, v: number) => {
  p.poly(rrect(40, 20, 180, 590, 30), "#f4ecd4", 8);
  p.poly(rrect(95, 60, 125, 480, 14), "#ffffff", 5);
  const top = 480 - (Math.max(0, Math.min(40, v)) / 40) * 410;
  p.poly(rrect(99, top, 121, 482, 10), "#d8343a", 0);
  p.ell(110, 510, 36, 36, "#d8343a", 7);
  for (let d = 0; d <= 40; d += 10) { const y = 480 - (d / 40) * 410; p.stroke([[128, y], [150, y]], 5); TXT(p, `${d}`, 70, y, 26, INK, 800); }
  TXT(p, "°C", 110, 570, 34, INK, 900);
  if (v >= 30) { p.poly(rrect(60, 40, 162, 76, 10), "#d8343a", 0); TXT(p, `${Math.round(v)}°`, 111, 58, 30, "#ffffff", 900); }
};
/** a bucket tipped by tip 0..1 with brown slop, on a 260 x 240 canvas */
export const fxBucket = (p: Pen, tip: number) => {
  p.rot = [-1.4 * tip, 130, 140];
  p.poly([[60, 60], [200, 60], [180, 210], [80, 210]], "#8a8f98", 7);
  p.ell(130, 60, 70, 16, "#5a4020", 6);
  p.arc(130, 40, 70, 50, 200, 340, 6, INK);
  p.rot = null;
};
/** brown slop falling / splashing, on a 200 x 400 canvas */
export const fxSlop = (p: Pen) => { p.poly([[80, 10], [130, 10], [150, 200], [120, 390], [90, 390], [60, 200]], "#6a4a20", 6); for (const [x, y] of [[50, 120], [160, 220], [40, 300]]) p.ell(x, y, 14, 18, "#6a4a20", 5); };
/** a fly on a 120 x 100 canvas; flap 0..1 */
export const fxFly = (p: Pen, flap: number) => {
  for (const s of [-1, 1]) p.ell(60 + s * 22, 36 - 10 * flap, 22, 12, "rgba(220,235,255,0.85)", 4, 0, 360, s * (20 + 30 * flap));
  p.ell(60, 56, 18, 22, "#1d1620", 4); p.dot(52, 44, 5, "#d8343a"); p.dot(68, 44, 5, "#d8343a");
};
/** a desk calendar counting the days, on a 360 x 420 canvas */
export const fxCalendar = (p: Pen, day: number) => {
  p.poly(rrect(20, 40, 340, 400, 18), "#fbf8ef", 8);
  p.poly(rrect(20, 40, 340, 130, 18), "#b8262e", 8);
  TXT(p, "JULY 1858", 180, 86, 40, "#ffffff", 900);
  TXT(p, `${day}`, 180, 255, 150, INK, 900);
  TXT(p, day === 1 ? "DAY" : "DAYS", 180, 360, 40, "#6a6a6a", 800);
  for (const x of [90, 270]) p.ell(x, 40, 14, 22, "#c9ccd4", 5);
};
/** a red LAW PASSED stamp on a 560 x 200 canvas */
export const fxLaw = (p: Pen) => {
  p.rot = [-0.08, 280, 100];
  p.g.lineWidth = 12; p.g.strokeStyle = "#c0262e"; p.g.strokeRect(20, 30, 520, 140);
  TXT(p, "LAW PASSED", 280, 84, 80, "#c0262e", 900);
  TXT(p, "2 AUGUST 1858", 280, 146, 34, "#c0262e", 800);
  p.rot = null;
};
/** Bazalgette's sewer plan unrolling (u 0..1) on a 640 x 420 canvas: the Thames and the intercepting sewers */
export const fxPlan = (p: Pen, u: number) => {
  const w = 40 + 560 * Math.max(0, Math.min(1, u));
  p.clip([[20, 20], [20 + w, 20], [20 + w, 400], [20, 400]], () => {
    p.g.fillStyle = "#1f4f8a"; p.g.fillRect(20, 20, 600, 380);
    p.g.strokeStyle = "rgba(255,255,255,0.12)"; p.g.lineWidth = 2;
    for (let x = 20; x < 620; x += 30) { p.g.beginPath(); p.g.moveTo(x, 20); p.g.lineTo(x, 400); p.g.stroke(); }
    for (let y = 20; y < 400; y += 30) { p.g.beginPath(); p.g.moveTo(20, y); p.g.lineTo(620, y); p.g.stroke(); }
    p.line([[30, 250], [150, 220], [260, 260], [380, 230], [500, 270], [610, 250]], "#7fb3e0", 22, false);
    for (const [dy, c] of [[-70, "#ffffff"], [-120, "#ffffff"], [-170, "#ffffff"], [70, "#ffe066"], [120, "#ffe066"]] as [number, string][]) p.stroke([[40, 240 + dy], [180, 215 + dy * 0.9], [320, 245 + dy], [460, 225 + dy * 0.95], [600, 255 + dy]], 6, c);
    TXT(p, "BAZALGETTE'S PLAN", 320, 52, 34, "#ffffff", 900);
    TXT(p, "INTERCEPTING SEWERS", 320, 382, 24, "#ffe066", 800);
  });
  p.poly([[20, 20], [20 + w, 20], [20 + w, 400], [20, 400]], null, 8);
  p.ell(20 + w, 210, 18, 196, "#2a5a9a", 7);
};
/** a big year counter on a 520 x 220 canvas */
export const fxYear = (p: Pen, y: number) => {
  p.poly(rrect(14, 14, 506, 206, 30), "#1d1620", 8);
  TXT(p, `${y}`, 260, 120, 140, y >= 1875 ? "#ffd23f" : "#ffffff", 900);
};
/** a travelling case on a 260 x 200 canvas */
export const fxCase = (p: Pen) => { p.poly(rrect(20, 50, 240, 190, 16), "#7a4a2a", 7); p.stroke([[20, 110], [240, 110]], 5); p.arc(130, 50, 34, 26, 180, 360, 9); p.dot(130, 110, 9, "#d9b04a"); };
/** a bucket of chloride of lime on a 300 x 280 canvas */
export const fxLime = (p: Pen) => {
  p.poly([[50, 70], [250, 70], [225, 260], [75, 260]], "#9aa0aa", 7); p.ell(150, 70, 100, 20, "#f2f2ea", 6);
  p.poly(rrect(78, 120, 222, 200, 8), "#fbf8ef", 4);
  TXT(p, "CHLORIDE", 150, 145, 24, INK, 900); TXT(p, "OF LIME", 150, 178, 24, INK, 900);
};
/** a brown waste stream from a pipe, on a 200 x 500 canvas (t animates) */
export const fxOutflow = (p: Pen, t: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 10; i++) pts.push([100 + 12 * Math.sin(i * 0.8 + t * 6.28), 20 + i * 46]);
  p.line(pts, "#6a4a20", 46, true);
  p.ell(100, 480, 80, 18, "#7a5a2a", 5);
};
/** dark wet patch spreading on a curtain, on a 200 x 400 canvas */
export const fxWet = (p: Pen, k: number) => { const gr = p.g.createRadialGradient(100, 200, 0, 100, 200, 190 * k + 1); gr.addColorStop(0, "rgba(200,230,200,0.55)"); gr.addColorStop(1, "rgba(200,230,200,0)"); p.g.fillStyle = gr; p.g.fillRect(0, 0, 200, 400); };

// ================= Voicemail From Tomorrow: Mara (detailed 2D character) =================
// Drawn on the 600 x 1000 character card, feet on y 975 (1.66 m tall: top of the hair at y ~205).
// Clean ink outline (constant), two-tone cel shading on the side away from `key` (-1 = key from screen left, +1 right),
// an optional coloured rim on the lit edge and a painted practical glow (the phone from below).
export type MaraPose = "idle" | "phoneEar" | "phoneLook" | "chest" | "laugh" | "twoHands" | "walk" | "sit" | "back" | "backPhone";
export type MaraExpr = "neutral" | "listen" | "fear" | "shock" | "cry" | "laugh" | "evil" | "tired";
export type MaraOpts = { pose: MaraPose; expr?: MaraExpr; lookX?: number; lookY?: number; blink?: number; key?: number; rim?: string;
  glow?: number; phone?: boolean; screen?: boolean; phase?: number; tilt?: number; tear?: number };
const M_SKIN = "#f2cdb4", M_SKIN_S = "#d9a993", M_HAIR = "#4a2c22", M_HAIR_S = "#33201a", M_HAIR_HI = "#7d8aa0";
const M_CARD = "#c9a23f", M_CARD_S = "#9c7a2a", M_TEE = "#2c2c33", M_JEAN = "#3a3d4a", M_JEAN_S = "#2b2d38", M_SOCK = "#8a8a90";
const M_EYE = "#7d9a8c", M_LIP = "#c4707a", M_BROW = "#3a2a22";
/** sleeve + hand: shoulder -> elbow -> hand, a tapered cardigan sleeve with a ribbed cuff, a mitten hand with a thumb */
const maraArm = (p: Pen, pts: P2[], hand: P2, lit: boolean) => {
  const all = [...pts, hand], n = all.length, e = all[n - 2];
  const dx = hand[0] - e[0], dy = hand[1] - e[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const cuff: P2 = [hand[0] - ux * 20, hand[1] - uy * 20];
  p.line([...pts, cuff], lit ? M_CARD : M_CARD_S, 34);
  p.line([[cuff[0] - ux * 12, cuff[1] - uy * 12], cuff], lit ? M_CARD_S : "#86681f", 38);
  for (const k of [-10, -4, 2]) p.stroke([[cuff[0] + ux * k - uy * 16, cuff[1] + uy * k + ux * 16], [cuff[0] + ux * k + uy * 16, cuff[1] + uy * k - ux * 16]], 1.6, "rgba(60,40,10,0.45)");
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  p.ell(hand[0] - uy * 9, hand[1] + ux * 9, 7, 11, M_SKIN, 3, 0, 360, ang + 40);
  p.ell(hand[0], hand[1], 13, 17, M_SKIN, 3.5, 0, 360, ang - 90);
  p.stroke([[hand[0] + ux * 6 - uy * 5, hand[1] + uy * 6 + ux * 5], [hand[0] + ux * 13, hand[1] + uy * 13]], 1.6, M_SKIN_S);
};
const maraPhone = (p: Pen, x: number, y: number, ang: number, screen: boolean) => {
  p.rot = [ang, x, y];
  p.poly(rrect(x - 17, y - 34, x + 17, y + 34, 7), "#141418", 4);
  if (screen) p.poly(rrect(x - 13, y - 29, x + 13, y + 29, 5), "#cfe6ff", 0);
  p.stroke([[x - 12, y + 22], [x - 4, y + 12]], 1.5, "#ffffff");
  p.rot = null;
};
const maraFace = (p: Pen, o: MaraOpts, cx: number, cy: number) => {
  const e = o.expr ?? "neutral", lx = (o.lookX ?? 0) * 7, ly = (o.lookY ?? 0) * 5, bl = o.blink ?? 0;
  const wide = e === "shock" ? 1.35 : e === "fear" ? 1.22 : e === "listen" ? 1.1 : e === "tired" ? 0.7 : e === "cry" ? 0.9 : 1;
  for (const s of [-1, 1]) {
    const ex = cx + s * 33, ey = cy - 2;
    // brows
    const inner = e === "fear" || e === "cry" || e === "shock" ? -9 : e === "evil" ? 3 : 0, outer = e === "shock" ? -10 : e === "fear" ? -2 : e === "cry" ? 4 : 0;
    p.stroke([[ex - s * 4 - s * 2, ey - 30 + inner], [ex + s * 20, ey - 29 + outer]], 5.5, M_BROW);
    if (e === "laugh" || bl >= 0.8) { p.arc(ex, ey + 2, 17, e === "laugh" ? 9 : 5, e === "laugh" ? 200 : 15, e === "laugh" ? 340 : 165, 4.5, INK); continue; }
    const ry = 13 * wide * (1 - 0.85 * bl), rx = 19;
    // almond eye: white, iris, pupil, catch-light, heavy upper lash line
    const al: P2[] = []; for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI * 2; al.push([ex + rx * Math.cos(t), ey + (Math.sin(t) < 0 ? ry * 1.05 : ry * 0.8) * Math.sin(t) - s * 1.5 * Math.cos(t)]); }
    p.clip(al, () => {
      p.ell(ex, ey, rx + 2, ry + 2, "#fbf7f2", 0);
      p.ell(ex + lx, ey + ly + 1, 11, 11, M_EYE, 0);
      p.ell(ex + lx, ey + ly + 1, 11, 11, null, 1.5);
      const pr = e === "evil" ? 2.4 : e === "shock" ? 3.8 : 5.4;
      p.dot(ex + lx, ey + ly + 1, pr, INK);
      if (e !== "evil") p.dot(ex + lx + 4, ey + ly - 3, 3, "#ffffff");
      if (e === "cry") p.ell(ex, ey + ry * 0.6, rx, 4, "rgba(220,240,255,0.7)", 0);
    });
    p.poly(al, null, 2.5);
    const top: P2[] = []; for (let i = 0; i <= 10; i++) { const t = Math.PI + (i / 10) * Math.PI; top.push([ex + (rx + 1) * Math.cos(t), ey + ry * 1.05 * Math.sin(t) - s * 1.5 * Math.cos(t)]); }
    p.stroke(top, 4.5, INK);
    p.stroke([[ex + s * (rx - 1), ey - 3], [ex + s * (rx + 6), ey - 8]], 3, INK);
  }
  // freckles, nose, blush
  for (let i = 0; i < 7; i++) p.dot(cx - 18 + i * 6, cy + 18 + (i % 2) * 3, 1.3, "#b97f68");
  p.stroke([[cx + 2, cy + 6], [cx + 5, cy + 22], [cx - 2, cy + 26]], 2.6, "#9a6a58");
  for (const s of [-1, 1]) p.ell(cx + s * 40, cy + 26, 13, 7, "rgba(230,120,120,0.22)", 0);
  // mouth
  const my = cy + 46;
  if (e === "shock") { p.ell(cx, my + 4, 10, 14, "#5a1f2a", 3); }
  else if (e === "fear" || e === "cry") { p.poly([[cx - 13, my + 2], [cx, my - 3], [cx + 13, my + 2], [cx + 8, my + 8], [cx - 8, my + 8]], "#5a1f2a", 2.5); p.stroke([[cx - 10, my + 9], [cx + 10, my + 9]], 3, M_LIP); }
  else if (e === "laugh") { p.poly([[cx - 18, my - 2], [cx + 18, my - 4], [cx + 8, my + 10], [cx - 8, my + 10]], "#5a1f2a", 2.5); p.poly([[cx - 12, my - 2], [cx + 12, my - 3], [cx + 10, my + 2], [cx - 10, my + 2]], "#ffffff", 0); }
  else if (e === "evil") { p.stroke([[cx - 16, my + 1], [cx - 2, my + 3], [cx + 12, my - 2], [cx + 20, my - 9]], 3.2, INK); p.stroke([[cx - 6, my + 7], [cx + 8, my + 5]], 2.6, M_LIP); }
  else { p.stroke([[cx - 13, my], [cx, my + 2], [cx + 13, my]], 3, INK); p.stroke([[cx - 8, my + 7], [cx + 8, my + 7]], 3, M_LIP); }
  if ((o.tear ?? 0) > 0) p.line([[cx - 38, cy + 6], [cx - 40, cy + 6 + 40 * (o.tear ?? 0)]], "rgba(200,230,255,0.9)", 4, false);
};
export const drawMara = (p: Pen, o: MaraOpts) => {
  const key = o.key ?? 1, pose = o.pose, back = pose === "back" || pose === "backPhone", sit = pose === "sit";
  const ph = (o.phase ?? 0) * Math.PI * 2, bob = pose === "walk" ? 4 * Math.abs(Math.sin(ph)) : 0;
  const dy = sit ? 250 : -bob, tilt = (o.tilt ?? 0) * Math.PI / 180;
  const cx = 300, hy = 300 + dy;
  // ---- legs + socks ----
  const legs = () => {
    if (sit) {
      for (const s of [-1, 1]) {
        const col = s === key ? M_JEAN : M_JEAN_S, kx = 300 + s * 52, ky = 770;
        p.line([[300 + s * 30, 900], [kx, ky]], col, 58);
        p.line([[kx, ky], [300 + s * 64, 945]], col, 50);
        p.ell(300 + s * 68, 958, 34, 17, M_SOCK, 5);
      }
      return;
    }
    for (const s of [-1, 1]) {
      const lift = pose === "walk" ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 22 : 0;
      const hipX = 300 + s * 27, footY = 960 - lift, col = s === key ? M_JEAN : M_JEAN_S;
      p.poly([[hipX - 28, 640], [hipX + 28, 640], [hipX + s * 6 + 21, 800], [hipX + s * 6 + 19, footY - 22], [hipX + s * 6 - 19, footY - 22], [hipX + s * 6 - 21, 800]], col, 6);
      p.stroke([[hipX + s * 2 - 8, 790], [hipX + s * 2 + 6, 806]], 2, "rgba(0,0,0,0.3)");
      p.stroke([[hipX - 4, 650], [hipX + s * 6, footY - 30]], 1.5, "rgba(255,255,255,0.08)");
      p.ell(hipX + s * 8, footY - 4, 31, 16, M_SOCK, 5);
      p.stroke([[hipX + s * 8 - 18, footY - 12], [hipX + s * 8 + 18, footY - 12]], 1.4, "rgba(0,0,0,0.25)");
    }
  };
  if (!sit) legs();
  // ---- torso: tee + oversized cardigan ----
  const sh = 418 + dy, hem = 660 + dy;
  const body: P2[] = [[cx - 98, sh + 18], [cx - 60, sh - 6], [cx + 60, sh - 6], [cx + 98, sh + 18], [cx + 112, hem], [cx - 112, hem]];
  p.poly(body, M_CARD, 6);
  p.clip(body, () => {
    p.g.fillStyle = M_CARD_S; p.g.fillRect(key > 0 ? cx - 130 : cx + 30, sh - 20, 100, 300);
    for (let x = cx - 110; x < cx + 112; x += 14) p.stroke([[x, sh], [x + 2, hem]], 1.6, "rgba(90,60,20,0.25)");
    if (!back) {
      p.poly([[cx - 34, sh - 4], [cx + 34, sh - 4], [cx + 26, hem], [cx - 26, hem]], M_TEE, 0);
      for (const s of [-1, 1]) { p.poly([[cx + s * 34, sh - 6], [cx + s * 48, sh - 6], [cx + s * 40, hem], [cx + s * 26, hem]], s === key ? "#b38d32" : "#8a6c22", 2.5); for (let y = sh + 10; y < hem; y += 12) p.stroke([[cx + s * 30, y], [cx + s * 44, y + 2]], 1.2, "rgba(60,40,10,0.4)"); }
      for (let i = 0; i < 4; i++) { p.dot(cx - 39, sh + 40 + i * 52, 4.5, "#5a4632"); p.dot(cx - 40, sh + 39 + i * 52, 1.5, "#c9b48a"); }
      for (const s of [-1, 1]) p.poly(rrect(cx + s * 72 - 30, hem - 96, cx + s * 72 + 30, hem - 44, 8), null, 2.5);
    }
    p.g.fillStyle = "rgba(90,60,20,0.35)"; p.g.fillRect(cx - 120, hem - 26, 240, 26);
    for (let x = cx - 116; x < cx + 116; x += 7) p.stroke([[x, hem - 24], [x, hem]], 1, "rgba(60,40,10,0.35)");
  });
  p.poly(body, null, 6);
  // ---- neck, headphones ----
  p.poly([[cx - 18, hy + 70], [cx + 18, hy + 70], [cx + 20, sh + 6], [cx - 20, sh + 6]], M_SKIN, 4);
  if (!back) { p.arc(cx, sh + 2, 46, 20, 10, 170, 9, "#1b1b20"); for (const s of [-1, 1]) p.ell(cx + s * 46, sh + 6, 15, 19, "#1b1b20", 3); p.line([[cx + 46, sh + 22], [cx + 54, sh + 110], [cx + 40, sh + 160]], "#b8262e", 4, false); }
  // ---- arms by pose ----
  const SL: P2 = [cx - 96, sh + 22], SR: P2 = [cx + 96, sh + 22];
  const armL = (el: P2, h: P2) => maraArm(p, [SL, el], h, key < 0);
  const armR = (el: P2, h: P2) => maraArm(p, [SR, el], h, key > 0);
  const down = () => { armL([cx - 120, sh + 150], [cx - 116, sh + 210]); armR([cx + 120, sh + 150], [cx + 116, sh + 210]); };
  if (pose === "idle" || pose === "back" || pose === "walk") down();
  else if (pose === "sit") { legs(); armL([cx - 118, sh + 70], [cx - 40, 790]); armR([cx + 118, sh + 70], [cx + 40, 790]); }
  const drawPhoneArmEar = () => { armL([cx - 140, sh + 70], [cx - 84, hy + 20]); if (o.phone !== false) maraPhone(p, cx - 82, hy + 18, -0.35, !!o.screen); };
  // ---- head ----
  p.rot = tilt ? [tilt, cx, hy + 90] : null;
  // hair back layer
  const hairBack: P2[] = []; for (let i = 0; i <= 24; i++) { const t = Math.PI + (i / 24) * Math.PI; hairBack.push([cx + 104 * Math.cos(t), hy - 10 + 104 * Math.sin(t)]); }
  hairBack.push([cx + 106, hy + 60], [cx + 92, hy + 78], [cx - 92, hy + 78], [cx - 106, hy + 60]);
  p.poly(hairBack, M_HAIR_S, 6);
  p.clip(hairBack, () => { for (let k = -4; k <= 4; k++) p.stroke([[cx + k * 6, hy - 110], [cx + k * 24, hy - 40], [cx + k * 25, hy + 80]], 1.8, "rgba(0,0,0,0.25)"); });
  if (!back) {
    const face: P2[] = []; for (let i = 0; i <= 28; i++) { const t = (i / 28) * Math.PI * 2; const r = Math.sin(t) > 0 ? 1 - 0.18 * Math.sin(t) ** 3 : 1; face.push([cx + 78 * Math.cos(t), hy + 88 * r * Math.sin(t)]); }
    p.poly(face, M_SKIN, 5);
    p.clip(face, () => { const gr = p.g.createLinearGradient(cx - key * 80, 0, cx + key * 10, 0); gr.addColorStop(0, M_SKIN_S); gr.addColorStop(0.55, "rgba(217,169,147,0.5)"); gr.addColorStop(1, "rgba(217,169,147,0)"); p.g.fillStyle = gr; p.g.fillRect(cx - 90, hy - 100, 180, 200); });
    p.poly(face, null, 5);
    for (const s of [-1, 1]) p.ell(cx + s * 78, hy + 6, 10, 16, M_SKIN, 4);
    maraFace(p, o, cx, hy);
    // bangs: centre part, two curtains, the loose strands by the left ear
    for (const s of [-1, 1]) {
      const cur: P2[] = [[cx + s * 4, hy - 92], [cx + s * 60, hy - 86], [cx + s * 100, hy - 30], [cx + s * 104, hy + 64], [cx + s * 86, hy + 70], [cx + s * 80, hy - 6], [cx + s * 46, hy - 58]];
      p.poly(cur, s === key ? M_HAIR : M_HAIR_S, 6);
      p.clip(cur, () => { p.stroke([[cx + s * 36, hy - 78], [cx + s * 84, hy - 20], [cx + s * 96, hy + 40]], 7, M_HAIR_HI); p.stroke([[cx + s * 20, hy - 84], [cx + s * 74, hy - 30], [cx + s * 90, hy + 50]], 2, "rgba(0,0,0,0.3)"); });
    }
    p.line([[cx - 82, hy + 4], [cx - 90, hy + 50], [cx - 84, hy + 82]], M_HAIR, 7);
  } else {
    p.poly(hairBack, M_HAIR, 6);
    p.clip(hairBack, () => {
      p.g.fillStyle = M_HAIR_S; p.g.beginPath(); p.g.ellipse(cx - key * 70, hy, 50, 120, 0, 0, 7); p.g.fill();
      for (let k = -4; k <= 4; k++) p.stroke([[cx + k * 5, hy - 112], [cx + k * 22, hy - 30], [cx + k * 24, hy + 80]], 2, "rgba(0,0,0,0.3)");
      p.stroke([[cx + key * 30, hy - 96], [cx + key * 70, hy - 20], [cx + key * 80, hy + 50]], 8, M_HAIR_HI);
    });
    p.poly(hairBack, null, 6);
    p.arc(cx, sh - 10, 50, 16, 200, 340, 9, "#1b1b20");
  }
  p.rot = null;
  // arms that pass in front of the body
  if (pose === "phoneEar") { drawPhoneArmEar(); armR([cx + 120, sh + 150], [cx + 116, sh + 210]); }
  else if (pose === "chest") { drawPhoneArmEar(); armR([cx + 120, sh + 110], [cx + 26, sh + 60]); }
  else if (pose === "twoHands") { armL([cx - 140, sh + 70], [cx - 84, hy + 28]); armR([cx + 60, sh + 130], [cx - 60, hy + 50]); maraPhone(p, cx - 82, hy + 20, -0.35, !!o.screen); }
  else if (pose === "phoneLook") { armL([cx - 110, sh + 150], [cx - 24, sh + 120]); armR([cx + 110, sh + 150], [cx + 24, sh + 120]); maraPhone(p, cx, sh + 104, Math.PI / 2, !!o.screen); }
  else if (pose === "laugh") { armL([cx - 120, sh + 150], [cx - 116, sh + 210]); armR([cx + 130, sh + 90], [cx + 18, hy + 50]); }
  else if (pose === "backPhone") { maraArm(p, [SR, [cx + 140, sh + 70]], [cx + 84, hy + 20], key > 0); armL([cx - 120, sh + 150], [cx - 116, sh + 210]); }
  // ---- painted light: rim on the lit edge, practical glow from the phone below ----
  if (o.rim) {
    const arc: P2[] = []; for (let i = 0; i <= 10; i++) { const t = -Math.PI / 2 + key * (i / 10) * Math.PI / 2; arc.push([cx + 104 * Math.cos(t) * (key > 0 ? 1 : 1), hy - 10 + 104 * Math.sin(t)]); }
    p.stroke(arc.map(([x, y]) => [key > 0 ? x : 2 * cx - (2 * cx - x), y] as P2), 4, o.rim);
    p.stroke([[cx + key * 106, hy + 10], [cx + key * 106, hy + 60]], 4, o.rim);
    p.stroke([[cx + key * 98, sh + 20], [cx + key * 112, hem - 6]], 4, o.rim);
  }
  if ((o.glow ?? 0) > 0) {
    const g = p.g; g.save(); g.globalCompositeOperation = "source-atop";
    const gy = pose === "phoneLook" ? sh + 104 : hy + 30, gx = pose === "phoneLook" ? cx : cx - 80;
    const gr = g.createRadialGradient(gx, gy, 10, gx, gy, 260); gr.addColorStop(0, `rgba(170,215,255,${0.5 * (o.glow ?? 0)})`); gr.addColorStop(1, "rgba(170,215,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 600, 1000); g.restore();
  }
};
