// Reel #6 · SkillitHub: turn ANY YouTube video into a Claude skill · STACK house style · theme 'white' · live caption small
// KEYWORD HIERARCHY:
//   S hero (zone A)   : SkillitHub · Chrome extension · a Claude skill · transcript · skill file · Claude folder · one small detail · from the transcript · SKILL
//   A stage (zone B)  : site home (winShot) · extension button on YouTube (winShot+ring) · fork YouTube video -> transcript + skill (real screens) ·
//                       site transcript / skill (winShot) · install (terminal) · the question (promptBox) · Claude's REAL answer (answer) · comment (promptBox)
//   SOLO              : hook · "Any video you learn from becomes a skill."
// PROOF: yt-button.png, site-*.jpg = real extension and skillithub.com run on "The Offer Is King"; answer = real `claude -p` output with the generated skill.
import { WORDS as words } from './words';
import type { VideoSpec } from './kit/Video';
import { makeStack } from './kit/stackplan';
import { setStackTheme } from './kit/stack';

setStackTheme('white');
const { a, B, H, stack, solo, scenes, finish } = makeStack(words);
const D = 24.3;
const SKILL = 'the-offer-is-king-alex-hormozi';
const Q = 'Which 3 offers does he call the greatest?';
const ANSWER = ["Domino's: delivered in 30 minutes or it's free", '10 CDs for a penny (Sony continuity offer)', 'FedEx: guaranteed delivery by tomorrow morning'];
const SITE = 'skillithub.com';

const BEATS = [
  // SOLO 0-3.45 "I pasted one YouTube link, and Claude turned it into a skill."
  // 3.45-4.4 "It's SkillitHub," · the site with its promise on screen
  H(a('Its') - 0.05, a('Chrome') - 0.1, "It's", 'SkillitHub', 'box', a('SkillitHub') - 0.05),
  B('winShot', a('Its') - 0.05, a('Chrome') - 0.1, { src: 'shots/site-home.jpg', w: 1288, h: 747, title: SITE, zoomTo: 1.12 }, [{ name: 'whoosh-soft', at: a('Its') - 0.12 }, { name: 'pop-2', at: a('SkillitHub') }]),
  // 4.4-5.85 "a Chrome extension and web app" · the real button under the YouTube video
  H(a('Chrome') - 0.1, a('that') - 0.05, 'a', 'Chrome extension', 'box', a('Chrome') - 0.05),
  B('winShot', a('Chrome') - 0.1, a('that') - 0.05, { src: 'shots/yt-button.png', w: 2880, h: 1800, title: 'youtube.com/watch', zoomTo: 1.55, focus: [0.6035, 0.777], ring: true, ringAt: a('extension') }, [{ name: 'pop-1', at: a('extension') }]),
  // 5.85-9.0 "that turns any YouTube video into a Claude skill" · the main promise, with the real transcript and the real skill
  H(a('that') - 0.05, a('pulls') - 0.12, 'turns any YouTube video into', 'a Claude skill', 'underline', a('Claude', 1) - 0.1),
  B('fork', a('that') - 0.05, a('pulls') - 0.12, { at: a('that'), top: { text: 'youtube.com/watch?v=pxVeOkOVr2w' }, left: { label: 'transcript', src: 'shots/site-transcript.jpg' }, right: { label: 'Claude skill', src: 'shots/site-skill.jpg' }, leftAt: a('turns') + 0.2, rightAt: a('Claude', 1) - 0.1 },
    [{ name: 'whoosh-soft', at: a('that') - 0.1 }, { name: 'pop-2', at: a('turns') + 0.2 }, { name: 'pop-3', at: a('Claude', 1) - 0.1 }]),
  // 9.0-10.5 "It pulls the transcript"
  H(a('pulls') - 0.12, a('writes') - 0.05, 'It pulls the', 'transcript', 'box', a('transcript') - 0.1),
  B('winShot', a('pulls') - 0.12, a('writes') - 0.05, { src: 'shots/site-transcript.jpg', w: 1288, h: 747, title: SITE, zoomTo: 1.12 }, [{ name: 'ui-click', at: a('pulls') }]),
  // 10.5-12.0 "writes the skill file"
  H(a('writes') - 0.05, a('installs') - 0.1, 'writes the', 'skill file', 'underline', a('skill', 2) - 0.1),
  B('winShot', a('writes') - 0.05, a('installs') - 0.1, { src: 'shots/site-skill.jpg', w: 1288, h: 747, title: SITE, zoomTo: 1.12 }, [{ name: 'pop-2', at: a('skill', 2) - 0.1 }]),
  // 12-14 "installs it in your Claude folder"
  H(a('installs') - 0.1, a('ask') - 0.1, 'installs it in your', 'Claude folder', 'box', a('folder') - 0.25),
  B('terminal', a('installs') - 0.1, a('ask') - 0.1, { title: '~/.claude/skills', lines: [{ text: 'ls ~/.claude/skills', at: a('installs') }, { text: SKILL + '/', at: a('folder') - 0.1, tone: 'out' }, { text: 'skill installed', at: a('folder') + 0.3, tone: 'ok' }], y: 540, h: 400 },
    [{ name: 'ui-click', at: a('folder') + 0.3 }, { name: 'ui-ping', at: a('folder') + 0.35 }]),
  // 14-15.8 "I ask about one small detail"
  H(a('ask') - 0.1, a('Claude', 3) - 0.1, 'I ask about', 'one small detail', 'underline', a('small') - 0.1),
  B('promptBox', a('ask') - 0.1, a('Claude', 3) - 0.1, { label: 'CLAUDE CODE', text: Q, at: a('ask') + 0.05, cps: 26, sendAt: a('Claude', 3) - 0.25, y: 640 }, [{ name: 'ui-click', at: a('Claude', 3) - 0.25 }]),
  // 15.8-19.6 "Claude answers straight from the transcript. No rewatching. No notes." · the REAL answer
  H(a('Claude', 3) - 0.1, a('Any', 1) - 0.05, 'Claude answers', 'from the transcript', 'box', a('straight') - 0.1),
  B('answer', a('Claude', 3) - 0.1, a('Any', 1) - 0.05, { skill: SKILL, question: Q, bullets: ANSWER, at: a('Claude', 3) + 0.2, cps: 55, y: 520 }, [{ name: 'ui-ping', at: a('Claude', 3) + 0.2 }]),
  // SOLO 19.6-21.7 "Any video you learn from becomes a skill."
  // CTA 21.7-24.3 "Comment SKILL, and I'll D-M you the link."
  H(a('Comment') - 0.05, D, 'Comment', 'SKILL', 'box', a('skill', 4) - 0.1),
  B('promptBox', a('Comment') - 0.05, D, { label: 'INSTAGRAM · COMMENT', text: 'SKILL', at: a('skill', 4) - 0.3, cps: 22, sendAt: a('skill', 4) + 0.2, after: { text: 'DM sent: the link', at: a('DM') }, y: 600 },
    [{ name: 'ui-click', at: a('skill', 4) + 0.2 }, { name: 'dm', at: a('DM') - 0.1 }]),
];

const SC = scenes([solo(0), stack(a('Its') - 0.04), solo(a('Any', 1) - 0.05), stack(a('Comment') - 0.1)]);

export const SPEC: VideoSpec = finish({
  duration: D,
  presenter: { src: 'presenter.mp4', face: { x: 0.53, y: 0.37 }, cutout: 'presenter-cutout.webm' },
  music: { src: 'music/hard.mp3', volume: 0.07 },
  words, captions: 'stack', stackLive: 'small',
  keywords: ['skill', 'YouTube', 'Claude', 'transcript', 'SkillitHub', 'extension', 'Claude', 'answers', 'rewatching', 'notes', 'link'],
  shots: SC.shots, beats: BEATS, drift: 'auto', extraPunches: [a('Claude'), a('skill'), a('Claude', 3)],
}, SC.whooshes);
