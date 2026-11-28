/**
 * Solitaire card backs (Game › Deck…). Each one is original artwork drawn as an SVG in a 100×140 box and
 * turned into a data URL once, so every face-down card reuses the same image instead of redrawing it.
 * "makOS" is the theme's own logo back, styled in CSS, so it has no image here.
 */
export const CARD_BACKS = [
  { id: 'logo', name: 'makOS' },
  { id: 'coffee', name: 'Coffee & Code' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'stars', name: 'Starry Night' },
  { id: 'binary', name: 'Binary Rain' },
  { id: 'machine', name: 'Works on My Machine' },
  { id: 'fine', name: 'This Is Fine' },
  { id: 'bsod', name: 'Blue Screen' },
] as const;

export type CardBackId = (typeof CARD_BACKS)[number]['id'];
export const DEFAULT_BACK: CardBackId = 'logo';

export function isCardBackId(value: unknown): value is CardBackId {
  return CARD_BACKS.some((b) => b.id === value);
}

const MONO = 'font-family="Consolas, \'Cascadia Mono\', Menlo, monospace"';
const CENTER = 'text-anchor="middle" dominant-baseline="central"';

/** Small seeded random numbers, so the stars and the rain look the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function flame(x: number, base: number, h: number, w: number) {
  const ih = h * 0.55;
  const iw = w * 0.55;
  return (
    `<path d="M${x - w} ${base} Q${x - w * 1.1} ${base - h * 0.55} ${x} ${base - h} Q${x + w * 0.15} ${base - h * 0.55} ${x + w * 0.55} ${base - h * 0.62} Q${x + w * 1.1} ${base - h * 0.3} ${x + w} ${base} Z" fill="#ff7a1a"/>` +
    `<path d="M${x - iw} ${base} Q${x - iw} ${base - ih * 0.5} ${x} ${base - ih} Q${x + iw} ${base - ih * 0.5} ${x + iw} ${base} Z" fill="#ffd23f"/>`
  );
}

function starburst(cx: number, cy: number, rOut: number, rIn: number, n: number) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = (Math.PI * i) / n - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return `${d}Z`;
}

/** Hand-drawn comic lettering: each letter is a few slightly uneven pen strokes in an 8-unit-tall box. */
const GLYPHS: Record<string, { w: number; d: string }> = {
  T: { w: 5, d: 'M0 .4 L5 0 M2.4 .2 L2.6 8' },
  H: { w: 4.4, d: 'M0 0 L.2 8 M4.4 .1 L4.3 8 M.1 4.2 L4.3 3.9' },
  I: { w: 0.4, d: 'M.3 0 L.1 8' },
  S: { w: 4.4, d: 'M4.1 1.3 C3.5 -.1 .4 -.2 .4 2 C.4 4.1 4.4 3.7 4.4 6.1 C4.4 8.5 .6 8.4 0 6.8' },
  F: { w: 4, d: 'M.2 0 L0 8 M.1 .3 L4 0 M.1 3.9 L3.2 3.7' },
  N: { w: 4.6, d: 'M0 8 L.2 0 L4.4 8 L4.6 .1' },
  e: { w: 4.8, d: 'M.4 4.2 L4.6 3.9 C4.8 .3 .7 -.3 .3 3.8 C-.1 8.4 3.7 8.7 4.8 6.6' },
  '.': { w: 0.8, d: 'M.4 7.7 L.45 7.75' },
};
function handLetter(text: string, cx: number, cy: number, h: number) {
  let x = 0;
  let d = '';
  [...text].forEach((ch, i) => {
    if (ch === ' ') {
      x += 3.6;
      return;
    }
    const g = GLYPHS[ch];
    if (!g) return;
    if (i) x += 1.7;
    // Shift every x coordinate of the glyph along by the pen position.
    d += `${g.d
      .replace(/([ML]) ?(-?[\d.]+) (-?[\d.]+)/g, (_m, c: string, a: string, b: string) => `${c}${(+a + x).toFixed(2)} ${b}`)
      .replace(
        /C(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)/g,
        (_m, a: string, b: string, c: string, e: string, f: string, g2: string) => `C${(+a + x).toFixed(2)} ${b} ${(+c + x).toFixed(2)} ${e} ${(+f + x).toFixed(2)} ${g2}`,
      )} `;
    x += g.w;
  });
  const s = h / 8;
  return `<path transform="translate(${(cx - (x * s) / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)}) scale(${s.toFixed(3)})" d="${d}" fill="none" stroke="#1c120d" stroke-width="${(1.05 / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function coffee() {
  return (
    `<defs><pattern id="p" width="22" height="18" patternUnits="userSpaceOnUse"><text x="2" y="12" font-size="9" ${MONO} fill="rgba(255,255,255,.1)">{ }</text></pattern>` +
    '<linearGradient id="m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffdf8"/><stop offset=".7" stop-color="#f1ebdf"/><stop offset="1" stop-color="#d9cfbd"/></linearGradient>' +
    '<filter id="s" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>' +
    '<rect width="100" height="140" fill="#5c3b25"/><rect width="100" height="140" fill="url(#p)"/>' +
    '<g stroke="rgba(255,255,255,.7)" stroke-width="2" fill="none" stroke-linecap="round"><path d="M40 50 Q36 44 40 38 Q44 32 40 26"/><path d="M50 50 Q46 44 50 38 Q54 32 50 24"/><path d="M60 50 Q56 44 60 38 Q64 32 60 26"/></g>' +
    '<ellipse cx="48" cy="105.5" rx="19" ry="2.2" fill="rgba(0,0,0,.35)" filter="url(#s)"/>' +
    '<path d="M66 68 Q80 68 80 80 Q80 92 66 92" stroke="#e6dccb" stroke-width="5.5" fill="none"/>' +
    '<path d="M28 58 H68 V100 Q68 105 63 105 H33 Q28 105 28 100 Z" fill="url(#m)"/>' +
    '<ellipse cx="48" cy="58" rx="20" ry="4" fill="#e6dccb"/><ellipse cx="48" cy="58.6" rx="17.5" ry="3" fill="#3b2414"/><ellipse cx="46" cy="58.4" rx="9" ry="1.3" fill="#8a5a33" opacity=".6"/>' +
    '<rect x="32" y="64" width="3.5" height="34" rx="1.75" fill="#fff" opacity=".8"/>' +
    `<text x="49" y="82" font-size="12" font-weight="bold" ${MONO} ${CENTER} fill="#5c3b25">&lt;/&gt;</text>`
  );
}

function terminal() {
  const lines: [string, string][] = [
    ['$ npm run deal', '#39ff88'],
    ['&gt; shuffling 52', '#8aa0b4'],
    ['&gt; cards... ok', '#8aa0b4'],
    ['', ''],
    ['$ git commit', '#39ff88'],
    ['  -m &quot;win&quot;', '#39ff88'],
    ['&gt; 1 file', '#8aa0b4'],
    ['  changed', '#8aa0b4'],
    ['', ''],
    ['$ ', '#39ff88'],
  ];
  let out =
    '<rect width="100" height="140" fill="#0b0f14"/><rect width="100" height="15" fill="#2a2f38"/>' +
    '<circle cx="8" cy="7.5" r="2.6" fill="#ff5f57"/><circle cx="16" cy="7.5" r="2.6" fill="#febc2e"/><circle cx="24" cy="7.5" r="2.6" fill="#28c840"/>';
  lines.forEach(([text, color], i) => {
    if (text) out += `<text x="7" y="${32 + i * 10.5}" font-size="7.6" fill="${color}" ${MONO} xml:space="preserve">${text}</text>`;
  });
  return `${out}<rect x="16" y="120" width="5" height="8" fill="#39ff88"/>`;
}

function stars() {
  let out =
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1233"/><stop offset=".75" stop-color="#2b2f6b"/><stop offset="1" stop-color="#4a3f7d"/></linearGradient></defs><rect width="100" height="140" fill="url(#g)"/>';
  const r = rng(7);
  for (let i = 0; i < 46; i++) {
    out += `<circle cx="${(r() * 100).toFixed(1)}" cy="${(r() * 96).toFixed(1)}" r="${(0.4 + r() * 0.9).toFixed(2)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  }
  return (
    `${out}<circle cx="72" cy="30" r="10" fill="#f6f1c7"/><circle cx="77" cy="26" r="9" fill="#11183d"/>` +
    '<path d="M0 110 L18 88 L30 98 L48 76 L64 96 L76 86 L100 106 V140 H0 Z" fill="#1a2150"/>' +
    '<path d="M0 122 L22 106 L40 116 L58 102 L80 118 L100 110 V140 H0 Z" fill="#0b1030"/>'
  );
}

function binary() {
  let out = '<rect width="100" height="140" fill="#031a0e"/>';
  const r = rng(42);
  for (let c = 0; c < 9; c++) {
    const head = r() * 140;
    const len = 50 + r() * 60;
    for (let y = 6; y < 140; y += 9) {
      const d = (head - y + 280) % 140;
      if (d > len) continue;
      const a = d < 9 ? 1 : 0.85 - (d / len) * 0.75;
      out += `<text x="${5 + c * 11}" y="${y}" font-size="8.5" ${MONO} fill="${d < 9 ? '#d6ffe6' : '#2bff88'}" opacity="${a.toFixed(2)}">${r() > 0.5 ? 1 : 0}</text>`;
    }
  }
  return out;
}

function machine() {
  const burst = starburst(50, 70, 45, 39, 28);
  const font = `${CENTER} font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif" fill="#3a3a36"`;
  return (
    '<defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="rgba(0,0,0,.07)"/></pattern>' +
    '<filter id="d" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="1.8" flood-color="#000" flood-opacity=".35"/></filter>' +
    '<linearGradient id="s" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eef0f3"/></linearGradient>' +
    `<clipPath id="c"><path d="${burst}"/></clipPath></defs>` +
    '<rect width="100" height="140" fill="#ffc933"/><rect width="100" height="140" fill="url(#p)"/>' +
    `<path d="${burst}" fill="url(#s)" stroke="#d9dde3" stroke-width=".8" stroke-linejoin="round" filter="url(#d)"/>` +
    '<g clip-path="url(#c)"><path d="M0 0 H100 V60 Q50 84 0 56 Z" fill="#fff" opacity=".55"/></g>' +
    `<text x="50" y="54" font-size="12" ${font}>works on</text>` +
    `<text x="50" y="67.6" font-size="20" font-weight="bold" ${font}>my</text>` +
    `<text x="50" y="87" font-size="12" ${font}>machine</text>`
  );
}

/** A storybook monkey sipping coffee while the room burns. */
function fine() {
  const ink = 'stroke="#3b2418" stroke-width=".8" stroke-linejoin="round" stroke-linecap="round"';
  const skin = '#f4cda6';
  return (
    '<defs>' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="9" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .12  0 0 0 .07 0"/></filter>' +
    '<filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="2"/><feDisplacementMap in="SourceGraphic" scale="4"/><feGaussianBlur stdDeviation=".6"/></filter>' +
    '<radialGradient id="g" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#ffcf6b"/><stop offset=".6" stop-color="#f59a45"/><stop offset="1" stop-color="#d9662e"/></radialGradient>' +
    '<radialGradient id="f" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#d48a4c"/><stop offset=".55" stop-color="#b8672f"/><stop offset="1" stop-color="#8a451c"/></radialGradient>' +
    '<radialGradient id="k" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fde6cc"/><stop offset="1" stop-color="#e9b98c"/></radialGradient>' +
    '<linearGradient id="m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#e8dccb"/></linearGradient>' +
    '<filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter></defs>' +
    '<rect width="100" height="140" fill="url(#g)"/>' +
    // Smoke under the ceiling, a window and the floor, painted softly.
    '<g filter="url(#b)"><path d="M-4 -4 H104 V22 Q90 30 78 22 Q66 31 54 22 Q42 31 30 22 Q18 31 6 22 Q0 26 -4 22 Z" fill="#6e4b42" opacity=".85"/>' +
    '<rect x="64" y="52" width="24" height="20" fill="#e9d3a8" opacity=".8"/><rect x="-4" y="110" width="108" height="34" fill="#8c4a26"/></g>' +
    `<rect x="64" y="52" width="24" height="20" fill="none" ${ink}/><path d="M76 52 V72 M64 62 H88" ${ink} fill="none"/>` +
    '<g filter="url(#s)" opacity=".55"><ellipse cx="9" cy="86" rx="13" ry="22" fill="#ffd56b"/><ellipse cx="91" cy="82" rx="15" ry="25" fill="#ffd56b"/></g>' +
    '<ellipse cx="45" cy="118" rx="20" ry="3" fill="#4a2010" opacity=".45" filter="url(#s)"/>' +
    `<g opacity=".95">${flame(9, 112, 50, 10)}${flame(93, 112, 58, 10)}${flame(80, 112, 30, 7)}${flame(22, 112, 22, 6)}</g>` +
    // Stool and tail.
    '<path d="M33 103 L30 118 M57 103 L60 118 M38 104 L37 118 M52 104 L53 118" stroke="#7a4421" stroke-width="2.6" stroke-linecap="round"/>' +
    `<ellipse cx="45" cy="102" rx="15" ry="3.6" fill="#c98a4a" ${ink}/>` +
    '<path d="M55 97 Q74 100 75 86 Q76 74 67 76 Q61 78 65 84" fill="none" stroke="#8f4a1f" stroke-width="3.4" stroke-linecap="round"/>' +
    // Body, belly, feet.
    `<path d="M45 72 C39 72 34 80 34 90 C34 98 38.5 101.5 45 101.5 C51.5 101.5 56 98 56 90 C56 80 51 72 45 72 Z" fill="url(#f)" ${ink}/>` +
    '<ellipse cx="45" cy="94.5" rx="7" ry="6" fill="url(#k)" opacity=".95"/>' +
    `<ellipse cx="37.5" cy="100" rx="5" ry="2.8" fill="url(#f)" ${ink}/><ellipse cx="52.5" cy="100" rx="5" ry="2.8" fill="url(#f)" ${ink}/>` +
    '<ellipse cx="45" cy="74.5" rx="8" ry="2.6" fill="#5a2a10" opacity=".35" filter="url(#s)"/>' +
    // Ears and head.
    `<circle cx="31" cy="60" r="5.6" fill="url(#f)" ${ink}/><circle cx="31" cy="60" r="3" fill="${skin}"/>` +
    `<circle cx="59" cy="60" r="5.6" fill="url(#f)" ${ink}/><circle cx="59" cy="60" r="3" fill="${skin}"/>` +
    `<circle cx="45" cy="60" r="13.5" fill="url(#f)" ${ink}/>` +
    '<path d="M45 72 Q35 72 35.5 64 Q33 55 40.5 54.5 Q45 55 45 57.5 Q45 55 49.5 54.5 Q57 55 54.5 64 Q55 72 45 72 Z" fill="url(#k)"/>' +
    // Face.
    '<circle cx="41.5" cy="60" r="1.35" fill="#2a1a12"/><circle cx="48.5" cy="60" r="1.35" fill="#2a1a12"/>' +
    '<circle cx="44" cy="64.3" r=".55" fill="#6b3f2a"/><circle cx="46" cy="64.3" r=".55" fill="#6b3f2a"/>' +
    '<path d="M41.8 67 Q45 69.6 48.2 67" stroke="#4a2e22" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
    '<circle cx="38" cy="65" r="2.2" fill="#ff8f8f" opacity=".35"/><circle cx="52" cy="65" r="2.2" fill="#ff8f8f" opacity=".35"/>' +
    // Paws around the mug, and steam.
    `<path d="M50 84 Q54 84 54 87 Q54 90 50 90" stroke="#fff" stroke-width="1.6" fill="none"/><rect x="40" y="82" width="10.5" height="10" rx="1.6" fill="url(#m)" ${ink}/>` +
    `<circle cx="40.6" cy="88.6" r="2.1" fill="url(#f)" ${ink}/><circle cx="49.9" cy="88.6" r="2.1" fill="url(#f)" ${ink}/>` +
    '<path d="M43 79 Q41.5 76.5 43 74 M47.5 79 Q46 76.5 47.5 74" stroke="rgba(255,255,255,.75)" stroke-width="1" fill="none" stroke-linecap="round"/>' +
    // Comic speech balloon, hand-lettered.
    `<path d="M50 20 C73 20 88 25 88 32.5 C88 40 74 44.5 56 44.6 Q52 49 47 51 Q49.5 47.5 49 44.6 C28 44 12 40 12 32.5 C12 25 27 20 50 20 Z" fill="#fff" ${ink}/>` +
    handLetter('THIS IS FINe.', 50, 32.6, 7.4) +
    // A light paper grain over everything.
    '<rect width="100" height="140" filter="url(#n)"/>'
  );
}

/** A nod to the site's own blue-screen easter egg. Big type, so it still reads on small cards. */
function bsod() {
  const font = 'font-family="\'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif" fill="#fff"';
  let out = '<rect width="100" height="140" fill="#0a63d1"/>';
  // The face sits below the top ~16% of the card, the strip that shows on stacked face-down cards.
  out += `<text x="9" y="48" font-size="36" font-weight="300" ${font}>:(</text>`;
  ['makOS ran into', 'a problem and', 'needs to', 'reshuffle.'].forEach((t, i) => {
    out += `<text x="10" y="${67 + i * 12.4}" font-size="10.8" ${font}>${t}</text>`;
  });
  // A made-up QR-style square (just decoration).
  out += '<rect x="10" y="113" width="20" height="20" fill="#fff"/>';
  const r = rng(11);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const finder = (x < 3 && y < 3) || (x > 4 && y < 3) || (x < 3 && y > 4);
      const on = finder ? !(x % 5 === 1 && y % 5 === 1) : r() > 0.5;
      if (on) out += `<rect x="${(11.2 + x * 2.2).toFixed(1)}" y="${(114.2 + y * 2.2).toFixed(1)}" width="2.3" height="2.3" fill="#0a63d1"/>`;
    }
  }
  return `${out}<text x="34" y="120" font-size="5.4" ${font}>Stop code:</text><text x="34" y="128" font-size="5.4" ${font}>TOO_MANY_KINGS</text>`;
}

const ART: Record<Exclude<CardBackId, 'logo'>, () => string> = { coffee, terminal, stars, binary, machine, fine, bsod };
const cache = new Map<CardBackId, string>();

/** The back's artwork as a CSS `url(...)` (built on first use), or null for the theme's own makOS back. */
export function cardBackImage(id: CardBackId): string | null {
  if (id === 'logo') return null;
  let url = cache.get(id);
  if (!url) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice">${ART[id]()}</svg>`;
    url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    cache.set(id, url);
  }
  return url;
}
