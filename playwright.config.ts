import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the e2e layer. See e2e/README.md for what this layer
 * owns and what belongs in vitest instead.
 *
 * `pnpm test` (vitest, in packages/mentis) and `pnpm test:e2e` (this) are kept
 * deliberately separate — they are different layers with different guarantees,
 * and conflating them is how the fake DOM ended up dictating production code.
 */

/**
 * A port of its own, not vite's default 5173: the demo playground commonly runs
 * there during development, and the suite must never accidentally attach to it
 * and assert against the demo page.
 */
const PORT = 5273;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Both spec/ and regressions/ live under testDir; nothing else there is a test.
  testMatch: /.*\.spec\.ts/,

  // The suite drives a contentEditable through real key events. Nothing here is
  // allowed to depend on test order or on a shared server-side state.
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

  expect: {
    timeout: 5_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      // Mobile keyboards and touch carets are where contentEditable libraries
      // die, so the mobile project is not optional.
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "pnpm --filter mentis playground:e2e",
    url: `${BASE_URL}/e2e.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
