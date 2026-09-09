# Reverse Note Location Mode Design

## Goal
Add a second practice mode where the app gives a target note name and the user finds all matching positions on the 0–12 fret guitar fretboard.

## User Experience
The app gets a top-level mode switch:

```text
看位置选音名 | 看音名找位置
```

The existing mode remains the default. In the new reverse mode:

1. The app shows a target note, such as `F`.
2. The user taps fretboard cells to select positions. Tapping a selected cell again removes the selection.
3. The user can tap `清空选择` before submitting.
4. The user taps `提交答案`.
5. The fretboard shows color-only feedback:
   - Green: selected correct position.
   - Red: selected wrong position.
   - Yellow outlined marker: missed correct position.
6. The user taps `下一题` to continue.

## Difficulty Rules
Reverse mode uses the same difficulty rules as the existing fixed-note quiz:

- Simple: target notes are natural notes only; correct positions are natural-note positions at frets 0, 3, 5, 7, and 9.
- Medium: target notes are natural notes only; correct positions are all matching natural-note positions from fret 0 through 12.
- Hard: target notes can be natural or sharp notes; correct positions are all matching positions from fret 0 through 12.

The target note pool for each difficulty is the unique set of note names available in that difficulty's position pool.

## Scoring
A reverse-mode answer records:

- `isCorrect`: true only when there are no missed positions and no wrong selections.
- `correctSelectedCount`: selected positions that match the target note.
- `requiredCount`: total positions that should have been selected.
- `wrongCount`: selected positions that do not match the target note.
- `missedCount`: correct positions that were not selected.
- `completionPercent`: `correctSelectedCount / requiredCount`, rounded to a percentage.
- `responseMs`: time from question creation to submit.

Session stats use `isCorrect` for all-correct rate and streak. Reverse-mode UI also shows average completion percent.

## Architecture
- `src/music.js`: expose helpers for position keys, parsing keys, and finding matching target-note positions in a difficulty.
- `src/quiz.js`: add reverse question creation and reverse answer evaluation.
- `src/stats.js`: extend session and aggregate stats to track reverse completion totals without breaking existing forward stats.
- `src/app.js`: add mode state, mode switcher, selectable fretboard cells, reverse-mode submit/clear/next flow, and feedback rendering.
- `src/styles.css`: add selected, correct, wrong, and missed fretboard marker styles.

## Persistence
Aggregate history remains localStorage-only. Existing stored stats should load safely by merging with new default fields.

## Testing
Automated tests cover:
- Matching target positions for a difficulty.
- Reverse question generation.
- Reverse answer evaluation for perfect and partial answers.
- Reverse stats updates.
- UI mode switching, position selection, submit feedback, and clear behavior.

Manual checks cover mobile usability and visual feedback colors.
