import { useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { LINKS } from '../data/apps';

export type BlueScreenCause = 'restart' | 'keys' | 'terminal';

const CAUSES: Record<BlueScreenCause, string> = {
  restart: 'TOO_MANY_RESTARTS_EXCEPTION',
  keys: 'SECRET_SHORTCUT_DISCOVERED',
  terminal: 'RM_RF_ROOT_WAS_A_BOLD_CHOICE',
};

interface BlueScreenProps {
  /** What triggered it (changes the joke error code). */
  cause: BlueScreenCause;
  /** Dismiss and go back to the desktop. */
  onClose: () => void;
  /** Dismiss and play the normal boot screen. */
  onRestart: () => void;
}

/**
 * Easter egg: a makOS-branded joke "stop" screen, shown after restarting makOS 3 times within
 * 5 minutes or pressing Ctrl+Alt+B. Any key or click dismisses it.
 */
export function BlueScreen({ cause, onClose, onRestart }: BlueScreenProps) {
  const restartRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    restartRef.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keep keyboard focus on the two buttons (it's a modal).
    if (event.key === 'Tab') {
      event.preventDefault();
      const next = document.activeElement === restartRef.current ? resumeRef.current : restartRef.current;
      next?.focus();
      return;
    }
    // Enter and Space activate the focused button; any other key dismisses, like the real thing.
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest('button, a')) onClose();
  };

  return (
    // The whole screen dismisses on click or key press; the two buttons are the accessible way out.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="blue-screen"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="blue-screen-title"
      aria-describedby="blue-screen-body"
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <div className="blue-screen-inner">
        <h2 id="blue-screen-title" className="blue-screen-badge">
          makOS <span className="visually-hidden">stopped working (just kidding: you found an easter egg)</span>
        </h2>
        <div id="blue-screen-body">
          <p>A problem has been detected and makOS has been shut down to prevent damage to your recruiting pipeline.</p>
          <p>
            The problem seems to be caused by the following: <span className="blue-screen-code">{CAUSES[cause]}</span>
          </p>
          <p>
            If this is the first time you&apos;ve seen this screen, congratulations: you found an easter egg. If this keeps
            happening, consider hiring the developer.
          </p>
          <p className="blue-screen-code">*** STOP: 0x000000HIRE (0xMAKENNA, 0xPETERS, 0x0FARGO, 0xREMOTE)</p>
        </div>
        <p aria-hidden="true">
          Press any key or click to continue<span className="blue-screen-cursor">_</span>
        </p>
        <div className="blue-screen-actions">
          <button ref={restartRef} type="button" onClick={onRestart}>
            Restart makOS
          </button>
          <a ref={resumeRef} href={LINKS.resumePdf} target="_blank" rel="noreferrer" onClick={onClose}>
            View resume
          </a>
        </div>
      </div>
    </div>
  );
}
