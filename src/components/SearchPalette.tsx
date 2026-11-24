import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { LINKS } from '../data/apps';
import { useThemeStore } from '../theme/theme';
import { Icon } from './Icons';
import { buildSearchItems, searchItems, type SearchItem } from './searchItems';
import type { AppId } from '../data/apps';

interface SearchPaletteProps {
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
  onRestart: () => void;
}

/**
 * Spotlight-style search (Ctrl+K / ⌘K): apps, games, themes, resume skills and quick actions.
 * Follows the ARIA combobox pattern: focus stays in the text box, arrow keys move the highlighted
 * result, Enter runs it, Escape closes and returns focus to where it was.
 */
export function SearchPalette({ onClose, onOpenApp, onRestart }: SearchPaletteProps) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const items = useMemo(() => buildSearchItems(), []);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchItems(items, query);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  const run = (item: SearchItem) => {
    const { action } = item;
    switch (action.kind) {
      case 'app':
        onClose();
        // After the palette has closed and given focus back, so the new window takes focus.
        requestAnimationFrame(() => onOpenApp(action.id));
        return;
      case 'theme':
        setTheme(action.theme);
        onClose();
        return;
      case 'link':
        if (action.newTab) window.open(action.href, '_blank', 'noopener,noreferrer');
        else window.location.assign(action.href);
        onClose();
        return;
      case 'copy-email':
        navigator.clipboard
          ?.writeText(LINKS.email)
          .then(() => setNotice(`Copied ${LINKS.email}`))
          .catch(() => setNotice(`Couldn't copy. The address is ${LINKS.email}`));
        return;
      case 'restart':
        onClose();
        onRestart();
        return;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((a) => (results.length ? (a + 1) % results.length : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
        break;
      case 'Enter': {
        event.preventDefault();
        const item = results[active];
        if (item) run(item);
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        onClose();
        break;
      case 'Tab':
        event.preventDefault(); // keep focus in the dialog
        break;
    }
  };

  const optionId = (item: SearchItem) => `search-${item.key.replace(/[^a-z0-9-]/gi, '-')}`;
  const activeItem = results[active];

  return (
    // Clicking the dimmed backdrop closes the search, like any popover; Escape does the same from the keyboard.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="search-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search makOS">
        <div className="search-field">
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            role="combobox"
            aria-label="Search apps, games, skills and actions"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
            placeholder="Search apps, games, skills…"
            value={query}
            maxLength={60}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setNotice('');
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="search-esc">Esc</kbd>
        </div>
        <ul id="search-results" className="search-results" role="listbox" aria-label="Results">
          {results.map((item, i) => (
            // Options are picked with the arrow keys from the text box (combobox pattern), or with a click.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={item.key}
              id={optionId(item)}
              role="option"
              aria-selected={i === active}
              className={`search-result${i === active ? ' is-active' : ''}`}
              onMouseMove={() => setActive(i)}
              onClick={() => run(item)}
            >
              <Icon name={item.icon} size={24} />
              <span className="search-result-text">
                <span className="search-result-title">{item.title}</span>
                <span className="search-result-detail">{item.detail}</span>
              </span>
              <span className="search-result-group">{item.group}</span>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p className="search-empty">No matches for “{query}”. Try “resume”, “react” or “games”.</p>}
        <p className="search-status" role="status">
          {notice || (query && results.length ? `${results.length} result${results.length > 1 ? 's' : ''}` : '')}
        </p>
      </div>
    </div>
  );
}
