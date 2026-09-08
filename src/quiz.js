import { DIFFICULTIES, NOTES_SHARP, getPositionsForDifficulty } from './music.js';

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

export function createChoices(correctNote, rng = Math.random) {
  const distractors = shuffled(
    NOTES_SHARP.filter((note) => note !== correctNote),
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
    choices: createChoices(position.note, rng),
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
