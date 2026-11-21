import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, applyThemeToDocument, isThemeId, readStoredTheme, useThemeStore } from './theme';

describe('theme', () => {
  it('defaults to retro when nothing is saved', () => {
    expect(readStoredTheme()).toBe('retro');
  });

  it('restores a saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'future');
    expect(readStoredTheme()).toBe('future');
  });

  it('ignores anything unexpected in storage', () => {
    for (const value of ['', 'Modern', 'dark', '"><script>', 'retro ']) {
      localStorage.setItem(THEME_STORAGE_KEY, value);
      expect(readStoredTheme()).toBe('retro');
    }
  });

  it('only accepts known theme ids', () => {
    expect(isThemeId('modern')).toBe(true);
    expect(isThemeId('toString')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });

  it('saves the chosen theme', () => {
    useThemeStore.getState().setTheme('modern');
    expect(useThemeStore.getState().theme).toBe('modern');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('modern');
  });

  it('marks the page with the theme', () => {
    applyThemeToDocument('future');
    expect(document.documentElement.dataset.theme).toBe('future');
  });
});
