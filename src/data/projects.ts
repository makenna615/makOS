export interface Screenshot {
  /** Full-size image (opened when the thumbnail is clicked). */
  src: string;
  /** Small cropped preview shown in the gallery. */
  thumb: string;
  alt: string;
  caption: string;
  /** Phone screenshots get a tall thumbnail. */
  mobile?: boolean;
}

export interface Project {
  id: 'fourth-down' | 'perfumes';
  name: string;
  tagline: string;
  status: string;
  /** Landing-page screenshot shown at the top of the Overview tab (size in px, to reserve space while loading). */
  hero: { src: string; alt: string; width: number; height: number };
  overview: string[];
  pipeline?: { title: string; steps: string[] };
  features: { group: string; items: string[] }[];
  highlights: { title?: string; items: string[] }[];
  stack: { layer: string; tech: string }[];
  screenshots: Screenshot[];
  links: { label: string; href?: string; note?: string }[];
}

const shot = (dir: string, name: string, alt: string, caption: string, mobile = false): Screenshot => ({
  src: `/projects/${dir}/${name}.jpg`,
  thumb: `/projects/${dir}/${name}-thumb.jpg`,
  alt,
  caption,
  mobile,
});

export const PROJECTS: Record<Project['id'], Project> = {
  'fourth-down': {
    id: 'fourth-down',
    name: 'Fourth Down',
    tagline: 'A full-stack fantasy football lineup and waiver optimizer.',
    status: 'Personal project · not deployed yet · screenshots show it running locally on real Week 10 NFL data',
    hero: {
      src: '/projects/fourth-down/home-hero.jpg',
      alt: 'Fourth Down landing page: "Make the right call on Fourth Down" beside a sample optimal lineup with projected points and a confidence score.',
      width: 1280,
      height: 800,
    },
    overview: [
      'Add your fantasy team and ESPN-style league settings, and Fourth Down uses current NFL projections to build an optimal lineup, compare start/sit options, and find waiver adds and drops.',
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
        group: 'Game Day',
        items: [
          'Mobile-friendly weekly Game Day dashboard',
          'Optimal lineup scored with your league’s own rules',
          'Start/sit alternatives and a lineup confidence score that accounts for injury status and consistency',
        ],
      },
      {
        group: 'Leagues and rosters',
        items: [
          'Account-based leagues, fantasy teams and rosters',
          'ESPN-style scoring with 53 categories, including negative points',
          'Custom roster slots: WR/TE, FLEX, SUPERFLEX/OP, IR and IDP positions',
        ],
      },
      {
        group: 'Recommendations',
        items: [
          'Deterministic lineup optimizer with manual projection overrides (floor, ceiling, consistency)',
          'Waiver Wire Sniper: search every available player with a current projection, with team-specific add/drop rankings',
          'Weekly scouting report: team grade, strongest and weakest position, riskiest starter and best bench option',
          'Optional OpenAI-written summaries of results the app already calculated',
        ],
      },
      {
        group: 'Data',
        items: [
          'Automatic NFL player, roster, injury, stats and schedule ingestion from NFLverse',
          'Weekly stat-line projections from Tank01 via RapidAPI',
          'Canonical player identity with stable GSIS/ESPN/provider ID crosswalks',
          'Admin CSV imports and a no-signup demo mode',
        ],
      },
    ],
    highlights: [
      {
        items: [
          'Kept the AI layer isolated from the scoring math, so recommendations are reproducible and testable. Without an API key it falls back to a plain-text summary.',
          'Fantasy points are calculated from projected stat lines for each league, not taken from the provider’s totals.',
          'Dashboard requests read cached PostgreSQL records instead of calling the projections API on every page load.',
          'Provider data, roster membership, manual overrides, scoring results and recommendations are separate database concepts, with committed SQL migrations.',
          'Honest about data gaps: provider fields without enough detail are kept but never guessed (for example, field goals without a distance).',
          'Domain-focused feature folders, documented provider contracts and architecture decisions, and unit tests with Vitest.',
        ],
      },
    ],
    stack: [
      { layer: 'Application', tech: 'Next.js 15 App Router, React 19, TypeScript 5' },
      { layer: 'UI', tech: 'Tailwind CSS 4, Lucide React, responsive server/client components' },
      { layer: 'Server', tech: 'Next.js Server Actions and route handlers' },
      { layer: 'Database', tech: 'PostgreSQL on Neon, Prisma ORM 6 with committed SQL migrations' },
      { layer: 'Validation', tech: 'Zod 3' },
      { layer: 'Data', tech: 'NFLverse releases, Tank01 NFL API (RapidAPI)' },
      { layer: 'AI', tech: 'OpenAI SDK 5 (optional, explanations only)' },
      { layer: 'Testing and tooling', tech: 'Vitest 3, Prettier, tsx, Docker Compose (optional)' },
    ],
    screenshots: [
      shot(
        'fourth-down',
        'dashboard',
        'Game Day dashboard for the Fighting Hawks: 110.5 projected points, 73% confidence, the optimal lineup with each player’s projection, and start/sit suggestions.',
        'Game Day dashboard: optimal lineup, confidence and start/sit watch',
      ),
      shot(
        'fourth-down',
        'recommendations',
        'Lineup optimizer listing every roster player’s stored projection with editable floor, ceiling and consistency, next to the generated recommended lineup.',
        'Lineup optimizer with manual overrides',
      ),
      shot(
        'fourth-down',
        'waivers',
        'Waiver Wire Sniper: typing a player name shows available players sorted by projected points.',
        'Waiver Wire Sniper search',
      ),
      shot(
        'fourth-down',
        'roster',
        'Roster depth chart with a slot picker for each of 13 players, and an Add Player form.',
        'Roster and depth chart',
      ),
      shot(
        'fourth-down',
        'settings',
        'League settings: half-PPR scoring and a table of roster slots with starters and maximums per position.',
        'League scoring and roster slots',
      ),
      shot(
        'fourth-down',
        'demo',
        'Demo mode with no account: a sample week’s optimal starters, waiver suggestions and start/sit watch.',
        'No-signup demo mode',
      ),
      shot(
        'fourth-down',
        'dashboard-mobile',
        'The Game Day dashboard on a phone, with the team score, confidence and lineup stacked in one column.',
        'Game Day on mobile',
        true,
      ),
    ],
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/makenna615/fantasy-football-app' },
      { label: 'Live demo', note: 'Not deployed yet' },
    ],
  },
  perfumes: {
    id: 'perfumes',
    name: 'Memories into Perfumes',
    tagline:
      'An AI-powered fragrance studio: find perfumes that truly smell alike, look up accurate note pyramids, and turn a memory into a formula you can actually mix.',
    status: 'Personal project · live on Vercel · public collection page, full app by invitation',
    hero: {
      src: '/projects/perfumes/home.jpg',
      alt: 'Memories into Perfumes home page: "Every memory has a scent." with a chart of how top, heart and base notes fade over eight hours.',
      width: 1280,
      height: 680,
    },
    overview: [
      'I collect perfume (over 100 bottles) and recently started making my own. Good information on how to actually make perfume is surprisingly hard to find, so researching a formula meant piecing together forum threads, supplier pages and note lists.',
      'Memories into Perfumes is the tool I wished I had: explore the perfumes I love, understand what’s in them, and turn an idea into a formula I can mix with the materials I have.',
      'The hard part was trust. General-purpose AI is confidently wrong about perfume: it invents shared notes, treats marketing terms like “white musk” as ingredients you can buy, and suggests dosages that would ruin a formula. Much of the engineering is about making AI reliable in a specialist domain through prompt design, output validation, real data sources and an honest UI.',
    ],
    features: [
      {
        group: 'Discover',
        items: [
          'Find alternatives to a perfume, labelled as a near-identical dupe, close alternative, flanker or same family',
          'See the notes they really share and how they differ',
          'Look up any perfume’s note pyramid, accords, performance and best seasons, including niche and indie releases (found via web search, with sources)',
        ],
      },
      {
        group: 'Compose',
        items: [
          'Describe a memory (“a rainy pine forest at dusk”), list the materials on your shelf, or name a perfume to reinterpret',
          'Get a weighable formula of real, purchasable materials at realistic levels, with safety notes',
          'Batch calculator for any strength (cologne to extrait) and bottle size',
        ],
      },
      {
        group: 'Materials',
        items: [
          'Learn what’s behind a note, e.g. “white musk” → Galaxolide, Habanolide, Ethylene Brassylate',
          'Typical usage, dilution, allergens and safety restrictions',
        ],
      },
      {
        group: 'Shelf',
        items: [
          'My collection, bottle by bottle: add perfumes one at a time or paste a whole list',
          'Each bottle shown as an AI studio render made from the brand’s real product photo',
          'A read-only public version of the collection for visitors',
        ],
      },
    ],
    highlights: [
      {
        title: 'Making AI trustworthy about perfume',
        items: [
          'Every prompt carries a built-in perfumery reference: marketing notes vs. real materials, realistic usage levels and safety rules.',
          'The AI is allowed to say “I don’t know”, and is never asked for things it can’t know, like prices, stock or ratings.',
          'Every AI response is validated before it reaches the screen, and formulas are always normalised to exactly 100%.',
        ],
      },
      {
        title: 'Choosing the model with evidence',
        items: [
          'Ran the same prompts against four OpenAI models and checked answers against published note lists. The most accurate took ~27 seconds; gpt-5.4-mini matched it closely in 4–18 seconds and became the default.',
        ],
      },
      {
        title: 'Real data first, AI second',
        items: [
          'Lookups check Fragrantica first, then the model’s knowledge, and only then a live web search for niche releases, so well-known perfumes stay fast and cheap and web results link to their sources.',
          'A brand check rejects answers about the wrong perfume with the same name.',
        ],
      },
      {
        title: 'Full stack, privacy and security',
        items: [
          'Postgres with versioned migrations and rules enforced in the database. The public collection reads from a query that only selects approved fields, so private notes and photos can’t leak.',
          'Password login with signed sessions and rate limiting. Upgraded Next.js to close known login-bypass vulnerabilities, then tested the fix by trying to break in.',
          'Every server-side image download is checked against private and internal networks (testing caught a real bypass, which I fixed), and uploads are re-encoded to strip hidden data such as GPS location.',
        ],
      },
    ],
    stack: [
      { layer: 'Frontend', tech: 'Next.js 16, React 19, TypeScript, Tailwind CSS 4 (custom, accessible design system)' },
      { layer: 'Backend', tech: 'Next.js route handlers, Neon Postgres, Vercel Blob' },
      { layer: 'AI', tech: 'OpenAI GPT-5.x with web search, and image generation' },
      { layer: 'Hosting', tech: 'Vercel' },
    ],
    screenshots: [
      shot(
        'perfumes',
        'collection',
        'The public collection page, “A shelf of memories”: perfume bottles grouped by scent family on lit display shelves.',
        'Public collection',
      ),
      shot(
        'perfumes',
        'perfume-details',
        'Perfume details for Terre d’Hermès: a description, top, heart and base notes, accord bars, longevity and sillage, and when to wear it.',
        'Perfume details and note pyramid',
      ),
      shot(
        'perfumes',
        'formula',
        'A generated formula called “Dusk After Rain in the Pines”: how the scent unfolds, a strength and bottle-size calculator, and a table of 13 materials with percentages and amounts.',
        'Generated formula with batch calculator',
      ),
      shot(
        'perfumes',
        'shelf',
        'My private shelf: perfume bottles shown as AI studio renders in arched display niches.',
        'My shelf with AI studio renders',
      ),
      shot(
        'perfumes',
        'materials-mobile',
        'The Materials library on a phone: searching Iso E Super shows related woody-amber materials with usage ranges.',
        'Materials library on mobile',
        true,
      ),
    ],
    links: [
      { label: 'See my collection (live)', href: 'https://perfume-app-ruby.vercel.app/collection' },
      { label: 'Source on GitHub', href: 'https://github.com/makenna615/perfume-app' },
      { label: 'Full app', note: 'Password-protected, access by invitation' },
    ],
  },
};
