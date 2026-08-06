import { DOG, MEMBERS, IMAGES, ACTIVITIES, activityById, programById } from '../content.js';
import { requestQuickStart } from './player.js';
import { getState, activeMember, setActiveMember } from '../store.js';
import {
  currentLevel,
  suggestedActivity,
  headlineInsight,
  weekSummary,
  practiceByDay,
  currentStreak,
  relativeDay,
  lastPracticed,
  masteryFor,
  activityMastery,
} from '../metrics.js';
import { html, raw, join, icon, badge, focusHeading, refreshApp } from '../ui.js';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function render() {
  const state = getState();
  const me = activeMember();
  const next = suggestedActivity();
  const { activity, level } = next;
  const cover = IMAGES[activity.coverImage];
  const program = programById(activity.programId);
  const week = weekSummary(0);
  const days = practiceByDay();
  const streak = currentStreak();
  const mastery = masteryFor(activity.id, level.number);
  const inProgram = ACTIVITIES.filter((a) => a.programId === program.id);

  // Accelerator for the practiced household: once an activity has history,
  // offer a path straight into the steps that skips the get-ready checklist.
  const lastSession = state.sessions[0];
  const lastActivity = lastSession && activityById(lastSession.activityId);
  const quickLevel = lastActivity && currentLevel(lastActivity);

  const who = MEMBERS.map(
    (m) => html`<button type="button" data-member="${m.id}"
      aria-pressed="${String(m.id === me.id)}">${m.name}</button>`
  );

  const dots = days.map((d, i) =>
    raw(`<i class="${d.count ? 'on' : ''}${i === days.length - 1 ? ' today' : ''}"></i>`)
  );

  const cards = inProgram.map((a) => {
    const img = IMAGES[a.coverImage];
    const last = lastPracticed(a.id);
    return html`<li>
      <a class="activity-card" href="#/activity/${a.slug}">
        <img
          src="${img.thumb}"
          alt=""
          loading="lazy"
          style="view-transition-name: card-${a.id}"
        />
        <div class="body">
          <h3>${a.title}</h3>
          <p>${a.shortPurpose}</p>
          <div class="meta">
            ${badge(activityMastery(a.id))}
            ${last ? html`<span>${relativeDay(last)}</span>` : ''}
          </div>
        </div>
      </a>
    </li>`;
  });

  return html`
    <div class="screen">
      <div class="today-head">
        <div>
          <h1>${greeting()}, ${me.name}</h1>
          <p>
            ${DOG.name} has practiced ${week.count}
            ${week.count === 1 ? 'time' : 'times'} this week
          </p>
        </div>
        <div class="who-field">
          <span class="who-label" id="who-label">Practicing</span>
          <div class="who" role="group" aria-labelledby="who-label">${join(who)}</div>
        </div>
      </div>

      <section class="hero" aria-labelledby="today-next">
        <img src="${cover.src}" alt="${cover.alt}" />
        <div class="hero-body">
          <p class="eyebrow">Practice next</p>
          <h2 id="today-next">${activity.title}</h2>
          <p>${level.setup}</p>
          <div class="meta">
            ${badge(mastery)}
            <span>Level ${level.number} of ${activity.levels.length}</span>
            <span>${activity.estimatedMinutes} min</span>
          </div>
          <a class="btn btn--lg btn--block" href="#/play/${activity.slug}">Start session</a>
        </div>
      </section>

      ${lastActivity
        ? html`<button class="quick-row" type="button" data-quick="${lastActivity.slug}">
            <span>
              <strong>Jump back in</strong>
              <small>
                ${lastActivity.title} · Level ${quickLevel.number}, straight to the steps
              </small>
            </span>
            ${icon('arrow')}
          </button>`
        : ''}

      ${state.sessions.length
        ? html`<section class="section">
            <div class="insight">${icon('spark')}<p>${headlineInsight()}</p></div>
          </section>`
        : html`<section class="section">
            <div class="insight insight--start">
              ${icon('spark')}
              <p>
                Nothing logged yet. Run the session above and it takes about five minutes.
                Everything else here fills in on its own.
              </p>
            </div>
          </section>`}

      <section class="section">
        <div class="card streak-card">
          <div>
            <h3>${week.count} of ${state.weeklyGoal} sessions this week</h3>
            <p>
              ${streak
                ? `${streak} day${streak === 1 ? '' : 's'} in a row`
                : 'No streak going right now'}
            </p>
          </div>
          <div
            class="week-dots"
            role="img"
            aria-label="Practice on ${days.filter((d) => d.count).length} of the last 7 days"
          >
            ${join(dots)}
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Did something happen?</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          Log a real arrival or a walk you did not plan for. It counts.
        </p>
        <button class="btn btn--quiet btn--block" type="button" data-route="#/moment">
          ${icon('plus')} Record a moment
        </button>
      </section>

      <section class="section">
        <h2>${program.title}</h2>
        <p class="section-note">${program.blurb}</p>
        <ul class="activity-list" style="margin-top: var(--s-3)">${join(cards)}</ul>
      </section>
    </div>
  `;
}

function mount(root) {
  const quick = root.querySelector('[data-quick]');
  if (quick) {
    quick.addEventListener('click', () => {
      requestQuickStart();
      location.hash = `#/play/${quick.dataset.quick}`;
    });
  }

  root.querySelectorAll('[data-member]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveMember(btn.dataset.member);
      refreshApp();
    });
  });
  focusHeading(root);
}

export default { render, mount, tab: 'today' };
