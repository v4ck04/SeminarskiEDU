# The Bank That Wanted Eight of Everything — script, sources, production and posting

A true-story short for **Vacko | Money Stories**, made with the `cartoon-3d-short` skill: Wells Fargo's
"eight products per customer" sales goal and the fake-accounts scandal (2011-2016, settled 2016-2020).
Vertical 1080x1920, 30 fps, 61.5 s (1845 frames), 202 words, English, one steady voice (Kokoro am_fenrir, 1.22).
Approved by the user on 22 Nov 2026; word captions burned in as in the other episodes (`{"caps":false}` renders without them).

## Why this story, now
- Shorts about **incentives that backfired** are breaking out right now (vidIQ outliers, 22 Nov 2026): the Hanoi
  rat bounty (600K views, 6.4x), a snake bounty (417K, 5.5x), "They Paid People to Catch Rats" (20x),
  "The Brakes That Made Taxis Crash More" (6.9x), the gold-stars drawing study (1M).
- The rat story is already covered several times in the last three weeks. Wells Fargo is the same idea as a
  money story, and no recent Short about it showed up in the search: same trend, fresher example, our niche.

## Facts (sources)
- The bank's long-running goal was **eight products per household** ("Going for Gr-eight", 1999 annual report).
  In a 2010 letter to shareholders CEO John Stumpf wrote that eight was chosen because it **rhymed with great**:
  [US Senate Banking Committee hearing record, 20 Sept 2016 (govinfo)](https://www.govinfo.gov/content/pkg/CHRG-114shrg23001/pdf/CHRG-114shrg23001.pdf),
  [Public Citizen, "King of Cross-Sell"](https://www.citizen.org/wp-content/uploads/wells-fargo-king-of-cross-sell.pdf).
- Spurred by **sales targets and compensation incentives**, employees opened more than **two million** deposit and
  credit-card accounts that may not have been authorised; **debit cards were issued and PINs created** without
  telling customers; employees **created fake email addresses** to enrol customers in online banking; some
  customers were **charged fees**:
  [CFPB, Director Cordray's remarks, 8 Sept 2016](https://www.consumerfinance.gov/archive/newsroom/prepared-remarks-richard-cordray-director-consumer-financial-protection-bureau-wells-fargo-enforcement-action-press-call/),
  [NPR, 8 Sept 2016](https://www.npr.org/2016/09/08/493157959/wells-fargo-ordered-to-pay-185-million-fine-over-unauthorized-accounts).
- About **5,300 employees were fired**; $185 million in fines (CFPB $100M, OCC $35M, Los Angeles $50M):
  [CBS Austin / AP, Sept 2016](https://cbsaustin.com/news/nation-world/wells-fargo-fined-185-million-for-improper-account-openings-about-5300-fired).
- The count later grew to **roughly 3.5 million** unwanted accounts; the Federal Reserve's **asset cap** (imposed
  2018) was **lifted in June 2025**:
  [Axios, 3 June 2025](https://www.axios.com/2025/06/03/wells-fargo-fake-accounts-federal-reserve),
  [Fortune, 4 June 2025](https://fortune.com/2025/06/04/wells-fargo-doghouse-fed-lifts-restrictions-placed-2018-accounts-scandal/).
- **$3 billion** to resolve criminal and civil investigations into sales practices from 2002 to 2016:
  [US Department of Justice, 21 Feb 2020](https://www.justice.gov/archives/opa/pr/wells-fargo-agrees-pay-3-billion-resolve-criminal-and-civil-investigations-sales-practices).

## Script (beat formula of the skill)
1. **Hook** — A bank's favorite number led its workers to open three and a half million fake accounts.
   — *a teller stamps form after form; a tower of new bank cards grows on the desk*
2. **Setting** — It's Wells Fargo, one of the biggest banks in America, and its favorite number is eight.
   — *wide: the bank on a busy street, a big gold 8 above the door* (flash after the hook)
3. Why eight? Because, the boss once wrote to shareholders, eight rhymed with great.
   — *the boss in his office, grinning at a framed 8*
4. **Action** — Every branch got targets, and every worker got a daily number.
   — *a manager taps a chalkboard of numbers; the tellers straighten up*
5. Hit it, and you got a bonus. Miss it, and you heard about it.
   — *one teller gets a gold envelope; the next one gets a glare*
6. So workers started opening accounts for customers who never asked.
   — *a customer walks out; behind him the teller keeps typing*
7. They ordered debit cards, made up PINs, and even invented email addresses.
   — *cards drop into envelopes; an envelope lands on a customer's doormat; he frowns*
8. One card here, one account there. Every single day.
   — *the card tower keeps growing behind the tellers, a few cards at a time*
9. **Snap** — In 2016, regulators reported two million accounts nobody had asked for, and fifty three hundred workers were fired.
   — *inspectors at the door; tellers walk out carrying boxes*
10. **Deadpan double** — Luckily, thousands of customers got brand new credit cards. Unluckily, some of them also got the fees.
    — *a customer opens a card like a present and smiles; then a bill unrolls to the floor*
11. **Explanation** — Why did it happen? Pay a kid for every weed he pulls, and soon he starts planting weeds.
    — *a garden: a kid pulls weeds for coins, then quietly plants new ones*
12. When the number becomes the goal, people stop chasing the goal and start chasing the number.
    — *back at the bank: the manager hugging the chalkboard*
13. **Consequence** — The bank agreed to pay three billion dollars, and the government banned it from getting any bigger.
    — *a giant cheque; a fence goes up around the building*
14. **Callback twist** — So for seven years, the bank that wanted eight of everything wasn't allowed to grow.
    — *golden light: the boss alone with the gold 8, the fence still around the bank*

The shot notes never repeat what the voice says; every joke is a sourced fact (eight/great, the fees).
The characters, bank and town are our own; nothing is taken from the reference channel.
Subtitles for upload: `eight.en.srt`.

## Checked with RickClips Studio
`studio script eight-of-everything`: 202 words, ~59 s at the pace learned from the 8 references, 14 beats,
hook 16 words (learned limit 18 / 4.7 s), **no overlap with any reference transcript**, no filler, every claim
sourced. Ending lands the payoff and stops (no call to action), as in all 8 references.

## Production (done)
- **Voice:** `tools/tts.py` (Kokoro ONNX, am_fenrir, speed 1.22) -> `voice/voice.wav` (61.0 s); `tools/align.py`
  (faster-whisper) -> `voice/words.json`, 203 words mapped onto the script. A check without the script prompt heard
  every word as written (only number formatting differed: "8", "2016", "5300").
- **Film:** `finance-short/src/videos/eight/` (composition `EightShort`, preview `EightPreview`), started from the
  Poyais episode's look values (ink, lens, grade, two-tone shading).
  - `story.ts`: 16 shots timed to the words, cameras, lens, the card tower, the fence.
  - `world.ts`: the bank and its lobby, the porch, the garden, the instanced card tower, the rising fence.
  - `cast.ts`: who stands where in every shot.
  - `toon.ts`: new props and drawings (stamp, box, slate, cheque, cards, envelopes, badge, weed, fee bill).
  - Town: the river town of the other episodes without the Tower; no Wells Fargo logo anywhere, the frieze says
    BANK. The lobby banner quotes the bank's real 1999 slogan "Going for Gr-eight".
- **Sound:** `audio/mix.py` -> `audio/mix.wav` + `finance-short/public/eight/mix.wav`, cue list `audio/cues.md`.
  - An original score (fingerpicked guitar, glockenspiel, pads) and synthesized SFX on the picture's cues.
  - Same mix as the other episodes: music -12 LU and SFX -15 LU under the voice, music ducked 3 dB under words.
  - Master -14.2 LUFS, true peak -1.5 dBTP, exactly 61.500 s.
  - Measured, not listened to: voice 10.7 dB over the bed during words (Poyais: 11.3 dB).
- **Checks:** 7 rounds of stills, then a separate verifier read a 43-frame contact sheet; its fixes are in. Sheets in
  `stills-r5.jpg`; frame-by-frame QA in `finance-short/out/eight/qa/` after the render.
- **Render:** left for your laptop (GPU), see below. Here, with software WebGL on 4 CPU cores, it ran at about
  5 s per frame (2.5 h for 1080p, 4+ h for 2K); the test renders of every shot are in `stills-r5.jpg`.

## Render on your laptop (Windows, GPU)
1. Get this branch (once):
   ```
   cd /d D:\Projekti\SeminarskiEDU
   git stash
   git fetch origin claude/rickclips-studio-setup-3bvdqe
   git checkout claude/rickclips-studio-setup-3bvdqe
   git pull
   ```
2. Double-click `eight-short\render.cmd` (or run it from cmd). The first run installs the packages (`npm install`).
   It writes `finance-short\out\the-bank-that-wanted-eight-2k.mp4`: 1440x2560, 30 fps, 61.5 s, H.264 + AAC,
   captions and soundtrack included. One command, nothing to join or mux.
   - `set SCALE=1 & render.cmd` renders 1080x1920 instead.
   - `set GL=swangle & render.cmd` if the picture comes out black (software WebGL, much slower).
   - It renders one frame at a time (`--concurrency=1`) with a 15-minute frame timeout: the first frame builds the
     whole world and takes far longer than Remotion's default 30 s. `set CONC=2 & render.cmd` is faster if the GPU
     has the memory. If 2K fails while creating the WebGL context, render 1080p (`set SCALE=1`).
     `set` stays for the whole cmd window: `set GL=` (and `set SCALE=`, `set CONC=`) clears it again.
   - `render.cmd --props "{\"caps\":false}"` renders without the burned-in captions.
   - Add `--concurrency 1` if the laptop runs out of memory.
   - The temp bundle goes to `<drive>\remotion-tmp` (it is about 1 GB per render); empty it when you are done.
3. Optional check (needs Python with numpy and Pillow, and ffmpeg on PATH), from `finance-short`:
   `python scripts\short_qa.py out\the-bank-that-wanted-eight-2k.mp4 out\eight-qa ..\eight-short\shots.json`
   checks every frame (black / white / frozen / pop frames, loudness) and writes contact sheets.
4. Upload with the title, description and tags below, and `eight.en.srt` as the English subtitles.

Manual command, if you prefer (from `finance-short`):
`npx remotion render src/index.ts EightShort out\the-bank-that-wanted-eight-2k.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --gl=angle --concurrency=1 --timeout=900000`
(the full `1.3333333333333333`: `1.3333` gives a non-integer height and Remotion refuses it).

## Posting
**Title:** The Bank That Wanted Eight of Everything
(alternative: *This Bank's Favorite Number Cost $3 Billion*)

**Description:**
```
The Wells Fargo fake accounts scandal: a sales goal of eight products per customer, and workers who opened
3.5 million accounts nobody asked for. Why eight? Because it rhymed with great.

#shorts #money #wellsfargo #business #history
```
**Tags:** Wells Fargo, Wells Fargo scandal, Wells Fargo fake accounts, fake accounts scandal, cross-selling
scandal, bank scandal, sales quotas, perverse incentives, cobra effect, Goodhart's law, business history,
money story, animated history, finance explained, vacko money
