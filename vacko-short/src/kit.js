// VACKO motion kit. Every picture is a pure function of time t (seconds): nothing animates on its own.

export const C = { navy: '#101827', emerald: '#16C784', gold: '#F5C451', white: '#FFFFFF' };

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const seg = (t, start, dur) => clamp((t - start) / dur);
export const mix = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));

export const E = {
  linear: p => p,
  inQuad: p => p * p,
  outQuad: p => 1 - (1 - p) * (1 - p),
  inCubic: p => p * p * p,
  outCubic: p => 1 - Math.pow(1 - p, 3),
  inOutCubic: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inQuart: p => p * p * p * p,
  outQuart: p => 1 - Math.pow(1 - p, 4),
  inOutQuart: p => (p < 0.5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2),
  outQuint: p => 1 - Math.pow(1 - p, 5),
  inOutQuint: p => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
  inExpo: p => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
  outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inOutExpo: p => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2),
  outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  outBackSoft: p => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  outElastic: p => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};

// Damped spring settle from 0 to 1 (overshoots a little), for "landing" moves.
export const spring = (p, k = 7, z = 0.42) => (p <= 0 ? 0 : 1 - Math.exp(-k * z * p) * Math.cos(k * Math.sqrt(1 - z * z) * p));

export function rng(seed) { // mulberry32, deterministic
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

// Smooth deterministic noise in [-1, 1] (sum of sines), for drift and hand-held wobble.
export const wob = (t, seed = 0) => (Math.sin(t * 1.3 + seed * 1.7) * 0.55 + Math.sin(t * 2.1 + seed * 3.1) * 0.3 + Math.sin(t * 3.7 + seed * 5.3) * 0.15);

export const usd = (v, { sign = '', cents = true } = {}) => {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  const pre = sign === '+' ? '+' : sign === '-' ? '−' : v < 0 ? '−' : '';
  return `${pre}$${s}`;
};

// Piecewise keyframes for a number: keys = [[t, v, ease?], ...]
export function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [ta, va] = ks[i], [tb, vb, e] = ks[i + 1];
    if (t < tb) return lerp(va, vb, (e || E.inOutCubic)((t - ta) / (tb - ta)));
  }
  return ks[ks.length - 1][1];
}

export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

export function css(e, styles) { Object.assign(e.style, styles); return e; }

export function place(e, x, y, w, h) {
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (w !== undefined) e.style.width = w + 'px';
  if (h !== undefined) e.style.height = h + 'px';
  return e;
}

// Transform helper: translate(x,y) rotate(r) scale(s) with optional 3D tilt.
export const tf = ({ x = 0, y = 0, r = 0, s = 1, sx, sy, rx = 0, ry = 0, z = 0 } = {}) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${sx ?? s}, ${sy ?? s})`;

export function show(e, a) {
  e.style.opacity = a;
  e.style.visibility = a <= 0.001 ? 'hidden' : 'inherit';   // inherit, so a hidden scene hides its children too
}

// Camera on a 1080x1920 content plane: content point (x, y) is shown at screen point (sx, sy), scaled by s.
export function cam(node, { x = 540, y = 960, s = 1, sx = 540, sy = 960, r = 0 }) {
  node.style.transform = `translate(${sx}px, ${sy}px) rotate(${r}deg) scale(${s}) translate(${-x}px, ${-y}px)`;
}

// Camera keyframes: [{t, x, y, s, sx?, sy?, r?, e?}] → interpolated camera.
export function camAt(t, ks) {
  if (t <= ks[0].t) return ks[0];
  const last = ks[ks.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t < b.t) {
      const p = (b.e || E.inOutCubic)((t - a.t) / (b.t - a.t));
      const o = {};
      for (const k of ['x', 'y', 's', 'sx', 'sy', 'r']) o[k] = lerp(a[k] ?? (k === 's' ? 1 : k === 'r' ? 0 : k === 'sx' ? 540 : k === 'sy' ? 960 : 0), b[k] ?? (k === 's' ? 1 : k === 'r' ? 0 : k === 'sx' ? 540 : k === 'sy' ? 960 : 0), p);
      // Scale interpolates geometrically so zooms feel even.
      o.s = Math.exp(lerp(Math.log(a.s ?? 1), Math.log(b.s ?? 1), p));
      return o;
    }
  }
  return last;
}

// Decaying shake after an impact at `at`.
export function shake(t, at, amp = 14, dur = 0.45) {
  if (t < at || t > at + dur) return [0, 0];
  const p = (t - at) / dur, d = amp * Math.pow(1 - p, 2.4);
  return [d * Math.sin(t * 91.7), d * Math.cos(t * 77.3)];
}

export async function fontsReady() {
  const specs = ['500 40px Montserrat', '600 40px Montserrat', '700 40px Montserrat', '800 40px Montserrat', '900 40px Montserrat',
    '400 24px Inter', '500 24px Inter', '600 24px Inter', '700 24px Inter'];
  await Promise.all(specs.map(s => document.fonts.load(s, 'AZaz09$,.%−’')));
  await document.fonts.ready;
}

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export const svgURL = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
