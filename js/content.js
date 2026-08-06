// Seed content for Lucy Learns.
// Everything the app teaches lives here as structured data, so a new handout
// from The Canine Coach becomes a new activity object rather than a new screen.

export const DOG = {
  id: 'lucy',
  name: 'Lucy',
  breed: 'Lab / German Wirehaired Pointer mix',
  photo: 'img/lucy-portrait.jpg',
  about: 'Friendly and affectionate. Gets over-aroused around arrivals and unfamiliar people.',
};

export const MEMBERS = [
  { id: 'adam', name: 'Adam' },
  { id: 'fabiola', name: 'Fabiola' },
];

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const IMAGES = {
  'dg-01': {
    src: 'img/dg-01.jpg',
    alt: 'Lucy sits on her bed a few feet inside the entryway while a visitor stands in the open doorway and a handler holds a loose leash.',
  },
  'dg-02': {
    src: 'img/dg-02.jpg',
    alt: 'Lucy sits calmly beside the front door on a leash while a handler holds a treat pouch.',
  },
  'dg-03': {
    src: 'img/dg-03.jpg',
    alt: 'Two views side by side: a hand pressing a doorbell, and a hand knocking on a door, with Lucy watching from inside.',
  },
  'dg-04': {
    src: 'img/dg-04.jpg',
    alt: 'Lucy turns away from the door to look up at her handler, who is offering two small treats.',
  },
  'dg-05': {
    src: 'img/dg-05.jpg',
    alt: 'Lucy near the front door turning toward a handler who is calling her cheerfully from the next room.',
  },
  'dg-06': {
    src: 'img/dg-06.jpg',
    alt: 'Lucy moving away from the doorway toward her dog bed while a handler points calmly to the bed.',
  },
  'dg-07': {
    src: 'img/dg-07.jpg',
    alt: 'Lucy lying on her bed holding position while a handler walks toward the closed front door and glances back.',
  },
  'dg-08': {
    src: 'img/dg-08.jpg',
    alt: 'A handler stands at the open front door greeting an imaginary visitor, shown as a faint silhouette, while Lucy stays on her bed.',
  },
  'dg-09': {
    src: 'img/dg-09.jpg',
    alt: 'A familiar guest waits patiently outside the open front door while Lucy stays on her bed several feet away.',
  },
  'dg-10': {
    src: 'img/dg-10.jpg',
    alt: 'A handler walks Lucy on a loose short leash from her bed toward a familiar visitor in the entryway.',
  },
  'dg-11': {
    src: 'img/dg-11.jpg',
    alt: 'Lucy sits calmly while a visitor gently pets her chest and a handler stands beside her holding a loose leash.',
  },
  'dg-12': {
    src: 'img/dg-12.jpg',
    alt: 'A handler feeds Lucy a treat at a comfortable distance from the barely-open front door while a guest waits outside.',
  },
};

// ---------------------------------------------------------------------------
// Goals (how the Activities library is grouped)
// ---------------------------------------------------------------------------

export const GOALS = [
  {
    id: 'door-routine',
    title: 'Door routine',
    blurb: 'Knock or doorbell means look at me and go to your bed.',
  },
  {
    id: 'calm-greetings',
    title: 'Calm greetings',
    blurb: 'Four paws down when someone approaches or arrives.',
    planned: ['Four paws on the floor', 'Sit for petting', 'Permission to greet'],
  },
  {
    id: 'impulse-control',
    title: 'Impulse control',
    blurb: 'Pause, listen, and make a calmer choice while excited.',
    planned: ['Place and settle', 'Wait for food', 'Leave it', 'Wait at doors'],
  },
  {
    id: 'walks-public',
    title: 'Walks and public encounters',
    blurb: 'Stay with your handler when the world gets interesting.',
    planned: ['Name response around distractions', 'People passing on walks', 'Calm greeting outside the home'],
  },
  {
    id: 'settle-recovery',
    title: 'Settle and recovery',
    blurb: 'Come back down after getting excited.',
    planned: ['Recovery after excitement', 'Settle on a mat'],
  },
  {
    id: 'foundation',
    title: 'Foundation skills',
    blurb: 'The basics everything else is built on.',
    planned: ['Recall', 'Calm leash attachment'],
  },
];

// ---------------------------------------------------------------------------
// Household cues
// ---------------------------------------------------------------------------

export const DEFAULT_COMMANDS = [
  { id: 'place', situation: 'Move to bed', cue: 'Go to bed' },
  { id: 'boundary', situation: 'Stay behind boundary', cue: 'Back' },
  { id: 'stay', situation: 'Remain in position', cue: 'Stay' },
  { id: 'attention', situation: 'Look toward handler', cue: 'Lucy!' },
  { id: 'release', situation: 'End position', cue: 'Okay' },
  { id: 'greet', situation: 'Calm approach', cue: 'Go say hi' },
  { id: 'sit', situation: 'Sit', cue: 'Sit' },
];

// ---------------------------------------------------------------------------
// Session logging vocabulary
// ---------------------------------------------------------------------------

export const AROUSAL = [
  { value: 1, label: 'Calm', hint: 'Took treats, stayed loose' },
  { value: 2, label: 'Some excitement', hint: 'Wiggly but listening' },
  { value: 3, label: 'Very excited', hint: 'Hard to reach, still recovered' },
  { value: 4, label: 'Could not complete', hint: 'We stopped early' },
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
    coverImage: 'dg-01',
    blurb:
      'Four activities that rebuild the whole arrival sequence, from the first sound to a calm hello.',
    source: {
      label: 'The Canine Coach handout',
      note:
        'Practice long before real guests arrive. Start with invisible guests, repeat easy sessions, and build muscle memory.',
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
    shortPurpose: 'Lucy hears the doorbell and looks to you instead of the door.',
    coverImage: 'dg-03',
    estimatedMinutes: 5,
    difficulty: 'beginner',
    equipment: ['Lucy on leash', 'Small high-value treats', 'Doorbell or a door to knock on'],
    safetyNotes: [
      'Stop while Lucy is still succeeding, not after she fails.',
      'One sound per repetition. Never repeat the bell to get a reaction.',
    ],
    fallbackImage: 'dg-12',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      {
        instruction: 'Stand near the door with Lucy on leash.',
        image: 'dg-02',
        helper: 'Step lightly on the leash so both hands stay free.',
      },
      {
        instruction: 'Ring or knock once.',
        image: 'dg-03',
        helper: 'One sound only, then wait. Let her hear it before you say anything.',
      },
      {
        instruction: 'Say her name in a bright, happy voice.',
        cue: 'Lucy!',
        image: 'dg-04',
      },
      {
        instruction: 'Give two treats right away.',
        image: 'dg-04',
        helper:
          'You are paying for the sound, not for good behavior. Feed even if she barked, so the bell starts to mean food instead of alarm.',
      },
      {
        instruction: 'Let her settle, then go again.',
        helper: 'A few quiet seconds between reps keeps her under threshold.',
        timerSeconds: 15,
      },
    ],
    levels: [
      {
        number: 1,
        title: 'You make the sound',
        setup: 'You knock or ring while standing right next to Lucy.',
        reps: 5,
        successCriteria: ['No barking on 4 of 5 sounds', 'Turns toward you', 'Takes treats easily'],
      },
      {
        number: 2,
        title: 'Helper makes the sound',
        setup: 'A helper knocks nearby while you stay with Lucy.',
        reps: 5,
        successCriteria: ['No barking on 4 of 5 sounds', 'Turns toward you before the treat'],
        overrides: { 1: { instruction: 'Have your helper knock nearby.', image: 'dg-03' } },
      },
      {
        number: 3,
        title: 'Real doorbell from outside',
        setup: 'A helper rings the actual doorbell from the porch.',
        reps: 5,
        successCriteria: ['No barking on 4 of 5 rings', 'Recovers within a few seconds'],
        overrides: { 1: { instruction: 'Helper rings the real doorbell from outside.', image: 'dg-03' } },
      },
      {
        number: 4,
        title: 'Call from a few feet away',
        setup: 'After the sound, call Lucy from several feet back.',
        reps: 5,
        successCriteria: ['Comes to you after the sound', 'No charging the door'],
        overrides: {
          2: { instruction: 'Call her name from a few feet away.', cue: 'Lucy!', image: 'dg-05' },
        },
      },
      {
        number: 5,
        title: 'Call from another room',
        setup: 'Call Lucy from the kitchen, bedroom, or living room.',
        reps: 5,
        successCriteria: ['Leaves the door and finds you', 'Arrives without barking'],
        overrides: {
          2: { instruction: 'Call her name from another room.', cue: 'Lucy!', image: 'dg-05' },
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
    shortPurpose: 'Lucy holds her bed while you walk over and open the door.',
    coverImage: 'dg-07',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['Lucy on leash', 'Her bed or a marked boundary', 'Small treats'],
    safetyNotes: [
      'Go back to her to reward. Never call her off the bed to get the treat.',
      'If she breaks position twice in a row, drop back a level.',
    ],
    fallbackImage: 'dg-12',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Send Lucy to her bed.', cue: 'Go to bed', image: 'dg-06' },
      {
        instruction: 'Cue the stay and hold her eye for one beat.',
        cue: 'Stay',
        image: 'dg-07',
      },
      { instruction: 'Move toward the door.', image: 'dg-07' },
      {
        instruction: 'Walk back and reward her on the bed.',
        image: 'dg-07',
        helper: 'Deliver the treat between her paws so the bed becomes the paying spot.',
      },
      { instruction: 'Release, then reset for the next rep.', cue: 'Okay' },
    ],
    levels: [
      {
        number: 1,
        title: 'One step away',
        setup: 'Take a single step toward the door and come straight back.',
        reps: 5,
        successCriteria: ['Stays on the bed', 'No creeping forward'],
        overrides: { 2: { instruction: 'Take one step toward the door.', image: 'dg-07' } },
      },
      {
        number: 2,
        title: 'Halfway to the door',
        setup: 'Walk halfway, pause, then return.',
        reps: 5,
        successCriteria: ['Stays on the bed', 'Waits for the release'],
        overrides: { 2: { instruction: 'Walk halfway to the door, then pause.', image: 'dg-07' } },
      },
      {
        number: 3,
        title: 'Touch the handle',
        setup: 'Walk all the way over and put your hand on the handle.',
        reps: 5,
        successCriteria: ['Stays while you touch the handle'],
        overrides: { 2: { instruction: 'Walk over and touch the door handle.', image: 'dg-07' } },
      },
      {
        number: 4,
        title: 'Crack the door',
        setup: 'Open the door a few inches, then close it.',
        reps: 5,
        successCriteria: ['Stays as the door moves', 'No rushing when it opens'],
        overrides: { 2: { instruction: 'Open the door a few inches, then close it.', image: 'dg-07' } },
      },
      {
        number: 5,
        title: 'Open it fully',
        setup: 'Open the door all the way and stand in the doorway.',
        reps: 5,
        successCriteria: ['Holds the bed with the door wide open'],
        overrides: { 2: { instruction: 'Open the door all the way and stand there.', image: 'dg-08' } },
      },
      {
        number: 6,
        title: 'Say hi to nobody',
        setup: 'Open the door and say hello to the empty porch.',
        reps: 5,
        successCriteria: ['Stays through your voice at the door'],
        overrides: {
          2: { instruction: 'Open the door and cheerfully say hi to nobody.', image: 'dg-08' },
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
            image: 'dg-08',
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
          2: { instruction: 'Open the door to a familiar person waiting outside.', image: 'dg-09' },
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
    shortPurpose: 'The doorbell becomes her cue to move away from the door.',
    coverImage: 'dg-06',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
    equipment: ['Lucy on leash', 'Her bed', 'Small treats', 'Doorbell or a door to knock on'],
    safetyNotes: [
      'Keep the whole sequence smooth before you add a pretend visitor.',
      'If she needs the lure three reps in a row, stay at this level.',
    ],
    fallbackImage: 'dg-12',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Ring or knock once.', image: 'dg-03' },
      { instruction: 'Say her name brightly.', cue: 'Lucy!', image: 'dg-04' },
      { instruction: 'Send her to her bed.', cue: 'Go to bed', image: 'dg-06' },
      { instruction: 'Reward her twice on the bed.', image: 'dg-07' },
      {
        instruction: 'Walk toward the door, then come back.',
        image: 'dg-07',
        helper: 'Walking away right after she lands teaches her the bed is where the job happens.',
      },
      { instruction: 'Release and reset.', cue: 'Okay' },
    ],
    levels: [
      {
        number: 1,
        title: 'Lure to the bed',
        setup: 'Lead her to the bed with a treat in your hand.',
        reps: 5,
        successCriteria: ['Follows to the bed', 'Settles once she arrives'],
        overrides: { 2: { instruction: 'Lead her to the bed with a treat.', image: 'dg-06' } },
      },
      {
        number: 2,
        title: 'Point, then pay',
        setup: 'Point to the bed and treat only after she arrives.',
        reps: 5,
        successCriteria: ['Goes to the bed on a point', 'No hand in front of her nose'],
        overrides: { 2: { instruction: 'Point to the bed. Treat after she lands.', image: 'dg-06' } },
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
        overrides: { 4: { instruction: 'Walk all the way to the door, then return.', image: 'dg-07' } },
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
            image: 'dg-08',
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
    shortPurpose: 'A real guest arrives and Lucy greets on your terms.',
    coverImage: 'dg-11',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    equipment: ['Lucy on leash', 'Her bed', 'Small treats', 'A patient familiar guest'],
    safetyNotes: [
      'Brief your guest first. No eye contact, no reaching, no high voices.',
      'If Lucy cannot settle, end the greeting. That is a real result, not a failure.',
      'Pet the chest, never the top of the head.',
    ],
    fallbackImage: 'dg-12',
    fallbackSteps: FALLBACK_STEPS,
    steps: [
      { instruction: 'Leash Lucy and settle her on her bed.', image: 'dg-09' },
      { instruction: 'Your guest rings the bell.', image: 'dg-03' },
      { instruction: 'Send her to her bed.', cue: 'Go to bed', image: 'dg-06' },
      { instruction: 'Open the door. The guest stays put.', image: 'dg-09' },
      { instruction: 'Reward her for holding the bed.', image: 'dg-07' },
      { instruction: 'Bring the guest in and let Lucy settle.', image: 'dg-09' },
      { instruction: 'Walk her over on a loose leash.', cue: 'Go say hi', image: 'dg-10' },
      {
        instruction: 'Ask for a sit, then allow calm petting.',
        cue: 'Sit',
        image: 'dg-11',
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
      },
      {
        number: 3,
        title: 'Guest sits down',
        setup: 'The guest walks in, sits, and ignores Lucy completely.',
        reps: 3,
        endAfterStep: 6,
        successCriteria: ['Holds the bed while the guest moves through the room'],
        overrides: { 5: { instruction: 'Guest walks in, sits down, and ignores her.', image: 'dg-09' } },
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
