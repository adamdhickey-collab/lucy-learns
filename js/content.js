// Seed content for Lucy Learns.
// Everything the app teaches lives here as structured data, so a new handout
// from The Canine Coach becomes a new activity object rather than a new screen.

// Who this install belongs to lives in config.js; re-exported here so views
// keep a single import point for content and configuration alike.
// TRAINER only. DOG and HANDLER used to be re-exported here and read directly
// by six screens, which is what made the household a compile-time constant.
// They are stored state now: import getDog / getPerson from store.js instead.
// The re-export is gone rather than deprecated so that a missed call site is a
// module error at load, not a screen quietly rendering the wrong dog.
export { TRAINER } from './config.js';
export { PRACTICE } from './kinds.js';

import * as doorPack from './content/door.js';
import * as excitedPack from './content/excited.js';
import { PACK } from './pack.js';
import { PRACTICE } from './kinds.js';

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Every illustration ships in two sizes: the 1100px original for full-bleed
 * use and a 240px thumb for the 84px card squares. Cards were pulling the
 * full file — 6.5x the pixels they display, ~190KB to paint an 84px square.
 */
const withThumb = (images) => {
  for (const asset of Object.values(images)) {
    asset.thumb = asset.src.replace('img/', 'img/thumb-');
  }
  return images;
};

export const IMAGES = withThumb({
  // --- the two moments the set never had a picture for ---------------------
  //
  // `dg-07` was carrying three different actions and `dg-09` three more (see
  // docs/illustration-audit.md §3.5). Four of those six already had a correct
  // picture sitting elsewhere in the library and only needed pointing at: the
  // reward-on-the-bed and the guest-coming-in both existed, and `dg-07` and
  // `dg-09` each kept one job of their own. These two had nothing. (All four of
  // those keys have since been redrawn — batch 2 and batch 3 — as
  // `door-stay-04-pay`, `door-greet-06-enter`, `door-stay-03-cross` and
  // `door-greet-04-open`.)
  //
  // They are keyed under the naming scheme from §3.8 rather than the next free
  // dg-NN, because that is where the whole library is going and there is no
  // sense minting two more numbers to rename later.
  //
  // These two were stand-ins for one release — the key pointed at the image the
  // step used before the split, so the app kept rendering while the artwork was
  // made. Both now have their own picture, drawn in the Warm Instructional
  // Vector style the rest of the library is moving to. They are the first two
  // in the app, so they will not match their neighbors until the restyle
  // catches up; a correct picture in the coming style beats a wrong one in the
  // old.
  'door-stay-02-cue': {
    src: 'img/door-stay-02-cue.jpg',
    alt: 'A handler stands beside Lucy’s bed with a flat open palm raised at chest height while Lucy lies on the bed, head up, holding her eye.',
  },
  'door-greet-01-settle': {
    src: 'img/door-greet-01-settle.jpg',
    alt: 'A handler crouches beside Lucy’s bed clipping the leash to her collar, well back from the closed front door.',
  },

  // --- the diptych, taken apart -------------------------------------------
  //
  // `dg-03` put a doorbell press and a knock side by side in one file: two
  // actions in one frame, which breaks the one-action rule, renders as half of
  // each at 84px, and drew Lucy differently in each panel. It was the third
  // most-referenced image in the app.
  //
  // Fourteen references, and seven of them wanted neither panel: "Ring or knock
  // once" is the handler making the sound, which the step-2 picture already
  // shows properly — beside Lucy, leash under the foot. Those now point there,
  // which also fixes the §5 complaint that the one image demonstrating the
  // leash-underfoot technique appeared at exactly one level while the setup
  // shot taught it wrongly six times over. (Both were `dg-20` and `dg-02` when
  // this was written; batch 1 redrew them as `door-sound-02-self` and
  // `door-sound-01-setup`.)
  //
  // These two take the rest, and with them drawn `dg-03` is gone from the app
  // entirely — key, files and precache.
  //
  // First drawn as a disembodied hand in an anonymous sleeve, so it could be
  // "sometimes a helper and sometimes the guest". Batch 7 redrew both with
  // the whole man standing at the door: the floating forearm read as out of
  // proportion, and the anonymity was protecting a distinction the cast
  // never had — the app's one adult male already plays helper and guest.
  // Lucy is no longer in the door's window; the owner took her out of the
  // picture, so the image carries "the sound is being made" and the step
  // text carries what she should do about it.
  'door-sound-02-bell': {
    src: 'img/door-sound-02-bell.jpg',
    alt: 'A visitor at the closed front door presses the doorbell.',
  },
  'door-sound-02-knock': {
    src: 'img/door-sound-02-knock.jpg',
    alt: 'A visitor at the closed front door knocks on it.',
  },

  // --- the one step that shows both outcomes --------------------------------
  //
  // Every other picture in the app shows something going right. This pair is
  // the exception, and the audit's §3.6 found the library had no incorrect
  // behavior anywhere in it — no jumping, no barking, no bolting past the
  // handler.
  //
  // The two are the same room, camera, cast and distance, so the only thing
  // that changes between them is Lucy and the guest's reaction. The error is
  // carried by the taut coral leash and by her posture, with no ✗ or red ring
  // painted on: the style rules those out, and round 1 of the pilot proved they
  // are not needed.
  //
  // This pair renders at step 8 only, and deliberately does not cover the
  // activity: the cover crops to 16:7 on Today and to a 56px square on the map,
  // and the petting frame loses the guest's head to the 16:7 band (§7.2). It
  // used to be `dg-11`'s job for that reason; batch 2 drew `door-greet-cover`
  // to take it properly rather than leave a painted cover on a redrawn activity.
  'door-greet-08-petting': {
    src: 'img/door-greet-08-petting.jpg',
    alt: 'Lucy sits with all four paws on the floor while a crouching guest rests an open palm on her chest and her handler holds the leash slack behind her.',
  },
  'door-greet-08-jumping': {
    src: 'img/door-greet-08-jumping.jpg',
    alt: 'Lucy rears up with both front paws on the guest’s chest, mouth open and ears back, while he leans away and the leash pulls tight.',
  },

  // --- batch 1: the whole of Doorbell Predicts Rewards ----------------------
  //
  // The first activity to be restyled end to end. The unit is the activity
  // rather than the reference count on purpose: while the library is half
  // redrawn, every session is a mix, and a household notices that inside a
  // five-minute run far more than it notices one picture being newer than
  // another. Finish what one activity touches, install it together, and that
  // session is consistent even while the rest of the app is not.
  //
  // Each is also a fix, not only a restyle — §5 of the audit had a defect
  // recorded against most of what these replace:
  //
  //   `dg-04` already had treats in an open palm, which is the *next* step's
  //   job, so the beat it existed to show was skipped. `door-sound-03-name`
  //   has the handler's hands empty.
  //
  //   `dg-05` had Lucy facing the door, away from the handler calling her —
  //   it illustrated the step failing. She now turns toward the voice, and is
  //   large enough in frame to read on a phone, which the old one was not.
  //
  //   `dg-24` put Lucy hard left with two-thirds empty hallway, so the 56px
  //   square landed on floorboards. `door-sound-cover` centers the pair in the
  //   middle band; the square now holds her head, the hand on her shoulder and
  //   the treat.
  //
  // The leash is in every one of them, including the four that are not about
  // the leash. The briefs originally named it only where it did something, and
  // the first generation came back with Lucy in nothing but her collar —
  // correctly, since nothing had asked. Run the five steps in order like that
  // and the leash appears, vanishes for two steps, and returns.
  'door-cover': {
    src: 'img/door-cover.jpg',
    alt: 'Lucy sits on her bed a few feet inside the entryway while a visitor stands in the open doorway and a handler holds a loose leash.',
  },
  'door-sound-01-setup': {
    src: 'img/door-sound-01-setup.jpg',
    alt: 'Lucy sits beside her handler near the closed front door with the leash running down under the handler’s shoe.',
  },
  // Levels 4 and 5 of Doorbell Predicts Rewards call her from across the
  // house, and their first step drew 01-setup — handler beside her, leash
  // under a shoe — over words saying to walk away with the leash off. This is
  // the moment before 03-name-distant, drawn in the same hall.
  'door-sound-01-apart': {
    src: 'img/door-sound-01-apart.jpg',
    alt: 'Lucy lies settled on her bed near the closed front door, watching her handler walk away from her across the hall.',
  },
  'door-sound-02-self': {
    src: 'img/door-sound-02-self.jpg',
    alt: 'A handler knocks on the door frame while standing right beside Lucy with the leash under her foot.',
  },
  'door-sound-03-name': {
    src: 'img/door-sound-03-name.jpg',
    alt: 'Lucy turns away from the door to look up at her handler, who crouches beside her at her level with both hands empty.',
  },
  'door-sound-03-name-distant': {
    src: 'img/door-sound-03-name-distant.jpg',
    alt: 'Lucy sits on her bed near the front door and turns her head toward her handler, who is beckoning from the far end of the hallway.',
  },
  'door-sound-04-treats': {
    src: 'img/door-sound-04-treats.jpg',
    alt: 'A flat open palm held out at Lucy’s head height, cropped close, with Lucy sitting and looking up at it.',
  },
  'door-sound-05-settle': {
    src: 'img/door-sound-05-settle.jpg',
    alt: 'Lucy stands relaxed on a slack leash beside her handler in a quiet moment between repetitions, with nothing being asked of her.',
  },
  'door-sound-cover': {
    src: 'img/door-sound-cover.jpg',
    alt: 'Lucy and her handler close together and face to face, the handler’s hand resting on Lucy’s chest.',
  },

  // --- batch 2: the whole of Controlled Real Greeting -----------------------
  //
  // Same unit as batch 1 — the activity, not the reference count. Three of this
  // activity's pictures were already new (`door-greet-01-settle`,
  // `door-sound-02-bell`, and the petting/jumping pair at step 8), and
  // `door-greet-07-approach` had been approved since round 3 and never wired
  // up, which is the same trap `door-sound-01-setup` was in.
  //
  // The §5 defects these close:
  //
  //   `dg-06` had the direction backwards — Lucy already standing on the bed,
  //   facing off it, walking toward the pointing hand, on a step that says send
  //   her to it. Twenty-two references, the second most-used image in the app.
  //   `door-place-03-send` has her mid-stride onto the bed with the pointing
  //   hand behind her, and puts the door in frame, which the old one never did.
  //
  //   `dg-09` had no handler and no leash anywhere in it, on a step whose whole
  //   instruction is to hold her on the bed on one.
  //
  //   `dg-12` showed no treat at all, and the handler bending from the waist
  //   over the dog — the posture the trainer's guidance specifically avoids.
  //
  //   `dg-22` was the most cluttered composition in the library: two seated
  //   figures, sofa, armchair, side table, rug, plant, framed picture, doormat
  //   and door. It is now armchair, sofa, bed, wall and floor.
  //
  // `door-greet-cover` is new rather than a redraw. `dg-11` was the activity
  // cover and the approved art that replaced it at step 8 loses the guest's
  // head to the 16:7 Today band (§7.2). That was an acceptable trade for a step
  // image; it is not for a cover, now that batch 1 has shown a cover drawn to an
  // explicit composition constraint passes all three crops first time. Here the
  // guest's head, the hand on Lucy's chest and her four-paws-down sit inside the
  // band, and the centered square holds all three figures whole.
  //
  // dg-4's fallback moved off `dg-26` entirely. That key was doing an ending and
  // a de-escalation at once, which are different messages. The "Lucy is too
  // excited" sheet reads "move Lucy farther from the door / keep her on leash
  // and stay beside her / feed her on her bed", and `door-sound-cover` is that
  // picture already — so the fallback points there and `door-greet-09-leaves`
  // keeps the ending, which is its one real job.
  'door-place-03-send': {
    src: 'img/door-place-03-send.jpg',
    alt: 'Lucy steps onto her bed as her handler points to it from behind her, near the closed front door.',
  },
  'door-greet-04-open': {
    src: 'img/door-greet-04-open.jpg',
    alt: 'Lucy sits on her bed on a slack leash while her handler stands beside her holding it and a guest waits outside the open door.',
  },
  'door-greet-05-reward': {
    src: 'img/door-greet-05-reward.jpg',
    alt: 'A handler crouches to feed Lucy a treat on her bed while a guest waits at the open door.',
  },
  'door-greet-06-enter': {
    src: 'img/door-greet-06-enter.jpg',
    alt: 'A guest stands just inside the closed front door looking at the handler, while Lucy lies on her bed on a slack leash.',
  },
  'door-greet-06-seated': {
    src: 'img/door-greet-06-seated.jpg',
    alt: 'A guest sits in an armchair and the handler sits on a sofa, neither looking at Lucy, while she lies settled on her bed between them.',
  },
  'door-greet-07-approach': {
    src: 'img/door-greet-07-approach.jpg',
    alt: 'A handler walks Lucy toward a waiting guest with the leash short and slack between them.',
  },
  'door-greet-09-leaves': {
    src: 'img/door-greet-09-leaves.jpg',
    alt: 'A guest steps back out through the open door with a small wave while Lucy stays sitting at her handler’s side on leash.',
  },
  'door-greet-cover': {
    src: 'img/door-greet-cover.jpg',
    alt: 'Lucy sits at her handler’s side on a slack leash while a guest stands a step away with his hands at his sides, the open front door behind him.',
  },

  // --- batch 3: the whole of Doorbell Means Place ---------------------------
  //
  // The third activity, and the smallest batch, because three of dg-3's seven
  // pictures had already arrived with batches 1 and 2. The four that were left
  // turned out to belong to dg-2 as much as to dg-3 — `dg-25` was dg-2's cover
  // and its step 4, `dg-07` its step 3, `dg-19` its step 5, `dg-08` its L5 and
  // L6 override — so they are keyed into dg-2's step numbering beside
  // `door-stay-02-cue`, and dg-2 arrives at batch 4 with five of eleven done.
  //
  // The §5 defects: `dg-07` was the most-used image in the app at thirty
  // references and carried three actions; §7.4 took two away and this draws the
  // one it kept. `dg-19` read as a near-mirror of "go to your bed" — two of the
  // most-used pictures meaning opposite things — so this one bans a pointing
  // finger from the frame and puts her stepping *off* the bed toward open hands.
  // `dg-08` painted the imaginary visitor as a translucent blue figure baked
  // into the artwork, which the style rules out and which read as a ghost; the
  // porch is simply empty now, and her bed is back from the door rather than
  // against it.
  //
  // `door-place-cover` is new. dg-3's cover had been `door-place-03-send` since
  // batch 2, and that image failed the Today band three times running: sliced
  // across the eyes, then decapitated at the shoulders. It is geometry, not
  // prompting — the band keeps 58% of the frame height and a standing adult plus
  // a floor-level bed does not fit in it. Every cover that passed first time has
  // a crouching or kneeling human. So dg-3 got its own, and it is mirrored
  // against `door-stay-04-pay` on purpose: the first attempt passed every crop
  // and still failed, because at 56px it was the same picture as dg-2's cover
  // and those two thumbnails sit side by side on the program map rail.
  'door-place-cover': {
    src: 'img/door-place-cover.jpg',
    alt: 'Lucy lies settled on her bed while her handler crouches beside her, well back from the closed front door.',
  },
  'door-stay-03-cross': {
    src: 'img/door-stay-03-cross.jpg',
    alt: 'Lucy holds her down on her bed while her handler walks away across the room toward the closed front door.',
  },
  'door-stay-03-pretend': {
    src: 'img/door-stay-03-pretend.jpg',
    alt: 'A handler stands in the open doorway talking to an empty porch while Lucy stays on her bed.',
  },
  // dg-2's cover, split off from the reward picture.
  //
  // `door-stay-04-pay` covered this activity as well as being its step 4 and
  // the fallback for two activities. At 56px on the program map that made it a
  // person crouched low beside a dark dog — which is what dg-1's and dg-3's
  // covers were too, so three of the four rails were the same silhouette and a
  // blind test had six of twelve matches come back as guesses. This one is the
  // open door instead: a bright vertical slab with Lucy small and far from it,
  // a shape no other cover has. The reward picture keeps its other three jobs
  // unchanged.
  'door-stay-cover': {
    src: 'img/door-stay-cover.jpg',
    alt: 'A handler holds the front door wide open onto daylight while Lucy stays lying on her bed across the room.',
  },
  'door-stay-04-pay': {
    src: 'img/door-stay-04-pay.jpg',
    alt: 'A handler kneels beside Lucy’s bed and feeds her a treat for staying in place.',
  },
  'door-stay-05-release': {
    src: 'img/door-stay-05-release.jpg',
    alt: 'Lucy steps off her bed toward her handler’s open hands as she is released from the stay.',
  },

  // --- batch 4: the distance ladder, and the last of the dg-NN keys ---------
  //
  // dg-2 was planned as the largest batch at eleven. Batches 1 to 3 handed it
  // its cover, its fallback and steps 1, 2, 4 and 5, so what was left was step 3
  // alone — the one step the level ladder rewrites eight times. Five of those
  // eight needed drawing and they are here; with them, every activity in the app
  // is redrawn and no `dg-NN` key exists any more.
  //
  // The first four are one composition at four points on the same walk: one step
  // from the bed, halfway and stopped, hand on the handle, door open a hand's
  // width. A household climbs L1 to L4 over days, so the only thing that may
  // change between the frames is the handler's distance and the state of the
  // door. They were generated in one sitting with each frame attached to the
  // last, and it worked — the left edge of the bed lands within four pixels
  // across all four, and the floor drifts 0.03 in saturation end to end.
  //
  // §5 flags the ladder as indistinguishable at 56px and calls that acceptable
  // because it never renders as a thumbnail. That is right, and it inverts the
  // job: there are no crop constraints on any of these, and the requirement is
  // that they read apart from *each other* at full size and in sequence.
  //
  // Two of them exist to not look like something else. `door-stay-03-halfway`
  // is stopped and turned back, against `door-stay-03-cross`, which is walking
  // away mid-stride — §5 called those two near-duplicates. And
  // `door-stay-03-conversation` leans on the door with a hand in a pocket,
  // against `door-stay-03-pretend` one level earlier, which stands in the
  // doorway for a quick hello.
  //
  // `dg-13`'s recorded defect was that no step was being taken on the level
  // whose whole subject is the first single step. `dg-16`'s replacement took two
  // goes: "open a hand's width" was too small an instruction to register and
  // came back as a shut door with a hand resting on its edge, which is the same
  // picture as the handle frame before it. The brief now asks for a full-height
  // stripe of daylight and says a shut door is a reject.
  'door-stay-03-onestep': {
    src: 'img/door-stay-03-onestep.jpg',
    alt: 'A handler stands one step from Lucy’s bed looking down at her, the closed front door still across the room, while Lucy holds her down.',
  },
  'door-stay-03-halfway': {
    src: 'img/door-stay-03-halfway.jpg',
    alt: 'Lucy holds her bed while a handler pauses halfway across the room and glances back at her.',
  },
  'door-stay-03-handle': {
    src: 'img/door-stay-03-handle.jpg',
    alt: 'A handler rests a hand on the front door handle while Lucy holds her bed across the room.',
  },
  'door-stay-03-crack': {
    src: 'img/door-stay-03-crack.jpg',
    alt: 'A handler holds the front door open a few inches onto daylight while Lucy stays lying on her bed.',
  },
  'door-stay-03-conversation': {
    src: 'img/door-stay-03-conversation.jpg',
    alt: 'A handler leans on the open front door talking to an empty porch while Lucy stays settled on her bed across the room.',
  },

  // --- batch 5: the four planned programs, and the end of the restyle -----
  //
  // The last four painted pictures in the app, and the batch where the rule
  // that governed the other four stopped applying. These render at 84px and
  // nowhere else — one reference each, the locked "soon" card in the library —
  // so the briefs said to draw the thumbnail rather than the illustration:
  // close in, one flat plane behind, everything that matters inside the
  // centered square the card takes. §5 recorded `sr-01` as the busiest
  // background in the library and "mush at 84px"; its replacement is a wall, a
  // floor, a mat, a sleeping dog and the lower legs of somebody nearby.
  //
  // `fd-01` was the only one with a real §5 defect and it had two: Lucy
  // looking up and past the handler — the picture showed the step failing —
  // and a white blaze up her muzzle that appears in no other image. Its
  // replacement took two generations; the first turned her head correctly and
  // sent her eyes into the middle distance, the same defect again.
  //
  // Known drift, accepted deliberately: all four are closer to a smooth-coated
  // Labrador than the wirehaired mix (worst on the first three; the `plan-name`
  // re-run got the scruff back). Invisible at the only size these render. If a
  // planned program is ever written and its cover is promoted to full-size
  // surfaces, redraw these first.
  //
  // Keyed to the icons the cards already carry (see ICONS plan-*) rather than
  // minting a fifth naming family for four files.
  'plan-fourpaws': {
    src: 'img/plan-fourpaws.jpg',
    alt: 'Lucy stands with all four paws on the floor, looking up at a person who keeps their hands together at their waist.',
  },
  'plan-mat': {
    src: 'img/plan-mat.jpg',
    alt: 'Lucy lies flat on her side asleep on her mat while someone sits quietly nearby.',
  },
  'plan-walkpeople': {
    src: 'img/plan-walkpeople.jpg',
    alt: 'Lucy walks on a loose leash looking up at her handler as a stranger passes behind them.',
  },
  'plan-name': {
    src: 'img/plan-name.jpg',
    alt: 'Lucy turns her head to meet her crouching handler\u2019s eyes while a squirrel sits ignored on the grass behind her.',
  },

  // --- drawn for the boot camp pack ---------------------------------------
  //
  // The first picture added to this library rather than redrawn into it. The
  // door set has thirty-seven scenes and not one of them shows a toy, a trick
  // or a dog occupying herself, which is most of what the second curriculum
  // teaches. It lives here rather than with the pack, because the library is
  // the app's artwork: a picture of Lucy playing tug is no more owned by one
  // curriculum than a picture of her on her bed is.
  'play-tug': {
    src: 'img/play-tug.jpg',
    alt:
      'Lucy and her handler each hold one end of a long rope toy, pulling level with each other while all four of Lucy’s paws stay on the floor.',
  },
  'play-weave': {
    src: 'img/play-weave.jpg',
    alt:
      'Lucy walks between her handler’s planted feet, her head and chest out one side of the near leg while her tail is still on the other.',
  },
  'calm-foodtoy': {
    src: 'img/calm-foodtoy.jpg',
    alt:
      'Lucy lies on her bed with a dark rubber food toy held upright between her front paws, nose lowered to it, nobody else in the room.',
  },
});

/**
 * The done screen's verdict, as a picture. One per key `recommendation()` in
 * metrics.js can return: Lucy alone on a flat field whose colour is the
 * state, so the outcome reads from across the room before the title does.
 *
 * Outside IMAGES on purpose. These are 3:1 strips with no thumb, and
 * `withThumb` would invent a `thumb-` path for each that nothing renders and
 * `verify` would then demand on disk. They are also not instructional
 * pictures — nothing in the ladder points at them — so they have no worklist
 * row and no scene spec; the sources are art/source/verdicts/ and the prompts
 * are art/source/prompts-done-verdicts.md.
 *
 * The alt text says what Lucy is doing, not what the verdict is: the title
 * directly beneath already says that, and a screen reader would hear it twice.
 */
export const VERDICT_ART = {
  'good-call-stopping': {
    src: 'img/verdicts/good-call-stopping.jpg',
    alt: 'Lucy standing with her eyes closed, mid shake-off, ears flung out, on a denim-blue floor.',
  },
  'session-logged': {
    src: 'img/verdicts/session-logged.jpg',
    alt: 'Lucy curled up asleep on her grey bed, nose to tail.',
  },
  'take-the-pressure-off': {
    src: 'img/verdicts/take-the-pressure-off.jpg',
    alt: 'Lucy walking calmly away from the closed front door toward her bed at the far side of the room.',
  },
  'ready-for-next-step': {
    src: 'img/verdicts/ready-for-next-step.jpg',
    alt: 'Lucy trotting to the right with her head high and her tail up, on a gold floor.',
  },
  'nice-progress': {
    src: 'img/verdicts/nice-progress.jpg',
    alt: 'Lucy sitting tall and facing you with a relaxed open-mouthed pant, on a deep green floor.',
  },
  'coming-along': {
    src: 'img/verdicts/coming-along.jpg',
    alt: 'Lucy lying chest-down with her forelegs out and her head tilted, listening, on a lilac floor.',
  },
  'make-it-easier': {
    src: 'img/verdicts/make-it-easier.jpg',
    alt: 'Lucy standing with her weight back, looking over her shoulder toward you, on a rose floor.',
  },
};


// ---------------------------------------------------------------------------
// Dog avatars
// ---------------------------------------------------------------------------

/**
 * The portraits a household can put on their own dog.
 *
 * Every illustration in this app is one specific black Labrador mix, which is
 * the app's oldest unfixable problem: somebody who sets up "Rufus, golden
 * retriever" meets Lucy in thirty scenes. The scenes cannot be regenerated per
 * breed. The one picture that is *about* their dog rather than about a
 * technique can be, and this is that picture.
 *
 * Ten, chosen for coverage of shape rather than registration numbers — the
 * question being answered is "which looks like my dog", not "which breed is
 * mine". The reasoning is in art/source/prompts-dog-avatars.txt.
 *
 * PNG, having been JPEG, having been PNG. The format has followed the art
 * both times rather than being argued in the abstract. The painted set was
 * soft fur and graded light with no hard edges to ring around, so JPEG cost
 * nothing and saved most of the weight. This set is flat and cool to match
 * the thirty scenes, and flat colour behind crisp edges is the one case JPEG
 * handles worst — the ringing lands exactly on the outlines that carry these
 * drawings.
 *
 * The price is real and worth stating: 2.3MB against the painted set's 340KB,
 * on a shell the service worker precaches in full before the app will open
 * offline. Two thirds of that is the dogs, at 400px against the handlers'
 * 300px. What makes it payable is that the pictures are opaque and the alpha
 * channel is dead weight — dropping it and filtering each row adaptively took
 * 3.8MB to 2.3MB with the pixels untouched, so what ships is the smallest
 * lossless form of exactly what was drawn.
 *
 * `label` is the accessible name and is no longer printed on the tile. The
 * question a household is answering here is "which one looks like my dog",
 * and they answer it by looking; a caption reading "Staffordshire or pit
 * type" under a picture invites an argument about breed that the app has no
 * stake in and often cannot win — plenty of dogs are a guess in a coat. The
 * pictures are the content, so the grid is pictures.
 *
 * The names stay in `label` because a screen reader still needs to hear
 * something other than "button", and `short` stays beside it because voice
 * control matches on the accessible name: somebody saying "Golden" should
 * land on the golden retriever.
 */
/**
 * The handler's own portrait, and the name that comes with it.
 *
 * The names are the point, not a label on a picture. "Barkitect" and "Oracle
 * of Obedience" are the reason this screen is worth opening twice, and a
 * household that has been told their dog is failing at the front door can
 * stand to be handed something light on the way in. They are also the one
 * moment of play the app allows itself: everything after this is counting
 * repetitions honestly, so the joke belongs here, before any of that starts,
 * and nowhere near a screen that reports how the dog is doing.
 *
 * The first is the handler from the illustrations — the same green hoodie and
 * ponytail who appears in thirty scenes — which is why she is the default. It
 * is the one choice that makes the pictures agree with the profile.
 *
 * The second is "Pixel Whisperer". It arrived as "Adam Pixel Whisperer" and
 * went back and forth: trimmed here, restored on the grounds that a character
 * with a first name is funnier than a job title, and trimmed again once the
 * portrait behind it stopped being a likeness of anybody in particular. The
 * name followed the picture, which is the right order for the two to move in.
 */
export const PERSON_AVATARS = [
  { id: 'handler', name: 'The Handler', src: 'img/avatars/people/person-01.png' },
  { id: 'pixel', name: 'Pixel Whisperer', src: 'img/avatars/people/person-02.png' },
  { id: 'professor', name: 'Professor Fetch', src: 'img/avatars/people/person-03.png' },
  { id: 'disco', name: 'Disco Dog Coach', src: 'img/avatars/people/person-04.png' },
  { id: 'zen', name: 'Zen Leash Master', src: 'img/avatars/people/person-05.png' },
  { id: 'detective', name: 'Treat Detective', src: 'img/avatars/people/person-06.png' },
  { id: 'barkitect', name: 'Barkitect', src: 'img/avatars/people/person-07.png' },
  { id: 'rockstar', name: 'Agility Rockstar', src: 'img/avatars/people/person-08.png' },
  { id: 'cowboy', name: 'Fetch Cowboy', src: 'img/avatars/people/person-09.png' },
  { id: 'cosmonaut', name: 'Canine Cosmonaut', src: 'img/avatars/people/person-10.png' },
  { id: 'sage', name: 'Woodland Sage', src: 'img/avatars/people/person-11.png' },
  { id: 'aerobics', name: 'Retro Aerobics Ace', src: 'img/avatars/people/person-12.png' },
  { id: 'oracle', name: 'Oracle of Obedience', src: 'img/avatars/people/person-13.png' },
  { id: 'duke', name: 'Duke of Drool', src: 'img/avatars/people/person-14.png' },
];

export const personAvatar = (id) =>
  PERSON_AVATARS.find((a) => a.id === id) || PERSON_AVATARS[0];

export const DOG_AVATARS = [
  { id: 'lab-black', label: 'Black Labrador', short: 'Black Lab', src: 'img/avatars/dog-01.png' },
  { id: 'golden', label: 'Golden Retriever', short: 'Golden', src: 'img/avatars/dog-02.png' },
  { id: 'shepherd', label: 'German Shepherd', short: 'Shepherd', src: 'img/avatars/dog-03.png' },
  { id: 'frenchie', label: 'French Bulldog', short: 'Bulldog', src: 'img/avatars/dog-04.png' },
  { id: 'poodle', label: 'Poodle or doodle', short: 'Poodle', src: 'img/avatars/dog-05.png' },
  { id: 'dachshund', label: 'Dachshund', short: 'Dachshund', src: 'img/avatars/dog-06.png' },
  { id: 'beagle', label: 'Beagle', short: 'Beagle', src: 'img/avatars/dog-07.png' },
  { id: 'collie', label: 'Border Collie', short: 'Collie', src: 'img/avatars/dog-08.png' },
  {
    id: 'staffy',
    label: 'Staffordshire or pit type',
    short: 'Pit type',
    src: 'img/avatars/dog-09.png',
  },
  {
    id: 'shihtzu',
    label: 'Shih Tzu or small fluffy',
    short: 'Small fluffy',
    src: 'img/avatars/dog-10.png',
  },
];

// ---------------------------------------------------------------------------
// The curriculum (whichever one this page is teaching)
// ---------------------------------------------------------------------------

/**
 * Goals, programs, activities and cues come from a pack; everything else in
 * this file is true whatever the app is teaching.
 *
 * Both packs are imported rather than one, because a static import is the only
 * kind this app has — there is no build step to tree-shake the loser and no
 * bundler to split them. The cost is the unused pack's text in every load,
 * which is a few tens of kilobytes next to a precache holding thirty-three
 * photographs. The thing it buys is that there is exactly one app: one engine,
 * one service worker, one set of screens, and no second copy of any of it to
 * drift out of step.
 *
 * Re-exported one name at a time rather than with `export *` because this list
 * is the contract a pack has to meet, and it is worth being able to read it in
 * one place. `export *` would say nothing about what a pack owes the app, and
 * would quietly forward a typo'd name as well as a real one.
 */
const PACKS = { door: doorPack, excited: excitedPack };
const pack = PACKS[PACK];

export const GOALS = pack.GOALS;
export const PLANNED_ACTIVITIES = pack.PLANNED_ACTIVITIES;
export const DEFAULT_COMMANDS = pack.DEFAULT_COMMANDS;
export const PROGRAMS = pack.PROGRAMS;
export const ACTIVITIES = pack.ACTIVITIES;

/**
 * Whether this pack wants the welcome flow.
 *
 * The door app is somebody's real training record and starts at the welcome,
 * which is where the dog gets named. The boot camp pack is a second app for a
 * household that has already answered all of that, so it declares itself set up
 * and store.js seeds Fabiola and Lucy from config.js the way it always has.
 */
export const SKIP_SETUP = pack.SKIP_SETUP === true;



// ---------------------------------------------------------------------------
// Session logging vocabulary
// ---------------------------------------------------------------------------

export const AROUSAL = [
  // `short` fits the one-word stat tile on the recommendation screen.
  { value: 1, label: 'Calm', short: 'Calm', hint: 'Took treats, stayed loose' },
  { value: 2, label: 'Some excitement', short: 'Wiggly', hint: 'Wiggly but listening' },
  { value: 3, label: 'Very excited', short: 'Wired', hint: 'Hard to reach, still recovered' },
  { value: 4, label: 'Could not complete', short: 'Stopped', hint: 'We stopped early' },
];

export const BEHAVIORS = [
  { id: 'looked_at_handler', label: 'Looked at me', tone: 'good' },
  { id: 'went_to_place', label: 'Went to place', tone: 'good' },
  { id: 'held_place', label: 'Stayed', tone: 'good' },
  { id: 'four_paws_down', label: 'Four paws down', tone: 'good' },
  { id: 'sat_for_greeting', label: 'Sat for greeting', tone: 'good' },
  { id: 'recovered_quickly', label: 'Recovered quickly', tone: 'good' },
  { id: 'barked', label: 'Barked', tone: 'watch' },
  { id: 'jumped', label: 'Jumped', tone: 'watch' },
  { id: 'nipped', label: 'Nipped', tone: 'watch' },
  { id: 'pulled', label: 'Pulled', tone: 'watch' },
  { id: 'broke_position', label: 'Broke position', tone: 'watch' },
];

export const ASSISTANCE = [
  { id: 'none', label: 'None' },
  { id: 'verbal_cue', label: 'Verbal cue' },
  { id: 'treat_lure', label: 'Treat lure' },
  { id: 'leash_guidance', label: 'Leash guidance' },
  { id: 'reduced_distance', label: 'Reduced distance' },
  { id: 'guest_waited', label: 'Guest waited' },
  { id: 'session_ended', label: 'Session ended' },
];

export const RECOVERY_BANDS = [
  { id: 'under_30', label: 'Under 30 seconds', seconds: 20 },
  { id: '30_60', label: '30 to 60 seconds', seconds: 45 },
  { id: '1_3', label: '1 to 3 minutes', seconds: 120 },
  { id: 'over_3', label: 'More than 3 minutes', seconds: 240 },
  { id: 'never', label: 'Did not settle', seconds: null },
];

// Quick incident logging
export const INCIDENT_CONTEXTS = [
  { id: 'guest_arrived', label: 'Guest arrived' },
  { id: 'walk_person', label: 'Met someone on a walk' },
  { id: 'family_gathering', label: 'Family gathering' },
  { id: 'person_approached', label: 'Person approached {dog}' },
  { id: 'unexpected_doorbell', label: 'Unexpected doorbell' },
  { id: 'other', label: 'Something else' },
];

export const INCIDENT_RESPONSES = [
  { id: 'calm', label: 'Calm', tone: 'good' },
  { id: 'barked', label: 'Barked', tone: 'watch' },
  { id: 'jumped', label: 'Jumped', tone: 'watch' },
  { id: 'nipped', label: 'Nipped', tone: 'watch' },
  { id: 'pulled', label: 'Pulled', tone: 'watch' },
  { id: 'could_not_settle', label: 'Could not settle', tone: 'watch' },
];

export const INCIDENT_HELPERS = [
  { id: 'treats', label: 'Treats' },
  { id: 'place', label: 'Place' },
  { id: 'distance', label: 'Distance' },
  { id: 'leash', label: 'Leash' },
  { id: 'ignored', label: 'Person ignored {dog}' },
  { id: 'left', label: 'Left the situation' },
  { id: 'nothing', label: 'Nothing yet' },
];


// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * What the household can actually open today.
 *
 * `available: false` parks an activity without deleting it: it keeps its place
 * in the program map as a "coming soon" station, so the shape of the whole
 * arrival sequence stays visible, but it cannot be started and it does not
 * count toward any total the household is asked to move.
 *
 * Lookups deliberately stay on the full ACTIVITIES list. A session logged
 * against a parked activity still has to render with its real title in the
 * log, the report, and the CSV.
 */
export const LIVE_ACTIVITIES = ACTIVITIES.filter((a) => a.available !== false);

export const isAvailable = (activity) => Boolean(activity) && activity.available !== false;

/**
 * Some exercises are not repeated, and saying so is the whole of this flag.
 *
 * Almost everything in both curricula is a drill: a short thing you do, watch,
 * and do again, five times in five minutes, where the count is what makes the
 * observation worth anything. Four exercises in the boot camp pack are not.
 * Speed Drill Sits is thirty seconds of chasing, with no pause for a verdict
 * between one sit and the next. Tug is a game. Invisible Dog is an hour with a leash on and the dog ignored.
 * Interactive Toys is dinner in a puzzle and then leaving the room. You do
 * each of them once and you are done, and the handout asks for them daily
 * rather than five times over.
 *
 * Written as `kind` rather than as `reps: 1` because those are different
 * claims. A level with one repetition is a drill you only have time to do
 * once; a practice has no repetitions to count, and the difference shows on
 * screen -- "Rep 1 of 1" is the app counting to one in front of somebody who
 * was never going to do it twice.
 *
 * Absent means drill, so every level of the door pack and most of the boot
 * camp is untouched by this existing.
 */
export const isPractice = (activity) => Boolean(activity) && activity.kind === PRACTICE;

export const activityBySlug = (slug) => ACTIVITIES.find((a) => a.slug === slug);
export const activityById = (id) => ACTIVITIES.find((a) => a.id === id);
export const goalById = (id) => GOALS.find((g) => g.id === id);
export const programById = (id) => PROGRAMS.find((p) => p.id === id);

/** Compose the step list for one level, applying that level's overrides. */
export function stepsForLevel(activity, level) {
  const steps = activity.steps.map((step, i) => {
    const override = level.overrides && level.overrides[i];
    return { position: i + 1, ...step, ...(override || {}) };
  });
  const end = level.endAfterStep || steps.length;
  return steps.slice(0, end);
}

export const levelOf = (activity, number) =>
  activity.levels.find((l) => l.number === number) || activity.levels[0];
