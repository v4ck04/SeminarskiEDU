# Reference analysis: The_Ancient_Jar_That_Warned_an_Empire.mp4

- **Video id:** `the-ancient-jar-that-warned-an-empire-53119a`  
- **Analyzed:** 2026-11-21T22:25:16+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/the-ancient-jar-that-warned-an-empire-53119a/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 64.9331 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 25.0 | 0.8 |
| shot_len_median | 2.233 | 0.8 |
| shot_len_mean | 2.5947 | 0.8 |
| cuts_per_min | 22.1767 | 0.8 |
| shot_len_cv | 0.7062 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.3714 | 0.8 |
| pace_change_ratio | 1.0896 | 0.64 |
| transition_share_cut | 0.2917 | 0.7 |
| transition_share_dissolve | 0.5417 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0417 | 0.5 |
| transition_share_zoom_transition | 0.125 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.435 | 0.6 |
| motion_share_zoom_out | 0.217 | 0.6 |
| motion_share_pan_left | 0.043 | 0.6 |
| motion_share_pan_right | 0.087 | 0.6 |
| motion_share_pan_up | 0.087 | 0.6 |
| motion_share_pan_down | 0.043 | 0.6 |
| motion_share_static | 0.087 | 0.6 |
| moving_shot_share | 0.913 | 0.6 |
| zoom_rate_median | 0.1205 | 0.55 |
| shake_share | 0.174 | 0.45 |
| animated_still_share | 0.13 | 0.45 |
| brightness | 0.4305 | 0.7 |
| contrast | 0.178 | 0.7 |
| saturation | 0.4079 | 0.7 |
| colorfulness | 59.6634 | 0.65 |
| warmth | 7.6588 | 0.6 |
| vignette_share | 0.431 | 0.4 |
| shot_brightness_std | 0.1164 | 0.5 |
| face_frame_share | 0.038 | 0.55 |
| caption_coverage | 0.838 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 151.5 | 0.85 |
| caption_y | 0.7047 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.049 | 0.85 |
| caption_outline_share | 0.872 | 0.85 |
| caption_outline_frac | 0.0074 | 0.59 |
| caption_caps_share | 0.134 | 0.5 |
| caption_stroke_ratio | 0.3221 | 0.45 |
| caption_char_aspect | 0.8579 | 0.45 |
| lufs | -14.02 | 0.95 |
| true_peak | -2.16 | 0.95 |
| speech_ratio | 0.885 | 0.85 |
| pause_median | 0.23 | 0.85 |
| pauses_per_min | 32.39 | 0.85 |
| wpm | 245.5 | 0.85 |
| bed_below_speech_db | 14.4 | 0.6 |
| sfx_per_min | 49.02 | 0.35 |
| cuts_with_sfx_share | 0.083 | 0.35 |
| hook_duration | 4.98 | 0.7 |
| hook_words | 19.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 10.68 | 0.7 |
| numbers_per_10s | 0.62 | 0.6 |
| cut_word_alignment | 0.917 | 0.6 |
| cut_sentence_alignment | 0.667 | 0.6 |
| cuts_per_sentence | 1.09 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 1:04.93 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 25 shots; median 2.23s, mean 2.59s (min 0.13s, max 6.67s); 22.2 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.71 - **medium** _(opencv:shot-detection)_
- `0:33.10-0:33.23` shortest shot 0.13s - **high** _(opencv:shot-detection)_
- `0:48.73-0:55.40` longest shot 6.67s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.37 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `0:00.87-0:03.10` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:24.10-0:26.87` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:41.93-0:43.67` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:46.10-0:47.40` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:58.40-1:04.87` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 92% of cuts land on word boundaries, 67% on sentence boundaries; 1.1 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:00.87` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:03.43` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:03.97` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:07.50` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:13.57` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:17.87` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:22.60` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:24.10` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:31.90` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:37.23` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:40.50` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:41.93` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:43.67` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:47.40` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:48.73` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:55.40` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:58.40` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `whole video` transition mix: dissolve 54%, cut 29%, zoom_transition 12%, whip_or_blur 4% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 44%, zoom_out 22%, pan_right 9%, static 9%, pan_up 9%, pan_left 4%, pan_down 4% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:00.87` strong zoom in (38%/s) - **high** _(opencv:optical-flow)_
- `0:00.87-0:03.10` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:03.43-0:03.97` strong zoom in (17%/s) - **high** _(opencv:optical-flow)_
- `0:03.97-0:04.87` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:04.87-0:07.50` strong zoom in (20%/s) - **high** _(opencv:optical-flow)_
- `0:04.87-0:07.50` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:07.50-0:13.57` strong zoom in (7%/s) - **high** _(opencv:optical-flow)_
- `0:22.60-0:24.10` strong zoom out (-10%/s) - **high** _(opencv:optical-flow)_
- `0:24.10-0:26.87` strong zoom in (11%/s) - **high** _(opencv:optical-flow)_
- `0:31.90-0:33.10` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_
- `0:33.23-0:37.23` strong zoom out (-28%/s) - **high** _(opencv:optical-flow)_
- `0:37.23-0:40.50` strong zoom out (-8%/s) - **high** _(opencv:optical-flow)_
- `0:40.50-0:41.93` strong zoom in (40%/s) - **high** _(opencv:optical-flow)_
- `0:41.93-0:43.67` strong zoom in (10%/s) - **high** _(opencv:optical-flow)_
- `0:47.40-0:48.73` strong zoom in (51%/s) - **high** _(opencv:optical-flow)_
- `0:47.40-0:48.73` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:48.73-0:55.40` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:55.40-0:58.40` strong zoom out (-12%/s) - **high** _(opencv:optical-flow)_
- `0:58.40-1:04.87` strong zoom out (-19%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.43, contrast 0.18, saturation 0.41, warm temperature (b* +7.7) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #A47E6B (24%), #71544B (24%), #3D2F43 (21%), #E3BC9F (18%), #4E569F (13%) - **medium** _(opencv:k-means)_
- `whole video` Time-of-day lighting tells the story: warm sunset, blue moonlit night, orange dust cloud for the earthquake. - **medium** _(reviewer notes: contact_shots.jpg #12-#21)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 16%, full_bleed 84%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.49, y=0.48 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 84% of the video (164 caption changes, 151.5/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFEFF) - **high** _(opencv:caption-detector)_
- `whole video` dark outline on 87% of captions (~8px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.32, width/height 0.86). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: scale in 2%, scale down in 1% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 90% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept (e.g. 'Wait,', 'paradise.'); white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. No boxes, no emoji. - **high** _(reviewer notes: contact_shots.jpg and contact_captions.jpg, all shots)_
- `whole video` Font category: heavy geometric/rounded sans-serif (Poppins/Montserrat-like category). The exact font cannot be identified from the frames. - **low** _(reviewer notes: contact_captions.jpg glyph shapes)_

### Audio

- `whole video` integrated -14.0 LUFS, true peak -2.2 dBTP, LRA 2.2 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 88% of the runtime, first words at 0.0s; 31 pauses (median 0.23s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 246 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~14 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 53 effect-like events (49.02/min): whoosh/noise-sweep x9, impact/boom x44; 8% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:02.53` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.45` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.83` impact/boom - **low** _(audio:onset heuristics)_
- `0:06.09` impact/boom - **low** _(audio:onset heuristics)_
- `0:08.85` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:11.22` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.88` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.82` impact/boom - **low** _(audio:onset heuristics)_
- `0:16.43` impact/boom - **low** _(audio:onset heuristics)_
- `0:16.67` impact/boom - **low** _(audio:onset heuristics)_
- `0:18.21` impact/boom - **low** _(audio:onset heuristics)_
- `0:18.88` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.36` impact/boom - **low** _(audio:onset heuristics)_
- `0:20.37` impact/boom - **low** _(audio:onset heuristics)_
- `0:23.55` impact/boom - **low** _(audio:onset heuristics)_
- `0:23.65` impact/boom - **low** _(audio:onset heuristics)_
- `0:24.19` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:24.44` impact/boom - **low** _(audio:onset heuristics)_
- `0:25.04` impact/boom - **low** _(audio:onset heuristics)_
- `0:25.58` impact/boom - **low** _(audio:onset heuristics)_
- `0:27.07` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:27.67` impact/boom - **low** _(audio:onset heuristics)_
- `0:28.76` impact/boom - **low** _(audio:onset heuristics)_
- `0:29.16` impact/boom - **low** _(audio:onset heuristics)_
- `0:36.35` impact/boom - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:04.98` hook (5.0s, 19 words): "He put a bronze ball in a dragon's mouth and told the emperor, if this ever falls out, run!" - superlative/extreme claim - **medium** _(transcript + text rules)_
- `whole video` ending: "All eight meant the biggest earthquake the empire had ever seen was right underneath them." - reveal/twist, abrupt end right after last word - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.7|0.37 -> 3.51|0.46 -> 3.65|0.28 - **medium** _(transcript + shot detection)_
- `whole video` Historical mystery told as a mini-story; the final sentence is the reveal (the earthquake) and the video ends right after it. - **medium** _(reviewer notes: transcript ending)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style: medieval palace, army, city gate; key prop (bronze dragon jar with frogs) recurs throughout. - **high** _(reviewer notes: contact_shots.jpg, all 25 shots)_

### Motion

- `whole video` Close-up inserts on the key prop (dragon mouth, frog) alternate with wide establishing shots (palace hall, army, city). - **medium** _(reviewer notes: contact_shots.jpg #1, #7, #8, #22)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:00.87 | 0.87s | start | zoom_in |
| 1 | 0:00.87 | 0:03.10 | 2.23s | zoom_transition | pan_right |
| 2 | 0:03.10 | 0:03.43 | 0.33s | cut | unknown |
| 3 | 0:03.43 | 0:03.97 | 0.53s | dissolve | zoom_in |
| 4 | 0:03.97 | 0:04.87 | 0.90s | dissolve | pan_left |
| 5 | 0:04.87 | 0:07.50 | 2.63s | cut | zoom_in |
| 6 | 0:07.50 | 0:13.57 | 6.07s | dissolve | zoom_in |
| 7 | 0:13.57 | 0:17.87 | 4.30s | dissolve | static |
| 8 | 0:17.87 | 0:22.60 | 4.73s | dissolve | pan_right |
| 9 | 0:22.60 | 0:24.10 | 1.50s | dissolve | zoom_out |
| 10 | 0:24.10 | 0:26.87 | 2.77s | dissolve | zoom_in |
| 11 | 0:26.87 | 0:29.73 | 2.87s | cut | pan_down |
| 12 | 0:29.73 | 0:31.90 | 2.17s | cut | pan_up |
| 13 | 0:31.90 | 0:33.10 | 1.20s | dissolve | zoom_in |
| 14 | 0:33.10 | 0:33.23 | 0.13s | cut | unknown |
| 15 | 0:33.23 | 0:37.23 | 4.00s | cut | zoom_out |
| 16 | 0:37.23 | 0:40.50 | 3.27s | dissolve | zoom_out |
| 17 | 0:40.50 | 0:41.93 | 1.43s | dissolve | zoom_in |
| 18 | 0:41.93 | 0:43.67 | 1.73s | zoom_transition | zoom_in |
| 19 | 0:43.67 | 0:46.10 | 2.43s | dissolve | static |
| 20 | 0:46.10 | 0:47.40 | 1.30s | cut | pan_up |
| 21 | 0:47.40 | 0:48.73 | 1.33s | zoom_transition | zoom_in |
| 22 | 0:48.73 | 0:55.40 | 6.67s | dissolve | zoom_in |
| 23 | 0:55.40 | 0:58.40 | 3.00s | dissolve | zoom_out |
| 24 | 0:58.40 | 1:04.87 | 6.47s | whip_or_blur | zoom_out |

## Comparison with previous references

Compared with 2 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, numbers/statistics per 10 s, hook sentence length, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, shot-length variation (CV), 2nd-half / 1st-half shot length, cuts on word boundaries, cuts on sentence boundaries, cuts per narrated sentence, caption vertical position (0=top), caption letter height (frame fraction), words per caption, lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), contrast (L std), saturation, colourfulness, frames with faces, integrated loudness, true peak, effect-like events per minute, background bed below speech, frame layout, teal/orange split tone, vignette, most common camera move, caption zone, caption text colour, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration

**Different from earlier videos:**
- brightness (L): 0.43 vs typical 0.61 (Visual composition)
- colour temperature: warm vs usual neutral (Visual composition)
- caption text colour (hex): #FFFEFF vs usual #FDFAFD (Subtitle design)
- highlight style: none vs usual emphasis (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
