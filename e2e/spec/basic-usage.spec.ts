/**
 * Mirrors docs/content/docs/basic-usage.mdx.
 *
 * The documented shape is: pass `options`, hold `dataValue` in state, and feed
 * it back from `onChange`. These specs check that loop closes.
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

test("selecting an option replaces the trigger and query with a chip", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("hi @al");
  await input.expectOptionLabels(["Alice"]);
  await input.pressKeys("{Enter}");

  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveText("@Alice");

  // displayValue carries the label, dataValue carries the value — the
  // distinction the whole library exists for.
  await input.expectModelState({
    text: "hi @Alice ",
    displayValue: "hi @Alice ",
    dataValue: "hi alice ",
  });
  await expect(input.modal).toBeHidden();
});

test("the documented controlled loop round-trips a mention", async ({
  harness,
}) => {
  const input = harness.case("controlled");

  await input.pressKeys("@al{Enter}");

  // onChange emitted a dataValue, the harness fed it back in as the prop, and
  // the component did not fight itself over the result.
  await expect
    .poll(() => input.getControlledDataValue())
    .toBe("alice ");
  await input.expectModelState({ text: "@Alice ", dataValue: "alice " });

  await input.typeText("hello");

  await input.expectModelState({
    text: "@Alice hello",
    dataValue: "alice hello",
  });
  await expect(input.chips).toHaveCount(1);
});
