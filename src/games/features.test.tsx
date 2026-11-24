import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { BugSweeper } from '../apps/BugSweeper';
import { Stackdle } from '../apps/Stackdle';
import { puzzleNumber, wordFor } from './stackdleWords';

describe('Bug Sweeper window', () => {
  it('starts a game on the first click without ever hitting a bug', async () => {
    const user = userEvent.setup();
    render(<BugSweeper />);
    const cells = within(screen.getByRole('group', { name: /Codebase/ })).getAllByRole('button');
    expect(cells).toHaveLength(81);
    await user.click(cells[40]!);
    expect(screen.queryByText(/FATAL/)).toBeNull();
    expect(cells[40]).toHaveAccessibleName(/Row 5, column 5: (clean|\d bugs? nearby)/);
  });

  it('sets breakpoints with F and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<BugSweeper />);
    const cells = within(screen.getByRole('group', { name: /Codebase/ })).getAllByRole('button');
    cells[0]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(cells[1]).toHaveFocus();
    await user.keyboard('f');
    expect(cells[1]).toHaveAccessibleName('Row 1, column 2: breakpoint');
    expect(screen.getByText(/🐞 9/)).toBeInTheDocument();
  });

  it('has a tap-to-flag mode for touch screens', async () => {
    const user = userEvent.setup();
    render(<BugSweeper />);
    await user.click(screen.getByRole('button', { name: /Flag mode/ }));
    const cells = within(screen.getByRole('group', { name: /Codebase/ })).getAllByRole('button');
    await user.click(cells[3]!);
    expect(cells[3]).toHaveAccessibleName('Row 1, column 4: breakpoint');
  });
});

describe('Stackdle window', () => {
  const answer = wordFor(puzzleNumber()).word;
  const wrong = answer === 'ZZZZZ' ? 'YYYYY' : 'ZZZZZ';

  it('takes guesses from the on-screen keyboard and unlocks a clue per wrong guess', async () => {
    const user = userEvent.setup();
    const onOpenApp = vi.fn();
    render(<Stackdle onOpenApp={onOpenApp} />);
    const keys = screen.getByRole('group', { name: 'On-screen keyboard' });
    for (const ch of wrong) await user.click(within(keys).getByRole('button', { name: ch }));
    await user.click(within(keys).getByRole('button', { name: 'Enter' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Guess 1: Z not in the word/);
    const clues = screen.getByRole('list', { name: 'Clues' });
    expect(within(clues).getAllByRole('listitem')).toHaveLength(1);
    expect(within(clues).getByText(/^Category/)).toBeInTheDocument();
  });

  it('takes typed guesses, remembers them, and finishes with a shareable result', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Stackdle onOpenApp={() => {}} />);
    const input = screen.getByLabelText(/Your guess/);
    await user.type(input, `${answer.toLowerCase()}{Enter}`);
    expect(screen.getByText(/Build passed in 1\/6/)).toBeInTheDocument();
    expect(screen.getByText(/Stackdle #\d+ 1\/6/)).toBeInTheDocument();
    unmount();
    render(<Stackdle onOpenApp={() => {}} />);
    expect(screen.getByText(/Build passed in 1\/6/)).toBeInTheDocument(); // same day, still solved
    expect(screen.getByText(/Played 1 · Won 1 · Streak 1/)).toBeInTheDocument();
  });

  it('ignores tampered saved data', () => {
    localStorage.setItem('makos:stackdle', JSON.stringify({ puzzle: puzzleNumber(), guesses: ['<img>', 42, 'ab'] }));
    localStorage.setItem('makos:stackdle-stats', '{"played":"lots"');
    render(<Stackdle onOpenApp={() => {}} />);
    expect(screen.getByText(/A clue unlocks after each wrong guess/)).toBeInTheDocument();
  });
});

describe('blue screen easter egg', () => {
  beforeEach(() => {
    sessionStorage.setItem('makos:booted', '1');
  });
  afterEach(() => vi.useRealTimers());

  const restartFromStartMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'makOS' }));
    await user.click(screen.getByRole('menuitem', { name: 'Restart makOS' }));
  };

  it('appears after 3 restarts within 5 minutes and can be dismissed with any key', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    for (let i = 0; i < 2; i++) {
      await restartFromStartMenu(user);
      fireEvent.keyDown(window, { key: ' ' }); // skip the boot screen
      await screen.findByRole('dialog', { name: 'About Me' });
    }
    await restartFromStartMenu(user);
    const blue = await screen.findByRole('alertdialog');
    expect(blue).toHaveTextContent(/consider hiring the developer/);
    expect(within(blue).getByRole('button', { name: 'Restart makOS' })).toHaveFocus();

    await user.keyboard('x');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(await screen.findByRole('dialog', { name: 'About Me' })).toBeInTheDocument();
  });

  it('opens with Ctrl+Alt+B and "Restart makOS" plays the boot screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    fireEvent.keyDown(window, { key: 'b', code: 'KeyB', ctrlKey: true, altKey: true });
    const blue = await screen.findByRole('alertdialog');
    await user.click(within(blue).getByRole('button', { name: 'Restart makOS' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByText(/Starting up/)).toBeInTheDocument();
  });

  it('does not appear for restarts spread over more than 5 minutes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    for (let i = 0; i < 3; i++) {
      await restartFromStartMenu(user);
      expect(screen.queryByRole('alertdialog')).toBeNull();
      fireEvent.keyDown(window, { key: ' ' });
      await screen.findByRole('dialog', { name: 'About Me' });
      // 3 minutes between restarts, with some mouse movement so the screensaver doesn't start.
      act(() => vi.advanceTimersByTime(90 * 1000));
      fireEvent.pointerMove(window);
      act(() => vi.advanceTimersByTime(90 * 1000));
    }
  });
});
