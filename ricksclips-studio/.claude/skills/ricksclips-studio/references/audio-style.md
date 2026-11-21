# Audio: voice, music, sound effects

## Measured from the references
Integrated loudness / true peak (EBU R128), speech share, first word time, pauses (count, median),
words per minute (transcript) or a syllable-rate estimate (no transcript, low confidence), background bed
level in speech pauses and whether it is tonal (music likely), effect-like events (impact/boom,
whoosh/noise sweep, riser, click/pop) and how many cuts carry one, fade in/out. Effect detection is
heuristic and always low confidence.

## Voice providers (`config/voice-settings.json`)
| Provider | Needs | Word timings | Notes |
|---|---|---|---|
| `elevenlabs` | `ELEVENLABS_API_KEY` + `elevenlabs.voice_id` | yes | premium; choose a stock/licensed voice |
| `openai` | `OPENAI_API_KEY` | no (estimated/whisper) | `gpt-4o-mini-tts` with tone `instructions` |
| `edge` | internet | yes | free Microsoft neural voices; check Microsoft's terms for commercial use |
| `pyttsx3` | Windows SAPI5 (offline) | no | built-in Windows voices |
| `flite` | FFmpeg with libflite | no | robotic, tests only |

`provider: "auto"` uses the first available in `provider_priority`. `studio voices --test` synthesises a
test phrase with each available provider.

**Voice policy:** never configure a cloned or imitated voice of the RicksClips creator or any other real
person without written authorisation. Use the provider's stock voices.

## Pacing (`config/editing-settings.json` -> `voice`, learnable)
`target_wpm` (script budget), `speed` (TTS rate), `sentence_pause_s`, `beat_pause_s`, `hook_pause_s`,
`lead_in_s`. Pitch: `pitch_semitones` in voice-settings (post-processed with rubberband if available).

## Pronunciation
`pronunciations` in voice-settings (global) and in each script (per video). The spoken text uses the
respelling; captions keep the original word.

## Narration processing
High-pass (70 Hz), de-esser, compressor (3:1), two-pass loudness normalisation to -16 LUFS.

## Music
User tracks in `production/music/` (with a `.json` sidecar: `{"moods": ["mysterious"], "license": "...",
"attribution": "..."}`) are preferred; otherwise an original bed is synthesised for the script's
`music_mood` (mysterious, epic, upbeat, tense, calm, inspiring). Level: `audio.music_db_below_voice`
(learned from the references' bed level), ducked by `audio.ducking_db` while speaking, faded in/out.

## Sound effects
User files `production/sound-effects/<type>*.wav` (whoosh, impact, riser, pop, ding) are preferred;
otherwise originals are synthesised. Placement comes from the storyboard: hook impact, the script's
`sfx` per beat, whooshes on whip/zoom/flash transitions, and on beat cuts with probability
`audio.sfx_on_cuts_prob` (learned from how many reference cuts carry an effect).

## Master and checks
Two-pass loudnorm to `audio.target_lufs` (default -14, YouTube's reference) with `true_peak_db` -1,
then a limiter. QC verifies integrated loudness, true peak, zero clipped samples, every narration
sentence audible, narration/picture sync (envelope cross-correlation) and voice >= 10 dB above the
music while speaking.
