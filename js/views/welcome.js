// First run. Three short panels, then a choice: start empty or look around
// with example data first. Nothing is seeded until that choice is made, so the
// app can be handed to someone genuinely blank.
//
// Everything below counts off PANELS, so adding or cutting a panel is an edit
// to that array alone: the dots, the "step N of M" label, the Skip target, and
// the last-panel button copy all follow.

import { IMAGES, PROGRAMS, TRAINER, BREEDS } from '../content.js';
import { completeOnboarding, seedDemoSessions, setDog, setPersonName } from '../store.js';
import { programProgress } from '../program.js';
import { routePreview } from '../programui.js';
import { html, join, icon, raw, initialsOf, focusOnNavigate, withTransition } from '../ui.js';

let step = 0;

/**
 * What the setup screens are collecting, held here until the last screen.
 *
 * Nothing is written to the store until the household picks how to start, so
 * abandoning the welcome half way leaves no trace — the same promise the demo
 * choice already made.
 */
let draft = { person: '', dog: '', breed: '' };

export const restart = () => {
  step = 0;
  draft = { person: '', dog: '', breed: '' };
};


const PANELS = [
  {
    image: 'door-cover',
    eyebrow: 'Welcome',
    title: 'Five minutes of practice at a time',
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
    note: 'There is a button on every session that makes it easier, any time.',
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

// The story panels, then the two questions, then the start choice.
const PERSON_STEP = PANELS.length;
const DOG_STEP = PANELS.length + 1;
const CHOICE_STEP = PANELS.length + 2;

/** Shared chrome for the two question screens. */
function setupScreen({ eyebrow, title, body, canContinue }) {
  return html`
    <div class="player welcome">
      <div class="player-top">
        <button class="btn btn--ghost" type="button" data-back>Back</button>
        <span style="flex:1"></span>
      </div>
      <div class="player-scroll">
        <div class="player-inner welcome-inner">
          <div class="welcome-finish">
            <p class="eyebrow">${eyebrow}</p>
            <h1>${title}</h1>
            ${body}
          </div>
        </div>
      </div>
      <div class="player-foot">
        <button class="btn btn--lg btn--block" type="button" data-next ${canContinue ? '' : 'disabled'}>
          Next
        </button>
      </div>
    </div>
  `;
}

function render() {
  if (step === PERSON_STEP) {
    return setupScreen({
      eyebrow: 'Setup',
      title: 'Who is practicing?',
      canContinue: Boolean(draft.person.trim()),
      body: html`
        ${/* The avatar previews as they type. It is the only reason to ask for
              a name in a field of its own rather than lumping it in with the
              dog's: the initials are a consequence of the answer, and showing
              them makes that a decision rather than something that happens
              afterwards. */ ''}
        <div class="field setup-field">
          <label for="setup-person">Your name</label>
          <div class="setup-with-avatar">
            <input
              id="setup-person"
              type="text"
              data-person
              value="${draft.person}"
              placeholder="Fabiola"
              ${/* Generous enough for any real name, short enough that the
                    greeting and the CSV cannot be handed something absurd.
                    The heading scales down for long names; it does not scale
                    down for a paragraph. */ ''}
              maxlength="32"
              autocapitalize="words"
              autocomplete="given-name"
              enterkeyhint="next"
            />
            <span class="avatar avatar--preview" aria-hidden="true" data-initials>
              ${initialsOf(draft.person)}
            </span>
          </div>
          <p class="section-note">
            The app greets you by your first name and puts your initials on the
            avatar. Both are easy to change later.
          </p>
        </div>
      `,
    });
  }

  if (step === DOG_STEP) {
    return setupScreen({
      eyebrow: 'Setup',
      title: 'Who are you training?',
      canContinue: Boolean(draft.dog.trim()),
      body: html`
        <div class="field setup-field">
          <label for="setup-dog">Their name</label>
          <input
            id="setup-dog"
            type="text"
            data-dog
            value="${draft.dog}"
            placeholder="Lucy"
            maxlength="24"
            autocapitalize="words"
            ${/* Off, or the browser offers the human names it has saved for
                  this person. */ ''}
            autocomplete="off"
            enterkeyhint="next"
          />
        </div>

        <div class="field setup-field">
          <label for="setup-breed">Breed <span class="setup-optional">optional</span></label>
          <input
            id="setup-breed"
            type="text"
            data-breed
            value="${draft.breed}"
            list="breed-list"
            placeholder="Mixed breed, Labrador, not sure…"
            maxlength="48"
            autocapitalize="words"
            autocomplete="off"
            enterkeyhint="done"
          />
          <datalist id="breed-list">
            ${join(BREEDS.map((b) => raw(`<option value="${b}"></option>`)))}
          </datalist>
          <p class="section-note">
            However you would describe them. “Mixed” and “not sure” are perfectly
            good answers.
          </p>
        </div>

        ${/* Said once, here, on the screen where somebody has just typed their
              own dog's name — which is the moment the mismatch is about to
              start. Every illustration in the app is one black Lab mix, so a
              golden retriever's household is about to meet Lucy thirty times.
              That cannot be fixed (there is no per-breed regeneration of an
              illustrated set) but it can be named, and naming it converts a
              bug report into a convention the reader understood in advance.

              Deliberately not an apology. The pictures are demonstrating a
              technique, and a technique does not depend on the coat. */ ''}
        <p class="setup-aside">
          One thing worth knowing: the pictures throughout the app are all of
          the same dog — Lucy, a black Labrador mix, who this was first built
          for. Yours will look nothing like her. The pictures are there to show
          you the handling, and that part is the same for every dog.
        </p>
      `,
    });
  }

  const isLast = step === CHOICE_STEP;

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
                ${/* These two were offered even-handedly, in the order
                      empty-then-example, and that order was wrong for the
                      person most likely to be reading it.

                      For a household starting their own training, empty is
                      plainly right: their first session should be their first
                      session, and seeding it with fiction would corrupt the
                      one number they care about.

                      For somebody who has been sent a link and has ten
                      minutes, empty hides most of the app. Progress has no
                      chart, the report has nothing to report, mastery is
                      "Not started" four times over, the streak is zero and
                      the program map is an unstarted row of gray. They would
                      be evaluating the shell.

                      So the recommendation is stated rather than implied, and
                      the reason is given, because the reader knows which of
                      those two people they are and the app does not. */ ''}
                If you are looking around, start with the example data — an
                empty app has nothing in Progress or the report yet. If this is
                your own dog and you are here to train, start empty. Either way
                you can switch later from the profile tab.
              </p>

              <button class="choice choice--recommended" type="button" data-choice="demo">
                <span>
                  ${/* Above the title, not beside it. Inline, the tag wrapped
                        to a line of its own on a 375px screen and set in caps
                        it then read as a second heading, louder than the
                        choice it was qualifying. */ ''}
                  <em class="choice-tag">Recommended</em>
                  <strong>Look around with example data</strong>
                  <small>
                    Twelve days of made-up practice, so Progress, the report and
                    the program map have something in them. Removable in one tap.
                  </small>
                </span>
                ${icon('arrow')}
              </button>

              <button class="choice" type="button" data-choice="fresh">
                <span>
                  <strong>Start empty</strong>
                  <small>Nothing logged yet. Your first session will be the first one.</small>
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
  const person = draft.person.trim();
  const dog = draft.dog.trim();
  if (person) setPersonName(person);
  if (dog) {
    // `about` is cleared rather than kept. The default carries Lucy's
    // temperament — "gets over-aroused around arrivals" — which is a claim
    // about one specific dog, and setup never asks for it. Better an empty
    // line on the profile than a description somebody else's app wrote about
    // a dog it has never met. The profile renders it only when present.
    setDog({ name: dog, breed: draft.breed.trim(), about: '' });
  }
  if (withDemo) seedDemoSessions({ force: true });
  completeOnboarding();
  step = 0;
  draft = { person: '', dog: '', breed: '' };
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
    // Clamp to the whole flow, not to the panels. This used to cap at
    // PANELS.length - 1, which was right while the panels were everything
    // after them; now Back from the dog screen has to reach the person screen.
    step = Math.max(0, step - 1);
    refresh('back');
  });

  // Skip is for the story, and lands on the first question rather than past
  // it. The name is the one thing the app cannot invent for itself.
  on('[data-skip]', 'click', () => {
    step = PERSON_STEP;
    refresh('forward');
  });

  const field = (selector, key) =>
    on(selector, 'input', (e) => {
      draft[key] = e.currentTarget.value;
      // Only the Next button and the avatar depend on this, so they are
      // updated in place. Re-rendering on every keystroke would take the
      // caret with it.
      const next = root.querySelector('[data-next]');
      if (next) {
        const ready = step === PERSON_STEP ? draft.person.trim() : draft.dog.trim();
        next.disabled = !ready;
      }
      const initials = root.querySelector('[data-initials]');
      if (initials && key === 'person') initials.textContent = initialsOf(draft.person);
    });

  field('[data-person]', 'person');
  field('[data-dog]', 'dog');
  field('[data-breed]', 'breed');

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
