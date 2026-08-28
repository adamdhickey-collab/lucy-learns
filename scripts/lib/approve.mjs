// `pilot.mjs approve <scene> --yes` — the human decision, once it is made.
//
// generate produces drafts and stops, because approving art is a judgement and
// a script has no business making it. What a script is good at is everything
// that follows the judgement, which is where this set has actually lost time:
// installing a picture is one copy, but the five steps around it are a JPEG
// recipe with two exact sizes, a thumbnail whose name is load-bearing, a master
// filed under the shipped key, seven lines of CSS in two blocks so the flat art
// skips the warm-art grade, and a checkbox on the list the whole effort is
// measured against. Miss the CSS and the picture renders greyer than its
// neighbours; miss the checkbox and the list quietly lies about what is left.
//
// So: the judgement is yours, the bookkeeping is this.
//
// It does not commit, and it does not bump the version. Both are release
// decisions, and the release here is the finish line — when the last scene
// lands, the grade tokens and the ledger come out in one commit and the version
// moves once.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { loadScene } from './scene.mjs';
import { MASTER, RESTYLE_DIR, outputPaths } from './request.mjs';
import { imageSize } from './imagesize.mjs';
import { addToLedger, ledgerKeys } from './ledger.mjs';
import { tickWorklist, worklistTotal, worklistRemaining } from './worklist.mjs';

/** What ships, and how. Measured off the existing set, not invented. */
export const SHIPPED = { width: 1100, quality: 72 };
export const THUMB = { width: 240, quality: 72 };

export const CSS = 'css/app.css';
export const WORKLIST = 'art/source/restyle-worklist.md';
export const APPROVED_DIR = 'art/pilot/approved';

/** `sips` argv to render a shipped JPEG from the master. */
export function sipsShip(master, out, width, quality) {
  // -Z fits the longest edge, which is the width on a landscape 4:3 and gives
  // an exact 1100×825 and 240×180 from a 1448×1086 master — both integers, no
  // rounding to argue about.
  return [
    'sips',
    '-Z', String(width),
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', String(quality),
    master,
    '--out', out,
  ];
}

/** The highest restyle round holding a master for this scene. */
export function latestRound(sceneId, fsx = fs, base = ROOT) {
  const dir = path.join(base, RESTYLE_DIR);
  if (!fsx.existsSync(dir)) return null;
  const rounds = fsx
    .readdirSync(dir)
    .map((d) => /^round-(\d+)$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a);
  for (const r of rounds) {
    if (fsx.existsSync(path.join(base, outputPaths(sceneId, r).master))) return r;
  }
  return null;
}

function runSips(argv, what, cwd) {
  try {
    execFileSync(argv[0], argv.slice(1), { stdio: 'ignore', cwd });
  } catch (e) {
    throw new Error(
      `${what} failed.\n  ${argv.join(' ')}\n  ` +
        (e.code === 'ENOENT' ? 'sips was not found — this needs macOS.' : `sips exited ${e.status ?? '?'}`)
    );
  }
}

export async function cmdApprove(
  sceneId,
  argv = [],
  { sips = runSips, base = ROOT, log = console.log } = {}
) {
  const yes = argv.includes('--yes');
  const at = argv.indexOf('--round');
  const asked = at === -1 ? null : Number(argv[at + 1]);
  const say = (...a) => log(...a);
  const abs = (p) => path.resolve(base, p);

  if (!sceneId) throw new Error('approve <scene-id> [--round N] --yes');
  if (at !== -1 && !Number.isInteger(asked)) throw new Error('--round takes a number');

  const scene = loadScene(sceneId);
  const round = asked ?? latestRound(sceneId, fs, base);
  if (round === null) {
    throw new Error(`no generated round for ${sceneId} — run \`generate ${sceneId} --yes\` first`);
  }
  const out = outputPaths(sceneId, round);
  if (!fs.existsSync(abs(out.master))) throw new Error(`no master at ${out.master}`);

  // The master is the thing being promoted, so it is checked rather than
  // trusted: a wrong size here becomes a wrong-shaped shipped image and a
  // thumbnail that no longer matches its full picture.
  const size = imageSize(fs.readFileSync(abs(out.master)));
  if (size.width !== MASTER.width || size.height !== MASTER.height) {
    throw new Error(
      `${out.master} is ${size.width}×${size.height}, not ${MASTER.width}×${MASTER.height}`
    );
  }

  let manifest = null;
  if (fs.existsSync(abs(out.manifest))) {
    manifest = JSON.parse(fs.readFileSync(abs(out.manifest), 'utf8'));
    if (manifest.briefId !== scene.briefId) {
      throw new Error(
        `round ${round} was generated against brief "${manifest.briefId}", ` +
          `but the scene now declares "${scene.briefId}"`
      );
    }
  }

  const shipped = `img/${sceneId}.jpg`;
  const thumb = `img/thumb-${sceneId}.jpg`;
  const master = `${APPROVED_DIR}/${sceneId}.png`;
  const css = fs.readFileSync(abs(CSS), 'utf8');
  const worklist = fs.readFileSync(abs(WORKLIST), 'utf8');
  const alreadyLedgered = ledgerKeys(css).includes(sceneId);

  if (!yes) {
    say(`\n  approve ${sceneId} from round ${round}\n`);
    say(`    ${shipped}   ← ${SHIPPED.width}px wide, JPEG q${SHIPPED.quality}`);
    say(`    ${thumb}   ← ${THUMB.width}px wide, JPEG q${THUMB.quality}`);
    say(`    ${master}   ← the master, replacing the one shipping today`);
    say(`    ${CSS}   ${alreadyLedgered ? '(already in the ledger)' : '← opt out of the art grade'}`);
    say(`    ${WORKLIST}   ← tick the row`);
    say(`\n  This replaces what the app shows. Re-run with --yes.\n`);
    return { approved: false };
  }

  fs.mkdirSync(abs('img'), { recursive: true });
  sips(sipsShip(out.master, shipped, SHIPPED.width, SHIPPED.quality), 'the shipped render', base);
  sips(sipsShip(out.master, thumb, THUMB.width, THUMB.quality), 'the thumbnail', base);

  // Both are checked, because the pair is a contract: js/content.js derives the
  // thumb path from the full one, so a thumb that failed to write is a broken
  // image on every card rather than a missing file someone notices.
  const rendered = { shipped: imageSize(fs.readFileSync(abs(shipped))), thumb: imageSize(fs.readFileSync(abs(thumb))) };
  for (const [name, want, got] of [
    [shipped, SHIPPED.width, rendered.shipped],
    [thumb, THUMB.width, rendered.thumb],
  ]) {
    if (got.width !== want) throw new Error(`${name} came out ${got.width}px wide, not ${want}`);
  }

  fs.mkdirSync(abs(APPROVED_DIR), { recursive: true });
  fs.copyFileSync(abs(out.master), abs(master));

  const total = worklistTotal(worklist);
  fs.writeFileSync(abs(CSS), addToLedger(css, sceneId, total));
  const ticked = tickWorklist(worklist, sceneId);
  fs.writeFileSync(abs(WORKLIST), ticked);

  if (manifest) {
    fs.writeFileSync(
      abs(out.manifest),
      JSON.stringify({ ...manifest, approved: true, approvedAt: new Date().toISOString() }, null, 2) + '\n'
    );
  }

  const left = worklistRemaining(ticked);
  say(`\n  ${sceneId} approved from round ${round}\n`);
  say(`    ${shipped}   ${rendered.shipped.width}×${rendered.shipped.height}`);
  say(`    ${thumb}   ${rendered.thumb.width}×${rendered.thumb.height}`);
  say(`    ${master}`);
  say(`    ${CSS}   ${alreadyLedgered ? 'already ledgered' : 'ledgered — skips the art grade'}`);
  say(`    ${WORKLIST}   ticked`);
  say(`\n  ${total - left.length} of ${total} redrawn · ${left.length} still warm`);
  if (left.length) {
    say(`  next: ${left.slice(0, 3).join(', ')}${left.length > 3 ? ', …' : ''}`);
  } else {
    say('\n  THE LIST IS CLEAR. Now delete --art-grade, --art-veil, the rules that');
    say('  apply them and the whole ledger block from css/app.css — in one commit,');
    say('  or the last few pictures get graded alone. That deletion is the finish line.');
  }
  say('\n  Nothing committed. Review the diff, then commit it yourself.\n');

  return { approved: true, round, shipped, thumb, master, remaining: left.length, total };
}
