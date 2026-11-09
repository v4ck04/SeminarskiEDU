// Kinetic headlines: small lead-in words + one big keyword line, word-by-word entrances (reference style).
import { el, seg, E, clamp, lerp } from './kit.js';

// lines: [{ size, cls, max, mt, words: ['WHY', { t: 'BROKE', cls: 'k3d', at: 0.8, style: 'slam', marker, shine }] }]
export function headline(parent, { top, lines, maxW = 940, cls = '' }) {
  const box = el('div', 'hl ' + cls, parent);
  box.style.top = top + 'px';
  const words = [], lineEls = [];
  lines.forEach((L, li) => {
    const ln = el('div', 'ln ' + (L.cls || ''), box);
    const lc = el('span', 'lc', ln);
    ln.style.fontSize = L.size + 'px';
    if (L.mt !== undefined) ln.style.marginTop = L.mt + 'px';
    lc.dataset.max = L.max || maxW;
    if (L.marker) { lc.classList.add('has-mk'); lc._mk = el('span', 'mk ' + L.marker, lc); lc._mkAt = L.marker_at; }
    L.words.forEach((w, wi) => {
      const o = typeof w === 'string' ? { t: w } : { ...w };
      const s = el('span', 'w ' + (o.cls || ''), lc);
      if (wi) lc.insertBefore(document.createTextNode(' '), s);
      if (o.marker) { o.mk = el('span', 'mk ' + o.marker, s); }
      o.fc = el('span', 'fc', s, o.t);
      if (o.shine) o.sh = el('span', 'sh', s, o.t);
      if (o.under) {
        o.ul = el('span', 'ul', s, `<svg viewBox="0 0 300 40" preserveAspectRatio="none"><path pathLength="1" d="M6 26 C 70 14, 150 12, 230 16 S 290 24, 294 20" /></svg>`);
        o.ulPath = o.ul.querySelector('path');
      }
      o.el = s; o.line = li;
      words.push(o);
    });
    lineEls.push(lc);
  });
  return { box, words, lines: lineEls };
}


// Shrink lines that are wider than their max width (measured untransformed).
export function fitLines(h) {
  h.lines.forEach(lc => {
    const ln = lc.parentElement, max = +lc.dataset.max;
    let fs = parseFloat(ln.style.fontSize);
    while (lc.offsetWidth > max && fs > 20) { fs -= 1; ln.style.fontSize = fs + 'px'; }
  });
}

const STYLES = {
  rise: { dur: 0.55, f(p) { const e = E.outExpo(p); return { o: clamp(p * 3), y: (1 - e) * 54, s: 0.94 + 0.06 * e, b: (1 - E.outCubic(p)) * 14 }; } },
  slam: { dur: 0.42, f(p) { const e = E.outBack(p); return { o: clamp(p * 4), y: 0, s: 1.9 - 0.9 * e, b: (1 - E.outQuad(p)) * 22 }; } },
  drop: { dur: 0.5, f(p) { const e = E.outBack(p); return { o: clamp(p * 3), y: (e - 1) * 70, s: 1, b: (1 - E.outCubic(p)) * 10 }; } },
  zoom: { dur: 0.6, f(p) { const e = E.outExpo(p); return { o: clamp(p * 2.5), y: 0, s: 0.6 + 0.4 * e, b: (1 - e) * 18 }; } },
};

// Animate all words of a headline at time t (scene-local). `out` = time the whole headline leaves.
export function animHeadline(h, t, { out = 1e9, outDur = 0.38, outStagger = 0.035, outY = -40 } = {}) {
  h.words.forEach((w, i) => {
    const st = STYLES[w.style || 'rise'];
    const p = seg(t, w.at ?? 0, w.dur ?? st.dur);
    let { o, y, s, b } = st.f(p);
    if (t >= out) {
      const q = E.inCubic(seg(t, out + i * outStagger, outDur));
      o *= 1 - q; y += outY * q; b += 12 * q;
    }
    w.el.style.opacity = o;
    w.el.style.visibility = o <= 0.001 ? 'hidden' : 'inherit';
    w.el.style.transform = `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
    w.el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    if (w.mk) {
      const m = E.outQuart(seg(t, w.marker_at ?? (w.at ?? 0) + 0.35, 0.45));
      w.mk.style.transform = `skewX(-8deg) scaleX(${m})`;
    }
    if (w.sh) {
      const q = seg(t, w.shine, 0.9);
      w.sh.style.backgroundPosition = `${lerp(130, -30, E.inOutCubic(q))}% 0`;
      w.sh.style.opacity = q > 0 && q < 1 ? 1 : 0;
    }
    if (w.ulPath) w.ulPath.style.strokeDashoffset = 1 - E.outCubic(seg(t, w.under, 0.45));
  });
  h.lines.forEach(lc => {
    if (!lc._mk) return;
    let m = E.outQuart(seg(t, lc._mkAt, 0.45));
    if (t >= out) m *= 1 - E.inCubic(seg(t, out, outDur));
    lc._mk.style.transform = `skewX(-8deg) scaleX(${m})`;
  });
}
