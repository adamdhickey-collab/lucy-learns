// Household configuration. Everything that makes this install Lucy's — the
// dog, the people, and the trainer behind the program — lives here and nowhere
// else. Setting up the next client is this file plus their program content;
// no screen changes.

export const DOG = {
  id: 'lucy',
  name: 'Lucy',
  /**
   * One of the ten pickable portraits, not Lucy's own.
   *
   * This is the default a *fresh install* begins with, and a fresh install is
   * a stranger — handing them Lucy's specific painted portrait as the picture
   * of their dog is the "every picture is one specific dog" problem at its
   * most pointed, on the one screen that is supposed to be about their dog.
   * `dog-01` is the black Labrador, which is both the most common dog this
   * will meet and Lucy's own build.
   *
   * Lucy's install used to be untouched by this — her `photo` was written into
   * stored state at setup, and config only supplies defaults to installs that
   * have none — so `img/lucy-portrait.jpg` shipped and was precached purely to
   * keep that one household's picture on screen. The redrawn dog-01 is the same
   * dog in the same palette as everything else, so the portrait was dropped and
   * js/store.js repoints her stored path here. Lucy and a fresh install now see
   * the same picture, which is the first time that has been true.
   */
  photo: 'img/avatars/dog-01.png',
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
 *
 * `phone` and `url` are null on purpose, and the screens that use them check
 * before rendering anything tappable.
 *
 * They held a real number and a real business site, wired to live `tel:` and
 * `https:` links in three places — one of them offered mid-session, at the
 * moment somebody is struggling and most likely to take it. That is correct
 * for the one household this was built for and unshippable the moment a link
 * goes to people who are trying the app out: a working business would start
 * taking calls from strangers exploring a demo. The cost of that mistake lands
 * on someone outside this project, which is why it is the one thing that had
 * to change before anything was shared.
 *
 * To restore them for a real install, put the values back. Nothing else needs
 * touching — the buttons return on their own, because their absence is what
 * removes them rather than a flag somewhere else.
 *
 * `name` is null on the same terms and for the same reason. A named practice
 * on every screen is an endorsement by a business that has not agreed to
 * appear in a build being handed around, and the screens read better without
 * it than a demo pretending to be somebody's client: what is true right now is
 * that there is a trainer, not who they are. So the copy says "your trainer"
 * throughout — which is what the player's stuck-sheet has always said — and
 * the two lines that exist only to credit a name disappear rather than crediting
 * nobody. Put a name back and they return on their own.
 */
export const TRAINER = {
  name: null,
  phone: null,
  url: null,
};

/**
 * What the screens call them in a sentence.
 *
 * One place, because the phrase appears in eight of them and a wording that
 * exists eight times drifts. Lower case: every use is mid-sentence, which is
 * a constraint on the copy rather than on this value — a sentence that would
 * open with it gets rewritten, not capitalised here.
 */
export const trainerName = () => TRAINER.name || 'your trainer';
