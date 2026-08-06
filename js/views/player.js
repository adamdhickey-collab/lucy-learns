// The guided activity player. One instruction per screen, big targets, and a
// session log that should take under fifteen seconds with a leash in one hand.

import {
  activityBySlug,
  IMAGES,
  stepsForLevel,
  levelOf,
  AROUSAL,
  BEHAVIORS,
  ASSISTANCE,
  RECOVERY_BANDS,
} from '../content.js';
import {
  addSession,
  isStorageOk,
  resolveCue,
  setLevel,
  updateSession,
} from '../store.js';
import { currentLevel, recommendation } from '../metrics.js';
import { html, join, icon, toast, pct, focusOnNavigate, trapModal } from '../ui.js';

let session = null;
let wakeLock = null;

function begin(activity, level) {
  session = {
    slug: activity.slug,
    levelNumber: level.number,
    phase: 'ready',
    stepIndex: 0,
    ready: new Set(),
    startedAt: Date.now(),
    reps: level.reps,
    successes: level.reps,
    arousal: null,
    behaviors: new Set(),
    assistance: new Set(),
    recoveryBand: null,
    note: '',
    saved: null,
    advice: null,
    detailAdded: false,
    sheetOpen: false,
    releaseTrap: null,
    timer: null,
    timerLeft: null,
  };
}

async function keepAwake() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch {
    /* not supported, or the tab lost focus. Practice still works. */
  }
}

function releaseAwake() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

function stopTimer() {
  if (session && session.timer) {
    clearInterval(session.timer);
    session.timer = null;
  }
}

function closeSheet() {
  if (!session) return;
  session.sheetOpen = false;
  refresh();
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

function topBar(label, value, max) {
  return html`
    <div class="player-top">
      <button class="icon-btn" type="button" data-exit aria-label="Leave practice">
        ${icon('close')}
      </button>
      <div
        class="progress-track"
        role="progressbar"
        aria-valuenow="${value}"
        aria-valuemin="0"
        aria-valuemax="${max}"
        aria-label="${label}"
      >
        <span style="transform: scaleX(${max ? (value / max).toFixed(3) : 0})"></span>
      </div>
      <span class="badge">${label}</span>
    </div>
  `;
}

function readyScreen(activity, level) {
  const cover = IMAGES[activity.coverImage];
  const cues = [...new Set(stepsForLevel(activity, level).map((s) => s.cue).filter(Boolean))];

  return html`
    ${topBar('Get ready', 0, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <figure class="step-figure">
          <img src="${cover.src}" alt="${cover.alt}" />
        </figure>
        <p class="step-count">Level ${level.number} · ${level.title}</p>
        <h1 class="step-instruction">${level.setup}</h1>

        <div class="result-group">
          <h2>Before you start</h2>
          <div class="chips">
            ${join(
              activity.equipment.map(
                (item, i) => html`<button
                  type="button"
                  class="chip"
                  data-ready="${i}"
                  aria-pressed="${String(session.ready.has(String(i)))}"
                >
                  ${item}
                </button>`
              )
            )}
          </div>
        </div>

        ${cues.length
          ? html`<div class="say" style="margin-top: var(--s-5)">
              <span class="label">Say</span>
              <span class="cue">${cues.map((c) => `“${resolveCue(c)}”`).join('  ')}</span>
            </div>`
          : ''}

        <p class="section-note" style="margin-top: var(--s-4)">
          About ${activity.estimatedMinutes} minutes. ${level.reps} repetitions. Stop early if
          she is still doing well.
        </p>
      </div>
    </div>
    <div class="player-foot">
      <button class="btn btn--lg btn--block" type="button" data-start>Start practice</button>
    </div>
  `;
}

function stepScreen(activity, level) {
  const steps = stepsForLevel(activity, level);
  const step = steps[session.stepIndex];
  const img = step.image ? IMAGES[step.image] : null;
  const isLast = session.stepIndex === steps.length - 1;

  return html`
    ${topBar(`Step ${session.stepIndex + 1} of ${steps.length}`, session.stepIndex + 1, steps.length)}
    <div class="player-scroll">
      <div class="player-inner">
        ${img
          ? html`<figure class="step-figure">
              <img src="${img.src}" alt="${img.alt}" />
            </figure>`
          : ''}

        <p class="step-count">Step ${session.stepIndex + 1} of ${steps.length}</p>
        <h1 class="step-instruction">${step.instruction}</h1>

        ${step.cue
          ? html`<div class="say">
              <span class="label">Say</span>
              <span class="cue">“${resolveCue(step.cue)}”</span>
            </div>`
          : ''}

        ${step.timerSeconds
          ? html`<div class="timer">
              <output aria-live="off" data-timer-out>${session.timerLeft ?? step.timerSeconds}s</output>
              <div class="meter"><span data-timer-bar style="width: 100%"></span></div>
              <button class="btn btn--quiet" type="button" data-timer-toggle>
                ${session.timer ? 'Stop' : 'Start'}
              </button>
            </div>`
          : ''}

        ${isLast
          ? html`<div class="rep-counter">
              <span class="label">
                Repetitions done
                <small>Target ${level.reps}</small>
              </span>
              <div class="stepper">
                <button type="button" data-reps="-1" aria-label="One fewer repetition">−</button>
                <output data-reps-out aria-live="polite">${session.reps}</output>
                <button type="button" data-reps="1" aria-label="One more repetition">+</button>
              </div>
            </div>`
          : ''}

        ${step.helper
          ? html`<details class="disclosure" style="margin-top: var(--s-5)">
              <summary>Why this matters</summary>
              <div class="disclosure-body">${step.helper}</div>
            </details>`
          : ''}

        <div class="panic-slot">
          <button class="btn btn--caution panic" type="button" data-panic>
            Lucy is too excited
          </button>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <div class="btn-row">
        <button
          class="btn btn--quiet"
          type="button"
          data-prev
          ${session.stepIndex === 0 ? 'disabled' : ''}
        >
          Back
        </button>
        <button class="btn" type="button" data-next>
          ${isLast ? 'Log session' : 'Next'}
        </button>
      </div>
    </div>
  `;
}

function fallbackSheet(activity) {
  const img = IMAGES[activity.fallbackImage];
  return html`
    <div class="sheet-backdrop" data-sheet-backdrop>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <h2 id="sheet-title">Take the pressure off</h2>
        <p>None of this is a failure. Make it easier and finish on a win.</p>
        <img src="${img.src}" alt="${img.alt}" />
        <ul class="notes-list notes-list--calm">
          ${join(activity.fallbackSteps.map((s) => html`<li>${s}</li>`))}
        </ul>
        <div class="btn-row" style="margin-top: var(--s-5)">
          <button class="btn btn--quiet" type="button" data-sheet-close>Keep going</button>
          <button class="btn" type="button" data-sheet-end>End and log</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * One question, four big targets, done. Anything else is optional and lives
 * on the detail screen, because this is the moment the handler still has a
 * leash in one hand and a wound-up dog on the other end of it.
 */
function resultScreen(activity, level) {
  return html`
    ${topBar('How did it go', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <p class="step-count">${activity.title} · Level ${level.number}</p>
        <h1 class="step-instruction">How did Lucy do?</h1>
        <p class="section-note" style="margin-top: var(--s-3)">
          One tap saves it. You can add detail after.
        </p>

        <div class="result-group">
          <div class="options options--tall" role="group" aria-label="Overall arousal">
            ${join(
              AROUSAL.map(
                (a) => html`<button
                  type="button"
                  class="option"
                  data-arousal-save="${a.value}"
                >
                  <span>
                    <strong>${a.label}</strong>
                    <small>${a.hint}</small>
                  </span>
                </button>`
              )
            )}
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Everything optional, reached deliberately from the recommendation screen. */
function detailScreen(activity, level) {
  const needsRecovery =
    session.arousal >= 3 ||
    ['barked', 'jumped', 'nipped', 'pulled'].some((b) => session.behaviors.has(b));

  return html`
    ${topBar('Add detail', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <p class="step-count">${activity.title} · Level ${level.number}</p>
        <h1 class="step-instruction">Anything to add?</h1>
        <p class="section-note" style="margin-top: var(--s-3)">
          Already saved. Everything here is optional.
        </p>

        <div class="result-group">
          <h2>What happened?</h2>
          <div class="chips">
            ${join(
              BEHAVIORS.map(
                (b) => html`<button
                  type="button"
                  class="chip ${b.tone === 'watch' ? 'chip--watch' : ''}"
                  data-behavior="${b.id}"
                  aria-pressed="${String(session.behaviors.has(b.id))}"
                >
                  ${b.label}
                </button>`
              )
            )}
          </div>
        </div>

        <div class="result-group">
          <h2>Repetitions</h2>
          <div class="rep-counter">
            <span class="label">Total <small>How many you ran</small></span>
            <div class="stepper">
              <button type="button" data-reps="-1" aria-label="One fewer repetition">−</button>
              <output data-reps-out aria-live="polite">${session.reps}</output>
              <button type="button" data-reps="1" aria-label="One more repetition">+</button>
            </div>
          </div>
          <div class="rep-counter" style="margin-top: var(--s-2)">
            <span class="label">Went well <small>Out of ${session.reps}</small></span>
            <div class="stepper">
              <button type="button" data-ok="-1" aria-label="One fewer successful repetition">−</button>
              <output data-ok-out aria-live="polite">${session.successes}</output>
              <button type="button" data-ok="1" aria-label="One more successful repetition">+</button>
            </div>
          </div>
        </div>

        <div class="result-group">
          <h2>Help you gave</h2>
          <div class="chips">
            ${join(
              ASSISTANCE.map(
                (a) => html`<button
                  type="button"
                  class="chip"
                  data-assist="${a.id}"
                  aria-pressed="${String(session.assistance.has(a.id))}"
                >
                  ${a.label}
                </button>`
              )
            )}
          </div>
        </div>

        ${needsRecovery
          ? html`<div class="result-group">
              <h2>How long to settle?</h2>
              <div class="options" role="group" aria-label="Recovery time">
                ${join(
                  RECOVERY_BANDS.map(
                    (r) => html`<button
                      type="button"
                      class="option"
                      data-recovery="${r.id}"
                      aria-pressed="${String(session.recoveryBand === r.id)}"
                    >
                      <span><strong>${r.label}</strong></span>
                    </button>`
                  )
                )}
              </div>
            </div>`
          : ''}

        <div class="result-group field">
          <label for="session-note">A note for the trainer</label>
          <textarea id="session-note" rows="3" data-note>${session.note}</textarea>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <button class="btn btn--lg btn--block" type="button" data-save-detail>Done</button>
    </div>
  `;
}

function doneScreen(activity, level) {
  const advice = session.advice;
  const saved = session.saved;
  const rate = saved.repetitions ? saved.successfulRepetitions / saved.repetitions : 0;
  const caution = advice.suggest === 'down';

  return html`
    ${topBar('Done', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <div class="recommend">
          <div class="mark ${caution ? 'mark--caution' : ''}">
            ${caution ? icon('shield') : icon('check')}
          </div>
          <h1>${advice.title}</h1>
          <p>${advice.body}</p>
        </div>

        <div class="stat-row">
          <div class="stat">
            <b>${saved.successfulRepetitions}/${saved.repetitions}</b>
            <span>Went well</span>
          </div>
          <div class="stat">
            <b>${pct(rate)}</b>
            <span>Success</span>
          </div>
          <div class="stat">
            <b>${AROUSAL.find((a) => a.value === saved.arousalLevel).label.split(' ')[0]}</b>
            <span>Arousal</span>
          </div>
        </div>

        <button class="btn btn--quiet btn--block" type="button" data-detail
          style="margin-top: var(--s-4)">
          ${session.detailAdded ? 'Edit detail' : 'Add detail'}
        </button>
        ${session.detailAdded
          ? ''
          : html`<p class="section-note" style="margin-top: var(--s-2); text-align: center">
              Assumed ${saved.repetitions} repetitions, ${saved.successfulRepetitions} went well.
            </p>`}

        ${advice.nextLevel
          ? html`<button class="btn btn--block btn--lg" type="button" data-advance="${advice.nextLevel}"
                style="margin-top: var(--s-5)">
              Move to level ${advice.nextLevel}
            </button>
            <button class="btn btn--ghost btn--block" type="button" data-stay style="margin-top: var(--s-2)">
              Stay at level ${level.number}
            </button>`
          : ''}
      </div>
    </div>
    <div class="player-foot">
      <div class="btn-row">
        <button class="btn btn--quiet" type="button" data-again>Practice again</button>
        <button class="btn" type="button" data-finish>Finish</button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Render + behaviour
// ---------------------------------------------------------------------------

function render({ slug }) {
  const activity = activityBySlug(slug);
  if (!activity) return html`<div class="screen"><p>Activity not found.</p></div>`;

  if (!session || session.slug !== slug) {
    begin(activity, currentLevel(activity));
  }
  const level = levelOf(activity, session.levelNumber);

  let body;
  if (session.phase === 'ready') body = readyScreen(activity, level);
  else if (session.phase === 'step') body = stepScreen(activity, level);
  else if (session.phase === 'result') body = resultScreen(activity, level);
  else if (session.phase === 'detail') body = detailScreen(activity, level);
  else body = doneScreen(activity, level);

  return html`<div class="player">${body}</div>
    ${session.sheetOpen ? fallbackSheet(activity) : ''}`;
}

/** Re-render the player in place without touching the router. */
function refresh() {
  const root = document.getElementById('app');
  root.innerHTML = String(render({ slug: session.slug }));
  wire(root);
}

function wire(root) {
  const activity = activityBySlug(session.slug);
  const level = levelOf(activity, session.levelNumber);
  const steps = stepsForLevel(activity, level);

  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  const toggleSet = (set, value) => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  };

  on('[data-exit]', 'click', () => {
    if (session.phase === 'step' || session.phase === 'result') {
      if (!confirm('Leave this session? Nothing will be saved.')) return;
    }
    stopTimer();
    releaseAwake();
    const slug = session.slug;
    session = null;
    location.hash = `#/activity/${slug}`;
  });

  on('[data-ready]', 'click', (e) => {
    toggleSet(session.ready, e.currentTarget.dataset.ready);
    e.currentTarget.setAttribute(
      'aria-pressed',
      String(session.ready.has(e.currentTarget.dataset.ready))
    );
  });

  on('[data-start]', 'click', () => {
    session.phase = 'step';
    session.stepIndex = 0;
    session.startedAt = Date.now();
    keepAwake();
    refresh();
  });

  on('[data-next]', 'click', () => {
    stopTimer();
    if (session.stepIndex < steps.length - 1) {
      session.stepIndex += 1;
      session.timerLeft = null;
    } else {
      session.successes = Math.min(session.successes, session.reps);
      session.phase = 'result';
    }
    refresh();
  });

  on('[data-prev]', 'click', () => {
    stopTimer();
    if (session.stepIndex > 0) {
      session.stepIndex -= 1;
      session.timerLeft = null;
      refresh();
    }
  });

  on('[data-panic]', 'click', () => {
    session.sheetOpen = true;
    refresh();
  });

  on('[data-sheet-close]', 'click', closeSheet);

  on('[data-sheet-backdrop]', 'click', (e) => {
    if (e.target === e.currentTarget) closeSheet();
  });

  on('[data-sheet-end]', 'click', () => {
    session.sheetOpen = false;
    session.phase = 'result';
    session.arousal = 4;
    session.assistance.add('session_ended');
    refresh();
  });

  // Timer -------------------------------------------------------------------
  const step = steps[session.stepIndex];
  on('[data-timer-toggle]', 'click', (e) => {
    const total = step.timerSeconds;
    if (session.timer) {
      stopTimer();
      e.currentTarget.textContent = 'Start';
      return;
    }
    session.timerLeft = session.timerLeft ?? total;
    e.currentTarget.textContent = 'Stop';
    const out = root.querySelector('[data-timer-out]');
    const bar = root.querySelector('[data-timer-bar]');
    session.timer = setInterval(() => {
      session.timerLeft -= 1;
      if (out) out.textContent = `${Math.max(session.timerLeft, 0)}s`;
      if (bar) bar.style.width = `${Math.max((session.timerLeft / total) * 100, 0)}%`;
      if (session.timerLeft <= 0) {
        stopTimer();
        session.timerLeft = null;
        if (out) {
          out.textContent = 'Done';
          out.setAttribute('aria-live', 'polite');
        }
        e.currentTarget.textContent = 'Start';
      }
    }, 1000);
  });

  // Counters ----------------------------------------------------------------
  on('[data-reps]', 'click', (e) => {
    session.reps = Math.max(1, session.reps + Number(e.currentTarget.dataset.reps));
    session.successes = Math.min(session.successes, session.reps);
    root.querySelectorAll('[data-reps-out]').forEach((o) => (o.textContent = session.reps));
    root.querySelectorAll('[data-ok-out]').forEach((o) => (o.textContent = session.successes));
    const hint = root.querySelector('[data-ok]');
    if (hint) {
      const small = hint.closest('.rep-counter').querySelector('small');
      if (small) small.textContent = `Out of ${session.reps}`;
    }
  });

  on('[data-ok]', 'click', (e) => {
    const next = session.successes + Number(e.currentTarget.dataset.ok);
    session.successes = Math.min(Math.max(0, next), session.reps);
    root.querySelectorAll('[data-ok-out]').forEach((o) => (o.textContent = session.successes));
  });

  // Result: a single tap both answers the question and saves the session.
  on('[data-arousal-save]', 'click', (e) => {
    session.arousal = Number(e.currentTarget.dataset.arousalSave);
    if (session.arousal === 4) {
      // "Could not complete" means exactly that. Do not assume any successes.
      session.successes = 0;
      session.assistance.add('session_ended');
    }
    saveSession();
  });

  on('[data-behavior]', 'click', (e) => {
    const id = e.currentTarget.dataset.behavior;
    toggleSet(session.behaviors, id);
    e.currentTarget.setAttribute('aria-pressed', String(session.behaviors.has(id)));
    // Recovery question appears once a watched behaviour is logged.
    if (['barked', 'jumped', 'nipped', 'pulled'].includes(id)) refresh();
  });

  on('[data-assist]', 'click', (e) => {
    const id = e.currentTarget.dataset.assist;
    if (id === 'none') {
      session.assistance.clear();
      session.assistance.add('none');
      refresh();
      return;
    }
    session.assistance.delete('none');
    toggleSet(session.assistance, id);
    e.currentTarget.setAttribute('aria-pressed', String(session.assistance.has(id)));
    const none = root.querySelector('[data-assist="none"]');
    if (none) none.setAttribute('aria-pressed', 'false');
  });

  on('[data-recovery]', 'click', (e) => {
    session.recoveryBand = e.currentTarget.dataset.recovery;
    refresh();
  });

  on('[data-note]', 'input', (e) => {
    session.note = e.currentTarget.value;
  });

  function sessionFields() {
    const band = RECOVERY_BANDS.find((r) => r.id === session.recoveryBand);
    return {
      activityId: activity.id,
      levelNumber: level.number,
      durationSeconds: Math.round((Date.now() - session.startedAt) / 1000),
      repetitions: session.reps,
      successfulRepetitions: session.successes,
      arousalLevel: session.arousal,
      recoverySeconds: band ? band.seconds : session.arousal <= 2 ? 20 : null,
      behaviorsObserved: [...session.behaviors],
      assistanceUsed: session.assistance.size ? [...session.assistance] : ['none'],
      context: {
        location: 'home',
        trigger:
          level.number >= 4 && activity.id === 'dg-4' ? 'familiar_guest' : 'imaginary_guest',
        distractionLevel: Math.min(level.number, 5),
      },
      note: session.note,
    };
  }

  function saveSession() {
    const record = addSession(sessionFields());
    session.saved = record;
    session.advice = recommendation(activity, level, record);
    session.phase = 'done';
    stopTimer();
    releaseAwake();
    if (!isStorageOk()) {
      toast('Not saved. Storage is unavailable on this device.');
    }
    refresh();
  }

  // Detail is a round trip: the session already exists, so this updates it and
  // re-scores the recommendation against the corrected numbers.
  on('[data-detail]', 'click', () => {
    session.phase = 'detail';
    refresh();
  });

  on('[data-save-detail]', 'click', () => {
    const updated = updateSession(session.saved.id, sessionFields());
    if (updated) {
      session.saved = updated;
      session.advice = recommendation(activity, level, updated);
    }
    session.detailAdded = true;
    session.phase = 'done';
    refresh();
  });

  // Done --------------------------------------------------------------------
  on('[data-advance]', 'click', (e) => {
    const next = Number(e.currentTarget.dataset.advance);
    setLevel(activity.id, next);
    toast(`Moved to level ${next}`);
    session = null;
    location.hash = `#/activity/${activity.slug}`;
  });

  on('[data-stay]', 'click', () => {
    setLevel(activity.id, level.number);
    toast(`Staying at level ${level.number}`);
    session = null;
    location.hash = `#/activity/${activity.slug}`;
  });

  on('[data-again]', 'click', () => {
    begin(activity, level);
    session.phase = 'step';
    keepAwake();
    refresh();
  });

  on('[data-finish]', 'click', () => {
    session = null;
    location.hash = '#/today';
  });

  // A sheet is modal: trap it, and never let focus land on the screen behind.
  if (session.releaseTrap) {
    session.releaseTrap({ restoreFocus: false });
    session.releaseTrap = null;
  }

  if (session.sheetOpen) {
    const backdrop = root.querySelector('.sheet-backdrop');
    if (backdrop) {
      session.releaseTrap = trapModal(backdrop, {
        onEscape: closeSheet,
        initialFocus: backdrop.querySelector('.sheet h2'),
      });
    }
  } else {
    focusOnNavigate(root.querySelector('.step-instruction'));
  }
}

function mount(root) {
  wire(root);
}

export function cancelSession() {
  stopTimer();
  releaseAwake();
  if (session && session.releaseTrap) session.releaseTrap({ restoreFocus: false });
  session = null;
}

export default { render, mount, tab: null, fullscreen: true };
