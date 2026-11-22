// Joins the two renders into the finished video:
//   ../finance-short/out/tenk/2d.mp4  (Tenk2D: the whole timeline; frames of 3D beats are black)
//   ../finance-short/out/tenk/3d.mp4  (Tenk3D: the 3D beats laid end to end)
// cuts each 3D beat into the 2D timeline at its place, adds audio/mix.m4a and writes 10k-to-1m.mp4.
// usage (from tenk-long/):  node assemble.mjs        (uses Remotion's own ffmpeg; set FFMPEG=ffmpeg to use another)
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const T = JSON.parse(fs.readFileSync("../finance-short/src/videos/tenk/timing.json", "utf8"));
const END_HOLD = 240, total = T.total + END_HOLD;
const D2 = "../finance-short/out/tenk/2d.mp4", D3 = "../finance-short/out/tenk/3d.mp4", OUT = "10k-to-1m.mp4";
for (const f of [D2, D3, "audio/mix.m4a"]) if (!fs.existsSync(f)) { console.error("missing " + f); process.exit(1); }
// segments of the global timeline: ["2d", a, b] or ["3d", a, b, local start in 3d.mp4]
const segs = []; let pos = 0, acc = 0;
for (const b of T.beats) if (b.mode === "3d") {
  if (pos === 0 && b.f0 > 0) segs.push(["hold", 0, b.f0]);   // the voice's lead-in: hold the first 3D frame
  else if (b.f0 > pos) segs.push(["2d", pos, b.f0]);
  segs.push(["3d", b.f0, b.f1, acc]); acc += b.f1 - b.f0; pos = b.f1;
}
if (pos < total) segs.push(["2d", pos, total]);
const n2 = segs.filter((s) => s[0] === "2d").length, n3 = segs.length - n2;
const fc = [`[0:v]split=${n2}${Array.from({ length: n2 }, (_, i) => `[a${i}]`).join("")}`, `[1:v]split=${n3}${Array.from({ length: n3 }, (_, i) => `[b${i}]`).join("")}`];
let i2 = 0, i3 = 0;
segs.forEach((s, k) => {
  if (s[0] === "2d") fc.push(`[a${i2++}]trim=start_frame=${s[1]}:end_frame=${s[2]},setpts=PTS-STARTPTS[v${k}]`);
  else if (s[0] === "hold") fc.push(`[b${i3++}]trim=start_frame=0:end_frame=1,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop=${s[2] - 1}[v${k}]`);
  else fc.push(`[b${i3++}]trim=start_frame=${s[3]}:end_frame=${s[3] + s[2] - s[1]},setpts=PTS-STARTPTS[v${k}]`);
});
fc.push(segs.map((_, k) => `[v${k}]`).join("") + `concat=n=${segs.length}:v=1:a=0,fps=30,format=yuv420p[out]`);
const args = ["-y", "-i", D2, "-i", D3, "-i", "audio/mix.m4a", "-filter_complex", fc.join(";"), "-map", "[out]", "-map", "2:a:0",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", "-t", (total / 30).toFixed(3), OUT];
const cmd = process.env.FFMPEG ? [process.env.FFMPEG, args] : ["npx", ["remotion", "ffmpeg", ...args]];
console.log(`joining ${segs.length} pieces (${n3} 3D shots), ${(total / 30).toFixed(1)} s ...`);
const r = spawnSync(cmd[0], cmd[1], { stdio: "inherit", shell: process.platform === "win32" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log("wrote " + OUT);
