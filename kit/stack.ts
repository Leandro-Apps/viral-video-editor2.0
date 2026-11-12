// WiseFunnel Motion Kit · STACK layout (9:16, 1080x1920): the fixed zones every "talking head + animation" Reel is built on.
// Reuse these constants, never hand-place things: all stack elements (fx/stack.tsx) read them.
//
//   y    0 –  250  TOP SAFE      status bar / Reels header, nothing important here (soft grey gradient)
//   y  255 –  490  A HEADLINE    caption A: 1 small bold line + 1 big hero line (serif italic in an orange box / underlined). 2-6 words each.
//   y  500 – 1000  B STAGE       the animation area. Changes quickly (every 1.5-4 s), always inside STAGE.x/y/w/h.
//   y 1010 – 1100  C LIVE        caption C: the word-by-word live caption, small and bold, max 3 words, one line.
//   y 1247 – 1920  D CARD        you, in a rounded card that bleeds off the bottom. Your head pops ~130px above the card (cut-out).
//   SOLO (layout `full`): you fill the frame for an important statement; live caption in white on your chest at y 1230.
//
// Instagram covers ~y>1540 (caption/buttons) and the right ~120px column, so nothing essential sits there except you.
export const STACK = {
  W: 1080, H: 1920,
  headline: { top: 255, bottom: 490, smallY: 300, heroTop: 352, heroH: 126 },
  stage: { x: 60, y: 500, w: 960, h: 500, cx: 540, cy: 750 },
  live: { top: 1015, size: 92 },
  soloLive: { top: 1230, size: 96 },
  card: { x: 23, y: 1247, w: 1034, h: 700, r: 56, pop: 140 },
  // THEME (the only things that may change per video: colours + serif). Set with setStackTheme(...) at the top of video.ts.
  ink: '#1B1A17', navy: '#1A2B3B', orange: '#EA580C', bg: '#F6F1E7', panel: '#FFFFFF', dot: '#D9D2C3', soloInk: '#FFFFFF', top: 'rgba(110,108,104,0.55)',
  serif: "'Instrument Serif', 'Playfair Display', Georgia, 'Times New Roman', serif",
};
export type StackMode = 'stack' | 'solo';

export type StackTheme = Partial<Pick<typeof STACK, 'ink' | 'navy' | 'orange' | 'bg' | 'panel' | 'dot' | 'serif' | 'top'>>;
const DEFAULT_THEME: StackTheme = { ink: STACK.ink, navy: STACK.navy, orange: STACK.orange, bg: STACK.bg, panel: STACK.panel, dot: STACK.dot, serif: STACK.serif, top: STACK.top };
/** Colour presets. Zones, scene types and animations never change; only colours do. */
export const STACK_THEMES: Record<string, StackTheme> = {
  cream: {},                                                                                       // default (Reel #4)
  white: { bg: '#FFFFFF', dot: '#E3E3E3', ink: '#14161A', navy: '#0F1B27', orange: '#F97316' },
  night: { bg: '#0F1B27', dot: '#243447', panel: '#16293B', ink: '#FFFFFF', navy: '#8FB4FF', orange: '#F97316', top: 'rgba(0,0,0,0.45)' },
  mint: { bg: '#D5EBDD', dot: '#B4D5C1', panel: '#F3FAF6', ink: '#10231A', navy: '#14532D', orange: '#15803D', top: 'rgba(20,83,45,0.35)' },
  sky: { bg: '#CFE0F7', dot: '#A9C3E8', panel: '#F3F8FF', ink: '#0F1B27', navy: '#1D4ED8', orange: '#2563EB', top: 'rgba(29,78,216,0.35)' },
};
export const setStackTheme = (t: string | StackTheme) => { Object.assign(STACK, DEFAULT_THEME, typeof t === 'string' ? STACK_THEMES[t] ?? {} : t); };   // always starts from the defaults, so themes can be switched per scene
