import { defineConfig, devices } from "@playwright/test";

/**
 * The engine's own browser matrix.
 *
 * **Deliberately a separate config from the one at the repo root**, rather than four more
 * projects bolted onto it. `CLAUDE.md` says CI does not run this package on purpose, so
 * that a `private: true` experiment can never block a mentis bug fix or release — and
 * adding engine projects to the root config would hand this experiment exactly that power
 * over `pnpm test:e2e` and the E2E workflow.
 *
 * What *is* reused is the shape: the same four projects, the same reporters, the same
 * port-of-its-own convention, the same conventions in `e2e/CLAUDE.md`. That is what
 * docs/plan.md asked for — "reuse its harness shape and its browser-matrix CI rather than
 * inventing a second one" — and reusing the shape is not the same as sharing the run.
 */

/**
 * Not 5180. The inspector commonly runs there during development, and a suite that
 * attached to it would be asserting against a scratchpad. Same reasoning as v1's 5273.
 */
const PORT = 5280;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./spec",
  testMatch: /.*\.spec\.ts/,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },

  expect: { timeout: 5_000 },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    {
      // Mobile keyboards and touch carets are where contentEditable engines die, and
      // M6's remaining work is largely there, so this is not optional.
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "pnpm --filter @mentis/engine dev:e2e",
    url: `${BASE_URL}/e2e.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
