// London, 1720, as one three.js scene: sky, the Thames, quays, the town (build.ts), the Tower of London with its river
// gate, the Mint's coin press in the Tower courtyard, a bench on the far quay, Newton's apple tree in the park, the South
// Sea bubble over Exchange Alley, smoke, clouds and the cast. update(id, f, camera) poses everything for shot `id`
// at frame f (a pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, buildTown, flagTex, Kit, Ray, kitClone, appleTree } from "./build";
import { bed, ctex, stoneHD, cobbleHD, grassHD, waterNear, waterFar, cloudHD, beam } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, TREE, PRESS, GATE, BENCH, bubble } from "./story";

// ---------------- assets ----------------
// The Kenney kit is optional: trees, bushes and hedges are drawn as cartoon vegetation in build.ts; any other prop
// whose model is missing is simply left out.
export const loadKit = () => Promise.resolve({} as Kit);

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
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 4: { az: 120 }, 11: { az: 4, el: 9 }, 17: { az: 120 }, 18: { az: 65, el: 8 }, 19: { az: 150, el: 12 }, 20: { az: 145, el: 22 } };
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
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

// ---------------- the South Sea bubble: thin-film rim, two highlights, a thin ink rim ----------------
const BUBBLE_VS = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const BUBBLE_FS = `uniform float uT; uniform float uWarm; varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n = normalize(vN); float c = clamp(dot(n, normalize(vV)), 0.0, 1.0); float fr = pow(1.0 - c, 2.0);
  vec3 film = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + fr * 1.7 + uT * 0.05 + n.y * 0.35));
  vec3 col = mix(vec3(0.92, 0.96, 1.0), film, 0.75) * mix(vec3(1.0), vec3(1.25, 0.95, 0.75), uWarm);
  float a = 0.05 + 0.62 * fr;
  vec3 L1 = normalize(vec3(-0.42, 0.55, 0.72)), L2 = normalize(vec3(0.5, -0.35, 0.79));
  float h1 = smoothstep(0.972, 0.99, dot(n, L1)), h2 = smoothstep(0.988, 0.996, dot(n, L2));
  col = mix(col, vec3(1.6), h1 * 0.9 + h2 * 0.6); a = max(a, h1 * 0.9 + h2 * 0.55);
  float rim = smoothstep(0.94, 0.975, 1.0 - c);
  col = mix(col, vec3(0.06, 0.04, 0.09), rim); a = mix(a, 0.95, rim);
  gl_FragColor = vec4(col, a);
}`;

type Mats = Record<string, THREE.Material>;

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
  private flags: THREE.Mesh[] = [];
  private smoke: { m: THREE.Mesh; mat: THREE.MeshLambertMaterial; top: V3; k: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private bubble: THREE.Mesh; private bubbleMat: THREE.ShaderMaterial;
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
    this.sun.shadow.mapSize.set(2048, 2048); // software WebGL: 4096 cost more than it showed at 1080 x 1920
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
    // the Tower: pale Caen stone keep, warmer ragstone curtain wall, lead cupolas
    M.keep = lam("keepHD", () => ({ map: stoneHD("keepHD", ["#ece6da", "#e4ddcf", "#f2ede3", "#ddd5c6"], "#b3a998") }));
    M.curtain = lam("curtainHD", () => ({ map: stoneHD("curtainHD", ["#d6c6a8", "#cbbb9c", "#dccdb0", "#c3b294"], "#9c8b70") }));
    M.lead = twoTone(new THREE.MeshPhongMaterial({ color: "#7d8796", specular: "#9aa3b0", shininess: 40 }), 0.2);
    M.dark = lam("gateDark", () => ({ color: "#2c2433" }));
    M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    M.wood = lam("wood", () => ({ map: beam() }));
    M.bed = lam("bed", () => ({ map: bed() }));
    M.gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e8bf45", specular: "#fff1b0", shininess: 70 }), 0.25);
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
    // Tower grounds (cobbled courtyard inside the curtain wall)
    b.add(quadUp(-76, -20, 36.5, 84, 28, 23.5, 0.01), M.cobble);
    this.buildTower(b, M);
    this.buildMint(b, M);
    // bench on the far quay, facing the river (-z)
    {
      const [x, , z] = BENCH;
      b.add(boxGeo(V(x - 1.0, D0 + 0.42, z - 0.25), V(x + 1.0, D0 + 0.5, z + 0.22)), M.wood);
      b.add(boxGeo(V(x - 1.0, D0 + 0.62, z + 0.18), V(x + 1.0, D0 + 0.92, z + 0.25)), M.wood);
      for (const dx of [-0.85, 0.85]) {
        b.add(boxGeo(V(x + dx - 0.05, D0, z - 0.2), V(x + dx + 0.05, D0 + 0.42, z - 0.12)), M.iron);
        b.add(boxGeo(V(x + dx - 0.05, D0, z + 0.14), V(x + dx + 0.05, D0 + 0.95, z + 0.22)), M.iron);
      }
    }
    appleTree(b, TREE[0], TREE[1], TREE[2], 6.6);
    b.build(R);
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

    // flags on the keep (St George's cross)
    const flagM = lam("flagM", () => ({ map: flagTex(), side: THREE.DoubleSide }));
    for (const [x, z] of [[-47, 56]] as const) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6, 12, 1), flagM);
      f.position.set(x, D0 + 26.6, z); f.castShadow = true; f.frustumCulled = false;
      this.flags.push(f); R.add(f);
    }
    const pole = new Batch(); pole.add(boxGeo(V(-47.08, D0 + 21.5, 55.92), V(-46.92, D0 + 27.5, 56.08)), M.wood); pole.build(R);
    // chimney smoke (mill on the near bank, brewery chimney on the far bank)
    const smokeT = smokeTex();
    for (const [top, n] of [[[-22, D0 + 30.6, -77], 7], [[-80, D0 + 24.6, 93], 6]] as const)
      for (let k = 0; k < n; k++) {
        const mat = new THREE.MeshLambertMaterial({ map: smokeT, transparent: true, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.layers.set(NOINK);
        this.smoke.push({ m, mat, top: top as unknown as V3, k: k / n }); R.add(m);
      }
    // the bubble
    this.bubbleMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uWarm: { value: 0 } }, vertexShader: BUBBLE_VS, fragmentShader: BUBBLE_FS,
      transparent: true, depthWrite: false, fog: false, side: THREE.FrontSide });
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 40), this.bubbleMat);
    this.bubble.layers.set(NOINK); this.bubble.renderOrder = 6; this.bubble.frustumCulled = false; this.bubble.visible = false;
    R.add(this.bubble);
    // near framing objects: built once, outside the sight-line test, toggled per frame
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** Tower of London: curtain wall with round corner towers and a river gate (z = 37.5), the White Tower keep with
   *  three cupola turrets and one round turret, crenellations, dark slit windows */
  private buildTower(b: Batch, M: Mats) {
    const x0 = -76, x1 = -20, z0 = 37.5, z1 = 84, th = 2.4, H = 8;
    const gx = GATE[0], gw = 2.4, gh = 5.2;
    const merlons = (ax: number, az: number, bx: number, bz: number, y: number, mat: THREE.Material, w = 0.9, gap = 0.9, d = 0.7) => {
      const L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / (w + gap)), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let i = 0; i < n; i++) {
        const c = (i + 0.5) * (L / n), cx = ax + ux * c, cz = az + uz * c, hx = Math.abs(ux) * w / 2 + Math.abs(uz) * d / 2, hz = Math.abs(uz) * w / 2 + Math.abs(ux) * d / 2;
        b.add(boxGeo(V(cx - hx, y, cz - hz), V(cx + hx, y + 1.0, cz + hz)), mat);
      }
    };
    // curtain wall: front (with the gate), back, sides
    b.add(boxGeo(V(x0, D0 - 0.6, z0), V(gx - gw, D0 + H, z0 + th), 3), M.curtain);
    b.add(boxGeo(V(gx + gw, D0 - 0.6, z0), V(x1, D0 + H, z0 + th), 3), M.curtain);
    b.add(boxGeo(V(gx - gw, D0 + gh, z0), V(gx + gw, D0 + H, z0 + th), 3), M.curtain);
    b.add(boxGeo(V(x0, D0, z1 - th), V(x1, D0 + H, z1), 3), M.curtain);
    b.add(boxGeo(V(x0, D0, z0), V(x0 + th, D0 + H, z1), 3), M.curtain);
    b.add(boxGeo(V(x1 - th, D0, z0), V(x1, D0 + H, z1), 3), M.curtain);
    for (const [ax, az, bx, bz] of [[x0, z0 + 0.35, x1, z0 + 0.35], [x0, z1 - 0.35, x1, z1 - 0.35], [x0 + 0.35, z0, x0 + 0.35, z1], [x1 - 0.35, z0, x1 - 0.35, z1]] as const)
      merlons(ax, az, bx, bz, D0 + H, M.curtain);
    // gate: arch ring, dark passage, raised portcullis
    b.add(boxGeo(V(gx - gw, D0, z0 + 0.3), V(gx + gw, D0 + gh, z0 + th + 0.2)), M.dark);
    const arch = new THREE.TorusGeometry(gw + 0.25, 0.32, 8, 24, Math.PI); arch.translate(gx, D0 + gh - gw * 0.4, z0 - 0.12);
    b.add(arch, M.keep);
    for (const s of [-1, 1]) b.add(boxGeo(V(gx + s * (gw + 0.25) - 0.32, D0, z0 - 0.3), V(gx + s * (gw + 0.25) + 0.32, D0 + gh - gw * 0.4, z0 + 0.05)), M.keep);
    for (let i = 0; i < 6; i++) b.add(boxGeo(V(gx - gw + 0.3 + i * 0.85, D0 + gh - 1.1, z0 + 0.15), V(gx - gw + 0.42 + i * 0.85, D0 + gh - 0.05, z0 + 0.27)), M.iron);
    b.add(boxGeo(V(gx - gw, D0 + gh - 0.7, z0 + 0.12), V(gx + gw, D0 + gh - 0.58, z0 + 0.3)), M.iron);
    // round corner towers
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as const) {
      b.add(new THREE.CylinderGeometry(3.4, 3.6, 12, 20), M.curtain, new THREE.Matrix4().makeTranslation(cx, D0 + 5.4, cz));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        b.add(boxGeo(V(-0.5, 0, -0.35), V(0.5, 1.0, 0.35)), M.curtain, new THREE.Matrix4().makeRotationY(-a).setPosition(cx + Math.cos(a) * 3.1, D0 + 11.4, cz + Math.sin(a) * 3.1));
      }
    }
    // the White Tower
    const kx0 = -57, kx1 = -37, kz0 = 46, kz1 = 66, KH = 18;
    b.add(boxGeo(V(kx0, D0, kz0), V(kx1, D0 + KH, kz1), 4), M.keep);
    b.add(boxGeo(V(kx0 - 0.4, D0, kz0 - 0.4), V(kx1 + 0.4, D0 + 1.2, kz1 + 0.4), 4), M.curtain);  // plinth
    for (const [ax, az, bx, bz] of [[kx0, kz0 + 0.35, kx1, kz0 + 0.35], [kx0, kz1 - 0.35, kx1, kz1 - 0.35], [kx0 + 0.35, kz0, kx0 + 0.35, kz1], [kx1 - 0.35, kz0, kx1 - 0.35, kz1]] as const)
      merlons(ax, az, bx, bz, D0 + KH, M.keep, 1.0, 0.8, 0.6);
    // pilaster strips + slit windows on the river face (z = kz0) and the courtyard side faces
    for (let i = 0; i <= 4; i++) { const x = kx0 + (i * (kx1 - kx0)) / 4; b.add(boxGeo(V(x - 0.45, D0, kz0 - 0.25), V(x + 0.45, D0 + KH, kz0)), M.keep); }
    for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 4; i++) {
      const x = kx0 + ((i + 0.5) * (kx1 - kx0)) / 4, y = D0 + 3.4 + fl * 4.8;
      b.add(boxGeo(V(x - 0.5, y, kz0 - 0.08), V(x + 0.5, y + 1.9, kz0 + 0.02)), M.dark);
      b.add(boxGeo(V(x - 0.62, y - 0.2, kz0 - 0.16), V(x + 0.62, y - 0.05, kz0)), M.curtain);
    }
    for (const xs of [kx0, kx1]) for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 3; i++) {
      const z = kz0 + ((i + 0.5) * (kz1 - kz0)) / 3, y = D0 + 3.4 + fl * 4.8, o = xs === kx0 ? -0.08 : 0.08;
      b.add(boxGeo(V(xs + Math.min(0, o) - 0.0, y, z - 0.5), V(xs + Math.max(0, o), y + 1.9, z + 0.5)), M.dark);
    }
    // corner turrets: three square ones with lead cupolas, one round
    const turret = (cx: number, cz: number, round: boolean) => {
      if (round) b.add(new THREE.CylinderGeometry(2.3, 2.3, KH + 4, 18), M.keep, new THREE.Matrix4().makeTranslation(cx, D0 + (KH + 4) / 2, cz));
      else b.add(boxGeo(V(cx - 1.9, D0, cz - 1.9), V(cx + 1.9, D0 + KH + 3.2, cz + 1.9), 4), M.keep);
      const top = D0 + KH + (round ? 4 : 3.2);
      const dome = new THREE.SphereGeometry(round ? 2.4 : 2.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 1.25, 1);
      b.add(dome, M.lead, new THREE.Matrix4().makeTranslation(cx, top, cz));
      b.add(new THREE.ConeGeometry(0.35, 2.2, 10), M.lead, new THREE.Matrix4().makeTranslation(cx, top + (round ? 3.0 : 2.6) + 0.9, cz));
      b.add(new THREE.SphereGeometry(0.28, 10, 8), M.gold, new THREE.Matrix4().makeTranslation(cx, top + (round ? 3.0 : 2.6) + 2.1, cz));
    };
    turret(kx0, kz0, false); turret(kx1, kz0, true); turret(kx0, kz1, false); turret(kx1, kz1, false);
  }

  /** the Mint: a screw press (frame, screw, weighted bar), a table with stacks of coins, a timber canopy */
  private buildMint(b: Batch, M: Mats) {
    const [x, , z] = PRESS;
    b.add(boxGeo(V(x - 0.55, D0, z - 0.4), V(x + 0.55, D0 + 0.85, z + 0.4)), M.wood);           // block
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 0.42 - 0.1, D0 + 0.85, z - 0.14), V(x + s * 0.42 + 0.1, D0 + 2.05, z + 0.14)), M.iron); // uprights
    b.add(boxGeo(V(x - 0.62, D0 + 2.05, z - 0.18), V(x + 0.62, D0 + 2.35, z + 0.18)), M.iron);  // crown
    b.add(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 12), M.iron, new THREE.Matrix4().makeTranslation(x, D0 + 1.85, z)); // screw
    b.add(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8).rotateX(Math.PI / 2), M.iron, new THREE.Matrix4().makeTranslation(x, D0 + 2.6, z)); // bar
    for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.17, 14, 10), M.iron, new THREE.Matrix4().makeTranslation(x, D0 + 2.6, z + s * 1.1));
    b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), M.gold, new THREE.Matrix4().makeTranslation(x, D0 + 0.91, z)); // the die / a blank
    // table + coin stacks
    const tx = x + 0.2, tz = z - 1.5;
    b.add(boxGeo(V(tx - 0.6, D0 + 0.82, tz - 0.4), V(tx + 0.6, D0 + 0.9, tz + 0.4)), M.wood);
    for (const [dx, dz] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) b.add(boxGeo(V(tx + dx - 0.04, D0, tz + dz - 0.04), V(tx + dx + 0.04, D0 + 0.82, tz + dz + 0.04)), M.wood);
    for (const [dx, dz, n] of [[-0.3, -0.1, 7], [-0.05, 0.12, 11], [0.2, -0.08, 5], [0.38, 0.15, 9], [0.08, -0.2, 4]] as const)
      b.add(new THREE.CylinderGeometry(0.075, 0.075, 0.025 * n, 14), M.gold, new THREE.Matrix4().makeTranslation(tx + dx, D0 + 0.9 + 0.0125 * n, tz + dz));
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
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.8 : -0.8;
        p.setXYZ(i, -u * 2.6, y + 0.06 * u * Math.sin(t * 4 - u * 3), 0.3 * u * Math.sin(t * 5.5 - u * 5));
      }
      p.needsUpdate = true;
    }
    // ---- the bubble (only on the street shots) ----
    const bb = s.place === "street" ? bubble(f) : null;
    this.bubble.visible = !!bb;
    if (bb) {
      this.bubble.position.set(...bb.c); this.bubble.scale.setScalar(bb.r);
      this.bubbleMat.uniforms.uT.value = t; this.bubbleMat.uniforms.uWarm.value = s.light === "golden" ? 1 : 0;
    }
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
