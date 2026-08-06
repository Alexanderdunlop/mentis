/**
 * Native browser editing: undo/redo, select-all, and the caret behaviour the
 * browser owns rather than the library.
 *
 * This file has no counterpart in packages/docs/content/docs — that is itself
 * worth noting. A contentEditable library lives or dies on how it cooperates
 * with native editing, and none of it is currently documented, so there is no
 * stated contract to mirror. These specs record what the browser actually does
 * today so a change to it is visible.
 */
import { test, expect } from "../fixtures/harness";

test("native undo reverts typed text", async ({ harness, browserName }) => {
  test.skip(
    browserName === "webkit",
    "webkit does not expose an undo stack for contenteditable through CDP"
  );

  const input = harness.case("default");

  await input.typeText("hello");
  await input.expectModelState({ text: "hello" });

  await input.undo();

  // The browser groups a typing burst into one undo step.
  await expect.poll(() => input.getText()).not.toBe("hello");
});

test("select-all then delete empties the editor and restores the placeholder", async ({
  harness,
}) => {
  const input = harness.case("placeholder");

  await input.pressKeys("@al{Enter}");
  await input.typeText("and more");
  await expect(input.chips).toHaveCount(1);

  await input.selectAll();
  await input.pressKeys("{Backspace}");

  // The DOM ends up genuinely empty, which is what the placeholder needs. The
  // reported value does not — see the fixme in onchange.spec.ts.
  await input.expectModelState({ text: "" });
  await expect(input.chips).toHaveCount(0);
  await expect
    .poll(() => input.editor.evaluate((el) => el.matches(":empty")))
    .toBe(true);
});

// Bug: chips are inserted with contentEditable="true", so a caret placed
// immediately before a chip is a valid editing position *inside* it. Chromium
// puts the typed character at the chip's start; `processInput` then sees the
// caret inside a chip and deletes the whole chip — taking the just-typed
// character with it. Typing in front of a mention silently destroys it: "Alice "
// plus an "x" becomes " ".
test.fixme(
  "typing immediately before a chip inserts text without destroying it",
  async ({ harness }) => {
    const input = harness.case("no-trigger");

    await input.pressKeys("@al{Enter}");
    await input.setCaretBeforeChip(0);
    await input.typeText("x");

    await input.expectModelState({
      text: "xAlice ",
      dataValue: "xalice ",
      caret: 1,
    });
    await expect(input.chips).toHaveCount(1);
  }
);

// Bug: `insertMentionIntoDOM` mutates the DOM directly — createElement,
// replaceChild — which the browser's undo stack knows nothing about. So Ctrl/Cmd+Z
// after inserting a chip is a no-op: the text the user typed ("@al") is gone and
// unrecoverable, and the chip cannot be undone either. `insertNewlineAtCaret` has
// a comment explaining that execCommand is kept precisely because it "leaves the
// undo stack intact"; chip insertion does not extend the same courtesy.
test.fixme(
  "native undo reverts a chip insertion",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.pressKeys("@al{Enter}");
    await expect(input.chips).toHaveCount(1);

    await input.undo();

    await expect(input.chips).toHaveCount(0);
    await input.expectModelState({ text: "@al" });
  }
);
