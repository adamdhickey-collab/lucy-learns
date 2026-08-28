// Pulling prose out of the briefs without duplicating it.
//
// Both halves of the illustration workflow read their text out of markdown
// rather than keeping a second copy in JavaScript: pilot.mjs reads
// docs/pilot-prompts.md, and the scene pipeline reads
// art/source/drawing-a-new-scene.md. A prompt that exists twice drifts, and
// the drift is invisible until an image comes back wrong.
//
// These two functions were pilot.mjs's, lifted here unchanged so both callers
// share one parser rather than one each.

/**
 * Every line of the blockquote that follows a heading, with the "> " gone.
 *
 * A blank line inside a quote is written as a bare ">", but an unquoted blank
 * between paragraphs ends nothing — only a new heading does. That matters for
 * Block A, whose quote carries a bulleted colour list with blank quoted lines
 * either side of it.
 *
 * Prose may sit between the heading and its quote — the porch block's does —
 * but a heading may not: the search stops there and returns "", so a section
 * with no quote fails loudly instead of quietly returning the next one's.
 */
export function blockquoteAfter(lines, headingIndex) {
  const out = [];
  let started = false;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('>')) {
      started = true;
      out.push(line.replace(/^>\s?/, ''));
      continue;
    }
    // A heading ends the search whether or not a quote has started. Without
    // that second case a heading with no quote under it silently borrows the
    // next section's — which is worse than an error, because the wrong prompt
    // reads perfectly well right up until the image comes back.
    if (line.startsWith('#') || line.startsWith('---')) break;
    if (started && line.trim() === '') continue;
    if (started) break;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Index of the first `##`/`###` heading matching `test`, or null. */
export function findHeading(lines, test) {
  const i = lines.findIndex((l) => /^#{2,3} /.test(l) && test(l));
  return i === -1 ? null : i;
}
