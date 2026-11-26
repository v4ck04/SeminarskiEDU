// usage: node scripts/cards.mjs <outDir>  -> one transparent PNG per character card of the secretary film (SecCard)
import fs from "node:fs";
import path from "node:path";
const TMP = path.resolve("remotion-tmp"); fs.mkdirSync(TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = TMP;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const src = fs.readFileSync("src/videos/secretary/Cards.tsx", "utf8");
const names = [...src.matchAll(/^  (\w+): C\(/gm)].map((m) => m[1]);
for (const card of names) {
  const composition = await selectComposition({ serveUrl, id: "SecCard", browserExecutable, inputProps: { card } });
  await renderStill({ composition, serveUrl, frame: 0, output: path.join(out, card + ".png"), imageFormat: "png", browserExecutable, inputProps: { card } });
  console.log(card);
}
