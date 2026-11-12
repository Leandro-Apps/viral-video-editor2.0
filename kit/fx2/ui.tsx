// Family ui (fx2, clean-room): product / UI mockups. Original code, STACK theme tokens, skin 'kit' only.
//   cursorDemo, multiCursor, cameraTrack, promptGenerate, agentProgress, chatMock, panelSync, deviceShowcase,
//   phoneFeed, pageScroll, commentDm, transcriptReveal, zoomOutReveal (frame), trackingBox, approvePress.
// Everything is a pure function of t (seconds). Choreography is expressed as fractions of the beat (S..E).
import React from 'react';
import { Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { FONT, MONO, FPS } from '../tokens';
import { STACK as K } from '../stack';
import { clamp, ease, lin, M } from '../motion';
import { Ic } from '../Icon';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number; skin?: string; format?: string; onDark?: boolean };
type Box = { x0: number; y0: number; x1: number; y1: number };
type R = [number, number, number, number];
type Pt = [number, number, number]; // [fraction, x, y]

// ── shared helpers ───────────────────────────────────────────────────────────────────────
const none = (): SfxCue[] => [];
const line = 'rgba(128,128,128,0.28)';
const SH = '0 28px 60px -24px rgba(20,20,20,0.38), 0 2px 8px rgba(20,20,20,0.07)';
const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`;
const GREEN = '#16A34A';
const BLUE = '#2563EB';
const fr = (t: number, S: number, E: number) => clamp((t - S) / Math.max(0.01, E - S), 0, 1);
const w = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1e-6, b - a), 0, 1);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fmtN = (n: number) => Math.round(n).toLocaleString('en-US');
const bump = (g: number, c: number, wd = 0.025) => 1 - clamp(Math.abs(g - c) / wd, 0, 1);
const cardS = (r = 36): React.CSSProperties => ({ position: 'absolute', background: K.panel, border: `1px solid ${line}`, borderRadius: r, boxShadow: SH, boxSizing: 'border-box' });
const inR = (x: number, y: number, r: R) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);

/** piecewise eased path through [fraction, x, y] waypoints */
const path = (f: number, pts: Pt[]) => {
  if (f <= pts[0][0]) return { x: pts[0][1], y: pts[0][2] };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (f <= b[0]) {
      if (b[0] - a[0] < 1e-6) return { x: b[1], y: b[2] };
      const e = ease.inOutCubic((f - a[0]) / (b[0] - a[0]));
      return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e) };
    }
  }
  const l = pts[pts.length - 1];
  return { x: l[1], y: l[2] };
};

/** under-damped spring 0 -> 1 (seconds) */
const spring = (s: number, zeta = 0.6, om = 9) => {
  if (s <= 0) return 0;
  const wd = om * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * om * s) * (Math.cos(wd * s) + ((zeta * om) / wd) * Math.sin(wd * s));
};

/** enter / exit wrapper shared by all box elements */
const Shell: React.FC<{ t: number; S: number; E: number; cy?: number; children?: React.ReactNode }> = ({ t, S, E, cy = 900, children }) => {
  const en = M.pop(t, S, 0.5), ex = M.exit(t, E - 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, color: K.ink, opacity: clamp(en * 2, 0, 1) * (1 - ex), transform: `translateY(${(1 - en) * 40 - ex * 30}px) scale(${(0.94 + 0.06 * en) * (1 - 0.04 * ex)})`, transformOrigin: `540px ${cy}px` }}>
      {children}
    </div>
  );
};

const Spin: React.FC<{ t: number; size?: number; color?: string }> = ({ t, size = 34, color = K.orange }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, transform: `rotate(${t * 480}deg)` }}>
    <circle cx={12} cy={12} r={9} fill="none" stroke={mix(color, 25)} strokeWidth={3} />
    <circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray="16 60" />
  </svg>
);

const Typed: React.FC<{ text: string; p: number; t: number; caret?: boolean; style?: React.CSSProperties }> = ({ text, p, t, caret = false, style }) => {
  const n = Math.floor(clamp(p, 0, 1) * text.length);
  const on = caret && Math.floor(t * 2.6) % 2 === 0;
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ visibility: 'hidden' }}>{text}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0 }}>
        {text.slice(0, n)}
        {caret && <span style={{ display: 'inline-block', width: 3, height: '0.95em', marginLeft: 3, verticalAlign: '-0.12em', background: K.orange, opacity: on ? 1 : 0 }} />}
      </div>
    </div>
  );
};

// ── cursor, ripple ───────────────────────────────────────────────────────────────────────
type Mode = 'arrow' | 'ibeam' | 'hand';
const HAND = 'M9 11.5V5a2 2 0 0 1 4 0v6M13 10a2 2 0 0 1 4 0v1.5M17 11a2 2 0 0 1 4 0v3.5a7 7 0 0 1-7 7h-1.5a7 7 0 0 1-5.6-2.8L4 14.2a2 2 0 0 1 3.2-2.4L9 13.5';
const Cursor: React.FC<{ x: number; y: number; mode?: Mode; press?: number; label?: string; color?: string; op?: number }> = ({ x, y, mode = 'arrow', press = 0, label, color = K.orange, op = 1 }) => {
  const sc = 1 - 0.14 * press;
  const off = mode === 'arrow' ? [4, 3] : mode === 'ibeam' ? [18, 18] : [20, 5];
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: op, zIndex: 50, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: -off[0], top: -off[1], transform: `scale(${sc})`, transformOrigin: `${off[0]}px ${off[1]}px`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
        {mode === 'arrow' && (
          <svg width={36} height={36} viewBox="0 0 36 36"><path d="M4 3 L4 29 L10.5 23.2 L15 34 L19.4 32 L14.9 21.4 L23.5 21 Z" fill="#111" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" /></svg>
        )}
        {mode === 'ibeam' && (
          <svg width={36} height={36} viewBox="0 0 36 36"><path d="M12 6h12M18 6v24M12 30h12" stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" /><path d="M12 6h12M18 6v24M12 30h12" stroke="#111" strokeWidth={2.6} strokeLinecap="round" fill="none" /></svg>
        )}
        {mode === 'hand' && (
          <svg width={44} height={44} viewBox="0 0 24 24"><path d={HAND} fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      {label && (
        <div style={{ position: 'absolute', left: 26, top: 30, padding: '5px 14px', borderRadius: 99, background: color, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap', boxShadow: '0 8px 18px -6px rgba(0,0,0,0.4)' }}>{label}</div>
      )}
    </div>
  );
};

const Ripple: React.FC<{ t: number; at: number; x: number; y: number; color?: string }> = ({ t, at, x, y, color = K.orange }) => {
  const p = lin(t, at, 0.7);
  if (p <= 0 || p >= 1) return null;
  const e = ease.outCubic(p);
  return <div style={{ position: 'absolute', left: x - 70 * e, top: y - 70 * e, width: 140 * e, height: 140 * e, borderRadius: 999, border: `${6 * (1 - p) + 1}px solid ${color}`, opacity: 1 - p, zIndex: 40 }} />;
};

// ── placeholders for missing assets ──────────────────────────────────────────────────────
const PAL = () => [K.orange, BLUE, GREEN, '#9333EA', '#0F1B27', '#DB2777'];
const PhReel: React.FC<{ i: number }> = ({ i }) => {
  const p = PAL();
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${150 + hash(i + 1) * 50}deg, ${p[i % 6]} 0%, ${p[(i + 2) % 6]} 100%)` }}>
      <div style={{ position: 'absolute', left: '50%', top: '42%', width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: 999, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginLeft: 8, borderLeft: '26px solid #fff', borderTop: '16px solid transparent', borderBottom: '16px solid transparent' }} />
      </div>
      {[0, 1].map((k) => <div key={k} style={{ position: 'absolute', left: '10%', bottom: `${16 + k * 5}%`, width: `${60 - k * 24}%`, height: 14, borderRadius: 8, background: 'rgba(255,255,255,0.55)' }} />)}
    </div>
  );
};
const PhPage: React.FC<{ i: number; name?: string }> = ({ i, name }) => {
  const p = PAL();
  const nm = name ?? ['Hero', 'Features', 'Quiz Funnels', 'Pricing', 'Proof'][i % 5];
  return (
    <div style={{ position: 'absolute', inset: 0, background: i % 2 ? mix(K.ink, 5) : K.panel, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 48, top: 44, fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: -1, color: K.ink }}>{nm}</div>
      <div style={{ position: 'absolute', left: 48, top: 104, width: 340, height: 14, borderRadius: 7, background: mix(K.ink, 22) }} />
      <div style={{ position: 'absolute', left: 48, top: 134, width: 260, height: 14, borderRadius: 7, background: mix(K.ink, 14) }} />
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: 'absolute', left: 48 + k * 245, top: 210, width: 220, height: 220, borderRadius: 24, background: k === i % 3 ? p[i % 6] : mix(p[(i + k) % 6], 22), border: `1px solid ${line}` }} />
      ))}
      <div style={{ position: 'absolute', left: 48, top: 470, width: 200, height: 54, borderRadius: 27, background: K.orange }} />
    </div>
  );
};

/** image or video from public/ (videos start when `from` is reached) */
const Media: React.FC<{ src: string; from?: number }> = ({ src, from = 0 }) => {
  const st: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' };
  if (isVid(src)) return <Sequence from={Math.max(0, Math.round(from * FPS))} layout="none"><OffthreadVideo src={staticFile(src)} volume={0} style={st} /></Sequence>;
  return <Img src={staticFile(src)} style={st} />;
};

// ── the mock builder (cursorDemo + zoomOutReveal) ────────────────────────────────────────
const BW = 900, BH = 760;
const BLOCKS = ['Heading', 'Quiz', 'Form', 'Thank you'];
const BICON = ['msg', 'filter', 'form', 'check'];
const RC = {
  head: [250, 112, 610, 84] as R, sub: [250, 198, 610, 40] as R,
  opt: [[250, 262, 610, 64], [250, 340, 610, 64]] as R[], cont: [250, 436, 300, 64] as R, pub: [762, 10, 118, 40] as R,
  blk: (i: number): R => [20, 112 + i * 84, 170, 64],
  slot: (i: number): R => [30 + i * 291, 640, 258, 76],
};
const hitTest = (x: number, y: number): { id: string; mode: Mode; label: string } => {
  if (inR(x, y, RC.pub)) return { id: 'pub', mode: 'hand', label: 'Publish' };
  if (inR(x, y, RC.head)) return { id: 'head', mode: 'ibeam', label: 'Text' };
  if (inR(x, y, RC.sub)) return { id: 'sub', mode: 'ibeam', label: 'Text' };
  for (let i = 0; i < 4; i++) if (inR(x, y, RC.blk(i))) return { id: `b${i}`, mode: 'hand', label: 'Grab' };
  for (let i = 0; i < 2; i++) if (inR(x, y, RC.opt[i])) return { id: `o${i}`, mode: 'hand', label: 'Select' };
  if (inR(x, y, RC.cont)) return { id: 'cont', mode: 'hand', label: 'Click' };
  return { id: '', mode: 'arrow', label: 'Pointer' };
};

type BuilderProps = { title?: string; hot?: string | null; slots?: (string | null)[]; over?: number; sel?: number; cont?: number; q?: number; pub?: number; ghost?: number; slotPop?: number[] };
const Builder: React.FC<BuilderProps> = ({ title = 'WiseFunnel Builder', hot = null, slots = ['Landing', null, null], over = -1, sel = -1, cont = 0, q = 0, pub = 0, ghost = -1, slotPop = [0, 0, 0] }) => {
  const abs = (r: R, st: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], boxSizing: 'border-box', ...st });
  const mut = mix(K.ink, 55);
  const doneC = pub > 0.5;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: BW, height: BH, borderRadius: 30, overflow: 'hidden', background: K.panel, border: `1px solid ${line}`, boxShadow: SH, fontFamily: FONT, color: K.ink }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: BW, height: 60, borderBottom: `1px solid ${line}`, background: mix(K.ink, 4) }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <div key={c} style={{ position: 'absolute', left: 22 + i * 24, top: 22, width: 15, height: 15, borderRadius: 99, background: c }} />)}
        <div style={{ position: 'absolute', left: 110, top: 0, height: 60, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700, color: mut }}>{title}</div>
        <div style={abs(RC.pub, { borderRadius: 12, background: doneC ? GREEN : K.orange, color: '#fff', fontWeight: 800, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, filter: hot === 'pub' ? 'brightness(1.12)' : 'none', transform: `scale(${hot === 'pub' ? 1.05 : 1})` })}>
          {doneC && <Ic n="check" size={18} color="#fff" sw={3} />}{doneC ? 'Published' : 'Publish'}
        </div>
      </div>
      {/* palette */}
      <div style={{ position: 'absolute', left: 0, top: 60, width: 210, height: 530, borderRight: `1px solid ${line}` }}>
        <div style={{ position: 'absolute', left: 22, top: 18, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mut }}>BLOCKS</div>
      </div>
      {BLOCKS.map((b, i) => {
        const h = hot === `b${i}`;
        return (
          <div key={b} style={abs(RC.blk(i), { borderRadius: 16, border: `${h ? 2 : 1}px ${ghost === i ? 'dashed' : 'solid'} ${h ? K.orange : line}`, background: h ? mix(K.orange, 10) : K.panel, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', fontWeight: 700, fontSize: 22, opacity: ghost === i ? 0.35 : 1, transform: `translateX(${h ? 6 : 0}px)` })}>
            <Ic n={BICON[i]} size={26} color={K.orange} sw={2.2} />{b}
          </div>
        );
      })}
      {/* canvas */}
      <div style={{ position: 'absolute', left: 210, top: 60, width: 690, height: 530, background: mix(K.ink, 3) }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${mix(K.ink, 14)} 1.6px, transparent 2px)`, backgroundSize: '28px 28px' }} />
      </div>
      <div style={{ position: 'absolute', left: 230, top: 76, width: 650, height: 490, borderRadius: 26, background: K.panel, border: `1px solid ${line}`, boxShadow: '0 12px 30px -16px rgba(20,20,20,0.3)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - q }}>
        <div style={{ position: 'absolute', left: 250, top: 90, fontSize: 14, fontWeight: 800, letterSpacing: 3, color: K.orange }}>STEP 1 OF 3</div>
        <div style={abs(RC.head, { fontSize: 38, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1, padding: '2px 6px', margin: '0 -6px', borderRadius: 8, background: hot === 'head' ? mix(K.orange, 24) : 'transparent', outline: hot === 'head' ? `2px solid ${K.orange}` : 'none' })}>Is your roof storm-damaged?</div>
        <div style={abs(RC.sub, { fontSize: 24, fontWeight: 500, color: mut, padding: '2px 6px', margin: '0 -6px', borderRadius: 8, background: hot === 'sub' ? mix(K.orange, 24) : 'transparent' })}>Answer 2 quick questions for a free quote.</div>
        {['Under 10 years old', '10 years or older'].map((o, i) => {
          const s = sel === i, h = hot === `o${i}`;
          return (
            <div key={o} style={abs(RC.opt[i], { borderRadius: 16, border: `2px solid ${s || h ? K.orange : line}`, background: s ? mix(K.orange, 12) : K.panel, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', fontWeight: 700, fontSize: 26 })}>
              <div style={{ width: 28, height: 28, borderRadius: 99, border: `2px solid ${s ? K.orange : mix(K.ink, 35)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s && <div style={{ width: 14, height: 14, borderRadius: 99, background: K.orange }} />}</div>{o}
            </div>
          );
        })}
        <div style={abs(RC.cont, { borderRadius: 16, background: K.orange, color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transform: `scale(${1 - 0.05 * cont})`, filter: hot === 'cont' ? 'brightness(1.1)' : 'none', boxShadow: '0 14px 28px -12px rgba(234,88,12,0.6)' })}>Continue</div>
      </div>
      <div style={{ position: 'absolute', left: 230, top: 150, width: 650, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: q, transform: `scale(${0.85 + 0.15 * ease.outBack(q)})` }}>
        <div style={{ width: 130, height: 130, borderRadius: 99, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 40px -14px ${GREEN}` }}><Ic n="check" size={72} color="#fff" sw={3.2} /></div>
        <div style={{ marginTop: 28, fontSize: 56, fontWeight: 900, letterSpacing: -1.5 }}>You qualify</div>
        <div style={{ marginTop: 8, fontSize: 26, color: mut, fontWeight: 600 }}>Verified roofing lead</div>
      </div>
      {/* funnel strip */}
      <div style={{ position: 'absolute', left: 0, top: 590, width: BW, height: 170, borderTop: `1px solid ${line}`, background: mix(K.ink, 3) }}>
        <div style={{ position: 'absolute', left: 30, top: 14, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mut }}>FUNNEL</div>
      </div>
      {[0, 1, 2].map((i) => {
        const s = slots[i], o = over === i;
        const rr = RC.slot(i);
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ position: 'absolute', left: rr[0] - 33, top: rr[1] + 37, width: 33, height: 3, background: mix(K.ink, 30) }} />}
            <div style={abs(rr, { borderRadius: 16, border: s ? `1px solid ${line}` : `2px dashed ${o ? K.orange : mix(K.ink, 30)}`, background: s ? K.panel : o ? mix(K.orange, 10) : 'transparent', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', fontWeight: 700, fontSize: 22, boxShadow: s ? '0 8px 18px -10px rgba(20,20,20,0.35)' : 'none', transform: `scale(${1 + 0.07 * (slotPop[i] || 0)})`, color: s ? K.ink : mut })}>
              {s ? <><div style={{ width: 8, height: 36, borderRadius: 4, background: K.orange }} />{s}</> : <span style={{ fontWeight: 600 }}>{o ? 'Drop here' : `Step ${i + 1}`}</span>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── 1 · cursorDemo ───────────────────────────────────────────────────────────────────────
export type CursorDemoProps = { variant?: 'tour' | 'click' | 'drag' | 'context'; title?: string; y?: number };
type Plan = { pts: Pt[]; drags: { f0: number; f1: number; blk: number; slot: number }[]; sel?: number; contF?: number; pubF?: number };
const PLANS: Record<string, Plan> = {
  tour: { pts: [[0, 640, 430], [0.14, 560, 155], [0.30, 330, 160], [0.40, 105, 228], [0.46, 105, 228], [0.64, 450, 678], [0.70, 450, 678], [0.86, 820, 30], [1, 820, 30]], drags: [{ f0: 0.46, f1: 0.64, blk: 1, slot: 1 }], pubF: 0.88 },
  click: { pts: [[0, 700, 230], [0.22, 555, 372], [0.30, 555, 372], [0.5, 400, 468], [0.58, 400, 468], [0.82, 820, 30], [1, 820, 30]], drags: [], sel: 0.28, contF: 0.56, pubF: 0.86 },
  drag: { pts: [[0, 600, 300], [0.12, 105, 228], [0.18, 105, 228], [0.36, 450, 678], [0.42, 450, 678], [0.50, 105, 396], [0.56, 105, 396], [0.74, 741, 678], [0.80, 741, 678], [1, 700, 520]], drags: [{ f0: 0.18, f1: 0.36, blk: 1, slot: 1 }, { f0: 0.56, f1: 0.74, blk: 3, slot: 2 }] },
  context: { pts: [[0, 640, 520], [0.14, 500, 150], [0.28, 500, 150], [0.40, 105, 228], [0.52, 105, 228], [0.64, 555, 372], [0.76, 555, 372], [0.88, 820, 30], [1, 820, 30]], drags: [] },
};
const CursorDemo: React.FC<Base & CursorDemoProps> = ({ t, S, E, variant = 'tour', title = 'WiseFunnel Builder', y = 520 }) => {
  const plan = PLANS[variant] ?? PLANS.tour;
  const g = w(fr(t, S, E), 0.04, 0.96);
  const p = path(g, plan.pts);
  const drag = plan.drags.find((d) => g >= d.f0 && g <= d.f1);
  const slots: (string | null)[] = ['Landing', null, null];
  const slotPop = [0, 0, 0];
  plan.drags.forEach((d) => { if (g >= d.f1) { slots[d.slot] = BLOCKS[d.blk]; slotPop[d.slot] = Math.max(0, 1 - (g - d.f1) / 0.05); } });
  const h = hitTest(p.x, p.y);
  const clicks = [plan.sel, plan.contF, plan.pubF].filter((x): x is number => x != null);
  const press = drag ? 1 : Math.max(0, ...clicks.map((c) => bump(g, c)));
  const dragProg = drag ? (g - drag.f0) / (drag.f1 - drag.f0) : 0;
  const hot = drag ? `b${drag.blk}` : h.id;
  const q = plan.contF != null ? ease.outCubic(w(g, plan.contF + 0.01, plan.contF + 0.09)) : 0;
  const pub = plan.pubF != null ? ease.outCubic(w(g, plan.pubF, plan.pubF + 0.05)) : 0;
  const at = (f: number) => S + (0.04 + f * 0.92) * (E - S);
  const X = 90;
  return (
    <Shell t={t} S={S} E={E} cy={y + BH / 2}>
      <div style={{ position: 'absolute', left: X, top: y, width: BW, height: BH }}>
        <Builder title={title} hot={hot} slots={slots} slotPop={slotPop} over={drag && dragProg > 0.6 ? drag.slot : -1} sel={plan.sel != null && g >= plan.sel ? 0 : -1} cont={plan.contF != null ? bump(g, plan.contF, 0.04) : 0} q={q} pub={pub} ghost={drag ? drag.blk : -1} />
        {clicks.map((c, i) => { const pp = path(c, plan.pts); return <Ripple key={i} t={t} at={at(c)} x={pp.x} y={pp.y} />; })}
        {plan.drags.map((d, i) => { const pp = path(d.f1, plan.pts); return <Ripple key={`d${i}`} t={t} at={at(d.f1)} x={pp.x} y={pp.y} color={GREEN} />; })}
        {pub > 0 && (
          <div style={{ position: 'absolute', left: 330, top: 520 - 14 * (1 - pub), padding: '12px 26px', borderRadius: 99, background: GREEN, color: '#fff', fontWeight: 800, fontSize: 24, opacity: pub, boxShadow: '0 14px 30px -10px rgba(22,163,74,0.6)', whiteSpace: 'nowrap' }}>Your funnel is live</div>
        )}
        {drag && (
          <div style={{ position: 'absolute', left: p.x - 85, top: p.y - 32, width: 170, height: 64, borderRadius: 16, background: K.panel, border: `2px solid ${K.orange}`, boxShadow: '0 20px 36px -12px rgba(20,20,20,0.45)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', fontWeight: 700, fontSize: 22, transform: 'rotate(-3deg) scale(1.05)', zIndex: 30 }}>
            <Ic n={BICON[drag.blk]} size={26} color={K.orange} sw={2.2} />{BLOCKS[drag.blk]}
          </div>
        )}
        <Cursor x={p.x} y={p.y} mode={drag ? 'hand' : h.mode} press={press} label={variant === 'context' ? h.label : undefined} />
      </div>
    </Shell>
  );
};

// ── 2 · multiCursor ──────────────────────────────────────────────────────────────────────
export type MultiCursorProps = { names?: [string, string, string]; y?: number };
const MC_H = 700;
const MC_BLOCKS = [['Hook', 'zap'], ['Quiz', 'filter'], ['Offer', 'dollar']];
const MultiCursor: React.FC<Base & MultiCursorProps> = ({ t, S, E, names = ['Ana', 'Leo', 'Scout AI'], y = 560 }) => {
  const g = w(fr(t, S, E), 0.03, 0.97);
  const cols = [K.orange, BLUE, GREEN];
  const homes: [number, number][] = [[70, 470], [830, 420], [450, 232]];
  const per = [0, 1, 2].map((i) => {
    const a = 0.06 + i * 0.25;
    const bp: [number, number] = [30 + i * 290 + 130, 152];
    const sp: [number, number] = [450, 270 + i * 130 + 55];
    const hm = homes[i];
    const away: [number, number] = [hm[0] + (i === 1 ? -50 : 50), hm[1] + 60];
    const pts: Pt[] = [[0, hm[0], hm[1]], [a, hm[0], hm[1]], [a + 0.08, bp[0], bp[1]], [a + 0.12, bp[0], bp[1]], [a + 0.24, sp[0], sp[1]], [a + 0.30, sp[0], sp[1]], [Math.min(0.99, a + 0.40), away[0], away[1]], [1, away[0], away[1]]];
    const pos = path(g, pts);
    const wob = g < a || g > a + 0.32 ? 1 : 0.15;
    const px = pos.x + Math.sin(t * (1.3 + i * 0.45) + i * 2) * 10 * wob, py = pos.y + Math.cos(t * (1.1 + i * 0.35) + i) * 8 * wob;
    return { a, bp, sp, px, py, carrying: g >= a + 0.12 && g < a + 0.24, placed: g >= a + 0.24, press: Math.max(bump(g, a + 0.10, 0.03), bump(g, a + 0.25, 0.03)), carryP: w(g, a + 0.12, a + 0.24) };
  });
  return (
    <Shell t={t} S={S} E={E} cy={y + MC_H / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: BW, height: MC_H }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: K.panel, border: `1px solid ${line}`, boxShadow: SH, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: BW, height: 64, borderBottom: `1px solid ${line}`, background: mix(K.ink, 4), display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 22, fontWeight: 800 }}>
            Team canvas
            <div style={{ marginLeft: 'auto', display: 'flex' }}>
              {names.map((n, i) => <div key={i} style={{ width: 40, height: 40, borderRadius: 99, background: cols[i], border: `3px solid ${K.panel}`, marginLeft: i ? -10 : 0, color: '#fff', fontSize: 17, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n[0]}</div>)}
            </div>
          </div>
          <div style={{ position: 'absolute', inset: '64px 0 0 0', backgroundImage: `radial-gradient(${mix(K.ink, 12)} 1.6px, transparent 2px)`, backgroundSize: '28px 28px' }} />
          <div style={{ position: 'absolute', left: 30, top: 80, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mix(K.ink, 55) }}>BLOCKS</div>
          <div style={{ position: 'absolute', left: 30, top: 236, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mix(K.ink, 55) }}>FUNNEL</div>
          {MC_BLOCKS.map(([lb, ic], i) => (
            <div key={lb} style={{ position: 'absolute', left: 30 + i * 290, top: 112, width: 260, height: 80, borderRadius: 18, border: `2px ${per[i].carrying || per[i].placed ? 'dashed' : 'solid'} ${per[i].carrying || per[i].placed ? mix(K.ink, 30) : line}`, background: per[i].carrying || per[i].placed ? 'transparent' : K.panel, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', fontSize: 26, fontWeight: 800, boxSizing: 'border-box' }}>
              {!(per[i].carrying || per[i].placed) && <><Ic n={ic} size={30} color={cols[i]} sw={2.3} />{lb}</>}
            </div>
          ))}
          {[0, 1, 2].map((i) => {
            const pl = per[i].placed, pop = pl ? Math.max(0, 1 - (g - (per[i].a + 0.24)) / 0.05) : 0;
            return (
              <div key={i} style={{ position: 'absolute', left: 30, top: 270 + i * 130, width: 840, height: 110, borderRadius: 20, border: pl ? `1px solid ${line}` : `2px dashed ${mix(K.ink, 28)}`, background: pl ? K.panel : 'transparent', display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', boxSizing: 'border-box', transform: `scale(${1 + 0.03 * pop})`, boxShadow: pl ? '0 10px 22px -12px rgba(20,20,20,0.35)' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 99, background: pl ? cols[i] : mix(K.ink, 12), color: '#fff', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                {pl ? <><Ic n={MC_BLOCKS[i][1]} size={34} color={cols[i]} sw={2.3} /><div style={{ fontSize: 34, fontWeight: 800 }}>{MC_BLOCKS[i][0]}</div><div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 99, background: mix(cols[i], 14), color: cols[i], fontWeight: 800, fontSize: 20 }}>{names[i]}</div></> : <div style={{ fontSize: 26, fontWeight: 600, color: mix(K.ink, 45) }}>Empty step</div>}
              </div>
            );
          })}
        </div>
        {per.map((q, i) => q.carrying && (
          <div key={`c${i}`} style={{ position: 'absolute', left: lerp(q.bp[0], q.sp[0], q.carryP) - 130 + (q.px - lerp(q.bp[0], q.sp[0], q.carryP)) * 0, top: q.py - 40, width: 260, height: 80, borderRadius: 18, border: `2px solid ${cols[i]}`, background: K.panel, boxShadow: '0 22px 38px -12px rgba(20,20,20,0.45)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', fontSize: 26, fontWeight: 800, boxSizing: 'border-box', transform: 'rotate(-2deg)', zIndex: 20 }}>
            <Ic n={MC_BLOCKS[i][1]} size={30} color={cols[i]} sw={2.3} />{MC_BLOCKS[i][0]}
          </div>
        ))}
        {per.map((q, i) => <Cursor key={i} x={q.px} y={q.py} mode={q.carrying ? 'hand' : 'arrow'} press={q.press} label={names[i]} color={cols[i]} />)}
      </div>
    </Shell>
  );
};

// ── 3 · cameraTrack ──────────────────────────────────────────────────────────────────────
export type CameraTrackProps = { y?: number };
const CT_NODES: { x: number; y: number; t: string; s: string; ic: string }[] = [
  { x: 300, y: 330, t: 'Ad click', s: 'Meta · Instagram', ic: 'zap' },
  { x: 820, y: 760, t: 'Quiz', s: '4 questions', ic: 'filter' },
  { x: 1340, y: 330, t: 'Phone OTP', s: 'Code verified', ic: 'phone' },
  { x: 1860, y: 760, t: 'Profit Room', s: 'Lead priced', ic: 'dollar' },
  { x: 2380, y: 330, t: 'Buyer', s: 'Lead delivered', ic: 'user' },
];
const CT_A = [0, 1, 2, 3, 4].map((i) => 0.08 + i * 0.17);
const CT_PTS: Pt[] = (() => {
  const pts: Pt[] = [[0, 80, 620]];
  CT_NODES.forEach((n, i) => { pts.push([CT_A[i], n.x, n.y]); pts.push([i === 4 ? 0.99 : CT_A[i] + 0.09, n.x, n.y]); });
  pts.push([1, CT_NODES[4].x, CT_NODES[4].y]);
  return pts;
})();
const CameraTrack: React.FC<Base & CameraTrackProps> = ({ t, S, E, y = 560 }) => {
  const VW = 900, VH = 700;
  const g = w(fr(t, S, E), 0.02, 0.98);
  const cur = path(g, CT_PTS);
  const cam = path(g - 0.055, CT_PTS);
  const pulse = Math.max(...CT_A.map((a) => { const c = a + 0.05; return ease.outCubic(w(g, c - 0.07, c)) * (1 - ease.inOutCubic(w(g, c + 0.02, c + 0.09))); }));
  const z = 0.5 + 0.45 * pulse;
  const tx = VW / 2 - cam.x * z, ty = VH / 2 - cam.y * z;
  const sx = VW / 2 + (cur.x - cam.x) * z, sy = VH / 2 + (cur.y - cam.y) * z;
  const act = CT_A.reduce((n, a, i) => (g >= a ? i : n), -1);
  const press = Math.max(0, ...CT_A.map((a) => bump(g, a + 0.05, 0.025)));
  return (
    <Shell t={t} S={S} E={E} cy={y + VH / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: VW, height: VH, borderRadius: 36, overflow: 'hidden', background: K.panel, border: `1px solid ${line}`, boxShadow: SH }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 2700, height: 1100, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`, backgroundImage: `radial-gradient(${mix(K.ink, 16)} 2.4px, transparent 3px)`, backgroundSize: '40px 40px' }}>
          <svg width={2700} height={1100} style={{ position: 'absolute', left: 0, top: 0 }}>
            {CT_NODES.slice(0, -1).map((n, i) => {
              const m = CT_NODES[i + 1];
              const d = `M ${n.x + 140} ${n.y} C ${n.x + 340} ${n.y}, ${m.x - 340} ${m.y}, ${m.x - 140} ${m.y}`;
              const pr = ease.inOutCubic(w(g, CT_A[i] + 0.09, CT_A[i + 1]));
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke={mix(K.ink, 28)} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" />
                  <path d={d} fill="none" stroke={K.orange} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr} />
                </g>
              );
            })}
          </svg>
          {CT_NODES.map((n, i) => {
            const on = g >= CT_A[i], done = g >= CT_A[i] + 0.05;
            return (
              <div key={i} style={{ position: 'absolute', left: n.x - 140, top: n.y - 85, width: 280, height: 170, borderRadius: 32, background: K.panel, border: `${on ? 4 : 1}px solid ${on ? K.orange : line}`, boxShadow: on ? `0 0 0 10px ${mix(K.orange, 14)}, ${SH}` : SH, boxSizing: 'border-box', padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: on ? K.orange : mix(K.ink, 10), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={n.ic} size={30} color={on ? '#fff' : mix(K.ink, 60)} sw={2.4} /></div>
                  <div style={{ marginLeft: 'auto', width: 38, height: 38, borderRadius: 99, background: done ? GREEN : 'transparent', border: done ? 'none' : `2px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{done && <Ic n="check" size={22} color="#fff" sw={3.4} />}</div>
                </div>
                <div style={{ marginTop: 16, fontSize: 36, fontWeight: 900, letterSpacing: -0.8 }}>{n.t}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: mix(K.ink, 55) }}>{n.s}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 22, top: 20, padding: '8px 18px', borderRadius: 99, background: mix(K.panel, 90), border: `1px solid ${line}`, fontSize: 22, fontWeight: 800 }}>
          {act >= 0 ? `${act + 1} / 5 · ${CT_NODES[act].t}` : 'Lead journey'}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {CT_NODES.map((_, i) => <div key={i} style={{ width: i === act ? 34 : 12, height: 12, borderRadius: 6, background: i <= act ? K.orange : mix(K.ink, 22) }} />)}
        </div>
        <Cursor x={sx} y={sy} mode="arrow" press={press} />
      </div>
    </Shell>
  );
};

// ── 4 · promptGenerate ───────────────────────────────────────────────────────────────────
export type PromptGenerateProps = { prompt?: string; steps?: string[]; y?: number };
const PG_STEPS = ['Get a free roof quote', 'How old is your roof?', 'Storm damage?', 'Verify your phone'];
const PG_ICONS = ['form', 'clock', 'shield', 'phone', 'dollar', 'user'];
const promptH = (n: number) => 360 + n * 110;
const PromptGenerate: React.FC<Base & PromptGenerateProps> = ({ t, S, E, prompt = 'Build a roofing quiz funnel', steps = PG_STEPS, y = 520 }) => {
  const f = fr(t, S, E);
  const n = steps.length;
  const typeP = w(f, 0.08, 0.36);
  const sendF = 0.40;
  const sendP = bump(f, sendF + 0.015, 0.03);
  const gen = f >= sendF + 0.03;
  const stepsStart = 0.58, gap = 0.3 / Math.max(1, n);
  const readyF = stepsStart + 0.3 + 0.04;
  const ready = f >= readyF;
  return (
    <Shell t={t} S={S} E={E} cy={y + promptH(n) / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: promptH(n) }}>
        <div style={{ ...cardS(36), left: 0, top: 0, width: 900, height: 340 }}>
          <div style={{ position: 'absolute', left: 32, top: 26, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="sparkles" size={30} color="#fff" sw={2.4} /></div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.8 }}>AI Funnel Lab</div>
          </div>
          <div style={{ position: 'absolute', left: 32, top: 100, width: 836, height: 150, borderRadius: 24, border: `2px solid ${typeP > 0 && !gen ? K.orange : line}`, background: mix(K.ink, 3), boxSizing: 'border-box', padding: '22px 110px 22px 26px', boxShadow: typeP > 0 && !gen ? `0 0 0 8px ${mix(K.orange, 14)}` : 'none' }}>
            {typeP === 0 && <div style={{ fontSize: 36, fontWeight: 600, color: mix(K.ink, 40) }}>Describe your funnel</div>}
            {typeP > 0 && <Typed text={prompt} p={typeP} t={t} caret={!gen} style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.2 }} />}
            <div style={{ position: 'absolute', right: 24, bottom: 24, width: 76, height: 76, borderRadius: 99, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.18 * sendP})`, boxShadow: `0 14px 26px -10px ${K.orange}` }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 32, top: 270, height: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderRadius: 99, background: ready ? mix(GREEN, 14) : gen ? mix(K.orange, 14) : mix(K.ink, 7), color: ready ? GREEN : gen ? K.orange : mix(K.ink, 55), fontWeight: 800, fontSize: 24 }}>
            {ready ? <Ic n="check" size={26} color={GREEN} sw={3.2} /> : gen ? <Spin t={t} size={26} /> : null}
            {ready ? `Funnel ready · ${n} steps` : gen ? 'Generating funnel' : 'Ready'}
          </div>
        </div>
        {steps.map((s, i) => {
          const st = stepsStart + i * gap;
          const p = ease.outBack(lin(t, S + st * (E - S), 0.45));
          const o = clamp(p * 2, 0, 1);
          return (
            <div key={i} style={{ ...cardS(24), left: 0, top: 366 + i * 110, width: 900, height: 92, opacity: o, transform: `translateY(${(1 - p) * -90}px) scale(${0.94 + 0.06 * p})` }}>
              <div style={{ position: 'absolute', left: 24, top: 22, width: 48, height: 48, borderRadius: 99, background: K.orange, color: '#fff', fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              <div style={{ position: 'absolute', left: 94, top: 0, height: 92, display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 800, letterSpacing: -0.6 }}>{s}</div>
              <div style={{ position: 'absolute', right: 24, top: 20, width: 52, height: 52, borderRadius: 15, background: mix(K.orange, 14), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={PG_ICONS[i % PG_ICONS.length]} size={28} color={K.orange} sw={2.3} /></div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

// ── 5 · agentProgress ────────────────────────────────────────────────────────────────────
export type AgentProgressProps = { agent?: string; steps?: { text: string; n: number; unit: string }[]; receipt?: { title: string; rows: [string, string][] }; y?: number };
const AP_STEPS = [{ text: 'Scanning roofers in Austin', n: 1240, unit: 'companies' }, { text: 'Verifying owner phones', n: 412, unit: 'numbers' }, { text: 'Scoring buyer fit', n: 38, unit: 'buyers' }];
const AP_RECEIPT: { title: string; rows: [string, string][] } = { title: 'Receipt · Austin roofing buyers', rows: [['Apex Roofing', '$45'], ['Summit Roofing', '$38'], ['Lone Star Roofs', '$52']] };
const apList = (n: number) => 120 + n * 100;
const apRec = (r: number) => 110 + r * 64;
const AgentProgress: React.FC<Base & AgentProgressProps> = ({ t, S, E, agent = 'Scout AI', steps = AP_STEPS, receipt = AP_RECEIPT, y = 520 }) => {
  const f = fr(t, S, E);
  const n = steps.length, span = 0.54 / n;
  const allDone = f >= 0.08 + n * span;
  const recP = ease.outBack(lin(t, S + 0.7 * (E - S), 0.5));
  const total = apList(n) + 24 + apRec(receipt.rows.length);
  return (
    <Shell t={t} S={S} E={E} cy={y + total / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: total }}>
        <div style={{ ...cardS(36), left: 0, top: 0, width: 900, height: apList(n) }}>
          <div style={{ position: 'absolute', left: 32, top: 24, right: 32, height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: K.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="sparkles" size={30} color={K.panel} sw={2.4} /></div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.8 }}>{agent}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 99, background: allDone ? mix(GREEN, 14) : mix(K.orange, 14), color: allDone ? GREEN : K.orange, fontWeight: 800, fontSize: 22 }}>
              {allDone ? <Ic n="check" size={22} color={GREEN} sw={3.2} /> : <Spin t={t} size={22} />}{allDone ? 'Done' : 'Working'}
            </div>
          </div>
          {steps.map((s, i) => {
            const a = 0.08 + i * span, b = a + span * 0.9;
            const state = f >= b ? 2 : f >= a ? 1 : 0;
            const cnt = s.n * ease.outCubic(w(f, a, b));
            return (
              <div key={i} style={{ position: 'absolute', left: 24, top: 110 + i * 100, width: 852, height: 88, borderRadius: 20, background: state === 1 ? mix(K.orange, 9) : 'transparent', border: `1px solid ${state === 1 ? mix(K.orange, 40) : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', boxSizing: 'border-box' }}>
                {state === 0 && <div style={{ width: 38, height: 38, borderRadius: 99, border: `3px solid ${mix(K.ink, 25)}`, boxSizing: 'border-box' }} />}
                {state === 1 && <Spin t={t} size={38} />}
                {state === 2 && <div style={{ width: 38, height: 38, borderRadius: 99, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ease.outBack(lin(t, S + b * (E - S), 0.3))})` }}><Ic n="check" size={24} color="#fff" sw={3.6} /></div>}
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, color: state === 0 ? mix(K.ink, 40) : K.ink }}>{s.text}</div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 26, fontWeight: 800, color: state === 2 ? GREEN : state === 1 ? K.orange : 'transparent' }}>{fmtN(cnt)} {s.unit}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...cardS(30), left: 0, top: apList(n) + 24, width: 900, height: apRec(receipt.rows.length), opacity: clamp(recP * 2, 0, 1), transform: `translateY(${(1 - recP) * 120}px) scale(${0.94 + 0.06 * recP})`, borderColor: mix(GREEN, 55) }}>
          <div style={{ position: 'absolute', left: 32, top: 24, display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 900 }}>
            <Ic n="check" size={30} color={GREEN} sw={3.2} />{receipt.title}
          </div>
          {receipt.rows.map((r, i) => {
            const rp = ease.outCubic(lin(t, S + 0.78 * (E - S) + i * 0.1, 0.3));
            return (
              <div key={i} style={{ position: 'absolute', left: 32, right: 32, top: 82 + i * 64, height: 56, display: 'flex', alignItems: 'center', borderTop: `1px solid ${line}`, opacity: rp, transform: `translateX(${(1 - rp) * 30}px)` }}>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{r[0]}</div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 30, fontWeight: 900, color: GREEN }}>{r[1]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

// ── 6 · chatMock ─────────────────────────────────────────────────────────────────────────
export type ChatMockProps = { ask?: string; checks?: string[]; answer?: string; chips?: string[]; y?: number };
const CHAT_H = 820;
const ChatMock: React.FC<Base & ChatMockProps> = ({ t, S, E, ask = 'Rewrite my roofing headline', checks = ['Reading your page', 'Checking tone and urgency', 'Matching your offer'], answer = 'Storm hit your roof? Get a free inspection in 60 seconds.', chips = ['Use this', 'Shorter'], y = 540 }) => {
  const f = fr(t, S, E);
  const uP = ease.outBack(lin(t, S + 0.06 * (E - S), 0.45));
  const typeP = w(f, 0.52, 0.82);
  const ansP = ease.outCubic(w(f, 0.5, 0.56));
  return (
    <Shell t={t} S={S} E={E} cy={y + CHAT_H / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: CHAT_H, borderRadius: 40, background: mix(K.panel, 82), backdropFilter: 'blur(26px)', border: `1px solid ${line}`, boxShadow: SH, boxSizing: 'border-box', padding: 36, display: 'flex', flexDirection: 'column', gap: 26, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="sparkles" size={30} color="#fff" sw={2.4} /></div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>Copy assistant</div>
          <div style={{ marginLeft: 'auto', width: 14, height: 14, borderRadius: 99, background: GREEN }} />
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: 700, padding: '22px 30px', borderRadius: '30px 30px 8px 30px', background: K.orange, color: '#fff', fontSize: 34, fontWeight: 700, lineHeight: 1.2, opacity: clamp(uP * 2, 0, 1), transform: `translateX(${(1 - uP) * 60}px) scale(${0.9 + 0.1 * uP})`, transformOrigin: '100% 100%' }}>{ask}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 26px', borderRadius: 26, border: `1px solid ${line}`, background: mix(K.ink, 3), opacity: ease.outCubic(w(f, 0.16, 0.24)) }}>
          {checks.map((c, i) => {
            const done = f >= 0.26 + i * 0.09;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, fontWeight: 700, color: done ? K.ink : mix(K.ink, 50) }}>
                {done ? <div style={{ width: 34, height: 34, borderRadius: 99, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ease.outBack(lin(t, S + (0.26 + i * 0.09) * (E - S), 0.3))})` }}><Ic n="check" size={21} color="#fff" sw={3.6} /></div> : <Spin t={t} size={34} />}{c}
              </div>
            );
          })}
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: 780, padding: '24px 30px', borderRadius: '30px 30px 30px 8px', background: mix(K.ink, 7), fontSize: 38, fontWeight: 800, lineHeight: 1.22, letterSpacing: -0.6, opacity: ansP }}>
          <Typed text={answer} p={typeP} t={t} caret={typeP > 0 && typeP < 1} />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {chips.map((c, i) => {
            const p = ease.outBack(lin(t, S + (0.86 + i * 0.04) * (E - S), 0.35));
            return <div key={i} style={{ padding: '14px 30px', borderRadius: 99, border: `2px solid ${K.orange}`, background: i === 0 ? K.orange : 'transparent', color: i === 0 ? '#fff' : K.orange, fontSize: 28, fontWeight: 800, opacity: clamp(p * 2, 0, 1), transform: `scale(${0.7 + 0.3 * p})` }}>{c}</div>;
          })}
        </div>
      </div>
    </Shell>
  );
};

// ── 7 · panelSync ────────────────────────────────────────────────────────────────────────
export type PanelSyncProps = { headline?: string; y?: number };
const PS_H = 850;
const PS_SW = () => [K.orange, BLUE, GREEN, '#9333EA'];
const PanelSync: React.FC<Base & PanelSyncProps> = ({ t, S, E, headline = 'Is your roof storm-damaged?', y = 520 }) => {
  const g = w(fr(t, S, E), 0.04, 0.96);
  const TX0 = 40, TW = 820, IY = 450;
  const v1 = lerp(0.15, 0.9, ease.inOutCubic(w(g, 0.10, 0.34)));
  const v2 = lerp(0.3, 0.85, ease.inOutCubic(w(g, 0.40, 0.62)));
  const sw = PS_SW();
  const swF = 0.74;
  const sIdx = g >= swF ? 1 : 0;
  const accent = sw[sIdx];
  const h1 = { x: TX0 + 0.15 * TW, y: IY + 150 };
  const pts: Pt[] = [[0, 760, 300], [0.07, TX0 + 0.15 * TW, IY + 150], [0.10, TX0 + 0.15 * TW, IY + 150], [0.34, TX0 + 0.9 * TW, IY + 150], [0.37, TX0 + 0.9 * TW, IY + 150], [0.40, TX0 + 0.3 * TW, IY + 250], [0.62, TX0 + 0.85 * TW, IY + 250], [0.68, TX0 + 0.85 * TW, IY + 250], [swF, 40 + 90 + 32, IY + 330], [0.84, 40 + 90 + 32, IY + 330], [1, 700, 330]];
  void h1;
  const cur = path(g, pts);
  const dragging = (g >= 0.10 && g <= 0.34) || (g >= 0.40 && g <= 0.62);
  const press = dragging ? 1 : bump(g, swF + 0.01, 0.03);
  const live = 0.5 + 0.5 * Math.sin(t * 6);
  const slider = (label: string, val: number, top: number, shown: string, cnt: number) => (
    <>
      <div style={{ position: 'absolute', left: TX0, top, fontSize: 24, fontWeight: 800 }}>{label}</div>
      <div style={{ position: 'absolute', right: TX0, top, fontFamily: MONO, fontSize: 24, fontWeight: 800, color: accent }}>{shown}</div>
      <div style={{ position: 'absolute', left: TX0, top: top + 56, width: TW, height: 10, borderRadius: 5, background: mix(K.ink, 14) }} />
      <div style={{ position: 'absolute', left: TX0, top: top + 56, width: TW * val, height: 10, borderRadius: 5, background: accent }} />
      <div style={{ position: 'absolute', left: TX0 + TW * val - 20, top: top + 41, width: 40, height: 40, borderRadius: 99, background: K.panel, border: `4px solid ${accent}`, boxShadow: '0 8px 16px -6px rgba(0,0,0,0.4)', transform: `scale(${1 + 0.15 * cnt})`, boxSizing: 'border-box' }} />
    </>
  );
  const radius = 4 + v1 * 36, tsz = 34 + v2 * 30;
  return (
    <Shell t={t} S={S} E={E} cy={y + PS_H / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: BW, height: PS_H }}>
        {/* live preview */}
        <div style={{ ...cardS(34), left: 0, top: 0, width: 900, height: 420, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 900, height: 56, borderBottom: `1px solid ${line}`, background: mix(K.ink, 4), display: 'flex', alignItems: 'center', padding: '0 26px', fontSize: 20, fontWeight: 800, color: mix(K.ink, 60), gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: GREEN, opacity: 0.45 + 0.55 * live }} />LIVE PREVIEW
          </div>
          <div style={{ position: 'absolute', left: 40, right: 40, top: 76, fontSize: tsz, fontWeight: 900, lineHeight: 1.08, letterSpacing: -1 }}>{headline}</div>
          <div style={{ position: 'absolute', left: 40, top: 250, display: 'flex', gap: 14 }}>
            {['Under 10 years', '10 years or older'].map((o, i) => <div key={o} style={{ padding: '14px 24px', borderRadius: radius, border: `2px solid ${i === 1 ? accent : line}`, background: i === 1 ? mix(accent, 12) : 'transparent', fontSize: 24, fontWeight: 700 }}>{o}</div>)}
          </div>
          <div style={{ position: 'absolute', left: 40, bottom: 34, padding: '18px 54px', borderRadius: radius, background: accent, color: '#fff', fontSize: 30, fontWeight: 800, boxShadow: `0 16px 30px -12px ${accent}` }}>Continue</div>
        </div>
        {/* inspector */}
        <div style={{ ...cardS(34), left: 0, top: IY, width: 900, height: 390 }}>
          <div style={{ position: 'absolute', left: TX0, top: 24, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mix(K.ink, 55) }}>INSPECTOR</div>
          {slider('Button radius', v1, 56, `${Math.round(radius)} px`, g >= 0.10 && g <= 0.34 ? 1 : 0)}
          {slider('Title size', v2, 156, `${Math.round(tsz)} px`, g >= 0.40 && g <= 0.62 ? 1 : 0)}
          <div style={{ position: 'absolute', left: TX0, top: 262, fontSize: 24, fontWeight: 800 }}>Accent</div>
          {sw.map((c, i) => (
            <div key={c} style={{ position: 'absolute', left: 40 + 90 + i * 84, top: 252, width: 56, height: 56, borderRadius: 99, background: c, boxSizing: 'border-box', border: i === sIdx ? `5px solid ${K.panel}` : 'none', boxShadow: i === sIdx ? `0 0 0 4px ${c}` : 'none' }} />
          ))}
        </div>
        <Ripple t={t} at={S + (0.04 + swF * 0.92) * (E - S)} x={40 + 90 + 32 + 84} y={IY + 280} />
        <Cursor x={cur.x} y={cur.y} mode={dragging ? 'hand' : 'arrow'} press={press} />
      </div>
    </Shell>
  );
};

// ── 8 · deviceShowcase ───────────────────────────────────────────────────────────────────
export type DeviceShowcaseProps = { shots?: string[]; covers?: string[]; every?: number; y?: number };
const DS_H = 660;
/** a stack of swapping items: current slides/zooms in over the previous one */
const Swap: React.FC<{ items: string[] | undefined; ph: (i: number) => React.ReactNode; t: number; S: number; every: number; phase?: number }> = ({ items, ph, t, S, every, phase = 0 }) => {
  const n = items && items.length ? items.length : 3;
  const u = t - S - phase;
  const k = Math.max(0, Math.floor(u / every));
  const p = k === 0 ? 1 : ease.outCubic(lin(u, k * every, 0.45));
  const render = (idx: number, key: string, st: React.CSSProperties, start: number) => (
    <div key={key} style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...st }}>
      {items && items.length ? <Media src={items[idx % n]} from={S + phase + start} /> : ph(idx)}
    </div>
  );
  return (
    <>
      {k > 0 && render(k - 1, `p${k}`, { opacity: 1 - p }, (k - 1) * every)}
      {render(k, `c${k}`, { opacity: k === 0 ? 1 : p, transform: `translateX(${(1 - p) * 60}px) scale(${1.04 - 0.04 * p})` }, k * every)}
    </>
  );
};
const DeviceShowcase: React.FC<Base & DeviceShowcaseProps> = ({ t, S, E, shots, covers, every = 2.2, y = 540 }) => {
  const prog = fr(t, S, E);
  const e = ease.inOutCubic(prog);
  return (
    <Shell t={t} S={S} E={E} cy={y + DS_H / 2}>
      <div style={{ position: 'absolute', left: 0, top: y, width: 1080, height: DS_H, perspective: 1900 }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${-16 + 12 * e}deg) rotateX(${5 - 2 * e}deg) scale(${1 + 0.1 * e})`, transformOrigin: '540px 330px' }}>
          {/* laptop */}
          <div style={{ position: 'absolute', left: 110, top: 30, width: 740, height: 480, borderRadius: 30, background: '#0F1B27', padding: 18, boxSizing: 'border-box', boxShadow: '0 40px 70px -26px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative', width: 704, height: 444, borderRadius: 14, overflow: 'hidden', background: K.panel }}>
              <Swap items={shots} ph={(i) => <PhPage i={i} />} t={t} S={S} every={every} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: 60, top: 506, width: 840, height: 28, borderRadius: '4px 4px 30px 30px', background: 'linear-gradient(#C9CED6, #9AA2AE)', boxShadow: '0 20px 30px -14px rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'absolute', left: 400, top: 506, width: 160, height: 10, borderRadius: '0 0 12px 12px', background: 'rgba(0,0,0,0.18)' }} />
          {/* phone */}
          <div style={{ position: 'absolute', left: 700, top: 150, width: 270, height: 500, borderRadius: 46, background: '#0F1B27', padding: 12, boxSizing: 'border-box', boxShadow: '0 40px 70px -22px rgba(0,0,0,0.6)', transform: 'translateZ(90px)' }}>
            <div style={{ position: 'relative', width: 246, height: 476, borderRadius: 36, overflow: 'hidden', background: '#000' }}>
              <Swap items={covers} ph={(i) => <PhReel i={i + 1} />} t={t} S={S} every={every} phase={every * 0.5} />
              <div style={{ position: 'absolute', left: '50%', top: 10, width: 70, height: 20, marginLeft: -35, borderRadius: 99, background: '#000' }} />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ── 9 · phoneFeed ────────────────────────────────────────────────────────────────────────
export type PhoneFeedProps = { covers?: string[]; side?: [string, string]; handle?: string; y?: number };
const PF_H = 860, PF_SCR_H = 808;
const PhoneFeed: React.FC<Base & PhoneFeedProps> = ({ t, S, E, covers, side, handle = '@wisefunnel', y = 520 }) => {
  const u = t - S, D = Math.max(0.5, E - S);
  const list = covers && covers.length ? covers : undefined;
  const n = list ? list.length : 6;
  const m = Math.max(1, Math.floor((n - 1) / 2)), rest = Math.max(0, n - 1 - m);
  const dt = clamp((0.62 * D) / (m + (rest > 0 ? 1 : 0)), 0.7, 1.7);
  const fs = 0.5 + m * dt + 0.2;
  const pos = (q: number) => { let s = 0; for (let i = 0; i < m; i++) s += ease.outCubic(lin(q, 0.5 + i * dt, 0.38)); return s + rest * ease.inOutCubic(lin(q, fs, 0.6)); };
  const P = pos(u);
  const vel = Math.abs(pos(u + 0.02) - pos(u - 0.02)) / 0.04;
  const blur = Math.max(0, (vel - 5) * 1.6);
  const idxA = Math.floor(P);
  const item = (i: number) => (i < n ? (list ? <Media src={list[i]} from={S} /> : <PhReel i={i} />) : null);
  const sideItem = (i: number, rot: number, x: number) => (
    <div style={{ position: 'absolute', left: x, top: 190, width: 250, height: 440, borderRadius: 34, overflow: 'hidden', background: '#111', border: `6px solid ${K.panel}`, boxShadow: SH, transform: `rotate(${rot}deg) scale(${0.92 + 0.08 * ease.outCubic(lin(t, S + 0.15, 0.6))})`, boxSizing: 'border-box' }}>
      {side && side[i] ? <Media src={side[i]} from={S} /> : <PhReel i={i + 7} />}
    </div>
  );
  const heart = 1240 + Math.round(u * 310);
  return (
    <Shell t={t} S={S} E={E} cy={y + PF_H / 2}>
      <div style={{ position: 'absolute', left: 0, top: y, width: 1080, height: PF_H }}>
        {sideItem(0, -9, 60)}
        {sideItem(1, 9, 770)}
        <div style={{ position: 'absolute', left: 325, top: 0, width: 430, height: PF_H, borderRadius: 64, background: '#0F1B27', padding: 14, boxSizing: 'border-box', boxShadow: '0 50px 80px -28px rgba(0,0,0,0.6)' }}>
          <div style={{ position: 'relative', width: 402, height: PF_SCR_H, borderRadius: 52, overflow: 'hidden', background: '#000' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 402, height: PF_SCR_H, transform: `translateY(${-P * PF_SCR_H}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : 'none' }}>
              {[idxA, idxA + 1].map((i) => i < n && <div key={i} style={{ position: 'absolute', left: 0, top: i * PF_SCR_H, width: 402, height: PF_SCR_H, overflow: 'hidden' }}>{item(i)}</div>)}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }} />
            <div style={{ position: 'absolute', left: '50%', top: 14, width: 96, height: 28, marginLeft: -48, borderRadius: 99, background: '#000' }} />
            <div style={{ position: 'absolute', left: 22, bottom: 40, color: '#fff', fontFamily: FONT }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 99, background: K.orange, border: '2px solid #fff' }} />
                <div style={{ fontSize: 24, fontWeight: 800 }}>{handle}</div>
              </div>
              <div style={{ marginTop: 14, width: 230, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.7)' }} />
              <div style={{ marginTop: 10, width: 150, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.45)' }} />
            </div>
            <div style={{ position: 'absolute', right: 18, bottom: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <svg width={44} height={44} viewBox="0 0 24 24" fill={K.orange} stroke="none"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.8 1.1 5.4 3 1.6-1.9 3.3-3 5.4-3 3.6 0 5.7 3.7 4.2 7.2C19.500 16.400 12 21 12 21z" /></svg>
                <div>{fmtN(heart)}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 99, border: '3px solid #fff', boxSizing: 'border-box' }} />
              <div style={{ width: 0, height: 0, borderLeft: '22px solid #fff', borderTop: '14px solid transparent', borderBottom: '14px solid transparent' }} />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ── 10 · pageScroll ──────────────────────────────────────────────────────────────────────
export type PageScrollProps = { variant?: '3d' | 'flat'; shots?: string[]; focus?: { shot: number; x: number; y: number; label: string }; y?: number };
const PageScroll: React.FC<Base & PageScrollProps> = ({ t, S, E, variant = '3d', shots, focus = { shot: 2, x: 0.5, y: 0.45, label: 'Quiz Funnels' }, y = 540 }) => {
  const VW = 820, VH = 700, SHH = 560, CH = variant === 'flat' ? 64 : 0;
  const f = fr(t, S, E), u = t - S;
  const n = shots && shots.length ? shots.length : 4;
  const sh = clamp(focus.shot, 0, n - 1);
  const target = clamp(sh * SHH + focus.y * SHH - VH * 0.5, 0, Math.max(0, n * SHH - VH));
  const sc = target * spring(u - 0.35);
  const fx = focus.x * VW, fy = sh * SHH + focus.y * SHH - sc;
  const dim = ease.outCubic(w(f, 0.56, 0.68));
  const lab = ease.outBack(lin(t, S + 0.64 * (E - S), 0.4));
  const R0 = 70 + 90 * dim;
  const zoom = variant === 'flat' ? 1 + 0.2 * ease.inOutCubic(w(f, 0.6, 0.9)) : 1;
  const lblY = fy + R0 + 24 > VH - 80 ? fy - R0 - 80 : fy + R0 + 24;
  const total = VH + CH;
  const view = (
    <div style={{ position: 'relative', width: VW, height: VH, overflow: 'hidden', background: K.panel }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: VW, height: VH, transformOrigin: `${fx}px ${fy}px`, transform: `scale(${zoom})` }}>
        <div style={{ position: 'absolute', left: 0, top: -sc, width: VW }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} style={{ position: 'relative', width: VW, height: SHH, overflow: 'hidden' }}>
              {shots && shots.length ? <Media src={shots[i]} /> : <PhPage i={i} />}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: dim, background: `radial-gradient(circle at ${fx}px ${fy}px, transparent 0, transparent ${R0 * 0.75}px, rgba(8,12,18,0.68) ${R0}px)` }} />
        <div style={{ position: 'absolute', left: fx - R0, top: fy - R0, width: R0 * 2, height: R0 * 2, borderRadius: 999, border: `4px solid ${K.orange}`, opacity: dim * lin(t, S + 0.64 * (E - S), 0.3), boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', left: clamp(fx - 200, 20, VW - 420), top: lblY, padding: '12px 28px', borderRadius: 99, background: K.orange, color: '#fff', fontSize: 34, fontWeight: 900, whiteSpace: 'nowrap', opacity: clamp(lab * 2, 0, 1), transform: `scale(${0.7 + 0.3 * lab})`, boxShadow: '0 16px 30px -10px rgba(234,88,12,0.7)' }}>{(focus.label)}</div>
      </div>
    </div>
  );
  const tilt = variant === '3d' ? `perspective(1900px) rotateX(${10 - 6 * dim}deg) rotateY(${-16 + 10 * dim}deg) rotateZ(${2 - 1.5 * dim}deg)` : 'none';
  return (
    <Shell t={t} S={S} E={E} cy={y + total / 2}>
      <div style={{ position: 'absolute', left: 130, top: y, width: VW, height: total, transform: tilt, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden', background: K.panel, border: `1px solid ${line}`, boxShadow: variant === '3d' ? '0 60px 80px -30px rgba(20,20,20,0.5)' : SH }}>
          {variant === 'flat' && (
            <div style={{ height: CH, background: '#1B2430', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 15, height: 15, borderRadius: 99, background: c }} />)}
              <div style={{ marginLeft: 18, flex: 1, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', padding: '0 16px' }}>wisefunnel.io</div>
            </div>
          )}
          {view}
        </div>
      </div>
    </Shell>
  );
};

// ── 11 · commentDm ───────────────────────────────────────────────────────────────────────
export type CommentDmProps = { keyword?: string; offer?: string; thumb?: string; handle?: string; dm?: string; y?: number; tag?: string; showBadge?: boolean };
const CD_H = 900;
const CommentDm: React.FC<Base & CommentDmProps> = ({ t, S, E, keyword = 'FUNNEL', offer = 'Roofing quiz funnel template', thumb, handle = '@wisefunnel', dm = 'Here is your free template. Tap the link to grab it.', y = 520, tag = 'FREE TEMPLATE', showBadge = true }) => {
  const f = fr(t, S, E);
  const typeP = w(f, 0.2, 0.42);
  const postF = 0.5;
  const posted = f >= postF + 0.02;
  const pp = bump(f, postF, 0.03);
  const dmP = ease.outBack(lin(t, S + 0.64 * (E - S), 0.5));
  const badgeP = ease.outBack(lin(t, S + 0.12 * (E - S), 0.5));
  return (
    <Shell t={t} S={S} E={E} cy={y + CD_H / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: CD_H }}>
        <div style={{ ...cardS(36), left: 0, top: 0, width: 900, height: 320 }}>
          <div style={{ position: 'absolute', left: 30, top: 30, width: 260, height: 260, borderRadius: 26, overflow: 'hidden', border: `1px solid ${line}`, background: mix(K.orange, 14) }}>
            {thumb ? <Media src={thumb} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="form" size={110} color={K.orange} sw={1.8} /></div>}
          </div>
          <div style={{ position: 'absolute', left: 322, top: 56, right: 30 }}>
            <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1 }}>{offer}</div>
            <div style={{ marginTop: 18, fontSize: 28, fontWeight: 600, color: mix(K.ink, 60), lineHeight: 1.25 }}>Comment <span style={{ color: K.orange, fontWeight: 900 }}>{keyword}</span> and I send it to your DMs</div>
          </div>
          {showBadge && (
            <div style={{ position: 'absolute', right: -14, top: -26, padding: '12px 28px', borderRadius: 99, background: K.orange, color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap', transform: `rotate(5deg) scale(${0.4 + 0.6 * badgeP})`, opacity: clamp(badgeP * 2, 0, 1), boxShadow: '0 18px 30px -10px rgba(234,88,12,0.7)' }}>{tag}</div>
          )}
        </div>
        <div style={{ ...cardS(30), left: 0, top: 350, width: 900, height: 170 }}>
          <div style={{ position: 'absolute', left: 28, top: 28, width: 62, height: 62, borderRadius: 99, background: K.navy }} />
          <div style={{ position: 'absolute', left: 112, top: 24, right: 28, height: 72, borderRadius: 36, border: `2px solid ${typeP > 0 && !posted ? K.orange : line}`, background: mix(K.ink, 3), display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', fontSize: 32, fontWeight: 800 }}>
            {posted ? <span style={{ color: mix(K.ink, 45), fontWeight: 600 }}>Add a comment</span> : typeP === 0 ? <span style={{ color: mix(K.ink, 40), fontWeight: 600 }}>Add a comment</span> : <Typed text={keyword} p={typeP} t={t} caret={!posted} />}
            <div style={{ marginLeft: 'auto', padding: '8px 22px', borderRadius: 99, background: typeP >= 1 ? K.orange : mix(K.orange, 35), color: '#fff', fontSize: 24, fontWeight: 800, transform: `scale(${1 - 0.14 * pp})` }}>Post</div>
          </div>
          {posted && (
            <div style={{ position: 'absolute', left: 112, top: 106, fontSize: 26, fontWeight: 700, opacity: ease.outCubic(lin(t, S + (postF + 0.02) * (E - S), 0.3)) }}>
              <span style={{ fontWeight: 900 }}>you</span> <span style={{ color: K.orange, fontWeight: 900 }}>{keyword}</span>
            </div>
          )}
        </div>
        <div style={{ ...cardS(30), left: 0, top: 560, width: 900, height: 330, opacity: clamp(dmP * 2, 0, 1), transform: `translateY(${(1 - dmP) * 80}px) scale(${0.92 + 0.08 * dmP})`, borderColor: mix(K.orange, 55) }}>
          <div style={{ position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: 99, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="msg" size={30} color="#fff" sw={2.4} /></div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{handle}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: mix(K.ink, 50) }}>New message · now</div>
            </div>
          </div>
          <div style={{ position: 'absolute', right: 30, top: 34, width: 36, height: 36, borderRadius: 99, background: K.orange, color: '#fff', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
          <div style={{ position: 'absolute', left: 30, top: 108, maxWidth: 700, padding: '18px 26px', borderRadius: '26px 26px 26px 8px', background: mix(K.ink, 7), fontSize: 30, fontWeight: 700, lineHeight: 1.25 }}>{dm}</div>
          <div style={{ position: 'absolute', left: 30, top: 238, padding: '12px 26px', borderRadius: 99, background: K.orange, color: '#fff', fontSize: 26, fontWeight: 800 }}>Open template</div>
        </div>
      </div>
    </Shell>
  );
};

// ── 12 · transcriptReveal ────────────────────────────────────────────────────────────────
export type TranscriptRevealProps = { rows?: { kind: 'call' | 'ok' | 'think'; text: string }[]; artifact?: { title: string; rows: [string, string][] }; y?: number };
const TR_ROWS: { kind: 'call' | 'ok' | 'think'; text: string }[] = [
  { kind: 'call', text: 'search_buyers(city="Austin")' },
  { kind: 'think', text: 'Filtering to verified owners' },
  { kind: 'call', text: 'verify_phone(batch=412)' },
  { kind: 'ok', text: '412 numbers verified' },
  { kind: 'call', text: 'score_fit(niche="roofing")' },
  { kind: 'ok', text: '38 buyers matched' },
];
const TR_ART = { title: 'Verified buyers · Austin roofing', rows: [['Apex Roofing', '$45'], ['Summit Roofing', '$38'], ['Lone Star Roofs', '$52']] as [string, string][] };
const TR_RH = 70, TR_VIEW = 8;
const TranscriptReveal: React.FC<Base & TranscriptRevealProps> = ({ t, S, E, rows = TR_ROWS, artifact = TR_ART, y = 520 }) => {
  const f = fr(t, S, E);
  const n = rows.length;
  const rowAt = (i: number) => 0.06 + (i * 0.56) / n;
  const shown = rows.reduce((c, _, i) => c + clamp((f - rowAt(i)) / (0.05), 0, 1), 0);
  const scrollRows = Math.max(0, Math.min(shown, n) - TR_VIEW + 0.0);
  const logH = TR_VIEW * TR_RH + 100;
  const artH = 150 + artifact.rows.length * 76;
  const total = Math.max(logH, artH);
  const r0 = 0.7;
  const g = ease.inOutCubic(w(f, r0, r0 + 0.14));
  const lastY = 76 + Math.min(n, TR_VIEW) * TR_RH - TR_RH - 0;
  const logOp = 1 - ease.outCubic(w(f, r0, r0 + 0.08));
  const kindIc = (k: string) => (k === 'call' ? <span style={{ color: K.orange, fontWeight: 900 }}>›</span> : k === 'ok' ? <Ic n="check" size={26} color="#22C55E" sw={3.4} /> : <span style={{ color: '#8FA3B8' }}>…</span>);
  return (
    <Shell t={t} S={S} E={E} cy={y + total / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: total }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 900, height: logH, borderRadius: 34, background: '#0F1B27', boxShadow: SH, overflow: 'hidden', opacity: g > 0.5 ? 0 : 1 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 900, height: 60, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />)}
            <div style={{ marginLeft: 14, fontFamily: MONO, fontSize: 20, color: '#8FA3B8' }}>agent.log</div>
          </div>
          <div style={{ position: 'absolute', left: 0, top: 76, width: 900, height: TR_VIEW * TR_RH, overflow: 'hidden', opacity: logOp }}>
            <div style={{ transform: `translateY(${-scrollRows * TR_RH}px)` }}>
              {rows.map((r, i) => {
                const p = ease.outCubic(clamp((f - rowAt(i)) / 0.05, 0, 1));
                return (
                  <div key={i} style={{ height: TR_RH, display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px', fontFamily: MONO, fontSize: 28, fontWeight: r.kind === 'call' ? 700 : 600, fontStyle: r.kind === 'think' ? 'italic' : 'normal', color: r.kind === 'ok' ? '#86EFAC' : r.kind === 'think' ? '#8FA3B8' : '#E8EEF5', opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
                    <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}>{kindIc(r.kind)}</div>{r.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {g > 0 && (
          <div style={{ ...cardS(lerp(14, 34, g)), left: 0, top: lerp(76 + lastY, 0, g), width: 900, height: lerp(TR_RH, artH, g), background: K.panel, overflow: 'hidden', borderColor: mix(GREEN, 55), opacity: ease.outCubic(w(g, 0, 0.2)) }}>
            <div style={{ position: 'absolute', left: 32, top: 28, right: 32, display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 900, letterSpacing: -0.6, opacity: ease.outCubic(w(g, 0.4, 0.8)) }}>
              <Ic n="check" size={34} color={GREEN} sw={3.4} />{artifact.title}
            </div>
            {artifact.rows.map((r, i) => {
              const rp = ease.outCubic(w(g, 0.55 + i * 0.1, 0.95));
              return (
                <div key={i} style={{ position: 'absolute', left: 32, right: 32, top: 100 + i * 76, height: 68, display: 'flex', alignItems: 'center', borderTop: `1px solid ${line}`, opacity: rp, transform: `translateY(${(1 - rp) * 16}px)` }}>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{r[0]}</div>
                  <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 32, fontWeight: 900, color: GREEN }}>{r[1]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
};

// ── 13 · zoomOutReveal (frame) ───────────────────────────────────────────────────────────
export type ZoomOutRevealProps = { start?: number; y?: number };
const ZoomOutReveal: React.FC<Base & ZoomOutRevealProps> = ({ t, S, E, start = 2.6, y = 900 }) => {
  const u = t - S;
  const fit = 1.12, Z0 = 4.4;
  const tc = Math.min(0.9, start * 0.45);
  const dz = clamp(E - S - start - 0.3, 1.2, 3.4);
  const gz = ease.inOutCubic(lin(u, start, dz));
  const z = Math.exp(lerp(Math.log(Z0), Math.log(fit), gz));
  const wgt = 1 - gz;
  const BTN = { x: RC.cont[0] + RC.cont[2] / 2 - BW / 2, y: RC.cont[1] + RC.cont[3] / 2 - BH / 2 };
  const fx = BTN.x * wgt, fy = BTN.y * wgt;
  const q = ease.outCubic(lin(u, tc + 0.1, 0.35));
  const press = bump(u, tc, 0.12);
  const sx = 540 + z * (BTN.x - fx) + 14 * z * 0.35, sy = 540 * 0 + y + z * (BTN.y - fy) + 12 * z * 0.35;
  const op = lin(t, S, 0.2) * (1 - lin(t, E - 0.2, 0.2));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op, overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, background: K.bg }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${K.dot} 2.2px, transparent 2.6px)`, backgroundSize: '46px 46px' }} />
      <div style={{ position: 'absolute', left: 540, top: y, width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${z}) translate(${-fx}px, ${-fy}px)` }}>
          <div style={{ position: 'absolute', left: -BW / 2, top: -BH / 2, width: BW, height: BH }}>
            <Builder sel={1} q={q} cont={press} hot={u < tc + 0.1 && u > tc - 0.5 ? 'cont' : null} />
            <Ripple t={t} at={S + tc} x={BTN.x + BW / 2} y={BTN.y + BH / 2} />
          </div>
        </div>
      </div>
      <Cursor x={sx} y={sy} mode="arrow" press={press} op={ease.outCubic(lin(u, 0.1, 0.3))} />
    </div>
  );
};

// ── 14 · trackingBox ─────────────────────────────────────────────────────────────────────
export type TrackingBoxProps = { label?: string; conf?: number; y?: number };
const TB_NAMES: [string, string, number][] = [['Mike R.', 'Roof quote · 78701', 31], ['Dana P.', 'Gutter repair · 78702', 44], ['Chris T.', 'Inspection · 78745', 52], ['Jordan L.', 'Storm damage · full replacement', 94], ['Sam W.', 'Roof quote · 78704', 38], ['Priya K.', 'Leak repair · 78731', 47], ['Tom B.', 'Roof quote · 78759', 29]];
const TB_PITCH = 144, TB_RH = 130, TB_VH = 640, TB_HOT = 3;
const TrackingBox: React.FC<Base & TrackingBoxProps> = ({ t, S, E, label = 'HOT LEAD', conf = 94, y = 540 }) => {
  const f = fr(t, S, E), u = t - S;
  const scroll = 44 * u;
  const rowY = (i: number) => 22 + i * TB_PITCH - scroll;
  const lockF = 0.42;
  const locked = f >= lockF;
  const scan: Pt[] = [[0.06, 0, 0], [0.16, 0, 1], [0.26, 0, 2], [0.36, 0, 3], [1, 0, 3]];
  const cy = path(f, scan.map(([a, , b]) => [a, 0, b] as Pt)).y;
  const i0 = Math.floor(cy), fr0 = cy - i0;
  const centerY = lerp(rowY(i0) + TB_RH / 2, rowY(Math.min(6, i0 + 1)) + TB_RH / 2, fr0);
  const lockP = ease.outBack(lin(t, S + lockF * (E - S), 0.4));
  const pad = locked ? lerp(26, 10, lockP) : 26;
  const boxTop = centerY - TB_RH / 2 - pad, boxH = TB_RH + pad * 2;
  const bx = 24 - pad, bw = 852 + pad * 2;
  const vis = ease.outCubic(w(f, 0.04, 0.1));
  const confShow = conf * ease.outCubic(w(f, lockF, lockF + 0.2));
  const col = locked ? K.orange : K.ink;
  const corner = (cx: number, cyy: number, dx: number, dy: number) => (
    <div style={{ position: 'absolute', left: cx - (dx > 0 ? 0 : 34), top: cyy - (dy > 0 ? 0 : 34), width: 34, height: 34, borderTop: dy > 0 ? `${locked ? 7 : 4}px solid ${col}` : 'none', borderBottom: dy < 0 ? `${locked ? 7 : 4}px solid ${col}` : 'none', borderLeft: dx > 0 ? `${locked ? 7 : 4}px solid ${col}` : 'none', borderRight: dx < 0 ? `${locked ? 7 : 4}px solid ${col}` : 'none', boxSizing: 'border-box' }} />
  );
  return (
    <Shell t={t} S={S} E={E} cy={y + TB_VH / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: TB_VH }}>
        <div style={{ ...cardS(34), left: 0, top: 0, width: 900, height: TB_VH, overflow: 'hidden' }}>
          {TB_NAMES.map(([nm, sub, sc], i) => {
            const hot = i === TB_HOT && locked;
            return (
              <div key={i} style={{ position: 'absolute', left: 24, top: rowY(i), width: 852, height: TB_RH, borderRadius: 22, border: `1px solid ${hot ? mix(K.orange, 50) : line}`, background: hot ? mix(K.orange, 9) : K.panel, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px', boxSizing: 'border-box' }}>
                <div style={{ width: 72, height: 72, borderRadius: 99, background: PAL()[i % 6], color: '#fff', fontWeight: 900, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nm[0]}</div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.6 }}>{nm}</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: mix(K.ink, 55) }}>{sub}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 26, fontWeight: 800, color: mix(K.ink, 50) }}>{hot ? '' : `score ${sc}`}</div>
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: bx, top: boxTop, width: bw, height: boxH, opacity: vis, background: locked ? mix(K.orange, 8) : 'transparent', borderRadius: 14 }}>
            {corner(0, 0, 1, 1)}{corner(bw, 0, -1, 1)}{corner(0, boxH, 1, -1)}{corner(bw, boxH, -1, -1)}
            {!locked && <div style={{ position: 'absolute', left: 8, right: 8, top: 10 + (boxH - 24) * (0.5 + 0.5 * Math.sin(t * 9)), height: 3, background: mix(K.ink, 45) }} />}
            <div style={{ position: 'absolute', left: -4, top: -52, padding: '7px 20px', borderRadius: 10, background: locked ? K.orange : K.ink, color: locked ? '#fff' : K.panel, fontFamily: MONO, fontSize: 26, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap', transform: locked ? `scale(${1 + 0.06 * (1 - lockP)})` : 'none', transformOrigin: '0 100%' }}>
              {locked ? `${label} ${Math.round(confShow)}%` : 'SCANNING'}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ── 15 · approvePress ────────────────────────────────────────────────────────────────────
export type ApprovePressProps = { title?: string; steps?: string[]; y?: number };
const AP2_STEPS = ['Draft pitch', 'Attach sample lead', 'Set price $45 / lead', 'Approve and send'];
const ApprovePress: React.FC<Base & ApprovePressProps> = ({ t, S, E, title = 'Pitch to Apex Roofing', steps = AP2_STEPS, y = 520 }) => {
  const f = fr(t, S, E);
  const n = steps.length;
  const CLH = 120 + n * 84;
  const PY = CLH + 40, PH = 400;
  const total = PY + PH;
  const tickF = (i: number) => 0.12 + (i * 0.34) / Math.max(1, n);
  const pressF = 0.77;
  const btn = { x: 900 - 36 - 150, y: PY + PH - 36 - 44 };
  const cur = path(f, [[0, 560, CLH - 60], [0.44, 520, CLH - 70], [0.52, 520, CLH - 70], [0.72, btn.x, btn.y], [0.80, btn.x, btn.y], [0.95, btn.x + 90, btn.y + 120], [1, btn.x + 90, btn.y + 120]]);
  const pr = bump(f, pressF, 0.03);
  const sent = f >= pressF + 0.03;
  const st = ease.outBack(lin(t, S + (pressF + 0.03) * (E - S), 0.32));
  const curOp = ease.outCubic(w(f, 0.4, 0.46)) * (1 - ease.outCubic(w(f, 0.88, 0.95)));
  return (
    <Shell t={t} S={S} E={E} cy={y + total / 2}>
      <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: total }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 640, height: CLH, perspective: 1400 }}>
          <div style={{ ...cardS(32), left: 0, top: 0, width: 640, height: CLH, transform: 'rotateY(12deg) rotateZ(-2deg)', transformOrigin: '0% 50%' }}>
            <div style={{ position: 'absolute', left: 32, top: 26, fontSize: 15, fontWeight: 800, letterSpacing: 3, color: mix(K.ink, 55) }}>CHECKLIST</div>
            {steps.map((s, i) => {
              const done = f >= tickF(i);
              const pp = ease.outBack(lin(t, S + tickF(i) * (E - S), 0.3));
              return (
                <div key={i} style={{ position: 'absolute', left: 28, top: 70 + i * 84, width: 584, height: 72, display: 'flex', alignItems: 'center', gap: 20, padding: '0 8px', fontSize: 31, fontWeight: 800, letterSpacing: -0.5, color: done ? K.ink : mix(K.ink, 55) }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: done ? GREEN : 'transparent', border: done ? 'none' : `3px solid ${mix(K.ink, 28)}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${done ? 0.6 + 0.4 * pp : 1})` }}>{done && <Ic n="check" size={28} color="#fff" sw={3.8} />}</div>
                  {s}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...cardS(34), left: 60, top: PY, width: 840, height: PH }}>
          <div style={{ position: 'absolute', left: 36, top: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="msg" size={30} color="#fff" sw={2.4} /></div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.8 }}>{title}</div>
          </div>
          {[520, 440, 480].map((wd, i) => <div key={i} style={{ position: 'absolute', left: 36, top: 120 + i * 32, width: wd, height: 14, borderRadius: 7, background: mix(K.ink, 14 - i * 2) }} />)}
          <div style={{ position: 'absolute', left: 36, top: 232, padding: '8px 22px', borderRadius: 99, background: mix(GREEN, 14), color: GREEN, fontSize: 26, fontWeight: 900 }}>$45 / lead</div>
          <div style={{ position: 'absolute', left: 36, bottom: 36, width: 150, height: 88, borderRadius: 20, border: `2px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: mix(K.ink, 55) }}>Edit</div>
          <div style={{ position: 'absolute', right: 36, bottom: 36, width: 300, height: 88, borderRadius: 20, background: sent ? GREEN : K.orange, color: '#fff', fontSize: 32, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transform: `scale(${1 - 0.07 * pr})`, boxShadow: `0 18px 30px -12px ${sent ? GREEN : K.orange}` }}>
            {sent && <Ic n="check" size={30} color="#fff" sw={3.6} />}{sent ? 'Approved' : 'Approve'}
          </div>
          {sent && (
            <div style={{ position: 'absolute', left: 250, top: 120, padding: '2px 36px', border: `10px solid ${GREEN}`, borderRadius: 20, color: GREEN, fontSize: 124, fontWeight: 900, letterSpacing: 8, opacity: clamp(st * 1.6, 0, 0.92), transform: `rotate(-11deg) scale(${2.4 - 1.4 * st})`, transformOrigin: '50% 50%', background: mix(K.panel, 55), whiteSpace: 'nowrap' }}>SENT</div>
          )}
        </div>
        <Ripple t={t} at={S + pressF * (E - S)} x={60 + 840 - 36 - 150} y={PY + PH - 36 - 44} />
        <Cursor x={cur.x} y={cur.y} mode="arrow" press={pr} op={curOp} />
      </div>
    </Shell>
  );
};

// ── registry ─────────────────────────────────────────────────────────────────────────────
const bx = (y0: number, h: number, x0 = 70, x1 = 1010): Box => ({ x0, y0, x1, y1: y0 + h });
export const FX_UI: Record<string, { C: React.FC<any>; sfx: () => SfxCue[]; frame?: true; box?: (p: any, format?: string) => Box }> = {
  cursorDemo: { C: CursorDemo, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, BH + 40) },
  multiCursor: { C: MultiCursor, sfx: none, box: (p) => bx((p?.y ?? 560) - 10, MC_H + 20) },
  cameraTrack: { C: CameraTrack, sfx: none, box: (p) => bx((p?.y ?? 560) - 10, 720) },
  promptGenerate: { C: PromptGenerate, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, promptH((p?.steps ?? PG_STEPS).length) + 20) },
  agentProgress: { C: AgentProgress, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, apList((p?.steps ?? AP_STEPS).length) + 24 + apRec((p?.receipt ?? AP_RECEIPT).rows.length) + 20) },
  chatMock: { C: ChatMock, sfx: none, box: (p) => bx((p?.y ?? 540) - 10, CHAT_H + 20) },
  panelSync: { C: PanelSync, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, PS_H + 20) },
  deviceShowcase: { C: DeviceShowcase, sfx: none, box: (p) => bx((p?.y ?? 540) + 10, DS_H - 10, 50, 1030) },
  phoneFeed: { C: PhoneFeed, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, PF_H + 20, 50, 1030) },
  pageScroll: { C: PageScroll, sfx: none, box: (p) => bx((p?.y ?? 540) - 20, (p?.variant === 'flat' ? 764 : 700) + 40, 100, 980) },
  commentDm: { C: CommentDm, sfx: none, box: (p) => bx((p?.y ?? 520) - 40, CD_H + 50) },
  transcriptReveal: { C: TranscriptReveal, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, Math.max(TR_VIEW * TR_RH + 100, 150 + ((p?.artifact ?? TR_ART).rows.length) * 76) + 20) },
  zoomOutReveal: { C: ZoomOutReveal, sfx: none, frame: true },
  trackingBox: { C: TrackingBox, sfx: none, box: (p) => bx((p?.y ?? 540) - 60, TB_VH + 70) },
  approvePress: { C: ApprovePress, sfx: none, box: (p) => bx((p?.y ?? 520) - 10, 120 + (p?.steps ?? AP2_STEPS).length * 84 + 40 + 400 + 20) },
};
