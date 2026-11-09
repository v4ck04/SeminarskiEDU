// SCENE 5 — BRAND REVEAL (31–40 s): gold and emerald coins swirl in and lock into the VACKO mark.
import { el, seg, E, clamp, lerp, cam, camAt, show, rng } from './kit.js';
import { headline, fitLines, animHeadline } from './type.js';
import { drawCoin } from './art.js';
import { navyWall, mountBackdrop } from './bg.js';
import { MARK, markSVG } from './logo.js';

export const S5 = { t0: 30.84, t1: 40.01 };
const M = { x: 540, y: 850, size: 400 };        // where the mark assembles
const LOCK = 33.95;                             // coins fuse into the solid mark
const k = M.size / 200;
const P = (x, y) => [M.x + (x - 100) * k, M.y + (y - 100) * k];

function targets() {
  const out = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (MARK.ringFrom + (MARK.ringTo - MARK.ringFrom) * (i / (n - 1))) * Math.PI / 180;
    out.push({ p: P(100 + MARK.r * Math.cos(a), 100 + MARK.r * Math.sin(a)), r: 21, kind: 'gold' });
  }
  const [a, b, c] = MARK.v;
  for (let i = 0; i <= 2; i++) out.push({ p: P(lerp(a[0], b[0], i / 2.4), lerp(a[1], b[1], i / 2.4)), r: 26, kind: 'emerald' });
  for (let i = 0; i <= 5; i++) out.push({ p: P(lerp(b[0], c[0], i / 5.4), lerp(b[1], c[1], i / 5.4)), r: 26, kind: 'emerald' });
  out.push({ p: P(...MARK.chevron[0]), r: 24, kind: 'emerald' });
  out.push({ p: P(...MARK.chevron[2]), r: 24, kind: 'emerald' });
  out.push({ p: P(...MARK.v[2]), r: 26, kind: 'emerald' });
  return out;
}

export async function build(stage) {
  const root = el('section', 'scene', stage);
  root.id = 's5';
  const moveWall = mountBackdrop(root, navyWall());
  const bk = el('canvas', 'fx', root); bk.width = 1080; bk.height = 1920;
  const camEl = el('div', 'cam', root);

  const glow = el('div', 'logo-glow', camEl);
  const h = headline(camEl, {
    top: 282,
    lines: [
      { size: 80, cls: 'lead-d', words: [{ t: 'BUILD', at: 31.3 }, { t: 'BETTER', at: 31.42 }] },
      { size: 140, cls: 'kgold', mt: 4, words: [{ t: 'MONEY', at: 31.68, style: 'slam', shine: 32.6 }, { t: 'HABITS', at: 31.86, shine: 32.7 }] },
    ],
  });
  fitLines(h);

  const fx = el('canvas', 'fx', camEl); fx.width = 1080; fx.height = 1920;
  const markBox = el('div', 'abs markbox', camEl, markSVG({ ring: 'gold', size: M.size, draw: true }));
  markBox.style.left = M.x - M.size / 2 + 'px'; markBox.style.top = M.y - M.size / 2 + 'px';
  markBox.style.width = markBox.style.height = M.size + 'px';
  const paths = [...markBox.querySelectorAll('path')];

  const word = el('div', 'wordmark', camEl);
  [...'VACKO'].forEach(ch => { const m = el('span', 'wm-l', word); el('span', 'wm-c', m, ch); });
  const wshine = el('span', 'wm-sh', word, 'VACKO');
  const rule = el('div', 'tg-rule', camEl);
  const tag = el('div', 'tagline', camEl, 'SMART MONEY. SMARTER FUTURE.');
  const flare = el('div', 'flare', camEl);

  const R = rng(42);
  const coins = targets().map((tg, i) => {
    const ang = R() * Math.PI * 2, rad = 680 + R() * 380;
    return { ...tg, s: [M.x + Math.cos(ang) * rad, M.y + Math.sin(ang) * rad], bend: (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.5),
      st: 30.92 + R() * 0.8, dur: 1.3 + R() * 0.5, flips: 2 + Math.floor(R() * 3), rot: (R() - 0.5) * 0.6, i };
  });
  const sparks = Array.from({ length: 36 }, () => ({ a: R() * Math.PI * 2, v: 300 + R() * 520, r: 4 + R() * 8, c: R() < 0.5 ? '#F5C451' : '#16C784', d: R() * 0.08 }));
  const parts = Array.from({ length: 40 }, () => ({ x: R() * 1080, y: R() * 1920, r: 3 + R() * 20, a: 0.05 + R() * 0.2, sp: 6 + R() * 24, c: R() < 0.5 ? '245,196,81' : R() < 0.75 ? '22,199,132' : '255,255,255', ph: R() * 6 }));

  return { root, camEl, moveWall, bk: bk.getContext('2d'), glow, h, g: fx.getContext('2d'), markBox, paths, word, letters: [...word.querySelectorAll('.wm-c')], wshine, rule, tag, flare, coins, sparks, parts };
}

function star(g, x, y, r, color, a) {
  if (r <= 0.2 || a <= 0) return;
  g.save(); g.globalAlpha = a; g.fillStyle = color; g.translate(x, y);
  g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0); g.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
  g.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0); g.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r); g.fill(); g.restore();
}

export function update(S, t) {
  S.root.style.opacity = E.inOutCubic(seg(t, 30.84, 0.2));
  // camera: settle from the zoom-through, then a slow push on the end card
  const c = camAt(t, [{ t: 30.84, x: 540, y: 900, s: 1.25 }, { t: 31.9, x: 540, y: 900, s: 1.0, e: E.outExpo }, { t: 40, x: 540, y: 880, s: 1.05, e: E.inOutCubic }]);
  cam(S.camEl, { ...c, sy: 900 });
  S.moveWall(0, -(t - 31) * 3, 1);

  const b = S.bk; b.clearRect(0, 0, 1080, 1920);
  S.parts.forEach(p => {
    const y = ((p.y - (t - 30) * p.sp) % 1920 + 1920) % 1920, x = p.x + Math.sin(t * 0.4 + p.ph) * 18;
    const gr = b.createRadialGradient(x, y, 0, x, y, p.r);
    gr.addColorStop(0, `rgba(${p.c},${p.a})`); gr.addColorStop(1, `rgba(${p.c},0)`);
    b.fillStyle = gr; b.beginPath(); b.arc(x, y, p.r, 0, Math.PI * 2); b.fill();
  });

  animHeadline(S.h, t, { out: 34.55, outDur: 0.4 });

  // the mark rises a little once the headline has gone, to make room for the wordmark
  const up = E.inOutCubic(seg(t, 34.7, 0.9));
  const my = -122 * up, ms = lerp(1, 0.92, up);
  const lockP = seg(t, LOCK, 0.5);
  S.markBox.style.transform = `translateY(${my}px) scale(${ms * (1 + Math.sin(Math.PI * lockP) * 0.06)})`;
  const draw = E.outCubic(seg(t, LOCK - 0.12, 0.45));
  S.paths.forEach(p => { p.style.strokeDashoffset = 1 - draw; });
  show(S.markBox, clamp(draw * 4));
  const gl = clamp(seg(t, 31.2, 2.5)) * 0.55 + Math.sin(Math.PI * lockP) * 0.6 + 0.25 * seg(t, LOCK, 1);
  S.glow.style.opacity = gl;
  S.glow.style.transform = `translate(${M.x - 450}px, ${M.y - 450 + my}px) scale(${0.8 + 0.3 * seg(t, 31.2, 3)})`;

  // coins fly in, land on the mark, then fuse into it
  const g = S.g; g.clearRect(0, 0, 1080, 1920);
  g.save();
  g.translate(M.x, M.y + my); g.scale(ms, ms); g.translate(-M.x, -M.y);
  const fuse = E.inCubic(seg(t, LOCK - 0.05, 0.3));
  S.coins.forEach(co => {
    const p = seg(t, co.st, co.dur);
    if (p <= 0 || fuse >= 1) return;
    const pos = q => {
      const e = E.outCubic(q);
      const mx = (co.s[0] + co.p[0]) / 2, my2 = (co.s[1] + co.p[1]) / 2;
      const dx = co.p[0] - co.s[0], dy = co.p[1] - co.s[1];
      const cx = mx - dy * 0.45 * co.bend, cy = my2 + dx * 0.45 * co.bend;
      return [(1 - e) * (1 - e) * co.s[0] + 2 * (1 - e) * e * cx + e * e * co.p[0], (1 - e) * (1 - e) * co.s[1] + 2 * (1 - e) * e * cy + e * e * co.p[1], e];
    };
    const [x, y, e] = pos(p);
    const sc = lerp(1.6, 1, e) * (1 - fuse * 0.6);
    const flip = (1 - e) * Math.PI * co.flips;
    // short motion trail while moving fast
    if (p < 0.85) for (let j = 1; j <= 3; j++) {
      const [tx, ty] = pos(Math.max(0, p - j * 0.025));
      drawCoin(g, tx, ty, co.r * sc, { flip: flip + j * 0.2, rot: co.rot, kind: co.kind, alpha: 0.16 / j, glint: 0, mark: '' });
    }
    const shimmer = Math.max(0, 1 - Math.abs(t - (LOCK - 0.45 + co.i * 0.012)) / 0.12);
    drawCoin(g, x, y, co.r * sc, { flip, rot: co.rot * (1 - e), kind: co.kind, alpha: 1 - fuse, glint: 0.55 + shimmer * 0.45, mark: co.kind === 'gold' ? '$' : '', shadow: 0.35 });
  });
  g.restore();

  // lock flash: shockwave ring, sparks, anamorphic flare
  const fp = seg(t, LOCK, 0.9);
  if (fp > 0 && fp < 1) {
    g.save();
    g.strokeStyle = `rgba(245,196,81,${0.7 * (1 - fp)})`; g.lineWidth = 6 * (1 - fp) + 1;
    g.beginPath(); g.arc(M.x, M.y + my, 170 + E.outCubic(fp) * 420, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = `rgba(22,199,132,${0.5 * (1 - fp)})`; g.lineWidth = 3;
    g.beginPath(); g.arc(M.x, M.y + my, 150 + E.outCubic(fp) * 300, 0, Math.PI * 2); g.stroke();
    g.restore();
    S.sparks.forEach(s => {
      const q = seg(t, LOCK + s.d, 0.9); if (q <= 0 || q >= 1) return;
      const d = 170 + s.v * E.outCubic(q);
      star(g, M.x + Math.cos(s.a) * d, M.y + my + Math.sin(s.a) * d, s.r * (1 - q), s.c, 1 - q);
    });
  }
  const fl = Math.sin(Math.PI * seg(t, LOCK - 0.05, 0.7));
  S.flare.style.opacity = fl * 0.95;
  S.flare.style.transform = `translate(0, ${M.y + my - 3}px) scaleX(${0.4 + fl * 0.8})`;

  // wordmark: letters rise out of a mask, then a light sweep
  S.letters.forEach((l, i) => {
    const p = E.outExpo(seg(t, 34.95 + i * 0.07, 0.7));
    l.style.transform = `translateY(${(1 - p) * 110}%)`;
  });
  const sw = seg(t, 36.0, 1.0);
  S.wshine.style.backgroundPosition = `${lerp(130, -30, E.inOutCubic(sw))}% 0`;
  S.wshine.style.opacity = sw > 0 && sw < 1 ? 1 : 0;
  const rp = E.inOutCubic(seg(t, 35.45, 0.6));
  S.rule.style.transform = `scaleX(${rp})`;
  const tp = E.outCubic(seg(t, 35.6, 0.9));
  S.tag.style.opacity = tp;
  S.tag.style.letterSpacing = `${lerp(0.5, 0.22, tp)}em`;
  S.tag.style.paddingLeft = `${lerp(0.5, 0.22, tp)}em`;   // keeps the spaced line optically centred
  S.tag.style.filter = tp < 0.98 ? `blur(${((1 - tp) * 6).toFixed(2)}px)` : 'none';
  // final glint across the ring
  const gp = seg(t, 37.9, 0.8);
  S.markBox.style.filter = gp > 0 && gp < 1 ? `drop-shadow(0 0 ${18 * Math.sin(Math.PI * gp)}px rgba(245,196,81,.8))` : 'drop-shadow(0 0 10px rgba(245,196,81,.25))';
}
