# Prompt — add Playwright + a real behaviour spec to mentis

> Branch: `test/e2e-harness` · Worktree: `../mentis-e2e`
>
> Paste everything below the line into a fresh Claude Code session started in
> `/Users/alexdunlop/Documents/Github/mentis-e2e`.

---

You are adding an end-to-end test layer to **mentis**, a React mention-tagger library.
This branch (`test/e2e-harness`, off `main`) does **testing infrastructure only**.

## Why this is needed

mentis is a contenteditable library. Its entire behaviour lives on caret position,
`Selection`/`Range`, native editing, and clipboard — and the current test environment
(vitest + happy-dom) only approximates all of those.

There is direct evidence of this in the history: commit `a6fcfd0`,
_"fix: insert Enter newlines without execCommand in test DOMs"_ — a change made to
satisfy the fake DOM, not to fix anything for a user. When the test environment
dictates production code, the environment has stopped being a source of truth.

Separately, the recent `fix:` commits cluster around one root cause (the DOM is the
state, so every DOM quirk is a correctness bug). Those specific bugs have no
regression coverage at the level they actually occur:

- `f8516c6` `fix(extractMentionData): walk into nested elements`
- `afdf240` `fix(useContentEditableMention): show placeholder and fix newline duplication`
- `5b8fc20` `fix: mention extraction of nested elements, and Enter newlines without execCommand`

## Hard constraints

1. **Do not modify anything in `packages/mentis/src/`.** No behaviour changes, no
   "while I'm here" fixes. If a test reveals a bug, write it as `test.fixme()` with a
   one-line note and report it at the end. This branch must be a pure, safe merge.
2. Existing vitest/happy-dom tests in `packages/mentis/tests/` stay green and stay
   passing. Do not delete or rewrite them.
3. Node is pinned to 22.11.0 (`.node-version`). pnpm 10.10.0, turbo, workspace globs
   are `packages/**`.

## Repo orientation

- Library: `packages/mentis` — `MentionInput` is the public component
  (`src/components/MentionInput.tsx`), logic in `src/hooks/useContentEditableMention.ts`
- Playground: `packages/mentis/playground` (vite, `root: './playground'`), run with
  `pnpm --filter mentis playground`
- Unit tests: `packages/mentis/tests/*.tsx` — vitest, happy-dom, `globals: true`
- Docs site: `packages/docs`, with the documented behaviour in
  `packages/docs/content/docs/*.mdx`
- CI: `.github/workflows/unit-test.yml` (install → build → typecheck → test)

## The test layering you are establishing

Make this explicit in the README you write, because the current confusion about which
layer owns what is the underlying problem:

| Layer | Tool | Owns | Must **not** assert |
|---|---|---|---|
| Unit | vitest, no DOM | pure functions: trigger detection, offset math, parsing | anything needing a real caret |
| Component | vitest + happy-dom | props → callbacks → rendered output contract | caret position, native editing, clipboard |
| **E2E (new)** | Playwright, real browsers | caret after every operation, native editing, undo/redo, clipboard, IME, mobile, a11y tree | — |

## Deliverables, in order

### 1. A dedicated, deterministic harness page — not the demo playground

`packages/mentis/playground/src/App.tsx` is a scratchpad that changes freely; tests
must not depend on it. Add a separate route/entry (e.g. `playground/e2e.html` +
`src/E2EHarness.tsx`) that renders `MentionInput` with:

- a fixed, alphabetically stable option list (include two options sharing a label but
  with different values — that case is currently broken and worth pinning)
- one instance per meaningful prop configuration: `dataValue` (controlled),
  `displayValue`, `keepTriggerOnSelect` false, `autoConvertMentions` true, custom
  `trigger`
- stable `data-testid` on every instance and on a `<pre data-testid="…-onchange">`
  that renders the latest `onChange` payload as JSON

Never assert against the demo playground.

### 2. Playwright setup

- `@playwright/test` as a root devDependency; config at repo root or
  `packages/mentis/playwright.config.ts` — your call, but keep `pnpm test` (vitest)
  and the e2e command clearly separate. Add a root `test:e2e` script.
- `webServer` in the config that boots the harness page, with `reuseExistingServer`
  for local dev
- projects: `chromium`, `firefox`, `webkit`, plus one mobile project
  (`Pixel 7` Chrome) — mobile keyboards are where contenteditable libraries die
- traces/screenshots on first retry; **do not commit** `test-results/`,
  `playwright-report/`, or browser binaries — update `.gitignore`

### 3. Fixture helpers — invest here, they determine whether this suite gets used

A page-object or fixture module exposing at minimum:

- `typeText(str)` — real key events, not `fill()`
- `pressKeys("@al{ArrowDown}{Enter}")` — a small parser for a keystroke script string
- `getText()` / `getDataValue()` / `getOnChangePayload()`
- **`getCaretOffset()`** — caret position as a character offset into the editor's
  textContent, read via `page.evaluate` over `window.getSelection()`. This is the
  single most valuable assertion in the suite and the one happy-dom cannot give you.
- `expectModelState({ text, dataValue, caret })` — one call, three assertions
- `pasteHTML(html)` / `pasteText(str)` — via `clipboardData` on a dispatched event
  **and** a real OS-clipboard variant (`page.evaluate` + `navigator.clipboard.write`
  with clipboard permissions granted), because those two paths differ

### 4. `e2e/spec/` — the documented behaviour, mirrored

Derive spec files from the docs, one per page in `packages/docs/content/docs/`:
`basic-usage`, `chips`, `keyboard-navigation`, `onchange`, `options`, `props`,
`accessibility`, `styling`. **The docs are the spec** — this both tests the library
and catches documentation drift.

Aim for ~30 specs total. Cover at minimum:

- type text → modal opens on trigger, filters as you type, closes on non-match
- ArrowUp/Down wrap, Enter selects, Tab selects, Escape closes and stays closed
- click-outside closes
- **caret lands immediately after the chip** following selection (v1's `setTimeout`
  refocus makes this fragile — pin it)
- Backspace at a chip boundary deletes the whole chip, not part of it
- Enter inserts a newline when the modal is closed; Shift+Enter behaviour
- placeholder shows when empty, and **after** clearing a controlled `dataValue`
- controlled `dataValue` round-trip: set → render → edit → `onChange` → set again
- paste of plain text, of HTML containing chips, and over a selection
- option with a function `value` fires the function and removes the trigger
- native undo (Ctrl/Cmd+Z) after typing and after a chip insert
- the a11y contract: `role="combobox"`, `aria-expanded`, `aria-activedescendant`
  tracking the highlighted option

Mark anything currently broken `test.fixme("…")` with a one-line explanation. **Do not
fix it.**

### 5. `e2e/regressions/` + the recurring workflow — important

This is the part that must keep working for months. The user will frequently say, in
the middle of unrelated work:

> "add an e2e test to prevent this in future"

That sentence must have a single, boring, deterministic outcome. Set it up:

- create `e2e/regressions/` with a `_template.spec.ts`
- convention: one file per bug, named `<short-kebab-slug>.spec.ts`, opening with a
  header comment giving the symptom in one line, the commit or issue that fixed it,
  and the date
- each file is **one focused test** reproducing the bug through user actions only —
  no internal imports, no reaching into hooks
- write `e2e/README.md` documenting the layering table above, the fixture API, how to
  run a single spec, how to debug with `--ui` and traces, and — spelled out
  explicitly — **the recipe for "add an e2e test to prevent this in future"**:
  reproduce it at the E2E layer if it involves caret/native editing/clipboard,
  otherwise push it down to unit or component and say so.
- there is a `CLAUDE.md` in the repo root (gitignored, so local-only). If it exists,
  add a short `## E2E tests` section pointing at `e2e/README.md` and stating the
  regression convention, so future sessions pick it up without being told. If it does
  not exist, say so in your summary rather than creating one.

### 6. CI

Add `.github/workflows/e2e.yml`:

- on PR: chromium only, sharded if it's slow, with the report uploaded as an artifact
- nightly cron: all browsers plus the mobile project
- cache Playwright browsers by version

Leave `unit-test.yml` alone.

## Definition of done

- `pnpm test:e2e` passes locally on chromium from a clean `pnpm install`
- `pnpm --filter mentis test` (vitest) still passes, untouched
- `git diff main --stat` shows **zero** changes under `packages/mentis/src/`
- `e2e/README.md` explains the layering and the regression recipe well enough that a
  future session needs no other context
- your final summary lists every `test.fixme` you added, each with the bug it pins —
  that list is the bug backlog

## How to work

Land it in reviewable commits: (1) Playwright install + config + harness page,
(2) fixtures, (3) spec suite, (4) regressions scaffold + README, (5) CI. Get one
trivial spec genuinely passing before writing the other twenty-nine — a green
end-to-end loop first, breadth second.
