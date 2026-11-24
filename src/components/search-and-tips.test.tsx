import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { puzzleNumber, wordFor } from '../games/stackdleWords';
import { useThemeStore } from '../theme/theme';
import { buildSearchItems, searchItems } from './searchItems';
import { BALLOON_DELAY_MS, TIPS } from './TrayBalloon';

describe('search ranking', () => {
  const items = buildSearchItems();
  const titles = (q: string) => searchItems(items, q).map((i) => i.title);

  it('puts the best match first', () => {
    expect(titles('res')[0]).toBe('Resume - Makenna Peters');
    expect(titles('stack')[0]).toBe('Stackdle');
    expect(titles('future')).toContain('Future theme');
  });

  it('finds skills from the resume', () => {
    expect(titles('kubernetes')).toEqual(['Kubernetes']);
    expect(titles('rails')).toContain('Ruby on Rails');
  });

  it('suggests the main apps before anything is typed', () => {
    expect(titles('').slice(0, 2)).toEqual(['About Me', 'Resume - Makenna Peters']);
    expect(titles('zzzz')).toEqual([]);
  });
});

describe('search window', () => {
  beforeEach(() => sessionStorage.setItem('makos:booted', '1'));

  it('opens with Ctrl+K, opens the chosen app, and Escape closes it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    fireEvent.keyDown(window, { key: 'k', code: 'KeyK', ctrlKey: true });
    const box = screen.getByRole('combobox', { name: /Search apps/ });
    expect(box).toHaveFocus();
    await user.type(box, 'bug sw');
    expect(within(screen.getByRole('listbox')).getAllByRole('option')[0]).toHaveTextContent('Bug Sweeper');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog', { name: 'Search makOS' })).toBeNull();
    expect(await screen.findByRole('dialog', { name: 'Bug Sweeper' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Search/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Search makOS' })).toBeNull();
  });

  it('arrow keys move the highlight, and themes switch from search', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    fireEvent.keyDown(window, { key: 'k', code: 'KeyK', metaKey: true });
    await user.type(screen.getByRole('combobox'), 'theme');
    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', options[1]!.id);
    await user.keyboard('{Enter}');
    expect(useThemeStore.getState().theme).not.toBe(undefined);
    expect(screen.queryByRole('dialog', { name: 'Search makOS' })).toBeNull();
  });
});

describe('tray tips', () => {
  beforeEach(() => sessionStorage.setItem('makos:booted', '1'));
  afterEach(() => vi.useRealTimers());

  it('shows one tip a while after load, then the next tip on the next visit', async () => {
    vi.useFakeTimers();
    const first = render(<App />);
    await act(() => Promise.resolve());
    expect(document.querySelector('.tray-balloon')).toBeNull();
    act(() => vi.advanceTimersByTime(BALLOON_DELAY_MS));
    expect(document.querySelector('.tray-balloon')).toHaveTextContent(TIPS[0]!.title);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tip' }));
    expect(document.querySelector('.tray-balloon')).toBeNull();
    first.unmount();

    render(<App />);
    await act(() => Promise.resolve());
    act(() => vi.advanceTimersByTime(BALLOON_DELAY_MS));
    expect(document.querySelector('.tray-balloon')).toHaveTextContent(TIPS[1]!.title);
  });

  it('skips the Stackdle tip once today is solved', async () => {
    vi.useFakeTimers();
    localStorage.setItem('makos:stackdle', JSON.stringify({ puzzle: puzzleNumber(), guesses: [wordFor(puzzleNumber()).word] }));
    render(<App />);
    await act(() => Promise.resolve());
    act(() => vi.advanceTimersByTime(BALLOON_DELAY_MS));
    expect(document.querySelector('.tray-balloon')).toHaveTextContent(TIPS[1]!.title);
  });
});
