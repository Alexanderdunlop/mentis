# mentis e2e tests

Playwright suite driving `MentionInput` in real browsers.

## Why this layer exists

mentis is a contentEditable library. Its behaviour *is* caret position,
`Selection`/`Range`, native editing and the clipboard. The vitest + happy-dom
tests in `packages/mentis/tests/` only approximate all four.

There is direct evidence of the cost in the history: commit `a6fcfd0`, _"fix:
insert Enter newlines without execCommand in test DOMs"_ — a change to production
code made to satisfy the fake DOM, not to fix anything for a user. When the test
environment dictates production code, the environment has stopped being a source
of truth.

So the rule is: **anything that depends on a real caret is asserted here, and
nowhere else.**

## Which layer owns what

| Layer         | Tool                    | Owns                                                                            | Must **not** assert                          |
| ------------- | ----------------------- | ------------------------------------------------------------------------------- | -------------------------------------------- |
| Unit          | vitest, no DOM          | pure functions: trigger detection, offset math, parsing                         | anything needing a real caret                |
| Component     | vitest + happy-dom      | props → callbacks → rendered output contract                                    | caret position, native editing, clipboard    |
| **E2E** (new) | Playwright, real browsers | caret after every operation, native editing, undo/redo, clipboard, IME, mobile, the a11y tree | — |

If you are about to assert a caret position in happy-dom, stop: it is either
wrong or accidentally passing. Bring it here.

## Running

```sh
pnpm install
pnpm exec playwright install          # once, downloads the browsers

pnpm test:e2e                         # all four projects
pnpm test:e2e:chromium                # just chromium — the fast loop
pnpm test:e2e:ui                      # interactive, time-travel debugging
pnpm typecheck:e2e                    # tsc over e2e/ and playwright.config.ts
```

Narrowing down:

```sh
pnpm exec playwright test e2e/spec/chips.spec.ts                  # one file
pnpm exec playwright test e2e/spec/chips.spec.ts:42               # one spec by line
pnpm exec playwright test -g "Backspace at the chip boundary"     # one spec by name
pnpm exec playwright test --project=firefox --headed --debug      # watch it happen
```

When something fails in CI, download the `playwright-report` artifact and open
it, or run `pnpm test:e2e:report` locally. Traces are captured on first retry;
open one with `pnpm exec playwright show-trace <path-to-trace.zip>` for a
DOM snapshot at every step.

The suite boots its own dev server (`pnpm --filter mentis playground:e2e`) on
**port 5273** — not vite's default 5173, so a run can never accidentally attach
to a demo playground you already have open. Locally the server is reused if it is
already up.

## The harness page

Specs run against `packages/mentis/playground/e2e.html`
(`playground/src/E2EHarness.tsx`), **not** the demo playground. `App.tsx` is a
scratchpad that changes freely; tests must not depend on it.

Never assert against the demo playground.

The harness renders one `MentionInput` per meaningful prop configuration. Each is
wrapped in `<section data-testid="mention-<id>">` and paired with
`<pre data-testid="<id>-onchange">` holding `{"count":n,"data":MentionData|null}`.
The count lets a spec wait for the *next* payload instead of racing the current
one.

Case ids are a TypeScript union (`CaseId` in `fixtures/harness.ts`), so a typo is
a compile error rather than a timeout. Adding a case means adding it there too.

## The fixture API

Every spec starts the same way:

```ts
import { test, expect } from "../fixtures/harness";

test("...", async ({ harness }) => {
  const input = harness.case("default");
  // ...
});
```

`harness.case(id)` returns a `MentionCase`. If you find yourself writing
`page.evaluate` in a spec, a helper is missing — add it to the fixture so the
next spec gets it for free.

**Locators** — `section`, `editor`, `modal`, `options`, `option(label, nth?)`,
`highlightedOption`, `noOptions`, `chips`, `outside`.

**Reading state** — `getText()` (the editor's `textContent`), `getHTML()`,
`getOnChangePayload()`, `getDataValue()`, `getDisplayValue()`, `getMentions()`,
`getChangeCount()`, `getControlledDataValue()`, `isFocused()`,
`isCaretCollapsed()`.

**`getCaretOffset()`** — the caret as a character offset into the editor's
`textContent`, read from `window.getSelection()`. This is the single most
valuable assertion in the suite and the one happy-dom cannot give you. It returns
`null` when the caret is not inside the editor, which is usually a focus bug, so
it is reported rather than coerced to a number.

**Driving** — `focus()` (places the caret at the end, so tests never depend on
glyph metrics), `typeText(str)` (real key events, never `fill()`),
`pressKeys(script)`, `undo()`, `redo()`, `selectAll()`.

`pressKeys` runs a keystroke script: literal characters are typed, `{...}` is
pressed. Playwright key syntax works inside the braces.

```ts
await input.pressKeys("@al{ArrowDown}{Enter}"); // type, navigate, select
await input.pressKeys("{Backspace*3}");         // repeat
await input.pressKeys("{Shift+Enter}");         // modifiers
await input.pressKeys(`{${MODIFIER}+z}`);       // Meta on macOS, Control elsewhere
```

**Caret placement** — `setCaretOffset(n)`, `setCaretToStart()`,
`setCaretToEnd()`, `setCaretBeforeChip(i)`, `setCaretAfterChip(i)`,
`selectRange(start, end)`. Prefer the chip-relative helpers when a chip boundary
is the point of the test: an offset that lands on a boundary is ambiguous, those
are not.

**Clipboard** — three paths, because they are genuinely different code paths in
the browser and a library that only works under one of them is broken:

| Helper                          | What it does                                            | Where it runs   |
| ------------------------------- | ------------------------------------------------------- | --------------- |
| `pasteText` / `pasteHTML`       | dispatches a `ClipboardEvent` carrying a `DataTransfer`  | not Firefox¹    |
| `pasteByCopying({text\|html})`  | a genuine copy from the harness, then a genuine paste    | everywhere      |
| `pasteFromSystemClipboard(text)` | `navigator.clipboard.writeText`, then a real paste key  | Chromium only²  |

¹ Firefox ignores `clipboardData` passed to the `ClipboardEvent` constructor, so
`event.clipboardData` arrives null. That is a limit of the test path, not the
library. ² Clipboard permissions are only grantable in Chromium through
Playwright.

Reach for `pasteByCopying` when a paste spec should run on the whole matrix.

**Assertions** — `expectModelState({ text, displayValue, dataValue, caret })` is
one call for four assertions, and every field is optional. All of them poll, so
it is safe to call immediately after an action even though `handleSelect`
refocuses on a `setTimeout`.

```ts
await input.expectModelState({
  text: "hi @Alice ",   // what the DOM says
  displayValue: "hi @Alice ", // what onChange reported the user sees
  dataValue: "hi alice ",     // what onChange reported the data is
  caret: 10,
});
```

Also `expectCaretOffset(n)`, `expectCaretAtEnd()`, `expectOptionLabels([...])`.

### Two cross-browser traps

**Caret offsets are not portable across a newline.** Chromium and WebKit end a
line with a block boundary that contributes nothing to `textContent`; Firefox
inserts a literal `"\n"` that does. The caret is visibly in the same place, but
its offset differs by one per newline. Use `expectCaretAtEnd()` for content
containing newlines — a hard-coded offset there asserts a browser quirk, not the
library.

**`textContent` and `displayValue` are allowed to disagree**, and asserting both
is the point. `displayValue` is the library's model of the content; `textContent`
is what is actually in the DOM. Several of the bugs listed below were found
precisely because the two diverged.

## Layout of this directory

```
e2e/
  fixtures/harness.ts     page object + the `test` fixture
  spec/                   one file per docs page — the docs are the spec
  regressions/            one file per fixed bug
  tsconfig.json
```

`spec/` mirrors `packages/docs/content/docs/` one-to-one: `basic-usage`, `chips`,
`keyboard-navigation`, `onchange`, `options`, `props`, `accessibility`,
`styling`. **The docs are the spec** — this both tests the library and catches
documentation drift. If you change documented behaviour, the matching spec file
should change in the same commit.

`spec/native-editing.spec.ts` is the exception: it has no counterpart in the
docs. That is worth noticing rather than tidying away — undo/redo and caret
cooperation with the browser are where contentEditable libraries die, and none of
it is currently documented, so there is no stated contract to mirror.

## "Add an e2e test to prevent this in future"

This has one boring, deterministic outcome. Follow it exactly.

### 1. Decide the layer first

Does reproducing the bug require **a real caret, native editing, or the
clipboard**?

- **Yes** → it belongs here. Continue.
- **No** → it belongs in `packages/mentis/tests/` as a unit or component test.
  **Say so out loud** rather than silently putting it in the wrong place: "this
  one doesn't need a browser — it's offset arithmetic, so it goes in
  `tests/utils/`." A pure-function bug pinned by a browser test is a slow test
  that will be deleted in six months.

Rules of thumb for "yes": the bug involves where the cursor ended up, Backspace
or Delete near a chip, Enter and newlines, undo/redo, paste, focus, IME, mobile,
or anything where the DOM and the reported model disagreed.

### 2. Write exactly one file

`e2e/regressions/<short-kebab-slug>.spec.ts`, copied from `_template.spec.ts`,
opening with:

```ts
/**
 * Symptom: caret jumped to the start of the input after pressing Enter
 * Fixed by: a1b2c3d
 * Date: 2026-08-06
 */
```

One bug per file. One test per file. Name the file after the symptom, not the
cause — the cause is what the fix changed, and you want the file to still make
sense if the fix is later replaced.

### 3. Reproduce it through user actions only

Key presses, clicks, pastes. No imports from `packages/mentis/src`, no reaching
into hooks, no calling internals. If it cannot be reproduced that way it is not
an e2e test — go back to step 1.

Assert **state and caret**. A regression that leaves the right text with the
caret in the wrong place is still a regression, and the caret is the entire
reason this layer exists.

### 4. Watch it fail before you trust it

Check out the commit before the fix, or revert the fix in your working tree, and
confirm the spec goes red. A regression test that has never failed is only
decoration.

### 5. If the harness needs a new case

Add it to `E2EHarness.tsx`, add its id to the `CaseId` union, and keep the
`data-testid` convention. Do not bend an existing case to fit — other specs
assert against it.

## Do not fix bugs from this directory

This branch is testing infrastructure only. When a spec reveals a bug in
`packages/mentis/src/`, pin it with `test.fixme()` and a comment giving the
cause, and leave the source alone. The fixme list is the bug backlog:

```sh
grep -rn "test.fixme" e2e/
```

Un-fixme the spec in the same commit as the fix, and it becomes the regression
test for free.

### Current backlog (15)

Found while writing this suite. Each has the cause in a comment above it.

**Data corruption**

- `chips.spec.ts` — pasting text whose mention is not at offset 0 duplicates the
  leading text and creates no chips at all. `parseMentionsInText` appends the
  text before a match and then skips chip creation entirely without advancing
  `lastIndex`. Pasting `"hey @Alice and @Bob"` yields
  `"hey hey @Alice and hey @Alice and @Bob"`. The worst one here.
- `chips.spec.ts` — `autoConvertMentions` writes the label into `data-value`
  instead of the option's value, so the chip looks right and the data is wrong.
- `options.spec.ts` — option values where one is a prefix of another collide in
  `reconstructFromDataValue`: `"user10"` matches the option valued `"user1"` and
  the leftover `"0"` is rendered as text.
- `onchange.spec.ts` — emptying the editor reports `"\n"` rather than `""`,
  because the browser's filler `<br>` is counted before it is stripped.

**Caret and editing**

- `native-editing.spec.ts` — typing immediately before a chip destroys it,
  taking the typed character with it.
- `props.spec.ts` — controlled `displayValue` resets the caret to offset 0 once
  the content contains a newline, so the next character lands at the *start* of
  the input.
- `native-editing.spec.ts` — native undo cannot revert a chip insertion; the
  typed query is gone and unrecoverable.
- `onchange.spec.ts` — one Enter is reported as two newlines.

**Documented but not true**

- `props.spec.ts` — multi-character triggers (`"::"`) never match anything;
  `detectMentionTrigger` hard-codes a one-character trigger. props.mdx documents
  them explicitly.
- `keyboard-navigation.spec.ts` — `onKeyDown` never receives Enter, even with the
  modal closed, so the form-submission pattern in props.mdx cannot be
  implemented.
- `chips.spec.ts` — chips inserted from the dropdown are
  `contenteditable="true"`; chips.mdx says `false`, and chips restored from
  `dataValue` are `false`. This is the root cause of the typing-before-a-chip bug
  above.
- `keyboard-navigation.spec.ts` — Escape does not close the modal when no options
  match.
- `keyboard-navigation.spec.ts` — Escape's dismissal does not stick: the next
  keystroke reopens the modal without a new trigger.
- `styling.spec.ts` — `container` and `option` classNames *replace* the default
  class while the others extend it. For the container that is a functional break:
  the default class supplies the `position: relative` the dropdown is positioned
  against.
- `onchange.spec.ts` — `autoConvertMentions` never fires `onChange` for the
  conversion it performs, so it is invisible to the consumer.

Two documentation errors found that are not code bugs: chips.mdx's chip-deletion
example (`Result: "@John DoeX"`) contradicts its own prose, and chips.mdx passes
`chipClassName` as a top-level prop in one snippet where it belongs in
`slotsProps`.
