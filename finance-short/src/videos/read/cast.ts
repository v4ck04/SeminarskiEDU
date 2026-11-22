// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, READ, STRANGER, NURSE, townie, fxBurst, fxShadow, fxContact, fxCoin,
  fxBill, fxSoap, fxPill, fxBulb, fxTicket, fxCrypto, fxStack, fxBreakfast, fxLeaf, fxCapItem, Outfit, Expr, FrontOpts, SideOpts, Prop,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, smooth, READ_GAS, READ_STORE, READ_CAR, READ_DINER, READ_BENCH, BENCH, TABLE, LIBRARY, HOSPITAL, STORE,
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
const RD: Who = { i: 7, o: READ, okey: "read" };
const front = { side: false, mirror: false };
const stand = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, t: number, scale = 1, shadow = true) => {
  out.places.push(person(cam, who, p[0], p[1], p[2], front, { blink: fo.blink ?? lidAt(t, who.i), ...fo }, {}, scale));
  if (shadow) blob(out, p[0], D0, p[2], scale * (fo.mode === "sit" ? 1.15 : 1));
};
const onCard = (cam: CamInfo, p: V3, dx: number, dy: number): V3 => [p[0] + cam.right.x * dx, p[1] + dy, p[2] + cam.right.z * dx];
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft });
const burst = (out: Stage, at: V3, u: number, size: number, col = "#fff3b0") => { const uu = q(u, 30); fxCard(out, `burst${col}${uu}`, 500, 500, (p) => fxBurst(p, uu, col), at, size, size); };
/** an icon that pops in at f0 (overshoot), holds, with a small burst */
const pop = (out: Stage, f: number, f0: number, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number) => {
  if (f < f0) return;
  const u = (f - f0) / 8, k = u < 1 ? 1.15 * Math.sin((Math.PI / 2) * u) / Math.sin(Math.PI / 2) : 1 + 0.15 * Math.max(0, 1 - (u - 1) * 2);
  fxCard(out, key, cw, ch, draw, [at[0], at[1] + 0.03 * Math.sin((f - f0) * 0.15), at[2]], w * k, (w * ch / cw) * k);
  if (f < f0 + 6) burst(out, at, (f - f0) / 6, w * 1.4);
};
const leaves = (out: Stage, f: number, c: V3, n = 14, spread = 5) => {
  for (let i = 0; i < n; i++) {
    const u = ((f / 30) * (0.18 + 0.08 * hh(i, 1)) + hh(i, 2)) % 1, sw = Math.sin(f * 0.07 + i) * 0.6;
    const kind = i % 4, rot = q(Math.sin(f * 0.09 + i * 2), 8);
    fxCard(out, `leaf${kind}`, 120, 120, (p) => fxLeaf(p, kind), [c[0] + (hh(i, 3) - 0.5) * spread + sw, c[1] + 5.5 - 5.4 * u, c[2] + (hh(i, 4) - 0.5) * spread * 0.6], 0.16, 0.16, rot * 3);
  }
};

// ---------------- the town crowd ----------------
type Spot = { x: number; z: number; v: number; i: number };
const crowdAt = (cx: number, cz: number, n: number, w: number, d: number, seed = 0): Spot[] => {
  const out: Spot[] = [];
  for (let i = 0; i < n; i++) out.push({ x: cx - w / 2 + ((i + 0.5) * w) / n + (hh(i + seed, 1) - 0.5) * (w / n) * 0.6, z: cz + (hh(i + seed, 2) - 0.5) * d, v: (i * 3 + seed) % 16, i: 100 + i + seed });
  return out.sort((a, b) => b.z - a.z);
};
const crowd = (out: Stage, cam: CamInfo, f: number, spots: Spot[], mood: (s: Spot, f: number) => { expr: Expr; wave?: number; prop?: Prop }, outfit = townie) => {
  const f2 = f - (f % 2);
  for (const s of spots) {
    const m = mood(s, f2);
    stand(out, cam, { i: s.i, o: outfit(s.v), okey: `${outfit === townie ? "tw" : "nu"}${s.v}` }, [s.x, D0, s.z], { mode: "stand", expr: m.expr, wave: m.wave, prop: m.prop ?? null, blink: lidAt(f2 / FPS, s.i) }, f2 / FPS);
  }
};
const waving = (s: Spot, f: number, amp = 1) => q(amp * Math.sin(f * 0.32 + s.i * 1.7), 4);

/** banknotes raining down over a crowd from frame f0 (the gift arriving) */
const moneyRain = (out: Stage, f: number, f0: number, c: V3, spread: number) => {
  if (f < f0) return;
  for (let i = 0; i < 26; i++) {
    const t0 = f0 + hh(i, 7) * 14, u = (f - t0) / 40;
    if (u < 0) continue;
    const y = Math.max(D0 + 0.05, D0 + 5.5 - 4.2 * u);
    fxCard(out, "billrain", 300, 150, fxBill, [c[0] + (hh(i, 8) - 0.5) * spread + 0.4 * Math.sin(f * 0.12 + i), y, c[2] - 0.6 + (hh(i, 9) - 0.5) * 2], 0.36, 0.18, Math.sin(f * 0.2 + i * 1.3));
  }
};
const T = (f: number) => f / FPS;
const HOOK = crowdAt(STORE[0] + 0.6, 37.0, 8, 4.2, 2.2, 3);
const LIB = crowdAt(LIBRARY[0], 37.6, 12, 11, 2.6, 21);
const HOSP = crowdAt(HOSPITAL[0], 68.8, 10, 8, 2.4, 41);

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  if (id === 1) {
    // the town reads the news; on "eight million" the papers drop and the jaws drop
    const shock = f >= 95;
    crowd(out, cam, f, HOOK, (sp) => ({ expr: shock ? (sp.i % 3 ? "shock" : "shock") : sp.i % 2 ? "neutral" : "smile", prop: shock ? null : "news" }));
    if (f >= 95 && f < 101) burst(out, [STORE[0], D0 + 2.6, 37.2], (f - 95) / 6, 3.2, "#ffffff");
    if (f >= 95) for (let i = 0; i < HOOK.length; i++) { // money rains on the town
      const sp = HOOK[i], u = clamp01((f - 95) / 26);
      fxCard(out, "billrain", 300, 150, fxBill, [sp.x + 0.3 * Math.sin(f * 0.2 + i), D0 + 3.4 - 3.3 * u, sp.z - 0.3], 0.34, 0.17, Math.sin(f * 0.25 + i));
    }
  } else if (id === 2) {
    stand(out, cam, RD, READ_GAS, { mode: "stand", expr: "neutral", prop: "nozzle", look: -1 }, t);
  } else if (id === 3) {
    const w = q(Math.sin((f - 218) * 0.22), 6);
    stand(out, cam, RD, READ_STORE, { mode: "stand", expr: f < 270 ? "neutral" : "smile_closed", prop: "mop", wave: w }, t);
  } else if (id === 4) {
    stand(out, cam, RD, READ_CAR, { mode: "stand", expr: f < 376 ? "smile_closed" : "neutral", look: f < 340 ? -1 : 0 }, t);
    if (f >= 386 && f < 392) burst(out, onCard(cam, READ_CAR, -0.24, 1.2), (f - 386) / 6, 0.3, "#ffffff");
  } else if (id === 5) {
    // sitting at the terrace table with his coffee; a stranger leaves money for him
    stand(out, cam, RD, READ_DINER, { mode: "sit", expr: f < 452 ? "smile_closed" : f < 500 ? "neutral" : "neutral", look: f > 452 && f < 500 ? 1 : 0 }, t, 1, false);
    fxCard(out, "breakfast", 320, 200, fxBreakfast, [TABLE[0] + 0.15, D0 + 0.86, TABLE[2] - 0.1], 0.5, 0.31);
    const sx = TABLE[0] + 1.05 - 0.25 * smooth((f - 430) / 20), sz = TABLE[2] - 0.35;
    stand(out, cam, { i: 50, o: STRANGER, okey: "stranger" }, [sx, D0, sz], { mode: "stand", expr: f < 470 ? "sad" : "smile", prop: f >= 448 && f < 478 ? "money" : null, look: -1 }, t);
    if (f >= 474) fxCard(out, "billTable", 300, 150, fxBill, [TABLE[0] + 0.35, D0 + 0.8, TABLE[2] - 0.22], 0.26, 0.13, 0.25);
  } else if (id === 6) {
    stand(out, cam, RD, READ_BENCH, { mode: "sit", expr: f < 600 ? "smile_closed" : "smile", prop: f < 600 ? "news" : null }, t, 1, false);
    const top = onCard(cam, READ_BENCH, 0, 1.75);
    pop(out, f, 620, "soap", 240, 300, fxSoap, onCard(cam, READ_BENCH, -0.48, 1.6), 0.32);
    pop(out, f, 630, "pill", 300, 160, fxPill, onCard(cam, READ_BENCH, 0.02, 1.92), 0.38);
    pop(out, f, 648, "bulb", 260, 300, fxBulb, onCard(cam, READ_BENCH, 0.5, 1.6), 0.32);
    void top;
  } else if (id === 7) {
    // golden: the stack of share certificates grows beside him, decade after decade
    stand(out, cam, RD, READ_BENCH, { mode: "sit", expr: "smile_closed" }, t, 1, false);
    const n = Math.round(4 + 34 * smooth((f - 680) / 75));
    fxCard(out, `stack${n}`, 300, 400, (p) => fxStack(p, n), [BENCH[0] - 0.62, D0 + 0.5 + 0.5, BENCH[2] - 0.05], 0.6, 0.8);
    for (let i = 0; i < 6; i++) { const u = ((f - 674) / 22 + i / 6) % 1; const sp = q(((f * 0.1 + i) % 1), 12);
      fxCard(out, `coin${sp}`, 200, 200, (p) => fxCoin(p, sp), [BENCH[0] - 0.62 + (hh(i, 5) - 0.5) * 0.3, D0 + 2.4 - 1.3 * u, BENCH[2] - 0.1], 0.1, 0.1); }
    leaves(out, f, [BENCH[0], D0, BENCH[2]], 10, 4);
  } else if (id === 8) {
    const cheer = f >= 869;
    crowd(out, cam, f, LIB, (sp, ff) => ({ expr: cheer ? (sp.i % 3 ? "laugh" : "grin") : "smile", wave: cheer || sp.i % 4 === 0 ? waving(sp, ff, cheer ? 1 : 0.4) : undefined }));
    moneyRain(out, f, 869, [LIBRARY[0], D0, 37.6], 8);
    leaves(out, f, [LIBRARY[0], D0, 37], 16, 10);
  } else if (id === 9) {
    const cheer = f >= 937;
    crowd(out, cam, f, HOSP, (sp, ff) => ({ expr: cheer ? (sp.i % 3 ? "laugh" : "relief_open") : "smile", wave: cheer ? waving(sp, ff, 1) : undefined }), NURSE);
    moneyRain(out, f, 937, [HOSPITAL[0], D0, 68.8], 7);
  } else if (id === 10) {
    // the empty bench at sunset: his cap left on it; the lesson icons cross themselves out
    fxCard(out, "capItem", 260, 140, fxCapItem, [BENCH[0] + 0.1, D0 + 0.58, BENCH[2] - 0.05], 0.36, 0.2);
    pop(out, f, 970, "ticket", 300, 220, fxTicket, [BENCH[0] - 0.5, D0 + 1.65, BENCH[2] - 0.6], 0.46);
    pop(out, f, 993, "crypto", 260, 260, fxCrypto, [BENCH[0] + 0.55, D0 + 1.65, BENCH[2] - 0.6], 0.4);
    leaves(out, f, [BENCH[0], D0, BENCH[2] - 1], 14, 6);
  }
  return out;
};
export { FPS, smooth };
