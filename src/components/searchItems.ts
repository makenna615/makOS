import { APPS, DESKTOP_APPS, GAME_APPS, LINKS, type AppId, type IconName } from '../data/apps';
import { RESUME } from '../data/resume';
import { THEMES, type ThemeId } from '../theme/theme';

export type SearchAction =
  | { kind: 'app'; id: AppId }
  | { kind: 'theme'; theme: ThemeId }
  | { kind: 'link'; href: string; newTab: boolean }
  | { kind: 'copy-email' }
  | { kind: 'restart' };

export interface SearchItem {
  key: string;
  title: string;
  /** Shown under the title. */
  detail: string;
  /** Group label: App, Game, Theme, Skill, Action. */
  group: string;
  icon: IconName | 'logo' | 'power' | 'text' | 'search';
  /** Extra words that should match. */
  keywords: string[];
  action: SearchAction;
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);

/** Everything search can find. Built from the app list and resume, so it stays in sync. */
export function buildSearchItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const id of [...DESKTOP_APPS, ...GAME_APPS]) {
    const app = APPS[id];
    items.push({
      key: `app:${id}`,
      title: app.title,
      detail: app.description,
      group: GAME_APPS.includes(id) ? 'Game' : 'App',
      icon: app.icon,
      keywords: [...words(app.description), id],
      action: { kind: 'app', id },
    });
  }
  for (const t of THEMES) {
    items.push({
      key: `theme:${t.id}`,
      title: `${t.label} theme`,
      detail: 'Switch the look of makOS',
      group: 'Theme',
      icon: 'logo',
      keywords: ['theme', 'look', 'appearance', 'style', t.id],
      action: { kind: 'theme', theme: t.id },
    });
  }
  // Every skill on the resume, so searching "postgres" or "docker" answers "yes, and here's the resume".
  for (const group of RESUME.skills) {
    for (const skill of group.items.split(', ')) {
      items.push({
        key: `skill:${skill}`,
        title: skill,
        detail: `${group.label} on Makenna's resume`,
        group: 'Skill',
        icon: 'resume',
        keywords: words(skill).concat(words(group.label)),
        action: { kind: 'app', id: 'resume' },
      });
    }
  }
  items.push(
    {
      key: 'act:pdf',
      title: 'Download resume (PDF)',
      detail: 'Makenna-Peters-Resume.pdf',
      group: 'Action',
      icon: 'resume',
      keywords: ['cv', 'pdf', 'download', 'resume'],
      action: { kind: 'link', href: LINKS.resumePdf, newTab: true },
    },
    {
      key: 'act:email',
      title: 'Email Makenna',
      detail: LINKS.email,
      group: 'Action',
      icon: 'contact',
      keywords: ['email', 'mail', 'contact', 'hire', 'reach'],
      action: { kind: 'link', href: `mailto:${LINKS.email}`, newTab: false },
    },
    {
      key: 'act:copy',
      title: 'Copy email address',
      detail: LINKS.email,
      group: 'Action',
      icon: 'contact',
      keywords: ['copy', 'email', 'clipboard'],
      action: { kind: 'copy-email' },
    },
    {
      key: 'act:github',
      title: 'GitHub',
      detail: 'github.com/makenna615',
      group: 'Action',
      icon: 'projects',
      keywords: ['github', 'code', 'source', 'repo'],
      action: { kind: 'link', href: LINKS.github, newTab: true },
    },
    {
      key: 'act:linkedin',
      title: 'LinkedIn',
      detail: 'linkedin.com/in/makenna-peters',
      group: 'Action',
      icon: 'about',
      keywords: ['linkedin', 'profile', 'connect'],
      action: { kind: 'link', href: LINKS.linkedin, newTab: true },
    },
    {
      key: 'act:restart',
      title: 'Restart makOS',
      detail: 'Play the boot screen again',
      group: 'Action',
      icon: 'power',
      keywords: ['restart', 'reboot', 'boot', 'reload'],
      action: { kind: 'restart' },
    },
  );
  return items;
}

/** Shown before anything is typed. */
const SUGGESTED = ['app:about', 'app:resume', 'app:projects', 'app:contact', 'act:pdf', 'app:terminal'];

/** Ranks items for a query: title starts with it > a word starts with it > it appears anywhere. */
export function searchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SUGGESTED.map((k) => items.find((i) => i.key === k)).filter((i): i is SearchItem => !!i);
  const scored = items
    .map((item) => {
      const title = item.title.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 60;
      else if (words(title).some((w) => w.startsWith(q))) score = 45;
      else if (title.includes(q)) score = 30;
      else if (item.keywords.some((k) => k.startsWith(q))) score = 20;
      else if (item.detail.toLowerCase().includes(q)) score = 10;
      // Apps first among equals, then games, actions, themes, skills.
      const bias = { App: 4, Game: 3, Action: 2, Theme: 1, Skill: 0 }[item.group] ?? 0;
      return { item, score: score ? score + bias : 0 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return scored.slice(0, limit).map((s) => s.item);
}
