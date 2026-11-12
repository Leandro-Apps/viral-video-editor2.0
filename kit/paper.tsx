import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FONT } from './tokens';

// ─── Paper Diorama palette (styles/animation.md) ────────────────────────────
export const PAPER = {
  beige: '#FCFAF2',
  cream: '#F3EBDD',
  kraft: '#DCC7A3',
  kraftDark: '#B99B74',
  navy: '#1A2B3B',
  orange: '#F97316',
  orangeDark: '#D9620F',
  cold: '#C9D5DF',
  coldDark: '#9FB1C1',
};

// ─── Shared SVG filters (rendered once per frame, referenced by id) ─────────
// #pp  = cut-paper layer: slightly rough edge + paper grain + thin lift shadow
// #ppb = same, bigger lift (for the top layer of a piece)
export const PaperDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      {[['pp', 1.4, 2], ['ppb', 2.5, 4]].map(([id, dy, blur]) => (
        <filter key={id as string} id={id as string} x="-10%" y="-10%" width="120%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.24  0 0 0 0 0.16  0 0 0 0.22 0" result="tint" />
          <feComposite in="tint" in2="rough" operator="in" result="grain" />
          <feMerge result="paper"><feMergeNode in="rough" /><feMergeNode in="grain" /></feMerge>
          <feDropShadow in="paper" dx="0" dy={dy as number} stdDeviation={blur as number} floodColor={PAPER.navy} floodOpacity="0.28" />
        </filter>
      ))}
    </defs>
  </svg>
);

const L: React.FC<{ big?: boolean; children: React.ReactNode }> = ({ big, children }) => <g filter={big ? 'url(#ppb)' : 'url(#pp)'}>{children}</g>;
const ink = { stroke: PAPER.navy, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

// ─── Pieces (viewBox 200x200). Metaphors from styles/animation.md ────────────
type Tone = 'beige' | 'orange' | 'cold';
const toneFill = (t: Tone = 'beige') => ({ beige: [PAPER.cream, PAPER.kraft], orange: [PAPER.orange, PAPER.orangeDark], cold: [PAPER.cold, PAPER.coldDark] }[t]);

const Envelope: React.FC<{ tone?: Tone }> = ({ tone }) => {
  const [a, b] = toneFill(tone);
  return (
    <>
      <L><rect x="20" y="55" width="160" height="100" rx="4" fill={a} /></L>
      <L><path d="M20 155 L100 100 L180 155 Z" fill={b} /></L>
      <L big><path d="M20 57 L100 118 L180 57 Z" fill={a} /><path d="M20 57 L100 118 L180 57" {...ink} strokeWidth={2.5} opacity={0.55} /></L>
      {tone === 'cold' && <g {...ink} stroke={PAPER.navy} strokeWidth={2.5} opacity={0.6}><path d="M150 40 v22 M139 51 h22 M142 43 l16 16 M158 43 l-16 16" /></g>}
    </>
  );
};

const Pile: React.FC = () => (
  <>
    {[[-14, 150, 0], [10, 132, 1], [-6, 112, 2], [8, 92, 3], [-4, 72, 4]].map(([r, y, i]) => (
      <g key={i} transform={`translate(100 ${y}) rotate(${r}) translate(-62 -32)`}>
        <L><rect width="124" height="64" rx="3" fill={i % 2 ? PAPER.kraft : PAPER.cream} /><path d="M0 2 L62 38 L124 2" {...ink} strokeWidth={2} opacity={0.5} /></L>
      </g>
    ))}
  </>
);

const Roofer: React.FC<{ tone?: Tone }> = ({ tone }) => (
  <>
    <L><rect x="72" y="88" width="56" height="70" rx="10" fill={PAPER.cream} /></L>
    <L><rect x="76" y="150" width="20" height="40" rx="5" fill={PAPER.kraft} /><rect x="104" y="150" width="20" height="40" rx="5" fill={PAPER.kraft} /></L>
    <L><rect x="54" y="94" width="18" height="52" rx="8" fill={PAPER.cream} transform="rotate(10 63 94)" /><rect x="128" y="94" width="18" height="52" rx="8" fill={PAPER.cream} transform="rotate(-10 137 94)" /></L>
    <L><rect x="84" y="100" width="32" height="40" rx="4" fill={PAPER.kraft} /></L>
    <L big><circle cx="100" cy="64" r="24" fill={PAPER.beige} /></L>
    <L><rect x="80" y="58" width="40" height="10" rx="3" fill={PAPER.navy} /></L>
    <L big><path d="M72 52 Q100 18 128 52 Z" fill={tone === 'orange' ? PAPER.orange : PAPER.kraft} /><rect x="66" y="49" width="68" height="8" rx="4" fill={tone === 'orange' ? PAPER.orangeDark : PAPER.kraftDark} /></L>
  </>
);

const House: React.FC = () => (
  <>
    <L><rect x="45" y="95" width="110" height="85" rx="3" fill={PAPER.cream} /></L>
    <L big><path d="M30 100 L100 40 L170 100 Z" fill={PAPER.orange} /></L>
    <L><rect x="88" y="128" width="26" height="52" rx="3" fill={PAPER.navy} /></L>
    <L><rect x="56" y="112" width="24" height="22" rx="2" fill={PAPER.kraft} /><rect x="122" y="112" width="24" height="22" rx="2" fill={PAPER.kraft} /></L>
    <L><rect x="128" y="50" width="16" height="30" fill={PAPER.kraftDark} /></L>
  </>
);

const Clock: React.FC<{ t?: number }> = ({ t = 0 }) => (
  <>
    <L><circle cx="100" cy="100" r="78" fill={PAPER.kraft} /></L>
    <L big><circle cx="100" cy="100" r="64" fill={PAPER.beige} /></L>
    <g {...ink} strokeWidth={4}>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={100 + Math.sin(a) * 52} y1={100 - Math.cos(a) * 52} x2={100 + Math.sin(a) * 58} y2={100 - Math.cos(a) * 58} />;
      })}
      <line x1="100" y1="100" x2={100 + Math.sin(t * 2) * 30} y2={100 - Math.cos(t * 2) * 30} strokeWidth={6} />
      <line x1="100" y1="100" x2={100 + Math.sin(t * 8) * 46} y2={100 - Math.cos(t * 8) * 46} stroke={PAPER.orange} strokeWidth={4} />
    </g>
    <circle cx="100" cy="100" r="6" fill={PAPER.navy} />
  </>
);

const Megaphone: React.FC<{ tone?: Tone }> = ({ tone }) => (
  <>
    <L><rect x="40" y="120" width="22" height="46" rx="6" fill={PAPER.kraftDark} transform="rotate(-12 51 120)" /></L>
    <L big><path d="M40 85 L130 45 L130 155 L40 115 Z" fill={tone === 'orange' ? PAPER.orange : PAPER.cream} /></L>
    <L><rect x="26" y="82" width="22" height="36" rx="5" fill={PAPER.kraft} /></L>
    <L><rect x="124" y="40" width="16" height="120" rx="6" fill={tone === 'orange' ? PAPER.orangeDark : PAPER.kraft} /></L>
    <g {...ink} strokeWidth={4} opacity={0.8}><path d="M156 70 q14 30 0 60" /><path d="M170 58 q22 42 0 84" /></g>
  </>
);

const Clipboard: React.FC = () => (
  <>
    <L><rect x="45" y="30" width="110" height="150" rx="8" fill={PAPER.kraft} /></L>
    <L big><rect x="56" y="48" width="88" height="122" rx="3" fill={PAPER.beige} /></L>
    <L><rect x="78" y="22" width="44" height="18" rx="5" fill={PAPER.navy} /></L>
    <g {...ink} strokeWidth={3} opacity={0.65}>{[72, 96, 120, 144].map((y) => <g key={y}><rect x="66" y={y - 7} width="12" height="12" rx="2" /><line x1="86" y1={y} x2="134" y2={y} /></g>)}</g>
  </>
);

const Contract: React.FC = () => (
  <>
    <L><rect x="50" y="25" width="100" height="140" rx="3" fill={PAPER.beige} transform="rotate(-4 100 95)" /></L>
    <g {...ink} strokeWidth={3} opacity={0.6} transform="rotate(-4 100 95)">{[55, 72, 89, 106, 123].map((y) => <line key={y} x1="64" y1={y} x2={y === 123 ? 110 : 136} y2={y} />)}<path d="M66 145 q10 -12 20 0 t20 0" /></g>
    <L big>
      <path d="M118 150 l10 -6 l8 8 l11 -3 l2 11 l11 4 l-4 11 l7 9 l-10 6 l1 11 l-11 1 l-5 10 l-10 -5 l-10 5 l-5 -10 l-11 -1 l1 -11 l-10 -6 l7 -9 l-4 -11 l11 -4 l2 -11 l11 3 z" fill={PAPER.orange} />
      <circle cx="132" cy="180" r="10" fill={PAPER.orangeDark} />
    </L>
  </>
);

const Signpost: React.FC = () => (
  <>
    <L><rect x="92" y="40" width="16" height="150" rx="3" fill={PAPER.kraftDark} /></L>
    <L big><path d="M100 55 H170 L186 72 L170 89 H100 Z" fill={PAPER.orange} /></L>
    <L><path d="M100 100 H34 L18 117 L34 134 H100 Z" fill={PAPER.cream} /></L>
    <L><rect x="70" y="186" width="60" height="10" rx="4" fill={PAPER.kraft} /></L>
  </>
);

const Ladder: React.FC = () => (
  <>
    <L><rect x="62" y="20" width="12" height="170" rx="4" fill={PAPER.kraftDark} transform="rotate(6 68 105)" /><rect x="126" y="20" width="12" height="170" rx="4" fill={PAPER.kraftDark} transform="rotate(6 132 105)" /></L>
    <L big>{[45, 75, 105, 135, 165].map((y) => <rect key={y} x="64" y={y} width="72" height="10" rx="3" fill={PAPER.kraft} transform="rotate(6 100 105)" />)}</L>
  </>
);

const Money: React.FC = () => (
  <>
    {[[-10, 128], [6, 108], [-3, 86]].map(([r, y], i) => (
      <g key={i} transform={`translate(100 ${y}) rotate(${r}) translate(-75 -36)`}>
        <L big={i === 2}><rect width="150" height="72" rx="4" fill={i === 2 ? PAPER.cream : PAPER.kraft} /><rect x="8" y="8" width="134" height="56" rx="3" fill="none" stroke={PAPER.navy} strokeWidth={2} opacity={0.4} /></L>
        {i === 2 && <text x="75" y="50" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={PAPER.navy}>$</text>}
      </g>
    ))}
  </>
);

const Shop: React.FC = () => (
  <>
    <L><rect x="34" y="70" width="132" height="112" rx="3" fill={PAPER.cream} /></L>
    <L big>{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${30 + i * 23.3} 66 h23.3 v24 a11.6 11.6 0 0 1 -23.3 0 z`} fill={i % 2 ? PAPER.beige : PAPER.orange} />)}</L>
    <L><rect x="48" y="40" width="104" height="24" rx="4" fill={PAPER.kraft} /></L>
    <L><rect x="88" y="120" width="30" height="62" rx="3" fill={PAPER.navy} /><rect x="48" y="112" width="30" height="34" rx="2" fill={PAPER.kraft} /><rect x="128" y="112" width="26" height="34" rx="2" fill={PAPER.kraft} /></L>
  </>
);

const Funnel: React.FC = () => (
  <>
    <L><path d="M30 40 H170 L118 110 V160 L82 178 V110 Z" fill={PAPER.cream} /></L>
    <L big><ellipse cx="100" cy="40" rx="70" ry="14" fill={PAPER.kraft} /></L>
    <L><rect x="82" y="132" width="36" height="12" fill={PAPER.orange} /></L>
  </>
);

export const PIECES = {
  envelope: Envelope, pile: Pile, roofer: Roofer, house: House, clock: Clock, megaphone: Megaphone,
  clipboard: Clipboard, contract: Contract, signpost: Signpost, ladder: Ladder, money: Money, shop: Shop, funnel: Funnel,
} as const;
export type PieceName = keyof typeof PIECES;

export const Piece: React.FC<{ p: PieceName; size: number; tone?: Tone; t?: number }> = ({ p, size, tone, t }) => {
  const C = PIECES[p] as React.FC<{ tone?: Tone; t?: number }>;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible', display: 'block', filter: 'drop-shadow(0 18px 22px rgba(26,43,59,0.22))' }}>
      <C tone={tone} t={t} />
    </svg>
  );
};

// ─── Torn paper strip (deterministic jagged edges) ─────────────────────────
const jag = (seed: number, n = 26, amp = 1.6) => {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const top = Array.from({ length: n + 1 }, (_, i) => `${(i / n) * 100}% ${r() * amp * 2}%`);
  const right = `${100 - r() * 1.2}% 50%`;
  const bottom = Array.from({ length: n + 1 }, (_, i) => `${100 - (i / n) * 100}% ${100 - r() * amp * 2}%`);
  const left = `${r() * 1.2}% 50%`;
  return `polygon(${[...top, right, ...bottom, left].join(',')})`;
};

export type TagTone = 'beige' | 'orange' | 'navy' | 'kraft';
export const Tag: React.FC<{ text: string; tone?: TagTone; size?: number; seed?: number; style?: React.CSSProperties }> = ({ text, tone = 'beige', size = 64, seed = 1, style }) => {
  const bg = { beige: PAPER.beige, orange: PAPER.orange, navy: PAPER.navy, kraft: PAPER.kraft }[tone];
  const fg = tone === 'navy' || tone === 'orange' ? '#fff' : PAPER.navy;
  return (
    <div style={{ filter: 'drop-shadow(0 4px 0 rgba(26,43,59,0.18)) drop-shadow(0 14px 16px rgba(26,43,59,0.22))', ...style }}>
      <div style={{ clipPath: jag(seed), background: bg, padding: `${size * 0.32}px ${size * 0.55}px`, fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size / 40, lineHeight: 1, color: fg, textTransform: 'uppercase', whiteSpace: 'nowrap', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'multiply', backgroundImage: GRAIN_URL, backgroundSize: '300px 300px' }} />
        <span style={{ position: 'relative' }}>{text}</span>
      </div>
    </div>
  );
};

// ─── Paper background (beige paper or navy card, with grain + fibers) ──────
const grainSvg = (freq: number, alpha: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.16  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )}")`;
export const GRAIN_URL = grainSvg(0.85, 0.5);
const FIBER_URL = grainSvg(0.012, 0.35);

export const PaperBackground: React.FC<{ dark: number }> = ({ dark }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: PAPER.beige }} />
    <AbsoluteFill style={{ backgroundImage: FIBER_URL, backgroundSize: '900px 900px', opacity: 0.55 }} />
    <AbsoluteFill style={{ backgroundImage: GRAIN_URL, backgroundSize: '300px 300px', opacity: 0.6 }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0) 55%, rgba(185,155,116,0.35) 100%)' }} />
    <AbsoluteFill style={{ opacity: dark }}>
      <AbsoluteFill style={{ background: PAPER.navy }} />
      <AbsoluteFill style={{ backgroundImage: grainSvg(0.85, 0.6), backgroundSize: '300px 300px', opacity: 0.5, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(249,115,22,0.10), rgba(26,43,59,0) 60%)' }} />
    </AbsoluteFill>
  </AbsoluteFill>
);
