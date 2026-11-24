import { useEffect, useRef } from 'react';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { useWindowStore } from '../store/windows';
import { useThemeStore, type ThemeId } from '../theme/theme';
import { setWallpaperPaused, type Wallpaper as WallpaperRenderer } from '../wallpaper/runtime';

/** Each theme's background is its own download, fetched only when that theme is shown. */
const RENDERERS: Record<ThemeId, () => Promise<WallpaperRenderer>> = {
  retro: () => import('../wallpaper/retroSky').then((m) => m.retroSky),
  modern: () => import('../wallpaper/liquidBlobs').then((m) => m.liquidBlobs),
  future: () => import('../wallpaper/particleName').then((m) => m.particleName),
};

/**
 * The animated background for the current theme, drawn on a canvas behind everything else.
 * It fades in once its first frame is ready. If it can't run (no WebGL, an error), no canvas is
 * shown and the theme's still CSS background stays instead.
 *
 * Each run gets its own canvas, created here and removed on cleanup: a canvas can't switch
 * between WebGL and 2D, and a finished run releases its GPU context, which must never be one a
 * newer run is still drawing with.
 */
export function Wallpaper({ screensaver = false }: { screensaver?: boolean }) {
  const theme = useThemeStore((s) => s.theme);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const hostRef = useRef<HTMLDivElement>(null);
  // A maximized window hides the whole wallpaper, so stop animating it until that changes.
  const covered = useWindowStore((s) => Object.values(s.windows).some((w) => w && w.maximized && !w.minimized));

  useEffect(() => {
    if (screensaver) return; // the screensaver copy draws on top of everything and never pauses
    setWallpaperPaused(covered);
    return () => setWallpaperPaused(false);
  }, [covered, screensaver]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'wallpaper';
    host.appendChild(canvas);
    let cancelled = false;
    let stop: (() => void) | null = null;
    RENDERERS[theme]()
      .then((render) => (cancelled ? null : render(canvas, { reducedMotion, ignorePause: screensaver })))
      .then((cleanup) => {
        if (cancelled) cleanup?.();
        else if (cleanup) stop = cleanup;
        else canvas.remove();
      })
      .catch(() => canvas.remove());
    return () => {
      cancelled = true;
      stop?.();
      canvas.remove();
    };
  }, [theme, reducedMotion, screensaver]);

  return <div ref={hostRef} className="wallpaper-host" aria-hidden="true" />;
}
