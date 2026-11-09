// SCENE 1 — THE HOOK (0–5 s): a paycheck lands in a phone, the balance jumps, expenses swarm in.
import { el, seg, E, clamp, lerp, keys, usd, wob, cam, camAt, shake, show, rng, place } from './kit.js';
import { headline, fitLines, animHeadline } from './type.js';
import { phone, tile, paycheckSVG, handSVG, drawCoin, ICON } from './art.js';
import { lightWall, windowLight, mountBackdrop } from './bg.js';

const PH = { x: 350, y: 612, w: 380, h: 780 };       // phone rig position (world)
const BAL0 = 186.40, PAY = 3250, BAL1 = BAL0 + PAY;

const ROW_ICON = {
  cart: '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h3l3 12h12l3-9H8"/><circle cx="11" cy="22" r="1.8"/><circle cx="20" cy="22" r="1.8"/></svg>',
  cup: '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z"/><path d="M19 12h2a3 3 0 0 1 0 6h-2"/><path d="M9 3v3M13 3v3"/></svg>',
  pump: '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="11" height="19" rx="2"/><path d="M7 9h5"/><path d="M15 12h3l2 3v6a2 2 0 0 0 4 0V10l-3-3"/></svg>',
  dep: '<svg viewBox="0 0 28 28" fill="none" stroke="#16C784" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v13M8 12l6 6 6-6"/><path d="M5 23h18"/></svg>',
};

const TILES = [
  { g: 'shopping', x: 182, y: 772, at: 2.62 },
  { g: 'subs', x: 900, y: 752, at: 2.80 },
  { g: 'food', x: 150, y: 1002, at: 2.98 },
  { g: 'card', x: 905, y: 985, at: 3.16 },
  { g: 'impulse', x: 196, y: 1232, at: 3.34 },
];

export const S1 = { t0: 0, t1: 5.02 };

export function build(stage) {
  const root = el('section', 'scene', stage);
  root.id = 's1';
  const moveWall = mountBackdrop(root, lightWall());
  const moveLight = mountBackdrop(root, windowLight());
  const camEl = el('div', 'cam', root);

  // headline
  const h = headline(camEl, {
    top: 262,
    lines: [
      { size: 76, cls: 'lead-l', words: [{ t: 'WHY', at: -0.3 }, { t: 'MOST', at: -0.2 }, { t: 'PEOPLE', at: -0.1 }] },
      { size: 150, cls: 'k3d', mt: 2, words: [{ t: 'STAY', at: 0.3, style: 'slam' }, { t: 'BROKE', at: 0.52, style: 'slam', shine: 1.1, under: 0.86 }] },
    ],
  });
  fitLines(h);

  // phone rig (hand + phone move together)
  const rig = el('div', 'abs', camEl);
  place(rig, PH.x, PH.y, PH.w, PH.h);
  rig.style.transformOrigin = '50% 90%';
  const hand = handSVG(PH.w, PH.h);
  rig.insertAdjacentHTML('beforeend', hand.back);
  const ph = phone(rig, { w: PH.w, h: PH.h });
  ph.root.style.left = '0px'; ph.root.style.top = '0px';
  rig.insertAdjacentHTML('beforeend', hand.front);

  // bank app
  const app = el('div', 'app', ph.scr);
  app.innerHTML = `
    <div class="status"><span>9:41</span><span class="ic">${ICON.signal}${ICON.wifi}${ICON.battery}</span></div>
    <div class="acct"><span class="avatar"><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.5" r="4.2"/><path d="M4 21c.8-4.4 4-6.6 8-6.6s7.2 2.2 8 6.6z"/></svg></span>Checking ••4821</div>
    <div class="lbl">Available balance</div>
    <div class="bal"></div>
    <div class="pill">+$3,250.00 deposited</div>
    <svg class="spark" viewBox="0 0 308 110"><defs><linearGradient id="spf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16C784" stop-opacity=".35"/><stop offset="1" stop-color="#16C784" stop-opacity="0"/></linearGradient></defs>
      <path class="area" fill="url(#spf)"/><path class="line" fill="none" stroke="#16C784" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle class="dot" r="7" fill="#16C784" stroke="#0F1729" stroke-width="3"/></svg>
    <div class="ra">Recent activity</div>
    <div class="rows"></div>
    <div class="tabs"><span class="on"></span><span></span><span></span><span></span></div>
    <div class="home"></div>`;
  const balEl = app.querySelector('.bal'), pill = app.querySelector('.pill');
  const spLine = app.querySelector('.spark .line'), spArea = app.querySelector('.spark .area'), spDot = app.querySelector('.spark .dot');
  const rowsEl = app.querySelector('.rows');
  const mkRow = (icon, name, sub, amt, pos) => {
    const r = el('div', 'row', rowsEl);
    r.innerHTML = `<span class="ri">${ROW_ICON[icon]}</span><span class="rn"><b>${name}</b><i>${sub}</i></span><span class="ra2 ${pos ? 'pos' : ''}">${amt}</span>`;
    return r;
  };
  const rows = [mkRow('dep', 'Paycheck', 'Today', '+$3,250.00', true), mkRow('cart', 'Grocery Store', 'Yesterday', '−$64.32'),
    mkRow('cup', 'Coffee Shop', 'Nov 5', '−$6.75'), mkRow('pump', 'Gas Station', 'Nov 4', '−$48.20')];
  const flash = el('div', 'abs', ph.scr);
  Object.assign(flash.style, { inset: '0', background: 'radial-gradient(80% 50% at 50% 35%, rgba(22,199,132,.55), rgba(255,255,255,0) 70%)', opacity: 0 });

  // paycheck + scanner
  const check = el('div', 'check', camEl, paycheckSVG());
  const scan = el('div', 'scanbox', camEl, '<i></i><i></i><i></i><i></i>');
  const scanLine = el('div', 'scanline', camEl);

  // expense tiles
  const tiles = TILES.map(d => {
    const t = tile(camEl, d.g, 150);
    const b = el('div', 'badge-minus', t);
    return { ...d, el: t, badge: b };
  });

  const fx = el('canvas', 'fx', camEl);
  fx.width = 1080; fx.height = 1920;
  const g = fx.getContext('2d');
  const r = rng(11);
  const coins = Array.from({ length: 8 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return { vx: side * (260 + r() * 420), vy: -520 - r() * 360, sp: (r() - 0.5) * 16, f0: r() * 6, kind: i % 3 === 1 ? 'emerald' : 'gold', d: r() * 0.14, rr: 28 + r() * 10 };
  });

  balEl.textContent = '$3,436.40';
  const cr = camEl.getBoundingClientRect(), r0 = balEl.getBoundingClientRect();
  const balAt = { x: r0.left - cr.left + r0.width / 2, y: r0.top - cr.top + r0.height / 2, size: parseFloat(getComputedStyle(balEl).fontSize) };
  return { root, camEl, balAt, h, rig, balEl, pill, spLine, spArea, spDot, rows, flash, check, scan, scanLine, tiles, g, coins, moveWall, moveLight };
}

const sparkPts = (jump) => {
  const ys = [78, 70, 74, 62, 66, 58, 63, 55];
  const pts = ys.map((y, i) => [8 + i * 38, y]);
  pts.push([8 + 8 * 38, lerp(52, 12, jump)]);
  return pts;
};

export function update(S, t) {
  const { root } = S;
  // ----- camera: punchy push-in, slow drift, then zoom through the phone screen into scene 2
  const ho = S.handoff || { x: 540, y: 597, size: 118 };
  const B = S.balAt, s0 = 1.035;
  const c = camAt(t, [
    { t: 0, x: 540, y: 300, sy: 300, s: 1.09 },                          // pushes are anchored at the headline, so text stays put
    { t: 1.15, x: 540, y: 300, sy: 300, s: 1.0, e: E.outCubic },
    { t: 4.3, x: B.x, y: B.y, sx: 540 + (B.x - 540) * s0, sy: 300 + (B.y - 300) * s0, s: s0, e: E.linear },
    { t: 4.98, x: B.x, y: B.y, s: ho.size / B.size, sx: ho.x, sy: ho.y, e: E.inOutCubic },
    { t: 5.1, x: B.x, y: B.y, s: ho.size / B.size * 1.04, sx: ho.x, sy: ho.y, e: E.linear },
  ]);
  root.style.opacity = 1 - E.inOutCubic(seg(t, 4.84, 0.16));
  const [kx, ky] = shake(t, 0.64, 9, 0.4);
  cam(S.camEl, { ...c, sx: (c.sx ?? 540) + kx, sy: (c.sy ?? 960) + ky });
  S.moveWall(-(c.s - 1) * 30, -(c.s - 1) * 60 + t * -4, 1 + (c.s - 1) * 0.08);
  S.moveLight(t * 9, t * -5, 1);

  // ----- headline
  animHeadline(S.h, t, { out: 4.18, outDur: 0.32 });

  // ----- phone rig: rises into frame, hand-held wobble
  const up = E.outExpo(seg(t, -0.22, 0.8));      // already on its way up in the very first frame
  const calm = 1 - E.inOutCubic(seg(t, 4.1, 0.5));        // hand steadies before the match cut
  const wx = wob(t * 0.9, 1) * 3 * calm, wy = wob(t * 0.8, 2) * 4 * calm, wr = wob(t * 0.7, 3) * 0.6 * calm;
  S.rig.style.transform = `translate(${wx}px, ${(1 - up) * 760 + wy}px) rotate(${((1 - up) * 9 - 2) * calm + wr}deg)`;

  // ----- balance & app
  const bal = keys(t, [[1.78, BAL0], [2.5, BAL1, E.outCubic]]);
  S.balEl.textContent = usd(bal);
  const pulse = seg(t, 1.78, 0.8);
  S.balEl.style.color = pulse > 0 && pulse < 1 ? `rgb(${lerp(22, 255, pulse) | 0}, ${lerp(199, 255, pulse) | 0}, ${lerp(132, 255, pulse) | 0})` : '#fff';
  S.balEl.style.textShadow = pulse > 0 && pulse < 1 ? `0 0 ${30 * (1 - pulse)}px rgba(22,199,132,${0.9 * (1 - pulse)})` : 'none';
  const pp = E.outBack(seg(t, 1.86, 0.4));
  S.pill.style.transform = `scale(${pp})`; S.pill.style.opacity = clamp(pp * 2);
  const jump = E.outCubic(seg(t, 1.8, 0.7));
  const pts = sparkPts(jump);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1].toFixed(1)).join(' ');
  S.spLine.setAttribute('d', d);
  S.spArea.setAttribute('d', d + ` L${pts[pts.length - 1][0]} 110 L8 110 Z`);
  S.spDot.setAttribute('cx', pts[pts.length - 1][0]); S.spDot.setAttribute('cy', pts[pts.length - 1][1].toFixed(1));
  // rows: the paycheck row slides in on top
  const rp = E.outCubic(seg(t, 1.84, 0.45));
  S.rows.forEach((rw, i) => {
    if (i === 0) { rw.style.transform = `translateY(${(1 - rp) * -40}px)`; rw.style.opacity = rp; }
    else rw.style.transform = `translateY(${(i - 1 + rp) * 70}px)`;
  });
  S.flash.style.opacity = Math.sin(Math.PI * seg(t, 1.7, 0.45)) * 0.9;

  // ----- paycheck flight → scan → absorbed into the phone
  const f = seg(t, 0.0, 0.92), fe = E.outCubic(f);
  const land = { x: 540, y: 930 };
  const bx = (1 - fe) * (1 - fe) * 1230 + 2 * (1 - fe) * fe * 980 + fe * fe * land.x;
  const by = (1 - fe) * (1 - fe) * 300 + 2 * (1 - fe) * fe * 520 + fe * fe * land.y;
  const settle = t > 0.97 ? (1 - Math.exp(-(t - 0.97) * 9) * Math.cos((t - 0.97) * 22)) : 0;
  let cs = lerp(1.2, 0.9, fe) + (t > 0.97 ? (settle - 1) * -0.03 : 0), cr = lerp(-34, -4, fe), cx = bx, cy = by, co = clamp(0.35 + f * 5);
  const ab = E.inOutCubic(seg(t, 1.42, 0.36));
  if (ab > 0) { cs = lerp(0.9, 0.12, ab); cx = lerp(land.x, 540, ab); cy = lerp(land.y, 820, ab); cr = lerp(-4, 0, ab); co = 1 - seg(t, 1.66, 0.12); }
  S.check.style.transform = `translate(${cx - 280}px, ${cy - 125}px) rotate(${cr}deg) scale(${cs})`;
  show(S.check, co);
  // scanner brackets + line
  const sb = E.outBack(seg(t, 0.95, 0.3)), sOut = 1 - seg(t, 1.42, 0.15);
  const sw = 560 * 0.9 + 60, shh = 250 * 0.9 + 60;
  S.scan.style.left = land.x - sw / 2 + 'px'; S.scan.style.top = land.y - shh / 2 + 'px';
  S.scan.style.width = sw + 'px'; S.scan.style.height = shh + 'px';
  S.scan.style.transform = `rotate(-4deg) scale(${lerp(1.18, 1, sb)})`;
  show(S.scan, clamp(sb * 2) * sOut);
  const sl = E.inOutCubic(seg(t, 1.03, 0.36));
  S.scanLine.style.left = land.x - 250 + 'px'; S.scanLine.style.width = '500px';
  S.scanLine.style.top = lerp(land.y - 105, land.y + 105, sl) + 'px';
  S.scanLine.style.transform = 'rotate(-4deg)';
  show(S.scanLine, sl > 0 && sl < 1 ? 1 : 0);

  // ----- expense tiles swarm in from the phone
  S.tiles.forEach((d, i) => {
    const p = seg(t, d.at, 0.5), e = E.outBack(p);
    const sx0 = 540, sy0 = 980;
    const x = lerp(sx0, d.x, E.outExpo(p)), y = lerp(sy0, d.y, E.outExpo(p));
    const bob = Math.sin((t - d.at) * 2.6 + i) * 6;
    const out = E.inCubic(seg(t, 4.3, 0.35));
    const ox = (d.x - 540) * out * 0.9, oy = (d.y - 1000) * out * 0.9;
    const s = e * (1 - out * 0.3);
    d.el.style.transform = `translate(${x - 75 + ox}px, ${y - 75 + bob + oy}px) rotate(${(1 - e) * -20 + Math.sin(t * 3 + i) * 2}deg) scale(${s})`;
    show(d.el, clamp(p * 4) * (1 - out));
    const bp = E.outBack(seg(t, d.at + 0.22, 0.3));
    d.badge.style.transform = `scale(${bp})`;
  });

  // ----- coin burst when the money lands
  const g = S.g;
  g.clearRect(0, 0, 1080, 1920);
  S.coins.forEach(k => {
    const tt = t - 1.8 - k.d;
    if (tt < 0 || tt > 0.95) return;
    const x = 540 + k.vx * tt, y = 760 + k.vy * tt + 0.5 * 2400 * tt * tt;
    const a = clamp((0.95 - tt) * 3.5) * clamp(tt * 10);
    drawCoin(g, x, y, k.rr, { flip: k.f0 + tt * k.sp, rot: tt * 2, kind: k.kind, alpha: a, shadow: 0.25 });
  });

  return root;
}
