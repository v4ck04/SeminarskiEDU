// usage: node scripts/bundle.mjs <outDir>   (a fixed bundle, so long renders are not affected by later source edits)
import path from "node:path";
import fs from "node:fs";
const TMP = path.resolve("remotion-tmp");
fs.mkdirSync(TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = TMP;
const { bundle } = await import("@remotion/bundler");
const out = path.resolve(process.argv[2]);
fs.rmSync(out, { recursive: true, force: true });
const url = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public"), outDir: out });
console.log("bundle", url);
