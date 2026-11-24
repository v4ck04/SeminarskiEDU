// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, Outfit, FrontOpts, SideOpts,
  fxHaze, fxStink, fxHanky, fxSun, fxThermo, fxBucket, fxSlop, fxFly, fxCalendar, fxLaw, fxPlan, fxYear, fxCase, fxLime, fxOutflow, fxWet,
  fxBones, fxSplash, fxDrop,
} from "./toon";
import { FPS, D0, SHOTS, V3, clamp01, ease, walk, PIPE, ROOM, TABLE, TUN_A, TUN_B, TUN_FLOOR, POL, BAZ } from "./story";
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
  if (false) { // real card shadows now (lights actorShadow); only the contact blob stays
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- the cast: 2D character cards in the 3D world, casting real shadows ----------------
const front = { side: false, mirror: false };
/** a standing front-view character card (it casts a real sun shadow; the AO pass grounds it) */
const stand = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, t: number, scale = 1, flip = false) => {
  const pl = person(cam, who, p[0], p[1], p[2], front, { blink: fo.blink ?? lidAt(t, who.i), ...fo }, {}, scale);
  if (flip) pl.mirror = true;
  out.places.push(pl);
  blob(out, p[0], p[1], p[2], scale * 0.8, 0.6);
};
/** world point at screen offset (dx right, dy up) from a card standing at p, facing the camera */
const onCard = (cam: CamInfo, p: V3, dx: number, dy: number): V3 => [p[0] + cam.right.x * dx, p[1] + dy, p[2] + cam.right.z * dx];
const SK = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#e7b98a"];
// Victorian London, 1858: frock coats and top hats for Parliament, caps and aprons for working Londoners
const POL1: Outfit = { jacket: "#2c2a36", pants: "#4a4650", boots: "#141016", hat: "tophat", moustache: "#6a4a32", cravat: "#e8e2d0", buttons: "#c9ccd4", skin: SK[1], build: "stout" };
const POL2: Outfit = { jacket: "#3a2e2a", pants: "#5a5048", boots: "#141016", hat: "hair", hair: "#bdb9b2", moustache: "#bdb9b2", cravat: "#f4f1ea", buttons: "#c9a04a", skin: SK[0] };
const POL3: Outfit = { jacket: "#2a3444", pants: "#3a3a44", boots: "#141016", hat: "tophat", cravat: "#7a1f2a", buttons: "#c9ccd4", skin: SK[2] };
const USHER: Outfit = { jacket: "#1d1a22", pants: "#1d1a22", boots: "#141016", hat: "hair", hair: "#4a3424", cravat: "#f4f1ea", buttons: "#d9b04a", skin: SK[3] };
const BAZAL: Outfit = { jacket: "#2e2a26", pants: "#5a5046", boots: "#2a2220", hat: "hair", hair: "#3a2a1e", moustache: "#3a2a1e", cravat: "#3a4a6a", buttons: "#c9ccd4", skin: SK[1] };
const LADY: Outfit = { jacket: "#6a4a7a", pants: "#5a3a6a", dress: "#5a3a6a", boots: "#2a2220", hat: "bonnet", hair: "#6a3a22", skin: SK[0] };
const MAN: Outfit = { jacket: "#6a5a44", pants: "#4a4038", boots: "#2a2220", hat: "cap", cap: "#4a4030", belt: "#3a2a1a", skin: SK[3] };
const BOY: Outfit = { jacket: "#8a5a3a", pants: "#4a4a52", boots: "#2a2220", hat: "cap", cap: "#5a4a3a", skin: SK[2], build: "kid" };
const NAVVY = (v: number): Outfit => ({ jacket: ["#7a6a50", "#5a6a7a", "#8a5a42"][v % 3], pants: "#3a3530", boots: "#2a2220", hat: "cap", cap: ["#4a4030", "#3a3a40", "#5a4a3a"][v % 3], belt: "#3a2a1a", skin: [SK[3], SK[1], SK[2]][v % 3], moustache: v === 1 ? "#4a3424" : undefined });
const W_POL: Who = { i: 1, o: POL1, okey: "pol1" };
const W_POL2: Who = { i: 2, o: POL2, okey: "pol2" };
const W_POL3: Who = { i: 3, o: POL3, okey: "pol3" };
const W_USH: Who = { i: 4, o: USHER, okey: "usher" };
const W_BAZ: Who = { i: 5, o: BAZAL, okey: "baz" };
const W_LADY: Who = { i: 6, o: LADY, okey: "lady" };
const W_MAN: Who = { i: 7, o: MAN, okey: "man" };
const W_BOY: Who = { i: 8, o: BOY, okey: "boy" };
const NAV: Who[] = [0, 1, 2].map((v) => ({ i: 20 + v, o: NAVVY(v), okey: `navvy${v}` }));
const T = (f: number) => f / FPS;
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft });
const burst = (out: Stage, at: V3, u: number, size: number, col = "#fff3b0") => { const uu = q(u, 30); fxCard(out, `burst${col}${uu}`, 500, 500, (p) => fxBurst(p, uu, col), at, size, size); };
const pop = (out: Stage, at: V3, f: number, f0: number, size = 0.6, col = "#fff3b0") => { if (f >= f0 && f < f0 + 8) burst(out, at, (f - f0) / 8, size, col); };
const scale01 = (f: number, f0: number, n = 5) => Math.min(1, 0.4 + 0.6 * clamp01((f - f0) / n));
const toward = (cam: CamInfo, at: V3, d: number): V3 => {
  const dx = cam.pos.x - at[0], dy = cam.pos.y - at[1], dz = cam.pos.z - at[2], L = Math.hypot(dx, dy, dz) || 1;
  return [at[0] + (dx / L) * d, at[1] + (dy / L) * d, at[2] + (dz / L) * d];
};
const arcP = (a: V3, b: V3, u: number, h: number): V3 => {
  const k = clamp01(u), top = Math.max(a[1], b[1]) + h;
  const y = a[1] + (b[1] - a[1]) * k + 4 * (top - (a[1] + b[1]) / 2) * k * (1 - k);
  return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
};
const hsh = (k: number, s: number) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** an item in a card's hand: right (+1) / left (-1) hand at hip height, or raised */
const inHand = (out: Stage, cam: CamInfo, p: V3, key: string, cw: number, ch: number, draw: (pp: Pen) => void, w: number, side = 1, up = false, rot = 0, s = 1) => {
  const at = onCard(cam, p, side * (up ? 0.46 : 0.44) * s, (up ? 2.2 : 0.9) * s);
  fxCard(out, key, cw, ch, draw, toward(cam, at, 0.08), w, (w * ch) / cw, rot);
};
const bl = (t: number, i: number) => lidAt(t, i);
/** a handkerchief pressed to the nose of the card standing at p */
const hanky = (out: Stage, cam: CamInfo, p: V3, s = 1) => fxCard(out, "hanky", 200, 150, fxHanky, toward(cam, onCard(cam, p, 0.04 * s, 1.36 * s), 0.3), 0.28 * s, 0.21 * s, -0.2);
/** green stink rising from the water / a spot (t animates) */
const stink = (out: Stage, f: number, at: V3, size: number, k: number) => {
  const u = ((f / 70 + 0.37 * k) % 1), tq = q(((f / 30 + k * 0.3) % 1), 12);
  fxCard(out, `stink${tq}`, 200, 300, (p) => fxStink(p, tq), [at[0], at[1] + size * (0.5 + 0.6 * u), at[2]], size * 0.67, size);
};
const haze = (out: Stage, f: number, at: V3, size: number, k: number) => {
  const u = ((f / 120 + 0.29 * k) % 1);
  fxCard(out, "haze", 300, 240, (p) => fxHaze(p), [at[0] + 2 * u, at[1] + size * 0.3 + u * size * 0.4, at[2]], size * (1 + 0.4 * u), size * 0.8 * (1 + 0.4 * u), 0, true);
};
const flies = (out: Stage, f: number, at: V3, n: number, r = 0.6) => {
  for (let k = 0; k < n; k++) {
    const a = f * (0.15 + 0.05 * hsh(k, 1)) + k * 2.1, fl = q(((f * 0.9 + k * 0.3) % 1), 4);
    fxCard(out, `fly${fl}`, 120, 100, (p) => fxFly(p, fl), [at[0] + Math.cos(a) * r, at[1] + 0.3 * Math.sin(a * 1.7), at[2] + Math.sin(a) * r * 0.6], 0.09, 0.075);
  }
};
const floating = (out: Stage, f: number, x0: number, x1: number) => {
  for (let k = 0; k < 8; k++) {
    const x = x0 + (x1 - x0) * hsh(k, 1) + 0.004 * f, z = -10 + 30 * hsh(k, 2);
    out.fx.push({ key: "bones", cw: 240, ch: 120, draw: fxBones, x, y: 0.09 + 0.02 * Math.sin(f * 0.07 + k), z, w: 0.9, h: 0.45, flat: true, rot: k });
  }
};
const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const st = (who: Who, p: V3, fo: FrontOpts, flip = false, scale = 1) => stand(out, cam, who, p, fo, t, scale, flip);
  if (id === 1 || id === 15 || id === 16) {
    const relief = id >= 15 && f >= 1495;
    st(W_POL, POL, { mode: "stand", expr: id === 1 ? (f < 100 ? "pained" : "shock") : relief ? "relief_open" : "pained", look: 0, wave: relief && f < 1530 ? 0.5 : undefined });
    if (!relief) hanky(out, cam, POL);
    if (id === 1) { for (let k = 0; k < 6; k++) haze(out, f, [300 + k * 14 + 6 * hsh(k, 1), 0.2, -4 + 22 * hsh(k, 2)], 10, k); for (let k = 0; k < 3; k++) stink(out, f, [343.6 + k * 1.3, D0 + 0.6, 31.0], 0.9, k); flies(out, f, [345, D0 + 1.9, 33.4], 3, 0.35); }
    if (id === 1) st(W_LADY, [349.2, D0, 36.6], { mode: "stand", expr: "pained", look: 0 });
    if (id === 15 && f >= 1495) fxCard(out, "hankyDrop", 200, 150, fxHanky, toward(cam, onCard(cam, POL, 0.4, Math.max(0.15, 1.36 - 0.06 * (f - 1495))), 0.3), 0.3, 0.22, 0.6);
  } else if (id === 2) {
    floating(out, f, 286, 320);
    for (let k = 0; k < 5; k++) haze(out, f, [292 + k * 9, 0.2, 4 + 14 * hsh(k, 3)], 6, k);
    for (let k = 0; k < 3; k++) stink(out, f, [298 + k * 7, 0.1, 8 + 6 * k], 1.6, k);
    const u = q(((f / 30) % 1), 8);
    fxCard(out, `out${u}`, 200, 500, (p) => fxOutflow(p, u), [PIPE[0], PIPE[1] - 1.3, PIPE[2] + 0.9], 1.1, 2.8);
  } else if (id === 3) {
    const pM: V3 = [420.8, D0, 31.2], pL: V3 = [418.6, D0, 31.6], pB: V3 = [422.6, D0, 31.4];
    const tip = ease([[318, 0], [328, 1]], f);
    st(W_MAN, pM, { mode: "stand", expr: tip > 0.5 ? "grin" : "neutral", look: 0, wave: tip > 0 ? 0.6 : undefined });
    fxCard(out, `bucket${q(tip, 8)}`, 260, 240, (p) => fxBucket(p, q(tip, 8)), toward(cam, onCard(cam, pM, 0.5, 1.6), 0.15), 0.5, 0.46);
    if (f >= 326 && f < 352) { const u = (f - 326) / 26; fxCard(out, "slop", 200, 400, fxSlop, [pM[0] + 0.3, D0 + 1.1 - 6.5 * u * u, 29.6], 0.45, 0.9); }
    if (f >= 350 && f < 366) fxCard(out, `splash${q((f - 350) / 16, 8)}`, 800, 800, (p) => fxSplash(p, q((f - 350) / 16, 8)), [pM[0] + 0.3, D0 + 0.7, 29.6], 1.6, 1.6);
    st(W_LADY, pL, { mode: "stand", expr: f >= 350 ? "shock" : "neutral", look: 0 });
    if (f >= 350) { const u = clamp01((f - 350) / 14); fxCard(out, "bones", 240, 120, fxBones, arcP([pM[0] + 0.3, D0 + 0.8, 29.8], [pL[0] + 0.6, D0 + 0.9, 30.6], u, 1.7), 0.55, 0.27, u * 6); }
    st(W_BOY, pB, { mode: "stand", expr: f >= 386 ? "grin" : "smile", look: 0 });
    flies(out, f, [420.6, D0 + 1.6, 30.6], 4, 0.6);
    for (let k = 0; k < 3; k++) stink(out, f, [418 + k * 2.4, D0 - 1.0, 29.0], 1.4, k);
  } else if (id === 4) {
    const tq = q(((f / 60) % 1) * 0.4, 12);
    fxCard(out, `sun${tq}`, 400, 400, (p) => fxSun(p, tq), [392, D0 + 70, -160], 60 * scale01(f, 434, 10), 60 * scale01(f, 434, 10));
  } else if (id === 5) {
    const v = ease([[505, 18], [560, 34]], f);
    fxCard(out, `thermo${Math.round(v)}`, 220, 600, (p) => fxThermo(p, Math.round(v)), [452.0, D0 + 2.3, 33.2], 0.55, 1.5);
  } else if (id === 6) {
    for (let k = 0; k < 7; k++) stink(out, f, [442 + k * 3.2, 0.1, 18 + 8 * hsh(k, 4)], 2.2, k);
    for (let k = 0; k < 4; k++) haze(out, f, [444 + k * 5, 0.2, 20 + 6 * hsh(k, 2)], 7, k);
    floating(out, f, 440, 462);
  } else if (id === 7) {
    const run = (who: Who, a: V3, b: V3, f0: number, k: number) => { const w = walk(f, f0, a, b, 2.2); st(who, w.p, { mode: w.moving ? "march" : "stand", phase: q(((f / FPS) * 2.4 + k * 0.3) % 1, 24), expr: "pained", look: 0 }); if (w.moving) hanky(out, cam, w.p); };
    run(W_LADY, [472.4, D0, 31.4], [467.8, D0, 37.6], 640, 0);
    run(W_MAN, [474.0, D0, 32.0], [469.4, D0, 38.4], 652, 1);
    run(W_BOY, [471.2, D0, 31.2], [466.6, D0, 36.4], 660, 2);
    run(W_POL3, [475.2, D0, 31.6], [471.0, D0, 37.8], 672, 3);
    run(W_USH, [470.0, D0, 31.0], [465.8, D0, 34.6], 684, 4);
    for (let k = 0; k < 4; k++) stink(out, f, [469 + k * 1.6, D0 - 0.4, 30.4], 1.3, k);
    flies(out, f, [471, D0 + 1.5, 32.4], 5, 0.8);
  } else if (id === 8) {
    for (let k = 0; k < 5; k++) haze(out, f, [348 + k * 6, D0 + 1, 36], 6, k);
  } else if (id === 9 || id === 10 || id === 11) {
    const p1: V3 = [567.9, D0, 63.6], p2: V3 = [566.7, D0, 61.8], pU: V3 = [569.4, D0, 61.9], p3: V3 = [569.0, D0, 64.2];
    if (id === 9) {
      st(W_POL2, p2, { mode: "stand", expr: "pained", look: 0, wave: f >= 812 && f < 850 ? 1 : undefined });
      st(W_USH, pU, { mode: "stand", expr: "nervous", look: 0, wave: f >= 848 ? q(0.5 + 0.3 * Math.sin(f * 0.4), 6) : undefined });
      fxCard(out, "lime", 300, 280, fxLime, toward(cam, onCard(cam, pU, -0.5, 0.45), 0.2), 0.55, 0.51);
      if (f >= 848) fxCard(out, `wet${q(clamp01((f - 848) / 40), 8)}`, 200, 400, (p) => fxWet(p, q(clamp01((f - 848) / 40), 8)), [569.2, D0 + 2.8, ROOM.z0 + 0.36], 0.9, 1.8, 0, true);
      st(W_POL, p1, { mode: "stand", expr: "pained", look: 0 }); hanky(out, cam, p1);
    } else if (id === 10) {
      const gag = f >= 936;
      st(W_POL, p1, { mode: "stand", expr: gag ? "shock" : "pained", look: 0 }); if (!gag) hanky(out, cam, p1);
      st(W_POL2, p2, { mode: "stand", expr: gag ? "dazed" : "pained", look: 0 });
      st(W_POL3, p3, { mode: "stand", expr: f >= 993 ? "grin" : "pained", look: 0, wave: f >= 993 ? 1 : undefined });
      for (let k = 0; k < 3; k++) stink(out, f, [562.5 + k * 5.5, D0 + 0.3, 60.7], 1.0, k);
      if (f >= 972) { const w = walk(f, 972, [569.4, D0, 66.6], [575.4, D0, 68.0], 1.8); st(W_USH, w.p, { mode: w.moving ? "march" : "stand", phase: q(((f / FPS) * 2) % 1, 24), expr: "nervous", look: 0 });
        fxCard(out, "case", 260, 200, fxCase, toward(cam, onCard(cam, w.p, 0.45, 0.75), 0.1), 0.45, 0.35); }
    } else {
      const slam = f >= 1061 && f < 1075;
      st(W_POL, p1, { mode: "stand", expr: f < 1061 ? "stern" : "grin", look: 0, wave: f >= 1050 && f < 1061 ? 1 : undefined, prop: slam ? ["hammer", 1] : null });
      pop(out, toward(cam, [567.6, TABLE.y + 0.1, TABLE.z0], 0.3), f, 1061, 0.8);
      st(W_POL2, p2, { mode: "stand", expr: "grin", look: 0 }); st(W_POL3, p3, { mode: "stand", expr: "grin", look: 0 });
      const day = Math.max(1, Math.round(ease([[1100, 1], [1128, 18]], f)));
      fxCard(out, `cal${day}`, 360, 420, (p) => fxCalendar(p, day), [568.0, D0 + 4.15, ROOM.z0 + 0.5], 1.2, 1.4);
      if (f >= 1138) fxCard(out, "law", 560, 200, fxLaw, toward(cam, [568.0, D0 + 2.9, 62.0], 0.5), 2.4 * scale01(f, 1138, 3), 0.86 * scale01(f, 1138, 3));
    }
  } else if (id === 12) {
    const show = f >= 1182;
    if (show) st(W_BAZ, BAZ, { mode: "stand", expr: f < 1208 ? "grin" : "smile", look: 0, wave: f >= 1185 && f < 1200 ? 1 : undefined });
    pop(out, toward(cam, onCard(cam, BAZ, 0, 1.1), 0.4), f, 1182, 2.4, "#ffe066");
    if (f >= 1200) { const u = ease([[1200, 0], [1228, 1]], f); fxCard(out, `plan${q(u, 16)}`, 640, 420, (p) => fxPlan(p, q(u, 16)), toward(cam, onCard(cam, BAZ, 0.72, 1.15), 0.35), 1.05, 0.69); }
    for (let k = 0; k < 3; k++) haze(out, f, [370 + k * 8, 0.3, 14 + 6 * k], 6, k);
  } else if (id === 13) {
    for (let k = 0; k < 3; k++) {
      const p: V3 = [TUN_A.x + (k % 2 ? 0.7 : -0.7), TUN_FLOOR, 88 + k * 2.6];
      st(NAV[k], p, { mode: "stand", expr: k === 1 ? "grin" : "stern", look: 0, prop: ["hammer", q(0.5 + 0.5 * Math.sin(f * 0.35 + k * 2), 6)] });
    }
  } else if (id === 14) {
    const y = Math.round(ease([[1312, 1858], [1372, 1875]], f));
    if (f < 1440) fxCard(out, `year${y}`, 520, 220, (p) => fxYear(p, y), [TUN_B.x + 0.3, TUN_FLOOR + 1.85, 79 + 0.08 * (f - 1305) + 4.2], 1.6 * (f >= 1372 ? scale01(f, 1372, 4) : 1), 0.68 * (f >= 1372 ? scale01(f, 1372, 4) : 1));
    pop(out, [TUN_B.x + 0.3, TUN_FLOOR + 1.85, 79 + 0.08 * (f - 1305) + 4.1], f, 1372, 1.6, "#ffe066");
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
