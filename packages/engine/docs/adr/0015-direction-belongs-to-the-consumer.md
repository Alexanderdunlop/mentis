# 0015 — Direction belongs to the consumer; the engine stays logical

- **Status:** accepted
- **Date:** 2026-08-10

## Context

`docs/plan.md` lists "RTL / bidi selection" in M6's nasty-input gauntlet, on the reasonable
assumption that a contenteditable engine has to do something about it. Bidirectional text is
where visual order stops matching logical order: a Hebrew line runs right to left, an
`@Alice` chip inside it runs left to right, and the character that *looks* like it is next to
the caret may be several offsets away.

Editors do get this wrong, and expensively. The usual cause is code that reasons about
visual order — "the character to the left of the caret", "the box at x" — because those are
the terms the user seems to be working in.

So the question for this milestone was what the engine must do about direction. Measuring
first says: **almost nothing, and that is a result rather than luck.**

### What was measured

`e2e/spec/adr-0015-direction.spec.ts`, on Chromium, Firefox, WebKit and mobile Chrome, with
Hebrew and Arabic in a `dir="rtl"` container:

- the model is **byte-for-byte identical** in `ltr` and `rtl` for the same content — same
  text, same length, same nodes, same mention offsets
- editing RTL text (Backspace, typing) keeps the model and the DOM in step
- a mention keeps its `value` and its offset in an RTL line; Backspace takes the whole chip;
  typing beside it disturbs neither; undo restores it as a mention rather than as its label
- whatever a browser does with arrow keys in mixed text, the resulting selection is always a
  position the model can represent

None of that needed a change. It falls out of three decisions already made:

| Decision | Why bidi cannot reach it |
|---|---|
| [0003](0003-own-editing-not-navigation.md) — navigation stays the browser's | Bidi caret movement is where engines genuinely differ, and the engine never has an opinion to be wrong about |
| [0004](0004-take-edit-ranges-from-the-browser.md) — ranges from `getTargetRanges()` | The browser resolves what one keypress means in a reordered line |
| [0005](0005-an-atom-is-one-position-wide.md) — positions are logical offsets | A logical offset has no direction |

## Decision

**The engine has no direction policy. Direction is a property of the consumer's container,
and the engine reads it nowhere.**

Concretely, and each of these is a thing deliberately *not* done:

- no `dir` attribute is set on the root — the consumer's container already has one, and
  overriding it would fight the page
- no `dir` is set on mention chips. A chip's label is ordinary text and the bidi algorithm
  places it correctly; forcing `dir="ltr"` on an LTR-labelled chip would isolate it from the
  surrounding run and is the kind of "help" that makes mixed text worse
- no `unicode-bidi: isolate`, no bidi control characters in the document. Inserting a
  character the model does not have is the class of fix v1 is made of, and it would break
  every offset
- nothing anywhere reads visual order. The single exception is geometry, below

**The one place direction is unavoidable is `positionRect`**, which is the engine's only
geometry and what a consumer anchors a mention menu to. It gains a direction-aware fallback:

WebKit reports **no client rects at all** for a collapsed range at the end of a text node.
The previous fallback used the containing element's rect, whose `left` is the far left edge
— in an RTL line, the wrong end by the entire width of the editor. It now derives the caret
from the preceding character instead, choosing which edge of that character to sit on **by
measurement rather than by reading `getComputedStyle(...).direction`** — because the relevant
direction is the bidi *run's*, not the container's. An RTL word inside an `ltr` container
computes as `direction: ltr` while being laid out right to left, so the computed value picks
the wrong edge for exactly the mixed content this exists to serve.

## Alternatives considered

**Set `dir="auto"` on the root and on chips**, so the engine "handles" direction. Rejected:
it overrides a decision the page already made, and `auto` guesses from first-strong-character
— so a document that begins with an `@Alice` chip would resolve LTR and flip the whole line
for an Arabic user. Worse than doing nothing, and harder to explain.

**Track a `direction` field on the document model.** Rejected — it would be a second source
of truth for something CSS already resolves, it cannot express per-run direction, and every
consumer would have to keep it in sync with their own container.

**Reason about visual order for arrow keys**, so ArrowLeft always means "one character left".
Rejected on ADR 0003 grounds, and it is the trap named above: engines already disagree about
this, users expect their platform's behaviour, and the engine would have to reimplement the
bidi algorithm to have an opinion at all.

**Read `getComputedStyle(...).direction` in `positionRect`.** Rejected as measured-wrong for
mixed content, as described above. Measuring two rects is cheaper than being subtly wrong.

## Consequences

Good:

- RTL and bidi cost the engine nothing, and there is now a spec saying so on four engines —
  so a future change that starts reasoning about visual order fails a test rather than
  shipping.
- `positionRect` is correct at the end of a line in RTL on WebKit, where it was previously
  off by the width of the editor.
- The M6 bullet closes with evidence rather than an assertion.

Costs and risks:

- **This ADR's value is entirely in the negative claims**, and negative claims rot quietly.
  The spec asserts the model is *unaffected* by direction, which only stays true while
  nothing reads `dir` or visual order. That is the thing to protect.
- `positionRect` now costs two extra rect measurements, but only on the path where it
  previously returned a wrong answer.
- The derived fallback assumes the caret sits on one edge of the preceding character. For a
  position immediately at a bidi *boundary* the caret legitimately has two visual homes, and
  this picks one. Better than the container's edge; not provably the one the browser would
  paint.

## Unverified

- **No RTL mention *dropdown* has been placed by hand.** The spec checks `positionRect`
  returns a rect on the correct side; whether a real menu then looks right — which involves
  the consumer's own CSS, and the menu overflowing the viewport on the other side — is a
  consumer concern the harness only approximates.
- **No vertical writing mode.** `writing-mode: vertical-rl` is a different axis and nothing
  here has been checked against it. It is not in M6, and inline-only documents make it an
  odd fit, but `positionRect`'s left/right reasoning would need revisiting.
- **Bidi + IME together** is untested. Composition hands the DOM to the browser (ADR 0009)
  and `readDomState` reads it back in logical order, so there is no obvious interaction —
  but "no obvious interaction" is exactly what ADR 0009 said before it met a real IME.

## Revisit when

- Anything in `src/` starts reading `dir`, `getComputedStyle(...).direction`, or reasoning
  about visual order — at which point this ADR's central claim is no longer true and the
  spec should be failing, **or**
- a consumer reports a mention menu on the wrong side in RTL, which would mean
  `positionRect`'s rect is right and the *placement* contract around it is not, **or**
- vertical writing modes come into scope, which would make `positionRect`'s left/right
  reasoning an axis assumption rather than a direction one.
