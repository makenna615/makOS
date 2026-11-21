import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { THEMES, useThemeStore, type ThemeId } from '../theme/theme';

/** When the new theme is swapped in, mid-way through the transition overlay. */
export const THEME_SWAP_MS = 330;
const TRANSITION_MS = 720;

/** First-visit hint: appears HINT_DELAY_MS after the desktop loads, for HINT_SHOW_MS, once ever. */
export const HINT_STORAGE_KEY = 'makos:theme-hint-seen';
export const HINT_DELAY_MS = 3000;
export const HINT_SHOW_MS = 8000;

function hintAlreadySeen() {
  try {
    return localStorage.getItem(HINT_STORAGE_KEY) === '1';
  } catch {
    return true; // can't remember that it was shown, so don't risk showing it on every visit
  }
}
function markHintSeen() {
  try {
    localStorage.setItem(HINT_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Retro / Modern / Future switch. A radio group: one Tab stop, arrow keys move and select.
 * Its look comes from the active theme (see themes.css), and each theme has its own
 * full-screen transition: a CRT squeeze into Retro, a white fade into Modern, a scanline
 * flash into Future. With reduced motion the theme simply changes.
 */
export function ThemeSwitch() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [pending, setPending] = useState<ThemeId | null>(null);
  const refs = useRef(new Map<ThemeId, HTMLButtonElement>());
  const thumbRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const pendingRef = useRef<ThemeId | null>(null);
  const [hint, setHint] = useState(false);

  // On a first visit, point the switch out once: a small pulse and a tooltip, gone after a few seconds.
  useEffect(() => {
    if (hintAlreadySeen()) return;
    let hide = 0;
    const show = window.setTimeout(() => {
      if (hintAlreadySeen()) return; // they found the switch on their own in the meantime
      markHintSeen();
      setHint(true);
      hide = window.setTimeout(() => setHint(false), HINT_SHOW_MS);
    }, HINT_DELAY_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  // The thumb slides to the chosen option right away, before the theme itself swaps.
  const shown = pending ?? theme;

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current.get(shown);
      const thumb = thumbRef.current;
      if (!el || !thumb) return;
      thumb.style.left = `${el.offsetLeft}px`;
      thumb.style.width = `${el.offsetWidth}px`;
    };
    measure();
    // Each theme uses a different font, so re-measure once it has rendered and when fonts finish loading.
    const frame = requestAnimationFrame(measure);
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [shown, theme]);

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => {
      pendingTimers.forEach((t) => window.clearTimeout(t));
      // Unmounted mid-transition (e.g. an app opened on a phone): still apply the chosen theme.
      if (pendingRef.current) setTheme(pendingRef.current);
    };
  }, [setTheme]);

  const choose = (id: ThemeId) => {
    setHint(false);
    markHintSeen(); // they've found it
    if (pending || id === theme) return;
    if (reducedMotion) {
      setTheme(id);
      return;
    }
    setPending(id);
    pendingRef.current = id;
    timers.current.push(
      window.setTimeout(() => {
        pendingRef.current = null;
        setTheme(id);
      }, THEME_SWAP_MS),
      window.setTimeout(() => setPending(null), TRANSITION_MS),
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % THEMES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + THEMES.length) % THEMES.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = THEMES.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const id = THEMES[next]!.id;
    refs.current.get(id)?.focus();
    choose(id);
  };

  return (
    <>
      <div className={`theme-switch${hint ? ' is-hinting' : ''}`} role="radiogroup" aria-label="Theme">
        <span ref={thumbRef} className="theme-switch-thumb" aria-hidden="true" />
        {THEMES.map((t, index) => (
          <button
            key={t.id}
            ref={(el) => {
              if (el) refs.current.set(t.id, el);
              else refs.current.delete(t.id);
            }}
            type="button"
            role="radio"
            aria-checked={shown === t.id}
            tabIndex={shown === t.id ? 0 : -1}
            className={`theme-switch-option${shown === t.id ? ' is-on' : ''}`}
            onClick={() => choose(t.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {hint && (
        <p className="theme-hint" role="status">
          Try a different era: Retro, Modern or Future
        </p>
      )}
      {pending && <div className={`theme-warp to-${pending}`} aria-hidden="true" />}
    </>
  );
}
