import { IMAGES, programById } from '../content.js';
import { requestQuickStart } from './player.js';
import { getState, getPerson } from '../store.js';
import {
  suggestedActivity,
  headlineInsight,
  weekSummary,
  practiceByDay,
  currentStreak,
  masteryFor,
  currentLevel,
} from '../metrics.js';
// Today shows the strip, not the map. The map lives on the program screen one
// tap away, and rendering it here too made this screen 3.2 viewports tall to
// answer a question Today does not ask.
import { programProgress } from '../program.js';
import { programStrip } from '../programui.js';
import { openPersonSwitcher } from '../person.js';
import {
  html,
  raw,
  join,
  icon,
  badge,
  personPortrait,
  firstNameOf,
  focusHeading,
} from '../ui.js';

// One greeting, at any hour. The three time-of-day variants were a clock
// reading dressed up as warmth: they changed the heading three times a day
// without ever telling the household anything, and "Good evening" landed on
// someone practicing at 5:01pm as if the app had opinions about their
// schedule. "Hello" is right whenever the app is opened.
const greeting = () => 'Hello';

const nameLength = (name) => {
  if (name.length > 13) return 'very-long';
  if (name.length > 8) return 'long';
  return 'short';
};

function render() {
  const state = getState();
  const person = getPerson();
  const insight = headlineInsight();
  // suggestedActivity() scores every open activity by the mastery of its
  // current level. That is a sensible ranking on its own, but the strip
  // directly above the hero draws the program's own `focus` — finish what is
  // underway before opening more — and the two disagreed as soon as more than
  // one activity had been practiced. The demo showed it plainly: the strip had
  // Sound finished with a check and Stay ringed as next, while the card below
  // it said to practice Sound. One screen, two answers to "what now".
  //
  // The strip wins, because it is the one that shows its reasoning. The
  // ranking still decides when the program's focus is finished or when the
  // activity belongs to no program.
  const suggestion = suggestedActivity();
  const focusProg = programProgress(suggestion.activity.programId);
  const focusActivity =
    focusProg && !focusProg.complete ? focusProg.focus.activity : suggestion.activity;
  const next =
    focusActivity.id === suggestion.activity.id
      ? suggestion
      : { activity: focusActivity, level: currentLevel(focusActivity) };
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
      ${/* The corner the person switcher used to occupy. Initials rather than
            a photo: there is no upload anywhere in the app, so a generic
            silhouette would be a permanent placeholder for something that
            never arrives. It links to the Lucy tab, which is where the profile
            and settings already live, so it goes somewhere rather than being
            decoration. */ ''}
      <div class="today-head">
        <div>
          ${/* Measured, not guessed at with a media query: the thing that
                overflows here is the name, and the viewport knows nothing
                about it. Nine and fourteen are where "Hello, {name}" starts
                to crowd the avatar at each size on a 375px screen. */ ''}
          <h1 data-name-length="${nameLength(firstNameOf(person.name))}">
            ${greeting()}, ${firstNameOf(person.name)}
          </h1>
          ${week.count ? '' : html`<p>The first session takes about five minutes</p>`}
        </div>
        ${/* A button now, not a link to the profile.
              It pointed at the profile back when the profile was the only
              place a person appeared and the tab was named after the dog.
              There is a Profile tab in the bar now, two taps' worth of screen
              away, so the avatar was a shortcut to somewhere already on
              screen. What it is good for is the thing it actually depicts:
              who the app currently thinks is holding it. */ ''}
        <button
          class="avatar"
          type="button"
          data-person-switch
          aria-label="Practicing as ${person.name}. Change who is practicing."
        >
          ${personPortrait(person, 'avatar')}
        </button>
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
          ${/* The activity's own mark, named. The strip above shows the four
                marks without labels so it stays a summary rather than a
                board, which leaves nothing on this screen to say which mark
                is which. Naming it here teaches the row directly above it and
                gives the activity a face of its own. */ ''}
          <p class="eyebrow eyebrow--marked">
            <span class="eyebrow-mark">${icon(activity.icon)}</span>
            Today’s homework · ${activity.shortTitle}
          </p>
          <h2 id="today-next">${activity.title}</h2>
          <p>${level.setup}</p>
          <div class="meta">
            ${badge(mastery)}
            ${/* Not "Level 1 of 5". This sits directly under a card headed
                  "Activity 1 of 4" and directly beside "5 min", so the of-5
                  put a third counted series between two others and two
                  different fives side by side. How many levels the activity
                  has belongs on the activity screen, where the list shows it
                  without being counted at. */ ''}
            <span>Level ${level.number}</span>
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
              <div class="insight insight--${insight.tone}">${icon('spark')}<p>${insight.text}</p></div>
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

      ${/* The report's second door, and the first one on the screen anybody
            actually opens the app to. It used to live only at the foot of
            Progress, which meant the answer to "my lesson is tomorrow, what
            do I bring" was two screens and a long scroll away — readers sent
            to find it went to Start session and Record a moment instead.

            Only once something has been logged. Before that the report is a
            page explaining it has nothing to show, and offering it on the
            first run would be the app advertising its own emptiness. */ ''}
      ${state.sessions.length
        ? html`<button class="quick-row" type="button" data-route="#/report">
            <span>
              <strong>Summary for your trainer</strong>
              <small>Everything from the last two weeks, ready to hand over.</small>
            </span>
            ${icon('book')}
          </button>`
        : ''}

    </div>
  `;
}

/**
 * Point the caret at the middle of the active segment.
 *
 * The fraction the strip is rendered with is a fraction of the *track*, but
 * the caret is positioned against the *card*, which is wider by its padding
 * and the arrow column. Applying one as the other put the caret 8px out —
 * between two segments on a 375px screen, which is exactly the ambiguity the
 * caret exists to remove. Measured after paint and written back in pixels.
 */
function alignCaret(root) {
  const strip = root.querySelector('.program-strip--points');
  // The live mark, whichever state put it there. This used to look for
  // .track-seg--active, which stopped existing when the four proportional
  // segments became the same row of marks the welcome draws — and a missing
  // element here fails silently, leaving the caret on its unmeasured
  // percentage rather than throwing.
  const active = root.querySelector('.route-stop--active, .route-stop--next');
  if (!strip || !active) return;
  const card = strip.getBoundingClientRect();
  const seg = active.getBoundingClientRect();
  if (!card.width || !seg.width) return;
  strip.style.setProperty('--caret-x', `${Math.round(seg.left + seg.width / 2 - card.left)}px`);
}

function mount(root) {
  const switcher = root.querySelector('[data-person-switch]');
  if (switcher) switcher.addEventListener('click', openPersonSwitcher);

  alignCaret(root);
  // Layout can settle after first paint — a font swapping in, an image landing
  // and reflowing the row. Measure once more on the next frame.
  requestAnimationFrame(() => alignCaret(root));

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
