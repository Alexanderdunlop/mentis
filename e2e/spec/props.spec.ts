/**
 * Mirrors docs/content/docs/props.mdx — `trigger`, `keepTriggerOnSelect`,
 * `autoConvertMentions`, `displayValue`/`dataValue`, and the placeholder.
 */
import { test, expect, OPTION_LABELS } from "../fixtures/harness";

test("a custom single-character trigger opens the modal", async ({
  harness,
}) => {
  const input = harness.case("custom-trigger");

  await input.typeText("#");
  await input.expectOptionLabels(OPTION_LABELS);

  await input.pressKeys("bo{Enter}");

  await input.expectModelState({ text: "#Bob ", dataValue: "bob " });
});

test("the default trigger does nothing when a custom one is set", async ({
  harness,
}) => {
  const input = harness.case("custom-trigger");

  await input.typeText("@al");

  await expect(input.modal).toBeHidden();
  await input.expectModelState({ text: "@al" });
});

test("keepTriggerOnSelect={false} drops the trigger from the chip text", async ({
  harness,
}) => {
  const input = harness.case("no-trigger");

  await input.pressKeys("@bo{Enter}");

  await expect(input.chips.first()).toHaveText("Bob");
  await input.expectModelState({
    text: "Bob ",
    displayValue: "Bob ",
    dataValue: "bob ",
  });
});

test("autoConvertMentions turns typed text into a chip on space", async ({
  harness,
}) => {
  const input = harness.case("auto-convert");

  await input.typeText("@Alice ");

  // The conversion itself works; what it writes into data-value does not — see
  // the fixme in chips.spec.ts.
  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveText("Alice");
});

test("the custom placeholder shows while the editor is empty", async ({
  harness,
}) => {
  const input = harness.case("placeholder");

  await expect(input.editor).toHaveAttribute(
    "data-placeholder",
    "Say something..."
  );
  // The placeholder is CSS, rendered from data-placeholder via :empty::before,
  // so "is it showing" is really "is the editor empty".
  expect(await input.editor.evaluate((el) => el.matches(":empty"))).toBe(true);

  await input.typeText("x");

  expect(await input.editor.evaluate((el) => el.matches(":empty"))).toBe(false);
});

test("the placeholder returns after a controlled dataValue is cleared", async ({
  harness,
}) => {
  const input = harness.case("controlled");

  await input.pressKeys("@al{Enter}");
  await input.typeText("hello");
  await expect(input.chips).toHaveCount(1);

  await input.page.getByTestId("controlled-clear").click();

  // The chip and every stray node must go, or :empty never matches and the
  // placeholder stays hidden — the failure afdf240 was chasing.
  await expect(input.chips).toHaveCount(0);
  await input.expectModelState({ text: "" });
  await expect
    .poll(() => input.editor.evaluate((el) => el.matches(":empty")))
    .toBe(true);
});

test("a controlled dataValue reconstructs chips from values", async ({
  harness,
}) => {
  const input = harness.case("controlled");

  await input.page.getByTestId("controlled-seed").click();

  await input.expectModelState({ text: "hi @Erin" });
  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveAttribute(
    "data-value",
    "erin-primary"
  );
  await expect(input.chips.first()).toHaveText("@Erin");
});

// Bug: `detectMentionTrigger` finds the trigger with `lastIndexOf` but then
// slices the query with `lastTriggerIndex + 1`, hard-coding a one-character
// trigger. With trigger "::" the query keeps the second colon, so nothing ever
// matches and the modal only ever shows "No items found". props.mdx explicitly
// documents multi-character triggers ("or even a multi-character string (e.g.
// `::`)").
test.fixme("a multi-character trigger matches options", async ({ harness }) => {
  const input = harness.case("multi-char-trigger");

  await input.typeText("::al");

  await input.expectOptionLabels(["Alice"]);
  await input.pressKeys("{Enter}");
  await input.expectModelState({ text: "::Alice ", dataValue: "alice " });
});

// Bug: in controlled `displayValue` mode the reconciliation effect compares the
// editor's raw textContent against the prop. Once the content holds a newline the
// two can never agree — the DOM says "Zabcd", the model says "Z\nabcd" — so the
// effect rewrites textContent on every change. That destroys the text nodes and
// the caret collapses to offset 0, meaning the next character typed lands at the
// *start* of the input.
test.fixme(
  "controlled displayValue keeps the caret across a newline",
  async ({ harness }) => {
    const input = harness.case("display-value");

    await input.typeText("ab");
    await input.pressKeys("{Enter}");
    await input.typeText("c");

    await input.expectModelState({ displayValue: "ab\nc", caret: 3 });
  }
);
