export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LANDMARK_FRETS = [0, 3, 5, 7, 9];
export const MAX_FRET = 12;

export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export const SCALE_LAYERS = {
  ROOT: 'root',
  TRIAD: 'triad',
  PENTATONIC: 'pentatonic',
  FULL: 'full',
};

export const SCALE_LAYER_DEGREES = {
  [SCALE_LAYERS.ROOT]: [1],
  [SCALE_LAYERS.TRIAD]: [1, 3, 5],
  [SCALE_LAYERS.PENTATONIC]: [1, 2, 3, 5, 6],
  [SCALE_LAYERS.FULL]: [1, 2, 3, 4, 5, 6, 7],
};

export const CAGED_SHAPES = {
  C: { id: 'C', anchorString: 5, label: 'C 型', anchorLabel: '5弦根音' },
  G: { id: 'G', anchorString: 6, label: 'G 型', anchorLabel: '6弦根音' },
};

export const DIFFICULTIES = {
  SIMPLE: 'simple',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const STRINGS = [
  { stringNumber: 6, openNote: 'E' },
  { stringNumber: 5, openNote: 'A' },
  { stringNumber: 4, openNote: 'D' },
  { stringNumber: 3, openNote: 'G' },
  { stringNumber: 2, openNote: 'B' },
  { stringNumber: 1, openNote: 'E' },
];

const openNoteByString = new Map(STRINGS.map((string) => [string.stringNumber, string.openNote]));
const openMidiByString = new Map([
  [6, 40],
  [5, 45],
  [4, 50],
  [3, 55],
  [2, 59],
  [1, 64],
]);

export function isNaturalNote(note) {
  return NATURAL_NOTES.includes(note);
}

export function getNoteAt(stringNumber, fret) {
  const openNote = openNoteByString.get(stringNumber);
  if (!openNote) {
    throw new Error(`Unknown string number: ${stringNumber}`);
  }

  const openIndex = NOTES_SHARP.indexOf(openNote);
  const noteIndex = (openIndex + fret) % NOTES_SHARP.length;
  return NOTES_SHARP[noteIndex];
}

export function getMidiAt(stringNumber, fret) {
  const openMidi = openMidiByString.get(stringNumber);
  if (openMidi === undefined) throw new Error(`Unknown string number: ${stringNumber}`);
  return openMidi + fret;
}

export function getAllPositions(maxFret = MAX_FRET) {
  return STRINGS.flatMap(({ stringNumber, openNote }) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => ({
      stringNumber,
      openNote,
      fret,
      note: getNoteAt(stringNumber, fret),
    })),
  );
}

export function getPositionsForDifficulty(difficulty) {
  const positions = getAllPositions(MAX_FRET);

  if (difficulty === DIFFICULTIES.SIMPLE) {
    return positions.filter(
      (position) => LANDMARK_FRETS.includes(position.fret) && isNaturalNote(position.note),
    );
  }

  if (difficulty === DIFFICULTIES.MEDIUM) {
    return positions.filter((position) => isNaturalNote(position.note));
  }

  return positions;
}

export function getPositionKey(position) {
  return `${position.stringNumber}:${position.fret}`;
}

export function parsePositionKey(positionKey) {
  const [stringNumber, fret] = positionKey.split(':').map(Number);
  return { stringNumber, fret };
}

export function getTargetNotesForDifficulty(difficulty) {
  const noteSet = new Set(getPositionsForDifficulty(difficulty).map((position) => position.note));
  return NOTES_SHARP.filter((note) => noteSet.has(note));
}

export function getPositionsForTargetNote(difficulty, targetNote) {
  return getPositionsForDifficulty(difficulty).filter((position) => position.note === targetNote);
}

export function getMajorScaleDegree(note, tonic) {
  const noteIndex = NOTES_SHARP.indexOf(note);
  const tonicIndex = NOTES_SHARP.indexOf(tonic);
  if (noteIndex === -1 || tonicIndex === -1) return null;

  const interval = (noteIndex - tonicIndex + NOTES_SHARP.length) % NOTES_SHARP.length;
  const degreeIndex = MAJOR_SCALE_INTERVALS.indexOf(interval);
  return degreeIndex === -1 ? null : degreeIndex + 1;
}

export function getMajorScaleNotes(tonic) {
  const tonicIndex = NOTES_SHARP.indexOf(tonic);
  if (tonicIndex === -1) return [];
  return MAJOR_SCALE_INTERVALS.map(
    (interval) => NOTES_SHARP[(tonicIndex + interval) % NOTES_SHARP.length],
  );
}

export function getCagedShapeFretRange(tonic, shapeId) {
  const shape = CAGED_SHAPES[shapeId];
  if (!shape) throw new Error(`Unknown CAGED shape: ${shapeId}`);

  const tonicIndex = NOTES_SHARP.indexOf(tonic);
  if (tonicIndex === -1) throw new Error(`Unknown tonic: ${tonic}`);

  const openNote = openNoteByString.get(shape.anchorString);
  const openIndex = NOTES_SHARP.indexOf(openNote);
  let anchorFret = (tonicIndex - openIndex + NOTES_SHARP.length) % NOTES_SHARP.length;

  // C and G forms occupy the four-fret area ending at their low root anchor.
  // Move open-position anchors up one octave when needed so the whole form is visible.
  if (anchorFret < 3) anchorFret += NOTES_SHARP.length;

  return {
    startFret: anchorFret - 3,
    endFret: anchorFret,
    anchorFret,
    anchorString: shape.anchorString,
  };
}

export function getCagedShapePositions({ tonic = 'E', shapeId = 'C' } = {}) {
  const fretRange = getCagedShapeFretRange(tonic, shapeId);
  return getAllPositions(fretRange.endFret)
    .filter(
      (position) =>
        position.fret >= fretRange.startFret && position.fret <= fretRange.endFret,
    )
    .map((position) => ({
      ...position,
      degree: getMajorScaleDegree(position.note, tonic),
      midi: getMidiAt(position.stringNumber, position.fret),
      shapeId,
    }))
    .filter((position) => position.degree !== null);
}

export function getCagedPositionsForLayer({
  tonic = 'E',
  shapeId = 'C',
  layer = SCALE_LAYERS.FULL,
} = {}) {
  const degrees = SCALE_LAYER_DEGREES[layer] ?? SCALE_LAYER_DEGREES[SCALE_LAYERS.FULL];
  return getCagedShapePositions({ tonic, shapeId }).filter((position) =>
    degrees.includes(position.degree),
  );
}
