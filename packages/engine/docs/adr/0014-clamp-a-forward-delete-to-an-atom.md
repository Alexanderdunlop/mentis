# 0014 — Clamp a forward delete to the atom it starts at; leave grapheme granularity alone

- **Status:** accepted
- **Date:** 2026-08-10
- **Amends:** [0004](0004-take-edit-ranges-from-the-browser.md)

## Context

[ADR 0004](0004-take-edit-ranges-from-the-browser.md) takes the edit range from
`getTargetRanges()` and uses it **exactly as given**. Its postscript recorded that engines
disagree about how much one delete covers, pinned three `test.fixme`s, and left one
question open:

> whether the engine should clamp a browser-supplied range to its own idea of one unit.

It framed all three fixmes as one phenomenon — "granularity" — and deferred them together.
Measuring first says that framing is wrong. **They are two phenomena with opposite
answers**, which is why they could not be settled as one question.

### What was measured

Every range below is from `getTargetRanges()` in a real browser, one document, one
keypress. `[chip]` is a `contenteditable="false"` atom.

**Forward delete over an atom** — Firefox computes the range as *the atom plus one grapheme
of whatever text follows*, and **collapses it when nothing follows**:

| document, caret before the chip | Chromium / WebKit | Firefox | Firefox's result |
|---|---|---|---|
| `[chip]" hi"` | the atom | atom + `" "` | `"hi"` — a space destroyed |
| `[chip]"hi"` | the atom | atom + `"h"` | `"i"` — **a letter destroyed** |
| `[chip]"👍x"` | the atom | atom + `"👍"` | `"x"` — the whole emoji destroyed |
| `[chip][chip]` | the atom | **collapsed** | nothing deleted |
| `[chip]` alone | the atom | **collapsed** | nothing deleted |
| `"ab"[chip]` | the atom | **collapsed** | nothing deleted |

One rule explains every row. The two collapsed rows are the serious half: ADR 0004 reads a
collapsed browser range as "delete nothing — that is information, not an omission", so the
engine faithfully did nothing, and **a trailing mention chip could not be deleted with the
Delete key at all in Firefox.**

Backspace over an atom is clean on every engine, including Firefox: `(DIV, 1) → (DIV, 2)`,
exactly the atom.

**Backspace over a grapheme cluster** — a genuine, *directional* difference:

| | Chromium / WebKit | Firefox |
|---|---|---|
| Backspace `"hi 👨‍👩‍👧"` | `"hi "` | `"hi 👨‍👩"` — last member and one joiner |
| Backspace `"hi é"` (combining) | `"hi "` | `"hi e"` — the accent only |
| **Delete forward** over either | whole cluster | **whole cluster** |

Firefox peels a cluster backwards and removes it whole forwards. That is coherent rather
than careless: backspace fixes a typo by component, forward delete removes a character.

Nothing in either table corrupts anything. No engine ever produces half a code point — even
Firefox's over-reach lands on a grapheme boundary — and the model never falls out of step
with the DOM.

## Decision

**Two answers, because there are two phenomena.**

**1. Grapheme granularity stays the browser's.** No clamp. Firefox's peeling backspace is a
platform convention its users get in every other text field, it is internally consistent,
and [ADR 0003](0003-own-editing-not-navigation.md)'s whole philosophy is to leave platform
convention alone. Overriding it would mean reimplementing per-platform delete semantics —
the work ADR 0004 exists to avoid — to make Firefox behave less like Firefox.

**2. A forward delete at an atom is clamped to that atom.** In `transaction-for.ts`:

> When `inputType` is exactly `deleteContentForward`, the selection is collapsed, and an
> atom starts at the caret, the range becomes that atom and nothing else.

Deliberately three conditions, because each excludes a case the clamp would break:

- **only `deleteContentForward`** — `deleteWordForward` legitimately covers more than the
  atom, and narrowing it is precisely the "word delete silently becomes a character delete"
  failure ADR 0004 warns about
- **only a collapsed selection** — a selection delete arrives as the same `inputType` with a
  range starting in the same place, and must remove what the user highlighted. This is the
  only reason `InputIntent` carries the pre-edit `selection` at all
- **only when an atom starts there** — so a collapsed range at the end of the document keeps
  meaning "delete nothing", which is what it does mean

No backward clamp. Every engine already reports a clean whole-atom range for Backspace, and
the fallback path treats an atom as one position, so it is right by two routes. A clamp
there would be code no test could justify.

## Why this does not contradict ADR 0004

ADR 0004's premise is that the browser has resolved *platform text conventions* — grapheme
clusters, word boundaries, what an autocorrect replacement replaces — better than the engine
could. Decision 1 keeps that intact, including where it is inconvenient.

An atom is not a platform text convention. It is the **engine's own construct**: ADR 0005
makes it one position wide and a position inside it unrepresentable. Firefox has no
convention about `contenteditable="false"` inline atoms — it has a range computation that
assumes the atom needs a companion character, and produces a range that deletes nothing when
it cannot find one. The collapsed rows are what settle this: "Delete does nothing on a
trailing chip" is not a behaviour any platform, user, or engine intends. It is a range that
does not describe what the browser meant to do — which is exactly the trigger ADR 0004
already wrote down:

> **Revisit when:** a browser is found reporting target ranges that disagree with what it
> actually intends to change.

So this is that revisit firing as designed, not an override of the rule.

## Alternatives considered

**Clamp every delete to the engine's idea of one unit**, both directions, atoms and
graphemes. Rejected — that is reimplementing platform delete semantics, and it would make
Firefox's backspace behave unlike Firefox for no user benefit.

**Clamp nothing; accept Firefox's ranges as convention.** Rejected on the collapsed rows
alone. A mention chip at the end of a document that the Delete key cannot remove is a broken
feature, not a convention, and no amount of respect for platform behaviour makes it one.

**Fix it in the view by giving atoms a companion character** — a zero-width space inside or
beside the chip, so Firefox's range always has something to absorb. Rejected: it puts a
character in the document that the model does not have, which breaks the one-position-wide
invariant at its most load-bearing point and would corrupt every offset in the package. This
is the class of fix v1 is made of.

**Normalise in `targetRange` instead**, mapping the DOM range before it becomes model
coordinates. Rejected — the decision needs the `inputType` and the pre-edit selection, and
neither belongs in a coordinate mapper. The exception should sit beside the rule it
qualifies, which is in `transaction-for.ts`.

## Consequences

Good:

- Delete removes a mention chip on every engine, including a trailing one, which it did not
  do in Firefox before.
- A forward delete beside a chip no longer destroys a character the user did not select.
  The emoji row is the sharpest case: it was taking a whole `👍`.
- All three `test.fixme`s are gone, in the two different ways the split implies: the atom
  one in `adr-0005-atoms.spec.ts` now **passes** on all four engines, and the two grapheme
  ones are **replaced** by tests that pin Firefox's convention per engine rather than
  parking it — so a change in Firefox becomes a failure rather than a silent absorption.
- `nodeAhead` now has one home for the trailing-edge rule that `positionAfter` and the
  clamp both need.

Costs and risks:

- **The engine now overrules a browser range in one place.** The precedent is the risk, not
  the code. The three conditions are narrow on purpose and each has a test asserting the
  clamp does *not* fire; the ADR is the argument that has to be made again before a second
  exception is added.
- `readSelection` runs on every `beforeinput` rather than only on the fallback path. One
  extra selection read per keystroke, against a full render per transaction.
- Firefox users get a different backspace to Chromium users inside a grapheme cluster. That
  is deliberate, and it is what they get everywhere else on Firefox.

## Unverified

- **Only Delete-key forward deletion is measured.** `deleteWordForward` beside an atom is
  excluded by rule rather than by measurement — no test drives ⌥Delete forward over a chip,
  because Playwright's key handling for it is not portable across platforms. If Firefox
  over-reaches there too, the user loses part of a word and the engine will not stop it.
- **Mobile keyboards are not covered.** Gboard's word-level replacement goes through
  `insertReplacementText`, not a forward delete, so this ADR says nothing about it. Still
  M6's open item.

## Revisit when

- Firefox changes either behaviour — the pinned per-engine test in
  `e2e/spec/adr-0014-delete-granularity.spec.ts` will fail rather than silently pass, **or**
- a second browser range is found needing an exception, at which point "clamp a range that
  does not describe the browser's intent" may deserve to be a general rule rather than one
  narrow case, **or**
- an engine reports an over-reaching range for `deleteWordForward` over an atom, which the
  Unverified section above says nothing currently checks.
