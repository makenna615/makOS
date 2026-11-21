import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { cluesFor, puzzleNumber, score, wordFor, type Mark } from '../games/stackdleWords';
import type { AppProps } from './registry';

const MAX_GUESSES = 6;
const SAVE_KEY = 'makos:stackdle';
const STATS_KEY = 'makos:stackdle-stats';
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const MARK_WORDS: Record<Mark, string> = { hit: 'right spot', near: 'in the word', miss: 'not in the word' };
const MARK_EMOJI: Record<Mark, string> = { hit: '🟦', near: '🟨', miss: '⬜' };

interface Stats {
  played: number;
  wins: number;
  streak: number;
  bestStreak: number;
  lastPuzzle: number;
}
const EMPTY_STATS: Stats = { played: 0, wins: 0, streak: 0, bestStreak: 0, lastPuzzle: 0 };

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* progress just isn't remembered */
  }
}

/** Today's saved guesses, if they're for today's puzzle and look valid. */
function readGuesses(puzzle: number): string[] {
  const saved = readJson(SAVE_KEY) as { puzzle?: unknown; guesses?: unknown } | null;
  if (!saved || saved.puzzle !== puzzle || !Array.isArray(saved.guesses)) return [];
  return saved.guesses.filter((g): g is string => typeof g === 'string' && /^[A-Z]{5}$/.test(g)).slice(0, MAX_GUESSES);
}
function readStats(): Stats {
  const raw = readJson(STATS_KEY);
  if (!raw || typeof raw !== 'object') return EMPTY_STATS;
  const out = { ...EMPTY_STATS };
  for (const key of Object.keys(EMPTY_STATS) as (keyof Stats)[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) out[key] = v;
  }
  return out;
}

/** A daily tech word-guessing game. Wrong guesses unlock clues, some taken from Makenna's resume. */
export function Stackdle({ onOpenApp }: AppProps) {
  const [puzzle] = useState(() => puzzleNumber());
  const entry = wordFor(puzzle);
  const answer = entry.word;
  const [guesses, setGuesses] = useState<string[]>(() => readGuesses(puzzle));
  const [current, setCurrent] = useState('');
  const [notice, setNotice] = useState('');
  const [stats, setStats] = useState<Stats>(readStats);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const won = guesses.includes(answer);
  const done = won || guesses.length >= MAX_GUESSES;
  const results = guesses.map((g) => score(g, answer));
  const wrong = guesses.filter((g) => g !== answer).length;
  const clues = cluesFor(entry);
  const shownClues = done ? clues : clues.slice(0, Math.min(wrong, clues.length));

  // Ready to type straight away on desktop. On touch screens, the on-screen keys below are the keyboard.
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: coarse)').matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Best result per letter, for the on-screen keyboard.
  const keyMarks: Record<string, Mark> = {};
  const rank: Record<Mark, number> = { miss: 1, near: 2, hit: 3 };
  guesses.forEach((g, r) =>
    g.split('').forEach((ch, i) => {
      const m = results[r]![i]!;
      if (!keyMarks[ch] || rank[m] > rank[keyMarks[ch]!]) keyMarks[ch] = m;
    }),
  );

  const submit = () => {
    if (done) return;
    if (current.length !== 5) {
      setNotice('Needs 5 letters.');
      return;
    }
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent('');
    writeJson(SAVE_KEY, { puzzle, guesses: next });
    const marks = score(current, answer);
    const solved = current === answer;
    const over = solved || next.length >= MAX_GUESSES;
    const spoken = current
      .split('')
      .map((ch, i) => `${ch} ${MARK_WORDS[marks[i]!]}`)
      .join(', ');
    setNotice(
      `Guess ${next.length}: ${spoken}.` +
        (solved ? ` Solved in ${next.length}!` : over ? ` Out of guesses. The word was ${answer}.` : ' New clue unlocked.'),
    );
    if (over) {
      const prev = readStats();
      if (prev.lastPuzzle !== puzzle) {
        const streak = solved ? (prev.lastPuzzle === puzzle - 1 ? prev.streak + 1 : 1) : 0;
        const updated: Stats = {
          played: prev.played + 1,
          wins: prev.wins + (solved ? 1 : 0),
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          lastPuzzle: puzzle,
        };
        writeJson(STATS_KEY, updated);
        setStats(updated);
      }
    }
  };

  const type = (key: string) => {
    if (done) return;
    setNotice('');
    if (key === 'Enter') submit();
    else if (key === 'Backspace') setCurrent((c) => c.slice(0, -1));
    else if (/^[A-Z]$/.test(key)) setCurrent((c) => (c.length < 5 ? c + key : c));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const shareText =
    `Stackdle #${puzzle} ${won ? guesses.length : 'X'}/${MAX_GUESSES}\n` +
    results.map((r) => r.map((m) => MARK_EMOJI[m]).join('')).join('\n');
  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      setNotice('Could not copy. Select the result and copy it instead.');
    }
  };

  const rows = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < guesses.length) return { letters: guesses[r]!.split(''), marks: results[r]! };
    if (r === guesses.length && !done) return { letters: current.padEnd(5).split(''), marks: null };
    return { letters: [' ', ' ', ' ', ' ', ' '], marks: null };
  });

  return (
    <div className="app game stackdle">
      <div className="sd-head">
        <h3>Stackdle #{puzzle}</h3>
        <span>Guess today&apos;s 5-letter tech word in {MAX_GUESSES} tries</span>
      </div>

      <form className="sd-board" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor="stackdle-input">
          Your guess (5 letters, Enter to submit)
        </label>
        <input
          ref={inputRef}
          id="stackdle-input"
          className="sd-input"
          value={current}
          maxLength={5}
          autoComplete="off"
          autoCapitalize="characters"
          inputMode="none" // no phone keyboard popping up over the game; the on-screen keys do the typing
          spellCheck={false}
          disabled={done}
          onChange={(e) => {
            setNotice('');
            setCurrent(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5));
          }}
        />
        {/* Clicking the board focuses the guess box (it labels it). */}
        <label className="sd-grid" htmlFor="stackdle-input" aria-hidden="true">
          {rows.map((row, r) => (
            <div className="sd-row" key={r}>
              {row.letters.map((ch, i) => (
                <span
                  key={i}
                  className={`sd-tile${ch.trim() ? ' is-filled' : ''}${row.marks ? ` is-${row.marks[i]}` : ''}`}
                  style={row.marks ? { animationDelay: `${i * 80}ms` } : undefined}
                >
                  {ch.trim()}
                </span>
              ))}
            </div>
          ))}
        </label>
      </form>

      <p className="sd-legend">
        <span className="sd-key-hit">● right spot</span> <span className="sd-key-near">◐ in the word</span>{' '}
        <span className="sd-key-miss">○ not in it</span>
      </p>

      <ul className="sd-clues" aria-label="Clues">
        {shownClues.length === 0 && <li className="sd-clue-empty">A clue unlocks after each wrong guess.</li>}
        {shownClues.map((clue) => (
          <li key={clue.text} className={clue.fromResume ? 'is-resume' : undefined}>
            {clue.fromResume && <span className="sd-clue-tag">From Makenna&apos;s resume</span>}
            {clue.text}
            {clue.fromResume && (
              <button type="button" className="btn btn-small" onClick={() => onOpenApp('resume')}>
                Open resume
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="sd-status" role="status">
        {notice}
      </p>

      {done ? (
        <div className="sd-done">
          <p className="sd-result">{won ? `✓ Build passed in ${guesses.length}/${MAX_GUESSES}!` : `Build failed. The word was ${answer}.`}</p>
          <pre className="sd-share">{shareText}</pre>
          <p className="sd-stats">
            Played {stats.played} · Won {stats.wins} · Streak {stats.streak} · Best streak {stats.bestStreak}
          </p>
          <button type="button" className="btn btn-primary" onClick={share}>
            {copied ? 'Copied!' : 'Copy result'}
          </button>
          <p className="sd-next">A new word every day.</p>
        </div>
      ) : (
        <div className="sd-keys" aria-label="On-screen keyboard" role="group">
          {KEY_ROWS.map((row, r) => (
            <div key={row}>
              {r === 2 && (
                <button type="button" className="sd-wide" onClick={() => type('Enter')}>
                  Enter
                </button>
              )}
              {row.split('').map((k) => (
                <button
                  key={k}
                  type="button"
                  className={keyMarks[k] ? `is-${keyMarks[k]}` : undefined}
                  aria-label={keyMarks[k] ? `${k}, ${MARK_WORDS[keyMarks[k]!]}` : k}
                  onClick={() => type(k)}
                >
                  {k}
                </button>
              ))}
              {r === 2 && (
                <button type="button" className="sd-wide" aria-label="Delete letter" onClick={() => type('Backspace')}>
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
