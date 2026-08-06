/**
 * Mirrors docs/content/docs/keyboard-navigation.mdx.
 *
 * The documented contract: Up/Down move the highlight, Enter or Tab select,
 * Escape closes, and `onKeyDown` is not called for those keys while the modal is
 * open.
 */
import { test, expect } from "../fixtures/harness";

test("ArrowDown moves the highlight down the list", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await expect(input.highlightedOption).toHaveText("Alice");

  await input.pressKeys("{ArrowDown}");
  await expect(input.highlightedOption).toHaveText("Charlie");

  await input.pressKeys("{ArrowDown}");
  await expect(input.highlightedOption).toHaveText("Dave");
});

test("ArrowDown wraps from the last option to the first", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await input.pressKeys("{ArrowDown*2}");
  await expect(input.highlightedOption).toHaveText("Dave");

  await input.pressKeys("{ArrowDown}");

  await expect(input.highlightedOption).toHaveText("Alice");
});

test("ArrowUp wraps from the first option to the last", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await expect(input.highlightedOption).toHaveText("Alice");

  await input.pressKeys("{ArrowUp}");

  await expect(input.highlightedOption).toHaveText("Dave");
});

test("the highlight resets to the first option as the query changes", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await input.pressKeys("{ArrowDown}");
  await expect(input.highlightedOption).toHaveText("Charlie");

  await input.typeText("l");

  await input.expectOptionLabels(["Alice"]);
  await expect(input.highlightedOption).toHaveText("Alice");
});

test("Enter selects the highlighted option", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await input.pressKeys("{ArrowDown}{Enter}");

  await input.expectModelState({ text: "@Charlie ", dataValue: "charlie " });
  await expect(input.modal).toBeHidden();
});

test("Tab selects the highlighted option", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@bo");
  await input.pressKeys("{Tab}");

  await input.expectModelState({ text: "@Bob ", dataValue: "bob " });
  await expect(input.modal).toBeHidden();
  // Tab must not have moved focus out of the editor.
  expect(await input.isFocused()).toBe(true);
});

test("Escape closes the modal without selecting", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@al");
  await expect(input.modal).toBeVisible();

  await input.pressKeys("{Escape}");

  await expect(input.modal).toBeHidden();
  await expect(input.chips).toHaveCount(0);
  await input.expectModelState({ text: "@al" });
});

test("clicking outside the editor closes the modal", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@al");
  await expect(input.modal).toBeVisible();

  await input.outside.click();

  await expect(input.modal).toBeHidden();
  await input.expectModelState({ text: "@al" });
});

test("Enter inserts a newline when the modal is closed", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("a");
  await input.pressKeys("{Enter}");
  await input.typeText("b");

  // Two lines, and the second character landed on the second one. The caret is
  // asserted as "at the end" rather than at an offset because browsers disagree
  // on whether a newline occupies a character in textContent — see
  // expectCaretAtEnd().
  await input.expectModelState({ displayValue: "a\nb" });
  await input.expectCaretAtEnd();
});

test("Shift+Enter inserts a newline like Enter does", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("a");
  await input.pressKeys("{Shift+Enter}");
  await input.typeText("b");

  // The component does not distinguish the two: Enter is intercepted before the
  // modifier is ever consulted.
  await input.expectModelState({ displayValue: "a\nb" });
  await input.expectCaretAtEnd();
});

test("onKeyDown receives ordinary keys but not the modal's navigation keys", async ({
  harness,
}) => {
  const input = harness.case("custom-keydown");
  const seen = input.page.getByTestId("custom-keydown-keys");

  await input.typeText("x");
  await expect(seen).toHaveText('["x"]');

  await input.typeText("@");
  await expect(input.modal).toBeVisible();
  await input.pressKeys("{ArrowDown}{Escape}");

  // "@" is an ordinary key and reaches the handler; ArrowDown and Escape are
  // consumed by the modal, as documented in props.mdx.
  await expect(seen).toHaveText('["x","@"]');
});

// Bug: props.mdx documents a form-submission pattern where Enter reaches
// `onKeyDown` once the modal is closed ("When the modal is closed, Enter will
// trigger the form submission"). It never does — `handleKeyDown` intercepts
// Enter, inserts a newline and returns before calling `onKeyDown`, so the
// documented pattern cannot be implemented.
test.fixme(
  "onKeyDown receives Enter when the modal is closed",
  async ({ harness }) => {
    const input = harness.case("custom-keydown");
    const seen = input.page.getByTestId("custom-keydown-keys");

    await input.typeText("x");
    await input.pressKeys("{Enter}");

    await expect(seen).toHaveText('["x","Enter"]');
  }
);

// Bug: `handleKeyboardNavigation` returns false when `filteredOptions` is empty,
// so the Escape branch is never reached and the modal stays open showing "No
// items found". keyboard-navigation.mdx promises Escape closes the modal, with
// no exception for an empty list.
test.fixme(
  "Escape closes the modal when no options match",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.typeText("@zz");
    await expect(input.noOptions).toBeVisible();

    await input.pressKeys("{Escape}");

    await expect(input.modal).toBeHidden();
  }
);

// Bug: Escape closes the modal, but the next keystroke re-runs trigger detection
// against the text still in the editor, so the modal reopens without the user
// typing a new trigger. Dismissal does not stick.
test.fixme(
  "the modal stays closed after Escape until a new trigger is typed",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.typeText("@a");
    await input.pressKeys("{Escape}");
    await expect(input.modal).toBeHidden();

    await input.typeText("l");

    await expect(input.modal).toBeHidden();
  }
);
