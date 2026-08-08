import { HANDLER, IMAGES, programById } from '../content.js';
import { requestQuickStart } from './player.js';
import { getState } from '../store.js';
import {
  suggestedActivity,
  headlineInsight,
  weekSummary,
  practiceByDay,
  currentStreak,
  masteryFor,
} from '../metrics.js';
// Today shows the strip, not the map. The map lives on the program screen one
// tap away, and rendering it here too made this screen 3.2 viewports tall to
// answer a question Today does not ask.
import { programProgress } from '../program.js';
import { programStrip } from '../programui.js';
import { html, raw, join, icon, badge, focusHeading } from '../ui.js';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function render() {
  const state = getState();
  const next = suggestedActivity();
  const { activity, level } = next;
  const cover = IMAGES[activity.coverImage];
  const program = programById(activity.programId);
  const week = weekSummary(0);
  const days = practiceByDay();
  const streak = currentStreak();
  const mastery = masteryFor(activity.id, level.number);
  const prog = programProgress(program.id);
  const stage = prog.stages.find((s) => s.activity.id === activity.id);

  // Accelerator for the practiced household: skip the get-ready checklist and
  // land on step one. It used to be a card of its own pointing at the last
  // session's activity, which was both a second route to the same place the
  // hero already offers and, once activities could be parked, a link into an
  // activity that is no longer openable. It hangs off the hero now.
  const practiced = state.sessions.some((s) => s.activityId === activity.id);

  const dots = days.map((d, i) =>
    raw(`<i class="${d.count ? 'on' : ''}${i === days.length - 1 ? ' today' : ''}"></i>`)
  );

  return html`
    <div class="screen">
      ${/* The count that used to live here is the same fact the week card
            states below, and the insight above that stated it a third time.
            The greeting is a greeting; the nudge stays only while there is
            nothing else on the screen to act on. */ ''}
      <div class="today-head">
        <div>
          <h1>${greeting()}, ${HANDLER.name}</h1>
          ${week.count ? '' : html`<p>The first session takes about five minutes</p>`}
        </div>
      </div>

      ${/* Above the hero on purpose. It used to sit under it, which put it
            past 537px of illustration and card — off the bottom of the screen
            on open. "How far through are we" is the question the household
            arrives with, and it should not cost a scroll or a tap. */ ''}
      <section class="section section--tight">
        <h2 class="visually-hidden">Your program</h2>
        ${programStrip(prog, { stage })}
      </section>

      <section class="hero" aria-labelledby="today-next">
        <img src="${cover.src}" alt="${cover.alt}" />
        <div class="hero-body">
          <p class="eyebrow">Today’s homework</p>
          <h2 id="today-next">${activity.title}</h2>
          <p>${level.setup}</p>
          <div class="meta">
            ${badge(mastery)}
            <span>Level ${level.number} of ${activity.levels.length}</span>
            <span>${activity.estimatedMinutes} min</span>
          </div>
          <a class="btn btn--lg btn--block" href="#/play/${activity.slug}">Start session</a>
          ${practiced
            ? html`<button class="hero-skip" type="button" data-quick="${activity.slug}">
                Skip the setup, straight to the steps
              </button>`
            : ''}
        </div>
      </section>

      ${/* One card for the week, not two. The insight sentence and the streak
            card were separate blocks reporting the same seven days: "5 sessions
            this week. Goal met." sat directly above "5 of 5 sessions this week".
            The sentence is the reading, the counts and dots are the evidence
            for it, so they belong in one place. */ ''}
      ${state.sessions.length
        ? html`<section class="section">
            <h2 class="visually-hidden">This week</h2>
            <div class="card week-card">
              <div class="insight">${icon('spark')}<p>${headlineInsight()}</p></div>
              <div class="week-row">
                <span>
                  ${week.count} of ${state.weeklyGoal} sessions${streak
                    ? ` · ${streak} day${streak === 1 ? '' : 's'} in a row`
                    : ''}
                </span>
                <span
                  class="week-dots"
                  role="img"
                  aria-label="Practice on ${days.filter((d) => d.count).length} of the last 7 days"
                >
                  ${join(dots)}
                </span>
              </div>
            </div>
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

      ${/* A heading and a paragraph to explain one button was more scaffolding
            than the action needed. The row says what it is and what it is for
            in the space the button alone used to take. */ ''}
      <button class="quick-row" type="button" data-route="#/moment">
        <span>
          <strong>Record a moment</strong>
          <small>A real arrival, or a walk you did not plan for. It counts.</small>
        </span>
        ${icon('plus')}
      </button>

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

  focusHeading(root);
}

export default { render, mount, tab: 'today' };
