import { ACTIVITIES, BEHAVIORS, INCIDENT_CONTEXTS, INCIDENT_RESPONSES } from '../content.js';
import { getState } from '../store.js';
import {
  weekSummary,
  practiceByDay,
  headlineInsight,
  activityMastery,
  currentLevel,
  successRate,
  sessionsAt,
  relativeDay,
} from '../progress.js';
import { html, join, badge, icon, pct, mmss, focusHeading } from '../ui.js';

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

function render() {
  const state = getState();
  const week = weekSummary(0);
  const prior = weekSummary(1);
  const days = practiceByDay();
  const max = Math.max(1, ...days.map((d) => d.count));

  const bars = days.map(
    (d) => html`<div class="bar ${d.count ? '' : 'bar--empty'}">
      <div class="track">
        <i style="height: ${Math.max((d.count / max) * 100, 5)}%"></i>
      </div>
      <span>${d.label}</span>
    </div>`
  );

  const mastery = ACTIVITIES.map((activity) => {
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
        <div>
          <strong>${activity ? activity.title : 'Session'}</strong>
          <p>
            Level ${s.levelNumber} · ${s.successfulRepetitions}/${s.repetitions} went well ·
            ${s.completedByUserId === 'adam' ? 'Adam' : 'Fabiola'}
          </p>
          ${tags.length ? html`<div class="tag-line">${join(tags)}</div>` : ''}
          ${s.note ? html`<p>“${s.note}”</p>` : ''}
        </div>
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
      <div>
        <strong>${context ? context.label : 'Moment'}</strong>
        <p>Real life · not a practice session</p>
        ${tags.length ? html`<div class="tag-line">${join(tags)}</div>` : ''}
        ${i.note ? html`<p>“${i.note}”</p>` : ''}
      </div>
    </div>`;
  });

  const empty = !state.sessions.length && !state.incidents.length;

  return html`
    <div class="screen screen--fab">
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
          </div>`
        : html`
            <div class="insight">${icon('spark')}<p>${headlineInsight()}</p></div>

            <section class="section">
              <div class="metric-grid">
                ${metric(
                  week.count,
                  week.count === 1 ? 'Session' : 'Sessions',
                  prior.count ? `${prior.count} last week` : ''
                )}
                ${metric(
                  pct(week.calmRate),
                  'Stayed calm',
                  prior.calmRate !== null ? `${pct(prior.calmRate)} last week` : ''
                )}
                ${metric(week.jumps, 'Jumping', `of ${week.count} sessions`)}
                ${metric(
                  mmss(week.avgRecovery),
                  'Average recovery',
                  prior.avgRecovery ? `${mmss(prior.avgRecovery)} last week` : ''
                )}
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
              <h2>Where each skill stands</h2>
              <div class="card">
                <div class="card-body">${join(mastery)}</div>
              </div>
              <p class="section-note">
                Reliable needs 90% success across three sessions, on two different days, with both
                of you.
              </p>
            </section>

            <section class="section">
              <h2>Recent activity</h2>
              <div class="card">
                <div class="card-body">${join(log)}</div>
              </div>
            </section>

            <section class="section">
              <a class="btn btn--quiet btn--block" href="#/lucy">Export a summary for the trainer</a>
            </section>
          `}
    </div>

    <button class="fab" type="button" data-route="#/moment">${icon('plus')} Record moment</button>
  `;
}

export default { render, mount: focusHeading, tab: 'progress' };
