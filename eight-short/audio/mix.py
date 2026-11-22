# Sound for "The Bank That Wanted Eight of Everything": an original, cheeky little score for the bank (fingerpicked
# guitar + glockenspiel, a sneaky minor turn while the accounts pile up, everything drops out at the 2016 snap, a
# plain calm arp for the explanation, the theme resolved slowly over the golden ending) and synthesized SFX on the
# picture's cues (stamps, cards, cash bell, typing, the tower bursting, paper riffles, the fence clanging up).
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix as the other episodes: music -12 LU under the
# voice and ducked 3 dB under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from eight-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/eight/mix.wav)
import os, sys, json
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "genius-long", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, fades, modal, pan, place, integrated, true_peak, read_wav, write_wav, dbg, phase, smooth_noise
import instruments as I
import sfx_gen as S

FPS, TOTAL = 30, 1845          # must match finance-short/src/videos/eight/story.ts TOTAL
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
EIGHT = ["C5", "E5", "G5", None, "C6", "G5"]          # the bank's little fanfare
# hook: a tense plucked ostinato in A minor that the stamps ride on
T_SET = W("It's", line="set")
for k in range(int((T_SET - 0.2) / 0.3)):
    low(m("A1") if k % 4 < 2 else m("E2"), 0.12 + k * 0.3, 0.45, 0.35)
pad("Am", 0.1, T_SET, 0.22)
motif(W("fake"), ["E5", None, "C5"], 0.2, 0.32)
# Wells Fargo: the bright theme, glock fanfare on "eight"
for i, n in enumerate(chord("C", 3) + [m("C5")]):
    guitar(n, T_SET - 0.06 + i * 0.03, 0.55, 0.1, 1.8)
arp(T_SET + 0.1, W("Why", line="great"), ["C", "F", "G", "C"], 0.42, step=0.26)
motif(W("eight", line="set"), EIGHT, 0.14, 0.5)
# why eight: question turn, then the rhyme lands on a bright chord
arp(W("Why", line="great"), W("eight", 1, "great"), ["F", "G"], 0.36, step=0.28)
pad("C", W("eight", 1, "great"), W("Every", line="goal"), 0.26, att=0.2)
motif(W("great"), ["G5", "C6", "E6"], 0.1, 0.5)
# targets and daily numbers: a quick, busy march
arp(W("Every", line="goal"), W("Miss"), ["C", "G", "Am", "F"], 0.44, step=0.22)
for w in (W("targets"), W("daily")):
    glk(m("G5"), w, 0.38, 0.2)
glk(m("C6"), W("bonus"), 0.45, 0.3)
# miss it: a low thud and a minor chord
low(m("E1"), W("Miss"), 0.8, 0.9)
pad("Am", W("Miss"), W("So", line="never"), 0.3, att=0.1)
# the sneaky part: tiptoe minor arp, low and muted, getting a little busier with the tower
arp(W("So", line="never"), W("They", line="cards"), ["Am", "Dm", "E", "Am"], 0.36, step=0.3, bright=0.3)
arp(W("They", line="cards"), W("One", line="daily"), ["Dm", "Am", "E", "Am"], 0.38, step=0.26, bright=0.32)
for w in (W("cards", line="cards"), W("PINs"), W("email")):
    glk(m("E5"), w, 0.3, -0.2)
arp(W("One", line="daily"), W("In", line="snap") - 0.05, ["Am", "E"], 0.42, step=0.2, bright=0.4)
for i, w in enumerate((W("card", line="daily"), W("account", line="daily"), W("day"))):
    glk(m(["A5", "C6", "E6"][i]), w, 0.4, 0.1)
# the snap: everything drops to a held low pad; a hit on the collapse
T_SNAP = W("In", line="snap")
pad("Dm", T_SNAP, W("Luckily"), 0.3, att=0.05, octave=2)
low(m("D1"), T_SNAP, 0.9, 1.6)
low(m("D1"), fr(968), 1.0, 2.0)
# fired: a slow falling line
for i, n in enumerate(["A4", "G4", "F4", "E4"]):
    guitar(m(n), W("fired") - 0.9 + i * 0.32, 0.4, 0.15, 1.2, 0.35)
# luckily / unluckily
arp(W("Luckily"), W("Unluckily") - 0.1, ["C", "F"], 0.38, step=0.26)
glk(m("E6"), W("brand"), 0.4)
for i, n in enumerate(["C5", "B4", "A#4", "A4"]):
    put(I.pluck(F(m(n)), 0.5, R, 0.5, bright=0.6, pos=0.12), W("Unluckily") + 0.25 + i * 0.18, 0.8, 0.2)
low(m("F1"), W("fees"), 0.8, 1.2)
# why: calm, plain
arp(W("Why", line="why"), W("When", line="rule") - 0.1, ["F", "C", "G", "Am"], 0.32, step=0.34)
glk(m("A5"), W("planting"), 0.32)
arp(W("When", line="rule"), W("The", line="pay") - 0.1, ["Am", "F", "C", "G"], 0.32, step=0.34)
# consequence: serious, low, the fence clangs ride on it
pad("Dm", W("The", line="pay"), W("So", line="end"), 0.3, att=0.3, octave=2)
for w in (W("three", line="pay"), W("banned")):
    low(m("D1"), w, 0.8, 1.2)
# the end: the fanfare again, slow and resolved, last chord rings out
arp(W("So", line="end"), DUR - 1.2, ["F", "G", "C"], 0.32, step=0.36)
motif(W("eight", line="end"), ["C5", "E5", "G5"], 0.2, 0.42)
motif(W("grow"), ["G5", "E5", "C5"], 0.3, 0.42)
pad("C", W("grow") - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

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
    return np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.12) * 0.9 + lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.05) * 0.3


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
# ambience: street (birds, breeze, river) outside, a murmuring lobby inside, birds in the garden
for a, b in ((140, 274), (772, 830), (1040, 1288), (1557, TOTAL)):
    put(two(S.breeze(fr(b - a), Q, 0.3))[:, :ns(fr(b - a))], fr(a), 0.5, 0.0, SF)
    put(two(S.bird_chirps(fr(b - a), Q, 0.25, "sparrow"), 0.3), fr(a), 0.16, 0.0, SF)
put(two(S.water_bed(fr(134), Q, close=0.3))[:, :ns(fr(134))] * 0.3, fr(140), 1.0, 0.0, SF)
put(two(S.babble(fr(134), Q, 150, 1.1), 0.2), fr(140), 0.14, 0.0, SF)
for a, b in ((0, 140), (396, 772), (830, 1040), (1421, 1557)):
    put(two(S.babble(fr(b - a), Q, 140, 1.15), -0.15), fr(a), 0.07, 0.0, SF)
put(two(S.bird_chirps(fr(133), Q, 0.4, "sparrow"), -0.2), fr(1288), 0.3, 0.0, SF)
for f0 in (140, 274, 396, 497, 583, 690, 772, 830, 912, 1040, 1112, 1288, 1421, 1557, 1703):
    sfx(swish(Q, 0.3), fr(f0) - 0.1, 0.22, Q.uniform(-0.4, 0.4))
# 1 the hook: stamps; a card ticks onto the tower
for h in (6, 24, 42, 58, 74, 90, 106, 122, 136):
    sfx(stamp(Q), fr(h), 0.7, -0.15)
CUES.append((fr(6), "stamps (nine)"))
for h in (30, 64, 98, 130):
    sfx(tick(Q), fr(h), 0.5, 0.2)
# 2 the street; the gold 8 gleams
for k in range(6):
    for j in range(6):
        sfx(S.stroll_step(Q, 0.4), fr(150) + k * 0.13 + j * 0.62, 0.12, -0.6 + 0.24 * k)
sfx(ding(Q, 3136), fr(252), 0.6, 0.1, "the gold 8 gleams")
sfx(ding(Q, 4186), fr(258), 0.3, -0.1)
# 3 "great": the frame sparkles
sfx(ding(Q, 2637), fr(371), 0.5, -0.2, "eight rhymed with great")
# 4 the manager taps the board; the badges pop
sfx(knock(Q), fr(419), 0.8, 0.3, "taps the board"); sfx(knock(Q), fr(423), 0.6, 0.3)
for k in range(4):
    sfx(pop_small(Q, 700 + 60 * k), fr(468 + 3 * k), 0.4, -0.4 + 0.25 * k)
CUES.append((fr(468), "daily-number badges"))
# 5 bonus / glare
sfx(swish(Q, 0.25), fr(512), 0.35, -0.2)
sfx(till(Q), fr(521), 0.7, -0.2, "bonus (cash bell)")
sfx(thud(Q, 55), fr(540), 0.5, 0.2, "the glare")
# 6 typing; a blip for every new account
sfx(typing(2.8, Q), fr(604), 0.35, 0.2, "typing")
for k in range(4):
    sfx(blip(Q), fr(600 + 22 * k), 0.35, 0.25)
for j in range(8):
    sfx(S.stroll_step(Q, 0.3), fr(606) + j * 0.5, 0.25, -0.1 - 0.06 * j)
# 7 cards into envelopes; PIN and email screens
for d in (698, 712, 726, 740, 754):
    sfx(tick(Q, 1800), fr(d + 5), 0.5, -0.1)
sfx(blip(Q, 990), fr(728), 0.4, 0.3, "PIN screen"); sfx(blip(Q, 1180), fr(754), 0.4, 0.3, "email screen")
# 8 the envelope on the doormat
sfx(S.whoosh(0.3, Q, peak=0.25), fr(776), 0.3, -0.2)
sfx(plop(Q, 260), fr(786), 0.5, 0.0, "envelope lands on the mat")
sfx(pop_small(Q, 500), fr(806), 0.35, 0.1)
# 9 the tower grows; the calendar riffles
for g in (834, 855, 868, 886, 902):
    sfx(tick(Q), fr(g), 0.55, 0.15); sfx(tick(Q, 3200), fr(g) + 0.06, 0.4, 0.15)
sfx(riffle(1.1, Q), fr(872), 0.45, -0.3, "calendar pages flip")
for k in range(9):
    sfx(stamp(Q), fr(838 + 14 * k), 0.45, 0.25)
# 10 the inspectors, the burst
for k in range(2):
    for j in range(6):
        sfx(S.stroll_step(Q, 0.5), fr(912 + 6 * k) + j * 0.5, 0.3, -0.5 + 0.2 * k)
sfx(thud(Q, 48), fr(968), 0.9, 0.0); sfx(clatter(Q), fr(968), 0.9, 0.0, "the card tower bursts")
# 11 fired: slow steps down the steps
for k in range(3):
    for j in range(7):
        sfx(S.stroll_step(Q, 0.6), fr(1052 + 17 * k) + j * 0.55, 0.3, -0.3 + 0.3 * k)
CUES.append((fr(1052), "tellers walk out with boxes"))
# 12 the present and the bill
sfx(tear(Q), fr(1152), 0.5, 0.2, "envelope torn open")
sfx(ding(Q, 3520), fr(1160), 0.45, 0.2); sfx(ding(Q, 4186), fr(1168), 0.25, 0.2)
sfx(unroll(1.8, Q), fr(1206), 0.6, 0.1, "the bill unrolls")
sfx(thud(Q, 80), fr(1262), 0.6, 0.0, "fees")
# 13 the garden
sfx(plop(Q, 300), fr(1318), 0.6, -0.2, "weed pulled")
sfx(S.clink(Q, 2900), fr(1344), 0.6, -0.1, "coin"); sfx(ding(Q, 3951), fr(1344), 0.25, -0.1)
sfx(plop(Q, 200), fr(1372), 0.5, 0.2, "weed planted")
sfx(S.clink(Q, 3100), fr(1402), 0.6, -0.1); sfx(ding(Q, 3951), fr(1402), 0.25, -0.1)
# 14 hearts
for k in range(5):
    sfx(pop_small(Q, 900 + 100 * (k % 3)), fr(1432 + 26 * k), 0.25, -0.3 + 0.15 * k)
# 15 the cheque; the fence clangs up all around
sfx(S.whoosh(0.4, Q, peak=0.3), fr(1584), 0.35, 0.0); sfx(ding(Q, 2637), fr(1590), 0.5, 0.0, "the cheque")
for k in range(10):
    sfx(clank(Q), fr(1646) + 0.055 * k * k ** 0.3, 0.55 * (1 - 0.06 * k), -0.5 + 0.11 * k)
CUES.append((fr(1646), "the fence slams up"))
# 16 the crane up: a soft wind swell
sfx(S.whoosh(2.4, Q, peak=0.5, f_lo=200, f_hi=1200), fr(1745), 0.25, 0.0, "crane up")

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "eight"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: The Bank That Wanted Eight of Everything\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
