import { useEffect, useRef, useState } from 'react';
import { APPS, DESKTOP_APPS, LINKS, type AppId } from '../data/apps';
import { APP_COMPONENTS } from '../apps/registry';
import { Clock } from './Clock';
import { Icon } from './Icons';
import { ThemeSwitch } from './ThemeSwitch';
import { Wallpaper } from './Wallpaper';
import { WeatherWidget } from './Weather';

/**
 * Small screens get a phone-style launcher instead of draggable windows:
 * a list of apps, each opening as a full-screen sheet with a Back button.
 */
export function MobileLauncher({ onRestart }: { onRestart: () => void }) {
  // Sheets opened from inside other sheets (Games → Bug Sweeper) stack up, so Back returns one level.
  const [stack, setStack] = useState<AppId[]>([]);
  const openId = stack.at(-1) ?? null;
  const openFromSheet = (id: AppId) =>
    setStack((s) => (s.includes(id) ? s.slice(0, s.indexOf(id) + 1) : [...s, id]));
  const lastId = useRef<AppId | null>(null);
  const sheetHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (openId) sheetHeading.current?.focus();
    else if (lastId.current) document.querySelector<HTMLElement>(`[data-app="${lastId.current}"]`)?.focus();
  }, [openId]);

  if (openId) {
    const app = APPS[openId];
    const Content = APP_COMPONENTS[openId];
    return (
      <div className="mobile">
        <section className="mobile-sheet" aria-labelledby="mobile-sheet-title">
          <header className="mobile-sheet-bar">
            <button type="button" className="mobile-back" onClick={() => setStack((s) => s.slice(0, -1))}>
              <span aria-hidden="true">‹</span> Back
            </button>
            <h2 id="mobile-sheet-title" ref={sheetHeading} tabIndex={-1}>
              {app.label}
            </h2>
          </header>
          <div className="mobile-sheet-body window-body">
            <Content key={openId} onOpenApp={openFromSheet} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mobile">
      <Wallpaper />
      <header className="mobile-status">
        <span className="mobile-brand">
          <Icon name="logo" size={20} /> makOS
        </span>
        <span className="mobile-status-right">
          <WeatherWidget />
          <span className="tray-divider" aria-hidden="true" />
          <Clock />
        </span>
      </header>
      <main className="mobile-home">
        <div className="mobile-theme">
          <ThemeSwitch />
        </div>
        <div className="mobile-intro">
          <h1>Makenna Peters</h1>
          <p>Full-stack software engineer: Ruby on Rails, React and TypeScript, 4+ years in K-12 EdTech.</p>
          <a className="btn" href={LINKS.resumeTxt}>
            Plain-text resume
          </a>
        </div>
        <ul className="mobile-apps" aria-label="Apps">
          {DESKTOP_APPS.map((id) => (
            <li key={id}>
              <button
                type="button"
                className="mobile-app"
                data-app={id}
                onClick={() => {
                  lastId.current = id;
                  setStack([id]);
                }}
              >
                <span className="desktop-icon-art">
                  <Icon name={APPS[id].icon} size={40} />
                </span>
                <span>{APPS[id].label}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn mobile-restart" onClick={onRestart}>
          <Icon name="power" size={16} /> Restart makOS
        </button>
      </main>
    </div>
  );
}
