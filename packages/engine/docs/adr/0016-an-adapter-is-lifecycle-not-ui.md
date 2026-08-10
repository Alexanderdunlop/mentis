# 0016 — An adapter is lifecycle and reactivity, not UI

- **Status:** accepted
- **Date:** 2026-08-10

## Context

M7 is the plan's victory lap: "React / Vue / Svelte / vanilla wrappers, ~100 lines each…
That is the *proof* the layering worked." It is also the destination the archived
`overhaul-html-node-logic` branch aimed at **first**, framed as "make mentis
framework-agnostic so Angular/Vue can use it", and produced 4,400 lines that were worth
nothing until all of them were finished.

So the question this ADR answers is not "how do we support React" but **what is an adapter
allowed to be**, because the last attempt's answer — a layer that owns rendering, state and
the DOM on the framework's behalf — is what made it unfinishable.

## Decision

**An adapter is framework lifecycle and reactivity glue. Nothing else.**

Concretely, for `src/adapters/react/`, which is 130 lines across two hooks:

- **`useMentis()` returns a `ref`, the model state, and the editor.** It creates the editor
  when the element appears and destroys it when the element goes away or the component
  unmounts.
- **`useMentionQuery(editor, state)` is a `useMemo`.** Not state, not an effect. The query is
  a pure function of `(doc, selection)` — [ADR
  0006](0006-the-mention-query-is-derived-state.md) — so storing it would reintroduce the
  open/closed flag and the `detected`/`cleared` event pair the archived branch got wrong,
  with a stale-render bug available as a bonus.

And these are deliberately *not* in it:

- **No component.** Especially not one accepting children. The engine owns its element's
  children, so a `<Mentis>{...}</Mentis>` would invite React to render into a DOM tree the
  engine also writes — the DOM as a second source of truth, which is mentis v1's central bug
  relocated one layer up. A ref to an element the consumer leaves empty makes the rule
  structural rather than documented.
- **No dropdown, no menu, no styling.** ADR 0003 confines the engine to `beforeinput`, so
  Arrow/Enter/Escape/Tab while a menu is open are the consumer's keys. An adapter that
  shipped a menu would have to own those, and then it owns keyboard policy for every
  consumer.
- **No state mirror.** `useSyncExternalStore` reads the engine directly. No adapter-side
  copy, no diffing, no equality function.

**The layering rule is enforced, not trusted.** The plan's one hard architectural rule —
*nothing below `adapters/` may import a framework* — is now `src/tests/layering.test.ts`,
which walks `src/`, extracts every module specifier, and fails naming the file. It also
asserts it is **not vacuous**: that the adapters themselves *do* import a framework, so
deleting them cannot make the rule pass while proving nothing.

**React is an optional peer dependency, on its own entry point.** Importing the engine must
never pull React in.

## The victory lap was real, and worth being specific about why

The adapter needed **nothing new from `src/`**. Not one export, not one signature change.

The engine already had `subscribe(listener) => unsubscribe` and a `getState()` whose
reference changes exactly when something changed — `create-editor.ts` reassigns `state` on
every applied transaction *and* on a real selection change, returning early when the
selection did not move. That is precisely `useSyncExternalStore`'s contract, arrived at in M1
and M3 without React being in the room.

Worth noting where that came from: it was not foresight about React. It came from
[ADR 0006](0006-the-mention-query-is-derived-state.md) forcing the query to be derived, which
forced `subscribe` to fire on selection changes too, which is the thing that makes a
React-derived menu correct. A design constraint adopted for its own reasons paid out in a
layer that did not exist yet.

`dev/react-demo.tsx` and `dev/mention-flow.ts` are the same shape — subscribe, derive the
query, handle the keys yourself, dispatch a transaction to insert — because the engine's
contract never assumed either. That correspondence is the actual proof, and it is why M2.5
built the dropdown in `dev/` and called it "a rehearsal for the M7 adapters".

## There is no vanilla adapter, and there should not be

The plan lists four: `react/ vue/ svelte/ vanilla/`. Only three are real.

`createEditor({ element })` **is** the vanilla adapter. It takes an element, returns an object
with `dispatch`/`subscribe`/`destroy`, and imports no framework. A `adapters/vanilla/` module
could only re-export it under a second name, and the plan's own non-goals say to cap this
kind of thing ruthlessly. `dev/mention-flow.ts` is what a vanilla *consumer* looks like, and
it lives in the harness because it is a consumer, not a layer.

## Alternatives considered

**A `<Mentis onChange={...} />` component**, matching `mentis@0.2.x`'s API so v1 users could
move across. Rejected: parity is an explicit non-goal, and an `onChange` that serialises the
document to a string on every keystroke is v1's model — the thing this engine exists not to
be. A consumer wanting that can write it in four lines on top of `state`.

**Adapter-owned dropdown components**, one per framework, so mentions work out of the box.
Rejected — that is three UI libraries to maintain, and it puts keyboard and accessibility
policy in the wrong place. `packages/mentis` can own an opinionated React component later,
built on the adapter; the adapter itself should not.

**`useState` + `useEffect` mirroring the model into React state.** Rejected: it tears under
concurrent rendering, it double-renders every keystroke, and it is a cache with an
invalidation problem in place of a function — the same mistake ADR 0006 already refused once.

**Publishing adapters as separate packages** (`@mentis/react`, …). Deferred rather than
rejected. The engine is `private: true` and nothing here is published; splitting packages is
a distribution decision to make when there is something to distribute, and doing it now would
add four build configs to a package that has no build step at all.

## Consequences

Good:

- The layering claim is now checkable by a test rather than asserted by a document, and the
  test fails informatively — it names the file and the specifier.
- The React adapter is small enough to read in one sitting, which was the plan's own success
  criterion for M7.
- `useSyncExternalStore` means the adapter is correct under concurrent rendering and React 19
  by construction, not by testing.
- The engine gained a second consumer shape, which is the only real check that "headless"
  meant anything.

Costs and risks:

- **`src/adapters/react/` reads the engine's internals directly** (`../../editor/...`) rather
  than going through `src/index.ts`. Convenient now, and it means the public surface is not
  the thing the adapter proves. If the engine is ever published, the adapter should import
  what a consumer would.
- The engine package now has React in `devDependencies` and `jsx` in its tsconfig. Both are
  contained, and the layering test is what stops that containment eroding.
- **Vue and Svelte are not done.** The pattern is established and the plan's "~100 lines
  each" looks right, but claiming the layering holds for three frameworks on the evidence of
  one would be exactly the overreach this ADR is about.
- `useMentis` reads `editorRef.current` during render, paired with a state bump so the value
  is consistent for the render that matters. Deliberate — the alternative is a null editor
  for one extra frame — but it is the sort of thing React's rules discourage and a future
  React may complain about.

## Unverified

- **No Vue or Svelte adapter exists yet**, so "the layering worked" currently rests on one
  framework plus a plain-DOM consumer.
- **Concurrent features are untested.** `useSyncExternalStore` is the right primitive for
  Suspense and transitions, but nothing here renders the editor inside either.
- **Server rendering is not considered.** The engine needs a real element and `document`;
  what an adapter should do during SSR — render an empty div and attach on hydration, most
  likely — has not been designed or tested.

## Revisit when

- The Vue or Svelte adapter needs something from `src/` that React did not, which would mean
  the engine's contract is React-shaped rather than framework-neutral and this ADR's central
  claim is weaker than stated, **or**
- the engine is published, at which point the adapter should import through the public entry
  point and the package split becomes a real question, **or**
- SSR comes into scope.
