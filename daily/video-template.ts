// __PROJECT__ · STACK house style (kit/stack.ts, projects/motion-kit/STACK-WORKFLOW.md). Fill the scene table, then the beats.
// 1) KEYWORD HIERARCHY (do this first, from words.ts):  S = hero (zone A)  ·  A = stage object (zone B)  ·  B = orange live-caption words  ·  SOLO = the 1-3 statements you say alone
// 2) ANIMATION per A keyword (vary vs the last video): winShot | stat | plug | rivals | brandKit | toolGrid | fork | promptBox | fx/*
// 3) PROOF: show the real page / product in use / delivered result (winShot, screenDemo, smoothScroll, broll). finish() enforces it.
import { WORDS as words } from './words';
import type { VideoSpec } from './kit/Video';
import { makeStack } from './kit/stackplan';
import { setStackTheme } from './kit/stack';

setStackTheme('cream');                       // colours only: 'cream' | 'white' | 'night' | 'mint' | 'sky' | { ... }
const { a, B, H, stack, solo, scenes, finish, STACK } = makeStack(words);
const D = __DURATION__;
const CY = STACK.stage.cy - 10;

const BEATS = [
  // SOLO  0-?  hook, you alone:  nothing here
  // H(a('phrase'), a('next') - 0.05, 'small line', 'hero', 'box', a('hero word') - 0.05),
  // B('winShot', a('phrase'), a('next') - 0.05, { src: 'shots/result.png', w: 1440, h: 900, title: 'example.com', scroll: false }, [{ name: 'whoosh-soft', at: a('phrase') - 0.1 }]),
];
const SC = scenes([solo(0) /* , stack(a('phrase') - 0.04), solo(...) */]);

export const SPEC: VideoSpec = finish({
  duration: D,
  presenter: { src: 'presenter.mp4', face: { x: 0.53, y: 0.37 }, cutout: 'presenter-cutout.webm' },
  music: { src: 'music/hard.mp3', volume: 0.07 },
  words, captions: 'stack', stackLive: 'off',
  keywords: [],
  shots: SC.shots, beats: BEATS, drift: 'auto', extraPunches: [],
}, SC.whooshes);
