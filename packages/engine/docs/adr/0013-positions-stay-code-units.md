# 0013 — Positions stay code units; boundaries become grapheme-aware

- **Status:** accepted
- **Date:** 2026-08-10

## Context

The plan opens M6 with the problem: *"`"👨‍👩‍👧".length === 8`, so every offset in the
codebase is quietly wrong. `Intl.Segmenter` is the fix."*

"Quietly wrong" understates it, and it is worth being precise about *where*, because the
answer turned out to be "in two places, not everywhere". Two bugs were reproduced before
anything was designed:

1. **`diffDocs` splits a surrogate pair.** Its prefix and suffix scans compare code units,
   so replacing `👍` with `👎` — which share a leading `\uD83D` — yields a diff that
   inserts a bare `\uDC4E`. That renders as `�`, and the user can neither select it nor
   delete it: they did not type it and cannot type it away. Reachable from the M4
   composition path and from the emoji picker.
2. **The fallback delete eats half a character.** `deleteContentBackward` with no
   `getTargetRanges()` deleted exactly one position, leaving the other half of the pair.
   [ADR 0004](0004-take-edit-ranges-from-the-browser.md) already recorded this as
   knowingly wrong and deferred it here.

Everywhere else, offsets are *fine* — because they are code-unit offsets on both sides of
the model/DOM boundary, and the DOM speaks UTF-16 too.

## Decision

**A position stays a UTF-16 code-unit offset. The engine never *creates* a position that
is not a grapheme boundary.**

Two halves, and the second is what makes the first safe:

- `model/grapheme-boundary.ts` wraps `Intl.Segmenter` and answers four questions that
  differ only in whether `at` itself counts: `snapBack` (≤), `snapForward` (≥), `stepBack`
  (<), `stepForward` (>).
- `model/adjacent-position.ts` lifts that to the document, where **"one character" means
  two different things at once**: an atom is one position wide however long its label
  (ADR 0005), and a grapheme is however many code units it takes. `positionBefore` and
  `positionAfter` are the only places that need to know both.

Applied at exactly the three sites that invent a boundary:

| Site | Was | Now |
|---|---|---|
| `transaction-for.ts` fallback delete | `range.from ± 1` | `positionBefore` / `positionAfter` |
| `diff-docs.ts` narrowing | code-unit prefix/suffix | both ends snapped **outwards** to a boundary |
| `history/edit-shape.ts` coalescing | `text.length === 1` | `isSingleGrapheme(text)` |

Outwards is the only safe snap direction for the diff: widening the replacement to whole
characters is always correct, and narrowing is the bug itself.

## Why not make a grapheme one position wide

That is the tempting symmetry — ADR 0005 made an atom one position wide, so why not a
grapheme? Three reasons, and the third is decisive.

**It would add a third coordinate space.** `CLAUDE.md` already calls the existing two
"the main footgun here": position space (`docLength`) and visible text (`docText`). A
grapheme-indexed position space would sit between them, and every bug in this package's
future would start with "which of the three is this number?"

**Every position mapping would need a segmentation walk.** `domToModel` and `modelToDom`
are cheap index arithmetic *precisely because* a model offset and a DOM offset are the
same unit. Making them different units puts an `Intl.Segmenter` pass on the hot path of
every selection read, and `render`'s one-node-per-child invariant stops being enough to
map a position at all.

**The browser hands us code units and is already grapheme-correct.** `getTargetRanges()`
resolves clusters, word deletes and autocorrect replacements for us (ADR 0004) — in code
units. Converting them into a different space on the way in, and back on the way out,
would be work whose only product is a chance to get it wrong.

So the invariant is not "positions are grapheme indices". It is **"every position the
engine produces is a position the browser could have produced"**, which is a weaker
promise and the one that actually matters.

## Alternatives considered

**Snap defensively in `applyStep`**, so no step could ever cut a character regardless of
who built it. Rejected: it would make the two bugs above invisible rather than absent, and
`applyStep` is the wrong layer to be second-guessing its callers. Fixing the producers and
testing that they are the only ones is the honest version.

**Split on code points rather than graphemes** — `[...text]` instead of `Intl.Segmenter`.
Rejected as the primary mechanism: it keeps a surrogate pair together but still cuts a
combining accent off its letter and still splits a ZWJ sequence into three emoji. It
survives as the *fallback* where `Intl.Segmenter` is missing, because it at least never
produces a lone surrogate — degrading honestly beats degrading silently.

**Segment a window around the offset** rather than the whole string, for speed. Rejected
as premature: these functions run once per fallback delete and once per composition, never
per keystroke. A window would be right for every cluster anyone has heard of, and
"right for every cluster anyone has heard of" is how you ship a bug that reproduces in one
script only.

**Measure undo coalescing in graphemes as well as classifying by them.** Rejected: `size`
stays in position space, because that is what the group-size cap and every step offset are
counted in. An emoji costs two of the budget and is one character — both are true, and
conflating them would put a third meaning on `size`.

## Consequences

Good:

- The `�` class of bug is gone from the two places that could produce it, with tests that
  were confirmed red against the pre-fix code.
- Backspace over `👍`, `👨‍👩‍👧`, a flag, or `e` + combining acute deletes the whole
  thing, on the fallback path where the browser gave us nothing.
- A typed emoji joins the typing run around it, so `hi 👍` is one undo step rather than
  three.
- ADR 0004's recorded debt is closed, and `transactionFor` is still pure — it takes the
  `Doc` now, which is plain data.

Costs and risks:

- **`transactionFor`'s intent carries the whole document** rather than just its length.
  Unavoidable: "one character backwards" cannot be decided without the text. It is still a
  pure function of its argument.
- `Intl.Segmenter` is assumed present and only degraded from, not polyfilled.
- **This does not make the package grapheme-correct everywhere.** It makes it grapheme-safe
  at the boundaries the engine controls. `mentionQuery`'s `maxQueryLength` still counts
  code units, and `sliceBetween` will still cut a character in half if handed a position
  from somewhere new — the guard is that nothing produces one.

## Verification, 2026-08-10

The browser matrix answered the question this section used to ask.

**Confirmed on Chromium, Firefox, WebKit and mobile Chrome**
(`e2e/spec/adr-0013-graphemes.spec.ts`): a surrogate pair and a flag are indivisible on
every engine, one ArrowRight crosses a whole emoji, a typed emoji joins the typing run for
undo, and undo restores a deleted emoji intact. Above all, **no engine ever produces half
a code point and the model never falls out of step with the DOM** — which is what this ADR
actually guarantees.

**Complicated, not confirmed:** the assumption that the browser "hands us code units
already grapheme-resolved". Every engine resolves clusters; they disagree about how much
one delete covers. Firefox removes a combining mark on its own, and one member plus a
joiner from a ZWJ sequence, where Chromium and WebKit take the whole cluster. That is
granularity rather than corruption, recorded in docs/notes/contenteditable-traps.md and as
a postscript to [ADR 0004](0004-take-edit-ranges-from-the-browser.md). Whether the engine
should override it is an open decision, pinned as `test.fixme`.

## Still unverified

- Emoji rendering and caret painting around a ZWJ sequence — whether the caret can be put
  between the family members visually — is a platform behaviour no unit test reaches.
- Nothing here touches RTL/bidi, iOS dictation, or Android word-level replacement. They are
  the rest of M6.

## Revisit when

- A position arrives from a new source — a plugin, an adapter, a collaborative peer — at
  which point "nothing produces a bad position" stops being checkable by reading three call
  sites, and defensive snapping in `applyStep` becomes the cheaper guarantee, **or**
- profiling shows segmentation on a hot path, which would mean something started calling
  these per keystroke, **or**
- the engine needs to *report* positions to a consumer in user-facing terms, at which point
  a grapheme index becomes an output format rather than a storage format.
