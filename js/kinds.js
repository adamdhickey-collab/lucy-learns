/**
 * What kind of thing an activity is, as a value both sides can name.
 *
 * This is one constant in a file of its own, and the reason is a cycle. The
 * obvious home for it is content.js, beside `isPractice` which reads it — but
 * content.js imports the packs, so a pack importing the constant back would
 * close a loop, and ES modules resolve that loop by evaluating the pack first.
 * The constant is still in its temporal dead zone at that moment, and the app
 * dies on load with "Cannot access 'PRACTICE' before initialization". Not a
 * subtle failure, and not one a test would have to be clever to catch: every
 * screen is blank.
 *
 * The alternative was the literal 'practice' written in both places, which is
 * the same fact in two files and drifts the first time somebody renames it.
 * A module that imports nothing can be imported by anything, which is what
 * makes this the shape that works.
 */

/**
 * A practice is done once. See `isPractice` in content.js for what that means
 * and which exercises it covers.
 */
export const PRACTICE = 'practice';
