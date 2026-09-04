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
import { loadScene, refuseStale, assemblePrompt, ROLES, legacyMaster, SCENES_DIR } from './scene.mjs';
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
import { profileFor, isDirect } from './profiles.mjs';

const rule = (label) => `\n${'─'.repeat(4)} ${label} ${'─'.repeat(Math.max(0, 68 - label.length))}`;

export function cmdPlan(sceneId, { scenesDir = SCENES_DIR } = {}) {
  if (!sceneId) {
    const dir = path.join(ROOT, 'art/scenes');
    const known = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    console.error(`\n  plan <scene-id>\n\n  known scenes: ${known.join(', ') || '(none)'}\n`);
    process.exit(1);
  }

  const scene = loadScene(sceneId, { dir: scenesDir });
  refuseStale(scene);
  const profile = profileFor(scene);
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
    console.log(`  ${r.order}. ${r.path}`);
    console.log(`     role  ${r.role} — ${ROLES[r.role]}`);
    if (r.fromScene) {
      console.log(
        `     from  scene ${r.fromScene} — ` +
          (r.pending
            ? 'NOT REDRAWN YET. Generate and approve it before this one.'
            : 'redrawn and approved')
      );
    }
    const size = r.exists ? `${(fs.statSync(r.abs).size / 1024).toFixed(0)} KB` : '—';
    const state = r.pending ? 'WAITING' : r.exists ? 'ok' : 'NOT FOUND';
    console.log(`     file  ${state} · ${size}`);
  }

  const waiting = scene.references.filter((r) => r.pending);
  if (waiting.length) {
    console.log(`\n  This scene cannot be generated yet. It is waiting on:`);
    for (const r of waiting) console.log(`    ${r.fromScene}`);
  }

  console.log(rule('PLANNED API OPERATION'));
  console.log(`  operation  ${REQUEST.operation}`);
  console.log(`  endpoint   ${REQUEST.method} ${REQUEST.endpoint}`);
  console.log(`  transport  ${REQUEST.transport}`);
  console.log(`  auth       ${REQUEST.auth}`);
  console.log(`  model      ${REQUEST.model}`);
  console.log('  parameters');
  for (const [k, v] of Object.entries(REQUEST.parameters)) {
    const shown = k === 'size' ? `${profile.source.width}x${profile.source.height}` : v;
    console.log(`    ${k.padEnd(15)} ${shown}`);
  }
  console.log(`  images     ${scene.references.length} of a documented maximum ${SIZE_LIMITS.maxImages}`);
  console.log(`  response   ${REQUEST.response}`);
  console.log(`  cost       ${REQUEST.pricing}`);
  console.log('\n  no input_fidelity: gpt-image-2 processes every input at high fidelity');
  console.log('  automatically and rejects the parameter.');
  console.log(`\n  verified against ${REQUEST.verifiedAgainst}`);
  console.log(`  still unverified: ${REQUEST.unverified}`);

  console.log(rule('CANVAS AND CONVERSION'));
  console.log(`  Profile       ${profile.id} — ${profile.what}`);
  console.log(`  API canvas    ${profile.source.width}×${profile.source.height}`);
  console.log(`  Final master  ${profile.master.width}×${profile.master.height}`);
  console.log(`  Conversion    ${profile.conversion}`);
  if (isDirect(profile)) {
    console.log('\n  The canvas is already the master, so there is no resample and no');
    console.log('  crop box: the master is a copy of the raw.');
  } else {
    console.log(
      `\n  Both are exactly 4:3, so the two edges scale by the same ${(profile.master.width / profile.source.width).toFixed(5)}`
    );
    console.log('  factor. No crop box is computed anywhere on this path.');
    console.log('\n  the exact command, run on the Mac:');
    console.log(`    ${sipsDownscale(out.raw, out.master, profile.master).join(' ')}`);
    console.log('    (--resampleHeightWidth takes HEIGHT then WIDTH, in that order)');
  }

  console.log(rule('PLANNED OUTPUT PATHS'));
  console.log(`  round      ${out.round} (next unused under ${RESTYLE_DIR})`);
  console.log(`  raw        ${out.raw}  — ${profile.source.width}×${profile.source.height}, kept as returned`);
  console.log(`  master     ${out.master}  — ${profile.master.width}×${profile.master.height}`);
  console.log(
    `  crops      ${out.crops}/  — ${
      { icon: 'the maskable safe zone, 512, 192, 180, 48', avatar: '400px, 84px, 56px' }[
        profile.renditions
      ] ?? 'square, 84px, 56px, 21:9'
    }`
  );
  console.log(`  sheet      ${out.sheet}`);
  console.log(`  manifest   ${out.manifest}`);
  console.log('\n  Restyle rounds have their own counter starting at 1. The tan-era');
  console.log('  rounds 1-19 are cited by number in docs/pilot-prompts.md, so the two');
  console.log('  numbering lines are kept apart rather than continued.');
  console.log('\n  Drafts only. Nothing is written to img/ or art/pilot/approved/,');
  console.log('  and nothing is committed. Promotion stays a human step.');

  console.log(rule('MANIFEST A RUN WOULD WRITE'));
  console.log(
    JSON.stringify(manifestSkeleton(scene, out, null, profile), null, 2)
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
  console.log('  plan only — no API request was made and no files were written.');
  console.log(`\n  to actually send it:\n` +
    `    node --env-file=.env.local scripts/pilot.mjs generate ${scene.id} --yes\n`);
}
