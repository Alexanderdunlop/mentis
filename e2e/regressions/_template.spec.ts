/**
 * Symptom: <one line, in user terms — what the person saw, not the cause>
 * Fixed by: <commit sha, PR or issue link>
 * Date: <YYYY-MM-DD>
 *
 * Copy this file to `<short-kebab-slug>.spec.ts` and delete this paragraph.
 * One bug per file, one test per file. Reproduce it the way the user hit it:
 * key presses, clicks and pastes only — no imports from packages/mentis/src, no
 * reaching into hooks, no calling internals. If the bug cannot be reproduced
 * that way, it probably belongs in a unit or component test instead; see the
 * "add an e2e test to prevent this in future" section of e2e/README.md.
 */
import { test, expect } from "../fixtures/harness";

test("the thing that broke does not break again", async ({ harness }) => {
  const input = harness.case("default");

  // Arrange: get the editor into the state the bug needed.
  await input.typeText("hi @al");

  // Act: the single user action that used to go wrong.
  await input.pressKeys("{Enter}");

  // Assert: state *and* caret. A regression that leaves the right text with the
  // caret in the wrong place is still a regression, and the caret is the reason
  // this layer exists.
  await input.expectModelState({
    text: "hi @Alice ",
    dataValue: "hi alice ",
    caret: 10,
  });
  await expect(input.chips).toHaveCount(1);
});
