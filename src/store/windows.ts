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
  /** Geometry to restore when un-maximizing. */
  restoreRect: Rect | null;
}

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
}

export const MIN_WIDTH = 280;
export const MIN_HEIGHT = 180;
/** How much of a title bar must stay on screen so a window can always be grabbed. */
export const GRAB_MARGIN = 80;
export const TITLE_BAR_HEIGHT = 30;
const CASCADE_STEP = 28;

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
  const height = Math.min(app.defaultSize.height, viewport.height - 24);
  const step = (openCount % 6) * CASCADE_STEP;
  const centerX = Math.round((viewport.width - width) / 2);
  const centerY = Math.round((viewport.height - height) / 3);
  return {
    width,
    height,
    x: clamp(centerX + step - CASCADE_STEP, 8, viewport.width - width - 8),
    y: clamp(centerY + step - CASCADE_STEP, 8, viewport.height - height - 8),
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
      windows: { ...windows, [id]: { id, ...rect, minimized: false, maximized: false, restoreRect: null } },
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
    const updated: WindowState = win.maximized
      ? { ...win, ...(win.restoreRect ?? {}), maximized: false, restoreRect: null }
      : { ...win, maximized: true, minimized: false, restoreRect: { x: win.x, y: win.y, width: win.width, height: win.height } };
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
    set({ windows: { ...windows, [id]: { ...win, ...pos } } });
  },

  resize: (id, rect) => {
    const { windows, viewport } = get();
    const win = windows[id];
    if (!win || win.maximized) return;
    const width = clamp(Math.round(rect.width), MIN_WIDTH, viewport.width);
    const height = clamp(Math.round(rect.height), MIN_HEIGHT, viewport.height);
    const pos = clampPosition(Math.round(rect.x), Math.round(rect.y), width, viewport);
    set({ windows: { ...windows, [id]: { ...win, ...pos, width, height } } });
  },

  setViewport: (viewport) => {
    const { windows } = get();
    const next: WindowStore['windows'] = {};
    for (const win of Object.values(windows)) {
      if (!win) continue;
      next[win.id] = { ...win, ...clampPosition(win.x, win.y, win.width, viewport) };
    }
    set({ viewport, windows: next });
  },

  closeAll: () => set({ windows: {}, order: [] }),
}));
