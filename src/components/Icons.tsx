import { useId, type ReactNode } from 'react';
import type { IconName } from '../data/apps';

interface IconProps {
  name: IconName | 'logo' | 'power' | 'text';
  size?: number;
}

/** Original makOS icon set. Every icon is decorative: callers provide the accessible label. */
export function Icon({ name, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className="icon"
    >
      {name === 'logo' ? <Logo compact={size < 32} /> : PATHS[name]}
    </svg>
  );
}

/*
 * The makOS logo: a white hand-lettered M (bold Segoe Print, converted to a
 * shape) in a red, yellow, green and blue ring with a see-through blue center.
 * Neighboring ring colors blend over 20° on each side of the join.
 * public/favicon.svg is the compact version of the same drawing.
 */
const RED = '#e8412c';
const YELLOW = '#f6c018';
const GREEN = '#5bb33c';
const BLUE = '#2a7de1';
const RING = [
  { color: RED, arc: 'M24 4A20 20 0 0 1 44 24' },
  { color: YELLOW, arc: 'M44 24A20 20 0 0 1 24 44' },
  { color: GREEN, arc: 'M24 44A20 20 0 0 1 4 24' },
  { color: BLUE, arc: 'M4 24A20 20 0 0 1 24 4' },
];
/** Arcs over each join, fading from one ring color into the next (gradient runs from x1,y1 to x2,y2). */
const BLENDS = [
  { arc: 'M42.79 17.16A20 20 0 0 1 42.79 30.84', x1: 42.79, y1: 17.16, x2: 42.79, y2: 30.84, from: RED, to: YELLOW },
  { arc: 'M30.84 42.79A20 20 0 0 1 17.16 42.79', x1: 30.84, y1: 42.79, x2: 17.16, y2: 42.79, from: YELLOW, to: GREEN },
  { arc: 'M5.21 30.84A20 20 0 0 1 5.21 17.16', x1: 5.21, y1: 30.84, x2: 5.21, y2: 17.16, from: GREEN, to: BLUE },
  { arc: 'M17.16 5.21A20 20 0 0 1 30.84 5.21', x1: 17.16, y1: 5.21, x2: 30.84, y2: 5.21, from: BLUE, to: RED },
];
/** The M, centered on (24, 24) with clear space inside the ring. */
const LOGO_M =
  'M31.75 18.86L27.44 24.68Q24.45 28.86 22.84 28.86Q22.08 28.86 21.5 28Q20.92 27.14 20.31 25.38Q19.7 23.62 19.46 22.71Q18.9 20.62 18.71 20.33L18.05 23.7Q17.74 25.33 17.41 26.69Q17.09 28.06 16.71 29.97Q16.33 31.89 16.24 32.86Q16.21 33.18 15.62 33.56Q15.03 33.93 14.72 33.93Q14.1 33.93 13.56 33.36Q13.03 32.78 13.03 32.25Q13.03 31.01 13.54 29.09Q15.68 21.25 15.98 19.22Q16.29 17.19 16.29 15.84Q16.29 15.14 16.9 14.77Q17.5 14.39 18.49 14.39Q19.02 14.39 19.55 15.09Q20.08 15.79 20.25 16.38L22.03 21.39Q23.11 24.41 23.47 25.22Q24.87 23.71 27.61 19.96Q30.35 16.22 31.36 15.14Q32.37 14.07 32.79 14.07Q33.42 14.07 34.2 14.6Q34.97 15.13 34.97 15.5Q34.97 15.79 34.47 19.4Q34.12 21.95 33.83 25.11Q33.55 28.26 33.55 28.83Q33.55 29.53 33.73 30.27Q33.86 30.84 33.86 31.34Q33.86 32.62 33.41 33.09Q32.97 33.56 32.04 33.56Q30.34 33.56 30.34 31.01Q30.34 28.6 30.78 25.13Q31.22 21.65 31.58 19.79Q31.71 19.12 31.75 18.86Z';
/** A smaller M for icons under 32px, where the outline would otherwise run into the ring. */
const LOGO_M_COMPACT =
  'M30.81 19.48L27.02 24.6Q24.4 28.27 22.98 28.27Q22.32 28.27 21.81 27.51Q21.29 26.76 20.76 25.21Q20.23 23.66 20.01 22.87Q19.52 21.03 19.35 20.78L18.77 23.73Q18.5 25.17 18.21 26.36Q17.93 27.56 17.6 29.25Q17.26 30.93 17.18 31.78Q17.16 32.06 16.64 32.39Q16.12 32.72 15.85 32.72Q15.3 32.72 14.83 32.22Q14.36 31.71 14.36 31.25Q14.36 30.15 14.82 28.47Q16.69 21.58 16.96 19.8Q17.23 18.02 17.23 16.83Q17.23 16.22 17.76 15.89Q18.29 15.56 19.16 15.56Q19.62 15.56 20.09 16.17Q20.56 16.79 20.7 17.31L22.27 21.71Q23.22 24.36 23.53 25.07Q24.76 23.74 27.17 20.45Q29.58 17.16 30.47 16.22Q31.35 15.28 31.72 15.28Q32.27 15.28 32.96 15.74Q33.64 16.21 33.64 16.54Q33.64 16.79 33.2 19.96Q32.89 22.2 32.64 24.97Q32.39 27.75 32.39 28.25Q32.39 28.86 32.55 29.51Q32.66 30.01 32.66 30.45Q32.66 31.58 32.27 31.98Q31.88 32.39 31.06 32.39Q29.57 32.39 29.57 30.15Q29.57 28.04 29.96 24.99Q30.34 21.94 30.66 20.3Q30.77 19.71 30.81 19.48Z';

function Logo({ compact }: { compact: boolean }) {
  // Gradient ids must be unique per instance: the logo appears more than once on a page.
  const id = useId();
  return (
    <>
      <defs>
        {BLENDS.map((b, i) => (
          <linearGradient
            key={i}
            id={`${id}-blend${i}`}
            gradientUnits="userSpaceOnUse"
            x1={b.x1}
            y1={b.y1}
            x2={b.x2}
            y2={b.y2}
          >
            <stop offset="0" stopColor={b.from} />
            <stop offset="1" stopColor={b.to} />
          </linearGradient>
        ))}
      </defs>
      <circle cx="24" cy="24" r="17.5" fill="#1450b8" fillOpacity=".55" />
      <g fill="none" strokeWidth="5">
        {RING.map((r) => (
          <path key={r.color} d={r.arc} stroke={r.color} />
        ))}
        {BLENDS.map((b, i) => (
          <path key={i} d={b.arc} stroke={`url(#${id}-blend${i})`} />
        ))}
      </g>
      <path
        d={compact ? LOGO_M_COMPACT : LOGO_M}
        fill="#fff"
        stroke="#000"
        strokeOpacity=".4"
        strokeWidth="2.2"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </>
  );
}

const PATHS: Record<Exclude<IconProps['name'], 'logo'>, ReactNode> = {
  about: (
    <>
      <rect x="4" y="8" width="40" height="32" rx="4" fill="#e9f1ff" stroke="#2759b0" strokeWidth="2" />
      <circle cx="17" cy="21" r="6" fill="#f4b183" />
      <path d="M8 36c1.5-6 5-9 9-9s7.5 3 9 9" fill="#4f86e8" />
      <path d="M11 19c0-5 3-8 6-8s6 3 6 8c-2-2-4-3-6-3s-4 1-6 3z" fill="#8a5a3c" />
      <rect x="28" y="16" width="12" height="3" rx="1.5" fill="#2759b0" />
      <rect x="28" y="22" width="10" height="3" rx="1.5" fill="#7ea6ee" />
      <rect x="28" y="28" width="12" height="3" rx="1.5" fill="#7ea6ee" />
    </>
  ),
  resume: (
    <>
      <path d="M11 4h19l9 9v31H11z" fill="#fff" stroke="#5b6b82" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 4v9h9" fill="#dfe7f3" stroke="#5b6b82" strokeWidth="2" strokeLinejoin="round" />
      <rect x="16" y="18" width="18" height="3" rx="1.5" fill="#2f6fd6" />
      <rect x="16" y="25" width="18" height="2" rx="1" fill="#9aa8bd" />
      <rect x="16" y="30" width="14" height="2" rx="1" fill="#9aa8bd" />
      <rect x="16" y="35" width="16" height="2" rx="1" fill="#9aa8bd" />
    </>
  ),
  projects: (
    <>
      <path d="M4 12a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e7a92e" />
      <path d="M4 17h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd25e" stroke="#c98e12" strokeWidth="1.5" />
      <path d="M4 17h40" stroke="#fff3c4" strokeWidth="2" />
    </>
  ),
  contact: (
    <>
      <rect x="4" y="10" width="40" height="28" rx="3" fill="#fff" stroke="#2759b0" strokeWidth="2" />
      <path d="M5 12l19 15 19-15" fill="none" stroke="#2759b0" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M5 37l14-12M43 37 29 25" stroke="#7ea6ee" strokeWidth="2" />
      <rect x="33" y="13" width="7" height="8" rx="1" fill="#ffd34d" stroke="#c98e12" strokeWidth="1" />
    </>
  ),
  football: (
    <>
      <ellipse cx="24" cy="24" rx="19" ry="12" transform="rotate(-35 24 24)" fill="#9b5524" stroke="#5e3011" strokeWidth="2" />
      <path d="M14 33c-2-5 0-12 6-17M34 15c2 5 0 12-6 17" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M19 29l10-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20.5 23.5l4 4M23 21l4 4M18 26l4 4M25.5 18.5l4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  perfume: (
    <>
      <rect x="19" y="3" width="10" height="7" rx="2" fill="#c9a24b" />
      <rect x="16" y="9" width="16" height="5" rx="1.5" fill="#e0c06d" stroke="#a7832f" strokeWidth="1" />
      <path d="M7 22a8 8 0 0 1 8-8h18a8 8 0 0 1 8 8v15a8 8 0 0 1-8 8H15a8 8 0 0 1-8-8z" fill="#efe4ff" stroke="#6b3fb8" strokeWidth="2" />
      <path d="M9 29h30v8a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z" fill="#a77be8" />
      <path d="M13 19v7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 35c3-3 6 3 9 0s6 3 9 0" fill="none" stroke="#efe4ff" strokeWidth="1.5" opacity=".8" />
    </>
  ),
  power: (
    <>
      <circle cx="24" cy="24" r="20" fill="#e5484d" />
      <path d="M16 16a11 11 0 1 0 16 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 11v13" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  text: (
    <>
      <path d="M11 4h26v40H11z" fill="#fff" stroke="#5b6b82" strokeWidth="2" />
      <path d="M16 13h16M16 19h16M16 25h16M16 31h10" stroke="#5b6b82" strokeWidth="2" />
    </>
  ),
};
