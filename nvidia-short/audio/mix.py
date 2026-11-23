# Sound for "Eleven Days Without Jensen": an original score (a driving minor pulse on the market, a held low pad
# when he steps down, a tense tiptoe through the scandal, everything drops out before the vote, a bright major
# comeback, a warm resolve over the golden ending) and SFX on the
# picture's cues. Recorded / produced effects come from the project's sound library (sfx-library/, catalog.json):
# whooshes on the cuts, the riser into the snap, the low sting and the boom, chimes, pops, typing, card slides,
# the counter roll under the fee bill, the comic 'denied' buzz. Synthesized ones fill what the library has not
# got (stamps, the cash bell, the board knock, steps, paper riffles and tearing, the card clatter, metal clanks).
# Reuses the instrument / effect / DSP code of genius-long/audio. Mix as the other episodes: music -12 LU under the
# voice and ducked 3 dB under words, SFX -15 LU, master -14 LUFS with a true-peak ceiling of -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from eight-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/nvidia/mix.wav)
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

FPS, TOTAL = 30, 2230          # must match finance-short/src/videos/nvidia/story.ts TOTAL
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
T_SET = W("Jensen", line="set")
# hook: a driving A-minor pulse on the trading floor, lifting to C major when the chart jumps
for k in range(int(W("jumped") / 0.25)):
    low(m("A1") if k % 4 < 2 else m("E2"), 0.1 + k * 0.25, 0.42, 0.3)
pad("Am", 0.05, W("jumped"), 0.22)
arp(W("jumped") - 0.05, T_SET - 0.1, ["C", "G"], 0.44, step=0.2)
motif(W("jumped"), ["C5", "E5", "G5", "C6"], 0.1, 0.45)
# the keynote: warm and proud
arp(T_SET, W("And", line="quit"), ["F", "C", "G", "Am"], 0.36, step=0.3)
glk(m("E5"), W("jacket"), 0.35)
# he steps down: everything drops to a held low pad
low(m("A1"), W("down"), 0.8, 2.0)
pad("Am", W("down") - 0.1, W("Reports"), 0.3, att=0.05, octave=2)
# the scandal: a tense tiptoe
arp(W("Reports"), W("Without"), ["Am", "Dm", "E", "Am"], 0.32, step=0.3, bright=0.3)
for w in (W("China", line="spy"), W("denied"), W("FBI"), W("Congress")):
    low(m("E1"), w, 0.5, 0.6)
# the fall
arp(W("Without"), W("Fans"), ["Dm", "Am", "E", "E"], 0.36, step=0.26, bright=0.32)
for i, n in enumerate(["A4", "G4", "F4", "E4"]):
    guitar(m(n), W("lowest") + i * 0.3, 0.4, 0.15, 1.1, 0.35)
# the petition: hopeful, small
arp(W("Fans"), W("The", line="no"), ["F", "C"], 0.32, step=0.3)
pad("Dm", W("The", line="no"), W("Then", line="snap"), 0.3, att=0.1, octave=2)
# the vote: a riser, silence, then the comeback in C major
arp(W("Then", line="snap"), W("unanimously"), ["Am", "F"], 0.3, step=0.22, bright=0.3)
for i, n in enumerate(chord("C", 3) + [m("C5"), m("E5")]):
    guitar(n, W("unanimously") + i * 0.03, 0.55, 0.1, 1.8)
arp(W("unanimously") + 0.3, W("Luckily"), ["C", "G", "F", "C"], 0.44, step=0.2)
motif(W("job"), ["G5", "C6", "E6"], 0.1, 0.45)
# luckily / unluckily
arp(W("Luckily"), W("Unluckily") - 0.1, ["C", "F"], 0.36, step=0.26)
for i, n in enumerate(["C5", "B4", "A#4", "A4"]):
    put(I.pluck(F(m(n)), 0.5, R, 0.5, bright=0.6, pos=0.12), W("Unluckily") + 0.25 + i * 0.18, 0.8, 0.2)
# the explanation: calm
arp(W("Why", line="why"), W("By", line="lunch") - 0.1, ["F", "C", "G", "Am"], 0.3, step=0.34)
glk(m("A5"), W("plan"), 0.35)
# by lunch: the comeback theme, bigger
arp(W("By", line="lunch"), W("Eleven", line="end"), ["C", "G", "Am", "F"], 0.46, step=0.2)
motif(W("trillion"), ["C5", "E5", "G5", "C6", "E6"], 0.1, 0.45)
# the end: slow and warm
arp(W("Eleven", line="end"), DUR - 1.2, ["F", "G", "C"], 0.32, step=0.36)
motif(W("jacket", 1), ["G5", "E5", "C5"], 0.3, 0.42)
pad("C", W("jacket", 1) - 0.1, DUR - 0.05, 0.32, att=0.4, rel=1.2)

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


# ambience: a busy trading floor, a murmuring hall, a quiet boardroom, the plaza outside, a restaurant
for a, b2, g in ((0, 195, 0.12), (472, 680, 0.06), (812, 998, 0.1), (1520, 1694, 0.08), (1862, 2015, 0.14)):
    put(two(S.babble(fr(b2 - a), Q, 150, 1.2), 0.1), fr(a), g, 0.0, SF)
put(two(S.babble(fr(203), Q, 140, 1.1), -0.1), fr(195), 0.07, 0.0, SF)
put(two(S.babble(fr(168), Q, 160, 1.15), 0.1), fr(1694), 0.09, 0.0, SF)
for a, b2 in ((998, 1205), (2015, TOTAL)):
    put(two(S.breeze(fr(b2 - a), Q, 0.3))[:, :ns(fr(b2 - a))], fr(a), 0.5, 0.0, SF)
    put(two(S.bird_chirps(fr(b2 - a), Q, 0.25, "sparrow"), 0.3), fr(a), 0.16, 0.0, SF)
for i, f0 in enumerate((398, 472, 680, 812, 1136, 1205, 1350, 1520)):
    lib(["whoosh_soft", "whoosh_smooth", "swipe_tech"][i % 3], fr(f0), 0.3, Q.uniform(-0.3, 0.3), peak=True)
for f0 in (998, 1694, 1862):
    lib("whoosh_airy", fr(f0), 0.28, 0.0, peak=True)
lib("whoosh_heavy", fr(195), 0.35, 0.0, "hook flash", peak=True)
lib("whoosh_airy", fr(2015), 0.3, 0.0, "into the golden ending", peak=True)
# 1 the chart jumps
lib("riser", fr(115), 0.35, 0.0, "riser into the jump", peak=True)
lib("boom", fr(115), 0.4, 0.0, "the chart jumps"); lib("chime_success", fr(120), 0.35, 0.2)
lib("tick_roll", fr(118), 0.3, -0.2)
# 2 the keynote: applause, the jacket
put(two(S.applause(2.4, Q, 40), 0.0), fr(200), 0.25, 0.0, SF); CUES.append((fr(200), "applause in the hall"))
lib("ding", fr(331), 0.3, 0.1, "leather jacket")
# 3 he steps down: the lights go out
lib("sting_reveal", fr(445), 0.5, 0.0, "he stepped down (low sting)")
sfx(thud(Q, 45), fr(445), 0.4, 0.0)
# 4 the papers fly in, the stamp
for k, f0 in enumerate((478, 547, 648)):
    lib("card_slide", fr(f0), 0.45, -0.3 + 0.3 * k, "newspaper flies in" if k == 0 else None)
sfx(stamp(Q), fr(658), 0.7, 0.0, "DENIED stamp"); lib("impact_subtle", fr(658), 0.4, 0.0)
# 5 the door, the steps, the questions
lib("click_mouse", fr(684), 0.4, -0.4, "boardroom door")
for k, f0 in enumerate((688, 696, 711, 719)):
    for j in range(5):
        sfx(S.stroll_step(Q, 0.4), fr(f0) + j * 0.45, 0.22, -0.4 + 0.15 * k)
for k in range(6):
    lib("pop_ui", fr(755 + 4 * k), 0.25, -0.3 + 0.12 * k)
# 6 the fall, the scissors
lib("whoosh_heavy", fr(850), 0.25, 0.0, peak=True)
for k in range(5):
    lib("click_shutter", fr(950) + k * 0.2, 0.3, 0.2)
CUES.append((fr(950), "scissors"))
lib("card_slide", fr(981), 0.45, 0.2, "the price target cut in half"); lib("impact_subtle", fr(981), 0.35, 0.2)
# 7 the petition, the counter
lib("tick_roll", fr(1080), 0.3, 0.0); lib("tick_roll", fr(1090), 0.3, 0.0)
lib("pop_bubble", fr(1102), 0.45, 0.0, "170,000+"); lib("chime_success", fr(1104), 0.3, 0.0)
# 8 the door shuts
lib("buzz_error", fr(1150), 0.15, 0.0, "not considering it (denied buzz)")
sfx(thud(Q, 60), fr(1178), 0.45, 0.0, "the door shuts")
# 9 the vote, the door bursts open
lib("riser", fr(1270), 0.35, 0.0, peak=True)
lib("boom", fr(1276), 0.45, 0.0, "unanimously (flash)")
for k in range(4):
    lib("pop_ui", fr(1268 + 3 * k), 0.3, -0.3 + 0.2 * k)
lib("whoosh_heavy", fr(1309), 0.3, -0.3, "the door bursts open", peak=True)
for j in range(6):
    sfx(S.stroll_step(Q, 0.4), fr(1314) + j * 0.42, 0.26, -0.3)
# 10 the phone rings; the notes
for k in range(3):
    lib("ding", fr(1355) + k * 0.45, 0.3, 0.2)
CUES.append((fr(1355), "phone rings"))
lib("click_mouse", fr(1385), 0.35, 0.2, "picks up")
sfx(riffle(1.2, Q), fr(1445), 0.35, -0.3, "investigators' notes")
# 11 the screen switches
lib("blip_tech", fr(1600), 0.3, 0.0, "chip on the screen"); lib("chime_success", fr(1655), 0.4, 0.0, "his portrait on the screen")
# 12 the restaurant
lib("ding", fr(1712), 0.25, 0.2, "service bell")
for j in range(6):
    sfx(S.stroll_step(Q, 0.4), fr(1752) + j * 0.5, 0.25, 0.3)
for k in range(4):
    for j in range(4):
        sfx(S.stroll_step(Q, 0.5), fr(1818 + 6 * k) + j * 0.5, 0.2, -0.4 + 0.25 * k)
lib("buzz_error", fr(1822), 0.12, 0.0)
# 13 the market jumps: confetti
lib("boom", fr(1890), 0.35, 0.0); lib("chime_success", fr(1890), 0.4, 0.0, "the market jumps")
put(two(S.applause(3.0, Q, 50), 0.0), fr(1895), 0.3, 0.0, SF)
lib("tick_roll", fr(1930), 0.3, 0.0)
# 14 the doors open, the crane up
lib("whoosh_smooth", fr(2130), 0.25, 0.0, "HQ doors open", peak=True)
lib("whoosh_airy", fr(2150) + 1.0, 0.28, 0.0, "crane up", peak=True)
lib("chime_success", fr(2190), 0.3, 0.0, "a leather jacket")

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "nvidia"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: Eleven Days Without Jensen\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
