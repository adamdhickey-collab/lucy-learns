import { GOALS, ACTIVITIES, LIVE_ACTIVITIES, IMAGES, PROGRAMS, TRAINER } from '../content.js';
import {
  activityMastery,
  relativeDay,
  lastPracticed,
  currentLevel,
} from '../metrics.js';
import { programProgress, stageFor } from '../program.js';
import { programStrip, levelPips } from '../programui.js';
import { html, join, badge, difficultyDots, focusHeading } from '../ui.js';

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
        <h3>${activity.title}</h3>
        <p>${activity.shortPurpose}</p>
        <div class="meta">
          ${badge(activityMastery(activity.id))}
          <span>Level ${level.number}</span>
          <span>${activity.estimatedMinutes} min</span>
          ${difficultyDots(activity.difficulty)}
        </div>
        <div class="meta">
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

function render() {
  const groups = GOALS.map((goal) => {
    const items = LIVE_ACTIVITIES.filter((a) => a.goalId === goal.id);
    // Parked activities are named rather than listed, so the library says what
    // is still to come without offering a card that cannot be opened.
    const soon = ACTIVITIES.filter((a) => a.goalId === goal.id && a.available === false);
    // A goal backed by a program is not a folder of four things, it is a route
    // with a finish line. Say so before listing the four.
    const program = PROGRAMS.find((p) => p.goalId === goal.id);

    const body = items.length
      ? html`<ul class="activity-list">${join(items.map(activityCard))}</ul>`
      : html`<div class="planned">
          <p>Nothing here yet. These land as handouts arrive from The Canine Coach.</p>
          <ul>${join((goal.planned || []).map((p) => html`<li>${p}</li>`))}</ul>
        </div>`;

    return html`<section class="goal-group">
      <header>
        <h2>${goal.title}</h2>
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
