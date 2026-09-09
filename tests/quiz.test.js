import { describe, expect, test } from 'vitest';
import { DIFFICULTIES } from '../src/music.js';
import { createLocateQuestion, createQuestion, evaluateAnswer, evaluateLocateAnswer } from '../src/quiz.js';

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

  test('creates a reverse locate question with target note and required positions', () => {
    const question = createLocateQuestion({ difficulty: DIFFICULTIES.SIMPLE, rng: () => 0, now: () => 4_000 });

    expect(question.targetNote).toBe('C');
    expect(question.requiredPositions).toEqual([
      { stringNumber: 5, openNote: 'A', fret: 3, note: 'C' },
      { stringNumber: 3, openNote: 'G', fret: 5, note: 'C' },
    ]);
    expect(question.startedAt).toBe(4_000);
  });

  test('evaluates a perfect reverse locate answer', () => {
    const question = {
      targetNote: 'C',
      requiredPositions: [
        { stringNumber: 5, openNote: 'A', fret: 3, note: 'C' },
        { stringNumber: 3, openNote: 'G', fret: 5, note: 'C' },
      ],
      startedAt: 1_000,
    };

    expect(evaluateLocateAnswer(question, ['5:3', '3:5'], 3_500)).toEqual({
      isCorrect: true,
      targetNote: 'C',
      selectedKeys: ['5:3', '3:5'],
      correctKeys: ['5:3', '3:5'],
      wrongKeys: [],
      missedKeys: [],
      correctSelectedCount: 2,
      requiredCount: 2,
      wrongCount: 0,
      missedCount: 0,
      completionPercent: 100,
      responseMs: 2_500,
    });
  });

  test('evaluates a partial reverse locate answer with wrong and missed positions', () => {
    const question = {
      targetNote: 'F',
      requiredPositions: [
        { stringNumber: 6, openNote: 'E', fret: 1, note: 'F' },
        { stringNumber: 4, openNote: 'D', fret: 3, note: 'F' },
      ],
      startedAt: 1_000,
    };

    expect(evaluateLocateAnswer(question, ['6:1', '2:6'], 4_000)).toEqual({
      isCorrect: false,
      targetNote: 'F',
      selectedKeys: ['6:1', '2:6'],
      correctKeys: ['6:1'],
      wrongKeys: ['2:6'],
      missedKeys: ['4:3'],
      correctSelectedCount: 1,
      requiredCount: 2,
      wrongCount: 1,
      missedCount: 1,
      completionPercent: 50,
      responseMs: 3_000,
    });
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
