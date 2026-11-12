# Original background music by mood, synthesized from code (no samples, no third-party rights).
# Usage (from OpenMontage/): .venv/bin/python projects/motion-kit/daily/make_music.py [out_dir] [seconds] [seed]
# Writes hard.mp3, chill.mp3, inspirational.mp3, suspense.mp3 (loudness -14 LUFS, 44.1 kHz stereo).
import sys, os, subprocess, numpy as np

SR = 44100
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'projects/motion-kit/public/music')
SECS = float(sys.argv[2]) if len(sys.argv) > 2 else 90
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 7

def hz(n): return 440.0 * 2 ** ((n - 69) / 12)            # MIDI note -> Hz
def env(n, a, d, s=0.0, r=0.0):                          # attack/decay envelope, n samples
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    if r: e *= np.clip((n / SR - t) / r, 0, 1)
    return e
def lp_fast(x, fc):                                       # zero-phase FFT low-pass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))
def hp_fast(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 2 / np.sqrt(1 + (f / fc) ** 4), len(x))
def phone_eq(x):                                          # tame lows (~-12 dB under 120 Hz), lift 1-4 kHz: music must survive phone speakers under a voice
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 - 0.75 / (1 + (f / 120) ** 4) + 0.6 * np.exp(-((np.log2(np.maximum(f, 1) / 2000)) ** 2) / 1.2)
    return np.fft.irfft(X * g, len(x))
def saw(f, n, detune=(0,)):
    t = np.arange(n) / SR
    return sum(2 * ((t * f * 2 ** (d / 1200)) % 1) - 1 for d in detune) / len(detune)
def sine(f, n, ph=0): return np.sin(2 * np.pi * f * np.arange(n) / SR + ph)
def reverb(x, secs=2.2, mix=0.25, rng=None):
    n = int(SR * secs); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6 / secs)
    ir = lp_fast(ir, 5000); L = len(x) + n; N = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]
    return x * (1 - mix) + wet / (np.abs(wet).max() + 1e-9) * np.abs(x).max() * mix

class Track:
    def __init__(self, bpm, rng): self.bpm, self.rng = bpm, rng; self.n = int(SECS * SR); self.L = np.zeros(self.n); self.R = np.zeros(self.n)
    def beat(self, b): return int(b * 60 / self.bpm * SR)
    def add(self, sig, at, pan=0.0, gain=1.0):
        i = self.beat(at)
        if i >= self.n: return
        sig = sig[: self.n - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2); self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)
    @property
    def beats(self): return int(SECS * self.bpm / 60)

def kick(soft=False):
    n = int(SR * (0.35 if soft else 0.5)); t = np.arange(n) / SR
    f = 45 + (120 if soft else 160) * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.18 if soft else 0.28)
def snare(rng, clap=False):
    n = int(SR * 0.25); x = hp_fast(rng.standard_normal(n), 1200 if clap else 900) * env(n, 0.001, 0.07 if clap else 0.12)
    if not clap: x += sine(190, n) * env(n, 0.001, 0.05) * 0.6
    return x
def hat(rng, open_=False):
    n = int(SR * (0.22 if open_ else 0.05)); return hp_fast(rng.standard_normal(n), 7000) * env(n, 0.001, 0.08 if open_ else 0.015)
def eight08(note, beats_len, bpm):
    n = int(beats_len * 60 / bpm * SR); t = np.arange(n) / SR
    f = hz(note) * (1 + 0.9 * np.exp(-t * 40))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.9, 0.35, 0.05)
    return np.tanh(x * 2.2) * 0.8
def pad(notes, beats_len, bpm, fc=1800):
    n = int(beats_len * 60 / bpm * SR)
    x = sum(saw(hz(m), n, (-9, 0, 8)) for m in notes) / len(notes)
    return lp_fast(x, fc) * env(n, 0.6, 99, 1.0, 0.6)
def keys(notes, beats_len, bpm):                         # soft electric-piano: sine + 2nd harmonic, tremolo
    n = int(beats_len * 60 / bpm * SR)
    x = sum(sine(hz(m), n) + 0.25 * sine(2 * hz(m), n) * env(n, 0.002, 0.3) for m in notes) / len(notes)
    return x * env(n, 0.005, 1.6, 0.25, 0.3) * (1 + 0.12 * sine(4.5, n))
def pluck(note, dur, bright=3500):
    n = int(SR * dur); x = saw(hz(note), n, (-4, 4)) * env(n, 0.002, 0.18)
    return lp_fast(x, bright)
def bass(note, beats_len, bpm, fc=500):
    n = int(beats_len * 60 / bpm * SR); return lp_fast(saw(hz(note), n), fc) * env(n, 0.005, 0.5, 0.6, 0.04)

def hard(rng):          # 140 BPM, half-time trap: 808, rolling hats, dark minor pad (C minor)
    T = Track(140, rng); prog = [[48, 51, 55], [44, 48, 51], [46, 50, 53], [43, 47, 50]]; roots = [36, 32, 34, 31]
    for bar in range(T.beats // 4):
        b0 = bar * 4; c = bar % 4; drop = bar >= 4
        T.add(pad([m + 12 for m in prog[c]], 4, T.bpm, 1800), b0, 0, 0.24)
        if drop:
            for k in (0, 1.5, 2.75): T.add(kick(), b0 + k, 0, 0.9)
            T.add(eight08(roots[c], 1.5, T.bpm), b0, 0, 0.32); T.add(eight08(roots[c], 1.25, T.bpm), b0 + 1.5, 0, 0.28)
            T.add(eight08(roots[c] + (3 if c % 2 else 0), 1.25, T.bpm), b0 + 2.75, 0, 0.28)
            T.add(snare(rng, True), b0 + 2, 0, 0.55)
        for h in np.arange(0, 4, 0.5 if not drop else 0.25):
            T.add(hat(rng), b0 + h, 0.3, 0.22 if h % 1 == 0 else 0.13)
        if drop and bar % 2 == 1:
            for r in np.arange(3, 4, 1 / 8): T.add(hat(rng), b0 + r, -0.3, 0.12)
        mel = [67, 70, 72, 70, 67, 63, 65, 67]
        if bar % 2 == 0:
            for i, m in enumerate(mel): T.add(pluck(m, 0.25, 3000), b0 + i * 0.5, -0.4 + 0.1 * i, 0.22)
    return T, 0.18
def chill(rng):         # 84 BPM lo-fi: swung hats, rim, warm jazzy keys (F major 7ths)
    T = Track(84, rng); prog = [[53, 57, 60, 64], [50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 58]]; roots = [41, 38, 43, 36]
    noise = lp_fast(rng.standard_normal(T.n), 3000) * 0.004
    T.L += noise; T.R += np.roll(noise, 999)
    for bar in range(T.beats // 4):
        b0 = bar * 4; c = bar % 4
        T.add(keys(prog[c], 2, T.bpm), b0, -0.2, 0.32); T.add(keys(prog[c], 2, T.bpm), b0 + 2.5, 0.2, 0.22)
        T.add(bass(roots[c], 1.5, T.bpm, 300), b0, 0, 0.4); T.add(bass(roots[c] + 7, 1, T.bpm, 300), b0 + 2.5, 0, 0.3)
        for k in (0, 2.5): T.add(kick(True), b0 + k, 0, 0.7)
        for s in (1, 3): T.add(snare(rng) * 0.6, b0 + s, 0.1, 0.35)
        for h in range(8): T.add(hat(rng), b0 + h * 0.5 + (0.08 if h % 2 else 0), 0.35, 0.12 if h % 2 else 0.18)
    return T, 0.3
def inspirational(rng): # 112 BPM uplifting: I-V-vi-IV in C, pluck arpeggio, pad, build to four-on-the-floor
    T = Track(112, rng); prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; roots = [36, 43, 45, 41]
    for bar in range(T.beats // 4):
        b0 = bar * 4; c = bar % 4; lvl = min(bar // 4, 2)
        T.add(pad([m + 12 for m in prog[c]], 4, T.bpm, 2400), b0, 0, 0.14)
        arp = prog[c] + [prog[c][0] + 12, prog[c][1] + 12]
        for i in range(8): T.add(pluck(arp[[0, 1, 2, 3, 4, 3, 2, 1][i]] + 12, 0.35, 4200), b0 + i * 0.5, (-0.5, 0.5)[i % 2], 0.13)
        if lvl >= 1:
            T.add(bass(roots[c], 4, T.bpm, 420), b0, 0, 0.32)
            for s in (1, 3): T.add(snare(rng, True), b0 + s, 0, 0.32)
        if lvl >= 2:
            for k in range(4): T.add(kick(), b0 + k, 0, 0.6)
            for h in range(4): T.add(hat(rng, True), b0 + h + 0.5, 0.3, 0.1)
        elif lvl == 1:
            for k in (0, 2): T.add(kick(True), b0 + k, 0, 0.5)
    return T, 0.28
def suspense(rng):      # 92 BPM tension: low drone, pulsing minor-second ostinato, clock ticks, dissonant highs (D minor)
    T = Track(92, rng)
    drone = lp_fast(saw(hz(26), T.n, (-6, 6)) + 0.6 * saw(hz(38), T.n, (-3, 3)), 260)
    drone *= 0.5 + 0.5 * np.clip(np.arange(T.n) / SR / 8, 0, 1)
    T.L += drone * 0.22; T.R += drone * 0.22
    for bar in range(T.beats // 4):
        b0 = bar * 4; up = 1 if bar >= 8 else 0
        for i in range(8): T.add(bass((38, 39)[i % 4 == 3] + 12 * up, 0.45, T.bpm, 700), b0 + i * 0.5, 0, 0.26)
        for h in range(4): T.add(hat(rng), b0 + h, (-0.5, 0.5)[h % 2], 0.16)
        if bar % 2 == 1: T.add(kick(True) * 0.9, b0 + 3.5, 0, 0.55)
        if bar % 4 == 2: T.add(pad([74, 75, 81], 4, T.bpm, 3000), b0, 0, 0.07)
        if bar >= 4 and bar % 4 == 0: T.add(kick(), b0, 0, 0.7); T.add(snare(rng) * 0.5, b0, 0, 0.3)
    return T, 0.35

os.makedirs(OUT, exist_ok=True)
for name, fn in [('hard', hard), ('chill', chill), ('inspirational', inspirational), ('suspense', suspense)]:
    rng = np.random.default_rng(SEED)
    T, wet = fn(rng)
    L, R = reverb(T.L, 2.4, wet, rng), reverb(T.R, 2.6, wet, rng)
    L, R = phone_eq(L), phone_eq(R)
    st = np.stack([L, R], 1); st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.4) * 0.9
    fade = np.clip((SECS - np.arange(T.n) / SR) / 3, 0, 1)[:, None]; st *= fade
    raw = (st * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-b:a', '192k', f'{OUT}/{name}.mp3'], input=raw, check=True)
    print('ok', name)
