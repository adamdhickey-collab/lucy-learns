// What this device actually does, on the device.
//
// Everything in the hands-free work went wrong in ways that only exist on
// somebody else's phone: speech that never starts and never errors, a voice
// list that comes back empty, a microphone that will not restart. None of
// that reaches a console anybody can read — the browser is on a phone in a
// hallway — so each one cost a round of guessing from symptoms.
//
// This is the answer to that. One screen that says what the browser is, what
// it supports, which voices it reports and what it did with the last thing it
// was asked to say, and one button that copies the lot as text. It is not
// pretty and does not need to be: it is read once, by somebody trying to fix
// something, and it replaces an argument with a fact.

import { APP_VERSION, APP_UPDATED } from '../version.js';
import { getState, isStorageOk } from '../store.js';
import {
  availableCommands,
  canListen,
  canSpeak,
  cueCollisions,
  currentVoiceName,
  listVoices,
  speak,
  speechStatus,
} from '../voice.js';
import { html, join, toast, focusHeading } from '../ui.js';

/**
 * Every voice the device reports, unfiltered.
 *
 * Deliberately not `listVoices()`, which is the curated dozen the picker
 * shows. The question this screen answers is what the platform said, before
 * any opinion of ours was applied to it — a list that arrives empty, or full
 * of voices tagged `en_US` with an underscore, is the finding.
 */
function rawVoices() {
  try {
    if (typeof speechSynthesis === 'undefined') return [];
    return (speechSynthesis.getVoices() || []).filter(Boolean).map((v) => ({
      name: String(v.name || '(no name)'),
      lang: String(v.lang || '(no lang)'),
      local: v.localService === true,
      dflt: v.default === true,
    }));
  } catch (error) {
    return [{ name: `(getVoices threw: ${error && error.message})`, lang: '', local: false }];
  }
}

const supports = () => {
  const test = (fn) => {
    try {
      return fn() ? 'yes' : 'no';
    } catch {
      return 'error';
    }
  };
  return [
    ['speechSynthesis', test(() => typeof speechSynthesis !== 'undefined')],
    ['SpeechSynthesisUtterance', test(() => typeof SpeechSynthesisUtterance !== 'undefined')],
    [
      'SpeechRecognition',
      test(() => window.SpeechRecognition || window.webkitSpeechRecognition),
    ],
    ['getUserMedia', test(() => navigator.mediaDevices && navigator.mediaDevices.getUserMedia)],
    ['wakeLock', test(() => 'wakeLock' in navigator)],
    ['viewTransitions', test(() => typeof document.startViewTransition === 'function')],
    ['serviceWorker', test(() => 'serviceWorker' in navigator)],
    ['dvh units', test(() => CSS.supports('height', '100dvh'))],
    ['color-mix', test(() => CSS.supports('background', 'color-mix(in srgb, red 50%, white)'))],
    ['text-wrap: balance', test(() => CSS.supports('text-wrap', 'balance'))],
  ];
};

/**
 * Standalone means launched from the Home Screen rather than in a browser
 * tab, and it matters more than it sounds: iOS has a long history of speech
 * synthesis behaving differently there, so "which one was this" is among the
 * first things worth knowing about a report of silence.
 */
const displayMode = () => {
  const modes = ['standalone', 'fullscreen', 'minimal-ui'];
  const hit = modes.find((m) => window.matchMedia(`(display-mode: ${m})`).matches);
  if (hit) return hit;
  return navigator.standalone === true ? 'standalone (iOS)' : 'browser tab';
};

function facts() {
  const state = getState();
  const voice = state.voice || {};
  const last = speechStatus();
  const collisions = cueCollisions();

  return [
    ['App version', `${APP_VERSION} (${APP_UPDATED.year}-${APP_UPDATED.month}-${APP_UPDATED.day})`],
    ['Running as', displayMode()],
    ['Browser', navigator.userAgent],
    ['Language', navigator.language || '(none)'],
    ['Screen', `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio || 1}x`],
    ['Online', navigator.onLine ? 'yes' : 'no'],
    ['Storage working', isStorageOk() ? 'yes' : 'NO — nothing is being saved'],
    ['Sessions logged', String((state.sessions || []).length)],
    ['Read aloud', voice.speak ? 'on' : 'off'],
    ['Listen', voice.listen ? 'on' : 'off'],
    ['Voice chosen by hand', voice.voiceURI || '(none — picked automatically)'],
    ['Voice in use', currentVoiceName() || '(engine default)'],
    ['Voices reported', String(rawVoices().length)],
    ['Voices offered', String(listVoices().length)],
    ['Last speech', `${last.state}${last.error ? ` (${last.error})` : ''}`],
    ['Last spoken text', last.text || '(nothing yet)'],
    ['Commands usable', availableCommands().map((c) => c.phrase).join(', ') || '(none)'],
    ['Cue collisions', collisions.length ? collisions.map((c) => c.cue).join(', ') : 'none'],
  ];
}

/** The whole thing as plain text, which is what gets pasted into a message. */
function asText() {
  const lines = ['Lucy Learns diagnostics', ''];
  facts().forEach(([k, v]) => lines.push(`${k}: ${v}`));
  lines.push('', 'Supported:');
  supports().forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
  // Capped, because this is going into a message somebody has to send. A
  // desktop can report a hundred and eighty voices; the first sixty answer
  // every question worth asking of the list, and the count above says what
  // was left out.
  const all = rawVoices();
  const CAP = 60;
  lines.push('', `Voices reported by this device (${all.length}):`);
  all
    .slice(0, CAP)
    .forEach((v) =>
      lines.push(
        `  ${v.name} | ${v.lang}${v.local ? ' | on-device' : ''}${v.dflt ? ' | default' : ''}`
      )
    );
  if (all.length > CAP) lines.push(`  …and ${all.length - CAP} more`);
  return lines.join('\n');
}

function render() {
  const voices = rawVoices();

  return html`
    <div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Support</p>
        <h1>Diagnostics</h1>
        <p>
          What this device reports about itself. Copy it into a message if
          something is not working and it will save a lot of guessing.
        </p>
      </div>

      <div class="btn-row" style="margin-bottom: var(--s-3)">
        <button class="btn btn--quiet" type="button" data-diag-speak>Test the voice</button>
        <button class="btn" type="button" data-diag-copy>Copy report</button>
      </div>

      ${/* The report as text, on the screen, because "copied to your
            clipboard" is a claim about something invisible. Copying is still
            the quickest way to send it, but somebody who wants to read it,
            select part of it, or photograph it should not have to paste it
            somewhere else first to find out what it says. */ ''}
      <details class="disclosure" style="margin-bottom: var(--s-5)">
        <summary>Show the report as text</summary>
        <div class="disclosure-body">
          <pre class="diag-text" data-diag-text>${asText()}</pre>
        </div>
      </details>

      <section class="section">
        <h2>This device</h2>
        <div class="diag-table">
          ${join(
            facts().map(
              ([k, v]) => html`<div class="diag-row">
                <span class="diag-key">${k}</span><span class="diag-value">${v}</span>
              </div>`
            )
          )}
        </div>
      </section>

      <section class="section">
        <h2>Supported here</h2>
        <div class="diag-table">
          ${join(
            supports().map(
              ([k, v]) => html`<div class="diag-row">
                <span class="diag-key">${k}</span
                ><span class="diag-value diag-${v}">${v}</span>
              </div>`
            )
          )}
        </div>
      </section>

      <section class="section">
        <h2>Voices this device reports (${voices.length})</h2>
        ${voices.length
          ? html`<div class="diag-table">
              ${join(
                voices.map(
                  (v) => html`<div class="diag-row">
                    <span class="diag-key">${v.name}</span>
                    <span class="diag-value"
                      >${v.lang}${v.local ? ' · on-device' : ''}${v.dflt ? ' · default' : ''}</span
                    >
                  </div>`
                )
              )}
            </div>`
          : html`<p class="section-note">
              None. On iOS the list often stays empty until something has been
              spoken — tap “Test the voice” above, then come back.
            </p>`}
      </section>

      <a class="btn btn--quiet btn--block" href="#/profile" style="margin-top: var(--s-5)">
        Back to Profile
      </a>
    </div>
  `;
}

function mount(root) {
  const on = (sel, fn) => {
    const el = root.querySelector(sel);
    if (el) el.addEventListener('click', fn);
  };

  // Speaking is also what wakes the voice list on iOS, so this button both
  // tests the voice and fills in the section below it.
  on('[data-diag-speak]', () => {
    speak('Diagnostics test. If you can hear this, speech is working.');
    setTimeout(() => {
      const { state, error } = speechStatus();
      toast(
        state === 'speaking' || state === 'done'
          ? `Speech started (${currentVoiceName() || 'default voice'})`
          : state === 'error'
            ? `Speech failed: ${error}`
            : 'No sound started. Check the silent switch and volume.'
      );
      // Redraw so a list that just arrived is on screen.
      location.reload();
    }, 1600);
  });

  on('[data-diag-copy]', async () => {
    const text = asText();
    // Open the text either way. If the copy worked this shows what went to
    // the clipboard, and if it silently did not — which happens, clipboard
    // access is refused in more places than it is granted — the text is on
    // screen to be selected by hand rather than lost behind a toast that
    // said it worked.
    const reveal = root.querySelector('.disclosure');
    if (reveal) reveal.open = true;
    try {
      await navigator.clipboard.writeText(text);
      toast('Report copied. It is also shown below.');
    } catch {
      const pre = root.querySelector('[data-diag-text]');
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        pre.scrollIntoView({ block: 'center' });
      }
      toast('Could not copy. The report is selected below.');
    }
  });

  focusHeading(root);
}

export default { render, mount, tab: 'profile' };
