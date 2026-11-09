// SCENE 2 — THE PROBLEM (5–12 s): the paycheck drains away into everyday expenses.
import { el, seg, E, clamp, lerp, keys, usd, cam, camAt, show, rng, place } from './kit.js';
import { headline, fitLines, animHeadline } from './type.js';
import { tile, banknote, drawNote } from './art.js';
import { navyWall, mountBackdrop } from './bg.js';

export const S2 = { t0: 4.92, t1: 12.2 };

const START = 3436.40;
const EXP = [
  { g: 'shopping', name: 'Shopping', amt: 742.18 },
  { g: 'food', name: 'Food Delivery', amt: 418.60 },
  { g: 'subs', name: 'Subscriptions', amt: 127.94 },
  { g: 'impulse', name: 'Impulse Buys', amt: 389.50 },
  { g: 'card', name: 'Credit Card', amt: 1720.00 },
];
const T0 = 6.4, STEP = 0.82;                     // first expense, spacing
const ROW = { x: 64, y: 742, w: 548, h: 104, gap: 16 };
const STACK = { cx: 790, base: 1310, w: 270, maxH: 470 };

let bal = [START];
EXP.forEach((e, i) => bal.push(+(bal[i] - e.amt).toFixed(2)));   // 3436.40 … 38.18

export async function build(stage) {
  const root = el('section', 'scene', stage);
  root.id = 's2';
  const moveWall = mountBackdrop(root, navyWall());
  const bokeh = el('canvas', 'fx', root); bokeh.width = 1080; bokeh.height = 1920;
  const camEl = el('div', 'cam', root);

  const h = headline(camEl, {
    top: 262,
    lines: [
      { size: 70, cls: 'lead-d', words: [{ t: 'IT’S', at: 5.42 }, { t: 'NOT', at: 5.52 }, { t: 'ALWAYS', at: 5.62 }] },
      { size: 112, cls: 'kw', mt: 6, words: [{ t: 'HOW', at: 5.86 }, { t: 'MUCH', at: 5.96 }, { t: 'YOU', at: 6.06 }, { t: 'EARN', at: 6.24, style: 'slam', cls: 'kem', shine: 6.9 }] },
    ],
  });
  fitLines(h);

  const balBox = el('div', 'balbox', camEl);
  balBox.innerHTML = `<div class="bl">BALANCE</div><div class="bv"></div>
    <svg class="circ" viewBox="0 0 600 190" preserveAspectRatio="none"><path pathLength="1" d="M330 18 C 470 14, 586 40, 584 96 C 582 156, 430 182, 290 178 C 140 175, 18 152, 20 96 C 22 44, 150 16, 300 14 C 360 13, 420 18, 452 28"/></svg>`;
  const bv = balBox.querySelector('.bv'), circ = balBox.querySelector('.circ path');
  bv.textContent = '$3,436.40';
  const br = bv.getBoundingClientRect();
  const counterAt = { x: br.left + br.width / 2, y: br.top + br.height / 2, size: parseFloat(getComputedStyle(bv).fontSize) };

  const rows = EXP.map((e, i) => {
    const r = el('div', 'xrow', camEl);
    place(r, ROW.x, ROW.y + i * (ROW.h + ROW.gap), ROW.w, ROW.h);
    const tl = tile(r, e.g, 84, 'in-row');
    tl.style.left = '10px'; tl.style.top = '10px';
    el('div', 'xl', r, e.name);
    const a = el('div', 'xa', r, usd(-e.amt));
    return { el: r, tile: tl, amt: a, at: T0 + i * STEP, tx: ROW.x + 10 + 42, ty: ROW.y + i * (ROW.h + ROW.gap) + 52 };
  });

  const fx = el('canvas', 'fx', camEl); fx.width = 1080; fx.height = 1920;
  const front = await banknote(), back = await banknote({ back: true });

  // paper-edge texture for the side of the cash stack
  const edge = document.createElement('canvas'); edge.width = 8; edge.height = 900;
  const eg = edge.getContext('2d'); const r = rng(5);
  for (let y = 0; y < 900; y += 3) {
    const v = r();
    eg.fillStyle = v > 0.82 ? '#9DB79C' : v > 0.4 ? '#E3ECE0' : '#CFDDCB';
    eg.fillRect(0, y, 8, 2);
    eg.fillStyle = 'rgba(40,70,55,0.35)'; eg.fillRect(0, y + 2, 8, 1);
  }

  // flying bills: per expense a handful of notes with their own timing and arc
  const R = rng(21);
  const notes = [];
  EXP.forEach((e, i) => {
    const n = i === 4 ? 12 : i === 0 ? 9 : 7;
    for (let k = 0; k < n; k++) notes.push({ i, d: (k / n) * 0.62 + R() * 0.05, arc: 160 + R() * 160, spin: (R() - 0.5) * 2.4, flips: 1 + R() * 1.6, w: 150 + R() * 30, jx: (R() - 0.5) * 50 });
  });

  const P = rng(31);
  const parts = Array.from({ length: 34 }, () => ({ x: P() * 1080, y: P() * 1920, r: 3 + P() * 22, a: 0.05 + P() * 0.18, sp: 8 + P() * 26, c: P() < 0.45 ? '245,196,81' : P() < 0.7 ? '22,199,132' : '255,255,255', ph: P() * 6 }));

  return { root, camEl, moveWall, counterAt, bokeh: bokeh.getContext('2d'), h, bv, balBox, circ, rows, g: fx.getContext('2d'), front, back, edge, notes, parts };
}

function drawStack(S, g, hgt, t) {
  const { cx, base, w } = STACK, depth = 64, skew = 34;
  const top = base - hgt, L = cx - w / 2, Rr = cx + w / 2;
  // glow platform
  g.save();
  let gr = g.createRadialGradient(cx + skew / 2, base - depth / 2 + 6, 10, cx + skew / 2, base - depth / 2 + 6, 260);
  gr.addColorStop(0, 'rgba(22,199,132,0.45)'); gr.addColorStop(0.5, 'rgba(22,199,132,0.12)'); gr.addColorStop(1, 'rgba(22,199,132,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx + skew / 2, base - depth / 2 + 8, 260, 74, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(22,199,132,0.75)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(cx + skew / 2, base - depth / 2 + 8, 205, 54, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(22,199,132,0.25)'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(cx + skew / 2, base - depth / 2 + 8, 236, 64, 0, 0, Math.PI * 2); g.stroke();
  // contact shadow
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.filter = 'blur(10px)';
  g.beginPath(); g.ellipse(cx + skew / 2, base - depth / 2 + 4, w * 0.62, 34, 0, 0, Math.PI * 2); g.fill();
  g.filter = 'none';
  // right side face
  g.beginPath(); g.moveTo(Rr, top); g.lineTo(Rr + skew, top - depth); g.lineTo(Rr + skew, base - depth); g.lineTo(Rr, base); g.closePath();
  g.save(); g.clip();
  g.drawImage(S.edge, 0, 900 - hgt - depth, 8, hgt + depth, Rr, top - depth, skew + 2, hgt + depth);
  g.fillStyle = 'rgba(10,20,30,0.42)'; g.fillRect(Rr, top - depth, skew + 2, hgt + depth);
  g.restore();
  // front face (paper edges)
  g.save();
  g.beginPath(); g.rect(L, top, w, hgt); g.clip();
  g.drawImage(S.edge, 0, 900 - hgt, 8, hgt, L, top, w, hgt);
  gr = g.createLinearGradient(L, 0, Rr, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
  g.fillStyle = gr; g.fillRect(L, top, w, hgt);
  gr = g.createLinearGradient(0, top, 0, base);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,20,0.35)');
  g.fillStyle = gr; g.fillRect(L, top, w, hgt);
  g.restore();
  // top face: the top bill in perspective
  g.save();
  g.setTransform(w / 600, 0, -skew / 256, depth / 256, L + skew, top - depth);
  g.drawImage(S.front, 0, 0);
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(L, top); g.lineTo(Rr, top); g.lineTo(Rr + skew, top - depth); g.stroke();
  g.restore();
  return { x: cx + skew / 2, y: top - depth / 2 };
}

export function update(S, t) {
  // entry: match cut on the balance (scene 1 zooms its number onto ours), then a slow push
  const enter = E.outExpo(seg(t, 4.82, 0.9));
  S.root.style.opacity = E.inOutCubic(seg(t, 4.80, 0.17));
  const c = camAt(t, [{ t: 4.8, x: 540, y: 300, sy: 300, s: 1.0 }, { t: 5.1, x: 540, y: 300, sy: 300, s: 1.0 }, { t: 11.7, x: 540, y: 300, sy: 300, s: 1.04, e: E.inOutCubic }]);
  cam(S.camEl, c);
  S.moveWall(0, (1 - enter) * 30 - (t - 5) * 3, 1 + (1 - enter) * 0.05);
  // exit: whip up into scene 3
  const wp = E.inOutQuart(seg(t, 11.72, 0.42)), wv = Math.sin(Math.PI * wp);
  S.root.style.transform = wp > 0 ? `translateY(${-wp * 1920}px)` : 'none';
  S.root.style.filter = wv > 0.05 && wp < 1 ? `blur(${(wv * 5).toFixed(2)}px)` : 'none';

  // bokeh
  const b = S.bokeh; b.clearRect(0, 0, 1080, 1920);
  S.parts.forEach(p => {
    const y = ((p.y - (t - 4.9) * p.sp) % 1920 + 1920) % 1920, x = p.x + Math.sin(t * 0.4 + p.ph) * 18;
    const gr = b.createRadialGradient(x, y, 0, x, y, p.r);
    gr.addColorStop(0, `rgba(${p.c},${p.a})`); gr.addColorStop(1, `rgba(${p.c},0)`);
    b.fillStyle = gr; b.beginPath(); b.arc(x, y, p.r, 0, Math.PI * 2); b.fill();
  });

  animHeadline(S.h, t);

  // balance counter
  const ks = [[T0 + 0.18, bal[0]]];
  EXP.forEach((e, i) => ks.push([T0 + i * STEP + 0.85, bal[i + 1], E.outCubic]));
  const v = keys(t, ks);
  S.bv.textContent = usd(v);
  const low = seg(t, 9.6, 1.0);
  S.bv.style.color = `rgb(${lerp(22, 255, low) | 0}, ${lerp(199, 255, low) | 0}, ${lerp(132, 255, low) | 0})`;
  S.bv.style.textShadow = `0 4px 0 ${low < 0.5 ? '#0B7A51' : '#9AA6BC'}, 0 0 ${lerp(40, 10, low)}px rgba(22,199,132,${lerp(0.55, 0.0, low)}), 0 16px 30px rgba(0,0,0,.45)`;

  S.circ.style.strokeDashoffset = 1 - E.inOutCubic(seg(t, 10.55, 0.55));

  // rows slide in as each expense hits
  S.rows.forEach((r, i) => {
    const p = E.outExpo(seg(t, r.at, 0.5));
    r.el.style.transform = `translateX(${(1 - p) * -90}px)`;
    show(r.el, clamp(p * 3));
    const hit = Math.max(0, ...[0.25, 0.4, 0.55, 0.7].map(d => Math.max(0, 1 - Math.abs(t - (r.at + d)) / 0.09)));
    r.tile.style.transform = `scale(${1 + hit * 0.1})`;
    const ap = E.outCubic(seg(t, r.at + 0.42, 0.35));
    r.amt.style.opacity = ap; r.amt.style.transform = `translateY(-50%) translateX(${(1 - ap) * 24}px)`;
  });

  // cash stack drains, bills fly into the expense rows
  const g = S.g; g.clearRect(0, 0, 1080, 1920);
  const grow = E.outExpo(seg(t, 4.98, 0.8));
  const hgt = (34 + (STACK.maxH - 34) * clamp(v / START)) * grow;
  g.globalAlpha = clamp(grow * 3);
  const topPt = drawStack(S, g, Math.max(hgt, 1), t);
  g.globalAlpha = 1;
  S.notes.forEach(n => {
    const r = S.rows[n.i], st = r.at + 0.04 + n.d, p = seg(t, st, 0.62);
    if (p <= 0 || p >= 1) return;
    const e = E.inOutCubic(p);
    const x0 = topPt.x + n.jx, y0 = topPt.y, x1 = r.tx, y1 = r.ty;
    const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(Math.PI * e) * n.arc;
    const sc = lerp(1, 0.32, E.inCubic(p));
    drawNote(g, S.front, S.back, x, y, n.w * sc, { rot: lerp(-0.2, n.spin, e), flip: e * Math.PI * n.flips, alpha: 1 - seg(p, 0.86, 0.14) });
  });
}
