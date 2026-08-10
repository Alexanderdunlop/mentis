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
| `adr-0009-composition.spec.ts` | IME reconciliation, on a real composition (Chromium) |
| `adr-0013-graphemes.spec.ts` | whole characters, on the browser's own ranges |
| `adr-0014-delete-granularity.spec.ts` | the atom clamp, and the grapheme difference kept on purpose |
| `adr-0015-direction.spec.ts` | RTL/bidi costs the engine nothing — asserted as the model being *unaffected* |

The mirroring is the point. Every ADR carries an **Unverified** section, and this is where
those get discharged — so a claim cannot quietly outlive its evidence. When a spec settles
something, the ADR says so and dates it.

The v1 suite mirrors `packages/docs/content/docs/` instead, because there the docs are the
contract. Here the ADRs are.

## The harness page

Specs drive `dev/e2e.html` on port **5280** — never `dev/index.html`, which is the M0
inspector and grows a new panel whenever a milestone needs one. Same split, and the same
reasoning, as v1's `playground/e2e.html` on 5273.

`window.engineHarness` exposes `reset`, `model`, `insertMention`, `setCaret`,
`unhandledInput` and `positionRect`. `reset` takes an optional writing direction, always
applied so one spec's `dir` can never leak into the next. It deliberately does **not**
expose the `Editor` or `dispatch`: specs
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

## Current `test.fixme` backlog (0)

There were three, all Firefox, all filed as one finding — "browsers disagree about how much
one delete covers" — on the grounds that nothing was corrupted. Probing the whole family
rather than the one document they were written against found **two** findings with opposite
answers, which is why they could not be cleared together. See
[ADR 0014](../docs/adr/0014-clamp-a-forward-delete-to-an-atom.md).

- **Grapheme extent really is convention.** Firefox peels a cluster backwards and takes it
  whole forwards. Not overridden; the two grapheme fixmes became per-engine expectations in
  `adr-0014-delete-granularity.spec.ts`, so a change in *either* browser now fails.
- **The atom case was a defect.** Firefox's rule is "the atom plus one grapheme of whatever
  follows", so it destroyed a letter or a whole emoji — and it reports a **collapsed** range
  when nothing follows, meaning a trailing chip could not be deleted at all. That is now
  clamped in `src/input/transaction-for.ts`, and the fixme passes on all four engines.

Worth keeping the shape of that mistake in mind when adding the next one: **"nothing is
corrupted" is not "nothing is broken"**, and a single document is not enough to name a
phenomenon.

## Not covered yet

- **IME on WebKit and Firefox.** `adr-0009-composition.spec.ts` drives a real composition
  through CDP, which is Chromium-only; the other two engines have no equivalent, so those
  specs skip there. Gboard and iOS dictation still need a human at the harness on 5280.
- **iOS autocorrect and dictation, and Android word-level replacement** — the rest of M6.
  All three arrive as `insertReplacementText`, which the engine handles but which has no
  real coverage here and cannot get any without a device. Synthesising the event would only
  check the engine against our own guess at the shape, which is the thing ADR 0009's
  Unverified section was complaining about before a real IME settled it.
- **An RTL mention menu placed by hand.** `adr-0015-direction.spec.ts` checks `positionRect`
  returns a rect on the correct side; how a real menu then looks involves the consumer's CSS.
