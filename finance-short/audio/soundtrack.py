# Soundtrack for "What Goes Up" (Newton and the South Sea Bubble): an original light baroque score (harpsichord-like
# plucks, pizzicato bass, glockenspiel, music box, tuba gags, timpani, pad) that climbs in key with the bubble, stops
# dead on the pop and comes back as a music box; synthesized SFX on the picture's frames; the voice unchanged.
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
FPS, TOTAL = 30, 1935
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
      "Gm": ["G", "A#", "D"], "A7": ["A", "C#", "G"], "Em": ["E", "G", "B"]}
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


def music():
    # ---- hook (0 - 6.27): the theme, light; apple lands (103); "lost" (130) -> the tuba falls
    theme(0.0, lambda mi, t, v: harpsi(mi, t, v, 0.5, 0.1), vel=0.5, upto=fr(128))
    broken(0.0, ["D", "A", "D"], vel=0.32, bass=True)
    glk(m("A6"), fr(103), 0.5); cue(fr(103), "music: glock ding on the apple")
    for k, (mi, d) in enumerate([("A2", 0.2), ("G#2", 0.2), ("G2", 0.2), ("F#2", 0.5)]):
        tuba(m(mi), fr(131) + k * 0.21, d, 0.5, fall=-0.6 if k == 3 else 0.0)
    cue(fr(131), "music: tuba wah-wah-wah-waaah on 'lost a fortune'")
    put(I.cymbal(0.45, R, 2.0), fr(186), 0.5)
    # ---- London (6.27 - 12.7): theme with bass, timpani into "Royal Mint", coin ding
    t0 = fr(190)
    broken(t0, ["D", "G", "A", "D", "Bm", "G", "A7", "D"][:6], vel=0.4)
    theme(t0, lambda mi, t, v: harpsi(mi + 12, t, v, 0.5, -0.1), vel=0.42)
    for k in range(6):
        put(I.timpani(F(m("A2")) if k < 5 else F(m("D2")), 0.25 + 0.1 * k, R, 1.0), fr(280) + k * 0.12, 0.6)
    glk(m("D7"), fr(331), 0.55); glk(m("A6"), fr(350), 0.4)
    # ---- frenzy (12.7 - 24.8): bouncy, the key climbs with the bubble: D -> E (tripled, 510) -> F# (climbing, 667)
    t = fr(381)
    t = broken(t, ["D", "A", "Bm", "G", "D", "A"], vel=0.42)
    theme(fr(381), lambda mi, tt_, v: glk(mi + 12, tt_, v * 0.7), vel=0.5, upto=fr(505))
    put(I.cymbal(0.35, R, 1.6), fr(509), 0.45); cue(fr(509), "music: key change up a tone on 'tripled'")
    t = broken(fr(510), ["D", "A", "Bm", "G", "D"], vel=0.45, shift=2)
    theme(fr(538), lambda mi, tt_, v: harpsi(mi + 14, tt_, v, 0.45, -0.15), vel=0.45, upto=fr(660))
    t = broken(fr(667), ["D", "A", "Bm", "A"], vel=0.48, shift=4)
    theme(fr(667), lambda mi, tt_, v: glk(mi + 16, tt_, v * 0.75), vel=0.5, upto=fr(742))
    # ---- June, can't take it (24.8 - 28): repeated-note ostinato, crescendo, roll -> stab on "anymore" (817)
    for k in range(int((fr(815) - fr(744)) / (BEAT / 4))):
        tt_ = fr(744) + k * BEAT / 4
        harpsi(m("F#4") + (k // 8) % 2, tt_, 0.25 + 0.3 * k / 26, 0.18, 0.2)
    pizz(m("F#2"), fr(744), 0.8); pizz(m("F#2"), fr(774), 0.8); pizz(m("G2"), fr(800), 0.85)
    roll(fr(786), fr(815), 0.1, 0.5)
    put(I.brass(F(m("D3")), 0.35, 0.9, R, "stab"), fr(816), 0.5); put(I.brass(F(m("A3")), 0.35, 0.9, R, "stab"), fr(816), 0.4)
    put(I.cymbal(0.5, R, 1.8), fr(816), 0.4); cue(fr(816), "music: stab on 'anymore'")
    # ---- buys back in (28 - 30.8): scale runs up on every throw, bass climbing
    for k, tf in enumerate([846, 863, 881, 898]):
        for j in range(6):
            harpsi(m("D5") + [0, 2, 4, 5, 7, 9][j] + 2 * k, fr(tf) + j * 0.045, 0.45, 0.3, 0.1)
        pizz(m("D2") + 2 * k, fr(tf), 0.8)
    put(I.triangle(0.4, R, 1.2), fr(899), 0.5)
    # ---- August (30.8 - 34): shimmering rising build to the top, then nothing
    tb0, tb1 = fr(925), fr(1019)
    put(I.pad([F(m("F#3")), F(m("A#3")), F(m("C#4"))], tb1 - tb0 - 0.2, 0.55, R, att=1.2, rel=0.15), tb0, 0.8)
    k = 0
    tt_ = tb0
    while tt_ < tb1 - 0.05:
        mbox(m("F#5") + [0, 4, 7, 12, 16, 19][k % 6] + 2 * (k // 12), tt_, 0.3 + 0.25 * (tt_ - tb0) / (tb1 - tb0), 0.15)
        tt_ += 0.125; k += 1
    roll(fr(990), tb1, 0.08, 0.55, 0.3)
    cue(tb1, "music: hard stop on the pop")
    # ---- luckily / unluckily (35.7 - 39.5)
    for j, mi in enumerate(["D6", "F#6", "A6"]):
        glk(m(mi), fr(1071) + j * 0.09, 0.45)
    for k, (mi, d) in enumerate([("D3", 0.17), ("C#3", 0.17), ("C3", 0.17), ("B2", 0.45)]):
        tuba(m(mi), fr(1118) + k * 0.19, d, 0.55, fall=-0.7 if k == 3 else 0.0)
    cue(fr(1120), "music: sad tuba on 'Unluckily'")
    # ---- the ball (39.5 - 47.1): light pizzicato; each push = a rising glock note; the hang, then a slide down
    broken(fr(1186), ["G", "D", "G", "D", "Em", "A", "D"], oct=4, vel=0.3, beats_per=2)
    for k, tf in enumerate([1217, 1266, 1290, 1318, 1334, 1348, 1362]):
        glk(m("D6") + [0, 2, 4, 5, 7, 9, 12][k], fr(tf), 0.45 + 0.03 * k)
    put(I.pad([F(m("A4")), F(m("D5"))], fr(1399) - fr(1374), 0.3, R, att=0.3, rel=0.1), fr(1374), 0.6)
    n = ns(fr(1413) - fr(1399)); tl = np.arange(n) / SR
    fslide = 1500 * 2 ** (-2.2 * (tl / tl[-1]) ** 1.3)
    put(fades(np.sin(phase(fslide)) * 0.25 * (1 - np.exp(-tl / 0.01)), 0.0, 0.03), fr(1399), 1.0); cue(fr(1399), "music: slide whistle down on 'gravity'")
    # ---- the Tower (48.3 - 53.6): D minor, low brass + timpani, "dun dun dun"
    for k, (mi, tf) in enumerate([("D2", 1449), ("D2", 1462), ("F2", 1480), ("A1", 1502), ("D2", 1532)]):
        tuba(m(mi), fr(tf), 0.38, 0.7)
        put(I.timpani(F(m(mi) + 12), 0.6, R, 1.4), fr(tf), 0.55)
    broken(fr(1532), ["Dm", "Gm", "A7"], oct=3, vel=0.3, beats_per=2)
    glk(m("D7"), fr(1584), 0.4)
    # ---- sunset (53.6 - 58.9): music box theme, slow, over a warm minor pad
    put(I.pad([F(m("B2")), F(m("F#3")), F(m("D4"))], 2.6, 0.45, R, att=0.8, rel=1.0), fr(1606), 0.75)
    put(I.pad([F(m("G2")), F(m("D3")), F(m("B3"))], 2.4, 0.45, R, att=0.8, rel=1.2), fr(1606) + 2.6, 0.75)
    theme(fr(1610), lambda mi, tt_, v: mbox(mi + 12 - 3, tt_, v), vel=0.45, stretch=1.6, upto=fr(1765))
    # ---- callback (58.9 - 64.5): the theme home in D on the music box, bonk, warm final chord, a last pluck button
    theme(fr(1769), lambda mi, tt_, v: mbox(mi + 12, tt_, v), vel=0.5, stretch=1.25, upto=fr(1890))
    put(I.pad([F(m("D3")), F(m("A3")), F(m("F#4"))], fr(1935) - fr(1840), 0.5, R, att=1.5, rel=0.3), fr(1840), 0.45)
    broken(fr(1769), ["D", "G", "A", "D"], oct=4, vel=0.25, bass=True)
    for mi in ["D3", "A3", "D4", "F#4", "A4", "D5"]:
        harpsi(m(mi), fr(1908), 0.55, 1.2, 0.0)
    cue(fr(1908), "music: final D major button")
    # room
    ir = make_ir(1.1, 7, hf=0.7)
    wet = convolve_st(MUS, ir)[:, :N]
    return MUS * 0.85 + wet * 0.22


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


def sfxs():
    r = Q
    # ambiences per place
    for a, b, kind in [(0, 191, "garden"), (283, 384, "mint"), (1186, 1452, "park"), (1449, 1535, "quay"), (1532, 1612, "mint"),
                       (1606, 1772, "quay"), (1765, TOTAL, "garden")]:
        ambience(a, b, kind, r)
    # garden: leaves, the apple
    sfx(rustle(r, 0.5, 0.8), fr(80), 0.5, 0.3, "leaves")
    sfx(thud(r, 140, 0.25), fr(103), 0.8, 0.3, "apple lands on grass")
    sfx(thud(r, 170, 0.15) * 0.5, fr(108), 0.6, 0.35)
    sfx(jingle(r, 0.8, 16), fr(130), 0.8, 0.2, "coins burst out of the bag")
    sfx(S.whoosh(0.7, r, 0.45), fr(188) - 0.45, 0.7, 0.0, "whoosh into the flash")
    # mint
    sfx(S.hammer_hit(r, 0.6), fr(330), 0.5, 0.3, "press thunk")
    sfx(S.clink(r, 3400, 0.3, 1.0), fr(331), 0.8, 0.3, "coin pops")
    sfx(S.clink(r, 3900, 0.25, 1.0), fr(350), 0.7, 0.0, "coin caught")
    # street crowd bed + cheers
    bed = crowd_bed(fr(1071) - fr(378), r)
    n = bed.shape[1]; e = np.ones(n); e[:ns(0.3)] = np.linspace(0, 1, ns(0.3)); e[ns(fr(1018) - fr(378)):] = 0.0
    sfx(bed * e[None, :] * 0.8, fr(378), 1.0, 0.0, "Exchange Alley crowd murmur")
    for tf, g in [(440, 0.5), (523, 0.9), (676, 0.5), (726, 0.6), (846, 0.55), (935, 0.75)]:
        sfx(cheer(1.2, r), fr(tf), g, 0.0, "crowd cheer")
    # bubble grows
    for tf in [440, 510, 676, 716, 975]:
        n2 = ns(0.6); tl = np.arange(n2) / SR
        x = np.sin(phase(70 + 160 * (tl / 0.6))) * np.sin(np.pi * tl / 0.6) * 0.5 + bp(r.standard_normal(n2), 200, 900, 1) * np.sin(np.pi * tl / 0.6) * 0.15
        sfx(x, fr(tf) - 0.25, 0.7, 0.0, "bubble inflates")
    # Newton strolls with his bags
    for k in range(9):
        sfx(S.stroll_step(r, 0.4), fr(550) + k * 0.36, 0.45, 0.1)
    sfx(jingle(r, 2.6, 22, 2400, 5200) * 0.5, fr(560), 0.4, 0.0, "bags jingle")
    # coins rain on the friends
    sfx(jingle(r, 1.4, 26), fr(700), 0.7, 0.2, "coins rain")
    # throws: whoosh + landing jingle
    for tf in [846, 863, 881, 898]:
        sfx(S.whoosh(0.5, r, 0.2, 500, 2600), fr(tf) - 0.05, 0.6, -0.2, "bag thrown")
        sfx(thud(r, 110, 0.2), fr(tf) + 1.0, 0.6, -0.4)
        sfx(jingle(r, 0.3, 6) * 0.6, fr(tf) + 1.0, 0.6, -0.4)
    # August: the bubble strains, then POP
    n3 = ns(fr(1020) - fr(1001)); tl = np.arange(n3) / SR
    strain = np.sin(phase(300 + 900 * (tl / tl[-1]) ** 2)) * (tl / tl[-1]) ** 2 * 0.25 * (1 + 0.3 * np.sin(TAU * 23 * tl))
    sfx(strain, fr(1001), 0.6, 0.0, "bubble strains")
    sfx(pop(r), fr(1020), 1.2, 0.0, "THE POP")
    sfx(gasp(r), fr(1048), 0.8, 0.0, "crowd gasps")
    for k in range(14):
        sfx(rustle(r, 0.35, 0.6), fr(1028) + k * 0.4 + r.uniform(0, 0.2), 0.35, r.uniform(-0.6, 0.6))
    sfx(rustle(r, 0.25, 1.2), fr(1119), 0.7, 0.0, "paper lands on his head")
    # the ball
    sfx(S.whoosh(0.4, r, 0.12, 600, 2400), fr(1215), 0.5, 0.0, "ball thrown")
    sfx(S.push_thump(r) * 0.6, fr(1261), 0.5, 0.0)
    for tf in [1266, 1290, 1318, 1334, 1348, 1362]:
        sfx(boing(r, 260 + (tf - 1266) * 1.2), fr(tf), 0.6, 0.0, "push")
    sfx(bonk(r), fr(1413), 1.0, 0.0, "BONK on Newton's head")
    sfx(twinkle(r), fr(1416), 0.45, 0.1)
    # the Tower: marching boots on cobbles, gate clang
    for k in range(14):
        sfx(S.stroll_step(r, 0.2), fr(1453) + k * 0.5 + (k % 2) * 0.02, 0.5, -0.1)
    sfx(clang(r), fr(1528), 0.6, 0.0, "gate clangs shut")
    for tf in [1584, 1592]:
        sfx(S.clink(r, 3600, 0.25, 1.0), fr(tf), 0.6, 0.2, "coin from the press")
    # pockets + moth
    sfx(rustle(r, 0.3, 0.8), fr(1722), 0.5, 0.0, "pockets pulled out")
    n4 = ns(1.0); tl = np.arange(n4) / SR
    sfx(bp(r.standard_normal(n4), 200, 1200, 1) * (0.5 + 0.5 * np.sin(TAU * 22 * tl)) * np.exp(-tl / 0.5) * 0.3, fr(1741), 0.6, 0.3, "moth flutters out")
    # the apple again
    sfx(rustle(r, 0.4, 0.7), fr(1800), 0.4, 0.2)
    sfx(bonk(r), fr(1817), 1.0, 0.0, "BONK: the apple on his head")
    sfx(twinkle(r, 1.6), fr(1819), 0.4, -0.1)
    sfx(thud(r, 160, 0.2) * 0.5, fr(1835), 0.5, 0.3)
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
