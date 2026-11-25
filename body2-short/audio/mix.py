# Sound for "Body Number 2": a score that follows the doc's acts (a tense low pulse in acts 1-2, rising strings in the
# act-3 montage, a warm piano in act 4) and SFX on the picture's cues (heartbeat + digital tick, whooshes, the sheet,
# orchestral hits, the door boom and heels on marble, UI beeps, running steps, the drawer, the paper, a bass drop and a
# reversed cymbal, the light flicker, the hologram sweep, monitor beep, engine, waves and a gull, the pen, flashbulbs,
# wind and a cheer, the clock flip and a sub hit, the oven, the alarm, the crust, a final chord and an oven bell).
# Mix: music -14 LU under the voice, SFX -15 LU, master -14 LUFS, true peak -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from body2-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/body2/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S
sys.path.insert(0, os.path.join(ROOT, "..", "sfx-library"))
import sfxlib as LIB

FPS, TOTAL = 30, 1560          # must match finance-short/src/videos/body2/story.ts TOTAL
DUR = TOTAL / FPS
N = ns(DUR)
WORDS = json.load(open(os.path.join(ROOT, "voice", "words.json")))
CUES = []


def W(word, nth=0, line=None):
    """time (s) of the nth occurrence of a word (optionally inside one line of the script)"""
    k = 0
    for w in WORDS:
        if (line is None or w["line"] == line) and w["w"].lower().strip(".,?!") == word.lower():
            if k == nth:
                return w["s"]
            k += 1
    raise KeyError(word)


fr = lambda f: f / FPS
F = I.m2f
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
m = lambda name: 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]
CH = {"C": ["C", "E", "G"], "F": ["F", "A", "C"], "G": ["G", "B", "D"], "Am": ["A", "C", "E"], "Dm": ["D", "F", "A"],
      "Em": ["E", "G", "B"], "E": ["E", "G#", "B"], "G7": ["G", "B", "F"], "Bb": ["A#", "D", "F"]}


def chord(name, octave=3):
    out, last = [], -1
    for n in CH[name]:
        x = 12 * (octave + 1) + NOTE[n]
        while x <= last:
            x += 12
        out.append(x); last = x
    return out


R = rng(808)
MUS = np.zeros((2, N))
SF = np.zeros((2, N))


def put(x, t, g=1.0, p=0.0, buf=None):
    if np.ndim(x) == 1:
        x = pan(x, p)
    place(MUS if buf is None else buf, x, t, g)


def sfx(x, t, g=1.0, p=0.0, what=None):
    put(x, t, g, p, SF)
    if what:
        CUES.append((t, what))


def guitar(midi, t, vel=0.5, p=0.0, dur=1.3, bright=0.45):
    put(I.pluck(F(midi), vel, R, dur, bright=bright, pos=0.14), t, 1.0, p)


def glk(midi, t, vel=0.5, p=0.25):
    put(I.glock(F(midi), vel, R, 1.6), t, 0.5, p)


def arp(t0, t1, chords, vel=0.42, step=0.3, p=-0.15, octave=3, bright=0.45):
    """eighth-note fingerpicking: root, fifth, third, fifth, octave, fifth, third, fifth; one chord per bar"""
    t, k = t0, 0
    while t < t1 - 0.02:
        c = chord(chords[(k // 8) % len(chords)], octave)
        pat = [c[0], c[2], c[1] + 12, c[2], c[0] + 12, c[2], c[1] + 12, c[2]]
        guitar(pat[k % 8], t, vel * (1.0 if k % 4 == 0 else 0.72), p, 1.1, bright)
        t += step; k += 1


def pad(names, t0, t1, vel=0.35, att=0.8, rel=0.8, octave=3):
    put(I.pad([F(x) for x in chord(names, octave)], t1 - t0, vel, R, att=att, rel=rel), t0, 0.7)


def low(midi, t, vel=0.6, dur=0.6):
    put(lp(I.pluck(F(midi), vel, R, dur, bright=0.25, pos=0.25), 1600), t, 1.0, 0.0)


def motif(t, notes, step=0.3, vel=0.5):
    for i, n in enumerate(notes):
        if n:
            glk(m(n), t + i * step, vel)


# =============================================================== score
def pulse(t0, t1, midi, step, vel=0.4):
    t = t0
    while t < t1 - 0.02:
        low(midi, t, vel, step * 0.9); t += step


drone_ = lambda midi, a, b2, v=0.35: put(I.pad([F(midi), F(midi + 7)], b2 - a, v, R, att=1.0, rel=0.8), a, 0.8)
# act 1-2: tense low pulse
pulse(fr(0), fr(424), m("D1"), 0.5, 0.38)
drone_(m("D2"), fr(172), fr(424), 0.28)
pulse(fr(424), fr(800), m("D1"), 0.33, 0.42)
drone_(m("A1"), fr(424), fr(800), 0.3)
put(I.pad([F(m("A5")), F(m("E6"))], fr(800) - fr(697), 0.16, R, att=0.6, rel=0.6), fr(697), 0.6)   # the shimmer
# act 3: rising strings in the montage, then a warm swell at the signing and the balcony
arp(fr(800), fr(955), ["Dm", "F", "C", "G"], 0.36, step=0.18)
arp(fr(955), fr(1081), ["F", "C", "G", "C"], 0.44, step=0.2)
pad("C", fr(955), fr(1081), 0.3, att=0.8)
# act 4: midnight, then the warm piano
drone_(m("D1"), fr(1081), fr(1150), 0.3)
arp(fr(1195), DUR - 1.8, ["C", "Am", "F", "G"], 0.34, step=0.36, bright=0.35)
motif(fr(1357), ["C5", "E5", "G5", "C6"], 0.2, 0.45)
pad("C", fr(1357), DUR - 0.05, 0.34, att=0.6, rel=1.4)

# =============================================================== SFX
Q = rng(31)


def stamp(r):
    """a rubber stamp: a dull wooden knock with a slap"""
    t = tt(0.3)
    y = np.sin(phase(150 * (1 + 0.5 * np.exp(-t / 0.012)))) * np.exp(-t / 0.05) * 0.8
    y += bp(r.standard_normal(len(t)), 500, 4000, 1) * np.exp(-t / 0.012) * 0.55
    return fades(y, 0.0003, 0.05)


def tick(r, f0=2600):
    """a card landing on the pile"""
    t = tt(0.12)
    return (bp(r.standard_normal(len(t)), f0 * 0.6, f0 * 1.6, 1) * np.exp(-t / 0.006) * 0.6
            + np.sin(phase(f0 * 0.5)) * np.exp(-t / 0.01) * 0.15)


def pop_small(r, f0=600):
    t = tt(0.2)
    return np.sin(phase(f0 * (1 + 1.2 * np.exp(-t / 0.01)))) * np.exp(-t / 0.04) * 0.5


def ding(r, f=2093):
    return modal(1.2, [(f, 1.0, 0.5), (f * 2.76, 0.25, 0.15)], r) * 0.35


def till(r):
    """cash-register bell + a little coin rattle"""
    y = modal(1.4, [(2637, 1.0, 0.6), (2637 * 2.76, 0.3, 0.2), (3951, 0.5, 0.4)], r) * 0.4
    y[: ns(0.4)] += S.rattle(0.4, r, density=40)[: ns(0.4)] * 0.25
    return y


def knock(r):
    t = tt(0.18)
    return modal(0.18, [(420, 1.0, 0.03), (980, 0.5, 0.02)], r) + bp(r.standard_normal(len(t)), 800, 5000, 1) * np.exp(-t / 0.004) * 0.4


def key(r):
    t = tt(0.06)
    return bp(r.standard_normal(len(t)), 1500, 7000, 1) * np.exp(-t / 0.004) * r.uniform(0.3, 0.6)


def typing(dur, r, rate=11):
    y = np.zeros(ns(dur + 0.1)); t = 0.0
    while t < dur:
        S._place_mono(y, key(r), t); t += r.uniform(0.5, 1.5) / rate
    return y


def blip(r, f=1320):
    t = tt(0.16)
    return (np.sin(phase(f)) * (t < 0.07) + np.sin(phase(f * 1.5)) * (t >= 0.07)) * np.exp(-t / 0.08) * 0.35


def riffle(dur, r, rate=26):
    """paper flicks (calendar pages, cards fanning)"""
    y = np.zeros(ns(dur + 0.1)); t = 0.0
    while t < dur:
        c = bp(r.standard_normal(ns(0.05)), 1500, 8000, 1) * np.exp(-tt(0.05) / 0.012) * r.uniform(0.3, 0.7)
        S._place_mono(y, c, t); t += r.uniform(0.6, 1.4) / rate
    return y


def clatter(r, dur=1.3):
    """the tower bursting: a burst of flicks that thins out, cards skittering on marble"""
    n = ns(dur); y = np.zeros(n)
    for k in range(160):
        tm = dur * (r.random() ** 2.2)
        c = bp(r.standard_normal(ns(0.04)), 1800, 9000, 1) * np.exp(-tt(0.04) / 0.008) * r.uniform(0.2, 0.8)
        S._place_mono(y, c, tm)
    t = tt(dur)
    y += bp(r.standard_normal(n), 300, 2000, 1) * np.exp(-t / 0.15) * 0.4
    return fades(y, 0.001, 0.2)


def thud(r, f0=70):
    t = tt(0.5)
    return fades(np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.12) * 0.9 + lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.05) * 0.3, 0.002, 0.05)


def unroll(dur, r):
    """a long receipt unrolling: a fast soft ratchet that slows down"""
    y = np.zeros(ns(dur + 0.1)); t = 0.0
    while t < dur:
        c = bp(r.standard_normal(ns(0.03)), 1200, 5000, 1) * np.exp(-tt(0.03) / 0.006) * 0.35
        S._place_mono(y, c, t); t += 0.025 + 0.06 * (t / dur) ** 2
    return y


def tear(r):
    y = np.zeros(ns(0.35))
    for k in range(9):
        c = bp(r.standard_normal(ns(0.04)), 1500, 7000, 1) * np.exp(-tt(0.04) / 0.01) * r.uniform(0.3, 0.8)
        S._place_mono(y, c, k * 0.03 + r.uniform(0, 0.01))
    return fades(y, 0.0005, 0.05)


def plop(r, f0=380):
    t = tt(0.3)
    y = np.sin(phase(f0 * (1 + 1.4 * (t / 0.3) ** 0.6))) * np.exp(-t / 0.05) * 0.5
    y += bp(r.standard_normal(len(t)), 300, 2500, 1) * np.exp(-t / 0.03) * 0.3
    return fades(y, 0.0005, 0.05)


def clank(r):
    """an iron fence panel slamming up: a ringing metal hit"""
    d = 0.9; t = tt(d)
    y = modal(d, [(310, 1.0, 0.12), (720, 0.6, 0.08), (1290, 0.4, 0.05), (2110, 0.25, 0.03)], r)
    y += bp(r.standard_normal(len(t)), 600, 6000, 1) * np.exp(-t / 0.006) * 0.8
    return fades(y * 0.7, 0.0003, 0.1)


def swish(r, dur=0.35):
    return I.brush(0.7, r, dur, swish=True)


two = lambda x, p=0.0: x if np.ndim(x) == 2 else pan(x, p)


def lib(key, t, g=1.0, p=0.0, what=None, peak=False):
    """a library sound (sfxlib: trimmed to its onset, -20 dBFS RMS) at t; peak=True puts its peak on t"""
    x = LIB.load(key, SR)
    if p:
        x = x * np.array([[np.cos((p + 1) * np.pi / 4)], [np.sin((p + 1) * np.pi / 4)]]) * np.sqrt(2)
    sfx(x, max(0.0, t - (LIB.lead(key) if peak else LIB.PRE)), g, 0.0, what)


def buzzwood(dur, r):
    """a phone vibrating on a wooden table: a 170 Hz motor buzz with a rattle"""
    t = tt(dur); y = np.sign(np.sin(phase(170))) * 0.25 + bp(r.standard_normal(len(t)), 300, 2500, 1) * 0.15
    env = ((t % 0.5) < 0.32).astype(float)
    return fades(bp(y, 120, 3000, 1) * env, 0.005, 0.03)


def hum(dur, r, f0=60, g=0.12):
    t = tt(dur); y = sum(np.sin(phase(f0 * k)) / k for k in (1, 2, 3, 5))
    return fades(y * g + lp(r.standard_normal(len(t)), 200) * 0.03, 0.3, 0.3)


def tap(r):
    t = tt(0.05); return bp(r.standard_normal(len(t)), 1500, 6000, 1) * np.exp(-t / 0.006) * 0.5


def click(r, f0=3000):
    t = tt(0.04); return (np.sin(phase(f0)) * 0.3 + bp(r.standard_normal(len(t)), 2000, 9000, 1) * 0.4) * np.exp(-t / 0.004)


def creak(r, dur=0.6):
    t = tt(dur); f = 180 * (1 + 0.25 * np.sin(TAU * 1.3 * t)) + 40 * np.sin(TAU * 7 * t)
    y = np.sign(np.sin(phase(f))) * (0.5 + 0.5 * np.sin(TAU * 23 * t)) * 0.15
    return fades(bp(y, 200, 2500, 1) * np.sin(np.pi * t / dur), 0.02, 0.05)


def doorknock(r):
    """a fist on a wooden door: a low thump, the door panel's resonance, the chain rattling"""
    t = tt(0.7)
    y = np.sin(phase(95 * (1 + 0.8 * np.exp(-t / 0.01)))) * np.exp(-t / 0.08) * 0.9
    y += modal(0.7, [(180, 0.5, 0.12), (420, 0.3, 0.06)], r) * 0.5
    y += bp(r.standard_normal(len(t)), 500, 3000, 1) * np.exp(-t / 0.01) * 0.4
    y[ns(0.05):ns(0.05) + ns(0.3)] += S.rattle(0.3, r, density=30)[:ns(0.3)] * 0.12
    return fades(y, 0.001, 0.1)


def sockstep(r):
    t = tt(0.15); return lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.03) * 0.3


def swell(r, dur=1.2):
    """a reversed piano note: rises and stops dead"""
    t = tt(dur); y = modal(dur, [(F(m("A5")), 1.0, 0.6), (F(m("A5")) * 2, 0.3, 0.4)], r)
    return fades(y[::-1] * 0.6, 0.05, 0.005)


def exhale(r, dur=1.1):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), 300, 3000, 1) * np.sin(np.pi * t / dur) ** 2 * 0.35, 0.05, 0.1)


def heartbeat(t0, t1, bpm=60, g=0.6):
    t = t0
    while t < t1:
        for k, a in ((0, 1.0), (0.18, 0.7)):
            sfx(thud(Q, 55), t + k, g * a, 0.0)
        t += 60 / bpm


def blipb(r, f=1600):
    t = tt(0.1); return np.sin(phase(f)) * np.exp(-t / 0.03) * 0.3


def riffle(dur, r, rate=26):
    y = np.zeros(ns(dur + 0.1)); t = 0.0
    while t < dur:
        c = bp(r.standard_normal(ns(0.05)), 1500, 8000, 1) * np.exp(-tt(0.05) / 0.012) * r.uniform(0.3, 0.7)
        S._place_mono(y, c, t); t += r.uniform(0.6, 1.4) / rate
    return y


def thud(r, f0=70):
    t = tt(0.5)
    return fades(np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.12) * 0.9 + lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.05) * 0.3, 0.002, 0.05)


def heel(r):
    t = tt(0.12); return (bp(r.standard_normal(len(t)), 1500, 6000, 1) * np.exp(-t / 0.008) * 0.6 + np.sin(phase(900)) * np.exp(-t / 0.02) * 0.2)


def noise_bed(dur, r, lo, hi, g=0.3):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), lo, hi, 1) * g, 0.3, 0.4)


def scrape(r, dur=0.5):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), 300, 2500, 1) * (0.6 + 0.4 * np.sin(TAU * 13 * t)) * 0.45, 0.02, 0.1)


# 1 heartbeat + digital tick
heartbeat(fr(4), fr(100), 58, 0.5)
for k in range(3):
    sfx(click(Q, 2400), fr(8) + k * 1.0, 0.3, 0.2, "digital tick" if k == 0 else None)
# 2 whoosh, sheet, orchestral hit
lib("whoosh_heavy", fr(112), 0.4, 0.0, "the sheets fly off", peak=True); sfx(riffle(0.6, Q, 40), fr(112), 0.35, 0.1)
lib("boom", fr(118), 0.3, 0.0, "tiny orchestral hit"); lib("chime_success", fr(120), 0.2, 0.0)
# 3 breath, drone
sfx(exhale(Q, 1.2), fr(200), 0.5, 0.0, "shaky breath")
# 4 rising string note
put(I.pad([F(m("A4"))], fr(292) - fr(240), 0.2, R, att=1.4, rel=0.2), fr(240), 0.6); CUES.append((fr(240), "rising string note"))
# 5 the door boom, heels on marble
sfx(doorknock(Q), fr(292), 1.0, 0.0, "the doors burst open"); lib("boom", fr(292), 0.35, 0.0)
for k in range(5):
    sfx(heel(Q), fr(298) + k * 0.33, 0.45, 0.0)
# 6 UI beeps, swipe
for k in range(3):
    sfx(blipb(Q, 1400 + 300 * k), fr(356) + k * 0.25, 0.4, 0.2, "UI beeps" if k == 0 else None)
lib("swipe_tech", fr(384), 0.4, 0.0, "whip pan", peak=True)
# 7 running steps, flags
for k in range(8):
    sfx(heel(Q), fr(397) + k * 0.12, 0.5, -0.1)
sfx(riffle(0.9, Q, 20), fr(400), 0.25, 0.4, "flag flutter")
# 8 drawer + paper
sfx(scrape(Q), fr(430), 0.6, 0.0, "the drawer slides open"); sfx(riffle(0.4, Q, 30), fr(446), 0.35, 0.0)
# 9 ticking clock, a sharp inhale
for k in range(int((fr(580) - fr(480)) / 0.5)):
    sfx(click(Q, 1800), fr(480) + k * 0.5, 0.25, 0.3)
sfx(exhale(Q, 0.5), fr(566), 0.5, 0.0, "a sharp inhale")
# 10 bass drop + reversed cymbal
sfx(swell(Q, 0.9), fr(584) - 0.9, 0.5, 0.0); lib("boom", fr(584), 0.55, 0.0, "bass drop, dolly zoom")
# 11 the lights flicker
for k in range(4):
    sfx(click(Q, 900), fr(626) + k * 0.07, 0.4, 0.0, "electrical flicker" if k == 0 else None)
sfx(thud(Q, 45), fr(640), 0.5, 0.0)
# 12-13 low pulse, the heartbeat doubles, shimmer
heartbeat(fr(697), fr(745), 120, 0.4); CUES.append((fr(697), "heartbeat doubles"))
# 14 the hologram
lib("riser", fr(790), 0.35, 0.0, peak=True); lib("swipe_tech", fr(750), 0.45, 0.0, "sci-fi sweep", peak=True)
# 15-17 the montage
for k in range(3):
    sfx(blipb(Q, 1000), fr(802) + k * 0.33, 0.5, 0.0, "monitor beep" if k == 0 else None)
sfx(noise_bed(1.0, Q, 80, 900, 0.5), fr(830), 0.7, 0.0, "engine roar")
sfx(noise_bed(1.0, Q, 200, 1500, 0.25), fr(860), 0.6, 0.0, "waves")
sfx(S.whoosh(0.4, Q, peak=0.2, f_lo=2500, f_hi=4500) if hasattr(S, "whoosh") else blipb(Q, 3000), fr(872), 0.2, 0.4, "gull")
# 18-19 the pen, the glitter
sfx(riffle(1.0, Q, 18), fr(892), 0.3, 0.0, "pen scratching"); sfx(riffle(0.9, Q, 22), fr(924), 0.35, 0.0)
lib("chime_success", fr(940), 0.35, 0.2, "glittering chime")
# 20 flashbulbs, the pen tap
for k in (960, 972, 985, 991, 1003, 1012):
    lib("click_shutter", fr(k), 0.35, Q.uniform(-0.6, 0.6))
sfx(tap(Q), fr(1000), 0.5, 0.0, "pen tap")
# 21 wind + a distant cheer
sfx(noise_bed(2.0, Q, 200, 1200, 0.25), fr(1021), 0.6, 0.0, "wind"); sfx(noise_bed(1.4, Q, 400, 3000, 0.2), fr(1035), 0.4, -0.3, "distant cheer")
# 22 the clock flips, a deep sub hit
sfx(click(Q, 2600), fr(1112), 0.6, 0.0, "the clock flips to 12:00"); sfx(thud(Q, 38), fr(1112), 0.9, 0.0)
# 23 the bakery: smash cut, alarm, oven crackle
lib("impact_subtle", fr(1150), 0.5, 0.0, "smash cut to the bakery")
for k in range(4):
    sfx(blipb(Q, 2200), fr(1152) + k * 0.22, 0.5, 0.0, "alarm" if k == 0 else None)
sfx(riffle(4.0, Q, 8), fr(1150), 0.18, 0.3, "oven crackle")
# 24 the crust
sfx(riffle(0.25, Q, 60), fr(1215), 0.6, 0.0, "crust crunch")
# 25-26 the swell, the final chord, silence, one oven bell
lib("whoosh_airy", fr(1290), 0.3, 0.0, peak=True)
lib("ding", fr(1520), 0.45, 0.0, "one oven bell")

# =============================================================== mix
def limiter(x, ceil_db=-1.2, look=0.004, rel=0.08):
    """4x-oversampled peak detection (in blocks), look-ahead gain with a smooth release"""
    n = x.shape[1]; pk = np.empty(n); B = SR * 20
    for a in range(0, n, B):
        seg = x[:, max(0, a - 256):min(n, a + B + 256)]
        up = signal.resample_poly(seg, 4, 1, axis=1)
        p = np.abs(up).max(axis=0); p = p[: (len(p) // 4) * 4].reshape(-1, 4).max(axis=1)
        o = a - max(0, a - 256)
        pk[a:min(n, a + B)] = p[o:o + min(n, a + B) - a]
    g = np.minimum(1.0, dbg(ceil_db) / np.maximum(pk, 1e-9))
    L = ns(look)
    g = np.lib.stride_tricks.sliding_window_view(np.pad(g, (0, L), constant_values=1), L + 1).min(axis=1)
    out = g.copy(); a_ = np.exp(-1 / (rel * SR)); idx = np.where(g < 0.9999)[0]
    if len(idx):
        cur = 1.0; last = -10
        ends = np.where(np.diff(idx) > 1)[0]
        starts = np.concatenate([[idx[0]], idx[ends + 1]]); stops = np.concatenate([idx[ends], [idx[-1]]])
        for s0, s1 in zip(starts, stops):
            cur = 1.0 if s0 - last > ns(rel * 6) else cur
            i = s0
            while i < n and (i <= s1 or cur < 0.9995):
                cur = g[i] if g[i] < cur else a_ * cur + (1 - a_) * g[i]
                out[i] = min(out[i], cur); i += 1
            last = i
    return x * out[None, :]


v, vsr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
v = v if v.ndim == 1 else v.mean(axis=0)
v = signal.resample_poly(v, SR, vsr)
voice = np.zeros((2, N)); n0 = min(N, len(v)); voice[:, :n0] = v[:n0][None, :]
mask = np.zeros(N)
for w in WORDS:
    a, b = ns(w["s"] - 0.05), ns(w["e"] + 0.12)
    mask[max(0, a):min(N, b)] = 1
win = ns(0.12); mask = np.clip(signal.fftconvolve(mask, np.hanning(win) / np.hanning(win).sum(), mode="same"), 0, 1)
vl = integrated(voice)
MUS *= dbg(vl - 14.0 - integrated(MUS))
MUS *= (1 - (1 - dbg(-3.0)) * mask)[None, :]
SF *= dbg(vl - 15.0 - integrated(SF))
mix = voice + MUS + SF
e = np.minimum(1, (N - np.arange(N)) / ns(0.6)); mix *= e[None, :]
for _ in range(2):
    mix = limiter(mix * dbg(-14.0 - integrated(mix)), -1.5)
write_wav(os.path.join(HERE, "mix.wav"), mix)
PUB = os.path.join(ROOT, "..", "finance-short", "public", "body2"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: Body Number 2\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
