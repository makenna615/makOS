import { useCallback, useRef, useState } from 'react';
import { APPS, LINKS } from '../data/apps';
import { taskbarButtonId } from '../store/actions';
import { getFocusedId, useWindowStore } from '../store/windows';
import { Clock } from './Clock';
import { Icon } from './Icons';
import { StartMenu } from './StartMenu';

interface TaskbarProps {
  onRestart: () => void;
}

export function Taskbar({ onRestart }: TaskbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);
  const windows = useWindowStore((s) => s.windows);
  const focusedId = useWindowStore(getFocusedId);
  const toggleFromTaskbar = useWindowStore((s) => s.toggleFromTaskbar);

  const closeMenu = useCallback((returnFocus: boolean) => {
    setMenuOpen(false);
    if (returnFocus) startRef.current?.focus();
  }, []);

  // Taskbar buttons keep the order windows were opened in, like a real OS.
  const taskbarIds = Object.keys(windows) as (keyof typeof windows)[];

  return (
    <nav className="taskbar" aria-label="Taskbar">
      <button
        ref={startRef}
        type="button"
        id="taskbar-start"
        className="start-button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? 'start-menu' : undefined}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Icon name="logo" size={22} />
        <span>makOS</span>
      </button>
      {menuOpen && <StartMenu onClose={closeMenu} onRestart={onRestart} />}

      <ul className="taskbar-windows" aria-label="Open windows">
        {taskbarIds.map((id) => {
          const win = windows[id];
          const app = APPS[id];
          const active = focusedId === id;
          return (
            <li key={id}>
              <button
                type="button"
                id={taskbarButtonId(id)}
                className={`taskbar-window${active ? ' is-active' : ''}${win?.minimized ? ' is-minimized' : ''}`}
                aria-pressed={active}
                aria-label={`${app.label}${win?.minimized ? ' (minimized)' : ''}`}
                onClick={() => toggleFromTaskbar(id)}
              >
                <Icon name={app.icon} size={16} />
                <span className="taskbar-window-label">{app.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="tray">
        <a className="tray-link" href={LINKS.resumeTxt} target="_blank" rel="noreferrer">
          Plain-text resume
        </a>
        <Clock />
      </div>
    </nav>
  );
}
