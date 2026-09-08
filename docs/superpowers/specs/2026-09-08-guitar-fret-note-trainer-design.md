# Guitar Fret Note Trainer Design

## Goal
Build a mobile-first, pure frontend practice tool for memorizing fixed note names on the guitar fretboard.

## Product Scope
First version focuses only on fixed pitch note recognition. It does not include movable-do, keys, modes, accounts, backend storage, or public deployment setup.

## User Experience
The app uses a practice-first layout: open the page, see a visual 6-string guitar fretboard from fret 0 to fret 12, answer the highlighted position with a four-choice note-name quiz.

Feedback rules:
- Correct answer: flash success briefly, then automatically move to the next question.
- Wrong answer: mark the chosen answer wrong, reveal the correct answer, and wait for the user to tap Next.
- No countdown timer in version 1.
- Record response time per question and display session stats.

## Music Rules
Standard tuning is used from low to high string:

```text
E A D G B E
```

Note names use sharp spelling only:

```text
C, C#, D, D#, E, F, F#, G, G#, A, A#, B
```

Natural notes are:

```text
C, D, E, F, G, A, B
```

## Difficulty Rules
All modes use frets 0 through 12 inclusive.

- Simple: only natural-note positions at landmark frets 0, 3, 5, 7, and 9.
- Medium: only natural-note positions anywhere from fret 0 through 12.
- Hard: all chromatic positions from fret 0 through 12.

## Components and Boundaries
- Music model: calculates note names for string/fret positions and filters positions by difficulty.
- Quiz model: creates a question, generates four unique answer choices, checks answers, and tracks question state.
- Stats model: tracks current session count, correct count, streak, average response time, and persists aggregate history to browser localStorage.
- UI layer: renders fretboard, choices, difficulty controls, feedback, and stats.

## Data Storage
The app has no backend. It persists aggregate history in localStorage only. If localStorage is unavailable, the app still works with in-memory session stats.

## Error Handling
- If localStorage read/write fails, ignore the persistence error and continue session-only.
- If a selected difficulty yields no positions, fall back to hard mode positions. With the defined rules this should not happen.

## Testing
Unit tests cover:
- Note calculation for standard tuning.
- Difficulty filtering.
- Four-choice answer generation.
- Quiz answer state transitions.
- Stats aggregation and localStorage persistence.

Manual verification covers:
- Mobile layout usability.
- Correct answer auto-advance.
- Wrong answer pause and Next behavior.
- Difficulty switching resets the current question.
