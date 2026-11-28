import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Solitaire } from './Solitaire';

const status = () => document.querySelector('.sol-status')!;
const root = () => document.querySelector<HTMLElement>('.app.solitaire')!;
const easterEgg = () => fireEvent.keyDown(root(), { key: '@', code: 'Digit2', altKey: true, shiftKey: true });

describe('Solitaire window', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('deals a game and turns over cards from the deck', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Solitaire />);
    expect(document.querySelectorAll('.sol-col')).toHaveLength(7);
    await user.click(screen.getByRole('button', { name: /^Deck, 24 cards/ }));
    expect(screen.getByRole('button', { name: /^Deck, 23 cards/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Turned over/);
  });

  it('remembers options from the Game menu and deals a new game', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Solitaire />);
    await user.click(screen.getByRole('button', { name: 'Game' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Draw Three' }));
    expect(JSON.parse(localStorage.getItem('makos:solitaire')!)).toMatchObject({ draw: 3 });
    await user.click(screen.getByRole('button', { name: /^Deck/ }));
    expect(document.querySelectorAll('.sol-waste .pc')).toHaveLength(3);
  });

  it('the Alt+Shift+2 easter egg only works 30 seconds into a timed Standard game, and stacks', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Solitaire />);
    await user.click(screen.getByRole('button', { name: /^Deck/ })); // starts the timer
    act(() => vi.advanceTimersByTime(20_000));
    easterEgg();
    expect(screen.queryByRole('alertdialog')).toBeNull(); // too early

    act(() => vi.advanceTimersByTime(20_000));
    easterEgg();
    // Reduced motion isn't on, so the celebration runs; any key ends it.
    fireEvent.keyDown(window, { key: 'Escape' });
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(/Deal again\?/);
    const first = status().textContent;
    expect(first).toMatch(/Bonus: [\d,]+/);

    await user.click(within(dialog).getByRole('button', { name: 'No' }));
    easterEgg();
    fireEvent.keyDown(window, { key: 'Escape' });
    await screen.findByRole('alertdialog');
    expect(status().textContent).not.toBe(first); // a second bonus was added
  });

  it('ignores the easter egg in Vegas scoring', async () => {
    localStorage.setItem('makos:solitaire', JSON.stringify({ draw: 1, scoring: 'vegas', timed: true }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Solitaire />);
    expect(status()).toHaveTextContent('Score: $-52');
    await user.click(screen.getByRole('button', { name: /^Deck/ }));
    act(() => vi.advanceTimersByTime(40_000));
    easterEgg();
    expect(document.querySelector('.sol-celebration')).toBeNull();
  });

  it('ignores tampered saved options', () => {
    localStorage.setItem('makos:solitaire', '{"draw":"<img>","scoring":"__proto__","timed":"yes","back":"javascript:alert(1)"}');
    render(<Solitaire />);
    expect(status()).toHaveTextContent('Score: 0');
    expect(screen.getByRole('button', { name: /^Deck, 24 cards\. Turn over a card/ })).toBeInTheDocument();
    expect(document.querySelector('.pc.is-back.has-art')).toBeNull(); // falls back to the makOS back
    expect(root().style.getPropertyValue('--back-img')).toBe('');
  });

  it('Game › Deck… picks a card back, remembers it, and keeps the game going', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Solitaire />);
    await user.click(screen.getByRole('button', { name: /^Deck, 24 cards/ }));
    await user.click(screen.getByRole('button', { name: 'Game' }));
    await user.click(screen.getByRole('menuitem', { name: 'Deck…' }));
    const dialog = screen.getByRole('dialog', { name: 'Select Card Back' });
    const makos = within(dialog).getByRole('radio', { name: 'makOS' });
    expect(makos).toHaveAttribute('aria-checked', 'true');
    expect(makos).toHaveFocus();

    // Arrow keys move the choice; Escape cancels without changing anything.
    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByRole('radio', { name: 'Coffee & Code' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('.pc.is-back.has-art')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Game' }));
    await user.click(screen.getByRole('menuitem', { name: 'Deck…' }));
    await user.click(screen.getByRole('radio', { name: 'This Is Fine' }));
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(localStorage.getItem('makos:solitaire')!)).toMatchObject({ back: 'fine' });
    expect(root().style.getPropertyValue('--back-img')).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(document.querySelectorAll('.sol-col .pc.is-back.has-art')).toHaveLength(21);
    // Same game: the card turned over earlier is still on the pile.
    expect(screen.getByRole('button', { name: /^Deck, 23 cards/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Game' })).toHaveFocus();
  });
});
