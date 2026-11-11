import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { APPS, DESKTOP_APPS, type AppId } from '../data/apps';
import { openApp } from '../store/actions';
import { Icon } from './Icons';

/**
 * Desktop icons use a roving tabindex: one Tab stop for the whole group,
 * arrow keys move between icons, Enter or double-click opens.
 */
export function Desktop() {
  const [selected, setSelected] = useState<AppId>(DESKTOP_APPS[0]!);
  const refs = useRef(new Map<AppId, HTMLButtonElement>());

  const moveTo = (index: number) => {
    const id = DESKTOP_APPS[(index + DESKTOP_APPS.length) % DESKTOP_APPS.length]!;
    setSelected(id);
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
    <ul className="desktop-icons" aria-label="Desktop">
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
              className={`desktop-icon${selected === id ? ' is-selected' : ''}`}
              tabIndex={selected === id ? 0 : -1}
              aria-describedby={`desc-${id}`}
              onClick={() => setSelected(id)}
              onDoubleClick={(e) => openApp(id, e.currentTarget)}
              onFocus={() => setSelected(id)}
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
