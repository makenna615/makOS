import type { ComponentType } from 'react';
import type { AppId } from '../data/apps';
import { onDemand } from '../onDemand';
import { About } from './About';
import { Contact } from './Contact';
import { Projects } from './Projects';
import { Resume } from './Resume';

export interface AppProps {
  /** Opens another app (a window on desktop, a sheet on mobile). */
  onOpenApp: (id: AppId) => void;
}

/*
 * The apps most visitors see (About opens on load, plus Resume, Projects and Contact) are part of the
 * main download. Everything else is fetched the first time it's opened, or quietly in the background
 * once the page is idle (see preloadApps), so first load stays small and opening is still instant.
 */
const loadProjectWindow = () => import('./ProjectWindow');
const ON_DEMAND = {
  games: onDemand<AppProps>(() => import('./Games').then((m) => ({ default: m.Games }))),
  'bug-sweeper': onDemand<AppProps>(() => import('./BugSweeper').then((m) => ({ default: m.BugSweeper }))),
  stackdle: onDemand<AppProps>(() => import('./Stackdle').then((m) => ({ default: m.Stackdle }))),
  terminal: onDemand<AppProps>(() => import('./Terminal').then((m) => ({ default: m.Terminal }))),
  solitaire: onDemand<AppProps>(() => import('./Solitaire').then((m) => ({ default: m.Solitaire }))),
  'fourth-down': onDemand<AppProps>(() =>
    loadProjectWindow().then((m) => ({ default: () => <m.ProjectWindow projectId="fourth-down" /> })),
  ),
  perfumes: onDemand<AppProps>(() =>
    loadProjectWindow().then((m) => ({ default: () => <m.ProjectWindow projectId="perfumes" /> })),
  ),
};

export const APP_COMPONENTS: Record<AppId, ComponentType<AppProps>> = {
  about: About,
  resume: Resume,
  projects: Projects,
  contact: Contact,
  games: ON_DEMAND.games.Component,
  'bug-sweeper': ON_DEMAND['bug-sweeper'].Component,
  stackdle: ON_DEMAND.stackdle.Component,
  terminal: ON_DEMAND.terminal.Component,
  solitaire: ON_DEMAND.solitaire.Component,
  'fourth-down': ON_DEMAND['fourth-down'].Component,
  perfumes: ON_DEMAND.perfumes.Component,
};

/** Fetches the on-demand apps in the background, so opening one later is instant. */
export function preloadApps() {
  for (const app of Object.values(ON_DEMAND)) app.preload();
}
