// The guided activity player. One instruction per screen, big targets, and a
// session that gets counted as it happens rather than reconstructed from
// memory afterward.
//
// Phases: ready → step (1..n) → practice (the live rep tally) → result
// (arousal, one tap saves) → done (recommendation) ⇄ detail (optional edits).

import {
  activityBySlug,
  isAvailable,
  IMAGES,
  stepsForLevel,
  levelOf,
  AROUSAL,
  BEHAVIORS,
  ASSISTANCE,
  RECOVERY_BANDS,
  TRAINER,
} from '../content.js';
import {
  addSession,
  isStorageOk,
  resolveCue,
  setLevel,
  updateSession,
} from '../store.js';
import { currentLevel, masteryFor, recommendation } from '../metrics.js';
import { programProgress, programGain } from '../program.js';
import { levelPips, masteryLadder } from '../programui.js';
import {
  html,
  join,
  icon,
  toast,
  pct,
  focusOnNavigate,
  trapModal,
  confirmSheet,
  withTransition,
} from '../ui.js';

let session = null;
let wakeLock = null;

/**
 * Set by Today's "jump back in" shortcut: the next time the player opens, it
 * skips the get-ready checklist and lands on step one. For someone mid-way
 * through a level, the equipment list is ritual they no longer need.
 */
let skipReadyOnce = false;
export const requestQuickStart = () => {
  skipReadyOnce = true;
};

function begin(activity, level) {
  session = {
    slug: activity.slug,
    levelNumber: level.number,
    phase: 'ready',
    stepIndex: 0,
    ready: new Set(),
    startedAt: Date.now(),
    // Each entry is one repetition as it happened: true went well, false not.
    // Totals derive from this, so the numbers are observations, not defaults.
    repLog: [],
    reps: 0,
    successes: 0,
    arousal: null,
    behaviors: new Set(),
    assistance: new Set(),
    recoveryBand: null,
    note: '',
    saved: null,
    advice: null,
    milestone: null,
    detailAdded: false,
    sheetOpen: false,
    releaseTrap: null,
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

let keyHandler = null;

function detachKeys() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function closeSheet() {
  if (!session) return;
  session.sheetOpen = false;
  refresh();
}

const syncTotals = () => {
  session.reps = session.repLog.length;
  session.successes = session.repLog.filter(Boolean).length;
};

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
        <span style="transform: scaleX(${max ? Math.min(value / max, 1).toFixed(3) : 0})"></span>
      </div>
      <span class="badge">${label}</span>
    </div>
  `;
}

function readyScreen(activity, level) {
  const cover = IMAGES[activity.coverImage];

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

        ${/* No cue list here. Every cue in the level shown together under one
              "Say" heading read as a line to deliver before starting, when they
              belong to four separate moments — the bed, the stay, the door, the
              release. Each one appears on the step that needs it. */ ''}
        <p class="section-note" style="margin-top: var(--s-5)">
          About ${activity.estimatedMinutes} minutes. Aim for ${level.reps} repetitions and
          stop early if she is still doing well.
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

        ${/* The top bar already says "Step 3 of 5" beside a bar showing the
              same thing. Printing it again here put the identical string on
              screen twice, and put a second counted series in front of someone
              who has just been told about levels. */ ''}
        <h1 class="step-instruction">${step.instruction}</h1>

        ${step.cue
          ? html`<div class="say">
              <span class="label">Say</span>
              <span class="cue">“${resolveCue(step.cue)}”</span>
            </div>`
          : ''}

        ${/* Closed by default, always. It used to spring open on the first run
              of an activity, which pushed the instruction up the screen and put
              a paragraph of reasoning between the step and the thumb reaching
              for Next. The step is the screen; the reasoning is there when it
              is wanted. */ ''}
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
          ${isLast ? 'Start counting' : 'Next'}
        </button>
      </div>
    </div>
  `;
}

/**
 * The live rep tally. This is the moment the app exists for: run a rep, tap
 * how it went, run another. Two thumb-sized answers, a count that fills
 * toward the level's target, and nothing to reconstruct from memory later.
 */
function practiceScreen(activity, level) {
  const count = session.repLog.length;
  const good = session.repLog.filter(Boolean).length;
  const target = level.reps;
  const met = count >= target;

  // What one repetition actually is, kept on screen while they are counting.
  // The steps were a walkthrough you paged through once and then left behind,
  // and by rep four, with a dog on the other end of a leash, the order goes.
  // "Steps" in the footer still goes back for the full-screen pictures; this is
  // the version you can glance at without losing your count.
  const repSteps = stepsForLevel(activity, level).map(
    (step) => html`<li>
      ${step.instruction}${step.cue
        ? html` <em class="rep-cue">“${resolveCue(step.cue)}”</em>`
        : ''}
    </li>`
  );

  return html`
    ${topBar('Counting reps', count, target)}
    <div class="player-scroll">
      <div class="player-inner">
        <p class="step-count">Level ${level.number} · ${level.title}</p>
        ${/* Smaller than a step instruction. On the step screens that heading
              is the whole screen; here the count is, and the list below says
              what the heading used to. At full size it pushed "Lucy is too
              excited" past the fold, which is the one control that can never
              need a scroll. */ ''}
        <h1 class="step-instruction step-instruction--compact">Run a rep, then tap how it went.</h1>

        <ol class="rep-steps">${join(repSteps)}</ol>

        <div class="tally">
          <p class="tally-count">
            <b data-tally-n>${count}</b>
            <span data-tally-label>of ${target}${count > 0 ? ` · ${good} went well` : ''}</span>
          </p>
          <div class="meter meter--reward tally-meter" aria-hidden="true">
            <span
              data-tally-bar
              style="transform: scaleX(${Math.min(count / target, 1).toFixed(3)})"
            ></span>
          </div>
          <p class="tally-met" data-tally-met ${met ? '' : 'hidden'}>
            Target met. Keep going, or finish on a win.
          </p>
          <p class="visually-hidden" role="status" data-tally-announce></p>
        </div>

        <div class="tally-actions">
          <button class="btn btn--lg tally-good" type="button" data-rep="1">
            That went well
          </button>
          <button class="btn btn--quiet tally-miss" type="button" data-rep="0">
            Not that one
          </button>
          <button
            class="btn btn--ghost btn--block"
            type="button"
            data-rep-undo
            ${count > 0 ? '' : 'hidden'}
          >
            Undo last rep
          </button>
        </div>

        <div class="panic-slot">
          <button class="btn btn--caution panic" type="button" data-panic>
            Lucy is too excited
          </button>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <div class="btn-row">
        <button class="btn btn--quiet" type="button" data-back-to-steps>Steps</button>
        <button class="btn" type="button" data-finish-practice>Finish</button>
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
        <p class="sheet-trainer">
          Still stuck after making it easier? That is exactly what your trainer is
          for. Bring it to your next lesson, or
          <a href="tel:${TRAINER.phone}">call ${TRAINER.name}</a>.
        </p>
        <div class="btn-row" style="margin-top: var(--s-5)">
          <button class="btn btn--quiet" type="button" data-sheet-close>Keep going</button>
          <button class="btn" type="button" data-sheet-end>End and log</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * One question, four big targets, done. The reps were counted as they
 * happened, so how-she-felt is the only thing left worth asking.
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
    <div class="player-foot">
      <button class="btn btn--ghost btn--block" type="button" data-back-practice>
        Back to counting
      </button>
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
          <h2>Correct the counts</h2>
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

/**
 * What this session did to the program.
 *
 * The bar is rendered at the width it had *before* the session and moved to
 * its new width on mount, so the household watches the thing advance instead
 * of being told it did. It is the only animation in the app that carries
 * information rather than choreography.
 */
function programBand(gain, before) {
  if (!gain) return '';
  const prog = gain.program;
  const from = Math.round(before.ratio * 100);
  const to = Math.round(prog.ratio * 100);
  const moved = gain.clearedLevel !== null;

  return html`<div class="program-band ${moved ? 'program-band--moved' : ''}">
    <div class="program-band-top">
      <span>${prog.program.title}</span>
      <b data-count-to="${prog.cleared}">${moved ? before.cleared : prog.cleared}</b>
    </div>
    <div
      class="meter"
      role="img"
      aria-label="${prog.cleared} of ${prog.total} levels cleared in ${prog.program.title}"
    >
      <span style="width: ${Math.max(from, before.cleared ? 4 : 0)}%" data-grow-to="${to}"></span>
    </div>
    <p>
      ${moved
        ? `Level ${gain.clearedLevel} cleared. ${prog.cleared} of ${prog.total} in the program.`
        : `${prog.cleared} of ${prog.total} levels cleared.`}
    </p>
  </div>`;
}

/** The one that is worth stopping for: a whole activity finished. */
function stageCelebration(gain) {
  if (!gain) return '';
  const prog = gain.program;

  if (gain.completedProgram) {
    const outcome = prog.program.outcome;
    return html`<div class="finale finale--program">
      ${icon('spark')}
      <p class="eyebrow">All four finished</p>
      <h2>${outcome.title}</h2>
      <p>${outcome.note}</p>
      <a class="btn btn--block" href="#/progress" style="margin-top: var(--s-4)"
        >See the whole picture</a
      >
    </div>`;
  }

  if (!gain.completedActivity) return '';
  const next = gain.upNext;
  return html`<div class="finale">
    ${icon('spark')}
    <p class="eyebrow">Activity ${gain.stage.number} of ${prog.stages.length} finished</p>
    <h2>${gain.stage.activity.title} is done</h2>
    ${next
      ? html`<p>
            Every level cleared. Next in the program is
            <strong>${next.activity.title}</strong>. ${next.activity.shortPurpose}
          </p>
          <a class="btn btn--block" href="#/activity/${next.activity.slug}"
            style="margin-top: var(--s-4)"
            >Open ${next.activity.title}</a
          >`
      : html`<p>Every level cleared.</p>`}
  </div>`;
}

/**
 * A level crossing the clear line, given its own moment.
 *
 * This was a clause inside the program band's sentence: "Level 3 cleared. 7 of
 * 23 in the program." Clearing a level is the largest thing earnable inside an
 * activity and the only one that moves the map, so it gets the stamp and the
 * pips that go with it. It fires exactly when programGain says a level crossed,
 * which is the same condition the map redraws on.
 */
function clearedBanner(gain, level) {
  if (!gain || gain.clearedLevel === null) return '';
  const stage = gain.stage;
  return html`<div class="cleared">
    <div class="cleared-seal">${icon('check')}</div>
    <h2>Level ${level.number} cleared</h2>
    <p>${stage.cleared} of ${stage.total} in ${stage.activity.title}</p>
    <div class="cleared-pips">${levelPips(stage)}</div>
  </div>`;
}

function doneScreen(activity, level) {
  const advice = session.advice;
  const saved = session.saved;
  const rate = saved.repetitions ? saved.successfulRepetitions / saved.repetitions : 0;
  const caution = advice.suggest === 'down';
  const milestone = session.milestone;

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

        ${clearedBanner(session.gain, level)}

        ${milestone
          ? html`<div class="milestone-climb">
              <p>
                ${milestone.to.id === 'reliable'
                  ? html`That makes level ${level.number} <strong>Reliable</strong>. Three
                      sessions, three days, barely any help.`
                  : html`Level ${level.number} is now
                      <strong>${milestone.to.label}</strong>.`}
              </p>
              ${masteryLadder(milestone.to, { from: milestone.from })}
            </div>`
          : ''}

        <div class="stat-row">
          <div class="stat">
            <b>${saved.successfulRepetitions}/${saved.repetitions}</b>
            <span>Went well</span>
          </div>
          <div class="stat">
            <b>${pct(saved.repetitions ? rate : null)}</b>
            <span>Success</span>
          </div>
          <div class="stat">
            <b>${AROUSAL.find((a) => a.value === saved.arousalLevel).short}</b>
            <span>Arousal</span>
          </div>
        </div>

        ${programBand(session.gain, session.programBefore)}
        ${stageCelebration(session.gain)}

        <button class="btn btn--quiet btn--block" type="button" data-detail
          style="margin-top: var(--s-4)">
          ${session.detailAdded ? 'Edit detail' : 'Add detail'}
        </button>

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
  // A parked activity resolves by slug perfectly well, so /play has to check
  // availability itself rather than trusting that no screen links here.
  if (!isAvailable(activity)) {
    return html`<div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Coming soon</p>
        <h1>${activity.title}</h1>
        <p>This one is not in the app yet. It arrives with the next handout.</p>
      </div>
      <a class="btn btn--quiet" href="#/activities">Back to activities</a>
    </div>`;
  }

  if (!session || session.slug !== slug) {
    begin(activity, currentLevel(activity));
  }
  if (skipReadyOnce) {
    skipReadyOnce = false;
    if (session.phase === 'ready') {
      session.phase = 'step';
      session.startedAt = Date.now();
      keepAwake();
    }
  }
  const level = levelOf(activity, session.levelNumber);

  let body;
  if (session.phase === 'ready') body = readyScreen(activity, level);
  else if (session.phase === 'step') body = stepScreen(activity, level);
  else if (session.phase === 'practice') body = practiceScreen(activity, level);
  else if (session.phase === 'result') body = resultScreen(activity, level);
  else if (session.phase === 'detail') body = detailScreen(activity, level);
  else body = doneScreen(activity, level);

  return html`<div class="player">${body}</div>
    ${session.sheetOpen ? fallbackSheet(activity) : ''}`;
}

/**
 * Re-render the player in place. `direction` choreographs the change:
 * 'forward' and 'back' slide with the direction of travel; omitted means an
 * in-place data update with no motion (chip toggles, tally taps).
 */
function refresh(direction) {
  const update = () => {
    const root = document.getElementById('app');
    root.innerHTML = String(render({ slug: session.slug }));
    wire(root);
  };
  if (direction) withTransition(update, direction);
  else update();
}

/** Fetch the next step's illustration while this one is being read. */
function preloadUpcoming(activity, level) {
  const steps = stepsForLevel(activity, level);
  const next = steps[session.stepIndex + 1];
  if (next && next.image) new Image().src = IMAGES[next.image].src;
}

/**
 * Move the program bar from where it was to where it is, one frame after the
 * screen paints. Under prefers-reduced-motion the CSS transition is off, so
 * this just sets the final value and the count lands immediately.
 */
function animateProgramBand(root) {
  const fill = root.querySelector('.program-band [data-grow-to]');
  if (!fill) return;
  const count = root.querySelector('.program-band [data-count-to]');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fill.style.width = `${Math.max(Number(fill.dataset.growTo), 4)}%`;
      if (count) count.textContent = count.dataset.countTo;
    });
  });
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

  const leave = () => {
    releaseAwake();
    const slug = session.slug;
    session = null;
    location.hash = `#/activity/${slug}`;
  };

  on('[data-exit]', 'click', () => {
    const unsaved = ['step', 'practice', 'result'].includes(session.phase);
    if (!unsaved) {
      leave();
      return;
    }
    confirmSheet({
      title: 'Leave practice?',
      body: 'Nothing from this session is saved yet.',
      confirmLabel: 'Leave',
      cancelLabel: 'Keep going',
      onConfirm: leave,
    });
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
    refresh('forward');
  });

  on('[data-next]', 'click', () => {
    if (session.stepIndex < steps.length - 1) {
      session.stepIndex += 1;
    } else {
      session.phase = 'practice';
    }
    refresh('forward');
  });

  on('[data-prev]', 'click', () => {
    if (session.stepIndex > 0) {
      session.stepIndex -= 1;
      refresh('back');
    }
  });

  // The tally ---------------------------------------------------------------
  // Updated in place, never re-rendered: a full refresh would steal focus
  // from the button on every rep, and the meter's fill could not tween.
  const updateTally = (announcement) => {
    syncTotals();
    const count = session.reps;
    const good = session.successes;
    const target = level.reps;
    const q = (sel) => root.querySelector(sel);

    q('[data-tally-n]').textContent = count;
    q('[data-tally-label]').textContent =
      `of ${target}${count > 0 ? ` · ${good} went well` : ''}`;
    q('[data-tally-bar]').style.transform =
      `scaleX(${Math.min(count / target, 1).toFixed(3)})`;
    q('[data-tally-met]').hidden = count < target;
    q('[data-rep-undo]').hidden = count === 0;
    q('[data-tally-announce]').textContent = announcement;

    const track = q('.progress-track');
    track.setAttribute('aria-valuenow', Math.min(count, target));
    track.querySelector('span').style.transform =
      `scaleX(${Math.min(count / target, 1).toFixed(3)})`;
  };

  on('[data-rep]', 'click', (e) => {
    const good = e.currentTarget.dataset.rep === '1';
    session.repLog.push(good);
    updateTally(`${session.repLog.length} of ${level.reps}. ${good ? 'Went well.' : 'Not that one.'}`);
  });

  on('[data-rep-undo]', 'click', () => {
    session.repLog.pop();
    updateTally(`Removed. ${session.repLog.length} counted.`);
    // If the undo button just vanished under the pointer, park focus safely.
    if (session.repLog.length === 0) {
      root.querySelector('.tally-good').focus({ preventScroll: true });
    }
  });

  on('[data-back-to-steps]', 'click', () => {
    session.phase = 'step';
    session.stepIndex = steps.length - 1;
    refresh('back');
  });

  on('[data-back-practice]', 'click', () => {
    session.phase = 'practice';
    refresh('back');
  });

  on('[data-finish-practice]', 'click', () => {
    syncTotals();
    session.phase = 'result';
    refresh('forward');
  });

  // Fallback sheet ------------------------------------------------------------
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
    refresh('forward');
  });

  // Detail-screen count corrections ------------------------------------------
  on('[data-reps]', 'click', (e) => {
    session.reps = Math.max(0, session.reps + Number(e.currentTarget.dataset.reps));
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
  // The counts are real observations now, so nothing gets zeroed or assumed.
  on('[data-arousal-save]', 'click', (e) => {
    session.arousal = Number(e.currentTarget.dataset.arousalSave);
    if (session.arousal === 4) session.assistance.add('session_ended');
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
    // Mastery is recomputed from all sessions, so compare around the insert to
    // catch the moment a level crosses a threshold — that moment is earned and
    // deserves acknowledging, once.
    const before = masteryFor(activity.id, level.number);
    // Same trick one level up: snapshot the program so the done screen can say
    // what this session did to the whole arc, not just to this level.
    const programBefore = programProgress(activity.programId);
    const record = addSession(sessionFields());
    const after = masteryFor(activity.id, level.number);
    session.milestone = after.rank > before.rank ? { from: before, to: after } : null;
    session.gain = programGain(activity, level.number, programBefore);
    session.programBefore = programBefore;

    session.saved = record;
    session.advice = recommendation(activity, level, record);
    session.phase = 'done';
    releaseAwake();
    if (!isStorageOk()) {
      toast('Not saved. Storage is unavailable on this device.');
    }
    refresh('forward');
  }

  // Detail is a round trip: the session already exists, so this updates it and
  // re-scores the recommendation against the corrected numbers.
  on('[data-detail]', 'click', () => {
    session.phase = 'detail';
    refresh('forward');
  });

  on('[data-save-detail]', 'click', () => {
    const updated = updateSession(session.saved.id, sessionFields());
    if (updated) {
      session.saved = updated;
      session.advice = recommendation(activity, level, updated);
      // Corrected numbers can cross or un-cross a level, so the program band
      // has to be re-scored against the same pre-session snapshot.
      session.gain = programGain(activity, level.number, session.programBefore);
    }
    session.detailAdded = true;
    session.phase = 'done';
    refresh('back');
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
    refresh('forward');
  });

  on('[data-finish]', 'click', () => {
    session = null;
    location.hash = '#/today';
  });

  animateProgramBand(root);

  if (session.phase === 'step') preloadUpcoming(activity, level);

  // Desktop accelerator: arrow keys walk the steps. Routed through the real
  // buttons so edge behaviour and transitions stay identical to tapping.
  detachKeys();
  if (session.phase === 'step' && !session.sheetOpen) {
    keyHandler = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      // e.target can be the document itself, which has no .matches.
      if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
      const button = document.querySelector(
        e.key === 'ArrowRight' ? '[data-next]' : '[data-prev]'
      );
      if (button && !button.disabled) {
        e.preventDefault();
        button.click();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }
  if (session.phase === 'ready' && steps[0] && steps[0].image) {
    new Image().src = IMAGES[steps[0].image].src;
  }

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
  // render() bails before begin() for a missing or parked activity, so there is
  // no session to wire up. wire() dereferences session immediately and would
  // throw straight into the error boundary.
  if (!session) return;
  wire(root);
}

export function cancelSession() {
  detachKeys();
  releaseAwake();
  if (session && session.releaseTrap) session.releaseTrap({ restoreFocus: false });
  session = null;
}

export default { render, mount, tab: null, fullscreen: true };
