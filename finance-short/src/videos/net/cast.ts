// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxSplash, fxRing, fxFish, fxBones, fxNetPatch, fxNetBall, fxNetFull,
  fxNetHang, fxNetWater, fxDeal, fxZzz, fxStrip, fxCreak, Outfit, Expr, FrontOpts, SideOpts, Prop, ROD_TIP, ROPE_END, INK,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, P1, P2, P3, P1S, P3S, SEAT, RACK, NETRACK, WATER_Y, L1, L2, LOAN3, THROWER, NET_LAND, NETMAN,
  J1, J3, NET_WATER,
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
/** the first man: patched grey-brown shirt, cap; the second: blue shirt, hair; the third: green shirt, straw-yellow cap */
export const MAN1: Outfit = { jacket: "#8a7a66", pants: "#4a4552", boots: "#3a2a22", hat: "cap", cap: "#5a5f6e", skin: SK[1] };
export const MAN2: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3b2a", skin: SK[0], moustache: "#5a3b2a" };
export const MAN3: Outfit = { jacket: "#3f8f5a", pants: "#5a4636", boots: "#3a2a22", hat: "cap", cap: "#e0b648", skin: SK[2] };
const W1: Who = { i: 11, o: MAN1, okey: "m1" }, W2: Who = { i: 12, o: MAN2, okey: "m2" }, W3: Who = { i: 13, o: MAN3, okey: "m3" };

/** dried fish hanging from the rack: n of them, spread along the pole */
const rackFish = (out: Stage, cam: CamInfo, n: number) => {
  const k = Math.min(n, 7);
  for (let i = 0; i < k; i++) {
    const x = RACK.x0 + 0.12 + ((RACK.x1 - RACK.x0 - 0.24) * (i + 0.5)) / 7;
    fxCard(out, "fishDry", 240, 120, (p) => fxFish(p, 0), [x, RACK.y - 0.2, RACK.z - 0.03], 0.36, 0.18, Math.PI / 2);
  }
};
const netsOnRack = (out: Stage, n: number, full = 0) => {
  for (let i = 0; i < n; i++) {
    const x = NETRACK.x0 + 0.42 + ((NETRACK.x1 - NETRACK.x0 - 0.84) * i) / Math.max(1, 4);
    fxCard(out, `netHang${full}`, 300, 420, (p) => fxNetHang(p, full), [x, NETRACK.y - 0.55, NETRACK.z - 0.05], 0.75, 1.05);
  }
};
/** the three in their usual places (standing with rods, lines in the water) */
const fishers = (out: Stage, cam: CamInfo, f: number, which: number[], ex: Partial<Record<number, FrontOpts>> = {}) => {
  const t = T(f);
  const W = [W1, W2, W3], P = [P1, P2, P3];
  for (const k of which) {
    const fo: FrontOpts = { mode: "stand", expr: "neutral", prop: "rod", look: 0, ...(ex[k] ?? {}) };
    stand(out, cam, W[k], P[k], fo, t);
    if (fo.prop === "rod") fishingLine(out, cam, P[k], waterBelow(P[k]));
  }
};
/** a fish jumping from the water at `from` into the hand at `to` between f0 and f1 */
const catchFish = (out: Stage, f: number, f0: number, f1: number, from: V3, to: V3, i = 0) => {
  if (f < f0 || f >= f1) return;
  const u = (f - f0) / (f1 - f0);
  fish(out, arc(from, to, u, 1.3), f, 0.36, -1.2 + 2.4 * u, i);
  if (f < f0 + 10) flat(out, `splash${q((f - f0) / 10, 30)}`, 600, 600, (p) => fxRing(p, q((f - f0) / 10, 30)), [from[0], WATER_Y + 0.01, from[2]], 1.4, 1.4);
};
const handOf = (cam: CamInfo, p: V3): V3 => onCard(cam, p, 0.42, 1.55);

// ---------------- staging per shot ----------------
const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 1) {
    // the hook: he fishes all day; on "broke" a tiny fish jumps into his hand
    const got = f >= 96;
    fishers(out, cam, f, [0], { 0: { expr: f < 60 ? "neutral" : got ? "sad" : "nervous", prop: got ? ["fish", 1] : "rod" } });
    catchFish(out, f, 84, 96, waterBelow(P1), handOf(cam, P1));
    if (f >= 20 && f < 84) fxCard(out, `creak${q((f % 20) / 20, 10)}`, 300, 300, (p) => fxCreak(p, q((f % 20) / 20, 10)), onCard(cam, P1, -0.38, 2.15), 0.42, 0.42);
  } else if (id === 2 || id === 7) {
    // the third man: holding the finished net up (2), or on his crate tying it, the patch growing over the week (7)
    if (id === 2) {
      stand(out, cam, W3, P3, { mode: "stand", expr: f < 124 ? "smile" : "grin", wave: 1, look: 0 }, t);
      const hand = onCard(cam, P3, 0.46, 2.25), u = clamp01((f - 118) / 8);
      fxCard(out, "netBall1", 360, 360, (p) => fxNetBall(p, 1), [hand[0], hand[1] - 0.45, hand[2] - 0.1], 0.9 + 0.1 * u, 0.9 + 0.1 * u);
      if (f >= 124 && f < 132) burst(out, [hand[0], hand[1] - 0.4, hand[2] - 0.2], (f - 124) / 8, 1.3);
    } else {
      const stopped = f >= 676;
      if (!stopped) stand(out, cam, W3, P3, { mode: "stand", expr: "neutral", prop: f < 668 ? "rod" : null, look: 0 }, t);
      else stand(out, cam, W3, P3S, { mode: "sit", expr: f < 760 ? "stern" : "smile", look: 0 }, t);
      if (!stopped && f < 668) fishingLine(out, cam, P3, waterBelow(P3));
      // the rod laid down on the deck once he stops
      if (f >= 668) fxCard(out, "rodDown", 8, 64, (p) => fxStrip(p, "#7a5232"), [P3[0] - 0.9, D0 + 0.04, P3[2] - 0.2], 0.04, 1.8, Math.PI / 2 - 0.25);
      if (stopped) {
        // the net spreads over the deck in front of him as the week goes by; a small piece stays in his hands
        const k = clamp01((f - 700) / 70);
        flat(out, `patch${q(k, 9)}`, 400, 400, (p) => fxNetPatch(p, q(k, 9)), [P3S[0] - 0.35, D0 + 0.03, P3S[2] - 0.6], 0.5 + 0.7 * k, 0.5 + 0.7 * k);
        const lap = onCard(cam, P3S, 0.0, 0.42);
        fxCard(out, "patch0.33", 400, 400, (p) => fxNetPatch(p, 0.33), [lap[0], lap[1] - 0.02, lap[2] - 0.3], 0.3, 0.3);
      }
    }
  } else if (id === 3) {
    const nothing = f >= 290;
    fishers(out, cam, f, [0, 1, 2], {
      0: { expr: nothing ? "nervous" : "neutral" }, 1: { expr: nothing ? "neutral" : "smile" }, 2: { expr: nothing ? "smile" : "neutral" },
    });
  } else if (id === 4) {
    const got = f >= 361;
    fishers(out, cam, f, [0], { 0: { expr: got ? "grin" : "neutral", prop: got ? ["fish", 1] : "rod" } });
    catchFish(out, f, 346, 361, waterBelow(P1), handOf(cam, P1));
  } else if (id === 5) {
    // evening on his crate: eating the one fish; then only the bones are left
    const eaten = f >= 419;
    stand(out, cam, W1, P1S, { mode: "sit", expr: eaten ? (f < 455 ? "neutral" : "sad") : "lick", prop: eaten ? null : "eat", look: 0 }, t);
    if (eaten) fxCard(out, "bones", 240, 120, fxBones, [P1S[0] + 0.55, D0 + 0.05, P1S[2] - 0.45], 0.36, 0.18);
  } else if (id === 6) {
    // two fish: one eaten, one hung on the rack; the rack fills up over the days
    const caught = f >= 551, ate = f >= 575, hung = f >= 600;
    const prop: Prop = !caught ? "rod" : ate && hung ? null : ate ? ["fish", 1] : ["fish", 2];
    stand(out, cam, W2, P2, { mode: "stand", expr: !caught ? "neutral" : ate && !hung ? "lick" : "smile", prop, look: 0 }, t);
    if (!caught) fishingLine(out, cam, P2, waterBelow(P2));
    catchFish(out, f, 538, 551, waterBelow(P2), handOf(cam, P2), 0);
    catchFish(out, f, 542, 552, waterBelow(P2, 2.2, 1.4), handOf(cam, P2), 1);
    if (f >= 593 && f < 604) fish(out, arc(handOf(cam, P2), [RACK.x1 - 0.2, RACK.y - 0.2, RACK.z], (f - 593) / 11, 0.5), f, 0.36);
    const n = f < 604 ? 0 : 1 + Math.floor(Math.max(0, f - 612) / 6);
    rackFish(out, cam, n);
  } else if (id === 8) {
    // the other two laugh and point at him (off frame right)
    for (const [who, p, k] of [[W1, L1, 0], [W2, L2, 1]] as const) {
      const w = q(0.6 + 0.4 * Math.sin(f * 0.5 + k * 2), 4);
      stand(out, cam, who, p, { mode: "stand", expr: "laugh", wave: w, look: 1, tilt: 3 * Math.sin(f * 0.6 + k) }, t);
    }
  } else if (id === 9) {
    if (f < 875) {
      // day five: weak with hunger on the crate, the half-made net in his lap
      stand(out, cam, W3, P3S, { mode: "sit", expr: f < 852 ? "sad" : "pained", look: 0, tilt: f > 852 ? -4 : 0 }, t);
      flat(out, "patch1", 400, 400, (p) => fxNetPatch(p, 1), [P3S[0] - 0.35, D0 + 0.03, P3S[2] - 0.6], 1.2, 1.2);
      if (f >= 852 && f < 875) fxCard(out, `creak${q(((f - 852) % 12) / 12, 6)}`, 300, 300, (p) => fxCreak(p, q(((f - 852) % 12) / 12, 6)), onCard(cam, P3S, 0.0, 0.62), 0.45, 0.45);
    } else {
      // he walks to the second man at his rack and asks; the deal bubble; ten dried fish change hands
      const u = clamp01((f - 878) / 40), a: V3 = [16.2, D0, 25.25], p: V3 = [a[0] + (LOAN3[0] - a[0]) * u, D0, a[2] + (LOAN3[2] - a[2]) * u];
      const given = f >= 990;
      const ph = q(((f - 878) / FPS * 0.9) % 1, 24);
      stand(out, cam, W3, p, { mode: u > 0 && u < 1 ? "stroll" : "stand", phase: ph, expr: f < 930 ? "nervous" : given ? "relief" : "smile", prop: given ? ["fish", 3] : null, look: -1 }, t);
      stand(out, cam, W2, P2, { mode: "stand", expr: f < 975 ? "neutral" : "grin", look: 1, wave: f >= 975 && f < 990 ? 0.3 : undefined }, t);
      rackFish(out, cam, given ? 0 : 7);
      if (f >= 926) {
        const k = f >= 967 ? 1 : 0, s2 = Math.min(1, (f - 926) / 6);
        fxCard(out, `deal${k}`, 640, 300, (pp) => fxDeal(pp, k), [13.9, D0 + 2.45, 25.0], 1.15 * s2, 0.54 * s2);
      }
    }
  } else if (id === 10) {
    // day eight: from the end of the stage he throws the net out over the river
    const thrown = f >= 1040;
    stand(out, cam, W3, THROWER, { mode: "stand", expr: thrown ? (f < 1058 ? "grin" : "smile") : "stern", wave: thrown ? 1 : 0.2, look: 0 }, t);
    const hand = onCard(cam, THROWER, 0.42, 2.0);
    if (!thrown) fxCard(out, "netBall0", 360, 360, (p) => fxNetBall(p, 0), [hand[0], hand[1] - 0.4, hand[2]], 0.75, 0.75);
    else if (f < 1058) {
      const u = (f - 1040) / 18, p = arc(hand, NET_LAND, u, 2.2), s2 = 0.75 + 1.4 * u;
      fxCard(out, `netBall${q(u, 6)}`, 360, 360, (pp) => fxNetBall(pp, q(u, 6)), p, s2, s2 * 0.82, u * 0.6);
    } else {
      flat(out, "netWater0", 600, 600, (pp) => fxNetWater(pp, 0, 0), [NET_LAND[0], WATER_Y + 0.02, NET_LAND[2]], 2.6, 2.6);
      if (f < 1072) { const u = q((f - 1058) / 14, 30); fxCard(out, `splash${u}`, 800, 800, (pp) => fxSplash(pp, u), [NET_LAND[0], WATER_Y + 0.6, NET_LAND[2]], 3.0, 3.0); }
      flat(out, `ring${q(((f - 1058) % 30) / 30, 15)}`, 600, 600, (pp) => fxRing(pp, q(((f - 1058) % 30) / 30, 15)), [NET_LAND[0], WATER_Y + 0.01, NET_LAND[2]], 4, 4);
    }
  } else if (id === 11) {
    // fifty fish: the net comes up full over the edge
    stand(out, cam, W3, THROWER, { mode: "stand", expr: f < 1094 ? "shock" : "laugh", prop: "rope", look: 0 }, t);
    const u = clamp01((f - 1088) / 6), at: V3 = [THROWER[0] + 0.15, D0 + 0.2 + 0.75 * u, THROWER[2] - 0.75];
    fxCard(out, `netFull${q((f % 8) / 8, 4)}`, 400, 440, (p) => fxNetFull(p, 26, q((f % 8) / 8, 4)), at, 1.15, 1.26);
    if (f >= 1092 && f < 1100) burst(out, [at[0], at[1] + 0.3, at[2] - 0.2], (f - 1092) / 8, 1.8);
    for (let i = 0; i < 4; i++) { const ff = (f - 1092 + i * 7) % 20; if (f >= 1092 && ff < 16) fish(out, arc([at[0] - 0.4 + i * 0.25, at[1] + 0.3, at[2] - 0.1], [at[0] - 0.7 + i * 0.45, at[1] - 0.2, at[2] - 0.3], ff / 16, 0.6), f, 0.3, ff * 0.3, i); }
  } else if (id === 12) {
    // two nets, then five on the rack; too many to pull alone
    const n = f < 1138 ? 1 : f < 1160 ? 2 : 5;
    netsOnRack(out, n, f >= 1157 ? 1 : 0);
    stand(out, cam, W3, NETMAN, { mode: "stand", expr: f < 1177 ? "grin" : "nervous", prop: f >= 1177 ? "rope" : null, wave: f < 1177 ? 0.6 : undefined, look: 1, tilt: f >= 1177 ? -6 + 2 * Math.sin(f * 0.8) : 0 }, t);
    if (f >= 1138 && f < 1146) burst(out, [NETRACK.x0 + 1.1, NETRACK.y - 0.4, NETRACK.z - 0.3], (f - 1138) / 8, 1.0, "#ffffff");
    if (f >= 1160 && f < 1168) burst(out, [NETRACK.x0 + 1.8, NETRACK.y - 0.4, NETRACK.z - 0.3], (f - 1160) / 8, 1.6, "#ffffff");
  } else if (id === 13) {
    if (f < 1306) {
      // the offer: the third man (with a full net behind) to the first, who still has his single line
      stand(out, cam, W3, J3, { mode: "stand", expr: "smile", wave: f >= 1224 && f < 1262 ? q(0.5 + 0.5 * Math.sin((f - 1224) * 0.3), 4) : undefined, look: -1 }, t);
      stand(out, cam, W1, J1, { mode: "stand", expr: f < 1240 ? "neutral" : f < 1279 ? "shock" : "grin", prop: f < 1279 ? "rod" : ["fish", 3], look: 1 }, t);
      if (f < 1279) fishingLine(out, cam, J1, waterBelow(J1, 2.6, -0.2));
      if (f >= 1279 && f < 1287) burst(out, onCard(cam, J1, 0.42, 1.85), (f - 1279) / 8, 0.9);
    } else {
      // three times what he used to catch: close on him, grinning, three fish
      stand(out, cam, W1, J1, { mode: "stand", expr: f < 1330 ? "grin" : "laugh", prop: ["fish", 3], look: 0 }, t);
    }
  } else if (id === 14) {
    // golden aerial: the first man hauling, the second by his rack, the third with his nets
    stand(out, cam, W1, P1, { mode: "stand", expr: "neutral", prop: "rope", look: 0 }, t);
    stand(out, cam, W2, P2, { mode: "stand", expr: "smile", look: 0 }, t);
    stand(out, cam, W3, NETMAN, { mode: "stand", expr: "smile", look: 0 }, t);
    rackFish(out, cam, 7); netsOnRack(out, 5, 1);
    flat(out, `netWater${q(t % 1, 8)}`, 600, 600, (pp) => fxNetWater(pp, 14, q(t % 1, 8)), [NET_WATER[0], WATER_Y + 0.02, NET_WATER[2]], 3.2, 3.2);
  } else if (id === 15) {
    if (f < 1460) {
      // sold his time: hauling the third man's net, tired but fed
      stand(out, cam, W1, P1, { mode: "stand", expr: "nervous", prop: "rope", look: 0, tilt: -5 + 2 * Math.sin(f * 0.5) }, t);
      strip(out, cam, design(cam, P1, ROPE_END[0], ROPE_END[1]), [P1[0] + 1.2, WATER_Y, P1[2] - 3.4], 0.03, "#c9a46a");
    } else if (f < 1491) {
      // saved it: the full rack behind him
      stand(out, cam, W2, P2, { mode: "stand", expr: "smile_closed", look: 0 }, t);
      rackFish(out, cam, 7);
    } else {
      // built something: asleep on his crate while the net in the river fills
      stand(out, cam, W3, P3S, { mode: "sit", expr: "smile_closed", blink: 1, look: 0, headTilt: 8 }, t);
      fxCard(out, `zzz${q((t * 0.5) % 1, 20)}`, 300, 300, (p) => fxZzz(p, q((t * 0.5) % 1, 20)), onCard(cam, P3S, 0.35, 1.55), 0.6, 0.6);
    }
  } else if (id === 16) {
    // the net in the river, full and glinting; the stage and the three behind in the sunset
    const n = 18;
    flat(out, `netWater${q(t % 1, 8)}n`, 600, 600, (pp) => fxNetWater(pp, n, q(t % 1, 8)), [NET_WATER[0], WATER_Y + 0.02, NET_WATER[2]], 3.2, 3.2);
    for (let i = 0; i < 3; i++) { const ff = (f - 1590 + i * 13) % 34; if (f >= 1590 && ff < 22) fish(out, arc([NET_WATER[0] - 0.6 + i * 0.6, WATER_Y, NET_WATER[2] + 0.2 * i], [NET_WATER[0] - 0.2 + i * 0.6, WATER_Y, NET_WATER[2] - 0.3], ff / 22, 0.55), f, 0.32, ff * 0.25, i); }
    stand(out, cam, W1, P1, { mode: "stand", expr: "smile", look: 0 }, t);
    stand(out, cam, W2, P2, { mode: "stand", expr: "smile", look: 0 }, t);
    stand(out, cam, W3, P3, { mode: "stand", expr: "smile_closed", look: 0 }, t);
    rackFish(out, cam, 7); netsOnRack(out, 5, 1);
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
