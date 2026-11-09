// usage: node scripts/stills.mjs <Comp> <outPrefix> <frame,frame,...> [scale] [inputPropsJSON]
// Bundles once, renders stills with software WebGL (SwiftShader via ANGLE) in the pre-installed headless shell.
import fs from "node:fs";
import path from "node:path";
const TMP = path.resolve("remotion-tmp");
fs.mkdirSync(TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = TMP;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [comp, prefix, frames, scale = "0.5", props = "{}"] = process.argv.slice(2);
export const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: process.env.GL || "swangle" };
const inputProps = JSON.parse(props);
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const t0 = Date.now();
const serveUrl = process.env.SERVE || await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle", ((Date.now() - t0) / 1000).toFixed(1) + "s", serveUrl);
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 600000 });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t1 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 600000, onBrowserLog });
  console.log("still", f, ((Date.now() - t1) / 1000).toFixed(1) + "s");
}
