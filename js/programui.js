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
};

function stageNote(stage) {
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
 * Nothing is disabled. A stage marked "Comes later" is still a link, because
 * the trainer outranks the app.
 */
export function stageList(prog, { currentActivityId = null, showThumbs = true } = {}) {
  const rows = prog.stages.map((stage) => {
    const img = IMAGES[stage.activity.coverImage];
    const isFocus = stage.activity.id === prog.focus.activity.id;
    const here = stage.activity.id === currentActivityId;

    return html`<li
      class="stage stage--${stage.state}${isFocus && !here ? ' stage--focus' : ''}${
        here ? ' stage--here' : ''
      }"
    >
      <a href="#/activity/${stage.activity.slug}" ${here ? 'aria-current="true"' : ''}>
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
          <span class="stage-meter">
            ${levelPips(stage)}
            <span class="stage-count" aria-hidden="true">${stage.cleared}/${stage.total}</span>
          </span>
          <span class="stage-note">${stageNote(stage)}</span>
        </span>
      </a>
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
 * The compact form. Program name, position, progress, and the one sentence
 * about what is left, in a single tap target.
 *
 * Pass `stage` to add "Activity N of M" — that is what Today needs, and giving
 * the strip that job removed a second, smaller link to this same destination
 * that had been sitting directly above Today's primary button.
 */
export function programStrip(prog, { stage = null } = {}) {
  const percent = Math.round(prog.ratio * 100);
  // Same rule as programHeader: before the first session there is no score to
  // show, so the count and the empty bar come off rather than reporting 0/23.
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
      ${started
        ? html`<span class="meter" aria-hidden="true">
            <span style="width: ${Math.max(percent, 4)}%"></span>
          </span>`
        : ''}
      <small>${programPitch(prog)}</small>
    </span>
    ${icon('arrow')}
  </a>`;
}
