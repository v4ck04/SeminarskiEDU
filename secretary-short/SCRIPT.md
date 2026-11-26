# A Secretary Died With $9 Million — script, sources, Blender build and posting

True money story for **Vacko | Money Stories**, follow-up to "A Janitor Died With $8 Million". Vertical 1080x1920,
30 fps, target ~45 s. 2D characters in a 3D world (1950s-2010s New York: law office, subway, Brooklyn street, bank
vault of statements), **rendered in Blender** this time.

Opening rule (from the pt.4 feedback): nothing is still in the first 4 seconds. The character sways, the key prop
(a stack of statements / a "$9,000,000" figure) slides into frame, pulses, and a burst sits behind it on the first big
number.

## Facts in the voice-over (checked 26 November 2026)

- Legal secretary at one New York law firm (Cleary Gottlieb Steen & Hamilton) for 67 years: Wikipedia, CBS New York,
  The Week.
- Took the subway to work: Wikipedia / NYT via Wikipedia ("known for always taking the subway to work").
  Worked into her nineties (sources say she retired at 96 or 97, so the script says only "into her nineties").
- Copied her bosses: when her boss bought a stock, she bought the same stock in a smaller amount (niece and executor
  Jane Lockshin, via Forward, SBS, Wikipedia).
- "Even her husband may never have known": Lockshin said it was "very possible" her husband, Raymond Margolies, did not
  know the size of the fortune (Wikipedia, SBS). The script keeps the "may".
- Died in 2016 at 96; accounts at three brokerage houses and eleven banks (SBS / Wikipedia).
- Fortune reported at about $9 million (CBS New York: "$9 Million Fortune"; other reports $8.2 million given to
  charity).
- $6.24 million to the Henry Street Settlement, which created the Bloom-Margolies Scholarship Fund, the largest single
  estate gift in its history; the rest of the $8.2 million to Hunter College and a scholarship fund (Forward, SBS).
- "She never told anyone": the family did not know the extent of her wealth (Lockshin, via SBS / CBS).
- The last two lines are the lesson, not a fact claim.

## Script (148 words, voice am_fenrir at ~1.2, ~45 s)

| # | line | picture |
|---|---|---|
| 1 | A secretary died with nine million dollars. Even her husband may never have known. | an old woman's desk; a "$9,000,000" figure slams in and pulses; her husband looks at us, puzzled |
| 2 | And she got it from her boss, without stealing a cent. | the boss's office door; a hand shows empty palms |
| 3 | Sylvia Bloom worked at one New York law firm for sixty-seven years. | calendar pages fly off over her typewriter, her hair going from brown to grey |
| 4 | Secretary's salary. Took the subway to work, into her nineties. | a small pay envelope; the subway car, her on the bench with a handbag |
| 5 | But every time her boss bought a stock, she bought the same one. Just a lot less of it. | the boss on the phone, "BUY 100"; her at her desk, "BUY 5" |
| 6 | No tips. No tricks. She copied, and she waited. For decades. | a stack of stock certificates growing, seasons passing outside the window |
| 7 | She never told anyone. | finger to lips, a drawer closing |
| 8 | When she died in 2016, at ninety-six, her family found accounts at three brokerages and eleven banks. | the niece opening envelopes; 14 bank books fanning out on a table |
| 9 | Around nine million dollars. | the total pops up |
| 10 | And she gave it away. Six point two million became scholarships for New York students in need. | students in caps and gowns; a building sign "Henry Street Settlement" |
| 11 | She never earned a big salary. What made her rich wasn't how much she made. It was how long she waited. | a slow push on the empty desk, the clock |
| 12 | Could you wait sixty-seven years? | the "67" on the calendar, then black |

Comment question / pinned comment: "Could you wait 67 years? What would you do with $9 million?"
Note in the description: "Not financial advice."

## Sources

- https://en.wikipedia.org/wiki/Sylvia_Bloom
- https://www.cbsnews.com/newyork/news/legal-secretary-amasses-9-million-fortune-gives-most-of-it-to-students/
- https://forward.com/news/400551/sylvia-bloom-henry-street-settlement-hunter-college-millions-donated/
- https://www.sbs.com.au/news/how-a-legal-secretary-amassed-a-fortune-donated-millions-to-community-group
- https://theweek.com/speedreads/771770/legal-secretary-who-kept-wealth-secret-donates-millions-college-scholarship-funds

## Blender project (first test of the Blender pipeline)

- `voice/` voice-over (am_fenrir 1.2, 44.4 s) and word timings; `audio/mix.py` -> `blender/audio/mix.wav` (-14.2 LUFS,
  -1.5 dBTP, measured, not listened to)
- `blender/cards/` 30 transparent PNG character cards, drawn by `finance-short/src/videos/secretary/Cards.tsx`
  (`node scripts/cards.mjs ../secretary-short/blender/cards` from finance-short re-draws them)
- `blender/build.py` builds the whole film in Blender from code: 6 sets (office, boss's office, subway car, home, street
  with the Henry Street Settlement facade, gold stage with an extruded "$9,000,000"), 15 cameras bound to timeline
  markers, cards that face the camera, sway and blink, real lights and shadows, EEVEE (or Cycles), glow in the compositor
- `blender/compose.py` frames + soundtrack + captions -> `out/secretary-short.mp4` (Blender's Video Sequencer)
- `render.cmd` runs all three steps on Windows

Status: the build script ran here up to saving `secretary.blend`, but no frame was looked at (rendering was moved
to the laptop), so the first test render on the laptop is also the first visual check.

## Render on your laptop

1. Install **Blender 4.2 LTS**: https://www.blender.org/download/lts/4-2/ (Windows installer, default folder).
2. Get the project:
   ```
   cd /d D:\Projekti\SeminarskiEDU
   git pull --no-rebase --no-edit
   ```
3. **Quick test first** (half size, a few minutes):
   ```
   set SCALE=50
   secretary-short\render.cmd
   ```
   Open `secretary-short\out\secretary-short.mp4` and check it. Then delete `secretary-short\blender\render` and run
   the full size:
   ```
   set SCALE=
   secretary-short\render.cmd
   ```
4. Stopped half way? Run `render.cmd` again: finished frames are skipped.
5. Nicer light with a strong NVIDIA card: `set ENGINE=cycles` before step 3 (much slower).
6. Open `secretary-short\blender\secretary.blend` in Blender to look around the sets, move a camera, change a light,
   then render again from the open file (Render > Render Animation) and run only the last step:
   `"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" -b -P secretary-short\blender\compose.py`

## Posting

**Title:** A Secretary Died With $9 Million. Nobody Knew How.

**Description:**
```
A secretary died with nine million dollars. Even her husband may never have known.
Sylvia Bloom worked at one New York law firm for 67 years, took the subway into her nineties, and quietly copied her
boss's stock picks, just a lot smaller. Then she gave most of it away.

Could you wait 67 years? Tell me in the comments.

Facts: Wikipedia, CBS New York, Forward, SBS (links in the pinned comment). Not financial advice.

#shorts #moneystories #investing #compoundinterest #personalfinance
```

**Tags:** secretary 9 million, sylvia bloom, secret millionaire, frugal millionaire, how to get rich slowly, compound
interest, long term investing, copy stock trades, money story, true story, personal finance, financial literacy,
janitor millionaire, vacko money

**Pinned comment:** Could you wait 67 years? What would you do with $9 million?
