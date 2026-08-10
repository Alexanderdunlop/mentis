# 0012 — The engine listens for copy and cut

- **Status:** accepted, **cross-engine event ordering unverified**
- **Date:** 2026-08-09

## Context

[ADR 0003](0003-own-editing-not-navigation.md) says the engine intercepts **`beforeinput`
and nothing else**, and [ADR 0007](0007-the-engine-owns-the-undo-shortcut.md) already
amended that once for ⌘Z. So a second listener needs saying out loud rather than slipping
in.

Paste arrives as `beforeinput` with `insertFromPaste` and a `dataTransfer`, so it needs no
new listener at all. Copy and cut are not `beforeinput` — they are `copy` and `cut`
events, and there is no input event for "the user asked for a copy". `beforeinput` cannot
reach them because there is nothing to reach.

## Decision

**The engine listens for `copy` and `cut` on the editor element.**

This is a **boundary of ADR 0003 rather than an exception to it.** That ADR's line is
editing versus navigation: editing is owned, navigation is the browser's. Copy is neither
— it is editing-adjacent, reading the document rather than moving through it — and `cut`
is an edit outright. Neither is caret movement, which is the thing 0003 exists to leave
alone.

Both handlers do the same first thing: take the selection, reduce it to a range, and if it
is not collapsed, serialise `sliceBetween(doc, from, to)` onto `event.clipboardData`.

**The clipboard is written from the model, not from the DOM.** The slice carries each
mention's `value`; the rendered text does not. That is the entire reason a copied chip can
come back as a chip.

### Both must `preventDefault`

`setData` on a `copy`/`cut` event only takes effect if the event is subsequently
cancelled. An uncancelled event has the browser write its own serialisation of the
selection and discard whatever was set. So writing the clipboard and cancelling the event
are one act, not two — `writeClipboard` returns a boolean precisely so the caller cannot
do one without the other.

A collapsed selection is left entirely alone: no `setData`, no `preventDefault`, nothing
for the browser to disagree with.

### Cut, in the order that matters

1. Compute the range from the current selection.
2. Serialise **from the pre-cut document** and write the clipboard. After the deletion the
   slice no longer exists to serialise — this is the step that is easy to get backwards.
3. `preventDefault()`.
4. Dispatch **one** transaction deleting the range.

Cancelling the event cancels the deletion along with it, so no `deleteByCut` arrives at
`beforeinput` and the edit is unambiguously ours. One transaction means one undo step, and
because a delete step carries a slice, undoing a cut restores a cut mention as a mention
rather than as its label.

## Clipboard edits are dispatched as commands

Both `cut` and the paste path use `origin: "program"` rather than `"user"`.

`history/types.ts` has claimed since M3 that *"only `type` and `delete` ever coalesce;
everything else — paste, a mention insertion, a multi-step replacement — is its own undo
step."* That claim was not quite true. `editShapeOf` derives an edit's shape from its steps
alone, deliberately, so the model layer stays free of history concerns — and at the step
level a one-character paste is indistinguishable from typing a character. It would have
joined whatever typing run it landed in, and a cut would have merged with an adjacent
backspace.

`origin: "program"` is what `insertMention` already uses for the same reason, so in this
codebase it does not mean "not the user did it" — it means **issued as a command rather
than as a raw input event**. Clipboard edits are commands. This makes the documented
behaviour true without adding a `coalesce: false` flag to `Transaction`, which would put
history concerns back in the model layer that `editShapeOf` was written to keep them out
of.

## Alternatives considered

**Handle paste on a `paste` listener too**, for symmetry with copy and cut. Rejected:
`beforeinput` already delivers paste with its `dataTransfer`, and it delivers *drop* the
same way — `insertFromDrop` has no `paste` event at all, so the `beforeinput` path is
needed regardless. Adding a second route would mean two paths to the same edit and a
question about which wins. The cost is a real risk, recorded below.

**Do not cancel `cut`; let `deleteByCut` do the deletion.** Rejected: `setData` would be
discarded along with the cancellation it depends on, so the custom payload — the entire
point — would never reach the clipboard.

**`navigator.clipboard.readText()`.** Rejected on sight. Async, permission-gated, and the
mistake the archived v2 branch made in `v2/input/input-processor.ts`. The event's
`clipboardData` is synchronous and needs no permission, which is why `inputText` has read
it that way since M1.

## Consequences

Good:

- Copy, cut and paste all reduce to one slice-shaped operation, so a mention behaves the
  same through all three.
- Cut is one undo step, and undo brings the mention back as a mention.
- Paste and cut can no longer be swallowed by a neighbouring typing run.

Costs and risks:

- **Two listeners past `beforeinput` now**, after ⌘Z. That is a trend, and the next one
  should have to justify itself against this ADR as well as 0003.
- The engine no longer benefits from the browser's own copy behaviour — selection
  serialisation, image handling, `text/uri-list` — because it cancels every copy of a
  non-empty selection. For a flat text-and-atoms document there is nothing there to lose,
  and that stops being true the moment the document does.
- `origin` now carries a history meaning as well as a provenance one. It is documented in
  two places rather than modelled once.

## Verification, 2026-08-10

The browser matrix (`e2e/spec/adr-0010-clipboard.spec.ts`) settles the two largest doubts
below on Chromium, Firefox, WebKit and mobile Chrome.

**Firefox does populate `dataTransfer` on `beforeinput` for `insertFromPaste`.** This was
the single biggest risk recorded here — if it did not, paste in Firefox would insert
nothing at all, and the alternative "add a `paste` listener" would have become the
decision. The paste specs pass there, so reading paste off `beforeinput` stands, and
`insertFromDrop` keeps its one path.

**Cut ordering holds.** Cut writes the clipboard, cancels the event, and performs its own
deletion as one undo step on every engine — no `deleteByCut` arrives to double-delete, and
the feared ordering inversion does not occur. `setData` on a cancelled copy behaves the
same everywhere.

Note the traps entry these runs produced: Firefox's `getTargetRanges()` covers a *wider*
range than other engines for a delete beside an atom. That is unrelated to the clipboard
path but it is the same family of surprise, and it is why the fixmes exist.

## Still unverified

- **Event ordering across engines.** The design assumes `cut` fires before any
  `beforeinput` with `deleteByCut`, which is what the Clipboard API specifies and what
  Chromium does. If an engine fired `beforeinput` first, that deletion would apply and the
  subsequent `cut` would find a collapsed selection — writing nothing to the clipboard and,
  because a collapsed selection is left alone, deleting nothing twice. The document stays
  correct; the clipboard would be empty. That failure mode is the reason the collapsed
  case returns early rather than proceeding.
- **Whether `beforeinput` carries a populated `dataTransfer` for `insertFromPaste` on
  every engine.** Firefox is the historical doubt. If it does not, a paste there falls back
  to `event.data` — null — and inserts nothing. Visible immediately in the harness event
  log, which already reports `dataTransfer` contents for every `beforeinput`.
- happy-dom carries no `clipboardData` on a constructed `ClipboardEvent` and reports every
  selection as collapsed, so both are supplied by hand in the tests. They verify the
  engine's contract, not the browser's.

## Revisit when

- A real browser session shows `deleteByCut` arriving before `cut`, **or**
- Firefox is confirmed not to populate `dataTransfer` on `beforeinput`, which would make a
  `paste` listener necessary and turn the alternative above into the decision, **or**
- a third non-`beforeinput` listener is proposed, at which point "the engine intercepts
  `beforeinput` and nothing else" has stopped describing the code and ADR 0003 needs
  rewriting rather than amending.
