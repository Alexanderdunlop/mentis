/**
 * Mirrors docs/content/docs/onchange.mdx — the MentionData payload.
 */
import { test, expect } from "../fixtures/harness";

test("displayValue carries labels while dataValue carries values", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.pressKeys("hey @al{Enter}");

  await input.expectModelState({
    displayValue: "hey @Alice ",
    dataValue: "hey alice ",
  });
});

test("each mention reports its label, value and position in displayValue", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.pressKeys("hi @al{Enter}");

  await expect
    .poll(() => input.getMentions())
    .toEqual([
      { label: "Alice", value: "alice", startIndex: 3, endIndex: 9 },
    ]);

  // The indices are offsets into displayValue, so "@Alice" spans 3..9.
  const payload = await input.getOnChangePayload();
  expect(payload!.displayValue.slice(3, 9)).toBe("@Alice");
});

test("several mentions are reported in document order", async ({ harness }) => {
  const input = harness.case("default");

  await input.pressKeys("@al{Enter}");
  await input.pressKeys("@bo{Enter}");

  await input.expectModelState({
    displayValue: "@Alice @Bob ",
    dataValue: "alice bob ",
  });
  await expect
    .poll(() => input.getMentions())
    .toEqual([
      { label: "Alice", value: "alice", startIndex: 0, endIndex: 6 },
      { label: "Bob", value: "bob", startIndex: 7, endIndex: 11 },
    ]);
});

test("onChange fires for every edit, including back to empty", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("ab");
  const afterTyping = await input.getChangeCount();
  expect(afterTyping).toBeGreaterThanOrEqual(2);

  await input.pressKeys("{Backspace*2}");

  await expect.poll(() => input.getChangeCount()).toBeGreaterThan(afterTyping);
  await input.expectModelState({ text: "" });
  expect(await input.getMentions()).toEqual([]);
});

// Bug: deleting the last character leaves the browser's own filler <br> in the
// editor. `extractMentionData` counts it as a newline *before* stripping it, so
// the payload for a now-empty editor reads "\n" while the editor's textContent
// reads "". A consumer storing that value has "\n" where the user sees nothing,
// and in controlled mode feeds it straight back in.
test.fixme("emptying the editor reports an empty value", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("ab");
  await input.pressKeys("{Backspace*2}");

  await input.expectModelState({ text: "", displayValue: "", dataValue: "" });
});

test("a mention removed by editing disappears from the payload", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.pressKeys("@al{Enter}");
  await expect.poll(() => input.getMentions()).toHaveLength(1);

  await input.setCaretAfterChip(0);
  await input.pressKeys("{Backspace}");

  await expect.poll(() => input.getMentions()).toHaveLength(0);
  await input.expectModelState({ dataValue: " " });
});

// Bug: one Enter with nothing typed after it leaves a trailing empty block, and
// `extractMentionData` counts both the block boundary and the <br> inside it, so
// a single newline is reported as "\n\n". The editor's own textContent still
// reads "a" — the model and the DOM disagree about how much content exists.
test.fixme(
  "one Enter reports exactly one newline",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.typeText("a");
    await input.pressKeys("{Enter}");

    await input.expectModelState({ displayValue: "a\n", dataValue: "a\n" });
  }
);

// Bug: `convertTextToChips` runs on a setTimeout after the input event and never
// calls onChange, so the conversion is invisible to the consumer. The DOM has a
// chip; the last payload still says the text is "@Alice " with no mentions.
test.fixme(
  "autoConvertMentions reports the converted chip through onChange",
  async ({ harness }) => {
    const input = harness.case("auto-convert");

    await input.typeText("@Alice ");
    await expect(input.chips).toHaveCount(1);

    await expect.poll(() => input.getMentions()).toHaveLength(1);
    await input.expectModelState({ dataValue: "alice " });
  }
);
