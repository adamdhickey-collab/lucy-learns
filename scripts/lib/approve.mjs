// `pilot.mjs approve <scene> --yes` — the human decision, once it is made.
//
// generate produces drafts and stops, because approving art is a judgement and
// a script has no business making it. What a script is good at is everything
// that follows the judgement, which is where this set has actually lost time:
// installing a picture is one copy, but the steps around it are a JPEG recipe
// with two exact sizes, a thumbnail whose name is load-bearing, a master filed
// under the shipped key, and a checkbox on the list the whole effort is measured
// against. Miss the checkbox and the list quietly lies about what is left.
//
// There used to be a fifth step: seven lines of CSS in two blocks, so the flat
// art skipped the warm-art grade that cooled the tan-era pictures. That grade
// and its ledger were deleted at the finish line, when the last picture was
// redrawn and there was no warm art left to cool, so `approve` no longer touches
// the stylesheet at all.
//
// So: the judgement is yours, the bookkeeping is this.
//
// It does not commit, and it does not bump the version. Both are release
// decisions.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { loadScene } from './scene.mjs';
import { MASTER, RESTYLE_DIR, outputPaths } from './request.mjs';
import { imageSize } from './imagesize.mjs';
import { tickWorklist, worklistTotal, worklistRemaining } from './worklist.mjs';
import { profileFor } from './profiles.mjs';
import { decodePng, measureField, toHex, setCssField, setManifestBackground } from './splashfield.mjs';

/**
 * Where an approved icon lands, and what turns it into the shipped files.
 *
 * The install is deliberately not a copy into icons/: make-icons.mjs already
 * owns the sizes, the maskable safe zone and the PNG writer, and a second place
 * that knows an icon is 192px is a second place to get it wrong. So approve
 * writes exactly one file — the source the generator already reads — and then
 * runs the generator.
 */
export const ICON_SOURCE = 'icons/source.png';
export const ICON_BUILD = ['node', 'scripts/make-icons.mjs'];
export const ICON_OUTPUTS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-180.png',
  'icons/icon-maskable-512.png',
];

/**
 * Where an approved splash lands, and the three files that must agree about the
 * colour behind it.
 *
 * make-splash.mjs measures the field off the source art itself, so it needs no
 * write. The other two hold a literal that the running app paints, and they are
 * what this writes — from the same measurement, in the same step, so they cannot
 * drift. Getting this wrong is not subtle: the launch flashes a rectangle of the
 * wrong lavender on every cold start.
 */
export const SPLASH_SOURCE = 'art/source/splash-source.png';
export const SPLASH_MARK = 'img/splash-mark.jpg';
export const SPLASH_BUILD = ['node', 'scripts/make-splash.mjs'];
export const MANIFEST = 'manifest.webmanifest';
/**
 * The in-app splash mark, measured off the file that ships today: 600×900.
 *
 * Not 1100 like the scene renders, and not made with `-Z` like them either.
 * `-Z` fits the LONGEST edge, which on a landscape scene is the width but on
 * this portrait master is the height — asking for 1100 that way would quietly
 * produce a 733×1100 file. The master is exactly 2:3 and so is 600×900, so the
 * width is set directly and the height follows with nothing to round.
 */
export const SPLASH_MARK_WIDTH = 600;

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

/**
 * `sips` argv to render a JPEG at an exact WIDTH, letting the height follow.
 *
 * The portrait masters need this instead of sipsShip's `-Z`: see
 * SPLASH_MARK_WIDTH for the 733×1100 that would otherwise come out.
 */
export function sipsShipWidth(master, out, width, quality) {
  return [
    'sips',
    '--resampleWidth', String(width),
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

/**
 * Run an external command. Named for sips because that is all it ran until the
 * icon profile needed `node scripts/make-icons.mjs`, and it is still the seam
 * the tests inject to drive approve without macOS.
 */
function runSips(argv, what, cwd) {
  try {
    execFileSync(argv[0], argv.slice(1), { stdio: 'ignore', cwd });
  } catch (e) {
    throw new Error(
      `${what} failed.\n  ${argv.join(' ')}\n  ` +
        (e.code === 'ENOENT'
          ? `${argv[0]} was not found${argv[0] === 'sips' ? ' — this needs macOS.' : '.'}`
          : `${argv[0]} exited ${e.status ?? '?'}`)
    );
  }
}

/**
 * Installing the icon: one file written, one generator run, nothing else.
 *
 * No img/, no thumbnail, no ledger row and no worklist tick — and each of those
 * absences is deliberate rather than unfinished. An icon is not in an art
 * container, so the warm-art grade never touches it and a ledger opt-out would
 * be a line that opts out of nothing. It is not one of the thirty-seven, so a
 * worklist tick would move the finish line, which is defined as the last row
 * going green. The manifest still gets stamped, because provenance is the whole
 * reason the brand marks were brought in here.
 */
async function approveIcon({ sceneId, round, out, manifest, yes, run, base, abs, say }) {
  if (!yes) {
    say(`\n  approve ${sceneId} from round ${round}\n`);
    say(`    ${ICON_SOURCE}   ← the master, as the icon source`);
    say(`    ${ICON_BUILD.join(' ')}   ← rebuilds ${ICON_OUTPUTS.length} icons`);
    for (const f of ICON_OUTPUTS) say(`      ${f}`);
    say('\n    no img/, no thumb, no ledger row, no worklist tick — an icon is none');
    say('    of those things. See profiles.mjs.');
    say(`\n  This replaces the app's icon. Re-run with --yes.\n`);
    return { approved: false };
  }

  fs.mkdirSync(abs(path.dirname(ICON_SOURCE)), { recursive: true });
  fs.copyFileSync(abs(out.master), abs(ICON_SOURCE));
  run(ICON_BUILD, 'the icon build', base);

  // Read back rather than trusted: make-icons.mjs is a separate process, and a
  // manifest pointing at an icon that failed to write is a broken install that
  // only shows up on someone's home screen.
  const written = [];
  for (const f of ICON_OUTPUTS) {
    if (!fs.existsSync(abs(f))) throw new Error(`${ICON_BUILD.join(' ')} did not write ${f}`);
    written.push([f, imageSize(fs.readFileSync(abs(f)))]);
  }

  if (manifest) {
    fs.writeFileSync(
      abs(out.manifest),
      JSON.stringify({ ...manifest, approved: true, approvedAt: new Date().toISOString() }, null, 2) + '\n'
    );
  }

  say(`\n  ${sceneId} approved from round ${round}\n`);
  say(`    ${ICON_SOURCE}`);
  for (const [f, s] of written) say(`    ${f}   ${s.width}×${s.height}`);
  say('\n  Not ledgered and not ticked: an icon is not one of the thirty-seven and');
  say('  takes no art grade. The worklist total and the finish line are unchanged.');
  say('\n  Nothing committed. Review the diff, then commit it yourself.\n');

  return { approved: true, round, source: ICON_SOURCE, icons: written.map(([f]) => f) };
}

/**
 * Installing the splash: the source, the measured field written to two files,
 * the in-app mark, and the generator run.
 *
 * The field is measured here rather than asked for. Every redraw shifts the
 * artwork's edge colour slightly, and the previous arrangement was three
 * constants in three files each with a comment asking the next person to keep
 * the other two in step — which is the comment you write when the code cannot do
 * it for you.
 */
async function approveSplash({ sceneId, round, out, manifest, yes, run, base, abs, say }) {
  const master = abs(out.master);
  const field = toHex(measureField(decodePng(fs.readFileSync(master))));

  const css = fs.readFileSync(abs(CSS), 'utf8');
  const manifestJson = fs.readFileSync(abs(MANIFEST), 'utf8');
  // Both transforms run before anything is written, so a stylesheet that has
  // lost its token fails here rather than half way through the install.
  const nextCss = setCssField(css, field);
  const nextManifest = setManifestBackground(manifestJson, field);

  if (!yes) {
    say(`\n  approve ${sceneId} from round ${round}\n`);
    say(`    measured field  ${field}  (mean of the art's own edge ring)`);
    say(`    ${SPLASH_SOURCE}   ← the master, as the splash source`);
    say(`    ${SPLASH_MARK}   ← ${SPLASH_MARK_WIDTH}px wide, JPEG q${SHIPPED.quality}`);
    say(`    ${CSS}   ← --splash-field: ${field}`);
    say(`    ${MANIFEST}   ← background_color: ${field}`);
    say(`    ${SPLASH_BUILD.join(' ')}   ← rebuilds the 11 iOS launch images`);
    say('\n    no ledger row, no worklist tick — the splash is not one of the thirty-seven.');
    say(`\n  This replaces what the app shows on launch. Re-run with --yes.\n`);
    return { approved: false };
  }

  fs.mkdirSync(abs(path.dirname(SPLASH_SOURCE)), { recursive: true });
  fs.copyFileSync(master, abs(SPLASH_SOURCE));
  run(sipsShipWidth(out.master, SPLASH_MARK, SPLASH_MARK_WIDTH, SHIPPED.quality), 'the splash mark', base);
  fs.writeFileSync(abs(CSS), nextCss);
  fs.writeFileSync(abs(MANIFEST), nextManifest);
  run(SPLASH_BUILD, 'the splash build', base);

  if (!fs.existsSync(abs(SPLASH_MARK))) throw new Error(`the splash mark was not written to ${SPLASH_MARK}`);

  if (manifest) {
    fs.writeFileSync(
      abs(out.manifest),
      JSON.stringify({ ...manifest, approved: true, approvedAt: new Date().toISOString(), field }, null, 2) + '\n'
    );
  }

  say(`\n  ${sceneId} approved from round ${round}\n`);
  say(`    field measured  ${field}`);
  say(`    ${SPLASH_SOURCE}`);
  say(`    ${SPLASH_MARK}`);
  say(`    ${CSS}   --splash-field: ${field}`);
  say(`    ${MANIFEST}   background_color: ${field}`);
  say(`    ${SPLASH_BUILD.join(' ')}   the launch images rebuilt`);
  say('\n  All three places that record the field colour were written from one');
  say('  measurement, so the OS image and the app\'s first frame cannot disagree.');
  say('\n  Nothing committed. Review the diff, then commit it yourself.\n');

  return { approved: true, round, field, source: SPLASH_SOURCE };
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
  const profile = profileFor(scene);
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
  if (size.width !== profile.master.width || size.height !== profile.master.height) {
    throw new Error(
      `${out.master} is ${size.width}×${size.height}, ` +
        `not ${profile.master.width}×${profile.master.height}`
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

  if (profile.install === 'icon') {
    return approveIcon({ sceneId, round, out, manifest, yes, run: sips, base, abs, say });
  }
  if (profile.install === 'splash') {
    return approveSplash({ sceneId, round, out, manifest, yes, run: sips, base, abs, say });
  }

  const shipped = `img/${sceneId}.jpg`;
  const thumb = `img/thumb-${sceneId}.jpg`;
  const master = `${APPROVED_DIR}/${sceneId}.png`;
  const worklist = fs.readFileSync(abs(WORKLIST), 'utf8');

  if (!yes) {
    say(`\n  approve ${sceneId} from round ${round}\n`);
    say(`    ${shipped}   ← ${SHIPPED.width}px wide, JPEG q${SHIPPED.quality}`);
    say(`    ${thumb}   ← ${THUMB.width}px wide, JPEG q${THUMB.quality}`);
    say(`    ${master}   ← the master, replacing the one shipping today`);
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
  say(`    ${WORKLIST}   ticked`);
  say(`\n  ${total - left.length} of ${total} redrawn · ${left.length} still warm`);
  if (left.length) {
    say(`  next: ${left.slice(0, 3).join(', ')}${left.length > 3 ? ', …' : ''}`);
  } else {
    say('\n  THE LIST IS CLEAR. The finish line is already behind you: the art grade');
    say('  and its ledger came out of css/app.css when the last picture landed.');
  }
  say('\n  Nothing committed. Review the diff, then commit it yourself.\n');

  return { approved: true, round, shipped, thumb, master, remaining: left.length, total };
}
