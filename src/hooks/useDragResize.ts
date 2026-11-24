import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { AppId } from '../data/apps';
import { MIN_HEIGHT, MIN_WIDTH, useWindowStore, type Rect, type SnapZone } from '../store/windows';

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
  onDelta: (dx: number, dy: number, pointer: PointerEvent) => void,
  onDone?: (pointer: PointerEvent | null) => void,
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
    if (latest) onDelta(latest.clientX - startX, latest.clientY - startY, latest);
  };
  const onMove = (e: PointerEvent) => {
    latest = e;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const onEnd = () => {
    if (frame) cancelAnimationFrame(frame);
    flush();
    onDone?.(latest);
    document.body.classList.remove('is-dragging', cursorClass);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onEnd);
    target.removeEventListener('pointercancel', onEnd);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onEnd);
  target.addEventListener('pointercancel', onEnd);
}

/** How far (px) a snapped or maximized window must be dragged before it detaches. */
const DETACH_PX = 6;
/** How close (px) to a screen edge the pointer must be to snap. */
export const SNAP_EDGE = 6;

/** The snap zone under the pointer (desktop coordinates): left or right edge, or the top edge to maximize. */
export function snapZoneAt(x: number, y: number, width: number): SnapZone | null {
  if (x <= SNAP_EDGE) return 'left';
  if (x >= width - SNAP_EDGE) return 'right';
  if (y <= SNAP_EDGE) return 'max';
  return null;
}

export function useDragResize(id: AppId) {
  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest('button')) return;
      const store = useWindowStore.getState();
      const win = store.windows[id];
      if (!win) return;
      event.preventDefault();
      const desktop = (event.currentTarget.closest('.desktop') as HTMLElement | null)?.getBoundingClientRect();
      const left = desktop?.left ?? 0;
      const top = desktop?.top ?? 0;
      let origin = { x: win.x, y: win.y };
      // A snapped or maximized window stays put until the pointer really moves, then pops back to its
      // normal size under the pointer, like a desktop OS.
      let detached = !win.snapped && !win.maximized;
      let zone: SnapZone | null = null;
      trackPointer(
        event,
        'cursor-move',
        (dx, dy, pointer) => {
          const s = useWindowStore.getState();
          if (!detached) {
            if (Math.hypot(dx, dy) < DETACH_PX) return;
            const pos = s.unsnapForDrag(id, pointer.clientX - left);
            if (!pos) return;
            detached = true;
            origin = { x: pos.x - dx, y: pos.y - dy };
          }
          s.move(id, origin.x + dx, origin.y + dy);
          zone = snapZoneAt(pointer.clientX - left, pointer.clientY - top, s.viewport.width);
          s.setSnapPreview(zone);
        },
        () => {
          const s = useWindowStore.getState();
          s.setSnapPreview(null);
          if (detached && zone) s.snap(id, zone);
        },
      );
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
