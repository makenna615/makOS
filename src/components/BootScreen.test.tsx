import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeStore } from '../theme/theme';
import { BOOT_MS, BootScreen, FUTURE_BOOT_LINES } from './BootScreen';

describe('BootScreen', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the Retro splash by default and finishes after the boot time', () => {
    const onDone = vi.fn();
    const { container } = render(<BootScreen onDone={onDone} />);
    expect(container.querySelector('.boot-progress')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Starting up');
    act(() => vi.advanceTimersByTime(BOOT_MS));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('uses the Modern splash in the Modern theme', () => {
    useThemeStore.setState({ theme: 'modern' });
    const { container } = render(<BootScreen onDone={() => {}} />);
    expect(container.querySelector('.boot-spinner')).toBeInTheDocument();
    expect(container.querySelector('.boot-progress')).toBeNull();
  });

  it('types the Future boot log one line at a time, hidden from screen readers', () => {
    useThemeStore.setState({ theme: 'future' });
    const { container } = render(<BootScreen onDone={() => {}} />);
    const lines = () => container.querySelectorAll('.boot-terminal-lines li').length;
    expect(lines()).toBe(0);
    act(() => vi.advanceTimersByTime(600));
    expect(lines()).toBeGreaterThan(0);
    expect(lines()).toBeLessThan(FUTURE_BOOT_LINES.length);
    act(() => vi.advanceTimersByTime(2000));
    expect(lines()).toBe(FUTURE_BOOT_LINES.length);
    // One plain message for screen readers instead of the whole log.
    expect(container.querySelector('.boot-terminal-lines')!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Welcome to makOS. Starting up');
  });

  it('can be skipped with any key', () => {
    useThemeStore.setState({ theme: 'future' });
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
