// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, townie, fxBurst, fxShadow, fxContact, fxCoin,
  fxBill, fxSoap, fxPill, fxBulb, fxBreakfast, fxLeaf, Outfit, Expr, FrontOpts, SideOpts, Prop,
  NEWTON, READ, investor, townsfolk, TWAIN_O, FISHER_O, MERI_O, PARTNER, BANKER, REPORTER, fxPaper, fxApple, fxStamp, fxBook, fxBadge, fxIntegral,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, smooth, BENCH, EXCH, TICKER, YOU_BENCH, NEWT, TWAIN, FISH, MERI, FED, READP, cue, seg,
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
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1080; };
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
const NW: Who = { i: 7, o: NEWTON, okey: "newton" };
const TW: Who = { i: 8, o: TWAIN_O, okey: "twain" };
const FI: Who = { i: 9, o: FISHER_O, okey: "fisher" };
const MW: Who = { i: 10, o: MERI_O, okey: "meri" };
const RR: Who = { i: 11, o: READ, okey: "read" };
const PT = [0, 1, 2, 3].map((v): Who => ({ i: 60 + v, o: PARTNER(v), okey: `partner${v}` }));
const BK = Array.from({ length: 14 }, (_, v): Who => ({ i: 70 + v, o: BANKER(v), okey: `banker${v}` }));
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

// ---------------- crowds ----------------
type Spot = { x: number; z: number; v: number; i: number };
const crowdAt = (cx: number, cz: number, n: number, w: number, d: number, seed = 0): Spot[] => {
  const out: Spot[] = [];
  for (let i = 0; i < n; i++) out.push({ x: cx - w / 2 + ((i + 0.5) * w) / n + (hh(i + seed, 1) - 0.5) * (w / n) * 0.6, z: cz + (hh(i + seed, 2) - 0.5) * d, v: (i * 3 + seed) % 16, i: 100 + i + seed });
  return out.sort((a, b) => b.z - a.z);
};
const crowd = (out: Stage, cam: CamInfo, f: number, spots: Spot[], mood: (s: Spot, f: number) => { expr: Expr; wave?: number; prop?: Prop }, outfit = townie, tag = "tw") => {
  const f2 = f - (f % 2);
  for (const s of spots) {
    const m = mood(s, f2);
    stand(out, cam, { i: s.i, o: outfit(s.v), okey: `${tag}${s.v}` }, [s.x, D0, s.z], { mode: "stand", expr: m.expr, wave: m.wave, prop: m.prop ?? null, blink: lidAt(f2 / FPS, s.i) }, f2 / FPS);
  }
};
const waving = (s: Spot, f: number, amp = 1) => q(amp * Math.sin(f * 0.32 + s.i * 1.7), 4);
/** banknotes falling (or, with up, flying away upward) over a spot from frame f0 */
const money = (out: Stage, f: number, f0: number, c: V3, spread: number, up = false, n = 22, paper = false) => {
  if (f < f0) return;
  for (let i = 0; i < n; i++) {
    const t0 = f0 + hh(i, 7) * 10, u = (f - t0) / (up ? 26 : 40);
    if (u < 0) continue;
    const y = up ? D0 + 1.3 + 6 * u * u + 2 * u : Math.max(D0 + 0.05, D0 + 5.5 - 4.2 * u);
    const at: V3 = [c[0] + (hh(i, 8) - 0.5) * spread + 0.4 * Math.sin(f * 0.12 + i) + (up ? (hh(i, 6) - 0.5) * 3 * u : 0), y, c[2] - 0.6 + (hh(i, 9) - 0.5) * 2];
    if (paper) fxCard(out, "paperfly", 220, 280, (p) => fxPaper(p, 0), at, 0.3, 0.38, Math.sin(f * 0.2 + i * 1.3));
    else fxCard(out, "billfly", 300, 150, fxBill, at, 0.36, 0.18, Math.sin(f * 0.2 + i * 1.3));
  }
};
const EXC = crowdAt(EXCH[0] + 2.0, 37.0, 9, 9.0, 2.0, 3);
const TCK = crowdAt(TICKER[0] - 1.6, 35.8, 7, 6.0, 1.4, 11);
const REP = crowdAt(FISH[0] - 0.3, FISH[2] + 1.5, 6, 6.4, 1.2, 21);
const WALK = crowdAt(TWAIN[0] + 3.4, TWAIN[2] + 2.6, 3, 3.6, 1.0, 31);
const rain = (out: Stage, cam: CamInfo, f: number, f0: number, c: V3, spread: number, n = 12) => {
  if (f < f0) return;
  for (let i = 0; i < n; i++) { const u = ((f - f0) / 28 + i / n) % 1, sp = q(((f * 0.1 + i) % 1), 12);
    if ((f - f0) / 28 + i / n < 1 && i / n > (f - f0) / 28) continue;
    fxCard(out, `coin${sp}`, 200, 200, (p) => fxCoin(p, sp), onCard(cam, [c[0], D0 + 4.6 - 4.4 * u, c[2] - 0.5], (hh(i, 5) - 0.5) * spread, 0), 0.22, 0.22); }
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], b = s.beat, c = (w: string, n = 0) => cue(b, w, n);
  LNAME = s.light;
  findSun(cam, SUN);
  if (b === "h1") {
    // Newton, pleased with himself, in front of the price board; at "lose" the board turns and everybody gasps
    const hit = c("lose");
    crowd(out, cam, f, TCK, (sp) => ({ expr: f < hit ? (sp.i % 2 ? "smile" : "grin") : sp.i % 3 ? "shock" : "pained" }), investor, "inv");
    stand(out, cam, NW, NEWT, { mode: "stand", expr: f < hit ? "smile" : f < hit + 30 ? "shock" : "sad", look: f >= hit + 30 ? 0 : 1 }, t);
    if (f >= hit && f < hit + 6) burst(out, [TICKER[0], D0 + 3.8, TICKER[2] - 0.6], (f - hit) / 6, 3.2, "#ffd0d0");
    money(out, f, hit, [TICKER[0], D0, TICKER[2] - 2.0], 5, true, 22, true);
  } else if (b === "n1") {
    // London: the exchange and its investors; then Newton: the apple, the calculus, the Mint
    crowd(out, cam, f, EXC, (sp, ff) => ({ expr: sp.i % 3 ? "smile" : "neutral", wave: sp.i % 4 === 0 ? waving(sp, ff, 0.5) : undefined }), investor, "inv");
    crowd(out, cam, f, TCK, (sp) => ({ expr: sp.i % 2 ? "smile" : "neutral" }), investor, "inv");
    stand(out, cam, NW, NEWT, { mode: "stand", expr: f < c("makes") ? "neutral" : "smile", look: 0 }, t);
    pop(out, f, c("gravity"), "apple", 200, 200, fxApple, onCard(cam, NEWT, -0.95, 1.95), 0.4);
    pop(out, f, c("calculus"), "integral", 300, 300, fxIntegral, onCard(cam, NEWT, 0.95, 1.95), 0.46);
    pop(out, f, c("mint"), "coinM", 200, 200, (p) => fxCoin(p, 0), onCard(cam, NEWT, 0, 2.35), 0.4);
    rain(out, cam, f, c("makes"), NEWT, 4.4);
  } else if (b === "n8") {
    // he buys back in: money bags in hand, then a share certificate; the crowd cheers him on
    const buy = c("buys");
    crowd(out, cam, f, TCK, (sp, ff) => ({ expr: sp.i % 3 ? "grin" : "laugh", wave: waving(sp, ff, 0.7) }), investor, "inv");
    stand(out, cam, NW, NEWT, { mode: "stand", expr: f < buy ? "nervous" : f < c("everything") ? "smile" : "grin", prop: f < buy ? "bags" : "paper", look: 1 }, t);
    if (f >= buy && f < buy + 6) burst(out, onCard(cam, NEWT, 0, 1.2), (f - buy) / 6, 1.6);
  } else if (b === "t1") {
    // Hartford: Twain on the quay, passers-by in top hats and bonnets; his books; the money pours in
    crowd(out, cam, f, WALK, (sp) => ({ expr: sp.i % 2 ? "smile" : "neutral" }), townsfolk, "tf");
    stand(out, cam, TW, TWAIN, { mode: "stand", expr: f < c("money") ? "smile" : "grin" }, t);
    pop(out, f, c("tom"), "bookR", 220, 280, (p) => fxBook(p, "#b5343c"), onCard(cam, TWAIN, -1.0, 2.05), 0.46);
    pop(out, f, c("huckleberry"), "bookB", 220, 280, (p) => fxBook(p, "#3f6fb5"), onCard(cam, TWAIN, 1.0, 2.05), 0.46);
    rain(out, cam, f, c("money"), TWAIN, 4.0);
  } else if (b === "t10") {
    // bankrupt: the same man at dusk, pockets turned out
    stand(out, cam, TW, TWAIN, { mode: "stand", expr: "sad", prop: "pockets", headTilt: -3 }, t);
    pop(out, f, c("bankruptcy") - 4, "bankrupt", 520, 200, (p) => fxStamp(p, "BANKRUPT"), onCard(cam, TWAIN, 0.2, 2.25), 1.25);
    leaves(out, f, [TWAIN[0], D0, TWAIN[2] - 1], 12, 7);
  } else if (b === "f2") {
    // the professor in front of the exchange, reporters around him
    crowd(out, cam, f, REP, (sp, ff) => ({ expr: sp.i % 2 ? "smile" : "neutral", prop: sp.i % 2 ? "paper" : "news", wave: f >= c("best") && sp.i % 3 === 0 ? waving(sp, ff, 0.6) : undefined }), REPORTER, "rp");
    stand(out, cam, FI, FISH, { mode: "stand", expr: f < c("best") ? "smile_closed" : "smile" }, t);
  } else if (b === "f8") {
    // the crash: the board falls, the brokers panic, the paper flies
    const hit = c("crashes");
    crowd(out, cam, f, TCK, (sp) => ({ expr: f < hit ? (sp.i % 2 ? "smile" : "neutral") : sp.i % 3 ? "shock" : "pained", prop: sp.i % 2 ? "paper" : null }), BANKER, "bk");
    if (f >= hit && f < hit + 6) burst(out, [TICKER[0], D0 + 3.8, TICKER[2] - 0.6], (f - hit) / 6, 3.4, "#ffd0d0");
    money(out, f, hit, [TICKER[0], D0, TICKER[2] - 2.0], 6, true, 30);
  } else if (b === "l2") {
    // the dream team in front of the glass block
    PT.forEach((w, k) => stand(out, cam, w, [MERI[0] - 1.65 + k * 1.1, D0, MERI[2] + 0.9 + (k % 2) * 0.2], { mode: "stand", expr: k % 2 ? "smile" : "smile_closed" }, t));
    stand(out, cam, MW, MERI, { mode: "stand", expr: f < c("fund") ? "smile_closed" : "grin" }, t);
  } else if (b === "l12") {
    // fourteen bankers under the columns; one after another they bring a money sack; $3.6 billion
    const go = c("fourteen");
    BK.forEach((w, k) => { const row = k % 2, col = Math.floor(k / 2);
      stand(out, cam, w, [FED[0] + (col - 3) * 0.86 + row * 0.43, D0, FED[2] + row * 1.0], { mode: "stand", expr: f < go ? "stern" : k % 3 ? "stern" : "nervous", prop: f >= go + k * 3 ? "bag" : null }, t); });
    pop(out, f, c("three"), "badge36", 560, 200, (p) => fxBadge(p, "$3.6 BILLION"), [FED[0] + 0.2, D0 + 3.2, FED[2] - 0.6], 2.4);
  } else if (b === "r1") {
    // Read: the pump nozzle, then the mop
    const jan = c("then");
    stand(out, cam, RR, READP, { mode: "stand", expr: "smile_closed", prop: f < jan ? "nozzle" : "mop" }, t);
    if (f >= jan && f < jan + 6) burst(out, onCard(cam, READP, 0.4, 1.0), (f - jan) / 6, 1.4);
  } else if (b === "r8" || b === "r9") {
    // golden: Read on his bench by the river
    stand(out, cam, RR, YOU_BENCH, { mode: "sit", expr: b === "r9" || f >= c("waiting") ? "smile" : "smile_closed" }, t, 1, false);
    leaves(out, f, [BENCH[0], D0, BENCH[2] - 1], 12, 6);
  }
  return out;
};
export { FPS, smooth };
