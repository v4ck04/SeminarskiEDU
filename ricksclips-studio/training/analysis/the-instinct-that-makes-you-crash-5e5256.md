# Reference analysis: The_Instinct_That_Makes_You_Crash.mp4

- **Video id:** `the-instinct-that-makes-you-crash-5e5256`  
- **Analyzed:** 2026-11-22T09:30:55+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/the-instinct-that-makes-you-crash-5e5256/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 59.5229 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 20.0 | 0.8 |
| shot_len_median | 2.7 | 0.8 |
| shot_len_mean | 2.9733 | 0.8 |
| cuts_per_min | 19.1523 | 0.8 |
| shot_len_cv | 0.611 | 0.72 |
| hook_cuts_per_s | 0.0 | 0.8 |
| body_cuts_per_s | 0.3361 | 0.8 |
| pace_change_ratio | 0.9756 | 0.64 |
| transition_share_cut | 0.8947 | 0.7 |
| transition_share_dissolve | 0.1053 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0 | 0.5 |
| transition_share_zoom_transition | 0.0 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.55 | 0.6 |
| motion_share_zoom_out | 0.4 | 0.6 |
| motion_share_pan_left | 0.0 | 0.6 |
| motion_share_pan_right | 0.05 | 0.6 |
| motion_share_pan_up | 0.0 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.0 | 0.6 |
| moving_shot_share | 1.0 | 0.6 |
| zoom_rate_median | 0.12 | 0.55 |
| shake_share | 0.05 | 0.45 |
| animated_still_share | 0.25 | 0.45 |
| brightness | 0.4984 | 0.7 |
| contrast | 0.2095 | 0.7 |
| saturation | 0.2821 | 0.7 |
| colorfulness | 49.8003 | 0.65 |
| warmth | 5.4904 | 0.6 |
| vignette_share | 0.504 | 0.4 |
| shot_brightness_std | 0.1412 | 0.5 |
| face_frame_share | 0.092 | 0.55 |
| caption_coverage | 0.778 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 145.2 | 0.85 |
| caption_y | 0.7042 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.083 | 0.85 |
| caption_outline_share | 0.903 | 0.85 |
| caption_outline_frac | 0.0074 | 0.59 |
| caption_caps_share | 0.091 | 0.5 |
| caption_stroke_ratio | 0.3279 | 0.45 |
| caption_char_aspect | 0.8514 | 0.45 |
| lufs | -14.12 | 0.95 |
| true_peak | -2.12 | 0.95 |
| speech_ratio | 0.907 | 0.85 |
| pause_median | 0.23 | 0.85 |
| pauses_per_min | 24.48 | 0.85 |
| wpm | 242.6 | 0.85 |
| bed_below_speech_db | 4.8 | 0.6 |
| sfx_per_min | 79.72 | 0.35 |
| cuts_with_sfx_share | 0.368 | 0.35 |
| hook_duration | 4.08 | 0.7 |
| hook_words | 15.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 15.57 | 0.7 |
| numbers_per_10s | 0.34 | 0.6 |
| cut_word_alignment | 0.789 | 0.6 |
| cut_sentence_alignment | 0.421 | 0.6 |
| cuts_per_sentence | 1.36 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 0:59.52 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 20 shots; median 2.70s, mean 2.97s (min 0.90s, max 9.47s); 19.2 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.61 - **medium** _(opencv:shot-detection)_
- `0:22.03-0:22.93` shortest shot 0.90s - **high** _(opencv:shot-detection)_
- `0:00.00-0:09.47` longest shot 9.47s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.00 cuts/s vs 0.34 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `0:12.17-0:14.87` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:17.30-0:22.03` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:22.93-0:24.43` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:40.23-0:43.57` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:45.67-0:47.70` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:51.77-0:54.63` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:54.63-0:58.50` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 79% of cuts land on word boundaries, 42% on sentence boundaries; 1.4 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:12.17` dissolve transition (~0.27s) - **high** _(opencv:blend-test)_
- `0:14.87` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 89%, dissolve 11% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 55%, zoom_out 40%, pan_right 5% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:09.47` strong zoom out (-9%/s) - **high** _(opencv:optical-flow)_
- `0:12.17-0:14.87` strong zoom out (-14%/s) - **high** _(opencv:optical-flow)_
- `0:12.17-0:14.87` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:14.87-0:17.30` strong zoom out (-27%/s) - **high** _(opencv:optical-flow)_
- `0:17.30-0:22.03` strong zoom out (-16%/s) - **high** _(opencv:optical-flow)_
- `0:22.03-0:22.93` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:22.93-0:24.43` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_
- `0:24.43-0:27.20` strong zoom in (60%/s) - **high** _(opencv:optical-flow)_
- `0:27.20-0:31.30` strong zoom in (12%/s) - **high** _(opencv:optical-flow)_
- `0:31.30-0:35.67` strong zoom in (46%/s) - **high** _(opencv:optical-flow)_
- `0:35.67-0:37.43` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:37.43-0:40.23` strong zoom out (-82%/s) - **high** _(opencv:optical-flow)_
- `0:40.23-0:43.57` strong zoom in (101%/s) - **high** _(opencv:optical-flow)_
- `0:43.57-0:45.67` strong zoom in (11%/s) - **high** _(opencv:optical-flow)_
- `0:45.67-0:47.70` strong zoom out (-68%/s) - **high** _(opencv:optical-flow)_
- `0:47.70-0:49.13` strong zoom out (-10%/s) - **high** _(opencv:optical-flow)_
- `0:49.13-0:51.77` strong zoom in (6%/s) - **high** _(opencv:optical-flow)_
- `0:51.77-0:54.63` strong zoom in (19%/s) - **high** _(opencv:optical-flow)_
- `0:54.63-0:58.50` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.50, contrast 0.21, saturation 0.28, neutral temperature (b* +5.5) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #5B5750 (27%), #2A2829 (26%), #8A8C99 (19%), #C7C7CD (16%), #A79E55 (12%) - **medium** _(opencv:k-means)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 32%, full_bleed 68%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.50, y=0.50 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 78% of the video (144 caption changes, 145.2/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFFFF) - **high** _(opencv:caption-detector)_
- `whole video` dark outline on 90% of captions (~8px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.33, width/height 0.85). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: word reveal next 1%, scale down in 1%, slide in 1%, scale in 2%, word reveal 1%, fade in 1% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 92% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -2.1 dBTP, LRA 2.4 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 91% of the runtime, first words at 0.0s; 22 pauses (median 0.23s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 243 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~5 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 79 effect-like events (79.72/min): impact/boom x56, whoosh/noise-sweep x23; 37% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:00.72` impact/boom - **low** _(audio:onset heuristics)_
- `0:00.80` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:00.83` impact/boom - **low** _(audio:onset heuristics)_
- `0:02.94` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:03.34` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.62` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.00` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.67` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:06.70` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:07.25` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.79` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.87` impact/boom - **low** _(audio:onset heuristics)_
- `0:09.49` whoosh/noise-sweep (at a cut) - **low** _(audio:onset heuristics)_
- `0:10.15` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:10.52` impact/boom - **low** _(audio:onset heuristics)_
- `0:10.60` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.40` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.73` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.59` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.67` impact/boom - **low** _(audio:onset heuristics)_
- `0:13.70` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.29` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.81` impact/boom - **low** _(audio:onset heuristics)_
- `0:19.70` impact/boom - **low** _(audio:onset heuristics)_
- `0:21.11` impact/boom - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:04.08` hook (4.1s, 15 words): "If you plant a tree beside an empty road, cars will steer right into it." - direct address (you) - **medium** _(transcript + text rules)_
- `whole video` ending: "Even when it's just a stump." - statement/conclusion - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.78|0.2 -> 3.88|0.35 -> 3.33|0.4 - **medium** _(transcript + shot detection)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:09.47 | 9.47s | start | zoom_out |
| 1 | 0:09.47 | 0:12.17 | 2.70s | cut | zoom_out |
| 2 | 0:12.17 | 0:14.87 | 2.70s | dissolve | zoom_out |
| 3 | 0:14.87 | 0:17.30 | 2.43s | dissolve | zoom_out |
| 4 | 0:17.30 | 0:22.03 | 4.73s | cut | zoom_out |
| 5 | 0:22.03 | 0:22.93 | 0.90s | cut | zoom_in |
| 6 | 0:22.93 | 0:24.43 | 1.50s | cut | zoom_in |
| 7 | 0:24.43 | 0:27.20 | 2.77s | cut | zoom_in |
| 8 | 0:27.20 | 0:31.30 | 4.10s | cut | zoom_in |
| 9 | 0:31.30 | 0:35.67 | 4.37s | cut | zoom_in |
| 10 | 0:35.67 | 0:37.43 | 1.77s | cut | zoom_in |
| 11 | 0:37.43 | 0:40.23 | 2.80s | cut | zoom_out |
| 12 | 0:40.23 | 0:43.57 | 3.33s | cut | zoom_in |
| 13 | 0:43.57 | 0:45.67 | 2.10s | cut | zoom_in |
| 14 | 0:45.67 | 0:47.70 | 2.03s | cut | zoom_out |
| 15 | 0:47.70 | 0:49.13 | 1.43s | cut | zoom_out |
| 16 | 0:49.13 | 0:51.77 | 2.63s | cut | zoom_in |
| 17 | 0:51.77 | 0:54.63 | 2.87s | cut | zoom_in |
| 18 | 0:54.63 | 0:58.50 | 3.87s | cut | zoom_in |
| 19 | 0:58.50 | 0:59.47 | 0.97s | cut | pan_right |

## Comparison with previous references

Compared with 4 earlier reference(s).

**Consistent with earlier videos:** video length, numbers/statistics per 10 s, hook sentence length, hook word count, time to first spoken word, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, shot-length variation (CV), 2nd-half / 1st-half shot length, cuts on word boundaries, cuts on sentence boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), brightness (L), contrast (L std), colourfulness, warmth (Lab b*), frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, frame layout, teal/orange split tone, vignette, most common camera move, caption zone, caption text colour, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- colour temperature: neutral vs usual warm (Visual composition)
- caption text colour (hex): #FFFFFF vs usual #FFFEFF (Subtitle design)
- highlight style: none vs usual emphasis (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
