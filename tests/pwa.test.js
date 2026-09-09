import { describe, expect, test, vi } from 'vitest';
import { canUseServiceWorker, getServiceWorkerUrl, registerPwa } from '../src/pwa.js';

describe('PWA registration', () => {
  test('builds the service worker URL from the Vite base path', () => {
    expect(getServiceWorkerUrl('/')).toBe('/service-worker.js');
    expect(getServiceWorkerUrl('/guitar_mem_tool/')).toBe('/guitar_mem_tool/service-worker.js');
    expect(getServiceWorkerUrl('/guitar_mem_tool')).toBe('/guitar_mem_tool/service-worker.js');
  });

  test('only enables service worker on https or localhost-like origins', () => {
    expect(
      canUseServiceWorker({ serviceWorker: {} }, { protocol: 'https:', hostname: 'qiliangc.github.io' }),
    ).toBe(true);
    expect(canUseServiceWorker({ serviceWorker: {} }, { protocol: 'http:', hostname: 'localhost' })).toBe(true);
    expect(canUseServiceWorker({ serviceWorker: {} }, { protocol: 'http:', hostname: '127.0.0.1' })).toBe(true);
    expect(canUseServiceWorker({ serviceWorker: {} }, { protocol: 'http:', hostname: 'example.com' })).toBe(false);
    expect(canUseServiceWorker({}, { protocol: 'https:', hostname: 'qiliangc.github.io' })).toBe(false);
  });

  test('registers service worker with the matching app scope', async () => {
    const register = vi.fn().mockResolvedValue({ scope: '/guitar_mem_tool/' });

    const didRegister = await registerPwa({
      navigatorRef: { serviceWorker: { register } },
      locationRef: { protocol: 'https:', hostname: 'qiliangc.github.io' },
      baseUrl: '/guitar_mem_tool/',
    });

    expect(didRegister).toBe(true);
    expect(register).toHaveBeenCalledWith('/guitar_mem_tool/service-worker.js', {
      scope: '/guitar_mem_tool/',
    });
  });

  test('does not register when disabled', async () => {
    const register = vi.fn().mockResolvedValue({});

    const didRegister = await registerPwa({
      navigatorRef: { serviceWorker: { register } },
      locationRef: { protocol: 'https:', hostname: 'qiliangc.github.io' },
      baseUrl: '/',
      enabled: false,
    });

    expect(didRegister).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  test('does not throw when registration fails', async () => {
    const register = vi.fn().mockRejectedValue(new Error('blocked'));

    await expect(
      registerPwa({
        navigatorRef: { serviceWorker: { register } },
        locationRef: { protocol: 'https:', hostname: 'qiliangc.github.io' },
        baseUrl: '/',
      }),
    ).resolves.toBe(false);
  });
});
