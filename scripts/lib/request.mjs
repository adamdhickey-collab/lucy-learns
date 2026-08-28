// What the generation request will be, described but not yet sent.
//
// This module deliberately stops short of calling anything. It exists so that
// `pilot.mjs plan` can print the exact operation, model and parameters a run
// would use, and so that the paths a run would write to are decided in one
// place rather than invented at call time.
//
// THE KEY. Generation reads process.env.OPENAI_API_KEY and nothing else. It is
// never taken as an argument, never written into a manifest, never logged, and
// never included in plan output — plan mode does not read the environment at
// all, so there is nothing for it to leak. Locally the key arrives via
//
//     node --env-file=.env.local scripts/pilot.mjs generate <scene>
//
// which keeps it out of shell history and out of the process command line.
//
// CHECKED AGAINST THE OFFICIAL DOCUMENTATION (2026-08-28):
// https://developers.openai.com/api/docs/guides/image-generation
//
// Three things the first draft of this file had wrong, each of which would
// have cost a round:
//
//   size            was 1536x1024, which is 3:2 — so the 4:3 master would have
//                   had to be cropped out of it. gpt-image-2 takes custom
//                   resolutions, so a true 4:3 can be requested directly.
//   input_fidelity  removed. gpt-image-2 processes every input at high
//                   fidelity automatically and does not allow the parameter.
//   images          multipart, one repeated `image[]` field per file, sent in
//                   order. Up to 16 per call.

import path from 'node:path';
import { ROOT } from './brief.mjs';

/**
 * gpt-image-2's documented constraints on `size`, kept beside the value they
 * gate so a future change to SOURCE is checked rather than assumed.
 */
export const SIZE_LIMITS = {
  edgeMultipleOf: 16,
  maxEdge: 3840,
  maxAspect: 3,
  minPixels: 655360,
  maxPixels: 8294400,
  maxImages: 16,
};

/**
 * The canvas asked of the API, and the master everything ships from.
 *
 * 1448×1086 cannot be requested: 1448 is not a multiple of 16. 1472×1104 is,
 * and it is exactly 4:3 — the same ratio as the master — so 1472→1448 and
 * 1104→1086 are one and the same 0.98370 factor. The master is therefore a
 * proportional downscale with **no crop at all**, and no crop box is computed
 * anywhere on this path.
 *
 * That is worth the fuss. The brief's composition rules are written as
 * fractions of the frame — the middle-75% square, the middle-60% band — and a
 * crop to reach the ratio would silently move both. The tan-era set came back
 * 3:2 and had to be cropped, which is the failure those rules were written
 * against; see docs/pilot-prompts.md.
 */
export const SOURCE = { width: 1472, height: 1104 };
export const MASTER = { width: 1448, height: 1086 };

/** How the master is made. Named so the plan and the tests read the same word. */
export const CONVERSION = 'proportional downscale, no crop';

/**
 * The intended request. Values here are printed by plan mode verbatim, so this
 * object is the single description of what a run would do.
 *
 * Note what is absent: `input_fidelity`, which gpt-image-2 rejects, and
 * `output_format`, because PNG is the default and the only encoding the model
 * reliably honours — a webp request comes back as PNG bytes anyway.
 */
export const REQUEST = {
  operation: 'images.edit — references as repeated `image[]` fields, in order',
  endpoint: 'https://api.openai.com/v1/images/edits',
  method: 'POST',
  transport: 'built-in fetch + FormData, multipart/form-data',
  model: 'gpt-image-2',
  parameters: {
    model: 'gpt-image-2',
    size: `${SOURCE.width}x${SOURCE.height}`,
    n: 1,
    // low | medium | high | auto. `high` roughly quadruples the bill over
    // `medium`; it is right for a set that has to hold up beside itself, but a
    // scene being iterated for composition rather than finish is worth
    // re-running at `medium`.
    quality: 'high',
  },
  response: 'JSON; the image arrives base64 in data[0].b64_json, PNG bytes',
  auth: 'Authorization: Bearer $OPENAI_API_KEY (read from the environment at call time)',
  // Billed per token: $8/M in (prompt + reference images), $30/M out (the
  // image). Published per-image figures for `high` vary widely by reseller;
  // treat this as an order of magnitude and check the first invoice.
  pricing: '~$0.20-0.35 per image at quality=high, this size (approximate)',
  verified: true,
  verifiedAgainst: 'https://developers.openai.com/api/docs/guides/image-generation (2026-08-28)',
  // Documentation, not a live call. One thing only a real request can settle:
  // whether the model treats `image[]` order as reference precedence the way
  // the assembled prompt's numbered attachment list assumes it does.
  unverified: 'whether image[] order is honoured as reference precedence',
};

/**
 * Where a run would put things.
 *
 * Under art/pilot/restyle/ rather than art/pilot/round-NN/, because those two
 * numbering lines mean different things. Rounds 1-19 are the tan-era set, cited
 * by number in the post-mortems in docs/pilot-prompts.md; restyle rounds are
 * the cool flat set and start again at 1. Sharing a counter would make every
 * one of those citations ambiguous.
 *
 * Drafts only — never img/, never art/pilot/approved/.
 */
export const RESTYLE_DIR = 'art/pilot/restyle';

export function outputPaths(sceneId, round) {
  const dir = path.join(RESTYLE_DIR, `round-${String(round).padStart(2, '0')}`);
  return {
    round,
    dir,
    raw: path.join(dir, 'raw', `${sceneId}.png`),
    master: path.join(dir, `${sceneId}.png`),
    crops: path.join(dir, 'crops'),
    sheet: path.join(dir, 'sheet.html'),
    manifest: path.join(dir, 'manifest.json'),
  };
}

/** The next unused restyle round. Its own counter, starting at 1. */
export function nextRound(fs, restyleDir = path.join(ROOT, RESTYLE_DIR)) {
  if (!fs.existsSync(restyleDir)) return 1;
  const used = fs
    .readdirSync(restyleDir)
    .map((d) => /^round-(\d+)$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return used.length ? Math.max(...used) + 1 : 1;
}

/**
 * The exact `sips` argv that turns the raw result into the master.
 *
 * `--resampleHeightWidth` takes HEIGHT then WIDTH, in that order, which is the
 * reverse of how every other tool in this repo names a size and has been got
 * wrong before. Both numbers are given explicitly rather than using `-Z`,
 * because -Z fits the longest edge and would leave the short edge to rounding.
 *
 * There is no crop here and no crop box to compute: source and target are the
 * same 4:3, so this is a single proportional resample.
 */
export function sipsDownscale(rawPath, masterPath) {
  return [
    'sips',
    '--resampleHeightWidth',
    String(MASTER.height),
    String(MASTER.width),
    rawPath,
    '--out',
    masterPath,
  ];
}

/**
 * The manifest a run would write beside its outputs.
 *
 * `briefId` is the load-bearing field. Two prompt briefs exist and they produce
 * visibly different art; a draft that does not say which one it came from is
 * unreviewable a month later, and the legacy warm masters in
 * art/pilot/approved/ have no such marker at all.
 *
 * No secret appears here, and none may be added: the key is read from the
 * environment at call time and never travels with the run's own record.
 */
export function manifestSkeleton(scene, out, generatedAt = null) {
  return {
    briefId: scene.briefId,
    scene: scene.id,
    round: out.round,
    generatedAt,
    request: {
      endpoint: REQUEST.endpoint,
      model: REQUEST.parameters.model,
      size: REQUEST.parameters.size,
      quality: REQUEST.parameters.quality,
      n: REQUEST.parameters.n,
    },
    references: scene.references.map((r) => ({ order: r.order, role: r.role, path: r.path })),
    output: {
      raw: out.raw,
      rawSize: `${SOURCE.width}x${SOURCE.height}`,
      master: out.master,
      masterSize: `${MASTER.width}x${MASTER.height}`,
      conversion: CONVERSION,
    },
    approved: false,
  };
}

/** The stub. Generation is not implemented and must not be reached yet. */
export async function generate() {
  throw new Error(
    'generation is not implemented yet.\n' +
      '  The request surface in scripts/lib/request.mjs matches the documentation\n' +
      '  but has never been sent, and no live call has been authorised.\n' +
      '  Use `pilot.mjs plan <scene>` until it is.'
  );
}
