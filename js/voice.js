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

import { getState, getVoice, setVoice } from './store.js';

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;

export const canSpeak = () => Boolean(synth);

/**
 * Pick the best voice on the device instead of taking what is handed over.
 *
 * Left alone, iOS reads with the default compact voice — the small robotic
 * one that ships in the system image. The good voices are there, they are
 * just not the default: Siri's, and the Enhanced and Premium downloads under
 * Accessibility. Same story on Android with the Google network voices. So the
 * single biggest improvement available to spoken steps costs nothing but
 * choosing.
 *
 * Scored rather than matched by name, because the naming is not consistent
 * across platforms or versions and a list of known-good identifiers would rot.
 */
const VOICE_HINTS = [
  [/siri/i, 100], // iOS, by some distance the best thing available
  [/premium|enhanced|neural|natural|wavenet|studio/i, 60],
  [/google/i, 25], // Android's better set
];

function scoreVoice(voice, lang) {
  const name = `${voice.name} ${voice.voiceURI}`;
  // Compact is what the app is trying to get away from.
  if (/compact|eloquence/i.test(name)) return -1;

  let score = 0;
  VOICE_HINTS.forEach(([pattern, points]) => {
    if (pattern.test(name)) score += points;
  });
  // An exact locale beats the bare language, which beats nothing.
  if (voice.lang === lang) score += 20;
  else if (voice.lang.split('-')[0] === lang.split('-')[0]) score += 10;
  else return -1;
  // On-device voices do not stall on a bad connection at the door.
  if (voice.localService) score += 5;
  if (voice.default) score += 1;
  return score;
}

let chosenVoice = null;

/**
 * `getVoices()` is empty on the first call in most browsers and fills in
 * later, so this re-picks whenever the list changes rather than caching a
 * decision made too early.
 */
function pickVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices || !voices.length) return null;

  // A chosen voice outranks a scored one. Guessing well is worth doing, but
  // the guess is made against names and flags that vary by platform and
  // version, and a household that has heard all of them knows better than the
  // scoring does. Falls through if the saved voice is gone — an engine swap,
  // or a phone the install moved to.
  const preferred = getVoice().voiceURI;
  if (preferred) {
    const match = voices.find((v) => v.voiceURI === preferred);
    if (match) {
      chosenVoice = match;
      return chosenVoice;
    }
  }

  const lang = navigator.language || 'en-US';
  let best = null;
  voices.forEach((voice) => {
    const score = scoreVoice(voice, lang);
    if (score >= 0 && (!best || score > best.score)) best = { voice, score };
  });
  chosenVoice = best ? best.voice : null;
  return chosenVoice;
}

/**
 * Every voice worth offering, best first.
 *
 * Filtered to the reading language, because the rest would read English
 * instructions with the wrong phonology, and sorted by the same score used to
 * guess so the likeliest good ones are at the top of the list rather than
 * wherever the engine happened to put them.
 */
export function listVoices() {
  if (!synth) return [];
  const voices = synth.getVoices() || [];
  const lang = navigator.language || 'en-US';
  return voices
    .map((voice) => ({ voice, score: scoreVoice(voice, lang) }))
    .filter((v) => v.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((v) => ({ uri: v.voice.voiceURI, name: v.voice.name, lang: v.voice.lang }));
}

/** Choose a voice by hand. Empty string hands the decision back to scoring. */
export function setPreferredVoice(uri) {
  setVoice({ voiceURI: uri || '' });
  chosenVoice = null;
  return pickVoice();
}

if (synth) {
  pickVoice();
  // Fires once the list is populated, and again if the user installs a voice.
  synth.addEventListener?.('voiceschanged', pickVoice);
}

/**
 * The chosen voice, re-picked if it no longer exists.
 *
 * Android lets the text-to-speech engine be swapped in system settings, and
 * an engine change empties and refills the list underneath us. Holding the
 * old object across that hands the engine a voice it has never heard of,
 * which does not throw — it just says nothing, which is the worst way for
 * this to fail. Compared by `voiceURI` rather than identity because several
 * browsers build fresh objects on every `getVoices()` call.
 *
 * An empty list is treated as the transient state it usually is: the first
 * call before the engine has answered. Re-picking there would throw away a
 * good choice for a moment of silence.
 */
function resolveVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices || !voices.length) return chosenVoice;
  if (chosenVoice && voices.some((v) => v.voiceURI === chosenVoice.voiceURI)) return chosenVoice;
  return pickVoice();
}

/** The voice being used, so a screen can say which one rather than guess. */
export const currentVoiceName = () => {
  const voice = resolveVoice();
  return voice ? voice.name : null;
};

/** Same, as an id, so a picker can show which entry is the live one. */
export const currentVoiceURI = () => {
  const voice = resolveVoice();
  return voice ? voice.voiceURI : '';
};

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
/**
 * What became of the last thing we tried to say.
 *
 * Speech failing on iOS is silent in both senses: no sound, and no error
 * either — the utterance is simply never started. That leaves a screen that
 * looks identical whether the feature is working or dead, which is
 * undebuggable on a phone that is not on this desk. So the lifecycle is
 * recorded and a screen can show it.
 */
let lastSpeech = { text: '', state: 'idle', error: null };
let currentUtterance = null;
const speechListeners = new Set();

export const speechStatus = () => ({ ...lastSpeech });
export function onSpeechChange(fn) {
  speechListeners.add(fn);
  return () => speechListeners.delete(fn);
}
function setSpeech(patch) {
  lastSpeech = { ...lastSpeech, ...patch };
  speechListeners.forEach((fn) => fn(speechStatus()));
}

export function speak(text) {
  if (!synth || !text) {
    setSpeech({ text: String(text || ''), state: 'unsupported', error: null });
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(String(text));
    // Guarded on its own, because choosing a voice is an improvement and
    // saying the sentence is the job. A voice the engine rejects throws here,
    // and swallowing that with the rest would trade a slightly worse voice
    // for total silence — the one failure nobody would be able to diagnose.
    try {
      const voice = resolveVoice() || pickVoice();
      if (voice) {
        utterance.voice = voice;
        // Safari reads `lang` rather than the voice's own in some versions,
        // and a mismatch is what turns an English sentence into phonetic mush.
        utterance.lang = voice.lang;
      }
    } catch {
      chosenVoice = null; // fall back to the engine's default, and re-pick later
    }
    // A touch under natural pace. These are instructions being followed with
    // a dog, not prose being listened to, and the hurried default reads the
    // step out before the handler has looked up from the leash.
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Some engines start muted if volume is left unset after a cancel.
    utterance.volume = 1;

    setSpeech({ text: String(text), state: 'queued', error: null });
    // Only the newest utterance may write the status. Replacing one fires
    // `interrupted` on the old after the new is already queued, and letting
    // that land marks a perfectly good utterance as failed — in the one place
    // whose whole job is to be believed about whether speech is working.
    currentUtterance = utterance;
    const mine = (fn) => (e) => {
      if (utterance !== currentUtterance) return;
      fn(e);
    };
    utterance.onstart = mine(() => setSpeech({ state: 'speaking' }));
    utterance.onend = mine(() => setSpeech({ state: 'done' }));
    utterance.onerror = mine((e) =>
      setSpeech({ state: 'error', error: (e && e.error) || 'unknown' })
    );

    const wasSpeaking = synth.speaking || synth.pending;
    if (wasSpeaking) {
      synth.cancel();
      // Safari on iOS drops an utterance queued in the same tick as a cancel:
      // the cancel lands on the new one instead of the old. A turn of the
      // event loop is the whole fix, and it only costs anything in the case
      // where something was actually being said.
      setTimeout(() => {
        try {
          synth.speak(utterance);
        } catch {
          /* gone */
        }
      }, 60);
    } else {
      // No cancel on this path, deliberately. Calling cancel() before the
      // engine has ever spoken leaves iOS Safari's synthesizer wedged, and
      // every utterance after it is silent — which is exactly what a first
      // run looks like, because the first utterance is always this path.
      synth.speak(utterance);
    }
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

/** Ordinary Levenshtein, two rows rather than a full matrix. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let row = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, row] = [row, prev];
  }
  return prev[b.length];
}

/**
 * How far `phrase` is from the nearest run of words inside `said`.
 *
 * Windowed by word count rather than compared whole, because recognizers
 * wrap commands in sentences — "okay next step then" — and measuring the
 * whole sentence against a two-word phrase scores every real command as a
 * bad match. One word either side of the phrase's own length is enough
 * slack for a dropped or invented article.
 */
function windowedDistance(said, phrase) {
  const words = said.split(' ').filter(Boolean);
  const size = phrase.split(' ').filter(Boolean).length;
  let best = editDistance(said, phrase);
  for (let n = Math.max(1, size - 1); n <= size + 1; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const d = editDistance(words.slice(i, i + n).join(' '), phrase);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * How wrong a phrase may be and still count.
 *
 * Proportional to length: three characters adrift in "not that one" is a
 * recognizer stumbling, while three adrift in a four-letter word is a
 * different word. A third is enough to absorb the failures these engines
 * actually produce — "next up" for "next step", "when well" for "went well"
 * — without reaching far enough to meet anything said to a dog.
 */
const tolerance = (phrase) => Math.floor(phrase.length / 3);

/**
 * Match a heard phrase to a command.
 *
 * Exact containment first, so the common case never pays for the fuzzy pass
 * and "not that one" is never answered by something shorter hiding inside it.
 *
 * Then the fuzzy pass, which exists because these recognizers are doing open
 * dictation against a five-phrase vocabulary they know nothing about: they
 * return "next up", "text step", "nest step". Refusing those trains people to
 * shout at the phone.
 *
 * The cue guard is what makes loosening it safe. Every household cue is
 * measured too, and if what was heard sits as close to a cue as it does to a
 * command, nothing happens. The handler is instructed to say those cues out
 * loud on every rep, so the microphone hears them constantly — and a
 * scorekeeper that logs a rep because somebody released the dog is worse than
 * one that occasionally misses a command.
 */
export function matchCommand(transcript, commands = availableCommands()) {
  const said = normalize(transcript);
  if (!said) return null;

  const candidates = [];
  commands.forEach((command) => {
    [command.phrase, ...command.alternates].forEach((phrase) =>
      candidates.push({ id: command.id, p: normalize(phrase) })
    );
  });

  // Exact: longest first so the most specific phrase wins.
  const exact = [...candidates]
    .sort((a, b) => b.p.length - a.p.length)
    .find((c) => said === c.p || said.includes(c.p));
  if (exact) return exact.id;

  // Fuzzy: the closest candidate, if it is close enough to be meant.
  let best = null;
  candidates.forEach((c) => {
    const d = windowedDistance(said, c.p);
    if (d <= tolerance(c.p) && (!best || d < best.d)) best = { id: c.id, d };
  });
  if (!best) return null;

  // A cue only gets a veto if it is itself a plausible reading of what was
  // said. Measuring raw distance instead let three-letter cues veto
  // everything — "sit" sits two or three edits from most short words, so
  // "next up" was being thrown out by a cue nobody had spoken. Holding each
  // cue to its own tolerance asks the question that matters: was this a cue?
  const cueDistance = cuePhrases().reduce((min, cue) => {
    const d = windowedDistance(said, cue);
    return d <= tolerance(cue) && d < min ? d : min;
  }, Infinity);
  if (cueDistance <= best.d) return null;

  return best.id;
}

/** The household's cues, normalized, for the guard above. */
function cuePhrases() {
  return (getState().commands || [])
    .map((c) => normalize(resolveCueText(c.cue)))
    .filter(Boolean);
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

  // Restarting is normal — recognizers stop themselves after a pause, and a
  // practice session is mostly pauses. But on iOS Safari every start needs a
  // user gesture, so a restart nobody tapped is refused, and the refusal
  // looks like an ordinary end. Telling the two apart is a matter of timing:
  // a real listen sits in a quiet room for seconds, while a refusal comes
  // back immediately. Several immediate empty ends in a row means this
  // platform will not listen unattended, and the honest thing is to say so
  // rather than leave a chip claiming to listen to a microphone that is off.
  let startedAt = 0;
  let sawResult = false;
  let refusals = 0;

  const report = (patch) => onState(patch);

  const build = () => {
    const r = new Recognition();
    r.continuous = true;
    r.interimResults = false;
    r.lang = navigator.language || 'en-US';
    // One alternative is enough: this is a five-phrase vocabulary, not
    // dictation, and extra candidates only widen the ways to be wrong.
    r.maxAlternatives = 1;

    r.onstart = () => {
      startedAt = Date.now();
      sawResult = false;
    };

    r.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        sawResult = true;
        refusals = 0;
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
      // Immediate and empty is a refusal, not a quiet room. Three in a row is
      // a platform that will not restart without being asked by hand.
      if (!sawResult && Date.now() - startedAt < 700) refusals += 1;
      else refusals = 0;
      if (refusals >= 3) {
        stopped = true;
        report({ listening: false, error: 'gesture' });
        return;
      }
      try {
        r.start();
      } catch {
        stopped = true;
        report({ listening: false, error: 'gesture' });
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
    // Both, in this order, and each on its own. `abort` is the one that drops
    // the audio immediately, but iOS has been seen holding the recording
    // indicator until `stop` has also been called, and if `abort` throws
    // because the recognizer is mid-teardown then a shared try would skip
    // `stop` entirely — leaving the orange dot lit over a session that ended.
    try {
      recognition.abort();
    } catch {
      /* already gone */
    }
    try {
      recognition.stop();
    } catch {
      /* already gone */
    }
    // Drop the handlers too. A recognizer kept alive by a pending callback
    // can still fire `onend` after this and restart itself.
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition = null;
    report({ listening: false });
  };
}
