# Vacko editing style — measured from "How $0 Turns Into $447,000"

Reference: the user's own video, 5:43.7 (343.7 s), delivered file 1280x720, 30 fps, AAC stereo 44.1 kHz.
Everything below was measured from that file (cut detection, word-timed transcript, colour sampling,
spectrum analysis), not guessed. Use it as the rule book for every new long video on the channel.

Contact sheets: `sheet_1.jpg` … `sheet_3.jpg` (one frame every 4 s), `chapters.jpg` (all chapter cards),
`motion_0.jpg` / `motion_196.jpg` (4 frames per second, shows how things animate), `spec.png` (sound).
Transcript with word times: `transcript.json` / `transcript.txt`.

---

## 1. The numbers

| what | value |
|---|---|
| length | 5:43.7 |
| narration | one voice, 928 words, **162 words per minute**, calm and even, no music under the first word |
| hard cuts | 87 (one every **3.9 s** on average, median 2.9 s, shortest 1.0 s, longest 18.6 s) |
| changes inside a shot | many more: a new element pops in on almost every key word, so the picture changes every 1–2 s |
| static picture | only 38 s of 344 (11 %) is completely still; everything else moves slowly |
| transitions | **hard cuts only**; no wipes, no zoom transitions, no glitches. One fade to black at the very end |
| on-screen captions | **none**. Only key words and numbers appear as graphics |
| loudness | -14.5 LUFS integrated, loudness range 2.4 LU (very steady) |
| music | quiet ambient pad, always on, about 7–8 dB under the voice, rises in the pauses |

---

## 2. Story structure (the template)

The video is a numbered list told as a personal plan ("if I had to start from zero, this is what I would do").

| time | part | what happens |
|---|---|---|
| 0:00–0:02.5 | **cold open card** | black card, yellow handwritten title types itself on ("Starting From Zero"); music only, no voice yet |
| 0:02.5–0:31 | **hook** (28 s) | a concrete situation ("Your bank account says $0. You have 12 months."), a question ("which do you fix first?"), why most people fail ("right things, wrong order"), the promise ("six steps, and step three is the one that changes the math") |
| 0:18–0:31 | **map** | the whole plan shown once as a staircase 1–6 with the character at the bottom |
| 0:31–5:12 | **6 chapters**, 35–60 s each | every chapter opens with a black card "Step One: Find the Number" (2.4 s, in a pause of the voice), then 10–20 graphics that illustrate each sentence |
| 5:12–5:25 | **recap** | black card "The Order", then the staircase again, one step lights up per word |
| 5:25–5:34 | **call to action** | short white typed lines on black ("None of it is complicated", "Do step one tonight"), callback to the opening "BALANCE $0.00" |
| 5:34–5:43 | **outro** | the character waves at the desk ("COST: $0"), **VACKO** logo card with "Money · Investing · Financial Freedom" during "subscribe", last shot: the staircase with the character and a flag at the top, fade to black |

Chapter cards in the reference: 0:31.4, 1:17.7, 1:59.9, 2:59.9, 3:43.9, 4:39.5, 5:12 ("The Order").
Each sits in a voice pause of 2.5–2.8 s; the music comes up in that pause.

Writing rules heard in the narration:
- first person, practical, "I would…", short sentences;
- every claim gets a number ($720 a year, $17 a day, 10 times the result);
- one contrast per chapter (cut $100 vs earn $1,000; 8 % vs 7 %; $108,000 put in vs $447,000);
- a one-line punch after a number, said alone ("For nothing." "The rest is time doing the work.");
- the hook names which step matters most, so people wait for it.

---

## 3. Visual identity

### Backgrounds (only three, never anything else)
| use | colour | notes |
|---|---|---|
| **navy room** (story, character, money objects) | centre `#0C2141`, edges `#051B34` | soft radial vignette, faint darker texture |
| **cream paper** (graphs, lists, comparisons, questions) | centre `#F3EDDD`, edges `#B5B1A5` | strong vignette (edges about 25 % darker) |
| **black card** (chapter titles, punch lines) | `#00030B` | flat, very slight vignette |

### Accent colours
| colour | hex (approx.) | meaning |
|---|---|---|
| green | `#00A078` (shade `#008060`) | good money: savings, income, steps, "PAID OFF", the character's shirt |
| yellow | `#F8B800` | titles, labels, highlights, lamp, "FIRST $1,000" |
| red | `#E5574A` | bad money: $0.00 balance, debt, fees, losses, strike-through lines |
| blue | `#5B9BE0` | neutral fourth colour in sets (e.g. the "CODE" chip) |
| white | `#FFFFFF` boxes with a black outline | labels, list rows, buttons |
| black outline | `#111111`, about 3 px at 720p | around boxes, characters, charts |

### Fonts
- **Labels, numbers, headings:** a bold hand-lettered marker font in capitals, slightly slanted
  (very close to **Kalam Bold**; free on Google Fonts). Used for "FIX FIRST?", "$0.00", "PAID OFF", "LAST 30 DAYS".
- **Chapter cards and punch lines:** a handwritten script in mixed case (very close to **Caveat** / Caveat Brush).
  Yellow for chapter titles, white for punch lines, centred, about 1/20 of the frame height.
- **Small notes:** the same script, small, italic, grey or white, under a number ("out of sight", "on purpose",
  "8% average return (assumed)", "no investment reliably beats it").

### Character and props
- one recurring character: flat 2D, round head, short dark hair, dot eyes, simple mouth, **green shirt**,
  stick legs, black outline, small grey shadow under the feet. A second character (grey hair, glasses, suit,
  yellow tie) plays the boss or client;
- one recurring set: the **night desk** (wooden desk, laptop, yellow lamp with glow, window with a lit city,
  a "2027 GOALS" poster). Used at the start, in the middle and at the end;
- one recurring diagram: the **staircase 1–6** in green with white numbered circles and two-colour labels
  (white first line, yellow second line). It returns at the start, between chapters and at the end, and the
  character climbs it;
- objects are flat icons with outlines: phone screen card, brick wall, storm cloud with lightning, credit card
  with flames, money trees with gold coins, piles of coloured plates for needs/wants/leaks.

---

## 4. Motion rules

| effect | how it looks | timing |
|---|---|---|
| **typewriter** | chapter titles and punch lines type on letter by letter | about 15 letters per second, hold 0.5–1 s after the last letter |
| **pop-in** | boxes, chips, icons, labels scale up from about 30 % to 100 % with a small overshoot | 4–6 frames; lands exactly on the word that names it |
| **one by one** | sets appear in sequence, one item per spoken word (SPENDING → INCOME → DEBT; 12 month boxes) | each item 3–8 frames after the previous |
| **counter** | numbers count up/down to their value ("-$0 / year" → "-$720 / year") | 1–1.5 s, ease-out |
| **line draw** | chart axes and lines draw from left to right; red flat line "STILL AT $0", green rising line "INCOME" | 0.5–1.5 s |
| **strike-through** | a red hand-drawn line crosses a word ("CERTIFICATE", "1 STOCK", "TO THE MOON") | 6–8 frames |
| **check boxes** | boxes tick one after another as they are said | on the word |
| **slow push-in** | almost every shot creeps towards its centre, or pans along the staircase | about 3–8 % over a shot |
| **fade out** | elements that are no longer needed fade (flames dying on "PAID OFF") | 10–15 frames |
| **cut on the sentence** | a hard cut on almost every new sentence, never in the middle of a word | |

What is **not** in the style (leave it out): whip pans, glitch, shake, zoom transitions, light leaks,
film grain, emoji, stock footage, burned-in subtitles of the narration, sound-reactive graphics,
3D camera moves.

---

## 5. Sound

- **Voice:** one calm male narrator, dry (no reverb), steady level; 162 words per minute with short natural
  pauses and 2.5–2.8 s pauses before each chapter.
- **Music:** one soft ambient pad for the whole video, A minor / C major (A, C, E, G with a low A at 55 Hz
  and C at 66 Hz), no drums, very dark and warm (most energy under 600 Hz). About 7–8 dB under the voice,
  it comes up to almost voice level in chapter pauses and in the first 2 s.
- **Effects:** very few. A soft "whoosh"/noise swell that dies away on each chapter card, and small clicks
  or ticks when elements pop in. No cartoon effects, no cash-register sounds.
- **Master:** about -14 LUFS, true peak under -1 dB.

---

## 6. How to rebuild this in an editor (CapCut / Premiere / DaVinci)

1. Project 1920x1080, 30 fps (export 1080p even though the reference file is 720p).
2. Make three background presets: navy with vignette, cream with vignette, black. Save them as templates.
3. Install Kalam (Bold) and Caveat. Make text presets:
   - "Chapter": Caveat, yellow `#F8B800`, centre, typewriter animation, 15 letters/s;
   - "Punch": the same in white;
   - "Label": Kalam Bold, capitals, black on cream or white on navy;
   - "Number": Kalam Bold, large, green or red.
4. "Pop" animation preset: scale 30 % → 105 % → 100 % over 5 frames. Put it on every element and line each
   one up with its word on the voice waveform.
5. Add a slow scale 100 % → 105 % to every shot so nothing stands still.
6. Hard cuts only. Cut on every sentence. Black chapter card in each pause before a new step.
7. Audio: voice at -14 LUFS, one ambient pad underneath, ducked about 8 dB while the voice talks (auto-ducking
   in CapCut/Premiere), whoosh on chapter cards, a quiet click on pop-ins.
8. End: desk + wave, VACKO card during "subscribe", staircase with flag, fade to black.

---

## 7. Applying it to a new video

Needed from the user, one of:
- a new script (or a topic, and the script is written to the rules in section 2), or
- new footage / voice-over to be edited in this style.

The video is then built in code (Remotion, 2D): the same backgrounds, fonts, colours, character, staircase
diagram, pop/typewriter/counter/line-draw animations and sound, timed to the words of the voice-over.
