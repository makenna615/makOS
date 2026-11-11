import { useCallback, useEffect, useState } from 'react';
import { APP_COMPONENTS } from './apps/registry';
import { BootScreen } from './components/BootScreen';
import { Desktop } from './components/Desktop';
import { MobileLauncher } from './components/MobileLauncher';
import { Taskbar } from './components/Taskbar';
import { Window } from './components/Window';
import { MOBILE_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { openApp } from './store/actions';
import { useWindowStore } from './store/windows';

const BOOT_KEY = 'makos:booted';
const TASKBAR_HEIGHT = 40;

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

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* storage can be unavailable (private mode, sandboxed iframes); booting again is harmless */
    }
    setBooting(false);
  }, []);

  const restart = useCallback(() => {
    useWindowStore.getState().closeAll();
    setBooting(true);
  }, []);

  if (booting) return <BootScreen onDone={finishBoot} />;
  if (isMobile) return <MobileLauncher />;
  return <DesktopShell onRestart={restart} />;
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
        <h1 className="visually-hidden">makOS: Makenna Peters, full-stack software engineer</h1>
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
    </div>
  );
}
