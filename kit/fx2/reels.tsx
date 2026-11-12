// Family "reels" (clean-room rewrite) · full-frame talking-head reel formats, 1080x1920.
// Every element is frame:true. They are drawn ON TOP of the presenter layer (layout `full`) or BEHIND the cut-out presenter
// (layouts `cutout` / `depth`), and leave transparent windows wherever the face must show through.
// Optional extras shared by several elements: `words` (Word[] from the video spec) turns on the element's own live caption.
import React from 'react';
import { Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { FONT, MONO, FPS } from '../tokens';
import { clamp, ease, lin } from '../motion';
import { STACK as K } from '../stack';
import { BrandLogo } from '../real';
import type { SfxCue } from '../Stage';

type Word = { word: string; start: number; end: number };
type Base = { t: number; S: number; E: number; words?: Word[] };

// ── shared helpers ───────────────────────────────────────────────────────────────────────
const FULL: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 };
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fade = (t: number, S: number, E: number, o = 0.2) => ease.outCubic(lin(t, S, o)) * (1 - ease.inCubic(lin(t, E - o, o)));
/** pop-in + quick exit style for an item alive in [at, end] */
const pop = (t: number, at: number, end: number, dy = 40, from = 0.8): React.CSSProperties => {
  const p = ease.outBack(lin(t, at, 0.42)), e = ease.inCubic(lin(t, end - 0.22, 0.22));
  return { opacity: clamp(p * 2, 0, 1) * (1 - e), transform: `translateY(${(1 - p) * dy}px) scale(${(from + (1 - from) * p) * (1 - 0.05 * e)})` };
};
const STROKE: React.CSSProperties = { WebkitTextStroke: '9px #000', paintOrder: 'stroke fill', textShadow: '0 6px 16px rgba(0,0,0,0.45)' };
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);

/** image / video / brand:slug, covering its parent. A video restarts at `from` (seconds on the composition clock). */
const Media: React.FC<{ src: string; from?: number; fit?: 'cover' | 'contain'; filter?: string; style?: React.CSSProperties }> = ({ src, from = 0, fit = 'cover', filter, style }) => {
  const base: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, filter, ...style };
  if (src.startsWith('brand:')) {
    return <div style={{ ...base, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: undefined }}><BrandLogo slug={src.slice(6)} size={300} /></div>;
  }
  if (isVid(src)) {
    return <Sequence from={Math.max(0, Math.round(from * FPS))} layout="none"><OffthreadVideo src={staticFile(src)} muted style={base} /></Sequence>;
  }
  return <Img src={staticFile(src)} style={base} />;
};

/** "plain *highlighted* plain" -> nodes; hl styles the starred parts */
const Rich: React.FC<{ text: string; hl: React.CSSProperties }> = ({ text, hl }) => (
  <>{text.split('*').map((p, i) => (i % 2 ? <span key={i} style={hl}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}</>
);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9À-ÿ']/g, '');
const lastIdx = (words: Word[], t: number) => { let k = -1; for (let i = 0; i < words.length; i++) if (words[i].start <= t) k = i; return k; };

/** one word at a time (keys: big serif italic, neg: red neon) */
const OneWord: React.FC<{ t: number; words?: Word[]; keys?: string[]; neg?: string; top: number; size?: number; keyColor?: string }> = ({ t, words, keys = [], neg, top, size = 110, keyColor }) => {
  if (!words?.length) return null;
  const k = lastIdx(words, t);
  if (k < 0 || t > words[k].end + 0.35) return null;
  const w = words[k], n = norm(w.word);
  const isKey = keys.map(norm).includes(n), isNeg = !!neg && norm(neg) === n;
  const p = ease.outBack(lin(t, w.start, 0.18));
  const st: React.CSSProperties = isNeg
    ? { fontFamily: FONT, fontWeight: 900, fontSize: size * 1.15, color: '#FF2D3D', textTransform: 'uppercase', textShadow: '0 0 14px #FF2D3D, 0 0 38px #FF2D3D, 0 0 80px rgba(255,45,61,0.7)' }
    : isKey
      ? { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: size * 1.45, color: keyColor ?? '#fff', ...STROKE }
      : { fontFamily: FONT, fontWeight: 900, fontSize: size, color: '#fff', textTransform: 'uppercase', ...STROKE };
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top, display: 'flex', justifyContent: 'center', opacity: clamp(p * 3, 0, 1), transform: `scale(${0.8 + 0.2 * p})` }}>
      <div style={{ ...st, whiteSpace: 'nowrap', letterSpacing: -2 }}>{w.word.replace(/[.,!?;:]/g, '')}</div>
    </div>
  );
};

/** small 2-line caption that fills in word by word, white with outline */
const SmallCaption: React.FC<{ t: number; words?: Word[]; top: number; size?: number; keys?: string[]; keyColor?: string }> = ({ t, words, top, size = 52, keys = [], keyColor }) => {
  if (!words?.length) return null;
  const k = lastIdx(words, t);
  if (k < 0 || t > words[k].end + 0.5) return null;
  const c0 = Math.floor(k / 6) * 6, chunk = words.slice(c0, c0 + 6).filter((w) => w.start <= t);
  const half = Math.ceil(chunk.length / 2), lines = chunk.length > 3 ? [chunk.slice(0, half), chunk.slice(half)] : [chunk];
  const kk = keys.map(norm);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, textAlign: 'center' }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.18, color: '#fff', ...STROKE, WebkitTextStroke: '8px #000' }}>
          {l.map((w, j) => kk.includes(norm(w.word))
            ? <span key={j} style={{ color: keyColor ?? K.orange, fontFamily: K.serif, fontStyle: 'italic', fontSize: size * 1.2 }}>{w.word} </span>
            : <span key={j}>{w.word} </span>)}
        </div>
      ))}
    </div>
  );
};

const sticker = (bg: string, fg: string, size: number, extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-block', background: bg, color: fg, fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -2, lineHeight: 1.08,
  padding: `${size * 0.12}px ${size * 0.3}px ${size * 0.18}px`, borderRadius: size * 0.22, boxShadow: '0 18px 40px -14px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', ...extra,
});

/** index of the item in a sorted-by-`at` list that is active at t (-1 if none) */
const activeIdx = (list: { at: number }[], t: number) => { let k = -1; list.forEach((x, i) => { if (t >= x.at) k = i; }); return k; };

// ── 1 · imageCluster ─────────────────────────────────────────────────────────────────────
// Presenter stays in the lower half; 1-3 pictures hard-cut in above the head with a tiny lowercase caption by the chin.
export type ClusterImg = { src: string; at: number; out: number; x: number; y: number; w: number; h: number; cap?: string; rot?: number };
export type ImageClusterProps = { images: ClusterImg[]; captionX?: number; captionY?: number };
const ImageCluster: React.FC<Base & ImageClusterProps> = ({ t, images, captionX = 700, captionY = 1215 }) => {
  const live = images.map((im, i) => ({ im, i })).filter(({ im }) => t >= im.at && t < im.out);
  const cap = live.find(({ im }) => im.cap)?.im;
  return (
    <div style={FULL}>
      {live.map(({ im, i }) => {
        const snap = 1 + 0.035 * (1 - lin(t, im.at, 0.14));
        const rot = im.rot ?? (rnd(i + 3) - 0.5) * 6;
        return (
          <div key={i} style={{ position: 'absolute', left: im.x, top: im.y, width: im.w, height: im.h, transform: `rotate(${rot}deg) scale(${snap})`, borderRadius: 22, overflow: 'hidden', border: '7px solid #fff', boxSizing: 'border-box', boxShadow: '0 26px 50px -18px rgba(0,0,0,0.55)', background: '#111' }}>
            <Media src={im.src} from={im.at} />
          </div>
        );
      })}
      {cap?.cap && (
        <div style={{ position: 'absolute', left: captionX - 300, width: 600, top: captionY, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 36, color: '#fff', letterSpacing: 0.5, WebkitTextStroke: '7px #000', paintOrder: 'stroke fill' }}>{cap.cap.toLowerCase()}</div>
      )}
    </div>
  );
};

// ── 2 · cutoutGrid ───────────────────────────────────────────────────────────────────────
// Whole frame = 2x2 grid that swaps all four cells together; you (cut-out layer) stand on top in the centre.
export type CutoutGridProps = { sets: { at: number; srcs: string[] }[]; hook?: { text: string; sub?: string; until?: number }; cutW?: number };
const CutoutGrid: React.FC<Base & CutoutGridProps> = ({ t, S, E, sets, hook, cutW = 640 }) => {
  const sorted = [...sets].sort((a, b) => a.at - b.at);
  const k = Math.max(0, activeIdx(sorted, t));
  const cur = sorted[k];
  const G = 10, cw = (1080 - G) / 2, ch = (1920 - G) / 2;
  const since = t - (cur?.at ?? S), hold = lin(t, cur?.at ?? S, Math.max(0.5, (sorted[k + 1]?.at ?? E) - (cur?.at ?? S)));
  const hookEnd = hook?.until ?? sorted[1]?.at ?? S + 3;
  return (
    <div style={{ ...FULL, background: K.bg }}>
      {cur && [0, 1, 2, 3].map((c) => {
        const src = cur.srcs[c % Math.max(1, cur.srcs.length)];
        if (!src) return null;
        return (
          <div key={`${k}-${c}`} style={{ position: 'absolute', left: (c % 2) * (cw + G), top: Math.floor(c / 2) * (ch + G), width: cw, height: ch, overflow: 'hidden', background: '#111' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${1.05 + 0.05 * (1 - ease.outCubic(lin(since, 0, 0.2))) + 0.04 * hold})` }}><Media src={src} from={cur.at} /></div>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.4 * (1 - lin(since, 0, 0.16)) }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: (1080 - cutW) / 2, width: cutW, top: 520, bottom: 0, background: 'radial-gradient(ellipse at 50% 75%, rgba(0,0,0,0.5), rgba(0,0,0,0) 70%)' }} />
      {hook && t < hookEnd + 0.05 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, ...pop(t, S + 0.1, hookEnd, 30, 0.85) }}>
          <div style={sticker('#fff', '#111', 74, { transform: 'rotate(-2deg)' })}>{hook.text}</div>
          {hook.sub && <div style={sticker(K.orange, '#fff', 44, { transform: 'rotate(1.5deg)' })}>{hook.sub}</div>}
        </div>
      )}
    </div>
  );
};

// ── 3 · cutoutBackdrop ───────────────────────────────────────────────────────────────────
// Opens with a scattered collage + hook sticker, then one full-screen picture per idea (hard cuts); a corner shade follows the cut-out.
export type CutoutBackdropProps = {
  hook?: { lines: string[]; sub?: string; tone?: 'white' | 'orange' };
  collage: string[]; backdrops: { at: number; src: string; corner?: 'TL' | 'TR' | 'BL' | 'BR' }[]; captionY?: number;
};
const CORNER_AT: Record<string, string> = { TL: '0% 0%', TR: '100% 0%', BL: '0% 100%', BR: '100% 100%' };
const CutoutBackdrop: React.FC<Base & CutoutBackdropProps & { keys?: string[] }> = ({ t, S, E, hook, collage, backdrops, captionY = 960, words, keys }) => {
  const bd = [...backdrops].sort((a, b) => a.at - b.at);
  const bi = activeIdx(bd, t);
  const openEnd = bd[0]?.at ?? S + 3;
  const tone = hook?.tone ?? 'white';
  const HOOK_TOP = 230;
  return (
    <div style={{ ...FULL, background: K.bg }}>
      {bi < 0 && (
        <>
          {collage.map((src, i) => {
            const n = collage.length, col = i % 2, row = Math.floor(i / 2);
            const x = col ? 560 + rnd(i + 1) * 60 : 40 + rnd(i + 1) * 60, y = 560 + row * 330 + rnd(i + 9) * 50;
            const w = 440 - n * 6, h = w * 0.78, rot = (rnd(i + 5) - 0.5) * 14;
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: 20, border: '7px solid #fff', boxSizing: 'border-box', boxShadow: '0 24px 44px -16px rgba(0,0,0,0.55)', background: '#111', ...pop(t, S + 0.05 + i * 0.09, openEnd, 30, 0.7), transform: `${pop(t, S + 0.05 + i * 0.09, openEnd, 30, 0.7).transform} rotate(${rot}deg)` }}>
                <Media src={src} from={S} />
              </div>
            );
          })}
          {hook && (
            <div style={{ position: 'absolute', left: 0, width: 1080, top: HOOK_TOP, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, ...pop(t, S + 0.1, openEnd, 30, 0.85) }}>
              {hook.lines.map((l, i) => <div key={i} style={sticker(tone === 'white' ? '#fff' : K.orange, tone === 'white' ? '#111' : '#fff', 80, { transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` })}>{l}</div>)}
              {hook.sub && <div style={{ fontFamily: K.serif, fontStyle: 'italic', fontSize: 62, color: K.ink, marginTop: 6 }}>{hook.sub}</div>}
            </div>
          )}
        </>
      )}
      {bi >= 0 && (() => {
        const b = bd[bi], span = Math.max(0.6, (bd[bi + 1]?.at ?? E) - b.at);
        const corner = b.corner ?? (['BR', 'BL', 'BR', 'BL'] as const)[bi % 4];
        return (
          <div key={bi} style={{ ...FULL, overflow: 'hidden', background: '#111' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${1.02 + 0.06 * lin(t, b.at, span)})` }}><Media src={b.src} from={b.at} /></div>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${CORNER_AT[corner]}, rgba(0,0,0,0.55), rgba(0,0,0,0) 62%)` }} />
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.35 * (1 - lin(t, b.at, 0.14)) }} />
          </div>
        );
      })()}
      <OneWord t={t} words={words} keys={keys} top={captionY} size={96} keyColor={K.orange} />
    </div>
  );
};

// ── 4 · naturalStory ─────────────────────────────────────────────────────────────────────
// You stay in the real room. Pictures, a quote card, a "print" card or a crown trio pop in beside / above the head (best with layout cutout or depth).
export type StoryMoment = { at: number; end?: number; kind: 'square' | 'quote' | 'print' | 'shot' | 'crown'; srcs?: string[]; text?: string; author?: string; build?: number[] };
export type NaturalStoryProps = { moments: StoryMoment[] };
const NaturalStory: React.FC<Base & NaturalStoryProps & { keys?: string[] }> = ({ t, E, moments, words }) => {
  const ms = [...moments].sort((a, b) => a.at - b.at);
  return (
    <div style={FULL}>
      {ms.map((m, i) => {
        const end = m.end ?? ms[i + 1]?.at ?? E;
        if (t < m.at || t > end + 0.05) return null;
        const left = i % 2 === 0, x0 = left ? 70 : 1080 - 70;
        const sp = pop(t, m.at, end, 50, 0.8);
        const srcs = m.srcs ?? [];
        if (m.kind === 'square') {
          return <div key={i} style={{ position: 'absolute', left: left ? x0 : x0 - 520, top: 300, width: 520, height: 520, borderRadius: 34, overflow: 'hidden', border: '8px solid #fff', boxSizing: 'border-box', background: '#111', boxShadow: '0 30px 60px -22px rgba(0,0,0,0.6)', ...sp, transform: `${sp.transform} rotate(${left ? -3 : 3}deg)` }}><Media src={srcs[0] ?? ''} from={m.at} /></div>;
        }
        if (m.kind === 'quote') {
          return (
            <div key={i} style={{ position: 'absolute', left: left ? x0 : x0 - 640, top: 300, width: 640, background: '#0B0B0C', color: '#fff', borderRadius: 34, padding: '44px 46px 40px', boxSizing: 'border-box', boxShadow: '0 30px 60px -22px rgba(0,0,0,0.65)', ...sp }}>
              <div style={{ fontFamily: K.serif, fontSize: 130, lineHeight: 0.6, color: K.orange, height: 56 }}>{'“'}</div>
              <div style={{ fontFamily: K.serif, fontStyle: 'italic', fontSize: 62, lineHeight: 1.12 }}>{m.text}</div>
              {m.author && <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 3, textTransform: 'uppercase', color: K.orange }}>{m.author}</div>}
            </div>
          );
        }
        if (m.kind === 'print' || m.kind === 'shot') {
          return (
            <div key={i} style={{ position: 'absolute', left: left ? x0 : x0 - 600, top: 250, width: 600, height: 640, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px -22px rgba(0,0,0,0.6)', ...sp, transform: `${sp.transform} rotate(${left ? 2.5 : -2.5}deg)` }}>
              <div style={{ height: 50, background: '#EDEDED', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px' }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />)}</div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 50, bottom: 0 }}><Media src={srcs[0] ?? ''} from={m.at} /></div>
            </div>
          );
        }
        // crown: three pictures arching over the head
        const pos = [{ x: 90, y: 460, r: -9 }, { x: 375, y: 250, r: 0 }, { x: 660, y: 460, r: 9 }];
        return (
          <React.Fragment key={i}>
            {[0, 1, 2].map((c) => {
              const src = srcs[c]; if (!src) return null;
              const at = m.build?.[c] ?? m.at + c * 0.3;
              if (t < at) return null;
              const st = pop(t, at, end, 60, 0.7);
              return <div key={c} style={{ position: 'absolute', left: pos[c].x, top: pos[c].y, width: 330, height: 330, borderRadius: 28, overflow: 'hidden', border: '7px solid #fff', boxSizing: 'border-box', background: '#111', boxShadow: '0 26px 50px -18px rgba(0,0,0,0.6)', ...st, transform: `${st.transform} rotate(${pos[c].r}deg)` }}><Media src={src} from={at} /></div>;
            })}
          </React.Fragment>
        );
      })}
      <SmallCaption t={t} words={words} top={1270} size={46} />
    </div>
  );
};

// ── 5 · originStory ──────────────────────────────────────────────────────────────────────
// One photo/clip per shot, big year + one plain sentence. Hard cuts; `letterbox` puts a landscape clip in a band with the text in the black; `drop` = the turn.
export type OriginShot = { at: number; src: string; year: string; text: string; letterbox?: boolean; drop?: boolean };
export type OriginStoryProps = { shots: OriginShot[] };
const OriginStory: React.FC<Base & OriginStoryProps> = ({ t, S, E, shots }) => {
  const sh = [...shots].sort((a, b) => a.at - b.at);
  const k = Math.max(0, activeIdx(sh, t));
  const s = sh[k];
  if (!s) return null;
  const end = sh[k + 1]?.at ?? E, span = Math.max(0.5, end - s.at);
  const p = ease.outCubic(lin(t, s.at + 0.05, 0.4));
  const flash = s.drop ? 0.7 * (1 - lin(t, s.at, 0.2)) : 0;
  const punch = s.drop ? 1 + 0.12 * (1 - ease.outCubic(lin(t, s.at, 0.35))) : 1;
  const yearCol = s.drop ? K.orange : '#fff';
  const zoom = 1.02 + 0.07 * lin(t, s.at, span);
  const lb = !!s.letterbox;
  return (
    <div style={{ ...FULL, background: '#000' }}>
      <div key={k} style={lb ? { position: 'absolute', left: 0, top: 360, width: 1080, height: 608, overflow: 'hidden' } : { position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})` }}><Media src={s.src} from={s.at} /></div>
      </div>
      {!lb && <div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 82%)' }} />}
      <div style={{ position: 'absolute', left: 70, right: 70, top: lb ? 1030 : 1090, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${punch})`, transformOrigin: '0 50%' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 210, letterSpacing: -8, lineHeight: 0.95, color: yearCol, textShadow: lb ? 'none' : '0 6px 30px rgba(0,0,0,0.5)' }}>{s.year}</div>
        <div style={{ marginTop: 18, fontFamily: K.serif, fontStyle: 'italic', fontSize: 70, lineHeight: 1.08, color: '#fff', textShadow: lb ? 'none' : '0 4px 20px rgba(0,0,0,0.6)' }}>{s.text}</div>
      </div>
      <div style={{ ...FULL, background: '#fff', opacity: flash }} />
    </div>
  );
};

// ── 6 · splitFace ────────────────────────────────────────────────────────────────────────
// Top half = your face (transparent window), bottom half black: serif kicker, ALL-CAPS title with a glowing word, mind map building with the speech.
export type SplitFaceProps = { kicker?: string; head: string; core: string; coreAt: number; chips: { text: string; at: number }[] };
const SplitFace: React.FC<Base & SplitFaceProps> = ({ t, S, E, kicker, head, core, coreAt, chips }) => {
  const TOP = 960, o = ease.outCubic(lin(t, S, 0.3)), out = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
  const cx = 540, cy = 1545, rx = 340, ry = 150;
  const cp = ease.outBack(lin(t, coreAt, 0.5));
  const pulse = 0.5 + 0.5 * Math.sin((t - S) * 3.2);
  return (
    <div style={{ ...FULL, opacity: out }}>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: TOP * (1 - o) * 0 + TOP, height: 1920 - TOP, background: '#050505', transform: `translateY(${(1 - o) * 400}px)` }} />
      <div style={{ position: 'absolute', left: 0, width: 1080, top: TOP - 3, height: 3, background: K.orange, opacity: o }} />
      <div style={{ position: 'absolute', left: 50, right: 50, top: TOP + 34, textAlign: 'center', opacity: o }}>
        {kicker && <div style={{ fontFamily: K.serif, fontStyle: 'italic', fontSize: 58, color: K.orange, marginBottom: 6 }}>{kicker}</div>}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 82, letterSpacing: -3, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>
          <Rich text={head} hl={{ color: K.orange, textShadow: `0 0 ${14 + 22 * pulse}px ${K.orange}, 0 0 ${40 + 40 * pulse}px ${K.orange}` }} />
        </div>
      </div>
      <svg style={{ position: 'absolute', inset: 0 }} width={1080} height={1920}>
        {chips.map((c, i) => {
          const a = (-90 + (360 / Math.max(1, chips.length)) * (i + 0.5) ) * Math.PI / 180;
          const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, p = ease.outCubic(lin(t, c.at, 0.35));
          return <line key={i} x1={cx} y1={cy} x2={cx + (x - cx) * p} y2={cy + (y - cy) * p} stroke={K.orange} strokeWidth={4} strokeLinecap="round" opacity={0.7 * p} />;
        })}
      </svg>
      {cp > 0 && (
        <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${cp})`, background: K.orange, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 56, letterSpacing: -1, padding: '20px 44px', borderRadius: 999, boxShadow: `0 0 ${30 + 20 * pulse}px ${K.orange}99`, whiteSpace: 'nowrap', opacity: clamp(cp, 0, 1) }}>{core}</div>
      )}
      {chips.map((c, i) => {
        const a = (-90 + (360 / Math.max(1, chips.length)) * (i + 0.5)) * Math.PI / 180;
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, p = ease.outBack(lin(t, c.at, 0.4));
        if (p <= 0) return null;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})`, opacity: clamp(p * 2, 0, 1), background: '#fff', color: '#111', fontFamily: FONT, fontWeight: 800, fontSize: 40, padding: '12px 28px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 12px 28px -10px rgba(0,0,0,0.7)' }}>{c.text}</div>;
      })}
    </div>
  );
};

// ── 7 · dualRole ─────────────────────────────────────────────────────────────────────────
// Fixed POV header (2 white boxes); each line is a shot: NOVICE (blue tag, bold white caption) vs SOURCE (✦ Name ✦, serif orange phrase).
// (The wider / mirrored vs tighter framing of the two roles is a presenter-layer shot choice; this layer draws the graphics.)
export type DualLine = { at: number; role: 'novice' | 'source'; text: string };
export type DualRoleProps = { header: string[]; lines: DualLine[]; sourceName?: string; noviceName?: string };
const DualRole: React.FC<Base & DualRoleProps> = ({ t, S, E, header, lines, sourceName = 'The Source', noviceName = 'You' }) => {
  const ls = [...lines].sort((a, b) => a.at - b.at);
  const k = activeIdx(ls, t), l = k >= 0 ? ls[k] : null;
  const o = fade(t, S, E, 0.25);
  const hp = ease.outBack(lin(t, S, 0.45));
  const lp = l ? ease.outBack(lin(t, l.at, 0.3)) : 0;
  const src = l?.role === 'source';
  return (
    <div style={FULL}>
      <div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.6))', opacity: o }} />
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 270, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: o, transform: `translateY(${(1 - hp) * -30}px)` }}>
        {header.slice(0, 2).map((h, i) => <div key={i} style={{ background: '#fff', color: '#111', fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: -1.5, padding: '12px 34px 16px', borderRadius: 16, boxShadow: '0 14px 30px -12px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>{h}</div>)}
      </div>
      {l && (
        <div key={k} style={{ position: 'absolute', left: 60, right: 60, top: src ? 1130 : 1180, textAlign: 'center', opacity: o * clamp(lp * 2, 0, 1), transform: `scale(${0.92 + 0.08 * lp})` }}>
          {src ? (
            <>
              <div style={{ fontFamily: K.serif, fontStyle: 'italic', fontSize: 50, color: '#fff', marginBottom: 12, textShadow: '0 3px 14px rgba(0,0,0,0.6)' }}>{'✦'} {sourceName} {'✦'}</div>
              <div style={{ fontFamily: K.serif, fontSize: 84, lineHeight: 1.04, color: K.orange, textShadow: '0 4px 22px rgba(0,0,0,0.6)' }}>{l.text}</div>
            </>
          ) : (
            <>
              <div style={{ display: 'inline-block', background: '#2563EB', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 22px', borderRadius: 10, marginBottom: 16 }}>{noviceName}</div>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, lineHeight: 1.06, letterSpacing: -2, color: '#fff', ...STROKE, WebkitTextStroke: '10px #000' }}>{l.text}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── 8 · cinematicType ────────────────────────────────────────────────────────────────────
// The window changes every 1-3 s: face, B&W b-roll with a giant top caption, orange serif type card (words build a line), grey canvas with a 3D card, warm b-roll.
export type CineWindow = { at: number; kind: 'face' | 'bw' | 'typecard' | 'grey' | 'warm'; src?: string; text?: string; serif?: string };
export type CinematicTypeProps = { windows: CineWindow[]; keys?: string[]; neg?: string };
const CinematicType: React.FC<Base & CinematicTypeProps> = ({ t, S, E, windows, keys, neg, words }) => {
  const ws = [...windows].sort((a, b) => a.at - b.at);
  const k = Math.max(0, activeIdx(ws, t));
  const w = ws[k];
  if (!w) return null;
  const end = ws[k + 1]?.at ?? E, span = Math.max(0.4, end - w.at), prog = lin(t, w.at, span);
  let body: React.ReactNode = null;
  if (w.kind === 'face') {
    body = <div style={{ ...FULL, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5))' }} />;
  } else if (w.kind === 'bw' || w.kind === 'warm') {
    const bw = w.kind === 'bw';
    body = (
      <div style={{ ...FULL, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1.04 + 0.06 * prog})` }}><Media src={w.src ?? ''} from={w.at} filter={bw ? 'grayscale(1) contrast(1.25) brightness(0.85)' : 'sepia(0.4) saturate(1.3) contrast(1.05)'} /></div>
        {!bw && <div style={{ ...FULL, background: `linear-gradient(160deg, ${K.orange}55, rgba(0,0,0,0) 60%)`, mixBlendMode: 'multiply' }} />}
        <div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0) 35%)' }} />
        {bw && w.text && <div style={{ position: 'absolute', left: 40, right: 40, top: 230, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 168, lineHeight: 0.92, letterSpacing: -6, textTransform: 'uppercase', color: '#fff', opacity: ease.outCubic(lin(t, w.at, 0.2)), transform: `scale(${1.08 - 0.08 * ease.outCubic(lin(t, w.at, 0.3))})`, textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>{w.text}</div>}
      </div>
    );
  } else if (w.kind === 'typecard') {
    const ws2 = (w.serif ?? w.text ?? '').split(' ').filter(Boolean), n = ws2.length;
    const step = Math.min(0.28, (span * 0.7) / Math.max(1, n));
    const shown = ws2.filter((_, i) => t >= w.at + 0.1 + i * step);
    const frac = clamp(shown.length / Math.max(1, n), 0, 1);
    body = (
      <div style={{ ...FULL, background: K.orange }}>
        <div style={{ position: 'absolute', left: 80, right: 80, top: 520 }}>
          <div style={{ fontFamily: K.serif, fontSize: 138, lineHeight: 1.02, color: '#fff', letterSpacing: -2 }}>
            {ws2.map((x, i) => { const p = ease.outCubic(lin(t, w.at + 0.1 + i * step, 0.25)); return <span key={i} style={{ display: 'inline-block', marginRight: 26, opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>{x}</span>; })}
          </div>
          <div style={{ marginTop: 28, height: 8, borderRadius: 4, background: '#fff', width: `${frac * 100}%`, transition: 'none' }} />
        </div>
      </div>
    );
  } else {
    const rot = -18 + 10 * prog;
    body = (
      <div style={{ ...FULL, background: 'linear-gradient(160deg, #A4A7AC, #6F7378)', perspective: 1500 }}>
        <div style={{ position: 'absolute', left: 150, top: 330, width: 780, height: 1020, borderRadius: 38, overflow: 'hidden', transform: `rotateY(${rot}deg) rotateX(${5 - 3 * prog}deg) scale(${0.92 + 0.08 * ease.outBack(lin(t, w.at, 0.4))})`, boxShadow: '0 60px 90px -30px rgba(0,0,0,0.6)', background: '#111' }}>
          <Media src={w.src ?? ''} from={w.at} />
        </div>
      </div>
    );
  }
  return (
    <div style={FULL}>
      {body}
      <OneWord t={t} words={words} keys={keys} neg={neg} top={1240} size={112} keyColor="#FFE9D0" />
    </div>
  );
};

// ── 9 · glassPanel ───────────────────────────────────────────────────────────────────────
// Black dotted world with drifting lights, you in a rounded panel at the bottom, frosted-glass cards (label / counting stat / typed text / image) that focus in with a glare sweep.
export type GlassCard = { at: number; kind: 'label' | 'stat' | 'type' | 'image'; text?: string; sub?: string; src?: string; x: number; y: number; w: number; h: number };
export type GlassPanelProps = { title?: string; cards: GlassCard[] };
const PANEL_TOP = 1010;
const MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'><path fill-rule='evenodd' d='M0 0H1080V1920H0Z M96 ${PANEL_TOP}H984A56 56 0 0 1 1040 ${PANEL_TOP + 56}V1950H40V${PANEL_TOP + 56}A56 56 0 0 1 96 ${PANEL_TOP}Z'/></svg>`)}")`;
const commas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const GlassPanel: React.FC<Base & GlassPanelProps> = ({ t, S, E, title, cards }) => {
  const o = fade(t, S, E, 0.3);
  return (
    <div style={{ ...FULL, opacity: o }}>
      <div style={{ ...FULL, background: '#05070A', WebkitMaskImage: MASK, maskImage: MASK, WebkitMaskSize: '1080px 1920px', maskSize: '1080px 1920px' }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = rnd(i + 1) * 1080 + Math.sin(t * 0.35 + i * 2) * 70, y = rnd(i + 20) * 1000 + Math.cos(t * 0.3 + i) * 60, r = 170 + rnd(i + 40) * 140;
          const c = i % 3 === 0 ? K.orange : i % 3 === 1 ? '#3B6BFF' : '#7A3BFF';
          return <div key={i} style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: `radial-gradient(circle, ${c}55, ${c}00 70%)`, opacity: 0.55 + 0.25 * Math.sin(t * 0.9 + i) }} />;
        })}
        <div style={{ ...FULL, backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 2px, rgba(255,255,255,0) 2.6px)', backgroundSize: '54px 54px', backgroundPosition: `0 ${(t * 8) % 54}px` }} />
      </div>
      <div style={{ position: 'absolute', left: 40, top: PANEL_TOP, width: 1000, height: 940, borderRadius: 56, boxSizing: 'border-box', border: '2px solid rgba(255,255,255,0.28)', boxShadow: `0 0 60px -10px ${K.orange}77, inset 0 0 40px rgba(255,255,255,0.05)` }} />
      {title && (
        <div style={{ position: 'absolute', left: 50, right: 50, top: 150, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 78, letterSpacing: -3, lineHeight: 1.02, color: '#fff', ...pop(t, S + 0.15, E, 24, 0.92) }}>
          <Rich text={title} hl={{ color: K.orange, fontFamily: K.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 92 }} />
        </div>
      )}
      {cards.map((c, i) => {
        if (t < c.at - 0.02) return null;
        const p = ease.outCubic(lin(t, c.at, 0.5)), out = 1 - ease.inCubic(lin(t, E - 0.25, 0.25));
        const glare = lin(t, c.at + 0.3, 0.8);
        let inner: React.ReactNode = null;
        if (c.kind === 'label') {
          inner = <><div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: -1.5, color: '#fff', lineHeight: 1.05 }}>{c.text}</div>{c.sub && <div style={{ marginTop: 10, fontFamily: FONT, fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,0.65)' }}>{c.sub}</div>}</>;
        } else if (c.kind === 'stat') {
          const m = /^(\D*)([\d,]+(?:\.\d+)?)(.*)$/.exec(c.text ?? '');
          const target = m ? parseFloat(m[2].replace(/,/g, '')) : 0, dec = m && m[2].includes('.') ? m[2].split('.')[1].length : 0;
          const v = target * ease.outCubic(lin(t, c.at + 0.2, 1.1));
          const num = m ? commas(v.toFixed(dec)) : c.text;
          inner = <><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: Math.min(130, c.h * 0.55), letterSpacing: -4, color: '#fff', lineHeight: 1 }}>{m?.[1]}<span style={{ color: K.orange }}>{num}</span>{m?.[3]}</div>{c.sub && <div style={{ marginTop: 8, fontFamily: FONT, fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,0.65)' }}>{c.sub}</div>}</>;
        } else if (c.kind === 'type') {
          const txt = c.text ?? '', n = Math.floor(clamp((t - c.at - 0.35) * 26, 0, txt.length));
          inner = <div style={{ fontFamily: MONO, fontSize: 36, lineHeight: 1.3, color: '#E8EEF8' }}>{txt.slice(0, n)}<span style={{ color: K.orange, opacity: Math.floor(t * 3) % 2 ? 0.2 : 1 }}>{'▌'}</span></div>;
        } else {
          inner = <div style={{ position: 'absolute', inset: 0 }}><Media src={c.src ?? ''} from={c.at} /></div>;
        }
        return (
          <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: 32, overflow: 'hidden', boxSizing: 'border-box', padding: c.kind === 'image' ? 0 : 30, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))', backdropFilter: 'blur(14px)', border: '1.5px solid rgba(255,255,255,0.28)', boxShadow: '0 24px 50px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.3)', opacity: p * out, filter: `blur(${(1 - p) * 16}px)`, transform: `scale(${0.88 + 0.12 * p}) translateY(${(1 - p) * 30}px)` }}>
            {inner}
            <div style={{ position: 'absolute', top: -40, bottom: -40, width: c.w * 0.3, left: `${-30 + glare * 150}%`, background: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))', transform: 'skewX(-18deg)', opacity: glare > 0 && glare < 1 ? 1 : 0 }} />
          </div>
        );
      })}
    </div>
  );
};

// ── 10 · tiktokEdit ──────────────────────────────────────────────────────────────────────
// tiktok : clean talking head, tiny outlined 2-line captions, hook in rounded boxes (+ colour-inverted bracket), photo card above the head.
// stacked: b-roll full screen with simple captions; key phrases get a left-aligned stack whose last line is huge (key word in orange serif italic).
export type TiktokEditProps = {
  variant?: 'tiktok' | 'stacked';
  hook?: { lines: string[]; bracket?: string; until: number; tone?: 'black' | 'white' | 'brand' };
  photo?: { at: number; end: number; src: string };
  broll?: { at: number; end: number; src: string }[];
  stacks?: { at: number; end: number; lines: string[]; lineAt?: number[] }[];
  keys?: string[];
};
const TONES = { black: { bg: '#0B0B0C', fg: '#fff', bb: '#fff', bf: '#0B0B0C' }, white: { bg: '#fff', fg: '#0B0B0C', bb: '#0B0B0C', bf: '#fff' }, brand: { bg: '', fg: '#fff', bb: '#fff', bf: '' } };
const TiktokEdit: React.FC<Base & TiktokEditProps> = ({ t, S, E, variant = 'tiktok', hook, photo, broll = [], stacks = [], keys, words }) => {
  if (variant === 'stacked') {
    const bl = broll.find((b) => t >= b.at && t < b.end);
    const st = stacks.find((s) => t >= s.at && t < s.end);
    return (
      <div style={FULL}>
        {bl && <div key={bl.at} style={{ ...FULL, overflow: 'hidden', background: '#000' }}><div style={{ position: 'absolute', inset: 0, transform: `scale(${1.03 + 0.05 * lin(t, bl.at, bl.end - bl.at)})` }}><Media src={bl.src} from={bl.at} /></div><div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6))' }} /></div>}
        {st && (
          <div style={{ position: 'absolute', left: 64, right: 64, top: 700, bottom: 700, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 6 }}>
            {st.lines.map((ln, i) => {
              const last = i === st.lines.length - 1, at = st.lineAt?.[i] ?? st.at + i * 0.3;
              if (t < at) return null;
              const p = ease.outBack(lin(t, at, 0.4)), e = ease.inCubic(lin(t, st.end - 0.2, 0.2));
              return (
                <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: last ? 150 : 76, lineHeight: 1, letterSpacing: last ? -6 : -2, color: '#fff', textTransform: last ? 'none' : 'uppercase', opacity: clamp(p * 2, 0, 1) * (1 - e), transform: `translateX(${(1 - p) * -60}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)' }}>
                  <Rich text={ln} hl={{ fontFamily: K.serif, fontStyle: 'italic', fontWeight: 400, color: K.orange, fontSize: last ? 190 : 96, letterSpacing: -3 }} />
                </div>
              );
            })}
          </div>
        )}
        {!st && <SmallCaption t={t} words={words} top={1330} size={54} keys={keys} />}
      </div>
    );
  }
  const tn = TONES[hook?.tone ?? 'black'];
  const bg = hook?.tone === 'brand' ? K.orange : tn.bg, bf = hook?.tone === 'brand' ? K.orange : tn.bf;
  const hu = hook?.until ?? S;
  return (
    <div style={FULL}>
      {hook && t < hu + 0.05 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {hook.lines.map((l, i) => <div key={i} style={{ background: bg, color: tn.fg, fontFamily: FONT, fontWeight: 800, fontSize: 60, letterSpacing: -1.5, padding: '12px 36px 16px', borderRadius: 30, boxShadow: '0 14px 30px -12px rgba(0,0,0,0.45)', whiteSpace: 'nowrap', ...pop(t, S + 0.08 + i * 0.12, hu, 24, 0.85) }}>{l}</div>)}
          {hook.bracket && <div style={{ background: tn.bb, color: bf, fontFamily: FONT, fontWeight: 900, fontSize: 52, padding: '8px 30px 12px', borderRadius: 24, whiteSpace: 'nowrap', ...pop(t, S + 0.08 + hook.lines.length * 0.12, hu, 24, 0.85) }}>[{hook.bracket}]</div>}
        </div>
      )}
      {photo && t >= photo.at - 0.02 && t < photo.end + 0.05 && (
        <div style={{ position: 'absolute', left: 290, top: 420, width: 500, height: 620, borderRadius: 30, overflow: 'hidden', border: '8px solid #fff', boxSizing: 'border-box', background: '#111', boxShadow: '0 30px 60px -22px rgba(0,0,0,0.6)', ...pop(t, photo.at, photo.end, 50, 0.8) }}><Media src={photo.src} from={photo.at} /></div>
      )}
      <SmallCaption t={t} words={words} top={1290} size={50} keys={keys} />
    </div>
  );
};

// ── 11 · personalOpen ────────────────────────────────────────────────────────────────────
// Opens on your face: 2-line hook (line 2 in a white block), Instagram-style comments dropping in under the caption, one-word captions, quick full-screen b-roll cutaways.
export type PersonalOpenProps = {
  hook: string[]; cutaways?: { at: number; end: number; src: string }[];
  comments?: { at: number; user: string; text: string }[]; keys?: string[]; hookUntil?: number;
};
const PersonalOpen: React.FC<Base & PersonalOpenProps> = ({ t, S, E, hook, cutaways = [], comments = [], keys, hookUntil, words }) => {
  const cut = cutaways.find((c) => t >= c.at && t < c.end);
  const hu = hookUntil ?? cutaways[0]?.at ?? S + 3;
  const shown = comments.filter((c) => t >= c.at).sort((a, b) => b.at - a.at);
  return (
    <div style={FULL}>
      {!cut && (
        <>
          <div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0) 28%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5))' }} />
          {t < hu + 0.05 && (
            <div style={{ position: 'absolute', left: 50, right: 50, top: 270, textAlign: 'center' }}>
              {hook[0] && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 78, letterSpacing: -2.5, lineHeight: 1.05, color: '#fff', ...STROKE, WebkitTextStroke: '10px #000', ...pop(t, S + 0.05, hu, 24, 0.9) }}>{hook[0]}</div>}
              {hook[1] && <div style={{ marginTop: 14, ...pop(t, S + 0.25, hu, 24, 0.9) }}><span style={sticker('#fff', '#0B0B0C', 78)}>{hook[1]}</span></div>}
            </div>
          )}
          {shown.slice(0, 3).map((c, rank) => {
            const p = ease.outBack(lin(t, c.at, 0.5)), slide = rank * 124;
            const hue = Math.floor(rnd(c.user.length * 7 + c.user.charCodeAt(0)) * 360);
            return (
              <div key={c.at + c.user} style={{ position: 'absolute', left: 90, right: 90, top: 1360 + slide + (1 - p) * -300, height: 104, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', background: 'rgba(255,255,255,0.93)', borderRadius: 30, boxShadow: '0 16px 34px -14px rgba(0,0,0,0.55)', opacity: clamp(p * 2, 0, 1) * (1 - 0.38 * rank) }}>
                <div style={{ width: 62, height: 62, borderRadius: 99, flexShrink: 0, background: `hsl(${hue},65%,52%)`, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.user[0]?.toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 25, color: '#111' }}>{c.user}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 31, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</div>
                </div>
              </div>
            );
          })}
          <OneWord t={t} words={words} keys={keys} top={1180} size={84} keyColor={K.orange} />
        </>
      )}
      {cut && <div key={cut.at} style={{ ...FULL, overflow: 'hidden', background: '#000' }}><div style={{ position: 'absolute', inset: 0, transform: `scale(${1.03 + 0.05 * lin(t, cut.at, cut.end - cut.at)})` }}><Media src={cut.src} from={cut.at} /></div></div>}
    </div>
  );
};

// ── 12 · timestamp ───────────────────────────────────────────────────────────────────────
// Each clip full-frame; spaced "DAY n" above a big clock time (tiny am/pm) rises 0.22 s after the cut and leaves with the clip.
export type TimestampProps = { clips: { at: number; end: number; src: string; day?: number | string; time: string }[] };
const Timestamp: React.FC<Base & TimestampProps> = ({ t, clips }) => {
  const c = clips.find((x) => t >= x.at && t < x.end);
  if (!c) return null;
  const m = /^\s*([\d:.]+)\s*([a-zA-Z]*)\s*$/.exec(c.time);
  const big = m ? m[1] : c.time, ap = m ? m[2].toLowerCase() : '';
  const p = ease.outCubic(lin(t, c.at + 0.22, 0.4)), e = ease.inCubic(lin(t, c.end - 0.2, 0.2));
  return (
    <div style={FULL}>
      <div key={c.at} style={{ ...FULL, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1.02 + 0.04 * lin(t, c.at, c.end - c.at)})` }}><Media src={c.src} from={c.at} /></div>
        <div style={{ ...FULL, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5))' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1150, textAlign: 'center', opacity: p * (1 - e), transform: `translateY(${(1 - p) * 70}px)` }}>
        {c.day != null && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, letterSpacing: 18, paddingLeft: 18, color: '#fff', textTransform: 'uppercase', textShadow: '0 3px 16px rgba(0,0,0,0.55)' }}>DAY {c.day}</div>}
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 190, letterSpacing: -7, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.55)' }}>
          {big}{ap && <span style={{ fontSize: 62, fontWeight: 700, letterSpacing: 0, marginLeft: 12 }}>{ap}</span>}
        </div>
      </div>
    </div>
  );
};

// ── registry ─────────────────────────────────────────────────────────────────────────────
const none = (): SfxCue[] => [];
export const FX_REELS = {
  imageCluster: { C: ImageCluster, sfx: none, frame: true as const },
  cutoutGrid: { C: CutoutGrid, sfx: none, frame: true as const },
  cutoutBackdrop: { C: CutoutBackdrop, sfx: none, frame: true as const },
  naturalStory: { C: NaturalStory, sfx: none, frame: true as const },
  originStory: { C: OriginStory, sfx: none, frame: true as const },
  splitFace: { C: SplitFace, sfx: none, frame: true as const },
  dualRole: { C: DualRole, sfx: none, frame: true as const },
  cinematicType: { C: CinematicType, sfx: none, frame: true as const },
  glassPanel: { C: GlassPanel, sfx: none, frame: true as const },
  tiktokEdit: { C: TiktokEdit, sfx: none, frame: true as const },
  personalOpen: { C: PersonalOpen, sfx: none, frame: true as const },
  timestamp: { C: Timestamp, sfx: none, frame: true as const },
};
