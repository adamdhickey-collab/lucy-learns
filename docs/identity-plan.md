# Opening the app to someone who is not Fabiola

A proposal, not a build. Three things are being asked for: a person can name
themselves and get an avatar from it, the dog's name and breed are collected at
setup, and you can appear to switch between people without that being real yet.

---

## 1. What is hardcoded today

`js/config.js` holds three frozen objects — `DOG`, `HANDLER`, `TRAINER` — and
they are module constants, imported directly by eight files. The file's own
header says setting up the next client is "this file plus their program
content", which is true and is exactly the assumption being retired: it is a
per-install edit by a developer, not something a user can do.

Where identity is actually read:

| Field | Read by | What it does |
| --- | --- | --- |
| `HANDLER.name` | Today's greeting, CSV export | "Hello, Fabiola" |
| `HANDLER.fullName` | Today's avatar | Initials are derived, not stored — "FH" |
| `HANDLER.id` | every saved session and moment | `completedByUserId` |
| `DOG.name` | Lucy tab, report title, share text, one activity line, program blurb | 6 places |
| `DOG.breed` | profile card, one CSV header line | **2 places, both decorative** |
| `DOG.photo` | Lucy tab | the portrait |
| `DOG.id` | CSV filename | `lucy-training-log-…csv` |

**Two findings shape everything below.**

**`DOG.breed` is cosmetic.** It is printed twice and computed with nowhere. No
threshold, no recommendation, no metric touches it. That is the single most
useful fact for designing the breed question, and it is in section 4.

**Multi-user is already in the data.** Every session and every moment carries
`completedByUserId`. `config.js` even says so: the field survived when the
person-picker UI was removed. So attribution does not need inventing — it needs
switching on.

---

## 2. The architectural move

Identity has to stop being a constant and start being state.

**Keep `config.js`, demote it.** It becomes the *defaults* a brand new install
starts from, not the truth it runs on. The truth moves into the store, beside
`commands` and `weeklyGoal`, which are already user-editable and already
persist.

```
state.dog     = { id, name, breed, photo, about }
state.people  = [ { id, name, initials } ]
state.activePersonId
```

**Views read through accessors, not imports.** `getDog()` and `getPerson()` in
`store.js`, replacing `import { DOG, HANDLER }` in the eight files that have it.
The alternative — leaving the imports and mutating the exported objects at boot
— works and is a trap: it makes a module's exports change under callers, which
is exactly the kind of thing that reads fine and debugs badly.

**Migration is a one-liner with a real consequence.** `emptyState()` seeds
`dog` and `people` from `config.js`, and `load()` fills them in for any stored
state that predates the change. Your existing install keeps Lucy and Fabiola and
notices nothing. Worth stating plainly: after this, editing `config.js` no
longer changes an install that has already run once.

**Cost:** eight files touched, mechanically. No screen changes beyond the ones
in section 3.

---

## 3. The setup flow

The welcome already exists and already has the right shape:
[welcome.js](../js/views/welcome.js) runs a set of story panels and then a
final "How do you want to start?" screen with two choices. Two screens slot in
between the story and that choice — the questions come after the app has
explained itself and before it asks about demo data.

### Screen A — the person

> **Who is practising?**
> Your name
> `[ Fabiola            ]`   ◯ FH
> *This is the name the app greets you by and the initials on your avatar. You
> can change both later.*

One field. The avatar preview updates as they type, which is the whole reason
to ask: it makes the initials a visible consequence of the answer rather than a
thing that happens to them.

**Required.** The greeting, the CSV and the report all read this, and there is
no sensible fallback that is not a lie.

### Screen B — the dog

> **Who are you training?**
> Their name
> `[ Lucy               ]`
> Breed *(optional)*
> `[ Mixed breed, Labrador, not sure…      ]`
> *However you would describe them. "Mixed" and "not sure" are perfectly good
> answers.*

Name required, breed optional. Two fields on one screen because they are the
same subject and the second is skippable — the one-question-per-screen rule
earns its keep when every question is mandatory, and gets tedious when it is
not.

### Then the existing choice screen, unchanged.

**Field behaviour**, all boring on purpose: `autocapitalize="words"`,
`autocomplete="off"` on the dog's name (browsers will offer the human's saved
names otherwise), `enterkeyhint="next"`, no validation beyond non-empty, no
character limits that trigger before something is genuinely too long for the
greeting to hold. Required-ness is signalled by marking the optional field
"optional" rather than starring the required ones.

---

## 4. The breed question, which is the interesting one

Breed is genuinely awkward to collect, and this app has an advantage most do
not: **the answer is never computed with.** It is printed on a profile card and
in a CSV header. That makes the correct data type a string — whatever the
household would say out loud — and makes most of the usual machinery wrong.

**What not to do, and why:**

- **A single-select of 200 breeds.** Around a third to a half of dogs in US
  homes are mixed, and rescues frequently arrive with a guess on the paperwork
  and nothing behind it. A single-select forces those people to pick something
  false or abandon the field.
- **Primary / secondary breed dropdowns.** Better-looking, same flaw: it
  assumes a resolution the owner may not have. "Some kind of terrier" is a
  complete answer to this question and fits in neither box.
- **Required, in any form.** There is nothing downstream to protect.
- **A DNA-style percentage split.** Precision the app cannot use and the owner
  usually does not have.

**What to do:** one free-text field, optional, with a `<datalist>` of perhaps
forty common breeds plus "Mixed breed" and "Not sure". A datalist is the right
control precisely because it *suggests without constraining* — typing "lab"
offers Labrador Retriever, and typing "some kind of terrier" is accepted
unchanged. Store the string verbatim; print the string verbatim.

**If breed ever becomes functional, this is the wrong question.** Nothing in a
training program keys off ancestry. What would actually change advice is size,
age and energy — "how much dog is on the end of the leash" — and those are
askable, verifiable and useful. Worth recording so that a future feature does
not try to make this field carry weight it was never designed for.

---

## 5. The avatar

Derive, do not ask. Initials come from the typed name: first letter of the
first word plus first letter of the last word, uppercased, capped at two. A
single-word name gives one letter, which looks deliberate. The app already does
exactly this — `initialsOf(HANDLER.fullName)` — so the logic exists and only
its input changes.

Store the name, derive the initials. One source of truth, and a name change
cannot leave stale initials behind. If someone needs "JR" from "Jane
Rodriguez-Smith", an override field belongs in the profile screen later, not in
setup.

---

## 6. Switching people, simulated honestly — **built**

> Built as described. The avatar on Today opens it, and so does a row at the
> top of the profile, under the dog and above the training. The avatar stopped
> being a link to the profile to do it: that shortcut made sense when the
> profile was the only place a person appeared and the tab was named after the
> dog, but there is a Profile tab in the bar now, so the avatar was pointing at
> something already on screen. It depicts who is holding the phone, so that is
> what it should open.
>
> **One thing this uncovered.** `memberName()` in the CSV export ignored its
> argument and returned the *active* person for every row. With one person on
> the install that is indistinguishable from correct, and it would have stayed
> invisible until the moment switching shipped — at which point the trainer's
> export would have credited the entire history to whoever happened to be
> holding the phone when it was exported. The bug predates the feature that
> exposes it, which is the usual order. Fixed and verified per row.
>
> Removing somebody keeps their sessions, with their id intact; the export
> names them "Someone else" rather than blanking the cell, which would read as
> a logging failure rather than a deletion. The last person cannot be removed.

**Scope: one household, one dog, several people who practise with it.** That is
the real product shape, and it is what the stored data already describes.

- Tapping the avatar opens a sheet: the people on this device, a tick against
  the active one, and an **Add someone** row.
- Adding asks one question — their name — and switches to them.
- Switching changes the greeting, the avatar, and the `completedByUserId`
  written onto anything logged from then on.
- Everything else stays shared. The dog, the sessions, the program position and
  the report are the household's, not the person's.

**Deliberately not built, and worth saying out loud in the demo:** per-person
history or progress, any notion of accounts, permissions, or sync between
devices. The app is localStorage on one browser and switching people does not
change that.

This scope is the honest one because the data model already supports it. You
are not miming a feature; you are exposing the attribution that has been
recorded on every session all along.

---

## 7. What I would leave out

- **Editing the trainer.** The trainer configures the app for a client; a
  household should not be renaming their trainer in setup. See
  [demo-readiness.md](demo-readiness.md) for why the trainer's *contact
  details* are nonetheless a blocker.
- **A photo for the dog.** Upload, crop, storage and quota, to replace an
  illustration that is Lucy in every other picture in the app.
- **Per-person anything beyond the name.**

---

## 8. Decisions I need from you

1. **The pictures stay Lucy.** Every illustration in the app is one specific
   black dog. Someone who names their dog Rufus gets Lucy's portrait on the
   profile and Lucy in thirty scenes. For a demo I think that is fine and
   should simply be named — but it is your call whether setup says so.
2. **Should a demo visitor land on example data by default?** Today the choice
   is even-handed. For strangers, an empty app hides most of the product.
3. **Keep breed at all?** It is decorative. Keeping it is defensible because it
   makes the profile feel like theirs; cutting it removes a question.

---

## 9. Rough shape of the work

| Step | What | Size | State |
| --- | --- | --- | --- |
| 1 | Identity into state, accessors, migration | Medium — 8 files, mechanical | Done |
| 2 | Two setup screens in the existing welcome | Small | Done |
| 3 | Breed field with datalist | Small | Done |
| 4 | Avatar sheet: switch and add | Small–medium | Done |
| 5 | Profile screen edits name, breed, initials | Small | Open |

Steps 1–3 delivered "the app is not Fabiola's any more", which was the part
blocking the demo. Step 4 is the switching.

Step 5 is what is left, and it is smaller than it was: the switcher covers
adding and removing people, so what remains is **editing** — renaming a person
or the dog, and changing the breed, after setup. Today the only way to correct
a typo in either is to reset the whole app. `setPersonName` and `setDog` are
already there and already used by the welcome; step 5 is a screen for them.
