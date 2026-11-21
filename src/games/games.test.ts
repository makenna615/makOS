import { describe, expect, it } from 'vitest';
import { LEVELS, flagsPlaced, neighbours, newBoard, plantBugs, reveal, toggleFlag } from './bugSweeper';
import { STACKDLE_WORDS, cluesFor, puzzleNumber, score, wordFor } from './stackdleWords';

describe('Bug Sweeper', () => {
  it('plants the right number of bugs and never on or next to the first click', () => {
    for (let run = 0; run < 20; run++) {
      const board = reveal(newBoard('junior'), 40);
      expect(board.cells.filter((c) => c.bug)).toHaveLength(LEVELS.junior.bugs);
      for (const i of [40, ...neighbours(board, 40)]) expect(board.cells[i]!.bug).toBe(false);
      expect(board.status).toBe('playing');
    }
  });

  it('counts neighbouring bugs', () => {
    const board = plantBugs(newBoard('junior'), 80, () => 0); // always picks the first free cell: cells 0..9
    expect(board.cells[0]!.bug).toBe(true);
    expect(board.cells[9 + 0]!.near).toBe(2); // row 2, col 1 touches cells 0 and 1
  });

  it('flood-fills empty areas and wins when every safe cell is open', () => {
    let board = plantBugs(newBoard('junior'), 80, () => 0);
    board = reveal(board, 80);
    expect(board.cells[80]!.open).toBe(true);
    expect(board.cells.filter((c) => c.open).length).toBeGreaterThan(1);
    for (let i = 0; i < board.cells.length; i++) if (!board.cells[i]!.bug) board = reveal(board, i);
    expect(board.status).toBe('won');
    expect(flagsPlaced(board)).toBe(LEVELS.junior.bugs);
  });

  it('loses on a bug, and the board is then frozen', () => {
    let board = plantBugs(newBoard('junior'), 80, () => 0);
    board = reveal(board, 0);
    expect(board.status).toBe('lost');
    expect(board.hit).toBe(0);
    expect(reveal(board, 80)).toBe(board);
    expect(toggleFlag(board, 50)).toBe(board);
  });

  it('flags protect a cell from being opened', () => {
    let board = plantBugs(newBoard('junior'), 80, () => 0);
    board = toggleFlag(board, 0);
    expect(reveal(board, 0).status).toBe('playing');
    expect(toggleFlag(board, 0).cells[0]!.flag).toBe(false);
  });
});

describe('Stackdle', () => {
  it('has valid, unique 5-letter words with clues', () => {
    const words = STACKDLE_WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
    for (const w of STACKDLE_WORDS) {
      expect(w.word).toMatch(/^[A-Z]{5}$/);
      expect(w.facts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('scores guesses, including repeated letters', () => {
    expect(score('RAILS', 'RAILS')).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
    expect(score('RAINS', 'RAILS')).toEqual(['hit', 'hit', 'hit', 'miss', 'hit']);
    // QUEUE has two Es; one is matched exactly, so only one of the other guessed Es can be "near".
    expect(score('EERIE', 'QUEUE')).toEqual(['near', 'miss', 'miss', 'miss', 'hit']);
    expect(score('LLAMA', 'HELLO')).toEqual(['near', 'near', 'miss', 'miss', 'miss']);
  });

  it('numbers puzzles by local day and cycles through the words', () => {
    expect(puzzleNumber(new Date(2026, 10, 20, 0, 5))).toBe(1);
    expect(puzzleNumber(new Date(2026, 10, 20, 23, 55))).toBe(1);
    expect(puzzleNumber(new Date(2026, 10, 21, 8))).toBe(2);
    expect(wordFor(1).word).toBe(STACKDLE_WORDS[0]!.word);
    expect(wordFor(STACKDLE_WORDS.length + 1).word).toBe(STACKDLE_WORDS[0]!.word);
  });

  it('puts the resume clue second, right after the category', () => {
    const rails = STACKDLE_WORDS.find((w) => w.word === 'RAILS')!;
    const clues = cluesFor(rails);
    expect(clues[0]!.text).toMatch(/^Category/);
    expect(clues[1]).toMatchObject({ fromResume: true });
    expect(clues.at(-1)!.text).toBe('It starts with R');
  });
});
