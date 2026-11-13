import { APPS, LINKS } from '../data/apps';
import { Icon } from '../components/Icons';
import type { AppProps } from './registry';

export function Projects({ onOpenApp }: AppProps) {
  return (
    <div className="app projects">
      <div className="explorer-bar" aria-hidden="true">
        <span className="explorer-path">makOS:/Users/Mak/Projects</span>
      </div>

      <ul className="project-grid" aria-label="Projects">
        {(['fourth-down', 'perfumes'] as const).map((id) => (
          <li key={id}>
            <button type="button" className="project-tile" onClick={() => onOpenApp(id)}>
              <Icon name={APPS[id].icon} size={48} />
              <span className="project-tile-name">{APPS[id].label}</span>
              <span className="project-tile-desc">{APPS[id].description}</span>
            </button>
          </li>
        ))}
        <li>
          <a className="project-tile" href={LINKS.repo} target="_blank" rel="noreferrer">
            <span className="logo-badge">
              <Icon name="logo" size={40} />
            </span>
            <span className="project-tile-name">makOS</span>
            <span className="project-tile-desc">This site. React, TypeScript, Zustand (opens GitHub)</span>
          </a>
        </li>
      </ul>

      <p className="coming-soon">More projects coming soon.</p>

      <p className="statusbar">3 items</p>
    </div>
  );
}
