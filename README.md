# Lucy Learns

A private, mobile-first training companion for Lucy. It turns The Canine Coach's
handouts into guided sessions you can run with a leash in one hand, logs the
result in a few taps, and shows whether jumping, nipping, barking, and recovery
are actually improving.

It supports professional training. It does not diagnose behavior and it does not
replace a trainer.

A session runs as: guided steps (one instruction per screen) → a live rep
tally (tap "That went well" or "Not that one" after each repetition, so the
numbers are observations rather than reconstructions) → one arousal tap that
saves everything. Screens connect with view transitions where the browser
supports them — an activity card's illustration morphs into its detail hero,
steps slide with the direction of travel — and all motion is disabled under
prefers-reduced-motion.

## Running it

No build step, no dependencies. Any static server works:

```bash
python3 -m http.server 3478 --directory "/Users/ahickey/dev/claude-local/Lucy Learns"
```

Then open `http://localhost:3478`. A `lucy-learns` entry is already in
`.claude/launch.json`, so the preview tooling can start it directly.

Service workers and `localStorage` both need a real origin, so open it over
`http://localhost` rather than `file://`.

One dev-server gotcha: `python3 -m http.server` sends no `Cache-Control`, so
the browser applies heuristic caching to JS modules and a plain reload can
keep executing a stale file even though the server has your edit. Hard-reload
(hold the reload button → Empty Cache and Hard Reload) when an edit seems to
not take. Production is unaffected: GitHub Pages sends real cache headers and
the service worker revalidates with `cache: 'no-cache'`.

## Installing it on a phone

1. Serve the folder somewhere the phone can reach (same Wi-Fi via your Mac's LAN
   address, or any static host).
2. Open it in Safari on iOS.
3. Share → Add to Home Screen.

It then runs full screen, works offline, and keeps its own data.

## First run, and demoing it to someone

On a fresh install the app opens on a three-panel welcome that explains what it
is, how a session runs, and how logging works.
Nothing is seeded until you answer the last question:

- **Start empty** — no history at all. Your first session is genuinely the
  first one.
- **Fill in example data first** — twelve days of made-up practice so Progress
  has something to show. Removable in one tap.

To hand the app to someone else and have them see it exactly as a new user
would: **Lucy → Starting over → Reset to a brand new app**. That wipes
sessions, moments, cue wording, and the weekly goal, then drops you back on the
welcome screen. It offers to export a copy first.

The same section has two narrower options:

- **Load / Remove example data** — toggle the seeded sessions without touching
  your real ones.
- **Delete all logs** — clears sessions and moments but keeps your cue wording.

**Lucy → Settings → How this works** replays the three intro panels any time.

## Where the data lives

Everything is in `localStorage` under `lucy-learns/v1` on that one device.
Nothing leaves the phone. There is no account and no sync, so this device holds
the only copy. The MVP is built for a single handler; sessions still carry a
`completedByUserId` so a second person can be added later without a migration.

`Lucy → Export progress` writes a CSV of every session and moment, which is the
thing to send The Canine Coach.

Example data is opt-in, chosen at the end of the welcome and toggleable later
from `Lucy → Starting over`.

## What is in here

```
index.html               app shell
js/config.js             the household: dog, handler, trainer — one file per client
manifest.webmanifest     PWA manifest
sw.js                    offline cache
css/app.css              design tokens, then primitives, then screens
js/content.js            all training content as data
js/store.js              localStorage persistence
js/metrics.js            mastery, progression, weekly summary
js/ui.js                 escaping, templating, icons
js/app.js                hash router
js/views/                one file per screen
fonts/                   Fraunces + Karla, variable, SIL OFL
img/                     what the app loads: 1100px JPEGs and 240px thumbs
art/source/              the full-resolution originals they are made from
icons/                   PWA icons
scripts/make-icons.mjs   rebuilds the icon set
```

### App icon

Built from `icons/source.png`. To replace the artwork, save a new square PNG
there and run:

```bash
node "/Users/ahickey/dev/claude-local/Lucy Learns/scripts/make-icons.mjs"
```

Or point it at the file wherever it already lives:

```bash
node "/Users/ahickey/dev/claude-local/Lucy Learns/scripts/make-icons.mjs" ~/Downloads/lucy-icon.png
```

That regenerates all four sizes. The three normal icons are straight resizes.
The maskable one is shrunk to 80% and padded back out with the artwork's own
corner color, sampled from the file, so an Android launcher cropping it to a
circle never clips the subject.

Bump `CACHE` in `sw.js` so installed copies pick up the change.

### Splash screen

Two halves that have to agree. `index.html` carries a `#splash` div that the
browser paints before `js/app.js` parses, so the first frame is the mark rather
than an empty page; `app.js` fades it out and removes it. `splash/` holds the
iOS `apple-touch-startup-image` files, which the OS shows while a Home Screen
launch boots.

Both put the mark at 60% of viewport width, centred at 45% of height, on
`--background`. The geometry lives in `css/app.css` and in
`scripts/make-splash.mjs` and has to be changed in both.

To rebuild after replacing `img/splash-source.png`:

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && node scripts/make-splash.mjs && cd splash && for f in *.png; do sips -s format jpeg -s formatOptions 85 "$f" --out "${f%.png}.jpg"; done && rm *.png
```

The script also writes `splash/links.html`, the matching `<link>` tags. Paste
them into `index.html` and delete the file. Do not hand-edit those tags: iOS
matches on CSS points and pixel ratio, which cannot be derived from the pixel
size — the 8 Plus is 1242×2208 at 414×736@3x, and guessing by divisibility
calls it 621×1104@2x, which matches no phone and launches to a blank screen.

The in-app splash holds for a guaranteed minimum, measured from navigation
start so a slow boot spends its time booting rather than adding the hold on
top. Tune `SPLASH_HOLD_MS` in `js/app.js`. It dismisses on a timer, never on
an animation frame: frames do not run while a document is hidden, and a
backgrounded launch would come back to a splash that never left.

Bump `APP_UPDATED` in `js/version.js` alongside `APP_VERSION`. It is stored as
`{ year, month, day }` rather than an ISO string because `new Date('2026-08-08')`
parses as UTC midnight, which renders a day early anywhere west of Greenwich.

`?splash-hold` on any URL keeps the in-app splash up for design review.

### Illustrations

`art/source/Calm Door Greetings/01.png` … `26.png` are the originals (~2.2 MB each).
`img/dg-01.jpg` … `dg-12.jpg` are the web versions the app loads, at 1100 px
wide and about 200 KB each. To regenerate them after adding or replacing art:

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && for f in art/source/*/*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "img/dg-$(basename "$f" .png).jpg"; done
```

Every image key in `js/content.js` carries alt text. Keep writing it — the whole
app is instructional images, and they need to work read aloud.

`docs/image-prompts.md` holds the house style, the character sheets, and a
ready-to-paste prompt plus target filename for every image the app still wants.
Twelve illustrations currently cover fifty-odd distinct moments, so several are
reused heavily: `dg-07` alone stands in for twelve.

### Icons

Every mark in `ICONS` in `js/ui.js` comes from [Lucide](https://lucide.dev),
copyright the Lucide contributors, used under the ISC licence. Each entry names
the Lucide icon it is drawn from in a comment above it, so a mark can be
re-fetched or swapped without guessing.

They are copied in rather than installed. There is no build step here and the
service worker precaches the app for offline use, so a package or a CDN link
would break both. Only the geometry is copied — the `<svg>` wrapper is ours,
because the stroke, cap and join come from CSS at each place a mark is used. To
add one:

    curl -s https://unpkg.com/lucide-static@1.31.0/icons/<name>.svg

and paste the child elements into a `<svg viewBox="0 0 24 24">` wrapper. Pin the
version in the URL so a later Lucide redraw does not silently change a mark you
have already checked at 17 px.

A handful of marks live in `css/app.css` as data-URI backgrounds instead — the
check on a completed chip, the chevrons on a details row, the caution triangle —
because a pseudo-element draws them rather than a view placing them. Those are
Lucide's geometry too.

The marks were hand-drawn until 1.99.2. They were drawn to Feather's
construction, which is what Lucide inherited, so the switch was a change of hand
rather than of house style. What forced it: the profile tab wanted a dog, four
hand-drawn attempts all read as crude at 24 px, and once one mark came from a
set that draws them properly the rest had to follow or it would have read as one
good icon among fifteen homemade ones.

## Setting up a new client

The install is two things: `js/config.js` (the dog, the handler, and
the trainer's contact) and the program content in `js/content.js`. Nothing
about a new client touches a screen. The trainer's name and phone flow into
the welcome, the Lucy tab, the "too excited" escalation, and the lesson
report automatically.

## The lesson report

`#/report` (linked from Progress as "Prepare for your next lesson") is the
follow-up-appointment artifact: sessions and success over a chosen window,
per-skill standing, watch behaviours worth discussing, and every note the
household kept — addressed to the trainer by name. It shares as plain text
via the native share sheet (clipboard fallback), downloads as CSV, and prints
cleanly (chrome and controls are stripped in print styles).

## Adding the next handout

All content is data. Nothing about a new activity requires touching a screen.

1. **Add the images.** Drop the artwork in `art/source/<Program Name>/`, resize
   into `img/`, and register each one in the `IMAGES` map in `js/content.js` with a
   real alt description.

2. **Add the program** to `PROGRAMS`, pointing at a `goalId` from `GOALS`. The
   `source` field is what shows under "Trainer material".

3. **Add the activity** to `ACTIVITIES`:

   - `steps` is the core loop that repeats at every level. Keep each
     `instruction` under about twelve words. Put the reasoning in `helper`,
     which sits behind a "Why this matters" disclosure.
   - `cue` should use the household wording from `DEFAULT_COMMANDS`. It is
     resolved through `resolveCue()` at render time, so if you rename a cue on
     the Lucy screen, every activity updates.
   - `levels` is the progression. Each level has a `setup` line, a `reps`
     target, and `successCriteria`. Use `overrides` to swap a single step for
     that level — the key is the zero-based index into `steps`:

     ```js
     overrides: { 1: { instruction: 'Helper rings from outside.', image: 'dg-03' } }
     ```

     Use `endAfterStep` when a level should stop partway through the loop.
   - `fallbackSteps` is what appears behind "Lucy is too excited". Never phrase
     it as failure.

4. **Nothing else.** The player, the library card, mastery, progression, and the
   progress dashboard all read from that object.

Set `available: false` on an activity to park it. It keeps its place in the
program map as a "coming soon" station so the shape of the whole sequence stays
visible, but it cannot be opened, it is left out of the library list and the
Progress rows, and it does not count toward the level totals. Lookups still see
it, so any session already logged against it keeps its title in the log, the
report, and the CSV. Removing the flag is the whole release.

If the new activity belongs to a goal that currently shows a "planned" list,
remove its name from that goal's `planned` array in `GOALS`.

## How progress is calculated

`js/metrics.js` holds all of it.

Mastery, per level:

| Status       | Rule                                                     |
| ------------ | -------------------------------------------------------- |
| Learning     | under 50% of reps successful                             |
| Improving    | 50–74%                                                   |
| Almost there | 75–89%, or 90%+ with any nipping                         |
| Reliable     | 90%+ across three sessions, on three or more days, minimal assistance, no jumping or nipping |

Level totals on the program map count only activities that are available; a
denominator the household cannot move is not progress.

The four rungs are drawn as a ladder on the activity screen and again after any
session that changes which one a level stands on, so there is always a visible
next rung rather than a single badge stating the current one.

Advancing a level is recommended when the last two sessions each hit 80%+, with
no nipping and arousal of 3 or lower. Note this is a different bar from
clearing: a level clears at 75% once, and is recommended for advance at 80%
twice, so a level can be cleared and still worth repeating. The recommendation screen always offers
"Stay at level N" — the suggestion never moves anyone on its own.

## Accessibility notes

- Every tap target is at least 48 px.
- State is never carried by color alone: chips get a check mark, mastery badges
  get a distinct shape.
- The screen stays awake during a session via the Wake Lock API where supported.
- `prefers-reduced-motion` drops every entrance animation, the splash zoom, the
  view transitions, and the progress and tally tweens. What survives is opacity:
  a control that lights up on press still does, because losing that would cost
  feedback rather than motion.
- Focus moves to the screen heading on navigation, so a screen reader is told
  the screen changed. It deliberately does not do this on first paint, where
  the browser already announces the document, and headings never show a focus
  ring since they are not operable. A small live region names the new screen
  rather than putting `aria-live` on the whole app container, which would
  re-read everything on every navigation.
- Light theme only. The illustrations are warm and bright, and the app is used
  in a lit entryway.

## Not built

No accounts, no cloud sync, no photo or video capture on a session, no
notifications. Each of those wants a backend. The data layer in `js/store.js` is
deliberately the only place that touches storage, so swapping in Supabase later
means rewriting one file.
