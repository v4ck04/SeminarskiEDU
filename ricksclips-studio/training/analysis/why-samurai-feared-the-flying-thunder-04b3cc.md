# Reference analysis: Why_Samurai_Feared_The_Flying_Thunder.mp4

- **Video id:** `why-samurai-feared-the-flying-thunder-04b3cc`  
- **Analyzed:** 2026-11-22T09:34:23+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/why-samurai-feared-the-flying-thunder-04b3cc/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 59.1513 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 15.0 | 0.8 |
| shot_len_median | 3.3 | 0.8 |
| shot_len_mean | 3.94 | 0.8 |
| cuts_per_min | 14.2009 | 0.8 |
| shot_len_cv | 1.0145 | 0.72 |
| hook_cuts_per_s | 0.3333 | 0.8 |
| body_cuts_per_s | 0.2315 | 0.8 |
| pace_change_ratio | 0.7801 | 0.64 |
| transition_share_cut | 0.8571 | 0.7 |
| transition_share_dissolve | 0.0714 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0714 | 0.5 |
| transition_share_zoom_transition | 0.0 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.643 | 0.6 |
| motion_share_zoom_out | 0.214 | 0.6 |
| motion_share_pan_left | 0.071 | 0.6 |
| motion_share_pan_right | 0.071 | 0.6 |
| motion_share_pan_up | 0.0 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.0 | 0.6 |
| moving_shot_share | 1.0 | 0.6 |
| zoom_rate_median | 0.1352 | 0.55 |
| shake_share | 0.071 | 0.45 |
| animated_still_share | 0.071 | 0.45 |
| brightness | 0.3307 | 0.7 |
| contrast | 0.1673 | 0.7 |
| saturation | 0.3694 | 0.7 |
| colorfulness | 43.1143 | 0.65 |
| warmth | -3.1718 | 0.6 |
| vignette_share | 0.765 | 0.4 |
| shot_brightness_std | 0.0847 | 0.5 |
| face_frame_share | 0.235 | 0.55 |
| caption_coverage | 0.921 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 172.4 | 0.85 |
| caption_y | 0.7047 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.135 | 0.85 |
| caption_outline_share | 0.788 | 0.85 |
| caption_outline_frac | 0.0093 | 0.59 |
| caption_caps_share | 0.127 | 0.5 |
| caption_stroke_ratio | 0.33 | 0.45 |
| caption_char_aspect | 0.9048 | 0.45 |
| lufs | -14.1 | 0.95 |
| true_peak | -1.97 | 0.95 |
| speech_ratio | 0.889 | 0.85 |
| pause_median | 0.23 | 0.85 |
| pauses_per_min | 29.7 | 0.85 |
| wpm | 243.3 | 0.85 |
| bed_below_speech_db | 5.4 | 0.6 |
| sfx_per_min | 85.29 | 0.35 |
| cuts_with_sfx_share | 0.286 | 0.35 |
| hook_duration | 3.74 | 0.7 |
| hook_words | 15.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 13.25 | 0.7 |
| numbers_per_10s | 0.51 | 0.6 |
| cut_word_alignment | 0.857 | 0.6 |
| cut_sentence_alignment | 0.071 | 0.6 |
| cuts_per_sentence | 0.88 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 0:59.15 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 15 shots; median 3.30s, mean 3.94s (min 0.37s, max 12.67s); 14.2 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 1.01 - **medium** _(opencv:shot-detection)_
- `0:57.60-0:57.97` shortest shot 0.37s - **high** _(opencv:shot-detection)_
- `0:19.67-0:32.33` longest shot 12.67s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.33 cuts/s vs 0.23 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `whole video` shots in the second half are shorter (median ratio 0.78) - **medium** _(opencv:shot-detection)_
- `0:35.47-0:39.13` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:49.47-0:53.07` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `0:54.30-0:57.60` motion speed changes >3x within the shot (possible speed ramp) - **low** _(opencv:optical-flow/frame-duplicates)_
- `whole video` 86% of cuts land on word boundaries, 7% on sentence boundaries; 0.9 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:49.47` whip or blur transition - **low** _(opencv:sharpness-drop+motion)_
- `0:57.97` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 86%, whip_or_blur 7%, dissolve 7% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 64%, zoom_out 21%, pan_right 7%, pan_left 7% - **medium** _(opencv:optical-flow)_
- `0:00.00-0:00.87` strong zoom in (13%/s) - **high** _(opencv:optical-flow)_
- `0:12.47-0:15.80` strong zoom out (-7%/s) - **high** _(opencv:optical-flow)_
- `0:15.80-0:19.17` strong zoom in (18%/s) - **high** _(opencv:optical-flow)_
- `0:19.67-0:32.33` strong zoom in (7%/s) - **high** _(opencv:optical-flow)_
- `0:32.33-0:32.87` strong zoom in (25%/s) - **high** _(opencv:optical-flow)_
- `0:35.47-0:39.13` strong zoom in (38%/s) - **high** _(opencv:optical-flow)_
- `0:39.13-0:49.47` strong zoom in (8%/s) - **high** _(opencv:optical-flow)_
- `0:39.13-0:49.47` handheld feel / camera shake - **low** _(opencv:optical-flow jitter)_
- `0:53.07-0:54.30` strong zoom out (-45%/s) - **high** _(opencv:optical-flow)_
- `0:54.30-0:57.60` strong zoom in (14%/s) - **high** _(opencv:optical-flow)_
- `0:57.97-0:59.10` strong zoom in (27%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.33, contrast 0.17, saturation 0.37, neutral temperature (b* -3.2) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` cool shadows with warm highlights (teal/orange-style grade) - **low** _(opencv:Lab split-tone)_
- `whole video` corners consistently darker than centre (vignette likely) - **low** _(opencv:corner/centre luminance)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #302D3A (42%), #4D4D61 (24%), #784533 (15%), #927B76 (14%), #D7C6B2 (5%) - **medium** _(opencv:k-means)_
- `whole video` Blue moonlit night palette; the climax is a full-frame explosion. - **medium** _(reviewer notes: contact_shots.jpg #13, #14)_

### Composition

- `whole video` dominant layout: blurred fill (blurred_fill 64%, full_bleed 36%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.49, y=0.54 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 92% of the video (170 caption changes, 172.4/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFEFF) - **high** _(opencv:caption-detector)_
- `whole video` dark outline on 79% of captions (~10px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.33, width/height 0.90). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: slide in 1%, scale down in 2%, scale in 1% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 94% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept; white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. - **high** _(reviewer notes: contact_shots.jpg, all shots)_

### Audio

- `whole video` integrated -14.1 LUFS, true peak -2.0 dBTP, LRA 2.2 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 89% of the runtime, first words at 0.0s; 26 pauses (median 0.23s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 243 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~5 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 84 effect-like events (85.29/min): impact/boom x62, whoosh/noise-sweep x22; 29% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:00.66` impact/boom - **low** _(audio:onset heuristics)_
- `0:00.87` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:00.98` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:02.50` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:02.64` impact/boom - **low** _(audio:onset heuristics)_
- `0:02.74` impact/boom - **low** _(audio:onset heuristics)_
- `0:02.83` impact/boom - **low** _(audio:onset heuristics)_
- `0:02.91` impact/boom - **low** _(audio:onset heuristics)_
- `0:03.94` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.99` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.20` impact/boom - **low** _(audio:onset heuristics)_
- `0:06.73` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:07.92` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:09.12` impact/boom - **low** _(audio:onset heuristics)_
- `0:09.55` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:10.53` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.79` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.83` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:12.39` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:14.12` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:14.17` impact/boom - **low** _(audio:onset heuristics)_
- `0:14.25` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.18` impact/boom - **low** _(audio:onset heuristics)_
- `0:15.41` impact/boom - **low** _(audio:onset heuristics)_
- `0:16.05` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `whole video` fades in, fades out - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:03.74` hook (3.7s, 15 words): "He rolled the bomb into the enemy camp, but made sure it wouldn't go off." - contrarian/negation, narrative opener (he/she did...) - **medium** _(transcript + text rules)_
- `whole video` ending: "And right as the biggest guy in camp lifts a hammer over his head, it finally reaches the powder." - statement/conclusion - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.7|0.25 -> 3.6|0.2 -> 3.5|0.25 - **medium** _(transcript + shot detection)_
- `whole video` Builds tension around one object and ends on the explosion as the payoff. - **medium** _(reviewer notes: transcript ending + contact_shots.jpg #13-#14)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style: a moonlit samurai camp, soldiers, a commander and a rolling bomb. - **high** _(reviewer notes: contact_shots.jpg, all 15 shots)_

### Motion

- `whole video` Some very long continuous shots (10-13 s) with camera movement, unusual compared with the other references. - **medium** _(reviewer notes: contact_shots.jpg #1, #5, #9)_

### Overlays

- `whole video` Time passing shown with an in-scene prop (a burning fuse coil) rather than an overlay. - **medium** _(reviewer notes: contact_shots.jpg #10)_

### Hook

- `0:00.00-0:03.74` Hook is a single concrete paradox stated immediately: "He rolled the bomb into the enemy camp, but made sure it wouldn't go off." - **high** _(reviewer notes: transcript, first sentence)_

### Ending

- `whole video` Ends on a concrete payoff that resolves the hook, no call to action: "And right as the biggest guy in camp lifts a hammer over his head, it finally reaches the powder." - **high** _(reviewer notes: transcript, last sentence)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:00.87 | 0.87s | start | zoom_in |
| 1 | 0:00.87 | 0:12.47 | 11.60s | cut | zoom_out |
| 2 | 0:12.47 | 0:15.80 | 3.33s | cut | zoom_out |
| 3 | 0:15.80 | 0:19.17 | 3.37s | cut | zoom_in |
| 4 | 0:19.17 | 0:19.67 | 0.50s | cut | pan_right |
| 5 | 0:19.67 | 0:32.33 | 12.67s | cut | zoom_in |
| 6 | 0:32.33 | 0:32.87 | 0.53s | cut | zoom_in |
| 7 | 0:32.87 | 0:35.47 | 2.60s | cut | zoom_in |
| 8 | 0:35.47 | 0:39.13 | 3.67s | cut | zoom_in |
| 9 | 0:39.13 | 0:49.47 | 10.33s | cut | zoom_in |
| 10 | 0:49.47 | 0:53.07 | 3.60s | whip_or_blur | pan_left |
| 11 | 0:53.07 | 0:54.30 | 1.23s | cut | zoom_out |
| 12 | 0:54.30 | 0:57.60 | 3.30s | cut | zoom_in |
| 13 | 0:57.60 | 0:57.97 | 0.37s | cut | unknown |
| 14 | 0:57.97 | 0:59.10 | 1.13s | dissolve | zoom_in |

## Comparison with previous references

Compared with 7 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, numbers/statistics per 10 s, hook sentence length, hook word count, time to first spoken word, cuts per second in the first 3 s, narration pace, share of runtime with speech, median pause, pauses per minute of speech, cuts per minute, 2nd-half / 1st-half shot length, cuts on word boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), brightness (L), saturation, colourfulness, warmth (Lab b*), frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, background bed below speech, most common camera move, caption zone, caption text colour, caption text colour (hex), highlight style, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- frame layout: blurred_fill vs usual full_bleed (Visual composition)
- colour temperature: neutral vs usual cool (Visual composition)
- teal/orange split tone: True vs usual False (Visual composition)
- vignette: True vs usual False (Visual composition)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
