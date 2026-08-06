import {
  activityBySlug,
  IMAGES,
  programById,
  stepsForLevel,
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
import {
  html,
  join,
  badge,
  icon,
  difficultyDots,
  pct,
  focusHeading,
  refreshApp,
} from '../ui.js';

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
  const active = currentLevel(activity);
  const history = sessionsFor(activity.id);
  const rate = successRate(sessionsAt(activity.id, active.number));

  const levels = activity.levels.map((level) => {
    const mastery = masteryFor(activity.id, level.number);
    return html`<button
      type="button"
      class="level-row"
      data-level="${level.number}"
      aria-pressed="${String(level.number === active.number)}"
    >
      <span class="n" aria-hidden="true">${level.number}</span>
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
      <img src="${cover.src}" alt="${cover.alt}" />
      <button class="backlink" type="button" data-back aria-label="Back">${icon('back')}</button>
    </div>

    <div class="detail-body">
      <p class="section-note">${program.title}</p>
      <h1>${activity.title}</h1>
      <p class="lede">${activity.shortPurpose}</p>

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
