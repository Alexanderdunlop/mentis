# 0010 — The clipboard carries HTML, and a mention's value rides on it

- **Status:** accepted, **clipboard round trip unverified in any real browser**
- **Date:** 2026-08-09

## Context

M5's done-when is that copying a selection containing a mention and pasting it back
reproduces the mention with its `value`, not its label as text. The value has to travel
somehow, and the clipboard is a set of named flavours rather than one payload.

[ADR 0005](0005-an-atom-is-one-position-wide.md) already booked this as a debt: *"M5's
clipboard work must serialise the value, not just the label, or a copy-paste round trip
degrades a mention to text. The value is already on the element as `data-mention-value`
for exactly this reason."*

Three candidate flavours:

1. **`text/plain`** — universal, and for a flat inline document it is *lossless for
   everything except an atom's identity*. There is no structure to lose.
2. **`text/html`** — read by every other application, and can carry
   `data-mention-value` as an attribute.
3. **A custom MIME type** — cleanest within our own editor, invisible everywhere else.

## Decision

**Write `text/html` and `text/plain`, both, every time. No custom type.**

- `text/html` is a `<span style="white-space:pre-wrap;">` wrapping one element per node.
  An atom becomes `<span class="mention" data-mention-value="…">label</span>` — the same
  two constants the renderer uses, imported from `view/atom-element.ts` so there is one
  definition of the wire format rather than two that drift.
- `text/plain` is `sliceText(slice)`: a mention appears as its label, which is the only
  honest thing to show an application that has never heard of a mention.
- On paste, **HTML is preferred**, and plain text is used when there is no HTML or when
  the HTML parsed to nothing.

The `pre-wrap` declaration is load-bearing twice over. It tells a receiving application
that runs of spaces are meant, and it is the marker our own paste path reads to know it
must not collapse them — which is what makes copy-then-paste of the same selection an
identity rather than an approximation. Chrome writes the same declaration when it copies,
so the convention is borrowed rather than invented.

A newline is written as `<br>` rather than as the literal `\n` the renderer uses. That
looks like it contradicts [ADR 0002](0002-render-newlines-as-text-not-br.md) and does
not: 0002 governs the engine's own DOM, where `pre-wrap` is guaranteed because
`createEditor` sets it. The clipboard is read by applications that guarantee nothing.

## A pasted mention keeps its identity

A chip whose `value` refers to something the consumer no longer knows about is a real
case, and there are exactly two honest answers: keep the value, or drop the chip to plain
text. There is no third that isn't a lie.

**The value is kept, verbatim, and the engine does not consult anyone about it.** The user
copied *that* mention; reproducing something else would be inventing. The engine is also
headless — it has no resolver, and [ADR 0006](0006-the-mention-query-is-derived-state.md)
and [0003](0003-own-editing-not-navigation.md) both keep consumer knowledge out of it, so
a `resolveMention` hook would be the engine reaching for state it deliberately does not
have. A consumer that cares can already find every value with `mentions(doc)` and decide
for itself.

## Alternatives considered

**A custom MIME type**, alone or alongside. Rejected. It is invisible to every other
application, so `text/html` would be needed anyway and there would be two serialisations
to keep in step. Support for arbitrary types through `DataTransfer.setData` also varies by
engine, and the sanctioned route for custom formats is the async Clipboard API — which is
exactly what this package refuses to use.

**`text/plain` only, with HTML parsed solely to recover atoms.** Genuinely tempting: plain
text really is a complete representation of a flat inline document, and preferring it
would sidestep the whole foreign-HTML surface. Rejected because deciding whether the HTML
contains an atom requires parsing it anyway, at which point using the result is simpler
than reconciling two sources — and the plan asks for an HTML → model pipeline on purpose,
because that is where the interesting problems are.

**Drop a pasted mention to plain text**, on the grounds that a stale value is worse than
no value. Rejected: it silently discards data the user watched themselves copy, and it is
precisely the degradation ADR 0005 flagged. Staleness is real but it is the consumer's
question, not the engine's.

**Re-resolve through a consumer callback.** Deferred rather than rejected — see *Revisit
when*. It would have to be synchronous, because paste is, and no consumer needs it yet.

## Consequences

Good:

- A mention survives a round trip with its identity, and two mentions sharing a label stay
  distinct — the thing v1 cannot do, now true across the clipboard as well as in memory.
- Pasting into Slack, a text field, or an email client gives sensible text for free.
- One wire format, defined once, shared by the renderer and the serialiser.

Costs and risks:

- **The value is visible in the clipboard's HTML.** Anything copied out of the editor
  exposes it, so a `value` must not be a secret. It is an identifier; treat it like one.
- Text pasted **out** of the editor and back **in** through a plain-text-only path — a
  terminal, say — arrives as labels. Correct, and worth knowing.
- The serialiser escapes `&`, `<`, `>` and `"` in both text and attributes, so a label or
  value full of markup round-trips. `escape-html.ts` moved out of `devtools/` into
  `src/text/` to make that reuse a shared utility rather than a backwards dependency.

## Verification, 2026-08-10

**The round trip has now been through a real system clipboard**, on Chromium, Firefox,
WebKit and mobile Chrome (`e2e/spec/adr-0010-clipboard.spec.ts`): a copied mention pastes
back as a mention with its `value`, two mentions sharing a label keep distinct values,
deliberate runs of spaces survive, cut removes and one undo restores the mention as a
mention, a cut selection pastes back, and a paste is a single undo step. Every copy and
paste there is a real keystroke against the real clipboard — no constructed
`ClipboardEvent`, which Firefox ignores anyway.

That discharges the headline doubt, and the `setData`-on-a-cancelled-copy question with
it: it behaves the same on all four engines.

## Still unverified

Not reachable from the matrix as it stands:

- whether an engine hands back the exact `text/html` it was given, or rewrites it — every
  browser adds a `<html><body><!--StartFragment-->` wrapper of some shape, and only the
  Chromium shape is covered by a test
- whether `setData("text/html", …)` on a cancelled `copy` behaves the same on WebKit and
  Gecko as it does on Chromium
- whether `beforeinput` carries a populated `dataTransfer` for `insertFromPaste`
  everywhere. Firefox has historically been the doubtful one, and the engine reads paste
  off `beforeinput` rather than off a `paste` listener (see
  [ADR 0012](0012-the-engine-listens-for-copy-and-cut.md))
- pasting from Word, Google Docs and Notion, which is where foreign HTML is genuinely
  hostile

happy-dom cannot settle any of it, and it also decodes only some entities in attribute
values, which is recorded in the traps note.

## Revisit when

- A consumer has a real "this mention no longer exists" case and needs to be asked — most
  likely with the M7 adapters, at which point a synchronous `onPasteMention` hook becomes
  worth its weight, **or**
- a browser is found rewriting our `text/html` badly enough that a custom MIME type earns
  its second serialisation, **or**
- the document stops being flat, at which point `text/plain` is no longer lossless and the
  balance between the two flavours changes.
