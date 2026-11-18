// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxRing, fxFish, fxCreak, fxStrip, fxBasket, fxBarrel, fxGold, fxPrice, fxOwe,
  townsfolk, Outfit, FrontOpts, SideOpts, ROD_TIP, BASKET_HOLES, BASKET_HAND, KB,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, smooth, P1, P2, P3, P1S, P3S, WATER_Y, BOARD, J1, J3, LEND, LEND3, BAR2, BAR3, CROWD, ROW,
  lenderInX, collectX, COLLECTZ,
} from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: a few shapes so canvases can be shared */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design], sized for a 1080 x 1920 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1350, 2250, 2.25] : d < 6.5 ? [810, 1350, 1.35] : d < 16 ? [360, 600, 0.6] : [180, 300, 0.3];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return { key, x, y, z, scale, mirror, draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)), size: [w, h, k] };
};

const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- helpers for this film ----------------
const front = { side: false, mirror: false };
/** a standing / sitting front-view character plus its ground blob */
const stand = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, t: number, scale = 1, shadow = true) => {
  out.places.push(person(cam, who, p[0], p[1], p[2], front, { blink: fo.blink ?? lidAt(t, who.i), ...fo }, {}, scale));
  if (shadow) blob(out, p[0], D0, p[2], scale * (fo.mode === "sit" ? 1.15 : 1));
};
/** world point at screen offset (dx right, dy up) from a card standing at p, facing the camera */
const onCard = (cam: CamInfo, p: V3, dx: number, dy: number): V3 => [p[0] + cam.right.x * dx, p[1] + dy, p[2] + cam.right.z * dx];
/** world point of a design-space point (x, y in the 600 x 1000 canvas) on the card standing at p */
const design = (cam: CamInfo, p: V3, x: number, y: number, s = 1): V3 => onCard(cam, p, (x - 300) * SU * s, (975 - y) * SU * s);
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft });
const flat = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft, flat: true });
const burst = (out: Stage, at: V3, u: number, size: number, col = "#fff3b0") => { const uu = q(u, 30); fxCard(out, `burst${col}${uu}`, 500, 500, (p) => fxBurst(p, uu, col), at, size, size); };
/** ballistic point: from a to b with apex height h above the higher end */
const arc = (a: V3, b: V3, u: number, h: number): V3 => {
  const k = clamp01(u), top = Math.max(a[1], b[1]) + h;
  const y = a[1] + (b[1] - a[1]) * k + 4 * (top - (a[1] + b[1]) / 2) * k * (1 - k);
  return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
};
const fish = (out: Stage, at: V3, f: number, s = 0.36, rot = 0, i = 0) => { const b = q(Math.sin(f * 0.9 + i * 1.7), 4); fxCard(out, `fish${b}`, 240, 120, (p) => fxFish(p, b), at, s, s / 2, rot); };
const T = (f: number) => f / FPS;
/** a thin line / rope between two world points (a screen-facing strip; fine for lines seen roughly side-on) */
const strip = (out: Stage, cam: CamInfo, a: V3, b: V3, w: number, col: string) => {
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  // screen-plane angle: project the direction on the camera's right and up
  const r = cam.right, sx = d[0] * r.x + d[2] * r.z, sy = d[1];
  const ang = Math.atan2(sx, sy);
  const along = Math.hypot(sx, sy) || 0.001;
  fxCard(out, `strip${col}`, 8, 64, (p) => fxStrip(p, col), mid, w, Math.min(L, along * 1.02 + 0.02), -ang);
};
const LINE = "#3a2f36";
/** the fishing line from the rod tip of a standing card at p down to the water at `to` (a slight sag) */
const fishingLine = (out: Stage, cam: CamInfo, p: V3, to: V3) => {
  const tip = design(cam, p, ROD_TIP[0], ROD_TIP[1]);
  const m: V3 = [(tip[0] + to[0]) / 2, (tip[1] + to[1]) / 2 - 0.25, (tip[2] + to[2]) / 2];
  strip(out, cam, tip, m, 0.022, LINE); strip(out, cam, m, to, 0.022, LINE);
  flat(out, "ringStill", 600, 600, (pp) => fxRing(pp, 0.35), [to[0], WATER_Y + 0.01, to[2]], 0.6, 0.6);
};
const waterBelow = (p: V3, dz = 2.6, dx = 0.9): V3 => [p[0] + dx, WATER_Y, p[2] - dz];

// ---------------- the cast ----------------
const SK = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
/** the same three men as the net episode: the first (patched grey-brown shirt, cap), the second (blue shirt, moustache),
 *  the third (green shirt, straw-yellow cap) */
export const MAN1: Outfit = { jacket: "#8a7a66", pants: "#4a4552", boots: "#3a2a22", hat: "cap", cap: "#5a5f6e", skin: SK[1] };
export const MAN2: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3b2a", skin: SK[0], moustache: "#5a3b2a" };
export const MAN3: Outfit = { jacket: "#3f8f5a", pants: "#5a4636", boots: "#3a2a22", hat: "cap", cap: "#e0b648", skin: SK[2] };
const W1: Who = { i: 11, o: MAN1, okey: "m1" }, W2: Who = { i: 12, o: MAN2, okey: "m2" }, W3: Who = { i: 13, o: MAN3, okey: "m3" };
const TOWN: Who[] = [0, 1, 2, 3].map((v) => ({ i: 20 + v, o: townsfolk(v + 2), okey: `t${v}` }));

const handOf = (cam: CamInfo, p: V3): V3 => onCard(cam, p, 0.42, 1.55);
const UNDER: V3 = [J1[0] - 0.29, D0, J1[2] - 0.03];
const hold = (fill: number, holes: number): FrontOpts["prop"] => ["basket", q(fill, 10), holes];
/** world point of a hole of the basket held by the standing card at p */
const holeAt = (cam: CamInfo, p: V3, i: number): V3 => { const [ox, oy] = BASKET_HOLES[i % BASKET_HOLES.length]; return design(cam, p, BASKET_HAND[0] + ox * KB, BASKET_HAND[1] + oy * KB); };
/** world point on a camera-facing card centred at c (w x h metres on a cw x ch canvas) */
const cardPt = (cam: CamInfo, c: V3, cw: number, ch: number, w: number, h: number, x: number, y: number): V3 =>
  onCard(cam, c, ((x - cw / 2) / cw) * w, ((ch / 2 - y) / ch) * h);
/** a basket standing on the deck at p (w = 0.5 m card; its bottom on the boards) */
const BW = 0.5;
const deckBasket = (out: Stage, p: V3, fill: number, holes: number, sc = 1) => {
  const w = BW * sc, ff = q(fill, 10);
  fxCard(out, `basket${ff}|${holes}`, 400, 400, (pp) => fxBasket(pp, ff, holes), [p[0], D0 + 0.22 * sc, p[2]], w, w);
};
/** the holes of a deck basket in the world */
const deckHole = (cam: CamInfo, p: V3, i: number, sc = 1): V3 => {
  const [hx, hy] = BASKET_HOLES[i % BASKET_HOLES.length];
  return cardPt(cam, [p[0], D0 + 0.22 * sc, p[2]], 400, 400, BW * sc, BW * sc, 200 + hx * 1.85, 30 + hy * 1.85);
};
const barrel = (out: Stage, p: V3, fill: number) => { const ff = q(fill, 14); fxCard(out, `barrel${ff}`, 360, 440, (pp) => fxBarrel(pp, ff), [p[0], D0 + 0.345, p[2]], 0.62, 0.76); };
const smallFish = (out: Stage, at: V3, f: number, rot: number, i = 0) => fish(out, at, f, 0.2, rot, i);
/** a fish falling from `from` to height y1 over n frames starting at f0; then (rest) lying flat on the boards */
const drop = (out: Stage, f: number, f0: number, from: V3, y1: number, i: number, rest = true, n = 7, dx = 0) => {
  if (f < f0) return;
  const u = (f - f0) / n;
  if (u < 1) smallFish(out, [from[0] + dx * u, from[1] - (from[1] - y1) * u * u, from[2] - 0.02], f, -Math.PI / 2 + 0.5 * Math.sin(i * 2.1 + f * 0.4), i);
  else if (rest) flat(out, `fishflat${i % 3}`, 240, 120, (pp) => fxFish(pp, [0.4, -0.5, 0.1][i % 3]), [from[0] + dx, D0 + 0.025, from[2] - 0.06 * (i % 3)], 0.2, 0.1, i * 1.9);
};
/** a held, holed basket that loses a fish at each frame in `drops` (from hole k % holes); fish land on the deck */
const leaks = (out: Stage, cam: CamInfo, p: V3, holes: number, drops: number[], f: number, rest = true, y1 = D0 + 0.02) => {
  drops.forEach((d, k) => { if (holes > 0) drop(out, f, d, holeAt(cam, p, k % holes), y1, k, rest); });
};
const every = (a: number, b: number, n: number) => { const r: number[] = []; for (let x = a; x < b; x += n) r.push(Math.round(x)); return r; };
const pop = (out: Stage, at: V3, f: number, f0: number, size = 0.6, col = "#fff3b0") => { if (f >= f0 && f < f0 + 8) burst(out, at, (f - f0) / 8, size, col); };

// ---------------- this episode ----------------
const LENDER: Outfit = { jacket: "#2b2a3a", pants: "#2c2a35", boots: "#2a2230", hat: "tophat", buttons: "#e8c45a", build: "stout", moustache: "#4a3020", skin: "#f5c9a0" };
const WL: Who = { i: 30, o: LENDER, okey: "lender" };
const ROWW: Who[] = [...TOWN, { i: 24, o: townsfolk(6), okey: "t4" }];
const gold = (n: number): FrontOpts["prop"] => (n > 0 ? ["gold", n] : null);
/** the price board on its post: n baskets per golden fish, trend 1 / -1, or a question mark */
const board = (out: Stage, n: number, trend: number, ask = false) =>
  fxCard(out, `price${n}|${trend}|${ask}`, 520, 640, (pp) => fxPrice(pp, n, trend, ask), [BOARD[0], D0 + 0.953, BOARD[2]], 1.55, 1.907);
const boardPt = (cam: CamInfo, x: number, y: number): V3 => cardPt(cam, [BOARD[0], D0 + 0.953, BOARD[2]], 520, 640, 1.55, 1.907, x, y);
const goldCard = (out: Stage, at: V3, f: number, w = 0.6, rot = 0) => { const k = q((f / 30) % 1, 12); fxCard(out, `gold${k}`, 300, 200, (pp) => fxGold(pp, k), at, w, w * 2 / 3, rot); };
/** a small heap of full baskets standing on the boards (the twenty borrowed baskets) */
const heap = (out: Stage, p: V3) => {
  for (const [dx, dz, up] of [[-0.26, 0, 0], [0.26, 0, 0], [0, 0.05, 0.36]] as const) {
    fxCard(out, "basket0.8|0", 400, 400, (pp) => fxBasket(pp, 0.8, 0), [p[0] + dx, D0 + 0.22 + up, p[2] + dz - 0.01 * up], BW, BW);
  }
};
const flyGold = (out: Stage, f: number, f0: number, n: number, a: V3, b: V3, h = 0.5) => { if (f >= f0 && f < f0 + n) goldCard(out, arc(a, b, (f - f0) / n, h), f, 0.34, (f - f0) * 0.3); };

// ---------------- staging per shot ----------------
const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 1) {
    // the hook: the price board falling from 8 to 4
    const n = Math.round(8 - 4 * clamp01((f - 14) / 28));
    board(out, n, -1);
    if (f >= 42) pop(out, boardPt(cam, 322, 124), f, 42, 0.7, "#ffffff");
  } else if (id === 2) {
    // some people lost everything: the first man on his crate, empty-handed
    stand(out, cam, W1, P1S, { mode: "sit", expr: f < 138 ? "sad" : "pained", look: 0, headTilt: f > 138 ? -6 : 0 }, t);
  } else if (id === 3) {
    // others didn't even blink: the third man on his crate, his one golden fish, eyes wide open
    stand(out, cam, W3, P3S, { mode: "sit", expr: "smile", prop: gold(1), blink: 0, look: 0 }, t);
  } else if (id === 4) {
    // one golden fish explains it
    stand(out, cam, W3, P3, { mode: "stand", expr: f < 215 ? "smile" : "grin", wave: 1, look: 0 }, t);
    const hand = onCard(cam, P3, 0.46, 2.25), u = clamp01((f - 209) / 6);
    goldCard(out, [hand[0], hand[1] - 0.12, hand[2] - 0.05], f, 0.62 + 0.08 * u);
    pop(out, [hand[0], hand[1] - 0.1, hand[2] - 0.2], f, 209, 1.3);
  } else if (id === 5) {
    // everyone wants the golden fish; every week its price goes up
    const n = f < 344 ? 3 : f < 364 ? 4 : f < 380 ? 6 : 8;
    board(out, n, 1);
    for (const g of [344, 364, 380]) pop(out, boardPt(cam, 322, 124), f, g, 0.6);
    CROWD.forEach((p, k) => stand(out, cam, TOWN[k], p, { mode: "stand", expr: f > 330 ? "grin" : "smile", look: 0, wave: f > 300 && k % 2 ? q(0.5 + 0.5 * Math.sin(f * 0.4 + k), 4) : undefined }, t));
    [W1, W2, W3].forEach((w, k) => stand(out, cam, w, [P1, P2, P3][k], { mode: "stand", expr: k === 0 ? "grin" : k === 1 ? "neutral" : "smile", look: 0 }, t));
  } else if (id === 6) {
    // the first man borrows twenty baskets and buys golden fish at the top
    const lent = f >= 484, bought = f >= 532;
    stand(out, cam, W1, J1, { mode: "stand", expr: f < 465 ? "grin" : bought ? "laugh" : "smile", prop: gold(bought ? 3 : 0), wave: !bought && f < 465 ? q(0.5 + 0.5 * Math.sin(f * 0.5), 4) : undefined, look: lent && !bought ? -1 : 0 }, t);
    stand(out, cam, WL, LEND, { mode: "stand", expr: lent ? "smile" : "neutral", look: 1, prop: f < 484 ? hold(1, 0) : null }, t);
    if (lent && !bought) { heap(out, [J1[0] + 0.8, D0, J1[2] + 0.1]); pop(out, [J1[0] + 0.8, D0 + 0.6, J1[2] - 0.1], f, 484, 0.9); }
    pop(out, handOf(cam, J1), f, 532, 1.0);
    pop(out, handOf(cam, J1), f, 561, 0.8, "#ffffff");
  } else if (id === 7) {
    // the second man: a silly fish; he buys none
    stand(out, cam, W2, P2, { mode: "stand", expr: f < 613 ? "neutral" : f < 635 ? "laugh" : "stern", look: f >= 637 && f < 660 ? q(Math.sin((f - 637) * 0.55), 2) : 0 }, t);
  } else if (id === 8) {
    // the third man buys just one, with fish he can afford to lose; the lender offers, he shakes his head
    stand(out, cam, W3, P3, { mode: "stand", expr: f < 703 ? "neutral" : f < 765 ? "smile" : f < 795 ? "stern" : "smile", prop: gold(f >= 703 ? 1 : 0), look: f >= 772 && f < 796 ? q(Math.sin((f - 772) * 0.55), 2) : 0 }, t);
    barrel(out, BAR3, 0.9);
    pop(out, handOf(cam, P3), f, 703, 0.8);
    if (f >= 762) stand(out, cam, WL, LEND3, { mode: "stand", expr: f < 790 ? "smile" : "neutral", prop: hold(1, 0), look: -1 }, t);
  } else if (id === 9) {
    // one morning, the price falls by half
    const down = f >= 837;
    board(out, down ? 4 : 8, down ? -1 : 1);
    pop(out, boardPt(cam, 322, 124), f, 837, 1.2, "#ffffff");
  } else if (id === 10) {
    if (f < 908) stand(out, cam, W2, P2, { mode: "stand", expr: "laugh", look: 0, tilt: 3 * Math.sin(f * 0.6) }, t);
    else stand(out, cam, W3, P3S, { mode: "sit", expr: f < 937 ? "smile" : "smile_closed", prop: gold(1), look: 0, headTilt: f >= 926 && f < 940 ? 8 : 0 }, t);
  } else if (id === 11) {
    // the lender walks up: pay me back, today
    const x = lenderInX(f), walking = f > 965 && f < 1001;
    stand(out, cam, W1, J1, { mode: "stand", expr: f < 1006 ? "smile" : f < 1022 ? "shock" : "nervous", prop: gold(3), look: f >= 990 ? -1 : 0 }, t);
    stand(out, cam, WL, [x, D0, LEND[2]], { mode: walking ? "stroll" : "stand", phase: q(((f - 965) / FPS * 0.9) % 1, 24), expr: "stern", look: 1 }, t);
    if (f >= 1022) { const s = Math.min(1, 0.4 + 0.6 * (f - 1022) / 5); fxCard(out, "owe", 560, 300, fxOwe, onCard(cam, LEND, -0.4, 2.18), 0.95 * s, 0.51 * s); }
  } else if (id === 12) {
    // worth half; he sells every one, at the bottom, to the third man
    const gave = [1125, 1144, 1156].filter((g) => f >= g + 10).length;
    stand(out, cam, W1, J1, { mode: "stand", expr: f < 1117 ? "nervous" : f < 1170 ? "pained" : "sad", prop: gold(3 - [1125, 1144, 1156].filter((g) => f >= g).length), look: 1 }, t);
    stand(out, cam, W3, J3, { mode: "stand", expr: f < 1160 ? "neutral" : "smile", prop: gold(gave), look: -1 }, t);
    stand(out, cam, WL, LEND, { mode: "stand", expr: f < 1170 ? "stern" : "smile", look: 1 }, t);
    for (const g of [1125, 1144, 1156]) flyGold(out, f, g, 10, handOf(cam, J1), handOf(cam, J3), 0.4);
  } else if (id === 13) {
    // maybe the price comes back, maybe it doesn't; he will never find out
    stand(out, cam, W1, P1S, { mode: "sit", expr: f < 1300 ? "sad" : "pained", look: f < 1250 ? 1 : 0, headTilt: f > 1300 ? -8 : 0 }, t);
    board(out, 4, 0, true);
  } else if (id === 14) {
    if (f < 1380) stand(out, cam, W1, P1S, { mode: "sit", expr: "sad", look: 0, headTilt: -6 }, t);
    else { stand(out, cam, WL, LEND, { mode: "stand", expr: "grin", look: 0, prop: hold(1, 0) }, t); heap(out, [LEND[0] + 0.85, D0, LEND[2] + 0.1]); }
  } else if (id === 15) {
    // the whole town: the lender walks down the row and every golden fish goes into his basket
    const x = collectX(f), done = ROW.map((p) => x > p[0] + 0.25);
    board(out, 4, -1);
    ROW.forEach((p, k) => {
      stand(out, cam, ROWW[k], p, { mode: "stand", expr: done[k] ? "sad" : x > p[0] - 1.2 ? "shock" : "neutral", prop: gold(done[k] ? 0 : 1), look: 0 }, t);
      const g0 = Math.round(1420 + (165 * (p[0] + 0.25 - 7.0)) / 7.4) - 10;
      flyGold(out, f, g0, 10, handOf(cam, p), design(cam, [x, D0, COLLECTZ], 416, 700), 0.35);
    });
    stand(out, cam, WL, [x, D0, COLLECTZ], { mode: f > 1420 && f < 1585 ? "stroll" : "stand", phase: q(((f - 1420) / FPS * 0.9) % 1, 24), expr: "grin", prop: hold(1, 0), look: 0 }, t);
  } else if (id === 16) {
    // prices fall for everyone; only borrowed money makes you sell at the bottom
    stand(out, cam, W3, P3S, { mode: "sit", expr: f < 1680 ? "smile" : "smile_closed", prop: gold(4), look: 0 }, t);
    barrel(out, BAR3, 0.9);
    stand(out, cam, W1, P1, { mode: "stand", expr: "sad", look: 0 }, t);
    stand(out, cam, W2, P2, { mode: "stand", expr: "smile", look: 0 }, t);
    barrel(out, BAR2, 0.7);
    board(out, 4, -1);
  }
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  shotStage(out, cam, id, f);
  return out;
};
