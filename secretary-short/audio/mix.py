# Sound for "A Secretary Died With $9 Million": the series' folk score (same key, same
# glockenspiel theme) re-cut to this story, synthesized SFX on the word cues of the picture, a river bed under it.
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix: music -12 LU under the voice and ducked 3 dB
# under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from secretary-short/; writes audio/mix.wav, audio/cues.md and blender/audio/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1335
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



_Ws = W
W = lambda *a, **k: round(_Ws(*a, **k) * FPS)  # this film's cues are in frames

# =============================================================== score
B = 0.3
THEME = ["D5", "F#5", "A5", None, "B5", "A5"]
# hook: low pulse, a glock hit on "nine million", a question on "known"
for k in range(int(fr(W("Sylvia")) / (2 * B))):
    low(m("B1"), 0.15 + k * 2 * B, 0.5)
pad("Bm", 0.1, fr(W("Sylvia")), 0.25)
motif(fr(W("nine")), ["D6", "A5", "F#5"], 0.14, 0.45)
motif(fr(W("known")), ["D5", None, "E5"], 0.2, 0.3)
put(I.triangle(0.4, R, 1.6), fr(W("nine")), 0.25, 0.3)
# her life: warm, steady fingerpicking (the years go by)
arp(fr(W("Sylvia")), fr(W("But", line="trick")), ["D", "G", "A", "D"], 0.38, step=0.3)
# the trick: brighter, a glock on each "bought"
arp(fr(W("But", line="trick")), fr(W("She", line="quiet")), ["G", "A", "Bm", "A"], 0.4, step=0.26)
for t in (W("bought", line="trick"), W("bought", 1, line="trick")):
    glk(m("A5"), fr(t), 0.4)
motif(fr(W("waited", line="wait")), THEME, 0.2, 0.4)
# the secret: almost nothing
pad("Em", fr(W("She", line="quiet")), fr(W("When")), 0.22)
# found: tense pulse, then the reveal
for k in range(int(fr(W("Around") - W("When")) / (2 * B))):
    low(m("E2") if k % 2 == 0 else m("F#2"), fr(W("When")) + k * 2 * B, 0.55)
pad("Bm", fr(W("When")), fr(W("Around")), 0.28)
T_N = fr(W("nine", line="total"))
put(I.timpani(F(m("D2")), 0.8, R, 2.4), T_N - 0.02, 0.8)
put(I.cymbal(0.4, R, 2.0), T_N - 0.02, 0.25)
for i, n in enumerate(chord("D", 3) + [m("D4") + 12]):
    guitar(n, T_N - 0.08 + i * 0.03, 0.6, 0.1, 1.8)
# the gift: the theme, warm and full
arp(fr(W("And", line="gave")), fr(W("She", line="lesson")), ["D", "G", "Bm", "A"], 0.4, step=0.28)
motif(fr(W("scholarships")), THEME, 0.2, 0.45)
# the lesson: slow, held
pad("G", fr(W("She", line="lesson")), fr(W("What")), 0.3)
pad("A", fr(W("What")), fr(W("Could")), 0.3)
arp(fr(W("What")), fr(W("Could")) - 0.1, ["G", "A", "Bm", "A"], 0.3, step=0.36)
# the question: resolve, ring out
motif(fr(W("years", line="end")), ["D5", "F#5", "A5", "D6"], 0.22, 0.45)
pad("D", fr(W("Could")) - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

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
CUTS = (78, 141, 216, 333, 365, 432, 490, 563, 664, 705, 890, 940, 1097, 1262)
for f0 in CUTS:
    sfx(swish(Q, 0.35), fr(f0) - 0.1, 0.22, Q.uniform(-0.4, 0.4))


def clink(r, f=3136):
    return modal(0.6, [(f, 1.0, 0.18), (f * 1.52, 0.4, 0.1), (f * 2.3, 0.2, 0.06)], r) * 0.3


def typing(r, dur):
    y = np.zeros(ns(dur))
    t = 0.0
    while t < dur - 0.1:
        c = bp(r.standard_normal(ns(0.03)), 1500, 7000, 1) * np.exp(-tt(0.03) / 0.005) * r.uniform(0.4, 1.0)
        S._place_mono(y, c, t); t += r.uniform(0.07, 0.16)
    return y


def rumble(r, dur):
    n = ns(dur)
    y = lp(r.standard_normal(n), 180) * 0.6 + lp(r.standard_normal(n), 900) * 0.15
    for k in range(int(dur / 0.55)):  # rail joints
        S._place_mono(y, bp(r.standard_normal(ns(0.05)), 200, 1500, 1) * np.exp(-tt(0.05) / 0.012) * 0.8, k * 0.55 + 0.1)
    return fades(y, 0.2, 0.3)


def ring(r):
    t = tt(1.2)
    y = (np.sin(TAU * 1300 * t) + np.sin(TAU * 1600 * t)) * 0.2 * (np.sin(TAU * 20 * t) > 0) * (t < 0.9)
    return fades(y, 0.005, 0.1)


sfx(S.whoosh(0.4, Q, peak=0.35), 0.0, 0.4, 0.0, "the gold number rises")
sfx(clink(Q, 2637), fr(W("nine")), 0.6, 0.0, "slam on nine"); sfx(pop_small(Q), fr(W("nine")), 0.4)
sfx(ding(Q, 1760), fr(W("known")), 0.3, 0.2, "husband puzzled")
sfx(typing(Q, fr(333 - 216)), fr(216), 0.35, -0.2, "typing")
sfx(pop_small(Q), fr(W("sixty-seven", line="who")), 0.45, 0.0, "young -> old")
put(two(rumble(Q, fr(432 - 365))), fr(365), 0.5, 0.0, SF); CUES.append((fr(365), "subway rumble"))
sfx(ring(Q), fr(432), 0.35, 0.3, "phone")
sfx(pop_small(Q), fr(W("bought", line="trick")), 0.5, 0.3, "BUY 100")
sfx(pop_small(Q), fr(W("bought", 1, line="trick")), 0.5, -0.3, "BUY 5")
sfx(S.whoosh(0.25, Q, peak=0.25), fr(W("less")), 0.3, -0.3)
for i in range(12):
    sfx(flop(Q) * 0.5, fr(570 + i * 7), 0.25, -0.2)
CUES.append((fr(570), "certificates pile up"))
sfx(thunk(Q), fr(W("anyone")), 0.5, 0.0, "drawer shuts")
for i in range(14):
    f0 = W("three", line="found") + i * 3 if i < 3 else W("eleven") + (i - 3) * 2
    sfx(flop(Q) * 0.6, fr(f0), 0.3, -0.3 + 0.04 * i)
CUES.append((fr(W("three", line="found")), "bank books fan out"))
sfx(clink(Q, 3136), fr(W("Six")), 0.5, 0.0, "$6.2M"); sfx(pop_small(Q), fr(W("Six")), 0.4)
put(two(S.bird_chirps(fr(1097 - 940), Q, 0.25, "sparrow"), 0.4), fr(940), 0.18, 0.0, SF)

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
PUB = os.path.join(ROOT, "blender", "audio"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: A Secretary Died With $9 Million\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
