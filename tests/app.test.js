/** @vitest-environment jsdom */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderApp } from '../src/app.js';

function createStorage() {
  const data = new Map();
  return {
    getItem: vi.fn((key) => (data.has(key) ? data.get(key) : null)),
    setItem: vi.fn((key, value) => data.set(key, String(value))),
  };
}

describe('app UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>';
  });

  test('renders the practice-first trainer with a highlighted fretboard position', () => {
    renderApp(document.querySelector('#app'), {
      rng: () => 0,
      now: () => 1_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    expect(document.querySelector('[data-testid="difficulty-simple"]').className).toContain('active');
    expect(document.querySelectorAll('[data-testid="answer-choice"]')).toHaveLength(4);
    expect(document.querySelector('[data-string="6"][data-fret="0"]').className).toContain('active-note');
    expect(document.querySelector('[data-testid="session-attempts"]').textContent).toBe('0');
    expect(document.querySelector('.string-label span')).toBeNull();
  });

  test('records a wrong answer, reveals the correct answer, and waits for Next', () => {
    renderApp(document.querySelector('#app'), {
      rng: () => 0,
      now: () => 2_500,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    const wrongButton = [...document.querySelectorAll('[data-testid="answer-choice"]')].find(
      (button) => button.textContent !== 'E',
    );

    wrongButton.click();

    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('正确答案是 E');
    expect(document.querySelector('[data-testid="next-question"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="session-attempts"]').textContent).toBe('1');
    expect(document.querySelector('[data-testid="session-accuracy"]').textContent).toBe('0%');
  });
});
