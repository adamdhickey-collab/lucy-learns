import { GOALS, ACTIVITIES, IMAGES } from '../content.js';
import {
  activityMastery,
  relativeDay,
  lastPracticed,
  currentLevel,
} from '../progress.js';
import { html, join, badge, difficultyDots, focusHeading } from '../ui.js';

function activityCard(activity) {
  const img = IMAGES[activity.coverImage];
  const level = currentLevel(activity);
  return html`<li>
    <a class="activity-card" href="#/activity/${activity.slug}">
      <img src="${img.src}" alt="" loading="lazy" />
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
      </div>
    </a>
  </li>`;
}

function render() {
  const groups = GOALS.map((goal) => {
    const items = ACTIVITIES.filter((a) => a.goalId === goal.id);
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
      ${body}
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
