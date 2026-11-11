import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('makOS desktop', () => {
  beforeEach(() => {
    sessionStorage.setItem('makos:booted', '1'); // skip the splash screen
  });

  it('opens the About window on load', async () => {
    render(<App />);
    expect(await screen.findByRole('dialog', { name: 'About Me' })).toBeInTheDocument();
  });

  it('opens an app from the desktop with the keyboard and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('dialog', { name: 'About Me' });

    const desktop = screen.getByRole('list', { name: 'Desktop' });
    const resumeIcon = within(desktop).getByRole('button', { name: 'Resume' });
    resumeIcon.focus();
    await user.keyboard('{Enter}');

    const resume = await screen.findByRole('dialog', { name: 'Resume - Makenna Peters' });
    await waitFor(() => expect(resume).toContainElement(document.activeElement as HTMLElement));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Resume - Makenna Peters' })).not.toBeInTheDocument();
    await waitFor(() => expect(resumeIcon).toHaveFocus());
  });

  it('arrow keys move between desktop icons', async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole('list', { name: 'Desktop' });
    const [first, second] = within(desktop).getAllByRole('button');
    first!.focus();
    await user.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
  });

  it('shows a taskbar button for each open window and minimizes from it', async () => {
    const user = userEvent.setup();
    render(<App />);
    const about = await screen.findByRole('dialog', { name: 'About Me' });
    const taskbar = screen.getByRole('list', { name: 'Open windows' });
    const button = within(taskbar).getByRole('button', { name: 'About Me' });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(button);
    expect(about).not.toBeVisible();
    await user.click(within(taskbar).getByRole('button', { name: /About Me/ }));
    expect(about).toBeVisible();
  });

  it('start menu opens, supports arrow keys and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    const start = screen.getByRole('button', { name: 'makOS' });
    await user.click(start);
    const menu = screen.getByRole('menu', { name: 'makOS start menu' });
    const items = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(start).toHaveFocus();
  });

  it('always shows a plain-text resume link', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Plain-text resume' })).toHaveAttribute('href', '/resume.txt');
  });
});
