# @mentis/engine e2e — the engine's browser matrix

Playwright driving the engine in Chromium, Firefox, WebKit and mobile Chrome.

```sh
pnpm exec playwright install                        # once

pnpm --filter @mentis/engine test:e2e:chromium      # the fast loop
pnpm --filter @mentis/engine test:e2e               # all four projects
pnpm --filter @mentis/engine typecheck:e2e
```

## Why this exists, and why it is separate

`docs/plan.md` puts the matrix in M6 "because now it's actually needed". What made it
needed is that four ADRs had reached a point where their remaining doubt could only be
settled by a real browser — M2's chip traversal, M4's composition, M5's clipboard round
trip, M6's grapheme boundaries. Unit tests had gone as far as they can: happy-dom carries
no `clipboardData`, reports every selection as collapsed, and supplies no
`getTargetRanges()`, so the *fallback* paths were the only ones reachable.

It runs on **its own Playwright config**, not as four more projects on the root one. The
package is `private: true` and CI does not run it on purpose, so that an experiment can
never block a mentis release; sharing the root config would hand it that power over
`pnpm test:e2e`. The *shape* is reused — same four projects, same reporters, same
port-of-its-own convention, same "observe, don't fix" discipline. See `e2e/CLAUDE.md`.

## Specs mirror ADRs

`spec/` has one file per ADR that makes a browser-observable claim:

| Spec | Discharges |
|---|---|
| `adr-0001-newlines.spec.ts` | one `\n` per break, rendered as text, one trailing `<br>` |
| `adr-0005-atoms.spec.ts` | a chip is one caret stop; the two coordinate spaces diverge |
| `adr-0010-clipboard.spec.ts` | the round trip, through a real system clipboard |
| `adr-0013-graphemes.spec.ts` | whole characters, on the browser's own ranges |

The mirroring is the point. Every ADR carries an **Unverified** section, and this is where
those get discharged — so a claim cannot quietly outlive its evidence. When a spec settles
something, the ADR says so and dates it.

The v1 suite mirrors `packages/docs/content/docs/` instead, because there the docs are the
contract. Here the ADRs are.

## The harness page

Specs drive `dev/e2e.html` on port **5280** — never `dev/index.html`, which is the M0
inspector and grows a new panel whenever a milestone needs one. Same split, and the same
reasoning, as v1's `playground/e2e.html` on 5273.

`window.engineHarness` exposes `reset`, `model`, `insertMention`, `setCaret` and
`unhandledInput`. It deliberately does **not** expose the `Editor` or `dispatch`: specs
drive the editor as a user does and read the model to check the result. A spec that could
set up state the input pipeline cannot produce is a spec that proves something about
itself.

## The assertion that matters

```ts
await harness.expectModelMatchesDom();
```

The DOM is a projection of the model, never a source. That is the invariant the whole
package exists to hold, and it is not checkable anywhere but a real browser. Call it
liberally.

Its companion is that `model().selection` and `domCaretOffset()` **deliberately disagree**
for any document containing a mention — position space against character space, ADR 0005.
Asserting both is how a spec proves that divergence is real rather than theoretical.

## Current `test.fixme` backlog (3)

All Firefox, all the same finding: **browsers disagree about how much one delete covers.**
Nothing is corrupted — no lone surrogate is produced and the model stays in step with the
DOM — so this is granularity, not a defect.

- `adr-0005-atoms.spec.ts` — forward delete removes the chip *and the character after it*,
  because Firefox's `getTargetRanges()` reports `(DIV,0) → (" hi",1)` where Chromium and
  WebKit report `(DIV,0) → (" hi",0)`.
- `adr-0013-graphemes.spec.ts` — Backspace removes one member plus a joiner from a ZWJ
  sequence rather than the whole cluster.
- `adr-0013-graphemes.spec.ts` — Backspace removes a combining mark on its own. Firefox's
  position on this is long-standing and not obviously wrong.

Each is left failing on purpose. Making them pass means clamping a browser-supplied range
to the engine's own idea of one unit, which overrides platform convention and contradicts
[ADR 0004](../docs/adr/0004-take-edit-ranges-from-the-browser.md) — a decision that needs
its own ADR, not a patch.

## Not covered yet

- **IME / composition (ADR 0009).** Still the oldest unverified claim in the package.
  Playwright can drive composition through CDP in Chromium, which would cover some of it;
  Japanese and Chinese input on WebKit, and Gboard, still need a human.
- **RTL / bidi**, and **iOS dictation / Android word-level replacement** — the rest of M6.
