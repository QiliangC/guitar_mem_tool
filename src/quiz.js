import {
  DIFFICULTIES,
  NATURAL_NOTES,
  NOTES_SHARP,
  SCALE_LAYER_DEGREES,
  SCALE_LAYERS,
  getCagedPositionsForLayer,
  getCagedShapeFretRange,
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

export function createDegreeQuestion({
  tonic = 'E',
  shapeId = 'C',
  layer = SCALE_LAYERS.FULL,
  rng = Math.random,
  now = Date.now,
} = {}) {
  const positions = getCagedPositionsForLayer({ tonic, shapeId, layer });
  const availableDegrees = [...new Set(positions.map((position) => position.degree))];
  const targetDegree = pickRandom(availableDegrees, rng);
  const matchingPositions = positions.filter((position) => position.degree === targetDegree);
  const position = pickRandom(matchingPositions, rng);
  const distractors = shuffled(
    SCALE_LAYER_DEGREES[SCALE_LAYERS.FULL].filter((degree) => degree !== targetDegree),
    rng,
  ).slice(0, 3);

  return {
    kind: 'degree-identify',
    tonic,
    shapeId,
    layer,
    position,
    correctDegree: targetDegree,
    correctNote: position.note,
    choices: shuffled([targetDegree, ...distractors], rng),
    fretRange: getCagedShapeFretRange(tonic, shapeId),
    startedAt: now(),
  };
}

export function evaluateDegreeAnswer(question, selectedDegree, answeredAt = Date.now()) {
  return {
    isCorrect: Number(selectedDegree) === question.correctDegree,
    selectedDegree: Number(selectedDegree),
    correctDegree: question.correctDegree,
    correctNote: question.correctNote,
    responseMs: Math.max(0, answeredAt - question.startedAt),
  };
}

export function createDegreeLocateQuestion({
  tonic = 'E',
  shapeId = 'C',
  layer = SCALE_LAYERS.FULL,
  rng = Math.random,
  now = Date.now,
} = {}) {
  const positions = getCagedPositionsForLayer({ tonic, shapeId, layer });
  const degrees = [...new Set(positions.map((position) => position.degree))];
  const targetDegree = pickRandom(degrees, rng);

  return {
    kind: 'degree-locate',
    tonic,
    shapeId,
    layer,
    targetDegree,
    requiredPositions: positions.filter((position) => position.degree === targetDegree),
    fretRange: getCagedShapeFretRange(tonic, shapeId),
    startedAt: now(),
  };
}

export function createShapeBuildQuestion({
  tonic = 'E',
  shapeId = 'C',
  layer = SCALE_LAYERS.FULL,
  now = Date.now,
} = {}) {
  return {
    kind: 'shape-build',
    tonic,
    shapeId,
    layer,
    requiredPositions: getCagedPositionsForLayer({ tonic, shapeId, layer }),
    fretRange: getCagedShapeFretRange(tonic, shapeId),
    startedAt: now(),
  };
}

export const MELODY_PATTERNS = [
  [0, 1, 2, 4, 2, 1, 0],
  [0, 2, 4, 2, 0],
  [0, 1, 3, 2, 4, 3, 2, 0],
  [0, 4, 3, 2, 1, 0],
  [0, 2, 1, 4, 3, 2, 0],
  [0, 1, 2, 3, 4, 2, 0],
  [0, 4, 5, 4, 2, 1, 0],
  [0, 2, 4, 5, 4, 2, 0],
  [0, 1, 2, 3, 4, 5, 6, 7],
  [0, -1, -2, -3, -4, -2, 0],
  [0, -2, -4, -2, 0],
  [0, 1, -1, 0, 2, 1, 0],
  [0, 2, 1, 3, 2, 1, 0],
  [0, 3, 2, 4, 3, 1, 0],
  [0, 1, 4, 3, 2, 5, 4, 0],
  [0, -1, 1, 0, -2, -1, 0],
];

export function createMelodyQuestion({
  tonic = 'E',
  shapeId = 'C',
  layer = SCALE_LAYERS.FULL,
  startPosition = null,
  rng = Math.random,
  now = Date.now,
} = {}) {
  const positions = getCagedPositionsForLayer({ tonic, shapeId, layer })
    .sort((left, right) => left.midi - right.midi);
  let chosenStart = startPosition
    ? positions.find((position) => getPositionKey(position) === getPositionKey(startPosition))
    : null;
  let melodyIndex;

  if (chosenStart) {
    const startIndex = positions.indexOf(chosenStart);
    const validMelodyIndexes = MELODY_PATTERNS
      .map((offsets, index) => ({ offsets, index }))
      .filter(({ offsets }) => {
        const minOffset = Math.min(...offsets);
        const maxOffset = Math.max(...offsets);
        return startIndex + minOffset >= 0 && startIndex + maxOffset < positions.length;
      })
      .map(({ index }) => index);
    melodyIndex = pickRandom(validMelodyIndexes, rng);
  } else {
    melodyIndex = Math.floor(rng() * MELODY_PATTERNS.length);
    const offsets = MELODY_PATTERNS[melodyIndex];
    const minOffset = Math.min(...offsets);
    const maxOffset = Math.max(...offsets);
    const roots = positions.filter(
      (position, index) =>
        position.degree === 1
        && index + minOffset >= 0
        && index + maxOffset < positions.length,
    );
    chosenStart = pickRandom(roots, rng);
  }

  const offsets = MELODY_PATTERNS[melodyIndex];
  const startIndex = positions.indexOf(chosenStart);
  const pathPositions = offsets.map((offset) => positions[startIndex + offset]);

  return {
    kind: 'melody',
    tonic,
    shapeId,
    layer,
    melodyIndex,
    startPosition: chosenStart,
    pathPositions,
    notation: pathPositions.map((position) => ({
      degree: position.degree,
      octaveOffset: Math.floor((position.midi - chosenStart.midi) / 12),
    })),
    fretRange: getCagedShapeFretRange(tonic, shapeId),
    startedAt: now(),
  };
}

export function evaluateMelodyAnswer(question, selectedKeys, mistakeCount, answeredAt = Date.now()) {
  const expectedKeys = question.pathPositions.map(getPositionKey);
  const isComplete = selectedKeys.length === expectedKeys.length;
  return {
    isCorrect: isComplete && mistakeCount === 0,
    selectedKeys,
    expectedKeys,
    correctKeys: [...new Set(selectedKeys)],
    wrongKeys: [],
    missedKeys: isComplete ? [] : expectedKeys.slice(selectedKeys.length),
    correctSelectedCount: selectedKeys.length,
    requiredCount: expectedKeys.length,
    wrongCount: mistakeCount,
    missedCount: isComplete ? 0 : expectedKeys.length - selectedKeys.length,
    completionPercent: Math.round((selectedKeys.length / expectedKeys.length) * 100),
    responseMs: Math.max(0, answeredAt - question.startedAt),
  };
}
