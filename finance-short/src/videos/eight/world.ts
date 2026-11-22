// The river town as one three.js scene: sky, river, quays, the town (build.ts), and this film's sets: the red-brick
// bank with its columned portico and the gold 8 in the pediment; its lobby (marble floor, teller counter, monitors,
// chalkboard of daily goals, "Going for Gr-eight" banner, calendar, the boss's panelled corner with the framed 8);
// the card tower (instanced cards that grow and then burst); the iron fence that shoots up around the building; the
// porch house with its doormat; the vegetable patch in the park. update(id, f, camera) poses everything for shot `id`
// at frame f (a pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, BANK, IN, COUNTER, CY, BOARD, MONITORS, STAMP, TRAY, CAL, FRAME8, EIGHT,
  PORTICO, FENCE, HOUSE, MAT, GARDEN, TOWER, CARD_H, COLLAPSE, towerN, fenceUp, lin,
} from "./story";

// ---------------- assets ----------------
// The Kenney kit is optional: trees, bushes and hedges are drawn as cartoon vegetation in build.ts; any other prop
// whose model is missing is simply left out.
export const loadKit = () => Promise.resolve({} as Kit);
const FONT = "'Inter Display', Inter, sans-serif";

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** per-shot sun override (story.ts ShotDef sunAz/sunEl win if present) */
// a front-right key: walls and faces turned to the lens stay lit (the default az 75 leaves them in the cool shade)
const SUN_SHOT: Record<number, { az?: number; el?: number }> = {
  1: { az: 140, el: 50 }, 2: { az: 125, el: 42 }, 3: { az: 140, el: 50 }, 4: { az: 140, el: 50 }, 5: { az: 140, el: 50 }, 6: { az: 140, el: 50 },
  7: { az: 140, el: 50 }, 8: { az: 130, el: 45 }, 9: { az: 140, el: 50 }, 10: { az: 140, el: 50 }, 11: { az: 125, el: 45 }, 12: { az: 130, el: 45 },
  13: { az: 120, el: 45 }, 14: { az: 140, el: 50 }, 15: { az: 125, el: 42 }, 16: { az: 160, el: 13 },
};
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
});

// ---------------- painted textures for the bank ----------------
const txt = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string, w = 900, align: CanvasTextAlign = "center") => {
  g.font = `${w} ${px}px ${FONT}`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
/** checkered marble, 4 x 4 tiles of 0.8 m per tile of texture (3.2 m) */
const marbleTex = () => ctex("marble8", 1024, 1024, (g, r) => {
  const S = 256;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    g.fillStyle = jit(r, (i + j) % 2 ? "#eee3cc" : "#b89f86", 0.04, 3, 0.1); g.fillRect(i * S, j * S, S, S);
    g.strokeStyle = (i + j) % 2 ? "rgba(150,125,100,0.16)" : "rgba(255,245,230,0.16)"; g.lineWidth = 3;
    for (let k = 0; k < 2; k++) {
      g.beginPath(); let x = i * S + r() * S, y = j * S;
      g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 60; y += S / 6; g.lineTo(Math.min(i * S + S, Math.max(i * S, x)), y); } g.stroke();
    }
  }
  g.fillStyle = "rgba(70,50,45,0.6)";
  for (let k = 0; k <= 4; k++) { g.fillRect(k * S - 3, 0, 6, 1024); g.fillRect(0, k * S - 3, 1024, 6); }
});
/** interior wall: dark red-brown wood wainscot (1.15 m) with panels, a chair rail, warm cream plaster to 9.5 m,
 *  a painted cornice band near the top. 4 m wide per texture width. */
const WALL_PX = 128; // px per metre
const wallTex = () => ctex("bankWall", 512, Math.round(9.5 * WALL_PX), (g, r) => {
  const H = Math.round(9.5 * WALL_PX), y = (m: number) => H - m * WALL_PX;
  g.fillStyle = "#efdcb9"; g.fillRect(0, 0, 512, H);
  for (let i = 0; i < 60; i++) { // soft mottling
    const x = r() * 512, yy = r() * H, rad = 30 + r() * 80;
    const gr = g.createRadialGradient(x, yy, 0, x, yy, rad); gr.addColorStop(0, "rgba(190,150,110,0.07)"); gr.addColorStop(1, "rgba(190,150,110,0)");
    g.fillStyle = gr; g.fillRect(x - rad, yy - rad, 2 * rad, 2 * rad);
  }
  g.fillStyle = "#7a3a2a"; g.fillRect(0, y(1.15), 512, 1.15 * WALL_PX);
  for (let i = 0; i < 4; i++) { g.strokeStyle = "rgba(40,18,14,0.6)"; g.lineWidth = 5; g.strokeRect(i * 128 + 16, y(1.0), 96, 0.78 * WALL_PX); g.fillStyle = "rgba(255,210,170,0.07)"; g.fillRect(i * 128 + 20, y(0.98), 88, 10); }
  g.fillStyle = "#4e2419"; g.fillRect(0, y(1.2), 512, 0.08 * WALL_PX); g.fillRect(0, y(0.12), 512, 0.12 * WALL_PX);
  g.fillStyle = "#d9b36a"; g.fillRect(0, y(1.22), 512, 4);
  g.fillStyle = "#e4cfa6"; g.fillRect(0, y(6.3), 512, 0.35 * WALL_PX); g.fillStyle = "rgba(120,80,50,0.35)"; g.fillRect(0, y(5.95), 512, 4); g.fillRect(0, y(6.3), 512, 4);
});
/** dark walnut panelling for the boss's corner, 2 m per texture width, 3 m tall */
const panelTex = () => ctex("bossPanel", 512, 768, (g, r) => {
  g.fillStyle = "#5a2f22"; g.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const x = i * 256 + 22, y = j * 256 + 22;
    g.fillStyle = jit(r, "#6d3a29", 0.06, 3, 0.1); g.fillRect(x, y, 212, 212);
    g.strokeStyle = "rgba(30,12,8,0.7)"; g.lineWidth = 6; g.strokeRect(x, y, 212, 212);
    g.fillStyle = "rgba(255,200,150,0.08)"; g.fillRect(x + 6, y + 6, 200, 12);
  }
});
/** the counter front: panels of dark red wood with a gold rule, 2 m per texture width, 1.1 m tall */
const counterTex = () => ctex("counterFront", 512, 282, (g, r) => {
  g.fillStyle = "#6e2f24"; g.fillRect(0, 0, 512, 282);
  for (let i = 0; i < 2; i++) {
    const x = i * 256 + 20;
    g.fillStyle = jit(r, "#843a2c", 0.05, 3, 0.1); g.fillRect(x, 40, 216, 200);
    g.strokeStyle = "rgba(35,12,10,0.7)"; g.lineWidth = 6; g.strokeRect(x, 40, 216, 200);
    g.strokeStyle = "#d9b36a"; g.lineWidth = 4; g.strokeRect(x + 16, 56, 184, 168);
  }
  g.fillStyle = "#3e1812"; g.fillRect(0, 262, 512, 20);
});
/** chalkboard of the daily goals: slate, wooden frame painted in, chalk */
const boardTex = () => ctex("goalBoard", 1024, 512, (g, r) => {
  g.fillStyle = "#7a4a2c"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#2f4a3e"; g.fillRect(28, 28, 968, 456);
  for (let i = 0; i < 40; i++) { const x = 28 + r() * 900, y = 28 + r() * 400; g.fillStyle = "rgba(255,255,255,0.035)"; g.fillRect(x, y, 60 + r() * 120, 18 + r() * 40); }
  const chalk = "rgba(246,244,232,0.92)";
  txt(g, "DAILY GOALS", 512, 92, 72, chalk, 800);
  g.fillStyle = chalk; g.fillRect(300, 136, 424, 6);
  const rows = [["ANNA", "8"], ["BEN", "8"], ["CARLA", "8"], ["DAN", "8"]];
  rows.forEach(([n, v], i) => {
    const y = 200 + i * 72;
    txt(g, n, 110, y, 50, chalk, 700, "left");
    for (let k = 0; k < 4 + (i % 3); k++) { g.fillStyle = chalk; g.fillRect(440 + k * 26, y - 22, 8, 44); }
    txt(g, v, 860, y, 64, "rgba(255,214,90,0.95)", 900);
  });
  g.strokeStyle = "rgba(255,214,90,0.9)"; g.lineWidth = 8; g.beginPath(); g.ellipse(860, 200, 46, 40, 0, 0, 7); g.stroke();
});
/** "GOING FOR GR-EIGHT!" (the bank's own 1999 slogan): red banner, gold letters, swallow tails */
const bannerTex = () => ctex("gr8Banner", 1024, 160, (g) => {
  g.fillStyle = "#b8262e"; g.beginPath(); g.moveTo(0, 0); g.lineTo(1024, 0); g.lineTo(990, 80); g.lineTo(1024, 160); g.lineTo(0, 160); g.lineTo(34, 80); g.closePath(); g.fill();
  g.fillStyle = "#e8c45a"; g.fillRect(40, 14, 944, 6); g.fillRect(40, 140, 944, 6);
  g.lineWidth = 10; g.strokeStyle = "#5a1014"; g.font = `900 92px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.strokeText("GOING FOR GR-EIGHT!", 512, 84); txt(g, "GOING FOR GR-EIGHT!", 512, 84, 92, "#f5d36a");
});
/** the boss's painting: a gold 8 on red, in a gilt frame */
const frame8Tex = () => ctex("frame8", 512, 640, (g) => {
  g.fillStyle = "#c79a3a"; g.fillRect(0, 0, 512, 640);
  g.fillStyle = "#a57a26"; g.fillRect(18, 18, 476, 604);
  g.fillStyle = "#9e2028"; g.fillRect(48, 48, 416, 544);
  const gr = g.createRadialGradient(256, 300, 40, 256, 320, 300); gr.addColorStop(0, "rgba(255,120,110,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(48, 48, 416, 544);
  g.lineWidth = 22; g.strokeStyle = "#3a1410"; g.font = `900 470px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.strokeText("8", 256, 340);
  const gg = g.createLinearGradient(0, 120, 0, 560); gg.addColorStop(0, "#ffe9a0"); gg.addColorStop(0.5, "#f2c230"); gg.addColorStop(1, "#c8901e");
  g.fillStyle = gg; g.fillText("8", 256, 340);
  g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.ellipse(200, 200, 14, 34, -0.5, 0, 7); g.fill();
});
const friezeTex = () => ctex("friezeBank", 1024, 128, (g) => {
  g.fillStyle = "#efe3c8"; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = "rgba(120,95,70,0.35)"; g.fillRect(0, 0, 1024, 6); g.fillRect(0, 122, 1024, 6);
  g.font = `800 96px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#6a4a36"; g.fillText("B   A   N   K", 512, 70);
});
const windowTex = (key: string, glass: string, sheen: string) => ctex(key, 256, 512, (g) => {
  g.fillStyle = glass; g.fillRect(0, 0, 256, 512);
  const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, sheen); gr.addColorStop(0.5, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#efe3c8"; g.fillRect(0, 0, 256, 14); g.fillRect(0, 498, 256, 14); g.fillRect(0, 0, 14, 512); g.fillRect(242, 0, 14, 512);
  g.fillRect(121, 0, 14, 512); for (const y of [170, 340]) g.fillRect(0, y, 256, 12);
});
const doorTex = () => ctex("bankDoor", 512, 800, (g) => {
  g.fillStyle = "#4a2418"; g.fillRect(0, 0, 512, 800);
  for (const x of [20, 266]) {
    g.fillStyle = "#6e3424"; g.fillRect(x, 20, 226, 760);
    g.strokeStyle = "rgba(25,8,6,0.7)"; g.lineWidth = 7;
    g.strokeRect(x + 26, 50, 174, 300); g.strokeRect(x + 26, 400, 174, 340);
    g.fillStyle = "rgba(150,200,230,0.55)"; g.fillRect(x + 40, 64, 146, 272);
  }
  g.fillStyle = "#e2b84e"; g.fillRect(222, 380, 22, 90); g.fillRect(268, 380, 22, 90);
});
const matTex = () => ctex("doormat", 512, 300, (g, r) => {
  g.fillStyle = "#b5874e"; g.fillRect(0, 0, 512, 300);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,80,40,0.25)" : "rgba(230,190,130,0.2)"; g.fillRect(r() * 512, r() * 300, 3, 9); }
  g.strokeStyle = "#5a3a22"; g.lineWidth = 12; g.strokeRect(14, 14, 484, 272);
  txt(g, "WELCOME", 256, 152, 92, "#4a2c18", 900);
});
const soilTex = () => ctex("soil", 512, 256, (g, r) => {
  g.fillStyle = "#6a4630"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,24,16,0.3)" : "rgba(160,120,80,0.25)"; g.fillRect(r() * 512, r() * 256, 4 + r() * 6, 3 + r() * 4); }
  g.fillStyle = "rgba(35,20,12,0.45)"; for (const y of [64, 128, 192]) g.fillRect(0, y - 6, 512, 12);
});
/** the bank card: red, a gold band and chip, a little 8 */
const cardTex = () => ctex("card8", 256, 160, (g) => {
  g.fillStyle = "#c0262e"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#e8b53a"; g.fillRect(0, 100, 256, 22);
  g.fillStyle = "#f2d27a"; g.fillRect(28, 44, 44, 34); g.strokeStyle = "#8a6a20"; g.lineWidth = 3; g.strokeRect(28, 44, 44, 34);
  txt(g, "8", 214, 52, 64, "#f5d36a");
  g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(0, 0, 256, 160);
});
/** a monitor screen state: blank (logo), new account (+count), PIN, email */
const screenTex = (mode: number, n: number) => ctex(`screen${mode}_${n}`, 320, 210, (g) => {
  g.fillStyle = "#1d3b6a"; g.fillRect(0, 0, 320, 210);
  g.fillStyle = "#2a5596"; g.fillRect(0, 0, 320, 34);
  txt(g, "NEW CUSTOMER", 160, 18, 20, "#dfe9ff", 800);
  if (mode === 0) { txt(g, "8", 160, 122, 110, "#f2c230"); return; }
  if (mode === 1) {
    txt(g, "NEW ACCOUNT", 160, 82, 34, "#ffffff", 900);
    g.strokeStyle = "#5fd36a"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(112, 136); g.lineTo(146, 166); g.lineTo(210, 112); g.stroke();
    txt(g, `#${n}`, 160, 196, 20, "#9fb8e6", 800); return;
  }
  if (mode === 2) { txt(g, "PIN", 160, 74, 34, "#ffffff", 900); g.fillStyle = "#ffffff"; g.fillRect(62, 104, 196, 64); for (let i = 0; i < 4; i++) { g.fillStyle = "#1d3b6a"; g.beginPath(); g.arc(98 + i * 41, 136, 13, 0, 7); g.fill(); } return; }
  txt(g, "EMAIL", 160, 74, 34, "#ffffff", 900); g.fillStyle = "#ffffff"; g.fillRect(36, 104, 248, 64); txt(g, "@", 160, 138, 64, "#d8343a");
});
const calTex = (day: number) => ctex(`cal${day}`, 256, 320, (g) => {
  g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#c0262e"; g.fillRect(0, 0, 256, 78);
  txt(g, "MAY", 128, 42, 46, "#ffffff", 900);
  txt(g, String(day), 128, 200, 150, "#241726", 900);
  g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(0, 0, 256, 320);
});

/** every lens position of the film looking at its subject (houses in the way are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

type Mats = Record<string, THREE.Material>;
const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private smoke: { m: THREE.Mesh; mat: THREE.MeshLambertMaterial; top: V3; k: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private cards!: THREE.InstancedMesh;
  private fence: { m: THREE.Object3D; c: number }[] = [];
  private screens: { m: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
  private calPage!: THREE.Mesh; private calOld!: THREE.Mesh; private calPivot!: THREE.Group;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private dummy = new THREE.Object3D();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground, river, quays (static batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.wall = lam("wallHD", () => ({ map: stoneHD("wallHD", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.bed = lam("bed", () => ({ map: bed() }));
    M.gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e8bf45", specular: "#fff1b0", shininess: 70 }), 0.25);
    M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#2f333c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    M.brass = twoTone(new THREE.MeshPhongMaterial({ color: "#c9a04a", specular: "#fff0b0", shininess: 60 }), 0.2);
    for (const s of [-1, 1]) {
      const zn = s * 30, zf = s * 900;
      b.add(s < 0 ? quadUp(-900, 900, zf, zn, 450, 217.5) : quadUp(-900, 900, zn, zf, 450, 217.5), M.grass);
      b.add(s < 0 ? quadUp(-160, 160, -36.5, -30, 80, 1.625, 0.012) : quadUp(-160, 160, 30, 36.5, 80, 1.625, 0.012), M.cobble);
      b.add(s < 0 ? quadUp(-6, 6, -170, -36.5, 3, 33.375, 0.012) : quadUp(-6, 6, 36.5, 170, 3, 33.375, 0.012), M.cobble);
      b.add(s < 0 ? wallQuad(-900, 900, -30, 1) : wallQuad(900, -900, 30, -1), M.wall);
      b.add(boxGeo(V(-600, D0, s < 0 ? -30.5 : 30), V(600, D0 + 0.75, s < 0 ? -30 : 30.5), 2), M.cope);
      b.add(boxGeo(V(-600, D0 - 0.05, s < 0 ? -30.6 : 29.4), V(600, D0 + 0.02, s < 0 ? -29.4 : 30.6), 2), M.cope);
    }
    b.add(quadUp(-900, 900, -30, 30, 225, 7.5, -0.6 - D0), M.bed);
    this.buildPorch(b);
    this.buildGarden(b);
    b.build(R);
    // the bank: its shell casts no shadow (the lobby inside stays sunlit like a lit interior); fittings do
    const shell = new Batch(), fit = new Batch();
    this.buildBank(shell, fit, M);
    shell.build(R, false);
    fit.build(R);
    buildTown(R, kit, sightLines());
    this.buildCards(R);
    this.buildFence(R, M);
    this.buildScreens(R);

    // water: its own mesh so the ripples can drift
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "river1";
    const wm = new THREE.Mesh(quadUp(-900, 900, -30, 30, 1, 1, -D0), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // chimney smoke (mill on the near bank, brewery chimney on the far bank)
    const smokeT = smokeTex();
    for (const [top, n] of [[[-22, D0 + 30.6, -77], 7], [[-80, D0 + 24.6, 93], 6]] as const)
      for (let k = 0; k < n; k++) {
        const mat = new THREE.MeshLambertMaterial({ map: smokeT, transparent: true, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.layers.set(NOINK);
        this.smoke.push({ m, mat, top: top as unknown as V3, k: k / n }); R.add(m);
      }
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  // ---------------- the bank ----------------
  private buildBank(sh: Batch, fit: Batch, M: Mats) {
    const { x0, x1, zf, zb, h, wt } = BANK, y0 = D0;
    const brk = lam("bankBrick", () => ({ map: rep(brick(), 1, 1) }));
    const stone = lam("bankStone", () => ({ color: "#efe3c8" }));
    const stoneT = lam("bankStoneT", () => ({ map: stoneHD("bankStoneHD", ["#efe4cf", "#e8dcc5", "#f3e9d6", "#e2d5bd"], "#bcae96") }));
    const red = lam("tympanum", () => ({ color: "#b23a26" }));
    const dark = lam("bankDark", () => ({ color: "#2c2433" }));
    const DW = 1.0; // half door width
    const dy1 = y0 + 3.75; // door top
    // ---- shell: facade around the door opening, sides, back, roof ----
    sh.add(boxGeo(V(x0, y0, zf), V(42 - DW - 0.15, y0 + h, zf + wt), 2), brk);
    sh.add(boxGeo(V(42 + DW + 0.15, y0, zf), V(x1, y0 + h, zf + wt), 2), brk);
    sh.add(boxGeo(V(42 - DW - 0.15, dy1 + 0.25, zf), V(42 + DW + 0.15, y0 + h, zf + wt), 2), brk);
    sh.add(boxGeo(V(x0, y0, zb - wt), V(x1, y0 + h, zb), 2), brk);
    sh.add(boxGeo(V(x0, y0, zf), V(x0 + wt, y0 + h, zb), 2), brk);
    sh.add(boxGeo(V(x1 - wt, y0, zf), V(x1, y0 + h, zb), 2), brk);
    sh.add(boxGeo(V(x0 - 0.05, y0 + h, zf - 0.05), V(x1 + 0.05, y0 + h + 0.25, zb + 0.05), 2, true), M.cope); // roof slab (closed below)
    sh.add(quad(V(x0, y0 + h - 0.21, zf), V(x1, y0 + h - 0.21, zf), V(x1, y0 + h - 0.21, zb), V(x0, y0 + h - 0.21, zb)), lam("ceiling", () => ({ color: "#f3e6cc" }))); // lobby ceiling
    sh.add(boxGeo(V(x0 - 0.3, y0 + h - 0.55, zf - 0.3), V(x1 + 0.3, y0 + h - 0.2, zb + 0.3)), stone);           // cornice
    sh.add(boxGeo(V(x0, y0 + h + 0.25, zf), V(x1, y0 + h + 0.7, zf + 0.3)), stone);                             // parapet
    sh.add(boxGeo(V(x0 - 0.08, y0, zf - 0.08), V(x1 + 0.08, y0 + 0.55, zb + 0.08), 2), M.cope);               // plinth
    // facade windows (outside: dark glass with a sky sheen; inside: bright daylight glass)
    const winOut = lam("winOut", () => ({ map: windowTex("winOut", "#2d4f7a", "rgba(190,225,255,0.5)") }));
    const winIn = lam("winIn", () => ({ map: windowTex("winIn", "#cfe6fb", "rgba(255,255,255,0.6)") }));
    for (const [wx0, wx1] of [[35.0, 36.5], [47.5, 49.0]]) {
      const wy0 = y0 + 1.4, wy1 = y0 + 5.6;
      sh.add(quad(V(wx1, wy0, zf - 0.02), V(wx0, wy0, zf - 0.02), V(wx0, wy1, zf - 0.02), V(wx1, wy1, zf - 0.02)), winOut);
      sh.add(boxGeo(V(wx0 - 0.15, wy0 - 0.2, zf - 0.12), V(wx1 + 0.15, wy0, zf)), stone);                          // sill
      sh.add(boxGeo(V(wx0 - 0.2, wy1, zf - 0.1), V(wx1 + 0.2, wy1 + 0.35, zf)), stone);                            // hood
      sh.add(boxGeo(V((wx0 + wx1) / 2 - 0.18, wy1 + 0.05, zf - 0.16), V((wx0 + wx1) / 2 + 0.18, wy1 + 0.45, zf)), stone); // keystone
      sh.add(quad(V(wx0, wy0, zf + wt + 0.02), V(wx1, wy0, zf + wt + 0.02), V(wx1, wy1, zf + wt + 0.02), V(wx0, wy1, zf + wt + 0.02)), winIn);
    }
    // side windows (seen from the lobby on the right wall, x1)
    for (const wz of [39.0, 41.6]) {
      const wy0 = y0 + 1.6, wy1 = y0 + 5.4;
      sh.add(quad(V(x1 - wt - 0.02, wy0, wz - 0.7), V(x1 - wt - 0.02, wy0, wz + 0.7), V(x1 - wt - 0.02, wy1, wz + 0.7), V(x1 - wt - 0.02, wy1, wz - 0.7)), winIn);
      sh.add(quad(V(x1 + 0.02, wy0, wz + 0.7), V(x1 + 0.02, wy0, wz - 0.7), V(x1 + 0.02, wy1, wz - 0.7), V(x1 + 0.02, wy1, wz + 0.7)), winOut);
    }
    // door: frame, doors, transom
    const door = lam("bankDoor", () => ({ map: doorTex() }));
    sh.add(quad(V(42 + DW, y0 + 0.45, zf + 0.06), V(42 - DW, y0 + 0.45, zf + 0.06), V(42 - DW, dy1, zf + 0.06), V(42 + DW, dy1, zf + 0.06)), door);
    sh.add(boxGeo(V(42 - DW, y0 + 0.45, zf + 0.06), V(42 + DW, dy1 + 0.25, zf + 0.1)), dark);
    sh.add(boxGeo(V(42 - DW - 0.3, y0 + 0.45, zf - 0.1), V(42 - DW, dy1 + 0.25, zf + 0.06)), stone);
    sh.add(boxGeo(V(42 + DW, y0 + 0.45, zf - 0.1), V(42 + DW + 0.3, dy1 + 0.25, zf + 0.06)), stone);
    sh.add(boxGeo(V(42 - DW - 0.45, dy1 + 0.25, zf - 0.14), V(42 + DW + 0.45, dy1 + 0.6, zf + 0.06)), stone);
    // ---- portico: steps, porch, four columns, entablature with the frieze, pediment with the gold 8 ----
    const { x0: px0, x1: px1, zc, top } = PORTICO;
    for (const [z0s, hgt] of [[33.8, 0.15], [34.2, 0.3], [34.6, 0.45]] as const) sh.add(boxGeo(V(px0 - 0.4, y0, z0s), V(px1 + 0.4, y0 + hgt, zf), 2), stoneT);
    for (const cx of [37.6, 40.2, 43.8, 46.4]) {
      sh.add(boxGeo(V(cx - 0.42, y0 + 0.45, zc - 0.42), V(cx + 0.42, y0 + 0.72, zc + 0.42)), stone);
      sh.add(new THREE.CylinderGeometry(0.29, 0.33, top - 0.2 - (y0 + 0.72), 20), stone, new THREE.Matrix4().makeTranslation(cx, (top - 0.2 + y0 + 0.72) / 2, zc));
      sh.add(boxGeo(V(cx - 0.45, top - 0.2, zc - 0.45), V(cx + 0.45, top, zc + 0.45)), stone);
    }
    const ez0 = 34.45, et = top + 0.9;
    sh.add(boxGeo(V(px0 - 0.25, top, ez0), V(px1 + 0.25, et, zf)), stone);
    const frz = lam("frieze", () => ({ map: friezeTex() }));
    sh.add(quad(V(45.2, top + 0.15, ez0 - 0.02), V(38.8, top + 0.15, ez0 - 0.02), V(38.8, top + 0.75, ez0 - 0.02), V(45.2, top + 0.75, ez0 - 0.02)), frz);
    sh.add(boxGeo(V(px0 - 0.4, et, ez0 - 0.12), V(px1 + 0.4, et + 0.18, zf)), stone);
    const apex = et + 2.15, bx0 = px0 - 0.4, bx1 = px1 + 0.4;
    sh.add(tri(V(bx1, et + 0.18, ez0 - 0.12), V(bx0, et + 0.18, ez0 - 0.12), V(42, apex, ez0 - 0.12)), stone);
    // tympanum: an inset red triangle
    const ins = 0.55;
    sh.add(tri(V(bx1 - ins * 2.1, et + 0.18 + ins * 0.45, ez0 - 0.14), V(bx0 + ins * 2.1, et + 0.18 + ins * 0.45, ez0 - 0.14), V(42, apex - ins, ez0 - 0.14)), red);
    // the raking cornice (two sloped beams) and roof planes back to the facade
    const slope = Math.atan2(apex - et, 42 - bx0), len = Math.hypot(apex - et, 42 - bx0);
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(len + 0.3, 0.3, zf - ez0 + 0.3);
      g.rotateZ(s * -slope);
      sh.add(g, stone, new THREE.Matrix4().makeTranslation(42 + s * (42 - bx0) / 2, (et + apex) / 2 + 0.25, (ez0 + zf) / 2 - 0.15));
    }
    // the gold 8: two stacked tori (bigger below), facing the street
    const S = 1.0;
    const lo = new THREE.TorusGeometry(0.29 * S, 0.115 * S, 16, 36), hi = new THREE.TorusGeometry(0.235 * S, 0.1 * S, 16, 36);
    sh.add(lo, M.gold, new THREE.Matrix4().makeTranslation(EIGHT[0], EIGHT[1] - 0.29 * S, EIGHT[2]));
    sh.add(hi, M.gold, new THREE.Matrix4().makeTranslation(EIGHT[0], EIGHT[1] + 0.33 * S, EIGHT[2]));
    // ---- lobby ----
    const fl = lam("marble8", () => ({ map: marbleTex() }));
    sh.add(quadUp(IN.x0, IN.x1, IN.z0, IN.z1, (IN.x1 - IN.x0) / 3.2, (IN.z1 - IN.z0) / 3.2, 0.015), fl);
    const wl = lam("bankWall", () => ({ map: wallTex() })), W4 = (a: number) => a / 4;
    const top2 = y0 + h - 0.2;
    sh.add(quad(V(IN.x1, y0, IN.z1 - 0.01), V(IN.x0, y0, IN.z1 - 0.01), V(IN.x0, top2, IN.z1 - 0.01), V(IN.x1, top2, IN.z1 - 0.01), W4(IN.x1 - IN.x0), 1), wl);
    sh.add(quad(V(IN.x0 + 0.01, y0, 44.4), V(IN.x0 + 0.01, y0, IN.z0), V(IN.x0 + 0.01, top2, IN.z0), V(IN.x0 + 0.01, top2, 44.4), W4(44.4 - IN.z0), 1), wl);
    sh.add(quad(V(IN.x1 - 0.01, y0, IN.z0), V(IN.x1 - 0.01, y0, IN.z1), V(IN.x1 - 0.01, top2, IN.z1), V(IN.x1 - 0.01, top2, IN.z0), W4(IN.z1 - IN.z0), 1), wl);
    sh.add(quad(V(IN.x0, y0, IN.z0 + 0.01), V(IN.x1, y0, IN.z0 + 0.01), V(IN.x1, top2, IN.z0 + 0.01), V(IN.x0, top2, IN.z0 + 0.01), W4(IN.x1 - IN.x0), 1), wl);
    // the boss's corner: walnut panelling to 3 m on the side wall behind the counter, plaster above, a partition
    const pn = lam("bossPanel", () => ({ map: panelTex() }));
    sh.add(quad(V(IN.x0 + 0.01, y0, IN.z1), V(IN.x0 + 0.01, y0, 44.4), V(IN.x0 + 0.01, y0 + 3.0, 44.4), V(IN.x0 + 0.01, y0 + 3.0, IN.z1), (IN.z1 - 44.4) / 2, 1), pn);
    const plaster = lam("plaster", () => ({ color: "#efdcb9" }));
    sh.add(quad(V(IN.x0 + 0.01, y0 + 3.0, IN.z1), V(IN.x0 + 0.01, y0 + 3.0, 44.4), V(IN.x0 + 0.01, top2, 44.4), V(IN.x0 + 0.01, top2, IN.z1)), plaster);
    const wood = lam("walnut", () => ({ color: "#5e2f22" }));
    fit.add(boxGeo(V(IN.x0, y0, 44.1), V(COUNTER.x0, y0 + 2.4, 44.4)), wood);
    fit.add(boxGeo(V(IN.x0, y0 + 2.4, 44.05), V(COUNTER.x0, y0 + 2.5, 44.45)), M.brass);
    // framed 8 + a little brass lamp over it
    fit.add(boxGeo(V(FRAME8[0], FRAME8[1] - 0.7, FRAME8[2] - 0.56), V(FRAME8[0] + 0.07, FRAME8[1] + 0.7, FRAME8[2] + 0.56)), M.gold);
    const f8 = lam("frame8", () => ({ map: frame8Tex() }));
    fit.add(quad(V(FRAME8[0] + 0.08, FRAME8[1] - 0.66, FRAME8[2] + 0.52), V(FRAME8[0] + 0.08, FRAME8[1] - 0.66, FRAME8[2] - 0.52),
      V(FRAME8[0] + 0.08, FRAME8[1] + 0.66, FRAME8[2] - 0.52), V(FRAME8[0] + 0.08, FRAME8[1] + 0.66, FRAME8[2] + 0.52)), f8);
    // desk + green-shaded lamp
    fit.add(boxGeo(V(34.9, y0 + 0.72, 48.35), V(36.5, y0 + 0.8, 49.8)), wood);
    fit.add(boxGeo(V(34.95, y0, 48.4), V(35.15, y0 + 0.72, 49.75)), wood);
    fit.add(boxGeo(V(36.25, y0, 48.4), V(36.45, y0 + 0.72, 49.75)), wood);
    fit.add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), M.brass, new THREE.Matrix4().makeTranslation(35.4, y0 + 1.0, 49.3));
    fit.add(new THREE.CylinderGeometry(0.08, 0.2, 0.16, 16), lam("lampGreen", () => ({ color: "#2f7a4b" })), new THREE.Matrix4().makeTranslation(35.4, y0 + 1.25, 49.3));
    // counter: panelled front, warm top, brass foot rail
    const cf = lam("counterFront", () => ({ map: counterTex() }));
    const { x0: cx0, x1: cx1, z0: cz0, z1: cz1 } = COUNTER;
    fit.add(quad(V(cx1, y0, cz0), V(cx0, y0, cz0), V(cx0, CY - 0.06, cz0), V(cx1, CY - 0.06, cz0), (cx1 - cx0) / 2, 1), cf);
    fit.add(boxGeo(V(cx0, y0, cz0 + 0.01), V(cx1, CY - 0.06, cz1)), wood);
    fit.add(boxGeo(V(cx0 - 0.06, CY - 0.06, cz0 - 0.08), V(cx1 + 0.06, CY, cz1 + 0.04)), lam("counterTop", () => ({ color: "#d8c1a0" })));
    fit.add(new THREE.CylinderGeometry(0.035, 0.035, cx1 - cx0, 10).rotateZ(Math.PI / 2), M.brass, new THREE.Matrix4().makeTranslation((cx0 + cx1) / 2, y0 + 0.18, cz0 - 0.18));
    // monitors (dark bodies; the screens are separate meshes, see buildScreens)
    const mon = lam("monitor", () => ({ color: "#30323c" }));
    for (const m of MONITORS) {
      fit.add(boxGeo(V(m[0] - 0.06, CY, m[2] - 0.05), V(m[0] + 0.06, CY + 0.18, m[2] + 0.05)), mon);
      fit.add(boxGeo(V(m[0] - 0.2, CY, m[2] - 0.12), V(m[0] + 0.2, CY + 0.03, m[2] + 0.12)), mon);
      fit.add(boxGeo(V(m[0] - 0.3, CY + 0.16, m[2] - 0.04), V(m[0] + 0.3, CY + 0.56, m[2] + 0.04)), mon);
    }
    // the stamping teller's ink pad and forms; the envelope tray
    fit.add(boxGeo(V(STAMP[0] - 0.14, CY, STAMP[2] - 0.1), V(STAMP[0] + 0.14, CY + 0.04, STAMP[2] + 0.1)), lam("inkpad", () => ({ color: "#2a3a6a" })));
    fit.add(boxGeo(V(STAMP[0] - 0.62, CY, STAMP[2] - 0.17), V(STAMP[0] - 0.24, CY + 0.09, STAMP[2] + 0.17)), lam("forms", () => ({ color: "#f6f0e0" })));
    fit.add(boxGeo(V(TRAY[0] - 0.24, CY, TRAY[2] - 0.17), V(TRAY[0] + 0.24, CY + 0.08, TRAY[2] + 0.17)), lam("tray", () => ({ color: "#6a6f7c" })));
    // chalkboard (painted frame), banner, calendar board
    const bd = lam("goalBoard", () => ({ map: boardTex() }));
    const bz = BOARD.z - 0.03;
    fit.add(quad(V(BOARD.x1, BOARD.y0, bz), V(BOARD.x0, BOARD.y0, bz), V(BOARD.x0, BOARD.y1, bz), V(BOARD.x1, BOARD.y1, bz)), bd);
    fit.add(boxGeo(V(BOARD.x0, BOARD.y0 - 0.1, bz - 0.12), V(BOARD.x1, BOARD.y0, bz)), lam("chalkLedge", () => ({ color: "#7a4a2c" })));
    const bn = lam("gr8Banner", () => ({ map: bannerTex(), alphaTest: 0.5, transparent: false }));
    const bcx = (BOARD.x0 + BOARD.x1) / 2;
    fit.add(quad(V(bcx + 3.0, D0 + 3.85, IN.z1 - 0.04), V(bcx - 3.0, D0 + 3.85, IN.z1 - 0.04), V(bcx - 3.0, D0 + 4.32, IN.z1 - 0.04), V(bcx + 3.0, D0 + 4.32, IN.z1 - 0.04)), bn);
    fit.add(boxGeo(V(CAL[0] - 0.33, CAL[1] - 0.44, CAL[2] - 0.03), V(CAL[0] + 0.33, CAL[1] + 0.44, CAL[2])), lam("calBack", () => ({ color: "#3a2f36" })));
    // lobby dressing: potted plants at the counter ends, a bench by the window, rope posts
    const pot = lam("pot", () => ({ color: "#b8684a" }));
    for (const [px, pz] of [[36.7, 42.4], [49.0, 42.4], [35.0, 37.6], [49.0, 37.6]] as const) {
      fit.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 16), pot, new THREE.Matrix4().makeTranslation(px, y0 + 0.25, pz));
      prop(fit, {}, "plant_bushLarge", px, y0 + 0.45, pz, 1.1, px);
    }
    for (const px of [44.4, 47.2]) {
      fit.add(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 10), M.brass, new THREE.Matrix4().makeTranslation(px, y0 + 0.47, 41.3));
      fit.add(new THREE.SphereGeometry(0.06, 12, 8), M.brass, new THREE.Matrix4().makeTranslation(px, y0 + 0.97, 41.3));
      fit.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), M.brass, new THREE.Matrix4().makeTranslation(px, y0 + 0.03, 41.3));
    }
    fit.add(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 10).rotateZ(Math.PI / 2), lam("rope", () => ({ color: "#a8242c" })), new THREE.Matrix4().makeTranslation(45.8, y0 + 0.82, 41.3));
  }

  /** the porch house along the quay (front door at x HOUSE.x), its doormat and two bushes */
  private buildPorch(b: Batch) {
    house(b, HOUSE.x, HOUSE.z, Math.PI, HOUSE.w, HOUSE.d, HOUSE.h, 0);
    const mt = lam("doormat", () => ({ map: matTex() }));
    const my = D0 + 0.016; // reads from the street: bottom-left of the text at the near, +x corner
    b.add(quad(V(MAT[0] + 0.55, my, MAT[2] - 0.32), V(MAT[0] - 0.55, my, MAT[2] - 0.32), V(MAT[0] - 0.55, my, MAT[2] + 0.32), V(MAT[0] + 0.55, my, MAT[2] + 0.32)), mt);
    for (const dx of [-1.55, 1.55]) prop(b, {}, "plant_bush", HOUSE.x + dx, D0, 35.9, 1.0, dx);
  }

  /** the vegetable patch: a raised bed of soil, three rows of lettuces, a white picket fence behind */
  private buildGarden(b: Batch) {
    const { x0, x1, z0, z1 } = GARDEN;
    const soil = lam("soil", () => ({ map: soilTex() }));
    b.add(boxGeo(V(x0, D0, z0), V(x1, D0 + 0.16, z1)), soil);
    const plank = lam("bedPlank", () => ({ color: "#9a6a42" }));
    b.add(boxGeo(V(x0 - 0.06, D0, z0 - 0.06), V(x1 + 0.06, D0 + 0.2, z0)), plank);
    b.add(boxGeo(V(x0 - 0.06, D0, z1), V(x1 + 0.06, D0 + 0.2, z1 + 0.06)), plank);
    for (const x of [x0 - 0.06, x1]) b.add(boxGeo(V(x, D0, z0), V(x + 0.06, D0 + 0.2, z1)), plank);
    const leaf = [lam("lettuceA", () => ({ color: "#7cc35a" })), lam("lettuceB", () => ({ color: "#5faa4a" }))];
    const g = new THREE.SphereGeometry(0.15, 14, 10); g.scale(1, 0.62, 1);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const x = x0 + 0.3 + i * ((x1 - x0 - 0.6) / 5), z = z0 + 0.35 + r * ((z1 - z0 - 0.7) / 2);
      if (r === 2 && (i === 1 || i === 2)) continue; // the kid's spot: weeds go here
      b.add(g, leaf[(r + i) % 2], new THREE.Matrix4().makeTranslation(x, D0 + 0.2, z));
    }
    const white = lam("picket", () => ({ color: "#f4efe4" }));
    for (let x = x0 - 0.9; x <= x1 + 0.9; x += 0.22) b.add(boxGeo(V(x - 0.045, D0, z0 - 0.85), V(x + 0.045, D0 + 0.95, z0 - 0.8)), white);
    for (const y of [0.3, 0.75]) b.add(boxGeo(V(x0 - 0.95, D0 + y, z0 - 0.88), V(x1 + 0.95, D0 + y + 0.07, z0 - 0.85)), white);
  }

  /** the card tower: one instanced card per level, drawn up to towerN(f); after COLLAPSE they fly and land */
  private buildCards(R: THREE.Object3D) {
    const mat = lam("card8", () => ({ map: cardTex() }));
    const g = new THREE.BoxGeometry(0.34, CARD_H * 0.9, 0.215);
    this.cards = new THREE.InstancedMesh(g, mat, 200);
    this.cards.castShadow = true; this.cards.receiveShadow = true; this.cards.frustumCulled = false;
    this.cards.count = 0;
    R.add(this.cards);
  }
  private poseCards(id: number, f: number) {
    const C = this.cards, d = this.dummy;
    const interior = [1, 4, 5, 6, 7, 9, 10].includes(id);
    if (!interior) { C.count = 0; return; }
    const n = Math.min(200, towerN(Math.min(f, COLLAPSE - 1)));
    const t = Math.max(0, (f - COLLAPSE) / FPS);
    for (let i = 0; i < n; i++) {
      const y0 = TOWER[1] + (i + 0.5) * CARD_H;
      const jx = (hash(i, 1) - 0.5) * 0.03 + 0.012 * Math.sin(i * 0.37), jz = (hash(i, 2) - 0.5) * 0.03, jr = (hash(i, 3) - 0.5) * 0.18;
      // a slight wobble once the tower is tall
      const sway = Math.max(0, n - 120) / 80 * 0.012 * Math.sin(f * 0.21) * (i / n);
      if (f < COLLAPSE) {
        d.position.set(TOWER[0] + jx + sway, y0, TOWER[2] + jz); d.rotation.set(0, jr, 0);
      } else {
        const th = hash(i, 4) * Math.PI * 2, hgt = (y0 - TOWER[1]) / 2.7;
        const sp = 0.6 + 2.4 * hash(i, 5) * (0.3 + hgt), vy = 0.4 + 1.6 * hash(i, 6);
        let vx = Math.cos(th) * sp, vz = Math.sin(th) * sp * 0.8 - 0.6 * hgt;
        const x0 = TOWER[0] + jx, z0 = TOWER[2] + jz;
        // landing: floor, or the counter top if it lands over the counter
        const fall = (yl: number) => { const a = 4.9, bq = vy, c = y0 - yl; return (bq + Math.sqrt(bq * bq + 4 * a * c)) / (2 * a); };
        let tl = fall(D0 + 0.012);
        const xl = x0 + vx * tl, zl = z0 + vz * tl;
        if (xl > COUNTER.x0 && xl < COUNTER.x1 && zl > COUNTER.z0 && zl < COUNTER.z1) tl = fall(CY + 0.012);
        if (z0 + vz * tl > IN.z1 - 0.2 || z0 + vz * tl < IN.z0 + 0.3) vz *= 0.3;
        const tt = Math.min(t, tl), landed = t >= tl;
        d.position.set(x0 + vx * tt, y0 + vy * tt - 4.9 * tt * tt, z0 + vz * tt);
        if (landed) d.rotation.set(0, jr + hash(i, 7) * 6, 0);
        else d.rotation.set(tt * (6 + 8 * hash(i, 8)), jr + tt * 3, tt * (4 + 6 * hash(i, 9)));
      }
      d.scale.set(1, 1, 1); d.updateMatrix();
      C.setMatrixAt(i, d.matrix);
    }
    C.count = n;
    C.instanceMatrix.needsUpdate = true;
  }

  /** iron railing around the bank: 2 m panels (bars with spear tips, two rails, a post with a ball) that rise */
  private buildFence(R: THREE.Object3D, M: Mats) {
    const { x0, x1, z0, z1, h } = FENCE;
    const path: [number, number][] = [[42, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0], [42, z0]];
    const segs: { a: [number, number]; b: [number, number]; s: number }[] = [];
    let acc = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2));
      for (let k = 0; k < n; k++) {
        const u0 = k / n, u1 = (k + 1) / n;
        segs.push({ a: [ax + (bx - ax) * u0, az + (bz - az) * u0], b: [ax + (bx - ax) * u1, az + (bz - az) * u1], s: acc + L * (u0 + u1) / 2 });
      }
      acc += L;
    }
    const half = acc / 2;
    for (const sg of segs) {
      const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]), pb = new Batch();
      for (let u = 0.08; u < L - 0.02; u += 0.16) {
        pb.add(boxGeo(V(u - 0.018, 0, -0.018), V(u + 0.018, h - 0.12, 0.018)), M.iron);
        pb.add(new THREE.ConeGeometry(0.045, 0.16, 4), M.iron, new THREE.Matrix4().makeTranslation(u, h - 0.06, 0));
      }
      for (const y of [0.22, h - 0.35]) pb.add(boxGeo(V(0, y, -0.03), V(L, y + 0.06, 0.03)), M.iron);
      pb.add(boxGeo(V(-0.06, 0, -0.06), V(0.06, h + 0.05, 0.06)), M.iron);
      pb.add(new THREE.SphereGeometry(0.09, 12, 8), M.gold, new THREE.Matrix4().makeTranslation(0, h + 0.12, 0));
      const grp = new THREE.Group();
      pb.build(grp);
      grp.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.matrixAutoUpdate = true; m.castShadow = true; } });
      grp.position.set(sg.a[0], D0, sg.a[1]);
      grp.rotation.y = -Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0]);
      grp.visible = false;
      const c = Math.min(sg.s, 2 * half - sg.s) / half;
      this.fence.push({ m: grp, c });
      R.add(grp);
    }
  }

  /** monitor screens + the wall calendar's pages (textures swapped per frame) */
  private buildScreens(R: THREE.Object3D) {
    for (const m of MONITORS) {
      const mat = new THREE.MeshBasicMaterial({ map: screenTex(0, 0), toneMapped: true });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.355), mat);
      mesh.position.set(m[0], CY + 0.36, m[2] - 0.045); mesh.rotation.y = Math.PI;
      this.screens.push({ m: mesh, mat }); R.add(mesh);
    }
    const page = () => new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.7), new THREE.MeshLambertMaterial({ map: calTex(14) }));
    this.calPage = page(); this.calPage.position.set(CAL[0], CAL[1], CAL[2] - 0.04); this.calPage.rotation.y = Math.PI;
    this.calPivot = new THREE.Group(); this.calPivot.position.set(CAL[0], CAL[1] + 0.35, CAL[2] - 0.05);
    this.calOld = page(); this.calOld.position.set(0, -0.35, 0); this.calOld.rotation.y = Math.PI;
    this.calPivot.add(this.calOld);
    R.add(this.calPage, this.calPivot);
  }
  private poseScreens(id: number, f: number) {
    // which monitor shows what: [index, mode, count]
    const set = (i: number, mode: number, n = 0) => { const s = this.screens[i]; const t = screenTex(mode, n); if (s.mat.map !== t) { s.mat.map = t; s.mat.needsUpdate = true; } };
    for (let i = 0; i < this.screens.length; i++) set(i, 0);
    if (id === 6) set(1, f < 600 ? 0 : 1, 41 + Math.max(0, Math.floor((f - 600) / 22)));
    if (id === 1 || id === 4 || id === 5 || id === 9 || id === 10) { set(0, 1, 37); set(1, 1, 52); set(2, 1, 44); }
    if (id === 7) set(0, f < 728 ? 1 : f < 754 ? 2 : 3, 88);
    // calendar: flips through the days in shot 9
    const day = id < 9 ? 14 : id > 9 ? 31 : 14 + Math.max(0, Math.min(17, Math.floor((f - 872) / 2)));
    const prev = Math.max(14, day - 1), flip = id === 9 && f >= 872 && f < 872 + 34 ? ((f - 872) % 2) / 2 : -1;
    const pm = this.calPage.material as THREE.MeshLambertMaterial, om = this.calOld.material as THREE.MeshLambertMaterial;
    const tp = calTex(day), to = calTex(prev);
    if (pm.map !== tp) { pm.map = tp; pm.needsUpdate = true; }
    if (om.map !== to) { om.map = to; om.needsUpdate = true; }
    this.calOld.visible = flip >= 0;
    this.calPivot.rotation.x = flip >= 0 ? -(0.3 + flip * 2.2) : 0;
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12) * 2;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- river ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    for (const sm of this.smoke) {
      const u = (t * 0.11 + sm.k) % 1, sz = 3 + u * 9;
      sm.m.position.set(sm.top[0] - u * 18, sm.top[1] + u * 13 + u * u * 4, sm.top[2] + u * 3);
      sm.m.scale.set(sz, sz, 1); sm.m.quaternion.copy(cam.quaternion);
      sm.mat.opacity = 0.85 * (1 - u) ** 1.2;
    }
    // ---- this film's moving sets ----
    this.poseCards(id, f);
    for (const p of this.fence) {
      const k = id >= 15 ? fenceUp(id === 16 ? 9999 : f, p.c) : 0;
      p.m.visible = k > 0.001;
      p.m.scale.set(1, Math.max(0.001, k), 1);
    }
    this.poseScreens(id, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, f, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

/** horizontal quad facing up at height D0 + dy covering x0..x1, z0..z1 (z0 < z1) */
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
/** embankment wall from the river bed to the bank top at z, facing +z (dir 1) or -z (dir -1) */
function wallQuad(x0: number, x1: number, z: number, dir: number) {
  const g = new THREE.BufferGeometry(), y0 = -0.6, y1 = D0;
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, dir]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4, v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
