/** Bug Sweeper game logic: pure functions over an immutable board, so it's easy to test. */

export type Level = 'junior' | 'mid' | 'senior';

export const LEVELS: Record<Level, { label: string; width: number; height: number; bugs: number }> = {
  junior: { label: 'Junior', width: 9, height: 9, bugs: 10 },
  mid: { label: 'Mid-level', width: 12, height: 12, bugs: 24 },
  senior: { label: 'Senior', width: 16, height: 12, bugs: 36 },
};

export interface Cell {
  bug: boolean;
  open: boolean;
  flag: boolean;
  /** Bugs in the 8 neighbouring cells. */
  near: number;
}

export type Status = 'ready' | 'playing' | 'won' | 'lost';

export interface Board {
  width: number;
  height: number;
  bugs: number;
  cells: Cell[];
  status: Status;
  /** The cell that was hit, when lost. */
  hit: number | null;
}

export function newBoard(level: Level): Board {
  const { width, height, bugs } = LEVELS[level];
  const cells = Array.from({ length: width * height }, () => ({ bug: false, open: false, flag: false, near: 0 }));
  return { width, height, bugs, cells, status: 'ready', hit: null };
}

export function neighbours(board: Pick<Board, 'width' | 'height'>, index: number): number[] {
  const x = index % board.width;
  const y = Math.floor(index / board.width);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < board.width && ny < board.height) out.push(ny * board.width + nx);
    }
  }
  return out;
}

/** Places bugs anywhere except the first-clicked cell and its neighbours, so the first click is always safe. */
export function plantBugs(board: Board, safe: number, random: () => number = Math.random): Board {
  const avoid = new Set([safe, ...neighbours(board, safe)]);
  const candidates = board.cells.map((_, i) => i).filter((i) => !avoid.has(i));
  const cells = board.cells.map((c) => ({ ...c }));
  for (let placed = 0; placed < board.bugs && candidates.length; placed++) {
    const pick = Math.floor(random() * candidates.length);
    cells[candidates[pick]!]!.bug = true;
    candidates.splice(pick, 1);
  }
  cells.forEach((c, i) => {
    c.near = neighbours(board, i).filter((j) => cells[j]!.bug).length;
  });
  return { ...board, cells, status: 'playing' };
}

/** Opens a cell (flood-filling empty areas). Hitting a bug loses; opening every safe cell wins. */
export function reveal(board: Board, index: number, random?: () => number): Board {
  if (board.status === 'won' || board.status === 'lost') return board;
  let next = board.status === 'ready' ? plantBugs(board, index, random) : board;
  const target = next.cells[index];
  if (!target || target.open || target.flag) return next;

  const cells = next.cells.map((c) => ({ ...c }));
  if (cells[index]!.bug) {
    cells.forEach((c) => {
      if (c.bug) c.open = true;
    });
    return { ...next, cells, status: 'lost', hit: index };
  }
  const stack = [index];
  while (stack.length) {
    const i = stack.pop()!;
    const c = cells[i]!;
    if (c.open || c.flag) continue;
    c.open = true;
    if (c.near === 0) for (const j of neighbours(next, i)) if (!cells[j]!.open) stack.push(j);
  }
  next = { ...next, cells };
  const safeLeft = cells.some((c) => !c.bug && !c.open);
  if (!safeLeft) {
    return { ...next, status: 'won', cells: cells.map((c) => (c.bug ? { ...c, flag: true } : c)) };
  }
  return next;
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.status === 'won' || board.status === 'lost') return board;
  const cell = board.cells[index];
  if (!cell || cell.open) return board;
  const cells = board.cells.slice();
  cells[index] = { ...cell, flag: !cell.flag };
  return { ...board, cells };
}

export function flagsPlaced(board: Board) {
  return board.cells.filter((c) => c.flag).length;
}
