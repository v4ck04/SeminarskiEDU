# Sound for "One Fishing Net Explains It": an original folk score (plucked guitar arpeggios, glockenspiel motif, pads)
# that follows the story, synthesized SFX on the word cues of the picture, a river bed under everything.
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix: music -12 LU under the voice and ducked 3 dB
# under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from net-short/; writes audio/mix.wav and audio/cues.md)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1695
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
B = 0.3  # one eighth at 100 bpm
# hook: a lonely low pulse on B minor, the glock asks a question
for k in range(int(3.6 / (2 * B))):
    low(m("B1"), 0.15 + k * 2 * B, 0.5)
pad("Bm", 0.1, W("One", line="net"), 0.25)
motif(1.0, ["F#5", None, "D5", None, "E5"], 0.3, 0.35)
# "one fishing net explains it": a bright strum + the theme on the glock
T_NET = W("net", line="net")
for i, n in enumerate(chord("D", 3) + [m("D4") + 12]):
    guitar(n, T_NET - 0.08 + i * 0.03, 0.6, 0.1, 1.8)
motif(T_NET, ["D5", "F#5", "A5", None, "B5", "A5"], 0.18, 0.45)
# the setting and the three men: warm fingerpicking in D
T_SET = W("Three", line="set")
arp(T_SET, W("Everyone"), ["D", "G", "A", "D", "Bm", "G", "A", "A"])
motif(T_SET + 0.1, ["A5", None, "F#5", "G5", "A5"], 0.3, 0.3)
# evening for the first man: a sad turn
pad("Bm", fr(386), fr(487), 0.22)
motif(W("Same", line="p1"), ["F#5", None, "E5", None, "D5"], 0.3, 0.32)
# everyone laughs: a playful plucked figure
TL = W("Everyone")
for i, n in enumerate(["A4", "D5", "A4", "F#5", "E5", "D5"]):
    put(I.pluck(F(m(n)), 0.55, R, 0.35, bright=0.7, pos=0.1), TL + i * 0.14, 0.8, 0.3)
# day five: hunger, the music drops to a thin minor pad
T_D5 = W("By", line="starve")
pad("Em", T_D5, W("Lend"), 0.3)
low(m("E2"), T_D5, 0.6, 1.4)
# the deal: arpeggio back, a little hopeful
arp(W("Lend"), W("On", line="throw"), ["G", "A", "D", "D"], 0.38)
# day eight: snare build to the throw, then the big hit on "Fifty"
T_TH, T_50 = W("throws"), W("Fifty")
for tm, v in I.snare_roll(W("On", line="throw"), T_50 - 0.05, 0.1, 0.55, R):
    put(I.snare(v, R, 0.2, buzz=True), tm, 0.3, 0.05)
put(I.timpani(F(m("D2")), 0.9, R, 2.4), T_50 - 0.02, 0.9)
put(I.cymbal(0.5, R, 2.4), T_50 - 0.02, 0.35)
for i, n in enumerate(chord("D", 3) + chord("D", 4)):
    guitar(n, T_50 + i * 0.025, 0.65, 0.0, 2.0)
# growth and the job offer: the arpeggio comes back brighter, higher
arp(W("Soon"), W("Same", line="same"), ["D", "A", "Bm", "G", "D", "A", "G", "A"], 0.42, octave=3)
motif(W("Three", line="job"), ["D5", "F#5", "A5", None, "D6"], 0.2, 0.42)
# same river, same start: everything stops for a breath, a held pad
pad("G", W("Same", line="same"), W("One", line="lesson"), 0.3)
# the lesson: three slow steps, one per man
for k, (w, c) in enumerate([(W("sold"), "Bm"), (W("saved"), "G"), (W("built"), "A")]):
    pad(c, w - 0.1, w + 1.3, 0.28)
    guitar(chord(c, 3)[0], w - 0.1, 0.55, -0.1, 1.6)
# the end: the theme resolved on D, held to the last frame
T_END = W("The", line="end")
arp(T_END, DUR - 1.2, ["G", "A", "D"], 0.36, step=0.36)
motif(W("net", 0, "end"), ["D5", "F#5", "A5", "D6"], 0.24, 0.45)
pad("D", W("net", 0, "end") - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

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


# river and air under everything (day), quieter in the evening shots
two = lambda x, p=0.0: x if np.ndim(x) == 2 else pan(x, p)
put(two(S.water_bed(DUR, Q, close=0.5))[:, :N] * 0.35, 0.0, 1.0, 0.0, SF)
put(two(S.breeze(DUR, Q, 0.3))[:, :N], 0.0, 0.5, 0.0, SF)
put(two(S.bird_chirps(fr(1372), Q, 0.25, "sparrow"), 0.4), 0.0, 0.18, 0.0, SF)
# cut swishes on the place changes
for f0 in (112, 163, 318, 487, 652, 786, 828, 1012, 1090, 1120, 1210, 1372, 1424, 1578):
    sfx(swish(Q, 0.35), fr(f0) - 0.1, 0.25, Q.uniform(-0.4, 0.4))
# the hook: strain ticks while he waits, the tiny fish
sfx(splash_small(Q), fr(84), 0.7, 0.2, "tiny fish jumps")
sfx(flop(Q), fr(96), 0.6, 0.2, "fish in the hand")
sfx(ding(Q, 2637), fr(124) - 0.02, 0.6, 0.2, "the net shown")
# lines go into the water
for t0 in (fr(214), fr(232), fr(250)):
    sfx(plop(Q), t0, 0.4, Q.uniform(-0.5, 0.5))
# catches
sfx(splash_small(Q), fr(346), 0.7, 0.2, "first man's catch"); sfx(flop(Q), fr(361), 0.6, 0.2)
sfx(munch(Q, 4), fr(392), 0.7, 0.1, "eating")
sfx(splash_small(Q), fr(538), 0.7, -0.2, "two fish"); sfx(flop(Q), fr(551), 0.6, -0.2)
sfx(munch(Q, 3), fr(575), 0.6, -0.1)
sfx(flop(Q), fr(604), 0.5, 0.3, "fish on the rack")
for k in range(6):
    sfx(pop_small(Q), fr(612 + k * 6), 0.35, 0.3)
# the rod laid down, knots
sfx(flop(Q) * 0.6, fr(668), 0.5, 0.0, "rod down")
for k in range(10):
    sfx(S.creak(0.12, Q, 300, 420, scale=0.3) if hasattr(S, "creak") else pop_small(Q), fr(700 + k * 7), 0.15, 0.1)
# laughing: two "ha" bursts per man (vox)
for k, base in enumerate([125, 150]):
    for i in range(4):
        sfx(S.oof(Q, "oof", base=base * (1.15 if i % 2 else 1.0), scale=1.25) * 0.5, W("laughs") + i * 0.17 + k * 0.06, 0.35, -0.3 + 0.6 * k)
# hunger
sfx(growl(Q), W("starving") - 0.1, 0.8, 0.0, "stomach growl")
# the deal bubble, the fish change hands
sfx(pop_small(Q), fr(926), 0.6, 0.0, "bubble")
sfx(ding(Q, 2349), W("twenty"), 0.5, 0.0, "twenty")
sfx(flop(Q), fr(990), 0.5, -0.2, "fish handed over")
# throw, splash, the full net
sfx(S.whoosh(0.7, Q, peak=0.35), fr(1040), 0.6, 0.2, "throw")
sfx(S.splash_big(Q), fr(1058), 0.55, 0.1, "net hits the water")
sfx(pop_small(Q) * 1.4, fr(1092), 0.6, 0.0, "fifty fish")
for k in range(8):
    sfx(flop(Q), fr(1094) + k * 0.13 + Q.uniform(0, 0.05), 0.35, Q.uniform(-0.5, 0.5))
# nets on the rack
sfx(swish(Q, 0.4), fr(1136), 0.6, 0.3, "two nets"); sfx(ding(Q, 2637), fr(1138), 0.35, 0.3)
sfx(swish(Q, 0.4), fr(1158), 0.6, -0.2, "five nets"); sfx(ding(Q, 3136), fr(1160), 0.35, -0.2)
sfx(S.creak(0.6, Q, 140, 220) if hasattr(S, "creak") else growl(Q, 0.6), fr(1180), 0.25, 0.0, "straining rope")
# the job: three fish
for k in range(3):
    sfx(flop(Q), fr(1279) + k * 0.12, 0.5, 0.2 - 0.2 * k)
sfx(ding(Q, 3136), fr(1283), 0.4, 0.0, "three fish")
# asleep
sfx(snore(Q), fr(1500), 0.6, 0.2, "snore"); sfx(snore(Q), fr(1500) + 1.9, 0.6, 0.2)
# the net in the water: little fish flips
for k in range(5):
    sfx(splash_small(Q) * 0.6, fr(1590) + k * 0.43, 0.35, Q.uniform(-0.4, 0.4))

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
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: One Fishing Net Explains It\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
