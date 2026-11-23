// The river town as one three.js scene, with this film's sets on the far-bank meadow: Carlsbad Caverns, the
// President's office, the lab with its fridge, the desert test base (hangar, fuel tank, flagpole, crates) and a
// street of wooden houses. update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { Batch, boxGeo, rbox, shiny, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, CAVE, OFFICE, DESK, LAB, BENCH, FRIDGE, BASE, HANGAR, TANK, TANK_R, TANK_LEG,
  TANK_H, POLE, POLE_H, CRATES, STREET, HOUSES, fridgeDoor,
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
  1: { az: 20, el: 9 }, 2: { az: 150, el: 45 }, 3: { az: 130, el: 45 }, 4: { az: 140, el: 50 }, 5: { az: 140, el: 50 }, 6: { az: 140, el: 50 },
  7: { az: 150, el: 12 }, 8: { az: 150, el: 12 }, 9: { az: 150, el: 12 }, 10: { az: 130, el: 45 }, 11: { az: 125, el: 45 }, 12: { az: 160, el: 13 },
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
const rockTex = () => ctex("caveRock", 1024, 1024, (g, r) => {
  g.fillStyle = "#5a4636"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 160; i++) { const x = r() * 1024, y = r() * 1024, a = 40 + r() * 120; g.fillStyle = jit(r, i % 2 ? "#6b5442" : "#4a3a2e", 0.08, 4, 0.1); g.beginPath(); g.ellipse(x, y, a, a * 0.6, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(25,18,14,0.5)"; g.lineWidth = 5;
  for (let i = 0; i < 40; i++) { g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
});
const sandTex = () => ctex("sand", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9b98a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(160,120,80,0.18)" : "rgba(255,240,210,0.18)"; g.fillRect(r() * 1024, r() * 1024, 6 + r() * 20, 3 + r() * 6); }
});
const hangarTex = () => ctex("hangarMetal", 512, 512, (g) => {
  g.fillStyle = "#9aa3a8"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = x % 64 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)"; g.fillRect(x, 0, 16, 512); }
});
const hangarDoorTex = () => ctex("hangarDoor", 1024, 512, (g) => {
  g.fillStyle = "#7f8a90"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 4; i++) { g.strokeStyle = "rgba(30,30,35,0.6)"; g.lineWidth = 8; g.strokeRect(i * 256 + 8, 8, 240, 496); }
  txt(g, "U.S. ARMY", 512, 90, 70, "#ffffff", 900);
});
const paperWallTex = () => ctex("shoji", 256, 256, (g) => {
  g.fillStyle = "#f1e6cc"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#6b4a34"; g.lineWidth = 8; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
});
const officeWin = () => ctex("ovalWindow", 512, 768, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 768); gr.addColorStop(0, "#9cc4ea"); gr.addColorStop(1, "#e7f0f8"); g.fillStyle = gr; g.fillRect(0, 0, 512, 768);
  g.fillStyle = "#6fa25a"; g.fillRect(0, 600, 512, 168);
  g.strokeStyle = "#ffffff"; g.lineWidth = 18; g.strokeRect(0, 0, 512, 768); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 768); g.moveTo(0, 384); g.lineTo(512, 384); g.stroke();
});
const tileTex = () => floorTex("labTile", "#e6efe8", "#dfe8e1", 8, "rgba(80,110,90,0.25)");

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
  private fridge!: { pivot: THREE.Group; yaw0: number; dir: number };
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
    const white = lam("bbWhite", () => ({ color: "#f1f2f4" }));
    const wood = lam("bbWood", () => ({ color: "#6b4630" }));
    const dark = lam("bbDark", () => ({ color: "#2a2d36" }));
    // ---- Carlsbad Caverns: rock walls, stalactites and stalagmites ----
    const rock = lam("caveRock", () => ({ map: rockTex() }));
    this.room(sh, CAVE, rock, rock, rock, 6);
    const drip = lam("dripstone", () => ({ color: "#8a7258" }));
    for (let i = 0; i < 46; i++) {
      const hx = Math.sin(i * 12.9898) * 43758.5, hz = Math.sin(i * 78.233) * 12345.6, hx1 = hx - Math.floor(hx), hz1 = hz - Math.floor(hz);
      const x = CAVE.x0 + 1 + hx1 * (CAVE.x1 - CAVE.x0 - 2), z = CAVE.z0 + 3 + hz1 * (CAVE.z1 - CAVE.z0 - 4), L = 0.6 + 1.6 * ((hx1 * 7) % 1);
      if (Math.abs(x - 290.2) < 1.2 && z < 66.5) continue;
      const up = i % 3 === 0;
      const g = new THREE.ConeGeometry(0.16 + 0.22 * ((hz1 * 5) % 1), L, 8);
      if (!up) g.rotateX(Math.PI);
      fit.add(g, drip, new THREE.Matrix4().makeTranslation(x, up ? D0 + L / 2 : D0 + CAVE.h - L / 2, z));
    }
    // ---- the President's office ----
    this.room(sh, OFFICE, lam("ovalWall", () => ({ map: wallTex("ovalWall", "#efe6cf", "#c9b88f", OFFICE.h) })),
      lam("ovalFloor", () => ({ map: floorTex("ovalFloor", "#8a6a4a", "#7f6044", 8, "rgba(40,25,15,0.25)") })), lam("ovalCeil", () => ({ color: "#f6f1e4" })));
    const rug = new THREE.CircleGeometry(1, 40); rug.rotateX(-Math.PI / 2); rug.scale(4.2, 1, 3.0);
    fit.add(rug, lam("ovalRug", () => ({ color: "#2f4a8a" })), new THREE.Matrix4().makeTranslation(328, D0 + 0.02, 62.4));
    fit.add(rbox(V(DESK.x0, D0, DESK.z0), V(DESK.x1, DESK.y, DESK.z1), 0.08), wood);
    for (const x of [324.6, 331.4]) {
      fit.add(quad(V(x + 0.9, D0 + 0.9, OFFICE.z1 - 0.02), V(x - 0.9, D0 + 0.9, OFFICE.z1 - 0.02), V(x - 0.9, D0 + 3.6, OFFICE.z1 - 0.02), V(x + 0.9, D0 + 3.6, OFFICE.z1 - 0.02)), lam("ovalWindow", () => ({ map: officeWin() })));
      for (const s of [-1, 1]) fit.add(rbox(V(x + s * 1.0 - 0.18, D0, OFFICE.z1 - 0.25), V(x + s * 1.0 + 0.18, D0 + 3.9, OFFICE.z1 - 0.05), 0.09), lam("drape", () => ({ color: "#a8242c" })));
    }
    fit.add(boxGeo(V(326.9, DESK.y, 63.6), V(327.4, DESK.y + 0.06, 64.0)), lam("blotter", () => ({ color: "#1f3a2a" })));
    // ---- the lab: tiled walls, a bench with flasks, the fridge ----
    this.room(sh, LAB, lam("labWall", () => ({ map: tileTex() })), lam("labFloor", () => ({ map: floorTex("labFloorB", "#c9c6bd", "#bfbcb2", 6) })), lam("labCeil", () => ({ color: "#f4f6f4" })), 3);
    fit.add(rbox(V(BENCH.x0, BENCH.y - 0.06, BENCH.z0), V(BENCH.x1, BENCH.y, BENCH.z1), 0.025), shiny("benchTop", "#2b2c33", "#9aa0aa", 40));
    fit.add(rbox(V(BENCH.x0, D0, BENCH.z0 + 0.1), V(BENCH.x1, BENCH.y - 0.06, BENCH.z1), 0.05), white);
    const glass = shiny("flask", "#9fd6c8", "#ffffff", 90), liquid = [lam("liqA", () => ({ color: "#ff8a3a" })), lam("liqB", () => ({ color: "#7ac35a" }))];
    for (let i = 0; i < 6; i++) {
      const x = BENCH.x0 + 0.8 + i * 1.2;
      fit.add(new THREE.CylinderGeometry(0.06, 0.16, 0.3, 14), glass, new THREE.Matrix4().makeTranslation(x, BENCH.y + 0.15, 64.45));
      fit.add(new THREE.CylinderGeometry(0.12, 0.155, 0.12, 14), liquid[i % 2], new THREE.Matrix4().makeTranslation(x, BENCH.y + 0.07, 64.45));
    }
    fit.add(rbox(V(FRIDGE.x0, D0, FRIDGE.z0), V(FRIDGE.x1, D0 + FRIDGE.h, FRIDGE.z1), 0.12), shiny("fridgeBody", "#eef0f2", "#c8ccd2", 50));
    fit.add(quad(V(FRIDGE.x1 - 0.06, D0 + 0.08, FRIDGE.z0 - 0.01), V(FRIDGE.x0 + 0.06, D0 + 0.08, FRIDGE.z0 - 0.01), V(FRIDGE.x0 + 0.06, D0 + FRIDGE.h - 0.08, FRIDGE.z0 - 0.01), V(FRIDGE.x1 - 0.06, D0 + FRIDGE.h - 0.08, FRIDGE.z0 - 0.01)), lam("fridgeIn", () => ({ color: "#cfe6f2" })));
    for (const y of [0.55, 1.0, 1.45]) fit.add(boxGeo(V(FRIDGE.x0 + 0.06, D0 + y, FRIDGE.z0 - 0.02), V(FRIDGE.x1 - 0.06, D0 + y + 0.03, FRIDGE.z0 + 0.4)), lam("shelf", () => ({ color: "#b9c4cc" })));
    this.fridge = this.door(null, FRIDGE.x1 - FRIDGE.x0, FRIDGE.h, [FRIDGE.x0, D0, FRIDGE.z0 - 0.03], 0, 1);
    // ---- the desert test base ----
    sh.add(quadUp(BASE.x0, BASE.x1, BASE.z0, BASE.z1, 12, 12, 0.006), lam("sand", () => ({ map: sandTex() })));
    sh.add(quadUp(BASE.x0, BASE.x1, 117, 123, 30, 1, 0.012), lam("runway", () => ({ color: "#4a4a52" })));
    const metal = lam("hangarMetal", () => ({ map: hangarTex() }));
    const { x0, x1, z0, z1, h } = HANGAR, cx = (x0 + x1) / 2, R = (x1 - x0) / 2;
    const arch = new THREE.CylinderGeometry(R, R, z1 - z0, 32, 1, true, -Math.PI / 2, Math.PI); arch.rotateX(Math.PI / 2); arch.scale(1, 0.5, 1);
    fit.add(arch, metal, new THREE.Matrix4().makeTranslation(cx, D0 + h, (z0 + z1) / 2));
    fit.add(boxGeo(V(x0, D0, z0), V(x1, D0 + h, z1), 3), metal);
    fit.add(quad(V(x1 - 1, D0, z0 - 0.02), V(x0 + 1, D0, z0 - 0.02), V(x0 + 1, D0 + h - 0.6, z0 - 0.02), V(x1 - 1, D0 + h - 0.6, z0 - 0.02)), lam("hangarDoor", () => ({ map: hangarDoorTex() })));
    const front = new THREE.CircleGeometry(R, 32, 0, Math.PI); front.scale(1, 0.5, 1); front.rotateY(Math.PI);
    fit.add(front, metal, new THREE.Matrix4().makeTranslation(cx, D0 + h, z0 - 0.01));
    const tankM = shiny("tank", "#d9d4c4", "#5e584c", 22);
    fit.add(new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 28), tankM, new THREE.Matrix4().makeTranslation(TANK[0], D0 + TANK_LEG + TANK_H / 2, TANK[2]));
    fit.add(new THREE.SphereGeometry(TANK_R, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.35, 1), tankM, new THREE.Matrix4().makeTranslation(TANK[0], D0 + TANK_LEG + TANK_H, TANK[2]));
    for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) fit.add(boxGeo(V(TANK[0] + dx - 0.12, D0, TANK[2] + dz - 0.12), V(TANK[0] + dx + 0.12, D0 + TANK_LEG + 0.2, TANK[2] + dz + 0.12)), dark);
    fit.add(new THREE.CylinderGeometry(0.08, 0.1, POLE_H, 10), white, new THREE.Matrix4().makeTranslation(POLE[0], D0 + POLE_H / 2, POLE[2]));
    fit.add(boxGeo(V(POLE[0] - 0.9, D0 + POLE_H - 0.6, POLE[2] - 0.04), V(POLE[0] + 0.9, D0 + POLE_H - 0.52, POLE[2] + 0.04)), white);
    fit.add(rbox(V(406, D0, 154), V(414, D0 + 10, 162), 0.25), lam("tower", () => ({ color: "#c9b48f" })));
    fit.add(rbox(V(405.5, D0 + 10, 153.5), V(414.5, D0 + 12.4, 162.5), 0.2), shiny("towerGlass", "#4a6a8a", "#ffffff", 80));
    const crate = lam("crate", () => ({ color: "#b5824a" }));
    for (const c of CRATES) fit.add(rbox(V(c[0] - 0.4, D0, c[2] - 0.3), V(c[0] + 0.4, D0 + 0.55, c[2] + 0.3), 0.045), crate);
    for (const [mx, mz, mw, mh] of [[360, 330, 80, 26], [470, 360, 110, 34], [580, 320, 70, 22]] as const)
      fit.add(rbox(V(mx - mw / 2, D0, mz - 18), V(mx + mw / 2, D0 + mh, mz + 18), 4), lam("mesa", () => ({ color: "#c98a5a" })));
    // ---- a street of wooden houses ----
    sh.add(quadUp(STREET.x0, STREET.x1, STREET.z0, STREET.z1, 10, 9, 0.008), lam("streetDirt", () => ({ map: sandTex() })));
    const wall = lam("shoji", () => ({ map: paperWallTex() })), beam = lam("darkWood", () => ({ color: "#4a3324" })), tile = lam("roofTile", () => ({ color: "#3e434c" }));
    for (const hs of HOUSES) {
      const fx = hs.x + hs.side * 2.6, w = 6.2;
      fit.add(boxGeo(V(hs.x - 2.6, D0, hs.z - w / 2 + 0.2), V(hs.x + 2.6, D0 + 2.9, hs.z + w / 2 - 0.2), 1.5), wall);
      for (const dz of [-w / 2 + 0.2, 0, w / 2 - 0.2]) fit.add(rbox(V(fx - 0.12, D0, hs.z + dz - 0.12), V(fx + 0.12, D0 + 2.9, hs.z + dz + 0.12), 0.04), beam);
      fit.add(boxGeo(V(hs.x - 2.7, D0 + 2.8, hs.z - w / 2), V(hs.x + 2.7, D0 + 3.0, hs.z + w / 2)), beam);
      for (const s of [-1, 1]) {
        const g = new THREE.BoxGeometry(3.6, 0.14, w + 0.8); g.rotateZ(s * 0.5);
        fit.add(g, tile, new THREE.Matrix4().makeTranslation(hs.x + s * 1.55, D0 + 3.75, hs.z));
      }
    }
    void M;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  private door(map: THREE.Texture | null, w: number, h: number, hinge: V3, yaw0: number, dir: number) {
    const pivot = new THREE.Group(); pivot.position.set(...hinge); pivot.rotation.y = yaw0;
    const face = lam("doorFaceW", () => ({ color: "#f4f6f8", ...(map ? { map } : {}) }));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), face);
    m.position.set(dir * w / 2, h / 2, 0); m.castShadow = true; m.receiveShadow = true;
    pivot.add(m); this.root.add(pivot);
    return { pivot, yaw0, dir };
  }
  private poseSets(id: number, f: number) {
    this.fridge.pivot.rotation.y = this.fridge.yaw0 - fridgeDoor(id, f);
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
