# Before handing this to people to try

Everything I would want fixed, in the order I would fix it, with the reasoning
for the ranking. The test each item is judged against: **a stranger opens the
link on their own phone, with their own dog in mind, and nobody is standing
next to them to explain.**

---

## P0 — do not send the link until these are done

### 1. A real trainer's phone number is wired to live Call buttons

`TRAINER.phone` is `612-202-4732` and `TRAINER.url` is a real business site.
There are three outbound points:

- [lucy.js](../js/views/lucy.js) — a **Call** button and a **Website** button
- [player.js](../js/views/player.js) — "call The Canine Coach" inside the
  take-the-pressure-off sheet, which is shown at the exact moment someone is
  having a hard session

All three are real `tel:` and `https:` links. Hand this to twenty people and
some number of them will tap Call — out of curiosity, or because the app
suggested it while they were struggling — and a working dog-training business
will start receiving calls from strangers using a demo.

This is the one item on the list with a cost outside your project.

**Options:** swap in a placeholder for the demo build; or keep the trainer named
and make the buttons inert with a line like "your trainer's details would be
here". I would do the second — it keeps the app's actual shape, which is that it
is a companion to a real professional.

### 2. Everyone is greeted "Hello, Fabiola"

The handler is hardcoded, so every stranger opens someone else's account:
"Hello, Fabiola" over an "FH" avatar. When this was tested with participants it
had to be handled in the *briefing text* — you cannot brief a link.

This is the work in [identity-plan.md](identity-plan.md), and steps 1–3 there
are the minimum: identity into state, two setup screens, done.

### 3. `?study` wiping data on every load — **fixed today**

A bare `?study` meant demo, and applying it wiped storage and reseeded twelve
days *on every page load*. Any shared link carrying it would have destroyed a
visitor's own logging on each refresh. It now strips itself from the URL after
applying. Listed because it belongs in the P0 class, not because it is
outstanding.

---

## P1 — worth doing before a wide send

### 4. Every picture is one specific dog

Thirty-odd illustrations, one black Lab / German Wirehaired Pointer mix. Someone
who sets up "Rufus, golden retriever" gets Lucy's portrait on the profile and
Lucy in every scene.

Not fixable — regenerating the set per breed is not a thing. It is **frameable**:
one line during setup, or on the profile, saying the illustrations show an
example dog. Cheap, and it converts a bug report into an understood convention.

### 5. Decide what a stranger lands in

The final setup screen offers "Start empty" and "Fill in example data first"
even-handedly. For a household, empty is right — their first session should be
their first session. For a stranger evaluating the app, empty hides Progress,
the report, mastery, the program map and the streak: most of the product.

I would make example data the recommended path for the demo and say why in the
copy.

### 6. Nobody will know to install it

It is a PWA. On a phone it opens in a browser tab with the address bar eating
the top of the screen, and every launch image, the splash handoff and the
standalone chrome only exist once it is on the home screen. A first-run hint —
"Add to Home Screen for the full thing" — is the difference between people
seeing the app you built and people seeing a website.

### 7. Check it on a laptop — done, and it did not behave

Checked at 1280×800 and 1440×900, every route, then re-checked at 375×812 to be
sure the fixes were inert on a phone. "Probably behaves" was half right: eight
routes, no horizontal overflow on any of them, and the column centres correctly.
Two things were broken, both the same mistake.

Full-bleed and column-width are the same thing on a phone, because `--page-max`
is 34rem and no phone is that wide. So anything sized to the *window* rather
than to the column looked correct for the entire life of the project, and only
came apart on a wide screen:

- **The activity detail screen opened on a wall of illustration.** The hero is
  `width: 100%` at 4/3, so its height is the window width × 0.75 — a 960px
  photograph in an 800px viewport. The title, the levels and the steps were all
  below the fold, and the back button sat in the corner of the *window* rather
  than over the picture. Now capped to the column: 544 × 408, the same crop a
  phone gets. Capped on width rather than height deliberately — `object-fit:
  cover` in a 1280-wide box slices a letterbox strip out of the middle of a 4/3
  painting, which on these illustrations cuts the heads off.
- **The session bar was as wide as the window.** Close button at x=16, step
  badge at x=1264, about 1100px apart, with the progress track stretched into a
  1102px hairline between them — three controls at the far edges of a screen
  whose content was a 34rem column in the middle. Now held to the column, the
  way `.player-foot` already held its button.

Still true and left alone, because it is a judgement call rather than a defect:
on a 1280px laptop the app is a 544px column with ~58% of the screen empty
either side, and the tab bar and the player footer paint their surfaces the full
width of the window with their contents centred. It reads as a phone app being
shown on a laptop, which is what it is. Widening the column would mean designing
a second layout; docking the bars to the column would mean deciding what the
empty field is for. Neither is a ten-minute change, and neither blocks a demo.

---

## P2 — real product defects, already measured, still open

These came out of the blind reads. None of them blocks a demo; all of them are
things a thoughtful visitor may notice.

### 8. The report headline is largely one activity wearing a hat

7 of 12 demo sessions are *Doorbell Predicts Rewards*, which itself scores 77% —
so the top-line "77%" is close to a restatement of one skill presented as a
statement about the dog. Fixing it changes what the number *is* (weight it?
split it? caption it?), which is a decision rather than a patch.

### 9. The trainer's most-wanted content is last and smallest

All three trainer-readers called the household's typed note the most useful
thing on the report; two said they would open the lesson with it. It is the
final section in the smallest type. Moving it up is a layout decision and the
strongest single signal that run produced.

### 10. The calm rate is labelled, not weighted

"83% — 57% last week, on harder levels" now tells the truth about the confound
instead of hiding it, which was the right first fix. It still invites the
optimistic read, because the number itself is unadjusted.

---

## P3 — only if you want them

- **Analytics.** You have no measurement on the live app. If you want to know
  whether people find the report, that needs something — and I would not add a
  third-party snippet without you choosing it deliberately.
- **A way back to the demo state.** The Lucy tab has "Load example data" and
  "Reset to a brand new app", which is enough, but a visitor who wrecks their
  state has to find them.

---

## The short version

Three things before you send anything: **the phone number**, **the greeting**,
and a **decision about what strangers land in**. The first has a cost outside
your project, the second is the identity work you have already asked for, and
the third is one line of copy.

Everything below that improves the demo. Nothing below that should stop it.
