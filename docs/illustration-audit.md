# Illustration audit and manifest

Every production illustration in the app, what it has to say, where it says it,
and how well it currently says it. Written before any image or code changes, so
that the restyle to **Warm Instructional Vector** starts from a full picture of
what is there rather than from the file listing.

Nothing in this document has been acted on. No image has been modified, moved,
renamed, or regenerated, and no code has been touched.

Supersedes the style block and character sheet in [image-prompts.md](image-prompts.md),
which describe the current painted picture-book look. That file stays accurate
as a record of how today's set was made.

---

## 1. What is in `img/`

| Group | Files | Dimensions | Aspect | Payload |
| --- | --- | --- | --- | --- |
| Instructional illustrations | 30 | 1100 × 825 | 4:3 | 5.35 MB |
| Thumbs (one per illustration) | 30 | 240 × 180 | 4:3 | 0.44 MB |
| Brand marks (`lucy-portrait`, `splash-mark`) | 2 | 400², 640² | 1:1 | 0.19 MB |
| Generated splash screens (`splash/`) | 12 | various | various | 1.8 MB |
| Source PNGs (`img/source/`) | 31 | ~2400² | — | 65 MB |

Every illustration is JPEG, every one is exactly 1100 × 825, and no two files
are byte-identical. Naming is `dg-NN` for the door-greetings program and
`cg / sr / wp / fd-01` for the four programs that are named but unwritten.

**Repo weight.** The 31 source PNGs are committed (65 MB, 12× the entire
production payload). They are working inputs, not served assets. Worth deciding
whether the new source files follow them into git before the restyle doubles
the count.

**Rename cost.** `sw.js` hard-codes all 62 image paths in its precache list, and
`js/content.js` keys `IMAGES` by id. Any renaming touches both. Since every
file is being replaced anyway, rename once during the restyle rather than
running a separate migration later.

---

## 2. The seven crops every illustration has to survive

This is the constraint that shapes the whole brief. One 4:3 master is cropped
into seven different shapes, including two squares:

| Surface | Crop | Which images |
| --- | --- | --- |
| Player step figure | 4:3, full width | all step images |
| Player "Get ready" | 4:3 | activity covers |
| "Lucy is too excited" sheet | 16:10 | fallback images |
| Today hero | **16:7**, focus `center 42%` | cover of the focus activity |
| Activity detail hero | 4:3 | activity covers |
| Program hero | **21:9** | `dg-01` |
| Welcome panel | 5:4 | `dg-01`, `dg-03` |
| Activities library card | **84 × 84 square** (thumb) | activity + planned covers |
| Program map rail | **56 × 56 square** (thumb) | activity covers |
| Profile avatar | 76px circle, `30% 40%` | `lucy-portrait` |

Consequences for the new art:

- **Covers must work twice.** An activity cover is letterboxed to 16:7 on Today
  and centre-cropped to a 56px square on the map. Lucy and the handler have to
  sit inside a horizontal band across the middle *and* inside a centred square.
  Today's covers mostly fail one or the other: `dg-24` puts Lucy hard left with
  half the frame empty hallway, so the 56px square lands on floorboards.
- **Step images are 4:3 only** and can use the full frame.
- **Nothing may depend on a detail smaller than ~5% of frame width** — it is
  gone at 56px, and the map rail is where a household scans the four activities.

---

## 3. System-level findings

### 3.1 There are four different art styles in one app

| Family | Files | Character |
| --- | --- | --- |
| **A — Inked semi-realistic** | dg-01, 08, 09, 10, 11, 12 | Crisp linework, cool cream walls, Lucy in a **purple harness she does not own**, guest in brown plaid, handler in grey sneakers |
| **B — Graphic close-up** | dg-02, 03, 04, 06 | Heavier outline, flatter fill, bodies cropped by the frame, saturated skin tones (dg-03 is markedly orange) |
| **C — Matte painterly** | dg-05, 07, 13–26, cg-01, sr-01, wp-01, fd-01 | Soft matte rendering, yellower walls, framed landscape paintings, Lucy in a **collar only — the correct equipment**, handler in grey-navy slip-ons |
| **D — Cartoon sticker** | lucy-portrait, splash-mark | Outlined cartoon badge with a baked-in green checkmark |

Family C is the largest and `dg-07` is the closest thing in the library to the
target style — flat, uncluttered, one action, generous empty space.

### 3.2 Lucy is not the same dog from step to step

The old character sheet allowed "purple collar **or** harness with a round blue
tag", and that *or* is the root of the worst continuity break in the set. The
real Lucy wears **a flat purple collar with a round blue tag, and no harness**,
with the leash clipped to the ring on the collar at her neck. Everything below is
measured against that.

- **Equipment changes mid-session.** Running Doorbell Predicts Rewards at level 1
  shows, in order: harness (`dg-02`) → collar (`dg-20`) → harness (`dg-04`) →
  collar (`dg-17`) → collar (`dg-18`). Five steps, three equipment changes, one
  continuous five-minute session — and the two harness frames are the wrong ones.
- **Twelve images put her in a harness she does not wear.** dg-01 – dg-12 all
  show a purple harness, most with a collar underneath it as well. The other
  eighteen — dg-13 – dg-26 and all four planned covers — show the collar alone,
  which is right. Most of the library is already correct; it is the first twelve
  that have to change.
- **Coat changes.** Smooth-coated Labrador in dg-01, 05, 09, 23; distinctly
  wirehaired and scruffy in dg-02, 17, 19, 25.
- **Off-sheet markings.** `fd-01` gives Lucy a white blaze up the muzzle and
  forehead that appears nowhere else.
- **Two dogs in one frame.** `dg-03` is a diptych whose two panels render Lucy
  differently.
- **Size drift.** `dg-13` reads as a noticeably smaller, younger dog.

### 3.3 Six of the ten leashes are attached to a harness that should not be there

The leash clips to the ring on Lucy's **collar**, at her neck. Ten of the 30
images show an attached leash: four get it right, and six run the line to a
harness she does not wear.

| Image | Leash shown | Attaches at | Correct |
| --- | --- | --- | --- |
| dg-18 | deep J, best-drawn arc in the set | collar | ✓ |
| dg-20 | under the handler's foot | collar | ✓ |
| dg-26 | short, hand at her neck | collar | ✓ |
| wp-01 | loose-leash walk | collar | ✓ |
| dg-01 | slack to handler's hand | back of harness | ✗ |
| dg-02 | held in hand | back of harness | ✗ |
| dg-08 | slack, handler at door | back of harness | ✗ |
| dg-10 | walking, loose J | **top of harness, between the shoulder blades** | ✗ |
| dg-11 | looped in handler's hand | back of harness | ✗ |
| dg-12 | slack behind her | back of harness | ✗ |
| dg-25 | coiled on the floor, unattached | — | n/a |

This is more than a prop swap. A line anchored at the neck leaves from a
different point, at a different angle, and drapes differently from one anchored
between the shoulder blades, so the six wrong ones are a redraw from the
attachment outward rather than a recolour. It also changes what the picture
teaches: `dg-10` is the "walk her over on a loose leash" image, and it currently
demonstrates equipment the household does not own.

The four correct ones are the reference. `dg-18` has the best-drawn leash arc in
the library and should be the benchmark for the rest.

### 3.4 The humans drift too

- **Handler footwear**: grey sneakers (families A/B) vs grey-navy slip-ons (C).
- **Treat pouch**: hand-held yellow pouch (dg-02), belt-clipped pouch (dg-17,
  25, 26), absent everywhere else.
- **The guest is two different men.** Dark-haired in brown/blue plaid with brown
  boots (dg-01, 09, 10, 12); lighter-haired in blue-grey check with tan trousers
  (dg-21, 22, 26).
- **`dg-08` renders the guest as a translucent blue ghost** to mean "imaginary
  visitor". It reads as an apparition, and it is a symbol baked into the
  artwork — exactly what the new style rules out.

### 3.5 A handful of images carry the whole app

| Image | References | Distinct actions it is asked to depict |
| --- | --- | --- |
| dg-07 | 30 | 3 — cue the stay / walk toward the door / **walk back and reward** |
| dg-06 | 22 | 1 (send to bed), but under four different level treatments |
| dg-03 | 17 | 2 — ring the bell / knock |
| dg-09 | 16 | 3 — leash and settle / open the door / **bring the guest in** |
| dg-19 | 14 | 1 (release and reset) |

`dg-07` illustrating "walk back and reward her on the bed" while showing the
handler walking *away* with no treat in hand is the single worst instruction
mismatch in the set, and it is on screen more than any other picture in the app.

### 3.6 There is no incorrect-behaviour image anywhere

All 30 illustrations show either a correct action, a setup, a reward, or a
result. Nothing shows Lucy getting it wrong — no jumping, no barking at the
door, no bolting past the handler. The pilot brief asks for a
correct-versus-incorrect example, so that image has to be **created**, not
restyled. See §6.4.

The app also has no component for showing a pair. `.step-figure` renders one
image. A correct/incorrect pair needs either a new two-up figure or a second
step, and since the style rules out baked-in ✓/✗ marks, the labels have to be
real HTML text. Flagged as a decision, not assumed.

### 3.7 Alt text is accurate for the picture but detached from the step

The alt describes the artwork, which is the right approach where the
instruction sits beside it. Two problems sit underneath that:

- **Seven alts describe something the picture does not show** (dg-05, 06, 07,
  09, 12, 13, fd-01 — each flagged in §5).
- **A reused image carries one alt across up to 30 different steps.** No wording
  fixes that; it is the reuse that has to go.

### 3.8 Naming does not survive contact with the app

- Numbers are allocation order, not session order. `dg-13`–`dg-16` are the middle
  of Stay While the Door Opens and belong between `dg-07` and `dg-08`.
- Two schemes coexist: `dg-` is a *program* prefix, `cg/sr/wp/fd-` are *goal*
  prefixes.
- Nothing in a filename says which activity, step, or moment it serves, so the
  only way to find the image for a step is to read `content.js`.

**Recommended scheme**, applied during the restyle:
`<program>-<activity>-<moment>` — e.g. `door-sound-01-setup`,
`door-stay-03-handle`, `door-greet-08-petting`. Covers take `-cover`, fallbacks
take `-easier`.

---

## 4. Priority for replacement

| Tier | Images | Why |
| --- | --- | --- |
| **P0** | dg-07, dg-06, dg-03, dg-09 | Highest reference counts *and* each one misrepresents at least one step it illustrates. Fixing these four corrects 85 of the 190 image references in the app. |
| **P1** | dg-02, dg-05, dg-12, dg-13, dg-04, dg-17, dg-19 | Direct instruction mismatch, or the worst style outliers. |
| **P2** | dg-01, dg-11, dg-10, dg-24, dg-25 | High visibility (covers, welcome, fallbacks) but currently accurate. |
| **P3** | dg-08, dg-14, dg-15, dg-16, dg-18, dg-20, dg-21, dg-22, dg-23, dg-26 | Accurate and low-traffic; restyle for consistency only. dg-08 is here rather than lower because the ghost device has to go. |
| **P4** | cg-01, sr-01, wp-01, fd-01 | Locked "soon" cards. Render at 84px, never inside a session. |
| **Separate track** | lucy-portrait, splash-mark | Brand marks, not instruction. Different style problem (cartoon + baked-in checkmark), different decision. |

---

## 5. The manifest

Every entry: file facts, where it renders, what it must communicate, the body
language it needs, its type, alt text now and recommended, flags, priority.

**Equipment applies to all thirty and is not repeated per entry:** Lucy wears a
flat purple collar with a round blue tag and no harness, and any leash clips to
the ring on that collar. dg-01 – dg-12 all break it; the other eighteen already
comply. See §3.2 and §3.3 rather than looking for a per-image flag.

"Refs" counts every step across every level that resolves to this image, plus
covers and fallbacks. `→` marks the gap between what the step says and what the
picture shows.

---

### dg-01 — Guest at the open door, Lucy holding her bed
- **File** `dg-01.jpg` · JPEG · 1100×825 (4:3) · 210 KB · thumb 18 KB
- **Appears** Program hero `#/program/calm-door-greetings` (21:9); Welcome panel 1 (5:4). 2 refs
- **Activity** Calm Door Greetings — the programme as a whole
- **Must communicate** The finished state: a guest is in the doorway and nothing has gone wrong
- **Lucy** Sitting square on her bed several feet inside the entry, weight settled, ears neutral, attention on the handler rather than the guest
- **Human** Handler standing side-on beside the bed, leash held low in the near hand with visible slack; guest standing still in the doorway, hands at sides, not leaning in
- **Type** Result
- **Alt now** "Lucy sits on her bed a few feet inside the entryway while a visitor stands in the open doorway and a handler holds a loose leash."
- **Alt better** "Lucy sits on her bed inside the entry, watching her handler, while a guest waits in the open doorway and the leash hangs slack."
- **Flags** Family A. Busiest background in the set — shelf, framed picture, two plants, side table, candle, coat hooks, doormat, rug. Lucy looks up and away at nothing in particular
- **Priority** P2 — accurate, but it is the first illustration anyone sees

### dg-02 — Setup: standing at the door with Lucy on leash
- **File** `dg-02.jpg` · JPEG · 1100×825 (4:3) · 200 KB · thumb 17 KB
- **Appears** Player step figure, Doorbell Predicts Rewards step 1, all five levels. 6 refs
- **Activity** dg-1 Doorbell Predicts Rewards
- **Must communicate** The starting position before any sound: handler and dog in place, both hands about to be free
- **Lucy** Sitting at the handler's left side, facing the door, calm, lead slack
- **Human** Standing beside Lucy in profile, **leash trapped under the near foot** with a loop of slack on the floor, treat pouch clipped at the waist, both hands free
- **Type** Setup
- **Alt now** "Lucy sits calmly beside the front door on a leash while a handler holds a treat pouch."
- **Alt better** "Lucy sits beside the front door with the leash under her handler's foot and a treat pouch at the handler's waist."
- **Flags** **Contradicts its own helper text** — the step says "Step lightly on the leash so both hands stay free" and the picture shows the leash in one hand and the pouch in the other, both hands occupied. Family B; handler cropped at the neck. `dg-20` already shows the correct technique
- **Priority** P1

### dg-03 — Ringing the bell / knocking (diptych)
- **File** `dg-03.jpg` · JPEG · 1100×825 (4:3) · 165 KB · thumb 15 KB
- **Appears** Player step figure — dg-1 step 2 (L2–L5), dg-3 step 1 (all levels), dg-4 step 2 (all levels); Welcome panel 2 (5:4). **17 refs**
- **Activity** dg-1 Doorbell Predicts Rewards, dg-3 Doorbell Means Place, dg-4 Controlled Real Greeting
- **Must communicate** One sound, made once
- **Lucy** Alert but still — head up, ears forward, feet planted. Not yet reacting
- **Human** One hand at the bell or mid-knock, arm relaxed, body upright; the rest of the person out of frame is fine
- **Type** Setup (the trigger)
- **Alt now** "Two views side by side: a hand pressing a doorbell, and a hand knocking on a door, with Lucy watching from inside."
- **Alt better** *(as two files)* "A hand presses the doorbell while Lucy watches from inside." / "A hand knocks on the front door while Lucy watches from inside."
- **Flags** **Two panels in one file** — breaks "one action per image", and the 84px thumb shows half of each. Two differently-rendered dogs. Saturated orange skin tone. Third most-used image in the app
- **Priority** **P0 — split into two files**

### dg-04 — Saying her name, treats in the open palm
- **File** `dg-04.jpg` · JPEG · 1100×825 (4:3) · 192 KB · thumb 15 KB
- **Appears** Player step figure — dg-1 step 3 (L1–L3), dg-3 step 2 (all levels). 10 refs
- **Activity** dg-1 Doorbell Predicts Rewards, dg-3 Doorbell Means Place
- **Must communicate** The handler says Lucy's name and Lucy turns away from the door to look at them
- **Lucy** Sitting, head and eyes swung fully to the handler, mouth relaxed, ears soft — the turn is the whole point
- **Human** Crouched or squatting side-on at Lucy's level, face toward her, **hands empty or at rest** — the treat comes one step later
- **Type** Correct action
- **Alt now** "Lucy turns away from the door to look up at her handler, who is offering two small treats."
- **Alt better** "Lucy turns from the door to look up at her handler, who is crouched at her level saying her name."
- **Flags** Shows the treat already in the open palm, which is `dg-17`'s job one step later — the picture skips the beat it is meant to illustrate. Family B
- **Priority** P1

### dg-05 — Calling Lucy from another room
- **File** `dg-05.jpg` · JPEG · 1100×825 (4:3) · 187 KB · thumb 14 KB
- **Appears** Player step figure — dg-1 L4 step 3, L5 step 3. 2 refs
- **Activity** dg-1 Doorbell Predicts Rewards, levels 4–5
- **Must communicate** The handler is far away and Lucy turns toward the voice rather than the door
- **Lucy** On her bed near the door, **head turned back over her shoulder toward the handler**, weight shifting to rise
- **Human** Standing well back down the hall or in the kitchen doorway, side-on, one hand raised in a small beckon, calm posture
- **Type** Correct action
- **Alt now** "Lucy near the front door turning toward a handler who is calling her cheerfully from the next room."
- **Alt better** "Lucy sits on her bed by the door and turns her head toward her handler, who is calling her from the kitchen."
- **Flags** → **Lucy is not turning.** She faces the door, away from the handler, so the picture shows the failure state of the step it illustrates. Widest, emptiest composition in the set; at 4:3 on a phone the dog is a small dark shape
- **Priority** P1

### dg-06 — Send her to her bed
- **File** `dg-06.jpg` · JPEG · 1100×825 (4:3) · 185 KB · thumb 16 KB
- **Appears** Activity cover, dg-3 Doorbell Means Place → Today hero (16:7), library card (84px), detail hero (4:3), map rail (56px), Get ready (4:3). Player step figure — dg-2 step 1 (L1–L8), dg-3 step 3 (all levels), dg-4 step 3 (all levels). **22 refs**
- **Activity** dg-2 Stay While the Door Opens, dg-3 Doorbell Means Place, dg-4 Controlled Real Greeting
- **Must communicate** Lucy travelling **to** the bed on cue, and arriving
- **Lucy** Mid-stride **onto** the bed, front feet landing on it, head and body aimed at the bed, tail level
- **Human** Kneeling or standing side-on **behind** Lucy's line of travel, one arm extended pointing at the bed, the pointing hand clearly downstream of the dog
- **Type** Correct action
- **Alt now** "Lucy moving away from the doorway toward her dog bed while a handler points calmly to the bed."
- **Alt better** "Lucy steps onto her bed as her handler points to it from beside her."
- **Flags** → **The direction is backwards.** Lucy is standing on the bed already, facing off it, walking toward the pointing hand — a viewer reads "come off the bed", the opposite instruction. No door anywhere in frame, though every step that uses it is about the door. Second most-used image, and it is also an activity cover, so it takes the 16:7 and 56px crops as well
- **Priority** **P0**

### dg-07 — Handler crosses to the door, Lucy holds the down
- **File** `dg-07.jpg` · JPEG · 1100×825 (4:3) · 144 KB · thumb 12 KB
- **Appears** Player step figure — dg-2 steps 2, 3, 4 across L1–L8; dg-3 steps 4, 5 across L1–L5. **30 refs, the most-used image in the app**
- **Activity** dg-2 Stay While the Door Opens, dg-3 Doorbell Means Place
- **Must communicate** Three separate beats it currently answers with one picture: (a) cue the stay and hold eye contact, (b) move toward the door, (c) come back and reward on the bed
- **Lucy** Lying down on the bed, front legs extended, head up, eyes tracking the handler — holding, not settling to sleep
- **Human** *(for beat b)* Walking away toward the door, three-quarter rear view, arms relaxed, no leash. *(beat a)* Facing Lucy, palm-out stay signal at chest height. *(beat c)* Crouched at the bed, treat delivered between her front paws
- **Type** Correct action
- **Alt now** "Lucy lying on her bed holding position while a handler walks toward the closed front door and glances back."
- **Alt better** "Lucy lies on her bed with her head up, watching her handler walk toward the closed front door."
- **Flags** → **She does not glance back** (alt is wrong). → **It illustrates "walk back and reward her on the bed" while showing the handler walking away empty-handed.** Cleanest, flattest composition in the library and the closest existing image to the target style. Near-duplicate of `dg-14`, which sits in a different style family
- **Priority** **P0 — split into three, or repoint the reward step at a reward image**

### dg-08 — Greeting an imaginary visitor
- **File** `dg-08.jpg` · JPEG · 1100×825 (4:3) · 190 KB · thumb 16 KB
- **Appears** Player step figure — dg-2 L5 step 3, L6 step 3, dg-3 L5 step 5. 3 refs
- **Activity** dg-2 Stay While the Door Opens (L5–6), dg-3 Doorbell Means Place (L5)
- **Must communicate** The door is fully open onto an empty porch and the handler is talking to nobody, while Lucy holds
- **Lucy** Sitting or lying on her bed, head up, watching, not rising
- **Human** Standing in the open doorway three-quarters away from camera, one hand on the door edge, head turned to the empty porch, other hand holding the leash slack
- **Type** Setup (the rehearsal)
- **Alt now** "A handler stands at the open front door greeting an imaginary visitor, shown as a faint silhouette, while Lucy stays on her bed."
- **Alt better** "A handler stands in the open doorway talking to an empty porch while Lucy stays on her bed."
- **Flags** **The translucent blue figure is a symbol baked into the artwork** and rules-out under the new style; it also reads as a ghost. The bed sits against the door rather than a few feet back
- **Priority** P3 — low traffic, but the ghost must not survive the restyle

### dg-09 — Guest waiting outside, Lucy on her bed
- **File** `dg-09.jpg` · JPEG · 1100×825 (4:3) · 188 KB · thumb 16 KB
- **Appears** Player step figure — dg-2 L8 step 3; dg-4 steps 1, 4, 6 across L1–L5. **16 refs**
- **Activity** dg-4 Controlled Real Greeting, dg-2 L8
- **Must communicate** Three separate beats: (a) leash Lucy and settle her, (b) open the door with the guest staying put, (c) bring the guest in
- **Lucy** Sitting or lying on her bed, **on leash**, attention on the guest but body still
- **Human** Handler must be **in frame holding the leash** — the step is "Leash Lucy and settle her on her bed". Guest outside the threshold, feet still, hands at sides
- **Type** Setup / correct action
- **Alt now** "A familiar guest waits patiently outside the open front door while Lucy stays on her bed several feet away."
- **Alt better** "Lucy sits on her bed on a slack leash while her handler stands beside her and a guest waits outside the open door."
- **Flags** → **No handler and no leash anywhere in the picture**, on a step whose whole instruction is to leash her. Also asked to depict "bring the guest in", which it does not show. Fourth most-used image
- **Priority** **P0**

### dg-10 — Walking Lucy over on a loose leash
- **File** `dg-10.jpg` · JPEG · 1100×825 (4:3) · 200 KB · thumb 17 KB
- **Appears** Player step figure — dg-4 step 7, L4 and L5. 3 refs
- **Activity** dg-4 Controlled Real Greeting
- **Must communicate** A controlled approach: handler leads, Lucy walks beside, the leash never goes tight
- **Lucy** Walking at the handler's side, shoulder level with their leg, head up but not pulling ahead, tail level
- **Human** Walking side-on toward the guest, **leash held short in the near hand with a visible J of slack**, other arm relaxed; guest stationary in the doorway, hands at sides, body turned slightly away rather than leaning in
- **Type** Correct action
- **Alt now** "A handler walks Lucy on a loose short leash from her bed toward a familiar visitor in the entryway."
- **Alt better** "A handler walks Lucy toward a waiting guest with the leash short and slack between them."
- **Flags** Family A. Accurate. Lucy is slightly ahead of the handler's knee, which is a hair away from "pulling" — worth tightening in the redraw
- **Priority** P2

### dg-11 — The calm greeting itself
- **File** `dg-11.jpg` · JPEG · 1100×825 (4:3) · 198 KB · thumb 16 KB
- **Appears** Activity cover, dg-4 Controlled Real Greeting → Today hero (16:7), library card (84px), detail hero (4:3), map rail (56px), Get ready (4:3). Player step figure — dg-4 step 8, L4 and L5. 4 refs
- **Activity** dg-4 Controlled Real Greeting
- **Must communicate** Four paws down, sit held, guest petting the chest rather than looming over the head
- **Lucy** Sitting square, all four feet down, weight back, head level, receiving the hand on her chest — no jumping, no leaning in
- **Human** Guest **crouched to one side**, palm to Lucy's chest not over her skull, eyes soft; handler standing behind holding the leash in a loose loop
- **Type** Correct action / result
- **Alt now** "Lucy sits calmly while a visitor gently pets her chest and a handler stands beside her holding a loose leash."
- **Alt better** "Lucy sits with all four paws down while a crouching guest strokes her chest and her handler holds the leash loosely behind her."
- **Flags** Family A. The most instructionally correct image in the library — it is the one to hold the new style to. As a cover it takes the 16:7 and 56px crops; three figures currently spread wider than a square crop can hold
- **Priority** P2

### dg-12 — Rewarding her for holding the bed while the door is open
- **File** `dg-12.jpg` · JPEG · 1100×825 (4:3) · 201 KB · thumb 17 KB
- **Appears** Player step figure — dg-4 step 5, all five levels. 6 refs
- **Activity** dg-4 Controlled Real Greeting
- **Must communicate** Payment arriving **on the bed** while the door is open and a guest is visible
- **Lucy** Sitting on her bed, taking the treat, feet unmoved
- **Human** Handler **crouched, not bent** at the waist, treat visibly between finger and thumb reaching to Lucy's mouth, leash slack in the other hand; guest outside, still
- **Type** Reward
- **Alt now** "A handler feeds Lucy a treat at a comfortable distance from the barely-open front door while a guest waits outside."
- **Alt better** "A handler crouches to feed Lucy a treat on her bed while a guest waits at the open door."
- **Flags** → **No treat is visible** and → **the door is wide open**, not "barely open". The handler bends from the waist over the dog, which is the posture the trainer's own guidance avoids
- **Priority** P1

### dg-13 — One step toward the door
- **File** `dg-13.jpg` · JPEG · 1100×825 (4:3) · 90 KB · thumb 14 KB
- **Appears** Player step figure — dg-2 L1 step 3. 1 ref
- **Activity** dg-2 Stay While the Door Opens, level 1
- **Must communicate** The smallest possible distance: **one** step away, the rest of the room untouched
- **Lucy** Lying on the bed, head up, eyes on the handler, not rising
- **Human** Mid-stride with **one foot clearly lifted and placed forward**, body still square to the bed, weight only just transferred
- **Type** Correct action
- **Alt now** "Lucy lies on her bed while a handler takes a single step away from her toward the closed front door."
- **Alt better** "A handler takes one step toward the closed front door while Lucy holds her down on the bed."
- **Flags** → **No step is being taken** — both feet are planted beside the bed. Lightest file in the set (90 KB) and the flattest render; Lucy reads smaller and younger than anywhere else. Family C, and its outlier within it
- **Priority** P1

### dg-14 — Halfway to the door
- **File** `dg-14.jpg` · JPEG · 1100×825 (4:3) · 174 KB · thumb 13 KB
- **Appears** Player step figure — dg-2 L2 step 3. 1 ref
- **Activity** dg-2 Stay While the Door Opens, level 2
- **Must communicate** Distance opened to about half the room, handler pausing
- **Lucy** Down on the bed, head up, holding
- **Human** Stopped mid-room, weight on the back foot, upper body turned back toward Lucy
- **Type** Correct action
- **Alt now** "Lucy holds her bed while a handler pauses halfway across the room and glances back at her."
- **Alt better** *(unchanged — accurate)*
- **Flags** Near-duplicate of `dg-07` in a different style family. The four-image distance ladder (13/14/15/16) is indistinguishable at 56px — acceptable, since these never render as thumbs
- **Priority** P3

### dg-15 — Hand on the handle
- **File** `dg-15.jpg` · JPEG · 1100×825 (4:3) · 154 KB · thumb 13 KB
- **Appears** Player step figure — dg-2 L3 step 3. 1 ref
- **Activity** dg-2 Stay While the Door Opens, level 3
- **Must communicate** The handler reaches the door and touches the handle; the door does not open
- **Lucy** Down on the bed, head up, watching
- **Human** At the door in profile, **hand closed on the handle**, door still shut, body relaxed
- **Type** Correct action
- **Alt now** "A handler rests a hand on the front door handle while Lucy holds her bed across the room."
- **Alt better** *(unchanged — accurate)*
- **Flags** Family C. Clean and correct
- **Priority** P3

### dg-16 — Crack the door
- **File** `dg-16.jpg` · JPEG · 1100×825 (4:3) · 89 KB · thumb 13 KB
- **Appears** Player step figure — dg-2 L4 step 3. 1 ref
- **Activity** dg-2 Stay While the Door Opens, level 4
- **Must communicate** A few inches of daylight and no more
- **Lucy** Down on the bed, head up, holding
- **Human** At the door, one hand on the edge, door open a hand's width onto light
- **Type** Correct action
- **Alt now** "The front door is open a few inches onto daylight while Lucy stays lying on her bed."
- **Alt better** "A handler holds the front door open a few inches onto daylight while Lucy stays lying on her bed."
- **Flags** Smallest file in the set (89 KB). Alt omits the handler, who is the subject of the step
- **Priority** P3

### dg-17 — Two treats, straight away
- **File** `dg-17.jpg` · JPEG · 1100×825 (4:3) · 198 KB · thumb 16 KB
- **Appears** Player step figure — dg-1 step 4, all five levels. 6 refs
- **Activity** dg-1 Doorbell Predicts Rewards
- **Must communicate** Payment lands immediately after the name, and it is **two** treats
- **Lucy** Standing or sitting, head forward, taking from the palm, body loose
- **Human** Crouched at Lucy's level, **flat open palm with two visible treats**, pouch at the waist, other hand at rest
- **Type** Reward
- **Alt now** "A handler feeds Lucy two small treats from an open palm while Lucy looks up at her hand."
- **Alt better** *(unchanged — accurate)*
- **Flags** Family C, wirehaired coat. Equipment is correct here — collar, no harness — which makes `dg-02` two steps earlier the wrong one. Duplicates `dg-04`'s open-palm gesture; the library has three feeding images (17, 24, 25) with no clear division of labour
- **Priority** P1 — for the equipment continuity break, not the content

### dg-18 — Settling between repetitions
- **File** `dg-18.jpg` · JPEG · 1100×825 (4:3) · 166 KB · thumb 14 KB
- **Appears** Player step figure — dg-1 step 5, all five levels. 6 refs
- **Activity** dg-1 Doorbell Predicts Rewards
- **Must communicate** The pause: nothing is being asked, the dog is allowed to be a dog for a moment
- **Lucy** Standing loose on a slack leash beside the handler, weight even, mouth open and soft, no cue in play
- **Human** Standing side-on, leash hanging in a deep J from a relaxed hand, no treat, no signal
- **Type** Setup (the reset)
- **Alt now** "Lucy stands relaxed on a loose leash beside her handler in a quiet moment between repetitions."
- **Alt better** *(unchanged — accurate)*
- **Flags** Family C. The leash arc is the best-drawn in the library — hold the new set to it
- **Priority** P3

### dg-19 — Release and reset
- **File** `dg-19.jpg` · JPEG · 1100×825 (4:3) · 196 KB · thumb 16 KB
- **Appears** Player step figure — dg-2 step 5 (L1–L7), dg-3 step 6 (all levels). **14 refs**
- **Activity** dg-2 Stay While the Door Opens, dg-3 Doorbell Means Place
- **Must communicate** The stay is formally over and Lucy is invited off the bed
- **Lucy** Stepping **off** the bed, front feet on the floor, hind feet still on it, head up toward the handler — the moment of release
- **Human** Standing or leaning slightly forward, both hands open and low in a welcoming release gesture, relaxed face
- **Type** Correct action (the release)
- **Alt now** "Lucy steps up off her bed as her handler releases her from the stay."
- **Alt better** *(unchanged — accurate)*
- **Flags** Family C. Composition is nearly the mirror of `dg-06`, which means "go to the bed" — two of the most-used images in the app read almost identically and mean opposite things. Fixing `dg-06`'s direction resolves this
- **Priority** P1

### dg-20 — Knocking with the leash under the foot
- **File** `dg-20.jpg` · JPEG · 1100×825 (4:3) · 182 KB · thumb 15 KB
- **Appears** Player step figure — dg-1 L1 step 2. 1 ref
- **Activity** dg-1 Doorbell Predicts Rewards, level 1
- **Must communicate** The handler makes the sound while standing right next to Lucy, hands free because the leash is underfoot
- **Lucy** Standing beside the handler's leg, head up toward the door, alert, not lunging
- **Human** Facing the door frame, **knuckles to the frame mid-knock**, leash running from the ring on her collar down to under the near shoe with a visible loop on the floor
- **Type** Setup / correct technique
- **Alt now** "A handler knocks on the door frame while standing right beside Lucy with the leash under her foot."
- **Alt better** *(unchanged — accurate)*
- **Flags** **The only image that shows the leash-under-foot technique the copy repeatedly names** — and it appears once, at level 1 only, while `dg-02` teaches the same technique wrongly six times. Family C
- **Priority** P3 for style, but its content should be promoted into `dg-02`'s slot

### dg-21 — Guest steps inside and stands still
- **File** `dg-21.jpg` · JPEG · 1100×825 (4:3) · 202 KB · thumb 16 KB
- **Appears** Player step figure — dg-4 L2 step 6. 1 ref
- **Activity** dg-4 Controlled Real Greeting, level 2
- **Must communicate** The guest crosses the threshold and then does nothing at all
- **Lucy** Lying on her bed, head up, watching, feet unmoved
- **Human** Guest just inside the door, **feet together, hands at sides, looking at the handler not the dog**; handler standing between bed and guest, relaxed
- **Type** Correct action
- **Alt now** "A guest stands just inside the open front door without approaching while Lucy stays on her bed."
- **Alt better** *(unchanged — accurate)*
- **Flags** Guest is the second of the two different men. No leash visible although the level runs on leash
- **Priority** P3

### dg-22 — Guest sits down and ignores her
- **File** `dg-22.jpg` · JPEG · 1100×825 (4:3) · 212 KB · thumb 17 KB
- **Appears** Player step figure — dg-4 L3 step 6. 1 ref
- **Activity** dg-4 Controlled Real Greeting, level 3
- **Must communicate** The room carries on and Lucy is not part of it
- **Lucy** Down on her bed a few feet from both people, head up but relaxed, no orientation toward the guest
- **Human** Guest seated in an armchair, body angled away from the dog, hands on the chair arms; handler seated on the sofa, also not attending to Lucy
- **Type** Correct action
- **Alt now** "A guest sits in an armchair ignoring Lucy while she settles on her bed a few feet away."
- **Alt better** *(unchanged — accurate)*
- **Flags** Most complex composition in the library — two seated figures, sofa, armchair, side table, rug, plant, framed picture, doormat, door. The scene that will most test whether the new style can stay uncluttered
- **Priority** P3

### dg-23 — Conversation at the open door
- **File** `dg-23.jpg` · JPEG · 1100×825 (4:3) · 160 KB · thumb 14 KB
- **Appears** Player step figure — dg-2 L7 step 3. 1 ref
- **Activity** dg-2 Stay While the Door Opens, level 7
- **Must communicate** A relaxed twenty-second conversation with nobody, while the stay holds across the room
- **Lucy** Down on her bed well back from the door, head up, holding
- **Human** Leaning easily on the open door with one hand high on the edge, weight on one hip, head turned outside, other hand in a pocket
- **Type** Setup (the rehearsal)
- **Alt now** "A handler holds a relaxed conversation in the open doorway while Lucy stays settled on her bed."
- **Alt better** *(unchanged — accurate)*
- **Flags** Cleanest, emptiest interior in family C. Sets the distance between bed and door better than any other image
- **Priority** P3

### dg-24 — Take the pressure off (Doorbell Predicts Rewards)
- **File** `dg-24.jpg` · JPEG · 1100×825 (4:3) · 175 KB · thumb 13 KB
- **Appears** Activity cover, dg-1 → Today hero (16:7), library card (84px), detail hero (4:3), map rail (56px), Get ready (4:3). Also the "Lucy is too excited" sheet for dg-1 (16:10). 2 refs
- **Activity** dg-1 Doorbell Predicts Rewards
- **Must communicate** Backing off: handler and dog well away from the door, quiet reassurance, nothing being asked
- **Lucy** Sitting, leaning slightly into the handler, calm, taking a treat
- **Human** Crouched beside her, one hand on her shoulder, other offering a treat, body turned away from the door
- **Type** Reward / de-escalation
- **Alt now** *(none — this image has no entry distinct from its cover use; alt reads)* "A handler crouches beside Lucy well back from the closed front door and feeds her a treat."
- **Alt better** "A handler crouches beside Lucy well back from the closed door, one hand on her shoulder, feeding her a treat."
- **Flags** **Fails the cover crops.** Subject sits hard left with the right two-thirds empty hallway; the 56px map thumb and the 84px card land on floorboards and a doormat. As the cover of activity 1, it is the first square a household sees
- **Priority** P2 — recompose for the square crop

### dg-25 — Paying her on the bed
- **File** `dg-25.jpg` · JPEG · 1100×825 (4:3) · 198 KB · thumb 15 KB
- **Appears** Activity cover, dg-2 Stay While the Door Opens → Today hero (16:7), library card (84px), detail hero (4:3), map rail (56px), Get ready (4:3). "Lucy is too excited" sheet for **both** dg-2 and dg-3 (16:10). 3 refs
- **Activity** dg-2 Stay While the Door Opens, dg-3 Doorbell Means Place
- **Must communicate** Reward delivered to the dog **on the bed**, so the bed becomes the paying spot
- **Lucy** Lying on the bed, head forward taking the treat, body unmoved — she is paid for staying, not for coming
- **Human** Kneeling on the floor beside the bed, treat pinched between fingers at Lucy's mouth, pouch at the hip
- **Type** Reward
- **Alt now** "A handler kneels beside Lucy's bed and feeds her a treat for staying in place."
- **Alt better** *(unchanged — accurate)*
- **Flags** The correct picture for `dg-07`'s third beat ("walk back and reward her on the bed") — that step should point here. Coiled leash on the floor is a nice touch that survives to the new style. Same square-crop weakness as dg-24, though less severe
- **Priority** P2

### dg-26 — The guest leaves
- **File** `dg-26.jpg` · JPEG · 1100×825 (4:3) · 225 KB · thumb 17 KB
- **Appears** Player step figure — dg-2 L8 step 5. "Lucy is too excited" sheet for dg-4 (16:10). 2 refs
- **Activity** dg-2 Stay While the Door Opens (L8), dg-4 Controlled Real Greeting (fallback)
- **Must communicate** The session ends calmly: the helper steps back out, Lucy is released and stays settled
- **Lucy** Sitting at the handler's side, on leash, watching the departing guest without rising
- **Human** Handler standing beside her holding the leash short at the collar, pouch at the waist; guest stepping out with a small backward wave
- **Type** Result
- **Alt now** "A guest steps back out of the doorway with a friendly wave while a handler stays beside Lucy."
- **Alt better** *(unchanged — accurate)*
- **Flags** Largest file in the set (225 KB). Doing double duty as an ending image and as a de-escalation image, which are different messages
- **Priority** P3

### cg-01 — Four Paws on the Floor (planned)
- **File** `cg-01.jpg` · JPEG · 1100×825 (4:3) · 152 KB · thumb 15 KB
- **Appears** Activities library, locked "soon" card (84 px thumb only). 1 ref
- **Activity** Planned: Four Paws on the Floor (goal: calm greetings)
- **Must communicate** All four feet stay down while a person stands close
- **Lucy** Standing four-square, head up toward the person, no weight forward, no paw lifted
- **Human** Standing upright and still, hands held together at the waist — deliberately giving the dog nothing to jump at
- **Type** Correct action
- **Alt now** "Lucy stands with all four paws on the floor, looking up at a person who keeps their hands to themselves."
- **Alt better** *(unchanged — accurate)*
- **Flags** Only ever renders at 84 px; the full-frame hallway is wasted. Family C
- **Priority** P4

### sr-01 — Settle on a Mat (planned)
- **File** `sr-01.jpg` · JPEG · 1100×825 (4:3) · 181 KB · thumb 15 KB
- **Appears** Activities library, locked "soon" card (84 px). 1 ref
- **Activity** Planned: Settle on a Mat (goal: settle and recovery)
- **Must communicate** Deep rest while the household carries on
- **Lucy** Flat on her side on the mat, head down, eyes closed or half-closed, fully released
- **Human** Seated and reading, attention entirely elsewhere
- **Type** Result
- **Alt now** "Lucy lies fully relaxed on her mat while the household carries on around her."
- **Alt better** *(unchanged — accurate)*
- **Flags** The busiest background in the whole library — armchair, side table, mug, plant pot, bookcase, two framed pictures, trailing vine, patterned rug. At 84 px it is mush
- **Priority** P4

### wp-01 — People Passing on Walks (planned)
- **File** `wp-01.jpg` · JPEG · 1100×825 (4:3) · 236 KB · thumb 21 KB
- **Appears** Activities library, locked "soon" card (84 px). 1 ref
- **Activity** Planned: People Passing on Walks (goal: walks and public encounters)
- **Must communicate** A stranger passes and Lucy keeps walking with her handler
- **Lucy** Walking at heel, head turned **up to the handler**, not toward the stranger, leash slack
- **Human** Walking beside her looking down at her, leash in a loose J; the stranger walking away in the background, no interaction
- **Type** Correct action
- **Alt now** "Lucy walks on a loose leash looking up at her handler as a stranger passes by on the pavement."
- **Alt better** *(unchanged — accurate)*
- **Flags** Largest file in the library (236 KB). Only outdoor street scene; will need its own background vocabulary in the new style
- **Priority** P4

### fd-01 — Name Response Around Distractions (planned)
- **File** `fd-01.jpg` · JPEG · 1100×825 (4:3) · 223 KB · thumb 19 KB
- **Appears** Activities library, locked "soon" card (84 px). 1 ref
- **Activity** Planned: Name Response Around Distractions (goal: foundation skills)
- **Must communicate** Her name turns her head even with something interesting nearby
- **Lucy** Standing, **head turned back and down to the handler**, ears toward them, the distraction behind her and ignored
- **Human** Crouched behind and to one side, hand low, calm
- **Type** Correct action
- **Alt now** "Lucy turns her head toward her handler at the sound of her name while a distraction sits behind her."
- **Alt better** "Lucy turns her head down toward her crouching handler while a squirrel sits on the grass behind her."
- **Flags** → **She is not looking at the handler** — she looks up and past them, so the picture shows the step failing. **Off-sheet markings**: a white blaze up the muzzle and forehead that appears in no other image
- **Priority** P4 by traffic, but the character break should be fixed whenever it is redrawn

### lucy-portrait — Profile avatar
- **File** `lucy-portrait.jpg` · JPEG · 400×400 (1:1) · 53 KB
- **Appears** Lucy tab profile header, 76 px circle, `object-position: 30% 40%`. Set in `js/config.js` as `DOG.photo`
- **Activity** None — identity
- **Must communicate** This is Lucy
- **Lucy** Head and shoulders, relaxed, recognisably the same dog as the instruction set
- **Human** None
- **Type** Brand
- **Alt now** *(rendered from `DOG` config; not in the `IMAGES` map)*
- **Alt better** "Lucy, a black Labrador and wirehaired pointer mix with a white chest, resting her front paws forward."
- **Flags** **Style D — outlined cartoon sticker with a baked-in green checkmark, a bone icon and a progress ring.** Three of those are UI symbols painted into a photograph slot, and the checkmark is explicitly ruled out by the new style. Circle-cropped at 76 px, so the ring and checkmark are half cut off anyway
- **Priority** Separate track — brand, not instruction

### splash-mark — Launch screen mark
- **File** `splash-mark.jpg` · JPEG · 640×640 (1:1) · 142 KB · plus 12 generated `splash/apple-splash-*.jpg` (1.8 MB)
- **Appears** `index.html` launch screen; source of the 12 iOS splash screens and, by lineage, the app icons in `icons/`
- **Activity** None — identity
- **Must communicate** The app, in one mark
- **Type** Brand
- **Alt now** `alt=""` (decorative — correct)
- **Alt better** *(keep empty)*
- **Flags** Same cartoon badge as `lucy-portrait` at 640 px. Restyling it cascades into 12 splash screens and 4 icon files
- **Priority** Separate track

---

## 6. Pilot: five images for the style test

Chosen to exercise every hard part of the new style once, at the smallest
possible volume: a partial-figure close-up, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room. Between them they
also cover all seven crops and both squares.

**Shared brief for all five — Warm Instructional Vector**

> Contemporary dog-training instruction manual illustration. Simplified
> vector-like forms, crisp edges, restrained detail. Mostly flat colour with
> subtle dimensional shading. Warm cream background. Muted green, teal, blue and
> charcoal palette; coral or red only for warnings. Warm, approachable, premium,
> adult. Consistent side or three-quarter viewing angle. One clearly
> understandable action per image. Minimal background objects. 4:3 landscape,
> 1100 × 825.
>
> No text, lettering, labels, step numbers, checkmarks or X symbols anywhere in
> the image. No photorealism, no painterly texture, no childish cartoon
> treatment, no decorative extras.
>
> **Lucy** — medium-large black Labrador / German Wirehaired Pointer mix. Glossy
> black coat with a slight scruff at the muzzle, white blaze on the chest, white
> toes on all four paws, soft floppy ears. **She wears a flat purple collar with
> a small round blue tag, and no harness — never a harness, in any image.**
> Where a leash is attached it clips to the ring on that collar, at the front of
> her neck. No white on the face. Accurate canine body language; never
> anthropomorphised.
>
> **Handler** — woman in her thirties, dark hair in a ponytail, olive-green
> hoodie, dark navy jeans, grey sneakers, mustard-yellow treat pouch clipped at
> the right hip in every image. Face in profile or turned away.
>
> **Guest** — man in his thirties, blue-grey checked shirt, tan trousers, brown
> boots. One guest, one appearance, across the whole set.
>
> **Props** — flat grey rectangular dog bed, black leash, dark charcoal panelled
> front door with a small window, woven doormat. Nothing else unless the
> individual brief names it.

The equipment lines are the most important thing in that block. A flat collar
with the leash at her neck is how Lucy is actually walked, and twelve of the
thirty put her in a harness instead. The pilot is where that gets settled for the
whole set, which is also why two of the five were chosen for their leashes.

### 6.1 Simple training setup → replaces `dg-02`
The starting position for Doorbell Predicts Rewards, and the correction of the
set's clearest instruction error.

> Interior entry hall, three-quarter view. Lucy sits at the handler's left side
> facing a closed charcoal front door, calm, ears neutral. The handler stands
> beside her in profile, cropped at the shoulders, **the black leash clipped to
> the ring on Lucy's collar, running down and forward to under the near shoe with
> a loose loop of slack on the floor. Both of the handler's hands are empty and
> relaxed.** Mustard treat pouch at the hip.
> Background: the door, the doormat, one baseboard line. Nothing else.

**Tests** — partial-figure cropping, leash-under-foot as a readable technique,
equipment continuity, empty background discipline. **Crops** 4:3 only.

### 6.2 A person handling Lucy's leash → replaces `dg-10`
The hardest thing to draw flat: a slack leash with weight in it, on a dog in
motion.

> Interior entry hall, side view, both figures moving left to right. The handler
> walks toward the open front door; Lucy walks at her side with her shoulder
> level with the handler's knee — **not ahead of it**. The leash clips at the
> ring on her collar and runs up to the handler's near hand, held low and short,
> with a clear J of slack hanging between them — **the line stays clear of her
> back and shoulders.** Lucy's head is up, ears forward, tail level. The guest
> stands still in the open doorway, feet together, hands at his sides, body
> turned slightly away. Background: door, doormat, one wall plane.

**Tests** — leash physics in flat vector, walking gait, three figures in one
horizontal band. **Crops** 4:3 only.

### 6.3 Lucy interacting with another person → replaces `dg-11`
The most instructionally correct image in the current library, and an activity
cover, so it takes both squares.

> Interior entry hall, three-quarter view. Lucy sits square with all four paws
> down, weight back, head level. The guest is **crouched to one side of her,
> palm flat on her chest — not over her head**, eyes soft, shoulders turned
> slightly away. The handler stands just behind Lucy holding the leash in a
> loose loop at hip height; the line runs back to the ring on her collar, passing
> beside Lucy rather than over her. **All three subjects grouped tightly enough that a
> centred square crop contains Lucy's head, the guest's hand and the handler's
> leash hand.** Background: door edge and floor only.

**Tests** — three figures inside a square-safe cluster, greeting body language,
the 16:7 and 56px cover crops. **Crops** 4:3, 16:7, 21:9-adjacent, 84px, 56px.

### 6.4 Correct versus incorrect → **one new image**, paired with 6.3
The library contains no incorrect-behaviour image at all, so this one has to be
made rather than restyled. Pairing it with 6.3 means the pilot renders the same
scene twice and proves the style can hold a character across a pair.

> Same hall, same camera angle, same guest, same handler, same distance as 6.3.
> **Lucy is up on her hind legs with both front paws on the guest's chest**,
> mouth open, ears back, weight thrown forward. The leash is pulled tight in a
> straight line to the handler's hand. The guest leans back, arms raised away
> from her, face turned aside. Everything else in the frame is identical to the
> correct version.
>
> **Coral accent only**: the taut leash line carries the single warning colour.
> No X, no cross, no red circle, no border, no text.

**Tests** — whether an error can be read as an error without any symbol, and
whether coral-as-warning works at this saturation. **Round 1 answered both yes
— see §7.** **Decision this pilot
forces:** the app has no paired-figure component. Either `.step-figure` gains a
two-up variant with HTML labels, or the pair becomes two consecutive steps.
Worth settling on the strength of the pilot rather than in advance.

**Naming** — under the recommended scheme, `door-greet-08-petting` and
`door-greet-08-jumping`.

### 6.5 A more complicated multi-person scene → replaces `dg-01`
The programme cover and welcome panel 1: the most-seen illustration in the app,
and the one carrying the widest crop range.

> Interior entry hall, wide three-quarter view. Lucy sits square on her grey bed
> several feet inside the room, **watching the handler rather than the guest**,
> ears neutral. The handler stands side-on near the bed with the leash slack in
> the low near hand, the line running to the ring on her collar. The guest stands in the open doorway with daylight behind
> him, feet still, hands at his sides. **All three inside a horizontal band
> across the middle 60% of the frame** so the 21:9 and 16:7 crops hold. Reduce
> the background to: the open door with daylight beyond, the doormat, one wall
> plane, and at most one plant. Remove the shelf, the framed picture, the side
> table, the candle and the coat hooks.

**Tests** — three figures at three depths, interior/exterior light against a
warm cream ground, and the most aggressive crop in the app (21:9) alongside the
5:4 welcome panel. **Crops** 4:3, 21:9, 5:4, 16:7.

### What the pilot deliberately leaves out

- Outdoor scenes (`wp-01`, `fd-01`) — a separate background vocabulary, and both
  are P4.
- The brand marks — a different style problem with a 16-file cascade behind it.
- The four-image distance ladder (`dg-13`–`dg-16`) — near-identical by design;
  once one of them works they all will.

---

## 7. Pilot round 1 — results

Five images, one per scene, in `img/pilot/`. Nothing has been cropped, resized,
or installed; no `IMAGES` key points at any of them.

| File | Scene | Delivered | Verdict |
| --- | --- | --- | --- |
| `pilot-1-setup.png` | 6.1 setup | 1448 × 1086 (4:3) | **Keep** |
| `pilot-2-leash.png` | 6.2 loose leash | 1448 × 1086 (4:3) | Re-run — body position |
| `pilot-3-greeting.png` | 6.3 greeting | 1254 × 1254 (square) | Re-run — ratio |
| `pilot-4-jumping.png` | 6.4 jumping | 1254 × 1254 (square) | Re-run — ratio, character |
| `pilot-5-cover.png` | 6.5 cover | 1536 × 1024 (3:2) | Re-run — character, gaze |

### What the style test settled

**The style works.** Flat vector forms, crisp edges, warm cream ground, muted
palette, restrained backgrounds — consistent across all five, and the shared
door / doormat / baseboard vocabulary repeats without drifting.

**No text, and no symbols.** Not a letter, number, checkmark, cross or arrow in
any of the five. The constraint held without a fight.

**A warning reads without a symbol.** Scene 4 was the risky one: whether an
error could be shown as an error using nothing but colour and posture. The taut
coral leash is the only red in the frame and it works. That answers the open
question in §3.6 — the pair does not need a ✓/✗ treatment, and the two-up
component can carry plain HTML labels or none at all.

**Equipment is right in all five** — flat purple collar, leash at the neck, no
harness. They are the first images in the project to match the settled spec.

### What has to be fixed in round 2

- **Ratio.** Scenes 1 and 2 came back at exactly 4:3 and need nothing but a
  resize. Scenes 3 and 4 came back square, and that is not a crop worth making:
  both compositions use the full height, so taking 25% out of it either cuts the
  guest's head or everyone's feet. Scene 5 is 3:2 and trims cleanly from the
  right. **Re-run 3 and 4 at 4:3** — the model held the ratio for 1 and 2, so it
  can.
- **The guest grows a beard in Scene 5.** Clean-shaven in 2, 3 and 4.
- **Lucy is a different dog in Scene 4** — smoother coat, no scruff on the
  muzzle, different head shape. That is the one pair where continuity is the
  whole point, since it is the same scene twice.
- **Scene 2: she is ahead of the handler's knee**, which the brief called out by
  name. As drawn it reads closer to pulling than to walking with.
- **Scene 5: she watches the guest, not the handler** — the same fault the
  current `dg-01` has, reproduced in its replacement.
- **The blue tag is missing.** All five show a bare purple collar; the eighteen
  existing collar images carry a small round blue tag, and it is in the original
  character sheet. Either add it to the block or drop it from the spec, but not
  one of each.

### Not yet answered

Neither square crop nor cover behaviour has been tested, because the two cover
candidates (Scenes 3 and 5) are the two that need re-running. Until an approved
cover exists at 4:3, the 16:7 Today band and the 56px map thumb from §2 are
still unproven — and they are the constraint most likely to send an image back.

---

## 8. What has to be decided before production

1. ~~**Harness or collar.**~~ **Settled: a flat purple collar with a round blue
   tag, no harness, leash clipped to the collar ring at her neck.** Carried into
   the shared character block in §6. Eighteen of the thirty already comply;
   dg-01 – dg-12 are the ones that have to change.
2. **Splitting the overloaded images.** `dg-07` → 3, `dg-09` → 3, `dg-03` → 2.
   That is +6 illustrations and edits to `content.js`. Alternatively, repoint
   the reward step at `dg-25`, which needs no new art.
3. **The correct/incorrect pair** needs a component decision (§6.4).
4. **Renaming** — do it during the restyle or not at all; it touches
   `content.js`, `sw.js` and this document.
5. **Source PNGs in git** — 65 MB today, and the restyle will add a second set.
