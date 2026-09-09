import {
  DIFFICULTIES,
  NATURAL_NOTES,
  NOTES_SHARP,
  getPositionKey,
  getPositionsForDifficulty,
  getPositionsForTargetNote,
  getTargetNotesForDifficulty,
} from './music.js';

function pickRandom(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function shuffled(items, rng) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getAnswerPoolForDifficulty(difficulty) {
  return difficulty === DIFFICULTIES.HARD ? NOTES_SHARP : NATURAL_NOTES;
}

export function createChoices(correctNote, rng = Math.random, answerPool = NOTES_SHARP) {
  const usablePool = answerPool.includes(correctNote) ? answerPool : NOTES_SHARP;
  const distractors = shuffled(
    usablePool.filter((note) => note !== correctNote),
    rng,
  ).slice(0, 3);

  return shuffled([correctNote, ...distractors], rng);
}

export function createQuestion({
  difficulty = DIFFICULTIES.SIMPLE,
  rng = Math.random,
  positions = getPositionsForDifficulty(difficulty),
  now = Date.now,
} = {}) {
  const safePositions = positions.length > 0 ? positions : getPositionsForDifficulty(DIFFICULTIES.HARD);
  const position = pickRandom(safePositions, rng);

  return {
    position,
    correctNote: position.note,
    choices: createChoices(position.note, rng, getAnswerPoolForDifficulty(difficulty)),
    startedAt: now(),
  };
}

export function evaluateAnswer(question, selectedNote, answeredAt = Date.now()) {
  return {
    isCorrect: selectedNote === question.correctNote,
    selectedNote,
    correctNote: question.correctNote,
    responseMs: Math.max(0, answeredAt - question.startedAt),
  };
}

export function createLocateQuestion({ difficulty = DIFFICULTIES.SIMPLE, rng = Math.random, now = Date.now } = {}) {
  const targetNotes = getTargetNotesForDifficulty(difficulty);
  const targetNote = pickRandom(targetNotes, rng);

  return {
    targetNote,
    requiredPositions: getPositionsForTargetNote(difficulty, targetNote),
    startedAt: now(),
  };
}

export function evaluateLocateAnswer(question, selectedKeys, answeredAt = Date.now()) {
  const requiredKeys = question.requiredPositions.map(getPositionKey);
  const requiredKeySet = new Set(requiredKeys);
  const uniqueSelectedKeys = [...new Set(selectedKeys)];
  const correctKeys = uniqueSelectedKeys.filter((key) => requiredKeySet.has(key));
  const wrongKeys = uniqueSelectedKeys.filter((key) => !requiredKeySet.has(key));
  const selectedKeySet = new Set(uniqueSelectedKeys);
  const missedKeys = requiredKeys.filter((key) => !selectedKeySet.has(key));
  const requiredCount = requiredKeys.length;

  return {
    isCorrect: wrongKeys.length === 0 && missedKeys.length === 0,
    targetNote: question.targetNote,
    selectedKeys: uniqueSelectedKeys,
    correctKeys,
    wrongKeys,
    missedKeys,
    correctSelectedCount: correctKeys.length,
    requiredCount,
    wrongCount: wrongKeys.length,
    missedCount: missedKeys.length,
    completionPercent: requiredCount === 0 ? 0 : Math.round((correctKeys.length / requiredCount) * 100),
    responseMs: Math.max(0, answeredAt - question.startedAt),
  };
}
