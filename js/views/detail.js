import {
  activityBySlug,
  DOG,
  isAvailable,
  IMAGES,
  programById,
  stepsForLevel,
  TRAINER,
} from '../content.js';
import { setLevel, resolveCue, sessionsFor } from '../store.js';
import {
  currentLevel,
  masteryFor,
  successRate,
  sessionsAt,
  relativeDay,
  lastPracticed,
} from '../metrics.js';
import { stageFor, STAGE } from '../program.js';
import { levelPips, masteryLadder } from '../programui.js';
import {
  html,
  raw,
  join,
  badge,
  icon,
  difficultyDots,
  pct,
  focusHeading,
  refreshApp,
} from '../ui.js';

/**
 * What this activity is for, one step up. Sits at the bottom of the screen so
 * finishing here has somewhere to go: the next stage, or the payoff if this is
 * the last one standing.
 */
function nextUpCard(prog, stage) {
  // `live` only: pointing someone at an activity that is not in the app yet is
  // a dead end dressed up as a next step.
  const later = prog.live.find((s) => s.index > stage.index && !s.complete);
  const anyOther = prog.live.find((s) => s.index !== stage.index && !s.complete);
  const target = later || anyOther;

  if (!target) {
    const outcome = prog.program.outcome;
    return html`<section class="section">
      <div class="next-up next-up--outcome">
        <p class="eyebrow">${outcome.eyebrow}</p>
        <h2>${outcome.title}</h2>
        <p>${outcome.body}</p>
      </div>
    </section>`;
  }

  return html`<section class="section">
    <a class="next-up" href="#/activity/${target.activity.slug}">
      <div>
        <p class="eyebrow">
          ${stage.complete ? 'Next in the program' : `Also in ${prog.program.title}`}
        </p>
        <h2>${target.activity.title}</h2>
        <p>${target.activity.shortPurpose}</p>
        <span class="next-up-meta">
          ${levelPips(target)}
          <span class="stage-count" aria-hidden="true">${target.cleared}/${target.total}</span>
        </span>
      </div>
      ${icon('arrow')}
    </a>
  </section>`;
}

function render({ slug }) {
  const activity = activityBySlug(slug);
  if (!activity) {
    return html`<div class="screen">
      <div class="screen-head"><h1>Activity not found</h1></div>
      <a class="btn btn--quiet" href="#/activities">Back to activities</a>
    </div>`;
  }

  const cover = IMAGES[activity.coverImage];
  const program = programById(activity.programId);

  // Parked activities are still reachable by URL — an old bookmark, a shared
  // link, the back button. Say plainly that it is not here yet rather than
  // rendering a level picker and a Start button that lead nowhere.
  if (!isAvailable(activity)) {
    return html`
      <div class="detail-hero">
        <img src="${cover.src}" alt="${cover.alt}" />
        <button class="backlink" type="button" data-back aria-label="Back">${icon('back')}</button>
      </div>
      <div class="detail-body">
        <a class="detail-crumb" href="#/program/${program.id}">
          ${icon('book')}
          <span>${program.title}</span>
        </a>
        <h1>${activity.title}</h1>
        <p class="lede">${activity.shortPurpose}</p>

        <div class="next-up next-up--outcome" style="margin-top: var(--s-5)">
          <p class="eyebrow">Coming soon</p>
          <h2>Not in the app yet</h2>
          <p>
            ${activity.levels.length} levels are written for this one. It arrives with the
            next handout from ${TRAINER.name}.
          </p>
        </div>

        <section class="section">
          <a class="btn btn--quiet btn--block" href="#/program/${program.id}">
            See where this fits
          </a>
        </section>
      </div>
    `;
  }

  const active = currentLevel(activity);
  const history = sessionsFor(activity.id);
  const rate = successRate(sessionsAt(activity.id, active.number));

  const { program: prog, stage } = stageFor(activity);

  const levels = activity.levels.map((level) => {
    const mastery = masteryFor(activity.id, level.number);
    const cleared = stage.levels[level.number - 1].cleared;
    return html`<button
      type="button"
      class="level-row ${cleared ? 'level-row--cleared' : ''}"
      data-level="${level.number}"
      aria-pressed="${String(level.number === active.number)}"
    >
      <span class="n" aria-hidden="true">
        ${cleared ? icon('check') : raw(String(level.number))}
      </span>
      <span class="txt">
        <strong>${level.title}</strong>
        <small>${level.setup}</small>
      </span>
      ${badge(mastery)}
    </button>`;
  });

  const steps = stepsForLevel(activity, active).map(
    (step) => html`<li>
      <span>${step.instruction}</span>
      ${step.cue ? html`<em>&nbsp;“${resolveCue(step.cue)}”</em>` : ''}
    </li>`
  );

  return html`
    <div class="detail-hero">
      <img
        src="${cover.src}"
        alt="${cover.alt}"
        style="view-transition-name: card-${activity.id}"
      />
      <button class="backlink" type="button" data-back aria-label="Back">${icon('back')}</button>
    </div>

    <div class="detail-body">
      <a class="detail-crumb" href="#/program/${program.id}">
        ${icon('book')}
        <span>${program.title}</span>
      </a>
      <h1>${activity.title}</h1>
      <p class="lede">${activity.shortPurpose}</p>

      <div class="stage-strip">
        <span class="stage-strip-label">
          Activity ${stage.number} of ${prog.stages.length}
        </span>
        ${levelPips(stage)}
        <span class="stage-count" aria-hidden="true">${stage.cleared}/${stage.total}</span>
      </div>

      ${stage.state === STAGE.ahead
        ? html`<p class="stage-warn">
            ${icon('shield')}
            <span>
              Most households run ${stage.after.title} first. Start here only if your
              trainer said to.
            </span>
          </p>`
        : ''}

      <div class="meta" style="margin-top: var(--s-4)">
        <span>${activity.estimatedMinutes} min</span>
        ${difficultyDots(activity.difficulty)}
        <span>${relativeDay(lastPracticed(activity.id))}</span>
      </div>

      <section class="section">
        <h2>Pick a level</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          ${history.length
            ? `${history.length} session${history.length === 1 ? '' : 's'} logged${
                rate !== null ? ` · ${pct(rate)} success at level ${active.number}` : ''
              }`
            : 'Start at level 1. You can always move down.'}
        </p>
        <div class="level-list">${join(levels)}</div>
      </section>

      ${/* The ladder for the level being worked. The badge on the level row
            says which rung it stands on; this says what the rungs are and
            what is above this one, which is the part that gives it somewhere
            to go. */ ''}
      <section class="section">
        <h2>How solid is level ${active.number}</h2>
        <div class="card">
          <div class="card-body">
            ${masteryLadder(masteryFor(activity.id, active.number))}
            <p class="section-note" style="margin-top: var(--s-4)">
              ${history.length
                ? 'Reliable takes 90% across three sessions, on three different days, without heavy help.'
                : `Every level starts here. Run a session and ${DOG.name} climbs.`}
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>What you need</h2>
        <ul class="checklist">
          ${join(activity.equipment.map((item) => html`<li>${item}</li>`))}
        </ul>
      </section>

      <section class="section">
        <h2>Success looks like</h2>
        <ul class="criteria">
          ${join(active.successCriteria.map((c) => html`<li>${c}</li>`))}
        </ul>
      </section>

      <section class="section">
        <h2>Keep in mind</h2>
        <ul class="notes-list">
          ${join(activity.safetyNotes.map((n) => html`<li>${n}</li>`))}
        </ul>
      </section>

      <section class="section">
        <details class="disclosure">
          <summary>All ${steps.length} steps at this level</summary>
          <div class="disclosure-body">
            <ol style="padding-left: 1.2em; margin: 0">${join(steps)}</ol>
          </div>
        </details>
        <details class="disclosure">
          <summary>Trainer material</summary>
          <div class="disclosure-body">
            <p><strong>${program.source.label}</strong></p>
            <p style="margin-top: var(--s-2)">${program.source.note}</p>
          </div>
        </details>
      </section>

      ${nextUpCard(prog, stage)}
    </div>

    <div class="sticky-action">
      <a class="btn btn--lg btn--block" href="#/play/${activity.slug}"
        >Start level ${active.number}</a
      >
    </div>
  `;
}

let pendingFocusLevel = null;

function mount(root, { slug }, options = {}) {
  const activity = activityBySlug(slug);
  root.querySelectorAll('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingFocusLevel = btn.dataset.level;
      setLevel(activity.id, Number(btn.dataset.level));
      refreshApp();
    });
  });

  const back = root.querySelector('[data-back]');
  if (back) {
    back.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else location.hash = '#/activities';
    });
  }

  if (pendingFocusLevel) {
    const btn = root.querySelector(`[data-level="${pendingFocusLevel}"]`);
    pendingFocusLevel = null;
    if (btn) {
      btn.focus({ preventScroll: true });
      return;
    }
  }
  focusHeading(root, null, options);
}

export default { render, mount, tab: 'activities' };
