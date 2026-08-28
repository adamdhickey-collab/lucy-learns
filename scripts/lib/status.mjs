// `pilot.mjs status` — where the restyle actually is.
//
// Thirty-seven pictures, drawn over weeks, in a chain where some cannot be
// started until others are finished. The state of any one of them lives in four
// different places: the worklist says whether it is done, css/app.css says
// whether it is opted out of the art grade, art/scenes/ says whether it has been
// written, and art/pilot/restyle/ says whether anything has been drawn. Holding
// that in your head across a session is how a rung gets skipped.
//
// So this reads all four and prints one line per picture. It writes nothing.
//
// It also cross-checks the two registers that must agree — the worklist's ticks
// and the ledger's opt-outs — because they are maintained by the same command
// and a disagreement means an approve went half-finished.

import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { loadScene, SCENES_DIR } from './scene.mjs';
import { ledgerKeys } from './ledger.mjs';
import { worklistRows } from './worklist.mjs';
import { RESTYLE_DIR, outputPaths } from './request.mjs';
import { WORKLIST, CSS } from './approve.mjs';

/** Every restyle round that holds a master for a key, highest first. */
function draftsFor(key) {
  const dir = path.join(ROOT, RESTYLE_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((d) => /^round-(\d+)$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .filter((r) => fs.existsSync(path.join(ROOT, outputPaths(key, r).master)))
    .sort((a, b) => b - a);
}

const MARK = {
  approved: '✓',
  draft: '~',
  ready: '·',
  blocked: '⋯',
  none: ' ',
};

/**
 * The state of every picture in the register, computed and returned.
 *
 * Separated from the printing so it can be asserted without capturing stdout —
 * the interesting part is the classification, not the layout.
 */
export function restyleState({ root = ROOT } = {}) {
  const rows = worklistRows(fs.readFileSync(path.join(root, WORKLIST), 'utf8'));
  const redrawn = new Set(ledgerKeys(fs.readFileSync(path.join(root, CSS), 'utf8')));
  const specced = new Set(
    fs.existsSync(SCENES_DIR)
      ? fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : []
  );

  return rows.map((row) => {
    const drafts = draftsFor(row.key);
    let status = 'none';
    let detail = '';
    if (redrawn.has(row.key)) {
      status = 'approved';
      detail = 'redrawn and shipping';
    } else if (drafts.length) {
      status = 'draft';
      detail = `round ${drafts[0]}${drafts.length > 1 ? ` (of ${drafts.length})` : ''} — review it`;
    } else if (specced.has(row.key)) {
      const scene = loadScene(row.key);
      const waiting = scene.references.filter((r) => r.pending).map((r) => r.fromScene);
      status = waiting.length ? 'blocked' : 'ready';
      detail = waiting.length ? `after ${waiting.join(', ')}` : 'ready to generate';
    } else {
      detail = 'no spec yet';
    }
    return { ...row, status, detail, drift: row.ticked !== redrawn.has(row.key) };
  });
}

export function cmdStatus(argv = []) {
  const only = argv.find((a) => !a.startsWith('-'));
  const state = restyleState();
  const shown = only ? state.filter((r) => r.key.includes(only)) : state;
  if (!shown.length) {
    console.error(`\n  nothing matching "${only}"\n`);
    process.exit(1);
  }

  let activity = null;
  console.log('');
  for (const r of shown) {
    if (r.activity !== activity) {
      activity = r.activity;
      console.log(`  ${activity}`);
    }
    const note = r.notes && r.notes !== '—' ? `  · ${r.notes}` : '';
    console.log(`    ${MARK[r.status]} ${r.key.padEnd(28)} ${r.detail}${note}`);
  }

  const count = (s) => state.filter((r) => r.status === s).length;
  console.log(
    `\n  ${count('approved')} approved · ${count('draft')} awaiting review · ` +
      `${count('ready')} ready · ${count('blocked')} blocked · ${count('none')} unspecced` +
      `   (${state.length} total)`
  );

  // The two registers approve maintains. If they disagree, an approve stopped
  // halfway and one of them is lying about what is finished.
  const drift = state.filter((r) => r.drift);
  if (drift.length) {
    console.log(`\n  ⚠ the worklist and the pilot ledger disagree about:`);
    for (const r of drift) {
      console.log(`    ${r.key} — worklist says ${r.ticked ? 'done' : 'not done'}, ledger says ${!r.ticked ? 'done' : 'not done'}`);
    }
  }

  const next = state.filter((r) => r.status === 'draft');
  const ready = state.filter((r) => r.status === 'ready');
  console.log('');
  if (next.length) {
    console.log(`  review first:  ${next.map((r) => r.key).join(', ')}`);
  }
  if (ready.length) {
    console.log(`  next to generate:  ${ready.slice(0, 3).map((r) => r.key).join(', ')}` +
      (ready.length > 3 ? `  (+${ready.length - 3} more)` : ''));
  }
  if (!next.length && !ready.length && !count('blocked') && !count('none')) {
    console.log('  the list is clear — see the finish line in docs/illustration-pipeline.md');
  }
  console.log('');
}
