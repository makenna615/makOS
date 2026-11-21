import { create } from 'zustand';

export type ThemeId = 'retro' | 'modern' | 'future';

export const THEMES: readonly { id: ThemeId; label: string }[] = [
  { id: 'retro', label: 'Retro' },
  { id: 'modern', label: 'Modern' },
  { id: 'future', label: 'Future' },
];

export const DEFAULT_THEME: ThemeId = 'retro';
export const THEME_STORAGE_KEY = 'makos:theme';

/** Browser UI color (mobile address bar) for each theme. */
const THEME_COLORS: Record<ThemeId, string> = { retro: '#2f6fd6', modern: '#e8ecf8', future: '#02040e' };

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'retro' || value === 'modern' || value === 'future';
}

/** The saved theme, or the default. Anything unexpected in storage is ignored. */
export function readStoredTheme(): ThemeId {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage can be blocked (private mode, sandboxed iframes)
  }
}

interface ThemeStore {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    if (!isThemeId(theme)) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* not remembered across visits, but the switch still works */
    }
    set({ theme });
  },
}));

/** All theme styling hangs off <html data-theme="…">. */
export function applyThemeToDocument(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}
