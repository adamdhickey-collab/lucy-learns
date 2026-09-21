// node --test scripts/lib/*.test.mjs
//
// The handout's frequencies, and the arithmetic that answers "is it due".
//
// The first test in this directory that is about the app rather than the
// illustration pipeline, and it is here rather than beside js/ for one
// practical reason: the workflow runs `node --test scripts/lib/*.test.mjs` and
// nothing else, so a test file anywhere else would be a test nobody runs. That
// is the same failure the checks workflow was written to fix.
//
// What is worth pinning is the window. `cadenceFor` compares a session's date
// against a rolling seven days, and a boundary that is wrong by one day reports
// a household as up to date when they are not, or nags them for work they did.
// It is invisible for a week and then it is a wrong answer on the one screen
// that exists to answer that question.
//
// The `sessions` argument is the seam that makes this testable without a store.

import assert from 'node:assert/strict';
import test from 'node:test';

import { cadenceFor } from '../../js/metrics.js';
import { cadenceWords, cadenceStatus } from '../../js/ui.js';
import * as excited from '../../js/content/excited.js';
import * as door from '../../js/content/door.js';

const WEEKLY = { min: 1, max: 2, per: 'week' };
const DAILY = { min: 1, max: 1, per: 'day' };
const TWICE_DAILY = { min: 1, max: 2, per: 'day' };

const activity = { id: 'a1' };
const level = (cadence) => ({ number: 1, cadence });

/** A session for `activity`, `n` days before now, at midday to avoid edges. */
const ago = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return { activityId: 'a1', startedAt: d.toISOString() };
};

// --- the window -------------------------------------------------------------

test('a week is the rolling seven days ending today, edges included', () => {
  // Six days ago is inside a seven-day window that counts today; seven is not.
  // This is the boundary the whole feature turns on.
  assert.equal(cadenceFor(activity, level(WEEKLY), [ago(6)]).done, 1, 'six days ago counts');
  assert.equal(cadenceFor(activity, level(WEEKLY), [ago(7)]).done, 0, 'seven days ago does not');
  assert.equal(cadenceFor(activity, level(WEEKLY), [ago(30)]).done, 0);
});

test('a day is today only', () => {
  assert.equal(cadenceFor(activity, level(DAILY), [ago(0)]).done, 1);
  assert.equal(cadenceFor(activity, level(DAILY), [ago(1)]).done, 0, 'yesterday does not count today');
});

test('another activity’s sessions are not this one’s', () => {
  const other = [{ activityId: 'a2', startedAt: new Date().toISOString() }];
  assert.equal(cadenceFor(activity, level(DAILY), other).done, 0);
});

// --- due, met, ahead --------------------------------------------------------

test('nothing logged is due; the minimum satisfies it; the maximum is ahead', () => {
  const at = (n) => cadenceFor(activity, level(WEEKLY), Array.from({ length: n }, () => ago(0)));
  assert.deepEqual(
    [at(0).due, at(0).met, at(0).ahead],
    [true, false, false],
    'none logged'
  );
  assert.deepEqual([at(1).due, at(1).met, at(1).ahead], [false, true, false], 'the minimum');
  assert.deepEqual([at(2).due, at(2).met, at(2).ahead], [false, true, true], 'the maximum');
  // Past the maximum is still met and still ahead, never negative or wrapped.
  assert.deepEqual([at(5).due, at(5).met, at(5).ahead], [false, true, true], 'past the maximum');
});

test('a level with no cadence has no opinion, which is what the door pack has', () => {
  assert.equal(cadenceFor(activity, level(undefined), [ago(0)]), null);
  assert.equal(cadenceFor(activity, { number: 1 }, [ago(0)]), null);
  assert.equal(cadenceFor(activity, null, []), null);
});

// --- the words --------------------------------------------------------------

test('a cadence is said the way the handout says it', () => {
  assert.equal(cadenceWords(DAILY), 'Daily');
  assert.equal(cadenceWords(TWICE_DAILY), 'Once or twice a day');
  assert.equal(cadenceWords(WEEKLY), 'Once or twice a week');
  assert.equal(cadenceWords({ min: 1, max: 1, per: 'week' }), 'Once a week');
  assert.equal(cadenceWords(null), '');
});

test('the status sentence always starts with a capital and never says NaN', () => {
  const cases = [WEEKLY, DAILY, TWICE_DAILY].flatMap((c) =>
    [0, 1, 2, 3].map((done) => ({
      ...c,
      done,
      due: done < c.min,
      met: done >= c.min,
      ahead: done >= c.max,
    }))
  );
  for (const c of cases) {
    const said = cadenceStatus(c);
    assert.ok(said.length, JSON.stringify(c));
    assert.match(said, /^[A-Z]/, `not capitalised: "${said}"`);
    assert.doesNotMatch(said, /NaN|undefined|-\d/, `bad number in "${said}"`);
  }
  assert.equal(cadenceStatus(null), '');
});

// --- the content ------------------------------------------------------------

test('every level of the boot camp pack declares a cadence the app understands', () => {
  let levels = 0;
  for (const a of excited.ACTIVITIES) {
    for (const l of a.levels) {
      levels += 1;
      const c = l.cadence;
      assert.ok(c, `${a.id} L${l.number} has no cadence`);
      assert.ok(['day', 'week'].includes(c.per), `${a.id} L${l.number}: per "${c.per}"`);
      assert.ok(Number.isInteger(c.min) && c.min >= 1, `${a.id} L${l.number}: min`);
      assert.ok(Number.isInteger(c.max) && c.max >= c.min, `${a.id} L${l.number}: max`);
      assert.ok(cadenceWords(c), `${a.id} L${l.number}: no words for ${JSON.stringify(c)}`);
    }
  }
  assert.equal(levels, 29);
});

test('the frequency is in the field, not repeated in the prose beside it', () => {
  // It lived in each `setup` sentence before the field existed. Two copies of
  // the same fact is the thing that drifts, and here it would drift into the
  // app saying "once or twice a week" under a chip reading "Due today".
  for (const a of excited.ACTIVITIES) {
    for (const l of a.levels) {
      // Anchored to the end, because that is where the frequency sat: a
      // sentence of its own closing the setup line. An unanchored match
      // reported Leave It level 3 for "practice on your daily walk", which is
      // a place and not a frequency — and a test that cries wolf gets muted.
      assert.doesNotMatch(
        l.setup,
        /(once or twice a (day|week)|once a (day|week)|daily)\.\s*$/i,
        `${a.id} L${l.number} still says its frequency in prose`
      );
    }
  }
});

test('the door pack declares no cadence, so nothing about that app changes', () => {
  for (const a of door.ACTIVITIES) {
    for (const l of a.levels) {
      assert.equal(l.cadence, undefined, `${a.id} L${l.number} unexpectedly has a cadence`);
    }
  }
});
