import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_COMPONENTS } from './apps/registry';
import { BlueScreen, type BlueScreenCause } from './components/BlueScreen';
import { BootScreen } from './components/BootScreen';
import { Desktop } from './components/Desktop';
import { MobileLauncher } from './components/MobileLauncher';
import { Screensaver } from './components/Screensaver';
import { Taskbar } from './components/Taskbar';
import { ThemeSwitch } from './components/ThemeSwitch';
import { Wallpaper } from './components/Wallpaper';
import { Window } from './components/Window';
import { BLUE_SCREEN_EVENT } from './apps/terminalCommands';
import { MOBILE_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { openApp } from './store/actions';
import { useWindowStore } from './store/windows';
import { applyThemeToDocument, useThemeStore } from './theme/theme';

const BOOT_KEY = 'makos:booted';
const TASKBAR_HEIGHT = 40;
/** Easter egg: this many restarts within RESTART_WINDOW_MS shows the joke blue screen. */
export const RESTARTS_FOR_BLUE_SCREEN = 3;
export const RESTART_WINDOW_MS = 5 * 60 * 1000;

function hasBootedThisSession() {
  try {
    return sessionStorage.getItem(BOOT_KEY) === '1';
  } catch {
    return false;
  }
}

export function App() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [booting, setBooting] = useState(() => !hasBootedThisSession());
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => applyThemeToDocument(theme), [theme]);

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* storage can be unavailable (private mode, sandboxed iframes); booting again is harmless */
    }
    setBooting(false);
  }, []);

  const [blueScreen, setBlueScreen] = useState<null | BlueScreenCause>(null);
  const restarts = useRef<number[]>([]);

  const restart = useCallback(() => {
    useWindowStore.getState().closeAll();
    const now = Date.now();
    restarts.current = [...restarts.current.filter((t) => now - t < RESTART_WINDOW_MS), now];
    if (restarts.current.length >= RESTARTS_FOR_BLUE_SCREEN) {
      restarts.current = [];
      setBlueScreen('restart');
    } else {
      setBooting(true);
    }
  }, []);

  // Easter egg shortcut: Ctrl+Alt+B (for bug). Uses the key's position, so it works on any keyboard layout.
  useEffect(() => {
    if (booting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && !event.metaKey && event.code === 'KeyB') {
        event.preventDefault();
        setBlueScreen('keys');
      }
    };
    // The terminal's "rm -rf /" asks for it too.
    const onRequest = () => setBlueScreen('terminal');
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(BLUE_SCREEN_EVENT, onRequest);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(BLUE_SCREEN_EVENT, onRequest);
    };
  }, [booting]);

  const closeBlueScreen = useCallback(() => {
    // After the restart version, the windows were already closed: land on About Me again, like a fresh start.
    if (blueScreen === 'restart' && !isMobile) openApp('about', null);
    setBlueScreen(null);
  }, [blueScreen, isMobile]);

  const restartFromBlueScreen = useCallback(() => {
    setBlueScreen(null);
    useWindowStore.getState().closeAll();
    setBooting(true);
  }, []);

  if (booting) return <BootScreen onDone={finishBoot} />;
  return (
    <>
      {isMobile ? <MobileLauncher onRestart={restart} /> : <DesktopShell onRestart={restart} />}
      {blueScreen && <BlueScreen cause={blueScreen} onClose={closeBlueScreen} onRestart={restartFromBlueScreen} />}
    </>
  );
}

function DesktopShell({ onRestart }: { onRestart: () => void }) {
  const order = useWindowStore((s) => s.order);
  const windows = useWindowStore((s) => s.windows);
  const setViewport = useWindowStore((s) => s.setViewport);

  // Recruiters land on "About Me" straight away.
  useEffect(() => {
    if (useWindowStore.getState().order.length === 0) openApp('about', null);
  }, []);

  useEffect(() => {
    const sync = () => setViewport({ width: window.innerWidth, height: window.innerHeight - TASKBAR_HEIGHT });
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [setViewport]);

  // Render windows in a stable (opened) order so React never re-mounts them on focus
  // changes; stacking comes from z-index instead.
  const ids = Object.keys(windows) as (keyof typeof windows)[];

  return (
    <div className="screen">
      <a className="skip-link" href="#taskbar-start">
        Skip to taskbar
      </a>
      <main className="desktop" aria-label="makOS desktop">
        <Wallpaper />
        <h1 className="visually-hidden">makOS: Makenna Peters, full-stack software engineer</h1>
        <ThemeSwitch />
        <Desktop />
        {ids.map((id) => {
          const Content = APP_COMPONENTS[id];
          return (
            <Window key={id} id={id} zIndex={10 + order.indexOf(id)}>
              <Content onOpenApp={(next) => openApp(next)} />
            </Window>
          );
        })}
      </main>
      <Taskbar onRestart={onRestart} />
      <Screensaver />
    </div>
  );
}
