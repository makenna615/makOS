import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Icon } from '../components/Icons';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import {
  RANK_LABEL,
  SUIT_SYMBOL,
  autoPlayAll,
  autoToFoundation,
  cardName,
  canRecycle,
  deal,
  displayScore,
  drawFromStock,
  isRed,
  isWon,
  move,
  pickUp,
  winBonus,
  type Card,
  type DrawMode,
  type GameState,
  type Scoring,
  type Source,
  type Target,
} from '../games/solitaire';
import { CARD_BACKS, DEFAULT_BACK, cardBackImage, isCardBackId, type CardBackId } from '../games/solitaireBacks';
import { startCelebration } from '../games/solitaireCelebration';

// ---------- Saved options ----------
const PREFS_KEY = 'makos:solitaire';
interface Prefs {
  draw: DrawMode;
  scoring: Scoring;
  timed: boolean;
  back: CardBackId;
}
const DEFAULT_PREFS: Prefs = { draw: 1, scoring: 'standard', timed: true, back: DEFAULT_BACK };
function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Record<string, unknown>;
    return {
      draw: raw.draw === 3 ? 3 : 1,
      scoring: raw.scoring === 'vegas' || raw.scoring === 'none' ? raw.scoring : 'standard',
      timed: raw.timed !== false,
      back: isCardBackId(raw.back) ? raw.back : DEFAULT_BACK,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* options just aren't remembered */
  }
}

// ---------- Card faces ----------
/** Pip positions (x, y as % of the card) for 2–10, classic layout. Pips below the middle are drawn upside down. */
const L = 28;
const C = 50;
const R = 72;
const PIPS: Record<number, [number, number][]> = {
  2: [[C, 18], [C, 82]],
  3: [[C, 18], [C, 50], [C, 82]],
  4: [[L, 18], [R, 18], [L, 82], [R, 82]],
  5: [[L, 18], [R, 18], [C, 50], [L, 82], [R, 82]],
  6: [[L, 18], [R, 18], [L, 50], [R, 50], [L, 82], [R, 82]],
  7: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [L, 82], [R, 82]],
  8: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [C, 66], [L, 82], [R, 82]],
  9: [[L, 18], [R, 18], [L, 39], [R, 39], [C, 50], [L, 61], [R, 61], [L, 82], [R, 82]],
  10: [[L, 18], [R, 18], [C, 29], [L, 39], [R, 39], [L, 61], [R, 61], [C, 71], [L, 82], [R, 82]],
};

function CardFace({ card }: { card: Card }) {
  const suit = SUIT_SYMBOL[card.suit];
  const label = RANK_LABEL[card.rank];
  // The printed symbols are hidden from screen readers; the card's button carries its full name instead.
  return (
    <span className="pc-face" aria-hidden="true">
      <span className="pc-corner">
        {label}
        <br />
        {suit}
      </span>
      <span className="pc-corner is-bottom">
        {label}
        <br />
        {suit}
      </span>
      {card.rank === 1 && <span className="pc-ace">{suit}</span>}
      {card.rank > 10 && (
        <span className="pc-court">
          <span className="pc-court-rank">{label}</span>
          <span className="pc-court-suit">{suit}</span>
        </span>
      )}
      {card.rank > 1 && card.rank <= 10 && (
        <span className="pc-pips">
          {PIPS[card.rank]!.map(([x, y], i) => (
            <span key={i} className={`pc-pip${y > 50 ? ' is-flipped' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}>
              {suit}
            </span>
          ))}
        </span>
      )}
      {/* Small cards (phones) swap the pips for one big suit. */}
      <span className="pc-big">{card.rank > 10 ? label : suit}</span>
    </span>
  );
}

/** The makOS logo; hidden by CSS when a picture back is chosen (Game › Deck…). */
function CardBack() {
  return (
    <span className="pc-back-art">
      <Icon name="logo" size={40} />
    </span>
  );
}

// ---------- Layout ----------
const DOWN_STEP = 0.16; // offsets between stacked tableau cards, in card widths
const UP_STEP = 0.3;
const sameSource = (a: Source | null, b: Source) =>
  !!a && a.pile === b.pile && (a.pile !== 'tableau' || (b.pile === 'tableau' && a.col === b.col && a.index === b.index)) && (a.pile !== 'foundation' || (b.pile === 'foundation' && a.col === b.col));

function parseTarget(el: Element | null): Target | null {
  const drop = el?.closest<HTMLElement>('[data-drop]');
  if (!drop) return null;
  const [pile, col] = drop.dataset.drop!.split(':');
  const n = Number(col);
  if ((pile === 'tableau' || pile === 'foundation') && Number.isInteger(n)) return { pile, col: n };
  return null;
}

interface Drag {
  from: Source;
  cards: Card[];
  dx: number;
  dy: number;
  width: number;
  /** The theme card corner radius (the ghost lives outside the app, so it can't inherit it). */
  radius: string;
}

type Phase = 'play' | 'celebrate' | 'ask' | 'done';

/** Klondike solitaire, in the spirit of the classic desktop game. */
export function Solitaire() {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [game, setGame] = useState<GameState>(() => deal(prefs.draw, prefs.scoring));
  const [history, setHistory] = useState<GameState[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [phase, setPhase] = useState<Phase>('play');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [drag, setDrag] = useState<Drag | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const suppressClick = useRef(false);

  const won = phase !== 'play';

  // Timer: runs from the first move until the game is won.
  useEffect(() => {
    if (!started || won) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.min(32767, s + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, won]);

  const newGame = useCallback((next: Prefs = prefs) => {
    setGame(deal(next.draw, next.scoring));
    setHistory([]);
    setSelected(null);
    setSeconds(0);
    setStarted(false);
    setBonus(0);
    setPhase('play');
    setAnnounce('New game dealt.');
  }, [prefs]);

  const win = useCallback(
    (extra: number) => {
      setBonus((b) => b + extra);
      setPhase(reducedMotion ? 'ask' : 'celebrate');
      setAnnounce(`You won!${extra ? ` Bonus: ${extra}.` : ''}`);
    },
    [reducedMotion],
  );

  /** Applies a new state (if the move was allowed), with undo, the timer and win detection. */
  const commit = (next: GameState | null, message?: string) => {
    if (!next) return false;
    setHistory((h) => [...h.slice(-99), game]);
    setGame(next);
    setSelected(null);
    if (!started) setStarted(true);
    if (message) setAnnounce(message);
    if (isWon(next)) win(winBonus(next, seconds, prefs.timed));
    return true;
  };

  const undo = () => {
    if (won || !history.length) return;
    setGame(history[history.length - 1]!);
    setHistory((h) => h.slice(0, -1));
    setSelected(null);
    setAnnounce('Undid the last move.');
  };

  const tryMove = (from: Source, to: Target) => {
    const cards = pickUp(game, from);
    const next = move(game, from, to);
    if (!next) return false;
    const where = to.pile === 'foundation' ? 'a foundation' : `column ${to.col + 1}`;
    return commit(next, `Moved ${cardName(cards[0]!)}${cards.length > 1 ? ` and ${cards.length - 1} more` : ''} to ${where}.`);
  };

  const drawStock = () => {
    if (won) return;
    const next = drawFromStock(game);
    if (!next) {
      setAnnounce(game.stock.length || game.waste.length ? 'No more passes through the deck.' : 'The deck is empty.');
      return;
    }
    const drawn = next.waste[next.waste.length - 1];
    commit(next, game.stock.length ? `Turned over ${drawn ? cardName(drawn) : 'a card'}.` : 'Turned the pile back over.');
  };

  // Click / Enter on a card or slot: move the selected cards there, or select this card.
  const activate = (source: Source | null, target: Target | null) => {
    if (won) return;
    if (selected && target && tryMove(selected, target)) return;
    if (source && !sameSource(selected, source) && pickUp(game, source).length) {
      setSelected(source);
      const cards = pickUp(game, source);
      setAnnounce(`Selected ${cardName(cards[0]!)}${cards.length > 1 ? ` and ${cards.length - 1} more` : ''}. Choose where to move it.`);
      return;
    }
    setSelected(null);
  };

  const sendToFoundation = (source: Source) => {
    if (won) return;
    const card = pickUp(game, source)[0];
    const next = autoToFoundation(game, source);
    if (next && card) commit(next, `Moved ${cardName(card)} to a foundation.`);
  };

  // ---------- Drag and drop ----------
  const onCardPointerDown = (event: ReactPointerEvent<HTMLElement>, source: Source) => {
    if (event.button !== 0 || won) return;
    const cards = pickUp(game, source);
    if (!cards.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    const onMove = (e: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < 5) return;
        dragging = true;
        const radius = rootRef.current ? getComputedStyle(rootRef.current).getPropertyValue('--card-radius').trim() : '';
        setDrag({ from: source, cards, dx: startX - rect.left, dy: startY - rect.top, width: rect.width, radius: radius || '6px' });
      }
      const ghost = ghostRef.current;
      if (ghost) ghost.style.transform = `translate(${e.clientX - (startX - rect.left)}px, ${e.clientY - (startY - rect.top)}px)`;
    };
    const onUp = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!dragging) return;
      suppressClick.current = true;
      setDrag(null);
      const target = parseTarget(document.elementFromPoint(e.clientX, e.clientY));
      if (target) tryMove(source, target);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Place the drag ghost under the pointer as soon as it appears.
  useEffect(() => {
    if (!drag) return;
    const ghost = ghostRef.current;
    const source = rootRef.current?.querySelector<HTMLElement>('.pc.is-dragging');
    if (ghost && source) {
      const r = source.getBoundingClientRect();
      ghost.style.transform = `translate(${r.left}px, ${r.top}px)`;
    }
  }, [drag]);

  const clickGuard = (fn: () => void) => () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    fn();
  };

  // ---------- Celebration ----------
  useEffect(() => {
    if (phase !== 'celebrate') return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const slots = [...stage.querySelectorAll<HTMLElement>('[data-drop^="foundation"]')];
    const first = slots[0]?.getBoundingClientRect();
    const cardW = first?.width ?? 71;
    const cardH = first?.height ?? 96;
    // A forced win (the easter egg) celebrates with a full set of foundations, like the original.
    const full = game.foundations.every((f) => f.length === 13)
      ? game.foundations
      : (['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit) => Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1 })));
    const stop = startCelebration(
      canvas,
      {
        foundations: full,
        origins: slots.map((s) => {
          const r = s.getBoundingClientRect();
          return { x: r.left - stageRect.left, y: r.top - stageRect.top };
        }),
        cardW,
        cardH,
      },
      () => setPhase('ask'),
    );
    const end = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setPhase('ask');
    };
    window.addEventListener('keydown', end, { capture: true });
    canvas.addEventListener('pointerdown', end);
    return () => {
      stop();
      window.removeEventListener('keydown', end, { capture: true });
      canvas.removeEventListener('pointerdown', end);
    };
    // Starts once per celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---------- Keyboard ----------
  // Game-wide shortcuts work whenever the Solitaire window is active, even if focus is on its title bar
  // (not just on a card), like the classic game.
  const onShortcut = useEffectEvent((event: globalThis.KeyboardEvent) => {
    const root = rootRef.current;
    const container = root?.closest('.window, .mobile-sheet') ?? root;
    const active = document.activeElement;
    if (!root || !container || !active || !(container === active || container.contains(active))) return;
    if (deckOpen) return; // the Deck… dialog has its own keys
    // Easter egg (as in the classic game): timed game, Standard scoring, over 30 seconds in.
    if (event.altKey && event.shiftKey && event.code === 'Digit2') {
      event.preventDefault();
      if (prefs.timed && game.scoring === 'standard' && seconds > 30 && phase !== 'celebrate') {
        win(winBonus(game, seconds, true));
      }
    } else if (event.key === 'F2') {
      event.preventDefault();
      newGame();
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      undo();
    }
  });
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => onShortcut(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && selected) {
      event.stopPropagation(); // clear the selection rather than closing the window
      setSelected(null);
      return;
    }
    if (event.key.startsWith('Arrow') && !event.altKey && (event.target as HTMLElement).dataset.nav !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      moveFocus(event.target as HTMLElement, event.key);
    }
  };

  /** Arrow keys move focus to the nearest card or slot in that direction. */
  const moveFocus = (from: HTMLElement, key: string) => {
    const all = [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-nav]') ?? [])];
    const a = from.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + Math.min(a.height / 2, 20);
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const el of all) {
      if (el === from) continue;
      const b = el.getBoundingClientRect();
      const dx = b.left + b.width / 2 - ax;
      const dy = b.top + Math.min(b.height / 2, 20) - ay;
      const forward = key === 'ArrowRight' ? dx : key === 'ArrowLeft' ? -dx : key === 'ArrowDown' ? dy : -dy;
      const side = key === 'ArrowRight' || key === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
      if (forward <= 2) continue;
      const score = forward + side * 2.5;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    best?.focus();
  };

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault(); // right-click plays everything it can to the foundations, like the original
    if (won) return;
    const next = autoPlayAll(game);
    if (next !== game) commit(next, 'Played available cards to the foundations.');
  };

  // ---------- Options ----------
  const changePrefs = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    setMenuOpen(false);
    newGame(next);
    menuButtonRef.current?.focus();
  };

  /** Game › Deck…: changing the back keeps the current game going. */
  const closeDeck = (back?: CardBackId) => {
    setDeckOpen(false);
    if (back && back !== prefs.back) {
      const next = { ...prefs, back };
      setPrefs(next);
      savePrefs(next);
      setAnnounce(`Card back: ${CARD_BACKS.find((b) => b.id === back)?.name ?? back}.`);
    }
    menuButtonRef.current?.focus();
  };
  const backImage = cardBackImage(prefs.back);
  const backClass = backImage ? ' has-art' : '';

  // ---------- Render helpers ----------
  const score = displayScore(game, seconds, prefs.timed, bonus);
  const isSel = (source: Source) => sameSource(selected, source) || (selected?.pile === 'tableau' && source.pile === 'tableau' && selected.col === source.col && source.index > selected.index);
  const isDragged = (source: Source) =>
    !!drag && (sameSource(drag.from, source) || (drag.from.pile === 'tableau' && source.pile === 'tableau' && drag.from.col === source.col && source.index > drag.from.index));

  const cardButton = (card: Card, source: Source, label: string, target: Target | null, extra = '') => (
    <button
      type="button"
      data-nav=""
      className={`pc${isRed(card) ? ' is-red' : ''}${isSel(source) ? ' is-selected' : ''}${isDragged(source) ? ' is-dragging' : ''}${extra}`}
      aria-pressed={sameSource(selected, source)}
      onPointerDown={(e) => onCardPointerDown(e, source)}
      onClick={clickGuard(() => activate(source, target))}
      onDoubleClick={() => sendToFoundation(source)}
    >
      <span className="visually-hidden">{label}</span>
      <CardFace card={card} />
    </button>
  );

  const wasteShown = game.draw === 3 ? game.waste.slice(-3) : game.waste.slice(-1);

  return (
    // The keydown handler implements the game's shortcuts (F2, Ctrl+Z, arrows, the easter egg) for everything inside it.
    // tabIndex: after "No" at the end of a game, focus rests here so the shortcuts still work.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="app solitaire"
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={backImage ? ({ '--back-img': backImage } as CSSProperties) : undefined}
    >
      <div className="sol-menubar">
        <button
          ref={menuButtonRef}
          type="button"
          className="sol-menu-button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          Game
        </button>
        {menuOpen && (
          <GameMenu
            prefs={prefs}
            canUndo={!won && history.length > 0}
            onDeal={() => {
              setMenuOpen(false);
              newGame();
              menuButtonRef.current?.focus();
            }}
            onUndo={() => {
              setMenuOpen(false);
              undo();
              menuButtonRef.current?.focus();
            }}
            onDeck={() => {
              setMenuOpen(false);
              setDeckOpen(true);
            }}
            onChange={changePrefs}
            onClose={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
          />
        )}
        <span className="sol-hint">
          <span className="sol-hint-mouse">Drag or click cards · double-click to send up · right-click to play all</span>
          <span className="sol-hint-touch">Tap a card, then where it goes · double-tap to send up</span>
        </span>
      </div>

      <div className="sol-stage" ref={stageRef} onContextMenu={onContextMenu}>
        <div className="sol-table">
          <div className="sol-row">
            {/* Stock */}
            <div className="sol-slot">
              {game.stock.length ? (
                <button type="button" data-nav="" className={`pc is-back${backClass}`} aria-label={`Deck, ${game.stock.length} cards. Turn over ${game.draw === 3 ? 'three cards' : 'a card'}.`} onClick={drawStock}>
                  <CardBack />
                </button>
              ) : (
                <button
                  type="button"
                  data-nav=""
                  className={`pc-empty is-stock${canRecycle(game) ? '' : ' is-done'}`}
                  aria-label={canRecycle(game) ? 'Turn the pile back over' : 'Deck empty'}
                  onClick={drawStock}
                >
                  <span aria-hidden="true">{canRecycle(game) ? '↻' : '✕'}</span>
                </button>
              )}
            </div>
            {/* Waste */}
            <div className={`sol-slot sol-waste is-draw${game.draw}`}>
              {wasteShown.map((card, i) => {
                const top = i === wasteShown.length - 1;
                const style = { '--fan': i } as CSSProperties;
                return top ? (
                  <span key={`${card.rank}${card.suit}`} className="sol-fan" style={style}>
                    {cardButton(card, { pile: 'waste' }, `${cardName(card)}, top of the pile`, null)}
                  </span>
                ) : (
                  <span key={`${card.rank}${card.suit}`} className={`pc sol-fan${isRed(card) ? ' is-red' : ''}`} style={style} aria-hidden="true">
                    <CardFace card={card} />
                  </span>
                );
              })}
            </div>
            <div className="sol-slot is-gap" aria-hidden="true" />
            {/* Foundations */}
            {game.foundations.map((pile, col) => {
              const top = pile[pile.length - 1];
              const target: Target = { pile: 'foundation', col };
              return (
                <div key={col} className="sol-slot" data-drop={`foundation:${col}`}>
                  {top ? (
                    cardButton(top, { pile: 'foundation', col }, `Foundation ${col + 1}: ${cardName(top)}`, target)
                  ) : (
                    <button type="button" data-nav="" className="pc-empty is-foundation" aria-label={`Foundation ${col + 1}, empty`} onClick={() => activate(null, target)}>
                      <span aria-hidden="true">A</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sol-row is-tableau">
            {game.tableau.map((pile, col) => {
              const target: Target = { pile: 'tableau', col };
              let offset = 0;
              const tops = pile.map((card, i) => {
                const t = offset;
                offset += card.up ? UP_STEP : DOWN_STEP;
                return { card, i, t };
              });
              return (
                <div
                  key={col}
                  className="sol-col"
                  data-drop={`tableau:${col}`}
                  style={{ '--stack': offset - (pile.length ? (pile[pile.length - 1]!.up ? UP_STEP : DOWN_STEP) : 0) } as CSSProperties}
                >
                  {pile.length === 0 && (
                    <button type="button" data-nav="" className="pc-empty" aria-label={`Empty column ${col + 1}`} onClick={() => activate(null, target)}>
                      <span aria-hidden="true">K</span>
                    </button>
                  )}
                  {tops.map(({ card, i, t }) => (
                    <span key={`${card.rank}${card.suit}`} className="sol-stack" style={{ '--t': t } as CSSProperties}>
                      {card.up ? (
                        cardButton(
                          card,
                          { pile: 'tableau', col, index: i },
                          `${cardName(card)}, column ${col + 1}${i < pile.length - 1 ? `, with ${pile.length - 1 - i} card${pile.length - 1 - i > 1 ? 's' : ''} on top` : ''}`,
                          target,
                        )
                      ) : (
                        <span className={`pc is-back${backClass}`} aria-hidden="true">
                          <CardBack />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {phase === 'celebrate' && <canvas ref={canvasRef} className="sol-celebration" aria-hidden="true" />}
        {phase === 'ask' && (
          <DealAgain
            bonus={bonus}
            onYes={() => newGame()}
            onNo={() => {
              setPhase('done');
              rootRef.current?.focus();
            }}
          />
        )}
        {deckOpen && <DeckDialog current={prefs.back} onClose={closeDeck} />}
      </div>

      <p className="sol-status">
        <span className="sol-status-text" role="status">
          {announce}
        </span>
        {bonus > 0 && <span>Bonus: {bonus.toLocaleString()}</span>}
        {score !== null && <span>Score: {game.scoring === 'vegas' ? `$${score}` : score.toLocaleString()}</span>}
        {prefs.timed && <span>Time: {seconds}</span>}
      </p>

      {/* Rendered on the page itself, outside the window: the window is positioned with a CSS transform,
          which would otherwise shift and clip this pointer-following copy. */}
      {drag &&
        createPortal(
          <div
            className="sol-ghost"
            ref={ghostRef}
            style={
              {
                '--cw': `${drag.width}px`,
                '--ch': `${drag.width * 1.4}px`,
                '--card-radius': drag.radius,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            {drag.cards.map((card, i) => (
              <span key={`${card.rank}${card.suit}`} className={`pc${isRed(card) ? ' is-red' : ''}`} style={{ '--t': i * UP_STEP } as CSSProperties}>
                <CardFace card={card} />
              </span>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function DealAgain({ bonus, onYes, onNo }: { bonus: number; onYes: () => void; onNo: () => void }) {
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => yesRef.current?.focus(), []);
  return (
    <div className="sol-dialog" role="alertdialog" aria-labelledby="sol-dialog-title" aria-describedby="sol-dialog-body">
      <p id="sol-dialog-title" className="sol-dialog-title">
        Game over
      </p>
      <p id="sol-dialog-body">{bonus ? `You won, with a bonus of ${bonus.toLocaleString()}! Deal again?` : 'You won! Deal again?'}</p>
      <div className="sol-dialog-actions">
        <button ref={yesRef} type="button" className="btn btn-primary" onClick={onYes}>
          Yes
        </button>
        <button type="button" className="btn" onClick={onNo}>
          No
        </button>
      </div>
    </div>
  );
}

/** Game › Deck…: pick a card back (a radio group of pictures), like the classic "Select Card Back" box. */
function DeckDialog({ current, onClose }: { current: CardBackId; onClose: (back?: CardBackId) => void }) {
  const [choice, setChoice] = useState<CardBackId>(current);
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, []);

  const pick = (id: CardBackId, focus: boolean) => {
    setChoice(id);
    if (focus) gridRef.current?.querySelector<HTMLElement>(`[data-back="${id}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation(); // close the dialog, not the window
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      // Keep focus inside the dialog while it's open.
      const items = [...(ref.current?.querySelectorAll<HTMLElement>('[tabindex="0"], button:not([tabindex])') ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = items[(i + (event.shiftKey ? -1 : 1) + items.length) % items.length];
      if (next) {
        event.preventDefault();
        next.focus();
      }
      return;
    }
    const onTile = (event.target as HTMLElement).dataset.back !== undefined;
    if (!onTile) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      onClose(choice);
      return;
    }
    const cols = gridRef.current ? getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').length : 4;
    const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols } as Record<string, number>)[event.key];
    if (step) {
      event.preventDefault();
      event.stopPropagation();
      const i = CARD_BACKS.findIndex((b) => b.id === choice);
      pick(CARD_BACKS[(i + step + CARD_BACKS.length) % CARD_BACKS.length]!.id, true);
    }
  };

  return (
    <div className="sol-modal">
      {/* The dialog handles its own keys: arrows move between backs, Enter = OK, Escape = Cancel, Tab stays inside. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="sol-dialog sol-deck" role="dialog" aria-modal="true" aria-labelledby="sol-deck-title" ref={ref} onKeyDown={onKeyDown}>
        <p id="sol-deck-title" className="sol-dialog-title">
          Select Card Back
        </p>
        <div className="sol-deck-grid" role="radiogroup" aria-labelledby="sol-deck-title" ref={gridRef}>
          {CARD_BACKS.map((b) => {
            const image = cardBackImage(b.id);
            const checked = b.id === choice;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                data-back={b.id}
                className="sol-deck-tile"
                onClick={() => pick(b.id, false)}
                onDoubleClick={() => onClose(b.id)}
              >
                <span className={`pc is-back${image ? ' has-art' : ''}`} style={image ? ({ '--back-img': image } as CSSProperties) : undefined} aria-hidden="true">
                  <CardBack />
                </span>
                <span className="sol-deck-name">{b.name}</span>
              </button>
            );
          })}
        </div>
        <div className="sol-dialog-actions">
          <button type="button" className="btn btn-primary" onClick={() => onClose(choice)}>
            OK
          </button>
          <button type="button" className="btn" onClick={() => onClose()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface GameMenuProps {
  prefs: Prefs;
  canUndo: boolean;
  onDeal: () => void;
  onUndo: () => void;
  onDeck: () => void;
  onChange: (patch: Partial<Prefs>) => void;
  onClose: () => void;
}

/** The Game menu (WAI-ARIA menu pattern): arrow keys move, Enter picks, Escape closes. */
function GameMenu({ prefs, canUndo, onDeal, onUndo, onDeck, onChange, onClose }: GameMenuProps) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest('.sol-menu-button')) onClose();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      event.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(i + 1);
    else if (event.key === 'ArrowUp') go(i - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(items.length - 1);
    else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  const radio = (label: string, checked: boolean, patch: Partial<Prefs>) => (
    <li role="none">
      <button type="button" role="menuitemradio" aria-checked={checked} tabIndex={-1} onClick={() => onChange(patch)}>
        <span className="sol-check" aria-hidden="true">{checked ? '●' : ''}</span>
        {label}
      </button>
    </li>
  );

  return (
    <ul className="sol-menu" role="menu" aria-label="Game" ref={ref} onKeyDown={onKeyDown}>
      <li role="none">
        <button type="button" role="menuitem" tabIndex={-1} onClick={onDeal}>
          <span className="sol-check" aria-hidden="true" />
          Deal <kbd>F2</kbd>
        </button>
      </li>
      <li role="none">
        <button type="button" role="menuitem" tabIndex={-1} aria-disabled={!canUndo} onClick={() => canUndo && onUndo()}>
          <span className="sol-check" aria-hidden="true" />
          Undo <kbd>Ctrl+Z</kbd>
        </button>
      </li>
      <li role="none">
        <button type="button" role="menuitem" tabIndex={-1} aria-haspopup="dialog" onClick={onDeck}>
          <span className="sol-check" aria-hidden="true" />
          Deck…
        </button>
      </li>
      <li role="separator" className="sol-sep" />
      {radio('Draw One', prefs.draw === 1, { draw: 1 })}
      {radio('Draw Three', prefs.draw === 3, { draw: 3 })}
      <li role="separator" className="sol-sep" />
      {radio('Standard scoring', prefs.scoring === 'standard', { scoring: 'standard' })}
      {radio('Vegas scoring', prefs.scoring === 'vegas', { scoring: 'vegas' })}
      {radio('No scoring', prefs.scoring === 'none', { scoring: 'none' })}
      <li role="separator" className="sol-sep" />
      <li role="none">
        <button type="button" role="menuitemcheckbox" aria-checked={prefs.timed} tabIndex={-1} onClick={() => onChange({ timed: !prefs.timed })}>
          <span className="sol-check" aria-hidden="true">{prefs.timed ? '✓' : ''}</span>
          Timed game
        </button>
      </li>
    </ul>
  );
}
