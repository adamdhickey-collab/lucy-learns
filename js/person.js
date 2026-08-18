// Who is practicing, and the one place that question gets answered.
//
// Two screens open this — the avatar on Today and the row on the profile — so
// it lives here rather than in either of them. The sheet itself is in ui.js
// with the other dialogs and knows nothing about storage; this is the piece
// that joins the two, which keeps ui.js free of a store import.

import {
  getPeople,
  getPerson,
  addPerson,
  setActivePerson,
  removePerson,
  renamePerson,
} from './store.js';
import { personSheet, refreshApp, toast, firstNameOf } from './ui.js';

/**
 * Open the switcher.
 *
 * Every path through it ends in `refreshApp()` because the active person is
 * printed in two places on Today alone — the greeting and the avatar — and a
 * switch that left either of them showing the previous person would undermine
 * the one thing the sheet is for.
 *
 * The toast is not decoration either. Switching is silent by nature: the sheet
 * closes and two small pieces of text change, which is easy to miss and
 * expensive to get wrong, since the next logged session is attributed to
 * whoever this left active.
 */
export function openPersonSwitcher() {
  const people = getPeople();

  const announce = (name) => {
    refreshApp();
    toast(`Practicing as ${firstNameOf(name)}`);
  };

  personSheet({
    people: people.map((p) => ({ id: p.id, name: p.name })),
    activeId: getPerson().id,

    onSelect: (id) => {
      setActivePerson(id);
      announce(getPerson().name);
    },

    onAdd: (name) => {
      addPerson(name);
      announce(name);
    },

    // Any row, not only the active one. The typo worth fixing is usually in
    // somebody else's name — put in by whoever set the app up — and making
    // people switch to a person to correct their spelling would move the
    // attribution of the next session as a side effect of proofreading.
    onRename: (id, name) => {
      if (!renamePerson(id, name)) return;
      refreshApp();
      toast(`Now ${firstNameOf(name)}`);
    },

    // Withheld entirely when there is one person, so the sheet does not offer
    // a control that `removePerson` would refuse. The last person cannot be
    // removed: there would be nobody to attribute the next session to, and no
    // screen from which to add one.
    onRemove:
      people.length > 1
        ? (id) => {
            const going = people.find((p) => p.id === id);
            if (!removePerson(id)) return;
            refreshApp();
            // Says what survived, because the honest worry on deleting a
            // person is whether their practice went with them. It did not.
            toast(`${firstNameOf(going.name)} removed. Their logged sessions stay.`);
          }
        : undefined,
  });
}
