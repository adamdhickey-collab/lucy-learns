// `pilot.mjs generate <scene> --yes` — the one command that spends money.
//
// It does what `plan` describes and nothing more: assemble the prompt from the
// live brief, send the references in declared order, keep the raw result
// exactly as it arrived, make the master by proportional downscale, cut the
// review renditions, write a sheet and a manifest.
//
// THREE THINGS IT WILL NOT DO.
//
// Spend without being told to. A paid, non-deterministic call behind a bare
// verb is a call someone makes by pressing up-arrow. Without --yes this prints
// what it would cost and stops.
//
// Overwrite a round. Each run takes the next unused round number and refuses a
// directory that already exists, so a re-run is a new round and the round it is
// being compared against is still there to compare against.
//
// Promote anything. Nothing is written to img/ or art/pilot/approved/, and
// nothing is committed. The manifest says approved: false and only a person
// changes that.
//
// THE KEY is read from process.env.OPENAI_API_KEY at the moment of the call and
// used in one header. It is not an argument, not in the form body, not in the
// manifest, not in the sheet, and not in any error — failures print the API's
// own message and nothing of the request.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { loadScene, assemblePrompt, legacyMaster, pendingReferences } from './scene.mjs';
import {
  REQUEST,
  RESTYLE_DIR,
  apiKey,
  buildForm,
  callApi,
  outputPaths,
  nextRound,
  sipsDownscale,
  manifestSkeleton,
} from './request.mjs';
import { renditionPlan } from './renditions.mjs';
import { pngSize } from './imagesize.mjs';
import { reviewSheet } from './sheet.mjs';
import { profileFor, isDirect } from './profiles.mjs';

/** sips, with its output swallowed — it narrates every file it touches. */
function runSips(argv, what, cwd) {
  try {
    execFileSync(argv[0], argv.slice(1), { stdio: 'ignore', cwd });
  } catch (e) {
    throw new Error(
      `${what} failed.\n  ${argv.join(' ')}\n  ` +
        (e.code === 'ENOENT'
          ? 'sips was not found — this stage needs macOS.'
          : `sips exited ${e.status ?? '?'}`)
    );
  }
}

/**
 * The injected seams are the transport, the sips runner and the output root.
 *
 * Not for flexibility — there is one real configuration and these all default
 * to it. They exist so the whole orchestration can be driven on Linux without a
 * network, a key or macOS, because this is the function that writes files and
 * an untested writer is how a round lands half-made.
 */
export async function cmdGenerate(
  sceneId,
  argv = [],
  {
    fetchImpl = fetch,
    sips = runSips,
    outBase = ROOT,
    restyleDir = path.join(ROOT, RESTYLE_DIR),
    log = console.log,
  } = {}
) {
  const yes = argv.includes('--yes');
  const abs = (p) => path.resolve(outBase, p);
  const say = (...a) => log(...a);

  if (!sceneId) {
    const dir = path.join(ROOT, 'art/scenes');
    const known = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    throw new Error(`generate <scene-id> [--yes]\n  known scenes: ${known.join(', ') || '(none)'}`);
  }

  // Everything that can fail for free fails here, before the key is read and
  // before anything is spent: a bad spec, a missing reference, a brief that
  // does not match, a round directory already in the way.
  const scene = loadScene(sceneId);
  const profile = profileFor(scene);
  const prompt = assemblePrompt(scene);
  const round = nextRound(fs, restyleDir);
  const out = outputPaths(scene.id, round);
  if (fs.existsSync(abs(out.dir))) {
    throw new Error(`${out.dir} already exists — refusing to overwrite a round`);
  }

  // A ladder is one composition sampled at several points, and it only reads as
  // progress if each rung is drawn off the last. Generating out of order gets a
  // picture that looks fine alone and wrong in the sequence — and, worse, the
  // legacy warm master is already sitting under that name, so the attachment
  // would silently be the old style.
  const pending = pendingReferences(scene);
  if (pending.length) {
    throw new Error(
      `${scene.id} is waiting on ${pending.length === 1 ? 'a scene' : 'scenes'} that ` +
        `${pending.length === 1 ? 'has' : 'have'} not been redrawn yet:\n` +
        pending.map((r) => `    ${r.fromScene}  (${r.role})`).join('\n') +
        `\n  Generate and approve ${pending.length === 1 ? 'it' : 'them'} first — this rung has to be` +
        `\n  drawn off the last one, or the ladder stops reading as one walk.`
    );
  }

  if (!yes) {
    say(`\n  ${scene.id} — round ${round}, ${scene.references.length} references, ` +
        `${prompt.length} characters of prompt`);
    say(`  ${REQUEST.parameters.model} at ${profile.source.width}x${profile.source.height}, ` +
        `quality=${REQUEST.parameters.quality} · ${REQUEST.pricing}`);
    say(`\n  This spends money. Re-run with --yes to send it, or`);
    say(`  \`pilot.mjs plan ${scene.id}\` to read the whole request first.\n`);
    return { sent: false };
  }

  const key = apiKey();
  const form = buildForm(scene, prompt, (p) => fs.readFileSync(p), profile);

  say(`\n  → ${REQUEST.parameters.model}, ${scene.references.length} references, round ${round}`);
  const started = Date.now();
  const png = await callApi({
    form,
    key,
    fetchImpl,
    onRetry: ({ status, waitMs }) => say(`    ${status}, retrying in ${waitMs / 1000}s`),
  });
  const took = ((Date.now() - started) / 1000).toFixed(0);

  // What came back, before anything is resized. A wrong canvas here is the
  // tan-era failure repeating, and resizing it would hide that.
  const got = pngSize(png);
  const asked = `${profile.source.width}×${profile.source.height}`;
  say(`    ${got.width}×${got.height}, ${(png.length / 1048576).toFixed(2)} MB, ${took}s`);

  fs.mkdirSync(abs(path.dirname(out.raw)), { recursive: true });
  fs.writeFileSync(abs(out.raw), png);
  say(`\n  raw   ${out.raw}`);

  if (got.width !== profile.source.width || got.height !== profile.source.height) {
    throw new Error(
      `the model returned ${got.width}×${got.height}, not the ${asked} that was asked for.\n` +
        `  The raw file is kept at ${out.raw}. The master is NOT made: at a different\n` +
        `  ratio it would need a crop, and the brief's composition rules are written as\n` +
        `  fractions of the frame. Decide the crop deliberately, or re-run.`
    );
  }

  // A profile whose canvas already is its master gets a copy, not a resample.
  // Running sips anyway would re-encode the exact pixels the API returned for no
  // reason, and "the raw is never edited" would stop being literally true of the
  // only file that carries the model's own output.
  if (isDirect(profile)) {
    fs.copyFileSync(abs(out.raw), abs(out.master));
  } else {
    sips(sipsDownscale(out.raw, out.master, profile.master), 'the downscale to master', outBase);
  }
  const master = pngSize(fs.readFileSync(abs(out.master)));
  if (master.width !== profile.master.width || master.height !== profile.master.height) {
    throw new Error(
      `the master came out ${master.width}×${master.height}, ` +
        `not ${profile.master.width}×${profile.master.height}`
    );
  }
  say(`  master ${out.master}  (${profile.conversion})`);

  fs.mkdirSync(abs(out.crops), { recursive: true });
  const renditions = renditionPlan(
    out.master,
    out.crops,
    scene.id,
    profile.master.width,
    profile.master.height,
    profile.renditions
  );
  // Crops before thumbs: the thumbnails are cut from the square crop, so it has
  // to exist first. renditionPlan already returns them in that order.
  for (const r of renditions) sips(r.argv, `the ${r.name} rendition`, outBase);
  say(`  crops  ${out.crops}/  (${renditions.length} renditions)`);

  const generatedAt = new Date().toISOString();
  fs.writeFileSync(abs(out.sheet), reviewSheet(scene, out, renditions, { generatedAt }));
  fs.writeFileSync(
    abs(out.manifest),
    JSON.stringify(manifestSkeleton(scene, out, generatedAt, profile), null, 2) + '\n'
  );
  say(`  sheet  ${out.sheet}`);
  say(`  manifest ${out.manifest}`);

  const legacy = legacyMaster(scene.id);
  say('\n  Nothing installed, promoted or committed. The manifest says approved: false.');
  if (legacy) {
    say(`  ${legacy.path} is still the shipping picture and was not touched.`);
  }
  say(`\n  open ${out.sheet}\n`);

  return { sent: true, round, out, renditions, generatedAt };
}
