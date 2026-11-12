// Family · transitions (clean-room). ONE frame element `transition` with a `kind` prop.
// Every kind is an overlay that COVERS the frame around the middle of the beat and then REVEALS it again.
// Pure function of t: p = 0..1 across [S,E], peak (full cover) at p = 0.5.
import React from 'react';
import { MONO } from '../tokens';
import { clamp, ease, lin } from '../motion';
import { Logo } from '../Icon';
import { STACK as K } from '../stack';

export type Dir = 'left' | 'right' | 'up' | 'down';
export type TransitionTone = 'orange' | 'navy' | 'ink' | 'white' | 'panel' | 'bg' | 'kit';
export type TransitionKind =
  | 'flip' | 'cube' | 'blur' | 'blur-dir' | 'blocks' | 'blinds' | 'burn' | 'dip' | 'glitch' | 'chromatic'
  | 'ripple' | 'vhs' | 'grid' | 'leak' | 'flash' | 'filmburn' | 'shutter' | 'clock' | 'drop' | 'morph'
  | 'push' | 'elastic' | 'squeeze' | 'iris' | 'diamond' | 'diagonal' | 'zoom' | 'zoomout';
export type TransitionProps = {
  kind: TransitionKind;
  tone?: TransitionTone;
  /** any CSS color, overrides tone */
  color?: string;
  dir?: Dir;
  /** blocks: 2 | 5 ..., blinds: strips, grid: columns, vhs: strips */
  count?: number;
  /** 0-1 strength: blur amount, dip peak opacity (0.6 = crossfade feel) */
  amount?: number;
  /** WiseFunnel logo in the middle of the panel while it covers */
  logo?: boolean;
};

type Base = { t: number; S: number; E: number; frame?: { w: number; h: number }; format?: string };

const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const io = ease.inOutCubic;
const bf = (px: number) => ({ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` } as React.CSSProperties);
const abs: React.CSSProperties = { position: 'absolute' };
const VEC: Record<Dir, [number, number]> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

type Ctx = {
  p: number; a: number; b: number; cv: number; tri: number; w: number; h: number; t: number; S: number; E: number;
  c1: string; c2: string; col: (i: number) => string; dir: Dir; vx: number; vy: number; horiz: boolean;
  n: number; amount: number | undefined; diag: number;
};

/** Rect covering [s,e] (0..1) of the travel axis, travelling in ctx.dir (u=0 = entry edge). */
const span = (c: Ctx, s: number, e: number, pad = 0): React.CSSProperties => {
  const { w, h, dir } = c;
  if (dir === 'right') return { ...abs, left: w * s - pad, width: w * (e - s) + pad * 2, top: 0, height: h };
  if (dir === 'left') return { ...abs, left: w * (1 - e) - pad, width: w * (e - s) + pad * 2, top: 0, height: h };
  if (dir === 'down') return { ...abs, top: h * s - pad, height: h * (e - s) + pad * 2, left: 0, width: w };
  return { ...abs, top: h * (1 - e) - pad, height: h * (e - s) + pad * 2, left: 0, width: w };
};
/** Rigid full-frame panel slid along the travel axis; off = -1 (before entry) .. 0 (covering) .. +1 (gone). */
const slab = (c: Ctx, off: number, extra = 0): React.CSSProperties => {
  const { w, h, vx, vy } = c;
  return { ...abs, left: -extra + vx * off * (w + extra), top: -extra * 0 + vy * off * h, width: w + extra * 2, height: h };
};

// ── kinds ────────────────────────────────────────────────────────────────────────────────
const KINDS: Record<TransitionKind, (c: Ctx) => React.ReactNode> = {
  flip: (c) => {
    const x = c.p * 2 - 1;
    const th = 180 + 180 * Math.sign(x) * Math.pow(Math.abs(x), 1.5);
    const ax = c.horiz ? 'rotateY' : 'rotateX';
    const face: React.CSSProperties = { ...abs, inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 40 * (1 - c.cv) };
    return (
      <div style={{ ...abs, inset: 0, perspective: 2400, opacity: clamp(c.tri * 5, 0, 1) }}>
        <div style={{ ...abs, left: -30, top: -30, width: c.w + 60, height: c.h + 60, transformStyle: 'preserve-3d', transform: `scale(${0.8 + 0.25 * c.cv}) ${ax}(${th * (c.vx + c.vy < 0 ? -1 : 1)}deg)` }}>
          <div style={{ ...face, background: c.c1 }} />
          <div style={{ ...face, background: c.c2, transform: `${ax}(180deg)` }} />
        </div>
      </div>
    );
  },
  cube: (c) => {
    const x = c.p * 2 - 1;
    const th = 90 * Math.sign(x) * Math.pow(Math.abs(x), 1.4) * (c.vx + c.vy > 0 ? -1 : 1);
    const ax = c.horiz ? 'rotateY' : 'rotateX';
    const depth = (c.horiz ? c.w : c.h) / 2;
    const shade = Math.abs(th) / 90;
    return (
      <div style={{ ...abs, inset: 0, perspective: 2600, overflow: 'hidden' }}>
        <div style={{ ...abs, inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-depth}px) ${ax}(${th}deg)` }}>
          <div style={{ ...abs, inset: 0, background: c.c1, transform: `translateZ(${depth}px)`, boxShadow: 'inset 0 0 160px rgba(0,0,0,0.25)' }}>
            <div style={{ ...abs, inset: 0, background: '#000', opacity: shade * 0.55 }} />
          </div>
        </div>
      </div>
    );
  },
  blur: (c) => {
    const px = (c.amount ?? 0.6) * 90 * c.cv;
    return (
      <>
        <div style={{ ...abs, inset: 0, ...bf(px) }} />
        <div style={{ ...abs, inset: 0, background: c.c1, opacity: c.cv * 0.18 }} />
      </>
    );
  },
  'blur-dir': (c) => {
    const L = c.diag * 0.9, bandW = L * 0.55;
    const pos = (c.p * 2 - 1) * (c.horiz ? c.w : c.h) * 1.1 * (c.vx + c.vy);
    const rot = c.horiz ? 18 : 78;
    const streaks = Array.from({ length: 14 }, (_, i) => (
      <div key={i} style={{ ...abs, top: hash(i + 3) * 100 + '%', left: 0, width: '100%', height: 3 + hash(i) * 6, background: c.c1, opacity: 0.18 + hash(i + 9) * 0.3 }} />
    ));
    return (
      <div style={{ ...abs, left: c.w / 2, top: c.h / 2, width: 0, height: 0 }}>
        <div style={{ ...abs, width: bandW, height: L * 1.8, left: -bandW / 2 + (c.horiz ? pos : 0), top: -L * 0.9 + (c.horiz ? 0 : pos), transform: `rotate(${rot}deg)`, ...bf(36), overflow: 'hidden', borderLeft: `10px solid ${c.c1}`, borderRight: `10px solid ${c.c2}` }}>
          <div style={{ ...abs, inset: 0, background: c.c1, opacity: 0.2 }} />
          <div style={{ ...abs, inset: 0, transform: 'rotate(-90deg) scale(2.2)' }}>{streaks}</div>
        </div>
      </div>
    );
  },
  blocks: (c) => {
    const n = Math.max(2, Math.round(c.n || 3)), W = 0.72, st = (1 - W) / (n - 1);
    return (
      <>
        {Array.from({ length: n }, (_, i) => {
          const q = io(lin(c.p, i * st, W));
          return <div key={i} style={{ ...abs, background: c.col(i), ...pos2(c, q) }} />;
        })}
      </>
    );
  },
  blinds: (c) => {
    const n = Math.max(2, Math.round(c.n || 8)), W = 0.55, st = (1 - W) / (n - 1);
    return (
      <>
        {Array.from({ length: n }, (_, i) => {
          const q = lin(c.p, i * st, W);
          const s = io(lin(q, 0.5, 0.5)), e = io(lin(q, 0, 0.5));
          const frac = 1 / n, a0 = i * frac, sz = frac + 0.004;
          const st2: React.CSSProperties = c.horiz
            ? { ...span(c, s, e, 1), top: c.h * a0, height: c.h * sz }
            : { ...span(c, s, e, 1), left: c.w * a0, width: c.w * sz };
          return <div key={i} style={{ ...st2, background: c.col(i) }} />;
        })}
      </>
    );
  },
  burn: (c) => {
    const o: Record<Dir, [number, number]> = { right: [0, c.h], left: [c.w, 0], up: [c.w, c.h], down: [0, 0] };
    const [ox, oy] = o[c.dir];
    const R = Math.hypot(c.w, c.h) * 1.15, N = 72;
    const poly = (r: number) => {
      let d = '';
      for (let k = 0; k < N; k++) {
        const th = (k / N) * Math.PI * 2;
        const nz = 1 + 0.07 * Math.sin(k * 1.9 + 1) + 0.05 * Math.sin(k * 4.7) + 0.06 * (hash(k) - 0.5);
        d += `${k ? 'L' : 'M'}${(ox + Math.cos(th) * r * nz).toFixed(1)} ${(oy + Math.sin(th) * r * nz).toFixed(1)}`;
      }
      return d + 'Z';
    };
    const r1 = R * ease.inCubic(c.a) * 0.4 + R * ease.outCubic(c.a) * 0.6, r2 = R * io(c.b);
    const id = `trb-${Math.round(c.S * 100)}`;
    const rim = (r: number, on: number) => on > 0.001 && on < 0.999 ? (
      <>
        <path d={poly(r)} fill="none" stroke="#FF5A1F" strokeWidth={46} opacity={0.9} filter={`url(#${id}f)`} />
        <path d={poly(r)} fill="none" stroke="#FFD25A" strokeWidth={12} opacity={0.95} />
      </>
    ) : null;
    return (
      <svg width={c.w} height={c.h} style={abs}>
        <defs>
          <filter id={`${id}f`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
          <mask id={id}><rect width={c.w} height={c.h} fill="#000" /><path d={poly(r1)} fill="#fff" /><path d={poly(r2)} fill="#000" /></mask>
        </defs>
        <rect width={c.w} height={c.h} fill="#15100C" mask={`url(#${id})`} />
        {rim(r1, c.a)}{rim(r2, c.b)}
      </svg>
    );
  },
  dip: (c) => <div style={{ ...abs, inset: 0, background: c.c1, opacity: clamp(c.amount ?? 1, 0, 1) * c.cv }} />,
  glitch: (c) => {
    const f = Math.floor(c.t * 22), N = 16;
    const hot = c.tri;
    const pal = ['#FF1A4B', '#19E6FF', '#FFFFFF', '#FFE600'];
    return (
      <>
        <div style={{ ...abs, inset: 0, background: c.c1, opacity: c.cv * 0.35 }} />
        {Array.from({ length: N }, (_, i) => {
          const r = hash(f * 17.3 + i * 3.1);
          if (r > hot * 1.25) return null;
          const k = Math.floor(hash(f + i * 7.7) * pal.length);
          return <div key={i} style={{ ...abs, top: hash(f * 5 + i) * c.h, height: 12 + hash(f + i * 2) * 150, left: (hash(f * 3 + i) - 0.5) * 220, width: c.w * (0.5 + hash(i + f * 9) * 0.7), background: pal[k], mixBlendMode: k === 2 ? 'difference' : 'normal', opacity: 0.55 + 0.4 * hash(i * 4 + f) }} />;
        })}
        {c.tri > 0.92 && <div style={{ ...abs, inset: 0, background: '#fff', opacity: (c.tri - 0.92) * 12 }} />}
      </>
    );
  },
  chromatic: (c) => {
    const lag = 0.07;
    const layers: [string, number][] = [['#FF2D3D', 0], ['#27E36B', 1], ['#2D6BFF', 2], [c.c1, 3]];
    return (
      <>
        {layers.map(([col, i]) => {
          const q = io(lin(c.p, (3 - i) * lag * 0.6, 1 - 3 * lag * 0.6));
          return <div key={i} style={{ ...abs, background: col, ...pos2(c, q) }} />;
        })}
      </>
    );
  },
  ripple: (c) => {
    const R = c.diag * 0.62;
    return (
      <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
        <div style={{ ...abs, inset: 0, background: `radial-gradient(circle at 50% 50%, ${c.c1}, transparent 70%)`, opacity: c.tri * 0.45 }} />
        {Array.from({ length: 7 }, (_, i) => {
          const q = lin(c.p, i * 0.075, 0.55);
          const r = ease.outCubic(q) * R;
          return <div key={i} style={{ ...abs, left: c.w / 2 - r, top: c.h / 2 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${10 + 8 * (1 - q)}px solid ${i % 2 ? c.c2 : c.c1}`, opacity: Math.sin(q * Math.PI) * 0.6, boxSizing: 'border-box', ...bf(6 + 8 * q) }} />;
        })}
      </div>
    );
  },
  vhs: (c) => {
    const n = Math.max(6, Math.round(c.n || 20)), f = Math.floor(c.t * 18);
    const hh = c.h / n;
    return (
      <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: n }, (_, i) => {
          const q = io(lin(c.p, hash(i) * 0.3, 0.7));
          const cover = clamp(1 - Math.abs(q * 2 - 1), 0, 1);
          const jit = (hash(f + i * 1.7) - 0.5) * 140 * (1 - cover);
          const side = hash(i + 40) > 0.5 ? 1 : -1;
          const x = (q < 0.5 ? (1 - q * 2) : -(q * 2 - 1)) * c.w * side + jit;
          return <div key={i} style={{ ...abs, left: x, width: c.w + 2, top: i * hh, height: hh + 1, background: i % 2 ? K.bg : K.panel, boxShadow: '8px 0 0 rgba(255,30,60,0.55), -8px 0 0 rgba(30,220,255,0.55)' }} />;
        })}
        <div style={{ ...abs, inset: 0, opacity: c.cv, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 6px)' }} />
        <div style={{ ...abs, left: 0, width: '100%', height: 120, top: ((c.t * 700) % (c.h + 240)) - 120, background: 'linear-gradient(transparent, rgba(255,255,255,0.35), transparent)', opacity: c.tri }} />
        <div style={{ ...abs, left: 40, top: 70, fontFamily: MONO, fontSize: 40, fontWeight: 800, color: K.ink, opacity: c.cv }}>PLAY ▶</div>
      </div>
    );
  },
  grid: (c) => {
    const cols = Math.max(3, Math.round(c.n || 8)), cs = c.w / cols, rows = Math.ceil(c.h / cs);
    const out: React.ReactNode[] = [];
    const mx = Math.hypot(cols / 2, rows / 2);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const d = Math.hypot(q + 0.5 - cols / 2, r + 0.5 - rows / 2) / mx;
      const s = ease.outCubic(lin(c.p, d * 0.25, 0.25)) * (1 - ease.inCubic(lin(c.p, 0.55 + d * 0.25, 0.2)));
      if (s <= 0.002) continue;
      out.push(<div key={r * 99 + q} style={{ ...abs, left: q * cs - 1, top: r * cs - 1, width: cs + 2, height: cs + 2, background: c.col(q + r), transform: `scale(${s * 1.02})`, borderRadius: cs * 0.18 * (1 - s) }} />);
    }
    return <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>{out}</div>;
  },
  leak: (c) => (
    <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(110deg, #FF7A18 0%, #FFB347 45%, #FF5E3A 100%)', opacity: c.cv * 0.9 }} />
      {[0, 1, 2, 3].map((i) => {
        const x = (c.p * 1.7 - 0.35) * c.w + (hash(i + 5) - 0.5) * c.w * 0.5 * (i % 2 ? 1 : -1);
        const y = c.h * (0.15 + hash(i) * 0.7), r = 380 + hash(i + 2) * 380;
        return <div key={i} style={{ ...abs, left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${i % 2 ? '#FFF1C2' : '#FFD98A'}, transparent 68%)`, mixBlendMode: 'screen', opacity: 0.4 + 0.6 * c.tri }} />;
      })}
    </div>
  ),
  flash: (c) => {
    const o = clamp(Math.pow(c.tri, 2.2) * 1.15, 0, 1);
    return (
      <>
        <div style={{ ...abs, inset: 0, background: c.c1, opacity: o }} />
        <div style={{ ...abs, inset: 0, background: 'radial-gradient(circle at 50% 50%, #fff, transparent 65%)', opacity: clamp(c.tri * 1.4, 0, 1) }} />
      </>
    );
  },
  filmburn: (c) => {
    const [vx, vy] = VEC[c.dir];
    // origin edge is the one the travel starts from
    const ox = vx > 0 ? 0 : vx < 0 ? c.w : c.w / 2, oy = vy > 0 ? 0 : vy < 0 ? c.h : c.h / 2;
    const R = c.diag * 0.75 * (0.15 + 0.95 * c.cv);
    const cols = ['#FFC24A', '#FF8A1F', '#E5321E', '#FF5A1F'];
    return (
      <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
        <div style={{ ...abs, inset: 0, filter: 'blur(26px)', transform: 'scale(1.1)' }}>
          {cols.map((col, i) => {
            const r = R * (0.55 + hash(i + 1) * 0.55), px = ox + (c.horiz ? 0 : (hash(i) - 0.5) * c.w), py = oy + (c.horiz ? (hash(i + 7) - 0.5) * c.h : 0);
            return <div key={i} style={{ ...abs, left: px - r, top: py - r, width: r * 2, height: r * 2, borderRadius: '50%', background: col, opacity: 0.9 }} />;
          })}
          <div style={{ ...abs, inset: 0, background: `linear-gradient(${c.horiz ? (vx > 0 ? 'to right' : 'to left') : vy > 0 ? 'to bottom' : 'to top'}, #E5321E, #FF8A1F ${100 * c.cv}%, transparent ${130 * c.cv + 1}%)`, opacity: c.cv }} />
        </div>
        <div style={{ ...abs, inset: 0, background: '#FFE9A8', opacity: Math.pow(c.tri, 6) * 0.55, mixBlendMode: 'screen' }} />
      </div>
    );
  },
  shutter: (c) => {
    const e = io(c.cv), sh = '0 0 60px rgba(0,0,0,0.35)';
    if (c.horiz) return (
      <>
        <div style={{ ...abs, left: 0, top: 0, width: (c.w / 2) * e + 1, height: c.h, background: c.c1, boxShadow: sh }} />
        <div style={{ ...abs, right: 0, top: 0, width: (c.w / 2) * e + 1, height: c.h, background: c.c2, boxShadow: sh }} />
        <div style={{ ...abs, left: c.w / 2 - 4, top: 0, width: 8, height: c.h, background: K.orange, opacity: e > 0.97 ? 1 : 0 }} />
      </>
    );
    return (
      <>
        <div style={{ ...abs, top: 0, left: 0, height: (c.h / 2) * e + 1, width: c.w, background: c.c1, boxShadow: sh }} />
        <div style={{ ...abs, bottom: 0, left: 0, height: (c.h / 2) * e + 1, width: c.w, background: c.c2, boxShadow: sh }} />
        <div style={{ ...abs, top: c.h / 2 - 4, left: 0, height: 8, width: c.w, background: K.orange, opacity: e > 0.97 ? 1 : 0 }} />
      </>
    );
  },
  clock: (c) => {
    const a1 = 360 * io(c.a), a0 = 360 * io(c.b);
    const ang = c.b > 0 ? a0 : a1;
    return (
      <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
        <div style={{ ...abs, left: c.w / 2 - c.diag, top: c.h / 2 - c.diag, width: c.diag * 2, height: c.diag * 2, background: `conic-gradient(from 0deg, transparent 0deg ${a0}deg, ${c.c1} ${a0}deg ${a1}deg, transparent ${a1}deg 360deg)` }} />
        {c.cv > 0.001 && c.cv < 0.999 && <div style={{ ...abs, left: c.w / 2 - 5, top: c.h / 2 - c.diag, width: 10, height: c.diag, background: K.orange, transformOrigin: '50% 100%', transform: `rotate(${ang}deg)`, borderRadius: 5 }} />}
      </div>
    );
  },
  drop: (c) => {
    const y = c.b > 0 ? ease.inCubic(c.b) * c.h * 1.3 : -(1 - ease.inCubic(c.a)) * (c.h + 120);
    const rot = ease.inCubic(c.b) * 28 * (c.vx >= 0 ? 1 : -1);
    return (
      <div style={{ ...abs, left: -40, width: c.w + 80, top: y, height: c.h, transform: `rotate(${rot}deg)`, transformOrigin: c.vx >= 0 ? '0% 100%' : '100% 100%', background: c.c1, borderBottom: `40px solid ${c.c2}`, boxSizing: 'border-box', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }} />
    );
  },
  morph: (c) => {
    const R = c.diag * 0.52 * ease.outCubic(c.a) * 1.02;
    return <div style={{ ...abs, left: c.w / 2 - R, top: c.h / 2 - R, width: R * 2, height: R * 2, borderRadius: '50%', background: c.c1, opacity: 1 - io(c.b), transform: `scale(${1 + 0.12 * c.b})`, ...(c.b > 0 ? bf(0) : null) }} />;
  },
  push: (c) => {
    const q = io(c.p), off = q < 0.5 ? 1 - q * 2 : -(q * 2 - 1);
    const o: React.CSSProperties = { ...slab(c, -off, 0) };
    return (
      <>
        <div style={{ ...o, background: c.c1, boxShadow: '0 0 80px rgba(0,0,0,0.25)' }} />
        <div style={{ ...slab(c, -off * 1.0 + (q < 0.5 ? 0.03 : -0.03), 0), background: c.c2, zIndex: -1 }} />
      </>
    );
  },
  elastic: (c) => {
    const ob = (x: number) => 1 + 4.2 * Math.pow(x - 1, 3) + 3.2 * Math.pow(x - 1, 2);
    const ib = (x: number) => 4.2 * x * x * x - 3.2 * x * x;
    const off = c.b > 0 ? -ib(c.b) : 1 - ob(c.a); // +1 before, 0 cover, overshoot <0, -1 gone
    const ex = 0.35, dist = (c.horiz ? c.w : c.h) * (c.vx + c.vy) * -off * -1;
    const W = c.horiz ? c.w * (1 + 2 * ex) : c.w, H = c.horiz ? c.h : c.h * (1 + 2 * ex);
    return (
      <div style={{ ...abs, left: c.horiz ? -c.w * ex : 0, top: c.horiz ? 0 : -c.h * ex, width: W, height: H, background: c.c1, transform: `translate(${c.horiz ? -dist : 0}px, ${c.horiz ? 0 : -dist}px)`, boxShadow: '0 0 80px rgba(0,0,0,0.25)' }}>
        <div style={c.horiz ? { ...abs, top: 0, height: '100%', width: 40, [c.vx > 0 ? 'right' : 'left']: c.w * ex - 40, background: c.c2 } : { ...abs, left: 0, width: '100%', height: 40, [c.vy > 0 ? 'bottom' : 'top']: c.h * ex - 40, background: c.c2 }} />
      </div>
    );
  },
  squeeze: (c) => {
    const s = io(Math.pow(c.b, 0.9)), e = io(Math.pow(c.a, 1.1));
    return (
      <>
        <div style={{ ...span(c, s, e, 1), background: c.c1 }} />
        <div style={{ ...span(c, Math.max(s, e - 0.02), e, 0), background: c.c2, opacity: c.a < 1 ? 1 : 0 }} />
      </>
    );
  },
  iris: (c) => irisShape(c, false),
  diamond: (c) => irisShape(c, true),
  diagonal: (c) => {
    const s = io(c.b) * 100, e = io(c.a) * 100;
    const ang: Record<Dir, string> = { right: 'to bottom right', left: 'to top left', down: 'to bottom left', up: 'to top right' };
    const g = (a: number, b: number, col: string) => `linear-gradient(${ang[c.dir]}, transparent ${a}%, ${col} ${a}%, ${col} ${b}%, transparent ${b}%)`;
    return (
      <>
        <div style={{ ...abs, inset: 0, background: g(s, e, c.c1) }} />
        <div style={{ ...abs, inset: 0, background: g(Math.max(s, e - 3.5), e, c.c2), opacity: c.a < 1 ? 1 : 0 }} />
      </>
    );
  },
  zoom: (c) => {
    const s = Math.pow(0.03, 1 - 2 * c.p);
    const op = 1 - ease.inCubic(lin(c.p, 0.62, 0.3));
    const W = c.w * 1.4, H = c.h * 1.4;
    return (
      <div style={{ ...abs, inset: 0, overflow: 'hidden' }}>
        <div style={{ ...abs, inset: 0, ...bf(40 * c.tri) }} />
        <div style={{ ...abs, left: c.w / 2 - W / 2, top: c.h / 2 - H / 2, width: W, height: H, background: c.c1, transform: `scale(${s})`, borderRadius: 120, opacity: clamp(c.p * 8, 0, 1) * op, boxShadow: `0 0 0 ${60 / Math.max(s, 0.1)}px ${c.c2}` }} />
        <div style={{ ...abs, inset: 0, background: `repeating-conic-gradient(from 0deg at 50% 50%, ${c.c2} 0deg 0.6deg, transparent 0.6deg 7deg)`, WebkitMaskImage: 'radial-gradient(circle, transparent 18%, #000 80%)', maskImage: 'radial-gradient(circle, transparent 18%, #000 80%)', opacity: c.tri * 0.55 }} />
      </div>
    );
  },
  zoomout: (c) => {
    const sc = c.b > 0 ? 1 - 0.8 * io(c.b) : 1.5 - 0.5 * ease.outCubic(c.a);
    const op = c.b > 0 ? 1 - ease.inCubic(lin(c.b, 0.55, 0.45)) : clamp(c.a * 2.5, 0, 1);
    return <div style={{ ...abs, inset: 0, background: c.c1, transform: `scale(${sc})`, borderRadius: 70 * io(c.b), opacity: op, boxShadow: c.b > 0 ? '0 50px 120px rgba(0,0,0,0.35)' : 'none', border: c.b > 0 ? `14px solid ${c.c2}` : 'none', boxSizing: 'border-box' }} />;
  },
};

/** offset a rigid panel along travel axis (position only; used by blocks/chromatic). q in 0..1 across the whole pass. */
function pos2(c: Ctx, q: number): React.CSSProperties {
  const off = q < 0.5 ? 1 - q * 2 : -(q * 2 - 1);
  // entering from the opposite side of dir, leaving through dir side
  const d = -off; // -1 before entry .. 0 cover .. +1 gone (in travel direction)
  return c.horiz
    ? { left: -c.w * 0.05 + c.vx * d * c.w * 1.1, top: 0, width: c.w * 1.1, height: c.h }
    : { left: 0, top: -c.h * 0.05 + c.vy * d * c.h * 1.1, width: c.w, height: c.h * 1.1 };
}

function irisShape(c: Ctx, diamond: boolean) {
  const cx = c.w / 2, cy = c.h / 2;
  const Rmax = diamond ? (c.w + c.h) / 2 * 1.05 : c.diag / 2 * 1.04;
  const r1 = Rmax * ease.outCubic(c.a), r2 = Rmax * io(c.b);
  const sh = (r: number) => diamond
    ? `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`
    : `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const ringR = c.b > 0 ? r2 : r1;
  return (
    <svg width={c.w} height={c.h} style={abs}>
      <path d={sh(r1) + (r2 > 0 ? sh(r2) : '')} fill={c.c1} fillRule="evenodd" />
      {c.cv > 0.003 && c.cv < 0.997 && <path d={sh(ringR)} fill="none" stroke={K.orange} strokeWidth={26} strokeLinejoin="round" />}
    </svg>
  );
}

// ── element ──────────────────────────────────────────────────────────────────────────────
const toneCol = (tone: TransitionTone | undefined): [string, string] => {
  switch (tone) {
    case 'navy': return [K.navy, K.orange];
    case 'ink': return [K.ink, K.orange];
    case 'white': return ['#FFFFFF', K.orange];
    case 'panel': return [K.panel, K.orange];
    case 'bg': return [K.bg, K.orange];
    case 'kit': return [K.orange, K.navy];
    default: return [K.orange, K.navy];
  }
};

export const Transition: React.FC<Base & TransitionProps> = ({ t, S, E, frame, format, kind, tone, color, dir = 'left', count, amount, logo }) => {
  const w = frame?.w ?? (format === 'horizontal' ? 1920 : 1080), h = frame?.h ?? (format === 'horizontal' ? 1080 : 1920);
  const p = clamp((t - S) / Math.max(0.001, E - S), 0, 1);
  if (t < S || t > E) return null;
  const tri = 1 - Math.abs(2 * p - 1);
  const cv = io(clamp(tri * 1.7, 0, 1));
  const [t1, t2] = toneCol(tone);
  const c1 = color ?? t1, c2 = color ? (tone === 'kit' ? K.navy : t2) : t2;
  const [vx, vy] = VEC[dir];
  const ctx: Ctx = {
    p, a: lin(p, 0, 0.5), b: lin(p, 0.5, 0.5), cv, tri, w, h, t, S, E, c1, c2,
    col: (i) => (tone === 'kit' || (!tone && !color) ? (i % 2 ? c2 : c1) : i % 2 ? c2 : c1),
    dir: dir as Dir, vx, vy, horiz: vx !== 0, n: count ?? 0, amount, diag: Math.hypot(w, h),
  };
  const fn = KINDS[kind] ?? KINDS.dip;
  const lo = clamp((cv - 0.75) / 0.25, 0, 1);
  return (
    <div style={{ ...abs, left: 0, top: 0, width: w, height: h, overflow: 'hidden', pointerEvents: 'none' }}>
      {fn(ctx)}
      {logo && lo > 0 && (
        <div style={{ ...abs, left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: lo, transform: `scale(${0.8 + 0.2 * lo})` }}>
          <Logo size={Math.min(w, h) * 0.26} />
        </div>
      )}
    </div>
  );
};

export const FX_TRANSITIONS: Record<string, { C: React.FC<any>; sfx: () => any[]; frame?: true; box?: (p: any, format?: string) => { x0: number; y0: number; x1: number; y1: number } }> = {
  transition: { C: Transition, sfx: () => [], frame: true },
};
