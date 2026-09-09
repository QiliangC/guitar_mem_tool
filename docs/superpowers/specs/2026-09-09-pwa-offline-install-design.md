# PWA Offline Install Design

## Goal
Make the guitar fretboard trainer installable on iPhone from Safari and usable offline after the first successful online load.

## User Experience
The user opens the GitHub Pages URL once in Safari, waits for the page to finish loading, then uses Share → Add to Home Screen. After that, launching from the home screen should work without network access as long as Safari has not cleared site data.

## Scope
- Add a web app manifest with standalone display metadata.
- Add app icons for home screen use.
- Register a service worker from the Vite app.
- Cache the app shell and same-origin static assets.
- Support GitHub Pages subpath `/guitar_mem_tool/` via Vite `BASE_URL`.

## Non-goals
- App Store packaging.
- Android APK packaging.
- Push notifications.
- Background sync.
- User accounts or server storage.

## Service Worker Strategy
- Install: cache the app shell URL for the current scope.
- Fetch navigation requests: network first, fallback to cached app shell.
- Fetch same-origin GET assets: cache first, then network, and store successful responses.
- Activate: delete old app caches.

## Error Handling
If service worker registration is unsupported or fails, the app continues as a normal web page.

## Testing
Unit tests cover service worker URL generation and registration gating for supported/unsupported environments. Build verification checks the manifest and service worker are copied to `dist` and GitHub Pages asset paths are generated with the correct base.
