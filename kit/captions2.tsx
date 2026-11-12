import React from 'react';
import { FONT } from './tokens';
import { clamp, ease, lin } from './motion';
import { STACK as K } from './stack';
import type { Layout, Word } from './Stage';

// Caption styles for STACK videos. `buildTimedChunks` groups the transcript into short chunks and keeps every word's start time.
export type Chunk = { text: string[]; start: number; end: number; starts: number[] };
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

export const buildTimedChunks = (words: Word[], maxWords = 4, gap = 0.35): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ text: cur.map((w) => w.word.trim()), start: cur[0].start, end: cur[cur.length - 1].end, starts: cur.map((w) => w.start) }); cur = []; };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= maxWords || (prev && w.start - prev.end > gap))) flush();
    cur.push(w);
    if (/[.,!?]$/.test(w.word.trim())) flush();
  });
  flush();
  return out;
};
const current = (chunks: Chunk[], t: number) => chunks.findIndex((c, i) => t >= c.start - 0.05 && t < (chunks[i + 1]?.start ?? c.end + 0.4));

/** Small caption pill under the chin, words alternate ink / accent. */
export const MiniCaptions: React.FC<{ t: number; chunks: Chunk[]; hide: Array<[number, number]>; top?: number }> = ({ t, chunks, hide, top = 1450 }) => {
  if (hide.some(([s, e]) => t >= s && t < e)) return null;
  const idx = current(chunks, t);
  if (idx < 0) return null;
  const c = chunks[idx];
  const p = ease.outBack(lin(t, c.start - 0.05, 0.2));
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top, display: 'flex', justifyContent: 'center', opacity: clamp(p * 2, 0, 1), transform: `scale(${0.9 + 0.1 * p})` }}>
      <div style={{ background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '10px 26px 14px', boxShadow: '0 12px 30px -12px rgba(15,23,42,0.45)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 14px', maxWidth: 900 }}>
        {c.text.map((w, i) => {
          const q = ease.outCubic(lin(t, c.starts[i] - 0.06, 0.18));
          return <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, letterSpacing: -1.5, lineHeight: 1.1, color: i % 2 === 0 ? K.navy : K.orange, opacity: 0.25 + 0.75 * q }}>{w}</span>;
        })}
      </div>
    </div>
  );
};

/** Stack captions: zone C (live, under the stage) in `stack`, white on the chest in solo (`full`). Keyword words in the accent colour. */
export const StackCaptions: React.FC<{ t: number; chunks: Chunk[]; layout: Layout; keywords: string[]; hide: Array<[number, number]>; live?: 'full' | 'small' | 'off' }> = ({ t, chunks, layout, keywords, hide, live = 'full' }) => {
  if (hide.some(([s, e]) => t >= s && t < e)) return null;
  if (layout !== 'stack' && layout !== 'full') return null;
  if (layout === 'stack' && live === 'off') return null;
  const idx = current(chunks, t);
  if (idx < 0) return null;
  const c = chunks[idx];
  const solo = layout === 'full';
  const kw = new Set(keywords.map(clean));
  const chars = c.text.join(' ').length;
  const size = Math.min(solo ? 96 : live === 'small' ? 58 : 92, 940 / Math.max(6, chars * 0.56));
  const p = ease.outBack(lin(t, c.start - 0.05, 0.22));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: solo ? 1230 : live === 'small' ? 1030 : 1015, display: 'flex', justifyContent: 'center', gap: size * 0.26, flexWrap: 'nowrap', opacity: clamp(p * 2, 0, 1), transform: `translateY(${(1 - p) * 14}px) scale(${0.92 + 0.08 * p})` }}>
      {c.text.map((w, i) => {
        const hot = kw.has(clean(w));
        const q = ease.outCubic(lin(t, c.starts[i] - 0.06, 0.16));
        return <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size / 28, lineHeight: 1.05, whiteSpace: 'nowrap', opacity: 0.3 + 0.7 * q, color: hot ? K.orange : solo ? K.soloInk : K.ink, textShadow: solo ? '0 6px 24px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{w}</span>;
      })}
    </div>
  );
};
