import { expect, test } from "../fixtures/harness";

/**
 * ADR 0015 — direction belongs to the consumer; the engine stays logical.
 *
 * This spec is unusual in this directory: **almost nothing here is a fix.** RTL and bidi
 * turned out to cost the engine nothing, and that is the claim worth pinning — because it
 * is a *consequence* of three earlier decisions rather than luck, and a future change
 * could quietly take it away:
 *
 *   - ADR 0003 leaves caret movement to the browser, so bidi caret behaviour — where
 *     engines genuinely differ — is never the engine's problem
 *   - ADR 0004 takes edit ranges from `getTargetRanges()`, so the browser resolves what
 *     one keypress means in a reordered line
 *   - ADR 0005 makes positions logical offsets, which have no direction at all
 *
 * So the assertions are deliberately about the model being *unaffected*. If the engine ever
 * starts reading `dir`, or deriving anything from visual order, these are what break.
 *
 * Hebrew and Arabic rather than a contrived `‮` override: the point is ordinary text
 * that real users type, not a bidi torture case.
 */

/** "shalom olam" — 9 characters, strongly RTL. */
const HEB = "שלום עולם";
/** "marhaba" — 5 characters, strongly RTL. */
const AR = "مرحبا";

const ALICE = { label: "@Alice", value: "u_alice" };

test("the container's direction is the whole integration", async ({ harness }) => {
  // Not a tautology: it establishes that `dir` reaches the element the engine renders
  // into, so everything below is genuinely running in an RTL box.
  await harness.reset([HEB], "rtl");
  expect(await harness.resolvedDirection()).toBe("rtl");

  await harness.reset([HEB]);
  expect(await harness.resolvedDirection()).toBe("ltr");
});

test("the model is identical in both directions", async ({ harness }) => {
  // The headline. Same content, same model — because a position is a logical offset and
  // has no direction (ADR 0005).
  const content = [`${HEB} `, ALICE, ` ${AR}`];

  await harness.reset(content, "ltr");
  const ltr = await harness.model();

  await harness.reset(content, "rtl");
  const rtl = await harness.model();

  expect(rtl.text).toBe(ltr.text);
  expect(rtl.length).toBe(ltr.length);
  expect(rtl.nodes).toEqual(ltr.nodes);
  expect(rtl.mentions).toEqual(ltr.mentions);
  await harness.expectModelMatchesDom();
});

test("editing RTL text keeps the model and the DOM in step", async ({ harness }) => {
  await harness.reset([HEB], "rtl");
  await harness.setCaretToEnd();

  await harness.press("{Backspace}{Backspace}");
  await harness.expectText(HEB.slice(0, -2));
  await harness.expectModelMatchesDom();

  await harness.type("!");
  await harness.expectText(`${HEB.slice(0, -2)}!`);
  await harness.expectModelMatchesDom();
});

test("a mention keeps its value in an RTL line", async ({ harness }) => {
  // The whole reason atoms exist. Visual reordering puts the chip somewhere a character
  // count would not predict, and none of that reaches the model.
  await harness.reset([`${HEB} `, ALICE, ` ${AR}`], "rtl");

  await expect(harness.chips()).toHaveCount(1);
  await expect(harness.chips().first()).toHaveAttribute("data-mention-value", "u_alice");
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_alice", at: 10 },
  ]);
});

test("Backspace over a chip in RTL takes the whole chip", async ({ harness }) => {
  await harness.reset([`${HEB} `, ALICE], "rtl");
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");

  await harness.expectText(`${HEB} `);
  await expect(harness.chips()).toHaveCount(0);
  await harness.expectModelMatchesDom();
});

test("typing beside a chip in RTL disturbs neither", async ({ harness }) => {
  await harness.reset([`${HEB} `, ALICE], "rtl");
  await harness.setCaretToEnd();

  await harness.type(AR);

  await harness.expectText(`${HEB} @Alice${AR}`);
  await expect(harness.chips()).toHaveCount(1);
  await harness.expectModelMatchesDom();
});

test("undo in RTL restores exactly what was there", async ({ harness }) => {
  await harness.reset([`${HEB} `, ALICE], "rtl");
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");
  await expect(harness.chips()).toHaveCount(0);

  await harness.undo();

  await harness.expectText(`${HEB} @Alice`);
  await expect(harness.chips()).toHaveCount(1);
  // Restored as a *mention*, not as its label text — the reason steps carry slices.
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_alice", at: 10 },
  ]);
});

/**
 * The one place direction could actually break something: `positionRect` is the engine's
 * only geometry, and what a consumer anchors a mention menu to.
 */
test("positionRect anchors inside the editor on the correct side in RTL", async ({
  harness,
}) => {
  await harness.reset([`${HEB} @al`], "rtl");

  const editorBox = await harness.editor.boundingBox();
  expect(editorBox).not.toBeNull();
  const { x, width } = editorBox!;

  // Position 10 is the `@` — where `mention-flow.ts` anchors the menu (`active.from`).
  const rect = await harness.positionRect(10);
  expect(rect).not.toBeNull();

  // Inside the editor, and in the right half of it: an RTL line starts at the right edge,
  // so a menu anchored to the left edge would be at the wrong end of the line entirely.
  expect(rect!.left).toBeGreaterThan(x);
  expect(rect!.left).toBeLessThan(x + width);
  expect(rect!.left).toBeGreaterThan(x + width / 2);
});

test("positionRect anchors on the other side for the same content in LTR", async ({
  harness,
}) => {
  // The mirror, so the test above is measuring direction rather than passing by accident.
  await harness.reset([`${HEB} @al`], "ltr");

  const editorBox = await harness.editor.boundingBox();
  const { x, width } = editorBox!;

  const rect = await harness.positionRect(10);
  expect(rect).not.toBeNull();
  expect(rect!.left).toBeLessThan(x + width / 2);
});

test("positionRect is still on the right side at the very end of an RTL line", async ({
  harness,
}) => {
  /*
   * WebKit reports **no client rects at all** for a collapsed range at the end of a text
   * node, which sends `positionRect` down its fallback. That fallback used the containing
   * element's rect, whose `left` is the far *left* edge — the wrong end of an RTL line by
   * the full width of the editor.
   *
   * Not reachable through the mention menu, which anchors on the `@` rather than on the
   * caret and always gets a rect. Reachable through the exported `positionRect` by any
   * consumer that wants to place something at the caret, which is the ordinary thing to
   * want.
   */
  await harness.reset([HEB], "rtl");
  const { length } = await harness.model();

  const editorBox = await harness.editor.boundingBox();
  const { x, width } = editorBox!;

  const rect = await harness.positionRect(length);
  expect(rect).not.toBeNull();
  expect(rect!.left).toBeGreaterThan(x + width / 2);
});

test("positionRect at the end of an LTR line lands after the last character", async ({
  harness,
}) => {
  // The mirror of the test above, and not redundant: WebKit takes the same derived path
  // here, so this is what proves the edge is chosen by measurement rather than hardcoded
  // for RTL. A wrong choice puts the anchor a character-width off, not half a screen, so
  // it is checked against the text's own extent.
  await harness.reset(["hello world"], "ltr");
  const { length } = await harness.model();

  const [atEnd, beforeLast] = await Promise.all([
    harness.positionRect(length),
    harness.positionRect(length - 1),
  ]);

  expect(atEnd).not.toBeNull();
  expect(beforeLast).not.toBeNull();
  // The caret after the last character is to the right of the caret before it.
  expect(atEnd!.left).toBeGreaterThan(beforeLast!.left);
});

/**
 * Caret movement is the browser's (ADR 0003), and engines differ about what ArrowLeft
 * means in mixed text — visually left, or logically back. The engine takes no position on
 * that, so the claim is not "the caret lands at 3"; it is that **whatever the browser
 * produces is a position the model can represent**, which is what ADR 0005 needs.
 */
test("whatever the browser does with arrows in bidi text, the model can hold it", async ({
  harness,
}) => {
  await harness.reset([`${HEB} `, ALICE, ` ${AR}`], "rtl");
  const { length } = await harness.model();
  await harness.setCaret(0);

  for (let index = 0; index < 12; index += 1) {
    await harness.press("{ArrowLeft}");
    const head = (await harness.model()).selection?.head;
    expect(head, `caret after ${index + 1} presses`).not.toBeUndefined();
    // In range, and never inside the atom — the invariant that would break if a browser
    // reported a visual position we mapped naively.
    expect(head).toBeGreaterThanOrEqual(0);
    expect(head).toBeLessThanOrEqual(length);
  }

  await harness.expectModelMatchesDom();
});
