import { expect, test } from "../fixtures/harness";

/**
 * ADR 0013 — positions stay code units; boundaries become grapheme-aware.
 *
 * Its Unverified section says the unit tests only cover the *fallback* path, because
 * happy-dom supplies no `getTargetRanges()` while a real browser mostly does:
 *
 * > These tests cover the belt while the braces are what ship. Whether every engine
 * > really does resolve clusters in `getTargetRanges()` is an M6 question the browser
 * > matrix is meant to answer.
 *
 * This is that answer. Every deletion here goes through the browser's own range, which is
 * the path a user actually takes.
 *
 * Characters are written as escapes, never typed: two contain a zero-width joiner that no
 * reviewer could see in source.
 */

const THUMBS_UP = "\u{1F44D}"; // 2 code units
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"; // 8, two ZWJs
const FLAG_NZ = "\u{1F1F3}\u{1F1FF}"; // 4, two regional indicators
const E_COMBINING = "e\u{0301}"; // 2, letter plus combining acute

/** A lone surrogate renders as `?` and the user can neither select nor delete it. */
const hasLoneSurrogate = (value: string): boolean =>
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);

/**
 * Every engine agrees on these two. A surrogate pair and a flag are indivisible
 * everywhere, which is the part of ADR 0013 that is now genuinely confirmed.
 */
const agreed: [string, string][] = [
  ["a surrogate pair", THUMBS_UP],
  ["a flag", FLAG_NZ],
];

for (const [name, character] of agreed) {
  test(`Backspace deletes ${name} whole`, async ({ harness }) => {
    await harness.reset([`hi ${character}`]);
    await harness.setCaretToEnd();

    await harness.press("{Backspace}");

    await harness.expectText("hi ");
    expect(hasLoneSurrogate(await harness.domText())).toBe(false);
  });
}

/*
 * A ZWJ sequence and a combining accent used to sit here as two `test.fixme`s, because
 * Firefox peels them a component at a time where the others take the whole cluster.
 *
 * They have moved to `adr-0014-delete-granularity.spec.ts`, which is the ADR that decided
 * to *keep* that difference rather than clamp it — so they are now pinned per engine and
 * fail if either browser changes, instead of parked and failing for behaviour the engine
 * chose on purpose. What ADR 0013 itself claims about them is the next test: whatever a
 * browser removes, it is never half a code point.
 */

test("Backspace never corrupts, whatever granularity the browser chose", async ({
  harness,
}) => {
  // The invariant that holds on every engine, and the one that matters: however much a
  // browser decides to remove, it is never *half a code point*, and the model never falls
  // out of step with the DOM. This is what ADR 0013 actually guarantees.
  await harness.reset([`${THUMBS_UP}${FAMILY}${FLAG_NZ}${E_COMBINING}`]);
  await harness.setCaretToEnd();

  for (let i = 0; i < 8; i += 1) {
    await harness.press("{Backspace}");
    const [model, dom] = await Promise.all([harness.text(), harness.domText()]);
    expect(hasLoneSurrogate(model), `model after ${i + 1} presses`).toBe(false);
    expect(hasLoneSurrogate(dom), `dom after ${i + 1} presses`).toBe(false);
    expect(model, `model vs dom after ${i + 1} presses`).toBe(dom);
  }

  await harness.expectText("");
});

test("Delete forward takes a whole character", async ({ harness }) => {
  await harness.reset([`${THUMBS_UP}x`]);
  await harness.setCaret(0);

  await harness.press("{Delete}");

  await harness.expectText("x");
});

test("one ArrowRight crosses a whole emoji", async ({ harness }) => {
  // If an engine steps by code unit instead, the caret lands at 1 — inside the pair —
  // and the *next* edit would cut it in half. This is the claim ADR 0013 leans on when
  // it says the browser is already grapheme-correct.
  await harness.reset([`a${THUMBS_UP}b`]);
  await harness.setCaret(0);

  await harness.press("{ArrowRight}{ArrowRight}");

  await harness.expectCaret(3);
});

test("a typed emoji joins the typing run for undo", async ({ harness }) => {
  await harness.reset([]);

  await harness.type(`hi${THUMBS_UP}${THUMBS_UP}`);
  await harness.expectText(`hi${THUMBS_UP}${THUMBS_UP}`);

  await harness.undo();

  // One step for the whole run. Measured in code units each emoji would be classified as
  // "not typing" and stranded as its own entry, making this three undos.
  await harness.expectText("");
});

test("but whitespace still closes the group, emoji or not", async ({ harness }) => {
  // ADR 0008 is unchanged by ADR 0013: a space ends a typing run and attaches to the word
  // it follows, so the emoji after it is a fresh word and undoes on its own. Worth pinning
  // — the first version of the spec above assumed the space away and this is what caught it.
  await harness.reset([]);

  await harness.type(`hi ${THUMBS_UP}`);
  await harness.undo();
  await harness.expectText("hi ");

  await harness.undo();
  await harness.expectText("");
});

test("undo restores a deleted emoji intact", async ({ harness }) => {
  await harness.reset([`hi ${THUMBS_UP}`]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");
  await harness.expectText("hi ");

  await harness.undo();

  await harness.expectText(`hi ${THUMBS_UP}`);
  expect(hasLoneSurrogate(await harness.domText())).toBe(false);
});

test("the model and the DOM agree throughout", async ({ harness }) => {
  await harness.reset([`${FAMILY} and ${FLAG_NZ}`]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace*3}");
  await harness.type(THUMBS_UP);

  await harness.expectModelMatchesDom();
  expect(await harness.unhandledInput()).toEqual([]);
});
