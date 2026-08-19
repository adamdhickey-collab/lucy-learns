import { ACTIVITIES, PROGRAMS, TRAINER, DOG_AVATARS, PERSON_AVATARS, personAvatar } from '../content.js';
import { downloadCsv } from './report.js';
import {
  getState,
  updateCommand,
  setWeeklyGoal,
  getRepsPerSession,
  setRepsPerSession,
  hasDemoData,
  clearDemoData,
  clearAll,
  getDog,
  setDog,
  setPersonAvatar,
  getPerson,
  getPeople,
  startFresh,
  seedDemoSessions,
} from '../store.js';
import { MIN_REPS_TO_ADVANCE } from '../metrics.js';
import { restart as restartWelcome } from './welcome.js';
import { openPersonSwitcher } from '../person.js';
import { APP_VERSION } from '../version.js';
import {
  html,
  join,
  icon,
  focusHeading,
  toast,
  confirmSheet,
  avatarSheet,
  personAvatarSheet,
  dogSheet,
  refreshApp,
  personPortrait,
  firstNameOf,
} from '../ui.js';

function render() {
  const dog = getDog();
  const state = getState();
  const person = getPerson();
  const people = getPeople();
  const program = PROGRAMS[0];
  const repsPref = getRepsPerSession();
  // The program is not uniform — its levels ask for anywhere between 2 and 5 —
  // so the sentence about levels that ask for fewer is only true above the
  // shortest one. Derived rather than written down, because a level edited to
  // ask for one rep would otherwise leave the copy quietly lying.
  const shortestLevel = Math.min(
    ...ACTIVITIES.flatMap((a) => a.levels.map((l) => l.reps || 5))
  );

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
        <h1>${dog.name}</h1>
      </div>

      <div class="card">
        <div class="profile">
          ${/* The picture is the control now. It is the only thing on this
                screen that is *about* their dog rather than about the
                training, and it was the one thing they could not change.

                The alt no longer describes a black Lab: it used to, correctly,
                because there was exactly one portrait and it was Lucy's. With
                ten to choose from the description has to come from the choice,
                so the button is named for what it does and the picture is
                decorative — the dog's name is already read out
                beside it. */ ''}
          <button class="profile-photo" type="button" data-avatar aria-label="Change ${dog.name}’s picture">
            <img src="${dog.photo}" alt="" />
            ${/* A pencil, not a plus. There is already a picture here; this
                  changes it. A plus offers to add a second one. */ ''}
            <span class="edit-badge">${icon('pencil')}</span>
          </button>
          <div>
            <h2>${dog.name}</h2>
            ${dog.about ? html`<p>${dog.about}</p>` : ''}
          </div>
          ${/* A named button rather than the whole text block made tappable.
                The block holds a paragraph of free text, and wrapping a
                paragraph in a button gives a screen reader one long unreadable
                control name and gives everyone else a huge invisible target
                next to a second one. This says what it does. */ ''}
          <button class="profile-edit" type="button" data-edit-dog aria-label="Edit ${dog.name}’s name">
            ${icon('pencil')}
          </button>
        </div>
      </div>

      ${/* Directly under the dog, above everything about the training.
            The screen is headed with the dog's name and the household reads
            it as "the dog's page", so the people belong at the top of it
            rather than filed under Settings — who is holding the phone is a
            fact about the household, not a preference.

            The row states the count as well as the name because the whole
            point of the feature is invisible with one person on the install:
            "Just you so far" is what tells somebody the app has a notion of
            more than one, without a banner announcing a feature. */ ''}
      <section class="section">
        <h2>Who practices with ${dog.name}</h2>
        <div class="card">
          <button class="setting-row" type="button" data-person-switch>
            <span>
              ${person.name}
              <small>
                ${people.length > 1
                  ? `Logging as ${firstNameOf(person.name)} · ${people.length} people on this device`
                  : 'Just you so far — tap to add someone else'}
              </small>
            </span>
            <span class="value">
              ${personPortrait(person)}
            </span>
          </button>
          ${/* Its own row, because the row above switches people and this
                changes the picture of the one already chosen — two different
                answers to a tap, and nesting a button inside a button is not
                an option anyway. The name is here rather than in the row
                above, where it would compete with the person's own. */ ''}
          <button class="setting-row" type="button" data-person-avatar>
            <span>
              Your avatar
              <small>${personAvatar(person.avatar).name}</small>
            </span>
            <span class="value">${icon('pencil')}</span>
          </button>
        </div>
      </section>

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
          ${/* Sits under sessions-per-week because the two answer the same
                question at different scales — how much practice — and a
                household changing one usually wants to see the other. */ ''}
          <div class="cue-row">
            <span class="situation">Reps per session</span>
            <div class="stepper">
              <button type="button" data-reps-pref="-1" aria-label="Fewer reps per session">−</button>
              <output data-reps-pref-out aria-live="polite">${repsPref}</output>
              <button type="button" data-reps-pref="1" aria-label="More reps per session">+</button>
            </div>
          </div>
        </div>
        ${/* Two things a number alone cannot say: that some levels ask for
              fewer than this, and that a very short session still counts for
              everything except deciding the next level. The second one matters
              — without it, a household practising in twos would watch the map
              stop moving and have no way to know why. */ ''}
        <p class="section-note" style="margin-top: var(--s-3)">
          A ceiling, not a quota.
          ${repsPref > shortestLevel
            ? html`${TRAINER.name} sets each level's own number, and the shortest ask for
                ${shortestLevel}.`
            : html`Every level in the program asks for at least this many, so this is the
                number you will see throughout.`}
          ${repsPref < MIN_REPS_TO_ADVANCE
            ? html`Sessions under ${MIN_REPS_TO_ADVANCE} reps still log and still count toward
                mastery, but they will not move you up a level on their own.`
            : ''}
        </p>
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
                  a sentence rather than grayed out. It says what would be here
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

      ${/* Under the version, where the answer to "what version are you on?"
            already lives, and quiet enough not to look like a feature. */ ''}
      <p class="section-note" style="margin-top: var(--s-6); text-align: center">
        Lucy Learns ${APP_VERSION} · training program by ${TRAINER.name}<br />
        <a href="#/diagnostics">Diagnostics</a>
      </p>
    </div>
  `;
}

// One CSV implementation for the whole app; the report screen owns it.
const downloadExport = downloadCsv;

function mount(root) {
  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  on('[data-person-switch]', 'click', openPersonSwitcher);

  on('[data-edit-dog]', 'click', () => {
    const before = getDog();
    dogSheet({
      name: before.name,
      onSave: ({ name }) => {
        const renamed = name !== before.name;
        setDog({ name });
        refreshApp();
        // Named specifically when the name changed, because renaming the dog
        // also rewrites the attention cue — "Lucy!" becomes "Rufus!" — and
        // that happens on a screen the household is not looking at. Better to
        // say so than to have them find it mid-session.
        toast(renamed ? `Now ${getDog().name}, including the attention cue` : 'Name updated');
      },
    });
  });

  on('[data-person-avatar]', 'click', () => {
    personAvatarSheet({
      options: PERSON_AVATARS,
      currentId: getPerson().avatar,
      onChoose: (chosen) => {
        setPersonAvatar(chosen.id);
        toast(`You are ${chosen.name}`);
        refreshApp();
      },
    });
  });

  on('[data-avatar]', 'click', () => {
    const current = getDog().photo;
    // Lucy's install stores her own painted portrait, which is not one of the
    // ten and never will be. Without this the picker would open with nothing
    // selected and no way back to what was there — the first pick would be a
    // one-way door out of a picture the household may well prefer.
    const inSet = DOG_AVATARS.some((o) => o.src === current);
    const options = inSet
      ? DOG_AVATARS
      : [{ id: 'current', label: 'Current picture', src: current }, ...DOG_AVATARS];

    avatarSheet({
      options,
      currentSrc: current,
      onPick: (option) => {
        setDog({ photo: option.src });
        refreshApp();
        toast(`${getDog().name}’s picture updated`);
      },
    });
  });

  on('[data-cue]', 'change', (e) => {
    const value = e.currentTarget.value.trim();
    if (value) updateCommand(e.currentTarget.dataset.cue, value);
    else e.currentTarget.value = getState().commands.find(
      (c) => c.id === e.currentTarget.dataset.cue
    ).cue;
  });

  on('[data-reps-pref]', 'click', (e) => {
    const next = Math.min(5, Math.max(1, getRepsPerSession() + Number(e.currentTarget.dataset.repsPref)));
    setRepsPerSession(next);
    // A full redraw rather than patching the number in place the way the weekly
    // goal does: the note under the card appears and disappears as the value
    // crosses the advancement floor, so there is more than an <output> to keep
    // in step.
    refreshApp();
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

export default { render, mount, tab: 'profile' };
