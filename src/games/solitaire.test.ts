import { describe, expect, it } from 'vitest';
import {
  autoPlayAll,
  autoToFoundation,
  canPlace,
  deal,
  displayScore,
  drawFromStock,
  isWon,
  move,
  winBonus,
  type Card,
  type GameState,
} from './solitaire';

const c = (rank: number, suit: Card['suit'], up = true): Card => ({ rank, suit, up });

function empty(overrides: Partial<GameState> = {}): GameState {
  return {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    draw: 1,
    scoring: 'standard',
    score: 0,
    recycles: 0,
    ...overrides,
  };
}

describe('solitaire rules', () => {
  it('deals 28 cards to the tableau with only the top of each column face up', () => {
    const game = deal(1, 'standard');
    expect(game.tableau.map((p) => p.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(game.stock).toHaveLength(24);
    for (const pile of game.tableau) {
      expect(pile.filter((x) => x.up)).toHaveLength(1);
      expect(pile[pile.length - 1]!.up).toBe(true);
    }
    const all = [...game.stock, ...game.tableau.flat()];
    expect(new Set(all.map((x) => `${x.rank}${x.suit}`)).size).toBe(52);
  });

  it('only stacks alternating colors in descending order, and kings on empty columns', () => {
    const game = empty({ tableau: [[c(8, 'spades')], [], [], [], [], [], []] });
    expect(canPlace(game, [c(7, 'hearts')], { pile: 'tableau', col: 0 })).toBe(true);
    expect(canPlace(game, [c(7, 'clubs')], { pile: 'tableau', col: 0 })).toBe(false);
    expect(canPlace(game, [c(6, 'hearts')], { pile: 'tableau', col: 0 })).toBe(false);
    expect(canPlace(game, [c(12, 'hearts')], { pile: 'tableau', col: 1 })).toBe(false);
    expect(canPlace(game, [c(13, 'hearts')], { pile: 'tableau', col: 1 })).toBe(true);
  });

  it('builds foundations up by suit from the ace', () => {
    const game = empty({ foundations: [[c(1, 'hearts')], [], [], []] });
    expect(canPlace(game, [c(2, 'hearts')], { pile: 'foundation', col: 0 })).toBe(true);
    expect(canPlace(game, [c(2, 'diamonds')], { pile: 'foundation', col: 0 })).toBe(false);
    expect(canPlace(game, [c(1, 'spades')], { pile: 'foundation', col: 1 })).toBe(true);
    expect(canPlace(game, [c(2, 'spades')], { pile: 'foundation', col: 1 })).toBe(false);
  });

  it('moves a run, turns up the card left behind, and scores it', () => {
    const game = empty({
      tableau: [[c(5, 'clubs', false), c(9, 'hearts'), c(8, 'spades')], [c(10, 'clubs')], [], [], [], [], []],
    });
    const next = move(game, { pile: 'tableau', col: 0, index: 1 }, { pile: 'tableau', col: 1 })!;
    expect(next.tableau[1]!.map((x) => x.rank)).toEqual([10, 9, 8]);
    expect(next.tableau[0]).toEqual([c(5, 'clubs', true)]);
    expect(next.score).toBe(5);
    expect(move(game, { pile: 'tableau', col: 0, index: 0 }, { pile: 'tableau', col: 1 })).toBeNull(); // face-down
  });

  it('scores waste and foundation moves', () => {
    let game = empty({ waste: [c(1, 'spades')], tableau: [[c(2, 'hearts')], [], [], [], [], [], []] });
    game = autoToFoundation(game, { pile: 'waste' })!;
    expect(game.score).toBe(10);
    game = move(game, { pile: 'foundation', col: 0 }, { pile: 'tableau', col: 0 })!;
    expect(game.score).toBe(0); // -15, floored at zero
  });

  it('draws from the stock and recycles the waste with a penalty', () => {
    let game = empty({ stock: [c(3, 'clubs', false), c(4, 'clubs', false)], score: 150 });
    game = drawFromStock(game)!;
    expect(game.waste.map((x) => x.rank)).toEqual([4]);
    expect(game.waste[0]!.up).toBe(true);
    game = drawFromStock(drawFromStock(game)!)!;
    expect(game.stock).toHaveLength(2);
    expect(game.waste).toHaveLength(0);
    expect(game.score).toBe(50);
  });

  it('draws three at a time and limits Vegas passes', () => {
    const stock = [1, 2, 3, 4].map((r) => c(r, 'clubs', false));
    let game = empty({ stock, draw: 3, scoring: 'vegas' });
    game = drawFromStock(game)!;
    expect(game.waste.map((x) => x.rank)).toEqual([4, 3, 2]);
    const one = drawFromStock(drawFromStock(empty({ stock: [c(1, 'clubs', false)], scoring: 'vegas' }))!);
    expect(one).toBeNull(); // Draw One in Vegas: a single pass
  });

  it('auto-plays everything it can and detects a win', () => {
    const foundations = (['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit) =>
      Array.from({ length: 12 }, (_, i) => c(i + 1, suit)),
    );
    const game = empty({
      foundations,
      tableau: [[c(13, 'spades')], [c(13, 'hearts')], [c(13, 'diamonds')], [], [], [], []],
      waste: [c(13, 'clubs')],
    });
    const done = autoPlayAll(game);
    expect(isWon(done)).toBe(true);
    expect(done.score).toBe(40);
  });

  it('works out the timed score and win bonus', () => {
    const game = empty({ score: 100 });
    expect(displayScore(game, 65, true, 0)).toBe(88);
    expect(winBonus(game, 140, true)).toBe(5000);
    expect(winBonus(game, 20, true)).toBe(0);
    expect(winBonus(game, 140, false)).toBe(0);
    expect(displayScore(empty({ scoring: 'none' }), 10, true, 0)).toBeNull();
  });
});
