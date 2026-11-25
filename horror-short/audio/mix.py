# Sound for "Voicemail From Tomorrow" (original horror short): a minimal score that builds suspense (a cello drone, a low
# string cluster at the warning, a violin harmonic at the door, a heartbeat after the second voicemail, a rising tone
# cut to silence before the reveal) and SFX on the picture's cues: rain, the phone buzzing on wood, the fridge hum that
# stops, UI taps, a reversed swell on "tomorrow", the corridor buzz, the oven clock click and the dead silence, three
# knocks, socked steps and floorboard creaks, the peephole click, the light relay, the phone dying and a last exhale.
# The voicemail lines are band-limited like a phone speaker; the voice behind the door is muffled.
# Mix: music -14 LU under the voice, SFX -15 LU, master -14 LUFS, true peak -1.5 dBTP, 48 kHz stereo.
# usage: python audio/mix.py    (from horror-short/; writes audio/mix.wav, audio/cues.md and finance-short/public/horror/mix.wav)
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

FPS, TOTAL = 30, 1500          # must match finance-short/src/videos/horror/story.ts TOTAL
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
def drone(midi, t0, t1, vel=0.4, bright=0.25):
    put(I.pad([F(midi), F(midi + 12)], t1 - t0, vel, R, att=1.2, rel=1.0), t0, 0.8)


drone(m("D1"), 0.1, fr(665), 0.42)                              # the cello drone until the clock flips
pad("Dm", fr(394), fr(665), 0.26, att=1.5, octave=2)            # the warning: a low string cluster
put(I.pad([F(m("D#2")), F(m("A2"))], fr(665) - fr(394), 0.18, R, att=2.0, rel=0.8), fr(394), 0.6)   # the dissonant half
put(I.pad([F(m("A6"))], fr(870) - fr(720), 0.16, R, att=0.8, rel=0.6), fr(720), 0.7)   # violin harmonic at the door
drone(m("D1"), fr(722), fr(995), 0.3)
# the heartbeat after the second voicemail, 55 -> 80 bpm
t = fr(1062); bpm = 55
while t < fr(1352):
    for k, g in ((0, 0.9), (0.16, 0.6)):
        low(m("D1"), t + k, g, 0.3)
    bpm = min(80, bpm + 1.6); t += 60 / bpm
# the rising tone, cut to silence when she turns
d = fr(1352) - fr(1240); tt_ = tt(d)
tone = np.sin(phase(880 * (1 + 0.6 * (tt_ / d) ** 2))) * 0.12 * np.minimum(1, tt_ / 1.0)
put(lp(tone, 4000), fr(1240), 0.6, 0.0)

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


def buzzwood(dur, r):
    """a phone vibrating on a wooden table: a 170 Hz motor buzz with a rattle"""
    t = tt(dur); y = np.sign(np.sin(phase(170))) * 0.25 + bp(r.standard_normal(len(t)), 300, 2500, 1) * 0.15
    env = ((t % 0.5) < 0.32).astype(float)
    return fades(bp(y, 120, 3000, 1) * env, 0.005, 0.03)


def hum(dur, r, f0=60, g=0.12):
    t = tt(dur); y = sum(np.sin(phase(f0 * k)) / k for k in (1, 2, 3, 5))
    return fades(y * g + lp(r.standard_normal(len(t)), 200) * 0.03, 0.3, 0.3)


def tap(r):
    t = tt(0.05); return bp(r.standard_normal(len(t)), 1500, 6000, 1) * np.exp(-t / 0.006) * 0.5


def click(r, f0=3000):
    t = tt(0.04); return (np.sin(phase(f0)) * 0.3 + bp(r.standard_normal(len(t)), 2000, 9000, 1) * 0.4) * np.exp(-t / 0.004)


def creak(r, dur=0.6):
    t = tt(dur); f = 180 * (1 + 0.25 * np.sin(TAU * 1.3 * t)) + 40 * np.sin(TAU * 7 * t)
    y = np.sign(np.sin(phase(f))) * (0.5 + 0.5 * np.sin(TAU * 23 * t)) * 0.15
    return fades(bp(y, 200, 2500, 1) * np.sin(np.pi * t / dur), 0.02, 0.05)


def doorknock(r):
    """a fist on a wooden door: a low thump, the door panel's resonance, the chain rattling"""
    t = tt(0.7)
    y = np.sin(phase(95 * (1 + 0.8 * np.exp(-t / 0.01)))) * np.exp(-t / 0.08) * 0.9
    y += modal(0.7, [(180, 0.5, 0.12), (420, 0.3, 0.06)], r) * 0.5
    y += bp(r.standard_normal(len(t)), 500, 3000, 1) * np.exp(-t / 0.01) * 0.4
    y[ns(0.05):ns(0.05) + ns(0.3)] += S.rattle(0.3, r, density=30)[:ns(0.3)] * 0.12
    return fades(y, 0.001, 0.1)


def sockstep(r):
    t = tt(0.15); return lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.03) * 0.3


def swell(r, dur=1.2):
    """a reversed piano note: rises and stops dead"""
    t = tt(dur); y = modal(dur, [(F(m("A5")), 1.0, 0.6), (F(m("A5")) * 2, 0.3, 0.4)], r)
    return fades(y[::-1] * 0.6, 0.05, 0.005)


def exhale(r, dur=1.1):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), 300, 3000, 1) * np.sin(np.pi * t / dur) ** 2 * 0.35, 0.05, 0.1)


# rain: loud outside, soft through the glass; it stops dead at the clock (the silence) and creeps back
for a, b2, g in ((0, 108, 0.9), (108, 665, 0.35), (722, 1352, 0.3)):
    put(two(hp(S.breeze(fr(b2 - a), Q, 1.0), 900))[:, :ns(fr(b2 - a))], fr(a), g, 0.0, SF)
CUES.append((0.0, "rain"))
sfx(S.whoosh(1.2, Q, peak=0.6), fr(20), 0.25, -0.3, "a car hisses past on the wet street")
lib("boom", fr(100), 0.35, 0.0, "the camera passes through the glass"); lib("whoosh_airy", fr(96), 0.25, 0.0, peak=True)
sfx(buzzwood(0.9, Q), fr(59), 0.7, 0.1, "the phone buzzes on the table")
put(two(hum(fr(236) - fr(108), Q, 50, 0.1)), fr(108), 0.5, 0.0, SF); CUES.append((fr(236), "the fridge hum stops at 'light'"))
sfx(tap(Q), fr(289), 0.5, 0.0, "replay tap")
sfx(swell(Q), fr(355) - 1.2, 0.5, 0.0, "reversed swell into 'tomorrow'")
put(two(hum(fr(665) - fr(400), Q, 60, 0.06)), fr(400), 0.5, 0.0, SF); CUES.append((fr(400), "the corridor buzz"))
sfx(tap(Q), fr(590), 0.6, 0.0, "phone placed face-down")
sfx(click(Q, 2600), fr(665), 0.6, 0.0, "the oven clock clicks to 3:17 (then silence)")
for k in (720, 735, 750):
    sfx(doorknock(Q), fr(k), 0.9, 0.0, "knock")
put(two(hum(fr(1040) - fr(722), Q, 60, 0.05)), fr(722), 0.5, 0.0, SF)
for k in range(5):
    sfx(sockstep(Q), fr(806) + k * 0.42, 0.35, 0.1)
sfx(creak(Q), fr(848), 0.4, 0.0, "floorboard creak")
sfx(click(Q, 3400), fr(878), 0.5, 0.0, "peephole cover")
for k in range(4):
    sfx(click(Q, 1800), fr(893) + k * 0.2, 0.2, 0.3)
sfx(creak(Q, 0.5), fr(950), 0.45, 0.2, "a wet creak on the other side of the door")
for k in (994, 1006):
    sfx(doorknock(Q), fr(k), 0.7, 0.0)
sfx(click(Q, 900), fr(1040), 0.5, 0.0, "the corridor light switches off")
sfx(buzzwood(1.0, Q), fr(1064), 0.8, 0.0, "one new voicemail")
sfx(click(Q, 1200), fr(1440), 0.5, 0.0, "the phone dies")
sfx(exhale(Q), fr(1448), 0.6, 0.0, "an exhale through the phone speaker")

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
for seg in json.load(open(os.path.join(ROOT, "voice", "lines_timed.json"))):
    a0, a1 = ns(seg["start"] - 0.02), ns(seg["end"] + 0.25)
    x = v[a0:a1].copy()
    if seg["id"].startswith("vm"):
        x = bp(x, 320, 3400, 2) * 1.6 + rng(7).standard_normal(len(x)) * 0.004
    elif seg["id"] == "door":
        x = lp(x, 1500) * 1.4
    v[a0:a1] = x
voice = np.zeros((2, N)); n0 = min(N, len(v)); voice[:, :n0] = v[:n0][None, :]
mask = np.zeros(N)
for w in WORDS:
    a, b = ns(w["s"] - 0.05), ns(w["e"] + 0.12)
    mask[max(0, a):min(N, b)] = 1
win = ns(0.12); mask = np.clip(signal.fftconvolve(mask, np.hanning(win) / np.hanning(win).sum(), mode="same"), 0, 1)
vl = integrated(voice)
MUS *= dbg(vl - 14.0 - integrated(MUS))
MUS *= (1 - (1 - dbg(-3.0)) * mask)[None, :]
SF *= dbg(vl - 15.0 - integrated(SF))
mix = voice + MUS + SF
e = np.minimum(1, (N - np.arange(N)) / ns(0.6)); mix *= e[None, :]
for _ in range(2):
    mix = limiter(mix * dbg(-14.0 - integrated(mix)), -1.5)
write_wav(os.path.join(HERE, "mix.wav"), mix)
PUB = os.path.join(ROOT, "..", "finance-short", "public", "horror"); os.makedirs(PUB, exist_ok=True)
write_wav(os.path.join(PUB, "mix.wav"), mix)
rep = f"integrated {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, length {mix.shape[1] / SR:.3f} s"
print(rep)
with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Sound cues: Voicemail From Tomorrow\n\n" + rep + "\n\n| time (s) | frame | cue |\n|---|---|---|\n")
    for t, w in sorted(CUES):
        fh.write(f"| {t:6.2f} | {round(t * FPS)} | {w} |\n")
