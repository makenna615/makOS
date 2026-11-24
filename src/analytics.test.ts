import { describe, expect, it } from 'vitest';
import { shouldTrack } from './analytics';

describe('analytics', () => {
  const live = { prod: true, hostname: 'mak-os-portfolio.vercel.app', doNotTrack: null };
  it('only counts visits on the deployed site', () => {
    expect(shouldTrack(live)).toBe(true);
    expect(shouldTrack({ ...live, prod: false })).toBe(false);
    expect(shouldTrack({ ...live, hostname: 'localhost' })).toBe(false);
    expect(shouldTrack({ ...live, hostname: '127.0.0.1' })).toBe(false);
  });
  it('respects Do Not Track and Global Privacy Control', () => {
    expect(shouldTrack({ ...live, doNotTrack: '1' })).toBe(false);
    expect(shouldTrack({ ...live, gpc: true })).toBe(false);
  });
});
