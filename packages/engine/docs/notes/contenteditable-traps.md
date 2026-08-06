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
