// Family 09 · demo: the house screen-demo style (modelled on product-homepage demo videos), for every brand.
// Real app screenshots (one per state, recorded by capture/flow.js) animated with ONE camera that eases into each action
// (zoom 1.2-1.6, clamped to the screen edges), a macOS cursor that glides on a curve (x sine, y power2), a click ripple in the
// brand accent with a cursor press, instant swaps for typing, short fades between states, and a result beat: zoom out,
// highlight + sheen on what changed, a label chip, then a strong zoom on it.
import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, Img, staticFile } from 'remotion';
import { C, FONT } from '../tokens';
import type { SfxCue } from '../Stage';

type Base = { t: number; S: number; E: number; format?: 'vertical' | 'horizontal' };
type Step = { shot: string | null; action: 'start' | 'click' | 'type' | 'select' | 'scroll' | 'result' | 'hold'; box: number[] | null; label?: string };
type Flow = { app: [number, number]; scale: number; steps: Step[]; title?: string };
export type ScreenDemoProps = { src: string; area?: [number, number, number, number]; speed?: number; zoom?: number; label?: boolean; radius?: number; fit?: 'contain' | 'cover' };

// ── easing (GSAP names) ──
const E = {
  p2io: (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  p3io: (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  sio: (k: number) => -(Math.cos(Math.PI * k) - 1) / 2,
  p2o: (k: number) => 1 - (1 - k) * (1 - k),
  expo: (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  back: (k: number) => { const c = 2, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// ── flow loading (public/<src>/flow.json, cached per render) ──
const cache: Record<string, Flow> = {};
const useFlow = (src: string) => {
  const [flow, setFlow] = useState<Flow | null>(cache[src] ?? null);
  const [handle] = useState(() => (cache[src] ? null : delayRender('flow ' + src)));
  useEffect(() => {
    if (cache[src]) return;
    fetch(staticFile(src + '/flow.json')).then(r => r.json()).then((f: Flow) => { cache[src] = f; setFlow(f); if (handle != null) continueRender(handle); });
  }, [src, handle]);
  return flow;
};

// ── timeline from a flow ──
type Cam = { at: number; dur: number; fx: number; fy: number; s: number; ease: keyof typeof E };
type Plan = { shots: { at: number; i: number; fade: number }[]; cam: Cam[]; cur: { at: number; dur: number; x: number; y: number }[]; clicks: number[]; result?: { at: number; box: number[]; label?: string }; total: number };
const center = (b: number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];

export const planFlow = (f: Flow, zoom = 1.5, viewW?: number): Plan => {   // viewW: app px visible at zoom 1
  const [aw, ah] = f.app; const P: Plan = { shots: [], cam: [], cur: [], clicks: [], total: 0 };
  let t = 0.35, cx = aw * 0.55, cy = ah * 0.55, focus = [aw / 2, ah / 2], s = 1, lastTypeBox = '';
  const camTo = (at: number, dur: number, fx: number, fy: number, sc: number, ease: Cam['ease'] = 'p3io') => { P.cam.push({ at, dur, fx, fy, s: sc, ease }); focus = [fx, fy]; s = sc; };
  const glide = (b: number[]) => {
    const [x, y] = center(b); const d = Math.hypot(x - cx, y - cy); const dur = cl(d / 900, 0.4, 0.95);
    if (Math.hypot(x - focus[0], y - focus[1]) > 140 || Math.abs(s - zoom) > 0.05) camTo(t, Math.max(0.8, dur + 0.15), x, y, zoom);
    P.cur.push({ at: t, dur, x, y }); cx = x; cy = y; t += dur + 0.08;
  };
  const click = () => { P.clicks.push(t); t += 0.13; };
  let shotIdx = -1;
  f.steps.forEach((st, k) => {
    if (st.shot) shotIdx = f.steps.slice(0, k + 1).filter(x => x.shot).length - 1;
    const show = (fade: number) => { if (st.shot) P.shots.push({ at: t, i: shotIdx, fade }); };
    if (st.action === 'start') { show(0); t += 0.5; return; }
    if (st.action === 'click' || st.action === 'select') { if (st.box) { glide(st.box); click(); } show(0.16); t += st.action === 'select' ? 0.35 : 0.5; lastTypeBox = ''; return; }
    if (st.action === 'type') {
      const key = (st.box || []).join(',');
      if (key !== lastTypeBox && st.box) { glide(st.box); click(); t += 0.1; lastTypeBox = key; }
      show(0); t += 0.17; return;
    }
    if (st.action === 'result') {
      camTo(t, 0.75, aw / 2, ah / 2, 1, 'p2io'); t += 0.55; show(0.3); t += 0.45;
      if (st.box) {
        const [x, y] = center(st.box); const vw = viewW ?? aw;
        const fitS = (vw * 0.92) / (st.box[2] + 40);   // the whole result must fit the view (wide rows on 9:16 pull the camera back)
        camTo(t, 1.1, x, y, fitS < 1.35 ? Math.max(0.6, fitS) : Math.min(fitS, 1.9), 'p3io');
        P.cur.push({ at: t, dur: 0.9, x: x + st.box[2] * 0.3, y: y + st.box[3] * 1.6 }); cx = x; cy = y;
        P.result = { at: t + 0.35, box: st.box, label: st.label };
      }
      t += 2.6; return;
    }
    show(0.25); t += 1.0;
  });
  P.total = t + 0.4;
  return P;
};

// value of a chain of moves at time t (each move eases from wherever the previous one left the value)
const camAt = (cam: Cam[], t: number, start: [number, number, number]) => {
  let cur = start;
  for (let i = 0; i < cam.length; i++) {
    const m = cam[i]; if (t < m.at) break;
    const nxAt = cam[i + 1] ? cam[i + 1].at : Infinity;
    const dur = Math.min(m.dur, Math.max(0.12, nxAt - m.at));
    const k = E[m.ease](cl((Math.min(t, nxAt) - m.at) / dur)); const from = cur;
    cur = [from[0] + (m.fx - from[0]) * k, from[1] + (m.fy - from[1]) * k, from[2] + (m.s - from[2]) * k];
  }
  return cur;
};
const curAt = (cur: Plan['cur'], t: number, start: [number, number]) => {
  let p = start;
  for (const m of cur) {
    if (t < m.at) break;
    const k = cl((t - m.at) / m.dur);
    p = [p[0] + (m.x - p[0]) * E.sio(k), p[1] + (m.y - p[1]) * E.p2o(k)];
    if (k < 1) break; p = [m.x, m.y];
  }
  return p;
};

const Cursor: React.FC<{ press: number }> = ({ press }) => (
  <svg viewBox="0 0 34 34" width={34} height={34} style={{ display: 'block', transformOrigin: '3px 3px', transform: `scale(${press})`, filter: 'drop-shadow(0 4px 6px rgba(22,48,58,.45))' }}>
    <path d="M3 3 L3 26 L9.2 20.4 L13.6 30.4 L18.4 28.3 L14 18.4 L22.4 18.2 Z" fill="#fff" stroke={C.navy} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

export const ScreenDemo: React.FC<Base & ScreenDemoProps> = ({ t, S, E: End, format, src, area, speed, zoom, label = true, radius = 28, fit }) => {
  const flow = useFlow(src);
  if (!flow) return null;
  const [ax, ay, AW, AH] = area ?? (format === 'vertical' ? [30, 250, 1020, 1200] : [120, 70, 1680, 1050]);
  const AW0 = AW, AH0 = AH;
  const cover = (fit ?? (format === 'vertical' ? 'cover' : 'contain')) === 'cover';   // 9:16: the app fills the area and the camera follows the action
  const kk = cover ? Math.max(AW0 / flow.app[0], AH0 / flow.app[1]) : Math.min(AW0 / flow.app[0], AH0 / flow.app[1]);
  const P = planFlow(flow, zoom ?? (cover ? 1.3 : 1.5), AW0 / kk);
  const [aw, ah] = flow.app;

  const room = End - S - 0.6;   // fit the flow into the beat: speed it up or slow it down (within 0.75-1.7x)
  const sp = speed ?? cl(P.total / Math.max(1, room), 0.75, 1.7);
  const lt = (t - S) * sp;
  const k = cover ? Math.max(AW / aw, AH / ah) : Math.min(AW / aw, AH / ah);   // app px -> frame px at zoom 1
  const [fx, fy, s] = camAt(P.cam, lt, [aw / 2, ah / 2, 1]);
  const sc = k * s;
  let tx = AW / 2 - fx * sc, ty = AH / 2 - fy * sc;
  tx = aw * sc > AW ? Math.min(0, Math.max(AW - aw * sc, tx)) : (AW - aw * sc) / 2;
  ty = ah * sc > AH ? Math.min(0, Math.max(AH - ah * sc, ty)) : (AH - ah * sc) / 2;
  const [px, py] = curAt(P.cur, lt, [aw * 0.55, ah * 0.55]);
  const lastClick = P.clicks.filter(c => c <= lt).pop();
  const press = lastClick != null && lt - lastClick < 0.21 ? (lt - lastClick < 0.07 ? 1 - 0.18 * E.p2o((lt - lastClick) / 0.07) : 0.82 + 0.18 * E.p2o((lt - lastClick - 0.07) / 0.14)) : 1;
  const enter = E.p3io(cl((t - S) / 0.45)), leave = 1 - E.p2io(cl((t - (End - 0.35)) / 0.35));
  const vis = P.shots.filter(x => x.at <= lt);
  const top = vis[vis.length - 1], under = vis[vis.length - 2];
  const shotUrl = (i: number) => staticFile(src + '/' + flow.steps.filter(x => x.shot)[i].shot);
  const R = P.result; const rk = R ? cl((lt - R.at) / 0.3) : 0;
  return (
    <div style={{ position: 'absolute', left: ax, top: ay, width: AW, height: AH, borderRadius: radius, overflow: 'hidden', background: C.navy,
      boxShadow: '0 40px 90px -30px rgba(15,23,42,.45)', opacity: enter * leave, transform: `translateY(${(1 - enter) * 40}px) scale(${0.97 + 0.03 * enter})` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: aw, height: ah, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})` }}>
        {[under, top].filter(Boolean).map((x, j) => (
          <Img key={x!.i} src={shotUrl(x!.i)} style={{ position: 'absolute', left: 0, top: 0, width: aw, height: ah, opacity: j === 1 && x!.fade > 0 ? cl((lt - x!.at) / x!.fade) : 1 }} />
        ))}
        {P.clicks.filter(c => c <= lt && lt - c < 0.5).map(c => {
          const q = E.p2o(cl((lt - c) / 0.5)); const [rx, ry] = curAt(P.cur, c, [aw * 0.55, ah * 0.55]);
          return <div key={c} style={{ position: 'absolute', left: rx - 26, top: ry - 26, width: 52, height: 52, borderRadius: '50%', border: `3px solid ${C.orange}`,
            background: 'rgba(249,115,22,0.28)', opacity: 0.9 * (1 - q), transform: `scale(${0.2 + 1.15 * q})` }} />;
        })}
        {R && lt >= R.at && (<>
          <div style={{ position: 'absolute', left: R.box[0] - 4, top: R.box[1] - 4, width: R.box[2] + 8, height: R.box[3] + 8, borderRadius: 12,
            border: `3px solid ${C.orange}`, background: 'rgba(249,115,22,0.10)', boxShadow: '0 0 0 6px rgba(249,115,22,0.28), 0 10px 40px rgba(249,115,22,0.45)',
            opacity: E.back(rk) > 0 ? cl(rk * 1.4) : 0, transform: `scale(${0.96 + 0.04 * E.back(rk)})` }} />
          <div style={{ position: 'absolute', left: R.box[0] - 4, top: R.box[1] - 4, width: R.box[2] + 8, height: R.box[3] + 8, borderRadius: 12, overflow: 'hidden', opacity: lt < R.at + 1 ? 1 : 0 }}>
            <i style={{ position: 'absolute', top: 0, height: '100%', width: '26%', left: `${-30 + 160 * E.p2io(cl((lt - R.at - 0.05) / 0.9))}%`,
              background: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0))', transform: 'skewX(-18deg)' }} />
          </div>
        </>)}
        <div style={{ position: 'absolute', left: px, top: py, opacity: cl((lt - 0.2) / 0.4) * (R && lt > R.at + 1.2 ? 1 - cl((lt - R.at - 1.2) / 0.4) : 1) }}><Cursor press={press} /></div>
      </div>
      {label && R?.label && lt >= R.at + 0.25 && (() => { const q = E.back(cl((lt - R.at - 0.25) / 0.35)); return (
        <div style={{ position: 'absolute', left: '50%', ...(((R.box[1] + R.box[3] / 2) * sc + ty) > AH * 0.55 ? { top: format === 'vertical' ? 28 : 36 } : { bottom: format === 'vertical' ? 28 : 40 }), transform: `translateX(-50%) translateY(${(1 - q) * 30}px) scale(${0.9 + 0.1 * q})`, opacity: cl(q),
          background: C.navy, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: format === 'vertical' ? 40 : 46, padding: '16px 34px', borderRadius: 999,
          boxShadow: '0 18px 40px -12px rgba(15,23,42,.6)', whiteSpace: 'nowrap', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: C.orange }} />{R.label}
        </div>); })()}
    </div>
  );
};

const screenDemoSfx = (_p: ScreenDemoProps, S: number): SfxCue[] => [{ name: 'whoosh', at: S }];
export const FX_DEMO = {
  screenDemo: { C: ScreenDemo, sfx: screenDemoSfx, frame: true },
};
