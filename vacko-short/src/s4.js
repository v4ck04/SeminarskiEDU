// SCENE 4 — THE SOLUTION (20–31 s): three premium icons on a podium, one by one.
//   01 SPEND SMARTER (organised wallet) · 02 SAVE CONSISTENTLY (jar filling with coins) · 03 TRACK YOUR MONEY (dashboard)
import { el, seg, E, clamp, lerp, keys, usd, cam, camAt, show, rng, place } from './kit.js';
import { headline, fitLines, animHeadline } from './type.js';
import { banknote, drawCoin } from './art.js';
import { lightWall, windowLight, mountBackdrop } from './bg.js';

export const S4 = { t0: 19.76, t1: 31.06 };
const IT = [20.04, 23.72, 27.36];             // item starts
const POD = { cx: 540, top: 1238, rx: 318, ry: 60, h: 120 };
const OBJ_S = 1.22;                            // objects are drawn at 1x and scaled up on the podium
const CHECK = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#16C784"/><circle cx="32" cy="32" r="30" fill="none" stroke="#fff" stroke-width="4"/><path d="M19 33 L28 42 L46 23" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function podiumSVG() {
  const { rx, ry, h } = POD, W = rx * 2 + 80;
  return `<svg viewBox="0 0 ${W} ${ry * 2 + h + 80}" width="${W}" height="${ry * 2 + h + 80}" style="overflow:visible">
  <defs>
    <linearGradient id="pd-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0D1422"/><stop offset=".28" stop-color="#26355A"/><stop offset=".55" stop-color="#16203A"/><stop offset="1" stop-color="#0A0F1A"/></linearGradient>
    <radialGradient id="pd-top" cx=".42" cy=".35" r=".8"><stop offset="0" stop-color="#2E3E63"/><stop offset=".6" stop-color="#1A2540"/><stop offset="1" stop-color="#111A2D"/></radialGradient>
    <linearGradient id="pd-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16C784" stop-opacity="0"/><stop offset=".5" stop-color="#5BF0B6"/><stop offset="1" stop-color="#16C784" stop-opacity="0"/></linearGradient>
    <filter id="pd-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
  </defs>
  <ellipse cx="${W / 2}" cy="${ry + h + 30}" rx="${rx + 30}" ry="${ry + 12}" fill="#101827" opacity=".35" filter="url(#pd-blur)"/>
  <path d="M40 ${ry + 40} V ${ry + h + 40} A ${rx} ${ry} 0 0 0 ${W - 40} ${ry + h + 40} V ${ry + 40} Z" fill="url(#pd-side)"/>
  <ellipse cx="${W / 2}" cy="${ry + 40}" rx="${rx}" ry="${ry}" fill="url(#pd-top)"/>
  <ellipse class="pd-glow" cx="${W / 2}" cy="${ry + 40}" rx="${rx - 2}" ry="${ry - 1}" fill="none" stroke="#16C784" stroke-width="5" opacity=".9"/>
  <path class="pd-sweep" d="M40 ${ry + 40} A ${rx} ${ry} 0 0 0 ${W - 40} ${ry + 40}" fill="none" stroke="url(#pd-rim)" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="${W / 2}" cy="${ry + 40}" rx="${rx - 40}" ry="${ry - 10}" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="2"/>
</svg>`;
}

// ---------- wallet ----------
function walletSVG(part) {
  if (part === 'back') return `<svg viewBox="0 0 500 360" width="500" height="360"><defs>
    <linearGradient id="wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2742"/><stop offset="1" stop-color="#0C1322"/></linearGradient></defs>
    <rect x="10" y="40" width="480" height="300" rx="34" fill="url(#wb)"/>
    <rect x="10" y="40" width="480" height="300" rx="34" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/></svg>`;
  return `<svg viewBox="0 0 500 360" width="500" height="360" style="overflow:visible"><defs>
    <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C3C60"/><stop offset=".5" stop-color="#1A2642"/><stop offset="1" stop-color="#101827"/></linearGradient>
    <linearGradient id="wfs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="wgd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A6"/><stop offset=".5" stop-color="#F5C451"/><stop offset="1" stop-color="#C8902A"/></linearGradient>
    <linearGradient id="wcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D416A"/><stop offset="1" stop-color="#121B30"/></linearGradient></defs>
    <rect x="44" y="96" width="230" height="150" rx="14" fill="url(#wcd)" transform="rotate(-4 160 170)"/>
    <rect x="66" y="122" width="38" height="28" rx="6" fill="url(#wgd)" transform="rotate(-4 160 170)"/>
    <path d="M44 214 Q 150 180, 274 206 L 274 232 Q 274 246, 260 246 L 58 246 Q 44 246, 44 232 Z" fill="#16C784" opacity=".85" transform="rotate(-4 160 170)"/>
    <path d="M10 150 H 490 V 306 Q 490 340, 456 340 H 44 Q 10 340, 10 306 Z" fill="url(#wf)"/>
    <path d="M10 150 H 490 V 306 Q 490 340, 456 340 H 44 Q 10 340, 10 306 Z" fill="url(#wfs)"/>
    <path d="M10 150 H 490" stroke="#3A4D78" stroke-width="4"/>
    <rect x="26" y="164" width="448" height="160" rx="22" fill="none" stroke="#F5C451" stroke-opacity=".75" stroke-width="2.5" stroke-dasharray="9 7"/>
    <path d="M400 150 H 500 Q 516 150, 516 166 V 222 Q 516 238, 500 238 H 400 Z" fill="#22314F"/>
    <path d="M400 150 H 500 Q 516 150, 516 166 V 222 Q 516 238, 500 238 H 400" fill="none" stroke="#F5C451" stroke-opacity=".75" stroke-width="2.5" stroke-dasharray="9 7" transform="translate(-6 0) scale(1.0)"/>
    <circle cx="474" cy="194" r="15" fill="url(#wgd)" stroke="#9C6F1E" stroke-width="2"/>
    <circle cx="470" cy="190" r="5" fill="#fff" opacity=".6"/>
  </svg>`;
}

// ---------- jar ----------
const JAR = 'M92 64 C 92 112, 20 116, 20 176 L 20 404 Q 20 454, 72 456 L 288 456 Q 340 454, 340 404 L 340 176 C 340 116, 268 112, 268 64 Z';
function jarSVG(part) {
  if (part === 'back') return `<svg viewBox="0 0 360 470" width="360" height="470"><defs>
    <linearGradient id="jb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101827" stop-opacity=".16"/><stop offset=".25" stop-color="#fff" stop-opacity=".18"/><stop offset=".75" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#101827" stop-opacity=".18"/></linearGradient></defs>
    <path d="${JAR}" fill="url(#jb)"/></svg>`;
  return `<svg viewBox="0 0 360 470" width="360" height="470" style="overflow:visible"><defs>
    <linearGradient id="jh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="jgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A6"/><stop offset=".5" stop-color="#F5C451"/><stop offset="1" stop-color="#C8902A"/></linearGradient></defs>
    <path d="${JAR}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="5"/>
    <path d="${JAR}" fill="none" stroke="#101827" stroke-opacity=".18" stroke-width="1.5" transform="translate(0 2)"/>
    <rect x="40" y="190" width="18" height="220" rx="9" fill="url(#jh)" opacity=".9"/>
    <rect x="66" y="200" width="7" height="170" rx="3.5" fill="url(#jh)" opacity=".6"/>
    <rect x="300" y="200" width="10" height="190" rx="5" fill="url(#jh)" opacity=".5"/>
    <path d="M60 128 C 90 108, 120 104, 150 104" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="6" stroke-linecap="round"/>
    <rect x="84" y="78" width="192" height="24" rx="10" fill="url(#jgd)"/>
    <rect x="84" y="78" width="192" height="7" rx="3.5" fill="#fff" opacity=".45"/>
    <ellipse cx="180" cy="64" rx="92" ry="17" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="7"/>
    <ellipse cx="180" cy="64" rx="92" ry="17" fill="none" stroke="#101827" stroke-opacity=".15" stroke-width="1.5"/>
    <path d="M150 300 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0" fill="#F5C451" opacity=".0"/>
  </svg>`;
}

// ---------- tablet dashboard ----------
function tablet(parent) {
  const t = el('div', 'tablet', parent);
  t.innerHTML = `<div class="tb-frame"></div><div class="tb-screen"><div class="dash">
    <div class="dl">Total savings</div><div class="dv">$0</div>
    <div class="dpill"><svg viewBox="0 0 20 20"><path d="M4 10.5 L8.5 15 L16 6" fill="none" stroke="#0B2A1D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>On track</div>
    <svg class="ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>
      <circle class="rg" cx="60" cy="60" r="46" fill="none" stroke="#F5C451" stroke-width="14" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 60 60)"/></svg>
    <svg class="chart" viewBox="0 0 300 200">
      <defs><linearGradient id="dch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16C784" stop-opacity=".45"/><stop offset="1" stop-color="#16C784" stop-opacity="0"/></linearGradient>
      <clipPath id="dcl"><rect class="clr" x="0" y="0" width="0" height="200"/></clipPath></defs>
      <g stroke="rgba(255,255,255,.07)" stroke-width="1.5"><path d="M0 40 H300 M0 90 H300 M0 140 H300"/></g>
      <g clip-path="url(#dcl)"><path class="ar" fill="url(#dch)"/><path class="ln" fill="none" stroke="#16C784" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <circle class="dot" r="8" fill="#16C784" stroke="#0F1729" stroke-width="3"/>
    </svg>
    <div class="bars">${Array.from({ length: 7 }, () => '<i></i>').join('')}</div>
  </div></div><div class="tb-glass"></div>`;
  return t;
}
const CH_PTS = [[0, 178], [40, 166], [80, 160], [120, 140], [160, 128], [200, 104], [240, 80], [280, 46], [300, 30]];

export async function build(stage) {
  const root = el('section', 'scene', stage);
  root.id = 's4';
  const moveWall = mountBackdrop(root, lightWall({ palm: true }));
  const moveLight = mountBackdrop(root, windowLight());
  const camEl = el('div', 'cam', root);

  // podium
  const pod = el('div', 'abs', camEl, podiumSVG());
  pod.style.left = POD.cx - POD.rx - 40 + 'px'; pod.style.top = POD.top - POD.ry - 40 + 'px';
  const sweep = pod.querySelector('.pd-sweep');

  const mkHead = (num, lead, key, t0, keyWords) => {
    const h = headline(camEl, {
      top: 252,
      lines: [
        { size: 52, cls: 'num-l', words: [{ t: num, at: t0 }] },
        { size: 84, cls: 'lead-l', mt: 6, words: [{ t: lead, at: t0 + 0.1 }] },
        { size: 150, cls: 'k3d', mt: 2, marker: 'em', marker_at: t0 + 0.62, words: keyWords.map((w, i) => ({ t: w, at: t0 + 0.28 + i * 0.12, style: i === 0 ? 'slam' : 'rise', shine: t0 + 1.2 })) },
      ],
    });
    fitLines(h);
    return h;
  };
  const heads = [mkHead('01', 'SPEND', 'SMARTER', IT[0] + 0.1, ['SMARTER']), mkHead('02', 'SAVE', 'CONSISTENTLY', IT[1] + 0.1, ['CONSISTENTLY']),
    mkHead('03', 'TRACK', 'YOUR MONEY', IT[2] + 0.1, ['YOUR', 'MONEY'])];

  // object holders (each sits on the podium)
  const holder = (w, h) => { const d = el('div', 'abs obj', camEl); place(d, POD.cx - w / 2, POD.top - h + 6, w, h); d.style.transformOrigin = '50% 100%'; return d; };

  // 01 wallet
  const wal = holder(500, 360);
  el('div', 'abs', wal, walletSVG('back'));
  const bills = [];
  const note = await banknote();
  for (let i = 0; i < 3; i++) {
    const c = el('canvas', 'abs wbill', wal); c.width = 420; c.height = 179;
    c.getContext('2d').drawImage(note, 0, 0, 420, 179);
    c.style.left = 36 + i * 14 + 'px'; c.style.top = '150px';
    bills.push(c);
  }
  el('div', 'abs', wal, walletSVG('front'));
  const ck1 = el('div', 'abs ckb', wal, CHECK); place(ck1, 430, -10, 84, 84);

  // 02 jar
  const jar = holder(360, 470);
  el('div', 'abs', jar, jarSVG('back'));
  const jc = el('canvas', 'abs', jar); jc.width = 360 * 2; jc.height = 760 * 2;
  Object.assign(jc.style, { left: '0px', top: '-290px', width: '360px', height: '760px' });
  el('div', 'abs', jar, jarSVG('front'));
  const ck2 = el('div', 'abs ckb', jar, CHECK); place(ck2, 300, 120, 84, 84);
  const R = rng(8);
  const pile = [];
  for (let L = 0; L < 15; L++) for (let k = 0; k < 7; k++) {
    pile.push({ x: 62 + k * 40 + (R() - 0.5) * 18 + (L % 2) * 16, y: 436 - L * 17 + (R() - 0.5) * 8, rot: (R() - 0.5) * 0.5, flip: 1.05 + R() * 0.35, kind: R() < 0.22 ? 'emerald' : 'gold' });
  }
  pile.forEach(p => { p.x = clamp(p.x, 54, 306); });

  // 03 dashboard tablet
  const tab = holder(560, 390);
  const tb = tablet(tab);
  const dv = tb.querySelector('.dv'), ln = tb.querySelector('.ln'), ar = tb.querySelector('.ar'), dot = tb.querySelector('.dot'), clr = tb.querySelector('.clr');
  const rg = tb.querySelector('.rg'), barsEl = [...tb.querySelectorAll('.bars i')], dpill = tb.querySelector('.dpill');
  const d = CH_PTS.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ');
  ln.setAttribute('d', d); ar.setAttribute('d', d + ' L300 200 L0 200 Z');
  const ck3 = el('div', 'abs ckb', tab, CHECK); place(ck3, 500, -26, 84, 84);
  // screen centre in world coords (for the zoom-through into scene 5)
  const screenAt = { x: POD.cx, y: POD.top + 6 - 18 - 195 * OBJ_S };

  return { root, camEl, moveWall, moveLight, sweep, heads, wal, bills, ck1, jar, jc: jc.getContext('2d'), ck2, pile, tab, dv, ln, dot, clr, rg, barsEl, dpill, ck3, screenAt };
}

// enter from the right, leave to the left (shared by the three objects)
function slot(e, t, tin, tout) {
  const a = E.outExpo(seg(t, tin, 0.7)), b = E.inCubic(seg(t, tout, 0.4));
  const x = (1 - a) * 720 - b * 760, s = lerp(0.7, 1, a) * lerp(1, 0.8, b) * OBJ_S;
  const r = (1 - a) * 12 - b * 10;
  const bob = Math.sin((t - tin) * 2.2) * 8 * a * (1 - b) * (1 - seg(t, 29.9, 0.4));   // steady before the zoom
  e.style.transform = `translate(${x}px, ${-18 + bob}px) rotate(${r}deg) scale(${s})`;
  e.style.filter = (a > 0 && a < 0.98) || b > 0.02 ? `blur(${((1 - a) * 6 + b * 6).toFixed(2)}px)` : 'none';
  show(e, clamp(a * 3) * (1 - b));
  return { a, b };
}

export function update(S, t) {
  // pan in from the right (scene 3 leaves to the left)
  const pin = E.inOutQuart(seg(t, 19.78, 0.46)), pv = Math.sin(Math.PI * pin);
  S.root.style.transform = pin < 1 ? `translateX(${(1 - pin) * 1080}px)` : 'none';
  S.root.style.filter = pv > 0.05 && pin < 1 ? `blur(${(pv * 4).toFixed(2)}px)` : 'none';

  // camera: gentle push, then dive into the dashboard screen
  const z = S.screenAt;
  const c = camAt(t, [{ t: 20.0, x: 540, y: 300, sy: 300, s: 1.0 },
    { t: 30.3, x: z.x, y: z.y, sx: 540 + (z.x - 540) * 1.05, sy: 300 + (z.y - 300) * 1.05, s: 1.05, e: E.linear },   // same view, re-anchored on the screen
    { t: 31.05, x: z.x, y: z.y, s: 7.5, sx: 540, sy: 960, e: E.inExpo }]);
  cam(S.camEl, c);
  S.moveWall(-(t - 20) * 3, -(t - 20) * 2, 1);
  S.moveLight((t - 20) * 7, -(t - 20) * 3, 1);
  S.sweep.style.transform = `translateX(${Math.sin(t * 0.9) * 120}px)`;
  S.sweep.style.opacity = 0.75 + Math.sin(t * 1.7) * 0.25;

  S.heads.forEach((h, i) => animHeadline(h, t, { out: i < 2 ? IT[i + 1] - 0.22 : 30.2, outDur: 0.3 }));

  // ---- 01 wallet
  slot(S.wal, t, IT[0], IT[1] - 0.25);
  S.bills.forEach((b, i) => {
    const p = E.outBack(seg(t, IT[0] + 0.85 + i * 0.22, 0.5));
    b.style.transform = `translateY(${lerp(6, -(118 - i * 30), p)}px)`;
  });
  const c1 = E.outBack(seg(t, IT[0] + 1.75, 0.45));
  S.ck1.style.transform = `scale(${c1})`; S.ck1.style.opacity = clamp(c1 * 3);

  // ---- 02 jar: coins drop in at a steady rhythm → pile rises
  slot(S.jar, t, IT[1], IT[2] - 0.25);
  const g = S.jc;
  g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 360, 760);
  g.translate(0, 290);
  const drops = 9, d0 = IT[1] + 0.5, dt = 0.3, per = 9;       // a steady rhythm: one coin every 0.3 s
  const landed = clamp(Math.floor((t - d0 - 0.36) / dt) + 1, 0, drops);
  const nPile = 8 + landed * per;
  g.save();
  g.beginPath(); g.moveTo(92, 64); g.bezierCurveTo(92, 112, 20, 116, 20, 176); g.lineTo(20, 404); g.quadraticCurveTo(20, 454, 72, 456);
  g.lineTo(288, 456); g.quadraticCurveTo(340, 454, 340, 404); g.lineTo(340, 176); g.bezierCurveTo(340, 116, 268, 112, 268, 64); g.closePath(); g.clip();
  for (let i = 0; i < Math.min(nPile, S.pile.length); i++) {
    const p = S.pile[i];
    const fresh = i >= nPile - per && landed > 0 ? E.outBack(seg(t, d0 + (landed - 1) * dt + 0.36, 0.25)) : 1;
    drawCoin(g, p.x, p.y - (1 - fresh) * 20, 25, { flip: p.flip, rot: p.rot, kind: p.kind, glint: 0.35, mark: '$' });
  }
  g.restore();
  for (let k = 0; k < drops; k++) {
    const st = d0 + k * dt, p = seg(t, st, 0.42);
    if (p <= 0 || p >= 1) continue;
    const topY = 436 - Math.floor((8 + k * per) / 7) * 17;
    const y = lerp(-14, topY - 10, E.inQuad(p)), x = 180 + Math.sin(k * 2.3) * 40;   // starts below the headline
    drawCoin(g, x, y, 30, { flip: p * 9 + k, rot: 0.3 * Math.sin(k), kind: k % 3 === 2 ? 'emerald' : 'gold', glint: 0.7, shadow: 0.2, alpha: clamp(p * 6) });
  }
  // sparkles at each landing
  for (let k = 0; k < drops; k++) {
    const q = seg(t, d0 + k * dt + 0.38, 0.4);
    if (q <= 0 || q >= 1) continue;
    const yy = 436 - Math.floor((8 + (k + 1) * per) / 7) * 17 - 20;
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2 + k, rr = 30 + q * 60;
      star(g, 180 + Math.cos(a) * rr, yy + Math.sin(a) * rr * 0.5 - q * 30, 10 * (1 - q), j % 2 ? '#16C784' : '#F5C451', 1 - q);
    }
  }
  const c2 = E.outBack(seg(t, IT[1] + 2.95, 0.45));
  S.ck2.style.transform = `scale(${c2})`; S.ck2.style.opacity = clamp(c2 * 3);

  // ---- 03 dashboard
  slot(S.tab, t, IT[2], 99);
  const dp = E.inOutCubic(seg(t, IT[2] + 0.75, 1.5));
  S.clr.setAttribute('width', (300 * dp).toFixed(1));
  const pi = Math.min(CH_PTS.length - 2, Math.floor(dp * (CH_PTS.length - 1)));
  const f = dp * (CH_PTS.length - 1) - pi;
  const px = lerp(CH_PTS[pi][0], CH_PTS[pi + 1][0], clamp(f)), py = lerp(CH_PTS[pi][1], CH_PTS[pi + 1][1], clamp(f));
  S.dot.setAttribute('cx', px.toFixed(1)); S.dot.setAttribute('cy', py.toFixed(1));
  S.dot.style.opacity = dp > 0.01 ? 1 : 0;
  S.dv.textContent = usd(Math.round(keys(t, [[IT[2] + 0.75, 0], [IT[2] + 2.25, 12480, E.outCubic]])), { cents: false });
  S.rg.style.strokeDashoffset = 1 - 0.78 * E.outCubic(seg(t, IT[2] + 0.9, 1.3));
  S.barsEl.forEach((b, i) => { const q = E.outBack(seg(t, IT[2] + 0.9 + i * 0.1, 0.45)); b.style.transform = `scaleY(${q})`; });
  const pp = E.outBack(seg(t, IT[2] + 2.0, 0.4));
  S.dpill.style.transform = `scale(${pp})`; S.dpill.style.opacity = clamp(pp * 3);
  const c3 = E.outBack(seg(t, IT[2] + 2.25, 0.45));
  S.ck3.style.transform = `scale(${c3})`; S.ck3.style.opacity = clamp(c3 * 3) * (1 - seg(t, 30.3, 0.2));
}

function star(g, x, y, r, color, a) {
  if (r <= 0.2) return;
  g.save(); g.globalAlpha = a; g.fillStyle = color; g.translate(x, y);
  g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0); g.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
  g.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0); g.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r); g.fill(); g.restore();
}
