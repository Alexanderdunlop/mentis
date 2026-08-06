# 0002 — Render newlines as `\n` in a text node, not `<br>`

- **Status:** accepted
- **Date:** 2026-08-06
- **Extends:** [0001 — line breaks are newline characters](0001-line-breaks-as-newline-characters.md)

## Context

ADR 0001 decided the *model* stores a line break as one `\n`. It left open what the
*DOM* should look like, and #80 then produced evidence that made the question urgent:
browsers disagree about what Enter produces and whether the result costs a character in
`textContent`. Firefox inserts a literal `"\n"` that counts; Chromium and WebKit end
the line with a block boundary that doesn't.

Any design that lets the browser create line-break DOM inherits that disagreement and
has to normalise three shapes back into one.

## Decision

The engine renders a line break as a literal `\n` **inside a text node**, relying on
`white-space: pre-wrap`. It never emits `<br>` for document content.

Because the engine `preventDefault`s every `beforeinput` (ADR 0003), the browser never
creates line-break DOM at all — so there is no cross-browser shape to normalise. There
is exactly one rendering, and it is ours.

`createEditor` sets `white-space: pre-wrap` on the element itself rather than trusting a
stylesheet. Without it a `\n` in a text node does not render as a break and this ADR's
premise fails *silently* — the model would be right and the screen wrong.

## The one exception

A document ending in `\n` gets a trailing `<br>` appended. Without it the browser gives
the caret nowhere to sit on the final empty line.

That `<br>` is a **rendering artifact with no model counterpart.** It must never be
counted by position mapping. `view/dom-text-nodes.ts` exists solely to filter it out,
and `domToModel` maps a boundary inside it to the end of the document.

## Alternatives considered

**Emit `<br>` per line break, as mentis v1 does.** Rejected: it reintroduces the
question of whether a `<br>` costs a position (the `Range.toString()` trap from ADR
0001), and it needs one DOM node per break instead of one text node per document.

**Normalise whatever the browser produces.** Rejected as the strictly harder version of
the same job — it means implementing and testing three engines' line-break shapes to
arrive at the single shape we could have rendered ourselves.

## Consequences

Good:

- One DOM shape on every engine, so a caret offset means the same thing everywhere. The
  cross-browser hazard recorded against ADR 0001 is closed rather than mitigated.
- The common case is a document that is exactly one text node, which makes the
  render diff trivial and node identity — and therefore the caret — stable.

Costs and risks:

- `white-space: pre-wrap` is now load-bearing behaviour, not styling. A future consumer
  overriding it breaks rendering with no error. Enforced in `createEditor`, and stated
  in `CLAUDE.md`.
- The trailing-`<br>` exception is a special case in both the renderer and the position
  mapper. Two places to get wrong; both are covered by tests.
- **Unverified in a real browser.** Whether one trailing `<br>` is sufficient for the
  caret to land on the last line, on every engine, is exactly the kind of claim the
  M0 inspector exists to check and no local test can.

## Revisit when

- M2's atoms make a document of one text node no longer the common case, **or**
- a real browser turns out to need something other than a single trailing `<br>` for the
  final empty line.
