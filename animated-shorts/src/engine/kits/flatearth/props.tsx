// ENGINE kit "flatearth" (03_flat_earth_bet): the flat-disc idea with its ice wall, the £500 newspaper, the Old Bedford fen
// (canal, banks, bridges, markers, telescope, own sky), placards, flying letters, the year board and a jail cell.
// Same style as the other kits: flat toon materials, painted canvas textures, ink-dark trims.
import React from 'react';
import * as THREE from 'three';
import {lookToon} from '../../look/look';
import {drawPlaque, drawWood, drawBrick} from '../../look/draw';
import {pop, type V3} from '../../core/clock';

const INK = '#241726', FONT = '"Archivo Black", Impact, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 24), plane = new THREE.PlaneGeometry(1, 1), sph = new THREE.SphereGeometry(1, 16, 12), circ = new THREE.CircleGeometry(1, 48);
const cone = new THREE.ConeGeometry(1, 1, 5);
const toon = (c: string, o: THREE.MeshToonMaterialParameters = {}) => lookToon({color: c, ...o});
const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const R = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

let MM: ReturnType<typeof makeMats> | null = null;
function makeMats() {
  // azimuthal flat-earth map (north pole centre, simplified blobby continents) with the ice rim painted at the edge
  const map = (() => { const c = cv(1024, 1024), g = c.getContext('2d')!, r = R(11); g.fillStyle = '#2f6fa8'; g.beginPath(); g.arc(512, 512, 500, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.arc(512, 512, k * 85, 0, 7); g.stroke(); } for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(512, 512); g.lineTo(512 + Math.cos(a * Math.PI / 6) * 500, 512 + Math.sin(a * Math.PI / 6) * 500); g.stroke(); }
    const blob = (x: number, y: number, s: number, col: string) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI * 2, rr = s * (0.7 + r() * 0.5); i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); };
    blob(420, 380, 120, '#7aa04a'); blob(620, 360, 140, '#8ab05a'); blob(640, 560, 90, '#c9a85a'); blob(380, 620, 100, '#7aa04a'); blob(760, 700, 70, '#c9a85a'); blob(300, 260, 60, '#8ab05a'); blob(512, 512, 30, '#f4f6f8');
    g.lineWidth = 60; g.strokeStyle = '#eef4fa'; g.beginPath(); g.arc(512, 512, 478, 0, 7); g.stroke(); g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.arc(512, 512, 506, 0, 7); g.stroke();
    return tex(c); })();
  const paper = (() => { const c = cv(768, 1024), g = c.getContext('2d')!; g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 768, 1024); g.fillStyle = INK; g.textAlign = 'center';
    g.font = `900 64px ${SERIF}`; g.fillText('THE WEEKLY TIMES', 384, 90); g.fillRect(40, 110, 688, 6); g.font = `italic 24px ${SERIF}`; g.fillText('England  ·  January 1870  ·  One Penny', 384, 146); g.fillRect(40, 162, 688, 3);
    g.fillStyle = '#b2391f'; g.fillRect(60, 200, 648, 300); g.fillStyle = '#fbf3e0'; g.font = `900 120px ${FONT}`; g.fillText('£500', 384, 330); g.font = `900 46px ${FONT}`; g.fillText('CHALLENGE', 384, 400); g.font = `italic 30px ${SERIF}`; g.fillText('to any man who can PROVE', 384, 446); g.fillText('that water CURVES', 384, 482);
    g.fillStyle = INK; g.font = `italic 30px ${SERIF}`; g.fillText('— John Hampden, Esq.', 384, 550);
    g.fillStyle = 'rgba(36,23,38,.55)'; for (let l = 0; l < 14; l++) { g.fillRect(60, 600 + l * 28, 300 - (l % 3) * 30, 10); g.fillRect(408, 600 + l * 28, 300 - ((l + 1) % 3) * 40, 10); } return tex(c); })();
  const letter = (() => { const c = cv(768, 560), g = c.getContext('2d')!; g.fillStyle = '#f6efdc'; g.fillRect(0, 0, 768, 560); g.strokeStyle = 'rgba(90,120,170,.35)'; g.lineWidth = 2; for (let y = 120; y < 540; y += 44) { g.beginPath(); g.moveTo(30, y); g.lineTo(738, y); g.stroke(); }
    g.fillStyle = '#2a1a3a'; g.font = `italic 40px ${SERIF}`; g.fillText('Madam,', 60, 100); g.font = `italic 700 62px ${SERIF}`; g.fillText('Your husband', 80, 230); g.fillText('is a THIEF!', 140, 320);
    g.font = `italic 34px ${SERIF}`; g.fillText('— J. H.', 480, 470); g.strokeStyle = '#b2391f'; g.lineWidth = 6; g.beginPath(); g.moveTo(140, 336); g.lineTo(560, 330); g.stroke(); return tex(c); })();
  const env = (() => { const c = cv(256, 160), g = c.getContext('2d')!; g.fillStyle = '#f2e6c8'; g.fillRect(0, 0, 256, 160); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 248, 152); g.lineWidth = 4; g.beginPath(); g.moveTo(4, 4); g.lineTo(128, 90); g.lineTo(252, 4); g.stroke();
    g.fillStyle = '#b2391f'; g.beginPath(); g.arc(128, 92, 16, 0, 7); g.fill(); return tex(c); })();
  const sky = (() => { const c = cv(2048, 512), g = c.getContext('2d')!, r = R(5), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#5a8ed0'); gr.addColorStop(0.62, '#a8c8ea'); gr.addColorStop(1, '#eaf0f2'); g.fillStyle = gr; g.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 26; i++) { const x = r() * 2048, y = 50 + r() * 220, s = 0.6 + r() * 1.3; g.fillStyle = 'rgba(255,255,255,.95)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + k * 34 * s, y - Math.sin(k / 5 * Math.PI) * 18 * s, 44 * s, 26 * s, 0, 0, 7); g.fill(); } }
    const t = tex(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; })();
  const grass = (() => { const c = cv(256, 256), g = c.getContext('2d')!, r = R(9); g.fillStyle = '#86ac52'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 700; i++) { g.fillStyle = r() > 0.5 ? 'rgba(60,100,40,.25)' : 'rgba(200,220,120,.25)'; g.fillRect(r() * 256, r() * 256, 2, 6); }
    const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(120, 60); return t; })();
  const brick = drawBrick('#8a5a4a', '#6a5a52'); brick.repeat.set(3, 2);
  return {
    map: lookToon({map, emissive: '#101820'}), rock: toon('#c8d8e8'), ice: toon('#eef4fa'), iceD: toon('#a8c4dc'), sun: new THREE.MeshBasicMaterial({color: '#ffd45a'}), moon: new THREE.MeshBasicMaterial({color: '#e8eaf0'}),
    paper: lookToon({map: paper, side: THREE.DoubleSide, emissive: '#1a1410'}), letter: lookToon({map: letter, side: THREE.DoubleSide, emissive: '#1a1410'}), env: lookToon({map: env, side: THREE.DoubleSide}),
    sky: new THREE.MeshBasicMaterial({map: sky, side: THREE.BackSide, fog: false}), skyCap: new THREE.MeshBasicMaterial({color: '#5a8ed0', side: THREE.DoubleSide, fog: false}),
    grass: lookToon({map: grass}), bank: toon('#6f8f44'), mud: toon('#8a6a48'), water: toon('#4a86b8'), waterHi: toon('#8ab8e0'), path: toon('#c8b48a'),
    wood: lookToon({map: drawWood('#8a5a32', {planks: 3, seed: 51})}), woodD: toon('#5a3a22'), stone: toon('#b8ac98'), iron: toon('#2e2a33'), brass: toon('#d9a84a'),
    red: toon('#c8432a'), white: toon('#fbf3e0'), leaf: toon('#4f7a3a'), trunk: toon('#6b4a30'), mill: toon('#e8dcc0'), millRoof: toon('#7a3b22'),
    brick: lookToon({map: brick}), floor: toon('#6a6260'), bench: toon('#7a5a3a'), line: new THREE.MeshBasicMaterial({color: '#e8483a'}),
    blob: new THREE.MeshBasicMaterial({color: '#000', transparent: true, opacity: 0.26, depthWrite: false}),
  };
}
const mats = () => (MM ??= makeMats());
const plaqueMats = new Map<string, THREE.Material>();
/** lettered board, cached by text */
export function boardMat(lines: [string, number, string?][], bg = '#fbf3e0', border = INK) {
  const k = JSON.stringify(lines) + bg + border; let m = plaqueMats.get(k);
  if (!m) { m = lookToon({map: drawPlaque(lines, {w: 1024, h: 512, bg, border}), emissive: '#1a1410'}); plaqueMats.set(k, m); }
  return m;
}

// ---------- the flat disc with its ice wall (the idea in Hampden's head) ----------
export const FlatDisc: React.FC<{p: V3; s?: number; spin?: number; k?: number; tilt?: number}> = ({p, s = 1, spin = 0, k = 1, tilt = 0.45}) => {
  if (k <= 0) return null; const M = mats(), sc = s * pop(k);
  return <group position={p} scale={sc} rotation={[tilt, 0, 0]}>
    <group rotation={[0, spin, 0]}>
      <mesh geometry={cyl} material={M.rock} position={[0, -0.12, 0]} scale={[1, 0.24, 1]} />
      <mesh geometry={cone} material={M.iceD} position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]} scale={[0.95, 0.4, 0.95]} />
      <mesh geometry={circ} material={M.map} position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      {Array.from({length: 36}, (_, i) => { const a = (i / 36) * Math.PI * 2, h = 0.1 + ((i * 7) % 5) * 0.025;
        return <mesh key={i} geometry={box} material={i % 3 ? M.ice : M.iceD} position={[Math.cos(a) * 0.98, h / 2, Math.sin(a) * 0.98]} rotation={[0, -a, 0]} scale={[0.05, h, 0.19]} />; })}
    </group>
    <mesh geometry={sph} material={M.sun} position={[0.45, 0.55, 0.1]} scale={0.08} /><mesh geometry={sph} material={M.moon} position={[-0.5, 0.5, -0.1]} scale={0.06} />
  </group>;
};

// ---------- newspaper (flies in) / letters / placards ----------
export const Newspaper: React.FC<{p: V3; ry?: number; k?: number; s?: number}> = ({p, ry = 0, k = 1, s = 1}) => {
  if (k <= 0) return null; const u = Math.min(1, k), sc = s * (0.2 + 0.8 * (1 - Math.pow(1 - u, 3)));
  return <mesh geometry={plane} material={mats().paper} position={p} rotation={[0, ry + (1 - u) * 6.3, (1 - u) * 0.8]} scale={[0.75 * sc, 1.0 * sc, 1]} />;
};
export const BigLetter: React.FC<{p: V3; ry?: number; k?: number; s?: number}> = ({p, ry = 0, k = 1, s = 1}) => {
  if (k <= 0) return null; const sc = s * pop(k);
  return <mesh geometry={plane} material={mats().letter} position={p} rotation={[0, ry, -0.05]} scale={[1.0 * sc, 0.73 * sc, 1]} />;
};
/** envelopes flying from `from` to `to` (each one launched `gap` s after the previous, `t` = seconds since the first) */
export const Letters: React.FC<{from: V3; to: V3; t: number; n: number; gap?: number; dur?: number; pile?: V3}> = ({from, to, t, n, gap = 0.25, dur = 0.7, pile}) => {
  const M = mats(), out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) { const u = (t - i * gap) / dur; if (u < 0) continue;
    if (u >= 1) { if (pile) out.push(<mesh key={i} geometry={box} material={M.env} position={[pile[0] + ((i * 37) % 7 - 3) * 0.07, pile[1] + 0.01 + i * 0.012, pile[2] + ((i * 53) % 5 - 2) * 0.06]} rotation={[0, i * 0.9, 0]} scale={[0.26, 0.012, 0.16]} />); continue; }
    const x = from[0] + (to[0] - from[0]) * u, z = from[2] + (to[2] - from[2]) * u, y = from[1] + (to[1] - from[1]) * u + Math.sin(Math.PI * u) * 0.8;
    out.push(<mesh key={i} geometry={plane} material={M.env} position={[x, y, z]} rotation={[0.3, u * 9 + i, Math.sin(u * 7 + i) * 0.5]} scale={[0.32, 0.2, 1]} />); }
  return <group>{out}</group>;
};
export const Placard: React.FC<{p: V3; lines: [string, number, string?][]; bg?: string; ry?: number; tilt?: number; k?: number; w?: number}> = ({p, lines, bg, ry = 0, tilt = 0, k = 1, w = 0.9}) => {
  if (k <= 0) return null; const M = mats(), s = pop(k);
  return <group position={p} rotation={[0, ry, tilt]} scale={s}>
    <mesh geometry={box} material={M.woodD} position={[0, -0.5, -0.02]} scale={[0.04, 1.0, 0.02]} />
    <mesh geometry={box} material={boardMat(lines, bg)} scale={[w, w / 2, 0.03]} castShadow /></group>;
};

// ---------- the Old Bedford fen: canal along x at FEN (z), markers, telescope, bridges, windmill, sky ----------
export const FEN: V3 = [0, 0, -260];
export const MARKER_X = [-20, 0, 20];   // markers along the canal (world x; the real six miles are squeezed for the frame), all 2.4 m above the water
export const MARKER_Y = 2.4;
export const Fen: React.FC<{marks?: number[]; lift?: number; line?: number; scope?: V3}> = ({marks = [0, 0, 0], lift = 0, line = 0, scope}) => {
  const M = mats(), z = FEN[2];
  return <group>
    <mesh geometry={new THREE.CylinderGeometry(185, 185, 160, 48, 1, true)} material={M.sky} position={[0, 60, z]} />
    <mesh geometry={circ} material={M.skyCap} position={[0, 139, z]} rotation={[Math.PI / 2, 0, 0]} scale={185} />
    {[-1, 1].map((sg) => <mesh key={'gr' + sg} geometry={plane} material={M.grass} position={[0, 0, z + sg * (3.4 + 95)]} rotation={[-Math.PI / 2, 0, 0]} scale={[380, 190, 1]} receiveShadow />)}
    {/* canal: water 5 m wide, sloped banks, towpath */}
    <mesh geometry={plane} material={M.water} position={[0, -0.25, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[360, 5, 1]} />
    {Array.from({length: 18}, (_, i) => <mesh key={'g' + i} geometry={plane} material={M.waterHi} position={[-170 + i * 20 + (i % 3) * 3, -0.24, z + ((i * 7) % 5 - 2) * 0.6]} rotation={[-Math.PI / 2, 0, 0]} scale={[4 + (i % 4), 0.08, 1]} />)}
    {[-1, 1].map((sg) => <group key={sg}>
      <mesh geometry={box} material={M.bank} position={[0, -0.13, z + sg * 2.9]} rotation={[sg * 0.5, 0, 0]} scale={[360, 0.05, 1.0]} receiveShadow />
      <mesh geometry={box} material={M.path} position={[0, 0.005, z + sg * 4.2]} scale={[360, 0.01, 1.4]} receiveShadow /></group>)}
    {/* bridges at both ends of the six miles (shown at +-150 m), a windmill, a few willows */}
    {[-150, 150].map((x) => <group key={'b' + x} position={[x, 0, z]}>
      <mesh geometry={box} material={M.stone} position={[0, 1.2, 0]} scale={[3.5, 0.5, 8]} castShadow /><mesh geometry={box} material={M.stone} position={[0, 0.5, -3.6]} scale={[3.5, 1.4, 0.8]} /><mesh geometry={box} material={M.stone} position={[0, 0.5, 3.6]} scale={[3.5, 1.4, 0.8]} />
      {[-1.6, 1.6].map((dx) => <mesh key={dx} geometry={box} material={M.stone} position={[dx, 1.7, 0]} scale={[0.25, 0.5, 8]} />)}</group>)}
    <group position={[40, 0, z - 40]}><mesh geometry={cyl} material={M.mill} position={[0, 4, 0]} scale={[2.4, 8, 2.4]} castShadow /><mesh geometry={cone} material={M.millRoof} position={[0, 9, 0]} scale={[2.8, 2.2, 2.8]} />
      <group position={[0, 7, 2.6]} rotation={[0, 0, 0.4]}>{[0, 1, 2, 3].map((i) => <mesh key={i} geometry={box} material={M.white} rotation={[0, 0, i * Math.PI / 2]} position={[0, 0, 0]} scale={[0.6, 9, 0.1]} />)}</group></group>
    {[[-30, -14], [-95, 12], [70, 16], [110, -18], [-130, -20], [20, 22]].map(([x, dz], i) => <group key={'t' + i} position={[x, 0, z + dz]}>
      <mesh geometry={cyl} material={M.trunk} position={[0, 1.5, 0]} scale={[0.25, 3, 0.25]} castShadow /><mesh geometry={sph} material={M.leaf} position={[0, 3.8, 0]} scale={[2.2, 1.8, 2.2]} castShadow /></group>)}
    {/* the three markers: post + red/white target disc; the middle one shows the curvature (lift) */}
    {MARKER_X.map((x, i) => { const k = marks[i] ?? 0; if (k <= 0) return null; const y = MARKER_Y + (i === 1 ? lift : 0);
      return <group key={'m' + i} position={[x, 0, z - 2.3]} scale={[1, pop(k), 1]}>
        <mesh geometry={box} material={M.woodD} position={[0, y / 2 - 0.2, 0]} scale={[0.22, y + 0.4, 0.22]} castShadow />
        <mesh geometry={cyl} material={M.white} position={[0, y, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.08, 1.0]} />
        <mesh geometry={cyl} material={M.red} position={[0, y, 0.2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.66, 0.06, 0.66]} />
        <mesh geometry={cyl} material={M.white} position={[0, y, 0.24]} rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 0.05, 0.3]} /></group>; })}
    {/* sight line from the first to the last marker */}
    {line > 0 && <mesh geometry={box} material={M.line} position={[MARKER_X[0] + (MARKER_X[2] - MARKER_X[0]) * line / 2, MARKER_Y, z - 2.1]} scale={[(MARKER_X[2] - MARKER_X[0]) * line, 0.12, 0.12]} />}
    {scope && <Telescope p={scope} />}
  </group>;
};
export const Telescope: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => { const M = mats();
  return <group position={p} rotation={[0, ry, 0]}>
    {[0, 1, 2].map((i) => { const a = i * 2.09; return <mesh key={i} geometry={cyl} material={M.woodD} position={[Math.cos(a) * 0.18, 0.42, Math.sin(a) * 0.18]} rotation={[Math.sin(a) * 0.38, 0, -Math.cos(a) * 0.38]} scale={[0.02, 0.9, 0.02]} />; })}
    <mesh geometry={cyl} material={M.brass} position={[0.08, 0.92, 0]} rotation={[0, 0, Math.PI / 2 - 0.04]} scale={[0.06, 0.7, 0.06]} castShadow />
    <mesh geometry={cyl} material={M.iron} position={[0.42, 0.935, 0]} rotation={[0, 0, Math.PI / 2 - 0.04]} scale={[0.075, 0.08, 0.075]} /></group>; };

// ---------- year board (flips through the years) ----------
const yearMats = new Map<number, THREE.Material>();
export const YearBoard: React.FC<{p: V3; year: number; ry?: number}> = ({p, year, ry = 0}) => {
  let m = yearMats.get(year); if (!m) { m = boardMat([[String(year), 1, '#241726']], '#f2e3c0', '#7a3b22'); yearMats.set(year, m); }
  const M = mats(); return <group position={p} rotation={[0, ry, 0]}>
    <mesh geometry={box} material={M.woodD} position={[0, 0, -0.03]} scale={[1.3, 0.75, 0.04]} /><mesh geometry={box} material={m} scale={[1.2, 0.62, 0.05]} castShadow />
    {[-0.4, 0.4].map((x) => <mesh key={x} geometry={cyl} material={M.iron} position={[x, 0.34, 0.03]} rotation={[Math.PI / 2, 0, 0]} scale={[0.03, 0.04, 0.03]} />)}</group>;
};

// ---------- jail cell (interior, front bars at +z of JAIL) ----------
export const JAIL: V3 = [0, 0, -420];
export const JailCell: React.FC<{bars?: number}> = ({bars = 1}) => {
  const M = mats(), [x0, , z0] = JAIL, W = 3.4, D = 2.6, H = 2.8, HW = 5.5;
  return <group position={[x0, 0, z0]}>
    <mesh geometry={plane} material={M.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} scale={[12, 10, 1]} receiveShadow />
    <mesh geometry={box} material={M.brick} position={[0, HW / 2, -D / 2]} scale={[12, HW, 0.2]} /><mesh geometry={box} material={M.brick} position={[-W / 2, HW / 2, 0]} scale={[0.2, HW, D]} /><mesh geometry={box} material={M.brick} position={[W / 2, HW / 2, 0]} scale={[0.2, HW, D]} />
    <mesh geometry={box} material={M.stone} position={[0, H + 0.1, 0]} scale={[W + 0.4, 0.2, D + 0.4]} /><mesh geometry={box} material={M.brick} position={[0, H + 0.2 + (HW - H) / 2, D / 2]} scale={[12, HW - H, 0.2]} />
    <mesh geometry={box} material={M.stone} position={[0, HW, 2.5]} scale={[12, 0.2, 10]} />{[-6, 6].map((x) => <mesh key={x} geometry={box} material={M.brick} position={[x, HW / 2, 2.5]} scale={[0.2, HW, 10]} />)}
    <mesh geometry={box} material={M.bench} position={[0.7, 0.32, -0.95]} scale={[1.4, 0.08, 0.45]} castShadow />
    <mesh geometry={box} material={M.iron} position={[0, 2.05, -1.18]} scale={[0.7, 0.45, 0.06]} />{[-0.2, 0, 0.2].map((x) => <mesh key={x} geometry={box} material={M.stone} position={[x, 2.05, -1.14]} scale={[0.04, 0.45, 0.04]} />)}
    {/* bars slide shut: bars = 0 open (slid to +x) .. 1 shut */}
    <group position={[(1 - bars) * W * 0.9, 0, D / 2]}>
      <mesh geometry={box} material={M.iron} position={[0, 0.06, 0]} scale={[W, 0.1, 0.1]} /><mesh geometry={box} material={M.iron} position={[0, H - 0.05, 0]} scale={[W, 0.1, 0.1]} /><mesh geometry={box} material={M.iron} position={[0, 1.35, 0]} scale={[W, 0.06, 0.06]} />
      {Array.from({length: 13}, (_, i) => <mesh key={i} geometry={cyl} material={M.iron} position={[-W / 2 + 0.13 + i * (W - 0.26) / 12, H / 2, 0]} scale={[0.028, H, 0.028]} castShadow />)}</group>
    {/* corridor wall behind the camera side + a lamp */}
    <mesh geometry={box} material={M.brick} position={[0, HW / 2, D / 2 + 5.6]} scale={[12, HW, 0.2]} />
    <mesh geometry={sph} material={M.sun} position={[-1.4, 2.4, D / 2 + 0.6]} scale={0.08} />
  </group>;
};
