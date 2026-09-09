export function normalizeBaseUrl(baseUrl = '/') {
  if (!baseUrl || baseUrl === '.') return '/';
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function getServiceWorkerUrl(baseUrl = '/') {
  return `${normalizeBaseUrl(baseUrl)}service-worker.js`;
}

export function canUseServiceWorker(navigatorRef = globalThis.navigator, locationRef = globalThis.location) {
  if (!navigatorRef || !('serviceWorker' in navigatorRef)) return false;
  if (!locationRef) return false;

  const isSecureOrigin = locationRef.protocol === 'https:';
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(locationRef.hostname);
  return isSecureOrigin || isLocalhost;
}

export async function registerPwa({
  navigatorRef = globalThis.navigator,
  locationRef = globalThis.location,
  baseUrl = import.meta.env.BASE_URL,
  enabled = true,
} = {}) {
  if (!enabled || !canUseServiceWorker(navigatorRef, locationRef)) {
    return false;
  }

  const scope = normalizeBaseUrl(baseUrl);
  try {
    await navigatorRef.serviceWorker.register(getServiceWorkerUrl(scope), { scope });
    return true;
  } catch (error) {
    console.info('Service worker registration skipped:', error);
    return false;
  }
}
