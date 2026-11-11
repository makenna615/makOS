import type { ReactNode } from 'react';
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
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconProps['name'], ReactNode> = {
  logo: (
    <>
      <circle cx="24" cy="24" r="21" fill="#fff" opacity=".25" />
      <path d="M11 34V15l7 10 6-9 6 9 7-10v19" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="37" cy="10" r="4.5" fill="#ffd34d" />
    </>
  ),
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
