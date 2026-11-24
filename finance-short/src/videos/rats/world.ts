// The river town as one three.js scene, with this film's sets on the far-bank meadow: the boulevard of French Hanoi,
// the sewer, a villa bathroom, the bounty office and a rat farm. People and rats are real 3D figures (fig3d.ts). update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { Batch, boxGeo, rbox, shiny, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen, fxPoster } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, ROAD, WALK_W, WALK_E, CURB, VILLA_Z, MAN, LAMP, CRATE, CRATE_H, POSTER, DRAINS,
  SEWER, LEDGE_H, BATH, DRAIN_B, CHAIR, SEAT_H, OFFICE, DESK, COUNTER, BOARD, FARM, HUT, CAGES, lidAt,
} from "./story";
import { FigPool } from "./fig3d";

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
  1: { az: 165, el: 26 }, 2: { az: 120, el: 40 }, 3: { az: 140, el: 30 }, 4: { az: 135, el: 45 }, 5: { az: 135, el: 45 }, 6: { az: 120, el: 40 },
  7: { az: 135, el: 45 }, 8: { az: 130, el: 45 }, 9: { az: 125, el: 38 }, 10: { az: 140, el: 30 }, 11: { az: 150, el: 18 }, 12: { az: 200, el: 24 },
  13: { az: 135, el: 45 }, 14: { az: 165, el: 26 },
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
/** a villa facade: ochre stucco, two floors of tall windows with green shutters, white trim, a door */
const facadeTex = (key: string, wall: string, shut: string, door: boolean) => ctex(key, 640, 448, (g, r) => {
  g.fillStyle = wall; g.fillRect(0, 0, 640, 448);
  for (let i = 0; i < 50; i++) { const x = r() * 640, y = r() * 448, rad = 20 + r() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(120,80,30,0.07)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); }
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 214, 640, 12); g.fillRect(0, 0, 640, 14);
  for (const [y0, h] of [[56, 120], [262, 150]] as const) for (let k = 0; k < 4; k++) {
    const x = 48 + k * 152;
    if (door && y0 > 200 && k === 1) { g.fillStyle = "#5a3a26"; g.fillRect(x + 8, y0 - 10, 76, h + 30); g.fillStyle = "#f4ecd8"; g.fillRect(x, y0 - 18, 92, 10); continue; }
    g.fillStyle = "#f4ecd8"; g.fillRect(x - 6, y0 - 6, 104, h + 12);
    g.fillStyle = "#2b3440"; g.fillRect(x + 22, y0, 48, h);
    for (const sx of [x, x + 70]) { g.fillStyle = shut; g.fillRect(sx, y0, 22, h); g.fillStyle = "rgba(0,0,0,0.25)"; for (let yy = y0 + 6; yy < y0 + h; yy += 9) g.fillRect(sx + 2, yy, 18, 3); }
    if (y0 < 200) { g.fillStyle = "#3a3a40"; g.fillRect(x - 10, y0 + h + 4, 112, 6); for (let k2 = 0; k2 < 8; k2++) g.fillRect(x - 8 + k2 * 15, y0 + h - 20, 3, 26); }
  }
});
const roofTileTex = () => ctex("ratRoof", 256, 256, (g, r) => {
  g.fillStyle = "#b9533a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) { g.fillStyle = "rgba(60,20,10,0.35)"; g.fillRect(0, y, 256, 3); for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) { g.fillStyle = jit(r, "#c8603f", 0.06, 3, 0.08); g.fillRect(x + 2, y + 3, 28, 12); } }
});
const roadTex = () => ctex("ratRoad", 1024, 1024, (g, r) => {
  g.fillStyle = "#b7a68a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,90,60,0.16)" : "rgba(255,245,220,0.16)"; g.fillRect(r() * 1024, r() * 1024, 4 + r() * 16, 3 + r() * 6); }
});
const brickTex = () => ctex("sewerBrick", 512, 512, (g, r) => {
  g.fillStyle = "#3e3a36"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = jit(r, "#7a5a44", 0.1, 4, 0.12); g.fillRect(x + 3, y + 3, 58, 26); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(40,70,50,0.18)"; g.beginPath(); g.ellipse(r() * 512, 380 + r() * 132, 40 + r() * 60, 20, 0, 0, 7); g.fill(); }
});
const chalkTex = () => ctex("chalkboard", 512, 256, (g, r) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,0.04)"; g.fillRect(r() * 512, r() * 256, 60 + r() * 80, 10 + r() * 20); }
  g.strokeStyle = "#7a5534"; g.lineWidth = 18; g.strokeRect(0, 0, 512, 256);
});
const barsTex = () => ctex("cageBars", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.fillStyle = "#3a3a40";
  for (let x = 0; x <= 256; x += 32) g.fillRect(x - 3, 0, 6, 256);
  g.fillRect(0, 0, 256, 10); g.fillRect(0, 246, 256, 10);
});
const thatchTex = () => ctex("thatch", 256, 256, (g, r) => {
  g.fillStyle = "#c8a85a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { g.strokeStyle = r() < 0.5 ? "rgba(120,90,40,0.35)" : "rgba(255,235,170,0.3)"; g.lineWidth = 2; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y + 20 + r() * 20); g.stroke(); }
});
const paddyTex = () => ctex("paddy", 512, 512, (g, r) => {
  g.fillStyle = "#7dbb5a"; g.fillRect(0, 0, 512, 512);
  for (let y = 6; y < 512; y += 14) for (let x = 6; x < 512; x += 14) { g.fillStyle = jit(r, "#5e9f45", 0.1, 3, 0.1); g.fillRect(x + r() * 3, y, 3, 9); }
});
const bathTile = () => floorTex("bathTile", "#f2f4f6", "#dfe9f2", 10, "rgba(70,100,130,0.3)");
const officeWin = () => ctex("ratWindow", 512, 768, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 768); gr.addColorStop(0, "#9cc4ea"); gr.addColorStop(1, "#eef4f8"); g.fillStyle = gr; g.fillRect(0, 0, 512, 768);
  g.fillStyle = "#6fa25a"; g.fillRect(0, 560, 512, 208); g.fillStyle = "#4f8a46"; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(60 + i * 100, 560, 70, 0, 7); g.fill(); }
  g.strokeStyle = "#ffffff"; g.lineWidth = 18; g.strokeRect(0, 0, 512, 768); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 768); g.moveTo(0, 384); g.lineTo(512, 384); g.stroke();
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
  private lid!: THREE.Mesh;
  private figs!: FigPool;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    this.figs = new FigPool(R);
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
    const white = lam("rtWhite", () => ({ color: "#f1f2f4" }));
    const wood = lam("rtWood", () => ({ color: "#7a5236" }));
    const iron = shiny("rtIron", "#34363e", "#6a6e78", 40);
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.2) });
    const glowAt = (p: V3, r: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), glow); m.position.set(...p); m.layers.set(NOINK); this.root.add(m); };
    const Y = D0 + CURB;
    // ---- the boulevard ----
    sh.add(quadUp(ROAD.x0, ROAD.x1, ROAD.z0, ROAD.z1, 2, 8, 0.008), lam("ratRoad", () => ({ map: roadTex() })));
    const pave = lam("ratPave", () => ({ map: floorTex("ratPave", "#d9d2c4", "#cfc7b8", 8, "rgba(90,80,70,0.3)") }));
    for (const w of [WALK_W, WALK_E]) fit.add(rbox(V(w.x0, D0 - 0.2, ROAD.z0), V(w.x1, Y, ROAD.z1), 0.04), pave);
    const shutters = ["#3f7a5a", "#2f6a7a", "#4f7a3a"], walls = ["#e8c46a", "#efd9a0", "#e7b98a", "#f0d27a"];
    const roof = lam("ratRoof", () => ({ map: rep(roofTileTex(), 3, 3) }));
    VILLA_Z.forEach((z, i) => {
      for (const side of [-1, 1]) {
        const k = (i * 2 + (side > 0 ? 1 : 0)) % 4, x0 = side < 0 ? WALK_W.x0 - 10 : WALK_E.x1, x1 = x0 + 10, h = 7 + (k % 2) * 1.2;
        const face = lam(`villa${k}`, () => ({ map: facadeTex(`villa${k}`, walls[k], shutters[k % 3], true) }));
        const plain = lam(`villaW${k}`, () => ({ color: walls[k] }));
        fit.add(boxGeo(V(x0, D0, z - 5), V(x1, D0 + h, z + 5)), plain);
        const fx = side < 0 ? x1 + 0.02 : x0 - 0.02;
        fit.add(side < 0 ? quad(V(fx, D0, z - 5), V(fx, D0, z + 5), V(fx, D0 + h, z + 5), V(fx, D0 + h, z - 5)) : quad(V(fx, D0, z + 5), V(fx, D0, z - 5), V(fx, D0 + h, z - 5), V(fx, D0 + h, z + 5)), face);
        const rf = new THREE.ConeGeometry(7.6, 3.2, 4, 1); rf.rotateY(Math.PI / 4);
        fit.add(rf, roof, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, D0 + h + 1.6, z));
        fit.add(rbox(V(fx - side * 0.35 - 0.35, D0 + 3.5, z - 3.2), V(fx - side * 0.35 + 0.35, D0 + 3.65, z + 3.2), 0.04), white); // balcony ledge
      }
    });
    // trees along the sidewalks
    const trunk = lam("ratTrunk", () => ({ color: "#6b4a34" })), leaf = [lam("ratLeafA", () => ({ color: "#5aa24a" })), lam("ratLeafB", () => ({ color: "#4a9142" }))];
    for (const [x, z] of [[289.2, 70], [289.2, 82], [289.2, 106], [289.2, 118], [302.8, 70], [302.8, 82], [302.8, 118], [302.8, 130], [289.2, 130]] as const) {
      fit.add(new THREE.CylinderGeometry(0.16, 0.22, 4.2, 10), trunk, new THREE.Matrix4().makeTranslation(x, Y + 2.1, z));
      for (const [dx, dy, dz, r] of [[0, 4.6, 0, 1.6], [0.9, 4.1, 0.5, 1.1], [-0.8, 4.2, -0.6, 1.2], [0.2, 5.4, -0.3, 1.1]] as const)
        fit.add(new THREE.SphereGeometry(r, 16, 12), leaf[(dx > 0 ? 1 : 0)], new THREE.Matrix4().makeTranslation(x + dx, Y + dy, z + dz));
    }
    // street lamps (the hook lamp is LAMP)
    for (const z of [80, 104.6, 128]) {
      const x = LAMP[0];
      fit.add(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 10), iron, new THREE.Matrix4().makeTranslation(x, Y + 1.8, z));
      fit.add(rbox(V(x - 0.17, Y + 3.55, z - 0.17), V(x + 0.17, Y + 3.62, z + 0.17), 0.02), iron);
      fit.add(new THREE.ConeGeometry(0.26, 0.2, 4), iron, new THREE.Matrix4().makeTranslation(x, Y + 4.12, z));
      glowAt([x, Y + 3.82, z], 0.15);
    }
    // the manhole: dark hole, iron rim, a lid that slides (poseSets)
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: "#0b0a0e" }));
    hole.rotation.x = -Math.PI / 2; hole.position.set(MAN[0], D0 + 0.012, MAN[2]); hole.layers.set(NOINK); this.root.add(hole);
    const rim = new THREE.TorusGeometry(0.52, 0.04, 8, 32); rim.rotateX(Math.PI / 2);
    fit.add(rim, iron, new THREE.Matrix4().makeTranslation(MAN[0], D0 + 0.015, MAN[2]));
    this.lid = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32), shiny("rtLid", "#4a4c54", "#8a8e98", 30));
    this.lid.castShadow = this.lid.receiveShadow = true; this.root.add(this.lid);
    // the crate + coin pile under the hook lamp
    fit.add(rbox(V(CRATE[0] - 0.32, D0, CRATE[2] - 0.26), V(CRATE[0] + 0.32, D0 + CRATE_H, CRATE[2] + 0.26), 0.035), lam("ratCrate", () => ({ color: "#b5824a" })));
    const gold = shiny("rtCoin", "#e8bf45", "#fff1b0", 60);
    for (let i = 0; i < 9; i++) fit.add(new THREE.CylinderGeometry(0.05, 0.05, 0.014, 20), gold, new THREE.Matrix4().makeTranslation(CRATE[0] + 0.17 + (i > 5 ? 0.09 : 0), D0 + CRATE_H + 0.008 + (i % 6) * 0.015, CRATE[2] + 0.06 - (i > 5 ? 0.06 : 0)));
    // curb drains (eyes glow inside them in shot 12)
    for (const d of DRAINS) fit.add(rbox(V(d[0] - 0.01, D0 + 0.005, d[2] - 0.32), V(d[0] + 0.03, D0 + 0.13, d[2] + 0.32), 0.01), lam("ratDrain", () => ({ color: "#14121a" })));
    // ---- the sewer ----
    const brick = lam("sewerBrick", () => ({ map: rep(brickTex(), 1, 1) }));
    this.room(sh, SEWER, brick, lam("sewerFloor", () => ({ color: "#3a3c3e" })), lam("sewerCeil", () => ({ color: "#2e2a28" })), 2);
    const ledge = lam("sewerLedge", () => ({ color: "#8c8378" }));
    fit.add(rbox(V(SEWER.x0, D0, SEWER.z0), V(SEWER.x0 + 2, D0 + LEDGE_H, SEWER.z1), 0.05), ledge);
    fit.add(rbox(V(SEWER.x1 - 2, D0, SEWER.z0), V(SEWER.x1, D0 + LEDGE_H, SEWER.z1), 0.05), ledge);
    sh.add(quadUp(SEWER.x0 + 2, SEWER.x1 - 2, SEWER.z0, SEWER.z1, 1, 1, 0.12), shiny("sewerWater", "#2c4a44", "#9fc4b8", 80));
    for (const s of [-1, 1]) fit.add(new THREE.CylinderGeometry(0.14, 0.14, SEWER.z1 - SEWER.z0, 12).rotateX(Math.PI / 2), shiny("sewerPipe", "#5a6a5a", "#9aa89a", 30), new THREE.Matrix4().makeTranslation(s < 0 ? SEWER.x0 + 0.25 : SEWER.x1 - 0.25, D0 + 2.9, (SEWER.z0 + SEWER.z1) / 2));
    for (let z = 60; z < 100; z += 8) for (const s of [-1, 1]) {
      const x = s < 0 ? SEWER.x0 + 0.12 : SEWER.x1 - 0.12;
      fit.add(rbox(V(x - 0.1, D0 + 2.0, z - 0.1), V(x + 0.1, D0 + 2.3, z + 0.1), 0.03), iron);
      glowAt([x - s * 0.08, D0 + 2.2, z], 0.1);
    }
    for (const x of [SEWER.x0 + 0.7, SEWER.x0 + 1.3]) fit.add(new THREE.CylinderGeometry(0.03, 0.03, SEWER.h, 8), iron, new THREE.Matrix4().makeTranslation(x, D0 + SEWER.h / 2, SEWER.z0 + 0.25));
    for (let y = 0.4; y < SEWER.h; y += 0.35) fit.add(new THREE.CylinderGeometry(0.022, 0.022, 0.6, 6).rotateZ(Math.PI / 2), iron, new THREE.Matrix4().makeTranslation(SEWER.x0 + 1.0, D0 + y, SEWER.z0 + 0.25));
    // ---- the villa bathroom ----
    this.room(sh, BATH, lam("bathWall", () => ({ map: bathTile() })), lam("bathFloor", () => ({ map: floorTex("bathFloorT", "#2c3444", "#e8e6e0", 8) })), white, 2);
    const enamel = shiny("bathEnamel", "#f6f6f2", "#ffffff", 70);
    fit.add(rbox(V(363.4, D0 + 0.12, 60.4), V(365.8, D0 + 0.7, 61.9), 0.22), enamel);
    for (const [x, z] of [[363.6, 60.6], [365.6, 60.6], [363.6, 61.7], [365.6, 61.7]]) fit.add(new THREE.SphereGeometry(0.08, 12, 8), shiny("bathGold", "#d9b04a", "#fff0b0", 60), new THREE.Matrix4().makeTranslation(x, D0 + 0.08, z));
    fit.add(new THREE.CircleGeometry(0.16, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#0e0c10" }), new THREE.Matrix4().makeTranslation(DRAIN_B[0], D0 + 0.014, DRAIN_B[2]));
    const grate = new THREE.TorusGeometry(0.17, 0.022, 6, 24); grate.rotateX(Math.PI / 2);
    fit.add(grate, shiny("bathChrome", "#c9ccd4", "#ffffff", 80), new THREE.Matrix4().makeTranslation(DRAIN_B[0], D0 + 0.016, DRAIN_B[2]));
    const chairW = lam("chairWood", () => ({ color: "#8a5a3a" }));
    fit.add(rbox(V(CHAIR[0] - 0.24, D0 + SEAT_H - 0.05, CHAIR[2] - 0.24), V(CHAIR[0] + 0.24, D0 + SEAT_H, CHAIR[2] + 0.24), 0.02), chairW);
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) fit.add(rbox(V(CHAIR[0] + dx - 0.025, D0, CHAIR[2] + dz - 0.025), V(CHAIR[0] + dx + 0.025, D0 + SEAT_H - 0.05, CHAIR[2] + dz + 0.025), 0.01), chairW);
    fit.add(rbox(V(CHAIR[0] - 0.24, D0 + SEAT_H, CHAIR[2] + 0.2), V(CHAIR[0] + 0.24, D0 + SEAT_H + 0.5, CHAIR[2] + 0.25), 0.02), chairW);
    fit.add(quad(V(BATH.x0 + 0.02, D0 + 1.0, 57.4), V(BATH.x0 + 0.02, D0 + 1.0, 58.8), V(BATH.x0 + 0.02, D0 + 2.6, 58.8), V(BATH.x0 + 0.02, D0 + 2.6, 57.4)), lam("ratWindow", () => ({ map: officeWin() })));
    fit.add(rbox(V(364.0, D0 + 1.5, BATH.z1 - 0.06), V(365.2, D0 + 2.4, BATH.z1 - 0.02), 0.03), shiny("bathMirror", "#b9d4e6", "#ffffff", 90));
    // ---- the bounty office ----
    this.room(sh, OFFICE, lam("offWall", () => ({ map: wallTex("offWall", "#efe2c4", "#7a5236", OFFICE.h) })),
      lam("offFloor", () => ({ map: floorTex("offFloor", "#9a6e48", "#8f6442", 8, "rgba(40,25,15,0.25)") })), lam("offCeil", () => ({ color: "#f6f1e4" })));
    fit.add(rbox(V(COUNTER.x0, D0, COUNTER.z0), V(COUNTER.x1, COUNTER.y, COUNTER.z1), 0.06), wood);
    fit.add(rbox(V(COUNTER.x0 - 0.05, COUNTER.y - 0.05, COUNTER.z0 - 0.08), V(COUNTER.x1 + 0.05, COUNTER.y + 0.03, COUNTER.z1 + 0.05), 0.02), lam("ctrTop", () => ({ color: "#5a3a26" })));
    fit.add(rbox(V(DESK.x0, D0, DESK.z0), V(DESK.x1, DESK.y, DESK.z1), 0.06), wood);
    fit.add(rbox(V(BOARD.x0 - 0.08, BOARD.y0 - 0.08, BOARD.z - 0.06), V(BOARD.x1 + 0.08, BOARD.y1 + 0.08, BOARD.z), 0.03), lam("boardFrame", () => ({ color: "#7a5534" })));
    fit.add(quad(V(BOARD.x1, BOARD.y0, BOARD.z - 0.07), V(BOARD.x0, BOARD.y0, BOARD.z - 0.07), V(BOARD.x0, BOARD.y1, BOARD.z - 0.07), V(BOARD.x1, BOARD.y1, BOARD.z - 0.07)), lam("chalk", () => ({ map: chalkTex() })));
    for (const x of [380.5, 381.3]) fit.add(rbox(V(x - 0.35, D0, 66.8), V(x + 0.35, D0 + 1.5, 67.9), 0.05), shiny("cabinet", "#5f6b5a", "#9aa49a", 30));
    fit.add(new THREE.CylinderGeometry(0.22, 0.18, 0.3, 18), lam("basket", () => ({ color: "#c9a25a" })), new THREE.Matrix4().makeTranslation(386.8, COUNTER.y + 0.15, 63.0));
    for (const z of [58.5, 61.5, 64.5]) fit.add(quad(V(OFFICE.x1 - 0.02, D0 + 1.0, z + 0.9), V(OFFICE.x1 - 0.02, D0 + 1.0, z - 0.9), V(OFFICE.x1 - 0.02, D0 + 3.2, z - 0.9), V(OFFICE.x1 - 0.02, D0 + 3.2, z + 0.9)), lam("ratWindow", () => ({ map: officeWin() })));
    fit.add(quad(V(388.9, D0 + 1.2, OFFICE.z1 - 0.02), V(387.8, D0 + 1.2, OFFICE.z1 - 0.02), V(387.8, D0 + 2.9, OFFICE.z1 - 0.02), V(388.9, D0 + 2.9, OFFICE.z1 - 0.02)), lam("flagFR", () => ({ map: ctex("flagFR", 300, 400, (g) => { g.fillStyle = "#2f4a9a"; g.fillRect(0, 0, 100, 400); g.fillStyle = "#f4f4f4"; g.fillRect(100, 0, 100, 400); g.fillStyle = "#d8343a"; g.fillRect(200, 0, 100, 400); }) })));
    // ---- the rat farm ----
    sh.add(quadUp(FARM.x0, FARM.x1, FARM.z0, FARM.z1, 6, 6, 0.006), lam("farmDirt", () => ({ map: ctex("farmDirt", 512, 512, (g, r) => { g.fillStyle = "#a07a52"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(80,55,30,0.2)" : "rgba(220,190,140,0.2)"; g.fillRect(r() * 512, r() * 512, 4 + r() * 10, 3 + r() * 5); } }) })));
    for (const [x0, x1, z0, z1] of [[FARM.x0, 440, 155, FARM.z1], [462, FARM.x1, FARM.z0, FARM.z1], [FARM.x0, 438, FARM.z0, 140]] as const)
      sh.add(quadUp(x0, x1, z0, z1, 2, 2, 0.014), lam("paddy", () => ({ map: paddyTex() })));
    fit.add(boxGeo(V(HUT.x0, D0, HUT.z0), V(HUT.x1, D0 + HUT.h, HUT.z1), 2), lam("hutWall", () => ({ color: "#c9a878" })));
    const hr = new THREE.ConeGeometry(5.0, 2.6, 4, 1); hr.rotateY(Math.PI / 4);
    fit.add(hr, lam("thatch", () => ({ map: rep(thatchTex(), 2, 2) })), new THREE.Matrix4().makeTranslation((HUT.x0 + HUT.x1) / 2, D0 + HUT.h + 1.3, (HUT.z0 + HUT.z1) / 2));
    fit.add(rbox(V(454.2, D0, HUT.z0 - 0.02), V(455.6, D0 + 1.9, HUT.z0 + 0.02), 0.03), lam("hutDoor", () => ({ color: "#5a3a26" })));
    const cageWood = lam("cageWood", () => ({ color: "#9a6a3e" }));
    const bars = new THREE.MeshLambertMaterial({ map: barsTex(), alphaTest: 0.5, side: THREE.DoubleSide, transparent: false });
    twoTone(bars);
    for (const c of CAGES) {
      fit.add(rbox(V(c[0] - 0.55, c[1], c[2] - 0.4), V(c[0] + 0.55, c[1] + 0.06, c[2] + 0.4), 0.02), cageWood);
      fit.add(rbox(V(c[0] - 0.55, c[1] + 0.54, c[2] - 0.4), V(c[0] + 0.55, c[1] + 0.6, c[2] + 0.4), 0.02), cageWood);
      fit.add(quad(V(c[0] - 0.55, c[1] + 0.06, c[2] - 0.4), V(c[0] + 0.55, c[1] + 0.06, c[2] - 0.4), V(c[0] + 0.55, c[1] + 0.54, c[2] - 0.4), V(c[0] - 0.55, c[1] + 0.54, c[2] - 0.4), 2, 1), bars);
      for (const s of [-1, 1]) fit.add(rbox(V(c[0] + s * 0.55 - 0.03, c[1], c[2] - 0.42), V(c[0] + s * 0.55 + 0.03, c[1] + 0.6, c[2] + 0.42), 0.01), cageWood);
    }
    fit.add(rbox(V(443.6, D0, 150.0), V(448.8, D0 + 1.24, 150.3), 0.03), cageWood);
    for (let x = 432; x < 470; x += 2.4) fit.add(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 8), cageWood, new THREE.Matrix4().makeTranslation(x, D0 + 0.55, 138));
    for (const [x, z] of [[436, 160], [466, 148], [470, 165], [440, 172]] as const) {
      fit.add(new THREE.CylinderGeometry(0.14, 0.2, 6, 10), trunk, new THREE.Matrix4().makeTranslation(x, D0 + 3, z));
      for (let k = 0; k < 6; k++) { const l = new THREE.SphereGeometry(1.4, 10, 6); l.scale(1, 0.18, 0.42); l.rotateY((k / 6) * Math.PI * 2); l.translate(Math.cos((k / 6) * Math.PI * 2) * 1.1, 0, -Math.sin((k / 6) * Math.PI * 2) * 1.1); fit.add(l, leaf[k % 2], new THREE.Matrix4().makeTranslation(x, D0 + 6, z)); }
    }
    // the bounty poster on the east villa (gets the CANCELLED stamp in shot 12)
    const poster = lam("ratPoster", () => ({ map: ctex("ratPoster", 360, 480, (g) => fxPoster(new Pen(g))) }));
    fit.add(quad(V(POSTER[0] - 0.03, POSTER[1] - 0.8, POSTER[2] - 0.6), V(POSTER[0] - 0.03, POSTER[1] - 0.8, POSTER[2] + 0.6), V(POSTER[0] - 0.03, POSTER[1] + 0.8, POSTER[2] + 0.6), V(POSTER[0] - 0.03, POSTER[1] + 0.8, POSTER[2] - 0.6)), poster);
    void M;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  private poseSets(id: number, f: number) {
    const u = lidAt(id, f);
    this.lid.position.set(MAN[0] - 0.95 * u, D0 + 0.04 + 0.05 * Math.sin(Math.PI * u), MAN[2] + 0.25 * u);
    this.lid.rotation.set(0, 0, 0.12 * Math.sin(Math.PI * u));
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
    this.poseSets(id, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, f, { pos: cam.position, right });
    this.figs.apply(st.figs);
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
