// A scene, as data rather than as a message someone pasted.
//
// WHY THIS EXISTS. Eight scenes were drawn by hand-assembling Block A, Block B
// and a scene paragraph in a chat window, and picking attachments by eye. That
// worked, and it also lost things: which reference was attached in which order
// is nowhere in the repo, so a scene cannot be regenerated identically and a
// failure cannot be attributed to the prompt or to the attachments.
//
// A scene spec fixes both. It names its blocks, carries its own scene text,
// and lists its references **in order with a declared role each**. The order is
// data because it is a real variable: the model weighs attachments differently
// by position, and rounds 1-19 of the warm set found the attached image to be
// the strongest single lever on consistency.
//
// WHAT IS NOT HERE. Only the reusable blocks live in markdown; the scene
// paragraph and the must-be-true line live in the spec, because they are
// per-scene and have no other home. docs/illustration-audit.md §6 carries scene
// briefs for the five pilot scenes only.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BLOCK_IDS, BRIEF_ID, loadBlocks } from './brief.mjs';
import { PROFILE_IDS } from './profiles.mjs';

export const SCENES_DIR = path.join(ROOT, 'art/scenes');
const APPROVED_REL = 'art/pilot/approved';

/**
 * Where the tan-era masters live.
 *
 * "Approved" means two different things in this repo and the collision is a
 * trap. A file here is the approved *warm* master — the picture currently
 * shipping — and for most scenes one already exists under the same name the
 * restyle will use. It is a legacy asset: useful as continuity, never the
 * result of a restyle run, and never written to by one.
 */
export const LEGACY_APPROVED = path.join(ROOT, 'art/pilot/approved');

/** The legacy warm master for a scene, if there is one. Read-only, always. */
export function legacyMaster(sceneId, dir = LEGACY_APPROVED) {
  for (const ext of ['.png', '.jpg', '.jpeg']) {
    const abs = path.join(dir, sceneId + ext);
    if (fs.existsSync(abs)) return { abs, path: path.relative(ROOT, abs) };
  }
  return null;
}

/**
 * What each reference is for, and the sentence the prompt uses to say so.
 *
 * Roles are a closed set on purpose. An unknown role is a typo, and a typo that
 * silently produced an unlabelled attachment would be exactly the kind of
 * quiet failure this format exists to prevent.
 *
 * The likeness sheets carry a warning with them: both were cropped from the
 * old painterly set, because that is where the likenesses live, so every
 * request ships an example of the rendering the brief is trying to leave
 * behind. Saying "likeness only" is what stops it being copied.
 */
export const ROLES = {
  'style:exemplar':
    'THE STYLE AUTHORITY — match its rendering exactly: flat two-tone fills, crisp edges, no gradients, no airbrushing, no glossy fur. Match its palette, its line weight and the dog\'s appearance. This is what the finished picture must look like. Where it shows the same room as the scene below, match its camera height, wall, floor, door and proportions too',
  'likeness:handler':
    'a likeness reference for the handler — copy her face, hair and build only',
  'likeness:lucy':
    "a likeness reference for Lucy — copy her markings, beard, ear and build only",
  'continuity:room':
    'the same room in an adjacent moment — match the camera angle, eye level, wall, floor, door and distance exactly',
  'continuity:pair':
    'the companion picture to this one — the two are shown side by side, so nothing but the action may differ',
  'likeness:guest':
    'a likeness reference for the guest — copy his face, glasses, black cap and blue hoodie; this one is already in the current style, so match its rendering too',
  'continuity:ladder':
    'the previous rung of this ladder — same room, same camera, same distance from the viewer, same size of dog; only the one thing this step changes may differ',
};

/**
 * Whether a scene reference is still waiting on a picture that has not been
 * drawn against the current brief.
 *
 * This used to be a real question with a real answer. While the restyle was
 * running, art/pilot/approved/ held a mix: legacy warm masters under the same
 * keys the cool set would use, and redrawn cool ones. Attaching the wrong one
 * gave you a picture that looked plausible and was drawn in the style the whole
 * effort existed to replace — so "redrawn" was read off the pilot ledger in
 * css/app.css rather than off the filesystem, because the filesystem could not
 * tell them apart.
 *
 * The ledger was deleted at the finish line, along with the grade it controlled,
 * and that is what makes this simple: every approved master is now current by
 * definition, because there is no warm art left anywhere. Nothing is pending.
 * The field stays so `plan` and `generate` keep their shape, and so the ladder's
 * refusal has somewhere to live if a future set ever needs it again.
 */
const nothingIsPending = () => false;

/**
 * Every reference that is useful for what it shows but wrong about how it is drawn.
 *
 * The warning fires on these files specifically, not on the word "likeness". The
 * guest's likeness reference is a redrawn scene — already flat, already cool —
 * and telling the model to ignore its rendering would throw away the only example
 * of the target style in the request. When one of these is eventually redrawn it
 * comes out of this map with it.
 *
 * It was a set of the two likeness sheets until the app icon came into the
 * pipeline. Round 9 of app-icon attached the shipping icon as a `continuity:pair`
 * to hold the composition, and came back with the icon's soft airbrushed coat:
 * two softly-rendered attachments against one flat exemplar, which is the exact
 * shape of the round-1 failure this whole mechanism exists to prevent. The set
 * did not fire because it was a list of two filenames rather than a statement
 * about what a reference carries — so it is a map now, and the reason travels
 * with the entry.
 */
const SUPERSEDED_RENDERING = new Map([
  ['art/source/trainer-reference.jpg', 'a likeness sheet cropped from the painterly set'],
  ['art/source/lucy-reference.jpg', 'a likeness sheet cropped from the painterly set'],
  ['icons/source.png', 'the shipping app icon — the right palette, but soft airbrushed shading'],
  [
    'art/source/splash-source.png',
    'the shipping launch illustration — a gentle art grade is baked into its own pixels ' +
      '(saturation 0.85), so its colour is deliberately not the brief\'s',
  ],
]);

/** Marks an attachment whose rendering must not be copied, in its own line. */
const NOT_ITS_RENDERING = ' — NOT its rendering, see the note below';

/**
 * The sentence that opens a request carrying a flat exemplar.
 *
 * It leads rather than trails, and the reason is written down in pilot.mjs from
 * the hand-driven era: the model should know the attachment outranks the
 * description before it reads three hundred words of description.
 *
 * Round 1 of door-sound-03-name is why this exists. It shipped two painterly
 * likeness sheets and one flat scene labelled `continuity:room` — "match the
 * camera angle", saying nothing about rendering — and came back painterly, with
 * Lucy smoothed into a plain Labrador. Two examples of the wrong style
 * outranked one example of the right style by position and by instruction.
 */
const STYLE_LEAD =
  'ATTACHMENT 1 IS THE STYLE REFERENCE. Match it exactly for rendering, palette ' +
  'and the dog\'s appearance — the same flat two-tone fills with no gradients, the ' +
  'same crisp edges, the same matte coat, the same scruffy beard. Where the ' +
  'description below and that image disagree about how something is DRAWN, the ' +
  'image wins. The description governs only what is happening.';

/**
 * Keep the phrases "likeness only" and "painted in an older style" — the first
 * is what the likeness sheets need said about them, and both are what the tests
 * pin, because a warning that gets reworded into vagueness stops working and
 * nothing else in the request would show it.
 */
const RENDERING_WARNING =
  'The attachments marked NOT ITS RENDERING are for likeness only, or for ' +
  'composition only, exactly as their line says. They are painted in an older ' +
  'style that is being replaced. Do NOT copy their shading, their edges, their ' +
  'gradients or their background from them. Draw everything flat, in the style ' +
  'and palette of attachment 1.';

/** Throw with every problem at once, so a bad spec is one fix rather than five. */
class SpecError extends Error {
  constructor(id, problems) {
    super(`scene "${id}" is invalid:\n` + problems.map((p) => `    - ${p}`).join('\n'));
    this.name = 'SpecError';
    this.problems = problems;
  }
}

/**
 * Validate a parsed spec and resolve its references against the filesystem.
 *
 * `checkFiles` exists for the tests: they need to exercise the shape rules on
 * fixtures without inventing image files on disk.
 */
export function validateScene(spec, { checkFiles = true } = {}) {
  const problems = [];
  const id = typeof spec?.id === 'string' ? spec.id : '(missing id)';

  if (!spec || typeof spec !== 'object') throw new SpecError(id, ['not an object']);
  if (typeof spec.id !== 'string' || !/^[a-z0-9-]+$/.test(spec.id)) {
    problems.push('id must be a lowercase kebab-case string');
  }
  if (typeof spec.scene !== 'string' || spec.scene.trim() === '') {
    problems.push('scene text is required and cannot be empty');
  }
  if (typeof spec.mustBeTrue !== 'string' || spec.mustBeTrue.trim() === '') {
    problems.push('mustBeTrue is required — name the one thing the picture has to get right');
  }
  // Not cosmetic: a spec written against the warm brief and generated against
  // the cool one comes back looking plausible and wrong.
  if (spec.briefId !== BRIEF_ID) {
    problems.push(
      spec.briefId === undefined
        ? `briefId is required — this brief is "${BRIEF_ID}"`
        : `briefId "${spec.briefId}" is not the current brief "${BRIEF_ID}"`
    );
  }

  // Absent is `scene`, so the thirty-seven existing specs need no edit. A typo
  // is refused rather than defaulted: silently drawing an icon on a 4:3 canvas
  // is a wasted paid call whose cause is invisible in the result.
  if (spec.profile !== undefined && !PROFILE_IDS.includes(spec.profile)) {
    problems.push(`unknown profile "${spec.profile}" (expected ${PROFILE_IDS.join(' | ')})`);
  }

  if (!Array.isArray(spec.blocks) || spec.blocks.length === 0) {
    problems.push(`blocks must be a non-empty array of ${BLOCK_IDS.join(' | ')}`);
  } else {
    for (const b of spec.blocks) {
      if (!BLOCK_IDS.includes(b)) problems.push(`unknown block "${b}"`);
    }
  }

  const refs = [];
  if (!Array.isArray(spec.references) || spec.references.length === 0) {
    problems.push('references must be a non-empty ordered array');
  } else {
    const seen = new Set();
    spec.references.forEach((ref, i) => {
      const where = `references[${i}]`;
      const hasPath = typeof ref?.path === 'string' && ref.path !== '';
      const hasScene = typeof ref?.scene === 'string' && ref.scene !== '';
      if (hasPath === hasScene) {
        problems.push(`${where}: needs exactly one of path or scene`);
        return;
      }
      if (!ROLES[ref.role]) {
        problems.push(`${where}: unknown role "${ref.role}" (expected ${Object.keys(ROLES).join(' | ')})`);
      }

      // A scene reference names another scene rather than a file: it resolves
      // to that scene's approved master, which does not exist until it has been
      // generated and approved. That is the point — the ladder's rungs have to
      // be drawn in order, each off the last, and this is where that ordering
      // lives instead of in someone's memory.
      const from = hasScene ? ref.scene : null;
      const rel = hasScene ? `${APPROVED_REL}/${ref.scene}.png` : ref.path;
      if (hasScene && ref.scene === spec.id) problems.push(`${where}: a scene cannot reference itself`);

      if (seen.has(rel)) problems.push(`${where}: duplicate reference "${rel}"`);
      seen.add(rel);

      const abs = path.resolve(ROOT, rel);
      const exists = fs.existsSync(abs);
      // Pending means "not yet drawn against this brief" — either no file at
      // all, or the legacy warm master still sitting under that name.
      const pending = hasScene && nothingIsPending(ref.scene);
      if (checkFiles && !hasScene && !exists) problems.push(`${where}: file not found — ${rel}`);
      // Order is the array's order, recorded explicitly so the plan output and
      // the eventual request cannot disagree about it.
      refs.push({ order: i + 1, path: rel, abs, role: ref.role, exists, fromScene: from, pending });
    });
  }

  const exemplar = refs.findIndex((r) => r.role === 'style:exemplar');
  if (exemplar > 0) {
    problems.push('the style:exemplar must be the first reference — the prompt calls it "attachment 1"');
  }
  // The exemplar is the one attachment the prompt says to copy exactly. Pointing
  // it at a file drawn in the style being replaced would make the whole request
  // argue for the old style, and the result would look plausible and wrong.
  if (exemplar !== -1 && SUPERSEDED_RENDERING.has(refs[exemplar].path)) {
    problems.push(
      `the style:exemplar cannot be ${refs[exemplar].path} — ` +
        `${SUPERSEDED_RENDERING.get(refs[exemplar].path)}, so it is not the style to match`
    );
  }
  if (problems.length) throw new SpecError(id, problems);
  return { ...spec, references: refs };
}

/** Read `art/scenes/<id>.json`, validate it, and resolve its references. */
export function loadScene(id, { dir = SCENES_DIR, checkFiles = true } = {}) {
  if (typeof id !== 'string' || id === '') throw new Error('a scene id is required');
  const file = path.join(dir, `${id}.json`);
  if (!fs.existsSync(file)) {
    const known = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    throw new Error(
      `no scene spec at ${path.relative(ROOT, file)}` +
        (known.length ? `\n  known scenes: ${known.join(', ')}` : '')
    );
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${path.relative(ROOT, file)} is not valid JSON: ${e.message}`);
  }
  // The filename is the identity. A spec whose id disagrees with its filename
  // would be loadable under one name and referred to by another.
  if (spec.id !== id) {
    throw new SpecError(id, [`id "${spec.id}" does not match filename "${id}.json"`]);
  }
  return validateScene(spec, { checkFiles });
}

/**
 * Build the prompt text.
 *
 * Order mirrors what the eight hand-drawn scenes used, because that order is
 * the one with evidence behind it: style first, then cast, then what the
 * attachments are, then the scene, then the one thing that has to be true.
 * The attachment list is generated from the references so the numbering in the
 * text can never disagree with the order the images are actually sent in.
 */
export function assemblePrompt(scene, blocks = loadBlocks()) {
  const parts = [];
  // The style lead goes first, ahead of the blocks, or it is three hundred
  // words too late to matter.
  if (scene.references.some((r) => r.role === 'style:exemplar')) parts.push(STYLE_LEAD);
  for (const id of scene.blocks) parts.push(blocks[id]);

  // The mark goes on the attachment's own line as well as in the note. A role
  // like continuity:pair says "nothing but the action may differ", which reads as
  // an instruction to match rendering; a warning three lines below does not
  // reliably outrank it, and round 9 of app-icon is what that looks like.
  const superseded = scene.references.filter((r) => SUPERSEDED_RENDERING.has(r.path));
  const list = scene.references
    .map(
      (r) =>
        `${r.order}. ${path.basename(r.path)} — ${ROLES[r.role]}` +
        `${SUPERSEDED_RENDERING.has(r.path) ? NOT_ITS_RENDERING : ''}.`
    )
    .join('\n');
  parts.push(
    `ATTACHED REFERENCES, in the order they are attached:\n${list}` +
      (superseded.length ? `\n\n${RENDERING_WARNING}` : '')
  );

  parts.push(`SCENE. ${scene.scene.trim()}`);
  parts.push(`MUST BE TRUE: ${scene.mustBeTrue.trim()}`);
  return parts.join('\n\n');
}

/** Ladder rungs this scene is waiting on, in declared order. Empty when ready. */
export function pendingReferences(scene) {
  return scene.references.filter((r) => r.pending);
}
