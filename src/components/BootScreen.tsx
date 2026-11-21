import { useEffect, useEffectEvent, useState } from 'react';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { useThemeStore } from '../theme/theme';
import { Icon } from './Icons';

interface BootScreenProps {
  onDone: () => void;
}

export const BOOT_MS = 2200;

/** Lines the Future boot screen types out, one every LINE_MS. */
export const FUTURE_BOOT_LINES: readonly { time: string; text: string; status?: string }[] = [
  { time: '0.00', text: 'MAKOS//KERNEL v3.0', status: 'BOOT' },
  { time: '0.21', text: 'loading profile: makenna.peters', status: 'OK' },
  { time: '0.43', text: 'mounting /projects (3)', status: 'OK' },
  { time: '0.67', text: 'linking skills: rails react typescript', status: 'OK' },
  { time: '0.92', text: 'calibrating particle field', status: 'OK' },
  { time: '1.18', text: 'uplink fargo.nd', status: 'ONLINE' },
];
const LINE_MS = 260;

/**
 * Short, skippable splash in the current theme's style. Any key, click or tap skips it.
 * Screen readers hear one "Starting up" message; the visuals (including the typed terminal) are hidden from them.
 */
export function BootScreen({ onDone }: BootScreenProps) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const theme = useThemeStore((s) => s.theme);
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
    <div className={`boot is-${theme}`} role="status" aria-live="polite">
      {theme === 'future' ? <FutureBoot instant={reducedMotion} /> : theme === 'modern' ? <ModernBoot /> : <RetroBoot />}
      <p className="boot-skip">Press any key or click to skip</p>
    </div>
  );
}

function RetroBoot() {
  return (
    <>
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
      <p className="boot-tip">Tip: try the Retro, Modern and Future themes at the top of the screen</p>
    </>
  );
}

function ModernBoot() {
  return (
    <div className="boot-modern">
      <span className="boot-tile">
        <Icon name="logo" size={64} />
      </span>
      <p className="boot-modern-word">makOS</p>
      <span className="boot-spinner" aria-hidden="true" />
      <p className="boot-modern-text">Welcome to makOS. Starting up…</p>
      <p className="boot-tip">Tip: try the Retro, Modern and Future themes at the top of the screen</p>
    </div>
  );
}

function FutureBoot({ instant }: { instant: boolean }) {
  const [shown, setShown] = useState(instant ? FUTURE_BOOT_LINES.length : 0);

  useEffect(() => {
    if (instant) return;
    const timers = FUTURE_BOOT_LINES.map((_, i) => window.setTimeout(() => setShown(i + 1), (i + 1) * LINE_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [instant]);

  return (
    <div className="boot-terminal">
      <p className="visually-hidden">Welcome to makOS. Starting up…</p>
      <div aria-hidden="true">
        <p className="boot-terminal-brand">
          <Icon name="logo" size={36} />
          MAKOS//
        </p>
        <ol className="boot-terminal-lines">
          {FUTURE_BOOT_LINES.slice(0, shown).map((line) => (
            <li key={line.time}>
              <span className="boot-terminal-time">[{line.time}]</span> <span className="boot-terminal-text">{line.text}</span>
              {line.status && (
                <span className={`boot-terminal-status${line.status === 'BOOT' ? ' is-boot' : ''}`}>{line.status}</span>
              )}
            </li>
          ))}
        </ol>
        <p className="boot-terminal-prompt">
          &gt; welcome<span className="boot-cursor" />
        </p>
      </div>
      <p className="boot-tip">// tip: try the Retro, Modern and Future themes at the top of the screen</p>
    </div>
  );
}
