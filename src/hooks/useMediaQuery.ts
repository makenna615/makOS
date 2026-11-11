import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/**
 * Phone layout: narrow screens, plus short ones (a phone turned sideways), where draggable
 * windows would cover the desktop icons and the 442px start menu wouldn't fit.
 */
export const MOBILE_QUERY = '(max-width: 700px), (max-height: 500px)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
