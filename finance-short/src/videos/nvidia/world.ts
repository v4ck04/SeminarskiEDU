// The river town as one three.js scene, with this film's five sets on the far-bank meadow: the keynote hall, the
// trading floor with its market screen, the boardroom, the glass HQ on its plaza, a restaurant. update(id, f, camera)
// poses everything for shot `id` at frame f (a pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen, fxChip, fxPortrait, JENSEN } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, STG, STAGE, SCREEN, STOOL, TRD, WALL, DESKS, DESK_Y, BRD, TABLE, BOARD, BDOOR,
  HQ, HQDOOR, SIGN, RST, RTABLES, PASS, chartAt, boardDoor, hqDoor, DARK,
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
  1: { az: 140, el: 50 }, 2: { az: 150, el: 40 }, 3: { az: 150, el: 40 }, 4: { az: 140, el: 50 }, 5: { az: 140, el: 50 }, 6: { az: 140, el: 50 },
  7: { az: 125, el: 42 }, 8: { az: 130, el: 40 }, 9: { az: 140, el: 50 }, 10: { az: 140, el: 50 }, 11: { az: 140, el: 50 }, 12: { az: 140, el: 50 },
  13: { az: 140, el: 50 }, 14: { az: 155, el: 14 },
};
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
});

// ---------------- painted textures for the sets ----------------
const txt = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string, w = 900, align: CanvasTextAlign = "center") => {
  g.font = `${w} ${px}px ${FONT}`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
/** a plain wall with soft mottling and a skirting band; col = paint, 4 m wide x h m tall per texture */
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
/** floor tiles / carpet / boards: n x n tiles per texture */
const floorTex = (key: string, a: string, b: string, n: number, seam = "rgba(0,0,0,0.25)") => ctex(key, 1024, 1024, (g, r) => {
  const S = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = jit(r, (i + j) % 2 ? a : b, 0.04, 2, 0.08); g.fillRect(i * S, j * S, S, S); }
  g.fillStyle = seam;
  for (let k = 0; k <= n; k++) { g.fillRect(k * S - 2, 0, 4, 1024); g.fillRect(0, k * S - 2, 1024, 4); }
});
/** the HQ glass curtain wall: blue-grey panes, light mullions, sky reflections; 3.2 m per pane column, 4 m floors */
const glassTex = () => ctex("hqGlass", 1024, 1024, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const gr = g.createLinearGradient(i * 256, j * 256, i * 256 + 256, j * 256 + 256);
    gr.addColorStop(0, jit(r, "#7fa2c6", 0.06, 3, 0.1)); gr.addColorStop(1, jit(r, "#45698f", 0.06, 3, 0.1));
    g.fillStyle = gr; g.fillRect(i * 256, j * 256, 256, 256);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(i * 256 + 30, j * 256 + 256); g.lineTo(i * 256 + 120, j * 256); g.lineTo(i * 256 + 160, j * 256); g.lineTo(i * 256 + 70, j * 256 + 256); g.fill();
  }
  g.fillStyle = "#d9dde2";
  for (let k = 0; k <= 4; k++) { g.fillRect(k * 256 - 7, 0, 14, 1024); g.fillRect(0, k * 256 - 10, 1024, 20); }
});
const signTex = () => ctex("hqSign", 1024, 256, (g) => {
  g.fillStyle = "#1c1d22"; g.fillRect(0, 0, 1024, 256);
  txt(g, "NVIDIA", 512, 132, 170, "#8fd13a", 900);
});
const skyWinTex = () => ctex("boardWindow", 1024, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#6fa6e0"); gr.addColorStop(1, "#d6e6f4"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 14; i++) { const x = i * 76 + 10, h = 90 + ((i * 53) % 120); g.fillStyle = i % 2 ? "#9fb3c8" : "#8aa1b8"; g.fillRect(x, 512 - h, 62, h); }
  g.fillStyle = "#5f8a4a"; g.fillRect(0, 470, 1024, 42);
  g.fillStyle = "#e9ecef"; for (let k = 0; k <= 4; k++) g.fillRect(k * 256 - 8, 0, 16, 512); g.fillRect(0, 0, 1024, 14); g.fillRect(0, 498, 1024, 14);
});
const portraitWallTex = () => ctex("boardArt", 512, 384, (g) => {
  g.fillStyle = "#b8922f"; g.fillRect(0, 0, 512, 384); g.fillStyle = "#14361f"; g.fillRect(20, 20, 472, 344);
  for (let i = 0; i < 6; i++) { g.strokeStyle = "#76b900"; g.lineWidth = 10; g.beginPath(); g.moveTo(40, 330 - i * 40); g.lineTo(470, 300 - i * 50); g.stroke(); }
});
const doorTexModern = () => ctex("doorModern", 256, 512, (g) => {
  g.fillStyle = "#6b4a34"; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(20,10,6,0.5)"; g.lineWidth = 6; g.strokeRect(20, 20, 216, 472);
  g.fillStyle = "#cfd2d8"; g.fillRect(200, 240, 18, 70);
});
const glassDoorTex = () => ctex("doorGlass", 256, 512, (g) => {
  g.fillStyle = "#3f5f80"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.moveTo(30, 512); g.lineTo(150, 0); g.lineTo(190, 0); g.lineTo(70, 512); g.fill();
  g.strokeStyle = "#d9dde2"; g.lineWidth = 14; g.strokeRect(0, 0, 256, 512);
  g.fillStyle = "#d9dde2"; g.fillRect(206, 200, 12, 120);
});
const passTex = () => ctex("kitchenPass", 512, 256, (g) => {
  g.fillStyle = "#2a2420"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#8a8f98"; g.fillRect(40 + i * 92, 40, 60, 10); g.fillStyle = "#c9ccd4"; g.beginPath(); g.arc(70 + i * 92, 120, 26, 0, 7); g.fill(); }
  g.fillStyle = "#f2c94c"; g.fillRect(0, 230, 512, 26);
});
const menuTex = () => ctex("menuBoard", 512, 640, (g) => {
  g.fillStyle = "#2f4a3e"; g.fillRect(0, 0, 512, 640); g.strokeStyle = "#8a5a34"; g.lineWidth = 24; g.strokeRect(12, 12, 488, 616);
  txt(g, "TONIGHT", 256, 90, 64, "rgba(246,244,232,0.92)", 800);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(246,244,232,0.7)"; g.fillRect(70, 180 + i * 80, 260, 14); g.fillRect(380, 180 + i * 80, 60, 14); }
});
/** the big market screen: a price line over a dark grid, a caption; redrawn when the chart changes */
const drawChart = (g: CanvasRenderingContext2D, c: { v: number[]; up: boolean; label: string }) => {
  const W = 1600, H = 450;
  g.fillStyle = "#07101c"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(120,160,210,0.16)"; g.lineWidth = 2;
  for (let x = 0; x <= W; x += 100) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, H); g.stroke(); }
  for (let y = 70; y <= H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const col = c.up ? "#2fe07a" : "#ff3b3b", n = c.v.length;
  const P = c.v.map((v, i) => [40 + (i / (n - 1)) * (W - 80), H - 30 - Math.max(0, Math.min(1, v)) * (H - 130)] as [number, number]);
  g.beginPath(); g.moveTo(P[0][0], H); for (const [x, y] of P) g.lineTo(x, y); g.lineTo(P[n - 1][0], H); g.closePath();
  g.fillStyle = c.up ? "rgba(47,224,122,0.18)" : "rgba(255,59,59,0.18)"; g.fill();
  g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = col; g.lineWidth = 10; g.lineJoin = "round"; g.stroke();
  g.fillStyle = "#0d1a2c"; g.fillRect(0, 0, W, 66);
  txt(g, c.label, W / 2, 36, 60, col, 900);
  txt(g, "LIVE", W - 70, 36, 34, "#ffffff", 800);
  g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(W - 140, 36, 12, 0, 7); g.fill();
};

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
  private stageScreen!: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial };
  private wallScreen!: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial };
  private ticker!: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial };
  private chartCv!: HTMLCanvasElement; private chartTex!: THREE.CanvasTexture; private chartKey = "";
  private boardDoor!: { pivot: THREE.Group; yaw0: number; dir: number };
  private hqDoors!: { pivot: THREE.Group; yaw0: number; dir: number }[];
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
    sh.add(quad(V(x1, y0, z1), V(x0, y0, z1), V(x0, y1, z1), V(x1, y1, z1), W(x1 - x0), 1), wall);   // back
    sh.add(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y1, z0), V(x0, y1, z0), W(x1 - x0), 1), wall);   // front
    sh.add(quad(V(x0, y0, z1), V(x0, y0, z0), V(x0, y1, z0), V(x0, y1, z1), W(z1 - z0), 1), wall);   // right (x0)
    sh.add(quad(V(x1, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x1, y1, z0), W(z1 - z0), 1), wall);   // left (x1)
    sh.add(quad(V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)), ceil);                   // ceiling, facing down
  }
  private unlit(map: THREE.Texture, w: number, h: number, at: V3, yaw = Math.PI, intensity = 1.0) {
    const m = new THREE.MeshBasicMaterial({ map, color: new THREE.Color(intensity, intensity, intensity) });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.position.set(...at); mesh.rotation.y = yaw;
    this.root.add(mesh);
    return { mesh, mat: m };
  }

  private buildSets(M: Mats) {
    const sh = new Batch(), fit = new Batch();
    const dark = lam("nvDark", () => ({ color: "#2a2d36" }));
    const white = lam("nvWhite", () => ({ color: "#f1f2f4" }));
    const black = lam("nvBlack", () => ({ color: "#1c1d22" }));
    const wood = lam("nvWood", () => ({ color: "#6b4630" }));
    // ---- keynote hall ----
    this.room(sh, STG, lam("stgWall", () => ({ map: wallTex("stgWall", "#232838", "#151822", STG.h) })),
      lam("stgFloor", () => ({ map: floorTex("stgFloor", "#2a2e3a", "#262a35", 4) })), lam("stgCeil", () => ({ color: "#151822" })));
    const plat = lam("stagePlat", () => ({ color: "#1e2129" }));
    fit.add(boxGeo(V(STAGE.x0, D0, STAGE.z0), V(STAGE.x1, STAGE.y, STAGE.z1)), plat);
    const seat = lam("seatRed", () => ({ color: "#7a2430" }));
    for (let r = 0; r < 3; r++) for (let x = STG.x0 + 2.5; x < STG.x1 - 2; x += 0.75) {
      if (Math.abs(x - 292) < 1.2) continue; // the aisle the camera looks down
      const z = 60.2 + r * 1.3;
      fit.add(boxGeo(V(x - 0.3, D0, z), V(x + 0.3, D0 + 0.48, z + 0.55)), seat);
      fit.add(boxGeo(V(x - 0.3, D0 + 0.48, z + 0.45), V(x + 0.3, D0 + 1.05, z + 0.6)), seat);
    }
    fit.add(boxGeo(V(STOOL[0] - 0.22, STAGE.y, STOOL[2] - 0.22), V(STOOL[0] + 0.22, STAGE.y + 0.72, STOOL[2] + 0.22)), black);
    this.stageScreen = this.unlit(ctex("chipScreen", 700, 700, (g) => fxChip(new Pen(g))), SCREEN.x1 - SCREEN.x0, SCREEN.y1 - SCREEN.y0,
      [(SCREEN.x0 + SCREEN.x1) / 2, (SCREEN.y0 + SCREEN.y1) / 2, SCREEN.z], Math.PI, 1.6);
    const led = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 3.2, 0.6) });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(STAGE.x1 - STAGE.x0, 0.06, 0.04), led);
    strip.position.set((STAGE.x0 + STAGE.x1) / 2, STAGE.y - 0.08, STAGE.z0 - 0.02); this.root.add(strip);
    // ---- trading floor ----
    this.room(sh, TRD, lam("trdWall", () => ({ map: wallTex("trdWall", "#d5d9e0", "#9aa1ad", TRD.h) })),
      lam("trdFloor", () => ({ map: floorTex("trdFloor", "#3d4454", "#394050", 6) })), lam("trdCeil", () => ({ color: "#e4e7ec" })));
    const mon = lam("trdMon", () => ({ color: "#26282f" }));
    for (const d of DESKS) {
      fit.add(boxGeo(V(TRD.x0 + 2.5, DESK_Y - 0.05, d.z0), V(TRD.x1 - 2.5, DESK_Y, d.z1)), white);
      fit.add(boxGeo(V(TRD.x0 + 2.5, D0, d.z0 + 0.05), V(TRD.x1 - 2.5, DESK_Y - 0.05, d.z0 + 0.12)), dark);
      for (let x = TRD.x0 + 3.2; x < TRD.x1 - 3; x += 0.75) {
        fit.add(boxGeo(V(x - 0.3, DESK_Y + 0.12, d.z0 + 0.3), V(x + 0.3, DESK_Y + 0.5, d.z0 + 0.36)), mon);
        fit.add(boxGeo(V(x - 0.04, DESK_Y, d.z0 + 0.31), V(x + 0.04, DESK_Y + 0.13, d.z0 + 0.35)), mon);
      }
    }
    // the screens' faces: one shared lit-up texture (rows of numbers) on every desk monitor
    const faceT = ctex("deskScreens", 256, 160, (g) => { g.fillStyle = "#0b1a2e"; g.fillRect(0, 0, 256, 160); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#2fe07a" : "#9fc4ff"; g.fillRect(16, 16 + i * 24, 120 + 90 * Math.sin(i * 2.1) ** 2, 10); } });
    const faces = new Batch(), faceM = new THREE.MeshBasicMaterial({ map: faceT });
    for (const d of DESKS) for (let x = TRD.x0 + 3.2; x < TRD.x1 - 3; x += 0.75)
      faces.add(quad(V(x + 0.27, DESK_Y + 0.14, d.z0 + 0.295), V(x - 0.27, DESK_Y + 0.14, d.z0 + 0.295), V(x - 0.27, DESK_Y + 0.48, d.z0 + 0.295), V(x + 0.27, DESK_Y + 0.48, d.z0 + 0.295)), faceM);
    faces.build(this.root, false);
    const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 450;
    this.chartCv = cv; this.chartTex = new THREE.CanvasTexture(cv); this.chartTex.colorSpace = THREE.SRGBColorSpace;
    this.wallScreen = this.unlit(this.chartTex, WALL.x1 - WALL.x0, WALL.y1 - WALL.y0, [(WALL.x0 + WALL.x1) / 2, (WALL.y0 + WALL.y1) / 2, WALL.z], Math.PI, 1.25);
    fit.add(boxGeo(V(WALL.x0 - 0.15, WALL.y0 - 0.15, WALL.z + 0.02), V(WALL.x1 + 0.15, WALL.y1 + 0.15, WALL.z + 0.07)), black);
    const tick = ctex("ticker", 2048, 64, (g) => { g.fillStyle = "#0b0d12"; g.fillRect(0, 0, 2048, 64); g.font = `800 40px ${FONT}`; g.textBaseline = "middle";
      let x = 20; for (const [s, c] of [["NVDA ▲", "#2fe07a"], ["NASDAQ ▲", "#2fe07a"], ["S&P 500 ▲", "#2fe07a"], ["DOW ▲", "#2fe07a"], ["AMD", "#ffffff"], ["TSMC", "#ffffff"], ["SMH ▲", "#2fe07a"], ["NVDA", "#f2c230"]]) { g.fillStyle = c; g.fillText(s, x, 34); x += 250; } });
    tick.wrapS = THREE.RepeatWrapping;
    this.ticker = this.unlit(tick, WALL.x1 - WALL.x0, 0.32, [(WALL.x0 + WALL.x1) / 2, WALL.y0 - 0.45, WALL.z], Math.PI, 1.2);
    // ---- boardroom ----
    this.room(sh, BRD, lam("brdWall", () => ({ map: wallTex("brdWall", "#e6dccb", "#6b4630", BRD.h) })),
      lam("brdFloor", () => ({ map: floorTex("brdFloor", "#8a6a4a", "#7f6044", 8, "rgba(40,25,15,0.25)") })), lam("brdCeil", () => ({ color: "#f3efe6" })));
    fit.add(boxGeo(V(TABLE.x0, TABLE.y - 0.07, TABLE.z0), V(TABLE.x1, TABLE.y, TABLE.z1)), wood);
    for (const [x, z] of [[TABLE.x0 + 0.4, TABLE.z0 + 0.3], [TABLE.x1 - 0.4, TABLE.z0 + 0.3], [TABLE.x0 + 0.4, TABLE.z1 - 0.3], [TABLE.x1 - 0.4, TABLE.z1 - 0.3]])
      fit.add(boxGeo(V(x - 0.08, D0, z - 0.08), V(x + 0.08, TABLE.y - 0.07, z + 0.08)), black);
    const chair = lam("chairBlack", () => ({ color: "#2b2c33" }));
    for (const p of BOARD) fit.add(boxGeo(V(p[0] - 0.3, D0 + 0.45, p[2] + 0.35), V(p[0] + 0.3, D0 + 1.45, p[2] + 0.45)), chair);
    fit.add(quad(V(374, D0 + 1.0, BRD.z1 - 0.02), V(362, D0 + 1.0, BRD.z1 - 0.02), V(362, D0 + 3.8, BRD.z1 - 0.02), V(374, D0 + 3.8, BRD.z1 - 0.02)), lam("boardWindow", () => ({ map: skyWinTex() })));
    fit.add(quad(V(BRD.x0 + 0.02, D0 + 1.4, 64.0), V(BRD.x0 + 0.02, D0 + 1.4, 61.6), V(BRD.x0 + 0.02, D0 + 3.2, 61.6), V(BRD.x0 + 0.02, D0 + 3.2, 64.0)), lam("boardArt", () => ({ map: portraitWallTex() })));
    this.boardDoor = this.door(doorTexModern(), BDOOR.z1 - BDOOR.z0, BDOOR.h, [BDOOR.x - 0.03, D0, BDOOR.z1], -Math.PI / 2, -1);
    const hole = lam("doorway", () => ({ color: "#14151a" }));
    fit.add(quad(V(BDOOR.x - 0.015, D0, BDOOR.z0), V(BDOOR.x - 0.015, D0, BDOOR.z1), V(BDOOR.x - 0.015, D0 + BDOOR.h, BDOOR.z1), V(BDOOR.x - 0.015, D0 + BDOOR.h, BDOOR.z0)), hole);
    fit.add(quad(V(HQDOOR.x1, D0 + 0.45, HQ.zf - 0.015), V(HQDOOR.x0, D0 + 0.45, HQ.zf - 0.015), V(HQDOOR.x0, HQDOOR.y1, HQ.zf - 0.015), V(HQDOOR.x1, HQDOOR.y1, HQ.zf - 0.015)), hole);
    fit.add(boxGeo(V(BDOOR.x - 0.05, D0, BDOOR.z0 - 0.1), V(BDOOR.x, D0 + BDOOR.h + 0.1, BDOOR.z1 + 0.1)), lam("doorFrame", () => ({ color: "#3a2a20" })));
    // ---- HQ plaza ----
    const glass = lam("hqGlass", () => ({ map: glassTex() }));
    const { x0, x1, zf, zb, h } = HQ;
    fit.add(quad(V(x1, D0, zf), V(x0, D0, zf), V(x0, D0 + h, zf), V(x1, D0 + h, zf), (x1 - x0) / 12.8, h / 16), glass);
    fit.add(quad(V(x0, D0, zf), V(x0, D0, zb), V(x0, D0 + h, zb), V(x0, D0 + h, zf), (zb - zf) / 12.8, h / 16), glass);
    fit.add(quad(V(x1, D0, zb), V(x1, D0, zf), V(x1, D0 + h, zf), V(x1, D0 + h, zb), (zb - zf) / 12.8, h / 16), glass);
    fit.add(boxGeo(V(x0 - 0.3, D0 + h, zf - 0.3), V(x1 + 0.3, D0 + h + 0.6, zb + 0.3)), lam("hqRoof", () => ({ color: "#d9dde2" })));
    fit.add(boxGeo(V(x0 + 0.1, D0, zf + 0.05), V(x1 - 0.1, D0 + h, zb)), lam("hqCore", () => ({ color: "#3b4a5c" })));
    fit.add(boxGeo(V(431.5, D0 + 3.6, 116.5), V(440.5, D0 + 3.85, zf)), white);                    // entrance canopy
    for (const [z, y] of [[117.6, 0.15], [118.4, 0.3], [119.2, 0.45]] as const) fit.add(boxGeo(V(430.5, D0, z), V(441.5, D0 + y, zf)), lam("hqStep", () => ({ color: "#c9c6bd" })));
    sh.add(quadUp(404, 468, 96, zf, 16, 6, 0.01), lam("plaza", () => ({ map: floorTex("plaza", "#cfcabf", "#c4bfb3", 4, "rgba(80,70,60,0.3)") })));
    fit.add(boxGeo(V(SIGN[0] - 2.6, D0, SIGN[2] - 0.3), V(SIGN[0] + 2.6, D0 + 1.3, SIGN[2] + 0.3)), black);
    fit.add(quad(V(SIGN[0] + 2.5, D0 + 0.25, SIGN[2] - 0.32), V(SIGN[0] - 2.5, D0 + 0.25, SIGN[2] - 0.32), V(SIGN[0] - 2.5, D0 + 1.2, SIGN[2] - 0.32), V(SIGN[0] + 2.5, D0 + 1.2, SIGN[2] - 0.32)), lam("hqSign", () => ({ map: signTex() })));
    for (const [tx, tz, th] of [[411, 108, 8], [461, 108, 8.5], [415, 99, 7], [457, 99, 7.5], [409, 118, 9], [463, 118, 9]] as const) prop(fit, {}, "tree_oak", tx, D0, tz, th, tx);
    const dl = glassDoorTex();
    this.hqDoors = [this.door(dl, 1.8, 2.9, [HQDOOR.x0, D0 + 0.45, zf - 0.03], 0, 1), this.door(dl, 1.8, 2.9, [HQDOOR.x1, D0 + 0.45, zf - 0.03], Math.PI, 1)];
    // ---- restaurant ----
    this.room(sh, RST, lam("rstWall", () => ({ map: wallTex("rstWall", "#d9a77a", "#7a3a2a", RST.h) })),
      lam("rstFloor", () => ({ map: floorTex("rstFloor", "#efe9dd", "#2c2a2e", 8) })), lam("rstCeil", () => ({ color: "#5a3a2a" })), 3.2);
    const cloth = lam("cloth", () => ({ color: "#fbf8f1" })), plate = lam("plate", () => ({ color: "#ffffff" }));
    for (const t of RTABLES) {
      fit.add(new THREE.CylinderGeometry(0.62, 0.66, 0.74, 24), cloth, new THREE.Matrix4().makeTranslation(t[0], D0 + 0.37, t[2]));
      for (const a of [0.6, 2.6, 4.6]) fit.add(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 16), plate, new THREE.Matrix4().makeTranslation(t[0] + 0.38 * Math.cos(a), D0 + 0.75, t[2] + 0.38 * Math.sin(a)));
      for (const s of [-1, 1]) fit.add(boxGeo(V(t[0] + s * 0.95 - 0.22, D0, t[2] - 0.22), V(t[0] + s * 0.95 + 0.22, D0 + 0.46, t[2] + 0.22)), wood);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.25, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.3) }));
      lamp.position.set(t[0], D0 + 2.6, t[2]); this.root.add(lamp);
    }
    fit.add(quad(V(PASS.x1, PASS.y0, PASS.z), V(PASS.x0, PASS.y0, PASS.z), V(PASS.x0, PASS.y1, PASS.z), V(PASS.x1, PASS.y1, PASS.z)), lam("kitchenPass", () => ({ map: passTex() })));
    fit.add(boxGeo(V(PASS.x0 - 0.2, D0, PASS.z - 0.55), V(PASS.x1 + 0.2, PASS.y0, PASS.z)), lam("passCounter", () => ({ color: "#8a8f98" })));
    fit.add(quad(V(484.6, D0 + 1.4, PASS.z - 0.01), V(483.0, D0 + 1.4, PASS.z - 0.01), V(483.0, D0 + 3.4, PASS.z - 0.01), V(484.6, D0 + 3.4, PASS.z - 0.01)), lam("menuBoard", () => ({ map: menuTex() })));
    void M;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  /** a door leaf (unlit-free lambert plane + thin box) hinged at `hinge`; yaw0 faces it, dir = which way it swings */
  private door(map: THREE.Texture, w: number, h: number, hinge: V3, yaw0: number, dir: number) {
    const pivot = new THREE.Group(); pivot.position.set(...hinge); pivot.rotation.y = yaw0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [lam("doorEdge", () => ({ color: "#2a2a30" })), lam("doorEdge", () => ({ color: "#2a2a30" })),
      lam("doorEdge", () => ({ color: "#2a2a30" })), lam("doorEdge", () => ({ color: "#2a2a30" })), lam("doorFace" + map.uuid, () => ({ map })), lam("doorFace" + map.uuid, () => ({ map }))]);
    m.position.set(dir * w / 2, h / 2, 0); m.castShadow = true; m.receiveShadow = true;
    pivot.add(m); this.root.add(pivot);
    return { pivot, yaw0, dir };
  }

  private poseSets(id: number, f: number) {
    // market screen: chart, chip or portrait
    if (id === 11 && f >= 1600) {
      const t = f >= 1655 ? this.portraitTex() : this.chipTex();
      if (this.wallScreen.mat.map !== t) { this.wallScreen.mat.map = t; this.wallScreen.mat.needsUpdate = true; }
    } else {
      if (this.wallScreen.mat.map !== this.chartTex) { this.wallScreen.mat.map = this.chartTex; this.wallScreen.mat.needsUpdate = true; }
      if ([1, 4, 6, 11, 13].includes(id)) {
        const c = chartAt(id, f), key = c.label + c.v.map((v) => v.toFixed(3)).join(",");
        if (key !== this.chartKey) { drawChart(this.chartCv.getContext("2d")!, c); this.chartTex.needsUpdate = true; this.chartKey = key; }
      }
    }
    (this.ticker.mat.map as THREE.Texture).offset.x = (f / FPS) * 0.04;
    // keynote screen goes dark when he steps down
    this.stageScreen.mesh.visible = !(id === 3 && f >= DARK.a);
    // doors
    const a = boardDoor(id, f);
    this.boardDoor.pivot.rotation.y = this.boardDoor.yaw0 + a;
    const b = hqDoor(id, f);
    this.hqDoors[0].pivot.rotation.y = this.hqDoors[0].yaw0 + b; this.hqDoors[1].pivot.rotation.y = this.hqDoors[1].yaw0 - b;
  }
  private portraitTex() { return ctex("portraitJensen", 1600, 450, (g) => { g.fillStyle = "#0d1a2c"; g.fillRect(0, 0, 1600, 450); g.save(); g.translate(620, 0); g.scale(0.64, 0.64); fxPortrait(new Pen(g), JENSEN, "smile"); g.restore(); }); }
  private chipTex() { return ctex("chipWide", 1600, 450, (g) => { g.fillStyle = "#06120a"; g.fillRect(0, 0, 1600, 450); g.save(); g.translate(575, 0); g.scale(0.643, 0.643); fxChip(new Pen(g)); g.restore(); }); }

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
