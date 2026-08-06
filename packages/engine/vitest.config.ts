import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // The engine's logic layers are pure and must stay testable with no DOM at
        // all. If something here starts needing a DOM, that's a design signal.
        test: {
          name: "logic",
          environment: "node",
          include: ["src/**/tests/*.test.ts"],
          exclude: ["src/**/tests/*.dom.test.ts"],
        },
      },
      {
        // happy-dom is trusted for "does this throw" and coarse structure ONLY.
        // Caret semantics, native editing, composition and clipboard are all
        // approximations here — those belong in Playwright. The repo's e2e layer
        // states the same boundary from the other side; see e2e/CLAUDE.md.
        test: {
          name: "dom-smoke",
          environment: "happy-dom",
          include: ["src/**/tests/*.dom.test.ts"],
        },
      },
    ],
  },
});
