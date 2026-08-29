# img/ — what the app serves

Everything here is shipped: referenced by `js/content.js`, `js/config.js`,
`index.html`, `manifest.webmanifest`, or precached by `sw.js`. Nothing here is
a working file, and nothing here is safe to delete without removing its
reference first.

The working art — every generation, every rejected round, the original painted
illustrations — lives in [`../art/`](../art/). That split is the whole
organizing idea: **`img/` is 6 MB of output, `art/` is 400 MB of process.**
They used to be the same folder, which made a directory listing useless.

## Naming

    <key>.jpg           the full image, ~1100px wide
    thumb-<key>.jpg     the 240px thumb, for 84px and 56px card squares

`js/content.js` derives the thumb path from the full one
(`asset.src.replace('img/', 'img/thumb-')`), so the pair must always exist and
must always be named this way. There is no manifest of thumbs to keep in step —
the convention *is* the manifest.

Keys are prefixed by the activity they belong to, so a listing groups itself:

| Prefix | Activity |
| --- | --- |
| `door-sound-*` | dg-1 Doorbell Predicts Rewards |
| `door-stay-*` | dg-2 Stay While the Door Opens |
| `door-place-*` | dg-3 Doorbell Means Place |
| `door-greet-*` | dg-4 Controlled Real Greeting |
| `plan-*` | the four planned programs, shown grayed on cards |

Within an activity the number is its step in the ladder, so `door-stay-03-*`
are all level-3 images and sort together.

The avatars under `avatars/` break both halves of that convention, and are the
only things here that do: they are PNG, and they have no thumb. PNG because
they are flat art with crisp edges on flat fields, which is the one case JPEG
rings around — the full argument, and what the format costs, is in
`js/content.js`. No thumb because nothing draws them from a card square; the
picker and the profile both scale the one file, at 83px and 76px.

## The rest

| File | What it is |
| --- | --- |
| `door-cover.jpg` | the program cover, used by the welcome panel |
| `avatars/dog-NN.png` | the ten pickable dog portraits, 400², flat and cool |
| `avatars/people/person-NN.png` | the fourteen handler portraits, 300² |
| `splash-mark.jpg` | the splash artwork; iOS launch images are baked from it |
| `icon-*.png`, `apple-*.png` | generated — see `scripts/make-icons.mjs` |

## Generated files

The icons and the iOS launch images are **build outputs, not originals**.
Editing them by hand works until someone re-runs the generator. Change the
source in `art/` and re-run:

    node scripts/make-icons.mjs      the icon set
    node scripts/make-splash.mjs     the iOS launch images, from art/source/splash-source.png

(`scripts/make-runner.mjs` built `lucy-run.png`, the sprite that used to run
the splash out. The splash reports with a plain bar now; the script and its
sheet stay in `art/` and `scripts/` as process, but nothing ships from them.)

(`lucy-portrait.jpg` was also derived by hand — a head crop of the app icon,
re-cut twice, with the offsets measured off her ears rather than guessed. It no
longer ships: the redrawn `dog-01` is the same dog in the palette the rest of
the app uses, so a second Labrador earned nothing. The recipe and the
measurements are in the history if the crop is ever wanted again.)

## Adding an image

Don't copy files here by hand — the two sizes, the quality and the thumb's name
all have to be right, and nothing checks them afterwards.

**Redrawing an existing key** (the restyle) goes through the pipeline, which
generates, renders both files, files the master and ticks the worklist. It no
longer touches `css/app.css`: every picture is drawn in the palette now, so
there is no grade left to opt out of.

    node scripts/pilot.mjs approve <key> --yes

See [`../docs/illustration-pipeline.md`](../docs/illustration-pipeline.md).

**A picture that arrived some other way** goes through the older command:
`node scripts/pilot.mjs add <key>` takes the newest download from the Desktop,
checks its aspect ratio, refuses a duplicate it has already seen, writes both
the full and the thumb, and files the master in `art/pilot/`.

Either way, a **new** key also needs adding to `js/content.js` and to the
precache list in `sw.js` — an image absent from that list is the one that fails
offline.
