// usage: node scripts/render.mjs <Comp> <out.mp4> <from> <to> [scale] [concurrency] [inputPropsJSON]
import fs from "node:fs";
import path from "node:path";
const TMP = path.resolve("remotion-tmp");
fs.mkdirSync(TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = TMP;
const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");
const [comp, out, from, to, scale = "1", conc = "1", props = "{}"] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: process.env.GL || "swangle" };
const inputProps = JSON.parse(props);
fs.mkdirSync(path.dirname(out), { recursive: true });
const serveUrl = process.env.SERVE || await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 600000 });
const t0 = Date.now(); let last = 0;
await renderMedia({ composition, serveUrl, codec: "h264", crf: Number(process.env.CRF || 16), outputLocation: out, frameRange: [Number(from), Number(to)],
  scale: Number(scale), concurrency: Number(conc), browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 900000, muted: true,
  imageFormat: "jpeg", jpegQuality: 92,
  onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 10) { last = renderedFrames; console.log("frames", renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
console.log("done", out, ((Date.now() - t0) / 1000).toFixed(1) + "s");
