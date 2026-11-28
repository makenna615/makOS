/**
 * App metadata only (no components) so the window store can import it
 * without creating an import cycle. Components live in src/apps/registry.tsx.
 */
export type AppId =
  | 'about'
  | 'resume'
  | 'projects'
  | 'contact'
  | 'fourth-down'
  | 'perfumes'
  | 'games'
  | 'bug-sweeper'
  | 'stackdle'
  | 'terminal'
  | 'solitaire';

export type IconName = 'about' | 'resume' | 'projects' | 'contact' | 'football' | 'perfume' | 'games' | 'bug' | 'puzzle' | 'terminal' | 'cards';

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
    defaultSize: { width: 640, height: 480 },
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
  games: {
    id: 'games',
    title: 'Games',
    label: 'Games',
    icon: 'games',
    description: 'Solitaire, Bug Sweeper and Stackdle',
    defaultSize: { width: 520, height: 340 },
  },
  'bug-sweeper': {
    id: 'bug-sweeper',
    title: 'Bug Sweeper',
    label: 'Bug Sweeper',
    icon: 'bug',
    description: 'Find the bugs hidden in the codebase',
    defaultSize: { width: 520, height: 560 },
  },
  solitaire: {
    id: 'solitaire',
    title: 'Solitaire',
    label: 'Solitaire',
    icon: 'cards',
    description: 'The classic card game, makOS style',
    defaultSize: { width: 680, height: 560 },
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    label: 'Terminal',
    icon: 'terminal',
    description: 'Ask makOS about me from the command line',
    defaultSize: { width: 640, height: 420 },
  },
  stackdle: {
    id: 'stackdle',
    title: 'Stackdle',
    label: 'Stackdle',
    icon: 'puzzle',
    description: 'Guess the daily 5-letter tech word',
    defaultSize: { width: 420, height: 660 },
  },
};

/** Order of icons on the desktop and in the start menu. */
export const DESKTOP_APPS: AppId[] = ['about', 'resume', 'projects', 'contact', 'fourth-down', 'perfumes', 'games', 'terminal'];

/** Apps inside the Games folder. */
export const GAME_APPS: AppId[] = ['solitaire', 'bug-sweeper', 'stackdle'];

export const LINKS = {
  email: 'makennaipeters@gmail.com',
  linkedin: 'https://www.linkedin.com/in/makenna-peters-6535b7196',
  github: 'https://github.com/makenna615',
  repo: 'https://github.com/makenna615/makOS',
  site: 'https://mak-os-portfolio.vercel.app',
  resumePdf: '/resume.pdf',
  resumeTxt: '/resume.txt',
} as const;
