// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing. Characters are yaw-only billboards shaded by cardShade(); standing
// ones get a soft multiply contact blob. Effects (apple, coins, bags, papers, ball, moth, bursts) are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
// Crowds animate "on twos" (poses change every 2nd frame) so their canvases are redrawn half as often.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStrip, Outfit, FrontOpts, SideOpts, drawChar, Look, CharOpts } from "./toon";
import { FPS, D0, SHOTS, V3, clamp01, ease, smooth, MIRROR, DESK, SIGN, BALC, BOAT, BAK } from "./story";
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
const bl = (t: number, i: number) => q(lidAt(t, i), 4);
const SK = ["#f2cdb4", "#e0b08c", "#c48a62", "#8a5a3c", "#f6d8c4"];
const LOOKS: Record<string, Look> = {
  pres: { skin: SK[0], hair: "side", hairCol: "#cfcac2", grey: true, top: "suit", topCol: "#1f2a4a", topCol2: "#f4f1ea", tie: "#c0262e", legCol: "#1f2a4a", shoeCol: "#141418", build: 1.05 },
  presPj: { skin: SK[0], hair: "side", hairCol: "#cfcac2", grey: true, top: "pajama", topCol: "#4a6a9a", legCol: "#4a6a9a", shoeCol: "#d8d0bc" },
  maya: { skin: SK[2], hair: "curly", hairCol: "#2a1a14", glasses: true, top: "blazer", topCol: "#2a7a7a", topCol2: "#f4f1ea", legCol: "#2a2a34", shoeCol: "#141418" },
  baker: { skin: SK[1], hair: "short", hairCol: "#5a3a26", top: "apron", topCol: "#d8d2c4", topCol2: "#fbfaf6", legCol: "#4a4a52", shoeCol: "#2a2220", flour: true, build: 1.3 },
  surgeon: { skin: SK[3], hair: "short", hairCol: "#1a1414", top: "scrubs", topCol: "#3a9a8a", legCol: "#3a9a8a", shoeCol: "#e8e8e8", hat: "surgcap", hatCol: "#3a8aaa" },
  pilot: { skin: SK[4], hair: "short", hairCol: "#8a5a2a", top: "pilot", topCol: "#1a2236", topCol2: "#f4f1ea", tie: "#1a1a20", legCol: "#1a2236", shoeCol: "#141418", hat: "pilot", hatCol: "#1a2236" },
  fisher: { skin: SK[1], hair: "short", hairCol: "#6a4a32", beard: "#6a4a32", top: "raincoat", topCol: "#e8b82a", legCol: "#e8b82a", shoeCol: "#2a2a30", hat: "beanie", hatCol: "#3a4a6a", build: 1.15 },
  teacher: { skin: SK[0], hair: "bun", hairCol: "#a8a4a0", glasses: true, top: "cardigan", topCol: "#8a3a4a", topCol2: "#e8e2d2", legCol: "#3a3a44", shoeCol: "#4a2a22" },
  courier: { skin: SK[2], hair: "short", hairCol: "#1a1414", top: "jacket", topCol: "#c0262e", legCol: "#2a2a34", shoeCol: "#e8e8e8", hat: "cap", hatCol: "#c0262e" },
  farmer: { skin: SK[1], hair: "short", hairCol: "#8a6a3a", top: "overalls", topCol: "#c94a3a", topCol2: "#3a5a8a", legCol: "#3a5a8a", shoeCol: "#4a3022", hat: "straw" },
  student: { skin: SK[3], hair: "long", hairCol: "#1a1414", top: "tee", topCol: "#6a4a9a", topCol2: "#6a4a9a", legCol: "#3a4a6a", shoeCol: "#e8e8e8" },
  grandma: { skin: SK[4], hair: "bun", hairCol: "#e8e4dc", top: "cardigan", topCol: "#5a7a5a", topCol2: "#efe6d2", legCol: "#5a4a3a", shoeCol: "#2a2220", glasses: true, build: 1.1 },
  nurse: { skin: SK[2], hair: "bob", hairCol: "#3a2218", top: "scrubs", topCol: "#c86a8a", legCol: "#c86a8a", shoeCol: "#e8e8e8" },
};
/** reporters: ordinary eyes are not a thing here: everyone is drawn with the same eyes, so the press stays blurred and small */
const REP: Look[] = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ skin: SK[i % 5], hair: (["short", "bob", "side", "curly", "long"] as const)[i % 5], hairCol: ["#2a1a14", "#6a4a32", "#a8a4a0", "#1a1414", "#8a5a2a"][i % 5],
  top: (["blazer", "suit", "jacket", "cardigan"] as const)[i % 4], topCol: ["#3a3a44", "#5a2a2a", "#2a4a6a", "#4a5a3a"][i % 4], topCol2: "#f0ece2", legCol: "#2a2a30", shoeCol: "#141418" }));
const who = (out: Stage, cam: CamInfo, look: string | Look, p: V3, o: CharOpts, scale = 1, mirror = false) => {
  const L = typeof look === "string" ? LOOKS[look] : look, d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.4 * scale, p[2])) / scale;
  const [w, h, k] = tier(d);
  out.places.push({ key: `CH|${JSON.stringify(L).length}|${typeof look === "string" ? look : L.topCol + L.hair}|${fkey(o)}`, x: p[0], y: p[1], z: p[2], scale, mirror, draw: (pp) => drawChar(pp, L, o), size: [w, h, k] });
};
const soft = (col: string, a: number) => (p: Pen) => { const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 62); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); };
const motes = (out: Stage, f: number, c: V3, n: number, R: number, col = "255,235,190") => { for (let k = 0; k < n; k++) { const u = (f * 0.004 + hsh(k, 1)) % 1; fxCard(out, "mote" + col, 128, 128, soft(col, 0.9), [c[0] + (hsh(k, 2) - 0.5) * R, c[1] + (u - 0.5) * R * 0.6, c[2] + (hsh(k, 3) - 0.5) * R], 0.025, 0.025, 0, true); } };
const fxEye = (open: number) => (p: Pen) => { const g = p.g; g.fillStyle = "#f2cdb4"; g.fillRect(0, 0, 400, 200); const ry = 70 * open; g.fillStyle = "#fbf7f2"; g.beginPath(); g.ellipse(200, 100, 150, Math.max(2, ry), 0, 0, 7); g.fill(); if (open > 0.15) { g.save(); g.beginPath(); g.ellipse(200, 100, 150, ry, 0, 0, 7); g.clip(); g.fillStyle = "#c8e03a"; g.beginPath(); g.arc(200, 100, 64, 0, 7); g.fill(); g.fillStyle = "#1d1620"; g.beginPath(); g.arc(200, 100, 26, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(220, 80, 12, 0, 7); g.fill(); g.restore(); } g.strokeStyle = "#1d1620"; g.lineWidth = 10; g.beginPath(); g.ellipse(200, 100, 150, Math.max(2, ry), 0, Math.PI, 2 * Math.PI); g.stroke(); };
const fxSchedule = (p: Pen) => { const g = p.g; g.fillStyle = "rgba(30,180,220,0.25)"; g.fillRect(0, 0, 420, 270); g.strokeStyle = "rgba(120,240,255,0.9)"; g.lineWidth = 4; g.strokeRect(4, 4, 412, 262); g.font = "800 26px 'Inter Display', Inter, sans-serif"; const rows = ["07:30  Briefing", "08:15  Security", "09:00  Cabinet", "10:00  SIGN THE HOUSING ACT", "11:30  Press"]; rows.forEach((r, i) => { if (i === 3) { g.fillStyle = "rgba(230,40,50,0.85)"; g.fillRect(14, 30 + i * 46, 392, 38); } g.fillStyle = "#e8fbff"; g.fillText(r, 26, 58 + i * 46); }); };
const fxSheet = (p: Pen) => { p.poly([[10, 40], [380, 10], [390, 160], [20, 190]], "#f4f1ea", 6); p.stroke([[60, 60], [320, 40]], 3, "#c9c4b4"); };
const fxNote2 = (p: Pen) => { const g = p.g; p.poly([[10, 10], [390, 10], [390, 290], [10, 290]], "#f3ead2", 5); g.fillStyle = "#1d1a40"; g.font = "italic 600 30px 'Segoe Script', 'Brush Script MT', cursive"; ["Housing Act signed.", "Eleven of us.", "You're not alone."].forEach((l, i) => g.fillText(l, 30, 80 + i * 70)); };
const fxSpark = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,240,170,1)"); gr.addColorStop(1, "rgba(255,200,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); };
const ELEVEN = ["maya", "surgeon", "pilot", "fisher", "teacher", "courier", "farmer", "student", "grandma", "nurse"];
const GOLDRIM = "#ffb060", TEAL = "#5ae8ff", BLUE = "#7aa8ff";

const shotStage = (out: Stage, cam: CamInfo, id: number, f: number) => {
  const t = T(f);
  if (id === 1) {
    const op = clamp01((f - 40) / 22);
    fxCard(out, `eye${q(op, 10)}`, 400, 200, fxEye(q(op, 10)), [302.8, D0 + 0.9, 69.8], 0.6, 0.3);
    motes(out, f, [302.9, D0 + 0.9, 68.9], 30, 1.2);
  } else if (id === 2) {
    const up = f >= 118;
    who(out, cam, "presPj", [305.0, D0 + 0.62, 68.55], { pose: "sit", expr: up ? (f < 140 ? "shock" : "determined") : "sleepy", key: 1, rim: GOLDRIM, blink: bl(t, 2) });
    motes(out, f, [305, D0 + 2.0, 66], 40, 4);
  } else if (id === 3) {
    who(out, cam, "presPj", [301.05, D0, 63.25], { pose: "back", key: -1 });
    const L = LOOKS.presPj;
    fxCard(out, `mirror${bl(t, 3)}`, 400, 533, (p) => { p.g.save(); p.g.fillStyle = "#3a4a5a"; p.g.fillRect(0, 0, 400, 533); p.g.translate(-100, -170); drawChar(p, L, { pose: "idle", expr: "fear", key: -1, rim: BLUE, blink: bl(t, 3), eyeGlow: 0.4 }); p.g.restore(); }, [MIRROR.x + 0.14, D0 + MIRROR.y, MIRROR.z], 1.08, 1.43);
  } else if (id === 4) {
    who(out, cam, "presPj", [305, D0, 65.2], { pose: "idle", expr: "fear", lookY: -1, key: 1 });
    motes(out, f, [305, D0 + 1.5, 65], 40, 4);
  } else if (id === 5) {
    const z = 59.6 + 1.8 * smooth((f - 296) / 26);
    who(out, cam, "maya", [305.0, D0, z], { pose: "tablet", expr: f >= 300 ? "determined" : "neutral", key: 1, rim: "#ffe0a0", glow: "rgba(127,240,255,0.35)" });
    who(out, cam, "presPj", [306.2, D0, 66.6], { pose: "back", key: 1 });
  } else if (id === 6) {
    who(out, cam, "presPj", [306.55, D0, 64.1], { pose: "back", key: -1 });
    who(out, cam, "maya", [305.0, D0, 61.9], { pose: "tablet", expr: "neutral", key: 1, glow: "rgba(127,240,255,0.4)", blink: bl(t, 6) });
    fxCard(out, "schedule", 420, 270, fxSchedule, [305.0, D0 + 1.62, 62.15], 0.62, 0.4, 0, true);
  } else if (id === 7) {
    const camX = 326 + 0.36 * (f - 395) + 3;
    who(out, cam, "pres", [camX - 2.6, D0, 64.0], { pose: "run", expr: "fear", phase: q(((f / 30) * 2.4) % 1, 12), key: 1, rim: GOLDRIM });
  } else if (id === 10) {
    who(out, cam, "pres", [357.5, D0, 67.3], { pose: "idle", expr: "shock", key: 1, rim: BLUE, eyeGlow: 0.3 });
  } else if (id === 11 || id === 12 || id === 13 || id === 18) {
    if (id === 11) { who(out, cam, "pres", [357.2, D0, 67.0], { pose: "idle", expr: "fear", key: -1, rim: BLUE }); who(out, cam, "maya", [354.0, D0, 61.4], { pose: "tablet", expr: "neutral", key: 1, glow: "rgba(127,240,255,0.3)" }); }
    else if (id === 12) { who(out, cam, "pres", [357.0, D0, 66.9], { pose: "idle", expr: f < 682 ? "whisper" : "fear", key: 1, rim: TEAL }); who(out, cam, "maya", [358.5, D0, 64.55], { pose: "tablet", expr: "shock", key: -1, rim: TEAL, glow: "rgba(127,240,255,0.3)" }); }
    else if (id === 13) who(out, cam, "maya", [358.4, D0, 64.6], { pose: "tablet", expr: "determined", key: 1, glow: "rgba(127,240,255,0.35)", eyeGlow: q(clamp01((f - 705) / 15), 6), blink: bl(t, 13) });
    else { who(out, cam, "pres", [356.9, D0, 66.95], { pose: "write", expr: "determined", key: 1, rim: "#ffd08a" }); who(out, cam, "maya", [358.3, D0, 66.95], { pose: "write", expr: "determined", key: -1, rim: "#ffd08a" }); motes(out, f, [357.6, D0 + 1.2, 66], 20, 1.0); }
  } else if (id === 15) {
    who(out, cam, "surgeon", [424.0, D0, 67.15], { pose: "idle", expr: "determined", lookY: -1, eyeGlow: 0.6, key: 1 });
  } else if (id === 16) {
    who(out, cam, "pilot", [442.0, D0, 61.25], { pose: "idle", expr: "smile", eyeGlow: 0.8, key: 1, rim: "#ffa050", lookX: 0.4 });
  } else if (id === 17) {
    who(out, cam, "fisher", [BOAT[0] + 0.7, BOAT[1] + 0.7 + 0.06 * Math.sin(f * 0.08), BOAT[2] - 0.2], { pose: "idle", expr: "determined", lookY: q(ease([[862, 0.8], [878, -0.3]], f), 6), eyeGlow: 0.8, key: -1, rim: "#ffb070" });
    for (let k = 0; k < 6; k++) { const u = ((f * 0.004 + hsh(k, 4)) % 1); fxCard(out, "mist", 128, 128, soft("235,225,240", 0.35), [292 + 16 * hsh(k, 5) + u * 4, 0.8, 4 + 10 * hsh(k, 6)], 6, 2.2, 0, true); }
  } else if (id === 19) {
    const u = clamp01((f - 926) / 26);
    for (let k = 0; k < 8; k++) { const kk = (k / 8) * u; fxCard(out, "spark", 64, 64, fxSpark, [357.45 - 0.17 + 0.34 * ((kk * 3) % 1), DESK.y + 0.02 + 0.03 * hsh(k, 1), 65.85 + 0.25 * kk], 0.03, 0.03, 0, true); }
  } else if (id === 20) {
    who(out, cam, "pres", [SIGN[0], D0, SIGN[2] - 0.05], { pose: "write", expr: "determined", key: 1, rim: "#ffe0a0" });
    REP.forEach((L, i) => { const row = Math.floor(i / 3), x = 383.5 + (i % 3) * 4.3 + (row % 2) * 1.4; who(out, cam, L, [x, D0, 59.0 + row * 1.25], { pose: f >= 990 && i % 2 ? "armsUp" : "idle", expr: f >= 990 ? "joy" : "smile", key: 1 }, 0.95); });
    for (const k of [960, 972, 985, 991, 1003, 1012]) if (f >= k && f < k + 3) { const i = k % 9; burst(out, [383.5 + (i % 3) * 4.3, D0 + 1.7, 59.3 + Math.floor(i / 3) * 1.25], 0.4, 0.9, "#ffffff"); }
    for (let k = 0; k < 24; k++) { const u = ((f * 0.003 + hsh(k, 7)) % 1); fxCard(out, "confetti", 64, 64, fxSpark, [SIGN[0] - 3 + 6 * hsh(k, 8), D0 + 3.6 - 3.2 * u, SIGN[2] - 3 + 3 * hsh(k, 9)], 0.05, 0.05, 0, true); }
  } else if (id === 21) {
    who(out, cam, "pres", [BALC[0] - 0.8, BALC[1], BALC[2]], { pose: "back", key: -1, rim: GOLDRIM });
  } else if (id === 22) {
    if (f < 1112) who(out, cam, "presPj", [305.0, D0 + 0.72, 68.9], { pose: "sit", expr: "sleepy", blink: q(clamp01((f - 1090) / 18), 6), key: -1, rim: BLUE });
  } else if (id === 23) {
    who(out, cam, "baker", [468.7, D0 + 0.42, 61.75], { pose: "sit", expr: f < 1170 ? "shock" : "smile", key: 1, rim: "#ff9a4a", blink: bl(t, 23) });
    motes(out, f, [466, D0 + 1.4, 64], 50, 5, "255,240,220");
  } else if (id === 24) {
    who(out, cam, "baker", [464.6, D0, 66.45], { pose: "bread", expr: f >= 1240 ? "joy" : "smile", key: -1, rim: "#ff9a4a", blink: bl(t, 24) });
    if (f >= 1222) for (let k = 0; k < 5; k++) { const u = ((f - 1222) / 50 + hsh(k, 3)) % 1; fxCard(out, "steam", 128, 128, soft("255,250,240", 0.5), [464.6 + 0.1 * Math.sin(k + f * 0.05), D0 + 1.15 + 0.5 * u, 65.6], 0.25 + 0.3 * u, 0.25 + 0.3 * u, 0, true); }
    if (f >= 1232) { const s = Math.min(1, (f - 1232) / 10); fxCard(out, "note2b", 400, 300, fxNote2, toward(cam, [464.6, D0 + 1.12 + 0.28 * s, 65.6], 0.25), 0.46 * s, 0.35 * s); }
    motes(out, f, [464.6, D0 + 1.4, 65], 30, 3, "255,240,220");
  } else if (id === 25 || id === 26) {
    ELEVEN.forEach((k, i) => who(out, cam, k, [461.3 + i * 0.82, D0, 56.9 - 0.25 * (i % 2)], { pose: f >= 1300 + i * 3 && (i % 3 !== 1) ? "wave" : "idle", expr: "joy", phase: q(((f / 30) * 1.2 + i * 0.2) % 1, 12), key: 1, rim: GOLDRIM, eyeGlow: 0.5 }));
    if (id === 26) who(out, cam, "baker", [465.4, D0, 62.3], { pose: "wave", expr: "joy", phase: q(((f / 30) * 1.2) % 1, 12), key: 1 });
  }
};
const burst = (out: Stage, at: V3, u: number, size: number, col = "#fff3b0") => { const uu = q(u, 30); fxCard(out, `burst${col}${uu}`, 500, 500, (p) => fxBurst(p, uu, col), at, size, size); };
const toward = (cam: CamInfo, at: V3, d: number): V3 => {
  const dx = cam.pos.x - at[0], dy = cam.pos.y - at[1], dz = cam.pos.z - at[2], L = Math.hypot(dx, dy, dz) || 1;
  return [at[0] + (dx / L) * d, at[1] + (dy / L) * d, at[2] + (dz / L) * d];
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
