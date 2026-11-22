# Reference analysis: Why_Astronauts_Cant_Flush_in_Space.mp4

- **Video id:** `why-astronauts-cant-flush-in-space-2bb775`  
- **Analyzed:** 2026-11-22T09:33:10+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/why-astronauts-cant-flush-in-space-2bb775/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 61.2876 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 20.0 | 0.8 |
| shot_len_median | 2.05 | 0.8 |
| shot_len_mean | 3.0617 | 0.8 |
| cuts_per_min | 18.6008 | 0.8 |
| shot_len_cv | 0.7973 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.3088 | 0.8 |
| pace_change_ratio | 0.7656 | 0.64 |
| transition_share_cut | 0.7368 | 0.7 |
| transition_share_dissolve | 0.2105 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0 | 0.5 |
| transition_share_zoom_transition | 0.0526 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.45 | 0.6 |
| motion_share_zoom_out | 0.35 | 0.6 |
| motion_share_pan_left | 0.05 | 0.6 |
| motion_share_pan_right | 0.05 | 0.6 |
| motion_share_pan_up | 0.05 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.05 | 0.6 |
| moving_shot_share | 0.95 | 0.6 |
| zoom_rate_median | 0.1022 | 0.55 |
| shake_share | 0.1 | 0.45 |
| animated_still_share | 0.25 | 0.45 |
| brightness | 0.244 | 0.7 |
| contrast | 0.2366 | 0.7 |
| saturation | 0.5159 | 0.7 |
| colorfulness | 38.3023 | 0.65 |
| warmth | -10.5349 | 0.6 |
| vignette_share | 0.691 | 0.4 |
| shot_brightness_std | 0.1006 | 0.5 |
| face_frame_share | 0.26 | 0.55 |
| caption_coverage | 0.924 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 153.7 | 0.85 |
| caption_y | 0.7042 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.07 | 0.85 |
| caption_outline_share | 0.745 | 0.85 |
| caption_outline_frac | 0.0083 | 0.59 |
| caption_caps_share | 0.112 | 0.5 |
| caption_stroke_ratio | 0.3183 | 0.45 |
| caption_char_aspect | 0.9048 | 0.45 |
| lufs | -14.11 | 0.95 |
| true_peak | -1.78 | 0.95 |
| speech_ratio | 0.903 | 0.85 |
| pause_median | 0.235 | 0.85 |
| pauses_per_min | 23.87 | 0.85 |
| wpm | 222.5 | 0.85 |
| bed_below_speech_db | 9.1 | 0.6 |
| sfx_per_min | 96.03 | 0.35 |
| cuts_with_sfx_share | 0.421 | 0.35 |
| hook_duration | 3.6 | 0.7 |
| hook_words | 15.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 11.39 | 0.7 |
| numbers_per_10s | 0.33 | 0.6 |
| cut_word_alignment | 0.842 | 0.6 |
| cut_sentence_alignment | 0.316 | 0.6 |
| cuts_per_sentence | 1.06 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 1:01.29 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 20 shots; median 2.05s, mean 3.06s (min 0.40s, max 9.23s); 18.6 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.80 - **medium** _(opencv:shot-detection)_
- `0:57.53-0:57.93` shortest shot 0.40s - **high** _(opencv:shot-detection)_
- `0:42.83-0:52.07` longest shot 9.23s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.31 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `whole video` shots in the second half are shorter (median ratio 0.77) - **medium** _(opencv:shot-detection)_
- `0:01.20-0:08.83` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:08.83-0:13.83` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:28.93-0:33.43` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:34.53-0:40.13` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:52.07-0:55.77` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 84% of cuts land on word boundaries, 32% on sentence boundaries; 1.1 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:01.20` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:13.83` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:17.70` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:34.53` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:42.83` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 74%, dissolve 21%, zoom_transition 5% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 45%, zoom_out 35%, pan_right 5%, pan_left 5%, pan_up 5%, static 5% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:01.20` strong zoom out (-9%/s) - **high** _(opencv:optical-flow)_
- `0:01.20-0:08.83` strong zoom out (-19%/s) - **high** _(opencv:optical-flow)_
- `0:08.83-0:13.83` strong zoom out (-20%/s) - **high** _(opencv:optical-flow)_
- `0:16.63-0:17.70` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:17.70-0:23.80` strong zoom out (-17%/s) - **high** _(opencv:optical-flow)_
- `0:25.77-0:26.80` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:26.80-0:28.93` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:28.93-0:33.43` strong zoom out (-60%/s) - **high** _(opencv:optical-flow)_
- `0:28.93-0:33.43` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:33.43-0:34.53` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_
- `0:34.53-0:40.13` strong zoom in (64%/s) - **high** _(opencv:optical-flow)_
- `0:40.13-0:42.83` strong zoom in (7%/s) - **high** _(opencv:optical-flow)_
- `0:40.13-0:42.83` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:42.83-0:52.07` strong zoom out (-15%/s) - **high** _(opencv:optical-flow)_
- `0:52.07-0:55.77` strong zoom in (13%/s) - **high** _(opencv:optical-flow)_
- `0:57.93-0:59.43` strong zoom in (11%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.24, contrast 0.24, saturation 0.52, cool temperature (b* -10.5) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` corners consistently darker than centre (vignette likely) - **low** _(opencv:corner/centre luminance)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #0B0A21 (35%), #2D2B3E (30%), #58556E (18%), #9E8E8B (11%), #D4D6D4 (7%) - **medium** _(opencv:k-means)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 19%, full_bleed 81%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` faces visible in 26% of sampled frames, typically at y=0.48 - **medium** _(opencv:face detector (YuNet/Haar))_
- `whole video` visual detail centred at x=0.50, y=0.52 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 92% of the video (157 caption changes, 153.7/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFEFF) - **high** _(opencv:caption-detector)_
- `whole video` dark outline on 74% of captions (~9px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.32, width/height 0.90). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: slide in 1%, fade in 1%, scale down in 2%, scale in 2% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 88% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept; white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. - **high** _(reviewer notes: contact_shots.jpg, all shots)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -1.8 dBTP, LRA 1.9 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 90% of the runtime, first words at 0.0s; 22 pauses (median 0.235s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 222 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~9 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 98 effect-like events (96.03/min): impact/boom x61, whoosh/noise-sweep x36, riser x1; 42% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:00.85` impact/boom - **low** _(audio:onset heuristics)_
- `0:01.12` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:01.43` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:01.72` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:01.85` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.07` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.53` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.79` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.77` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:08.46` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.04` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.37` impact/boom - **low** _(audio:onset heuristics)_
- `0:14.28` impact/boom - **low** _(audio:onset heuristics)_
- `0:14.96` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:16.66` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:16.89` impact/boom - **low** _(audio:onset heuristics)_
- `0:17.34` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:17.71` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:18.89` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.00` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.11` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.20` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.32` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.70` riser - **low** _(audio:onset heuristics)_
- `0:20.23` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:03.60` hook (3.6s, 15 words): "If you flush the toilet on a spaceship, you'll never make it back to Earth." - direct address (you), superlative/extreme claim, conditional consequence (if you...) - **medium** _(transcript + text rules)_
- `whole video` ending: "And because there's no GPS out here, the only way to find home is by lining up the real stars." - statement/conclusion - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.52|0.24 -> 3.18|0.34 -> 3.33|0.34 - **medium** _(transcript + shot detection)_
- `whole video` Ends on a calm payoff line about navigating home by the stars. - **medium** _(reviewer notes: transcript ending + contact_shots.jpg #16-#19)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style: spaceship interior, crew, mission control and exterior space shots. - **high** _(reviewer notes: contact_shots.jpg, all 20 shots)_

### Overlays

- `whole video` On-screen information appears on props in the scene ('OFF COURSE' console, phone showing 'No GPS Signal', 'NO FLUSHING TONIGHT' sign). - **high** _(reviewer notes: contact_shots.jpg #2, #8, #15)_

### Motion

- `whole video` Interior character shots alternate with wide exterior shots of the ship among stars. - **medium** _(reviewer notes: contact_shots.jpg #9, #12, #13, #19)_

### Hook

- `0:00.00-0:03.60` Hook is a single concrete paradox stated immediately: "If you flush the toilet on a spaceship, you'll never make it back to Earth." - **high** _(reviewer notes: transcript, first sentence)_

### Ending

- `whole video` Ends on a concrete payoff that resolves the hook, no call to action: "And because there's no GPS out here, the only way to find home is by lining up the real stars." - **high** _(reviewer notes: transcript, last sentence)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:01.20 | 1.20s | start | zoom_out |
| 1 | 0:01.20 | 0:08.83 | 7.63s | zoom_transition | zoom_out |
| 2 | 0:08.83 | 0:13.83 | 5.00s | cut | zoom_out |
| 3 | 0:13.83 | 0:16.63 | 2.80s | dissolve | pan_right |
| 4 | 0:16.63 | 0:17.70 | 1.07s | cut | zoom_in |
| 5 | 0:17.70 | 0:23.80 | 6.10s | dissolve | zoom_out |
| 6 | 0:23.80 | 0:25.77 | 1.97s | cut | pan_left |
| 7 | 0:25.77 | 0:26.80 | 1.03s | cut | zoom_in |
| 8 | 0:26.80 | 0:28.93 | 2.13s | cut | zoom_in |
| 9 | 0:28.93 | 0:33.43 | 4.50s | cut | zoom_out |
| 10 | 0:33.43 | 0:34.53 | 1.10s | cut | zoom_in |
| 11 | 0:34.53 | 0:40.13 | 5.60s | dissolve | zoom_in |
| 12 | 0:40.13 | 0:42.83 | 2.70s | cut | zoom_in |
| 13 | 0:42.83 | 0:52.07 | 9.23s | dissolve | zoom_out |
| 14 | 0:52.07 | 0:55.77 | 3.70s | cut | zoom_in |
| 15 | 0:55.77 | 0:57.53 | 1.77s | cut | pan_up |
| 16 | 0:57.53 | 0:57.93 | 0.40s | cut | zoom_in |
| 17 | 0:57.93 | 0:59.43 | 1.50s | cut | zoom_in |
| 18 | 0:59.43 | 1:00.17 | 0.73s | cut | static |
| 19 | 1:00.17 | 1:01.23 | 1.07s | cut | zoom_out |

## Comparison with previous references

Compared with 6 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, numbers/statistics per 10 s, hook sentence length, hook word count, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, shot-length variation (CV), 2nd-half / 1st-half shot length, cuts on word boundaries, cuts on sentence boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, hard cuts, dissolves, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), contrast (L std), saturation, frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, background bed below speech, frame layout, teal/orange split tone, most common camera move, caption zone, caption text colour, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- brightness (L): 0.24 vs typical 0.48 (Visual composition)
- colour temperature: cool vs usual neutral (Visual composition)
- vignette: True vs usual False (Visual composition)
- caption text colour (hex): #FFFEFF vs usual #FFFFFF (Subtitle design)
- highlight style: none vs usual emphasis (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
