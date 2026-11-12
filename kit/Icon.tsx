import React from 'react';
import { Img, staticFile } from 'remotion';
import { C } from './tokens';

// Lucide-style line icons (same set as the Claude Design pack, plus a few).
type Shape = ['path', string] | ['circle', number, number, number] | ['rect', number, number, number, number, number];
const P: Record<string, Shape[]> = {
  check: [['path', 'M20 6 9 17l-5-5']],
  x: [['path', 'M18 6 6 18'], ['path', 'm6 6 12 12']],
  zap: [['path', 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']],
  shield: [['path', 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'], ['path', 'm9 12 2 2 4-4']],
  phone: [['path', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z']],
  phoneOff: [['path', 'M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272'], ['path', 'M22 2 2 22'], ['path', 'M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473']],
  wallet: [['path', 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1'], ['path', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4']],
  user: [['path', 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'], ['circle', 12, 7, 4]],
  sparkles: [['path', 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'], ['path', 'M20 3v4'], ['path', 'M22 5h-4']],
  clock: [['circle', 12, 12, 10], ['path', 'M12 6v6l4 2']],
  dollar: [['path', 'M12 2v20'], ['path', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']],
  pin: [['path', 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'], ['circle', 12, 10, 3]],
  filter: [['path', 'M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z']],
  msg: [['path', 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z']],
  bell: [['path', 'M10.268 21a2 2 0 0 0 3.464 0'], ['path', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326']],
  form: [['rect', 3, 3, 18, 18, 2], ['path', 'M7 8h10'], ['path', 'M7 12h10'], ['path', 'M7 16h6']],
};

export const Ic: React.FC<{ n: keyof typeof P | string; size?: number; color?: string; sw?: number }> = ({
  n,
  size = 40,
  color = 'currentColor',
  sw = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    {(P[n] || []).map((s, i) =>
      s[0] === 'path' ? <path key={i} d={s[1]} /> : s[0] === 'circle' ? <circle key={i} cx={s[1]} cy={s[2]} r={s[3]} /> : <rect key={i} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5]} />,
    )}
  </svg>
);

export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile('logo.png')} style={{ width: size, height: size, display: 'block', objectFit: 'contain' }} />
);

/** Rounded square icon tile. tone: orange | red | green | dark */
export const Tile: React.FC<{ n: string; size?: number; tone?: 'orange' | 'red' | 'green' | 'dark' | 'soft' }> = ({ n, size = 110, tone = 'orange' }) => {
  const bg = { orange: C.orange, red: C.red, green: C.green, dark: C.navy, soft: C.orangeSoft }[tone];
  const fg = tone === 'soft' ? C.orange : '#fff';
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: tone === 'soft' ? 'none' : `0 18px 36px -12px ${bg}AA` }}>
      <Ic n={n} size={size * 0.52} color={fg} sw={2.6} />
    </div>
  );
};
