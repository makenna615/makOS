import { useEffect, useEffectEvent } from 'react';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { Icon } from './Icons';

interface BootScreenProps {
  onDone: () => void;
}

export const BOOT_MS = 2200;

/** Short, skippable splash. Any key, click or tap skips it. */
export function BootScreen({ onDone }: BootScreenProps) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  // Always calls the latest onDone without restarting the timer when it changes.
  const done = useEffectEvent(onDone);

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done();
    };
    const timer = window.setTimeout(finish, reducedMotion ? 800 : BOOT_MS);
    window.addEventListener('keydown', finish);
    window.addEventListener('pointerdown', finish);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
    };
  }, [reducedMotion]);

  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-logo">
        <span className="boot-badge">
          <Icon name="logo" size={64} />
        </span>
        <p className="boot-wordmark">
          mak<span>OS</span>
        </p>
      </div>
      <div className="boot-progress" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="boot-text">Welcome to makOS. Starting up…</p>
      <p className="boot-skip">Press any key or click to skip</p>
    </div>
  );
}
