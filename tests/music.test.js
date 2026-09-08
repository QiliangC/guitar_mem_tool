import { describe, expect, test } from 'vitest';
import {
  DIFFICULTIES,
  getNoteAt,
  getPositionsForDifficulty,
  isNaturalNote,
  LANDMARK_FRETS,
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
});
