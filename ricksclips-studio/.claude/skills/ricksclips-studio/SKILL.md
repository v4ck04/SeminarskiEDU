---
name: ricksclips-studio
description: Run the RickClips Studio YouTube Shorts pipeline in this project - analyse reference MP4s in training/input to learn the editing style, produce an original Short from a topic (research, script, AI voice, subtitles, automated edit, preview, final 1080x1920 MP4, quality report), turn user feedback into style preferences, show training status, or render a preview. Use for `/ricksclips-studio analyze | produce <topic> | improve | status | preview [project]`, and whenever the user asks to make a Short, learn from the reference videos, review the learned style, or change how the videos look or sound.
argument-hint: "analyze | produce <topic> | improve | status | preview [project]"
---

# RickClips Studio

A local production pipeline driven by `studio.py` (Python + FFmpeg). Every
step below uses real, documented commands; never invent other commands or
claim a step worked without seeing its output.

## 0. Before anything else

1. Work from the project root (the folder that contains `studio.py`).
2. Pick the interpreter: Windows `.venv\Scripts\python.exe studio.py ...` (or `.\studio.cmd ...`),
   macOS/Linux `.venv/bin/python studio.py ...`. If `.venv` is missing, tell the user to run
   `powershell -ExecutionPolicy Bypass -File .\install.ps1` and stop.
3. On the first run in a session, run `studio.py doctor` and report real problems (missing FFmpeg
   filters, no TTS provider, etc.) before continuing.

Below, `studio` means `<python> studio.py`.

## Ground rules (always)

- **Evidence over claims.** Report measurements with their confidence. Never claim to know the exact
  font, editing software, plug-ins or audio settings of the reference channel - only what the analysis
  measured or what is visibly evident, labelled as such.
- **One video is not a rule.** Only "frequently observed" profile items (>= 3 consistent videos)
  are style rules; say so when fewer references exist.
- **Originality.** Learn principles, never copy a reference video's sequence, wording or footage.
  Reference MP4s are inputs for analysis only - never use them as output material.
- **Licensing.** Only use assets the pipeline records with a licence (own footage, Pexels, Pixabay,
  NASA/public domain, CC0/CC BY/CC BY-SA, generated). Never download footage from YouTube or other
  creators. Unrelated footage must never be swapped in silently - placeholders are reported.
- **Voice.** Use stock/licensed TTS voices only. Never set up a clone or imitation of the RicksClips
  creator's (or anyone's) voice without their written authorisation.
- **Secrets.** API keys live in `.env` / environment variables. Never print, echo or write them.
- **Honesty about results.** A video is finished only when `quality-report.md` has no FAIL. Quote the
  verdict and any warnings.

---

## `/ricksclips-studio analyze`

1. Count reference videos: list `training/input/` (mp4/mov/webm/mkv). If there are none, ask the user to
   copy 5-20 RicksClips MP4s they are entitled to analyse there, and stop. If fewer than 3, warn that
   the profile will stay provisional.
2. Run `studio analyze` (add `--force` only to redo already-analysed files; `--transcribe none` to skip
   speech recognition). It prints per-video progress and finally the profile version.
3. For each new video id printed (`training/analysis/<id>.md`):
   - Read the Markdown report.
   - **Visual review** (this is the "visual AI analysis"): open
     `training/extracted_frames/<id>/contact_shots.jpg`, `contact_timeline.jpg` and `contact_captions.jpg`
     with the Read tool and look at them. Note only what is visible: caption typography (weight, case,
     colours, outline, highlight style, font *category*), overlays (emojis, arrows, progress bars,
     watermarks), footage type (stock, screen recordings, AI images, photos, talking head), framing,
     colour look, visible transitions.
   - Read the transcript text in the report (if available) and judge the storytelling: hook technique,
     how each line hands off to the next, information density, emotional build, ending type.
   - Save these as reviewed notes: write a JSON file (e.g. in the scratchpad) with the shape in
     `references/editing-style.md#reviewed-notes` and run `studio notes <id> --file <notes.json>`.
     Confidence must be honest (`low` for guesses such as font category).
4. Run `studio profile --show` (the analyze/notes commands already rebuilt it) and summarise for the
   user: frequently observed / occasionally observed / uncertain, the production parameters that will
   be applied, and the differences between references. Point to `training/style-profile.md`.

## `/ricksclips-studio produce <topic>`

### Step 1 - project + research
1. `studio new "<topic>"` - creates the project (the last output line is the slug) and writes
   `production/scripts/<slug>/script.template.json` and `STYLE-BRIEF.md`. You (Claude) write the script -
   do not use `--generate` inside Claude Code unless the user asks for the API to write it (it needs
   `ANTHROPIC_API_KEY` and costs API credits); if they do, run `studio script <slug> --generate
   [--variants 2]` and still review the result as in step 2.
2. Read `STYLE-BRIEF.md` (word budget, hook length, learned hook/ending patterns) and
   `references/storytelling.md`.
3. Research the topic with web search/fetch. Pick an interesting, accurate angle. Keep only facts you can
   source from reputable sources (space agencies, journals, encyclopedias, universities). Drop anything
   you cannot verify.

### Step 2 - script (user approval required)
1. Write `production/scripts/<slug>/script.json` following the schema in `references/storytelling.md`
   (hook beat, body beats, ending beat; visuals per beat with stock-searchable `query` or a generator;
   `emphasis`; `sfx`; `sources`; `pronunciations`). Use original wording only.
2. Run `studio script <slug>` - it validates (errors, warnings: hook length, duration vs target, filler,
   unsourced claims, overlap with reference transcripts) and writes `script.md`. Fix every error; fix
   warnings unless there is a good reason.
3. Show the user the narration and beat plan from `script.md` (and 1-2 alternative hooks if useful).
   Ask them to approve or request changes. Edit and re-validate until approved.
4. On approval: `studio approve <slug> script`.

### Step 3 - voice, edit, preview
1. Check voices once per session with `studio voices` (`--test` to synthesise a sample). Use the
   configured provider unless the user asks otherwise (`--voice edge|elevenlabs|openai|pyttsx3`).
   `flite` is a robotic test voice - do not use it for a real video.
2. `studio produce --project <slug>` - runs voice -> storyboard (real timings) -> assets -> subtitles ->
   audio mix -> preview -> preview QC, then stops for preview approval.
3. Review the result yourself before handing it over:
   - Read `production/previews/<slug>/preview-contact.jpg` (one frame per scene): look for text
     collisions, unreadable captions, wrong or irrelevant visuals, placeholders, repetitive shots.
   - Read `production/previews/<slug>/preview-quality-report.md` and
     `production/storyboards/<slug>/storyboard.md`.
   - Stock search is keyword-based, so check every sourced image/clip against its narration. For a
     wrong or unsuitable asset (unrelated subject, embedded text/diagrams, event photos of people, logos):
     `studio assets <slug> --reject N --reason "<why>"` blocklists it and fetches the next candidate;
     `studio assets <slug> --scene N --generator starfield` (or another generator, `--text` for
     `text_card`) switches the scene to an original visual. Re-run `studio preview <slug>` afterwards.
     A face safeguard already rejects stock results showing prominent people when the scene did not ask
     for people; mention it if `studio doctor` reports no face detector.
   - If the asset summary lists placeholders, tell the user which scenes and offer: add Pexels/Pixabay
     keys to `.env`, put licensed footage in `production/footage/library/`, assign a file with
     `studio assets <slug> --scene N --file <path> [--license ...] [--attribution ...]`, or switch the
     scene to a generator as above.
4. Tell the user where the preview is (`production/previews/<slug>/preview.mp4`) and ask them to watch it
   and approve or request changes. For changes: edit the script / settings / assets, then rerun
   `studio produce --project <slug>` (only stale stages are redone).
5. On approval: `studio approve <slug> preview`.

### Step 4 - final export
1. `studio produce --project <slug>` renders `production/exports/<slug>/final-video.mp4`, runs QC and
   copies the deliverables (`subtitles.srt`, `captions.ass`, `storyboard.json`, `script.md`,
   `quality-report.md`, `asset-manifest.json`, `credits.txt`, `narration.wav`, `preview.mp4`,
   `production.log`).
   Use `--allow-placeholders` only if the user explicitly accepts placeholders.
2. Read `quality-report.md` and report the verdict honestly with any warnings.
3. Remind the user of attribution lines in `credits.txt` where licences require them.
4. Ask for feedback (ratings 1-5 for hook, narration, editing rhythm, subtitles, visuals, sound effects,
   overall, plus free text) and record it as in `/ricksclips-studio improve`.

## `/ricksclips-studio improve`

1. If the user has not just given feedback, ask for it for their latest project (`studio status` lists
   projects): the seven 1-5 ratings and free-form comments.
2. Record it: `studio feedback <slug> --rating hook=4 --rating subtitles=2 ... --comment "<their words>"`.
   Add `--global` only if the user explicitly says the change should always apply.
   The output shows which directives were understood; tell the user if a comment was not recognised.
3. `studio improve --dry-run` to see what would change, then `studio improve`.
   Explain: preferences repeated in >= 2 separate reports are applied; single corrections stay pending.
   Use `--force` only when the user explicitly asks to apply a single correction globally.
4. Show the new values with `studio status --settings` (each value shows whether it comes from defaults,
   the learned profile, feedback or the project).
5. For one-off changes to a single video, use project overrides instead of global preferences:
   add `"overrides": {"captions.font_scale": 1.15}` to `production/scripts/<slug>/project.json` and rerun
   `studio produce --project <slug>`.

## `/ricksclips-studio status`

Run `studio status` (add `<slug>` for one project, `--settings` for the resolved production
parameters). Summarise: reference videos analysed, profile version and how many frequent/occasional/
uncertain characteristics, applied preferences and pending feedback, available voices and asset sources,
and each project's stage (`[x]` done, `[~]` stale, `[!]` failed, `[?]` blocked).

## `/ricksclips-studio preview [project]`

1. If no project is given, use the most recent from `studio status`.
2. If its voice/storyboard/assets/subtitles stages are not done, run `studio produce --project <slug>`
   (it stops at the preview gate). Otherwise run `studio preview <slug>`.
3. Review `preview-contact.jpg` + `preview-quality-report.md` as in produce step 3 and give the user the
   path to `production/previews/<slug>/preview.mp4`.

---

## Other useful commands

| Command | Purpose |
|---|---|
| `studio voice <slug> [--provider X] [--force]` | regenerate narration |
| `studio storyboard <slug>` | rebuild scenes from narration timing |
| `studio assets <slug> [--refresh] [--status]` | re-source visuals / show sources |
| `studio subtitles <slug>` | rebuild SRT + ASS |
| `studio mix <slug>` | remix audio |
| `studio render <slug>` | final render (+QC, deliverables) after preview approval |
| `studio qc <slug> [--preview]` | re-run quality control |
| `studio sample [--online]` | build the bundled sample Short |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `FFmpeg was not found` | `winget install Gyan.FFmpeg`, reopen the terminal, or set `ffmpeg.ffmpeg_path` in `config/settings.json` |
| `no 'subtitles' (libass) filter` | install a full FFmpeg build (Gyan full/essentials both include libass) |
| `No text-to-speech provider is available` | `pip install edge-tts` (online) or `pyttsx3` (offline Windows voices), or add ElevenLabs/OpenAI keys |
| Edge TTS fails | it needs internet; switch with `--voice pyttsx3` |
| placeholders in scenes | see produce step 3 |
| QC FAIL | read the failing check in `quality-report.md`, fix the cause, rerun the stage, never hide it |

## Reference files

- `references/editing-style.md` - editing parameters, how learned values apply, reviewed-notes format
- `references/storytelling.md` - script JSON schema, hook/ending patterns, research and originality rules
- `references/subtitles.md` - caption style, chunking, highlighting, animations, fonts
- `references/audio-style.md` - voices, pronunciation, pacing, music, SFX, loudness
