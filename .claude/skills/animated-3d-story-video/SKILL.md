---
name: "animated-3d-story-video"
description: "Make a short vertical 3D-world story animation from scratch: generate ideas, write the script, then build the video in the fixed house style and render it directly."
---

# Animated 3D story video (house style)

This skill makes a 40-60 s vertical (9:16) story video in one fixed house style: every location is a real 3D world (painted flat-colour models with ink outlines), 2D cartoon characters stand inside it, and the camera always moves. It is all code (Remotion + three.js), so no image or model files are needed.

The style is already defined below. It is based on the finished video "Chicago lifted itself" (a hotel lifted six feet while guests slept, then a whole city raised out of the mud). New videos must look and feel the same.

## Hard rules
- Never ask the user for reference videos, examples or a style. The style and rulebook are in this file.
- Do the technical work yourself. Ask the user only the questions in the flow below.
- Keep approved things fixed: script, timing, facts, characters, ink colour #351f22.
- Be honest about what was checked (stills versus the full video) and list known problems at the end.
- Render the full video yourself, directly. Never hand over a render.bat or ask the user to render.

## The flow (three steps for the user, everything else automatic)

### Step 1. Ideas (start here, do not ask questions first)
Immediately generate 5 story ideas. If the user gave a topic, use it; otherwise pick true, surprising stories where something physically big changes (a city rises, a river is moved, a ship is carried over land). For each: one-line title, the visual hook (what moves or changes on screen), the escalation (but / then / so), and 2-3 hard numbers or names. Search the web to confirm facts and drop anything single-source or unclear. Ask: "Which one should I write?" (or let them give their own).

### Step 2. Script
Write the script for the chosen idea using the script rules below. Show a short shot table (shot, start time, words, line, on screen) and the voice-over text. Then ask: "Do you want me to make the video from this script?" Make small edits if asked, then ask again.

### Step 3. Make the video and render it
Only after a yes. Get the voice-over: the user's file if they have one; otherwise generate it with a connected text-to-speech tool if available; otherwise build on estimated timing (3.35 words per second) and say cuts must be re-timed once audio exists. Then build everything without stopping (stages A-F), then render it yourself straight away (see Render).

## Script rules (built-in rulebook)
- First word at t=0, no intro, premise in the first sentence. Hook 5-23 words (aim 16), ends at about 4-5 s.
- 9-12 shots, one location per shot, about 140-150 words for about 43-48 s (3.35 words per second, range 3.05-3.65). Total 39-65 s.
- Beats: But (shot 4), Then (shot 5), the complaint or conflict (shot 6), a pivot "You see" at 53-87% of the runtime (shot 7), "So..." consequence at 80-93% (shot 9), closing line 5-19 words (about 9). No outro, no call to action.
- Simple words, one idea per sentence, concrete numbers and names. Every claim has a source; leave out single-source or unverifiable details.
- Output: `script.md` (shot table, rulebook check, fact map, left out on purpose, wording to watch) and a voice-over script PDF: "Chapter N - Title (start time)" followed by one paragraph, 2-3 chapters for a short video.

## Build stages (automatic)

### A. Timing
Transcribe the voice-over with timestamps into `sentence_times.json` (starts and ends per sentence). Shot cuts come from real sentence ends, collected in one `CUTS` array; if a shot holds two sentences keep both times.

### B. Art style (fixed)
- One ink colour for every outline: #351f22.
- Models built in code with real depth: extruded walls with window reveals and sills, door panels, awnings, cornices, chimneys, threaded jackscrews, timber crib stacks, brick vaults. Textures are painted flat colours with wear (stains, chips, scratches) drawn on a canvas. Outline = inverted hull plus edge lines.
- Toon shading with a 3-band gradient. One warm key light from the upper left with shadows, a hemisphere fill, a light vignette, fog colour per location.
- Depth: blurred foreground object near the lens, sharp midground with characters, softly blurred background (depth-of-field pass focused at the look-at distance).
- Labels live inside the world (painted signs, a banner on two poles, names on crates, a map title, a desk nameplate). Never floating pills or captions.
- No flat sky or ground strips, no side-on cardboard buildings.
- Cuts: a 0.4 s dip to cream at location changes; continuous camera moves where one shot flows into the next.

### C. Characters (2D flat people in the 3D world)
- Built in code from flat shapes: large round pale head, calm half-lidded eyes, tiny smile, hair fringe, white collar, tie, small pear-shaped two-tone torso with a pocket patch, thin tapered stick limbs, dark disc hands. Hand-drawn ink band with varying, slightly wobbly thickness around every shape.
- Variants by palette, hat (top hat, bowler, cap, none) and glasses only. Never redesign the base character.
- Flat shading. Idle bob and nod, arm sway. Turn toward the camera with limited yaw (clamp about 0.7 rad) so they are never edge-on. Soft contact-shadow blob on the ground.
- Size: body 40-60% of frame height in medium shots, 70%+ in close shots. Three people side by side need the camera about 4 m away.

### D. 3D worlds
- Put every location in one scene at different x offsets (for example 0, 40, 80, 120, 200, 300, 400) so the camera can travel and light can switch per location.
- Build shared helpers once: facade (extruded wall with window and door openings and an interior backdrop), liftable building (facade + needle beams + jackscrews + timber stacks + a brick foundation under it), lamp post, barrel, plank sidewalk, mud ground, brick tunnel, room.
- Procedural models only (the cloud workspace cannot download assets).
- A door opening must be a notch in the outline, not a hole touching the bottom edge, or triangulation breaks.
- If a starter project is attached or present in the folder (files such as kit.js, char3.js, world1.js, areas.js, Full.jsx), copy and adapt it. Otherwise build the kit from this spec.

### E. Camera plan and animation
- Write `camera_plan.md`: per shot, the time, location, camera path (start -> end), speed, foreground / midground / background objects and in-world labels.
- Rules: net travel in every shot; about 10% of frame width per second on average (25-40% travel or push per shot); mix of push (about half), crane (a third), sideways track (a fifth); carry the camera from one subject to the next inside a location; dissolve between locations.
- Geometry for an 80 degree vertical field of view at 9:16: frame width at the subject = 0.93 x distance, frame height = 1.68 x distance.
- Sync to the words: for each camera key set a beat time from the sentence timing (word positions by proportion) so the camera reaches each subject as it is named. Smooth with a monotone cubic time warp, zero speed at first and last key (ease in, ease out), no straight-line blending, almost no wobble:
```js
function warpU(T, t) { // T = beat times per path key; returns path position 0..1
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n-1]) return 1;
  const sec = []; for (let i = 0; i < n-1; i++) sec.push((1/(n-1)) / (T[i+1]-T[i]));
  const m = [0]; for (let i = 1; i < n-1; i++) m.push(2*sec[i-1]*sec[i]/(sec[i-1]+sec[i])); m.push(0);
  let i = 0; while (t > T[i+1]) i++;
  const h = T[i+1]-T[i], x = (t-T[i])/h, x2 = x*x, x3 = x2*x;
  return (2*x3-3*x2+1)*(i/(n-1)) + (x3-2*x2+x)*h*m[i] + (-2*x3+3*x2)*((i+1)/(n-1)) + (x3-x2)*h*m[i+1];
}
```
- Tie on-screen events to words: a label appears on its number word, a street rises on "raised", water pools on "couldn't drain", an arrow is drawn on "go up".
- Keep the camera clear of characters and props; end every move at rest.
- Drive all animation from the frame number (`useCurrentFrame`), never wall-clock time. Render the 3D scene in a `ThreeCanvas`, with the post-processing composer in a `useFrame` at priority 1.

### F. Check it (stills)
Render single frames at the beat times at half scale (`npx remotion still ... --scale=0.5 --gl=swangle --browser-executable=<preinstalled chromium>`; about 90 s each in the cloud, one at a time, never edit source while one renders). Tile into a contact sheet and look for: objects hiding a name, face or label; characters cropped at the frame edge; props behind heads; poles or lamps crossing the subject; anything passing through the lens; black polygons or empty openings; camera inside a wall; wrong fact on screen. Fix by moving objects out of the camera's line of sight; repeat until clean.

## Render (do it yourself, directly)
As soon as the stills are clean, start the full render yourself. Do not make a render.bat and do not ask the user to render.
1. Run `npm install` once if `node_modules` is missing.
   Output resolution is **1080x1920 (1080p vertical)**: set `width={1080} height={1920}` on the composition in `src/index.jsx` before rendering.
2. Render the silent video in the background: `npx remotion render src/index.jsx <Id> out/full_silent.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17`.
3. Add the voice-over: `npx remotion ffmpeg -y -i out/full_silent.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4`.
4. If the render fails or is very slow, say so plainly and fix the cause; do not fall back to handing over a .bat file.

## After rendering
Check the real video: `ffprobe` for size (must be 1080x1920), fps, duration and audio, and one frame per shot in a contact sheet. Deliver the mp4 and the voice-over script PDF. Say what was checked, what is still wrong, and offer one next step.

## Known limits
Models are procedural, not imported. Resolution 1080x1920 (1080p). Ground-floor openings of lifted facades once rendered as black patches (cause not found); report it if it appears.