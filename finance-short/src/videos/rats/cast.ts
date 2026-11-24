// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, Outfit, FrontOpts, SideOpts,
  fxCancelled, fxDrop, fxAsia, fxTailSign, fxRatCount, fxChalk, fxEyes, fxCoin, fxScissors,
  drawRat, RatDraw, fxLamp, fxTailCut, fxBowl, fxPointer,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, ease, walk, MAN, CRATE, CRATE_H, POSTER, DRAINS, LEDGE_H, DRAIN_B, CHAIR, SEAT_H, COUNTER, BOARD, CAGES,
} from "./story";
import { FigPlace } from "./fig3d";
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
export type Stage = { places: Place[]; fx: FxPlace[]; figs: FigPlace[] };

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
const SK = ["#ffe2c2", "#f5c9a0", "#d9a878", "#c99067"];
const OFFICIAL: Outfit = { jacket: "#f6f3ea", pants: "#efebe0", boots: "#5a3a26", hat: "pith", moustache: "#4a3424", cravat: "#2f4a9a", buttons: "#d9c27a", skin: SK[1], build: "stout" };
const worker = (v: number): Outfit => ({ jacket: ["#4a6a8a", "#7a5a3a", "#5a7a4a", "#8a4a3a", "#6a8a5a"][v % 5], pants: v % 2 ? "#3a3328" : "#2f3440", boots: "#2a2220",
  hat: "nonla", belt: "#5a3a22", skin: [SK[2], SK[3], "#d4a070", "#b98258", SK[3]][v % 5] });
const CLERK: Outfit = { jacket: "#f4f6f4", pants: "#2c2f3a", boots: "#141016", hat: "hair", hair: "#2a2522", cravat: "#c0353a", buttons: "#c9ccd4", skin: "#ecd0b6" };
const FOREMAN: Outfit = { jacket: "#d9cfa8", pants: "#5a4a32", boots: "#2a2220", hat: "cap", cap: "#4a4030", moustache: "#3a2a1a", belt: "#4a3a22", buttons: "#7a6440", skin: "#e7b98a", build: "stout" };
const LADY: Outfit = { jacket: "#f4d6e0", pants: "#c86a8a", dress: "#c86a8a", boots: "#7a2a3a", hat: "hair", hair: "#6a3a22", skin: SK[0] };
const W_OFF: Who = { i: 1, o: OFFICIAL, okey: "official" };
const W_LADY: Who = { i: 2, o: LADY, okey: "lady" };
const W_CLERK: Who = { i: 6, o: CLERK, okey: "clerk" };
const W_FORE: Who = { i: 4, o: FOREMAN, okey: "foreman" };
const WK: Who[] = [0, 1, 2, 3, 4].map((v) => ({ i: 10 + v, o: worker(v), okey: `wk${v}` }));

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
const RAT_S = 0.42; // rat card scale (the 600 x 1000 card -> ~0.55 m wide)
/** a 2D rat card; dir = +1 runs to screen right, -1 to the left (side view); it casts a real shadow too */
const rat = (out: Stage, cam: CamInfo, p: V3, o: RatDraw, dir = 1, scale = 1) => {
  const s = RAT_S * scale, d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 0.3, p[2])) / s;
  const [w, h, k] = tier(d * 0.7);
  out.places.push({ key: `RAT|${fkey(o)}`, x: p[0], y: p[1], z: p[2], scale: s, mirror: o.view === "side" && dir < 0, draw: (pp) => drawRat(pp, o), size: [w, h, k] });
};
const runQ = (f: number, k: number, rate = 0.16) => q(((f * rate + hsh(k, 7)) % 1), 8);
const bl = (t: number, i: number) => lidAt(t, i);
/** the top-hat rat on the crate (shots 1 and 14) */
const hatRat = (out: Stage, cam: CamInfo, f: number, tip = 0, expr: RatDraw["expr"] = "grin") => {
  const count = q(Math.max(0, Math.sin(f * 0.45)), 4);
  rat(out, cam, [CRATE[0] - 0.08, D0 + CRATE_H, CRATE[2] - 0.02], { view: "up", hat: true, tip: q(tip, 12), paw: 0.3 + 0.5 * count, wave: tip > 0 ? q(tip, 12) : 0, expr, blink: bl(T(f), 3) }, 1, 1.25);
};
/** a crowd of rats scurrying over the boulevard */
const crowd = (out: Stage, cam: CamInfo, f: number, n: number, cx: number, cz: number, R: number, tails = 0.5) => {
  for (let k = 0; k < n; k++) {
    const sp = 0.6 + hsh(k, 2) * 0.8, z = cz - R + 2 * R * hsh(k, 3), dir = k % 2 ? 1 : -1;
    const span = 12, x0 = cx - span / 2 + span * hsh(k, 1);
    const x = cx - span / 2 + ((x0 - (cx - span / 2) + dir * sp * f / FPS) % span + span) % span;
    rat(out, cam, [x, D0 + (Math.abs(x - 296) > 5 ? 0.15 : 0), z], { view: "side", run: runQ(f, k, 0.2), tail: hsh(k, 4) > tails }, dir * (cam.right.x < 0 ? -1 : 1), 0.95);
  }
};

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const st = (who: Who, p: V3, fo: FrontOpts, flip = false, scale = 1) => stand(out, cam, who, p, fo, t, scale, flip);
  if (id === 1 || id === 14) {
    const tip = id === 14 ? Math.max(0, Math.sin(clamp01((f - 1795) / 24) * Math.PI)) : 0;
    hatRat(out, cam, f, tip);
    const wide = (id === 1 && f >= 108) || (id === 14 && f >= 1840);
    if (wide) crowd(out, cam, f, 26, 297, 104, 6, id === 14 ? 0.15 : 0.6);
    else for (let k = 0; k < 3; k++) rat(out, cam, [298.4 + k * 1.1, D0, 107.0 + 0.6 * hsh(k, 1)], { view: "side", run: runQ(f, k), tail: k % 2 === 0 }, k % 2 ? 1 : -1, 0.9);
    if (id === 1 && f >= 64 && f < 100) { const u = (f - 64) / 36; fxCard(out, `coin${q(u, 8)}`, 200, 200, (p) => fxCoin(p, u * 2), toward(cam, [CRATE[0] + 0.18, D0 + CRATE_H + 0.3 + 0.3 * Math.sin(u * Math.PI), CRATE[2]], 0.1), 0.14, 0.14); }
  } else if (id === 2) {
    const gest = f >= 250 && f < 300;
    st(W_OFF, [297.7, D0, 92.7], { mode: "stand", expr: f < 230 ? "smile" : "grin", look: 0, wave: gest ? 0.6 : undefined });
    const w = walk(f, 160, [289.8, D0 + 0.15, 98], [289.8, D0 + 0.15, 112], 1.0);
    st(W_LADY, w.p, { mode: "stroll", phase: q(((f / FPS) * 1.4) % 1, 24), expr: "smile", look: 0 });
    const w2 = walk(f, 170, [303.0, D0 + 0.15, 108], [303.0, D0 + 0.15, 96], 1.1);
    st(WK[3], w2.p, { mode: "stroll", phase: q(((f / FPS) * 1.5) % 1, 24), expr: "neutral", look: 0 });
  } else if (id === 3) {
    for (let k = 0; k < 16; k++) {
      const z = 96 - ((f - 310 + 90 * hsh(k, 1)) * (0.08 + 0.03 * hsh(k, 2)));
      if (z < 57.5) continue;
      const x = k % 3 ? 340.4 + 1.3 * hsh(k, 3) : 344.4 + 1.3 * hsh(k, 3);
      rat(out, cam, [x, D0 + LEDGE_H, z], { view: "front", run: runQ(f, k, 0.22), tail: true, expr: "grin" }, 1, 0.9);
    }
  } else if (id === 4) {
    const up = clamp01((f - 412) / 6);
    if (f >= 410) rat(out, cam, [DRAIN_B[0], D0 - 0.32 * (1 - up), DRAIN_B[2]], { view: f >= 440 ? "up" : "front", expr: "grin", blink: bl(t, 5) }, 1, 1.0);
    const jump = clamp01((f - 428) / 9);
    const a: V3 = [361.9, D0, 59.3], b: V3 = [CHAIR[0], D0 + SEAT_H, CHAIR[2] - 0.05];
    const p = f < 428 ? a : arcP(a, b, jump, 0.5);
    const scared = f >= 420;
    st(W_LADY, p, { mode: "stand", expr: scared ? "shock" : "smile", look: 0, wave: scared ? 1 : undefined });
    if (scared) fxCard(out, "drop", 120, 170, fxDrop, toward(cam, onCard(cam, p, -0.34, 1.75), 0.1), 0.14, 0.2);
  } else if (id === 5) {
    const p: V3 = [390.1, D0, 66.3];
    st(W_OFF, p, { mode: "stand", expr: f < 505 ? "neutral" : f < 540 ? "nervous" : "sad", look: f < 528 ? -1 : 0 });
    const k = ease([[479, 0], [560, 1]], f);
    fxCard(out, `asia${q(k, 24)}`, 600, 440, (pp) => fxAsia(pp, k), [391.7, D0 + 2.2, 67.55], 2.0, 1.47);
  } else if (id === 6) {
    const off: V3 = [298.1, D0, 93.0];
    for (let k = 0; k < 2; k++) {
      const f0 = 598 + k * 46;
      const w = walk(f, f0 - 30, [296.3 + 0.2 * k, D0, 89.0], [MAN[0], D0, MAN[2] - 0.05], 1.2);
      const sink = clamp01((f - f0) / 40);
      if (sink >= 1) continue;
      const p: V3 = [w.p[0], D0 - 1.9 * sink * sink, w.p[2]];
      st(WK[k], p, { mode: w.moving ? "stroll" : "stand", phase: q(((f / FPS) * 1.5) % 1, 24), expr: k ? "smile" : "grin", look: 0, wave: sink > 0 ? 1 : undefined });
      if (sink < 0.3) inHand(out, cam, p, "lamp", 160, 240, fxLamp, 0.22, -1);
    }
    const w2: V3 = [295.2, D0, 90.9];
    const paid = f >= 679;
    st(WK[2], w2, { mode: "stand", expr: paid ? "grin" : "smile", look: 0, prop: paid ? "coin" : null });
    inHand(out, cam, w2, "lamp", 160, 240, fxLamp, 0.22, -1);
    st(W_OFF, off, { mode: "stand", expr: "grin", look: 0, prop: f >= 668 && f < 679 ? "coin" : null });
  } else if (id === 7) {
    const p: V3 = [384.5, D0, 64.3];
    const stamp = f >= 781 && f < 812 ? q(Math.abs(Math.sin((f - 781) * 0.32)), 4) : 0;
    st(W_FORE, p, { mode: "stand", expr: f >= 796 ? "grin" : "smile", look: 0, prop: ["stamp", stamp], wave: f >= 728 && f < 760 ? 1 : undefined });
    for (let k = 0; k < 2; k++) st(WK[k], [383.0 + 2.8 * k, D0, 61.3 - 0.4 * k], { mode: "stand", expr: "smile", look: 0 });
    const n = Math.round(20114 * ease([[752, 0], [817, 1]], f));
    fxCard(out, `count${n}`, 600, 240, (pp) => fxRatCount(pp, n), [384.5, D0 + 2.85, 67.6], 2.3, 0.92);
    pop(out, toward(cam, [384.5, D0 + 2.85, 67.5], 0.3), f, 817, 1.6);
  } else if (id === 8) {
    const c: V3 = [383.4, D0, 64.3];
    st(W_CLERK, c, { mode: "stand", expr: f < 896 ? "pained" : f < 959 ? "stern" : "smile", look: 0, prop: f >= 976 ? "coin" : null });
    fxCard(out, "peg", 120, 80, (pp) => { pp.poly([[20, 10], [50, 10], [50, 70], [20, 70]], "#c99a5a", 5); pp.poly([[70, 10], [100, 10], [100, 70], [70, 70]], "#c99a5a", 5); pp.dot(60, 40, 9, "#9aa0aa"); }, toward(cam, onCard(cam, c, 0, 1.6), 0.25), 0.12, 0.08);
    for (let k = 0; k < 4; k++) {
      const w: V3 = [383.5 + 0.15 * (k % 2), D0, 61.7 - k * 0.95];
      const show = f >= 950 + 4 * k;
      st(WK[k], w, { mode: "stand", expr: show ? "grin" : "smile", look: 0, wave: show ? 1 : undefined });
      if (show) inHand(out, cam, w, "tailcut", 300, 120, fxTailCut, 0.32, 1, true, -0.6);
    }
    const s = f >= 959 ? scale01(f, 959, 5) : 0;
    if (s) fxCard(out, "tailSign", 520, 360, fxTailSign, [383.5, D0 + 2.65, 67.6], 1.8 * s, 1.25 * s);
    pop(out, toward(cam, [383.5, D0 + 2.65, 67.5], 0.3), f, 959, 1.6);
  } else if (id === 9) {
    const p: V3 = [297.2, D0, 96.4];
    st(W_OFF, p, { mode: "stand", expr: f < 1057 ? "grin" : f < 1127 ? "nervous" : "shock", look: 0, headTilt: f >= 1095 ? 10 : 0 });
    const u = ease([[1068, 0], [1112, 0.55], [1128, 0.55], [1156, 1]], f);
    const rp: V3 = [299.6 - 4.6 * u, D0, 95.3];
    const moving = (f >= 1068 && f < 1112) || f >= 1128;
    rat(out, cam, rp, moving ? { view: "side", run: runQ(f, 1, 0.22), tail: false } : { view: "front", tail: false, expr: "grin", blink: bl(t, 7) }, cam.right.x < 0 ? 1 : -1, 1.05);
  } else if (id === 10) {
    const w: V3 = [341.0, D0 + LEDGE_H, 71.0];
    const cut = f >= 1206;
    const snip = f < 1194 ? 1 : f < 1206 ? 1 - (f - 1194) / 12 : f < 1214 ? (f - 1206) / 8 : 1;
    st(WK[1], w, { mode: "stand", expr: cut ? "grin" : "smile", look: 0 });
    if (f < 1232) inHand(out, cam, w, `sc${q(snip, 6)}`, 300, 300, (pp) => fxScissors(pp, q(snip, 6)), 0.3, 1, false, -0.4);
    if (cut) inHand(out, cam, w, "tailcut", 300, 120, fxTailCut, 0.3, -1, false, 0.9);
    inHand(out, cam, w, "lampB", 160, 240, fxLamp, 0.2, -1, false, 0, 0.6);
    const u = ease([[1232, 0], [1262, 1]], f);
    const rp: V3 = [341.5 + 0.25 * u, D0 + LEDGE_H, 70.3 - 1.4 * u];
    const wave = f >= 1266;
    rat(out, cam, rp, f >= 1232 && f < 1262 ? { view: "side", run: runQ(f, 2, 0.24), tail: !cut } : { view: wave ? "up" : "front", tail: !cut, expr: cut ? "grin" : "neutral", wave: wave ? q(0.6 + 0.4 * Math.sin(f * 0.5), 6) : 0, blink: bl(t, 9) }, 1, 1.05);
  } else if (id === 11) {
    st(WK[4], [447.0, D0, 147.4], { mode: "stand", expr: "smile", look: 1 });
    inHand(out, cam, [447.0, D0, 147.4], "bowl", 240, 140, fxBowl, 0.32, 1, false);
    CAGES.forEach((c, i) => { for (let k = 0; k < 2; k++) rat(out, cam, [c[0] - 0.22 + 0.44 * k, c[1] + 0.06, c[2] + 0.05], { view: "front", tail: true, expr: (i + k) % 3 ? "neutral" : "grin", blink: bl(t, 50 + i * 2 + k) }, 1, 0.7); });
    for (let k = 0; k < 3; k++) rat(out, cam, [445.6 + k * 0.6, D0, 146.6 - 0.35 * k], k === 1 ? { view: "up", tail: true, expr: "grin" } : { view: "front", tail: true }, 1, 0.85);
    const peek = ease([[1361, 0], [1375, 1]], f);
    if (f >= 1355) st(W_OFF, [449.9 - 1.0 * peek, D0, 150.9], { mode: "stand", expr: f >= 1397 ? "shock" : "stern", look: -1 });
  } else if (id === 12) {
    if (f >= 1470) fxCard(out, "cancelled", 560, 180, fxCancelled, toward(cam, [POSTER[0] - 0.05, POSTER[1], POSTER[2]], 0.6), 1.7 * scale01(f, 1470, 3), 0.55 * scale01(f, 1470, 3));
    pop(out, [POSTER[0] - 0.15, POSTER[1], POSTER[2]], f, 1470, 1.4);
    for (let k = 0; k < 4; k++) rat(out, cam, [302.3 + 0.55 * (k % 2), D0 + 0.15, 98.4 + k * 1.15], { view: k % 2 ? "up" : "front", tail: k === 3, expr: k % 2 ? "grin" : "neutral", blink: bl(t, 30 + k) }, 1, 0.95);
    if (f >= 1514) for (const [i, d] of DRAINS.entries()) { if (bl(t, 40 + i) > 0.5) continue; fxCard(out, "eyes", 120, 60, fxEyes, [d[0] - 0.05, d[1] + 0.06, d[2]], 0.22, 0.11); }
  } else if (id === 13) {
    const p: V3 = [389.7, D0, 66.2];
    st(W_OFF, p, { mode: "stand", expr: f < 1675 ? "grin" : "stern", look: -1, wave: 0.7 });
    fxCard(out, "pointer", 400, 60, fxPointer, toward(cam, onCard(cam, p, -0.9, 2.2), 0.1), 1.0, 0.15, 0.25);
    const k = ease([[1600, 0], [1700, 1]], f), cb = clamp01((f - 1619) / 8);
    fxCard(out, `chalk${q(k, 20)}${q(cb, 4)}`, 640, 300, (pp) => fxChalk(pp, k, cb), [(BOARD.x0 + BOARD.x1) / 2 + 0.2, (BOARD.y0 + BOARD.y1) / 2, BOARD.z - 0.09], 3.7, 1.73);
  }
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [], figs: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  shotStage(out, cam, id, f);
  return out;
};
