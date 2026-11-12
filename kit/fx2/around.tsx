// Family "around" (clean-room rewrite): elements that live around the presenter's head.
// Most of them sit BEHIND the cut-out (layouts `cutout` / `depth` / `stack`), so the head and shoulders overlap their lower edge.
// Authored on the 1080x1920 canvas. Pure functions of t (no state, no timers, no Math.random).
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT } from '../tokens';
import { STACK as K } from '../stack';
import { clamp, ease, lin, M } from '../motion';
import { BrandLogo } from '../real';
import { Ic } from '../Icon';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number; skin?: string; format?: string; onDark?: boolean };
type Box = { x0: number; y0: number; x1: number; y1: number };
const W = 1080;
const H = 1920;
/** where the head sits on the canvas in the presenter layouts (centre of the head, centre of the shoulders) */
const HEAD = { x: 540, y: 880, shoulders: 1120 };
const fill: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: H };
const none = (): SfxCue[] => [];

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const outAlpha = (t: number, E: number) => 1 - M.exit(t, E - 0.3);
const fitSize = (len: number, base: number, maxW: number, k = 0.6) => Math.min(base, maxW / (Math.max(1, len) * k));
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const shadowCard = '0 30px 60px -24px rgba(15,23,42,0.40), 0 2px 8px rgba(15,23,42,0.10)';
const cardBase: React.CSSProperties = { background: K.panel, border: `1px solid ${C.border}`, boxShadow: shadowCard, boxSizing: 'border-box' };

/** Reel cover: the real image when given, otherwise a clean placeholder with a play mark. */
const Cover: React.FC<{ src?: string; i: number; w: number; ratio?: number }> = ({ src, i, w, ratio = 16 / 9 }) => {
  const h = w * ratio;
  const pal = [[K.orange, K.navy], [K.navy, K.ink], [K.ink, K.orange], [K.navy, K.orange]][i % 4];
  return (
    <div style={{ width: w, height: h, borderRadius: w * 0.09, overflow: 'hidden', position: 'relative', boxShadow: shadowCard, border: `3px solid ${K.panel}`, boxSizing: 'border-box', background: `linear-gradient(160deg, ${pal[0]}, ${pal[1]})` }}>
      {src ? (
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <>
          <div style={{ position: 'absolute', left: w * 0.1, top: h * 0.07, width: w * 0.22, height: w * 0.22, borderRadius: 999, background: 'rgba(255,255,255,0.85)' }} />
          <div style={{ position: 'absolute', left: w * 0.36, top: h * 0.07 + w * 0.04, width: w * (0.3 + hash(i) * 0.2), height: w * 0.05, borderRadius: 99, background: 'rgba(255,255,255,0.7)' }} />
          <div style={{ position: 'absolute', left: w * 0.36, top: h * 0.07 + w * 0.12, width: w * 0.18, height: w * 0.04, borderRadius: 99, background: 'rgba(255,255,255,0.4)' }} />
          <svg width={w * 0.3} height={w * 0.3} viewBox="0 0 24 24" style={{ position: 'absolute', left: w * 0.35, top: h * 0.45 }}>
            <circle cx={12} cy={12} r={11} fill="rgba(255,255,255,0.22)" />
            <path d="M9.5 7.5 17 12l-7.5 4.5z" fill="#fff" />
          </svg>
          <div style={{ position: 'absolute', left: w * 0.1, bottom: h * 0.07, width: w * 0.55, height: w * 0.05, borderRadius: 99, background: 'rgba(255,255,255,0.75)' }} />
          <div style={{ position: 'absolute', left: w * 0.1, bottom: h * 0.07 + w * 0.09, width: w * 0.38, height: w * 0.04, borderRadius: 99, background: 'rgba(255,255,255,0.4)' }} />
        </>
      )}
    </div>
  );
};

/** Screenshot tile: the real image or an abstract UI placeholder. */
const Shot: React.FC<{ src?: string; i: number; w: number; h: number; r?: number }> = ({ src, i, w, h, r = 28 }) => (
  <div style={{ ...cardBase, width: w, height: h, borderRadius: r, overflow: 'hidden', position: 'relative' }}>
    {src ? (
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: h * 0.1, background: i % 2 ? K.navy : K.orange }} />
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ position: 'absolute', left: w * 0.08, top: h * (0.18 + k * 0.12), width: w * (0.84 - hash(i * 7 + k) * 0.4), height: h * 0.05, borderRadius: 99, background: k === 0 ? K.ink : C.border, opacity: k === 0 ? 0.85 : 1 }} />
        ))}
        <div style={{ position: 'absolute', left: w * 0.08, bottom: h * 0.08, width: w * 0.84, height: h * 0.22, borderRadius: 14, background: i % 2 ? `${K.orange}33` : `${K.navy}22` }} />
      </>
    )}
  </div>
);

// ── reelRing ─────────────────────────────────────────────────────────────────────────────
export type ReelRingProps = { hook?: { line1: string; line2: string }; covers?: string[]; cy?: number; count?: number };
export const ReelRing: React.FC<Base & ReelRingProps> = ({ t, S, E, hook, covers = [], cy = 960, count = 8 }) => {
  const rx = 400, ry = 190, cw = 250;
  const spinIn = (1 - ease.outCubic(lin(t, S, 1.3))) * 2.6;
  const rot = (t - S) * 0.42 + spinIn;
  const items = Array.from({ length: count }, (_, i) => {
    const th = (i / count) * Math.PI * 2 + rot;
    const z = Math.cos(th);
    return { i, th, z, x: HEAD.x + rx * Math.sin(th), y: cy + ry * z, s: 0.46 + 0.54 * ((z + 1) / 2) };
  }).sort((a, b) => a.z - b.z);
  const out = outAlpha(t, E);
  const blurIn = (1 - ease.outCubic(lin(t, S, 1.1))) * 14;
  return (
    <div style={{ ...fill, opacity: out }}>
      {hook && (
        <div style={{ position: 'absolute', top: 270, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `translateY(${(1 - M.enter(t, S + 0.1, 0.5)) * 40}px)`, opacity: M.enter(t, S + 0.1, 0.5) }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: K.ink, letterSpacing: -1 }}>{hook.line1}</div>
          <div style={{ fontSize: 108, fontWeight: 900, color: K.orange, letterSpacing: -3, lineHeight: 1.05 }}>{hook.line2}</div>
        </div>
      )}
      {items.map(({ i, x, y, s, z }) => {
        const p = M.pop(t, S + i * 0.07, 0.5);
        const h = cw * (16 / 9);
        return (
          <div key={i} style={{ position: 'absolute', left: x - cw / 2, top: y - h / 2, opacity: clamp(p * 2, 0, 1), transform: `scale(${s * (0.4 + 0.6 * p)})`, filter: `blur(${blurIn * (0.4 + 0.6 * (1 - z) / 2)}px) brightness(${0.78 + 0.22 * ((z + 1) / 2)})` }}>
            <Cover src={covers[i % Math.max(1, covers.length)] && covers.length ? covers[i % covers.length] : undefined} i={i} w={cw} />
          </div>
        );
      })}
    </div>
  );
};

// ── orbit ────────────────────────────────────────────────────────────────────────────────
export type OrbitItem = { label?: string; slug?: string; at: number };
export type OrbitProps = { items: OrbitItem[]; cy?: number };
export const Orbit: React.FC<Base & OrbitProps> = ({ t, S, E, items, cy = HEAD.shoulders - 80 }) => {
  const rx = 440, ry = 150;
  const n = Math.max(1, items.length);
  const out = outAlpha(t, E);
  const drawn = ease.outCubic(lin(t, S, 0.9));
  const spin = (t - S) * 0.45;
  const placed = items.map((it, i) => {
    const th = -Math.PI / 2 + (i / n) * Math.PI * 2 + spin;
    const z = Math.sin(th + Math.PI / 2);       // 1 at the front (bottom of the ellipse)
    return { it, i, x: HEAD.x + rx * Math.cos(th), y: cy + ry * Math.sin(th), z, s: 0.62 + 0.38 * ((z + 1) / 2) };
  }).sort((a, b) => a.z - b.z);
  return (
    <div style={{ ...fill, opacity: out }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <ellipse cx={HEAD.x} cy={cy} rx={rx} ry={ry} fill="none" stroke={K.navy} strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 18" pathLength={1} style={{ opacity: drawn }} />
      </svg>
      {placed.map(({ it, i, x, y, z, s }) => {
        const p = ease.outCubic(lin(t, it.at, 0.55));
        if (p <= 0) return null;
        const label = it.label;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) perspective(700px) rotateY(${(1 - p) * 90}deg) scale(${s})`, opacity: p * (0.6 + 0.4 * ((z + 1) / 2)) }}>
            {it.slug && !label ? (
              <BrandLogo slug={it.slug} size={120} />
            ) : (
              <div style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: 14, padding: it.slug ? '10px 30px 10px 10px' : '20px 38px', borderRadius: 999, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: K.ink, whiteSpace: 'nowrap' }}>
                {it.slug && <BrandLogo slug={it.slug} size={72} />}
                {label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── headlineBehind ───────────────────────────────────────────────────────────────────────
export type HeadBehindProps = { line1: string; line2: string; at2?: number; bottom?: number; size2?: number };
export const HeadlineBehind: React.FC<Base & HeadBehindProps> = ({ t, S, E, line1, line2, at2, bottom = 930, size2 = 200 }) => {
  const a2 = at2 ?? S + 0.55;
  const p1 = M.enter(t, S, 0.5);
  const p2 = ease.outCubic(lin(t, a2, 0.5));
  const sz2 = fitSize(line2.length, size2, 960, 0.62);
  const sz1 = fitSize(line1.length, 74, 980, 0.56);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: H - bottom, textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: sz1, fontWeight: 800, color: K.ink, letterSpacing: -2, opacity: p1, transform: `translateY(${(1 - p1) * 70}px)` }}>{line1}</div>
        <div style={{ fontSize: sz2, fontWeight: 900, color: K.orange, letterSpacing: -6, lineHeight: 1, opacity: p2, filter: `blur(${(1 - p2) * 26}px)`, transform: `scale(${0.88 + 0.12 * p2})` }}>{line2}</div>
      </div>
    </div>
  );
};
const headlineBox = (p: HeadBehindProps): Box => { const b = p.bottom ?? 930, s = p.size2 ?? 200; return { x0: 50, y0: b - s - 110, x1: 1030, y1: b }; };

// ── counterBehind ────────────────────────────────────────────────────────────────────────
export type CounterBehindProps = { from?: number; to: number; prefix?: string; suffix?: string; at?: number; dur?: number; label?: string; bottom?: number; chart?: boolean };
const CURVE = [0.08, 0.16, 0.13, 0.3, 0.38, 0.55, 0.5, 0.78, 1];
export const CounterBehind: React.FC<Base & CounterBehindProps> = ({ t, S, E, from = 0, to, prefix = '', suffix = '', at, dur = 1.8, label, bottom = 930, chart = true }) => {
  const a = at ?? S + 0.3;
  const run = ease.outCubic(lin(t, a, dur));
  const v = from + (to - from) * run;
  const flash = t >= a + dur ? 1 - lin(t, a + dur, 0.7) : 0;
  const txt = `${prefix}${fmt(v)}${suffix}`;
  const size = fitSize(txt.length || 1, 230, 980, 0.6);
  const cardP = M.pop(t, S, 0.5);
  const draw = ease.inOutCubic(lin(t, a, dur));
  const cw = 780, chH = 230;
  const pts = CURVE.map((y, k) => [20 + (k / (CURVE.length - 1)) * (cw - 40), chH - 24 - y * (chH - 56)]);
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const end = pts[pts.length - 1];
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: H - bottom, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, fontFamily: FONT }}>
        {chart && (
          <div style={{ ...cardBase, width: cw, height: chH, borderRadius: 36, opacity: clamp(cardP * 2, 0, 1), transform: `scale(${0.8 + 0.2 * cardP})`, marginBottom: 6 }}>
            <svg width={cw} height={chH} viewBox={`0 0 ${cw} ${chH}`}>
              <defs>
                <linearGradient id="cb-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.orange} stopOpacity={0.28} /><stop offset="1" stopColor={K.orange} stopOpacity={0} /></linearGradient>
                <clipPath id="cb-clip"><rect x={0} y={0} width={20 + draw * (cw - 20)} height={chH} /></clipPath>
              </defs>
              {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={20} x2={cw - 20} y1={chH * g} y2={chH * g} stroke={C.border} strokeWidth={2} />)}
              <g clipPath="url(#cb-clip)">
                <path d={`${d} L${end[0]} ${chH} L${pts[0][0]} ${chH} Z`} fill="url(#cb-area)" />
                <path d={d} fill="none" stroke={K.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <circle cx={20 + draw * (cw - 40)} cy={chH - 24 - (CURVE[Math.min(CURVE.length - 1, Math.round(draw * (CURVE.length - 1)))]) * (chH - 56)} r={11} fill={K.orange} opacity={draw > 0.02 ? 1 : 0} />
            </svg>
          </div>
        )}
        {label && <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase', color: K.navy, opacity: clamp(cardP * 2, 0, 1) }}>{label}</div>}
        <div style={{ position: 'relative', fontSize: size, fontWeight: 900, letterSpacing: -6, lineHeight: 1, color: K.ink, transform: `scale(${1 + 0.07 * flash})`, whiteSpace: 'nowrap' }}>
          {txt}
          <span style={{ position: 'absolute', left: 0, top: 0, color: K.orange, opacity: flash > 0 ? Math.min(1, flash * 1.4) : 0 }}>{txt}</span>
        </div>
      </div>
    </div>
  );
};
const counterBox = (p: CounterBehindProps): Box => { const b = p.bottom ?? 930; return { x0: 50, y0: b - 230 - (p.chart === false ? 0 : 250) - (p.label ? 60 : 0), x1: 1030, y1: b }; };

// ── labelBehind ──────────────────────────────────────────────────────────────────────────
export type LabelBehindProps = { small: string; word: string; n?: number | string; bottom?: number };
export const LabelBehind: React.FC<Base & LabelBehindProps> = ({ t, S, E, small, word, n, bottom = 930 }) => {
  const p = M.pop(t, S, 0.5);
  const p2 = M.pop(t, S + 0.12, 0.55);
  const sz = fitSize(word.length, 230, 980, 0.66);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: H - bottom, textAlign: 'center', fontFamily: FONT }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, opacity: clamp(p * 2, 0, 1), transform: `translateY(${(1 - p) * 40}px)` }}>
          {n != null && (
            <div style={{ width: 84, height: 84, borderRadius: 999, background: K.orange, color: '#fff', fontWeight: 900, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
          )}
          <div style={{ fontSize: 58, fontWeight: 800, color: K.ink, letterSpacing: -1 }}>{small}</div>
        </div>
        <div style={{ fontSize: sz, fontWeight: 900, color: K.orange, letterSpacing: -6, lineHeight: 1, textTransform: 'uppercase', opacity: clamp(p2 * 2, 0, 1), transform: `scale(${0.7 + 0.3 * p2})` }}>{word}</div>
      </div>
    </div>
  );
};
const labelBox = (p: LabelBehindProps): Box => { const b = p.bottom ?? 930; return { x0: 50, y0: b - 330, x1: 1030, y1: b }; };

// ── whip ─────────────────────────────────────────────────────────────────────────────────
export type WhipProps = { covers?: string[]; at?: number; dur?: number; travel?: number; cardW?: number };
export const Whip: React.FC<Base & WhipProps> = ({ t, S, E, covers = [], at, dur = 1.0, travel, cardW = 250 }) => {
  const a = at ?? S;
  const h = cardW * (16 / 9);
  const pitch = h + 50;
  const per = 6;
  const trav = travel ?? H + per * pitch * 0.7;
  const p = lin(t, a, dur);
  const e = ease.inOutCubic(p);
  const vel = Math.sin(Math.PI * p);              // 0 at both ends, 1 mid-flight
  const cols = [{ x: 190, speed: 1, off: 0 }, { x: 890, speed: 1.22, off: 0.5 }];
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) * lin(t, a - 0.05, 0.1) * (1 - lin(t, a + dur, 0.25)) }}>
      {cols.map((c, ci) => (
        <div key={ci} style={{ position: 'absolute', left: c.x - cardW / 2, top: 0, width: cardW, filter: `blur(${vel * 22}px)` }}>
          {Array.from({ length: per }, (_, k) => {
            const y = H + 80 + (k + c.off) * pitch - e * trav * c.speed;
            return (
              <div key={k} style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${y}px) scaleY(${1 + vel * 0.25})` }}>
                <Cover src={covers.length ? covers[(k * 2 + ci) % covers.length] : undefined} i={k * 2 + ci} w={cardW} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── shotFan ──────────────────────────────────────────────────────────────────────────────
export type ShotFanProps = { shots?: string[]; at?: number; step?: number; w?: number; top?: number };
export const ShotFan: React.FC<Base & ShotFanProps> = ({ t, S, E, shots, at, step = 0.14, w = 440, top = 420 }) => {
  const list = shots && shots.length ? shots : [undefined, undefined, undefined, undefined];
  const n = list.length;
  const a = at ?? S + 0.2;
  const h = w * 1.2;
  const spread = 28;
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      {list.map((src, i) => {
        const t0 = a + i * step;
        const rise = ease.outCubic(lin(t, t0, 0.5));
        const open = ease.outBack(lin(t, a + n * step * 0.6 + 0.15, 0.6));
        const ang = (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * spread) * open;
        return (
          <div key={i} style={{ position: 'absolute', left: HEAD.x - w / 2, top, width: w, height: h, transformOrigin: '50% 100%', opacity: clamp(rise * 3, 0, 1), transform: `translateY(${(1 - rise) * 620}px) rotate(${ang}deg) scale(${0.92 + 0.08 * rise})` }}>
            <Shot src={src} i={i} w={w} h={h} />
          </div>
        );
      })}
    </div>
  );
};
const fanBox = (p: ShotFanProps): Box => {
  const w = p.w ?? 440, top = p.top ?? 420, h = w * 1.2, spread = (28 * Math.PI) / 180;
  const half = w / 2 * Math.cos(spread) + h * Math.sin(spread);
  return { x0: HEAD.x - half, y0: top, x1: HEAD.x + half, y1: top + h };
};

// ── bigTypeStack ─────────────────────────────────────────────────────────────────────────
export type TypeWord = { w: string; at: number };
export type BigTypeProps = {
  behind?: { pre?: TypeWord[]; hero?: TypeWord[] };
  front?: { pre?: TypeWord[]; hero?: TypeWord[]; post?: TypeWord[] };
  /** canvas y of the bottom edge of the block behind the head */
  bottom?: number;
  /** canvas y of the top of the front stack (chest) */
  frontY?: number;
};
const Line: React.FC<{ words: TypeWord[]; t: number; size: number; color: string; italic?: boolean; weight?: number; shadow?: boolean; maxW?: number }> = ({ words, t, size, color, italic, weight = 900, shadow, maxW = 1000 }) => {
  const chars = words.reduce((n, x) => n + x.w.length + 1, 0);
  const sz = fitSize(chars, size, maxW, italic ? 0.5 : 0.6);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: sz * 0.22, whiteSpace: 'nowrap', fontSize: sz, lineHeight: 0.98, fontWeight: weight, color, letterSpacing: -sz * 0.03, fontFamily: italic ? K.serif : FONT, fontStyle: italic ? 'italic' : 'normal', textShadow: shadow ? '0 4px 24px rgba(0,0,0,0.25)' : undefined }}>
      {words.map((x, i) => {
        const p = M.pop(t, x.at, 0.42);
        return <span key={i} style={{ display: 'inline-block', opacity: clamp(p * 2.2, 0, 1), transform: `translateY(${(1 - p) * 60}px) scale(${0.6 + 0.4 * p})` }}>{x.w}</span>;
      })}
    </div>
  );
};
export const BigTypeStack: React.FC<Base & BigTypeProps> = ({ t, S, E, behind, front, bottom = 900, frontY = 1180 }) => (
  <div style={{ ...fill, opacity: outAlpha(t, E) }}>
    <div style={{ position: 'absolute', left: 40, right: 40, bottom: H - bottom, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {behind?.pre && behind.pre.length > 0 && <Line words={behind.pre} t={t} size={190} color={K.ink} weight={800} maxW={980} />}
      {behind?.hero && behind.hero.length > 0 && <Line words={behind.hero} t={t} size={400} color={K.orange} maxW={980} />}
    </div>
    <div style={{ position: 'absolute', left: 40, right: 40, top: frontY, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {front?.pre && front.pre.length > 0 && <Line words={front.pre} t={t} size={120} color={K.ink} weight={800} shadow />}
      {front?.hero && front.hero.length > 0 && <Line words={front.hero} t={t} size={230} color={K.orange} italic weight={400} shadow />}
      {front?.post && front.post.length > 0 && <Line words={front.post} t={t} size={120} color={K.ink} weight={800} shadow />}
    </div>
  </div>
);

// ── depthText ────────────────────────────────────────────────────────────────────────────
export type DepthTextProps = { text: string; at?: number; layers?: number; dx?: number; dy?: number; bottom?: number; size?: number; color?: string };
export const DepthText: React.FC<Base & DepthTextProps> = ({ t, S, E, text, at, layers = 12, dx = 3, dy = 4, bottom = 930, size = 280, color }) => {
  const a = at ?? S + 0.2;
  const face = color ?? K.orange;
  const sz = fitSize(text.length, size, 960, 0.64);
  const base: React.CSSProperties = { position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: sz, letterSpacing: -sz * 0.03, lineHeight: 1, whiteSpace: 'nowrap' };
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: H - bottom, height: sz, transform: `translate(${-(layers * dx) / 2}px, ${-(layers * dy) / 2}px)` }}>
        {Array.from({ length: layers + 1 }, (_, k) => {
          const depth = layers - k;                      // k = layers is the front face
          const p = ease.outCubic(lin(t, a + k * 0.03, 0.3));
          const front = depth === 0;
          const shade = clamp(depth / layers, 0, 1);
          return (
            <div key={k} style={{ ...base, color: front ? face : K.navy, opacity: p * (front ? 1 : 0.55 + 0.45 * (1 - shade)), transform: `translate(${(layers - depth) * dx}px, ${(layers - depth) * dy}px) scale(${0.9 + 0.1 * p})`, filter: front ? undefined : `brightness(${0.75 + 0.25 * (1 - shade)})` }}>{text}</div>
          );
        })}
      </div>
    </div>
  );
};
const depthBox = (p: DepthTextProps): Box => { const b = p.bottom ?? 930, s = p.size ?? 280; return { x0: 60, y0: b - s - 20, x1: 1020, y1: b + (p.layers ?? 12) * (p.dy ?? 4) }; };

// ── dofPull ──────────────────────────────────────────────────────────────────────────────
export type DofProps = { shots?: string[]; blurAt: number; sharpAt?: number; maxBlur?: number };
export const DofPull: React.FC<Base & DofProps> = ({ t, S, E, shots, blurAt, sharpAt, maxBlur = 20 }) => {
  const list = shots && shots.length ? shots : Array.from({ length: 9 }, () => undefined as string | undefined);
  const cw = 300, ch = 400, gap = 26;
  const cols = 3;
  const b = ease.inOutCubic(lin(t, blurAt, 0.5)) * (sharpAt != null ? 1 - ease.inOutCubic(lin(t, sharpAt, 0.5)) : 1);
  const rows = Math.max(3, Math.ceil(list.length / cols));
  const gridW = cols * cw + (cols - 1) * gap;
  const gridH = rows * ch + (rows - 1) * gap;
  const p = M.enter(t, S, 0.5);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) * p }}>
      <div style={{ position: 'absolute', left: HEAD.x - gridW / 2, top: HEAD.y - gridH / 2 - 120, width: gridW, height: gridH, transform: `scale(${0.96 + 0.04 * p}) rotate(-3deg)`, filter: `blur(${b * maxBlur}px) brightness(${1 - 0.14 * b})` }}>
        {list.map((src, i) => (
          <div key={i} style={{ position: 'absolute', left: (i % cols) * (cw + gap), top: Math.floor(i / cols) * (ch + gap) }}>
            <Shot src={src} i={i} w={cw} h={ch} r={24} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── proofSlide ───────────────────────────────────────────────────────────────────────────
export type ProofSlideCard = { src: string; at: number; side?: 'left' | 'right'; x?: number; y?: number; w?: number; ratio?: number; tilt?: number; caption?: string };
export type ProofSlideProps = { cards: ProofSlideCard[] };
const slideGeom = (c: ProofSlideCard) => {
  const w = c.w ?? 560, ratio = c.ratio ?? 0.7, side = c.side ?? 'right';
  const cx = c.x ?? (side === 'right' ? 740 : 340);
  const cy = c.y ?? 700;
  return { w, h: w * ratio, cx, cy, side };
};
export const ProofSlide: React.FC<Base & ProofSlideProps> = ({ t, S, E, cards }) => (
  <div style={{ ...fill, opacity: outAlpha(t, E) }}>
    {cards.map((c, i) => {
      const g = slideGeom(c);
      const sign = g.side === 'right' ? 1 : -1;
      const p = lin(t, c.at, 0.5);
      const e = ease.outCubic(p);
      const tilt = c.tilt ?? 2;
      const rot = (g.side === 'right' ? tilt : -tilt) * e;
      const settle = p >= 1 ? Math.sin((t - c.at - 0.5) * 18) * 6 * Math.exp(-(t - c.at - 0.5) * 7) : 0;
      return (
        <div key={i} style={{ position: 'absolute', left: g.cx - g.w / 2, top: g.cy - g.h / 2, width: g.w, height: g.h, opacity: p > 0 ? 1 : 0, transform: `translateX(${sign * (1 - e) * 900 + settle * sign}px) rotate(${rot}deg)`, filter: `blur(${(1 - e) * 18}px)` }}>
          <Shot src={c.src} i={i} w={g.w} h={g.h} r={30} />
          {c.caption && (
            <div style={{ position: 'absolute', left: '50%', bottom: -34, transform: `translateX(-50%) scale(${M.pop(t, c.at + 0.4, 0.4)})`, background: K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 46, padding: '12px 34px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: shadowCard }}>{c.caption}</div>
          )}
        </div>
      );
    })}
  </div>
);
const proofSlideBox = (p: ProofSlideProps): Box => {
  const bs = p.cards.map((c) => { const g = slideGeom(c); return { x0: g.cx - g.w / 2 - 20, y0: g.cy - g.h / 2 - 20, x1: g.cx + g.w / 2 + 20, y1: g.cy + g.h / 2 + 50 }; });
  return { x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)), x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)) };
};

// ── igComments ───────────────────────────────────────────────────────────────────────────
export type IgCommentItem = { user: string; text: string; at: number; likes?: number };
export type IgCommentsProps = { items: IgCommentItem[]; top?: number; step?: number; w?: number };
const igHeight = (w: number, text: string) => { const perLine = Math.max(12, Math.floor((w - 190) / 24)); return 118 + Math.max(0, Math.ceil(text.length / perLine) - 1) * 40; };
const igLayout = (items: IgCommentItem[], top: number, step: number, w: number) => {
  let y = top;
  return items.map((it) => { const h = igHeight(w, it.text); const r = { y, h }; y += h + 26; return r; });
};
export const IgComments: React.FC<Base & IgCommentsProps> = ({ t, S, E, items, top = 520, step = 0.35, w = 720 }) => {
  const lay = igLayout(items, top, step, w);
  const exitAt = E - 0.45;
  return (
    <div style={fill}>
      {items.map((it, i) => {
        const left = i % 2 === 0;
        const at = it.at ?? S + i * step;
        const p = M.pop(t, at, 0.45);
        const fall = ease.inCubic(lin(t, exitAt + (items.length - 1 - i) * 0.04, 0.4));
        const x = left ? 40 : W - 40 - w;
        const hue = hash(it.user.length * 13 + it.user.charCodeAt(0));
        const avatar = [K.orange, K.navy, '#2EA56A', '#8A5CF6'][Math.floor(hue * 4)];
        return (
          <div key={i} style={{ ...cardBase, position: 'absolute', left: x, top: lay[i].y, width: w, minHeight: lay[i].h, borderRadius: 34, padding: '20px 26px', display: 'flex', gap: 20, alignItems: 'flex-start', fontFamily: FONT, opacity: clamp(p * 2, 0, 1) * (1 - fall * 0.2), transform: `translateX(${(left ? -1 : 1) * (1 - p) * 420}px) translateY(${fall * 1500}px) rotate(${(left ? -1 : 1) * fall * 8}deg) scale(${0.85 + 0.15 * p})` }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, background: avatar, color: '#fff', fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{it.user.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 30, color: K.ink }}>{it.user}</div>
              <div style={{ fontWeight: 500, fontSize: 38, lineHeight: 1.2, color: K.ink }}>{it.text}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: K.orange, flex: '0 0 auto', paddingTop: 6 }}>
              <svg width={34} height={34} viewBox="0 0 24 24" fill={K.orange}><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 5 6.3 5c2 0 3.6 1.1 5.7 2.7C14.1 6.1 15.7 5 17.7 5 21 5 23.100 8.300 21.600 11.700 19.500 16.400 12 21 12 21z" /></svg>
              {it.likes != null && <div style={{ fontWeight: 800, fontSize: 24, color: K.navy }}>{it.likes}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const igBox = (p: IgCommentsProps): Box => {
  const w = p.w ?? 720, top = p.top ?? 520;
  const lay = igLayout(p.items, top, p.step ?? 0.35, w);
  const last = lay[lay.length - 1];
  return { x0: 40, y0: top, x1: W - 40, y1: last ? last.y + last.h : top + 120 };
};

// keep Ic referenced for future glyph use without tree-shaking complaints
void Ic;

// ── registry ─────────────────────────────────────────────────────────────────────────────
export const FX_AROUND = {
  reelRing: { C: ReelRing, sfx: none, frame: true },
  orbit: { C: Orbit, sfx: none, frame: true },
  headlineBehind: { C: HeadlineBehind, sfx: none, box: headlineBox },
  counterBehind: { C: CounterBehind, sfx: none, box: counterBox },
  labelBehind: { C: LabelBehind, sfx: none, box: labelBox },
  whip: { C: Whip, sfx: none, frame: true },
  shotFan: { C: ShotFan, sfx: none, box: fanBox },
  bigTypeStack: { C: BigTypeStack, sfx: none, frame: true },
  depthText: { C: DepthText, sfx: none, box: depthBox },
  dofPull: { C: DofPull, sfx: none, frame: true },
  proofSlide: { C: ProofSlide, sfx: none, box: proofSlideBox },
  igComments: { C: IgComments, sfx: none, box: igBox },
};
