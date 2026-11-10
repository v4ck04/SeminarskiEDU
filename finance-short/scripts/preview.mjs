// usage: node scripts/preview.mjs <outDir> <frame,frame,...> [postJSON]
// Renders story frames as JPEGs through the NewtonPreview composition: one page, one World, frames rendered in turn.
import fs from "node:fs";
import path from "node:path";
const TMP = path.resolve("remotion-tmp");
fs.mkdirSync(TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = TMP;
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [outDir, list, post = "{}"] = process.argv.slice(2);
const frames = list.split(",").map(Number);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: process.env.GL || "swangle" };
const inputProps = { frames, post: JSON.parse(post) };
fs.mkdirSync(outDir, { recursive: true });
const t0 = Date.now();
const serveUrl = process.env.SERVE || await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "NewtonPreview", browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 900000 });
await renderFrames({ composition, serveUrl, outputDir: outDir, imageFormat: "jpeg", jpegQuality: 85, inputProps, browserExecutable, chromiumOptions,
  concurrency: 1, timeoutInMilliseconds: 900000, scale: Number(process.env.SCALE || 0.5),
  onBrowserLog: (l) => { if (l.type === "error") console.log("[err]", l.text.slice(0, 400)); },
  onFrameUpdate: (n) => console.log("frame", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"), onStart: () => {} });
// rename element-N.jpeg -> f<story frame>.jpg
for (const fn of fs.readdirSync(outDir)) {
  const m = fn.match(/element-(\d+)\.jpe?g$/);
  if (m) fs.renameSync(path.join(outDir, fn), path.join(outDir, `f${String(frames[Number(m[1])]).padStart(4, "0")}.jpg`));
}
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
