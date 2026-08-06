/**
 * Mirrors docs/content/docs/styling.mdx — the slotsProps className contract.
 *
 * Worth having at this layer rather than in happy-dom: these assertions read
 * *computed* style, so they catch a class that is applied but has no effect
 * because the rule it needed was replaced rather than extended.
 */
import { test, expect } from "../fixtures/harness";

test("the default classes are applied out of the box", async ({ harness }) => {
  const input = harness.case("default");

  await expect(
    input.section.locator(".mention-input-container")
  ).toHaveCount(1);
  await expect(input.editor).toHaveClass("content-editable-input");

  await input.typeText("@al");

  await expect(input.modal).toHaveClass("mention-modal");
  await expect(input.options.first()).toHaveClass(
    "mention-option mention-option-highlighted"
  );

  await input.pressKeys("{Enter}");
  await expect(input.chips.first()).toHaveClass("mention-chip");
});

test("contentEditable, modal and chip classNames extend the defaults", async ({
  harness,
}) => {
  const input = harness.case("styled");

  await expect(input.editor).toHaveClass("content-editable-input harness-input");

  await input.typeText("@al");
  await expect(input.modal).toHaveClass("mention-modal harness-modal");

  await input.pressKeys("{Enter}");
  await expect(input.chips.first()).toHaveClass("mention-chip harness-chip");

  // And the custom rule actually wins.
  await expect(input.chips.first()).toHaveCSS(
    "background-color",
    "rgb(0, 128, 0)"
  );
});

test("highlightedClassName replaces the default highlight class", async ({
  harness,
}) => {
  const input = harness.case("styled");

  await input.typeText("@a");

  await expect(input.options.first()).toHaveClass(
    "harness-option harness-option-highlighted"
  );
  await expect(input.options.first()).toHaveCSS(
    "background-color",
    "rgb(255, 0, 0)"
  );
  await expect(input.options.nth(1)).toHaveClass("harness-option");
});

test("the no-options element takes its custom className", async ({
  harness,
}) => {
  const input = harness.case("styled");

  await input.typeText("@zz");

  await expect(input.noOptions).toHaveClass("harness-no-options");
  await expect(input.noOptions).toHaveText("No items found");
});

// Bug: `container` and `option` classNames *replace* the built-in class rather
// than extending it, while `contentEditable`, `modal` and `chipClassName` extend
// theirs. For the container that is a functional break, not just a cosmetic one:
// the default class supplies `position: relative`, which is the containing block
// the absolutely-positioned modal is placed against, so styling the container
// detaches the dropdown from the input. styling.mdx documents all the slots the
// same way and warns about neither.
test.fixme(
  "slot classNames extend the defaults consistently",
  async ({ harness }) => {
    const input = harness.case("styled");

    await expect(
      input.section.locator(".mention-input-container")
    ).toHaveClass("mention-input-container harness-container");

    await input.typeText("@a");
    await expect(input.options.first()).toHaveClass(
      /mention-option(?=.*harness-option)/
    );
  }
);
