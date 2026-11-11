import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('highlights a clicked desktop icon and clears it when clicking elsewhere', async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole('list', { name: 'Desktop' });
    const resumeIcon = within(desktop).getByRole('button', { name: 'Resume' });
    expect(desktop.querySelector('.is-selected')).toBeNull(); // nothing highlighted on load

    await user.click(resumeIcon);
    expect(resumeIcon).toHaveClass('is-selected');

    await user.click(screen.getByRole('main', { name: 'makOS desktop' }));
    expect(resumeIcon).not.toHaveClass('is-selected');
    expect(resumeIcon).toHaveAttribute('tabindex', '0'); // still the roving tab stop
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

  it('shows Fargo weather in the taskbar tray', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ current: { temperature_2m: 41.6, weather_code: 71, is_day: 1 } })),
    );
    render(<App />);
    const taskbar = screen.getByRole('navigation', { name: 'Taskbar' });
    expect(await within(taskbar).findByText('42°F')).toBeInTheDocument();
    expect(within(taskbar).getByText('Fargo, ND')).toBeInTheDocument();
    expect(within(taskbar).getByText('Snow,')).toBeInTheDocument(); // screen-reader description
  });

  it('still shows the place name when the weather service is unavailable', async () => {
    render(<App />); // fetch rejects by default in tests
    const taskbar = screen.getByRole('navigation', { name: 'Taskbar' });
    expect(within(taskbar).getByText('Fargo, ND')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(within(taskbar).queryByText(/°F/)).not.toBeInTheDocument();
  });

  it('always shows a resume shortcut in the taskbar tray', () => {
    render(<App />);
    const taskbar = screen.getByRole('navigation', { name: 'Taskbar' });
    const link = within(taskbar).getByRole('link', { name: 'Resume (PDF)' });
    expect(link).toHaveAttribute('href', '/resume.pdf');
    expect(link).toHaveAttribute('title', 'Resume (PDF)');
  });
});
