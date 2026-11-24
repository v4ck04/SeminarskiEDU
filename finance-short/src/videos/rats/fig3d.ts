// Real 3D characters (first used in "The City That Paid for Rat Tails"). They replace the flat character cards:
// rounded bodies built from capsules and spheres, lit by the same two-tone world shader (shade.ts), so they cast and
// receive real shadows, take the ambient occlusion and get ink outlines from the InkPass like every prop.
// Faces are a painted canvas patch wrapped on the front of the head (NOINK, so the ink pass leaves it alone);
// nose, ears, hats, hands and shoes are geometry. Person: ~1.85 m tall, character faces +z at yaw 0.
// Rat: a ~0.45 m cartoon rat, optional tail, top hat, glowing eyes, upright pose with little front paws.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { twoTone } from "./shade";
import { NOINK } from "./ink";

// ---------------- materials + shared geometry ----------------
const MATS = new Map<string, THREE.Material>();
/** matte two-tone material per colour (shiny = Phong with a soft highlight) */
export const fmat = (col: string, shiny = 0) => {
  const k = col + "|" + shiny;
  let m = MATS.get(k);
  if (!m) {
    m = shiny ? twoTone(new THREE.MeshPhongMaterial({ color: col, specular: new THREE.Color(shiny, shiny, shiny), shininess: 40 }))
      : twoTone(new THREE.MeshLambertMaterial({ color: col }));
    MATS.set(k, m);
  }
  return m;
};
const glowMat = (col: string, k = 4) => {
  const key = "glow" + col + k;
  let m = MATS.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: true }); MATS.set(key, m); }
  return m;
};
const GEO = new Map<string, THREE.BufferGeometry>();
const geo = (k: string, make: () => THREE.BufferGeometry) => { let g = GEO.get(k); if (!g) { g = make(); GEO.set(k, g); } return g; };
const SPH = () => geo("sph", () => new THREE.SphereGeometry(1, 28, 20));
const caps = (r: number, len: number) => geo(`cap${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 16));

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, pos: [number, number, number] = [0, 0, 0], scl: [number, number, number] = [1, 1, 1]) => {
  const x = new THREE.Mesh(g, m);
  x.position.set(...pos); x.scale.set(...scl); x.castShadow = true; x.receiveShadow = true;
  parent.add(x);
  return x;
};
const ball = (r: number, m: THREE.Material, parent: THREE.Object3D, pos: [number, number, number], s: [number, number, number] = [1, 1, 1]) =>
  mesh(SPH(), m, parent, pos, [r * s[0], r * s[1], r * s[2]]);

// ---------------- faces ----------------
export type Expr = "neutral" | "smile" | "grin" | "shock" | "sad" | "proud" | "disgust" | "stern" | "worried";
const INK = "#1d1620";
const faceTex = (expr: Expr, blink: number, moustache: string | undefined, skin: string, cheeks: boolean) => {
  const key = `face|${expr}|${blink}|${moustache ?? ""}|${skin}|${cheeks ? 1 : 0}`;
  let t = TEX.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = cv.height = 512;
  const g = cv.getContext("2d")!;
  g.lineCap = "round"; g.lineJoin = "round";
  const E = (x: number) => x * 2; // design on 256, drawn on 512
  // eyes
  for (const s of [-1, 1]) {
    const ex = E(128 + s * 34), ey = E(112);
    if (blink >= 0.75) { g.strokeStyle = INK; g.lineWidth = E(5); g.beginPath(); g.moveTo(ex - E(12), ey); g.quadraticCurveTo(ex, ey + E(6), ex + E(12), ey); g.stroke(); }
    else {
      const ry = E(expr === "shock" ? 22 : 17) * (1 - blink * 0.8), rx = E(expr === "shock" ? 15 : 12);
      g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(ex, ey, rx * 1.25, ry * 1.15, 0, 0, 7); g.fill();
      g.lineWidth = E(3); g.strokeStyle = INK; g.stroke();
      g.fillStyle = INK; g.beginPath(); g.ellipse(ex + s * E(1), ey + E(2), rx * 0.72, ry * 0.78, 0, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(ex + E(3), ey - E(4), E(3.4), 0, 7); g.fill();
    }
    // brows
    const by = ey - E(expr === "shock" ? 32 : 26);
    const tilt = expr === "sad" || expr === "worried" ? -7 : expr === "stern" || expr === "disgust" ? 7 : expr === "proud" ? -2 : 0;
    g.strokeStyle = INK; g.lineWidth = E(6);
    g.beginPath(); g.moveTo(ex - s * E(13), by - E(tilt) * 0.5 * -1); g.lineTo(ex + s * E(13), by - E(tilt) * 0.5); g.stroke();
  }
  if (cheeks) for (const s of [-1, 1]) { g.fillStyle = "rgba(240,110,110,0.28)"; g.beginPath(); g.ellipse(E(128 + s * 58), E(150), E(16), E(10), 0, 0, 7); g.fill(); }
  // mouth
  const mx = E(128), my = E(178);
  g.strokeStyle = INK; g.lineWidth = E(5);
  if (expr === "grin" || expr === "shock") {
    g.fillStyle = "#5a1f2a";
    g.beginPath();
    if (expr === "grin") { g.moveTo(mx - E(30), my - E(6)); g.quadraticCurveTo(mx, my + E(40), mx + E(30), my - E(6)); g.closePath(); }
    else g.ellipse(mx, my + E(4), E(13), E(18), 0, 0, 7);
    g.fill(); g.stroke();
    g.fillStyle = "#e86a7a"; g.beginPath(); g.ellipse(mx, my + E(expr === "grin" ? 14 : 14), E(10), E(6), 0, 0, 7); g.fill();
  } else {
    g.beginPath();
    if (expr === "smile" || expr === "proud") { g.moveTo(mx - E(22), my - E(4)); g.quadraticCurveTo(mx + (expr === "proud" ? E(6) : 0), my + E(16), mx + E(22), my - E(expr === "proud" ? 10 : 4)); }
    else if (expr === "sad" || expr === "worried") { g.moveTo(mx - E(18), my + E(8)); g.quadraticCurveTo(mx, my - E(8), mx + E(18), my + E(8)); }
    else if (expr === "disgust") { g.moveTo(mx - E(20), my + E(4)); g.lineTo(mx - E(8), my - E(3)); g.lineTo(mx + E(6), my + E(5)); g.lineTo(mx + E(20), my - E(2)); }
    else { g.moveTo(mx - E(16), my + E(2)); g.lineTo(mx + E(16), my + E(2)); }
    g.stroke();
  }
  if (moustache) {
    g.fillStyle = moustache; g.strokeStyle = INK; g.lineWidth = E(3);
    const droop = expr === "sad" || expr === "worried" ? E(14) : 0;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(mx, my - E(22));
      g.quadraticCurveTo(mx + s * E(20), my - E(30), mx + s * E(40), my - E(16) + droop);
      g.quadraticCurveTo(mx + s * E(22), my - E(14) + droop * 0.4, mx, my - E(12)); g.closePath(); g.fill(); g.stroke();
    }
  }
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  TEX.set(key, t);
  void skin;
  return t;
};
const TEX = new Map<string, THREE.Texture>();
/** front patch of a unit sphere (u left -> right on screen, v bottom -> top), slightly outside the head */
const FACE_GEO = () => geo("face", () => new THREE.SphereGeometry(1.012, 32, 24, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.95, 1.9));

// ---------------- people ----------------
export type Look = {
  skin: string; shirt: string; pants: string; shoes: string;
  hat?: "pith" | "nonla" | "cap" | "hair" | "bun" | "bald";
  hatCol?: string; hair?: string; moustache?: string; build?: number;
  jacket?: string;          // open jacket over the shirt (adds lapels + buttons)
  tie?: string; dress?: string; apron?: string; belt?: string;
  rolled?: boolean;         // rolled trousers, bare shins (workers)
};
export type Hold = "lamp" | "tail" | "stamp" | "scissors" | "pointer" | "bowl" | "coins" | null;
export type Pose = {
  expr: Expr; blink?: number;
  walk?: number;                         // walk phase 0..1 (undefined = standing)
  armA?: [number, number]; armB?: [number, number]; // [forward pitch, outward roll] radians; A = screen-left arm when facing camera
  head?: [number, number, number];       // yaw, pitch (+ = look down), roll
  lean?: number; bob?: number;
  holdA?: Hold; holdB?: Hold;
  peg?: boolean;                         // clothes peg on the nose
};

export class Person {
  root = new THREE.Group();
  private hips = new THREE.Group(); private torso = new THREE.Group(); private headG = new THREE.Group();
  private legA = new THREE.Group(); private legB = new THREE.Group();
  private armAG = new THREE.Group(); private armBG = new THREE.Group();
  private faceMat: THREE.MeshLambertMaterial;
  private handA = new THREE.Group(); private handB = new THREE.Group();
  private props = new Map<string, THREE.Object3D>();
  private peg: THREE.Object3D;
  look: Look;
  constructor(parent: THREE.Object3D, look: Look) {
    this.look = look;
    const b = look.build ?? 1, skin = fmat(look.skin), shirt = fmat(look.shirt), pants = fmat(look.pants), shoe = fmat(look.shoes, 0.25);
    const R = this.root;
    R.add(this.hips); this.hips.position.y = HIP;
    // legs
    for (const [g, s] of [[this.legA, -1], [this.legB, 1]] as const) {
      g.position.set(s * 0.1 * b, 0, 0); this.hips.add(g);
      if (!look.dress) {
        if (look.rolled) { mesh(caps(0.09, 0.16), pants, g, [0, -0.14, 0]); mesh(caps(0.065, 0.22), skin, g, [0, -0.4, 0]); }
        else mesh(caps(0.09, 0.42), pants, g, [0, -0.28, 0]);
      } else mesh(caps(0.065, 0.3), skin, g, [0, -0.38, 0]);
      mesh(geo("shoe", () => new RoundedBoxGeometry(0.16, 0.1, 0.28, 3, 0.045)), shoe, g, [0, -0.61, 0.05]);
    }
    // torso (bean)
    this.hips.add(this.torso);
    mesh(caps(0.26 * b, 0.2), shirt, this.torso, [0, 0.33, 0], [1, 1, 0.84]);
    if (look.dress) mesh(geo("skirt", () => new THREE.CylinderGeometry(0.24, 0.44, 0.5, 28, 1)), fmat(look.dress), this.hips, [0, -0.15, 0]);
    if (look.jacket) {
      const j = fmat(look.jacket);
      mesh(caps(0.266 * b, 0.18), j, this.torso, [0, 0.34, -0.012], [1, 1, 0.82]);
      // the shirt shows in a V at the front: a shirt-coloured wedge on top of the jacket
      const v = mesh(geo("vee", () => { const g = new THREE.ConeGeometry(0.09, 0.3, 3, 1); g.rotateZ(Math.PI); return g; }), shirt, this.torso, [0, 0.5, 0.2 * b], [1, 1, 0.3]);
      v.rotation.x = -0.12;
      for (let i = 0; i < 3; i++) ball(0.02, fmat("#d9c27a", 0.4), this.torso, [0.0, 0.16 + i * 0.09, 0.222 * b]);
    }
    if (look.tie) mesh(geo("tie", () => new THREE.ConeGeometry(0.03, 0.13, 4)), fmat(look.tie), this.torso, [0, 0.5, 0.225 * b], [1, 1, 0.4]).rotation.x = Math.PI;
    if (look.apron) mesh(geo("apron", () => new RoundedBoxGeometry(0.34, 0.5, 0.03, 2, 0.012)), fmat(look.apron), this.torso, [0, 0.2, 0.22 * b]);
    if (look.belt) mesh(geo("belt", () => new THREE.TorusGeometry(0.205, 0.028, 8, 32)), fmat(look.belt, 0.2), this.torso, [0, 0.1, 0], [1.22 * b, 1, 1.03 * b]).rotation.x = Math.PI / 2;
    // arms
    for (const [g, s, h] of [[this.armAG, -1, this.handA], [this.armBG, 1, this.handB]] as const) {
      g.position.set(s * (0.27 * b + 0.04), 0.5, 0); this.torso.add(g);
      mesh(caps(0.064, 0.28), look.jacket ? fmat(look.jacket) : shirt, g, [0, -0.18, 0]);
      h.position.set(0, -0.38, 0); g.add(h);
      ball(0.075, skin, h, [0, 0, 0]);
    }
    // head
    this.torso.add(this.headG); this.headG.position.set(0, 0.82, 0); this.headG.scale.setScalar(1.25);
    const head = ball(0.27, skin, this.headG, [0, 0.06, 0], [1, 1.02, 0.95]);
    this.faceMat = new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    twoTone(this.faceMat as THREE.MeshLambertMaterial);
    const face = new THREE.Mesh(FACE_GEO(), this.faceMat);
    face.scale.copy(head.scale).multiplyScalar(1); face.position.copy(head.position); face.layers.set(NOINK); face.renderOrder = 2;
    this.headG.add(face);
    ball(0.055, skin, this.headG, [0, 0.03, 0.26], [1, 0.85, 0.9]);            // nose
    for (const s of [-1, 1]) ball(0.06, skin, this.headG, [s * 0.265, 0.05, 0], [0.5, 1, 0.8]); // ears
    this.peg = new THREE.Group(); this.headG.add(this.peg);
    mesh(geo("pegA", () => new RoundedBoxGeometry(0.035, 0.1, 0.03, 2, 0.01)), fmat("#c99a5a"), this.peg, [-0.025, 0.06, 0.3]);
    mesh(geo("pegA", () => new RoundedBoxGeometry(0.035, 0.1, 0.03, 2, 0.01)), fmat("#c99a5a"), this.peg, [0.025, 0.06, 0.3]);
    ball(0.02, fmat("#9aa0aa", 0.4), this.peg, [0, 0.06, 0.32]);
    this.peg.visible = false;
    // hats / hair
    const hc = fmat(look.hatCol ?? look.hair ?? "#2a2220");
    if (look.hat === "pith") {
      ball(0.3, fmat(look.hatCol ?? "#f3efe2"), this.headG, [0, 0.16, -0.01], [1, 0.72, 1.06]).geometry = geo("dome", () => new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2));
      mesh(geo("brim", () => new THREE.CylinderGeometry(0.44, 0.46, 0.025, 36)), fmat(look.hatCol ?? "#f3efe2"), this.headG, [0, 0.17, 0.01], [1, 1, 1.08]);
      mesh(geo("band", () => new THREE.CylinderGeometry(0.302, 0.302, 0.045, 36, 1, true)), fmat("#6a5a3a"), this.headG, [0, 0.21, -0.01], [1, 1, 1.06]);
    } else if (look.hat === "nonla") {
      mesh(geo("nonla", () => new THREE.ConeGeometry(0.56, 0.34, 36, 1)), fmat(look.hatCol ?? "#e2cb86"), this.headG, [0, 0.36, 0]);
      if (look.hair) ball(0.275, fmat(look.hair), this.headG, [0, 0.1, -0.04], [1, 0.95, 0.95]);
    } else if (look.hat === "cap") {
      mesh(geo("capc", () => new THREE.CylinderGeometry(0.27, 0.28, 0.16, 30)), hc, this.headG, [0, 0.27, -0.01]);
      mesh(geo("visor", () => new RoundedBoxGeometry(0.34, 0.03, 0.16, 2, 0.012)), fmat("#1d1a1a", 0.3), this.headG, [0, 0.2, 0.27]);
    } else if (look.hat === "hair" || look.hat === "bun") {
      ball(0.285, hc, this.headG, [0, 0.12, -0.035], [1, 0.9, 0.96]).geometry = geo("hairCap", () => new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55));
      if (look.hat === "bun") ball(0.12, hc, this.headG, [0, 0.27, -0.2]);
    }
    // held props (all built once, shown on demand)
    const mk = (k: string, build: (g: THREE.Group) => void) => { const g = new THREE.Group(); build(g); g.visible = false; this.props.set(k, g); return g; };
    mk("lamp", (g) => {
      mesh(geo("lampTop", () => new THREE.CylinderGeometry(0.05, 0.07, 0.05, 16)), fmat("#3a3a40", 0.3), g, [0, -0.1, 0]);
      mesh(geo("lampGlass", () => new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16)), glowMat("#ffcf6a", 3.2), g, [0, -0.2, 0]).castShadow = false;
      mesh(geo("lampBase", () => new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16)), fmat("#3a3a40", 0.3), g, [0, -0.29, 0]);
      mesh(geo("lampRing", () => new THREE.TorusGeometry(0.05, 0.008, 6, 16)), fmat("#3a3a40", 0.3), g, [0, -0.03, 0]);
    });
    mk("tail", (g) => { mesh(geo("tailH", () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0, 0.04), V3(0.02, -0.12, 0.08), V3(-0.02, -0.26, 0.06), V3(0.03, -0.4, 0.1)]), 20, 0.014, 8)), fmat("#e9a3a6"), g); });
    mk("stamp", (g) => { mesh(caps(0.03, 0.1), fmat("#7a4f33"), g, [0, -0.06, 0.05]); mesh(geo("stampB", () => new RoundedBoxGeometry(0.14, 0.05, 0.1, 2, 0.015)), fmat("#c8323a"), g, [0, -0.16, 0.05]); });
    mk("scissors", (g) => {
      for (const s of [-1, 1]) {
        const blade = mesh(geo("blade", () => new RoundedBoxGeometry(0.03, 0.012, 0.22, 1, 0.005)), fmat("#c9ccd4", 0.7), g, [0, 0, 0.14]); blade.rotation.y = s * 0.25; blade.name = "blade" + s;
        mesh(geo("ring", () => new THREE.TorusGeometry(0.035, 0.012, 6, 14)), fmat("#d8343a"), g, [s * 0.04, 0, 0]).rotation.x = Math.PI / 2;
      }
    });
    mk("pointer", (g) => { mesh(geo("stick", () => new THREE.CylinderGeometry(0.008, 0.012, 0.7, 8)), fmat("#7a4f33"), g, [0, 0, 0.32]).rotation.x = Math.PI / 2; });
    mk("bowl", (g) => {
      mesh(geo("bowl", () => new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), fmat("#8a6a4a"), g, [0, -0.02, 0.08]);
      for (let i = 0; i < 6; i++) ball(0.022, fmat("#efe3b8"), g, [Math.cos(i) * 0.06, -0.01, 0.08 + Math.sin(i) * 0.06]);
    });
    mk("coins", (g) => { for (let i = 0; i < 3; i++) mesh(geo("coin", () => new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20)), fmat("#e8bf45", 0.6), g, [0, -0.05 + i * 0.014, 0.06]); });
    for (const [k, p] of this.props) (k === "x" ? this.handB : this.handA).add(p);
    // a second copy set for hand B (built lazily when first asked for)
    parent.add(R);
  }
  private propB = new Map<string, THREE.Object3D>();
  private hold(hand: "A" | "B", what: Hold) {
    if (hand === "A") { for (const [k, p] of this.props) p.visible = k === what; return; }
    for (const p of this.propB.values()) p.visible = false;
    if (!what) return;
    let p = this.propB.get(what);
    if (!p) { p = this.props.get(what)!.clone(true); this.handB.add(p); this.propB.set(what, p); }
    p.visible = true;
  }
  /** world position of a hand (after pose) */
  hand(which: "A" | "B", out = new THREE.Vector3()) { (which === "A" ? this.handA : this.handB).updateWorldMatrix(true, false); return (which === "A" ? this.handA : this.handB).getWorldPosition(out); }
  pose(x: number, y: number, z: number, yaw: number, p: Pose, scale = 1) {
    const R = this.root;
    R.visible = true; R.position.set(x, y, z); R.rotation.set(0, yaw, 0); R.scale.setScalar(scale);
    const w = p.walk, sw = w === undefined ? 0 : Math.sin(w * Math.PI * 2);
    this.hips.position.y = HIP + (w === undefined ? 0 : 0.03 * Math.abs(Math.cos(w * Math.PI * 2))) + (p.bob ?? 0);
    this.legA.rotation.x = 0.55 * sw; this.legB.rotation.x = -0.55 * sw;
    this.torso.rotation.set(p.lean ?? 0, 0, w === undefined ? 0 : 0.03 * sw);
    const aA = p.armA ?? [w === undefined ? 0.05 : -0.45 * sw, 0.12], aB = p.armB ?? [w === undefined ? 0.05 : 0.45 * sw, 0.12];
    // character faces +z; arm A sits on -x (screen left when the character faces the camera)
    this.armAG.rotation.set(-aA[0], 0, -aA[1]);
    this.armBG.rotation.set(-aB[0], 0, aB[1]);
    const h = p.head ?? [0, 0, 0];
    this.headG.rotation.set(h[1], h[0], h[2]);
    this.faceMat.map = faceTex(p.expr, p.blink ?? 0, this.look.moustache, this.look.skin, !this.look.moustache);
    this.peg.visible = !!p.peg;
    this.hold("A", p.holdA ?? null); this.hold("B", p.holdB ?? null);
  }
  hide() { this.root.visible = false; }
  /** opens / closes the scissors in either hand (0..1) */
  snip(open: number) {
    this.root.traverse((o) => { if (o.name === "blade-1") o.rotation.y = -0.05 - 0.4 * open; if (o.name === "blade1") o.rotation.y = 0.05 + 0.4 * open; });
  }
}
const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const HIP = 0.66;

// ---------------- rats ----------------
export type RatOpts = { tail?: boolean; hat?: boolean; glow?: boolean; col?: string };
export type RatPose = { run?: number; up?: number; head?: [number, number]; pawA?: number; pawB?: number; blink?: number; tip?: number };
export class Rat {
  root = new THREE.Group();
  private body = new THREE.Group(); private headG = new THREE.Group();
  private feet: THREE.Object3D[] = []; private paws: THREE.Group[] = [];
  private hatG = new THREE.Group(); private lids: THREE.Object3D[] = [];
  opts: RatOpts;
  constructor(parent: THREE.Object3D, o: RatOpts) {
    this.opts = o;
    const fur = fmat(o.col ?? "#8b8078"), belly = fmat("#c9bdb0"), pink = fmat("#e9a3a6"), dark = fmat("#1d1620", 0.6);
    const R = this.root; R.add(this.body);
    // the body pivots at the hips so "up" stands the rat on its hind legs
    this.body.position.set(0, 0.1, -0.12);
    ball(0.16, fur, this.body, [0, 0.07, 0.12], [0.95, 0.85, 1.35]);
    ball(0.11, belly, this.body, [0, 0.03, 0.2], [0.9, 0.7, 1.1]);
    this.body.add(this.headG); this.headG.position.set(0, 0.13, 0.32);
    ball(0.12, fur, this.headG, [0, 0, 0], [1, 0.95, 1]);
    ball(0.085, fur, this.headG, [0, -0.025, 0.1], [0.8, 0.72, 1.15]);
    ball(0.028, pink, this.headG, [0, -0.01, 0.2]);
    for (const s of [-1, 1]) {
      const ear = ball(0.07, fur, this.headG, [s * 0.085, 0.1, -0.03], [1, 1, 0.32]); ear.rotation.z = -s * 0.3;
      ball(0.05, pink, this.headG, [s * 0.087, 0.1, -0.008], [1, 1, 0.2]).rotation.z = -s * 0.3;
      const eyeM = o.glow ? glowMat("#ffe066", 6) : dark;
      ball(0.026, eyeM, this.headG, [s * 0.055, 0.035, 0.085]).castShadow = false;
      if (!o.glow) ball(0.008, fmat("#ffffff"), this.headG, [s * 0.055 + 0.008, 0.045, 0.108]).castShadow = false;
      const lid = ball(0.029, fur, this.headG, [s * 0.055, 0.04, 0.083], [1, 0.1, 1]); lid.visible = false; this.lids.push(lid);
      // whiskers: thin dark sticks
      for (const k of [-1, 1]) { const wsk = mesh(geo("whisk", () => new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4)), dark, this.headG, [s * 0.07, -0.03 + k * 0.012, 0.15]); wsk.rotation.z = s * (Math.PI / 2 - k * 0.15); wsk.castShadow = false; }
    }
    // feet + front paws
    for (const [x, z] of [[-0.08, 0.02], [0.08, 0.02], [-0.07, 0.24], [0.07, 0.24]]) { const ft = ball(0.035, pink, R, [x, 0.03, z - 0.12], [1, 0.6, 1.4]); this.feet.push(ft); }
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 0.08, 0.05, 0.27); this.body.add(g); this.paws.push(g);
      mesh(caps(0.022, 0.07), fur, g, [0, -0.04, 0]);
      ball(0.026, pink, g, [0, -0.09, 0]);
    }
    if (o.tail !== false) {
      const curve = new THREE.CatmullRomCurve3([V3(0, 0.05, -0.04), V3(0.02, 0.02, -0.22), V3(-0.06, 0.0, -0.42), V3(0.05, 0.02, -0.6), V3(0.12, 0.06, -0.7)]);
      mesh(geo("ratTail", () => new THREE.TubeGeometry(curve, 30, 0.018, 8)), pink, this.body);
    } else ball(0.03, pink, this.body, [0, 0.05, -0.08]);            // the stump
    if (o.hat) {
      this.headG.add(this.hatG); this.hatG.position.set(0, 0.1, -0.01); this.hatG.rotation.x = -0.12;
      mesh(geo("topBrim", () => new THREE.CylinderGeometry(0.15, 0.15, 0.015, 28)), fmat("#1c1a22", 0.35), this.hatG, [0, 0, 0]);
      mesh(geo("topCrown", () => new THREE.CylinderGeometry(0.095, 0.1, 0.2, 28)), fmat("#1c1a22", 0.35), this.hatG, [0, 0.1, 0]);
      mesh(geo("topBand", () => new THREE.CylinderGeometry(0.102, 0.102, 0.035, 28, 1, true)), fmat("#b8262e"), this.hatG, [0, 0.03, 0]);
    }
    parent.add(R);
  }
  pose(x: number, y: number, z: number, yaw: number, p: RatPose, scale = 1) {
    const R = this.root;
    R.visible = true; R.position.set(x, y, z); R.rotation.set(0, yaw, 0); R.scale.setScalar(scale);
    const r = p.run, s = r === undefined ? 0 : Math.sin(r * Math.PI * 2), up = p.up ?? 0;
    this.body.rotation.x = -1.25 * up + (r === undefined ? 0 : 0.06 * s);
    this.body.position.y = 0.1 + 0.1 * up + (r === undefined ? 0 : 0.02 * Math.abs(Math.cos(r * Math.PI * 2)));
    this.feet.forEach((f, i) => { f.position.y = 0.03 + (r === undefined ? 0 : Math.max(0, 0.035 * Math.sin(r * Math.PI * 2 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)))); });
    for (let i = 2; i < 4; i++) this.feet[i].visible = up < 0.5;
    const h = p.head ?? [0, 0];
    this.headG.rotation.set(1.25 * up + h[1], h[0], 0);
    this.paws[0].rotation.x = -(p.pawA ?? 0.3 * up); this.paws[1].rotation.x = -(p.pawB ?? 0.3 * up);
    for (const l of this.lids) l.visible = (p.blink ?? 0) > 0.5;
    if (this.opts.hat) { const tip = p.tip ?? 0; this.hatG.position.set(0.06 * tip, 0.1 + 0.08 * tip, 0.04 * tip); this.hatG.rotation.set(-0.12 - 0.5 * tip, 0, -0.5 * tip); }
  }
  hide() { this.root.visible = false; }
}

// ---------------- placements (cast.ts -> world.ts) ----------------
export type FigPlace =
  | { kind: "person"; id: string; look: Look; x: number; y: number; z: number; yaw: number; pose: Pose; scale?: number; snip?: number }
  | { kind: "rat"; id: string; opts: RatOpts; x: number; y: number; z: number; yaw: number; pose: RatPose; scale?: number };

/** keeps one figure per id alive and hides the ones not used this frame */
export class FigPool {
  private people = new Map<string, Person>(); private rats = new Map<string, Rat>();
  constructor(private parent: THREE.Object3D) {}
  apply(list: FigPlace[]) {
    const used = new Set<string>();
    for (const f of list) {
      used.add(f.kind + f.id);
      if (f.kind === "person") {
        let p = this.people.get(f.id);
        if (!p) { p = new Person(this.parent, f.look); this.people.set(f.id, p); }
        p.pose(f.x, f.y, f.z, f.yaw, f.pose, f.scale ?? 1);
        if (f.snip !== undefined) p.snip(f.snip);
      } else {
        let r = this.rats.get(f.id);
        if (!r) { r = new Rat(this.parent, f.opts); this.rats.set(f.id, r); }
        r.pose(f.x, f.y, f.z, f.yaw, f.pose, f.scale ?? 1);
      }
    }
    for (const [k, p] of this.people) if (!used.has("person" + k)) p.hide();
    for (const [k, r] of this.rats) if (!used.has("rat" + k)) r.hide();
  }
  person(id: string) { return this.people.get(id); }
}
