/**
 * `@mentis/engine` React adapter.
 *
 * A separate entry point from the engine's own `src/index.ts` on purpose: importing the
 * engine must never pull React in, which is why `react` is an *optional* peer dependency.
 * `src/tests/layering.test.ts` enforces the other direction — that nothing below
 * `adapters/` imports a framework.
 *
 * Deliberately **not** exported here: a `<Mentis />` component. The engine owns its
 * element's children, so a component taking children would be an invitation to the one
 * mistake that matters (see `use-mentis.ts`). Two hooks and a ref is the whole surface.
 */

export { useMentis } from "./use-mentis";
export type { UseMentisOptions, UseMentisResult } from "./use-mentis";

export { useMentionQuery } from "./use-mention-query";
export type { UseMentionQueryResult } from "./use-mention-query";
