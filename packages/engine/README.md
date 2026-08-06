# @mentis/engine

Model-first inline contenteditable engine. Private, unpublished — see
[`docs/plan.md`](docs/plan.md) for what this is and why.

```sh
pnpm --filter @mentis/engine dev         # inspector at http://localhost:5180
pnpm --filter @mentis/engine test
pnpm --filter @mentis/engine typecheck
```

## Current state: M2 — atomic nodes, so mentions exist

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
src/commands/  higher-level edits, e.g. insertMention        — pure, returns transactions
src/editor/    the wiring that ties them together
```

Three decisions came out of building it, each with alternatives and a revisit trigger:
[0002](docs/adr/0002-render-newlines-as-text-not-br.md) newlines render as `\n` and
never `<br>`; [0003](docs/adr/0003-own-editing-not-navigation.md) editing is owned,
navigation is not; [0004](docs/adr/0004-take-edit-ranges-from-the-browser.md) edit ranges
come from `getTargetRanges()`, which supplies correct grapheme and word boundaries for
free.

Steps carry a **slice** — a list of inline nodes — rather than a string, so undoing a
deleted mention restores the mention rather than its label text. They are invertible from
the start, so M3's undo is a matter of storing transactions rather than snapshotting
documents.

**Not yet built:** trigger detection and the dropdown. Typing `@al` does nothing — insert
a mention from the harness's Mentions panel instead.

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

Two vitest projects, and the split is deliberate:

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

  text/                visible-whitespace · escape-html · truncate
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
