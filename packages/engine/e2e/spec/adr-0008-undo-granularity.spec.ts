import { expect, test } from "../fixtures/harness";

/**
 * ADR 0008 — undo granularity follows words, not typing speed.
 *
 * Its Consequences section closes with the doubt this spec exists to remove:
 *
 * > **Unverified in a real browser.** The rule is tested at the model level; whether it
 * > *feels* right is exactly the judgement the harness exists for.
 *
 * Two halves here. The first pins the rule itself against real keystrokes. The second
 * covers what looking at it in a browser actually turned up: **a keypress that changed
 * nothing was recorded as an undo step**, which is not a granularity question but was
 * hiding inside one.
 */

const ALICE = { label: "@Alice", value: "u_1" };

// --- the rule ---------------------------------------------------------------

test("a word is one undo step", async ({ harness }) => {
  await harness.reset([]);
  await harness.type("hello");

  await harness.undo();

  await harness.expectText("");
});

test("each word is its own undo step", async ({ harness }) => {
  await harness.reset([]);
  await harness.type("one two three");

  await harness.undo();
  await harness.expectText("one two ");

  await harness.undo();
  await harness.expectText("one ");

  await harness.undo();
  await harness.expectText("");
});

test("redo replays the same grouping", async ({ harness }) => {
  await harness.reset([]);
  await harness.type("one two");

  await harness.undo();
  await harness.expectText("one ");

  await harness.redo();
  await harness.expectText("one two");
  await harness.expectModelMatchesDom();
});

test("a mention is its own undo step, however small", async ({ harness }) => {
  // `origin: "program"` never coalesces, so a chip cannot be swallowed by the word it
  // was typed next to.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();
  await harness.insertMention(ALICE.label, ALICE.value);
  await expect(harness.chips()).toHaveCount(1);

  await harness.undo();

  await harness.expectText("hi ");
  await expect(harness.chips()).toHaveCount(0);
});

// --- a keypress that changed nothing ----------------------------------------

/**
 * ADR 0004 reads a collapsed range from the browser as "delete nothing — that is
 * information, not an omission". Chromium and Firefox *do* fire `deleteContentForward`
 * with one when there is nothing ahead of the caret; WebKit fires no `beforeinput` at all.
 *
 * So the engine correctly did nothing to the document, and then recorded having done
 * nothing. Asserting the history is *unchanged* covers all three engines without caring
 * which of them bothered to send the event.
 */
test("Delete with nothing ahead of the caret leaves the history alone", async ({
  harness,
}) => {
  await harness.reset([]);
  await harness.type("abc");
  const { history } = await harness.model();

  await harness.press("{Delete}{Delete}{Delete}{Delete}");

  expect((await harness.model()).history.depth).toBe(history.depth);
  await harness.expectText("abc");
});

test("Backspace at the start of the document leaves the history alone", async ({
  harness,
}) => {
  await harness.reset(["abc"]);
  await harness.setCaret(0);
  const { history } = await harness.model();

  await harness.press("{Backspace}{Backspace}{Backspace}");

  expect((await harness.model()).history.depth).toBe(history.depth);
  await harness.expectText("abc");
});

test("a dead keypress does not cost an undo press", async ({ harness }) => {
  // What the user sees: ⌘Z once per dead keystroke, each doing visibly nothing, before
  // undo starts working again.
  await harness.reset([]);
  await harness.type("abc");
  await harness.press("{Delete}{Delete}{Delete}");

  await harness.undo();

  await harness.expectText("");
});

test("a dead keypress does not destroy the redo branch", async ({ harness }) => {
  // The serious one. `record` clears the redo branch, so this made undone work
  // unrecoverable: type, undo, press Delete at the end, press redo — gone for good.
  await harness.reset([]);
  await harness.type("abc");

  await harness.undo();
  await harness.expectText("");

  await harness.setCaretToEnd();
  await harness.press("{Delete}");

  await harness.redo();

  await harness.expectText("abc");
  await harness.expectModelMatchesDom();
});

test("a dead keypress does not split the word being typed", async ({ harness }) => {
  // The subtlest symptom, and the one a fix could easily trade for: an unrecorded
  // keystroke must not interrupt the run either side of it, or `hi` becomes two steps.
  await harness.reset([]);
  await harness.type("hi");
  await harness.press("{Delete}");
  await harness.type("gh");

  await harness.undo();

  await harness.expectText("");
});
