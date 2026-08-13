# img/ — what the app serves

Everything here is shipped: referenced by `js/content.js`, `js/config.js`,
`index.html`, `manifest.webmanifest`, or precached by `sw.js`. Nothing here is
a working file, and nothing here is safe to delete without removing its
reference first.

The working art — every generation, every rejected round, the original painted
illustrations — lives in [`../art/`](../art/). That split is the whole
organising idea: **`img/` is 6 MB of output, `art/` is 400 MB of process.**
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
| `plan-*` | the four planned programs, shown greyed on cards |

Within an activity the number is its step in the ladder, so `door-stay-03-*`
are all level-3 images and sort together.

## The rest

| File | What it is |
| --- | --- |
| `door-cover.jpg` | the program cover, used by the welcome panel |
| `lucy-portrait.jpg` | Lucy's picture on her own tab (`js/config.js`) — a head crop of the app icon, see below |
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

`lucy-portrait.jpg` is also derived, but by hand rather than by a script — it
is one crop that has been re-cut twice, which is not enough to earn a
generator. It is a head crop of the icon:

    sips icons/source.png --cropToHeightWidth 880 880 --cropOffset 0 198 --out /tmp/lp.png
    sips -Z 400 -s format jpeg -s formatOptions 82 /tmp/lp.png --out img/lucy-portrait.jpg

The numbers are measured, not guessed. In the 1254² icon her head spans
x 228–1048 and y 71–620, with the collar narrowing at y≈610. An 880 square at
x 198 centres her face horizontally and keeps both ear tips; y 0 takes all 71
available pixels of headroom, which is the most there is. Anything tighter
clips an ear — a 740 crop was tried and did. Re-measure if the icon changes.

## Adding an image

Don't copy files here by hand. `node scripts/pilot.mjs add <key>` takes the
newest download from the Desktop, checks its aspect ratio, refuses a duplicate
it has already seen, writes both the full and the thumb, and files the master
in `art/pilot/`. Then add the key to `js/content.js` and to the precache list
in `sw.js` — an image absent from that list is the one that fails offline.
