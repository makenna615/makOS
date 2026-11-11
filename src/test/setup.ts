import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
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

afterEach(() => {
  cleanup();
  useWindowStore.setState({ windows: {}, order: [], viewport: { width: 1280, height: 760 } });
  sessionStorage.clear();
});
