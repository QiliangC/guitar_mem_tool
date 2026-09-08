import { describe, expect, test } from 'vitest';
import { DIFFICULTIES } from '../src/music.js';
import { createQuestion, evaluateAnswer } from '../src/quiz.js';

describe('quiz model', () => {
  test('creates a four-choice question that includes the correct note', () => {
    const question = createQuestion({
      rng: () => 0,
      positions: [{ stringNumber: 6, openNote: 'E', fret: 0, note: 'E' }],
    });

    expect(question.position).toEqual({ stringNumber: 6, openNote: 'E', fret: 0, note: 'E' });
    expect(question.correctNote).toBe('E');
    expect(question.choices).toHaveLength(4);
    expect(new Set(question.choices).size).toBe(4);
    expect(question.choices).toContain('E');
    expect(question.startedAt).toBeTypeOf('number');
  });

  test('uses only natural-note answer choices for simple and medium difficulties', () => {
    const simpleQuestion = createQuestion({ difficulty: DIFFICULTIES.SIMPLE, rng: () => 0 });
    const mediumQuestion = createQuestion({ difficulty: DIFFICULTIES.MEDIUM, rng: () => 0 });

    expect(simpleQuestion.choices.every((choice) => !choice.includes('#'))).toBe(true);
    expect(mediumQuestion.choices.every((choice) => !choice.includes('#'))).toBe(true);
  });

  test('evaluates a correct answer', () => {
    const question = {
      correctNote: 'C',
      startedAt: 1_000,
    };

    expect(evaluateAnswer(question, 'C', 2_250)).toEqual({
      isCorrect: true,
      selectedNote: 'C',
      correctNote: 'C',
      responseMs: 1_250,
    });
  });

  test('evaluates an incorrect answer and reveals the correct note', () => {
    const question = {
      correctNote: 'F#',
      startedAt: 5_000,
    };

    expect(evaluateAnswer(question, 'G', 5_900)).toEqual({
      isCorrect: false,
      selectedNote: 'G',
      correctNote: 'F#',
      responseMs: 900,
    });
  });
});
