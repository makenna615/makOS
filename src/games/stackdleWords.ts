/**
 * Stackdle's daily words. Each has general clues, revealed one per wrong guess, and some have a
 * clue drawn from the resume (src/data/resume.ts). Resume clues must stay true to the resume.
 */
export interface StackdleWord {
  word: string;
  category: string;
  /** From the resume: shown as the second clue, with a link to open the Resume window. */
  resume?: string;
  facts: string[];
}

export const STACKDLE_WORDS: readonly StackdleWord[] = [
  {
    word: 'RAILS',
    category: 'A web framework',
    resume: 'Makenna built REST APIs and the new Calendar module with this at Finalsite.',
    facts: ['Released in 2004, written in Ruby', 'Famous for "convention over configuration"'],
  },
  {
    word: 'CACHE',
    category: 'A performance concept',
    facts: ['Stores results so they are faster to get next time', 'One of the "two hard things" in computer science, with naming'],
  },
  {
    word: 'REACT',
    category: 'A frontend library',
    resume: 'Makenna paired it with Rails for the new Calendar module at Finalsite, and built makOS with it.',
    facts: ['Built around components and hooks', 'Open-sourced by Meta in 2013'],
  },
  {
    word: 'QUERY',
    category: 'A database term',
    facts: ['What you send to ask a database for data', 'SQL has SELECT ones; GraphQL is named after them'],
  },
  {
    word: 'RSPEC',
    category: 'A testing tool',
    resume: 'Makenna wrote tests with this (and Jasmine) for CI/CD at Finalsite.',
    facts: ['A testing framework for Ruby', 'Tests read like "describe ... it ... expect"'],
  },
  {
    word: 'MUTEX',
    category: 'A concurrency concept',
    facts: ['Lets only one thread into a section of code at a time', 'Short for "mutual exclusion"'],
  },
  {
    word: 'MERGE',
    category: 'A version control action',
    resume: 'At Finalsite, Makenna used Claude Code and GitHub Copilot to help review these requests.',
    facts: ['Combines two branches into one', 'Conflicts happen when both sides changed the same lines'],
  },
  {
    word: 'ASYNC',
    category: 'A JavaScript keyword',
    facts: ['Marks a function that returns a promise', 'Usually paired with await'],
  },
  {
    word: 'CODEX',
    category: 'An AI coding tool',
    resume: 'Makenna built Memories into Perfumes mainly with this, planning tasks and reviewing its output.',
    facts: ["OpenAI's coding agent", 'Also an old word for a hand-written book'],
  },
  {
    word: 'STACK',
    category: 'A data structure',
    facts: ['Last in, first out', 'Overflowing one is a famous error (and a famous website)'],
  },
  {
    word: 'REDIS',
    category: 'A database',
    facts: ['An in-memory key-value store', 'Often used for caching and job queues'],
  },
  {
    word: 'HOOKS',
    category: 'A React feature',
    resume: 'makOS, the site you are on, uses these throughout; Makenna built it with React.',
    facts: ['Functions like useState and useEffect', 'Added to React in version 16.8'],
  },
  {
    word: 'PROXY',
    category: 'A networking (and JavaScript) concept',
    facts: ['Sits between a client and a server', 'In JavaScript, it can intercept reads and writes to an object'],
  },
  {
    word: 'DEBUG',
    category: 'An everyday developer activity',
    resume: 'Makenna tracked down production issues with GCP, New Relic and Datadog at Finalsite.',
    facts: ['Finding and fixing what is wrong', 'Said to come from a moth found in a computer in 1947'],
  },
  {
    word: 'TOKEN',
    category: 'A security and language-model term',
    facts: ['Proves who you are to an API', 'Language models read text in these small pieces'],
  },
  {
    word: 'QUEUE',
    category: 'A data structure',
    facts: ['First in, first out', 'Background job systems are built around them'],
  },
  {
    word: 'FETCH',
    category: 'A browser API',
    resume: 'makOS uses it to load the live Fargo weather in the taskbar.',
    facts: ['Makes network requests and returns a promise', 'Replaced XMLHttpRequest for most uses'],
  },
  {
    word: 'LINUX',
    category: 'An operating system',
    facts: ['Runs most of the servers on the internet', 'First released by Linus Torvalds in 1991'],
  },
  {
    word: 'MODEL',
    category: 'A software architecture term',
    resume: 'Makenna worked across Rails and Backbone/Marionette at Finalsite, which both use these.',
    facts: ['The "M" in MVC', 'Represents your data and its rules'],
  },
  {
    word: 'REGEX',
    category: 'A text tool',
    facts: ['A pattern language for matching text', 'Some people, when confronted with a problem, think "I know, I\'ll use one"'],
  },
  {
    word: 'STATE',
    category: 'A frontend concept',
    resume: 'makOS keeps every window in one Zustand store of this, which Makenna built without a window library.',
    facts: ['Data that changes over time in an app', 'Lifting it up is a common React pattern'],
  },
  {
    word: 'ARRAY',
    category: 'A data structure',
    facts: ['An ordered list of values', 'Usually starts counting at zero'],
  },
  {
    word: 'SHELL',
    category: 'A command-line tool',
    facts: ['Where you type commands like ls and cd', 'Bash and Zsh are popular ones'],
  },
  {
    word: 'BUILD',
    category: 'A CI/CD step',
    resume: 'Every push to makOS runs lint, type check, tests and this step before it ships.',
    facts: ['Turns source code into something you can run or deploy', 'A red one blocks the merge'],
  },
  {
    word: 'SCOPE',
    category: 'A programming language concept',
    facts: ['Where a variable can be seen', 'let and const are block-level; var is not'],
  },
  {
    word: 'YIELD',
    category: 'A programming keyword',
    facts: ['Pauses a generator and hands back a value', 'Ruby blocks use it too'],
  },
  {
    word: 'NGINX',
    category: 'A web server',
    facts: ['Pronounced "engine-x"', 'Often used as a reverse proxy and load balancer'],
  },
  {
    word: 'ROUTE',
    category: 'A web framework term',
    resume: 'Makenna defined plenty of these for REST APIs in Rails at Finalsite.',
    facts: ['Maps a URL to the code that handles it', 'Rails keeps them in config/routes.rb'],
  },
  {
    word: 'TUPLE',
    category: 'A data structure',
    facts: ['A fixed-size, ordered group of values', 'Python and TypeScript both have them'],
  },
  {
    word: 'CLASS',
    category: 'An object-oriented programming term',
    facts: ['A blueprint for objects', 'In CSS, a way to style many elements at once'],
  },
];

export const STACKDLE_START = new Date(2026, 10, 20); // puzzle #1

/** Puzzle number (1-based) for a date, counted in local days since the first puzzle. */
export function puzzleNumber(date: Date = new Date()): number {
  const day = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return Math.max(1, day(date) - day(STACKDLE_START) + 1);
}

export function wordFor(puzzle: number): StackdleWord {
  return STACKDLE_WORDS[(puzzle - 1) % STACKDLE_WORDS.length]!;
}

/** Clues in reveal order: category, resume clue (if any), facts, then the first letter. */
export function cluesFor(entry: StackdleWord): { text: string; fromResume: boolean }[] {
  return [
    { text: `Category: ${entry.category}`, fromResume: false },
    ...(entry.resume ? [{ text: entry.resume, fromResume: true }] : []),
    ...entry.facts.map((text) => ({ text, fromResume: false })),
    { text: `It starts with ${entry.word[0]}`, fromResume: false },
  ];
}

export type Mark = 'hit' | 'near' | 'miss';

/** Scores a guess against the answer, handling repeated letters correctly. */
export function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array.from({ length: answer.length }, () => 'miss');
  const pool: (string | null)[] = answer.split('');
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = 'hit';
      pool[i] = null;
    }
  }
  for (let i = 0; i < answer.length; i++) {
    if (marks[i] === 'hit') continue;
    const at = pool.indexOf(guess[i] ?? '');
    if (at >= 0) {
      marks[i] = 'near';
      pool[at] = null;
    }
  }
  return marks;
}
