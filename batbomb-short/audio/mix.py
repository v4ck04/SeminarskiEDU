# Sound for "The Bats That Bombed America": an original score (a jaunty 1940s march for the plan, a hush in the
# cave and the fridge, a tense pulse at the test, silence before the fire, a wry resolve) and SFX on the
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

FPS, TOTAL = 30, 1900          # must match finance-short/src/videos/batbomb/story.ts TOTAL
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
# hook: a low drone over the burning base
pad("Dm", 0.05, W("It", line="dentist"), 0.28, att=0.3, octave=2)
low(m("D1"), W("fire"), 0.8, 1.6)
# the dentist and the plan: a jaunty march in F
arp(W("It", line="dentist"), W("He", line="fdr"), ["F", "C", "G", "C", "F", "G"], 0.4, step=0.24)
for w in (W("Carlsbad"), W("firebomb"), W("roofs")):
    glk(m("C6"), w, 0.35)
# the White House: stately
arp(W("He", line="fdr"), W("So", line="yes"), ["C", "F", "G", "C"], 0.34, step=0.32)
motif(W("nut"), ["G5", "C6", "E6"], 0.12, 0.42)
# the military says yes: the march again, bigger
arp(W("So", line="yes"), W("To", line="fridge"), ["F", "C", "G", "C"], 0.44, step=0.2)
# the fridge: a hush
pad("F", W("To", line="fridge"), W("Then", line="snap"), 0.24, att=0.2)
motif(W("asleep"), ["A5", "F5", "C5"], 0.3, 0.3)
# the test: a tense pulse, then silence before the fire
for k in range(int((W("flames") - W("Then", line="snap")) / 0.25)):
    low(m("D2") if k % 2 else m("A1"), W("Then", line="snap") + k * 0.25, 0.42, 0.25)
low(m("D1"), W("flames"), 1.0, 2.0)
# luckily / unluckily
arp(W("Luckily"), W("Unluckily") - 0.1, ["F", "C"], 0.36, step=0.26)
for i, n in enumerate(["C5", "B4", "A#4", "A4"]):
    put(I.pluck(F(m(n)), 0.5, R, 0.5, bright=0.6, pos=0.12), W("Unluckily") + 0.25 + i * 0.18, 0.8, 0.2)
# the explanation: calm, curious
arp(W("Why", line="why"), W("The", line="navy"), ["Dm", "F", "C", "G"], 0.3, step=0.34, bright=0.35)
# the Navy, the cancellation
arp(W("The", line="navy"), W("cancelled"), ["F", "C"], 0.32, step=0.28)
low(m("D1"), W("cancelled"), 0.7, 1.2)
# the end: the march theme slowed, a wry last chord
arp(W("The", line="end"), DUR - 1.2, ["F", "G", "C"], 0.3, step=0.38)
motif(W("victory"), ["C5", "E5", "G5"], 0.24, 0.4)
pad("C", W("victory") - 0.1, DUR - 0.05, 0.3, att=0.4, rel=1.2)

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


# ambience
for a, b2 in ((0, 160), (970, 1348), (1572, TOTAL)):
    put(two(S.breeze(fr(b2 - a), Q, 0.35))[:, :ns(fr(b2 - a))], fr(a), 0.5, 0.0, SF)
put(two(S.crickets(fr(390), Q)), fr(970), 0.25, 0.0, SF)
put(two(S.bird_chirps(fr(182), Q, 0.25, "sparrow"), 0.3), fr(358), 0.16, 0.0, SF)
put(two(S.bird_chirps(fr(224), Q, 0.25, "sparrow"), 0.3), fr(1348), 0.16, 0.0, SF)
for i, f0 in enumerate((358, 540, 698, 860, 970, 1100, 1220, 1348, 1572)):
    lib(["whoosh_soft", "whoosh_smooth", "swipe_tech"][i % 3], fr(f0), 0.28, Q.uniform(-0.3, 0.3), peak=True)
lib("whoosh_heavy", fr(160), 0.35, 0.0, "hook flash", peak=True)
lib("whoosh_airy", fr(1740), 0.3, 0.0, "into the dawn", peak=True)
# bat wings: soft flutters wherever bats fly
def flutter(t0, dur, g=0.25, p=0.0):
    sfx(riffle(dur, Q, rate=34), t0, g, p)
flutter(fr(0), 4.0, 0.2); flutter(fr(336), 0.8, 0.35); flutter(fr(395), 1.6, 0.2); flutter(fr(1070), 1.2, 0.35); flutter(fr(1104), 1.2, 0.3); flutter(fr(1450), 1.8, 0.2)
CUES.append((fr(336), "the cave bats take off"))
# 1 the base catches fire
lib("boom", fr(79), 0.45, 0.0, "the hangar catches fire")
put(two(lp(S.breeze(5.0, Q, 1.0), 900)), fr(79), 0.5, 0.0, SF)
# 2 the dentist's drill
sfx(S.whoosh(0.5, Q, peak=0.3, f_lo=1500, f_hi=4000), fr(200), 0.18, 0.2, "dentist's drill")
# 3 the bat hides under the eaves
lib("pop_ui", fr(505), 0.3, 0.2, "bat under the roof")
# 4 the letter, the note
lib("card_slide", fr(549), 0.4, -0.2, "the letter")
sfx(tear(Q), fr(560), 0.3, 0.1)
lib("chime_success", fr(641), 0.4, 0.0, "this man is not a nut")
# 5 yes; the tiny bomb
lib("ding", fr(729), 0.3, 0.0, "yes"); lib("pop_bubble", fr(751), 0.4, 0.2, "the tiny bomb")
# 6 the fridge: a hum, the snores
put(two(lp(S.breeze(3.6, Q, 0.4), 220)), fr(860), 0.6, 0.0, SF)
sfx(S.snore(Q, 1.4) if hasattr(S, "snore") else riffle(0.4, Q), fr(948), 0.3, 0.0, "zzz")
# 7 the crate lid pops, the bats escape
sfx(knock(Q), fr(1066), 0.7, 0.1, "crate lid pops"); lib("impact_subtle", fr(1066), 0.3, 0.1)
# 8 under the tank, silence, the fire
lib("riser", fr(1193), 0.35, 0.0, peak=True)
lib("boom", fr(1193), 0.7, 0.0, "the fuel tank goes up"); lib("sting_reveal", fr(1193), 0.35, 0.0)
put(two(lp(S.breeze(6.0, Q, 1.2), 900)), fr(1193), 0.6, 0.0, SF)
# 9 the thumbs-up, the denied buzz
lib("ding", fr(1228), 0.3, 0.2, "worked perfectly"); lib("buzz_error", fr(1292), 0.18, 0.0, "worked on America")
# 10 the bomb bounces off a roof; the bat slips in
sfx(S.whoosh(0.5, Q, peak=0.3), fr(1390), 0.3, -0.2)
lib("impact_subtle", fr(1424), 0.5, -0.2, "bomb bounces off the roof"); sfx(knock(Q), fr(1426), 0.6, -0.2)
lib("pop_ui", fr(1545), 0.3, 0.2, "bat under the eaves")
# 11 steps, the CANCELLED stamp
for k in range(2):
    for j in range(5):
        sfx(S.stroll_step(Q, 0.5), fr(1590 + 40 * k) + j * 0.5, 0.25, 0.2)
sfx(stamp(Q), fr(1666), 0.8, 0.0, "CANCELLED stamp"); lib("boom", fr(1666), 0.3, 0.0)
# 12 dawn: a single bat squeak
lib("click_shutter", fr(1800), 0.2, 0.3)

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
PUB = os.path.join(ROOT, "..", "finance-short", "public", "batbomb"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: The Bats That Bombed America\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
