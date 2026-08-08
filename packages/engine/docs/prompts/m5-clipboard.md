# Prompt — M5: clipboard as a serialisation problem

> Paste everything below the line into a fresh Claude Code session started in
> `/Users/alexdunlop/Documents/Github/mentis-engine`.

---

You are building **M5** of `packages/engine` in the mentis monorepo. Read these first, in
this order — they are the contract, not background:

1. `packages/engine/docs/plan.md` — what this project is and why. **The framing in "Why
   this exists" governs every judgement call.**
2. `packages/engine/CLAUDE.md` — the standing rules and footguns.
3. `packages/engine/docs/adr/` — nine ADRs. M5 is constrained by all of them; 0005 and 0009
   most directly.
4. `packages/engine/docs/notes/contenteditable-traps.md` — five platform traps, all of which
   have bitten already.

## Where things stand

- `main` has M0 through M3. **M4 (IME composition) is PR #85, still open** — branch
  `feat/engine-m4`. Check whether it has merged; if not, branch M5 off `feat/engine-m4`, not
  off `main`, or you will lose the reconciliation machinery M5 depends on.
- 284 tests, typecheck clean.
- A harness session on 2026-08-08 confirmed chip traversal, the trailing-newline caret, and
  that undo works. **The IME path was never exercised** — ADR 0009 remains unverified and is
  M4's outstanding timebox check. Do not mark it verified.

## What M5 is

From the plan:

> ### M5 — Clipboard as a serialisation problem
> - paste rules pipeline: HTML → model
> - plain-text fallback
> - **copy**, including copying a mention and pasting it back with its value intact
>   (`text/html` with data attributes, or a custom clipboard type)

**Done when:** copying a selection containing a mention and pasting it back — into this
editor — reproduces the mention with its `value`, not its label as plain text. Pasting
arbitrary external HTML produces sensible text without importing foreign structure.

## What M5 inherits, and must not break

- **ADR 0005 — two coordinate spaces.** Position space (`docLength`, `sliceLength`) and
  visible text (`docText`, `sliceText`) diverge for any document containing a mention.
  `docText(doc).length` is never a valid position. Clipboard code walks straight into this:
  a serialised string is characters, a paste range is positions.
- **ADR 0009 — reconciliation already exists.** `view/read-dom-state.ts` and
  `model/diff-docs.ts` were built for composition. Paste is a *different* problem: you know
  what arrived and can parse it deliberately, rather than recovering from a window where the
  browser wrote. **Prefer a real parse over reusing the recovery path**, and say so in the
  ADR if you disagree.
- **The engine owns editing (ADR 0003).** Paste arrives as `beforeinput` with
  `insertFromPaste` and a `dataTransfer` — already handled in `input/input-text.ts`, which
  reads `text/plain` synchronously off the event. **Never `navigator.clipboard.readText()`**:
  async, needs permission, and the archived v2 branch's mistake.
- **Copy is not `beforeinput`.** It's a `copy`/`cut` event, so the engine needs a listener
  for those. That is not a new exception to ADR 0003 — copy is editing-adjacent, and `cut`
  genuinely edits — but state the reasoning in the ADR rather than letting it pass silently.
- **`data-mention-value` on the atom element already exists** for exactly this purpose. The
  ADR 0005 consequences call out that M5 must serialise the value or a round trip degrades a
  mention to text.

## Design questions M5 must answer — decide, don't dodge

Each of these is a real fork. Pick one, record the alternatives and a revisit-when trigger.

1. **What goes on the clipboard?** `text/html` with `data-mention-value` attributes is the
   obvious answer and survives other apps. A custom MIME type is cleaner within our own
   editor but invisible elsewhere. You may want both, with `text/plain` as the label-only
   fallback.
2. **How much foreign HTML survives a paste?** The document is inline-only and flat (a hard
   non-goal), so nested structure has nowhere to go. Decide what `<br>`, `<div>`, `<p>` and
   an arbitrary `<span>` each become. Note the trap: browsers hand over `&nbsp;` constantly,
   and `char === " "` is false for it.
3. **Does a pasted mention keep its identity or get re-resolved?** Pasting a chip whose
   `value` refers to something the consumer no longer knows about is a real case. Keeping it
   is honest; dropping it to text is safe. There is no third option that isn't a lie.
4. **Cut.** One transaction, one undo step, and the clipboard written before the deletion —
   easy to get backwards.

## How to work

Match the existing conventions exactly; they are visible throughout `src/`.

- **One idea per file.** A file needing "and" to describe it is two files. Largest file in
  the package is ~150 lines. Tests live in a `tests/` folder beside the code.
- **Pure logic in `src/`, testable with no DOM.** Two vitest projects: `logic`
  (`environment: node`, a DOM is not even available) and `dom-smoke` (`*.dom.test.ts`,
  happy-dom, structure only — **never** caret semantics). Serialisation and paste-rule
  parsing should be pure and land in `logic`.
- **Write an ADR** (`docs/adr/0010-*.md`) for each real decision, with Context / Decision /
  Alternatives considered / Consequences / **Revisit when**. Short. The revisit trigger is
  the point — it makes overturning a decision deliberate.
- **Add to `docs/notes/contenteditable-traps.md`** for any platform behaviour you hit.
  Append-only. Something about clipboard MIME types across engines almost certainly belongs
  there.
- Update `docs/plan.md` (the M5 section + the status checklist), `README.md`, and
  `CLAUDE.md` if a new standing rule emerges.

## Verification, and be strict about this

- `pnpm --filter @mentis/engine typecheck` and `... test` must pass. **CI does not run this
  package** — `unit-test.yml` is scoped `--filter mentis` deliberately, so a private
  experiment cannot block a mentis release. Don't "fix" that.
- Boot `pnpm --filter @mentis/engine dev` and confirm every new module resolves.
- **State plainly what you could not verify.** Every ADR in this project has an unverified
  section where one is warranted, and three were downgraded to "confirmed" only after a real
  browser session. Clipboard behaviour across engines is largely unverifiable locally —
  Firefox in particular drops `clipboardData` from a constructed `ClipboardEvent`, which is
  already in the traps note. Do not claim what a test did not show.

## Deliverable

One PR against `main` (or against `feat/engine-m4` if #85 is still open), with:

- a commit message that explains *why*, not just what
- a PR body naming the decisions worth reviewing and a **Not verified** section
- a short list of what the user should test by hand in the harness, with what each check
  settles

The harness runs on port 5180. The user reviews and merges themselves.
