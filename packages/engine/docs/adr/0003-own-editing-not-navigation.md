# 0003 — The engine owns editing, not navigation

- **Status:** accepted
- **Date:** 2026-08-06

## Context

"Model-first" could mean owning everything the user does in the editor, or only the
things that change the document. The difference is large: caret movement covers arrow
keys with every modifier, Home/End, page up/down, mouse clicks, drag selection,
double-click word select, triple-click line select, caret browsing, and bidi-aware
visual order.

All of that is behaviour the browser already implements correctly, per platform
convention, in ways users have muscle memory for.

## Decision

The engine intercepts **`beforeinput` and nothing else.**

- **Editing** — insertion, deletion, replacement, paste, drop — is owned outright.
  `beforeinput` is always `preventDefault`ed, and the DOM changes only as a projection
  of the model.
- **Navigation and selection** are left entirely to the browser. No `keydown` handler
  for arrows, no `Selection.modify` calls, no custom hit testing. The engine reads the
  selection back via `view/dom-selection.ts` when an edit needs to know where it lands.

## Alternatives considered

**Own the selection model too**, mapping every navigation key onto model positions.
Rejected: it is a large surface with no user-visible benefit at this scope, and getting
bidi, grapheme-aware, and platform-specific movement wrong is worse than not doing it.
Editors that do own it (ProseMirror, Lexical) do so to support structures — block
boundaries, nested nodes, gap cursors — that this engine's non-goals exclude.

**Own neither, and reconcile after the fact** (mentis v1's approach: let the browser
edit, then re-derive the model from the DOM). Rejected — that is the design this whole
project exists to replace.

## Consequences

Good:

- A much smaller surface. The entire input layer is `transaction-for.ts`, which is pure
  and exhaustively unit-testable, plus two thin DOM adapters.
- Arrow keys, word-select, and bidi movement are correct for free, on every platform.
- The M0 replay harness stays faithful: it dispatches an untrusted `keydown`, the engine
  ignores it because it only listens to `beforeinput`, and `execCommand` then produces
  the real event — exactly the path a user takes.

Costs and risks:

- **The caret can sit somewhere the model considers impossible.** Today that's benign
  because every position is valid. M2's atoms change that: a caret inside a chip is a
  position the model must not accept, and since the engine isn't intercepting the arrow
  key that put it there, it has to *correct* the selection after the fact rather than
  prevent it. This is the main thing M2 inherits from this decision.
- Selection state is read on demand rather than authoritative, so it can be stale
  between a `selectionchange` and the next edit. Mitigated by preferring the browser's
  own `getTargetRanges()` for edits (ADR 0004), which sidesteps the stale-read entirely.
- Undo is not navigation, so M3 still has to own it — `preventDefault`ing
  `beforeinput` kills the native undo stack regardless of this decision.

## Revisit when

- M2 finds that correcting the selection after the fact produces visible caret jumping
  that intercepting arrow keys would avoid, **or**
- the non-goal "inline only, flat document" is relaxed, which is what makes navigation
  genuinely hard.
