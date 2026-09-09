import { describe, expect, test } from 'vitest';
import {
  DIFFICULTIES,
  getNoteAt,
  getPositionKey,
  getPositionsForDifficulty,
  getPositionsForTargetNote,
  getTargetNotesForDifficulty,
  isNaturalNote,
  LANDMARK_FRETS,
  parsePositionKey,
} from '../src/music.js';

describe('music model', () => {
  test('calculates sharp-only note names for standard tuning', () => {
    expect(getNoteAt(6, 0)).toBe('E');
    expect(getNoteAt(6, 1)).toBe('F');
    expect(getNoteAt(6, 12)).toBe('E');
    expect(getNoteAt(5, 3)).toBe('C');
    expect(getNoteAt(2, 1)).toBe('C');
    expect(getNoteAt(3, 4)).toBe('B');
  });

  test('recognizes natural notes and sharp notes', () => {
    expect(isNaturalNote('C')).toBe(true);
    expect(isNaturalNote('F')).toBe(true);
    expect(isNaturalNote('C#')).toBe(false);
    expect(isNaturalNote('A#')).toBe(false);
  });

  test('simple difficulty only includes natural notes at landmark frets', () => {
    const positions = getPositionsForDifficulty(DIFFICULTIES.SIMPLE);

    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((position) => LANDMARK_FRETS.includes(position.fret))).toBe(true);
    expect(positions.every((position) => isNaturalNote(position.note))).toBe(true);
    expect(positions).toContainEqual({ stringNumber: 6, openNote: 'E', fret: 0, note: 'E' });
    expect(positions).not.toContainEqual({ stringNumber: 6, openNote: 'E', fret: 9, note: 'C#' });
    expect(positions).not.toContainEqual({ stringNumber: 6, openNote: 'E', fret: 1, note: 'F' });
  });

  test('medium difficulty includes natural notes anywhere from fret 0 through 12', () => {
    const positions = getPositionsForDifficulty(DIFFICULTIES.MEDIUM);

    expect(positions.every((position) => position.fret >= 0 && position.fret <= 12)).toBe(true);
    expect(positions.every((position) => isNaturalNote(position.note))).toBe(true);
    expect(positions).toContainEqual({ stringNumber: 6, openNote: 'E', fret: 1, note: 'F' });
    expect(positions).not.toContainEqual({ stringNumber: 6, openNote: 'E', fret: 9, note: 'C#' });
  });

  test('hard difficulty includes every chromatic position from fret 0 through 12', () => {
    const positions = getPositionsForDifficulty(DIFFICULTIES.HARD);

    expect(positions).toHaveLength(78);
    expect(positions).toContainEqual({ stringNumber: 6, openNote: 'E', fret: 9, note: 'C#' });
    expect(positions).toContainEqual({ stringNumber: 1, openNote: 'E', fret: 12, note: 'E' });
  });

  test('creates and parses stable position keys', () => {
    expect(getPositionKey({ stringNumber: 4, fret: 3 })).toBe('4:3');
    expect(parsePositionKey('4:3')).toEqual({ stringNumber: 4, fret: 3 });
  });

  test('gets available target notes for each difficulty', () => {
    expect(getTargetNotesForDifficulty(DIFFICULTIES.SIMPLE)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(getTargetNotesForDifficulty(DIFFICULTIES.MEDIUM)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(getTargetNotesForDifficulty(DIFFICULTIES.HARD)).toEqual([
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ]);
  });

  test('finds target note positions inside a difficulty pool', () => {
    expect(getPositionsForTargetNote(DIFFICULTIES.SIMPLE, 'F')).toEqual([
      { stringNumber: 4, openNote: 'D', fret: 3, note: 'F' },
    ]);

    expect(getPositionsForTargetNote(DIFFICULTIES.MEDIUM, 'F#')).toEqual([]);
    expect(getPositionsForTargetNote(DIFFICULTIES.HARD, 'F#')).toContainEqual({
      stringNumber: 6,
      openNote: 'E',
      fret: 2,
      note: 'F#',
    });
  });
});
