# Sound for "The $100 Million Phone Call" (fiction): a dark suspense score (D minor pulse, heartbeat, ticking that
# builds; it stops on the lesson line and resolves into a warm sunrise), a smartphone ringtone, hits and whooshes.
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix: music -12 LU under the voice and ducked 3 dB
# under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from phonecall-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/phonecall/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1710
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
CH.update({"Dm": ["D", "F", "A"], "Bb": ["A#", "D", "F"], "F": ["F", "A", "C"], "C": ["C", "E", "G"], "Gm": ["G", "A#", "D"]})
B = 0.3
def heartbeat(t0, t1, period=0.85, vel=0.7):
    t = t0
    while t < t1:
        put(lp(I.timpani(F(m("D1")), vel, R, 0.5), 300), t, 0.6); put(lp(I.timpani(F(m("D1")), vel * 0.6, R, 0.4), 300), t + 0.22, 0.5); t += period
def tick(t0, t1, step=0.5, vel=0.4):
    t = t0
    while t < t1:
        put(hp(I.brush(vel, R, 0.05), 3000), t, 0.5, 0.3); t += step
# hook: a hit on frame 0, the D minor pulse
put(I.timpani(F(m("D2")), 0.9, R, 2.4), 0.05, 0.9); put(I.cymbal(0.4, R, 2.0), 0.05, 0.25)
pad("Dm", 0.05, W("Just"), 0.32, att=0.2)
for k in range(int(W("Just") / (2 * B))):
    low(m("D2") if k % 4 < 3 else m("A#1"), 0.1 + k * 2 * B, 0.6)
put(I.timpani(F(m("D2")), 0.7, R, 2.0), W("destroyed") - 0.05, 0.7)
# the perfect life: bright, confident, quick arpeggios in D major
arp(W("Just"), W("But", line="s3") - 0.1, ["D", "G", "A", "D", "G", "A", "Bm", "A"], 0.4, step=0.22)
glk(m("A5"), W("everything", line="s2"), 0.4); glk(m("D6"), W("mansion"), 0.35); glk(m("F#6"), W("jets"), 0.35)
# the phone: the music drops out; only a tick
tick(W("But", line="s3"), W("His", line="s4"), 0.5)
# the advisor: a tense pulse and a heartbeat that speeds up
pad("Dm", W("His", line="s4"), W("Your"), 0.3, att=0.6)
tick(W("His", line="s4"), W("Your"), 0.42, 0.45)
heartbeat(W("delivered") - 0.2, W("Your"), 0.75)
# collapsed: a big hit, then a falling minor line over the crash
T_C = W("collapsed")
put(I.timpani(F(m("D1")), 1.0, R, 3.0), T_C - 0.03, 1.0); put(I.cymbal(0.6, R, 2.6), T_C - 0.03, 0.4)
pad("Gm", T_C, W("Within"), 0.34, att=0.3)
for i, n in enumerate(["D5", "C5", "A#4", "A4", "G4", "F4", "E4", "D4"]):
    put(I.pluck(F(m(n)), 0.55, R, 0.6, bright=0.5, pos=0.15), W("Millions") + i * 0.28, 0.7, -0.1)
heartbeat(W("His", line="s5"), W("Within"), 0.6, 0.8)
# within hours: sparse, lonely notes
pad("Dm", W("Within"), W("He", line="s7"), 0.28)
for i, n in enumerate(["A4", None, "F4", None, "D4", None, "E4"]):
    if n: put(I.pluck(F(m(n)), 0.5, R, 1.2, bright=0.4, pos=0.2), W("Within") + i * 0.55, 0.6, 0.1)
# the lesson: one held chord, and the music STOPS on the twist line (only a low drone)
pad("Bb", W("He", line="s7"), W("He", 1, "s7") - 0.1, 0.3)
low(m("D2"), W("He", 1, "s7"), 0.7, 3.5)
put(lp(I.pad([F(m("D2")), F(m("A2"))], W("Making") - W("He", 1, "s7"), 0.4, R, att=0.4, rel=0.8), 400), W("He", 1, "s7"), 0.6)
# sunrise: warm, slow, resolving into D major
pad("F", W("Making"), W("But", line="s8"), 0.3, att=0.8)
arp(W("Making"), DUR - 1.0, ["G", "D", "A", "D", "G", "A", "D"], 0.32, step=0.34)
pad("D", W("Would"), DUR - 0.05, 0.32, att=0.6, rel=1.2)
motif(W("millionaire"), ["D5", "F#5", "A5", "D6"], 0.24, 0.45)

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
put(two(S.breeze(DUR, Q, 0.2))[:, :N], 0.0, 0.3, 0.0, SF)
SHOT_STARTS = (36, 72, 110, 172, 245, 288, 318, 346, 410, 460, 498, 560, 625, 660, 748, 800, 850, 915, 1000, 1075, 1150, 1230, 1305, 1375, 1460, 1545, 1630)
for f0 in SHOT_STARTS:
    sfx(swish(Q, 0.3), fr(f0) - 0.08, 0.22, Q.uniform(-0.4, 0.4))
# text slams
for a in (4, 214, 425, 660, 749, 920, 1174, 1463):
    sfx(S.whoosh(0.35, Q, peak=0.25), fr(a) - 0.2, 0.3, 0.0); sfx(pop_small(Q), fr(a), 0.35, 0.0)
CUES.append((fr(4), "title slams"))
# cars, jet, coins
sfx(S.whoosh(0.8, Q, peak=0.4, f_lo=200, f_hi=1500), fr(291), 0.5, 0.3, "car")
sfx(S.whoosh(1.4, Q, peak=0.5, f_lo=150, f_hi=900, tail=0.6), fr(318), 0.55, -0.2, "jet")
for k in range(10):
    sfx(S.clink(Q), fr(350) + k * 0.16 + Q.uniform(0, 0.05), 0.35, Q.uniform(-0.5, 0.5))
# the smartphone ringtone: a bright marimba-like figure, repeated, cut when he answers
T_R = fr(425)
for k in range(4):
    for i, n in enumerate(["E6", "B5", "G#5", "B5", "E6", "F#6"]):
        sfx(I.musicbox(F(m(n)), 0.7, R, 0.5), T_R + k * 1.3 + i * 0.13, 0.6, -0.2)
CUES.append((T_R, "phone rings"))
sfx(pop_small(Q), fr(470), 0.4, 0.0, "he answers")
# the collapse
sfx(S.whoosh(0.7, Q, peak=0.5), fr(700), 0.5, 0.0, "collapsed")
for k in range(6):
    sfx(pop_small(Q) * 0.5, fr(760) + k * 0.12, 0.25, Q.uniform(-0.5, 0.5))
sfx(S.whoosh(0.6, Q, peak=0.3), fr(760), 0.35, 0.0, "papers fly")
for k in range(6):
    sfx(S.stroll_step(Q, 0.5), fr(852) + k * 0.25, 0.35, -0.3 + 0.12 * k)
CUES.append((fr(852), "the bankers"))
# sunrise birds
put(two(S.bird_chirps(DUR - fr(1305), Q, 0.25, "sparrow"), 0.3), fr(1305), 0.18, 0.0, SF)

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "phonecall"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: The $100 Million Phone Call (fiction)\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
