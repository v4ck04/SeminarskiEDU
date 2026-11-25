# Body Number 2: build notes

Source: the user's doc "Body Number 2 – Shot-by-Shot Video Script" (https://claude.ai/artifact/DFsX2vDK3VKpwvaBwr1utV),
built with the cartoon-3d-short pipeline: 2D characters with real shadows in 3D sets, 26 shots, no captions.

- **Voice:** two Kokoro voices. DARKO/narrator `am_onyx` (0.85–1.05); MAYA and the bread note `af_bella`. 48 s.
  - Lines spoken: the doc's VO and dialogue. The note in shot 9 is read aloud in Darko's voice, and the bread note in
    shot 24 in Maya's, because there are no captions.
- **Film:** `finance-short/src/videos/body2/` (composition `Body2Short`), 1560 frames (52 s), 26 shots following the
  doc's shot list and camera moves: rack focus, low push-in, Dutch mirror, overhead spin, backlit doors, OTS + whip,
  ground tracking, macro drawer, note close-up, dolly zoom, flicker, orbit, glasses ECU, globe pull-back,
  OR/cockpit/boat montage, crane down, pen macro, signing orbit, balcony crane, clock match cut, bakery,
  bread, window reveal, pull-back with the title.
- **Characters:** a parametric 2D drawer (`toon.ts drawChar`, `Look` + `CharOpts`). Every character has the same
  yellow-green eyes (with an optional glow).
  - Main cast: President (suit / pajamas), Maya, the Baker, a surgeon, a pilot and a fisherman.
  - The rest of the eleven: a teacher, a courier, a farmer, a student, a grandma and a nurse, plus nine reporters.
  - 10 poses and 8 expressions.
- **Sets (3D):**
  - Presidential bedroom: gold ceiling, seal carpet, bed, clock, mirror, double doors, windows with light rays.
  - Marble hallway with flags, sconces and portraits.
  - Office: panels, seal, desk with a working drawer, envelope, notes, lamp, flags, sofas, hologram globe.
  - Press room with the backdrop.
  - Balcony over the river town at golden hour.
  - Operating room, cockpit with a sunrise windshield, fishing boat on the river.
  - Bakery: brick oven glowing, bread, cot, shop window, awning and sign, plus the street with houses.
  - Practical lights: clock, desk lamp, drawer, hologram, oven, surgical lamp, camera flashes.
- **Sound:** score by act: a low pulse, rising strings, a warm swell, a piano and a final chord. SFX follow the doc's
  list (heartbeat, tick, whooshes, hits, door boom, heels, UI beeps, steps, drawer, paper, bass drop, flicker,
  sweep, beep, engine, waves, pen, shutters, wind, cheer, clock + sub hit, alarm, oven, crust, bell).
  - Measured at -14.4 LUFS and -1.5 dBTP (not listened to).
- **QA:** an Opus verifier pass on stills; its findings were fixed and re-checked. Remaining minor points:
  - In the window reveal, the outermost waving people are cut by the window frame.
  - The reporters in the signing orbit appear only at the sides of the frame.
- **Stills:** `stills.jpg`.

## Render
`cd /d D:\Projekti\SeminarskiEDU`, then `git pull --no-rebase --no-edit`, then `body2-short\render.cmd`
-> `finance-short\out\body-number-2-2k.mp4` (`set GL=swangle` if black).
