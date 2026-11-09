// VACKO props: phone, glossy expense icons, paycheck, banknotes, coins, hand, wallet, jar.
// Vector art only (no stock), drawn in the brand palette so every scene stays on-brand.
import { el, loadImage, svgURL, rng } from './kit.js';

let uid = 0;
const id = p => `${p}${++uid}`;

// ---------- phone ----------
export function phone(parent, { w = 380, h = 780, cls = '' } = {}) {
  const root = el('div', 'phone ' + cls, parent);
  root.style.width = w + 'px'; root.style.height = h + 'px';
  el('div', 'ph-shadow', root);
  el('div', 'ph-btn l1', root); el('div', 'ph-btn l2', root); el('div', 'ph-btn l3', root); el('div', 'ph-btn r1', root);
  el('div', 'ph-frame', root);
  const scr = el('div', 'ph-screen', root);
  el('div', 'ph-island', root);
  el('div', 'ph-glass', root);
  return { root, scr };
}

export const ICON = {
  signal: '<svg viewBox="0 0 34 20"><rect x="0" y="13" width="5" height="7" rx="1.5"/><rect x="9" y="9" width="5" height="11" rx="1.5"/><rect x="18" y="5" width="5" height="15" rx="1.5"/><rect x="27" y="0" width="5" height="20" rx="1.5"/></svg>',
  wifi: '<svg viewBox="0 0 28 20"><path d="M14 18.5l3.6-4.2a5.4 5.4 0 0 0-7.2 0z"/><path d="M5.2 9.8a12.6 12.6 0 0 1 17.6 0l-2.6 3a8.6 8.6 0 0 0-12.4 0z"/><path d="M0.6 5.2a19 19 0 0 1 26.8 0l-2.5 2.9a15 15 0 0 0-21.8 0z"/></svg>',
  battery: '<svg viewBox="0 0 44 20"><rect x="1" y="1" width="37" height="18" rx="5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="2"/><rect x="4" y="4" width="28" height="12" rx="2.5"/><rect x="40" y="6.5" width="3" height="7" rx="1.5" opacity=".45"/></svg>',
};

// ---------- glossy expense / feature glyphs (viewBox 0 0 100 100) ----------
function grads(k) {
  return `<defs>
    <linearGradient id="nv${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3A5A"/><stop offset="1" stop-color="#101827"/></linearGradient>
    <linearGradient id="gd${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset=".55" stop-color="#F5C451"/><stop offset="1" stop-color="#D49A2A"/></linearGradient>
    <linearGradient id="em${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EEDB4"/><stop offset="1" stop-color="#0FA36B"/></linearGradient>
  </defs>`;
}

export function glyph(name) {
  const k = id('g');
  const G = grads(k);
  const nv = `url(#nv${k})`, gd = `url(#gd${k})`, em = `url(#em${k})`;
  const svg = inner => `<svg viewBox="0 0 100 100">${G}${inner}</svg>`;
  switch (name) {
    case 'shopping': return svg(`
      <path d="M17 36 H83 L78 86 Q77.4 92 71 92 H29 Q22.6 92 22 86 Z" fill="${nv}"/>
      <path d="M17 36 H83 L82.2 44 H17.8 Z" fill="#33466A"/>
      <path d="M35 47 V31 Q35 14 50 14 Q65 14 65 31 V47" fill="none" stroke="${gd}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="35" cy="48" r="4.2" fill="#0B1220"/><circle cx="65" cy="48" r="4.2" fill="#0B1220"/>
      <path d="M27 84 L30 52" stroke="#fff" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"/>`);
    case 'food': return svg(`
      <path d="M4 44 H17 M1 56 H15 M6 68 H17" stroke="#101827" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
      <path d="M23 47 Q23 18 57 18 Q91 18 91 47 Z" fill="${gd}"/>
      <ellipse cx="45" cy="31" rx="2.6" ry="1.6" fill="#fff" opacity=".9" transform="rotate(-20 45 31)"/>
      <ellipse cx="58" cy="26" rx="2.6" ry="1.6" fill="#fff" opacity=".9" transform="rotate(10 58 26)"/>
      <ellipse cx="70" cy="33" rx="2.6" ry="1.6" fill="#fff" opacity=".9" transform="rotate(25 70 33)"/>
      <ellipse cx="54" cy="38" rx="2.6" ry="1.6" fill="#fff" opacity=".9"/>
      <path d="M20 51 Q26 45 32 51 T44 51 T56 51 T68 51 T80 51 T93 51 V57 H20 Z" fill="${em}"/>
      <rect x="21" y="56" width="71" height="13" rx="6.5" fill="${nv}"/>
      <path d="M23 72 H90 Q90 86 76 86 H37 Q23 86 23 72 Z" fill="${gd}"/>`);
    case 'subs': return svg(`
      <rect x="8" y="18" width="74" height="54" rx="11" fill="${nv}"/>
      <rect x="8" y="18" width="74" height="10" rx="5" fill="#fff" opacity=".06"/>
      <path d="M38 33 L58 45 L38 57 Z" fill="#fff"/>
      <rect x="30" y="76" width="30" height="6" rx="3" fill="#101827" opacity=".45"/>
      <circle cx="76" cy="72" r="19" fill="${em}" stroke="#fff" stroke-width="4"/>
      <path d="M67.5 70 A9 9 0 0 1 83.6 66.4" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M84.6 61.5 L84.2 67.4 L78.4 66.6" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M84.5 74 A9 9 0 0 1 68.4 77.6" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M67.4 82.5 L67.8 76.6 L73.6 77.4" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>`);
    case 'impulse': return svg(`
      <g transform="rotate(-38 50 52)">
        <path d="M22 32 H63 L86 52 L63 72 H22 Q15 72 15 65 V39 Q15 32 22 32 Z" fill="${gd}"/>
        <path d="M22 32 H63 L68 36.4 H18 Q19 32 22 32 Z" fill="#fff" opacity=".35"/>
        <circle cx="68" cy="52" r="5.5" fill="#E9EDF2"/>
        <text x="40" y="62.5" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="29" fill="#101827">%</text>
      </g>
      <path d="M72 30 Q86 14 94 22" fill="none" stroke="#101827" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`);
    case 'card': return svg(`
      <g transform="rotate(-10 50 52)">
        <rect x="8" y="24" width="84" height="56" rx="9" fill="${nv}"/>
        <path d="M8 62 Q40 46 92 58 V71 Q92 80 83 80 H17 Q8 80 8 71 Z" fill="${em}" opacity=".9"/>
        <rect x="18" y="35" width="17" height="13" rx="3" fill="${gd}"/>
        <path d="M18 41.5 H35 M26.5 35 V48" stroke="#B5832A" stroke-width="1.2"/>
        <g fill="#fff" opacity=".75"><circle cx="19" cy="60" r="2"/><circle cx="25" cy="60" r="2"/><circle cx="31" cy="60" r="2"/><circle cx="37" cy="60" r="2"/>
        <circle cx="46" cy="60" r="2"/><circle cx="52" cy="60" r="2"/><circle cx="58" cy="60" r="2"/><circle cx="64" cy="60" r="2"/></g>
        <circle cx="74" cy="38" r="6.5" fill="#F5C451" opacity=".95"/><circle cx="82" cy="38" r="6.5" fill="#fff" opacity=".55"/>
      </g>`);
    case 'deposit': return svg(`
      <circle cx="50" cy="50" r="40" fill="${em}"/>
      <path d="M50 28 V62 M36 49 L50 63 L64 49" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M32 72 H68" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`);
    default: return svg('');
  }
}

export function tile(parent, name, size = 140, cls = '') {
  const t = el('div', 'tile ' + cls, parent);
  t.style.width = t.style.height = size + 'px';
  el('div', 'tile-face', t);
  el('div', 'tile-glyph', t, glyph(name));
  return t;
}

// ---------- paycheck ----------
export function paycheckSVG() {
  const k = id('pc');
  let waves = '';
  for (let i = 0; i < 14; i++) {
    let d = '';
    for (let x = 0; x <= 560; x += 10) {
      const y = 20 + i * 16 + Math.sin(x / 34 + i * 0.7) * 7 + Math.sin(x / 13 + i) * 2;
      d += (x ? ' L' : 'M') + x + ' ' + y.toFixed(1);
    }
    waves += `<path d="${d}"/>`;
  }
  return `<svg viewBox="0 0 560 250" width="560" height="250">
  <defs>
    <linearGradient id="pp${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#EEF1EA"/></linearGradient>
    <clipPath id="cl${k}"><rect width="560" height="250" rx="16"/></clipPath>
  </defs>
  <g clip-path="url(#cl${k})">
    <rect width="560" height="250" fill="url(#pp${k})"/>
    <g fill="none" stroke="#16C784" stroke-opacity=".16" stroke-width="1.6">${waves}</g>
    <rect width="24" height="250" fill="#16C784"/>
    <rect x="24" width="6" height="250" fill="#F5C451"/>
  </g>
  <rect x="1" y="1" width="558" height="248" rx="15" fill="none" stroke="#101827" stroke-opacity=".10" stroke-width="2"/>
  <text x="58" y="62" font-family="Montserrat" font-weight="800" font-size="31" letter-spacing="3" fill="#101827">PAYCHECK</text>
  <rect x="58" y="76" width="64" height="6" rx="3" fill="#F5C451"/>
  <text x="58" y="146" font-family="Inter" font-weight="600" font-size="15" letter-spacing="1.6" fill="#101827" fill-opacity=".55">PAY TO THE ORDER OF</text>
  <line x1="58" y1="166" x2="350" y2="166" stroke="#101827" stroke-opacity=".28" stroke-width="2"/>
  <rect x="372" y="104" width="160" height="58" rx="10" fill="#FFFFFF" stroke="#101827" stroke-opacity=".22" stroke-width="2"/>
  <text x="452" y="143" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="27" fill="#101827">$3,250.00</text>
  <path d="M372 214 C 386 190, 398 222, 410 200 S 430 186, 436 206 S 456 214, 470 196 C 478 188, 486 204, 500 200 L 528 198" fill="none" stroke="#101827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="364" y1="222" x2="532" y2="222" stroke="#101827" stroke-opacity=".28" stroke-width="2"/>
  <g fill="#101827" fill-opacity=".55">${Array.from({ length: 22 }, (_, i) => `<rect x="${58 + i * 12 + (i > 9 ? 10 : 0)}" y="208" width="${i % 3 ? 6 : 8}" height="14" rx="1.5"/>`).join('')}</g>
</svg>`;
}

// ---------- banknote sprite (canvas) ----------
export async function banknote({ back = false } = {}) {
  const W = 600, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const ink = back ? '#2C5A47' : '#28533F', paper = back ? '#D5E3D3' : '#DCE8D9';
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  rr(0, 0, W, H, 10); g.save(); g.clip();
  let gr = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.6);
  gr.addColorStop(0, '#EEF4EC'); gr.addColorStop(0.6, paper); gr.addColorStop(1, '#BFD0BC');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // guilloche
  g.strokeStyle = ink; g.globalAlpha = 0.16; g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const y = 8 + i * 9.6 + Math.sin(x / 22 + i * 0.9) * 5 + Math.sin(x / 9 + i * 0.3) * 1.5;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  // rosettes
  g.globalAlpha = 0.5;
  const rosette = (cx, cy, R) => {
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
        const r = R * (0.72 + 0.12 * k) + R * 0.12 * Math.sin(a * (12 + k * 4));
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        a ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
  };
  if (!back) { rosette(118, 128, 62); rosette(482, 128, 62); } else { rosette(150, 128, 80); rosette(450, 128, 80); }
  g.globalAlpha = 1;
  // borders
  g.lineWidth = 4; g.strokeStyle = ink; g.globalAlpha = 0.85; rr(12, 12, W - 24, H - 24, 8); g.stroke();
  g.lineWidth = 1.5; g.globalAlpha = 0.6; rr(22, 22, W - 44, H - 44, 6); g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!back) {
    // central oval with a dollar sign
    g.save(); g.beginPath(); g.ellipse(W / 2, H / 2, 74, 94, 0, 0, Math.PI * 2);
    gr = g.createRadialGradient(W / 2 - 20, H / 2 - 30, 10, W / 2, H / 2, 100);
    gr.addColorStop(0, '#F3F7F1'); gr.addColorStop(1, '#C3D4BF');
    g.fillStyle = gr; g.fill(); g.lineWidth = 4; g.strokeStyle = ink; g.stroke();
    g.beginPath(); g.ellipse(W / 2, H / 2, 64, 84, 0, 0, Math.PI * 2); g.lineWidth = 1.5; g.stroke();
    g.fillStyle = ink; g.globalAlpha = 0.9;
    g.font = '900 104px Montserrat'; g.fillText('$', W / 2, H / 2 + 6);
    g.restore();
    g.font = '800 34px Montserrat'; g.fillStyle = ink;
    g.fillText('100', 70, 50); g.fillText('100', W - 70, 50); g.fillText('100', 70, H - 46); g.fillText('100', W - 70, H - 46);
    g.globalAlpha = 0.45; g.fillRect(170, H - 52, 70, 8); g.fillRect(360, 44, 70, 8); g.globalAlpha = 1;
  } else {
    g.font = '900 120px Montserrat'; g.globalAlpha = 0.85; g.fillText('100', W / 2, H / 2 + 6); g.globalAlpha = 1;
    g.font = '800 30px Montserrat'; g.fillText('100', 64, 48); g.fillText('100', W - 64, H - 44);
  }
  // paper fibre noise + soft centre fold
  const r = rng(back ? 9 : 5);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(40,70,55,${r() * 0.06})`; g.fillRect(r() * W, r() * H, 1.5, 1.5); }
  gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0.47, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.07)'); gr.addColorStop(0.53, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.58, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
  return c;
}

// Draw a banknote sprite with a 3D flip (flip = rotation about the note's long axis) and spin.
export function drawNote(g, front, back, x, y, w, { rot = 0, flip = 0, alpha = 1, shade = 0.18 } = {}) {
  const k = Math.cos(flip), img = k >= 0 ? front : back;
  const h = w * (img.height / img.width);
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(rot); g.scale(1, Math.max(0.02, Math.abs(k)));
  g.shadowColor = 'rgba(5,10,20,0.35)'; g.shadowBlur = 18; g.shadowOffsetY = 10;
  g.drawImage(img, -w / 2, -h / 2, w, h);
  g.shadowColor = 'transparent';
  const d = (1 - Math.abs(k)) * shade * 3;
  if (d > 0.01) { g.fillStyle = `rgba(5,10,20,${Math.min(0.45, d)})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
}

// ---------- coins (canvas) ----------
const PAL = {
  gold: { face: ['#FFF4CC', '#FADB7E', '#F5C451', '#CF962A'], rim: ['#C8922C', '#8C5F14'], ring: '#C99230', emb: '#B9862A', hi: '#FFF1BE' },
  emerald: { face: ['#CCFFEA', '#62EDB6', '#16C784', '#0B8A5A'], rim: ['#0E9B65', '#065A3B'], ring: '#0FA36B', emb: '#0B8456', hi: '#D2FFEC' },
};

// flip: tilt angle (0 = facing camera). rot: in-plane rotation. Coins are lit from the top-left.
export function drawCoin(g, x, y, r, { flip = 0, rot = 0, kind = 'gold', glint = 0.6, mark = '$', alpha = 1, shadow = 0 } = {}) {
  const P = PAL[kind] || PAL.gold;
  const k = Math.cos(flip), ak = Math.max(0.04, Math.abs(k));
  const th = r * 0.16 * Math.abs(Math.sin(flip));
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(rot);
  if (shadow) { g.shadowColor = `rgba(5,10,20,${shadow})`; g.shadowBlur = r * 0.6; g.shadowOffsetY = r * 0.35; }
  // rim (thickness)
  if (th > 0.4) {
    let gr = g.createLinearGradient(-r, 0, r, 0);
    gr.addColorStop(0, P.rim[1]); gr.addColorStop(0.3, P.rim[0]); gr.addColorStop(0.55, P.rim[1]); gr.addColorStop(1, P.rim[1]);
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(0, th, r, r * ak, 0, 0, Math.PI); g.lineTo(-r, 0); g.ellipse(0, 0, r, r * ak, 0, Math.PI, 0, true); g.closePath(); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = Math.max(0.6, r * 0.025);
    g.beginPath();
    for (let a = 0.12; a < Math.PI; a += 0.16) { const px = r * Math.cos(a), py = r * ak * Math.sin(a); g.moveTo(px, py); g.lineTo(px, py + th); }
    g.stroke();
  }
  g.shadowColor = 'transparent';
  // face
  g.save();
  g.scale(1, ak);
  let gr = g.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.05, 0, 0, r * 1.05);
  const f = P.face;
  if (k >= 0) { gr.addColorStop(0, f[0]); gr.addColorStop(0.32, f[1]); gr.addColorStop(0.68, f[2]); gr.addColorStop(1, f[3]); }
  else { gr.addColorStop(0, f[1]); gr.addColorStop(0.5, f[2]); gr.addColorStop(1, f[3]); }
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.lineWidth = r * 0.07; g.strokeStyle = P.ring; g.globalAlpha = alpha * 0.9;
  g.beginPath(); g.arc(0, 0, r * 0.8, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.03; g.strokeStyle = P.hi; g.globalAlpha = alpha * 0.6;
  g.beginPath(); g.arc(0, 0, r * 0.95, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  g.globalAlpha = alpha;
  if (mark && ak > 0.25) {
    g.font = `900 ${r * 1.0}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = P.hi; g.globalAlpha = alpha * 0.7; g.fillText(mark, -r * 0.03, r * 0.04 - r * 0.03);
    g.fillStyle = P.emb; g.globalAlpha = alpha * 0.95; g.fillText(mark, r * 0.02, r * 0.07);
  }
  g.restore();
  // specular glint
  if (glint > 0) {
    g.globalAlpha = alpha * glint * (0.4 + 0.6 * ak);
    const hg = g.createRadialGradient(-r * 0.38, -r * 0.4 * ak, 0, -r * 0.38, -r * 0.4 * ak, r * 0.55);
    hg.addColorStop(0, 'rgba(255,255,255,0.95)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; g.beginPath(); g.ellipse(-r * 0.38, -r * 0.4 * ak, r * 0.55, r * 0.55 * ak, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// ---------- hand (silhouette) holding a phone of size w x h; coordinates relative to the phone ----------
export function handSVG(w = 380, h = 780) {
  const k = id('hd');
  const fill = `url(#hf${k})`;
  const defs = `<defs>
    <linearGradient id="hf${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3A57"/><stop offset=".55" stop-color="#18233A"/><stop offset="1" stop-color="#0E1524"/></linearGradient>
  </defs>`;
  const back = `<svg class="hand-back" viewBox="-200 -100 ${w + 400} ${h + 1300}" style="left:-200px;top:-100px;width:${w + 400}px;height:${h + 1300}px">${defs}
    <defs>
      <linearGradient id="sl${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22304D"/><stop offset=".45" stop-color="#141E33"/><stop offset="1" stop-color="#0A101C"/></linearGradient>
      <linearGradient id="cf${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#E6EAF0"/><stop offset="1" stop-color="#C9D0DA"/></linearGradient>
    </defs>
    <path d="M34 ${h - 300} C -10 ${h - 170}, -2 ${h - 20}, 70 ${h + 70} C 110 ${h + 120}, 138 ${h + 170}, 146 ${h + 250}
      L 338 ${h + 250} C 352 ${h + 150}, 420 ${h + 80}, 430 ${h - 30} C 436 ${h - 160}, 420 ${h - 260}, 384 ${h - 330} Z" fill="${fill}"/>
    <path d="M70 ${h + 70} C 110 ${h + 120}, 138 ${h + 170}, 146 ${h + 250}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/>
    <path d="M128 ${h + 226} L 356 ${h + 226} Q 362 ${h + 262}, 360 ${h + 304} L 124 ${h + 304} Q 122 ${h + 262}, 128 ${h + 226} Z" fill="url(#cf${k})"/>
    <path d="M130 ${h + 240} L 354 ${h + 240}" stroke="#101827" stroke-opacity=".10" stroke-width="2"/>
    <circle cx="318" cy="${h + 266}" r="10" fill="#F5C451" stroke="#C8902A" stroke-width="2.5"/>
    <path d="M104 ${h + 276} Q 246 ${h + 262}, 392 ${h + 276} C 404 ${h + 420}, 420 ${h + 720}, 440 ${h + 1200} L 60 ${h + 1200} C 80 ${h + 720}, 94 ${h + 420}, 104 ${h + 276} Z" fill="url(#sl${k})"/>
    <path d="M104 ${h + 276} Q 246 ${h + 262}, 392 ${h + 276}" fill="none" stroke="#2E3E60" stroke-width="4"/>
    <path d="M118 ${h + 330} C 108 ${h + 600}, 96 ${h + 900}, 84 ${h + 1200}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="10"/>
  </svg>`;
  const fy = [h * 0.40, h * 0.49, h * 0.58, h * 0.665];
  const fingers = fy.map((y, i) => {
    const len = [74, 78, 74, 64][i], th = [58, 60, 57, 50][i];
    return `<rect x="${-len + 30}" y="${y - th / 2}" width="${len}" height="${th}" rx="${th / 2}" fill="${fill}" transform="rotate(${-6 + i * 3} 0 ${y})"/>
      <path d="M${-len + 40} ${y - th / 2 + 6} Q ${-len + 30 + th * 0.2} ${y - th / 2 + 2} ${-len + 34} ${y}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.5" stroke-linecap="round"/>`;
  }).join('');
  const thumb = `<path d="M${w + 58} ${h * 0.92} C ${w + 66} ${h * 0.82}, ${w + 30} ${h * 0.72}, ${w - 6} ${h * 0.655}
      C ${w - 22} ${h * 0.628}, ${w - 52} ${h * 0.632}, ${w - 54} ${h * 0.66} C ${w - 56} ${h * 0.69}, ${w - 34} ${h * 0.72}, ${w - 20} ${h * 0.76}
      C ${w - 4} ${h * 0.82}, ${w + 2} ${h * 0.88}, ${w + 6} ${h * 0.95} Z" fill="${fill}"/>
    <path d="M${w - 50} ${h * 0.655} C ${w - 36} ${h * 0.64}, ${w - 14} ${h * 0.648}, ${w} ${h * 0.665}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.5" stroke-linecap="round"/>`;
  const front = `<svg class="hand-front" viewBox="-200 -100 ${w + 400} ${h + 300}" style="left:-200px;top:-100px;width:${w + 400}px;height:${h + 300}px">${defs}${fingers}${thumb}</svg>`;
  return { back, front };
}

// A stack of n coins seen from slightly above (canvas). Returns the y of the top face.
export function coinStack(g, cx, base, n, { rx = 26, ry = 9, th = 8, kind = 'gold', drop = null } = {}) {
  const P = PAL[kind] || PAL.gold;
  let top = base;
  for (let j = 0; j < n; j++) {
    let y = base - j * th;
    let a = 1;
    if (drop) { const d = drop(j); if (d === null) continue; y -= d.dy; a = d.a; }
    g.save();
    g.globalAlpha = a;
    // rim
    let gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
    gr.addColorStop(0, P.rim[1]); gr.addColorStop(0.28, P.rim[0]); gr.addColorStop(0.6, P.rim[1]); gr.addColorStop(1, P.rim[1]);
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(cx, y, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, y - th); g.ellipse(cx, y - th, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
    g.beginPath();
    for (let q = 0.15; q < Math.PI; q += 0.22) { const px = cx + rx * Math.cos(q), py = y + ry * Math.sin(q); g.moveTo(px, py - th + 1); g.lineTo(px, py - 1); }
    g.stroke();
    // face
    const fy = y - th;
    gr = g.createRadialGradient(cx - rx * 0.4, fy - ry * 0.5, 1, cx, fy, rx * 1.05);
    gr.addColorStop(0, P.face[0]); gr.addColorStop(0.35, P.face[1]); gr.addColorStop(0.7, P.face[2]); gr.addColorStop(1, P.face[3]);
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, fy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.ring; g.lineWidth = 1.6; g.globalAlpha = a * 0.8;
    g.beginPath(); g.ellipse(cx, fy, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
    top = Math.min(top, fy - ry);
  }
  return top;
}
