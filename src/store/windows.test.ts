import { beforeEach, describe, expect, it } from 'vitest';
import { GRAB_MARGIN, MIN_HEIGHT, MIN_WIDTH, OPEN_TOP, SNAP_TOP, getFocusedId, useWindowStore } from './windows';

const store = () => useWindowStore.getState();

describe('window store', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {}, order: [], viewport: { width: 1280, height: 760 } });
  });

  it('opens a window on top and focuses it', () => {
    store().open('about');
    store().open('resume');
    expect(store().order).toEqual(['about', 'resume']);
    expect(getFocusedId(store())).toBe('resume');
  });

  it('re-opening an existing window brings it to the front instead of duplicating it', () => {
    store().open('about');
    store().open('resume');
    store().open('about');
    expect(store().order).toEqual(['resume', 'about']);
    expect(Object.keys(store().windows)).toHaveLength(2);
  });

  it('cascades new windows so they do not stack exactly on top of each other', () => {
    store().open('fourth-down');
    store().open('perfumes');
    const a = store().windows['fourth-down']!;
    const b = store().windows.perfumes!;
    expect(b.x).not.toBe(a.x);
    expect(b.y).not.toBe(a.y);
  });

  it('opens new windows below the theme switch, fitting short screens', () => {
    store().open('about');
    expect(store().windows.about!.y).toBeGreaterThanOrEqual(OPEN_TOP);

    store().closeAll();
    store().setViewport({ width: 1280, height: 560 });
    store().open('resume');
    const win = store().windows.resume!;
    expect(win.y).toBeGreaterThanOrEqual(OPEN_TOP);
    expect(win.y + win.height).toBeLessThanOrEqual(560);
  });

  it('closes a window and focus falls to the next one down', () => {
    store().open('about');
    store().open('resume');
    store().close('resume');
    expect(store().windows.resume).toBeUndefined();
    expect(getFocusedId(store())).toBe('about');
  });

  it('minimized windows are skipped when working out focus', () => {
    store().open('about');
    store().open('resume');
    store().minimize('resume');
    expect(getFocusedId(store())).toBe('about');
  });

  it('taskbar toggle minimizes the focused window and restores a hidden one', () => {
    store().open('about');
    store().toggleFromTaskbar('about');
    expect(store().windows.about!.minimized).toBe(true);
    store().toggleFromTaskbar('about');
    expect(store().windows.about!.minimized).toBe(false);
    expect(getFocusedId(store())).toBe('about');
  });

  it('taskbar click on a window behind another brings it forward without minimizing', () => {
    store().open('about');
    store().open('resume');
    store().toggleFromTaskbar('about');
    expect(store().windows.about!.minimized).toBe(false);
    expect(getFocusedId(store())).toBe('about');
  });

  it('maximize remembers the previous geometry and restores it', () => {
    store().open('about');
    store().move('about', 100, 120);
    store().toggleMaximize('about');
    expect(store().windows.about!.maximized).toBe(true);
    store().toggleMaximize('about');
    expect(store().windows.about).toMatchObject({ maximized: false, x: 100, y: 120 });
  });

  it('ignores moves while maximized', () => {
    store().open('about');
    store().toggleMaximize('about');
    const before = store().windows.about!;
    store().move('about', 5, 5);
    expect(store().windows.about!.x).toBe(before.x);
  });

  it('keeps part of the title bar on screen when dragged too far', () => {
    store().open('about');
    const { width } = store().windows.about!;
    store().move('about', -5000, -200);
    expect(store().windows.about).toMatchObject({ x: GRAB_MARGIN - width, y: 0 });
    store().move('about', 99999, 99999);
    const win = store().windows.about!;
    expect(win.x).toBe(1280 - GRAB_MARGIN);
    expect(win.y).toBeLessThan(760);
  });

  it('enforces a minimum size', () => {
    store().open('about');
    store().resize('about', { x: 10, y: 10, width: 20, height: 20 });
    expect(store().windows.about).toMatchObject({ width: MIN_WIDTH, height: MIN_HEIGHT });
  });

  it('pulls windows back on screen when the viewport shrinks', () => {
    store().open('about');
    store().move('about', 1100, 600);
    store().setViewport({ width: 800, height: 500 });
    const win = store().windows.about!;
    expect(win.x).toBeLessThanOrEqual(800 - GRAB_MARGIN);
    expect(win.y).toBeLessThan(500);
  });
});

describe('window snapping', () => {
  const store = () => useWindowStore.getState();
  beforeEach(() => store().setViewport({ width: 1280, height: 760 }));

  it('snaps to the left or right half and remembers the normal size', () => {
    store().open('about');
    const before = { ...store().windows.about! };
    store().snap('about', 'left');
    expect(store().windows.about).toMatchObject({ x: 0, y: SNAP_TOP, width: 640, height: 760 - SNAP_TOP, snapped: 'left' });
    store().snap('about', 'right');
    expect(store().windows.about).toMatchObject({ x: 640, width: 640, snapped: 'right' });
    expect(store().windows.about!.restoreRect).toEqual({ x: before.x, y: before.y, width: before.width, height: before.height });
  });

  it('dragging a snapped window restores its normal size under the pointer', () => {
    store().open('about');
    const { width, height } = store().windows.about!;
    store().snap('about', 'left');
    const pos = store().unsnapForDrag('about', 320); // pointer halfway along the title bar
    const win = store().windows.about!;
    expect(win).toMatchObject({ width, height, snapped: null });
    expect(pos!.x).toBe(Math.round(320 - width / 2));
  });

  it('stays snapped when the screen resizes, and unsnaps when resized or moved', () => {
    store().open('about');
    store().snap('about', 'right');
    store().setViewport({ width: 1000, height: 600 });
    expect(store().windows.about).toMatchObject({ x: 500, width: 500, height: 600 - SNAP_TOP });
    store().resize('about', { x: 500, y: SNAP_TOP, width: 420, height: 500 });
    expect(store().windows.about!.snapped).toBeNull();
  });

  it('maximizing a snapped window restores to the size from before it was snapped', () => {
    store().open('about');
    const { width } = store().windows.about!;
    store().snap('about', 'left');
    store().snap('about', 'max');
    expect(store().windows.about!.maximized).toBe(true);
    store().toggleMaximize('about');
    expect(store().windows.about).toMatchObject({ maximized: false, snapped: null, width });
  });
});

describe('snap zones', () => {
  it('finds the edge under the pointer', async () => {
    const { snapZoneAt } = await import('../hooks/useDragResize');
    expect(snapZoneAt(2, 300, 1280)).toBe('left');
    expect(snapZoneAt(1278, 300, 1280)).toBe('right');
    expect(snapZoneAt(600, 0, 1280)).toBe('max');
    expect(snapZoneAt(600, 300, 1280)).toBeNull();
  });
});
