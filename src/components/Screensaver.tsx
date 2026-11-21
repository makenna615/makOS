import { useEffect, useState } from 'react';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { useThemeStore } from '../theme/theme';
import { Icon } from './Icons';
import { Wallpaper } from './Wallpaper';

/** Idle time before the screensaver starts. Long enough not to interrupt someone reading the resume. */
export const SCREENSAVER_IDLE_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/**
 * Desktop screensaver: after a couple of idle minutes the current theme's animated wallpaper fills the
 * screen, with a slowly bouncing makOS badge (Retro and Modern; Future's particles already spell it).
 * Any mouse movement, key, touch or scroll ends it, and that first input isn't passed through to what's
 * underneath. Skipped for visitors who prefer reduced motion.
 */
export function Screensaver() {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const theme = useThemeStore((s) => s.theme);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!document.hidden) setActive(true);
        else arm();
      }, SCREENSAVER_IDLE_MS);
    };
    const onActivity = () => {
      setActive(false);
      arm();
    };
    // Capture phase, so activity counts even where an app stops it from bubbling.
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, { capture: true, passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, onActivity, { capture: true }));
    };
  }, [reducedMotion]);

  // While it's showing, the input that wakes the screen up shouldn't also click or type into the desktop.
  useEffect(() => {
    if (!active) return;
    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      setActive(false);
    };
    window.addEventListener('keydown', swallow, { capture: true });
    window.addEventListener('pointerdown', swallow, { capture: true });
    // Clicks (and double-clicks) arrive a moment after the waking pointerdown.
    const swallowClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('click', swallowClick, { capture: true });
    window.addEventListener('dblclick', swallowClick, { capture: true });
    return () => {
      window.removeEventListener('keydown', swallow, { capture: true });
      window.removeEventListener('pointerdown', swallow, { capture: true });
      window.setTimeout(() => {
        window.removeEventListener('click', swallowClick, { capture: true });
        window.removeEventListener('dblclick', swallowClick, { capture: true });
      }, 600);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className={`screensaver is-${theme}`} aria-hidden="true">
      <Wallpaper screensaver />
      {theme !== 'future' && (
        <div className="screensaver-x">
          <div className="screensaver-y">
            <div className="screensaver-badge">
              <Icon name="logo" size={56} />
              <span>
                mak<b>OS</b>
              </span>
            </div>
          </div>
        </div>
      )}
      <p className="screensaver-hint">Move the mouse or press any key</p>
    </div>
  );
}
