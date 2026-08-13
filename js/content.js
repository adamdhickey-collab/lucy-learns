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
  // in the app, so they will not match their neighbours until the restyle
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
  // behaviour anywhere in it — no jumping, no barking, no bolting past the
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
  //   square landed on floorboards. `door-sound-cover` centres the pair in the
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
    alt: 'A handler feeds Lucy two small treats from a flat open palm while Lucy takes them from her hand.',
  },
  'door-sound-05-settle': {
    src: 'img/door-sound-05-settle.jpg',
    alt: 'Lucy stands relaxed on a slack leash beside her handler in a quiet moment between repetitions, with nothing being asked of her.',
  },
  'door-sound-cover': {
    src: 'img/door-sound-cover.jpg',
    alt: 'A handler crouches beside Lucy well back from the closed front door, one hand resting on her shoulder and the other offering a treat.',
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
  // band, and the centred square holds all three figures whole.
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
    alt: 'Lucy sits with all four paws down while a crouching guest rests an open palm on her chest and her handler holds the leash in a loose loop behind her.',
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
    alt: 'Lucy lies on her bed with her head up, watching her handler walk toward the closed front door.',
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
    alt: 'A handler steps away from Lucy’s bed toward the closed front door while Lucy holds her down on the bed.',
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

  // --- batch 5: the four planned programmes, and the end of the restyle -----
  //
  // The last four painted pictures in the app, and the batch where the rule
  // that governed the other four stopped applying. These render at 84px and
  // nowhere else — one reference each, the locked "soon" card in the library —
  // so the briefs said to draw the thumbnail rather than the illustration:
  // close in, one flat plane behind, everything that matters inside the
  // centred square the card takes. §5 recorded `sr-01` as the busiest
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
  // planned programme is ever written and its cover is promoted to full-size
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
});

// ---------------------------------------------------------------------------
// Goals (how the Activities library is grouped)
// ---------------------------------------------------------------------------

export const GOALS = [
  {
    id: 'door-routine',
    icon: 'goal-door',
    title: 'Door routine',
    blurb: 'Knock or doorbell means look at me and go to your bed.',
  },
  {
    id: 'calm-greetings',
    icon: 'goal-greeting',
    title: 'Calm greetings',
    blurb: 'Four paws down when someone approaches or arrives.',
  },
  {
    id: 'impulse-control',
    icon: 'goal-impulse',
    title: 'Impulse control',
    blurb: 'Pause, listen, and make a calmer choice while excited.',
  },
  {
    id: 'walks-public',
    icon: 'goal-walk',
    title: 'Walks and public encounters',
    blurb: 'Stay with your handler when the world gets interesting.',
  },
  {
    id: 'settle-recovery',
    icon: 'goal-settle',
    title: 'Settle and recovery',
    blurb: 'Come back down after getting excited.',
  },
  {
    id: 'foundation',
    icon: 'goal-foundation',
    title: 'Foundation skills',
    blurb: 'The basics everything else is built on.',
  },
];

/**
 * The next four programs, named but not built.
 *
 * Deliberately a separate shape from ACTIVITIES rather than an activity with
 * `available: false`. A parked activity is written content waiting for a
 * release — it has levels, steps and safety notes, and every screen can render
 * it. These have none of that yet, and giving them an empty `levels` array so
 * they could sit in the same list would put objects into the progress maths
 * that cannot answer the questions it asks. They are placeholders, so they are
 * shaped like placeholders and cannot be opened.
 *
 * Chosen for the dog described in config.js: over-aroused at arrivals and
 * around unfamiliar people. Each one is the next real problem after the door.
 */
export const PLANNED_ACTIVITIES = [
  {
    id: 'planned-greeting',
    icon: 'plan-fourpaws',
    goalId: 'calm-greetings',
    coverImage: 'plan-fourpaws',
    title: 'Four Paws on the Floor',
    shortPurpose: 'Nobody gets touched until all four feet are down.',
    note: 'The door routine handles arrivals. This one handles the jump itself.',
  },
  {
    id: 'planned-settle',
    icon: 'plan-mat',
    goalId: 'settle-recovery',
    coverImage: 'plan-mat',
    title: 'Settle on a Mat',
    shortPurpose: 'Lucy lies down and stays down while the room carries on without her.',
    note: 'The skill underneath the bed work, taken away from the door.',
  },
  {
    id: 'planned-walk',
    icon: 'plan-walkpeople',
    goalId: 'walks-public',
    coverImage: 'plan-walkpeople',
    title: 'People Passing on Walks',
    shortPurpose: 'Someone walks by and Lucy keeps walking with you.',
    note: 'The same arousal as a doorbell, somewhere you cannot close the door.',
  },
  {
    id: 'planned-name',
    icon: 'plan-name',
    goalId: 'foundation',
    coverImage: 'plan-name',
    title: 'Name Response Around Distractions',
    shortPurpose: 'Her name turns her head no matter what else is happening.',
    note: 'Every other activity leans on this one.',
  },
];

// ---------------------------------------------------------------------------
// Household cues
// ---------------------------------------------------------------------------

export const DEFAULT_COMMANDS = [
  { id: 'place', situation: 'Move to bed', cue: 'Go to bed' },
  { id: 'boundary', situation: 'Stay behind boundary', cue: 'Back' },
  { id: 'stay', situation: 'Remain in position', cue: 'Stay' },
  // The one cue that is the dog's own name. Stored as a token rather than a
  // literal so it can follow the name in state — setDog rewrites it, and
  // cueFor resolves it for anyone who never touches the commands screen. It
  // was "Lucy!", which is the right cue for exactly one household.
  { id: 'attention', situation: 'Look toward handler', cue: '{dog}!' },
  { id: 'release', situation: 'End position', cue: 'Okay' },
  { id: 'greet', situation: 'Calm approach', cue: 'Go say hi' },
  { id: 'sit', situation: 'Sit', cue: 'Sit' },
];

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
  { id: 'person_approached', label: 'Person approached Lucy' },
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
  { id: 'ignored', label: 'Person ignored Lucy' },
  { id: 'left', label: 'Left the situation' },
  { id: 'nothing', label: 'Nothing yet' },
];

// ---------------------------------------------------------------------------
// Programs and activities
// ---------------------------------------------------------------------------

export const PROGRAMS = [
  {
    id: 'calm-door-greetings',
    title: 'Calm Door Greetings',
    goalId: 'door-routine',
    coverImage: 'door-cover',
    // Says what the pitch above it does not. On the program screen this sits
    // directly under programPitch, which on a fresh program reads "Four
    // activities, from the first doorbell to a calm hello" — so opening this
    // with the same count and closing it with the same hello left the screen
    // saying one thing twice. This names the four pieces instead.
    blurb:
      'The sound, the wait, the bed, the guest. Each one rebuilds a piece of what happens when someone arrives.',
    // The finish line, written out. It sits at the bottom of the program map so
    // the four activities read as one job with an end, not four errands.
    outcome: {
      title: 'A calm hello, every time',
      eyebrow: 'What finishing looks like',
      body:
        'Someone knocks. Lucy looks at you, goes to her bed, and stays there while you open the door. She greets the guest when you say so, with four paws on the floor.',
      note: 'Finish all four activities and you have the whole sequence, not one piece of it.',
    },
    source: {
      label: 'The Canine Coach handout',
      note:
        'Practice long before real guests arrive. Start with invisible guests, repeat easy sessions, and build muscle memory.',
    },

    /**
     * From the handout's last section, "Answering the door before your dog is
     * reliable". It is the only part of the handout the app had nowhere to put:
     * every activity is practice, and this is what to do when a real guest is
     * at the door and the practice is not finished yet. The "Lucy is too
     * excited" sheet is a different thing again — that is how to make a session
     * easier mid-rep, not how to answer an actual door.
     */
    management: {
      title: 'Before she is reliable',
      intro:
        'A real guest is at the door and the routine is not finished yet. Do not test it. Manage it.',
      branches: [
        {
          when: 'If someone else is home',
          steps: [
            'They answer the door.',
            'You stay next to Lucy and hold the “Back” or “Stay”.',
            'Reward her for holding it while the door is busy.',
          ],
        },
        {
          when: 'If you are on your own',
          steps: [
            'Call Lucy, then take her with you calmly, on leash or with a hand in her collar.',
            'Unlatch the door and say “Just a minute!” through it.',
            'Walk her to her spot and hold the stay.',
            'Now say “Come in!”',
            'Stay with her until she is calm, then escort the guest over for a controlled greeting.',
          ],
        },
      ],
    },
  },
];

// Shared safety guidance shown behind the "Lucy is too excited" button.
const FALLBACK_STEPS = [
  'Move Lucy farther from the door.',
  'Keep her on leash and stay beside her.',
  'Ask the guest to wait, or let someone else answer.',
  'Drop back one level and make it easy again.',
  'Feed her on her bed for staying there.',
  'Skip the greeting entirely if she cannot settle.',
];

export const ACTIVITIES = [
  // -------------------------------------------------------------------------
  {
    id: 'dg-1',
    slug: 'doorbell-predicts-rewards',
    title: 'Doorbell Predicts Rewards',
    programId: 'calm-door-greetings',
    goalId: 'door-routine',
    shortTitle: 'Sound',
    // The mark this activity carries everywhere it appears. See ICONS.
    icon: 'act-sound',
    shortPurpose: 'Lucy hears the doorbell and looks to you instead of the door.',
    coverImage: 'door-sound-cover',
    estimatedMinutes: 5,
    difficulty: 'beginner',
    equipment: ['Lucy on leash', 'Small high-value treats', 'Doorbell or a door to knock on'],
    safetyNotes: [
      'Stop while Lucy is still succeeding, not after she fails.',
      'One sound per repetition. Never repeat the bell to get a reaction.',
      'Talk to her calmly through this if you want to. Keep it low key, nothing exciting.',
    ],
    fallbackImage: 'door-sound-cover',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Stand near the door with Lucy on leash.',
        image: 'door-sound-01-setup',
        helper: 'Step lightly on the leash so both hands stay free.',
      },
      {
        instruction: 'Ring or knock once.',
        image: 'door-sound-02-self',
        helper: 'One sound only, then wait. Let her hear it before you say anything.',
      },
      {
        instruction: 'Say her name in a bright, happy voice.',
        cue: '{dog}!',
        image: 'door-sound-03-name',
      },
      {
        instruction: 'Give two treats right away.',
        image: 'door-sound-04-treats',
        helper:
          'You are paying for the sound, not for good behavior. Feed even if she barked, so the bell starts to mean food instead of alarm.',
      },
      {
        instruction: 'Let her settle, then go again.',
        image: 'door-sound-05-settle',
        helper: 'A few quiet seconds between reps keeps her under threshold.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'You make the sound',
        setup: 'You knock or ring while standing right next to Lucy.',
        // The base step draws dg-20 now, which is this level's picture exactly.
        reps: 5,
        successCriteria: ['No barking on 4 of 5 sounds', 'Turns toward you', 'Takes treats easily'],
      },
      {
        number: 2,
        title: 'Helper makes the sound',
        setup: 'A helper knocks nearby while you stay with Lucy.',
        reps: 5,
        successCriteria: ['No barking on 4 of 5 sounds', 'Turns toward you before the treat'],
        overrides: { 1: { instruction: 'Have your helper knock nearby.', image: 'door-sound-02-knock' } },
      },
      {
        number: 3,
        title: 'Real doorbell from outside',
        setup: 'A helper rings the actual doorbell from the porch.',
        reps: 5,
        successCriteria: ['No barking on 4 of 5 rings', 'Recovers within a few seconds'],
        overrides: { 1: { instruction: 'Helper rings the real doorbell from outside.', image: 'door-sound-02-bell' } },
      },
      {
        number: 4,
        title: 'Call from a few feet away',
        setup: 'After the sound, call Lucy from several feet back.',
        reps: 5,
        successCriteria: ['Comes to you after the sound', 'No charging the door'],
        overrides: {
          2: { instruction: 'Call her name from a few feet away.', cue: '{dog}!', image: 'door-sound-03-name-distant' },
        },
      },
      {
        number: 5,
        title: 'Call from another room',
        setup: 'Call Lucy from the kitchen, bedroom, or living room.',
        reps: 5,
        successCriteria: ['Leaves the door and finds you', 'Arrives without barking'],
        overrides: {
          2: { instruction: 'Call her name from another room.', cue: '{dog}!', image: 'door-sound-03-name-distant' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'dg-2',
    slug: 'stay-while-the-door-opens',
    title: 'Stay While the Door Opens',
    programId: 'calm-door-greetings',
    goalId: 'door-routine',
    shortTitle: 'Stay',
    // The mark this activity carries everywhere it appears. See ICONS.
    icon: 'act-stay',
    shortPurpose: 'Lucy holds her bed while you walk over and open the door.',
    coverImage: 'door-stay-cover',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['Lucy on leash', 'Her bed or a marked boundary', 'Small treats'],
    safetyNotes: [
      'Go back to her to reward. Never call her off the bed to get the treat.',
      'If she breaks position twice in a row, drop back a level.',
      'A boundary works as well as a bed. If you use one, cue “Back” instead of “Go to bed”.',
    ],
    fallbackImage: 'door-stay-04-pay',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Send Lucy to her bed.', cue: 'Go to bed', image: 'door-place-03-send' },
      {
        instruction: 'Cue the stay and hold her eye for one beat.',
        cue: 'Stay',
        image: 'door-stay-02-cue',
      },
      { instruction: 'Move toward the door.', image: 'door-stay-03-cross' },
      {
        // dg-07 showed the handler walking away with nothing in her hands on a
        // step about coming back and paying. dg-25 is that payment, drawn.
        instruction: 'Walk back and reward her on the bed.',
        image: 'door-stay-04-pay',
        helper: 'Deliver the treat between her paws so the bed becomes the paying spot.',
      },
      { instruction: 'Release, then reset for the next rep.', cue: 'Okay', image: 'door-stay-05-release' },
    ],
    levels: [
      {
        number: 1,
        title: 'One step away',
        setup: 'Take a single step toward the door and come straight back.',
        reps: 5,
        successCriteria: ['Stays on the bed', 'No creeping forward'],
        overrides: { 2: { instruction: 'Take one step toward the door.', image: 'door-stay-03-onestep' } },
      },
      {
        number: 2,
        title: 'Halfway to the door',
        setup: 'Walk halfway, pause, then return.',
        reps: 5,
        successCriteria: ['Stays on the bed', 'Waits for the release'],
        overrides: { 2: { instruction: 'Walk halfway to the door, then pause.', image: 'door-stay-03-halfway' } },
      },
      {
        number: 3,
        title: 'Touch the handle',
        setup: 'Walk all the way over and put your hand on the handle.',
        reps: 5,
        successCriteria: ['Stays while you touch the handle'],
        overrides: { 2: { instruction: 'Walk over and touch the door handle.', image: 'door-stay-03-handle' } },
      },
      {
        number: 4,
        title: 'Crack the door',
        setup: 'Open the door a few inches, then close it.',
        reps: 5,
        successCriteria: ['Stays as the door moves', 'No rushing when it opens'],
        overrides: { 2: { instruction: 'Open the door a few inches, then close it.', image: 'door-stay-03-crack' } },
      },
      {
        number: 5,
        title: 'Open it fully',
        setup: 'Open the door all the way and stand in the doorway.',
        reps: 5,
        successCriteria: ['Holds the bed with the door wide open'],
        overrides: { 2: { instruction: 'Open the door all the way and stand there.', image: 'door-stay-03-pretend' } },
      },
      {
        number: 6,
        title: 'Say hi to nobody',
        setup: 'Open the door and say hello to the empty porch.',
        reps: 5,
        successCriteria: ['Stays through your voice at the door'],
        overrides: {
          2: { instruction: 'Open the door and cheerfully say hi to nobody.', image: 'door-stay-03-pretend' },
        },
      },
      {
        number: 7,
        title: 'Imaginary conversation',
        setup: 'Hold a short, realistic conversation with an invisible guest.',
        reps: 4,
        successCriteria: ['Holds the bed for 20 to 30 seconds of talking'],
        overrides: {
          2: {
            instruction: 'Chat with an imaginary guest for twenty seconds.',
            image: 'door-stay-03-conversation',
            helper: 'Use your real greeting voice. The excitement in your tone is the hard part.',
          },
        },
      },
      {
        number: 8,
        title: 'Familiar person outside',
        setup: 'Someone Lucy knows stands outside while you open the door.',
        reps: 4,
        successCriteria: ['Holds the bed while a real person is visible'],
        overrides: {
          2: { instruction: 'Open the door to a familiar person waiting outside.', image: 'door-greet-04-open' },
          4: { instruction: 'Release her, and your helper steps back outside.', image: 'door-greet-09-leaves' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'dg-3',
    slug: 'doorbell-means-place',
    title: 'Doorbell Means Place',
    programId: 'calm-door-greetings',
    goalId: 'door-routine',
    shortTitle: 'Place',
    // The mark this activity carries everywhere it appears. See ICONS.
    icon: 'act-place',
    shortPurpose: 'The doorbell becomes her cue to move away from the door.',
    coverImage: 'door-place-cover',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['Lucy on leash', 'Her bed', 'Small treats', 'Doorbell or a door to knock on'],
    safetyNotes: [
      'Keep the whole sequence smooth before you add a pretend visitor.',
      'If she needs the lure three reps in a row, stay at this level.',
    ],
    fallbackImage: 'door-stay-04-pay',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Ring or knock once.', image: 'door-sound-02-self' },
      { instruction: 'Say her name brightly.', cue: '{dog}!', image: 'door-sound-03-name' },
      { instruction: 'Send her to her bed.', cue: 'Go to bed', image: 'door-place-03-send' },
      { instruction: 'Reward her twice on the bed.', image: 'door-stay-04-pay' },
      {
        instruction: 'Walk toward the door, then come back.',
        image: 'door-stay-03-cross',
        helper: 'Walking away right after she lands teaches her the bed is where the job happens.',
      },
      { instruction: 'Release and reset.', cue: 'Okay', image: 'door-stay-05-release' },
    ],
    levels: [
      {
        number: 1,
        title: 'Lure to the bed',
        setup: 'Lead her to the bed with a treat in your hand.',
        reps: 5,
        successCriteria: ['Follows to the bed', 'Settles once she arrives'],
        overrides: { 2: { instruction: 'Lead her to the bed with a treat.', image: 'door-place-03-send' } },
      },
      {
        number: 2,
        title: 'Point, then pay',
        setup: 'Point to the bed and treat only after she arrives.',
        reps: 5,
        successCriteria: ['Goes to the bed on a point', 'No hand in front of her nose'],
        overrides: { 2: { instruction: 'Point to the bed. Treat after she lands.', image: 'door-place-03-send' } },
      },
      {
        number: 3,
        title: 'Cue only',
        setup: 'Words only. No pointing and no lure.',
        reps: 5,
        successCriteria: ['Goes on the verbal cue alone'],
      },
      {
        number: 4,
        title: 'Straight to the door',
        setup: 'After she lands, walk all the way to the door without hesitating.',
        reps: 5,
        successCriteria: ['Holds the bed while you cross the room', 'Sequence feels fluid'],
        overrides: { 4: { instruction: 'Walk all the way to the door, then return.', image: 'door-stay-03-cross' } },
      },
      {
        number: 5,
        title: 'Add an imaginary visitor',
        setup: 'Open the door and greet an invisible guest before returning.',
        reps: 4,
        successCriteria: ['Stays through the pretend greeting', 'Waits for the release'],
        overrides: {
          4: {
            instruction: 'Open the door and greet an imaginary guest.',
            image: 'door-stay-03-pretend',
            helper: 'Then close the door, walk back, and pay her for staying.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'dg-4',
    slug: 'controlled-real-greeting',
    title: 'Controlled Real Greeting',
    programId: 'calm-door-greetings',
    goalId: 'door-routine',
    shortTitle: 'Greet',
    // The mark this activity carries everywhere it appears. See ICONS.
    icon: 'act-greet',
    shortPurpose: 'A real guest arrives and Lucy greets on your terms.',
    coverImage: 'door-greet-cover',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    equipment: ['Lucy on leash', 'Her bed', 'Small treats', 'A patient familiar guest'],
    safetyNotes: [
      'Brief your guest first. No eye contact, no reaching, no high voices.',
      'If Lucy cannot settle, end the greeting. That is a real result, not a failure.',
      'Pet the chest, never the top of the head.',
      'If she pulls ahead on the way over, step on the leash or put gentle downward pressure on her collar.',
    ],
    fallbackImage: 'door-sound-cover',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Leash Lucy and settle her on her bed.', image: 'door-greet-01-settle' },
      { instruction: 'Your guest rings the bell.', image: 'door-sound-02-bell' },
      { instruction: 'Send her to her bed.', cue: 'Go to bed', image: 'door-place-03-send' },
      { instruction: 'Open the door. The guest stays put.', image: 'door-greet-04-open' },
      { instruction: 'Reward her for holding the bed.', image: 'door-greet-05-reward' },
      { instruction: 'Bring the guest in and let Lucy settle.', image: 'door-greet-06-enter' },
      { instruction: 'Walk her over on a loose leash.', cue: 'Go say hi', image: 'door-greet-07-approach' },
      {
        instruction: 'Ask for a sit, then allow calm petting.',
        cue: 'Sit',
        image: 'door-greet-08-petting',
        // The only step in the app that shows the wrong outcome next to the
        // right one. `avoid` is what turns the figure into a pair; every step
        // without it renders exactly as before. It sits here because the helper
        // below already describes the failure in words — "if her front feet
        // leave the floor" — and a household reading that mid-session should
        // not have to picture it.
        avoid: 'door-greet-08-jumping',
        helper: 'If her front feet leave the floor, the guest stands up and turns away. Reset and try again.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'Guest waits outside',
        setup: 'The guest never comes in. You are only practicing the arrival.',
        reps: 3,
        endAfterStep: 5,
        successCriteria: ['Goes to the bed on cue', 'Holds it with the door open', 'No nipping'],
      },
      {
        number: 2,
        title: 'Guest steps inside',
        setup: 'The guest comes in and stands quietly by the door.',
        reps: 3,
        endAfterStep: 6,
        successCriteria: ['Holds the bed while the guest enters', 'Settles within a few seconds'],
        // The image is the base step's now, so this override only rewords it.
        overrides: { 5: { instruction: 'Guest steps inside and stands still by the door.' } },
      },
      {
        number: 3,
        title: 'Guest sits down',
        setup: 'The guest walks in, sits, and ignores Lucy completely.',
        reps: 3,
        endAfterStep: 6,
        successCriteria: ['Holds the bed while the guest moves through the room'],
        overrides: { 5: { instruction: 'Guest walks in, sits down, and ignores her.', image: 'door-greet-06-seated' } },
      },
      {
        number: 4,
        title: 'Calm hello',
        setup: 'Escort Lucy over for a sit and gentle petting.',
        reps: 3,
        successCriteria: ['Four paws down the whole time', 'Sits before being touched', 'No nipping'],
      },
      {
        number: 5,
        title: 'Less familiar visitor',
        setup: 'Repeat the whole routine with someone Lucy knows less well.',
        reps: 2,
        successCriteria: ['Same routine holds with a newer person', 'Recovers within a minute'],
      },
    ],
  },
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
