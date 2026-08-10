# 0009 — The engine yields the DOM during composition

- **Status:** accepted, **verified against a real composition on Chromium** (2026-08-10)
- **Date:** 2026-08-06

## Context

Every ADR so far rests on one invariant: **the DOM is a projection of the model, never a
source.** The engine `preventDefault`s every `beforeinput` so nothing writes to the DOM
except `render`.

An IME cannot work that way. Composing `にほんご` from `nihongo` means the browser must
display pre-edit text, underline it, show a candidate window, and rewrite the region as
the user cycles candidates — all before any committed text exists. That rendering *is* the
browser writing to the DOM. Prevent `insertCompositionText` and composition does not
degrade, it fails outright: no pre-edit text appears and there is nothing to commit.

The same applies, more aggressively, to Android keyboards, which compose whole words as a
matter of course.

## Decision

**For the duration of a composition, the engine stops controlling the DOM.**

- `compositionstart` sets a `composing` flag.
- While composing, `beforeinput` is **not** prevented. The browser edits the DOM freely.
- Selection tracking is suspended, because position mapping assumes the render invariant
  and that invariant does not hold.
- `compositionend` reads the DOM back (`view/read-dom-state.ts`), diffs it against the model
  (`model/diff-docs.ts`), and applies **one** transaction — so a whole composition is a
  single undo step.
- `render` then restores canonical DOM, discarding any structure the browser invented.

`insertCompositionText` was removed from the insertion set in `transaction-for.ts`.
Handling it there *as well* would apply the composed text twice; a stray one outside
composition is now reported as unhandled, which is the engine's standing rule for input it
has no rule for.

## On reading the DOM as a source

`readDomState` is the one place the DOM is authoritative, and it is worth being blunt that
this is the thing mentis v1 does wrong on every keystroke.

The difference is scope. v1 has no model, so a DOM quirk is a permanent correctness bug
with nothing to reconcile against. Here the window is one composition, the browser is the
only writer during it, the result is diffed against a model that was correct going in, and
canonical DOM is restored immediately after. Atoms survive because their value lives on the
element — which is the reason `data-mention-value` exists rather than a lookup table.

## Alternatives considered

**Keep preventing everything.** Rejected: IMEs stop working, so a third of the world cannot
type. Not a trade-off.

**Model the composition** — track pre-edit text in the document and render it ourselves.
This is what a full editor eventually does, and it is where the plan's warning about
spending years applies. Rejected for now: it needs per-engine knowledge of composition
event ordering, and would still have to yield on Android where the keyboard rewrites text
outside any composition we know about.

**Replace the whole document on `compositionend`** rather than diffing. Correct but coarse:
one typed character would undo as "replace everything", and its inverse would carry the
entire previous document. `diffDocs` narrows to the changed characters, which the tests pin.

**The plan's escape hatch** — a `composition: "passthrough"` mode that gives up on
reconciliation. Not needed: passthrough *is* the mechanism, and reconciliation is the part
that makes it survivable. Recorded here in case the reconciliation proves worse than
nothing.

## Consequences

Good:

- IMEs can work at all, which no amount of internal purity is worth sacrificing.
- One undo step per composition, for free, because the reconciliation is a single
  transaction and multi-character edits never coalesce.
- `diffDocs` and `readDomState` are both independently testable, and `diffDocs` is pure.

Costs and risks:

- **A window exists where the model is knowingly stale.** Anything reading `getState()`
  mid-composition sees old text. `isComposing()` exists so consumers can tell; M7's adapters
  will need to respect it.
- Reconciliation is best-effort on caret position. `readDomState` locates the caret while
  walking, but for an element boundary with a non-zero child offset it approximates.
- Structure the browser leaves behind is discarded rather than understood. If a browser
  ever encodes something meaningful in it, that meaning is lost.

## Verification, 2026-08-10

**A real composition has now driven this**, through CDP
(`e2e/spec/adr-0009-composition.spec.ts`). `Input.imeSetComposition` makes Chromium render
its own pre-edit text and fire genuine `compositionstart` / `compositionupdate`, which is
the window this ADR hands the DOM over for. Nothing is faked at the DOM level, and the
contract held on first contact:

- pre-edit text is rendered **by the browser** and visible in the DOM while the model has
  deliberately not moved — the proof that `beforeinput` really is being let through, and
  the failure mode where composition simply does not work
- `compositionend` reconciles, and the model and DOM agree afterwards
- **a whole composition is one undo step**, across several candidate changes
- the DOM comes back canonical: one text node, no wrapper the browser invented
- a mention beside the composition survives with its `value`, which is `readDomState`
  rebuilding atoms from `data-mention-value` and the reason that attribute exists
- committing an emoji does not split it — the path the M6 `diffDocs` surrogate bug was
  actually reachable from
- **no stray `insertCompositionText` is reported unhandled**, so the prediction below
  about a trailing `beforeinput` does not hold on Chromium

That retires the headline doubt this ADR has carried since M4.

## Still unverified

**One engine is not every engine.** Playwright can drive composition through CDP in
Chromium only, so this is Chromium's idea of the event sequence. Specifically still
untested:

- Japanese and Chinese input on **WebKit and Firefox**, which have no CDP equivalent
- **Gboard on Android**, which composes far more aggressively and is the case this ADR
  called out as the aggressive one
- iOS dictation and autocorrect
- whether a trailing `beforeinput` arrives after `compositionend` on *those* engines — it
  does not on Chromium, but that is where the doubt was cheapest to remove, not where it
  was largest

A human at a keyboard with a Japanese input source is still the only way to close those,
and the harness on port 5280 is where to do it.

## Original unverified note, kept for the record

**None of this has met a real IME.** The tests play the browser's part by hand: fire
`compositionstart`, write to the DOM as an IME might, fire `compositionend`, assert the
model caught up. That verifies the reconciliation *contract*. It does not verify that real
IMEs emit these events in this order, or write this shape of DOM, or that
`compositionend` is genuinely last.

Specifically untested:

- Japanese and Chinese input on macOS and Windows
- Gboard on Android, which composes far more aggressively
- iOS dictation and autocorrect
- whether a trailing `beforeinput` arrives *after* `compositionend` on any engine, which
  would land as an unhandled `insertCompositionText` rather than being applied twice — the
  safer failure, and visible in the event log

This ADR should be revisited after the first real IME session, not before.

## Revisit when

- A real IME session shows event ordering that breaks the flag-based state machine, **or**
- Android composition proves to need handling outside `compositionstart`/`end` at all, **or**
- the caret lands wrong often enough that reconciliation needs a real position mapping
  rather than a best-effort walk.
