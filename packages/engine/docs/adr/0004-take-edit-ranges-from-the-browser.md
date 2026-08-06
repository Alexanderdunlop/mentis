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
