// node --test scripts/lib/*.test.mjs
//
// status answers "what is left", which is the question people act on, so the
// classification is worth pinning: every picture in exactly one state, the
// blocked ones naming the right predecessor, and the two registers that must
// agree checked against each other.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { restyleState } from './status.mjs';
import { worklistRows, worklistTotal, worklistRemaining } from './worklist.mjs';
import { ledgerKeys } from './ledger.mjs';
import { WORKLIST, CSS } from './approve.mjs';

const md = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');
const css = fs.readFileSync(path.join(ROOT, CSS), 'utf8');

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
  const states = ['approved', 'draft', 'ready', 'blocked', 'none'];
  const total = states.reduce((n, s) => n + state.filter((r) => r.status === s).length, 0);
  assert.equal(total, state.length);
  assert.equal(state.length, 37);
  for (const r of state) assert.ok(states.includes(r.status), `${r.key}: ${r.status}`);
});

test('approved means in the pilot ledger, not merely a file on disk', () => {
  const state = restyleState();
  const approved = state.filter((r) => r.status === 'approved').map((r) => r.key).sort();
  assert.deepEqual(approved, [...ledgerKeys(css)].sort());
  // The trap this exists to avoid: a legacy warm master under the same name.
  // This named door-sound-03-name until that scene was redrawn, at which point
  // the example became its own opposite and the test failed for the one reason
  // it should not — the pipeline working. So it asserts over every legacy
  // master the ledger has not claimed yet, and names none of them.
  const ledger = new Set(ledgerKeys(css));
  const legacyOnly = state.filter(
    (r) => !ledger.has(r.key) && fs.existsSync(path.join(ROOT, `art/pilot/approved/${r.key}.png`)),
  );
  assert.ok(legacyOnly.length > 0, 'no un-redrawn legacy master left to tell the two apart with');
  for (const r of legacyOnly) assert.notEqual(r.status, 'approved', r.key);
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
  const open = rungs.filter((k) => !['approved', 'blocked'].includes(statusOf(k)));
  assert.ok(open.length <= 1, `the ladder is sequential, so at most one rung is open: ${open}`);
  if (rungs.some((k) => statusOf(k) !== 'approved')) {
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

// --- the integrity check ----------------------------------------------------

test('the worklist and the ledger currently agree', () => {
  const drift = restyleState().filter((r) => r.drift);
  assert.deepEqual(drift.map((r) => r.key), [],
    'a tick without a ledger entry (or the reverse) means an approve stopped halfway');
});

test('drift is detected when the two registers disagree', () => {
  // Tick a row without ledgering it — exactly what a half-finished approve
  // leaves behind — and check the state notices.
  const dir = fs.mkdtempSync(path.join(fs.realpathSync('/tmp'), 'drift-'));
  const write = (rel, data) => {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), data);
  };
  // The key is found at run time rather than named. This said door-place-cover
  // until that row was ticked, at which point the regex stopped matching, the
  // replace did nothing, no drift was created and the test failed — the seventh
  // in this suite to break because the restyle progressed.
  const untickedRow = /^\|\s*\[ \]\s*\|\s*`([a-z0-9-]+)`/m.exec(md);
  assert.ok(untickedRow, 'no unticked row left to simulate a half-finished approve with');
  const key = untickedRow[1];
  write(WORKLIST, md.replace(untickedRow[0], `| [x] | \`${key}\``));
  write(CSS, css);
  const row = restyleState({ root: dir }).find((r) => r.key === key);
  assert.equal(row.drift, true, `${key} is ticked but not ledgered, which is drift`);
});
