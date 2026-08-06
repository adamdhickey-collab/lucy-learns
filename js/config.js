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

export const MEMBERS = [
  { id: 'adam', name: 'Adam' },
  { id: 'fabiola', name: 'Fabiola' },
];

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
