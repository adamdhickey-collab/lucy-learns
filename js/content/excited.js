// The "I'm So Excited!" boot camp curriculum, from The Canine Coach's homework
// handout.
//
// A pack, in the sense js/content.js means it: goals, programs, activities and
// household cues, and nothing else. The picture library, the verdict art and
// the logging vocabulary are shared with every other pack and live in
// content.js. See js/pack.js for how this one gets chosen.
//
// Three things make this curriculum look different from the door program:
//
// Almost nothing is illustrated. The handout is eight pages of text with no
// pictures in it, and the app it becomes is deliberately the same: one cover
// per exercise, taken from artwork that already exists, and steps that are
// words. The player already renders a step with no `image` — it draws no
// figure at all — so this needs nothing added to make it work.
//
// The handout is written as frequencies rather than repetitions: "DO THIS
// daily", "once or twice a week". The app counts reps and has no field for a
// cadence, so for now each level says its frequency in its own `setup` line,
// where the handler reads it before starting. A real `cadence` field that
// Today could act on is a decision still open.
//
// Thirteen exercises are four programs, not one. The handout is a single sheet
// and the honest shape of it is a single program, but a program renders as a
// route of labelled stops across the width of a phone, and thirteen of those
// is a row nobody can read. Four themed routes of two to four stops each is
// the shape the app already draws well, and it is also the shape the
// Activities screen expects, which looks for one program per goal.

// This pack is a second app for a household that has already told the first one
// who they are, so it skips the welcome. store.js seeds Fabiola and Lucy from
// config.js, which is what a fresh install has always started from; the only
// thing this changes is that nobody is asked to confirm it.
import { PRACTICE } from '../kinds.js';

export const SKIP_SETUP = true;

// ---------------------------------------------------------------------------
// Goals (how the Activities library is grouped)
// ---------------------------------------------------------------------------

// Four themes rather than the door program's six, each one backed by a program
// below. The icons are marks the app already draws; no new ones are minted
// here, because an invented icon at 24px is a worse answer than a familiar one
// and the set that exists covers these.
export const GOALS = [
  {
    id: 'impulse-control',
    icon: 'goal-impulse',
    title: 'Impulse control',
    blurb: 'Hold a position and wait, however interesting the room gets.',
  },
  {
    id: 'attention',
    icon: 'goal-greeting',
    title: 'Attention',
    blurb: 'Look away from the distraction and back to you.',
  },
  {
    id: 'engagement',
    icon: 'goal-foundation',
    title: 'Engagement',
    blurb: 'Tricks and play that make you the most interesting thing in the room.',
  },
  {
    id: 'settle-recovery',
    icon: 'goal-settle',
    title: 'Settle and recovery',
    blurb: 'Come back down after getting excited.',
  },
];

/**
 * Nothing parked.
 *
 * The door pack uses this for activities that are named on the map but not
 * written yet. Every exercise in the handout is written, so there is nothing
 * to promise. An empty list renders as nothing at all, which is correct.
 */
export const PLANNED_ACTIVITIES = [];

// ---------------------------------------------------------------------------
// Household cues
// ---------------------------------------------------------------------------

// The handout's own words. "Finished" is offered by the trainer as an
// alternative release word to "Ok", and the commands screen is where a
// household picks which one they actually say — so the seed is one of them,
// not both.
export const DEFAULT_COMMANDS = [
  { id: 'sit', situation: 'Sit', cue: 'Sit' },
  // Lying down had no word of its own, so the steps that ask for it borrowed
  // one: Stay said "Sit" over an instruction to lie down, and Crawl said
  // "Settle", which is the switch-off exercise's word and teaches the wrong
  // thing if it is spent on a trick.
  { id: 'down', situation: 'Lie down', cue: 'Down' },
  { id: 'stay', situation: 'Remain in position', cue: 'Stay' },
  { id: 'release', situation: 'End position', cue: 'Ok' },
  { id: 'mark', situation: 'Mark the moment it is right', cue: 'Yes!' },
  { id: 'attention', situation: 'Look toward handler', cue: 'Watch me' },
  { id: 'boundary', situation: 'Stay out of your space', cue: 'Back' },
  { id: 'leave', situation: 'Look away from a distraction', cue: 'Leave it' },
  { id: 'settle', situation: 'Lie down and switch off', cue: 'Settle' },
  { id: 'place', situation: 'Move to bed', cue: 'Go to bed' },
  { id: 'touch', situation: 'Nose to your palm', cue: 'Touch' },
  { id: 'spin', situation: 'Turn clockwise', cue: 'Spin' },
  { id: 'turn', situation: 'Turn counterclockwise', cue: 'Turn' },
  { id: 'weave', situation: 'Figure eight through your legs', cue: 'Weave' },
  { id: 'crawl', situation: 'Crawl along the ground', cue: 'Crawl' },
  { id: 'tug', situation: 'Start a game', cue: 'Tug' },
  { id: 'out', situation: 'Let go of the toy', cue: 'Out' },
];

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

// Every program says where it came from in the same words, because they all
// came from the same eight pages. The trainer's own caveat is part of it: the
// handout calls itself guidelines and tells the reader to bring questions to a
// person, and an app built from it should not quietly drop that line.
const SOURCE = {
  label: 'The Canine Coach handout',
  note:
    'I’m So Excited! Boot Camp Homework. These are guidelines, and they may suggest behaviors not covered in a checkout — discuss any questions with your Boot Camp trainer.',
};

export const PROGRAMS = [
  {
    id: 'wait',
    title: 'Wait',
    goalId: 'impulse-control',
    coverImage: 'door-stay-cover',
    blurb:
      'Hold a position, hold a boundary, ignore a temptation, and still listen when the room gets exciting.',
    openingLine: 'Four exercises, from a thirty second sit to listening while excited.',
    finishedLine: 'All four finished. {dog} can wait.',
    outcome: {
      title: 'A dog who can wait',
      eyebrow: 'What finishing looks like',
      body:
        'Something exciting happens and {dog} holds {their} position anyway. {She} leaves the dropped food, stays on {their} side of the line, and sits when you ask even with {their} blood up.',
      note: 'Every other program leans on this one. Waiting is the skill the rest is built from.',
    },
    source: SOURCE,
  },
  {
    id: 'eyes-on-you',
    title: 'Eyes on You',
    goalId: 'attention',
    coverImage: 'plan-name',
    blurb:
      'Teach {dog} that looking away from the interesting thing is what pays, and that you are where the answer is.',
    openingLine: 'Two exercises, from a one second glance to a dog passing on a walk.',
    finishedLine: 'Both finished. {dog} checks in without being asked.',
    outcome: {
      title: 'A dog who checks in',
      eyebrow: 'What finishing looks like',
      body:
        '{dog} notices the squirrel, the other dog, the dropped sandwich — and turns back to you on {their} own, before you have said anything.',
      note: 'The handout calls that the lightbulb moment, and says to pay it like a jackpot.',
    },
    source: SOURCE,
  },
  {
    id: 'play-and-tricks',
    title: 'Play and Tricks',
    goalId: 'engagement',
    coverImage: 'door-sound-04-treats',
    blurb:
      'Tricks are cute, and that is not why they are here. Practicing them teaches you and {dog} to engage with each other.',
    openingLine: 'Three exercises. None of them are obedience, and all of them are.',
    finishedLine: 'All three finished. {dog} would rather play with you.',
    outcome: {
      title: 'A dog who would rather play with you',
      eyebrow: 'What finishing looks like',
      body:
        'You have a handful of games {dog} loves and can play anywhere, so being near you is more interesting than whatever else is going on.',
      note: 'Play is not the reward for training. The handout is clear that it is the training.',
    },
    source: SOURCE,
  },
  {
    id: 'switch-off',
    title: 'Switch Off',
    goalId: 'settle-recovery',
    coverImage: 'plan-mat',
    blurb:
      'Somewhere to go, a way to get there, and the habit of being calm near you when nothing is being asked.',
    openingLine: 'Four exercises, from a bed {she} likes to a dog who settles unprompted.',
    finishedLine: 'All four finished. {dog} comes back down on {their} own.',
    outcome: {
      title: 'A dog who comes back down',
      eyebrow: 'What finishing looks like',
      body:
        'The excitement passes and {dog} lets go of it. {She} takes {her}self to {their} bed, lies down near you without being told, and switches off.',
      note: 'This is the half of the handout that is about doing nothing, on purpose.',
    },
    source: SOURCE,
  },
];

// Shared guidance behind the "{dog} is too excited" button. The handout's own
// advice for anything that keeps failing: make it easier, because dogs learn
// from their successes.
const FALLBACK_STEPS = [
  'Make it shorter. Ask for five seconds, not five minutes.',
  'Get closer. Distance is the first thing to give back.',
  'Take the distraction away and add it again later.',
  'Raise one thing at a time, never two.',
  'Pay {her} more, and faster, than you think you need to.',
  'Stop while {she} is still getting it right.',
];

// Every exercise uses the same picture behind that button: a dog on a slack
// leash with nothing being asked of {her}. It is the only image in the library
// that shows a break rather than a repetition, which is exactly what the
// button is for.
const BREATHER = 'door-sound-05-settle';

export const ACTIVITIES = [
  // =========================================================================
  // Wait
  // =========================================================================

  // The handout's first section, and the one every other exercise leans on.
  //
  // Its five STEPs become five levels rather than five screens. The handout's
  // steps are not a sequence you walk once — they are a ladder of difficulty,
  // each with its own duration and its own "advance when you can do this 90%
  // of the time", which is what a level is in this app. The screens below are
  // the procedure, which the handout assumes you already know because a
  // trainer showed you in person.
  {
    id: 'ex-stay',
    slug: 'stay',
    title: 'Stay',
    programId: 'wait',
    goalId: 'impulse-control',
    shortTitle: 'Stay',
    icon: 'act-stay',
    shortPurpose: '{dog} holds {their} position until you release {her}.',
    // Was the door-stay cover: a dog lying on a bed across the room while the
    // handler held the front door open, over a level-one sit-stay with you
    // standing right there. This is the cue itself, at arm's length.
    coverImage: 'door-stay-02-cue',
    estimatedMinutes: 5,
    difficulty: 'beginner',
    equipment: ['Small treats', '{Their} bed or a marked spot', 'A timer or a clock'],
    safetyNotes: [
      'Always end a stay with your release word. A stay {she} ends on {their} own is not a stay.',
      'If {dog} gets up early, re-start the stay and release {her} properly afterwards.',
      'Raise one thing at a time: longer, or further away, or more distracting. Never all three at once.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    // Step three names its duration on every level. It said "Hold the count
    // for this level", and the count was printed only on the get-ready screen,
    // which is gone by step three — a household mid-rep had no way to find out
    // what the count was.
    steps: [
      {
        instruction: 'Ask {dog} to sit.',
        cue: 'Sit',
        helper:
          'A sit-stay first. The down-stay is the same exercise from a harder position, and it joins at level two.',
      },
      {
        instruction: 'Cue the stay, and look at {her} for a second before you do anything else.',
        cue: 'Stay',
        helper: 'The pause tells {her} the cue is finished and the waiting has started.',
      },
      {
        instruction: 'Stand right beside {her} and count up to 30 seconds.',
        helper:
          'Start at five seconds and add a few each rep. Watch the clock rather than {her}: a stay that is guessed at drifts shorter every session. If {dog} gets up, go back to the last count that worked.',
      },
      {
        instruction: 'Mark it while {dog} is still in position, and pay {her} there.',
        cue: 'Yes!',
        helper:
          'If you have stepped away, walk back to {her} to pay. Calling {her} to you for the treat teaches {her} that breaking the stay is what earns it.',
      },
      { instruction: 'Release {her} with your word, then reset for the next rep.', cue: 'Ok' },
    ],
    levels: [
      {
        number: 1,
        title: 'Up to 30 seconds',
        setup:
          'Calm sit stay, up to 30 seconds, with you standing right there.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: [
          'Holds the sit for the full count',
          'Waits for the release word',
          'Does not creep forward',
        ],
      },
      {
        number: 2,
        title: 'A minute, sitting or lying down',
        setup:
          'Sit-stay and down-stay, a minute or longer, while you stay nearby.',
        cadence: { min: 1, max: 2, per: 'day' },
        reps: 4,
        successCriteria: ['Holds a minute in either position', 'Waits for the release word'],
        // One cue per screen, so the step asks for the down and says to swap:
        // it showed "Sit" over an instruction to sit or lie down, and the
        // helper still promised the down-stay "at level two" on level two.
        overrides: {
          0: {
            instruction: 'Ask {dog} to lie down. Ask for a sit instead on the next rep.',
            cue: 'Down',
            helper:
              'Swap between the two each rep, so “Stay” comes to mean hold whatever position you asked for.',
          },
          2: {
            instruction: 'Stay close and count up to one minute.',
            helper: 'Build to the minute across the session. The first rep does not have to be the longest.',
          },
        },
      },
      {
        number: 3,
        title: 'Two to three minutes, while you get on with something',
        setup:
          'Two to three minutes while you do something ordinary nearby — your phone, a grocery list.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 3,
        successCriteria: [
          'Holds while you stop paying attention',
          'Does not follow you when you turn away',
        ],
        overrides: {
          2: {
            instruction: 'Hold for two to three minutes, and look at your phone while it runs.',
            helper:
              'Or write a grocery list: anything ordinary. Looking away is the point of this level. Stay close enough to stop a break, but stop watching {her}.',
          },
        },
      },
      {
        number: 4,
        title: 'Three to four minutes, and a step out of the room',
        setup:
          'Three to four minutes nearby, then thirty seconds while you walk briefly out of the room.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 3,
        successCriteria: ['Holds while you are out of sight', 'Still there when you come back'],
        overrides: {
          2: {
            instruction: 'Hold three to four minutes nearby, then leave the room for thirty seconds.',
            helper:
              'Leave before {she} expects it and come back before {she} worries. Out of sight is a big raise; thirty seconds of it is plenty.',
          },
        },
      },
      {
        number: 5,
        title: 'Four to five minutes, with something exciting happening',
        setup:
          'Four to five minutes, and a stay held while you answer the door, throw a toy or make yourself a snack.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 3,
        successCriteria: [
          'Holds through the exciting thing',
          'Recovers without needing a second cue',
        ],
        overrides: {
          2: {
            instruction: 'Hold for four to five minutes while you do something exciting.',
            helper: 'Answer the door, throw a toy, or make a snack. This is the level the whole handout is aiming at. If {dog} breaks, make the exciting thing smaller before you make the stay shorter.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // "Back" is not "Stay", and the handout goes out of its way to say so. The
  // shortPurpose says it too, because the two exercises sit in the same
  // program and a household that blurs them will cue one and expect the other.
  {
    id: 'ex-back',
    slug: 'back',
    title: 'Back',
    programId: 'wait',
    goalId: 'impulse-control',
    shortTitle: 'Back',
    icon: 'act-greet',
    shortPurpose:
      '{dog} stays out of your space until invited in. {She} can do as {she} likes on {their} own side.',
    coverImage: 'door-stay-03-cross',
    estimatedMinutes: 6,
    difficulty: 'beginner',
    equipment: ['A line you can see', 'Small treats', 'Something of your own to get on with'],
    safetyNotes: [
      '“Back” is not “Stay”. {dog} may sit, stand or wander on {their} side of the line — {she} just may not cross it.',
      'Follow through every single time. A line you enforce sometimes is not a line.',
      'Walk {her} back rather than repeating the cue. The cue was not the problem.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      // The examples were behind the drawer, and they are what makes the step
      // doable: "a line you can both see" read cold does not say where.
      {
        instruction: 'Pick a line you can both see, like the edge of a rug or a doorway.',
        helper: 'Where the floor changes works too. An invisible line is one you will enforce inconsistently.',
      },
      // "Send her back over it" assumed the word was already taught, and did
      // not say which side she ends up on.
      {
        instruction: 'Send {her} to the far side of the line, away from you, and pay {her} there.',
        cue: 'Back',
        helper:
          'If {dog} does not know the word yet, walk calmly into {their} space until {she} steps back over the line, then pay {her} on {their} side.',
      },
      {
        instruction: 'Get on with your job for at least five minutes, and stop watching {her}.',
        helper:
          'This is the exercise. If you stand and watch the line, you are the one holding it rather than {her}.',
      },
      {
        instruction: 'If {she} crosses, walk {her} back and carry on.',
        helper:
          'Quietly, without a second cue and without scolding. Put {her} back over the line and return to your job.',
      },
      { instruction: 'Invite {her} in when you are done.', cue: 'Ok' },
    ],
    levels: [
      {
        number: 1,
        title: 'Five minutes while you work',
        setup:
          'Ask for “Back” for at least five minutes while you unload the dishwasher, make the bed, put your shoes on or eat dinner.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 2,
        successCriteria: [
          'Stays on {their} side for the whole job',
          'Does not need walking back more than once',
          'Waits to be invited in',
        ],
      },
      {
        number: 2,
        title: 'While something is happening',
        setup:
          'Ask for “Back” while you answer the door, make and eat dinner, or play a game with the family.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 2,
        successCriteria: [
          'Holds the line with people moving around',
          'Comes in only when invited',
        ],
        overrides: {
          2: {
            instruction: 'Answer the door, make dinner, or play a family game while {she} holds the line.',
            helper:
              'The exciting thing is the point now. Be as firm about the line as you want {her} to be, and do not check on {her} mid-job.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // One STEP in the handout with three practice contexts under it, and the
  // three are plainly a ladder: a dropped biscuit in your own kitchen is not
  // another dog on a sidewalk. So they become levels, which is what the app
  // has for "the same exercise, harder".
  {
    id: 'ex-leave-it',
    slug: 'leave-it',
    title: 'Leave It',
    programId: 'wait',
    goalId: 'impulse-control',
    shortTitle: 'Leave',
    icon: 'goal-walk',
    shortPurpose: '{dog} looks away from something {she} wants, and back at you.',
    coverImage: 'plan-walkpeople',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
    equipment: ['A leash', 'Something dull to leave, like a plain biscuit', 'Better treats in your pocket'],
    safetyNotes: [
      'Never let {her} have the thing {she} left. The payment always comes from you.',
      'Say it once. A cue repeated four times is not a cue, it is nagging.',
      'Start with something boring. A biscuit on the floor, not the roast.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    // The equipment said "something dull", step one said "something tempting"
    // and its helper said "dull first": three answers to one question. And
    // nothing said what stops her getting it, on a screen whose safety note is
    // that she never may. The release had no step and no word either.
    steps: [
      {
        instruction: 'Put something mildly interesting on the floor, a few steps ahead.',
        helper: 'Dull first. You are teaching the word, not testing {their} self-control.',
      },
      {
        instruction: 'Walk {her} toward it on a leash short enough that {she} cannot reach it.',
        helper: 'If {she} lunges, the leash stops {her}, not your voice. Then try again with something duller or from further away.',
      },
      { instruction: 'Say it once, the moment {she} notices it.', cue: 'Leave it' },
      {
        instruction: 'Mark the instant {she} looks away from it.',
        cue: 'Yes!',
        helper:
          'The instant. Not when {she} looks at you — when {she} stops looking at the thing. That is the moment you are paying for.',
      },
      {
        instruction: 'Pay {her} from your hand and keep walking past it.',
        helper: 'The “Leave it” still holds until you are past it, as the handout says.',
      },
      { instruction: 'Once you are past it, release {her}.', cue: 'Ok' },
    ],
    levels: [
      // Its setup said "Cold trials", which is trainer shorthand, over steps
      // that had you placing the food and walking up to it — the opposite of a
      // piece dropped by accident. The steps now do what the setup says.
      {
        number: 1,
        title: 'Dropped food in the kitchen',
        setup:
          'Drop a piece of food on the kitchen floor as if by accident, when {dog} is not expecting a training session.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: [
          'Looks away without a second cue',
          'Takes the treat from your hand',
          'Does not dive for the floor',
        ],
        overrides: {
          0: {
            instruction: 'With {dog} nearby in the kitchen, drop a piece of food as if by accident.',
            helper:
              'Trainers call this a cold trial: it works best when it does not look like training.',
          },
          1: {
            instruction: 'Stay close enough to cover the food with your foot.',
            helper: 'If {she} goes for it, cover it. {She} must not get it, and your foot is faster than a second cue.',
          },
          4: {
            instruction: 'Pay {her} from your hand, then pick the food up yourself.',
            helper: 'The food on the floor is never the reward. Picking it up yourself is how {she} learns that.',
          },
          5: { instruction: 'Once the food is off the floor, release {her}.', cue: 'Ok' },
        },
      },
      {
        number: 2,
        title: 'Walking up to it and past it',
        setup:
          'Set something on the ground and walk up to and past it, holding the “Leave it” until you are past.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: ['Walks past without pulling', 'Holds it until you are clear of the thing'],
      },
      {
        number: 3,
        title: 'On a walk, past another dog',
        setup:
          'Practice on your daily walk, on real distractions — another dog, a squirrel, something on the sidewalk.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: [
          'Leaves a real distraction outdoors',
          'Reorients to you afterwards',
          'Recovers without needing to leave the street',
        ],
        overrides: {
          0: {
            instruction: 'On your walk, spot the distraction before {she} does.',
            helper:
              'Outdoors your advantage is seeing it first. A “Leave it” said before {she} locks on is a different exercise from one said after.',
          },
          1: {
            instruction: 'Keep walking, with the leash short and loose.',
            helper: 'If {she} lunges, the leash stops {her}, not your voice. Next time, give the distraction a wider berth.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The handout gives this one three sentences and a frequency, and it is the
  // only exercise in the sheet that is explicitly a game. The steps keep that.
  //
  // A practice rather than a drill. As a drill, a rep was one chase and one
  // sit, and the app stopped after every sit to ask how it went — in an
  // exercise whose whole instruction is thirty seconds, go again straight away.
  // The five screens are one round now, and the loop inside it is a step.
  {
    id: 'ex-speed-sit',
    kind: PRACTICE,
    slug: 'speed-drill-sits',
    title: 'Speed Drill Sits',
    programId: 'wait',
    goalId: 'impulse-control',
    shortTitle: 'Sit',
    icon: 'act-sound',
    shortPurpose: '{dog} sits fast, while excited, because sitting is what pays.',
    coverImage: 'plan-fourpaws',
    estimatedMinutes: 2,
    difficulty: 'beginner',
    equipment: ['A pocket of small food', 'A bit of room to move backwards safely'],
    safetyNotes: [
      'Thirty seconds is the whole exercise. Stop long before {she} gets bored of it.',
      'Check behind you before you run backwards. Watch for rugs, steps and toys.',
      'Do not repeat the cue while {she} is still moving. Wait for the sit.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Get {her} excited and moving with you.',
        helper:
          'Dogs love to hunt, and the handout says to use that. Being chased is the reward for coming; the sit is what gets paid.',
      },
      { instruction: 'Run backwards a few steps so {she} chases you.' },
      { instruction: 'Stop dead and ask for it.', cue: 'Sit' },
      {
        instruction: 'Pay the moment {their} bottom lands.',
        cue: 'Yes!',
        helper: 'The faster {she} sits, the faster the food arrives. That is the whole lesson.',
      },
      {
        instruction: 'Run again straight away, and repeat until thirty seconds are up.',
        helper: 'Stop while {she} still wants more. Ending on a keen sit is what makes tomorrow’s round easy.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'Thirty seconds, every day',
        setup: 'A fast, silly thirty seconds of chasing and sitting.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 1,
        successCriteria: [
          'Sits without the cue being repeated',
          'Sits faster by the last sit than the first',
          'Stays keen the whole thirty seconds',
        ],
      },
    ],
  },

  // =========================================================================
  // Eyes on You
  // =========================================================================

  // Five STEPs, five levels, and one oddity carried through from the source:
  // the handout's Step 5 asks for shorter increments than its Step 4. See the
  // note on level 5.
  {
    id: 'ex-watch-me',
    slug: 'watch-me',
    title: 'Watch Me',
    programId: 'eyes-on-you',
    goalId: 'attention',
    shortTitle: 'Watch',
    icon: 'user',
    shortPurpose: '{dog} looks at your face and holds it, with something better going on nearby.',
    coverImage: 'door-sound-03-name',
    estimatedMinutes: 4,
    difficulty: 'beginner',
    equipment: ['Treats in both hands', 'A helper, from level two onward'],
    safetyNotes: [
      'Alternate hands. Paying from the same hand every time teaches {her} to stare at that hand.',
      'Say “Yes!” while {she} is still looking at you, not after {she} has looked away.',
      'Build duration a fraction of a second at a time. One second is a real starting point.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Ask {dog} to sit in front of you.', cue: 'Sit' },
      {
        instruction: 'Show {her} the treats, then put both hands behind your back.',
        helper:
          'A treat in each hand so you can pay from either. The hands go away so that your face is the only thing left to look at.',
      },
      { instruction: 'Ask for {their} eyes.', cue: 'Watch me' },
      // Right for level one's single second, and wrong from level two on,
      // where the levels ask for a hold: every later level overrides this
      // step with its own count, because marking the moment of contact at a
      // ten-second level pays the glance and never the hold.
      {
        instruction: 'Mark the moment {she} meets your eyes.',
        cue: 'Yes!',
        helper:
          'If {she} fixates on where the food went, make a kissy sound. The moment {she} looks at your face, mark it.',
      },
      {
        instruction: 'Pay from one hand, then the other next time.',
        helper: 'Swap hands every rep so {she} never learns which one to watch.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'One second, nothing else happening',
        setup:
          'Start with a one second watch and build from there, in a quiet room.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: [
          'Meets your eyes within a second or two',
          'Takes food from either hand',
          'Is not staring at your treat hand',
        ],
      },
      {
        number: 2,
        title: 'Five to ten seconds, with a distraction',
        setup:
          'Hold eye contact for five to ten seconds while somebody shakes a bag of treats nearby.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: ['Holds five seconds or more', 'Looks back at you after the noise'],
        overrides: {
          2: {
            instruction: 'Ask for {their} eyes, and have your helper start the noise.',
            cue: 'Watch me',
          },
          3: {
            instruction: 'Count five to ten seconds while {she} holds your eyes, then mark it.',
            cue: 'Yes!',
            helper: 'Start at the short end and build. If {she} looks away first, the count was too long: pay the next one sooner.',
          },
        },
      },
      {
        number: 3,
        title: 'Ten to twenty seconds',
        setup:
          'Hold eye contact for ten to twenty seconds, with harder distractions — a bag of treats indoors, then out on a walk.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: ['Holds ten seconds or more', 'Works outside as well as inside'],
        overrides: {
          2: { instruction: 'Ask for {their} eyes with the distraction already going.', cue: 'Watch me' },
          3: {
            instruction: 'Count ten to twenty seconds while {she} holds your eyes, then mark it.',
            cue: 'Yes!',
            helper: 'Start at the short end and build. If {she} looks away first, the count was too long: pay the next one sooner.',
          },
        },
      },
      {
        number: 4,
        title: 'Twenty seconds, out in the world',
        setup:
          'Hold eye contact for twenty seconds, out on a walk, with harder distractions each time.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: ['Holds twenty seconds outdoors', 'Does not break at the first movement'],
        overrides: {
          0: { instruction: 'Ask {dog} to sit in front of you, out on the walk.', cue: 'Sit' },
          1: {
            instruction: 'Show {her} the treats, then close them in your fists at your sides.',
            helper: 'The leash stays in one hand; there is no putting both hands behind your back on a walk.',
          },
          2: { instruction: 'Ask for {their} eyes with the world going on behind you.', cue: 'Watch me' },
          3: {
            instruction: 'Count twenty seconds while {she} holds your eyes, then mark it.',
            cue: 'Yes!',
            helper: 'Start at the short end and build. If {she} looks away first, the count was too long: pay the next one sooner.',
          },
        },
      },
      {
        number: 5,
        // The handout asks for 10-15 seconds here, having asked for 20 at step
        // 4. Written down as the trainer wrote it rather than quietly
        // corrected: the drop is almost certainly deliberate, because the
        // distraction at this rung is a real dog or squirrel going past and
        // that is a much harder ask than a longer count in a parking lot. The
        // setup line says so, so nobody reads it as a typo.
        title: 'Ten to fifteen seconds, past a dog or a squirrel',
        setup:
          'Hold eye contact for ten to fifteen seconds while passing a dog or a squirrel on a walk. Shorter than level four on purpose — the distraction is doing the work now.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: [
          'Holds your eyes while the other dog passes',
          'Does not lunge or fixate',
          'Recovers on {their} own afterwards',
        ],
        overrides: {
          2: {
            instruction: 'Ask for {their} eyes as the dog or squirrel comes past.',
            cue: 'Watch me',
            helper:
              'Ask early. Once {she} has locked on, you are interrupting rather than asking, and the exercise is a different and harder one.',
          },
          1: {
            instruction: 'Show {her} the treats, then close them in your fists at your sides.',
            helper: 'The leash stays in one hand; there is no putting both hands behind your back on a walk.',
          },
          3: {
            instruction: 'Count ten to fifteen seconds while {she} holds your eyes, then mark it.',
            cue: 'Yes!',
            helper: 'Start at the short end and build. If {she} looks away first, the count was too long: pay the next one sooner.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The handout writes this one as bullets rather than a numbered ladder,
  // because it is a single loop you repeat rather than a sequence that gets
  // harder. One level, and the jackpot is written into the last step because
  // it is the whole point of the exercise rather than a flourish.
  {
    id: 'ex-look-at-that',
    slug: 'look-at-that',
    title: 'Look At That!',
    programId: 'eyes-on-you',
    goalId: 'attention',
    shortTitle: 'Look',
    icon: 'spark',
    shortPurpose:
      '{dog} notices something interesting and turns back to you — eventually without being asked.',
    coverImage: 'plan-name',
    estimatedMinutes: 6,
    difficulty: 'intermediate',
    equipment: [
      'A window, a porch or somewhere moderately busy',
      'A lot of small treats',
      '{Their} bed or a marked spot',
    ],
    safetyNotes: [
      'Moderately distracting. If {she} cannot look away at all, you are too close to it.',
      'Treat only while {she} is looking at you, never while {she} is still staring.',
      'The jackpot is for the unprompted turn. Do not spend it on a lured one.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Somewhere mildly interesting, ask {her} to sit or lie down, then to stay.',
        cue: 'Stay',
        helper: 'In front of a window, or on the front porch. Busy enough to notice, quiet enough to cope.',
      },
      {
        instruction: 'Wait for {her} to notice something.',
        helper: 'Do nothing. The exercise starts when {she} spots it, not when you decide it has.',
      },
      // "The moment she looks" — at what? Every other exercise in the pack
      // marks looking at you or looking away. This one marks looking at the
      // distraction, which is the surprising part, so it has to be said.
      {
        instruction: 'Mark the moment {she} looks at the distraction.',
        cue: 'Yes!',
        helper: 'Yes, at it. Noticing the thing calmly is what you are paying for here.',
      },
      {
        instruction: 'Lure {their} nose back to you and pay when {she} is looking at you.',
        helper:
          'The treat travels from {their} nose back to your face. Pay at the end of that journey, not the start.',
      },
      {
        instruction: 'If {she} turns back on {their} own, jackpot it.',
        helper:
          'Several treats, fast, one after another. The handout calls this the lightbulb moment — it is the behavior you actually want, so pay it like it is. If {she} does not turn back, that is fine: the rep is still done.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'At the window, or on the porch',
        setup:
          'Somewhere moderately distracting: in front of a window, on the front porch.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: [
          'Looks away from the distraction when marked',
          'Takes food while looking at you',
          'Turns back unprompted at least once',
        ],
      },
    ],
  },

  // =========================================================================
  // Play and Tricks
  // =========================================================================

  // Three tricks in the handout's first engagement block. Three levels, easiest
  // first: a nose to a flat palm is a much smaller ask than a full turn, and
  // the anticlockwise turn is genuinely harder than the clockwise one once a
  // dog has learned to spin one way.
  {
    id: 'ex-touch-spin',
    slug: 'touch-and-spin',
    title: 'Touch and Spin',
    programId: 'play-and-tricks',
    goalId: 'engagement',
    shortTitle: 'Spin',
    icon: 'plan-fourpaws',
    shortPurpose: 'Three small tricks that teach {dog} to watch you and offer things.',
    coverImage: 'door-sound-04-treats',
    estimatedMinutes: 4,
    difficulty: 'beginner',
    equipment: ['Small treats', 'A bit of clear floor'],
    safetyNotes: [
      'Keep spins slow and few. A dog whipping around repeatedly on a slick floor can hurt {her}self.',
      'Lure first, then fade the hand. A trick that only works with food in your fist is a bribe.',
      'Stop while it is still fun. These are meant to be the good bit.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Get {her} in front of you and interested.' },
      // "Show her the shape with your hand" was written to cover a touch and
      // a spin at once, and read as neither. The spin levels override it.
      {
        instruction: 'Hold a flat palm a few inches from {their} nose.',
        helper: 'If {she} ignores it, rub a treat on your palm first. Most dogs sniff a hand held close, and the sniff is the touch.',
      },
      { instruction: 'Name it as {she} does it.', cue: 'Touch' },
      { instruction: 'Mark and pay the moment it happens.', cue: 'Yes!' },
      {
        instruction: 'Go again, and fade the lure a little each time.',
        helper: 'Same hand movement, no food in it. The food arrives afterwards, from the other hand.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'Touch',
        setup: 'A nose boop to your open hand. The easiest of the three, so it goes first.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: ['Touches your palm with {their} nose', 'Comes back for another go'],
      },
      {
        number: 2,
        title: 'Spin',
        setup: 'A clockwise turn, lured at first and then on the word.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: ['Completes the circle', 'Follows the hand without the food in it'],
        overrides: {
          1: {
            instruction: 'With a treat at {their} nose, trace a slow clockwise circle.',
            helper: 'Wide and slow, so {her} body has room to follow {their} nose around.',
          },
          2: { instruction: 'Name it as {she} comes around.', cue: 'Spin' },
        },
      },
      {
        number: 3,
        title: 'Turn',
        setup:
          'A counterclockwise turn. Harder than it sounds once {she} has learned to spin the other way.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 5,
        successCriteria: ['Turns the other way', 'Does not default to the clockwise spin'],
        overrides: {
          1: {
            instruction: 'With a treat at {their} nose, trace a slow counterclockwise circle.',
            helper: 'Wide and slow. If {she} starts to spin the old way, slow your hand down rather than speeding it up.',
          },
          2: { instruction: 'Name it as {she} comes around.', cue: 'Turn' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'ex-weaves-crawl',
    slug: 'leg-weaves-and-crawl',
    title: 'Leg Weaves and Crawl',
    programId: 'play-and-tricks',
    goalId: 'engagement',
    shortTitle: 'Weave',
    icon: 'goal-foundation',
    shortPurpose: 'Two bigger tricks that put {dog} close to you and paying attention.',
    coverImage: 'play-weave',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
    equipment: ['Small treats', 'Room to stand with your legs apart', 'A non-slip floor'],
    safetyNotes: [
      'A non-slip floor for both of these. A dog scrabbling under you is how somebody gets hurt.',
      'Do not push {her} down into the crawl. Lure it, and let {her} choose it.',
      'A few reps only. These are more physical than they look.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    // The weave was "lure her through" and "pay on the other side": nothing
    // said what path a figure eight takes, and "the other side" survived onto
    // the crawl level, which has no sides. The base cue also said "Touch",
    // borrowed from the exercise before this one.
    steps: [
      { instruction: 'Stand still with your legs about hip distance apart, {dog} in front of you.' },
      {
        instruction: 'Lure {her} back between your legs, then around your right leg to the front.',
        helper:
          'Treat in your right hand, slowly. Your hand goes where you want {their} nose to go, and the rest of {her} follows. Bend your knees rather than dragging {her} low.',
      },
      {
        instruction: 'Swap hands and lure {her} through again, around your left leg.',
        cue: 'Weave',
        helper: 'Say the word as {she} goes. Right loop, then left loop: that is one figure eight.',
      },
      { instruction: 'Mark and pay when {she} is back in front of you.', cue: 'Yes!' },
      { instruction: 'Reset and go again from the top.' },
    ],
    levels: [
      {
        number: 1,
        title: 'Leg weaves',
        setup:
          'Stand still with your legs hip distance apart while {dog} weaves a figure eight between them.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: ['Goes through without stopping', 'Comes back around for the second loop'],
      },
      {
        number: 2,
        title: 'Crawl',
        setup: '{dog} is in a down, and crawls along the ground.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 4,
        successCriteria: ['Stays down while moving', 'Crawls a body length or more'],
        overrides: {
          0: { instruction: 'Ask {her} to lie down, and kneel down with {her}.', cue: 'Down' },
          1: {
            instruction: 'Draw the treat slowly along the floor away from {her}.',
            helper: 'Low and slow. If {her} bottom comes up, you moved it too fast or too high.',
          },
          2: { instruction: 'Name it as {she} crawls.', cue: 'Crawl', helper: 'Say it while {she} is moving, not before.' },
          3: { instruction: 'Mark and pay once {she} has crawled a body length.', cue: 'Yes!' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The thinnest section in the handout: two sentences and a frequency. The
  // steps here are a straightforward tug loop with an "Out" in it, because a
  // game with no off switch is one the household will stop playing.
  {
    id: 'ex-tug',
    // A game, not a drill. You start it, you end it, and once is the whole of it.
    kind: PRACTICE,
    slug: 'tug',
    title: 'Tug',
    programId: 'play-and-tricks',
    goalId: 'engagement',
    shortTitle: 'Tug',
    icon: 'spark',
    shortPurpose: 'A game {dog} loves, that you start and you end.',
    coverImage: 'play-tug',
    estimatedMinutes: 3,
    difficulty: 'beginner',
    equipment: ['A long tug toy', 'Somewhere with room to move'],
    safetyNotes: [
      'A long toy, so {their} teeth stay well away from your hands.',
      'Pull side to side, never up. Lifting a dog by a toy is hard on {their} neck and spine.',
      'You start it and you end it. A game the dog starts is not the exercise.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Bring the toy to life along the floor.',
        helper: 'Away from {her}, like something escaping. A toy shoved at a dog’s face is not prey.',
      },
      { instruction: 'Invite {her} to take it.', cue: 'Tug' },
      {
        instruction: 'Play for a few seconds, side to side.',
        helper: 'Let {her} win sometimes. A game you always win is one {she} stops entering.',
      },
      {
        instruction: 'Go still and ask for it back.',
        cue: 'Out',
        helper:
          'Stop moving the toy entirely. Boring hands are what buy the release; pulling harder is what stops it.',
      },
      // Restarting the game was the last step, so the game never ended — on
      // the one exercise whose safety note is "you start it and you end it".
      {
        instruction: 'Restart the game as the reward. After a few rounds, put the toy away.',
        helper:
          'Getting the game back is what pays the “Out”. Ending it yourself, while {she} still wants more, is how it stays your game.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'A game a day',
        setup:
          'Play and fun are the keys to engagement. Teach {dog} to love tug.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 1,
        successCriteria: [
          'Takes the toy when invited',
          'Lets go when asked',
          'Comes back in for another round',
        ],
      },
    ],
  },

  // =========================================================================
  // Switch Off
  // =========================================================================

  // Three STEPs, three levels. The handout links out to a separate Go to Bed
  // sheet for the teaching itself, which this app does not have — so level one
  // assumes {she} already has some idea of the bed and is about making it a
  // place {she} likes, which is what the handout's own step one is about.
  {
    id: 'ex-go-to-bed',
    slug: 'go-to-bed',
    title: 'Go To Bed',
    programId: 'switch-off',
    goalId: 'settle-recovery',
    shortTitle: 'Bed',
    icon: 'act-place',
    shortPurpose: '{dog} goes to {their} bed when asked, and chooses it on {their} own.',
    coverImage: 'door-place-cover',
    estimatedMinutes: 6,
    difficulty: 'beginner',
    equipment: [
      '{Their} bed, somewhere {she} can still see you',
      'Small treats',
      'A special chew that lives on the bed',
    ],
    safetyNotes: [
      'Pay {her} on the bed, between {their} paws. Calling {her} off it to be paid teaches the opposite.',
      'Keep one toy or chew that {she} only ever gets there. That is what makes the bed worth choosing.',
      'Reward {her} any time {she} goes there by {her}self, even when you are not training.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Send {her} to {their} bed.',
        cue: 'Go to bed',
        helper:
          'If {dog} does not know the word yet, walk {her} there with a treat at {their} nose and say it as {she} steps on.',
      },
      {
        instruction: 'Pay {her} lavishly the moment {she} is on it.',
        cue: 'Yes!',
        helper: 'Lavishly is the handout’s word. Several treats, on the bed, between {their} paws.',
      },
      // Said "Hold it for this level's count", and level one has no count:
      // the handout's first step is about the bed being worth going to. The
      // later levels override this with their own minutes.
      {
        instruction: 'Ask {her} to stay for a few seconds.',
        cue: 'Stay',
        helper: 'Level one is about the bed being a good place, not about how long. A few seconds is plenty.',
      },
      {
        instruction: 'Go back and pay {her} again where {she} is.',
        helper: 'Every payment happens on the bed. That is what makes the bed the paying spot.',
      },
      // "Leave the chew there" — no step had put one there.
      {
        instruction: 'Release {her}, then put {their} special chew on the bed.',
        cue: 'Ok',
        helper: 'It only ever appears there. Going back for it on {their} own is the choice you are building.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'Go there, and be paid for it',
        setup:
          'Ask {dog} to go to {their} bed and reward {her} lavishly. Give {her} a special toy or chew {she} only gets there.',
        cadence: { min: 1, max: 2, per: 'day' },
        reps: 5,
        successCriteria: [
          'Gets on the bed when asked',
          'Settles rather than bouncing straight off',
          'Goes there unprompted at least once today',
        ],
      },
      {
        number: 2,
        title: 'A minute, while you do something else',
        setup:
          'Up to a minute on the bed while you work on something else — get a glass of water, look at your phone.',
        cadence: { min: 1, max: 2, per: 'day' },
        reps: 4,
        successCriteria: ['Holds a minute', 'Stays put while you move about the room'],
        overrides: {
          2: {
            instruction: 'Ask {her} to stay for up to a minute while you do something small nearby.',
            cue: 'Stay',
            helper: 'Fill a glass, check your phone. Ordinary, brief, and not about {her}.',
          },
        },
      },
      {
        number: 3,
        title: 'Three to five minutes, with the door going',
        setup:
          'Three to five minutes on the bed while you do something distracting, like opening the front door and pretending to welcome a guest.',
        cadence: { min: 1, max: 2, per: 'day' },
        reps: 3,
        successCriteria: [
          'Holds three minutes or more',
          'Stays on the bed while the door opens',
          'Does not need a second cue',
        ],
        overrides: {
          2: {
            instruction: 'Ask {her} to stay three to five minutes, and open the front door partway through.',
            cue: 'Stay',
            helper:
              'Greet nobody on the porch. A pretend guest first, every time. Practice long before a real one is standing there.',
          },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The handout's five numbered items here are a procedure rather than a
  // ladder, so they are the five steps of one rep rather than five levels.
  {
    id: 'ex-settle',
    slug: 'settle',
    title: 'Settle',
    programId: 'switch-off',
    goalId: 'settle-recovery',
    shortTitle: 'Settle',
    icon: 'goal-settle',
    shortPurpose: '{dog} learns that lying down and switching off is the comfortable option.',
    coverImage: 'plan-mat',
    estimatedMinutes: 8,
    difficulty: 'beginner',
    equipment: ['A flat leash', 'Small treats', '{Their} bed, to start on'],
    safetyNotes: [
      'Leave {her} enough leash to lie down comfortably. This is about making down easy, not about restraint.',
      'Never haul on it. Your foot holds the slack; it does not pull {her} anywhere.',
      'Start on {their} bed. A comfortable place makes the behavior worth choosing.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Stand on the leash, leaving {dog} just enough to lie down on {their} bed.',
        helper:
          'Short enough that standing and sitting are awkward, long enough that lying down is easy. {She} is choosing, not being pulled.',
      },
      {
        instruction: 'Wait. Say nothing, for as long as it takes.',
        helper:
          '{She} may fidget for a while, sometimes ten minutes or more the first few times. That is normal and it is the exercise — you are waiting out the excitement, not correcting it.',
      },
      {
        instruction: 'Let {her} work it out and lie down.',
        helper: 'The down arrives because it is the most comfortable thing available. That is the whole method.',
      },
      {
        instruction: 'Mark it calmly and put the treats between {their} front paws.',
        cue: 'Yes!',
        helper: 'Calmly. An excited “good dog” here undoes the thing you just waited for.',
      },
      // Was "Once she has the idea, put the word on it", which is not a thing
      // to do on the first rep, and left the rep with no end. The word is
      // still said here, but as {she} lies down rather than as a request.
      {
        instruction: 'Say the word quietly while {she} lies there, then step off the leash.',
        cue: 'Settle',
        helper: 'That ends the rep. The word goes on the behavior, not before it. Only once {she} lies down quickly will it work as a request.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'On the leash, on the bed',
        setup: 'Step on the leash and wait {her} out, starting on {their} bed.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 2,
        successCriteria: [
          'Lies down without being made to',
          'Stays down once {she} is there',
          'Takes the treats calmly',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Not a repetition of anything, which is worth saying plainly: a rep here is
  // a stretch of ordinary time with the dog attached to you and ignored. Two
  // reps rather than five, because five would be an afternoon.
  {
    id: 'ex-invisible-dog',
    // A stretch of ordinary time with the dog attached to you and ignored, not something repeated five times.
    kind: PRACTICE,
    slug: 'invisible-dog',
    title: 'Invisible Dog',
    programId: 'switch-off',
    goalId: 'settle-recovery',
    shortTitle: 'Invisible',
    icon: 'goal-walk',
    shortPurpose: '{dog} comes along, is ignored, and learns that calm is what gets noticed.',
    coverImage: 'door-sound-01-setup',
    estimatedMinutes: 15,
    difficulty: 'beginner',
    equipment: ['A leash', 'Treats in your pocket', 'Something ordinary to get on with'],
    safetyNotes: [
      'Never leave {her} attached to you and unattended, and never tie {her} to anything.',
      'Ignoring means no eye contact, no talking, no scolding. Nothing is still attention.',
      'Pay calm the moment it appears, before {she} asks you for anything.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Clip on the leash and attach it to you, through your belt or under your foot.',
        helper: 'Keeping {her} leashed is what makes the calm behavior likely enough to reward.',
      },
      {
        instruction: 'Go about your day and pretend {she} is not there.',
        helper: 'The handout’s word is invisible. No looking, no talking, no correcting.',
      },
      {
        instruction: 'Wait for {her} to give up on you.',
        helper: 'Lying down, a sigh, settling on {their} side. Boredom is the behavior you are after.',
      },
      {
        instruction: 'Pay the calm quietly, without making an occasion of it.',
        helper: 'A treat delivered low and calmly, where {she} is. Do not wake the excitement back up.',
      },
      // Said "Carry on" and nothing else, so the practice had no end to walk
      // to before the app asked how it went.
      {
        instruction: 'Keep going for about fifteen minutes, paying each time {she} settles. Then unclip {her}.',
        helper: 'Longer is fine once {she} has the idea. Fifteen minutes is enough to see the calm arrive.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'Attached, and ignored',
        setup:
          'Keep {dog} with you as you go about your day, or while prepping to work somewhere distracting.',
        cadence: { min: 1, max: 2, per: 'week' },
        reps: 1,
        successCriteria: [
          'Settles without being asked',
          'Stops trying to get your attention',
          'Takes the quiet reward without getting up',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The weakest fit in the pack, and worth being honest about in the code as
  // well as on the screen: this is not a trained behavior with repetitions,
  // it is a management tool the handout recommends daily. It is here because
  // leaving it out would drop a section of the homework, and it is written as
  // one rep because one rep is what it is.
  {
    id: 'ex-interactive-toys',
    // A toy loaded and given. There is nothing here to do twice.
    kind: PRACTICE,
    slug: 'interactive-toys',
    title: 'Interactive Toys',
    programId: 'switch-off',
    goalId: 'settle-recovery',
    shortTitle: 'Toys',
    icon: 'spark',
    shortPurpose: 'Somewhere for {their} energy to go that is not you.',
    coverImage: 'calm-foodtoy',
    estimatedMinutes: 10,
    difficulty: 'beginner',
    equipment: [
      'A food toy, a snuffle mat or a stuffed chew',
      '{Their} own dinner, or part of it',
    ],
    safetyNotes: [
      'Take the kibble out of {their} bowl rather than adding to it. The handout’s phrase is making the kibble work for you.',
      'Stay in the room the first few times, and take any toy that starts coming apart.',
      'Give it somewhere {she} is happy to lie down, ideally on {their} bed.',
    ],
    fallbackImage: BREATHER,
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Load a toy with part of {their} normal food.',
        helper: 'Easy at first. A toy that is too hard gets abandoned, and an abandoned toy teaches nothing.',
      },
      { instruction: 'Send {her} to {their} bed and give it to {her} there.', cue: 'Go to bed' },
      {
        instruction: 'Leave {her} to it and get on with something.',
        helper: 'Do not hover or help. Working it out is the part that tires {her} out.',
      },
      {
        instruction: 'Let {her} finish, and notice how {she} is afterwards.',
        helper:
          'This is the observation worth logging: a dog who settles after the toy is the outcome the handout is promising.',
      },
      { instruction: 'Pick the toy up and put it away until next time.' },
    ],
    levels: [
      {
        number: 1,
        title: 'Part of dinner, in a toy',
        setup:
          'Interactive toys give {their} physical and mental energy somewhere to go. A life saver for young or high energy dogs.',
        cadence: { min: 1, max: 1, per: 'day' },
        reps: 1,
        successCriteria: [
          'Works at the toy rather than giving up',
          'Stays on {their} bed with it',
          'Is calmer afterwards than before',
        ],
      },
    ],
  },
];
