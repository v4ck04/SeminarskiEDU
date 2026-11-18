# Sound for "He Sold a Country That Didn't Exist" (Gregor MacGregor and Poyais): the channel's folk score re-cut to
# this story (a salesman's bright pitch, a sea crossing, a jungle drone), synthesized SFX on the word cues.
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix: music -12 LU under the voice and ducked 3 dB
# under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from poyais-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/poyais/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1650
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
CH = {"D": ["D", "F#", "A"], "G": ["G", "B", "D"], "A": ["A", "C#", "E"], "Bm": ["B", "D", "F#"], "Em": ["E", "G", "B"],
      "F#m": ["F#", "A", "C#"], "A7": ["A", "C#", "G"]}


def chord(name, octave=3):
    out, last = [], -1
    for n in CH[name]:
        x = 12 * (octave + 1) + NOTE[n]
        while x <= last:
            x += 12
        out.append(x); last = x
    return out


R = rng(77)
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


def guitar(midi, t, vel=0.5, p=0.0, dur=1.3):
    put(I.pluck(F(midi), vel, R, dur, bright=0.45, pos=0.14), t, 1.0, p)


def glk(midi, t, vel=0.5, p=0.25):
    put(I.glock(F(midi), vel, R, 1.6), t, 0.5, p)


def arp(t0, t1, chords, vel=0.42, step=0.3, p=-0.15, octave=3):
    """eighth-note fingerpicking: root, fifth, third, fifth, octave, fifth, third, fifth; one chord per bar"""
    t, k = t0, 0
    while t < t1 - 0.02:
        c = chord(chords[(k // 8) % len(chords)], octave)
        pat = [c[0], c[2], c[1] + 12, c[2], c[0] + 12, c[2], c[1] + 12, c[2]]
        guitar(pat[k % 8], t, vel * (1.0 if k % 4 == 0 else 0.72), p, 1.1)
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
B = 0.3
THEME = ["D5", "F#5", "A5", None, "B5", "A5"]
for k in range(int(4.6 / (2 * B))):
    low(m("B1"), 0.15 + k * 2 * B, 0.5)
pad("Bm", 0.1, W("It", line="name"), 0.25)
motif(1.2, ["F#5", None, "D5", None, "E5"], 0.3, 0.33)
T_P = W("Poyais", line="name")
for i, n in enumerate(chord("D", 3) + [m("D4") + 12]):
    guitar(n, T_P - 0.08 + i * 0.03, 0.6, 0.1, 1.8)
motif(T_P, THEME, 0.18, 0.45)
# the pitch: bright, quick fingerpicking; a glock step on each wonder
arp(W("Gregor"), W("There", line="book"), ["D", "G", "A", "D", "G", "A", "D", "A"], 0.42, step=0.26)
for w, n in ((W("prince"), "A5"), (W("land"), "B5"), (W("fish", line="set"), "D6"), (W("theater", line="set"), "F#6")):
    glk(m(n), w, 0.4, 0.3)
arp(W("There", line="book"), W("There", 1, "book") - 0.1, ["G", "A"], 0.36, step=0.3)
for i, n in enumerate(["A4", "E5"]):
    put(I.pluck(F(m(n)), 0.6, R, 0.3, bright=0.75, pos=0.1), W("no", line="book") + i * 0.22, 0.8, -0.2)
arp(W("He", line="money"), W("Two", line="ships") - 0.1, ["D", "A", "Bm", "G", "D", "A", "G", "A"], 0.42, step=0.24)
for w in (W("money", line="money"), W("land", line="money"), W("bonds")):
    glk(m("A5"), w, 0.35, 0.2)
motif(W("packing"), ["D5", "E5", "F#5", "A5"], 0.14, 0.4)
# the crossing: a held sea pad
pad("G", W("Two", line="ships"), W("They", line="ships"), 0.3, att=0.6)
pad("D", W("They", line="ships"), W("Just"), 0.26)
for w in (W("capital", line="ships"), W("theater", line="ships"), W("town")):
    low(m("B1"), w, 0.6, 0.8)
# just jungle: everything drops to a low drone
pad("Bm", W("Just"), W("Luckily"), 0.3, att=0.2)
low(m("B1"), W("jungle"), 0.7, 1.6)
# luckily / unluckily
arp(W("Luckily"), W("Unluckily") - 0.1, ["D", "G"], 0.38, step=0.26)
for i, n in enumerate(["D5", "C#5", "B4", "A#4"]):
    put(I.pluck(F(m(n)), 0.5, R, 0.5, bright=0.6, pos=0.12), W("Unluckily") + 0.2 + i * 0.16, 0.8, 0.2)
# most of them never came home
pad("Em", W("Most"), W("Why"), 0.32, att=0.5)
# why it worked: calm, plain
arp(W("Why"), W("When") - 0.1, ["G", "D", "A", "D", "G", "A"], 0.32, step=0.34)
glk(m("A5"), W("nicer"), 0.35)
# france: the pitch starts again
arp(W("When"), W("He", line="end") - 0.1, ["D", "A", "G", "A"], 0.4, step=0.26)
motif(W("again"), ["A5", "B5", "D6"], 0.12, 0.42)
# the end: the theme resolved
arp(W("He", line="end"), DUR - 1.0, ["G", "A", "D"], 0.34, step=0.36)
motif(W("visit"), ["D5", "F#5", "A5", "D6"], 0.24, 0.45)
pad("D", W("visit") - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

# =============================================================== SFX
Q = rng(13)


def plop(r, f0=420):
    t = tt(0.35)
    y = np.sin(phase(f0 * (1 + 1.6 * (t / 0.35) ** 0.6))) * np.exp(-t / 0.06) * 0.6
    y += bp(r.standard_normal(len(t)), 800, 4000, 1) * np.exp(-t / 0.03) * 0.3
    return fades(y, 0.0005, 0.05)


def splash_small(r):
    y = S.bubbles(0.5, r, 40, 500, 3000) * 0.5
    y[: ns(0.35)] += bp(r.standard_normal(ns(0.35)), 600, 6000, 1) * np.exp(-tt(0.35) / 0.07) * 0.6
    return fades(y, 0.001, 0.1)


def flop(r):
    """wet fish slap on wood"""
    t = tt(0.25)
    y = bp(r.standard_normal(len(t)), 300, 2500, 1) * np.exp(-t / 0.025) * 0.9
    y += np.sin(phase(140 * (1 + 0.5 * np.exp(-t / 0.02)))) * np.exp(-t / 0.05) * 0.5
    return fades(y, 0.0003, 0.04)


def munch(r, n=4):
    y = np.zeros(ns(0.25 * n + 0.2))
    for k in range(n):
        c = bp(r.standard_normal(ns(0.12)), 900, 5000, 1) * np.exp(-tt(0.12) / 0.03) * 0.5
        S._place_mono(y, c, k * 0.22 + r.uniform(0, 0.03))
    return y


def growl(r, dur=1.4):
    n = ns(dur); tl = np.arange(n) / SR
    f = 70 + 25 * smooth_noise(n, r, 6)
    y = np.sin(TAU * np.cumsum(f) / SR) * (0.5 + 0.5 * smooth_noise(n, r, 9)) * 0.5
    y += lp(r.standard_normal(n), 300) * 0.3
    return fades(y * np.sin(np.pi * np.clip(tl / dur, 0, 1)), 0.05, 0.2)


def pop_small(r):
    t = tt(0.2)
    return np.sin(phase(600 * (1 + 1.2 * np.exp(-t / 0.01)))) * np.exp(-t / 0.04) * 0.5


def ding(r, f=2093):
    return modal(1.2, [(f, 1.0, 0.5), (f * 2.76, 0.25, 0.15)], r) * 0.35


def snore(r, dur=1.6):
    n = ns(dur); tl = np.arange(n) / SR
    y = lp(r.standard_normal(n), 500) * (0.5 + 0.5 * np.sin(TAU * 38 * tl)) * np.sin(np.pi * np.clip(tl / dur, 0, 1)) ** 2
    return y * 0.4


def swish(r, dur=0.4):
    return I.brush(0.7, r, dur, swish=True)


def rip(r):
    """wicker tearing: a short run of dry snaps"""
    y = np.zeros(ns(0.3))
    for k in range(7):
        c = bp(r.standard_normal(ns(0.03)), 1200, 6000, 1) * np.exp(-tt(0.03) / 0.006) * r.uniform(0.4, 0.9)
        S._place_mono(y, c, k * 0.032 + r.uniform(0, 0.01))
    return fades(y, 0.0005, 0.05)


def thunk(r):
    """a fish landing in a wicker basket / wooden barrel"""
    t = tt(0.3)
    y = np.sin(phase(180 * (1 + 0.4 * np.exp(-t / 0.02)))) * np.exp(-t / 0.06) * 0.6
    y += bp(r.standard_normal(len(t)), 400, 2500, 1) * np.exp(-t / 0.02) * 0.35
    return fades(y, 0.0003, 0.05)

two = lambda x, p=0.0: x if np.ndim(x) == 2 else pan(x, p)
put(two(S.water_bed(DUR, Q, close=0.5))[:, :N] * 0.35, 0.0, 1.0, 0.0, SF)
put(two(S.breeze(DUR, Q, 0.3))[:, :N], 0.0, 0.5, 0.0, SF)
put(two(S.bird_chirps(fr(797), Q, 0.25, "sparrow"), 0.4), 0.0, 0.18, 0.0, SF)
put(two(S.crickets(fr(1170) - fr(870), Q)), fr(870), 0.35, 0.0, SF)
put(two(S.babble(fr(745), Q, 140, 1.2), -0.2), 0.0, 0.12, 0.0, SF)
for f0 in (145, 183, 410, 555, 748, 797, 870, 982, 1117, 1170, 1358, 1478, 1540):
    sfx(swish(Q, 0.35), fr(f0) - 0.1, 0.25, Q.uniform(-0.4, 0.4))
sfx(ding(Q, 2637), fr(157), 0.6, 0.2, "the map of Poyais")
sfx(pop_small(Q), fr(256), 0.4, 0.0, "prince")
for g in (277, 318, 353, 390):
    sfx(pop_small(Q), fr(g), 0.4, -0.3)
CUES.append((fr(277), "the dream bubble"))
sfx(pop_small(Q), fr(429), 0.5, 0.2, "the guidebook")
sfx(ding(Q, 2349), fr(586), 0.4, -0.3, "money"); sfx(ding(Q, 2637), fr(629), 0.4, 0.0, "land"); sfx(ding(Q, 3136), fr(680), 0.4, 0.3, "bonds")
for k in range(4):
    sfx(S.clink(Q), fr(708 + 9 * k), 0.5, -0.4 + 0.25 * k)
    sfx(S.clink(Q), fr(710 + 9 * k), 0.4, -0.4 + 0.25 * k)
CUES.append((fr(708), "money bags handed over"))
for k in range(8):
    sfx(S.stroll_step(Q, 0.4), fr(750) + k * 0.2, 0.3, 0.3 - 0.08 * k)
sfx(S.creak(1.6, Q, 90, 140), fr(800), 0.3, 0.0, "the ship")
for k in range(3):
    sfx(splash_small(Q), fr(805) + k * 0.7, 0.35, Q.uniform(-0.4, 0.4))
for g in (884, 916, 938):
    sfx(pop_small(Q) * 0.6, fr(g), 0.25, 0.0)
sfx(S.whoosh(0.6, Q, peak=0.35), fr(950), 0.4, 0.0, "just jungle")
sfx(pop_small(Q), fr(990), 0.4, 0.1, "Poyais money held up")
sfx(S.creak(0.5, Q, 300, 200), fr(1080), 0.2, 0.0, "nobody had heard of it")
sfx(ding(Q, 2637), fr(1288), 0.45, 0.2, "nicer pictures")
for k, g in enumerate((1321, 1328, 1335, 1342)):
    sfx(pop_small(Q), fr(g), 0.3, -0.4 + 0.25 * k)
sfx(ding(Q, 3136), fr(1461), 0.4, 0.0, "selling Poyais again")
for k in range(10):
    sfx(S.stroll_step(Q, 0.4), fr(1518) + k * 0.3, 0.3, -0.1 * k)
CUES.append((fr(1513), "walks free"))

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "poyais"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: He Sold a Country That Didn\'t Exist\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
