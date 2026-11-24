import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { APPS, DESKTOP_APPS, type AppId } from '../data/apps';
import { openApp } from '../store/actions';
import {
  CELL_H,
  CELL_W,
  GRID_LEFT,
  GRID_TOP,
  gridFor,
  iconsInRect,
  layoutIcons,
  moveIcons,
  readLayout,
  readingOrder,
  saveLayout,
  type GridSize,
  type Layout,
} from './desktopLayout';
import { Icon } from './Icons';

/** How far (px) the pointer must move before a press on an icon becomes a drag. */
const DRAG_START_PX = 5;

interface Lasso {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Desktop icons on a grid, like a desktop OS:
 * - Click selects, Ctrl/⌘-click adds or removes, dragging on empty desktop draws a selection box.
 * - Drag icons to rearrange them (a group moves together; one icon dropped on another swaps with it).
 *   The arrangement is remembered. Ctrl+Arrow moves the focused icon from the keyboard.
 * - One Tab stop for the group (roving tabindex); arrow keys move in reading order; Enter or
 *   double-click opens; Ctrl+A selects all; Escape clears the selection.
 */
export function Desktop() {
  const listRef = useRef<HTMLUListElement>(null);
  const refs = useRef(new Map<AppId, HTMLButtonElement>());
  const [grid, setGrid] = useState<GridSize>(() =>
    gridFor(typeof window === 'undefined' ? 1280 : window.innerWidth, typeof window === 'undefined' ? 760 : window.innerHeight - 40),
  );
  const [saved, setSaved] = useState<Layout>(() => readLayout(DESKTOP_APPS));
  const [focusId, setFocusId] = useState<AppId>(DESKTOP_APPS[0]!);
  const [selection, setSelection] = useState<AppId[]>([]);
  const [drag, setDrag] = useState<{ ids: AppId[]; dx: number; dy: number } | null>(null);
  const [lasso, setLasso] = useState<Lasso | null>(null);
  const suppressClick = useRef(false);
  const pressing = useRef(false);

  const layout = useMemo(() => layoutIcons(DESKTOP_APPS, saved, grid), [saved, grid]);
  const order = useMemo(() => readingOrder(layout), [layout]);

  // Fit the grid to the desktop's size.
  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const next = gridFor(el.clientWidth, el.clientHeight);
      setGrid((g) => (g.cols === next.cols && g.rows === next.rows ? g : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A press anywhere other than an icon clears the selection, like a real desktop.
  // (Listening for pointerdown rather than blur also covers Safari, which doesn't focus buttons on click.)
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('.desktop-icon')) return;
      if (target === listRef.current && (event.ctrlKey || event.metaKey || event.shiftKey)) return; // adding with a box
      setSelection([]);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const commit = (next: Record<AppId, { col: number; row: number }> | null) => {
    if (!next) return;
    setSaved(next);
    saveLayout(next);
  };

  // Keyboard focus leaving the icons (Tab, or a window opening) clears the selection.
  const onBlur = (event: FocusEvent<HTMLUListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setSelection([]);
  };

  const focusIcon = (id: AppId) => {
    setFocusId(id);
    setSelection([id]);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: AppId) => {
    const index = order.indexOf(id);
    const ctrl = event.ctrlKey || event.metaKey;
    if (ctrl && event.key.startsWith('Arrow')) {
      event.preventDefault();
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (d) commit(moveIcons(layout, [id], d[0]!, d[1]!, grid));
      requestAnimationFrame(() => refs.current.get(id)?.focus());
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusIcon(order[(index + 1) % order.length]!);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusIcon(order[(index - 1 + order.length) % order.length]!);
        break;
      case 'Home':
        event.preventDefault();
        focusIcon(order[0]!);
        break;
      case 'End':
        event.preventDefault();
        focusIcon(order[order.length - 1]!);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        openApp(id, event.currentTarget);
        break;
      case 'Escape':
        if (selection.length) {
          event.stopPropagation();
          setSelection([]);
        }
        break;
      case 'a':
      case 'A':
        if (ctrl) {
          event.preventDefault();
          setSelection([...order]);
        }
        break;
    }
  };

  // Press on an icon: select it (or toggle with Ctrl/⌘), and turn into a drag if the pointer moves.
  const onIconPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: AppId) => {
    if (event.button !== 0) return;
    pressing.current = true;
    const toggle = event.ctrlKey || event.metaKey;
    let ids: AppId[];
    if (toggle) {
      const next = selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id];
      setSelection(next);
      ids = next.includes(id) ? next : [];
    } else {
      ids = selection.includes(id) ? selection : [id];
      if (!selection.includes(id)) setSelection([id]);
    }
    setFocusId(id);

    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!ids.length || (!dragging && Math.hypot(dx, dy) < DRAG_START_PX)) return;
      if (!dragging) {
        dragging = true;
        document.body.classList.add('is-dragging');
      }
      setDrag({ ids, dx, dy });
    };
    const onUp = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      pressing.current = false;
      if (!dragging) return;
      document.body.classList.remove('is-dragging');
      suppressClick.current = true; // the click that ends a drag isn't a selection click
      setDrag(null);
      commit(moveIcons(layout, ids, Math.round((e.clientX - startX) / CELL_W), Math.round((e.clientY - startY) / CELL_H), grid));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Press on empty desktop: draw a selection box (Ctrl/⌘/Shift adds to the current selection).
  const onListPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const list = event.currentTarget;
    const box = list.getBoundingClientRect();
    const base = event.ctrlKey || event.metaKey || event.shiftKey ? selection : [];
    const x0 = event.clientX - box.left;
    const y0 = event.clientY - box.top;
    list.setPointerCapture?.(event.pointerId);
    const onMove = (e: PointerEvent) => {
      const x1 = e.clientX - box.left;
      const y1 = e.clientY - box.top;
      setLasso({ x0, y0, x1, y1 });
      const hit = iconsInRect(layout, {
        left: Math.min(x0, x1),
        right: Math.max(x0, x1),
        top: Math.min(y0, y1),
        bottom: Math.max(y0, y1),
      });
      setSelection([...new Set([...base, ...hit])]);
    };
    const onUp = () => {
      list.removeEventListener('pointermove', onMove);
      list.removeEventListener('pointerup', onUp);
      list.removeEventListener('pointercancel', onUp);
      setLasso(null);
    };
    list.addEventListener('pointermove', onMove);
    list.addEventListener('pointerup', onUp);
    list.addEventListener('pointercancel', onUp);
  };

  return (
    <>
      {/* The pointer handler on the list is for drawing a selection box on empty desktop; keyboard users select with the icons' own keys. */}
      <ul
        ref={listRef}
        className="desktop-icons"
        aria-label="Desktop"
        onBlur={onBlur}
        onPointerDown={onListPointerDown}
      >
        {order.map((id) => {
          const app = APPS[id];
          const cell = layout[id];
          const moving = drag?.ids.includes(id);
          const selected = selection.includes(id);
          return (
            <li
              key={id}
              className={moving ? 'is-moving' : undefined}
              style={{
                left: GRID_LEFT + cell.col * CELL_W,
                top: GRID_TOP + cell.row * CELL_H,
                transform: moving ? `translate(${drag!.dx}px, ${drag!.dy}px)` : undefined,
              }}
            >
              <button
                type="button"
                ref={(el) => {
                  if (el) refs.current.set(id, el);
                  else refs.current.delete(id);
                }}
                className={`desktop-icon${selected ? ' is-selected' : ''}`}
                tabIndex={focusId === id ? 0 : -1}
                aria-describedby={`desc-${id}`}
                onPointerDown={(e) => onIconPointerDown(e, id)}
                onClick={() => {
                  if (suppressClick.current) suppressClick.current = false;
                }}
                onDoubleClick={(e) => openApp(id, e.currentTarget)}
                onFocus={() => {
                  setFocusId(id);
                  if (!pressing.current && !selection.includes(id)) setSelection([id]);
                }}
                onKeyDown={(e) => onKeyDown(e, id)}
              >
                <span className="desktop-icon-art">
                  <Icon name={app.icon} size={44} />
                </span>
                <span className="desktop-icon-label">{app.label}</span>
              </button>
              <span id={`desc-${id}`} className="visually-hidden">
                {app.description}. Press Enter to open, Ctrl+Arrow to move.
              </span>
            </li>
          );
        })}
      </ul>
      {lasso && (
        <div
          className="desktop-lasso"
          aria-hidden="true"
          style={{
            left: Math.min(lasso.x0, lasso.x1),
            top: Math.min(lasso.y0, lasso.y1),
            width: Math.abs(lasso.x1 - lasso.x0),
            height: Math.abs(lasso.y1 - lasso.y0),
          }}
        />
      )}
    </>
  );
}
