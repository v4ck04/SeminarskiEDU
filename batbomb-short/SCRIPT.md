# The Bats That Bombed America — idea, script, sources and posting (approved)

A true WWII story for a ~55 s vertical short, to be made with the `cartoon-3d-short` skill: Project X-Ray, the
American plan to firebomb Japanese cities with bats, which instead set fire to a U.S. air base in May 1943.

## Why this idea can reach 100k (vidIQ, 23 Nov 2026)
- Strange WWII weapons and tricks are breaking out right now: *They Bombed A Base With Beer Bottles* (1.3M views),
  *Why Allied Pilots Dropped Beer Bottles On Japan* (271K in one day, 101x), *The Glass Ball Under the Bomber*
  (17M), *The Candy That Fell from the Sky* (2.6M), *Why the US Put Pigeons Inside a Bomb* (6x).
- "Unlikely person invents something" also over-performs: *The Actor Who Invented the Backpack Parachute* (4M, 57x).
- No recent Short on the bat bomb turned up in the search: same trend, a funnier story, a twist ending.

## Facts (sources)
- The idea came from Lytle S. Adams, a dentist from Pennsylvania, after a visit to Carlsbad Caverns; he sent it to
  the White House in 1942, and President Roosevelt passed it on with the note "This man is not a nut":
  [Wikipedia: Bat bomb](https://en.wikipedia.org/wiki/Bat_bomb),
  [Air & Space Forces Magazine](https://www.airandspaceforces.com/article/1090bat/).
- Small incendiaries were designed for the bats (by Louis Fieser, the inventor of napalm); the bats were cooled to
  make them hibernate for transport (Wikipedia, [Atlas Obscura](https://www.atlasobscura.com/articles/the-almost-perfect-world-war-ii-plot-to-bomb-japan-with-bats.amp)).
- 15 May 1943: armed bats were accidentally released at Carlsbad Army Airfield's auxiliary base, roosted under a fuel
  tank and burned the test range (Wikipedia, [Task & Purpose](https://taskandpurpose.com/history/bat-bombs-burned-base/),
  [Air Force Test Center history](https://www.aftc.af.mil/News/On-This-Day-in-Test-History/Article-Display-Test-History/Article/2555256/)).
- The Army dropped it, the Navy and Marines took it over; it was cancelled in 1944 after about $2 million
  ([Army.mil: Bats over Tokyo](https://www.army.mil/article/6993/bats_over_tokyo),
  [Stars and Stripes](https://www.stripes.com/history/2021-10-05/bat-bombs-new-mexico-tests-project-x-ray-3137452.html)).
- Not used: the often-repeated "a general's car burned too" (no source found).

## Script
1. **Hook** — In 1943, the United States Army set fire to its own air base. With bats.
   — *a desert air base at night; tiny glowing dots swoop in; a hangar bursts into flame*
2. **Setting** — It started with a dentist. Lytle Adams had just visited Carlsbad Caverns, home to hundreds of thousands of bats.
   — *the dentist with his drill, staring up at a cave ceiling full of bats*
3. His idea: strap a tiny firebomb to every bat, drop them over Japanese cities, and let them hide under the roofs.
   — *a map; a bat with a little bomb; wooden houses with dark eaves*
4. He wrote to the White House. President Roosevelt passed it on with a note: "This man is not a nut."
   — *an envelope into a mailbox; a desk in the Oval Office; a note slides across it*
5. **Action** — So the military said yes. The inventor of napalm designed bombs small enough for a bat to carry.
   — *a chemist with goggles holds up a bomb the size of a peanut*
6. To keep the bats calm, they were cooled in fridges until they fell asleep.
   — *a fridge door opens: rows of sleeping bats with tiny blankets of frost*
7. **Snap** — Then, during a test in May 1943, a few armed bats escaped.
   — *flash; the crate lid pops; six bats flutter off into the evening*
8. They flew straight under a fuel tank. And the test base went up in flames.
   — *bats tuck in under the tank; a beat of silence; fire everywhere*
9. **Deadpan double** — Luckily, the bat bombs worked perfectly. Unluckily, they worked on America.
   — *an officer gives a thumbs-up; behind him the hangar burns*
10. **Explanation** — Why would it work? A normal bomb lands wherever it falls. A bat flies to the one place you would never check: the dark corner under your roof.
    — *a bomb bounces off a roof; a bat slips under the eaves and settles in*
11. **Consequence** — The Navy took over, spent about two million dollars, and then cancelled the whole thing in 1944.
    — *a big stamp: CANCELLED; the crates are carried away*
12. **Callback twist** — The bat bombs never reached Japan. Their only victory was over the United States.
    — *dawn: the burnt base, one bat hanging upside down from the flagpole*

## Posting (draft)
**Title:** The Bats That Bombed America
(alternatives: *The US Army Burned Its Own Base With Bats* / *WW2's Strangest Weapon Backfired*)

**Description:**
```
In 1943 the US military tested a real plan to firebomb Japan with bats. A few armed bats escaped, and the
test base burned down. True story.

#shorts #ww2 #history #batbomb #weirdhistory
```
**Tags:** bat bomb, project x-ray, ww2 bat bomb, bat bombs ww2, weird ww2 weapons, strange ww2 weapons, ww2 history,
ww2 facts, history shorts, weird history, crazy history facts, military history, carlsbad caverns bats,
lytle adams, animated history

## Production (done)
- Voice: Kokoro am_fenrir 1.22 (`voice/voice.wav`, 62.8 s), word timings `voice/words.json`.
- Film: `finance-short/src/videos/batbomb/` (composition `BatbombShort`, preview `BatbombPreview`), 1900 frames (63.3 s):
  Carlsbad Caverns with stalactites and sleeping bats, the President's office, the lab with flasks and the bat
  fridge, the desert base (hangar, fuel tank, flagpole, crates, mesas), a street of wooden houses.
- Sound: `audio/mix.py` -> `finance-short/public/batbomb/mix.wav`: original march score + `sfx-library/` effects
  (booms, riser, sting, chimes, pops, the denied buzz) and synthesized wings, fire roar, stamp, knocks, steps.
  -14.2 LUFS, -1.5 dBTP, voice 11.5 dB over the bed (measured, not listened to).
- Subtitles: `bat-bombs.en.srt`. Stills: `stills.jpg`.

## Render on your laptop
`git pull`, then `batbomb-short\render.cmd` -> `finance-short\out\the-bats-that-bombed-america-2k.mp4`
(`set SCALE=1` for 1080p, `set GL=swangle` if the picture is black).
