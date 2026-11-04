// Gold-theme motion helpers for the SeminarskiEdu premium reels. Every picture depends only on t.
export * from './kit.js';
import { seg, E, clamp, rng, fonts } from './kit.js';

// Headline/supporting text: [data-words] groups reveal word by word with a soft blur-rise.
export function reveal(root, t) {
  root.querySelectorAll('[data-words]').forEach(g => {
    const at = +g.dataset.words, st = +(g.dataset.stagger || 0.06), d = +(g.dataset.dur || 0.7);
    g.querySelectorAll('.w').forEach((w, i) => {
      const p = seg(t, at + i * st, d), e = E.outCubic(p);
      w.style.opacity = e;
      w.style.transform = `translateY(${(1 - e) * 34}px)`;
      w.style.filter = p < 1 ? `blur(${(1 - e) * 10}px)` : '';
    });
  });
  // gold shimmer sweep: .gold[data-shine] passes once at that time
  root.querySelectorAll('.gold').forEach(el => {
    const at = el.dataset.shine !== undefined ? +el.dataset.shine : 0.6;
    el.style.setProperty('--sh', `${100 - 100 * E.inOutCubic(seg(t, at, 1.4))}%`);
  });
  root.querySelectorAll('.rule[data-at]').forEach(el => {
    el.style.width = `${E.outCubic(seg(t, +el.dataset.at, 0.8)) * +(el.dataset.w || 220)}px`;
  });
  root.querySelectorAll('.hl[data-at]').forEach(el => {
    let h = E.outBack(seg(t, +el.dataset.at, 0.5));
    if (el.dataset.out) h *= 1 - seg(t, +el.dataset.out, 0.3);
    el.style.setProperty('--h', h);
  });
  root.querySelectorAll('[data-in]').forEach(el => {
    const p = E.outCubic(seg(t, +el.dataset.in, +(el.dataset.dur || 0.6)));
    el.style.opacity = p;
    el.style.transform = `${el.dataset.base || ''} translateY(${(1 - p) * (+(el.dataset.dy || 40))}px)`;
  });
}

// Crossfade role: a shot on the top track fades in and out over its neighbours.
export function shotFade(root, t, duration, { fadeIn = 0, fadeOut = 0 } = {}) {
  let a = 1;
  if (fadeIn) a *= E.inOutCubic(seg(t, 0, fadeIn));
  if (fadeOut) a *= 1 - E.inOutCubic(seg(t, duration - fadeOut, fadeOut));
  root.style.opacity = a;
}

// Floating gold dust / bokeh, deterministic.
export function makeDust(canvas, seed = 7, n = 70, opts = {}) {
  const r = rng(seed), ps = [];
  for (let i = 0; i < n; i++) ps.push({ x: r() * 1080, y: r() * 1920, z: 0.3 + r() * 0.7, ph: r() * 6.28, sp: 6 + r() * 22, big: r() < (opts.bokeh ?? 0.12) });
  const ctx = canvas.getContext('2d');
  canvas.width = 1080; canvas.height = 1920;
  return (t, alpha = 1) => {
    ctx.clearRect(0, 0, 1080, 1920);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of ps) {
      const y = ((p.y - t * p.sp * p.z) % 1920 + 1920) % 1920;
      const x = p.x + Math.sin(t * 0.6 + p.ph) * 18 * p.z;
      const tw = 0.55 + 0.45 * Math.sin(t * 1.7 + p.ph * 3);
      const rad = p.big ? 10 + 22 * p.z : 1.4 + 2.6 * p.z;
      const a = alpha * tw * (p.big ? 0.10 : 0.55) * p.z;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad * (p.big ? 1 : 3));
      g.addColorStop(0, `rgba(247,226,170,${a})`);
      g.addColorStop(1, 'rgba(212,175,106,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad * (p.big ? 1 : 3), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}

// Static film grain texture (drawn once).
export function grain(canvas, seed = 3) {
  canvas.width = 540; canvas.height = 960;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(540, 960), r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}

export function fitLines(root, max = 940) {
  root.querySelectorAll('.ln').forEach(ln => {
    let fs = parseFloat(getComputedStyle(ln).fontSize);
    const w = () => { const r = document.createRange(); r.selectNodeContents(ln); return r.getBoundingClientRect().width; };
    while (w() > Math.min(max, ln.clientWidth) + 1 && fs > 28) { fs -= 2; ln.style.fontSize = fs + 'px'; }
  });
}

export async function luxFonts() {
  await fonts();
  const s = 'AaČćŽžŠšĐđ0123?|';
  await Promise.all(['700 80px "Playfair Display"', 'italic 700 80px "Playfair Display"', '600 40px "Playfair Display"', 'italic 600 40px "Playfair Display"', '500 40px "Playfair Display"']
    .map(f => document.fonts.load(f, s)));
}

// Shared page wrapper: fonts, crossfade, reveal, dust, grain.
export function shot({ duration, fadeIn = 0, fadeOut = 0, dust = 0, seed = 7, init, frame }) {
  const root = document.getElementById('root');
  let drawDust = null;
  const ready = (async () => {
    await luxFonts();
    const fx = document.getElementById('fx');
    if (fx && dust) drawDust = makeDust(fx, seed, dust);
    const gr = document.getElementById('grain');
    if (gr) grain(gr, seed);
    splitWords(root);
    fitLines(root);
    if (init) await init();
  })();
  window.film = {
    duration, ready,
    frame(t) {
      shotFade(root, t, duration, { fadeIn, fadeOut });
      reveal(root, t);
      if (drawDust) drawDust(t);
      if (frame) frame(t);
    },
  };
}

// Wrap each word of [data-words] text in span.w (elements already marked .w stay whole).
export function splitWords(root) {
  root.querySelectorAll('[data-words]').forEach(g => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(g);
  });
}
