import {
  GOALS,
  ACTIVITIES,
  LIVE_ACTIVITIES,
  PLANNED_ACTIVITIES,
  IMAGES,
  PROGRAMS,
  TRAINER,
} from '../content.js';
import {
  activityMastery,
  relativeDay,
  lastPracticed,
  currentLevel,
} from '../metrics.js';
import { programProgress, stageFor } from '../program.js';
import { programStrip, levelPips } from '../programui.js';
import { html, join, badge, icon, difficultyDots, focusHeading } from '../ui.js';

function activityCard(activity) {
  const img = IMAGES[activity.coverImage];
  const level = currentLevel(activity);
  // The card carries its own standing in the program, so the library and the
  // map never disagree about how far along something is.
  const { stage } = stageFor(activity);
  return html`<li>
    <a class="activity-card" href="#/activity/${activity.slug}">
      <img
        src="${img.thumb}"
        alt=""
        loading="lazy"
        style="view-transition-name: card-${activity.id}"
      />
      <div class="body">
        ${/* The same mark and one-word name the program strip uses, and Today's
              hero above it. Three places name each activity — the strip, the
              homework card, and this library — and only two of them agreed.
              Someone who has learned the row of marks arrives here and has to
              re-identify all four by full title and thumbnail, which is a
              second naming system for the same things. Carrying the pair
              through costs one line and makes the strip and the card
              obviously the same object. */ ''}
        <p class="eyebrow eyebrow--marked activity-card-mark">
          <span class="eyebrow-mark">${icon(activity.icon)}</span>
          ${activity.shortTitle}
        </p>
        <h3>${activity.title}</h3>
        <p>${activity.shortPurpose}</p>
        <div class="meta">
          ${badge(activityMastery(activity.id))}
          <span>Level ${level.number}</span>
          <span>${activity.estimatedMinutes} min</span>
        </div>
        ${/* Difficulty leads the second row rather than trailing the first.
              The interpunct rule is `.meta > *:not(:first-child)::before`,
              which is right until the row wraps — the item that lands at the
              start of the wrapped line keeps its separator, and four items
              wrapped on every phone width. What that produced was a dot and a
              space before the pips, reading as an indent against everything
              above it. As the first child of its own row it gets no
              separator and sits flush. */ ''}
        <div class="meta">
          ${difficultyDots(activity.difficulty)}
          <span>${relativeDay(lastPracticed(activity.id))}</span>
        </div>
        <div class="card-progress">
          ${levelPips(stage)}
          <span class="stage-count">
            ${stage.complete ? 'All levels cleared' : `${stage.cleared} of ${stage.total} cleared`}
          </span>
        </div>
      </div>
    </a>
  </li>`;
}

/**
 * A program that is named but not written yet. Not a link, and it says so in
 * words as well as in styling: a card that looks tappable and is not is worse
 * than no card.
 */
function plannedCard(activity) {
  const img = IMAGES[activity.coverImage];
  return html`<li>
    <div class="activity-card activity-card--planned">
      ${/* Its own picture, in the same 84px square a real activity card uses.
            This was a clock once — the same clock four times, which said
            "later" and nothing about which one this is — and then the
            activity's own icon, which fixed that. The picture fixes it better,
            and it is the reason these four illustrations exist: `coverImage`
            has been on PLANNED_ACTIVITIES since the beginning and nothing has
            ever rendered it, so the art sat in the bundle unreachable while
            the card drew a line-art mark instead.

            The card still cannot be mistaken for a live one: it is a <div>
            rather than an <a>, the border is dashed, the background is
            transparent, it carries "Not written yet", and the thumb itself is
            dimmed and desaturated so it reads as a plan rather than a
            destination. */ ''}
      <img class="planned-thumb" src="${img.thumb}" alt="" loading="lazy" />
      <div class="body">
        <h3>${activity.title}</h3>
        <p>${activity.shortPurpose}</p>
        <div class="meta">
          <span class="planned-tag">Not written yet</span>
        </div>
        <p class="planned-note">${activity.note}</p>
      </div>
    </div>
  </li>`;
}

function render() {
  const groups = GOALS.map((goal) => {
    const items = LIVE_ACTIVITIES.filter((a) => a.goalId === goal.id);
    // Parked activities are named rather than listed, so the library says what
    // is still to come without offering a card that cannot be opened.
    const soon = ACTIVITIES.filter((a) => a.goalId === goal.id && a.available === false);
    // A goal backed by a program is not a folder of four things, it is a route
    // with a finish line. Say so before listing the four.
    const program = PROGRAMS.find((p) => p.goalId === goal.id);

    // Named but not built. A card so the shape of the library is visible, and
    // a <div> rather than an <a> so there is nothing to tap and be disappointed
    // by. Previously a bare bullet list of titles.
    const planned = PLANNED_ACTIVITIES.filter((a) => a.goalId === goal.id);

    const body = items.length
      ? html`<ul class="activity-list">${join(items.map(activityCard))}</ul>`
      : planned.length
        ? html`<ul class="activity-list">${join(planned.map(plannedCard))}</ul>`
        // Neither built nor named yet. A heading over nothing reads as broken,
        // so the goal says plainly that it is a goal and not a gap.
        : html`<p class="goal-empty">
            Nothing here yet. This one arrives with a later handout from
            ${TRAINER.name}.
          </p>`;

    return html`<section class="goal-group">
      <header>
        <h2 class="goal-title">
          <span class="goal-mark" aria-hidden="true">${icon(goal.icon)}</span>
          ${goal.title}
        </h2>
        <p>${goal.blurb}</p>
      </header>
      ${program
        ? html`<div style="margin-bottom: var(--s-4)">
            ${programStrip(programProgress(program.id))}
          </div>`
        : ''}
      ${body}
      ${items.length && soon.length
        ? html`<div class="planned" style="margin-top: var(--s-3)">
            <p>Still to come from ${TRAINER.name}.</p>
            <ul>${join(soon.map((a) => html`<li>${a.title}</li>`))}</ul>
          </div>`
        : ''}
    </section>`;
  });

  return html`
    <div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Library</p>
        <h1>Activities</h1>
        <p>Grouped by what you are trying to change, not alphabetically.</p>
      </div>
      ${join(groups)}
    </div>
  `;
}

export default { render, mount: focusHeading, tab: 'activities' };
