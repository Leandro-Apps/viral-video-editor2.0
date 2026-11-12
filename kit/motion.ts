// Motion grammar: everything is a pure function of time in seconds.
// Rule: elements ENTER fast with a pop (0.4–0.5s, easeOutBack), HOLD, and EXIT fast (0.3s).
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lin = (t: number, s: number, d: number) => clamp((t - s) / d, 0, 1);

export const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inCubic: (x: number) => x * x * x,
  inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
};

export const M = {
  enter: (t: number, s: number, d = 0.45) => ease.outCubic(lin(t, s, d)),
  pop: (t: number, s: number, d = 0.45) => ease.outBack(lin(t, s, d)),
  exit: (t: number, s: number, d = 0.3) => ease.inCubic(lin(t, s, d)),
};

/** Pop in at `at`, fly out before `end`. dy = travel in px (negative = from above). */
export const appear = (t: number, at: number, end: number, dy = 50, sc = 0.85): React.CSSProperties => {
  const p = M.pop(t, at);
  const e = M.exit(t, end - 0.3);
  return {
    opacity: clamp(p * 2, 0, 1) * (1 - e),
    transform: `translateY(${(1 - p) * dy - e * 30}px) scale(${(sc + (1 - sc) * p) * (1 - 0.06 * e)})`,
  };
};

export const popIn = (t: number, at: number, from = 0.4): React.CSSProperties => {
  const p = M.pop(t, at, 0.4);
  return { opacity: clamp(p * 2, 0, 1), transform: `scale(${from + (1 - from) * p})` };
};

/** Decaying kick, used for punch-ins and shakes on heavy hits. */
export const kick = (t: number, hits: number[], amount = 0.07, decay = 10) =>
  hits.reduce((a, h) => a + (t >= h ? Math.exp(-(t - h) * decay) * amount : 0), 0);

export const shake = (t: number, at: number, px = 14) => {
  if (t < at || t > at + 0.25) return 0;
  return Math.sin((t - at) * 90) * px * (1 - (t - at) / 0.25);
};
