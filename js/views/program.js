// The whole program on one screen.
//
// Every other screen answers "what do we do in the next five minutes". This
// one answers "what are we actually doing, and how far in are we" — the thing
// a household loses track of somewhere around week two.

import { IMAGES, programById } from '../content.js';
import { programProgress, STAGE } from '../program.js';
import { programHeader, stageList } from '../programui.js';
import { html, icon, focusHeading } from '../ui.js';

function render({ id }) {
  const program = programById(id);
  if (!program) {
    return html`<div class="screen">
      <div class="screen-head"><h1>Program not found</h1></div>
      <a class="btn btn--quiet" href="#/activities">Back to activities</a>
    </div>`;
  }

  const prog = programProgress(program.id);
  const cover = IMAGES[program.coverImage];
  const focus = prog.focus;

  return html`
    <div class="detail-hero detail-hero--short">
      <img src="${cover.src}" alt="${cover.alt}" />
      <button class="backlink" type="button" data-back aria-label="Back">${icon('back')}</button>
    </div>

    <div class="detail-body">
      ${programHeader(prog, { eyebrow: 'The program', heading: 'h1' })}
      <p class="lede">${program.blurb}</p>

      <section class="section">
        <h2>The four activities</h2>
        <p class="section-note" style="margin-bottom: var(--s-4)">
          They stack. Each one assumes the one before it is starting to hold.
        </p>
        ${stageList(prog)}
      </section>

      <section class="section" style="padding-bottom: var(--s-4)">
        <details class="disclosure">
          <summary>Trainer material</summary>
          <div class="disclosure-body">
            <p><strong>${program.source.label}</strong></p>
            <p style="margin-top: var(--s-2)">${program.source.note}</p>
          </div>
        </details>
      </section>
    </div>

    ${prog.complete
      ? ''
      : html`<div class="sticky-action sticky-action--stacked">
          <p class="sticky-hint">
            ${focus.state === STAGE.active ? 'Where you left off' : 'Next to open'} ·
            ${focus.activity.title}
          </p>
          <a class="btn btn--lg btn--block" href="#/activity/${focus.activity.slug}">
            ${focus.state === STAGE.active
              ? `Continue at level ${focus.working.number}`
              : 'Start this one'}
          </a>
        </div>`}
  `;
}

function mount(root, params, options = {}) {
  const back = root.querySelector('[data-back]');
  if (back) {
    back.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else location.hash = '#/today';
    });
  }
  focusHeading(root, params, options);
}

export default { render, mount, tab: 'activities' };
