"""Code-made soundtrack for the SeminarskiEdu literature reel: quiet, elegant ambient piano + pad (30 s)
and a few soft SFX (whoosh, shimmer, tick, impact). Usage: python3 make_audio.py <assets-dir>"""
import sys, wave, numpy as np
SR = 48000
rng = np.random.default_rng(7)

def write(path, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1: x = np.stack([x, x], 1)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())

def hz(n): return 440 * 2 ** ((n - 69) / 12)

def lowpass(x, fc):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    h = 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X * (h[:, None] if x.ndim > 1 else h), n=len(x), axis=0)

def highpass(x, fc):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    h = 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * (h[:, None] if x.ndim > 1 else h), n=len(x), axis=0)

def reverb(x, secs=2.8, mix=0.32):
    n = int(SR * secs); t = np.arange(n) / SR
    irL = rng.standard_normal(n) * np.exp(-t * 6.5 / secs); irR = rng.standard_normal(n) * np.exp(-t * 6.5 / secs)
    irL = lowpass(irL, 5000); irR = lowpass(irR, 5000)
    N = len(x) + n; L = 1 << (N - 1).bit_length()
    outs = []
    for ch, ir in ((0, irL), (1, irR)):
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[:len(x)]
        outs.append(y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x[:, ch])))
    wet = np.stack(outs, 1)
    return x * (1 - mix) + wet * mix

def piano(f, dur, vel=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for k, a in enumerate([1, .55, .28, .16, .09, .05], 1):
        fk = f * k * (1 + 0.0004 * k * k)
        y += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.1 + 0.9 * k))
    att = np.minimum(1, t / 0.004)
    return y * att * vel

def pad(freqs, dur):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros((n, 2))
    for i, f in enumerate(freqs):
        for d, ch in ((-3, 0), (3, 1)):
            ff = f * 2 ** (d / 1200)
            v = sum(np.sin(2 * np.pi * ff * k * t + i) / k ** 1.6 for k in range(1, 5))
            y[:, ch] += v
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.0).clip(0)
    return lowpass(y * env[:, None], 1400)

# ---------- music ----------
DUR = 31.0
BAR = 3.0                      # 80 BPM, 4/4
N = int(SR * DUR)
mus = np.zeros((N, 2))
# chord voicings (MIDI): Am9, Fmaj7, Cmaj7/E, G6 ... ending on Fmaj7 -> C(add9)
CH = [
    [57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [52, 55, 60, 64, 67], [55, 59, 62, 64, 67],
    [57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [52, 55, 60, 64, 67], [55, 59, 62, 64, 69],
    [53, 57, 60, 64, 67], [48, 55, 60, 62, 64],
]
def add(buf, x, at, pan=0.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if j <= i: return
    x = x[:j - i]
    if x.ndim == 1:
        buf[i:j, 0] += x * (1 - pan) ; buf[i:j, 1] += x * (1 + pan)
    else: buf[i:j] += x

for b, ch in enumerate(CH):
    t0 = b * BAR
    last = b == len(CH) - 1
    add(mus, pad([hz(n) for n in ch[:3]], BAR + (2.0 if last else 0.6)) * 0.10, t0)
    # bass note, soft
    add(mus, piano(hz(ch[0] - 12), 3.2, 0.55), t0)
    # arpeggio in eighths, an octave up (phone speakers), sparse in the intro bar
    pattern = [0, 2, 4, 3, 1, 3, 4, 2]
    steps = 4 if b == 0 else 8
    for s in range(steps):
        if last and s > 2: break
        note = ch[pattern[s] % len(ch)] + 12
        vel = (0.42 if s % 2 else 0.55) * (0.75 if b == 0 else 1)
        add(mus, piano(hz(note), 2.4, vel), t0 + s * BAR / 8 + (0.0 if s % 2 == 0 else 0.012), pan=0.25 * np.sin(s))
    if last:
        for k, n in enumerate([72, 76, 79, 86]):
            add(mus, piano(hz(n), 4.5, 0.5), t0 + 1.2 + k * 0.09, pan=0.2 * (k - 1.5))

mus = highpass(mus, 90)
mus = reverb(mus, 3.2, 0.38)
t = np.arange(N) / SR
fade = np.minimum(1, t / 1.2) * np.clip((DUR - 0.3 - t) / 2.2, 0, 1) ** 1.5
fade = np.where(t < DUR - 2.5, np.minimum(1, t / 1.2), fade)
mus *= fade[:, None]
write(sys.argv[1] + '/music-ambient.wav', mus)

# ---------- sfx ----------
def whoosh(d=1.0):
    n = int(SR * d); tt = np.arange(n) / SR
    x = rng.standard_normal((n, 2))
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2.2
    peak_shift = np.exp(-((tt - 0.62 * d) / (0.22 * d)) ** 2)
    lo = lowpass(x, 900); hi = lowpass(x, 3200)
    y = lo * (1 - peak_shift[:, None]) + hi * peak_shift[:, None] * 0.6
    y = highpass(y * env[:, None], 150)
    return reverb(y, 1.2, 0.3)

def shimmer(d=1.6):
    n = int(SR * d); tt = np.arange(n) / SR; y = np.zeros((n, 2))
    for i, m in enumerate([88, 91, 95, 98, 100]):
        on = i * 0.05; e = np.where(tt >= on, np.exp(-(tt - on) * 3.2), 0) * np.minimum(1, np.maximum(0, tt - on) / 0.003)
        s = np.sin(2 * np.pi * hz(m) * tt) * e
        y[:, 0] += s * (0.6 + 0.1 * i); y[:, 1] += s * (1.0 - 0.1 * i)
    return reverb(y * 0.5, 2.0, 0.45)

def tick():
    n = int(SR * 0.25); tt = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 2400 * tt) * 0.6 + np.sin(2 * np.pi * 3600 * tt) * 0.3) * np.exp(-tt * 45)
    return reverb(np.stack([y, y], 1), 0.6, 0.25)

def impact(d=3.5):
    n = int(SR * d); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 2.2)
    air = lowpass(rng.standard_normal(n), 1800) * np.exp(-tt * 5) * 0.25
    bell = sum(np.sin(2 * np.pi * hz(m) * tt) / (i + 1) for i, m in enumerate([72, 79, 84, 88])) * np.exp(-tt * 1.3) * 0.35
    y = body * 0.9 + air + bell
    return reverb(np.stack([y, y], 1), 2.8, 0.4)

write(sys.argv[1] + '/sfx-whoosh.wav', whoosh())
write(sys.argv[1] + '/sfx-shimmer.wav', shimmer())
write(sys.argv[1] + '/sfx-tick.wav', tick())
write(sys.argv[1] + '/sfx-impact.wav', impact())
print('ok')
