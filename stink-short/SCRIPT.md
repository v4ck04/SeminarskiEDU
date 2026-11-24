# Victorian London Was So Disgusting... (the Great Stink, 1858): script, sources, production

User's production prompt (24 Nov 2026), built with the cartoon-3d-short pipeline: 2D cartoon characters with real
shadows in a fully 3D Victorian London (embankment, Palace of Westminster with the clock tower, factories with smoking
chimneys, a committee room in Parliament, Bazalgette's brick sewers).

## Voiceover (the user's text, one accuracy change)
In 1858, London smelled so bad... even Parliament wanted to escape. / Back then, the River Thames wasn't just a river.
It was London's giant open sewer. / For decades, people dumped human waste, dead animals, and industrial garbage
straight into it. / Then came the summer of 1858. / Temperatures soared above 30 degrees Celsius, and the filthy river
began baking in the heat. / The smell was unbearable. / People couldn't stand near the river. And inside Parliament? /
Politicians desperately closed the windows and soaked the curtains in chemicals to block the stench. / It didn't work.
/ There was even talk of moving Parliament. / Finally, the government had enough. / They rushed through a new law in
just 18 days, / **and gave engineer Joseph Bazalgette the green light to build** a massive underground sewer system. /
It took years to complete, but by 1875, London's new sewer network was in place. / The Great Stink didn't just
embarrass London. / It forced an entire city to rebuild what was underneath it.

Change: the prompt said "hired engineer Joseph Bazalgette". He was already chief engineer of the Metropolitan Board of
Works before 1858; the 1858 act let the Board build his scheme. So the line says "gave ... the green light".

## Facts (sources)
- Hot summer, smell of untreated sewage in the Thames, July-August 1858; June shade temperatures 34-36 C:
  [Wikipedia: Great Stink](https://en.wikipedia.org/wiki/Great_Stink), [London Museum](https://londonmuseum.org.uk/collections/london-stories/great-stink-of-1858).
- Curtains on the river side of Parliament soaked in lime chloride, without success; moving government business to
  Oxford or St Albans was discussed (Wikipedia).
- Disraeli's bill introduced 15 July, law on 2 August 1858 (18 days): London Museum,
  [History Is Now](https://www.historyisnowmagazine.com/blog/tag/The+Great+Stench).
- Bazalgette, chief engineer of the Metropolitan Board of Works; works from 1859, completed by 1875 (Wikipedia,
  [London Museum: Bazalgette](https://londonmuseum.org.uk/collections/london-stories/how-bazalgette-built-londons-first-super-sewer/)).
- Not claimed: that the smell caused cholera.
- Historical note: the clock tower was built 1843-1859 and is shown complete; the bell was hung in 1858.

## Production (done)
- Voice: Kokoro am_fenrir 1.22 (`voice/voice.wav`, 54.4 s), word timings `voice/words.json`.
- Film: `finance-short/src/videos/stink/` (composition `StinkShort`), 1720 frames (57.3 s), 16 shots, scene title
  cards from the prompt at the top, word captions in the lower middle.
- Sound: `audio/mix.py` -> `finance-short/public/stink/mix.wav`: original score (murky plod, heat pulse, comic
  scramble, march for Bazalgette, resolve) + `sfx-library/` booms, sting, riser, chimes, counter roll; synthesized
  bubbling sewage, flies, record scratch, gags, window knocks, stamp, picks and clanks. -14.2 LUFS, -1.5 dBTP
  (measured, not listened to).
- Subtitles: `great-stink.en.srt`. Stills: `stills.jpg`.
- Honest limits: "volumetric light" is approximated with haze cards, fog and bloom (no ray-marched light shafts).

## Posting (draft)
**Title:** Victorian London Was So Disgusting...
**Description:**
```
In the summer of 1858 the Thames smelled so bad that Parliament soaked its curtains in chemicals and talked about
leaving London. 18 days later there was a new law, and Joseph Bazalgette built the sewers London still uses.

#shorts #history #victorian #london #greatstink
```
**Tags:** great stink, great stink 1858, victorian london, river thames, joseph bazalgette, london sewers, history shorts,
weird history, victorian era, disgusting history, parliament 1858, london history, animated history

## Render on your laptop
`cd /d D:\Projekti\SeminarskiEDU`, `git pull --no-rebase --no-edit`, then `stink-short\render.cmd`
-> `finance-short\out\victorian-london-was-so-disgusting-2k.mp4` (`set SCALE=1` for 1080p, `set GL=swangle` if black).
