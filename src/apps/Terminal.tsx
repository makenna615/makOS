import { Fragment, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { closeApp } from '../store/actions';
import { useThemeStore } from '../theme/theme';
import type { AppProps } from './registry';
import { complete, runCommand, type TerminalContext } from './terminalCommands';

const PROMPT = 'mak@makOS:~$';
const MAX_ENTRIES = 200;
const QUICK = ['help', 'whoami', 'skills', 'projects', 'contact', 'neofetch'];

interface Entry {
  id: number;
  command?: string;
  output: ReactNode[];
}

const toLines = (result: ReturnType<typeof runCommand>): ReactNode[] =>
  result === null || result === undefined ? [] : Array.isArray(result) ? result : [result];

/** A small shell: commands answer from the resume data and can open apps, switch themes, and more. */
export function Terminal({ onOpenApp }: AppProps) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [entries, setEntries] = useState<Entry[]>(() => [
    {
      id: 0,
      output: ['Welcome to mak-sh. Type "help" to see what you can do, or tap a command below.', ''],
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Ready to type on desktop; on touch screens wait for a tap, so the phone keyboard doesn't pop up uninvited.
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: coarse)').matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    // Keep the newest output in view (scrolls only the terminal, never the page).
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const run = (line: string) => {
    const trimmed = line.trim();
    let cleared = false;
    const ctx: TerminalContext = {
      openApp: onOpenApp,
      setTheme,
      theme,
      clear: () => {
        cleared = true;
      },
      exit: () => closeApp('terminal'),
      history,
      startedAt,
    };
    const output = toLines(runCommand(trimmed, ctx));
    if (trimmed) setHistory((h) => [...h, trimmed].slice(-100));
    setCursor(null);
    setInput('');
    if (cleared) {
      setEntries([]);
      return;
    }
    setEntries((e) => [...e, { id: nextId.current++, command: line, output }].slice(-MAX_ENTRIES));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    run(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!history.length) return;
      event.preventDefault();
      event.stopPropagation(); // keep the window from treating these as its own shortcuts
      const next =
        event.key === 'ArrowUp'
          ? cursor === null
            ? history.length - 1
            : Math.max(0, cursor - 1)
          : cursor === null || cursor >= history.length - 1
            ? null
            : cursor + 1;
      setCursor(next);
      setInput(next === null ? '' : history[next]!);
    } else if (event.key === 'Tab' && input.trim()) {
      const matches = complete(input);
      if (!matches.length) return;
      event.preventDefault();
      if (matches.length === 1) setInput(matches[0]! + ' ');
      else setEntries((e) => [...e, { id: nextId.current++, command: input, output: [matches.join('   ')] }]);
    } else if (event.ctrlKey && (event.key === 'l' || event.key === 'L')) {
      event.preventDefault();
      setEntries([]);
    } else if (event.ctrlKey && (event.key === 'c' || event.key === 'C') && !window.getSelection()?.toString()) {
      event.preventDefault();
      setEntries((e) => [...e, { id: nextId.current++, command: `${input}^C`, output: [] }]);
      setInput('');
    }
  };

  return (
    <div className="app terminal">
      <div className="term-screen" ref={screenRef}>
        <div className="term-log" role="log" aria-label="Terminal output" aria-live="polite">
          {entries.map((entry) => (
            <Fragment key={entry.id}>
              {entry.command !== undefined && (
                <div className="term-line">
                  <span className="term-prompt" aria-hidden="true">
                    {PROMPT}
                  </span>{' '}
                  <span className="visually-hidden">Command: </span>
                  {entry.command}
                </div>
              )}
              {entry.output.map((line, i) => (
                <div className="term-line term-out" key={i}>
                  {line === '' ? ' ' : line}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
        <form className="term-input-row" onSubmit={onSubmit}>
          <label htmlFor="terminal-input" className="term-prompt">
            {PROMPT}
            <span className="visually-hidden"> Type a command</span>
          </label>
          <input
            ref={inputRef}
            id="terminal-input"
            className="term-input"
            value={input}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            onChange={(e) => setInput(e.target.value.slice(0, 200))}
            onKeyDown={onKeyDown}
          />
        </form>
      </div>
      <div className="term-quick" role="group" aria-label="Quick commands">
        {QUICK.map((cmd) => (
          <button key={cmd} type="button" onClick={() => run(cmd)}>
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
