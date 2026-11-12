// Family 10 · keyword animations (v3): small, original scenes cued by a spoken word. All are full-frame (frame:true), light-theme
// friendly (navy + orange) and live in the top band of the frame (above the head) unless y says otherwise.
//   plug  : the Claude mark and the WiseFunnel mark slide together and plug in (spark, glow, "CONNECTED")
//   scan  : a magnifier sweeps across competitor chips, each one gets "scanned"
//   brand : a brand kit lands: logo tile + type specimen + colour swatches popping in
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT } from '../tokens';
import { STACK as K } from '../stack';
import { clamp, ease, lin } from '../motion';
import { BRANDS } from '../brands';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number };
const tileStyle: React.CSSProperties = { position: 'absolute', background: K.panel, border: `1px solid ${C.border}`, boxShadow: '0 30px 60px -22px rgba(15,23,42,0.35), 0 2px 8px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' };
const fade = (t: number, S: number, E: number) => lin(t, S, 0.2) * (1 - lin(t, E - 0.2, 0.2));

// ── plug ─────────────────────────────────────────────────────────────────────────────────
export type PlugProps = { at: number; y?: number; label?: string };
export const Plug: React.FC<Base & PlugProps> = ({ t, S, E, at, y = 330, label = 'CONNECTED' }) => {
  const T = 210, PR = 78, DFIN = 140;
  const approach = ease.outCubic(lin(t, S, Math.max(0.3, at - 0.22 - S)));
  const snap = ease.inCubic(lin(t, at - 0.22, 0.22));
  const dApproach = 560 - (560 - 300) * approach;                 // centres come in from the edges to 300 apart
  const after = t - at;
  const bounce = after > 0 ? Math.sin(after * 22) * 7 * Math.exp(-after * 9) : 0;
  const d = (t < at - 0.22 ? dApproach : dApproach + (DFIN - dApproach) * snap) + bounce;
  const hit = ease.outCubic(lin(t, at, 0.5));
  const on = t >= at;
  const claude = BRANDS.claude;
  const cy = y;
  const rays = Array.from({ length: 12 }, (_, k) => k * 30);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E) }}>
      {/* cables run off-screen behind each tile */}
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={`M ${540 - d - T / 2} ${cy} C ${540 - d - 220} ${cy - 90}, ${540 - d - 300} ${cy + 90}, -20 ${cy + 40}`} stroke={K.navy} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d={`M ${540 + d + T / 2} ${cy} C ${540 + d + 220} ${cy - 90}, ${540 + d + 300} ${cy + 90}, 1100 ${cy + 40}`} stroke={K.navy} strokeWidth={14} fill="none" strokeLinecap="round" />
        {on && <>
          <path d={`M ${540 - d - T / 2} ${cy} C ${540 - d - 220} ${cy - 90}, ${540 - d - 300} ${cy + 90}, -20 ${cy + 40}`} stroke={K.orange} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="2 26" strokeDashoffset={(t - at) * 160} />
          <path d={`M ${540 + d + T / 2} ${cy} C ${540 + d + 220} ${cy - 90}, ${540 + d + 300} ${cy + 90}, 1100 ${cy + 40}`} stroke={K.orange} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="2 26" strokeDashoffset={-(t - at) * 160} />
        </>}
      </svg>
      {/* left: Claude with the plug prongs */}
      <div style={{ ...tileStyle, left: 540 - d - T / 2, top: cy - T / 2, width: T, height: T, borderRadius: 54 }}>
        <svg width={T * 0.56} height={T * 0.56} viewBox="0 0 24 24"><path d={claude.path} fill={claude.hex} /></svg>
      </div>
      <div style={{ position: 'absolute', left: 540 - d + T / 2 - 4, top: cy - 24, width: 30, height: 48, background: K.navy, borderRadius: 10 }} />
      <div style={{ position: 'absolute', left: 540 - d + T / 2 + 20, top: cy - 22, width: PR - 20, height: 14, background: '#8A97A6', borderRadius: 6 }} />
      <div style={{ position: 'absolute', left: 540 - d + T / 2 + 20, top: cy + 8, width: PR - 20, height: 14, background: '#8A97A6', borderRadius: 6 }} />
      {/* right: WiseFunnel with the socket */}
      <div style={{ ...tileStyle, left: 540 + d - T / 2, top: cy - T / 2, width: T, height: T, borderRadius: 54, boxShadow: on ? `0 0 0 ${10 * (1 - hit) + 4}px ${K.orange}55, 0 30px 60px -22px rgba(15,23,42,0.35)` : tileStyle.boxShadow }}>
        <Img src={staticFile('logo.png')} style={{ width: T * 0.6, height: T * 0.6, objectFit: 'contain' }} />
      </div>
      <div style={{ position: 'absolute', left: 540 + d - T / 2 - 4, top: cy - 30, width: 18, height: 60, background: '#0F1B27', borderRadius: 8 }} />
      {/* spark at the contact point */}
      {on && (
        <div style={{ position: 'absolute', left: 540, top: cy, width: 0, height: 0 }}>
          <div style={{ position: 'absolute', left: -90 * (0.3 + hit), top: -90 * (0.3 + hit), width: 180 * (0.3 + hit), height: 180 * (0.3 + hit), borderRadius: 999, border: `${10 * (1 - hit) + 1}px solid ${K.orange}`, opacity: 1 - hit }} />
          {rays.map((a) => (
            <div key={a} style={{ position: 'absolute', left: 0, top: -5, width: 60 * (1 - hit * 0.5), height: 10, borderRadius: 5, background: a % 60 === 0 ? K.orange : K.navy, opacity: 1 - hit, transformOrigin: '0 50%', transform: `rotate(${a}deg) translateX(${50 + 150 * hit}px)` }} />
          ))}
          <div style={{ position: 'absolute', left: -44, top: -44, width: 88, height: 88, borderRadius: 999, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ease.outBack(lin(t, at + 0.05, 0.3))})`, boxShadow: '0 12px 30px -8px rgba(249,115,22,0.7)' }}>
            <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" fill="#fff" /></svg>
          </div>
        </div>
      )}
      {on && <div style={{ position: 'absolute', left: 0, right: 0, top: cy + T / 2 + 36, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: 8, color: K.orange, opacity: ease.outCubic(lin(t, at + 0.2, 0.3)), transform: `translateY(${(1 - ease.outCubic(lin(t, at + 0.2, 0.3))) * 20}px)` }}>{label}</div>}
    </div>
  );
};

// ── scan ─────────────────────────────────────────────────────────────────────────────────
export type ScanProps = { items: { label: string; slug?: string; at: number }[]; y?: number; heading?: string };
export const Scan: React.FC<Base & ScanProps> = ({ t, S, E, items, y = 330, heading = 'COMPETITORS' }) => {
  const W = 300, GAP = 24, n = items.length, total = n * W + (n - 1) * GAP, x0 = 540 - total / 2;
  const centers = items.map((_, i) => x0 + i * (W + GAP) + W / 2);
  // the magnifier glides to each item's time
  let mx = centers[0] - 200;
  const knots = [{ at: S, x: centers[0] - 260 }, ...items.map((it, i) => ({ at: it.at, x: centers[i] }))];
  for (let i = 0; i < knots.length - 1; i++) if (t >= knots[i].at) mx = knots[i].x + (knots[i + 1].x - knots[i].x) * ease.inOutCubic(lin(t, knots[i].at, Math.max(0.2, (knots[i + 1].at - knots[i].at) * 0.8)));
  if (t >= knots[knots.length - 1].at) mx = knots[knots.length - 1].x;
  const hot = items.findIndex((it, i) => t >= it.at && t < (items[i + 1]?.at ?? 1e9));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 150, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 36, letterSpacing: 10, color: K.orange, opacity: ease.outCubic(lin(t, S, 0.3)) }}>{heading}</div>
      {items.map((it, i) => {
        const p = ease.outBack(lin(t, S + i * 0.08, 0.35));
        const scanned = t >= it.at + 0.12, isHot = hot === i;
        return (
          <div key={i} style={{ ...tileStyle, left: x0 + i * (W + GAP), top: y - 56, width: W, height: 112, borderRadius: 30, gap: 12, transform: `scale(${p * (isHot ? 1.1 : 1)})`, boxShadow: `0 0 0 ${scanned ? 5 : 0}px ${K.orange}, 0 24px 44px -18px rgba(15,23,42,0.4)`, opacity: clamp(p * 2, 0, 1) }}>
            {it.slug && BRANDS[it.slug] && <svg width={46} height={46} viewBox="0 0 24 24"><path d={BRANDS[it.slug].path} fill={BRANDS[it.slug].hex} /></svg>}<div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: -1, color: K.navy }}>{it.label}</div>
            {scanned && <div style={{ position: 'absolute', right: -14, top: -14, width: 44, height: 44, borderRadius: 999, background: K.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ease.outBack(lin(t, it.at + 0.12, 0.25))})` }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: mx - 70, top: y + 30 + Math.sin(t * 7) * 6, opacity: ease.outCubic(lin(t, S + 0.2, 0.3)) }}>
        <svg width={140} height={140} viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)" stroke={K.navy} strokeWidth={2.4} strokeLinecap="round" style={{ filter: 'drop-shadow(0 10px 14px rgba(15,23,42,0.3))' }}><circle cx={11} cy={11} r={7} /><path d="m21 21-4.3-4.3" strokeWidth={3.2} stroke={K.orange} /></svg>
      </div>
    </div>
  );
};

// ── brand ────────────────────────────────────────────────────────────────────────────────
export type BrandKitProps = { at: number; y?: number; colors?: string[]; heading?: string };
export const BrandKit: React.FC<Base & BrandKitProps> = ({ t, S, E, at, y = 330, colors = [K.orange, K.navy, '#2563EB', '#22C55E'], heading = 'BRAND KIT' }) => {
  const tile = ease.outBack(lin(t, at, 0.4));
  const aa = ease.outBack(lin(t, at + 0.15, 0.4));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade(t, S, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 170, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 36, letterSpacing: 10, color: K.orange, opacity: ease.outCubic(lin(t, at, 0.3)) }}>{heading}</div>
      <div style={{ ...tileStyle, left: 70, top: y - 95, width: 190, height: 190, borderRadius: 52, transform: `scale(${tile})` }}>
        <Img src={staticFile('logo.png')} style={{ width: 114, height: 114, objectFit: 'contain' }} />
      </div>
      <div style={{ ...tileStyle, left: 290, top: y - 95, width: 190, height: 190, borderRadius: 52, transform: `scale(${aa})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, letterSpacing: -4, color: K.navy }}>A<span style={{ color: K.orange }}>a</span></div>
      </div>
      {colors.map((c, i) => {
        const p = ease.outBack(lin(t, at + 0.3 + i * 0.12, 0.4));
        return <div key={i} style={{ position: 'absolute', left: 520 + i * 126, top: y - 58 + (1 - p) * -70, width: 100, height: 116, borderRadius: 999, background: c, border: '4px solid #fff', boxShadow: '0 16px 30px -12px rgba(15,23,42,0.5)', transform: `scale(${p}) rotate(${(1 - p) * 20}deg)`, opacity: clamp(p * 2, 0, 1) }} />;
      })}
    </div>
  );
};

const none = (): SfxCue[] => [];
export const FX_KW = {
  plug: { C: Plug, sfx: none, frame: true },
  scan: { C: Scan, sfx: none, frame: true },
  brandKit: { C: BrandKit, sfx: none, frame: true },
};
