/**
 * Klondike solitaire rules: pure functions over an immutable game state, so every move is easy to
 * test and undo. Scoring follows the classic desktop version:
 *
 * Standard: waste → tableau +5, waste → foundation +10, tableau → foundation +10, turning a tableau
 *   card face up +5, foundation → tableau −15, recycling the waste −100 (Draw One) or −20 (Draw Three).
 *   In a timed game, −2 every 10 seconds, plus a bonus of 700,000 ÷ seconds for winning (30s or more).
 * Vegas: start at −52, +5 for each card played to a foundation (−5 if taken back). Draw One allows a
 *   single pass through the stock, Draw Three allows three.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const SUIT_SYMBOL: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
export const RANK_LABEL = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
const RANK_NAME = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];

export interface Card {
  suit: Suit;
  /** 1 (Ace) to 13 (King). */
  rank: number;
  up: boolean;
}

export type DrawMode = 1 | 3;
export type Scoring = 'standard' | 'vegas' | 'none';

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  draw: DrawMode;
  scoring: Scoring;
  /** Score from moves (the time penalty and win bonus are worked out separately). */
  score: number;
  /** How many times the waste has been turned back into the stock. */
  recycles: number;
}

export type Source = { pile: 'waste' } | { pile: 'foundation'; col: number } | { pile: 'tableau'; col: number; index: number };
export type Target = { pile: 'foundation'; col: number } | { pile: 'tableau'; col: number };

export const isRed = (card: Pick<Card, 'suit'>) => card.suit === 'hearts' || card.suit === 'diamonds';
export const cardName = (card: Pick<Card, 'suit' | 'rank'>) => `${RANK_NAME[card.rank]} of ${card.suit}`;

/** A shuffled, freshly dealt game. */
export function deal(draw: DrawMode, scoring: Scoring, random: () => number = Math.random): GameState {
  const deck: Card[] = [];
  for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, up: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const tableau: Card[][] = [];
  for (let col = 0; col < 7; col++) {
    const pile = deck.splice(0, col + 1);
    pile[pile.length - 1]!.up = true;
    tableau.push(pile);
  }
  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    draw,
    scoring,
    score: scoring === 'vegas' ? -52 : 0,
    recycles: 0,
  };
}

/** Passes through the stock allowed in Vegas scoring (unlimited otherwise). */
function maxRecycles(state: GameState) {
  if (state.scoring !== 'vegas') return Infinity;
  return state.draw === 1 ? 0 : 2;
}

export function canRecycle(state: GameState) {
  return state.stock.length === 0 && state.waste.length > 0 && state.recycles < maxRecycles(state);
}

/** Turns over the next card(s) from the stock, or turns the waste back into the stock. */
export function drawFromStock(state: GameState): GameState | null {
  if (state.stock.length) {
    const n = Math.min(state.draw, state.stock.length);
    const taken = state.stock.slice(-n).reverse().map((c) => ({ ...c, up: true }));
    return { ...state, stock: state.stock.slice(0, -n), waste: [...state.waste, ...taken] };
  }
  if (!canRecycle(state)) return null;
  const penalty = state.scoring === 'standard' ? (state.draw === 1 ? 100 : 20) : 0;
  return {
    ...state,
    stock: state.waste.map((c) => ({ ...c, up: false })).reverse(),
    waste: [],
    recycles: state.recycles + 1,
    score: Math.max(0, state.score - penalty),
  };
}

/** The cards a source would pick up (a run of face-up cards from the tableau, otherwise one card). */
export function pickUp(state: GameState, from: Source): Card[] {
  if (from.pile === 'waste') return state.waste.slice(-1);
  if (from.pile === 'foundation') return state.foundations[from.col]?.slice(-1) ?? [];
  const pile = state.tableau[from.col] ?? [];
  const run = pile.slice(from.index);
  return run.length && run.every((c) => c.up) ? run : [];
}

export function canPlace(state: GameState, cards: Card[], to: Target): boolean {
  const first = cards[0];
  if (!first) return false;
  if (to.pile === 'foundation') {
    if (cards.length !== 1) return false;
    const pile = state.foundations[to.col];
    if (!pile) return false;
    const top = pile[pile.length - 1];
    return top ? top.suit === first.suit && first.rank === top.rank + 1 : first.rank === 1;
  }
  const pile = state.tableau[to.col];
  if (!pile) return false;
  const top = pile[pile.length - 1];
  return top ? top.up && isRed(top) !== isRed(first) && first.rank === top.rank - 1 : first.rank === 13;
}

function points(state: GameState, from: Source, to: Target): number {
  if (state.scoring === 'standard') {
    if (from.pile === 'waste') return to.pile === 'tableau' ? 5 : 10;
    if (from.pile === 'tableau' && to.pile === 'foundation') return 10;
    if (from.pile === 'foundation' && to.pile === 'tableau') return -15;
    return 0;
  }
  if (state.scoring === 'vegas') {
    if (to.pile === 'foundation' && from.pile !== 'foundation') return 5;
    if (from.pile === 'foundation' && to.pile === 'tableau') return -5;
  }
  return 0;
}

/** Makes a move, or returns null if it isn't allowed. Turns up the card left behind in the tableau. */
export function move(state: GameState, from: Source, to: Target): GameState | null {
  if (from.pile === to.pile && from.col === to.col) return null;
  const cards = pickUp(state, from);
  if (!cards.length || !canPlace(state, cards, to)) return null;

  const tableau = state.tableau.map((p) => p.slice());
  const foundations = state.foundations.map((p) => p.slice());
  let waste = state.waste;
  let score = state.score + points(state, from, to);

  if (from.pile === 'waste') waste = state.waste.slice(0, -1);
  else if (from.pile === 'foundation') foundations[from.col]!.pop();
  else {
    const pile = tableau[from.col]!;
    pile.splice(from.index);
    const last = pile[pile.length - 1];
    if (last && !last.up) {
      pile[pile.length - 1] = { ...last, up: true };
      if (state.scoring === 'standard') score += 5;
    }
  }
  if (to.pile === 'foundation') foundations[to.col]!.push(...cards);
  else tableau[to.col]!.push(...cards);

  return { ...state, tableau, foundations, waste, score: state.scoring === 'standard' ? Math.max(0, score) : score };
}

/** The foundation a single card could go to, if any. */
export function foundationFor(state: GameState, card: Card | undefined): Target | null {
  if (!card) return null;
  for (let col = 0; col < 4; col++) {
    const target: Target = { pile: 'foundation', col };
    if (canPlace(state, [card], target)) return target;
  }
  return null;
}

/** Sends a card (the top of its pile) up to a foundation if it fits. */
export function autoToFoundation(state: GameState, from: Source): GameState | null {
  const cards = pickUp(state, from);
  if (cards.length !== 1) return null;
  const target = foundationFor(state, cards[0]);
  return target ? move(state, from, target) : null;
}

/** Plays every card that can go to a foundation, repeatedly (like right-clicking in the classic game). */
export function autoPlayAll(state: GameState): GameState {
  let current = state;
  for (let changed = true; changed; ) {
    changed = false;
    const sources: Source[] = [{ pile: 'waste' }];
    current.tableau.forEach((pile, col) => sources.push({ pile: 'tableau', col, index: pile.length - 1 }));
    for (const source of sources) {
      const next = autoToFoundation(current, source);
      if (next) {
        current = next;
        changed = true;
      }
    }
  }
  return current;
}

export function isWon(state: GameState) {
  return state.foundations.every((pile) => pile.length === 13);
}

/** Time penalty in a timed Standard game: 2 points every 10 seconds. */
export function timePenalty(state: Pick<GameState, 'scoring'>, seconds: number, timed: boolean) {
  return timed && state.scoring === 'standard' ? Math.floor(seconds / 10) * 2 : 0;
}

/** Bonus for winning a timed Standard game in 30 seconds or more. */
export function winBonus(state: Pick<GameState, 'scoring'>, seconds: number, timed: boolean) {
  return timed && state.scoring === 'standard' && seconds >= 30 ? Math.round(700000 / seconds) : 0;
}

/** The score shown in the status bar. */
export function displayScore(state: GameState, seconds: number, timed: boolean, bonus: number) {
  if (state.scoring === 'none') return null;
  if (state.scoring === 'vegas') return state.score;
  return Math.max(0, state.score - timePenalty(state, seconds, timed)) + bonus;
}
