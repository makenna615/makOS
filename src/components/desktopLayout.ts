import type { AppId } from '../data/apps';

/** Desktop icon grid: every icon sits in a cell, like a desktop OS with "align to grid" on. */
export const CELL_W = 98;
export const CELL_H = 108;
export const GRID_LEFT = 8;
export const GRID_TOP = 12;
export const ICON_W = 90;
export const ICON_H = 102;

export interface Cell {
  col: number;
  row: number;
}
export type Layout = Partial<Record<AppId, Cell>>;
export interface GridSize {
  cols: number;
  rows: number;
}

export const LAYOUT_KEY = 'makos:desktop-layout';

const key = (c: Cell) => `${c.col},${c.row}`;
const inside = (c: Cell, grid: GridSize) => c.col >= 0 && c.row >= 0 && c.col < grid.cols && c.row < grid.rows;

/** How many cells fit in a desktop of this size (at least one of each). */
export function gridFor(width: number, height: number): GridSize {
  return {
    cols: Math.max(1, Math.floor((width - GRID_LEFT) / CELL_W)),
    rows: Math.max(1, Math.floor((height - GRID_TOP) / CELL_H)),
  };
}

/**
 * Places every icon: saved spots first (if they still fit and don't clash), then everything else in
 * the first free cells, top to bottom and then left to right (the default desktop order).
 */
export function layoutIcons(ids: readonly AppId[], saved: Layout, grid: GridSize): Record<AppId, Cell> {
  const taken = new Set<string>();
  const out = {} as Record<AppId, Cell>;
  for (const id of ids) {
    const cell = saved[id];
    if (cell && inside(cell, grid) && !taken.has(key(cell))) {
      out[id] = cell;
      taken.add(key(cell));
    }
  }
  let next = 0;
  for (const id of ids) {
    if (out[id]) continue;
    let cell: Cell;
    do {
      cell = { col: Math.floor(next / grid.rows), row: next % grid.rows };
      next++;
    } while (taken.has(key(cell)));
    out[id] = cell;
    taken.add(key(cell));
  }
  return out;
}

/**
 * Moves some icons by a number of cells. A single icon dropped on another swaps places with it;
 * a group only moves if every icon lands on a free cell inside the grid. Returns null if nothing moves.
 */
export function moveIcons(
  layout: Record<AppId, Cell>,
  moving: readonly AppId[],
  dCol: number,
  dRow: number,
  grid: GridSize,
): Record<AppId, Cell> | null {
  if ((!dCol && !dRow) || !moving.length) return null;
  const next = { ...layout };
  const targets = moving.map((id) => ({ id, from: layout[id], to: { col: layout[id].col + dCol, row: layout[id].row + dRow } }));
  if (targets.some((t) => !inside(t.to, grid))) return null;
  const movingSet = new Set(moving);
  const occupant = (cell: Cell) =>
    (Object.keys(layout) as AppId[]).find((id) => !movingSet.has(id) && key(layout[id]) === key(cell));

  if (moving.length === 1) {
    const [t] = targets;
    const other = occupant(t!.to);
    if (other) next[other] = t!.from;
    next[t!.id] = t!.to;
    return next;
  }
  if (targets.some((t) => occupant(t.to))) return null;
  for (const t of targets) next[t.id] = t.to;
  return next;
}

/** Icons in reading order: down each column, then the next column. */
export function readingOrder(layout: Record<AppId, Cell>): AppId[] {
  return (Object.keys(layout) as AppId[]).sort((a, b) => layout[a].col - layout[b].col || layout[a].row - layout[b].row);
}

/** Saved layout from storage. Anything that isn't a known icon with whole, non-negative cells is dropped. */
export function readLayout(ids: readonly AppId[]): Layout {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '{}');
    if (!raw || typeof raw !== 'object') return {};
    const out: Layout = {};
    for (const id of ids) {
      if (!Object.hasOwn(raw, id)) continue;
      const v = (raw as Record<string, unknown>)[id];
      if (Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n >= 0 && n < 100)) {
        out[id] = { col: v[0] as number, row: v[1] as number };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveLayout(layout: Record<AppId, Cell>) {
  try {
    const plain: Record<string, [number, number]> = {};
    for (const [id, c] of Object.entries(layout) as [AppId, Cell][]) plain[id] = [c.col, c.row];
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(plain));
  } catch {
    /* the arrangement just isn't remembered */
  }
}

/** Icons whose cell overlaps a rectangle (desktop coordinates), for drag-select. */
export function iconsInRect(
  layout: Record<AppId, Cell>,
  rect: { left: number; top: number; right: number; bottom: number },
): AppId[] {
  return (Object.keys(layout) as AppId[]).filter((id) => {
    const x = GRID_LEFT + layout[id].col * CELL_W;
    const y = GRID_TOP + layout[id].row * CELL_H;
    return x < rect.right && x + ICON_W > rect.left && y < rect.bottom && y + ICON_H > rect.top;
  });
}
