import { expect, test } from "../fixtures/harness";

/**
 * ADR 0001 / 0002 — a line break is one `\n`, rendered as text and never as `<br>`.
 *
 * This is the oldest open question in the package. The traps note records that browsers
 * disagree about whether a line break costs a character in `textContent` — Firefox
 * inserts a literal `"\n"`, Chromium and WebKit end the line with a block boundary — and
 * ADR 0001 commits the *model* to exactly one `\n` per break regardless.
 *
 * The engine should make that disagreement disappear, because it never lets the browser
 * write the break: `beforeinput` is prevented and `render` puts a real `\n` in a text
 * node under `white-space: pre-wrap`. So the interesting assertion is that **all four
 * projects agree**, which is a claim about the engine rather than about any browser.
 *
 * The one `<br>` that does exist is the trailing filler, which carries no model content
 * and must never be counted (ADR 0002).
 */

test("Enter produces exactly one newline in the model", async ({ harness }) => {
  await harness.reset(["one"]);
  await harness.setCaretToEnd();

  await harness.press("{Enter}");
  await harness.type("two");

  await harness.expectText("one\ntwo");
  // Four positions before "two": o-n-e-\n. If an engine contributed a second character
  // the model would say 8 here and every offset past the break would be wrong.
  expect((await harness.model()).length).toBe(7);
});

test("the same is true on every browser in the matrix", async ({ harness }) => {
  // Deliberately not parameterised by project: the point is that no project needs a
  // special case. A failure here names the browser that broke the invariant.
  await harness.reset([]);

  await harness.type("a");
  await harness.press("{Enter}");
  await harness.type("b");
  await harness.press("{Enter}");
  await harness.type("c");

  await harness.expectText("a\nb\nc");
  expect((await harness.model()).length).toBe(5);
});

test("newlines render as text, not as inline <br>", async ({ harness }) => {
  await harness.reset(["one\ntwo"]);

  // Only the trailing filler may be a <br>, and this document does not end in a newline,
  // so there should be none at all.
  await expect(harness.editor.locator("br")).toHaveCount(0);
  await harness.expectModelMatchesDom();
});

test("a document ending in a newline gets exactly one trailing <br>", async ({
  harness,
}) => {
  await harness.reset(["one"]);
  await harness.setCaretToEnd();
  await harness.press("{Enter}");

  await expect(harness.editor.locator("br")).toHaveCount(1);
  // The filler carries no model content: the model is 4 positions, not 5.
  expect((await harness.model()).length).toBe(4);
  await harness.expectText("one\n");
});

test("the caret can sit on the final empty line", async ({ harness }) => {
  // Which is the entire reason the trailing <br> exists.
  await harness.reset(["one"]);
  await harness.setCaretToEnd();

  await harness.press("{Enter}");
  await harness.type("x");

  await harness.expectText("one\nx");
  await harness.expectCaret(5);
});

test("Backspace over a newline removes one position", async ({ harness }) => {
  await harness.reset(["one\ntwo"]);
  await harness.setCaret(4);

  await harness.press("{Backspace}");

  await harness.expectText("onetwo");
  await harness.expectCaret(3);
});

test("undo after Enter restores a single step", async ({ harness }) => {
  await harness.reset(["one"]);
  await harness.setCaretToEnd();

  await harness.press("{Enter}");
  await harness.expectText("one\n");

  await harness.undo();

  await harness.expectText("one");
  await harness.expectModelMatchesDom();
});
