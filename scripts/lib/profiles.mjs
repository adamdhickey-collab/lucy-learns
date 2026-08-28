// What shape a scene comes back in, and what installing it means.
//
// The pipeline was built for one thing: a 4:3 instructional illustration, 1472×1104
// from the model, downscaled to a 1448×1086 master, cropped six ways for review,
// installed as img/<key>.jpg plus a thumb plus a ledger row plus a worklist tick.
// Every one of those numbers was hardcoded, because there was only ever one answer.
//
// Then the brand marks came in. docs/illustration-audit.md left them out of the
// pilot on purpose — "a different style problem with a 16-file cascade behind it" —
// and the cascade is the point: the icon is square, it has no 21:9 crop to fail at,
// and installing it is not a copy into img/ but a source file plus a generator run.
// Hardcoding a second set of numbers beside the first is how the two drift, so the
// shape is data and every stage reads it from here.
//
// A profile answers four questions and nothing else: what canvas to ask the model
// for, what the master is, which renditions answer "does this work", and what
// `approve` does with it. Anything a profile does not answer is the same for all of
// them on purpose — the brief, the reference roles, the attachment-1 rule, the
// refusals, the round counter and the review sheet are shared, because those are
// the parts that were worth building and none of them care about the aspect ratio.

/**
 * gpt-image-2 takes a custom size only when both edges are multiples of 16, so
 * every canvas here is checked against SIZE_LIMITS by the tests rather than
 * trusted. 1024 is 64×16, and 1024² is 1,048,576 pixels — inside the 655,360
 * floor and nowhere near the 8,294,400 ceiling.
 */
export const PROFILES = {
  /**
   * The instructional scenes. Thirty-seven of them, and the reason every number
   * below is what it is — see docs/illustration-pipeline.md.
   *
   * 1448×1086 cannot be requested (1448 is not a multiple of 16). 1472×1104 is,
   * and it is exactly the same 4:3, so the master is a proportional downscale
   * with no crop and no crop box computed anywhere on that path.
   */
  scene: {
    id: 'scene',
    what: 'a 4:3 instructional illustration',
    source: { width: 1472, height: 1104 },
    master: { width: 1448, height: 1086 },
    conversion: 'proportional downscale, no crop',
    renditions: 'scene',
    install: 'illustration',
  },

  /**
   * The PWA icon. Square, and square all the way down: the canvas is the master,
   * so there is no downscale step and no ratio to get wrong.
   *
   * It is deliberately NOT in the worklist and NOT in the ledger. `status`'s
   * total and the finish line both count worklist rows, so adding a row here
   * would move the finish line; and the ledger opts a file out of the warm-art
   * grade, which only applies to art inside the app's art containers. An icon is
   * neither. It is its own small track, which is what the audit called it.
   */
  icon: {
    id: 'icon',
    what: 'the PWA icon',
    source: { width: 1024, height: 1024 },
    master: { width: 1024, height: 1024 },
    // Not "no conversion": the master is a copy of the raw, so the raw stays the
    // untouched thing it is everywhere else in this pipeline.
    conversion: 'copied — the canvas is already the master',
    renditions: 'icon',
    install: 'icon',
  },

  /**
   * The launch illustration behind the iOS startup images and the in-app splash.
   *
   * Portrait, and square-edged like the icon: the canvas is the master, because
   * scripts/make-splash.mjs composes the art onto a field at build time and any
   * resampling here would only lose pixels before it got there.
   *
   * Like the icon it is outside the thirty-seven, for the same two reasons. What
   * makes it different from the icon is the install: the field colour behind the
   * art is MEASURED from the art's own edges, and it has to be written into three
   * files at once or the launch flashes. See scripts/lib/splashfield.mjs.
   */
  splash: {
    id: 'splash',
    what: 'the launch illustration',
    source: { width: 1024, height: 1536 },
    master: { width: 1024, height: 1536 },
    conversion: 'copied — the canvas is already the master',
    renditions: 'splash',
    install: 'splash',
  },
};

export const DEFAULT_PROFILE = 'scene';
export const PROFILE_IDS = Object.keys(PROFILES);

/**
 * The profile a spec asks for.
 *
 * Absent means `scene`, so all thirty-seven existing specs keep working without
 * being edited — a migration that touches every file to say what was already
 * true is a migration that introduces typos.
 */
export function profileFor(spec) {
  return PROFILES[spec?.profile ?? DEFAULT_PROFILE] ?? PROFILES[DEFAULT_PROFILE];
}

/** True when the canvas needs no resampling to become the master. */
export const isDirect = (p) =>
  p.source.width === p.master.width && p.source.height === p.master.height;
