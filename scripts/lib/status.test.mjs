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
  const legacy = 'door-sound-03-name';
  assert.ok(fs.existsSync(path.join(ROOT, `art/pilot/approved/${legacy}.png`)));
  assert.notEqual(state.find((r) => r.key === legacy).status, 'approved');
});

test('a blocked picture names the rung it is actually waiting on', () => {
  const state = restyleState();
  const chain = {
    'door-stay-03-halfway': 'door-stay-03-onestep',
    'door-stay-03-cross': 'door-stay-03-halfway',
    'door-stay-03-handle': 'door-stay-03-cross',
    'door-stay-03-crack': 'door-stay-03-handle',
    'door-stay-03-pretend': 'door-stay-03-crack',
    'door-stay-03-conversation': 'door-stay-03-pretend',
    'door-stay-cover': 'door-stay-03-conversation',
  };
  for (const [key, predecessor] of Object.entries(chain)) {
    const row = state.find((r) => r.key === key);
    assert.equal(row.status, 'blocked', `${key} should be blocked`);
    assert.ok(row.detail.includes(predecessor), `${key} should name ${predecessor}, said "${row.detail}"`);
  }
});

test('the head of the ladder is ready, not blocked', () => {
  const row = restyleState().find((r) => r.key === 'door-stay-03-onestep');
  assert.equal(row.status, 'ready');
});

test('a picture with no spec reads as unspecced rather than ready', () => {
  const row = restyleState().find((r) => r.key === 'door-greet-cover');
  assert.equal(row.status, 'none');
  assert.match(row.detail, /no spec/);
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
  write(WORKLIST, md.replace(/^\|\s*\[ \]\s*\|\s*`door-place-cover`/m, '| [x] | `door-place-cover`'));
  write(CSS, css);
  const row = restyleState({ root: dir }).find((r) => r.key === 'door-place-cover');
  assert.equal(row.drift, true);
});
