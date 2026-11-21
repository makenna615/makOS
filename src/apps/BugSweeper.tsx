import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { LEVELS, flagsPlaced, newBoard, reveal, toggleFlag, type Cell, type Level } from '../games/bugSweeper';

const BEST_KEY = 'makos:bug-sweeper-best';
const LONG_PRESS_MS = 450;

type Best = Partial<Record<Level, number>>;

function readBest(): Best {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}');
    const best: Best = {};
    if (parsed && typeof parsed === 'object') {
      for (const level of Object.keys(LEVELS) as Level[]) {
        const value = (parsed as Record<string, unknown>)[level];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) best[level] = Math.round(value);
      }
    }
    return best;
  } catch {
    return {};
  }
}

function cellLabel(cell: Cell, row: number, col: number) {
  const where = `Row ${row}, column ${col}`;
  if (cell.open && cell.bug) return `${where}: bug`;
  if (cell.open) return `${where}: ${cell.near ? `${cell.near} bug${cell.near > 1 ? 's' : ''} nearby` : 'clean'}`;
  return `${where}: ${cell.flag ? 'breakpoint' : 'unchecked'}`;
}

/** Find the bugs hidden in the codebase. A developer-themed take on the classic mine-sweeping puzzle. */
export function BugSweeper() {
  const [level, setLevel] = useState<Level>('junior');
  const [board, setBoard] = useState(() => newBoard('junior'));
  const [seconds, setSeconds] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [best, setBest] = useState<Best>(readBest);
  // Tap-to-flag mode: the easy way to set breakpoints on a touch screen.
  const [flagMode, setFlagMode] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const longPress = useRef<{ timer: number; fired: boolean } | null>(null);

  const playing = board.status === 'playing';
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.min(999, s + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  const recordWin = () => {
    const time = Math.max(1, seconds);
    if (best[level] !== undefined && best[level]! <= time) return;
    const next = { ...best, [level]: time };
    setBest(next);
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(next));
    } catch {
      /* not saved, still shown this session */
    }
  };

  const restart = (nextLevel: Level = level) => {
    setLevel(nextLevel);
    setBoard(newBoard(nextLevel));
    setSeconds(0);
    setFocusIndex(0);
  };

  const open = (i: number) => {
    const next = reveal(board, i);
    if (next.status === 'won' && board.status !== 'won') recordWin();
    setBoard(next);
  };
  const flag = (i: number) => setBoard((b) => toggleFlag(b, i));

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const { width, height } = board;
    const x = i % width;
    const y = Math.floor(i / width);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = y * width + Math.min(width - 1, x + 1);
    else if (event.key === 'ArrowLeft') next = y * width + Math.max(0, x - 1);
    else if (event.key === 'ArrowDown') next = Math.min(height - 1, y + 1) * width + x;
    else if (event.key === 'ArrowUp') next = Math.max(0, y - 1) * width + x;
    else if (event.key === 'Home') next = y * width;
    else if (event.key === 'End') next = y * width + width - 1;
    else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      flag(i);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation(); // keep Alt-free arrows from reaching the window
    setFocusIndex(next);
    refs.current[next]?.focus();
  };

  // Touch: a long press sets a breakpoint instead of opening the cell.
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, i: number) => {
    if (event.pointerType !== 'touch') return;
    const state = { fired: false, timer: 0 };
    state.timer = window.setTimeout(() => {
      state.fired = true;
      flag(i);
    }, LONG_PRESS_MS);
    longPress.current = state;
  };
  const cancelLongPress = () => {
    if (longPress.current && !longPress.current.fired) window.clearTimeout(longPress.current.timer);
  };
  const onClick = (i: number) => {
    if (longPress.current?.fired) {
      longPress.current = null;
      return;
    }
    longPress.current = null;
    if (flagMode) flag(i);
    else open(i);
  };
  const onContextMenu = (event: MouseEvent, i: number) => {
    event.preventDefault();
    flag(i);
  };

  const left = board.bugs - flagsPlaced(board);
  const message =
    board.status === 'won'
      ? `✓ All tests passed in ${seconds}s. Ship it! 🚀`
      : board.status === 'lost'
        ? `FATAL: unhandled exception in production (row ${Math.floor(board.hit! / board.width) + 1}, column ${(board.hit! % board.width) + 1})`
        : board.status === 'ready'
          ? '// Open a line to start. Right-click, long-press, press F or use Flag mode to set a 🚩 breakpoint.'
          : '';
  const resetLabel = board.status === 'won' ? 'git push' : board.status === 'lost' ? 'git revert' : 'git reset';

  return (
    <div className="app game bug-sweeper" style={{ '--bs-cols': board.width } as CSSProperties}>
      <div className="bs-levels" role="group" aria-label="Difficulty">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <button
            key={l}
            type="button"
            className="btn btn-small"
            aria-pressed={level === l}
            onClick={() => restart(l)}
          >
            {LEVELS[l].label}
          </button>
        ))}
        <button type="button" className="btn btn-small bs-flag-mode" aria-pressed={flagMode} onClick={() => setFlagMode((m) => !m)}>
          🚩 Flag mode
        </button>
        <span className="bs-best">{best[level] ? `Best: ${best[level]}s` : 'No best time yet'}</span>
      </div>

      <div className="bs-bar">
        <span className="bs-left">
          <span aria-hidden="true">🐞 {left}</span>
          <span className="visually-hidden">{left} bugs left to find</span>
        </span>
        <button type="button" className="bs-reset" onClick={() => restart()} aria-label={`${resetLabel}: new game`}>
          {resetLabel}
        </button>
        <span className="bs-time">
          <span aria-hidden="true">⏱ {String(seconds).padStart(3, '0')}</span>
          <span className="visually-hidden">{seconds} seconds</span>
        </span>
      </div>

      <div
        className="bs-grid"
        role="group"
        aria-label={`Codebase, ${board.width} by ${board.height}. Arrow keys move, Enter opens, F sets a breakpoint.`}
        style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, var(--bs-cell)))` }}
      >
        {board.cells.map((cell, i) => {
          const row = Math.floor(i / board.width) + 1;
          const col = (i % board.width) + 1;
          const content = cell.open ? (cell.bug ? '🐞' : cell.near || '') : cell.flag ? '🚩' : '';
          return (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
              className={`bs-cell${cell.open ? ' is-open' : ''}${cell.open && cell.near && !cell.bug ? ` n${cell.near}` : ''}${cell.bug && cell.open ? ' is-bug' : ''}${board.hit === i ? ' is-hit' : ''}${cell.flag && !cell.open ? ' is-flag' : ''}`}
              aria-label={cellLabel(cell, row, col)}
              aria-disabled={cell.open || board.status === 'won' || board.status === 'lost' ? true : undefined}
              onClick={() => onClick(i)}
              onContextMenu={(e) => onContextMenu(e, i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onFocus={() => setFocusIndex(i)}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
            >
              <span aria-hidden="true">{content}</span>
            </button>
          );
        })}
      </div>

      <p className="bs-msg" role="status">
        {message}
      </p>
    </div>
  );
}
