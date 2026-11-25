// The river town at night in the rain, with this film's set on the far bank: a street, a 1960s brick building with fire
// escapes and lit windows, apartment 4B on the fourth floor (kitchen, hallway, front door) and the building corridor.
// Practical lights are real three.js point/spot lights (shade.ts keeps their contribution: uPract). update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, rbox, shiny, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, FZ, BLD, FLOOR, KIT, HALL, CORR, WIN, DOOR, OVEN, TABLE, PHONE_T, LAMPS, STREET,
  phoneUI, flickerAt, PHONE_OFF, CORR_OFF, STREET_OFF,
} from "./story";
import { CARD_K } from "./cardshade";

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
// per-shot key: direction relative to the camera (imitating the motivating practical) and its colour (lit), plus the
// character-card gain (cards are normalised bright; night shots pull them down)
type Key3 = { az?: number; el?: number; lit?: [number, number, number]; card?: number; pract?: number };
const COOL: [number, number, number] = [0.42, 0.52, 0.78], PHN: [number, number, number] = [0.55, 0.68, 0.95], GRN: [number, number, number] = [0.22, 0.5, 0.32], ORG: [number, number, number] = [0.75, 0.42, 0.2];
const SUN_SHOT: Record<number, Key3> = {
  1: { az: 200, el: 40, lit: [0.3, 0.34, 0.5], card: 0.7, pract: 2.2 }, 2: { az: 30, el: 25, lit: ORG, card: 0.62 }, 3: { az: 175, el: 14, lit: PHN, card: 0.78 },
  4: { az: 160, el: 20, lit: PHN, card: 0.72 }, 5: { az: 170, el: 35, lit: PHN, card: 0.78 }, 6: { az: 150, el: 40, lit: COOL, card: 0.7 },
  7: { az: 40, el: 25, lit: ORG, card: 0.66 }, 8: { az: 200, el: 18, lit: GRN, card: 0.6 }, 9: { az: 175, el: 16, lit: PHN, card: 0.76 },
  10: { az: 170, el: 20, lit: GRN, card: 0.6 }, 11: { az: 30, el: 30, lit: ORG, card: 0.55 }, 12: { az: 190, el: 14, lit: GRN, card: 0.55 },
  13: { az: 180, el: 15, lit: GRN, card: 0.58 }, 14: { az: 160, el: 12, lit: [0.7, 0.72, 0.75], card: 0.7 }, 15: { az: 180, el: 40, lit: [0.5, 0.5, 0.48], card: 0.6 },
  16: { az: 0, el: 25, lit: [0.14, 0.16, 0.2], card: 0.55, pract: 3.2 }, 17: { az: 190, el: 18, lit: GRN, card: 0.55 }, 18: { az: 160, el: 20, lit: PHN, card: 0.5 },
  19: { az: 178, el: 12, lit: PHN, card: 0.78 }, 20: { az: 180, el: 10, lit: PHN, card: 0.78 }, 21: { az: 175, el: 12, lit: PHN, card: 0.74 },
  22: { az: 180, el: 14, lit: PHN, card: 0.7 }, 23: { az: 180, el: 14, lit: [0.05, 0.05, 0.08], card: 0.2 },
};
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
});

// ---------------- painted textures for the sets ----------------
const txt = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string, w = 900, align: CanvasTextAlign = "center") => {
  g.font = `${w} ${px}px ${FONT}`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
const wallTex = (key: string, col: string, skirt: string, h: number) => ctex(key, 512, Math.round(h * 96), (g, r) => {
  const H = Math.round(h * 96);
  g.fillStyle = col; g.fillRect(0, 0, 512, H);
  for (let i = 0; i < 40; i++) {
    const x = r() * 512, y = r() * H, rad = 30 + r() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(0,0,0,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  }
  g.fillStyle = skirt; g.fillRect(0, H - 14, 512, 14);
});
const floorTex = (key: string, a: string, b: string, n: number, seam = "rgba(0,0,0,0.25)") => ctex(key, 1024, 1024, (g, r) => {
  const S = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = jit(r, (i + j) % 2 ? a : b, 0.04, 2, 0.08); g.fillRect(i * S, j * S, S, S); }
  g.fillStyle = seam;
  for (let k = 0; k <= n; k++) { g.fillRect(k * S - 2, 0, 4, 1024); g.fillRect(0, k * S - 2, 1024, 4); }
});
/** cave rock: lumpy browns with dark cracks */
/** where the phone (and its light) is while Mara holds it, per shot */
const HELD: Record<number, V3 | undefined> = {
  3: [303.85, FLOOR + 1.55, 54.0], 4: [303.85, FLOOR + 1.55, 54.0], 5: [304.0, FLOOR + 1.15, 54.15], 7: [304.15, FLOOR + 1.55, 54.3], 8: [302.75, FLOOR + 1.55, 55.5],
  19: [304.05, FLOOR + 1.55, 54.1], 20: [304.05, FLOOR + 1.55, 54.1], 21: [303.95, FLOOR + 1.55, 53.7], 22: [304.25, FLOOR + 1.55, 53.3], 23: [304.25, FLOOR + 1.55, 53.3],
};
const PXM = 50; // facade texture: pixels per metre
/** brick facade with a grid of sash windows (the 4B window is a real opening; the others are painted, some lit) */
const facadeTex = () => ctex("facade4B", 22 * PXM, Math.round(BLD.floors * BLD.fh * PXM) + 60, (g, r) => {
  const W = 22 * PXM, H = Math.round(BLD.floors * BLD.fh * PXM) + 60;
  g.fillStyle = "#5a2f26"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? -10 : 0; x < W; x += 20) { g.fillStyle = jit(r, "#7a3e30", 0.12, 4, 0.12); g.fillRect(x + 1, y + 1, 18, 6); }
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; const gr = g.createLinearGradient(x, y, x, y + 200); gr.addColorStop(0, "rgba(10,10,14,0.35)"); gr.addColorStop(1, "rgba(10,10,14,0)"); g.fillStyle = gr; g.fillRect(x, y, 18 + r() * 20, 200); }
  const cols = [4.3, 7.2, 10.1, 13.0, 15.9, 18.8];
  for (let k = 0; k < BLD.floors; k++) for (const [ci, cx] of cols.entries()) {
    if (k === 3 && ci === 2) continue;
    const x0 = (cx - 0.7) * PXM, y1 = H - (k * BLD.fh + 0.95) * PXM, y0 = H - (k * BLD.fh + 2.45) * PXM;
    g.fillStyle = "#c9bfae"; g.fillRect(x0 - 6, y1, 1.4 * PXM + 12, 8);
    const lit = r() < 0.3, warm = r() < 0.7;
    g.fillStyle = lit ? (warm ? "#ffcf7a" : "#a8c8ff") : "#14161c"; g.fillRect(x0, y0, 1.4 * PXM, 1.5 * PXM);
    if (lit) { g.fillStyle = "rgba(60,30,20,0.45)"; g.fillRect(x0, y0, 1.4 * PXM * (0.3 + 0.4 * r()), 1.5 * PXM); }
    g.strokeStyle = "#e8e2d2"; g.lineWidth = 4; g.strokeRect(x0, y0, 1.4 * PXM, 1.5 * PXM); g.beginPath(); g.moveTo(x0, (y0 + y1) / 2); g.lineTo(x0 + 1.4 * PXM, (y0 + y1) / 2); g.stroke();
  }
  g.fillStyle = "#3a2420"; g.fillRect(0, 0, W, 30);
});
const lit2 = (key: string, seed: number) => ctex(key, 512, 1024, (g, r) => {
  g.fillStyle = "#2a2224"; g.fillRect(0, 0, 512, 1024);
  for (let y = 0; y < 1024; y += 64) for (let x = 0; x < 512; x += 64) { const on = r() < 0.22 + 0.0 * seed; g.fillStyle = on ? (r() < 0.7 ? "#ffd08a" : "#9fc0ff") : "#101218"; g.fillRect(x + 14, y + 12, 36, 44); }
});
const asphaltTex = () => ctex("asphalt", 1024, 1024, (g, r) => {
  g.fillStyle = "#1a1c20"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.2)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 4); }
  g.fillStyle = "#c9b86a"; for (let x = 0; x < 1024; x += 256) g.fillRect(x, 500, 140, 14);
});
const tileTex = () => floorTex("kitTile", "#a9bfa8", "#9fb59e", 8, "rgba(80,95,80,0.55)");
const boardsTex = () => ctex("oakBoards", 512, 512, (g, r) => {
  for (let y = 0; y < 512; y += 32) { g.fillStyle = jit(r, "#6a4a32", 0.1, 4, 0.1); g.fillRect(0, y, 512, 32); g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(0, y, 512, 2); for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(r() * 512, y + 4 + r() * 24, 60 + r() * 120, 1.5); } const j = r() * 512; g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(j, y, 2, 32); }
});
const paperTex = (h: number) => ctex("wallpaper", 256, Math.round(h * 96), (g, r) => {
  const H = Math.round(h * 96); g.fillStyle = "#6f6c50"; g.fillRect(0, 0, 256, H);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "#7d7a5a"; g.fillRect(x, 0, 14, H); g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x + 16, 0, 3, H); }
  for (let i = 0; i < 30; i++) { const x = r() * 256, y = r() * H, rad = 20 + r() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(40,30,10,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); }
  g.fillStyle = "#3a2a1e"; g.fillRect(0, H - 14, 256, 14);
});
const paintTex = (key: string, col: string, h: number) => ctex(key, 256, Math.round(h * 96), (g, r) => {
  const H = Math.round(h * 96); g.fillStyle = col; g.fillRect(0, 0, 256, H);
  for (let i = 0; i < 40; i++) { const x = r() * 256, y = r() * H, rad = 10 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(0,0,0,0.03)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); }
  g.fillStyle = "#e8e2d2"; g.fillRect(0, H - 10, 256, 10);
});
const carpetTex = () => ctex("carpet", 256, 256, (g, r) => { g.fillStyle = "#4a3026"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,200,150,0.06)" : "rgba(0,0,0,0.15)"; g.fillRect(r() * 256, r() * 256, 2, 2); } g.strokeStyle = "rgba(120,80,50,0.5)"; g.lineWidth = 6; g.strokeRect(20, 0, 216, 256); });
const doorTex = () => ctex("door4B", 256, 512, (g) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "#1f3328"; g.lineWidth = 8; g.strokeRect(30, 40, 196, 180); g.strokeRect(30, 260, 196, 210);
  g.fillStyle = "rgba(200,200,180,0.25)"; for (let i = 0; i < 12; i++) g.fillRect(i * 22 % 250, (i * 97) % 500, 8, 4);
  g.fillStyle = "#c9a04a"; g.font = "900 40px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.fillText("4B", 128, 140);
  g.beginPath(); g.arc(128, 100 - 40, 7, 0, 7); g.fill();
});
const doorPlain = (key: string, col: string, num: string) => ctex(key, 256, 512, (g) => { g.fillStyle = col; g.fillRect(0, 0, 256, 512); g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 8; g.strokeRect(30, 40, 196, 180); g.strokeRect(30, 260, 196, 210); g.fillStyle = "#c9a04a"; g.font = "900 40px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.fillText(num, 128, 140); g.beginPath(); g.arc(210, 280, 9, 0, 7); g.fill(); });
const cabTex = () => ctex("cabinet", 256, 256, (g) => { g.fillStyle = "#cfc6a8"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#8a8064"; g.lineWidth = 6; g.strokeRect(14, 14, 100, 228); g.strokeRect(142, 14, 100, 228); g.fillStyle = "#8a8a90"; g.fillRect(100, 110, 8, 36); g.fillRect(148, 110, 8, 36); });
/** rain droplets on glass (alpha), tiled; the world scrolls it down */
const dropsTex = () => ctex("drops", 256, 512, (g, r) => {
  g.clearRect(0, 0, 256, 512);
  for (let i = 0; i < 160; i++) { const x = r() * 256, y = r() * 512, s = 0.8 + r() * 2.2; g.fillStyle = "rgba(220,235,255,0.55)"; g.beginPath(); g.ellipse(x, y, s, s * 1.3, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.8)"; g.fillRect(x - s * 0.4, y - s * 0.6, 1.5, 1.5); }
  for (let i = 0; i < 14; i++) { const x = r() * 256; g.strokeStyle = "rgba(220,235,255,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, r() * 200); g.lineTo(x + (r() - 0.5) * 10, 300 + r() * 212); g.stroke(); }
});
const rainTex = () => ctex("rainSheet", 256, 512, (g, r) => { g.clearRect(0, 0, 256, 512); for (let i = 0; i < 220; i++) { const x = r() * 256, y = r() * 512, l = 20 + r() * 50; g.strokeStyle = `rgba(200,215,240,${0.15 + r() * 0.35})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + l); g.stroke(); } });
const coneTex = () => ctex("lampCone", 128, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,170,90,0.55)"); gr.addColorStop(1, "rgba(255,170,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 256); });
const stripTex = () => ctex("underStrip", 64, 128, (g) => { const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(0.25, "rgba(255,250,235,0.55)"); gr.addColorStop(1, "rgba(255,250,235,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); });
/** the oven's green segment clock */
const clockTex = (t: string) => ctex("ovenClock" + t, 256, 96, (g) => { g.fillStyle = "#020803"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#5dff8f"; g.font = "700 72px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 128, 50); });
/** the phone screen UI */
const screenTex = (state: string) => ctex("screen" + state, 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0a1830"); gr.addColorStop(1, "#1d3a6a"); g.fillStyle = state === "off" ? "#000000" : gr; g.fillRect(0, 0, 256, 512);
  if (state === "off") return;
  g.textAlign = "center"; g.fillStyle = "#e8f0ff";
  if (state === "lock" || state === "lock2") {
    g.font = "200 84px 'Inter Display', Inter, sans-serif"; g.fillText(state === "lock" ? "3:12" : "3:21", 128, 130);
    g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.roundRect(18, 230, 220, 120, 18); g.fill();
    g.fillStyle = "#ffffff"; g.font = "800 22px 'Inter Display', Inter, sans-serif"; g.fillText("1 NEW VOICEMAIL", 128, 272);
    g.font = "600 24px 'Inter Display', Inter, sans-serif"; g.fillStyle = "#ffd23f"; g.fillText("Mara (mobile)", 128, 312);
  } else {
    g.font = "800 24px 'Inter Display', Inter, sans-serif"; g.fillText("Mara (mobile)", 128, 120);
    g.fillStyle = "#ff6a6a"; g.font = "900 30px 'Inter Display', Inter, sans-serif"; g.fillText("TOMORROW", 128, 190);
    g.fillStyle = "#e8f0ff"; g.font = "600 26px 'Inter Display', Inter, sans-serif"; g.fillText("3:20 AM", 128, 228);
    g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(30, 330, 196, 6); g.fillStyle = "#4aa8ff"; g.fillRect(30, 330, 90, 6);
    g.beginPath(); g.moveTo(112, 380); g.lineTo(112, 430); g.lineTo(152, 405); g.closePath(); g.fillStyle = "#ffffff"; g.fill();
  }
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
  private Ls: THREE.PointLight[] = []; private Lp!: THREE.PointLight; private Lo!: THREE.PointLight; private Lw!: THREE.SpotLight; private Lc!: THREE.PointLight; private Lu!: THREE.PointLight;
  private rain!: THREE.Texture; private drops!: THREE.Texture; private beacon!: THREE.Mesh; private clock!: THREE.Mesh; private tube!: THREE.Mesh; private strip!: THREE.Mesh;
  private chain!: THREE.Group; private phone!: THREE.Group; private screen!: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

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
    b.build(R);
    R.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material === M.grass) m.castShadow = false; }); // the sewers lie underneath
    this.buildSets(M);
    buildTown(R, kit, sightLines());

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

  // ---------------- the sets ----------------
  /** a room seen from inside: floor, four inner walls, a ceiling (no shadows from the shell) */
  private room(sh: Batch, R: Room, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material, tile = 4) {
    const { x0, x1, z0, z1, h } = R, y0 = D0, y1 = D0 + h, W = (a: number) => a / 4;
    sh.add(quadUp(x0, x1, z0, z1, (x1 - x0) / tile, (z1 - z0) / tile, 0.012), floor);
    sh.add(quad(V(x1, y0, z1), V(x0, y0, z1), V(x0, y1, z1), V(x1, y1, z1), W(x1 - x0), 1), wall);
    sh.add(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y1, z0), V(x0, y1, z0), W(x1 - x0), 1), wall);
    sh.add(quad(V(x0, y0, z1), V(x0, y0, z0), V(x0, y1, z0), V(x0, y1, z1), W(z1 - z0), 1), wall);
    sh.add(quad(V(x1, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x1, y1, z0), W(z1 - z0), 1), wall);
    sh.add(quad(V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)), ceil);
  }

  private buildSets(M: Mats) {
    const sh = new Batch(), fit = new Batch(), F = FLOOR;
    // wall pieces with inward normals: z-walls facing +z (dir 1) / -z (dir -1), x-walls facing +x / -x
    const zW = (b: Batch, m: THREE.Material, x0: number, x1: number, y0: number, y1: number, z: number, dir: number, uv: [number, number, number, number] = [0, 0, (x1 - x0) / 3, (y1 - y0) / 3]) =>
      b.add(dir > 0 ? quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z), uv[2], uv[3], uv[0], uv[1]) : quad(V(x1, y0, z), V(x0, y0, z), V(x0, y1, z), V(x1, y1, z), uv[2], uv[3], uv[0], uv[1]), m);
    const xW = (b: Batch, m: THREE.Material, z0: number, z1: number, y0: number, y1: number, x: number, dir: number, uv: [number, number, number, number] = [0, 0, (z1 - z0) / 3, (y1 - y0) / 3]) =>
      b.add(dir > 0 ? quad(V(x, y0, z1), V(x, y0, z0), V(x, y1, z0), V(x, y1, z1), uv[2], uv[3], uv[0], uv[1]) : quad(V(x, y0, z0), V(x, y0, z1), V(x, y1, z1), V(x, y1, z0), uv[2], uv[3], uv[0], uv[1]), m);
    const ceil = (b: Batch, m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y: number) => b.add(quad(V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1)), m);
    const iron = shiny("hIron", "#1c1d22", "#6a6e78", 40);
    const glowM = (r: number, g: number, b2: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b2) });
    const glowAt = (p: V3, rad: number, m: THREE.Material) => { const x = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), m); x.position.set(...p); x.layers.set(NOINK); this.root.add(x); return x; };
    // ---------------- the street ----------------
    const asphalt = shiny("asphalt", "#2a2c32", "#ffb070", 30);
    (asphalt as unknown as THREE.MeshPhongMaterial).map = rep(asphaltTex(), 4, 4);
    sh.add(quadUp(270, 342, 38, 49, 6, 1, 0.01), asphalt);
    const pave = shiny("hPave", "#4a4a50", "#a0a0a8", 20);
    fit.add(rbox(V(270, D0 - 0.2, 49), V(342, D0 + 0.15, 52), 0.03), pave);
    fit.add(rbox(V(270, D0 - 0.2, 35.5), V(342, D0 + 0.15, 38), 0.03), pave);
    for (const [x, z, w, d] of [[297, 45, 2.4, 1.2], [309, 41.5, 1.8, 0.9], [289, 40.2, 2.6, 1.0]] as const) sh.add(quadUp(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 1, 1, 0.014), shiny("puddle", "#0c0e14", "#ffffff", 120));
    sh.add(quadUp(299.5, 300.5, 43.5, 44.5, 1, 1, 0.015), iron);
    const lampHead = glowM(3.2, 1.9, 0.8), coneM = new THREE.MeshBasicMaterial({ map: coneTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    for (const l of LAMPS) {
      fit.add(new THREE.CylinderGeometry(0.07, 0.1, 4.6, 10), iron, new THREE.Matrix4().makeTranslation(l[0], D0 + 0.15 + 2.3, l[2]));
      fit.add(rbox(V(l[0] - 0.05, D0 + 4.6, l[2] - 0.05), V(l[0] + 0.05, D0 + 4.7, l[2] - 1.2), 0.02), iron);
      fit.add(new THREE.ConeGeometry(0.32, 0.25, 12, 1, true), iron, new THREE.Matrix4().makeTranslation(l[0], D0 + 4.7, l[2] - 1.2));
      glowAt([l[0], D0 + 4.56, l[2] - 1.2], 0.14, lampHead);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.4, 24, 1, true), coneM); cone.position.set(l[0], D0 + 4.6 - 2.2, l[2] - 1.2); cone.layers.set(NOINK); cone.renderOrder = 3; this.root.add(cone);
      const L = new THREE.PointLight("#ffb060", 0, 18, 2); L.position.set(l[0], D0 + 4.4, l[2] - 1.2); this.root.add(L); this.Ls.push(L);
    }
    // a parked car
    const carM = shiny("car", "#1f3a32", "#ffffff", 80), glass = shiny("carGlass", "#0c1018", "#ffffff", 100);
    fit.add(rbox(V(306.8, D0 + 0.35, 46.9), V(311.2, D0 + 1.15, 48.6), 0.25), carM);
    fit.add(rbox(V(307.8, D0 + 1.05, 47.05), V(310.2, D0 + 1.7, 48.45), 0.22), glass);
    for (const x of [307.6, 310.4]) for (const z of [46.85, 48.65]) fit.add(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16).rotateX(Math.PI / 2), shiny("tyre", "#111114", "#444444", 20), new THREE.Matrix4().makeTranslation(x, D0 + 0.33, z));
    // ---------------- the building: facade with the 4B opening, sides, back, roof ----------------
    const fac = lam("facade4B", () => ({ map: facadeTex() })), Hm = (BLD.floors * BLD.fh * PXM + 60) / PXM;
    const uvF = (x0: number, x1: number, y0: number, y1: number): [number, number, number, number] => [(BLD.x1 - x1) / 22, (y0 - D0) / Hm, (BLD.x1 - x0) / 22, (y1 - D0) / Hm];
    const top = D0 + Hm, wy0 = F + WIN.y0, wy1 = F + WIN.y1;
    for (const [x0, x1, y0, y1] of [[BLD.x0, WIN.x0, D0, top], [WIN.x1, BLD.x1, D0, top], [WIN.x0, WIN.x1, D0, wy0], [WIN.x0, WIN.x1, wy1, top]] as const) zW(fit, fac, x0, x1, y0, y1, FZ, -1, uvF(x0, x1, y0, y1));
    const brickM = lam("sideBrick", () => ({ color: "#4a2a24" }));
    xW(fit, brickM, FZ, BLD.z1, D0, top, BLD.x0, -1); xW(fit, brickM, FZ, BLD.z1, D0, top, BLD.x1, 1); zW(fit, brickM, BLD.x0, BLD.x1, D0, top, BLD.z1, 1);
    fit.add(rbox(V(BLD.x0 - 0.2, top - 0.1, FZ - 0.25), V(BLD.x1 + 0.2, top + 0.6, BLD.z1), 0.05), lam("parapet", () => ({ color: "#2e1c18" })));
    // window reveal, frame, sill, glass + rain drops
    const frameM = shiny("winFrame", "#1a1a1e", "#666666", 30);
    for (const [x0, x1, y0, y1] of [[WIN.x0 - 0.06, WIN.x0, wy0, wy1], [WIN.x1, WIN.x1 + 0.06, wy0, wy1], [WIN.x0 - 0.06, WIN.x1 + 0.06, wy1, wy1 + 0.06], [WIN.x0 - 0.06, WIN.x1 + 0.06, wy0 - 0.06, wy0], [303.4 + 0.67, 303.4 + 0.73, wy0, wy1], [WIN.x0, WIN.x1, (wy0 + wy1) / 2 - 0.03, (wy0 + wy1) / 2 + 0.03]] as const)
      fit.add(rbox(V(x0, y0, FZ - 0.04), V(x1, y1, KIT.z0), 0.01), frameM);
    fit.add(rbox(V(WIN.x0 - 0.15, wy0 - 0.12, FZ - 0.18), V(WIN.x1 + 0.15, wy0 - 0.02, KIT.z0 + 0.12), 0.02), lam("sill", () => ({ color: "#c9bfae" })));
    const glassM = new THREE.MeshPhongMaterial({ color: "#0b1220", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.32, depthWrite: false });
    const g1 = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, wy1 - wy0), glassM); g1.position.set((WIN.x0 + WIN.x1) / 2, (wy0 + wy1) / 2, FZ + 0.12); g1.layers.set(NOINK); g1.renderOrder = 4; this.root.add(g1);
    const dt = dropsTex(); dt.wrapS = dt.wrapT = THREE.RepeatWrapping; dt.repeat.set(3.5, 3.5); this.drops = dt;
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, wy1 - wy0), new THREE.MeshBasicMaterial({ map: dt, transparent: true, depthWrite: false, opacity: 0.45, color: new THREE.Color(0.7, 0.75, 0.85) }));
    dm.position.copy(g1.position); dm.position.z += 0.005; dm.layers.set(NOINK); dm.renderOrder = 5; this.root.add(dm);
    const dm2 = dm.clone(); dm2.position.z = FZ - 0.03; dm2.rotation.y = Math.PI; this.root.add(dm2);
    // fire escape (floors 1-5) at the right of the window column
    for (let k = 1; k < BLD.floors; k++) {
      const y = D0 + k * BLD.fh;
      fit.add(rbox(V(308.4, y - 0.05, FZ - 1.1), V(311.6, y, FZ), 0.01), iron);
      for (const [x0, x1, z0, z1] of [[308.4, 311.6, FZ - 1.12, FZ - 1.08], [308.38, 308.42, FZ - 1.1, FZ], [311.58, 311.62, FZ - 1.1, FZ]] as const) {
        fit.add(rbox(V(x0, y + 0.9, z0), V(x1, y + 0.95, z1), 0.005), iron);
        fit.add(rbox(V(x0, y + 0.45, z0), V(x1, y + 0.48, z1), 0.005), iron);
      }
      for (let x = 308.5; x < 311.6; x += 0.35) fit.add(rbox(V(x, y, FZ - 1.12), V(x + 0.02, y + 0.92, FZ - 1.08), 0.004), iron);
      const lad = new THREE.BoxGeometry(0.06, Math.hypot(BLD.fh, 2.4), 0.06); lad.rotateZ(Math.atan2(2.4, BLD.fh));
      fit.add(lad, iron, new THREE.Matrix4().makeTranslation(310.0, y - BLD.fh / 2, FZ - 0.6));
    }
    // ground-floor entrance with a lit transom
    fit.add(rbox(V(299.9, D0 + 0.15, FZ - 0.08), V(301.5, D0 + 2.4, FZ), 0.03), lam("entrDoor", () => ({ color: "#1e2a24" })));
    { const tr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.35), glowM(2.2, 1.6, 0.9)); tr.position.set(300.7, D0 + 2.65, FZ - 0.02); tr.rotation.y = Math.PI; tr.layers.set(NOINK); this.root.add(tr); }
    // neighbours and the skyline, with lit windows
    for (const [x0, x1, z0, z1, h, k] of [[268, 293.8, FZ + 0.4, 72, 17, 1], [316.2, 342, FZ + 0.6, 74, 24, 2], [282, 306, 82, 100, 34, 3], [308, 332, 78, 96, 29, 4]] as const) {
      fit.add(boxGeo(V(x0, D0, z0), V(x1, D0 + h, z1), 0), lam("nb" + k, () => ({ color: "#241c1e" })));
      const lw = lam("lit" + k, () => ({ map: rep(lit2("lit" + k, k), Math.round((x1 - x0) / 8), Math.round(h / 16)) }));
      zW(fit, lw, x0, x1, D0 + 0.5, D0 + h - 0.5, z0 - 0.02, -1, [0, 0, Math.round((x1 - x0) / 8), Math.round(h / 16)]);
    }
    { const bc = glowAt([320, D0 + 35, 92], 0.25, glowM(6, 0.4, 0.3)); this.beacon = bc; }
    // rain sheets (scrolling, additive)
    const rt = rainTex(); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(6, 3); this.rain = rt;
    const rm = new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.22, side: THREE.DoubleSide });
    for (const z of [39, 43, 47, 50.6]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(34, 26), rm); r.position.set(304, D0 + 12, z); r.layers.set(NOINK); r.renderOrder = 6; this.root.add(r); }
    // ---------------- apartment 4B ----------------
    const boards = lam("boards", () => ({ map: rep(boardsTex(), 1, 1) })), kpaint = lam("kitPaint", () => ({ map: paintTex("kitPaint", "#8fa39a", KIT.h) }));
    const wpaper = lam("wallpaper", () => ({ map: paperTex(HALL.h) })), ceilM = lam("ceil4B", () => ({ color: "#77746a" }));
    sh.add(quadUp(KIT.x0, KIT.x1, KIT.z0, KIT.z1, 1.6, 1.2, F - D0), boards); sh.add(quadUp(HALL.x0, HALL.x1, HALL.z0, HALL.z1, 0.5, 1.6, F - D0), boards);
    ceil(sh, ceilM, KIT.x0, KIT.x1, KIT.z0, KIT.z1, F + KIT.h); ceil(sh, ceilM, HALL.x0, HALL.x1, HALL.z0, HALL.z1, F + HALL.h);
    // kitchen walls (window wall with the hole; back wall with the hallway arch)
    for (const [x0, x1, y0, y1] of [[KIT.x0, WIN.x0, 0, KIT.h], [WIN.x1, KIT.x1, 0, KIT.h], [WIN.x0, WIN.x1, 0, WIN.y0], [WIN.x0, WIN.x1, WIN.y1, KIT.h]] as const) zW(sh, kpaint, x0, x1, F + y0, F + y1, KIT.z0, 1, [x0 / 3, y0 / KIT.h, x1 / 3, y1 / KIT.h]);
    zW(sh, kpaint, HALL.x1, KIT.x1, F, F + KIT.h, KIT.z1, -1, [0, 0, 1, 1]); zW(sh, kpaint, HALL.x0, HALL.x1, F + 2.1, F + KIT.h, KIT.z1, -1, [0, 0.8, 0.4, 1]);
    xW(sh, kpaint, KIT.z0, KIT.z1, F, F + KIT.h, KIT.x0, 1, [0, 0, 1, 1]); xW(sh, kpaint, KIT.z0, KIT.z1, F, F + KIT.h, KIT.x1, -1, [0, 0, 1, 1]);
    xW(fit, lam("kitTile", () => ({ map: rep(tileTex(), 3, 1) })), KIT.z0, KIT.z1, F + 0.92, F + 1.55, KIT.x0 + 0.005, 1, [0, 0, 1, 1]);
    // hallway walls + door wall with the door opening
    xW(sh, wpaper, HALL.z0, HALL.z1, F, F + HALL.h, HALL.x0, 1, [0, 0, 4, 1]); xW(sh, wpaper, HALL.z0, HALL.z1, F, F + HALL.h, HALL.x1, -1, [0, 0, 4, 1]);
    for (const [x0, x1, y0, y1] of [[HALL.x0, DOOR.x0, 0, HALL.h], [DOOR.x1, HALL.x1, 0, HALL.h], [DOOR.x0, DOOR.x1, DOOR.h, HALL.h]] as const) zW(sh, wpaper, x0, x1, F + y0, F + y1, HALL.z1, -1, [x0, 0, x1, 1]);
    // the front door (slightly raised: the corridor light leaks under it), peephole, chain, deadbolt, frame
    const doorM = lam("door4B", () => ({ map: doorTex() }));
    fit.add(rbox(V(DOOR.x0, F + 0.025, DOOR.z + 0.01), V(DOOR.x1, F + DOOR.h, DOOR.z + 0.13), 0.01), doorM);
    for (const [x0, x1, y0, y1] of [[DOOR.x0 - 0.07, DOOR.x0, 0, DOOR.h + 0.07], [DOOR.x1, DOOR.x1 + 0.07, 0, DOOR.h + 0.07], [DOOR.x0 - 0.07, DOOR.x1 + 0.07, DOOR.h, DOOR.h + 0.07]] as const) fit.add(rbox(V(x0, F + y0, DOOR.z - 0.03), V(x1, F + y1, DOOR.z + 0.15), 0.01), lam("doorFrame", () => ({ color: "#d8d0bc" })));
    const brass = shiny("brass", "#b8913a", "#fff0b0", 70);
    fit.add(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12).rotateX(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation((DOOR.x0 + DOOR.x1) / 2, F + 1.55, DOOR.z + 0.07));
    fit.add(new THREE.SphereGeometry(0.035, 12, 8), brass, new THREE.Matrix4().makeTranslation(DOOR.x1 - 0.12, F + 1.0, DOOR.z - 0.02));
    fit.add(rbox(V(DOOR.x1 - 0.16, F + 1.32, DOOR.z - 0.03), V(DOOR.x1 - 0.06, F + 1.42, DOOR.z), 0.01), brass);
    this.chain = new THREE.Group(); this.chain.position.set(DOOR.x1 - 0.12, F + 1.62, DOOR.z - 0.02); this.root.add(this.chain);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 4, 10), brass); l.position.set(-0.03 * i, -0.012 * Math.sin(i / 5 * Math.PI) * 4, 0); l.rotation.y = i % 2 ? Math.PI / 2 : 0; this.chain.add(l); }
    // the light under the door (additive strip) + the corridor
    this.strip = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.x1 - DOOR.x0, 0.6), new THREE.MeshBasicMaterial({ map: stripTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.4, 1.35, 1.2) }));
    this.strip.rotation.x = -Math.PI / 2; this.strip.position.set((DOOR.x0 + DOOR.x1) / 2, F + 0.004, DOOR.z - 0.29); this.strip.layers.set(NOINK); this.root.add(this.strip);
    const C = CORR, cream = lam("corrWall", () => ({ map: paintTex("corrWall", "#8e8672", C.h) }));
    sh.add(quadUp(C.x0, C.x1, C.z0, C.z1, 3, 1, F - D0), lam("carpet", () => ({ map: rep(carpetTex(), 4, 1) })));
    ceil(sh, lam("corrCeil", () => ({ color: "#bdb6a2" })), C.x0, C.x1, C.z0, C.z1, F + C.h);
    for (const [x0, x1, y0, y1] of [[C.x0, DOOR.x0, 0, C.h], [DOOR.x1, C.x1, 0, C.h], [DOOR.x0, DOOR.x1, DOOR.h, C.h]] as const) zW(sh, cream, x0, x1, F + y0, F + y1, C.z0, 1, [0, y0 / C.h, (x1 - x0) / 3, y1 / C.h]);
    zW(sh, cream, C.x0, C.x1, F, F + C.h, C.z1, -1, [0, 0, 4, 1]); xW(sh, cream, C.z0, C.z1, F, F + C.h, C.x0, 1, [0, 0, 1, 1]); xW(sh, cream, C.z0, C.z1, F, F + C.h, C.x1, -1, [0, 0, 1, 1]);
    for (const [x, n] of [[299.4, "4A"], [306.6, "4C"]] as const) zW(fit, lam("door" + n, () => ({ map: doorPlain("door" + n, "#3a3226", n) })), x - 0.45, x + 0.45, F, F + 2.05, C.z0 + 0.01, 1, [0, 0, 1, 1]);
    for (const x of [300.6, 305.4]) zW(fit, lam("doorOpp" + x, () => ({ map: doorPlain("doorOpp" + x, "#3a3226", x < 303 ? "4D" : "4E") })), x - 0.45, x + 0.45, F, F + 2.05, C.z1 - 0.01, -1, [0, 0, 1, 1]);
    this.tube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.8, 3.0) }));
    this.tube.position.set(302.8, F + C.h - 0.04, 60.3); this.tube.layers.set(NOINK); this.root.add(this.tube);
    { const ex = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), new THREE.MeshBasicMaterial({ map: ctex("exitSign", 128, 52, (g) => { g.fillStyle = "#0a3a1a"; g.fillRect(0, 0, 128, 52); g.fillStyle = "#6dff9a"; g.font = "900 34px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.fillText("EXIT", 64, 38); }), color: new THREE.Color(2, 2, 2) }));
      ex.position.set(C.x1 - 0.02, F + 2.25, 60.3); ex.rotation.y = -Math.PI / 2; ex.layers.set(NOINK); this.root.add(ex); }
    // ---------------- kitchen furniture and props ----------------
    const cab = lam("cabinet", () => ({ map: cabTex() })), top4 = shiny("counterTop", "#d8d2c0", "#ffffff", 40), wood = lam("hWood", () => ({ color: "#6a4a32" }));
    for (const [z0, z1] of [[52.3, OVEN.z0], [OVEN.z1, 55.2]] as const) fit.add(rbox(V(KIT.x0, F, z0), V(KIT.x0 + 0.6, F + 0.88, z1), 0.02), cab);
    fit.add(rbox(V(KIT.x0, F + 0.88, 52.3), V(KIT.x0 + 0.64, F + 0.93, 55.2), 0.015), top4);
    fit.add(rbox(V(KIT.x0, F + 1.6, 52.3), V(KIT.x0 + 0.36, F + 2.3, 53.8), 0.02), cab); fit.add(rbox(V(KIT.x0, F + 1.6, 54.6), V(KIT.x0 + 0.36, F + 2.3, 55.2), 0.02), cab);
    const ovenM = shiny("oven", "#e2dcc6", "#ffffff", 50);
    fit.add(rbox(V(OVEN.x0, F, OVEN.z0), V(OVEN.x1, F + 0.9, OVEN.z1), 0.03), ovenM);
    fit.add(rbox(V(OVEN.x0, F + 0.9, OVEN.z0), V(OVEN.x0 + 0.12, F + 1.12, OVEN.z1), 0.02), ovenM);
    fit.add(rbox(V(OVEN.x1 - 0.02, F + 0.2, OVEN.z0 + 0.06), V(OVEN.x1 + 0.005, F + 0.7, OVEN.z1 - 0.06), 0.01), shiny("ovenGlass", "#0c0c10", "#ffffff", 100));
    for (let i = 0; i < 4; i++) fit.add(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12).rotateZ(Math.PI / 2), iron, new THREE.Matrix4().makeTranslation(OVEN.x1 + 0.01, F + 0.8, OVEN.z0 + 0.1 + i * 0.13));
    this.clock = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: clockTex("3:12"), color: new THREE.Color(2.4, 2.4, 2.4) }));
    this.clock.position.set(OVEN.x0 + 0.125, F + OVEN.clockY, (OVEN.z0 + OVEN.z1) / 2); this.clock.rotation.y = Math.PI / 2; this.clock.layers.set(NOINK); this.root.add(this.clock);
    fit.add(rbox(V(305.45, F, 54.45), V(306.15, F + 1.72, 55.2), 0.06), shiny("fridge", "#e2dcc6", "#ffffff", 50));
    fit.add(rbox(V(305.42, F + 1.0, 54.44), V(305.47, F + 1.4, 54.5), 0.01), iron);
    // the round table, two bentwood chairs, a mug and keys, the dark pendant lamp
    const tY = F + TABLE.y;
    fit.add(new THREE.CylinderGeometry(TABLE.r, TABLE.r, 0.04, 32), shiny("formica", "#8a8676", "#cccccc", 40), new THREE.Matrix4().makeTranslation(TABLE.x, tY - 0.02, TABLE.z));
    fit.add(new THREE.CylinderGeometry(0.05, 0.05, TABLE.y - 0.04, 12), iron, new THREE.Matrix4().makeTranslation(TABLE.x, F + (TABLE.y - 0.04) / 2, TABLE.z));
    fit.add(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 20), iron, new THREE.Matrix4().makeTranslation(TABLE.x, F + 0.015, TABLE.z));
    for (const [cx2, cz, ry] of [[305.55, 53.15, 0.6], [305.6, 54.15, -0.5]] as const) {
      fit.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), wood, new THREE.Matrix4().makeTranslation(cx2, F + 0.46, cz));
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; fit.add(new THREE.CylinderGeometry(0.015, 0.018, 0.46, 8), wood, new THREE.Matrix4().makeTranslation(cx2 + Math.cos(a) * 0.15, F + 0.23, cz + Math.sin(a) * 0.15)); }
      const back = new THREE.TorusGeometry(0.19, 0.015, 6, 20, Math.PI); back.rotateY(ry);
      fit.add(back, wood, new THREE.Matrix4().makeTranslation(cx2 + 0.12, F + 0.5, cz));
    }
    fit.add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 24), shiny("mug", "#6a1a1e", "#888888", 40), new THREE.Matrix4().makeTranslation(TABLE.x - 0.22, tY + 0.05, TABLE.z - 0.18));
    fit.add(rbox(V(TABLE.x - 0.25, tY, TABLE.z + 0.12), V(TABLE.x - 0.17, tY + 0.012, TABLE.z + 0.16), 0.004), brass);
    fit.add(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), iron, new THREE.Matrix4().makeTranslation(TABLE.x, F + KIT.h - 0.25, TABLE.z));
    fit.add(new THREE.ConeGeometry(0.22, 0.2, 20, 1, true), shiny("shade", "#2a3a34", "#888888", 30), new THREE.Matrix4().makeTranslation(TABLE.x, F + KIT.h - 0.58, TABLE.z));
    fit.add(new THREE.SphereGeometry(0.05, 10, 8), shiny("bulb", "#3a3a3a", "#ffffff", 80), new THREE.Matrix4().makeTranslation(TABLE.x, F + KIT.h - 0.66, TABLE.z));
    // radiator under the window, curtains, a plant, a wall calendar
    const radM = shiny("radiator", "#d8d2c0", "#ffffff", 30);
    for (let x = WIN.x0 - 0.05; x < WIN.x1 + 0.05; x += 0.08) fit.add(rbox(V(x, F + 0.15, KIT.z0 + 0.05), V(x + 0.05, F + 0.72, KIT.z0 + 0.17), 0.015), radM);
    const curtain = lam("curtain4B", () => ({ color: "#4a5a72" }));
    for (const [x0, x1] of [[WIN.x0 - 0.42, WIN.x0 - 0.06], [WIN.x1 + 0.06, WIN.x1 + 0.42]] as const) fit.add(rbox(V(x0, F + 0.4, KIT.z0 + 0.03), V(x1, F + 2.5, KIT.z0 + 0.12), 0.04, 3), curtain);
    fit.add(new THREE.CylinderGeometry(0.008, 0.008, 1.9, 6).rotateZ(Math.PI / 2), iron, new THREE.Matrix4().makeTranslation((WIN.x0 + WIN.x1) / 2, F + 2.52, KIT.z0 + 0.08));
    fit.add(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 12), shiny("pot", "#a0583a", "#ffffff", 30), new THREE.Matrix4().makeTranslation(WIN.x1 - 0.15, F + WIN.y0 - 0.0, KIT.z0 + 0.06));
    for (let i = 0; i < 5; i++) fit.add(new THREE.SphereGeometry(0.06, 8, 6).scale(0.6, 1.4, 0.6), lam("plant", () => ({ color: "#3a5a3a" })), new THREE.Matrix4().makeTranslation(WIN.x1 - 0.15 + Math.cos(i) * 0.05, F + WIN.y0 + 0.12, KIT.z0 + 0.06 + Math.sin(i) * 0.05));
    xW(fit, lam("calendarK", () => ({ map: ctex("calK", 128, 160, (g) => { g.fillStyle = "#f4efe0"; g.fillRect(0, 0, 128, 160); g.fillStyle = "#b8262e"; g.fillRect(0, 0, 128, 32); g.fillStyle = "#555"; for (let i = 0; i < 20; i++) g.fillRect(10 + (i % 5) * 23, 44 + Math.floor(i / 5) * 26, 14, 12); }) })), 54.65, 54.95, F + 1.65, F + 2.03, KIT.x1 - 0.01, -1, [0, 0, 1, 1]);
    // hallway: round mirror, coat on a hook (dripping), shoe rack + shoes, a door mat, light switch, two frames
    fit.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32).rotateZ(Math.PI / 2), shiny("mirror", "#202832", "#ffffff", 140), new THREE.Matrix4().makeTranslation(HALL.x0 + 0.012, F + 1.55, 56.5));
    fit.add(new THREE.TorusGeometry(0.205, 0.015, 6, 32).rotateY(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(HALL.x0 + 0.02, F + 1.55, 56.5));
    fit.add(rbox(V(HALL.x0 + 0.02, F + 0.95, 58.15), V(HALL.x0 + 0.24, F + 1.75, 58.65), 0.08, 3), shiny("raincoat", "#b8962a", "#ffffff", 50));
    fit.add(rbox(V(HALL.x0, F, 57.3), V(HALL.x0 + 0.3, F + 0.32, 58.0), 0.02), wood);
    for (const z of [57.42, 57.62, 57.82]) fit.add(rbox(V(HALL.x0 + 0.04, F + 0.33, z - 0.07), V(HALL.x0 + 0.27, F + 0.42, z + 0.05), 0.03), lam("shoes", () => ({ color: "#2a2220" })));
    sh.add(quadUp(DOOR.x0, DOOR.x1, DOOR.z - 0.65, DOOR.z - 0.1, 1, 1, F - D0 + 0.006), lam("mat", () => ({ color: "#5a3a2a" })));
    xW(fit, lam("switch", () => ({ color: "#efe9da" })), 58.75, 58.85, F + 1.05, F + 1.17, HALL.x1 - 0.005, -1, [0, 0, 1, 1]);
    for (const [z, y] of [[56.0, 1.65], [57.0, 1.75]] as const) xW(fit, lam("frame" + z, () => ({ map: ctex("frame" + z, 96, 128, (g, r) => { g.fillStyle = "#2a1e16"; g.fillRect(0, 0, 96, 128); g.fillStyle = z < 56.5 ? "#6a7a8a" : "#8a6a5a"; g.fillRect(10, 10, 76, 108); g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.arc(48, 60 + r() * 10, 20, 0, 7); g.fill(); }) })), z - 0.2, z + 0.2, F + y - 0.27, F + y + 0.27, HALL.x1 - 0.008, -1, [0, 0, 1, 1]);
    // ---------------- the 3D phone on the table ----------------
    this.phone = new THREE.Group(); this.phone.position.set(PHONE_T[0], tY + 0.006, PHONE_T[2]); this.phone.rotation.y = 0.35; this.root.add(this.phone);
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.009, 0.155, 2, 0.006), shiny("phone", "#0c0c10", "#ffffff", 90)); body.castShadow = true; this.phone.add(body);
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: screenTex("off"), color: new THREE.Color(1.5, 1.5, 1.5) }));
    this.screen.rotation.x = -Math.PI / 2; this.screen.position.y = 0.0052; this.screen.layers.set(NOINK); this.phone.add(this.screen);
    // ---------------- the practical lights ----------------
    this.Lp = new THREE.PointLight("#bcd8ff", 0, 4.5, 2); this.Lo = new THREE.PointLight("#45ff8a", 0, 3.0, 2);
    this.Lo.position.set(OVEN.x0 + 0.4, F + OVEN.clockY, (OVEN.z0 + OVEN.z1) / 2);
    this.Lw = new THREE.SpotLight("#ff8a3a", 0, 16, 0.22, 0.9, 1.5); this.Lw.position.set(304.1, F - 3.0, 47.0); this.Lw.target.position.set(304.3, F + 0.6, 54.6);
    this.Lc = new THREE.PointLight("#e8f2ff", 0, 7, 2); this.Lc.position.set(302.8, F + 2.3, 60.3);
    this.Lu = new THREE.PointLight("#fff2dc", 0, 1.6, 2); this.Lu.position.set((DOOR.x0 + DOOR.x1) / 2, F + 0.06, DOOR.z - 0.1);
    this.root.add(this.Lp, this.Lo, this.Lw, this.Lw.target, this.Lc, this.Lu);
    void M; void STREET;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  private poseSets(id: number, f: number) {
    const F = FLOOR, on = (k: number) => k;
    // rain
    this.rain.offset.y = (f * 0.09) % 1; this.drops.offset.y = (f * 0.0025) % 1;
    // street lamps (the one under 4B dies at STREET_OFF)
    this.Ls.forEach((L, i) => { L.intensity = i === 1 && f >= STREET_OFF ? 0 : 30; });
    this.Lw.intensity = f >= STREET_OFF ? 0 : 22;
    (this.beacon.material as THREE.MeshBasicMaterial).color.setRGB(Math.floor(f / 30) % 2 ? 6 : 0.4, 0.3, 0.25);
    // the oven clock
    const t = f < 640 ? (f < 600 ? "3:12" : "3:16") : f < 1062 ? "3:17" : "3:21";
    const cm = this.clock.material as THREE.MeshBasicMaterial; if (cm.map !== clockTex(t)) { cm.map = clockTex(t); cm.needsUpdate = true; }
    this.Lo.intensity = on(0.9);
    // corridor tube + the light under the door
    const fl = flickerAt(f);
    this.Lc.intensity = 0.9 * fl; (this.tube.material as THREE.MeshBasicMaterial).color.setScalar(0.85 * fl + 0.05);
    this.Lu.intensity = 0.6 * fl; (this.strip.material as THREE.MeshBasicMaterial).opacity = fl;
    // the phone on the table: screen, buzz
    const ui = phoneUI(f), sm = this.screen.material as THREE.MeshBasicMaterial;
    if (sm.map !== screenTex(ui)) { sm.map = screenTex(ui); sm.needsUpdate = true; }
    const buzz = (f >= 59 && f < 80) || (f >= 1064 && f < 1090);
    this.phone.position.set(PHONE_T[0] + (buzz ? 0.004 * Math.sin(f * 2.7) : 0), F + TABLE.y + 0.006, PHONE_T[2] + (buzz ? 0.003 * Math.cos(f * 3.1) : 0));
    const held = HELD[id];
    this.phone.visible = !held;
    if (held && f < PHONE_OFF) { this.Lp.position.set(...held); this.Lp.intensity = id >= 21 ? 0.5 : 1.1; }
    else if (!held && ui !== "off") { this.Lp.position.set(PHONE_T[0], F + TABLE.y + 0.7, PHONE_T[2]); this.Lp.intensity = buzz ? 0.5 : 0.25; }
    else this.Lp.intensity = 0;
    // the chain lock swings on the knocks
    let sw = 0; for (const k of [720, 735, 750, 994, 1006]) if (f >= k && f < k + 40) sw += 0.5 * Math.exp(-(f - k) / 10) * Math.sin((f - k) * 0.6);
    this.chain.rotation.z = sw;
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
    const K3 = SUN_SHOT[id] ?? {}; if (K3.lit) TONE.uLitCol.value.set(...K3.lit);
    TONE.uPract.value = K3.pract ?? 2.5; CARD_K.uGain.value = K3.card ?? 0.7;
    this.sun.intensity = 1.0;
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
    this.poseSets(id, f);
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
