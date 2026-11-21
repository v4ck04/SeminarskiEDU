# Reference analysis: The_Job_Nobody_Wants_in_Japan.mp4

- **Video id:** `the-job-nobody-wants-in-japan-3769b4`  
- **Analyzed:** 2026-11-21T22:26:58+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/the-job-nobody-wants-in-japan-3769b4/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 60.591 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 21.0 | 0.8 |
| shot_len_median | 2.667 | 0.8 |
| shot_len_mean | 2.8825 | 0.8 |
| cuts_per_min | 19.8049 | 0.8 |
| shot_len_cv | 0.5107 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.3299 | 0.8 |
| pace_change_ratio | 1.3479 | 0.64 |
| transition_share_cut | 0.55 | 0.7 |
| transition_share_dissolve | 0.3 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.05 | 0.5 |
| transition_share_zoom_transition | 0.1 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.6 | 0.6 |
| motion_share_zoom_out | 0.2 | 0.6 |
| motion_share_pan_left | 0.0 | 0.6 |
| motion_share_pan_right | 0.15 | 0.6 |
| motion_share_pan_up | 0.05 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.0 | 0.6 |
| moving_shot_share | 1.0 | 0.6 |
| zoom_rate_median | 0.3143 | 0.55 |
| shake_share | 0.2 | 0.45 |
| animated_still_share | 0.1 | 0.45 |
| brightness | 0.5802 | 0.7 |
| contrast | 0.1993 | 0.7 |
| saturation | 0.4042 | 0.7 |
| colorfulness | 76.959 | 0.65 |
| warmth | -11.4529 | 0.6 |
| vignette_share | 0.221 | 0.4 |
| shot_brightness_std | 0.1127 | 0.5 |
| face_frame_share | 0.205 | 0.55 |
| caption_coverage | 0.512 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 94.1 | 0.85 |
| caption_y | 0.7047 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.189 | 0.85 |
| caption_outline_share | 0.884 | 0.85 |
| caption_outline_frac | 0.0074 | 0.59 |
| caption_caps_share | 0.072 | 0.5 |
| caption_stroke_ratio | 0.3518 | 0.45 |
| caption_char_aspect | 0.8651 | 0.45 |
| lufs | -14.06 | 0.95 |
| true_peak | -2.08 | 0.95 |
| speech_ratio | 0.865 | 0.85 |
| pause_median | 0.25 | 0.85 |
| pauses_per_min | 34.36 | 0.85 |
| wpm | 256.6 | 0.85 |
| bed_below_speech_db | 10.7 | 0.6 |
| sfx_per_min | 70.38 | 0.35 |
| cuts_with_sfx_share | 0.55 | 0.35 |
| hook_duration | 4.22 | 0.7 |
| hook_words | 13.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 13.18 | 0.7 |
| numbers_per_10s | 0.5 | 0.6 |
| cut_word_alignment | 0.95 | 0.6 |
| cut_sentence_alignment | 0.45 | 0.6 |
| cuts_per_sentence | 1.18 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 1:00.59 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 21 shots; median 2.67s, mean 2.88s (min 0.13s, max 6.43s); 19.8 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.51 - **medium** _(opencv:shot-detection)_
- `0:28.67-0:28.80` shortest shot 0.13s - **high** _(opencv:shot-detection)_
- `0:54.10-1:00.53` longest shot 6.43s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.33 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `whole video` shots in the second half are longer (median ratio 1.35) - **medium** _(opencv:shot-detection)_
- `0:09.47-0:13.83` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:25.70-0:28.67` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:28.80-0:33.43` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:36.47-0:39.60` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:42.63-0:45.30` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 95% of cuts land on word boundaries, 45% on sentence boundaries; 1.2 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:02.17` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `0:04.67` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:09.47` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:25.70` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:36.47` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:39.60` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:45.30` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:47.60` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:49.63` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 55%, dissolve 30%, zoom_transition 10%, whip_or_blur 5% - **medium** _(opencv:transition-detection)_
- `0:28.70` Calendar-page overlay with a crossfade signals time passing. - **medium** _(reviewer notes: contact_shots.jpg #11)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 60%, zoom_out 20%, pan_right 15%, pan_up 5% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:02.17` strong zoom in (32%/s) - **high** _(opencv:optical-flow)_
- `0:00.00-0:02.17` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:02.17-0:04.67` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:04.67-0:09.47` strong zoom in (31%/s) - **high** _(opencv:optical-flow)_
- `0:09.47-0:13.83` strong zoom out (-39%/s) - **high** _(opencv:optical-flow)_
- `0:13.83-0:16.17` strong zoom in (14%/s) - **high** _(opencv:optical-flow)_
- `0:16.17-0:17.50` strong zoom in (16%/s) - **high** _(opencv:optical-flow)_
- `0:17.50-0:19.27` strong zoom in (69%/s) - **high** _(opencv:optical-flow)_
- `0:19.27-0:20.17` strong zoom in (12%/s) - **high** _(opencv:optical-flow)_
- `0:20.17-0:21.50` strong zoom in (14%/s) - **high** _(opencv:optical-flow)_
- `0:21.50-0:25.70` strong zoom in (68%/s) - **high** _(opencv:optical-flow)_
- `0:21.50-0:25.70` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:25.70-0:28.67` strong zoom out (-68%/s) - **high** _(opencv:optical-flow)_
- `0:33.43-0:36.47` strong zoom out (-14%/s) - **high** _(opencv:optical-flow)_
- `0:36.47-0:39.60` strong zoom out (-45%/s) - **high** _(opencv:optical-flow)_
- `0:39.60-0:42.63` strong zoom in (32%/s) - **high** _(opencv:optical-flow)_
- `0:45.30-0:47.60` strong zoom in (26%/s) - **high** _(opencv:optical-flow)_
- `0:47.60-0:49.63` strong zoom in (49%/s) - **high** _(opencv:optical-flow)_
- `0:47.60-0:49.63` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:54.10-1:00.53` strong zoom in (18%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.58, contrast 0.20, saturation 0.40, cool temperature (b* -11.5) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` cool shadows with warm highlights (teal/orange-style grade) - **low** _(opencv:Lab split-tone)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #9AA073 (24%), #7781AE (23%), #D9D4D8 (19%), #283DA9 (18%), #503B49 (15%) - **medium** _(opencv:k-means)_
- `whole video` Bright, saturated cartoon palette (blues/greens); a night skyline marks a time jump. - **medium** _(reviewer notes: contact_shots.jpg #14)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 35%, full_bleed 65%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.49, y=0.52 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 51% of the video (95 caption changes, 94.1/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFFFF) - **high** _(opencv:caption-detector)_
- `whole video` 19% of captions highlight words in green (#8EC28B) - **medium** _(opencv:caption colour clusters)_
- `whole video` dark outline on 88% of captions (~8px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.35, width/height 0.87). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: scale in 4%, slide in 2%, scale down in 2% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 84% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept (e.g. 'Wait,', 'paradise.'); white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. No boxes, no emoji. - **high** _(reviewer notes: contact_shots.jpg and contact_captions.jpg, all shots)_
- `whole video` Font category: heavy geometric/rounded sans-serif (Poppins/Montserrat-like category). The exact font cannot be identified from the frames. - **low** _(reviewer notes: contact_captions.jpg glyph shapes)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -2.1 dBTP, LRA 1.8 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 86% of the runtime, first words at 0.0s; 30 pauses (median 0.25s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 257 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~11 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 71 effect-like events (70.38/min): whoosh/noise-sweep x20, impact/boom x51; 55% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:03.06` impact/boom - **low** _(audio:onset heuristics)_
- `0:03.28` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.27` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:04.72` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:05.76` impact/boom - **low** _(audio:onset heuristics)_
- `0:06.37` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:09.40` whoosh/noise-sweep (at a cut) - **low** _(audio:onset heuristics)_
- `0:10.60` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.58` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:13.91` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:16.22` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:16.88` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:17.14` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:17.37` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:18.32` impact/boom - **low** _(audio:onset heuristics)_
- `0:18.96` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.07` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.63` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:19.66` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.77` impact/boom - **low** _(audio:onset heuristics)_
- `0:20.41` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:20.52` impact/boom - **low** _(audio:onset heuristics)_
- `0:20.78` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:20.89` impact/boom - **low** _(audio:onset heuristics)_
- `0:21.47` whoosh/noise-sweep (at a cut) - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:04.22` hook (4.2s, 13 words): "It's impossible to get fired in Japan, but companies found something way worse." - contrarian/negation - **medium** _(transcript + text rules)_
- `whole video` ending: "So they take away your work and your friends, and just wait because nobody can do nothing forever." - statement/conclusion - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.66|0.4 -> 3.86|0.35 -> 3.56|0.25 - **medium** _(transcript + shot detection)_
- `whole video` Hook states a paradox in one sentence, then escalates with concrete consequences; narration runs continuously over constant visual changes. - **medium** _(reviewer notes: transcript + contact_timeline.jpg)_

### Footage

- `whole video` Original 3D cartoon animation, not stock footage: recurring round-headed characters with dot eyes and thin limbs in detailed isometric office sets. - **high** _(reviewer notes: contact_shots.jpg, all 21 shots)_

### Motion

- `whole video` Virtual 3D camera moves: push-ins, top-down and low angles, face close-ups; perspective changes rather than flat 2D zooms. - **medium** _(reviewer notes: contact_shots.jpg #3, #7, #8, #14)_

### Overlays

- `whole video` No overlay graphics, stickers or progress bar; text appears inside the scene (door sign, calendar, FIRE button). - **medium** _(reviewer notes: contact_shots.jpg #0, #2, #11)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:02.17 | 2.17s | start | zoom_in |
| 1 | 0:02.17 | 0:04.67 | 2.50s | whip_or_blur | pan_up |
| 2 | 0:04.67 | 0:09.47 | 4.80s | dissolve | zoom_in |
| 3 | 0:09.47 | 0:13.83 | 4.37s | dissolve | zoom_out |
| 4 | 0:13.83 | 0:16.17 | 2.33s | cut | zoom_in |
| 5 | 0:16.17 | 0:17.50 | 1.33s | cut | zoom_in |
| 6 | 0:17.50 | 0:19.27 | 1.77s | cut | zoom_in |
| 7 | 0:19.27 | 0:20.17 | 0.90s | cut | zoom_in |
| 8 | 0:20.17 | 0:21.50 | 1.33s | cut | zoom_in |
| 9 | 0:21.50 | 0:25.70 | 4.20s | cut | zoom_in |
| 10 | 0:25.70 | 0:28.67 | 2.97s | dissolve | zoom_out |
| 11 | 0:28.67 | 0:28.80 | 0.13s | cut | unknown |
| 12 | 0:28.80 | 0:33.43 | 4.63s | cut | pan_right |
| 13 | 0:33.43 | 0:36.47 | 3.03s | cut | zoom_out |
| 14 | 0:36.47 | 0:39.60 | 3.13s | zoom_transition | zoom_out |
| 15 | 0:39.60 | 0:42.63 | 3.03s | dissolve | zoom_in |
| 16 | 0:42.63 | 0:45.30 | 2.67s | cut | pan_right |
| 17 | 0:45.30 | 0:47.60 | 2.30s | dissolve | zoom_in |
| 18 | 0:47.60 | 0:49.63 | 2.03s | zoom_transition | zoom_in |
| 19 | 0:49.63 | 0:54.10 | 4.47s | dissolve | pan_right |
| 20 | 0:54.10 | 1:00.53 | 6.43s | cut | zoom_in |

## Comparison with previous references

Compared with 2 earlier reference(s).

**Consistent with earlier videos:** video length, numbers/statistics per 10 s, hook sentence length, hook word count, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, cuts on word boundaries, cuts on sentence boundaries, cuts per narrated sentence, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, hard cuts, dissolves, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, shots with shake, animated still images (Ken Burns), brightness (L), contrast (L std), saturation, colourfulness, frames with faces, integrated loudness, true peak, background bed below speech, frame layout, vignette, most common camera move, caption zone, caption text colour, highlight style, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- zoom speed: 31.4%/s vs typical 12.3%/s (Camera movement)
- warmth (Lab b*): -11.5 vs typical +6.7 (Visual composition)
- colour temperature: cool vs usual warm (Visual composition)
- teal/orange split tone: True vs usual False (Visual composition)
- caption text colour (hex): #FFFFFF vs usual #FFFEFF (Subtitle design)
- highlight colour: green vs usual orange (Subtitle design)
- highlight colour (hex): #8EC28B vs usual #CF9135 (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
