# One Golden Fish Explains It — script, shots, sources and posting

Episode 3 of the money-parable series ("One ___ explains it") for **Vacko | Money Stories**, on this week's news: the
bitcoin crash of November 2026. Vertical 1080x1920, 30 fps, 58.2 s (1745 frames). The same three men and river landing
stage as the net and basket episodes, plus a new character, the lender (top hat, dark coat).

The idea: a crash hits everyone who owns the thing. It only ruins the ones who bought with borrowed money, because the
lender makes them sell at the bottom, to the people who didn't borrow.

## Facts in the voice-over (checked 18 November 2026)

- "Bitcoin has lost almost half its value since its record a year ago": record $126,198 on 6 October 2025 (Fortune's
  price page, cited by [ifyouspent.com](https://news.ifyouspent.com/en/news/bitcoin-40-percent-below-record-november-2026-explained));
  about $64,000-64,700 on 16-18 November 2026 (CoinPaprika via the same reports; CoinDesk's ticker showed $64,183) =
  about 49 % below the record.
- "On November thirteenth, one point six billion dollars of borrowed crypto bets were force-sold in a single day":
  [CoinDesk, 13 Nov 2026](https://www.coindesk.com/markets/2026/11/13/bitcoin-hits-12-week-low-as-dollar-rallies-on-interest-rate-outlook-liquidations-top-usd1-6-billion):
  "$1.64 billion of liquidations over 24 hours, according to CoinGlass data", longs 88.7 %.
- The rest is the parable (no claim about where bitcoin goes next: "Maybe the price comes back. Maybe it doesn't.").

## Script (197 words, voice am_fenrir at 1.22)

| # | line | picture |
|---|---|---|
| 1 | Bitcoin has lost almost half its value since its record a year ago. | the town's price board: one golden fish = 8 baskets, ticking down to 4, red arrows |
| 2 | Some people lost everything. | the first man on his crate, empty-handed |
| 3 | Others didn't even blink. | the third man on his crate with his one golden fish, eyes wide open |
| 4 | One golden fish explains it. | flash; the third man holds up a sparkling golden fish |
| 5 | In the river town, everyone wants the new golden fish. And every week, its price goes up. | aerial onto the stage; the town around the board, the price steps up 3, 4, 6, 8 |
| 6 | The first man wants to get rich fast. So he borrows twenty baskets of fish, and buys golden fish at the top. | the first man and the lender: a heap of baskets appears, turns into three golden fish |
| 7 | The second man thinks it's a silly fish. He buys none. | the second man laughs, shakes his head |
| 8 | The third man buys just one. With fish he can afford to lose. And he borrows nothing. | the third man by his full barrel buys one; the lender offers baskets, he shakes his head |
| 9 | Then, one morning, the price falls by half. | flash; the board drops from 8 to 4 |
| 10 | The second man laughs. The third man shrugs, and waits. | the second man laughing; the third man on his crate, eyes closed |
| 11 | But the first man's lender is at the door. Pay me back. Today. | the lender walks up; bubble "20 (basket) !" |
| 12 | His golden fish are worth half. So he sells every single one, at the bottom, to the third man. | the three golden fish fly one by one from the first man to the third |
| 13 | Maybe the price comes back. Maybe it doesn't. The first man will never find out. | sunset: the first man alone on his crate, the board shows "?" with both arrows |
| 14 | The crash didn't ruin him. The loan did. | close on him; cut to the lender grinning by his baskets |
| 15 | On November thirteenth, one point six billion dollars of borrowed crypto bets were force-sold in a single day. | the whole town in a row; the lender walks along and every golden fish goes into his basket |
| 16 | Prices fall for everyone. Only borrowed money makes you sell at the bottom. | the third man on his crate with four golden fish; crane up over the stage in the sunset |

Sound: the series' folk score, a falling glock on the drop, a timpani hit and a crack on the crash, a tense pulse
for the lender, steps, thunks of fish into baskets. Mix -14.2 LUFS, true peak -1.5 dBTP (measured, not listened to).

## Files

- `lines.json` the script; `voice/voice.wav`, `voice/words.json` voice and word timings; `audio/mix.py` the soundtrack
  (writes `finance-short/public/goldfish/mix.wav`)
- `finance-short/src/videos/goldfish/` the film (composition `GoldfishShort`), captions and sound inside it

## Render on your laptop (cmd, everything on drive D)

```
cd /d D:\Projekti\SeminarskiEDU
git pull
cd finance-short
npm install --cache D:\npm-cache
set TEMP=D:\remotion-tmp
set TMP=D:\remotion-tmp
npx remotion render src/index.ts GoldfishShort D:\Videi\golden-fish-short.mp4 --codec h264 --crf 17 --gl=angle
```

Options: `--scale 1.3333` for 2K, `--props "{\"caps\":false}"` without captions, `--concurrency 1` if the laptop runs
out of memory, `--gl=swangle` if the picture is black.

## Posting

**Title:** Bitcoin Fell 50%. Why Only Some People Got Wiped Out

**Description:**
```
Bitcoin has lost almost half its value since its record. Some people lost everything, others didn't even blink.
One golden fish explains the difference: it was never the crash. It was the loan.

Facts: record $126,198 (6 Oct 2025); about $64,000 in mid-November 2026; $1.64 billion of crypto liquidations
in 24 hours on 13 Nov 2026 (CoinGlass via CoinDesk). Not financial advice.

#shorts #bitcoin #crypto #moneystories #personalfinance
```

**Tags:** bitcoin crash, bitcoin price, crypto crash 2026, crypto liquidations, leverage explained, why people lose
money in crypto, borrowed money, money story, money parable, animated story, financial literacy, vacko money
