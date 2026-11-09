// VACKO — "Why Most People Stay Broke" (YouTube Short, 1080x1920, 40 s, silent).
// window.film = { duration, ready, frame(t) } — the renderer seeks every frame by time.
import { el, fontsReady, show, seg, E, clamp } from './kit.js';
import { grain } from './bg.js';
import { markSVG } from './logo.js';
import * as s1 from './s1.js';
import * as s2 from './s2.js';
import * as s3 from './s3.js';
import * as s4 from './s4.js';
import * as s5 from './s5.js';

const DURATION = 40;
const stage = document.getElementById('stage');

const SCENES = [
  { mod: s1, span: s1.S1, theme: 'light' },
  { mod: s2, span: s2.S2, theme: 'dark' },
  { mod: s3, span: s3.S3, theme: 'light' },
  { mod: s4, span: s4.S4, theme: 'light' },
  { mod: s5, span: s5.S5, theme: 'dark' },
];

let built = [];
let paintGrain, bugL, bugD;

async function init() {
  await fontsReady();
  for (const s of SCENES) built.push({ ...s, S: await s.mod.build(stage) });
  // match cut: scene 1 zooms its balance onto the spot where scene 2's big counter sits
  built[0].S.handoff = built[1].S.counterAt;
  // small brand bug (top centre), navy on light sets, white/gold on dark sets
  bugL = el('div', 'bug', stage, `${markSVG({ ring: 'navy', size: 38 })}<span class="wm" style="color:#101827">VACKO</span>`);
  bugD = el('div', 'bug', stage, `${markSVG({ ring: 'gold', size: 38 })}<span class="wm" style="color:#fff">VACKO</span>`);
  paintGrain = grain(stage);
}

function frame(t) {
  let light = 0, dark = 0;
  for (const s of built) {
    const { t0, t1 } = s.span;
    const on = t >= t0 - 1e-6 && t < t1;
    s.S.root.style.display = on ? 'block' : 'none';
    s.S.root.style.visibility = 'visible';
    if (on) {
      s.mod.update(s.S, t);
      if (s.theme === 'light') light = 1; else dark = 1;
    }
  }
  // brand bug: navy version on the light sets, white version on the navy set, swapped during the transitions
  const win = (a, b, fi, fo) => seg(t, a, fi) * (1 - seg(t, b - fo, fo));
  show(bugL, Math.max(win(0.3, 4.2, 0.5, 0.2), win(11.95, 30.9, 0.2, 0.3)) * light);
  show(bugD, win(4.85, 11.92, 0.2, 0.2) * dark * 0.9);
  paintGrain(Math.round(t * 30));
}

window.film = { duration: DURATION, ready: init(), frame };

// Browser preview: index.html?play plays the film in real time, scaled to the window (the renderer never sets this).
if (new URLSearchParams(location.search).has('play')) {
  const fit = () => {
    const s = Math.min(innerWidth / 1080, innerHeight / 1920);
    Object.assign(document.documentElement.style, { width: '100%', height: '100%', background: '#000' });
    Object.assign(document.body.style, { width: '100%', height: '100%', background: '#000' });
    Object.assign(stage.style, { transformOrigin: '0 0', transform: `translate(${(innerWidth - 1080 * s) / 2}px, 0) scale(${s})` });
  };
  addEventListener('resize', fit);
  window.film.ready.then(() => {
    fit();
    const t0 = performance.now();
    const tick = now => { frame(((now - t0) / 1000) % DURATION); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}
