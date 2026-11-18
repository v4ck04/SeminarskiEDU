# Sound for "One Basket Explains It" (money-parable series, episode 2): the folk score of the net episode (same key,
# same glockenspiel theme) re-cut to this story, synthesized SFX on the word cues of the picture, a river bed under it.
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix: music -12 LU under the voice and ducked 3 dB
# under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from basket-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/basket/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1450
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
THEME = ["D5", "F#5", "A5", None, "B5", "A5"]
# hook: the lonely low pulse on B minor of the series, the glock asks the question
for k in range(int(3.0 / (2 * B))):
    low(m("B1"), 0.15 + k * 2 * B, 0.5)
pad("Bm", 0.1, W("One", line="basket"), 0.25)
motif(0.9, ["F#5", None, "D5", None, "E5"], 0.3, 0.35)
# "one basket explains it": the bright strum and the series theme
T_B = W("basket", line="basket")
for i, n in enumerate(chord("D", 3) + [m("D4") + 12]):
    guitar(n, T_B - 0.08 + i * 0.03, 0.6, 0.1, 1.8)
motif(T_B, THEME, 0.18, 0.45)
# the three men: warm fingerpicking in D
T_SET = W("Three", line="set")
arp(T_SET, W("The", line="boat"), ["D", "G", "A", "D", "Bm", "G"])
motif(T_SET + 0.1, ["A5", None, "F#5", "G5", "A5"], 0.3, 0.3)
# the new boat: quicker, brighter, a little too pleased with itself; then the borrowing turns it
arp(W("The", line="boat"), W("So", line="boat"), ["D", "G", "D", "A"], 0.44, step=0.22, octave=3)
motif(W("boat", line="boat"), ["A5", "B5", "D6"], 0.12, 0.42)
for i, n in enumerate(["D5", "C#5", "B4", "A#4"]):
    put(I.pluck(F(m(n)), 0.5, R, 0.5, bright=0.6, pos=0.12), W("borrows") + i * 0.16, 0.8, 0.2)
# the holes: minor, slower, a falling glock on "half"
pad("Bm", W("And", line="hole"), W("So", line="work"), 0.26)
arp(W("And", line="hole") + 0.3, W("So", line="work"), ["Bm", "G", "Em", "F#m"], 0.32, step=0.34)
motif(W("half"), ["F#5", None, "E5", None, "D5"], 0.3, 0.32)
# evening, he fishes on: a low pulse that won't stop; a sting on each new hole
for k in range(int((W("The", line="care") - W("So", line="work")) / (2 * B))):
    low(m("B1") if k % 4 < 2 else m("G1"), W("So", line="work") + k * 2 * B, 0.55)
pad("Em", W("So", line="work"), W("The", line="p2") - 0.2, 0.24)
for w, n in ((W("Borrows"), "C6"), (W("More"), "C#6"), (W("holes", line="work"), "D6")):
    glk(m(n), w, 0.4, 0.3)
# the holes don't care: everything thins to one held chord
pad("Em", W("The", line="care"), W("The", line="p2"), 0.3)
low(m("E2"), W("The", line="care"), 0.6, 1.4)
# the second man: calm and plain; one pluck for each of slow, safe, boring
arp(W("The", line="p2"), W("Slow") - 0.1, ["G", "D", "A", "D"], 0.3, step=0.36)
for w, n in ((W("Slow"), "D4"), (W("Safe"), "D4"), (W("Boring"), "A3")):
    guitar(m(n), w, 0.5, -0.1, 1.2)
# the third man: brighter, going somewhere
arp(W("The", line="p3"), W("Need") - 0.15, ["D", "A", "Bm", "G", "D", "A"], 0.4)
glk(m("A5"), W("full"), 0.45)
# "need another loan?": the music stops; two sly pizzicato notes
for i, n in enumerate(["A4", "E5"]):
    put(I.pluck(F(m(n)), 0.6, R, 0.3, bright=0.75, pos=0.1), W("another") + i * 0.22, 0.8, -0.2)
# the twist: a hit on the flash, then the theme comes back bouncing
T_TW = fr(1059)
put(I.timpani(F(m("D2")), 0.8, R, 2.2), T_TW - 0.02, 0.8)
put(I.cymbal(0.45, R, 2.2), T_TW - 0.02, 0.3)
for i, n in enumerate(chord("D", 3) + chord("D", 4)):
    guitar(n, T_TW + i * 0.025, 0.6, 0.0, 2.0)
arp(T_TW + 0.3, W("One", line="lesson") - 0.1, ["D", "A", "G", "A", "D", "A", "Bm", "A"], 0.42, step=0.26, octave=3)
motif(W("lands"), THEME, 0.18, 0.4)
# the lesson: three slow steps, one per man
for w, c in ((W("paid"), "Bm"), (W("avoided"), "G"), (W("collected"), "D")):
    pad(c, w - 0.1, w + 1.2, 0.28)
    guitar(chord(c, 3)[0], w - 0.1, 0.55, -0.1, 1.6)
# the end: the theme resolved on D, held to the last frame
T_END = W("So", line="end")
arp(T_END, DUR - 1.0, ["G", "A", "D"], 0.34, step=0.36)
motif(W("underneath"), ["D5", "F#5", "A5", "D6"], 0.24, 0.45)
pad("D", W("underneath") - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

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
put(two(S.bird_chirps(fr(1232), Q, 0.25, "sparrow"), 0.4), 0.0, 0.18, 0.0, SF)
# cut swishes
for f0 in (97, 141, 285, 362, 394, 468, 561, 669, 733, 891, 980, 1026, 1157, 1232, 1266, 1292, 1327):
    sfx(swish(Q, 0.35), fr(f0) - 0.1, 0.25, Q.uniform(-0.4, 0.4))
# hook: fish slipping out and slapping on the boards
for d in (16, 28, 40, 51, 61, 70):
    sfx(flop(Q), fr(d + 7), 0.45, 0.2)
CUES.append((fr(16), "hook: fish fall out of the basket"))
sfx(ding(Q, 2637), fr(102), 0.6, 0.2, "the whole basket shown")
for k in range(3):
    sfx(pop_small(Q), fr(254 + 3 * k), 0.3, -0.4 + 0.4 * k)
# the boat
sfx(splash_small(Q), fr(317), 0.6, -0.1, "the boat appears"); sfx(ding(Q, 3136), fr(318), 0.35, -0.1)
sfx(S.whoosh(0.4, Q, peak=0.3), W("Now") - 0.15, 0.4, 0.0, "now")
for k in range(3):
    sfx(splash_small(Q) * 0.5, fr(366) + k * 0.6, 0.3, Q.uniform(-0.3, 0.3))
sfx(ding(Q, 2349), fr(371), 0.4, 0.2, "borrows")
# the hole
sfx(rip(Q), fr(431), 0.8, 0.2, "a hole tears open"); sfx(pop_small(Q), fr(433), 0.4, 0.2)
for d in (446, 459):
    sfx(flop(Q), fr(d + 7), 0.45, 0.2)
# the walk home: steps on the boards, fish slapping down behind him
for k in range(9):
    sfx(S.stroll_step(Q, 0.4), fr(474) + k * 0.24, 0.3, -0.2 + 0.05 * k)
for d in (482, 491, 500, 509, 518, 527):
    sfx(flop(Q), fr(d + 6), 0.35, -0.1)
CUES.append((fr(474), "the walk home, a fish trail"))
# evening: line in, more holes, fish slipping out of the basket
sfx(plop(Q), fr(563), 0.35, 0.3, "line in")
for g in (599, 641, 645):
    sfx(rip(Q), fr(g) - 0.05, 0.7, 0.25, "another hole")
for k, d in enumerate(range(580, 669, 11)):
    sfx(flop(Q), fr(d + 5), 0.3, 0.25)
for k in range(8):
    sfx(S.creak(0.12, Q, 300, 420, scale=0.3), fr(578 + k * 8), 0.12, -0.1)
# the holes don't care: dripping fish
for d in range(672, 733, 6):
    sfx(flop(Q) * 0.6, fr(d + 7), 0.22, 0.2)
# the second man: the fish into the barrel; slow, safe, boring
sfx(S.whoosh(0.35, Q, peak=0.3), fr(812), 0.35, 0.2, "fish tossed")
sfx(thunk(Q), fr(826), 0.6, 0.25, "into the barrel")
for g in (844, 859, 871):
    sfx(pop_small(Q), fr(g), 0.3, 0.25)
# the third man: the full barrel, the walk over
sfx(ding(Q, 2637), fr(967), 0.45, 0.25, "barrel full")
for k in range(6):
    sfx(S.stroll_step(Q, 0.4), fr(984) + k * 0.26, 0.28, 0.35 - 0.1 * k)
# the bubble
sfx(pop_small(Q), fr(1029), 0.55, -0.2, "need another loan?")
# the twist: every fish lands in his basket
for k, d in enumerate(range(1064, 1157, 6)):
    sfx(thunk(Q), fr(d + 6), 0.3, 0.1)
    if k % 4 == 3:
        sfx(ding(Q, 3136), fr(d + 6), 0.15, 0.2)
CUES.append((fr(1070), "fish land in the third man's basket"))
# a basket under every hole in town: a pop and a rising ding each
for k, g in enumerate((1175, 1186, 1196, 1204, 1212)):
    sfx(pop_small(Q), fr(g), 0.4, -0.5 + 0.25 * k)
    sfx(ding(Q, [2349, 2637, 2960, 3136, 3520][k]), fr(g), 0.22, -0.5 + 0.25 * k)
CUES.append((fr(1175), "baskets pop in under the row"))
# the end: fish keep landing in the basket underneath, softly
for d in range(1330, 1450, 7):
    sfx(thunk(Q) * 0.7, fr(d + 6), 0.2, 0.1)

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "basket"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: One Basket Explains It\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
