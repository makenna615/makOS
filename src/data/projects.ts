export interface Project {
  id: 'fourth-down' | 'perfumes';
  name: string;
  tagline: string;
  status: string;
  overview: string[];
  pipeline?: { title: string; steps: string[] };
  features: { group: string; items: string[] }[];
  highlights: string[];
  stack: { layer: string; tech: string }[];
  links: { label: string; href?: string; note?: string }[];
}

export const PROJECTS: Record<Project['id'], Project> = {
  'fourth-down': {
    id: 'fourth-down',
    name: 'Fourth Down',
    tagline: 'A free, full-stack fantasy football lineup and waiver optimizer.',
    status: 'Personal project · in active development · not deployed yet',
    overview: [
      'Add your team and ESPN-style league settings, and Fourth Down uses current NFL projections to build an optimal lineup, compare start/sit options, and find waiver adds and drops.',
      'The recommendation math is deterministic. OpenAI is optional and only explains results Fourth Down has already calculated. It never creates projections, scores players or changes rankings.',
    ],
    pipeline: {
      title: 'Projection and scoring pipeline',
      steps: [
        'Tank01 projected stat line',
        'Normalization + canonical player matching',
        "The league's exact ESPN-style scoring",
        'Stored projected fantasy points',
        'Deterministic lineup optimizer + waiver ranking',
        'Optional OpenAI explanation',
      ],
    },
    features: [
      {
        group: 'Leagues and rosters',
        items: [
          'Account-based leagues, fantasy teams and rosters',
          'ESPN-style scoring with 53 categories, including negative points',
          'Custom roster slots: WR/TE, FLEX, SUPERFLEX/OP, IR and IDP positions',
          'Mobile-friendly weekly My Team dashboard',
        ],
      },
      {
        group: 'Recommendations',
        items: [
          'Deterministic lineup optimization with start/sit alternatives and risk indicators',
          'Waiver Wire Sniper: searchable projections with team-specific add/drop rankings',
          'Weekly natural-language reports, with an optional AI explanation layer',
          'Manual projection overrides and manual waiver candidates',
        ],
      },
      {
        group: 'Data',
        items: [
          'Automatic NFL player, roster, injury, stats and schedule ingestion from NFLverse',
          'Weekly stat-line projections from Tank01 via RapidAPI',
          'Canonical player identity with GSIS/ESPN/provider ID crosswalks',
          'Admin CSV imports and a no-signup demo mode',
        ],
      },
    ],
    highlights: [
      'Kept the AI layer isolated from the scoring math, so recommendations are reproducible and testable.',
      'Fantasy points are calculated from projected stat lines for each league, not taken from the provider.',
      'Dashboard requests read cached PostgreSQL records instead of calling the projections API on every page load.',
      'Provider data, roster membership, overrides and results are separate database concepts, with committed SQL migrations.',
      'Domain-focused feature folders and unit tests with Vitest.',
    ],
    stack: [
      { layer: 'Application', tech: 'Next.js 15 App Router, React 19, TypeScript 5' },
      { layer: 'UI', tech: 'Tailwind CSS 4, Lucide React' },
      { layer: 'Server', tech: 'Next.js Server Actions and route handlers' },
      { layer: 'Database', tech: 'PostgreSQL on Neon, Prisma ORM 6' },
      { layer: 'Validation', tech: 'Zod' },
      { layer: 'Data', tech: 'NFLverse releases, Tank01 NFL API (RapidAPI)' },
      { layer: 'AI', tech: 'OpenAI SDK (optional, explanations only)' },
      { layer: 'Testing', tech: 'Vitest' },
    ],
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/makenna615/fantasy-football-app' },
      { label: 'Live demo', note: 'Coming soon: deploying to Vercel' },
    ],
  },
  perfumes: {
    id: 'perfumes',
    name: 'Perfume Studio',
    tagline: 'An AI-powered app for perfume discovery, formula generation and ingredient research.',
    status: 'Personal project · built for my own perfume-making hobby · private',
    overview: [
      'I make perfume as a hobby, and I wanted one place to look up fragrances, find similar ones, and design my own formulas.',
      'Perfume Studio combines a Fragrantica-style perfume lookup with an AI formula builder and an ingredient reference, all behind app-level password protection.',
    ],
    features: [
      {
        group: 'Discover',
        items: ['Find similar perfumes by perfume name', 'Find perfumes by scent notes'],
      },
      {
        group: 'Perfume details',
        items: [
          'Fragrantica-first lookup with a top/middle/base note pyramid',
          'Accords, release year, community rating and review count when available',
          'Handles same-name perfumes across different brands',
        ],
      },
      {
        group: 'DIY perfume builder',
        items: [
          'Build a formula By Vibe, By Ingredients or By Inspiration',
          'Optimization modes: balanced, longevity or projection',
          'Formula visualization and batch scaling',
        ],
      },
      {
        group: 'Ingredient intelligence',
        items: [
          'Ingredient search with role, volatility and usage',
          'Supplier and substitute suggestions',
        ],
      },
    ],
    highlights: [
      'AI prompts and the OpenAI client sit behind a small service and factory layer, so features never call the SDK directly.',
      'Pages and API routes are protected by a signed-cookie session checked in a request proxy.',
      'Feature-based App Router structure with route handlers per feature (search, builder, ingredients).',
      'Charts and motion with Recharts and Framer Motion.',
    ],
    stack: [
      { layer: 'Framework', tech: 'Next.js 16 (App Router)' },
      { layer: 'Language', tech: 'TypeScript' },
      { layer: 'UI', tech: 'React 19, Tailwind CSS 4, Heroicons' },
      { layer: 'Motion and charts', tech: 'Framer Motion, Recharts' },
      { layer: 'AI', tech: 'OpenAI Node SDK' },
      { layer: 'Auth', tech: 'Request proxy + signed cookie session' },
    ],
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/makenna615/perfume-app' },
      { label: 'Live app', note: 'Private (password protected)' },
    ],
  },
};
