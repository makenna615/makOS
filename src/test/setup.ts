import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useWindowStore } from '../store/windows';

// jsdom has no matchMedia; default to a desktop-sized, motion-friendly environment.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// No real network in unit tests: the weather widget falls back to just "Fargo, ND".
// Tests that need weather data stub fetch themselves.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network is disabled in unit tests'))));
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  useWindowStore.setState({ windows: {}, order: [], viewport: { width: 1280, height: 760 } });
  sessionStorage.clear();
});
