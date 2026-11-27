// ENGINE tool: render single frames (every N frames) without a full video render, then tile them into contact sheets.
// usage: VIDEO=<id> node src/engine/tools/stills.mjs <outdir> [step=15] [from=0] [to=end] [scale=0.5]
//   (set BROWSER=/path/to/chrome-headless-shell if Remotion cannot download its own browser)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const [out = 'out/stills', step = '15', from = '0', to, scale = '0.5'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const v = process.env.VIDEO || '01_example';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => ({...c, resolve: {...c.resolve, alias: {...(c.resolve?.alias ?? {}), '@story': path.resolve('src/videos', v)}}})});
const browser = await openBrowser('chrome', {browserExecutable: process.env.BROWSER ?? null, chromiumOptions: {gl: 'swangle'}});
const comp = await selectComposition({serveUrl, id: 'Video', puppeteerInstance: browser});
const end = to ? +to : comp.durationInFrames - 1;
for (let f = +from; f <= end; f += +step) {
  const t = Date.now();
  await renderStill({composition: comp, serveUrl, output: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), frame: f, imageFormat: 'jpeg', jpegQuality: 80, scale: +scale, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
  console.log('frame', f, Date.now() - t, 'ms');
}
await browser.close({silent: true});
