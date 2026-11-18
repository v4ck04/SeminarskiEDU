// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxRing, fxFish, fxCreak, fxStrip, fxBasket, fxBarrel, fxBoat, fxAsk, fxZzz,
  townsfolk, Outfit, FrontOpts, SideOpts, ROD_TIP, BASKET_HOLES, BASKET_HAND, KB,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, smooth, P1, P2, P3, P1S, P3S, WATER_Y, EDGE1, BOAT, INBOAT, B7, BAR2, BAR3, BAR3B, J1, J3, walkX, WALKZ, ROW, ROW3,
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

// ---------------- staging per shot ----------------
const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 1) {
    // the hook: a full basket, fish slipping out of the holes one by one; on "nothing" it is empty
    const drops = [16, 28, 40, 51, 61, 70], n = drops.filter((d) => f >= d).length;
    stand(out, cam, W1, P1, { mode: "stand", expr: f < 40 ? "neutral" : f < 77 ? "nervous" : f < 84 ? "shock" : "sad", prop: hold(1 - n / 6, 3), look: 0 }, t);
    leaks(out, cam, P1, 3, drops, f);
  } else if (id === 2) {
    // the third man holds a full, whole basket up
    stand(out, cam, W3, P3, { mode: "stand", expr: f < 108 ? "smile" : "grin", wave: 1, look: 0 }, t);
    const hand = onCard(cam, P3, 0.46, 2.25), u = clamp01((f - 102) / 6), w = 0.58 + 0.06 * u;
    fxCard(out, "basket1|0", 400, 400, (pp) => fxBasket(pp, 1, 0), [hand[0], hand[1] - 0.26, hand[2] - 0.05], w, w);
    pop(out, [hand[0], hand[1] - 0.2, hand[2] - 0.2], f, 102, 1.2);
  } else if (id === 3) {
    // three men, one full basket each
    const W = [W1, W2, W3], P = [P1, P2, P3];
    W.forEach((w, k) => stand(out, cam, w, P[k], { mode: "stand", expr: f > 250 ? "smile" : "neutral", prop: hold(1, 0), look: 0 }, t));
    if (f >= 254) P.forEach((p, k) => pop(out, design(cam, p, 416, 720), f, 254 + 3 * k, 0.5));
  } else if (id === 4) {
    if (f < 362) {
      // at the edge, the shiny boat below; it pops in on "boat"
      stand(out, cam, W1, EDGE1, { mode: "stand", expr: f < 317 ? "neutral" : f < 340 ? "grin" : "whistle", look: 1, prop: hold(1, 0) }, t);
      if (f >= 317) { const s = Math.min(1, 0.6 + 0.4 * (f - 317) / 5); fxCard(out, "boat", 700, 320, fxBoat, [BOAT[0], BOAT[1] + 0.35, BOAT[2]], 2.8 * s, 1.28 * s); }
      pop(out, [BOAT[0], 0.9, BOAT[2] - 0.2], f, 317, 2.2);
    } else {
      // so he borrows: standing in his new boat, waving
      stand(out, cam, W1, INBOAT, { mode: "stand", expr: "laugh", wave: q(0.6 + 0.4 * Math.sin(f * 0.45), 4), look: 0 }, t, 1, false);
      fxCard(out, "boat", 700, 320, fxBoat, [BOAT[0], BOAT[1] + 0.35, BOAT[2]], 2.8, 1.28);
      flat(out, `ring${q((f % 30) / 30, 15)}`, 600, 600, (pp) => fxRing(pp, q((f % 30) / 30, 15)), [BOAT[0], WATER_Y + 0.01, BOAT[2] + 0.2], 3.6, 3.6);
      pop(out, onCard(cam, INBOAT, 0.5, 1.9), f, 371, 0.8);
    }
  } else if (id === 5) {
    // close on the basket: a hole opens on "hole", two fish slip out
    const holed = f >= 433, drops = [446, 459];
    stand(out, cam, W1, P1, { mode: "stand", expr: f < 433 ? "smile" : f < 450 ? "shock" : "nervous", prop: hold(holed ? 1 - 0.1 * drops.filter((d) => f >= d).length : 1, holed ? 1 : 0), look: 0 }, t);
    pop(out, holeAt(cam, P1, 0), f, 433, 0.45, "#ffffff");
    leaks(out, cam, P1, 1, drops, f);
  } else if (id === 6) {
    // the walk home: a trail of fish on the boards behind him; on "half" he stops and looks in
    const x = walkX(f), p: V3 = [x, D0, WALKZ], walking = f > 472 && f < 536;
    const drops = [482, 491, 500, 509, 518, 527], n = drops.filter((d) => f >= d).length;
    const ph = q(((f - 472) / FPS * 0.95) % 1, 24);
    stand(out, cam, W1, p, { mode: walking ? "stroll" : "stand", phase: ph, expr: f < 536 ? "whistle" : f < 544 ? "neutral" : "sad", prop: hold(1 - n / 12, 1), look: f >= 538 ? -1 : 0 }, t);
    drops.forEach((d, k) => { if (f >= d) { const px = walkX(d); drop(out, f, d, holeAt(cam, [px, D0, WALKZ], 0), D0 + 0.02, k, true, 6, -0.05); } });
  } else if (id === 7) {
    // evening: he fishes on, the basket on the boards beside him; more holes on "borrows" and "more holes"
    const holes = f < 599 ? 1 : f < 641 ? 2 : f < 645 ? 3 : 4;
    stand(out, cam, W1, P1, { mode: "stand", expr: f < 600 ? "nervous" : "pained", prop: "rod", look: 0 }, t);
    fishingLine(out, cam, P1, waterBelow(P1));
    deckBasket(out, B7, 0.8 - 0.4 * clamp01((f - 575) / 90), holes);
    for (const [g, k] of [[599, 1], [641, 2], [645, 3]] as const) pop(out, deckHole(cam, B7, k), f, g, 0.35, "#ffffff");
    every(580, 669, 11).forEach((d, k) => { if (f >= d) { const h = deckHole(cam, B7, k % holes); drop(out, f, d, h, D0 + 0.02, k, true, 5, 0.22); } });
    if (f >= 575 && f < 640) fxCard(out, `creak${q((f % 20) / 20, 10)}`, 300, 300, (pp) => fxCreak(pp, q((f % 20) / 20, 10)), onCard(cam, P1, -0.38, 2.15), 0.42, 0.42);
  } else if (id === 8) {
    // the holes don't care: close, straining, fish dripping out of four holes
    stand(out, cam, W1, P1, { mode: "stand", expr: "pained", prop: hold(0.4, 4), look: 0 }, t);
    leaks(out, cam, P1, 4, every(672, 733, 6), f, false);
    fxCard(out, `creak${q((f % 16) / 16, 8)}`, 300, 300, (pp) => fxCreak(pp, q((f % 16) / 16, 8)), onCard(cam, P1, -0.38, 2.1), 0.42, 0.42);
  } else if (id === 9) {
    // the second man: no loans; one fish a night into the barrel; slow, safe, boring
    const lvl = f < 826 ? 0.15 : f < 844 ? 0.3 : f < 859 ? 0.45 : f < 871 ? 0.6 : 0.7;
    const prop: FrontOpts["prop"] = f >= 795 && f < 812 ? ["fish", 1] : null;
    stand(out, cam, W2, P2, { mode: "stand", expr: f < 765 ? "stern" : f < 871 ? "smile" : "smile_closed", prop, look: f < 765 ? q(Math.sin((f - 752) * 0.5), 2) : 0, wave: f >= 812 && f < 822 ? 0.5 : undefined }, t);
    barrel(out, BAR2, lvl);
    if (f >= 812 && f < 826) fish(out, arc(handOf(cam, P2), [BAR2[0], D0 + 0.78, BAR2[2]], (f - 812) / 14, 0.5), f, 0.3, 1.2 + (f - 812) * 0.2);
    for (const g of [826, 844, 859, 871]) pop(out, [BAR2[0], D0 + 0.85, BAR2[2] - 0.2], f, g, 0.45);
  } else if (id === 10) {
    if (f < 980) {
      // the third man saves too; on "full" the barrel brims over
      const lvl = f < 967 ? 0.55 + 0.15 * clamp01((f - 900) / 60) : 1;
      stand(out, cam, W3, P3, { mode: "stand", expr: f < 967 ? "smile" : "grin", look: 0, prop: f > 940 ? hold(0, 0) : null }, t);
      barrel(out, BAR3, lvl);
      pop(out, [BAR3[0], D0 + 0.85, BAR3[2] - 0.2], f, 967, 0.9);
    } else {
      // he walks over to the first man, who stands with his leaking basket
      const u = clamp01((f - 982) / 38), x = 13.7 + (J3[0] - 13.7) * smooth(u);
      stand(out, cam, W1, J1, { mode: "stand", expr: "nervous", prop: hold(0.6, 4), look: 1 }, t);
      leaks(out, cam, J1, 4, every(984, 1026, 8), f);
      stand(out, cam, W3, [x, D0, J3[2]], { mode: u > 0 && u < 1 ? "stroll" : "stand", phase: q(((f - 982) / FPS * 0.9) % 1, 24), expr: "smile", prop: hold(0, 0), look: -1 }, t);
    }
  } else if (id === 11) {
    // "need another loan?"
    stand(out, cam, W3, J3, { mode: "stand", expr: f < 1037 ? "smile" : "grin", prop: hold(0, 0), look: -1 }, t);
    stand(out, cam, W1, J1, { mode: "stand", expr: f < 1040 ? "nervous" : "relief", prop: hold(0.55, 4), look: 1 }, t);
    if (f >= 1029) { const s = Math.min(1, 0.4 + 0.6 * (f - 1029) / 5); fxCard(out, "ask", 520, 300, fxAsk, onCard(cam, J3, 0.45, 2.12), 0.85 * s, 0.49 * s); }
  } else if (id === 12) {
    // the twist: his basket on the boards right under the holes; every fish that falls lands in it
    const drops = every(1064, 1157, 6), under = UNDER;
    const n = drops.filter((d) => f >= d + 6).length;
    stand(out, cam, W1, J1, { mode: "stand", expr: "relief", prop: hold(0.7, 4), look: 0 }, t);
    stand(out, cam, W3, J3, { mode: "stand", expr: f < 1133 ? "smile" : "grin", look: f < 1133 ? -1 : 0 }, t);
    deckBasket(out, under, Math.min(1, n / 12), 0);
    drops.forEach((d, k) => drop(out, f, d, holeAt(cam, J1, k % 4), D0 + 0.32, k, false, 6));
    if (f >= 1133) pop(out, [under[0], D0 + 0.5, under[2] - 0.2], f, 1133, 0.6);
  } else if (id === 13) {
    // a basket under every hole in town: the row, the baskets popping in one by one; the third man and his barrels
    const come = [1175, 1186, 1196, 1204, 1212];
    ROW.forEach((p, k) => {
      const who = k === 2 ? W1 : TOWN[k > 2 ? k - 1 : k], has = f >= come[k];
      stand(out, cam, who, p, { mode: "stand", expr: "neutral", prop: hold(0.6, 3), look: 0 }, t);
      const h0 = holeAt(cam, p, 0), under: V3 = [h0[0], D0, h0[2] + 0.02];
      if (has) { deckBasket(out, under, 0.5, 0); pop(out, [under[0], D0 + 0.4, under[2] - 0.2], f, come[k], 0.5); }
      every(1160 + 3 * k, 1232, 10).forEach((d, j) => drop(out, f, d, holeAt(cam, p, j % 3), has || d >= come[k] ? D0 + 0.32 : D0 + 0.02, j + k, false, 6));
    });
    stand(out, cam, W3, ROW3, { mode: "stand", expr: "grin", look: 0 }, t);
    barrel(out, [ROW3[0] + 0.8, D0, ROW3[2] + 0.1], 1); barrel(out, [ROW3[0] + 1.45, D0, ROW3[2] + 0.3], 1);
  } else if (id === 14) {
    if (f < 1266) {
      // paid the interest
      stand(out, cam, W1, P1, { mode: "stand", expr: "sad", prop: hold(0.2, 4), look: 0 }, t);
      leaks(out, cam, P1, 4, every(1234, 1266, 7), f, false);
    } else if (f < 1292) {
      // avoided it
      stand(out, cam, W2, P2, { mode: "stand", expr: "smile", look: 0 }, t);
      barrel(out, BAR2, 0.7);
    } else {
      // collected it
      stand(out, cam, W3, P3S, { mode: "sit", expr: "smile_closed", look: 0 }, t);
      barrel(out, [P3S[0] + 0.85, D0, P3S[2] - 0.1], 1); barrel(out, [P3S[0] + 1.5, D0, P3S[2] + 0.1], 1);
      deckBasket(out, [P3S[0] - 0.6, D0, P3S[2] - 0.35], 1, 0);
    }
  } else if (id === 15) {
    // close on the holed basket; down to the basket underneath; up and back over the stage in the sunset
    const drops = every(1330, 1450, 7), under = UNDER;
    stand(out, cam, W1, J1, { mode: "stand", expr: "neutral", prop: hold(0.6, 4), look: 0 }, t);
    stand(out, cam, W3, J3, { mode: "stand", expr: f < 1385 ? "smile" : "smile_closed", look: f < 1385 ? -1 : 0 }, t);
    deckBasket(out, under, 0.9, 0);
    drops.forEach((d, k) => drop(out, f, d, holeAt(cam, J1, k % 4), D0 + 0.32, k, false, 6));
    stand(out, cam, W2, P2, { mode: "stand", expr: "smile", look: 0 }, t);
    barrel(out, BAR2, 0.7); barrel(out, BAR3, 1); barrel(out, BAR3B, 1);
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
