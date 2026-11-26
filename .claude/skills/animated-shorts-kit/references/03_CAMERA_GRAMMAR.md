# Ricks Clips camera grammar: measured

Study only. The frames in this folder are contact sheets made for analysis. None of them go into the project.
(1080x1920, 30 fps). Deep study of **01 (Ancient Jar, 64.9 s), 02 (Perfect Railroads, 65.2 s), 04 (Storm Oil, 64.6 s)**.
For 03, 05 and 06 there are only automatic counts (see the end).

## 1. Method (why the old numbers were wrong)
The old detector (median shot 0.85-3.6 s) treated every big frame-to-frame difference as a cut. In these shorts that difference
is almost always one of two other things:
* **fast camera moves**: push-ins, whip pull-backs and arcs reach 250-1000 % of the frame width per second at their peak.
  SSIM stays below 0.5 for **5-25 frames in a row** (video 01 alone has 266 such frames).
* **3-6 frame cross-dissolves**: each one makes 2-3 frames of medium difference.

New pipeline (scripts in `tools/`):
1. `analyze.py`: per-frame HSV histogram correlation, SSIM, MAD, and global motion. The global motion is LK features plus a
   RANSAC similarity transform, giving pan x/y, zoom scale and roll.
2. `cuts.py` and `mcres.py`: a **hard cut** is a single-frame spike. It needs a MAD spike more than 2x the median of the 3 frames
   on each side, AND low SSIM or low histogram correlation, AND a dense-flow motion-compensated residual that the flow cannot
   explain. A fast move has a sustained plateau of difference, not a single-frame spike.
3. `dissolve.py`: a **dissolve** is a frame that is a linear blend `a*F(f-3) + (1-a)*F(f+3)`, with 0.2 < a < 0.8. The two ends
   must differ strongly, and the blend residual must be less than half the difference to either end.
4. `gaphist.py`: a palette jump between f-5 and f+5. This catches transitions the other detectors miss.
5. **Every candidate checked by eye** on strips around it (`verify_*.jpg`, plus the 1-fps timelines `timeline_NN.jpg`).
   Lightning flashes, explosions, character pops and objects entering the frame were rejected.
6. `motion.py`: camera motion statistics come only from frames that are not near an edit. Speed is measured as global image
   motion: |translation| + |zoom| x half-height, in % of frame width per second, smoothed with a 5-frame median.
   Thresholds: moving > 10 %/s, any drift > 2 %/s, fast/whip > 60 %/s. Each move is classified by its dominant integrated
   component: zoom-in = push-in, zoom-out = pull-back, x = pan/truck/arc, y = tilt/crane.

## 2. Results

| | 01 Jar | 02 Railroads | 04 Storm oil | mean |
|---|---|---|---|---|
| duration | 64.9 s | 65.2 s | 64.6 s | |
| **true hard cuts** | **1** (3.07 s) | **1** (10.6 s) | **1** (26.67 s) | **1** |
| hidden cuts (whip / foreground wipe) | 0 | 2 (3.7 s: locomotive passes the lens; 9.0 s: whip-tilt sky to desert) | 0 | 0.7 |
| short cross-dissolves (3-6 fr) | 17 | 11 | 11 | 13 |
| **all edits / shots** | 18 / 19 | 14 / 15 | 12 / 13 | 14.7 / 15.7 |
| **average shot length** | **3.4 s** | **4.3 s** | **5.0 s** | **4.2 s** |
| camera moving > 10 %/s | 74 % | 83 % | 73 % | **77 %** |
| any drift > 2 %/s | 96 % | 96 % | 99.8 % | 97 % |
| fast > 60 %/s (whips, fast push) | 19 % | 49 %* | 28 % | 32 % |
| distinct moves (> 10 %/s, >= 0.2 s) | 32 | 25 | 29 | 29 (one every 2.2 s) |
| push-in | 15 | 15 | 16 | **53 %** |
| pull-back | 10 | 5 | 4 | **22 %** |
| tilt / crane | 6 | 1 | 4 | 13 % |
| pan / truck / arc (lateral) | 1 | 4 | 5 | 12 % |
| median move length | 1.1 s | 1.3 s | 1.5 s | 1.3 s |
| median hold between moves | 0.37 s | 0.43 s | 0.45 s | 0.4 s |
| move speed (median of per-move mean / peak) | 38 / 80 %/s | 93 / 246 %/s* | 45 / 89 %/s | |
| velocity peak position in the move | 40 % | 41 % | 43 % | **~40 %** |
| ease-in / ease-out (speed in the first / last 20 % vs the peak) | 0.51 / 0.39 | 0.38 / 0.24 | 0.59 / 0.52 | soft start, longer settle |

\* Railroads has many shots looking along moving trains, so world motion inflates the numbers.

**The user's observation is right.** There is about one hard cut per video. The other edits are almost all 0.1-0.2 s
cross-dissolves, placed at **location or time changes** (next day, inside the jar, back at the palace, "Meanwhile").
Between two edits, one camera runs for **3.4-5 s** and is almost never still: it moves 77 % of the time. It travels from
subject to subject with a push-in, a pull-back, a tilt or an arc, about every 2 s. Pure holds last about 0.4 s, and even
then the camera keeps creeping in.

### Notes on the moves
* **Push-in is the default move** (53 %). Moves land ON the narration word, so the subject is reached on its noun or verb.
  Examples: "ball in its mouth" lands on the dragon head, "purple" lands on the face, "the emperor" lands on the throne.
* **Pull-back as a reveal** (22 %). It is often fast, like a whip, and swings onto the next subject:
  01 at 1.7-2.7 s, from the dragon head to the whole throne room. 01 at 21.0-21.3 s, from the cup to the emperor holding it.
* **Subject-to-subject travel** is a push or pull combined with an arc or pan. It is never a cut. In 02 at 15.5-17.2 s the
  camera is on the boss CU, pulls back to show the worker, arcs round the boss and pushes in as he turns purple.
* **Follow the action**: tilt down with the poured oil to the splash, then pan or pull back to the next ship (04 at 0-3 s).
* **Ease**: the move ramps up in about 0.3 s, peaks at about 40 % of its length, then settles more slowly. There are no linear
  moves and no hard stops. Fast moves carry real motion blur.
* **Hidden-cut tricks** appear only when they are needed: a whip-tilt through the sky, or a locomotive passing the lens.
* **Hard cuts** are rare: 3.07 s in 01 (the setup's last word, cutting to the emperor's reaction), 10.6 s in 02 (into the
  station banner, end of a dolly), 26.67 s in 04 (the captain's close-up to the stormy sea, a mood switch).

## 3. Example sequences (contact sheets next to this file)
1. **01, 0.0-3.1 s** (`ex1_v01_0.0-3.1.jpg`). Emperor MS for 0.7 s, then a fast push-in and pan onto the golden dragon head on
   "ball in" (0.7-1.0 s, peak about 840 %/s). Slow creep on the head through "a dragon's mouth". Then a whip pull-back with tilt
   up (2.0-2.5 s, blurred) lands on the wide throne room on "told the emperor". **Hard cut** at 3.07 to the emperor's MS reaction.
   One camera visits three subjects in 3 s.
2. **02, 14.4-18.2 s** (`ex2_v02_14.4-18.0.jpg`). Low-angle CU of the boss looking down at the gap ("a finger wide gap").
   On "every" (15.5 s) a quick pull-back reveals the small worker at the left edge. The camera keeps pulling back and arcs right
   (15.7-16.6 s) so the worker leaves the frame and the canyon wall comes in. Push-in to MCU on "face" (16.9-17.3 s), then hold
   with a creep while the face turns purple. No cut.
3. **04, 0.0-5.1 s** (`ex3_v04_0.0-6.0.jpg`). Chef pours oil. Tilt down following the oil stream along the hull (0.7-1.4 s)
   to the splash. Pan and pull-back to the pirate ship on the horizon (2.2-2.6 s). Long fast **push-in** to the ship's
   figurehead and crew (2.9-3.8 s, ease-out). Then a hold with creep: "he could hear the pirates laughing". One take of more
   than 5 s with 4 moves.
4. **01, 8.0-13.0 s and 20.2-22.6 s** (`ex4_v01_8.0-13.5.jpg`). Row 1: a 5 s slow creep-in on the jar of eight dragons that
   speeds up into a push and crane down to the frog's open mouth on "open mouth" (11.8-13.0 s). Row 3: a dissolve
   (frog to wine cup, 20.4 s), a push-out from the ripple, then a fast pull-back and tilt up that reveals the emperor holding the
   cup (21.0-21.3 s). This is a reveal by camera move, not a cut.

## 4. Automatic-only counts (not checked by eye)
* 03 Japan job (60.6 s): about 18 dissolve candidates, 0-2 hard-cut spikes. ASL about 3.2 s; this is the most
  dissolve-driven of the six.
* 05 Brain idea zone (39.1 s): about 4 dissolves, 0 hard cuts. ASL about 7.8 s, the longest takes.
* 06 Gambling window (45.1 s): about 11 dissolves, 1-2 hard-cut spikes. ASL about 3.8 s.

## 5. Rules for our camera (applied in `src/meter/camera.ts`, TAKES)
* Aim for an average shot of about 4 s. Edit only at a location or time change or a punchline. Use a whip only to hide an
  unavoidable staging change.
* Inside a take, travel between people on the word: push-in on the speaker, pull-back plus arc or pan to the next.
  Move length 0.6-1.0 s, ease with the velocity peak at about 40 %.
* Never hold still: creep or drift the camera all the time, at roughly 10-40 % of the frame per second.
* Edits in the reference are 3-6 frame dissolves. We still use hard cuts and whip-cuts (see the remaining issues).

## 6. Applied to the parking-meter short (v4 takes)
* Before (v3): 42 setups, **41 hard cuts**, ASL **1.53 s**.
* After (v4): 19 takes and 42 subject keys: **18 hard cuts**, plus 1 whip-pan that hides a staging change (busy to begging),
  plus 1 ordinary whip-pan inside a beat. ASL is **3.39 s** counting hard cuts only, or **3.22 s** counting the hidden
  whip too. That is in the reference range (3.4-5.0 s) but below the 4.2 s mean.
* Camera moving more than 10 %/s: **about 50 %** of the time (reference 77 %). Drifting more than 2 %/s: 93 % (reference 97 %).
* Staging nudges needed for the takes, with logic still at 0 errors:
  - The hated / un-American / tax crowd now persists across the three beats. The man stands at (-1.0, 7.4) and the woman at
    (3.3, 7.45) from the start, there is one placard set, and the parked cars are the same in all three.
  - In the play beat, the young woman stays at the meter.
  - The parked beat keeps the meter flags of hour 3 and hour 4.
* Contact sheet: `/home/claude/proj/review_camera/takes_v4_sheet.jpg`. Label = take:key; `~move` = mid-move; `beat-edge` =
  the frames on either side of a staging-beat change inside a take, which must look identical (they do).
* Checkers: logic 0. The framing checker reports 356 issues against 372 before. The categories are the same as before
  (begging walk-in crop, gesture hands, background-walker FGBLOCK, EDGE); during moves only the camera-position checks run.
* Remaining issues:
  - No dissolves yet. The reference's 3-6 frame cross-dissolves would need a two-scene render.
  - Moving 50 % vs the reference's 77 %.
  - Cuts that remain because the staging differs:
    - hook / war: the crowd pops in;
    - creative / cards: the chairs and the people's positions change;
    - allday / shoppers: traffic and the shopper's car;
    - strange / hour: the flags and cars change.

    Each needs staging continuity work before it can merge, which would bring the ASL to about 4 s.
  - The ticket-to-preacher pan passes behind a meter. The meter is a short soft green foreground wipe at 59.6 s.
