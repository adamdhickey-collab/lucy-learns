# Pilot prompts — Warm Instructional Vector

Ready to paste into ChatGPT. Five images, chosen in
[illustration-audit.md §6](illustration-audit.md) to exercise every hard part of
the new style once: a partial-figure setup, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room.

**Rounds 1 and 2 are done.** Round 2 landed every fix and cleared the crop
tests; three of its five images are approved. Results are in
[§7 of the audit](illustration-audit.md), and the two follow-ups are in
[Round 3](#round-3--two-follow-ups) at the bottom of this file.

The five scene prompts below are the full briefs, kept current rather than
versioned — use them if a scene has to be generated from scratch again. For the
two images that need a touch-up, use Round 3 instead: those are edits, and
re-pasting a full brief will redraw the whole scene.

Nothing has been installed; no `IMAGES` key points at any pilot image.

---

## What changed since round 1

Round 1 settled the things that mattered most: the style holds, no text or
symbol appeared in any of the five, and the taut coral leash in Scene 4 proved
an error can read as an error without a checkmark or an X. Six things need
fixing, and they are folded into the prompts below.

| Fix | Affects |
| --- | --- |
| **Add the round blue tag** on the collar | all five |
| **Return 4:3 landscape, not square** | Scenes 3, 4 |
| **Same dog as the paired image** — scruffy muzzle, same head | Scene 4 |
| **Guest is clean-shaven**, no beard | Scene 5 |
| **Lucy's shoulder level with the knee**, not ahead of it | Scene 2 |
| **Lucy watches the handler**, not the guest | Scene 5 |

**All five get re-run, including Scene 1.** Scene 1 was otherwise a keeper —
correct equipment, exact 4:3, hands free, leash under the foot — but the tag has
to be in every frame or in none, and a set where one image is missing it is the
same continuity break this whole exercise exists to close. It is the cheapest
scene to re-run, and the round 1 version stays as the style reference.

---

## How to run it

**One image per message.** Paste **Block A + Block B + one Scene**. A and B never
change — that is what makes five images look like one set.

**Order matters:**

1. **Always attach an approved image**, from `img/pilot/approved/`. Every prompt
   `pilot.mjs` copies now opens with *"Match this attached image exactly for
   style, palette and the dog's appearance — same dog, same woman, same room"*,
   so there is nothing to type; there just has to be something attached for it
   to refer to. Pick the nearest scene: the same room and the same distance beat
   the same activity.
2. That attachment is the strongest lever on consistency in the whole loop.
   Scene 6 took two attempts and Lucy came back right in both — the failure was
   the human's pose, twice. Character drift, which dogged rounds 1 and 2, has
   not recurred since the reference became routine.
3. **Scene 4 must follow Scene 3 in the same conversation**, with the approved
   Scene 3 attached. It is the same room, camera, cast and distance — only
   Lucy's behaviour and the guest's reaction change. Round 1 generated it
   loosely and came back with a visibly different dog.

**About the aspect ratio.** Round 1 returned three different shapes from the same
instruction: exact 4:3 for Scenes 1 and 2, square for 3 and 4, 3:2 for 5. Say it
twice — it is in Block A and again at the end of every scene. A square image is a
reject, not a crop job: these compositions use the full height, so removing 25%
of it takes either the guest's head or everyone's feet.

If what comes back is 3:2 (1536 × 1024) rather than 4:3, that is fine — every
scene is composed so everything essential sits inside the middle 4:3. Trim the
sides and resize:

```bash
sips -c 1024 1365 raw.png --out cropped.png && sips -Z 1100 -s format jpeg -s formatOptions 72 cropped.png --out pilot-1.jpg
```

**Reject and regenerate if:** any letter, number, word, checkmark, cross or
arrow appears; Lucy is wearing a harness; the collar has no blue tag; the leash
runs over her back; there is white on her face; the background gains furniture
nobody asked for; the image comes back square rather than landscape; it comes
back as two panels; **or a raised hand is touching a door, wall or surface
instead of gesturing in open air** — round 4 put a stay signal flat against the
door panel, which reads as holding the door shut; **or a reward image comes back
with no visible treat.** That last one is not hypothetical: it is the §5 defect
recorded against `dg-12`, and Scene 23 reproduced it on the first attempt with a
closed hand at Lucy's muzzle. A hand near the mouth is not a treat. If the step
pays her, the food has to be in the frame and separate from the fingers.

---

## Block A — Style

> Contemporary dog-training instruction manual illustration. Simplified,
> vector-like forms with crisp clean edges and restrained detail. Mostly flat
> colour with subtle dimensional shading — soft minimal gradients only where
> they describe form. Warm cream background. Muted palette: sage and forest
> green, teal, dusty blue, charcoal, warm neutral oak. Coral or red appears only
> to flag a warning and never otherwise. Even, directionless light with no cast
> shadows beyond a soft contact shadow under feet and furniture. Side or
> three-quarter view at standing eye level. One clearly understandable action
> per image. Minimal background — only the objects the scene names. Warm,
> approachable, premium, adult.
>
> **Landscape orientation, 4:3 — clearly wider than it is tall. Do not return a
> square image.**
>
> No text, letters, numbers, labels, captions, watermarks, logos or interface
> elements anywhere in the image. No checkmarks, crosses, X marks, arrows,
> circles or any instructional symbol. No photorealism. No painterly or
> watercolour texture, no visible brush strokes, no grain. No childish or cutesy
> cartoon styling, no oversized eyes, no anthropomorphism. No decorative
> flourishes, no patterned wallpaper, no clutter, no extra furniture, plants,
> pictures or props beyond those named. No borders, no frames, no split panels —
> one single scene.

## Block B — Cast

> **Lucy** is a medium-large adult black dog, a Labrador and German Wirehaired
> Pointer mix: glossy black coat, a **slightly scruffy muzzle and eyebrows**,
> soft floppy ears, a white blaze on her chest, white toes on all four paws, and
> no white anywhere on her face. The scruff on her muzzle is what makes her
> recognisable — she is never smooth-faced.
>
> She wears **a flat purple collar with a small round blue tag hanging from the
> ring, and no harness — never a harness, in any image, ever.** The tag is
> visible in every image. When a leash is attached it clips to the metal ring on
> the collar, at the front of her neck under her chin.
>
> She is an adult dog with accurate, real canine body language — never
> anthropomorphised, never given human expressions.
>
> **The handler** is a woman in her thirties with dark brown hair in a ponytail,
> an olive-green hoodie, dark navy jeans, grey sneakers, and a mustard-yellow
> treat pouch clipped at her right hip. Her face is in profile or turned away.
> Calm, unhurried, upright.
>
> **The guest** is a man in his thirties with short brown hair, **clean-shaven,
> no beard and no stubble**, a blue-grey checked shirt, tan trousers and brown
> boots. Relaxed, hands at his sides, never leaning over the dog. The same man,
> with the same face, in every image.
>
> **Props, only where a scene names them:** **her bed — a rectangular grey
> mattress-style dog bed, deep and clearly cushioned, roughly a hand's depth,
> with a piped edge and soft quilting on the top surface. It is a mattress, not
> a thin mat, and it is the same bed in every image** — a black leash, a charcoal
> panelled front door with a small window, a woven doormat, pale warm oak
> floorboards, cream walls with a white baseboard.

---

## Scene 1 — Setup at the door
*Replaces `dg-02`. Round 1: correct in every respect except the missing tag.
Attach `pilot-1-setup.png` and change only that.*

> Interior entry hall, three-quarter view. Lucy sits at the handler's left side
> facing a closed charcoal front door, calm, ears neutral, weight settled. **A
> small round blue tag hangs from the ring on her purple collar.**
>
> The handler stands beside her in profile, **cropped by the top of the frame at
> the shoulders** so only her body from the shoulders down is visible. The black
> leash is clipped to the ring on Lucy's collar and runs down and forward to
> **under the handler's near shoe**, with a loose loop of slack lying on the
> floor. **Both of the handler's hands are empty, open and relaxed at her
> sides.** The mustard treat pouch is clipped at her hip.
>
> Background: the closed door, the woven doormat, one baseboard line, oak floor.
> Nothing else in the room.
>
> The single thing this image must make obvious: the leash is trapped under the
> foot and both hands are free.
>
> Landscape 4:3, wider than tall.

## Scene 2 — Walking her over on a loose leash
*Replaces `dg-10`. Round 1 came back at the right ratio but with Lucy ahead of
the handler, which reads as pulling.*

> Interior entry hall, side view, handler and dog both moving left to right
> toward an open front door.
>
> **Lucy's shoulder is level with the handler's knee — she is beside the
> handler, never ahead of her. Her nose must not be further forward than the
> handler's leading foot.** Head up, ears forward, tail level, relaxed gait. A
> small round blue tag hangs from her purple collar.
>
> The black leash clips to the ring on her collar and runs up to the handler's
> near hand, held low and short, with a **deep, obvious J of slack** hanging
> between them — the line is visibly loose, not straight. It stays clear of her
> back and shoulders.
>
> The handler walks in profile, near arm low with the leash, far arm relaxed.
> The clean-shaven guest stands still in the open doorway, feet together, hands
> at his sides, body turned slightly away from the dog, daylight behind him.
>
> Background: the open door with pale daylight beyond, the doormat, one wall
> plane. Nothing else.
>
> The single thing this image must make obvious: the leash is slack and she is
> walking *with* the handler, not out in front of her.
>
> Landscape 4:3, wider than tall.

## Scene 3 — The calm greeting
*Replaces `dg-11`. Round 1's composition was right; it came back square. Also an
activity cover, so it takes both the wide band and the square crop.*

> Interior entry hall, three-quarter view. Lucy sits square with **all four paws
> on the floor**, weight settled back, head level, calm and still. A small round
> blue tag hangs from her purple collar.
>
> The clean-shaven guest is **crouched down to one side of her**, at her level,
> with his open palm flat on her chest — **not over her head**. His eyes are soft
> and his shoulders are turned slightly away from her. The handler stands just
> behind Lucy holding the leash in a loose loop at hip height; the line runs back
> to the ring on Lucy's collar, passing beside her rather than over her.
>
> **Composition: group all three subjects tightly together, centred, so that a
> square crop taken from the middle of the frame still contains Lucy's head, the
> guest's hand on her chest, and the handler's hand on the leash.** Keep them
> within the central horizontal band of the picture, with clear space above and
> below.
>
> Background: the edge of the door and the floor only. Nothing else.
>
> The single thing this image must make obvious: four paws down, and a hand on
> the chest rather than over the head.
>
> **Landscape 4:3, clearly wider than tall. Not square.**

## Scene 4 — The same greeting going wrong
*New image. Generate immediately after Scene 3, in the same conversation, with
the approved Scene 3 attached. Round 1 came back square and with a visibly
different dog — smooth-faced, wrong head shape.*

> Same room, same camera angle, same distance, same two people, same clothing,
> same lighting as the previous image. **The dog is the same dog: same scruffy
> muzzle and eyebrows, same head shape, same purple collar with the round blue
> tag.** Everything in the frame is identical except Lucy and the guest's
> reaction.
>
> **Lucy is up on her hind legs with both front paws planted on the guest's
> chest**, mouth open, ears back, weight thrown forward, front feet clearly off
> the floor. The black leash — still clipped to the ring on her collar — is
> **pulled tight in a straight line** from her neck to the handler's hand.
>
> The guest leans back away from her, both arms raised out to the sides and away
> from the dog, face turned aside. The handler's arm is extended, taking the
> weight of the tight leash.
>
> **The taut leash is the only coral or red element in the image.** Everything
> else keeps the standard palette.
>
> No X, no cross, no red circle, no border, no warning symbol, no text of any
> kind.
>
> The single thing this image must make obvious: this is the same greeting as
> before, and it has gone wrong.
>
> **Landscape 4:3, clearly wider than tall. Not square. It must match the
> previous image's framing exactly.**

## Scene 5 — Guest at the door, Lucy holding her bed
*Replaces `dg-01`. The programme cover and the first illustration anyone sees.
Round 1 gave the guest a beard and had Lucy watching him instead of the
handler — the same fault the image it replaces has.*

> Interior entry hall, wide three-quarter view, three subjects at three depths.
>
> Lucy sits square on a flat grey rectangular dog bed several feet inside the
> room, **her head turned toward the handler on her left, looking at her and not
> at the man in the doorway.** Ears neutral, calm. A small round blue tag hangs
> from her purple collar.
>
> The handler stands side-on near the bed with the leash slack in her low near
> hand, the line running to the ring on Lucy's collar. The guest — **clean-shaven,
> no beard** — stands in the open doorway with pale daylight behind him, feet
> still, hands at his sides, not leaning in.
>
> **Composition: place all three inside a horizontal band across the middle 60%
> of the frame**, with clear empty cream wall above and clear oak floor below, so
> the image can be cropped to a very wide letterbox without losing anyone.
>
> Background, and nothing more than this: the open front door with daylight
> beyond, the woven doormat, one wall plane, and at most one simple potted plant.
> No shelf, no framed picture, no side table, no candle, no coat hooks.
>
> The single thing this image must make obvious: a guest has arrived, Lucy is
> checking in with her handler, and nothing has gone wrong.
>
> Landscape 4:3, wider than tall.

---

## Round 3 — two follow-ups

**Done, and the pilot is closed.** 3A was kept and 3B reverted; 3C was never
run, because 3B showed what a second edit costs. The five approved images are in
`img/pilot/approved/`, and the results are in
[§7.3 of the audit](illustration-audit.md).

The prompts below are kept as the record of how the edits were written, and as
the pattern for any future one — attach the file, name one change, say nothing
else. The caveat worth carrying forward: **an edit changes more than the thing
it names.** 3A came back with the change and nothing else. 3B came back with the
change plus a resized dog and a lost walking gait, which was worse than the
problem it fixed. An image that is 90% right is usually finished.

These are **edits, not fresh generations.** Attach the round 2 file, paste the
prompt, and change nothing else. Block A and Block B still apply — but say so
rather than re-pasting them, or the model will redraw the whole scene.

### 3A — `door-cover`: give her the scruffy muzzle back

*Attach `img/pilot/round-2/door-cover.png`, and also
`img/pilot/round-2/door-sound-01-setup.png` as the reference for her head.*

> Keep this image exactly as it is — same composition, same camera, same three
> figures in the same positions, same collar and blue tag, same slack leash,
> same background.
>
> Change one thing: **the dog's muzzle.** She is drawn here with a smooth
> Labrador face, and she should have the slightly scruffy, wiry muzzle and
> eyebrows she has in the second attached image. Same head shape, same wiry
> texture around the mouth and brows. She is a Labrador and German Wirehaired
> Pointer mix, and the scruff is what makes her recognisable.
>
> While you are there, warm the floor down slightly: the oak is more saturated
> and orange here than in the other images in the set. Match the paler honey oak
> of the attached reference.
>
> Nothing else changes. No text, no symbols. Landscape 4:3, 1448 × 1086.

### 3B — `door-greet-07-approach`: bring her forward, clear of the legs

*Attach `img/pilot/round-2/door-greet-07-approach.png`.*

> Keep this image exactly as it is — same composition, same camera, same room,
> same handler and guest, same collar and blue tag, same J of slack in the leash.
>
> Change one thing: **move the dog forward, so she is clear of the handler's
> legs.** She currently trails behind the handler and overlaps her dark navy
> jeans, which hides the white blaze on her chest and makes her hard to read
> against the trousers. Her shoulder should sit **level with the handler's
> knee** — beside her, not behind her and not ahead of her — with clear space
> between the dog's body and the handler's leg so her whole silhouette and the
> white chest blaze are visible against the wall and floor.
>
> She is still walking calmly at the handler's side. Her nose must not go further
> forward than the handler's leading foot.
>
> Nothing else changes. No text, no symbols. Landscape 4:3, 1448 × 1086.

### 3C — `door-greet-08-petting`: optional, for the Today crop

The image is approved as it stands. This only matters if you would rather the
guest kept his head on the Today screen, which letterboxes this cover to a
horizontal band across the middle of the frame and currently cuts him off at the
jaw. Everything instructional survives the crop either way.

*Attach `img/pilot/round-2/door-greet-08-petting.png`.*

> Keep this image exactly as it is — same composition, same camera, same figures,
> same collar and blue tag, same hand on the chest, same leash.
>
> Change one thing: **lower the crouching man so his whole head fits inside the
> middle of the frame.** Crouch him deeper, so the top of his head sits at about
> the same height as the dog's ears rather than near the top edge. The dog, the
> handler and the hand on the chest all stay exactly where they are.
>
> Nothing else changes. No text, no symbols. Landscape 4:3, 1448 × 1086.

### Checking the result

Same reject list as before, plus: if the model has redrawn the scene rather than
edited it — different camera, different furniture, a moved figure — discard it
and try again with a shorter prompt. An edit that changes two things is a
regeneration wearing a disguise.

---

## Scene 6 — Cue the stay

*New. Fills `door-stay-02-cue`, which currently renders `dg-07` as a stand-in.
Attach an approved image as the style reference — `door-sound-01-setup.png` is
the cleanest.*

> Interior entry hall, three-quarter view. Lucy lies on her flat grey bed a few
> feet inside the room, **front legs extended, head up and eyes locked on the
> handler** — holding a position, not resting. A small round blue tag hangs from
> her purple collar.
>
> The handler stands **right beside the bed, one stride away from Lucy at most**,
> side-on to camera. **Her head is turned down and she is looking directly at
> Lucy.** One flat open palm is raised at chest height as a stay signal,
> **held in open air and aimed at the dog**.
>
> **Her hand must not touch or rest against the door, the wall, or any other
> surface — nothing near it. She is nowhere near the door.** The closed charcoal
> front door is small in the background on the far side of the room, several
> paces behind her, and she has not moved toward it.
>
> Her weight is even and her other arm hangs relaxed at her side. This is the
> instant before she goes anywhere.
>
> Background: the distant closed door, the woven doormat, one wall plane, oak
> floor. Nothing else.
>
> The single thing this image must make obvious: the signal has just been given,
> the handler is still standing over her dog, and neither of them has moved.
>
> Landscape 4:3, wider than tall.

## Scene 7 — Leash on, settled on the bed

*New. Fills `door-greet-01-settle`, which currently renders `dg-09` as a
stand-in. This is the step whose instruction is "Leash Lucy and settle her on her
bed" — the image it replaces has neither a handler nor a leash in it.*

> Interior entry hall, three-quarter view. Lucy is settling onto her flat grey
> bed, well back from a **closed** charcoal front door. **No guest, and nothing
> visible outside.** A small round blue tag hangs from her purple collar.
>
> The handler crouches beside the bed with **the leash clipped to the ring on
> the collar**, the line falling slack from her hand to the floor. Her other hand
> rests lightly on Lucy's shoulder, guiding her down. Mustard treat pouch at her
> hip.
>
> This is the quiet setup before anything happens: no bell, no visitor, nobody at
> the door.
>
> Background: the closed door, the doormat, one wall plane, oak floor. Nothing
> else.
>
> The single thing this image must make obvious: the leash is on and she is being
> settled, before the session starts.
>
> Landscape 4:3, wider than tall.

## Scene 8 — The doorbell

*New. Fills `door-sound-02-bell`, six references, currently rendering the old
diptych as a stand-in. Attach `door-stay-02-cue.png` or any approved image.*

> Exterior view of a closed charcoal panelled front door with a small
> four-pane window, seen straight on from the porch. **A hand and forearm enter
> from the right edge of the frame, one finger pressing a round doorbell button
> mounted on the door frame.** The press is the whole action.
>
> Through the door's window, **Lucy is visible inside**: head and shoulders
> only, head up, ears forward, alert to the sound. A small round blue tag hangs
> from her purple collar.
>
> The sleeve on the forearm is **plain and unbranded — not the guest's checked
> shirt.** This hand is sometimes a helper and sometimes the guest, and it has
> to work for both.
>
> Background: the door, its frame, the woven doormat below, and a plain porch
> wall. No garden, no view, no plants.
>
> The single thing this image must make obvious: the bell is being pressed, and
> she has heard it.
>
> Landscape 4:3, wider than tall. One single scene — **not two panels.**

## Scene 9 — The knock

*New. Fills `door-sound-02-knock`, one reference. Generate straight after Scene
8 in the same conversation, with the approved Scene 8 attached — these two are a
matched pair and should differ only in the hand.*

> Same door, same camera, same distance, same light, same window and doormat as
> the previous image. Lucy is visible through the window in the same position,
> head up, ears forward.
>
> Change one thing: **the hand is knocking instead of pressing the bell** —
> knuckles against the door panel, mid-knock, wrist relaxed. The doorbell button
> is still on the frame, untouched.
>
> The sleeve stays plain and unbranded.
>
> The single thing this image must make obvious: the door is being knocked on.
>
> Landscape 4:3, wider than tall. One single scene — **not two panels.**

### Landing these two

They are the only images in the app whose alt text and picture disagree, and
that resolves the moment they exist:

```bash
node scripts/pilot.mjs add door-stay-02-cue
```

Then point the key at the real file in `js/content.js` — `src: 'img/dg-07.jpg'`
becomes `src: 'img/door-stay-02-cue.jpg'` — resize to 1100px, build the thumb,
and add both filenames to the precache list in `sw.js`.

---

# The restyle proper

Twenty-nine keys are still painted. Four of them already have approved art
waiting — `dg-01`, `dg-02`, `dg-10` and `dg-11` — so **twenty-five need
drawing.**

## Why this goes activity by activity

The obvious order is by reference count, biggest first. It is the wrong one.
While the library is half-restyled every session is a mix, and a household
notices that inside a five-minute run far more than it notices one image being
newer than another. So the unit is the **activity**: finish every picture one
activity touches, install them together, and that whole session is consistent
even while the rest of the app is not.

| Batch | Activity | To draw | Already approved |
| --- | --- | --- | --- |
| **1** | dg-1 Doorbell Predicts Rewards | 6 | `dg-02` |
| 2 | dg-4 Controlled Real Greeting | 6 | `dg-10`, `dg-11` |
| 3 | dg-3 Doorbell Means Place | 4 new, 3 shared with batches 1–2 | — |
| 4 | dg-2 Stay While the Door Opens | 11 | — |
| 5 | Covers and the four planned | 4 | `dg-01` |

dg-1 goes first because it is the smallest complete session and the one every
household runs on day one. dg-2 goes last because it is the largest and because
four of its eleven are the distance ladder, which is four versions of one
composition and best drawn in a single sitting once the room is settled.

**Each of these is a fix, not just a restyle.** Every brief below carries the
defect §5 recorded against the image it replaces. Redrawing them in the new
style without correcting what they say would be a waste of twenty-five rounds.

---

## Batch 1 — dg-1 Doorbell Predicts Rewards

Six images. With `door-sound-01-setup` already approved and the bell and knock
already live, these complete the activity.

**The leash is in every one of these.** The first draft of these briefs named it
only in Scenes 10 and 13, and the first generation of Scene 11 came back with
Lucy wearing nothing but her collar — correctly, since nothing had asked for a
leash. But `dg-1` lists "Lucy on leash" as equipment, the approved step-1 setup
trails it under the handler's shoe, and Scene 10 makes the leash-under-foot the
entire subject. Run the five steps in order with the leash named in only two of
them and it appears, vanishes for two steps, and comes back. A household notices
that inside a five-minute session; it is the exact inconsistency batching by
activity exists to prevent. So every brief below states where the leash is, even
when it is doing nothing.

### Scene 10 — You make the sound
*Replaces `dg-20`, 9 references — the most-used image in the batch, and the only
one in the library that shows the leash-under-foot technique the copy keeps
naming. It also sits on welcome panel 2.*

> Interior entry hall, three-quarter view. Lucy stands beside the handler's leg
> facing a closed charcoal front door, head up, ears forward, alert but not
> lunging. A small round blue tag hangs from her purple collar.
>
> The handler stands next to her in profile, **knuckles to the door frame
> mid-knock**, the other arm relaxed. **The leash runs from her collar down to
> under the handler's near shoe, with a visible loop of slack on the floor** —
> that detail is the whole reason this image exists, so it must be unmistakable.
>
> Background: the closed door, the doormat, one baseboard line. Nothing else.
>
> The single thing this image must make obvious: she is making the sound herself,
> standing right beside the dog, hands free because the leash is underfoot.
>
> Landscape 4:3, wider than tall.

### Scene 11 — Say her name
*Replaces `dg-04`, 8 references. **The fix:** the current one already has treats
in an open palm, which is the next step's job — it skips the beat it exists to
show.*

> Interior entry hall, three-quarter view. Lucy sits near the closed front door
> and **turns her head fully away from the door to look up at the handler** —
> the turn is the entire subject of the picture. Mouth relaxed, ears soft. The
> black leash is clipped to her collar and lies slack across the floor.
>
> The handler crouches side-on at her level, face toward her, **both hands empty
> and at rest.** No treat, no pouch in her hand, nothing being offered — the
> payment comes one step later and must not appear here.
>
> Background: the closed door, the doormat, one wall plane. Nothing else.
>
> The single thing this image must make obvious: her name was said and she looked
> away from the door.
>
> Landscape 4:3, wider than tall.

### Scene 12 — Two treats, straight away
*Replaces `dg-17`, 5 references. This is the payment, and it is where the treats
belong.*

> Interior entry hall, close three-quarter view. Lucy stands or sits facing the
> handler, head forward, taking food from an open hand, body loose and easy. The
> black leash is clipped to her collar and lies slack across the floor.
>
> The handler crouches at her level with a **flat open palm holding two small
> treats, clearly two and clearly visible**, the mustard pouch at her hip and her
> other hand at rest.
>
> Background: the closed door, one wall plane, oak floor. Nothing else.
>
> The single thing this image must make obvious: two treats, arriving
> immediately.
>
> Landscape 4:3, wider than tall.

### Scene 13 — The pause between reps
*Replaces `dg-18`, 5 references. The current one has the best-drawn leash arc in
the whole library — match it.*

> Interior entry hall, side view. Lucy stands loose and easy beside the handler
> on a slack leash, weight even on all four feet, mouth open and soft. **Nothing
> is being asked of her** — no cue, no treat, no hand signal.
>
> The handler stands side-on, **the leash hanging from a relaxed hand in a deep,
> obvious J**, looking down at her without instructing. Both of them are simply
> waiting.
>
> Background: the closed door, the doormat, one wall plane, her empty bed at the
> edge of frame. Nothing else.
>
> The single thing this image must make obvious: the rep is over and nothing is
> happening.
>
> Landscape 4:3, wider than tall.

### Scene 14 — Called from another room
*Replaces `dg-05`, 2 references. **The fix:** in the current one Lucy faces the
door, away from the handler — it shows the step failing.*

> Interior entry hall opening onto a hallway, three-quarter view. Lucy sits on
> her flat grey bed near the closed front door and **turns her head back over her
> shoulder, toward the handler and away from the door.** That turn is the whole
> subject. The black leash is clipped to her collar and **trails loose along the
> floor behind her** — nobody is holding it, because the handler is a room away.
>
> The handler stands well back — a doorway or hall away, small in the frame,
> side-on — with one hand raised in a small beckon, calm and unhurried.
>
> **Keep Lucy large enough to read.** The current version is so wide that she is
> a small dark shape; she should still be a clear, recognisable dog with her head
> turn legible on a phone.
>
> Background: the closed door, her bed, one wall plane, the hall opening.
> Nothing else — no kitchen, no furniture.
>
> The single thing this image must make obvious: she heard her name from far away
> and turned toward it.
>
> Landscape 4:3, wider than tall.

### Scene 15 — Take the pressure off
*Replaces `dg-24`, 2 references — but it is the **activity cover**, so it takes
the 16:7 Today band and the 84px and 56px squares. **The fix:** the current one
puts Lucy hard left with two-thirds empty hallway, so the square thumb lands on
floorboards.*

> Interior entry hall, three-quarter view, **well back from a closed front door**.
> Lucy sits leaning slightly into the handler, calm and settled, taking a treat.
> A small round blue tag hangs from her purple collar. The black leash is clipped
> to her collar and lies slack on the floor, **kept low and out of the middle of
> the frame** — see the composition note below.
>
> The handler crouches beside her, **one hand resting on Lucy's shoulder and the
> other offering a treat**, her body turned away from the door. This is a step
> back from the pressure, not a repetition.
>
> **Composition, and this matters more than anything else in the brief: put the
> two of them together in the centre of the frame, inside the middle horizontal
> band, with clear space above and below.** A square crop taken from the middle
> must contain Lucy's head, the hand on her shoulder and the treat. Do not push
> them to one side and leave the rest of the room empty.
>
> Background: the closed door small in the background, the doormat, one wall
> plane. Nothing else.
>
> The single thing this image must make obvious: nothing is being asked, and she
> is being reassured well away from the door.
>
> Landscape 4:3, wider than tall.

### Batch 1 is done — installed at 1.52.0

All six shipped together with `door-sound-01-setup`, and Doorbell Predicts
Rewards is the first activity a household can run start to finish in one style.
Eight keys retired: `dg-01`, `dg-02`, `dg-04`, `dg-05`, `dg-17`, `dg-18`,
`dg-20`, `dg-24`.

**`dg-01` came along, and that was not optional.** Welcome panel 2 had been
holding `dg-20` deliberately, in the old style, so that it matched panel 1's
`dg-01` — see the comment in `js/views/welcome.js`. Repointing panel 2 alone
would have put the restyle one swipe after an old-style panel on the first
screen a household ever sees. Panel 1 had approved art waiting as `door-cover`,
so both moved in the same release and the welcome stayed internally consistent.
**Every batch from here needs the same question asked before it lands: what
else is on screen beside these, and does it move too?**

Two things worth carrying forward to batch 2:

- **Name the leash in every brief, including the ones it is doing nothing in.**
  §7 has the long version. It cost a full sitting of five generations.
- **The two treats are legible at native size and blur to one smudge at 1x.**
  They resolve on any retina phone, and the step copy says "two" regardless, so
  this was accepted rather than redrawn. If a future scene hangs its whole
  meaning on a detail that small, draw it bigger instead.

---

## Batch 2 — dg-4 Controlled Real Greeting

Six to draw, one to install, and one question the batch plan did not ask.

Three of this activity's pictures are already new and live — `door-greet-01-settle`
(step 1), `door-sound-02-bell` (step 2, from batch 1's neighbours) and the
`door-greet-08-petting` / `door-greet-08-jumping` pair at step 8. A fourth,
`door-greet-07-approach`, has been approved since round 3 and never wired up; it
replaces `dg-10` at step 7 and needs no new art, only installing. Do that in the
same PR — it is the batch-1 lesson applied: `door-sound-01-setup` had been
sitting approved and uninstalled too, and shipping five around it would have
left step 1 of that activity in the old style.

### Before anything is drawn: what else is on screen?

Batch 1 nearly shipped a new-style welcome panel next to an old-style one. Run
the same check here, and it turns up two things.

**`dg-06` is not really a dg-4 image.** It has twenty-two references across
dg-2, dg-3 and dg-4, and it is dg-3's activity cover. Drawing it here is
correct — dg-4 cannot be finished without it — but it means batch 3 inherits its
own cover from this batch, and it means this one picture has to survive the 16:7
band and the 56px square as well as the 4:3 step frame. It is briefed as a cover,
not as a step.

**`dg-11` is the dg-4 cover, and the approved art cannot take the job.** §7.2
tested `door-greet-08-petting` at 16:7 and the guest loses his head; it called
that a judgement call and offered a one-line `object-position` change. That was
the right call for a *step* image doing double duty. It is the wrong one now,
because the alternative has changed: batch 1 showed that a cover drawn to an
explicit composition constraint passes all three crops on the first try, and
that a cover left to compose itself puts the 56px thumb on floorboards. So this
batch draws a purpose-made dg-4 cover — Scene 22 — rather than accepting a
decapitated guest on the Today hero. **If you would rather not spend the
generation, drop Scene 22 and point `coverImage` at `door-greet-08-petting`; the
cropped guest is survivable and everything instructional stays in the band.**

| Scene | Replaces | Refs | Save as |
| --- | --- | --- | --- |
| 16 | `dg-06` | 22 | `door-place-03-send` |
| 17 | `dg-09` | 7 | `door-greet-04-open` |
| 18 | `dg-12` | 6 | `door-greet-05-reward` |
| 19 | `dg-21` | 7 | `door-greet-06-enter` |
| 20 | `dg-22` | 1 | `door-greet-06-seated` |
| 21 | `dg-26` | 2 | `door-greet-09-leaves` |
| 22 | `dg-11` as cover | 4 | `door-greet-cover` |

Attach `door-sound-cover.png` or `door-greet-08-petting.png` — both are approved,
both have the guest or the handler at Lucy's level, and the second one has the
guest's face, which four of these scenes need.

**The leash is named in every brief**, including the ones where it does nothing.
See the batch 1 note above for what skipping that cost.

**Her bed is now pinned in Block B, for the same reason.** It used to read "a
flat grey rectangular dog bed", and "flat" was doing damage: scenes 17–20 came
back with a deep quilted mattress, `door-place-03-send` came back twice with a
thin mat, and batch 1's `door-sound-03-name-distant` is a thin mat too. Steps 3
and 4 of this activity are adjacent, so the bed changed shape mid-session. Block
B now describes the mattress the majority of the library already draws — deep,
piped, quilted. Two images are on the wrong side of that line and are listed
under "known drift" below.

### Scene 16 — Send her to her bed
*Replaces `dg-06`, 22 references — the second most-used image in the app, and
dg-3's activity cover, so it takes the 16:7 band and the 56px square too.
**The fix:** the direction is backwards. The current one has Lucy already
standing on the bed, facing off it, walking toward the pointing hand — a viewer
reads "come off the bed", which is the opposite instruction. It also has no door
anywhere in frame, though every step that uses it is about the door.*

> Interior entry hall, side view. Lucy is **mid-stride onto her flat grey bed,
> her front feet landing on it and her hind feet still on the floorboards**, head
> and body aimed at the bed, tail level. She is arriving, not leaving — **every
> line of her points at the bed and away from the handler.**
>
> The handler is **behind her line of travel**, side-on, one arm extended
> pointing at the bed. **The pointing hand must be clearly upstream of the dog —
> behind her, not in front of her** — so that nothing in the picture invites her
> back off the bed.
>
> The black leash is clipped to her collar and swings slack between them.
>
> Background: the closed charcoal front door behind the handler, the doormat, one
> wall plane, the bed. Nothing else. The door must be in frame — every step that
> uses this picture is about the door.
>
> **Composition, and this matters as much as the action: this is an activity
> cover as well as a step. Put Lucy, the bed and the handler together in the
> middle of the frame, and leave a clear margin of empty wall above the
> handler's head and clear floor below the bed.** Everything that matters —
> the handler's face, the pointing hand, Lucy, and the bed she is stepping onto
> — must fit inside a wide letterbox band across the middle *and* inside a
> centred square. **Do not let the handler's head run up to the top edge of the
> frame**; a wide crop will slice her face.
>
> The single thing this image must make obvious: she is arriving on the bed,
> sent there from behind.
>
> Landscape 4:3, wider than tall.

### Scene 17 — The door opens, the guest stays put
*Replaces `dg-09`, 7 references. **The fix:** there is no handler and no leash
anywhere in the current picture, on a step whose whole point is that Lucy is
held on the bed while the door opens. `dg-09` used to carry three actions; §7.4
took two of them away, so this now has one job and should show only it.*

> Interior entry hall, three-quarter view. Lucy sits on her flat grey bed,
> **clearly back from the door**, head up and attention on the open doorway but
> **her body completely still — feet planted, not rising, not leaning forward.**
>
> **The handler is in frame and holding the leash**, standing beside the bed
> between Lucy and the door, side-on, the leash running from her hand down to
> Lucy's collar with an obvious slack J. She has just opened the door and is not
> looking at the guest.
>
> The guest stands **outside the threshold on the porch**, feet still and
> together, hands at his sides, not stepping in and not reaching toward the dog.
>
> Background: the open front door, the doormat, her bed, one wall plane. Nothing
> else — no furniture, no garden.
>
> The single thing this image must make obvious: the door is open, the guest has
> not moved, and she is being held on the bed on a slack leash.
>
> Landscape 4:3, wider than tall.

### Scene 18 — Paid on the bed
*Replaces `dg-12`, 6 references. **The fix:** no treat is visible in the current
one, and the handler bends from the waist over the dog, which is the posture the
trainer's guidance specifically avoids. §5 also flags the door as "wide open, not
barely open" — that one is an **alt-text error, not a drawing error**: step 4
opens the door, so at step 5 the door is open and should stay open.*

> Interior entry hall, three-quarter view. Lucy sits on her flat grey bed taking
> a treat, **her feet unmoved on the bed** — she is being paid for staying
> exactly where she is.
>
> The handler **crouches beside the bed at Lucy's level, down on her heels, back
> straight — she does not bend at the waist over the dog.** A **single treat is
> clearly visible between her finger and thumb**, arriving at Lucy's mouth. The
> leash is slack in her other hand.
>
> The guest stands outside the open door, still, hands at his sides, small in the
> background and not part of the exchange.
>
> Background: the open front door with the guest beyond it, the doormat, the bed,
> one wall plane. Nothing else.
>
> The single thing this image must make obvious: the treat is arriving while she
> is still on the bed and the door is still open.
>
> Landscape 4:3, wider than tall.

### Scene 19 — The guest comes in and does nothing
*Replaces `dg-21`, 7 references — it picked up six of them in the §7.4 split.
**The fix:** the guest in the current one is the second of the two different men
the library drifted into, and there is no leash although the level runs on one.*

> Interior entry hall, three-quarter view. Lucy lies on her flat grey bed, head
> up, watching the guest, **feet unmoved** — settled, not about to rise.
>
> The guest has **just crossed the threshold and stopped**: standing just inside
> the closed door, **feet together, hands at his sides, looking at the handler
> and not at the dog.** He is doing nothing at all, and that is the subject.
>
> The handler stands between the bed and the guest, relaxed, **the leash running
> from her hand to Lucy's collar with a slack J.**
>
> Background: the closed front door behind the guest, the doormat, her bed, one
> wall plane. Nothing else.
>
> The single thing this image must make obvious: he is inside, he has stopped,
> and nobody is paying her any attention.
>
> Landscape 4:3, wider than tall.

### Scene 20 — The guest sits down
*Replaces `dg-22`, 1 reference. **The warning, not a fix:** §5 calls this the
most complex composition in the library — two seated figures, sofa, armchair,
side table, rug, plant, framed picture, doormat and door — and "the scene that
will most test whether the new style can stay uncluttered". Strip it. If the new
version needs everything the old one had, it is wrong.*

> Interior room adjoining the entry hall, three-quarter view. Lucy lies on her
> flat grey bed a few feet from both people, head up but **relaxed and oriented
> at nothing — she is not watching the guest.** The leash is clipped to her
> collar and lies slack on the floor.
>
> The guest sits in a **plain armchair**, body angled away from the dog, hands
> resting on the chair arms, not looking at her.
>
> The handler sits **on a plain sofa**, also not attending to Lucy, at ease.
>
> **Background: the armchair, the sofa, Lucy's bed, one wall plane and the floor.
> Nothing else at all — no side table, no rug, no plant, no framed picture, no
> lamp, no cushions beyond what the seats need.** The room is carrying on around
> her and the picture must still feel as empty as the rest of the set.
>
> The single thing this image must make obvious: the room has moved on and she is
> not part of it.
>
> Landscape 4:3, wider than tall.

### Scene 21 — The guest leaves
*Replaces `dg-26`, 2 references. **The flag:** §5 records it doing double duty as
an ending image and as the "Lucy is too excited" de-escalation sheet for dg-4,
"which are different messages". This brief draws the ending. See the note below
for the fallback.*

> Interior entry hall, three-quarter view. Lucy sits at the handler's side,
> **on leash and watching the guest go without rising** — settled, four feet
> down, weight back.
>
> The handler stands beside her, **the leash held short in the hand nearest
> Lucy's collar**, mustard pouch at her hip, calm and unhurried.
>
> The guest is **stepping back out through the open door onto the porch**, half
> turned, one hand raised in a small backward wave. He is leaving, not arriving —
> his weight is already outside the threshold.
>
> Background: the open front door, the doormat, one wall plane. Nothing else.
>
> The single thing this image must make obvious: it is over, he is going, and she
> stayed sitting.
>
> Landscape 4:3, wider than tall.

### Scene 22 — The calm hello, composed as a cover
*Replaces `dg-11` **as the activity cover only** — the step-8 figure is already
drawn and approved as `door-greet-08-petting`. §5 calls `dg-11` "the most
instructionally correct image in the library — the one to hold the new style to",
and also warns that "three figures currently spread wider than a square crop can
hold". That is the whole problem this scene exists to solve.*

> Interior entry hall, three-quarter view, **well back from the closed front
> door**. Lucy sits **square with all four feet down, weight back on her
> haunches, head level** — not jumping, not leaning in, not rising.
>
> The guest **crouches to one side of her at her level**, resting an **open palm
> flat on her chest — not over the top of her skull** — eyes soft, face calm.
> This is the correct greeting and every detail of it must read.
>
> The handler stands close behind Lucy holding the **leash in a loose loop with
> obvious slack**.
>
> **Composition, and this matters more than anything else in the brief: this is
> an activity cover, so it is letterboxed to a wide band across the middle and
> centre-cropped to a small square. Group all three tightly in the centre of the
> frame, inside the middle horizontal band, with clear space above and below. Do
> not spread them across the width.** A square crop taken from the middle must
> contain **Lucy's head, the guest's hand on her chest, and the guest's face.**
> The handler may fall partly outside that square; the guest may not.
>
> Background: the closed door small behind them, the doormat, one wall plane.
> Nothing else.
>
> The single thing this image must make obvious: four paws on the floor and a
> hand on her chest.
>
> Landscape 4:3, wider than tall.

### Batch 2 is done — installed at 1.53.0

All seven shipped with `door-greet-07-approach`, and Controlled Real Greeting
joins Doorbell Predicts Rewards as an activity that runs start to finish in one
style — **all eight steps, all five levels, cover and fallback, with no `dg-NN`
left anywhere in it.** Eight keys retired: `dg-06`, `dg-09`, `dg-10`, `dg-11`,
`dg-12`, `dg-21`, `dg-22`, `dg-26`.

`dg-06`'s other homes came along as intended: dg-2 step 1 and dg-3 step 3 both
draw `door-place-03-send` now, and dg-3's cover with them. Same early inheritance
dg-3 got from batch 1.

**Scene 16 took two goes and still is not perfect.** The first had the right bed
and a face sliced across the eyes by the Today band; the second fixed the crop
and came back with a thin mat. Round 10's is installed and the bed is on the
drift list below. What the round cost was worth it for two things that outlast
it: the real-band check (above) and the pinned bed in Block B.

### Known drift

Two installed or approved images draw her bed as a thin mat rather than the
mattress Block B now pins:

- **`door-sound-03-name-distant`** (batch 1, shipped at 1.52.0). It is the only
  bed in dg-1, so nothing sits beside it to contradict it — low priority.
- **`door-place-03-send`** (batch 2, shipped at 1.53.0 — round 10's). This one
  *does* have neighbours: dg-4 steps 3 and 4 are adjacent and step 4 has the
  mattress. Installed knowingly rather than spend a third generation on it.

Neither is worth a round on its own. Fold them into the next batch that touches
the same activity, or into batch 4 — dg-2 is eleven images and most of them are
on the bed, so the mattress has to be right there anyway.

**The `dg-26` decision, settled.** It was serving as both the ending of dg-2 L8
and the "Lucy is too excited" sheet for dg-4, which say different things. Scene
21 took the ending as `door-greet-09-leaves`. The fallback went to
`door-sound-cover` rather than to new art: the sheet's own copy reads "move Lucy
farther from the door / keep her on leash and stay beside her / feed her on her
bed", and that picture — a handler crouched beside her, well back from the door,
hand on her shoulder — is already exactly that. §7.4's best fix was this same
move, repointing a key at a correct picture that already exists instead of
drawing one.

---

## Batch 3 — dg-3 Doorbell Means Place

Four to draw, one to re-run, and the smallest batch left — because three of
dg-3's seven pictures already arrived with batches 1 and 2.

| Step | Image | State |
| --- | --- | --- |
| 1 Ring or knock once | `door-sound-02-self` | live, batch 1 |
| 2 Say her name | `door-sound-03-name` | live, batch 1 |
| 3 Send her to her bed | `door-place-03-send` | live, batch 2 — **re-run, see below** |
| 4 Reward her twice on the bed | `dg-25` | draw |
| 5 Walk toward the door, then come back | `dg-07` | draw |
| 6 Release and reset | `dg-19` | draw |
| L5 override — imaginary visitor | `dg-08` | draw |

### These are dg-2's pictures more than they are dg-3's

Run the "what else is on screen" check and this batch turns out to be mostly
about the *next* activity. All four are shared with dg-2 Stay While the Door
Opens, which is batch 4:

- **`dg-25` is dg-2's activity cover** as well as its step 4, and the "Lucy is
  too excited" sheet for **both** dg-2 and dg-3. That is four crops: the 16:7
  Today band, the 84 and 56px squares, and the 16:10 fallback sheet. §5 already
  records "the same square-crop weakness as `dg-24`, though less severe", and
  `dg-24` is the one whose thumbnail landed on floorboards. So it is briefed as
  a cover, with the composition rule and the real-band check.
- **`dg-07`** is dg-2's step 3 and **`dg-19`** its step 5. **`dg-08`** is the
  rehearsal override at dg-2 L5 and L6.

So they are named into dg-2's step numbering — `door-stay-03-cross`,
`door-stay-04-pay`, `door-stay-05-release`, `door-stay-03-pretend` — which
already has `door-stay-02-cue` in it. After this batch, dg-2 has five of its
eleven done before batch 4 starts.

**Keep `dg-25` as the fallback for both activities.** Batch 2 moved dg-4's
fallback off `dg-26` because that key was doing an ending and a de-escalation at
once. This is not that case: the sheet reads "feed her on her bed for staying
there", and paying her on the bed is exactly what this picture shows.

### The re-run, and why it belongs here

`door-place-03-send` shipped with the thin mat, on the known-drift list, and the
note said to fold it into the next batch touching the same activity. **This is
that batch**, and there is a second reason now: every one of these four is a bed
picture, drawn against the pinned Block B mattress. Leave `door-place-03-send`
as it is and dg-3 gets a thin mat at step 3 and a mattress at step 4 — adjacent
steps, the same failure the pinning was meant to end. It also clears dg-4's
steps 3 and 4.

Nothing about the brief changes; Scene 16 already carries both the composition
fix and the pinned bed. Just run it again.

### One thing to decide at install, not now

`dg-25` is a reward picture doing cover duty for dg-2, which is the arrangement
batch 2 replaced for dg-4 with a purpose-made cover. The difference is that
`dg-11`'s replacement had **demonstrably** failed the 16:7 band, and this one has
not been drawn yet. So: brief it as a cover, test it at the real band and the
56px square, and only if it fails does batch 4 owe dg-2 a dedicated cover. Do
not spend that generation in advance.

Attach `door-greet-04-open.png` — same room, the bed at the right depth, the
mattress the pinned Block B now describes, and Lucy settled on it.

### Scene 23 — Paying her on the bed
*Replaces `dg-25`. dg-2's activity cover, its step 4, dg-3's step 4, and the
"Lucy is too excited" sheet for both — so it takes the 16:7 band, both squares
and the 16:10 sheet. **The flag:** §5 records the same square-crop weakness as
`dg-24`, less severe. The picture itself is right; §5 calls the coiled leash on
the floor "a nice touch that survives to the new style", so keep it.*

> Interior entry hall, three-quarter view, **well back from the closed front
> door**. Lucy lies on her bed, front legs extended, **head forward taking a
> treat, her body completely unmoved** — she is being paid for staying, not for
> coming. All four feet stay on the bed.
>
> The handler **kneels on the floor beside the bed**, back straight, delivering
> the treat low, down between Lucy's front paws — the bed is the paying spot and
> the picture has to say so. The mustard pouch is at her hip.
>
> **The treat itself must be unmistakable: a small brown treat held between
> fingertip and thumb, clearly separate from the fingers and clearly visible
> against the grey bed.** Do not draw a closed fist or a cupped empty hand at her
> muzzle — this is the picture of the payment arriving, and if the food is not in
> frame the image says nothing at all.
>
> The black leash is clipped to her collar and **lies coiled loose on the floor**
> beside the bed.
>
> Background: the closed front door small in the background, the doormat, one
> wall plane. Nothing else.
>
> **Composition, and this matters as much as the action: this is an activity
> cover. Group Lucy, the bed and the kneeling handler together in the middle of
> the frame, and leave a clear margin of empty wall above the handler's head and
> clear floor below the bed.** A wide letterbox band across the middle must hold
> the handler's face, the treat hand and Lucy's head; a centred square must hold
> all three of those too. **Do not let the handler's head run up to the top edge
> of the frame** — a wide crop will slice her face.
>
> The single thing this image must make obvious: the treat arrives down at the
> bed, and she has not moved to get it.
>
> Landscape 4:3, wider than tall.

### Scene 24 — Crossing to the door while she holds
*Replaces `dg-07`. It was the most-used image in the app at 30 references and
carried three different actions; §7.4 took two of them away, so it now has one
job — "move toward the door" — and should show only that. **The fix:** the alt
text claims she glances back and she does not. Draw the glance, or drop the
claim; this brief draws it.*

> Interior entry hall, side view, **the bed well back from the closed front
> door with clear floor between them** — the distance between bed and door is
> half the subject.
>
> Lucy **lies on her bed holding the down, front legs extended, head up and eyes
> tracking the handler.** She is holding, not settling to sleep, and she is not
> rising. Her feet have not moved.
>
> The handler is **partway across the room, walking away toward the door,
> three-quarter rear view**, arms relaxed and empty, **glancing back over her
> shoulder at Lucy.** She is mid-stride, not standing still.
>
> The black leash is clipped to Lucy's collar and trails slack on the floor
> behind the handler — nobody is holding it.
>
> Background: the closed front door ahead of the handler, the doormat, her bed,
> one wall plane. Nothing else.
>
> The single thing this image must make obvious: she is staying put while the
> handler walks away.
>
> Landscape 4:3, wider than tall.

### Scene 25 — Release and reset
*Replaces `dg-19`, 14 references. **The fix, and it is the whole reason this
brief is careful:** §5 records that its composition is nearly the mirror of
`dg-06` — "go to your bed" — so two of the most-used images in the app read
almost identically and mean opposite things. `door-place-03-send` now has Lucy
stepping **onto** the bed with the handler's **pointing hand behind her**. This
one has to be unmistakably the other thing.*

*The blind pilot rejected the first version 4/4. Every viewer read the open
hands correctly and every single one described the dog as "standing **on** the
mat". Front feet down with both hind feet still up is a pose, not a departure —
at a glance it is a dog standing on her bed. **She has to be most of the way
off it.***

> Interior entry hall, side view. Lucy is **walking off her bed toward the
> handler and is most of the way off it — both front feet and one hind foot are
> down on the floorboards, and only her back foot is still touching the bed,
> right at its edge.** Her body is angled off the bed and her weight is forward,
> over the floor rather than over the bed. Head up, eyes on the handler.
>
> **A viewer who sees only this picture has to say she is coming off the bed,
> not standing on it.** If her whole body still sits over the bed, it is wrong.
>
> The handler stands **facing her, leaning very slightly forward, both hands
> open, low and turned upward in a welcoming release gesture**, face relaxed.
> **Neither hand is pointing at anything** — no pointing finger anywhere in the
> frame, because the pointing gesture means the opposite instruction and belongs
> to a different picture.
>
> The black leash is clipped to her collar and lies slack across the floor.
>
> Background: the closed front door, the doormat, her bed, one wall plane.
> Nothing else.
>
> The single thing this image must make obvious: she is coming off the bed,
> invited, toward open hands.
>
> Landscape 4:3, wider than tall.

### Scene 26 — Greeting nobody at the open door
*Replaces `dg-08`, 3 references. **The fix:** the current one paints the
imaginary visitor as a translucent blue figure baked into the artwork. It reads
as a ghost, and the style rules out symbols outright. There is no visitor in this
picture — the whole point of the rehearsal is that the porch is empty. §5 also
notes the bed sits against the door and should be a few feet back.*

> Interior entry hall, three-quarter view. The **front door is standing fully
> open onto a completely empty porch** — daylight, the porch floor, nothing and
> nobody beyond it. **There is no visitor of any kind in this image: no person,
> no silhouette, no outline, no translucent or ghosted figure.**
>
> The handler stands **in the open doorway, three-quarters away from camera, one
> hand resting on the edge of the door, head turned out toward the empty porch**
> as though talking to someone who is not there. Her other hand holds the leash
> slack.
>
> Lucy lies on her bed **several feet back from the door, not against it**, head
> up, watching the handler, **not rising**. The leash runs from her collar across
> the floor to the handler's hand with obvious slack in it.
>
> Background: the open front door, the doormat, the empty porch beyond, her bed,
> one wall plane. Nothing else.
>
> The single thing this image must make obvious: the door is wide open onto
> nobody, and she is still on her bed.
>
> Landscape 4:3, wider than tall.

### Scene 27 — Place, composed as a cover
*New, and added mid-batch. dg-3's cover has been `door-place-03-send` since batch
2 retired `dg-06`, and that image has now failed the Today band three times in
three different ways — face sliced across the eyes, then a thin bed, then the
handler decapitated at the shoulders with the bed almost entirely below the band.
**That is geometry, not prompting**, and the rule it taught is written up under
the crop tests below: a standing adult and a floor-level bed do not both fit in
58% of the frame height. Every cover that has worked first time —
`door-sound-cover`, `door-greet-cover`, `door-stay-04-pay` — has a crouching or
kneeling human in it. So dg-3 gets its own cover, exactly as dg-4 did, and
`door-place-03-send` goes back to being only a step figure, where it is finished.*

*Save as `door-place-cover`. **It must not look like `door-stay-04-pay`**, which
is dg-2's cover and also a person low beside a dog on a bed. The first attempt
passed every crop and still failed this: at 56px the two were the same picture —
dog on the bed at the left, person low at the right, door small at the far
right — and those two thumbnails sit **next to each other on the program map
rail**, which §2 calls the place a household scans the four activities. So this
one is **mirrored**, and the door is pushed forward. Same defect §5 recorded
against `dg-19` and `dg-06`, two images reading alike; it applies to covers on a
rail just as much as to steps in a session.*

> Interior entry hall, three-quarter view. **Lucy and her bed are on the RIGHT of
> the frame and the handler is on the LEFT** — this layout is deliberate and is
> the opposite way round from the reference image, which is a different
> activity's cover and must not be echoed.
>
> Lucy lies settled on her bed, **well back from the closed front door**, front
> legs extended, body relaxed and **her head turned away from the door to look
> up at the handler.** She has arrived and she is staying — this is the finished
> behaviour, not the moment of arriving.
>
> The handler **crouches beside the bed at her level, down on her heels, back
> straight**, one hand resting lightly and calmly on the edge of the bed. **She
> is not offering food and there is no treat anywhere in the frame** — nothing is
> being asked of Lucy and nothing is being paid.
>
> The black leash is clipped to her collar and lies slack across the bed and the
> floor.
>
> **The closed charcoal front door sits behind the handler on the LEFT, large and
> unmistakable** — near enough to read its panels and its small window at a
> glance, with the doormat in front of it. The sound at that door is the reason
> the bed matters, so it is a real part of this picture, not a small shape at the
> edge of it. The first attempt put it small and far right; it belongs forward and
> opposite.
>
> Background: the closed door, the doormat, her bed, one wall plane. Nothing else.
>
> **Composition, and this matters more than anything else in the brief: this is
> an activity cover, so it is letterboxed to a wide band across the middle and
> centre-cropped to a small square. The handler is crouched, so the whole group
> is low and compact — put Lucy, the bed and the crouching handler together in
> the centre of the frame, with a clear margin of empty wall above the handler's
> head and clear floor below the bed.** A wide band across the middle must hold
> the handler's face, Lucy's head and the door; a centred square must hold Lucy,
> the bed and the handler. **Nobody in this image is standing**, and **the dog is
> on the right while the person is on the left** — that arrangement is what keeps
> this thumbnail from being mistaken for another activity's.
>
> The single thing this image must make obvious: the door is over there and she
> is settled on her bed, away from it.
>
> Landscape 4:3, wider than tall.

### Batch 3 is done — installed at 1.54.0

Six images, and dg-3 Doorbell Means Place is complete — the third of four
activities, every level, cover and fallback, nothing painted left in it. Four
keys retired: `dg-07`, `dg-08`, `dg-19`, `dg-25`. dg-3's `coverImage` moved to
`door-place-cover` and `door-place-03-send` went back to being only a step
figure, which is where it works.

**The drift list is empty of beds.** `door-place-03-send` was re-run with the
pinned Block B mattress and reinstalled over the thin-mat version, so dg-3 steps
3 and 4 match and so do dg-4's.

**dg-2 is five-eighths done before batch 4 starts.** Its cover, its fallback and
its steps 1, 2, 4 and 5 are all new. What is left is step 3 alone, which is the
distance ladder: `dg-13`, `dg-14`, `dg-15`, `dg-16` and `dg-23` — **five images,
not the eleven the original plan counted, and four of them are one composition at
four distances.** That is the whole of batch 4.

Two things this batch cost, both now rules rather than anecdotes:

- **Nobody stands in a cover.** `door-place-03-send` failed the Today band three
  times before the cause turned out to be geometric rather than verbal. The rule
  is written up under the crop tests.
- **Two covers can pass every crop and still fail together.** The first
  `door-place-cover` was correct in isolation and identical to `door-stay-04-pay`
  at 56px, and those two sit side by side on the map rail. Covers have to be
  checked against each other, not only against their own briefs.

**Check what it does to dg-2 before opening the PR.** All four are shared, so
batch 4's activity picks up its cover, its steps 3, 4 and 5, and its L5–L6
rehearsal override in this release. That leaves dg-2 with six to draw rather than
eleven, and it means dg-2 will be a mix — five new, six painted — until batch 4
lands. That is the accepted cost of sharing, the same as dg-3 got from batch 1;
what is *not* acceptable is a mix inside dg-3, which is why the re-run is in.

Run `node scripts/pilot.mjs verify` before opening the PR, and test Scene 23 at
the real 42% band, both squares and the 16:10 fallback sheet.

---

## Batch 4 — dg-2 Stay While the Door Opens

Five images, and the plan said eleven. Batches 1 to 3 handed dg-2 its cover, its
fallback and steps 1, 2, 4 and 5, so **everything left is step 3** — the one step
the level ladder rewrites eight times:

| Level | Step 3 becomes | State |
| --- | --- | --- |
| base | `door-stay-03-cross` | live, batch 3 |
| L1 One step away | `dg-13` | **draw** |
| L2 Halfway to the door | `dg-14` | **draw** |
| L3 Touch the handle | `dg-15` | **draw** |
| L4 Crack the door | `dg-16` | **draw** |
| L5 Open it fully | `door-stay-03-pretend` | live, batch 3 |
| L6 Say hi to nobody | `door-stay-03-pretend` | live, batch 3 |
| L7 Imaginary conversation | `dg-23` | **draw** |
| L8 Familiar person outside | `door-greet-04-open` | live, batch 2 |

They all key into the same family: `door-stay-03-onestep`, `-halfway`,
`-handle`, `-crack`, `-conversation`.

### The ladder is one picture at four moments, and it has to be generated that way

`dg-13`, `dg-14`, `dg-15` and `dg-16` are one composition sampled at four points
on the same walk. A household climbs L1 → L2 → L3 → L4 over days, and what
must change between them is **the handler's distance from the door and the state
of the door — nothing else.** If the camera moves, or the room shifts, or Lucy is
drawn at a different size, the ladder stops reading as progress and starts
reading as four unrelated pictures.

So generate them **in one conversation, in order, each with the previous approved
one attached**, exactly the way Scene 8 and Scene 9 were made a matched pair.
Scenes 29 to 31 are written as "same room, same camera, change one thing"
briefs, which is why they are much shorter than the others in this file. Do not
paste them out of order and do not start a fresh chat between them.

**No crop constraints on any of these five.** §5 confirms the ladder never
renders as a thumbnail — these are step figures only, always full 4:3. That also
disposes of §5's own note that "the four-image distance ladder is
indistinguishable at 56px": true, and it does not matter. What matters is that
they are distinguishable **from each other at full size and in sequence**, which
is the opposite problem and the one these briefs solve.

### Two near-duplicates to steer away from

Both are images this batch sits next to, and both were flagged in §5 or found in
batch 3:

- **`dg-14` against `door-stay-03-cross`.** §5 calls `dg-14` a near-duplicate of
  the image `door-stay-03-cross` replaced. They are both "handler partway across
  the room". The difference is motion: `door-stay-03-cross` is **walking, mid-
  stride, going away**; this one is **stopped, weight settled back, turned
  round to look at Lucy.** Scene 29 says so twice.
- **`dg-23` against `door-stay-03-pretend`.** Both are the handler talking to
  nobody at an open door, one level apart. §5 gives the difference and it is
  posture: `door-stay-03-pretend` is **standing in the doorway** for a quick
  hello; this is **leaning on the door, weight on one hip, a hand in a pocket**,
  settled into twenty or thirty seconds of conversation. Scene 32 makes the lean
  the subject.

Attach `door-stay-03-cross.png` to Scene 28 — same room, same bed, same distance
from the door, and the handler already walking. After that, attach the previous
scene in the ladder.

### Scene 28 — One step away
*Replaces `dg-13`. **The fix, and it is P1:** no step is being taken in the
current one — both feet are planted beside the bed, on the level whose entire
subject is the first single step. §5 also notes it is the flattest render in the
library and that Lucy reads smaller and younger there than anywhere else.*

*The blind pilot rejected the first version 4/4 — every viewer said she was
"walking away toward the door", which is `door-stay-03-cross`, one activity
over. It also found the old claim unscoreable: **"one step, and no more" asks a
still image to prove an absence.** You cannot see that no second step follows.
The claim is now the thing a still can actually carry — how close she still is
to the bed — and the brief gives her a reference to be close to.*

> Interior entry hall, side view. **This establishes a room that three more
> pictures will reuse: the bed on one side, the closed charcoal front door on the
> other, and clear floor between them.** Frame it so the whole walk from bed to
> door is visible.
>
> Lucy lies on her bed holding the down, front legs extended, **head up and eyes
> on the handler**, feet unmoved. She is a medium-large adult dog and should read
> as one — not small, not young.
>
> The handler is **right beside the bed and has only just left it. Her trailing
> foot is still level with the edge of the bed — the bed is at her heel, close
> enough to touch — and her leading foot is one pace ahead, no more.** Her body
> stays square to the bed rather than turned into a walk. **She must not read as
> walking away**: a figure in profile mid-stride with clear floor behind her is
> the next picture in the ladder, not this one.
>
> The black leash is clipped to Lucy's collar and lies slack on the floor.
>
> Background: her bed, the closed front door, the doormat, one wall plane.
> Nothing else.
>
> The single thing this image must make obvious: she has barely moved — the bed
> is still right at her heel.
>
> Landscape 4:3, wider than tall.

### Scene 29 — Halfway to the door
*Replaces `dg-14`. **Attach the approved Scene 28** and change only what is named
below. **The fix:** §5 calls this a near-duplicate of the picture that is now
`door-stay-03-cross`, which shows the handler walking away mid-stride. This one
is stopped and turned back, and that difference is the only thing telling the two
apart.*

> Same room, same camera, same distance, same light, same bed and door as the
> previous image. Lucy is in the same place on her bed, holding, head up.
>
> Change one thing: **the handler is now halfway across the room and has
> stopped.** Weight settled on the back foot, both feet on the floor, **her upper
> body turned back over her shoulder to look at Lucy.** She is paused and
> watching her, not walking — no mid-stride, no lifted foot.
>
> The single thing this image must make obvious: half the room between them, and
> the handler has stopped to check.
>
> Landscape 4:3, wider than tall.

### Scene 30 — Hand on the handle
*Replaces `dg-15`. **Attach the approved Scene 29.** §5 calls the current one
"clean and correct" — this is a restyle, not a repair. Keep what it does.*

> Same room, same camera, same distance, same light, same bed and door as the
> previous image. Lucy is in the same place on her bed, holding, head up and
> watching.
>
> Change one thing: **the handler has reached the door and closed her hand around
> the handle.** She stands at it in profile, body relaxed, not pulling. **The door
> is still completely shut** — no gap, no daylight, no movement in it.
>
> The single thing this image must make obvious: her hand is on the handle and
> the door has not opened.
>
> Landscape 4:3, wider than tall.

### Scene 31 — Crack the door
*Replaces `dg-16`. **Attach the approved Scene 30.** **The fix is in the alt
rather than the art:** §5 notes the alt omits the handler, who is the subject of
the step. The picture keeps her.*

> Same room, same camera, same distance, same light, same bed and door as the
> previous image. Lucy is in the same place on her bed, holding, head up.
>
> Change one thing: **the door is now open.** It has swung inward off the frame
> and there is **a clear vertical stripe of bright daylight running the full
> height of the opening, from the top of the door frame down to the floor** — a
> hand's width across, wide enough to see at a glance and impossible to mistake
> for a shut door. The near edge of the door stands proud of the frame; the gap
> is real, not a seam.
>
> The handler stays at the door with one hand on its edge, holding it at that
> width. **She remains clearly in frame; she is the one doing this.**
>
> Nothing is visible through the gap. No porch, no figure, no view — just light.
>
> **This is the one thing separating this picture from the previous one, where
> the door is shut.** A door that still reads as closed, or a hand resting on the
> edge with only a seam beside it, is a reject.
>
> The single thing this image must make obvious: a few inches of daylight, and
> she is still on her bed.
>
> Landscape 4:3, wider than tall.

### Scene 32 — The imaginary conversation
*Replaces `dg-23`. **The fix is separation, not repair:** §5 calls this the
cleanest, emptiest interior in the library and says it "sets the distance between
bed and door better than any other image" — so keep the emptiness and keep the
distance. What it must not do is look like `door-stay-03-pretend`, which is one
level earlier and also the handler talking to nobody at an open door. The
difference §5 gives is posture, and this brief makes the lean the subject.*

> Interior entry hall, three-quarter view, **with a generous run of empty floor
> between the bed and the door** — the distance is part of the point.
>
> Lucy lies down on her bed **well back from the door**, head up, holding. Her
> feet have not moved. The black leash is clipped to her collar and lies slack on
> the floor.
>
> The front door is open. The handler is **leaning easily on it — one hand high
> on the door's edge, weight settled on one hip, her other hand in a pocket** —
> head turned out to the empty porch, mid-conversation. **The lean is the
> subject: this is somebody twenty seconds into talking, comfortable and in no
> hurry, not somebody who has just opened the door to say hello.**
>
> **There is nobody outside: no person, no silhouette, no outline, no translucent
> figure.** The porch is empty.
>
> Background: the open door, the empty porch beyond it, the doormat, her bed, one
> wall plane. Nothing else — this is the emptiest room in the set and should stay
> that way.
>
> The single thing this image must make obvious: a long, relaxed conversation at
> the open door, and she is holding the bed right through it.
>
> Landscape 4:3, wider than tall.

### Batch 4 is done — installed at 1.55.0

Five images, and **every activity in the app is redrawn. No `dg-NN` key exists
any more** — not in `IMAGES`, not in a step, not in a cover or a fallback, and
the files are gone from `img/`. Five keys retired: `dg-13`, `dg-14`, `dg-15`,
`dg-16`, `dg-23`.

**Sequential attachment works, and here is the evidence.** The four ladder
frames were generated in one sitting with each attached to the last:

| Frame | Floor sat | Wall sat | Left edge of the bed |
| --- | --- | --- | --- |
| onestep | 0.69 | 0.32 | x = 83 |
| halfway | 0.70 | 0.33 | x = 83 |
| handle | 0.71 | 0.36 | x = 86 |
| crack | 0.73 | 0.38 | x = 87 |

The camera held to **four pixels across four generations**, and the floor drifted
0.04 in saturation end to end. Use this for any future set that has to read as
one sequence.

Two notes for whoever picks this up next:

- **`dg-16` took two goes, and the lesson is about vagueness.** "Open a hand's
  width" was too small an instruction to register: it came back as a shut door
  with a hand resting on the edge, which is the same picture as the handle frame
  before it. The brief now asks for a full-height stripe of daylight with the
  door standing proud of the frame, and says a shut door is a reject. When a
  step's whole subject is a small physical difference, describe the difference,
  not the measurement.
- **`door-stay-03-onestep` shows a full stride rather than one lifted foot.**
  The recorded P1 defect — both feet planted, no motion at all — is fixed, and
  in sequence against the halfway frame it reads as clearly closer to the bed.
  It was accepted rather than re-run because re-running the first rung would
  have cascaded through the two frames attached beneath it.

What remains after this is **batch 5**: `cg-01`, `sr-01`, `wp-01` and `fd-01`,
the covers for the four programs that are named but not written yet. No activity
depends on them, so they are the only pictures left that a household can reach
without the restyle being complete.

---

## Batch 5 — the four planned programs

The last four, and the only pictures left in the app that are not redrawn:
`cg-01`, `sr-01`, `wp-01`, `fd-01`, the covers for the programs that are named
but not written. No activity depends on them.

| Replaces | Programme | Save as |
| --- | --- | --- |
| `cg-01` | Four Paws on the Floor | `plan-fourpaws` |
| `sr-01` | Settle on a Mat | `plan-mat` |
| `wp-01` | People Passing on Walks | `plan-walkpeople` |
| `fd-01` | Name Response Around Distractions | `plan-name` |

The names match the icons these cards already carry (`plan-fourpaws`,
`plan-mat`, `plan-walkpeople`, `plan-name` in ICONS), because the card and its
mark are the same thing in two media and there is no reason to invent a second
vocabulary for four files.

### Everything this batch needs is different, because these are thumbnails

Every previous batch composed for a step figure at full width, with the crop
tests as a constraint on top. **These four render at 84px and nowhere else** —
one reference each, the locked "soon" card in the Activities library. §5 says it
twice and it is the whole brief: of `cg-01`, "only ever renders at 84px; the
full-frame hallway is wasted"; of `sr-01`, "at 84px it is mush."

So the rule for this batch inverts. **Draw the thumbnail, not the illustration.**

- **One shape, filling the frame.** Whatever the scene is, it has to survive
  being 84 pixels wide. Two figures at full height, a room around them, and a
  distance between them are all invisible at that size. Get close.
- **Centred, because the card takes a square.** The 4:3 master is centre-cropped
  to a square, so the outer sixth of each side is thrown away before a household
  sees it. Nothing that matters goes there.
- **Background is a colour, not a room.** One flat wall or one flat ground plane
  and nothing else. §5 records `sr-01` as "the busiest background in the whole
  library — armchair, side table, mug, plant pot, bookcase, two framed pictures,
  trailing vine, patterned rug"; every one of those is a smudge at 84px and
  there is no larger size where the household ever sees them.
- **No crop tests to run.** These take one crop and it is the square. That is
  the only thing to check.

Attach `door-greet-cover.png` — closest for cast and palette, and a cover
already composed tight and centred, which is the habit these four need.

### Scene 33 — Four paws on the floor
*Replaces `cg-01`. §5 records no defect in what it shows, only that "the
full-frame hallway is wasted" on an 84px card. This is a restyle and a crop-in.*

> **Close in on Lucy and the person's legs — this is drawn for a small square,
> so fill the frame with the two of them and nothing else.**
>
> Lucy **stands four-square with every foot flat on the floor**, head up toward
> the person, weight even and back — **not leaning forward, not a paw lifted,
> nothing about her rising.**
>
> The person stands upright and still beside her, **hands held together at the
> waist**, deliberately giving her nothing to jump at. Crop them at the chest or
> shoulders; their face is not what this card is about, and keeping it would push
> Lucy too small.
>
> Background: one flat wall plane and the floor. Nothing else at all.
>
> The single thing this image must make obvious, at the size of a thumbnail: all
> four feet are down.
>
> Landscape 4:3, wider than tall.

### Scene 34 — Settled on the mat
*Replaces `sr-01`. **The fix:** §5 calls it "the busiest background in the whole
library" and notes it is mush at 84px, which is the only size it ever renders.
Strip it to almost nothing.*

> **Close in on Lucy on her mat — this is drawn for a small square, so she fills
> the frame.**
>
> Lucy lies **flat on her side on a grey mat, head down on the floor, eyes closed
> or half closed**, legs loose, fully released. This is deep rest and not a
> down-stay: nothing about her is holding a position.
>
> **A person is present only as a hint of company — the lower legs and feet of
> someone seated, at the very edge of the frame, still and turned away.** No
> chair drawn in full, no face, no book, nothing to look at.
>
> **Background: one flat wall plane and the floor. No armchair, no side table,
> no mug, no plant, no bookcase, no pictures, no rug, no lamp.** The old version
> had every one of those and they are a smudge at the only size this is ever
> seen.
>
> The single thing this image must make obvious, at the size of a thumbnail: a
> dog completely asleep.
>
> Landscape 4:3, wider than tall.

### Scene 35 — Someone passes on the pavement
*Replaces `wp-01`. **The warning:** this is the only outdoor picture in the
library, so it has to invent a street vocabulary in the new style — and then use
almost none of it, because it renders at 84px. Keep the outdoors to a pavement
and a flat band of green.*

> **Close in on Lucy and her handler walking — this is drawn for a small square,
> so the two of them fill the frame.**
>
> Lucy **walks at the handler's side, her head turned up to them**, ears toward
> them, **not looking at the person passing.** The black leash runs from her
> collar to the handler's hand in a loose J with obvious slack.
>
> The handler walks beside her **looking down at her**, relaxed. Crop them at the
> chest; the walk is in the legs and the leash, not the face.
>
> **The stranger is a small figure walking away in the background, already past
> them, with no interaction of any kind** — no eye contact, no reaching, no
> turning. Keep them small and plain.
>
> Background: a plain pavement underfoot and **one flat band of green behind**.
> No houses, no cars, no fences, no trees, no signs, no other people.
>
> The single thing this image must make obvious, at the size of a thumbnail: she
> is looking up at her handler while somebody walks by.
>
> Landscape 4:3, wider than tall.

### Scene 36 — Her name, with something better going on
*Replaces `fd-01`. **Two fixes, and this is the only one of the four with a real
defect.** §5: "she is not looking at the handler — she looks up and past them,
so the picture shows the step failing." And the character break — "off-sheet
markings: a white blaze up the muzzle and forehead that appears in no other
image." Lucy has **no white on her face**, ever.*

> **Close in on Lucy and the crouching handler — this is drawn for a small
> square, so the two of them fill the frame.**
>
> Lucy stands with her **head turned back and down to the handler**, ears
> forward toward them.
>
> **Her eyes are the whole picture, and they must be locked on the handler's
> face. Draw the two of them looking directly at each other — her gaze angled
> down to meet a person crouched below her eye line, and clearly meeting them.**
> Not up. Not level. Not over their shoulder, not past their head, not into the
> middle distance. **The first attempt turned her head correctly and then sent
> her eyes over the handler into the distance, which is the same defect the old
> picture had and the only reason this one is being drawn.** If a viewer cannot
> tell she is looking at the person, it is wrong.
>
> **She has no white on her face. None.** Her white is the blaze on her chest
> and her toes, and nowhere else.
>
> **Her muzzle is scruffy and wiry** — a visibly bearded jaw and chin and tufted
> eyebrows, grey and black against the coat. **She is a Labrador and German
> Wirehaired Pointer mix and must not be drawn as a smooth-coated Labrador.**
> The first attempt drew her smooth-faced.
>
> The handler **crouches low behind and to one side of her**, one hand low and
> calm, not holding food out.
>
> **The distraction is behind her and plainly ignored** — a squirrel sitting on
> the grass, small and still, well back in the frame. Nothing else outdoors.
>
> Background: flat ground and one flat band of green. No trees, no path, no
> fence, no park furniture.
>
> The single thing this image must make obvious, at the size of a thumbnail: her
> head has turned to her handler and away from the squirrel.
>
> Landscape 4:3, wider than tall.

### When batch 5 is done

Install the four and **the restyle is finished** — every picture in the app is
in the Warm Instructional Vector style, and the audit's thirty painted
illustrations are all gone. Four keys retire: `cg-01`, `sr-01`, `wp-01`,
`fd-01`.

Check them the way they will be seen: build the 84px squares and look at those,
not at the full frames. If a scene only reads at full size it has failed the
one test that applies to it.

```bash
cd img/pilot/round-16 && for f in *.png; do sips -c 1086 1086 "$f" --out "/tmp/${f%.png}-sq.png"; sips -Z 84 "/tmp/${f%.png}-sq.png" --out "/tmp/${f%.png}-84.png"; done
```

---

## The crop tests, and how to re-run them

Round 2 cleared these. Re-run them on any replacement before approving it:

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns/img/pilot/round-2" && for f in *.png; do sips -c 634 1448 "$f" --out "/tmp/${f%.png}-today-16x7.png"; sips -c 1086 1086 "$f" --out "/tmp/${f%.png}-sq.png"; sips -Z 56 "/tmp/${f%.png}-sq.png" --out "/tmp/${f%.png}-thumb56.png"; done
```

**Nobody stands in a cover.** The band keeps 634px of a 1086px master — 58% of
the height — and a standing adult plus a floor-level dog bed does not fit in it.
You get the head or you get the bed, and shrinking both until they fit kills the
56px thumb. `door-place-03-send` proved it three times over: sliced across the
eyes, then decapitated at the shoulders with the bed below the band, with a
correct-but-unrelated fix in between. Every cover that passed first time —
`door-sound-cover`, `door-greet-cover`, `door-stay-04-pay`, and Scene 27 —
has a **crouching or kneeling** human, which is what makes the group compact
enough to sit in the middle band and inside a centred square at once.

So: if a scene needs someone standing, it is a step image. If it has to be a
cover, put the person down at the dog's level. Where an activity's natural cover
wants a standing figure, draw the activity a separate cover instead of forcing
one image to do both — dg-4 and dg-3 both ended up here.

**The Today band is not centred.** `object-position: center 42%`
([app.css](../css/app.css)) shifts it up, so what a household actually sees is
**y 190–824** of a 1086px master, not the y 226–860 that `sips -c 634 1448`
produces. Thirty-six pixels, and it is the difference between a clean crop below
the chin and a face sliced across the eyes — which is exactly what it did to the
first `door-place-03-send`. Check the real band on any cover before approving it:

```bash
sips <file>.png --cropToHeightWidth 634 1448 --cropOffset 190 0 --out /tmp/real-today.png
```

| Crop | Applies to | Command |
| --- | --- | --- |
| 16:7 Today hero | activity covers | `sips -c 634 1448` |
| 21:9 program hero | `door-cover` | `sips -c 621 1448` |
| 5:4 welcome panel | `door-cover` | `sips -c 1086 1357` |
| 84 / 56 square | activity covers | `sips -c 1086 1086` then `sips -Z 84` |

See [§2 of the audit](illustration-audit.md) for which surface uses which.

---

## Landing the files

Only after all five are approved. Raw generations stay in `img/pilot/`; none of
the current `IMAGES` keys should be repointed until the style is signed off.

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns/img/pilot" && for f in pilot-*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "${f%.png}.jpg"; done
```

Under the naming scheme proposed in the audit (§3.8) the approved five would
eventually land as `door-sound-01-setup`, `door-greet-07-approach`,
`door-greet-08-petting`, `door-greet-08-jumping` and `door-cover`.

---

## The loop, in four commands

`scripts/pilot.mjs` exists because three things in the ChatGPT round-trip each
cost a wasted cycle: copying a prompt out of a blockquote and taking the `> `
with it, downloads landing as `ChatGPT Image Aug 10, 2026, 11_08_57 AM (5).png`
with nothing to say which scene they are, and the same batch being re-added
twice without anyone noticing until five images had been described back.

```bash
node scripts/pilot.mjs prompt 3a
```
Prints the prompt and puts it on the clipboard, markdown stripped. Scenes `1`–`5`
get Block A and Block B in front of them; round 3 ids (`3a`, `3b`, `3c`) do not,
because they are edits — it prints the file to attach instead.

```bash
node scripts/pilot.mjs add door-cover
```
Takes the newest image from **either `~/Desktop` or `~/Downloads`**, names it,
and files it in the current round. It prints the path it chose, so a wrong pick
is obvious. Pass a path as a second argument to name a specific file instead.

Three things it will not do, each of which cost something once:

- **Copy a file that is still downloading.** It waits for the size to settle. A
  half-written PNG copies happily and reports whatever is in the partial header
  — it once claimed a 1448 × 1086 image was 1920 × 2749.
- **Write over an image that already exists.** It names the file and stops. An
  earlier version overwrote the round 2 cover it was meant to be replacing, and
  since `img/pilot/` is untracked there was nothing to restore it from. Start a
  new round instead: `mkdir img/pilot/round-4`.
- **Accept bytes we already have.** It names the twin. This is what catches a
  batch being re-downloaded and re-added as if it were new.

```bash
node scripts/pilot.mjs check
```
Every image in the current round: dimensions, ratio, a flag on anything that is
not 4:3, and a warning on any duplicate. Writes all four crops from §2 of the
audit into `crops/` so the cover tests do not have to be remembered.

```bash
node scripts/pilot.mjs sheet
```
Builds `sheet.html` — all of them side by side with their dimensions, for
reviewing in one go rather than one file at a time.

Rounds are folders: `img/pilot/round-1/`, `round-2/`, and so on. `add`, `check`
and `sheet` all use the highest-numbered one unless given a path. Start a new
round by making the folder.
