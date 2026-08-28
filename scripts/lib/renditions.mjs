// The review renditions: the shapes and sizes the app actually shows art in.
//
// A 1448×1086 master looks fine at 1448×1086. What it has to survive is being
// cropped to a 21:9 program hero, and being shrunk to the 84px library card and
// the 56px map rail, where a scene with its action out at the edges turns into
// a picture of a wall. Generating these on every round is what makes that
// visible before an image is approved rather than after it ships.
//
// CROPS and cropBox came out of pilot.mjs so `check` and the generate path
// crop identically; there is no second copy. `dims` did not come with them:
// it shells out to sips, and the generate path reads sizes from the PNG header
// instead, which works before a file is written and works on Linux.

/**
 * Straight out of §2 of the audit, written the way the app writes them.
 *
 * Ratios and a focal fraction, not pixels. They used to be pixel dimensions
 * measured off a 1448x1086 master, which quietly made 1448x1086 a requirement:
 * `sips` does not refuse a crop bigger than its source, it **pads** it. Hand it
 * an 1100px image and you get a 1448px file with a black bar down one side and
 * a band covering 77% of the height instead of 58% — a confident-looking wrong
 * answer, which is the worst kind for a check to produce. Ratios work at any
 * size, which matters now that the best copy of some art is 1100px wide.
 *
 * `focusY` is `object-position` semantics — the fraction of the *leftover*
 * height above the crop, exactly as CSS resolves it — so it can be read off
 * app.css rather than converted. Today's hero is `center 42%`, and 0.42 of the
 * 452px left over on a 1086px master is the y-offset of 190 that
 * pilot-prompts.md quotes. Anything without a `focusY` is centred, which is
 * what the app does with it.
 */
export const CROPS = [
  { name: 'today-16x7', aspect: 16 / 7, focusY: 0.42, note: 'Today hero' },
  { name: 'program-21x9', aspect: 21 / 9, note: 'program hero' },
  { name: 'welcome-5x4', aspect: 5 / 4, note: 'welcome panel' },
  { name: 'square', aspect: 1, note: 'library card / map rail' },
];

/** The largest rect of `aspect` that fits in w×h, placed the way the app places it. */
export function cropBox({ aspect, focusY = 0.5 }, w, h) {
  let cw = w;
  let ch = Math.round(w / aspect);
  if (ch > h) {
    ch = h;
    cw = Math.round(h * aspect);
  }
  return { w: cw, h: ch, top: Math.round(focusY * (h - ch)), left: Math.round((w - cw) / 2) };
}

/**
 * The two sizes the square is actually rendered at, in CSS pixels.
 *
 * Not crops — downscales of the square crop, which is the point. A composition
 * reads or does not read at 56px, and the only way to know is to look at 56px.
 * app.css: 84px is the library card and the level-map placeholder, 56px is the
 * map rail, the list rows and the activity portrait.
 */
export const THUMBS = [84, 56];

/** `sips` argv to cut one crop out of `src`. Height before width, as sips wants. */
export function sipsCrop(src, out, box) {
  return [
    'sips',
    src,
    '--cropToHeightWidth',
    String(box.h),
    String(box.w),
    '--cropOffset',
    String(box.top),
    String(box.left),
    '--out',
    out,
  ];
}

/** `sips` argv to shrink an already-square crop to `size`. */
export function sipsThumb(src, out, size) {
  return ['sips', '--resampleHeightWidth', String(size), String(size), src, '--out', out];
}

/** Every rendition a round produces for one image, as { name, kind, argv }. */
export function renditionPlan(masterPath, cropsDir, sceneId, width, height) {
  const join = (name) => `${cropsDir}/${sceneId}-${name}.png`;
  const out = CROPS.map((c) => ({
    name: c.name,
    kind: 'crop',
    note: c.note,
    box: cropBox(c, width, height),
    path: join(c.name),
  })).map((r) => ({ ...r, argv: sipsCrop(masterPath, r.path, r.box) }));

  const square = out.find((r) => r.name === 'square');
  for (const size of THUMBS) {
    const p = join(`square-${size}`);
    out.push({
      name: `square-${size}`,
      kind: 'thumb',
      note: `${size}px, as the app renders it`,
      path: p,
      // Cut from the square crop, not the master: the app shows the square and
      // then shrinks it, so shrinking anything else would answer a different
      // question than the one being asked.
      argv: sipsThumb(square.path, p, size),
    });
  }
  return out;
}
