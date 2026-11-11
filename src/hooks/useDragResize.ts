import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { AppId } from '../data/apps';
import { MIN_HEIGHT, MIN_WIDTH, useWindowStore, type Rect } from '../store/windows';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/** Pure geometry for a resize drag, exported for unit tests. */
export function resizeRect(start: Rect, dir: ResizeDirection, dx: number, dy: number): Rect {
  let { x, y, width, height } = start;
  if (dir.includes('e')) width = Math.max(MIN_WIDTH, start.width + dx);
  if (dir.includes('s')) height = Math.max(MIN_HEIGHT, start.height + dy);
  if (dir.includes('w')) {
    width = Math.max(MIN_WIDTH, start.width - dx);
    x = start.x + (start.width - width);
  }
  if (dir.includes('n')) {
    height = Math.max(MIN_HEIGHT, start.height - dy);
    y = start.y + (start.height - height);
  }
  return { x, y, width, height };
}

/**
 * Starts a pointer-captured gesture and coalesces pointermove events into one
 * update per animation frame, so dragging stays smooth even on slow machines.
 */
function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  cursorClass: string,
  onDelta: (dx: number, dy: number) => void,
) {
  const target = event.currentTarget;
  const startX = event.clientX;
  const startY = event.clientY;
  let frame = 0;
  let latest: PointerEvent | null = null;

  target.setPointerCapture?.(event.pointerId);
  document.body.classList.add('is-dragging', cursorClass);

  const flush = () => {
    frame = 0;
    if (latest) onDelta(latest.clientX - startX, latest.clientY - startY);
  };
  const onMove = (e: PointerEvent) => {
    latest = e;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const onEnd = () => {
    if (frame) cancelAnimationFrame(frame);
    flush();
    document.body.classList.remove('is-dragging', cursorClass);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onEnd);
    target.removeEventListener('pointercancel', onEnd);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onEnd);
  target.addEventListener('pointercancel', onEnd);
}

export function useDragResize(id: AppId) {
  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest('button')) return;
      const win = useWindowStore.getState().windows[id];
      if (!win || win.maximized) return;
      event.preventDefault();
      const { x, y } = win;
      trackPointer(event, 'cursor-move', (dx, dy) => useWindowStore.getState().move(id, x + dx, y + dy));
    },
    [id],
  );

  const startResize = useCallback(
    (dir: ResizeDirection) => (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const win = useWindowStore.getState().windows[id];
      if (!win || win.maximized) return;
      event.preventDefault();
      event.stopPropagation();
      useWindowStore.getState().focus(id);
      const start: Rect = { x: win.x, y: win.y, width: win.width, height: win.height };
      trackPointer(event, `cursor-${dir}`, (dx, dy) =>
        useWindowStore.getState().resize(id, resizeRect(start, dir, dx, dy)),
      );
    },
    [id],
  );

  return { startDrag, startResize };
}
