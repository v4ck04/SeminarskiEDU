// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, fxQ, townsfolk, Outfit, FrontOpts, SideOpts,
  JENSEN, fxPaper3, fxDenied, fxTarget, fxScissors, fxCounter, fxPhone, fxNotes, fxConfetti, fxScroll,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, easeOut, JS, DARK, TRADERS, ANALYST, BOARD, TABLE, CHEF, walk,
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
const stand = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, t: number, scale = 1, shadow = true, flip = false) => {
  const pl = person(cam, who, p[0], p[1], p[2], front, { blink: fo.blink ?? lidAt(t, who.i), ...fo }, {}, scale);
  if (flip) pl.mirror = true;
  out.places.push(pl);
  if (shadow) blob(out, p[0], p[1], p[2], scale * (fo.mode === "sit" ? 1.15 : 1));
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
const T = (f: number) => f / FPS;

// ---------------- the cast ----------------
const SK = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
const HAIR = ["#3a2a22", "#c98a4a", "#2a2522", "#7a4a2a", "#9a9aa2"];
const SHIRT = ["#8fb3d9", "#e9edf2", "#b7c9a8", "#d9c3e6", "#f0d9a8"];
const suit = (v: number, cravat = "#c0353a", hair = HAIR[v % 5]): Outfit => ({ jacket: ["#2c3444", "#3a3f4c", "#24262e", "#4a5160"][v % 4], pants: "#22252e", boots: "#141016", hat: "hair", hair, cravat, buttons: "#c9ccd4", skin: SK[v % 4] });
const trader = (v: number): Outfit => ({ jacket: SHIRT[v % 5], pants: "#2c2f3a", boots: "#141016", hat: "hair", hair: HAIR[(v + 2) % 5], cravat: ["#1f3b8a", "#c0353a", "#2f6a43"][v % 3], buttons: "#ffffff", skin: SK[(v + 1) % 4] });
const AGENT: Outfit = { jacket: "#1f2a44", pants: "#1c2236", boots: "#141016", hat: "hair", hair: "#2a2522", label: "FBI", skin: SK[2] };
const AGENT2: Outfit = { ...AGENT, hair: "#5a3b2a", skin: SK[1] };
const CHEF_O: Outfit = { jacket: "#f4f1ea", pants: "#2c2a35", boots: "#141016", hat: "cap", cap: "#ffffff", buttons: "#2c2a35", skin: SK[1], moustache: "#3a2a22" };

const W_J: Who = { i: 10, o: JENSEN, okey: "jensen" };
const TR: Who[] = TRADERS.map((_, k) => ({ i: 20 + k, o: trader(k), okey: `tr${k}` }));
const BD: Who[] = [0, 1, 2, 3].map((k) => ({ i: 40 + k, o: suit(k, ["#c0353a", "#76b900", "#1f3b8a", "#c9a04a"][k], ["#9a9aa2", "#2a2522", "#d9b878", "#5a3b2a"][k]), okey: `bd${k}` }));
const AG: Who[] = [{ i: 50, o: AGENT, okey: "ag0" }, { i: 51, o: AGENT2, okey: "ag1" }];
const SEN: Who[] = [0, 1].map((k) => ({ i: 52 + k, o: suit(k + 1, k ? "#1f3b8a" : "#c0353a", k ? "#e4ded2" : "#9a9aa2"), okey: `sen${k}` }));
const AN: Who = { i: 60, o: suit(2, "#f2c230", "#2a2522"), okey: "analyst" };
const FANS: Who[] = [0, 1, 2, 3, 4].map((v) => ({ i: 70 + v, o: townsfolk(v + 1), okey: `fan${v}` }));
const INV: Who[] = [0, 1, 2, 3, 4].map((v) => ({ i: 80 + v, o: v % 2 ? suit(v) : townsfolk(v + 3), okey: `inv${v}` }));
const CHEFW: Who = { i: 90, o: CHEF_O, okey: "chef" };
const DIN: Who[] = [0, 1, 2, 3].map((v) => ({ i: 91 + v, o: townsfolk(v + 2), okey: `din${v}` }));

/** the raised hand of a standing card (wave = 1); flip = drawn mirrored (the hand on the other side) */
const raised = (cam: CamInfo, p: V3, flip = false, s = 1): V3 => onCard(cam, p, (flip ? -0.46 : 0.46) * s, 2.25 * s);
/** the point d metres from `at` toward the lens (so a held card never z-fights the card holding it) */
const toward = (cam: CamInfo, at: V3, d: number): V3 => {
  const dx = cam.pos.x - at[0], dy = cam.pos.y - at[1], dz = cam.pos.z - at[2], L = Math.hypot(dx, dy, dz) || 1;
  return [at[0] + (dx / L) * d, at[1] + (dy / L) * d, at[2] + (dz / L) * d];
};
const held = (out: Stage, cam: CamInfo, p: V3, key: string, cw: number, ch: number, draw: (pp: Pen) => void, w: number, s = 1, flip = false, rot = 0) => {
  const h = raised(cam, p, flip), hh = (w * ch) / cw;
  fxCard(out, key, cw, ch, draw, toward(cam, [h[0], h[1] - 0.45 * hh * s, h[2]], 0.06), w * s, hh * s, rot);
};
const pop = (out: Stage, at: V3, f: number, f0: number, size = 0.6, col = "#fff3b0") => { if (f >= f0 && f < f0 + 8) burst(out, at, (f - f0) / 8, size, col); };
const scale01 = (f: number, f0: number, n = 5) => Math.min(1, 0.4 + 0.6 * clamp01((f - f0) / n));
const arcP = (a: V3, b: V3, u: number, h: number): V3 => {
  const k = clamp01(u), top = Math.max(a[1], b[1]) + h;
  const y = a[1] + (b[1] - a[1]) * k + 4 * (top - (a[1] + b[1]) / 2) * k * (1 - k);
  return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
};
const ask = (out: Stage, cam: CamInfo, p: V3, f: number, f0: number, k: number) => {
  if (f < f0) return;
  const s = scale01(f, f0, 4);
  fxCard(out, "q", 200, 240, fxQ, onCard(cam, p, 0.05, 2.3 + 0.04 * Math.sin(f * 0.2 + k)), 0.26 * s, 0.31 * s);
};
const CONF = ["#f2c230", "#2fe07a", "#ef4f6c", "#4fa3d9", "#ffffff", "#76b900"];

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const st = (who: Who, p: V3, fo: FrontOpts, flip = false, scale = 1) => stand(out, cam, who, p, fo, t, scale, true, flip);
  const traders = (expr: (k: number) => FrontOpts["expr"], wave: (k: number) => number | undefined) =>
    TR.forEach((w, k) => st(w, TRADERS[k], { mode: "stand", expr: expr(k), wave: wave(k), look: 0 }, k % 2 === 1));
  if (id === 1) {
    const up = f >= 115;
    traders((k) => (up ? (k % 3 === 0 ? "laugh" : "shock") : k % 2 ? "neutral" : "whistle"), (k) => (up && k % 3 === 0 ? q(0.7 + 0.3 * Math.sin(f * 0.5 + k), 6) : undefined));
    pop(out, [333.5, D0 + 5.4, 79.3], f, 116, 2.2);
  } else if (id === 2) {
    st(W_J, JS, { mode: "stand", expr: f < 300 ? "smile" : "grin", wave: f >= 228 && f < 300 ? q(0.6 + 0.4 * Math.sin((f - 228) * 0.15), 6) : f >= 330 ? 0.6 : undefined, look: 0 });
    pop(out, toward(cam, [JS[0], JS[1] + 1.0, JS[2]], 0.15), f, 331, 0.7);
  } else if (id === 3) {
    if (f < DARK.a) st(W_J, JS, { mode: "stand", expr: f < 425 ? "neutral" : "sad", headTilt: f < 425 ? 0 : -6, look: 0 });
  } else if (id === 4) {
    [478, 547, 648].forEach((f0, k) => {
      if (f < f0) return;
      const u = clamp01((f - f0) / 9), to: V3 = [333.5 + (k - 1) * 0.12, D0 + 2.25 - k * 0.03, 66.6 - k * 0.04];
      const from: V3 = [to[0] + (k % 2 ? -2.2 : 2.2), D0 + 0.6, 65.4];
      fxCard(out, `paper3_${k}`, 520, 680, (pp) => fxPaper3(pp, k), arcP(from, to, easeOut(u), 0.4), 1.18, 1.54, (1 - easeOut(u)) * (k % 2 ? 3 : -3) + (k - 1) * 0.05);
    });
    if (f >= 658) fxCard(out, "denied", 460, 180, fxDenied, toward(cam, [333.6, D0 + 2.0, 66.5], 0.08), 0.95 * scale01(f, 658, 3), 0.37 * scale01(f, 658, 3));
  } else if (id === 5) {
    BD.forEach((w, k) => { st(w, BOARD[k], { mode: "stand", expr: f >= 751 ? "nervous" : "neutral", prop: f >= 760 ? "paper" : null, wave: f >= 760 ? 0.5 : undefined, look: 0 }); ask(out, cam, BOARD[k], f, 755 + 3 * k, k); });
    const door: V3 = [373.6, D0, 62.6];
    const groups: [Who, V3, number][] = [[AG[0], [371.0, D0, 63.7], 688], [AG[1], [370.3, D0, 63.2], 696], [SEN[0], [369.6, D0, 63.7], 711], [SEN[1], [368.9, D0, 63.2], 719]];
    groups.forEach(([w, p, f0], k) => {
      if (f < f0) return;
      const m = walk(f, f0, door, p, 1.7);
      st(w, m.p, { mode: m.moving ? "stroll" : "stand", phase: q((((f - f0) / FPS) * 1.4) % 1, 24), expr: "stern", look: 0, prop: !m.moving && f >= 765 ? "paper" : null, wave: !m.moving && f >= 765 ? 0.5 : undefined }, true);
      if (!m.moving) ask(out, cam, m.p, f, 770 + 4 * k, k + 4);
    });
  } else if (id === 6) {
    traders((k) => (f >= 850 ? (k % 2 ? "shock" : "sad") : "nervous"), () => undefined);
    const cut = f >= 981 ? 1 : f >= 960 ? q((f - 960) / 21, 8) : 0;
    st(AN, ANALYST, { mode: "stand", expr: f >= 981 ? "nervous" : "stern", wave: 1, look: 0 });
    held(out, cam, ANALYST, `target${cut}`, 520, 300, (pp) => fxTarget(pp, cut), 0.95);
    const h = raised(cam, ANALYST);
    if (f >= 946 && f < 984) { const o = q(0.5 + 0.5 * Math.sin((f - 946) * 0.9), 4); fxCard(out, `sc${o}`, 300, 300, (pp) => fxScissors(pp, o), toward(cam, [h[0] - cam.right.x * 0.02, h[1] - 0.2 - 0.36 * clamp01((f - 960) / 21), h[2]], 0.12), 0.5, 0.5, -1.4); }
    if (f >= 981) { const u = clamp01((f - 981) / 12); fxCard(out, "halfcut", 260, 300, (pp) => { pp.g.translate(-250, 0); fxTarget(pp, 0); }, toward(cam, [h[0] + cam.right.x * 0.25, h[1] - 0.25 - 1.7 * u * u, h[2]], 0.06), 0.47, 0.55, u * 1.5); }
    pop(out, toward(cam, [h[0], h[1] - 0.3, h[2]], 0.15), f, 981, 0.6, "#ffffff");
  } else if (id === 7 || id === 8) {
    if (id === 8) { if (f < 1168) st(BD[0], [436.0, D0 + 0.45, 119.55], { mode: "stand", expr: "stern", look: f >= 1146 && f < 1166 ? q(Math.sin((f - 1146) * 0.6), 2) : 0 }); return; }
    const ps: V3[] = [[433.0, D0, 114.6], [434.6, D0, 114.9], [436.2, D0, 114.6], [437.8, D0, 114.9], [439.4, D0, 114.6]];
    FANS.forEach((w, k) => st(w, ps[k], { mode: "stand", expr: k % 2 ? "grin" : "smile", wave: id === 7 && k % 2 === 0 ? q(0.6 + 0.4 * Math.sin(f * 0.2 + k), 6) : undefined, look: 0 }));
    fxCard(out, "scroll", 1400, 200, fxScroll, [436.2, D0 + 1.05, 114.3], 6.3, 0.9);
    if (id === 7) {
      if (f >= 1102) fxCard(out, "counter", 600, 220, (pp) => fxCounter(pp, 170000), [436.2, D0 + 3.3, 114.0], 2.4 * scale01(f, 1102, 5), 0.88 * scale01(f, 1102, 5));
      pop(out, [436.2, D0 + 3.3, 113.8], f, 1102, 2.0);
    } else if (f < 1168) {
      const bp: V3 = [436.0, D0 + 0.45, 119.55];
      st(BD[0], bp, { mode: "stand", expr: "stern", look: f >= 1146 && f < 1166 ? q(Math.sin((f - 1146) * 0.6), 2) : 0 });
    }
  } else if (id === 9) {
    BD.forEach((w, k) => { const up = f >= 1268 + 3 * k; st(w, BOARD[k], { mode: "stand", expr: up ? (k % 2 ? "grin" : "smile") : "neutral", wave: up ? 1 : undefined, look: 0 }); });
    if (f >= 1314) { const m = walk(f, 1314, [371.6, D0, 64.9], [370.2, D0, 64.9], 1.4); st(W_J, m.p, { mode: m.moving ? "stroll" : "stand", phase: q((((f - 1314) / FPS) * 1.4) % 1, 24), expr: "grin", look: 0 }, true); }
    pop(out, [369.0, D0 + 3.0, 66.4], f, 1276, 2.6, "#ffffff");
  } else if (id === 10) {
    BD.forEach((w, k) => st(w, BOARD[k], { mode: "stand", expr: k === 1 && f >= 1385 ? "grin" : "smile", wave: k === 1 && f >= 1385 && f < 1440 ? 1 : undefined, look: k === 1 ? 0 : 0.3 }));
    const ph: V3 = [367.4, TABLE.y + 0.28, TABLE.z0 + 0.25];
    if (f < 1385) fxCard(out, `phone${q((f % 8) / 8, 8)}`, 300, 540, (pp) => fxPhone(pp, (f % 8) / 8, true), ph, 0.3, 0.54);
    else if (f < 1440) held(out, cam, BOARD[1], "phoneOn", 300, 540, (pp) => fxPhone(pp, 0, false), 0.22);
    st(W_J, [370.2, D0, 64.9], { mode: "stand", expr: "smile", look: 0 }, true);
    const inv: [Who, V3][] = [[AG[0], [362.3, D0, 62.2]], [AG[1], [363.4, D0, 62.9]]];
    inv.forEach(([w, p], k) => { st(w, p, { mode: "stand", expr: "stern", wave: q(0.5 + 0.15 * Math.sin(f * 0.7 + k), 6), look: 0 }); held(out, cam, p, `notes${k}`, 260, 320, (pp) => fxNotes(pp, k), 0.3); });
  } else if (id === 11) {
    const ps: V3[] = [[331.3, D0, 66.9], [332.4, D0, 67.2], [333.5, D0, 66.9], [334.6, D0, 67.2], [335.7, D0, 66.9]];
    INV.forEach((w, k) => st(w, ps[k], { mode: "stand", expr: f >= 1658 ? (k % 2 ? "smile_closed" : "grin") : f >= 1600 ? "neutral" : "nervous", look: 0, wave: f >= 1662 && k === 2 ? 0.8 : undefined }, k > 2));
    pop(out, [333.5, D0 + 4.3, 79.6], f, 1655, 2.4, "#ffffff");
  } else if (id === 12) {
    const gone = f >= 1752;
    if (!gone) st(CHEFW, CHEF, { mode: "stand", expr: "smile", look: 0, wave: f >= 1700 && f < 1740 ? 0.6 : undefined });
    else { const m = walk(f, 1752, CHEF, [482.2, D0, 68.6], 1.6); if (m.moving) st(CHEFW, m.p, { mode: "stroll", phase: q((((f - 1752) / FPS) * 1.3) % 1, 24), expr: "whistle", look: 0 }); }
    const seats: V3[] = [[483.65, D0, 63.9], [485.55, D0, 63.9], [487.05, D0, 64.7], [489.4, D0, 64.7]];
    DIN.forEach((w, k) => {
      const f0 = 1818 + 6 * k;
      if (f < f0) st(w, seats[k], { mode: "stand", expr: gone ? (k % 2 ? "nervous" : "sad") : "smile", look: 0 });
      else { const m = walk(f, f0, seats[k], [k < 2 ? 494.5 : 481.5, D0, 60.5], 1.8); if (m.moving) st(w, m.p, { mode: "stroll", phase: q((((f - f0) / FPS) * 1.3) % 1, 24), expr: "sad", look: 0 }, k >= 2); }
    });
  } else if (id === 13) {
    traders((k) => (k % 2 ? "laugh" : "grin"), (k) => q(0.75 + 0.25 * Math.sin(f * 0.45 + k * 1.3), 6));
    if (f >= 1890) for (let k = 0; k < 46; k++) {
      const h1 = Math.sin(k * 127.1) * 43758.5, h2 = Math.sin(k * 311.7) * 9631.3, r1 = h1 - Math.floor(h1), r2 = h2 - Math.floor(h2);
      const u = ((f - 1890) / 75 + r2) % 1, x = 330.0 + 7 * r1, z = 64.5 + 3.5 * r2;
      fxCard(out, `conf${k % 6}`, 64, 128, (pp) => fxConfetti(pp, CONF[k % 6]), [x + 0.3 * Math.sin(f * 0.1 + k), D0 + 4.6 - 4.4 * u, z], 0.07, 0.14, f * 0.15 + k);
    }
  } else if (id === 14) {
    const m = walk(f, 2020, [433.4, D0, 116.4], [435.6, D0, 116.4], 0.9);
    st(W_J, m.p, { mode: m.moving ? "stroll" : "stand", phase: q((((f - 2025) / FPS) * 1.2) % 1, 24), expr: f >= 2178 ? "grin" : "smile", wave: f >= 2178 ? q(0.7 + 0.3 * Math.sin(f * 0.4), 6) : undefined, look: 0 }, true);
    for (const [k, p] of [[0, [434.0, D0, 115.0]], [1, [437.4, D0, 115.0]]] as [number, V3][]) st(FANS[k + 1], p, { mode: "stand", expr: "laugh", wave: q(0.7 + 0.3 * Math.sin(f * 0.5 + k), 6), look: 0 }, k === 0);
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
