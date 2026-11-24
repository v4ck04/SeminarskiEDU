# The City That Paid for Rat Tails: idea, script, sources (approved)

A true story for a ~60 s vertical short: 2D cartoon characters (people and rats) with real shadows in a fully 3D world
(the user's choice after a 3D-character test), on top of the realistic pass from the bat-bomb short. Hanoi, 1902: the city paid a
bounty per rat tail and ended up helping the rats.

## Why this idea (vidIQ, 23 Nov 2026)
- The same story is breaking out right now as Shorts from tiny channels: *Why the Rats Had No Tails* (28.6K views,
  21x its channel, 5 days old) and *Why This City Paid People to Breed Rats* (26.3K, 13x, 7.8 % engagement).
- "Plan that backfired" history keeps winning: *Oregon Tried to Get Rid of a Dead Whale With Dynamite* (9.6x),
  *Australia Lost a War Against Emus* (11x), *British Dropped Fake Wooden Bombs* (9.9x), and our own bat-bomb idea.
- The topic is hot but nobody has told it as a funny animated story: same trend, better execution.

## Facts (sources)
- French Hanoi built a modern quarter with sewers; the sewers became a highway for rats into the best houses, while
  plague was spreading in Asia: [Wikipedia](https://en.wikipedia.org/wiki/Great_Hanoi_Rat_Massacre),
  [Atlas Obscura](https://www.atlasobscura.com/articles/hanoi-rat-massacre-1902) (historian Michael G. Vann).
- Vietnamese workers were hired to hunt rats in the sewers and paid per rat; 7,985 rats between 26 April and 1 May
  1902, and 20,114 on 12 June alone (Wikipedia, [ScienceBlog](https://scienceblog.com/sewer-crews-in-french-colonial-hanoi-killed-20114-rats-on-12-june-1902-alone-so-the-city-paid-a-bounty-per-tail-and-an-official-later-found-villagers-breeding-rats-outside-town-to-cash-in/)).
- A public bounty of 1 cent per rat, proved by handing in the tail; officials then saw tailless rats in the streets:
  catchers cut the tails and let the rats go to breed (Atlas Obscura, Wikipedia,
  [Saigoneer interview with Vann](https://saigoneer.com/hanoi-heritage/23265-author-michael-vann-on-hanoi-s-infamous-colonial-rat-hunt)).
- An inspector found people breeding rats outside the city for their tails (ScienceBlog, Wikipedia). The bounty was
  dropped; plague still reached Hanoi in the following years (the year differs between sources, so no year is said).
- Called today an example of the "cobra effect" (Atlas Obscura).
- Not used: exact plague year and death toll (sources disagree), any named official.

## Script (13 lines, ~170 words, ~60 s at Kokoro am_fenrir 1.22)
1. **Hook**: In 1902, a city paid people to kill rats. And ended up with more rats than ever.
   *a rat in a tiny top hat counts a pile of coins under a street lamp*
2. **Setting**: This is Hanoi, then a French colony. The French built a brand-new quarter, with modern sewers.
   *a sunny colonial boulevard, white villas, an official proudly opening a manhole*
3. The sewers turned out to be a perfect highway for rats. Straight into the fanciest houses in town.
   *rats race through a tunnel and pop out of a bathroom drain in a villa; a lady jumps onto a chair*
4. And with plague spreading across Asia, rats were the last thing anyone wanted.
   *a map of Asia darkening; the official's moustache droops*
5. **Action**: So the city hired workers to go down into the sewers, and paid them for every rat.
   *workers with lamps climb down a ladder into the dark*
6. It worked. On June the twelfth alone, they killed over twenty thousand rats.
   *a counter spins to 20,114; a foreman stamps a sheet*
7. But counting dead rats was disgusting. So the city made it simple: just bring us the tail. One cent per tail.
   *a clerk with a peg on his nose; a sign: 1 CENT PER TAIL; a queue forms*
8. **Snap**: Then the officials noticed something strange. Rats, all over the city... with no tails.
   *flash; a tailless rat strolls past the official's shoes; he slowly looks down*
9. The hunters were catching rats, cutting off the tails, and letting them go. So they could make more rats.
   *in the sewer a worker snips a tail and opens his hands; the rat waves goodbye*
10. **Escalation**: Inspectors even found people outside the city... breeding rats. For their tails.
   *a farm at dusk: rows of cages, a farmer feeding rats like chickens*
11. **Consequence**: The bounty was cancelled. The rats stayed. And the plague came anyway.
   *a CANCELLED stamp; the boulevard at night, eyes glowing in every drain*
12. **Explanation**: Economists have a name for this: the cobra effect. Pay people for a problem, and you get more of the problem.
   *a chalkboard: $ for rats = more rats; an arrow loops back on itself*
13. **Callback twist**: Hanoi wanted to get rid of its rats. Instead, it started the rat business.
   *back to the rat in the top hat: he tips it to the camera and slides the coins into his pocket*

## Posting (draft)
**Title:** The City That Paid for Rat Tails
(alternatives: *This City Paid People to Breed Rats* / *Why Hanoi's Rats Had No Tails*)

**Description:**
```
In 1902 Hanoi paid one cent for every rat tail. The rat catchers found a better idea: cut the tail, let the rat go,
and wait for more rats. True story.

#shorts #history #weirdhistory #cobraeffect #hanoi
```
**Tags:** great hanoi rat massacre, hanoi rat massacre, rat tails, cobra effect, perverse incentive, history shorts,
weird history, crazy history facts, plans that backfired, history that backfired, french indochina, hanoi history,
rat bounty, animated history, true story

## Production (done)
- Voice: Kokoro am_fenrir 1.22 (`voice/voice.wav`, 62.1 s), word timings `voice/words.json`.
- Film: `finance-short/src/videos/rats/` (composition `RatsShort`), 1880 frames (62.7 s), 14 shots: the boulevard of the
  French quarter (villas with shutters, tile roofs, trees, lamps, the manhole with a sliding lid, the crate with coins,
  the bounty poster, curb drains), the sewer (brick, ledges, water, pipes, lamps, ladder), the villa bathroom, the
  bounty office (counter, desk, chalkboard, cabinets, windows, flag), the rat farm (hut, cages, paddies, palms).
- Characters: 2D cards (people in `toon.ts` with new sun-helmet and conical-hat drawings; rats drawn by `drawRat`)
  casting real sun shadows; everything else is 3D with AO, soft shading, rounded props and specular.
  `fig3d.ts` holds the real-3D character test (not used in this film).
- Sound: `audio/mix.py` -> `finance-short/public/rats/mix.wav`: original score (pizzicato rat theme, colonial march,
  plague hush) + `sfx-library/` effects and synthesized squeaks, scurrying, lid scrape, drips, stamps, coins, snip,
  chalk, a cobra hiss. -14.1 LUFS, -1.5 dBTP (measured, not listened to).
- Subtitles: `rat-tails.en.srt`. Stills: `stills.jpg`.

## Render on your laptop
`cd /d D:\Projekti\SeminarskiEDU`, `git pull --no-rebase --no-edit`, then `rats-short\render.cmd`
-> `finance-short\out\the-city-that-paid-for-rat-tails-2k.mp4` (`set SCALE=1` for 1080p, `set GL=swangle` if black).
