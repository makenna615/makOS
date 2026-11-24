import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { SCREENSAVER_IDLE_MS } from '../components/Screensaver';
import { RESUME } from '../data/resume';
import { useThemeStore } from '../theme/theme';
import { Terminal } from './Terminal';
import { complete } from './terminalCommands';

const log = () => screen.getByRole('log', { name: 'Terminal output' });

async function type(user: ReturnType<typeof userEvent.setup>, line: string) {
  await user.type(await screen.findByLabelText(/Type a command/), `${line}{Enter}`);
}

describe('Terminal', () => {
  it('answers from the resume data', async () => {
    const user = userEvent.setup();
    render(<Terminal onOpenApp={() => {}} />);
    await type(user, 'whoami');
    expect(log()).toHaveTextContent(RESUME.name);
    await type(user, 'skills');
    expect(log()).toHaveTextContent('Ruby on Rails');
    await type(user, 'nonsense');
    expect(log()).toHaveTextContent('nonsense: command not found');
  });

  it('opens apps and switches themes', async () => {
    const user = userEvent.setup();
    const onOpenApp = vi.fn();
    render(<Terminal onOpenApp={onOpenApp} />);
    await type(user, 'open bugs');
    expect(onOpenApp).toHaveBeenCalledWith('bug-sweeper');
    await type(user, 'resume');
    expect(onOpenApp).toHaveBeenCalledWith('resume');
    await type(user, 'theme future');
    expect(useThemeStore.getState().theme).toBe('future');
    await type(user, 'theme toString');
    expect(log()).toHaveTextContent('unknown theme');
  });

  it('has history, tab completion, clear and quick buttons', async () => {
    const user = userEvent.setup();
    render(<Terminal onOpenApp={() => {}} />);
    const input = screen.getByLabelText(/Type a command/);
    await type(user, 'pwd');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('pwd');
    await user.clear(input);
    await user.type(input, 'neof{Tab}');
    expect(input).toHaveValue('neofetch ');
    await user.clear(input);
    await type(user, 'clear');
    expect(log()).toBeEmptyDOMElement();
    await user.click(within(screen.getByRole('group', { name: 'Quick commands' })).getByRole('button', { name: 'contact' }));
    expect(within(log()).getByRole('link', { name: 'github.com/makenna615' })).toBeInTheDocument();
  });

  it('completes app names after "open"', () => {
    expect(complete('open sta')).toEqual(['open stackdle']);
    expect(complete('th')).toEqual(['theme']);
  });
});

describe('Terminal easter egg', () => {
  beforeEach(() => sessionStorage.setItem('makos:booted', '1'));
  afterEach(() => vi.useRealTimers());

  it('"rm -rf /" shows the blue screen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });
    await user.dblClick(within(screen.getByRole('list', { name: 'Desktop' })).getByRole('button', { name: 'Terminal' }));
    await type(user, 'rm -rf /');
    act(() => vi.advanceTimersByTime(500));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('RM_RF_ROOT_WAS_A_BOLD_CHOICE');
  });
});

describe('Screensaver', () => {
  beforeEach(() => sessionStorage.setItem('makos:booted', '1'));
  afterEach(() => vi.useRealTimers());

  it('starts after the idle time and ends on any input', async () => {
    vi.useFakeTimers();
    render(<App />);
    await act(() => Promise.resolve());
    const saver = () => document.querySelector('.screensaver');
    act(() => vi.advanceTimersByTime(SCREENSAVER_IDLE_MS - 1000));
    expect(saver()).toBeNull();
    fireEvent.pointerMove(window); // activity resets the timer
    act(() => vi.advanceTimersByTime(SCREENSAVER_IDLE_MS - 1000));
    expect(saver()).toBeNull();
    act(() => vi.advanceTimersByTime(1000));
    expect(saver()).not.toBeNull();
    fireEvent.keyDown(window, { key: 'a' });
    expect(saver()).toBeNull();
  });
});

describe('Screensaver wake-up', () => {
  beforeEach(() => sessionStorage.setItem('makos:booted', '1'));
  afterEach(() => vi.useRealTimers());

  it('does not pass the waking click or double-click through to the desktop', async () => {
    vi.useFakeTimers();
    render(<App />);
    await act(() => Promise.resolve());
    act(() => vi.advanceTimersByTime(SCREENSAVER_IDLE_MS));
    expect(document.querySelector('.screensaver')).not.toBeNull();
    const icon = within(screen.getByRole('list', { name: 'Desktop' })).getByRole('button', { name: 'Terminal' });
    fireEvent.pointerDown(icon);
    fireEvent.click(icon);
    fireEvent.doubleClick(icon);
    expect(document.querySelector('.screensaver')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Terminal' })).toBeNull();
  });
});

describe('Terminal input safety', () => {
  it('treats built-in object names as unknown, not as apps or files', async () => {
    const user = userEvent.setup();
    const onOpenApp = vi.fn();
    render(<Terminal onOpenApp={onOpenApp} />);
    for (const line of ['open constructor', 'open __proto__', 'open toString', 'cat constructor', 'cat __proto__', 'constructor', '__proto__']) {
      await type(user, line);
    }
    expect(onOpenApp).not.toHaveBeenCalled();
    expect(log()).toHaveTextContent('open: no app called "constructor"');
    expect(log()).toHaveTextContent('cat: constructor: No such file');
    expect(log()).toHaveTextContent('constructor: command not found');
  });

  it('shows typed text as plain text, never as HTML', async () => {
    const user = userEvent.setup();
    render(<Terminal onOpenApp={() => {}} />);
    await type(user, 'echo <img src=x onerror=alert(1)>');
    expect(log().querySelector('img')).toBeNull();
    expect(log()).toHaveTextContent('<img src=x onerror=alert(1)>');
  });
});
