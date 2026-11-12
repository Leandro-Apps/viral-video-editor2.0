// Day project entry (written by daily/new_day.py). Same timeline, two formats: 9:16 (Reels/Shorts/TikTok) and 16:9 (YouTube).
// Every animation family of the kit is available: base, real, formats, cutouts and all of kit/fx (screenDemo, titleCard,
// countUp, cards3d, whip, broll...). Catalog: kit/fx/*.md
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { makeKitVideo, VideoSpec } from './kit/Video';
import { SIZE, Format } from './kit/Stage';
import { FPS } from './kit/tokens';
import { FX } from './kit/fx';
import { SPEC } from './video';

const V = makeKitVideo(FX as any);
const variant = (id: string, format: Format) => (
  <Composition key={id} id={id} component={V as unknown as React.FC<Record<string, unknown>>}
    durationInFrames={Math.round(SPEC.duration * FPS)} fps={FPS} width={SIZE[format].w} height={SIZE[format].h}
    defaultProps={{ ...SPEC, format } as VideoSpec as unknown as Record<string, unknown>} />
);
const Root: React.FC = () => <>{[variant('__COMP__', 'vertical'), variant('__COMP__169', 'horizontal')]}</>;
registerRoot(Root);
