# Reverse Note Location Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reverse practice mode where users see a note name and select all matching fretboard positions.

**Architecture:** Extend the current vanilla Vite app with a mode state. Keep reverse-mode music lookup and answer evaluation in testable modules, and let the UI render one shared fretboard with different interaction/feedback states depending on mode.

**Tech Stack:** Vite, vanilla JavaScript ES modules, CSS, Vitest, jsdom.

---

## File Structure

- Modify `src/music.js`: add position key helpers, target-note pool helper, and matching-position helper.
- Modify `src/quiz.js`: add reverse question and evaluation functions.
- Modify `src/stats.js`: add completion-percent fields to session and aggregate stats.
- Modify `src/app.js`: add mode switch, reverse mode state, selectable fretboard cells, submit/clear/next flow.
- Modify `src/styles.css`: add mode switch and fretboard feedback marker styles.
- Modify `tests/music.test.js`: test target-note position helpers.
- Modify `tests/quiz.test.js`: test reverse question/evaluation.
- Modify `tests/stats.test.js`: test reverse completion stats.
- Modify `tests/app.test.js`: test UI mode switching and reverse answer flow.

## Tasks

### Task 1: Music helpers

- [ ] Add failing tests in `tests/music.test.js` for position keys, target note pools, and target positions by difficulty.
- [ ] Run `npm test -- --run tests/music.test.js` and verify failure.
- [ ] Implement helpers in `src/music.js`.
- [ ] Run `npm test -- --run tests/music.test.js` and verify pass.

### Task 2: Reverse quiz logic

- [ ] Add failing tests in `tests/quiz.test.js` for creating reverse questions and evaluating selected positions.
- [ ] Run `npm test -- --run tests/quiz.test.js` and verify failure.
- [ ] Implement `createLocateQuestion()` and `evaluateLocateAnswer()` in `src/quiz.js`.
- [ ] Run `npm test -- --run tests/quiz.test.js` and verify pass.

### Task 3: Reverse stats

- [ ] Add failing tests in `tests/stats.test.js` for average completion percent.
- [ ] Run `npm test -- --run tests/stats.test.js` and verify failure.
- [ ] Extend stats models in `src/stats.js`.
- [ ] Run `npm test -- --run tests/stats.test.js` and verify pass.

### Task 4: Reverse mode UI

- [ ] Add failing jsdom tests in `tests/app.test.js` for switching to reverse mode, selecting cells, clearing, submitting, and seeing feedback.
- [ ] Run `npm test -- --run tests/app.test.js` and verify failure.
- [ ] Implement mode switch and reverse mode UI in `src/app.js`.
- [ ] Add selected/correct/wrong/missed styles in `src/styles.css`.
- [ ] Run `npm test -- --run tests/app.test.js` and verify pass.

### Task 5: Final verification

- [ ] Run `npm test -- --run` and confirm all tests pass.
- [ ] Run `npm run build` and confirm production build succeeds.
- [ ] Commit the completed feature.
