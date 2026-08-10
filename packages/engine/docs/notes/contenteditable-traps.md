# contenteditable traps

Platform behaviour that has already bitten, or is guaranteed to. Not decisions —
decisions go in [`docs/adr/`](../adr/). These are facts about browsers that stay true
regardless of how the engine is built.

**Append an entry every time you lose an hour to something.** Two reasons: after a gap
away from this project, this file is what reloads the context that code comments
can't; and it is the raw material for the write-ups the plan commits to, which is far
cheaper to accumulate than to reconstruct.

Format: symptom → mechanism → what to do → where it shows up here.

---

## A non-breaking space is not a space

**Symptom.** Trigger detection fails on text that looks completely normal. A mention
won't start after what is visibly a space. Text sent to a server contains invisible
junk.

**Mechanism.** Two characters render identically: a normal space `U+0020` and a
non-breaking space `U+00A0` (what `&nbsp;` produces). They are not equal in code —
`char === " "` is **false** for a non-breaking space.

They arrive constantly:

- pasting from Google Docs, Word, or most web pages
- browsers inserting them to stop runs of spaces collapsing (most aggressively when
  `white-space` is left at its default — `pre-wrap` reduces but does not eliminate it)
- any code that does its own `&nbsp;` substitution. mentis's old v2 branch did exactly
  this on every keystroke: `text.replace(/ /g, "&nbsp;")` in
  `v2/platform/content-editable.ts`

Note `/\s/` **does** match `U+00A0`, so regex-based checks often work by accident while
equality checks silently fail. That inconsistency is why the bug is hard to pin.

**What to do.** Never compare against `" "` literally. Either normalise nbsp → space on
the way into the model, or match with a character class that covers both. Decide which,
once, at the model boundary — not per call site.

**Where it shows up here.** The inspector renders space as `·` and nbsp as `⍽`
specifically so the odd one out is visible at a glance; identical glyphs would hide it.
`WHITESPACE_MAP` in `src/devtools/format.ts`, and the "nbsp run" content preset.

---

## `Range.toString()` silently ignores `<br>`

**Symptom.** Caret arithmetic is off by one, but only after a line break. Off by two
after two line breaks. Single-line content is perfect, so it ships.

**Mechanism.** `Range.toString()` returns the concatenated data of the `Text` nodes in
the range. Elements contribute nothing at all, `<br>` included. So `one<br>two`
measures as `"onetwo"` (6) while the same content as a string is `"one\ntwo"` (7).

**What to do.** Walk the tree and count `<br>` explicitly. Don't reach for the
`Range.toString().length` trick, however idiomatic it looks in every blog post about
caret position.

**Where it shows up here.** `textLength()` in `src/devtools/format.ts` counts `<br>` as
one newline. The reasoning and its consequences are
[ADR 0001](../adr/0001-line-breaks-as-newline-characters.md).

---

## Browsers disagree about whether a line break costs a character

**Symptom.** A caret assertion that spans a newline passes on one engine and fails on
another, and reads as a library bug in whichever one you didn't develop against.

**Mechanism.** Pressing Enter produces different DOM per engine, and the results are
not equivalent under `textContent`:

- **Firefox** inserts a literal `"\n"`, which *does* count in `textContent`.
- **Chromium and WebKit** end the line with a block boundary, which does *not*.

So the same visible content yields different `textContent.length`, and every offset
after the break shifts by one depending on the browser.

**What to do.** Don't hard-code a character offset past a newline. Normalise line
breaks at the DOM boundary rather than trusting `textContent` — the engine's model
counts one `\n` per break
([ADR 0001](../adr/0001-line-breaks-as-newline-characters.md)), so the DOM→model step
owes an explicit conversion, not a pass-through.

**Where it shows up here.** Discovered by the Playwright suite in `e2e/`, which is why
it has `expectCaretAtEnd()` instead of an offset assertion once content contains a
newline. See `e2e/CLAUDE.md`. This is the first piece of real cross-browser evidence
bearing on ADR 0001 and it arrived from the test layer, not from reading specs.

---

## Firefox drops `clipboardData` from a constructed `ClipboardEvent`

**Symptom.** A paste test that works in Chromium does nothing at all in Firefox — no
error, no insertion.

**Mechanism.** Firefox refuses to carry a `DataTransfer` on a `ClipboardEvent` built in
script, so the handler receives an event with nothing attached.

**What to do.** Drive paste through a real copy where the matrix matters, rather than
synthesising the event. Note this is a limit of the *test path*, not a library defect —
don't file it as one.

**Where it shows up here.** `e2e/fixtures/harness.ts` exposes `pasteByCopying()` for
exactly this reason.

---

## Browsers disagree about how much one delete covers

**Symptom.** One Backspace removes a whole emoji in Chrome and Safari, and part of one
in Firefox. One Delete removes a mention chip in Chrome and Safari, and the chip *plus
the space after it* in Firefox. Nothing is corrupted, so it reads as a library bug in
whichever engine you didn't develop against.

**Mechanism.** `InputEvent.getTargetRanges()` is the browser telling you what it was
about to delete, and [ADR 0004](../adr/0004-take-edit-ranges-from-the-browser.md) takes
it at its word precisely because the browser has already resolved clusters and word
boundaries. It has — but **each engine resolves them differently**, and the answer is
platform convention rather than a specification.

Measured on the same document (`[@Alice][" hi"]`, caret at 0, Delete):

| | reported range | covers |
|---|---|---|
| Chromium, WebKit | `(DIV, 0) → (" hi", 0)` | the atom |
| Firefox | `(DIV, 0) → (" hi", 1)` | the atom **and** the following space |

And for Backspace over one character, Firefox removes a combining mark on its own, and
one member plus a joiner from a ZWJ sequence, where the others take the whole cluster.
Firefox's position on separately-deletable combining marks is long-standing and not
obviously wrong.

**The trap inside the trap: "nothing is corrupted" is not the same as "nothing is
broken", and filing all of this as one phenomenon hides the difference.** Probing the
whole family rather than the one document above found Firefox's actual rule for a forward
delete at an atom — *the atom plus one grapheme of whatever text follows* — and the case
that rule produces when nothing follows:

| document, caret before the chip | Firefox's range | result |
|---|---|---|
| `[chip]"hi"` | atom + `"h"` | `"i"` — a letter destroyed |
| `[chip]"👍x"` | atom + `"👍"` | `"x"` — a whole emoji destroyed |
| `[chip]` at the end of the document | **collapsed** | **nothing deleted, ever** |

ADR 0004 reads a collapsed browser range as "delete nothing — that is information, not an
omission". So a trailing mention chip could not be removed with the Delete key at all, and
that had been sitting under a `test.fixme` labelled "granularity" because the first probe
happened to use a document with a space after the chip.

**What to do.** Two different things, and telling them apart is the point:

- **Grapheme extent: don't assert it across the matrix, and don't override it.** Assert
  what every engine agrees on — nothing is half a code point, model and DOM stay in step.
  Firefox's difference is *directional* (peels backwards, whole forwards), which is a
  convention, and ADR 0003 says leave those alone. Pin it per engine so a change fails.
- **A range that does not describe what the browser meant to do is not a convention.** A
  collapsed range for a delete the browser plainly intended is the trigger ADR 0004's
  own *revisit-when* already wrote down. That is a bug, and it earns an exception.
- **When a browser diverges, probe the whole family before naming the phenomenon.** One
  document gave "the atom and the following space" and cost a day of treating a defect as
  a preference.

**Where it shows up here.** [ADR 0014](../adr/0014-clamp-a-forward-delete-to-an-atom.md)
and `e2e/spec/adr-0014-delete-granularity.spec.ts`, which holds both halves so the split
stays visible. All three `test.fixme`s are gone: two discharged by the clamp, one converted
to a per-engine expectation. Found by the engine's browser matrix on the day it was built,
which is what it was built for.

---

## `.length` is not how many characters there are

**Symptom.** Backspace over an emoji leaves a `�` behind. The user cannot select it,
cannot delete it, and never typed it. Or: an IME commits an emoji and the document ends
up with a stray replacement character in the middle of it.

**Mechanism.** A JavaScript string is UTF-16 code units, and almost nothing a reader
would call "a character" is one of them:

| | `.length` | why |
|---|---|---|
| `"a"` | 1 | |
| `"👍"` | 2 | one surrogate pair |
| `"🇳🇿"` | 4 | two regional indicators |
| `"👍🏽"` | 4 | emoji plus a skin-tone modifier |
| `"é"` typed as `e` + accent | 2 | a combining mark |
| `"👨‍👩‍👧"` | 8 | three emoji joined by two ZWJs |

So any code doing `at - 1`, or comparing strings a unit at a time, will eventually cut
between a high surrogate and its low one. Half a pair is not a character; it is a
permanent `�`.

The nastiest version is a *diff*. Comparing `"👍"` with `"👎"` code unit by code unit
finds a common prefix of one — they share `\uD83D` — and produces a change that inserts a
lone `\uDC4E`. Every individual function looks right.

**What to do.** `Intl.Segmenter` with `granularity: "grapheme"` is the only correct
answer; splitting on code points (`[...text]`) keeps surrogate pairs together but still
cuts a combining accent off its letter. Don't segment everywhere — decide where your code
*invents* an offset rather than receiving one, and fix only those. The browser's
`getTargetRanges()` is already grapheme-correct, which is most of why this stays small.

**Where it shows up here.** `src/model/grapheme-boundary.ts` and
`src/model/adjacent-position.ts`, applied at three sites: the fallback delete in
`input/transaction-for.ts`, the narrowing in `model/diff-docs.ts`, and coalescing in
`history/edit-shape.ts`. Reasoning in
[ADR 0013](../adr/0013-positions-stay-code-units.md).

---

## `setData` on a copy is discarded unless you cancel the event

**Symptom.** You set `text/html` on a `copy` event, everything looks right in the
handler, and the clipboard still holds the browser's own serialisation. Pasting back
gives a mention as plain text and no error anywhere.

**Mechanism.** `event.clipboardData.setData()` during `copy`/`cut` writes to a *pending*
data store. The browser only promotes it to the system clipboard if the event ends up
cancelled. An uncancelled `copy` runs its default action — serialise the selection —
and throws the pending store away.

The same coupling runs the other way for `cut`: cancelling to keep your payload also
cancels the deletion, so no `beforeinput` with `deleteByCut` arrives and the edit is
yours to make. Setting data and cancelling are one act; so are cancelling and deleting.

**What to do.** Write and cancel together, or not at all. Make the function that writes
return whether it wrote, so the caller cannot cancel an event it put nothing on — and
leave a collapsed selection completely alone, since there is nothing to write and
nothing worth disagreeing with the browser about.

**Where it shows up here.** `writeClipboard` returns a boolean for exactly this reason,
and `onCopy`/`onCut` in `editor/create-editor.ts` treat it as the condition for
`preventDefault()`. Reasoning in
[ADR 0012](../adr/0012-the-engine-listens-for-copy-and-cut.md).

---

## A non-breaking space must be converted last, not first

**Symptom.** Text pasted from a page with `a&nbsp;&nbsp;b` arrives as `a b`. One space,
where the author deliberately wrote two. Every individual function in the pipeline looks
correct.

**Mechanism.** nbsp is the one space HTML does **not** collapse — that is what it is
*for*. Normalise it to U+0020 on the way in and it becomes indistinguishable from
collapsible whitespace, so the next rule that collapses a run eats one of the pair. The
bug is entirely in the ordering; no single function is wrong.

**What to do.** Do every whitespace-collapsing step first, while nbsp is still visibly
different, and convert it in the last step before the text reaches the model. Keeping the
conversion in its own function makes the ordering a call-site decision instead of a
comment someone has to find.

**Where it shows up here.** `clipboard/nbsp-to-space.ts` is separate from
`clipboard/normalise-text.ts` for this reason alone, and there is a test asserting that
the wrong order loses a space. See
[ADR 0011](../adr/0011-paste-is-a-parse-not-a-recovery.md).

---

## happy-dom reports every selection as collapsed, and half-decodes attributes

**Symptom.** A `dom-smoke` test for copy writes an empty clipboard. Separately, a value
round-tripped through an attribute comes back containing `&lt;`.

**Mechanism.** Two unrelated gaps in the test environment, not in any browser:

- `Selection` stores the range correctly — `getRangeAt(0)` has the right offsets and
  `isCollapsed` is right — but `anchorOffset` and `focusOffset` always read 0. Anything
  reading anchor/focus, which is how you keep a selection's *direction*, sees a caret.
- The HTML parser decodes `&amp;` and `&quot;` in attribute values but leaves `&lt;` and
  `&gt;` encoded. Real browsers decode all four.

**What to do.** Neither is a reason to reshape engine code. Play the browser's part by
hand — a small `Selection` stub reporting anchor and focus off the range — exactly as the
composition tests already do for an IME, and keep assertions off the entities happy-dom
gets wrong. Real caret behaviour still belongs in Playwright.

**Where it shows up here.** `installSelection()` in
`src/editor/tests/clipboard.dom.test.ts`, and the deliberately `<`-free value in
`src/clipboard/tests/round-trip.dom.test.ts`.

---

## Script-created events cannot cause editing

**Symptom.** You dispatch a `KeyboardEvent` to simulate typing. Your listeners fire.
No text appears, and no `beforeinput` is emitted.

**Mechanism.** Events constructed in script are `isTrusted: false`, and browsers refuse
to run the **default action** for them. Listeners still run — that part works — but the
browser does nothing on its own behalf. There is no flag to opt out; it's a security
boundary.

**What to do.** Three options, and they are not interchangeable:

1. **Mutate the DOM directly.** No `beforeinput` fires. Fine for setting up state,
   useless for exercising an input pipeline.
2. **`document.execCommand("insertText", …)`.** Deprecated, but the only in-page route
   to a *genuine* `beforeinput`/`input` pair that respects the selection and lands on
   the native undo stack.
3. **Playwright / CDP.** Real trusted input. The only option for IME composition and
   mobile autocorrect, which have no `execCommand` equivalent at all.

**Where it shows up here.** `src/devtools/replay.ts` dispatches an untrusted `keydown`,
checks whether `dispatchEvent` returned `false` (i.e. a listener called
`preventDefault`), and only then falls through to `execCommand`. That reproduces the
browser's real contract — default action happens *unless* keydown was prevented — even
though the events themselves aren't trusted. It cannot fake composition; test that by
hand, or in Playwright later.

---

## A collapsed range at the end of a text node has no rects in WebKit

**Symptom.** A dropdown anchored to the caret jumps to the far side of the editor, but
only in Safari, and only when the caret is at the very end of the text. In an RTL line
it is wrong by the entire width of the editor, which looks less like a rounding bug and
more like the anchor was never set.

**Mechanism.** `Range.getClientRects()` returns an **empty list** for a collapsed range
positioned at the end of a text node in WebKit. Chromium and Firefox return one rect.
Measured on `"שלום עולם"` in a `dir="rtl"` container:

| position | Chromium | Firefox | WebKit |
|---|---|---|---|
| the last character | 1 rect | 1 rect | 1 rect |
| **after** the last character | 1 rect | 1 rect | **0 rects** |

Any "fall back to the containing element's rect" branch then fires — and an element rect
is a *line box*, not a caret. Its `left` is the start of the line, which in RTL is the
opposite end from where the caret actually is.

**What to do.** Derive the caret from the character *before* the position: take a range
covering that one character, and put the caret on its trailing edge.

Which edge is "trailing" must be **measured, not read from
`getComputedStyle(...).direction`.** The direction that matters is the bidi *run's*, and
the computed value is the *container's* — an RTL word inside an `ltr` container computes
as `ltr` while being laid out right to left, so the computed value picks the wrong edge
for precisely the mixed content this is needed for. Instead: the caret one character back
sits at that character's leading edge, so whichever of the character's own edges that
lands on tells you which way text flows there.

**Where it shows up here.** `src/view/position-rect.ts`, and
[ADR 0015](../adr/0015-direction-belongs-to-the-consumer.md). Reachable through the
exported `positionRect` but *not* through the mention menu, which anchors on the `@`
rather than on the caret and so always gets a rect — which is why it went unnoticed until
RTL was looked at deliberately.

---

## Arrow keys in bidi text: engines disagree, and it is not yours to settle

**Symptom.** ArrowLeft moves the caret in Firefox and does nothing in Chrome and Safari,
in the same document, with the same selection.

**Mechanism.** In mixed-direction text, "left" and "back" are different directions, and
there is no single answer about which an arrow key means. Measured on Hebrew text in a
`dir="ltr"` container, caret at logical offset 0, pressing ArrowLeft nine times (with
polling, so a slow `selectionchange` cannot be mistaken for "did not move"):

| | resulting offsets |
|---|---|
| Firefox | `1, 2, 3, 4, 5, 6, 7, 8, 9` |
| Chromium, WebKit | `0, 0, 0, 0, 0, 0, 0, 0, 0` |

Both are defensible: the run is laid out right to left, so its logical start is at the
run's *right*, and "visually left" and "logically back" genuinely point opposite ways. In
a `dir="rtl"` container all three engines agree.

**What to do.** Nothing — and specifically, do not assert a caret offset after an arrow
key in bidi text. [ADR 0003](../adr/0003-own-editing-not-navigation.md) gives navigation
to the browser precisely so this is never the engine's problem; users get their
platform's behaviour, which is what they get in every other text field. The assertion
worth making is the weaker one: *whatever* selection arrives is a position the model can
represent.

**Where it shows up here.** `e2e/spec/adr-0015-direction.spec.ts` asserts the caret stays
in range and never lands inside an atom, rather than asserting where it lands. Also worth
knowing while probing: an unsettled read of the caret right after a keypress produces
convincing nonsense — an earlier version of this note claimed Chromium repeated and
skipped offsets in RTL, which was a race in the probe, not a browser behaviour.
