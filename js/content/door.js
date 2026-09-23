// The door-greeting curriculum: goals, programs, activities and household cues.
//
// Split out of content.js when a second curriculum arrived. content.js keeps
// everything that is true of the app whatever it is teaching — the picture
// library, the verdict art, the avatars, the logging vocabulary — and a pack
// like this one carries only what changes when the household is working on a
// different problem. See js/pack.js for how one is chosen.
//
// Nothing here imports anything. A pack is data; the helpers that read it
// (activityBySlug, stepsForLevel and the rest) live in content.js and work on
// whichever pack is active.

// This app is a household's real training record and begins at the welcome,
// which is where the dog gets named. See SKIP_SETUP in js/content/excited.js
// for the pack that does not.
export const SKIP_SETUP = false;

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
    shortPurpose: '{dog} lies down and stays down while the room carries on without {her}.',
    note: 'The skill underneath the bed work, taken away from the door.',
  },
  {
    id: 'planned-walk',
    icon: 'plan-walkpeople',
    goalId: 'walks-public',
    coverImage: 'plan-walkpeople',
    title: 'People Passing on Walks',
    shortPurpose: 'Someone walks by and {dog} keeps walking with you.',
    note: 'The same arousal as a doorbell, somewhere you cannot close the door.',
  },
  {
    id: 'planned-name',
    icon: 'plan-name',
    goalId: 'foundation',
    coverImage: 'plan-name',
    title: 'Name Response Around Distractions',
    shortPurpose: '{Their} name turns {their} head no matter what else is happening.',
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
    // The two lines programPitch used to hold as literals. They are about this
    // program specifically — four activities, one arrival — so they live with
    // it rather than in the function that picks between them.
    openingLine: 'Four activities, from the first doorbell to a calm hello.',
    finishedLine: 'All four finished. This is the whole arrival sequence.',
    // The finish line, written out. It sits at the bottom of the program map so
    // the four activities read as one job with an end, not four errands.
    outcome: {
      title: 'A calm hello, every time',
      eyebrow: 'What finishing looks like',
      body:
        'Someone knocks. {dog} looks at you, goes to {their} bed, and stays there while you open the door. {dog} greets the guest when you say so, with four paws on the floor.',
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
      title: 'Before {dog} is reliable',
      intro:
        'A real guest is at the door and the routine is not finished yet. Do not test it. Manage it.',
      branches: [
        {
          when: 'If someone else is home',
          steps: [
            'They answer the door.',
            'You stay next to {dog} and hold the “Back” or “Stay”.',
            'Reward {her} for holding it while the door is busy.',
          ],
        },
        {
          when: 'If you are on your own',
          steps: [
            'Call {dog}, then take {her} with you calmly, on leash or with a hand in {their} collar.',
            'Unlatch the door and say “Just a minute!” through it.',
            'Walk {her} to {their} spot and hold the stay.',
            'Now say “Come in!”',
            'Stay with {her} until {dog} is calm, then escort the guest over for a controlled greeting.',
          ],
        },
      ],
    },
  },
];

// Shared safety guidance shown behind the "Lucy is too excited" button.
const FALLBACK_STEPS = [
  'Move {dog} farther from the door.',
  'Keep {her} on leash and stay beside {her}.',
  'Ask the guest to wait, or let someone else answer.',
  'Drop back one level and make it easy again.',
  'Feed {her} on {their} bed for staying there.',
  'Skip the greeting entirely if {dog} cannot settle.',
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
    shortPurpose: '{dog} hears the doorbell and looks to you instead of the door.',
    coverImage: 'door-sound-cover',
    estimatedMinutes: 5,
    difficulty: 'beginner',
    equipment: ['{dog} on leash', 'Small high-value treats', 'Doorbell or a door to knock on', 'A helper, from level two onward'],
    safetyNotes: [
      'Stop while {dog} is still succeeding, not after a miss.',
      'One sound per repetition. Never repeat the bell to get a reaction.',
      'Talk to {her} calmly through this if you want to. Keep it low key, nothing exciting.',
    ],
    fallbackImage: 'door-sound-cover',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Stand near the door with {dog} on leash.',
        image: 'door-sound-01-setup',
        helper: 'Step lightly on the leash so both hands stay free.',
      },
      {
        instruction: 'Ring or knock once.',
        image: 'door-sound-02-self',
        helper: 'One sound only, then wait. Let {her} hear it before you say anything.',
      },
      {
        instruction: 'Say {their} name in a bright, happy voice.',
        cue: '{dog}!',
        image: 'door-sound-03-name',
      },
      {
        instruction: 'Give two treats right away.',
        image: 'door-sound-04-treats',
        helper:
          'You are paying for the sound, not for good behavior. Feed even after a bark, so the bell starts to mean food instead of alarm.',
      },
      {
        instruction: 'Let {her} settle, then go again.',
        image: 'door-sound-05-settle',
        helper: 'A few quiet seconds between reps keeps {her} under threshold.',
      },
    ],
    levels: [
      {
        number: 1,
        title: 'You make the sound',
        setup: 'You knock or ring while standing right next to {dog}.',
        // The base step draws dg-20 now, which is this level's picture exactly.
        reps: 5,
        successCriteria: ['No barking on 4 of 5 sounds', 'Turns toward you', 'Takes treats easily'],
      },
      {
        number: 2,
        title: 'Helper makes the sound',
        setup: 'A helper knocks nearby while you stay with {dog}.',
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
        setup: 'A helper rings the doorbell from outside while you wait a few feet back, then you call {dog}.',
        reps: 5,
        successCriteria: ['Comes to you after the sound', 'No charging the door'],
        // Step one said to stand at the door stepping on the leash — at the
        // two levels where she is called to you from across the room — and
        // step two still said "Ring or knock once", which you cannot do from
        // a few feet back or from another room. The sound comes from the
        // helper on the porch, as it did at level three, and these two levels
        // only move you away from it. The leash comes off for the same reason
        // the name-distant picture draws none: she has to be free to come.
        overrides: {
          0: {
            instruction: 'Settle {dog} on {their} bed by the door, then walk a few feet back into the room.',
            image: null,
            helper: 'Take the leash off, so {she} is free to come to you when you call.',
          },
          1: {
            instruction: 'Your helper rings the doorbell once from outside.',
            image: 'door-sound-02-bell',
            helper: 'One ring only. Agree it with your helper before you start, so nobody rings twice to get a reaction.',
          },
          2: { instruction: 'Call {their} name from a few feet away.', cue: '{dog}!', image: 'door-sound-03-name-distant' },
        },
      },
      {
        number: 5,
        title: 'Call from another room',
        setup: 'A helper rings the doorbell from outside while you wait in the kitchen, bedroom, or living room, then you call {dog}.',
        reps: 5,
        successCriteria: ['Leaves the door and finds you', 'Arrives without barking'],
        overrides: {
          0: {
            instruction: 'Settle {dog} on {their} bed by the door, then go into another room.',
            image: null,
            helper: 'Take the leash off, so {she} can come and find you.',
          },
          1: {
            instruction: 'Your helper rings the doorbell once from outside.',
            image: 'door-sound-02-bell',
            helper: 'One ring only. Agree it with your helper before you start, so nobody rings twice to get a reaction.',
          },
          2: { instruction: 'Call {their} name from another room.', cue: '{dog}!', image: 'door-sound-03-name-distant' },
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
    shortPurpose: '{dog} holds {their} bed while you walk over and open the door.',
    coverImage: 'door-stay-cover',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['{dog} on leash', '{Their} bed or a marked boundary', 'Small treats'],
    safetyNotes: [
      'Go back to {her} to reward. Never call {her} off the bed to get the treat.',
      'If {dog} breaks position twice in a row, drop back a level.',
      'A boundary works as well as a bed. If you use one, cue “Back” instead of “Go to bed”.',
    ],
    fallbackImage: 'door-stay-04-pay',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Send {dog} to {their} bed.', cue: 'Go to bed', image: 'door-place-03-send' },
      {
        instruction: 'Cue the stay and hold {their} eye for one beat.',
        cue: 'Stay',
        image: 'door-stay-02-cue',
      },
      { instruction: 'Move toward the door.', image: 'door-stay-03-cross' },
      {
        // dg-07 showed the handler walking away with nothing in her hands on a
        // step about coming back and paying. dg-25 is that payment, drawn.
        instruction: 'Walk back and reward {her} on the bed.',
        image: 'door-stay-04-pay',
        helper: 'Deliver the treat between {their} paws so the bed becomes the paying spot.',
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
        setup: 'Someone {dog} knows stands outside while you open the door.',
        reps: 4,
        successCriteria: ['Holds the bed while a real person is visible'],
        overrides: {
          2: { instruction: 'Open the door to a familiar person waiting outside.', image: 'door-greet-04-open' },
          4: { instruction: 'Release {her}, and your helper steps back outside.', image: 'door-greet-09-leaves' },
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
    shortPurpose: 'The doorbell becomes {their} cue to move away from the door.',
    coverImage: 'door-place-cover',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['{dog} on leash', '{Their} bed', 'Small treats', 'Doorbell or a door to knock on'],
    safetyNotes: [
      'Keep the whole sequence smooth before you add a pretend visitor.',
      'If {dog} needs the lure three reps in a row, stay at this level.',
    ],
    fallbackImage: 'door-stay-04-pay',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Ring or knock once.', image: 'door-sound-02-self' },
      { instruction: 'Say {their} name brightly.', cue: '{dog}!', image: 'door-sound-03-name' },
      { instruction: 'Send {her} to {their} bed.', cue: 'Go to bed', image: 'door-place-03-send' },
      { instruction: 'Reward {her} twice on the bed.', image: 'door-stay-04-pay' },
      {
        instruction: 'Walk toward the door, then come back.',
        image: 'door-stay-03-cross',
        helper: 'Walking away right after {dog} lands teaches {her} the bed is where the job happens.',
      },
      { instruction: 'Release and reset.', cue: 'Okay', image: 'door-stay-05-release' },
    ],
    levels: [
      {
        number: 1,
        title: 'Lure to the bed',
        setup: 'Lead {her} to the bed with a treat in your hand.',
        reps: 5,
        successCriteria: ['Follows to the bed', 'Settles on arrival'],
        overrides: { 2: { instruction: 'Lead {her} to the bed with a treat.', image: 'door-place-03-send' } },
      },
      {
        number: 2,
        title: 'Point, then pay',
        setup: 'Point to the bed and treat only after {dog} arrives.',
        reps: 5,
        successCriteria: ['Goes to the bed on a point', 'No hand in front of {their} nose'],
        overrides: { 2: { instruction: 'Point to the bed. Treat after {dog} lands.', image: 'door-place-03-send' } },
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
        setup: 'After {dog} lands, walk all the way to the door without hesitating.',
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
            helper: 'Then close the door, walk back, and pay {her} for staying.',
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
    shortPurpose: 'A real guest arrives and {dog} greets on your terms.',
    coverImage: 'door-greet-cover',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    equipment: ['{dog} on leash', '{Their} bed', 'Small treats', 'A patient familiar guest'],
    safetyNotes: [
      'Brief your guest first. No eye contact, no reaching, no high voices.',
      'If {dog} cannot settle, end the greeting. That is a real result, not a failure.',
      'Pet the chest, never the top of the head.',
      'If {dog} pulls ahead on the way over, step on the leash or put gentle downward pressure on {their} collar.',
    ],
    fallbackImage: 'door-sound-cover',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      // Step one used to settle her on the bed and step three sent her to the
      // bed she was already on. The bell is what brings her off it, and the
      // send is the rep; the steps now say so.
      { instruction: 'Leash {dog} and wait with {her} by {their} bed.', image: 'door-greet-01-settle' },
      { instruction: 'Your guest rings the bell.', image: 'door-sound-02-bell' },
      {
        instruction: 'Send {her} to {their} bed.',
        cue: 'Go to bed',
        image: 'door-place-03-send',
        helper: 'The bell will probably bring {her} up. Sending {her} back is the point of the rep.',
      },
      { instruction: 'Open the door. The guest stays put.', image: 'door-greet-04-open' },
      { instruction: 'Reward {her} for holding the bed.', image: 'door-greet-05-reward' },
      { instruction: 'Bring the guest in and let {dog} settle.', image: 'door-greet-06-enter' },
      { instruction: 'Walk {her} over on a loose leash.', cue: 'Go say hi', image: 'door-greet-07-approach' },
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
        helper: 'If {their} front feet leave the floor, the guest stands up and turns away. Reset and try again.',
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
        // A level that stops early stopped on a step that was never written as
        // a last one: the rep ended with the door standing open and the guest
        // on the porch. The last step of a short level says how it ends.
        overrides: { 4: { instruction: 'Reward {her} for holding the bed, then close the door to finish.' } },
      },
      {
        number: 2,
        title: 'Guest steps inside',
        setup: 'The guest comes in and stands quietly by the door.',
        reps: 3,
        endAfterStep: 6,
        successCriteria: ['Holds the bed while the guest enters', 'Settles within a few seconds'],
        // The image is the base step's now, so this override only rewords it.
        overrides: {
          5: { instruction: 'Guest steps in and stands by the door. Reward {dog} on the bed to finish.' },
        },
      },
      {
        number: 3,
        title: 'Guest sits down',
        setup: 'The guest walks in, sits, and ignores {dog} completely.',
        reps: 3,
        endAfterStep: 6,
        successCriteria: ['Holds the bed while the guest moves through the room'],
        overrides: {
          5: {
            instruction: 'Guest walks in, sits, and ignores {her}. Reward {dog} on the bed to finish.',
            image: 'door-greet-06-seated',
          },
        },
      },
      {
        number: 4,
        title: 'Calm hello',
        setup: 'Escort {dog} over for a sit and gentle petting.',
        reps: 3,
        successCriteria: ['Four paws down the whole time', 'Sits before being touched', 'No nipping'],
      },
      {
        number: 5,
        title: 'Less familiar visitor',
        setup: 'Repeat the whole routine with someone {dog} knows less well.',
        reps: 2,
        successCriteria: ['Same routine holds with a newer person', 'Recovers within a minute'],
      },
    ],
  },
];
