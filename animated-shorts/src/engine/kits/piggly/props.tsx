// ENGINE kit "piggly" (02_piggly_wiggly): counter-service counter, turnstile, sign overlays for the downtown block,
// the pink marble palace (scaffolded / finished / museum), the stock board, museum ropes, plain sign boards.
// Same style as the other kits: flat toon materials (lookToon), painted canvas textures, ink-dark trims.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lookToon} from '../../look/look';
import {drawPlaque, drawWood} from '../../look/draw';
import {UNITS, NEAR_Z, FAR_Z} from '../downtown/townData';
import {pop, type V3} from '../../core/clock';

const INK = '#241726', FONT = '"Archivo Black", Impact, sans-serif';
const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 18), plane = new THREE.PlaneGeometry(1, 1), sph = new THREE.SphereGeometry(1, 14, 10);
const circ = new THREE.CircleGeometry(1, 24);
const toon = (c: string, o: THREE.MeshToonMaterialParameters = {}) => lookToon({color: c, ...o});
const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const plaqueMat = (lines: [string, number, string?][], o: Parameters<typeof drawPlaque>[1]) => lookToon({map: drawPlaque(lines, o), emissive: '#2a1a10'});

// ---------- shared materials (built once, lazily: canvas needs the DOM) ----------
let MM: ReturnType<typeof makeMats> | null = null;
function makeMats() {
  const marble = (() => { const c = cv(512, 512), g = c.getContext('2d')!; g.fillStyle = '#eeb3ab'; g.fillRect(0, 0, 512, 512);
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < 512; y += 64) { g.fillStyle = 'rgba(120,50,50,.16)'; g.fillRect(0, y, 512, 3); for (let x = (y / 64) % 2 ? 0 : 64; x < 512; x += 128) g.fillRect(x, y, 3, 64); }
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(${r() > 0.5 ? '255,240,235' : '170,90,90'},.35)`; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += r() * 60; g.lineTo(x, y); } g.stroke(); }
    const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const m = (t: THREE.Texture, rx: number, ry: number) => { const k = t.clone(); k.needsUpdate = true; k.repeat.set(rx, ry); return lookToon({map: k}); };
  const wood = drawWood('#8a5a32', {planks: 3, seed: 41});
  return {
    marble: m(marble, 3, 1.4), marbleS: m(marble, 1, 1.4), pinkTrim: toon('#f8dcd4'), pinkDark: toon('#c8857e'), roof: toon('#6a5a66'),
    glass: toon('#3a4a68'), glassHi: toon('#8fb0d8'), cream: toon('#f4ead6'), ink: toon(INK), iron: toon('#2e2a33'), brass: toon('#d9a84a'),
    lawn: toon('#7aa04a'), lawnD: toon('#5f8a3e'), path: toon('#d8cdb4'), hedge: toon('#4f7a3a'), dirt: toon('#a8784a'),
    pole: toon('#a8784a'), plank: lookToon({map: wood}), tarp: toon('#d8cdb4', {side: THREE.DoubleSide}),
    counter: lookToon({map: drawWood('#7a3b22', {planks: 3, seed: 21})}), counterTop: toon('#4a2416'), counterP: toon('#8d4a2a'),
    rope: toon('#b2391f'), red: toon('#c8432a'), white: toon('#fbf3e0'), can: toon('#d0532f'), can2: toon('#3f8a86'), can3: toon('#f2b234'),
    blob: new THREE.MeshBasicMaterial({color: '#000', transparent: true, opacity: 0.26, depthWrite: false}),
    pwSign: plaqueMat([['PIGGLY WIGGLY', 3, '#fbf3e0'], ['SERVE YOURSELF', 0.9, '#f2b234']], {w: 1024, h: 288, bg: '#c8432a', border: '#fbf3e0', inner: '#241726', rivets: true}),
    pwSmall: plaqueMat([['PIGGLY WIGGLY', 1, '#fbf3e0']], {w: 1024, h: 200, bg: '#c8432a', border: '#fbf3e0'}),
    museum: plaqueMat([['PINK PALACE', 1.3, '#fbf3e0'], ['MUSEUM', 1, '#f2b234']], {w: 1024, h: 384, bg: '#3d4a66', border: '#f2b234', rivets: true}),
    replica: plaqueMat([['REPLICA', 1.2, '#b2391f'], ['THE FIRST SELF-SERVICE STORE', 0.6, '#241726'], ['MEMPHIS · 1916', 0.8, '#241726']], {w: 1024, h: 640, bg: '#f2e3c0', border: '#241726', inner: '#b2391f'}),
    creditors: plaqueMat([['PROPERTY OF', 0.8, '#241726'], ['THE CREDITORS', 1, '#b2391f']], {w: 1024, h: 512, bg: '#fbf3e0', border: '#241726'}),
  };
}
const mats = () => (MM ??= makeMats());
const signMats = new Map<string, THREE.Material>();
/** a lettered sign board (cached by text) */
export function signMat(text: string, bg = '#27493f', fg = '#f6e7b4', sub?: string) {
  const k = text + bg + fg + (sub ?? ''); let m = signMats.get(k);
  if (!m) { m = plaqueMat(sub ? [[text, 2, fg], [sub, 0.8, fg]] : [[text, 1, fg]], {w: 1024, h: sub ? 288 : 200, bg, border: fg, rivets: true}); signMats.set(k, m); }
  return m;
}

// ---------- the long service counter (before Saunders): shopper side at +z ----------
export type CounterP = {p: V3; len: number; ry?: number; cans?: number; tilt?: number};
export const ServiceCounter: React.FC<{c: CounterP}> = ({c}) => {
  const M = mats(), H = 0.66, D = 0.6, L = c.len;
  return (
    <group position={c.p} rotation={[c.tilt ?? 0, c.ry ?? 0, 0]}>
      <mesh geometry={circ} material={M.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[L * 0.55, 0.45, 1]} />
      <mesh geometry={box} material={M.counter} position={[0, H / 2, 0]} scale={[L, H, D]} castShadow receiveShadow />
      <mesh geometry={box} material={M.counterTop} position={[0, H + 0.03, 0]} scale={[L + 0.1, 0.06, D + 0.12]} castShadow />
      {(() => { const n = Math.max(1, Math.round(L / 0.5)); return Array.from({length: n}, (_, i) => <mesh key={i} geometry={box} material={M.counterP} position={[-L / 2 + (i + 0.5) * (L / n), H * 0.48, D / 2 + 0.006]} scale={[L / n - 0.08, H * 0.7, 0.02]} />); })()}
      {Array.from({length: c.cans ?? 0}, (_, i) => <group key={'k' + i} position={[-0.45 + i * 0.18, H + 0.06, 0.12]}>
        <mesh geometry={cyl} material={[M.can, M.can2, M.can3][i % 3]} position={[0, 0.08, 0]} scale={[0.06, 0.16, 0.06]} castShadow /><mesh geometry={cyl} material={M.white} position={[0, 0.08, 0]} scale={[0.062, 0.07, 0.062]} /></group>)}
    </group>);
};

// ---------- turnstile (three arms at hip height of the short cast) ----------
export const Turnstile: React.FC<{p: V3; ry?: number; spin?: number}> = ({p, ry = 0, spin = 0}) => {
  const M = mats();
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh geometry={circ} material={M.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={0.3} />
      <mesh geometry={cyl} material={M.iron} position={[0, 0.03, 0]} scale={[0.16, 0.06, 0.16]} />
      <mesh geometry={cyl} material={M.brass} position={[0, 0.27, 0]} scale={[0.06, 0.5, 0.06]} castShadow />
      <mesh geometry={box} material={M.brass} position={[0, 0.56, 0]} scale={[0.16, 0.16, 0.16]} castShadow />
      <group position={[0, 0.56, 0]} rotation={[0, spin, 0]}>
        {[0, 1, 2].map((i) => <group key={i} rotation={[0, (i * 2 * Math.PI) / 3, 0]}><group rotation={[0, 0, -0.35]}>
          <mesh geometry={cyl} material={M.iron} position={[0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.022, 0.42, 0.022]} castShadow />
          <mesh geometry={sph} material={M.brass} position={[0.44, 0, 0]} scale={0.035} /></group></group>)}
      </group>
      {/* side rail that makes the turnstile the only way in */}
      <mesh geometry={cyl} material={M.brass} position={[1.1, 0.3, 0]} scale={[0.03, 0.6, 0.03]} castShadow />
      <mesh geometry={cyl} material={M.brass} position={[1.1, 0.6, -0.45]} rotation={[Math.PI / 2, 0, 0]} scale={[0.025, 0.9, 0.025]} />
      <mesh geometry={cyl} material={M.brass} position={[1.1, 0.3, -0.9]} scale={[0.03, 0.6, 0.03]} castShadow />
    </group>);
};

// ---------- sign overlays on the downtown block ----------
/** unit of townData by (part of) its sign text */
export const unitBy = (s: string) => UNITS.find((u) => u.sign.includes(s))!;
/** a new sign board in front of a unit's painted sign (pop 0..1 = flips in) */
export const UnitSign: React.FC<{sign: string; mat: THREE.Material; k?: number; dz?: number}> = ({sign, mat, k = 1, dz = 0}) => {
  const u = unitBy(sign); if (!u || k <= 0) return null;
  const w = u.x1 - u.x0, cx = (u.x0 + u.x1) / 2, z = u.side === 1 ? NEAR_Z + 0.16 + dz : FAR_Z - 0.16 - dz, s = pop(k);
  return <group position={[cx, 3.62, z]} rotation={[0, u.side === 1 ? 0 : Math.PI, (1 - Math.min(1, k * 1.3)) * 0.6]} scale={[s, s, 1]}>
    <mesh geometry={box} material={mats().ink} position={[0, 0, -0.03]} scale={[w - 0.9, 0.98, 0.05]} />
    <mesh geometry={box} material={mat} scale={[w - 1.1, 0.82, 0.06]} />
  </group>;
};
export const pwSmall = () => mats().pwSmall;
/** the hero shop sign over the grocery door (store.tsx draws GROCERY at (0, 3.7, 4.235), 3.6 x 0.9) */
export const PWStoreSign: React.FC = () => <group position={[0, 3.7, 4.27]}>
  <mesh geometry={box} material={mats().ink} position={[0, 0, -0.01]} scale={[3.95, 1.06, 0.04]} />
  <mesh geometry={box} material={mats().pwSign} scale={[3.75, 0.94, 0.05]} /></group>;

// ---------- the pink marble palace (front faces +z), centre p ----------
export type PalaceState = 'build' | 'done' | 'museum';
export const PALACE: V3 = [0, 0, -110];
export const Palace: React.FC<{state: PalaceState; sold?: number}> = ({state, sold = 0}) => {
  const M = mats(), build = state === 'build';
  const win = (x: number, y: number, z: number, w = 1.1, h = 1.9, key = '') => <group key={key + x + '_' + y} position={[x, y, z]}>
    <mesh geometry={box} material={M.pinkTrim} scale={[w + 0.3, h + 0.3, 0.12]} /><mesh geometry={box} material={M.glass} position={[0, 0, 0.04]} scale={[w, h, 0.1]} />
    <mesh geometry={box} material={M.pinkTrim} position={[0, 0, 0.1]} scale={[0.07, h, 0.04]} /><mesh geometry={box} material={M.pinkTrim} position={[0, h * 0.1, 0.1]} scale={[w, 0.07, 0.04]} />
    <mesh geometry={box} material={M.glassHi} position={[-w * 0.24, h * 0.28, 0.095]} scale={[w * 0.12, h * 0.3, 0.02]} rotation={[0, 0, 0.35]} />
    <mesh geometry={box} material={M.pinkTrim} position={[0, h / 2 + 0.3, 0.05]} scale={[w + 0.6, 0.18, 0.25]} /></group>;
  const wingH = 7.2, midH = 9.6;
  return (
    <group position={PALACE}>
      {/* grounds */}
      <mesh geometry={plane} material={M.lawn} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 12]} scale={[120, 70, 1]} receiveShadow />
      <mesh geometry={plane} material={build ? M.dirt : M.path} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 16]} scale={[4, 26, 1]} receiveShadow />
      {!build && [-1, 1].map((s) => <mesh key={'hd' + s} geometry={box} material={M.hedge} position={[s * 9, 0.4, 9]} scale={[11, 0.8, 0.9]} castShadow />)}
      {/* central block */}
      <mesh geometry={box} material={M.marble} position={[0, midH / 2, 0]} scale={[13, midH, 10]} castShadow receiveShadow />
      <mesh geometry={box} material={M.pinkTrim} position={[0, midH + 0.15, 0]} scale={[13.6, 0.3, 10.6]} castShadow />
      <mesh geometry={box} material={M.roof} position={[0, midH + 0.9, -0.5]} scale={[12, 1.3, 8.5]} castShadow />
      {/* wings (right wing unfinished while building) */}
      {[-1, 1].map((s) => { const half = build && s > 0, h = half ? wingH * 0.55 : wingH;
        return <group key={'w' + s} position={[s * 11.5, 0, -0.8]}>
          <mesh geometry={box} material={M.marbleS} position={[0, h / 2, 0]} scale={[10, h, 8.4]} castShadow receiveShadow />
          {!half && <><mesh geometry={box} material={M.pinkTrim} position={[0, h + 0.12, 0]} scale={[10.5, 0.24, 8.9]} castShadow />
            {Array.from({length: 9}, (_, i) => <mesh key={i} geometry={cyl} material={M.pinkTrim} position={[-4.6 + i * 1.15, h + 0.55, 4.2]} scale={[0.12, 0.6, 0.12]} />)}
            <mesh geometry={box} material={M.pinkTrim} position={[0, h + 0.9, 4.2]} scale={[10.2, 0.14, 0.3]} /></>}
          {[-3, 0, 3].map((x) => win(x, 1.9, 4.22, 1.2, 2.0, 'a'))}
          {!half && [-3, 0, 3].map((x) => win(x, 5.1, 4.22, 1.1, 1.7, 'b'))}
        </group>; })}
      {/* windows of the centre block */}
      {[-4.8, -2.9, 2.9, 4.8].map((x) => win(x, 2.1, 5.02, 1.1, 2.2, 'c'))}
      {[-4.8, -2.9, 0, 2.9, 4.8].map((x) => win(x, 6.3, 5.02, 1.0, 1.9, 'd'))}
      {/* portico: steps, columns, pediment */}
      {[0, 1, 2].map((i) => <mesh key={'st' + i} geometry={box} material={M.pinkTrim} position={[0, 0.15 + i * 0.3, 7.4 - i * 0.45]} scale={[7 - i * 0.5, 0.3, 1.4]} castShadow receiveShadow />)}
      <mesh geometry={box} material={M.pinkTrim} position={[0, 0.95, 5.9]} scale={[6.4, 0.2, 2.2]} receiveShadow />
      {[-2.7, -0.9, 0.9, 2.7].map((x) => <group key={'col' + x} position={[x, 0, 6.6]}>
        <mesh geometry={cyl} material={M.pinkTrim} position={[0, 4.2, 0]} scale={[0.32, 6.4, 0.32]} castShadow />
        <mesh geometry={box} material={M.pinkTrim} position={[0, 1.2, 0]} scale={[0.8, 0.3, 0.8]} /><mesh geometry={box} material={M.pinkTrim} position={[0, 7.45, 0]} scale={[0.8, 0.26, 0.8]} /></group>)}
      <mesh geometry={box} material={M.pinkTrim} position={[0, 7.8, 6.0]} scale={[6.8, 0.5, 2.0]} castShadow />
      <mesh position={[0, 8.05, 7.0]} castShadow><extrudeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(-3.5, 0); s.lineTo(3.5, 0); s.lineTo(0, 1.7); s.closePath(); return s; })(), {depth: 0.25, bevelEnabled: false}]} /><primitive object={M.pinkTrim} attach="material" /></mesh>
      <mesh geometry={box} material={M.ink} position={[0, 2.35, 5.02]} scale={[1.7, 2.9, 0.08]} />
      <mesh geometry={box} material={M.pinkDark} position={[0, 2.35, 5.07]} scale={[1.5, 2.7, 0.06]} />
      {/* scaffolding + material piles while it is being built */}
      {build && <group position={[11.5, 0, 3.6]}>
        {[-4.6, -1.5, 1.5, 4.6].map((x) => [0, 1.4].map((z) => <mesh key={x + '_' + z} geometry={cyl} material={M.pole} position={[x, 3.6, z]} scale={[0.07, 7.2, 0.07]} castShadow />))}
        {[2.0, 4.0, 6.0].map((y) => <group key={'lv' + y}><mesh geometry={box} material={M.plank} position={[0, y, 0.7]} scale={[9.6, 0.08, 1.5]} castShadow />
          <mesh geometry={cyl} material={M.pole} position={[0, y + 0.9, 1.4]} rotation={[0, 0, Math.PI / 2]} scale={[0.045, 9.4, 0.045]} /></group>)}
        {[-3, 0, 3].map((x) => <mesh key={'x' + x} geometry={cyl} material={M.pole} position={[x, 3, 1.45]} rotation={[0, 0, 0.6]} scale={[0.04, 4.6, 0.04]} />)}
        <mesh geometry={box} material={M.marbleS} position={[-2.5, 0.35, 3.0]} scale={[1.4, 0.7, 1.0]} castShadow /><mesh geometry={box} material={M.marbleS} position={[-1.0, 0.3, 3.3]} scale={[1.0, 0.6, 0.8]} castShadow />
        <mesh geometry={box} material={M.tarp} position={[1.2, 0.25, 3.1]} scale={[1.6, 0.5, 1.2]} castShadow />
      </group>}
      {build && <group position={[-11.5, 0, 3.6]}>
        {[-4.6, 4.6].map((x) => <mesh key={x} geometry={cyl} material={M.pole} position={[x, 3.8, 0.4]} scale={[0.07, 7.6, 0.07]} castShadow />)}
        <mesh geometry={box} material={M.plank} position={[0, 6.4, 0.4]} scale={[9.6, 0.08, 1.2]} castShadow />
      </group>}
      {/* museum banner + sign on the lawn */}
      {state === 'museum' && <>
        <mesh geometry={box} material={M.museum} position={[0, 9.0, 7.3]} scale={[4.8, 1.8, 0.1]} />
        <group position={[-3.6, 0, 13]}><mesh geometry={cyl} material={M.iron} position={[-1, 0.6, 0]} scale={[0.05, 1.2, 0.05]} /><mesh geometry={cyl} material={M.iron} position={[1, 0.6, 0]} scale={[0.05, 1.2, 0.05]} />
          <mesh geometry={box} material={M.museum} position={[0, 1.2, 0]} scale={[2.4, 0.9, 0.08]} castShadow /></group></>}
      {sold > 0 && <group position={[3.4, 0, 12.5]} scale={[1, pop(sold), 1]}>
        <mesh geometry={box} material={M.plank} position={[0, 0.55, -0.04]} scale={[0.1, 1.1, 0.06]} castShadow />
        <mesh geometry={box} material={M.creditors} position={[0, 1.15, 0]} scale={[1.5, 0.75, 0.06]} castShadow /></group>}
    </group>);
};

// ---------- stock board (live chart) ----------
/** price path: bear raid dips, Saunders buys it up, then TRADING SUSPENDED stamp (stamp 0..1) */
const board = (() => { if (typeof document === 'undefined') return null as any; const c = cv(1024, 768); const t = tex(c); return {c, t, last: ''}; })();
function paintBoard(prog: number, stamp: number) {
  const k = prog.toFixed(3) + '_' + stamp.toFixed(2); if (board.last === k) return; board.last = k;
  const g = board.c.getContext('2d')!; g.fillStyle = '#1f3a32'; g.fillRect(0, 0, 1024, 768);
  g.lineWidth = 26; g.strokeStyle = '#8a5a30'; g.strokeRect(13, 13, 998, 742);
  g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 70px ${FONT}`; g.fillText('PIGGLY WIGGLY  ·  STOCK', 512, 90);
  g.strokeStyle = 'rgba(244,241,230,.3)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(90, 190 + i * 110); g.lineTo(940, 190 + i * 110); g.stroke(); }
  const P = [[0, 40], [0.18, 39], [0.3, 33], [0.4, 30], [0.5, 38], [0.62, 60], [0.74, 85], [0.86, 108], [1, 124]];
  const price = (u: number) => { for (let i = 1; i < P.length; i++) if (u <= P[i][0]) { const a = P[i - 1], b = P[i], w = (u - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * w; } return 124; };
  const X = (u: number) => 100 + u * 830, Y = (p: number) => 650 - (p - 20) * 4.4;
  g.strokeStyle = '#f2b234'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= 60; i++) { const u = (i / 60) * prog; i ? g.lineTo(X(u), Y(price(u))) : g.moveTo(X(u), Y(price(u))); } g.stroke();
  const pr = price(prog); g.fillStyle = '#f2b234'; g.beginPath(); g.arc(X(prog), Y(pr), 16, 0, 7); g.fill();
  g.fillStyle = '#f4f1e6'; g.font = `900 64px ${FONT}`; g.textAlign = 'left'; g.fillText('$' + Math.round(pr), 110, 700 - 0);
  if (stamp > 0) { g.save(); g.translate(512, 420); g.rotate(-0.18); const s = 1 + 0.6 * (1 - Math.min(1, stamp)); g.scale(s, s); g.globalAlpha = Math.min(1, stamp * 1.5);
    g.fillStyle = 'rgba(178,57,31,.92)'; g.fillRect(-430, -110, 860, 220); g.lineWidth = 14; g.strokeStyle = '#fbf3e0'; g.strokeRect(-410, -90, 820, 180);
    g.fillStyle = '#fbf3e0'; g.textAlign = 'center'; g.font = `900 84px ${FONT}`; g.fillText('TRADING', 0, -32); g.fillText('SUSPENDED', 0, 52); g.restore(); }
  board.t.needsUpdate = true;
}
const boardMat = (() => { if (typeof document === 'undefined') return null as any; return lookToon({map: board.t, emissive: '#101010'}); })();
export const StockBoard: React.FC<{p: V3; ry?: number; prog: number; stamp: number}> = ({p, ry = 0, prog, stamp}) => {
  paintBoard(prog, stamp); const M = mats();
  return <group position={p} rotation={[0, ry, 0]}>
    <mesh geometry={circ} material={M.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[1.3, 0.4, 1]} />
    {[-1.15, 1.15].map((x) => <mesh key={x} geometry={box} material={M.plank} position={[x, 1.0, -0.12]} rotation={[-0.08, 0, 0]} scale={[0.09, 2.0, 0.09]} castShadow />)}
    <mesh geometry={box} material={M.plank} position={[0, 1.0, -0.55]} rotation={[0.35, 0, 0]} scale={[0.08, 2.0, 0.08]} />
    <mesh geometry={box} material={boardMat} position={[0, 1.55, 0]} rotation={[-0.08, 0, 0]} scale={[2.5, 1.85, 0.06]} castShadow />
  </group>;
};

// ---------- museum ropes + plaque ----------
export const Ropes: React.FC<{posts: V3[]}> = ({posts}) => {
  const M = mats();
  return <group>{posts.map((p, i) => <group key={i} position={p}>
    <mesh geometry={circ} material={M.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={0.18} />
    <mesh geometry={cyl} material={M.brass} position={[0, 0.03, 0]} scale={[0.13, 0.05, 0.13]} /><mesh geometry={cyl} material={M.brass} position={[0, 0.36, 0]} scale={[0.03, 0.7, 0.03]} castShadow />
    <mesh geometry={sph} material={M.brass} position={[0, 0.72, 0]} scale={0.045} /></group>)}
    {posts.slice(1).map((q, i) => { const a = new THREE.Vector3(...posts[i]).setY(0.68), b = new THREE.Vector3(...q).setY(0.68), N = 8;
      return Array.from({length: N}, (_, j) => { const u0 = j / N, u1 = (j + 1) / N, sag = (u: number) => -0.16 * 4 * u * (1 - u);
        const p0 = a.clone().lerp(b, u0).add(new THREE.Vector3(0, sag(u0), 0)), p1 = a.clone().lerp(b, u1).add(new THREE.Vector3(0, sag(u1), 0)), d = p1.clone().sub(p0);
        return <mesh key={i + '_' + j} geometry={cyl} material={M.rope} position={p0.clone().lerp(p1, 0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())} scale={[0.022, d.length() + 0.01, 0.022]} />; }); })}
  </group>;
};
export const Plaque: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => { const M = mats();
  return <group position={p} rotation={[0, ry, 0]}><mesh geometry={cyl} material={M.brass} position={[0, 0.4, 0]} scale={[0.04, 0.8, 0.04]} castShadow />
    <mesh geometry={box} material={M.replica} position={[0, 0.85, 0]} rotation={[-0.5, 0, 0]} scale={[0.8, 0.5, 0.04]} castShadow /></group>; };

/** basket stack by the entrance */
export const BasketStack: React.FC<{p: V3}> = ({p}) => { const M = mats();
  return <group position={p}>{[0, 1, 2, 3].map((i) => <group key={i} position={[0, 0.1 + i * 0.07, 0]}>
    <mesh geometry={cyl} material={M.plank} scale={[0.2, 0.14, 0.16]} castShadow /><mesh geometry={cyl} material={M.pole} position={[0, 0.0, 0]} scale={[0.205, 0.03, 0.165]} /></group>)}
    <mesh geometry={box} material={M.red} position={[0, 0.48, 0.18]} scale={[0.34, 0.12, 0.02]} /></group>; };
