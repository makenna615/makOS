import { isEmptySpace, runLoop, trackPointer, trackSize, type Wallpaper } from './runtime';

/**
 * Future: thousands of glowing particles in the logo's colors fly in and spell "makOS" and
 * "SOFTWARE ENGINEER". The mouse scatters them and they spring back; every few seconds a
 * shockwave ripples through. With reduced motion the text is simply drawn in place.
 */

const LOGO_COLORS = ['#e8412c', '#f6c018', '#5bb33c', '#2a7de1'];
const SUBTITLE_COLOR = '#9fe6ff';
const BACKGROUND = '#02040e';
const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const MAX_PARTICLES = 4500;
const REPEL_RADIUS = 120;

interface Particle {
  tx: number;
  ty: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

/** Sample the text into target points, laid out for a cssW × cssH screen. */
function layoutTargets(cssW: number, cssH: number) {
  // A phone turned sideways has no free space for the text without covering the name card and icons: stars only.
  if (cssH < 500) return { points: [] as Particle[], step: 4 };
  const narrow = cssW < 700;
  const titleSize = narrow ? Math.min(cssW * 0.2, cssH * 0.12) : Math.min(cssW * 0.15, cssH * 0.22);
  const subtitleSize = titleSize * 0.21;
  // Desktop: centered on the screen. The title and subtitle together run from about 0.4 of a title
  // height above cy to 0.8 below it, so cy sits a little above the middle. Phones: below the app grid.
  const cx = cssW / 2;
  const cy = narrow ? cssH * 0.78 : cssH / 2 - titleSize * 0.2;

  const off = document.createElement('canvas');
  off.width = Math.ceil(cssW);
  off.height = Math.ceil(cssH);
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { points: [] as Particle[], step: 4 };
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${titleSize}px ${FONT}`;
  ctx.fillText('makOS', cx, cy);
  const titleWidth = ctx.measureText('makOS').width;
  ctx.font = `bold ${subtitleSize}px ${FONT}`;
  ctx.fillText('SOFTWARE ENGINEER', cx, cy + titleSize * 0.68);

  // Spacing that keeps the particle count reasonable on any screen.
  let step = Math.max(2, Math.round(titleSize / 45));
  const data = ctx.getImageData(0, 0, off.width, off.height).data;
  const sample = () => {
    const points: Particle[] = [];
    const left = cx - titleWidth / 2;
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3]! < 128) continue;
        const isTitle = y < cy + titleSize * 0.45;
        const band = Math.max(0, Math.min(3, Math.floor(((x - left) / titleWidth) * 4)));
        points.push({ tx: x, ty: y, x: 0, y: 0, vx: 0, vy: 0, color: isTitle ? LOGO_COLORS[band]! : SUBTITLE_COLOR });
      }
    }
    return points;
  };
  let points = sample();
  while (points.length > MAX_PARTICLES) {
    step += 1;
    points = sample();
  }
  return { points, step };
}

export const particleName: Wallpaper = async (canvas, { reducedMotion }) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let cssW = 1;
  let cssH = 1;
  let ratio = 1;
  let particles: Particle[] = [];
  let dot = 2;
  let stars: Star[] = [];

  const paintBackground = (alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.globalAlpha = 1;
  };

  const stopSize = trackSize(canvas, { maxRatio: 1.5, maxWidth: 2400 }, (pw, _ph, cw, ch) => {
    cssW = cw;
    cssH = ch;
    ratio = pw / cw;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const previous = particles;
    const layout = layoutTargets(cw, ch);
    particles = layout.points;
    dot = Math.max(1.5, layout.step * 0.6); // gaps between dots keep the glow from washing out
    // New layout: particles fly in from wherever the old ones were (or from random spots on first load).
    particles.forEach((p, i) => {
      const from = previous[i];
      p.x = reducedMotion ? p.tx : (from?.x ?? Math.random() * cw);
      p.y = reducedMotion ? p.ty : (from?.y ?? Math.random() * ch);
    });
    stars = Array.from({ length: Math.round((cw * ch) / 5000) }, () => ({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() < 0.07 ? 1.4 : 0.3 + Math.random() * 0.8,
      speed: 0.5 + Math.random() * 2,
      phase: Math.random() * 6.28,
    }));
    paintBackground(1);
  });

  const pointer = trackPointer(canvas);
  let wave: { x: number; y: number; r: number } | null = null;
  let nextWave = 4000;
  let clock = 0;
  // Clicking or tapping empty space sends a shockwave out from that point (the touch-screen way to play with it).
  const onPointerDown = (event: PointerEvent) => {
    if (reducedMotion || !isEmptySpace(event.target)) return;
    const rect = canvas.getBoundingClientRect();
    wave = { x: event.clientX - rect.left, y: event.clientY - rect.top, r: 0 };
    nextWave = clock + 6000;
  };
  window.addEventListener('pointerdown', onPointerDown);

  const stopLoop = runLoop((elapsed, dt) => {
    clock = elapsed;
    paintBackground(reducedMotion ? 1 : 0.35); // a translucent fill leaves short motion trails
    for (const s of stars) {
      ctx.globalAlpha = reducedMotion ? 0.7 : Math.max(0.1, 0.45 + 0.55 * Math.sin((elapsed / 1000) * s.speed + s.phase));
      ctx.fillStyle = '#e6f6ff';
      ctx.fillRect(s.x, s.y, s.r * 1.4, s.r * 1.4);
    }
    ctx.globalAlpha = 1;

    if (!reducedMotion) {
      if (elapsed > nextWave) {
        wave = { x: cssW * (0.3 + Math.random() * 0.5), y: cssH * (0.25 + Math.random() * 0.35), r: 0 };
        nextWave = elapsed + 6000;
      }
      if (wave) {
        wave.r += dt * 0.9;
        if (wave.r > Math.hypot(cssW, cssH)) wave = null;
      }
    }
    const mouse = pointer.state.pos;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      if (!reducedMotion) {
        p.vx += (p.tx - p.x) * 0.012;
        p.vy += (p.ty - p.y) * 0.012;
        if (mouse) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_RADIUS * REPEL_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const force = ((REPEL_RADIUS - d) / REPEL_RADIUS) * 3.2;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
        if (wave) {
          const wx = p.x - wave.x;
          const wy = p.y - wave.y;
          const wd = Math.sqrt(wx * wx + wy * wy) || 1;
          if (Math.abs(wd - wave.r) < 24) {
            p.vx += (wx / wd) * 2.2;
            p.vy += (wy / wd) * 2.2;
          }
        }
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, dot, dot);
    }
    ctx.globalCompositeOperation = 'source-over';
  }, reducedMotion);
  canvas.classList.add('is-ready');

  return () => {
    stopLoop();
    stopSize();
    pointer.stop();
    window.removeEventListener('pointerdown', onPointerDown);
  };
};
