// First run. Four short panels, then a choice: start empty or look around
// with example data first. Nothing is seeded until that choice is made, so the
// app can be handed to someone genuinely blank.

import { DOG, IMAGES } from '../content.js';
import { completeOnboarding, seedDemoSessions } from '../store.js';
import { html, join, icon, raw, focusOnNavigate } from '../ui.js';

let step = 0;

export const restart = () => {
  step = 0;
};

const PANELS = [
  {
    image: 'dg-01',
    eyebrow: 'Welcome',
    title: 'Practice with Lucy, five minutes at a time',
    body: `This turns The Canine Coach's handouts into short guided sessions, so you both practice the same way and can see whether it is working.`,
    note: 'It supports your trainer. It does not replace one.',
  },
  {
    image: 'dg-03',
    eyebrow: 'How a session goes',
    title: 'One instruction at a time',
    body: 'No handout to reread. Each step fills the screen with a picture, the exact words to say, and nothing else. You can run it one-handed with a leash in the other.',
    note: 'Tap "Lucy is too excited" any time to make it easier.',
  },
  {
    image: 'dg-04',
    eyebrow: 'Logging it',
    title: 'One tap when you finish',
    body: `Answer how ${DOG.name} did and you are done. Add repetitions, behaviours, and notes only if you want to.`,
    note: 'The app then tells you whether to repeat the level or move up.',
  },
  {
    image: 'dg-11',
    eyebrow: 'Both of you',
    title: 'Switch who is practicing',
    body: `Every session records who ran it. ${DOG.name} only counts as reliable at a level once you have both done it, on different days.`,
    note: 'Change the cue words any time on the Lucy tab.',
  },
];

function render() {
  const isLast = step === PANELS.length;

  if (isLast) {
    return html`
      <div class="player welcome">
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
          <figure class="step-figure welcome-figure">
            <img src="${image.src}" alt="${image.alt}" />
          </figure>
          <p class="step-count">${panel.eyebrow}</p>
          <h1 class="welcome-title">${panel.title}</h1>
          <p class="welcome-body">${panel.body}</p>
          <p class="welcome-note">${panel.note}</p>
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

function refresh() {
  const root = document.getElementById('app');
  root.innerHTML = String(render());
  mount(root);
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
    refresh();
  });

  on('[data-back]', 'click', () => {
    step = Math.max(0, step - 1);
    refresh();
  });

  on('[data-skip]', 'click', () => {
    step = PANELS.length;
    refresh();
  });

  on('[data-choice]', 'click', (e) => {
    finish(e.currentTarget.dataset.choice === 'demo');
  });

  focusOnNavigate(root.querySelector('h1'));
}

export default { render, mount, tab: null, fullscreen: true };
