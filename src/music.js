export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LANDMARK_FRETS = [0, 3, 5, 7, 9];
export const MAX_FRET = 12;

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
