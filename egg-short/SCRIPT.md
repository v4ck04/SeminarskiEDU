# One Golden Egg Explains Inflation pt.4 — script, shots, sources and posting

Episode 4 of the money-parable series ("One ___ explains it") for **Vacko | Money Stories**. Vertical 1080x1920,
30 fps, 47.5 s (1425 frames). The same three men, river landing stage and lender as the net, basket and golden-fish episodes,
plus a new character: the mayor with his goose.

The idea: inflation is not theft. When there is more money and the same amount of stuff, each coin buys less. Cash in a
jar shrinks, old debts shrink, and people who own real things (boats, nets) keep their value.

## Facts in the voice-over (checked 25 November 2026)

- "If you hid a hundred dollars under your bed in the year 2000, today it buys only half as much": prices almost doubled, CPI-U annual average 2000 = 172.2; September 2026 =
  336.940 (BLS CPI release). 336.94 / 172.2 = 1.96, so $100 from 2000 buys what about $51 bought then. Third-party calculators using BLS data give $100 in 2000 = about
  $194 today ([officialdata.org](https://www.officialdata.org/us/inflation/2000?amount=100),
  [in2013dollars.com](https://www.in2013dollars.com/2000-dollars-in-2026?amount=100)).
- "In the last twelve months, American prices rose three point seven percent": CPI-U, 12 months to September 2026,
  +3.7 % ([BLS CPI release](https://www.bls.gov/news.release/cpi.nr0.htm)). BLS published no 12-month figure for
  October 2026 (October 2025 data were never collected during the 2025 shutdown), so September is the latest.
  The November figure comes out 10 December 2026; if we post after that, update this line.
- The rest is the parable. It shows one cause of inflation (more money, same goods). Real inflation also has other
  causes (energy prices, supply shocks); the voice-over makes no claim that money printing is the only one.

## Script (174 words, voice am_fenrir at 1.22, ~48 s)

| # | line | picture |
|---|---|---|
| 1 | If you hid a hundred dollars under your bed in the year 2000, today it buys only half as much. | the second man holds a $100 bill; on "half" it tears and the right half drops away |
| 2 | Nobody stole it. So where did the other half go? | he stares at the half bill, shocked, looking left and right |
| 3 | One golden egg explains it. | flash; a shining golden egg held up to camera |
| 4 | In the river town, one basket of fish costs one golden egg. | aerial onto the stage; a fisherman swaps a basket for one egg |
| 5 | Then the mayor finds a goose that lays golden eggs. And he hands them out to everyone. | the mayor with a goose; eggs pop out, he tosses them into the crowd |
| 6 | Everyone feels rich. But the river still has the same fish. | townsfolk with armfuls of eggs; cut to the river: the same few baskets on the boards |
| 7 | So a basket costs two eggs. Then three. | the board ticks 1, 2, 3; a fisherman pulls his basket back until a third egg is added |
| 8 | The second man saved a hundred eggs in a jar. Now they buy a third of the fish. | the second man beside his full jar; the heap of baskets next to him shrinks from 3 to 1 |
| 9 | The first man owes the lender fifty eggs. Now he pays it back with a few baskets. | the lender with a "50 eggs" bubble; the first man hands over a few baskets, grinning |
| 10 | The third man kept no eggs. He owns boats and nets. His fish just cost three eggs now. | from the river: the third man on the stage edge, his two boats below; cut: a buyer pays three eggs, one by one |
| 11 | The eggs didn't get stolen. There were just more of them. | crane up: the town covered in golden eggs, the goose still laying |
| 12 | That's inflation. In the last twelve months, American prices rose three point seven percent. | the board shows "+3.7%"; sunset over the stage |
| 13 | So where do you keep yours? In a jar, or in a boat? | from the river: the second man by his jar, the third man above his boats; a "JAR or BOAT?" bubble; crane back |

Line 13 is the comment question; pin the same question under the video.

Sound: the series' folk score, a "pop" for each laid egg, coin-like clinks, a rising glock on the price ticks, a
timpani hit on "The eggs didn't get stolen", river and birds underneath.
Mix -14.2 LUFS, true peak -1.5 dBTP (measured, not listened to).

## Files

- `lines.json` the script; `voice/voice.wav`, `voice/words.json` voice (am_fenrir 1.22) and word timings
- `audio/mix.py` the soundtrack (writes `audio/mix.wav` and `finance-short/public/egg/mix.wav`), cue list `audio/cues.md`
- `finance-short/src/videos/egg/` the film (composition `EggShort`): story.ts (shots, cameras, lens), cast.ts (staging),
  toon.ts (new drawings: golden egg, goose, jar, $100 bill, egg price board, "50 eggs" and "jar or boat?" bubbles)
- `stills.jpg` one still from every shot

## Render (on your laptop)

```
cd /d D:\Projekti\SeminarskiEDU
git pull --no-rebase --no-edit
egg-short\render.cmd
```

2K by default (1440x2560) into `finance-short\out\golden-egg-pt4-2k.mp4`. `set SCALE=1` for 1080p, `set GL=swangle` if the
picture is black, `egg-short\render.cmd --props "{\"caps\":false}"` without captions.

## Posting

**Title:** If You Saved $100 in 2000, Half of It Is Gone. One Golden Egg Explains Inflation pt.4

**Description:**
```
If you hid $100 under your bed in 2000, today it buys only half as much. Nobody stole it.
One golden egg explains where the other half went: inflation.

Which one are you: the jar or the boat? Tell me in the comments.

Facts: US consumer prices (CPI-U, BLS) were 172.2 on average in 2000 and 336.9 in September 2026, almost double.
Prices rose 3.7% in the 12 months to September 2026 (BLS). Not financial advice.

#shorts #inflation #moneystories #personalfinance #financialliteracy
```

**Tags:** inflation explained, what is inflation, why prices go up, money printing, purchasing power, saving vs investing,
cash loses value, money story, money parable, animated story, financial literacy, personal finance, vacko money

**Pinned comment:** Jar 🫙 or boat ⛵? Where do you keep your money?
