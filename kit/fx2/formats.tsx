// Script-shaped formats (clean-room rewrite): versus, top5, tierList, ifThen, rapidList, proof, backdrop, chapter.
// Each one gives a script a visual skeleton. Authored on 1080x1920; pure functions of t.
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
const fill: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: H };
const none = (): SfxCue[] => [];
const shadowCard = '0 30px 60px -24px rgba(15,23,42,0.35), 0 2px 8px rgba(15,23,42,0.08)';
const card: React.CSSProperties = { background: K.panel, border: `1px solid ${C.border}`, boxShadow: shadowCard, boxSizing: 'border-box' };
const outAlpha = (t: number, E: number) => 1 - M.exit(t, E - 0.3);
const fitSize = (len: number, base: number, maxW: number, k = 0.56) => Math.min(base, maxW / (Math.max(1, len) * k));
const GREEN = C.green;
const RED = C.red;

const Title: React.FC<{ t: number; S: number; y: number; text?: string }> = ({ t, S, y, text }) =>
  text ? (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y - 110, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fitSize(text.length, 64, 960, 0.54), letterSpacing: -2, color: K.ink, opacity: M.enter(t, S, 0.4), transform: `translateY(${(1 - M.enter(t, S, 0.4)) * 30}px)` }}>{text}</div>
  ) : null;

// ── versus ───────────────────────────────────────────────────────────────────────────────
type Tone = 'bad' | 'good' | 'navy';
export type VersusSide = { label: string; tone?: Tone };
export type VersusProps = { title?: string; y?: number; left: VersusSide; right: VersusSide; at?: number; rightAt?: number; vsAt?: number; winner?: 'left' | 'right'; winnerAt?: number };
const toneStyle = (tone: Tone | undefined, def: Tone) => {
  const k = tone ?? def;
  if (k === 'good') return { bg: K.panel, fg: K.ink, accent: GREEN, icon: 'check' };
  if (k === 'navy') return { bg: K.navy, fg: '#fff', accent: K.orange, icon: 'zap' };
  return { bg: K.panel, fg: K.ink, accent: RED, icon: 'x' };
};
export const Versus: React.FC<Base & VersusProps> = ({ t, S, E, title, y = 620, left, right, at, rightAt, vsAt, winner, winnerAt }) => {
  const a = at ?? S + 0.15;
  const ra = rightAt ?? a + 0.2;
  const va = vsAt ?? ra + 0.25;
  const cw = 450, ch = 520;
  const sides = [
    { s: left, x: 60, from: -1, at: a, def: 'bad' as Tone, key: 'left' },
    { s: right, x: W - 60 - cw, from: 1, at: ra, def: 'good' as Tone, key: 'right' },
  ];
  const wp = winner && winnerAt != null ? ease.outCubic(lin(t, winnerAt, 0.4)) : 0;
  const vp = M.pop(t, va, 0.45);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <Title t={t} S={S} y={y} text={title} />
      {sides.map((c) => {
        const st = toneStyle(c.s.tone, c.def);
        const p = M.pop(t, c.at, 0.5);
        const lost = winner && winner !== c.key ? wp : 0;
        const won = winner === c.key ? wp : 0;
        return (
          <div key={c.key} style={{ ...card, position: 'absolute', left: c.x, top: y, width: cw, height: ch, borderRadius: 48, background: st.bg, borderTop: `14px solid ${st.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, padding: 30, fontFamily: FONT, opacity: clamp(p * 2, 0, 1) * (1 - 0.55 * lost), transform: `translateX(${c.from * (1 - p) * 500}px) scale(${(0.9 + 0.1 * p) * (1 + 0.04 * won - 0.04 * lost)})`, filter: lost ? `grayscale(${lost})` : undefined }}>
            <div style={{ width: 120, height: 120, borderRadius: 999, background: st.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={st.icon} size={72} color="#fff" sw={3.4} /></div>
            <div style={{ fontWeight: 900, fontSize: fitSize(c.s.label.length / 1.6, 76, cw - 60, 0.56), color: st.fg, textAlign: 'center', lineHeight: 1.05, letterSpacing: -2 }}>{c.s.label}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: W / 2 - 62, top: y + ch / 2 - 62, width: 124, height: 124, borderRadius: 999, background: K.orange, color: '#fff', border: `8px solid ${K.bg}`, fontFamily: FONT, fontWeight: 900, fontSize: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(vp * 2, 0, 1), transform: `scale(${vp}) rotate(${(1 - vp) * -40}deg)`, boxShadow: shadowCard }}>VS</div>
    </div>
  );
};
const versusBox = (p: VersusProps): Box => { const y = p.y ?? 620; return { x0: 50, y0: y - (p.title ? 120 : 20), x1: 1030, y1: y + 540 }; };

// ── top5 ─────────────────────────────────────────────────────────────────────────────────
export type Top5Props = { title?: string; y?: number; items: { rank: number; text: string; slug?: string; at: number }[] };
const T5_H = 124, T5_GAP = 20;
export const Top5: React.FC<Base & Top5Props> = ({ t, S, E, title, y = 600, items }) => (
  <div style={{ ...fill, opacity: outAlpha(t, E) }}>
    <Title t={t} S={S} y={y} text={title} />
    {items.map((it, i) => {
      const p = M.pop(t, it.at, 0.45);
      const first = it.rank === 1;
      return (
        <div key={i} style={{ ...card, position: 'absolute', left: 70, top: y + i * (T5_H + T5_GAP), width: 940, height: T5_H, borderRadius: 36, background: first ? K.orange : K.panel, display: 'flex', alignItems: 'center', gap: 26, padding: '0 26px', fontFamily: FONT, opacity: clamp(p * 2, 0, 1), transform: `translateX(${(1 - p) * -420}px) scale(${0.92 + 0.08 * p})` }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: first ? '#fff' : K.navy, color: first ? K.orange : '#fff', fontWeight: 900, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{it.rank}</div>
          <div style={{ flex: 1, fontWeight: 800, fontSize: fitSize(it.text.length, 54, it.slug ? 600 : 740, 0.54), color: first ? '#fff' : K.ink, letterSpacing: -1, whiteSpace: 'nowrap' }}>{it.text}</div>
          {it.slug && <div style={{ flex: '0 0 auto', transform: 'scale(0.62)', transformOrigin: 'right center', width: 90 }}><BrandLogo slug={it.slug} size={140} /></div>}
        </div>
      );
    })}
  </div>
);
const top5Box = (p: Top5Props): Box => { const y = p.y ?? 600; return { x0: 60, y0: y - (p.title ? 120 : 10), x1: 1020, y1: y + p.items.length * (T5_H + T5_GAP) }; };

// ── tierList ─────────────────────────────────────────────────────────────────────────────
export type TierProps = { title?: string; y?: number; tiers?: string[]; items: { tier: string; text: string; slug?: string; at: number }[] };
const TIER_COLORS = ['#E15A36', '#F97316', '#F2B01E', '#2EA56A', '#3B82F6', '#8A5CF6'];
const TIER_H = 132, TIER_GAP = 12, TIER_W = 960;
const chipW = (text: string, slug?: string) => text.length * 24 + 56 + (slug ? 64 : 0);
export const TierList: React.FC<Base & TierProps> = ({ t, S, E, title, y = 600, tiers = ['S', 'A', 'B', 'C', 'D'], items }) => {
  const rowsP = M.enter(t, S, 0.5);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <Title t={t} S={S} y={y} text={title} />
      {tiers.map((tier, r) => {
        const col = TIER_COLORS[r % TIER_COLORS.length];
        const mine = items.filter((it) => it.tier === tier);
        let cx = 0;
        const p = ease.outCubic(lin(t, S + r * 0.06, 0.4));
        return (
          <div key={tier} style={{ position: 'absolute', left: (W - TIER_W) / 2, top: y + r * (TIER_H + TIER_GAP), width: TIER_W, height: TIER_H, borderRadius: 30, overflow: 'hidden', display: 'flex', ...card, opacity: p * rowsP, transform: `translateX(${(1 - p) * -200}px)` }}>
            <div style={{ width: 130, background: col, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{tier}</div>
            <div style={{ position: 'relative', flex: 1 }}>
              {mine.map((it, k) => {
                const w = chipW(it.text, it.slug);
                const x = 16 + cx;
                cx += w + 12;
                const ip = M.pop(t, it.at, 0.4);
                return (
                  <div key={k} style={{ position: 'absolute', left: x, top: 26, height: 80, width: w, borderRadius: 24, background: `${col}22`, border: `3px solid ${col}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: K.ink, whiteSpace: 'nowrap', opacity: clamp(ip * 2, 0, 1), transform: `scale(${0.4 + 0.6 * ip}) translateY(${(1 - ip) * -50}px)` }}>
                    {it.slug && <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ transform: 'scale(0.37)', transformOrigin: 'center', flex: '0 0 auto' }}><BrandLogo slug={it.slug} size={140} /></div></div>}
                    {it.text}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const tierBox = (p: TierProps): Box => { const y = p.y ?? 600, n = (p.tiers ?? ['S', 'A', 'B', 'C', 'D']).length; return { x0: 60, y0: y - (p.title ? 120 : 10), x1: 1020, y1: y + n * (TIER_H + TIER_GAP) }; };

// ── ifThen ───────────────────────────────────────────────────────────────────────────────
export type IfThenProps = { title?: string; y?: number; steps: { label: string; text: string; at: number }[] };
const IT_H = 190, IT_GAP = 54;
const stepColor = (label: string, i: number) => {
  const l = label.toLowerCase();
  if (l === 'if' || i === 0) return K.navy;
  if (l === 'else' || l === 'not' || l === 'but') return RED;
  return K.orange;
};
export const IfThen: React.FC<Base & IfThenProps> = ({ t, S, E, title, y = 600, steps }) => (
  <div style={{ ...fill, opacity: outAlpha(t, E) }}>
    <Title t={t} S={S} y={y} text={title} />
    {steps.map((s, i) => {
      const p = M.pop(t, s.at, 0.45);
      const col = stepColor(s.label, i);
      const top = y + i * (IT_H + IT_GAP);
      const next = steps[i + 1];
      const line = next ? ease.outCubic(lin(t, next.at - 0.25, 0.25)) : 0;
      return (
        <React.Fragment key={i}>
          <div style={{ ...card, position: 'absolute', left: 70, top, width: 940, height: IT_H, borderRadius: 40, display: 'flex', alignItems: 'center', gap: 30, padding: '0 34px', fontFamily: FONT, opacity: clamp(p * 2, 0, 1), transform: `translateY(${(1 - p) * 50}px) scale(${0.92 + 0.08 * p})` }}>
            <div style={{ background: col, color: '#fff', fontWeight: 900, fontSize: 44, letterSpacing: 4, textTransform: 'uppercase', padding: '16px 28px', borderRadius: 22, flex: '0 0 auto' }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: fitSize(s.text.length / 1.9, 54, 600, 0.52), color: K.ink, lineHeight: 1.1, letterSpacing: -1 }}>{s.text}</div>
          </div>
          {next && (
            <div style={{ position: 'absolute', left: W / 2 - 4, top: top + IT_H, width: 8, height: IT_GAP * line, background: col, borderRadius: 4 }}>
              <div style={{ position: 'absolute', left: -12, bottom: -10, width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: `20px solid ${col}`, opacity: line > 0.9 ? 1 : 0 }} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);
const ifThenBox = (p: IfThenProps): Box => { const y = p.y ?? 600, n = p.steps.length; return { x0: 60, y0: y - (p.title ? 120 : 10), x1: 1020, y1: y + n * IT_H + (n - 1) * IT_GAP }; };

// ── rapidList ────────────────────────────────────────────────────────────────────────────
export type RapidProps = { title?: string; y?: number; cols?: number; items: { text: string; at: number }[] };
const RL_H = 108, RL_GAP = 18;
export const RapidList: React.FC<Base & RapidProps> = ({ t, S, E, title, y = 600, cols = 2, items }) => {
  const cw = (960 - (cols - 1) * RL_GAP) / cols;
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <Title t={t} S={S} y={y} text={title} />
      {items.map((it, i) => {
        const p = M.pop(t, it.at, 0.3);
        const hot = 1 - lin(t, it.at + 0.15, 0.45);      // newest item glows orange, then settles
        const r = Math.floor(i / cols), c = i % cols;
        return (
          <div key={i} style={{ ...card, position: 'absolute', left: 60 + c * (cw + RL_GAP), top: y + r * (RL_H + RL_GAP), width: cw, height: RL_H, borderRadius: 30, background: hot > 0 && t >= it.at ? K.orange : K.panel, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', fontFamily: FONT, fontWeight: 800, fontSize: fitSize(it.text.length, 44, cw - 110, 0.56), color: hot > 0.5 && t >= it.at ? '#fff' : K.ink, whiteSpace: 'nowrap', opacity: clamp(p * 2.5, 0, 1), transform: `scale(${0.7 + 0.3 * p})` }}>
            <div style={{ width: 14, height: 14, borderRadius: 99, background: hot > 0.5 && t >= it.at ? '#fff' : K.orange, flex: '0 0 auto' }} />
            {it.text}
          </div>
        );
      })}
    </div>
  );
};
const rapidBox = (p: RapidProps): Box => { const y = p.y ?? 600, cols = p.cols ?? 2, rows = Math.ceil(p.items.length / cols); return { x0: 50, y0: y - (p.title ? 120 : 10), x1: 1030, y1: y + rows * (RL_H + RL_GAP) }; };

// ── proof ────────────────────────────────────────────────────────────────────────────────
export type ProofCard = { src?: string; at: number; caption?: string; stat?: string; name?: string; ratio?: number };
export type ProofProps = { title?: string; y?: number; cards: ProofCard[] };
const proofGeom = (p: ProofProps) => {
  const n = Math.max(1, p.cards.length);
  const gap = 28;
  const maxH = (n === 1 ? 700 : n === 2 ? 440 : 320);
  const ratio = p.cards[0]?.ratio ?? 0.62;
  const w = Math.min(900, maxH / ratio);
  return { n, gap, w, h: w * ratio };
};
export const Proof: React.FC<Base & ProofProps> = ({ t, S, E, title, y = 600, cards }) => {
  const g = proofGeom({ cards });
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <Title t={t} S={S} y={y} text={title} />
      {cards.map((c, i) => {
        const p = M.pop(t, c.at, 0.5);
        const tick = M.pop(t, c.at + 0.35, 0.4);
        const tilt = (i % 2 === 0 ? -1 : 1) * (g.n > 1 ? 1.5 : 1);
        return (
          <div key={i} style={{ ...card, position: 'absolute', left: (W - g.w) / 2, top: y + i * (g.h + g.gap), width: g.w, height: g.h, borderRadius: 36, overflow: 'visible', opacity: clamp(p * 2, 0, 1), transform: `translateY(${(1 - p) * 80}px) rotate(${tilt * p}deg) scale(${0.9 + 0.1 * p})` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 36, overflow: 'hidden' }}>
              {c.src ? <Img src={staticFile(c.src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${K.panel}, ${K.bg})`, padding: 36, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ width: 64, height: 64, borderRadius: 99, background: K.navy }} /><div style={{ width: 220, height: 22, borderRadius: 99, background: C.border }} /></div>
                  <div style={{ width: '88%', height: 22, borderRadius: 99, background: C.border }} />
                  <div style={{ width: '64%', height: 22, borderRadius: 99, background: C.border }} />
                  {c.stat && <div style={{ marginTop: 'auto', fontFamily: FONT, fontWeight: 900, fontSize: 96, color: K.orange, letterSpacing: -3 }}>{c.stat}</div>}
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', right: -18, top: -22, width: 76, height: 76, borderRadius: 99, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${tick})`, boxShadow: shadowCard }}><Ic n="check" size={46} color="#fff" sw={4} /></div>
            {(c.caption || (c.src && c.stat)) && (
              <div style={{ position: 'absolute', left: '50%', bottom: -30, transform: `translateX(-50%) scale(${M.pop(t, c.at + 0.25, 0.4)})`, background: K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 44, padding: '10px 32px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: shadowCard }}>{c.caption ?? c.stat}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
const proofBox = (p: ProofProps): Box => { const y = p.y ?? 600, g = proofGeom(p); return { x0: (W - g.w) / 2 - 30, y0: y - (p.title ? 120 : 30), x1: (W + g.w) / 2 + 30, y1: y + g.n * g.h + (g.n - 1) * g.gap + 50 }; };

// ── backdrop (full frame) ────────────────────────────────────────────────────────────────
export type BackdropProps = { word?: string; slug?: string; src?: string; tone?: 'orange' | 'navy' | 'light'; y?: number; frame?: { w: number; h: number } };
export const Backdrop: React.FC<Base & BackdropProps> = ({ t, S, E, word, slug, src, tone = 'orange', y, frame }) => {
  const fw = frame?.w ?? W, fh = frame?.h ?? H;
  const bg = tone === 'navy' ? K.navy : tone === 'light' ? K.bg : K.orange;
  const ink = tone === 'light' ? K.ink : '#fff';
  const a = M.enter(t, S, 0.3) * (1 - M.exit(t, E - 0.3));
  const cy = y ?? fh * 0.34;
  const rows = 6;
  const sz = word ? fitSize(word.length, 260, fw * 0.95, 0.62) : 0;
  const lp = M.pop(t, S + 0.15, 0.5);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: fw, height: fh, background: bg, opacity: a, overflow: 'hidden' }}>
      {src && <Img src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />}
      {word && Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ position: 'absolute', left: 0, top: cy - (rows / 2 - r) * sz * 0.95 - sz * 0.5, width: fw, whiteSpace: 'nowrap', fontFamily: FONT, fontWeight: 900, fontSize: sz, letterSpacing: -sz * 0.03, lineHeight: 1, color: ink, opacity: r === Math.floor(rows / 2) ? 0.2 : 0.08, textTransform: 'uppercase', transform: `translateX(${(r % 2 ? 1 : -1) * ((t - S) * 40) - sz}px)` }}>
          {Array.from({ length: 4 }, () => word).join('  ')}
        </div>
      ))}
      {slug && (
        <div style={{ position: 'absolute', left: fw / 2, top: cy, transform: `translate(-50%,-50%) scale(${0.5 + 0.5 * lp})`, opacity: clamp(lp * 2, 0, 1) }}>
          <BrandLogo slug={slug} size={300} />
        </div>
      )}
    </div>
  );
};

// ── chapter ──────────────────────────────────────────────────────────────────────────────
export type ChapterProps = { n: number | string; label?: string; title: string; y?: number };
export const Chapter: React.FC<Base & ChapterProps> = ({ t, S, E, n, label = 'Part', title, y = 600 }) => {
  const p = M.pop(t, S, 0.5);
  const rule = ease.outCubic(lin(t, S + 0.2, 0.5));
  const tp = ease.outCubic(lin(t, S + 0.3, 0.5));
  const sz = fitSize(title.length, 112, 940, 0.54);
  return (
    <div style={{ ...fill, opacity: outAlpha(t, E) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity: clamp(p * 2, 0, 1), transform: `scale(${0.6 + 0.4 * p})` }}>
          <div style={{ width: 150, height: 150, borderRadius: 44, background: K.orange, color: '#fff', fontWeight: 900, fontSize: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadowCard }}>{n}</div>
          <div style={{ fontWeight: 800, fontSize: 52, letterSpacing: 10, textTransform: 'uppercase', color: K.navy }}>{label}</div>
        </div>
        <div style={{ height: 8, width: 520 * rule, background: K.orange, borderRadius: 4 }} />
        <div style={{ overflow: 'hidden', paddingBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: sz, letterSpacing: -3, lineHeight: 1.05, color: K.ink, textAlign: 'center', transform: `translateY(${(1 - tp) * 120}px)`, opacity: tp }}>{title}</div>
        </div>
      </div>
    </div>
  );
};
const chapterBox = (p: ChapterProps): Box => { const y = p.y ?? 600; return { x0: 60, y0: y, x1: 1020, y1: y + 150 + 26 + 8 + 26 + 140 }; };

// ── registry ─────────────────────────────────────────────────────────────────────────────
export const FORMAT_ELEMENTS = {
  versus: { C: Versus, sfx: none, box: versusBox },
  top5: { C: Top5, sfx: none, box: top5Box },
  tierList: { C: TierList, sfx: none, box: tierBox },
  ifThen: { C: IfThen, sfx: none, box: ifThenBox },
  rapidList: { C: RapidList, sfx: none, box: rapidBox },
  proof: { C: Proof, sfx: none, box: proofBox },
  backdrop: { C: Backdrop, sfx: none, frame: true },
  chapter: { C: Chapter, sfx: none, box: chapterBox },
};
