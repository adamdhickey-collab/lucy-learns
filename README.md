# Lucy Learns

A private, mobile-first training companion for Lucy. It turns The Canine Coach's
handouts into guided sessions you can run with a leash in one hand, logs the
result in a few taps, and shows whether jumping, nipping, barking, and recovery
are actually improving.

It supports professional training. It does not diagnose behavior and it does not
replace a trainer.

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

On a fresh install the app opens on a four-panel welcome that explains what it
is, how a session runs, how logging works, and how the two of you share it.
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

**Lucy → Settings → How this works** replays the four intro panels any time.

## Where the data lives

Everything is in `localStorage` under `lucy-learns/v1` on that one device.
Nothing leaves the phone. There is no account and no sync — Adam and Fabiola
each have their own copy, and the person switcher on Today records who ran a
session.

`Lucy → Export progress` writes a CSV of every session and moment, which is the
thing to send The Canine Coach.

Example data is opt-in, chosen at the end of the welcome and toggleable later
from `Lucy → Starting over`.

## What is in here

```
index.html               app shell
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
img/                     web-sized illustrations
images/                  original full-resolution artwork
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

### Illustrations

`images/Calm Door Greetings/01.png` … `12.png` are the originals (~2.2 MB each).
`img/dg-01.jpg` … `dg-12.jpg` are the web versions the app loads, at 1100 px
wide and about 200 KB each. To regenerate them after adding or replacing art:

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && for f in images/*/*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "img/dg-$(basename "$f" .png).jpg"; done
```

Every image key in `js/content.js` carries alt text. Keep writing it — the whole
app is instructional images, and they need to work read aloud.

## Adding the next handout

All content is data. Nothing about a new activity requires touching a screen.

1. **Add the images.** Drop the artwork in `images/<Program Name>/`, resize into
   `img/`, and register each one in the `IMAGES` map in `js/content.js` with a
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
| Reliable     | 90%+ across three sessions, on two or more days, with two different people, minimal assistance, no jumping or nipping |

Advancing a level is recommended when the last two sessions each hit 80%+, with
no nipping and arousal of 3 or lower. The recommendation screen always offers
"Stay at level N" — the suggestion never moves anyone on its own.

## Accessibility notes

- Every tap target is at least 48 px.
- State is never carried by color alone: chips get a check mark, mastery badges
  get a distinct shape.
- The screen stays awake during a session via the Wake Lock API where supported.
- `prefers-reduced-motion` disables the sheet animation and all transitions.
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
