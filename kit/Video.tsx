import React from 'react';
import { AbsoluteFill } from 'remotion';
import { loadKitFonts } from './fonts';
import { Background, buildChunks, Captions, fitZone, Format, FREE_V, HEAVY, Music, PanelBackdrop, Presenter, ScreenRec, SfxCue, SfxTrack, shotState, Shot, useT, Word, Zone, ZONES } from './Stage';
import { StackBackground, StackCutout } from './fx/stack';
import { setStackTheme } from './stack';
import { buildTimedChunks, MiniCaptions, StackCaptions } from './captions2';
import { ELEMENTS, ElementName } from './elements';
import { GRAIN_URL, PaperBackground, PaperDefs } from './paper';

loadKitFonts();

export interface Beat { el: ElementName | (string & {}); S: number; E: number; props: Record<string, unknown>; sfx?: SfxCue[]; zone?: Partial<Record<Format, Zone>> }
export interface VideoSpec {
  duration: number;
  format?: Format;
  /** 'kit' = dot grid + white cards; 'diorama' = paper bg, orange portal, boxed captions */
  skin?: 'kit' | 'diorama';
  /** cutout = WebM with alpha made by daily/make_cutout.sh (needed for the cutout and depth layouts) */
  presenter: { src: string; face?: { x: number; y: number }; volume?: number; cutout?: string };
  music?: { src: string; volume: number };
  /** screen recording for the screen / split layouts (muted; your voice comes from the presenter track) */
  screen?: { src: string };
  words: Word[];
  keywords: string[];
  shots: Shot[];
  beats: Beat[];
  hideCaptions?: Array<[number, number]>;
  /** caption style: default kit captions, 'mini' (small pill) or 'stack' (STACK zones) */
  /** stack captions: live caption (zone C) in stack scenes: full size, small (58px) or off */
  stackLive?: 'full' | 'small' | 'off';
  /** STACK colour themes over time: [{ at: seconds, theme: preset name | colours }] (the last one whose `at` has passed wins) */
  stackThemes?: { at: number; theme: string | Record<string, string> }[];
  captions?: 'default' | 'mini' | 'stack';
  extraPunches?: number[];
  /** slow zoom on the talking head: 'auto' = every `full` stretch drifts (mostly in, every third one out), or explicit segments */
  drift?: 'auto' | Array<{ S: number; E: number; from: number; to: number }>;
}

/** Push-in / pull-out while you are alone on screen (layout `full`). Eased, ~1.4%/s + 3%, max 18%, never jumps mid-shot. */
export const driftSegments = (spec: VideoSpec) => {
  if (!spec.drift) return [];
  if (spec.drift !== 'auto') return spec.drift;
  const segs: Array<{ S: number; E: number; from: number; to: number }> = [];
  spec.shots.forEach((sh, i) => {
    if (sh.layout !== 'full') return;
    const E = spec.shots[i + 1]?.at ?? spec.duration;
    const d = E - sh.at;
    if (d < 2.5) return;
    const amt = Math.min(0.18, 0.014 * d + 0.03);   // the first 0.6%/s was too subtle
    const out = segs.length % 3 === 2;
    segs.push({ S: sh.at, E, from: out ? 1 + amt : 1, to: out ? 1 : 1 + amt });
  });
  return segs;
};
const driftAt = (segs: ReturnType<typeof driftSegments>, t: number) => {
  const g = segs.find((x) => t >= x.S && t < x.E);
  if (!g) return 1;
  const p = (t - g.S) / (g.E - g.S);
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease in-out
  return g.from + (g.to - g.from) * e;
};

/** Every sound in the video, derived from the beats + layout changes. */
/** Extra element registries (animation families in kit/fx) can be passed to makeKitVideo. */
export type ElementDef = { C: React.FC<any>; sfx: (p: any, S: number) => SfxCue[]; box?: (p: any, format?: string) => { x0: number; y0: number; x1: number; y1: number }; frame?: boolean };
const lookup = (el: string, extra?: Record<string, ElementDef>) => (extra?.[el] ?? (ELEMENTS as any)[el]) as ElementDef;

export const collectSfx = (spec: VideoSpec, extra?: Record<string, ElementDef>): SfxCue[] => {
  const cues: SfxCue[] = [];
  for (const b of spec.beats) {
    const def = lookup(b.el, extra).sfx as (p: any, S: number) => SfxCue[];
    cues.push(...(b.sfx ?? def(b.props, b.S)));
  }
  spec.shots.forEach((s, i) => {
    const prev = spec.shots[i - 1];
    const changed = prev && prev.layout !== s.layout;
    const near = cues.some((c) => c.name === 'whoosh' && Math.abs(c.at - s.at) < 0.25);
    if ((s.whoosh ?? changed) && !near && i > 0) cues.push({ name: 'whoosh', at: s.at, gain: 0.8 });
  });
  return cues.sort((a, b) => a.at - b.at);
};

export const KitVideo: React.FC<VideoSpec & { extra?: Record<string, ElementDef> }> = (spec) => {
  const t = useT();
  const extra = spec.extra;
  const cues = React.useMemo(() => collectSfx(spec, extra), [spec, extra]);
  const heavyAt = cues.filter((c) => HEAVY.includes(c.name)).map((c) => c.at);
  const chunks = React.useMemo(() => buildChunks(spec.words), [spec.words]);
  const timed = React.useMemo(() => buildTimedChunks(spec.words), [spec.words]);
  const format = spec.format ?? 'vertical';
  if (spec.stackThemes?.length) { const cur = [...spec.stackThemes].filter((x) => x.at <= t).pop() ?? spec.stackThemes[0]; setStackTheme(cur.theme as any); }
  const capMode = spec.captions ?? (format === 'vertical' ? 'stack' : 'default'); // house style: vertical videos are STACK videos
  const { rect, layout, dark, panel, matte, cut, stack, screenP, screenRect, focus } = shotState(spec.shots, t, format);
  const punches = [...heavyAt, ...(spec.extraPunches ?? [])];
  const hasCut = !!spec.presenter.cutout;
  const hide = spec.hideCaptions ?? [];
  const hidden = hide.some(([a, b]) => t >= a && t < b);
  const segs = React.useMemo(() => driftSegments(spec), [spec]);
  const drift = driftAt(segs, t);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {spec.skin === 'diorama' ? <><PaperDefs /><PaperBackground dark={dark} /></> : capMode === 'stack' ? <StackBackground t={t} /> : <Background t={t} dark={dark} />}
      {spec.screen && <ScreenRec src={spec.screen.src} rect={screenRect} p={screenP} t={t} focus={focus} />}
      <PanelBackdrop p={panel} t={t} paper={spec.skin === 'diorama' ? GRAIN_URL : undefined} />
      <Presenter rect={rect} t={t} punches={punches} src={spec.presenter.src} face={spec.presenter.face} volume={spec.presenter.volume ?? 1} portal={spec.skin === 'diorama'} drift={drift} alpha={hasCut ? 1 - cut : 1} fadeTop={format === 'vertical' ? matte - cut : 0} />
      {spec.beats.map((b, i) => {
        if (t < b.S - 0.05 || t > b.E + 0.05) return null;
        // real-footage cutaways own the frame: other elements step aside while a b-roll plays
        if (b.el !== 'broll' && spec.beats.some((o) => o.el === 'broll' && t >= o.S && t <= o.E)) return null;
        const def = lookup(b.el, extra);
        const El = def.C;
        // backdrop fills the whole frame (no zone)
        // full-frame elements (backdrop, transitions, camera moves) get the whole frame, no zone
        if (b.el === 'backdrop' || def.frame) return <El key={i} t={t} S={b.S} E={b.E} skin={spec.skin ?? 'kit'} format={format} frame={{ w: format === 'vertical' ? 1080 : 1920, h: format === 'vertical' ? 1920 : 1080 }} {...b.props} />;
        // zone follows the layout active when the beat starts (beats don't jump mid-flight)
        const lay = shotState(spec.shots, b.S, format).layout;
        const boxFn = def.box;
        const vArea = format === 'vertical' ? FREE_V[lay] : undefined;
        let z = b.zone?.[format] ?? (format === 'horizontal' && boxFn ? fitZone(boxFn(b.props, format), lay)
          : vArea && boxFn ? fitZone(boxFn(b.props, format), lay, vArea) : ZONES[format][lay]);
        // 16:9 lists keep their scale but stay centered on what is already on screen, gliding up as items land
        const list = (b.props as any).rows ?? (b.props as any).items ?? (b.props as any).steps;
        if ((format === 'horizontal' || lay === 'hidden') && !b.zone && boxFn && Array.isArray(list) && list.length > 1) {
          const shown = list.reduce((n: number, it: any) => n + Math.min(1, Math.max(0, (t - it.at) / 0.4)), 0);
          const frac = Math.max(1, shown) / list.length;
          const full = boxFn(b.props, format);
          const missing = (full.y1 - full.y0) * (1 - frac) * 0.8;
          z = { ...z, y: z.y + (missing / 2) * z.s };
        }
        return (
          <div key={i} style={{ position: 'absolute', left: z.x, top: z.y, width: 1080, height: 1920, transform: `scale(${z.s})`, transformOrigin: '0 0' }}>
            <El t={t} S={b.S} E={b.E} skin={spec.skin ?? 'kit'} format={format} onDark={panel > 0.5 || dark > 0.5} {...b.props} />
          </div>
        );
      })}
      {hasCut && matte > 0 && <Presenter rect={rect} t={t} punches={punches} src={spec.presenter.cutout!} face={spec.presenter.face} volume={0} drift={drift} alpha={matte} transparent />}
      {hasCut && stack > 0 && <StackCutout rect={rect} t={t} punches={punches} src={spec.presenter.cutout!} face={spec.presenter.face} alpha={stack} drift={drift} />}
      {capMode === 'stack' ? <StackCaptions t={t} chunks={timed} layout={layout} keywords={spec.keywords} hide={hide} live={spec.stackLive} />
        : spec.captions === 'mini' ? <MiniCaptions t={t} chunks={timed} hide={hide} />
        : <Captions t={t} chunks={chunks} layout={layout} dark={dark} keywords={spec.keywords} hide={hide} format={format} boxed={spec.skin === 'diorama' || format === 'vertical'} />}
      <SfxTrack cues={cues} />
      {spec.music && <Music src={spec.music.src} base={spec.music.volume} heavyAt={heavyAt} total={spec.duration} />}
    </AbsoluteFill>
  );
};

/** House edit for every brand : never a small presenter box with empty space around it.
 *  You are either full screen (`full`, pills as a lower third, b-roll cutaways) or a full-screen scene (`hidden`) with the
 *  graphic large, centered, equal margins, never near the edges. A scene starts when its first item lands; back-to-back
 *  scenes merge. `screens` = extra shots for product recordings (layout `screen`). Use: const E = autoEdit(BEATS, duration);
 *  then `shots: E.shots, beats: E.beats`. Pills: y 1300 (9:16 caption spot) and the 16:9 lower third left of the face. */
export const autoEdit = (beats: Beat[], screens: Shot[] = []) => {
  const firstAt = (b: Beat) => { const p = b.props as any; const l = p?.rows ?? p?.items ?? p?.steps ?? p?.cards; return Array.isArray(l) && l.length ? Math.min(...l.map((x: any) => x.at)) : null; };
  const out: Beat[] = beats.map((b) => {
    if (b.el === 'pill') return { ...b, props: { ...b.props, y: 1300 }, zone: { horizontal: { x: 20, y: -420, s: 1 } } };
    const f = firstAt(b);
    return f != null && b.el !== 'broll' && f - 0.5 > b.S ? { ...b, S: f - 0.5 } : b;
  });
  const scenes = out.filter((b) => b.el !== 'pill' && b.el !== 'broll').map((b) => [b.S, b.E] as [number, number]).sort((x, y) => x[0] - y[0]);
  const shots: Shot[] = [{ at: 0, layout: 'full' }];
  for (let i = 0; i < scenes.length; i++) {
    let [s0, e0] = scenes[i];
    while (i + 1 < scenes.length && scenes[i + 1][0] - e0 < 1.2) { e0 = Math.max(e0, scenes[i + 1][1]); i++; }
    shots.push({ at: Math.max(0.01, s0 - 0.2), layout: 'hidden' }, { at: e0 + 0.1, layout: 'full' });
  }
  shots.push(...screens);
  shots.sort((x, y) => x.at - y.at);
  const pills = out.filter((b) => b.el === 'pill').map((b) => [b.S, b.E] as [number, number]);
  return { beats: out, shots, hideCaptionsVertical: pills };
};

/** KitVideo with extra element families (e.g. makeKitVideo({ ...FX_ORBIT })). */
export const makeKitVideo = (extra: Record<string, ElementDef>): React.FC<VideoSpec> => (props) => <KitVideo {...props} extra={extra} />;
