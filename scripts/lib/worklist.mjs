// The restyle worklist's checkboxes, ticked by the command that does the work.
//
// art/source/restyle-worklist.md is the list the whole effort is measured
// against — "nothing merges until this list is clear" — and it is also the
// thing most easily forgotten, because ticking it changes nothing that anyone
// can see. A stale list is worse than no list: it is the one place someone
// looks to answer "what is left", and it answers confidently.

const row = (key) => new RegExp(`^(\\|\\s*)\\[( |x)\\](\\s*\\|\\s*\`${key}\`\\s*\\|)`, 'm');

/** How many keys the list carries, ticked or not. */
export function worklistTotal(md) {
  return [...md.matchAll(/^\|\s*\[[ x]\]\s*\|\s*`[^`]+`/gm)].length;
}

/** The keys still unticked, in list order. */
export function worklistRemaining(md) {
  return [...md.matchAll(/^\|\s*\[ \]\s*\|\s*`([^`]+)`/gm)].map((m) => m[1]);
}

/**
 * Tick one key. Idempotent, and loud when the key is not on the list — a typo
 * that silently ticked nothing would leave the count right and the list wrong.
 */
export function tickWorklist(md, key) {
  const re = row(key);
  if (!re.test(md)) throw new Error(`"${key}" is not a row in the worklist`);
  return md.replace(re, '$1[x]$3');
}
