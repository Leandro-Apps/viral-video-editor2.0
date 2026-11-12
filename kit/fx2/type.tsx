// Family "type" (kinetic typography), clean-room implementation.
// Every element is a pure function of `t` (seconds). No state, no timers, no randomness (seeded hash only).
// Colours come from the STACK theme (read at render time), fonts from tokens.
import React from 'react';
import { Img, Loop, OffthreadVideo, staticFile } from 'remotion';
import { FONT, MONO } from '../tokens';
import { clamp, ease, lin } from '../motion';
import { STACK as K } from '../stack';
import { BrandLogo } from '../real';
import type { SfxCue } from '../Stage';

// ── shared types ─────────────────────────────────────────────────────────────────────────
export type TWord = { w: string; s: number; e: number };
export type Move = 'slam' | 'drop' | 'left' | 'right' | 'zoom' | 'stretch' | 'spin';
export type Mark = 'highlight' | 'underline' | 'circle' | 'burst' | 'cross';
type Base = { t: number; S: number; E: number; skin?: string; format?: string; onDark?: boolean };
type Box = { x0: number; y0: number; x1: number; y1: number };

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const ink = (onDark?: boolean) => (onDark ? '#FFFFFF' : K.ink);
const fade = (t: number, S: number, E: number, o = 0.22) => ease.outCubic(lin(t, S, o)) * (1 - ease.inCubic(lin(t, E - o, o)));
/** deterministic hash in [0,1) */
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const frac = (x: number) => x - Math.floor(x);
/** damped spring 0 -> 1 with overshoot, x in seconds */
const spring = (x: number) => (x <= 0 ? 0 : 1 - Math.exp(-7 * x) * Math.cos(15 * x));
const none = (): SfxCue[] => [];
const centered = (y: number, h: number, w = 960): Box => ({ x0: 540 - w / 2, x1: 540 + w / 2, y0: y - h / 2, y1: y + h / 2 });
const strip = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const lineBox = (y: number, extra = 0): React.CSSProperties => ({ position: 'absolute', left: 0, right: 0, top: y + extra, display: 'flex', justifyContent: 'center' });
const cursor = (t: number, color: string, h: number, solid = false): React.ReactNode => (
  <span style={{ display: 'inline-block', width: Math.max(5, h * 0.07), height: h, background: color, marginLeft: 6, verticalAlign: 'middle', opacity: solid || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0, borderRadius: 3 }} />
);
const panel = (extra: React.CSSProperties = {}): React.CSSProperties => ({ background: K.panel, border: `1px solid ${K.dot}`, boxShadow: '0 28px 60px -26px rgba(20,14,4,0.38), 0 2px 8px rgba(20,14,4,0.06)', boxSizing: 'border-box', ...extra });

// ═════════════════════════════════════════════════════════════════════════════════════════
// 1 · kineticBeats
// ═════════════════════════════════════════════════════════════════════════════════════════
export type KineticProps = { beats: { text: string; at: number; move?: Move; accent?: boolean }[]; y?: number; size?: number; pill?: boolean };
const MOVES: Move[] = ['slam', 'drop', 'left', 'zoom', 'stretch', 'right', 'spin'];

const moveStyle = (m: Move, t: number, at: number): React.CSSProperties => {
  const p = lin(t, at, 0.38), o = ease.outBack(p), c = ease.outCubic(p);
  const op = clamp(p * 4, 0, 1);
  switch (m) {
    case 'slam': return { opacity: op, transform: `scale(${2.6 - 1.6 * o})` };
    case 'drop': return { opacity: op, transform: `translateY(${(o - 1) * 420}px)` };
    case 'left': return { opacity: op, transform: `translateX(${(c - 1) * 700}px)` };
    case 'right': return { opacity: op, transform: `translateX(${(1 - c) * 700}px)` };
    case 'zoom': return { opacity: op, transform: `scale(${0.1 + 0.9 * o})`, filter: `blur(${(1 - c) * 14}px)` };
    case 'stretch': return { opacity: op, transform: `scale(${0.35 + 0.65 * c}, ${2.2 - 1.2 * o})` };
    case 'spin': return { opacity: op, transform: `rotate(${(1 - o) * -200}deg) scale(${0.3 + 0.7 * o})` };
  }
};

export const KineticBeats: React.FC<Base & KineticProps> = ({ t, S, E, onDark, beats, y = 900, size = 150, pill = true }) => {
  const list = beats ?? [];
  let idx = -1;
  list.forEach((b, i) => { if (t >= b.at) idx = i; });
  const o = fade(t, S, E, 0.2);
  if (idx < 0) return <div style={{ position: 'absolute', inset: 0, opacity: o }} />;
  const b = list[idx];
  const last = idx === list.length - 1;
  const move = b.move ?? MOVES[idx % MOVES.length];
  const fs = clamp(960 / (Math.max(1, b.text.length) * 0.62), 54, size);
  const asPill = last && pill;
  const since = t - b.at;
  const impact = asPill ? Math.exp(-since * 9) * Math.sin(since * 40) : 0;
  const ring = asPill ? lin(t, b.at + 0.1, 0.55) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ ...lineBox(y - fs * 0.75), height: fs * 1.5, alignItems: 'center' }}>
        <div style={{ position: 'relative', ...moveStyle(move, t, b.at), transformOrigin: '50% 50%' }}>
          {asPill && ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 999, border: `${6 * (1 - ring) + 1}px solid ${K.orange}`, transform: `scale(${1 + ring * 0.5}, ${1 + ring * 0.9})`, opacity: 1 - ring }} />}
          <div style={{
            fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.03, lineHeight: 1.1, whiteSpace: 'nowrap',
            color: asPill ? '#fff' : b.accent ? K.orange : ink(onDark),
            background: asPill ? K.orange : 'transparent', borderRadius: 999, padding: asPill ? `${fs * 0.04}px ${fs * 0.42}px ${fs * 0.12}px` : 0,
            boxShadow: asPill ? '0 24px 50px -16px rgba(234,88,12,0.65)' : 'none',
            transform: `translateX(${impact * 10}px) scale(${1 + Math.abs(impact) * 0.03})`,
          }}>{b.text}</div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 2 · typewriter
// ═════════════════════════════════════════════════════════════════════════════════════════
export type TypewriterProps = {
  text: string; at: number; cps?: number; y?: number;
  edit?: { at: number; back: number; retype: string };
  collapseAt?: number; payoff?: { text?: string; slug?: string };
};
const DEL_CPS = 32;
export const Typewriter: React.FC<Base & TypewriterProps> = ({ t, S, E, onDark, text, at, cps = 15, y = 760, edit, collapseAt, payoff }) => {
  const n = text.length;
  const typed = clamp(Math.floor((t - at) * cps), 0, n);
  let base = text.slice(0, typed), extra = '';
  if (edit && t >= edit.at) {
    const keepN = Math.max(0, n - edit.back);
    const del = clamp(Math.floor((t - edit.at) * DEL_CPS), 0, edit.back);
    base = text.slice(0, n - del);
    const delDone = edit.at + edit.back / DEL_CPS + 0.25;
    if (t >= delDone) extra = edit.retype.slice(0, clamp(Math.floor((t - delDone) * cps), 0, edit.retype.length));
    if (base.length < keepN) base = text.slice(0, keepN);
  }
  const typing = !edit ? typed < n : false;
  const col = ink(onDark);
  const full = base + extra;
  const fs = clamp(900 / (Math.max(10, full.length, text.length) * 0.58), 36, 58);
  const o = fade(t, S, E, 0.22);
  const cp = collapseAt != null ? ease.inOutCubic(lin(t, collapseAt, 0.55)) : 0;
  const popP = collapseAt != null ? ease.outBack(lin(t, collapseAt + 0.6, 0.5)) : 0;
  const inP = ease.outBack(lin(t, at - 0.25, 0.4));
  const fieldW = 960 - (960 - 44) * cp;
  const fieldH = 150 - (150 - 44) * cp;
  const dotHold = cp > 0 && popP < 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ ...lineBox(y - 75), alignItems: 'center', height: 150 }}>
        {popP < 0.98 && (
          <div style={{ ...panel({ borderRadius: 999 - 960 * 0 + (cp > 0 ? 0 : 0) }), width: fieldW, height: fieldH, borderRadius: cp > 0.5 ? 99 : 40 + 40 * cp, display: 'flex', alignItems: 'center', padding: cp > 0 ? 0 : '0 40px', transform: `scale(${(0.9 + 0.1 * clamp(inP, 0, 1.05)) * (1 - 0.95 * popP)})`, opacity: clamp(inP * 2, 0, 1) * (1 - popP), overflow: 'hidden', background: dotHold ? K.orange : K.panel }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: fs, color: col, whiteSpace: 'pre', opacity: 1 - cp * 2 > 0 ? 1 - cp * 2 : 0, letterSpacing: -0.5 }}>
              {base}<span style={{ color: K.orange }}>{extra}</span>
              {cp < 0.3 && cursor(t, (extra || (edit && t >= edit.at)) ? K.orange : col, fs * 1.05, typing || (t - at) * cps < n + 2)}
            </div>
          </div>
        )}
        {cp > 0 && popP > 0 && (
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 28, transform: `scale(${popP})`, opacity: clamp(popP * 2, 0, 1) }}>
            {payoff?.slug && <BrandLogo slug={payoff.slug} size={150} />}
            {(payoff?.text ?? (payoff?.slug ? '' : '')) && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: -3, color: K.orange, whiteSpace: 'nowrap' }}>{payoff?.text}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 3 · decode
// ═════════════════════════════════════════════════════════════════════════════════════════
export type DecodeProps = { text: string; at: number; stagger?: number; dur?: number; y?: number; size?: number; sub?: string; tiles?: boolean };
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@%&*+=<>/\\|?';
export const Decode: React.FC<Base & DecodeProps> = ({ t, S, E, onDark, text, at, stagger = 0.08, dur = 0.7, y = 760, size = 130, sub, tiles = true }) => {
  const chars = Array.from(text);
  const n = chars.length;
  const tw = Math.min(size * 0.86, 960 / Math.max(1, n) - 8);
  const th = tw * 1.32;
  const fs = tw * 1.0;
  const lockAt = (i: number) => at + i * stagger + dur;
  const allLocked = at + (n - 1) * stagger + dur;
  const o = fade(t, S, E, 0.2);
  const subP = ease.outCubic(lin(t, allLocked + 0.1, 0.4));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ ...lineBox(y - th / 2), gap: 8, perspective: 900 }}>
        {chars.map((ch, i) => {
          const st = at + i * stagger;
          const p = lin(t, st, 0.35);
          const lk = t >= lockAt(i);
          const frame = Math.floor((t - st) * 20);
          const shown = ch === ' ' ? ' ' : lk ? ch : GLYPHS[Math.floor(hash(i * 31 + frame * 7) * GLYPHS.length)];
          const flash = lk ? 1 - lin(t, lockAt(i), 0.35) : 1;
          const rot = (1 - ease.outCubic(p)) * -95;
          const w = ch === ' ' ? tw * 0.45 : tw;
          return (
            <div key={i} style={{ width: w, height: th, opacity: clamp(p * 3, 0, 1), transform: `rotateX(${rot}deg)`, transformOrigin: '50% 100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tiles && ch !== ' ' ? K.navy : 'transparent', borderRadius: tw * 0.16,
              boxShadow: tiles && ch !== ' ' ? `0 12px 24px -10px rgba(20,14,4,0.5)${flash > 0.05 ? `, 0 0 ${28 * flash}px ${K.orange}` : ''}` : 'none',
              borderBottom: tiles && ch !== ' ' ? '3px solid rgba(0,0,0,0.25)' : 'none' }}>
              <span style={{ fontFamily: tiles ? MONO : FONT, fontWeight: 900, fontSize: fs * (tiles ? 0.8 : 1), color: !lk ? K.orange : flash > 0.4 ? K.orange : tiles ? '#fff' : ink(onDark), textShadow: !lk ? `0 0 14px ${K.orange}` : 'none', lineHeight: 1 }}>{String(shown)}</span>
            </div>
          );
        })}
      </div>
      {sub && <div style={{ ...lineBox(y + th / 2 + 36), fontFamily: FONT, fontWeight: 700, fontSize: 48, letterSpacing: 4, textTransform: 'uppercase', color: K.orange, opacity: subP, transform: `translateY(${(1 - subP) * 16}px)` }}>{sub}</div>}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 4 · gradientSweep
// ═════════════════════════════════════════════════════════════════════════════════════════
export type GradientProps = { text: string; at: number; y?: number; size?: number; speed?: number; colors?: [string, string]; sub?: string };
export const GradientSweep: React.FC<Base & GradientProps> = ({ t, S, E, onDark, text, at, y = 760, size = 190, speed = 0.6, colors, sub }) => {
  const [c0, c1] = colors ?? [K.orange, '#FFD9A8'];
  const lines = text.split('\n');
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fs = clamp(940 / (longest * 0.64), 60, size);
  const p = ease.outBack(lin(t, at, 0.5));
  const pos = 100 - 100 * frac(Math.max(0, t - at) * speed);
  const base = ink(onDark);
  const subP = ease.outCubic(lin(t, at + 0.6, 0.4));
  const h = lines.length * fs * 1.02;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      <div style={{ ...lineBox(y - h / 2), opacity: clamp(p * 2, 0, 1), transform: `scale(${0.92 + 0.08 * p})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fs, lineHeight: 1.02, letterSpacing: -fs * 0.035, textAlign: 'center', whiteSpace: 'pre',
          color: 'transparent', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text',
          backgroundImage: `linear-gradient(105deg, ${base} 0%, ${base} 38%, ${c0} 45%, ${c1} 50%, ${c0} 55%, ${base} 62%, ${base} 100%)`,
          backgroundSize: '300% 100%', backgroundPosition: `${pos}% 0`,
          filter: `drop-shadow(0 0 16px ${c0}66)` }}>{text}</div>
      </div>
      {sub && <div style={{ ...lineBox(y + h / 2 + 26), fontFamily: FONT, fontWeight: 700, fontSize: 48, color: onDark ? '#ffffffcc' : K.navy, opacity: subP }}>{sub}</div>}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 5 · discreteType (+ humanType helper)
// ═════════════════════════════════════════════════════════════════════════════════════════
export type DiscreteProps = { states: { t: number; text: string }[]; y?: number; chrome?: 'search' | 'chat' | 'none'; submitAt?: number };
/** Builds the whole-string states of a person typing: optional typo (noticed and fixed), a thinking pause, jitter. */
export const humanType = (text: string, start: number, o: { cps?: number; typoAt?: number; thinkAt?: number; think?: number } = {}): { t: number; text: string }[] => {
  const cps = o.cps ?? 9, think = o.think ?? 0.7;
  const out: { t: number; text: string }[] = [{ t: start, text: '' }];
  let time = start, cur = '';
  const step = (i: number) => (1 / cps) * (0.65 + hash(i + text.length) * 0.8);
  const wrong = (c: string) => { const row = 'qwertyuiopasdfghjklzxcvbnm'; const k = row.indexOf(c.toLowerCase()); return k < 0 ? c : row[(k + 1 + Math.floor(hash(k) * 3)) % row.length]; };
  for (let i = 0; i < text.length; i++) {
    if (o.thinkAt === i) time += think;
    if (o.typoAt === i && text[i] !== ' ') {
      const tail = text.slice(i + 1, i + 3);
      time += step(i); cur += wrong(text[i]); out.push({ t: time, text: cur });
      for (const ch of tail) { time += step(i + 1); cur += ch; out.push({ t: time, text: cur }); }
      time += 0.45; // notices
      for (let k = 0; k < tail.length + 1; k++) { time += 0.09; cur = cur.slice(0, -1); out.push({ t: time, text: cur }); }
      time += 0.12;
    }
    time += step(i); cur += text[i]; out.push({ t: time, text: cur });
  }
  return out;
};

export const DiscreteType: React.FC<Base & DiscreteProps> = ({ t, S, E, onDark, states: statesIn, y = 760, chrome = 'search', submitAt }) => {
  const states = Array.isArray(statesIn) ? statesIn : [];
  let cur = '', lastT = states?.[0]?.t ?? S;
  (states ?? []).forEach((s) => { if (t >= s.t) { cur = s.text; lastT = s.t; } });
  const started = states?.length ? t >= states[0].t - 0.3 : true;
  const o = fade(t, S, E, 0.22);
  const sub = submitAt != null ? ease.outCubic(lin(t, submitAt, 0.4)) : 0;
  const pulse = submitAt != null ? Math.exp(-Math.max(0, t - submitAt) * 8) : 0;
  const fs = clamp(880 / (Math.max(14, cur.length) * 0.56), 38, 58);
  const first = states?.[0]?.t ?? S;
  const inP = ease.outBack(lin(t, first - 0.3, 0.45));
  const col = ink(onDark);
  const isChat = chrome === 'chat', isSearch = chrome === 'search';
  const H = isChat ? 170 : 130;
  const field = (
    <div style={{ ...panel(), width: 960, height: H, borderRadius: isChat ? 44 : 999, display: 'flex', alignItems: 'center', gap: 22, padding: '0 36px', background: chrome === 'none' ? 'transparent' : K.panel, border: chrome === 'none' ? 'none' : `1px solid ${K.dot}`, boxShadow: chrome === 'none' ? 'none' : panel().boxShadow }}>
      {isSearch && <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={K.orange} strokeWidth={2.6} strokeLinecap="round"><circle cx={11} cy={11} r={7} /><path d="m21 21-4.3-4.3" /></svg>}
      <div style={{ flex: 1, fontFamily: FONT, fontWeight: 600, fontSize: fs, color: col, whiteSpace: 'pre', overflow: 'hidden', textAlign: chrome === 'none' ? 'center' : 'left', letterSpacing: -0.4 }}>
        {cur}{started && cursor(t, K.orange, fs * 1.05, t - lastT < 0.35)}
      </div>
      {isChat && <div style={{ width: 84, height: 84, borderRadius: 99, background: sub > 0 ? K.orange : K.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + pulse * 0.25})`, flexShrink: 0 }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div>}
      {isSearch && sub > 0 && <div style={{ width: 20, height: 20, borderRadius: 99, background: K.orange, transform: `scale(${1 + pulse * 1.2})`, opacity: 1 - sub * 0.3 }} />}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ ...lineBox(y - H / 2), opacity: clamp(inP * 2, 0, 1), transform: `scale(${0.92 + 0.08 * inP}) translateY(${-sub * 36}px)` }}>{field}</div>
      {sub > 0 && isSearch && [0, 1, 2].map((i) => { const p = ease.outCubic(lin(t, (submitAt ?? 0) + 0.15 + i * 0.12, 0.35)); return (
        <div key={i} style={{ ...lineBox(y + H / 2 - 20 + i * 92), opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
          <div style={{ ...panel({ borderRadius: 26 }), width: 880 - i * 70, height: 70, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, background: i === 0 ? K.orange : K.dot }} />
            <div style={{ height: 16, flex: 1, borderRadius: 8, background: K.dot }} />
          </div>
        </div>); })}
      {sub > 0 && isChat && (
        <div style={{ ...lineBox(y + H / 2 + 26), opacity: ease.outCubic(lin(t, (submitAt ?? 0) + 0.3, 0.3)) }}>
          <div style={{ ...panel({ borderRadius: 40 }), padding: '26px 40px', display: 'flex', gap: 14 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 22, height: 22, borderRadius: 99, background: K.orange, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 8 - i * 0.9)) }} />)}
          </div>
        </div>)}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 6 · anchorCycle
// ═════════════════════════════════════════════════════════════════════════════════════════
export type AnchorProps = { lead: string; options: string[]; at: number; cycleAt: number; step?: number; accel?: number; final?: string; y?: number; size?: number };
/** times at which the carousel advances; interval shrinks by `accel` each step until it is too fast to read */
const cycleTimes = (start: number, step: number, accel: number) => {
  const out: number[] = [];
  let time = start, iv = step;
  for (let k = 0; k < 60 && iv > 0.07; k++) { out.push(time); time += iv; iv *= accel; }
  return { times: out, end: time };
};
export const AnchorCycle: React.FC<Base & AnchorProps> = ({ t, S, E, onDark, lead, options, at, cycleAt, step = 0.34, accel = 0.86, final, y = 760, size = 120 }) => {
  const opts = options?.length ? options : [''];
  const { times, end } = cycleTimes(cycleAt, step, accel);
  const k = times.filter((x) => t >= x).length; // 0 = first option still
  const idx = k % opts.length;
  const prev = (idx + opts.length - 1) % opts.length;
  const lastIv = times.length > 1 ? times[times.length - 1] - times[times.length - 2] : step;
  const prog = k > 0 ? clamp((t - times[k - 1]) / Math.min(step, Math.max(0.06, lastIv)), 0, 1) : 1;
  const landed = t >= end;
  const finalText = final ?? opts[(times.length) % opts.length];
  const fsLead = size * 0.62;
  const fsOpt = size;
  const winH = fsOpt * 1.35;
  const inP = ease.outCubic(lin(t, at, 0.4));
  const pill = ease.outBack(lin(t, end, 0.45));
  const fsFinal = clamp(900 / (finalText.length * 0.6 + 2), 50, fsOpt);
  const col = ink(onDark);
  const optStyle: React.CSSProperties = { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fsOpt, letterSpacing: -fsOpt * 0.03, lineHeight: `${winH}px`, color: K.orange, whiteSpace: 'nowrap' };
  const blur = landed ? 0 : (1 - prog) * 3 + clamp((0.3 - lastIv) * 6, 0, 3);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      <div style={{ ...lineBox(y - fsLead * 1.4 - winH / 2 + 10), fontFamily: FONT, fontWeight: 800, fontSize: fsLead, letterSpacing: -1, color: col, opacity: inP, transform: `translateY(${(1 - inP) * 24}px)`, whiteSpace: 'nowrap' }}>{lead}</div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: y - winH / 2 + fsLead * 0.5, height: winH, overflow: 'hidden', opacity: inP, WebkitMaskImage: landed ? undefined : 'linear-gradient(transparent 0%, #000 22%, #000 78%, transparent 100%)' }}>
        {!landed && (
          <>
            {k > 0 && <div style={{ ...optStyle, transform: `translateY(${-prog * winH}px)`, opacity: 1 - prog, filter: `blur(${blur}px)` }}>{opts[prev]}</div>}
            <div style={{ ...optStyle, transform: `translateY(${(1 - prog) * winH}px)`, filter: `blur(${blur}px)` }}>{opts[idx]}</div>
          </>
        )}
      </div>
      {landed && (
        <div style={{ ...lineBox(y - fsFinal * 0.72 + fsLead * 0.5 - 0 ), height: fsFinal * 1.45 }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fsFinal, letterSpacing: -fsFinal * 0.03, color: '#fff', background: K.orange, borderRadius: 999, padding: `${fsFinal * 0.06}px ${fsFinal * 0.5}px ${fsFinal * 0.16}px`, whiteSpace: 'nowrap', transform: `scale(${0.6 + 0.4 * pill})`, opacity: clamp(pill * 3, 0, 1), boxShadow: '0 24px 50px -16px rgba(234,88,12,0.65)' }}>{finalText}</div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 7 · springTicker
// ═════════════════════════════════════════════════════════════════════════════════════════
export type TickerProps = { items: string[]; steps: number[]; at: number; lead?: string; y?: number; size?: number };
export const SpringTicker: React.FC<Base & TickerProps> = ({ t, S, E, onDark, items, steps, at, lead, y = 760, size = 170 }) => {
  const list = items?.length ? items : [''];
  const n = list.length;
  const pos = clamp((steps ?? []).reduce((a, s) => a + spring(t - s), 0), -0.4, n - 1 + 0.4);
  const rowH = size * 1.25;
  const winW = 780, winH = rowH * 1.1;
  const done = pos > n - 1.08;
  const inP = ease.outBack(lin(t, at, 0.45));
  const lastStep = steps?.length ? steps[steps.length - 1] : at;
  const glow = done ? 0.5 + 0.5 * Math.exp(-(t - lastStep) * 3) : 0;
  const fsLead = size * 0.34;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      {lead && <div style={{ ...lineBox(y - winH / 2 - fsLead * 1.8), fontFamily: FONT, fontWeight: 800, fontSize: fsLead, letterSpacing: 6, textTransform: 'uppercase', color: onDark ? '#ffffffcc' : K.navy, opacity: clamp(inP * 2, 0, 1) }}>{lead}</div>}
      <div style={{ ...lineBox(y - winH / 2), opacity: clamp(inP * 2, 0, 1), transform: `scale(${0.9 + 0.1 * inP})` }}>
        <div style={{ ...panel({ borderRadius: 44 }), width: winW, height: winH, position: 'relative', overflow: 'hidden', boxShadow: `${panel().boxShadow}${done ? `, 0 0 ${60 * glow}px ${K.orange}66` : ''}` }}>
          {list.map((it, i) => {
            const d = i - pos;
            if (Math.abs(d) > 1.6) return null;
            const isFinal = i === n - 1;
            const mix = isFinal ? clamp(1 - Math.abs(d), 0, 1) : 0;
            return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: winH / 2 - rowH / 2 + d * rowH, height: rowH, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: clamp(winW / (it.length * 0.62 + 1), 60, size), letterSpacing: -size * 0.03, color: mix > 0.5 ? K.orange : ink(onDark === true ? false : false), opacity: 1 - clamp(Math.abs(d) * 0.55, 0, 1), whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{it}</div>;
          })}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${K.panel} 0%, transparent 28%, transparent 72%, ${K.panel} 100%)`, pointerEvents: 'none' }} />
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 8 · tickerTakeover
// ═════════════════════════════════════════════════════════════════════════════════════════
export type TakeoverProps = { lead: string; options: string[]; at: number; cps?: number; ticks: number[]; heroAt: number; hero?: { text?: string; slug?: string }; y?: number };
export const TickerTakeover: React.FC<Base & TakeoverProps> = ({ t, S, E, onDark, lead, options, at, cps = 22, ticks, heroAt, hero, y = 760 }) => {
  const opts = options?.length ? options : [''];
  const typedN = clamp(Math.floor((t - at) * cps), 0, lead.length);
  const typedDone = at + lead.length / cps;
  const k = (ticks ?? []).filter((x) => t >= x).length;
  const prevK = Math.max(0, k - 1);
  const tickT = k > 0 ? ticks[k - 1] : typedDone;
  const prog = k > 0 ? ease.outCubic(lin(t, tickT, 0.22)) : 1;
  const optAppear = ease.outBack(lin(t, typedDone + 0.05, 0.35));
  const fsL = 82, fsO = 150, winH = fsO * 1.3;
  const out = ease.inCubic(lin(t, heroAt - 0.05, 0.28)); // old content pushed away
  const hp = ease.outBack(lin(t, heroAt + 0.05, 0.45));
  const since = t - heroAt;
  const shake = since > 0 && since < 0.3 ? Math.sin(since * 80) * 10 * (1 - since / 0.3) : 0;
  const col = ink(onDark);
  const heroText = hero?.text ?? 'WiseFunnel';
  const optStyle: React.CSSProperties = { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fsO, letterSpacing: -fsO * 0.03, lineHeight: `${winH}px`, color: K.orange, whiteSpace: 'nowrap' };
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-out * 520}px) scale(${1 - out * 0.15})`, opacity: 1 - out, filter: `blur(${out * 8}px)` }}>
        <div style={{ ...lineBox(y - winH / 2 - fsL * 1.2), fontFamily: FONT, fontWeight: 800, fontSize: fsL, letterSpacing: -1.5, color: col, whiteSpace: 'pre' }}>
          {lead.slice(0, typedN)}{typedN < lead.length && cursor(t, K.orange, fsL, true)}
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, top: y - winH / 2 + 10, height: winH, overflow: 'hidden', opacity: clamp(optAppear, 0, 1), transform: `scale(${0.85 + 0.15 * clamp(optAppear, 0, 1.1)})` }}>
          {k > 0 && prog < 1 && <div style={{ ...optStyle, transform: `translateY(${-prog * winH}px)`, opacity: 1 - prog }}>{opts[(prevK) % opts.length]}</div>}
          <div style={{ ...optStyle, transform: `translateY(${k > 0 ? (1 - prog) * winH : 0}px)` }}>{opts[k % opts.length]}</div>
        </div>
      </div>
      {t >= heroAt && (
        <div style={{ ...lineBox(y - 150), height: 300, alignItems: 'center', transform: `translateX(${shake}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, transform: `scale(${2.4 - 1.4 * hp})`, opacity: clamp(hp * 3, 0, 1) }}>
            {hero?.slug && <BrandLogo slug={hero.slug} size={170} />}
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: clamp(900 / (heroText.length * 0.6), 70, 150), letterSpacing: -4, color: '#fff', background: K.orange, borderRadius: 999, padding: '10px 54px 22px', whiteSpace: 'nowrap', boxShadow: '0 30px 60px -18px rgba(234,88,12,0.7)' }}>{heroText}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 9 · titleCard
// ═════════════════════════════════════════════════════════════════════════════════════════
export type TitleCardProps = { variant?: 'crossfade' | 'wipe'; title: string; sub?: string; at: number; subAt?: number; eyebrow?: string; slugs?: string[]; y?: number };
export const TitleCard: React.FC<Base & TitleCardProps> = ({ t, S, E, onDark, variant = 'crossfade', title, sub, at, subAt, eyebrow, slugs = [], y = 760 }) => {
  const col = ink(onDark);
  const sAt = subAt ?? at + 1.4;
  const o = fade(t, S, E, 0.25);
  if (variant === 'wipe') {
    const ts = slugs.length ? sAt : at; // wipe moment
    const w = ease.inOutCubic(lin(t, ts, 0.75));
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(slugs.length))));
    const rows = Math.ceil(slugs.length / cols);
    const cell = 200;
    const fs = clamp(860 / (title.length * 0.6 + 1), 54, 128);
    const pillIn = ease.outBack(lin(t, ts + 0.5, 0.45));
    const subP = ease.outCubic(lin(t, ts + 0.9, 0.4));
    return (
      <div style={{ position: 'absolute', inset: 0, opacity: o }}>
        {slugs.map((s, i) => {
          const cx = i % cols, cy = Math.floor(i / cols);
          const left = 540 - (cols * cell) / 2 + cx * cell + 6, top = y - (rows * cell) / 2 + cy * cell - 40;
          const pIn = ease.outBack(lin(t, at + i * 0.08, 0.4));
          const gone = lin(t, ts + 0.1 + (cx / cols) * 0.25, 0.3);
          return <div key={s + i} style={{ position: 'absolute', left, top, opacity: clamp(pIn * 2, 0, 1) * (1 - gone), transform: `scale(${0.6 + 0.4 * pIn}) translateX(${gone * 120}px) rotate(${gone * 10}deg)` }}><BrandLogo slug={s} size={cell - 40} /></div>;
        })}
        {t >= ts && (
          <div style={{ position: 'absolute', left: 0, top: y - 190, width: 1080, height: 380, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: -700 + w * 700 + 0, top: 80, width: 1800, height: 190, borderRadius: 999, background: K.orange, transform: `rotate(${-14 * (1 - w)}deg)`, boxShadow: '0 30px 60px -20px rgba(234,88,12,0.6)', opacity: 1 - lin(t, ts + 0.6, 0.2) * 0 }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 80, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.035, color: '#fff', whiteSpace: 'nowrap', opacity: clamp(pillIn * 2, 0, 1), transform: `scale(${0.85 + 0.15 * pillIn})` }}>{title}</div>
          </div>
        )}
        {sub && t >= ts && <div style={{ ...lineBox(y + 130), fontFamily: FONT, fontWeight: 700, fontSize: 56, color: col, opacity: subP, transform: `translateY(${(1 - subP) * 18}px)`, textAlign: 'center' }}>{sub}</div>}
      </div>
    );
  }
  // crossfade
  const tIn = ease.outCubic(lin(t, at, 0.55));
  const tOut = sub ? ease.inCubic(lin(t, sAt - 0.15, 0.4)) : 0;
  const sIn = ease.outCubic(lin(t, sAt + 0.1, 0.55));
  const fs = clamp(960 / (Math.max(title.length, sub?.length ?? 0) * 0.55), 56, 140);
  const eP = ease.outCubic(lin(t, at, 0.4));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {eyebrow && <div style={{ ...lineBox(y - fs * 1.15 - 56), fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 9, textTransform: 'uppercase', color: K.orange, opacity: eP * (1 - (tOut > 0.5 ? 0.3 : 0)) }}>{eyebrow}</div>}
      <div style={{ ...lineBox(y - fs * 0.6), height: fs * 1.3, padding: '0 40px', boxSizing: 'border-box', fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.035, color: col, textAlign: 'center', whiteSpace: 'nowrap', opacity: tIn * (1 - tOut), transform: `translateY(${(1 - tIn) * 50 - tOut * 60}px)`, filter: `blur(${tOut * 10}px)` }}>{title}</div>
      {sub && <div style={{ ...lineBox(y - fs * 0.6), height: fs * 1.3, padding: '0 40px', boxSizing: 'border-box', fontFamily: K.serif, fontStyle: 'italic', fontWeight: 400, fontSize: fs * 1.05, letterSpacing: -fs * 0.02, color: K.orange, textAlign: 'center', whiteSpace: 'nowrap', opacity: sIn, transform: `translateY(${(1 - sIn) * 50}px)`, filter: `blur(${(1 - sIn) * 10}px)` }}>{sub}</div>}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 10 · videoText
// ═════════════════════════════════════════════════════════════════════════════════════════
export type VideoTextProps = { src?: string; word: string; at: number; statAt: number; wordAt: number; stat?: { value: string; label: string }; pill?: string; y?: number; loopFrames?: number };
const VideoLayer: React.FC<{ src?: string; w: number; h: number; t: number; loopFrames?: number }> = ({ src, w, h, t, loopFrames }) => {
  if (!src) {
    const a = 100 + t * 40;
    return <div style={{ width: w, height: h, background: `linear-gradient(${a}deg, ${K.orange}, ${K.navy} 55%, ${K.orange})` }} />;
  }
  const url = /^https?:/.test(src) ? src : staticFile(src);
  const v = <OffthreadVideo src={url} muted style={{ width: w, height: h, objectFit: 'cover' }} />;
  return <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}>{loopFrames ? <Loop durationInFrames={loopFrames}>{v}</Loop> : v}</div>;
};
export const VideoText: React.FC<Base & VideoTextProps> = ({ t, S, E, onDark, src, word, at, statAt, wordAt, stat, pill, y = 760, loopFrames }) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const o = fade(t, S, E, 0.25);
  const cardIn = ease.outBack(lin(t, at, 0.5));
  const slide = ease.inOutCubic(lin(t, statAt, 0.55));
  const cardOut = ease.inCubic(lin(t, wordAt - 0.1, 0.3));
  const statIn = ease.outBack(lin(t, statAt + 0.25, 0.45));
  const wp = ease.outBack(lin(t, wordAt, 0.55));
  const pillIn = ease.outBack(lin(t, wordAt + 0.7, 0.45));
  const cw = 760, ch = 430;
  const cw2 = cw - 280 * slide, ch2 = ch - 160 * slide;
  const cardX = 540 - cw2 / 2 - 300 * slide + (stat ? 0 : 300 * slide);
  const fs = clamp(960 / (word.length * 0.66), 120, 330);
  const textW = 1000, textH = fs * 1.2;
  const showWord = t >= wordAt - 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {!showWord || cardOut < 1 ? (
        <>
          <div style={{ position: 'absolute', left: cardX, top: y - ch2 / 2, width: cw2, height: ch2, borderRadius: 40, overflow: 'hidden', opacity: clamp(cardIn * 2, 0, 1) * (1 - cardOut), transform: `scale(${(0.8 + 0.2 * cardIn) * (1 - cardOut * 0.12)})`, boxShadow: '0 34px 70px -26px rgba(20,14,4,0.55)', border: '6px solid #fff', boxSizing: 'border-box' }}>
            <VideoLayer src={src} w={cw2} h={ch2} t={t} loopFrames={loopFrames} />
          </div>
          {stat && slide > 0 && (
            <div style={{ position: 'absolute', left: 540 + 40, top: y - 110, width: 440, opacity: clamp(statIn * 2, 0, 1) * (1 - cardOut), transform: `translateX(${(1 - statIn) * 60}px)` }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: clamp(440 / (stat.value.length * 0.62), 60, 150), letterSpacing: -4, color: K.orange, lineHeight: 1, whiteSpace: 'nowrap' }}>{stat.value}</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: ink(onDark), marginTop: 10, letterSpacing: -0.5 }}>{stat.label}</div>
            </div>
          )}
        </>
      ) : null}
      {showWord && (
        <div style={{ position: 'absolute', left: 540 - textW / 2, top: y - textH / 2, width: textW, height: textH, opacity: clamp(wp * 2, 0, 1), transform: `scale(${0.7 + 0.3 * wp})` }}>
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <defs><clipPath id={`vt${uid}`}><text x={textW / 2} y={textH * 0.82} textAnchor="middle" style={{ fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.03 }}>{word}</text></clipPath></defs>
          </svg>
          <div style={{ width: textW, height: textH, clipPath: `url(#vt${uid})`, WebkitClipPath: `url(#vt${uid})` }}>
            <VideoLayer src={src} w={textW} h={textH} t={t} loopFrames={loopFrames} />
          </div>
        </div>
      )}
      {pill && showWord && (
        <div style={{ ...lineBox(y + textH / 2 + 20), transform: `scale(${0.6 + 0.4 * pillIn})`, opacity: clamp(pillIn * 2, 0, 1) }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: '#fff', background: `linear-gradient(100deg, ${K.orange}, ${K.navy})`, borderRadius: 999, padding: '12px 48px 18px', whiteSpace: 'nowrap', boxShadow: '0 24px 50px -18px rgba(20,14,4,0.5)' }}>{pill}</div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// word-flow helper (keywordGlow)
// ═════════════════════════════════════════════════════════════════════════════════════════
const flowLines = (n: number[], perLine: number) => {
  const lines: number[][] = [[]];
  let w = 0;
  n.forEach((len, i) => { if (w + len > perLine && lines[lines.length - 1].length) { lines.push([]); w = 0; } lines[lines.length - 1].push(i); w += len + 0.6; });
  return lines.length;
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 11 · keywordGlow
// ═════════════════════════════════════════════════════════════════════════════════════════
export type GlowProps = { words: TWord[]; keywords?: string[]; y?: number; size?: number };
export const KeywordGlow: React.FC<Base & GlowProps> = ({ t, S, E, onDark, words, keywords = [], y = 760, size = 96 }) => {
  const ws = words ?? [];
  const keys = new Set(keywords.map(strip));
  const lines = flowLines(ws.map((w) => w.w.length), 940 / (size * 0.56));
  const h = lines * size * 1.3;
  const col = ink(onDark);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      <div style={{ position: 'absolute', left: 50, right: 50, top: y - h / 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${size * 0.1}px ${size * 0.28}px`, alignItems: 'center' }}>
        {ws.map((w, i) => {
          const key = keys.has(strip(w.w));
          const lit = ease.outCubic(lin(t, w.s, 0.14));
          const pulse = t >= w.s && t <= w.e + 0.1 ? ease.outBack(lin(t, w.s, 0.2)) : t > w.e ? 1 - 0.08 * Math.exp(-(t - w.e) * 6) * 0 : 0;
          const grow = t >= w.s ? 1 + 0.12 * (t <= w.e + 0.1 ? Math.min(1, pulse) : Math.max(0, 1 - lin(t, w.e + 0.1, 0.25))) : 1;
          const c = key ? K.orange : col;
          return <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03, lineHeight: 1.1, color: c, opacity: 0.2 + 0.8 * lit, display: 'inline-block', transform: `scale(${grow})`, textShadow: key && lit > 0.5 ? `0 0 ${34 * lit}px ${K.orange}99, 0 0 ${12 * lit}px ${K.orange}88` : 'none' }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 12 · marker
// ═════════════════════════════════════════════════════════════════════════════════════════
export type MarkerProps = { parts: ({ text: string } | { text: string; mark: Mark; at: number; color?: string })[]; y?: number; size?: number };
const MarkSvg: React.FC<{ mark: Mark; p: number; color: string; size: number; seed: number }> = ({ mark, p, color, size, seed }) => {
  const sw = Math.max(5, size * 0.07);
  const common = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const, pathLength: 1 };
  const dash = (q: number) => ({ strokeDasharray: 1, strokeDashoffset: 1 - clamp(q, 0, 1) });
  if (mark === 'highlight') {
    return <div style={{ position: 'absolute', left: -8, right: -8, top: '18%', bottom: '4%', background: color, opacity: 0.45, borderRadius: 8, transformOrigin: '0 50%', transform: `scaleX(${ease.outCubic(p)}) skewX(-4deg)`, zIndex: -1 }} />;
  }
  if (mark === 'underline') {
    const j = 4 + hash(seed) * 3;
    let d = 'M0,12';
    for (let i = 1; i <= 8; i++) d += ` Q${(i - 0.5) * 12.5},${i % 2 ? 2 : 22} ${i * 12.5},12`;
    return <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: -size * 0.2, width: '100%', height: size * 0.28, overflow: 'visible', transform: `rotate(${-j * 0.2}deg)` }}><path d={d} {...common} {...dash(ease.inOutCubic(p))} /></svg>;
  }
  if (mark === 'circle') {
    const d = 'M52,6 C86,2 98,22 90,40 C80,60 30,64 10,48 C-4,34 8,10 40,5 C56,3 66,6 72,9';
    return <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ position: 'absolute', left: -size * 0.3, right: -size * 0.3, top: -size * 0.2, bottom: -size * 0.15, width: `calc(100% + ${size * 0.6}px)`, height: `calc(100% + ${size * 0.35}px)`, overflow: 'visible' }}><path d={d} {...common} {...dash(ease.inOutCubic(p))} /></svg>;
  }
  if (mark === 'cross') {
    return <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: 'absolute', left: -6, right: -6, top: '10%', bottom: '0', width: 'calc(100% + 12px)', height: '90%', overflow: 'visible' }}>
      <path d="M2,4 L98,36" {...common} {...dash(p * 2)} /><path d="M98,4 L2,36" {...common} {...dash(p * 2 - 1)} /></svg>;
  }
  // burst: short strokes radiating from the top of the word
  const rays = [-62, -36, -12, 12, 36, 62];
  return <svg viewBox="-50 -30 100 30" style={{ position: 'absolute', left: '50%', top: -size * 0.1, width: size * 1.8, height: size * 0.54, transform: 'translate(-50%, -100%)', overflow: 'visible' }}>
    {rays.map((a, i) => { const r = (a * Math.PI) / 180; const q = clamp(p * 1.4 - i * 0.05, 0, 1); const r0 = 14, r1 = 14 + 14 * ease.outCubic(q); return <line key={i} x1={Math.sin(r) * r0} y1={-Math.cos(r) * r0} x2={Math.sin(r) * r1} y2={-Math.cos(r) * r1} stroke={color} strokeWidth={3.4} strokeLinecap="round" opacity={q > 0 ? 1 - lin(q, 0.8, 0.2) * 0 : 0} />; })}
  </svg>;
};
export const Marker: React.FC<Base & MarkerProps> = ({ t, S, E, onDark, parts, y = 760, size = 110 }) => {
  const list = parts ?? [];
  const total = list.reduce((a, p) => a + p.text.length + 1, 0);
  const lines = Math.max(1, Math.ceil((total * size * 0.56) / 920));
  const h = lines * size * 1.5;
  const inP = ease.outCubic(lin(t, S, 0.35));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: y - h / 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${size * 0.2}px ${size * 0.28}px`, opacity: inP, transform: `translateY(${(1 - inP) * 20}px)` }}>
        {list.map((p, i) => {
          const m = 'mark' in p ? p : null;
          const color = m ? m.color ?? (m.mark === 'cross' ? '#E15A36' : K.orange) : K.orange;
          const prog = m ? lin(t, m.at, m.mark === 'burst' ? 0.5 : 0.6) : 0;
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', isolation: 'isolate', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03, lineHeight: 1.15, color: ink(onDark), whiteSpace: 'nowrap', opacity: m && m.mark === 'cross' ? 1 - 0.45 * ease.outCubic(prog) : 1 }}>
              {p.text}
              {m && prog > 0 && <MarkSvg mark={m.mark} p={prog} color={color} size={size} seed={i * 17 + 3} />}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 13 · cineWords
// ═════════════════════════════════════════════════════════════════════════════════════════
export type CineProps = { words: TWord[]; keywords: string[]; negative?: string[]; y?: number; size?: number; keySize?: number };
export const CineWords: React.FC<Base & CineProps> = ({ t, S, E, onDark, words, keywords, negative = [], y = 1230, size = 120, keySize = 200 }) => {
  const ws = words ?? [];
  let idx = -1;
  ws.forEach((w, i) => { if (t >= w.s) idx = i; });
  if (idx < 0) return <div style={{ position: 'absolute', inset: 0 }} />;
  const w = ws[idx];
  const next = ws[idx + 1];
  const hold = next ? next.s : w.e + 0.15;
  if (t > hold + 0.05 && !next) return <div style={{ position: 'absolute', inset: 0 }} />;
  const key = new Set(keywords.map(strip)).has(strip(w.w));
  const neg = new Set(negative.map(strip)).has(strip(w.w));
  const p = lin(t, w.s, key ? 0.4 : 0.14), o = ease.outCubic(p);
  const out = next ? 0 : ease.inCubic(lin(t, w.e, 0.15));
  const col = ink(onDark);
  const base: React.CSSProperties = { position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)', opacity: o * (1 - out), whiteSpace: 'nowrap' };
  if (key) {
    const fs = clamp(960 / (w.w.length * 0.5), 90, keySize);
    return <div style={base}><div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 400, fontSize: fs, letterSpacing: -fs * 0.02, color: K.orange, filter: `blur(${(1 - o) * 22}px)`, transform: `scale(${1.25 - 0.25 * o})`, textShadow: `0 0 40px ${K.orange}66` }}>{w.w}</div></div>;
  }
  const fs = clamp(960 / (w.w.length * 0.62), 70, size);
  const shake = neg ? Math.sin((t - w.s) * 70) * 8 * Math.exp(-(t - w.s) * 7) : 0;
  return <div style={base}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.03, textTransform: 'uppercase', color: neg ? '#E5412A' : col, transform: `translateX(${shake}px) scale(${0.9 + 0.1 * o})`, textShadow: neg ? '0 0 30px rgba(229,65,42,0.45)' : '0 4px 18px rgba(0,0,0,0.18)' }}>{w.w}</div></div>;
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// 14 · messaging
// ═════════════════════════════════════════════════════════════════════════════════════════
export type MessagingProps = { phrases: { main: string; accent: string; hold?: number }[]; at: number; cps?: number; y?: number; size?: number };
export const Messaging: React.FC<Base & MessagingProps> = ({ t, S, E, onDark, phrases, at, cps = 18, y = 760, size = 84 }) => {
  const list = phrases ?? [];
  const lh = size * 1.55;
  // schedule: each phrase starts after the previous one finished typing + its hold
  const starts: number[] = [];
  let cur = at;
  list.forEach((p) => { starts.push(cur); cur += (p.main.length + p.accent.length) / cps + (p.hold ?? 0.55); });
  const h = list.length * lh;
  const col = ink(onDark);
  const longest = Math.max(1, ...list.map((p) => p.main.length + p.accent.length));
  const fs = clamp(880 / (longest * 0.55), 44, size);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E, 0.22) }}>
      {list.map((p, i) => {
        if (t < starts[i]) return null;
        const n = clamp(Math.floor((t - starts[i]) * cps), 0, p.main.length + p.accent.length);
        const m = p.main.slice(0, n), a = p.accent.slice(0, Math.max(0, n - p.main.length));
        const typing = n < p.main.length + p.accent.length;
        const isLast = !list.slice(i + 1).some((_, j) => t >= starts[i + 1 + j]);
        const inP = ease.outBack(lin(t, starts[i], 0.3));
        const inAccent = n > p.main.length;
        return (
          <div key={i} style={{ position: 'absolute', left: 80, right: 40, top: y - h / 2 + i * lh, height: lh, display: 'flex', alignItems: 'center', gap: 26, opacity: clamp(inP * 3, 0, 1) * (isLast ? 1 : 0.9), transform: `translateX(${(1 - Math.min(inP, 1)) * -40}px)` }}>
            <div style={{ width: fs * 0.3, height: fs * 0.3, borderRadius: 99, background: K.orange, flexShrink: 0, boxShadow: `0 0 18px ${K.orange}77` }} />
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: fs, letterSpacing: -fs * 0.03, color: col, whiteSpace: 'pre' }}>
              {m}<span style={{ color: K.orange }}>{a}</span>
              {(typing || isLast) && cursor(t, inAccent || (!p.main.length) ? K.orange : col, fs * 1.0, typing)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// registry
// ═════════════════════════════════════════════════════════════════════════════════════════
const lines = (s: string) => Math.max(1, s.split('\n').length);
export const FX_TYPE = {
  kineticBeats: { C: KineticBeats, sfx: none, box: (p: KineticProps): Box => centered(p.y ?? 900, (p.size ?? 150) * 2.2) },
  typewriter: { C: Typewriter, sfx: none, box: (p: TypewriterProps): Box => centered(p.y ?? 760, 220) },
  decode: { C: Decode, sfx: none, box: (p: DecodeProps): Box => ({ x0: 60, x1: 1020, y0: (p.y ?? 760) - (p.size ?? 130), y1: (p.y ?? 760) + (p.size ?? 130) + (p.sub ? 110 : 0) }) },
  gradientSweep: { C: GradientSweep, sfx: none, box: (p: GradientProps): Box => centered((p.y ?? 760) + (p.sub ? 40 : 0), lines(p.text) * (p.size ?? 190) * 1.1 + (p.sub ? 150 : 40)) },
  discreteType: { C: DiscreteType, sfx: none, box: (p: DiscreteProps): Box => ({ x0: 60, x1: 1020, y0: (p.y ?? 760) - 100, y1: (p.y ?? 760) + (p.submitAt != null ? 360 : 100) }) },
  anchorCycle: { C: AnchorCycle, sfx: none, box: (p: AnchorProps): Box => centered(p.y ?? 760, (p.size ?? 120) * 2.5) },
  springTicker: { C: SpringTicker, sfx: none, box: (p: TickerProps): Box => centered(p.y ?? 760, (p.size ?? 170) * 1.4 + (p.lead ? 140 : 40), 800) },
  tickerTakeover: { C: TickerTakeover, sfx: none, box: (p: TakeoverProps): Box => centered(p.y ?? 760, 430) },
  titleCard: { C: TitleCard, sfx: none, box: (p: TitleCardProps): Box => centered(p.y ?? 760, p.variant === 'wipe' ? 560 : 380) },
  videoText: { C: VideoText, sfx: none, box: (p: VideoTextProps): Box => centered(p.y ?? 760, p.pill ? 640 : 520) },
  keywordGlow: { C: KeywordGlow, sfx: none, box: (p: GlowProps): Box => { const sz = p.size ?? 96; const n = flowLines((p.words ?? []).map((w) => w.w.length), 940 / (sz * 0.56)); return centered(p.y ?? 760, n * sz * 1.3 + 30); } },
  marker: { C: Marker, sfx: none, box: (p: MarkerProps): Box => { const sz = p.size ?? 110; const tot = (p.parts ?? []).reduce((a, q) => a + q.text.length + 1, 0); return centered(p.y ?? 760, Math.max(1, Math.ceil((tot * sz * 0.56) / 920)) * sz * 1.5 + 80); } },
  cineWords: { C: CineWords, sfx: none },
  messaging: { C: Messaging, sfx: none, box: (p: MessagingProps): Box => centered(p.y ?? 760, (p.phrases?.length ?? 3) * (p.size ?? 84) * 1.55 + 20) },
};
