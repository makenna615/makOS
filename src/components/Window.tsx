import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { APPS, type AppId } from '../data/apps';
import { RESIZE_DIRECTIONS, useDragResize } from '../hooks/useDragResize';
import { closeApp, minimizeApp, windowElementId } from '../store/actions';
import { getFocusedId, useWindowStore } from '../store/windows';
import { Icon } from './Icons';

interface WindowProps {
  id: AppId;
  zIndex: number;
  children: ReactNode;
}

const KEYBOARD_STEP = 24;

export function Window({ id, zIndex, children }: WindowProps) {
  const win = useWindowStore((s) => s.windows[id]);
  const isFocused = useWindowStore((s) => getFocusedId(s) === id);
  const focus = useWindowStore((s) => s.focus);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const { startDrag, startResize } = useDragResize(id);
  const ref = useRef<HTMLElement>(null);
  const app = APPS[id];
  const titleId = `${windowElementId(id)}-title`;

  // Move keyboard focus into the window whenever it becomes the active one.
  useEffect(() => {
    const el = ref.current;
    if (isFocused && el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [isFocused]);

  if (!win) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeApp(id);
      return;
    }
    // Alt+Arrow moves the window, Alt+Shift+Arrow resizes it.
    if (!event.altKey || !event.key.startsWith('Arrow') || win.maximized) return;
    event.preventDefault();
    const dx = event.key === 'ArrowLeft' ? -KEYBOARD_STEP : event.key === 'ArrowRight' ? KEYBOARD_STEP : 0;
    const dy = event.key === 'ArrowUp' ? -KEYBOARD_STEP : event.key === 'ArrowDown' ? KEYBOARD_STEP : 0;
    const store = useWindowStore.getState();
    if (event.shiftKey) store.resize(id, { x: win.x, y: win.y, width: win.width + dx, height: win.height + dy });
    else store.move(id, win.x + dx, win.y + dy);
  };

  const style = win.maximized
    ? { zIndex }
    : { zIndex, transform: `translate(${win.x}px, ${win.y}px)`, width: win.width, height: win.height };

  return (
    // The keydown handler implements the dialog's own shortcuts (Esc, Alt+Arrows). jsx-a11y's recommended
    // config allows key handlers on dialogs, but its exemption matches the <dialog> tag, not role="dialog".
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={ref}
      id={windowElementId(id)}
      data-window-id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      hidden={win.minimized}
      className={`window${isFocused ? ' is-focused' : ''}${win.maximized ? ' is-maximized' : ''}`}
      style={style}
      onPointerDownCapture={() => focus(id)}
      onFocusCapture={() => focus(id)}
      onKeyDown={onKeyDown}
    >
      {/* Pointer-only affordance; keyboard users get the same actions from the buttons and Alt+Arrow. */}
      <div className="titlebar" onPointerDown={startDrag} onDoubleClick={() => toggleMaximize(id)}>
        <Icon name={app.icon} size={18} />
        <h2 id={titleId} className="titlebar-title">
          {app.title}
        </h2>
        <div className="titlebar-controls">
          <button type="button" className="tb-btn tb-min" aria-label={`Minimize ${app.label}`} onClick={() => minimizeApp(id)}>
            <span aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`tb-btn ${win.maximized ? 'tb-restore' : 'tb-max'}`}
            aria-label={`${win.maximized ? 'Restore' : 'Maximize'} ${app.label}`}
            onClick={() => toggleMaximize(id)}
          >
            <span aria-hidden="true" />
          </button>
          <button type="button" className="tb-btn tb-close" aria-label={`Close ${app.label}`} onClick={() => closeApp(id)}>
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="window-body">{children}</div>

      {!win.maximized &&
        RESIZE_DIRECTIONS.map((dir) => (
          <div key={dir} className={`resize-handle resize-${dir}`} aria-hidden="true" onPointerDown={startResize(dir)} />
        ))}
    </section>
  );
}
