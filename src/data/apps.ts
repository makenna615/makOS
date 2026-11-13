/**
 * App metadata only (no components) so the window store can import it
 * without creating an import cycle. Components live in src/apps/registry.tsx.
 */
export type AppId = 'about' | 'resume' | 'projects' | 'contact' | 'fourth-down' | 'perfumes';

export type IconName = 'about' | 'resume' | 'projects' | 'contact' | 'football' | 'perfume';

export interface AppMeta {
  id: AppId;
  title: string;
  /** Shorter label for desktop icons and taskbar buttons. */
  label: string;
  icon: IconName;
  description: string;
  defaultSize: { width: number; height: number };
}

export const APPS: Record<AppId, AppMeta> = {
  about: {
    id: 'about',
    title: 'About Me',
    label: 'About Me',
    icon: 'about',
    description: 'Who I am and what I build',
    defaultSize: { width: 640, height: 520 },
  },
  resume: {
    id: 'resume',
    title: 'Resume - Makenna Peters',
    label: 'Resume',
    icon: 'resume',
    description: 'Experience, education and skills',
    defaultSize: { width: 720, height: 600 },
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    label: 'Projects',
    icon: 'projects',
    description: 'Things I have built',
    defaultSize: { width: 620, height: 420 },
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    label: 'Contact',
    icon: 'contact',
    description: 'Email, LinkedIn and GitHub',
    defaultSize: { width: 460, height: 400 },
  },
  'fourth-down': {
    id: 'fourth-down',
    title: 'Fourth Down',
    label: 'Fourth Down',
    icon: 'football',
    description: 'Fantasy football lineup and waiver optimizer',
    defaultSize: { width: 680, height: 560 },
  },
  perfumes: {
    id: 'perfumes',
    title: 'Memories into Perfumes',
    label: 'Memories into Perfumes',
    icon: 'perfume',
    description: 'AI perfume discovery and formula builder',
    defaultSize: { width: 680, height: 560 },
  },
};

/** Order of icons on the desktop and in the start menu. */
export const DESKTOP_APPS: AppId[] = ['about', 'resume', 'projects', 'contact', 'fourth-down', 'perfumes'];

export const LINKS = {
  email: 'makennaipeters@gmail.com',
  linkedin: 'https://www.linkedin.com/in/makenna-peters-6535b7196',
  github: 'https://github.com/makenna615',
  repo: 'https://github.com/makenna615/makOS',
  resumePdf: '/resume.pdf',
  resumeTxt: '/resume.txt',
} as const;
