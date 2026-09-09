const CACHE_PREFIX = 'guitar-fret-note-trainer';
const CACHE_NAME = `${CACHE_PREFIX}-v1`;

function getAppShellUrl() {
  return new URL('./', self.registration.scope).toString();
}

function isSameScopeRequest(request) {
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  return requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(scopeUrl.pathname);
}

async function cacheAppShell(response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(getAppShellUrl(), response.clone());
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    await cacheAppShell(response);
    return response;
  } catch {
    return caches.match(getAppShellUrl());
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(getAppShellUrl()))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameScopeRequest(request)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstAsset(request));
});
