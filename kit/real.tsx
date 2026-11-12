import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT, HAND, SHADOW } from './tokens';
import { appear, clamp, ease, lin, M, popIn } from './motion';
import { Ic, Logo } from './Icon';
import { BRANDS, FALLBACK_NAMES, OFFICIAL_FILES } from './brands';
import { GRAIN_URL, PAPER } from './paper';
import type { SfxCue } from './Stage';

// "Real world" elements: real brand logos, sales funnel, piggy bank, revenue chart, CRM board,
// lead-delivery automation and the standard CTAs. Every element works in both skins:
// skin 'kit' = white cards on dot grid, skin 'diorama' = paper cards with grain.

export type Skin = 'kit' | 'diorama';
type Base = { t: number; S: number; E: number; skin?: Skin; format?: 'vertical' | 'horizontal' };
const fill: React.CSSProperties = { position: 'absolute', inset: 0 };

export const surface = (skin: Skin = 'kit', tone: 'light' | 'navy' | 'orange' = 'light'): React.CSSProperties => {
  if (skin === 'diorama') {
    const bg = { light: PAPER.beige, navy: PAPER.navy, orange: PAPER.orange }[tone];
    return { background: `${GRAIN_URL}, ${bg}`, backgroundSize: '300px 300px, auto', backgroundBlendMode: 'multiply', borderRadius: 14, boxShadow: '0 4px 0 rgba(26,43,59,0.15), 0 18px 24px -6px rgba(26,43,59,0.30)' };
  }
  const bg = { light: '#fff', navy: C.navy, orange: C.orange }[tone];
  return { background: bg, borderRadius: 40, border: tone === 'light' ? `1px solid ${C.border}` : 'none', boxShadow: SHADOW };
};
const inkColor = (skin?: Skin) => (skin === 'diorama' ? PAPER.navy : C.ink);

// ── Brand logo tile ─────────────────────────────────────────────────────────
export const BrandLogo: React.FC<{ slug: string; size?: number; skin?: Skin; label?: boolean }> = ({ slug, size = 150, skin = 'kit', label }) => {
  const b = BRANDS[slug];
  const off = OFFICIAL_FILES[slug];
  const fb = FALLBACK_NAMES[slug];
  const name = b?.name ?? off?.name ?? fb?.name ?? slug;
  let mark: React.ReactNode;
  if (off) mark = <Img src={staticFile(off.file)} style={{ width: size * 0.82, height: size * 0.62, objectFit: 'contain' }} />;
  else if (b) {
    const gid = `g-${slug}`;
    mark = (
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
        {slug === 'instagram' && (
          <defs><linearGradient id={gid} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset="0.35" stopColor="#FA7E1E" /><stop offset="0.6" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs>
        )}
        <path d={b.path} fill={slug === 'instagram' ? `url(#${gid})` : b.hex === '#FFE01B' ? '#241C15' : b.hex} />
      </svg>
    );
  } else mark = <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.2, color: fb?.hex ?? C.ink, letterSpacing: -1 }}>{name}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ ...surface(skin), width: size, height: size, borderRadius: skin === 'diorama' ? 18 : size * 0.26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: slug === 'mailchimp' && skin === 'kit' ? '#FFE01B' : surface(skin).background }}>{mark}</div>
      {label && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.17, color: inkColor(skin), whiteSpace: 'nowrap' }}>{name}</div>}
    </div>
  );
};

// ── 1 · Logos grid ──────────────────────────────────────────────────────────
export type LogosProps = { title?: string; items: { slug: string; at: number }[]; cols?: number; y?: number; size?: number };
export const Logos: React.FC<Base & LogosProps> = ({ t, S, E, skin, format, title, items, cols: colsIn, y = 600, size = 190 }) => {
  const cols = colsIn ?? (format === 'horizontal' ? Math.min(6, items.length) : 3);
  const out = 1 - M.exit(t, E - 0.3);
  const gap = size * 0.35;
  return (
    <div style={{ ...fill, opacity: out }}>
      {title && <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 120, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: inkColor(skin) }}>{title}</div>}
      <div style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cols, items.length)}, ${size}px)`, gap }}>
          {items.map((it, i) => <div key={i} style={popIn(t, it.at, 0.3)}><BrandLogo slug={it.slug} size={size} skin={skin} label /></div>)}
        </div>
      </div>
    </div>
  );
};
const logosBox = (p: LogosProps, format?: string) => {
  const size = p.size ?? 190, cols = Math.min(p.cols ?? (format === 'horizontal' ? 6 : 3), p.items.length), rows = Math.ceil(p.items.length / cols), y = p.y ?? 600;
  const w = cols * size + (cols - 1) * size * 0.35;
  return { x0: 540 - w / 2, y0: y - (p.title ? 130 : 0), x1: 540 + w / 2, y1: y + rows * size * 1.3 + (rows - 1) * size * 0.35 };
};

// ── 2 · Sales funnel ────────────────────────────────────────────────────────
export type FunnelProps = { title?: string; stages: { label: string; value: string; at: number }[]; y?: number };
export const SalesFunnel: React.FC<Base & FunnelProps> = ({ t, S, E, skin, title, stages, y = 560 }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const n = stages.length;
  return (
    <div style={{ ...fill, opacity: out }}>
      {title && <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 110, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 60, letterSpacing: -2, color: inkColor(skin) }}>{title}</div>}
      {stages.map((st, i) => {
        const w = 940 - i * (520 / Math.max(1, n - 1));
        const last = i === n - 1;
        const p = ease.outBack(lin(t, st.at, 0.4));
        return (
          <div key={i} style={{ position: 'absolute', top: y + i * 150, left: 540 - w / 2, width: w, height: 128, opacity: clamp(p * 2, 0, 1), transform: `scaleX(${0.4 + 0.6 * p})` }}>
            <div style={{ ...surface(skin, last ? 'orange' : i % 2 ? 'light' : 'navy'), position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)', borderRadius: skin === 'diorama' ? 6 : 18 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 70px', fontFamily: FONT, fontWeight: 900, color: last || i % 2 === 0 ? '#fff' : inkColor(skin) }}>
              <span style={{ fontSize: 46, letterSpacing: -1.5 }}>{st.label}</span>
              <span style={{ fontSize: 52, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums' }}>{st.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
const funnelBox = (p: FunnelProps) => ({ x0: 70, y0: (p.y ?? 560) - (p.title ? 120 : 0), x1: 1010, y1: (p.y ?? 560) + p.stages.length * 150 });

// ── 3 · Piggy bank with coins ───────────────────────────────────────────────
export type PiggyProps = { label?: string; prefix?: string; from?: number; to: number; coins: number[]; y?: number };
const PiggySvg: React.FC<{ skin?: Skin; squash: number }> = ({ skin, squash }) => {
  const body = skin === 'diorama' ? PAPER.orange : '#FF8FA3';
  const dark = skin === 'diorama' ? PAPER.orangeDark : '#E26D83';
  return (
    <svg width={460} height={360} viewBox="0 0 230 180" style={{ overflow: 'visible', transform: `scale(${1 + squash * 0.06}, ${1 - squash * 0.06})`, transformOrigin: '50% 100%' }}>
      <g filter={skin === 'diorama' ? 'url(#ppb)' : undefined}>
        <rect x="58" y="135" width="22" height="34" rx="6" fill={dark} /><rect x="140" y="135" width="22" height="34" rx="6" fill={dark} />
        <ellipse cx="112" cy="100" rx="88" ry="66" fill={body} />
        <path d="M60 50 L72 20 L92 44 Z" fill={dark} />
        <ellipse cx="196" cy="104" rx="22" ry="20" fill={dark} />
        <circle cx="190" cy="100" r="4" fill="#1A2B3B" /><circle cx="202" cy="100" r="4" fill="#1A2B3B" />
        <circle cx="160" cy="80" r="6" fill="#1A2B3B" />
        <rect x="90" y="36" width="50" height="10" rx="5" fill="#1A2B3B" />
        <path d="M24 98 q-16 -6 -10 -22" stroke={dark} strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
export const Piggy: React.FC<Base & PiggyProps> = ({ t, S, E, skin, label, prefix = '$', from = 0, to, coins, y = 620 }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const landed = coins.filter((c) => t >= c + 0.45).length;
  const target = from + ((to - from) * landed) / coins.length;
  const prev = from + ((to - from) * Math.max(0, landed - 1)) / coins.length;
  const lastLand = landed ? coins[landed - 1] + 0.45 : S;
  const val = landed ? prev + (target - prev) * ease.outCubic(lin(t, lastLand, 0.35)) : from;
  const squash = coins.reduce((a, c) => a + (t >= c + 0.45 ? Math.exp(-(t - c - 0.45) * 14) : 0), 0);
  return (
    <div style={{ ...fill, opacity: out }}>
      <div style={{ ...appear(t, S, E + 1, 60, 0.85), position: 'absolute', top: y + 140, left: 310 }}><PiggySvg skin={skin} squash={squash} /></div>
      {coins.map((c, i) => {
        const p = ease.inCubic(lin(t, c, 0.45));
        const vis = t >= c && t < c + 0.5;
        return (
          <div key={i} style={{ position: 'absolute', left: 520, top: y - 120 + p * 290, opacity: vis ? 1 : 0, transform: `rotate(${p * 200}deg)` }}>
            <div style={{ width: 96, height: 96, borderRadius: 999, background: skin === 'diorama' ? PAPER.kraft : '#F5B700', border: `8px solid ${skin === 'diorama' ? PAPER.kraftDark : '#D99A00'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.navy }}>$</div>
          </div>
        );
      })}
      <div style={{ ...popIn(t, S + 0.2, 0.5), position: 'absolute', top: y - 40, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, letterSpacing: -5, color: skin === 'diorama' ? PAPER.navy : C.green, fontVariantNumeric: 'tabular-nums' }}>{prefix}{Math.round(val).toLocaleString('en-US')}</div>
      </div>
      {label && <div style={{ ...popIn(t, S + 0.35, 0.5), position: 'absolute', top: y + 560, left: 0, right: 0, textAlign: 'center', fontFamily: HAND, fontWeight: 700, fontSize: 90, color: C.orange }}>{label}</div>}
    </div>
  );
};
const piggyBox = (p: PiggyProps) => ({ x0: 250, y0: (p.y ?? 620) - 130, x1: 830, y1: (p.y ?? 620) + (p.label ? 660 : 520) });
const piggySfx = (p: PiggyProps): SfxCue[] => [...p.coins.map((c) => ({ name: 'click' as const, at: c + 0.45 })), { name: 'cha-ching', at: p.coins[p.coins.length - 1] + 0.4 }];

// ── 4 · Revenue chart ───────────────────────────────────────────────────────
export type RevenueProps = { title: string; bars: number[]; labels?: string[]; at: number; total: { prefix?: string; to: number; suffix?: string }; y?: number };
export const Revenue: React.FC<Base & RevenueProps> = ({ t, S, E, skin, title, bars, labels, at, total, y = 520 }) => {
  const max = Math.max(...bars);
  const grow = (i: number) => ease.outBack(lin(t, at + i * 0.12, 0.45));
  const cnt = ease.outCubic(lin(t, at, 0.4 + bars.length * 0.12));
  return (
    <div style={{ ...surface(skin), position: 'absolute', top: y, left: 90, width: 900, padding: '44px 50px', boxSizing: 'border-box', ...appear(t, S, E, 60, 0.9) }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 6, textTransform: 'uppercase', color: C.muted }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 6 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: -5, color: inkColor(skin), fontVariantNumeric: 'tabular-nums' }}>{total.prefix ?? '$'}{Math.round(total.to * cnt).toLocaleString('en-US')}{total.suffix ?? ''}</div>
        <div style={{ ...popIn(t, at + 0.6, 0.3), display: 'flex', alignItems: 'center', gap: 6, color: C.green, fontFamily: FONT, fontWeight: 900, fontSize: 40 }}><Ic n="zap" size={34} color={C.green} sw={2.6} />up</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, height: 360, marginTop: 30 }}>
        {bars.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: '100%', height: (v / max) * 320 * grow(i), borderRadius: skin === 'diorama' ? 6 : 16, background: i === bars.length - 1 ? C.orange : skin === 'diorama' ? PAPER.kraft : '#E8EDF3', boxShadow: skin === 'diorama' ? '0 4px 0 rgba(26,43,59,0.15)' : 'none' }} />
            {labels && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, color: C.muted }}>{labels[i]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
const revenueBox = (p: RevenueProps) => ({ x0: 90, y0: p.y ?? 520, x1: 990, y1: (p.y ?? 520) + 680 });
const revenueSfx = (p: RevenueProps): SfxCue[] => [{ name: 'whoosh', at: p.at - 0.1 }, { name: 'cha-ching', at: p.at + 0.4 + p.bars.length * 0.12 }];

// ── 5 · CRM board (lead card moves across columns) ─────────────────────────
export type CrmProps = { columns: string[]; lead: { name: string; sub: string }; moves: number[]; y?: number };
export const Crm: React.FC<Base & CrmProps> = ({ t, S, E, skin, columns, lead, moves, y = 560 }) => {
  const colW = 300, gap = 20, x0 = 540 - (columns.length * colW + (columns.length - 1) * gap) / 2;
  const stage = moves.filter((m) => t >= m).length;
  const prevX = x0 + Math.max(0, stage - 1) * (colW + gap);
  const curX = x0 + stage * (colW + gap);
  const mp = stage ? ease.inOutCubic(lin(t, moves[stage - 1], 0.4)) : 1;
  const cardX = stage ? prevX + (curX - prevX) * mp : x0;
  const won = stage === columns.length - 1;
  return (
    <div style={{ ...fill, ...appear(t, S, E, 40, 0.92) }}>
      {columns.map((c, i) => (
        <div key={i} style={{ ...surface(skin), position: 'absolute', top: y, left: x0 + i * (colW + gap), width: colW, height: 520, boxSizing: 'border-box', padding: 22, borderRadius: skin === 'diorama' ? 12 : 30, background: skin === 'diorama' ? surface(skin).background : '#F7F8FA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontWeight: 900, fontSize: 32, color: i === columns.length - 1 ? C.green : inkColor(skin) }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: i === columns.length - 1 ? C.green : i === 0 ? C.muted : C.orange }} />{c}
          </div>
          {[0, 1].map((k) => <div key={k} style={{ marginTop: 18 + (k ? 0 : 130), height: 90, borderRadius: 18, background: skin === 'diorama' ? 'rgba(26,43,59,0.06)' : '#ECEFF3' }} />)}
        </div>
      ))}
      <div style={{ position: 'absolute', top: y + 80, left: cardX + 12, width: colW - 24, transform: `rotate(${stage && mp < 1 ? Math.sin(mp * Math.PI) * 5 : 0}deg) scale(${stage && mp < 1 ? 1 + Math.sin(mp * Math.PI) * 0.06 : 1})` }}>
        <div style={{ ...surface(skin), borderRadius: skin === 'diorama' ? 10 : 22, padding: '18px 20px', border: `4px solid ${won ? C.green : C.orange}` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: inkColor(skin) }}>{lead.name}</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: C.muted }}>{lead.sub}</div>
          {won && <div style={{ ...popIn(t, moves[moves.length - 1] + 0.35, 0.3), marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenSoft, color: C.green, borderRadius: 999, padding: '4px 14px', fontFamily: FONT, fontWeight: 900, fontSize: 24 }}><Ic n="check" size={24} color={C.green} sw={3} />Won</div>}
        </div>
      </div>
    </div>
  );
};
const crmBox = (p: CrmProps) => { const w = p.columns.length * 300 + (p.columns.length - 1) * 20; return { x0: 540 - w / 2, y0: p.y ?? 560, x1: 540 + w / 2, y1: (p.y ?? 560) + 520 }; };
const crmSfx = (p: CrmProps): SfxCue[] => [...p.moves.map((m) => ({ name: 'whoosh' as const, at: m, gain: 0.7 })), { name: 'ding', at: p.moves[p.moves.length - 1] + 0.35 }];

// ── 6 · Automation flow (lead delivery) ─────────────────────────────────────
export type FlowNode = { slug?: string; icon?: string; label: string; at: number };
export type AutomationProps = { title?: string; nodes: FlowNode[]; pulseAt: number; y?: number };
export const Automation: React.FC<Base & AutomationProps> = (props) => (props.format === 'horizontal' ? <AutomationRow {...props} /> : <AutomationCol {...props} />);
const ROW_STEP = 470;
const AutomationRow: React.FC<Base & AutomationProps> = ({ t, S, E, skin, title, nodes, pulseAt, y = 560 }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const n = nodes.length;
  const cx = (i: number) => 540 + (i - (n - 1) / 2) * ROW_STEP;
  const pulse = lin(t, pulseAt, 1.2);
  return (
    <div style={{ ...fill, opacity: out, overflow: 'visible' }}>
      {title && <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 150, left: -1000, right: -1000, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: inkColor(skin) }}>{title}</div>}
      {nodes.slice(1).map((nd, i) => {
        const draw = ease.outCubic(lin(t, nd.at - 0.2, 0.3));
        return <div key={`c${i}`} style={{ position: 'absolute', top: y + 81, left: cx(i) + 95, width: (ROW_STEP - 190) * draw, height: 8, borderRadius: 4, background: skin === 'diorama' ? PAPER.navy : '#CBD5E1' }} />;
      })}
      {pulse > 0 && pulse < 1 && <div style={{ position: 'absolute', top: y + 65, left: cx(0) + pulse * (n - 1) * ROW_STEP - 20, width: 40, height: 40, borderRadius: 20, background: C.orange, boxShadow: '0 0 24px rgba(249,115,22,0.8)' }} />}
      {nodes.map((nd, i) => (
        <div key={i} style={{ position: 'absolute', top: y, left: cx(i) - 200, width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, ...popIn(t, nd.at, 0.4) }}>
          {nd.slug ? <BrandLogo slug={nd.slug} size={170} skin={skin} /> : <div style={{ ...surface(skin), width: 170, height: 170, borderRadius: skin === 'diorama' ? 18 : 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nd.icon === 'logo' ? <Logo size={110} /> : <Ic n={nd.icon ?? 'zap'} size={84} color={C.orange} sw={2.4} />}</div>}
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, letterSpacing: -1.5, color: inkColor(skin), whiteSpace: 'nowrap' }}>{nd.label}</div>
        </div>
      ))}
    </div>
  );
};
const AutomationCol: React.FC<Base & AutomationProps> = ({ t, S, E, skin, title, nodes, pulseAt, y = 560 }) => {
  const out = 1 - M.exit(t, E - 0.3);
  const step = 250;
  const pulse = lin(t, pulseAt, 1.2);
  return (
    <div style={{ ...fill, opacity: out }}>
      {title && <div style={{ ...popIn(t, S, 0.6), position: 'absolute', top: y - 120, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 60, letterSpacing: -2, color: inkColor(skin) }}>{title}</div>}
      {nodes.slice(1).map((n, i) => {
        const draw = ease.outCubic(lin(t, n.at - 0.2, 0.3));
        return <div key={`c${i}`} style={{ position: 'absolute', left: 536, top: y + i * step + 170, width: 8, height: (step - 180) * draw, borderRadius: 4, background: skin === 'diorama' ? PAPER.navy : '#CBD5E1' }} />;
      })}
      {pulse > 0 && pulse < 1 && (
        <div style={{ position: 'absolute', left: 520, top: y + 70 + pulse * (nodes.length - 1) * step, width: 40, height: 40, borderRadius: 20, background: C.orange, boxShadow: '0 0 24px rgba(249,115,22,0.8)' }} />
      )}
      {nodes.map((n, i) => (
        <div key={i} style={{ position: 'absolute', top: y + i * step, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...popIn(t, n.at, 0.4) }}>
          <div style={{ ...surface(skin), display: 'flex', alignItems: 'center', gap: 26, padding: '20px 40px 20px 22px', borderRadius: skin === 'diorama' ? 14 : 36 }}>
            {n.slug ? <BrandLogo slug={n.slug} size={130} skin={skin} /> : <div style={{ width: 130, height: 130, borderRadius: 30, background: C.orangeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.icon === 'logo' ? <Logo size={84} /> : <Ic n={n.icon ?? 'zap'} size={66} color={C.orange} sw={2.4} />}</div>}
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, letterSpacing: -1.8, color: inkColor(skin) }}>{n.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
const automationBox = (p: AutomationProps, format?: string) => format === 'horizontal'
  ? { x0: 540 - ((p.nodes.length - 1) / 2) * ROW_STEP - 200, y0: (p.y ?? 560) - (p.title ? 160 : 0), x1: 540 + ((p.nodes.length - 1) / 2) * ROW_STEP + 200, y1: (p.y ?? 560) + 260 }
  : ({ x0: 180, y0: (p.y ?? 560) - (p.title ? 130 : 0), x1: 900, y1: (p.y ?? 560) + (p.nodes.length - 1) * 250 + 175 });
const automationSfx = (p: AutomationProps): SfxCue[] => [...p.nodes.map((n) => ({ name: 'click' as const, at: n.at + 0.05 })), { name: 'whoosh', at: p.pulseAt }, { name: 'notification-ping', at: p.pulseAt + 1.15 }];

// ── 7 · Standard CTAs ───────────────────────────────────────────────────────
// comment = "Comment KEYWORD below", trial = "Try it free", build = "Build your funnel in 15 seconds"
export type CtaKind = 'comment' | 'trial' | 'build' | 'subscribe';
export type CtaStdProps = { kind: CtaKind; keyword?: string; lang?: 'en' | 'pt'; subAt: number; y?: number; eyebrow?: string; button?: string; sub?: string; format?: 'vertical' | 'horizontal' };
// Centred stack : small eyebrow, one big orange call-to-action BUTTON, then a navy "link in bio" chip.
// No giant word on the left with empty space on the right.
const CTA_TEXT = {
  en: { comment: ['Want the template?', 'Comment FUNNEL', 'I send it to you'], trial: ['7-day free trial', 'Start your free trial', 'Link in bio'], build: ['Build your funnel in 15 seconds', 'Try WiseFunnel', 'Link in bio'], subscribe: ['Next video', 'Subscribe', 'Turn on the bell'] },
  pt: { comment: ['Quer o template?', 'Comente FUNIL', 'Eu te mando'], trial: ['7 dias grátis', 'Comece seu teste grátis', 'Link na bio'], build: ['Crie seu funil em 15 segundos', 'Teste o WiseFunnel', 'Link na bio'], subscribe: ['Próximo vídeo', 'Inscreva-se', 'Ative o sininho'] },
};
const ArrowR = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const LinkIc = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>);
export const CtaStd: React.FC<Base & CtaStdProps> = ({ t, S, E, skin, kind, keyword, lang = 'en', subAt, y = 170, format, ...o }) => {
  let [eyebrow, button, sub] = CTA_TEXT[lang][kind];
  // YouTube has no bio: the link lives in the description
  if (format === 'horizontal' && /bio/i.test(sub)) sub = lang === 'pt' ? 'Link na descrição' : 'Link in the description';
  eyebrow = o.eyebrow ?? eyebrow; button = o.button ?? button; sub = o.sub ?? sub;
  if (kind === 'comment' && keyword) button = (lang === 'pt' ? 'Comente ' : 'Comment ') + keyword;
  const pulse = 1 + 0.025 * Math.max(0, Math.sin((t - S - 0.9) * 4.2)) * (t > S + 0.9 ? 1 : 0);   // gentle "press me" breathing
  const press = clamp((t - subAt + 0.25) / 0.12, 0, 1) * clamp((subAt + 0.05 - t) / 0.12 + 1, 0, 1); // tiny press as the chip lands
  return (
    <div style={{ position: 'absolute', left: 110, right: 110, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
      <div style={{ ...appear(t, S, E, -60, 0.6), fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: 5, textTransform: 'uppercase', color: inkColor(skin), textAlign: 'center' }}>{eyebrow}</div>
      <div style={{ ...popIn(t, S + 0.15, 0.45), transform: `${popIn(t, S + 0.15, 0.45).transform ?? ''} scale(${pulse - press * 0.04})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22,
        width: 860, padding: '40px 30px', borderRadius: skin === 'diorama' ? 16 : 999, background: C.orange, color: '#fff',
        boxShadow: '0 22px 50px rgba(249,115,22,0.38), inset 0 -6px 0 rgba(0,0,0,0.12)', fontFamily: FONT, fontWeight: 900, fontSize: button.length > 20 ? 62 : 70, letterSpacing: -1.5, whiteSpace: 'nowrap' }}>
        {button}<ArrowR size={64} color="#fff" />
      </div>
      <div style={{ ...popIn(t, subAt, 0.4), ...surface(skin, 'navy'), display: 'flex', alignItems: 'center', gap: 16, color: '#fff', borderRadius: skin === 'diorama' ? 12 : 999, padding: '18px 36px', fontFamily: FONT, fontWeight: 800, fontSize: 44 }}>
        {kind === 'comment' ? <Ic n="msg" size={42} color={C.orange} sw={2.6} /> : kind === 'subscribe' ? <Ic n="bell" size={42} color={C.orange} sw={2.6} /> : <LinkIc size={42} color={C.orange} />}{sub}
      </div>
    </div>
  );
};
const ctaStdBox = (p: CtaStdProps) => ({ x0: 110, y0: p.y ?? 170, x1: 970, y1: (p.y ?? 170) + 420 });
const ctaStdSfx = (p: CtaStdProps, S: number): SfxCue[] => [{ name: 'bong', at: S }, { name: 'click', at: p.subAt + 0.05 }];

export const REAL_ELEMENTS = {
  logos: { C: Logos, sfx: (p: LogosProps) => p.items.map((it) => ({ name: 'click' as const, at: it.at + 0.04 })), box: logosBox },
  funnel: { C: SalesFunnel, sfx: (p: FunnelProps) => [...p.stages.map((s) => ({ name: 'click' as const, at: s.at + 0.05 })), { name: 'ding' as const, at: p.stages[p.stages.length - 1].at + 0.35 }], box: funnelBox },
  piggy: { C: Piggy, sfx: piggySfx, box: piggyBox },
  revenue: { C: Revenue, sfx: revenueSfx, box: revenueBox },
  crm: { C: Crm, sfx: crmSfx, box: crmBox },
  automation: { C: Automation, sfx: automationSfx, box: automationBox },
  ctaStd: { C: CtaStd, sfx: ctaStdSfx, box: ctaStdBox },
};
