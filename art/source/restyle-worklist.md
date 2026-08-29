# Restyling the whole set

Thirty-seven registered illustrations, redrawn flat and cool against
[Block A in `drawing-a-new-scene.md`](drawing-a-new-scene.md). Four are done —
the pilot proved the style, the palette, the leash rules and the crops — and the
decision after it was to finish the whole set before any of it ships, so the app
changes style once rather than carrying two vocabularies at the same time.

**Nothing merges until this list is clear.** While it is in progress the app on
`main` keeps the old warm set and its CSS grade; the redrawn files accumulate on
the branch, each one opted out of the grade by the ledger in `css/app.css`.

**When the last one lands**, delete `--art-grade`, `--art-veil`, the rules that
apply them and the whole ledger block together — all in one commit, not one at
a time, or the stragglers get graded alone. That deletion is the finish line.

## How to work the list

Write `art/scenes/<key>.json`, then:

    node scripts/pilot.mjs plan <key>                        free, read the prompt
    node --env-file=.env.local scripts/pilot.mjs generate <key> --yes
    node scripts/pilot.mjs approve <key> --yes               installs and ticks the row below

The pipeline assembles Block A + Block B, attaches the references in declared
order and writes a review sheet; `approve` renders both shipped files, files the
master, opts the flat art out of the CSS art grade and ticks this list. Full
reference: [`../../docs/illustration-pipeline.md`](../../docs/illustration-pipeline.md).

**The alt text in the table is the scene description** — it was written against
the picture each key is supposed to be, so it doubles as the brief. Add a
`mustBeTrue` naming the one thing the picture has to get right.

By hand instead: paste Block A + Block B, attach `trainer-reference.jpg` and
`lucy-reference.jpg`, then the scene. That is how the first eight were drawn.
What it loses is the record of which references were attached in which order,
which is why the pipeline exists.

Carry these on every scene, all learned from the pilot:

- **Every leash**: draw the clip on the collar ring; give the black leash a thin
  lighter outline where it passes near her coat; slack unless the scene says
  otherwise; never across her back or shoulders.
- **Covers** (marked below) get cropped to a centred square: everything
  essential inside the middle 75% of the width.
- **The wide ones** get a 21:9 crop: everything essential inside the middle 60%
  of the height.
- **Pairs**: attach the finished half as a third reference so the room, camera
  and distances match.
- The returned file must be exactly **1472×1104**, and the master exactly
  **1448×1086**. Both are checked for you — a wrong canvas keeps the raw file
  and refuses to make a master, because reaching 4:3 from another ratio needs
  a crop and that should be a decision.

## The list


### Doorbell Predicts Rewards

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `door-sound-01-setup` | — | Lucy sits beside her handler near the closed front door with the leash running down under the handler’s shoe. |
| [x] | `door-sound-02-bell` | used ×2 | A visitor at the closed front door presses the doorbell. |
| [x] | `door-sound-02-knock` | — | A visitor at the closed front door knocks on it. |
| [x] | `door-sound-02-self` | used ×2 | A handler knocks on the door frame while standing right beside Lucy with the leash under her foot. |
| [x] | `door-sound-03-name` | used ×2 | Lucy turns away from the door to look up at her handler, who crouches beside her at her level with both hands empty. |
| [x] | `door-sound-03-name-distant` | used ×2 | Lucy sits on her bed near the front door and turns her head toward her handler, who is beckoning from the far end of the hallway. |
| [x] | `door-sound-04-treats` | — | A flat open palm held out at Lucy’s head height, cropped close, with Lucy sitting and looking up at it. |
| [x] | `door-sound-05-settle` | — | Lucy stands relaxed on a slack leash beside her handler in a quiet moment between repetitions, with nothing being asked of her. |
| [x] | `door-sound-cover` | **cover** · square-safe | Lucy and her handler close together and face to face, the handler’s hand resting on Lucy’s chest. |

### Stay While the Door Opens

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `door-stay-02-cue` | — | A handler stands beside Lucy’s bed with a flat open palm raised at chest height while Lucy lies on the bed, head up, holding her eye. |
| [x] | `door-stay-03-conversation` | — | A handler leans on the open front door talking to an empty porch while Lucy stays settled on her bed across the room. |
| [x] | `door-stay-03-crack` | — | A handler holds the front door open a few inches onto daylight while Lucy stays lying on her bed. |
| [x] | `door-stay-03-cross` | used ×3 | Lucy holds her down on her bed while her handler walks away across the room toward the closed front door. |
| [x] | `door-stay-03-halfway` | — | Lucy holds her bed while a handler pauses halfway across the room and glances back at her. |
| [x] | `door-stay-03-handle` | — | A handler rests a hand on the front door handle while Lucy holds her bed across the room. |
| [x] | `door-stay-03-onestep` | — | A handler stands one step from Lucy’s bed looking down at her, the closed front door still across the room, while Lucy holds her down. |
| [x] | `door-stay-03-pretend` | used ×3 | A handler stands in the open doorway talking to an empty porch while Lucy stays on her bed. |
| [x] | `door-stay-04-pay` | used ×2 | A handler kneels beside Lucy’s bed and feeds her a treat for staying in place. |
| [x] | `door-stay-05-release` | used ×2 | Lucy steps off her bed toward her handler’s open hands as she is released from the stay. |
| [x] | `door-stay-cover` | **cover** · square-safe | A handler holds the front door wide open onto daylight while Lucy stays lying on her bed across the room. |

### Doorbell Means Place

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `door-place-03-send` | used ×5 | Lucy steps onto her bed as her handler points to it from behind her, near the closed front door. |
| [x] | `door-place-cover` | **cover** · square-safe | Lucy lies settled on her bed while her handler crouches beside her, well back from the closed front door. |

### Controlled Real Greeting

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `door-greet-01-settle` | — | A handler crouches beside Lucy’s bed clipping the leash to her collar, well back from the closed front door. |
| [x] | `door-greet-04-open` | used ×2 | Lucy sits on her bed on a slack leash while her handler stands beside her holding it and a guest waits outside the open door. |
| [x] | `door-greet-05-reward` | — | A handler crouches to feed Lucy a treat on her bed while a guest waits at the open door. |
| [x] | `door-greet-06-enter` | — | A guest stands just inside the closed front door looking at the handler, while Lucy lies on her bed on a slack leash. |
| [x] | `door-greet-06-seated` | — | A guest sits in an armchair and the handler sits on a sofa, neither looking at Lucy, while she lies settled on her bed between them. |
| [x] | `door-greet-07-approach` | — | A handler walks Lucy toward a waiting guest with the leash short and slack between them. |
| [x] | `door-greet-08-jumping` | **pair** | Lucy rears up with both front paws on the guest’s chest, mouth open and ears back, while he leans away and the leash pulls tight. |
| [x] | `door-greet-08-petting` | — | Lucy sits with all four paws on the floor while a crouching guest rests an open palm on her chest and her handler holds the leash slack behind her. |
| [x] | `door-greet-09-leaves` | — | A guest steps back out through the open door with a small wave while Lucy stays sitting at her handler’s side on leash. |
| [x] | `door-greet-cover` | **cover** · square-safe | Lucy sits at her handler’s side on a slack leash while a guest stands a step away with his hands at his sides, the open front door behind him. |

### Program covers

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `door-cover` | **cover** · square-safe | Lucy sits on her bed a few feet inside the entryway while a visitor stands in the open doorway and a handler holds a loose leash. |

### Planned activities

| ✓ | key | notes | scene (the alt text) |
| --- | --- | --- | --- |
| [x] | `plan-fourpaws` | **cover** · square-safe | Lucy stands with all four paws on the floor, looking up at a person who keeps their hands together at their waist. |
| [x] | `plan-mat` | **cover** · square-safe | Lucy lies flat on her side asleep on her mat while someone sits quietly nearby. |
| [x] | `plan-name` | **cover** · square-safe | Lucy turns her head to meet her crouching handler\u2019s eyes while a squirrel sits ignored on the grass behind her. |
| [x] | `plan-walkpeople` | **cover** · square-safe | Lucy walks on a loose leash looking up at her handler as a stranger passes behind them. |

### Outside the list, on purpose

Two files in `img/` carry no key in the `IMAGES` map. Neither belongs on the
list, and neither is dead:

- **`splash-mark.jpg`** — already redrawn. It is the launch illustration, drawn
  for this palette and graded in its own pixels; `css/app.css` and
  `scripts/make-splash.mjs` both depend on the field colour measured off it.
  Leave it alone.
- **`lucy-portrait.jpg`** — **gone, and not redrawn.** It shipped and was
  precached for one reason: Lucy's stored photo was written at setup and pointed
  at it. The redrawn `dog-01` is the same black Labrador in the same palette, so
  the portrait was a second picture to maintain for no difference on screen. It
  was deleted, `js/store.js` repoints her stored path at `dog-01`, and
  `--avatar-grade` — which existed for this file and this file alone by the end —
  went with it. This was the last un-redrawn picture in the app.

Also outside this list: the ten stock dog avatars in `img/avatars/` and the
fourteen people avatars beside them. None of them is an instructional picture,
which is why they were never on it. They have since been redrawn anyway, on the
brand-marks track — flat and cool, in PNG, and taking no filter at all, since
art already in the palette does not want correcting twice.
