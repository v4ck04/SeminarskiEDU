// Renders the film page (index.html, which exposes window.film = { duration, ready, frame(t) })
// frame by frame with the pre-installed Playwright Chromium and encodes it with ffmpeg.
//
//   node tools/render.mjs video  [--out out/vacko-short.mp4] [--fps 30] [--from 0] [--to 40] [--workers 3]
//   node tools/render.mjs stills --times 0.5,2,4.2 [--dir out/stills] [--scale 0.5]
//   node tools/render.mjs sheet  [--every 1] [--cols 8] [--scale 0.25] [--out out/stills/sheet.png]
//
// The audio track of the video is deliberately silent (AAC, 48 kHz stereo): voice-over and
// music are added later in the edit.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1080, H = 1920;

const args = process.argv.slice(2);
const mode = args[0] || 'video';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const LAUNCH = { args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--disable-gpu-vsync', '--disable-frame-rate-limit'] };

async function openPage(browser, port, scale = 1) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
  page.cdp = await page.context().newCDPSession(page);
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.film && window.film.ready);
  await page.evaluate(() => window.film.ready);
  return page;
}

// CDP capture with fast PNG compression is ~3x quicker than page.screenshot() and still lossless.
async function shoot(page, t) {
  await page.evaluate(async t => { await window.film.frame(t); }, t);
  const { data } = await page.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}

function ffmpeg(argv) {
  const p = spawn('ffmpeg', argv, { stdio: ['pipe', 'inherit', 'pipe'] });
  let err = '';
  p.stderr.on('data', d => { err += d; if (err.length > 20000) err = err.slice(-20000); });
  const done = new Promise((res, rej) => p.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg failed:\n' + err.slice(-3000))))));
  return { p, done };
}

const write = (stream, buf) => new Promise(res => (stream.write(buf) ? res() : stream.once('drain', res)));

// Each worker gets its own browser: pages of one browser share a single compositor, so they would not run in parallel.
async function renderChunk(port, fps, f0, f1, file, label) {
  const browser = await chromium.launch(LAUNCH);
  const page = await openPage(browser, port);
  const enc = ffmpeg(['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(fps), file]);
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await write(enc.p.stdin, await shoot(page, f / fps));
    if ((f - f0) % 60 === 59) {
      const done = f - f0 + 1, rate = done / ((Date.now() - t0) / 1000);
      console.log(`${label}: ${done}/${f1 - f0} frames, ${rate.toFixed(1)} fps, ~${((f1 - f - 1) / rate).toFixed(0)} s left`);
    }
  }
  enc.p.stdin.end();
  await enc.done;
  await browser.close();
}

async function video(browser, port) {
  const fps = +opt('fps', 30);
  const dur = await (async () => { const p = await openPage(browser, port); const d = await p.evaluate(() => window.film.duration); await p.close(); return d; })();
  const from = +opt('from', 0), to = +opt('to', dur);
  const out = path.resolve(ROOT, opt('out', 'out/vacko-short.mp4'));
  const workers = Math.max(1, +opt('workers', 3));
  const F0 = Math.round(from * fps), F1 = Math.round(to * fps), n = F1 - F0;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.chunks-'));
  const chunks = [];
  for (let k = 0; k < workers; k++) {
    const a = F0 + Math.floor((n * k) / workers), b = F0 + Math.floor((n * (k + 1)) / workers);
    if (b > a) chunks.push({ a, b, file: path.join(tmp, `c${k}.mp4`) });
  }
  console.log(`Rendering ${n} frames (${from}–${to} s @ ${fps} fps) with ${chunks.length} workers…`);
  const t0 = Date.now();
  await Promise.all(chunks.map((c, k) => renderChunk(port, fps, c.a, c.b, c.file, `w${k}`)));
  fs.writeFileSync(path.join(tmp, 'list.txt'), chunks.map(c => `file '${c.file}'`).join('\n'));
  const mux = ffmpeg(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(n / fps),
    '-movflags', '+faststart', out]);
  mux.p.stdin.end();
  await mux.done;
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${out}`);
}

async function stills(browser, port) {
  const times = opt('times', '0').split(',').map(Number);
  const dir = path.resolve(ROOT, opt('dir', 'out/stills'));
  const scale = +opt('scale', 0.5);
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage(browser, port, scale);
  for (const t of times) {
    const file = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(file, await shoot(page, t));
    console.log(file);
  }
  await page.close();
}

async function sheet(browser, port) {
  const every = +opt('every', 1), cols = +opt('cols', 8), scale = +opt('scale', 0.25);
  const from = +opt('from', 0);
  const page = await openPage(browser, port, scale);
  const dur = await page.evaluate(() => window.film.duration);
  const to = +opt('to', dur);
  const dir = path.resolve(ROOT, 'out/stills/sheet');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  for (let t = from; t < to - 1e-6; t += every) fs.writeFileSync(path.join(dir, `f${String(i++).padStart(4, '0')}.png`), await shoot(page, t));
  await page.close();
  const out = path.resolve(ROOT, opt('out', 'out/stills/sheet.png'));
  const rows = Math.ceil(i / cols);
  const enc = ffmpeg(['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, 'f%04d.png'),
    '-vf', `tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', out]);
  enc.p.stdin.end();
  await enc.done;
  console.log(out, `(${i} frames, ${from}–${to} s every ${every} s)`);
}

const srv = await serve();
const port = srv.address().port;
const browser = await chromium.launch(LAUNCH);
try {
  if (mode === 'video') await video(browser, port);
  else if (mode === 'stills') await stills(browser, port);
  else if (mode === 'sheet') await sheet(browser, port);
  else throw new Error('unknown mode ' + mode);
} finally {
  await browser.close();
  srv.close();
}
