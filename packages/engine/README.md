# @mentis/engine

Model-first inline contenteditable engine. Private, unpublished — see
[`docs/plan.md`](docs/plan.md) for what this is and why.

```sh
pnpm --filter @mentis/engine dev         # inspector at http://localhost:5180
pnpm --filter @mentis/engine test
pnpm --filter @mentis/engine typecheck
```

## Current state: M6 — graphemes and the browser matrix (in progress)

The editor is engine-driven: `beforeinput` is intercepted, a transaction is applied to
the document, and the DOM is patched to match. **The DOM is a projection of the model,
never a source.**

Mentions are **atomic inline nodes**, one position wide however long the label
([ADR 0005](docs/adr/0005-an-atom-is-one-position-wide.md)). A `value` distinct from the
`label` is stored on the node, so two mentions sharing a label stay distinct — the thing
v1 cannot do, because it re-derives mentions from rendered text.

That width choice means **there is no position inside a mention**, which closes the
selection-correction debt ADR 0003 recorded rather than paying it. Arrow traversal and
whole-chip deletion are inherited from `contenteditable="false"` rather than implemented.

The cost is two coordinate spaces that must never be mixed: **position space**
(`docLength`) and **visible text** (`docText`). They diverge for any document holding a
mention.

Caret movement is still the browser's — the engine intercepts `beforeinput` and nothing
else ([ADR 0003](docs/adr/0003-own-editing-not-navigation.md)). Uncheck **engine
attached** in the harness to detach it and compare against a bare `contenteditable`;
that is the fastest way to tell "the engine is wrong" apart from "the browser does that
too".

```
src/model/     doc, positions, slices, steps, transactions   — pure, no DOM
src/view/      render (patches, never innerHTML) + position mapping both ways
src/input/     beforeinput -> transaction                    — transaction-for.ts is pure
src/query/     trigger detection                             — pure, no DOM
src/history/   undo stack, coalescing                        — pure, no DOM, no clock
src/clipboard/ serialise + paste rules                       — all but the parse is pure
src/commands/  higher-level edits, e.g. insertMention        — pure, returns transactions
src/text/      escape-html, shared by the serialiser and the inspector
src/editor/    the wiring that ties them together
```

Three decisions came out of building it, each with alternatives and a revisit trigger:
[0002](docs/adr/0002-render-newlines-as-text-not-br.md) newlines render as `\n` and
never `<br>`; [0003](docs/adr/0003-own-editing-not-navigation.md) editing is owned,
navigation is not; [0004](docs/adr/0004-take-edit-ranges-from-the-browser.md) edit ranges
come from `getTargetRanges()`, which supplies correct grapheme and word boundaries for
free.

Steps carry a **slice** — a list of inline nodes — rather than a string, so undoing a
deleted mention restores the mention rather than its label text.

During an IME composition the engine deliberately **stops** owning the DOM — the browser
needs to render its own pre-edit text — then reads it back and reconciles on
`compositionend` ([ADR 0009](docs/adr/0009-yield-the-dom-during-composition.md)). That is
the single exception to the invariant above, and **it has not yet met a real IME**: the
tests simulate the browser's part.

**Copy a selection containing a mention, paste it back, and it is still a mention** — with
its `value`, not its label as text. The clipboard carries `text/html` with
`data-mention-value` alongside `text/plain`, both every time, and no custom MIME type
([ADR 0010](docs/adr/0010-the-clipboard-carries-html.md)). A pasted mention keeps its
identity rather than being re-resolved; the engine is headless and has nobody to ask.

Paste is a **parse**, not a reuse of the composition recovery path
([ADR 0011](docs/adr/0011-paste-is-a-parse-not-a-recovery.md)) — foreign HTML reduces to
text, newlines and atoms through three roles, since a flat inline document has nowhere to
put anything else. The whitespace ordering is the subtle part: nbsp is converted **last**,
because it is the one space HTML doesn't collapse.

Copy and cut need their own listeners, since neither is a `beforeinput`
([ADR 0012](docs/adr/0012-the-engine-listens-for-copy-and-cut.md)). `setData` is discarded
unless the event is cancelled, so cut owns its own deletion — one transaction, one undo
step, clipboard written before anything is removed. **None of this has met a real system
clipboard**; the tests serialise and parse, which is everything but the OS in the middle.

**A position is a UTF-16 code-unit offset and stays one**
([ADR 0013](docs/adr/0013-positions-stay-code-units.md)) — not a grapheme index, because
the DOM speaks code units too and that is the only reason position mapping is index
arithmetic rather than a segmentation walk. What changed instead is that the engine never
*invents* a position that is not a grapheme boundary. `"👍".length` is 2 and
`"👨‍👩‍👧".length` is 8, so `at - 1` leaves half a surrogate pair — a `�` the user can
neither select nor delete.

Only three places invent a boundary, which is what keeps this small: the fallback delete,
the diff narrowing that `compositionend` relies on, and undo coalescing. Everywhere else
the offsets come from `getTargetRanges()`, which the browser has already resolved.

Undo (<kbd>⌘Z</kbd> / <kbd>⌘⇧Z</kbd> / <kbd>Ctrl+Y</kbd>) is the engine's, since preventing
every `beforeinput` empties the browser's own stack — see
[ADR 0007](docs/adr/0007-the-engine-owns-the-undo-shortcut.md), which amends ADR 0003 for
that one shortcut. Granularity follows **word boundaries, not typing speed**
([ADR 0008](docs/adr/0008-undo-granularity-is-word-based.md)) — so the same keystrokes
always give the same undo steps.

Typing `@al` opens a filtered dropdown; arrows move, Enter or Tab inserts, Escape
dismisses. The query is a **pure function of (doc, selection)** — derived, never stored, so
there is no open/closed flag to go stale ([ADR 0006](docs/adr/0006-the-mention-query-is-derived-state.md)).

The dropdown and its key handling live in `dev/`, not `src/`: the engine is headless, and
ADR 0003 confines it to `beforeinput`, so Arrow/Enter/Escape/Tab are the consumer's. That
makes the harness a rehearsal for the M7 adapters.

## The instrument panel (M0)

Everything here is framework-free plain DOM, including the inspector itself. The rule
from the plan — nothing below `adapters/` imports a framework — applies to the tooling
too, from day one.

### Panels

| Panel | Shows |
|---|---|
| **Selection** | char offset (or range + selected count), collapsed, editor length, and the anchor/focus DOM paths with offsets |
| **DOM** | the live tree, with `▮` caret / `⟦⟧` range spliced in, `·` space, `⍽` **nbsp**, `⏎` newline, `⇥` tab, `⌀` zero-width. Empty text nodes are flagged `EMPTY`, `<br>` is highlighted, and `contenteditable=false` elements render in a distinct colour |
| **Model** | the live document: text, length, selection and nodes. Empty when the engine is detached |
| **Events** | every `keydown`, `beforeinput`, `input`, `composition*`, `paste`/`copy`/`cut`/`drop`, focus/blur — with `inputType`, `data`, `getTargetRanges()` mapped to char offsets, `isComposing`, and whether the event was `PREVENTED` |

Two details worth knowing, both explained in full elsewhere rather than duplicated here:

- **nbsp is rendered differently from a space on purpose** — they look identical but
  `char === " "` is false for nbsp, so identical glyphs would hide the bug.
  → [contenteditable traps](docs/notes/contenteditable-traps.md)
- **`textLength` counts a `<br>` as one newline**, unlike `Range.toString()`, which
  ignores `<br>` and would make every offset after a line break wrong. This is a
  modelling commitment M1 inherits, not just a measurement detail.
  → [ADR 0001](docs/adr/0001-line-breaks-as-newline-characters.md)

### Controls

- **intercept all beforeinput** — `preventDefault()`s every `beforeinput` from a
  capture-phase listener on `document`. Lets you watch what the browser *wanted* to do
  without it happening, which is a direct preview of M1. Capture phase is also what
  makes the log's `PREVENTED` flag truthful.
- **pause / clear / autoscroll / log selectionchange** (off by default — very noisy)
- **copy JSON / download JSON** — exports the session with `userAgent` and `platform`.
  This is how you capture a real Gboard or IME trace and turn it into a test fixture
  or a blog-post appendix.
- **Content presets** — empty, trailing `<br>`, nbsp runs, empty text nodes, an atomic
  chip, a ZWJ family emoji. The structures that break things.

### Replay

```
plain characters      typed one at a time
{Enter} {Backspace}   named keys (aliases: esc, del, down, return, …)
{Ctrl+z} {Shift+Enter} {Alt+Backspace}
{Backspace x3}        repeat (also *3)
{wait 250}            pause
{{  }}                literal braces
```

Example: `Hey @al{ArrowDown}{Enter} how are you?{Backspace x4}`

**Fidelity.** Page script cannot synthesize trusted key events, so playback is a
faithful *model* of the browser, not the real thing:

- `keydown` is dispatched untrusted. Engine-handled keys (arrows, Escape, Tab,
  Enter-while-a-modal-is-open) behave correctly, because the engine's own listener is
  what acts on them.
- Editing then goes through `document.execCommand` — deprecated, but the only in-page
  way to produce a genuine `beforeinput`/`input` pair that participates in the native
  undo stack.
- If a `keydown` listener calls `preventDefault`, playback skips the native action,
  exactly as a real browser would.

It **cannot** reproduce IME composition, mobile autocorrect, or hardware key repeat.
Those need real input — by hand here, or Playwright/CDP later. Test IME by switching
to a Japanese or Chinese input source and typing into the editor directly; the log
records composition faithfully because those events are real.

## Testing stance

**Three layers now**, and the third is what finally makes the ADRs' *Unverified* sections
answerable: [`e2e/`](e2e/README.md) drives the engine in Chromium, Firefox, WebKit and
mobile Chrome, on its own Playwright config so this `private: true` package can never
block a mentis release. Specs mirror ADRs one-for-one. It found on day one that **browsers
disagree about how much one delete covers** — which turned out to be two findings rather
than one, and produced [ADR 0014](docs/adr/0014-clamp-a-forward-delete-to-an-atom.md): the
grapheme half is platform convention and stays the browser's, the atom half was a defect
that hid behind it, and the `test.fixme` backlog is now empty.

Two vitest projects below it, and the split is deliberate:

- **`logic`** (`*.test.ts`, `environment: node`) — pure functions, no DOM available at
  all. If something here starts needing a DOM, that's a design signal, not an excuse
  to change the environment.
- **`dom-smoke`** (`*.dom.test.ts`, `environment: happy-dom`) — "does it throw" and
  coarse structure only. happy-dom's `Selection`, `Range`, `beforeinput` and
  composition support are approximations; caret semantics are never asserted here.
  Those belong in Playwright.

## Layout

One idea per file, so a reviewer never has to hold two concepts at once. Tests sit in a
`tests/` folder beside the code they cover.

```
src/devtools/
  index.ts             public exports, nothing else

  text/                visible-whitespace · truncate
  dom/                 text-length (ADR 0001) · node-path
  selection/           char-offset · read-selection · types
  tree/                markers · attrs · render-tree
  log/                 summarise · describe-event · render-row · create-event-log · types
  replay/              parse-script · aliases · types
                       dispatch-key · edit-primitives · native-action · caret · run-script
  inspector/           panel · render-selection · create-inspector

  model-probe.ts       the seam M1 plugs into
  scenarios.ts         preset scripts, each chosen to expose something specific

dev/                   the harness page — plain DOM, no framework
```

Two boundaries are deliberate rather than cosmetic:

- **`log/describe-event.ts` is separate from `log/create-event-log.ts`.** The interesting
  part — what actually gets reported about an event — is a set of plain functions taking
  an event and returning `{ summary, detail }`, so it's readable and testable without
  attaching to a live editor. The other file is only listener wiring.
- **`replay/parse-script.ts` holds no browser code.** It's pure so it unit-tests in the
  `node` project and so the Playwright suite can share the same script syntax.

`src/devtools/` is dev-only and will not ship in the engine's public entry point.
