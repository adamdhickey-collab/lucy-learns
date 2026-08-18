// Hands-free practice. Two halves, deliberately separate, because they cost
// completely different things.
//
// Speaking is cheap: it runs on the device, needs no permission, and works
// with the phone in a pocket and no signal. Listening is dear: both Chrome
// and Safari ship the audio to a server, so it needs a network the rest of
// this app does not, and it needs a microphone permission that an installed
// PWA does not always survive. One switch for both would have made the
// reliable half hostage to the fragile one.
//
// The reason any of this exists: practice happens with a leash in one hand
// and a treat pouch in the other. Tapping is the thing there is no hand for.

import { getState } from './store.js';

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;

export const canSpeak = () => Boolean(synth);

/**
 * Say one short thing, dropping whatever was still being said.
 *
 * Cancel-then-speak rather than queue: these are step instructions, and a
 * queue would have the phone still reading step two while the handler is
 * looking at step four. The newest instruction is the only true one.
 *
 * Never give this a cue. The cues are words the dog has been trained on, and
 * a phone that says "Lucy!" out loud has just cued the dog itself — from the
 * wrong place, in the wrong voice, at a moment nobody chose. Cues are for the
 * handler to say; this reads the instruction around them.
 */
export function speak(text) {
  if (!synth || !text) return;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.rate = 1;
    utterance.pitch = 1;
    // Some engines start muted if volume is left unset after a cancel.
    utterance.volume = 1;
    synth.speak(utterance);
  } catch {
    /* A voice that fails is not a reason to stop a training session. */
  }
}

export function stopSpeaking() {
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* nothing to cancel */
  }
}

// ---------------------------------------------------------------------------
// Listening
// ---------------------------------------------------------------------------

/**
 * Looked up when it is needed rather than when this module loads. Reading it
 * once at load time bakes in whatever the browser happened to expose before
 * the app started, which is the wrong answer in a page that can be resumed
 * from a service worker long after that.
 */
const recognitionApi = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const canListen = () => Boolean(recognitionApi());

/**
 * What the app listens for.
 *
 * Every phrase here is at least two words, and none of them is anything a
 * person says to a dog. That is not fastidiousness — it is the one
 * constraint this feature actually has.
 *
 * The default cues are "Go to bed", "Back", "Stay", "<name>!", "Okay", "Go
 * say hi" and "Sit". Two of those are the most natural words in any voice
 * interface: "Back" is both the boundary cue and the obvious word for the
 * previous step, and "Okay" is the release cue and the obvious agreement.
 * And the handler is not saying these near the phone by accident — the step
 * screen instructs them to say the cue out loud, every rep. A microphone
 * listening for "back" would be triggered by the activity itself.
 *
 * `alternates` are for what recognizers actually return rather than what
 * people think they said: engines drop "step", hear "well" for "went well",
 * and punctuate freely.
 */
export const COMMANDS = [
  { id: 'next', phrase: 'next step', alternates: ['next one', 'next please'] },
  { id: 'prev', phrase: 'previous step', alternates: ['previous one', 'last step'] },
  { id: 'good', phrase: 'went well', alternates: ['that went well', 'it went well'] },
  { id: 'miss', phrase: 'not that one', alternates: ['not this one', 'no that one'] },
  { id: 'finish', phrase: 'finish session', alternates: ['finish practice', 'end session'] },
];

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Commands that the household's own cues would set off.
 *
 * Cues are editable, so this cannot be settled once by choosing careful
 * wording — somebody can rename the release cue to "next step" this evening.
 * It is checked against live state and the offending command is dropped
 * rather than the whole feature: losing "previous step" is a smaller loss
 * than a microphone that logs a rep every time the dog is released.
 */
export function cueCollisions() {
  const cues = (getState().commands || []).map((c) => normalize(resolveCueText(c.cue)));
  const hits = [];
  COMMANDS.forEach((command) => {
    [command.phrase, ...command.alternates].forEach((phrase) => {
      const p = normalize(phrase);
      cues.forEach((cue) => {
        if (!cue) return;
        // Either direction is a collision: a cue that contains the command
        // triggers it, and a cue contained by the command is close enough
        // that a recognizer will confuse the two.
        if (cue === p || cue.includes(p) || p.includes(cue)) {
          hits.push({ commandId: command.id, cue, phrase: p });
        }
      });
    });
  });
  return hits;
}

/** `{dog}` is a token in stored cues; the literal name is what gets spoken. */
function resolveCueText(cue) {
  const dog = getState().dog;
  return String(cue || '').replace(/\{dog\}/g, (dog && dog.name) || '');
}

/** The commands that survive the household's current cue list. */
export function availableCommands() {
  const blocked = new Set(cueCollisions().map((h) => h.commandId));
  return COMMANDS.filter((c) => !blocked.has(c.id));
}

/**
 * Match a heard phrase to a command.
 *
 * Longest phrase first, so "not that one" is never answered by a shorter
 * match hiding inside it, and `includes` rather than equality because
 * recognizers return whole sentences ("okay next step then").
 */
function matchCommand(transcript, commands) {
  const said = normalize(transcript);
  if (!said) return null;
  const candidates = [];
  commands.forEach((command) => {
    [command.phrase, ...command.alternates].forEach((phrase) =>
      candidates.push({ id: command.id, p: normalize(phrase) })
    );
  });
  candidates.sort((a, b) => b.p.length - a.p.length);
  const hit = candidates.find((c) => said === c.p || said.includes(c.p));
  return hit ? hit.id : null;
}

/**
 * Start listening. Returns a stop function, or null if unavailable.
 *
 * `onCommand` gets a command id, `onState` gets progress worth showing —
 * listening or not, what was last heard, and anything that went wrong. The
 * screen has to show that last part: a microphone with no visible state is a
 * feature people cannot tell is broken.
 */
export function startListening({ onCommand, onState = () => {} }) {
  const Recognition = recognitionApi();
  if (!Recognition) return null;

  const commands = availableCommands();
  let stopped = false;
  let recognition = null;

  const report = (patch) => onState(patch);

  const build = () => {
    const r = new Recognition();
    r.continuous = true;
    r.interimResults = false;
    r.lang = navigator.language || 'en-US';
    // One alternative is enough: this is a five-phrase vocabulary, not
    // dictation, and extra candidates only widen the ways to be wrong.
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const said = result[0].transcript;
        const id = matchCommand(said, commands);
        report({ heard: said.trim(), matched: Boolean(id) });
        if (id) onCommand(id);
      }
    };

    r.onerror = (event) => {
      // `no-speech` and `aborted` are the ordinary sound of a quiet room and
      // of our own restarts. Only the ones a person can act on get surfaced.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true;
        report({ listening: false, error: 'blocked' });
      } else if (event.error === 'network') {
        report({ error: 'network' });
      }
    };

    // Recognizers stop themselves after a pause. A practice session is mostly
    // pauses, so the loop is the feature: restart unless we were told to stop.
    r.onend = () => {
      if (stopped) {
        report({ listening: false });
        return;
      }
      try {
        r.start();
      } catch {
        stopped = true;
        report({ listening: false, error: 'ended' });
      }
    };

    return r;
  };

  try {
    recognition = build();
    recognition.start();
    report({ listening: true, error: null });
  } catch {
    return null;
  }

  return () => {
    stopped = true;
    try {
      recognition.abort();
    } catch {
      /* already gone */
    }
    report({ listening: false });
  };
}
