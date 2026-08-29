// The reusable prompt blocks, read from the brief that is actually current.
//
// WHICH FILE, AND WHY IT MATTERS. There are two prompt briefs in this repo and
// only one of them is live:
//
//   docs/pilot-prompts.md          "Warm Instructional Vector" — the tan-era
//                                  brief. pilot.mjs still reads it for its own
//                                  `prompt` command. Superseded on palette.
//   art/source/drawing-a-new-scene.md
//                                  the current one: flat, drawn cool, in the
//                                  app's own tokens.
//
// Assembling a scene out of the first file would produce a warm prompt for a
// cool set, and the mistake would only surface once an image came back. So this
// module names the live brief explicitly and reads nothing else.
//
// Blocks are returned verbatim. Nothing here rewrites the brief's wording: the
// markdown is the source of truth and this is only a reader.

import fs from 'node:fs';
import path from 'node:path';
import { blockquoteAfter, findHeading } from './markdown.mjs';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const BRIEF = path.join(ROOT, 'art/source/drawing-a-new-scene.md');

/**
 * The identity of the brief above, stamped on every spec and every manifest.
 *
 * There is already one draft set in this repo — art/pilot/approved/ — that
 * carries no marker at all, and telling a warm master from a cool one now takes
 * opening it. A scene declares the brief it was written for; a manifest records
 * the brief its image came from; and a spec written for a superseded brief is
 * refused rather than quietly generated against this one. Bump this when the
 * brief changes in a way that changes the pictures.
 */
export const BRIEF_ID = 'cool-flat-v1';

/**
 * The blocks a scene may ask for, keyed by the heading that carries them.
 *
 * `porch` and `outdoor` are sub-blocks of Block A rather than peers: each
 * describes a background the interior palette does not cover. `porch` is the few
 * scenes shot from outside the front door; `outdoor` is the two planned covers
 * that happen away from the house entirely, on grass or a pavement.
 *
 * `outdoor` was added after thirty-three pictures were already approved, and it
 * needed no BRIEF_ID bump: a block is opt-in, no existing spec asks for it, so
 * every assembled prompt in the set is byte-for-byte what it was. The rule is to
 * bump when the brief changes in a way that changes the pictures, and a block
 * nobody has requested cannot.
 */
const BLOCK_HEADINGS = {
  style: (l) => /^## Block A/.test(l),
  porch: (l) => /^### The porch/.test(l),
  outdoor: (l) => /^### The garden and the street/.test(l),
  cast: (l) => /^## Block B/.test(l),
};

export const BLOCK_IDS = Object.keys(BLOCK_HEADINGS);

/** Read every block once. Returns { style, porch, outdoor, cast } of trimmed strings. */
export function loadBlocks(briefPath = BRIEF) {
  if (!fs.existsSync(briefPath)) {
    throw new Error(`brief not found: ${path.relative(ROOT, briefPath)}`);
  }
  const lines = fs.readFileSync(briefPath, 'utf8').split('\n');
  const blocks = {};
  for (const [id, test] of Object.entries(BLOCK_HEADINGS)) {
    const at = findHeading(lines, test);
    if (at === null) throw new Error(`brief is missing the "${id}" heading`);
    const text = blockquoteAfter(lines, at);
    if (!text) throw new Error(`brief heading for "${id}" has no blockquote under it`);
    blocks[id] = text;
  }
  return blocks;
}
