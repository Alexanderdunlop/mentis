/**
 * Mirrors docs/content/docs/options.mdx.
 *
 * Covers filtering, the duplicate-label case, and function values.
 */
import { test, expect } from "../fixtures/harness";

test("the option list filters by label as the query grows", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@a");
  // Substring match, not prefix: "Charlie" and "Dave" both contain an "a".
  await input.expectOptionLabels(["Alice", "Charlie", "Dave"]);

  await input.typeText("l");
  await input.expectOptionLabels(["Alice"]);
});

test("filtering is case-insensitive", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@BO");

  await input.expectOptionLabels(["Bob"]);
});

test("a query matching nothing shows the no-options message", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@zz");

  await expect(input.modal).toBeVisible();
  await expect(input.options).toHaveCount(0);
  await expect(input.noOptions).toHaveText("No items found");
});

test("a space after the trigger closes the modal", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@al");
  await expect(input.modal).toBeVisible();

  await input.typeText(" ");

  await expect(input.modal).toBeHidden();
});

test("two options sharing a label stay distinguishable by value", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@er");
  await input.expectOptionLabels(["Erin", "Erin"]);

  // Same label, different identity — the ids come from the value.
  await expect(input.options.nth(0)).toHaveAttribute(
    "id",
    "mention-option-erin-primary"
  );
  await expect(input.options.nth(1)).toHaveAttribute(
    "id",
    "mention-option-erin-backup"
  );

  // Selecting the second one must yield the second one's value, not the first
  // label match.
  await input.pressKeys("{ArrowDown}{Enter}");

  await input.expectModelState({
    text: "@Erin ",
    displayValue: "@Erin ",
    dataValue: "erin-backup ",
  });
});

test("an option with a function value runs the function instead of inserting a chip", async ({
  harness,
}) => {
  const input = harness.case("function-value");
  const calls = input.page.getByTestId("function-value-calls");

  await input.typeText("go @se");
  await input.expectOptionLabels(["Send"]);
  await input.pressKeys("{Enter}");

  await expect(calls).toHaveText('["Send"]');
  await expect(input.chips).toHaveCount(0);

  // The trigger and the query text are removed, and the caret is left where
  // they were.
  await input.expectModelState({ text: "go ", caret: 3 });
  await expect(input.modal).toBeHidden();
});

// Bug: `reconstructFromDataValue` finds option values by plain substring search
// and keeps the first match, so "user10" matches the option whose value is
// "user1" and the leftover "0" is rendered as text. Seeding dataValue "user10"
// produces an "Ann" chip followed by "0" instead of one "Anna" chip.
test.fixme(
  "values where one is a prefix of another reconstruct to the right chip",
  async ({ harness }) => {
    const input = harness.case("prefix-values");

    await input.page.getByTestId("prefix-values-seed").click();

    await expect(input.chips).toHaveCount(1);
    await expect(input.chips.first()).toHaveAttribute("data-value", "user10");
    await input.expectModelState({ text: "@Anna" });
  }
);
