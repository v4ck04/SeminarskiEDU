// The river town as one three.js scene, dressed as London in 1858: the filthy Thames, a stone embankment and the
// Palace of Westminster on the far bank, smoking factories on the near bank, a committee room inside Parliament and
// two of Bazalgette's brick sewers underground (one being built, one finished). update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { Batch, boxGeo, rbox, shiny, V, lam, buildTown, Kit, Ray, kitClone, quad, tri, house, prop } from "./build";
import { bed, ctex, cobbleHD, grassHD, waterNear, waterFar, cloudHD, brick, stoneHD, jit, rep } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, Room, PROM, PALACE, CLOCK, VTOWER, FACTORY, STACKS, STACK_H, PIPE, ROOM, TABLE, DOOR,
  TUN_A, TUN_B, TUN_FLOOR,
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
  1: { az: 140, el: 40 }, 2: { az: 150, el: 45 }, 3: { az: 135, el: 45 }, 4: { az: 10, el: 30 }, 5: { az: 130, el: 45 }, 6: { az: 160, el: 40 },
  7: { az: 130, el: 45 }, 8: { az: 150, el: 40 }, 9: { az: 140, el: 45 }, 10: { az: 140, el: 45 }, 11: { az: 140, el: 45 }, 12: { az: 130, el: 40 },
  13: { az: 150, el: 70 }, 14: { az: 150, el: 70 }, 15: { az: 160, el: 16 }, 16: { az: 160, el: 16 },
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
/** Gothic Revival stone facade: buttressed bays, tall pointed windows, string courses (one bay = 128 px) */
const gothicTex = () => ctex("gothic", 512, 512, (g, r) => {
  g.fillStyle = "#cdb98c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,100,60,0.08)" : "rgba(255,245,220,0.08)"; g.fillRect(r() * 512, r() * 512, 30 + r() * 60, 6 + r() * 10); }
  for (let bx = 0; bx < 512; bx += 128) {
    g.fillStyle = "#b9a577"; g.fillRect(bx, 0, 14, 512); g.fillRect(bx + 114, 0, 14, 512);
    for (const [y0, h] of [[60, 150], [300, 150]] as const) for (const k of [0, 1]) {
      const x = bx + 26 + k * 44;
      g.fillStyle = "#2e3640"; g.beginPath(); g.moveTo(x, y0 + h); g.lineTo(x, y0 + 26); g.quadraticCurveTo(x + 16, y0 - 6, x + 32, y0 + 26); g.lineTo(x + 32, y0 + h); g.fill();
      g.strokeStyle = "#e6d8b4"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#e6d8b4"; g.fillRect(x + 14, y0 + 20, 4, h - 20); g.fillRect(x, y0 + h * 0.55, 32, 3);
    }
  }
  g.fillStyle = "#a8956a"; g.fillRect(0, 236, 512, 10); g.fillRect(0, 486, 512, 26);
});
const clockTex = () => ctex("clockFace", 256, 256, (g) => {
  g.fillStyle = "#cdb98c"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#1f2a30"; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  g.fillStyle = "#f4ecd4"; g.beginPath(); g.arc(128, 128, 98, 0, 7); g.fill();
  g.strokeStyle = "#1f2a30"; g.lineWidth = 5; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80); g.lineTo(128 + Math.cos(a) * 94, 128 + Math.sin(a) * 94); g.stroke(); }
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 58); g.moveTo(128, 128); g.lineTo(178, 140); g.stroke();
  g.fillStyle = "#d9b04a"; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill();
});
const slateTex = () => ctex("slate", 256, 256, (g, r) => {
  g.fillStyle = "#4a5260"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 14) for (let x = (y / 14) % 2 ? -12 : 0; x < 256; x += 24) { g.fillStyle = jit(r, "#566070", 0.08, 3, 0.1); g.fillRect(x + 1, y + 1, 22, 12); }
});
const pavingTex = () => floorTex("paving", "#b9b3a6", "#aea898", 6, "rgba(60,55,50,0.35)");
const panelTex = (h: number) => ctex("panel", 512, Math.round(h * 96), (g) => {
  const H = Math.round(h * 96);
  g.fillStyle = "#3f5a46"; g.fillRect(0, 0, 512, H);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x, 0, 30, H); }
  g.fillStyle = "#5a3a22"; g.fillRect(0, H - 220, 512, 220);
  g.strokeStyle = "#3a2414"; g.lineWidth = 6; for (let x = 8; x < 512; x += 128) g.strokeRect(x, H - 200, 112, 160);
  g.fillStyle = "#c9a04a"; g.fillRect(0, H - 226, 512, 8);
});
const riverView = () => ctex("riverView", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#c9cdb4"); gr.addColorStop(0.6, "#dcd6b0"); gr.addColorStop(1, "#7a7a4a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#8a8670"; g.fillRect(0, 300, 256, 40); for (const x of [30, 120, 200]) g.fillRect(x, 220, 14, 90);
  g.fillStyle = "#5e6a34"; g.fillRect(0, 340, 256, 172);
  g.strokeStyle = "#3a2414"; g.lineWidth = 14; g.strokeRect(0, 0, 256, 512);
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 512); for (const y of [128, 256, 384]) { g.moveTo(0, y); g.lineTo(256, y); } g.stroke();
});
const brickTex = () => ctex("sewerBrick", 512, 512, (g, r) => {
  g.fillStyle = "#4a3a30"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = jit(r, "#9a5a3c", 0.1, 4, 0.12); g.fillRect(x + 3, y + 3, 58, 26); }
});
const earthTex = () => ctex("earth", 512, 512, (g, r) => {
  g.fillStyle = "#6a5038"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,28,18,0.25)" : "rgba(160,130,90,0.2)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 20, 4 + r() * 10, r() * 3, 0, 7); g.fill(); }
});
const factoryTex = () => ctex("factory", 512, 384, (g, r) => {
  g.fillStyle = "#7a4a36"; g.fillRect(0, 0, 512, 384);
  for (let y = 0; y < 384; y += 12) for (let x = (y / 12) % 2 ? -12 : 0; x < 512; x += 24) { g.fillStyle = jit(r, "#8a5a42", 0.08, 3, 0.1); g.fillRect(x + 1, y + 1, 22, 10); }
  for (let k = 0; k < 6; k++) for (const y0 of [60, 220]) { g.fillStyle = "#2a2a30"; g.fillRect(20 + k * 82, y0, 50, 90); g.fillStyle = "rgba(255,210,120,0.35)"; g.fillRect(24 + k * 82, y0 + 4, 20, 40); }
  g.fillStyle = "rgba(20,15,10,0.35)"; g.fillRect(0, 0, 512, 30);
});
/** a tube seen from inside: normals point to the axis */
const insideTube = (r: number, len: number, seg = 36) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true).toNonIndexed();
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i += 3) for (const att of [p, n, uv]) {
    const k = att.itemSize, a = att.array as Float32Array;
    for (let j = 0; j < k; j++) { const t = a[(i + 1) * k + j]; a[(i + 1) * k + j] = a[(i + 2) * k + j]; a[(i + 2) * k + j] = t; }
  }
  for (let i = 0; i < n.count * 3; i++) (n.array as Float32Array)[i] *= -1;
  for (let i = 0; i < uv.count; i++) { uv.setX(i, uv.getX(i) * 6); uv.setY(i, uv.getY(i) * len / 2); }
  g.rotateX(Math.PI / 2);
  return g;
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
  private junk: { m: THREE.Mesh; x: number; z: number; k: number }[] = [];
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
    const iron = shiny("stIron", "#2a2c32", "#7a7e88", 40);
    const stone = lam("palaceStone", () => ({ color: "#cdb98c" }));
    const gothic = lam("gothic", () => ({ map: gothicTex() }));
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.3, 1.3) });
    const glowAt = (p: V3, r: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), glow); m.position.set(...p); m.layers.set(NOINK); this.root.add(m); };
    // ---- the embankment walk on the far bank: paving, a stone parapet over the river, lamp posts ----
    sh.add(quadUp(PROM.x0, PROM.x1, PROM.z0, PROM.z1, (PROM.x1 - PROM.x0) / 4, (PROM.z1 - PROM.z0) / 4, 0.012), lam("paving", () => ({ map: pavingTex() })));
    fit.add(rbox(V(PROM.x0, D0, 30.0), V(PROM.x1, D0 + 0.95, 30.45), 0.05), stone);
    for (let x = PROM.x0 + 6; x < PROM.x1; x += 12) {
      fit.add(rbox(V(x - 0.25, D0, 29.95), V(x + 0.25, D0 + 1.1, 30.5), 0.04), stone);
      fit.add(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 10), iron, new THREE.Matrix4().makeTranslation(x, D0 + 1.1 + 1.6, 30.25));
      fit.add(rbox(V(x - 0.16, D0 + 4.3, 30.09), V(x + 0.16, D0 + 4.36, 30.41), 0.02), iron);
      fit.add(new THREE.ConeGeometry(0.24, 0.22, 6), iron, new THREE.Matrix4().makeTranslation(x, D0 + 4.82, 30.25));
      glowAt([x, D0 + 4.55, 30.25], 0.13);
    }
    // ---- the Palace of Westminster ----
    const P = PALACE, slate = lam("slate", () => ({ map: rep(slateTex(), 8, 2) }));
    fit.add(boxGeo(V(P.x0, D0, P.z0), V(P.x1, D0 + P.h, P.z1), 0), stone);
    fit.add(quad(V(P.x1, D0, P.z0 - 0.03), V(P.x0, D0, P.z0 - 0.03), V(P.x0, D0 + P.h, P.z0 - 0.03), V(P.x1, D0 + P.h, P.z0 - 0.03), (P.x1 - P.x0) / 10, P.h / 10), gothic);
    for (const x of [P.x0 - 0.03, P.x1 + 0.03]) fit.add(x < P.x1 ? quad(V(x, D0, P.z0), V(x, D0, P.z1), V(x, D0 + P.h, P.z1), V(x, D0 + P.h, P.z0), (P.z1 - P.z0) / 10, P.h / 10) : quad(V(x, D0, P.z1), V(x, D0, P.z0), V(x, D0 + P.h, P.z0), V(x, D0 + P.h, P.z1), (P.z1 - P.z0) / 10, P.h / 10), gothic);
    const roof = new THREE.CylinderGeometry(0.01, (P.z1 - P.z0) / 2 * 1.05, P.x1 - P.x0, 3, 1); roof.rotateZ(Math.PI / 2); roof.rotateX(Math.PI / 2); roof.scale(1, 0.32, 1);
    fit.add(roof, slate, new THREE.Matrix4().makeTranslation((P.x0 + P.x1) / 2, D0 + P.h + 1.6, (P.z0 + P.z1) / 2));
    for (let x = P.x0 + 1; x < P.x1; x += 4.2) {
      fit.add(new THREE.ConeGeometry(0.4, 2.4, 6), stone, new THREE.Matrix4().makeTranslation(x, D0 + P.h + 1.2, P.z0 + 0.3));
      fit.add(rbox(V(x - 0.5, D0, P.z0 - 0.7), V(x + 0.5, D0 + P.h + 0.2, P.z0 + 0.1), 0.06), stone); // buttress
    }
    // the clock tower: shaft, clock faces, belfry, spire
    const C = CLOCK, hw = C.w / 2;
    fit.add(boxGeo(V(C.x - hw, D0, C.z - hw), V(C.x + hw, D0 + C.h - 18, C.z + hw), 0), stone);
    for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const cx = C.x + nx * (hw + 0.03), cz = C.z + nz * (hw + 0.03), y0 = D0 + C.h - 26, y1 = y0 + 5.6, h2 = 2.8;
      const a0 = V(cx - nz * h2, y0, cz + nx * h2), a1 = V(cx + nz * h2, y0, cz - nx * h2);
      fit.add(quad(a0, a1, V(a1.x, y1, a1.z), V(a0.x, y1, a0.z)), lam("clockFace", () => ({ map: clockTex() })));
      fit.add(quad(V(cx - nz * h2, D0 + 6, cz + nx * h2), V(cx + nz * h2, D0 + 6, cz - nx * h2), V(cx + nz * h2, y0 - 1, cz - nx * h2), V(cx - nz * h2, y0 - 1, cz + nx * h2), 1, 3), gothic);
    }
    fit.add(rbox(V(C.x - hw - 0.5, D0 + C.h - 18, C.z - hw - 0.5), V(C.x + hw + 0.5, D0 + C.h - 14, C.z + hw + 0.5), 0.1), stone);
    const sp = new THREE.ConeGeometry(hw * 1.2, 14, 4, 1); sp.rotateY(Math.PI / 4);
    fit.add(sp, slate, new THREE.Matrix4().makeTranslation(C.x, D0 + C.h - 7, C.z));
    fit.add(new THREE.SphereGeometry(0.35, 12, 8), shiny("stGold", "#e2b84a", "#fff1b0", 60), new THREE.Matrix4().makeTranslation(C.x, D0 + C.h + 0.2, C.z));
    // the Victoria Tower
    const VT = VTOWER, vw = VT.w / 2;
    fit.add(boxGeo(V(VT.x - vw, D0, VT.z - vw), V(VT.x + vw, D0 + VT.h, VT.z + vw), 0), stone);
    for (const [nx, nz] of [[0, -1], [-1, 0]]) { const cx = VT.x + nx * (vw + 0.03), cz = VT.z + nz * (vw + 0.03); fit.add(nz ? quad(V(cx + vw, D0, cz), V(cx - vw, D0, cz), V(cx - vw, D0 + VT.h, cz), V(cx + vw, D0 + VT.h, cz), 1, 5) : quad(V(cx, D0, cz - vw), V(cx, D0, cz + vw), V(cx, D0 + VT.h, cz + vw), V(cx, D0 + VT.h, cz - vw), 1, 5), gothic); }
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fit.add(new THREE.ConeGeometry(0.8, 6, 8), stone, new THREE.Matrix4().makeTranslation(VT.x + dx * (vw - 0.6), D0 + VT.h + 3, VT.z + dz * (vw - 0.6)));
    // ---- factories on the near bank, chimneys with smoke, an outflow pipe ----
    const F = FACTORY, brickF = lam("factory", () => ({ map: factoryTex() }));
    for (const [x0, x1, z0, z1, h] of [[F.x0, 372, -60, -38, 12], [376, 410, -74, -40, 15], [414, 440, -62, -38, 10], [444, F.x1, -72, -40, 13]] as const) {
      fit.add(boxGeo(V(x0, D0, z0), V(x1, D0 + h, z1), 0), brickF);
      for (let x = x0; x < x1 - 0.1; x += 6) { const r = new THREE.CylinderGeometry(0.01, 3.4, Math.min(6, x1 - x), 3, 1); r.rotateZ(Math.PI / 2); r.scale(1, 0.5, (z1 - z0) / 6.8); fit.add(r, slate, new THREE.Matrix4().makeTranslation(x + Math.min(6, x1 - x) / 2, D0 + h + 0.8, (z0 + z1) / 2)); }
    }
    const smokeT = smokeTex();
    for (const s of STACKS) {
      fit.add(new THREE.CylinderGeometry(1.0, 1.6, STACK_H, 16), brickF, new THREE.Matrix4().makeTranslation(s[0], D0 + STACK_H / 2, s[2]));
      fit.add(new THREE.CylinderGeometry(1.25, 1.1, 1.0, 16), iron, new THREE.Matrix4().makeTranslation(s[0], D0 + STACK_H, s[2]));
      for (let k = 0; k < 7; k++) {
        const mat = new THREE.MeshLambertMaterial({ map: smokeT, transparent: true, depthWrite: false, color: new THREE.Color(0.55, 0.52, 0.48) });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.layers.set(NOINK);
        this.smoke.push({ m, mat, top: [s[0], D0 + STACK_H + 1, s[2]], k: k / 7 }); this.root.add(m);
      }
    }
    fit.add(new THREE.CylinderGeometry(0.9, 0.9, 2.0, 20).rotateX(Math.PI / 2), iron, new THREE.Matrix4().makeTranslation(PIPE[0], PIPE[1], PIPE[2] + 0.6));
    // floating rubbish: a few barrels and planks on the water (bobbing is done in poseSets)
    const wood = lam("stWood", () => ({ color: "#6a4a30" }));
    for (let i = 0; i < 14; i++) {
      const g = i % 3 ? rbox(V(-0.8, -0.08, -0.15), V(0.8, 0.08, 0.15), 0.04) : new THREE.CylinderGeometry(0.32, 0.32, 0.9, 14).rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, i % 3 ? wood : lam("barrel", () => ({ color: "#7a5434" }))); m.castShadow = m.receiveShadow = true;
      this.root.add(m); this.junk.push({ m, x: 280 + i * 16 + (i % 4) * 3, z: -18 + ((i * 37) % 40), k: i });
    }
    // ---- the committee room inside Parliament ----
    const R = ROOM;
    this.room(sh, R, lam("panel", () => ({ map: panelTex(R.h) })), lam("roomFloor", () => ({ map: floorTex("roomFloor", "#7a5236", "#6e4a30", 10, "rgba(30,18,10,0.3)") })), lam("roomCeil", () => ({ color: "#d8c89a" })));
    const curtain = lam("curtain", () => ({ color: "#7a1f2a" }));
    for (const x of [562.5, 568, 573.5]) {
      fit.add(quad(V(x - 1.0, D0 + 1.1, R.z0 + 0.03), V(x + 1.0, D0 + 1.1, R.z0 + 0.03), V(x + 1.0, D0 + 5.0, R.z0 + 0.03), V(x - 1.0, D0 + 5.0, R.z0 + 0.03)), lam("riverView", () => ({ map: riverView() })));
      for (const s of [-1, 1]) fit.add(rbox(V(x + s * 1.2 - 0.32, D0 + 0.2, R.z0 + 0.06), V(x + s * 1.2 + 0.32, D0 + 5.4, R.z0 + 0.3), 0.12, 4), curtain);
      fit.add(rbox(V(x - 1.7, D0 + 5.4, R.z0 + 0.04), V(x + 1.7, D0 + 5.7, R.z0 + 0.34), 0.05), lam("pelmet", () => ({ color: "#5a1620" })));
    }
    fit.add(rbox(V(TABLE.x0, TABLE.y - 0.08, TABLE.z0), V(TABLE.x1, TABLE.y, TABLE.z1), 0.04), lam("baize", () => ({ color: "#2f5a3a" })));
    for (const [x, z] of [[TABLE.x0 + 0.3, TABLE.z0 + 0.3], [TABLE.x1 - 0.3, TABLE.z0 + 0.3], [TABLE.x0 + 0.3, TABLE.z1 - 0.3], [TABLE.x1 - 0.3, TABLE.z1 - 0.3]]) fit.add(rbox(V(x - 0.07, D0, z - 0.07), V(x + 0.07, TABLE.y - 0.08, z + 0.07), 0.02), wood);
    for (let i = 0; i < 5; i++) fit.add(rbox(V(564 + i * 1.8, TABLE.y, 65.2), V(564.5 + i * 1.8, TABLE.y + 0.02, 65.8), 0.005), lam("paper", () => ({ color: "#f4efe0" })));
    for (const z of [61.2, 70.6]) fit.add(rbox(V(R.x0 + 0.2, D0, z - 0.4), V(R.x0 + 0.9, D0 + 0.5, z + 0.4), 0.06), lam("leather", () => ({ color: "#2f5a3a" })));
    fit.add(rbox(V(R.x0 + 0.1, D0, 63.0), V(R.x0 + 0.8, D0 + 0.5, 69.0), 0.08), lam("leather", () => ({ color: "#2f5a3a" })));
    fit.add(quad(V(DOOR.x, D0, DOOR.z0), V(DOOR.x, D0, DOOR.z1), V(DOOR.x, D0 + 2.6, DOOR.z1), V(DOOR.x, D0 + 2.6, DOOR.z0)), lam("doorOak", () => ({ map: ctex("doorOak", 128, 256, (g) => { g.fillStyle = "#5a3a22"; g.fillRect(0, 0, 128, 256); g.strokeStyle = "#3a2414"; g.lineWidth = 6; g.strokeRect(14, 14, 100, 100); g.strokeRect(14, 134, 100, 108); g.fillStyle = "#d9b04a"; g.beginPath(); g.arc(104, 130, 7, 0, 7); g.fill(); }) })));
    for (const x of [564, 572]) glowAt([x, D0 + 4.6, 69.6], 0.12);
    // ---- the sewers (underground; floor at TUN_FLOOR) ----
    const brick = lam("sewerBrick", () => ({ map: brickTex() })), earth = lam("earth", () => ({ map: earthTex() }));
    const tube = (x: number, z0: number, z1: number, mat: THREE.Material) => { const L = z1 - z0; sh.add(insideTube(TUN_A.r, L), mat, new THREE.Matrix4().makeTranslation(x, TUN_FLOOR + TUN_A.r - 0.4, (z0 + z1) / 2)); };
    tube(TUN_A.x, TUN_A.z0, TUN_A.built, brick); tube(TUN_A.x, TUN_A.built, TUN_A.z1, earth); tube(TUN_B.x, TUN_B.z0, TUN_B.z1, brick);
    const halfW = Math.sqrt(TUN_A.r ** 2 - (TUN_A.r - 0.4) ** 2);
    sh.add(quadUp(TUN_A.x - halfW, TUN_A.x + halfW, TUN_A.z0, TUN_A.z1, 2, 20, TUN_FLOOR - D0 + 0.02), lam("mud", () => ({ color: "#4a3a28" })));
    sh.add(quadUp(TUN_B.x - halfW, TUN_B.x + halfW, TUN_B.z0, TUN_B.z1, 1, 1, TUN_FLOOR - D0 + 0.06), shiny("sewerWater", "#3a4a40", "#b0c4b8", 80));
    for (let z = TUN_A.built + 1; z < TUN_A.z1; z += 2.2) {
      const rib = new THREE.TorusGeometry(TUN_A.r - 0.15, 0.08, 6, 24, Math.PI);
      fit.add(rib, wood, new THREE.Matrix4().makeTranslation(TUN_A.x, TUN_FLOOR + TUN_A.r - 0.4, z));
      fit.add(rbox(V(TUN_A.x - halfW + 0.1, TUN_FLOOR, z - 0.08), V(TUN_A.x - halfW + 0.26, TUN_FLOOR + TUN_A.r - 0.4, z + 0.08), 0.02), wood);
      fit.add(rbox(V(TUN_A.x + halfW - 0.26, TUN_FLOOR, z - 0.08), V(TUN_A.x + halfW - 0.1, TUN_FLOOR + TUN_A.r - 0.4, z + 0.08), 0.02), wood);
    }
    const brickPile = lam("brickPile", () => ({ color: "#a0583a" }));
    for (const [x, z] of [[-0.8, 98], [0.7, 101], [-0.6, 108], [0.8, 112]] as const) for (let k = 0; k < 4; k++) fit.add(rbox(V(TUN_A.x + x - 0.3, TUN_FLOOR + k * 0.12, z - 0.2 + (k % 2) * 0.05), V(TUN_A.x + x + 0.3, TUN_FLOOR + k * 0.12 + 0.11, z + 0.2), 0.015), brickPile);
    for (let z = TUN_A.z0 + 4; z < TUN_A.z1; z += 7) glowAt([TUN_A.x - halfW + 0.4, TUN_FLOOR + 1.6, z], 0.1);
    for (let z = TUN_B.z0 + 3; z < TUN_B.z1; z += 6) for (const s of [-1, 1]) {
      fit.add(rbox(V(TUN_B.x + s * (TUN_A.r - 0.35) - 0.08, TUN_FLOOR + 1.6, z - 0.08), V(TUN_B.x + s * (TUN_A.r - 0.35) + 0.08, TUN_FLOOR + 1.95, z + 0.08), 0.02), iron);
      glowAt([TUN_B.x + s * (TUN_A.r - 0.55), TUN_FLOOR + 1.8, z], 0.11);
    }
    for (const [x, z] of [[TUN_A.x, TUN_A.z1 - 0.05], [TUN_B.x, TUN_B.z1 - 0.05]]) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(TUN_A.r, 32), new THREE.MeshBasicMaterial({ color: "#07060a" }));
      d.position.set(x, TUN_FLOOR + TUN_A.r - 0.4, z); d.rotation.y = Math.PI; d.layers.set(NOINK); this.root.add(d);
    }
    void M;
    sh.build(this.root, false);
    fit.build(this.root);
  }
  private poseSets(_id: number, f: number) {
    for (const j of this.junk) { j.m.position.set(j.x + 0.004 * f, 0.1 + 0.06 * Math.sin(f * 0.08 + j.k), j.z); j.m.rotation.set(0.08 * Math.sin(f * 0.05 + j.k), j.k * 0.7, 0.06 * Math.cos(f * 0.07 + j.k)); }
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
