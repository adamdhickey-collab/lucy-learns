// The lesson report: what the household hands the trainer at the next
// appointment, as a screen rather than a spreadsheet. The first ten minutes
// of every follow-up is usually spent reconstructing what happened at home —
// this is those ten minutes, prepared.

import {
  ACTIVITIES,
  LIVE_ACTIVITIES,
  DOG,
  INCIDENT_CONTEXTS,
  PROGRAMS,
  TRAINER,
} from '../content.js';
import { programProgress } from '../program.js';
import { getState, exportSummary } from '../store.js';
import {
  activityMastery,
  currentLevel,
  successRate,
  relativeDay,
} from '../metrics.js';
import { html, join, badge, pct, toast, focusHeading } from '../ui.js';

// 14 days covers the common every-other-week lesson cadence by default.
let rangeDays = 14;

const RANGES = [
  { days: 7, label: 'Last week' },
  { days: 14, label: 'Two weeks' },
  { days: 30, label: 'Thirty days' },
];

const since = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
};

function inRange(days) {
  const state = getState();
  const cutoff = since(days);
  return {
    sessions: state.sessions.filter((s) => new Date(s.startedAt) >= cutoff),
    incidents: state.incidents.filter((i) => new Date(i.occurredAt) >= cutoff),
  };
}

function priorRange(days) {
  const state = getState();
  const end = since(days);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return state.sessions.filter((s) => {
    const t = new Date(s.startedAt);
    return t >= start && t < end;
  });
}

const watchCount = (sessions, tag) =>
  sessions.filter((s) => (s.behaviorsObserved || []).includes(tag)).length;

/** Plain-text version for the share sheet and clipboard. */
function composeShareText(days) {
  const { sessions, incidents } = inRange(days);
  const rate = successRate(sessions);
  const lines = [
    `${DOG.name} — training report, last ${days} days`,
    `${sessions.length} practice session${sessions.length === 1 ? '' : 's'}` +
      (rate !== null ? `, ${pct(rate)} of repetitions went well` : ''),
  ];
  LIVE_ACTIVITIES.forEach((activity) => {
    const mine = sessions.filter((s) => s.activityId === activity.id);
    // Listed even when untouched, for the same reason the screen lists it: an
    // activity nobody practised for a fortnight is information, not an absence.
    if (!mine.length) {
      lines.push(`- ${activity.title}: no sessions in this window`);
      return;
    }
    const level = currentLevel(activity);
    lines.push(
      `- ${activity.title}: level ${level.number}, ${activityMastery(activity.id).label.toLowerCase()}, ${pct(successRate(mine))} over ${mine.length} session${mine.length === 1 ? '' : 's'}`
    );
  });
  const jumped = watchCount(sessions, 'jumped');
  const nipped = watchCount(sessions, 'nipped');
  lines.push(
    `Watch: jumping in ${jumped} session${jumped === 1 ? '' : 's'}, ` +
      (nipped ? `nipping in ${nipped}` : 'no nipping') +
      (incidents.length
        ? `, ${incidents.length} real-life moment${incidents.length === 1 ? '' : 's'} logged`
        : '')
  );
  const notes = [
    ...sessions.filter((s) => s.note),
    ...incidents.filter((i) => i.note),
  ];
  if (notes.length) lines.push(`${notes.length} note${notes.length === 1 ? '' : 's'} attached for you.`);
  return lines.join('\n');
}

/**
 * Direction of travel under the success rate — including when there isn't any.
 *
 * This line used to render nothing at all when the previous window held no
 * sessions, which is the state every household is in for their first fortnight
 * of logging: exactly when the report is the only history a trainer has. A
 * missing line and a flat line look identical, so "steady" was the reading on
 * offer for "there was nothing to compare against". Say which one it is.
 *
 * The wording names the window rather than claiming there is no earlier
 * practice at all — a seven-day view can have an empty week behind it and
 * months of work behind that.
 */
function trendNote(rate, priorRate, days) {
  if (rate === null) return null;
  if (priorRate === null) return `nothing logged the previous ${days} days`;
  if (rate - priorRate >= 0.03) return `up from ${pct(priorRate)} the previous ${days} days`;
  if (priorRate - rate >= 0.03) return `down from ${pct(priorRate)} the previous ${days} days`;
  return `steady against the previous ${days} days`;
}

function render() {
  const { sessions, incidents } = inRange(rangeDays);
  const prior = priorRange(rangeDays);
  // The trainer set the program; the report should say how far through it the
  // household actually is, in the same unit the handout uses.
  const prog = programProgress(PROGRAMS[0].id);
  const rate = successRate(sessions);
  const priorRate = successRate(prior);

  const trend = trendNote(rate, priorRate, rangeDays);

  // Every live activity gets a row, including the ones with nothing in this
  // window. Dropping them left three rows under a sentence that said "of 4",
  // and a trainer reading a list that disagrees with its own count reasonably
  // concludes something is being withheld. Something was: which activity had
  // been left alone for a fortnight, which is a thing worth asking about.
  const skills = LIVE_ACTIVITIES.map((activity) => {
    const mine = sessions.filter((s) => s.activityId === activity.id);
    if (!mine.length) {
      return html`<div class="mastery-row">
        <strong>${activity.title}</strong>
        <div class="under">
          <small>No sessions in the last ${rangeDays} days</small>
          ${badge(activityMastery(activity.id))}
        </div>
      </div>`;
    }
    const level = currentLevel(activity);
    const myRate = successRate(mine);
    return html`<div class="mastery-row">
      <strong>${activity.title}</strong>
      <div class="under">
        <small>
          Level ${level.number} · ${mine.length} session${mine.length === 1 ? '' : 's'}${
            myRate !== null ? ` · ${pct(myRate)} went well` : ''
          }
        </small>
        ${badge(activityMastery(activity.id))}
      </div>
    </div>`;
  });

  const jumped = watchCount(sessions, 'jumped');
  const nipped = watchCount(sessions, 'nipped');
  const barked = watchCount(sessions, 'barked');

  const notes = [
    ...sessions
      .filter((s) => s.note)
      .map((s) => ({
        at: s.startedAt,
        where: ACTIVITIES.find((a) => a.id === s.activityId)?.title || 'Practice',
        text: s.note,
      })),
    ...incidents
      .filter((i) => i.note)
      .map((i) => ({
        at: i.occurredAt,
        where:
          INCIDENT_CONTEXTS.find((c) => c.id === i.context)?.label || 'Real life',
        text: i.note,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const behaviorLine = [
    jumped ? `jumping in ${jumped}` : null,
    nipped ? `nipping in ${nipped}` : null,
    barked ? `barking in ${barked}` : null,
  ].filter(Boolean);

  const empty = !sessions.length && !incidents.length;

  return html`
    <div class="screen report">
      <div class="screen-head">
        <p class="eyebrow">For your next lesson</p>
        <h1>${DOG.name}’s report</h1>
        <p>Prepared for ${TRAINER.name} · everything below is from home practice.</p>
      </div>

      <div class="chips report-range" role="group" aria-label="Report range">
        ${join(
          RANGES.map(
            (r) => html`<button
              type="button"
              class="chip"
              data-range="${r.days}"
              aria-pressed="${String(r.days === rangeDays)}"
            >
              ${r.label}
            </button>`
          )
        )}
      </div>

      ${empty
        ? html`<div class="card" style="margin-top: var(--s-4)">
            <div class="empty">
              <h3>Nothing in this window</h3>
              <p>No sessions or moments in the last ${rangeDays} days. Try a longer range.</p>
            </div>
          </div>`
        : html`
            <section class="section">
              <div class="metric-grid">
                <div class="metric">
                  <b>${sessions.length}</b>
                  <span>${sessions.length === 1 ? 'Session' : 'Sessions'}</span>
                </div>
                <div class="metric">
                  <b>${pct(rate)}</b>
                  <span>Reps went well</span>
                  ${trend ? html`<small>${trend}</small>` : ''}
                </div>
              </div>
            </section>

            <section class="section">
              <h2>Where each skill stands</h2>
              ${/* live.length, not stages.length. Counting the parked ones in
                    the denominator told the trainer "0 of 4 activities
                    finished" for a program where three were never available,
                    which reads as a household that has barely started. */ ''}
              <p class="section-note" style="margin-bottom: var(--s-3)">
                ${prog.cleared} of ${prog.total} levels cleared across ${prog.program.title},
                ${prog.finished} of ${prog.live.length}
                ${prog.live.length === 1 ? 'activity' : 'activities'} finished.${prog.soon
                  ? ` The other ${prog.soon} ${
                      prog.soon === 1 ? 'activity is' : 'activities are'
                    } not in the app yet.`
                  : ''}
              </p>
              <div class="card">
                <div class="card-body">${join(skills)}</div>
              </div>
            </section>

            <section class="section">
              <h2>Worth discussing</h2>
              <div class="card">
                <div class="card-body">
                  <p>
                    ${behaviorLine.length
                      ? `Sessions with watch behaviours: ${behaviorLine.join(', ')}.`
                      : 'No jumping, nipping, or barking logged in practice.'}
                    ${incidents.length
                      ? ` ${incidents.length} unplanned real-life moment${
                          incidents.length === 1 ? '' : 's'
                        } logged.`
                      : ''}
                  </p>
                </div>
              </div>
            </section>

            ${notes.length
              ? html`<section class="section">
                  <h2>Notes we kept for you</h2>
                  <div class="card">
                    <div class="card-body">
                      ${join(
                        notes.map(
                          (note) => html`<div class="log-row">
                            <span class="when">${relativeDay(new Date(note.at))}</span>
                            <div class="log-body">
                              <strong>${note.where}</strong>
                              <p>“${note.text}”</p>
                            </div>
                          </div>`
                        )
                      )}
                    </div>
                  </div>
                </section>`
              : ''}
          `}

      <section class="section report-actions">
        <div class="btn-row">
          <button class="btn btn--quiet" type="button" data-share>Share</button>
          <button class="btn btn--quiet" type="button" data-csv>Download CSV</button>
        </div>
        <a class="btn btn--ghost btn--block" href="#/progress" style="margin-top: var(--s-2)">
          Back to progress
        </a>
      </section>
    </div>
  `;
}

export function downloadCsv() {
  const csv = exportSummary();
  // The BOM keeps Excel from mangling the curly quotes in notes.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${DOG.id}-training-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mount(root, params, options = {}) {
  root.querySelectorAll('[data-range]').forEach((chip) => {
    chip.addEventListener('click', () => {
      rangeDays = Number(chip.dataset.range);
      const app = document.getElementById('app');
      app.innerHTML = String(render());
      mount(app, params, { isRefresh: true });
      const fresh = app.querySelector(`[data-range="${rangeDays}"]`);
      if (fresh) fresh.focus({ preventScroll: true });
    });
  });

  const share = root.querySelector('[data-share]');
  if (share) {
    share.addEventListener('click', async () => {
      const text = composeShareText(rangeDays);
      if (navigator.share) {
        try {
          await navigator.share({ title: `${DOG.name} — training report`, text });
          return;
        } catch {
          /* cancelled, or unsupported payload — fall through to the clipboard */
        }
      }
      try {
        await navigator.clipboard.writeText(text);
        toast('Report copied. Paste it anywhere.');
      } catch {
        toast('Could not share on this device.');
      }
    });
  }

  const csv = root.querySelector('[data-csv]');
  if (csv) csv.addEventListener('click', downloadCsv);

  focusHeading(root, params, options);
}

export default { render, mount, tab: 'progress' };
