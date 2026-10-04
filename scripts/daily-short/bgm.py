"""Synthesize a royalty-free 128 BPM electro-pop bed (A minor, Am-F-C-G).

Usage: python bgm.py <seconds> <out.wav> [scene_starts...]
Scene starts get a riser into them and a crash on the cut.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = float(sys.argv[1])
OUT = sys.argv[2]
CUTS = [float(x) for x in sys.argv[3:]]
BPM = 128
BEAT = 60 / BPM
N = int(DUR * SR)
rng = np.random.default_rng(3)

L = np.zeros(N)
R = np.zeros(N)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i : i + len(sig)] += sig * gain * (1 + min(0, pan))


def saw(f, n, detune=(0,), phase_rng=True):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in detune:
        ff = f * 2 ** (d / 1200)
        ph = rng.random() if phase_rng else 0
        out += 2 * ((t * ff + ph) % 1) - 1
    return out / len(detune)


def env_adsr(n, a=0.005, d=0.1, s=0.6, r=0.05):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[na : na + nd] = np.linspace(1, s, len(e[na : na + nd]))
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ---- drum one-shots
def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(n) * np.exp(-t * 300) * 0.25
    return np.tanh((body + click) * 1.6)


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 5000)
    e = np.exp(-t * 22)
    for off in (0.0, 0.011, 0.022):  # flam
        e += np.exp(-np.maximum(0, t - off) * 120) * (t >= off) * 0.6
    return noise * e * 0.6


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.5


K, C, H, HO = kick(), clap(), hat(), hat(True)

# ---- harmony: Am F C G, one chord per bar
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [45, 41, 48, 43]
bar = 4 * BEAT
nbars = int(np.ceil(DUR / bar)) + 1

# sidechain pump envelope (ducks on each beat)
pump = np.ones(N)
for b in range(int(DUR / BEAT) + 2):
    i = int(b * BEAT * SR)
    m = int(0.22 * SR)
    seg = 0.25 + 0.75 * (np.linspace(0, 1, m) ** 0.7)
    pump[i : i + m] = np.minimum(pump[i : i + m], seg[: max(0, min(m, N - i))])

pad_l = np.zeros(N)
pad_r = np.zeros(N)
bass = np.zeros(N)
arp = np.zeros(N)

for b in range(nbars):
    t0 = b * bar
    if t0 >= DUR:
        break
    ch = PROG[b % 4]
    n = int(bar * SR)
    i = int(t0 * SR)
    m = min(n, N - i)
    # supersaw pad, opens up over the bar
    p_l = sum(saw(midi(x + 12), n, (-14, -5, 6)) for x in ch)
    p_r = sum(saw(midi(x + 12), n, (-9, 3, 13)) for x in ch)
    e = env_adsr(n, 0.02, 0.3, 0.8, 0.05)
    pad_l[i : i + m] += (lp(p_l, 2600) * e)[:m] * 0.16
    pad_r[i : i + m] += (lp(p_r, 2600) * e)[:m] * 0.16
    # offbeat bass (8ths on the "and")
    for k in range(4):
        tb = t0 + k * BEAT + BEAT / 2
        nb = int(BEAT / 2 * SR * 0.9)
        note = saw(midi(ROOT[b % 4]), nb, (-6, 6)) + 0.5 * np.sin(2 * np.pi * midi(ROOT[b % 4] - 12) * np.arange(nb) / SR)
        sig = lp(note, 700) * env_adsr(nb, 0.003, 0.08, 0.7, 0.02)
        j = int(tb * SR)
        if j < N:
            bass[j : j + nb] += sig[: N - j] * 0.55
    # 16th pluck arpeggio
    pattern = [0, 1, 2, 1, 0, 2, 1, 2] * 2
    for k, idx in enumerate(pattern):
        ta = t0 + k * BEAT / 4
        na = int(BEAT / 4 * SR)
        f = midi(ch[idx] + 24 + (12 if k in (6, 14) else 0))
        sig = lp(saw(f, na, (-4, 4)), 4200) * np.exp(-np.arange(na) / SR * 22)
        j = int(ta * SR)
        if j < N:
            arp[j : j + na] += sig[: N - j] * 0.22

# drums
nbeats = int(DUR / BEAT) + 1
for b in range(nbeats):
    t = b * BEAT
    add(K, t, 0.95)
    if b % 2 == 1:
        add(C, t, 0.55, pan=0.0)
    add(H, t + BEAT / 2, 0.35, pan=0.25)
    add(H, t + BEAT / 4, 0.12, pan=-0.25)
    add(H, t + 3 * BEAT / 4, 0.12, pan=-0.25)
    if b % 4 == 3:
        add(HO, t + BEAT / 2, 0.22, pan=0.3)

# risers into each scene cut + crash on the cut
for c in CUTS:
    rl = 1.2
    n = int(rl * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # sweep: progressively brighter band
    seg = np.concatenate([bp(noise[k : k + 2205], 400 + 6000 * (k / n), 400 + 6000 * (k / n) + 2500) for k in range(0, n, 2205)])[:n]
    add(seg * (t / rl) ** 2 * 0.35, max(0, c - rl))
    nc = int(1.4 * SR)
    tc = np.arange(nc) / SR
    add(hp(rng.standard_normal(nc), 5000) * np.exp(-tc * 3.2) * 0.3, c, pan=0.15)
    add(K, c, 0.6)

L += (pad_l + bass + arp * 0.9) * pump
R += (pad_r + bass + arp * 1.1) * pump

# master: gentle glue + fade in/out
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 0.9)
fi = int(0.05 * SR)
fo = int(1.8 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
print(f"wrote {OUT} {DUR:.1f}s")
