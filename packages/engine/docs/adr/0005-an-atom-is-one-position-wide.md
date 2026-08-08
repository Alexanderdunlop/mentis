# 0005 — An atom occupies exactly one position

- **Status:** accepted
- **Date:** 2026-08-06

## Context

M2 adds the mention chip: an indivisible inline node with a `label` (what the reader
sees) and a `value` (its identity). How wide is it in position space?

Two candidates:

1. **`label.length`** — positions stay character offsets into the visible text, so
   `docLength(doc) === docText(doc).length` and model offsets line up with DOM character
   offsets.
2. **1** — the chip is one position however long its label is.

Option 1 is tempting because it keeps one coordinate space. But it makes positions
*inside* the chip expressible: `"@Alice"` would have five interior positions the model
must forbid, check for, and correct. ADR 0003 already flagged this as the main thing M2
inherits, since navigation is the browser's and the engine cannot prevent the caret
arriving there — only fix it afterwards.

## Decision

**An atom is one position wide.** `nodeLength` returns 1 for an atom regardless of label.

The consequence is that the engine has two distinct coordinate spaces, and they must
never be mixed:

| | meaning | function |
|---|---|---|
| **position space** | what selections, ranges and steps use | `docLength`, `nodeLength`, `sliceLength` |
| **visible text** | what the reader sees, what DOM `textContent` equals | `docText`, `sliceText`, `nodeText` |

They coincide only for documents with no atoms. `docText(doc).length` is **never** a
valid position once a mention exists, and every function above carries a comment saying
so.

Steps therefore carry a **slice** — a list of inline nodes — rather than a string.
Otherwise the inverse of "delete a mention" is "insert its label as text", which loses
the value silently and only on undo.

## What this retires

ADR 0003 recorded a debt: *"a caret inside a chip is a position the model must not
accept, and since the engine isn't intercepting the arrow key that put it there, it has
to correct the selection after the fact."*

**That debt is closed rather than paid.** With an atom one position wide there is no
interior position to represent, so no correction pass exists to get wrong.
`domToModel` maps an interior DOM boundary to whichever edge is nearer, and that is the
whole of it — an invalid state made unrepresentable instead of guarded against.

Arrow traversal and whole-chip deletion also come free, from
`contenteditable="false"` rather than from our code. That is the payoff of ADR 0003
leaving navigation alone.

## Alternatives considered

**Atom width = `label.length`.** Rejected as above: it keeps one coordinate space but
buys a class of invalid positions, plus the correction machinery to police them.

**Represent a mention as marked-up text** rather than a node — a range with an
attribute, the way a bold span works. Rejected: it makes "delete the whole mention"
a range computation on every edit, and it cannot express two adjacent mentions with the
same label, which is the exact bug this design exists to fix.

## Consequences

Good:

- Positions inside an atom are unrepresentable, so no validation or correction is
  needed anywhere.
- `mentions(doc)` reads values off nodes instead of parsing rendered text, so two chips
  sharing a label are trivially distinct — the thing mentis v1 cannot do.
- Deleting or undoing across a mention preserves its `value`, enforced by tests.

Costs and risks:

- **Two coordinate spaces is a permanent footgun.** Any future code doing
  `docText(doc).length` as a position is wrong and will only fail on documents
  containing mentions. Mitigated by naming (`*Length` vs `*Text`), comments at every
  definition, a test asserting the two genuinely diverge, and a `CLAUDE.md` rule.
- M5's clipboard work must serialise the value, not just the label, or a copy-paste
  round trip degrades a mention to text. The value is already on the element as
  `data-mention-value` for exactly this reason.
- ~~Unverified in a real browser.~~ **Confirmed 2026-08-08** via the harness: arrow keys
  step over a chip as a single caret stop and Backspace removes it whole, inherited from
  `contenteditable="false"` rather than implemented. Checked in one engine only — **Safari
  remains unchecked**, and it is the one most likely to diverge.

## Revisit when

- Safari, or any engine not yet checked, is found stepping *into* a
  `contenteditable="false"` atom rather than over it, which would reopen ADR 0003's
  correction question, **or**
- mentions need internal structure — an editable label, say — at which point the node
  stops being atomic and this ADR no longer applies.
