import type { ReactNode } from 'react';
import { APPS, DESKTOP_APPS, GAME_APPS, LINKS, type AppId } from '../data/apps';
import { RESUME } from '../data/resume';
import { THEMES, isThemeId, type ThemeId } from '../theme/theme';

/** What a command can do besides printing: open an app, switch theme, clear the screen, etc. */
export interface TerminalContext {
  openApp: (id: AppId) => void;
  setTheme: (theme: ThemeId) => void;
  theme: ThemeId;
  clear: () => void;
  exit: () => void;
  history: string[];
  startedAt: number;
}

export type CommandResult = ReactNode | ReactNode[] | null;

/** Opens the joke blue screen (App listens for this). */
export const BLUE_SCREEN_EVENT = 'makos:blue-screen';

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noreferrer">
    {label}
  </a>
);

/** Every app, by id or by a few friendly names. */
const OPENABLE: Record<string, AppId> = {
  ...Object.fromEntries((Object.keys(APPS) as AppId[]).map((id) => [id, id])),
  me: 'about',
  cv: 'resume',
  fourthdown: 'fourth-down',
  football: 'fourth-down',
  perfume: 'perfumes',
  bugsweeper: 'bug-sweeper',
  bugs: 'bug-sweeper',
};

const FILES: Record<string, string> = {
  'about.txt': 'about',
  'skills.txt': 'skills',
  'experience.txt': 'experience',
  'education.txt': 'education',
  'contact.txt': 'contact',
  'resume.pdf': 'resume',
};

/**
 * Looks up typed text in one of the tables above. Only the table's own entries count, so input like
 * "constructor" or "__proto__" can't reach JavaScript's built-in object properties.
 */
function lookup<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

interface Command {
  summary: string;
  run: (args: string[], ctx: TerminalContext) => CommandResult;
  hidden?: boolean;
}

export const COMMANDS: Record<string, Command> = {
  help: {
    summary: 'List the commands',
    run: () => [
      'Commands:',
      ...Object.entries(COMMANDS)
        .filter(([, c]) => !c.hidden)
        .map(([name, c]) => `  ${name.padEnd(12)}${c.summary}`),
      '',
      'Tips: ↑/↓ for history, Tab to complete, Ctrl+L to clear. There may be a few hidden commands…',
    ],
  },
  whoami: {
    summary: 'Who built this',
    run: () => [
      `${RESUME.name}: full-stack software engineer (Ruby on Rails, React, TypeScript).`,
      `${RESUME.location} · open to remote roles.`,
    ],
  },
  about: { summary: 'A short summary', run: () => RESUME.summary },
  experience: {
    summary: 'Where I have worked',
    run: () =>
      RESUME.experience.flatMap((job) => [
        `${job.company} (${job.location})`,
        ...job.roles.map((r) => `  ${r.title.padEnd(24)}${r.dates}`),
        ...job.bullets.map((b) => `  • ${b}`),
        '',
      ]),
  },
  skills: {
    summary: 'Languages, frameworks and tools',
    run: () => RESUME.skills.map((s) => `${(s.label + ':').padEnd(19)}${s.items}`),
  },
  projects: {
    summary: 'Things I have built',
    run: () => [
      `${APPS['fourth-down'].title}: ${APPS['fourth-down'].description}`,
      `${APPS.perfumes.title}: ${APPS.perfumes.description}`,
      'makOS: this site. React, TypeScript, Zustand, WebGL',
      '',
      'Try: open fourth-down, open perfumes, open projects',
    ],
  },
  education: {
    summary: 'Degree and school',
    run: () => [`${RESUME.education.degree}`, `${RESUME.education.school}, ${RESUME.education.dates}`, RESUME.education.notes],
  },
  contact: {
    summary: 'How to reach me',
    run: () => [
      <span key="e">Email:    {ext(`mailto:${LINKS.email}`, LINKS.email)}</span>,
      <span key="l">LinkedIn: {ext(LINKS.linkedin, 'linkedin.com/in/makenna-peters')}</span>,
      <span key="g">GitHub:   {ext(LINKS.github, 'github.com/makenna615')}</span>,
    ],
  },
  resume: {
    summary: 'Open my resume (resume --pdf for the PDF)',
    run: (args, ctx) => {
      if (args.includes('--pdf')) return <span>Resume PDF: {ext(LINKS.resumePdf, 'resume.pdf')}</span>;
      ctx.openApp('resume');
      return 'Opening Resume…';
    },
  },
  open: {
    summary: 'Open an app, e.g. open projects',
    run: (args, ctx) => {
      const name = (args[0] ?? '').toLowerCase().replace(/[^a-z-]/g, '');
      const id = lookup(OPENABLE, name);
      if (!id) return [`open: no app called "${args[0] ?? ''}"`, `Apps: ${[...DESKTOP_APPS, ...GAME_APPS].join(', ')}`];
      ctx.openApp(id);
      return `Opening ${APPS[id].title}…`;
    },
  },
  games: {
    summary: 'Play Bug Sweeper or Stackdle',
    run: () => ['Bug Sweeper: open bug-sweeper', 'Stackdle:    open stackdle'],
  },
  theme: {
    summary: 'Show or switch theme: theme retro | modern | future',
    run: (args, ctx) => {
      const next = (args[0] ?? '').toLowerCase();
      if (!next) return `Current theme: ${ctx.theme}. Available: ${THEMES.map((t) => t.id).join(', ')}`;
      if (!isThemeId(next)) return `theme: unknown theme "${args[0]}". Try retro, modern or future.`;
      ctx.setTheme(next);
      return `Theme set to ${next}.`;
    },
  },
  ls: {
    summary: 'List files',
    run: () => [...Object.keys(FILES), 'projects/', 'games/'].join('  '),
  },
  cat: {
    summary: 'Show a file, e.g. cat skills.txt',
    run: (args, ctx) => {
      const file = args[0] ?? '';
      if (file === 'projects/' || file === 'projects') return 'cat: projects/: Is a directory';
      const command = lookup(FILES, file);
      if (!command) return `cat: ${file || '(nothing)'}: No such file. Try ls.`;
      return COMMANDS[command]!.run([], ctx);
    },
  },
  neofetch: {
    summary: 'System info',
    run: (_args, ctx) => {
      const uptime = Math.max(1, Math.round((Date.now() - ctx.startedAt) / 60000));
      const info = [
        `mak@makOS`,
        `---------`,
        `OS:      makOS (browser edition)`,
        `Theme:   ${ctx.theme}`,
        `Shell:   mak-sh`,
        `Uptime:  ${uptime} min`,
        `Stack:   React 19, TypeScript, Zustand, WebGL`,
        `Tests:   Vitest + Playwright + axe`,
        `Owner:   ${RESUME.name}, ${RESUME.location}`,
      ];
      const art = [' __  __ ', '|  \\/  |', '| \\  / |', '| |\\/| |', '| |  | |', '|_|  |_|'];
      return info.map((line, i) => `${art[i] ?? ' '.repeat(8)}   ${line}`);
    },
  },
  history: {
    summary: 'Commands you have run',
    run: (_args, ctx) => (ctx.history.length ? ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) : 'No history yet.'),
  },
  date: { summary: 'Today', run: () => new Date().toString() },
  pwd: { summary: 'Where you are', run: () => '/home/mak' },
  echo: { summary: 'Print text', run: (args) => args.join(' ') },
  clear: {
    summary: 'Clear the screen',
    run: (_args, ctx) => {
      ctx.clear();
      return null;
    },
  },
  'hire-me': {
    summary: 'The important one',
    run: () => [
      'Excellent choice. 🎉',
      <span key="m">Email me at {ext(`mailto:${LINKS.email}?subject=Let's%20talk`, LINKS.email)}, or run "resume".</span>,
    ],
  },
  exit: {
    summary: 'Close the terminal',
    run: (_args, ctx) => {
      ctx.exit();
      return 'logout';
    },
  },

  // ---- Hidden fun ----
  sudo: {
    summary: '',
    hidden: true,
    run: (args, ctx) =>
      args[0] === 'hire-me'
        ? COMMANDS['hire-me']!.run([], ctx)
        : 'mak is not in the sudoers file. This incident will be reported to the recruiter.',
  },
  rm: {
    summary: '',
    hidden: true,
    run: (args) => {
      if (args.includes('-rf') && (args.includes('/') || args.includes('*') || args.includes('/*'))) {
        window.setTimeout(() => window.dispatchEvent(new Event(BLUE_SCREEN_EVENT)), 400);
        return 'Deleting everything… you asked for it.';
      }
      return 'rm: nice try. Nothing here is deletable.';
    },
  },
  git: {
    summary: '',
    hidden: true,
    run: (args) =>
      args[0] === 'status'
        ? ['On branch main', "Your career is up to date with 'origin/open-to-work'.", 'nothing to commit, working tree clean']
        : args[0] === 'blame'
          ? 'Every line: Makenna Peters (and Claude Code).'
          : `git: '${args[0] ?? ''}' is just for show here. Try git status.`,
  },
  vim: { summary: '', hidden: true, run: () => "You're stuck in vim now. Just kidding: you can type :q (or anything else)." },
  ':q': { summary: '', hidden: true, run: () => 'Freedom.' },
  cd: { summary: '', hidden: true, run: () => "cd: it's a one-folder OS. Everything's right here." },
  coffee: { summary: '', hidden: true, run: () => '☕ Brewing… done. Productivity +10.' },
  ping: { summary: '', hidden: true, run: () => 'PONG. Makenna usually replies to email within a day.' },
};

/** Runs one line of input. Returns what to print (null for nothing). */
export function runCommand(line: string, ctx: TerminalContext): CommandResult {
  const [name = '', ...args] = line.trim().split(/\s+/);
  if (!name) return null;
  const command = lookup(COMMANDS, name.toLowerCase());
  if (!command) return `${name}: command not found. Type "help" for the list.`;
  return command.run(args, ctx);
}

/** Tab completion: the commands (or, after "open", "theme" or "cat", the arguments) that start with what's typed. */
export function complete(line: string): string[] {
  const parts = line.replace(/^\s+/, '').split(/\s+/);
  if (parts.length <= 1) {
    const typed = (parts[0] ?? '').toLowerCase();
    return Object.entries(COMMANDS)
      .filter(([n, c]) => !c.hidden && n.startsWith(typed))
      .map(([n]) => n);
  }
  const [cmd, arg = ''] = parts;
  const options =
    cmd === 'open' ? [...DESKTOP_APPS, ...GAME_APPS] : cmd === 'theme' ? THEMES.map((t) => t.id) : cmd === 'cat' ? Object.keys(FILES) : [];
  return options.filter((o) => o.startsWith(arg.toLowerCase())).map((o) => `${cmd} ${o}`);
}
