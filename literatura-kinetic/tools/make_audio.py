"""Light, modern explainer bed (112 BPM pluck/marimba groove, soft kick + hats) and UI SFX
(whoosh, pop, tick, thud, swoosh-zoom). Usage: python3 make_audio.py <assets-dir>"""
import sys, wave, numpy as np
SR = 48000; rng = np.random.default_rng(3)

def write(path, x):
    x = np.asarray(x, float)
    if x.ndim == 1: x = np.stack([x, x], 1)
    x = x / (np.max(np.abs(x)) or 1) * 0.89
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); h = np.ones_like(f)
    if hi: h *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo: h *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * (h[:, None] if x.ndim > 1 else h), n=len(x), axis=0)
def reverb(x, secs=1.6, mix=0.25):
    n = int(SR * secs); t = np.arange(n) / SR; out = []
    L = 1 << (len(x) + n - 1).bit_length()
    for ch in range(2):
        ir = filt(rng.standard_normal(n) * np.exp(-t * 6 / secs), hi=6000)
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[:len(x)]
        out.append(y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x[:, ch])))
    return x * (1 - mix) + np.stack(out, 1) * mix
def add(buf, x, at, pan=0.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if j <= i: return
    x = x[:j - i]
    if x.ndim == 1: buf[i:j, 0] += x * (1 - pan); buf[i:j, 1] += x * (1 + pan)
    else: buf[i:j] += x
def marimba(f, d=0.6, v=1):
    t = np.arange(int(SR * d)) / SR
    return v * (np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 26)) * np.minimum(1, t / 0.002)
def pluck(f, d=0.5, v=1):
    t = np.arange(int(SR * d)) / SR
    y = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 * np.exp(-t * (6 + 4 * k)) for k in range(1, 6))
    return v * y * np.minimum(1, t / 0.003)
def kick(v=1):
    t = np.arange(int(SR * 0.35)) / SR
    return v * np.sin(2 * np.pi * (50 * t + 90 * (1 - np.exp(-t * 30)) / 30)) * np.exp(-t * 9)
def hat(v=1):
    n = int(SR * 0.06); t = np.arange(n) / SR
    return v * filt(rng.standard_normal(n), lo=7000) * np.exp(-t * 70)
def snap(v=1):
    n = int(SR * 0.18); t = np.arange(n) / SR
    return v * filt(rng.standard_normal(n), lo=1200, hi=6000) * np.exp(-t * 30)

BPM = 112; B = 60 / BPM; DUR = 31.0; N = int(SR * DUR)
mus = np.zeros((N, 2)); drums = np.zeros((N, 2))
CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62, 67]]   # Am7 Fmaj7 C G
nbars = int(DUR / (4 * B)) + 1
for bar in range(nbars):
    t0 = bar * 4 * B; ch = CH[bar % 4]
    end = t0 > 28.0
    add(mus, pluck(hz(ch[0] - 12), 1.6, 0.8), t0)
    add(mus, pluck(hz(ch[0] - 12), 0.9, 0.55), t0 + 2.5 * B)
    if end: 
        for k, n in enumerate(ch + [ch[1] + 12]): add(mus, marimba(hz(n + 12), 2.0, 0.6), t0 + k * 0.05, pan=0.15 * (k - 2))
        break
    for s in range(8):
        n = ch[[0, 2, 1, 3, 2, 0, 3, 1][s]] + 12 + (12 if s in (3, 6) else 0)
        add(mus, marimba(hz(n), 0.6, 0.55 if s % 2 else 0.75), t0 + s * B / 2, pan=0.3 * np.sin(s * 1.7))
    if bar >= 1:                    # drums enter after the hook bar
        for b in range(4):
            add(drums, kick(0.9), t0 + b * B)
            add(drums, hat(0.35), t0 + b * B + B / 2, pan=0.3)
            if b in (1, 3): add(drums, snap(0.45), t0 + b * B, pan=-0.1)
mus = reverb(filt(mus, lo=100), 1.8, 0.28)
mix = mus + filt(drums, lo=45) * 0.55
t = np.arange(N) / SR
mix *= (np.minimum(1, t / 0.3) * np.clip((DUR - 0.2 - t) / 1.6, 0, 1))[:, None]
write(sys.argv[1] + '/music-explainer.wav', mix)

def whoosh(d=0.55):
    n = int(SR * d); tt = np.arange(n) / SR
    env = np.sin(np.pi * tt / d) ** 3
    y = filt(rng.standard_normal((n, 2)), lo=400, hi=5000) * env[:, None]
    return reverb(y, 0.6, 0.2)
def pop():
    tt = np.arange(int(SR * 0.16)) / SR
    y = np.sin(2 * np.pi * (520 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)
    return np.stack([y, y], 1)
def tick():
    tt = np.arange(int(SR * 0.12)) / SR
    y = (np.sin(2 * np.pi * 2600 * tt) + 0.4 * np.sin(2 * np.pi * 4100 * tt)) * np.exp(-tt * 60)
    return np.stack([y, y], 1)
def thud():
    tt = np.arange(int(SR * 0.6)) / SR
    y = np.sin(2 * np.pi * (60 * tt + 120 * (1 - np.exp(-tt * 25)) / 25)) * np.exp(-tt * 8) + filt(rng.standard_normal(len(tt)), hi=2500) * np.exp(-tt * 40) * 0.4
    return reverb(np.stack([y, y], 1), 0.8, 0.2)
def ding():
    tt = np.arange(int(SR * 1.4)) / SR
    y = sum(np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt * (2.5 + i)) / (i + 1) for i, m in enumerate([84, 88, 91, 96]))
    return reverb(np.stack([y, y], 1), 1.4, 0.35)
for name, fn in (('whoosh', whoosh), ('pop', pop), ('tick', tick), ('thud', thud), ('ding', ding)):
    write(f'{sys.argv[1]}/sfx-{name}.wav', fn())
print('ok')
