import { expect, test } from "../fixtures/harness";

/**
 * ADR 0010 / 0012 — the clipboard.
 *
 * ADR 0010's Unverified section is the longest in the package, and it opens with:
 *
 * > **No real browser has been asked to do this round trip.** The tests serialise and
 * > then parse, which checks everything except the operating system in the middle.
 *
 * This is the operating system in the middle. Every copy and paste here is a real
 * keystroke against the real system clipboard — no constructed `ClipboardEvent`, which
 * Firefox ignores anyway (see docs/notes/contenteditable-traps.md).
 *
 * That does mean these specs share one clipboard per browser process, so nothing here may
 * assume the clipboard is empty; each copies what it is about to paste.
 */

const ALICE = { label: "@Alice", value: "u_1" };

test("a copied mention pastes back as a mention, with its value", async ({ harness }) => {
  // The milestone's done-when, and the one thing serialise-then-parse cannot show.
  await harness.reset(["hi ", ALICE]);

  await harness.selectAll();
  await harness.copy();
  await harness.setCaretToEnd();
  await harness.paste();

  await harness.expectText("hi @Alicehi @Alice");
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_1", at: 3 },
    { label: "@Alice", value: "u_1", at: 7 },
  ]);
  await expect(harness.chips()).toHaveCount(2);
});

test("two mentions sharing a label survive with distinct values", async ({ harness }) => {
  await harness.reset([
    { label: "@Alex", value: "u_1" },
    " ",
    { label: "@Alex", value: "u_2" },
  ]);

  await harness.selectAll();
  await harness.copy();
  await harness.press("{Backspace}");
  await harness.paste();

  expect((await harness.model()).mentions.map((m) => m.value)).toEqual(["u_1", "u_2"]);
});

test("cut removes the selection and one undo brings the mention back", async ({
  harness,
}) => {
  await harness.reset(["hi ", ALICE]);

  await harness.selectAll();
  await harness.cut();
  await harness.expectText("");

  await harness.undo();

  await harness.expectText("hi @Alice");
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_1", at: 3 },
  ]);
});

test("a cut selection can be pasted back", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);

  await harness.selectAll();
  await harness.cut();
  await harness.expectText("");
  await harness.paste();

  await harness.expectText("hi @Alice");
  await expect(harness.chips()).toHaveCount(1);
});

test("deliberate runs of spaces survive the round trip", async ({ harness }) => {
  // What the `white-space:pre-wrap` wrapper is for. Without it the paste path collapses
  // them, exactly as HTML layout would.
  await harness.reset(["a    b"]);

  await harness.selectAll();
  await harness.copy();
  await harness.press("{Backspace}");
  await harness.paste();

  await harness.expectText("a    b");
});

test("a paste is one undo step", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);
  await harness.selectAll();
  await harness.copy();
  await harness.press("{Backspace}");

  const before = (await harness.model()).history.depth;
  await harness.paste();
  await harness.expectText("hi @Alice");

  expect((await harness.model()).history.depth).toBe(before + 1);

  await harness.undo();
  await harness.expectText("");
});

test("the model and the DOM agree after a round trip", async ({ harness }) => {
  await harness.reset(["hi ", ALICE, " bye"]);

  await harness.selectAll();
  await harness.copy();
  await harness.setCaretToEnd();
  await harness.paste();

  await harness.expectModelMatchesDom();
  expect(await harness.unhandledInput()).toEqual([]);
});
