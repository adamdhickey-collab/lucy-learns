// node --test scripts/lib/*.test.mjs
//
// status answers "what is left", which is the question people act on, so the
// classification is worth pinning: every picture in exactly one state and the
// blocked ones naming the right predecessor.
//
// It used to cross-check two registers — the worklist's ticks and the pilot
// ledger's opt-outs — because approve maintained both. The ledger went at the
// finish line, so those tests went with it: a tick is now simply the truth.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { restyleState } from './status.mjs';
import { worklistRows, worklistTotal, worklistRemaining } from './worklist.mjs';
import { WORKLIST } from './approve.mjs';

const md = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');

// --- parsing the register ---------------------------------------------------

test('every worklist row is parsed, with its activity heading', () => {
  const rows = worklistRows(md);
  assert.equal(rows.length, worklistTotal(md));
  assert.equal(rows.length, 37);
  for (const r of rows) {
    assert.match(r.key, /^[a-z0-9-]+$/);
    assert.notEqual(r.activity, '(none)', `${r.key} has no activity heading above it`);
  }
});

test('the ticked rows are exactly the ones not remaining', () => {
  const rows = worklistRows(md);
  const remaining = new Set(worklistRemaining(md));
  for (const r of rows) assert.equal(r.ticked, !remaining.has(r.key), r.key);
});

test('keys are unique — a duplicated row would double-count the whole set', () => {
  const keys = worklistRows(md).map((r) => r.key);
  assert.equal(new Set(keys).size, keys.length);
});

// --- classification ---------------------------------------------------------

test('every picture lands in exactly one state, and they sum to the register', () => {
  const state = restyleState();
  const states = ['approved', 'stale', 'draft', 'ready', 'blocked', 'none'];
  const total = states.reduce((n, s) => n + state.filter((r) => r.status === s).length, 0);
  assert.equal(total, state.length);
  assert.equal(state.length, 37);
  for (const r of state) assert.ok(states.includes(r.status), `${r.key}: ${r.status}`);
});

test('approved means the worklist says so', () => {
  // The ledger used to be the authority here and the worklist the cross-check.
  // With the ledger deleted at the finish line the tick is the record, so what
  // is worth pinning is that the classification follows it exactly.
  const state = restyleState();
  for (const row of state) {
    if (row.status === 'approved') assert.ok(row.ticked, `${row.key} is approved but unticked`);
    // A ticked row is shipping: approved under the live brief, stale under a
    // superseded one, or a redraw of it awaiting review. Never ready or blocked.
    if (row.ticked) assert.ok(['approved', 'stale', 'draft'].includes(row.status), `${row.key}: ${row.status}`);
  }
});

test('a re-declared picture is work in progress, not shipping and not stale', () => {
  // door-sound-02-self went first under v2: its spec says the request is v2
  // and the master shipped under v1. Locally a round may exist (gitignored),
  // in a fresh clone none does, so the state is either — but never approved,
  // which would claim the redraw is done, and never stale, which would tell
  // someone to re-declare a spec that already is.
  const row = restyleState().find((r) => r.key === 'door-sound-02-self');
  assert.ok(row.ticked);
  assert.ok(['ready', 'draft', 'blocked'].includes(row.status), row.status);
  assert.match(row.detail, /redraw|review it|after /, row.detail);
});

test('a picture that shipped under a superseded brief is to redraw, spec or no spec', () => {
  // Two ways to be stale. A spec that still declares the old brief is the
  // committed record of what its master was drawn under; a ticked row with no
  // spec at all was drawn by hand before the pipeline existed. Both ship, both
  // were drawn in the old room, and both say what to do next.
  const stale = restyleState().filter((r) => r.status === 'stale');
  for (const row of stale) {
    assert.ok(row.ticked, `${row.key}: only a shipping picture can be stale`);
    assert.match(row.detail, /re-declare to redraw|write one to redraw/, row.key);
  }
});

/**
 * The Stay ladder as a chain: each rung may only be drawn off the one before it.
 *
 * The rungs' own states are deliberately not written down here. This test used
 * to assert that every one of them was blocked and that the head was ready,
 * which held only until the head was approved — at which point the suite failed
 * because the ladder had worked. What is true at every point on the walk is the
 * relationship, so that is what is asserted.
 */
const LADDER = {
  'door-stay-03-halfway': 'door-stay-03-onestep',
  'door-stay-03-cross': 'door-stay-03-halfway',
  'door-stay-03-handle': 'door-stay-03-cross',
  'door-stay-03-crack': 'door-stay-03-handle',
  'door-stay-03-pretend': 'door-stay-03-crack',
  'door-stay-03-conversation': 'door-stay-03-pretend',
  'door-stay-cover': 'door-stay-03-conversation',
};
const LADDER_HEAD = 'door-stay-03-onestep';

test('a rung is blocked exactly when the rung before it is not yet approved', () => {
  const state = restyleState();
  const by = (k) => state.find((r) => r.key === k);
  for (const [rung, predecessor] of Object.entries(LADDER)) {
    const row = by(rung);
    // A stale rung is paused, not blocked: it ships, and re-declaring its spec
    // is the next move. The relationship below is about rungs being drawn now.
    if (row.status === 'stale') continue;
    if (by(predecessor).status === 'approved') {
      assert.notEqual(row.status, 'blocked', `${rung} follows an approved rung, so it is drawable`);
    } else {
      assert.equal(row.status, 'blocked', `${rung} follows an unapproved rung, so it is not`);
      assert.ok(row.detail.includes(predecessor), `${rung} should name ${predecessor}, said "${row.detail}"`);
    }
  }
});

test('an unfinished ladder always has exactly one rung open, and never two', () => {
  // The whole point of the chain: one place to work at a time, and never a
  // state where there is nowhere to work but rungs are still left.
  const state = restyleState();
  const rungs = [LADDER_HEAD, ...Object.keys(LADDER)];
  const statusOf = (k) => state.find((r) => r.key === k).status;
  const open = rungs.filter((k) => !['approved', 'blocked', 'stale'].includes(statusOf(k)));
  assert.ok(open.length <= 1, `the ladder is sequential, so at most one rung is open: ${open}`);
  // Stale rungs are a deliberate pause — the next move is a spec edit, not a
  // generate — so "stuck" only means something once none of them is stale.
  if (rungs.some((k) => statusOf(k) !== 'approved') && !rungs.some((k) => statusOf(k) === 'stale')) {
    assert.equal(open.length, 1, 'rungs are left but none is open — the ladder is stuck');
  }
});

test('a picture with no spec reads as unspecced rather than ready', (t) => {
  // Found at run time. This named plan-mat until plan-mat was given a spec —
  // the eighth test here to break because the work moved on. When every row has
  // a spec there is nothing to assert and that is the set being finished, so it
  // skips rather than failing.
  const unspecced = restyleState().filter((r) => r.status === 'none');
  if (!unspecced.length) return t.skip('every picture has a spec now');
  for (const row of unspecced) assert.match(row.detail, /no spec/, row.key);
});

