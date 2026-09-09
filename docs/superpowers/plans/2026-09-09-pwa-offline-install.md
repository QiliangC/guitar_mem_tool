# PWA Offline Install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add iPhone-installable PWA metadata and offline caching to the guitar fretboard trainer.

**Architecture:** Add a small `src/pwa.js` registration module that is unit-tested separately, and add static PWA assets under `public/` so Vite copies them into `dist`. Register the service worker from `src/app.js` without blocking app startup.

**Tech Stack:** Vite, vanilla JavaScript ES modules, Vitest, static Web App Manifest, vanilla Service Worker API.

---

## File Structure

- Create `src/pwa.js`: service worker support checks, URL generation, and registration.
- Modify `src/app.js`: import and call registration during boot.
- Create `tests/pwa.test.js`: unit tests for registration behavior.
- Modify `index.html`: link manifest and Apple home screen metadata.
- Create `public/manifest.webmanifest`: PWA install metadata.
- Create `public/service-worker.js`: offline cache worker.
- Create `public/icons/icon.svg`: scalable app icon.

## Tasks

### Task 1: Registration module

- [ ] Add failing tests in `tests/pwa.test.js` for GitHub Pages service worker URL generation and unsupported environment handling.
- [ ] Run `npm test -- --run tests/pwa.test.js` and verify failure.
- [ ] Implement `src/pwa.js`.
- [ ] Run `npm test -- --run tests/pwa.test.js` and verify pass.

### Task 2: Static PWA assets

- [ ] Add `public/manifest.webmanifest` with relative `start_url` and `scope`.
- [ ] Add `public/service-worker.js` with app-shell fallback and asset caching.
- [ ] Add `public/icons/icon.svg`.
- [ ] Link manifest and icon metadata from `index.html`.

### Task 3: App integration and verification

- [ ] Import `registerPwa` in `src/app.js` and call it during boot.
- [ ] Run `npm test -- --run` and confirm all tests pass.
- [ ] Run `GITHUB_PAGES=true npm run build` and confirm manifest/service-worker/icon exist in `dist`.
- [ ] Commit the completed PWA feature.
