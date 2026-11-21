# Editing style: how it is measured and applied

## What `studio analyze` measures per reference video
| Area | Method | Confidence |
|---|---|---|
| duration, resolution, fps, codecs, rotation | ffprobe | high |
| cuts / shot lengths | HSV-histogram + pixel difference vs adaptive local baseline | high |
| dip to black, fades, white flashes | luminance runs / spikes | high |
| dissolves | blend test (middle frame ~ average of the frames either side) | medium-high |
| whip/blur, zoom transitions at cuts | sharpness drop + optical-flow scale around cuts | low |
| camera move per shot (zoom in/out, pan, static, shake) | Lucas-Kanade features + RANSAC similarity transform | medium |
| animated stills (Ken Burns) | motion-compensated residual ~ 0 | medium |
| speed changes | duplicate-frame patterns, motion-speed jumps | low (hints only) |
| colour: brightness, contrast, saturation, warmth, split tone, vignette, palette | Lab/HSV statistics, k-means | medium |
| layout: full bleed / letterbox / blurred background fill, faces | band sharpness, bars, Haar faces | medium |
| cut timing vs narration | cut times vs transcript word/sentence boundaries | medium (needs transcript) |

Fonts, editing software and plug-ins are never "identified". Only measurable properties are stored.

## Profile -> production parameters
The style profile (`training/style-profile.json`) maps features to parameters. Only **frequent**
parameters are applied automatically (`style_learning.apply_occasional_params` can include occasional
ones). `studio status --settings` shows each resolved value with its source.

| Parameter | From | Effect |
|---|---|---|
| `editing.target_shot_seconds` | median shot length | beats are split into shots of about this length; cuts snap to word gaps |
| `editing.motion_mix` | share of each camera move | weighted random motion per scene (never the same move twice in a row, mostly) |
| `editing.motion_intensity` | zoom speed x shot length | total zoom/pan amount per shot |
| `editing.shake_amount` | shake share | subtle handheld shake |
| `transitions.mix` | transition type shares | probability of crossfade/whip/zoom/flash/dip at beat boundaries (cuts inside beats) |
| `color.target_saturation/contrast` | reference averages | the render measures its own sources and adjusts the FFmpeg `eq` grade toward them |
| `color.vignette` | vignette detected | FFmpeg vignette |
| `story.target_duration_s`, `story.hook_max_seconds` | durations | script guidance and validation |

Feedback preferences (`training/preferences.json`) scale these afterwards (e.g. "faster cuts" multiplies
`editing.target_shot_seconds` by 0.85 per step; `transitions.fancy_scale` scales non-cut transitions).

## Editing engine (render)
- Sources: video (FFmpeg decode, cover-crop or blurred fill for horizontal footage), still images
  (cover-fit once), procedural generators. Each source is colour-normalised so mixed sources match.
- Motion: sub-pixel affine warp per frame: `zoom_in`, `zoom_out`, `pan_left/right/up/down`, `punch_in`
  (fast zoom for the hook), `static`; optional shake.
- Transitions: `cut`, `crossfade`, `dip_black`, `flash`, `whip` (slide + motion blur), `zoom`.
- One FFmpeg encode: grade (`eq`, `colorbalance`, `vignette`) + libass subtitles + AAC audio,
  H.264 High, yuv420p, 30 fps, 1080x1920 (preview 540x960 with a PREVIEW watermark).

## Reviewed notes
Observations that only a human/Claude can make from the contact sheets are stored with
`studio notes <video-id> --file notes.json`:

```json
{
  "observations": [
    {"category": "subtitles", "feature": "font_category",
     "description": "Heavy geometric sans-serif, all caps, white with thick black outline; active word turns yellow",
     "confidence": "medium", "evidence": "contact_captions.jpg, most crops"},
    {"category": "overlays", "description": "Small progress bar at the very top in most frames",
     "confidence": "high", "evidence": "contact_timeline.jpg 0:01-0:45", "timestamp": [1.0, 45.0]}
  ],
  "categorical": {}
}
```

`category`: subtitles, overlays, composition, footage, color, transitions, motion, story, hook, ending,
audio, music, pacing, editing. `confidence`: low | medium | high. Notes appear in the profile under
"Reviewed observations (per video, not yet rules)".

## Reviewing a preview contact sheet
Look for: captions colliding with other text, captions over very busy/bright areas, irrelevant or
repeated visuals, placeholders (grey striped "PLACEHOLDER" frames), too many static shots, transitions
that feel random, and scenes that do not match their narration.
