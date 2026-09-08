export const STORAGE_KEY = 'guitar-fret-note-trainer:aggregate-stats:v1';

function withDerivedSessionStats(stats) {
  return {
    ...stats,
    accuracy: stats.attempts === 0 ? 0 : Math.round((stats.correct / stats.attempts) * 100),
    averageResponseMs: stats.attempts === 0 ? 0 : Math.round(stats.totalResponseMs / stats.attempts),
  };
}

function withDerivedAggregateStats(stats) {
  return {
    ...stats,
    accuracy: stats.totalAttempts === 0 ? 0 : Math.round((stats.totalCorrect / stats.totalAttempts) * 100),
    averageResponseMs:
      stats.totalAttempts === 0 ? 0 : Math.round(stats.totalResponseMs / stats.totalAttempts),
  };
}

export function createSessionStats() {
  return withDerivedSessionStats({
    attempts: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    totalResponseMs: 0,
  });
}

export function recordSessionAnswer(stats, result) {
  const streak = result.isCorrect ? stats.streak + 1 : 0;
  return withDerivedSessionStats({
    attempts: stats.attempts + 1,
    correct: stats.correct + (result.isCorrect ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    totalResponseMs: stats.totalResponseMs + result.responseMs,
  });
}

export function createAggregateStats() {
  return withDerivedAggregateStats({
    totalAttempts: 0,
    totalCorrect: 0,
    totalResponseMs: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPracticedAt: null,
  });
}

export function recordAggregateAnswer(stats, result, now = new Date()) {
  const currentStreak = result.isCorrect ? stats.currentStreak + 1 : 0;
  return withDerivedAggregateStats({
    totalAttempts: stats.totalAttempts + 1,
    totalCorrect: stats.totalCorrect + (result.isCorrect ? 1 : 0),
    totalResponseMs: stats.totalResponseMs + result.responseMs,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastPracticedAt: now.toISOString(),
  });
}

export function loadAggregateStats(storage = globalThis.localStorage) {
  try {
    const rawStats = storage?.getItem(STORAGE_KEY);
    if (!rawStats) {
      return createAggregateStats();
    }

    const parsed = JSON.parse(rawStats);
    return withDerivedAggregateStats({
      ...createAggregateStats(),
      ...parsed,
    });
  } catch {
    return createAggregateStats();
  }
}

export function saveAggregateStats(stats, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Persistence is optional. Practice should continue even when storage is blocked.
  }
}
