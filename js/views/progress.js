import {
  ACTIVITIES,
  LIVE_ACTIVITIES,
  BEHAVIORS,
  INCIDENT_CONTEXTS,
  INCIDENT_RESPONSES,
  PROGRAMS,
} from '../content.js';
import { programProgress } from '../program.js';
import { programHeader, programStrip } from '../programui.js';
import {
  getState,
  removeSession,
  removeIncident,
  restoreSession,
  restoreIncident,
} from '../store.js';
import {
  weekSummary,
  practiceByDay,
  headlineInsight,
  activityMastery,
  currentLevel,
  successRate,
  sessionsAt,
  relativeDay,
} from '../metrics.js';
import {
  html,
  join,
  badge,
  icon,
  pct,
  mmss,
  focusHeading,
  refreshApp,
  toast,
} from '../ui.js';

// Deletion is intentional, not ambient: the trash cans only appear after
// "Edit" is tapped, so the log reads as a diary rather than a checklist of
// things to destroy.
let editing = false;

const behaviorLabel = (id) => {
  const b = BEHAVIORS.find((x) => x.id === id);
  return b ? b : { label: id, tone: 'good' };
};

function metric(value, label, note) {
  return html`<div class="metric">
    <b>${value}</b>
    <span>${label}</span>
    ${note ? html`<small>${note}</small>` : ''}
  </div>`;
}

/**
 * The "last week" line under the calm rate, qualified when the two weeks were
 * not the same work.
 *
 * The rate counts calm sessions over all sessions and knows nothing about
 * difficulty, so a week on level 1 outscores a week on level 5 for the same
 * dog. Left bare, "83% — 57% last week" reads as a calmer dog when it can just
 * as easily be an easier week, and this screen is what a household hands their
 * trainer.
 *
 * Half a level is the threshold: below that the mix has not really moved, and
 * flagging it every week would make the qualifier invisible by repetition.
 * Stated in words rather than as an adjusted number, because there is no honest
 * weighting — how much harder level 4 is than level 3 is not a thing this app
 * knows, and inventing a coefficient would bury the caveat in arithmetic.
 */
function calmNote(week, prior) {
  if (prior.calmRate === null) return '';
  const base = `${pct(prior.calmRate)} last week`;
  if (week.avgLevel === null || prior.avgLevel === null) return base;

  const shift = week.avgLevel - prior.avgLevel;
  if (Math.abs(shift) < 0.5) return base;
  return shift < 0 ? `${base}, on harder levels` : `${base}, on easier levels`;
}

/**
 * A written comparison rather than another dashboard tile. Direction is stated
 * in words, so the arrow is decoration and not the only signal.
 */
function compare(label, now, before, unit, lowerIsBetter, format = (n) => n) {
  if (now == null && before == null) return null;
  const current = now == null ? 0 : now;
  const previous = before == null ? 0 : before;
  const delta = current - previous;

  let direction = 'flat';
  if (delta !== 0) {
    const improved = lowerIsBetter ? delta < 0 : delta > 0;
    direction = improved ? 'better' : 'worse';
  }

  let phrase;
  if (delta === 0) phrase = 'Same as last week';
  else if (before == null || before === 0) phrase = 'New this week';
  else phrase = `${direction === 'better' ? 'Down' : 'Up'} from ${format(previous)}`;

  const unitLabel = unit === 'sessions' && current === 1 ? 'session' : unit;

  return html`<div class="compare-row">
    <span class="compare-label">${label}</span>
    <span class="compare-value">
      <b>${now == null ? '—' : format(current)}</b>
      ${unitLabel ? html`<small>${unitLabel}</small>` : ''}
    </span>
    <span class="compare-delta compare-delta--${direction}">${phrase}</span>
  </div>`;
}

function render() {
  const state = getState();
  const week = weekSummary(0);
  const prior = weekSummary(1);
  const days = practiceByDay();
  const max = Math.max(1, ...days.map((d) => d.count));
  const prog = programProgress(PROGRAMS[0].id);
  const insight = headlineInsight();

  const bars = days.map(
    (d) => html`<div class="bar ${d.count ? '' : 'bar--empty'}">
      <div class="track">
        <i style="height: ${Math.max((d.count / max) * 100, 5)}%"></i>
      </div>
      <span>${d.label}</span>
    </div>`
  );

  const mastery = LIVE_ACTIVITIES.map((activity) => {
    const level = currentLevel(activity);
    const rate = successRate(sessionsAt(activity.id, level.number));
    return html`<div class="mastery-row">
      <strong>${activity.title}</strong>
      <div class="under">
        <small>Level ${level.number} · ${level.title}${rate !== null ? ` · ${pct(rate)}` : ''}</small>
        ${badge(activityMastery(activity.id))}
      </div>
    </div>`;
  });

  const recent = [
    ...state.sessions.map((s) => ({ kind: 'session', at: s.startedAt, data: s })),
    ...state.incidents.map((i) => ({ kind: 'incident', at: i.occurredAt, data: i })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const log = recent.map((entry) => {
    const when = relativeDay(new Date(entry.at));
    if (entry.kind === 'session') {
      const s = entry.data;
      const activity = ACTIVITIES.find((a) => a.id === s.activityId);
      const tags = (s.behaviorsObserved || []).map((id) => {
        const b = behaviorLabel(id);
        return html`<span class="tag tag--${b.tone}">${b.label}</span>`;
      });
      return html`<div class="log-row">
        <span class="when">${when}</span>
        <div class="log-body">
          <strong>${activity ? activity.title : 'Session'}</strong>
          <p>
            Level ${s.levelNumber} · ${s.successfulRepetitions}/${s.repetitions} went well
          </p>
          ${tags.length ? html`<div class="tag-line">${join(tags)}</div>` : ''}
          ${s.note ? html`<p>“${s.note}”</p>` : ''}
        </div>
        ${editing
          ? html`<button
              class="icon-btn log-remove"
              type="button"
              data-remove-session="${s.id}"
              aria-label="Remove this session"
            >
              ${icon('trash')}
            </button>`
          : ''}
      </div>`;
    }
    const i = entry.data;
    const context = INCIDENT_CONTEXTS.find((c) => c.id === i.context);
    const tags = (i.responses || []).map((id) => {
      const r = INCIDENT_RESPONSES.find((x) => x.id === id);
      return html`<span class="tag tag--${r ? r.tone : 'good'}">${r ? r.label : id}</span>`;
    });
    return html`<div class="log-row">
      <span class="when">${when}</span>
      <div class="log-body">
        <strong>${context ? context.label : 'Moment'}</strong>
        <p>Real life · not a practice session</p>
        ${tags.length ? html`<div class="tag-line">${join(tags)}</div>` : ''}
        ${i.note ? html`<p>“${i.note}”</p>` : ''}
      </div>
      ${editing
        ? html`<button
            class="icon-btn log-remove"
            type="button"
            data-remove-incident="${i.id}"
            aria-label="Remove this moment"
          >
            ${icon('trash')}
          </button>`
        : ''}
    </div>`;
  });

  const empty = !state.sessions.length && !state.incidents.length;

  return html`
    <div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Last seven days</p>
        <h1>Progress</h1>
      </div>

      ${empty
        ? html`<div class="card">
              <div class="empty">
                <h3>Nothing logged yet</h3>
                <p>Finish one session and this fills in. Nine sessions is enough to see a trend.</p>
                <a class="btn btn--quiet" href="#/today" style="margin-top: var(--s-4)">Go practice</a>
              </div>
            </div>
            ${/* "How far through are we" is the question this screen exists to
                  answer, and it is the one a household asks before they have
                  logged anything. Answer it rather than showing only a blank. */ ''}
            <section class="section">
              <h2>What you are working through</h2>
              <p class="section-note" style="margin-bottom: var(--s-3)">
                ${prog.program.blurb}
              </p>
              ${programStrip(prog)}
            </section>`
        : html`
            <div class="insight insight--${insight.tone}">${icon('spark')}<p>${insight.text}</p></div>

            <section class="section">
              <div class="metric-grid">
                ${metric(
                  week.count,
                  week.count === 1 ? 'Session' : 'Sessions',
                  prior.count ? `${prior.count} last week` : ''
                )}
                ${metric(pct(week.calmRate), 'Stayed calm', calmNote(week, prior))}
              </div>

              <div class="card" style="margin-top: var(--s-3)">
                <div class="card-body">
                  ${join(
                    [
                      compare('Jumping', week.jumps, prior.jumps, 'sessions', true),
                      compare('Nipping', week.nips, prior.nips, 'sessions', true),
                      compare(
                        'Time to settle',
                        week.avgRecovery,
                        prior.avgRecovery,
                        '',
                        true,
                        mmss
                      ),
                    ].filter(Boolean)
                  )}
                </div>
              </div>
            </section>

            <section class="section">
              <h2>Practice frequency</h2>
              <div class="card">
                <div class="card-body">
                  <div class="bars" role="img"
                    aria-label="Sessions per day over the last seven days: ${days
                      .map((d) => `${d.count}`)
                      .join(', ')}">
                    ${join(bars)}
                  </div>
                </div>
              </div>
            </section>

            <section class="section">
              ${programHeader(prog, { eyebrow: 'How far through' })}
              <div class="card">
                <div class="card-body">${join(mastery)}</div>
              </div>
              <p class="section-note">
                A level counts as cleared at 75% success, or once you have moved past it.
                Reliable is higher still. 90% across three sessions, on three different
                days, without heavy help.
              </p>
              <a class="btn btn--quiet btn--block" href="#/program/${prog.program.id}"
                style="margin-top: var(--s-4)">
                See the program map
              </a>
            </section>

            <section class="section">
              <div class="section-head-row">
                <h2>Recent activity</h2>
                <button
                  class="btn btn--ghost"
                  type="button"
                  data-toggle-edit
                  aria-pressed="${String(editing)}"
                >
                  ${editing ? 'Done' : 'Edit'}
                </button>
              </div>
              <div class="card">
                <div class="card-body">${join(log)}</div>
              </div>
            </section>

            <section class="section">
              <a class="btn btn--quiet btn--block" href="#/report">Prepare for your next lesson</a>
            </section>
          `}

      <section class="section">
        <button class="btn btn--quiet btn--block" type="button" data-route="#/moment">
          ${icon('plus')} Record a moment
        </button>
      </section>
    </div>
  `;
}

function mount(root, params, options = {}) {
  const remove = (button, doRemove, restore, noun) => {
    const id = button.dataset.removeSession || button.dataset.removeIncident;
    const removed = doRemove(id);
    if (!removed) return;
    refreshApp();
    toast(`${noun} removed`, {
      label: 'Undo',
      onAction: () => {
        restore(removed);
        refreshApp();
      },
    });
  };

  const toggle = root.querySelector('[data-toggle-edit]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      editing = !editing;
      refreshApp();
      // The refresh replaced the button; keep the keyboard where it was.
      const fresh = document.querySelector('[data-toggle-edit]');
      if (fresh) fresh.focus({ preventScroll: true });
    });
  }

  root.querySelectorAll('[data-remove-session]').forEach((button) => {
    button.addEventListener('click', () =>
      remove(button, removeSession, restoreSession, 'Session')
    );
  });

  root.querySelectorAll('[data-remove-incident]').forEach((button) => {
    button.addEventListener('click', () =>
      remove(button, removeIncident, restoreIncident, 'Moment')
    );
  });

  focusHeading(root, params, options);
}

export default { render, mount, tab: 'progress' };
