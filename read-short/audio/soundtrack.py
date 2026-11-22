# Soundtrack for "The Janitor Who Had $8 Million" (Ronald Read): an original warm small-town score (fingerpicked
# plucked strings in G, glockenspiel, soft pad, music box outro) with stops on the punch lines; synthesized SFX on
# the picture's frames; the voice unchanged.
# Mix: music bed ~-10 LU under the voice and ducked 3 dB under words, SFX bed below that; master -14 LUFS integrated,
# true peak <= -1 dBTP, 48 kHz stereo 24-bit, exactly TOTAL frames long.
# usage: python soundtrack.py   (writes mix.wav, stem_*.wav, cues.md next to this file)
import os, json
import numpy as np
from scipy import signal
from dsp import (SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, smooth_noise, fades, modal, pan, st, place, widen,
                 make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, dbg, phase)
import instruments as I
import sfx_gen as S

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FPS, TOTAL = 30, 1110
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
WORDS = json.load(open(os.path.join(ROOT, "voice", "words.json")))
CUES = []


def cue(t, what):
    CUES.append((t, what))


# =============================================================== music
BEAT = 0.5  # 120 bpm
F = I.m2f
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def m(name):
    """'D5' -> midi"""
    return 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]


R = rng(1720)
MUS = np.zeros((2, N))


def put(x, t, g=1.0, p=0.0):
    if np.ndim(x) == 1:
        x = pan(x, p)
    place(MUS, x, t, g)


def harpsi(midi, t, vel=0.6, dur=0.7, p=0.0):
    """harpsichord-like pluck: bright, close to the bridge, short"""
    a = I.pluck(F(midi), vel, R, dur, bright=0.95, pos=0.09) * 0.9
    b = I.pluck(F(midi + 12), vel * 0.25, R, dur, bright=0.9, pos=0.07)
    put(a + b[: len(a)], t, 1.0, p)


def pizz(midi, t, vel=0.7, p=-0.2):
    put(I.pluck(F(midi), vel, R, 0.8, bright=0.35, pos=0.2), t, 1.0, p)


def glk(midi, t, vel=0.5, p=0.25):
    put(I.glock(F(midi), vel, R, 1.6), t, 0.55, p)


def mbox(midi, t, vel=0.55, p=0.1):
    put(I.musicbox(F(midi), vel, R, 1.8), t, 0.6, p)


def roll(t0, t1, v0, v1, g=0.35):
    for tm, v in I.snare_roll(t0, t1, v0, v1, R):
        put(I.snare(v, R, 0.2, buzz=True), tm, g, 0.05)


def tuba(midi, t, dur, vel=0.7, fall=0.0):
    put(I.brass(F(midi), dur, vel, R, "tuba", fall=fall), t, 0.7, 0.0)


CH = {"D": ["D", "F#", "A"], "A": ["A", "C#", "E"], "Bm": ["B", "D", "F#"], "G": ["G", "B", "D"], "E": ["E", "G#", "B"],
      "F#m": ["F#", "A", "C#"], "C#m": ["C#", "E", "G#"], "B": ["B", "D#", "F#"], "F#": ["F#", "A#", "C#"], "Dm": ["D", "F", "A"],
      "Gm": ["G", "A#", "D"], "A7": ["A", "C#", "G"], "Em": ["E", "G", "B"], "C": ["C", "E", "G"], "Am": ["A", "C", "E"]}
TR = lambda c, k: c  # chords are spelled per section below


def chord_midis(name, octave=4, shift=0):
    out, last = [], -1
    for n in CH[name]:
        x = 12 * (octave + 1) + NOTE[n] + shift
        while x <= last:
            x += 12
        out.append(x); last = x
    return out


def broken(t0, chords, oct=4, vel=0.45, shift=0, beats_per=2, pattern=(0, 1, 2, 1), bass=True):
    """broken-chord harpsichord in eighths + pizzicato roots on beats 1 and 3"""
    t = t0
    for c in chords:
        ms = chord_midis(c, oct, shift)
        for k in range(beats_per * 2):
            harpsi(ms[pattern[k % len(pattern)]], t + k * BEAT / 2, vel * (1.0 if k % 2 == 0 else 0.8), 0.45, p=0.15)
        if bass:
            root = chord_midis(c, 2, shift)[0]
            pizz(root, t, 0.8)
            if beats_per >= 2:
                pizz(root + 7, t + BEAT, 0.6)
        t += beats_per * BEAT
    return t


# the theme (original): eighth-note lines in D, (midi offset from D4, length in eighths)
THEME = [(12, 1), (16, 1), (19, 1), (16, 1), (17, 1), (14, 1), (11, 1), (7, 1), (9, 1), (12, 1), (17, 1), (16, 1), (14, 2), (12, 2),
         (12, 1), (14, 1), (16, 1), (19, 1), (21, 1), (19, 1), (16, 1), (14, 1), (12, 1), (9, 1), (11, 1), (14, 1), (12, 4)]


def theme(t0, inst, shift=0, vel=0.55, gate=1.0, stretch=1.0, upto=None):
    t = t0
    for k, (o, L) in enumerate(THEME):
        if upto is not None and t >= upto:
            break
        inst(m("D4") + o + shift, t, vel)
        t += L * BEAT / 2 * stretch
    return t


def guitar(midi, t, vel=0.5, p=0.0, dur=1.4):
    put(I.pluck(F(midi), vel, R, dur, bright=0.45, pos=0.14), t, 1.0, p)


GB = 0.625  # 96 bpm


def fingerpick(t0, t1, chords, vel=0.42):
    """travis-style picking in eighths: bass on 1 and 3 alternating root / fifth, treble notes in between"""
    t, k = t0, 0
    while t < t1 - 0.05:
        c = chords[(k // 8) % len(chords)]
        ms = chord_midis(c, 3)
        step = k % 8
        if step in (0, 4):
            guitar(ms[0] - 12 if step == 0 else ms[2] - 12, t, vel * 1.1, -0.15)
        else:
            guitar([ms[1] + 12, ms[2] + 12, ms[0] + 24, ms[2] + 12][step % 4], t, vel * 0.7, 0.2, 1.0)
        t += GB / 2; k += 1


MELODY = [(7, 2), (9, 1), (11, 1), (14, 2), (11, 2), (12, 1), (11, 1), (9, 1), (7, 1), (9, 4),
          (7, 2), (9, 1), (11, 1), (14, 2), (16, 2), (14, 1), (12, 1), (11, 1), (9, 1), (7, 4)]


def melody(t0, t1, inst, shift=0, vel=0.45):
    t = t0
    for o, L in MELODY * 3:
        if t >= t1:
            break
        inst(m("G4") + o + shift, t, vel)
        t += L * GB / 2


def music():
    G = ["G", "D", "Em", "C"]
    # ---- hook: soft picking, a glock sparkle and cymbal swell on "eight million"
    fingerpick(0.0, fr(134), G, 0.34)
    put(I.cymbal(0.3, R, 1.8), fr(95), 0.3)
    for j, mi in enumerate(["D6", "G6", "B6", "D7"]):
        glk(m(mi), fr(97) + j * 0.06, 0.4)
    cue(fr(97), "music: sparkle on 'eight million'")
    # ---- his working life (S2-S4): picking + glock melody
    fingerpick(fr(136), fr(400), G, 0.4)
    melody(fr(140), fr(396), lambda mi, tt_, v: glk(mi + 12, tt_, v * 0.6))
    glk(m("E7"), fr(387), 0.4)
    # ---- the diner (S5): lighter, pizzicato; a little 'aww' fall on "couldn't afford it"
    fingerpick(fr(405), fr(500), ["C", "G", "Am", "D"], 0.32)
    for k, mi in enumerate(["B4", "A4", "G4", "F#4"]):
        guitar(m(mi), fr(502) + k * 0.12, 0.5, 0.0, 0.8)
    cue(fr(502), "music: falling notes on 'couldn't afford it'")
    # ---- the secret (S6): stop on "secret?", then three rising glock pops for soap / medicine / electricity
    for tf, mi in [(622, "G5"), (632, "B5"), (650, "D6")]:
        glk(m(mi), fr(tf), 0.55); glk(m(mi) + 12, fr(tf) + 0.03, 0.25)
    fingerpick(fr(548), fr(672), G, 0.36)
    cue(fr(539), "music: picking restarts after 'His secret?'")
    # ---- decades (S7, golden): warm pad + picking, coins
    put(I.pad([F(m("G3")), F(m("D4")), F(m("B4"))], fr(764) - fr(674), 0.45, R, att=0.8, rel=0.5), fr(674), 0.7)
    fingerpick(fr(674), fr(762), ["G", "C", "G", "D"], 0.38)
    # ---- the gifts (S8-S9): uplifting, a lift on "library" and on "hospital"
    fingerpick(fr(764), fr(960), ["C", "G", "D", "Em"], 0.45)
    melody(fr(764), fr(958), lambda mi, tt_, v: glk(mi + 12, tt_, v * 0.65), shift=0)
    for tf in (869, 937):
        put(I.cymbal(0.3, R, 1.6), fr(tf), 0.4)
        for j, mi in enumerate(["G5", "B5", "D6", "G6"]):
            glk(m(mi), fr(tf) + j * 0.07, 0.45)
    # ---- the lesson (S10): music box melody over a pad, a final G chord
    put(I.pad([F(m("G3")), F(m("D4")), F(m("B4"))], fr(1110) - fr(962), 0.45, R, att=1.0, rel=0.3), fr(962), 0.65)
    melody(fr(1012), fr(1080), lambda mi, tt_, v: mbox(mi + 12, tt_, v), vel=0.45)
    for mi in ["G2", "D3", "G3", "B3", "D4", "G4"]:
        guitar(m(mi), fr(1088), 0.55, 0.0, 1.8)
    cue(fr(1088), "music: final G chord after 'wait'")
    ir = make_ir(1.0, 7, hf=0.7)
    wet = convolve_st(MUS, ir)[:, :N]
    return MUS * 0.85 + wet * 0.2


# =============================================================== SFX
SF = np.zeros((2, N))
Q = rng(31)


def sfx(x, t, g=1.0, p=0.0, what=None):
    if np.ndim(x) == 1:
        x = pan(x, p)
    place(SF, x, t, g)
    if what:
        cue(t, "sfx: " + what)


def addm(*xs):
    """sum mono signals of different lengths"""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def thud(r, f0=90, dur=0.25, soft=1.0):
    t = tt(dur)
    y = np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.06)
    y += lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.015) * 0.6 * soft
    return fades(y, 0.0005, 0.05)


def jingle(r, dur=0.6, n=10, lo=2600, hi=6200):
    y = np.zeros(ns(dur + 0.2))
    for k in range(n):
        c = S.clink(r, np.exp(r.uniform(np.log(lo), np.log(hi))), 0.16, 1.2)
        S._place_mono(y, c * r.uniform(0.4, 1.0), r.uniform(0, dur) ** 1.3 / dur ** 0.3)
    return y


def pop(r):
    """soap-bubble pop scaled up: a wet transient, a burst of bright noise, a low 'fwump' and droplet ticks"""
    dur = 1.6
    t = tt(dur)
    y = hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.035) * 1.2
    y += np.sin(phase(180 * (1 + 2.5 * np.exp(-t / 0.01)))) * np.exp(-t / 0.09) * 1.4
    y += bp(r.standard_normal(len(t)), 300, 2500, 1) * np.exp(-t / 0.1) * 0.3
    for k in range(10):
        c = S.clink(r, r.uniform(3000, 7000), 0.05, 0.6) * 0.25
        S._place_mono(y, c, 0.08 + r.uniform(0, 0.9))
    return fades(y, 0.0, 0.2)


def boing(r, f0=300, up=True):
    dur = 0.32
    t = tt(dur)
    f = f0 * (1 + (0.9 if up else -0.4) * (t / dur) ** 0.6) * (1 + 0.04 * np.sin(TAU * 28 * t))
    return addm(S.push_thump(r) * 0.6, np.sin(phase(f)) * np.exp(-t / 0.12) * 0.35)


def bonk(r):
    """woodblock bonk + a short spring wobble"""
    dur = 0.6
    t = tt(dur)
    y = modal(dur, [(720, 1.0, 0.05), (1630, 0.5, 0.03), (2900, 0.3, 0.015)], r)
    y += np.sin(phase(380 * (1 + 0.08 * np.sin(TAU * 14 * t) * np.exp(-t / 0.2)))) * np.exp(-t / 0.18) * 0.4
    return fades(y, 0.0, 0.08)


def twinkle(r, dur=1.4):
    y = np.zeros(ns(dur + 0.3))
    for k in range(7):
        f = [2093, 2637, 3136, 2349, 2794, 3520, 2637][k]
        S._place_mono(y, modal(0.4, [(f, 1.0, 0.12), (f * 2.76, 0.2, 0.04)], r) * 0.35, k * dur / 7)
    return y


def rustle(r, dur=0.4, level=1.0):
    n = ns(dur)
    tl = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(tl / dur, 0, 1)) ** 1.2 * (0.6 + 0.4 * smooth_noise(n, r, 18))
    return bp(r.standard_normal(n), 1500, 7000, 1) * e * 0.4 * level


def clang(r):
    """heavy iron gate shutting in a stone arch"""
    dur = 2.4
    t = tt(dur)
    y = modal(dur, [(98, 1.0, 0.9), (231, 0.7, 0.6), (402, 0.5, 0.4), (617, 0.35, 0.3), (911, 0.25, 0.2), (1340, 0.15, 0.12)], r)
    y += lp(r.standard_normal(len(t)), 1200) * np.exp(-t / 0.03) * 1.0
    return fades(y, 0.0, 0.3)


def crowd_bed(dur, r, voices=12, base_lo=95, base_hi=230):
    out = np.zeros((2, ns(dur)))
    for k in range(voices):
        b = r.uniform(base_lo, base_hi)
        y = S.babble(dur, r, b, r.uniform(0.95, 1.15) if b < 160 else r.uniform(1.1, 1.3), rate=4.6, active=0.7)
        out += pan(lp(y, 2800), r.uniform(-0.8, 0.8)) * r.uniform(0.5, 1.0)
    return out / np.sqrt(voices)


def cheer(dur, r, people=12):
    out = np.zeros((2, ns(dur + 1.0)))
    for k in range(people):
        b = r.uniform(100, 240)
        place(out, pan(S.hurrah(r, b, 1.0 if b < 160 else 1.2), r.uniform(-0.8, 0.8)) * r.uniform(0.5, 1.0), r.uniform(0, dur * 0.5))
    place(out, S.applause(dur, r, 20) * 0.5, 0.05)
    return out / np.sqrt(people) * 1.4


def gasp(r, people=10):
    out = np.zeros((2, ns(1.0)))
    for k in range(people):
        b = r.uniform(100, 240)
        place(out, pan(S.whoa(r, b), r.uniform(-0.8, 0.8)) * r.uniform(0.5, 1.0), r.uniform(0, 0.12))
    return out / np.sqrt(people) * 1.5


def ambience(a, b, kind, r):
    d = fr(b) - fr(a)
    x = S.breeze(d, r, 0.25 if kind != "quay" else 0.4)
    if kind in ("garden", "park"):
        x = x + pan(S.bird_chirps(d, r, 0.7, "sparrow"), 0.5) * 0.25 + pan(S.bird_chirps(d, r, 0.35, "blackbird"), -0.4) * 0.2
    n = x.shape[1]
    e = np.ones(n); k = min(n // 2, ns(0.25)); e[:k] = np.linspace(0, 1, k); e[-k:] = np.linspace(1, 0, k)
    sfx(x * e[None, :], fr(a), 0.8)


def pump_hum(dur, r):
    n = ns(dur); tl = np.arange(n) / SR
    y = bp(r.standard_normal(n), 300, 1400, 1) * 0.25 + np.sin(TAU * 120 * tl) * 0.05
    e = np.clip(tl / 0.15, 0, 1) * np.clip((dur - tl) / 0.2, 0, 1)
    return y * e


def swish(r, dur=0.45):
    return S.brush if False else I.brush(0.7, r, dur, swish=True)


def blip(r, f0=900):
    t = tt(0.18)
    return np.sin(phase(f0 * (1 + 0.8 * (t / 0.18)))) * np.exp(-t / 0.05) * 0.5


def nope(r):
    t = tt(0.35)
    return (np.sin(phase(180 * (1 - 0.3 * t / 0.35))) + 0.4 * np.sin(phase(360 * (1 - 0.3 * t / 0.35)))) * np.exp(-t / 0.15) * 0.4


def sfxs():
    r = Q
    for a, b, kind in [(0, 140, "garden"), (136, 410, "quay"), (405, 536, "garden"), (532, 768, "park"), (764, 966, "garden"), (962, TOTAL, "quay")]:
        ambience(a, b, kind, r)
    # hook: murmur, gasp on "eight million", money rustle
    bed = crowd_bed(fr(136), r, voices=8)
    sfx(bed * 0.5, 0.0, 0.8, 0.0, "town murmur")
    sfx(gasp(r, 8), fr(118), 0.55, 0.0, "the town gasps")
    for k in range(6):
        sfx(rustle(r, 0.35, 0.7), fr(98) + k * 0.12, 0.4, r.uniform(-0.5, 0.5))
    sfx(S.whoosh(0.6, r, 0.4), fr(136) - 0.4, 0.6, 0.0, "whoosh into the flash")
    # gas pump
    sfx(S.clink(r, 2200, 0.2, 0.6), fr(140), 0.6, 0.2, "nozzle click")
    sfx(pump_hum(fr(214) - fr(144), r), fr(144), 0.5, 0.2, "pump running")
    sfx(I.triangle(0.4, r, 0.8, 1760), fr(212), 0.4, 0.3, "pump bell")
    # mop swishes
    for k in range(5):
        sfx(swish(r, 0.5), fr(224) + k * 0.68, 0.6, 0.1 * (-1) ** k, "mop" if k == 0 else None)
    # car: a door thunk, then the pin glint
    sfx(thud(r, 95, 0.3), fr(300), 0.5, -0.2, "car door")
    sfx(twinkle(r, 0.5), fr(397), 0.3, -0.1, "safety pin glint")
    # diner: cup on saucer, the bill laid down
    sfx(S.clink(r, 2600, 0.3, 0.8), fr(415), 0.4, 0.2, "cup")
    sfx(rustle(r, 0.3, 0.9), fr(472), 0.6, 0.3, "money laid on the table")
    # the secret: newspaper fold, three pops
    sfx(rustle(r, 0.4, 1.0), fr(536), 0.6, 0.0, "newspaper folded")
    for tf, f0 in [(622, 700), (632, 900), (650, 1100)]:
        sfx(blip(r, f0), fr(tf), 0.6, 0.0, "icon pop")
    # decades: coins dropping onto the stack
    for k in range(12):
        sfx(S.clink(r, r.uniform(2800, 4600), 0.18, 1.0), fr(680) + k * 0.24 + r.uniform(0, 0.05), 0.35, -0.3)
    # the gifts: cheers and money rain
    for tf, g in [(869, 1.0), (937, 0.9)]:
        sfx(cheer(1.6, r, 12), fr(tf), g, 0.0, "cheer")
        for k in range(8):
            sfx(rustle(r, 0.3, 0.6), fr(tf) + 0.2 + k * 0.18, 0.3, r.uniform(-0.6, 0.6))
    # the lesson: river at dusk, 'nope' on lottery and crypto
    sfx(S.water_bed(fr(TOTAL) - fr(962), r, 0.4), fr(962), 0.25, 0.0, "river")
    for tf in (970, 993):
        sfx(nope(r), fr(tf), 0.6, 0.0, "crossed out")
    return SF


# =============================================================== mix
def speech_mask():
    """1 while a word is spoken (+ 120 ms tails), smoothed: the duck key"""
    k = np.zeros(N)
    for w in WORDS:
        a, b = ns(w["start"] - 0.05), ns(w["end"] + 0.12)
        k[max(0, a):min(N, b)] = 1.0
    win = ns(0.12)
    k = np.convolve(k, np.hanning(win) / np.hanning(win).sum(), mode="same")
    return np.clip(k, 0, 1)


def limiter(x, ceil_db=-1.2, look=0.004, rel=0.08):
    """4x-oversampled peak detection, look-ahead gain with a smooth release"""
    up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    ceil = dbg(ceil_db)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    L = ns(look)
    g = np.minimum.accumulate(np.lib.stride_tricks.sliding_window_view(np.pad(g, (0, L), constant_values=1), L + 1).min(axis=1)[None, :], axis=0)[0]
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[None, :]


def main():
    v, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    v = st(v)
    if sr != SR:
        v = signal.resample_poly(v, SR, sr, axis=1)
    voice = np.zeros((2, N)); voice[:, :min(N, v.shape[1])] = v[:, :N]
    mus = music()
    fx = sfxs()
    vl = integrated(voice)
    # balance: music bed -10 LU under the voice (this is the "+3 dB music" house standard over a -13 bed), ducked 3 dB under words
    ml = integrated(mus)
    mus *= dbg(vl - 10.0 - ml)
    duck = 1 - (1 - dbg(-3.0)) * speech_mask()
    mus *= duck[None, :]
    # SFX: house standard -6 dB from a -9 LU bed -> -15 LU under the voice (impacts still poke through)
    fl = integrated(fx)
    fx *= dbg(vl - 15.0 - fl)
    mix = voice + mus + fx
    g = dbg(-14.0 - integrated(mix))
    mix = limiter(mix * g, -1.2)
    g2 = dbg(-14.0 - integrated(mix))  # the limiter shaved a little: one more pass to land on -14
    mix = limiter(mix * g2, -1.2)
    g *= g2
    voice, mus, fx = voice * g, mus * g, fx * g
    write_wav(os.path.join(HERE, "mix.wav"), mix)
    for name, x in [("voice", voice), ("music", mus), ("sfx", fx)]:
        write_wav(os.path.join(HERE, f"stem_{name}.wav"), x)
    rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
    print(rep)
    with open(os.path.join(HERE, "cues.md"), "w") as fh:
        fh.write("# Sound cues — What Goes Up\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
        for t, w in sorted(CUES):
            fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")


if __name__ == "__main__":
    main()
