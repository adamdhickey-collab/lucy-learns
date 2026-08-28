// `pilot.mjs plan <scene>` — everything a run would do, without doing any of it.
//
// The point of plan mode is that a paid, non-deterministic operation gets
// inspected before it is spent. It resolves the spec, assembles the prompt,
// resolves every reference against the filesystem in declared order, and prints
// the request and the paths a run would write to.
//
// It reads no environment variables. Not the key, not anything — so there is
// nothing here that could print a secret even by accident.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './brief.mjs';
import { loadScene, assemblePrompt, ROLES, legacyMaster } from './scene.mjs';
import {
  REQUEST,
  RESTYLE_DIR,
  SOURCE,
  MASTER,
  CONVERSION,
  SIZE_LIMITS,
  outputPaths,
  nextRound,
  sipsDownscale,
  manifestSkeleton,
} from './request.mjs';

const rule = (label) => `\n${'─'.repeat(4)} ${label} ${'─'.repeat(Math.max(0, 68 - label.length))}`;

export function cmdPlan(sceneId) {
  if (!sceneId) {
    const dir = path.join(ROOT, 'art/scenes');
    const known = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    console.error(`\n  plan <scene-id>\n\n  known scenes: ${known.join(', ') || '(none)'}\n`);
    process.exit(1);
  }

  const scene = loadScene(sceneId);
  const prompt = assemblePrompt(scene);
  const round = nextRound(fs);
  const out = outputPaths(scene.id, round);

  console.log(rule('SCENE'));
  console.log(`  id        ${scene.id}`);
  if (scene.title) console.log(`  title     ${scene.title}`);
  if (scene.activity) console.log(`  activity  ${scene.activity}`);
  if (scene.step) console.log(`  step      ${scene.step}`);
  console.log(`  blocks    ${scene.blocks.join(' + ')}`);
  console.log(`  brief     ${scene.briefId}`);

  console.log(rule('ASSEMBLED PROMPT'));
  console.log(prompt.split('\n').map((l) => (l ? `  ${l}` : '')).join('\n'));
  console.log(`\n  [${prompt.length} characters]`);

  console.log(rule('REFERENCES, in send order'));
  for (const r of scene.references) {
    const size = r.exists ? `${(fs.statSync(r.abs).size / 1024).toFixed(0)} KB` : 'MISSING';
    console.log(`  ${r.order}. ${r.path}`);
    console.log(`     role  ${r.role} — ${ROLES[r.role]}`);
    console.log(`     file  ${r.exists ? 'ok' : 'NOT FOUND'} · ${size}`);
  }

  console.log(rule('PLANNED API OPERATION'));
  console.log(`  operation  ${REQUEST.operation}`);
  console.log(`  endpoint   ${REQUEST.method} ${REQUEST.endpoint}`);
  console.log(`  transport  ${REQUEST.transport}`);
  console.log(`  auth       ${REQUEST.auth}`);
  console.log(`  model      ${REQUEST.model}`);
  console.log('  parameters');
  for (const [k, v] of Object.entries(REQUEST.parameters)) {
    console.log(`    ${k.padEnd(15)} ${v}`);
  }
  console.log(`  images     ${scene.references.length} of a documented maximum ${SIZE_LIMITS.maxImages}`);
  console.log(`  response   ${REQUEST.response}`);
  console.log(`  cost       ${REQUEST.pricing}`);
  console.log('\n  no input_fidelity: gpt-image-2 processes every input at high fidelity');
  console.log('  automatically and rejects the parameter.');
  console.log(`\n  verified against ${REQUEST.verifiedAgainst}`);
  console.log(`  still unverified: ${REQUEST.unverified}`);

  console.log(rule('CANVAS AND CONVERSION'));
  console.log(`  API canvas    ${SOURCE.width}×${SOURCE.height}`);
  console.log(`  Final master  ${MASTER.width}×${MASTER.height}`);
  console.log(`  Conversion    ${CONVERSION}`);
  console.log(
    `\n  Both are exactly 4:3, so the two edges scale by the same ${(MASTER.width / SOURCE.width).toFixed(5)}`
  );
  console.log('  factor. No crop box is computed anywhere on this path.');
  console.log('\n  the exact command, run on the Mac:');
  console.log(`    ${sipsDownscale(out.raw, out.master).join(' ')}`);
  console.log('    (--resampleHeightWidth takes HEIGHT then WIDTH, in that order)');

  console.log(rule('PLANNED OUTPUT PATHS'));
  console.log(`  round      ${out.round} (next unused under ${RESTYLE_DIR})`);
  console.log(`  raw        ${out.raw}  — ${SOURCE.width}×${SOURCE.height}, kept as returned`);
  console.log(`  master     ${out.master}  — ${MASTER.width}×${MASTER.height}`);
  console.log(`  crops      ${out.crops}/  — square, 84px, 56px, 21:9`);
  console.log(`  sheet      ${out.sheet}`);
  console.log(`  manifest   ${out.manifest}`);
  console.log('\n  Restyle rounds have their own counter starting at 1. The tan-era');
  console.log('  rounds 1-19 are cited by number in docs/pilot-prompts.md, so the two');
  console.log('  numbering lines are kept apart rather than continued.');
  console.log('\n  Drafts only. Nothing is written to img/ or art/pilot/approved/,');
  console.log('  and nothing is committed. Promotion stays a human step.');

  console.log(rule('MANIFEST A RUN WOULD WRITE'));
  console.log(
    JSON.stringify(manifestSkeleton(scene, out), null, 2)
      .split('\n')
      .map((l) => `  ${l}`)
      .join('\n')
  );

  const legacy = legacyMaster(scene.id);
  console.log(rule('EXISTING ART FOR THIS SCENE'));
  if (legacy) {
    console.log(`  ${legacy.path}`);
    console.log('  LEGACY WARM MASTER — the picture shipping today, drawn against the');
    console.log('  superseded brief. It is a continuity/reference asset only. It is not');
    console.log('  the approved result of this run, it is not read as one, and nothing');
    console.log('  in this pipeline overwrites or promotes into that directory.');
  } else {
    console.log('  none — no legacy master under art/pilot/approved/ for this scene.');
  }

  console.log(rule('STATUS'));
  console.log('  plan only — no API request was made and no files were written.\n');
}
