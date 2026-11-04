// Shared motion kit for the @seminarski_edu reel. Every picture depends only on t.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const seg = (t, start, dur) => clamp((t - start) / dur);

export const E = {
  linear: p => p,
  outCubic: p => 1 - Math.pow(1 - p, 3),
  inCubic: p => p * p * p,
  inOutCubic: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outQuint: p => 1 - Math.pow(1 - p, 5),
  outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
};

// A bold right arrow that matches Montserrat Black (the font has no U+2192 glyph).
export const ARROW = '<svg viewBox="0 0 90 60" aria-label="→"><path d="M8 30H72M50 9l24 21-24 21" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function rng(seed) { // mulberry32, deterministic
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

export async function fonts() {
  const sample = 'AaČćŽžŠšĐđ0123[]';
  const specs = ['900 80px Montserrat', '800 80px Montserrat', '700 40px Montserrat', '600 40px Montserrat', '500 40px Montserrat',
    '400 24px Inter', '500 24px Inter', '600 24px Inter', '700 24px Inter',
    '400 24px Tinos', '700 24px Tinos', '400 24px "JetBrains Mono"', '500 24px "JetBrains Mono"', '700 24px "JetBrains Mono"'];
  await Promise.all(specs.map(s => document.fonts.load(s, sample)));
  await document.fonts.ready;
}

// Shrink each headline line until it fits `max` px wide.
export function fit(root, max = 960) {
  root.querySelectorAll('.ln').forEach(ln => {
    let fs = parseFloat(getComputedStyle(ln).fontSize);
    while (ln.scrollWidth > max && fs > 30) { fs -= 2; ln.style.fontSize = fs + 'px'; }
  });
}

// Declarative timing: [data-words] groups, .mark/.box[data-at], .hlt[data-at][data-out], [data-in][data-out]
export function animate(root, t) {
  root.querySelectorAll('[data-words]').forEach(g => {
    const at = +g.dataset.words, st = +(g.dataset.stagger || 0.07);
    g.querySelectorAll('.w').forEach((w, i) => {
      const p = seg(t, at + i * st, 0.42), e = E.outBack(p);
      w.style.opacity = clamp(p * 2.5);
      w.style.transform = `translateY(${(1 - e) * 46}px) scale(${0.92 + 0.08 * e})`;
    });
  });
  root.querySelectorAll('.mark[data-at], .box[data-at]').forEach(el => {
    el.style.setProperty('--m', E.outCubic(seg(t, +el.dataset.at, +(el.dataset.dur || 0.32))));
  });
  root.querySelectorAll('.hlt[data-at]').forEach(el => {
    let h = E.outBack(seg(t, +el.dataset.at, 0.42));
    if (el.dataset.out) h *= 1 - seg(t, +el.dataset.out, 0.25);
    el.style.setProperty('--h', h);
  });
  root.querySelectorAll('[data-in]').forEach(el => {
    const i = +el.dataset.in, o = el.dataset.out !== undefined ? +el.dataset.out : 1e9;
    const a = seg(t, i, 0.18) * (1 - seg(t, o, 0.18));
    el.style.opacity = a;
    el.style.visibility = a <= 0.001 ? 'hidden' : 'visible';
  });
}

// Centre and size of an element in the camera's content coordinates (measured at rest).
export function measure(cam, sel) {
  const prev = cam.style.transform; cam.style.transform = 'none';
  const cr = cam.getBoundingClientRect(), r = document.querySelector(sel).getBoundingClientRect();
  cam.style.transform = prev;
  return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2, w: r.width, h: r.height };
}

// Camera: keys [{t, x, y, s, sx, sy, ease}] — content point (x, y) shown at screen point (sx, sy) at scale s.
export function camera(cam, t, keys, extra = [0, 0, 0]) {
  let a = keys[0], b = keys[0], p = 0;
  if (t >= keys[keys.length - 1].t) a = b = keys[keys.length - 1];
  else if (t > keys[0].t) for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t < keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; p = (b.ease || E.inOutCubic)((t - a.t) / (b.t - a.t)); break; }
  }
  const s = lerp(a.s, b.s, p), x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p);
  const sx = lerp(a.sx ?? 540, b.sx ?? 540, p), sy = lerp(a.sy ?? 1100, b.sy ?? 1100, p);
  cam.style.transform = `translate(${sx - x * s + extra[0]}px, ${sy - y * s + extra[1]}px) rotate(${extra[2]}deg) scale(${s})`;
}

// Decaying camera shake from an impact at `at`.
export function shake(t, at, amp = 20, dur = 0.5) {
  if (t < at || t > at + dur) return [0, 0, 0];
  const p = (t - at) / dur, d = amp * Math.pow(1 - p, 2.2);
  return [d * Math.sin(t * 97.3), d * Math.cos(t * 73.9), d * 0.05 * Math.sin(t * 59.1)];
}

// Short pop-in used when a shot opens (the "cut" accent).
export function cutIn(t, dur = 0.28) { const p = E.outCubic(seg(t, 0, dur)); return 1.045 - 0.045 * p; }

export function page({ duration, init, frame }) {
  const ready = (async () => { await fonts(); if (init) await init(); })();
  window.film = { duration, ready, frame };
}
