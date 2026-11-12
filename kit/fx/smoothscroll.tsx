// Family 09b · smoothScroll: ONE full-page screenshot scrolls top -> bottom in a single eased pass inside the same frame
// area that screenDemo uses (so the two cut together), then glides back to the top. Use it for "scroll through the page".
// Props: src (image in public/), w/h = pixel size of that image, area [x, y, w, h] (default: the whole frame), radius, backToTop.
import React from 'react';
import { Img, staticFile } from 'remotion';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number; format?: 'vertical' | 'horizontal' };
export type SmoothScrollProps = { src: string; w: number; h: number; area?: [number, number, number, number]; radius?: number; backToTop?: boolean };
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const io = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export const SmoothScroll: React.FC<Base & SmoothScrollProps> = ({ t, S, E, format, src, w, h, area, radius = 0, backToTop = true }) => {
  const [ax, ay, AW, AH] = area ?? (format === 'vertical' ? [0, 0, 1080, 1920] : [0, 0, 1920, 1080]);
  const k = AW / w, total = h * k, maxS = Math.max(0, total - AH);
  const p = cl((t - S - 0.12) / Math.max(0.5, E - S - 0.3));
  const y = backToTop ? maxS * io(cl(p / 0.82)) * (1 - io(cl((p - 0.82) / 0.18))) : maxS * io(p);
  const enter = io(cl((t - S) / 0.25)), leave = 1 - io(cl((t - (E - 0.2)) / 0.2));
  return (
    <div style={{ position: 'absolute', left: ax, top: ay, width: AW, height: AH, overflow: 'hidden', borderRadius: radius, background: '#fff', opacity: enter * leave }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: -y, width: AW, height: total }} />
    </div>
  );
};

const smoothScrollSfx = (_p: SmoothScrollProps, _S: number): SfxCue[] => [];
export const FX_SMOOTH = {
  smoothScroll: { C: SmoothScroll, sfx: smoothScrollSfx, frame: true },
};
