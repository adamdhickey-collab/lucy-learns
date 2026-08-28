// The pilot ledger in css/app.css, edited as data rather than by hand.
//
// While the set is half redrawn, every flat file has to opt out of the art
// grade — once for the `filter`, once for the veil, and the veil needs one
// selector per container the app puts art in. That is seven lines per picture,
// in two blocks, plus a running count in the comment above them. Eight pictures
// in, it is 56 lines maintained by copy-paste, and the failure when a line is
// missed is not an error: the picture just renders a little greyer than the one
// next to it, which is exactly the thing nobody spots.
//
// So `approve` writes it. These are pure string functions — no filesystem, no
// app.css — so the transformation is testable on its own.
//
// WHEN THIS FILE STOPS MATTERING. The ledger exists only while both styles are
// in the app. When the last scene is redrawn, --art-grade, --art-veil, the
// rules applying them and the whole ledger block are deleted in one commit, and
// this module goes with them.

const FILTER_BLOCK = /(?:img\[src\$="[^"]+"\],?\s*)+\{\s*filter:\s*none;\s*\}/;
const VEIL_BLOCK = /(?:[^\s,{}][^,{}]*:has\(img\[src\$="[^"]+"\]\),?\s*)+\{\s*--art-veil:\s*transparent;\s*\}/;
const COMMENT = /Redrawn so far:[\s\S]*?restyle-worklist\.md\)\./;

const shipped = (key) => `${key}.jpg`;

/** The keys currently opted out, in order. */
export function ledgerKeys(css) {
  const block = css.match(FILTER_BLOCK);
  if (!block) throw new Error('the pilot ledger\'s filter block is not in this stylesheet');
  return [...block[0].matchAll(/img\[src\$="([^"]+)\.jpg"\]/g)].map((m) => m[1]);
}

/**
 * The containers the veil block covers, read off the block itself.
 *
 * Derived rather than hardcoded: if the app grows a new kind of art container
 * it is added to the ledger once, by hand, and every later key picks it up.
 */
export function ledgerContainers(css) {
  const block = css.match(VEIL_BLOCK);
  if (!block) throw new Error('the pilot ledger\'s veil block is not in this stylesheet');
  const first = ledgerKeys(css)[0];
  return [...block[0].matchAll(/([^\s,{}][^,{}]*?):has\(img\[src\$="([^"]+)\.jpg"\]\)/g)]
    .filter((m) => m[2] === first)
    .map((m) => m[1].trim());
}

/** Wrap a comma-joined list to fit the comment's indent. */
function wrap(items, indent, width = 78) {
  const lines = [];
  let line = '';
  items.forEach((item, i) => {
    const piece = item + (i === items.length - 1 ? '' : ',');
    if (line && (indent + line + ' ' + piece).length > width) {
      lines.push(line);
      line = piece;
    } else {
      line = line ? `${line} ${piece}` : piece;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/**
 * Add a key to both blocks and to the running count.
 *
 * Idempotent: a key already in the ledger returns the stylesheet untouched, so
 * re-approving a scene cannot produce a duplicate selector.
 */
export function addToLedger(css, key, total) {
  const keys = ledgerKeys(css);
  if (keys.includes(key)) return css;
  const containers = ledgerContainers(css);
  const next = [...keys, key];

  const filterBlock =
    next.map((k) => `img[src$="${shipped(k)}"]`).join(',\n') + ' {\n  filter: none;\n}';

  const veilBlock =
    next
      .flatMap((k) => containers.map((c) => `${c}:has(img[src$="${shipped(k)}"])`))
      .join(',\n') + ' {\n  --art-veil: transparent;\n}';

  const done = next.length;
  const warm = total - done;
  const comment =
    'Redrawn so far:\n' +
    wrap(next, '   ').map((l) => `   ${l}`).join('\n') +
    `\n   (${done} of ${total}; ${warm} still warm — see\n   art/source/restyle-worklist.md).`;

  let out = css.replace(FILTER_BLOCK, filterBlock).replace(VEIL_BLOCK, veilBlock);
  if (!COMMENT.test(out)) throw new Error('the ledger comment\'s running count is not where expected');
  // The comment is regenerated wholesale so the list and the count cannot
  // disagree with the selectors they describe.
  return out.replace(COMMENT, comment.trimStart());
}
