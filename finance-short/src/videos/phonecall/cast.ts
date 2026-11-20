// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxRing, fxFish, fxCreak, fxStrip, fxBasket, fxBarrel, fxBag, fxCoin, fxPaper,
  fxSkyline, fxMansion, fxCar, fxJet, fxOffice, fxDesk, fxPhone, fxScreens, BOSS, ADVISOR, BANKER,
  townsfolk, Outfit, FrontOpts, SideOpts, ROD_TIP, BASKET_HOLES, BASKET_HAND, KB,
} from "./toon";
import { FPS, D0, SHOTS, V3, clamp01, smooth, P1, P2, P3, P1S, P3S, WATER_Y, centreOf, backdropAt } from "./story";
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

// ---------------- this film ----------------
const WB: Who = { i: 70, o: BOSS, okey: "boss" }, WA: Who = { i: 71, o: ADVISOR, okey: "adv" };
const WK: Who[] = [0, 1].map((v) => ({ i: 72 + v, o: BANKER, okey: `bk${v}` }));
const backdrop = (out: Stage, id: number, key: string, draw: (p: Pen) => void) => fxCard(out, key, 1200, 1000, draw, backdropAt(id), 10, 8.33);
const desk = (out: Stage, c: V3, dx = 0) => fxCard(out, "desk", 900, 420, fxDesk, [c[0] + dx, D0 + 0.42, c[2] - 0.55], 1.8, 0.84);
const phoneCard = (out: Stage, at: V3, f: number, ringing: boolean, w = 0.26) => { const k = q((f / 30) % 1, 16); fxCard(out, `phone${ringing}${ringing ? k : ""}`, 300, 540, (pp) => fxPhone(pp, k, ringing), at, w, w * 1.8); };
const coinRain = (out: Stage, c: V3, f: number, f0: number) => {
  for (let i = 0; i < 14; i++) {
    const u = ((f - f0) / 40 + i / 14) % 1, x = c[0] + 1.6 - 3.2 * ((i * 0.61) % 1), y = D0 + 3.2 - 3.3 * u;
    if (f >= f0) fxCard(out, `coin${q((f * 0.2 + i) % 1, 6)}`, 200, 200, (pp) => fxCoin(pp, q((f * 0.2 + i) % 1, 6)), [x, y, c[2] - 0.6 - 0.3 * (i % 3)], 0.22, 0.22);
  }
};
const papers = (out: Stage, c: V3, f: number, f0: number) => {
  for (let i = 0; i < 8; i++) { const u = clamp01((f - f0 - i * 3) / 30); if (u > 0) fxCard(out, `paper${q(u, 6)}`, 220, 280, (pp) => fxPaper(pp, q(u, 6)), [c[0] - 1.4 + 0.4 * i, D0 + 2.6 - 2.2 * u + 0.3 * Math.sin(i + f * 0.15), c[2] - 0.8], 0.36, 0.46, u * 3 + i); }
};

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f), s = SHOTS[id - 1], c = centreOf(id);
  const boss = (fo: FrontOpts, p: V3 = c) => stand(out, cam, WB, p, { mode: "stand", look: 0, ...fo }, t);
  const ear = (p: V3 = c) => phoneCard(out, onCard(cam, p, 0.33, 1.42), f, false, 0.12);
  switch (s.set) {
    case "night": case "window": {
      backdrop(out, id, "sky0f", (pp) => fxSkyline(pp, 0, true));
      const ex = s.set === "window" ? (f < 1174 ? "sad" : f < 1240 ? "pained" : "stern") : f < 64 ? "stern" : f < 98 ? "neutral" : f < 140 ? "shock" : "pained";
      boss({ expr: ex as FrontOpts["expr"], headTilt: s.set === "window" ? -4 : 0 });
      break;
    }
    case "day": backdrop(out, id, "sky1f", (pp) => fxSkyline(pp, 1, true)); boss({ expr: f < 214 ? "smile" : "grin", wave: f >= 214 ? 1 : undefined }); break;
    case "mansion": backdrop(out, id, "mansion", fxMansion); boss({ expr: "grin", wave: q(0.5 + 0.4 * Math.sin(f * 0.3), 4) }); break;
    case "car":
      backdrop(out, id, "mansion", fxMansion);
      fxCard(out, "car", 760, 300, fxCar, [c[0] + 0.9, D0 + 0.52, c[2] - 0.3], 2.6, 1.03);
      boss({ expr: "laugh" }, [c[0] - 0.9, D0, c[2]]);
      pop(out, [c[0] + 0.9, D0 + 0.9, c[2] - 0.5], f, 291, 1.2);
      break;
    case "jet":
      backdrop(out, id, "sky1", (pp) => fxSkyline(pp, 1, false));
      fxCard(out, "jet", 1000, 400, fxJet, [c[0] + 0.3, D0 + 1.3, c[2] + 0.6], 5.2, 2.08);
      boss({ expr: "grin", wave: 1 }, [c[0] - 1.2, D0, c[2] - 0.5]);
      pop(out, [c[0] + 0.3, D0 + 1.4, c[2]], f, 322, 1.6);
      break;
    case "money":
      backdrop(out, id, "sky1f", (pp) => fxSkyline(pp, 1, true));
      boss({ expr: "laugh", prop: "bags" }); coinRain(out, c, f, 346);
      break;
    case "phone":
      backdrop(out, id, "office0", (pp) => fxOffice(pp, false));
      desk(out, c, -0.55);
      phoneCard(out, [c[0] - 0.55, D0 + 1.0, c[2] - 0.62], f, f >= 425);
      break;
    case "office":
      backdrop(out, id, "office0", (pp) => fxOffice(pp, false));
      boss({ expr: f < 520 ? "neutral" : f < 590 ? "nervous" : f < 708 ? "pained" : "shock", wave: 0.35 }); ear();
      if (s.frame !== "CU" && s.frame !== "CU2") desk(out, c);
      break;
    case "advisor":
      backdrop(out, id, "office1", (pp) => fxOffice(pp, true));
      stand(out, cam, WA, c, { mode: "stand", expr: "stern", wave: 0.35, look: 0 }, t); ear(); desk(out, c);
      break;
    case "screens": {
      backdrop(out, id, "office0", (pp) => fxOffice(pp, false));
      const u = clamp01((f - 750) / 60);
      fxCard(out, `screens${q(u, 20)}`, 1100, 560, (pp) => fxScreens(pp, q(u, 20)), [c[0], D0 + 2.4, 26.15], 3.6, 1.83);
      if (s.frame !== "SCREEN") { boss({ expr: "shock", prop: "paper", wave: 0.4 }); papers(out, c, f, 760); }
      break;
    }
    case "bankers":
      backdrop(out, id, "office0", (pp) => fxOffice(pp, false));
      boss({ expr: "sad" });
      WK.forEach((w, k) => stand(out, cam, w, [c[0] + (k ? -1.0 : 1.0), D0, c[2] - 0.2], { mode: "stand", expr: "stern", prop: "bag", look: k ? 1 : -1 }, t));
      break;
    case "empty":
      backdrop(out, id, "office1", (pp) => fxOffice(pp, true));
      stand(out, cam, WB, P1S, { mode: "sit", expr: "sad", look: 0, headTilt: -6 }, t);
      break;
    case "sunrise":
      backdrop(out, id, "sky2", (pp) => fxSkyline(pp, 2, false));
      boss({ expr: f < 1460 ? "smile_closed" : f < 1545 ? "neutral" : "smile" });
      break;
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
