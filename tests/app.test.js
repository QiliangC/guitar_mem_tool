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

    expect(document.querySelector('h1').textContent).toBe('指板音名训练');
    expect(document.body.textContent).not.toContain('看到亮点，说出音名。');
    expect(document.querySelector('[data-testid="difficulty-simple"]').className).toContain('active');
    expect(document.querySelectorAll('[data-testid="answer-choice"]')).toHaveLength(4);
    expect(document.querySelector('[data-string="6"][data-fret="0"]').className).toContain('active-note');
    expect(document.querySelector('[data-testid="session-attempts"]').textContent).toBe('0');
    expect(document.querySelector('.string-label span')).toBeNull();
    expect([...document.querySelectorAll('.string-label b')].map((label) => label.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(
      [...document.querySelectorAll('[data-testid="fret-marker"]')].map((marker) => marker.dataset.fretMarker),
    ).toEqual(['3', '5', '7', '9']);
  });

  test('switches to reverse mode, selects positions, clears them, and submits feedback', () => {
    renderApp(document.querySelector('#app'), {
      rng: () => 0,
      now: () => 3_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    document.querySelector('[data-testid="mode-locate"]').click();

    expect(document.querySelector('[data-testid="target-note"]').textContent).toBe('C');
    expect(document.querySelector('[data-testid="submit-locate"]')).not.toBeNull();

    document.querySelector('[data-string="5"][data-fret="3"]').click();
    document.querySelector('[data-string="2"][data-fret="6"]').click();

    expect(document.querySelector('[data-string="5"][data-fret="3"]').className).toContain('selected-position');
    expect(document.querySelector('[data-string="2"][data-fret="6"]').className).toContain('selected-position');

    document.querySelector('[data-testid="clear-locate"]').click();

    expect(document.querySelector('[data-string="5"][data-fret="3"]').className).not.toContain('selected-position');
    expect(document.querySelector('[data-string="2"][data-fret="6"]').className).not.toContain('selected-position');

    document.querySelector('[data-string="5"][data-fret="3"]').click();
    document.querySelector('[data-string="2"][data-fret="6"]').click();
    document.querySelector('[data-testid="submit-locate"]').click();

    expect(document.querySelector('[data-string="5"][data-fret="3"]').className).toContain('correct-position');
    expect(document.querySelector('[data-string="2"][data-fret="6"]').className).toContain('wrong-position');
    expect(document.querySelector('[data-string="3"][data-fret="5"]').className).toContain('missed-position');
    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('完成率 50%');
    expect(document.querySelector('[data-testid="next-question"]')).not.toBeNull();
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

  test('builds an E-major C form from a root anchor and grades the whole shape', () => {
    const app = renderApp(document.querySelector('#app'), {
      rng: () => 0,
      now: () => 3_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    document.querySelector('[data-testid="content-degree"]').click();

    expect(document.querySelector('[data-testid="tonic-select"]').value).toBe('E');
    expect(document.querySelector('[data-testid="shape-C"]').className).toContain('active');
    expect(document.querySelector('[data-testid="layer-triad"]').className).toContain('active');
    expect(document.querySelector('[data-fret="4"]')).not.toBeNull();
    expect(document.querySelector('[data-fret="3"]')).toBeNull();

    document.querySelector('[data-string="6"][data-fret="5"]').click();
    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('不是 1');

    document.querySelector('[data-string="5"][data-fret="7"]').click();
    expect(document.querySelector('[data-testid="submit-build"]')).not.toBeNull();

    const { requiredPositions } = app.getState().question;
    for (const position of requiredPositions) {
      if (position.stringNumber === 5 && position.fret === 7) continue;
      document.querySelector(`[data-string="${position.stringNumber}"][data-fret="${position.fret}"]`).click();
    }
    document.querySelector('[data-testid="submit-build"]').click();

    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('全对');
    expect(document.querySelector('[data-testid="session-attempts"]').textContent).toBe('1');
  });

  test('switches C/G forms and trains all seven scale degrees', () => {
    renderApp(document.querySelector('#app'), {
      rng: () => 0,
      now: () => 3_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    document.querySelector('[data-testid="content-degree"]').click();
    document.querySelector('[data-testid="shape-G"]').click();
    document.querySelector('[data-testid="layer-full"]').click();
    document.querySelector('[data-testid="mode-identify"]').click();

    expect(document.querySelector('[data-testid="shape-G"]').className).toContain('active');
    expect(document.querySelector('[data-testid="layer-full"]').className).toContain('active');
    expect(document.querySelectorAll('[data-testid="answer-choice"]')).toHaveLength(4);
    expect(document.querySelector('[data-fret="9"]')).not.toBeNull();
    expect(document.querySelector('[data-fret="12"]')).not.toBeNull();
  });

  test('can let the system choose both tonic and C/G form', () => {
    renderApp(document.querySelector('#app'), {
      rng: () => 0.5,
      now: () => 3_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    document.querySelector('[data-testid="content-degree"]').click();
    document.querySelector('[data-testid="auto-setup"]').click();

    expect(document.querySelector('[data-testid="auto-setup"]').className).toContain('active');
    expect(document.querySelector('[data-testid="tonic-select"]').value).toBe('F#');
    expect(document.querySelector('[data-testid="tonic-select"]').disabled).toBe(true);
    expect(document.querySelector('[data-testid="shape-G"]').className).toContain('active');
  });

  test('plays a short numbered melody in order and distinguishes the high octave', () => {
    const app = renderApp(document.querySelector('#app'), {
      rng: () => 0.5,
      now: () => 3_000,
      storage: createStorage(),
      autoAdvanceMs: 0,
    });

    document.querySelector('[data-testid="content-degree"]').click();
    document.querySelector('[data-testid="mode-melody"]').click();

    expect(document.querySelector('[data-testid="layer-full"]').className).toContain('active');
    document.querySelector('[data-string="6"][data-fret="4"]').click();
    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('不是 1');

    document.querySelector('[data-string="5"][data-fret="7"]').click();
    expect(document.querySelector('[data-testid="melody-line"] .degree-token.high')).not.toBeNull();

    for (const position of app.getState().question.pathPositions.slice(1)) {
      document.querySelector(`[data-string="${position.stringNumber}"][data-fret="${position.fret}"]`).click();
    }

    expect(document.querySelector('[data-testid="feedback"]').textContent).toContain('完成率 100%');
    expect(document.querySelector('[data-testid="session-attempts"]').textContent).toBe('1');
  });
});
