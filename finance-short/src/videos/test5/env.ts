// The room for the 5 s test, built from code: a plank floor with grain and gaps, papered walls with a wainscot, a tall
// window in the left wall that the late sun shines through (its frame throws moving shadows), a desk with a lamp, a
// plant, a framed picture, and the gold coin. Every texture is painted on a canvas here (nothing downloaded).
import * as THREE from "three";

const rnd = (s: number) => { let x = s; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
const canvasTex = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
};

const floorTex = () => canvasTex(1024, 1024, (g) => {
  const r = rnd(7);
  const rows = 8, h = 1024 / rows;
  for (let i = 0; i < rows; i++) {
    let x = -r() * 400;
    while (x < 1024) {
      const len = 300 + r() * 380, base = 120 + r() * 35;
      g.fillStyle = `rgb(${base + 40},${base * 0.62 + 10},${base * 0.36})`; g.fillRect(x, i * h, len, h);
      for (let k = 0; k < 14; k++) { // grain
        g.strokeStyle = `rgba(60,30,15,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; g.beginPath();
        const y = i * h + r() * h; g.moveTo(x, y); for (let s = 0; s < len; s += 40) g.lineTo(x + s, y + Math.sin(s * 0.02 + k) * 3); g.stroke();
      }
      if (r() < 0.3) { g.fillStyle = "rgba(70,35,15,0.35)"; g.beginPath(); g.ellipse(x + r() * len, i * h + h / 2, 10, 6, 0, 0, 7); g.fill(); } // knot
      g.fillStyle = "rgba(30,15,8,0.8)"; g.fillRect(x, i * h, 3, h); x += len;
    }
    g.fillStyle = "rgba(30,15,8,0.85)"; g.fillRect(0, i * h, 1024, 3);
  }
}, [3, 3]);

const wallTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#cfd9c4"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#c2cfb6"; g.fillRect(x, 0, 30, 512); }
  const r = rnd(3);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255,0.35)"; const x = (i % 8) * 64 + 47, y = Math.floor(i / 8) * 70 + 20 + r() * 6; g.beginPath(); g.ellipse(x, y, 5, 8, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(80,90,70,${r() * 0.05})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
}, [4, 2]);

const panelTex = () => canvasTex(512, 256, (g) => {
  g.fillStyle = "#6b4026"; g.fillRect(0, 0, 512, 256);
  for (let x = 16; x < 512; x += 128) { g.fillStyle = "#5a351f"; g.fillRect(x, 24, 104, 208); g.fillStyle = "#7d4d2e"; g.fillRect(x + 6, 30, 92, 196); }
}, [5, 1]);

export type Room = { root: THREE.Group; sun: THREE.DirectionalLight; coin: THREE.Group; sky: THREE.Mesh };

export const buildRoom = (): Room => {
  const root = new THREE.Group();
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  const add = (m: THREE.Mesh, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; root.add(m); return m; };
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };

  // floor
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 9), std({ map: floorTex(), roughness: 0.55, metalness: 0 })), false, true);
  floor.rotation.x = -Math.PI / 2;
  // walls: back (z = -2.6) and left (x = -3.4) with a window opening
  const wall = std({ map: wallTex(), roughness: 0.9 });
  const H = 3.2;
  box(9, H, 0.12, wall, 0.4, H / 2, -2.6);
  const wx0 = -1.2, wx1 = 1.4, wy0 = 0.85, wy1 = 2.55; // window opening along z on the left wall
  const lw = (z0: number, z1: number, y0: number, y1: number) => box(0.14, y1 - y0, z1 - z0, wall, -3.4, (y0 + y1) / 2, (z0 + z1) / 2);
  lw(-2.6, wx0, 0, H); lw(wx1, 4.5, 0, H); lw(wx0, wx1, 0, wy0); lw(wx0, wx1, wy1, H);
  const frame = std({ color: "#f2ede2", roughness: 0.5 });
  for (const z of [wx0, (wx0 + wx1) / 2, wx1]) box(0.16, wy1 - wy0, 0.06, frame, -3.4, (wy0 + wy1) / 2, z);
  for (const y of [wy0, (wy0 + wy1) / 2, wy1]) box(0.16, 0.06, wx1 - wx0, frame, -3.4, y, (wx0 + wx1) / 2);
  // wainscot panels and a rail on the back wall
  const panel = std({ map: panelTex(), roughness: 0.6 });
  box(9, 0.95, 0.05, panel, 0.4, 0.475, -2.53);
  box(9, 0.06, 0.08, std({ color: "#4a2a18", roughness: 0.5 }), 0.4, 0.98, -2.52);
  box(9, 0.12, 0.06, std({ color: "#3a2418", roughness: 0.6 }), 0.4, 0.06, -2.52);
  // the sky outside the window
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a8") }));
  sky.position.set(-6.5, 2, 0); sky.rotation.y = Math.PI / 2; root.add(sky);
  // desk with a banker's lamp, papers and a mug
  const wood = std({ color: "#6a3d22", roughness: 0.4 });
  box(1.5, 0.06, 0.75, wood, 1.4, 0.76, -1.85);
  for (const [x, z] of [[0.72, -2.15], [2.08, -2.15], [0.72, -1.55], [2.08, -1.55]]) box(0.06, 0.74, 0.06, wood, x, 0.37, z);
  box(0.5, 0.55, 0.7, wood, 1.85, 0.47, -1.85);
  const brass = std({ color: "#c9a24a", metalness: 1, roughness: 0.25 });
  const lampBase = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 24), brass)); lampBase.position.set(1.0, 0.805, -2.0);
  const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10), brass)); stem.position.set(1.0, 0.97, -2.0);
  const shade = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.12, 24, 1, true), std({ color: "#1f6b45", metalness: 0.2, roughness: 0.25, side: THREE.DoubleSide })));
  shade.position.set(1.0, 1.16, -1.98);
  const bulb = new THREE.PointLight("#ffcf8a", 1.2, 3, 2); bulb.position.set(1.0, 1.1, -1.95); root.add(bulb);
  for (let i = 0; i < 3; i++) { const p = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), std({ color: "#f4efe2", roughness: 0.9 }))); p.position.set(1.5 + i * 0.02, 0.795 + i * 0.004, -1.8); p.rotation.y = 0.1 * i - 0.1; }
  const mug = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 20), std({ color: "#c8452f", roughness: 0.35 }))); mug.position.set(1.85, 0.84, -1.6);
  // chair
  const leather = std({ color: "#5a2620", roughness: 0.35 });
  box(0.5, 0.07, 0.48, leather, 1.4, 0.47, -1.2); box(0.5, 0.55, 0.07, leather, 1.4, 0.8, -0.98);
  const chrome = std({ color: "#b8bec6", metalness: 1, roughness: 0.2 });
  const post = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), chrome)); post.position.set(1.4, 0.22, -1.2);
  // plant in a pot
  const pot = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 24), std({ color: "#b5653f", roughness: 0.7 }))); pot.position.set(-2.6, 0.18, -2.0);
  const leafMat = std({ color: "#3f8a4a", roughness: 0.6, side: THREE.DoubleSide });
  const r = rnd(11);
  for (let i = 0; i < 16; i++) {
    const leaf = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), leafMat)); leaf.scale.set(0.35, 1.2, 0.12);
    const a = (i / 16) * Math.PI * 2, rr = 0.08 + r() * 0.1;
    leaf.position.set(-2.6 + Math.cos(a) * rr, 0.55 + r() * 0.35, -2.0 + Math.sin(a) * rr); leaf.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6);
  }
  // a framed picture on the back wall
  box(0.9, 0.62, 0.04, std({ color: "#3a2418", roughness: 0.5 }), -0.4, 1.95, -2.53);
  const pic = add(new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.5), new THREE.MeshStandardMaterial({ map: canvasTex(256, 160, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#9cc7ea"); gr.addColorStop(1, "#f2d29a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 160);
    g.fillStyle = "#5a7a4a"; g.beginPath(); g.moveTo(0, 160); g.lineTo(80, 70); g.lineTo(150, 120); g.lineTo(210, 60); g.lineTo(256, 110); g.lineTo(256, 160); g.fill();
  }), roughness: 0.8 })));
  pic.position.set(-0.4, 1.95, -2.505);
  // the coin: a thick gold disc with a rim and an embossed face
  const coin = new THREE.Group();
  const gold = std({ color: "#f2c230", metalness: 1, roughness: 0.22 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 48), gold); disc.castShadow = true; disc.receiveShadow = true; coin.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.004, 8, 48), gold); rim.rotation.x = Math.PI / 2; rim.position.y = 0.006; coin.add(rim);
  const emb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 6), gold); coin.add(emb);
  root.add(coin);
  // light: a low warm sun through the window, a cool fill from the room
  const sun = new THREE.DirectionalLight("#ffd6a0", 4.2);
  sun.position.set(-7.5, 4.2, 1.6); sun.target.position.set(0, 0.6, 0.2);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera as THREE.OrthographicCamera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 0.5; sc.far = 20;
  root.add(sun, sun.target);
  root.add(new THREE.HemisphereLight("#cfe0ff", "#6a4a32", 0.55));
  return { root, sun, coin, sky };
};
