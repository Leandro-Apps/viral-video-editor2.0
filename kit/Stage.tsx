import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './tokens';
import { clamp, ease, kick, lin } from './motion';

// ─── Layouts ────────────────────────────────────────────────────────────────
// full   : you fill the screen, graphics sit in the top or lower third
// card   : you sit in a rounded card at the bottom, graphics own the top half
// circle : you shrink to an avatar bubble, graphics own the screen (complex explanations)
// hidden : graphics only (you keep talking off-screen)
// panel  : black frame, you sit in a rounded glass panel at the bottom, explainer graphics above
// cutout : you are cut out of your recording and stand over the kit background; graphics sit BEHIND you
// depth  : you stay full frame on your real background, graphics float between the background and you
// screen : your screen recording fills the frame (16:9) or the top (9:16), you in a bubble / card
// stack  : 9:16 three-zone stack (headline caption / animation stage / live caption) over a presenter card at the bottom (see kit/stack.ts)
// split  : screen recording on the left in a rounded frame, you in a tall card on the right
export type Layout = 'full' | 'card' | 'circle' | 'hidden' | 'panel' | 'cutout' | 'depth' | 'screen' | 'split' | 'stack';
export type Theme = 'light' | 'dark';
export interface Shot {
  at: number;
  layout: Layout;
  theme?: Theme;
  /** play a whoosh on the layout change (default true when the layout actually changes) */
  whoosh?: boolean;
  /** screen layouts: zoom into a point of the screen recording (x, y in 0–1), optional orange ring on it */
  focus?: { x: number; y: number; zoom: number; ring?: boolean };
}

export type Format = 'vertical' | 'horizontal';
export const SIZE: Record<Format, { w: number; h: number }> = {
  vertical: { w: 1080, h: 1920 },
  horizontal: { w: 1920, h: 1080 },
};

// faceX = where the face sits horizontally inside the presenter box (0.5 = centered)
export type Rect = { x: number; y: number; w: number; h: number; r: number; zoom: number; border: number; faceX: number; faceY?: number };
export const RECTS: Record<Format, Record<Layout, Rect>> = {
  vertical: {
    full: { x: 0, y: 0, w: 1080, h: 1920, r: 0, zoom: 1, border: 0, faceX: 0.5 },
    // card and panel end at y 1520 and x 940: Reels/TikTok cover the bottom ~400px and the icon column on the right
    card: { x: 70, y: 870, w: 870, h: 650, r: 56, zoom: 1.05, border: 6, faceX: 0.5 },
    stack: { x: 23, y: 1247, w: 1034, h: 700, r: 56, zoom: 1.55, border: 0, faceX: 0.5, faceY: 0.2 },
    circle: { x: 380, y: 150, w: 320, h: 320, r: 160, zoom: 1.7, border: 8, faceX: 0.5 },
    hidden: { x: 540, y: 310, w: 0, h: 0, r: 0, zoom: 1.7, border: 0, faceX: 0.5 },
    panel: { x: 60, y: 1000, w: 880, h: 520, r: 44, zoom: 1.12, border: 3, faceX: 0.5 },
    cutout: { x: 0, y: 560, w: 1080, h: 1360, r: 0, zoom: 1, border: 0, faceX: 0.5 },
    // depth on 9:16: same framing as cutout, your real room fades out at the top so cards float above and tuck behind your head
    depth: { x: 0, y: 560, w: 1080, h: 1360, r: 0, zoom: 1, border: 0, faceX: 0.5 },
    screen: { x: 120, y: 880, w: 840, h: 640, r: 48, zoom: 1.05, border: 6, faceX: 0.5 },
    split: { x: 120, y: 880, w: 840, h: 640, r: 48, zoom: 1.05, border: 6, faceX: 0.5 },
  },
  // 16:9 — in `full` you sit right of center so the left side is free for graphics;
  // `card` puts you in a tall card on the right; `circle` docks you top-left.
  horizontal: {
    full: { x: 0, y: 0, w: 1920, h: 1080, r: 0, zoom: 1.18, border: 0, faceX: 0.64 },
    card: { x: 1010, y: 70, w: 850, h: 940, r: 56, zoom: 1.0, border: 6, faceX: 0.5 },
    stack: { x: 1010, y: 70, w: 850, h: 940, r: 56, zoom: 1.0, border: 0, faceX: 0.5 },
    circle: { x: 70, y: 60, w: 300, h: 300, r: 150, zoom: 1.7, border: 8, faceX: 0.5 },
    hidden: { x: 220, y: 210, w: 0, h: 0, r: 0, zoom: 1.7, border: 0, faceX: 0.5 },
    panel: { x: 1290, y: 600, w: 580, h: 420, r: 40, zoom: 1.1, border: 3, faceX: 0.5 },
    cutout: { x: 0, y: 0, w: 1920, h: 1080, r: 0, zoom: 1.18, border: 0, faceX: 0.64 },
    depth: { x: 0, y: 0, w: 1920, h: 1080, r: 0, zoom: 1.18, border: 0, faceX: 0.64 },
    screen: { x: 1590, y: 750, w: 270, h: 270, r: 135, zoom: 1.7, border: 6, faceX: 0.5 },
    split: { x: 1310, y: 90, w: 550, h: 900, r: 40, zoom: 1, border: 6, faceX: 0.5 },
  },
};

/** Graphics zone: elements are authored on the 1080-wide vertical canvas and placed
 *  into the frame with this transform (x, y offset in px, s scale). Vertical = identity. */
export type Zone = { x: number; y: number; s: number };
export type Box = { x0: number; y0: number; x1: number; y1: number };

/** Face-free area per layout on 16:9 (where graphics are centered) + max upscale. */
export const FREE: Record<Layout, { x: number; y: number; w: number; h: number; max: number }> = {
  full: { x: 60, y: 70, w: 800, h: 760, max: 1.15 },    // you stand right of center
  card: { x: 60, y: 70, w: 900, h: 900, max: 1.2 },     // your card is on the right
  stack: { x: 60, y: 70, w: 900, h: 900, max: 1.2 },
  circle: { x: 410, y: 50, w: 1450, h: 810, max: 1.35 }, // your bubble is top-left
  hidden: { x: 110, y: 90, w: 1700, h: 900, max: 1.9 },  // full-screen scene: graphics large and centered
  panel: { x: 70, y: 50, w: 1180, h: 800, max: 1.3 },    // your panel is bottom-right
  cutout: { x: 60, y: 70, w: 800, h: 760, max: 1.15 },
  depth: { x: 60, y: 70, w: 800, h: 760, max: 1.15 },
  screen: { x: 90, y: 50, w: 1400, h: 640, max: 1.2 },  // over the recording, clear of your bubble
  split: { x: 60, y: 200, w: 1200, h: 675, max: 1.1 },
};

/** 9:16 graphics area above the caption band when you sit in the card or panel (never shrinks below the box, never upscales). */
export const FREE_V: Partial<Record<Layout, { x: number; y: number; w: number; h: number; max: number }>> = {
  stack: { x: 60, y: 505, w: 960, h: 490, max: 1.25 },   // zone B: any kit element with a box() is auto-fitted into the stage
  card: { x: 60, y: 240, w: 840, h: 600, max: 1 },   // below the Shorts/Reels top UI (~220) and above the card (870)
  hidden: { x: 110, y: 300, w: 860, h: 980, max: 1.6 },  // full-screen 9:16 scene: centered between the top UI and the caption band
  panel: { x: 60, y: 100, w: 880, h: 765, max: 1 },
  cutout: { x: 60, y: 110, w: 880, h: 700, max: 1 }, // your head starts around y 850
  depth: { x: 60, y: 110, w: 880, h: 740, max: 1 },  // the bottom edge tucks behind your head
  screen: { x: 60, y: 150, w: 880, h: 600, max: 1 },
  split: { x: 60, y: 150, w: 880, h: 600, max: 1 },
};

/** Fit a content box (vertical canvas coords) into the face-free area, centered. */
export const fitZone = (box: Box, layout: Layout, area = FREE[layout]): Zone => {
  const f = area;
  const bw = Math.max(1, box.x1 - box.x0), bh = Math.max(1, box.y1 - box.y0);
  const s = Math.min(f.w / bw, f.h / bh, f.max);
  return { s, x: f.x + (f.w - bw * s) / 2 - box.x0 * s, y: f.y + (f.h - bh * s) / 2 - box.y0 * s };
};
export const ZONES: Record<Format, Record<Layout, Zone>> = {
  // vertical card/panel: graphics shrink a little so a caption band fits between them and the presenter
  vertical: { full: { x: 0, y: 0, s: 1 }, card: { x: 92, y: 16, s: 0.83 }, stack: { x: 0, y: 0, s: 1 }, circle: { x: 0, y: 0, s: 1 }, hidden: { x: 0, y: 0, s: 1 }, panel: { x: 70, y: -10, s: 0.87 }, cutout: { x: 0, y: 0, s: 1 }, depth: { x: 0, y: 0, s: 1 }, screen: { x: 0, y: 0, s: 1 }, split: { x: 0, y: 0, s: 1 } },
  horizontal: {
    full: { x: 40, y: 0, s: 0.72 },        // left side: lower-third pills land ~y830, top cards ~y120
    stack: { x: 10, y: -20, s: 0.95 },
    card: { x: 10, y: -20, s: 0.95 },      // left of the card: vertical top zone (150–860) -> 120–800
    circle: { x: 452, y: -420, s: 0.94 },  // centered: vertical content zone (560–1560) -> 106–1046
    hidden: { x: 452, y: -420, s: 0.94 },
    panel: { x: 260, y: -150, s: 0.8 },
    cutout: { x: 40, y: 0, s: 0.72 },
    depth: { x: 40, y: 0, s: 0.72 },
    screen: { x: 452, y: -420, s: 0.94 },
    split: { x: 452, y: -420, s: 0.94 },
  },
};
export const MORPH = 0.35;

/** Where the screen recording sits in the screen / split layouts. */
const SCREEN_RECTS: Record<Format, Partial<Record<Layout, Rect>>> = {
  vertical: {
    screen: { x: 0, y: 150, w: 1080, h: 608, r: 0, zoom: 1, border: 0, faceX: 0.5 },
    split: { x: 30, y: 150, w: 1020, h: 574, r: 28, zoom: 1, border: 0, faceX: 0.5 },
  },
  horizontal: {
    screen: { x: 0, y: 0, w: 1920, h: 1080, r: 0, zoom: 1, border: 0, faceX: 0.5 },
    split: { x: 60, y: 200, w: 1200, h: 675, r: 28, zoom: 1, border: 0, faceX: 0.5 },
  },
};

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mixRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), w: mix(a.w, b.w, p), h: mix(a.h, b.h, p),
  r: mix(a.r, b.r, p), zoom: mix(a.zoom, b.zoom, p), border: mix(a.border, b.border, p), faceX: mix(a.faceX, b.faceX, p), faceY: mix(a.faceY ?? 0.42, b.faceY ?? 0.42, p),
});

/** Where the presenter is at time t, plus the active layout/theme. */
export const shotState = (shots: Shot[], t: number, format: Format = 'vertical') => {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (shots[k].at <= t) i = k;
  const cur = shots[i];
  const prev = shots[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : ease.inOutCubic(lin(t, cur.at, MORPH));
  const rect = mixRect(RECTS[format][prev.layout], RECTS[format][cur.layout], p);
  const themeP = i === 0 ? 1 : lin(t, cur.at, MORPH);
  const dark = mix((prev.theme ?? 'light') === 'dark' ? 1 : 0, (cur.theme ?? 'light') === 'dark' ? 1 : 0, themeP);
  const isPanel = (l: Layout) => (l === 'panel' ? 1 : 0);
  const panel = mix(isPanel(prev.layout), isPanel(cur.layout), themeP);
  const isMatte = (l: Layout) => (l === 'cutout' || l === 'depth' ? 1 : 0);
  const isCut = (l: Layout) => (l === 'cutout' ? 1 : 0);
  const matte = mix(isMatte(prev.layout), isMatte(cur.layout), themeP);
  const cut = mix(isCut(prev.layout), isCut(cur.layout), themeP);
  const isScreen = (l: Layout) => (l === 'screen' || l === 'split' ? 1 : 0);
  const stack = mix(prev.layout === 'stack' ? 1 : 0, cur.layout === 'stack' ? 1 : 0, themeP);
  const screenP = mix(isScreen(prev.layout), isScreen(cur.layout), themeP);
  const sa = SCREEN_RECTS[format][isScreen(prev.layout) ? prev.layout : cur.layout] ?? SCREEN_RECTS[format].screen!;
  const sb = SCREEN_RECTS[format][isScreen(cur.layout) ? cur.layout : prev.layout] ?? SCREEN_RECTS[format].screen!;
  const screenRect = mixRect(sa, sb, p);
  const NOF = { x: 0.5, y: 0.5, zoom: 1, ring: false };
  const fa = prev.focus ?? NOF, fb = cur.focus ?? NOF;
  const fp = i === 0 ? 1 : ease.inOutCubic(lin(t, cur.at, 0.6));
  const focus = { x: mix(fa.x, fb.x, fp), y: mix(fa.y, fb.y, fp), zoom: mix(fa.zoom, fb.zoom, fp), ring: !!fb.ring && fp > 0.9 ? lin(t, cur.at + 0.6, 0.3) : 0 };
  return { rect, layout: cur.layout, dark, panel, matte, cut, stack, screenP, screenRect, focus };
};

// ─── Background ─────────────────────────────────────────────────────────────
export const Background: React.FC<{ t: number; dark: number }> = ({ t, dark }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: C.paper }} />
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(#CACACA 2.4px, transparent 2.8px)', backgroundSize: '46px 46px', backgroundPosition: `${t * 4}px ${t * 8}px` }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)' }} />
    <AbsoluteFill style={{ opacity: dark }}>
      <AbsoluteFill style={{ background: C.navyDeep }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 2.2px, transparent 2.6px)', backgroundSize: '46px 46px', backgroundPosition: `${t * 4}px ${t * 8}px` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(59,130,246,0.22), rgba(15,27,39,0) 65%)' }} />
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Black explainer frame behind the panel layout (fades in/out with the layout). */
export const PanelBackdrop: React.FC<{ p: number; t: number; paper?: string }> = ({ p, t, paper }) => (p <= 0 ? null : (
  <AbsoluteFill style={{ opacity: p }}>
    <AbsoluteFill style={{ background: '#07090C' }} />
    {paper && <AbsoluteFill style={{ background: `${paper}, #1A2B3B`, backgroundSize: '300px 300px, auto', backgroundBlendMode: 'multiply' }} />}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(249,115,22,0.16), rgba(7,9,12,0) 60%)' }} />
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 2px, transparent 2.4px)', backgroundSize: '46px 46px', backgroundPosition: `${t * 4}px ${t * 8}px` }} />
  </AbsoluteFill>
));

/** Screen recording (tutorial layouts) with smooth zoom into a focus point and an optional ring. */
export const ScreenRec: React.FC<{ src: string; rect: Rect; p: number; t: number; focus: { x: number; y: number; zoom: number; ring: number } }> = ({ src, rect, p, t, focus }) => (p <= 0 ? null : (
  <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: rect.r, overflow: 'hidden', opacity: p,
    boxShadow: rect.r > 1 ? '0 0 0 2px rgba(255,255,255,0.9), 0 40px 90px -30px rgba(15,23,42,0.55)' : 'none', background: '#fff' }}>
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${focus.zoom})`, transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}>
      <OffthreadVideo src={staticFile(src)} volume={0} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {focus.ring > 0 && (
        <div style={{ position: 'absolute', left: `${focus.x * 100}%`, top: `${focus.y * 100}%`, width: 0, height: 0 }}>
          <div style={{ position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: 999, border: `${6 / focus.zoom}px solid ${C.orange}`,
            opacity: focus.ring, transform: `scale(${(0.6 + 0.4 * focus.ring) * (1 + 0.06 * Math.sin(t * 6)) / focus.zoom * 1.6})`, boxShadow: '0 0 0 9999px rgba(15,23,42,0.18)' }} />
        </div>
      )}
    </div>
  </div>
));

// ─── Presenter (one persistent video element that morphs between layouts) ──
const SRC_W = 1880;
const SRC_H = 1080;
export const Presenter: React.FC<{
  rect: Rect; t: number; punches: number[]; src: string; face?: { x: number; y: number }; volume?: number; portal?: boolean;
  /** 0–1 opacity multiplier; transparent = src is the alpha cutout (WebM VP9) */
  alpha?: number; transparent?: boolean;
  /** 0–1: fade the top edge of the video into the background (depth layout) */
  fadeTop?: number;
  /** slow camera drift (1 = none), multiplied with the punch-ins */
  drift?: number;
}> = ({ rect, t, punches, src, face = { x: 0.53, y: 0.37 }, volume = 1, portal, alpha = 1, transparent, fadeTop = 0, drift = 1 }) => {
  const { w, h } = rect;
  const s = Math.max(w / SRC_W, h / SRC_H) * rect.zoom;
  const vw = SRC_W * s;
  const vh = SRC_H * s;
  const left = clamp(w * rect.faceX - face.x * vw, w - vw, 0);
  const top = clamp(h * (rect.faceY ?? 0.42) - face.y * vh, h - vh, 0);
  const punch = 1 + kick(t, punches, 0.08, 7);
  const visible = w > 2 && h > 2;
  return (
    <div style={{
      position: 'absolute', left: rect.x, top: rect.y, width: Math.max(w, 1), height: Math.max(h, 1), borderRadius: rect.r, overflow: 'hidden',
      boxShadow: rect.border > 0.5 ? (portal
        ? `0 0 0 ${rect.border + 2}px #F97316, 0 0 0 ${rect.border + 6}px #FCFAF2, 0 30px 60px -20px rgba(26,43,59,0.45)`
        : `0 0 0 ${rect.border}px #fff, 0 0 0 ${rect.border + 3}px rgba(59,130,246,0.55), 0 40px 90px -30px rgba(15,23,42,0.55)`) : 'none',
      opacity: visible ? alpha : 0,
      ...(fadeTop > 0 ? { maskImage: `linear-gradient(to bottom, rgba(0,0,0,${1 - fadeTop}) 0px, #000 ${Math.round(320 * fadeTop)}px)`, WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,${1 - fadeTop}) 0px, #000 ${Math.round(320 * fadeTop)}px)` } : {}),
    }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${punch * drift})`, transformOrigin: `${face.x * 100}% ${face.y * 100}%` }}>
        <OffthreadVideo src={staticFile(src)} volume={volume} transparent={transparent} style={{ position: 'absolute', left, top, width: vw, height: vh, maxWidth: 'none' }} />
      </div>
    </div>
  );
};

// ─── Captions (big word chunks, keyword highlight) ──────────────────────────
export interface Word { word: string; start: number; end: number }
export const buildChunks = (words: Word[], maxWords = 3, gap = 0.35) => {
  const chunks: { text: string[]; start: number; end: number }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) chunks.push({ text: cur.map((w) => w.word.trim()), start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= maxWords || (prev && w.start - prev.end > gap))) flush();
    cur.push(w);
    if (/[.,!?]$/.test(w.word.trim())) flush();
  });
  flush();
  return chunks;
};

export const CAPTION_POS: Record<Format, Record<Layout, { top: number; left: number; right: number; size: number }>> = {
  vertical: {
    full: { top: 1330, left: 60, right: 60, size: 96 },
    // card: inside the bottom of the video card (white on video, below the chin, above the phone UI at 1540)
    card: { top: 1380, left: 100, right: 160, size: 78 },
    stack: { top: 1015, left: 60, right: 60, size: 92 },
    circle: { top: 1430, left: 60, right: 140, size: 92 },
    hidden: { top: 1340, left: 90, right: 150, size: 92 },  // boxed band under the centered scene, above the phone UI
    panel: { top: 885, left: 60, right: 140, size: 76 },
    cutout: { top: 1330, left: 60, right: 140, size: 92 },
    depth: { top: 1330, left: 60, right: 140, size: 96 },
    screen: { top: 778, left: 60, right: 140, size: 64 },
    split: { top: 778, left: 60, right: 140, size: 64 },
  },
  horizontal: {
    full: { top: 880, left: 760, right: 120, size: 84 },
    card: { top: 820, left: 1030, right: 80, size: 70 },
    stack: { top: 820, left: 1030, right: 80, size: 70 },
    circle: { top: 900, left: 160, right: 160, size: 80 },
    hidden: { top: 900, left: 160, right: 160, size: 80 },
    panel: { top: 900, left: 80, right: 700, size: 72 },
    cutout: { top: 880, left: 760, right: 120, size: 84 },
    depth: { top: 880, left: 760, right: 120, size: 84 },
    screen: { top: 930, left: 160, right: 420, size: 66 },
    split: { top: 905, left: 60, right: 680, size: 62 },
  },
};

export const Captions: React.FC<{
  t: number; chunks: { text: string[]; start: number; end: number }[]; layout: Layout; dark: number;
  keywords: string[]; hide: Array<[number, number]>; format?: Format; boxed?: boolean;
}> = ({ t, chunks, layout, dark, keywords, hide, format = 'vertical', boxed }) => {
  if (hide.some(([a, b]) => t >= a && t < b)) return null;
  const idx = chunks.findIndex((c, i) => t >= c.start - 0.05 && t < (chunks[i + 1]?.start ?? c.end + 0.4));
  if (idx < 0) return null;
  const c = chunks[idx];
  const p = ease.outBack(lin(t, c.start - 0.05, 0.18));
  const onVideo = layout === 'full' || layout === 'card' || layout === 'panel' || layout === 'cutout' || layout === 'depth';
  const pos = CAPTION_POS[format][layout];
  const base = onVideo || dark > 0.5 ? '#fff' : C.ink;
  const kw = new Set(keywords.map((k) => k.toLowerCase()));
  if (boxed || layout === 'screen' || layout === 'split') {
    return (
      <div style={{ position: 'absolute', left: pos.left, right: pos.right, top: pos.top, display: 'flex', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * p})`, opacity: clamp(p * 2, 0, 1) }}>
        <div style={{ background: '#1A2B3B', borderRadius: 18, padding: '14px 30px 18px', boxShadow: '0 12px 30px -10px rgba(26,43,59,0.55)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px', maxWidth: '100%' }}>
          {c.text.map((w, i) => {
            const hot = kw.has(w.toLowerCase().replace(/[^a-z0-9']/g, ''));
            return <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: pos.size * 0.78, letterSpacing: -pos.size / 45, lineHeight: 1.1, color: hot ? C.orange : '#fff' }}>{w}</span>;
          })}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: pos.left, right: pos.right, top: pos.top, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 22px', transform: `scale(${0.82 + 0.18 * p})`, opacity: clamp(p * 2, 0, 1) }}>
      {c.text.map((w, i) => {
        const hot = kw.has(w.toLowerCase().replace(/[^a-z0-9']/g, ''));
        return (
          <span key={i} style={{
            fontFamily: FONT, fontWeight: 900, fontSize: pos.size, letterSpacing: -pos.size / 32, lineHeight: 1.05,
            color: hot ? C.orange : base,
            textShadow: onVideo ? '0 6px 24px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)' : hot ? '0 0 30px rgba(249,115,22,0.35)' : 'none',
          }}>{w}</span>
        );
      })}
    </div>
  );
};

// ─── SFX track ──────────────────────────────────────────────────────────────
export type SfxName = 'bong' | 'cha-ching' | 'click' | 'core-impact' | 'ding' | 'dramatic-sting' | 'faah' | 'magic-reveal' | 'notification-ping' | 'whoosh' | 'hook-hit' | 'pop-1' | 'pop-2' | 'pop-3' | 'pop-4' | 'ui-click' | 'ui-ping' | 'whoosh-soft' | 'dm';
export const HEAVY: SfxName[] = ['dramatic-sting', 'faah', 'core-impact', 'bong'];
export const SFX_GAIN: Record<SfxName, number> = {
  bong: 0.75, 'cha-ching': 0.7, click: 0.55, 'core-impact': 0.85, ding: 0.6, 'dramatic-sting': 0.75,
  faah: 0.8, 'magic-reveal': 0.6, 'notification-ping': 0.6, whoosh: 0.5,
  'hook-hit': 0.55, 'pop-1': 0.5, 'pop-2': 0.5, 'pop-3': 0.5, 'pop-4': 0.5, 'ui-click': 0.5, 'ui-ping': 0.45, 'whoosh-soft': 0.5, dm: 0.5,
};
export interface SfxCue { name: SfxName; at: number; gain?: number }

export const SfxTrack: React.FC<{ cues: SfxCue[] }> = ({ cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} layout="none">
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={(c.gain ?? 1) * SFX_GAIN[c.name]} />
        </Sequence>
      ))}
    </>
  );
};

/** Music bed that ducks under every heavy hit. */
export const Music: React.FC<{ src: string; base: number; heavyAt: number[]; total: number }> = ({ src, base, heavyAt, total }) => {
  const { fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const t = f / fps;
        const fadeIn = lin(t, 0, 1.5);
        const fadeOut = 1 - lin(t, total - 2.5, 2.5);
        const duck = heavyAt.reduce((d, h) => (t > h - 0.3 && t < h + 1.6 ? Math.min(d, 0.3) : d), 1);
        return base * fadeIn * fadeOut * duck;
      }}
    />
  );
};

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};
