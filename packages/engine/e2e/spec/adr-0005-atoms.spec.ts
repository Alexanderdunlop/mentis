import { expect, test } from "../fixtures/harness";

/**
 * ADR 0005 — an atom is one position wide.
 *
 * Its Unverified section names exactly what only a browser can settle:
 *
 * > whether every engine truly treats a `contenteditable="false"` span as one caret stop,
 * > in both directions, and whether Backspace targets the whole chip.
 *
 * That claim is load-bearing. Arrow traversal and whole-chip deletion are *inherited* from
 * `contenteditable="false"` rather than implemented (ADR 0003 leaves navigation to the
 * browser), so if any engine disagrees the design does not degrade — it is wrong.
 */

const ALICE = { label: "@Alice", value: "u_1" };
const BOB = { label: "@Bob", value: "u_2" };

test("a chip renders with its value on the element", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);

  await expect(harness.chips()).toHaveCount(1);
  await expect(harness.chips().first()).toHaveAttribute("data-mention-value", "u_1");
  await expect(harness.chips().first()).toHaveAttribute("contenteditable", "false");
  await harness.expectText("hi @Alice");
});

test("the two coordinate spaces really do diverge", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);

  const model = await harness.model();
  // Four positions — "hi " is 3, the atom is 1 — and nine characters.
  expect(model.length).toBe(4);
  expect(model.text.length).toBe(9);
  expect(model.text).toBe("hi @Alice");

  // The caret at the end of the document is position 4 and character offset 9. If these
  // ever agreed for a document containing a mention, ADR 0005 would have stopped being
  // true and every offset in the package would be quietly wrong.
  await harness.setCaretToEnd();
  await harness.expectCaret(4);
  expect(await harness.domCaretOffset()).toBe(9);
});

test("one ArrowLeft steps over the whole chip, not into it", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);
  await harness.setCaretToEnd();

  await harness.press("{ArrowLeft}");

  // Position 3 is before the atom. Anything else means the browser put the caret inside
  // a chip, which is the state ADR 0005 makes unrepresentable.
  await harness.expectCaret(3);
});

test("one ArrowRight steps back over it", async ({ harness }) => {
  await harness.reset(["hi ", ALICE, " there"]);
  await harness.setCaret(3);

  await harness.press("{ArrowRight}");

  await harness.expectCaret(4);
});

test("Backspace takes the whole chip", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");

  await harness.expectText("hi ");
  await expect(harness.chips()).toHaveCount(0);
  expect((await harness.model()).mentions).toHaveLength(0);
});

test.fixme(
  "Delete forward takes the whole chip and nothing else",
  async ({ harness }) => {
    /*
     * FIREFOX ONLY. The chip is removed correctly; the character after it goes too.
     *
     * Cause: Firefox's own `getTargetRanges()` covers more than the atom. For this exact
     * document and keypress the browsers report:
     *
     *   chromium/webkit  (DIV, 0) → (" hi", 0)   the atom
     *   firefox          (DIV, 0) → (" hi", 1)   the atom *and* the following space
     *
     * So this is not a mapping error on our side — `domToModel` carried the range
     * faithfully. It is the premise of ADR 0004 ("the browser has already worked out the
     * right range") turning out to be browser-specific.
     *
     * Left failing rather than fixed: whether the engine should clamp a browser range to
     * what it believes one unit is, and thereby override platform convention, is a design
     * decision that contradicts ADR 0004 and needs its own ADR.
     */
    await harness.reset([ALICE, " hi"]);
    await harness.setCaret(0);

    await harness.press("{Delete}");

    await harness.expectText(" hi");
    await expect(harness.chips()).toHaveCount(0);
  }
);

test("Delete forward removes the chip, whatever else it takes with it", async ({
  harness,
}) => {
  // The part every engine agrees on, and the part ADR 0005 actually claims: an atom is
  // never half-deleted. Kept passing alongside the fixme above so a regression in the
  // agreed behaviour cannot hide behind the known divergence.
  await harness.reset([ALICE, " hi"]);
  await harness.setCaret(0);

  await harness.press("{Delete}");

  await expect(harness.chips()).toHaveCount(0);
  expect((await harness.model()).mentions).toHaveLength(0);
  await harness.expectModelMatchesDom();
});

test("two chips with the same label stay distinct", async ({ harness }) => {
  // The thing v1 cannot do, because it re-derives mentions from rendered text.
  await harness.reset([
    { label: "@Alex", value: "u_1" },
    " and ",
    { label: "@Alex", value: "u_2" },
  ]);

  expect((await harness.model()).mentions).toEqual([
    { label: "@Alex", value: "u_1", at: 0 },
    { label: "@Alex", value: "u_2", at: 6 },
  ]);
});

test("typing beside a chip does not disturb it", async ({ harness }) => {
  // v1's equivalent destroys the chip and eats the typed character; it is in that
  // suite's fixme backlog. Here the chip is a model node, so there is nothing to destroy.
  await harness.reset(["hi ", ALICE]);
  await harness.setCaretToEnd();

  await harness.type("!");

  await harness.expectText("hi @Alice!");
  await expect(harness.chips()).toHaveCount(1);
  await harness.expectModelMatchesDom();
});

test("the model and the DOM agree after editing around chips", async ({ harness }) => {
  await harness.reset(["a ", ALICE, " b ", BOB, " c"]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace*2}");
  await harness.type("Z");
  await harness.press("{ArrowLeft*4}");
  await harness.type("Y");

  await harness.expectModelMatchesDom();
  expect(await harness.unhandledInput()).toEqual([]);
});
