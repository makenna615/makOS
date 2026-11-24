import { describe, expect, it } from 'vitest';
import type { AppId } from '../data/apps';
import { LAYOUT_KEY, gridFor, iconsInRect, layoutIcons, moveIcons, readLayout, readingOrder } from './desktopLayout';

const IDS: AppId[] = ['about', 'resume', 'projects', 'contact'];
const GRID = { cols: 4, rows: 3 };

describe('desktop icon layout', () => {
  it('fills columns top to bottom by default', () => {
    const layout = layoutIcons(IDS, {}, GRID);
    expect(layout.about).toEqual({ col: 0, row: 0 });
    expect(layout.projects).toEqual({ col: 0, row: 2 });
    expect(layout.contact).toEqual({ col: 1, row: 0 });
    expect(readingOrder(layout)).toEqual(IDS);
  });

  it('keeps saved spots that fit and re-places the rest', () => {
    const layout = layoutIcons(IDS, { contact: { col: 3, row: 2 }, resume: { col: 9, row: 9 } }, GRID);
    expect(layout.contact).toEqual({ col: 3, row: 2 });
    expect(layout.resume).toEqual({ col: 0, row: 1 }); // off-grid save ignored
  });

  it('swaps a single icon dropped on another, and refuses blocked group moves', () => {
    const layout = layoutIcons(IDS, {}, GRID);
    const swapped = moveIcons(layout, ['about'], 0, 1, GRID)!;
    expect(swapped.about).toEqual({ col: 0, row: 1 });
    expect(swapped.resume).toEqual({ col: 0, row: 0 });
    expect(moveIcons(layout, ['about', 'resume'], 0, 1, GRID)).toBeNull(); // projects is in the way
    expect(moveIcons(layout, ['about', 'resume'], 2, 0, GRID)!.resume).toEqual({ col: 2, row: 1 });
    expect(moveIcons(layout, ['about'], -1, 0, GRID)).toBeNull(); // off the grid
  });

  it('finds icons under a selection box', () => {
    const layout = layoutIcons(IDS, {}, GRID);
    expect(iconsInRect(layout, { left: 0, top: 0, right: 50, bottom: 150 })).toEqual(['about', 'resume']);
    expect(iconsInRect(layout, { left: 400, top: 400, right: 410, bottom: 410 })).toEqual([]);
  });

  it('ignores tampered saved layouts', () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ about: [1, 2], resume: ['x', 1], __proto__: [0, 0], contact: [-1, 0] }));
    expect(readLayout(IDS)).toEqual({ about: { col: 1, row: 2 } });
    localStorage.setItem(LAYOUT_KEY, 'not json');
    expect(readLayout(IDS)).toEqual({});
  });

  it('sizes the grid to the desktop', () => {
    expect(gridFor(1366, 780)).toEqual({ cols: 13, rows: 7 });
    expect(gridFor(10, 10)).toEqual({ cols: 1, rows: 1 });
  });
});
