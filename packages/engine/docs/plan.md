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
> **Verified against a real composition on 2026-08-10**, once M6's browser matrix made it
> reachable: CDP's `Input.imeSetComposition` drives genuine `compositionstart`/`update`
> events and Chromium renders its own pre-edit text. The contract held on first contact —
> one undo step per composition, canonical DOM restored, a neighbouring mention keeping its
> `value`, and no stray `insertCompositionText`. See
> [ADR 0009](adr/0009-yield-the-dom-during-composition.md).
>
> **Chromium only**, though: WebKit and Firefox have no CDP equivalent, and Gboard — the
> aggressive case this milestone was most worried about — still needs a human at a keyboard.

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

> **Grapheme clusters: built.** [ADR 0013](adr/0013-positions-stay-code-units.md).
>
> Two bugs were reproduced before anything was designed, which is what kept the fix small.
> `diffDocs` compared code units, so `👍` → `👎` — which share a leading surrogate —
> produced a diff inserting a bare `\uDC4E`: a `�` the user can neither select nor delete.
> And the fallback delete took exactly one position, which is half of any emoji;
> [ADR 0004](adr/0004-take-edit-ranges-from-the-browser.md) had recorded that as knowingly
> wrong and deferred it here. Both now have tests, confirmed red against the pre-fix code.
>
> **A position stays a UTF-16 code-unit offset.** Making a grapheme one position wide is
> the tempting symmetry with ADR 0005 and is wrong three times over: it adds a *third*
> coordinate space, it puts a segmentation walk on every `domToModel` call — those are
> index arithmetic only because model and DOM offsets are the same unit — and the browser
> hands us code units already grapheme-resolved. So the invariant is weaker and more
> useful: **every position the engine produces is one the browser could have produced.**
>
> Only three places invent a boundary, which is the whole reason this stayed contained:
> the fallback delete, the diff narrowing, and undo coalescing (a typed emoji is one
> character, so `hi 👍` is one undo step rather than three). Everywhere else the offsets
> come from `getTargetRanges()`.
>
> **The browser matrix: built.** `packages/engine/e2e/`, on its own Playwright config —
> the package is `private: true` and CI does not run it on purpose, so sharing the root
> config would let an experiment block a mentis release. The shape is reused, the run is
> not. Specs mirror **ADRs** rather than docs pages, one file per ADR that makes a
> browser-observable claim, so every *Unverified* section has somewhere to be discharged.
>
> It paid for itself the day it was written. Four ADRs lost their headline doubt:
> chip traversal is one caret stop on every engine (0005), the clipboard round trip works
> through a real system clipboard (0010), cut ordering holds and **Firefox does populate
> `dataTransfer` on `beforeinput`** (0012 — the largest single risk on the board), and no
> engine ever produces half a code point (0013).
>
> And it found something: **browsers disagree about how much one delete covers.** Firefox's
> `getTargetRanges()` reports a wider range than Chromium and WebKit for a delete beside a
> chip, and removes a combining mark or one ZWJ member rather than a whole cluster. Nothing
> is corrupted, so it is granularity rather than a defect — but it means ADR 0004's "the
> browser has worked out the right range" now reads "*its* range". Three `test.fixme`s hold
> the question open; answering it needs an ADR, not a patch.
>
> **Delete granularity: answered.** [ADR 0014](adr/0014-clamp-a-forward-delete-to-an-atom.md),
> and the useful part is that the question above is *mis-stated*. It files three fixmes as one
> phenomenon; probing the whole family instead of the one document found two, with opposite
> answers.
>
> Firefox's real rule for a forward delete at an atom is **"the atom plus one grapheme of
> whatever follows"**, so it destroyed a letter or a whole emoji rather than just a space —
> and when nothing follows it reports a **collapsed** range. ADR 0004 reads that as "delete
> nothing", so **a trailing mention chip could not be deleted with the Delete key at all in
> Firefox.** That had been parked under a label that said "not a defect" for a day, purely
> because the first probe used a document with a space after the chip.
>
> So: **grapheme extent stays the browser's** — Firefox peels a cluster backwards and takes
> it whole forwards, which is a coherent convention and ADR 0003 says leave those alone —
> while **a forward delete at a collapsed caret on an atom is clamped to that atom.** Three
> conditions, each excluding a case the clamp would break, and a test for each asserting it
> does *not* fire. The one place the engine overrules a browser range; the precedent is the
> risk rather than the code, which is what the ADR is for.
>
> All three `test.fixme`s are gone — two discharged, one converted into a per-engine
> expectation, because parked it would have gone on failing for behaviour the engine had
> decided to keep.
>
> **RTL / bidi: built, and it cost almost nothing.**
> [ADR 0015](adr/0015-direction-belongs-to-the-consumer.md) — direction belongs to the
> consumer's container and the engine reads it nowhere.
>
> The model is **byte-for-byte identical** in `ltr` and `rtl` for the same content, on all
> four projects: same text, same length, same nodes, same mention offsets. Editing RTL text,
> deleting a chip, typing beside one, undo restoring it as a mention — all already correct.
>
> That is a consequence rather than luck, and naming the cause is the useful part: ADR 0003
> gives navigation to the browser, so bidi caret behaviour is never the engine's problem;
> ADR 0004 takes ranges from `getTargetRanges()`, so the browser resolves what a keypress
> means in a reordered line; ADR 0005 makes positions logical offsets, which have no
> direction. Three earlier decisions paying out at once.
>
> So the ADR is mostly a set of things deliberately **not** done — no `dir` on the root, none
> on chips, no bidi control characters, nothing reading visual order — and the spec asserts
> the model is *unaffected*, which is the claim a future change would break.
>
> One real bug found where direction is unavoidable: **`positionRect` was off by the width of
> the editor at the end of an RTL line in WebKit**, which reports no client rects at all for
> a collapsed range at the end of a text node, sending it into a fallback that returned the
> line box's left edge. It now derives the caret from the preceding character, choosing the
> edge by *measurement* — `getComputedStyle(...).direction` is the container's, and the run's
> is what matters, so an RTL word in an `ltr` container would pick the wrong side.
>
> Also learned, the hard way: an unsettled caret read right after a keypress produces
> convincing nonsense. A first pass "found" Chromium repeating and skipping offsets in RTL;
> it was a race in the probe. Both are in the traps note.
>
> **Word-level replacement: reachable after all, and it works.** CDP's
> `Input.imeSetComposition` takes `replacementStart`/`replacementEnd` — which *is* the
> Android mechanism, a composition that replaces an existing range rather than inserting at
> the caret. So Gboard's aggressive case is drivable on Chromium and mobile Chrome without
> faking anything, the same argument that made M4's IME verification worth doing.
>
> Two things came out of pointing it at the engine. Replacing `teh` with `the` reconciles
> correctly and is **one** undo step. And a replacement range deliberately stretched across a
> mention **cannot destroy the chip** — Chromium clamps its own replacement range at the
> `contenteditable="false"` boundary and refuses to compose across it, so the mention keeps
> its `value`. That is ADR 0005's pattern again: the protection is inherited rather than
> implemented.
>
> **The real find was somewhere else, and it had been shipping since M3.** Giving
> [ADR 0008](adr/0008-undo-granularity-is-word-based.md) its first browser coverage — a claim
> nobody expected to fail — turned up that **a keypress which changed nothing was recorded as
> an undo step.** ADR 0004 reads a collapsed browser range as "delete nothing", and Chromium
> and Firefox fire `deleteContentForward` with one whenever there is nothing ahead of the
> caret, so the engine built a zero-step transaction and the history recorded it. Delete at
> the end of a document four times took the stack from depth 2 to 6.
>
> It cost a dead ⌘Z per keystroke, it **split the word being typed** — directly against ADR
> 0008's central claim — and it **cleared the redo branch**, making undone work
> unrecoverable. That last one is data loss. One guard in `record` fixes all three, and also
> the route WebKit reaches it by: a selection-only transaction, which any M7 adapter will
> dispatch to move the caret.
>
> The engine was right twice and still wrong: right that a collapsed range means delete
> nothing, right to build a transaction for it — and wrong to treat *a transaction happened*
> as *an edit happened*. Nothing had said those were different events.
>
> **M6 is parked here, deliberately** — everything reachable without a phone is done, and
> what remains is a device and a person rather than more code. See
> [Why M6 is parked rather than finished](#why-m6-is-parked-rather-than-finished) for the
> full list and a checklist a device session can actually run.

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
- [x] M4 — IME / composition *(verified on Chromium; WebKit, Firefox and Gboard outstanding)*
- [x] M5 — clipboard *(round trip unverified against a real clipboard)*
- [x] M6 — nasty-input gauntlet **— parked, deliberately.** Everything reachable without a
      phone is done; see below
- [ ] M7 — adapters

## Why M6 is parked rather than finished

Rule 4 of this document says **timebox boss fights — park, don't grind.** This is that rule
being used on purpose, so it needs to say what was left and why, or "parked" quietly becomes
"forgotten".

**What is done:** grapheme clusters ([0013](adr/0013-positions-stay-code-units.md)), the
browser matrix, IME on Chromium against a real composition
([0009](adr/0009-yield-the-dom-during-composition.md)), delete granularity
([0014](adr/0014-clamp-a-forward-delete-to-an-atom.md)), RTL and bidi
([0015](adr/0015-direction-belongs-to-the-consumer.md)), and Android word-level replacement
through the mechanism Gboard actually uses. Four ADRs lost their headline doubt on the day
the matrix was written, and the `test.fixme` backlog is empty.

**What is left, and the reason it is not a "keep going" item:**

- **iOS autocorrect and dictation.** These arrive as `insertReplacementText`, and there is no
  automatable route to one. CDP has no spellcheck-correction command; the event comes from a
  context menu or a dictation engine. Synthesising it would only check the engine against
  *our own guess* at its shape — which is precisely the objection ADR 0009's Unverified
  section made before a real IME settled it, and it would produce a test that looks like
  evidence and is not.
- **Real Gboard.** The *mechanism* is covered — `composeReplacing` drives the same
  `replacementStart`/`replacementEnd` composition Gboard uses. What needs a device is its
  **policy**: when it decides to fire one, how much text it takes, and what it does with a
  chip in range.
- **Japanese and Chinese IME on WebKit and Firefox.** No CDP equivalent exists, so these
  skip in the matrix. A human with a Japanese input source is the only route.

The common thread: **what remains is not more code, it is a device and a person.** Grinding
here would mean writing tests that assert our assumptions back to us, which is worse than an
honest gap — an unverified claim that knows it is unverified is safer than a green test that
proves nothing. Every one of these is written down in the ADR that owns it, so none of them
can quietly expire.

### What a device session should check

Kept concrete so this is a session someone can actually run, not a wish. Harness on 5280
(`pnpm --filter @mentis/engine dev:e2e`), or the inspector on 5180 for the event log.

**Android / Gboard:**
1. Type a word, let autocorrect rewrite it. Does the model match the DOM afterwards? Is it
   one undo step?
2. Type a word **immediately after a chip**, then let autocorrect fire. Does the chip keep
   its `value`? This is the case the automated spec can only ask for politely — Chromium
   clamps its own replacement range at the atom boundary, and Gboard may not.
3. Swipe-type a whole sentence. Does anything arrive as `insertReplacementText` rather than
   as a composition?
4. Watch the event log for a trailing `beforeinput` *after* `compositionend`. Chromium does
   not send one; ADR 0009 flagged it as possible elsewhere.

**iOS:**
1. Dictate a sentence, then dictate a correction over it.
2. Let autocorrect fix a word next to a chip.
3. Tap-and-hold a misspelled word and pick a suggestion — that is the `insertReplacementText`
   path nothing has exercised.
4. Check whether undo (shake, or ⌘Z on a keyboard) matches what the model thinks.

**WebKit / Firefox desktop:** Japanese input, candidate window, commit with Enter. One ⌘Z
should remove the whole composition. Compose immediately after a chip, and commit an emoji
through the candidate window.

Anything found here belongs in the ADR that owns the claim, dated — not in a new document.
