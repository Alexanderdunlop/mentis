# 0007 — The engine watches the undo shortcut

- **Status:** accepted
- **Date:** 2026-08-06
- **Amends:** [0003 — the engine owns editing, not navigation](0003-own-editing-not-navigation.md)

## Context

ADR 0003 states the engine "intercepts **`beforeinput` and nothing else**". M3 cannot hold
that line, and the reason is structural rather than a matter of taste.

Taking over `beforeinput` means calling `preventDefault()` on every one, so the browser
never performs an edit of its own. **Its undo stack therefore stays empty.** An empty
stack has nothing to undo, so pressing ⌘Z produces no `beforeinput` at all — not a
`historyUndo` we could handle, simply nothing.

Waiting for `historyUndo` would mean undo silently never working, in every browser, with
no error to explain it.

## Decision

The engine adds **one** `keydown` listener, matching only the undo and redo shortcuts:
⌘Z / Ctrl+Z, ⌘⇧Z / Ctrl+⇧Z, and Ctrl+Y. Matching is a pure function
(`input/history-shortcut.ts`) taking the four fields it needs, so it is testable without a
DOM.

`historyUndo` and `historyRedo` are **also** honoured when they do arrive — from the Edit
menu, a macOS trackpad gesture, or an Android keyboard — so both routes reach the same
command rather than one being a fallback for the other.

ADR 0003 is otherwise unchanged: no `keydown` handling for arrows, Home/End, or anything
else. Navigation remains the browser's.

## Why this does not erode ADR 0003

The line ADR 0003 draws is **editing versus navigation**, and "beforeinput only" was the
mechanism, not the principle. Undo is editing — it changes the document — so it falls on
the engine's side of that line. What would erode the ADR is handling arrow keys or
mouse selection, and this does not.

The mention dropdown's keys are the useful contrast: Arrow/Enter/Escape/Tab while a menu
is open live in the *consumer* (ADR 0006), because a menu is UI. Undo is not UI.

## Alternatives considered

**Wait for `historyUndo` only.** Rejected: it never fires, for the reason above. This is
the option that looks correct and quietly does nothing.

**Leave undo to the consumer**, as with the dropdown keys. Rejected: every consumer would
reimplement the same platform shortcut matching, and an editor that loses ⌘Z by default is
broken rather than unopinionated.

**Keep a shadow native stack** by letting some `beforeinput` events through unprevented, so
the browser has something to undo. Rejected as unworkable — the DOM would then change
outside the model, which is the one thing this project exists to prevent.

## Consequences

Good:

- Undo works on both platforms, from the keyboard and from the Edit menu.
- Coalescing is ours to define, so a typing run is one step and a pause, a newline, or a
  switch to deleting starts another — behaviour the native stack never gave us control
  over.
- Steps were already invertible from M1, so this milestone added a stack and a merge rule
  rather than an inversion engine.

Costs and risks:

- The engine now has a `keydown` listener, and the temptation to put "just one more" key
  in it will recur. The listener matches through `historyShortcut` and nothing else; new
  keys need a new ADR.
- A consumer with its own ⌘Z handler will double-handle unless it stops propagation. Worth
  documenting at M7, when adapters exist.
- **Partly verified, 2026-08-08.** Undo and redo work from the keyboard in a real browser,
  so the decision holds in practice. The *narrower* premise — that ⌘Z fires no
  `beforeinput` at all once every event is prevented — was not separately reported, and it
  cannot be inferred from undo working: the engine handles both routes, so a `historyUndo`
  arriving would produce the same visible result. If it does fire, the keydown listener is
  redundant rather than wrong. Still worth one look at the event log.

## Revisit when

- A browser is found firing `historyUndo` reliably despite an empty native stack, which
  would make the keydown listener redundant, **or**
- consumers need to override the shortcut, at which point matching should become an
  option rather than a constant.
