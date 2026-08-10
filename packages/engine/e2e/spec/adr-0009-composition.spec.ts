import { expect, test } from "../fixtures/harness";

/**
 * ADR 0009 — the engine yields the DOM during composition.
 *
 * This has been the package's oldest unverified claim since M4. The ADR is blunt about it:
 *
 * > **None of this has met a real IME.** The tests play the browser's part by hand: fire
 * > `compositionstart`, write to the DOM as an IME might, fire `compositionend`, assert
 * > the model caught up. That verifies the reconciliation *contract*. It does not verify
 * > that real IMEs emit these events in this order, or write this shape of DOM.
 *
 * These specs verify exactly that. `Input.imeSetComposition` makes Chromium render its own
 * pre-edit text and fire genuine `compositionstart` / `compositionupdate`, which is the
 * window ADR 0009 hands the DOM over for. Nothing is faked at the DOM level.
 *
 * **Chromium only.** Playwright has no equivalent for Firefox or WebKit, so this is one
 * engine's idea of the event sequence rather than proof that all of them agree. Japanese
 * and Chinese input on WebKit, and Gboard, still need a human — the ADR keeps saying so.
 */

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "CDP composition is Chromium only"
);

const ALICE = { label: "@Alice", value: "u_1" };

test("a committed composition lands in the model", async ({ harness }) => {
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose("にほんg");
  await harness.commitComposition("日本語");

  await harness.expectText("hi 日本語");
  await harness.expectModelMatchesDom();
});

test("the engine yields the DOM for the duration and takes it back", async ({
  harness,
}) => {
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  expect(await harness.isComposing()).toBe(false);

  await harness.compose("にほん");
  // The model is knowingly stale here — this is the one window where the DOM leads.
  expect(await harness.isComposing()).toBe(true);

  await harness.commitComposition("日本");

  expect(await harness.isComposing()).toBe(false);
  await harness.expectModelMatchesDom();
});

test("pre-edit text really is rendered by the browser, not by us", async ({
  harness,
}) => {
  // If the engine were still preventing `beforeinput` during composition, nothing would
  // appear here at all — which is the failure ADR 0009 exists to avoid. The DOM shows the
  // pre-edit text while the model has not moved.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose("にほん");

  expect(await harness.domText()).toContain("にほん");
  expect(await harness.text()).toBe("hi ");

  await harness.commitComposition("日本");
  await harness.expectModelMatchesDom();
});

test("a whole composition is a single undo step", async ({ harness }) => {
  // The claim that makes the reconciliation worth doing at all: `diffDocs` narrows the
  // whole composition to one transaction, so undo does not walk back through candidates.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();
  const before = (await harness.model()).history.depth;

  await harness.compose("に");
  await harness.compose("にほ");
  await harness.compose("にほん");
  await harness.commitComposition("日本語");

  await harness.expectText("hi 日本語");
  expect((await harness.model()).history.depth).toBe(before + 1);

  await harness.undo();
  await harness.expectText("hi ");
});

test("the DOM is restored to canonical form afterwards", async ({ harness }) => {
  // The browser invents wrapper elements while it owns the DOM. `render` discards them,
  // which is what keeps the one-node-per-child invariant that position mapping needs.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose("にほん");
  await harness.commitComposition("日本");

  const childKinds = await harness.editor.evaluate((element) =>
    Array.from(element.childNodes).map((node) => node.nodeName)
  );
  expect(childKinds).toEqual(["#text"]);
});

test("a cancelled composition leaves the document untouched", async ({ harness }) => {
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose("にほん");
  await harness.cancelComposition();

  await harness.expectText("hi ");
  await harness.expectModelMatchesDom();
  expect(await harness.isComposing()).toBe(false);
});

test("a mention survives a composition beside it", async ({ harness }) => {
  // The risky part of the reconcile: `readDomState` rebuilds atoms from the DOM, and the
  // only thing that makes that possible is `data-mention-value` living on the element.
  // Lose it and a chip silently degrades to its label — the exact failure ADR 0005 and
  // ADR 0010 both guard against, arriving by a third route.
  await harness.reset(["hi ", ALICE, " "]);
  await harness.setCaretToEnd();

  await harness.compose("にほん");
  await harness.commitComposition("日本");

  await harness.expectText("hi @Alice 日本");
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_1", at: 3 },
  ]);
  await expect(harness.chips()).toHaveCount(1);
  await harness.expectModelMatchesDom();
});

test("a composition before a mention does not disturb it", async ({ harness }) => {
  await harness.reset(["hi ", ALICE]);
  await harness.setCaret(3);

  await harness.compose("にほん");
  await harness.commitComposition("日本");

  await harness.expectText("hi 日本@Alice");
  expect((await harness.model()).mentions).toEqual([
    { label: "@Alice", value: "u_1", at: 5 },
  ]);
});

test("a composition committing an emoji does not split it", async ({ harness }) => {
  // This is the path the M6 `diffDocs` bug was actually reachable from: the reconcile
  // compares old and new text code unit by code unit, and two emoji sharing a surrogate
  // used to produce a lone one. Now reachable through a real composition rather than a
  // hand-fired event.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose(":thumbs");
  await harness.commitComposition("\u{1F44D}");

  await harness.expectText("hi \u{1F44D}");
  expect((await harness.model()).length).toBe(5);
  await harness.expectModelMatchesDom();
});

test("replacing one emoji with another through composition stays whole", async ({
  harness,
}) => {
  await harness.reset(["\u{1F44D}"]);
  await harness.setCaretToEnd();

  await harness.press("{Backspace}");
  await harness.compose(":thumbsdown");
  await harness.commitComposition("\u{1F44E}");

  await harness.expectText("\u{1F44E}");
  await harness.expectModelMatchesDom();
});

test("typing continues normally after a composition", async ({ harness }) => {
  await harness.reset([]);

  await harness.compose("にほん");
  await harness.commitComposition("日本");
  await harness.type("!");

  await harness.expectText("日本!");
  await harness.expectCaret(3);
  await harness.expectModelMatchesDom();
  expect(await harness.unhandledInput()).toEqual([]);
});

test("no stray insertCompositionText reaches the engine unhandled", async ({
  harness,
}) => {
  // ADR 0009 removed `insertCompositionText` from the insertion set, on the reasoning that
  // handling it there *as well* would apply the composed text twice. A stray one is
  // reported rather than guessed at — so an empty list here is the ADR's prediction
  // holding, and a non-empty one is the trailing-beforeinput case it flagged as possible.
  await harness.reset(["hi "]);
  await harness.setCaretToEnd();

  await harness.compose("にほん");
  await harness.commitComposition("日本");

  expect(await harness.unhandledInput()).toEqual([]);
});
