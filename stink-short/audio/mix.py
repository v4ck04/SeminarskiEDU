# Sound for "Victorian London Was So Disgusting..." (the Great Stink, 1858): an original score that builds (a murky
# minor plod for the filthy river, a rising heat pulse, a comic scramble in Parliament, a bold march for Bazalgette and
# a warm resolve) and SFX on the picture's cues: the opening boom, bubbling sewage, flies, the heat riser, cartoon
# reaction pops, a record scratch when nothing works, an orchestral hit for Bazalgette, tunnel construction, the
# ending impact. Library effects come from sfx-library/; the rest is synthesized here.
# Mix as the other episodes: music -12 LU under the voice and ducked 3 dB under words, SFX -15 LU,
# master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from stink-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/stink/mix.wav)
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

FPS, TOTAL = 30, 1720          # must match finance-short/src/videos/stink/story.ts TOTAL
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
def pizz(midi, t, vel=0.5, p=0.0):
    put(I.pluck(F(midi), vel, R, 0.4, bright=0.55, pos=0.12), t, 0.9, p)


def plod(t0, t1, seq, step=0.3, vel=0.42):
    t, k = t0, 0
    while t < t1 - 0.02:
        pizz(m(seq[k % len(seq)]), t, vel * (1.0 if k % 4 == 0 else 0.7), -0.1)
        t += step; k += 1


# the hook: a low drone
pad("Dm", 0.1, W("Back"), 0.3, att=0.4, octave=2)
# the filthy river: a murky minor plod
plod(W("Back"), W("Then", line="summer"), ["D2", "F2", "A2", "G#2", "A2", "F2", "E2", "C#2"], 0.3, 0.42)
motif(W("sewer"), ["D5", "C#5", "C5"], 0.16, 0.38)
# the heat: a rising pulse, faster and faster
t = W("Then", line="summer"); k = 0
while t < W("The", line="smell") - 0.05:
    low(m("D2") if k % 2 else m("A1"), t, 0.35 + 0.25 * (t - W("Then", line="summer")) / 7, 0.25)
    t += max(0.12, 0.34 - 0.03 * (t - W("Then", line="summer"))); k += 1
low(m("D1"), W("unbearable"), 0.9, 1.4)
# Parliament: a comic scramble
arp(W("People", line="people"), W("It", line="nope") - 0.05, ["Dm", "Am", "Dm", "E"], 0.36, step=0.17)
# it didn't work: silence after the scratch, then a deflated plod
plod(W("There"), W("Finally"), ["A2", "G2", "F2", "E2"], 0.34, 0.34)
# the solution: a bold march in C, building to Bazalgette
arp(W("Finally"), W("It", line="years"), ["F", "C", "G", "C"], 0.44, step=0.2)
motif(W("Bazalgette"), ["C5", "G5", "C6"], 0.12, 0.5)
pad("C", W("Bazalgette"), W("It", line="years"), 0.32, att=0.1)
# 1875: warm, broad
arp(W("It", line="years"), W("The", line="embarrass"), ["C", "F", "Am", "G"], 0.4, step=0.26)
# the payoff: a resolve
arp(W("The", line="embarrass"), DUR - 1.6, ["F", "G", "C"], 0.34, step=0.32)
motif(W("underneath"), ["C5", "E5", "G5", "C6"], 0.18, 0.45)
pad("C", W("underneath") - 0.1, DUR - 0.05, 0.34, att=0.4, rel=1.4)

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


def bubble(r):
    """one sewage bubble: a little pitched blip"""
    f0 = r.uniform(180, 420); d = r.uniform(0.06, 0.14); t = tt(d)
    return fades(np.sin(phase(f0 * (1 + 1.5 * t / d))) * np.exp(-t / (d * 0.5)) * 0.4, 0.002, 0.02)


def bubbling(dur, r, rate=9):
    y = np.zeros(ns(dur + 0.2)); t = 0.0
    while t < dur:
        S._place_mono(y, bubble(r), t); t += r.uniform(0.4, 1.6) / rate
    return y + lp(r.standard_normal(len(y)), 300) * 0.08


def buzz(dur, r, f0=210):
    """a fly buzzing around: a wobbling saw-like hum"""
    t = tt(dur)
    f = f0 * (1 + 0.08 * np.sin(TAU * 1.7 * t) + 0.05 * np.sin(TAU * 4.3 * t))
    y = np.sign(np.sin(phase(f))) * 0.12 + np.sin(phase(2 * f)) * 0.08
    return fades(bp(y, 150, 3000, 1) * (0.6 + 0.4 * np.sin(TAU * 0.6 * t + r.uniform(0, 6))) * 0.5, 0.1, 0.2)


def scratch(r):
    """a record scratch: a fast pitch-down whip of noise and tone"""
    d = 0.45; t = tt(d)
    f = 1400 * np.exp(-t * 6) + 120
    y = np.sin(phase(f)) * 0.4 + bp(r.standard_normal(len(t)), 800, 5000, 1) * 0.35
    y *= np.minimum(1, t / 0.01) * np.exp(-t / 0.18)
    return fades(y, 0.001, 0.05)


def pick(r):
    """a pick on clay and brick"""
    t = tt(0.25)
    return modal(0.25, [(900, 1.0, 0.04), (2300, 0.5, 0.03)], r) * 0.5 + lp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.03) * 0.4


def gag(r):
    """a comic 'bleh': a wobbling low vowel blip"""
    d = 0.4; t = tt(d)
    f = 220 * (1 - 0.3 * t / d) * (1 + 0.05 * np.sin(TAU * 18 * t))
    return fades(bp(np.sign(np.sin(phase(f))) * 0.3, 200, 1800, 1) * np.sin(np.pi * t / d), 0.01, 0.05)


# ambience: city air; the river bubbling; the room hum; the tunnels
for a, b2 in ((0, 776), (1146, 1240), (1462, TOTAL)):
    put(two(S.breeze(fr(b2 - a), Q, 0.35))[:, :ns(fr(b2 - a))], fr(a), 0.4, 0.0, SF)
for a, b2 in ((0, 432), (586, 736)):
    put(two(bubbling(fr(b2 - a), Q)), fr(a), 0.45, 0.0, SF)
CUES.append((fr(145), "sewage bubbling under the river shots"))
put(two(lp(S.breeze(fr(1462 - 1240), Q, 0.5), 400))[:, :ns(fr(1462 - 1240))], fr(1240), 0.6, 0.0, SF)
for t0, d, p in ((fr(60), 3.0, 0.3), (fr(300), 4.0, -0.3), (fr(660), 2.6, 0.2), (fr(800), 3.0, -0.2)):
    sfx(buzz(d, Q), t0, 0.3, p, "flies buzzing")
for i, f0 in enumerate((284, 432, 494, 586, 648, 736, 776, 1025, 1146, 1240, 1305, 1462, 1530)):
    lib(["whoosh_soft", "whoosh_smooth", "swipe_tech"][i % 3], fr(f0), 0.28, Q.uniform(-0.3, 0.3), peak=True)
lib("whoosh_heavy", fr(145), 0.35, 0.0, "hook flash", peak=True)
# 1 the opening boom, the dive
lib("boom", fr(4), 0.5, 0.0, "opening boom"); lib("whoosh_airy", fr(40), 0.3, 0.0, "the dive to the river", peak=True)
sfx(gag(Q), fr(84), 0.4, 0.0, "the politician gags")
# 3 the bucket, the splash
sfx(swish(Q), fr(318), 0.35, 0.2, "bucket tipped"); sfx(plop(Q, 220), fr(350), 0.7, 0.2, "splash into the Thames")
sfx(plop(Q, 300), fr(362), 0.4, 0.1)
# 4-5 the heat: a riser to the thermometer peak
lib("riser", fr(560), 0.35, 0.0, "the heat rises", peak=True); lib("ding", fr(560), 0.25, 0.0, "34 degrees")
# 7 people flee
for k in range(10):
    sfx(S.stroll_step(Q, 0.5), fr(655) + k * 0.2, 0.25, Q.uniform(-0.4, 0.4))
sfx(gag(Q), fr(706), 0.35, -0.2)
# 9 windows slam, curtains soaked
sfx(knock(Q), fr(812), 0.6, -0.2, "window slams"); sfx(knock(Q), fr(820), 0.4, -0.2)
lib("pop_bubble", fr(848), 0.35, 0.2, "chloride of lime on the curtains")
# 10 it didn't work: the record scratch; the escape
sfx(scratch(Q), fr(936), 0.9, 0.0, "record scratch: it didn't work")
sfx(gag(Q), fr(944), 0.4, 0.2); lib("buzz_error", fr(948), 0.15, 0.0)
for k in range(6):
    sfx(S.stroll_step(Q, 0.5), fr(972) + k * 0.25, 0.3, 0.3)
lib("pop_ui", fr(993), 0.3, 0.0, "moving Parliament")
# 11 the fist on the table; the days; the stamp
sfx(thud(Q), fr(1061), 0.8, 0.0, "fist on the table"); lib("tick_roll", fr(1100), 0.35, 0.0, "18 days")
sfx(stamp(Q), fr(1138), 0.8, 0.0, "LAW PASSED"); lib("boom", fr(1138), 0.25, 0.0)
# 12 Bazalgette: the orchestral hit; the plan unrolls
lib("boom", fr(1182), 0.45, 0.0, "orchestral hit: Bazalgette"); lib("sting_reveal", fr(1182), 0.45, 0.0); lib("chime_success", fr(1186), 0.3, 0.0)
sfx(unroll(1.0, Q), fr(1200), 0.4, 0.2, "the plan unrolls")
# 13 construction
for k in range(14):
    sfx(pick(Q), fr(1244) + k * 0.15 + Q.uniform(0, 0.05), 0.4, Q.uniform(-0.6, 0.6))
sfx(clank(Q), fr(1262), 0.3, 0.3, "construction in the tunnel")
# 14 the years roll
lib("tick_roll", fr(1312), 0.3, 0.0, "1858 -> 1875"); lib("chime_success", fr(1372), 0.4, 0.0, "1875")
# 15 the relieved breath
put(two(lp(S.breeze(1.0, Q, 1.0), 1200)), fr(1495), 0.5, 0.0, SF); CUES.append((fr(1495), "relieved breath"))
# 16 the ending impact
lib("boom", fr(1612), 0.45, 0.0, "ending impact"); lib("whoosh_airy", fr(1530), 0.3, 0.0, peak=True)

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
MUS *= dbg(vl - 12.0 - integrated(MUS))
MUS *= (1 - (1 - dbg(-3.0)) * mask)[None, :]
SF *= dbg(vl - 15.0 - integrated(SF))
mix = voice + MUS + SF
e = np.minimum(1, (N - np.arange(N)) / ns(0.6)); mix *= e[None, :]
for _ in range(2):
    mix = limiter(mix * dbg(-14.0 - integrated(mix)), -1.5)
write_wav(os.path.join(HERE, "mix.wav"), mix)
PUB = os.path.join(ROOT, "..", "finance-short", "public", "stink"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: Victorian London Was So Disgusting\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
