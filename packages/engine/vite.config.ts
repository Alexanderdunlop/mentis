import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * The dev server for both harness pages *and* the M7 React demo at `/react.html`.
 *
 * The React plugin is here for that one page. It changes nothing about the engine: `src/`
 * has no framework imports outside `src/adapters/`, which `src/tests/layering.test.ts`
 * enforces rather than trusts.
 */
export default defineConfig({
  root: "./dev",
  plugins: [react()],
  server: { port: 5180 },
});
