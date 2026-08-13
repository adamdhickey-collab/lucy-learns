import { DOG, PROGRAMS, TRAINER } from '../content.js';
import { downloadCsv } from './report.js';
import {
  getState,
  updateCommand,
  setWeeklyGoal,
  hasDemoData,
  clearDemoData,
  clearAll,
  startFresh,
  seedDemoSessions,
} from '../store.js';
import { restart as restartWelcome } from './welcome.js';
import { APP_VERSION } from '../version.js';
import { html, join, icon, focusHeading, toast, confirmSheet } from '../ui.js';

function render() {
  const state = getState();
  const program = PROGRAMS[0];

  const cues = state.commands.map(
    (c) => html`<div class="cue-row">
      <label class="situation" for="cue-${c.id}">${c.situation}</label>
      <input id="cue-${c.id}" type="text" value="${c.cue}" data-cue="${c.id}" />
    </div>`
  );

  return html`
    <div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Profile</p>
        <h1>${DOG.name}</h1>
      </div>

      <div class="card">
        <div class="profile">
          <img src="${DOG.photo}" alt="Lucy, a black Lab and German Wirehaired Pointer mix." />
          <div>
            <h2>${DOG.name}</h2>
            <p>${DOG.breed}</p>
            <p>${DOG.about}</p>
          </div>
        </div>
      </div>

      <section class="section">
        <h2>Commands we use</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          Change these once, and every activity screen updates. Confirm the wording with The
          Canine Coach first.
        </p>
        <div class="card">${join(cues)}</div>
      </section>

      <section class="section">
        <h2>Practice goal</h2>
        <div class="card">
          <div class="cue-row">
            <span class="situation">Sessions per week</span>
            <div class="stepper">
              <button type="button" data-goal="-1" aria-label="Lower the weekly goal">−</button>
              <output data-goal-out aria-live="polite">${state.weeklyGoal}</output>
              <button type="button" data-goal="1" aria-label="Raise the weekly goal">+</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Your trainer</h2>
        <div class="card">
          <div class="card-body">
            <strong>${TRAINER.name}</strong>
            <p class="section-note" style="margin-top: var(--s-2)">
              Every activity, cue, and progression rule in this app comes from their
              program. When something is not working, they are the next step.
            </p>
            ${/* Buttons only when there is something behind them. A disabled
                  Call button is worse than no Call button — it is a control
                  that looks live, and this app already decided that argument
                  once, for the planned activity cards.

                  So when the contact details are absent the row is replaced by
                  a sentence rather than greyed out. It says what would be here
                  and why it is not, which is the honest thing to show someone
                  trying a demo, and it keeps the trainer named — the app is a
                  companion to their instruction whether or not you can reach
                  them from this screen. */ ''}
            ${TRAINER.phone || TRAINER.url
              ? html`<div class="btn-row" style="margin-top: var(--s-4)">
                  ${TRAINER.phone
                    ? html`<a class="btn btn--quiet" href="tel:${TRAINER.phone}">Call</a>`
                    : ''}
                  ${TRAINER.url
                    ? html`<a class="btn btn--quiet" href="${TRAINER.url}" target="_blank" rel="noopener">
                        Website
                      </a>`
                    : ''}
                </div>`
              : html`<p class="section-note" style="margin-top: var(--s-4)">
                  In a real setup their phone number and website sit here. This
                  version is a demonstration, so there is nothing to call.
                </p>`}
          </div>
        </div>
        <div class="card" style="margin-top: var(--s-3)">
          <div class="card-body">
            <strong>${program.source.label}</strong>
            <p class="section-note" style="margin-top: var(--s-2)">${program.source.note}</p>
          </div>
        </div>
        <p class="section-note" style="margin-top: var(--s-3)">
          Lucy Learns is here to help you practice what your trainer assigned. It does not
          diagnose behavior and it does not replace professional guidance.
        </p>
      </section>

      <section class="section">
        <h2>Settings</h2>
        <div class="card">
          <button class="setting-row" type="button" data-replay>
            <span>
              How this works
              <small>Replay the three-screen intro</small>
            </span>
            <span class="value">${icon('arrow')}</span>
          </button>
          <button class="setting-row" type="button" data-export>
            <span>
              Export progress
              <small>CSV of every session and moment, for The Canine Coach</small>
            </span>
            <span class="value">${state.sessions.length + state.incidents.length} records</span>
          </button>
        </div>
      </section>

      <section class="section">
        <h2>Starting over</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          Handing the app to someone else, or want a clean run at it?
        </p>
        <div class="card">
          <button class="setting-row" type="button" data-start-fresh>
            <span>
              Reset to a brand new app
              <small>Wipes everything and shows the welcome again, exactly like a first install</small>
            </span>
            <span class="value">${icon('arrow')}</span>
          </button>
          ${hasDemoData()
            ? html`<button class="setting-row" type="button" data-clear-demo>
                <span>
                  Remove example data
                  <small>Deletes the made-up sessions and keeps your real ones</small>
                </span>
              </button>`
            : html`<button class="setting-row" type="button" data-load-demo>
                <span>
                  Load example data
                  <small>Twelve days of made-up practice, to see what Progress looks like</small>
                </span>
              </button>`}
          <button class="setting-row danger" type="button" data-clear-all>
            <span>
              Delete all logs
              <small>Clears sessions and moments but keeps your cue wording</small>
            </span>
          </button>
        </div>
      </section>

      <div class="card" style="margin-top: var(--s-4)">
        <div class="card-body">
          <h3 style="font-size: var(--step-0)">This device only</h3>
          <p class="section-note" style="margin-top: var(--s-2)">
            Sessions are saved in this browser and nowhere else. Nothing syncs, so this
            phone holds the only copy. Export one before you clear Safari's data.
          </p>
        </div>
      </div>

      <p class="section-note" style="margin-top: var(--s-6); text-align: center">
        Lucy Learns ${APP_VERSION} · training program by ${TRAINER.name}
      </p>
    </div>
  `;
}

// One CSV implementation for the whole app; the report screen owns it.
const downloadExport = downloadCsv;

function mount(root) {
  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  on('[data-cue]', 'change', (e) => {
    const value = e.currentTarget.value.trim();
    if (value) updateCommand(e.currentTarget.dataset.cue, value);
    else e.currentTarget.value = getState().commands.find(
      (c) => c.id === e.currentTarget.dataset.cue
    ).cue;
  });

  on('[data-goal]', 'click', (e) => {
    const next = Math.min(14, Math.max(1, getState().weeklyGoal + Number(e.currentTarget.dataset.goal)));
    setWeeklyGoal(next);
    const out = root.querySelector('[data-goal-out]');
    if (out) out.textContent = next;
  });

  on('[data-export]', 'click', downloadExport);

  on('[data-replay]', 'click', () => {
    restartWelcome();
    location.hash = '#/welcome';
  });

  on('[data-start-fresh]', 'click', () => {
    confirmSheet({
      title: 'Reset to a brand new app?',
      body:
        'Everything goes: sessions, moments, cue wording, and the practice goal. You will land on the welcome screen exactly as if the app had just been installed.',
      confirmLabel: 'Reset it all',
      tone: 'danger',
      extraLabel: 'Export a copy first',
      onExtra: downloadExport,
      onConfirm: () => {
        startFresh();
        restartWelcome();
        location.hash = '#/welcome';
        location.reload();
      },
    });
  });

  on('[data-load-demo]', 'click', () => {
    seedDemoSessions({ force: true });
    toast('Example data loaded');
    location.reload();
  });

  on('[data-clear-demo]', 'click', () => {
    confirmSheet({
      title: 'Remove the example sessions?',
      body: 'The ten seeded sessions go. Anything you logged yourselves stays.',
      confirmLabel: 'Remove examples',
      onConfirm: () => {
        clearDemoData();
        toast('Example data cleared');
        location.reload();
      },
    });
  });

  on('[data-clear-all]', 'click', () => {
    confirmSheet({
      title: 'Delete all logs?',
      body:
        'Every session and moment on this device. Your cue wording stays. This cannot be undone, and there is no copy anywhere else.',
      confirmLabel: 'Delete logs',
      tone: 'danger',
      extraLabel: 'Export a copy first',
      onExtra: downloadExport,
      onConfirm: () => {
        clearAll();
        toast('All data deleted');
        location.reload();
      },
    });
  });

  focusHeading(root);
}

export default { render, mount, tab: 'lucy' };
