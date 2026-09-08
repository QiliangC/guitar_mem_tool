# Guitar Fret Note Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first fixed-note guitar fretboard trainer with difficulty modes, four-choice quizzes, response timing, and local aggregate stats.

**Architecture:** Use a static Vite app with small ES modules. Keep music calculation, quiz generation, stats persistence, and DOM rendering separate so core behavior is unit-testable without browser UI automation.

**Tech Stack:** Vite, vanilla JavaScript ES modules, CSS, Vitest for unit tests.

---

## File Structure

- `package.json`: scripts and dev dependencies.
- `index.html`: app shell.
- `src/music.js`: notes, tuning, fretboard position generation, difficulty filtering.
- `src/quiz.js`: question creation, multiple-choice generation, answer checking.
- `src/stats.js`: session stats and localStorage-backed aggregate stats.
- `src/app.js`: DOM state, event handling, rendering, auto-advance behavior.
- `src/styles.css`: mobile-first visual design.
- `tests/music.test.js`: music model tests.
- `tests/quiz.test.js`: quiz behavior tests.
- `tests/stats.test.js`: stats behavior tests.

## Tasks

### Task 1: Project setup and tests

**Files:**
- Create: `package.json`
- Create: `tests/music.test.js`
- Create: `tests/quiz.test.js`
- Create: `tests/stats.test.js`

- [ ] Write tests for note calculation, difficulty filtering, quiz answer behavior, and stats persistence.
- [ ] Run `npm test -- --run` and verify tests fail because source modules are missing.

### Task 2: Core music and quiz modules

**Files:**
- Create: `src/music.js`
- Create: `src/quiz.js`

- [ ] Implement sharp-only note calculation for standard tuning.
- [ ] Implement simple/medium/hard difficulty position filtering.
- [ ] Implement deterministic four-choice question generation with injectable RNG.
- [ ] Run `npm test -- --run` and verify music and quiz tests pass.

### Task 3: Stats module

**Files:**
- Create: `src/stats.js`

- [ ] Implement session stats updates.
- [ ] Implement safe localStorage load/save for aggregate stats.
- [ ] Run `npm test -- --run` and verify all unit tests pass.

### Task 4: App UI

**Files:**
- Create: `index.html`
- Create: `src/app.js`
- Create: `src/styles.css`

- [ ] Render practice-first mobile layout.
- [ ] Render 6 strings and frets 0 through 12.
- [ ] Highlight current question position.
- [ ] Render four answer buttons.
- [ ] Implement correct-answer flash and auto-advance.
- [ ] Implement wrong-answer pause, correct answer reveal, and Next button.
- [ ] Render difficulty switcher and stats.

### Task 5: Verification

**Files:**
- Modify as needed based on verification output.

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Run the dev server and manually inspect the page if possible.
