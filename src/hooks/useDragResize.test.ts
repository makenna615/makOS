import { describe, expect, it } from 'vitest';
import { MIN_HEIGHT, MIN_WIDTH } from '../store/windows';
import { resizeRect } from './useDragResize';

const start = { x: 100, y: 100, width: 400, height: 300 };

describe('resizeRect', () => {
  it('grows from the south-east corner without moving the origin', () => {
    expect(resizeRect(start, 'se', 50, 40)).toEqual({ x: 100, y: 100, width: 450, height: 340 });
  });

  it('moves the origin when resizing from the west or north edge', () => {
    expect(resizeRect(start, 'nw', 30, 20)).toEqual({ x: 130, y: 120, width: 370, height: 280 });
  });

  it('pins the opposite edge when hitting the minimum size', () => {
    const r = resizeRect(start, 'w', 1000, 0);
    expect(r.width).toBe(MIN_WIDTH);
    expect(r.x + r.width).toBe(start.x + start.width);
    const n = resizeRect(start, 'n', 0, 1000);
    expect(n.height).toBe(MIN_HEIGHT);
    expect(n.y + n.height).toBe(start.y + start.height);
  });
});
