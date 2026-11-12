// fx2 / data family (clean-room): number, chart and diagram elements. Everything is a pure function of t (seconds).
// All elements are authored on the 1080x1920 canvas, live in a 960px wide column starting at `y`, and export a bbox via `box`.
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { C, FONT, MONO } from '../tokens';
import { STACK as K } from '../stack';
import { clamp, ease, lin, M } from '../motion';
import { Ic, Tile } from '../Icon';

type Base = { t: number; S: number; E: number; skin?: string; format?: string; onDark?: boolean };

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const fr = (x: number) => x - Math.floor(x);
const hash = (n: number) => fr(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const fmt = (v: number, d = 0) => {
  const [a, b] = Math.abs(v).toFixed(d).split('.');
  return (v < 0 ? '-' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '');
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const tint = (hex: string, a: number) => hex + Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0');
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);
const SH = '0 30px 60px -24px rgba(15,23,42,0.30), 0 2px 8px rgba(15,23,42,0.06)';

const Wrap: React.FC<Base & { children: React.ReactNode }> = ({ t, S, E, children }) => {
  const o = lin(t, S, 0.25) * (1 - ease.inCubic(lin(t, E - 0.3, 0.3)));
  const e = ease.inCubic(lin(t, E - 0.3, 0.3));
  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: o, transform: `translateY(${-e * 24}px)` }}>{children}</div>;
};

const cardSt = (x: number, y: number, w: number, h: number, r = 44): React.CSSProperties => ({
  position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: K.panel,
  border: `1px solid ${tint(K.ink, 0.1)}`, boxShadow: SH, boxSizing: 'border-box',
});
const txt = (size: number, color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 800, fontSize: size, color, lineHeight: 1.1, ...extra });
const eyebrow = (color: string): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 800, fontSize: 32, letterSpacing: 6, textTransform: 'uppercase', color });

const Media: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) =>
  isVid(src)
    ? <OffthreadVideo src={staticFile(src)} volume={0} muted style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: 'none', ...style }} />
    : <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;

const Star: React.FC<{ size: number; fill: number; color: string; track: string }> = ({ size, fill, color, track }) => {
  const pts = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';
  const id = `st${Math.round(fill * 1000)}${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <clipPath id={id}><rect x={0} y={0} width={24 * clamp(fill, 0, 1)} height={24} /></clipPath>
      <polygon points={pts} fill={track} stroke={track} strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points={pts} fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round" clipPath={`url(#${id})`} />
    </svg>
  );
};

/** Particles bursting from (cx,cy). t0 = start. */
const Burst: React.FC<{ t: number; t0: number; cx: number; cy: number; n?: number; dist?: number; ky?: number; colors: string[]; seed?: number }> = ({ t, t0, cx, cy, n = 24, dist = 340, ky = 0.8, colors, seed = 1 }) => {
  const u = lin(t, t0, 0.8);
  if (u <= 0 || u >= 1) return null;
  const e = ease.outCubic(u);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + hash(i + seed) * 0.5;
        const d = dist * (0.45 + 0.55 * hash(i * 3 + seed + 9)) * e;
        const s = 8 + hash(i * 5 + seed) * 14;
        return <div key={i} style={{ position: 'absolute', left: cx + Math.cos(a) * d - s / 2, top: cy + Math.sin(a) * d * ky - s / 2, width: s, height: s, borderRadius: i % 3 === 0 ? 2 : 99, background: colors[i % colors.length], opacity: 1 - u * u, transform: `rotate(${i * 40 + u * 200}deg) scale(${1 - u * 0.5})` }} />;
      })}
    </>
  );
};

const Shock: React.FC<{ t: number; t0: number; cx: number; cy: number; r0?: number; r1?: number; color: string; w?: number }> = ({ t, t0, cx, cy, r0 = 40, r1 = 300, color, w = 10 }) => {
  const u = lin(t, t0, 0.8);
  if (u <= 0 || u >= 1) return null;
  const r = lerp(r0, r1, ease.outCubic(u));
  return <div style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: 99, border: `${w * (1 - u) + 1}px solid ${color}`, opacity: 1 - u, boxSizing: 'border-box' }} />;
};

const boxOf = (y: number, h: number) => ({ x0: 60, y0: y, x1: 1020, y1: y + h });

// ── 1. countUp ───────────────────────────────────────────────────────────────────────────
export type CountUpProps = { from?: number; to: number; prefix?: string; suffix?: string; decimals?: number; label?: string; at?: number; dur?: number; variant?: 'plain' | 'burst'; icons?: string[]; y?: number };
const CountUp: React.FC<Base & CountUpProps> = (p) => {
  const { t, S, E, onDark, from = 0, to, prefix = '', suffix = '', decimals = 0, label, dur = 1.6, variant = 'plain', icons = ['user', 'dollar', 'zap'], y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const burst = variant === 'burst';
  const a = p.at ?? (burst ? S + 1.1 : S + 0.15);
  const cy = y + (burst ? 300 : 220);
  const prog = ease.outCubic(lin(t, a, dur));
  const v = from + (to - from) * prog;
  const full = prefix + fmt(to, decimals) + suffix;
  const size = Math.min(240, 900 / (full.length * 0.6));
  const pop = burst ? M.pop(t, a, 0.5) : M.pop(t, a - 0.1, 0.5);
  const sc = clamp(pop, 0, 1.4) * (0.72 + 0.28 * prog);
  const shown = burst ? t >= a : t >= a - 0.1;
  const n = icons.length;
  const conv = ease.inCubic(lin(t, S + 0.15, Math.max(0.3, a - S - 0.15)));
  return (
    <Wrap t={t} S={S} E={E}>
      {!burst && <div style={{ position: 'absolute', left: 540 - 330, top: cy - 200, width: 660, height: 400, borderRadius: 999, background: `radial-gradient(closest-side, ${tint(K.orange, 0.22 * pop)}, ${tint(K.orange, 0)})` }} />}
      {burst && t < a + 0.05 && icons.map((ic, i) => {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + (1 - conv) * 0.6;
        const rx = 400 * (1 - conv), ry = 240 * (1 - conv);
        const s = 1 - 0.5 * conv;
        return (
          <div key={i} style={{ position: 'absolute', left: 540 + Math.cos(ang) * rx - 60, top: cy + Math.sin(ang) * ry - 60, transform: `scale(${s * clamp(lin(t, S + 0.05 + i * 0.08, 0.3), 0, 1)})`, opacity: t >= a ? 0 : 1 }}>
            <Tile n={ic} size={120} tone={i % 2 ? 'dark' : 'orange'} />
          </div>
        );
      })}
      {burst && <Shock t={t} t0={a} cx={540} cy={cy} r0={60} r1={420} color={K.orange} w={16} />}
      {burst && <Burst t={t} t0={a} cx={540} cy={cy} n={30} dist={440} ky={0.62} colors={[K.orange, tx, K.navy]} seed={4} />}
      {shown && (
        <div style={{ position: 'absolute', left: 0, top: cy - size * 0.56, width: 1080, textAlign: 'center', ...txt(size, tx, { fontWeight: 900, letterSpacing: -4, fontVariantNumeric: 'tabular-nums' }), transform: `scale(${sc})`, transformOrigin: '50% 50%' }}>
          <span style={{ color: K.orange }}>{prefix}</span>{fmt(v, decimals)}<span style={{ color: K.orange }}>{suffix}</span>
        </div>
      )}
      {label && (
        <div style={{ position: 'absolute', left: 60, width: 960, top: cy + size * 0.58 + 10, textAlign: 'center', ...txt(46, tx, { fontWeight: 700, opacity: 0.7 * clamp(lin(t, a + 0.2, 0.35), 0, 1) }), transform: `translateY(${(1 - ease.outCubic(lin(t, a + 0.2, 0.35))) * 20}px)` }}>{label}</div>
      )}
    </Wrap>
  );
};

// ── 2. chartScrub ────────────────────────────────────────────────────────────────────────
export type ChartScrubProps = { title?: string; data: { d: string; v: number }[]; compare?: number[]; prefix?: string; suffix?: string; scrubAt?: number; scrubDur?: number; y?: number };
const ChartScrub: React.FC<Base & ChartScrubProps> = (p) => {
  const { t, S, E, onDark, title, data = [], compare, prefix = '', suffix = '', scrubDur = 2, y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const scrubAt = p.scrubAt ?? S + 1.8;
  const n = Math.max(2, data.length);
  const px0 = 120, px1 = 960, py0 = y + 150, py1 = y + 470;
  const all = [...data.map((d) => d.v), ...(compare ?? [])];
  const hi = Math.max(...all, 1), lo0 = Math.min(...all, 0);
  const lo = lo0 >= 0 ? Math.max(0, Math.min(...all) - (hi - Math.min(...all)) * 0.8) : lo0;
  const X = (i: number) => px0 + (i * (px1 - px0)) / (n - 1);
  const Y = (v: number) => py1 - ((v - lo) / (hi * 1.08 - lo || 1)) * (py1 - py0);
  const pts = data.map((d, i) => `${X(i)},${Y(d.v)}`);
  const cpts = (compare ?? []).map((v, i) => `${X(i)},${Y(v)}`);
  const dp = ease.inOutCubic(lin(t, S + 0.3, 1.3));
  const cid = `csc${Math.round(S * 100)}${Math.round(y)}`;
  const sp = ease.inOutCubic(lin(t, scrubAt, scrubDur));
  const f = sp * (data.length - 1);
  const i0 = Math.min(Math.floor(f), Math.max(0, data.length - 2));
  const val = data.length > 1 ? lerp(data[i0].v, data[i0 + 1].v, f - i0) : data[0]?.v ?? 0;
  const cval = compare && compare.length > 1 ? lerp(compare[Math.min(i0, compare.length - 2)], compare[Math.min(i0 + 1, compare.length - 1)], f - i0) : undefined;
  const cx = px0 + sp * (px1 - px0);
  const cyv = Y(val);
  const cursorO = lin(t, scrubAt - 0.15, 0.25);
  const bx = clamp(cx, 230, 850);
  const idx = clamp(Math.round(f), 0, data.length - 1);
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ ...cardSt(60, y, 960, 640), transform: `scale(${0.94 + 0.06 * M.enter(t, S, 0.4)})`, transformOrigin: '50% 50%' }} />
      {title && <div style={{ position: 'absolute', left: 110, top: y + 48, ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <clipPath id={cid}><rect x={px0 - 30} y={y} width={(px1 - px0 + 60) * dp} height={640} /></clipPath>
          <linearGradient id={cid + 'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.orange} stopOpacity={0.28} /><stop offset="1" stopColor={K.orange} stopOpacity={0} /></linearGradient>
        </defs>
        {[0, 1, 2, 3].map((g) => <line key={g} x1={px0 - 20} x2={px1 + 20} y1={py0 + (g * (py1 - py0)) / 3} y2={py0 + (g * (py1 - py0)) / 3} stroke={tint(tx, 0.1)} strokeWidth={2} />)}
        <g clipPath={`url(#${cid})`}>
          <polygon points={`${X(0)},${py1} ${pts.join(' ')} ${X(data.length - 1)},${py1}`} fill={`url(#${cid}g)`} />
          {cpts.length > 1 && <polyline points={cpts.join(' ')} fill="none" stroke={tint(tx, 0.45)} strokeWidth={7} strokeDasharray="4 16" strokeLinecap="round" strokeLinejoin="round" />}
          <polyline points={pts.join(' ')} fill="none" stroke={K.orange} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {cursorO > 0 && (
          <g opacity={cursorO}>
            <line x1={cx} x2={cx} y1={py0 - 10} y2={py1 + 14} stroke={tint(tx, 0.35)} strokeWidth={3} strokeDasharray="6 8" />
            {cval !== undefined && <circle cx={cx} cy={Y(cval)} r={11} fill={K.panel} stroke={tint(tx, 0.5)} strokeWidth={5} />}
            <circle cx={cx} cy={cyv} r={20} fill={tint(K.orange, 0.25)} />
            <circle cx={cx} cy={cyv} r={12} fill={K.orange} stroke={K.panel} strokeWidth={5} />
          </g>
        )}
        {data.map((d, i) => (n <= 8 || i % 2 === 0) && <text key={i} x={X(i)} y={y + 530} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={tx} opacity={0.55}>{d.d}</text>)}
      </svg>
      {cursorO > 0 && (
        <div style={{ position: 'absolute', left: bx - 150, top: clamp(cyv - 150, y + 90, y + 400), width: 300, opacity: cursorO, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: K.navy, color: K.panel === '#FFFFFF' ? '#fff' : K.bg, borderRadius: 24, padding: '12px 26px', boxShadow: SH, ...txt(44, '#fff', { fontVariantNumeric: 'tabular-nums' }) }}>
            <div style={{ fontSize: 26, opacity: 0.7, fontWeight: 700 }}>{data[idx]?.d}</div>
            {prefix}{fmt(val)}{suffix}
            {cval !== undefined && <div style={{ fontSize: 24, opacity: 0.6, fontWeight: 700 }}>vs {prefix}{fmt(cval)}{suffix}</div>}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 110, top: y + 575, ...txt(26, tx, { fontWeight: 700, opacity: 0.0 }) }} />
    </Wrap>
  );
};

// ── 3. statFill ──────────────────────────────────────────────────────────────────────────
export type StatFillProps = { variant?: 'bars' | 'ring' | 'stars'; title?: string; items: { label: string; pct: number; at: number; accent?: boolean }[]; rating?: number; y?: number };
const statH = (p: StatFillProps) => {
  const items = p.items ?? [];
  const head = p.title ? 110 : 40;
  if (p.variant === 'ring') {
    const cols = Math.min(Math.max(items.length, 1), 3), size = cols === 1 ? 400 : cols === 2 ? 330 : 270;
    return head + Math.ceil(items.length / cols) * (size + 100) + 30;
  }
  if (p.variant === 'stars') return head + 360 + (items.length ? 120 : 0);
  return head + items.length * 120 + 40;
};
const StatFill: React.FC<Base & StatFillProps> = (p) => {
  const { t, S, E, onDark, variant = 'bars', title, items = [], y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const h = statH(p);
  const head = title ? 110 : 40;
  const col = (it: { accent?: boolean }) => (it.accent ? K.orange : K.navy);
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ ...cardSt(60, y, 960, h), transform: `scale(${0.94 + 0.06 * M.enter(t, S, 0.4)})` }} />
      {title && <div style={{ position: 'absolute', left: 110, top: y + 44, ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
      {variant === 'bars' && items.map((it, i) => {
        const o = lin(t, it.at - 0.2, 0.3), f = ease.outCubic(lin(t, it.at, 1));
        const ry = y + head + i * 120;
        return (
          <div key={i} style={{ position: 'absolute', left: 110, top: ry, width: 860, opacity: o, transform: `translateX(${(1 - o) * -30}px)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...txt(40, tx, { fontWeight: 700 }) }}>
              <span>{it.label}</span>
              <span style={{ fontWeight: 900, color: it.accent ? K.orange : tx, fontVariantNumeric: 'tabular-nums' }}>{Math.round(it.pct * f)}%</span>
            </div>
            <div style={{ marginTop: 14, height: 34, borderRadius: 17, background: tint(tx, 0.1), overflow: 'hidden' }}>
              <div style={{ width: `${clamp(it.pct, 0, 100) * f}%`, height: '100%', borderRadius: 17, background: col(it) }} />
            </div>
          </div>
        );
      })}
      {variant === 'ring' && (() => {
        const cols = Math.min(Math.max(items.length, 1), 3), size = cols === 1 ? 400 : cols === 2 ? 330 : 270;
        const cw = 860 / cols;
        return items.map((it, i) => {
          const r = i % cols, rw = Math.floor(i / cols);
          const o = M.pop(t, it.at - 0.2, 0.4), f = ease.outCubic(lin(t, it.at, 1.1));
          const cx = 110 + cw * r + cw / 2, cy = y + head + rw * (size + 100) + size / 2;
          const rad = size / 2 - 22;
          return (
            <div key={i} style={{ position: 'absolute', left: cx - cw / 2, top: cy - size / 2, width: cw, opacity: clamp(o * 2, 0, 1), transform: `scale(${0.7 + 0.3 * clamp(o, 0, 1.1)})`, textAlign: 'center' }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
                <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={tint(tx, 0.1)} strokeWidth={size * 0.075} />
                <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={col(it)} strokeWidth={size * 0.075} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(it.pct / 100, 0, 1) * f} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
                <text x={size / 2} y={size / 2 + size * 0.12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size * 0.3} fill={tx}>{Math.round(it.pct * f)}%</text>
              </svg>
              <div style={{ marginTop: 14, ...txt(36, tx, { fontWeight: 700, opacity: 0.8 }) }}>{it.label}</div>
            </div>
          );
        });
      })()}
      {variant === 'stars' && (() => {
        const rating = p.rating ?? 4.8;
        const a0 = items[0]?.at ?? S + 0.4;
        const f = ease.inOutCubic(lin(t, a0, 1.4));
        const fill = rating * f;
        return (
          <>
            <div style={{ position: 'absolute', left: 60, width: 960, top: y + head + 10, display: 'flex', justifyContent: 'center', gap: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const pop = 1 + 0.18 * Math.exp(-Math.abs(fill - i - 0.5) * 6) * (f > 0 && f < 1 ? 1 : 0);
                return <div key={i} style={{ transform: `scale(${pop})` }}><Star size={150} fill={fill - i} color={K.orange} track={tint(tx, 0.12)} /></div>;
              })}
            </div>
            <div style={{ position: 'absolute', left: 60, width: 960, top: y + head + 190, textAlign: 'center', ...txt(130, tx, { fontWeight: 900, fontVariantNumeric: 'tabular-nums' }) }}>
              {fmt(fill, 1)}<span style={{ fontSize: 56, opacity: 0.45 }}> / 5</span>
            </div>
            {items.length > 0 && (
              <div style={{ position: 'absolute', left: 90, width: 900, top: y + head + 370, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                {items.map((it, i) => (
                  <div key={i} style={{ padding: '10px 24px', borderRadius: 99, background: it.accent ? K.orange : tint(tx, 0.08), color: it.accent ? '#fff' : tx, ...txt(32, it.accent ? '#fff' : tx, { fontWeight: 700 }), opacity: lin(t, it.at, 0.3), transform: `scale(${0.8 + 0.2 * M.pop(t, it.at, 0.4)})` }}>{it.label} · {it.pct}%</div>
                ))}
              </div>
            )}
          </>
        );
      })()}
    </Wrap>
  );
};

// ── 4. pathDraw ──────────────────────────────────────────────────────────────────────────
export type PathDrawProps = { variant?: 'flow' | 'arrow'; title?: string; steps: { label: string; icon?: string; at: number }[]; label?: string; at?: number; y?: number };
const pathH = (p: PathDrawProps) => (p.variant === 'arrow' ? 640 : (p.title ? 90 : 0) + Math.max(1, (p.steps ?? []).length) * 230 - 70);
const PathDraw: React.FC<Base & PathDrawProps> = (p) => {
  const { t, S, E, onDark, variant = 'flow', title, steps = [], label, y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const head = title ? 90 : 0;
  if (variant === 'arrow') {
    const a = p.at ?? S + 0.2, dur = 1.7;
    const pts: [number, number][] = [[110, 520], [340, 400], [490, 450], [720, 250], [930, 150]];
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    const tot = seg.reduce((s, v) => s + v, 0);
    const at = (fracv: number): [number, number] => {
      let d = fracv * tot;
      for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const u = clamp(d / seg[i], 0, 1); return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } d -= seg[i]; }
      return pts[pts.length - 1];
    };
    const dp = ease.inOutCubic(lin(t, a, dur));
    const d = pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1] + y + head - 60}`).join(' ');
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const ang = (Math.atan2(last[1] - prev[1], last[0] - prev[0]) * 180) / Math.PI;
    const done = lin(t, a + dur - 0.15, 0.25);
    const n = steps.length;
    return (
      <Wrap t={t} S={S} E={E}>
        {title && <div style={{ position: 'absolute', left: 60, width: 960, top: y, textAlign: 'center', ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
          <line x1={80} x2={1000} y1={y + head + 480} y2={y + head + 480} stroke={tint(tx, 0.15)} strokeWidth={4} strokeLinecap="round" />
          <path d={d} fill="none" stroke={tint(K.orange, 0.22)} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dp} />
          <path d={d} fill="none" stroke={K.orange} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dp} />
          <g transform={`translate(${last[0]} ${last[1] + y + head - 60}) rotate(${ang})`} opacity={done}>
            <polygon points="42,0 -14,-40 -14,40" fill={K.orange} stroke={K.orange} strokeWidth={10} strokeLinejoin="round" />
          </g>
        </svg>
        {steps.map((s, i) => {
          const q = at(n > 1 ? i / (n - 1) * 0.92 + 0.04 : 0.5);
          const o = M.pop(t, s.at, 0.45);
          const top = i % 2 === 0;
          return (
            <div key={i} style={{ position: 'absolute', left: q[0] - 100, top: q[1] + y + head - 60 - 40, width: 200, textAlign: 'center', opacity: clamp(o * 2, 0, 1), transform: `scale(${0.5 + 0.5 * clamp(o, 0, 1.15)})` }}>
              <div style={{ width: 80, height: 80, margin: '0 auto', borderRadius: 99, background: K.panel, border: `6px solid ${K.orange}`, boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                {s.icon ? <Ic n={s.icon} size={38} color={K.orange} sw={2.6} /> : <span style={txt(34, K.orange, { fontWeight: 900 })}>{i + 1}</span>}
              </div>
              <div style={{ marginTop: top ? 14 : -170, ...txt(34, tx, { fontWeight: 800 }), position: top ? 'static' : 'relative' }}>{s.label}</div>
            </div>
          );
        })}
        {label && (
          <div style={{ position: 'absolute', left: 540, top: y + head + 20, transform: `translateX(-50%) rotate(-6deg) scale(${clamp(M.pop(t, p.at ? p.at + dur : a + dur, 0.5), 0, 1.15)})`, background: K.navy, color: '#fff', padding: '18px 40px', borderRadius: 99, boxShadow: SH, outline: `5px dashed ${tint('#ffffff', 0.5)}`, outlineOffset: -12, ...txt(52, '#fff', { fontWeight: 900 }) }}>{label}</div>
        )}
      </Wrap>
    );
  }
  // flow
  const bw = 440, bh = 150, pitch = 230;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <div style={{ position: 'absolute', left: 60, width: 960, top: y, textAlign: 'center', ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        {steps.slice(1).map((s, i) => {
          const fromLeft = i % 2 === 0;
          const x0 = fromLeft ? 80 + bw / 2 : 1000 - bw / 2, x1 = fromLeft ? 1000 - bw / 2 : 80 + bw / 2;
          const y0 = y + head + i * pitch + bh, y1 = y + head + (i + 1) * pitch;
          const dp = ease.inOutCubic(lin(t, s.at - 0.45, 0.45));
          const my = (y0 + y1) / 2;
          return (
            <g key={i}>
              <path d={`M ${x0} ${y0 + 6} C ${x0} ${my + 30}, ${x1} ${my - 30}, ${x1} ${y1 - 18}`} fill="none" stroke={K.orange} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dp} />
              <polygon points={`${x1},${y1 - 2} ${x1 - 18},${y1 - 34} ${x1 + 18},${y1 - 34}`} fill={K.orange} opacity={lin(dp, 0.92, 0.08)} />
            </g>
          );
        })}
      </svg>
      {steps.map((s, i) => {
        const left = i % 2 === 0;
        const o = M.pop(t, s.at, 0.45);
        return (
          <div key={i} style={{ ...cardSt(left ? 80 : 1000 - bw, y + head + i * pitch, bw, bh, 40), display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', opacity: clamp(o * 2, 0, 1), transform: `scale(${0.7 + 0.3 * clamp(o, 0, 1.12)})` }}>
            {s.icon ? <Tile n={s.icon} size={86} tone={i % 2 ? 'dark' : 'orange'} /> : <div style={{ width: 86, height: 86, borderRadius: 24, background: K.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(44, '#fff', { fontWeight: 900 }) }}>{i + 1}</div>}
            <div style={txt(44, tx === '#fff' && K.panel === '#FFFFFF' ? K.ink : tx)}>{s.label}</div>
          </div>
        );
      })}
    </Wrap>
  );
};

// ── 5. livingIcons ───────────────────────────────────────────────────────────────────────
export type IconKind = 'gear' | 'clock' | 'pulse' | 'flow' | 'bell';
export type LivingIconsProps = { title?: string; items: { kind: IconKind; label: string; at: number }[]; y?: number };
const LiveIcon: React.FC<{ kind: IconKind; t: number; size: number; a: string; b: string }> = ({ kind, t, size, a, b }) => {
  if (kind === 'bell') {
    const cyc = fr(t / 1.8);
    const ang = cyc < 0.6 ? Math.sin(cyc * 38) * 22 * (1 - cyc / 0.6) : 0;
    return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${ang}deg)`, transformOrigin: '50% 12%' }}><Ic n="bell" size={size * 0.8} color={a} sw={2.2} /></div>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'gear' && (
        <g transform={`rotate(${t * 55} 50 50)`}>
          {Array.from({ length: 8 }, (_, k) => <rect key={k} x={43} y={6} width={14} height={16} rx={3} fill={a} transform={`rotate(${k * 45} 50 50)`} />)}
          <circle cx={50} cy={50} r={31} fill="none" stroke={a} strokeWidth={9} />
          <circle cx={50} cy={50} r={11} fill="none" stroke={b} strokeWidth={6} />
        </g>
      )}
      {kind === 'clock' && (
        <g>
          <circle cx={50} cy={50} r={42} fill="none" stroke={b} strokeWidth={6} />
          {[0, 90, 180, 270].map((d) => <line key={d} x1={50} x2={50} y1={13} y2={20} stroke={b} strokeWidth={4} strokeLinecap="round" transform={`rotate(${d} 50 50)`} />)}
          <line x1={50} y1={50} x2={50} y2={29} stroke={b} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 12} 50 50)`} />
          <line x1={50} y1={50} x2={50} y2={18} stroke={a} strokeWidth={5} strokeLinecap="round" transform={`rotate(${t * 144} 50 50)`} />
          <circle cx={50} cy={50} r={5} fill={a} />
        </g>
      )}
      {kind === 'pulse' && (
        <g>
          {[0, 1, 2].map((k) => { const u = fr(t * 0.8 + k / 3); return <circle key={k} cx={50} cy={50} r={13 + 36 * u} fill="none" stroke={a} strokeWidth={4} opacity={(1 - u) * 0.8} />; })}
          <circle cx={50} cy={50} r={13 * (1 + 0.1 * Math.sin(t * 7))} fill={a} />
        </g>
      )}
      {kind === 'flow' && (
        <g>
          <rect x={6} y={36} width={26} height={28} rx={8} fill={b} />
          <rect x={68} y={36} width={26} height={28} rx={8} fill={a} />
          <line x1={34} x2={66} y1={50} y2={50} stroke={tint(b, 0.35)} strokeWidth={4} strokeDasharray="3 5" />
          {[0, 1, 2, 3].map((k) => { const u = fr(t * 0.7 + k / 4); return <rect key={k} x={26 + u * 42} y={45} width={10} height={10} rx={2.5} fill={a} opacity={Math.sin(u * Math.PI)} transform={`rotate(${u * 90} ${31 + u * 42} 50)`} />; })}
        </g>
      )}
    </svg>
  );
};
const livingLayout = (n: number) => { const cols = n <= 1 ? 1 : 2; const cw = cols === 1 ? 560 : 460; return { cols, cw, ch: 340, gx: 40, gy: 40 }; };
const LivingIcons: React.FC<Base & LivingIconsProps> = ({ t, S, E, onDark, title, items = [], y = 520 }) => {
  const tx = onDark ? '#fff' : K.ink;
  const L = livingLayout(items.length);
  const head = title ? 90 : 0;
  const rows = Math.ceil(items.length / L.cols);
  const totalW = L.cols * L.cw + (L.cols - 1) * L.gx;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <div style={{ position: 'absolute', left: 60, width: 960, top: y, textAlign: 'center', ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
      {items.map((it, i) => {
        const c = i % L.cols, r = Math.floor(i / L.cols);
        const inRow = Math.min(L.cols, items.length - r * L.cols);
        const rowW = inRow * L.cw + (inRow - 1) * L.gx;
        const x = 540 - rowW / 2 + c * (L.cw + L.gx);
        const o = M.pop(t, it.at, 0.45);
        void rows; void totalW;
        return (
          <div key={i} style={{ ...cardSt(x, y + head + r * (L.ch + L.gy), L.cw, L.ch, 44), opacity: clamp(o * 2, 0, 1), transform: `translateY(${(1 - clamp(o, 0, 1)) * 40}px) scale(${0.85 + 0.15 * clamp(o, 0, 1.1)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 190, height: 190, borderRadius: 99, background: tint(K.orange, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LiveIcon kind={it.kind} t={t - it.at} size={140} a={K.orange} b={K.navy === '#8FB4FF' ? tx : K.navy} />
            </div>
            <div style={txt(46, tx)}>{it.label}</div>
          </div>
        );
      })}
    </Wrap>
  );
};

// ── 6. heartbeat ─────────────────────────────────────────────────────────────────────────
export type HeartbeatProps = { label?: string; bpm?: number; flatAt: number; payoffAt?: number; cards?: string[]; y?: number };
const beatWave = (p: number) => {
  const g = (m: number, s: number, a: number) => a * Math.exp(-((p - m) * (p - m)) / (2 * s * s));
  return g(0.14, 0.035, 0.14) - g(0.285, 0.011, 0.12) + g(0.32, 0.012, 1) - g(0.355, 0.012, 0.3) + g(0.6, 0.05, 0.25);
};
const Heartbeat: React.FC<Base & HeartbeatProps> = (p) => {
  const { t, S, E, onDark, label = 'Heartbeat', bpm = 72, flatAt, cards = ['Ads', 'Form', 'Buyers'], y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const payoffAt = p.payoffAt ?? flatAt + 1;
  const GREY = '#9AA3AD';
  const x0 = 100, w = 880, cy = y + 250, amp = 120, win = 2.6, N = 220, T = 60 / bpm;
  const before: string[] = [], after: string[] = [];
  let lastB = '';
  for (let k = 0; k <= N; k++) {
    const tau = t - win + (k / N) * win;
    if (tau < S + 0.05) continue;
    const x = x0 + (k / N) * w;
    const v = tau < flatAt ? beatWave(fr((tau - S) / T)) : 0;
    const pt = `${x.toFixed(1)},${(cy - v * amp).toFixed(1)}`;
    if (tau < flatAt) { before.push(pt); lastB = pt; } else { if (!after.length && lastB) after.push(lastB); after.push(pt); }
  }
  const dead = t >= flatAt;
  const dim = 1 - 0.6 * ease.outCubic(lin(t, payoffAt, 0.5));
  const live = Math.round(bpm + (hash(Math.floor(t * 2)) - 0.5) * 4);
  const n = cards.length;
  const gap = 44, cw = (960 - (n - 1) * gap) / n;
  const cy2 = y + 470;
  const headX = x0 + w;
  const headY = cy - (dead ? 0 : beatWave(fr((t - S) / T)) * amp);
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ opacity: dim }}>
        <div style={cardSt(60, y, 960, 380)} />
        <div style={{ position: 'absolute', left: 110, top: y + 40, ...eyebrow(tx), opacity: 0.75 }}>{label}</div>
        <div style={{ position: 'absolute', right: 110, top: y + 22, textAlign: 'right', ...txt(84, dead ? GREY : K.orange, { fontWeight: 900, fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }) }}>
          {dead ? 0 : live}<span style={{ fontSize: 30, marginLeft: 10, opacity: 0.7 }}>BPM</span>
        </div>
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
          {[0, 1, 2, 3, 4].map((g) => <line key={g} x1={x0} x2={x0 + w} y1={y + 140 + g * 55} y2={y + 140 + g * 55} stroke={tint(tx, 0.07)} strokeWidth={2} />)}
          {Array.from({ length: 12 }, (_, g) => <line key={g} y1={y + 140} y2={y + 140 + 220} x1={x0 + g * (w / 11)} x2={x0 + g * (w / 11)} stroke={tint(tx, 0.05)} strokeWidth={2} />)}
          {before.length > 1 && <polyline points={before.join(' ')} fill="none" stroke={tint(K.orange, 0.25)} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />}
          {before.length > 1 && <polyline points={before.join(' ')} fill="none" stroke={K.orange} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
          {after.length > 1 && <polyline points={after.join(' ')} fill="none" stroke={GREY} strokeWidth={7} strokeLinecap="round" />}
          {t > S + 0.2 && <circle cx={headX} cy={headY} r={11} fill={dead ? GREY : K.orange} />}
        </svg>
        {dead && <div style={{ position: 'absolute', left: 110, top: y + 310, ...txt(30, C.red, { fontFamily: MONO, letterSpacing: 4, opacity: Math.sin((t - flatAt) * 9) > -0.3 ? 1 : 0.2 }) }}>NO SIGNAL</div>}
      </div>
      {cards.map((c, i) => {
        const ax = payoffAt + i * 0.25;
        const last = i === n - 1;
        const pp = M.pop(t, ax, 0.45);
        const hit = Math.max(0, t - ax);
        const sc = clamp(pp, 0, 1.2) * (last ? 1 + 0.2 * Math.exp(-hit * 6) * Math.cos(hit * 12) : 1);
        const left = 60 + i * (cw + gap);
        return (
          <React.Fragment key={i}>
            {last && <div style={{ position: 'absolute', left: left + cw / 2 - 260, top: cy2 + 85 - 260, width: 520, height: 520, borderRadius: 99, background: `radial-gradient(closest-side, ${tint(K.orange, 0.5 * Math.exp(-hit * 2.5) * (t >= ax ? 1 : 0))}, ${tint(K.orange, 0)})` }} />}
            <div style={{ ...cardSt(left, cy2, cw, 170, 40), background: last ? K.orange : K.panel, opacity: clamp(pp * 2, 0, 1), transform: `scale(${sc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(n > 3 ? 36 : 46, last ? '#fff' : tx) }}>{c}</div>
            {i > 0 && <div style={{ position: 'absolute', left: left - gap, width: gap, top: cy2 + 62, textAlign: 'center', ...txt(46, K.orange, { fontWeight: 900 }), opacity: clamp(pp * 2, 0, 1) }}>›</div>}
            {last && <Shock t={t} t0={ax} cx={left + cw / 2} cy={cy2 + 85} r0={60} r1={360} color={K.orange} w={14} />}
            {last && <Burst t={t} t0={ax} cx={left + cw / 2} cy={cy2 + 85} n={22} dist={330} ky={0.7} colors={[K.orange, K.navy, tx]} seed={11} />}
          </React.Fragment>
        );
      })}
    </Wrap>
  );
};

// ── 7. retention ─────────────────────────────────────────────────────────────────────────
export type RetentionProps = { title?: string; loops?: [number, number][]; at?: number; dur?: number; withEnd?: number; withoutEnd?: number; withLabel?: string; withoutLabel?: string; y?: number };
const Retention: React.FC<Base & RetentionProps> = (p) => {
  const { t, S, E, onDark, title = 'Retention', loops = [[0.08, 0.3], [0.36, 0.6], [0.66, 0.92]], dur = 3, withEnd = 82, withoutEnd = 21, withLabel = 'With follow-up', withoutLabel = 'Without', y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const a = p.at ?? S + 0.5;
  const u = lin(t, a, dur);
  const x0 = 110, x1 = 970, ly = y + 280;
  const cxn = x0 + u * (x1 - x0);
  const chT = y + 400, chH = 280;
  const CY = (v: number) => chT + chH - (v / 100) * chH;
  const wv = (q: number) => 100 - (100 - withEnd) * Math.pow(q, 0.8) + 1.6 * Math.sin(q * 20) * q;
  const nv = (q: number) => withoutEnd + (100 - withoutEnd) * Math.pow(1 - q, 2);
  const mk = (f: (q: number) => number) => Array.from({ length: 61 }, (_, i) => `${(x0 + (i / 60) * (x1 - x0)).toFixed(1)},${CY(f(i / 60)).toFixed(1)}`).join(' ');
  const cid = `ret${Math.round(S * 100)}${Math.round(y)}`;
  const o = M.enter(t, S, 0.4);
  const end = lin(u, 0.9, 0.1);
  const starPts = '0,-26 8,-9 26,-7 12,5 16,24 0,15 -16,24 -12,5 -26,-7 -8,-9';
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ ...cardSt(60, y, 960, 800), transform: `scale(${0.94 + 0.06 * o})` }} />
      <div style={{ position: 'absolute', left: 110, top: y + 44, ...eyebrow(tx), opacity: 0.8 }}>{title}</div>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs><clipPath id={cid}><rect x={x0 - 10} y={chT - 20} width={(x1 - x0 + 20) * u} height={chH + 40} /></clipPath></defs>
        <line x1={x0} x2={x1} y1={ly} y2={ly} stroke={tint(tx, 0.18)} strokeWidth={8} strokeLinecap="round" />
        {loops.map(([s, e], i) => {
          const xa = x0 + s * (x1 - x0), xb = x0 + e * (x1 - x0);
          const rx = (xb - xa) / 2, ry = Math.min(rx * 0.9, 120);
          const prog = clamp((u - s) / (e - s), 0, 1), closed = u >= e;
          const star = M.pop(t, a + e * dur, 0.5);
          return (
            <g key={i}>
              <path d={`M ${xa} ${ly} A ${rx} ${ry} 0 0 1 ${xb} ${ly}`} fill="none" stroke={closed ? K.orange : K.navy === '#8FB4FF' ? tx : K.navy} strokeWidth={closed ? 9 : 6} strokeLinecap="round" strokeDasharray={closed ? undefined : '1 1'} pathLength={1} strokeDashoffset={closed ? 0 : 1 - prog} />
              {u >= s && <circle cx={xa} cy={ly} r={9} fill={K.orange} />}
              {closed && <g transform={`translate(${(xa + xb) / 2} ${ly - ry - 36}) scale(${clamp(star, 0, 1.2)})`}><polygon points={starPts} fill={K.orange} stroke={K.orange} strokeWidth={5} strokeLinejoin="round" /></g>}
            </g>
          );
        })}
        <line x1={cxn} x2={cxn} y1={ly - 30} y2={ly + 30} stroke={K.orange} strokeWidth={6} strokeLinecap="round" opacity={lin(t, a - 0.1, 0.2)} />
        <circle cx={cxn} cy={ly} r={16} fill={K.orange} stroke={K.panel} strokeWidth={6} opacity={lin(t, a - 0.1, 0.2)} />
        {[0, 50, 100].map((g) => <g key={g}><line x1={x0} x2={x1} y1={CY(g)} y2={CY(g)} stroke={tint(tx, 0.08)} strokeWidth={2} /><text x={x0 - 14} y={CY(g) + 10} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={26} fill={tx} opacity={0.5}>{g}%</text></g>)}
        <g clipPath={`url(#${cid})`}>
          <polyline points={mk(nv)} fill="none" stroke={tint(tx, 0.5)} strokeWidth={7} strokeDasharray="4 16" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={mk(wv)} fill="none" stroke={K.orange} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx={cxn} cy={CY(wv(u))} r={12} fill={K.orange} stroke={K.panel} strokeWidth={5} opacity={lin(t, a, 0.2)} />
        <circle cx={cxn} cy={CY(nv(u))} r={9} fill={tint(tx, 0.55)} stroke={K.panel} strokeWidth={4} opacity={lin(t, a, 0.2)} />
      </svg>
      <div style={{ position: 'absolute', left: 110, width: 860, top: CY(withEnd) - 74, textAlign: 'right', ...txt(54, K.orange, { fontWeight: 900 }), opacity: end, transform: `scale(${0.8 + 0.2 * end})`, transformOrigin: '100% 50%' }}>{withEnd}%</div>
      <div style={{ position: 'absolute', left: 110, width: 860, top: CY(withoutEnd) + 16, textAlign: 'right', ...txt(46, tx, { fontWeight: 800, opacity: 0.6 * end }) }}>{withoutEnd}%</div>
      <div style={{ position: 'absolute', left: 110, top: y + 725, display: 'flex', gap: 40, ...txt(32, tx, { fontWeight: 700 }) }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><i style={{ width: 36, height: 8, borderRadius: 4, background: K.orange, display: 'block' }} />{withLabel}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}><i style={{ width: 36, height: 0, borderTop: `6px dotted ${tint(tx, 0.6)}`, display: 'block' }} />{withoutLabel}</span>
      </div>
    </Wrap>
  );
};

// ── 8. funnelReels ───────────────────────────────────────────────────────────────────────
export type FunnelReelsProps = { tiers?: string[]; srcs: string[]; pourAt?: number; lightAt?: number; winner?: string; y?: number };
const funnelH = (p: FunnelReelsProps) => 40 + (p.tiers ?? ['Views', 'Clicks', 'Leads', 'Sales']).length * 150 + 300;
const FunnelReels: React.FC<Base & FunnelReelsProps> = (p) => {
  const { t, S, E, onDark, srcs = [], y = 520 } = p;
  const tiers = p.tiers ?? ['Views', 'Clicks', 'Leads', 'Sales'];
  const tx = onDark ? '#fff' : K.ink;
  const pourAt = p.pourAt ?? S + 1.2;
  const lightAt = p.lightAt ?? pourAt + 2.4;
  const n = tiers.length;
  const th = 138, gap = 12, top = y + 20;
  const wAt = (i: number) => 940 * (1 - (i / n) * 0.72);   // width at top of tier i (i = n -> bottom)
  const bottomY = top + n * (th + gap);
  const winIdx = Math.max(0, p.winner ? srcs.indexOf(p.winner) : 0);
  const count = Math.min(6, Math.max(srcs.length, 4));
  const fallDur = 2.0;
  const lightP = M.pop(t, lightAt, 0.5);
  const wpos = (yy: number) => { const q = clamp((yy - top) / (n * (th + gap)), 0, 1); return 940 * (1 - q * 0.72); };
  return (
    <Wrap t={t} S={S} E={E}>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        {tiers.map((name, i) => {
          const o = M.pop(t, S + 0.1 + i * 0.18, 0.4);
          const wt = wAt(i), wb = wAt(i + 1) + (i === n - 1 ? 0 : 6);
          const yt = top + i * (th + gap), yb = yt + th;
          const lit = i === n - 1 ? clamp(lightP, 0, 1) : 0;
          const fill = i === n - 1 ? (lit > 0 ? K.orange : K.panel) : K.panel;
          return (
            <g key={i} opacity={clamp(o * 2, 0, 1)} transform={`translate(0 ${(1 - clamp(o, 0, 1)) * -30})`}>
              <polygon points={`${540 - wt / 2},${yt} ${540 + wt / 2},${yt} ${540 + wb / 2},${yb} ${540 - wb / 2},${yb}`} fill={fill} stroke={lit > 0 ? K.orange : tint(K.ink, 0.12)} strokeWidth={3} strokeLinejoin="round" style={{ filter: lit > 0 ? `drop-shadow(0 0 ${30 * lit}px ${K.orange})` : 'drop-shadow(0 10px 18px rgba(15,23,42,0.12))' }} />
              <text x={540} y={yt + th / 2 + 14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={lit > 0 ? '#fff' : onDark && K.panel === '#FFFFFF' ? K.ink : tx} opacity={0.9}>{name}</text>
            </g>
          );
        })}
      </svg>
      {Array.from({ length: count }, (_, i) => {
        const st = pourAt + i * 0.2;
        const isWin = i === winIdx % count;
        const u = lin(t, st, fallDur);
        if (u <= 0) return null;
        const src = srcs[i % Math.max(1, srcs.length)];
        if (!src) return null;
        const e = isWin ? ease.inOutCubic(u) : u;
        const yy = lerp(top - 150, bottomY - 20, e);
        const killAt = isWin ? 2 : 0.35 + 0.55 * hash(i + 3);
        const kill = isWin ? 0 : ease.inCubic(lin(u, killAt, 0.12));
        if (kill >= 1) return null;
        const lane = isWin ? 0 : (hash(i * 2 + 1) - 0.5) * 2;
        const half = wpos(yy) / 2;
        const xx = 540 + lane * half * 0.7;
        const s = lerp(1, 0.32, ease.outCubic(clamp((yy - top) / (bottomY - top), 0, 1))) * (1 - kill);
        const wait = isWin && u >= 1;
        const sc2 = wait ? 1 + 0.5 * clamp(lightP, 0, 1.1) : s;
        return (
          <div key={i} style={{ position: 'absolute', left: xx - 55, top: (wait ? bottomY + 40 : yy) - 98 * (wait ? 0.2 : 1) - 40, width: 110, height: 196, borderRadius: 18, overflow: 'hidden', background: K.navy, boxShadow: isWin && wait && lightP > 0 ? `0 0 0 6px ${K.orange}, 0 20px 50px -10px ${K.orange}` : SH, transform: `scale(${sc2}) rotate(${(1 - u) * (hash(i + 7) - 0.5) * 30}deg)`, opacity: clamp(lin(t, st, 0.2), 0, 1) }}>
            <Media src={src} />
          </div>
        );
      })}
      <Shock t={t} t0={lightAt} cx={540} cy={bottomY - th / 2} r0={80} r1={480} color={K.orange} w={14} />
      <Burst t={t} t0={lightAt} cx={540} cy={bottomY + 60} n={22} dist={380} ky={0.5} colors={[K.orange, K.navy, tx]} seed={21} />
      {t >= lightAt && (
        <div style={{ position: 'absolute', left: 540 - 150, width: 300, top: bottomY + 190, textAlign: 'center', ...txt(46, K.orange, { fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }), transform: `scale(${clamp(M.pop(t, lightAt + 0.15, 0.4), 0, 1.1)})` }}>Winner</div>
      )}
    </Wrap>
  );
};

// ── 9. spotlight ─────────────────────────────────────────────────────────────────────────
export type SpotlightProps = { target?: number; huntAt?: number; lockAt: number; label?: string; y?: number };
const Spotlight: React.FC<Base & SpotlightProps> = (p) => {
  const { t, S, E, onDark, lockAt, label = 'Your buyer', y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const target = clamp(Math.round(p.target ?? 27), 0, 47);
  const huntAt = p.huntAt ?? S + 1;
  const cols = 8, cw = 118, ch = 124, ox = 540 - (cols * cw) / 2 + cw / 2, oy = y + 120;
  const cell = (i: number) => ({ x: ox + (i % cols) * cw + (hash(i + 1) - 0.5) * 14, y: oy + Math.floor(i / cols) * ch + (hash(i + 50) - 0.5) * 10 });
  const hops = [3, 5, 8, 11, 13].map((k, j) => { let v = Math.floor(hash(k * 7 + j * 3 + 2) * 48); if (v === target) v = (v + 11) % 48; return v; });
  const wp = [...hops, target].map(cell);
  const seg = wp.length - 1;
  const q = clamp((t - huntAt) / Math.max(0.1, lockAt - huntAt), 0, 1) * seg;
  const si = Math.min(Math.floor(q), seg - 1);
  const e = ease.inOutCubic(q - si);
  const pos = { x: lerp(wp[si].x, wp[si + 1].x, e), y: lerp(wp[si].y, wp[si + 1].y, e) };
  const locked = t >= lockAt;
  const lk = ease.outCubic(lin(t, lockAt, 0.5));
  const so = lin(t, huntAt - 0.35, 0.35);
  const tp = cell(target);
  const R = lerp(120, 78, lk);
  const dim = 1 - 0.55 * lk;
  const lblx = clamp(tp.x, 230, 850);
  return (
    <Wrap t={t} S={S} E={E}>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="spbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.orange} stopOpacity={0} /><stop offset="1" stopColor={K.orange} stopOpacity={0.38} /></linearGradient>
          <radialGradient id="spglow"><stop offset="0" stopColor={K.orange} stopOpacity={0.5} /><stop offset="1" stopColor={K.orange} stopOpacity={0} /></radialGradient>
        </defs>
        {Array.from({ length: 48 }, (_, i) => {
          const c = cell(i);
          const pp = M.pop(t, S + 0.05 + hash(i * 13 + 5) * 0.8, 0.4);
          const d = Math.hypot(c.x - pos.x, c.y - pos.y);
          const hl = so * clamp(1 - d / 130, 0, 1);
          const isT = i === target && locked;
          const sc = clamp(pp, 0, 1.15) * (isT ? 1 + 0.35 * lk : 1);
          const person = (
            <>
              <circle cx={0} cy={-18} r={17} />
              <path d="M -28 34 Q -28 4 0 4 Q 28 4 28 34 Z" />
            </>
          );
          return (
            <g key={i} transform={`translate(${c.x} ${c.y}) scale(${sc})`} opacity={clamp(pp * 2, 0, 1)}>
              <g fill={tx} opacity={(isT ? 0 : 0.2) * (locked ? dim : 1)}>{person}</g>
              {(hl > 0.02 || isT) && <g fill={K.orange} opacity={isT ? 1 : hl}>{person}</g>}
            </g>
          );
        })}
        {so > 0 && (
          <g opacity={so * (locked ? 0.9 : 1)}>
            <polygon points={`${pos.x - 12},${pos.y - 320} ${pos.x + 12},${pos.y - 320} ${pos.x + R * 0.9},${pos.y} ${pos.x - R * 0.9},${pos.y}`} fill="url(#spbeam)" />
            <circle cx={pos.x} cy={pos.y} r={R * 1.5} fill="url(#spglow)" />
            <circle cx={pos.x} cy={pos.y} r={R} fill="none" stroke={K.orange} strokeWidth={locked ? 8 : 5} strokeDasharray={locked ? undefined : '14 12'} transform={locked ? undefined : `rotate(${t * 80} ${pos.x} ${pos.y})`} />
          </g>
        )}
      </svg>
      {[0, 1, 2].map((k) => <Shock key={k} t={t} t0={lockAt + k * 0.14} cx={tp.x} cy={tp.y} r0={50} r1={300} color={K.orange} w={10} />)}
      <Burst t={t} t0={lockAt} cx={tp.x} cy={tp.y} n={22} dist={300} ky={0.85} colors={[K.orange, K.navy, tx]} seed={31} />
      {locked && (
        <div style={{ position: 'absolute', left: lblx - 200, width: 400, top: tp.y - 160, textAlign: 'center', transform: `scale(${clamp(M.pop(t, lockAt + 0.2, 0.45), 0, 1.15)})` }}>
          <span style={{ display: 'inline-block', background: K.orange, color: '#fff', borderRadius: 99, padding: '14px 40px', boxShadow: SH, ...txt(52, '#fff', { fontWeight: 900 }) }}>{label}</span>
        </div>
      )}
    </Wrap>
  );
};

// ── 10. nudge ────────────────────────────────────────────────────────────────────────────
export type NudgeProps = { title?: string; dir?: 'up' | 'left'; items: { text: string; at: number; icon?: string }[]; y?: number };
const Nudge: React.FC<Base & NudgeProps> = ({ t, S, E, onDark, title, dir = 'up', items = [], y = 520 }) => {
  const tx = onDark ? '#fff' : K.ink;
  const up = dir === 'up';
  const head = title ? 90 : 0;
  const ph = 130, gapv = 28, pitch = up ? ph + gapv : 330;
  const prog = items.map((it) => ease.inOutCubic(lin(t, it.at, 0.7)));
  const k = prog.reduce((a, b) => a + b, 0);
  const maxVis = up ? 4 : 3;
  const regionH = up ? maxVis * (ph + gapv) : 260;
  const cy = y + head + regionH / 2;
  return (
    <Wrap t={t} S={S} E={E}>
      {title && <div style={{ position: 'absolute', left: 60, width: 960, top: y, textAlign: 'center', ...eyebrow(tx), opacity: 0.8 }}>{title}</div>}
      {items.map((it, j) => {
        const rel = j - (Math.max(k, 0.0001) - 1) / 2;       // position relative to the group's centre, in pitches
        const off = rel * pitch;
        const o = clamp(prog[j] * 1.6, 0, 1) * clamp(1.6 - Math.max(0, Math.abs(rel) - (maxVis / 2 - 0.5)) * 1.6, 0, 1);
        if (o <= 0.01) return null;
        const mv = (1 - prog[j]) * 36;
        if (up) {
          return (
            <div key={j} style={{ ...cardSt(60, cy + off - ph / 2 + mv, 960, ph, 40), display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', opacity: o, transform: `scale(${0.94 + 0.06 * prog[j]})` }}>
              <Tile n={it.icon ?? 'check'} size={84} tone={j % 2 ? 'dark' : 'orange'} />
              <div style={txt(48, tx, { flex: 1 })}>{it.text}</div>
              <div style={txt(34, tx, { opacity: 0.3, fontFamily: MONO })}>{String(j + 1).padStart(2, '0')}</div>
            </div>
          );
        }
        return (
          <div key={j} style={{ ...cardSt(540 + off - 150 + mv, cy - 130, 300, 260, 40), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 20px', opacity: o, transform: `scale(${0.94 + 0.06 * prog[j]})`, textAlign: 'center' }}>
            <Tile n={it.icon ?? 'check'} size={90} tone={j % 2 ? 'dark' : 'orange'} />
            <div style={txt(38, tx)}>{it.text}</div>
          </div>
        );
      })}
    </Wrap>
  );
};

// ── 11. sineLoop ─────────────────────────────────────────────────────────────────────────
export type SineLoopProps = { value: string; label?: string; chips?: { text: string; icon?: string }[]; amp?: number; y?: number };
const SineLoop: React.FC<Base & SineLoopProps> = ({ t, S, E, onDark, value, label, chips = [], amp = 1, y = 520 }) => {
  const tx = onDark ? '#fff' : K.ink;
  const settle = 1 - ease.inOutCubic(lin(t, E - 0.9, 0.6));
  const A = amp * settle;
  const vc = y + 270;
  const size = Math.min(230, 860 / (value.length * 0.58));
  const spots = [[-330, -190], [330, -150], [-310, 190], [340, 220]];
  const o = M.pop(t, S, 0.5);
  const wy = y + 560;
  const wave = (ph: number, a: number, f: number) => Array.from({ length: 73 }, (_, i) => `${(110 + (i / 72) * 860).toFixed(1)},${(wy + Math.sin((i / 72) * Math.PI * 2 * f + t * 2.2 + ph) * a * A).toFixed(1)}`).join(' ');
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ ...cardSt(60, y, 960, 660), transform: `scale(${0.94 + 0.06 * clamp(o, 0, 1)}) translateY(${Math.sin(t * 1.4) * 8 * A}px)` }} />
      <div style={{ position: 'absolute', left: 60, width: 960, top: vc - size * 0.55 + Math.sin(t * 2) * 14 * A, textAlign: 'center', ...txt(size, tx, { fontWeight: 900, letterSpacing: -3 }), transform: `scale(${0.9 + 0.1 * clamp(o, 0, 1)})` }}>{value}</div>
      {label && <div style={{ position: 'absolute', left: 60, width: 960, top: vc + size * 0.55 + Math.sin(t * 2 - 0.5) * 10 * A, textAlign: 'center', ...txt(44, tx, { fontWeight: 700, opacity: 0.65 }) }}>{label}</div>}
      {chips.slice(0, 4).map((c, i) => {
        const pp = M.pop(t, S + 0.25 + i * 0.12, 0.45);
        return (
          <div key={i} style={{ position: 'absolute', left: 540 + spots[i][0] - 130, top: vc + spots[i][1] - 40 + Math.sin(t * 1.8 + i * 1.7) * 16 * A, width: 260, display: 'flex', justifyContent: 'center', opacity: clamp(pp * 2, 0, 1), transform: `scale(${0.6 + 0.4 * clamp(pp, 0, 1.1)}) rotate(${Math.sin(t * 1.3 + i) * 2 * A}deg)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px', borderRadius: 99, background: i % 2 ? K.navy : K.orange, boxShadow: SH, ...txt(36, '#fff') }}>
              {c.icon && <Ic n={c.icon} size={34} color="#fff" sw={2.6} />}{c.text}
            </div>
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <polyline points={wave(0, 26, 2.2)} fill="none" stroke={tint(K.navy === '#8FB4FF' ? tx : K.navy, 0.35)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={wave(1.3, 34, 1.5)} fill="none" stroke={K.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Wrap>
  );
};

// ── 12. teaseRing ────────────────────────────────────────────────────────────────────────
export type TeaseRingProps = { src: string; label?: string; ringAt: number; tickAt?: number; y?: number };
const TeaseRing: React.FC<Base & TeaseRingProps> = (p) => {
  const { t, S, E, onDark, src, label = 'Stay till the end', ringAt, y = 520 } = p;
  const tx = onDark ? '#fff' : K.ink;
  const tickAt = p.tickAt ?? ringAt + 1.8;
  const cx = 540, cy = y + 340;
  const m = ease.inOutCubic(lin(t, ringAt - 0.7, 0.6));
  const w = lerp(460, 440, m), h = lerp(620, 440, m), r = lerp(48, 220, m);
  const pop = M.pop(t, S, 0.5);
  const blur = 30 * (1 - ease.outCubic(lin(t, tickAt, 0.6)));
  const inner = w - 0;
  const slW = 120;
  const sx = (0.5 + 0.5 * Math.sin((t - S) * 2.1 - 1)) * (inner - slW);
  const drawDur = Math.max(0.4, tickAt - ringAt - 0.25);
  const rp = ease.inOutCubic(lin(t, ringAt, drawDur));
  const ticked = t >= tickAt;
  const ringCol = ticked ? C.green : K.orange;
  const RR = 252;
  const ang = -Math.PI / 2 + Math.PI * 2 * rp + (rp >= 1 ? Math.PI * 2 * (t - ringAt - drawDur) * 0.9 : 0);
  const dotO = (rp > 0 ? 1 : 0) * (1 - lin(t, tickAt - 0.05, 0.15));
  const eye = (1 - lin(t, tickAt - 0.12, 0.12));
  const chk = M.pop(t, tickAt, 0.45);
  const q = 1 - m;
  return (
    <Wrap t={t} S={S} E={E}>
      <div style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, overflow: 'hidden', background: K.navy, boxShadow: SH, transform: `scale(${clamp(pop, 0, 1.08)})`, opacity: clamp(pop * 2, 0, 1) }}>
        <div style={{ position: 'absolute', inset: 0, filter: `blur(${blur}px)`, transform: 'scale(1.18)' }}><Media src={src} /></div>
        {q > 0.01 && blur > 1 && (
          <>
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${inner - sx - slW}px 0 ${sx}px)`, opacity: q }}><Media src={src} /></div>
            <div style={{ position: 'absolute', left: sx - 3, top: 0, width: 6, height: '100%', background: '#fff', opacity: q, boxShadow: '0 0 20px rgba(0,0,0,0.3)' }} />
            <div style={{ position: 'absolute', left: sx + slW - 3, top: 0, width: 6, height: '100%', background: '#fff', opacity: q, boxShadow: '0 0 20px rgba(0,0,0,0.3)' }} />
            <div style={{ position: 'absolute', left: 0, width: '100%', top: '38%', textAlign: 'center', opacity: q * (1 - 0.0), ...txt(240, '#fff', { fontWeight: 900, textShadow: '0 8px 40px rgba(0,0,0,0.45)', transform: 'none' }) }}>
              <span style={{ opacity: 0.9 }}>?</span>
            </div>
          </>
        )}
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <g opacity={lin(t, ringAt - 0.1, 0.2)}>
          <circle cx={cx} cy={cy} r={RR} fill="none" stroke={tint(tx, 0.12)} strokeWidth={16} />
          <circle cx={cx} cy={cy} r={RR} fill="none" stroke={tint(ringCol, 0.25)} strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rp} transform={`rotate(-90 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={RR} fill="none" stroke={ringCol} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rp} transform={`rotate(-90 ${cx} ${cy})`} />
          {dotO > 0 && <circle cx={cx + Math.cos(ang) * RR} cy={cy + Math.sin(ang) * RR} r={20} fill={K.orange} stroke={K.panel} strokeWidth={6} opacity={dotO} />}
        </g>
      </svg>
      {t > ringAt - 0.2 && (
        <div style={{ position: 'absolute', left: cx - 80, top: cy - 80, width: 160, height: 160, borderRadius: 99, background: K.panel, boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${clamp(M.pop(t, ringAt - 0.2, 0.45), 0, 1.1)})`, opacity: 1, border: `4px solid ${ticked ? C.green : tint(K.ink, 0.1)}`, boxSizing: 'border-box' }}>
          {eye > 0 && (
            <svg width={84} height={84} viewBox="0 0 24 24" fill="none" stroke={K.orange} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', transform: `scaleY(${eye * (1 - 0.9 * Math.pow(Math.sin(t * 3) , 40))})` }}>
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx={12 + Math.sin(t * 2.5) * 1.6} cy={12} r={3} />
            </svg>
          )}
          {ticked && <div style={{ position: 'absolute', transform: `scale(${clamp(chk, 0, 1.2)})` }}><Ic n="check" size={92} color={C.green} sw={3.4} /></div>}
        </div>
      )}
      <Shock t={t} t0={tickAt} cx={cx} cy={cy} r0={RR} r1={RR + 120} color={C.green} w={12} />
      <Burst t={t} t0={tickAt} cx={cx} cy={cy} n={20} dist={RR + 120} ky={1} colors={[C.green, K.orange]} seed={41} />
      <div style={{ position: 'absolute', left: 60, width: 960, top: cy + 300, textAlign: 'center', ...txt(48, tx, { fontWeight: 800 }), opacity: M.enter(t, S + 0.3, 0.4) }}>{label}</div>
    </Wrap>
  );
};

// ── registry ─────────────────────────────────────────────────────────────────────────────
const none = () => [];
export const FX_DATA = {
  countUp: { C: CountUp, sfx: none, box: (p: CountUpProps) => boxOf(p.y ?? 520, p.variant === 'burst' ? 620 : 460) },
  chartScrub: { C: ChartScrub, sfx: none, box: (p: ChartScrubProps) => boxOf(p.y ?? 520, 640) },
  statFill: { C: StatFill, sfx: none, box: (p: StatFillProps) => boxOf(p.y ?? 520, statH(p)) },
  pathDraw: { C: PathDraw, sfx: none, box: (p: PathDrawProps) => boxOf(p.y ?? 520, pathH(p)) },
  livingIcons: { C: LivingIcons, sfx: none, box: (p: LivingIconsProps) => { const L = livingLayout((p.items ?? []).length); return boxOf(p.y ?? 520, (p.title ? 90 : 0) + Math.ceil(Math.max(1, (p.items ?? []).length) / L.cols) * (L.ch + L.gy) - L.gy); } },
  heartbeat: { C: Heartbeat, sfx: none, box: (p: HeartbeatProps) => boxOf(p.y ?? 520, 650) },
  retention: { C: Retention, sfx: none, box: (p: RetentionProps) => boxOf(p.y ?? 520, 800) },
  funnelReels: { C: FunnelReels, sfx: none, box: (p: FunnelReelsProps) => boxOf(p.y ?? 520, funnelH(p)) },
  spotlight: { C: Spotlight, sfx: none, box: (p: SpotlightProps) => boxOf((p.y ?? 520) - 40, 880) },
  nudge: { C: Nudge, sfx: none, box: (p: NudgeProps) => boxOf(p.y ?? 520, (p.title ? 90 : 0) + (p.dir === 'left' ? 260 : 4 * 158)) },
  sineLoop: { C: SineLoop, sfx: none, box: (p: SineLoopProps) => boxOf(p.y ?? 520, 660) },
  teaseRing: { C: TeaseRing, sfx: none, box: (p: TeaseRingProps) => boxOf((p.y ?? 520) + 50, 760) },
};
