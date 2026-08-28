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

export const SCENES_DIR = path.join(ROOT, 'art/scenes');

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
  'likeness:handler':
    'a likeness reference for the handler — copy her face, hair and build only',
  'likeness:lucy':
    "a likeness reference for Lucy — copy her markings, beard, ear and build only",
  'continuity:room':
    'the same room in an adjacent moment — match the camera angle, eye level, wall, floor, door and distance exactly',
  'continuity:pair':
    'the companion picture to this one — the two are shown side by side, so nothing but the action may differ',
};

const LIKENESS_WARNING =
  'The likeness references are for likeness only. Do NOT copy their rendering ' +
  'style, shading or background: they are painted in an older style being ' +
  'replaced. Draw these characters flat, in the style and palette above.';

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
      if (!ref || typeof ref.path !== 'string' || ref.path === '') {
        problems.push(`${where}: path is required`);
        return;
      }
      if (!ROLES[ref.role]) {
        problems.push(`${where}: unknown role "${ref.role}" (expected ${Object.keys(ROLES).join(' | ')})`);
      }
      if (seen.has(ref.path)) problems.push(`${where}: duplicate reference "${ref.path}"`);
      seen.add(ref.path);

      const abs = path.resolve(ROOT, ref.path);
      const exists = fs.existsSync(abs);
      if (checkFiles && !exists) problems.push(`${where}: file not found — ${ref.path}`);
      // Order is the array's order, recorded explicitly so the plan output and
      // the eventual request cannot disagree about it.
      refs.push({ order: i + 1, path: ref.path, abs, role: ref.role, exists });
    });
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
  for (const id of scene.blocks) parts.push(blocks[id]);

  const hasLikeness = scene.references.some((r) => r.role.startsWith('likeness:'));
  const list = scene.references
    .map((r) => `${r.order}. ${path.basename(r.path)} — ${ROLES[r.role]}.`)
    .join('\n');
  parts.push(
    `ATTACHED REFERENCES, in the order they are attached:\n${list}` +
      (hasLikeness ? `\n\n${LIKENESS_WARNING}` : '')
  );

  parts.push(`SCENE. ${scene.scene.trim()}`);
  parts.push(`MUST BE TRUE: ${scene.mustBeTrue.trim()}`);
  return parts.join('\n\n');
}
