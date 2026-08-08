// Household configuration. Everything that makes this install Lucy's — the
// dog, the people, and the trainer behind the program — lives here and nowhere
// else. Setting up the next client is this file plus their program content;
// no screen changes.

export const DOG = {
  id: 'lucy',
  name: 'Lucy',
  breed: 'Lab / German Wirehaired Pointer mix',
  photo: 'img/lucy-portrait.jpg',
  about: 'Friendly and affectionate. Gets over-aroused around arrivals and unfamiliar people.',
};

/**
 * One handler for the MVP.
 *
 * Sessions still carry `completedByUserId`, so the stored shape and the CSV
 * the trainer receives do not change if a second person is added later. The
 * only thing that went away is the UI for choosing between people, and the
 * mastery rule that depended on there being more than one.
 */
export const HANDLER = {
  id: 'fabiola',
  // `name` is what the app calls her — the greeting, the CSV, the report.
  name: 'Fabiola',
  // `fullName` exists only so the avatar can derive initials from it rather
  // than carrying a hardcoded "FH" that would quietly be wrong for the next
  // household this is set up for.
  fullName: 'Fabiola Hickey',
};

/**
 * The professional behind the program. The app is a companion to their
 * instruction: activities carry their approval, the fallback flow hands hard
 * cases back to them, and the lesson report is addressed to them.
 */
export const TRAINER = {
  name: 'The Canine Coach',
  phone: '612-202-4732',
  url: 'https://www.thek9coach.com',
};
