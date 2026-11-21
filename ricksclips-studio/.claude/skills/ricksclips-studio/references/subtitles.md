# Subtitles

## Measured from the references (`studio analyze`)
The caption detector finds bright text lines touching dark pixels (outline/shadow/box), keeps letter
components enclosed by their outline, and tracks them at 10 fps. It reports: coverage, position (y as a
fraction of height and zone), letter height, words per caption (from transcript timing, or word-gap
analysis), lines, on-screen time, fill colour, highlight colour and style (static emphasis vs moving
active word), outline thickness, drop shadow, dark box, ALL-CAPS likelihood, stroke weight and letter
width, onset animation (scale-in, slide, fade, word-by-word reveal).

**Fonts are not identified.** The profile picks the *closest bundled font* by comparing the measured
stroke-weight and letter-width with each bundled font rendered through libass and measured with the
same detector (`training/font-calibration.json`). This is a similarity choice, not an identification.

## Style parameters (`captions.*`)
| Key | Default | Notes |
|---|---|---|
| `font`, `font_file` | Poppins Black | any TTF in `assets/fonts/`; libass name is the full font name |
| `font_size`, `font_scale` | 118, 1.0 | at 1080x1920; feedback "bigger subtitles" scales `font_scale` |
| `uppercase` | true | |
| `primary_color`, `highlight_color` | #FFFFFF, #FFD400 | |
| `outline_width`, `shadow` | 8, 3 | px at 1080 wide |
| `position_y` | 0.62 | centre of the caption block (fraction of height) |
| `max_words`, `max_chars_per_line`, `max_lines` | 3, 16, 2 | chunking limits |
| `animation` | pop | pop, fade, slide, word_reveal, none |
| `highlight_mode` | active_word | active_word (karaoke), emphasis (script emphasis + numbers), none |
| `min_duration_s`, `hold_s` | 0.3, 0.12 | |
| `safe_area` | top .12, bottom .22, left .06, right .12 | keeps text clear of the Shorts UI |

## Chunking rules
- Captions never span sentences.
- Break at `max_words`, at the character limit, after punctuation (, ; : -) and at pauses > 0.35 s.
- Don't end a caption on a weak word (a, the, of, to, and...) when a next word exists.
- Each caption starts exactly at its first word; gaps under 0.25 s are closed to avoid flicker.
- Lines are balanced (two lines of similar length).

## Outputs
- `subtitles.srt` - plain captions (upload as closed captions on YouTube).
- `captions.ass` - styled captions burned into the video (libass), with word-level highlighting
  (one event per word for `active_word`).
- `captions.json` - every caption with word timings (used by QC).

## Word timings
From the TTS provider (ElevenLabs character alignment, Edge word boundaries), otherwise faster-whisper
alignment if installed, otherwise proportional estimation inside the detected speech of each sentence.
The source is recorded per sentence in `timing.json`.

## Fonts bundled (SIL Open Font License, licences in assets/fonts)
Anton, Archivo Black, Bebas Neue, Poppins (Bold, ExtraBold, Black). Add more TTF files to
`assets/fonts/` and set `captions.font_file` (and `captions.font`) to use them.
