# Soundtrack for "The $4.5 Trillion Scandal" (Jensen Huang and Nvidia): an original tense news-style score (low
# plucked pulse in D minor, pads, timpani and cymbal stings on the scandal beats, a lighter plucked section for the
# 1993 diner and the AI rise, a resolving F-major glockenspiel ending) with synthesized SFX on the picture's frames;
# the voice unchanged.
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
FPS, TOTAL = 30, 1612
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


R = rng(2026)
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


def low(midi, t, vel=0.6, dur=0.5, p=0.0):
    """muted low pluck: the pulse"""
    put(lp(I.pluck(F(midi), vel, R, dur, bright=0.25, pos=0.25), 1800), t, 1.0, p)


def vib(midi, t, vel=0.45, p=0.25):
    put(I.vibes(F(midi), vel, R, 1.4), t, 0.6, p)


def pulse(t0, t1, roots, vel=0.5, step=0.25, accent=4):
    """eighth-note pulse on the chord roots (120 bpm sixteenth feel at step 0.25 s); root changes every 8 steps"""
    t, k = t0, 0
    while t < t1 - 0.02:
        r0 = roots[(k // 8) % len(roots)]
        low(m(r0), t, vel * (1.0 if k % accent == 0 else 0.7), 0.35, -0.1 if k % 2 else 0.1)
        t += step; k += 1


def arp(t0, t1, chords, oct=4, vel=0.4, step=0.25, p=0.2):
    t, k = t0, 0
    while t < t1 - 0.02:
        c = chords[(k // 8) % len(chords)]
        ms = chord_midis(c, oct)
        guitar([ms[0], ms[1], ms[2], ms[1] + 12 if False else ms[1]][k % 4] + (12 if k % 8 >= 4 else 0), t, vel * (1.0 if k % 2 == 0 else 0.75), p, 0.9)
        t += step; k += 1


def padc(names, t0, t1, vel=0.4, att=0.6, rel=0.5, oct=3):
    put(I.pad([F(x) for x in chord_midis(names, oct)], t1 - t0, vel, R, att=att, rel=rel), t0, 0.7)


def sting(t, big=1.0, root="D2"):
    put(I.timpani(F(m(root)), 0.9 * big, R, 2.4), t, 0.9)
    put(I.cymbal(0.45 * big, R, 2.2), t, 0.35 * big)


def music():
    Dm = ["Dm", "Dm", "Bb", "A"]
    CH.update({"Bb": ["A#", "D", "F"], "F": ["F", "A", "C"], "Gm": ["G", "A#", "D"], "Am": ["A", "C", "E"]})
    # ---- hook: low pulse + dark pad, a sting on "confessed", a stop on "secret", the hit on "lost"
    padc("Dm", 0.0, fr(116), 0.35, att=0.4)
    pulse(0.1, fr(112), ["D2", "D2", "A#1", "A1"], 0.5)
    sting(fr(95), 0.8); cue(fr(95), "music: sting on 'confessed'")
    padc("Dm", fr(137), fr(252), 0.4)
    pulse(fr(137), fr(165), ["D2"], 0.45)
    sting(fr(167), 0.8, "D2"); cue(fr(167), "music: hit on 'lost'")
    put(I.brass(F(m("D2")), 1.6, 0.7, R, "tuba", fall=-7.0), fr(168), 0.4)
    for j, mi in enumerate(["D6", "A5", "F5", "D5", "A4"]):
        vib(m(mi), fr(170) + j * 0.11, 0.28)
    pulse(fr(196), fr(250), ["D2", "A#1"], 0.42)
    # ---- 1993, the diner: warm plucked F major, glock on the $40,000
    arp(fr(256), fr(414), ["F", "C", "Dm", "Bb"], 4, 0.36)
    padc("F", fr(256), fr(414), 0.3, att=0.8)
    for j, mi in enumerate(["C6", "F6", "A6", "C7"]):
        glk(m(mi), fr(368) + j * 0.06, 0.45)
    cue(fr(368), "music: sparkle on 'forty thousand'")
    # ---- the rise: brighter picking in C, lift on "AI"
    arp(fr(418), fr(500), ["C", "G", "Am", "F"], 4, 0.4)
    put(I.cymbal(0.35, R, 1.6, 0.8), fr(503) - 0.6, 0.25)
    for j, mi in enumerate(["C5", "E5", "G5", "C6", "E6", "G6"]):
        glk(m(mi), fr(503) + j * 0.05, 0.5)
    arp(fr(503), fr(548), ["C", "F"], 5, 0.42, 0.2)
    padc("C", fr(503), fr(552), 0.4, att=0.2)
    cue(fr(503), "music: lift on 'AI'")
    # ---- the email: everything drops to a low drone; one low note under the quote
    padc("Dm", fr(552), fr(684), 0.38, att=1.0, oct=2)
    low(m("D2"), fr(628), 0.8, 1.6); put(I.timpani(F(m("D2")), 0.45, R, 2.0), fr(628), 0.6)
    cue(fr(628), "music: low note under the quote")
    # ---- the reports: ticking pulse, vibes; stings on "spying" and "groundless"
    pulse(fr(686), fr(866), ["D2", "D2", "C2", "A#1"], 0.42)
    for k, tf in enumerate(range(700, 860, 40)):
        vib(m(["A4", "F4", "E4", "D4"][k % 4]), fr(tf), 0.35)
    sting(fr(779), 0.7, "A1"); vib(m("G#5"), fr(779), 0.5); vib(m("D6"), fr(779) + 0.02, 0.4)
    put(I.timpani(F(m("D2")), 0.7, R, 1.6), fr(841), 0.7)
    # ---- the board: slow pulse under a cold pad, a soft resolve on the padlock
    padc("Gm", fr(866), fr(1008), 0.34, att=0.8)
    pulse(fr(868), fr(1004), ["G1", "G1", "D2", "D2"], 0.38, 0.5, 2)
    for j, mi in enumerate(["D5", "G5"]):
        glk(m(mi), fr(976) + j * 0.08, 0.35)
    # ---- the stock falls
    padc("Dm", fr(1008), fr(1088), 0.4)
    pulse(fr(1008), fr(1030), ["D2"], 0.45)
    sting(fr(1031), 0.6); put(I.brass(F(m("A2")), 1.2, 0.6, R, "tuba", fall=-9.0), fr(1031), 0.35)
    for j, mi in enumerate(["A5", "F5", "D5", "A4", "F4", "D4"]):
        vib(m(mi), fr(1033) + j * 0.1, 0.26)
    # ---- your problem: picking in A minor, a stop before "And one man"
    arp(fr(1092), fr(1364), ["Am", "F", "C", "G"], 4, 0.36)
    pulse(fr(1092), fr(1364), ["A1", "F1", "C2", "G1"], 0.36, 0.5, 2)
    padc("Am", fr(1092), fr(1364), 0.3, att=0.6)
    low(m("D2"), fr(1378), 0.7, 1.4); put(I.timpani(F(m("D2")), 0.45, R, 2.0), fr(1378), 0.5)
    cue(fr(1378), "music: low hit on 'one man'")
    # ---- key person risk: the warning sting
    padc("Dm", fr(1404), fr(1466), 0.36)
    sting(fr(1430), 0.8, "A1"); put(I.brass(F(m("A3")), 0.7, 0.6, R, "stab"), fr(1430), 0.45)
    # ---- spread it out: resolving F major, glock melody, a final chord
    padc("F", fr(1466), fr(TOTAL), 0.42, att=0.8, rel=0.4)
    arp(fr(1468), fr(1585), ["F", "C", "Bb", "F"], 4, 0.38)
    for j, mi in enumerate(["A5", "C6", "F6", "A6", "C7", "F7"]):
        glk(m(mi), fr(1473) + j * fr(5), 0.4)
    for mi in ["F2", "C3", "F3", "A3", "C4", "F4"]:
        guitar(m(mi), fr(1585), 0.5, 0.0, 1.0)
    cue(fr(1585), "music: final F chord")
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


def stamp(r):
    return addm(thud(r, 70, 0.35, 1.4), S.clink(r, 900, 0.12, 0.6) * 0.3)


def sfxs():
    r = Q
    for a, b, kind in [(0, 252, "quay"), (252, 416, "garden"), (416, 684, "quay"), (684, 866, "garden"), (866, 1088, "quay"), (1088, TOTAL, "park")]:
        ambience(a, b, kind, r)
    # crowds: murmur at the exchange and the quote board, the gasp on "lost", money flying away
    sfx(crowd_bed(fr(95), r, voices=8) * 0.28, 0.0, 0.8, 0.0, "investors murmur")
    sfx(crowd_bed(fr(252) - fr(137), r, voices=8) * 0.25, fr(137), 0.8, 0.0, "crowd at the quote board")
    sfx(gasp(r, 8), fr(234), 0.45, 0.0, "the crowd gasps")
    sfx(S.whoosh(0.5, r, 0.4), fr(167) - 0.35, 0.6, 0.0, "whoosh into the flash")
    for k in range(8):
        sfx(rustle(r, 0.3, 0.7), fr(168) + k * 0.1, 0.22, r.uniform(-0.6, 0.6))
    # the diner: cups, the cash
    sfx(S.clink(r, 2600, 0.3, 0.8), fr(262), 0.4, 0.2, "cup")
    sfx(S.clink(r, 2300, 0.25, 0.7), fr(318), 0.3, -0.2)
    sfx(blip(r, 800), fr(368), 0.5, 0.0, "cash pops")
    sfx(rustle(r, 0.4, 1.0), fr(370), 0.5, 0.0)
    # the rise: a game blip, the chip lands, coins
    sfx(blip(r, 1200), fr(448), 0.5, -0.2, "gamepad")
    sfx(blip(r, 1500), fr(452), 0.4, -0.2)
    sfx(S.whoosh(0.5, r, 0.35), fr(503) - 0.3, 0.5, 0.1, "chip lands")
    sfx(thud(r, 120, 0.3), fr(503), 0.5, 0.1)
    for k in range(10):
        sfx(S.clink(r, r.uniform(2800, 4600), 0.18, 1.0), fr(506) + k * 0.13 + r.uniform(0, 0.04), 0.3, r.uniform(-0.5, 0.5))
    # the email: a send whoosh and a notification ping
    sfx(S.whoosh(0.4, r, 0.3, 600, 3200), fr(586), 0.45, 0.0, "email swoosh")
    sfx(I.triangle(0.35, r, 0.6, 1568), fr(592), 0.35, 0.0, "notification")
    # the papers: rustles, the question, the stamp
    for k in range(5):
        sfx(rustle(r, 0.35, 0.8), fr(690) + k * 0.5, 0.4, r.uniform(-0.5, 0.5), "newspapers" if k == 0 else None)
    sfx(blip(r, 600), fr(779), 0.5, 0.0, "question pops")
    sfx(stamp(r), fr(841), 0.7, 0.2, "DENIED stamp")
    # the board: footsteps settling, the padlock click
    for k in range(4):
        sfx(S.stroll_step(r, 0.3), fr(870) + k * 0.28, 0.25, 0.3 - 0.2 * k)
    sfx(addm(S.clink(r, 1800, 0.08, 0.9), thud(r, 200, 0.12, 0.5) * 0.5), fr(976), 0.6, 0.0, "padlock click")
    # the fall: groans
    for k in range(4):
        sfx(S.oof(r, "oh"), fr(1074) + k * 0.06, 0.2, r.uniform(-0.6, 0.6), "crowd groans" if k == 0 else None)
    # your problem: pops for the pie, the basket, the coin, the bill, the chip
    for tf, f0, what in [(1160, 700, "pie"), (1252, 850, "basket"), (1293, 1000, "coin"), (1321, 900, "bill"), (1349, 1150, "chip")]:
        sfx(blip(r, f0), fr(tf), 0.5, 0.0, what + " pops")
    sfx(S.clink(r, 3400, 0.3, 1.0), fr(1295), 0.35, -0.2)
    sfx(rustle(r, 0.3, 0.8), fr(1323), 0.35, 0.2)
    # the warning: two beeps
    for k in range(2):
        sfx(blip(r, 1400), fr(1430) + k * 0.2, 0.45, 0.0, "warning beeps" if k == 0 else None)
    # spread it out: six rising pops, the river
    for k in range(6):
        sfx(blip(r, 700 + 120 * k), fr(1473 + 5 * k), 0.4, -0.5 + 0.2 * k, "icons pop" if k == 0 else None)
    sfx(S.water_bed(fr(TOTAL) - fr(1088), r, 0.4), fr(1088), 0.22, 0.0, "river")
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
        fh.write("# Sound cues — The $4.5 Trillion Scandal\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
        for t, w in sorted(CUES):
            fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")


if __name__ == "__main__":
    main()
