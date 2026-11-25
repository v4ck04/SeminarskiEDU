// The river town as one scene, with this film's sets on the far bank: the presidential bedroom, the marble hallway, the
// office, the press room, a balcony over the city, an operating room, a cockpit, a boat on the river, a bakery and its
// street. Practical lights (clock, desk lamp, hologram, oven, surgical lamp, camera flashes) are real point lights. update(id, f, camera) poses everything for shot `id` at frame f.
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
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, BED, BED_DOOR, CLOCK_B, MIRROR, HALL, OFF, DESK, GLOBE, PRESS, SIGN, BALC, OR, COCK, BOAT,
  BAK, BAK_WIN, STREET, doorsOpen, drawerOut, clockB,
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
const GOLD: [number, number, number] = [1.35, 1.05, 0.62], COLD: [number, number, number] = [0.5, 0.6, 0.95], WARM: [number, number, number] = [1.15, 0.95, 0.7];
const SUN_SHOT: Record<number, Key3> = {
  1: { az: 120, el: 22, lit: GOLD, card: 0.85 }, 2: { az: 140, el: 30, lit: GOLD, card: 0.9 }, 3: { az: 100, el: 25, lit: COLD, card: 0.85 },
  4: { az: 160, el: 70, lit: [1.1, 1.0, 0.85], card: 0.9 }, 5: { az: 10, el: 18, lit: GOLD, card: 0.85 }, 6: { az: 150, el: 35, lit: [0.9, 0.95, 1.1], card: 0.9 },
  7: { az: 90, el: 35, lit: WARM, card: 0.9 }, 8: { az: 160, el: 50, lit: [1.0, 0.85, 0.6], card: 0.85 }, 9: { az: 150, el: 55, lit: WARM, card: 0.85 },
  10: { az: 150, el: 25, lit: [0.75, 0.82, 1.0], card: 0.88 }, 11: { az: 120, el: 40, lit: [0.32, 0.42, 0.78], card: 0.7 }, 12: { az: 120, el: 30, lit: [0.38, 0.72, 0.78], card: 0.8 },
  13: { az: 150, el: 25, lit: [0.42, 0.52, 0.88], card: 0.82 }, 14: { az: 150, el: 40, lit: [0.22, 0.34, 0.5], card: 0.7, pract: 4 }, 15: { az: 170, el: 78, lit: [1.6, 1.6, 1.6], card: 0.95 },
  16: { az: 10, el: 12, card: 0.85 }, 17: { az: 20, el: 10, card: 0.85 }, 18: { az: 140, el: 40, lit: [0.26, 0.32, 0.6], card: 0.75, pract: 4 },
  19: { az: 150, el: 50, lit: WARM, card: 0.85 }, 20: { az: 160, el: 30, lit: [1.3, 1.1, 0.8], card: 0.9 }, 21: { az: 15, el: 9, card: 0.85 },
  22: { az: 150, el: 25, lit: [0.22, 0.28, 0.55], card: 0.62 }, 23: { az: 140, el: 25, lit: [1.0, 0.55, 0.28], card: 0.8, pract: 4 }, 24: { az: 150, el: 30, lit: [1.05, 0.7, 0.4], card: 0.85, pract: 4 },
  25: { az: 5, el: 9, card: 0.85 }, 26: { az: 175, el: 10, card: 0.85 },
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
const sealTex = () => ctex("seal", 512, 512, (g) => { g.fillStyle = "#1d2a52"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#d9b04a"; for (const [r, w] of [[230, 10], [200, 4], [120, 6]] as const) { g.lineWidth = w; g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); } g.fillStyle = "#d9b04a"; for (let i = 0; i < 13; i++) { const a = (i / 13) * Math.PI * 2; g.beginPath(); g.arc(256 + Math.cos(a) * 160, 256 + Math.sin(a) * 160, 9, 0, 7); g.fill(); } g.beginPath(); g.moveTo(256, 170); g.lineTo(300, 290); g.lineTo(212, 290); g.closePath(); g.fill(); });
const marbleTex = () => ctex("marble", 512, 512, (g, r) => { g.fillStyle = "#e8e2d6"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(120,110,100,${0.1 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 120; y += (r() - 0.3) * 80; g.lineTo(x, y); } g.stroke(); } g.strokeStyle = "rgba(90,80,70,0.4)"; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512); });
const panelTex = (key: string, col: string, h: number) => ctex(key, 512, Math.round(h * 96), (g) => { const H = Math.round(h * 96); g.fillStyle = col; g.fillRect(0, 0, 512, H); g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 6; for (let x = 16; x < 512; x += 128) { g.strokeRect(x, H * 0.12, 96, H * 0.42); g.strokeRect(x, H * 0.6, 96, H * 0.32); } g.fillStyle = "rgba(255,220,150,0.25)"; g.fillRect(0, H * 0.56, 512, 6); });
const skyWin = (key: string, top: string, bot: string) => ctex(key, 256, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); g.strokeStyle = "#f4ecd8"; g.lineWidth = 14; g.strokeRect(0, 0, 256, 512); g.lineWidth = 8; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 512); g.moveTo(0, 170); g.lineTo(256, 170); g.moveTo(0, 340); g.lineTo(256, 340); g.stroke(); });
const flagTex = () => ctex("flagDark", 256, 384, (g) => { g.fillStyle = "#1d3a7a"; g.fillRect(0, 0, 256, 384); g.fillStyle = "#c0262e"; for (let y = 0; y < 384; y += 64) g.fillRect(0, y + 32, 256, 18); g.fillStyle = "#e2b84a"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 22 : 52; g.lineTo(128 + Math.cos(a) * r, 100 + Math.sin(a) * r); } g.fill(); });
const noteTex = (key: string, lines: string[], reveal = 1) => ctex(key + reveal, 512, 400, (g) => { g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 512, 400); g.fillStyle = "rgba(150,120,80,0.15)"; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % 512, (i * 53) % 400, 30, 2); g.fillStyle = "#1d1a40"; g.font = "italic 600 40px 'Segoe Script', 'Brush Script MT', cursive"; g.textAlign = "left"; const n = Math.ceil(lines.length * reveal); lines.slice(0, n).forEach((l, i) => g.fillText(l, 34, 80 + i * 70)); });
const envTex = () => ctex("envelope", 256, 160, (g) => { g.fillStyle = "#f2e8d0"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "rgba(120,90,50,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 90); g.lineTo(256, 0); g.stroke(); g.fillStyle = "#a01a22"; g.beginPath(); g.arc(128, 88, 22, 0, 7); g.fill(); });
const brickWarm = () => ctex("bakBrick", 512, 512, (g, r) => { g.fillStyle = "#5a3a2a"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 24) for (let x = (y / 24) % 2 ? -24 : 0; x < 512; x += 48) { g.fillStyle = jit(r, "#a5643e", 0.12, 4, 0.12); g.fillRect(x + 2, y + 2, 44, 20); } });
const sunriseTex = () => ctex("sunrise", 512, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#5a6aa8"); gr.addColorStop(0.55, "#ff9a5a"); gr.addColorStop(0.75, "#ffd08a"); gr.addColorStop(1, "#4a5a7a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); g.fillStyle = "#fff0c0"; g.beginPath(); g.arc(300, 176, 26, 0, 7); g.fill(); g.fillStyle = "#3a4a6a"; g.fillRect(0, 196, 512, 60); });
const consoleTex = () => ctex("console", 512, 256, (g, r) => { g.fillStyle = "#1a1e26"; g.fillRect(0, 0, 512, 256); for (let i = 0; i < 6; i++) { g.fillStyle = "#0a2a3a"; g.fillRect(20 + i * 82, 30, 70, 60); g.fillStyle = r() < 0.5 ? "#6dffb0" : "#ffb04a"; g.fillRect(30 + i * 82, 50, 40, 6); } for (let i = 0; i < 40; i++) { g.fillStyle = ["#ff5a4a", "#6dffb0", "#ffd04a", "#c9ccd4"][i % 4]; g.beginPath(); g.arc(20 + (i % 20) * 24, 140 + Math.floor(i / 20) * 40, 6, 0, 7); g.fill(); } });
const PXM = 50;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const q2 = (v: number) => Math.round(v * 3) / 3; // facade texture: pixels per metre
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
const clockTex = (t: string, col = "#ff3a2a") => ctex("clock" + t + col, 256, 96, (g) => { g.fillStyle = "#0a0202"; g.fillRect(0, 0, 256, 96); g.fillStyle = col; g.font = "700 72px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 128, 50); });
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
  private duvet!: THREE.Mesh; private clockB!: THREE.Mesh; private doors: THREE.Group[] = []; private drawer!: THREE.Group; private note!: THREE.Mesh; private note2!: THREE.Mesh;
  private globe!: THREE.Group; private boat!: THREE.Group; private loafL!: THREE.Mesh; private loafR!: THREE.Mesh;
  private Lclock!: THREE.PointLight; private Llamp!: THREE.PointLight; private Lholo!: THREE.PointLight; private Loven!: THREE.PointLight; private Lsurg!: THREE.PointLight; private Lflash!: THREE.PointLight; private Ldraw!: THREE.PointLight;
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
    const sh = new Batch(), fit = new Batch();
    const zW = (b: Batch, m: THREE.Material, x0: number, x1: number, y0: number, y1: number, z: number, dir: number, uv: [number, number, number, number] = [0, 0, (x1 - x0) / 3, (y1 - y0) / 3]) =>
      b.add(dir > 0 ? quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z), uv[2], uv[3], uv[0], uv[1]) : quad(V(x1, y0, z), V(x0, y0, z), V(x0, y1, z), V(x1, y1, z), uv[2], uv[3], uv[0], uv[1]), m);
    const xW = (b: Batch, m: THREE.Material, z0: number, z1: number, y0: number, y1: number, x: number, dir: number, uv: [number, number, number, number] = [0, 0, (z1 - z0) / 3, (y1 - y0) / 3]) =>
      b.add(dir > 0 ? quad(V(x, y0, z1), V(x, y0, z0), V(x, y1, z0), V(x, y1, z1), uv[2], uv[3], uv[0], uv[1]) : quad(V(x, y0, z0), V(x, y0, z1), V(x, y1, z1), V(x, y1, z0), uv[2], uv[3], uv[0], uv[1]), m);
    const ceil = (b: Batch, m: THREE.Material, R: Room) => b.add(quad(V(R.x0, D0 + R.h, R.z0), V(R.x1, D0 + R.h, R.z0), V(R.x1, D0 + R.h, R.z1), V(R.x0, D0 + R.h, R.z1)), m);
    /** a room shell with inward walls; `hole` cuts an opening [x0, x1, y0, y1] in the z0 wall */
    const shell = (R: Room, wall: THREE.Material, floor: THREE.Material, ceilM: THREE.Material, hole?: [number, number, number, number], ft = 2) => {
      sh.add(quadUp(R.x0, R.x1, R.z0, R.z1, (R.x1 - R.x0) / ft, (R.z1 - R.z0) / ft, 0.01), floor); ceil(sh, ceilM, R);
      const y0 = D0, y1 = D0 + R.h, uvw = (a: number, b2: number): [number, number, number, number] => [a / 4, 0, b2 / 4, 1];
      zW(sh, wall, R.x0, R.x1, y0, y1, R.z1, -1, uvw(R.x0, R.x1));
      if (hole) { const [hx0, hx1, hy0, hy1] = hole; zW(sh, wall, R.x0, hx0, y0, y1, R.z0, 1, uvw(R.x0, hx0)); zW(sh, wall, hx1, R.x1, y0, y1, R.z0, 1, uvw(hx1, R.x1)); if (hy0 > 0) zW(sh, wall, hx0, hx1, y0, D0 + hy0, R.z0, 1, [hx0 / 4, 0, hx1 / 4, hy0 / R.h]); zW(sh, wall, hx0, hx1, D0 + hy1, y1, R.z0, 1, [hx0 / 4, hy1 / R.h, hx1 / 4, 1]); }
      else zW(sh, wall, R.x0, R.x1, y0, y1, R.z0, 1, uvw(R.x0, R.x1));
      xW(sh, wall, R.z0, R.z1, y0, y1, R.x0, 1, uvw(R.z0, R.z1)); xW(sh, wall, R.z0, R.z1, y0, y1, R.x1, -1, uvw(R.z0, R.z1));
    };
    const glowM = (r: number, g: number, b2: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b2) });
    const glowAt = (p: V3, rad: number, m: THREE.Material) => { const x = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), m); x.position.set(...p); x.layers.set(NOINK); this.root.add(x); return x; };
    const pic = (key: string, tex: () => THREE.Texture) => lam(key, () => ({ map: tex() }));
    const gold = shiny("bGold", "#d9b04a", "#fff1b0", 70), brass = shiny("bBrass", "#b8913a", "#fff0b0", 60), white = lam("bWhite", () => ({ color: "#f1efe8" }));
    const maho = shiny("mahogany", "#5a2a1a", "#c08a6a", 40), cream = (h: number, key = "creamW") => lam(key, () => ({ map: paintTex(key, "#e8dcc2", h) }));
    const coneM = new THREE.MeshBasicMaterial({ map: coneTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: new THREE.Color(1.0, 0.9, 0.7) });
    const ray = (at: V3, len: number, rad: number, rotX: number, rotZ: number, op = 1) => { const c = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 20, 1, true), coneM.clone()); (c.material as THREE.MeshBasicMaterial).opacity = op; c.position.set(...at); c.rotation.set(rotX, 0, rotZ); c.layers.set(NOINK); c.renderOrder = 3; this.root.add(c); return c; };
    const flag = (x: number, z: number, h = 2.6) => { fit.add(new THREE.CylinderGeometry(0.025, 0.03, h, 8), brass, new THREE.Matrix4().makeTranslation(x, D0 + h / 2, z)); fit.add(new THREE.SphereGeometry(0.05, 10, 8), gold, new THREE.Matrix4().makeTranslation(x, D0 + h + 0.05, z)); const fl = new THREE.PlaneGeometry(0.7, 1.05, 6, 1); const p = fl.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.06 * Math.sin(p.getX(i) * 6)); fl.computeVertexNormals(); fit.add(fl, lam("flagDark", () => ({ map: flagTex(), side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(x + 0.37, D0 + h - 0.6, z)); };
    // ================= the presidential bedroom =================
    shell(BED, cream(BED.h, "bedWall"), pic("bedCarpet", () => rep(floorTex("bedCarpetT", "#6a1f2a", "#5e1a24", 6, "rgba(220,180,80,0.25)"), 1, 1)), gold, [BED_DOOR.x0, BED_DOOR.x1, 0, BED_DOOR.h]);
    fit.add(new THREE.CylinderGeometry(2.0, 2.0, 0.01, 48), pic("seal", sealTex), new THREE.Matrix4().makeTranslation(305, D0 + 0.015, 65));
    for (const z of [62.2, 66.8]) { xW(fit, pic("bedWin", () => skyWin("bedWin", "#ffe6b0", "#fff6e0")), z - 0.8, z + 0.8, D0 + 0.9, D0 + 3.6, BED.x1 - 0.02, -1, [0, 0, 1, 1]); for (const s of [-1, 1]) fit.add(rbox(V(BED.x1 - 0.22, D0, z + s * 1.0 - 0.18), V(BED.x1 - 0.04, D0 + 3.9, z + s * 1.0 + 0.18), 0.06, 3), lam("drapeGold", () => ({ color: "#8a2a2a" }))); ray([BED.x1 - 1.6, D0 + 1.9, z], 3.6, 0.9, 0, Math.PI / 2 - 0.45, 0.55); }
    fit.add(rbox(V(303.3, D0, 67.4), V(306.7, D0 + 0.45, 70.0), 0.08), maho);
    fit.add(rbox(V(303.35, D0 + 0.45, 67.5), V(306.65, D0 + 0.68, 69.9), 0.12), white);
    this.duvet = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.18, 1.6, 3, 0.08), shiny("duvet", "#e8e0d0", "#ffffff", 30)); this.duvet.castShadow = this.duvet.receiveShadow = true; this.root.add(this.duvet);
    for (const x of [304.3, 305.7]) fit.add(rbox(V(x - 0.55, D0 + 0.66, 69.25), V(x + 0.55, D0 + 0.9, 69.85), 0.1), white);
    fit.add(rbox(V(303.2, D0, 69.92), V(306.8, D0 + 1.9, 70.0), 0.04), maho);
    fit.add(rbox(V(302.1, D0, 68.55), V(302.95, D0 + 0.55, 69.3), 0.04), maho); fit.add(rbox(V(307.05, D0, 68.55), V(307.9, D0 + 0.55, 69.3), 0.04), maho);
    fit.add(rbox(V(CLOCK_B[0] - 0.16, D0 + 0.55, CLOCK_B[2] - 0.06), V(CLOCK_B[0] + 0.16, D0 + 0.77, CLOCK_B[2] + 0.08), 0.03), shiny("clockBody", "#1a1a20", "#888888", 60));
    this.clockB = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.11), new THREE.MeshBasicMaterial({ map: clockTex("6:59"), color: new THREE.Color(2.2, 2.2, 2.2) }));
    this.clockB.position.set(CLOCK_B[0], CLOCK_B[1], CLOCK_B[2] - 0.065); this.clockB.rotation.y = Math.PI; this.clockB.layers.set(NOINK); this.root.add(this.clockB);
    fit.add(new THREE.CylinderGeometry(0.1, 0.14, 0.3, 16), brass, new THREE.Matrix4().makeTranslation(307.5, D0 + 0.7, 68.9)); fit.add(new THREE.ConeGeometry(0.24, 0.3, 16, 1, true), lam("shadeCream", () => ({ color: "#f4e6c8", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(307.5, D0 + 1.0, 68.9));
    glowAt([307.5, D0 + 0.95, 68.9], 0.07, glowM(3, 2.4, 1.4));
    // the ornate mirror on the west wall
    fit.add(rbox(V(MIRROR.x + 0.02, D0 + MIRROR.y - MIRROR.h / 2 - 0.12, MIRROR.z - MIRROR.w / 2 - 0.12), V(MIRROR.x + 0.1, D0 + MIRROR.y + MIRROR.h / 2 + 0.12, MIRROR.z + MIRROR.w / 2 + 0.12), 0.05), gold);
    { const mg = new THREE.Mesh(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), new THREE.MeshPhongMaterial({ color: "#a8b8c8", specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.28, depthWrite: false })); mg.position.set(MIRROR.x + 0.35, D0 + MIRROR.y, MIRROR.z); mg.rotation.y = Math.PI / 2; mg.layers.set(NOINK); mg.renderOrder = 4; this.root.add(mg);
      fit.add(quad(V(MIRROR.x + 0.105, D0 + MIRROR.y - MIRROR.h / 2, MIRROR.z + MIRROR.w / 2), V(MIRROR.x + 0.105, D0 + MIRROR.y - MIRROR.h / 2, MIRROR.z - MIRROR.w / 2), V(MIRROR.x + 0.105, D0 + MIRROR.y + MIRROR.h / 2, MIRROR.z - MIRROR.w / 2), V(MIRROR.x + 0.105, D0 + MIRROR.y + MIRROR.h / 2, MIRROR.z + MIRROR.w / 2)), lam("mirrorBack", () => ({ color: "#4a5a6a" }))); }
    // double doors + the bright hall behind them
    this.doors = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s < 0 ? BED_DOOR.x0 : BED_DOOR.x1, D0, BED.z0 + 0.02); const m = new THREE.Mesh(new RoundedBoxGeometry(1.1, BED_DOOR.h, 0.08, 2, 0.02), pic("dDoor", () => ctex("dDoor", 128, 320, (g2) => { g2.fillStyle = "#f2ece0"; g2.fillRect(0, 0, 128, 320); g2.strokeStyle = "#c9a04a"; g2.lineWidth = 6; g2.strokeRect(14, 20, 100, 130); g2.strokeRect(14, 170, 100, 130); }))); m.position.set(-s * 0.55, BED_DOOR.h / 2, 0); m.castShadow = true; g.add(m); this.root.add(g); return g; });
    { const bl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.0), glowM(2.6, 2.3, 1.8)); bl.position.set(305, D0 + 1.5, BED.z0 - 0.6); bl.layers.set(NOINK); this.root.add(bl); }
    // ================= the marble hallway =================
    shell(HALL, cream(HALL.h, "hallWall"), shiny("marble", "#e8e2d6", "#ffffff", 110), lam("hallCeil", () => ({ color: "#e8dcc2" })), undefined, 2);
    ((sh as unknown) as { g: Map<THREE.Material, THREE.BufferGeometry[]> });
    for (let x = HALL.x0 + 2; x < HALL.x1; x += 4) { flag(x, HALL.z1 - 0.5, 2.4); glowAt([x + 2, D0 + 2.6, HALL.z0 + 0.12], 0.12, glowM(3, 2.3, 1.3)); fit.add(rbox(V(x + 1.9, D0 + 2.35, HALL.z0 + 0.02), V(x + 2.1, D0 + 2.5, HALL.z0 + 0.12), 0.02), brass); }
    for (let x = HALL.x0 + 4; x < HALL.x1; x += 8) zW(fit, pic("portrait" + x, () => ctex("portrait" + x, 128, 160, (g2) => { g2.fillStyle = "#6a4a1a"; g2.fillRect(0, 0, 128, 160); g2.fillStyle = "#2a2a3a"; g2.fillRect(12, 12, 104, 136); g2.fillStyle = "#c9a07a"; g2.beginPath(); g2.arc(64, 64, 26, 0, 7); g2.fill(); g2.fillStyle = "#1a1a24"; g2.fillRect(30, 96, 68, 52); })), x - 0.6, x + 0.6, D0 + 1.4, D0 + 2.9, HALL.z0 + 0.03, 1, [0, 0, 1, 1]);
    for (let x = HALL.x0; x < HALL.x1; x += 2) sh.add(quadUp(x, x + 1, HALL.z0 + 1.2, HALL.z1 - 1.2, 1, 1, 0.012), lam("runner", () => ({ color: "#7a1f2a" })));
    // ================= the office =================
    shell(OFF, pic("offPanel", () => panelTex("offPanel", "#d8c8a0", OFF.h)), pic("offCarpet", () => rep(floorTex("offCarpetT", "#2a3a6a", "#26365f", 8, "rgba(220,180,80,0.15)"), 1, 1)), lam("offCeil", () => ({ color: "#f0e8d6" })));
    fit.add(new THREE.CylinderGeometry(2.4, 2.4, 0.01, 48), pic("seal", sealTex), new THREE.Matrix4().makeTranslation(357.5, D0 + 0.015, 63.0));
    for (const x of [354.6, 360.4]) { zW(fit, pic("offWin", () => skyWin("offWin", "#9cc4ea", "#e7f0f8")), x - 0.8, x + 0.8, D0 + 1.0, D0 + 3.4, OFF.z1 - 0.03, -1, [0, 0, 1, 1]); for (const s of [-1, 1]) fit.add(rbox(V(x + s * 1.0 - 0.2, D0, OFF.z1 - 0.3), V(x + s * 1.0 + 0.2, D0 + 3.8, OFF.z1 - 0.05), 0.08, 3), lam("drapeBlue", () => ({ color: "#1d2a52" }))); }
    flag(352.6, 69.2); flag(362.4, 69.2);
    fit.add(rbox(V(DESK.x0, D0, DESK.z0 + 0.1), V(DESK.x1, DESK.y - 0.05, DESK.z1), 0.04), maho);
    fit.add(rbox(V(DESK.x0 - 0.05, DESK.y - 0.06, DESK.z0 - 0.05), V(DESK.x1 + 0.05, DESK.y, DESK.z1 + 0.05), 0.02), shiny("deskTop", "#4a2214", "#d0a080", 70));
    this.drawer = new THREE.Group(); this.root.add(this.drawer);
    { const dm = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.18, 0.5, 2, 0.015), maho); dm.position.set(0, 0, 0.25); dm.castShadow = true; this.drawer.add(dm);
      const fr = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.2, 0.03, 2, 0.01), maho); fr.position.set(0, 0, 0.0); this.drawer.add(fr);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8).rotateZ(Math.PI / 2), brass); hd.position.set(0, 0, -0.04); this.drawer.add(hd);
      const en = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshLambertMaterial({ map: envTex() })); en.rotation.x = -Math.PI / 2; en.position.set(0, 0.095, 0.27); this.drawer.add(en); }
    fit.add(rbox(V(357.0, D0, 67.0), V(358.0, D0 + 1.2, 67.7), 0.1), shiny("chairLeather", "#2a1a14", "#888888", 30));
    fit.add(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16), brass, new THREE.Matrix4().makeTranslation(358.8, DESK.y + 0.02, 66.1)); fit.add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), brass, new THREE.Matrix4().makeTranslation(358.8, DESK.y + 0.22, 66.1));
    fit.add(new THREE.CylinderGeometry(0.06, 0.18, 0.12, 16, 1, true), lam("lampGreen", () => ({ color: "#1f5a3a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(358.8, DESK.y + 0.46, 66.1));
    glowAt([358.8, DESK.y + 0.42, 66.1], 0.05, glowM(3, 2.5, 1.5));
    this.note = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.33), new THREE.MeshLambertMaterial({ map: noteTex("note1", ["If you're reading this,", "you're one of us.", "Say the word:", "LASTA."]) }));
    this.note.rotation.set(-Math.PI / 2, 0, Math.PI); this.note.position.set(357.5, DESK.y + 0.004, 66.05); this.root.add(this.note);
    twoTone(this.note.material as THREE.MeshLambertMaterial);
    this.note2 = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.33), new THREE.MeshLambertMaterial({ map: noteTex("note2", ["TOMORROW.", "SAME PLACE.", "LEAVE A SIGN."], 0) })); this.note2.rotation.set(-Math.PI / 2, 0, Math.PI); this.note2.position.set(357.6, DESK.y + 0.005, 65.95); this.root.add(this.note2);
    for (const z of [60.3, 61.5]) fit.add(rbox(V(OFF.x0 + 0.3, D0, z - 0.5), V(OFF.x0 + 1.2, D0 + 0.8, z + 0.5), 0.12), shiny("sofa", "#c9b48a", "#ffffff", 20));
    // the hologram globe (shot 14) + pins
    this.globe = new THREE.Group(); this.globe.position.set(...GLOBE); this.root.add(this.globe);
    { const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.4, 1.8), wireframe: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), gm); sp.layers.set(NOINK); this.globe.add(sp);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.25, 0.35), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); core.layers.set(NOINK); this.globe.add(core);
      for (let i = 0; i < 11; i++) { const a = i * 2.3, b2 = -0.6 + 1.2 * ((i * 0.37) % 1); const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3.2, 0.6) })); pin.position.set(Math.cos(a) * Math.cos(b2) * 0.56, Math.sin(b2) * 0.56, Math.sin(a) * Math.cos(b2) * 0.56); pin.layers.set(NOINK); this.globe.add(pin); }
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.05, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 2.0) })); base.position.y = -0.95; base.layers.set(NOINK); this.globe.add(base); }
    // ================= the press room =================
    shell(PRESS, cream(PRESS.h, "pressWall"), pic("pressFloor", () => rep(floorTex("pressFloorT", "#3a2a26", "#342622", 10), 1, 1)), lam("pressCeil", () => ({ color: "#2a2a30" })));
    zW(fit, lam("backdrop", () => ({ map: ctex("backdrop", 512, 256, (g) => { g.fillStyle = "#1d2a52"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#d9b04a"; g.beginPath(); g.arc(256, 120, 60, 0, 7); g.fill(); g.fillStyle = "#1d2a52"; g.beginPath(); g.arc(256, 120, 48, 0, 7); g.fill(); g.font = "900 30px 'Inter Display', Inter, sans-serif"; g.fillStyle = "#e8e2d2"; g.textAlign = "center"; g.fillText("HOUSING ACT", 256, 220); }) })), 383, 393, D0 + 0.3, D0 + 4.6, PRESS.z1 - 0.03, -1, [0, 0, 1, 1]);
    fit.add(rbox(V(SIGN[0] - 1.1, D0, SIGN[2] - 0.6 - 0.4), V(SIGN[0] + 1.1, D0 + 0.78, SIGN[2] - 0.6 + 0.4), 0.04), maho);
    flag(384.4, 70.6); flag(391.6, 70.6);
    for (let r = 0; r < 3; r++) fit.add(rbox(V(382, D0, 58.6 + r * 1.2), V(394, D0 + 0.45, 59.0 + r * 1.2), 0.05), lam("pressChairs", () => ({ color: "#3a3a44" })));
    // ================= the balcony over the city =================
    fit.add(boxGeo(V(BALC[0] + 0.6, D0, BALC[2] - 8), V(BALC[0] + 14, BALC[1] + 4, BALC[2] + 8), 0), lam("balcBld", () => ({ color: "#e8e2d2" })));
    fit.add(rbox(V(BALC[0] - 2.4, BALC[1] - 0.3, BALC[2] - 3), V(BALC[0] + 0.6, BALC[1], BALC[2] + 3), 0.05), lam("balcSlab", () => ({ color: "#d8d0bc" })));
    for (let z = BALC[2] - 2.9; z <= BALC[2] + 2.9; z += 0.3) fit.add(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 10), white, new THREE.Matrix4().makeTranslation(BALC[0] - 2.3, BALC[1] + 0.5, z));
    fit.add(rbox(V(BALC[0] - 2.45, BALC[1] + 1.0, BALC[2] - 3), V(BALC[0] - 2.15, BALC[1] + 1.12, BALC[2] + 3), 0.03), white);
    // ================= the operating room =================
    shell(OR, pic("orTile", () => rep(floorTex("orTileT", "#cfe6e0", "#c4dcd6", 6, "rgba(80,120,110,0.3)"), 1, 1)), pic("orFloor", () => rep(floorTex("orFloorT", "#9ab0aa", "#94aaa4", 6), 1, 1)), lam("orCeil", () => ({ color: "#d8e4e0" })));
    fit.add(rbox(V(423.4, D0, 64.6), V(424.6, D0 + 0.9, 66.6), 0.05), shiny("orTable", "#7a9aa4", "#ffffff", 60));
    fit.add(rbox(V(423.3, D0 + 0.9, 64.5), V(424.7, D0 + 1.0, 66.7), 0.04), lam("orSheet", () => ({ color: "#4a8aaa" })));
    fit.add(new THREE.CylinderGeometry(0.5, 0.36, 0.14, 32), shiny("surgLamp", "#d8dcde", "#ffffff", 90), new THREE.Matrix4().makeTranslation(424, D0 + 2.7, 65.2));
    { const ld = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), glowM(4, 4, 3.8)); ld.rotation.x = Math.PI / 2; ld.position.set(424, D0 + 2.62, 65.2); ld.layers.set(NOINK); this.root.add(ld); }
    fit.add(rbox(V(426.4, D0 + 1.1, 66.2), V(427.6, D0 + 1.9, 66.5), 0.03), pic("monitor", consoleTex));
    // ================= the cockpit =================
    shell(COCK, lam("cockWall", () => ({ color: "#3a3e48" })), lam("cockFloor", () => ({ color: "#2a2c32" })), lam("cockCeil", () => ({ color: "#4a4e58" })));
    { const ws = new THREE.Mesh(new THREE.PlaneGeometry(COCK.x1 - COCK.x0 - 0.3, 1.0), new THREE.MeshBasicMaterial({ map: sunriseTex(), color: new THREE.Color(1.6, 1.4, 1.2) })); ws.position.set((COCK.x0 + COCK.x1) / 2, D0 + 1.5, COCK.z0 + 0.04); ws.layers.set(NOINK); this.root.add(ws); }
    fit.add(rbox(V(COCK.x0 + 0.1, D0 + 0.6, COCK.z0 + 0.05), V(COCK.x1 - 0.1, D0 + 1.0, COCK.z0 + 0.7), 0.05), pic("console", consoleTex));
    for (const x of [441.2, 442.8]) fit.add(rbox(V(x - 0.3, D0, 61.4), V(x + 0.3, D0 + 1.2, 62.2), 0.1), shiny("seat", "#2a2a30", "#888888", 30));
    // ================= the fishing boat on the river =================
    { const hull = new THREE.Group(); hull.position.set(...BOAT); this.root.add(hull); this.boat = hull;
      const hm = shiny("hull", "#2a5a7a", "#ffffff", 40), dk = lam("deck", () => ({ color: "#9a6a3e" }));
      const h1 = new THREE.Mesh(new RoundedBoxGeometry(5.0, 0.9, 2.0, 3, 0.3), hm); h1.position.y = 0.2; h1.castShadow = true; hull.add(h1);
      const d1 = new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.08, 1.7, 2, 0.03), dk); d1.position.y = 0.66; hull.add(d1);
      const cab = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.2, 1.4, 2, 0.08), lam("cabin", () => ({ color: "#e8e2d2" }))); cab.position.set(-1.2, 1.3, 0); cab.castShadow = true; hull.add(cab);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3, 8), dk); mast.position.set(0.8, 2.2, 0); hull.add(mast); }
    // ================= the bakery + its street =================
    shell(BAK, pic("bakBrick", () => rep(brickWarm(), 1, 1)), pic("bakFloor", () => rep(floorTex("bakFloorT", "#8a6a4a", "#7e6042", 8), 1, 1)), lam("bakCeil", () => ({ color: "#5a4030" })), [BAK_WIN.x0, BAK_WIN.x1, BAK_WIN.y0, BAK_WIN.y1]);
    fit.add(rbox(V(466.4, D0, 66.6), V(469.6, D0 + 2.4, 67.95), 0.2), pic("bakBrick", () => rep(brickWarm(), 1, 1)));
    { const om = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32, 0, Math.PI), glowM(4, 1.8, 0.5)); om.position.set(468, D0 + 0.95, 66.58); om.rotation.y = Math.PI; om.layers.set(NOINK); this.root.add(om); }
    fit.add(rbox(V(461.4, D0, 65.2), V(467.0, D0 + 0.92, 66.0), 0.04), maho); fit.add(rbox(V(461.35, D0 + 0.92, 65.15), V(467.05, D0 + 0.98, 66.05), 0.02), lam("bakTop", () => ({ color: "#c9b48a" })));
    const bread = lam("bread", () => ({ color: "#c98a3a" }));
    for (let i = 0; i < 7; i++) fit.add(new THREE.SphereGeometry(0.16, 14, 10).scale(1.4, 0.7, 0.9), bread, new THREE.Matrix4().makeTranslation(461.9 + i * 0.6, D0 + 1.06, 65.7 + (i % 2) * 0.12));
    for (let k = 0; k < 3; k++) { fit.add(rbox(V(460.1, D0 + 1.3 + k * 0.5, 61.5), V(460.5, D0 + 1.34 + k * 0.5, 66.0), 0.01), maho); for (let i = 0; i < 6; i++) fit.add(new THREE.SphereGeometry(0.12, 10, 8).scale(1, 0.7, 1.4), bread, new THREE.Matrix4().makeTranslation(460.3, D0 + 1.42 + k * 0.5, 61.9 + i * 0.7)); }
    fit.add(rbox(V(467.6, D0, 61.0), V(469.8, D0 + 0.38, 62.4), 0.06), lam("cot", () => ({ color: "#6a5a4a" }))); fit.add(rbox(V(467.65, D0 + 0.38, 61.05), V(469.75, D0 + 0.5, 62.35), 0.08), lam("blanket", () => ({ color: "#4a6a8a" })));
    this.loafL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI), bread); this.loafR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, Math.PI, Math.PI), bread);
    for (const m of [this.loafL, this.loafR]) { m.scale.set(1.6, 0.75, 1); m.castShadow = true; this.root.add(m); }
    { const gl = new THREE.Mesh(new THREE.PlaneGeometry(BAK_WIN.x1 - BAK_WIN.x0, BAK_WIN.y1 - BAK_WIN.y0), new THREE.MeshPhongMaterial({ color: "#b8d4ff", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.12, depthWrite: false })); gl.position.set((BAK_WIN.x0 + BAK_WIN.x1) / 2, D0 + (BAK_WIN.y0 + BAK_WIN.y1) / 2, BAK.z0 - 0.02); gl.layers.set(NOINK); gl.renderOrder = 4; this.root.add(gl);
      for (const [x0, x1, y0, y1] of [[BAK_WIN.x0, BAK_WIN.x1, BAK_WIN.y0 - 0.06, BAK_WIN.y0], [BAK_WIN.x0, BAK_WIN.x1, BAK_WIN.y1, BAK_WIN.y1 + 0.06], [464.95, 465.05, BAK_WIN.y0, BAK_WIN.y1]] as const) fit.add(rbox(V(x0, D0 + y0, BAK.z0 - 0.06), V(x1, D0 + y1, BAK.z0 + 0.04), 0.01), lam("winWood", () => ({ color: "#3a5a4a" }))); }
    // exterior of the bakery + the street + houses opposite
    zW(fit, pic("bakFront", () => rep(brickWarm(), 2, 1)), BAK.x0 - 0.2, BAK_WIN.x0, D0, D0 + 3.6, BAK.z0 - 0.08, -1, [0, 0, 1, 1]); zW(fit, pic("bakFront", () => rep(brickWarm(), 2, 1)), BAK_WIN.x1, BAK.x1 + 0.2, D0, D0 + 3.6, BAK.z0 - 0.08, -1, [0, 0, 1, 1]);
    zW(fit, pic("bakFront", () => rep(brickWarm(), 2, 1)), BAK_WIN.x0, BAK_WIN.x1, D0 + BAK_WIN.y1, D0 + 3.6, BAK.z0 - 0.08, -1, [0, 0, 1, 0.3]); zW(fit, pic("bakFront", () => rep(brickWarm(), 2, 1)), BAK_WIN.x0, BAK_WIN.x1, D0, D0 + BAK_WIN.y0, BAK.z0 - 0.08, -1, [0, 0, 1, 0.3]);
    fit.add(rbox(V(BAK.x0 - 0.3, D0 + 3.6, BAK.z0 - 0.8), V(BAK.x1 + 0.3, D0 + 3.75, BAK.z0 - 0.05), 0.02), lam("awning", () => ({ color: "#c0262e" })));
    zW(fit, lam("bakSign", () => ({ map: ctex("bakSign", 512, 96, (g) => { g.fillStyle = "#2a3a2a"; g.fillRect(0, 0, 512, 96); g.fillStyle = "#e2b84a"; g.font = "900 56px 'Inter Display', Inter, sans-serif"; g.textAlign = "center"; g.fillText("BAKERY", 256, 68); }) })), 462.5, 467.5, D0 + 2.75, D0 + 3.45, BAK.z0 - 0.1, -1, [0, 0, 1, 1]);
    for (const [x0, x1] of [[448, 459.6], [470.4, 482]] as const) fit.add(boxGeo(V(x0, D0, BAK.z0 - 0.2), V(x1, D0 + 6 + (x0 % 3), BAK.z0 + 8), 0), pic("rowHouse", () => rep(brickWarm(), 3, 2)));
    sh.add(quadUp(STREET.x0, STREET.x1, 44, BAK.z0 - 0.2, 10, 3, 0.012), lam("cobble", () => ({ map: rep(cobbleHD(), 6, 2) })));
    for (let i = 0; i < 6; i++) { const x0 = 442 + i * 7.4, h = 7 + (i % 3) * 1.6; fit.add(boxGeo(V(x0, D0, 34), V(x0 + 7, D0 + h, 43)), lam("houseOpp" + (i % 3), () => ({ color: ["#6a7a9a", "#7a6a8a", "#5a6a7a"][i % 3] }))); zW(fit, lam("houseWin" + (i % 2), () => ({ map: rep(lit2("houseWin" + (i % 2), i), 2, 1) })), x0 + 0.5, x0 + 6.5, D0 + 1, D0 + h - 1, 43.02, 1, [0, 0, 2, 1]); }
    // ---------------- practical lights ----------------
    this.Lclock = new THREE.PointLight("#ff3a2a", 0, 2.0, 2); this.Lclock.position.set(CLOCK_B[0], CLOCK_B[1] + 0.05, CLOCK_B[2] - 0.25);
    this.Llamp = new THREE.PointLight("#ffd08a", 0, 5, 2); this.Llamp.position.set(358.8, DESK.y + 0.35, 66.0);
    this.Lholo = new THREE.PointLight("#5ae8ff", 0, 6, 2); this.Lholo.position.copy(new THREE.Vector3(...GLOBE));
    this.Loven = new THREE.PointLight("#ff8a3a", 0, 8, 2); this.Loven.position.set(468, D0 + 1.0, 66.1);
    this.Lsurg = new THREE.PointLight("#f4f8ff", 0, 5, 2); this.Lsurg.position.set(424, D0 + 2.4, 65.2);
    this.Lflash = new THREE.PointLight("#ffffff", 0, 14, 2); this.Lflash.position.set(388, D0 + 2.5, 61.5);
    this.Ldraw = new THREE.PointLight("#ffd060", 0, 1.2, 2);
    this.root.add(this.Lclock, this.Llamp, this.Lholo, this.Loven, this.Lsurg, this.Lflash, this.Ldraw);
    void M; void ray;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  private poseSets(id: number, f: number) {
    // bedroom: duvet (flies off in shot 2), clock, doors
    const off = id === 2 ? clamp01((f - 112) / 14) : id >= 3 && id < 22 ? 1 : 0;
    this.duvet.position.set(305 + 2.2 * off, D0 + 0.78 + 0.9 * Math.sin(Math.PI * Math.min(1, off)) * (id === 2 ? 1 : 0), 68.3 + 0.2 * off); this.duvet.rotation.set(0, 0, -0.9 * off);
    if (id >= 3 && id < 22) { this.duvet.position.set(307.6, D0 + 0.12, 67.0); this.duvet.rotation.set(0, 0.3, 0); }
    if (id === 22) { this.duvet.position.set(305, D0 + 0.7, 67.5); this.duvet.rotation.set(0, 0, 0); }
    const ct = clockB(f), cm = this.clockB.material as THREE.MeshBasicMaterial; if (cm.map !== clockTex(ct)) { cm.map = clockTex(ct); cm.needsUpdate = true; }
    const d = doorsOpen(f); this.doors.forEach((g, i) => { g.rotation.y = (i ? 1 : -1) * 1.7 * d; });
    this.Lclock.intensity = id === 1 || id === 22 ? 0.8 : 0;
    // office: drawer, notes, lamp, hologram
    const dr = drawerOut(f); this.drawer.position.set(357.5, D0 + 0.6, DESK.z0 + 0.06 - 0.42 * dr);
    this.Ldraw.position.set(357.5, D0 + 0.75, DESK.z0 - 0.2); this.Ldraw.intensity = id === 8 ? 0.5 * dr : 0;
    this.note.visible = id === 9 || id === 10;
    this.note2.visible = id === 18 || id === 19;
    const rv = id === 19 ? q2(clamp01((f - 926) / 26)) : 1, nm = this.note2.material as THREE.MeshLambertMaterial, nt = noteTex("note2", ["TOMORROW.", "SAME PLACE.", "LEAVE A SIGN."], rv);
    if (nm.map !== nt) { nm.map = nt; nm.needsUpdate = true; }
    const flick = id === 11 ? (Math.floor(f / 2) % 5 === 0 && f < 640 ? 0.1 : 1) : 1;
    this.Llamp.intensity = id >= 8 && id <= 13 || id === 18 || id === 19 ? 0.9 * flick : id === 14 ? 0.3 : 0;
    this.globe.visible = id === 14; this.globe.rotation.y = f * 0.06; this.Lholo.intensity = id === 14 ? 1.6 : 0;
    // press flashes, OR lamp, oven, the boat bobbing, the loaf
    this.Lflash.intensity = id === 20 && [960, 972, 985, 991, 1003, 1012].some((k) => f >= k && f < k + 2) ? 25 : 0;
    this.Lsurg.intensity = id === 15 ? 3.5 : 0;
    this.Loven.intensity = id >= 23 ? 2.2 * (0.92 + 0.08 * Math.sin(f * 0.4)) : 0;
    this.boat.position.y = BOAT[1] + 0.06 * Math.sin(f * 0.08); this.boat.rotation.z = 0.03 * Math.sin(f * 0.06);
    const br = id === 24 ? clamp01((f - 1215) / 12) : id > 24 ? 1 : 0;
    this.loafL.position.set(464.6 - 0.12 * br, D0 + 1.07, 65.6); this.loafR.position.set(464.6 + 0.12 * br, D0 + 1.07, 65.6);
    this.loafL.rotation.set(0, 0, 0.5 * br); this.loafR.rotation.set(0, 0, -0.5 * br);
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
