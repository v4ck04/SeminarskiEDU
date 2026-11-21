# Reference analysis: The_Difference_Between_Rich_And_Poor.mp4

- **Video id:** `the-difference-between-rich-and-poor-503075`  
- **Analyzed:** 2026-11-21T22:26:15+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/the-difference-between-rich-and-poor-503075/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 73.259 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 22.0 | 0.8 |
| shot_len_median | 2.45 | 0.8 |
| shot_len_mean | 3.3273 | 0.8 |
| cuts_per_min | 17.1993 | 0.8 |
| shot_len_cv | 1.0863 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.2847 | 0.8 |
| pace_change_ratio | 0.8202 | 0.64 |
| transition_share_cut | 0.5714 | 0.7 |
| transition_share_dissolve | 0.3333 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0952 | 0.5 |
| transition_share_zoom_transition | 0.0 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.647 | 0.6 |
| motion_share_zoom_out | 0.176 | 0.6 |
| motion_share_pan_left | 0.059 | 0.6 |
| motion_share_pan_right | 0.059 | 0.6 |
| motion_share_pan_up | 0.0 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.059 | 0.6 |
| moving_shot_share | 0.941 | 0.6 |
| zoom_rate_median | 0.1259 | 0.55 |
| shake_share | 0.353 | 0.45 |
| animated_still_share | 0.235 | 0.45 |
| brightness | 0.6355 | 0.7 |
| contrast | 0.2001 | 0.7 |
| saturation | 0.4458 | 0.7 |
| colorfulness | 70.6956 | 0.65 |
| warmth | 5.8077 | 0.6 |
| vignette_share | 0.136 | 0.4 |
| shot_brightness_std | 0.098 | 0.5 |
| face_frame_share | 0.218 | 0.55 |
| caption_coverage | 0.758 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 129.4 | 0.85 |
| caption_y | 0.7022 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.152 | 0.85 |
| caption_outline_share | 0.778 | 0.85 |
| caption_outline_frac | 0.0042 | 0.59 |
| caption_caps_share | 0.219 | 0.5 |
| caption_stroke_ratio | 0.2791 | 0.45 |
| caption_char_aspect | 0.8342 | 0.45 |
| lufs | -14.1 | 0.95 |
| true_peak | -1.03 | 0.95 |
| speech_ratio | 0.798 | 0.85 |
| pause_median | 0.33 | 0.85 |
| pauses_per_min | 44.16 | 0.85 |
| wpm | 260.9 | 0.85 |
| bed_below_speech_db | 12.7 | 0.6 |
| sfx_per_min | 33.59 | 0.35 |
| cuts_with_sfx_share | 0.143 | 0.35 |
| hook_duration | 3.06 | 0.7 |
| hook_words | 12.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 8.47 | 0.7 |
| numbers_per_10s | 0.96 | 0.6 |
| cut_word_alignment | 0.667 | 0.6 |
| cut_sentence_alignment | 0.619 | 0.6 |
| cuts_per_sentence | 0.7 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 1:13.26 long, 1080x1920 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 22 shots; median 2.45s, mean 3.33s (min 0.13s, max 15.77s); 17.2 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 1.09 - **medium** _(opencv:shot-detection)_
- `0:44.33-0:44.47` shortest shot 0.13s - **high** _(opencv:shot-detection)_
- `0:01.70-0:17.47` longest shot 15.77s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.28 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `0:29.53-0:36.93` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:41.00-0:43.43` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:58.20-1:01.53` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `1:01.83-1:04.30` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 67% of cuts land on word boundaries, 62% on sentence boundaries; 0.7 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:01.70` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `0:17.70` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:22.17` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:29.53` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:36.93` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:49.70` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:55.10` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:58.20` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `1:12.33` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `whole video` transition mix: cut 57%, dissolve 33%, whip_or_blur 10% - **medium** _(opencv:transition-detection)_
- `whole video` Visible dissolves between scenes (ghosted double images) and heavy horizontal motion blur on fast camera moves. - **high** _(reviewer notes: contact_shots.jpg #2, #4, #5, #6, #12, #14, #17)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 65%, zoom_out 18%, pan_left 6%, static 6%, pan_right 6% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:01.70` strong zoom in (45%/s) - **high** _(opencv:optical-flow)_
- `0:22.17-0:29.53` strong zoom in (21%/s) - **high** _(opencv:optical-flow)_
- `0:29.53-0:36.93` strong zoom in (13%/s) - **high** _(opencv:optical-flow)_
- `0:29.53-0:36.93` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:36.93-0:41.00` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_
- `0:41.00-0:43.43` strong zoom in (37%/s) - **high** _(opencv:optical-flow)_
- `0:41.00-0:43.43` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:43.43-0:44.33` strong zoom out (-29%/s) - **medium** _(opencv:optical-flow)_
- `0:43.43-0:44.33` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:55.10-0:58.20` strong zoom in (10%/s) - **high** _(opencv:optical-flow)_
- `0:58.20-1:01.53` strong zoom out (-39%/s) - **high** _(opencv:optical-flow)_
- `1:01.83-1:04.30` strong zoom in (12%/s) - **high** _(opencv:optical-flow)_
- `1:04.30-1:05.37` strong zoom in (21%/s) - **high** _(opencv:optical-flow)_
- `1:04.30-1:05.37` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `1:05.37-1:12.33` strong zoom out (-9%/s) - **high** _(opencv:optical-flow)_
- `1:05.37-1:12.33` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `1:12.33-1:13.20` strong zoom in (12%/s) - **high** _(opencv:optical-flow)_
- `1:12.33-1:13.20` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_

### Color

- `whole video` brightness L 0.64, contrast 0.20, saturation 0.45, neutral temperature (b* +5.8) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #CEC4B6 (31%), #8F603C (20%), #C29658 (19%), #8C9BB2 (18%), #4D373F (12%) - **medium** _(opencv:k-means)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 14%, full_bleed 86%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.49, y=0.59 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 76% of the video (158 caption changes, 129.4/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FDFAFD) - **high** _(opencv:caption-detector)_
- `whole video` 15% of captions highlight words in orange (#CF9135) - **medium** _(opencv:caption colour clusters)_
- `whole video` dark outline on 78% of captions (~5px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.28, width/height 0.83). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: scale in 1%, slide in 4%, scale down in 2%, fade in 1% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 80% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept (e.g. 'Wait,', 'paradise.'); white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. No boxes, no emoji. - **high** _(reviewer notes: contact_shots.jpg and contact_captions.jpg, all shots)_
- `whole video` Font category: heavy geometric/rounded sans-serif (Poppins/Montserrat-like category). The exact font cannot be identified from the frames. - **low** _(reviewer notes: contact_captions.jpg glyph shapes)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -1.0 dBTP, LRA 2.5 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 80% of the runtime, first words at 0.0s; 43 pauses (median 0.33s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 261 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~13 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 41 effect-like events (33.59/min): whoosh/noise-sweep x8, impact/boom x33; 14% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:00.94` impact/boom - **low** _(audio:onset heuristics)_
- `0:01.98` impact/boom - **low** _(audio:onset heuristics)_
- `0:03.44` impact/boom - **low** _(audio:onset heuristics)_
- `0:03.60` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.89` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.90` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:08.24` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:09.54` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:20.85` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:22.56` impact/boom - **low** _(audio:onset heuristics)_
- `0:24.19` impact/boom - **low** _(audio:onset heuristics)_
- `0:26.88` impact/boom - **low** _(audio:onset heuristics)_
- `0:27.64` impact/boom - **low** _(audio:onset heuristics)_
- `0:30.12` impact/boom - **low** _(audio:onset heuristics)_
- `0:30.48` impact/boom - **low** _(audio:onset heuristics)_
- `0:31.88` impact/boom - **low** _(audio:onset heuristics)_
- `0:32.03` impact/boom - **low** _(audio:onset heuristics)_
- `0:32.36` impact/boom - **low** _(audio:onset heuristics)_
- `0:33.95` impact/boom - **low** _(audio:onset heuristics)_
- `0:38.21` impact/boom - **low** _(audio:onset heuristics)_
- `0:39.73` impact/boom - **low** _(audio:onset heuristics)_
- `0:41.77` impact/boom - **low** _(audio:onset heuristics)_
- `0:42.22` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:42.92` impact/boom - **low** _(audio:onset heuristics)_
- `0:45.32` impact/boom - **low** _(audio:onset heuristics)_
- `whole video` fades in, ends abruptly - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:03.06` hook (3.1s, 12 words): "Why do the rich keep getting richer while the poor get poorer?" - question, curiosity gap - **medium** _(transcript + text rules)_
- `whole video` ending: "The poor, the middle class, and the rich." - loops back to the opening - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.11|0.2 -> 3.73|0.25 -> 3.56|0.41 - **medium** _(transcript + shot detection)_
- `whole video` Question hook, metaphor-driven explanation, and an ending that loops back to the three groups named at the start. - **medium** _(reviewer notes: transcript hook and ending)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style; an economics explainer told through a metaphor (eggs and chickens) with diagrams drawn inside the scene (chalkboard '2 = egg'). - **high** _(reviewer notes: contact_shots.jpg, all 22 shots)_

### Overlays

- `whole video` Story text appears as in-scene signs ('UNFAIR!', 'BOO!', 'WE WANT EGGS') rather than overlay graphics. - **medium** _(reviewer notes: contact_shots.jpg #14, #17, #18)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:01.70 | 1.70s | start | zoom_in |
| 1 | 0:01.70 | 0:17.47 | 15.77s | whip_or_blur | pan_left |
| 2 | 0:17.47 | 0:17.70 | 0.23s | cut | unknown |
| 3 | 0:17.70 | 0:21.93 | 4.23s | dissolve | static |
| 4 | 0:21.93 | 0:22.17 | 0.23s | cut | unknown |
| 5 | 0:22.17 | 0:29.53 | 7.37s | dissolve | zoom_in |
| 6 | 0:29.53 | 0:36.93 | 7.40s | dissolve | zoom_in |
| 7 | 0:36.93 | 0:41.00 | 4.07s | dissolve | zoom_in |
| 8 | 0:41.00 | 0:43.43 | 2.43s | cut | zoom_in |
| 9 | 0:43.43 | 0:44.33 | 0.90s | cut | zoom_out |
| 10 | 0:44.33 | 0:44.47 | 0.13s | cut | unknown |
| 11 | 0:44.47 | 0:49.47 | 5.00s | cut | pan_right |
| 12 | 0:49.47 | 0:49.70 | 0.23s | cut | unknown |
| 13 | 0:49.70 | 0:54.87 | 5.17s | dissolve | zoom_in |
| 14 | 0:54.87 | 0:55.10 | 0.23s | cut | unknown |
| 15 | 0:55.10 | 0:58.20 | 3.10s | dissolve | zoom_in |
| 16 | 0:58.20 | 1:01.53 | 3.33s | dissolve | zoom_out |
| 17 | 1:01.53 | 1:01.83 | 0.30s | cut | zoom_in |
| 18 | 1:01.83 | 1:04.30 | 2.47s | cut | zoom_in |
| 19 | 1:04.30 | 1:05.37 | 1.07s | cut | zoom_in |
| 20 | 1:05.37 | 1:12.33 | 6.97s | cut | zoom_out |
| 21 | 1:12.33 | 1:13.20 | 0.87s | whip_or_blur | zoom_in |

## Comparison with previous references

Compared with 2 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, hook sentence length, hook word count, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, cuts on sentence boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, dissolves, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), contrast (L std), saturation, colourfulness, warmth (Lab b*), frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, background bed below speech, frame layout, teal/orange split tone, vignette, most common camera move, caption zone, caption text colour, highlight style, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- shot-length variation (CV): 1.09 vs typical 0.61 (Scene duration patterns)
- colour temperature: neutral vs usual warm (Visual composition)
- caption text colour (hex): #FDFAFD vs usual #FFFEFF (Subtitle design)
- highlight colour: orange vs usual green (Subtitle design)
- highlight colour (hex): #CF9135 vs usual #8EBE8C (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
