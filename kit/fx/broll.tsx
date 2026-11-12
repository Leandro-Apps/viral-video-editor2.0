// B-roll: quick real-world cutaways (stock footage from MEDIA/broll, fetched by daily/broll.py) that cover the
// whole frame while the voice keeps going. "roofing" → roofers on a roof, "dental" → a dentist at work.
// Each clip plays from its own start, slow push-in, short dip between clips, optional label chip (never on a face:
// stock people are not the presenter, and the chip sits bottom-left inside the safe area).
import React from 'react';
import { OffthreadVideo, Sequence, staticFile } from 'remotion';
import type { SfxCue } from '../Stage';
import { C, FONT, FPS } from '../tokens';

export type BrollClip = { src: string; at: number; label?: string; from?: number };
export type BrollProps = { clips: BrollClip[]; zoom?: number };
type P = BrollProps & { t: number; S: number; E: number; format?: 'vertical' | 'horizontal'; frame?: { w: number; h: number } };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const Broll: React.FC<P> = ({ t, S, E, clips, zoom = 0.08, format = 'horizontal', frame = { w: 1920, h: 1080 } }) => {
  const list = [...clips].sort((a, b) => a.at - b.at);
  const vertical = format === 'vertical';
  const fadeIn = clamp((t - S) / 0.18, 0, 1), fadeOut = clamp((E - t) / 0.18, 0, 1);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: frame.w, height: frame.h, overflow: 'hidden', background: '#000', opacity: Math.min(fadeIn, fadeOut) }}>
      {list.map((c, i) => {
        const end = list[i + 1]?.at ?? E;
        if (t < c.at - 0.05 || t > end + 0.05) return null;
        const p = clamp((t - c.at) / Math.max(0.5, end - c.at), 0, 1);
        const dip = i > 0 ? clamp((t - c.at) / 0.12, 0, 1) : 1;           // short dip-to-black cut between clips
        const from = Math.round((c.from ?? 0) * FPS);
        return (
          <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={Math.max(1, Math.round((end - c.at + 0.1) * FPS))} layout="none">
            <div style={{ position: 'absolute', inset: 0, opacity: dip, transform: `scale(${1 + zoom * p})`, transformOrigin: '50% 45%' }}>
              <OffthreadVideo src={staticFile(c.src)} muted startFrom={from} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* gentle vignette so captions / chips keep their contrast on any footage */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.45) 100%)' }} />
            {c.label && (
              <div style={{ position: 'absolute', left: vertical ? 70 : 80, ...(vertical ? { top: 260 } : { bottom: 80 }), opacity: clamp((t - c.at - 0.15) / 0.2, 0, 1),
                background: C.ink, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: vertical ? 44 : 38, padding: '14px 26px', borderRadius: 999,
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)', borderLeft: `8px solid ${C.orange}` }}>{c.label}</div>
            )}
          </Sequence>
        );
      })}
    </div>
  );
};
const brollSfx = (p: BrollProps, S: number): SfxCue[] => [{ name: 'whoosh', at: S, gain: 0.45 }];

export const FX_BROLL = { broll: { C: Broll, sfx: brollSfx, frame: true } };
