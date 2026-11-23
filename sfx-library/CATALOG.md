# Sound-effects library

Sound effects provided by the user (pack 'SFX 1', added 23 Nov 2026). Load them with sfxlib.py. Source and licence of the pack were not given; the file names call one of them 'no copyright'. Treat them as user-provided and check the source before monetised use.

Use from Python (`sfxlib.py`, numpy + ffmpeg):
```python
import sys; sys.path.insert(0, "sfx-library"); import sfxlib
x = sfxlib.load("whoosh_soft")              # (2, n) float, 48 kHz, trimmed to the onset, -20 dBFS RMS, peak <= -1 dBFS
start = t_cut - sfxlib.lead("whoosh_soft")  # its peak lands on t_cut
sfxlib.ids("pop")                           # ['pop_ui', 'pop_bubble']
```
The RicksClips studio picks these up for its effect types (`studio_kinds` in `catalog.json`: whoosh, impact, riser,
pop, ding, static); powerdown is still generated. After adding files: `python sfx-library/sfxlib.py --measure`,
then give the new entries an id, roles and studio kinds in `catalog.json`.

Measured from the files (onset = first sample above 3 % of the peak; length = onset to the last sample above 1 %).
All ten `.wav` files are mono duplicated to both channels with round lengths (0.4-1.8 s), which suggests they were
made in software; the `.mp3` files are mostly real stereo.

| id | file | roles | length | onset | peak at | level (RMS) | stereo | notes |
|---|---|---|---|---|---|---|---|---|
| `glitch` | 01-glitch-digital-distortion.wav | glitch, static, digital | 0.50 s | 0.00 s | 0.15 s | -4.5 dBFS | no | hits full scale (clipped); harsh, use quietly |
| `whoosh_soft` | 01-soft-digital-whoosh.mp3 | whoosh, transition | 0.59 s | 0.10 s | 0.30 s | -19.0 dBFS | yes |  |
| `buzz_error` | 02-error-denied-buzz.wav | buzz, wrong, ui | 0.40 s | 0.00 s | 0.01 s | -9.2 dBFS | no | very loud and at full scale: a comic 'wrong' / denied |
| `swipe_tech` | 02-smooth-tech-swipe.mp3 | whoosh, swipe, transition | 0.53 s | 0.08 s | 0.26 s | -20.1 dBFS | yes |  |
| `impact_subtle` | 03-subtle-digital-impact.mp3 | impact, tap, ui | 0.03 s | 0.00 s | 0.01 s | -15.9 dBFS | no | very short (30 ms) tap |
| `typing` | 03-typing-keyboard-burst.wav | typing, keyboard | 1.20 s | 0.18 s | 1.37 s | -28.8 dBFS | no | 1.2 s of keys, ends on one louder key at 1.37 s |
| `tick_roll` | 04-counter-tick-number-roll.wav | tick, counter, roll | 0.42 s | 0.02 s | 0.07 s | -16.8 dBFS | no | a fast tick roll (numbers counting); loops well |
| `pop_ui` | 04-soft-ui-pop.mp3 | pop, ui | 0.02 s | 0.05 s | 0.05 s | -18.2 dBFS | yes | short soft pop, the rest of the file is silence |
| `whoosh_airy` | 05-airy-whoosh.mp3 | whoosh, swell, air | 1.39 s | 0.16 s | 0.71 s | -21.0 dBFS | yes | long (1.4 s) airy swell |
| `card_slide` | 05-card-slide-paper-swipe.wav | paper, card, swipe | 0.37 s | 0.02 s | 0.26 s | -16.9 dBFS | no | a card / sheet sliding |
| `boom` | 06-deep-cinematic-boom.wav | impact, boom, low | 1.18 s | 0.00 s | 0.02 s | -15.1 dBFS | no |  |
| `blip_tech` | 06-digital-glitch-tech-blip.mp3 | blip, screen, ui, digital | 0.47 s | 0.00 s | 0.20 s | -15.8 dBFS | yes | bright; peaks slightly over full scale after resampling |
| `riser` | 07-riser-build-up.wav | riser, build | 1.46 s | 0.34 s | 1.75 s | -16.2 dBFS | no | peaks at its very end (1.75 s): place its end on the hit |
| `whoosh_smooth` | 07-smooth-transition-whoosh.mp3 | whoosh, transition | 0.47 s | 0.29 s | 0.71 s | -23.0 dBFS | yes |  |
| `whoosh_heavy` | 08-heavy-whoosh.wav | whoosh, heavy | 1.01 s | 0.12 s | 0.67 s | -17.5 dBFS | no |  |
| `chime_success` | 08-soft-success-chime.mp3 | ding, chime, success | 1.38 s | 0.01 s | 0.26 s | -17.3 dBFS | no |  |
| `ding` | 09-notification-ding.wav | ding, notify | 0.99 s | 0.00 s | 0.00 s | -15.0 dBFS | no |  |
| `sting_reveal` | 10-mystery-secret-reveal-sting.wav | sting, reveal, low | 0.96 s | 0.02 s | 0.39 s | -11.2 dBFS | no | low (centroid ~180 Hz), loud |
| `click_mouse` | Mouse Click Sound Effect.mp3 | click, ui | 0.14 s | 1.04 s | 1.05 s | -24.2 dBFS | yes | 1.04 s of silence before the click (load() trims it) |
| `pop_bubble` | Pop Bubble Sound Effect.mp3 | pop, bubble | 0.12 s | 0.31 s | 0.31 s | -12.7 dBFS | no | 0.3 s of silence before the pop (load() trims it) |
| `click_shutter` | Shutter Click sound effect (no copyright ).mp3 | click, shutter | 0.23 s | 0.22 s | 0.34 s | -26.1 dBFS | no | camera shutter |
