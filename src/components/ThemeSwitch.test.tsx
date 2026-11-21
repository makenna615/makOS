import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, useThemeStore } from '../theme/theme';
import { HINT_DELAY_MS, HINT_SHOW_MS, HINT_STORAGE_KEY, ThemeSwitch } from './ThemeSwitch';

describe('ThemeSwitch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const finishTransition = () => act(() => vi.advanceTimersByTime(800));

  it('is a radio group with Retro selected by default', () => {
    render(<ThemeSwitch />);
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Retro', 'Modern', 'Future']);
    expect(screen.getByRole('radio', { name: 'Retro' })).toBeChecked();
  });

  it('switches theme on click after the transition and remembers it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeSwitch />);
    await user.click(screen.getByRole('radio', { name: 'Modern' }));
    expect(screen.getByRole('radio', { name: 'Modern' })).toBeChecked();
    finishTransition();
    expect(useThemeStore.getState().theme).toBe('modern');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('modern');
    expect(document.querySelector('.theme-warp')).toBeNull();
  });

  it('still applies the chosen theme if the switch unmounts mid-transition', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<ThemeSwitch />);
    await user.click(screen.getByRole('radio', { name: 'Future' }));
    unmount();
    expect(useThemeStore.getState().theme).toBe('future');
  });

  it('arrow keys move between themes with a single tab stop', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeSwitch />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Retro' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Future' })).toHaveFocus();
    finishTransition();
    expect(useThemeStore.getState().theme).toBe('future');
    expect(screen.getByRole('radio', { name: 'Future' })).toHaveAttribute('tabindex', '0');
  });

  it('switches instantly when reduced motion is on', async () => {
    const original = vi.mocked(window.matchMedia).getMockImplementation()!;
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('reduce'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeSwitch />);
    await user.click(screen.getByRole('radio', { name: 'Future' }));
    expect(useThemeStore.getState().theme).toBe('future');
    expect(document.querySelector('.theme-warp')).toBeNull();
    vi.mocked(window.matchMedia).mockImplementation(original);
  });

  describe('first-visit hint', () => {
    const hint = () => screen.queryByText(/Try a different era/);

    it('appears a few seconds after load, then goes away and never comes back', () => {
      const { unmount } = render(<ThemeSwitch />);
      expect(hint()).toBeNull();
      act(() => vi.advanceTimersByTime(HINT_DELAY_MS));
      expect(hint()).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toHaveClass('is-hinting');
      act(() => vi.advanceTimersByTime(HINT_SHOW_MS));
      expect(hint()).toBeNull();
      expect(localStorage.getItem(HINT_STORAGE_KEY)).toBe('1');

      unmount();
      render(<ThemeSwitch />);
      act(() => vi.advanceTimersByTime(HINT_DELAY_MS + 100));
      expect(hint()).toBeNull();
    });

    it('disappears as soon as the switch is used', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ThemeSwitch />);
      act(() => vi.advanceTimersByTime(HINT_DELAY_MS));
      expect(hint()).toBeInTheDocument();
      await user.click(screen.getByRole('radio', { name: 'Modern' }));
      expect(hint()).toBeNull();
    });

    it('never shows if the switch was used before it appeared', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ThemeSwitch />);
      await user.click(screen.getByRole('radio', { name: 'Future' }));
      act(() => vi.advanceTimersByTime(HINT_DELAY_MS + 100));
      expect(hint()).toBeNull();
    });
  });
});
