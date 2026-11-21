import type { ComponentType } from 'react';
import type { AppId } from '../data/apps';
import { About } from './About';
import { BugSweeper } from './BugSweeper';
import { Contact } from './Contact';
import { Games } from './Games';
import { ProjectWindow } from './ProjectWindow';
import { Projects } from './Projects';
import { Resume } from './Resume';
import { Stackdle } from './Stackdle';
import { Terminal } from './Terminal';

export interface AppProps {
  /** Opens another app (a window on desktop, a sheet on mobile). */
  onOpenApp: (id: AppId) => void;
}

export const APP_COMPONENTS: Record<AppId, ComponentType<AppProps>> = {
  about: About,
  resume: Resume,
  projects: Projects,
  contact: Contact,
  'fourth-down': () => <ProjectWindow projectId="fourth-down" />,
  perfumes: () => <ProjectWindow projectId="perfumes" />,
  games: Games,
  'bug-sweeper': BugSweeper,
  stackdle: Stackdle,
  terminal: Terminal,
};
