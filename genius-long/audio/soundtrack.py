# Soundtrack for the long video "4 Geniuses Who Lost a Fortune": an original score that changes with the chapters
# (tense pulse for the hook, harpsichord for Newton's London, guitar for Twain, vibes and walking bass for Fisher's
# 1929, plucked synth arpeggios for Long-Term Capital, pads and a music box for the pattern, warm guitar and glockenspiel
# for Ronald Read), stings on the chapter and "mistake" cards, and synthesized SFX on the word cues of the picture.
# Mix: music -12 LU under the voice, ducked 3 dB under words; SFX -16 LU; master -14 LUFS, true peak <= -1 dBTP, 48 kHz.
# usage: python soundtrack.py   (writes mix.wav and cues.md next to this file)
import os, json
import numpy as np
from scipy import signal
from dsp import (SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, smooth_noise, fades, modal, pan, st, place, widen,
                 make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, dbg, phase)
import instruments as I
import sfx_gen as S

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FPS = 30
TIMING = json.load(open(os.path.join(ROOT, "..", "finance-short", "src", "videos", "genius", "timing.json")))
BEATS = {b["id"]: b for b in TIMING["beats"]}
ORDER = [b["id"] for b in TIMING["beats"]]
END_HOLD = 240
TOTAL = TIMING["total"] + END_HOLD
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
WORDS = [{"start": w["s"], "end": w["e"]} for w in json.load(open(os.path.join(ROOT, "voice", "words.json")))]
CUES = []
T0 = lambda bid: BEATS[bid]["f0"] / FPS          # beat start (s)
T1 = lambda bid: BEATS[bid]["f1"] / FPS          # next beat start (s)


def W(bid, word, nth=0):
    """time (s) of a word in a beat; the beat start if it is not there"""
    k = 0
    for w, f in BEATS[bid]["words"]:
        if w == word.lower():
            if k == nth:
                return f / FPS
            k += 1
    return T0(bid)


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
      "Gm": ["G", "A#", "D"], "A7": ["A", "C#", "G"], "Em": ["E", "G", "B"], "C": ["C", "E", "G"], "Am": ["A", "C", "E"],
      "F": ["F", "A", "C"], "Bb": ["A#", "D", "F"], "Cm": ["C", "D#", "G"], "Fm": ["F", "G#", "C"], "Ab": ["G#", "C", "D#"], "Eb": ["D#", "G", "A#"]}
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




# =============================================================== the score
MISTAKES = ["n12", "t13", "f13", "l15"]
TITLES = {"n0": "D2", "t0": "G2", "f0": "C2", "l0": "A1", "p0": "D2", "r0": "F2"}


def loop(fn, t0, t1, bar):
    """call fn(t, k) at every bar start in [t0, t1)"""
    t, k = t0, 0
    while t < t1 - 0.05:
        fn(t, k); t += bar; k += 1


def synth(midi, t, vel=0.4, p=0.2):
    put(I.pluck(F(midi), vel, R, 0.5, bright=0.85, pos=0.1), t, 0.9, p)


def music():
    # ---- hook: low pulse in D minor, a pad, one sting when the board turns ----
    t_end = T0("n0")
    pulse(0.4, t_end - 0.4, ["D2", "D2", "A#1", "C2"], 0.5, step=0.3)
    for k, (a, c) in enumerate(zip(np.arange(0.4, t_end - 4, 4.8), ["Dm", "Bb", "Gm", "A", "Dm", "Bb", "Gm", "A"])):
        padc(c, a, a + 5.2, 0.32, att=0.8, rel=0.8)
    sting(W("h1", "lose"), 1.0, "D2")
    for i, w in enumerate(["writer", "economist", "nobel"]):
        vib(m("D4") + [0, 3, 7][i], W("h2", w), 0.5)
    sting(W("h2", "same"), 0.6, "A1")
    for i in range(6):
        glk(m("D5") + [0, 3, 7, 12, 15, 19][i], W("h3", "eight") + i * 0.09, 0.45)
    # ---- chapter cards: a timpani and cymbal sting, three rising bells ----
    for bid, root in TITLES.items():
        t = T0(bid) + 0.08
        sting(t, 0.5, root)
        for i in range(3):
            glk(m(root) + 36 + [0, 7, 12][i], t + 0.25 + i * 0.16, 0.38)
    # ---- "mistake" cards: a low hit on "number", a bell on the name ----
    for bid in MISTAKES:
        sting(W(bid, "number") - 0.05, 0.7, "D2")
        tb = BEATS[bid]["fe"] / FPS - 34 / FPS
        tuba(m("D2"), tb, 0.9, 0.6)
        for i in range(3):
            glk(m("D5") + [0, 5, 12][i], tb + i * 0.07, 0.55)
    # ---- 1 · Newton: harpsichord and pizzicato; after the crash a bare pad and slow low notes ----
    a, crash, b = T1("n0"), W("n9", "september"), T0("n12")
    prog = ["Dm", "Gm", "C", "F", "Bb", "Gm", "A", "Dm"]
    t = a
    while t < crash - 4.2:
        t = broken(t, prog, vel=0.36)
    sting(crash + 0.6, 0.9, "D2")
    loop(lambda tt_, k: (padc(["Dm", "Gm", "Bb", "A"][k % 4], tt_, tt_ + 4.6, 0.34), harpsi(m("D3") + [0, 5, -4, -1][k % 4], tt_ + 0.1, 0.5, 1.2), harpsi(m("A3") + [0, 1, 0, -1][k % 4], tt_ + 2.1, 0.4, 1.2)), crash + 1.4, b - 0.5, 4.2)
    # ---- 2 · Twain: fingerpicked guitar in G; after the failure, slower and in the minor ----
    a, fail, b = T1("t0"), T0("t9"), T0("t13")
    arp(a, fail - 0.4, ["G", "Em", "C", "D"], vel=0.36, step=0.27)
    loop(lambda tt_, k: pizz(m(["G2", "E2", "C2", "D2"][k % 4]), tt_, 0.6), a, fail - 0.4, 0.27 * 8)
    loop(lambda tt_, k: (padc(["Em", "C", "G", "D"][k % 4], tt_, tt_ + 4.4, 0.3), [guitar(x, tt_ + 0.2 + i * 0.5, 0.42, 0.1) for i, x in enumerate(chord_midis(["Em", "C", "G", "D"][k % 4], 3))]), fail, b - 0.5, 4.0)
    # ---- 3 · Fisher: walking bass and vibraphone stabs (1929); after the crash, a dark pad and a slow pulse ----
    a, crash, b = T1("f0"), T0("f8"), T0("f13")
    prog = ["Cm", "Fm", "G", "Cm", "Ab", "Fm", "G", "G"]

    def bar_f(tt_, k):
        ms = chord_midis(prog[k % 8], 2)
        for i, x in enumerate([ms[0], ms[1], ms[2], ms[1] + (2 if k % 2 else 0)]):
            pizz(x, tt_ + i * 0.52, 0.62 if i else 0.75)
        up = chord_midis(prog[k % 8], 4)
        for bt in (1, 3):
            for x in up:
                vib(x, tt_ + bt * 0.52 + 0.02, 0.3)
    loop(bar_f, a, crash - 0.6, 0.52 * 4)
    sting(W("f8", "crashes"), 1.0, "C2")
    loop(lambda tt_, k: padc(["Cm", "Ab", "Fm", "G"][k % 4], tt_, tt_ + 5.0, 0.34, att=0.9), T1("f8"), b - 0.5, 4.6)
    pulse(T1("f8") + 0.3, b - 0.6, ["C2", "G#1", "F1", "G1"], 0.4, step=0.575)
    sting(W("f10", "eightynine"), 0.6, "C2")
    # ---- 4 · Long-Term Capital: plucked synth arpeggios over a pulse; after Russia, a tense D-minor pulse ----
    a, rus, b = T1("l0"), T0("l10"), T0("l15")
    prog = ["Am", "F", "C", "G"]

    def bar_l(tt_, k):
        ms = chord_midis(prog[k % 4], 4)
        for i in range(8):
            synth([ms[0], ms[1], ms[2], ms[1] + 12, ms[2], ms[1], ms[0] + 12, ms[1]][i], tt_ + i * 0.2, 0.34 if i % 2 else 0.42, 0.25 if i % 2 else -0.15)
        low(chord_midis(prog[k % 4], 1)[0] + 12, tt_, 0.6, 0.5)
        low(chord_midis(prog[k % 4], 1)[0] + 12, tt_ + 0.8, 0.45, 0.5)
    loop(bar_l, a, rus - 0.4, 1.6)
    sting(W("l10", "defaults"), 0.8, "D2")
    pulse(rus + 0.2, b - 0.5, ["D2", "D2", "A#1", "A1"], 0.5, step=0.26)
    loop(lambda tt_, k: padc(["Dm", "Bb", "Gm", "A"][k % 4], tt_, tt_ + 4.6, 0.33, att=0.8), rus, b - 0.5, 4.16)
    sting(W("l11", "loses"), 0.9, "D2")
    sting(W("l8", "wipes"), 0.6, "A1")
    # ---- the pattern: pads and a music box ----
    a, b = T1("p0"), T0("r0")
    prog = ["Dm", "Bb", "F", "C"]
    loop(lambda tt_, k: (padc(prog[k % 4], tt_, tt_ + 4.5, 0.38, att=0.7), [mbox(x + 12, tt_ + 0.3 + i * 0.95, 0.45) for i, x in enumerate(chord_midis(prog[k % 4], 4) + [chord_midis(prog[k % 4], 4)[1]])]), a, b - 0.5, 4.0)
    # ---- the janitor: warm guitar in F, glockenspiel answers, a last chord under the end card ----
    a, b = T1("r0"), DUR - 3.4
    arp(a, b, ["F", "Bb", "C", "F", "Dm", "Bb", "C", "F"], vel=0.38, step=0.3)
    loop(lambda tt_, k: pizz(m(["F2", "A#1", "C2", "F2", "D2", "A#1", "C2", "F2"][k % 8]), tt_, 0.6), a, b, 0.3 * 8)
    loop(lambda tt_, k: [glk(x + 12, tt_ + 1.2 + i * 0.3, 0.36) for i, x in enumerate(chord_midis(["F", "Bb", "C", "F", "Dm", "Bb", "C", "F"][k % 8], 4)[:2])], T0("r8"), b, 0.3 * 8)
    padc("F", T0("r8"), T1("r9"), 0.36, att=1.5, rel=1.5)
    for i, x in enumerate([m("F2"), m("C3"), m("F3"), m("A3"), m("C4"), m("F4")]):
        guitar(x, DUR - 3.2 + i * 0.05, 0.6, 0.0, 2.6)
    for i, x in enumerate([m("F5"), m("A5"), m("C6")]):
        glk(x, DUR - 3.1 + i * 0.12, 0.5)
    put(I.cymbal(0.25, R, 2.4), DUR - 3.2, 0.3)
    return MUS


# =============================================================== the effects
def ring(r):
    """an old telephone bell"""
    t = tt(0.9)
    return (np.sin(TAU * 1480 * t) + np.sin(TAU * 1830 * t)) * (0.5 + 0.5 * np.sign(np.sin(TAU * 22 * t))) * np.exp(-t / 0.5) * 0.25


def boom(r):
    t = tt(1.4)
    return np.sin(TAU * 52 * t * (1 + 0.6 * np.exp(-t / 0.05))) * np.exp(-t / 0.35) * 0.9 + lp(r.standard_normal(len(t)), 500) * np.exp(-t / 0.2) * 0.5


def sfxs():
    K = {"pop": lambda: (pop(Q), 0.5), "jingle": lambda: (jingle(Q), 0.55), "stamp": lambda: (stamp(Q), 0.8), "thud": lambda: (thud(Q), 0.7), "blip": lambda: (blip(Q), 0.4),
         "bonk": lambda: (bonk(Q), 0.5), "clang": lambda: (clang(Q), 0.5), "twinkle": lambda: (twinkle(Q), 0.5), "rustle": lambda: (rustle(Q, 0.5), 0.6), "swish": lambda: (swish(Q), 0.45),
         "boom": lambda: (boom(Q), 0.9), "gasp": lambda: (gasp(Q), 0.5), "cheer": lambda: (cheer(1.6, Q), 0.4), "ring": lambda: (ring(Q), 0.5), "up": lambda: (boing(Q, 320, True), 0.35),
         "down": lambda: (boing(Q, 320, False), 0.35), "nope": lambda: (nope(Q), 0.5)}
    L = """
    h1 lose boom|h1 lose gasp|h2 writer pop|h2 economist pop|h2 nobel pop|h2 same stamp|h3 avoided twinkle|h3 eight jingle
    n1 gravity pop|n1 calculus pop|n1 mint blip|n1 makes jingle|n2 south pop|n2 company pop|n2b exchange stamp|n2b lords pop|n2b servants pop|n3 nothing bonk|n3 debt pop|n3 flying up
    n4 january pop|n4 march pop|n5 april pop|n5 twenty jingle|n5 smart stamp|n6 may pop|n6 june pop|n7 friends pop|n7 week jingle|n8 buys jingle|n8 buys cheer|n9 august pop|n9 september boom
    n9b parliament stamp|n9b tower thud|n9b mint jingle|n10 third down|n10 wrote rustle|n11 math pop|n11 right pop|n11 couldn't bonk
    t1 tom pop|t1 huckleberry pop|t1 money jingle|t2 writing pop|t2 inventions pop|t3 offered pop|t3 no stamp|t3 telephone ring|t4 paige pop|t4 machine clang|t4 automatically pop|t4 faster up
    t5 hand pop|t5 every twinkle|t5b grant pop|t5b bestseller stamp|t5b bestseller jingle|t6 invests swish|t6 fourteen blip|t7 eighteen blip|t7 breaking clang|t7 apart clang|t7 almost stamp
    t8 linotype pop|t8 already rustle|t9 three jingle|t9 ten pop|t9 failure stamp|t10 bankruptcy stamp|t11 tour swish|t11 world pop|t11 paid stamp|t11b hartford pop|t11b museum pop|t12 love pop|t12 feeding swish
    f1 experts bonk|f1 this twinkle|f3 invented pop|f3 sold jingle|f3 stocks rustle|f4 ten jingle|f5 borrowed thud|f5 leverage stamp|f5 ten pop|f6 ten pop|f6 ninety thud|f6 rises up|f6 doubled twinkle|f6 falls down|f6 lost nope
    f7 october rustle|f7 permanently pop|f8 crashes boom|f8 crashes gasp|f8b two stamp|f8b quarter boom|f9 recovery pop|f9 corner pop|f9 holds pop|f10 eightynine boom|f11 gone down|f11 debt stamp|f11 sisterinlaw pop|f11 yale pop
    f11b debt pop|f11b today pop|f12 terrible nope|f12 borrowed thud|f12 sure stamp
    l1 computers blip|l1 math blip|l1 figured pop|l3 scholes pop|l3 merton pop|l3 nobel twinkle|l4 gap pop|l4 close up|l4 pennies blip|l5 borrow thud|l5 lot stamp|l6 twentyone pop|l6 fortythree pop|l6 fortyone pop
    l7 five pop|l7 hundred up|l8 four clang|l8 wipes boom|l9 impossible stamp|l10 russia pop|l10 defaults stamp|l10 wider down|l11 loses boom|l12 fourteen jingle|l12 three pop|l13 one pop|l13 wiped down
    l13b closed stamp|l13b second pop|l13b hit bonk|l13b closes stamp|l14 book pop|l14 forgot clang
    p1 physicist pop|p1 writer pop|p1 economist pop|p1 phds pop|p1 centuries twinkle|p2 stupid nope|p2 smart thud|p3 newton pop|p3 twain pop|p3 fisher pop|p3 longterm pop
    p4 crowd pop|p4 basket pop|p4 leverage pop|p4 overconfidence pop|p4b crowd blip|p4b basket blip|p4b leverage blip|p4b overconfidence blip|p5 meet swish|p5 millionaire twinkle
    r1 then pop|r2 car pop|r2 pin pop|r2 stranger pop|r3 eight jingle|r3 finds gasp|r4 formulas nope|r4 borrowed nope|r4 tips nope|r4 soap pop|r4 medicine pop|r4 electricity pop|r4 ninetyfive up
    r5 reinvested jingle|r5 fifty twinkle|r5b opened rustle|r5b five pop|r6 ignored blip|r6 ninetyfive blip|r6 none blip|r6 never blip|r7 hospital pop|r7 library pop|r7 largest twinkle|r10 subscribe pop
    """
    for item in L.replace("\n", "|").split("|"):
        p_ = item.split()
        if len(p_) != 3:
            continue
        bid, word, kind = p_
        x, g = K[kind]()
        sfx(x, W(bid, word) - 0.03, g, Q.uniform(-0.3, 0.3), f"{kind} ({bid} '{word}')")
    # a soft page-turn swish on every 2D scene change (not on the cards, which have their own sting)
    for bid in ORDER:
        b = BEATS[bid]
        if b["mode"] == "2d" and not b["title"] and bid not in MISTAKES and bid != "h2":
            sfx(swish(Q, 0.35), T0(bid) - 0.08, 0.22, Q.uniform(-0.4, 0.4))
    # room tone for the 3D shots: crowd murmur in front of the exchange, birds and a breeze on the quay
    for bid, kind in [("h1", "crowd"), ("n1", "crowd"), ("n8", "crowd"), ("f2", "crowd"), ("f8", "crowd"), ("l12", "crowd"), ("t1", "birds"), ("t10", "birds"), ("r1", "birds"), ("r8", "birds"), ("r9", "birds")]:
        a, d = T0(bid), T1(bid) - T0(bid)
        x = crowd_bed(d, Q, 10) * 0.5 if kind == "crowd" else st(S.bird_chirps(d, Q, 0.5)) * 0.5 + st(S.breeze(d, Q, 0.6)) * 0.5
        x = st(x) if np.ndim(x) == 1 else x
        e = np.minimum(1, np.minimum(np.arange(x.shape[1]) / ns(0.3), (x.shape[1] - np.arange(x.shape[1])) / ns(0.3)))
        place(SF, x * e[None, :], a, 0.5)
    return SF


# =============================================================== mix
def speech_mask():
    k = np.zeros(N)
    for w in WORDS:
        a, b = ns(w["start"] - 0.05), ns(w["end"] + 0.12)
        k[max(0, a):min(N, b)] = 1.0
    win = ns(0.12)
    k = signal.fftconvolve(k, np.hanning(win) / np.hanning(win).sum(), mode="same")
    return np.clip(k, 0, 1)


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
    # smooth release: one-pole on the gain, instant attack (vectorised per gain-reduction event is not needed: the
    # gain is 1 almost everywhere, so only walk the samples near reductions)
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


def main():
    v, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    v = st(v)
    if sr != SR:
        v = signal.resample_poly(v, SR, sr, axis=1)
    voice = np.zeros((2, N)); voice[:, :min(N, v.shape[1])] = v[:, :N]
    mus = music()
    fx = sfxs()
    vl = integrated(voice)
    mus *= dbg(vl - 12.0 - integrated(mus))
    mus *= (1 - (1 - dbg(-3.0)) * speech_mask())[None, :]
    fx *= dbg(vl - 16.0 - integrated(fx))
    # the end card (no voice): let the music come up
    e0 = ns(TIMING["total"] / FPS - 0.5)
    mus[:, e0:] *= np.minimum(dbg(5.0), 1 + (dbg(5.0) - 1) * np.arange(N - e0) / ns(1.0))[None, :]
    if os.environ.get("STEMS"):   # music + effects at their mix level (pre-master), for re-cuts such as Shorts
        write_wav(os.path.join(HERE, "bed.wav"), mus + fx)
    mix = voice + mus + fx
    mix = limiter(mix * dbg(-14.0 - integrated(mix)), -1.2)
    mix = limiter(mix * dbg(-14.0 - integrated(mix)), -1.2)
    write_wav(os.path.join(HERE, "mix.wav"), mix)
    rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
    print(rep)
    print("levels  voice %.1f  music %.1f  sfx %.1f LUFS (pre-master)" % (vl, integrated(mus), integrated(fx)))
    with open(os.path.join(HERE, "cues.md"), "w") as fh:
        fh.write("# Sound cues: 4 Geniuses Who Lost a Fortune\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
        for t, w in sorted(CUES):
            fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")


if __name__ == "__main__":
    main()
