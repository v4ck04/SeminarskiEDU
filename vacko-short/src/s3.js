// SCENE 3 — THE REAL REASON (12–20 s): income climbs, savings stay flat because expenses climb too.
import { el, seg, E, clamp, lerp, keys, cam, camAt, show, place } from './kit.js';
import { headline, fitLines, animHeadline } from './type.js';
import { coinStack } from './art.js';
import { lightWall, windowLight, mountBackdrop } from './bg.js';

export const S3 = { t0: 11.7, t1: 20.25 };

const CARD = { y: 612, w: 430, h: 712, xl: 70, xr: 530 };
const CH = { x0: 46, x1: 384, base: 650, top: 160 };       // chart area inside a card (card px)
const INC = [215, 270, 325, 380, 430];   // +100 % from first to last year                       // income bar heights → +100 %
const EXPN = [165, 218, 272, 326, 380];                      // expense ghost bars (rise with income)
const SAV = [2, 2, 3, 2, 3];                                 // coins per year: almost unchanged
const TB = 13.25, TS = 0.42;                                 // bar timing
const SC = 2;                                                // canvas supersampling

function card(parent, x, kind) {
  const c = el('div', 'ccard', parent);
  place(c, x, CARD.y, CARD.w, CARD.h);
  const isInc = kind === 'inc';
  c.innerHTML = `<div class="chd"><span class="cdot ${isInc ? 'em' : 'gd'}"></span><span class="ctl">${isInc ? 'INCOME' : 'SAVINGS'}</span>
    <span class="cbadge ${isInc ? 'em' : 'gd'}"><svg viewBox="0 0 20 20"><path d="${isInc ? 'M10 3 L17 12 H12.5 V17 H7.5 V12 H3 Z' : 'M3 8 H13 V4 L18 10 L13 16 V12 H3 Z'}"/></svg><b></b></span></div>
    ${isInc ? '' : '<div class="clg"><i></i>EXPENSES</div>'}`;
  const cv = el('canvas', 'ccv', c);
  cv.width = CARD.w * SC; cv.height = CARD.h * SC;
  return { el: c, badge: c.querySelector('.cbadge'), num: c.querySelector('.cbadge b'), g: cv.getContext('2d'), lg: c.querySelector('.clg') };
}

export async function build(stage) {
  const root = el('section', 'scene', stage);
  root.id = 's3';
  const moveWall = mountBackdrop(root, lightWall());
  const moveLight = mountBackdrop(root, windowLight());
  const camEl = el('div', 'cam', root);

  const h = headline(camEl, {
    top: 266,
    lines: [
      { size: 76, cls: 'lead-l', words: [{ t: 'IT’S', at: 12.04 }, { t: 'HOW', at: 12.13 }, { t: 'YOU', at: 12.22 }] },
      { size: 110, cls: 'k3d', mt: 8, words: [{ t: 'MANAGE', at: 12.44, style: 'slam', marker: 'em', marker_at: 12.85 }, { t: 'YOUR', at: 12.64 }, { t: 'MONEY', at: 12.74, shine: 13.5 }] },
    ],
  });
  fitLines(h);

  const L = card(camEl, CARD.xl, 'inc');
  const R = card(camEl, CARD.xr, 'sav');
  const circ = el('div', 'bcirc', camEl, '<svg viewBox="0 0 220 110" preserveAspectRatio="none"><path pathLength="1" d="M120 8 C 180 6, 214 26, 212 54 C 210 88, 160 104, 104 102 C 46 100, 8 84, 9 54 C 10 26, 52 8, 108 8 C 132 8, 150 11, 162 16"/></svg>');
  return { root, camEl, moveWall, moveLight, h, L, R, circ, circPath: circ.querySelector('path') };
}

const colX = i => CH.x0 + 22 + i * ((CH.x1 - CH.x0 - 44) / 4);

function grid(g) {
  g.strokeStyle = 'rgba(16,24,39,0.08)'; g.lineWidth = 2; g.setLineDash([8, 10]);
  for (let k = 1; k <= 3; k++) { const y = CH.base - k * 128; g.beginPath(); g.moveTo(CH.x0 - 10, y); g.lineTo(CH.x1 + 10, y); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = 'rgba(16,24,39,0.22)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(CH.x0 - 14, CH.base); g.lineTo(CH.x1 + 14, CH.base); g.stroke();
}

function bar(g, cx, w, hgt) {
  if (hgt < 1) return;
  const x = cx - w / 2, y = CH.base - hgt, r = Math.min(14, hgt / 2);
  g.save();
  g.shadowColor = 'rgba(22,199,132,0.35)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
  const gr = g.createLinearGradient(0, y, 0, CH.base);
  gr.addColorStop(0, '#45E6A6'); gr.addColorStop(0.45, '#16C784'); gr.addColorStop(1, '#0E9A66');
  g.fillStyle = gr;
  g.beginPath(); g.roundRect(x, y, w, hgt, [r, r, 3, 3]); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = 'rgba(255,255,255,0.28)';
  g.beginPath(); g.roundRect(x + 6, y + 6, 8, Math.max(0, hgt - 16), 4); g.fill();
  g.restore();
}

function ghost(g, cx, w, hgt) {
  if (hgt < 1) return;
  const x = cx - w / 2, y = CH.base - hgt;
  g.save();
  g.fillStyle = 'rgba(16,24,39,0.11)';
  g.beginPath(); g.roundRect(x, y, w, hgt, [12, 12, 3, 3]); g.fill();
  g.strokeStyle = 'rgba(16,24,39,0.45)'; g.lineWidth = 2.5; g.setLineDash([9, 7]);
  g.beginPath(); g.roundRect(x, y, w, hgt, [12, 12, 3, 3]); g.stroke();
  g.restore();
}

function arrowLine(g, pts, p, color, width, head = true) {
  if (p <= 0) return;
  // polyline partially drawn up to fraction p of its length
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(d); total += d; }
  let rem = total * p;
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = color; g.shadowBlur = 16;
  g.beginPath(); g.moveTo(...pts[0]);
  let end = pts[0], dir = [1, 0];
  for (let i = 0; i < segs.length && rem > 0; i++) {
    const f = Math.min(1, rem / segs[i]);
    end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    dir = [(pts[i + 1][0] - pts[i][0]) / segs[i], (pts[i + 1][1] - pts[i][1]) / segs[i]];
    g.lineTo(...end); rem -= segs[i];
  }
  g.stroke();
  if (head && p > 0.15) {
    const L = 26, a = 0.55;
    const back = [-dir[0], -dir[1]];
    const rot = (v, s) => [v[0] * Math.cos(s) - v[1] * Math.sin(s), v[0] * Math.sin(s) + v[1] * Math.cos(s)];
    const h1 = rot(back, a), h2 = rot(back, -a);
    g.beginPath(); g.moveTo(end[0] + h1[0] * L, end[1] + h1[1] * L); g.lineTo(...end); g.lineTo(end[0] + h2[0] * L, end[1] + h2[1] * L); g.stroke();
  }
  g.restore();
}

export function update(S, t) {
  // whip in from below (scene 2 leaves upwards)
  const wp = E.inOutQuart(seg(t, 11.72, 0.42));
  const v = Math.sin(Math.PI * wp);
  S.root.style.transform = `translateY(${(1 - wp) * 1920}px)`;
  S.root.style.filter = v > 0.05 && wp < 1 ? `blur(${(v * 5).toFixed(2)}px)` : 'none';
  // exit: pan left into scene 4
  const xp = E.inOutQuart(seg(t, 19.78, 0.46));
  if (xp > 0) { S.root.style.transform = `translateX(${-xp * 1080}px)`; S.root.style.filter = Math.sin(Math.PI * xp) > 0.05 && xp < 1 ? `blur(${(Math.sin(Math.PI * xp) * 4).toFixed(2)}px)` : 'none'; }

  const c = camAt(t, [{ t: 12.0, x: 540, y: 300, sy: 300, s: 1.0 }, { t: 20.2, x: 540, y: 300, sy: 300, s: 1.045, e: E.linear }]);
  cam(S.camEl, c);
  S.moveWall(0, -(t - 12) * 4, 1);
  S.moveLight((t - 12) * 8, -(t - 12) * 4, 1);

  animHeadline(S.h, t);

  // cards rise in
  [S.L, S.R].forEach((C, k) => {
    const p = E.outExpo(seg(t, 12.25 + k * 0.1, 0.7));
    C.el.style.transform = `translateY(${(1 - p) * 120}px)`;
    show(C.el, clamp(p * 2.5));
  });

  // badges
  const inc = keys(t, [[TB, 0], [TB + 4 * TS + 0.5, 100, E.outCubic]]);
  const sav = keys(t, [[TB, 0], [TB + 4 * TS + 0.5, 2, E.outCubic]]);
  S.L.num.textContent = `+${Math.round(inc)}%`;
  S.R.num.textContent = `+${Math.round(sav)}%`;
  const pulse = Math.sin(Math.PI * seg(t, 16.05, 0.6));
  S.R.badge.style.transform = `scale(${1 + pulse * 0.12})`;
  S.circPath.style.strokeDashoffset = 1 - E.inOutCubic(seg(t, 16.1, 0.55));
  if (S.R.lg) S.R.lg.style.opacity = E.outCubic(seg(t, TB + 0.3, 0.5));

  // ---- income chart
  let g = S.L.g;
  g.setTransform(SC, 0, 0, SC, 0, 0);
  g.clearRect(0, 0, CARD.w, CARD.h);
  grid(g);
  const tops = [];
  INC.forEach((hh, i) => {
    const p = seg(t, TB + i * TS, 0.55), e = E.outBackSoft(p);
    bar(g, colX(i), 46, hh * e);
    tops.push([colX(i), CH.base - hh - 30]);
  });
  arrowLine(g, tops, E.inOutCubic(seg(t, 15.35, 0.6)), '#0FA36B', 7);

  // ---- savings chart: expenses rise (ghost bars), savings coins stay low
  g = S.R.g;
  g.setTransform(SC, 0, 0, SC, 0, 0);
  g.clearRect(0, 0, CARD.w, CARD.h);
  grid(g);
  EXPN.forEach((hh, i) => {
    const p = seg(t, TB + i * TS, 0.55), e = E.outBackSoft(p);
    ghost(g, colX(i), 50, hh * e);
  });
  SAV.forEach((n, i) => {
    const t0 = TB + i * TS + 0.15;
    coinStack(g, colX(i), CH.base - 2, n, {
      rx: 27, ry: 9, th: 9,
      drop: j => { const p = seg(t, t0 + j * 0.09, 0.32); if (p <= 0) return null; return { dy: (1 - E.outBackSoft(p)) * 90, a: clamp(p * 4) }; },
    });
  });
  arrowLine(g, [[CH.x0 - 4, CH.base - 52], [CH.x1 + 4, CH.base - 48]], E.inOutCubic(seg(t, 15.45, 0.6)), '#E0A92E', 6);
}
