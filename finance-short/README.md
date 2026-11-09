# What Goes Up — Newton and the South Sea Bubble

A ~64 s vertical animated short (1080x1920, 30 fps) for a YouTube finance channel, made with the `cartoon-3d-short`
skill (`.claude/skills/cartoon-3d-short`): flat 2D characters in a painted three.js world, rendered in Remotion.

- `SCRIPT.md` — facts with sources, the voice-over script, a Serbian translation, title and description.
- `voice/` — `voice.wav` (Kokoro TTS, voice `am_fenrir`, speed 1.22) and `words.json` (word timings from faster-whisper).
- `src/videos/newton/` — the film: `story.ts` (shots, cameras, lens, bubble), `world.ts` (London, the Tower, the Mint,
  the bubble), `cast.ts` (who is where in every shot), `toon.ts` (character and effect drawings), post chain unchanged
  from the template.
- `audio/soundtrack.py` — original score + synthesized SFX + mix (-14 LUFS, <= -1 dBTP) -> `audio/mix.wav`, `audio/cues.md`.
- `tools/` — `tts.py` (voice), `align.py` (word timings), `sheet.py` (contact sheets).

## Run
```
npm install
node scripts/preview.mjs out/pv 60,430,1005     # look checks: story frames as JPEGs
node scripts/render.mjs NewtonShort out/final/partA.mp4 0 643 1 1   # render in parts (software WebGL, ~4 s/frame)
python audio/soundtrack.py                      # numpy + scipy
scripts/finalize.sh                             # join parts, mux the mix, -> out/final/newton-south-sea-bubble.mp4
python scripts/short_qa.py out/final/newton-south-sea-bubble.mp4 out/qa shots.json
```
Renders use the pre-installed Chromium headless shell with software WebGL (`gl: swangle`); no GPU needed.
The Kenney prop kit is optional (trees and bushes are drawn procedurally; other missing props are left out).
