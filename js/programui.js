// Shared markup for the program arc.
//
// Three pieces, reused by Today, the Activities library, Progress, and the
// program screen itself, so the household sees the same map wherever they meet
// it and does not have to re-learn the shape.

import { DOG, IMAGES } from './content.js';
import { STAGE, programPitch, setupDone } from './program.js';
import { MASTERY_LADDER } from './metrics.js';
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
 * The program as four segments, one per activity, each as wide as its share of
 * the levels. It replaces a row of twenty-three identical dots, which said how
 * many levels there were but nothing about what they belonged to: the four
 * activities were a gap in a row of circles and had to be counted to be seen.
 *
 * Width carries the size of each activity, fill carries progress through it,
 * and the label names it. The one being practiced is raised and titled in the
 * accent, which is what the caret below the card lines up with.
 *
 * `shortTitle` exists because a segment is about sixty pixels wide on the
 * narrowest phone and "Stay While the Door Opens" is not going in it. Read
 * across, the four are the arrival sequence: Sound, Stay, Place, Greet.
 */
function programTrack(prog, currentActivityIndex) {
  const segments = prog.stages.map((stage) => {
    const active = stage.index === currentActivityIndex && stage.state !== STAGE.soon;
    const pct = stage.total ? Math.round((stage.cleared / stage.total) * 100) : 0;
    return html`<span
      class="track-seg track-seg--${stage.state}${active ? ' track-seg--active' : ''}"
      style="flex-grow: ${stage.total}"
    >
      <span class="track-bar">
        ${pct ? raw(`<i style="width: ${pct}%"></i>`) : ''}
      </span>
      <span class="track-label">${stage.activity.shortTitle || stage.number}</span>
    </span>`;
  });

  const cleared = prog.stages.reduce((n, s) => n + s.cleared, 0);
  const allLevels = prog.stages.reduce((n, s) => n + s.total, 0);

  return html`<span
    class="program-track"
    role="img"
    aria-label="${prog.cleared} of ${prog.total} levels cleared. ${cleared} of ${allLevels} across the whole program."
  >
    ${join(segments)}
  </span>`;
}

/**
 * Where the caret under the card should sit: the centre of the active segment,
 * as a fraction of the whole track. Computed from level counts rather than
 * measured, which is a pixel or two out once the gaps are counted and invisible
 * under a 14px caret.
 */
function caretPosition(prog, currentActivityIndex) {
  const all = prog.stages.reduce((n, s) => n + s.total, 0);
  if (!all) return null;
  const index = prog.stages.findIndex((s) => s.index === currentActivityIndex);
  if (index < 0) return null;
  const before = prog.stages.slice(0, index).reduce((n, s) => n + s.total, 0);
  return ((before + prog.stages[index].total / 2) / all) * 100;
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
  // The caret only exists where something sits underneath for it to point at,
  // which is Today. On the library and on Progress the strip stands alone.
  const caret = stage ? caretPosition(prog, stage.index) : null;
  return html`<a
    class="program-strip${caret === null ? '' : ' program-strip--points'}"
    style="${caret === null ? '' : `--caret-x: ${caret.toFixed(2)}%`}"
    href="#/program/${prog.program.id}"
  >
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
      ${programTrack(prog, stage ? stage.index : -1)}
      <small>${programPitch(prog)}</small>
    </span>
    ${icon('arrow')}
  </a>`;
}

/**
 * The route, drawn once before anything has been practiced.
 *
 * Games show you the board before you play. The welcome used to explain the
 * app in prose and then drop the household onto Today, where the shape of what
 * they had signed up for had to be inferred from a strip and a card. This is
 * the same four activities the map and the track use, from the same data, laid
 * out as a road with the finish line on the end of it.
 *
 * Nothing here is progress — on first run there is none — so every station is
 * drawn empty. It is the size and shape of the job, not a score.
 */
export function routePreview(prog) {
  const stations = prog.stages.map(
    (stage, i) => html`<li class="route-stop" style="--i: ${i}">
      <span class="route-node">${stage.number}</span>
      <span class="route-label">${stage.activity.shortTitle || stage.number}</span>
    </li>`
  );

  const outcome = prog.program.outcome;
  const allLevels = prog.stages.reduce((n, s) => n + s.total, 0);

  return html`<div class="route">
    <ol class="route-line" aria-label="${prog.stages.length} activities, ${allLevels} levels, ending in ${outcome ? outcome.title : 'the finish'}">
      ${join(stations)}
      <li class="route-stop route-stop--end" style="--i: ${prog.stages.length}">
        <span class="route-node">${icon('spark')}</span>
        <span class="route-label">${outcome ? 'Calm hello' : 'Done'}</span>
      </li>
    </ol>
  </div>`;
}

/**
 * The mastery ladder, with the current rung marked.
 *
 * Learning, Improving, Almost there, Reliable is already a well-shaped four
 * rung ladder — it is how the trainer talks and how metrics.js scores — but it
 * only ever surfaced as one small badge, which tells you where you are and
 * nothing about what is above you. Drawn as rungs it becomes something with a
 * next step in it.
 *
 * Filled means reached, not passed: standing on "Almost there" fills the three
 * below it because they were genuinely earned on the way. `from` marks the rung
 * that was just left, so a climb reads as a move rather than a new state.
 */
export function masteryLadder(current, { from = null } = {}) {
  const climbed = from && current.rank > from.rank;
  const rungs = MASTERY_LADDER.map((rung) => {
    const reached = current.rank >= rung.rank;
    const here = current.rank === rung.rank;
    const gained = climbed && rung.rank > from.rank && rung.rank <= current.rank;
    return html`<span
      class="rung${reached ? ' rung--reached' : ''}${here ? ' rung--here' : ''}${
        gained ? ' rung--gained' : ''
      }"
      style="--i: ${rung.rank}"
    >
      <span class="rung-bar"></span>
      <span class="rung-label">${rung.short}</span>
    </span>`;
  });

  return html`<div
    class="ladder${climbed ? ' ladder--climbed' : ''}"
    role="img"
    aria-label="${current.rank < 0
      ? 'Not started'
      : `${current.label}, rung ${current.rank + 1} of ${MASTERY_LADDER.length}`}"
  >
    ${join(rungs)}
  </div>`;
}
