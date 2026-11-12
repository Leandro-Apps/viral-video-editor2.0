// Family 11 · STACK elements (9:16). Each one lives in ONE fixed zone from kit/stack.ts, so scenes can be swapped freely.
//   headline  zone A : small bold line + big hero line (box | underline | plain)
//   winShot   zone B : screenshot inside an animated window (slow zoom, glowing line running around it, optional scroll)
//   promptBox zone B : typed prompt / comment box with send button and an optional result pill
//   toolGrid  zone B : tiles that light up one by one as each item is spoken
//   stat      zone B : big count-up number with a label
//   fork      zone B : a node splits into two cards (or two cards merge into one node)
//   rivals    zone B : magnifier scans generic competitor cards (no brand logos)
// plug / brandKit (kwfx.tsx) also live in zone B (y = STACK.stage.cy).
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { FONT, MONO } from '../tokens';
import { clamp, ease, kick, lin } from '../motion';
import { BRANDS } from '../brands';
import { Ic } from '../Icon';
import { STACK as K } from '../stack';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number };
const fade = (t: number, S: number, E: number, o = 0.22) => ease.outCubic(lin(t, S, o)) * (1 - ease.inCubic(lin(t, E - o, o)));
const card: React.CSSProperties = { position: 'absolute', background: K.panel, border: '1px solid #E9E4DA', boxShadow: '0 28px 60px -24px rgba(40,30,10,0.35), 0 2px 8px rgba(40,30,10,0.06)', boxSizing: 'border-box' };

// ── A · headline ─────────────────────────────────────────────────────────────────────────
export type HeadlineProps = { small: string; hero: string; style?: 'box' | 'underline' | 'plain'; smallAt?: number; heroAt?: number };
export const Headline: React.FC<Base & HeadlineProps> = ({ t, S, E, small, hero, style = 'box', smallAt, heroAt }) => {
  const o = fade(t, S, E, 0.18);
  const ps = ease.outCubic(lin(t, smallAt ?? S, 0.3)), ph = ease.outBack(lin(t, heroAt ?? S + 0.12, 0.4));
  const hs = clamp(980 / (hero.length * 0.43), 64, 104);
  const box = style === 'box';
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 40, right: 40, top: K.headline.smallY - 38, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: -1.5, color: K.ink, opacity: ps, transform: `translateY(${(1 - ps) * 24}px)`, whiteSpace: 'nowrap' }}>{small}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: K.headline.heroTop, display: 'flex', justifyContent: 'center', opacity: clamp(ph * 2, 0, 1), transform: `scale(${0.9 + 0.1 * ph}) translateY(${(1 - ph) * 20}px)` }}>
        <div style={{ position: 'relative', padding: box ? '4px 36px 12px' : '0 10px', background: box ? K.orange : 'transparent', borderRadius: 18, boxShadow: box ? '0 18px 36px -14px rgba(234,88,12,0.6)' : 'none' }}>
          <div style={{ fontFamily: K.serif, fontStyle: 'italic', fontWeight: 400, fontSize: hs, lineHeight: 1.1, letterSpacing: -2, color: box ? '#fff' : style === 'plain' ? K.orange : K.ink, whiteSpace: 'nowrap' }}>{hero}</div>
          {style === 'underline' && <div style={{ position: 'absolute', left: 10, bottom: -6, height: 7, width: `calc((100% - 20px) * ${ease.inOutCubic(lin(t, (heroAt ?? S + 0.12) + 0.3, 0.5))})`, background: K.orange, borderRadius: 4 }} />}
        </div>
      </div>
    </div>
  );
};

// ── B · winShot ──────────────────────────────────────────────────────────────────────────
export type WinShotProps = { src: string; w: number; h: number; title?: string; zoomTo?: number; scroll?: boolean; box?: [number, number, number, number]; /** point of interest (0-1 of the image): pans there, zooms into it and (ring) pulses an orange ring on it */ focus?: [number, number]; ring?: boolean; ringAt?: number };
export const WinShot: React.FC<Base & WinShotProps> = ({ t, S, E, src, w, h, title = 'wisefunnel.io', zoomTo = 1.12, scroll = false, box, focus, ring = false, ringAt }) => {
  const [bx, by, bw, bh] = box ?? [80, 520, 920, 440];
  const pin = ease.outBack(lin(t, S, 0.45)), o = fade(t, S, E, 0.2);
  const prog = lin(t, S, E - S);
  const CH = 56, vh = bh - CH, k = bw / w, total = h * k;
  const sc = 1 + (zoomTo - 1) * ease.inOutCubic(prog);
  const y = scroll ? -(Math.max(0, total - vh) * ease.inOutCubic(clamp((prog - 0.08) / 0.84, 0, 1))) : 0;
  const run = (t - S) * 0.45;
  const fy = focus ? focus[1] * total : 0, ty = focus ? clamp(vh / 2 - fy, vh - total, 0) : 0;
  const ra = (ringAt ?? S + 0.9), rp = clamp((t - ra) / 0.9, 0, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, transform: `scale(${(0.9 + 0.1 * pin) * (1 + 0.025 * prog)})`, transformOrigin: '50% 50%' }}>
        <div style={{ ...card, left: 0, top: 0, width: bw, height: bh, borderRadius: 26, overflow: 'hidden', boxShadow: '0 34px 70px -26px rgba(40,30,10,0.5), 0 0 60px -10px rgba(234,88,12,0.35)' }}>
          <div style={{ height: CH, background: '#1B2430', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 99, background: c }} />)}
            <div style={{ marginLeft: 18, fontFamily: MONO, fontSize: 24, color: '#AEB8C6', letterSpacing: 1 }}>{title}</div>
          </div>
          <div style={{ position: 'absolute', left: 0, top: CH, width: bw, height: vh, overflow: 'hidden', background: '#fff' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: bw, transform: `translateY(${scroll ? y : ty}px) scale(${scroll ? 1 : sc})`, transformOrigin: focus ? `${focus[0] * 100}% ${focus[1] * total}px` : '50% 0%' }}>
              <Img src={staticFile(src)} style={{ width: bw, height: total, display: 'block' }} />
              {ring && focus && t >= ra && [0, 0.5].map((o) => { const q = (rp + o) % 1; return <div key={o} style={{ position: 'absolute', left: focus[0] * bw - 70, top: focus[1] * total - 70, width: 140, height: 140, borderRadius: 99, border: `${7 * (1 - q) + 2}px solid ${K.orange}`, opacity: 1 - q * 0.7, transform: `scale(${0.5 + q})` }} />; })}
            </div>
          </div>
        </div>
        {/* glowing line running around the window */}
        <svg width={bw} height={bh} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          {[0, 0.5].map((off) => (
            <rect key={off} x={0} y={0} width={bw} height={bh} rx={26} fill="none" stroke={K.orange} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="0.14 0.86" strokeDashoffset={-(run + off)} style={{ filter: `drop-shadow(0 0 10px ${K.orange}) drop-shadow(0 0 22px ${K.orange})` }} />
          ))}
        </svg>
      </div>
    </div>
  );
};

// ── B · promptBox ────────────────────────────────────────────────────────────────────────
export type PromptBoxProps = { label?: string; text: string; at: number; cps?: number; sendAt?: number; after?: { text: string; at: number }; y?: number };
export const PromptBox: React.FC<Base & PromptBoxProps> = ({ t, S, E, label = 'CLAUDE', text, at, cps = 24, sendAt, after, y = 600 }) => {
  const pin = ease.outBack(lin(t, S, 0.4)), o = fade(t, S, E, 0.2);
  const n = Math.floor(clamp((t - at) * cps, 0, text.length));
  const sent = sendAt !== undefined && t >= sendAt;
  const send = sendAt !== undefined ? ease.outBack(lin(t, sendAt - 0.08, 0.25)) : 0;
  const pa = after ? ease.outBack(lin(t, after.at, 0.35)) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 70, top: y - 44, fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: '#5B5548', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 14, height: 14, borderRadius: 99, background: K.orange, display: 'inline-block' }} />{label}</div>
      <div style={{ ...card, left: 60, top: y, width: 960, height: 190, borderRadius: 34, transform: `scale(${0.92 + 0.08 * pin})`, boxShadow: `0 0 0 ${sent ? 5 : 0}px ${K.orange}, 0 28px 60px -24px rgba(40,30,10,0.35)` }}>
        <div style={{ position: 'absolute', left: 38, top: 36, right: 38, fontFamily: FONT, fontWeight: 600, fontSize: 46, color: K.ink, letterSpacing: -0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {text.slice(0, n)}<span style={{ display: 'inline-block', width: 4, height: 46, background: K.orange, marginLeft: 4, verticalAlign: '-8px', opacity: Math.floor(t * 2) % 2 === 0 || n < text.length ? 1 : 0 }} />
        </div>
        <div style={{ position: 'absolute', right: 30, bottom: 26, width: 78, height: 78, borderRadius: 99, background: sent ? K.orange : K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.18 * Math.sin(send * Math.PI)})` }}>
          <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
        </div>
      </div>
      {after && <div style={{ position: 'absolute', left: 0, right: 0, top: y + 235, display: 'flex', justifyContent: 'center', opacity: clamp(pa * 2, 0, 1), transform: `scale(${0.8 + 0.2 * pa})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: K.orange, color: '#fff', borderRadius: 99, padding: '16px 40px', fontFamily: FONT, fontWeight: 900, fontSize: 46, boxShadow: '0 18px 36px -14px rgba(234,88,12,0.6)' }}><Ic n="check" size={46} color="#fff" sw={3.4} />{after.text}</div>
      </div>}
    </div>
  );
};

// ── B · toolGrid ─────────────────────────────────────────────────────────────────────────
export type ToolGridProps = { items: { label: string; icon: string; at: number }[]; cols?: number; y?: number };
export const ToolGrid: React.FC<Base & ToolGridProps> = ({ t, S, E, items, cols = 2, y = 540 }) => {
  const o = fade(t, S, E, 0.2), rows = Math.ceil(items.length / cols);
  const gap = 28, cw = (960 - gap * (cols - 1)) / cols, ch = Math.min(210, (440 - gap * (rows - 1)) / rows);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {items.map((it, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const pin = ease.outBack(lin(t, S + i * 0.07, 0.35)), lit = ease.outBack(lin(t, it.at, 0.35)), on = t >= it.at;
        return (
          <div key={i} style={{ ...card, left: 60 + c * (cw + gap), top: y + r * (ch + gap), width: cw, height: ch, borderRadius: 30, display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', opacity: clamp(pin * 2, 0, 1) * (on ? 1 : 0.5), transform: `scale(${(0.85 + 0.15 * pin) * (1 + (on ? 0.04 * Math.sin(Math.min(1, lit) * Math.PI) : 0))})`, boxShadow: `0 0 0 ${on ? 5 : 0}px ${K.orange}, 0 24px 50px -22px rgba(40,30,10,0.4)` }}>
            <div style={{ width: ch * 0.52, height: ch * 0.52, borderRadius: 22, background: on ? K.orange : '#EFEAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic n={it.icon} size={ch * 0.3} color={on ? '#fff' : '#8C8573'} sw={2.6} /></div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: -1, color: K.ink }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── B · stat ─────────────────────────────────────────────────────────────────────────────
export type StatProps = { to: number; suffix?: string; label: string; at: number; dur?: number };
export const Stat: React.FC<Base & StatProps> = ({ t, S, E, to, suffix = '', label, at, dur = 1 }) => {
  const o = fade(t, S, E, 0.2), p = ease.outCubic(lin(t, at, dur)), v = Math.round(to * p), landed = t >= at + dur;
  const pop = landed ? 1 + 0.08 * Math.exp(-(t - at - dur) * 9) * Math.cos((t - at - dur) * 20) : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 280, lineHeight: 1, letterSpacing: -12, color: landed ? K.orange : K.ink, transform: `scale(${pop})`, fontVariantNumeric: 'tabular-nums' }}>{v}<span style={{ fontSize: 110, letterSpacing: -3 }}>{suffix}</span></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 880, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 10, color: '#5B5548', textTransform: 'uppercase', opacity: ease.outCubic(lin(t, at, 0.4)) }}>{label}</div>
    </div>
  );
};

// ── B · fork ─────────────────────────────────────────────────────────────────────────────
type Node = { label: string; src?: string; slug?: string; icon?: string; tag?: string };
export type ForkProps = { at: number; top: { text: string; src?: string }; left: Node; right: Node; dir?: 'out' | 'in'; leftAt?: number; rightAt?: number };
const NodeCard: React.FC<{ n: Node; x: number; y: number; w: number; h: number; p: number }> = ({ n, x, y, w, h, p }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, textAlign: 'center', opacity: clamp(p * 2, 0, 1), transform: `scale(${0.8 + 0.2 * p})` }}>
    <div style={{ ...card, position: 'relative', width: w, height: h, borderRadius: 26, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF9F4' }}>
      {n.src && <Img src={staticFile(n.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />}
      {n.slug && n.slug.split(',').map((sl) => BRANDS[sl] && <svg key={sl} width={h * 0.42} height={h * 0.42} viewBox="0 0 24 24" style={{ margin: '0 10px' }}><path d={BRANDS[sl].path} fill={BRANDS[sl].hex} /></svg>)}
      {n.icon && <Ic n={n.icon} size={h * 0.45} color={K.orange} sw={2.2} />}
      {n.tag && <div style={{ position: 'absolute', right: 12, top: 12, background: K.ink, color: '#fff', borderRadius: 99, padding: '6px 18px', fontFamily: MONO, fontSize: 22, letterSpacing: 3 }}>{n.tag}</div>}
    </div>
    <div style={{ marginTop: 10, fontFamily: K.serif, fontStyle: 'italic', fontSize: 54, lineHeight: 1.1, color: K.ink }}>{n.label}</div>
  </div>
);
export const Fork: React.FC<Base & ForkProps> = ({ t, S, E, at, top, left, right, dir = 'out', leftAt, rightAt }) => {
  const o = fade(t, S, E, 0.2);
  const pt = ease.outBack(lin(t, S, 0.4));
  const draw = ease.inOutCubic(lin(t, at, 0.55));
  const pl = ease.outBack(lin(t, leftAt ?? at + 0.4, 0.4)), pr = ease.outBack(lin(t, rightAt ?? at + 0.55, 0.4));
  const TY = 520, TH = top.src ? 130 : 96, CY = 690, CW = 380, CH = 190, LX = 70, RX = 1080 - 70 - CW;
  const lx = LX + CW / 2, rx = RX + CW / 2, midY = (TY + TH + CY) / 2 + 10;
  const flow = ((t - at) * 0.9) % 1;
  const path = `M 540 ${TY + TH} V ${midY} M ${lx} ${midY} H ${rx} M ${lx} ${midY} V ${CY} M ${rx} ${midY} V ${CY}`;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={path} stroke={K.orange} strokeWidth={5} fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} strokeLinecap="round" />
        {draw > 0.98 && <path d={path} stroke="#fff" strokeWidth={5} fill="none" strokeDasharray="0.03 0.2" strokeDashoffset={dir === 'out' ? -flow : flow} strokeLinecap="round" />}
        <circle cx={lx} cy={CY} r={9} fill={K.orange} opacity={draw} /><circle cx={rx} cy={CY} r={9} fill={K.orange} opacity={draw} />
      </svg>
      <div style={{ ...card, left: 120, top: TY, width: 840, height: TH, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.9 + 0.1 * pt})`, opacity: clamp(pt * 2, 0, 1), fontFamily: FONT, fontWeight: 700, fontSize: Math.min(40, 780 / Math.max(10, top.text.length * 0.54)), whiteSpace: 'nowrap', color: K.ink, letterSpacing: -0.5, padding: '0 30px' }}>{top.text}</div>
      <NodeCard n={left} x={LX} y={CY + 6} w={CW} h={CH} p={pl} /><NodeCard n={right} x={RX} y={CY + 6} w={CW} h={CH} p={pr} />
    </div>
  );
};

// ── B · rivals (generic competitor cards, no logos) ──────────────────────────────────────
export type RivalsProps = { count?: number; at: number; gap?: number; y?: number; label?: string };
export const Rivals: React.FC<Base & RivalsProps> = ({ t, S, E, count = 3, at, gap = 0.45, y = 700, label = 'COMPETITORS' }) => {
  const o = fade(t, S, E, 0.2), W = 290, G = 30, x0 = 540 - (count * W + (count - 1) * G) / 2;
  const icons = ['globe', 'pin', 'msg', 'form'];
  const cx = (i: number) => x0 + i * (W + G) + W / 2;
  const knots = [{ at: S, x: cx(0) - 220 }, ...Array.from({ length: count }, (_, i) => ({ at: at + i * gap, x: cx(i) }))];
  let mx = knots[0].x;
  for (let i = 0; i < knots.length - 1; i++) if (t >= knots[i].at) mx = knots[i].x + (knots[i + 1].x - knots[i].x) * ease.inOutCubic(lin(t, knots[i].at, Math.max(0.2, (knots[i + 1].at - knots[i].at) * 0.8)));
  if (t >= knots[knots.length - 1].at) mx = knots[knots.length - 1].x;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 190, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 10, color: K.orange, opacity: ease.outCubic(lin(t, S, 0.3)) }}>{label}</div>
      {Array.from({ length: count }, (_, i) => {
        const p = ease.outBack(lin(t, S + i * 0.08, 0.35)), at_i = at + i * gap, scanned = t >= at_i + 0.12, hot = t >= at_i && t < at_i + gap;
        return (
          <div key={i} style={{ ...card, left: x0 + i * (W + G), top: y - 110, width: W, height: 220, borderRadius: 28, transform: `scale(${p * (hot ? 1.07 : 1)})`, opacity: clamp(p * 2, 0, 1), boxShadow: `0 0 0 ${scanned ? 5 : 0}px ${K.orange}, 0 24px 50px -22px rgba(40,30,10,0.4)` }}>
            <div style={{ position: 'absolute', left: 22, top: 22, width: 64, height: 64, borderRadius: 18, background: '#EFEAE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={icons[i % icons.length]} size={36} color="#7A7364" sw={2.4} /></div>
            {[0.78, 0.55, 0.66].map((w, k) => <div key={k} style={{ position: 'absolute', left: 22, top: 112 + k * 30, width: (W - 44) * w, height: 14, borderRadius: 7, background: scanned && k === 0 ? K.orange : '#E4DED2' }} />)}
            {scanned && <div style={{ position: 'absolute', right: -14, top: -14, width: 46, height: 46, borderRadius: 99, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ease.outBack(lin(t, at_i + 0.12, 0.25))})` }}><Ic n="check" size={26} color="#fff" sw={3.4} /></div>}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: mx - 70, top: y + 50 + Math.sin(t * 7) * 6, opacity: ease.outCubic(lin(t, S + 0.2, 0.3)) }}>
        <svg width={140} height={140} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)" stroke={K.navy} strokeWidth={2.4} strokeLinecap="round" style={{ filter: 'drop-shadow(0 10px 14px rgba(15,23,42,0.3))' }}><circle cx={11} cy={11} r={7} /><path d="m21 21-4.3-4.3" strokeWidth={3.2} stroke={K.orange} /></svg>
      </div>
    </div>
  );
};

// ── B · terminal (code/command lines, typed) ─────────────────────────────────────────────
export type TerminalProps = { title?: string; lines: { text: string; at: number; tone?: 'cmd' | 'out' | 'ok' }[]; y?: number; h?: number };
export const Terminal: React.FC<Base & TerminalProps> = ({ t, S, E, title = 'zsh', lines, y = 540, h = 420 }) => {
  const pin = ease.outBack(lin(t, S, 0.4)), o = fade(t, S, E, 0.2);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 80, top: y, width: 920, height: h, borderRadius: 26, background: '#14171C', overflow: 'hidden', transform: `scale(${0.92 + 0.08 * pin})`, boxShadow: '0 34px 70px -26px rgba(0,0,0,0.6), 0 0 60px -10px rgba(234,88,12,0.3)' }}>
        <div style={{ height: 56, background: '#1F242C', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 99, background: c }} />)}<div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 24, color: '#9AA6B6' }}>{title}</div></div>
        <div style={{ padding: '26px 34px', fontFamily: MONO, fontSize: 38, lineHeight: 1.5, color: '#E6EDF5' }}>
          {lines.map((l, i) => {
            const n = l.tone === 'cmd' || !l.tone ? Math.floor(clamp((t - l.at) * 34, 0, l.text.length)) : t >= l.at ? l.text.length : 0;
            if (t < l.at) return null;
            const col = l.tone === 'ok' ? '#4ADE80' : l.tone === 'out' ? '#E6EDF5' : '#FFB27A';
            return <div key={i} style={{ whiteSpace: 'pre', color: col }}>{(l.tone ?? 'cmd') === 'cmd' ? '$ ' : ''}{l.text.slice(0, n)}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

// ── B · answer (Claude's real reply, revealed word by word, with the skill chip) ──────────
export type AnswerProps = { skill: string; question: string; bullets: string[]; at: number; cps?: number; y?: number };
export const Answer: React.FC<Base & AnswerProps> = ({ t, S, E, skill, question, bullets, at, cps = 26, y = 510 }) => {
  const pin = ease.outBack(lin(t, S, 0.4)), o = fade(t, S, E, 0.2);
  const all = bullets.join('\n'); const n = Math.floor(clamp((t - at) * cps, 0, all.length));
  const shown = all.slice(0, n).split('\n');
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ ...card, left: 60, top: y, width: 960, height: 490, borderRadius: 30, transform: `scale(${0.93 + 0.07 * pin})`, overflow: 'hidden', boxShadow: '0 34px 70px -26px rgba(40,30,10,0.5), 0 0 60px -10px rgba(234,88,12,0.3)' }}>
        <div style={{ padding: '18px 30px 16px', borderBottom: '1px solid #EDE7DB' }}>
          <div style={{ display: 'inline-block', background: K.orange, color: '#fff', borderRadius: 99, padding: '5px 18px', fontFamily: MONO, fontSize: 21, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>/{skill}</div>
          <div style={{ marginTop: 10, fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: -0.5, color: K.ink, whiteSpace: 'nowrap' }}>{question}</div>
        </div>
        <div style={{ padding: '22px 32px' }}>
          {shown.map((l, i) => <div key={i} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 36, lineHeight: 1.3, color: K.ink, marginBottom: 14 }}>{l}</div>)}
        </div>
      </div>
    </div>
  );
};

const none = (): SfxCue[] => [];
export const FX_STACK = {
  terminal: { C: Terminal, sfx: none, frame: true },
  answer: { C: Answer, sfx: none, frame: true },
  headline: { C: Headline, sfx: none, frame: true },
  winShot: { C: WinShot, sfx: none, frame: true },
  promptBox: { C: PromptBox, sfx: none, frame: true },
  toolGrid: { C: ToolGrid, sfx: none, frame: true },
  stat: { C: Stat, sfx: none, frame: true },
  fork: { C: Fork, sfx: none, frame: true },
  rivals: { C: Rivals, sfx: none, frame: true },
};

// ── background + presenter pop-out (used by KitVideo when spec.captions === 'stack') ─────
export const StackBackground: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <div style={{ position: 'absolute', inset: 0, background: K.bg }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${K.dot} 2.2px, transparent 2.6px)`, backgroundSize: '46px 46px', backgroundPosition: `${t * 3}px ${t * 6}px` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 460, background: `linear-gradient(to bottom, ${K.top}, rgba(0,0,0,0))` }} />
  </div>
);

/** Your cut-out drawn over the card, extended upward so your head pops out above the card edge (same alignment as the card video). */
export const StackCutout: React.FC<{ rect: { x: number; y: number; w: number; h: number; zoom: number; faceX: number; faceY?: number }; t: number; punches: number[]; src: string; face?: { x: number; y: number }; alpha: number; drift?: number }> = ({ rect, t, punches, src, face = { x: 0.53, y: 0.37 }, alpha, drift = 1 }) => {
  const SRC_W = 1880, SRC_H = 1080, POP = K.card.pop, { w, h } = rect;
  const s = Math.max(w / SRC_W, h / SRC_H) * rect.zoom, vw = SRC_W * s, vh = SRC_H * s;
  const left = clamp(w * rect.faceX - face.x * vw, w - vw, 0), top = clamp(h * (rect.faceY ?? 0.42) - face.y * vh, h - vh, 0);
  const punch = 1 + kick(t, punches, 0.08, 7);
  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y - POP, width: w, height: h + POP, overflow: 'hidden', opacity: alpha, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, top: POP, width: w, height: h, transform: `scale(${punch * drift})`, transformOrigin: `${face.x * 100}% ${face.y * 100}%` }}>
        <OffthreadVideo src={staticFile(src)} volume={0} transparent style={{ position: 'absolute', left, top, width: vw, height: vh, maxWidth: 'none' }} />
      </div>
    </div>
  );
};
