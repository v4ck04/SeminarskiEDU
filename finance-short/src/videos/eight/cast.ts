// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, fxQ, fxStars, fxCoin, KID, PARENT,
  townsfolk, Outfit, FrontOpts, SideOpts, fxBankCard, fxEnvelope, fxBadge8, fxDrop, fxHeart, fxWeed, fxBill, fxCheque,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, TL, MGR, MGR5, MGR14, TOWER, CY, CARD_H, COLLAPSE, towerN, MONITORS, STAMP, TRAY, BOARD, BOSS3, FRAME8,
  EIGHT, WALK, walkX, INSPX, INSPZ, outAt, MAT, KIDP, PARENTP, GARDEN,
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
const HAIR = ["#3a2a22", "#c98a4a", "#2a2522", "#7a4a2a"];
/** tellers: the bank's red blazer, a gold tie */
const teller = (v: number): Outfit => ({ jacket: "#b8262e", pants: "#2c2a35", boots: "#241726", hat: "hair", hair: HAIR[v % 4], cravat: "#f2c230", buttons: "#f2c230", skin: SK[(v + 1) % 4] });
export const MANAGER: Outfit = { jacket: "#3a3f4c", pants: "#2c2f3a", boots: "#141016", hat: "hair", hair: "#5a3b2a", cravat: "#c0353a", buttons: "#d9dde0", moustache: "#5a3b2a", build: "stout", skin: SK[1] };
export const BOSS: Outfit = { jacket: "#1f2a44", pants: "#1c2236", boots: "#141016", hat: "hair", hair: "#bdb9b2", cravat: "#f2c230", buttons: "#c9ccd4", skin: SK[0] };
const inspector = (v: number): Outfit => ({ jacket: ["#5a6070", "#4a5160", "#6a6a72"][v % 3], pants: "#3a3f4c", boots: "#141016", hat: "hair", hair: ["#2a2522", "#9a9aa2", "#5a3b2a"][v % 3], cravat: "#2c2c34", buttons: "#d9dde0", skin: SK[(v + 2) % 4] });
const OLDMAN: Outfit = { jacket: "#7b8f5a", pants: "#4a4552", boots: "#3a2a22", hat: "hair", hair: "#e4ded2", moustache: "#e4ded2", skin: SK[0], buttons: "#e8dcc0" };
const WOMAN: Outfit = { jacket: "#d9739a", dress: "#d9739a", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#7a4a2a", skin: SK[3] };
const CUST: Outfit = { jacket: "#3f8f5a", pants: "#4a4552", boots: "#3a2a22", hat: "cap", cap: "#e0b648", skin: SK[2] };

const TEL: Who[] = [0, 1, 2, 3].map((v) => ({ i: 10 + v, o: teller(v), okey: `tel${v}` }));
const WMGR: Who = { i: 20, o: MANAGER, okey: "mgr" };
const WBOSS: Who = { i: 21, o: BOSS, okey: "boss" };
const INSP: Who[] = [0, 1, 2].map((v) => ({ i: 30 + v, o: inspector(v), okey: `insp${v}` }));
const WOLD: Who = { i: 40, o: OLDMAN, okey: "old" };
const WWOM: Who = { i: 41, o: WOMAN, okey: "woman" };
const WCUST: Who = { i: 42, o: CUST, okey: "cust" };
const WKID: Who = { i: 43, o: KID, okey: "kid" };
const WPAR: Who = { i: 44, o: PARENT, okey: "parent" };
const TOWN: Who[] = [0, 1, 2, 3, 4, 5].map((v) => ({ i: 50 + v, o: townsfolk(v), okey: `t${v}` }));

/** the raised hand of a standing card (wave = 1); flip = drawn mirrored (the hand on the other side) */
const raised = (cam: CamInfo, p: V3, flip = false, s = 1): V3 => onCard(cam, p, (flip ? -0.46 : 0.46) * s, 2.25 * s);
/** the point d metres from `at` toward the lens (so a held card never z-fights the card holding it) */
const toward = (cam: CamInfo, at: V3, d: number): V3 => {
  const dx = cam.pos.x - at[0], dy = cam.pos.y - at[1], dz = cam.pos.z - at[2], L = Math.hypot(dx, dy, dz) || 1;
  return [at[0] + (dx / L) * d, at[1] + (dy / L) * d, at[2] + (dz / L) * d];
};
/** a card held up in the raised hand (its top edge at the hand) */
const held = (out: Stage, cam: CamInfo, p: V3, key: string, cw: number, ch: number, draw: (pp: Pen) => void, w: number, s = 1, flip = false, rot = 0) => {
  const h = raised(cam, p, flip), hh = (w * ch) / cw;
  fxCard(out, key, cw, ch, draw, toward(cam, [h[0], h[1] - 0.45 * hh * s, h[2]], 0.06), w * s, hh * s, rot);
};
const pop = (out: Stage, at: V3, f: number, f0: number, size = 0.6, col = "#fff3b0") => { if (f >= f0 && f < f0 + 8) burst(out, at, (f - f0) / 8, size, col); };
const scale01 = (f: number, f0: number, n = 5) => Math.min(1, 0.4 + 0.6 * clamp01((f - f0) / n));
/** a stamping arm: struck (1) for 3 frames on each hit, then lifting back */
const stampK = (f: number, hits: number[]) => {
  let k = 0;
  for (const h of hits) { const d = f - h; if (d >= -4 && d < 0) k = Math.max(k, 1 + d / 4 * 0.9); else if (d >= 0 && d < 3) k = 1; else if (d >= 3 && d < 10) k = Math.max(k, 1 - (d - 3) / 7); }
  return q(k, 8);
};
const card = (out: Stage, at: V3, s: number, kind = 0, rot = 0) => fxCard(out, `bankcard${kind}`, 400, 260, (pp) => fxBankCard(pp, kind), at, 0.34 * s, 0.221 * s, rot);
const envelope = (out: Stage, at: V3, s: number, gold = false, open = false, rot = 0) => fxCard(out, `env${gold ? 1 : 0}${open ? 1 : 0}`, 440, 300, (pp) => fxEnvelope(pp, gold, open), at, 0.4 * s, 0.273 * s, rot);

const towerTop = (f: number): V3 => [TOWER[0], TOWER[1] + towerN(f) * CARD_H + 0.05, TOWER[2]];

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const st = (who: Who, p: V3, fo: FrontOpts, flip = false, scale = 1) => stand(out, cam, who, p, fo, t, scale, true, flip);
  if (id === 1) {
    // the stamping teller; a card lands on the tower with every few stamps
    const hits = [6, 24, 42, 58, 74, 90, 106, 122, 136];
    st(TEL[3], TL[3], { mode: "stand", expr: f < 70 ? "grin" : "whistle", prop: ["stamp", stampK(f, hits)], look: 0 });
    for (const h of hits) pop(out, [STAMP[0] - 0.05, CY + 0.1, STAMP[2] - 0.15], f, h, 0.32, "#ffffff");
    for (const h of [30, 64, 98, 130]) pop(out, towerTop(h), f, h, 0.3);
  } else if (id === 2) {
    TOWN.forEach((w, k) => st(w, [walkX(f, k), D0, WALK[k].z], { mode: "stroll", phase: q(((f - 140) / FPS * 0.95 + k * 0.31) % 1, 24), expr: k % 2 ? "smile" : "whistle", look: 0 }, WALK[k].v < 0));
    pop(out, [EIGHT[0] + 0.25, EIGHT[1] + 0.35, EIGHT[2] - 0.2], f, 252, 1.6);
    pop(out, [EIGHT[0] - 0.35, EIGHT[1] - 0.3, EIGHT[2] - 0.2], f, 258, 0.9, "#ffffff");
  } else if (id === 3) {
    // the boss grins at his framed 8; on "great" he laughs and the frame sparkles
    st(WBOSS, BOSS3, { mode: "stand", expr: f < 300 ? "smile" : f < 371 ? "grin" : "laugh", wave: f >= 296 ? q(0.55 + 0.25 * Math.sin((f - 296) * 0.18), 6) : undefined, look: 0 }, true);
    pop(out, [FRAME8[0] + 0.2, FRAME8[1] + 0.3, FRAME8[2] + 0.2], f, 371, 1.0);
    pop(out, [FRAME8[0] + 0.2, FRAME8[1] - 0.4, FRAME8[2] - 0.3], f, 377, 0.6, "#ffffff");
  } else if (id === 4) {
    // the manager taps the board; the tellers straighten up; each gets a number
    st(WMGR, MGR, { mode: "stand", expr: f < 419 ? "stern" : "grin", wave: f >= 410 && f < 440 ? q(f < 419 ? 0.4 + (f - 410) * 0.07 : 1 - 0.4 * clamp01((f - 419) / 6), 8) : f >= 440 ? 0.7 : undefined, look: 0 });
    pop(out, toward(cam, raised(cam, MGR), 0.1), f, 419, 0.55, "#ffffff");
    TEL.forEach((w, k) => {
      const up = f >= 455 + 2 * k;
      st(w, TL[k], { mode: "stand", expr: up ? (k % 2 ? "nervous" : "neutral") : "smile_closed", look: 0, tilt: up ? 0 : (k % 2 ? 6 : -6) }, false, up ? 1.0 : 0.97);
      const g0 = 468 + 3 * k;
      if (f >= g0) fxCard(out, "badge8", 240, 240, fxBadge8, onCard(cam, TL[k], 0, 2.42 + 0.03 * Math.sin((f - g0) * 0.2)), 0.36 * scale01(f, g0, 4), 0.36 * scale01(f, g0, 4));
      pop(out, onCard(cam, TL[k], 0, 2.42), f, g0, 0.45);
    });
  } else if (id === 5) {
    // the bonus: a gold envelope flies to the teller on the left; the miss: the manager glares at the one on the right
    const glare = f >= 538;
    st(WMGR, MGR5, { mode: "stand", expr: glare ? "stern" : "smile", wave: !glare && f >= 506 && f < 520 ? 1 : undefined, tilt: glare ? 7 : -4, look: 0 }, !glare);
    if (f >= 506 && f < 513) envelope(out, toward(cam, raised(cam, MGR5, true), 0.06), 1, true);
    if (f >= 513 && f < 521) envelope(out, arcP(raised(cam, MGR5, true), raised(cam, TL[1]), (f - 513) / 8, 0.25), 1, true, false, (f - 513) * 0.5);
    const got = f >= 521;
    st(TEL[1], TL[1], { mode: "stand", expr: got ? "laugh" : "smile", wave: got ? 1 : undefined, look: 0 });
    if (got) held(out, cam, TL[1], "env10", 440, 300, (pp) => fxEnvelope(pp, true), 0.42, scale01(f, 521, 4));
    pop(out, raised(cam, TL[1]), f, 521, 0.7);
    st(TEL[2], TL[2], { mode: "stand", expr: glare ? "nervous" : "neutral", look: glare ? 0 : -0.5 }, false, glare ? 0.96 : 1);
    if (f >= 542) fxCard(out, "drop", 120, 170, fxDrop, toward(cam, onCard(cam, TL[2], -0.32, 1.62 - 0.1 * clamp01((f - 542) / 30)), 0.05), 0.15, 0.21);
    st(TEL[0], TL[0], { mode: "stand", expr: "neutral", look: 0 });
    st(TEL[3], TL[3], { mode: "stand", expr: "neutral", look: 0 });
  } else if (id === 6) {
    // a customer says goodbye and walks out; behind him the teller keeps opening accounts
    const walking = f >= 606, u = Math.max(0, (f - 606) / FPS);
    const cp: V3 = [43.0 + 1.1 * u, D0, 42.95 - 0.12 * u];
    st(WCUST, cp, { mode: walking ? "stroll" : "stand", phase: q((u * 0.95) % 1, 24), expr: "smile", wave: f >= 590 && f < 606 ? q(0.6 + 0.4 * Math.sin(f * 0.5), 4) : undefined, look: 0 }, true);
    st(TEL[1], TL[1], { mode: "stand", expr: f < 606 ? "smile" : "whistle", look: f >= 620 ? 0.6 : 0 });
    for (let k = 0; k < 4; k++) pop(out, [MONITORS[1][0], CY + 0.62, MONITORS[1][2] - 0.1], f, 600 + 22 * k, 0.3, "#ffffff");
    st(TEL[0], TL[0], { mode: "stand", expr: "whistle", look: 0 });
  } else if (id === 7) {
    // cards into envelopes on the tray; the monitor asks for a PIN, then an email
    st(TEL[0], TL[0], { mode: "stand", expr: "whistle", wave: f >= 694 ? 0.9 : undefined, look: 0.3 });
    const drops = [698, 712, 726, 740, 754];
    const hand = raised(cam, TL[0]), env: V3 = [TRAY[0], CY + 0.24, TRAY[2] - 0.14];
    const cur = drops.find((d) => f >= d - 8 && f < d + 4);
    const hc = toward(cam, [hand[0], hand[1] - 0.08, hand[2]], 0.06);
    if (f >= 694 && cur !== undefined && f < cur) card(out, hc, 0.9, 0, -0.2);
    for (const d of drops) if (f >= d && f < d + 5) card(out, arcP(hc, env, (f - d) / 5, 0.12), 0.9, 0, -0.2 - (f - d) * 0.3);
    envelope(out, env, 1.3, false, true);
    for (const d of drops) pop(out, env, f, d + 5, 0.32, "#ffffff");
    pop(out, [MONITORS[0][0], CY + 0.62, MONITORS[0][2] - 0.1], f, 728, 0.45, "#ffffff");
    pop(out, [MONITORS[0][0], CY + 0.62, MONITORS[0][2] - 0.1], f, 754, 0.45, "#ffffff");
  } else if (id === 8) {
    // an envelope drops onto the doormat; the old man frowns at it
    const p: V3 = [60.0, D0 + 0.2, 36.2];
    st(WOLD, p, { mode: "stand", expr: f < 790 ? "neutral" : "stern", look: f >= 786 ? 0.25 : 0, headTilt: f >= 786 ? 5 : 0 });
    const land = 786, from: V3 = [59.2, D0 + 2.6, 35.3], to: V3 = [MAT[0] + 0.2, D0 + 0.03, MAT[2] - 0.05];
    if (f >= 776 && f < land) envelope(out, arcP(from, to, (f - 776) / (land - 776), 0.1), 0.9, false, false, (f - 776) * 0.4);
    if (f >= land) flat(out, "envflat", 440, 300, (pp) => fxEnvelope(pp, false, false), to, 0.36, 0.25, 0.3);
    pop(out, to, f, land, 0.45, "#ffffff");
    if (f >= 806) fxCard(out, "q", 200, 240, fxQ, onCard(cam, p, 0.05, 2.45 + 0.03 * Math.sin(f * 0.2)), 0.3 * scale01(f, 806, 4), 0.36 * scale01(f, 806, 4));
  } else if (id === 9) {
    // the tower keeps growing, a few cards at a time; the calendar flips (world.ts)
    st(TEL[3], TL[3], { mode: "stand", expr: "grin", prop: ["stamp", stampK(f, [838, 852, 866, 880, 894, 908])], look: 0 });
    st(TEL[2], TL[2], { mode: "stand", expr: "whistle", look: 0 });
    for (const g of [834, 855, 868, 886, 902]) pop(out, towerTop(g), f, g, 0.42);
  } else if (id === 10) {
    // the inspectors walk in with their reports; the tower bursts
    INSP.forEach((w, k) => {
      const x = INSPX(f, k), walking = f < 960 + 6 * k;
      st(w, [x, D0, INSPZ[k]], { mode: walking ? "stroll" : "stand", phase: q(((f - 912) / FPS * 0.95 + k * 0.3) % 1, 24), expr: "stern", prop: "paper", wave: walking ? undefined : 0.5, look: 0 }, true);
    });
    const shock = f >= COLLAPSE;
    TEL.forEach((w, k) => st(w, TL[k], { mode: "stand", expr: shock ? "shock" : f >= 930 ? "nervous" : "whistle", look: shock ? 0 : -0.6 }, false, shock && f < COLLAPSE + 6 ? 1.04 : 1));
    st(WMGR, MGR, { mode: "stand", expr: shock ? "shock" : "nervous", look: 0 });
    pop(out, [TOWER[0], CY + 1.2, TOWER[2]], f, COLLAPSE, 2.4, "#ffffff");
  } else if (id === 11) {
    // fired: the tellers come out of the door with their boxes
    for (let k = 0; k < 3; k++) {
      const o = outAt(f, k);
      if (!o.walking) continue;
      st(TEL[k], o.p, { mode: "stroll", phase: q((((f - 1040) / FPS) * 0.9 + k * 0.33) % 1, 24), expr: "sad", prop: "box", look: 0 });
    }
  } else if (id === 12) {
    // luckily: a brand new credit card, like a present. unluckily: the bill unrolls to the ground
    const p: V3 = [60.0, D0 + 0.2, 36.2];
    const opened = f >= 1160, bill = f >= 1206;
    st(WWOM, p, { mode: "stand", expr: f >= 1258 ? "shock" : bill ? "neutral" : opened ? "laugh" : "smile", wave: 1, look: 0 });
    if (!opened) held(out, cam, p, "env00", 440, 300, (pp) => fxEnvelope(pp, false, false), 0.4);
    else {
      held(out, cam, p, "bankcard1", 400, 260, (pp) => fxBankCard(pp, 1), 0.4, 1.15 * scale01(f, 1160, 5));
      if (!bill) for (const [dx, dy, k] of [[-0.3, 0.35, 0], [0.35, 0.15, 1], [-0.1, -0.25, 2]] as [number, number, number][]) {
        const tt = q(((f - 1160) / 18 + k * 0.33) % 1, 12), at = raised(cam, p);
        fxCard(out, `spark${tt}`, 200, 200, (pp) => fxStars(pp, tt), [at[0] + cam.right.x * dx, at[1] + dy, at[2] + cam.right.z * dx - 0.05], 0.3, 0.3);
      }
    }
    pop(out, raised(cam, p), f, 1160, 0.8);
    if (bill) {
      const k = q(clamp01((f - 1206) / 54) ** 0.8, 24), h = raised(cam, p), w = 0.5, hh = (w * 1400) / 300;
      fxCard(out, `bill${k}`, 300, 1400, (pp) => fxBill(pp, k), toward(cam, [h[0], h[1] - 0.06 - hh / 2, h[2]], 0.1), w, hh);
    }
  } else if (id === 13) {
    // pay a kid for every weed he pulls ... and soon he starts planting weeds
    const pulled = f >= 1318, planting = f >= 1360 && f < 1384, planted = f >= 1372;
    const coin1 = f >= 1334 && f < 1344, coin2 = f >= 1392 && f < 1402;
    st(WPAR, PARENTP, { mode: "stand", expr: f >= 1392 ? "smile" : "smile_closed", prop: "coin", look: 0 }, true);
    st(WKID, KIDP, {
      mode: "stand", expr: planting ? "whistle" : f >= 1384 ? "grin" : pulled ? "laugh" : "smile",
      wave: pulled && f < 1356 ? 1 : f >= 1402 ? 0.8 : undefined, tilt: planting ? -16 : 0, prop: f >= 1344 ? "coin" : null, look: planting ? 0.8 : 0,
    });
    const kh = raised(cam, KIDP, false, 0.78);
    // the weeds in the bed: two standing at the kid's spot; one is pulled, a new one gets planted
    const spot = (dx: number): V3 => [GARDEN.x0 + 0.95 + dx, D0 + 0.42, GARDEN.z1 - 0.38];
    if (!pulled) fxCard(out, "weedIn", 260, 420, (pp) => fxWeed(pp, false), spot(0), 0.4, 0.65);
    fxCard(out, "weedIn", 260, 420, (pp) => fxWeed(pp, false), spot(0.55), 0.36, 0.58);
    if (pulled && f < 1356) fxCard(out, "weedOut", 260, 420, (pp) => fxWeed(pp, true), toward(cam, [kh[0], kh[1] - 0.24, kh[2]], 0.05), 0.4, 0.65);
    if (planting && !planted) fxCard(out, "weedOut", 260, 420, (pp) => fxWeed(pp, true), [spot(-0.35)[0], D0 + 0.6, spot(-0.35)[2] + 0.1], 0.38, 0.6);
    if (planted) fxCard(out, "weedIn", 260, 420, (pp) => fxWeed(pp, false), spot(-0.35), 0.4, 0.65);
    pop(out, kh, f, 1318, 0.6);
    pop(out, spot(-0.35), f, 1372, 0.5, "#ffffff");
    const ph = raised(cam, PARENTP, true), kc = onCard(cam, KIDP, 0.38, 1.25);
    if (coin1) fxCard(out, "coin0", 200, 200, (pp) => fxCoin(pp, q((f % 6) / 6, 6)), arcP(ph, kc, (f - 1334) / 10, 0.5), 0.16, 0.16);
    if (coin2) fxCard(out, "coin0", 200, 200, (pp) => fxCoin(pp, q((f % 6) / 6, 6)), arcP(ph, kc, (f - 1392) / 10, 0.5), 0.16, 0.16);
    pop(out, kc, f, 1344, 0.4); pop(out, kc, f, 1402, 0.4);
  } else if (id === 14) {
    // the manager hugs his number
    st(WMGR, MGR14, { mode: "stand", expr: "smile_closed", prop: "slate", headTilt: q(6 * Math.sin(f * 0.08), 4), look: 0 });
    for (let k = 0; k < 4; k++) {
      const u = ((f - 1421) / 40 + k * 0.25) % 1;
      const at = onCard(cam, MGR14, (k % 2 ? 0.35 : -0.4) + 0.08 * Math.sin(u * 6), 2.2 + 0.9 * u);
      const s = 0.2 * Math.min(1, u * 4) * (1 - u * 0.4);
      if (f >= 1430) fxCard(out, "heart", 200, 180, fxHeart, at, s, s * 0.9);
    }
  } else if (id === 15) {
    // the cheque; the fence (world.ts) shoots up behind them
    const bp: V3 = [42.0, D0, 32.4], fence = f >= 1646;
    st(WBOSS, bp, { mode: "stand", expr: fence ? "shock" : f >= 1590 ? "nervous" : "neutral", prop: f >= 1590 ? "present" : null, look: 0 });
    if (f >= 1590) { const s = scale01(f, 1590, 6); fxCard(out, "cheque", 1000, 460, fxCheque, toward(cam, onCard(cam, bp, 0, 0.88), 0.12), 1.65 * s, 0.76 * s); }
    pop(out, toward(cam, onCard(cam, bp, 0.55, 0.7), 0.14), f, 1590, 0.8);
    st(INSP[0], [40.75, D0, 32.75], { mode: "stand", expr: "stern", prop: "paper", wave: 0.5, look: 0 }, true);
    st(INSP[1], [43.25, D0, 32.75], { mode: "stand", expr: "stern", prop: "paper", wave: 0.5, look: 0 });
  } else if (id === 16) {
    // alone in front of the fence, the gold 8 above
    st(WBOSS, [42.0, D0, 32.2], { mode: "stand", expr: "sad", look: 0, headTilt: -4 });
  }
};

/** ballistic point from a to b with apex h above the higher end */
const arcP = (a: V3, b: V3, u: number, h: number): V3 => {
  const k = clamp01(u), top = Math.max(a[1], b[1]) + h;
  const y = a[1] + (b[1] - a[1]) * k + 4 * (top - (a[1] + b[1]) / 2) * k * (1 - k);
  return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
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
