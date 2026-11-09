// Backdrops: the light "studio wall" (window light + blinds, faint grid) and the dark navy set, plus film grain.
import { rng, el } from './kit.js';

export const BG_PAD_X = 90, BG_PAD_Y = 160;           // backdrops are larger than the frame so cameras can drift
const BW = 1080 + BG_PAD_X * 2, BH = 1920 + BG_PAD_Y * 2;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function grid(g, color, step = 90) {
  g.save();
  g.strokeStyle = color; g.lineWidth = 1.5;
  g.beginPath();
  for (let x = (BG_PAD_X % step) + 0.5; x < BW; x += step) { g.moveTo(x, 0); g.lineTo(x, BH); }
  for (let y = (BG_PAD_Y % step) + 30.5; y < BH; y += step) { g.moveTo(0, y); g.lineTo(BW, y); }
  g.stroke();
  // fade the grid out towards the edges
  g.globalCompositeOperation = 'destination-out';
  const m = g.createRadialGradient(BW / 2, BH * 0.42, 200, BW / 2, BH * 0.45, BH * 0.62);
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = m; g.fillRect(0, 0, BW, BH);
  g.restore();
}

// Light studio wall. `shafts` adds the window-light streaks; `palm` adds soft leaf shadows in the corners.
export function lightWall({ palm = false, seed = 3 } = {}) {
  const wall = canvas(BW, BH), g = wall.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, BH);
  gr.addColorStop(0, '#E9EDF2'); gr.addColorStop(0.45, '#E2E7EE'); gr.addColorStop(1, '#C9D0DA');
  g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
  gr = g.createRadialGradient(BW * 0.56, BH * 0.36, 40, BW * 0.56, BH * 0.38, BH * 0.62);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
  grid(g, 'rgba(16,24,39,0.075)');

  if (palm) {
    // soft palm-leaf shadows in two corners (drawn on a layer, then blurred onto the wall)
    const r = rng(seed);
    const tmp = canvas(BW, BH), tg = tmp.getContext('2d');
    const leaf = (x0, y0, ang, len, sc) => {
      tg.save(); tg.translate(x0, y0); tg.rotate(ang); tg.scale(sc, sc);
      tg.strokeStyle = '#101827'; tg.lineCap = 'round';
      tg.lineWidth = 7; tg.beginPath(); tg.moveTo(0, 0); tg.quadraticCurveTo(len * 0.5, -len * 0.08, len, len * 0.06); tg.stroke();
      for (let i = 0; i < 26; i++) {
        const u = 0.08 + i * 0.034, px = len * u, py = -len * 0.08 * Math.sin(u * Math.PI) + len * 0.06 * u * u;
        for (const side of [-1, 1]) {
          const l = len * (0.36 - 0.26 * u) * (0.85 + r() * 0.3);
          tg.lineWidth = 16 * (1 - u * 0.6);
          tg.beginPath(); tg.moveTo(px, py);
          tg.quadraticCurveTo(px + l * 0.45, py + side * l * 0.35, px + l * 0.75, py + side * l * 0.95);
          tg.stroke();
        }
      }
      tg.restore();
    };
    leaf(-60, 330, 0.55, 520, 1);
    leaf(-40, 560, 0.15, 470, 0.9);
    leaf(BW + 40, BH - 420, Math.PI + 0.45, 560, 1);
    leaf(BW + 30, BH - 160, Math.PI + 0.05, 480, 0.85);
    g.save(); g.filter = 'blur(7px)'; g.globalAlpha = 0.16; g.drawImage(tmp, 0, 0); g.restore();
  }

  // vignette
  gr = g.createRadialGradient(BW / 2, BH * 0.42, BH * 0.25, BW / 2, BH * 0.5, BH * 0.78);
  gr.addColorStop(0, 'rgba(16,24,39,0)'); gr.addColorStop(1, 'rgba(16,24,39,0.30)');
  g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
  return wall;
}

// Window light: diagonal streaks with blind slats, drawn on its own layer so it can drift slowly.
export function windowLight() {
  const c = canvas(BW, BH), g = c.getContext('2d');
  const tmp = canvas(BW, BH), t = tmp.getContext('2d');
  t.save();
  t.translate(BW * 0.66, BH * 0.26);
  t.rotate(-0.55);
  // broad soft streaks; the first one carries a faint blind-slat pattern
  const streak = (x, w, h, a) => { t.fillStyle = `rgba(255,255,255,${a})`; t.fillRect(x, -h / 2, w, h); };
  streak(-560, 330, 1700, 0.30);
  streak(-150, 170, 1700, 0.26);
  streak(120, 90, 1700, 0.22);
  t.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++) { t.fillStyle = 'rgba(0,0,0,0.55)'; t.fillRect(-600, -850 + i * 190 + 120, 420, 46); }
  t.restore();
  g.filter = 'blur(16px)';
  g.drawImage(tmp, 0, 0);
  g.filter = 'blur(70px)';
  g.globalAlpha = 0.9;
  g.drawImage(tmp, 0, 0);
  g.filter = 'none'; g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-out';
  const m = g.createLinearGradient(0, BH * 0.2, 0, BH * 0.9);
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,0.9)');
  g.fillStyle = m; g.fillRect(0, 0, BW, BH);
  return c;
}

export function navyWall() {
  const wall = canvas(BW, BH), g = wall.getContext('2d');
  let gr = g.createRadialGradient(BW / 2, BH * 0.40, 30, BW / 2, BH * 0.44, BH * 0.72);
  gr.addColorStop(0, '#1E2D4A'); gr.addColorStop(0.42, '#121C2F'); gr.addColorStop(0.75, '#0C1322'); gr.addColorStop(1, '#070B14');
  g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
  grid(g, 'rgba(255,255,255,0.045)');
  // soft top light cone
  g.save();
  g.filter = 'blur(70px)';
  g.fillStyle = 'rgba(160,190,255,0.07)';
  g.beginPath(); g.moveTo(BW / 2 - 140, -50); g.lineTo(BW / 2 + 140, -50); g.lineTo(BW / 2 + 520, BH * 0.75); g.lineTo(BW / 2 - 520, BH * 0.75); g.closePath(); g.fill();
  g.restore();
  gr = g.createRadialGradient(BW / 2, BH * 0.45, BH * 0.3, BW / 2, BH * 0.5, BH * 0.8);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
  return wall;
}

// Mount a backdrop canvas into a scene; returns a function to move it (parallax).
export function mountBackdrop(parent, source, cls = 'bd') {
  const c = el('canvas', cls, parent);
  c.width = source.width; c.height = source.height;
  c.getContext('2d').drawImage(source, 0, 0);
  c.style.left = -BG_PAD_X + 'px'; c.style.top = -BG_PAD_Y + 'px';
  return (dx = 0, dy = 0, s = 1) => { c.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`; };
}

// Film grain: a handful of pre-baked noise tiles, picked per frame.
export function grain(parent) {
  const c = el('canvas', 'grain', parent);
  c.width = 540; c.height = 960;             // drawn at half res and scaled up: softer, film-like grain
  const g = c.getContext('2d');
  const tiles = [];
  const r = rng(77);
  for (let k = 0; k < 8; k++) {
    const tc = canvas(256, 256), tg = tc.getContext('2d');
    const im = tg.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    tg.putImageData(im, 0, 0);
    tiles.push(g.createPattern(tc, 'repeat'));
  }
  return (frame) => {
    const k = ((frame % 8) + 8) % 8;
    g.save();
    g.translate(-((frame * 37) % 256), -((frame * 91) % 256));
    g.fillStyle = tiles[k];
    g.fillRect(0, 0, 540 + 256, 960 + 256);
    g.restore();
  };
}
