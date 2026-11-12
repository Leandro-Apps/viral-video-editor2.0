import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

// Brand fonts shipped with the Claude Design pack (latin subsets), loaded locally so a
// render never depends on the network. Registration is deferred to a microtask, the same
// pattern remotion-composer/src/lib/localFonts.ts uses to avoid delay-render handle loss.
const FACES: Array<[string, string, string]> = [
  ['WFInter', 'fonts/Inter-latin.woff2', '100 900'],
  ['WFCaveat', 'fonts/Caveat-400-latin.woff2', '400'],
  ['WFCaveat', 'fonts/Caveat-700-latin.woff2', '700'],
];

let started = false;
export const loadKitFonts = () => {
  if (started || typeof FontFace === 'undefined') return;
  started = true;
  queueMicrotask(() => {
    for (const [family, file, weight] of FACES) {
      const handle = delayRender(`font ${family} ${weight}`);
      const face = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { weight });
      face
        .load()
        .then(() => {
          document.fonts.add(face);
          continueRender(handle);
        })
        .catch((err) => cancelRender(new Error(`font ${file} failed: ${err}`)));
    }
  });
};
