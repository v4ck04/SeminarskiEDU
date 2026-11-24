# Sound for "The City That Paid for Rat Tails": an original score (a sneaky pizzicato rat theme, a proud colonial
# march for the plan, a dark hush for the plague, a comic bounce for the snip, a wry resolve with the top-hat rat)
# and SFX on the picture's cues. Library effects (sfx-library/): whooshes on the cuts, the reveal sting on the
# flash, the boom under CANCELLED, the counter roll, chimes, pops, the error buzz. Synthesized: squeaks, scurrying
# feet, the manhole lid scrape, sewer drips, stamps, coins, the cash bell, scissors, chalk, a cobra hiss.
# Mix as the other episodes: music -12 LU under the voice and ducked 3 dB under words, SFX -15 LU,
# master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from rats-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/rats/mix.wav)
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

FPS, TOTAL = 30, 1880          # must match finance-short/src/videos/rats/story.ts TOTAL
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
    put(I.pluck(F(midi), vel, R, 0.35, bright=0.7, pos=0.1), t, 0.9, p)


def sneak(t0, t1, root="A", step=0.22, vel=0.45):
    """the rat theme: a tiptoeing minor bass line with a chromatic slide, pizzicato"""
    seq = ["A2", "C3", "E3", "D#3", "E3", "C3", "B2", "G#2"] if root == "A" else ["D2", "F2", "A2", "G#2", "A2", "F2", "E2", "C#2"]
    t, k = t0, 0
    while t < t1 - 0.02:
        pizz(m(seq[k % 8]), t, vel * (1.0 if k % 4 == 0 else 0.7), -0.1)
        t += step; k += 1


# hook: the rat theme
sneak(0.1, W("This", line="hanoi") - 0.05)
motif(W("more", line="hook"), ["E5", "A5", "C6"], 0.1, 0.42)
# Hanoi, the new quarter: a proud colonial march in C
arp(W("This", line="hanoi"), W("The", line="highway"), ["C", "G", "F", "C"], 0.4, step=0.24)
glk(m("G5"), W("sewers", line="hanoi"), 0.35)
# the sewers as a rat highway: the rat theme, faster
sneak(W("The", line="highway"), W("And", line="plague"), step=0.17, vel=0.5)
# the plague: a dark hush
pad("Dm", W("And", line="plague"), W("So", line="hire"), 0.3, att=0.3, octave=2)
low(m("D1"), W("plague", line="plague"), 0.7, 1.6)
# the hunt: the march again, busy
arp(W("So", line="hire"), W("But", line="tail"), ["C", "F", "G", "C"], 0.44, step=0.2)
motif(W("twenty"), ["C5", "E5", "G5", "C6"], 0.09, 0.45)
# the tails: march in a lighter key
arp(W("But", line="tail"), W("Then", line="notail") - 0.05, ["F", "C", "G", "C"], 0.36, step=0.26)
# the snap: silence, then the rat theme creeping back
sneak(W("strange") + 0.4, W("The", line="snip"), step=0.26, vel=0.4)
# the snip: comic bounce
sneak(W("The", line="snip"), W("Inspectors"), root="D", step=0.2, vel=0.5)
for i, n in enumerate(["A5", "E5"]):
    glk(m(n), W("cutting") + 0.2 + i * 0.12, 0.4)
# the farm: rustic, slow
arp(W("Inspectors"), W("The", line="cancel"), ["Am", "Em", "Am", "Em"], 0.3, step=0.34, bright=0.35)
# cancelled: the plague came anyway
low(m("A1"), W("cancelled"), 0.8, 1.4)
pad("Am", W("cancelled"), W("Economists"), 0.28, att=0.2, octave=2)
# the cobra effect: curious, a loop
arp(W("Economists"), W("Hanoi", line="twist") - 0.05, ["Am", "F", "C", "G"], 0.32, step=0.3, bright=0.4)
# the twist: the rat theme in major, a wry last chord
sneak(W("Hanoi", line="twist"), DUR - 1.4, step=0.24, vel=0.45)
motif(W("business"), ["C5", "E5", "A5"], 0.18, 0.45)
pad("Am", W("business") - 0.1, DUR - 0.05, 0.3, att=0.4, rel=1.2)

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


def squeak(r, f0=None):
    """a little rat squeak: a fast up-down chirp"""
    f0 = f0 or r.uniform(2600, 3600); d = r.uniform(0.08, 0.16); t = tt(d)
    f = f0 * (1 + 0.35 * np.sin(np.pi * t / d))
    return fades(np.sin(phase(f)) * np.sin(np.pi * t / d) ** 0.6 * 0.35, 0.002, 0.02)


def scurry(dur, r, rate=28):
    """tiny claws on stone"""
    y = np.zeros(ns(dur + 0.1)); t = 0.0
    while t < dur:
        c = bp(r.standard_normal(ns(0.02)), 2500, 9000, 1) * np.exp(-tt(0.02) / 0.004) * r.uniform(0.2, 0.6)
        S._place_mono(y, c, t); t += r.uniform(0.5, 1.5) / rate
    return y


def scrape(r, dur=0.6):
    """the iron manhole lid dragged over the road"""
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), 300, 2500, 1) * (0.6 + 0.4 * np.sin(TAU * 13 * t)) * 0.5
    y += modal(dur, [(520, 0.4, 0.3), (1340, 0.2, 0.2)], r) * 0.4
    return fades(y, 0.02, 0.12)


def drip(r):
    t = tt(0.25)
    return fades(np.sin(phase(900 * (1 + 0.8 * (t / 0.25)))) * np.exp(-t / 0.04) * 0.4, 0.0005, 0.05)


def snip(r):
    y = np.zeros(ns(0.2))
    for k in range(2):
        c = bp(r.standard_normal(ns(0.03)), 3000, 10000, 1) * np.exp(-tt(0.03) / 0.004) * 0.7
        S._place_mono(y, c, k * 0.06)
    return y


def chalk(dur, r):
    t = tt(dur)
    return fades(bp(r.standard_normal(len(t)), 2500, 7000, 1) * (0.5 + 0.5 * np.abs(np.sin(TAU * 3.2 * t))) * 0.25, 0.02, 0.05)


def hiss(r, dur=0.9):
    t = tt(dur)
    return fades(hp(r.standard_normal(len(t)), 4000) * 0.35, 0.05, 0.3)


def coin(r):
    return modal(0.6, [(3200, 1.0, 0.25), (4700, 0.6, 0.15), (6100, 0.3, 0.1)], r) * 0.3


# ambience: street air, the sewer drone, farm crickets
for a, b2 in ((0, 310), (592, 722), (1015, 1157), (1452, 1561), (1737, TOTAL)):
    put(two(S.breeze(fr(b2 - a), Q, 0.35))[:, :ns(fr(b2 - a))], fr(a), 0.45, 0.0, SF)
for a, b2 in ((310, 396), (1157, 1316)):
    put(two(lp(S.breeze(fr(b2 - a), Q, 0.5), 400))[:, :ns(fr(b2 - a))], fr(a), 0.7, 0.0, SF)
    for k in range(int(fr(b2 - a) / 0.7)):
        sfx(drip(Q), fr(a) + 0.3 + k * 0.7 + Q.uniform(0, 0.3), 0.25, Q.uniform(-0.6, 0.6))
put(two(S.crickets(fr(136), Q)), fr(1316), 0.3, 0.0, SF)
put(two(S.bird_chirps(fr(155), Q, 0.25, "sparrow"), 0.3), fr(155), 0.14, 0.0, SF)
for i, f0 in enumerate((310, 396, 470, 592, 722, 838, 1157, 1316, 1452, 1561)):
    lib(["whoosh_soft", "whoosh_smooth", "swipe_tech"][i % 3], fr(f0), 0.28, Q.uniform(-0.3, 0.3), peak=True)
lib("whoosh_heavy", fr(155), 0.35, 0.0, "hook flash", peak=True)
lib("whoosh_airy", fr(1737), 0.3, 0.0, "back to the top-hat rat", peak=True)
# 1 the boss rat counts coins; the crowd
for k in range(6):
    sfx(coin(Q), fr(20 + 14 * k), 0.4, 0.2)
sfx(squeak(Q), fr(92), 0.5, 0.1, "boss rat squeak")
sfx(scurry(1.6, Q), fr(108), 0.6, 0.0, "the crowd of rats")
for k in range(5):
    sfx(squeak(Q), fr(112) + k * 0.23, 0.35, Q.uniform(-0.6, 0.6))
# 2 the manhole lid
sfx(scrape(Q), fr(262), 0.7, -0.2, "manhole lid slides open")
# 3 the sewer highway
sfx(scurry(2.8, Q, rate=40), fr(312), 0.7, 0.0, "rats stampede through the sewer")
for k in range(6):
    sfx(squeak(Q), fr(320) + k * 0.4, 0.3, Q.uniform(-0.5, 0.5))
# 4 the bathroom
lib("pop_bubble", fr(412), 0.5, 0.0, "rat pops out of the drain"); sfx(squeak(Q, 3000), fr(418), 0.5, 0.0)
lib("sting_reveal", fr(420), 0.25, 0.0); sfx(swish(Q), fr(428), 0.4, -0.2, "the lady jumps on the chair")
sfx(knock(Q), fr(437), 0.5, -0.2)
# 5 the plague map
lib("impact_subtle", fr(479), 0.4, 0.0, "plague spreads on the map")
# 6 workers go down, paid
for k in range(2):
    for j in range(4):
        sfx(S.stroll_step(Q, 0.5), fr(570 + 46 * k) + j * 0.35, 0.2, 0.1)
    sfx(knock(Q), fr(598 + 46 * k) + 0.5, 0.25, 0.0)
sfx(till(Q), fr(679), 0.45, 0.2, "paid for every rat")
# 7 the count rolls to 20,114; stamps
lib("tick_roll", fr(752), 0.35, 0.0, "the rat counter rolls")
for k in range(3):
    sfx(stamp(Q), fr(781 + 10 * k), 0.6, -0.1)
lib("chime_success", fr(817), 0.4, 0.0, "20,114")
# 8 tails, one cent
lib("pop_ui", fr(959), 0.4, 0.0, "the bounty sign"); sfx(till(Q), fr(980), 0.45, 0.1, "one cent per tail")
for k in range(4):
    sfx(coin(Q), fr(990 + 6 * k), 0.3, 0.2)
# 9 the snap: something strange
lib("sting_reveal", fr(1057), 0.45, 0.0, "flash: something strange"); lib("riser", fr(1057), 0.2, 0.0, peak=True)
sfx(scurry(1.2, Q), fr(1068), 0.45, 0.2); sfx(scurry(0.9, Q), fr(1128), 0.45, -0.2)
sfx(squeak(Q, 2900), fr(1120), 0.45, 0.0, "the tailless rat looks up")
lib("buzz_error", fr(1133), 0.15, 0.0, "no tails")
# 10 the snip, the release, the wave
sfx(snip(Q), fr(1203), 0.8, 0.0, "snip"); lib("pop_ui", fr(1206), 0.3, 0.0)
sfx(scurry(1.0, Q), fr(1232), 0.5, 0.2); sfx(squeak(Q, 3300), fr(1266), 0.5, 0.0, "the rat waves")
# 11 the farm
for k in range(5):
    sfx(squeak(Q), fr(1330) + k * 0.6, 0.25, Q.uniform(-0.6, 0.6))
lib("ding", fr(1397), 0.3, 0.0, "the inspector sees the farm")
# 12 CANCELLED; eyes in the drains
sfx(stamp(Q), fr(1470), 0.8, 0.0, "CANCELLED stamp"); lib("boom", fr(1470), 0.35, 0.0)
lib("click_shutter", fr(1514), 0.2, 0.3, "eyes in the drains")
# 13 chalk, the cobra
sfx(chalk(1.4, Q), fr(1600), 0.4, 0.1, "chalk"); sfx(chalk(1.2, Q), fr(1650), 0.4, 0.1)
sfx(hiss(Q), fr(1619), 0.35, 0.3, "cobra hiss")
# 14 the hat tip, coins
sfx(swish(Q), fr(1795), 0.35, 0.0, "hat tip"); lib("chime_success", fr(1813), 0.3, 0.0)
for k in range(3):
    sfx(coin(Q), fr(1818 + 5 * k), 0.35, 0.2)
sfx(scurry(1.3, Q), fr(1840), 0.5, 0.0)

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "rats"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: The City That Paid for Rat Tails\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
