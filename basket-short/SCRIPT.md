# One Basket Explains It — script, shots and posting

Episode 2 of the money-parable series ("One ___ explains it") for **Vacko | Money Stories**. Vertical 1080x1920, 30 fps,
48.3 s (1450 frames). The same three men and the same river landing stage as episode 1 (the fishing net), so the
series has recurring characters: the first man spends, the second saves, the third builds.

The idea: debt with interest is a hole in your basket. You can work harder, but the holes don't care. The interest you
pay doesn't vanish: someone is holding a basket underneath.

## Script (169 words, voice am_fenrir at 1.22, ~212 words per minute)

| # | line | picture |
|---|---|---|
| 1 | Why do some people earn more every year, and still have nothing? | the first man with a full basket; fish slip out of its holes one by one; on "nothing" it is empty |
| 2 | One basket explains it. | white flash; the third man holds up a whole, full basket |
| 3 | Three men fish the same river. Every evening, each one carries home one full basket. | aerial onto the stage, then the three in a row, one full basket each |
| 4 | The first man wants a new boat. Not next year. Now. So he borrows. | from the river: him at the edge, a shiny red boat pops in below; cut: he stands in it, laughing and waving |
| 5 | And every loan cuts a little hole in his basket. | close on the basket: a hole tears open on "hole", two fish drop out |
| 6 | He leaves the river with a full basket, and gets home with half. | he walks home along the stage leaving a trail of fish; stops, looks in: half |
| 7 | So he fishes longer. Borrows again to cover the gap. More holes. | evening: still fishing, straining; the basket beside him tears open twice more |
| 8 | The holes don't care how hard he works. | close: pained, fish dripping out of four holes |
| 9 | The second man borrows nothing. Every night, one fish goes into a barrel. Slow. Safe. Boring. | the second man shakes his head, tosses one fish into his barrel; it fills a step on each word |
| 10 | The third man saves too. But when his barrel is full, he walks over to the first man. | the third man's barrel brims over on "full"; he walks over, carrying an empty basket |
| 11 | "Need another loan?" | close on the third man, a bubble with a fish and a question mark |
| 12 | Now every fish that falls through those holes lands in his basket. | flash; his basket sits on the boards right under the first man's holes and fills up; on "his basket" he looks at us |
| 13 | Soon he has a basket under every hole in town. | the town in a row, everyone with a holed basket; a basket pops in under each one; the third man at the end with two full barrels |
| 14 | One paid the interest. One avoided it. One collected it. | sunset: three quick portraits (holed basket / barrel / sitting by his full barrels) |
| 15 | So if your basket has holes, someone is holding the basket underneath. | close on the holed basket, down to the basket underneath, up and back over the stage in the sunset |

Sound: the folk score of episode 1 (same key and glockenspiel theme), fish slaps, wicker rips on every new hole, a
timpani hit on the twist, soft thunks as fish land in the third man's basket, river and birds underneath.
Mix -14.2 LUFS, true peak -1.5 dBTP (measured, not listened to). Cue list: `audio/cues.md`.

## Files

- `lines.json` the script; `voice/voice.wav`, `voice/words.json` the voice and its word timings
- `audio/mix.py` the soundtrack (writes `audio/mix.wav` and `finance-short/public/basket/mix.wav`)
- `finance-short/src/videos/basket/` the film (composition `BasketShort`): story.ts (shots, cameras, lens),
  cast.ts (who stands where in each shot), toon.ts (drawings: basket, barrel, boat, bubble), Captions.tsx

## Render (on your computer)

Captions and sound are inside the composition, so one command gives the finished file:

```
cd finance-short
npm install
npx remotion render src/index.ts BasketShort out/basket/basket-short.mp4 --codec h264 --crf 17 --gl=angle
```

- 2K instead of 1080p: add `--scale 1.3333` (1440x2560).
- Without captions: add `--props '{"caps":false}'`.
- If the GPU gives a blank picture, try `--gl=swangle` (slower, software).

## Posting

**Title:** Why You Earn More But Still Have Nothing

**Description:**
```
Three men. One river. One basket each. The first borrows for a new boat... and his basket starts leaking.
A 1-minute money story about debt, interest, and who is holding the basket underneath.

#shorts #moneystories #debt #personalfinance #financialliteracy
```

**Tags:** money story, debt explained, interest explained, why people stay broke, rich vs poor, financial literacy,
money parable, animated story, personal finance, saving vs borrowing, vacko money
