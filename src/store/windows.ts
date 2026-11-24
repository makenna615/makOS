import { create } from 'zustand';
import { APPS, type AppId } from '../data/apps';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState extends Rect {
  id: AppId;
  minimized: boolean;
  maximized: boolean;
  /** Geometry to restore when un-maximizing or un-snapping. */
  restoreRect: Rect | null;
  /** Snapped to fill the left or right half of the screen (dragged to that edge). */
  snapped: SnapSide | null;
}

export type SnapSide = 'left' | 'right';
/** Where a dragged window would land if released now: a half of the screen, or maximized. */
export type SnapZone = SnapSide | 'max';

export interface Viewport {
  width: number;
  /** Usable height (screen minus taskbar). */
  height: number;
}

export interface WindowStore {
  windows: Partial<Record<AppId, WindowState>>;
  /** Stacking order, bottom → top. The last visible entry is the focused window. */
  order: AppId[];
  viewport: Viewport;

  open: (id: AppId) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  /** Taskbar behaviour: focus if hidden or behind, minimize if already focused. */
  toggleFromTaskbar: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, rect: Rect) => void;
  setViewport: (viewport: Viewport) => void;
  closeAll: () => void;

  /** Shown while dragging a window to a screen edge. */
  snapPreview: SnapZone | null;
  setSnapPreview: (zone: SnapZone | null) => void;
  /** Snap a window to half the screen, or maximize it. */
  snap: (id: AppId, zone: SnapZone) => void;
  /**
   * Starting to drag a snapped or maximized window restores its normal size under the pointer
   * (like a desktop OS). pointerX is in desktop coordinates. Returns the new position.
   */
  unsnapForDrag: (id: AppId, pointerX: number) => { x: number; y: number } | null;
}

/** Snapped windows start just below the theme switch, so their title-bar buttons are never under it. */
export const SNAP_TOP = 56;

/** The rectangle a window takes when snapped to one side. */
export function snapRect(side: SnapSide, viewport: Viewport): Rect {
  const width = Math.max(MIN_WIDTH, Math.floor(viewport.width / 2));
  const top = viewport.height - SNAP_TOP >= MIN_HEIGHT ? SNAP_TOP : 0;
  return { x: side === 'left' ? 0 : viewport.width - width, y: top, width, height: viewport.height - top };
}

export const MIN_WIDTH = 280;
export const MIN_HEIGHT = 180;
/** How much of a title bar must stay on screen so a window can always be grabbed. */
export const GRAB_MARGIN = 80;
export const TITLE_BAR_HEIGHT = 30;
const CASCADE_STEP = 28;
/** New windows open below the theme switch at the top middle of the desktop (10px + ~38px tall, plus a gap). */
export const OPEN_TOP = 64;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Keep a window grabbable: at least GRAB_MARGIN px of its title bar stays inside the viewport. */
export function clampPosition(x: number, y: number, width: number, viewport: Viewport) {
  return {
    x: clamp(x, GRAB_MARGIN - width, viewport.width - GRAB_MARGIN),
    y: clamp(y, 0, viewport.height - TITLE_BAR_HEIGHT),
  };
}

/** The top-most window that isn't minimized, or null. */
export function getFocusedId(state: Pick<WindowStore, 'windows' | 'order'>): AppId | null {
  for (let i = state.order.length - 1; i >= 0; i--) {
    const id = state.order[i]!;
    if (!state.windows[id]?.minimized) return id;
  }
  return null;
}

function initialRect(id: AppId, openCount: number, viewport: Viewport): Rect {
  const app = APPS[id];
  const width = Math.min(app.defaultSize.width, viewport.width - 24);
  // Shrink to fit between the theme switch and the taskbar on short screens.
  const height = Math.max(MIN_HEIGHT, Math.min(app.defaultSize.height, viewport.height - OPEN_TOP - 8));
  const step = (openCount % 6) * CASCADE_STEP;
  const centerX = Math.round((viewport.width - width) / 2);
  const centerY = Math.round((viewport.height - height) / 3);
  // Top edge: never under the switch, unless the screen is too short for that to fit at all.
  const top = Math.max(8, Math.min(OPEN_TOP, viewport.height - height - 8));
  return {
    width,
    height,
    x: clamp(centerX + step - CASCADE_STEP, 8, viewport.width - width - 8),
    y: clamp(centerY + step - CASCADE_STEP, top, viewport.height - height - 8),
  };
}

const bringToFront = (order: AppId[], id: AppId) => [...order.filter((w) => w !== id), id];

const defaultViewport = (): Viewport =>
  typeof window === 'undefined'
    ? { width: 1280, height: 760 }
    : { width: window.innerWidth, height: window.innerHeight - 40 };

export const useWindowStore = create<WindowStore>()((set, get) => ({
  windows: {},
  order: [],
  viewport: defaultViewport(),

  open: (id) => {
    const { windows, order, viewport } = get();
    const existing = windows[id];
    if (existing) {
      set({ windows: { ...windows, [id]: { ...existing, minimized: false } }, order: bringToFront(order, id) });
      return;
    }
    const rect = initialRect(id, order.length, viewport);
    set({
      windows: { ...windows, [id]: { id, ...rect, minimized: false, maximized: false, restoreRect: null, snapped: null } },
      order: [...order, id],
    });
  },

  close: (id) => {
    const { windows, order } = get();
    if (!windows[id]) return;
    const next = { ...windows };
    delete next[id];
    set({ windows: next, order: order.filter((w) => w !== id) });
  },

  focus: (id) => {
    const { windows, order } = get();
    const win = windows[id];
    if (!win) return;
    if (order[order.length - 1] === id && !win.minimized) return;
    set({ windows: { ...windows, [id]: { ...win, minimized: false } }, order: bringToFront(order, id) });
  },

  minimize: (id) => {
    const { windows } = get();
    const win = windows[id];
    if (!win) return;
    set({ windows: { ...windows, [id]: { ...win, minimized: true } } });
  },

  toggleMaximize: (id) => {
    const { windows, order } = get();
    const win = windows[id];
    if (!win) return;
    // A snapped window remembers its size from before it was snapped; maximizing keeps that one.
    const before = win.snapped && win.restoreRect ? win.restoreRect : { x: win.x, y: win.y, width: win.width, height: win.height };
    const updated: WindowState = win.maximized
      ? { ...win, ...(win.restoreRect ?? {}), maximized: false, restoreRect: null, snapped: null }
      : { ...win, maximized: true, minimized: false, restoreRect: before, snapped: null };
    set({ windows: { ...windows, [id]: updated }, order: bringToFront(order, id) });
  },

  toggleFromTaskbar: (id) => {
    const state = get();
    if (getFocusedId(state) === id) state.minimize(id);
    else state.focus(id);
  },

  move: (id, x, y) => {
    const { windows, viewport } = get();
    const win = windows[id];
    if (!win || win.maximized) return;
    const pos = clampPosition(x, y, win.width, viewport);
    if (pos.x === win.x && pos.y === win.y) return;
    // Moving a snapped window (e.g. with Alt+Arrow) frees it from the edge at its current size.
    const unsnap = win.snapped ? { snapped: null, restoreRect: null } : {};
    set({ windows: { ...windows, [id]: { ...win, ...pos, ...unsnap } } });
  },

  resize: (id, rect) => {
    const { windows, viewport } = get();
    const win = windows[id];
    if (!win || win.maximized) return;
    const width = clamp(Math.round(rect.width), MIN_WIDTH, viewport.width);
    const height = clamp(Math.round(rect.height), MIN_HEIGHT, viewport.height);
    const pos = clampPosition(Math.round(rect.x), Math.round(rect.y), width, viewport);
    // Resizing a snapped window makes its new size the normal one.
    const unsnap = win.snapped ? { snapped: null, restoreRect: null } : {};
    set({ windows: { ...windows, [id]: { ...win, ...pos, width, height, ...unsnap } } });
  },

  setViewport: (viewport) => {
    const { windows } = get();
    const next: WindowStore['windows'] = {};
    for (const win of Object.values(windows)) {
      if (!win) continue;
      next[win.id] = win.snapped
        ? { ...win, ...snapRect(win.snapped, viewport) } // stay snapped to the new screen size
        : { ...win, ...clampPosition(win.x, win.y, win.width, viewport) };
    }
    set({ viewport, windows: next });
  },

  closeAll: () => set({ windows: {}, order: [], snapPreview: null }),

  snapPreview: null,
  setSnapPreview: (zone) => {
    if (get().snapPreview !== zone) set({ snapPreview: zone });
  },

  snap: (id, zone) => {
    const { windows, order, viewport } = get();
    const win = windows[id];
    if (!win) return;
    if (zone === 'max') {
      if (!win.maximized) get().toggleMaximize(id);
      return;
    }
    const before = win.snapped && win.restoreRect ? win.restoreRect : { x: win.x, y: win.y, width: win.width, height: win.height };
    set({
      windows: { ...windows, [id]: { ...win, ...snapRect(zone, viewport), snapped: zone, maximized: false, minimized: false, restoreRect: before } },
      order: bringToFront(order, id),
    });
  },

  unsnapForDrag: (id, pointerX) => {
    const { windows, viewport } = get();
    const win = windows[id];
    if (!win || (!win.snapped && !win.maximized) || !win.restoreRect) return null;
    const { width, height } = win.restoreRect;
    // Keep the pointer at the same relative spot along the title bar.
    const currentLeft = win.maximized ? 0 : win.x;
    const currentWidth = win.maximized ? viewport.width : win.width;
    const ratio = Math.min(1, Math.max(0, (pointerX - currentLeft) / currentWidth));
    const pos = clampPosition(Math.round(pointerX - ratio * width), 0, width, viewport);
    set({ windows: { ...windows, [id]: { ...win, ...pos, width, height, maximized: false, snapped: null, restoreRect: null } } });
    return pos;
  },
}));
