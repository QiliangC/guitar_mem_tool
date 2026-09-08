import { DIFFICULTIES, NATURAL_NOTES, NOTES_SHARP, getPositionsForDifficulty } from './music.js';

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
