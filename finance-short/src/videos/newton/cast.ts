// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, NEWTON, AISLABIE, GUARD, KID, investor, fxBurst, fxStars, fxShadow, fxContact,
  fxApple, fxCoin, fxBag, fxPaper, fxBall, fxMoth, fxBonk, fxPop, Outfit, Expr, FrontOpts, SideOpts, Prop,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, clamp01, smooth, GARDEN_NEWTON, MINT_NEWTON, PRESS, BENCH, STREET_Z, PARK_KIDS, N10, N13, N19, N20, TREE,
  bubble, POP, PAPERS, paperAt,
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
const NW: Who = { i: 7, o: NEWTON, okey: "newton" };
const front = { side: false, mirror: false };
/** a standing / sitting front-view character plus its ground blob */
const stand = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, t: number, scale = 1, shadow = true) => {
  out.places.push(person(cam, who, p[0], p[1], p[2], front, { blink: fo.blink ?? lidAt(t, who.i), ...fo }, {}, scale));
  if (shadow) blob(out, p[0], D0, p[2], scale * (fo.mode === "sit" ? 1.15 : 1));
};
/** world point at screen offset (dx right, dy up) from a card standing at p, facing the camera */
const onCard = (cam: CamInfo, p: V3, dx: number, dy: number): V3 => [p[0] + cam.right.x * dx, p[1] + dy, p[2] + cam.right.z * dx];
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, rot, soft });
const apple = (out: Stage, at: V3, s = 0.16, rot = 0) => fxCard(out, "apple", 200, 200, fxApple, at, s, s, rot);
const coin = (out: Stage, at: V3, spin: number, s = 0.13) => { const sp = q(((spin % 1) + 1) % 1, 12); fxCard(out, `coin${sp}`, 200, 200, (p) => fxCoin(p, sp), at, s, s); };
const ball = (out: Stage, at: V3, spin: number, s = 0.32) => { const sp = q(((spin % 1) + 1) % 1, 8); fxCard(out, `ball${sp}`, 200, 200, (p) => fxBall(p, sp), at, s, s); };
const paper = (out: Stage, at: V3, rot: number, curl: number, s = 0.32) => { const c = q(curl, 4); fxCard(out, `paper${c}`, 220, 280, (p) => fxPaper(p, c), at, s, s * 280 / 220, rot); };
const burst = (out: Stage, at: V3, u: number, size: number, col = "#fff3b0") => { const uu = q(u, 30); fxCard(out, `burst${col}${uu}`, 500, 500, (p) => fxBurst(p, uu, col), at, size, size); };
/** ballistic point: from a at t0 to b at t1 with apex height h above the higher end */
const arc = (a: V3, b: V3, u: number, h: number): V3 => {
  const k = clamp01(u), top = Math.max(a[1], b[1]) + h;
  // parabola through a, apex, b (apex at the param where it peaks)
  const y = a[1] + (b[1] - a[1]) * k + 4 * (top - (a[1] + b[1]) / 2) * k * (1 - k);
  return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
};

// ---------------- the street crowd (Exchange Alley) ----------------
type Spot = { x: number; z: number; v: number; i: number };
const CROWD: Spot[] = (() => {
  const out: Spot[] = [];
  let i = 0;
  for (let row = 0; row < 6; row++) for (let col = 0; col < 5; col++) {
    const x = -4.4 + col * 2.2 + (hh(i, 1) - 0.5) * 0.9 + (row % 2) * 0.6, z = STREET_Z - 1.2 - row * 2.1 + (hh(i, 2) - 0.5) * 0.8;
    out.push({ x, z, v: (i * 3 + row) % 16, i: 100 + i });
    i++;
  }
  return out;
})();
const clear = (s: Spot, pts: V3[], r = 1.0) => pts.every((p) => Math.hypot(s.x - p[0], s.z - p[2]) > r);
/** the crowd: waving share papers on the cheer beats, looking up at the bubble, shocked when it pops */
const crowd = (out: Stage, cam: CamInfo, f: number, keep: V3[], mood: (s: Spot, f: number) => { expr: Expr; wave?: number; paper: boolean }) => {
  const f2 = f - (f % 2); // on twos
  for (const s of CROWD) {
    if (!clear(s, keep)) continue;
    const m = mood(s, f2), o = investor(s.v);
    const fo: FrontOpts = { mode: "stand", expr: m.expr, wave: m.wave, prop: m.paper ? "paper" : null, blink: lidAt(f2 / FPS, s.i), look: 0 };
    stand(out, cam, { i: s.i, o, okey: `inv${s.v}` }, [s.x, D0, s.z], fo, f2 / FPS);
  }
};
const waving = (s: Spot, f: number, amp = 1) => q(amp * Math.sin(f * 0.32 + s.i * 1.7), 4);

// ---------------- shots ----------------
const T = (f: number) => f / FPS;

const garden = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f), G = GARDEN_NEWTON;
  if (id === 1) {
    const look = f > 86 ? 1 : 0;
    stand(out, cam, NW, G, { mode: "stand", expr: f < 96 ? "smile" : "smile_closed", look }, t);
    // the apple: drops from a low branch right of Newton and lands on "down" (103), small bounce, then rests
    const A0: V3 = [G[0] + 1.05, D0 + 3.9, G[2] - 0.45], land = 103, f0 = 84;
    if (f >= f0) {
      let y: number;
      if (f < land) { const u = (f - f0) / (land - f0); y = A0[1] - (A0[1] - D0 - 0.08) * u * u; }
      else { const u = (f - land) / 10; y = D0 + 0.08 + (u < 1 ? 0.35 * 4 * u * (1 - u) : 0); }
      apple(out, [A0[0] + (f > land ? Math.min(10, f - land) * 0.012 : 0), y, A0[2]], 0.17, f > land ? (f - land) * 0.15 : 0);
      if (f >= land && f < land + 6) burst(out, [A0[0], D0 + 0.12, A0[2]], (f - land) / 6, 0.5, "#ffffff");
    } else apple(out, A0, 0.17, 0);
  } else if (id === 2) {
    const burstF = 130, prop: Prop = f < burstF ? "bag" : null;
    stand(out, cam, NW, G, { mode: "stand", expr: f < burstF ? "smile" : "shock", prop }, t);
    if (f >= burstF) {
      const hand = onCard(cam, G, 0.26, 0.62);
      for (let i = 0; i < 16; i++) {
        const u = (f - burstF) / 26 * (0.8 + 0.4 * hh(i, 3)), a = (i / 16) * Math.PI * 2 + hh(i, 4);
        const dx = Math.cos(a) * (0.6 + 1.6 * hh(i, 5)), dy = 1.2 + 1.8 * hh(i, 6);
        const p: V3 = [hand[0] + cam.right.x * dx * u, hand[1] + dy * u - 2.6 * u * u, hand[2] + cam.right.z * dx * u + (hh(i, 7) - 0.5) * 0.8 * u];
        if (u < 1.3) coin(out, p, f * 0.11 + i * 0.3, 0.12);
      }
      if (f < burstF + 7) burst(out, hand, (f - burstF) / 7, 0.9);
    }
  } else { // 20: sunset, sitting under the tree; the apple lands on his head on "gravity"
    const P = N20, hitF = 1817, f0 = 1803;
    const dazed = f >= hitF;
    stand(out, cam, NW, P, { mode: "sit", expr: !dazed ? "smile_closed" : f < hitF + 40 ? "dazed" : "smile", look: 0 }, t);
    const head = onCard(cam, P, 0.0, 1.12), top: V3 = [P[0], D0 + 4.4, P[2] - 0.1];
    if (f < f0) apple(out, top, 0.16);
    else if (f < hitF) { const u = (f - f0) / (hitF - f0); apple(out, [head[0], top[1] - (top[1] - head[1]) * u * u, head[2]], 0.16); }
    else {
      const u = (f - hitF) / 18;
      if (u < 1) apple(out, arc(head, onCard(cam, P, 0.55, 0.05), u, 0.35), 0.16, u * 3);
      else apple(out, onCard(cam, P, 0.55 + Math.min(0.3, (f - hitF - 18) * 0.01), 0.05), 0.16, 3 + Math.min(0.3, (f - hitF - 18) * 0.01) * 6);
      if (f < hitF + 8) fxCard(out, `bonk${q((f - hitF) / 8, 30)}`, 400, 400, (p) => fxBonk(p, q((f - hitF) / 8, 30)), head, 0.75, 0.75);
      if (f < hitF + 50) { const s2 = q((t * 0.9) % 1, 30); fxCard(out, `stars${s2}`, 420, 210, (p) => fxStars(p, s2), onCard(cam, P, 0, 1.22), 0.6, 0.3); }
    }
  }
};

const mint = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f), Mn = MINT_NEWTON;
  if (id === 4) {
    const pop = 331, catchF = 350;
    stand(out, cam, NW, Mn, { mode: "stand", expr: f < 355 ? "smile" : "grin", prop: f >= catchF ? "coin" : null }, t);
    if (f >= pop && f < catchF) coin(out, arc([PRESS[0], D0 + 1.0, PRESS[2]], onCard(cam, Mn, 0.22, 1.18), (f - pop) / (catchF - pop), 0.9), f * 0.13, 0.12);
    if (f >= pop && f < pop + 6) burst(out, [PRESS[0], D0 + 1.0, PRESS[2] - 0.3], (f - pop) / 6, 0.6);
  } else { // 17: sheepish wave by the press
    const w = f > 1560 ? q(0.5 * Math.sin((f - 1560) * 0.35), 4) : undefined;
    stand(out, cam, NW, Mn, { mode: "stand", expr: f < 1560 ? "neutral" : "nervous", wave: w, look: 0 }, t);
    for (const [k, f0] of [[0, 1584], [1, 1592]] as const) if (f >= f0 && f < f0 + 22) {
      const u = (f - f0) / 22;
      coin(out, arc([PRESS[0], D0 + 1.0, PRESS[2]], [PRESS[0] + 1.1 + k * 0.4, D0 + 0.95, PRESS[2] + 0.1], u, 0.7), f * 0.13 + k, 0.11);
    }
  }
};

const street = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  const papersFalling = (n = PAPERS) => { for (let i = 0; i < n; i++) { const pp = paperAt(i, f); if (pp) paper(out, pp.p, pp.rot, pp.curl, 0.34); } };
  if (id === 5 || id === 6) {
    const cheer = id === 6 && f > 505;
    crowd(out, cam, f, [], (s, ff) => ({ expr: cheer ? (s.i % 3 ? "laugh" : "grin") : s.i % 4 === 0 ? "smile" : "grin",
      wave: s.i % 3 !== 1 || cheer ? waving(s, ff, cheer ? 1 : 0.7) : undefined, paper: s.v % 4 !== 1 }));
  } else if (id === 7) {
    // Newton strolls out of the crowd toward the lens with two bags, very pleased with himself
    const a: V3 = [0.4, D0, STREET_Z - 1.6], b: V3 = [1.0, D0, -50.2], u = clamp01((f - 548) / 90);
    const p: V3 = [a[0] + (b[0] - a[0]) * u, D0, a[2] + (b[2] - a[2]) * u];
    const ph = q((((f - 548) / FPS) * 0.9) % 1, 24);
    crowd(out, cam, f, [p, [0.6, D0, STREET_Z - 1.2]], (s, ff) => ({ expr: s.i % 3 ? "grin" : "smile", wave: s.i % 2 ? waving(s, ff, 0.6) : undefined, paper: true }));
    out.places.push(person(cam, NW, p[0], D0, p[2], front, { mode: u > 0 && u < 1 ? "stroll" : "stand", phase: ph, expr: f < 575 ? "smile" : "smile_closed", prop: "bags", blink: lidAt(t, 7), lift: 40 }, {}));
    blob(out, p[0], D0, p[2]);
  } else if (id === 8 || id === 9) {
    const friends: V3[] = [[0.3, D0, -55.4], [1.5, D0, -56.1], [-0.7, D0, -56.7]];
    const N9: V3 = [-1.7, D0, -51.4];
    crowd(out, cam, f, [...friends, N9], (s, ff) => ({ expr: s.i % 3 ? "grin" : "laugh", wave: s.i % 2 ? waving(s, ff, 0.8) : undefined, paper: true }));
    friends.forEach((p, k) => {
      const o = investor([0, 2, 4][k]), rich = f > 700;
      stand(out, cam, { i: 60 + k, o, okey: `fr${k}` }, p, { mode: "stand", expr: rich ? (k === 1 ? "laugh" : "grin") : "smile", prop: rich || k === 0 ? "bags" : "bag" }, t);
    });
    if (id === 8 && f > 698) for (let i = 0; i < 18; i++) { // coins rain on the friends
      const u = ((f - 698) / 26 + hh(i, 2)) % 1, fr = friends[i % 3];
      coin(out, [fr[0] + (hh(i, 3) - 0.5) * 1.2, D0 + 3.4 - 3.0 * u, fr[2] + (hh(i, 4) - 0.5) * 0.6], f * 0.1 + i * 0.37, 0.11);
    }
    const expr: Expr = id === 8 ? (f < 690 ? "smile" : "nervous") : f < 817 - 2 ? "nervous" : "stern";
    stand(out, cam, NW, N9, { mode: "stand", expr, look: id === 8 || f < 790 ? 1 : 0 }, t);
  } else if (id === 10) {
    const throws = [846, 863, 881, 898];
    crowd(out, cam, f, [N10], (s, ff) => ({ expr: s.i % 3 ? "grin" : "laugh", wave: waving(s, ff, 0.9), paper: s.i % 2 === 0 }));
    const k = throws.findIndex((tf) => f >= tf - 6 && f < tf + 4);
    const wave = k >= 0 ? (f < throws[k] ? 1 : 0.4) : undefined;
    stand(out, cam, NW, N10, { mode: "stand", expr: f < 846 ? "grin" : "laugh", wave, prop: f < 898 ? "bag" : null }, t);
    for (const tf of throws) if (f >= tf && f < tf + 30) {
      const u = (f - tf) / 30, from = onCard(cam, N10, 0.3, 1.9), to: V3 = [-2.5 + (tf % 3), D0 + 2.6, -60 - (tf % 4)];
      fxCard(out, "bag", 300, 300, fxBag, arc(from, to, u, 1.6), 0.55, 0.55, u * 4);
    }
  } else if (id === 11) {
    crowd(out, cam, f, [], (s, ff) => ({ expr: "laugh", wave: waving(s, ff, 1), paper: true }));
  } else if (id === 12) {
    crowd(out, cam, f, [], (s, ff) => ({ expr: ff < 1001 ? "grin" : ff < POP - 2 ? "nervous" : "shock", wave: ff < 1001 ? waving(s, ff, 0.6) : undefined, paper: ff < POP }));
    const bb = bubble(POP - 1)!;
    if (f >= POP && f < POP + 12) { const u = q((f - POP) / 12, 30); fxCard(out, `pop${u}`, 600, 600, (p) => fxPop(p, u), bb.c, bb.r * 2.9, bb.r * 2.9, 0, true); }
    papersFalling();
  } else if (id === 13) {
    const P = N13, hit = 1121;
    crowd(out, cam, f, [P], (s) => ({ expr: s.i % 2 ? "dazed" : "shock", paper: false }));
    stand(out, cam, NW, P, { mode: "sit", expr: f < 1117 ? "relief" : f < hit ? "neutral" : "pained" }, t);
    papersFalling(30);
    // one sheet floats down onto his head on "Unluckily" and stays there
    const head = onCard(cam, P, 0.02, 1.16), from: V3 = [head[0] + 0.5, head[1] + 2.2, head[2]];
    if (f >= 1098) {
      const u = clamp01((f - 1098) / (hit - 1098)), sw = Math.sin(u * 7) * 0.25 * (1 - u);
      paper(out, [from[0] + (head[0] - from[0]) * u + sw, from[1] + (head[1] - from[1]) * u, head[2]], u < 1 ? 0.5 * Math.sin(u * 6) : 0.12, u < 1 ? Math.sin(u * 8) : 0.3, 0.36);
    }
  }
};

// park: the ball is passed upward, higher each push; in shot 15 the pushers are new buyers and Newton is the last
const PK = PARK_KIDS;
const KIDS: V3[] = [PK, [PK[0] + 2.4, D0, PK[2] - 0.3], [PK[0] + 4.6, D0, PK[2] + 0.1]];
const BUYERS: V3[] = [[PK[0] - 0.4, D0, PK[2]], [PK[0] + 1.5, D0, PK[2] - 0.4], [PK[0] + 3.3, D0, PK[2] + 0.1]];
export const NEWTON_PARK: V3 = [PK[0] + 5.9, D0, PK[2]];
/** ball hops: [frame, from, to, apex above the higher end] */
type Hop = [number, number, V3, V3, number];
const handOf = (p: V3, up = 2.05): V3 => [p[0], D0 + up, p[2] + 0.05];
const HOPS: Hop[] = [
  [1217, 1261, handOf(KIDS[0], 1.2), handOf(KIDS[0], 1.2), 3.0],
  [1266, 1290, handOf(KIDS[0], 1.6), handOf(KIDS[1], 1.6), 3.4],
  [1290, 1318, handOf(KIDS[1], 1.6), handOf(KIDS[2], 1.6), 4.6],
  [1318, 1334, handOf(KIDS[2], 1.6), handOf(BUYERS[0]), 2.6],
  [1334, 1348, handOf(BUYERS[0]), handOf(BUYERS[1]), 3.6],
  [1348, 1362, handOf(BUYERS[1]), handOf(BUYERS[2]), 4.8],
  [1362, 1413, handOf(BUYERS[2]), [NEWTON_PARK[0], D0 + 1.98, NEWTON_PARK[2]], 7.5],
];
const ballAt = (f: number): V3 => {
  for (const [a, b, p, r, h] of HOPS) if (f >= a && f < b) {
    // the last hop hangs near the top ("ran out") before gravity takes it
    const u = b === 1413 ? (f < 1399 ? 0.5 * Math.sin(((f - a) / (1399 - a)) * Math.PI / 2) : 0.5 + 0.5 * ((f - 1399) / (b - 1399)) ** 1.6) : (f - a) / (b - a);
    return arc(p, r, u, h);
  }
  if (f < 1217) return [PK[0] + 0.25, D0 + 1.05, PK[2] + 0.05];
  if (f < 1266) return handOf(KIDS[0], 1.2);
  const u = (f - 1413) / 20;
  return arc([NEWTON_PARK[0], D0 + 1.98, NEWTON_PARK[2]], [NEWTON_PARK[0] + 1.4, D0 + 0.16, NEWTON_PARK[2] + 0.4], Math.min(1, u), 0.5);
};
const pushing = (f: number, hitF: number) => (f >= hitF - 5 && f < hitF + 5 ? (f < hitF ? 0.2 : 1) : undefined);
const park = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 14) {
    KIDS.forEach((p, k) => {
      const hit = k === 0 ? [1217, 1266] : k === 1 ? [1290] : [1318];
      const w = hit.map((h) => pushing(f, h)).find((x) => x !== undefined);
      const holding = k === 0 && f < 1217;
      stand(out, cam, { i: 30 + k, o: { ...KID, jacket: ["#f08a2c", "#3f8f84", "#c25a7a"][k], cap: ["#e2453c", "#f2c94c", "#3f6fb5"][k] }, okey: `kid${k}` },
        p, { mode: "stand", expr: f > 1230 ? "laugh" : "grin", wave: w ?? (holding ? 0.2 : undefined), look: 0 }, t, 0.72);
    });
  } else {
    BUYERS.forEach((p, k) => {
      const hitF = [1334, 1348, 1362][k], w = pushing(f, hitF);
      stand(out, cam, { i: 40 + k, o: investor([0, 5, 2][k]), okey: `buy${k}` }, p, { mode: "stand", expr: f > hitF ? "laugh" : "grin", wave: w, prop: w === undefined ? "paper" : null }, t);
    });
    const hit = 1413, dazed = f >= hit;
    stand(out, cam, NW, NEWTON_PARK, { mode: "stand", expr: f < 1372 ? "smile" : f < hit ? "nervous" : "dazed", look: 0 }, t);
    const head = onCard(cam, NEWTON_PARK, 0, 2.0);
    if (dazed && f < hit + 8) fxCard(out, `bonk${q((f - hit) / 8, 30)}`, 400, 400, (p) => fxBonk(p, q((f - hit) / 8, 30)), head, 0.8, 0.8);
    if (dazed) { const s2 = q((t * 0.9) % 1, 30); fxCard(out, `stars${s2}`, 420, 210, (p) => fxStars(p, s2), onCard(cam, NEWTON_PARK, 0, 2.15), 0.65, 0.33); }
  }
  const b = ballAt(f);
  ball(out, b, f * 0.06, id === 14 ? 0.3 : 0.34);
};

const gate = (out: Stage, cam: CamInfo, f: number) => {
  const t = T(f), u = clamp01((f - 1452) / 78);
  const z = 33.4 + 5.6 * u, ph = q((((f - 1452) / FPS) * 1.0) % 1, 24);
  const walkers: [Who, number, number][] = [[{ i: 90, o: GUARD, okey: "g0" }, -1.25, 0.2], [{ i: 91, o: AISLABIE, okey: "ais" }, 0, 0], [{ i: 92, o: GUARD, okey: "g1" }, 1.25, 0.25]];
  for (const [who, dx, dz] of walkers) {
    const x = -48 + dx * (1 - 0.35 * u), zz = z + dz;
    if (zz > 39.4) continue; // gone through the gate
    const view = viewOf(cam, x, zz, 0, 1), aisl = who.okey === "ais";
    const so: SideOpts = { mode: "march", phase: ph, expr: aisl ? "nervous" : "stern", stomp: aisl ? 0.6 : 1, stride: view.fs * 0.8, blink: lidAt(t, who.i) };
    const fo: FrontOpts = { mode: "march", phase: ph, expr: aisl ? "nervous" : "stern", blink: lidAt(t, who.i), lift: 40 };
    out.places.push(person(cam, who, x, D0, zz, view, fo, so));
    blob(out, x, D0, zz);
  }
};

const quay = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 18) {
    const P: V3 = [BENCH[0] + 0.25, D0 + 0.34, BENCH[2] - 0.12];
    out.places.push(person(cam, NW, P[0], P[1], P[2], front, { mode: "sit", expr: f < 1650 ? "sad" : "neutral", blink: lidAt(t, 7) }, {}));
    // two empty, deflated bags on the bench beside him
    fxCard(out, "bagFlat", 300, 300, fxBag, [BENCH[0] - 0.55, D0 + 0.62, BENCH[2] - 0.05], 0.42, 0.3, 0.2);
    fxCard(out, "bagFlat", 300, 300, fxBag, [BENCH[0] - 0.85, D0 + 0.6, BENCH[2] - 0.02], 0.38, 0.26, -0.3);
  } else {
    const P = N19, out1 = 1724;
    stand(out, cam, NW, P, { mode: "stand", expr: f < out1 ? "neutral" : f < 1745 ? "sad" : "neutral", prop: f >= out1 ? "pockets" : null }, t);
    if (f >= 1741) { // a moth flutters out of the right pocket
      const u = (f - 1741) / 28, st = onCard(cam, P, 0.3, 0.72);
      const p: V3 = [st[0] + cam.right.x * 0.5 * u + Math.sin(u * 9) * 0.06, st[1] + 0.9 * u + 0.05 * Math.sin(u * 13), st[2] + cam.right.z * 0.5 * u];
      const fl = q((f % 4) / 4, 4);
      fxCard(out, `moth${fl}`, 240, 160, (pp) => fxMoth(pp, fl), p, 0.14, 0.093);
    }
  }
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, t: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  if (s.place === "garden") garden(out, cam, id, f);
  else if (s.place === "mint") mint(out, cam, id, f);
  else if (s.place === "street") street(out, cam, id, f);
  else if (s.place === "park") park(out, cam, id, f);
  else if (s.place === "gate") gate(out, cam, f);
  else if (s.place === "quay") quay(out, cam, id, f);
  return out;
};
export { FPS, TREE, smooth };
