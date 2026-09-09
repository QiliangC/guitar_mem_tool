import './styles.css';
import {
  CAGED_SHAPES,
  DIFFICULTIES,
  NOTES_SHARP,
  SCALE_LAYERS,
  STRINGS,
  getCagedShapePositions,
  getMajorScaleDegree,
  getMajorScaleNotes,
  getPositionKey,
} from './music.js';
import { registerPwa } from './pwa.js';
import {
  createDegreeLocateQuestion,
  createDegreeQuestion,
  createLocateQuestion,
  createMelodyQuestion,
  createQuestion,
  createShapeBuildQuestion,
  evaluateAnswer,
  evaluateDegreeAnswer,
  evaluateLocateAnswer,
  evaluateMelodyAnswer,
} from './quiz.js';
import {
  createSessionStats,
  loadAggregateStats,
  recordAggregateAnswer,
  recordSessionAnswer,
  saveAggregateStats,
} from './stats.js';

const CONTENTS = { FIXED: 'fixed', DEGREE: 'degree' };
const MODES = { BUILD: 'build', IDENTIFY: 'identify', LOCATE: 'locate', MELODY: 'melody' };

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

const layerLabels = {
  [SCALE_LAYERS.ROOT]: '根音',
  [SCALE_LAYERS.TRIAD]: '1·3·5',
  [SCALE_LAYERS.PENTATONIC]: '五声音阶',
  [SCALE_LAYERS.FULL]: '完整七声',
};

const layerDescriptions = {
  [SCALE_LAYERS.ROOT]: '建立 1 的锚点',
  [SCALE_LAYERS.TRIAD]: '大三和弦骨架',
  [SCALE_LAYERS.PENTATONIC]: '1·2·3·5·6',
  [SCALE_LAYERS.FULL]: '大调 1–7',
};

const FRET_MARKER_FRETS = [3, 5, 7, 9];

function formatMs(ms) {
  if (!ms) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

function isActivePosition(position, stringNumber, fret) {
  return position?.stringNumber === stringNumber && position?.fret === fret;
}

function renderContentSwitch(activeContent) {
  return `
    <section class="content-switch" aria-label="训练内容">
      <button class="content-tab ${activeContent === CONTENTS.FIXED ? 'active' : ''}" data-action="content" data-content="fixed" data-testid="content-fixed" type="button">固定音名</button>
      <button class="content-tab ${activeContent === CONTENTS.DEGREE ? 'active' : ''}" data-action="content" data-content="degree" data-testid="content-degree" type="button">首调音级</button>
    </section>
  `;
}

function renderModeSwitch(state) {
  const modes = state.content === CONTENTS.DEGREE
    ? [[MODES.BUILD, '建立指型'], [MODES.IDENTIFY, '位置选音级'], [MODES.LOCATE, '音级找位置'], [MODES.MELODY, '旋律路径']]
    : [[MODES.IDENTIFY, '看位置选音名'], [MODES.LOCATE, '看音名找位置']];

  return `
    <section class="mode-switch ${modes.length > 2 ? 'multi' : ''}" aria-label="练习方式">
      ${modes.map(([mode, label]) => `<button class="mode-tab ${state.mode === mode ? 'active' : ''}" data-action="mode" data-mode="${mode}" data-testid="mode-${mode}" type="button">${label}</button>`).join('')}
    </section>
  `;
}

function renderDifficultyControls(activeDifficulty) {
  return `
    <section class="difficulty-panel" aria-label="难度选择">
      ${Object.values(DIFFICULTIES).map((difficulty) => `
        <button class="difficulty ${difficulty === activeDifficulty ? 'active' : ''}" data-action="difficulty" data-difficulty="${difficulty}" data-testid="difficulty-${difficulty}" type="button">
          <strong>${difficultyLabels[difficulty]}</strong><span>${difficultyDescriptions[difficulty]}</span>
        </button>`).join('')}
    </section>
  `;
}

function renderDegreeControls(state) {
  const scaleNotes = getMajorScaleNotes(state.tonic);
  const manualDisabled = state.autoSetup ? 'disabled' : '';
  return `
    <section class="degree-settings" aria-label="首调设置">
      <div class="setup-picker">
        <button class="setup-button ${!state.autoSetup ? 'active' : ''}" data-action="setup-mode" data-auto="false" type="button">自主选择</button>
        <button class="setup-button ${state.autoSetup ? 'active' : ''}" data-action="setup-mode" data-auto="true" data-testid="auto-setup" type="button">系统出题</button>
      </div>
      <div class="key-row">
        <label>1 =
          <select data-action="tonic" data-testid="tonic-select" ${manualDisabled}>
            ${NOTES_SHARP.map((note) => `<option value="${note}" ${note === state.tonic ? 'selected' : ''}>${note}</option>`).join('')}
          </select>
        </label>
        <span>${scaleNotes.map((note, index) => `${index + 1}=${note}`).join(' · ')}</span>
      </div>
      <div class="shape-picker">
        ${Object.values(CAGED_SHAPES).map((shape) => `<button class="shape-button ${shape.id === state.shapeId ? 'active' : ''}" data-action="shape" data-shape="${shape.id}" data-testid="shape-${shape.id}" type="button" ${manualDisabled}><strong>${shape.label}</strong><span>${shape.anchorLabel}</span></button>`).join('')}
      </div>
      <div class="layer-picker">
        ${Object.values(SCALE_LAYERS).filter((layer) => state.mode !== MODES.MELODY || layer !== SCALE_LAYERS.ROOT).map((layer) => `<button class="layer-button ${layer === state.layer ? 'active' : ''}" data-action="layer" data-layer="${layer}" data-testid="layer-${layer}" type="button"><strong>${layerLabels[layer]}</strong><span>${layerDescriptions[layer]}</span></button>`).join('')}
      </div>
    </section>
  `;
}

function getCellStatusClass(state, positionKey) {
  const classes = [];
  const selecting = state.phase === 'answering' || state.phase === 'building';
  if (selecting && state.selectedKeys.has(positionKey)) classes.push('selected-position');
  if (state.anchorKey === positionKey) classes.push('anchor-position');
  if (state.anchorErrorKey === positionKey) classes.push('wrong-position');
  if (state.melodyWrongKey === positionKey) classes.push('wrong-position');
  if (state.phase === 'review' && state.result?.correctKeys.includes(positionKey)) classes.push('correct-position');
  if (state.phase === 'review' && state.result?.wrongKeys.includes(positionKey)) classes.push('wrong-position');
  if (state.phase === 'review' && state.result?.missedKeys.includes(positionKey)) classes.push('missed-position');
  return classes.join(' ');
}

function getFretNumbers(state) {
  if (state.content === CONTENTS.FIXED) return Array.from({ length: 13 }, (_, fret) => fret);
  const { startFret, endFret } = state.question.fretRange;
  return Array.from({ length: endFret - startFret + 1 }, (_, index) => startFret + index);
}

function renderFretboard(state) {
  const fretNumbers = getFretNumbers(state);
  const displayStrings = [...STRINGS].reverse();
  const shapePositions = state.content === CONTENTS.DEGREE
    ? getCagedShapePositions({ tonic: state.tonic, shapeId: state.shapeId })
    : [];
  const shapePositionMap = new Map(shapePositions.map((position) => [getPositionKey(position), position]));
  const isSelectionMode = [MODES.LOCATE, MODES.BUILD, MODES.MELODY].includes(state.mode);
  const canSelect = isSelectionMode && ['answering', 'anchor', 'building'].includes(state.phase);
  const gridStyle = `--fret-count:${fretNumbers.length}`;

  return `
    <section class="fretboard-card ${state.content === CONTENTS.DEGREE ? 'shape-view' : ''}" aria-label="吉他指板" style="${gridStyle}">
      <div class="fret-numbers" aria-hidden="true">
        <span class="string-label-spacer"></span>
        ${fretNumbers.map((fret) => `<span>${fret}</span>`).join('')}
      </div>
      <div class="fretboard">
        <div class="fret-markers" aria-hidden="true">
          <span class="string-label-spacer"></span>
          ${fretNumbers.map((fret) => FRET_MARKER_FRETS.includes(fret) ? `<span class="fret-marker-cell"><span class="fret-marker" data-testid="fret-marker" data-fret-marker="${fret}"></span></span>` : '<span></span>').join('')}
        </div>
        ${displayStrings.map(({ stringNumber }, index) => `
          <div class="string-row ${index === 0 || index === displayStrings.length - 1 ? 'edge-string' : ''}">
            <div class="string-label"><b>${stringNumber}</b></div>
            ${fretNumbers.map((fret) => {
              const key = getPositionKey({ stringNumber, fret });
              const shapePosition = shapePositionMap.get(key);
              const active = state.mode === MODES.IDENTIFY && isActivePosition(state.question.position, stringNumber, fret);
              const statusClass = getCellStatusClass(state, key);
              const hasDot = active || (isSelectionMode && (state.selectedKeys.has(key) || statusClass));
              const showDegree = state.content === CONTENTS.DEGREE && state.phase === 'review' && shapePosition && statusClass;
              return `
                <div class="fret-cell ${active ? 'active-note' : ''} ${statusClass} ${canSelect ? 'selectable' : ''}" data-action="position" data-position-key="${key}" data-string="${stringNumber}" data-fret="${fret}" aria-label="${stringNumber}弦 ${fret}品${active ? '，当前题目' : ''}">
                  ${active ? '<span class="note-pulse"></span>' : ''}
                  ${!active && hasDot ? `<span class="position-dot">${showDegree ? shapePosition.degree : ''}</span>` : ''}
                </div>`;
            }).join('')}
          </div>`).join('')}
      </div>
    </section>
  `;
}

function renderChoices(state) {
  const isDegree = state.content === CONTENTS.DEGREE;
  return state.question.choices.map((choice) => {
    const selectedValue = isDegree ? state.result?.selectedDegree : state.result?.selectedNote;
    const correctValue = isDegree ? state.result?.correctDegree : state.result?.correctNote;
    const selected = String(selectedValue) === String(choice);
    const correct = String(correctValue) === String(choice);
    const reveal = state.phase !== 'answering';
    const statusClass = reveal && correct ? 'correct' : selected && !correct ? 'wrong' : '';
    return `<button class="choice ${statusClass}" data-action="answer" data-answer="${choice}" data-testid="answer-choice" ${state.phase === 'answering' ? '' : 'disabled'} type="button">${choice}</button>`;
  }).join('');
}

function renderReviewFeedback(state) {
  if (state.phase !== 'review') return '<div class="feedback neutral" data-testid="feedback">点选后提交答案</div>';
  const className = state.result.isCorrect ? 'success' : 'error';
  const text = state.result.isCorrect
    ? `全对！完成率 ${state.result.completionPercent}%`
    : `完成率 ${state.result.completionPercent}% · 错选 ${state.result.wrongCount} · 漏选 ${state.result.missedCount}`;
  return `<div class="feedback ${className}" data-testid="feedback">${text}</div><button class="next-button" data-action="next" data-testid="next-question" type="button">下一题</button>`;
}

function renderIdentifyPanel(state) {
  const isDegree = state.content === CONTENTS.DEGREE;
  let feedback = isDegree ? '看到亮点，反应它在当前调里的音级' : '看到亮点，尽快反应音名';
  if (state.phase === 'correct') {
    feedback = isDegree
      ? `对了：${state.result.correctDegree} = ${state.result.correctNote}，下一题…`
      : '对了，下一题…';
  }
  if (state.phase === 'wrong') {
    feedback = isDegree
      ? `正确答案：${state.result.correctDegree} = ${state.result.correctNote}`
      : `答错了，正确答案是 ${state.result.correctNote}`;
  }
  return `
    <section class="quiz-panel">
      <div class="question-line"><span>第 ${state.question.position.stringNumber} 弦</span><span>第 ${state.question.position.fret} 品</span></div>
      <div class="choices">${renderChoices(state)}</div>
      <div class="feedback ${state.phase === 'correct' ? 'success' : state.phase === 'wrong' ? 'error' : 'neutral'}" data-testid="feedback">${feedback}</div>
      ${state.phase === 'wrong' ? '<button class="next-button" data-action="next" data-testid="next-question" type="button">下一题</button>' : ''}
    </section>`;
}

function renderLocatePanel(state) {
  const isDegree = state.content === CONTENTS.DEGREE;
  const target = isDegree ? state.question.targetDegree : state.question.targetNote;
  const targetNote = isDegree ? getMajorScaleNotes(state.tonic)[state.question.targetDegree - 1] : '';
  return `
    <section class="quiz-panel locate-panel">
      <div class="target-line">
        <span>${isDegree ? '目标音级' : '目标音'}</span>
        <strong data-testid="target-note">${target}</strong>
        <small>${isDegree ? `${targetNote} · ${CAGED_SHAPES[state.shapeId].label}` : difficultyLabels[state.difficulty]} · ${state.question.requiredPositions.length} 个位置</small>
      </div>
      <div class="locate-actions">
        <button class="clear-button" data-action="clear-selection" data-testid="clear-locate" type="button" ${state.phase === 'answering' ? '' : 'disabled'}>清空选择</button>
        <button class="submit-button" data-action="submit-selection" data-testid="submit-locate" type="button" ${state.phase === 'answering' ? '' : 'disabled'}>提交答案</button>
      </div>
      ${state.phase === 'review' ? renderReviewFeedback(state) : `<div class="feedback neutral" data-testid="feedback">找出当前范围内所有的 ${target}</div>`}
    </section>`;
}

function renderBuildPanel(state) {
  if (state.phase === 'anchor') {
    return `
      <section class="quiz-panel build-panel">
        <div class="build-heading"><span>第一步 · 定位根音</span><strong>找到一个 1</strong><small>1 = ${state.tonic} · ${CAGED_SHAPES[state.shapeId].anchorLabel}</small></div>
        <div class="feedback ${state.anchorErrorKey ? 'error' : 'neutral'}" data-testid="feedback">${state.anchorErrorKey ? '这个位置不是 1，再找一次' : '先用根音建立当前指型的坐标'}</div>
      </section>`;
  }

  if (state.phase === 'building') {
    return `
      <section class="quiz-panel build-panel">
        <div class="build-heading"><span>第二步 · 补全指型</span><strong>${layerLabels[state.layer]}</strong><small>已选 ${state.selectedKeys.size} · 共 ${state.question.requiredPositions.length} 个位置</small></div>
        <div class="locate-actions">
          <button class="clear-button" data-action="clear-selection" data-testid="clear-build" type="button">保留根音并清空</button>
          <button class="submit-button" data-action="submit-selection" data-testid="submit-build" type="button">提交指型</button>
        </div>
        <div class="feedback neutral" data-testid="feedback">从这个 1 展开 ${layerDescriptions[state.layer]}</div>
      </section>`;
  }

  return `
    <section class="quiz-panel build-panel">
      <div class="build-heading"><span>指型结果</span><strong>${layerLabels[state.layer]}</strong><small>${CAGED_SHAPES[state.shapeId].label}</small></div>
      ${renderReviewFeedback(state)}
    </section>`;
}

function renderDegreeToken(note, index, progress) {
  const octaveClass = note.octaveOffset > 0 ? 'high' : note.octaveOffset < 0 ? 'low' : '';
  const progressClass = index < progress ? 'done' : index === progress ? 'current' : '';
  return `<span class="degree-token ${octaveClass} ${progressClass}"><b>${note.degree}</b></span>`;
}

function renderMelodyPanel(state) {
  const progress = state.melodySelections.length;
  if (state.phase === 'anchor') {
    return `
      <section class="quiz-panel melody-panel">
        <div class="build-heading"><span>第一步 · 选择旋律起点</span><strong>先找到一个 1</strong><small>1 = ${state.tonic} · ${CAGED_SHAPES[state.shapeId].label}</small></div>
        <div class="feedback ${state.anchorErrorKey ? 'error' : 'neutral'}" data-testid="feedback">${state.anchorErrorKey ? '这个位置不是 1，再找一次' : '选中的根音将作为中音 1'}</div>
      </section>`;
  }

  if (state.phase === 'review') {
    const summary = state.result.isCorrect
      ? '一次完成，路径正确'
      : `路径完成 · 中途错点 ${state.result.wrongCount} 次`;
    return `
      <section class="quiz-panel melody-panel">
        <div class="melody-meta"><strong>旋律 ${state.question.melodyIndex + 1}</strong><span>${summary}</span></div>
        <div class="melody-line">${state.question.notation.map((note, index) => renderDegreeToken(note, index, progress)).join('<i>→</i>')}</div>
        ${renderReviewFeedback(state)}
      </section>`;
  }

  return `
    <section class="quiz-panel melody-panel">
      <div class="melody-meta">
        <strong>旋律 ${state.question.melodyIndex + 1}</strong>
        <span>从 ${state.question.startPosition.stringNumber}弦${state.question.startPosition.fret}品的 1 开始</span>
      </div>
      <div class="melody-line" data-testid="melody-line">${state.question.notation.map((note, index) => renderDegreeToken(note, index, progress)).join('<i>→</i>')}</div>
      <div class="melody-progress">第 ${Math.min(progress + 1, state.question.pathPositions.length)} / ${state.question.pathPositions.length} 个音 · 错点 ${state.melodyMistakes} 次</div>
      <button class="clear-button" data-action="reset-melody" data-testid="reset-melody" type="button">重新选择根音</button>
      <div class="feedback ${state.melodyWrongKey ? 'error' : 'neutral'}" data-testid="feedback">${state.melodyWrongKey ? '位置不对，按当前音符再试一次' : '按照数字谱顺序点击指板'}</div>
    </section>`;
}

function renderQuizPanel(state) {
  if (state.mode === MODES.BUILD) return renderBuildPanel(state);
  if (state.mode === MODES.MELODY) return renderMelodyPanel(state);
  if (state.mode === MODES.LOCATE) return renderLocatePanel(state);
  return renderIdentifyPanel(state);
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
    </section>`;
}

export function renderApp(root, options = {}) {
  const rng = options.rng ?? Math.random;
  const now = options.now ?? Date.now;
  const storage = options.storage ?? globalThis.localStorage;
  const autoAdvanceMs = options.autoAdvanceMs ?? 550;
  let autoAdvanceTimer = null;

  const state = {
    content: CONTENTS.FIXED,
    mode: MODES.IDENTIFY,
    difficulty: DIFFICULTIES.SIMPLE,
    tonic: 'E',
    shapeId: 'C',
    layer: SCALE_LAYERS.TRIAD,
    autoSetup: false,
    question: null,
    phase: 'answering',
    result: null,
    selectedKeys: new Set(),
    anchorKey: null,
    anchorErrorKey: null,
    melodySelections: [],
    melodyMistakes: 0,
    melodyWrongKey: null,
    sessionStats: createSessionStats(),
    aggregateStats: loadAggregateStats(storage),
  };

  function createQuestionForState() {
    if (state.content === CONTENTS.FIXED) {
      return state.mode === MODES.LOCATE
        ? createLocateQuestion({ difficulty: state.difficulty, rng, now })
        : createQuestion({ difficulty: state.difficulty, rng, now });
    }

    const settings = { tonic: state.tonic, shapeId: state.shapeId, layer: state.layer, rng, now };
    if (state.mode === MODES.BUILD) return createShapeBuildQuestion(settings);
    if (state.mode === MODES.LOCATE) return createDegreeLocateQuestion(settings);
    if (state.mode === MODES.MELODY) return createMelodyQuestion(settings);
    return createDegreeQuestion(settings);
  }

  function newQuestion() {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
    if (state.content === CONTENTS.DEGREE && state.autoSetup) {
      state.tonic = NOTES_SHARP[Math.floor(rng() * NOTES_SHARP.length)];
      const shapeIds = Object.keys(CAGED_SHAPES);
      state.shapeId = shapeIds[Math.floor(rng() * shapeIds.length)];
    }
    state.question = createQuestionForState();
    state.phase = [MODES.BUILD, MODES.MELODY].includes(state.mode) ? 'anchor' : 'answering';
    state.result = null;
    state.selectedKeys = new Set();
    state.anchorKey = null;
    state.anchorErrorKey = null;
    state.melodySelections = [];
    state.melodyMistakes = 0;
    state.melodyWrongKey = null;
    render();
  }

  function recordResult(result) {
    state.sessionStats = recordSessionAnswer(state.sessionStats, result);
    state.aggregateStats = recordAggregateAnswer(state.aggregateStats, result);
    saveAggregateStats(state.aggregateStats, storage);
  }

  function recordAnswer(answer) {
    if (state.mode !== MODES.IDENTIFY || state.phase !== 'answering') return;
    state.result = state.content === CONTENTS.DEGREE
      ? evaluateDegreeAnswer(state.question, answer, now())
      : evaluateAnswer(state.question, answer, now());
    state.phase = state.result.isCorrect ? 'correct' : 'wrong';
    recordResult(state.result);
    render();
    if (state.result.isCorrect) autoAdvanceTimer = setTimeout(newQuestion, autoAdvanceMs);
  }

  function handleAnchor(positionKey) {
    const position = getCagedShapePositions({ tonic: state.tonic, shapeId: state.shapeId })
      .find((candidate) => getPositionKey(candidate) === positionKey);
    if (position?.degree !== 1) {
      state.anchorErrorKey = positionKey;
      render();
      return;
    }

    state.anchorKey = positionKey;
    state.anchorErrorKey = null;
    state.selectedKeys = new Set([positionKey]);
    state.phase = 'building';
    render();
  }

  function handleMelodyStep(positionKey) {
    if (state.mode !== MODES.MELODY || state.phase !== 'answering') return;
    const expectedPosition = state.question.pathPositions[state.melodySelections.length];
    const expectedKey = getPositionKey(expectedPosition);
    if (positionKey !== expectedKey) {
      state.melodyMistakes += 1;
      state.melodyWrongKey = positionKey;
      render();
      return;
    }

    state.melodyWrongKey = null;
    state.melodySelections.push(positionKey);
    state.selectedKeys.add(positionKey);
    if (state.melodySelections.length === state.question.pathPositions.length) {
      state.result = evaluateMelodyAnswer(
        state.question,
        state.melodySelections,
        state.melodyMistakes,
        now(),
      );
      state.phase = 'review';
      recordResult(state.result);
    }
    render();
  }

  function handleMelodyAnchor(positionKey) {
    const position = getCagedShapePositions({ tonic: state.tonic, shapeId: state.shapeId })
      .find((candidate) => getPositionKey(candidate) === positionKey);
    if (position?.degree !== 1) {
      state.anchorErrorKey = positionKey;
      render();
      return;
    }

    const startedAt = state.question.startedAt;
    state.question = createMelodyQuestion({
      tonic: state.tonic,
      shapeId: state.shapeId,
      layer: state.layer,
      startPosition: position,
      rng,
      now,
    });
    state.question.startedAt = startedAt;
    state.anchorKey = positionKey;
    state.anchorErrorKey = null;
    state.melodySelections = [positionKey];
    state.selectedKeys = new Set([positionKey]);
    state.phase = 'answering';
    render();
  }

  function resetMelody() {
    if (state.mode !== MODES.MELODY || state.phase !== 'answering') return;
    state.question.startedAt = now();
    state.melodySelections = [];
    state.melodyMistakes = 0;
    state.melodyWrongKey = null;
    state.anchorKey = null;
    state.anchorErrorKey = null;
    state.selectedKeys = new Set();
    state.phase = 'anchor';
    render();
  }

  function togglePosition(positionKey) {
    if (state.mode === MODES.MELODY) {
      if (state.phase === 'anchor') handleMelodyAnchor(positionKey);
      else handleMelodyStep(positionKey);
      return;
    }
    const selecting = state.mode === MODES.LOCATE && state.phase === 'answering';
    const building = state.mode === MODES.BUILD && state.phase === 'building';
    if (state.mode === MODES.BUILD && state.phase === 'anchor') {
      handleAnchor(positionKey);
      return;
    }
    if (!selecting && !building) return;
    if (building && positionKey === state.anchorKey) return;
    if (state.selectedKeys.has(positionKey)) state.selectedKeys.delete(positionKey);
    else state.selectedKeys.add(positionKey);
    render();
  }

  function clearSelection() {
    if (state.phase === 'building' && state.anchorKey) state.selectedKeys = new Set([state.anchorKey]);
    else if (state.phase === 'answering') state.selectedKeys = new Set();
    else return;
    render();
  }

  function submitSelection() {
    const canSubmit = (state.mode === MODES.LOCATE && state.phase === 'answering')
      || (state.mode === MODES.BUILD && state.phase === 'building');
    if (!canSubmit) return;
    state.result = evaluateLocateAnswer(state.question, [...state.selectedKeys], now());
    state.phase = 'review';
    recordResult(state.result);
    render();
  }

  function changeSetting(key, value) {
    state[key] = value;
    newQuestion();
  }

  function render() {
    root.innerHTML = `
      <div class="app-shell">
        <header class="hero">
          <p class="eyebrow">FretNote / 指板坐标训练</p>
          <h1>指板音名训练</h1>
          <p class="hero-copy">固定音名打底；找到根音，再用 C/G 指型反应首调音级。</p>
        </header>
        ${renderContentSwitch(state.content)}
        ${renderModeSwitch(state)}
        ${state.content === CONTENTS.FIXED ? renderDifficultyControls(state.difficulty) : renderDegreeControls(state)}
        ${renderFretboard(state)}
        ${renderQuizPanel(state)}
        ${renderStats(state.sessionStats, state.aggregateStats)}
      </div>`;
  }

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'content') {
      state.content = target.dataset.content;
      state.mode = state.content === CONTENTS.DEGREE ? MODES.BUILD : MODES.IDENTIFY;
      newQuestion();
    }
    if (action === 'mode') {
      state.mode = target.dataset.mode;
      if (state.mode === MODES.MELODY) state.layer = SCALE_LAYERS.FULL;
      newQuestion();
    }
    if (action === 'setup-mode') {
      state.autoSetup = target.dataset.auto === 'true';
      newQuestion();
    }
    if (action === 'difficulty') changeSetting('difficulty', target.dataset.difficulty);
    if (action === 'shape') changeSetting('shapeId', target.dataset.shape);
    if (action === 'layer') changeSetting('layer', target.dataset.layer);
    if (action === 'answer') recordAnswer(target.dataset.answer);
    if (action === 'position') togglePosition(target.dataset.positionKey);
    if (action === 'clear-selection') clearSelection();
    if (action === 'submit-selection') submitSelection();
    if (action === 'reset-melody') resetMelody();
    if (action === 'next') newQuestion();
  });

  root.addEventListener('change', (event) => {
    const target = event.target.closest('[data-action="tonic"]');
    if (target) changeSetting('tonic', target.value);
  });

  state.question = createQuestionForState();
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
