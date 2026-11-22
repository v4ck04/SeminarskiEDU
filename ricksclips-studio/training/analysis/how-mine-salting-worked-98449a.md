# Reference analysis: How_Mine_Salting_Worked.mp4

- **Video id:** `how-mine-salting-worked-98449a`  
- **Analyzed:** 2026-11-22T09:29:39+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/how-mine-salting-worked-98449a/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 61.1483 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 26.0 | 0.8 |
| shot_len_median | 1.7835 | 0.8 |
| shot_len_mean | 2.35 | 0.8 |
| cuts_per_min | 24.5305 | 0.8 |
| shot_len_cv | 0.8047 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.4127 | 0.8 |
| pace_change_ratio | 0.3726 | 0.64 |
| transition_share_cut | 0.84 | 0.7 |
| transition_share_dissolve | 0.08 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.08 | 0.5 |
| transition_share_zoom_transition | 0.0 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.708 | 0.6 |
| motion_share_zoom_out | 0.125 | 0.6 |
| motion_share_pan_left | 0.042 | 0.6 |
| motion_share_pan_right | 0.083 | 0.6 |
| motion_share_pan_up | 0.0 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.042 | 0.6 |
| moving_shot_share | 0.958 | 0.6 |
| zoom_rate_median | 0.1571 | 0.55 |
| shake_share | 0.125 | 0.45 |
| animated_still_share | 0.083 | 0.45 |
| brightness | 0.4273 | 0.7 |
| contrast | 0.1993 | 0.7 |
| saturation | 0.5487 | 0.7 |
| colorfulness | 52.6145 | 0.65 |
| warmth | 21.4608 | 0.6 |
| vignette_share | 0.528 | 0.4 |
| shot_brightness_std | 0.1053 | 0.5 |
| face_frame_share | 0.195 | 0.55 |
| caption_coverage | 0.778 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 135.4 | 0.85 |
| caption_y | 0.7047 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.087 | 0.85 |
| caption_outline_share | 0.812 | 0.85 |
| caption_outline_frac | 0.0074 | 0.59 |
| caption_caps_share | 0.057 | 0.5 |
| caption_stroke_ratio | 0.3191 | 0.45 |
| caption_char_aspect | 0.8457 | 0.45 |
| lufs | -14.13 | 0.95 |
| true_peak | -1.71 | 0.95 |
| speech_ratio | 0.927 | 0.85 |
| pause_median | 0.19 | 0.85 |
| pauses_per_min | 21.18 | 0.85 |
| wpm | 244.6 | 0.85 |
| bed_below_speech_db | 9.2 | 0.6 |
| sfx_per_min | 54.02 | 0.35 |
| cuts_with_sfx_share | 0.24 | 0.35 |
| hook_duration | 3.54 | 0.7 |
| hook_words | 15.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 13.59 | 0.7 |
| numbers_per_10s | 0.65 | 0.6 |
| cut_word_alignment | 0.8 | 0.6 |
| cut_sentence_alignment | 0.28 | 0.6 |
| cuts_per_sentence | 1.47 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 1:01.15 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 26 shots; median 1.78s, mean 2.35s (min 0.17s, max 7.50s); 24.5 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.80 - **medium** _(opencv:shot-detection)_
- `0:51.23-0:51.40` shortest shot 0.17s - **high** _(opencv:shot-detection)_
- `0:35.70-0:43.20` longest shot 7.50s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.41 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `whole video` shots in the second half are shorter (median ratio 0.37) - **medium** _(opencv:shot-detection)_
- `0:02.03-0:07.97` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:09.23-0:10.73` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:16.13-0:19.03` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:19.03-0:21.50` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:28.90-0:31.03` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 80% of cuts land on word boundaries, 28% on sentence boundaries; 1.5 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:32.03` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `0:34.67` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:55.73` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `0:56.00` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 84%, whip_or_blur 8%, dissolve 8% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 71%, zoom_out 12%, pan_right 8%, static 4%, pan_left 4% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:02.03` strong zoom in (13%/s) - **high** _(opencv:optical-flow)_
- `0:00.00-0:02.03` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:02.03-0:07.97` strong zoom in (11%/s) - **high** _(opencv:optical-flow)_
- `0:09.23-0:10.73` strong zoom in (29%/s) - **high** _(opencv:optical-flow)_
- `0:10.73-0:16.13` strong zoom in (38%/s) - **high** _(opencv:optical-flow)_
- `0:16.13-0:19.03` strong zoom in (46%/s) - **high** _(opencv:optical-flow)_
- `0:19.03-0:21.50` strong zoom in (38%/s) - **high** _(opencv:optical-flow)_
- `0:21.50-0:24.57` strong zoom out (-10%/s) - **high** _(opencv:optical-flow)_
- `0:24.57-0:27.50` strong zoom in (22%/s) - **high** _(opencv:optical-flow)_
- `0:28.90-0:31.03` strong zoom in (18%/s) - **high** _(opencv:optical-flow)_
- `0:31.03-0:32.03` strong zoom in (77%/s) - **medium** _(opencv:optical-flow)_
- `0:32.03-0:33.57` strong zoom in (72%/s) - **high** _(opencv:optical-flow)_
- `0:33.57-0:34.03` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:34.03-0:34.67` strong zoom in (7%/s) - **high** _(opencv:optical-flow)_
- `0:34.67-0:35.70` strong zoom in (10%/s) - **high** _(opencv:optical-flow)_
- `0:51.40-0:53.80` strong zoom out (-34%/s) - **medium** _(opencv:optical-flow)_
- `0:51.40-0:53.80` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:53.80-0:54.77` strong zoom in (36%/s) - **high** _(opencv:optical-flow)_
- `0:53.80-0:54.77` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_

### Color

- `whole video` brightness L 0.43, contrast 0.20, saturation 0.55, warm temperature (b* +21.5) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #67412B (30%), #916547 (24%), #B8906A (20%), #36211B (19%), #DFCAAD (7%) - **medium** _(opencv:k-means)_
- `whole video` Warm amber lantern lighting throughout; a dust cloud fills the frame at the climax. - **medium** _(reviewer notes: contact_shots.jpg #23, #24)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 50%, full_bleed 50%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.50, y=0.51 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 78% of the video (138 caption changes, 135.4/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFEFF) - **high** _(opencv:caption-detector)_
- `whole video` dark outline on 81% of captions (~8px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.32, width/height 0.85). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: word reveal next 1%, scale down in 1%, slide in 1%, word reveal 1%, scale in 3% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 95% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept; white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. - **high** _(reviewer notes: contact_shots.jpg, all shots)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -1.7 dBTP, LRA 2.4 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 93% of the runtime, first words at 0.0s; 20 pauses (median 0.19s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 245 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~9 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 55 effect-like events (54.02/min): impact/boom x38, whoosh/noise-sweep x17; 24% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:03.14` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.23` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.36` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:04.44` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.78` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:06.62` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:07.53` impact/boom - **low** _(audio:onset heuristics)_
- `0:08.02` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:10.12` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:10.37` impact/boom - **low** _(audio:onset heuristics)_
- `0:10.45` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.50` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.59` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.03` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.28` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.16` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.97` impact/boom - **low** _(audio:onset heuristics)_
- `0:17.30` impact/boom - **low** _(audio:onset heuristics)_
- `0:17.44` impact/boom - **low** _(audio:onset heuristics)_
- `0:20.71` impact/boom - **low** _(audio:onset heuristics)_
- `0:21.18` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:22.36` impact/boom - **low** _(audio:onset heuristics)_
- `0:22.91` impact/boom - **low** _(audio:onset heuristics)_
- `0:24.15` impact/boom - **low** _(audio:onset heuristics)_
- `0:24.44` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:03.54` hook (3.5s, 15 words): "He loaded the shotgun with gold and fired it into the walls of the mine." - narrative opener (he/she did...) - **medium** _(transcript + text rules)_
- `whole video` ending: "And when the dust clears, there's a vein of real gold as thick as your arm, 10 feet past where the last guy gave up." - abrupt end right after last word - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.83|0.29 -> 3.68|0.49 -> 3.83|0.44 - **medium** _(transcript + shot detection)_
- `whole video` Explains a historical scam step by step and ends on the reveal of how the trick worked. - **medium** _(reviewer notes: transcript ending + contact_shots.jpg #25)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style: a Wild-West gold mine, a top-hatted swindler, miners and investors. - **high** _(reviewer notes: contact_shots.jpg, all 26 shots)_

### Motion

- `whole video` Macro close-ups on the key detail (gold nugget in gravel, gold pan) alternate with medium character shots. - **medium** _(reviewer notes: contact_shots.jpg #10, #13, #14)_

### Overlays

- `whole video` Text appears inside the scene (mine entrance sign 'SURE THING MINE'), no overlay graphics. - **medium** _(reviewer notes: contact_shots.jpg #7, #18)_

### Hook

- `0:00.00-0:03.54` Hook is a single concrete paradox stated immediately: "He loaded the shotgun with gold and fired it into the walls of the mine." - **high** _(reviewer notes: transcript, first sentence)_

### Ending

- `whole video` Ends on a concrete payoff that resolves the hook, no call to action: "And when the dust clears, there's a vein of real gold as thick as your arm, 10 feet past where the last guy gave up." - **high** _(reviewer notes: transcript, last sentence)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:02.03 | 2.03s | start | zoom_in |
| 1 | 0:02.03 | 0:07.97 | 5.93s | cut | zoom_in |
| 2 | 0:07.97 | 0:09.23 | 1.27s | cut | static |
| 3 | 0:09.23 | 0:10.73 | 1.50s | cut | zoom_in |
| 4 | 0:10.73 | 0:16.13 | 5.40s | cut | zoom_in |
| 5 | 0:16.13 | 0:19.03 | 2.90s | cut | zoom_in |
| 6 | 0:19.03 | 0:21.50 | 2.47s | cut | zoom_in |
| 7 | 0:21.50 | 0:24.57 | 3.07s | cut | zoom_out |
| 8 | 0:24.57 | 0:27.50 | 2.93s | cut | zoom_in |
| 9 | 0:27.50 | 0:28.90 | 1.40s | cut | zoom_in |
| 10 | 0:28.90 | 0:31.03 | 2.13s | cut | zoom_in |
| 11 | 0:31.03 | 0:32.03 | 1.00s | cut | zoom_in |
| 12 | 0:32.03 | 0:33.57 | 1.53s | whip_or_blur | zoom_in |
| 13 | 0:33.57 | 0:34.03 | 0.47s | cut | zoom_in |
| 14 | 0:34.03 | 0:34.67 | 0.63s | cut | zoom_in |
| 15 | 0:34.67 | 0:35.70 | 1.03s | dissolve | zoom_in |
| 16 | 0:35.70 | 0:43.20 | 7.50s | cut | pan_right |
| 17 | 0:43.20 | 0:45.37 | 2.17s | cut | zoom_in |
| 18 | 0:45.37 | 0:46.27 | 0.90s | cut | pan_left |
| 19 | 0:46.27 | 0:51.23 | 4.97s | cut | zoom_in |
| 20 | 0:51.23 | 0:51.40 | 0.17s | cut | unknown |
| 21 | 0:51.40 | 0:53.80 | 2.40s | cut | zoom_out |
| 22 | 0:53.80 | 0:54.77 | 0.97s | cut | zoom_in |
| 23 | 0:54.77 | 0:55.73 | 0.97s | cut | pan_right |
| 24 | 0:55.73 | 0:56.00 | 0.27s | whip_or_blur | unknown |
| 25 | 0:56.00 | 1:01.10 | 5.10s | dissolve | zoom_out |

## Comparison with previous references

Compared with 3 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, numbers/statistics per 10 s, hook sentence length, hook word count, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, median shot length, cuts per minute, shot-length variation (CV), cuts on word boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), contrast (L std), colourfulness, frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, background bed below speech, frame layout, teal/orange split tone, vignette, most common camera move, caption zone, caption text colour, caption text colour (hex), drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- 2nd-half / 1st-half shot length: 0.37 vs typical 1.09 (Scene duration patterns)
- hard cuts: 84% vs typical 47% (Transitions)
- dissolves: 8% vs typical 39% (Transitions)
- warmth (Lab b*): +21.5 vs typical +0.7 (Visual composition)
- colour temperature: warm vs usual neutral (Visual composition)
- highlight style: none vs usual emphasis (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
