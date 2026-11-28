import { RANK_LABEL, SUIT_SYMBOL, isRed, type Card } from './solitaire';

/** Draws one card face (or the makOS back) at the given size, for the celebration canvas. */
function paintCard(card: Pick<Card, 'suit' | 'rank'>, w: number, h: number, ratio: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * ratio);
  canvas.height = Math.ceil(h * ratio);
  const g = canvas.getContext('2d');
  if (!g) return canvas;
  g.scale(ratio, ratio);
  const r = Math.max(3, w * 0.07);
  g.beginPath();
  g.roundRect(0.5, 0.5, w - 1, h - 1, r);
  g.fillStyle = '#fff';
  g.fill();
  g.strokeStyle = '#333';
  g.lineWidth = 1;
  g.stroke();
  const color = isRed(card) ? '#c8102e' : '#111';
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.font = `bold ${Math.round(w * 0.24)}px Arial, sans-serif`;
  g.fillText(RANK_LABEL[card.rank] ?? '', w * 0.17, h * 0.05);
  g.font = `${Math.round(w * 0.22)}px Arial, sans-serif`;
  g.fillText(SUIT_SYMBOL[card.suit], w * 0.17, h * 0.05 + w * 0.26);
  g.textBaseline = 'middle';
  g.font = `${Math.round(card.rank > 10 ? w * 0.42 : w * 0.5)}px Arial, sans-serif`;
  g.fillText(card.rank > 10 ? `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}` : SUIT_SYMBOL[card.suit], w / 2, h * 0.55);
  return canvas;
}

export interface Launch {
  /** Foundation piles, bottom (ace) to top (king). */
  foundations: Pick<Card, 'suit' | 'rank'>[][];
  /** Where each foundation sits, in canvas CSS pixels. */
  origins: { x: number; y: number }[];
  cardW: number;
  cardH: number;
}

/**
 * The classic win celebration: one card at a time leaves a foundation, kings first, and bounces across
 * the table, leaving a trail of copies behind it (the canvas is never cleared). Returns a stop function;
 * onDone runs once every card has bounced away.
 */
export function startCelebration(canvas: HTMLCanvasElement, launch: Launch, onDone: () => void): () => void {
  const g = canvas.getContext('2d');
  if (!g) {
    onDone();
    return () => {};
  }
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  g.setTransform(ratio, 0, 0, ratio, 0, 0);
  const { cardW, cardH } = launch;

  // Kings first, cycling through the four foundations, like the original.
  const queue: { card: Pick<Card, 'suit' | 'rank'>; from: number }[] = [];
  for (let level = 12; level >= 0; level--) {
    for (let f = 0; f < launch.foundations.length; f++) {
      const card = launch.foundations[f]?.[level];
      if (card) queue.push({ card, from: f });
    }
  }
  const images = new Map<string, HTMLCanvasElement>();
  const imageFor = (card: Pick<Card, 'suit' | 'rank'>) => {
    const key = `${card.rank}${card.suit}`;
    let img = images.get(key);
    if (!img) images.set(key, (img = paintCard(card, cardW, cardH, ratio)));
    return img;
  };

  let current: { img: HTMLCanvasElement; x: number; y: number; vx: number; vy: number } | null = null;
  const next = () => {
    const item = queue.shift();
    if (!item) return false;
    const origin = launch.origins[item.from] ?? { x: W / 2, y: 0 };
    const speed = (2 + Math.random() * 4) * (Math.random() < 0.5 ? -1 : 1);
    current = { img: imageFor(item.card), x: origin.x, y: origin.y, vx: speed, vy: -Math.random() * 8 };
    return true;
  };
  next();

  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    const steps = last ? Math.min(4, (now - last) / (1000 / 60)) : 1; // physics at a steady 60 steps a second
    last = now;
    let remaining = steps;
    while (current && remaining > 0) {
      const dt = Math.min(1, remaining);
      remaining -= dt;
      current.vy += 0.6 * dt;
      current.x += current.vx * dt;
      current.y += current.vy * dt;
      if (current.y > H - cardH) {
        current.y = H - cardH;
        current.vy = -Math.abs(current.vy) * 0.75;
      }
      g.drawImage(current.img, current.x, current.y, cardW, cardH);
      if (current.x < -cardW || current.x > W) {
        current = null;
        if (!next()) {
          onDone();
          return;
        }
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
