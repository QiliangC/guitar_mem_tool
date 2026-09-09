import './styles.css';
import { DIFFICULTIES, STRINGS, getPositionKey } from './music.js';
import { registerPwa } from './pwa.js';
import { createLocateQuestion, createQuestion, evaluateAnswer, evaluateLocateAnswer } from './quiz.js';
import {
  createSessionStats,
  loadAggregateStats,
  recordAggregateAnswer,
  recordSessionAnswer,
  saveAggregateStats,
} from './stats.js';

const MODES = {
  IDENTIFY: 'identify',
  LOCATE: 'locate',
};

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

const FRET_MARKER_FRETS = [3, 5, 7, 9];

function formatMs(ms) {
  if (!ms) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

function isActivePosition(position, stringNumber, fret) {
  return position?.stringNumber === stringNumber && position?.fret === fret;
}

function renderModeSwitch(activeMode) {
  return `
    <section class="mode-switch" aria-label="练习模式">
      <button
        class="mode-tab ${activeMode === MODES.IDENTIFY ? 'active' : ''}"
        data-action="mode"
        data-mode="${MODES.IDENTIFY}"
        data-testid="mode-identify"
        type="button"
      >看位置选音名</button>
      <button
        class="mode-tab ${activeMode === MODES.LOCATE ? 'active' : ''}"
        data-action="mode"
        data-mode="${MODES.LOCATE}"
        data-testid="mode-locate"
        type="button"
      >看音名找位置</button>
    </section>
  `;
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

function getLocateCellClass(state, positionKey) {
  if (state.mode !== MODES.LOCATE) return '';

  const classes = [];
  if (state.selectedKeys.has(positionKey) && state.phase === 'answering') {
    classes.push('selected-position');
  }
  if (state.phase === 'review' && state.result?.correctKeys.includes(positionKey)) {
    classes.push('correct-position');
  }
  if (state.phase === 'review' && state.result?.wrongKeys.includes(positionKey)) {
    classes.push('wrong-position');
  }
  if (state.phase === 'review' && state.result?.missedKeys.includes(positionKey)) {
    classes.push('missed-position');
  }
  return classes.join(' ');
}

function renderFretboard(state) {
  const fretNumbers = Array.from({ length: 13 }, (_, fret) => fret);
  const displayStrings = [...STRINGS].reverse();

  return `
    <section class="fretboard-card" aria-label="吉他指板">
      <div class="fret-numbers" aria-hidden="true">
        <span class="string-label-spacer"></span>
        ${fretNumbers.map((fret) => `<span>${fret}</span>`).join('')}
      </div>
      <div class="fretboard">
        <div class="fret-markers" aria-hidden="true">
          <span class="string-label-spacer"></span>
          ${fretNumbers
            .map((fret) =>
              FRET_MARKER_FRETS.includes(fret)
                ? `<span class="fret-marker-cell"><span class="fret-marker" data-testid="fret-marker" data-fret-marker="${fret}"></span></span>`
                : '<span></span>',
            )
            .join('')}
        </div>
        ${displayStrings
          .map(
            ({ stringNumber }, index) => `
              <div class="string-row ${index === 0 || index === displayStrings.length - 1 ? 'edge-string' : ''}">
                <div class="string-label">
                  <b>${stringNumber}</b>
                </div>
                ${fretNumbers
                  .map((fret) => {
                    const key = getPositionKey({ stringNumber, fret });
                    const active = state.mode === MODES.IDENTIFY && isActivePosition(state.question.position, stringNumber, fret);
                    const locateClass = getLocateCellClass(state, key);
                    const selectable = state.mode === MODES.LOCATE && state.phase === 'answering';
                    return `
                      <div
                        class="fret-cell ${active ? 'active-note' : ''} ${locateClass} ${selectable ? 'selectable' : ''}"
                        data-action="position"
                        data-position-key="${key}"
                        data-string="${stringNumber}"
                        data-fret="${fret}"
                        aria-label="${stringNumber}弦 ${fret}品${active ? '，当前题目' : ''}"
                      >
                        ${active ? '<span class="note-pulse"></span>' : ''}
                        ${state.mode === MODES.LOCATE && (state.selectedKeys.has(key) || locateClass) ? '<span class="position-dot"></span>' : ''}
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `,
          )
          .join('')}
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

function renderIdentifyFeedback(state) {
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

function renderLocateFeedback(state) {
  if (state.phase === 'review') {
    const feedbackClass = state.result.isCorrect ? 'success' : 'error';
    const feedbackText = state.result.isCorrect
      ? `全对！完成率 ${state.result.completionPercent}%`
      : `完成率 ${state.result.completionPercent}% · 错选 ${state.result.wrongCount} · 漏选 ${state.result.missedCount}`;
    return `
      <div class="feedback ${feedbackClass}" data-testid="feedback">${feedbackText}</div>
      <button class="next-button" data-action="next" data-testid="next-question" type="button">下一题</button>
    `;
  }

  return '<div class="feedback neutral" data-testid="feedback">点出所有目标音位置，再提交</div>';
}

function renderQuizPanel(state) {
  if (state.mode === MODES.LOCATE) {
    return `
      <section class="quiz-panel locate-panel">
        <div class="target-line">
          <span>目标音</span>
          <strong data-testid="target-note">${state.question.targetNote}</strong>
          <small>${difficultyLabels[state.difficulty]} · ${state.question.requiredPositions.length} 个位置</small>
        </div>
        <div class="locate-actions">
          <button class="clear-button" data-action="clear-locate" data-testid="clear-locate" type="button" ${state.phase === 'answering' ? '' : 'disabled'}>清空选择</button>
          <button class="submit-button" data-action="submit-locate" data-testid="submit-locate" type="button" ${state.phase === 'answering' ? '' : 'disabled'}>提交答案</button>
        </div>
        ${renderLocateFeedback(state)}
      </section>
    `;
  }

  return `
    <section class="quiz-panel">
      <div class="question-line">
        <span>第 ${state.question.position.stringNumber} 弦</span>
        <span>第 ${state.question.position.fret} 品</span>
      </div>
      <div class="choices">
        ${renderChoices(state)}
      </div>
      ${renderIdentifyFeedback(state)}
    </section>
  `;
}

function renderStats(stats, aggregateStats) {
  return `
    <section class="stats-grid" aria-label="练习统计">
      <div class="stat-card"><span>本轮题数</span><strong data-testid="session-attempts">${stats.attempts}</strong></div>
      <div class="stat-card"><span>全对率</span><strong data-testid="session-accuracy">${stats.accuracy}%</strong></div>
      <div class="stat-card"><span>平均反应</span><strong>${formatMs(stats.averageResponseMs)}</strong></div>
      <div class="stat-card"><span>连对</span><strong>${stats.streak}</strong></div>
      <div class="stat-card wide"><span>平均完成率</span><strong>${stats.averageCompletionPercent}%</strong></div>
      <div class="stat-card wide"><span>历史题数 / 全对率</span><strong>${aggregateStats.totalAttempts} · ${aggregateStats.accuracy}%</strong></div>
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
    mode: MODES.IDENTIFY,
    difficulty: DIFFICULTIES.SIMPLE,
    question: createQuestion({ difficulty: DIFFICULTIES.SIMPLE, rng, now }),
    phase: 'answering',
    result: null,
    selectedKeys: new Set(),
    sessionStats: createSessionStats(),
    aggregateStats: loadAggregateStats(storage),
  };

  function createQuestionForCurrentMode() {
    if (state.mode === MODES.LOCATE) {
      return createLocateQuestion({ difficulty: state.difficulty, rng, now });
    }
    return createQuestion({ difficulty: state.difficulty, rng, now });
  }

  function newQuestion() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    state.question = createQuestionForCurrentMode();
    state.phase = 'answering';
    state.result = null;
    state.selectedKeys = new Set();
    render();
  }

  function recordAnswer(note) {
    if (state.mode !== MODES.IDENTIFY || state.phase !== 'answering') return;

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

  function toggleLocatePosition(positionKey) {
    if (state.mode !== MODES.LOCATE || state.phase !== 'answering') return;

    if (state.selectedKeys.has(positionKey)) {
      state.selectedKeys.delete(positionKey);
    } else {
      state.selectedKeys.add(positionKey);
    }
    render();
  }

  function clearLocateSelection() {
    if (state.mode !== MODES.LOCATE || state.phase !== 'answering') return;
    state.selectedKeys = new Set();
    render();
  }

  function submitLocateAnswer() {
    if (state.mode !== MODES.LOCATE || state.phase !== 'answering') return;

    state.result = evaluateLocateAnswer(state.question, [...state.selectedKeys], now());
    state.phase = 'review';
    state.sessionStats = recordSessionAnswer(state.sessionStats, state.result);
    state.aggregateStats = recordAggregateAnswer(state.aggregateStats, state.result);
    saveAggregateStats(state.aggregateStats, storage);
    render();
  }

  function setDifficulty(difficulty) {
    state.difficulty = difficulty;
    newQuestion();
  }

  function setMode(mode) {
    state.mode = mode;
    newQuestion();
  }

  function render() {
    root.innerHTML = `
      <div class="app-shell">
        <header class="hero">
          <p class="eyebrow">FretNote / 12品固定音</p>
          <h1>指板音名训练</h1>
          <p class="hero-copy">看位置，选音名；或看音名，找遍指板。标准调弦 · 升号体系</p>
        </header>

        ${renderModeSwitch(state.mode)}

        <section class="difficulty-panel" aria-label="难度选择">
          ${renderDifficultyControls(state.difficulty)}
        </section>

        ${renderFretboard(state)}

        ${renderQuizPanel(state)}

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
    if (action === 'position') {
      toggleLocatePosition(actionTarget.dataset.positionKey);
    }
    if (action === 'clear-locate') {
      clearLocateSelection();
    }
    if (action === 'submit-locate') {
      submitLocateAnswer();
    }
    if (action === 'next') {
      newQuestion();
    }
    if (action === 'difficulty') {
      setDifficulty(actionTarget.dataset.difficulty);
    }
    if (action === 'mode') {
      setMode(actionTarget.dataset.mode);
    }
  });

  render();

  return {
    getState: () => ({
      ...structuredClone({ ...state, selectedKeys: [...state.selectedKeys] }),
      selectedKeys: new Set(state.selectedKeys),
    }),
    nextQuestion: newQuestion,
  };
}

function boot() {
  const root = document.querySelector('#app');
  if (root && !root.dataset.booted) {
    root.dataset.booted = 'true';
    renderApp(root);
    registerPwa({ enabled: import.meta.env.PROD });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
