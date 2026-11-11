import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { APPS, DESKTOP_APPS, LINKS } from '../data/apps';
import { openApp } from '../store/actions';
import { Icon } from './Icons';

interface StartMenuProps {
  onClose: (returnFocus: boolean) => void;
  onRestart: () => void;
}

/** WAI-ARIA menu pattern: arrow keys / Home / End move, Escape closes and returns focus to Start. */
export function StartMenu({ onClose, onRestart }: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    items()[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!menuRef.current?.contains(target) && !target.closest('.start-button')) onClose(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      event.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return go(index + 1);
      case 'ArrowUp':
        return go(index - 1);
      case 'Home':
        return go(0);
      case 'End':
        return go(list.length - 1);
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        return onClose(true);
      case 'Tab':
        return onClose(false);
    }
  };

  const launch = (id: (typeof DESKTOP_APPS)[number]) => {
    onClose(false);
    openApp(id, document.querySelector('.start-button'));
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="start-menu" ref={menuRef} onKeyDown={onKeyDown}>
      <div className="start-menu-header">
        <span className="start-avatar" aria-hidden="true">
          MP
        </span>
        <div>
          <p className="start-name">Makenna Peters</p>
          <p className="start-role">Full-stack software engineer</p>
        </div>
      </div>
      <ul className="start-menu-list" role="menu" id="start-menu" aria-label="makOS start menu">
        {DESKTOP_APPS.map((id) => (
          <li role="none" key={id}>
            <button type="button" role="menuitem" tabIndex={-1} onClick={() => launch(id)}>
              <Icon name={APPS[id].icon} size={28} />
              <span>
                <span className="start-item-title">{APPS[id].label}</span>
                <span className="start-item-desc">{APPS[id].description}</span>
              </span>
            </button>
          </li>
        ))}
        <li role="separator" className="start-separator" />
        <li role="none">
          <a role="menuitem" tabIndex={-1} href={LINKS.resumeTxt} target="_blank" rel="noreferrer">
            <Icon name="text" size={28} />
            <span className="start-item-title">Plain-text resume</span>
          </a>
        </li>
        <li role="none">
          <a role="menuitem" tabIndex={-1} href={LINKS.repo} target="_blank" rel="noreferrer">
            <Icon name="projects" size={28} />
            <span className="start-item-title">View makOS source on GitHub</span>
          </a>
        </li>
        <li role="separator" className="start-separator" />
        <li role="none" className="start-menu-footer">
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="start-restart"
            onClick={() => {
              onClose(false);
              onRestart();
            }}
          >
            <Icon name="power" size={20} />
            <span className="start-item-title">Restart makOS</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
