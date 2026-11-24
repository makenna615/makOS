import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

/** Windows play a short scale-in animation when they open; measure geometry only once it has finished. */
async function settled(locator: Locator) {
  await locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  return locator;
}

test.beforeEach(async ({ page }) => {
  // Serve canned weather so tests never depend on the real Open-Meteo service.
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { current: { temperature_2m: 41.6, weather_code: 2, is_day: 1 } } }),
  );
  await page.goto('/');
  await page.keyboard.press('Space'); // skip the boot screen
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only');

  test('About opens on load and windows can be dragged', async ({ page }) => {
    const about = page.getByRole('dialog', { name: 'About Me' });
    await expect(about).toBeVisible();
    await settled(about);

    const before = await about.boundingBox();
    const bar = about.locator('.titlebar');
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + 120, box.y + 15);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 95, { steps: 6 });
    await page.mouse.up();
    const after = await about.boundingBox();
    expect(Math.round(after!.x - before!.x)).toBe(-100);
    expect(Math.round(after!.y - before!.y)).toBe(80);
  });

  test('windows resize from the corner', async ({ page }) => {
    const about = page.getByRole('dialog', { name: 'About Me' });
    await expect(about).toBeVisible();
    await settled(about);
    const before = (await about.boundingBox())!;
    const handle = (await about.locator('.resize-se').boundingBox())!;
    await page.mouse.move(handle.x + 5, handle.y + 5);
    await page.mouse.down();
    await page.mouse.move(handle.x + 85, handle.y - 55, { steps: 6 });
    await page.mouse.up();
    const after = (await about.boundingBox())!;
    expect(Math.round(after.width - before.width)).toBe(80);
    expect(Math.round(after.height - before.height)).toBe(-60);
  });

  test('double-click opens a project, tabs work, close returns focus', async ({ page }) => {
    const icon = page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Fourth Down' });
    await icon.dblclick();
    const win = page.getByRole('dialog', { name: 'Fourth Down' });
    await expect(win).toBeVisible();
    await win.getByRole('tab', { name: 'Features' }).click();
    await expect(win.getByRole('tabpanel', { name: 'Features' })).toBeVisible();
    await page.getByRole('button', { name: 'Close Fourth Down' }).click();
    await expect(win).toHaveCount(0);
    await expect(icon).toBeFocused();
  });

  test('project windows have a screenshot gallery with working images', async ({ page }) => {
    await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Memories into Perfumes' }).dblclick();
    const win = page.getByRole('dialog', { name: 'Memories into Perfumes' });
    await win.getByRole('tab', { name: 'Screenshots' }).click();
    const panel = win.getByRole('tabpanel', { name: 'Screenshots' });
    const links = panel.getByRole('link');
    await expect(links).toHaveCount(5);
    await expect(links.first()).toHaveAttribute('href', '/projects/perfumes/collection.jpg');
    // Every thumbnail actually loads (no broken images).
    await expect
      .poll(() => panel.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)))
      .toBe(true);
    const results = await new AxeBuilder({ page }).include('#window-perfumes').analyze();
    expect(results.violations).toEqual([]);
  });

  test('shows Fargo weather in the taskbar tray', async ({ page }) => {
    const weather = page.getByRole('navigation', { name: 'Taskbar' }).locator('.weather');
    await expect(weather).toContainText('Fargo, ND');
    await expect(weather).toContainText('42°F');
    await expect(weather).toHaveAttribute('title', /Partly cloudy, 42°F in Fargo, ND/);
  });

  test('a phone turned sideways gets the phone launcher, not the desktop', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByRole('list', { name: 'Apps' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Taskbar' })).toHaveCount(0);
  });

  test('has no detectable accessibility violations', async ({ page }) => {
    // Check the widget in its loaded state. Generous timeout: on CI the animated wallpaper is rendered in
    // software alongside other parallel tests, which can slow the first fetch.
    await expect(page.locator('.weather-temp')).toHaveText('42°F', { timeout: 15_000 });
    await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Resume' }).dblclick();
    await page.getByRole('button', { name: 'makOS' }).click();
    // The start menu fades in from opacity 0; checking contrast mid-fade gives false color-contrast failures.
    await settled(page.getByRole('menu', { name: 'makOS start menu' }));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('themes', () => {
  for (const theme of ['Modern', 'Future'] as const) {
    test(`switches to ${theme}, remembers it, and has no accessibility violations`, async ({ page, isMobile }) => {
      await page.getByRole('radio', { name: theme }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());
      await expect(page.getByRole('radio', { name: theme })).toBeChecked();
      await expect(page.locator('.theme-warp')).toHaveCount(0); // transition finished

      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());

      if (!isMobile) {
        // Everything still works in the new skin: open an app from the desktop and the start menu.
        await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Resume' }).dblclick();
        await expect(page.getByRole('dialog', { name: /Resume/ })).toBeVisible();
        await page.getByRole('button', { name: 'makOS' }).click();
        await settled(page.getByRole('menu', { name: 'makOS start menu' }));
      }
      await expect(page.locator('.wallpaper.is-ready')).toHaveCount(1);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('arrow keys move the theme switch', async ({ page }) => {
    await page.getByRole('radio', { name: 'Retro' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Modern' })).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'modern');
  });
});

test.describe('games', () => {
  test('Games folder opens Bug Sweeper and Stackdle, with no accessibility violations', async ({ page, isMobile }) => {
    // Two games and two scans: CI machines draw the animated wallpaper in software, so allow extra time.
    test.slow();
    // On desktop, scan just the game's window (the whole desktop is scanned by the accessibility tests above).
    const scan = () => (isMobile ? new AxeBuilder({ page }) : new AxeBuilder({ page }).include('.window.is-focused')).analyze();
    if (isMobile) await page.getByRole('button', { name: 'Games', exact: true }).click();
    else await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Games', exact: true }).dblclick();

    await page.getByRole('button', { name: /Bug Sweeper/ }).click();
    const cells = page.getByRole('group', { name: /Codebase/ }).getByRole('button');
    await expect(cells).toHaveCount(81);
    await cells.nth(40).click();
    await expect(page.getByText(/FATAL/)).toHaveCount(0); // the first click is always safe
    expect((await scan()).violations).toEqual([]);

    if (isMobile) await page.getByRole('button', { name: 'Back' }).click();
    else await page.getByRole('button', { name: 'Close Bug Sweeper' }).click(); // it sits on top of the Games folder
    await page.getByRole('button', { name: /Stackdle/ }).click();
    const keys = page.getByRole('group', { name: 'On-screen keyboard' });
    for (const ch of 'ZZZZZ') await keys.getByRole('button', { name: ch, exact: true }).click();
    await keys.getByRole('button', { name: 'Enter' }).click();
    await expect(page.getByRole('list', { name: 'Clues' })).toContainText('Category');
    expect((await scan()).violations).toEqual([]);
  });
});

test.describe('terminal', () => {
  test('answers commands and has no accessibility violations', async ({ page, isMobile }) => {
    if (isMobile) await page.getByRole('button', { name: 'Terminal', exact: true }).click();
    else await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Terminal', exact: true }).dblclick();
    await page.getByRole('group', { name: 'Quick commands' }).getByRole('button', { name: 'whoami' }).click();
    await expect(page.getByRole('log', { name: 'Terminal output' })).toContainText('Makenna Peters');
    await page.getByLabel(/Type a command/).fill('theme modern');
    await page.getByLabel(/Type a command/).press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'modern');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});

test.describe('desktop features', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only');

  test('dragging a window to the left edge snaps it to half the screen', async ({ page }) => {
    const about = page.getByRole('dialog', { name: 'About Me' });
    await settled(about);
    const bar = (await about.locator('.titlebar').boundingBox())!;
    await page.mouse.move(bar.x + 120, bar.y + 15);
    await page.mouse.down();
    await page.mouse.move(300, 300, { steps: 5 });
    await page.mouse.move(1, 300, { steps: 5 });
    await expect(page.locator('.snap-preview.is-left')).toBeVisible();
    await page.mouse.up();
    const box = (await about.boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(683);
  });

  test('desktop icons can be dragged to a new spot and box-selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Close About Me' }).click();
    const contact = page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Contact', exact: true });
    const before = (await contact.boundingBox())!;
    await page.mouse.move(before.x + 40, before.y + 30);
    await page.mouse.down();
    await page.mouse.move(before.x + 340, before.y + 30, { steps: 8 });
    await page.mouse.up();
    expect(Math.round((await contact.boundingBox())!.x - before.x)).toBe(294);

    await page.mouse.move(130, 10);
    await page.mouse.down();
    await page.mouse.move(20, 260, { steps: 6 });
    await page.mouse.up();
    expect(await page.locator('.desktop-icon.is-selected').count()).toBeGreaterThanOrEqual(2);
  });

  test('Ctrl+K search opens an app, with no accessibility violations', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'About Me' })).toBeVisible(); // desktop is up and listening
    await page.keyboard.press('Control+KeyK');
    await page.getByRole('combobox', { name: /Search apps/ }).fill('term');
    expect((await new AxeBuilder({ page }).include('.search-panel').analyze()).violations).toEqual([]);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible();
  });
});

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only');

  test('shows the launcher and opens apps as sheets', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Makenna Peters' })).toBeVisible();
    await expect(page.locator('.mobile-status .weather')).toContainText('42°F');
    await page.getByRole('button', { name: 'About Me' }).click();
    await expect(page.getByRole('heading', { name: 'About Me' })).toBeFocused();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('button', { name: 'About Me' })).toBeFocused();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
