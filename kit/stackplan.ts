// STACK plan helpers: the fixed house style for every vertical video (see projects/motion-kit/STACK-WORKFLOW.md).
//   const P = makeStack(words);  const { a, B, H } = P;  ... P.finish(SPEC)
// finish() enforces the house rules: stack + solo scenes, and a PROOF on screen (the real page / result / delivery) for at least 15% of the video.
import type { Beat, VideoSpec } from './Video';
import type { Shot, SfxCue, Word } from './Stage';
import { STACK } from './stack';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const PROOF_EL = ['winShot', 'screenDemo', 'smoothScroll', 'broll', 'answer'];   // elements that show the real thing
const isProof = (b: Beat) => PROOF_EL.includes(b.el) || (b.el === 'fork' && !!(b.props as any)?.left?.src);

export const makeStack = (words: Word[]) => {
  const W = words.map((w) => norm(w.word));
  /** start time of the n-th occurrence of a phrase in the transcript */
  const a = (phrase: string, n = 0): number => {
    const p = phrase.split(' ').map(norm); let c = 0;
    for (let i = 0; i + p.length <= W.length; i++) if (p.every((x, k) => W[i + k] === x)) { if (c === n) return words[i].start; c++; }
    throw new Error('phrase not found: ' + phrase + ' #' + n);
  };
  const B = (el: string, S: number, E: number, props: Record<string, unknown>, sfx: SfxCue[] = [], zone?: Beat['zone']): Beat => ({ el, S, E, props, sfx, ...(zone ? { zone } : {}) });
  /** zone A headline: small line + hero line; the hero pops on the spoken word */
  const H = (S: number, E: number, small: string, hero: string, style: 'box' | 'underline' | 'plain', heroAt: number): Beat =>
    B('headline', S, E, { small, hero, style, smallAt: S, heroAt }, [{ name: 'pop-1', at: heroAt - 0.05 }]);
  const stack = (at: number): Shot => ({ at, layout: 'stack', whoosh: false });
  const solo = (at: number): Shot => ({ at, layout: 'full', whoosh: false });
  /** shots + the whoosh-soft cues at every scene change */
  const scenes = (list: Shot[]) => ({ shots: list, whooshes: list.slice(1).map((s) => ({ name: 'whoosh-soft' as const, at: s.at - 0.05 })) });
  const finish = (spec: VideoSpec, whooshes: SfxCue[] = []): VideoSpec => {
    const proof = spec.beats.filter(isProof);
    const secs = proof.reduce((n, b) => n + (b.E - b.S), 0);
    if (!spec.shots.some((s) => s.layout === 'stack')) throw new Error('STACK rule: use layout stack scenes');
    if (!proof.length || secs < spec.duration * 0.15 || !proof.some((b) => b.E - b.S >= 3)) throw new Error(`STACK rule: show the real result/page/delivery on screen (winShot / screenDemo / smoothScroll / broll). Now ${secs.toFixed(1)}s of ${spec.duration}s`);
    const beats = spec.beats.map((b, i) => (i === 0 ? { ...b, sfx: [...(b.sfx ?? []), ...whooshes] } : b));
    return { ...spec, captions: 'stack', beats };
  };
  return { a, B, H, stack, solo, scenes, finish, STACK };
};
