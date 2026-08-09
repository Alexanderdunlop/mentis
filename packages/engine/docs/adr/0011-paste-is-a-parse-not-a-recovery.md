# 0011 — Paste is a parse, not a recovery

- **Status:** accepted
- **Date:** 2026-08-09

## Context

M4 left the package with machinery that turns DOM back into a model:
`view/read-dom-state.ts` walks an element, keeps the text, discards structure it does not
recognise, and rebuilds atoms from `data-mention-value`. Pasted HTML needs something that
sounds identical.

It is not identical, and the difference is the whole of this decision.

`readDomState` is **recovery code**. [ADR 0009](0009-yield-the-dom-during-composition.md)
hands the DOM to the browser for the length of a composition; afterwards the engine has to
work out what happened in a window it did not watch. It assumes the DOM started canonical,
because the engine rendered it. It keeps every character verbatim, because every character
is either the engine's own or something the user just typed. It reads the live selection,
because the caret is in there somewhere.

A paste has none of those properties. The markup is arbitrary and from an unknown
application. Nothing about it is canonical. Its whitespace is layout, not content. And
there is no caret in it — the caret is in *our* document, at the range the paste replaces.

But a paste has something recovery never does: **you know exactly what arrived, and you
can decide what it means.**

## Decision

**Paste parses.** `clipboard/html-to-slice.ts` runs `DOMParser` over the string and walks
the result under an explicit set of rules. `readDomState` is not reused and not extended.

The whole vocabulary is three roles, in `tag-role.ts`, because a flat inline-only document
has nowhere for a fourth to go:

| Role | Elements | Becomes |
|---|---|---|
| `skip` | `script`, `style`, `noscript`, `head`, `title`, media | nothing — text included |
| `break` | `p`, `div`, `li`, `h1`–`h6`, `tr`, `td`, `pre`, … | a `\n` at each edge |
| `transparent` | everything else, **including unknown elements** | its text, not itself |

Plus two special cases: `<br>` is always one `\n`, and an element carrying
`data-mention-value` is an atom and is never descended into.

`transparent` is the default deliberately. An unknown element is far more likely to be a
wrapper some editor invented — every `<span data-slate-*>`, `<o:p>` and `<font>` in the
world — than something whose absence changes the text, and dropping the text with it
would lose content the user watched themselves copy.

Whitespace is the part that actually bites, and it runs in a fixed order:

1. **Collapse** runs of space/tab/newline to one space, as HTML layout would, *unless* the
   context declared itself significant (`<pre>`, `<textarea>`, or an inline
   `white-space: pre | pre-wrap | break-spaces` — `pre-line` does not count, since it
   still collapses spaces).
2. **Normalise** what is never wanted: CRLF and lone CR to `\n`, U+2028/U+2029 to `\n`,
   zero-width space and BOM deleted.
3. **Tidy** the slice as a whole — join double spaces that only appeared once nodes were
   merged, drop spaces beside a newline, trim the fragment's outer indentation. Skipped
   entirely when anything declared its whitespace significant.
4. **nbsp → space**, last of all.

Block edges are **deferred**: a boundary is remembered and only written once something
follows it. A `<pre>` copied on its own therefore does not arrive wrapped in newlines
nobody selected, and nested blocks that open and close together produce one break rather
than one per level.

## Why nbsp goes last

U+00A0 is precisely the character HTML does **not** collapse — it is what an author writes
when they mean two spaces and want to keep both. Convert it to a plain space early and
every later rule, from the collapse in step 1 to the double-space join in step 3, sees an
ordinary space and eats one of the pair.

This is why `normaliseText` and `nbspToSpace` are two functions rather than one, and there
is a test asserting the wrong order loses a space — stated as an executable claim rather
than as a comment, because it is the entire reason for the split.

It also settles a question `CLAUDE.md` had left open: *"normalise nbsp → space on the way
into the model, or match with a character class that covers both. Decide which, once, at
the model boundary."* The clipboard **is** that boundary — it is where foreign text
enters — so it normalises, and nothing downstream has to ask whether a space is a space.

## Alternatives considered

**Reuse `readDomState`.** Rejected on the reasoning above. It would import recovery
semantics — verbatim whitespace, no block mapping, a live selection read — into a place
that has full knowledge and needs none of them. It would also couple two things that
change for unrelated reasons: the next IME bug would be free to alter paste behaviour.

**A pure string parser**, so the whole pipeline could live in the `logic` project.
Rejected: hand-rolling an HTML tokeniser to avoid a DOM is a large amount of code doing
worse what the platform does correctly, and entity decoding alone would justify the
parser. The rules that *can* be pure are — `tag-role`, `preserves-whitespace`,
`collapse-whitespace`, `normalise-text`, `nbsp-to-space`, `tidy-slice`, `serialise-slice`
and `text-to-slice` all unit-test with no DOM available at all — and only the tree walk
sits in `dom-smoke`.

**Sanitise by allow-list, dropping unknown elements' text.** Rejected: safe against
structure we did not anticipate, and lossy against text the user could see. Since every
element is reduced to text and atoms regardless, there is no structure left to be unsafe
about.

**Keep `<pre>` collapsing like everything else.** Rejected: pasted code is the single most
common whitespace-significant paste, and mangling its indentation would be the most
annoying thing this pipeline could do.

## Consequences

Good:

- Pasting from a real web page produces the text the user saw, not its source formatting.
- Pasted code keeps its indentation.
- The rules are readable in one small file and unit-testable without a DOM, so "what does
  a `<td>` become?" has an answer you can point at.
- Composition and paste can now change independently.

Costs and risks:

- **A mixed fragment loses tidying.** If any part of a selection declared its whitespace
  significant, the tidy pass is skipped for all of it, so a page containing a `<pre>`
  keeps some formatting whitespace elsewhere. Deliberate: the alternative is tracking
  preservation per character, and the failure mode is cosmetic.
- Table cells become lines. A tab would be closer to what a spreadsheet means, but a tab
  is not a line break and this document has no columns to put one in.
- Images, links and formatting are discarded down to text, which is what "inline only,
  flat" means and not a defect to fix later.

## Revisit when

- The document stops being flat — the moment there is anywhere for a block to go, the
  three roles are no longer enough, **or**
- pasting from a specific application proves consistently wrong in a way the roles cannot
  express, which would argue for per-source quirks rather than more general rules, **or**
- `tidySlice` being all-or-nothing produces a complaint anyone can actually reproduce.
