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
    await expect(page.locator('.weather-temp')).toHaveText('42°F'); // check the widget in its loaded state
    await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Resume' }).dblclick();
    await page.getByRole('button', { name: 'makOS' }).click();
    // The start menu fades in from opacity 0; checking contrast mid-fade gives false color-contrast failures.
    await settled(page.getByRole('menu', { name: 'makOS start menu' }));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
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
