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

/**
 * The icon's equivalent of CROPS and THUMBS.
 *
 * An icon has no 21:9 band to drift out of, so the crop table answers nothing
 * about it. The two questions that do matter are the ones the manifest and the
 * launcher ask: does it still read at 48px in a browser tab, and does it survive
 * an Android launcher cropping it to a circle.
 *
 * 512, 192 and 180 are the files make-icons.mjs actually writes. 48 is not a
 * file — it is the size a favicon is seen at, and a mark that turns to mush
 * there is a mark nobody recognises in a tab strip.
 */
export const ICON_SIZES = [512, 192, 180, 48];

/**
 * The maskable safe zone, matching MASKABLE.safeZone in scripts/make-icons.mjs.
 *
 * Android crops a maskable icon to whatever shape the launcher likes — circle,
 * squircle, teardrop — so the artwork has to survive losing its corners. This
 * previews the worst of it: the inner 80%, which is what every launcher shape
 * is guaranteed to keep. Keep in step with make-icons.mjs.
 */
export const ICON_SAFE_ZONE = 0.8;

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

/**
 * The widths the launch illustration is actually seen at, in CSS pixels.
 *
 * make-splash.mjs draws the art at 88% of the viewport width, and the phones in
 * its SCREENS table run 375pt to 440pt wide — so the art lands between 330 and
 * 387 css px on every device that exists. Those two are the extremes, rendered
 * at true size, because "does this illustration read on a phone" is the only
 * question the splash has and a picture shown large does not answer it.
 * Keep in step with ART_WIDTH_FRACTION and SCREENS in scripts/make-splash.mjs.
 */
export const SPLASH_WIDTHS = [387, 330];

/** `sips` argv to resize by width, keeping the aspect. */
export function sipsFitWidth(src, out, width) {
  return ['sips', '--resampleWidth', String(width), src, '--out', out];
}

/** `sips` argv to shrink an already-square crop to `size`. */
export function sipsThumb(src, out, size) {
  return ['sips', '--resampleHeightWidth', String(size), String(size), src, '--out', out];
}

/**
 * Every rendition a round produces for one image, as { name, kind, argv }.
 *
 * `kind` drives the review sheet: 'crop' cards show the shape, 'thumb' cards
 * render unscaled at their true pixel size. Both profiles emit both kinds, which
 * is why the sheet needed no special case for icons.
 */
export function renditionPlan(masterPath, cropsDir, sceneId, width, height, table = 'scene') {
  if (table === 'icon') return iconPlan(masterPath, cropsDir, sceneId, width, height);
  if (table === 'avatar') return avatarPlan(masterPath, cropsDir, sceneId);
  if (table === 'splash') return splashPlan(masterPath, cropsDir, sceneId, width, height);
  return scenePlan(masterPath, cropsDir, sceneId, width, height);
}

/**
 * An avatar's renditions: only the sizes, because there is nothing to crop.
 *
 * It is square already and is drawn inside a circular mask everywhere it
 * appears, so the shape is never in question — the only thing worth checking is
 * whether it survives being small. 400 is what ships, 84 is the picker tile and
 * the level-map placeholder, 56 is the person row and the profile portrait.
 *
 * Downscales of the master rather than of a crop, for the icon's reason: the
 * whole square is what ships, so the whole square is what has to shrink well.
 */
export const AVATAR_SIZES = [400, 84, 56];

function avatarPlan(masterPath, cropsDir, sceneId) {
  return AVATAR_SIZES.map((size) => {
    const out = `${cropsDir}/${sceneId}-square-${size}.png`;
    return {
      name: `square-${size}`,
      kind: 'thumb',
      note: size === 400 ? `${size}px, the shipped size` : `${size}px, as the app renders it`,
      path: out,
      argv: sipsThumb(masterPath, out, size),
    };
  });
}

/**
 * The icon's renditions: the launcher's worst crop, then the sizes it is seen at.
 *
 * The safe-zone preview is cut from the master and the sizes are downscales of
 * the master rather than of that crop — the opposite of the scene profile, where
 * the thumbnails come off the square crop. The reason is what each one is
 * asking. A scene thumbnail asks "does the square the app shows still read when
 * shrunk", so it has to be shrunk from that square. An icon at 48px is shrunk
 * from the whole icon, because the whole icon is what ships.
 */
function iconPlan(masterPath, cropsDir, sceneId, width, height) {
  const join = (name) => `${cropsDir}/${sceneId}-${name}.png`;
  const inner = Math.round(Math.min(width, height) * ICON_SAFE_ZONE);
  const safePath = join('maskable-safe');
  const out = [
    {
      name: 'maskable-safe',
      kind: 'crop',
      note: `the inner ${Math.round(ICON_SAFE_ZONE * 100)}% every launcher mask keeps`,
      box: { w: inner, h: inner, top: Math.round((height - inner) / 2), left: Math.round((width - inner) / 2) },
      path: safePath,
    },
  ].map((r) => ({ ...r, argv: sipsCrop(masterPath, r.path, r.box) }));

  for (const size of ICON_SIZES) {
    const p = join(`icon-${size}`);
    out.push({
      name: `icon-${size}`,
      kind: 'thumb',
      note: size === 48 ? 'a favicon in a tab strip' : `icon-${size}.png`,
      path: p,
      argv: sipsThumb(masterPath, p, size),
    });
  }
  return out;
}

/**
 * The splash's renditions: the edge the field is measured from, then the art at
 * the two widths a real phone shows it at.
 *
 * The edge strip is the one that catches the failure nobody sees until launch.
 * The field colour behind the art is the mean of a ring around its border, so if
 * that border is not actually a flat field — a gradient, a stray object, a
 * vignette — the mean is a colour that matches nothing and the art sits on the
 * splash as a visible rectangle. Looking at the strip is how you know.
 */
function splashPlan(masterPath, cropsDir, sceneId, width, height) {
  const join = (name) => `${cropsDir}/${sceneId}-${name}.png`;
  const strip = Math.max(1, Math.round(height * 0.06));
  const out = [
    {
      name: 'edge-strip',
      kind: 'crop',
      note: 'the top border the field colour is measured from — it must be flat',
      box: { w: width, h: strip, top: 0, left: 0 },
      path: join('edge-strip'),
    },
  ].map((r) => ({ ...r, argv: sipsCrop(masterPath, r.path, r.box) }));

  for (const w of SPLASH_WIDTHS) {
    const p = join(`phone-${w}`);
    out.push({
      name: `phone-${w}`,
      kind: 'thumb',
      note: w === SPLASH_WIDTHS[0] ? 'widest phone (440pt)' : 'narrowest phone (375pt)',
      path: p,
      size: { w, h: Math.round((w * height) / width) },
      argv: sipsFitWidth(masterPath, p, w),
    });
  }
  return out;
}

function scenePlan(masterPath, cropsDir, sceneId, width, height) {
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
