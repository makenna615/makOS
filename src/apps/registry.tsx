import type { ComponentType } from 'react';
import type { AppId } from '../data/apps';
import { About } from './About';
import { Contact } from './Contact';
import { ProjectWindow } from './ProjectWindow';
import { Projects } from './Projects';
import { Resume } from './Resume';

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
};
