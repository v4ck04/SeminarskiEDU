# Voicemail From Tomorrow: build notes

Built from `PRODUCTION.md` (the full 15-part package) with the cartoon-3d-short pipeline. The user asked for: a better
2D character, many more scenes and camera moves, a more detailed background with more lights and textures, and no
subtitles.

- **Voice:** two Kokoro voices. NARRATOR `am_fenrir` (1.0–1.12); MARA `af_heart` (0.92–1.02). The voicemail lines are
  band-limited like a phone speaker, and the voice behind the door is muffled (`audio/mix.py`). `voice/voice.wav` is 46 s.
- **Film:** `finance-short/src/videos/horror/` (composition `HorrorShort`), 1500 frames (50 s), 23 shots, no captions.
  - Mara is a new detailed 2D card (`toon.ts drawMara`). It has a chestnut bob with strands and highlights, almond
    eyes with a catch-light, freckles, a ribbed mustard cardigan with pockets and buttons, headphones, and cel shading
    with a painted phone glow and rim light. It covers 10 poses and 8 expressions, plus the reflection (`evil`:
    pinpoint pupils and an asymmetric smile).
  - The 3D world:
    - A rainy street with wet asphalt, puddles, sodium lamps with light cones, steam and a parked car.
    - A 6-floor brick building with a window grid (some windows lit), fire escapes and a lit entrance transom, plus
      neighbours and a skyline with lit windows and a blinking aircraft beacon.
    - Apartment 4B:
      - Kitchen: tiles, cabinets, an oven with a green clock, a fridge, a round table with chairs, a mug and keys,
        the dark pendant lamp, a radiator, curtains, a plant, a calendar, and a window with rain drops.
      - Hallway: wallpaper, a mirror, a dripping raincoat, a shoe rack, a mat, a light switch and frames.
      - Front door 4B: peephole, chain, deadbolt and a gap under the door.
    - The building corridor: carpet, doors 4A/4C/4D/4E, a flickering tube and an EXIT sign.
  - Practical lights are real point and spot lights (shade.ts `uPract`): the phone, the oven clock, the street glow
    through the window, the corridor tube and the spill under the door. Each shot's key light imitates its
    motivating source, so the 2D character's shadow falls the right way.
- **Sound:** a cello drone, a dissonant string cluster, a violin harmonic, a heartbeat (55 → 80 bpm) and a rising
  tone cut to silence. The effects are rain, a car, the phone buzzing on wood, the fridge hum, taps, a reversed swell,
  the corridor buzz, the clock click and total silence, three knocks with the chain, socked steps, creaks, the
  peephole click, the tube ticks, the light relay, the phone dying and an exhale.
  - Measured at -14.2 LUFS and -1.5 dBTP (not listened to).
- **QA:** two rounds of an Opus verifier on stills. All findings were fixed except minor ones: the door bottom in the
  foot-shadow shot still reads greenish, and the lamp tilt passes through a half-framed face for a few frames.
- **Stills:** `stills.jpg`.

## Render on your laptop
`cd /d D:\Projekti\SeminarskiEDU`, then `git pull --no-rebase --no-edit`, then `horror-short\render.cmd`
-> `finance-short\out\voicemail-from-tomorrow-2k.mp4` (`set SCALE=1` for 1080p, `set GL=swangle` if black).
