import './styles.css';
import { DIFFICULTIES, STRINGS } from './music.js';
import { createQuestion, evaluateAnswer } from './quiz.js';
import {
  createSessionStats,
  loadAggregateStats,
  recordAggregateAnswer,
  recordSessionAnswer,
  saveAggregateStats,
} from './stats.js';

const difficultyLabels = {
  [DIFFICULTIES.SIMPLE]: '简单',
  [DIFFICULTIES.MEDIUM]: '中等',
  [DIFFICULTIES.HARD]: '困难',
};

const difficultyDescriptions = {
  [DIFFICULTIES.SIMPLE]: '自然音 · 0/3/5/7/9 品',
  [DIFFICULTIES.MEDIUM]: '自然音 · 0–12 品',
  [DIFFICULTIES.HARD]: '全音 · 0–12 品',
};

function formatMs(ms) {
  if (!ms) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

function isActivePosition(position, stringNumber, fret) {
  return position.stringNumber === stringNumber && position.fret === fret;
}

function renderDifficultyControls(activeDifficulty) {
  return Object.values(DIFFICULTIES)
    .map(
      (difficulty) => `
        <button
          class="difficulty ${difficulty === activeDifficulty ? 'active' : ''}"
          data-action="difficulty"
          data-difficulty="${difficulty}"
          data-testid="difficulty-${difficulty}"
          type="button"
        >
          <strong>${difficultyLabels[difficulty]}</strong>
          <span>${difficultyDescriptions[difficulty]}</span>
        </button>
      `,
    )
    .join('');
}

function renderFretboard(question) {
  const fretNumbers = Array.from({ length: 13 }, (_, fret) => fret);

  return `
    <section class="fretboard-card" aria-label="吉他指板">
      <div class="fret-numbers" aria-hidden="true">
        <span class="string-label-spacer"></span>
        ${fretNumbers.map((fret) => `<span>${fret}</span>`).join('')}
      </div>
      <div class="fretboard">
        ${STRINGS.map(
          ({ stringNumber, openNote }) => `
            <div class="string-row">
              <div class="string-label">
                <b>${stringNumber}</b><span>${openNote}</span>
              </div>
              ${fretNumbers
                .map((fret) => {
                  const active = isActivePosition(question.position, stringNumber, fret);
                  return `
                    <div
                      class="fret-cell ${active ? 'active-note' : ''}"
                      data-string="${stringNumber}"
                      data-fret="${fret}"
                      aria-label="${stringNumber}弦 ${fret}品${active ? '，当前题目' : ''}"
                    >
                      ${active ? '<span class="note-pulse"></span>' : ''}
                    </div>
                  `;
                })
                .join('')}
            </div>
          `,
        ).join('')}
      </div>
    </section>
  `;
}

function renderChoices(state) {
  return state.question.choices
    .map((choice) => {
      const isSelected = state.result?.selectedNote === choice;
      const isCorrect = state.result?.correctNote === choice;
      const reveal = state.phase !== 'answering';
      const statusClass = reveal && isCorrect ? 'correct' : isSelected && !isCorrect ? 'wrong' : '';

      return `
        <button
          class="choice ${statusClass}"
          data-action="answer"
          data-note="${choice}"
          data-testid="answer-choice"
          ${state.phase === 'answering' ? '' : 'disabled'}
          type="button"
        >${choice}</button>
      `;
    })
    .join('');
}

function renderFeedback(state) {
  if (state.phase === 'correct') {
    return '<div class="feedback success" data-testid="feedback">对了，下一题…</div>';
  }

  if (state.phase === 'wrong') {
    return `
      <div class="feedback error" data-testid="feedback">
        答错了，正确答案是 ${state.result.correctNote}
      </div>
      <button class="next-button" data-action="next" data-testid="next-question" type="button">下一题</button>
    `;
  }

  return '<div class="feedback neutral" data-testid="feedback">看到亮点，尽快反应音名</div>';
}

function renderStats(stats, aggregateStats) {
  return `
    <section class="stats-grid" aria-label="练习统计">
      <div class="stat-card"><span>本轮题数</span><strong data-testid="session-attempts">${stats.attempts}</strong></div>
      <div class="stat-card"><span>正确率</span><strong data-testid="session-accuracy">${stats.accuracy}%</strong></div>
      <div class="stat-card"><span>平均反应</span><strong>${formatMs(stats.averageResponseMs)}</strong></div>
      <div class="stat-card"><span>连对</span><strong>${stats.streak}</strong></div>
      <div class="stat-card wide"><span>历史题数</span><strong>${aggregateStats.totalAttempts}</strong></div>
      <div class="stat-card wide"><span>历史正确率</span><strong>${aggregateStats.accuracy}%</strong></div>
    </section>
  `;
}

export function renderApp(root, options = {}) {
  const rng = options.rng ?? Math.random;
  const now = options.now ?? Date.now;
  const storage = options.storage ?? globalThis.localStorage;
  const autoAdvanceMs = options.autoAdvanceMs ?? 550;
  let autoAdvanceTimer = null;

  const state = {
    difficulty: DIFFICULTIES.SIMPLE,
    question: createQuestion({ difficulty: DIFFICULTIES.SIMPLE, rng, now }),
    phase: 'answering',
    result: null,
    sessionStats: createSessionStats(),
    aggregateStats: loadAggregateStats(storage),
  };

  function newQuestion() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    state.question = createQuestion({ difficulty: state.difficulty, rng, now });
    state.phase = 'answering';
    state.result = null;
    render();
  }

  function recordAnswer(note) {
    if (state.phase !== 'answering') return;

    state.result = evaluateAnswer(state.question, note, now());
    state.phase = state.result.isCorrect ? 'correct' : 'wrong';
    state.sessionStats = recordSessionAnswer(state.sessionStats, state.result);
    state.aggregateStats = recordAggregateAnswer(state.aggregateStats, state.result);
    saveAggregateStats(state.aggregateStats, storage);
    render();

    if (state.result.isCorrect) {
      autoAdvanceTimer = setTimeout(newQuestion, autoAdvanceMs);
    }
  }

  function setDifficulty(difficulty) {
    state.difficulty = difficulty;
    newQuestion();
  }

  function render() {
    root.innerHTML = `
      <div class="app-shell">
        <header class="hero">
          <p class="eyebrow">FretNote / 12品固定音训练</p>
          <h1>看到亮点，说出音名。</h1>
          <p class="hero-copy">标准调弦 E A D G B E · 只用升号音名 · 四选一快速反应</p>
        </header>

        <section class="difficulty-panel" aria-label="难度选择">
          ${renderDifficultyControls(state.difficulty)}
        </section>

        ${renderFretboard(state.question)}

        <section class="quiz-panel">
          <div class="question-line">
            <span>第 ${state.question.position.stringNumber} 弦</span>
            <span>第 ${state.question.position.fret} 品</span>
          </div>
          <div class="choices">
            ${renderChoices(state)}
          </div>
          ${renderFeedback(state)}
        </section>

        ${renderStats(state.sessionStats, state.aggregateStats)}
      </div>
    `;
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (action === 'answer') {
      recordAnswer(actionTarget.dataset.note);
    }
    if (action === 'next') {
      newQuestion();
    }
    if (action === 'difficulty') {
      setDifficulty(actionTarget.dataset.difficulty);
    }
  });

  render();

  return {
    getState: () => structuredClone(state),
    nextQuestion: newQuestion,
  };
}

function boot() {
  const root = document.querySelector('#app');
  if (root && !root.dataset.booted) {
    root.dataset.booted = 'true';
    renderApp(root);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
