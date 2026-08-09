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
