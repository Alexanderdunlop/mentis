# 0004 — Take edit ranges from `getTargetRanges()`, not from our own selection

- **Status:** accepted
- **Date:** 2026-08-06

## Context

When `beforeinput` fires, the engine needs to know what range the edit applies to.

The obvious source is the current selection. That is right for typing, and wrong for
almost everything else:

- **Backspace over a grapheme cluster.** `"👨‍👩‍👧"` is eight UTF-16 units and one
  user-perceived character. A collapsed caret plus "delete one unit" corrupts it.
- **Word delete** (`⌥⌫`). The selection is collapsed; the range to delete is a word
  boundary the platform defines.
- **Autocorrect and dictation.** `insertReplacementText` replaces a span of text that is
  not selected and that the user never selected.
- **Android word-level composition**, which routinely rewrites text behind the caret.

In every one of those cases the browser has already computed the correct range, using
platform rules the engine would otherwise have to reimplement.

## Decision

`InputEvent.getTargetRanges()` is the primary source of the edit range. Our own
selection read is a **fallback**, used only when the browser supplies nothing.

`InputIntent` carries a `rangeFromBrowser` flag so `transaction-for.ts` knows which it
got, and the two are treated differently:

- **Range from the browser** is used exactly as given. A collapsed range from the browser
  means *delete nothing* — that is information, not an omission. Widening it is how a
  word delete silently becomes a character delete.
- **Range from our fallback**, collapsed, on a backward delete, becomes "one unit
  backward". That is a guess, it is wrong for grapheme clusters, and it is marked as such
  in the code.

Compatibility is not the constraint: `getTargetRanges()` is Safari 10.1, Chrome 60,
Firefox 87, with no partial-support footnotes.

## Alternatives considered

**Always derive the range from the selection**, and implement grapheme and word
segmentation ourselves with `Intl.Segmenter`. Rejected for now — `Intl.Segmenter` gives
grapheme clusters but not the platform's word-delete or autocorrect semantics, so it
solves the smallest part of the problem. M6 may still need it for our own arithmetic.

**Trust `getTargetRanges()` exclusively** and treat its absence as "do nothing".
Rejected as too fragile: the array is legitimately empty for some insertion types, and
an editor that silently drops input is worse than one that guesses one character.

## Consequences

Good:

- Grapheme clusters, word deletes, autocorrect and Android composition are handled
  correctly at M1 without any segmentation code, because the browser did the work.
- M6's scope shrinks to *our own* offset arithmetic. The input path is already right.

Costs and risks:

- Two code paths for deletion, and the fallback is knowingly wrong. Both are covered by
  tests, and the fallback's wrongness is asserted rather than hidden.
- The engine now depends on browsers reporting target ranges accurately. If one lies, the
  bug will look like an engine bug. The M0 event log shows `getTargetRanges()` mapped to
  character offsets on every `beforeinput` specifically so this is checkable by eye.
- Range fidelity is **unverified against a real IME or Android keyboard.** No local test
  can cover it; that is M4 and M6 work.

## Revisit when

- A browser is found reporting target ranges that disagree with what it actually intends
  to change, **or**
- M6 needs grapheme-aware arithmetic for cursor movement or measurement anyway, at which
  point the fallback should use it rather than counting code units.

## Postscript — 2026-08-10, from the browser matrix

This ADR's premise is that the browser "has already resolved grapheme clusters, word
boundaries, and what an autocorrect replacement is actually replacing". The engine's
matrix confirms the first half and complicates the second: **every engine resolves them,
and they do not resolve them the same way.**

Measured on one document, one keypress:

| | `getTargetRanges()` for Delete over a chip | covers |
|---|---|---|
| Chromium, WebKit | `(DIV, 0) → (" hi", 0)` | the atom |
| Firefox | `(DIV, 0) → (" hi", 1)` | the atom **and** the following space |

Firefox likewise removes a combining mark on its own, and one member of a ZWJ sequence,
where the others take the whole cluster.

Nothing here is corrupted — no lone surrogate is ever produced and the model never falls
out of step with the DOM — so trusting the browser remains the right default, and ADR
0003's philosophy of leaving platform convention alone argues for keeping it. But
"the browser has worked out the right range" should now read **"the browser has worked
out *its* range"**, which is a weaker and more accurate claim.

**Open question, deliberately not answered here:** whether the engine should clamp a
browser-supplied range to its own idea of one unit. That would override platform
convention and contradict this ADR, so it needs a decision of its own rather than a
patch. Pinned as `test.fixme` in `e2e/spec/adr-0005-atoms.spec.ts` and
`e2e/spec/adr-0013-graphemes.spec.ts` until then.

### Answered — 2026-08-10, by [ADR 0014](0014-clamp-a-forward-delete-to-an-atom.md)

**And the postscript above gets one thing wrong, which is worth leaving visible.** It files
all three fixmes as one phenomenon, "granularity". Measuring properly found two, with
opposite answers — so they could never have been settled as one question:

- **Grapheme clusters stay the browser's.** Firefox peels a cluster backwards and takes it
  whole forwards; that is a coherent platform convention and this ADR's default holds.
- **A forward delete at an atom is now clamped to the atom**, overruling the browser. The
  table above understates the case: Firefox's rule is "the atom plus one grapheme of
  whatever follows", so it destroyed a letter or a whole emoji rather than just a space —
  and where nothing followed it reported a **collapsed** range, which this ADR reads as
  "delete nothing", so **a trailing chip could not be deleted at all**.

That last part is this ADR's own *revisit-when* firing exactly as written — "a browser is
found reporting target ranges that disagree with what it actually intends to change" — so
the exception is the rule working, not the rule breaking. An atom is the engine's own
construct (ADR 0005), not a platform text convention, which is the line ADR 0014 draws.
