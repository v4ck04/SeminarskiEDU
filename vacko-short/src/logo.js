// VACKO mark: a coin ring with a "V" that is also a check mark and a rising arrow breaking out of the ring.
let n = 0;

// Geometry shared with the coin assembly in scene 5 (viewBox 0 0 200 200).
export const MARK = {
  c: [100, 100], r: 82,
  ringFrom: -22, ringTo: 302,           // degrees, clockwise; the gap lets the arrow break out
  v: [[50, 96], [86, 136], [164, 46]],   // left arm start, bottom of the V, arrow tip
  chevron: [[134.9, 53.3], [164, 46], [160.9, 75.9]],
};

export function markSVG({ ring = 'gold', size = 200, cls = '', draw = false } = {}) {
  const k = `mk${++n}`;
  const ringStroke = ring === 'navy' ? '#101827' : `url(#rg${k})`;
  const [a, b, c] = MARK.v, [h1, , h2] = MARK.chevron;
  const p = (deg) => [MARK.c[0] + MARK.r * Math.cos(deg * Math.PI / 180), MARK.c[1] + MARK.r * Math.sin(deg * Math.PI / 180)];
  const [sx, sy] = p(MARK.ringFrom), [ex, ey] = p(MARK.ringTo);
  const pl = draw ? ' pathLength="1"' : '';
  return `<svg class="mark ${cls}" viewBox="0 0 200 200" width="${size}" height="${size}">
  <defs>
    <linearGradient id="rg${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A6"/><stop offset=".45" stop-color="#F5C451"/><stop offset="1" stop-color="#C8902A"/></linearGradient>
    <linearGradient id="vg${k}" gradientUnits="userSpaceOnUse" x1="50" y1="136" x2="164" y2="46"><stop offset="0" stop-color="#16C784"/><stop offset=".55" stop-color="#16C784"/><stop offset="1" stop-color="#7BE8B9"/></linearGradient>
  </defs>
  <path class="m-ring"${pl} d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${MARK.r} ${MARK.r} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${ringStroke}" stroke-width="12" stroke-linecap="round"/>
  <path class="m-v"${pl} d="M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]}" fill="none" stroke="url(#vg${k})" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
  <path class="m-ch"${pl} d="M${h1[0]} ${h1[1]} L${c[0]} ${c[1]} L${h2[0]} ${h2[1]}" fill="none" stroke="url(#vg${k})" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}
