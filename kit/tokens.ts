// WiseFunnel Motion Kit — design tokens (from the Claude Design "SFX pack").
export const C = {
  orange: '#F97316',
  orangeSoft: '#FFF1E6',
  navy: '#1A2B3B',
  navyDeep: '#0F1B27',
  ink: '#202020',
  muted: '#646464',
  green: '#2EA56A',
  greenSoft: '#E6F6EE',
  red: '#E15A36',
  paper: '#F4F4F4',
  white: '#FFFFFF',
  border: '#EAEAEA',
};

export const FONT = 'WFInter, Inter, system-ui, sans-serif';
export const HAND = 'WFCaveat, Caveat, cursive';
export const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

export const SHADOW = '0 40px 80px -30px rgba(15,23,42,0.28), 0 2px 8px rgba(15,23,42,0.06)';

export const CARD: React.CSSProperties = {
  position: 'absolute',
  background: C.white,
  borderRadius: 44,
  border: `1px solid ${C.border}`,
  boxShadow: SHADOW,
  boxSizing: 'border-box',
};

export const EYEBROW: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  fontSize: 38,
  letterSpacing: 8,
  textTransform: 'uppercase',
  color: C.ink,
};

// Canvas
export const W = 1080;
export const H = 1920;
export const FPS = 30;
