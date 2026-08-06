/**
 * Mirrors docs/content/docs/chips.mdx — the chip contract, the three documented
 * ways a chip gets created (selection, auto-conversion, paste), and chip
 * deletion.
 */
import { test, expect } from "../fixtures/harness";

test("a chip carries the documented data attributes", async ({ harness }) => {
  const input = harness.case("default");

  await input.pressKeys("@al{Enter}");

  const chip = input.chips.first();
  await expect(chip).toHaveAttribute("data-value", "alice");
  await expect(chip).toHaveAttribute("data-label", "Alice");
  await expect(chip).toHaveClass(/mention-chip/);
  await expect(chip).toHaveText("@Alice");
});

test("the caret lands after the chip and its inserted space", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("hi @al");
  await input.pressKeys("{Enter}");

  // "hi @Alice " is 10 characters; the caret belongs at the end of it, ready for
  // the next word. This is the assertion the happy-dom layer cannot make, and
  // it is fragile by construction: handleSelect sets the range and *then*
  // refocuses on a setTimeout.
  await input.expectModelState({ text: "hi @Alice ", caret: 10 });
  expect(await input.isCaretCollapsed()).toBe(true);
  expect(await input.isFocused()).toBe(true);
});

test("a chip inserted mid-sentence keeps the text after it", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("hi  there");
  await input.setCaretOffset(3);
  await input.typeText("@al");
  await input.pressKeys("{Enter}");

  await input.expectModelState({
    text: "hi @Alice there",
    dataValue: "hi alice there",
  });
});

test("Backspace at the chip boundary removes the whole chip", async ({
  harness,
}) => {
  const input = harness.case("no-trigger");

  await input.pressKeys("@al{Enter}");
  await input.expectModelState({ text: "Alice " });

  await input.setCaretAfterChip(0);
  await input.pressKeys("{Backspace}");

  // The whole chip goes, not the last character of its label.
  await expect(input.chips).toHaveCount(0);
  await input.expectModelState({ text: " ", dataValue: " " });
});

test("typing inside a chip deletes the whole chip", async ({ harness }) => {
  const input = harness.case("default");

  await input.pressKeys("@al{Enter}");
  // Land inside the chip's own text node, between "@Al" and "ice".
  await input.setCaretOffset(3);
  await input.typeText("X");

  // docs/chips.mdx describes this as "the chip is deleted, X is not inserted",
  // which is what happens — the typed character is inside the chip when the
  // chip is removed, so it goes with it. (The worked example in that page,
  // 'Result: "@John DoeX"', contradicts its own prose.)
  await expect(input.chips).toHaveCount(0);
  await input.expectModelState({ text: " ", dataValue: " " });
});

test("keepTriggerOnSelect={false} leaves the trigger out of the chip", async ({
  harness,
}) => {
  const input = harness.case("no-trigger");

  await input.pressKeys("@al{Enter}");

  await expect(input.chips.first()).toHaveText("Alice");
  await input.expectModelState({ text: "Alice ", dataValue: "alice " });
});

test("chips reconstructed from dataValue are not editable", async ({
  harness,
}) => {
  const input = harness.case("controlled");

  await input.page.getByTestId("controlled-seed").click();

  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveAttribute("contenteditable", "false");
  await expect(input.chips.first()).toHaveAttribute(
    "data-value",
    "erin-primary"
  );
  await input.expectModelState({ text: "hi @Erin" });
});

// Bug: docs/chips.mdx states chips are `contenteditable="false"` to protect them
// from editing, and `reconstructFromDataValue` does emit that. But
// `insertMentionIntoDOM` sets contentEditable = "true", so a chip created by
// selecting from the dropdown is editable while an identical chip restored from
// dataValue is not.
test.fixme(
  "a chip inserted from the dropdown is not editable either",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.pressKeys("@al{Enter}");

    await expect(input.chips.first()).toHaveAttribute(
      "contenteditable",
      "false"
    );
  }
);

// Bug: `convertTextToChips` builds the chip from the matched text rather than
// from the option, so data-value holds the label ("Alice") instead of the
// option's value ("alice"). The chip looks right and the data is wrong.
test.fixme(
  "autoConvertMentions stores the option value on the chip",
  async ({ harness }) => {
    const input = harness.case("auto-convert");

    await input.typeText("@Alice ");

    await expect(input.chips).toHaveCount(1);
    await expect(input.chips.first()).toHaveAttribute("data-value", "alice");
    await input.expectModelState({ dataValue: "alice " });
  }
);

// --- paste (docs/chips.mdx "3. Paste Operations") -------------------------

/*
 * Three paste paths, deliberately:
 *
 *   pasteText / pasteHTML   dispatch a ClipboardEvent carrying a DataTransfer
 *   pasteByCopying          a genuine copy from the harness, then a genuine paste
 *   pasteFromSystemClipboard  navigator.clipboard.writeText, then a genuine paste
 *
 * Firefox ignores `clipboardData` passed to the ClipboardEvent constructor, so
 * `event.clipboardData` arrives null there and the synthetic path cannot run at
 * all. That is a limitation of the test path, not of the library — so the
 * synthetic specs skip on Firefox and `pasteByCopying` carries the cross-browser
 * coverage.
 */
const SYNTHETIC_PASTE_UNSUPPORTED =
  "firefox drops clipboardData from a constructed ClipboardEvent";

test("pasting text whose mention starts at offset 0 creates a chip", async ({
  harness,
  browserName,
}) => {
  test.skip(browserName === "firefox", SYNTHETIC_PASTE_UNSUPPORTED);

  const input = harness.case("custom-trigger");

  await input.pasteText("#Bob trailing");

  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveAttribute("data-value", "bob");
  await input.expectModelState({
    text: "#Bob trailing",
    displayValue: "#Bob trailing",
    dataValue: "bob trailing",
  });
});

// Bug, and the worst one this suite found: in `parseMentionsInText` the
// "is there text before this match" branch appends that text and then *skips
// chip creation entirely*, never advancing lastIndex. So every mention that
// isn't at offset 0 is left as plain text, and the leading text is emitted once
// per match plus once more at the end. Pasting "hey @Alice and @Bob" yields
// "hey hey @Alice and hey @Alice and @Bob" with no chips at all.
test.fixme(
  "pasting text with a mention after other text creates chips",
  async ({ harness }) => {
    const input = harness.case("default");

    await input.pasteByCopying({ text: "hey @Alice and @Bob" });

    await input.expectModelState({
      text: "hey @Alice and @Bob",
      dataValue: "hey alice and bob",
    });
    await expect(input.chips).toHaveCount(2);
  }
);

test("pasting HTML uses the plain-text flavour and re-parses it", async ({
  harness,
  browserName,
}) => {
  test.skip(browserName === "firefox", SYNTHETIC_PASTE_UNSUPPORTED);

  const input = harness.case("custom-trigger");

  // A real browser puts both flavours on the clipboard when rich content is
  // copied. The library reads only text/plain, so the incoming chip markup is
  // discarded and the mention is recognised from the text.
  await input.pasteHTML(
    '<span class="mention-chip" data-value="bob" data-label="Bob" contenteditable="false">#Bob</span> hello'
  );

  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveAttribute("data-value", "bob");
  await input.expectModelState({ text: "#Bob hello", dataValue: "bob hello" });
});

test("pasting over a selection replaces it", async ({
  harness,
  browserName,
}) => {
  test.skip(browserName === "firefox", SYNTHETIC_PASTE_UNSUPPORTED);

  const input = harness.case("default");

  await input.typeText("hello world");
  await input.selectRange(0, 5);
  await input.pasteText("bye");

  await input.expectModelState({
    text: "bye world",
    dataValue: "bye world",
    caret: 3,
  });
});

test("a genuine copy-and-paste creates a chip in every browser", async ({
  harness,
}) => {
  const input = harness.case("custom-trigger");

  // No permissions, no synthetic event: the content goes onto the real clipboard
  // through a real copy, so this runs on the whole matrix and is the closest
  // thing in the suite to what a user does.
  await input.pasteByCopying({ text: "#Bob trailing" });

  await expect(input.chips).toHaveCount(1);
  await expect(input.chips.first()).toHaveAttribute("data-value", "bob");
  await input.expectModelState({
    text: "#Bob trailing",
    dataValue: "bob trailing",
  });
});

test("a real OS paste behaves like a dispatched one", async ({
  harness,
  browserName,
}) => {
  // Clipboard permissions are only grantable in Chromium through Playwright.
  test.skip(
    browserName !== "chromium",
    "clipboard permissions are chromium-only"
  );

  const input = harness.case("custom-trigger");

  await input.pasteFromSystemClipboard("#Bob trailing");

  await expect(input.chips).toHaveCount(1);
  await input.expectModelState({
    text: "#Bob trailing",
    dataValue: "bob trailing",
  });
});
