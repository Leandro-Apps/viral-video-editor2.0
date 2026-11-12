import React from 'react';
import { C, CARD, EYEBROW, FONT, HAND, MONO, SHADOW } from './tokens';
import { appear, clamp, ease, kick, lin, M, popIn, shake } from './motion';
import { Ic, Logo, Tile } from './Icon';
import type { SfxCue } from './Stage';
import { Piece, PieceName, Tag, TagTone, PAPER } from './paper';
import { BrandLogo, REAL_ELEMENTS } from './real';
import { FORMAT_ELEMENTS } from './fx2/formats';
import { FX } from './fx';

// Every element: ({t, S, E, ...props}) — t = now, S = enter time, E = exit time (seconds).
// Every element also declares its default sounds (sfx), timed to the exact moment it lands.

type Base = { t: number; S: number; E: number };
const fill: React.CSSProperties = { position: 'absolute', inset: 0 };
const pillBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 26, background: '#fff', borderRadius: 999, padding: '20px 48px 20px 20px', boxShadow: SHADOW, border: `1px solid ${C.border}` };
const toneColor = { red: C.red, green: C.green, orange: C.orange, dark: C.navy } as const;

// ── 1 · Pill: one-line statement with an icon dot (hook, problem, answer) ─────────
export type PillProps = { text: string; icon?: string; tone?: keyof typeof toneColor; y?: number; hits?: number[]; heavy?: boolean };
export const Pill: React.FC<Base & PillProps> = ({ t, S, E, text, icon = 'x', tone = 'red', y = 1150, hits = [] }) => {
  const k = kick(t, hits, 0.07);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...appear(t, S, E), display: 'flex' }}>
        <div style={{ ...pillBox, transform: `scale(${1 + k})` }}>
          <div style={{ width: 100, height: 100, borderRadius: 999, background: toneColor[tone], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic n={icon} size={56} color="#fff" sw={3} />
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, letterSpacing: -2, color: C.ink, whiteSpace: 'nowrap' }}>{text}</div>
        </div>
      </div>
    </div>
  );
};
const pillSfx = (p: PillProps, S: number): SfxCue[] =>
  p.heavy ? [{ name: 'dramatic-sting', at: S }] : [{ name: 'click', at: S + 0.05 }];

// ── 2 · Notifications: phone-style cards dropping from the top, stacked ──────────
export type NotifProps = { items: { title: string; sub: string; badge?: string; at: number }[]; y?: number };
export const Notifications: React.FC<Base & NotifProps> = ({ t, S, E, items, y = 150 }) => (
  <>
    {items.map((it, i) => {
      const landed = items.slice(i + 1).filter((n) => t >= n.at).length; // cards that arrived after me push me down
      const push = landed * 222;
      const shrink = 1;
      return (
        <div key={i} style={{ position: 'absolute', left: 60, width: 960, top: y + push, zIndex: 10 + i, transform: `scale(${shrink})`, transformOrigin: '50% 0%' }}>
          <div style={{ ...CARD, position: 'relative', ...appear(t, it.at, E, -220, 0.92), padding: 34, borderRadius: 52, display: 'flex', gap: 28, alignItems: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: 32, background: C.orangeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo size={76} /></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, letterSpacing: -1, color: C.navy }}>wisefunnel</div>
                <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 28, color: C.muted }}>now</div>
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: -1.5, color: C.ink }}>{it.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 32, color: C.muted }}>{it.sub}</div>
                {it.badge && <div style={{ ...popIn(t, it.at + 0.4, 0.3), background: C.orangeSoft, color: C.orange, borderRadius: 999, padding: '6px 18px', fontFamily: FONT, fontWeight: 900, fontSize: 28 }}>{it.badge}</div>}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </>
);
const notifSfx = (p: NotifProps): SfxCue[] => p.items.map((it) => ({ name: 'notification-ping', at: it.at + 0.12 }));

// ── 3 · Headline: heavy sans line + handwritten accent line ──────────────────────
export type HeadlineProps = { a: string; b: string; y?: number; dark?: boolean; bAt?: number };
export const Headline: React.FC<Base & HeadlineProps> = ({ t, S, E, a, b, y = 230, dark, bAt }) => {
  const out = 1 - M.exit(t, E - 0.3);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', opacity: out }}>
      <div style={{ ...popIn(t, S, 0.6), fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: -4, lineHeight: 1, color: dark ? '#fff' : C.ink }}>{a}</div>
      <div style={{ ...popIn(t, bAt ?? S + 0.35, 0.5), fontFamily: HAND, fontWeight: 700, fontSize: 130, lineHeight: 1.05, color: C.orange, transform: `${popIn(t, bAt ?? S + 0.35, 0.5).transform} rotate(-2deg)`, marginTop: 8 }}>{b}</div>
    </div>
  );
};
const headlineSfx = (p: HeadlineProps, S: number): SfxCue[] => [{ name: 'whoosh', at: S }, { name: 'click', at: (p.bAt ?? S + 0.35) + 0.05 }];

// ── 4 · StatusList: rows that pop one by one, optional stamp that slams at the end ─
export type StatusProps = { eyebrow?: string; rows: { icon: string; text: string; tone: 'red' | 'green' | 'orange' | 'dark'; at: number }[]; stamp?: { text: string; at: number }; y?: number; dark?: boolean };
export const StatusList: React.FC<Base & StatusProps> = ({ t, S, E, eyebrow, rows, stamp, y = 600, dark }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const sx = stamp ? shake(t, stamp.at, 16) : 0;
  return (
    <div style={{ ...fill, opacity: out, transform: `translateX(${sx}px)` }}>
      {eyebrow && <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 90, left: 0, right: 0, textAlign: 'center', ...EYEBROW, color: dark ? 'rgba(255,255,255,0.6)' : C.ink }}>{eyebrow}</div>}
      <div style={{ position: 'absolute', top: y, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 30 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ ...appear(t, r.at, E + 1, 40, 0.8), display: 'flex', alignItems: 'center', gap: 30, background: dark ? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : C.border}`, borderRadius: 40, padding: '26px 34px', boxShadow: dark ? 'none' : SHADOW }}>
            <Tile n={r.icon} size={100} tone={r.tone} />
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, letterSpacing: -2, color: dark ? '#fff' : C.ink }}>{r.text}</div>
          </div>
        ))}
      </div>
      {stamp && (() => {
        const p = ease.outBack(lin(t, stamp.at, 0.25));
        return (
          <div style={{ position: 'absolute', top: y + rows.length * 160 + 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: clamp(p * 3, 0, 1) }}>
            <div style={{ transform: `scale(${2.2 - 1.2 * p}) rotate(-8deg)`, border: `10px solid ${C.red}`, color: C.red, borderRadius: 26, padding: '10px 44px', fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: 4, background: 'rgba(255,255,255,0.85)' }}>{stamp.text}</div>
          </div>
        );
      })()}
    </div>
  );
};
const statusSfx = (p: StatusProps): SfxCue[] => [
  ...p.rows.map((r) => ({ name: 'click' as const, at: r.at + 0.05 })),
  ...(p.stamp ? [{ name: 'faah' as const, at: p.stamp.at }] : []),
];

// ── 5 · WordSlam: one huge word that lands on the beat (use once per video) ──────
export type SlamProps = { eyebrow: string; word: string; at: number; dark?: boolean; y?: number; size?: number };
export const WordSlam: React.FC<Base & SlamProps> = ({ t, S, E, eyebrow, word, at, dark = true, y = 760, size = 150 }) => {
  const p = ease.outBack(lin(t, at, 0.22));
  const out = 1 - M.exit(t, E - 0.3);
  const sx = shake(t, at, 22);
  const sweep = ease.outCubic(lin(t, at + 0.2, 0.5));
  return (
    <div style={{ ...fill, opacity: out, transform: `translateX(${sx}px)` }}>
      <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 120, left: 0, right: 0, textAlign: 'center', ...EYEBROW, fontSize: 36, color: dark ? 'rgba(255,255,255,0.65)' : C.muted }}>{eyebrow}</div>
      <div style={{ position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', opacity: clamp(p * 3, 0, 1), transform: `scale(${2.4 - 1.4 * p})` }}>
        <div style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size / 25, color: C.orange, textShadow: '0 0 60px rgba(249,115,22,0.45)' }}>{word}</div>
        <div style={{ height: 14, width: `${sweep * 80}%`, margin: '10px auto 0', background: C.orange, borderRadius: 7 }} />
      </div>
    </div>
  );
};
const slamSfx = (p: SlamProps): SfxCue[] => [{ name: 'core-impact', at: p.at - 0.05 }];

// ── 6 · FormToQuiz: long form gets crossed out, quiz card builds with chips ───────
export type FormQuizProps = { formAt: number; strikeAt: number; quizAt: number; chips: { text: string; icon: string; at: number }[]; result?: { text: string; at: number }; y?: number };
export const FormToQuiz: React.FC<Base & FormQuizProps> = ({ t, S, E, formAt, strikeAt, quizAt, chips, result, y = 560 }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const formGone = M.exit(t, quizAt - 0.15, 0.3);
  const strike = ease.outCubic(lin(t, strikeAt, 0.3));
  return (
    <div style={{ ...fill, opacity: out }}>
      {/* the old way: a long form */}
      <div style={{ position: 'absolute', top: y, left: 140, width: 800, opacity: 1 - formGone, transform: `translateX(${-formGone * 300}px) rotate(${-formGone * 8}deg)` }}>
        <div style={{ ...CARD, position: 'relative', ...appear(t, formAt, quizAt + 2, 50, 0.85), padding: 44, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...EYEBROW, fontSize: 24, letterSpacing: 5 }}>Contact form</div>
          {['Name', 'Email', 'Phone', 'Company', 'Message'].map((f) => (
            <div key={f} style={{ height: 84, borderRadius: 20, border: `2px solid ${C.border}`, background: '#FCFCFC', display: 'flex', alignItems: 'center', paddingLeft: 24, fontFamily: FONT, fontWeight: 600, fontSize: 36, color: '#B0B0B0' }}>{f}</div>
          ))}
          <div style={{ position: 'absolute', left: -30, right: -30, top: '50%', height: 16, borderRadius: 8, background: C.red, transform: `rotate(-14deg) scaleX(${strike})`, transformOrigin: '0% 50%' }} />
        </div>
      </div>
      {/* the new way: a short quiz */}
      <div style={{ position: 'absolute', top: y - 40, left: 110, width: 860 }}>
        <div style={{ ...CARD, position: 'relative', ...appear(t, quizAt, E + 1, 60, 0.85), padding: 48, borderRadius: 56, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ height: 14, borderRadius: 7, background: '#EEE', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(chips.filter((c) => t >= c.at).length / chips.length) * 100}%`, background: C.orange, borderRadius: 7 }} />
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: -1.8, color: C.ink }}>3 quick questions</div>
          {chips.map((c, i) => (
            <div key={i} style={{ ...popIn(t, c.at, 0.5), display: 'flex', alignItems: 'center', gap: 22, border: `3px solid ${t >= c.at + 0.3 ? C.orange : C.border}`, background: t >= c.at + 0.3 ? C.orangeSoft : '#FCFCFC', borderRadius: 28, padding: '22px 28px' }}>
              <Tile n={c.icon} size={80} tone="orange" />
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: -1.5, color: C.ink }}>{c.text}</div>
              <div style={{ flex: 1 }} />
              <div style={{ ...popIn(t, c.at + 0.3, 0.2) }}><Ic n="check" size={52} color={C.green} sw={3.4} /></div>
            </div>
          ))}
        </div>
        {result && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
            <div style={{ ...popIn(t, result.at, 0.3), display: 'flex', alignItems: 'center', gap: 16, background: C.greenSoft, color: C.green, borderRadius: 999, padding: '18px 36px', fontFamily: FONT, fontWeight: 900, fontSize: 44 }}>
              <Ic n="filter" size={44} color={C.green} sw={3} />{result.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const formQuizSfx = (p: FormQuizProps): SfxCue[] => [
  { name: 'click', at: p.formAt + 0.05 },
  { name: 'click', at: p.strikeAt },
  { name: 'whoosh', at: p.quizAt - 0.1 },
  ...p.chips.map((c) => ({ name: 'click' as const, at: c.at + 0.05 })),
  ...(p.result ? [{ name: 'ding' as const, at: p.result.at }] : []),
];

// ── 7 · StrikeSwap: old phrase gets struck, new phrase replaces it ───────────────
export type SwapProps = { from: string; to: string; strikeAt: number; toAt: number; y?: number; toSub?: string };
export const StrikeSwap: React.FC<Base & SwapProps> = ({ t, S, E, from, to, strikeAt, toAt, y = 260, toSub }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const strike = ease.outCubic(lin(t, strikeAt, 0.25));
  const fromOut = M.exit(t, toAt - 0.1, 0.25);
  return (
    <div style={{ ...fill, opacity: out }}>
      <div style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - fromOut, transform: `translateY(${-fromOut * 60}px)` }}>
        <div style={{ ...popIn(t, S, 0.6), position: 'relative', fontFamily: FONT, fontWeight: 900, fontSize: 140, letterSpacing: -6, color: C.muted }}>
          {from}
          <div style={{ position: 'absolute', left: -20, right: -20, top: '52%', height: 16, borderRadius: 8, background: C.red, transform: `scaleX(${strike})`, transformOrigin: '0% 50%' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: y - 40, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ ...popIn(t, toAt, 0.4), fontFamily: FONT, fontWeight: 900, fontSize: 124, letterSpacing: -5, lineHeight: 1, color: C.ink }}>{to}</div>
        {toSub && <div style={{ ...popIn(t, toAt + 0.3, 0.5), fontFamily: HAND, fontWeight: 700, fontSize: 170, lineHeight: 1, color: C.orange, transform: `${popIn(t, toAt + 0.3, 0.5).transform} rotate(-2deg)` }}>{toSub}</div>}
      </div>
    </div>
  );
};
const swapSfx = (p: SwapProps): SfxCue[] => [{ name: 'click', at: p.strikeAt }, { name: 'magic-reveal', at: p.toAt - 0.05 }];

// ── 8 · CTA: comment / follow keyword card on top ───────────────────────────────
export type CtaProps = { eyebrow: string; word: string; sub: string; subAt: number; y?: number };
export const Cta: React.FC<Base & CtaProps> = ({ t, S, E, eyebrow, word, sub, subAt, y = 170 }) => {
  const k = kick(t, [S + 0.05], 0.06);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: y }}>
      <div style={{ ...CARD, position: 'relative', ...appear(t, S, E, -160, 0.9), padding: '30px 44px', borderRadius: 48 }}>
        <div style={{ transform: `scale(${1 + k})`, transformOrigin: '0% 50%' }}>
          <div style={{ ...EYEBROW, fontSize: 28, letterSpacing: 8 }}>{eyebrow}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 6 }}>
            <Ic n="bell" size={70} color={C.ink} sw={2.4} />
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 120, letterSpacing: 6, color: C.orange }}>{word}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <div style={{ ...popIn(t, subAt, 0.4), display: 'flex', alignItems: 'center', gap: 18, background: C.ink, color: '#fff', borderRadius: 999, padding: '18px 34px', fontFamily: FONT, fontWeight: 800, fontSize: 42 }}>
          <Ic n="sparkles" size={40} color={C.orange} sw={2.6} />{sub}
        </div>
      </div>
    </div>
  );
};
const ctaSfx = (p: CtaProps, S: number): SfxCue[] => [{ name: 'bong', at: S }, { name: 'click', at: p.subAt + 0.05 }];

// ── Content boxes (vertical canvas coords) so the stage can fit and center these in any free area ──
const statusBox = (p: StatusProps) => ({ x0: 70, x1: 1010, y0: (p.y ?? 600) - (p.eyebrow ? 110 : 0), y1: (p.y ?? 600) + p.rows.length * 182 + (p.stamp ? 200 : 0) });
const headlineBox = (p: HeadlineProps) => ({ x0: 40, x1: 1040, y0: p.y ?? 230, y1: (p.y ?? 230) + 260 });
const notifBox = (p: NotifProps) => ({ x0: 60, x1: 1020, y0: p.y ?? 150, y1: (p.y ?? 150) + p.items.length * 222 });

// ── Registry ────────────────────────────────────────────────────────────────────
export const ELEMENTS = {
  pill: { C: Pill, sfx: pillSfx },
  notifications: { C: Notifications, sfx: (p: NotifProps) => notifSfx(p), box: notifBox },
  headline: { C: Headline, sfx: headlineSfx, box: headlineBox },
  status: { C: StatusList, sfx: (p: StatusProps) => statusSfx(p), box: statusBox },
  slam: { C: WordSlam, sfx: (p: SlamProps) => slamSfx(p) },
  formQuiz: { C: FormToQuiz, sfx: (p: FormQuizProps) => formQuizSfx(p) },
  swap: { C: StrikeSwap, sfx: (p: SwapProps) => swapSfx(p) },
  cta: { C: Cta, sfx: ctaSfx },
} as const;
export type ElementName = keyof typeof ELEMENTS | 'cutouts' | keyof typeof REAL_ELEMENTS | keyof typeof FORMAT_ELEMENTS | keyof typeof FX;

// ════════════════════════════════════════════════════════════════════════════
// Paper Diorama skin: loose paper cut-outs and torn-paper tags in stop-motion.
// ════════════════════════════════════════════════════════════════════════════

type From = 'bottom' | 'top' | 'left' | 'right' | 'pop';
const STEP = 1 / 12; // stop-motion: transforms advance on 12 fps steps
const q = (t: number) => Math.floor(t / STEP) * STEP;
const dirVec = (f: From) => ({ bottom: [0, 1], top: [0, -1], left: [-1, 0], right: [1, 0], pop: [0, 0] }[f]);

/** Enter (overshoot) → hold with paper "boil" → quick exit, all on 12 fps steps. */
const paperMotion = (t: number, at: number, out: number, rot: number, from: From, seed: number): React.CSSProperties => {
  const tq = q(t);
  const p = ease.outBack(lin(tq, at, 0.33));
  const e = ease.inCubic(lin(tq, out - 0.25, 0.25));
  const [dx, dy] = dirVec(from);
  const travel = 420;
  const step = Math.floor(t / STEP);
  const boil = Math.sin(seed * 12.9 + step * 7.31) * 0.8;
  const by = Math.cos(seed * 4.1 + step * 5.17) * 1.6;
  const enterOff = (1 - p) * travel;
  const exitOff = e * travel;
  const sc = from === 'pop' ? 0.3 + 0.7 * p : 1;
  return {
    opacity: clamp(p * 3, 0, 1) * (1 - e),
    transform: `translate(${dx * (enterOff + exitOff)}px, ${dy * (enterOff + exitOff) + by}px) rotate(${rot + (1 - p) * (seed % 2 ? 14 : -14) + boil}deg) scale(${sc * (1 - 0.1 * e)})`,
  };
};

export type CutPiece = { p: PieceName; x: number; y: number; size: number; at: number; out?: number; rot?: number; tone?: 'beige' | 'orange' | 'cold'; from?: From };
export type CutTag = { text: string; x: number; y: number; at: number; out?: number; rot?: number; tone?: TagTone; size?: number; from?: From; align?: 'center' | 'left' | 'right' };
export type CutLogo = { slug: string; x: number; y: number; size: number; at: number; out?: number; rot?: number; from?: From; label?: boolean };
export type CutoutsProps = { pieces?: CutPiece[]; tags?: CutTag[]; logos?: CutLogo[]; stamp?: { text: string; x?: number; y: number; at: number } };

export const Cutouts: React.FC<Base & CutoutsProps & { pieceScale?: number; skin?: 'kit' | 'diorama' }> = ({ t, E, pieces = [], tags = [], logos = [], stamp, pieceScale = 1.3, skin = 'diorama' }) => {
  const sx = stamp ? shake(t, stamp.at, 16) : 0;
  pieces = pieces.map((pc) => ({ ...pc, size: pc.size * pieceScale }));
  return (
    <div style={{ ...fill, transform: `translateX(${sx}px)` }}>
      {pieces.map((pc, i) => (
        <div key={`p${i}`} style={{ position: 'absolute', left: pc.x - pc.size / 2, top: pc.y - pc.size / 2, width: pc.size, height: pc.size, ...paperMotion(t, pc.at, pc.out ?? E, pc.rot ?? 0, pc.from ?? 'bottom', i + 1) }}>
          <Piece p={pc.p} size={pc.size} tone={pc.tone} t={t} />
        </div>
      ))}
      {logos.map((lg, i) => (
        <div key={`l${i}`} style={{ position: 'absolute', left: lg.x - lg.size / 2, top: lg.y - lg.size / 2, ...paperMotion(t, lg.at, lg.out ?? E, lg.rot ?? (i % 2 ? 3 : -3), lg.from ?? 'pop', i + 21) }}>
          <BrandLogo slug={lg.slug} size={lg.size} skin={skin} label={lg.label} />
        </div>
      ))}
      {tags.map((tg, i) => {
        const tx = tg.align === 'left' ? '0%' : tg.align === 'right' ? '-100%' : '-50%';
        return (
          <div key={`t${i}`} style={{ position: 'absolute', left: tg.x, top: tg.y, transform: `translate(${tx}, -50%)` }}>
            <div style={paperMotion(t, tg.at, tg.out ?? E, tg.rot ?? (i % 2 ? 1.5 : -1.5), tg.from ?? 'pop', i + 7)}>
              <Tag text={tg.text} tone={tg.tone} size={tg.size ?? 64} seed={i + 3} />
            </div>
          </div>
        );
      })}
      {stamp && (() => {
        const p = ease.outBack(lin(q(t), stamp.at, 0.25));
        const e = M.exit(t, E - 0.3);
        return (
          <div style={{ position: 'absolute', left: (stamp.x ?? 540), top: stamp.y, transform: `translate(-50%, -50%) scale(${2.2 - 1.2 * p}) rotate(-8deg)`, opacity: clamp(p * 3, 0, 1) * (1 - e) }}>
            <div style={{ border: `12px solid ${PAPER.orange}`, color: PAPER.orange, borderRadius: 24, padding: '8px 40px', fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: 4, background: 'rgba(252,250,242,0.88)', whiteSpace: 'nowrap' }}>{stamp.text}</div>
          </div>
        );
      })()}
    </div>
  );
};
const cutoutsSfx = (p: CutoutsProps): SfxCue[] => [
  ...(p.pieces ?? []).map((pc) => ({ name: 'click' as const, at: pc.at + 0.04, gain: 0.9 })),
  ...(p.tags ?? []).map((tg) => ({ name: 'click' as const, at: tg.at + 0.04, gain: 0.7 })),
  ...(p.logos ?? []).map((lg) => ({ name: 'click' as const, at: lg.at + 0.04, gain: 0.9 })),
  ...(p.stamp ? [{ name: 'faah' as const, at: p.stamp.at }] : []),
];

const cutoutsBox = (p: CutoutsProps) => {
  const xs: number[] = [], ys: number[] = [];
  const add = (x0: number, y0: number, x1: number, y1: number) => { xs.push(x0, x1); ys.push(y0, y1); };
  (p.pieces ?? []).forEach((pc) => { const h = pc.size * 1.3 * 0.45; add(pc.x - h, pc.y - h, pc.x + h, pc.y + h); });
  (p.logos ?? []).forEach((lg) => add(lg.x - lg.size / 2, lg.y - lg.size / 2, lg.x + lg.size / 2, lg.y + lg.size * (lg.label ? 0.8 : 0.5)));
  (p.tags ?? []).forEach((tg) => {
    const s = tg.size ?? 64, w = tg.text.length * s * 0.6 + s * 1.1, h = s * 1.7;
    const x0 = tg.align === 'left' ? tg.x : tg.align === 'right' ? tg.x - w : tg.x - w / 2;
    add(x0, tg.y - h / 2, x0 + w, tg.y + h / 2);
  });
  if (p.stamp) add((p.stamp.x ?? 540) - 380, p.stamp.y - 110, (p.stamp.x ?? 540) + 380, p.stamp.y + 110);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
(ELEMENTS as any).cutouts = { C: Cutouts, sfx: (p: CutoutsProps) => cutoutsSfx(p), box: cutoutsBox };

// content boxes of the original elements (vertical canvas coords)
const BOXES: Record<string, (p: any) => { x0: number; y0: number; x1: number; y1: number }> = {
  pill: (p) => ({ x0: 40, y0: (p.y ?? 1150) - 10, x1: 1040, y1: (p.y ?? 1150) + 140 }),
  notifications: (p) => ({ x0: 60, y0: p.y ?? 150, x1: 1020, y1: (p.y ?? 150) + (p.items.length - 1) * 222 + 210 }),
  headline: (p) => ({ x0: 40, y0: p.y ?? 230, x1: 1040, y1: (p.y ?? 230) + 260 }),
  status: (p) => ({ x0: 70, y0: (p.y ?? 600) - 110, x1: 1010, y1: (p.y ?? 600) + p.rows.length * 160 + (p.stamp ? 230 : 0) }),
  slam: (p) => ({ x0: 40, y0: (p.y ?? 760) - 150, x1: 1040, y1: (p.y ?? 760) + 200 }),
  formQuiz: (p) => ({ x0: 110, y0: (p.y ?? 560) - 60, x1: 970, y1: (p.y ?? 560) + 780 }),
  swap: (p) => ({ x0: 40, y0: (p.y ?? 260) - 60, x1: 1040, y1: (p.y ?? 260) + 330 }),
  cta: (p) => ({ x0: 70, y0: p.y ?? 170, x1: 1010, y1: (p.y ?? 170) + 330 }),
};
for (const [k, f] of Object.entries(BOXES)) (ELEMENTS as any)[k].box = f;
Object.assign(ELEMENTS as any, REAL_ELEMENTS, FORMAT_ELEMENTS, FX);
