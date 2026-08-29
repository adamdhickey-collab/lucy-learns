# The illustration pipeline

Three commands take a scene from a JSON file to an installed picture:

    node scripts/pilot.mjs plan <scene>                     read the request
    node --env-file=.env.local scripts/pilot.mjs generate <scene> --yes
    node scripts/pilot.mjs approve <scene> --yes            install the round you kept

`plan` costs nothing and touches nothing. `generate` is the only command that
spends money. `approve` is the only one that changes what the app shows. Nothing
commits. A fourth, `status`, answers "what is left" — see below.

This is for the restyle — thirty-seven illustrations being redrawn flat and cool
against [`art/source/drawing-a-new-scene.md`](../art/source/drawing-a-new-scene.md).
The older hand-driven commands in the same script (`prompt`, `add`, `check`,
`sheet`) drove the tan-era set through a chat window and still work; see
[`pilot-prompts.md`](pilot-prompts.md) for that history.

## Why it exists

The first eight scenes of the restyle were drawn by pasting Block A, Block B and
a scene paragraph into a chat window and picking attachments by eye. That
worked. It also lost the two things that make a failure diagnosable: **which
references were attached, and in what order.** Neither was written down
anywhere, so a scene could not be regenerated identically, and a picture that
came back wrong could not be attributed to the prompt or to the attachments.

Attachment order is not a detail. Rounds 1–19 of the tan-era set found the
attached image to be the single strongest lever on consistency — rounds 4 and 5
of one scene differed only in the human's pose, and the dog came back right both
times off the reference. So the pipeline treats references as ordered data, and
the numbered attachment list inside the prompt is *generated from that array*,
so the text and the send order cannot disagree.

## Knowing where you are

    node scripts/pilot.mjs status [filter]

Thirty-seven pictures drawn over weeks, some of which cannot be started until
others are finished. The state of any one of them lives in four places — the
worklist says whether it is done, `css/app.css` says whether it is opted out of
the art grade, `art/scenes/` says whether it has been written, and
`art/pilot/restyle/` says whether anything has been drawn — and holding that in
your head across a session is how a rung gets skipped.

    ✓ door-sound-02-self           redrawn and shipping  · used ×2
    · door-stay-03-onestep         ready to generate
    ⋯ door-stay-03-halfway         after door-stay-03-onestep
    ~ door-place-cover             round 3 (of 2) — review it
      door-greet-cover             no spec yet  · cover · square-safe

    8 approved · 0 awaiting review · 11 ready · 7 blocked · 11 unspecced   (37 total)

It writes nothing. It used to cross-check two registers — the worklist's ticks
and the pilot ledger's opt-outs — because `approve` wrote both and a
disagreement meant one had stopped halfway. The ledger went at the finish line,
so the worklist is the only register and a tick is simply the truth.

## A scene, as a file

`art/scenes/<id>.json`:

```json
{
  "id": "door-sound-03-name",
  "briefId": "cool-flat-v1",
  "title": "Say her name in a bright, happy voice",
  "activity": "Doorbell Predicts Rewards",
  "step": "Level 1, step 3 of 5",
  "note": "Why this scene is the way it is. Not sent to the model.",
  "blocks": ["style", "cast"],
  "references": [
    { "path": "art/source/trainer-reference.jpg", "role": "likeness:handler" },
    { "path": "art/source/lucy-reference.jpg", "role": "likeness:lucy" },
    { "path": "art/source/Calm Door Greetings/door-sound-02-self.png", "role": "continuity:room" }
  ],
  "scene": "Interior entry hall, beside the closed charcoal front door…",
  "mustBeTrue": "both of the handler's hands are visibly empty and away from the pouch…"
}
```

`blocks` names the reusable prose to prepend, in order: `style` (Block A),
`porch` (the exterior sub-block, for scenes shot from outside the front door),
`cast` (Block B). `references` is an **ordered** array; the roles are a closed
set, because an unknown role is a typo and a typo that produced an unlabelled
attachment is exactly the quiet failure this format exists to prevent:

| role | what the prompt says it is for |
| --- | --- |
| `style:exemplar` | **attachment 1 always.** The style authority — match its rendering, palette and the dog's appearance |
| `likeness:handler` | copy her face, hair and build only |
| `likeness:lucy` | copy her markings, beard, ear and build only |
| `likeness:guest` | copy his face, glasses, black cap and blue hoodie — and, unlike the two sheets, match its rendering too |
| `continuity:room` | the same room in an adjacent moment — match camera, eye level, wall, floor, door, distance |
| `continuity:pair` | the companion picture, shown side by side, so nothing but the action may differ |
| `continuity:ladder` | the previous rung of this ladder — only the one thing this step changes may differ |

`mustBeTrue` is one sentence naming the thing the picture has to get right. It
goes into the prompt *and* onto the review sheet, so a review answers a written
question rather than "does this look nice".

### Attachment 1 is always a flat exemplar

The first live call came back painterly, with Lucy smoothed into a plain
Labrador. The reason was in the request: it shipped **two painterly likeness
sheets and one flat scene labelled `continuity:room`** — "match the camera
angle", saying nothing about how anything is drawn. Two examples of the wrong
style outranked one example of the right style, by position and by instruction.

So every spec now leads with a `style:exemplar`, and the prompt opens with a
sentence naming it before the blocks rather than after them:

> ATTACHMENT 1 IS THE STYLE REFERENCE. Match it exactly for rendering, palette
> and the dog's appearance… Where the description below and that image disagree
> about how something is DRAWN, the image wins. The description governs only
> what is happening.

It leads because `pilot.mjs` already knew why, from the hand-driven era: the
model should know the attachment outranks the description before it reads three
hundred words of description. An exemplar anywhere but first is refused, since
the sentence calls it "attachment 1" by number.

### A ladder rung names a scene, not a file

Some activities are one composition sampled at several points on a single walk.
Stay While the Door Opens is seven rungs of it: what changes between them is the
handler's distance from the door and the state of the door, **and nothing else.**
If the camera moves, or the room shifts, or Lucy is drawn a different size, the
ladder stops reading as progress and starts reading as unrelated pictures.

The tan-era set learned that the hard way, and its instruction was "generate them
in order, each with the previous approved one attached" — which is exactly the
kind of thing nobody remembers three weeks later. So a reference can name a
scene instead of a path:

```json
{ "scene": "door-stay-03-halfway", "role": "continuity:ladder" }
```

which resolves to that scene's approved master. `plan` shows it as `WAITING`
until that scene has been redrawn, and `generate` refuses outright:

```
door-stay-03-crack is waiting on a scene that has not been redrawn yet:
    door-stay-03-handle  (continuity:ladder)
  Generate and approve it first — this rung has to be
  drawn off the last one, or the ladder stops reading as one walk.
```

While the restyle was running, "redrawn" was read off the **pilot ledger in
`css/app.css`** rather than off the filesystem, and that distinction was the
whole point. For nearly every key there was already a file at
`art/pilot/approved/<id>.png` — the legacy warm master — and a rung that
attached it would inherit the style the restyle existed to replace and come back
looking plausible and wrong. So the question was never "is the file there" but
"has this scene been drawn against the current brief", and only the ledger knew.

**That is over.** The ledger was deleted at the finish line and there is no warm
art left, so every approved master is current by definition and nothing is
pending. `pendingReferences` still exists and still returns a list, because the
shape is useful and a future set may need the refusal again — it just always
returns nothing now.

### The likeness warning is not optional

The handler's and Lucy's reference sheets were cropped from the old painterly
set, because that is where the likenesses live. Every request that carries one
therefore ships an example of the rendering the brief is trying to leave behind,
so the assembled prompt adds a paragraph saying they are for likeness only and
must not be copied for style. Removing it brings the old style back.

The warning fires on **those two files specifically**, not on the word
`likeness`. The guest's likeness reference is a redrawn scene — already flat,
already cool — and telling the model to ignore its rendering would throw away
the only example of the target style in the request. When the two sheets are
eventually redrawn, the warning comes out with them.

## The two briefs, and which one is live

There are two prompt briefs in this repo and only one of them is current:

| file | status |
| --- | --- |
| `art/source/drawing-a-new-scene.md` | **live.** Flat, cool, drawn in the app's own tokens. |
| `docs/pilot-prompts.md` | superseded on palette. The tan-era "Warm Instructional Vector", kept for its round-by-round post-mortems. |

Assembling a scene out of the second one produces a warm prompt for a cool set,
and the mistake does not surface until an image comes back. So `brief.mjs` names
the live file explicitly and reads nothing else, every spec carries a `briefId`,
and a spec declaring anything but the current brief is **refused** rather than
generated. Bump `BRIEF_ID` when the brief changes in a way that changes the
pictures.

## The canvas, and why it is 1472×1104

The master is 1448×1086. That size cannot be requested: gpt-image-2 takes custom
resolutions only when both edges are multiples of 16, and 1448 is not.

1472×1104 is the nearest size that is, and it is **exactly 4:3** — the same
ratio as the master. So 1472→1448 and 1104→1086 are one and the same 0.98370
factor, and the master is a proportional downscale with no crop and no crop box
computed anywhere on that path:

    sips --resampleHeightWidth 1086 1448 <raw> --out <master>

`--resampleHeightWidth` takes **height then width**, which is the reverse of how
everything else in this repo names a size.

This matters more than it sounds. The brief's composition rules are written as
fractions of the frame — everything essential inside the middle 75% of the width
on covers, inside the middle 60% of the height on the wide ones — and cropping
to reach the ratio would silently move both. The tan-era set came back 3:2 and
had to be cropped; those rules are what that cost.

What is actually sent, as multipart/form-data to
`POST https://api.openai.com/v1/images/edits`:

    model    gpt-image-2
    size     1472x1104
    n        1
    quality  high
    prompt   the assembled text
    image[]  one repeated field per reference, in declared order

The image arrives back base64 in `data[0].b64_json`, as PNG bytes.

The documented limits, kept in `SIZE_LIMITS` beside the value they gate: edges a
multiple of 16, longest edge ≤ 3840, aspect within 3:1 either way, total pixels
between 655,360 and 8,294,400, at most 16 reference images per call.

`input_fidelity` is **not sent.** gpt-image-2 processes every input at high
fidelity automatically and rejects the parameter. `output_format` is not sent
either: PNG is the default and the only encoding the model reliably honours — a
webp request comes back as PNG bytes anyway.

## Profiles: what shape a scene comes back in

Everything above describes one shape — a 4:3 instructional illustration — and for
the thirty-seven that is the only shape there is. The brand marks are the second.
`docs/illustration-audit.md` left them out of the pilot deliberately, calling them
"a different style problem with a 16-file cascade behind it", and the cascade is
exactly the difficulty: the icon is square, it has no 21:9 crop to fail at, and
installing it is not a copy into `img/` but a source file plus a generator run.

A second set of hardcoded numbers beside the first is how the two drift, so the
shape is data. `scripts/lib/profiles.mjs` answers four questions and nothing else:

| | `scene` | `icon` | `avatar` |
| --- | --- | --- | --- |
| API canvas | 1472×1104 | 1024×1024 | 1024×1024 |
| master | 1448×1086 | 1024×1024 | 1024×1024 |
| conversion | proportional downscale | copied — the canvas is the master | copied |
| renditions | 16:7, 21:9, 5:4, square, 84, 56 | maskable safe zone, 512, 192, 180, 48 | 400, 84, 56 |
| install | `img/` + thumb + worklist tick | `icons/source.png` + `make-icons.mjs` | one PNG into `img/avatars/` |

(`splash` is a fourth, at 1024×1536.)

A spec selects one with a `"profile"` field. **Absent means `scene`**, so all
thirty-seven existing specs keep working untouched — a migration that edits every
file to state what was already true is a migration that introduces typos. An
unknown value is refused rather than defaulted, because silently drawing an icon
on a 4:3 canvas is a paid call whose cause is invisible in the result.

Everything a profile does *not* answer is shared on purpose: the brief, the
reference roles, the attachment-1 rule, the refusals, the round counter, the
review sheet and the manifest. Those are the parts that were worth building, and
none of them care about the aspect ratio.

### The avatar profile

The twenty-four portraits a household picks from — ten dogs, fourteen people.
Square like the icon and copied like it, and different in what it installs: one
400px PNG into `img/avatars/`, people one directory deeper than dogs, and
nothing else. No thumbnail, because `js/content.js` derives `thumb-` paths for
scene assets only and the avatar list is its own. No worklist row, because the
finish line counts those and these are not part of the thirty-seven.

**PNG, reversing a decision the repo records.** The set moved from PNG to JPEG
when the art became painted, because JPEG rings around the hard edges flat work
has and painted work has none. Redrawing them flat puts the edges back. See
[`../art/source/avatar-worklist.md`](../art/source/avatar-worklist.md), which
also says to measure the weight rather than assume it — the 8× penalty that
justified the move was recorded against painted PNGs, not flat ones.

They have **no crops** and their renditions ask only one question. An avatar is
square already and is drawn inside a circular mask everywhere it appears, so the
shape is never in doubt; what is in doubt is whether it survives being small.
And they chain: `dog-01` is the set leader and the only one whose exemplar is a
scene. The other twenty-three take theirs from `dog-01`'s approved master, so
`generate` refuses them until it is approved. Twenty-four portraits seen side by
side in a grid is a far harsher test of shared style than thirty-seven scenes
seen one at a time, so the field colour, the crop and the line weight are
settled once and then copied.

### What the icon profile deliberately does not do

No `img/` file, no thumbnail and **no worklist tick.** Each absence is a
decision:

- An icon is not an illustration in one of the app's art containers, so none of
  the illustration install applies to it. (While the warm-art grade existed it
  also took no ledger row, for the same reason.)
- The worklist is where the count of thirty-seven comes from, and the finish line
  is defined as its last row going green. A row for the icon would move the
  finish line, which is a release decision and not this pipeline's to make.

So the icon is its own small track, which is what the audit called it. `status`
still says 37, and still means 37.

### The splash, and the colour that is written in three places

The splash is the other half of the cascade and is **not yet in the pipeline.**
The obstacle is worth writing down before anyone starts: the field colour is
measured off the artwork's own edge and duplicated in three files —
`FIELD` in `scripts/make-splash.mjs`, `--splash-field` in `css/app.css`, and
`background_color` in `manifest.webmanifest`. Both source files carry comments
saying keep them in step. Redraw the splash without updating all three and every
cold start flashes a lavender rectangle before the app paints.

That is precisely the "anything that exists twice drifts" case this pipeline
exists for, so when the splash profile is added, `approve` should measure the
edge pixel and write all three in one step, which is what it does.


## The key

`generate` reads `process.env.OPENAI_API_KEY` and nothing else, at the moment of
the call, and uses it in one header. It is never an argument, never in the form
body, never in a manifest, never in the sheet, and never in an error — a failure
prints the API's own message and nothing of the request.

Supply it with `--env-file` rather than the shell, which keeps it out of shell
history and off the process command line:

    node --env-file=.env.local scripts/pilot.mjs generate <scene> --yes

`.env*` is gitignored with an exception for `.env.example`. Two tests hold the
rest of the line, scanning source with comments stripped so a mention cannot
pass for an access:

- only `request.mjs` may reach `process.env` at all;
- the only variable it reads is `OPENAI_API_KEY`.

`plan` reads no environment variables whatsoever, which is a stronger guarantee
than "it does not print the key": there is nothing there for it to print.

## What it refuses, and why

The refusals are the design. Most of them run before anything is spent or
written.

| refused | because |
| --- | --- |
| a spec with a stale or missing `briefId` | warm prompt, cool set — invisible until the image arrives |
| a reference that is not on disk | a silently dropped attachment is a style drift you cannot attribute |
| a duplicate reference, an unknown role, an unknown block | typos that would otherwise produce a plausible wrong prompt |
| a ladder rung whose previous rung is not redrawn | out of order the sequence stops reading as one walk, and the attachment would be the legacy warm master |
| more than 16 references | the API's limit, caught before the upload |
| `generate` without `--yes` | a paid non-deterministic call behind a bare verb is one you make by pressing up-arrow |
| a round directory that already exists | a re-run is a new round, so the one you are comparing against survives |
| a returned canvas that is not 1472×1104 | reaching 4:3 from another ratio needs a crop; that should be your decision |
| a 4xx, retried | it would just be charged twice. Only 429 and 5xx are retried, once |
| a 200 with no image | better an error than an empty file |
| `approve` on a master that is not 1448×1086 | wrong-shaped shipped image, thumbnail that no longer matches |
| `approve` on a round generated against another brief | the same trap, one stage later |

A validation error collects **every** problem at once, so a bad spec is one fix
rather than five.

## Where things land

    art/pilot/restyle/round-NN/
      raw/<scene>.png      1472×1104, exactly as it arrived — never edited
      <scene>.png          the 1448×1086 master
      crops/               the review renditions
      sheet.html           the review sheet
      manifest.json        what was sent, and whether it was approved

Restyle rounds have **their own counter starting at 1.** The tan-era rounds 1–19
are cited by number throughout `pilot-prompts.md`, so continuing that numbering
would make every one of those citations ambiguous. Both trees are gitignored;
`art/pilot/approved/` is not, and never should be.

## The review renditions

A master looks fine at master size. What it has to survive is being cropped to a
21:9 program hero and shrunk to the 56px map rail — and the failures that got
through rounds 1–19 were all failures at some *other* size: action drifting out
of the 21:9 band, a composition that turned to mush small.

So every round produces six renditions from the master and puts them on one page
with the scene's `mustBeTrue` line above them:

| rendition | where the app uses it |
| --- | --- |
| `today-16x7` | Today hero (focal point at 42%, read off `app.css`) |
| `program-21x9` | program hero |
| `welcome-5x4` | welcome panel |
| `square` | library card / map rail |
| `square-84` | 84px, rendered at true size |
| `square-56` | 56px, rendered at true size |

The two thumbnails are cut from the square crop rather than from the master,
because the app shows the square and then shrinks it — shrinking anything else
answers a different question. They are rendered unscaled in the sheet, since a
thumbnail displayed large tells you nothing about whether the thumbnail works.

The crop table and its geometry are shared with the older `check` command, so
the two cannot drift apart. Crops are expressed as **ratios and a focal
fraction, never pixels**: `sips` does not refuse a crop larger than its source,
it pads it, so a pixel-sized crop against a smaller file yields a confident wrong
answer instead of an error.

## What approve does

Installing a picture is one copy. The five steps around it are where this
project has actually lost time:

| | |
| --- | --- |
| `img/<key>.jpg` | 1100px wide, JPEG quality 72 |
| `img/thumb-<key>.jpg` | 240px wide, same quality — `js/content.js` derives this path from the full one, so the name is a contract |
| `art/pilot/approved/<key>.png` | the master, filed under the shipped key |
| `css/app.css` | seven lines in two blocks, so the flat art skips the warm-art grade |
| `art/source/restyle-worklist.md` | the tick |

Miss the CSS and the picture renders slightly greyer than the one beside it,
which is the one failure nobody spots. Miss the tick and the list quietly lies
about what is left.

The numbers are measured, not chosen: the quantisation tables of the existing
shipped files match JPEG quality 72 exactly, and both 1100 and 240 divide
1448×1086 to whole numbers, so there is no rounding to argue about. The thumb is
rendered from the master rather than from the shipped JPEG, and both files are
re-read after writing — a thumb that failed to write is a broken image on every
card, not a missing file someone notices.

The worklist is edited as data by a pure function with its own tests: the tick is
idempotent, an unknown key throws rather than silently doing nothing, and the
total is read from the file rather than counted twice.

Until the finish line there was a second register beside it — the pilot ledger in
`css/app.css`, listing every redrawn file so it skipped the warm-art grade —
edited the same way, with its container list read off the block rather than
hardcoded. It was deleted with the grade.

`approve` does **not** commit and does **not** bump `APP_VERSION`. Both are
release decisions, and the release here is the finish line.

## The finish line, which has been crossed

While the set was half redrawn the app carried two vocabularies at once: the warm
art was cooled by `--art-grade` and `--art-veil` in `css/app.css`, and every
redrawn file opted out of both through the pilot ledger. Cool art graded cooler
goes grey, which is why the ledger existed.

When the last worklist row was ticked, all of it came out in one commit —
`--art-grade`, `--art-veil`, the rules that applied them, the whole ledger block,
the `ledger.mjs` module and every call site. One commit rather than several,
because deleting the tokens before the ledger would have graded nothing and
deleting the ledger first would have graded the last few pictures alone.

What that leaves is simpler than what it replaced: the illustrations are drawn in
the app's own palette, so there is nothing to correct at render time, and
`approve` no longer touches the stylesheet at all.

## The code

    scripts/pilot.mjs          the CLI: dispatch and the older hand-driven commands
    scripts/lib/markdown.mjs   blockquote extraction, shared with pilot.mjs
    scripts/lib/brief.mjs      the reusable blocks, from the live brief, and BRIEF_ID
    scripts/lib/profiles.mjs   the output shapes: canvas, master, renditions, install
    scripts/lib/scene.mjs      spec validation, ordered references, prompt assembly
    scripts/lib/request.mjs    the request surface, the key, the call, output paths
    scripts/lib/plan.mjs       the dry run
    scripts/lib/generate.mjs   the run
    scripts/lib/approve.mjs    the install
    scripts/lib/renditions.mjs the crop table and geometry, shared with `check`
    scripts/lib/splashfield.mjs the splash field colour, measured and written
    scripts/lib/worklist.mjs   the worklist checkboxes, as data
    scripts/lib/sheet.mjs      the review sheet
    scripts/lib/status.mjs     where all 37 pictures stand
    scripts/lib/imagesize.mjs  PNG and JPEG dimensions, without shelling out

Zero dependencies, as the rest of this repo is. Node's built-in `fetch`,
`FormData`, `--env-file` and `node --test` do everything a package would.

`ledger.mjs` was temporary by design — it existed only while both styles were in
the app — and it went with the ledger at the finish line, along with its tests
and every call site.

## Running the tests

    node --test scripts/lib/*.test.mjs

186 tests, no network, no key, no macOS — `fetch` and `sips` are injected, and
the whole of `generate` and `approve` runs in a temp directory against images the
suite builds itself. The directory form (`node --test scripts/lib/`) does not
work on every Node build; the glob always does.

Covered end to end: refusals, rate limits, a 200 with no image, a wrong canvas, an
existing round, the worklist transform against the real file, and
that nothing is ever written outside the round directory.

## Still unverified

The request surface was checked against
[the official image-generation guide](https://developers.openai.com/api/docs/guides/image-generation)
on 2026-08-28, but documentation is not a live call. One thing only a real
request can settle: **whether the model honours `image[]` order as reference
precedence** the way the assembled prompt's numbered attachment list assumes it
does. Watch the first round for it.

Cost is billed per token — $8/M in, $30/M out — and published per-image figures
for `quality: high` vary widely by reseller. Treat the `~$0.20–0.35` that `plan`
prints as an order of magnitude and check it against the first invoice. A scene
being iterated for composition rather than finish is worth re-running at
`quality: medium`, which is roughly a quarter of the price.

## Adding a scene

1. Write `art/scenes/<key>.json`. The alt text in the worklist was written
   against the picture each key is supposed to be, so it doubles as the scene
   text; add a `mustBeTrue` line naming the one thing it has to get right.
2. Attach a `style:exemplar` **first** — a scene already redrawn against this
   brief — then the two likeness sheets, then any continuity reference. That
   order is the whole lesson of the first live round: leading with the likeness
   sheets ships two painterly examples ahead of the flat one, and the picture
   comes back painterly. `validateScene` refuses an exemplar in any other
   position, since the prompt calls it "attachment 1" by number. If the scene is
   half of a pair, attach the finished half so the room, camera and distances
   match.
3. `plan <key>` and read the assembled prompt. This is free.
4. `generate <key> --yes`, then open the sheet.
5. Good? `approve <key> --yes`, review the diff, commit it yourself.
   Not good? Adjust the spec and run again — it takes the next round number and
   leaves the last one where it is.
