// Reel #4 · WiseFunnel MCP · v4 · STACK layout (kit/stack.ts): A headline caption / B animation stage / C live caption / D presenter card,
// plus SOLO scenes (you full screen) for the important statements. The old WiseFunnel-style openers (bigTypeStack/orbit/counter) are gone.
//
// SCRIPT -> SCENES (the keyword hierarchy that drives every choice below):
//   S  hero words (headline zone A, serif box/underline) : funnel + ad drafts · WiseFunnel MCP · competitors · the brand · live · Google + Meta ads · the live funnel · drafts · Claude · FUNNEL
//   A  stage objects (zone B animation)                   : 26 (stat) · plugged into Claude (plug) · competitors (rivals scan) · brand (brand kit) · live link (window) · headlines/keywords/audience/budget (tiles)
//   B  live caption words (orange in zone C)              : see KEYWORDS
//   SOLO (you alone, full screen)                         : hook · "the part I love" · "Nothing spends until I approve it"
import { WORDS as words } from './words';
import type { Beat, VideoSpec } from './kit/Video';
import type { Shot } from './kit/Stage';
import type { SfxCue } from './kit/Stage';
import { STACK } from './kit/stack';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const W = words.map((w) => norm(w.word));
const a = (phrase: string, n = 0): number => {
  const p = phrase.split(' ').map(norm); let c = 0;
  for (let i = 0; i + p.length <= W.length; i++) if (p.every((x, k) => W[i + k] === x)) { if (c === n) return words[i].start; c++; }
  throw new Error('phrase not found: ' + phrase + ' #' + n);
};
const D = 37.3;
const B = (el: string, S: number, E: number, props: Record<string, unknown>, sfx: SfxCue[] = [], zone?: Beat['zone']): Beat => ({ el, S, E, props, sfx, ...(zone ? { zone } : {}) });
// zone A headline (pop on the hero word) and zone B stage object
const H = (S: number, E: number, small: string, hero: string, style: 'box' | 'underline' | 'plain', heroAt: number): Beat =>
  B('headline', S, E, { small, hero, style, smallAt: S, heroAt }, [{ name: 'pop-1', at: heroAt - 0.05 }]);
const CY = STACK.stage.cy - 10;
const FUNNEL_URL = 'roof-replacement-repair-quiz.wiseform.io';

const BEATS: Beat[] = [
  // SOLO 0-2.7 "I asked Claude for a roofing lead funnel."  (you alone: nothing else on screen)
  // S1 2.74-6.04 "It built the funnel and the ad drafts for Google and Meta."
  H(a('It built'), a('This is') - 0.02, 'It built the', 'funnel + ad drafts', 'box', a('funnel', 1) - 0.05),
  B('fork', a('It built'), a('This is') - 0.02, { at: a('It built') + 0.1, top: { text: 'Build me a roofing lead funnel' }, left: { label: 'the funnel', src: 'shots/funnel-hero.png' }, right: { label: 'ad drafts', slug: 'googleads,meta', tag: 'DRAFT' }, leftAt: a('funnel', 1) - 0.05, rightAt: a('ad') - 0.05 },
    [{ name: 'pop-2', at: a('funnel', 1) - 0.05 }, { name: 'pop-3', at: a('ad') - 0.05 }]),
  // S2 6.3-11.8 "This is the WiseFunnel MCP, 26 tools plugged straight into Claude."
  H(a('This is'), a('First') - 0.05, 'This is the', 'WiseFunnel MCP', 'underline', a('WiseFunnel') - 0.05),
  B('stat', a('This is'), a('plugged') - 0.05, { to: 26, label: 'tools', at: a('26') - 0.7, dur: 0.9 }, [{ name: 'ui-ping', at: a('26') + 0.15 }]),
  B('plug', a('plugged') - 0.1, a('First') - 0.05, { at: a('into') + 0.22, y: CY },
    [{ name: 'whoosh-soft', at: a('plugged') - 0.2 }, { name: 'pop-3', at: a('into') + 0.2 }, { name: 'ui-ping', at: a('into') + 0.24 }]),
  // S3 11.8-15.2 "First, it researches competitors and pulls the brand."
  H(a('First'), a('pulls') - 0.05, 'First, it researches', 'competitors', 'box', a('competitors') - 0.05),
  B('rivals', a('First'), a('pulls') - 0.05, { at: a('competitors') - 0.1, gap: 0.4, y: CY },
    [{ name: 'pop-1', at: a('competitors') - 0.15 }, { name: 'pop-2', at: a('competitors') + 0.25 }, { name: 'pop-3', at: a('competitors') + 0.65 }]),
  H(a('pulls') - 0.05, a('Then') - 0.1, 'and it pulls', 'the brand', 'box', a('pulls')),
  B('brandKit', a('pulls') - 0.05, a('Then') - 0.1, { at: a('pulls'), y: CY }, [{ name: 'pop-1', at: a('pulls') }, { name: 'pop-2', at: a('pulls') + 0.3 }, { name: 'pop-3', at: a('pulls') + 0.42 }, { name: 'pop-4', at: a('pulls') + 0.54 }]),
  // S4 15.3-19.7 "Then it builds the quiz and publishes it live on a real link."
  H(a('Then'), a('Next') - 0.06, 'Then it builds the quiz,', 'published live', 'box', a('live') - 0.1),
  B('winShot', a('Then'), a('Next') - 0.06, { src: 'shots/funnel-full.png', w: 1440, h: 3764, title: FUNNEL_URL, scroll: true }, [{ name: 'whoosh-soft', at: a('Then') - 0.1 }]),
  // S5 19.8-24.7 "Next, it writes the Google and Meta ads: headlines, keywords, audience, budget."
  H(a('Next'), a('And heres') - 0.05, 'Next, it writes the', 'Google + Meta ads', 'underline', a('Google', 1) - 0.05),
  B('toolGrid', a('Next'), a('And heres') - 0.05, { items: [{ label: 'Headlines', icon: 'form', at: a('headlines') - 0.05 }, { label: 'Keywords', icon: 'filter', at: a('keywords') - 0.05 }, { label: 'Audience', icon: 'user', at: a('audience') - 0.05 }, { label: 'Budget', icon: 'dollar', at: a('budget') - 0.05 }], cols: 2, y: 530 },
    [{ name: 'pop-1', at: a('headlines') - 0.1 }, { name: 'pop-2', at: a('keywords') - 0.1 }, { name: 'pop-3', at: a('audience') - 0.1 }, { name: 'pop-4', at: a('budget') - 0.1 }]),
  // SOLO 24.7-26.05 "And here's the part I love."
  // S6 26.05-30.1 "Both campaigns already point at that live funnel, saved as drafts."
  H(a('Both') - 0.05, a('saved') - 0.05, 'Both campaigns point at', 'the live funnel', 'underline', a('live', 1) - 0.1),
  B('fork', a('Both') - 0.05, a('Nothing') - 0.1, { at: a('campaigns'), dir: 'in', top: { text: FUNNEL_URL }, left: { label: 'Google Ads', slug: 'googleads', tag: 'DRAFT' }, right: { label: 'Meta Ads', slug: 'meta', tag: 'DRAFT' }, leftAt: a('campaigns'), rightAt: a('campaigns') + 0.2 },
    [{ name: 'pop-2', at: a('campaigns') }, { name: 'pop-3', at: a('campaigns') + 0.2 }]),
  H(a('saved') - 0.05, a('Nothing') - 0.1, 'saved as', 'drafts', 'box', a('drafts', 1) - 0.05),
  // SOLO 30.15-32.1 "Nothing spends until I approve it."  (+ green pill)
  B('pill', a('Nothing'), a('Connect') - 0.15, { text: 'Nothing spends until I approve', icon: 'shield', tone: 'green', y: 230, heavy: false }, [{ name: 'pop-2', at: a('Nothing') }], { vertical: { x: 270, y: 115, s: 0.5 } }),
  // S7 32.1-34.2 "Connect it in Claude and sign in."
  H(a('Connect') - 0.1, a('Comment') - 0.1, 'Connect it in', 'Claude', 'underline', a('Claude', 2) - 0.1),
  B('promptBox', a('Connect') - 0.1, a('Comment') - 0.1, { label: 'CLAUDE · CONNECTORS', text: 'Add WiseFunnel', at: a('Connect') + 0.05, cps: 14, sendAt: a('sign') - 0.05, after: { text: 'Signed in', at: a('sign') + 0.3 }, y: 600 },
    [{ name: 'ui-click', at: a('sign') - 0.05 }, { name: 'pop-3', at: a('sign') + 0.3 }]),
  // S8 CTA 34.3-37.3 "Comment FUNNEL, and I'll D-M you the link."
  H(a('Comment') - 0.05, D, 'Comment', 'FUNNEL', 'box', a('funnel', 3) - 0.1),
  B('promptBox', a('Comment') - 0.05, D, { label: 'INSTAGRAM · COMMENT', text: 'FUNNEL', at: a('funnel', 3) - 0.3, cps: 22, sendAt: a('funnel', 3) + 0.4, after: { text: 'DM sent: the link', at: a('DM') }, y: 600 },
    [{ name: 'ui-click', at: a('funnel', 3) + 0.4 }, { name: 'dm', at: a('DM') - 0.1 }]),
];

// SOLO = layout `full` (you alone, live caption in white on your chest); STACK = zones A/B/C + card
const wh = (at: number, layout: Shot['layout']): Shot => ({ at, layout, whoosh: false });
const SHOTS: Shot[] = [
  wh(0, 'full'),
  wh(a('It built') - 0.04, 'stack'),
  wh(a('And heres') - 0.05, 'full'),
  wh(a('Both') - 0.08, 'stack'),
  wh(a('Nothing') - 0.05, 'full'),
  wh(a('Connect') - 0.12, 'stack'),
];
const TRANSITIONS: SfxCue[] = SHOTS.slice(1).map((s) => ({ name: 'whoosh-soft' as const, at: s.at - 0.05 }));

export const SPEC: VideoSpec = {
  duration: D,
  presenter: { src: 'presenter.mp4', face: { x: 0.53, y: 0.37 }, cutout: 'presenter-cutout.webm' },
  music: { src: 'music/hard.mp3', volume: 0.07 },
  words,
  captions: 'stack',
  stackLive: 'off',
  keywords: ['funnel', 'WiseFunnel', 'Claude', 'MCP', '26', 'tools', 'Google', 'Meta', 'drafts', 'ads', 'link', 'live', 'approve', 'competitors', 'brand', 'Nothing'],
  shots: SHOTS,
  beats: BEATS.map((b, i) => (i === 0 ? { ...b, sfx: [...(b.sfx ?? []), ...TRANSITIONS, { name: 'hook-hit' as const, at: a('funnel') - 1.85 }] } : b)),
  drift: 'auto',
  extraPunches: [a('Claude'), a('26'), a('And heres')],
};
