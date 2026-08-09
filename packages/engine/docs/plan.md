# Mentis Engine — plan

> Branch: `feat/engine` · Worktree: `../mentis-engine` · Started 2026-08-06

## Why this exists

This is a **learning project, optimised for interesting — not for shipping.**

That is a deliberate choice, and it is the most important line in this document. It
determines what gets lavish attention (selection mapping, undo, IME) and what gets
capped hard (everything else). If a decision is ever ambiguous, pick the option that
teaches more.

The previous attempt at this (`overhaul-html-node-logic`, Sep 2025) was framed as
"make mentis framework-agnostic so Angular/Vue can use it." That framing produced
4,400 lines that were worth nothing until they were *all* finished — so when momentum
ran out at ~80%, the payoff was zero and the project went dormant for 11 months.

**The failure mode here is boredom, not breakage.** Every milestone below therefore
ends in something demonstrable.

## What it actually is

A **minimal, model-first, inline-only contenteditable engine.** Mentions are its
demo, not its purpose.

The engine owns a document model. The DOM is a *projection* of that model, patched
incrementally. Contrast with mentis v1, where the DOM **is** the state and
`extractMentionData` re-derives truth from it on every keystroke — the root cause of
essentially every `fix:` commit in the v1 history.

### Non-goals — cap these ruthlessly

- ❌ Block nodes, nesting, lists, tables, headings — **inline only, flat document**
- ❌ Rich text marks beyond what a mention chip needs
- ❌ Collaborative editing / CRDTs / OT
- ❌ Feature parity with `mentis@0.2.x`
- ❌ Framework adapters before Milestone 7
- ❌ Publishing to npm until it's genuinely good

`mentis@0.2.7` stays published and frozen on `main`. There is no migration deadline,
no parity checklist, and no obligation for this branch to ever ship. That freedom is
the point.

## Architecture sketch

```
model/       document model, positions, transactions/steps    — zero DOM, zero framework
view/        renderer (applies diffs), selection mapping      — DOM only
input/       beforeinput → transaction; composition handling  — DOM events only
history/     transaction inversion, coalescing                — zero DOM
mentions/    atomic-node plugin: trigger detect, query, chips — built on the above
adapters/    react/ vue/ svelte/ vanilla                      — Milestone 7, ~100 lines each
```

Hard rule: **nothing below `adapters/` may import a framework.** This costs nothing
to maintain as a discipline and is what makes Milestone 7 a victory lap instead of a
rewrite.

## Milestones

Each is self-contained and ends in a demo. Stopping after any one of them still
leaves something worth having — unlike last time.

### M0 — The instrument panel

A dev page with the editor plus a live debug panel:

- current model state, pretty-printed
- the real DOM tree side by side
- model offset ↔ DOM position for the current selection
- **a scrolling log of every `beforeinput`**: `inputType`, `data`, `dataTransfer`, ranges
- a replay box: type `@al{ArrowDown}{Enter} hi{Backspace}` and it fires real key events

**Done when:** you can watch what Chrome, Safari, and Gboard actually emit, and
replay a keystroke script with one keypress.

> **Built** — `packages/engine`, `pnpm --filter @mentis/engine dev`. See that package's
> README for the panels, the replay syntax, and the fidelity caveat (playback models
> the browser via `execCommand`; it cannot fake IME or mobile autocorrect, so those
> still need real input by hand).

Do this first. One hour with this panel teaches more than a week of reading specs,
and the replay box is both the debugger and (later) the test primitive. It is also
what makes the hard milestones tractable rather than soul-destroying.

### M1 — Model + text-only editor. **No mentions.**

Deliberately cut the feature the library is named after, so nothing can be faked.

- document model — start as a flat list of inline nodes
- transactions/steps as the *only* mutation path
- renderer that applies **diffs** to the DOM — never `innerHTML =`
- selection mapping, both directions

**Done when:** type, delete, arrow, select-and-replace all work and the model and DOM
never disagree.

> **Built** — `src/model/`, `src/view/`, `src/input/`, `src/editor/`. The Model panel in
> the harness is live, and the `engine attached` checkbox detaches it for A/B against a
> bare contentEditable. Three ADRs came out of it: [0002](adr/0002-render-newlines-as-text-not-br.md)
> (newlines render as `\n`, never `<br>`), [0003](adr/0003-own-editing-not-navigation.md)
> (intercept `beforeinput` only; navigation stays the browser's), and
> [0004](adr/0004-take-edit-ranges-from-the-browser.md) (edit ranges come from
> `getTargetRanges()`, which hands us correct grapheme and word boundaries for free).
> Still unverified in a real browser.

This is the intellectual core of the whole project. Good questions waiting here: what
is a position? do you patch the text node or rebuild the line? what about the trailing
`<br>` browsers demand in an empty block?

### M2 — Atomic inline nodes → mentions reappear

Chips as atomic model nodes rendered `contenteditable=false`.

Teaches: positions that can't be entered, arrow traversal across atoms, backspace
eating a whole atom, and why every serious editor eventually invents a gap cursor.

**Free win:** mention identity lives in the model, so duplicate labels with different
values just work — which v1 cannot do, and which the old branch's own code comment in
`v2/platform/content-editable.ts` was reaching for.

> **Built** — atoms in the model, view, input and commands.
> [ADR 0005](adr/0005-an-atom-is-one-position-wide.md): an atom is **one position wide**,
> which makes a position inside it unrepresentable and therefore **closes the selection
> correction debt ADR 0003 recorded** rather than paying it. The cost is two coordinate
> spaces — position space (`docLength`) and visible text (`docText`) — which diverge for
> any document containing a mention and must never be mixed.
>
> Steps now carry a *slice* rather than a string, so undoing a deleted mention restores
> the mention and not its label text. Arrow traversal and whole-chip delete come from
> `contenteditable="false"` rather than from our code.


### M2.5 — Trigger detection, so mentions can be typed

M2 gave mentions a model but no way to create one by typing. This slot exists because
that work fell between milestones and was nearly smuggled into M3 — it is a chunk in its
own right, not a footnote.

- trigger detection as a **pure function of (doc, selection)**
- a query that stops at whitespace and at atoms, and only opens at a word start
- dropdown and its keyboard, built in the harness rather than the engine

**Done when:** typing `@al` opens a filtered menu, arrows move, Enter or Tab inserts a
mention that replaces the trigger and query, Escape dismisses.

> **Built** — `src/query/`, plus `positionRect` for placement.
> [ADR 0006](adr/0006-the-mention-query-is-derived-state.md): the query is **derived, never
> stored**, so there is no open/closed flag to go stale and no detect/clear events to
> sequence — which is what the archived v2 branch got wrong.
>
> The dropdown and its key handling live in `dev/`, not `src/`. The engine is headless and
> ADR 0003 confines it to `beforeinput`, so Arrow/Enter/Escape/Tab belong to the consumer.
> That makes the harness a rehearsal for the M7 adapters rather than a shortcut.
>
> Salvaged from `v2/mention-query/*` and fixed on the way in: its `isWhitespace` compared
> against `" "` and so missed U+00A0, and its query slice was off by one.

### M3 — Undo stack

Taking over `beforeinput` kills native Ctrl+Z, so you own it now.

- transaction inversion
- coalescing: 10 typed chars = one undo step; type-then-delete = two
- the `historyUndo` / `historyRedo` inputTypes

**Done when:** undo/redo survives a mixed session of typing, chip insertion, deletion,
and paste.

> **Built** — `src/history/`, all pure: the stack never reads a clock, timestamps are
> passed in.
>
> The inversion work was already done in M1, so this milestone was a stack plus a merge
> rule.
>
> [ADR 0008](adr/0008-undo-granularity-is-word-based.md): granularity follows **words, not
> typing speed**. The first rule used a 600ms per-keystroke gap, and testing the harness
> caught it immediately — `Alex` undid as one step typed fast and as `Al` + `ex` with a
> hesitation. Beyond being unpredictable for the user, that made undo a function of machine
> timing and so untestable. Whitespace now closes a group; timing survives only as a 3s
> idle signal.
>
> [ADR 0007](adr/0007-the-engine-owns-the-undo-shortcut.md) **amends ADR 0003**: the engine
> now watches one keyboard shortcut. Preventing every `beforeinput` leaves the browser's
> undo stack empty, so ⌘Z fires *nothing at all* — waiting for `historyUndo` would mean
> undo silently never working. Both routes are honoured; neither is a fallback.

### M4 — IME / composition (the boss fight)

`compositionstart` / `compositionupdate` / `compositionend`, and the counterintuitive
rule: during composition you must **stop** controlling the DOM — let the browser own
it, then reconcile on `compositionend`.

Test with Japanese and Chinese input (macOS ships both, free) and Gboard on an
Android emulator.

**Timebox this.** If it eats three weekends and stops being fun, park it behind a
`composition: "passthrough"` escape hatch and move on. The project dying is the only
real failure.

> **Built** — [ADR 0009](adr/0009-yield-the-dom-during-composition.md). Passthrough turned
> out to *be* the mechanism rather than the fallback: `compositionstart` hands the DOM to
> the browser, `compositionend` reads it back
> (`view/read-dom-state.ts`), diffs it (`model/diff-docs.ts`) and applies one transaction —
> so a whole composition is a single undo step.
>
> This is the one place the DOM is treated as a source, which is exactly what v1 does wrong
> on every keystroke. The difference is scope: one composition, one writer, diffed against a
> model that was correct going in, canonical DOM restored immediately after.
>
> **Nothing here has met a real IME.** The tests play the browser's part by hand, which
> verifies the reconciliation contract and nothing about real event ordering. Revisit the ADR
> after the first session with a Japanese input source — that is the timebox check, and it
> needs a human at a keyboard.

### M5 — Clipboard as a serialisation problem

- paste rules pipeline: HTML → model
- plain-text fallback
- **copy**, including copying a mention and pasting it back with its value intact
  (`text/html` with data attributes, or a custom clipboard type)

Note for when you get here: the old branch used `navigator.clipboard.readText()` in
`v2/input/input-processor.ts`. That's wrong — it needs permissions and is async. The
paste event's `clipboardData` gives it to you synchronously with neither problem.

> **Built** — `src/clipboard/`, nine of its eleven files pure and testable with no DOM.
>
> [ADR 0010](adr/0010-the-clipboard-carries-html.md): the clipboard carries **`text/html`
> and `text/plain`, both, every time** — no custom MIME type, which would be invisible
> outside our own editor and a second serialisation to keep in step. The mention's `value`
> rides on `data-mention-value`, which [ADR 0005](adr/0005-an-atom-is-one-position-wide.md)
> put on the element for exactly this. A pasted mention **keeps its identity**: the user
> copied that mention, and the engine is headless, so it has no one to re-resolve against
> and inventing a hook would be it reaching for consumer state.
>
> [ADR 0011](adr/0011-paste-is-a-parse-not-a-recovery.md): paste is a **parse**, not a
> reuse of M4's `readDomState`. That is recovery code — it assumes canonical structure and
> keeps every character, because it is reconstructing a window the engine did not watch.
> Paste knows exactly what arrived and can decide what it means. Three roles cover it:
> skip, break, transparent. The bit that actually bit was ordering — nbsp has to be
> converted **last**, because it is the one space HTML doesn't collapse, so folding it to
> U+0020 early lets a later rule eat one of a deliberate pair.
>
> [ADR 0012](adr/0012-the-engine-listens-for-copy-and-cut.md): the engine listens for
> `copy` and `cut`, which is a **boundary** of ADR 0003 rather than an exception — copy is
> editing-adjacent and cut is an edit, and neither is caret movement. `setData` is
> discarded unless the event is cancelled, so writing the clipboard and cancelling are one
> act; cut then owns the deletion, one transaction, clipboard written first. Clipboard
> edits dispatch as `origin: "program"`, which is what finally makes `history/types.ts`'s
> claim that "paste is its own undo step" true rather than aspirational.
>
> **The round trip has never met a real clipboard.** The tests serialise and then parse,
> which covers everything except the operating system in the middle — see the Unverified
> sections of 0010 and 0012.

### M6 — The nasty-input gauntlet

- **Grapheme clusters.** `"👨‍👩‍👧".length === 8`, so every offset in the codebase is
  quietly wrong. `Intl.Segmenter` is the fix and a genuinely fun rabbit hole.
- surrogate pairs, combining accents, flag emoji
- RTL / bidi selection
- iOS autocorrect + dictation, Android word-level replacement, spellcheck corrections

**This is when the engine gets its own cross-browser matrix** — because now it's
actually needed.

It won't start from nothing: #80 landed a Playwright layer for v1 on main (`e2e/`,
config at the repo root, fixtures in `e2e/fixtures/harness.ts`, `e2e/CLAUDE.md` for the
conventions). Reuse its harness shape and its browser-matrix CI rather than inventing a
second one — and note that `replay/parse-script.ts` is pure precisely so both layers
can share one script syntax.

That suite has already paid into this plan: it established that Firefox counts a line
break in `textContent` while Chromium and WebKit don't, which is the first real
evidence bearing on [ADR 0001](adr/0001-line-breaks-as-newline-characters.md). Expect
more of the engine's design constraints to arrive from that direction.

### M7 — Adapters, as the victory lap

React / Vue / Svelte / vanilla wrappers, ~100 lines each, all in one afternoon. That
is the *proof* the layering worked — and note it's the same destination the old branch
aimed at first, just arrived at last, on solid ground.

## Rules for making this survive

1. **Greenfield. No parity pressure.** New code under a new package. Never open v1 to
   "check how it did this" except where explicitly salvaging (below).
2. **Write up each milestone.** "What Gboard actually sends to `beforeinput`",
   "Building an undo stack from transaction inversion", "Your string offsets are wrong:
   grapheme clusters in contenteditable." This knowledge is rare and hard to find. It
   creates external accountability — and it is far likelier to solve mentis's
   discovery problem than Angular support ever was.
3. **Read the prior art on purpose**, to see where your design diverges and why — not
   to copy:
   - ProseMirror guide, especially the transaction/step model
   - Lexical's reconciliation docs
   - the UI Events / Input Events spec on `beforeinput`
4. **Timebox boss fights.** Park, don't grind.

## Where documentation goes

Three homes, split by who needs the knowledge and when. The test: **would someone
coming back after a month away find this?** Code comments fail that test, because you
have to already be in the file.

| Kind | Home | Example |
|---|---|---|
| Local "don't break this" | comment at the line | the whitespace map is 1:1 so offsets stay valid |
| A commitment future work inherits | `docs/adr/NNNN-*.md` | a line break is one `\n` ([0001](adr/0001-line-breaks-as-newline-characters.md)) |
| Platform behaviour that will bite again | [`docs/notes/contenteditable-traps.md`](notes/contenteditable-traps.md) | nbsp is not a space; untrusted events can't edit |

ADRs are short and dated, and record the alternatives plus a **revisit-when** trigger —
the point is to make overturning a decision deliberate rather than accidental. The
traps file is append-only: add an entry every time you lose an hour to something.

That file is also the feeder for rule 2 below. Accumulating notes as you hit things is
far cheaper than reconstructing them months later, and it means the write-ups are a
side effect of work already planned rather than a separate chore.

## Salvage list from `overhaul-html-node-logic`

Worth taking (pure string logic + its tests, no DOM, no framework):

- `packages/mentis/src/v2/mention-query/` — `detect-query`, `find-trigger-backward`,
  `extract-query`, `isWhitespace` and all four test files
- `packages/mentis/src/v2/input/range-calculator.ts` + tests — as a reference for
  `inputType` → range, though the model version will differ

Leave behind (fights the same battle v1 lost, one layer up):

- `v2/platform/content-editable.ts` — does `element.innerHTML = …` on every keystroke
  and then restores the caret. Same flaw as v1, relocated. Will kill native undo and
  break IME mid-word.
- `v2/react/hooks/useMentionCore.ts` — `isProgrammaticUpdateRef` +
  `Promise.resolve().then()` echo suppression. Belongs in the model as an explicit
  transaction origin (`user` vs `program`), not as a flag in the React layer.

Do **not** rebase that branch. It's an archived design sketch; 11 months stale with a
conflicting `extractMentionData` rewrite on main.

## Setup

```sh
cd ../mentis-engine
pnpm install          # worktrees don't share node_modules
```

## Status

- [x] M0 — instrument panel
- [x] M1 — model + text-only editor
- [x] M2 — atomic nodes / mentions
- [x] M2.5 — trigger detection + dropdown
- [x] M3 — undo stack
- [x] M4 — IME / composition *(unverified against a real IME)*
- [x] M5 — clipboard *(round trip unverified against a real clipboard)*
- [ ] M6 — nasty-input gauntlet
- [ ] M7 — adapters
