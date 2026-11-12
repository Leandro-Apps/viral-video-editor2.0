// fx2 · family cards3d (original implementation). Cards, tiles and logos with depth: coverflow, flips, tilts, morphs, grids, clouds and orbits.
// Everything is a pure function of `t` (seconds). `at` / `clickAt` / item `at` values are absolute video time, like the rest of the kit.
// Colours come from STACK (read at render time), so light and dark themes both work. Skin 'kit' only.
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { FONT, MONO } from '../tokens';
import { clamp, ease, lin } from '../motion';
import { Ic, Logo } from '../Icon';
import { BrandLogo } from '../real';
import { STACK as K } from '../stack';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number; skin?: string; format?: string; onDark?: boolean };
type Box = { x0: number; y0: number; x1: number; y1: number };

// ── helpers ───────────────────────────────────────────────────────────────────────────────
const CX = 540;
const expOut = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const hash = (i: number, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 7.3) * 43758.5453; return x - Math.floor(x); };
const mixN = (a: number, b: number, p: number) => a + (b - a) * p;
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fade = (t: number, S: number, E: number, o = 0.25) => ease.outCubic(lin(t, S, o)) * (1 - ease.inCubic(lin(t, E - o, o)));
const pop = (t: number, at: number, d = 0.45) => ease.outBack(lin(t, at, d));
const op = (p: number) => clamp(p * 2, 0, 1);
const ink = (d?: boolean) => (d ? '#FFFFFF' : K.ink);
const soft = (d?: boolean) => (d ? 'rgba(255,255,255,0.68)' : 'rgba(27,26,23,0.55)');
const cardSt = (): React.CSSProperties => ({ background: K.panel, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 30px 60px -24px rgba(20,20,20,0.42), 0 2px 8px rgba(20,20,20,0.08)', boxSizing: 'border-box' });
const parseHex = (h: string): [number, number, number] | null => { const m = /^#([0-9a-f]{6})$/i.exec(h); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : null; };
const mixColor = (a: string, b: string, p: number) => {
  const A = parseHex(a), B = parseHex(b);
  if (!A || !B) return p < 0.5 ? a : b;
  return `rgb(${Math.round(mixN(A[0], B[0], p))},${Math.round(mixN(A[1], B[1], p))},${Math.round(mixN(A[2], B[2], p))})`;
};
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);
const AVC = () => [K.orange, K.navy, '#2EA56A', '#7C5CFC', '#E15A36', '#0EA5E9'];
const INITIALS = ['AM', 'JS', 'LK', 'RT', 'PB', 'CD', 'MN', 'EV', 'HG', 'OF', 'QW', 'ZX', 'YU', 'IT', 'BN', 'KL'];
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) => `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`;
const none = () => [] as SfxCue[];

const Wrap: React.FC<Base & { children?: React.ReactNode }> = ({ t, S, E, children }) => (
  <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E) }}>{children}</div>
);

const Eyebrow: React.FC<{ text: string; y: number; o: number; onDark?: boolean }> = ({ text, y, o, onDark }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 38, letterSpacing: 7, textTransform: 'uppercase', color: ink(onDark), opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>{text}</div>
);

const Pill: React.FC<{ text: string; bg?: string; fg?: string; size?: number }> = ({ text, bg, fg = '#fff', size = 26 }) => (
  <div style={{ display: 'inline-block', padding: '8px 22px', borderRadius: 99, background: bg ?? K.orange, color: fg, fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{text}</div>
);

/** screenshot / video / generated placeholder that fills its parent */
const Media: React.FC<{ src?: string; i?: number; text?: string }> = ({ src, i = 0, text }) => {
  if (src) {
    return isVid(src)
      ? <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />;
  }
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(145deg, ${mixColor(K.navy, K.orange, 0.15 + hash(i) * 0.6)}, ${K.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 120, color: 'rgba(255,255,255,0.85)', letterSpacing: -4 }}>{text ?? String(i + 1).padStart(2, '0')}</div>
  );
};

export type GItem = { slug?: string; icon?: string; label?: string; src?: string };
const ItemTile: React.FC<{ it: GItem; size: number; i?: number }> = ({ it, size, i = 0 }) => {
  if (it.slug) return <BrandLogo slug={it.slug} size={size} skin="kit" />;
  if (it.src) return <div style={{ ...cardSt(), width: size, height: size, borderRadius: size * 0.2, overflow: 'hidden' }}><Media src={it.src} i={i} /></div>;
  return (
    <div style={{ ...cardSt(), width: size, height: size, borderRadius: size * 0.26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {it.icon ? <Ic n={it.icon} size={size * 0.5} color={K.orange} sw={2.4} /> : <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.4, color: K.orange }}>{(it.label ?? '•').slice(0, 1).toUpperCase()}</div>}
    </div>
  );
};

const Avatar: React.FC<{ i: number; size: number }> = ({ i, size }) => (
  <div style={{ width: size, height: size, borderRadius: 999, background: AVC()[i % 6], border: `${Math.max(3, size * 0.06)}px solid ${K.panel}`, boxShadow: '0 14px 28px -10px rgba(20,20,20,0.45)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: size * 0.34, color: '#fff', letterSpacing: 1 }}>{INITIALS[i % INITIALS.length]}</div>
);

const AvatarRing: React.FC<{ t: number; start: number; n: number; cy: number; rx: number; ry: number; size: number; lineOp?: number }> = ({ t, start, n, cy, rx, ry, size, lineOp = 1 }) => {
  const pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return { x: CX + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }; });
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        {pts.map((p, i) => {
          const g = ease.outCubic(lin(t, start + i * 0.07 + 0.1, 0.5));
          return <line key={i} x1={CX} y1={cy} x2={mixN(CX, p.x, g)} y2={mixN(cy, p.y, g)} stroke={K.orange} strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" strokeDashoffset={-t * 36} opacity={0.55 * lineOp} />;
        })}
      </svg>
      {pts.map((p, i) => {
        const pp = pop(t, start + i * 0.07, 0.45);
        const fy = Math.sin(t * 1.3 + i * 1.7) * 6;
        return <div key={i} style={{ position: 'absolute', left: p.x - size / 2, top: p.y - size / 2 + fy, opacity: op(pp), transform: `scale(${0.3 + 0.7 * pp})` }}><Avatar i={i} size={size} /></div>;
      })}
    </>
  );
};

// ── 1 · coverflow ─────────────────────────────────────────────────────────────────────────
export type CoverflowProps = { covers?: string[]; n?: number; stop?: number; at?: number; brake?: number; label?: string; y?: number };
const Coverflow: React.FC<Base & CoverflowProps> = ({ t, S, E, onDark, covers = [], n = 9, stop = 6, at, brake = 2.4, label, y = 560 }) => {
  const t0 = at ?? S + 0.15;
  const N = Math.max(3, n), st = clamp(stop, 0, N - 1);
  const u = lin(t, t0, brake);
  const pos = -2 + (st + 2) * expOut(u);
  const speed = ((st + 2) * 10 * Math.LN2 * Math.pow(2, -10 * u)) / brake;
  const blur = u >= 1 ? 0 : clamp(speed * 0.22, 0, 9);
  const cardY = y + 80 + 310, bar = lin(t, t0 + brake + 0.15, Math.max(1.4, E - t0 - brake - 0.5));
  const glow = ease.outCubic(lin(t, t0 + brake * 0.85, 0.5));
  const list = Array.from({ length: N }, (_, i) => ({ i, d: i - pos })).filter((c) => Math.abs(c.d) < 4.2).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  return (
    <Wrap t={t} S={S} E={E}>
      {label && <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: ease.outCubic(lin(t, S + 0.1, 0.4)) }}><Pill text={label} /></div>}
      <div style={{ position: 'absolute', left: CX, top: cardY, width: 0, height: 0, perspective: 1500 }}>
        {list.map(({ i, d }) => {
          const a = Math.abs(d), s = Math.sign(d);
          const x = clamp(d, -1, 1) * 300 + (a > 1 ? (d - s) * 190 : 0);
          const focus = glow * (1 - clamp(a, 0, 1));
          return (
            <div key={i} style={{ position: 'absolute', left: -200, top: -310, width: 400, height: 620, borderRadius: 36, overflow: 'hidden', zIndex: 100 - Math.round(a * 10), opacity: 1 - clamp((a - 3) / 1.2, 0, 1), transform: `translate3d(${x}px,0,${-a * 140}px) rotateY(${-clamp(d, -1, 1) * 58}deg) scale(${1 + 0.06 * focus})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, boxShadow: `0 30px 60px -24px rgba(20,20,20,0.5), 0 0 ${70 * focus}px ${12 * focus}px ${K.orange}${focus > 0.02 ? '' : ''}`, border: `${2 + 6 * focus}px solid ${focus > 0.05 ? K.orange : 'rgba(255,255,255,0.7)'}`, boxSizing: 'border-box', background: K.panel }}>
              <Media src={covers.length ? covers[i % covers.length] : undefined} i={i} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: CX - 280, top: y + 80 + 620 + 60, width: 560, height: 14, borderRadius: 99, background: onDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)', opacity: ease.outCubic(lin(t, t0 + brake * 0.7, 0.4)) }}>
        <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 99, background: K.orange, boxShadow: `0 0 20px ${K.orange}` }} />
      </div>
    </Wrap>
  );
};

// ── 2 · flipProof ─────────────────────────────────────────────────────────────────────────
export type FlipProofProps = { before: string; after: string; from: number; to: number; label?: string; prefix?: string; suffix?: string; at?: number; y?: number; beforeLabel?: string; afterLabel?: string };
const FlipProof: React.FC<Base & FlipProofProps> = ({ t, S, E, onDark, before, after, from, to, label, prefix = '', suffix = '', at, y = 560, beforeLabel = 'BEFORE', afterLabel = 'AFTER' }) => {
  const a = at ?? S + 1.2;
  const enter = pop(t, S + 0.05, 0.55);
  const fp = ease.inOutCubic(lin(t, a, 0.85));
  const rot = 180 * fp;
  const cs = lin(t, a + 0.5, 1.5), te = a + 2.0;
  const val = mixN(from, to, ease.outCubic(cs));
  const sc = 1 + 0.1 * cs + (t >= te ? 0.14 * Math.exp(-(t - te) * 6) * Math.cos((t - te) * 14) : 0);
  const numY = y + 20 + 500 + 60;
  const faceSt: React.CSSProperties = { position: 'absolute', inset: 0, borderRadius: 34, overflow: 'hidden', backfaceVisibility: 'hidden', border: '1px solid rgba(0,0,0,0.1)', background: K.panel };
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', left: CX, top: y + 20 + 250, width: 0, height: 0, perspective: 1600, opacity: op(enter) }}>
        <div style={{ position: 'absolute', left: -390, top: -250, width: 780, height: 500, transformStyle: 'preserve-3d', transform: `translateY(${(1 - enter) * 60}px) rotateX(${8 + Math.sin((t - S) * 1.6) * 2}deg) rotateY(${-14 + rot}deg) scale(${(0.9 + 0.1 * enter) * (1 + 0.06 * Math.sin(Math.PI * fp))})`, boxShadow: '0 40px 70px -30px rgba(20,20,20,0.5)', borderRadius: 34 }}>
          <div style={faceSt}><Media src={before} /><div style={{ position: 'absolute', left: 22, top: 22 }}><Pill text={beforeLabel} bg="#6B7280" size={24} /></div></div>
          <div style={{ ...faceSt, transform: 'rotateY(180deg)', boxShadow: `0 0 0 6px ${K.orange}` }}><Media src={after} /><div style={{ position: 'absolute', left: 22, top: 22 }}><Pill text={afterLabel} size={24} /></div></div>
        </div>
      </div>
      {Array.from({ length: 16 }, (_, i) => {
        const life = 1.1, per = life + 0.5, b = a + 0.6 + hash(i) * 1.2;
        if (t < b) return null;
        const age = ((t - b) % per) / life;
        if (age > 1) return null;
        const sz = 8 + hash(i, 3) * 10;
        return <div key={i} style={{ position: 'absolute', left: CX + (hash(i, 1) - 0.5) * 540 - sz / 2, top: numY + 100 - age * (200 + hash(i, 2) * 160), width: sz, height: sz, borderRadius: 99, background: i % 3 ? K.orange : '#FBBF24', opacity: (1 - age) * 0.9, boxShadow: `0 0 14px ${K.orange}` }} />;
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: numY, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 150, letterSpacing: -6, lineHeight: 1.05, color: t >= a + 0.5 ? K.orange : ink(onDark), fontVariantNumeric: 'tabular-nums', opacity: ease.outCubic(lin(t, S + 0.4, 0.4)), transform: `scale(${sc})` }}>{prefix}{fmt(val)}{suffix}</div>
      {label && <div style={{ position: 'absolute', left: 0, right: 0, top: numY + 170, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: soft(onDark), opacity: ease.outCubic(lin(t, S + 0.5, 0.4)) }}>{label}</div>}
    </Wrap>
  );
};

// ── 3 · sliderProof ───────────────────────────────────────────────────────────────────────
export type SliderProofProps = { before: string; after: string; from: number; to: number; label?: string; prefix?: string; suffix?: string; at?: number; y?: number; fromLabel?: string; toLabel?: string };
const SliderProof: React.FC<Base & SliderProofProps> = ({ t, S, E, onDark, before, after, from, to, label, prefix = '', suffix = '', at, y = 560, fromLabel = 'BEFORE', toLabel = 'AFTER' }) => {
  const a = at ?? S + 1.2;
  const enter = pop(t, S + 0.05, 0.5);
  const p = ease.inOutCubic(lin(t, a, 1.5));
  const curve = (x: number) => (Math.exp(3.2 * x) - 1) / (Math.exp(3.2) - 1);
  const W0 = 880, H0 = 440, sx = p * W0;
  const cw = 880, ch = 230, cy0 = y + H0 + 50;
  const pts = Array.from({ length: 41 }, (_, i) => { const x = i / 40; return [x * cw, ch - curve(x) * (ch - 20) - 10] as const; });
  const upto = pts.filter((q) => q[0] <= p * cw + 0.001);
  const d = upto.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  const dot = [p * cw, ch - curve(p) * (ch - 20) - 10];
  const val = mixN(from, to, curve(p));
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', left: 100, top: y, width: W0, height: H0, borderRadius: 34, overflow: 'hidden', ...cardSt(), opacity: op(enter), transform: `translateY(${(1 - enter) * 50}px) scale(${0.92 + 0.08 * enter})` }}>
        <div style={{ position: 'absolute', inset: 0 }}><Media src={before} /></div>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${W0 - sx}px 0 0)` }}><Media src={after} /></div>
        <div style={{ position: 'absolute', left: 20, top: 20, opacity: p > 0.12 ? 1 : 0 }}><Pill text={toLabel} size={22} /></div>
        <div style={{ position: 'absolute', right: 20, top: 20, opacity: p < 0.88 ? 1 : 0 }}><Pill text={fromLabel} bg="#6B7280" size={22} /></div>
        <div style={{ position: 'absolute', left: sx - 3, top: 0, width: 6, height: H0, background: K.orange, boxShadow: `0 0 24px ${K.orange}` }} />
        <div style={{ position: 'absolute', left: sx - 32, top: H0 / 2 - 32, width: 64, height: 64, borderRadius: 99, background: K.orange, border: '5px solid #fff', boxShadow: '0 10px 24px -6px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 28 }}>‹›</div>
      </div>
      <svg width={cw} height={ch} style={{ position: 'absolute', left: 100, top: cy0, overflow: 'visible', opacity: ease.outCubic(lin(t, a - 0.2, 0.4)) }}>
        <line x1={0} y1={ch - 4} x2={cw} y2={ch - 4} stroke={onDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'} strokeWidth={3} />
        {upto.length > 1 && <path d={d} fill="none" stroke={K.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={dot[0]} cy={dot[1]} r={16} fill={K.orange} stroke="#fff" strokeWidth={5} />
      </svg>
      <div style={{ position: 'absolute', left: 130, top: cy0 - 10, fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: -4, color: ink(onDark), fontVariantNumeric: 'tabular-nums', opacity: ease.outCubic(lin(t, a - 0.2, 0.4)) }}>{prefix}{fmt(val)}{suffix}</div>
      {label && <div style={{ position: 'absolute', left: 134, top: cy0 + 100, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: soft(onDark), opacity: ease.outCubic(lin(t, a - 0.2, 0.4)) }}>{label}</div>}
    </Wrap>
  );
};

// ── 4 · tiltCompare ───────────────────────────────────────────────────────────────────────
export type TiltSide = { src?: string; label?: string; caption?: string; text?: string; icon?: string };
export type TiltProps = { variant?: 'judge' | 'split'; left: TiltSide; right: TiltSide; at?: number; title?: string; y?: number };
const TiltCard: React.FC<{ side: TiltSide; w: number; h: number; i: number; showLabel?: boolean }> = ({ side, w, h, i, showLabel = true }) => (
  <div style={{ width: w, height: h, borderRadius: 34, overflow: 'hidden', position: 'relative', ...cardSt() }}>
    {side.src ? <Media src={side.src} i={i} /> : (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 36, textAlign: 'center' }}>
        {side.icon && <Ic n={side.icon} size={96} color={K.orange} sw={2.2} />}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, lineHeight: 1.05, letterSpacing: -2, color: K.ink }}>{side.text ?? side.label}</div>
      </div>
    )}
    {side.caption && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '60px 24px 24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 36, textAlign: 'center' }}>{side.caption}</div>}
    {showLabel && side.label && side.src && <div style={{ position: 'absolute', left: 20, top: 20 }}><Pill text={side.label} bg="rgba(20,20,20,0.78)" size={22} /></div>}
  </div>
);
const Tilt: React.FC<Base & TiltProps> = ({ t, S, E, onDark, variant = 'judge', left, right, at, title, y = 560 }) => {
  const a = at ?? S + 0.9;
  const enter = pop(t, S + 0.05, 0.55);
  const p = ease.inOutCubic(lin(t, a, 0.8));
  const ty = title ? 90 : 20;
  const cyc = y + ty + 320;
  const judge = variant === 'judge';
  const w = judge ? 450 : 440, h = 640;
  const seal = (txt: string | undefined, side: 'l' | 'r', i: number) => txt ? (
    <div style={{ position: 'absolute', top: 40, [side === 'l' ? 'right' : 'left']: -36, width: 118, height: 118, borderRadius: 99, background: K.orange, color: '#fff', border: `5px solid ${K.panel}`, boxShadow: '0 14px 28px -8px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 21, letterSpacing: 1.5, lineHeight: 1.1, textTransform: 'uppercase', padding: 10, boxSizing: 'border-box', transform: `scale(${pop(t, a + 0.35 + i * 0.12, 0.4)})` }}>{txt}</div>
  ) : null;
  const badge = (ok: boolean) => (
    <div style={{ position: 'absolute', top: -22, right: -18, width: 84, height: 84, borderRadius: 99, background: ok ? '#2EA56A' : '#E15A36', border: `5px solid ${K.panel}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(t, a + 0.5, 0.4)})`, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.45)' }}><Ic n={ok ? 'check' : 'x'} size={44} color="#fff" sw={3.4} /></div>
  );
  const lx = judge ? mixN(305, 262, p) : mixN(310, 540 - w / 2 - 4, enter);
  const rx = judge ? mixN(775, 790, p) : mixN(770, 540 + w / 2 + 4, enter);
  const ls = judge ? mixN(1, 0.84, p) : 1, rs = judge ? mixN(1, 1.08, p) : 1;
  const lry = judge ? 38 * p : 16 * enter, rry = judge ? -6 * p : -16 * enter;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={y} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
      <div style={{ position: 'absolute', left: 0, top: cyc, width: 1080, height: 0, perspective: 1700 }}>
        <div style={{ position: 'absolute', left: lx - w / 2, top: -h / 2, width: w, height: h, zIndex: 1, opacity: op(enter), transform: `rotateY(${lry}deg) scale(${ls * (0.9 + 0.1 * enter)})`, filter: judge ? `grayscale(${p}) brightness(${1 - 0.15 * p})` : undefined }}>
          <TiltCard side={left} w={w} h={h} i={0} showLabel={!!judge} />
          {judge ? badge(false) : seal(left.label, 'l', 0)}
        </div>
        <div style={{ position: 'absolute', left: rx - w / 2, top: -h / 2, width: w, height: h, zIndex: 2, opacity: op(enter), transform: `rotateY(${rry}deg) scale(${rs * (0.9 + 0.1 * enter)})`, filter: judge ? `drop-shadow(0 0 ${40 * p}px ${K.orange})` : undefined }}>
          <TiltCard side={right} w={w} h={h} i={1} showLabel={!!judge} />
          {judge ? badge(true) : seal(right.label, 'r', 1)}
        </div>
      </div>
    </Wrap>
  );
};

// ── 5 · frameworkCards ────────────────────────────────────────────────────────────────────
export type FrameworkProps = { title?: string; y?: number; items: { n?: string; word: string; at: number }[]; placeholder?: string };
const frameworkBox = (p: FrameworkProps): Box => ({ x0: 90, y0: p.y ?? 540, x1: 990, y1: (p.y ?? 540) + (p.title ? 90 : 0) + p.items.length * 148 });
const Framework: React.FC<Base & FrameworkProps> = ({ t, S, E, onDark, title, y = 540, items, placeholder }) => {
  const top = y + (title ? 90 : 0);
  let cur = -1;
  items.forEach((it, i) => { if (t >= it.at) cur = i; });
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={y} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
      {items.map((it, i) => {
        const p = pop(t, it.at, 0.5), lit = i === cur;
        const g = ease.outCubic(lin(t, it.at, 0.3));
        const wordP = ease.outCubic(lin(t, it.at + 0.05, 0.45));
        const shown = t >= it.at;
        return (
          <div key={i} style={{ position: 'absolute', left: 90, top: top + i * 148, width: 900, height: 128, borderRadius: 34, display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', ...cardSt(), background: shown ? mixColor(K.panel, K.orange, lit ? g : 0) : 'transparent', border: shown ? '1px solid rgba(0,0,0,0.08)' : `3px dashed ${onDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.15)'}`, boxShadow: shown ? (lit ? `0 26px 54px -20px ${K.orange}, 0 0 40px -6px ${K.orange}` : cardSt().boxShadow) : 'none', opacity: shown ? op(p) : placeholder ? 0.8 : 0, transform: shown ? `translateY(${(1 - p) * 70}px) scale(${lit ? 1 + 0.02 * g : 1})` : undefined }}>
            {shown ? (
              <>
                <div style={{ width: 70, height: 70, borderRadius: 99, flexShrink: 0, background: lit ? 'rgba(255,255,255,0.25)' : K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.n ?? String(i + 1)}</div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, letterSpacing: -1.5, color: lit ? '#fff' : K.ink, filter: `blur(${(1 - wordP) * 14}px)`, opacity: 0.2 + 0.8 * wordP, whiteSpace: 'nowrap' }}>{it.word}</div>
              </>
            ) : placeholder && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: soft(onDark), letterSpacing: 4, width: '100%', textAlign: 'center' }}>{placeholder}</div>}
          </div>
        );
      })}
    </Wrap>
  );
};

// ── 6 · cardMorph ─────────────────────────────────────────────────────────────────────────
export type MorphState = { text?: string; sub?: string; icon?: string; src?: string; title?: string; tone?: 'orange' | 'navy' | 'light'; w?: number; h?: number; r?: number };
export type MorphProps = { from: MorphState; to: MorphState; at: number; dur?: number; cy?: number };
const morphDims = (s: MorphState) => ({ w: s.w ?? (s.src ? 900 : 440), h: s.h ?? (s.src ? 640 : 230), r: s.r ?? (s.src ? 40 : 64) });
const toneBg = (s: MorphState) => ({ orange: K.orange, navy: K.navy, light: K.panel })[s.tone ?? (s.src ? 'light' : 'orange')];
const toneFg = (s: MorphState) => ((s.tone ?? (s.src ? 'light' : 'orange')) === 'light' ? K.ink : '#fff');
const MorphContent: React.FC<{ s: MorphState; w: number; h: number }> = ({ s, w, h }) => s.src ? (
  <div style={{ width: w, height: h, display: 'flex', flexDirection: 'column' }}>
    {s.title && <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', background: '#1B2430' }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />)}<div style={{ marginLeft: 14, fontFamily: MONO, fontSize: 24, color: '#AEB8C6' }}>{s.title}</div></div>}
    <div style={{ flex: 1, minHeight: 0 }}><Media src={s.src} /></div>
  </div>
) : (
  <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, color: toneFg(s), padding: '0 30px', boxSizing: 'border-box' }}>
    {s.icon && <Ic n={s.icon} size={Math.min(110, h * 0.42)} color={toneFg(s)} sw={2.4} />}
    <div style={{ textAlign: s.icon ? 'left' : 'center' }}>
      {s.text && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: Math.min(88, h * 0.34), letterSpacing: -2, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{s.text}</div>}
      {s.sub && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, opacity: 0.8, marginTop: 8 }}>{s.sub}</div>}
    </div>
  </div>
);
const morphBox = (p: MorphProps): Box => { const A = morphDims(p.from), B = morphDims(p.to), cy = p.cy ?? 800, w = Math.max(A.w, B.w), h = Math.max(A.h, B.h); return { x0: CX - w / 2, y0: cy - h / 2, x1: CX + w / 2, y1: cy + h / 2 }; };
const Morph: React.FC<Base & MorphProps> = ({ t, S, E, from, to, at, dur = 0.75, cy = 800 }) => {
  const A = morphDims(from), B = morphDims(to);
  const p = ease.inOutCubic(lin(t, at, dur));
  const enter = pop(t, S + 0.05, 0.5);
  const w = mixN(A.w, B.w, p), h = mixN(A.h, B.h, p), r = mixN(A.r, B.r, p);
  const bg = mixColor(toneBg(from), toneBg(to), p);
  const outO = 1 - clamp(p / 0.4, 0, 1), inO = clamp((p - 0.55) / 0.45, 0, 1);
  const light = (p < 0.5 ? from : to).tone === 'light' || (!(p < 0.5 ? from : to).tone && !!(p < 0.5 ? from : to).src);
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', left: CX - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, background: bg, overflow: 'hidden', border: light ? '1px solid rgba(0,0,0,0.08)' : 'none', boxShadow: `0 36px 70px -28px rgba(20,20,20,0.5), 0 0 ${60 * (1 - Math.abs(p - 0.5) * 2) * 0.6}px -8px ${K.orange}`, opacity: op(enter), transform: `scale(${0.88 + 0.12 * enter})`, boxSizing: 'border-box' }}>
        {outO > 0 && <div style={{ position: 'absolute', left: (w - A.w) / 2, top: (h - A.h) / 2, opacity: outO, transform: `scale(${1 - 0.1 * p})`, filter: `blur(${(1 - outO) * 6}px)` }}><MorphContent s={from} w={A.w} h={A.h} /></div>}
        {inO > 0 && <div style={{ position: 'absolute', left: (w - B.w) / 2, top: (h - B.h) / 2, opacity: inO, transform: `scale(${0.92 + 0.08 * inO})`, filter: `blur(${(1 - inO) * 6}px)` }}><MorphContent s={to} w={B.w} h={B.h} /></div>}
      </div>
    </Wrap>
  );
};

// ── 7 · gridAssemble ──────────────────────────────────────────────────────────────────────
export type GridProps = { title?: string; items: GItem[]; cols?: number; at?: number; stagger?: number; order?: 'random' | 'sequential'; hero?: { i: number; at: number }; proof?: { to: number; prefix?: string; suffix?: string; label?: string }; camera?: 'push' | 'pull'; y?: number };
const gridM = (p: { items: GItem[]; cols?: number; title?: string; proof?: unknown; tileH?: number }) => {
  const cols = Math.max(1, p.cols ?? 3), n = p.items.length, rows = Math.max(1, Math.ceil(n / cols)), gap = 26;
  const cell = p.tileH ?? Math.min(260, Math.floor((900 - gap * (cols - 1)) / cols));
  const lab = p.items.some((i) => i.label) ? 52 : 0, rowH = cell + lab + gap, top = p.title ? 90 : 0;
  const pos = (i: number) => {
    const r = Math.floor(i / cols), c = i % cols, cnt = r === rows - 1 ? n - r * cols : cols;
    return { x: CX - (cnt * cell + (cnt - 1) * gap) / 2 + c * (cell + gap) + cell / 2, y: top + r * rowH + cell / 2 };
  };
  return { cols, rows, gap, cell, lab, rowH, top, pos, gridH: top + rows * rowH - gap, h: top + rows * rowH - gap + (p.proof ? 250 : 0) };
};
const gridBox = (p: GridProps): Box => { const m = gridM(p), y = p.y ?? 560; return { x0: 60, y0: y, x1: 1020, y1: y + m.h }; };
const Grid: React.FC<Base & GridProps> = ({ t, S, E, onDark, title, items, cols, at, stagger = 0.12, order = 'random', hero, proof, camera = 'pull', y = 560 }) => {
  const m = gridM({ items, cols, title, proof });
  const a = at ?? S + 0.2, n = items.length;
  const rank = order === 'sequential' ? items.map((_, i) => i) : (() => { const idx = items.map((_, i) => i).sort((p, q) => hash(p, 9) - hash(q, 9)); const r: number[] = []; idx.forEach((v, k) => { r[v] = k; }); return r; })();
  const cam = camera === 'pull' ? mixN(1.1, 1, ease.outCubic(lin(t, a, 1.6))) : mixN(0.94, 1.04, ease.inOutCubic(lin(t, a, Math.max(1, E - a))));
  const hp = hero ? pop(t, hero.at, 0.5) : 0;
  const pa = hero ? hero.at + 0.5 : a + n * stagger + 0.7;
  const pp = proof ? lin(t, pa, 1.2) : 0;
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', left: 0, top: y, width: 1080, height: m.h, transform: `scale(${cam})`, transformOrigin: `${CX}px ${m.gridH / 2}px` }}>
        {title && <Eyebrow text={title} y={0} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
        {items.map((it, i) => {
          const st = a + rank[i] * stagger, p = pop(t, st, 0.55), pos = m.pos(i);
          const sx = (hash(i, 1) - 0.5) * 700, sy = (hash(i, 2) - 0.5) * 500;
          const land = clamp((t - st - 0.4) / 0.6, 0, 1);
          const fl = Math.sin(t * 1.5 + i * 1.9) * 7 * land;
          const isH = hero && hero.i === i;
          const dim = hero ? 1 - 0.45 * ease.outCubic(lin(t, hero.at, 0.4)) * (isH ? 0 : 1) : 1;
          const hs = isH ? 1 + 0.22 * hp : 1;
          return (
            <div key={i} style={{ position: 'absolute', left: pos.x - m.cell / 2, top: pos.y - m.cell / 2 + fl, width: m.cell, opacity: op(p) * dim, zIndex: isH ? 5 : 1, transform: `translate(${(1 - ease.outCubic(lin(t, st, 0.55))) * sx}px,${(1 - ease.outCubic(lin(t, st, 0.55))) * sy}px) rotate(${(1 - ease.outCubic(lin(t, st, 0.55))) * (hash(i, 3) - 0.5) * 50}deg) scale(${(0.5 + 0.5 * p) * hs})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ borderRadius: m.cell * 0.26, boxShadow: isH ? `0 0 0 6px ${K.orange}, 0 0 50px ${K.orange}` : 'none' }}><ItemTile it={it} size={m.cell} i={i} /></div>
              {m.lab > 0 && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: ink(onDark), whiteSpace: 'nowrap' }}>{it.label ?? ''}</div>}
            </div>
          );
        })}
        {proof && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: m.gridH + 30, textAlign: 'center', opacity: ease.outCubic(lin(t, pa, 0.4)), transform: `translateY(${(1 - ease.outCubic(lin(t, pa, 0.5))) * 40}px)` }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 130, letterSpacing: -5, lineHeight: 1.05, color: K.orange, fontVariantNumeric: 'tabular-nums' }}>{proof.prefix ?? ''}{fmt(proof.to * ease.outCubic(pp))}{proof.suffix ?? ''}</div>
            {proof.label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: soft(onDark), marginTop: 4 }}>{proof.label}</div>}
          </div>
        )}
      </div>
    </Wrap>
  );
};

// ── 8 · depthScatter ──────────────────────────────────────────────────────────────────────
export type ScatterProps = { items: GItem[]; cols?: number; at?: number; dur?: number; mode?: 'assemble' | 'scatter'; title?: string; y?: number; tileH?: number };
const scatterM = (p: ScatterProps) => { const m = gridM({ items: p.items, cols: p.cols ?? 4, title: p.title, tileH: p.tileH ?? 150 }); return { m, h: Math.max(m.h, 760) }; };
const scatterBox = (p: ScatterProps): Box => { const y = p.y ?? 560; return { x0: 60, y0: y, x1: 1020, y1: y + scatterM(p).h }; };
const Scatter: React.FC<Base & ScatterProps> = ({ t, S, E, onDark, items, cols = 4, at, dur = 1.4, mode = 'assemble', title, y = 560, tileH = 150 }) => {
  const { m, h } = scatterM({ items, cols, title, tileH });
  const a = at ?? S + 0.5, n = items.length, gOff = (h - (m.gridH - m.top)) / 2;
  const ccy = y + m.top + (h - m.top) / 2;
  const yaw = (t - S) * 0.7;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={y} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
      {items.map((it, i) => {
        const th = hash(i) * Math.PI * 2, ph = Math.acos(2 * hash(i, 1) - 1);
        const x3 = 330 * Math.sin(ph) * Math.cos(th), y3 = 270 * Math.cos(ph), z3 = 330 * Math.sin(ph) * Math.sin(th);
        const xr = x3 * Math.cos(yaw) + z3 * Math.sin(yaw), zr = -x3 * Math.sin(yaw) + z3 * Math.cos(yaw);
        const s = 900 / (900 - zr);
        const cl = { x: CX + xr * s, y: ccy + y3 * s, sc: 0.62 * s, o: 0.45 + 0.55 * clamp((zr + 330) / 660, 0, 1) };
        const g = m.pos(i), gp = { x: g.x, y: y + g.y - m.top + m.top + gOff - 0, sc: 1, o: 1 };
        const raw = ease.inOutCubic(lin(t, a + (i / Math.max(1, n)) * 0.5, dur));
        const k = mode === 'assemble' ? raw : 1 - raw;
        const fin = ease.outCubic(lin(t, S + 0.05 + hash(i, 5) * 0.3, 0.5));
        const sz = tileH;
        return (
          <div key={i} style={{ position: 'absolute', left: mixN(cl.x, gp.x, k) - sz / 2, top: mixN(cl.y, gp.y, k) - sz / 2, width: sz, opacity: mixN(cl.o, 1, k) * fin, zIndex: Math.round(mixN(cl.sc, 1, k) * 100), transform: `scale(${mixN(cl.sc, gp.sc, k)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ItemTile it={it} size={sz} i={i} />
            {m.lab > 0 && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: ink(onDark), whiteSpace: 'nowrap', opacity: k }}>{it.label ?? ''}</div>}
          </div>
        );
      })}
    </Wrap>
  );
};

// ── 9 · constellation ─────────────────────────────────────────────────────────────────────
export type ConstellationProps = { slugs: string[]; title?: string; at?: number; cy?: number; rx?: number; ry?: number; speed?: number; size?: number };
const constellationBox = (p: ConstellationProps): Box => { const cy = p.cy ?? 820, rx = p.rx ?? 380, ry = p.ry ?? 230, s = p.size ?? 120; return { x0: CX - rx - s / 2, y0: cy - ry - s / 2 - (p.title ? 100 : 0), x1: CX + rx + s / 2, y1: cy + ry + s / 2 }; };
const Constellation: React.FC<Base & ConstellationProps> = ({ t, S, E, onDark, slugs, title, at, cy = 820, rx = 380, ry = 230, speed = 0.35, size = 120 }) => {
  const a = at ?? S + 0.3, n = slugs.length;
  const lp = pop(t, a, 0.7), ring = ease.inOutCubic(lin(t, a + 0.5, 0.9)), t1 = a + 1.3, orbitT = a + 1.3 + n * 0.16;
  const list = slugs.map((s, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2 + (t > t1 ? Math.max(0, t - orbitT) * speed + (lin(t, orbitT, 1) * 0) : 0);
    return { s, i, ang, d: Math.sin(ang) };
  }).sort((p, q) => p.d - q.d);
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={cy - ry - size / 2 - 100} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={ellipsePath(CX, cy, rx, ry)} pathLength={1} fill="none" stroke={K.orange} strokeWidth={4} strokeDasharray={`${ring} 1`} strokeLinecap="round" opacity={0.7} />
      </svg>
      {list.map(({ s, i, ang, d }) => {
        const p = pop(t, t1 + i * 0.16, 0.5), sc = (0.82 + 0.18 * (d + 1) / 2) * (0.3 + 0.7 * p);
        return <div key={s + i} style={{ position: 'absolute', left: CX + Math.cos(ang) * rx - size / 2, top: cy + Math.sin(ang) * ry - size / 2 + (1 - p) * -40, opacity: op(p), zIndex: Math.round((d + 1) * 10), transform: `scale(${sc})` }}><BrandLogo slug={s} size={size} skin="kit" /></div>;
      })}
      <div style={{ position: 'absolute', left: CX - 100, top: cy - 100, width: 200, height: 200, borderRadius: 52, ...cardSt(), display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, opacity: op(lp), boxShadow: `0 30px 60px -24px rgba(20,20,20,0.45), 0 0 ${50 * ring}px ${K.orange}`, transform: `rotate(${(1 - ease.outCubic(lin(t, a, 0.9))) * 360}deg) scale(${0.2 + 0.8 * lp})` }}>
        <Logo size={124} />
      </div>
    </Wrap>
  );
};

// ── 10 · orbitCollapse ────────────────────────────────────────────────────────────────────
export type OrbitCollapseProps = { items: { slug?: string; icon?: string }[]; cta?: string; clickAt: number; cy?: number; rx?: number; ry?: number; title?: string };
const orbitBox = (p: OrbitCollapseProps): Box => { const cy = p.cy ?? 800, rx = p.rx ?? 380, ry = p.ry ?? 220; return { x0: CX - rx - 60, y0: cy - ry - 60 - (p.title ? 100 : 0), x1: CX + rx + 60, y1: cy + ry + 60 }; };
const OrbitCollapse: React.FC<Base & OrbitCollapseProps> = ({ t, S, E, onDark, items, cta = 'Start free trial', clickAt, cy = 800, rx = 380, ry = 220, title }) => {
  const n = items.length;
  const col = ease.inCubic(lin(t, clickAt + 0.05, 0.5));
  const clicked = t >= clickAt;
  const bp = pop(t, clickAt + 0.28, 0.55);
  const enter = ease.outCubic(lin(t, S + 0.05, 0.5));
  const cu = ease.inOutCubic(lin(t, clickAt - 1.0, 0.9));
  const press = t >= clickAt ? Math.exp(-(t - clickAt) * 12) : 0;
  const cx0 = mixN(880, CX + 70, cu), cy0 = mixN(cy + 330, cy + 22, cu);
  const BW = 560, BH = 130;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={cy - ry - 160} o={enter} onDark={onDark} />}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={ellipsePath(CX, cy, rx, ry)} fill="none" stroke={onDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'} strokeWidth={3} strokeDasharray="6 14" opacity={(1 - col) * enter} />
      </svg>
      {items.map((it, i) => {
        const ang = (i / n) * Math.PI * 2 + (t - S) * 0.7, k = 1 - col, d = Math.sin(ang);
        const p = pop(t, S + 0.1 + i * 0.1, 0.5);
        const sc = (0.85 + 0.15 * (d + 1) / 2) * (0.3 + 0.7 * p) * (1 - 0.8 * col);
        return <div key={i} style={{ position: 'absolute', left: CX + Math.cos(ang) * rx * k - 55, top: cy + Math.sin(ang) * ry * k - 55, opacity: op(p) * (1 - clamp((col - 0.7) / 0.3, 0, 1)), zIndex: Math.round((d + 1) * 10), transform: `scale(${sc})` }}><ItemTile it={it} size={110} i={i} /></div>;
      })}
      {clicked && [0, 0.18].map((o, k) => { const q = lin(t, clickAt + 0.3 + o, 0.7); return q > 0 && q < 1 ? <div key={k} style={{ position: 'absolute', left: CX - BW / 2 - q * 70, top: cy - BH / 2 - q * 70, width: BW + q * 140, height: BH + q * 140, borderRadius: 99, border: `${6 * (1 - q) + 1}px solid ${K.orange}`, opacity: 1 - q, boxSizing: 'border-box' }} /> : null; })}
      <div style={{ position: 'absolute', left: CX - BW / 2, top: cy - BH / 2, width: BW, height: BH, borderRadius: 99, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 20, fontFamily: FONT, fontWeight: 900, fontSize: 48, letterSpacing: -1, opacity: enter, background: clicked ? K.orange : 'transparent', border: clicked ? 'none' : `4px dashed ${onDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)'}`, color: '#fff', boxShadow: clicked ? `0 28px 56px -18px ${K.orange}` : 'none', transform: `scale(${clicked ? 0.9 + 0.1 * bp + 0.06 * Math.sin(Math.PI * clamp(bp, 0, 1)) : 1 - 0.04 * press})` }}>
        {clicked && <><span style={{ opacity: op(bp) }}>{cta}</span><Ic n="zap" size={44} color="#fff" sw={2.6} /></>}
      </div>
      <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: 'absolute', left: cx0 - 6, top: cy0 - 4, zIndex: 30, opacity: ease.outCubic(lin(t, clickAt - 1.0, 0.3)) * (1 - ease.outCubic(lin(t, clickAt + 0.9, 0.3))), transform: `scale(${1 - 0.16 * press})`, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))' }}>
        <path d="M5 3l14 8-6 2-3 6z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </Wrap>
  );
};

// ── 11 · logoLockup ───────────────────────────────────────────────────────────────────────
export type LockupProps = { tagline?: string; word?: string; at?: number; zoomAt?: number; cy?: number };
const lockupBox = (p: LockupProps): Box => { const cy = p.cy ?? 820; return { x0: 90, y0: cy - (p.tagline ? 330 : 190), x1: 990, y1: cy + 330 }; };
const Lockup: React.FC<Base & LockupProps> = ({ t, S, E, onDark, tagline, word = 'WiseFunnel', at, zoomAt, cy = 820 }) => {
  const a = at ?? S + 0.2;
  const tl = tagline?.length ?? 0, typed = tl ? Math.floor(clamp((t - a) * 26, 0, tl)) : 0;
  const ta = a + (tl ? tl / 26 + 0.15 : 0);
  const dots = ease.inCubic(lin(t, ta, 0.65));
  const lp = pop(t, ta + 0.55, 0.55);
  const wp = ease.outCubic(lin(t, ta + 0.95, 0.6));
  const ul = ease.inOutCubic(lin(t, ta + 1.6, 0.55));
  const zoom = 1 + 0.28 * ease.inOutCubic(lin(t, zoomAt ?? ta + 2.3, 1.3));
  const LS = 230, fs = 112;
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${CX}px ${cy + 40}px` }}>
        {tagline && <div style={{ position: 'absolute', left: 60, right: 60, top: cy - 310, textAlign: 'center', fontFamily: K.serif, fontStyle: 'italic', fontSize: 84, lineHeight: 1.1, letterSpacing: -1, color: ink(onDark), opacity: 1 - ease.outCubic(lin(t, ta + 0.5, 0.4)) * 0.0 }}>{tagline.slice(0, typed)}<span style={{ display: 'inline-block', width: 5, height: 70, marginLeft: 6, verticalAlign: 'middle', background: K.orange, opacity: typed < tl ? (Math.floor(t * 3) % 2 ? 0.2 : 1) : 0 }} /></div>}
        {Array.from({ length: 16 }, (_, i) => {
          if (t < ta || dots >= 1) return null;
          const ang = hash(i) * Math.PI * 2, r0 = 380 + hash(i, 1) * 200, k = dots;
          return <div key={i} style={{ position: 'absolute', left: CX + Math.cos(ang) * r0 * (1 - k) - 8, top: cy + Math.sin(ang) * r0 * 0.8 * (1 - k) - 8, width: 16, height: 16, borderRadius: 99, background: K.orange, opacity: 0.4 + 0.6 * k, boxShadow: `0 0 16px ${K.orange}` }} />;
        })}
        <div style={{ position: 'absolute', left: CX - LS / 2, top: cy - LS / 2, width: LS, height: LS, zIndex: 3, opacity: op(lp), transform: `scale(${0.3 + 0.7 * lp})`, filter: `drop-shadow(0 20px 30px rgba(20,20,20,0.3))` }}><Logo size={LS} /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: cy + LS / 2 + 14, height: fs * 1.3, overflow: 'hidden', zIndex: 2 }}>
          <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -4, lineHeight: 1.2, color: ink(onDark), whiteSpace: 'nowrap', opacity: wp, transform: `translateY(${-(1 - wp) * (fs * 1.4)}px)` }}>{word}</div>
        </div>
        <div style={{ position: 'absolute', left: CX - 260, top: cy + LS / 2 + fs * 1.3 + 20, width: 520 * ul, height: 10, borderRadius: 6, background: K.orange, boxShadow: `0 0 20px ${K.orange}` }} />
      </div>
    </Wrap>
  );
};

// ── 12 · avatarCloud ──────────────────────────────────────────────────────────────────────
export type AvatarCloudProps = { n?: number; hub: { value: number; prefix?: string; suffix?: string; label?: string }; at?: number; cy?: number; rx?: number; ry?: number; title?: string };
const avatarBox = (p: AvatarCloudProps): Box => { const cy = p.cy ?? 820, rx = p.rx ?? 390, ry = p.ry ?? 330; return { x0: CX - rx - 60, y0: cy - ry - 60 - (p.title ? 100 : 0), x1: CX + rx + 60, y1: cy + ry + 60 }; };
const AvatarCloud: React.FC<Base & AvatarCloudProps> = ({ t, S, E, onDark, n = 14, hub, at, cy = 820, rx = 390, ry = 330, title }) => {
  const a = at ?? S + 0.3;
  const hp = pop(t, S + 0.05, 0.55), cnt = ease.outCubic(lin(t, a, 1.8));
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <Eyebrow text={title} y={cy - ry - 160} o={ease.outCubic(lin(t, S + 0.05, 0.4))} onDark={onDark} />}
      <AvatarRing t={t} start={a + 0.3} n={n} cy={cy} rx={rx} ry={ry} size={118} />
      <div style={{ position: 'absolute', left: CX - 170, top: cy - 170, width: 340, height: 340, borderRadius: 999, ...cardSt(), zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op(hp), transform: `scale(${0.4 + 0.6 * hp})`, boxShadow: `0 30px 60px -24px rgba(20,20,20,0.45), 0 0 60px -10px ${K.orange}` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, letterSpacing: -4, lineHeight: 1, color: K.orange, fontVariantNumeric: 'tabular-nums' }}>{hub.prefix ?? ''}{fmt(hub.value * cnt)}{hub.suffix ?? ''}</div>
        {hub.label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: K.ink, opacity: 0.6, marginTop: 8, textTransform: 'uppercase' }}>{hub.label}</div>}
      </div>
    </Wrap>
  );
};

// ── 13 · logoChain ────────────────────────────────────────────────────────────────────────
export type LogoChainProps = { word?: string; lead?: string; claims?: string[]; claimAt?: number[]; recenterAt?: number; cloudAt?: number; slugs?: string[]; count?: { value: number; suffix?: string; label?: string }; cy?: number };
const chainBox = (p: LogoChainProps): Box => { const cy = p.cy ?? 820; return { x0: 40, y0: cy - 460, x1: 1040, y1: cy + 480 }; };
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&';
const Chain: React.FC<Base & LogoChainProps> = ({ t, S, E, onDark, word = 'WiseFunnel', lead = 'We help you', claims = [], claimAt, recenterAt, cloudAt, slugs = ['meta', 'googleads', 'zapier', 'hubspot', 'slack', 'mailchimp', 'instagram'], count, cy = 820 }) => {
  const cAt = claims.map((_, i) => claimAt?.[i] ?? S + 1.7 + i * 0.9);
  const rec = recenterAt ?? (cAt.length ? cAt[cAt.length - 1] + 1.0 : S + 1.8);
  const cld = cloudAt ?? rec + 0.6;
  const lp = pop(t, S + 0.05, 0.6);
  const dec = lin(t, S + 0.3, 0.9), nd = Math.floor(dec * word.length), tick = Math.floor(t * 24);
  const decoded = word.split('').map((c, i) => (i < nd || c === ' ' ? c : CHARS[Math.floor(hash(i, tick) * CHARS.length)])).join('');
  const rp = ease.inOutCubic(lin(t, rec, 0.8));
  const topY = cy - 300, midY = cy;
  const gy = mixN(topY, midY, rp), gs = mixN(1, 0.62, rp);
  let ci = -1; cAt.forEach((x, i) => { if (t >= x) ci = i; });
  const roll = (i: number) => ease.outCubic(lin(t, cAt[i], 0.45));
  const phraseO = ease.outCubic(lin(t, S + 1.2, 0.4)) * (1 - ease.inCubic(lin(t, rec - 0.15, 0.35)));
  const cp = ease.outCubic(lin(t, cld, 0.5));
  const cnt = ease.outCubic(lin(t, cld + 0.3, 1.5));
  const tile = 130, step = 170, nS = slugs.length, totalW = nS * step, off = ((t - cld) * 110) % totalW;
  const reps = Math.ceil(1000 / totalW) + 2;
  const sp = ease.outCubic(lin(t, cld + 0.9, 0.5));
  return (
    <Wrap t={t} S={S} E={E}>
      {t >= cld - 0.1 && <AvatarRing t={t} start={cld} n={12} cy={midY} rx={400} ry={290} size={104} lineOp={cp} />}
      <div style={{ position: 'absolute', left: CX, top: gy, width: 0, height: 0, zIndex: 20, transform: `scale(${gs})` }}>
        <div style={{ position: 'absolute', left: -105, top: -105, width: 210, height: 210, borderRadius: 54, ...cardSt(), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op(lp), transform: `scale(${0.3 + 0.7 * lp}) rotate(${(1 - ease.outCubic(lin(t, S, 0.8))) * -200}deg)` }}><Logo size={130} /></div>
        <div style={{ position: 'absolute', left: -450, top: 124, width: 900, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: -3, color: ink(onDark), whiteSpace: 'nowrap', opacity: ease.outCubic(lin(t, S + 0.2, 0.3)), textShadow: onDark ? '0 4px 20px rgba(0,0,0,0.3)' : 'none' }}>{decoded}</div>
      </div>
      {claims.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: cy + 20, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 60, letterSpacing: -1.5, color: ink(onDark), opacity: phraseO, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center' }}>
          <span>{lead}</span>
          <span style={{ position: 'relative', display: 'inline-block', height: 84, minWidth: 380, overflow: 'hidden', textAlign: 'left', padding: '0 20px', borderRadius: 18, background: K.orange, color: '#fff' }}>
            {claims.map((c, i) => {
              const cur = i === ci, prev = i === ci - 1, r = roll(i);
              if (!cur && !prev) return null;
              const yy = cur ? (1 - r) * 90 : -r * 0 - lin(t, cAt[i + 1] ?? 1e9, 0.45) * 90;
              return <span key={i} style={{ position: 'absolute', left: 20, top: 0, lineHeight: '84px', whiteSpace: 'nowrap', transform: `translateY(${cur ? (1 - ease.outCubic(lin(t, cAt[i], 0.45))) * 90 : -ease.outCubic(lin(t, cAt[i + 1] ?? 1e9, 0.45)) * 90}px)`, opacity: cur ? 1 : 1 - lin(t, cAt[i + 1] ?? 1e9, 0.45) }} data-y={yy}>{c}</span>;
            })}
            <span style={{ visibility: 'hidden', lineHeight: '84px', whiteSpace: 'nowrap' }}>{claims.reduce((a, b) => (b.length > a.length ? b : a), '')}</span>
          </span>
        </div>
      )}
      {count && (
        <div style={{ position: 'absolute', left: CX - 200, top: midY + 330, width: 400, textAlign: 'center', opacity: cp, transform: `translateY(${(1 - cp) * 30}px)`, zIndex: 25 }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: -4, lineHeight: 1, color: K.orange, fontVariantNumeric: 'tabular-nums' }}>{fmt(count.value * cnt)}{count.suffix ?? ''}</div>
          {count.label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: soft(onDark), marginTop: 6, textTransform: 'uppercase' }}>{count.label}</div>}
        </div>
      )}
      <div style={{ position: 'absolute', left: 40, top: cy + 400, width: 1000, height: tile + 20, overflow: 'hidden', opacity: sp, WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)' }}>
        {Array.from({ length: reps * nS }, (_, k) => <div key={k} style={{ position: 'absolute', top: 10, left: k * step - off }}><BrandLogo slug={slugs[k % nS]} size={tile} skin="kit" /></div>)}
      </div>
    </Wrap>
  );
};

// ── registry ──────────────────────────────────────────────────────────────────────────────
const fixedBox = (h: number) => (p: { y?: number }): Box => ({ x0: 60, y0: p.y ?? 560, x1: 1020, y1: (p.y ?? 560) + h });

export const FX_CARDS3D = {
  coverflow: { C: Coverflow, sfx: none, box: fixedBox(790) },
  flipProof: { C: FlipProof, sfx: none, box: fixedBox(820) },
  sliderProof: { C: SliderProof, sfx: none, box: (p: SliderProofProps): Box => ({ x0: 100, y0: p.y ?? 560, x1: 980, y1: (p.y ?? 560) + 440 + 50 + 230 }) },
  tiltCompare: { C: Tilt, sfx: none, box: (p: TiltProps): Box => ({ x0: 60, y0: p.y ?? 560, x1: 1020, y1: (p.y ?? 560) + (p.title ? 90 : 20) + 660 }) },
  frameworkCards: { C: Framework, sfx: none, box: frameworkBox },
  cardMorph: { C: Morph, sfx: none, box: morphBox },
  gridAssemble: { C: Grid, sfx: none, box: gridBox },
  depthScatter: { C: Scatter, sfx: none, box: scatterBox },
  constellation: { C: Constellation, sfx: none, box: constellationBox },
  orbitCollapse: { C: OrbitCollapse, sfx: none, box: orbitBox },
  logoLockup: { C: Lockup, sfx: none, box: lockupBox },
  avatarCloud: { C: AvatarCloud, sfx: none, box: avatarBox },
  logoChain: { C: Chain, sfx: none, box: chainBox },
};
