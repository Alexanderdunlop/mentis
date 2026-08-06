# 0006 — The mention query is derived state, and the dropdown is the consumer's

- **Status:** accepted
- **Date:** 2026-08-06

## Context

M2.5 needs to answer "is the user typing a mention right now, and what have they typed?"
and then show a menu.

The archived v2 branch modelled this as **stored state plus events**: the core held a
query, and emitted `mentionQueryDetected` and `mentionQueryCleared` for the React layer
to subscribe to. Its `useMentionCore` hook then mirrored that into React state.

That is a cache with an invalidation problem in place of a function. Three failure modes
follow from it and all three are visible in that branch: the stored query can disagree
with the document; "cleared" must be emitted on every path that invalidates it, and
missing one leaves a menu open over stale text; and the ordering of `stateChanged` against
`mentionQueryDetected` becomes load-bearing.

## Decision

**The query is derived, never stored.**

`mentionQuery({ doc, selection })` is a pure function. Given a document and a selection
there is exactly one right answer, so there is nothing to keep in sync — no open/closed
flag, no detect/clear events, no ordering to get right. Consumers recompute it whenever
state changes, which is the same subscription they already need for rendering.

**The dropdown and its keyboard belong to the consumer, not the engine.**

ADR 0003 confines the engine to `beforeinput`. Arrow keys, Enter, Tab and Escape while a
menu is open are navigation and UI concerns, so they sit outside — in `dev/` for now,
which is a rehearsal for the M7 adapters rather than a shortcut. The engine's contribution
is the query, `insertMention`, and `positionRect` for placement.

Preventing the `keydown` for Enter is also what stops it reaching `beforeinput` and
inserting a newline, so the two decisions compose rather than conflict.

## Query rules

- Only for a **collapsed** selection. A range selection is a user selecting, not typing.
- Scanning stops at **whitespace** — via `/\s/`, which matches U+00A0. The salvaged v2
  code compared against `" "` and so failed to see a boundary before a trigger whenever a
  non-breaking space was there; see the traps note.
- Scanning **never leaves the caret's own text node**, which is sufficient because
  `normalise` merges adjacent text nodes. A text node is therefore maximal, and whatever
  is past its edge is an atom or the document start — either way a hard boundary, because
  a query cannot span a mention.
- A trigger only opens a query **at a word start**, or `name@example.com` pops a menu
  mid-address.
- A `maxQueryLength` guard stops an unclosed trigger keeping a menu alive across a
  paragraph.

## Alternatives considered

**Store the query and emit events**, as v2 did. Rejected above.

**Put the dropdown in the engine.** Rejected: it would make the engine own DOM UI and
keyboard navigation, contradicting both its headless design and ADR 0003, and it would
have to be rebuilt per framework at M7 anyway.

**Debounce or throttle recomputation.** Rejected as premature — the function is a single
backward scan bounded by `maxQueryLength` within one text node. If profiling ever says
otherwise, memoising on `(doc, selection)` identity is the fix, not caching.

## Consequences

Good:

- No stale menu is possible: the query cannot disagree with the document, because it *is*
  the document read a particular way.
- Testable with no DOM and no editor — 27 cases covering atom boundaries, word starts,
  nbsp and multiple triggers.
- The engine stays headless, so M7 adapters differ only in how they render a list.

Costs and risks:

- Recomputed on every selection change, including plain caret movement. Cheap now;
  measure before assuming it stays cheap once documents get long.
- Consumers must remember to recompute. Mitigated by it being the same `subscribe` call
  they already use, but a consumer who reads the query once will see it go stale — the
  exact failure the design removes internally.
- **Unverified in a real browser:** the `mousedown`-not-`click` choice on dropdown rows
  exists because `click` fires after `blur`, by which point the selection is gone. That
  reasoning is sound but untested on every engine.

## Revisit when

- Recomputation shows up in a profile, **or**
- a consumer needs a query that spans an atom, which would mean mentions can contain
  mentions and this rule no longer holds.
