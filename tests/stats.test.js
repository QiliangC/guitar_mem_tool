import { describe, expect, test } from 'vitest';
import {
  createAggregateStats,
  createSessionStats,
  loadAggregateStats,
  recordAggregateAnswer,
  recordSessionAnswer,
  saveAggregateStats,
} from '../src/stats.js';

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
  };
}

describe('stats model', () => {
  test('records session attempts, accuracy, average response time, and streak', () => {
    let stats = createSessionStats();

    stats = recordSessionAnswer(stats, { isCorrect: true, responseMs: 1_000 });
    stats = recordSessionAnswer(stats, { isCorrect: false, responseMs: 2_000 });
    stats = recordSessionAnswer(stats, { isCorrect: true, responseMs: 3_000 });

    expect(stats).toEqual({
      attempts: 3,
      correct: 2,
      streak: 1,
      bestStreak: 1,
      totalResponseMs: 6_000,
      accuracy: 67,
      averageResponseMs: 2_000,
      totalCompletionPercent: 200,
      averageCompletionPercent: 67,
    });
  });

  test('records aggregate stats for long-term local history', () => {
    let stats = createAggregateStats();

    stats = recordAggregateAnswer(stats, { isCorrect: true, responseMs: 800, completionPercent: 100 });
    stats = recordAggregateAnswer(stats, { isCorrect: true, responseMs: 1_200, completionPercent: 50 });

    expect(stats).toMatchObject({
      totalAttempts: 2,
      totalCorrect: 2,
      totalResponseMs: 2_000,
      totalCompletionPercent: 150,
      bestStreak: 2,
      currentStreak: 2,
      accuracy: 100,
      averageResponseMs: 1_000,
      averageCompletionPercent: 75,
    });
    expect(stats.lastPracticedAt).toBeTypeOf('string');
  });

  test('safely saves and loads aggregate stats from storage', () => {
    const storage = createMemoryStorage();
    const stats = recordAggregateAnswer(createAggregateStats(), { isCorrect: false, responseMs: 1_500 });

    saveAggregateStats(stats, storage);

    expect(loadAggregateStats(storage)).toMatchObject({
      totalAttempts: 1,
      totalCorrect: 0,
      totalResponseMs: 1_500,
      currentStreak: 0,
    });
  });

  test('falls back to empty aggregate stats when storage is broken', () => {
    const brokenStorage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };

    expect(loadAggregateStats(brokenStorage)).toEqual(createAggregateStats());
    expect(() => saveAggregateStats(createAggregateStats(), brokenStorage)).not.toThrow();
  });
});
