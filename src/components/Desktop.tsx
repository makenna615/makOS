import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { APPS, DESKTOP_APPS, type AppId } from '../data/apps';
import { openApp } from '../store/actions';
import { Icon } from './Icons';

/**
 * Desktop icons use a roving tabindex: one Tab stop for the whole group,
 * arrow keys move between icons, Enter or double-click opens.
 *
 * `selected` is the roving tab stop and persists so Tab returns to the last icon used.
 * The blue highlight only shows while the icons are in use (`active`), and clears when
 * the user clicks elsewhere or tabs away, like a real desktop.
 */
export function Desktop() {
  const [selected, setSelected] = useState<AppId>(DESKTOP_APPS[0]!);
  const [active, setActive] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const refs = useRef(new Map<AppId, HTMLButtonElement>());

  // Pointer clicks anywhere outside the icons deselect them. Listening for pointerdown
  // (not blur) also covers Safari, which doesn't focus buttons on click.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setActive(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const select = (id: AppId) => {
    setSelected(id);
    setActive(true);
  };

  // Keyboard focus leaving the icon group (Tab, or a window opening) also deselects.
  const onBlur = (event: FocusEvent<HTMLUListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
  };

  const moveTo = (index: number) => {
    const id = DESKTOP_APPS[(index + DESKTOP_APPS.length) % DESKTOP_APPS.length]!;
    select(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, id: AppId) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        moveTo(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        moveTo(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveTo(0);
        break;
      case 'End':
        event.preventDefault();
        moveTo(DESKTOP_APPS.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        openApp(id, event.currentTarget);
        break;
    }
  };

  return (
    <ul ref={listRef} className="desktop-icons" aria-label="Desktop" onBlur={onBlur}>
      {DESKTOP_APPS.map((id, index) => {
        const app = APPS[id];
        return (
          <li key={id}>
            <button
              type="button"
              ref={(el) => {
                if (el) refs.current.set(id, el);
                else refs.current.delete(id);
              }}
              className={`desktop-icon${active && selected === id ? ' is-selected' : ''}`}
              tabIndex={selected === id ? 0 : -1}
              aria-describedby={`desc-${id}`}
              onClick={() => select(id)}
              onDoubleClick={(e) => openApp(id, e.currentTarget)}
              onFocus={() => select(id)}
              onKeyDown={(e) => onKeyDown(e, index, id)}
            >
              <Icon name={app.icon} size={44} />
              <span className="desktop-icon-label">{app.label}</span>
            </button>
            <span id={`desc-${id}`} className="visually-hidden">
              {app.description}. Press Enter to open.
            </span>
          </li>
        );
      })}
    </ul>
  );
}
