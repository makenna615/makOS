import { afterEach, describe, expect, it, vi } from 'vitest';
import { isEmptySpace, runLoop, setWallpaperPaused } from './runtime';

describe('isEmptySpace', () => {
  it('is true for the bare desktop or home screen', () => {
    document.body.innerHTML = '<main class="desktop"><div id="bare"></div></main>';
    expect(isEmptySpace(document.querySelector('.desktop'))).toBe(true);
    expect(isEmptySpace(document.getElementById('bare'))).toBe(true);
  });

  it('is false for anything interactive or on top of the wallpaper', () => {
    document.body.innerHTML = `
      <button id="b"><span id="in-button">x</span></button>
      <section role="dialog"><p id="in-window">text</p></section>
      <nav class="taskbar"><span id="in-taskbar"></span></nav>
      <div class="mobile-intro"><p id="in-card"></p></div>`;
    for (const id of ['b', 'in-button', 'in-window', 'in-taskbar', 'in-card']) {
      expect(isEmptySpace(document.getElementById(id))).toBe(false);
    }
    expect(isEmptySpace(null)).toBe(false);
  });
});

describe('runLoop', () => {
  afterEach(() => setWallpaperPaused(false));

  /** Drives requestAnimationFrame by hand. */
  function fakeFrames() {
    let queued: FrameRequestCallback[] = [];
    let now = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (queued.push(cb), queued.length));
    vi.stubGlobal('cancelAnimationFrame', () => {
      queued = [];
    });
    return (count: number) => {
      for (let i = 0; i < count; i++) {
        now += 17;
        const run = queued;
        queued = [];
        run.forEach((cb) => cb(now));
      }
    };
  }

  it('stops drawing while the wallpaper is covered and resumes after', () => {
    const tick = fakeFrames();
    const draw = vi.fn();
    const stop = runLoop(draw, false);
    tick(3);
    expect(draw).toHaveBeenCalledTimes(3);

    setWallpaperPaused(true);
    tick(5);
    expect(draw).toHaveBeenCalledTimes(3);

    setWallpaperPaused(false);
    tick(2);
    expect(draw).toHaveBeenCalledTimes(5);
    stop();
  });

  it('draws a single still frame with reduced motion', () => {
    const tick = fakeFrames();
    const draw = vi.fn();
    runLoop(draw, true);
    tick(5);
    expect(draw).toHaveBeenCalledTimes(1);
  });
});
