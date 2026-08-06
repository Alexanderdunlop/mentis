# 0001 — Line breaks are newline characters

- **Status:** accepted, provisional — made at M0, revisit at M1
- **Date:** 2026-08-06

## Context

The engine constantly needs to answer "where is the caret, as a number?" — an offset
into the document. That means agreeing on how many characters a line break is worth.

The standard way to measure a DOM position is to build a `Range` from the start of the
editor to the boundary and take its string length:

```js
range.setStart(editor, 0);
range.setEnd(caretNode, caretOffset);
range.toString().length;
```

`Range.toString()` returns only the concatenated data of the `Text` nodes it spans.
Elements contribute nothing — **including `<br>`**. So for `one<br>two` it yields
`"onetwo"` (6), while the same content as a string is `"one\ntwo"` (7).

Put the caret before the `t` of "two": the Range measurement says offset 3, a
newline-bearing model says 4. Insertions land one character off, and only ever *after*
a line break — which is why this class of bug survives into production. Two line
breaks, off by two.

This is not hypothetical for mentis. `afdf240` (newline duplication), `a6fcfd0`
(Enter without `execCommand`) and the existence of `insertNewlineAtCaret` in v1 are all
in this territory.

## Decision

**A line break is one character, `\n`.**

- `textLength()` in `src/devtools/format.ts` walks the tree and adds 1 per `<br>`,
  rather than delegating to `Range.toString()`.
- Position mapping is therefore consistent with a model whose text is a plain string
  containing `\n`.
- The document model that arrives in M1 stores line breaks as `\n` in its text, not as
  structural nodes.

## Alternatives considered

**Line breaks as structural nodes with zero character cost** — the ProseMirror/Lexical
approach. Positions become richer than integers (node path + offset, or a token
index), which is what lets those editors distinguish a soft break from a paragraph
boundary and attach different behaviour to each.

Rejected for now because the plan caps the document at **flat and inline-only**. With
no block nodes there is no paragraph/line distinction to represent, so the added
position machinery buys nothing yet.

**Use `Range.toString()` and accept it** — rejected outright. It doesn't just simplify,
it produces wrong answers, silently, in exactly the content users type.

## Consequences

Good:

- Positions stay plain integers. Offset arithmetic, range calculation, and undo
  inversion are all ordinary string operations.
- The model text is directly comparable to `textContent`-with-`<br>`-as-`\n`, which
  makes "did the DOM and model diverge?" a cheap equality check — the core assertion of
  M1.

Costs and risks:

- No way to distinguish `insertParagraph` from `insertLineBreak` at the model level.
  Both collapse to `\n`. Browsers produce genuinely different DOM for Enter vs
  Shift+Enter (see the "shift+enter line break" scenario), and this decision discards
  that difference.
- Grapheme clusters are a separate, unsolved problem (M6). This ADR settles line
  breaks only; it says nothing about `"👨‍👩‍👧".length === 8`.
- If mentions ever need to serialise to a format that distinguishes break kinds, this
  needs revisiting first.

## Revisit when

- M1 finds it needs paragraph-vs-line-break as a modelled distinction, **or**
- the non-goal "inline only, flat document" is ever relaxed.

Either of those invalidates the reasoning above rather than merely inconveniencing it.
