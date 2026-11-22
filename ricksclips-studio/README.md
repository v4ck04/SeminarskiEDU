# RickClips Studio

An automated, local YouTube Shorts production studio. It learns the editing style of reference
videos (the RicksClips channel) and turns a topic into a finished, original 1080x1920 Short with AI
narration, styled subtitles, an automated edit, music, sound effects and a quality report.

```
reference MP4s ──► analysis ──► style profile ──┐
                                                 ├─► script ─► voice ─► storyboard ─► assets ─► subtitles ─► mix ─► preview ─► final ─► QC
topic ───────────────────────────────────────────┘        ▲ approve                                      ▲ approve
feedback ─────────────────────────────► preferences ───────┘ (repeated feedback only)
```

Everything runs on your Windows PC with Python and FFmpeg. Paid services (Claude API, ElevenLabs,
OpenAI, Pexels, Pixabay) are optional add-ons.

---

## 1. Install (Windows)

```powershell
cd ricksclips-studio
powershell -ExecutionPolicy Bypass -File .\install.ps1          # add -WithOptional for transcription/Claude API
```

The installer checks Python 3.10+, FFmpeg (offers `winget install Gyan.FFmpeg`), Git, free disk space
and your GPU, creates `.venv`, installs `requirements.txt`, copies `.env.example` to `.env` and runs
`studio.cmd doctor`. Nothing is installed without asking (unless you pass `-Yes`).

Run commands with `.\studio.cmd <command>` (or `.venv\Scripts\python.exe studio.py <command>`).

Recommended extras (`requirements-optional.txt`):

| Package | Why |
|---|---|
| `faster-whisper` | transcribes reference videos locally - pace, hooks, endings, words per caption become measurable |
| `anthropic` | lets the CLI write scripts / review frames through the Claude API (not needed inside Claude Code) |
| `pytesseract` | optional OCR of captions (needs Tesseract for Windows) |

## 2. Use it from Claude Code (recommended)

Open the `ricksclips-studio` folder in Claude Code and use the skill:

| Command | What happens |
|---|---|
| `/ricksclips-studio analyze` | analyses `training/input/*.mp4`, Claude reviews the contact sheets, the style profile is updated |
| `/ricksclips-studio produce <topic>` | research -> script (you approve) -> voice -> edit -> preview (you approve) -> final MP4 + QC |
| `/ricksclips-studio improve` | records your ratings/comments and turns repeated preferences into style changes |
| `/ricksclips-studio status` | training progress, profile, voices, asset sources, projects |
| `/ricksclips-studio preview [project]` | renders/reviews the low-resolution preview |

The skill lives in `.claude/skills/ricksclips-studio/` (SKILL.md + references).

## 3. Use it from the command line

```powershell
.\studio.cmd doctor                                   # environment check
.\studio.cmd analyze                                  # learn from training\input\*.mp4
.\studio.cmd new "The most mysterious discoveries in space"   # project + script template + style brief
#   write production\scripts\<slug>\script.json (or: .\studio.cmd script <slug> --generate  with ANTHROPIC_API_KEY)
.\studio.cmd script <slug>                            # validate -> script.md
.\studio.cmd approve <slug> script
.\studio.cmd produce --project <slug>                 # voice, storyboard, assets, subtitles, mix, preview
.\studio.cmd approve <slug> preview
.\studio.cmd produce --project <slug>                 # final render + QC + deliverables
.\studio.cmd feedback <slug> --rating subtitles=2 --comment "The subtitles are too small."
.\studio.cmd improve
```

`.\studio.cmd sample` builds the bundled sample Short offline (`--online` sources NASA/Wikimedia images).

## 4. Training: what is learned

`studio analyze` measures every reference video and writes `training/analysis/<id>.md/json` with
observations that each carry a **timestamp, description, confidence and evidence source**:

| Area | Measured |
|---|---|
| video | duration, resolution, aspect, fps, codecs |
| editing | shot lengths, cuts/min, rhythm, pacing in the hook vs body, cut timing vs narration |
| transitions | cuts, dissolves, dips/fades, flashes, whip/blur and zoom transitions |
| camera | zoom in/out, pans, static, shake, animated stills, speed-change hints |
| colour/composition | brightness, contrast, saturation, warmth, split tone, vignette, palette, layout, faces |
| subtitles | position, letter size, words per caption, lines, colours, highlights, outline, shadow, case, weight/width, animation, timing |
| audio | loudness, true peak, speech share, pace (wpm), pauses, music bed level, effect-like events |
| story | hook (text, length, technique), progression, information density, ending type |

Contact sheets (`training/extracted_frames/<id>/`) are reviewed visually (by Claude in the skill, or via
the Claude API with `--vision`) and stored as reviewed notes (`studio notes`).

`training/style-profile.md` aggregates all reports into **frequently observed** (consistent in >= 3
videos), **occasionally observed** and **uncertain** characteristics. Only frequent ones become
production rules; one video is never enough. Every change is versioned in
`training/profile-history/` and logged in `training/training-history.json`.

### Current training state (8 RicksClips references)

Built from *How Mine Salting Worked*, *The Ancient Jar That Warned an Empire*, *The Difference Between
Rich and Poor*, *The Instinct That Makes You Crash*, *The Job Nobody Wants in Japan*, *The Window That
Breaks Japan's Gambling Law*, *Why Astronauts Can't Flush in Space* and *Why Samurai Feared the Flying
Thunder* (see `training/style-profile.md`). Consistent across all eight:

- ~61 s videos (45-73 s), narration at ~244 words/min with ~0.23 s pauses, speech from the first frame
- shots ~2.6 s (some long camera moves up to 10-13 s), cuts land on word boundaries
- constant camera motion (≈58 % push-ins, ≈24 % pull-outs); transition mix varies per video
  (29-89 % hard cuts, the rest mostly dissolves), so it is not forced
- captions: white, sentence case, 1-2 words at a time, dark outline + soft shadow, ~70 % down the
  frame, occasional coloured emphasis word
- music bed ~9 dB under the voice, master at -14 LUFS
- **hook**: one sentence stating a concrete paradox (a strange action, an absurd consequence, or a
  rule + contradiction), no intro
- **ending**: a concrete payoff image that resolves the hook, then the video stops - no call to action
- **visuals: original 3D cartoon animation with recurring characters; on-screen text lives inside the
  scene (signs, screens, props), no overlay graphics** (reviewed)

That last point is the biggest gap between the references and what this pipeline can make: it does not
animate characters. Closest options, in order: your own animation clips in
`production/footage/library/`, AI illustrations in an original style (`assets.openai_images`, off by
default), licensed stock/public-domain images, or the procedural visuals. Do not copy the channel's
characters.

## 5. Production details

**Script** - `script.json` (schema in `.claude/skills/ricksclips-studio/references/storytelling.md`):
hook/body/ending beats, visuals per beat, emphasis words, sound effects, sources and pronunciations.
Validation checks hook length, length vs target, filler, unsourced claims, and 6-word overlaps with
reference transcripts (originality).

**Voice** - provider abstraction (`config/voice-settings.json`):

| Provider | Needs | Word timings |
|---|---|---|
| `elevenlabs` | `ELEVENLABS_API_KEY` + a stock `voice_id` | yes |
| `openai` | `OPENAI_API_KEY` | estimated / whisper |
| `edge` | internet (free Microsoft voices; check their terms for commercial use) | yes |
| `pyttsx3` | Windows SAPI5, offline | estimated / whisper |
| `flite` | FFmpeg with libflite (test voice) | estimated |

Sentence-level synthesis (cached), pronunciation respelling, pitch, and **pace matching**: the voice's
natural speed is measured and adjusted to the learned target (up to 1.6x, with an FFmpeg time-stretch
when a provider's own speed limit is lower). Never use a clone of another creator's voice without
written permission.

**Subtitles** - SRT + styled ASS (libass): learned font size/position/case/words per caption, outline,
shadow, highlight mode (none, emphasis, active word), animation (pop, fade, slide, word reveal). Fonts:
Anton, Archivo Black, Bebas Neue, Poppins (SIL OFL, in `assets/fonts`).

**Assets** - library -> generated -> Pexels -> Pixabay -> NASA -> Wikimedia Commons -> AI images
(optional). Keyword + phrase relevance, licence allow-list (no NC/ND), a face safeguard against
unrelated people, placeholders instead of silent substitution, and `asset-manifest.json` +
`credits.txt` with source/licence/attribution. Review tools:
`studio assets <slug> --reject N`, `--scene N --generator starfield`, `--scene N --file my.mp4`.

**Edit** - Python compositor (sub-pixel zoom/pan/punch-in/shake, crossfade/dip/flash/whip/zoom
transitions, colour normalisation, grade matched to the references) piped into one FFmpeg encode
(H.264 High, yuv420p, AAC 48 kHz, 30 fps, faststart).

**Audio** - voice chain (high-pass, de-esser, compressor, loudnorm), music (your library or an original
generated bed) levelled under the voice and ducked while speaking, generated or library SFX, two-pass
master to -14 LUFS / -1 dBTP with a limiter.

**QC** (`quality-report.md`) - full decode, resolution, 9:16 DAR/SAR, fps, codecs, duration and frame
count, A/V length, accidental black frames, frozen picture, loudness, true peak, clipping, narration
presence, narration/picture sync (envelope cross-correlation), voice-over-music clarity, subtitle sync
and completeness, captions visible in the picture, safe area, readable size, placeholders, licences.

**Deliverables** (`production/exports/<slug>/`): `final-video.mp4`, `subtitles.srt`, `captions.ass`,
`storyboard.json/.md`, `script.md/.json`, `quality-report.md/.json`, `asset-manifest.json`,
`credits.txt`, `narration.wav`, `audio-mix.wav`, `preview.mp4`, `production.log`.

## 6. Configuration

| File | Contents |
|---|---|
| `config/settings.json` | paths, analysis, style learning thresholds, script/API, asset sources, export, workflow gates |
| `config/editing-settings.json` | default editing, transitions, captions, colour, audio, voice pacing, story |
| `config/voice-settings.json` | TTS providers, pitch, pronunciations, voice processing |
| `.env` | API keys (never committed, never logged) |

Each production value is resolved as: defaults -> learned profile (frequent) -> repeated feedback ->
project overrides. `studio status --settings` prints every value with its source.

## 7. Feedback loop

`studio feedback <slug>` stores ratings (hook, narration, editing rhythm, subtitles, visuals, sound
effects, overall) and free text; phrases like "subtitles too small", "make the cuts faster", "fewer
transitions", "more engaging opening", "music too loud" become directives. `studio improve` applies a
directive only after it appears in 2 separate reports (configurable) or when marked `--global`, and
versions the change.

## 8. Folder layout

```
.claude/skills/ricksclips-studio/   Claude Code skill (+ references/)
training/   input/ analysis/ extracted_frames/ feedback/ profile-history/
            style-profile.md|json  training-history.json  preferences.json
production/ scripts/ storyboards/ voice/ footage/ (library/) subtitles/ sound-effects/ music/ previews/ exports/
assets/     fonts/ models/ overlays/ transitions/ templates/
config/     settings.json voice-settings.json editing-settings.json
rcstudio/   analysis/ style/ production/ (the Python package)
samples/    sample scripts        tests/   pytest suite        logs/
```

## 9. Tests

```powershell
.\.venv\Scripts\python.exe -m pytest
```

The suite renders synthetic reference videos with known ground truth (cuts, dissolves, dips, flashes,
camera moves, captions, audio) and checks the analyzer against them, then tests the style learner,
feedback, script/storyboard, voice timing and pace matching, subtitles, mixing, the compositor, asset
selection and a full reduced-size production run with QC (including a deliberately broken file that
must fail QC). No copyrighted footage is used.

## 10. Rules and limits

- Reference videos are analysed only; they are never used as output material and are git-ignored
  (as are transcripts and extracted frames).
- Fonts, editing software and effect settings of the references are never "identified" - only
  measured properties are reported, with confidence.
- Sound-effect and speed-change detection are heuristic (low confidence, not applied automatically).
- Stock search is keyword based: always review the preview contact sheet (the skill does this).
- Licences: Pexels/Pixabay licences, NASA media guidelines (verify third-party credits), Wikimedia
  licences (attribution required for CC BY/BY-SA - see `credits.txt`), Edge TTS / ElevenLabs / OpenAI
  terms for generated narration.
- Third-party components: fonts under SIL OFL 1.1 (`assets/fonts/*-OFL.txt`), YuNet face detector
  (MIT, `assets/models/YUNET-LICENSE.txt`).

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| FFmpeg not found / missing filters | `winget install Gyan.FFmpeg`, reopen the terminal, or set `ffmpeg.ffmpeg_path` |
| No TTS provider | `pip install edge-tts` (online) / `pyttsx3` (offline) or add ElevenLabs/OpenAI keys |
| Transcript not available | `pip install faster-whisper` (first run downloads the model) |
| Placeholders in the video | add Pexels/Pixabay keys, library footage, `--scene N --file`, or a generator |
| QC FAIL | open `quality-report.md`; fix the cause and rerun the stage - the verdict is never hidden |
