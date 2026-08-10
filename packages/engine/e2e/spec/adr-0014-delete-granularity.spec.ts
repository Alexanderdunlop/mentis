import { expect, test, type Content } from "../fixtures/harness";

/**
 * ADR 0014 — a forward delete at an atom is clamped to it; grapheme granularity is not.
 *
 * This spec exists because ADR 0004's postscript treated one question as two phenomena —
 * "browsers disagree about how much one delete covers" — and the two halves turned out to
 * have opposite answers. It holds both halves, so the split is visible in one place:
 *
 *   - **atoms**: every engine must now delete exactly the chip (the clamp)
 *   - **graphemes**: engines are *allowed* to differ, and the difference is pinned per
 *     engine rather than parked, so a change in Firefox fails rather than passing quietly
 *
 * The atom cases are the ones a user would call bugs. Before the clamp, Firefox deleted a
 * character the user never selected — and could not delete a trailing chip at all.
 */

const ALICE = { label: "@Alice", value: "u_1" };
const BOB = { label: "@Bob", value: "u_2" };

const THUMBS_UP = "\u{1F44D}";
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
const E_COMBINING = "e\u{0301}";

// --- the clamp: atoms -------------------------------------------------------

/**
 * Each row is a measured Firefox divergence from the ADR's table. `after` is what every
 * engine must now produce.
 */
const atomCases: { name: string; content: Content[]; after: string }[] = [
  // Firefox took the chip *and* the space: `" hi"` became `"hi"`.
  { name: "a chip followed by text", content: [ALICE, " hi"], after: " hi" },
  // The sharpest one: Firefox took the chip and the `h`, leaving `"i"`.
  { name: "a chip followed by a letter", content: [ALICE, "hi"], after: "hi" },
  // Firefox took the whole emoji with it. Nothing was corrupted — it lands on a grapheme
  // boundary — but the user still lost a character they did not select.
  {
    name: "a chip followed by an emoji",
    content: [ALICE, `${THUMBS_UP}x`],
    after: `${THUMBS_UP}x`,
  },
];

for (const { name, content, after } of atomCases) {
  test(`Delete forward takes exactly the chip: ${name}`, async ({ harness }) => {
    await harness.reset(content);
    await harness.setCaret(0);

    await harness.press("{Delete}");

    await harness.expectText(after);
    await expect(harness.chips()).toHaveCount(0);
    await harness.expectModelMatchesDom();
  });
}

/**
 * The half of the Firefox rule that ADR 0004's postscript missed entirely, and the reason
 * this could not be filed as a granularity difference.
 *
 * With no text after the atom to absorb, Firefox reported a **collapsed** range. ADR 0004
 * reads that as "delete nothing", so the chip survived: a trailing mention could not be
 * removed with the Delete key at all.
 */
test("Delete forward removes a trailing chip, which Firefox reported as an empty range", async ({
  harness,
}) => {
  await harness.reset(["ab", ALICE]);
  await harness.setCaret(2);

  await harness.press("{Delete}");

  await harness.expectText("ab");
  await expect(harness.chips()).toHaveCount(0);
  await harness.expectModelMatchesDom();
});

test("Delete forward removes a lone chip", async ({ harness }) => {
  await harness.reset([ALICE]);
  await harness.setCaret(0);

  await harness.press("{Delete}");

  await harness.expectText("");
  await expect(harness.chips()).toHaveCount(0);
});

test("Delete forward on the first of two chips takes only the first", async ({
  harness,
}) => {
  // Also a collapsed range in Firefox — the next sibling is an element, so there was no
  // character to absorb. And a chance for the clamp to overshoot into the second chip.
  await harness.reset([ALICE, BOB]);
  await harness.setCaret(0);

  await harness.press("{Delete}");

  await harness.expectText("@Bob");
  await expect(harness.chips()).toHaveCount(1);
  await expect(harness.chips().first()).toHaveAttribute("data-mention-value", "u_2");
});

test("Delete forward in plain text is still the browser's business", async ({
  harness,
}) => {
  // The clamp must be invisible away from atoms. If this fails, the exception is not the
  // narrow one ADR 0014 argues for.
  await harness.reset([ALICE, " hi"]);
  await harness.setCaret(1);

  await harness.press("{Delete}");

  await harness.expectText("@Alicehi");
  await expect(harness.chips()).toHaveCount(1);
});

test("a selection starting at a chip is deleted whole, not clamped", async ({
  harness,
}) => {
  // The case that makes the clamp conditional on a collapsed caret. This arrives as the
  // same inputType with a range starting in the same place; only the selection tells them
  // apart, and clamping here would leave the text the user highlighted behind.
  await harness.reset([ALICE, " hi"]);
  await harness.setCaret(0, 4);

  await harness.press("{Delete}");

  await harness.expectText("");
  await expect(harness.chips()).toHaveCount(0);
});

test("Backspace over a chip is unchanged, and needed no clamp", async ({ harness }) => {
  // Every engine already reported a clean whole-atom range backwards, including Firefox.
  // Kept here so the asymmetry in ADR 0014 is a tested claim rather than a remark.
  await harness.reset(["ab", ALICE]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");

  await harness.expectText("ab");
  await expect(harness.chips()).toHaveCount(0);
});

// --- deliberately not clamped: graphemes ------------------------------------

/**
 * Firefox peels a cluster backwards; Chromium and WebKit take it whole. ADR 0014 leaves
 * that alone — it is a platform convention, internally consistent, and ADR 0003's
 * philosophy is not to fight those.
 *
 * These were two `test.fixme`s in `adr-0013-graphemes.spec.ts`, asserting the whole-cluster
 * outcome and failing on Firefox. Parked, they proved nothing and would have gone on
 * failing for a behaviour the engine had decided to keep. Pinned per engine, they fail if
 * *either* browser changes — which is the thing actually worth being told about.
 */
const peeled: { name: string; character: string; firefox: string }[] = [
  { name: "a ZWJ sequence", character: FAMILY, firefox: "hi \u{1F468}\u{200D}\u{1F469}" },
  { name: "a combining accent", character: E_COMBINING, firefox: "hi e" },
];

for (const { name, character, firefox } of peeled) {
  test(`Backspace over ${name} follows the platform's convention`, async ({
    harness,
    browserName,
  }) => {
    await harness.reset([`hi ${character}`]);
    await harness.setCaretToEnd();

    await harness.press("{Backspace}");

    await harness.expectText(browserName === "firefox" ? firefox : "hi ");
    // Whichever it chose, the invariant ADR 0013 actually guarantees still holds.
    await harness.expectModelMatchesDom();
  });
}

test("forward delete over a cluster is whole on every engine, including Firefox", async ({
  harness,
}) => {
  // The directional half of Firefox's behaviour, and why ADR 0014 calls it coherent rather
  // than careless: it peels backwards and removes whole forwards.
  for (const character of [FAMILY, E_COMBINING]) {
    await harness.reset([`${character}x`]);
    await harness.setCaret(0);

    await harness.press("{Delete}");

    await harness.expectText("x");
  }
});
