// First run. Three short panels, then a choice: start empty or look around
// with example data first. Nothing is seeded until that choice is made, so the
// app can be handed to someone genuinely blank.
//
// Everything below counts off PANELS, so adding or cutting a panel is an edit
// to that array alone: the dots, the "step N of M" label, the Skip target, and
// the last-panel button copy all follow.

import { IMAGES, PROGRAMS, TRAINER } from '../content.js';
import { completeOnboarding, seedDemoSessions } from '../store.js';
import { programProgress } from '../program.js';
import { routePreview } from '../programui.js';
import { html, join, icon, raw, focusOnNavigate, withTransition } from '../ui.js';

let step = 0;

export const restart = () => {
  step = 0;
};

const PANELS = [
  {
    image: 'door-cover',
    eyebrow: 'Welcome',
    title: 'Practice with Lucy, five minutes at a time',
    body: `This turns The Canine Coach's handouts into short guided sessions, so you both practice the same way and can see whether it is working.`,
    note: 'It supports your trainer. It does not replace one.',
  },
  {
    // Was the dg-03 diptych, then `dg-20` — kept in the old style on purpose,
    // because a new-style picture one swipe after an old-style panel 1 puts the
    // restyle on the first screen a household ever sees, with nothing to read it
    // against. Batch 1 settles that by moving both panels at once: panel 1 is
    // now `door-cover` and this is the redrawn `door-sound-02-self`, so the
    // welcome is internally consistent again. It still shows the leash under a
    // foot while the copy beside it talks about running a session one-handed,
    // which is why this step is the one that belongs here.
    image: 'door-sound-02-self',
    eyebrow: 'How a session goes',
    title: 'One instruction at a time',
    body: 'No handout to reread. Each step fills the screen with a picture, the exact words to say, and nothing else. You can run it one-handed with a leash in the other.',
    note: 'Tap "Lucy is too excited" any time to make it easier.',
  },
  {
    // The board, not a picture. It is the last thing before the choice to
    // begin, which is the position it earns: the household has been told what
    // this is and how a session runs, and now they see the whole route they
    // are about to start down.
    route: true,
    eyebrow: 'The route',
    title: 'Four activities, one calm hello',
    body: `Each one builds on the last, from the first doorbell to a guest actually at the door. Log a session in one tap and this fills in as you go.`,
    note: 'It tells you when to repeat a level and when to move up.',
  },
];

function render() {
  const isLast = step === PANELS.length;

  if (isLast) {
    return html`
      <div class="player welcome">
        <div class="player-top">
          <button class="btn btn--ghost" type="button" data-back>Back</button>
          <span style="flex:1"></span>
        </div>
        <div class="player-scroll">
          <div class="player-inner welcome-inner">
            <div class="welcome-finish">
              <p class="eyebrow">Ready</p>
              <h1>How do you want to start?</h1>
              <p class="lede" style="margin-top: var(--s-3)">
                You can switch either way later from the Lucy tab.
              </p>

              <button class="choice" type="button" data-choice="fresh">
                <span>
                  <strong>Start empty</strong>
                  <small>Nothing logged yet. Your first session will be the first one.</small>
                </span>
                ${icon('arrow')}
              </button>

              <button class="choice" type="button" data-choice="demo">
                <span>
                  <strong>Fill in example data first</strong>
                  <small>Twelve days of made-up practice, so you can see what Progress looks like. Removable in one tap.</small>
                </span>
                ${icon('arrow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const panel = PANELS[step];
  const image = IMAGES[panel.image];
  const dots = PANELS.map((_, i) =>
    raw(`<i class="${i === step ? 'on' : ''}"></i>`)
  );

  return html`
    <div class="player welcome">
      <div class="player-top">
        <span class="welcome-dots" role="img" aria-label="Step ${step + 1} of ${PANELS.length}">
          ${join(dots)}
        </span>
        <span style="flex:1"></span>
        <button class="btn btn--ghost" type="button" data-skip>Skip</button>
      </div>

      <div class="player-scroll">
        <div class="player-inner welcome-inner">
          ${panel.route
            ? routePreview(programProgress(PROGRAMS[0].id))
            : html`<figure class="step-figure welcome-figure">
                <img src="${image.src}" alt="${image.alt}" />
              </figure>`}
          <p class="step-count">${panel.eyebrow}</p>
          <h1 class="welcome-title">${panel.title}</h1>
          <p class="welcome-body">${panel.body}</p>
          <p class="welcome-note">${panel.note}</p>
          ${step === 0
            ? html`<p class="welcome-partner">Training program by ${TRAINER.name}</p>`
            : ''}
        </div>
      </div>

      <div class="player-foot">
        <div class="btn-row">
          ${step > 0
            ? html`<button class="btn btn--quiet" type="button" data-back>Back</button>`
            : ''}
          <button class="btn btn--lg" type="button" data-next>
            ${step === PANELS.length - 1 ? 'Almost there' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function refresh(direction) {
  const update = () => {
    const root = document.getElementById('app');
    root.innerHTML = String(render());
    mount(root);
  };
  if (direction) withTransition(update, direction);
  else update();
}

function finish(withDemo) {
  if (withDemo) seedDemoSessions({ force: true });
  completeOnboarding();
  step = 0;
  location.hash = '#/today';
}

function mount(root) {
  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  on('[data-next]', 'click', () => {
    step += 1;
    refresh('forward');
  });

  on('[data-back]', 'click', () => {
    step = Math.min(Math.max(0, step - 1), PANELS.length - 1);
    refresh('back');
  });

  on('[data-skip]', 'click', () => {
    step = PANELS.length;
    refresh('forward');
  });

  on('[data-choice]', 'click', (e) => {
    finish(e.currentTarget.dataset.choice === 'demo');
  });

  // The welcome runs before the service worker has cached anything, so fetch
  // the next panel's illustration while this one is being read.
  // The route panel has no illustration to fetch, and IMAGES[undefined] would
  // throw here rather than politely doing nothing.
  const next = PANELS[step + 1];
  if (next && next.image) new Image().src = IMAGES[next.image].src;

  focusOnNavigate(root.querySelector('h1'));
}

export default { render, mount, tab: null, fullscreen: true };
