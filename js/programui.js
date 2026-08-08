// Shared markup for the program arc.
//
// Three pieces, reused by Today, the Activities library, Progress, and the
// program screen itself, so the household sees the same map wherever they meet
// it and does not have to re-learn the shape.

import { DOG, IMAGES } from './content.js';
import { STAGE, programPitch, setupDone } from './program.js';
import { getState } from './store.js';
import { html, join, raw, icon, esc } from './ui.js';

/**
 * One pip per level. Shape first, then color: a cleared level is a filled
 * square, the live one is an outlined square with a dot, the rest are empty.
 * Readable in greyscale and by anyone who cannot separate teal from grey.
 */
export function levelPips(stage) {
  // The half-filled pip is the level they are on, not the next uncleared one:
  // it has to agree with the level picker on the activity screen.
  const live = stage.working.number;
  const pips = stage.levels.map((l) => {
    if (l.cleared) return '<i class="on"></i>';
    if (l.level.number === live && stage.started) return '<i class="live"></i>';
    return '<i></i>';
  });
  return raw(
    `<span class="pips-row" role="img" aria-label="${esc(
      `${stage.cleared} of ${stage.total} levels cleared`
    )}">${pips.join('')}</span>`
  );
}

/**
 * Count, bar, and the one sentence about what is left.
 *
 * `heading` exists because on the program screen this block *is* the page
 * title, and a screen with no h1 is a screen a screen reader cannot summarise.
 */
export function programHeader(prog, { eyebrow = 'Your program', heading = 'h2' } = {}) {
  const percent = Math.round(prog.ratio * 100);

  // Nothing cleared yet is a real state, but a giant 0 above an empty bar is a
  // scoreboard telling someone they are losing a game they have not started.
  // Before the first session the header states the size of the job instead. The
  // number is not faked to look like momentum: it is simply not the point yet.
  if (!prog.cleared) {
    return html`
      <div class="program-head program-head--fresh">
        <p class="eyebrow">${eyebrow}</p>
        ${raw(`<${heading}>${esc(prog.program.title)}</${heading}>`)}
        <p class="program-pitch">${programPitch(prog)}</p>
      </div>
    `;
  }

  return html`
    <div class="program-head">
      <p class="eyebrow">${eyebrow}</p>
      ${raw(`<${heading}>${esc(prog.program.title)}</${heading}>`)}
      <div class="program-tally">
        <b>${prog.cleared}</b>
        <span>of ${prog.total} levels cleared</span>
      </div>
      <div
        class="meter"
        role="img"
        aria-label="${prog.cleared} of ${prog.total} levels cleared, ${percent} percent"
      >
        <span style="width: ${Math.max(percent, 4)}%"></span>
      </div>
      <p class="program-pitch">${programPitch(prog)}</p>
    </div>
  `;
}

const STATE_LABEL = {
  [STAGE.complete]: 'Finished',
  [STAGE.active]: 'In progress',
  [STAGE.open]: 'Ready to start',
  [STAGE.ahead]: 'Comes later',
  [STAGE.soon]: 'Coming soon',
};

function stageNote(stage) {
  if (stage.state === STAGE.soon) {
    return `${stage.total} levels, not in the app yet`;
  }
  if (stage.state === STAGE.complete) return 'All levels cleared';
  if (stage.state === STAGE.active) {
    const left = stage.remaining;
    return `Level ${stage.working.number} now, ${left} ${left === 1 ? 'level' : 'levels'} left`;
  }
  if (stage.state === STAGE.ahead && stage.after) {
    return `Builds on ${stage.after.title}`;
  }
  return `${stage.total} levels, about ${stage.activity.estimatedMinutes} minutes each`;
}

/**
 * The road does not start at nothing.
 *
 * Opening on a finished node rather than an empty circle is the whole point,
 * but it has to be earned. An earlier version of this claimed the household had
 * "saved 7 cue words" on a fresh install, when those cues ship as defaults in
 * content.js and nobody had touched them. That is exactly the faked-progress
 * pattern this app cannot afford: its only real asset is that its numbers are
 * true. So the node now states what is actually true — the cues are ready, and
 * they are yours to change. Nothing is credited as a level either way, so the
 * count the trainer reads stays untouched.
 */
function setupNode() {
  if (!setupDone()) return '';
  const cues = getState().commands.length;
  return html`<li class="stage stage--complete stage--setup">
    <div>
      <span class="stage-rail" aria-hidden="true">
        <span class="stage-node">${icon('check')}</span>
      </span>
      <span class="stage-body">
        <span class="stage-state">Ready</span>
        <span class="stage-top"><strong>Before you start</strong></span>
        <span class="stage-purpose">
          ${cues} cue words are set and ready to use. Change any of the wording on the
          ${DOG.name} tab and every activity updates.
        </span>
      </span>
    </div>
  </li>`;
}

/**
 * The map. An ordered, connected list rather than four equal cards, because
 * the whole point is that they are not equal and not interchangeable.
 *
 * A stage marked "Comes later" is still a link, because the trainer outranks
 * the app. A stage marked "Coming soon" is not, because there is genuinely
 * nothing behind it yet — it renders as plain text rather than a dead link.
 */
export function stageList(prog, { currentActivityId = null, showThumbs = true } = {}) {
  const rows = prog.stages.map((stage) => {
    const img = IMAGES[stage.activity.coverImage];
    const isFocus = stage.activity.id === prog.focus.activity.id;
    const here = stage.activity.id === currentActivityId;
    const soon = stage.state === STAGE.soon;

    const body = html`
      <span class="stage-rail" aria-hidden="true">
        <span class="stage-node">
          ${stage.state === STAGE.complete ? icon('check') : raw(String(stage.number))}
        </span>
      </span>
      <span class="stage-body">
        <span class="stage-state">${STATE_LABEL[stage.state]}</span>
        <span class="stage-top">
          <strong>${stage.activity.title}</strong>
          ${showThumbs
            ? html`<img class="stage-thumb" src="${img.thumb}" alt="" loading="lazy" />`
            : ''}
        </span>
        <span class="stage-purpose">${stage.activity.shortPurpose}</span>
        ${soon ? '' : html`<span class="stage-meter">
          ${levelPips(stage)}
          <span class="stage-count" aria-hidden="true">${stage.cleared}/${stage.total}</span>
        </span>`}
        <span class="stage-note">${stageNote(stage)}</span>
      </span>`;

    return html`<li
      class="stage stage--${stage.state}${isFocus && !here ? ' stage--focus' : ''}${
        here ? ' stage--here' : ''
      }"
    >
      ${soon
        ? html`<div>${body}</div>`
        : html`<a href="#/activity/${stage.activity.slug}" ${here ? 'aria-current="true"' : ''}>
            ${body}
          </a>`}
    </li>`;
  });

  return html`<ol class="stage-list">
    ${setupNode()}
    ${join(rows)}
    ${outcomeNode(prog)}
  </ol>`;
}

/** The castle at the end of the map. */
function outcomeNode(prog) {
  const outcome = prog.program.outcome;
  if (!outcome) return '';
  return html`<li class="stage stage--outcome ${prog.complete ? 'stage--outcome-won' : ''}">
    <div>
      <span class="stage-rail" aria-hidden="true">
        <span class="stage-node">${icon('spark')}</span>
      </span>
      <span class="stage-body">
        <span class="stage-state">${outcome.eyebrow}</span>
        <span class="stage-top"><strong>${outcome.title}</strong></span>
        <span class="stage-purpose">${outcome.body}</span>
        <span class="stage-note">
          ${prog.complete
            ? 'You got here. Keep running the levels to hold it.'
            : `${prog.total - prog.cleared} levels between here and there`}
        </span>
      </span>
    </div>
  </li>`;
}

/**
 * One dot per level, grouped by activity, for the whole program at once.
 *
 * This was one dot per activity, which on a program with three of its four
 * parked read as a row of things not available rather than as ground covered.
 * Levels are what the household actually moves, so those are what it counts.
 * The grouping keeps the four activities legible inside it, and the wider gap
 * between groups is the only thing carrying that — no labels needed at 6px.
 *
 * State is shape as well as fill: cleared is solid, the level in hand is
 * ringed, ahead is hollow, and levels inside an activity that is not in the
 * app yet are dashed, matching the map. Twenty-three dots is 216px, which
 * fits the strip on the narrowest phone this ships to.
 */
function levelDots(prog, currentActivityIndex) {
  const groups = prog.stages.map((stage) => {
    const dots = stage.levels.map((l) => {
      // The level in hand, ringed whether or not it is cleared. Gating this on
      // "not yet cleared" meant that the moment you cleared the level you were
      // on, the row stopped saying where you were at all — which is most of
      // the time, since clearing a level is not the same as leaving it.
      const here =
        stage.index === currentActivityIndex &&
        stage.state !== STAGE.soon &&
        l.level.number === stage.working.number;
      const state = stage.state === STAGE.soon ? 'soon' : l.cleared ? 'done' : 'ahead';
      return `<i class="dot dot--${state}${here ? ' dot--here' : ''}"></i>`;
    });
    return `<span class="level-group">${dots.join('')}</span>`;
  });

  return raw(
    `<span class="level-dots" role="img" aria-label="${esc(
      `${prog.cleared} of ${prog.total} levels cleared, across ${prog.stages.length} activities`
    )}">${groups.join('')}</span>`
  );
}

/**
 * The compact form. Program name, position, progress, and the one sentence
 * about what is left, in a single tap target.
 *
 * Pass `stage` to add "Activity N of M" — that is what Today needs, and giving
 * the strip that job removed a second, smaller link to this same destination
 * that had been sitting directly above Today's primary button.
 */
export function programStrip(prog, { stage = null } = {}) {
  // Same rule as programHeader: before the first session there is no score to
  // show, so the count comes off rather than reporting 0. The dots stay —
  // an empty row of them is the shape of the job, not a zero.
  const started = prog.cleared > 0;
  return html`<a class="program-strip" href="#/program/${prog.program.id}">
    <span class="program-strip-body">
      ${stage
        ? html`<span class="program-strip-where">
            Activity ${stage.number} of ${prog.stages.length}
          </span>`
        : ''}
      <span class="program-strip-top">
        <strong>${prog.program.title}</strong>
        ${started
          ? html`<span class="program-strip-count">${prog.cleared}/${prog.total}</span>`
          : ''}
      </span>
      ${levelDots(prog, stage ? stage.index : -1)}
      <small>${programPitch(prog)}</small>
    </span>
    ${icon('arrow')}
  </a>`;
}
