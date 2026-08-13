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

### 7. Check it on a laptop

The layout is phone-first and there is a `--page-max` content column, so it
probably behaves. But "probably" is not "checked", and a meaningful share of
people will click a link on a desktop first. Worth ten minutes before sending,
and I have not done it.

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
