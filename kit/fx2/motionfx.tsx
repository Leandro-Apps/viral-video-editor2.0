// Family motionfx (clean-room rewrite) · 14 motion elements on the 1080x1920 canvas.
//   frame : cameraJourney, flight3d, overwhelm, themeMorph      (own the whole frame, opaque themed background)
//   box   : outward, particles, glitch, streak, glow, scaleSwap, press, displace, waterfall, expand
// Everything is a pure function of t (seconds). No state, timers, CSS animations or Math.random: variation comes from a seeded hash.
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { C, FONT, MONO } from '../tokens';
import { STACK as K } from '../stack';
import { clamp, ease, lin } from '../motion';
import { BRANDS } from '../brands';
import { Ic } from '../Icon';
import { BrandLogo } from '../real';
import type { SfxCue } from '../Stage';

// ── shared types ──────────────────────────────────────────────────────────────────────────
export type Item = { src?: string; slug?: string; title?: string; at?: number; tone?: 'light' | 'navy' | 'orange' };
export type ThemeSkin = 'orange' | 'navy' | 'paper' | 'terminal' | 'white' | 'cutout';
type Base = { t: number; S: number; E: number; skin?: any; format?: any; onDark?: boolean; frame?: any };
type Box = { x0: number; y0: number; x1: number; y1: number };

export type CameraJourneyProps = { stations: Item[]; variant?: 'pan' | 'zoom'; focusZoom?: number };
export type Flight3dProps = { items: Item[]; depth?: number };
export type OverwhelmProps = { shots: string[]; logos: string[]; you: string; tasks: string[]; densityAt: number; morphAt: number; closeAt: number; youLabel?: string };
export type OutwardProps = { center: Item; items: Item[]; at: number; radius?: number; y?: number };
export type ParticlesProps = { word?: string; slug?: string; at: number; variant?: 'confetti' | 'dots'; count?: number; y?: number; seed?: number };
export type GlitchProps = { word?: string; src?: string; slug?: string; hits: number[]; y?: number; size?: number; dur?: number };
export type StreakProps = { items: { text?: string; slug?: string; at: number; from?: 'left' | 'right'; tone?: 'light' | 'navy' | 'orange' }[]; y?: number; gap?: number };
export type GlowProps = { value?: string; label?: string; slug?: string; at?: number; sweepAt?: number; y?: number };
export type ThemeMorphProps = { anchor?: string; skins: { skin: ThemeSkin; at: number; tag?: string }[]; y?: number };
export type ScaleSwapProps = { cards: (Item & { at: number })[]; y?: number };
export type PressProps = { label: string; mark?: string; morphAt?: number; clickAt: number; y?: number; sub?: string };
export type DisplaceProps = { cards: (Item & { at: number })[]; y?: number };
export type WaterfallProps = { lines: string[]; at: number; accent?: string[]; y?: number; size?: number };
export type ExpandProps = { label: string; rows: { text: string; slug?: string }[]; openAt: number; closeAt?: number; below?: string; y?: number };

// ── helpers ───────────────────────────────────────────────────────────────────────────────
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const lerp = (a: number, b: number, e: number) => a + (b - a) * e;
const fade = (t: number, S: number, E: number, o = 0.25) => ease.outCubic(lin(t, S, o)) * (1 - ease.inCubic(lin(t, E - o, o)));
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);
const SH = '0 28px 60px -24px rgba(15,23,42,0.42), 0 2px 8px rgba(15,23,42,0.08)';
const abs: React.CSSProperties = { position: 'absolute' };

const onColor = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#14161A' : '#FFFFFF';
};
const toneBg = (tone: 'light' | 'navy' | 'orange' = 'light') => (tone === 'navy' ? K.navy : tone === 'orange' ? K.orange : K.panel);
const toneFg = (tone: 'light' | 'navy' | 'orange' = 'light') => (tone === 'light' ? K.ink : onColor(toneBg(tone)));
const textW = (s: string, size: number, k = 0.58) => s.length * size * k;

const Media: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) =>
  isVid(src) ? <OffthreadVideo src={staticFile(src)} muted style={style} /> : <Img src={staticFile(src)} style={style} />;

/** An Item rendered as a card of w x h: screenshot/video, brand logo, or plain title. */
const ItemCard: React.FC<{ item: Item; w: number; h: number; r?: number }> = ({ item, w, h, r = 40 }) => {
  const tone = item.tone ?? 'light';
  const bg = toneBg(tone), fg = toneFg(tone);
  const base: React.CSSProperties = { position: 'relative', width: w, height: h, borderRadius: r, boxSizing: 'border-box', overflow: 'hidden', background: bg, border: tone === 'light' ? `1px solid ${K.dot}` : 'none', boxShadow: SH };
  if (item.src) {
    return (
      <div style={base}>
        <Media src={item.src} style={{ ...abs, left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        {item.title && <div style={{ ...abs, left: 22, bottom: 22, padding: '8px 26px 10px', borderRadius: 999, background: K.panel, color: K.ink, fontFamily: FONT, fontWeight: 800, fontSize: 38, boxShadow: SH }}>{item.title}</div>}
      </div>
    );
  }
  if (item.slug) {
    const sz = Math.min(w, h) * (item.title ? 0.5 : 0.66);
    return (
      <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <BrandLogo slug={item.slug} size={sz} />
        {item.title && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: clamp(w / (item.title.length * 0.6), 30, 58), color: fg, whiteSpace: 'nowrap' }}>{item.title}</div>}
      </div>
    );
  }
  const t = item.title ?? '';
  return (
    <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: clamp((w - 60) / Math.max(4, t.length * 0.56), 40, 112), color: fg, letterSpacing: -2, textAlign: 'center', lineHeight: 1.05 }}>{t}</div>
    </div>
  );
};

const DotGrid: React.FC<{ size?: number; ox?: number; oy?: number }> = ({ size = 64, ox = 0, oy = 0 }) => (
  <div style={{ ...abs, inset: 0, backgroundImage: `radial-gradient(${K.dot} 3px, transparent 3.5px)`, backgroundSize: `${size}px ${size}px`, backgroundPosition: `${ox}px ${oy}px` }} />
);
const FrameBg: React.FC<{ o: number; children?: React.ReactNode; size?: number; ox?: number; oy?: number }> = ({ o, children, size, ox, oy }) => (
  <div style={{ ...abs, inset: 0, overflow: 'hidden', background: K.bg, opacity: o }}>
    <DotGrid size={size} ox={ox} oy={oy} />
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════════════════
// cameraJourney · a world bigger than the screen; the camera travels station to station
// ═════════════════════════════════════════════════════════════════════════════════════════
type Key = { t: number; x: number; y: number; sc: number };
const camAt = (t: number, keys: Key[], dip: number): { x: number; y: number; sc: number } => {
  if (t <= keys[0].t && keys.length === 1) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) {
      const D = Math.min(0.95, (b.t - a.t) * 0.62);
      const e = ease.inOutCubic(lin(t, b.t - D, D));
      const k = i === 0 && keys[0].sc < keys[1].sc * 0.9 && dip < 0.3 ? 0 : dip;
      return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), sc: a.sc * Math.pow(b.sc / a.sc, e) * (1 - k * Math.sin(Math.PI * e)) };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y, sc: l.sc * (1 + 0.025 * Math.min(1, (t - l.t) / 2)) };
};

export const CameraJourney: React.FC<Base & CameraJourneyProps> = ({ t, S, E, stations, variant = 'pan', focusZoom }) => {
  const n = Math.max(1, stations.length);
  const times = stations.map((s, i) => s.at ?? S + 0.3 + i * 1.5);
  const zoom = variant === 'zoom';
  const CW = zoom ? 600 : 820, CH = zoom ? 400 : 560;
  let pos: { x: number; y: number }[];
  let keys: Key[];
  let dip: number;
  if (zoom) {
    const cols = n <= 1 ? 1 : 2, rows = Math.ceil(n / cols), gx = 56;
    pos = stations.map((_, i) => ({ x: (i % cols - (cols - 1) / 2) * (CW + gx), y: (Math.floor(i / cols) - (rows - 1) / 2) * (CH + gx) }));
    const gw = cols * CW + (cols - 1) * gx, gh = rows * CH + (rows - 1) * gx;
    const open = Math.min(1000 / gw, 1500 / gh, 1);
    const focus = focusZoom ?? 1.65;
    keys = [{ t: S, x: 0, y: 0, sc: open }, ...pos.map((p, i) => ({ t: times[i], x: p.x, y: p.y, sc: focus }))];
    dip = 0.3;
  } else {
    pos = stations.map((_, i) => ({ x: i % 2 === 0 ? -520 : 520, y: i * 780 }));
    const focus = focusZoom ?? 1;
    keys = [{ t: S, x: pos[0].x, y: pos[0].y, sc: 0.62 }, ...pos.map((p, i) => ({ t: times[i], x: p.x, y: p.y, sc: focus }))];
    dip = 0.48;
  }
  const cam = camAt(t, keys, dip);
  const o = fade(t, S, E, 0.22);
  const path = pos.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${pos[i - 1].x} ${(pos[i - 1].y + p.y) / 2}, ${p.x} ${(pos[i - 1].y + p.y) / 2}, ${p.x} ${p.y}`)).join(' ');
  return (
    <FrameBg o={o} size={64 * cam.sc} ox={540 - cam.x * cam.sc} oy={900 - cam.y * cam.sc}>
      <div style={{ ...abs, left: 540, top: 900, width: 0, height: 0, transform: `scale(${cam.sc}) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {!zoom && n > 1 && (
          <svg width={1} height={1} style={{ ...abs, left: 0, top: 0, overflow: 'visible' }}>
            <path d={path} fill="none" stroke={K.orange} strokeWidth={10} strokeDasharray="4 30" strokeLinecap="round" opacity={0.8} />
          </svg>
        )}
        {stations.map((s, i) => {
          const near = 1 - clamp(Math.abs(t - times[i]) / 0.9, 0, 1);
          const pop = ease.outBack(lin(t, S + 0.05 * i, 0.5));
          const live = zoom ? 0.5 + 0.5 * near : 1;
          return (
            <div key={i} style={{ ...abs, left: pos[i].x - CW / 2, top: pos[i].y - CH / 2, opacity: clamp(pop * 2, 0, 1) * live, transform: `scale(${0.85 + 0.15 * pop})` }}>
              <div style={{ outline: `${6 + 4 * near}px solid ${near > 0.01 ? K.orange : 'transparent'}`, outlineOffset: 8, borderRadius: 46, opacity: 1 }}>
                <ItemCard item={{ ...s, title: zoom ? undefined : s.title }} w={CW} h={CH} />
              </div>
              <div style={{ ...abs, left: -18, top: -22, width: 76, height: 76, borderRadius: 999, background: K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SH }}>{i + 1}</div>
              {s.title && (
                <div style={{ ...abs, left: 0, width: CW, top: CH + 38, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: zoom ? 44 : 60, letterSpacing: -1.5, color: K.ink, whiteSpace: 'nowrap' }}>{s.title}</div>
              )}
            </div>
          );
        })}
      </div>
    </FrameBg>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// flight3d · fly forward through cards in depth over an orange grid floor, with fog and depth blur
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Flight3d: React.FC<Base & Flight3dProps> = ({ t, S, E, items, depth }) => {
  const D = depth ?? 900, P = 1100, CW = 880, CH = 600, OY = 880;
  const times = items.map((it, i) => it.at ?? S + 0.3 + i * 1.2);
  const keys = [{ t: S, c: -D * 0.9 }, ...items.map((_, i) => ({ t: times[i], c: i * D - 380 }))];
  let c = keys[keys.length - 1].c + Math.max(0, t - keys[keys.length - 1].t) * 26;
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1].t) {
      const Dt = Math.min(1.0, (keys[i + 1].t - keys[i].t) * 0.72);
      c = lerp(keys[i].c, keys[i + 1].c, ease.inOutCubic(lin(t, keys[i + 1].t - Dt, Dt)));
      break;
    }
  }
  const o = fade(t, S, E, 0.22);
  const cell = 160;
  return (
    <div style={{ ...abs, inset: 0, overflow: 'hidden', background: K.bg, opacity: o }}>
      <div style={{ ...abs, inset: 0, perspective: P, perspectiveOrigin: `50% ${OY}px` }}>
        <div style={{ ...abs, inset: 0, transformStyle: 'preserve-3d' }}>
          {/* grid floor, scrolling toward the camera */}
          <div style={{ ...abs, left: 540 - 2400, top: OY + 520, width: 4800, height: 5000, transformOrigin: '50% 0', transform: 'translateZ(-4000px) rotateX(90deg)', opacity: 0.55, backgroundImage: `linear-gradient(${K.orange} 3px, transparent 3px), linear-gradient(90deg, ${K.orange} 3px, transparent 3px)`, backgroundSize: `${cell}px ${cell}px`, backgroundPosition: `0px ${((c % cell) + cell) % cell}px`, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 45%)', maskImage: 'linear-gradient(to bottom, transparent 0%, #000 45%)' }} />
          {items.map((it, i) => {
            const z = c - i * D;
            if (z < -4.2 * D || z > 700) return null;
            const far = clamp(1 - (-z - 380) / (2.8 * D), 0, 1);
            const near = clamp(1 - (z - 120) / 380, 0, 1);
            const blur = clamp((-z - 520) / D, 0, 1) * 7 + clamp((z - 120) / 160, 0, 1) * 14;
            const side = i % 2 === 0 ? -1 : 1;
            return (
              <div key={i} style={{ ...abs, left: 540 - CW / 2 + side * 120, top: OY - CH / 2 + ((i % 3) - 1) * 36, width: CW, opacity: far * near, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, transform: `translateZ(${z}px) rotateY(${-side * 9}deg)` }}>
                <ItemCard item={{ ...it, title: undefined }} w={CW} h={CH} r={52} />
                {it.title && <div style={{ textAlign: 'center', marginTop: 34, fontFamily: FONT, fontWeight: 900, fontSize: 74, letterSpacing: -2, color: K.ink, whiteSpace: 'nowrap' }}>{it.title}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {/* fog over the horizon */}
      <div style={{ ...abs, left: 0, right: 0, top: 0, height: OY + 140, background: `linear-gradient(to bottom, transparent 0%, transparent 55%, ${K.bg} 100%)`, pointerEvents: 'none' }} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// overwhelm · screens assemble, logos pile up, the middle screen becomes YOU, tasks close in
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Overwhelm: React.FC<Base & OverwhelmProps> = ({ t, S, E, shots, logos, you, tasks, densityAt, morphAt, closeAt, youLabel = 'YOU' }) => {
  const cx = 540, cy = 900;
  const o = fade(t, S, E, 0.22);
  const m = ease.inOutCubic(lin(t, morphAt, 0.7));
  const sh = (i: number) => shots[i % Math.max(1, shots.length)];
  const layout = [
    { x: -230, y: -250, w: 520, h: 340, rot: -7 },
    { x: 0, y: 0, w: 640, h: 420, rot: 0 },
    { x: 230, y: 250, w: 520, h: 340, rot: 6 },
  ];
  const order = [0, 2, 1]; // centre screen last, on top
  // logos: slots appear one after another until densityAt
  const slots = Math.max(8, logos.length * 5);
  const span = Math.max(0.4, densityAt - S - 0.5);
  // tasks
  const KT = 12;
  const tspan = Math.max(0.5, closeAt - morphAt - 0.9);
  const close = lin(t, closeAt - 0.3, 0.3);
  const youR = lerp(320, 230, m);
  return (
    <FrameBg o={o}>
      {/* logo swarm */}
      {logos.length > 0 && Array.from({ length: slots }, (_, j) => {
        const st = S + 0.5 + span * (j / slots);
        const p = ease.outBack(lin(t, st, 0.4));
        if (p <= 0) return null;
        const ang = j * 2.399 + hash(j) * 0.8, rad = 330 + 380 * hash(j + 9);
        const push = 1 + 0.18 * m;
        const bx = cx + Math.cos(ang) * rad * 0.78 * push, by = cy + Math.sin(ang) * rad * 1.05 * push;
        const dx = Math.sin(t * 1.3 + j) * 10, dy = Math.cos(t * 1.1 + j * 1.7) * 10;
        const x = clamp(bx, 90, 990), y = clamp(by, 260, 1560);
        const size = 100 + 60 * hash(j + 3);
        return (
          <div key={j} style={{ ...abs, left: x + dx - size / 2, top: y + dy - size / 2, opacity: clamp(p * 2, 0, 1) * (1 - 0.35 * m), transform: `scale(${p}) rotate(${(hash(j + 5) - 0.5) * 24}deg)` }}>
            <BrandLogo slug={logos[j % logos.length]} size={size} />
          </div>
        );
      })}
      {/* three screens */}
      {order.map((i) => {
        const L = layout[i];
        const p = ease.outBack(lin(t, S + 0.12 + i * 0.22, 0.55));
        const centre = i === 1;
        const w = centre ? lerp(L.w, 460, m) : L.w, h = centre ? lerp(L.h, 460, m) : L.h;
        const r = centre ? lerp(44, 230, m) : 44;
        const out = centre ? 0 : m;
        const x = cx + L.x * (1 + 1.1 * out), y = cy + L.y * (1 + 0.9 * out);
        const rot = L.rot * (1 - m);
        return (
          <div key={i} style={{ ...abs, left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: clamp(p * 2, 0, 1) * (1 - out), transform: `rotate(${rot}deg) scale(${(0.6 + 0.4 * p) * (1 - 0.35 * out)})` }}>
            <div style={{ ...abs, inset: 0, borderRadius: r, overflow: 'hidden', background: K.panel, border: `1px solid ${K.dot}`, boxShadow: SH }}>
              <Media src={sh(i)} style={{ ...abs, inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', opacity: centre ? 1 - m : 1 }} />
              {centre && m > 0 && <Media src={you} style={{ ...abs, inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: m }} />}
            </div>
            {centre && m > 0 && <div style={{ ...abs, inset: -14, borderRadius: 999, border: `${8 * m}px solid ${K.orange}`, opacity: m }} />}
          </div>
        );
      })}
      {m > 0.01 && (
        <div style={{ ...abs, left: cx - 150, top: cy + youR + 36, width: 300, textAlign: 'center', opacity: m, transform: `scale(${0.8 + 0.2 * m})` }}>
          <span style={{ display: 'inline-block', padding: '8px 40px 12px', borderRadius: 999, background: K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 54, letterSpacing: 6, boxShadow: SH }}>{youLabel}</span>
        </div>
      )}
      {/* tasks closing the siege */}
      {tasks.length > 0 && Array.from({ length: KT }, (_, k) => {
        const st = morphAt + 0.4 + tspan * (k / KT);
        const f = lin(t, st, 0.5);
        if (f <= 0) return null;
        const e = ease.outBack(f);
        const a = k * ((Math.PI * 2) / KT) + 0.35;
        const rf = (300 + 95 * (k % 3)) * (1 - 0.07 * close);
        const rr = lerp(1250, rf, e);
        const x = cx + Math.cos(a) * rr * 1.2, y = cy + Math.sin(a) * rr * 1.05;
        const label = tasks[k % tasks.length];
        const cw = Math.min(520, 150 + textW(label, 40, 0.56));
        return (
          <div key={k} style={{ ...abs, left: x - cw / 2, top: y - 48, width: cw, height: 96, boxSizing: 'border-box', padding: '0 26px', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 28, background: K.panel, border: `2px solid ${K.orange}`, boxShadow: SH, opacity: clamp(f * 3, 0, 1), transform: `rotate(${(hash(k + 20) - 0.5) * 14}deg)` }}>
            <Ic n="bell" size={40} color={K.orange} sw={2.6} />
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: K.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
        );
      })}
    </FrameBg>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// themeMorph · the whole world changes look in 0.3 s fades while the anchor stays put
// ═════════════════════════════════════════════════════════════════════════════════════════
type SkinDef = { bg: string; fg: string; accent: string; card: string; border: string; radius: number; font: string; weight: number; scan?: boolean; paper?: boolean; btn: string };
const skinDef = (s: ThemeSkin): SkinDef => {
  switch (s) {
    case 'navy': return { bg: K.navy, fg: onColor(K.navy), accent: K.orange, card: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.22)', radius: 34, font: FONT, weight: 900, btn: 'Get started' };
    case 'paper': return { bg: '#F1E8D6', fg: '#2B2118', accent: K.orange, card: '#FBF6EA', border: '#CDBFA3', radius: 10, font: K.serif, weight: 400, paper: true, btn: 'Get started' };
    case 'terminal': return { bg: '#0A130E', fg: '#4ADE80', accent: '#4ADE80', card: 'rgba(74,222,128,0.07)', border: '#4ADE80', radius: 0, font: MONO, weight: 700, scan: true, btn: '$ get_started' };
    case 'white': return { bg: '#FFFFFF', fg: '#14161A', accent: K.orange, card: '#F3F4F6', border: '#E5E7EB', radius: 36, font: FONT, weight: 800, btn: 'Get started' };
    case 'cutout': return { bg: `linear-gradient(165deg, ${K.orange} 0%, ${K.navy} 100%)`, fg: '#FFFFFF', accent: '#FFFFFF', card: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.3)', radius: 40, font: FONT, weight: 900, btn: 'Get started' };
    default: return { bg: K.orange, fg: '#FFFFFF', accent: '#FFFFFF', card: 'rgba(255,255,255,0.18)', border: 'rgba(255,255,255,0.35)', radius: 40, font: FONT, weight: 900, btn: 'Get started' };
  }
};

const ThemeWorld: React.FC<{ s: ThemeSkin; anchor: string; tag?: string; y: number }> = ({ s, anchor, tag, y }) => {
  const d = skinDef(s);
  const fs = clamp(960 / Math.max(4, anchor.length * 0.58), 70, 170);
  const btnFg = s === 'orange' || s === 'cutout' ? K.orange : onColor(d.accent);
  return (
    <div style={{ ...abs, inset: 0, background: d.bg, overflow: 'hidden' }}>
      {d.scan && <div style={{ ...abs, inset: 0, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(74,222,128,0.07) 0px, rgba(74,222,128,0.07) 2px, transparent 2px, transparent 7px)' }} />}
      {d.paper && <div style={{ ...abs, inset: 0, backgroundImage: 'radial-gradient(rgba(90,70,40,0.16) 1.5px, transparent 2px)', backgroundSize: '22px 22px' }} />}
      {(s === 'orange' || s === 'navy') && <div style={{ ...abs, left: 540 - 520, top: y - 420, width: 1040, height: 1040, borderRadius: 999, background: s === 'orange' ? 'rgba(255,255,255,0.10)' : 'rgba(249,115,22,0.14)' }} />}
      {/* top bar */}
      <div style={{ ...abs, left: 60, right: 60, top: 270, height: 92, borderRadius: d.radius ? Math.min(d.radius, 46) : 0, background: d.card, border: `2px ${d.paper ? 'dashed' : 'solid'} ${d.border}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 30px', boxSizing: 'border-box' }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 22, height: 22, borderRadius: s === 'terminal' ? 0 : 999, background: i === 0 ? d.accent : d.border }} />)}
        <div style={{ flex: 1 }} />
        {tag && <div style={{ fontFamily: d.font, fontWeight: d.weight, fontSize: 44, color: d.fg, letterSpacing: s === 'terminal' ? 0 : 3, textTransform: s === 'paper' ? 'none' : 'uppercase' }}>{s === 'terminal' ? `// ${tag}` : tag}</div>}
      </div>
      {/* anchor */}
      <div style={{ ...abs, left: 0, right: 0, top: y - fs * 0.62, textAlign: 'center', fontFamily: d.font, fontWeight: d.weight, fontSize: fs, letterSpacing: -fs * 0.03, color: d.fg, fontStyle: s === 'paper' ? 'italic' : 'normal', whiteSpace: 'nowrap', opacity: s === 'cutout' ? 0 : 1 }}>{anchor}</div>
      {/* cards */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...abs, left: 60 + i * 330, top: y + 190, width: 300, height: 200, borderRadius: d.radius, background: d.card, border: `2px ${d.paper ? 'dashed' : 'solid'} ${d.border}`, boxSizing: 'border-box', padding: 30 }}>
          <div style={{ width: 70 + i * 24, height: 20, borderRadius: d.radius ? 10 : 0, background: d.accent }} />
          <div style={{ width: 200, height: 14, marginTop: 30, borderRadius: d.radius ? 7 : 0, background: d.border }} />
          <div style={{ width: 150 - i * 20, height: 14, marginTop: 16, borderRadius: d.radius ? 7 : 0, background: d.border }} />
        </div>
      ))}
      {/* button */}
      <div style={{ ...abs, left: 270, top: y + 450, width: 540, height: 130, borderRadius: d.radius ? Math.min(d.radius * 2, 65) : 0, background: d.accent, color: btnFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: d.font, fontWeight: d.weight === 400 ? 400 : 800, fontSize: 52, fontStyle: s === 'paper' ? 'italic' : 'normal', boxShadow: s === 'terminal' ? `0 0 30px ${d.accent}66` : '0 20px 40px -16px rgba(0,0,0,0.35)' }}>{d.btn}</div>
    </div>
  );
};

export const ThemeMorph: React.FC<Base & ThemeMorphProps> = ({ t, S, E, anchor = 'WiseFunnel', skins, y = 820 }) => {
  const o = fade(t, S, E, 0.2);
  let cur = 0;
  skins.forEach((s, i) => { if (t >= s.at) cur = i; });
  const prev = Math.max(0, cur - 1);
  const w = cur === 0 ? 1 : lin(t, skins[cur].at, 0.3);
  return (
    <div style={{ ...abs, inset: 0, overflow: 'hidden', opacity: o }}>
      {cur > 0 && w < 1 && <ThemeWorld s={skins[prev].skin} anchor={anchor} tag={skins[prev].tag} y={y} />}
      <div style={{ ...abs, inset: 0, opacity: w }}>
        <ThemeWorld s={skins[cur].skin} anchor={anchor} tag={skins[cur].tag} y={y} />
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// outward · items leave the centre stacked and spread to a ring, all in the same move
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Outward: React.FC<Base & OutwardProps> = ({ t, S, E, center, items, at, radius = 330, y = 760 }) => {
  const o = fade(t, S, E, 0.25);
  const pc = ease.outBack(lin(t, S, 0.45));
  const p = ease.outBack(lin(t, at, 0.75));
  const pl = ease.outCubic(lin(t, at, 0.75));
  const n = Math.max(1, items.length), cx = 540;
  const CS = 250;
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ ...abs, left: 0, top: 0 }}>
        {items.map((_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
          return <line key={i} x1={cx} y1={y} x2={cx + Math.cos(a) * radius * pl} y2={y + Math.sin(a) * radius * pl} stroke={K.orange} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 22" opacity={0.7 * pl} />;
        })}
      </svg>
      {items.map((it, i) => {
        if (t < at) return null;
        const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
        const x = cx + Math.cos(a) * radius * p, y2 = y + Math.sin(a) * radius * p;
        const sz = 160;
        return (
          <div key={i} style={{ ...abs, left: x - sz / 2, top: y2 - sz / 2, opacity: clamp(pl * 3, 0, 1), transform: `scale(${0.5 + 0.5 * Math.min(p, 1.15)}) rotate(${(1 - pl) * (hash(i + 2) - 0.5) * 40}deg)` }}>
            {it.slug || it.src ? <ItemCard item={{ ...it, title: undefined }} w={sz} h={sz} r={44} /> : (
              <div style={{ width: sz, height: sz, borderRadius: 44, background: toneBg(it.tone), color: toneFg(it.tone), border: `1px solid ${K.dot}`, boxShadow: SH, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, fontFamily: FONT, fontWeight: 900, fontSize: clamp(150 / Math.max(3, (it.title ?? '').length * 0.6), 28, 46), textAlign: 'center', lineHeight: 1.05 }}>{it.title}</div>
            )}
          </div>
        );
      })}
      <div style={{ ...abs, left: cx - CS / 2, top: y - CS / 2, opacity: clamp(pc * 2, 0, 1), transform: `scale(${0.6 + 0.4 * pc})` }}>
        <ItemCard item={{ tone: 'orange', ...center }} w={CS} h={CS} r={60} />
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// particles · a word or logo with a deterministic burst (confetti falls, dots radiate)
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Particles: React.FC<Base & ParticlesProps> = ({ t, S, E, word, slug, at, variant = 'confetti', count, y = 760, seed = 1 }) => {
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const tau = t - at;
  const p = ease.outBack(lin(t, at, 0.5));
  const N = count ?? (variant === 'confetti' ? 70 : 36);
  const palette = [K.orange, K.navy, '#FACC15', '#22C55E', '#EC4899', '#38BDF8'];
  const cx = 540;
  const fs = clamp(900 / Math.max(3, (word ?? '').length * 0.66), 110, 230);
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      {tau > 0 && variant === 'confetti' && Array.from({ length: N }, (_, i) => {
        const h1 = hash(i * 3 + seed * 17), h2 = hash(i * 3 + 1 + seed * 17), h3 = hash(i * 3 + 2 + seed * 17);
        const ang = -Math.PI / 2 + (h1 - 0.5) * Math.PI * 1.15;
        const sp = 650 + 750 * h2;
        const x = cx + Math.cos(ang) * sp * tau, yy = y + Math.sin(ang) * sp * tau + 0.5 * 2300 * tau * tau;
        const op = 1 - lin(tau, 1.2, 0.7);
        if (op <= 0) return null;
        const w = 14 + 16 * h3, h = 8 + 8 * h1;
        return <div key={i} style={{ ...abs, left: x - w / 2, top: yy - h / 2, width: w, height: h, borderRadius: h3 > 0.7 ? 999 : 3, background: palette[i % palette.length], opacity: op, transform: `rotate(${(h2 * 360 + tau * (200 + 500 * h3)) % 360}deg) scaleY(${Math.cos(tau * (6 + 8 * h1) + i)})` }} />;
      })}
      {tau > 0 && variant === 'dots' && (
        <>
          {[0, 0.12].map((dl, k) => {
            const q = ease.outCubic(lin(tau, dl, 0.7));
            return <div key={k} style={{ ...abs, left: cx - 300 * q, top: y - 300 * q, width: 600 * q, height: 600 * q, borderRadius: 999, border: `${10 * (1 - q) + 1}px solid ${k ? K.navy : K.orange}`, opacity: 1 - q, boxSizing: 'border-box' }} />;
          })}
          {Array.from({ length: N }, (_, i) => {
            const h1 = hash(i + seed * 31), h2 = hash(i * 5 + seed);
            const a = (i / N) * Math.PI * 2 + (h1 - 0.5) * 0.12;
            const d = (160 + 460 * (0.55 + 0.45 * h2)) * ease.outCubic(lin(tau, 0, 0.85));
            const r = (8 + 14 * h1) * (1 - 0.8 * lin(tau, 0.3, 0.8));
            const op = 1 - lin(tau, 0.7, 0.4);
            if (op <= 0) return null;
            return <div key={i} style={{ ...abs, left: cx + Math.cos(a) * d - r, top: y + Math.sin(a) * d - r, width: r * 2, height: r * 2, borderRadius: 999, background: palette[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2], opacity: op }} />;
          })}
        </>
      )}
      {t >= at - 0.02 && (
        <div style={{ ...abs, left: 0, right: 0, top: y - fs * 0.6, height: fs * 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(p * 2, 0, 1), transform: `scale(${0.35 + 0.65 * p})` }}>
          {word ? <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: fs, letterSpacing: -fs * 0.04, color: K.ink, whiteSpace: 'nowrap' }}>{word}</span> : slug ? <BrandLogo slug={slug} size={280} /> : null}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// glitch · red/cyan copies jitter and bands slide for a split second, then it is sharp again
// ═════════════════════════════════════════════════════════════════════════════════════════
const glitchSize = (p: GlitchProps) => {
  if (p.word) { const s = p.size ?? 200; return { w: Math.min(1000, textW(p.word, s, 0.64) + 60), h: s * 1.3 }; }
  if (p.src) return { w: 800, h: 560 };
  return { w: 380, h: 380 };
};

export const Glitch: React.FC<Base & GlitchProps> = ({ t, S, E, word, src, slug, hits, y = 760, size = 200, dur = 0.35 }) => {
  const { w, h } = glitchSize({ word, src, slug, hits, size } as GlitchProps);
  const pop = ease.outBack(lin(t, S, 0.45));
  const o = clamp(pop * 2, 0, 1) * (1 - ease.inCubic(lin(t, E - 0.25, 0.25)));
  let g = 0;
  hits.forEach((hh) => { if (t >= hh && t <= hh + dur) g = Math.max(g, Math.sin(Math.PI * lin(t, hh, dur))); });
  const f = Math.floor(t * 30);
  const content = (
    <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {word ? <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.04, color: K.ink, whiteSpace: 'nowrap' }}>{word}</span>
        : src ? <div style={{ width: w, height: h, borderRadius: 44, overflow: 'hidden', boxShadow: SH, border: `1px solid ${K.dot}` }}><Media src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} /></div>
        : slug ? <BrandLogo slug={slug} size={300} /> : null}
    </div>
  );
  const at = { left: 540 - w / 2, top: y - h / 2, width: w, height: h };
  const bx = (hash(f + 5) - 0.5) * 18 * g;
  const bands = [0, 1, 2, 3].map((i) => ({ top: hash(f + i * 7) * 80, hgt: 7 + hash(f + i * 11) * 12, dx: (hash(f + i * 3 + 1) - 0.5) * 220 * g }));
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      <svg width={0} height={0} style={abs}>
        <filter id="mfx-gl-r"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.12  0 0 0 0 0.25  0 0 0 1 0" /></filter>
        <filter id="mfx-gl-c"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 1  0 0 0 1 0" /></filter>
      </svg>
      {g > 0.02 && (
        <>
          <div style={{ ...abs, ...at, filter: 'url(#mfx-gl-r)', opacity: 0.85 * g + 0.1, transform: `translate(${(hash(f) - 0.5) * 70 * g - 14 * g}px, ${(hash(f + 1) - 0.5) * 16 * g}px)` }}>{content}</div>
          <div style={{ ...abs, ...at, filter: 'url(#mfx-gl-c)', opacity: 0.85 * g + 0.1, transform: `translate(${(hash(f + 2) - 0.5) * 70 * g + 14 * g}px, ${(hash(f + 3) - 0.5) * 16 * g}px)` }}>{content}</div>
        </>
      )}
      <div style={{ ...abs, ...at, transform: `translate(${bx}px, 0) scale(${0.7 + 0.3 * pop})` }}>{content}</div>
      {g > 0.05 && bands.map((b, i) => (
        <div key={i} style={{ ...abs, ...at, clipPath: `inset(${b.top}% 0 ${Math.max(0, 100 - b.top - b.hgt)}% 0)`, transform: `translate(${b.dx}px, 0)` }}>{content}</div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// streak · pills fly in sideways with directional blur and an echo trail that vanishes on landing
// ═════════════════════════════════════════════════════════════════════════════════════════
const PILL_H = 128;
const pillW = (it: { text?: string; slug?: string }) => 90 + (it.slug ? 112 : 0) + textW(it.text ?? '', 56, 0.58);

const PillBody: React.FC<{ it: StreakProps['items'][number]; w: number }> = ({ it, w }) => {
  const tone = it.tone ?? 'light';
  const bg = toneBg(tone), fg = toneFg(tone);
  return (
    <div style={{ width: w, height: PILL_H, borderRadius: 999, boxSizing: 'border-box', background: bg, border: tone === 'light' ? `1px solid ${K.dot}` : 'none', boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 28px' }}>
      {it.slug && <BrandLogo slug={it.slug} size={84} />}
      {it.text && <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: -1, color: fg, whiteSpace: 'nowrap' }}>{it.text}</span>}
    </div>
  );
};

export const Streak: React.FC<Base & StreakProps> = ({ t, S, E, items, y = 560, gap = 30 }) => {
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      {items.map((it, i) => {
        if (t < it.at - 0.02) return null;
        const w = pillW(it);
        const dir = it.from === 'right' ? 1 : -1;
        const f = lin(t, it.at, 0.55);
        const e = 1 - Math.pow(1 - f, 4); // fast out, long settle
        const rem = 1 - e;
        const x0 = dir * 1300;
        const dx = x0 * rem;
        const blur = 46 * Math.pow(rem, 1.4);
        const top = y + i * (PILL_H + gap);
        const left = 540 - w / 2;
        return (
          <React.Fragment key={i}>
            <svg width={0} height={0} style={abs}><filter id={`mfx-st-${i}`} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={`${blur} 0`} /></filter></svg>
            {[3, 2, 1].map((k) => rem > 0.02 && (
              <div key={k} style={{ ...abs, left, top, opacity: 0.32 * rem * (1 - k * 0.2), transform: `translateX(${dx}px)`, filter: `url(#mfx-st-${i})` }}>
                <div style={{ transform: `translateX(${-dir * k * 80 * rem}px)` }}><PillBody it={it} w={w} /></div>
              </div>
            ))}
            <div style={{ ...abs, left, top, opacity: clamp(f * 4, 0, 1), transform: `translateX(${dx}px)`, filter: blur > 0.5 ? `url(#mfx-st-${i})` : undefined }}>
              <PillBody it={it} w={w} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// glow · an orange glow blooms behind a hero card, breathes, and one sheen crosses the card
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Glow: React.FC<Base & GlowProps> = ({ t, S, E, value, label, slug, at, sweepAt, y = 760 }) => {
  const a = at ?? S + 0.1;
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const bloom = ease.outCubic(lin(t, a, 0.9));
  const breathe = 1 + 0.07 * Math.sin((t - a) * 2.6);
  const p = ease.outBack(lin(t, a, 0.55));
  const sw = ease.inOutCubic(lin(t, sweepAt ?? a + 1.1, 0.8));
  const CW = 820, CH = label ? 460 : 400;
  const vs = clamp(720 / Math.max(3, (value ?? '').length * 0.62), 100, 200);
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      <div style={{ ...abs, left: 540 - 620, top: y - 620, width: 1240, height: 1240, borderRadius: 999, background: `radial-gradient(circle, ${K.orange} 0%, ${K.orange}00 62%)`, opacity: 0.6 * bloom * (0.85 + 0.15 * breathe), transform: `scale(${(0.5 + 0.5 * bloom) * breathe})` }} />
      <div style={{ ...abs, left: 540 - CW / 2, top: y - CH / 2, width: CW, height: CH, opacity: clamp(p * 2, 0, 1), transform: `scale(${0.8 + 0.2 * p})` }}>
        <div style={{ ...abs, inset: 0, borderRadius: 56, background: K.panel, border: `2px solid ${K.orange}`, boxShadow: `0 0 90px -10px ${K.orange}, ${SH}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {value ? <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: vs, letterSpacing: -vs * 0.04, color: K.ink, whiteSpace: 'nowrap' }}>{value}</div> : slug ? <BrandLogo slug={slug} size={label ? 220 : 260} /> : null}
          {label && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: K.orange, whiteSpace: 'nowrap' }}>{label}</div>}
          {sw > 0 && sw < 1 && <div style={{ ...abs, top: -40, bottom: -40, width: 150, left: -220 + (CW + 440) * sw, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)', transform: 'skewX(-18deg)' }} />}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// scaleSwap · the current card shrinks away while the next is born in the same spot with a spring
// ═════════════════════════════════════════════════════════════════════════════════════════
export const ScaleSwap: React.FC<Base & ScaleSwapProps> = ({ t, S, E, cards, y = 760 }) => {
  const W0 = 760, H0 = 480;
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      {cards.map((c, i) => {
        const nextAt = cards[i + 1]?.at;
        const born = ease.outBack(lin(t, c.at, 0.5));
        const gone = nextAt !== undefined ? ease.inCubic(lin(t, nextAt - 0.05, 0.3)) : 0;
        if (t < c.at || gone >= 1) return null;
        const sc = (0.35 + 0.65 * born) * (1 - 0.75 * gone);
        return (
          <div key={i} style={{ ...abs, left: 540 - W0 / 2, top: y - H0 / 2, opacity: clamp(born * 2, 0, 1) * (1 - gone), transform: `scale(${sc}) rotate(${-gone * 8}deg)` }}>
            <ItemCard item={c} w={W0} h={H0} r={52} />
          </div>
        );
      })}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// press · a logo condenses into a CTA button, the cursor arrives, clicks, the button springs back
// ═════════════════════════════════════════════════════════════════════════════════════════
const Cursor: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 24 30" style={{ display: 'block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))' }}>
    <path d="M3 2 L3 24 L9 18.5 L13 27.5 L17 25.8 L13 17 L21 17 Z" fill={K.ink} stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

const PressMark: React.FC<{ mark?: string; size: number }> = ({ mark, size }) => {
  const b = mark ? BRANDS[mark] : undefined;
  if (b) return <svg width={size} height={size} viewBox="0 0 24 24"><path d={b.path} fill={b.hex} /></svg>;
  return <Img src={staticFile(mark && /[./]/.test(mark) ? mark : 'logo.png')} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
};

export const Press: React.FC<Base & PressProps> = ({ t, S, E, label, mark, morphAt, clickAt, y = 760, sub }) => {
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const pop = ease.outBack(lin(t, S, 0.5));
  const m = morphAt === undefined ? 1 : ease.inOutCubic(lin(t, morphAt, 0.55));
  const BW = 740, BH = 156;
  const w = lerp(230, BW, m), h = lerp(230, BH, m), r = lerp(64, BH / 2, m);
  const down = t < clickAt ? 0 : t < clickAt + 0.1 ? lin(t, clickAt, 0.1) : 1 - ease.outBack(lin(t, clickAt + 0.1, 0.45));
  const sc = 1 - 0.07 * down;
  // cursor: decelerates into the button centre-right
  const tx = 540 + 150, ty = y + 36;
  const arrive = ease.outCubic(lin(t, Math.max(S, clickAt - 1.0), 0.92));
  const cxp = lerp(tx + 360, tx, arrive), cyp = lerp(ty + 480, ty, arrive);
  const cOp = clamp(lin(t, Math.max(S, clickAt - 1.0), 0.2), 0, 1);
  const q = ease.outCubic(lin(t, clickAt + 0.08, 0.65));
  const glowK = t < clickAt ? 0 : Math.exp(-(t - clickAt) * 3.2);
  const subP = ease.outCubic(lin(t, clickAt + 0.3, 0.4));
  const logoS = lerp(150, 84, m);
  const logoX = lerp(0, -w / 2 + 40 + logoS / 2 + 30, m);
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      <div style={{ ...abs, left: 540 - 420, top: y - 420, width: 840, height: 840, borderRadius: 999, background: `radial-gradient(circle, ${K.orange} 0%, ${K.orange}00 62%)`, opacity: 0.55 * glowK }} />
      <div style={{ ...abs, left: 540 - w / 2, top: y - h / 2, width: w, height: h, opacity: clamp(pop * 2, 0, 1), transform: `scale(${(0.6 + 0.4 * pop) * sc})` }}>
        {q > 0 && q < 1 && <div style={{ ...abs, inset: 0, borderRadius: r, border: `${8 * (1 - q) + 1}px solid ${K.orange}`, boxSizing: 'border-box', opacity: 1 - q, transform: `scale(${1 + 0.45 * q}, ${1 + 0.9 * q})` }} />}
        <div style={{ ...abs, inset: 0, borderRadius: r, background: K.panel, border: `1px solid ${K.dot}`, boxShadow: SH, opacity: 1 - m }} />
        <div style={{ ...abs, inset: 0, borderRadius: r, background: K.orange, boxShadow: `0 ${22 - 12 * down}px 44px -14px ${K.orange}CC`, opacity: m }} />
        <div style={{ ...abs, left: w / 2 + logoX - logoS / 2, top: h / 2 - logoS / 2 }}>
          <PressMark mark={mark} size={logoS} />
        </div>
        <div style={{ ...abs, left: 0, right: 0, top: 0, bottom: 0, paddingLeft: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: m, fontFamily: FONT, fontWeight: 900, fontSize: 60, letterSpacing: -1.5, color: '#fff', whiteSpace: 'nowrap' }}>{label}</div>
      </div>
      {sub && <div style={{ ...abs, left: 0, right: 0, top: y + BH / 2 + 44, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 46, color: K.ink, opacity: subP * 0.85, transform: `translateY(${(1 - subP) * 16}px)` }}>{sub}</div>}
      <div style={{ ...abs, left: cxp - 6, top: cyp - 6 + 8 * down, opacity: cOp, transform: `scale(${1 - 0.15 * down})`, transformOrigin: '6px 6px' }}>
        <Cursor size={78} />
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// displace · the new card barges in and knocks the previous one out of frame
// ═════════════════════════════════════════════════════════════════════════════════════════
export const Displace: React.FC<Base & DisplaceProps> = ({ t, S, E, cards, y = 760 }) => {
  const W0 = 780, H0 = 460;
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      {cards.map((c, i) => {
        const isFirst = i === 0;
        const nextAt = cards[i + 1]?.at;
        const inP = isFirst ? ease.outBack(lin(t, c.at, 0.5)) : ease.outBack(lin(t, c.at - 0.25, 0.6));
        const x = isFirst ? 0 : (1 - inP) * 1150;
        const q = nextAt !== undefined ? ease.inCubic(lin(t, nextAt - 0.05, 0.4)) : 0;
        if (q >= 1 || t < (isFirst ? c.at : c.at - 0.25)) return null;
        // small recoil shake when the hit lands
        const hit = !isFirst && t >= c.at - 0.05 && t < c.at + 0.25 ? Math.sin((t - c.at) * 80) * 10 * (1 - lin(t, c.at - 0.05, 0.3)) : 0;
        return (
          <div key={i} style={{ ...abs, left: 540 - W0 / 2, top: y - H0 / 2, opacity: isFirst ? clamp(inP * 2, 0, 1) : 1, transform: `translate(${x - q * 1400 + hit}px, ${q * 140}px) rotate(${-q * 24 + (isFirst ? 0 : (1 - inP) * 6)}deg) scale(${isFirst ? 0.6 + 0.4 * inP : 1})` }}>
            <ItemCard item={c} w={W0} h={H0} r={52} />
          </div>
        );
      })}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// waterfall · words whip up from below, each starting before the last has settled
// ═════════════════════════════════════════════════════════════════════════════════════════
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const Waterfall: React.FC<Base & WaterfallProps> = ({ t, S, E, lines, at, accent = [], y = 760, size = 130 }) => {
  const acc = new Set(accent.map(norm));
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const exitUp = ease.inCubic(lin(t, E - 0.25, 0.25)) * -30;
  const LH = size * 1.12;
  let k = 0;
  const top = y - (lines.length * LH) / 2;
  return (
    <div style={{ ...abs, inset: 0, opacity: o, transform: `translateY(${exitUp}px)` }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ ...abs, left: 0, right: 0, top: top + li * LH, height: LH, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size * 0.26 }}>
          {ln.split(/\s+/).filter(Boolean).map((wd, wi) => {
            const idx = k++;
            const heavy = acc.has(norm(wd)) || norm(wd).length >= 6;
            const travel = heavy ? 320 : 150;
            const f = lin(t, at + idx * 0.11, 0.6);
            const p = ease.outBack(f);
            return (
              <span key={wi} style={{ display: 'inline-block', fontFamily: FONT, fontWeight: heavy ? 900 : 800, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.035, whiteSpace: 'nowrap', color: acc.has(norm(wd)) ? K.orange : K.ink, opacity: clamp(f * 3.5, 0, 1), transform: `translateY(${(1 - p) * travel}px) skewY(${(1 - f) * 5}deg)`, filter: f < 1 ? `blur(${(1 - f) * 7}px)` : undefined }}>{wd}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// expand · a fixed pill opens downward into a list; whatever is below is pushed by the edge
// ═════════════════════════════════════════════════════════════════════════════════════════
const EX = { HH: 124, RH: 104, PAD: 26, W: 800 };

export const Expand: React.FC<Base & ExpandProps> = ({ t, S, E, label, rows, openAt, closeAt, below, y = 560 }) => {
  const o = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const pop = ease.outBack(lin(t, S, 0.45));
  let open = ease.outCubic(lin(t, openAt, 0.55));
  if (closeAt !== undefined) open *= 1 - ease.inOutCubic(lin(t, closeAt, 0.4));
  const H = EX.HH + open * (rows.length * EX.RH + EX.PAD);
  const bp = ease.outCubic(lin(t, S + 0.25, 0.4));
  return (
    <div style={{ ...abs, inset: 0, opacity: o }}>
      <div style={{ ...abs, left: 540 - EX.W / 2, top: y, width: EX.W, height: H, overflow: 'hidden', borderRadius: 62 - 14 * open, background: K.panel, border: `2px solid ${open > 0.02 ? K.orange : K.dot}`, boxShadow: SH, boxSizing: 'border-box', opacity: clamp(pop * 2, 0, 1), transform: `scale(${0.85 + 0.15 * pop})`, transformOrigin: '50% 0' }}>
        <div style={{ ...abs, left: 0, right: 0, top: 0, height: EX.HH, display: 'flex', alignItems: 'center', padding: '0 44px', gap: 22 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: K.orange }} />
          <div style={{ flex: 1, fontFamily: FONT, fontWeight: 900, fontSize: 52, letterSpacing: -1, color: K.ink, whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ transform: `rotate(${180 * open}deg)`, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={K.orange} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
        {rows.map((r, i) => {
          const rp = ease.outCubic(lin(t, openAt + 0.1 + i * 0.09, 0.3)) * open;
          return (
            <div key={i} style={{ ...abs, left: 28, right: 28, top: EX.HH + i * EX.RH, height: EX.RH - 10, borderRadius: 26, background: i % 2 === 0 ? `${K.orange}18` : 'transparent', display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px', boxSizing: 'border-box', opacity: rp, transform: `translateY(${(1 - rp) * -14}px)` }}>
              {r.slug ? <BrandLogo slug={r.slug} size={64} /> : <div style={{ width: 18, height: 18, borderRadius: 999, background: K.orange, margin: '0 23px' }} />}
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: K.ink, whiteSpace: 'nowrap' }}>{r.text}</span>
            </div>
          );
        })}
      </div>
      {below && <div style={{ ...abs, left: 0, right: 0, top: y + H + 40, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 54, color: K.ink, opacity: bp * 0.9, transform: `translateY(${(1 - bp) * 18}px)` }}>{below}</div>}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// registry
// ═════════════════════════════════════════════════════════════════════════════════════════
const none = (): SfxCue[] => [];
const bb = (x0: number, y0: number, x1: number, y1: number): Box => ({ x0, y0, x1, y1 });

export const FX_MOTIONFX = {
  cameraJourney: { C: CameraJourney, sfx: none, frame: true },
  flight3d: { C: Flight3d, sfx: none, frame: true },
  overwhelm: { C: Overwhelm, sfx: none, frame: true },
  themeMorph: { C: ThemeMorph, sfx: none, frame: true },
  outward: {
    C: Outward, sfx: none,
    box: (p: OutwardProps) => { const r = p.radius ?? 330, y = p.y ?? 760; return bb(540 - r - 100, y - r - 100, 540 + r + 100, y + r + 100); },
  },
  particles: {
    C: Particles, sfx: none,
    box: (p: ParticlesProps) => { const y = p.y ?? 760; return bb(100, y - 450, 980, y + 450); },
  },
  glitch: {
    C: Glitch, sfx: none,
    box: (p: GlitchProps) => { const y = p.y ?? 760; const s = glitchSize(p); return bb(540 - s.w / 2 - 40, y - s.h / 2, 540 + s.w / 2 + 40, y + s.h / 2); },
  },
  streak: {
    C: Streak, sfx: none,
    box: (p: StreakProps) => {
      const y = p.y ?? 560, gap = p.gap ?? 30, n = p.items.length;
      const w = Math.max(300, ...p.items.map(pillW));
      return bb(540 - w / 2, y, 540 + w / 2, y + n * PILL_H + Math.max(0, n - 1) * gap);
    },
  },
  glow: {
    C: Glow, sfx: none,
    box: (p: GlowProps) => { const y = p.y ?? 760; return bb(540 - 470, y - 300, 540 + 470, y + 300); },
  },
  scaleSwap: {
    C: ScaleSwap, sfx: none,
    box: (p: ScaleSwapProps) => { const y = p.y ?? 760; return bb(540 - 380, y - 240, 540 + 380, y + 240); },
  },
  press: {
    C: Press, sfx: none,
    box: (p: PressProps) => { const y = p.y ?? 760; return bb(540 - 370, y - 120, 540 + 370, y + 120 + (p.sub ? 110 : 0)); },
  },
  displace: {
    C: Displace, sfx: none,
    box: (p: DisplaceProps) => { const y = p.y ?? 760; return bb(540 - 390, y - 230, 540 + 390, y + 230); },
  },
  waterfall: {
    C: Waterfall, sfx: none,
    box: (p: WaterfallProps) => {
      const y = p.y ?? 760, size = p.size ?? 130;
      const w = Math.min(1040, Math.max(300, ...p.lines.map((l) => textW(l, size, 0.56))));
      const h = p.lines.length * size * 1.12;
      return bb(540 - w / 2, y - h / 2, 540 + w / 2, y + h / 2);
    },
  },
  expand: {
    C: Expand, sfx: none,
    box: (p: ExpandProps) => { const y = p.y ?? 560; return bb(540 - EX.W / 2, y, 540 + EX.W / 2, y + EX.HH + p.rows.length * EX.RH + EX.PAD + (p.below ? 130 : 0)); },
  },
};
