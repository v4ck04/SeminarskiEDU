// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, Outfit, FrontOpts, SideOpts, drawMara, MaraOpts } from "./toon";
import { FPS, D0, SHOTS, V3, clamp01, ease, smooth, FLOOR, DOOR, PHONE_OFF, STREET_OFF } from "./story";
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
  d < 1.3 ? [2400, 4000, 4] : d < 3.2 ? [1350, 2250, 2.25] : d < 6.5 ? [810, 1350, 1.35] : d < 16 ? [360, 600, 0.6] : [180, 300, 0.3];

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
const T = (f: number) => f / FPS;
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft });
const hsh = (k: number, s: number) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const F = FLOOR;
/** Mara: the detailed 2D character card (feet on p); casts a real shadow from the shot's key */
const mara = (out: Stage, cam: CamInfo, p: V3, o: MaraOpts, mirror = false) => {
  const d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.4, p[2]));
  const [w, h, k] = tier(d);
  out.places.push({ key: `MARA|${fkey(o)}`, x: p[0], y: p[1], z: p[2], mirror, draw: (pp) => drawMara(pp, o), size: [w, h, k] });
};
const softBlob = (col: string, a: number) => (p: Pen) => { const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 62); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); };
const streaks = (p: Pen) => { const g = p.g; for (let i = 0; i < 26; i++) { const x = (i * 37) % 256, y = (i * 91) % 300; g.strokeStyle = "rgba(210,225,255,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 120); g.stroke(); } };
const bl = (t: number, i: number) => q(lidAt(t, i), 4);
const RIM = "#ff9a4a";

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f), lit = f < STREET_OFF;
  if (id === 1) {
    mara(out, cam, [304.1, F, 53.5], { pose: "idle", expr: "neutral", lookY: 1, glow: f >= 59 ? 0.8 : 0, key: 1 });
    for (let k = 0; k < 10; k++) {
      const u = ((f * 0.06 + hsh(k, 1)) % 1), at: V3 = [300 + 8 * hsh(k, 2), D0 + 0.2 + 2.5 * u, 44 + 2 * hsh(k, 3)];
      fxCard(out, "steam", 128, 128, softBlob("190,195,210", 0.35), at, 1.2 + 1.5 * u, 1.2 + 1.5 * u, 0, true);
    }
    for (let k = 0; k < 14; k++) {
      const c = camAtPos(cam), dz = 2 + 6 * hsh(k, 4), dx = -3 + 6 * hsh(k, 5), y = (((f * 0.35 + hsh(k, 6) * 10) % 6) - 3);
      fxCard(out, "streaks", 256, 300, streaks, [c[0] + dx, c[1] - y, c[2] + dz], 1.6, 1.9, 0, true);
    }
  } else if (id === 2) {
    if (f < 126) mara(out, cam, [304.45, F, 54.05], { pose: "back", key: -1, rim: RIM });
  } else if (id === 3) {
    const sx = ease([[150, -0.7], [165, -0.8], [185, 0.6], [200, 0.9]], f);
    mara(out, cam, [304.0, F, 53.95], { pose: "phoneEar", expr: "listen", lookX: q(sx, 8), lookY: q(ease([[165, 0], [185, -0.4]], f), 6), blink: bl(t, 3) > 0.5 && f < 160 ? 1 : 0, glow: 1, screen: true, key: -1, rim: RIM });
  } else if (id === 4) {
    const up = ease([[214, 0], [232, -1]], f);
    mara(out, cam, [304.0, F, 53.95], { pose: "phoneEar", expr: f >= 236 ? "fear" : "listen", lookX: 0.5, lookY: q(up, 6), glow: 1, screen: true, key: -1, rim: RIM });
  } else if (id === 5) {
    mara(out, cam, [304.0, F, 53.95], { pose: "phoneLook", expr: f >= 287 ? "listen" : "neutral", lookY: 1, glow: 1, screen: true, key: -1, blink: bl(t, 5), rim: RIM });
  } else if (id === 6) {
    mara(out, cam, [304.2, F, 54.25], { pose: "idle", expr: "fear", lookY: 1, glow: 0.6, key: -1 });
  } else if (id === 7) {
    mara(out, cam, [304.0, F, 54.0], { pose: "chest", expr: f >= 405 ? "fear" : "listen", lookX: f >= 440 ? -1 : -0.3, glow: 1, screen: true, key: 1, rim: RIM, blink: bl(t, 7) });
  } else if (id === 8) {
    mara(out, cam, [302.75, F, 56.5], { pose: "backPhone", key: -1, rim: "#5dff8f" });
  } else if (id === 9) {
    const lf = f >= 563 && f < 590;
    mara(out, cam, [304.2, F, 54.0], { pose: lf ? "laugh" : "idle", expr: lf ? "laugh" : "neutral", lookY: lf ? 0 : 0.6, key: -1, rim: RIM, blink: bl(t, 9) });
  } else if (id === 11) {
    mara(out, cam, [304.0, F, 53.8], { pose: "idle", expr: "fear", lookX: -1, key: 1, rim: RIM });
  } else if (id === 12) {
    const jolt = [720, 735, 750].some((k) => f >= k && f < k + 3) ? 0.03 : 0;
    mara(out, cam, [302.75, F + jolt, 56.1], { pose: "back", key: 1, rim: "#5dff8f" });
  } else if (id === 13) {
    const z = 55.6 + 3.0 * smooth((f - 800) / 62), bob = f < 862 ? 0.02 * Math.abs(Math.sin(f * 0.25)) : 0;
    mara(out, cam, [302.62, F + bob, z], { pose: "back", key: 1, rim: "#5dff8f" });
  } else if (id === 14) {
    mara(out, cam, [302.62, F, 58.5], { pose: "idle", expr: "fear", lookX: q(0.6 * Math.sin((f - 872) * 0.35), 6), lookY: -0.2, key: 1 });
  } else if (id === 16) {
    const back = f >= 958 ? 0.22 * smooth((f - 958) / 8) : 0;
    void back;
    if (f >= 936) for (const dx of [-0.09, 0.09]) out.fx.push({ key: "footShadow", cw: 128, ch: 128, draw: softBlob("0,0,0", 0.95), x: (DOOR.x0 + DOOR.x1) / 2 + dx * 1.3, y: F + 0.008, z: DOOR.z - 0.16, w: 0.18, h: 0.4, flat: true, soft: true });
    if (f >= 936) for (const dx of [-0.09, 0.09]) out.fx.push({ key: "footShadow2", cw: 128, ch: 128, draw: softBlob("0,0,0", 0.9), x: (DOOR.x0 + DOOR.x1) / 2 + dx * 1.3, y: F + 0.01, z: DOOR.z - 0.12, w: 0.12, h: 0.26, flat: true, soft: true });
  } else if (id === 17) {
    const sit = f >= 1012;
    mara(out, cam, [302.5, F, 56.6], sit ? { pose: "sit", expr: "fear", lookX: 0.2, key: 1 } : { pose: "chest", expr: "fear", lookX: 0.4, key: 1, phone: false });
  } else if (id === 19) {
    mara(out, cam, [304.2, F, 54.0], { pose: "twoHands", expr: "cry", tear: q(clamp01((f - 1190) / 30), 6), lookX: -0.2, glow: 1, screen: true, key: -1, rim: lit ? RIM : undefined, blink: bl(t, 19) });
  } else if (id === 20) {
    const side = ease([[1283, 0], [1290, 1]], f);
    mara(out, cam, [304.2, F, 54.0], { pose: "twoHands", expr: f >= 1242 ? "shock" : "cry", tear: 1, lookX: q(side, 6), glow: 1, screen: true, key: -1, rim: lit ? RIM : undefined });
  } else if (id === 21) {
    mara(out, cam, [304.1, F, 53.6], { pose: "phoneEar", expr: "shock", lookX: 1, tilt: f >= 1335 ? q(6 * smooth((f - 1335) / 12), 4) : 0, glow: 1, screen: true, key: -1 });
  } else if (id === 22 || id === 23) {
    const live = f < PHONE_OFF;
    if (id === 22) mara(out, cam, [304.1, F, 53.2], { pose: "back", key: -1, glow: 0 });
    // the reflection: the same drawing, mirrored, behind the glass; it smiles; the phone dies, only its eyes stay
    const smile = f >= 1395;
    mara(out, cam, [304.1, F, 51.3], { pose: "phoneEar", expr: smile ? "evil" : "neutral", lookX: 0, lookY: 0, glow: live ? 1 : 0, screen: live, key: 1 }, true);
    if (!live && f < 1461) for (const dx of [-0.07, 0.07]) fxCard(out, "glint", 128, 128, softBlob("220,235,255", 0.9), [304.1 + dx, F + 1.61, 51.32], 0.04, 0.04, 0, true);
  }
};
const camAtPos = (cam: CamInfo): V3 => [cam.pos.x, cam.pos.y, cam.pos.z];

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  shotStage(out, cam, id, f);
  return out;
};
