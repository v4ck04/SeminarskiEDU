// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, Outfit, FrontOpts, SideOpts,
  fxBat, fxBatSleep, fxFlame, fxSmoke, fxNoteWH, fxCancelled, fxTinyBomb, fxLid, fxThumb, fxEnvelope, fxDrop, fxZzz,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, CAVE, DENT, FDR, DESK, CHEM, OFFICER_LAB, FRIDGE, TANK, TANK_LEG, TANK_H, POLE, POLE_H, OFFICER_BASE,
  FIRE_HOOK, FIRE_TANK, EAVE_Y, walk,
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
const DENTIST: Outfit = { jacket: "#f4f1ea", pants: "#3b3f52", boots: "#3a2a22", hat: "hair", hair: "#5a3b2a", moustache: "#5a3b2a", cravat: "#3a4a8a", buttons: "#c9ccd4", skin: SK[0] };
const PRES: Outfit = { jacket: "#2c3444", pants: "#22252e", boots: "#141016", hat: "hair", hair: "#bdb9b2", cravat: "#c0353a", buttons: "#c9ccd4", skin: SK[1], build: "stout" };
const CHEMIST: Outfit = { jacket: "#f4f6f4", pants: "#2c2f3a", boots: "#141016", hat: "hair", hair: "#2a2522", cravat: "#2f6a43", buttons: "#c9ccd4", skin: SK[2] };
const officer = (v: number): Outfit => ({ jacket: "#7a6a42", pants: "#6a5c3a", boots: "#3a2a22", hat: "cap", cap: "#5a5230", buttons: "#d9b36a", belt: v ? null : "#4a3a22", skin: SK[v % 4], moustache: v ? undefined : "#5a3b2a" });
const W_D: Who = { i: 10, o: DENTIST, okey: "dentist" };
const W_P: Who = { i: 11, o: PRES, okey: "pres" };
const W_C: Who = { i: 12, o: CHEMIST, okey: "chem" };
const OFF: Who[] = [0, 1, 2].map((v) => ({ i: 20 + v, o: officer(v), okey: `off${v}` }));

const raised = (cam: CamInfo, p: V3, flip = false, s = 1): V3 => onCard(cam, p, (flip ? -0.46 : 0.46) * s, 2.25 * s);
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
const hsh = (k: number, s: number) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** a flying bat card */
const bat = (out: Stage, at: V3, f: number, k: number, size = 0.5, bomb = false, glow = false) => {
  const fl = q(((f * 0.55 + k * 0.37) % 1), 6);
  fxCard(out, `bat${fl}${bomb ? 1 : 0}${glow ? 1 : 0}`, 300, 200, (pp) => fxBat(pp, fl, bomb, glow), at, size, size * 0.667, 0.15 * Math.sin(f * 0.2 + k));
};
const flames = (out: Stage, f: number, pts: V3[], start: number, size = 2.0) => pts.forEach((p, k) => {
  if (f < start + 2 * k) return;
  const s = size * scale01(f, start + 2 * k, 3) * (0.8 + 0.3 * hsh(k, 1)), t = q(((f * 0.12 + k * 0.29) % 1), 8);
  fxCard(out, `flame${t}`, 220, 320, (pp) => fxFlame(pp, t), [p[0], p[1] + s * 0.7, p[2]], s, s * 1.45);
  const u = ((f - start) / 40 + hsh(k, 2)) % 1;
  fxCard(out, "smoke", 260, 220, fxSmoke, [p[0] + 0.6 * u, p[1] + s * 1.2 + u * 5, p[2] + 0.3], (1.4 + u * 2.5) * size / 2, (1.2 + u * 2.1) * size / 2, u);
});
const HANGAR_FIRE: V3[] = [[434, D0 + 0.2, 149.6], [439, D0 + 2.5, 149.5], [444, D0 + 0.5, 149.6], [448, D0 + 3.5, 149.5], [441, D0 + 6.0, 151.0], [436, D0 + 4.5, 150.0], [450, D0 + 0.4, 149.6]];
const TANK_FIRE: V3[] = [[466, D0 + TANK_LEG + 0.1, 138.2], [464.2, D0 + 1.0, 138.4], [467.8, D0 + 1.5, 138.5], [466, D0 + TANK_LEG + TANK_H, 139.0], [463.5, D0 + 3.5, 138.8], [468.6, D0 + 4.0, 138.9]];

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const st = (who: Who, p: V3, fo: FrontOpts, flip = false, scale = 1) => stand(out, cam, who, p, fo, t, scale, true, flip);
  if (id === 1) {
    if (f < 128) {
      for (let k = 0; k < 12; k++) { const a = f * 0.05 + k * 0.52, r = 2 + 4 * hsh(k, 3); bat(out, [445 + Math.cos(a) * r, D0 + 3.4 + 2.5 * hsh(k, 4) + Math.sin(a * 1.3), 122 + 10 * hsh(k, 5) + Math.sin(a) * 2], f, k, 1.0, true, true); }
      flames(out, f, HANGAR_FIRE, FIRE_HOOK, 2.4);
    } else {
      bat(out, [452.0 + 0.2 * Math.sin(f * 0.1), D0 + 3.3 + 0.1 * Math.sin(f * 0.3), 135.4], f, 0, 1.25, true, true);
      flames(out, f, HANGAR_FIRE, 0, 2.4);
    }
  } else if (id === 2) {
    st(W_D, DENT, { mode: "stand", expr: f < 300 ? "smile" : "shock", look: 0 });
    for (let k = 0; k < 64; k++) {
      const x = CAVE.x0 + 2.5 + (k % 16) * 0.95 + 0.3 * hsh(k, 1), z = 62 + Math.floor(k / 16) * 2.0 + 0.4 * hsh(k, 2);
      if (f < 336) fxCard(out, "batSleep", 120, 160, fxBatSleep, [x, D0 + CAVE.h - 0.4, z], 0.4, 0.53);
      else { const u = (f - 336) / 20; bat(out, [x + Math.sin(k + f * 0.2) * u * 2, D0 + CAVE.h - 0.4 - u * (1 + 2 * hsh(k, 3)), z - u * 2], f, k, 0.55); }
    }
  } else if (id === 3 || id === 10) {
    if (id === 3) {
      const u = clamp01((f - 395) / 110), p = arcP([600.0, D0 + 3.2, 64.5], [601.3, EAVE_Y - 0.25, 71.0], u, 0.4);
      if (f < 505) bat(out, p, f, 0, 1.0, true); else pop(out, [601.3, EAVE_Y - 0.25, 71.0], f, 505, 0.8, "#ffffff");
    } else {
      if (f < 1424) { const u = clamp01((f - 1376) / 20); fxCard(out, "tinybomb", 300, 200, (pp) => fxTinyBomb(pp), [598.9, D0 + 7.6 - 3.8 * u * u, 71], 0.8, 0.53, f * 0.3); }
      else if (f < 1445) { const u = (f - 1424) / 21; fxCard(out, "tinybomb", 300, 200, (pp) => fxTinyBomb(pp), arcP([598.9, D0 + 3.8, 71], [600.0, D0 + 0.3, 70], u, 1.2), 0.8, 0.53, f * 0.4); }
      else fxCard(out, "tinybomb", 300, 200, (pp) => fxTinyBomb(pp), [600.0, D0 + 0.3, 70], 0.8, 0.53, 1.5);
      pop(out, [598.9, D0 + 3.8, 71], f, 1424, 1.0, "#ffffff");
      const u = clamp01((f - 1450) / 95), p = arcP([599.9, D0 + 3.3, 66.5], [601.3, EAVE_Y - 0.25, 73.0], u, 0.3);
      if (f < 1545) bat(out, p, f, 1, 1.0, true); else pop(out, [601.3, EAVE_Y - 0.25, 73.0], f, 1545, 0.5, "#ffffff");
    }
  } else if (id === 4) {
    st(W_P, FDR, { mode: "stand", expr: f < 641 ? "neutral" : "grin", look: 0, wave: f >= 560 && f < 640 ? 0.8 : undefined });
    if (f >= 549 && f < 560) fxCard(out, "envW", 440, 300, (pp) => fxEnvelope(pp, false, false), arcP([325, D0 + 2.5, 60], raised(cam, FDR), (f - 549) / 11, 0.3), 0.36, 0.25, f * 0.4);
    if (f >= 560 && f < 640) held(out, cam, FDR, "envOpen", 440, 300, (pp) => fxEnvelope(pp, false, true), 0.36);
    if (f >= 641) fxCard(out, "note", 520, 300, fxNoteWH, toward(cam, [328.0, DESK.y + 1.3, DESK.z0 - 0.3], 0.1), 0.85 * scale01(f, 641, 5), 0.49 * scale01(f, 641, 5));
    pop(out, toward(cam, [328.0, DESK.y + 1.3, DESK.z0 - 0.3], 0.15), f, 641, 1.0);
  } else if (id === 5) {
    st(W_C, CHEM, { mode: "stand", expr: f >= 751 ? "grin" : "neutral", prop: f >= 751 ? "present" : null, look: 0 });
    if (f >= 751) { const s = scale01(f, 751, 5); fxCard(out, "tinybomb", 300, 200, (pp) => fxTinyBomb(pp), toward(cam, onCard(cam, CHEM, 0.05, 1.25), 0.1), 0.6 * s, 0.4 * s); }
    pop(out, toward(cam, onCard(cam, CHEM, 0.05, 1.25), 0.15), f, 751, 0.7);
    st(OFF[0], OFFICER_LAB, { mode: "stand", expr: f >= 727 ? "grin" : "stern", look: 0, headTilt: f >= 727 && f < 745 ? q(8 * Math.sin((f - 727) * 0.6), 2) : 0 }, true);
  } else if (id === 6) {
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++)
      fxCard(out, "batSleep", 120, 160, fxBatSleep, toward(cam, [FRIDGE.x0 + 0.22 + k * 0.34, D0 + 0.6 + r * 0.45 + 0.2, FRIDGE.z0 - 0.06], 0.02), 0.2, 0.27);
    if (f >= 948) { const z = q(((f - 948) / 30) % 1, 10); fxCard(out, `zzz${z}`, 300, 300, (pp) => fxZzz(pp, z), toward(cam, [FRIDGE.x1 - 0.1, D0 + 1.8, FRIDGE.z0], 0.2), 0.5, 0.5); }
  } else if (id === 7) {
    const open = f >= 1066;
    if (!open) fxCard(out, "lid", 300, 120, fxLid, [452.1, D0 + 0.62, 130.0], 0.85, 0.34);
    else { const u = clamp01((f - 1066) / 10); fxCard(out, "lid", 300, 120, fxLid, arcP([452.1, D0 + 0.62, 130.0], [453.3, D0 + 0.05, 129.5], u, 0.6), 0.85, 0.34, u * 2.5); }
    pop(out, [452.1, D0 + 0.8, 130.0], f, 1066, 0.7);
    for (let k = 0; k < 6; k++) {
      const f0 = 1070 + 2 * k; if (f < f0) continue;
      const u = (f - f0) / 30; bat(out, [452.1 + (hsh(k, 1) - 0.5) * 4 * u, D0 + 0.8 + 3.5 * u, 130.0 + 3 * u * hsh(k, 2)], f, k, 0.45, true);
    }
    st(OFF[1], [451.6, D0, 131.9], { mode: "stand", expr: open ? "shock" : "neutral", look: 0 });
  } else if (id === 8) {
    for (let k = 0; k < 6; k++) {
      const f0 = 1104 + 3 * k, u = clamp01((f - f0) / 34);
      const a: V3 = [462 + 2 * hsh(k, 1), D0 + 5 + 2 * hsh(k, 2), 133], b: V3 = [TANK[0] - 1.2 + 0.5 * k, D0 + TANK_LEG - 0.15, TANK[2] - 0.4];
      if (u < 1) bat(out, arcP(a, b, u, 0.5), f, k, 0.45, true, true);
      else if (f < FIRE_TANK) fxCard(out, "batSleep", 120, 160, fxBatSleep, toward(cam, b, 0.3), 0.34, 0.45);
    }
    flames(out, f, TANK_FIRE, FIRE_TANK, 2.6);
    pop(out, [466, D0 + 2.6, 138.0], f, FIRE_TANK, 4.0, "#ffd23f");
  } else if (id === 9) {
    st(OFF[0], OFFICER_BASE, { mode: "stand", expr: f >= 1292 ? "nervous" : "grin", wave: f < 1292 ? 1 : undefined, look: 0 });
    if (f < 1292) fxCard(out, "thumb", 200, 200, (pp) => fxThumb(pp), toward(cam, raised(cam, OFFICER_BASE), 0.08), 0.3, 0.3);
    if (f >= 1292) fxCard(out, "drop", 120, 170, fxDrop, toward(cam, onCard(cam, OFFICER_BASE, -0.32, 1.62), 0.05), 0.15, 0.21);
    flames(out, f, HANGAR_FIRE, 0, 2.6);
  } else if (id === 11) {
    st(OFF[2], [449.6, D0, 131.0], { mode: "stand", expr: f >= 1666 ? "sad" : "neutral", look: 0 });
    for (let k = 0; k < 2; k++) {
      const m = walk(f, 1590 + 40 * k, [452.4, D0, 130.6], [457.5, D0, 128.5], 1.2);
      if (m.moving || f < 1590 + 40 * k) st(OFF[k], m.p, { mode: m.moving ? "stroll" : "stand", phase: q(((f / FPS) * 1.3 + k * 0.4) % 1, 24), expr: "neutral", prop: "box", look: 0 });
    }
    if (f >= 1666) fxCard(out, "cancelled", 560, 180, fxCancelled, toward(cam, [452.3, D0 + 2.2, 131.0], 0.3), 2.6 * scale01(f, 1666, 3), 0.84 * scale01(f, 1666, 3));
    for (const p of [[434, D0 + 1.0, 149.6], [446, D0 + 3.0, 149.6]] as V3[]) { const u = ((f - 1572) / 60) % 1; fxCard(out, "smoke", 260, 220, fxSmoke, [p[0] + u, p[1] + 2 + 4 * u, p[2]], 2 + 2 * u, 1.7 + 1.7 * u, u); }
  } else if (id === 12) {
    fxCard(out, "batSleep", 120, 160, fxBatSleep, [POLE[0] + 0.6, D0 + POLE_H - 0.95, POLE[2] - 0.05], 0.42, 0.56);
    for (const p of [[434, D0 + 1.0, 149.6], [446, D0 + 3.0, 149.6], [466, D0 + 3, 138.5]] as V3[]) { const u = ((f - 1740) / 70) % 1; fxCard(out, "smoke", 260, 220, fxSmoke, [p[0] + u, p[1] + 2 + 4 * u, p[2]], 2 + 2 * u, 1.7 + 1.7 * u, u); }
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
