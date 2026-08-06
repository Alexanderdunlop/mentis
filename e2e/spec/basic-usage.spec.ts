/**
 * Mirrors docs/content/docs/basic-usage.mdx.
 *
 * The documented shape is: give it `options`, a controlled `dataValue`, and an
 * `onChange` that feeds `dataValue` back in. These specs check that loop closes.
 */
import { test, expect, OPTION_LABELS } from "../fixtures/harness";

test("typing the trigger opens the modal listing every option", async ({
  harness,
}) => {
  const input = harness.case("default");

  await expect(input.modal).toBeHidden();
  await input.typeText("@");

  await input.expectOptionLabels(OPTION_LABELS);
});

test("plain text is reported through onChange without any mentions", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("hi there");

  await input.expectModelState({
    text: "hi there",
    displayValue: "hi there",
    dataValue: "hi there",
    caret: 8,
  });
  expect(await input.getMentions()).toEqual([]);
});
