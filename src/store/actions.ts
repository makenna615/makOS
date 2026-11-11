import type { AppId } from '../data/apps';
import { getFocusedId, useWindowStore } from './windows';

/**
 * Focus bookkeeping lives outside the Zustand store because it holds DOM nodes.
 * When a window opens we remember what had focus; when it closes we send focus back there.
 */
const openers = new Map<AppId, HTMLElement>();

export const windowElementId = (id: AppId) => `window-${id}`;
export const taskbarButtonId = (id: AppId) => `taskbar-${id}`;

function focusLater(getTarget: () => HTMLElement | null | undefined) {
  requestAnimationFrame(() => getTarget()?.focus());
}

export function openApp(id: AppId, opener: Element | null = document.activeElement) {
  const isNew = !useWindowStore.getState().windows[id];
  if (isNew && opener instanceof HTMLElement && opener !== document.body) openers.set(id, opener);
  useWindowStore.getState().open(id);
}

export function closeApp(id: AppId) {
  const opener = openers.get(id);
  openers.delete(id);
  useWindowStore.getState().close(id);
  focusLater(() => {
    if (opener?.isConnected && !opener.closest('[hidden]')) return opener;
    const next = getFocusedId(useWindowStore.getState());
    if (next) return document.getElementById(windowElementId(next));
    return document.querySelector<HTMLElement>('.desktop-icon[tabindex="0"]');
  });
}

export function minimizeApp(id: AppId) {
  useWindowStore.getState().minimize(id);
  focusLater(() => document.getElementById(taskbarButtonId(id)));
}
