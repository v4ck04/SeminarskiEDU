# Reference analysis: The_Window_That_Breaks_Japans_Gambling_Law.mp4

- **Video id:** `the-window-that-breaks-japans-gambling-l-544d9a`  
- **Analyzed:** 2026-11-22T09:31:54+00:00 (analyzer 1.0)  
- **Transcript:** faster-whisper  
- **Contact sheets:** `training/extracted_frames/the-window-that-breaks-japans-gambling-l-544d9a/`

## Key metrics

| Metric | Value | Confidence |
|---|---|---|
| duration | 45.1265 | 1.0 |
| fps | 30.0 | 1.0 |
| aspect | 0.5625 | 1.0 |
| shot_count | 13.0 | 0.8 |
| shot_len_median | 2.667 | 0.8 |
| shot_len_mean | 3.4667 | 0.8 |
| cuts_per_min | 15.9552 | 0.8 |
| shot_len_cv | 0.7233 | 0.72 |
| hook_cuts_per_s | 0.6667 | 0.8 |
| body_cuts_per_s | 0.2374 | 0.8 |
| pace_change_ratio | 1.2191 | 0.64 |
| transition_share_cut | 0.75 | 0.7 |
| transition_share_dissolve | 0.1667 | 0.5 |
| transition_share_flash | 0.0 | 0.5 |
| transition_share_dip_black | 0.0 | 0.5 |
| transition_share_whip_or_blur | 0.0 | 0.5 |
| transition_share_zoom_transition | 0.0833 | 0.5 |
| transition_share_cut_through_black | 0.0 | 0.5 |
| motion_share_zoom_in | 0.615 | 0.6 |
| motion_share_zoom_out | 0.231 | 0.6 |
| motion_share_pan_left | 0.077 | 0.6 |
| motion_share_pan_right | 0.077 | 0.6 |
| motion_share_pan_up | 0.0 | 0.6 |
| motion_share_pan_down | 0.0 | 0.6 |
| motion_share_static | 0.0 | 0.6 |
| moving_shot_share | 1.0 | 0.6 |
| zoom_rate_median | 0.1714 | 0.55 |
| shake_share | 0.0 | 0.45 |
| animated_still_share | 0.308 | 0.45 |
| brightness | 0.3067 | 0.7 |
| contrast | 0.2295 | 0.7 |
| saturation | 0.5044 | 0.7 |
| colorfulness | 61.0009 | 0.65 |
| warmth | -10.332 | 0.6 |
| vignette_share | 0.758 | 0.4 |
| shot_brightness_std | 0.1047 | 0.5 |
| face_frame_share | 0.088 | 0.55 |
| caption_coverage | 0.787 | 0.85 |
| caption_duration | 0.3 | 0.85 |
| caption_per_min | 143.6 | 0.85 |
| caption_y | 0.7047 | 0.85 |
| caption_text_h | 0.0219 | 0.77 |
| caption_words | 1.0 | 0.81 |
| caption_lines | 1.0 | 0.68 |
| caption_words_p80 | 2.0 | 0.81 |
| caption_highlight_share | 0.167 | 0.85 |
| caption_outline_share | 0.935 | 0.85 |
| caption_outline_frac | 0.0074 | 0.59 |
| caption_caps_share | 0.105 | 0.5 |
| caption_stroke_ratio | 0.3231 | 0.45 |
| caption_char_aspect | 0.8846 | 0.45 |
| lufs | -14.39 | 0.95 |
| true_peak | -1.29 | 0.95 |
| speech_ratio | 0.883 | 0.85 |
| pause_median | 0.27 | 0.85 |
| pauses_per_min | 30.15 | 0.85 |
| wpm | 242.7 | 0.85 |
| bed_below_speech_db | 4.7 | 0.6 |
| sfx_per_min | 85.2 | 0.35 |
| cuts_with_sfx_share | 0.333 | 0.35 |
| hook_duration | 4.24 | 0.7 |
| hook_words | 14.0 | 0.7 |
| time_to_first_word | 0.0 | 0.8 |
| words_per_sentence | 14.64 | 0.7 |
| numbers_per_10s | 0.22 | 0.6 |
| cut_word_alignment | 0.917 | 0.6 |
| cut_sentence_alignment | 0.417 | 0.6 |
| cuts_per_sentence | 1.09 | 0.6 |

## Observations

Each line: timestamp - description - confidence - evidence source.

### Video

- `whole video` 0:45.13 long, 720x1280 (9:16 vertical), 30.0 fps, h264 - **high** _(ffprobe)_

### Editing

- `whole video` 13 shots; median 2.67s, mean 3.47s (min 0.40s, max 10.20s); 16.0 cuts/min - **high** _(opencv:shot-detection)_
- `whole video` varied rhythm (mix of quick and longer shots), CV 0.72 - **medium** _(opencv:shot-detection)_
- `0:02.10-0:02.50` shortest shot 0.40s - **high** _(opencv:shot-detection)_
- `0:27.03-0:37.23` longest shot 10.20s - **high** _(opencv:shot-detection)_
- `0:00.00-0:03.00` first 3 s: 0.67 cuts/s vs 0.24 cuts/s afterwards - **medium** _(opencv:shot-detection)_
- `whole video` 92% of cuts land on word boundaries, 42% on sentence boundaries; 1.1 cuts per sentence - **medium** _(transcript + shot detection)_

### Transitions

- `0:02.50` zoom transition transition - **low** _(opencv:optical-flow scale after cut)_
- `0:08.07` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `0:16.50` dissolve transition (~0.27s) - **medium** _(opencv:blend-test)_
- `whole video` transition mix: cut 75%, dissolve 17%, zoom_transition 8% - **medium** _(opencv:transition-detection)_

### Camera

- `whole video` camera/zoom movement per shot: zoom_in 62%, zoom_out 23%, pan_left 8%, pan_right 8% - **medium** _(opencv:optical-flow)_
- `whole video` 31% of shots look like still images animated with digital zoom/pan (motion-compensated residual ~0) - **medium** _(opencv:optical-flow residual)_
- `0:00.00-0:02.10` strong zoom in (35%/s) - **high** _(opencv:optical-flow)_
- `0:02.10-0:02.50` strong zoom out (-42%/s) - **high** _(opencv:optical-flow)_
- `0:02.50-0:04.67` strong zoom out (-71%/s) - **high** _(opencv:optical-flow)_
- `0:04.67-0:08.07` strong zoom in (69%/s) - **high** _(opencv:optical-flow)_
- `0:08.07-0:10.50` strong zoom in (38%/s) - **high** _(opencv:optical-flow)_
- `0:16.50-0:24.07` strong zoom in (15%/s) - **high** _(opencv:optical-flow)_
- `0:24.07-0:27.03` strong zoom in (10%/s) - **high** _(opencv:optical-flow)_
- `0:27.03-0:37.23` strong zoom in (17%/s) - **high** _(opencv:optical-flow)_
- `0:37.23-0:40.90` strong zoom in (7%/s) - **high** _(opencv:optical-flow)_
- `0:40.90-0:43.57` strong zoom in (9%/s) - **high** _(opencv:optical-flow)_
- `0:43.57-0:45.07` strong zoom out (-7%/s) - **high** _(opencv:optical-flow)_

### Color

- `whole video` brightness L 0.31, contrast 0.23, saturation 0.50, cool temperature (b* -10.3) - **medium** _(opencv:Lab/HSV stats)_
- `whole video` cool shadows with warm highlights (teal/orange-style grade) - **low** _(opencv:Lab split-tone)_
- `whole video` corners consistently darker than centre (vignette likely) - **low** _(opencv:corner/centre luminance)_
- `whole video` look varies between shots (mixed sources / no unified grade) - **medium** _(opencv:per-shot Lab/HSV)_
- `whole video` dominant colours: #221F3F (32%), #9A7162 (19%), #484272 (17%), #5E2E23 (16%), #D8B9A0 (16%) - **medium** _(opencv:k-means)_
- `whole video` Neon purple/blue night palette with warm interior light. - **medium** _(reviewer notes: contact_shots.jpg)_

### Composition

- `whole video` dominant layout: full bleed (blurred_fill 44%, full_bleed 56%) - **medium** _(opencv:band sharpness/letterbox)_
- `whole video` visual detail centred at x=0.54, y=0.52 - **low** _(opencv:edge centre of mass)_

### Subtitles

- `whole video` burned-in captions cover 79% of the video (108 caption changes, 143.6/min, median 0.30s each) - **high** _(opencv:caption-detector)_
- `whole video` captions at y=0.70 of frame height (lower middle) - **high** _(opencv:caption-detector)_
- `whole video` letter height 2.2% of frame height (~42px at 1080x1920) - **high** _(opencv:caption-detector)_
- `whole video` ~1 words per caption, 1 line(s) - **high** _(opencv:caption-detector + transcript words per caption)_
- `whole video` white text (#FFFFFF) - **high** _(opencv:caption-detector)_
- `whole video` 17% of captions highlight words in orange (#E69734) - **medium** _(opencv:caption colour clusters)_
- `whole video` dark outline on 94% of captions (~8px at 1080 wide) - **medium** _(opencv:outline rings)_
- `whole video` drop shadow offset down-right - **low** _(opencv:offset darkness)_
- `whole video` mixed/lower case likely - **medium** _(opencv:letter top alignment)_
- `whole video` heavy/black weight, wide letter width (stroke/height 0.32, width/height 0.88). Exact font family not identifiable from pixels. - **low** _(opencv:stroke width)_
- `whole video` caption onset animation: scale down in 2%, scale in 1% - **low** _(opencv:caption onset tracking (10 fps))_
- `whole video` 92% of captions contain spoken words at the same time (captions follow the narration) - **medium** _(caption-detector + transcript)_
- `whole video` Captions show 1-2 words at a time in sentence case with punctuation kept; white heavy rounded sans-serif with a thin dark outline and soft shadow, centred just below the middle of the frame. - **high** _(reviewer notes: contact_shots.jpg, all shots)_

### Audio

- `whole video` integrated -14.4 LUFS, true peak -1.3 dBTP, LRA 2.2 LU - **high** _(ffmpeg:loudnorm (EBU R128))_
- `whole video` speech 88% of the runtime, first words at 0.0s; 20 pauses (median 0.27s) - **high** _(transcript word timestamps)_
- `whole video` narration pace 243 words/min while speaking - **high** _(transcript)_
- `whole video` background bed ~5 dB below speech in pauses, tonal (music likely) - **medium** _(audio:pause-gap level/flatness)_
- `whole video` 64 effect-like events (85.2/min): impact/boom x52, whoosh/noise-sweep x12; 33% of cuts have an effect within 150 ms - **low** _(audio:sub-band/high-band onset heuristics)_
- `0:00.69` impact/boom - **low** _(audio:onset heuristics)_
- `0:02.41` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:02.49` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:03.93` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:04.88` impact/boom - **low** _(audio:onset heuristics)_
- `0:04.96` impact/boom - **low** _(audio:onset heuristics)_
- `0:05.90` impact/boom - **low** _(audio:onset heuristics)_
- `0:06.23` impact/boom - **low** _(audio:onset heuristics)_
- `0:06.98` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.02` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:07.57` impact/boom - **low** _(audio:onset heuristics)_
- `0:07.61` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:07.94` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:08.80` impact/boom - **low** _(audio:onset heuristics)_
- `0:09.37` impact/boom - **low** _(audio:onset heuristics)_
- `0:09.48` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:10.69` whoosh/noise-sweep - **low** _(audio:onset heuristics)_
- `0:10.96` impact/boom - **low** _(audio:onset heuristics)_
- `0:11.20` impact/boom - **low** _(audio:onset heuristics)_
- `0:12.80` impact/boom - **low** _(audio:onset heuristics)_
- `0:13.37` impact/boom - **low** _(audio:onset heuristics)_
- `0:14.02` impact/boom (at a cut) - **low** _(audio:onset heuristics)_
- `0:14.45` impact/boom - **low** _(audio:onset heuristics)_
- `0:16.14` impact/boom - **low** _(audio:onset heuristics)_
- `0:16.93` impact/boom - **low** _(audio:onset heuristics)_
- `whole video` fades in, ends abruptly - **medium** _(audio:start/end level)_

### Story

- `0:00.00-0:04.24` hook (4.2s, 14 words): "Gambling is illegal in Japan, yet there's a gambling hall on almost every street." - contradiction (but/yet) - **medium** _(transcript + text rules)_
- `whole video` ending: "He slides the tokens through, a hand slides over cash, and on paper, nobody gambles." - abrupt end right after last word - **medium** _(transcript + text rules)_
- `whole video` pace by thirds (words/s | cuts/s): 3.19|0.4 -> 3.99|0.2 -> 3.52|0.2 - **medium** _(transcript + shot detection)_
- `whole video` Explains a legal loophole and ends on an ironic image (police checklist: gambling none). - **medium** _(reviewer notes: contact_shots.jpg #12)_

### Footage

- `whole video` Original 3D cartoon animation in the same character style: neon night streets in Japan, a pachinko hall and a prize counter. - **high** _(reviewer notes: contact_shots.jpg, all 13 shots)_

### Overlays

- `whole video` Information carried by in-scene signs ('PRIZE HALL', 'PRIZE COUNTER', 'THANK YOU', a 'GAMBLING: NONE' checklist). - **high** _(reviewer notes: contact_shots.jpg #5, #7, #8, #12)_

### Hook

- `0:00.00-0:04.24` Hook is a single concrete paradox stated immediately: "Gambling is illegal in Japan, yet there's a gambling hall on almost every street." - **high** _(reviewer notes: transcript, first sentence)_

### Ending

- `whole video` Ends on a concrete payoff that resolves the hook, no call to action: "He slides the tokens through, a hand slides over cash, and on paper, nobody gambles." - **high** _(reviewer notes: transcript, last sentence)_

## Shot list

| # | Start | End | Duration | In | Motion |
|---|---|---|---|---|---|
| 0 | 0:00.00 | 0:02.10 | 2.10s | start | zoom_in |
| 1 | 0:02.10 | 0:02.50 | 0.40s | cut | zoom_out |
| 2 | 0:02.50 | 0:04.67 | 2.17s | zoom_transition | zoom_out |
| 3 | 0:04.67 | 0:08.07 | 3.40s | cut | zoom_in |
| 4 | 0:08.07 | 0:10.50 | 2.43s | dissolve | zoom_in |
| 5 | 0:10.50 | 0:13.90 | 3.40s | cut | pan_left |
| 6 | 0:13.90 | 0:16.50 | 2.60s | cut | pan_right |
| 7 | 0:16.50 | 0:24.07 | 7.57s | dissolve | zoom_in |
| 8 | 0:24.07 | 0:27.03 | 2.97s | cut | zoom_in |
| 9 | 0:27.03 | 0:37.23 | 10.20s | cut | zoom_in |
| 10 | 0:37.23 | 0:40.90 | 3.67s | cut | zoom_in |
| 11 | 0:40.90 | 0:43.57 | 2.67s | cut | zoom_in |
| 12 | 0:43.57 | 0:45.07 | 1.50s | cut | zoom_out |

## Comparison with previous references

Compared with 5 earlier reference(s).

**Consistent with earlier videos:** video length, words per sentence, hook sentence length, hook word count, time to first spoken word, narration pace, share of runtime with speech, median pause, pauses per minute of speech, median shot length, cuts per minute, shot-length variation (CV), 2nd-half / 1st-half shot length, cuts on word boundaries, cuts on sentence boundaries, cuts per narrated sentence, caption coverage, caption vertical position (0=top), caption letter height (frame fraction), words per caption, words per caption (80th percentile), lines per caption, caption on-screen time, captions with highlighted words, captions with dark outline, outline thickness (frame-width fraction), ALL CAPS likelihood, stroke/height ratio (weight), letter width/height, hard cuts, dissolves, flash transitions, dips to black, whip/blur transitions, zoom transitions, zoom-in shots, zoom-out shots, pan-left shots, pan-right shots, pan-up shots, pan-down shots, static shots, shots with camera/zoom movement, zoom speed, shots with shake, animated still images (Ken Burns), contrast (L std), saturation, colourfulness, frames with faces, integrated loudness, true peak, effect-like events per minute, cuts with an effect, frame layout, most common camera move, caption zone, caption text colour, highlight colour, drop shadow, caption background box, letter weight, letter width, caption onset animation, music bed under narration, ends with a call to action

**Different from earlier videos:**
- cuts per second in the first 3 s: 0.67/s vs typical 0.27/s (Hook patterns)
- brightness (L): 0.31 vs typical 0.51 (Visual composition)
- colour temperature: cool vs usual neutral (Visual composition)
- teal/orange split tone: True vs usual False (Visual composition)
- vignette: True vs usual False (Visual composition)
- caption text colour (hex): #FFFFFF vs usual #FFFEFF (Subtitle design)
- highlight colour (hex): #E69734 vs usual #8EC28B (Subtitle design)
- highlight style: emphasis vs usual none (Subtitle design)

## Limitations

- Fonts, editing software and exact effect settings are not identified from pixels; only measurable properties are reported.
- Sound-effect and speed-change detection are heuristic (low confidence).
- One video is never treated as a rule; see training/style-profile.md for cross-video patterns.
