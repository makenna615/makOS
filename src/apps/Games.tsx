import { APPS, GAME_APPS } from '../data/apps';
import { Icon } from '../components/Icons';
import type { AppProps } from './registry';

export function Games({ onOpenApp }: AppProps) {
  return (
    <div className="app projects">
      <div className="explorer-bar" aria-hidden="true">
        <span className="explorer-path">makOS:/Users/Mak/Games</span>
      </div>
      <ul className="project-grid" aria-label="Games">
        {GAME_APPS.map((id) => (
          <li key={id}>
            <button type="button" className="project-tile" onClick={() => onOpenApp(id)}>
              <Icon name={APPS[id].icon} size={48} />
              <span className="project-tile-name">{APPS[id].label}</span>
              <span className="project-tile-desc">{APPS[id].description}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="statusbar">{GAME_APPS.length} items</p>
    </div>
  );
}
