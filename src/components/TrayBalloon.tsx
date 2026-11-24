import { useEffect, useState } from 'react';
import { puzzleNumber, wordFor } from '../games/stackdleWords';
import { openApp } from '../store/actions';

/** One tip per visit, this long after the desktop appears. */
export const BALLOON_DELAY_MS = 40_000;
const BALLOON_SHOW_MS = 12_000;
const TIP_KEY = 'makos:tip-index';

interface Tip {
  id: string;
  title: string;
  body: string;
  /** What clicking the balloon does, if anything. */
  action?: 'stackdle' | 'search' | 'terminal';
  /** Skip this tip when it wouldn't make sense right now. */
  skip?: () => boolean;
}

function stackdleDoneToday(): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem('makos:stackdle') ?? 'null') as { puzzle?: unknown; guesses?: unknown } | null;
    const puzzle = puzzleNumber();
    if (!saved || saved.puzzle !== puzzle || !Array.isArray(saved.guesses)) return false;
    return saved.guesses.includes(wordFor(puzzle).word) || saved.guesses.length >= 6;
  } catch {
    return false;
  }
}

export const TIPS: readonly Tip[] = [
  {
    id: 'stackdle',
    title: 'A new Stackdle is ready',
    body: `Puzzle #${puzzleNumber()}: guess today's 5-letter tech word. Click to play.`,
    action: 'stackdle',
    skip: stackdleDoneToday,
  },
  {
    id: 'search',
    title: 'Find anything fast',
    body: 'Press Ctrl+K (⌘K on a Mac) to search apps, games, skills and more. Click to try it.',
    action: 'search',
  },
  {
    id: 'snap',
    title: 'Snap windows side by side',
    body: 'Drag a window to the left or right edge of the screen to fill half of it, or to the top to maximize.',
  },
  {
    id: 'terminal',
    title: 'Prefer the command line?',
    body: 'Open the Terminal and type help to see what it can do. Click to open it.',
    action: 'terminal',
  },
  {
    id: 'icons',
    title: 'Make yourself at home',
    body: 'Drag icons to rearrange the desktop, or drag on empty space to select several at once.',
  },
  {
    id: 'themes',
    title: 'Three eras of makOS',
    body: 'Switch between Retro, Modern and Future with the switch at the top of the screen.',
  },
];

/** Picks this visit's tip and advances the rotation for next time. */
function nextTip(): Tip | null {
  let start = 0;
  try {
    const saved = Number(localStorage.getItem(TIP_KEY));
    if (Number.isInteger(saved) && saved >= 0) start = saved % TIPS.length;
  } catch {
    /* start at the first tip */
  }
  for (let i = 0; i < TIPS.length; i++) {
    const index = (start + i) % TIPS.length;
    const tip = TIPS[index]!;
    if (tip.skip?.()) continue;
    try {
      localStorage.setItem(TIP_KEY, String(index + 1));
    } catch {
      /* same tip next time */
    }
    return tip;
  }
  return null;
}

/**
 * A desktop-OS style notification balloon above the tray: one helpful tip per visit, a little while
 * after the desktop loads. It never takes focus. Click it to try the tip, or × to dismiss; it also
 * hides on its own after a few seconds.
 */
export function TrayBalloon({ onSearch }: { onSearch: () => void }) {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let hide = 0;
    const show = window.setTimeout(() => {
      if (document.hidden) return;
      const next = nextTip();
      if (!next) return;
      setTip(next);
      hide = window.setTimeout(() => setTip(null), BALLOON_SHOW_MS);
    }, BALLOON_DELAY_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  if (!tip) return <div className="tray-balloon-live" role="status" aria-live="polite" />;

  const act = () => {
    setTip(null);
    if (tip.action === 'search') onSearch();
    else if (tip.action === 'stackdle') openApp('stackdle', null);
    else if (tip.action === 'terminal') openApp('terminal', null);
  };

  return (
    <div className="tray-balloon-live" role="status" aria-live="polite">
      <div className="tray-balloon">
        {tip.action ? (
          <button type="button" className="tray-balloon-body" onClick={act}>
            <strong>{tip.title}</strong>
            <span>{tip.body}</span>
          </button>
        ) : (
          <p className="tray-balloon-body">
            <strong>{tip.title}</strong>
            <span>{tip.body}</span>
          </p>
        )}
        <button type="button" className="tray-balloon-close" aria-label="Dismiss tip" onClick={() => setTip(null)}>
          ×
        </button>
      </div>
    </div>
  );
}
