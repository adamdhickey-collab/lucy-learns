// The guided activity player. One instruction per screen, big targets, and a
// session that gets counted as it happens rather than reconstructed from
// memory afterward.
//
// Phases: ready → step (1..n, looping — each full pass through the steps is
// one repetition, counted on the last step and wrapped back to the first) →
// result (arousal, one tap saves) → done (recommendation) ⇄ detail (edits).
//
// EXPERIMENT (rep-cycle-flow branch): the old flow walked the steps once and
// then parked on a static tally screen, with the count starting at zero after
// you had already done the thing once. Here the walkthrough IS the rep: the
// pictures stay up and cycle, the first pass counts as rep one, and the
// outcome is asked at the moment the rep ends instead of on a separate screen.

import {
  activityBySlug,
  isAvailable,
  IMAGES,
  VERDICT_ART,
  stepsForLevel,
  levelOf,
  AROUSAL,
  BEHAVIORS,
  ASSISTANCE,
  RECOVERY_BANDS,
  TRAINER,
} from '../content.js';
import {
  addSession,
  fillDog,
  getDog,
  getPace,
  getState,
  getVoice,
  hintSeen,
  isStorageOk,
  markHintSeen,
  PACE_LADDER,
  repTarget,
  resolveCue,
  setLevel,
  setPace,
  setVoice,
  stepPace,
  updateSession,
} from '../store.js';
import {
  canSpeak,
  currentVoiceName,
  currentVoiceURI,
  listVoices,
  onSpeechChange,
  onVoicesReady,
  setPreferredVoice,
  speak,
  speechStatus,
  stopSpeaking,
} from '../voice.js';
import { currentLevel, masteryFor, recommendation } from '../metrics.js';
import { programProgress, programGain } from '../program.js';
import { levelPips, masteryLadder } from '../programui.js';
import {
  html,
  join,
  icon,
  toast,
  pct,
  focusOnNavigate,
  trapModal,
  confirmSheet,
  withTransition,
} from '../ui.js';

let session = null;
let wakeLock = null;

/**
 * Set by Today's "jump back in" shortcut: the next time the player opens, it
 * skips the get-ready checklist and lands on step one. For someone mid-way
 * through a level, the equipment list is ritual they no longer need.
 */
let skipReadyOnce = false;
export const requestQuickStart = () => {
  skipReadyOnce = true;
};

function begin(activity, level) {
  session = {
    slug: activity.slug,
    levelNumber: level.number,
    phase: 'ready',
    stepIndex: 0,
    ready: new Set(),
    startedAt: Date.now(),
    // Each entry is one repetition as it happened: true went well, false not.
    // Totals derive from this, so the numbers are observations, not defaults.
    repLog: [],
    reps: 0,
    successes: 0,
    // Set for exactly one render: the one where the rep target is crossed.
    celebrate: false,
    arousal: null,
    behaviors: new Set(),
    assistance: new Set(),
    recoveryBand: null,
    note: '',
    saved: null,
    advice: null,
    milestone: null,
    detailAdded: false,
    sheetOpen: false,
    releaseTrap: null,
  };
  // The pause on the pace timer belongs to a session, not to the household:
  // it is "give me a moment", and the moment does not carry over to tomorrow.
  // The hold is cleared for the same reason, so no dialog from a previous
  // session can leave the next one waiting.
  pace.paused = false;
  pace.held = false;
}

async function keepAwake() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch {
    /* not supported, or the tab lost focus. Practice still works. */
  }
}

function releaseAwake() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

let keyHandler = null;

function detachKeys() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function closeSheet() {
  if (!session) return;
  session.sheetOpen = false;
  refresh();
}

const syncTotals = () => {
  session.reps = session.repLog.length;
  session.successes = session.repLog.filter(Boolean).length;
};

// ---------------------------------------------------------------------------
// The back-button guard
// ---------------------------------------------------------------------------
//
// The phases where leaving costs something that was never written down.
// Shared, so the close button and the back gesture can never disagree about
// what counts as unsaved.
const UNSAVED_PHASES = ['step', 'result'];

const isUnsaved = () => Boolean(session) && UNSAVED_PHASES.includes(session.phase);

/**
 * Back out of a live session and the reps are gone — a whole walk through the
 * pictures with a dog, unwritten.
 *
 * The close button has always asked first. Back did not, because with hash
 * routing it simply changes the hash and the router tears the player down
 * before anything can object. On an installed iPhone that path barely exists;
 * on Android, back is the primary way people leave anything, so the same
 * reflex that closes a dialog also silently threw away a session.
 *
 * The fix is a duplicate history entry pushed when practice starts. It carries
 * the same hash as the real one, so landing back on it fires `popstate` but no
 * `hashchange` — the router never runs, the screen never changes, and the
 * press becomes an event we can answer instead of a navigation we have to
 * undo. Answering it means pushing the duplicate again, so the guard survives
 * as long as the session does.
 */
let guardArmed = false;
let popHandler = null;
let confirmClose = null;

function armExitGuard() {
  if (guardArmed) return;
  guardArmed = true;
  history.pushState(null, '', location.hash);

  popHandler = () => {
    if (!isUnsaved()) {
      disarmExitGuard();
      return;
    }
    // The press consumed the duplicate, so put it back before anything else:
    // whatever the answer turns out to be, the player has to still be here
    // while the question is on screen.
    history.pushState(null, '', location.hash);

    // Back closes what is on top first. An open fallback sheet is the top
    // thing, and dismissing it is what the gesture means there — asking
    // "leave practice?" over a sheet the handler opened by accident would be
    // answering a question nobody asked.
    if (session.sheetOpen) {
      closeSheet();
      return;
    }
    // One question at a time: a second press while the sheet is up would
    // otherwise stack another copy of it behind the first.
    if (confirmClose) return;

    holdPace(true);
    confirmClose = confirmSheet({
      title: 'Leave practice?',
      body: 'Nothing from this session is saved yet.',
      confirmLabel: 'Leave',
      cancelLabel: 'Keep going',
      onConfirm: () => {
        confirmClose = null;
        leavePlayer();
      },
      onDismiss: () => {
        confirmClose = null;
        holdPace(false);
      },
    });
  };

  window.addEventListener('popstate', popHandler);
}

/**
 * @param {boolean} consume  Also spend the duplicate entry. Pass true only
 *   when the player is staying put — a session that just saved, say. The
 *   duplicate is otherwise left behind and the next back press goes to it
 *   instead of anywhere, which reads on Android as a button that did nothing.
 *   Not safe while navigating away: the pop would be racing the hash change
 *   that is already leaving, and there the leftover entry is harmless anyway.
 */
function disarmExitGuard(consume = false) {
  if (!guardArmed) return;
  guardArmed = false;
  window.removeEventListener('popstate', popHandler);
  popHandler = null;
  if (confirmClose) {
    confirmClose();
    confirmClose = null;
  }
  // The listener is already gone, and the entry carries the player's own
  // hash, so this pops quietly: no hashchange, no route, nothing on screen.
  if (consume) history.back();
}

// ---------------------------------------------------------------------------
// Hands-free
// ---------------------------------------------------------------------------
//
// Two halves, both at module scope alongside the session rather than inside a
// render: the step cycle re-renders on every tap, and anything rebuilt per
// render would spend the session being torn down.
//
// Reading aloud says each step; the pace timer turns them. Between the two
// the phone can sit on the counter for a whole rep. Hands-free used to have
// a third half — listening for spoken commands — and it is gone on purpose:
// a handler saying "next step" brightly at a phone is a handler saying words
// in that voice at a dog who is being taught that words in that voice are
// hers. The commands avoided every cue and still shared the room with them.

/** The step last read aloud, so a re-render does not say it again. */
let spokenKey = '';

/**
 * Read the step the session is on now.
 *
 * Called from the click handlers rather than from the render, so the speech
 * starts inside the tap that caused it. That is the whole difference between
 * working and silent on iOS, where speech may only begin during a user
 * gesture and a view-transition callback is already too late to count.
 *
 * Keyed by rep and step so the same instruction is never read twice for one
 * position — a chip toggle or an undo re-renders the screen without moving
 * it, and the fallback in syncHandsFree would otherwise say it again.
 */
function speakStep(steps) {
  if (!getVoice().speak || !canSpeak() || !session || session.phase !== 'step') return;
  const key = `${session.repLog.length}:${session.stepIndex}`;
  if (key === spokenKey) return;
  spokenKey = key;

  const step = steps[session.stepIndex];
  if (!step) return;
  const isLast = session.stepIndex === steps.length - 1;
  const rep = session.repLog.length + 1;
  const lead = session.stepIndex === 0 ? `Rep ${rep}. ` : '';
  // The instruction, never the cue. The cue is a word the dog has been
  // trained on and the handler is meant to say it — a phone saying it out
  // loud cues the dog itself, from the wrong place at a moment nobody chose.
  // Same reason the rep question is read but its criteria are not: those are
  // for the handler's eyes, mid-judgment.
  const tail = isLast ? ` That was rep ${rep}. How did it go?` : '';
  // Filled here because speech never passes through the html tag.
  speak(fillDog(`${lead}${step.instruction}${tail}`));
}

/**
 * The pace timer.
 *
 * `frame` is the animation frame the clock is running on, and doubles as
 * "is it running". `deadline` is when the step turns over. `paused` is the
 * household's own choice, from the strip's button, and the one thing here
 * that survives a step change: a pause that quietly ended the moment they
 * tapped Next would be a pause that only pauses one step, which is not what
 * the word means. `held` is the app's own hold — a dialog is up — and lifts
 * itself. Everything else is read fresh off the screen each time.
 */
const pace = { frame: 0, deadline: 0, paused: false, held: false, stall: 0, shown: -1 };

/**
 * How long a queued utterance is given to start before the clock stops
 * waiting for it. On iOS a failed utterance is not an error, it is a queue
 * entry that never starts, and a timer that waited for it would wait for
 * the rest of the session.
 */
const SPEECH_STALL_MS = 4000;
let speechQueuedAt = 0;

const currentSteps = () => {
  const activity = activityBySlug(session.slug);
  return stepsForLevel(activity, levelOf(activity, session.levelNumber));
};

/**
 * Whether the clock should be running for the screen that is up right now.
 *
 * Not on the last step, ever. The rep question is the one observation in the
 * session and the log is built from it; a timer that answered it would be
 * the reflex "went well" the criteria block exists to prevent, made
 * automatic. The steps turn; the judgement waits for a thumb.
 *
 * Not with "Why this matters" open either. A drawer open is somebody reading,
 * and a screen that turns over under a paragraph loses them the paragraph.
 */
function paceWanted() {
  if (!session || session.phase !== 'step' || session.sheetOpen) return false;
  if (!getPace().auto || pace.paused || pace.held) return false;
  if (session.stepIndex >= currentSteps().length - 1) return false;
  if (document.visibilityState === 'hidden') return false;
  const drawer = document.querySelector('[data-why]');
  if (drawer && drawer.open) return false;
  return true;
}

/**
 * Whether the phone is mid-sentence, as far as the clock is concerned.
 *
 * With reading aloud on, a ten-second step whose instruction takes six to
 * say would leave four to do it, so the clock starts when the voice stops.
 * A queued utterance counts as speaking for a few seconds and then does not:
 * see SPEECH_STALL_MS.
 */
function speechBusy() {
  if (!getVoice().speak || !canSpeak()) return false;
  const { state } = speechStatus();
  if (state === 'speaking') return true;
  if (state === 'queued') return performance.now() - speechQueuedAt < SPEECH_STALL_MS;
  return false;
}

function stopPaceFrame() {
  if (pace.frame) cancelAnimationFrame(pace.frame);
  pace.frame = 0;
  if (pace.stall) clearTimeout(pace.stall);
  pace.stall = 0;
  pace.shown = -1;
}

/**
 * Run the clock for one step. Every start is a full step: a hold that lifts,
 * a resume, a change of length — each begins the step again rather than
 * picking up a remainder, because the reason the clock stopped was that
 * somebody needed the time.
 */
function startPace() {
  stopPaceFrame();
  const total = getPace().seconds * 1000;
  pace.deadline = performance.now() + total;
  const tick = () => {
    const left = pace.deadline - performance.now();
    if (left <= 0) {
      pace.frame = 0;
      paintPaceClock(0, total);
      firePace();
      return;
    }
    paintPaceClock(left, total);
    pace.frame = requestAnimationFrame(tick);
  };
  pace.frame = requestAnimationFrame(tick);
}

/**
 * Turn the step over, through the real Next button.
 *
 * Clicking the control rather than calling the handler keeps every guard
 * already written — the last step has no Next, the hint is spent by moving
 * on — holding for the clock exactly as it holds for a thumb.
 */
function firePace() {
  const button = document.querySelector('[data-next]');
  if (button && !button.disabled) button.click();
}

/**
 * Bring the clock into line with the screen. Idempotent, and the only entry
 * point: every reason to stop or start goes through here, so nothing can
 * disagree about whether the button is about to press itself.
 */
function syncPace() {
  if (!paceWanted()) {
    stopPaceFrame();
    paintPaceStrip();
    return;
  }
  if (speechBusy()) {
    stopPaceFrame();
    // Told again when the voice stops, by onSpeechChange — unless it never
    // starts, in which case this is what tells it.
    if (speechStatus().state === 'queued') {
      const wait = SPEECH_STALL_MS - (performance.now() - speechQueuedAt) + 20;
      pace.stall = setTimeout(syncPace, Math.max(wait, 0));
    }
    paintPaceStrip();
    return;
  }
  if (!pace.frame) startPace();
  paintPaceStrip();
}

/** The app's own hold, for a dialog over the step. */
function holdPace(on) {
  pace.held = on;
  stopPaceFrame();
  syncPace();
}

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Paint one frame of the clock: the fill in the Next button and the count
 * in the strip. In place, never a re-render — sixty a second, under a thumb.
 *
 * Reduced motion keeps the clock and drops the sweep: the fill moves once a
 * second in steps, which is the information without the motion, the same
 * bargain the progress bar makes.
 */
function paintPaceClock(left, total) {
  const seconds = Math.ceil(left / 1000);
  const fill = document.querySelector('[data-next] .btn-fill');
  if (fill) {
    const elapsed = reduceMotion() ? total - seconds * 1000 : total - left;
    fill.style.transform = `scaleX(${Math.min(Math.max(elapsed / total, 0), 1).toFixed(4)})`;
  }
  if (seconds === pace.shown) return;
  pace.shown = seconds;
  const count = document.querySelector('[data-pace-count]');
  if (count) count.textContent = seconds > 0 ? `Next in ${seconds}s` : 'Next';
}

/** The strip's words for a clock that is not running. */
function paintPaceStrip() {
  if (pace.frame) return;
  const count = document.querySelector('[data-pace-count]');
  if (!count) return;
  const fill = document.querySelector('[data-next] .btn-fill');
  if (fill) fill.style.transform = 'scaleX(0)';
  if (pace.paused) count.textContent = 'Paused';
  else if (speechBusy()) count.textContent = 'After the voice';
  else count.textContent = 'Waiting';
}

/**
 * Speech starting or stopping is a reason to hold or start the clock, and
 * nothing else here cares which.
 */
onSpeechChange((status) => {
  if (status.state === 'queued') speechQueuedAt = performance.now();
  if (session) syncPace();
});

/**
 * Stop talking, and stop the clock, the moment this app stops being the thing
 * on screen. A step that turned over while the phone was in a pocket is a
 * step nobody saw. Coming back starts the step again from the top.
 *
 * `pagehide` rather than `beforeunload`, which iOS does not reliably fire,
 * and `visibilitychange` for the ordinary case of switching away. Registered
 * once at module load: these outlive any one session by design, since the
 * session is what needs cleaning up.
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopSpeaking();
    if (session) syncPace();
  });
  window.addEventListener('pagehide', () => {
    stopSpeaking();
    stopPaceFrame();
  });
}

function endHandsFree() {
  stopSpeaking();
  stopPaceFrame();
  pace.held = false;
  spokenKey = '';
}

/** Leave a live session for the activity it belongs to, guard and all. */
function leavePlayer() {
  disarmExitGuard();
  endHandsFree();
  releaseAwake();
  const slug = session ? session.slug : null;
  session = null;
  location.hash = slug ? `#/activity/${slug}` : '#/today';
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

/**
 * `valueText` spells out the position for a screen reader. The bar creeps
 * within a rep, but aria-valuenow has to be a whole rep to stay honest against
 * aria-valuemax, so the finer detail — which step of which rep — goes here
 * rather than being lost. It is interpolated as an attribute *value*, never
 * as a whole attribute: html`` escapes interpolations, so a conditional
 * `aria-valuetext="…"` built as a string arrives with its quotes escaped and
 * the attribute truncates at the first space.
 */
function topBar(label, value, max, valueText = label) {
  return html`
    <div class="player-top">
      <button class="icon-btn" type="button" data-exit aria-label="Leave practice">
        ${icon('close')}
      </button>
      <div
        class="progress-track"
        role="progressbar"
        aria-valuenow="${Math.floor(value)}"
        aria-valuemin="0"
        aria-valuemax="${max}"
        aria-valuetext="${valueText}"
        aria-label="${label}"
      >
        <span style="transform: scaleX(${max ? Math.min(value / max, 1).toFixed(3) : 0})"></span>
      </div>
      <span class="badge">${label}</span>
    </div>
  `;
}

/**
 * The hands-free offer, made before practice rather than during it.
 *
 * Here because this is the screen where the leash is not yet in the hand:
 * a decision about how the session will run belongs before it runs. The
 * pace can still be changed mid-rep, from the strip on the step screen, and
 * it is the same number — there is one setting, and this is merely the
 * first place it is offered.
 *
 * Two switches, not one. Reading aloud and moving on by itself are useful
 * apart: a handler who wants the steps said but wants to turn them at their
 * own speed should not have to take both.
 */
function handsFreeGroup({ heading = true } = {}) {
  // Belt as well as braces. Everything inside is defensive already, but this
  // whole block is an optional convenience sitting on the screen that starts
  // a session — and the cost of it throwing is not a missing switch, it is a
  // household that cannot practice at all. Anything unexpected in here costs
  // the feature, never the session.
  try {
    return handsFreeGroupInner({ heading });
  } catch {
    return '';
  }
}

function handsFreeGroupInner({ heading = true } = {}) {
  const voice = getVoice();
  const pacePref = getPace();
  const voices = voice.speak ? listVoices() : [];
  const activeVoiceUri = currentVoiceURI();

  return html`
    <div class="result-group voice-group">
      ${/* Dropped when the disclosure already carries the name, or the
            first-run screen reads "Hands free" twice in a row. */ ''}
      ${heading ? html`<h2>Hands free</h2>` : ''}
      <p class="section-note" style="margin-top: 0">
        For when the leash is in one hand and the treats are in the other.
      </p>
      <div class="chips" style="margin-top: var(--s-3)">
        ${canSpeak()
          ? html`<button
              type="button"
              class="chip"
              data-voice-speak
              aria-pressed="${String(voice.speak)}"
            >
              Read the steps aloud
            </button>`
          : ''}
        <button
          type="button"
          class="chip"
          data-pace-auto
          aria-pressed="${String(pacePref.auto)}"
        >
          Move on by itself
        </button>
      </div>

      ${/* A speaker that says nothing looks exactly like a speaker that is
            off, so this says which voice is in use and offers to prove it.
            The tap is also the point: iOS starts speech during a gesture or
            not at all, so a button is the most reliable sound the app can
            make, and if this works while the steps do not, that narrows the
            problem to one thing. */ ''}
      ${voice.speak && canSpeak()
        ? html`<div class="voice-note voice-picker">
            ${/* Chosen here rather than in the phone's settings. Which
                  voices a browser exposes, and what the path to them is
                  called, differs by platform, by version and by which
                  browser is being used — and none of that is worth making
                  somebody navigate when the app already holds the list. */ ''}
            ${voices.length
              ? html`<label class="voice-picker-row">
                  <span class="label">Voice</span>
                  <select data-voice-select>
                    ${join(
                      voices.map(
                        (v) => html`<option
                          value="${v.uri}"
                          ${v.uri === activeVoiceUri ? 'selected' : ''}
                        >
                          ${v.name}
                        </option>`
                      )
                    )}
                  </select>
                </label>`
              : html`<p class="section-note voice-warn" data-voices-pending>
                  Loading this device’s voices. Tap Test voice if the list does not
                  appear.
                </p>`}
            <p class="section-note voice-speech-status">
              <span data-speech-status
                >${currentVoiceName()
                  ? `Using ${currentVoiceName()}.`
                  : 'Using this device’s default voice.'}</span
              >
              <button class="btn btn--ghost" type="button" data-voice-test>Test voice</button>
            </p>
          </div>`
        : ''}

      ${/* The length is set here in the same control the step screen uses,
            so the number is met before it starts counting and the stepper
            is already familiar when it appears mid-rep. The note says the
            one thing the switch's label cannot: that the rep question is
            never turned over for them. */ ''}
      ${pacePref.auto
        ? html`<div class="voice-note pace-note">
            <div class="rep-counter pace-counter">
              <span class="label">
                Seconds on each step
                <small>Change it mid-practice from the step screen</small>
              </span>
              ${paceStepper()}
            </div>
            <p class="section-note">
              Each step stays up for that long, then the next one comes on its own. Tap
              the picture or Next to move sooner. The question at the end of every rep
              waits for you: that one is yours to answer.
            </p>
          </div>`
        : ''}
    </div>
  `;
}

/**
 * The seconds-per-step control, shared by the get-ready screen and the strip
 * on the step screen. One control, one handler, one stored number: what the
 * strip changes is what the get-ready screen shows next time, and there is
 * no settings page to go and check.
 *
 * The ends are disabled rather than wrapping. A stepper that jumps from
 * ninety to five is a stepper that just cost somebody a rep.
 */
function paceStepper() {
  const { seconds } = getPace();
  const at = PACE_LADDER.indexOf(seconds);
  return html`<div class="stepper stepper--pace">
    <button
      type="button"
      data-pace="-1"
      aria-label="Less time on each step"
      ${at <= 0 ? 'disabled' : ''}
    >
      −
    </button>
    <output data-pace-out aria-live="polite">${seconds}s</output>
    <button
      type="button"
      data-pace="1"
      aria-label="More time on each step"
      ${at >= PACE_LADDER.length - 1 ? 'disabled' : ''}
    >
      +
    </button>
  </div>`;
}

function readyScreen(activity, level) {
  const cover = IMAGES[activity.coverImage];

  return html`
    ${topBar('Get ready', 0, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <figure class="step-figure">
          <img src="${cover.src}" alt="${cover.alt}" />
        </figure>
        <p class="step-count">Level ${level.number} · ${level.title}</p>
        <h1 class="step-instruction">${level.setup}</h1>

        ${/* Says the one thing the flow itself only reveals at the last
              picture: walking the steps IS the rep. It sat at the foot of this
              screen, under the checklist and the hands-free panel, which on a
              first run is below the fold — and a first-timer tapped Next five
              times waiting for the counting to start. Directly under the
              instruction, it is the first sentence read. */ ''}
        <p class="section-note" style="margin-top: var(--s-3)">
          About ${activity.estimatedMinutes} minutes. Walking the ${stepsForLevel(activity, level).length} steps
          once is one rep; aim for ${repTarget(level)} and stop early if ${getDog().name} is
          still doing well.
        </p>

        <div class="result-group">
          <h2>Before you start</h2>
          <div class="chips">
            ${join(
              activity.equipment.map(
                (item, i) => html`<button
                  type="button"
                  class="chip"
                  data-ready="${i}"
                  aria-pressed="${String(session.ready.has(String(i)))}"
                >
                  ${item}
                </button>`
              )
            )}
          </div>
        </div>

        ${/* Folded away until the household has finished a session of its
              own. Two switches and a voice picker on the screen that starts
              the very first session is a decision about how sessions run
              being asked of someone who has not yet seen one. After that it
              is open, where the pace can be set before the leash is in hand. */ ''}
        ${getState().sessions.some((s) => !s.demo)
          ? handsFreeGroup()
          : html`<details class="disclosure">
              <summary>Hands free</summary>
              <div class="disclosure-body">${handsFreeGroup({ heading: false })}</div>
            </details>`}

        ${/* No cue list here. Every cue in the level shown together under one
              "Say" heading read as a line to deliver before starting, when they
              belong to four separate moments — the bed, the stay, the door, the
              release. Each one appears on the step that needs it. */ ''}
      </div>
    </div>
    <div class="player-foot">
      <button class="btn btn--lg btn--block" type="button" data-start>Start practice</button>
    </div>
  `;
}

/**
 * The clock, on screen, the whole time it is running.
 *
 * A timer with no visible state is a button that presses itself with no
 * warning. So the strip shows the count and holds the two things a handler
 * mid-rep might want from it: a pause, and more or less time. The control to
 * stop a clock belongs next to the evidence it is running, and the length
 * belongs where it is felt to be wrong — on the step that was too short.
 *
 * Not rendered on the last step, where there is nothing to count down to:
 * the rep question is answered by a thumb or not at all.
 *
 * The count is hidden from assistive tech on purpose. A number changing once
 * a second is noise to a screen reader, and the fact it carries — the step
 * turned over — is announced by the new step taking focus, the same way a
 * tap on Next announces itself. The pause button's own label says which
 * state the clock is in.
 */
function paceStrip(isLast) {
  if (!getPace().auto || isLast) return '';
  return html`<div class="pace-strip" role="group" aria-label="Moving on by itself">
    <button type="button" class="pace-toggle" data-pace-pause>
      <span class="pace-mark" aria-hidden="true">${icon(pace.paused ? 'play' : 'pause')}</span>
      <span>${pace.paused ? 'Resume' : 'Pause'}</span>
    </button>
    <span class="pace-count" data-pace-count aria-hidden="true">
      ${pace.paused ? 'Paused' : 'Waiting'}
    </span>
    <span class="pace-step-label">Each step</span>
    ${paceStepper()}
  </div>`;
}

function stepScreen(activity, level) {
  const steps = stepsForLevel(activity, level);
  const step = steps[session.stepIndex];
  const img = step.image ? IMAGES[step.image] : null;
  const isLast = session.stepIndex === steps.length - 1;

  // The pass being walked right now is a rep in progress, so it gets a number
  // from the start: the first time through is rep one, not a rehearsal for a
  // count that begins at zero. Completed reps come from the log as always.
  const count = session.repLog.length;
  const good = session.repLog.filter(Boolean).length;
  const target = repTarget(level);
  const rep = count + 1;
  const met = count >= target;
  // Not while the steps turn by themselves: a shortcut for moving on is a
  // strange thing to teach somebody who has just asked not to have to.
  const showAdvanceHint =
    !isLast &&
    !getPace().auto &&
    count === 1 &&
    session.stepIndex === 0 &&
    !hintSeen('tap-to-advance');

  return html`
    ${topBar(
      rep <= target ? `Rep ${rep} of ${target}` : `Rep ${rep}`,
      count + session.stepIndex / steps.length,
      target,
      `Rep ${rep}${rep <= target ? ` of ${target}` : ''}, step ${session.stepIndex + 1} of ${steps.length}`
    )}
    <div class="player-scroll">
      <div class="player-inner">
        ${/* One step in the app shows both outcomes. `avoid` on the step is
              what asks for it, and everything without one renders as it always
              has — a pair is a property of the step, not a new kind of screen.

              Two <figure>s rather than one with two images: each picture needs
              its own caption, a <figure> takes one <figcaption>, and the
              caption is doing real work here. It is the only thing saying which
              of the two is which, because the style rules out a ✗ painted into
              the artwork and the pilot showed one was not needed. A screen
              reader gets the alt and the verdict together, in that order.

              Side by side rather than stacked: the comparison is the point, and
              stacking them puts a scroll between the two halves of it. */ ''}
        ${img && step.avoid && IMAGES[step.avoid]
          ? html`<div class="step-pair">
              <figure class="step-pair-item">
                <img src="${img.src}" alt="${img.alt}" />
                <figcaption>Like this</figcaption>
              </figure>
              <figure class="step-pair-item step-pair-item--avoid">
                <img src="${IMAGES[step.avoid].src}" alt="${IMAGES[step.avoid].alt}" />
                <figcaption>Not this</figcaption>
              </figure>
            </div>`
          : img
            ? html`<figure class="step-figure" ${isLast ? '' : 'data-advance'}>
                <img src="${img.src}" alt="${img.alt}" />
                ${/* Said once, on the first step of the second rep: by then
                      they have walked the pictures once and know what the
                      cycle is, so "tap the picture" is a shortcut rather than
                      one more instruction to absorb. Tapping it dismisses the
                      hint by using the thing it points at. */ ''}
                ${showAdvanceHint
                  ? html`<figcaption class="advance-hint">
                      Tap the picture to move on
                    </figcaption>`
                  : ''}
              </figure>`
            : ''}

        ${/* The top bar carries the rep; this line carries the place within
              it. Both series are real now — which rep, and where in it — so
              each gets printed exactly once. */ ''}
        <p class="step-count">Step ${session.stepIndex + 1} of ${steps.length}</p>
        <h1 class="step-instruction">${step.instruction}</h1>

        ${step.cue
          ? html`<div class="say">
              <span class="label">Say</span>
              <span class="cue">“${resolveCue(step.cue)}”</span>
            </div>`
          : ''}

        ${/* Closed by default, always. It used to spring open on the first run
              of an activity, which pushed the instruction up the screen and put
              a paragraph of reasoning between the step and the thumb reaching
              for Next. The step is the screen; the reasoning is there when it
              is wanted. */ ''}
        ${step.helper
          ? html`<details class="disclosure" data-why>
              <summary>Why this matters</summary>
              <div class="disclosure-body">${step.helper}</div>
            </details>`
          : ''}

        ${/* The rep ends here, so the question is asked here — on the same
              screen as the last picture, not on a separate static tally.
              Either answer counts the rep and wraps back to step one.

              Grouped and labelled by the question: the two buttons say what
              they mean on their own, but somebody tabbing straight to them
              would otherwise never hear which rep they are answering for. */ ''}
        ${isLast
          ? html`<div
              class="tally-actions"
              style="margin-top: var(--s-3)"
              role="group"
              aria-labelledby="rep-question"
            >
              <p class="step-count" id="rep-question" style="margin-bottom: var(--s-2)">
                That was rep ${rep}. How did it go?
              </p>
              ${/* The yardstick, at the moment of judgment.
                    ---------------------------------------------------------
                    By rep four the walkthrough is muscle memory, and the risk
                    of that is not the setup pictures — habituating on "stand
                    near the door" is competence, and worth having. The risk
                    is this tap. "That went well" answered from reflex instead
                    of from observation quietly inflates the log, and the log
                    is what mastery, level changes and every recommendation
                    are computed from. An app whose whole argument is
                    observations-not-defaults cannot let its one observation
                    decay into a default.

                    The level already states what a good rep is; it was just
                    kept on the activity page, which is a screen you read
                    before practice and never during it. So the definition was
                    being recalled from memory at the one moment it needed to
                    be read. This is a checklist at the decision point: no
                    extra taps, no friction, and — the property that matters
                    here — a device that keeps working under repetition rather
                    than wearing out from it. */ ''}
              ${/* One flowing line rather than a bulleted list. The list cost
                    106px on the one screen that cannot afford them: it pushed
                    "Not that one" past the fold while "That went well" stayed
                    in reach, which is a thumb-shaped bias toward the
                    optimistic answer — the exact distortion this block exists
                    to prevent. Both answers have to be equally cheap to give
                    or the yardstick is worse than none. */ ''}
              ${level.successCriteria && level.successCriteria.length
                ? html`<p class="rep-criteria">
                    <span class="rep-criteria-label">Went well means</span>
                    ${join(
                      level.successCriteria.map(
                        (c, i) => html`${i ? html`<span aria-hidden="true"> · </span>` : ''}${c}`
                      )
                    )}
                  </p>`
                : ''}
              ${/* Miss on the left, went-well on the right.
                    -----------------------------------------------------------
                    Every other pair of buttons in this app puts the quiet one
                    on the left and the one that carries on to the right — the
                    footer's Previous and Next, Keep going and End and log,
                    Cancel and Confirm. These two were the single exception,
                    and an app that puts its main action on the right four
                    times and on the left once has not made a point, it has
                    made a mistake somebody will pay for at speed.

                    It does hand the common answer the easier thumb, which is
                    the bias these buttons were rebuilt to remove. That fix
                    was about a gap of a whole scroll, though, not of one
                    thumb-width between adjacent controls, and the things
                    that carried it — identical size, identical weight, the
                    yardstick sitting above both — are all still here. The
                    only difference left between them is fill.

                    "Went well", not "That went well": it is the exact phrase
                    the criteria above define, and the longer version wrapped
                    at half width. */ ''}
              <div class="tally-answers">
                <button class="btn btn--quiet tally-miss" type="button" data-rep="0">
                  Not that one
                </button>
                <button class="btn btn--lg tally-good" type="button" data-rep="1">
                  Went well
                </button>
              </div>
            </div>`
          : ''}
        ${/* One row for everything to do with the count, rather than a stack
              of ways to stop.

              A rep that falls apart at step two is still a rep, and the honest
              record is a miss — without a way to say so, the only option was
              to walk the rest of the pictures pretending the rep was still
              running, and the count drifted toward optimism. But that is a
              correction, not a second primary action: as a full-width button
              it made four bail-outs visible at once on the calmest screen in
              the app and pushed "too excited" past the fold. Corrections live
              in this strip, at text weight, next to the other one.

              The strip therefore appears whenever either half has something to
              offer: mid-pass (log this one as a miss) or after a rep (undo
              it). */ ''}
        ${paceStrip(isLast)}
        ${count > 0 || !isLast
          ? html`<div class="rep-strip ${session.celebrate ? 'rep-strip--celebrate' : ''}">
              <p class="rep-strip-count">
                ${count > 0
                  ? html`<b>${count}</b> counted · <b>${good}</b> went well${met
                      ? html` · <em>target met — finish on a win</em>`
                      : ''}`
                  : rep === 1
                    ? html`Rep 1 in progress · you say how it went after step ${steps.length}`
                    : html`Rep ${rep} in progress`}
              </p>
              ${/* Both, when both apply. Undo has to survive mid-pass: the
                    likeliest moment to want it is the tap straight after a
                    fat-fingered answer, which lands on step one of the next
                    rep. */ ''}
              <div class="rep-strip-actions">
                ${!isLast
                  ? html`<button class="btn btn--ghost" type="button" data-rep-abort>
                      Count as a miss
                    </button>`
                  : ''}
                ${count > 0
                  ? html`<button class="btn btn--ghost" type="button" data-rep-undo>
                      Undo last rep
                    </button>`
                  : ''}
              </div>
            </div>`
          : ''}

        ${/* Finishing sits with the count it acts on, not in the footer with
              the step controls. It is a statement about the session — this
              one is over, save it — and the strip above is where the session
              already reports itself. Full width, so the label has room to
              stay on one line, and quiet, because pressing it is a decision
              rather than the way forward. */ ''}
        ${count > 0
          ? html`<button
              class="btn ${met ? '' : 'btn--quiet'} btn--block finish-session"
              type="button"
              data-finish-practice
            >
              Finish session
            </button>`
          : ''}

        <div class="panic-slot">
          <button class="btn btn--caution panic" type="button" data-panic>
            ${getDog().name} is too excited
          </button>
        </div>
      </div>
    </div>
    ${/* The footer walks the steps. Nothing else.
          -------------------------------------------------------------------
          It held three buttons — Previous step, Finish session, Next step —
          and the three labels cannot be made to fit a phone: at 13px, below
          anything this app would set, they still want 375px of a 343px row.
          So they wrapped to two lines each, came out three different widths,
          and the last one ran off the edge of the screen.

          Squeezing was the wrong answer anyway, because the three are not
          peers. Next is pressed about twenty-five times in a session, Previous
          is a correction, and Finish happens once. Standing a once-a-session
          action permanently beside the most-pressed one is what created the
          crowding, and equal sizing would have made three unequal things look
          alike.

          So navigation keeps the footer, in two halves that are genuinely
          equal because those two genuinely are peers, and Finish moves up to
          sit with the count it acts on. */ ''}
    <div class="player-foot">
      <div class="btn-row btn-row--split">
        <button
          class="btn btn--quiet"
          type="button"
          data-prev
          ${session.stepIndex === 0 ? 'disabled' : ''}
        >
          Previous step
        </button>
        ${/* On the last step the rep question is the way on, so there is no
              Next to offer and Previous takes the row alone. */ ''}
        ${/* When the steps turn by themselves the button fills as the clock
              runs, so from arm's length it can be seen to be about to press
              itself. The fill is a span rather than a background so the
              label stays put above it. */ ''}
        ${isLast
          ? ''
          : getPace().auto
            ? html`<button class="btn btn--pace" type="button" data-next>
                <span class="btn-fill" aria-hidden="true"></span>
                <span class="btn-pace-label">Next step</span>
              </button>`
            : html`<button class="btn" type="button" data-next>Next step</button>`}
      </div>
    </div>
  `;
}

function fallbackSheet(activity) {
  const img = IMAGES[activity.fallbackImage];
  return html`
    <div class="sheet-backdrop" data-sheet-backdrop>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <h2 id="sheet-title">Take the pressure off</h2>
        <p>None of this is a failure. Make it easier and finish on a win.</p>
        <img src="${img.src}" alt="${img.alt}" />
        <ul class="notes-list notes-list--calm">
          ${join(activity.fallbackSteps.map((s) => html`<li>${s}</li>`))}
        </ul>
        ${/* The advice survives losing the phone link; only the second half of
              the sentence goes. This is the one place in the app that offers
              the trainer's number mid-session — shown while somebody is having
              a hard time, which is when they are likeliest to take it, and the
              single strongest reason a live number could not stay in a build
              that gets handed around. */ ''}
        <p class="sheet-trainer">
          Still stuck after making it easier? That is exactly what your trainer is
          for.${TRAINER.phone
            ? html` Bring it to your next lesson, or
                <a href="tel:${TRAINER.phone}">call ${TRAINER.name}</a>.`
            : html` Bring it to your next lesson with ${TRAINER.name}.`}
        </p>
        <div class="btn-row" style="margin-top: var(--s-5)">
          <button class="btn btn--quiet" type="button" data-sheet-close>Keep going</button>
          <button class="btn" type="button" data-sheet-end>End and log</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * One question, four big targets, done. The reps were counted as they
 * happened, so how-she-felt is the only thing left worth asking.
 */
function resultScreen(activity, level) {
  return html`
    ${topBar('How did it go', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <p class="step-count">${activity.title} · Level ${level.number}</p>
        <h1 class="step-instruction">How did ${getDog().name} do?</h1>
        <p class="section-note">
          One tap saves it. You can add detail after.
        </p>

        <div class="result-group">
          <div class="options options--tall" role="group" aria-label="Overall arousal">
            ${join(
              AROUSAL.map(
                (a) => html`<button
                  type="button"
                  class="option"
                  data-arousal-save="${a.value}"
                >
                  <span>
                    <strong>${a.label}</strong>
                    <small>${a.hint}</small>
                  </span>
                </button>`
              )
            )}
          </div>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <button class="btn btn--ghost btn--block" type="button" data-back-practice>
        Back to counting
      </button>
    </div>
  `;
}

/** Everything optional, reached deliberately from the recommendation screen. */
function detailScreen(activity, level) {
  const needsRecovery =
    session.arousal >= 3 ||
    ['barked', 'jumped', 'nipped', 'pulled'].some((b) => session.behaviors.has(b));

  return html`
    ${topBar('Add detail', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <p class="step-count">${activity.title} · Level ${level.number}</p>
        <h1 class="step-instruction">Anything to add?</h1>
        <p class="section-note">
          Already saved. Everything here is optional.
        </p>

        <div class="result-group">
          <h2>What happened?</h2>
          <div class="chips">
            ${join(
              BEHAVIORS.map(
                (b) => html`<button
                  type="button"
                  class="chip ${b.tone === 'watch' ? 'chip--watch' : ''}"
                  data-behavior="${b.id}"
                  aria-pressed="${String(session.behaviors.has(b.id))}"
                >
                  ${b.label}
                </button>`
              )
            )}
          </div>
        </div>

        <div class="result-group">
          <h2>Correct the counts</h2>
          <div class="rep-counter">
            <span class="label">Total <small>How many you ran</small></span>
            <div class="stepper">
              <button type="button" data-reps="-1" aria-label="One fewer repetition">−</button>
              <output data-reps-out aria-live="polite">${session.reps}</output>
              <button type="button" data-reps="1" aria-label="One more repetition">+</button>
            </div>
          </div>
          <div class="rep-counter" style="margin-top: var(--s-2)">
            <span class="label">Went well <small>Out of ${session.reps}</small></span>
            <div class="stepper">
              <button type="button" data-ok="-1" aria-label="One fewer successful repetition">−</button>
              <output data-ok-out aria-live="polite">${session.successes}</output>
              <button type="button" data-ok="1" aria-label="One more successful repetition">+</button>
            </div>
          </div>
        </div>

        <div class="result-group">
          <h2>Help you gave</h2>
          <div class="chips">
            ${join(
              ASSISTANCE.map(
                (a) => html`<button
                  type="button"
                  class="chip"
                  data-assist="${a.id}"
                  aria-pressed="${String(session.assistance.has(a.id))}"
                >
                  ${a.label}
                </button>`
              )
            )}
          </div>
        </div>

        ${needsRecovery
          ? html`<div class="result-group">
              <h2>How long to settle?</h2>
              <div class="options" role="group" aria-label="Recovery time">
                ${join(
                  RECOVERY_BANDS.map(
                    (r) => html`<button
                      type="button"
                      class="option"
                      data-recovery="${r.id}"
                      aria-pressed="${String(session.recoveryBand === r.id)}"
                    >
                      <span><strong>${r.label}</strong></span>
                    </button>`
                  )
                )}
              </div>
            </div>`
          : ''}

        <div class="result-group field">
          <label for="session-note">A note for the trainer</label>
          <textarea id="session-note" rows="3" data-note>${session.note}</textarea>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <button class="btn btn--lg btn--block" type="button" data-save-detail>Done</button>
    </div>
  `;
}

/**
 * What this session did to the program.
 *
 * The bar is rendered at the width it had *before* the session and moved to
 * its new width on mount, so the household watches the thing advance instead
 * of being told it did. It is the only animation in the app that carries
 * information rather than choreography.
 */
function programBand(gain, before) {
  if (!gain) return '';
  const prog = gain.program;
  const from = Math.round(before.ratio * 100);
  const to = Math.round(prog.ratio * 100);
  const moved = gain.clearedLevel !== null;

  return html`<div class="program-band ${moved ? 'program-band--moved' : ''}">
    <div class="program-band-top">
      <span>${prog.program.title}</span>
      <b data-count-to="${prog.cleared}">${moved ? before.cleared : prog.cleared}</b>
    </div>
    <div
      class="meter"
      role="img"
      aria-label="${prog.cleared} of ${prog.total} levels cleared in ${prog.program.title}"
    >
      <span style="width: ${Math.max(from, before.cleared ? 4 : 0)}%" data-grow-to="${to}"></span>
    </div>
    <p>
      ${moved
        ? `Level ${gain.clearedLevel} cleared. ${prog.cleared} of ${prog.total} in the program.`
        : `${prog.cleared} of ${prog.total} levels cleared.`}
    </p>
  </div>`;
}

/** The one that is worth stopping for: a whole activity finished. */
function stageCelebration(gain) {
  if (!gain) return '';
  const prog = gain.program;

  if (gain.completedProgram) {
    const outcome = prog.program.outcome;
    return html`<div class="finale finale--program">
      ${icon('spark')}
      <p class="eyebrow">All four finished</p>
      <h2>${outcome.title}</h2>
      <p>${outcome.note}</p>
      <a class="btn btn--block" href="#/progress" style="margin-top: var(--s-4)"
        >See the whole picture</a
      >
    </div>`;
  }

  if (!gain.completedActivity) return '';
  const next = gain.upNext;
  return html`<div class="finale">
    ${icon('spark')}
    <p class="eyebrow">Activity ${gain.stage.number} of ${prog.stages.length} finished</p>
    <h2>${gain.stage.activity.title} is done</h2>
    ${next
      ? html`<p>
            Every level cleared. Next in the program is
            <strong>${next.activity.title}</strong>. ${next.activity.shortPurpose}
          </p>
          <a class="btn btn--block" href="#/activity/${next.activity.slug}"
            style="margin-top: var(--s-4)"
            >Open ${next.activity.title}</a
          >`
      : html`<p>Every level cleared.</p>`}
  </div>`;
}

/**
 * A level crossing the clear line, given its own moment.
 *
 * This was a clause inside the program band's sentence: "Level 3 cleared. 7 of
 * 23 in the program." Clearing a level is the largest thing earnable inside an
 * activity and the only one that moves the map, so it gets the stamp and the
 * pips that go with it. It fires exactly when programGain says a level crossed,
 * which is the same condition the map redraws on.
 */
function clearedBanner(gain, level) {
  if (!gain || gain.clearedLevel === null) return '';
  const stage = gain.stage;
  // Six particles behind the seal, thrown outward once as the banner lands.
  // Markup rather than pseudo-elements because six directions need six
  // elements; aria-hidden because they are pure celebration and a screen
  // reader has the "Level cleared" heading one line down. The done screen
  // renders once per arrival, so this plays once — the one place a burst is
  // earned, and the only place it happens.
  return html`<div class="cleared">
    <span class="cleared-burst" aria-hidden="true">
      <i></i><i></i><i></i><i></i><i></i><i></i>
    </span>
    <div class="cleared-seal">${icon('check')}</div>
    <h2>Level ${level.number} cleared</h2>
    <p>${stage.cleared} of ${stage.total} in ${stage.activity.title}</p>
    <div class="cleared-pips">${levelPips(stage)}</div>
  </div>`;
}

function doneScreen(activity, level) {
  const advice = session.advice;
  const saved = session.saved;
  const rate = saved.repetitions ? saved.successfulRepetitions / saved.repetitions : 0;
  const milestone = session.milestone;

  // The verdict is a picture of Lucy, keyed by the verdict itself rather than
  // by advice.suggest. Before the pictures, a stroke mark stood here and
  // followed `suggest` — but that has three values for seven verdicts, so
  // "Nice progress" and "Take the pressure off" wore the same check, and it
  // was the check the "Level N cleared" seal below already uses. Seven
  // verdicts, seven pictures; the field colour behind Lucy says which.
  //
  // No fallback for a key without a picture: `pilot.mjs verify` fails on one
  // before it ships, which is the check that should catch it. The explicit
  // width and height are the 1448×482 the file is, so the box exists before
  // the JPEG does and the title beneath does not jump when it arrives.
  const art = VERDICT_ART[advice.key];

  return html`
    ${topBar('Done', 1, 1)}
    <div class="player-scroll">
      <div class="player-inner">
        <div class="recommend">
          <img class="verdict-art" src="${art.src}" alt="${art.alt}" width="1448" height="482" />
          <h1>${advice.title}</h1>
          <p>${advice.body}</p>
        </div>

        ${clearedBanner(session.gain, level)}

        ${/* Directly under the verdict, because it is the instruction on this
              screen and everything below it is a receipt. It sat last, after
              the stats, the program band and the detail button, which put the
              one line telling the household where to go next below the fold on
              a 812pt phone.

              It says both halves of what happens: the level this activity will
              open on when they return, and which activity the program is
              pointing at now. Those are not the same fact, and promising only
              the first made the app contradict itself one screen later. */ ''}
        ${session.advanced ? levelMovedNotice(activity, level, session) : ''}


        ${milestone
          ? html`<div class="milestone-climb">
              ${/* Name the axis, because there are two and they were being
                    stated as if they were one. Directly above this the screen
                    says "Level 2 cleared", and this used to answer "Level 2 is
                    now Almost there" — which reads as a contradiction rather
                    than as a second measure.
                    Cleared means the level is behind them and the next one is
                    open. This is how consistent it has been so far, which is
                    what the ladder underneath is a picture of. */ ''}
              <p>
                ${milestone.to.id === 'reliable'
                  ? html`Held up over time: <strong>Reliable</strong>. Three sessions, three
                      days, barely any help.`
                  : html`Held up over time so far:
                      <strong>${milestone.to.label}</strong>.`}
              </p>
              ${masteryLadder(milestone.to, { from: milestone.from })}
            </div>`
          : ''}

        <div class="stat-row">
          <div class="stat">
            <b>${saved.successfulRepetitions}/${saved.repetitions}</b>
            <span>Went well</span>
          </div>
          <div class="stat">
            <b>${pct(saved.repetitions ? rate : null)}</b>
            <span>Success</span>
          </div>
          <div class="stat">
            <b>${AROUSAL.find((a) => a.value === saved.arousalLevel).short}</b>
            <span>Arousal</span>
          </div>
        </div>

        ${programBand(session.gain, session.programBefore)}
        ${stageCelebration(session.gain)}

        <button class="btn btn--quiet btn--block" type="button" data-detail
          style="margin-top: var(--s-4)">
          ${session.detailAdded ? 'Edit detail' : 'Add detail'}
        </button>

      </div>
    </div>
    <div class="player-foot">
      <div class="btn-row">
        <button class="btn btn--quiet" type="button" data-again>Practice again</button>
        <button class="btn" type="button" data-finish>Finish</button>
      </div>
    </div>
  `;
}

/**
 * What the household should expect next, after a session that earned a level.
 *
 * Two facts, and they are not the same fact: the level this activity will
 * open on when they come back to it, and which activity the program is
 * actually pointing at now.
 */
function levelMovedNotice(activity, level, session) {
  const prog = programProgress(activity.programId);
  const nextActivity = prog.focus.activity;
  const movedOn = nextActivity.id !== activity.id;

  return html`<div class="level-moved" style="margin-top: var(--s-5)">
    <p>
      <strong>${activity.shortTitle} level ${session.advanced}</strong> is saved
      for when you come back to it.
    </p>
    ${movedOn
      ? html`<p class="level-moved-next">
          Up next: <strong>${nextActivity.title}</strong>.
        </p>`
      : ''}
    <button class="btn btn--ghost btn--block" type="button" data-stay>
      Stay at level ${level.number} instead
    </button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Render + behavior
// ---------------------------------------------------------------------------

function render({ slug }) {
  const activity = activityBySlug(slug);
  if (!activity) return html`<div class="screen"><p>Activity not found.</p></div>`;
  // A parked activity resolves by slug perfectly well, so /play has to check
  // availability itself rather than trusting that no screen links here.
  if (!isAvailable(activity)) {
    return html`<div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Coming soon</p>
        <h1>${activity.title}</h1>
        <p>This one is not in the app yet. It arrives with the next handout.</p>
      </div>
      <a class="btn btn--quiet" href="#/activities">Back to activities</a>
    </div>`;
  }

  if (!session || session.slug !== slug) {
    begin(activity, currentLevel(activity));
  }
  if (skipReadyOnce) {
    skipReadyOnce = false;
    if (session.phase === 'ready') {
      session.phase = 'step';
      session.startedAt = Date.now();
      keepAwake();
    }
  }
  const level = levelOf(activity, session.levelNumber);

  let body;
  if (session.phase === 'ready') body = readyScreen(activity, level);
  else if (session.phase === 'step') body = stepScreen(activity, level);
  else if (session.phase === 'result') body = resultScreen(activity, level);
  else if (session.phase === 'detail') body = detailScreen(activity, level);
  else body = doneScreen(activity, level);

  return html`<div class="player">${body}</div>
    ${session.sheetOpen ? fallbackSheet(activity) : ''}`;
}

/**
 * Re-render the player in place. `direction` choreographs the change:
 * 'forward' and 'back' slide with the direction of travel; omitted means an
 * in-place data update with no motion (chip toggles, tally taps).
 */
function refresh(direction) {
  const update = () => {
    const root = document.getElementById('app');
    // An in-place update keeps its place. Re-rendering replaces the scrolling
    // element, which starts a new one at the top, so toggling a chip halfway
    // down the get-ready screen threw the reader back to the picture and left
    // them to find their way down again. A move between steps still starts at
    // the top, because that is a new screen rather than the same one changed.
    const scroller = direction ? null : root.querySelector('.player-scroll');
    const top = scroller ? scroller.scrollTop : 0;
    root.innerHTML = String(render({ slug: session.slug }));
    if (top) {
      const next = root.querySelector('.player-scroll');
      if (next) next.scrollTop = top;
    }
    wire(root);
  };
  if (direction) withTransition(update, direction);
  else update();
}

/** Fetch the next step's illustration while this one is being read. The steps
 *  loop, so from the last step "next" is the first one again. */
function preloadUpcoming(activity, level) {
  const steps = stepsForLevel(activity, level);
  const next = steps[(session.stepIndex + 1) % steps.length];
  if (next && next.image) new Image().src = IMAGES[next.image].src;
  if (next && next.avoid && IMAGES[next.avoid]) new Image().src = IMAGES[next.avoid].src;
}

/**
 * Move the program bar from where it was to where it is, one frame after the
 * screen paints. Under prefers-reduced-motion the CSS transition is off, so
 * this just sets the final value and the count lands immediately.
 */
function animateProgramBand(root) {
  const fill = root.querySelector('.program-band [data-grow-to]');
  if (!fill) return;
  const count = root.querySelector('.program-band [data-count-to]');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fill.style.width = `${Math.max(Number(fill.dataset.growTo), 4)}%`;
      if (count) count.textContent = count.dataset.countTo;
    });
  });
}

/**
 * Bring the voice and the clock into line with the screen that just
 * rendered. Called at the end of every wire, and idempotent on purpose: the
 * step cycle re-renders on every tap.
 */
function syncHandsFree(steps) {
  const voice = getVoice();
  const onStepScreen = session.phase === 'step' && !session.sheetOpen;

  // Speaking ----------------------------------------------------------------
  // A fallback only. Every ordinary step change speaks from its own click
  // handler instead — see speakStep — because this runs at the end of a
  // render, and renders that move between steps happen inside a view
  // transition, one turn of the event loop after the tap that caused them.
  // iOS Safari will only start speech during a gesture, and a callback that
  // late no longer counts as one, which is why the steps were silent while
  // the switch's own confirmation spoke perfectly well. What is left here
  // covers arriving on a step without having tapped in the player at all,
  // such as Today's jump-back-in.
  if (voice.speak && canSpeak() && onStepScreen) speakStep(steps);
  else if (!voice.speak) spokenKey = '';

  // The clock ---------------------------------------------------------------
  // After the speech, so a step that is being read is seen as busy and the
  // clock waits for the voice rather than racing it.
  syncPace();
}

/**
 * Redraw every copy of the seconds control after a change, without a
 * re-render. There are two on the step screen at most — the strip's — and
 * one on get-ready; whichever screen is up, all of them have to agree.
 */
function paintPaceSetting(root) {
  const { seconds } = getPace();
  const at = PACE_LADDER.indexOf(seconds);
  root.querySelectorAll('[data-pace-out]').forEach((o) => (o.textContent = `${seconds}s`));
  root.querySelectorAll('[data-pace="-1"]').forEach((b) => (b.disabled = at <= 0));
  root
    .querySelectorAll('[data-pace="1"]')
    .forEach((b) => (b.disabled = at >= PACE_LADDER.length - 1));
}

function wire(root) {
  const activity = activityBySlug(session.slug);
  const level = levelOf(activity, session.levelNumber);
  const steps = stepsForLevel(activity, level);

  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  const toggleSet = (set, value) => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  };

  // A fresh screen is a fresh step, as far as the clock is concerned. Stopped
  // here and started again at the end of this function, once the buttons it
  // paints into exist.
  stopPaceFrame();

  // The guard belongs to the session, not to a screen, so it is armed from
  // whichever render first has something to lose and stays armed across every
  // re-render until the session is saved or abandoned.
  if (isUnsaved()) armExitGuard();
  else disarmExitGuard(true);

  on('[data-exit]', 'click', () => {
    if (!isUnsaved()) {
      leavePlayer();
      return;
    }
    // A step that turned over behind the question would be answered about a
    // screen nobody was looking at.
    holdPace(true);
    confirmSheet({
      title: 'Leave practice?',
      body: 'Nothing from this session is saved yet.',
      confirmLabel: 'Leave',
      cancelLabel: 'Keep going',
      onConfirm: leavePlayer,
      onDismiss: () => holdPace(false),
    });
  });

  on('[data-ready]', 'click', (e) => {
    toggleSet(session.ready, e.currentTarget.dataset.ready);
    e.currentTarget.setAttribute(
      'aria-pressed',
      String(session.ready.has(e.currentTarget.dataset.ready))
    );
  });

  // Hands-free ---------------------------------------------------------------
  on('[data-voice-speak]', 'click', () => {
    const next = !getVoice().speak;
    setVoice({ speak: next });
    if (!next) stopSpeaking();
    // Say something the moment it is switched on. A voice setting that stays
    // silent until the next screen leaves somebody wondering whether the
    // phone is muted, and the answer to that question should not be "start a
    // session and find out".
    else speak('Steps will be read aloud.');
    refresh();
  });

  // Reports what actually happened rather than assuming it worked. The
  // status is updated in place so the tap is not spent on a re-render, which
  // on iOS is also the thing that would end the gesture.
  // Auditioned on the spot: a list of voice names tells you nothing about
  // what they sound like, and picking one is the moment you want to hear it.
  // Spoken from the change event so it is still the interaction, which is
  // what iOS requires, and updated in place so nothing re-renders under it.
  // The list is usually empty at the first render and fills in later, so the
  // screen that asked for it has to be told. Redrawn in place, which keeps
  // the scroll position where the reader left it.
  if (root.querySelector('[data-voices-pending]')) {
    onVoicesReady(() => {
      if (session && session.phase === 'ready' && getVoice().speak) refresh();
    });
  }

  on('[data-voice-select]', 'change', (e) => {
    setPreferredVoice(e.currentTarget.value);
    const out = root.querySelector('[data-speech-status]');
    if (out) out.textContent = `Using ${currentVoiceName() || 'default voice'}.`;
    speak(`This is ${getDog().name}'s practice voice.`);
  });

  on('[data-voice-test]', 'click', () => {
    speak(`This is ${getDog().name}'s practice voice.`);
    const out = root.querySelector('[data-speech-status]');
    if (!out) return;
    const say = (msg) => {
      out.textContent = msg;
    };
    say('Speaking…');
    setTimeout(() => {
      const { state, error } = speechStatus();
      if (state === 'speaking' || state === 'done') {
        say(`Working — ${currentVoiceName() || 'default voice'}.`);
      } else if (state === 'error') {
        say(`This device refused to speak (${error}).`);
      } else {
        // Queued and never started is the iOS silence: no sound, no error.
        say('No sound. Check the side switch is not on silent, and the volume.');
      }
      // Speaking is what populates the voice list on iOS. If that just
      // happened and the picker is still missing, draw it now — this tap is
      // the likeliest moment the list ever becomes available.
      if (!root.querySelector('[data-voice-select]') && listVoices().length) refresh();
    }, 1400);
  });

  // The clock -----------------------------------------------------------------
  on('[data-pace-auto]', 'click', () => {
    setPace({ auto: !getPace().auto });
    pace.paused = false;
    refresh();
  });

  // In place, not a re-render: this is the control most likely to be tapped
  // with the clock running and a dog waiting, and the whole screen redrawing
  // under the thumb is what a second tap would land on. The new length
  // starts now — a step that was too short is given the longer one, whole.
  on('[data-pace]', 'click', (e) => {
    stepPace(Number(e.currentTarget.dataset.pace));
    paintPaceSetting(root);
    stopPaceFrame();
    syncPace();
  });

  on('[data-pace-pause]', 'click', () => {
    pace.paused = !pace.paused;
    refresh();
  });

  // Reading is a reason to wait, and closing the drawer is a reason to stop
  // waiting. Both go through the one sync so the rules stay in one place.
  on('[data-why]', 'toggle', () => syncPace());

  on('[data-start]', 'click', () => {
    session.phase = 'step';
    session.stepIndex = 0;
    session.startedAt = Date.now();
    keepAwake();
    // Before the refresh, deliberately: this is still the tap, and the
    // refresh is where the gesture ends as far as iOS is concerned.
    speakStep(steps);
    refresh('forward');
  });

  // Next only exists before the last step; the last step ends with the rep
  // question instead, and the wrap-around lives in that handler. The
  // illustration carries the same action so a practiced household can walk a
  // rep without the thumb leaving the picture — Next stays for discovery and
  // for the keyboard.
  // The hint is spent by moving on, however they moved on. Tying it only to
  // the tap would leave it re-appearing at rep two of every future session
  // for anyone who prefers the button — a hint that keeps asking is a nag.
  const advance = () => {
    if (root.querySelector('.advance-hint')) markHintSeen('tap-to-advance');
    if (session.stepIndex < steps.length - 1) {
      session.stepIndex += 1;
      speakStep(steps);
      refresh('forward');
    }
  };
  on('[data-next]', 'click', advance);
  on('[data-advance]', 'click', advance);

  on('[data-prev]', 'click', () => {
    if (session.stepIndex > 0) {
      session.stepIndex -= 1;
      speakStep(steps);
      refresh('back');
    }
  });

  // The tally ---------------------------------------------------------------
  // Answering the rep question ends the pass, so the whole screen turns over:
  // the count moves in the top bar, the pictures wrap to step one, and the
  // next rep starts. The re-render that the static tally had to avoid is
  // exactly the feedback this flow wants.
  //
  // `celebrate` is set only on the render where the target is crossed, so the
  // strip's arrival animation and the bar's sweep fire once rather than on
  // every rep after it. The flag is consumed by the render it triggers.
  const countRep = (good) => {
    // Read once per rep rather than captured at session start: the setting is
    // on another screen, and a session left open while it changes should agree
    // with what the strip above it is already drawing.
    const goal = repTarget(level);
    const wasMet = session.repLog.length >= goal;
    session.repLog.push(good);
    syncTotals();
    session.celebrate = !wasMet && session.repLog.length >= goal;
    session.stepIndex = 0;
    // Only the one that carries news the screen does not. Every rep already
    // announces itself twice — the new step takes focus and the strip updates
    // — so a per-rep toast was a third telling of the same thing. Crossing
    // the target is different: it is the moment the session became enough.
    if (session.celebrate) toast('Target met. Finish on a win, or keep going.');
    speakStep(steps);
    refresh('forward');
  };

  on('[data-rep]', 'click', (e) => countRep(e.currentTarget.dataset.rep === '1'));

  on('[data-rep-abort]', 'click', () => countRep(false));

  // Undo puts the question back within reach instead of at the far end of
  // another full pass. Correcting a fat-fingered answer was costing five taps
  // of walking; it should cost one.
  on('[data-rep-undo]', 'click', () => {
    session.repLog.pop();
    syncTotals();
    session.celebrate = false;
    session.stepIndex = steps.length - 1;
    speakStep(steps);
    refresh('back');
  });

  on('[data-back-practice]', 'click', () => {
    session.phase = 'step';
    session.stepIndex = steps.length - 1;
    refresh('back');
  });

  on('[data-finish-practice]', 'click', () => {
    syncTotals();
    session.phase = 'result';
    refresh('forward');
  });

  // Fallback sheet ------------------------------------------------------------
  on('[data-panic]', 'click', () => {
    session.sheetOpen = true;
    refresh();
  });

  on('[data-sheet-close]', 'click', closeSheet);

  on('[data-sheet-backdrop]', 'click', (e) => {
    if (e.target === e.currentTarget) closeSheet();
  });

  on('[data-sheet-end]', 'click', () => {
    session.sheetOpen = false;
    session.phase = 'result';
    session.arousal = 4;
    session.assistance.add('session_ended');
    refresh('forward');
  });

  // Detail-screen count corrections ------------------------------------------
  on('[data-reps]', 'click', (e) => {
    session.reps = Math.max(0, session.reps + Number(e.currentTarget.dataset.reps));
    session.successes = Math.min(session.successes, session.reps);
    root.querySelectorAll('[data-reps-out]').forEach((o) => (o.textContent = session.reps));
    root.querySelectorAll('[data-ok-out]').forEach((o) => (o.textContent = session.successes));
    const hint = root.querySelector('[data-ok]');
    if (hint) {
      const small = hint.closest('.rep-counter').querySelector('small');
      if (small) small.textContent = `Out of ${session.reps}`;
    }
  });

  on('[data-ok]', 'click', (e) => {
    const next = session.successes + Number(e.currentTarget.dataset.ok);
    session.successes = Math.min(Math.max(0, next), session.reps);
    root.querySelectorAll('[data-ok-out]').forEach((o) => (o.textContent = session.successes));
  });

  // Result: a single tap both answers the question and saves the session.
  // The counts are real observations now, so nothing gets zeroed or assumed.
  on('[data-arousal-save]', 'click', (e) => {
    session.arousal = Number(e.currentTarget.dataset.arousalSave);
    if (session.arousal === 4) session.assistance.add('session_ended');
    saveSession();
  });

  on('[data-behavior]', 'click', (e) => {
    const id = e.currentTarget.dataset.behavior;
    toggleSet(session.behaviors, id);
    e.currentTarget.setAttribute('aria-pressed', String(session.behaviors.has(id)));
    // Recovery question appears once a watched behavior is logged.
    if (['barked', 'jumped', 'nipped', 'pulled'].includes(id)) refresh();
  });

  on('[data-assist]', 'click', (e) => {
    const id = e.currentTarget.dataset.assist;
    if (id === 'none') {
      session.assistance.clear();
      session.assistance.add('none');
      refresh();
      return;
    }
    session.assistance.delete('none');
    toggleSet(session.assistance, id);
    e.currentTarget.setAttribute('aria-pressed', String(session.assistance.has(id)));
    const none = root.querySelector('[data-assist="none"]');
    if (none) none.setAttribute('aria-pressed', 'false');
  });

  on('[data-recovery]', 'click', (e) => {
    session.recoveryBand = e.currentTarget.dataset.recovery;
    refresh();
  });

  on('[data-note]', 'input', (e) => {
    session.note = e.currentTarget.value;
  });

  function sessionFields() {
    const band = RECOVERY_BANDS.find((r) => r.id === session.recoveryBand);
    return {
      activityId: activity.id,
      levelNumber: level.number,
      durationSeconds: Math.round((Date.now() - session.startedAt) / 1000),
      repetitions: session.reps,
      successfulRepetitions: session.successes,
      arousalLevel: session.arousal,
      recoverySeconds: band ? band.seconds : session.arousal <= 2 ? 20 : null,
      behaviorsObserved: [...session.behaviors],
      assistanceUsed: session.assistance.size ? [...session.assistance] : ['none'],
      context: {
        location: 'home',
        trigger:
          level.number >= 4 && activity.id === 'dg-4' ? 'familiar_guest' : 'imaginary_guest',
        distractionLevel: Math.min(level.number, 5),
      },
      note: session.note,
    };
  }

  function saveSession() {
    // Mastery is recomputed from all sessions, so compare around the insert to
    // catch the moment a level crosses a threshold — that moment is earned and
    // deserves acknowledging, once.
    const before = masteryFor(activity.id, level.number);
    // Same trick one level up: snapshot the program so the done screen can say
    // what this session did to the whole arc, not just to this level.
    const programBefore = programProgress(activity.programId);
    const record = addSession(sessionFields());
    const after = masteryFor(activity.id, level.number);
    session.milestone = after.rank > before.rank ? { from: before, to: after } : null;
    session.gain = programGain(activity, level.number, programBefore);
    session.programBefore = programBefore;

    session.saved = record;
    session.advice = recommendation(activity, level, record);

    // Act on the recommendation instead of describing it.
    //
    // The app already worked out that this level is behind them — two sessions
    // at 80% or better, calm, no nipping — and then left the level exactly
    // where it was until someone tapped a button. Miss the button and the next
    // session silently repeats the level you had just outgrown, which reads as
    // the program standing still.
    //
    // Nothing logged changes: the session that was just saved keeps the level
    // it was actually practiced at. This moves the *next* session only, and the
    // done screen offers to put it back.
    if (session.advice.nextLevel) {
      setLevel(activity.id, session.advice.nextLevel);
      session.advanced = session.advice.nextLevel;
    }

    session.phase = 'done';
    releaseAwake();
    if (!isStorageOk()) {
      toast('Not saved. Storage is unavailable on this device.');
    }
    refresh('forward');
  }

  // Detail is a round trip: the session already exists, so this updates it and
  // re-scores the recommendation against the corrected numbers.
  on('[data-detail]', 'click', () => {
    session.phase = 'detail';
    refresh('forward');
  });

  on('[data-save-detail]', 'click', () => {
    const updated = updateSession(session.saved.id, sessionFields());
    if (updated) {
      session.saved = updated;
      session.advice = recommendation(activity, level, updated);
      // Corrected numbers can cross or un-cross a level, so the program band
      // has to be re-scored against the same pre-session snapshot.
      session.gain = programGain(activity, level.number, session.programBefore);
    }
    session.detailAdded = true;
    session.phase = 'done';
    refresh('back');
  });

  // Done --------------------------------------------------------------------
  on('[data-stay]', 'click', () => {
    setLevel(activity.id, level.number);
    toast(`Staying at level ${level.number}`);
    session = null;
    location.hash = `#/activity/${activity.slug}`;
  });

  on('[data-again]', 'click', () => {
    begin(activity, level);
    session.phase = 'step';
    keepAwake();
    refresh('forward');
  });

  on('[data-finish]', 'click', () => {
    session = null;
    location.hash = '#/today';
  });

  animateProgramBand(root);

  if (session.phase === 'step') preloadUpcoming(activity, level);

  syncHandsFree(steps);

  // The target-met sweep runs on the progress bar itself. Consumed here: the
  // flag belongs to the render it was set for, and leaving it on would replay
  // the celebration on every later re-render of the same screen.
  if (session.celebrate) {
    const track = root.querySelector('.player-top .progress-track');
    if (track) {
      track.classList.add('spark');
      setTimeout(() => track.classList.remove('spark'), 600);
    }
    session.celebrate = false;
  }

  // Desktop accelerator: arrow keys walk the steps. Routed through the real
  // buttons so edge behavior and transitions stay identical to tapping. On the
  // last step Next is gone — the rep question is the only way on — so the
  // accelerator lands on the answer rather than doing nothing.
  detachKeys();
  if (session.phase === 'step' && !session.sheetOpen) {
    keyHandler = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      // e.target can be the document itself, which has no .matches.
      if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
      const forward = e.key === 'ArrowRight';
      const button = document.querySelector(
        forward ? '[data-next], .tally-good' : '[data-prev]'
      );
      if (button && !button.disabled) {
        e.preventDefault();
        if (forward && button.matches('.tally-good')) button.focus({ preventScroll: true });
        else button.click();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }
  if (session.phase === 'ready' && steps[0] && steps[0].image) {
    new Image().src = IMAGES[steps[0].image].src;
  }

  // A sheet is modal: trap it, and never let focus land on the screen behind.
  if (session.releaseTrap) {
    session.releaseTrap({ restoreFocus: false });
    session.releaseTrap = null;
  }

  if (session.sheetOpen) {
    const backdrop = root.querySelector('.sheet-backdrop');
    if (backdrop) {
      session.releaseTrap = trapModal(backdrop, {
        onEscape: closeSheet,
        initialFocus: backdrop.querySelector('.sheet h2'),
      });
    }
  } else {
    focusOnNavigate(root.querySelector('.step-instruction'));
  }
}

function mount(root) {
  // render() bails before begin() for a missing or parked activity, so there is
  // no session to wire up. wire() dereferences session immediately and would
  // throw straight into the error boundary.
  if (!session) return;
  wire(root);
}

export function cancelSession() {
  detachKeys();
  // The router calls this on any navigation away from the player, including
  // the ones that never touched the guard. Left armed, its popstate listener
  // would outlive the session and answer for a screen that is no longer here.
  disarmExitGuard();
  // A clock that outlives the screen that started it would press a button on
  // whatever screen came next.
  endHandsFree();
  releaseAwake();
  if (session && session.releaseTrap) session.releaseTrap({ restoreFocus: false });
  session = null;
}

export default { render, mount, tab: null, fullscreen: true };
