// Kinetic-typography motion kit (light grid style). Every picture depends only on t.
export * from './kit.js';
import { seg, E, clamp, fonts, rng } from './kit.js';

export const STAR = (id = 's', a = '#2A43A8', b = '#D4AF6A') => `<svg viewBox="-100 -100 200 200"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path d="M0 -96 C10 -26 26 -10 96 0 C26 10 10 26 0 96 C-10 26 -26 10 -96 0 C-26 -10 -10 -26 0 -96Z" fill="url(#${id})"/></svg>`;

export function splitWords(root) {
  root.querySelectorAll('[data-words]').forEach(g => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w') && !n.classList.contains('ln')) { n.classList.add('w'); }
        else if (n.nodeType === 1 && n.classList.contains('ln')) walk(n);
      });
    };
    walk(g);
  });
}

export function fitLines(root, max = 900) {
  root.querySelectorAll('.ln').forEach(ln => {
    let fs = parseFloat(getComputedStyle(ln).fontSize);
    const w = () => { const r = document.createRange(); r.selectNodeContents(ln); return r.getBoundingClientRect().width; };
    const lim = +(ln.closest('[data-max]')?.dataset.max || max);
    while (w() > lim && fs > 28) { fs -= 2; ln.style.fontSize = fs + 'px'; }
  });
}

// declarative motion
export function run(root, t) {
  root.querySelectorAll('[data-words]').forEach(g => {
    const at = +g.dataset.words, st = +(g.dataset.stagger || 0.13), d = +(g.dataset.dur || 0.42);
    g.querySelectorAll('.w').forEach((w, i) => {
      const wat = w.dataset.at !== undefined ? +w.dataset.at : at + i * st;
      const p = seg(t, wat, d), e = E.outCubic(p);
      w.style.opacity = clamp(p * 1.7);
      w.style.filter = p < 1 ? `blur(${(1 - e) * 16}px)` : '';
      w.style.transform = `translateY(${(1 - e) * 26}px) scale(${1.14 - 0.14 * e})`;
    });
  });
  root.querySelectorAll('[data-pop]').forEach(el => {
    const p = seg(t, +el.dataset.pop, +(el.dataset.dur || 0.5)), e = E.outBack(p);
    el.style.opacity = clamp(p * 3);
    el.style.transform = `${el.dataset.base || ''} scale(${Math.max(0, e)})`;
  });
  root.querySelectorAll('[data-in]').forEach(el => {
    const p = seg(t, +el.dataset.in, +(el.dataset.dur || 0.45)), e = E.outCubic(p);
    el.style.opacity = clamp(p * 1.6);
    el.style.filter = p < 1 ? `blur(${(1 - e) * 12}px)` : '';
    el.style.transform = `${el.dataset.base || ''} translate(${(1 - e) * +(el.dataset.dx || 0)}px, ${(1 - e) * +(el.dataset.dy || 30)}px)`;
  });
  root.querySelectorAll('[data-count]').forEach(el => {
    const [a, b, at, d] = el.dataset.count.split(',').map(Number);
    const v = Math.round(a + (b - a) * E.outCubic(seg(t, at, d)));
    el.textContent = el.dataset.thousands ? v.toLocaleString('de-DE') : String(v);
  });
  root.querySelectorAll('.lens').forEach(el => el.style.setProperty('--rot', `${t * 14}deg`));
  root.querySelectorAll('[data-float]').forEach(el => {
    const [ph, amp, rot] = el.dataset.float.split(',').map(Number);
    const p = el.dataset.pop !== undefined ? '' : '';
    el.style.translate = `${Math.sin(t * 0.9 + ph) * amp}px ${Math.cos(t * 0.7 + ph) * amp}px`;
    el.style.rotate = `${rot + t * 9 * (ph > 3 ? -1 : 1)}deg`;
  });
}

export function grain(canvas, seed = 3) {
  canvas.width = 540; canvas.height = 960;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(540, 960), r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}

// whip transitions: content slides in from below with blur, leaves upward with blur
export function whip(el, t, duration, enter = 0.22, exit = 0.22) {
  let y = 0, b = 0, o = 1;
  if (enter && t < enter) { const p = E.outCubic(seg(t, 0, enter)); y = (1 - p) * 220; b = (1 - p) * 18; }
  if (exit && t > duration - exit) { const p = E.inCubic(seg(t, duration - exit, exit)); y = -p * 260; b = p * 22; o = 1 - p * 0.9; }
  el.style.transform = `translateY(${y}px)`; el.style.filter = b > 0.05 ? `blur(${b}px)` : ''; el.style.opacity = o;
}

export function shot({ duration, enter = 0.22, exit = 0.22, init, frame }) {
  const root = document.getElementById('root'), content = document.getElementById('content');
  const ready = (async () => {
    await fonts();
    await Promise.all(['400 100px Anton', 'italic 600 80px "Playfair Display"', '900 80px Montserrat', '800 80px Montserrat'].map(f => document.fonts.load(f, 'AaČćŽžŠšĐđ0123')));
    splitWords(root); fitLines(root);
    const g = document.getElementById('grain'); if (g) grain(g);
    if (init) await init();
  })();
  window.film = { duration, ready, frame(t) { whip(content, t, duration, enter, exit); run(root, t); if (frame) frame(t); } };
}
