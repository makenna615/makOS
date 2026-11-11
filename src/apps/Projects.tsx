import { APPS, LINKS } from '../data/apps';
import { Icon } from '../components/Icons';
import type { AppProps } from './registry';

const COMING_SOON = [
  { name: 'AI Job Tracker', note: 'Rails 8 + Hotwire. AI parses job postings and scores fit.' },
  { name: 'A11y Checker', note: 'axe-core audits with AI fix suggestions, in a mini browser window.' },
];

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

      <h3 className="section-label">Coming soon</h3>
      <ul className="coming-soon">
        {COMING_SOON.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong>: {p.note}
          </li>
        ))}
      </ul>

      <p className="statusbar">
        3 items · {COMING_SOON.length} in progress
      </p>
    </div>
  );
}
