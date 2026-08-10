import { describe, expect, it } from "vitest";
import { createDoc } from "../../model/create-doc";
import { atomNode, textNode } from "../../model/nodes";
import { transactionFor } from "../transaction-for";
import type { InputIntent } from "../types";

const intent = (over: Partial<InputIntent>): InputIntent => ({
  inputType: "insertText",
  text: null,
  range: { from: 0, to: 0 },
  rangeFromBrowser: false,
  // Ten positions of plain text: the default subject for range arithmetic.
  doc: createDoc("0123456789"),
  ...over,
});

describe("transactionFor — insertion", () => {
  it("inserts typed text at a collapsed caret", () => {
    const transaction = transactionFor(
      intent({ inputType: "insertText", text: "a", range: { from: 3, to: 3 } })
    );
    expect(transaction).toEqual({
      steps: [{ type: "insert", at: 3, slice: [textNode("a")] }],
      selection: { anchor: 4, head: 4 },
      origin: "user",
    });
  });

  it("replaces a selection with typed text", () => {
    const transaction = transactionFor(
      intent({ inputType: "insertText", text: "X", range: { from: 2, to: 5 } })
    );
    expect(transaction?.steps).toEqual([
      { type: "delete", from: 2, to: 5 },
      { type: "insert", at: 2, slice: [textNode("X")] },
    ]);
    expect(transaction?.selection).toEqual({ anchor: 3, head: 3 });
  });

  it("turns Enter into a single newline character", () => {
    for (const inputType of ["insertParagraph", "insertLineBreak"]) {
      const transaction = transactionFor(
        intent({ inputType, range: { from: 3, to: 3 } })
      );
      expect(transaction?.steps).toEqual([
        { type: "insert", at: 3, slice: [textNode("\n")] },
      ]);
      expect(transaction?.selection).toEqual({ anchor: 4, head: 4 });
    }
  });

  it("handles paste, drop and autocorrect replacement as insertions", () => {
    for (const inputType of [
      "insertFromPaste",
      "insertFromDrop",
      "insertReplacementText",
    ]) {
      const transaction = transactionFor(
        intent({ inputType, text: "hi", range: { from: 1, to: 4 } })
      );
      expect(transaction?.steps).toEqual([
        { type: "delete", from: 1, to: 4 },
        { type: "insert", at: 1, slice: [textNode("hi")] },
      ]);
    }
  });

  it("inserts a pasted slice rather than its text, keeping the mention", () => {
    const slice = [textNode("hi "), atomNode("@Alice", "u_1")];
    const transaction = transactionFor(
      intent({ inputType: "insertFromPaste", text: "hi @Alice", slice, range: { from: 2, to: 2 } })
    );
    expect(transaction?.steps).toEqual([{ type: "insert", at: 2, slice }]);
  });

  it("puts the caret after a pasted mention in position space, not character space", () => {
    // `sliceText(slice).length` is 9 here and `sliceLength(slice)` is 4. Using the former
    // would land the caret past the end of the document — ADR 0005.
    const transaction = transactionFor(
      intent({
        inputType: "insertFromPaste",
        slice: [textNode("hi "), atomNode("@Alice", "u_1")],
        range: { from: 2, to: 2 },
      })
    );
    expect(transaction?.selection).toEqual({ anchor: 6, head: 6 });
  });

  it("dispatches a paste as a command, so it is always its own undo step", () => {
    // `editShapeOf` only coalesces `origin: "user"`. Without this a one-character paste
    // would join whatever typing run it landed in, contradicting history/types.ts.
    for (const inputType of ["insertFromPaste", "insertFromDrop", "insertFromYank"]) {
      const transaction = transactionFor(
        intent({ inputType, slice: [textNode("x")], range: { from: 1, to: 1 } })
      );
      expect(transaction?.origin).toBe("program");
    }
    expect(transactionFor(intent({ inputType: "insertText", text: "x" }))?.origin).toBe(
      "user"
    );
  });

  it("falls back to the transfer's plain text when the slice could not be read", () => {
    const transaction = transactionFor(
      intent({ inputType: "insertFromPaste", text: "hi", slice: null, range: { from: 0, to: 0 } })
    );
    expect(transaction?.steps).toEqual([
      { type: "insert", at: 0, slice: [textNode("hi")] },
    ]);
  });

  it("treats missing data as an empty insertion, deleting any selection", () => {
    const transaction = transactionFor(
      intent({ inputType: "insertText", text: null, range: { from: 1, to: 3 } })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 1, to: 3 }]);
  });
});

describe("transactionFor — deletion", () => {
  it("deletes a selected range regardless of direction", () => {
    for (const inputType of ["deleteContentBackward", "deleteContentForward"]) {
      const transaction = transactionFor(
        intent({ inputType, range: { from: 2, to: 5 } })
      );
      expect(transaction?.steps).toEqual([{ type: "delete", from: 2, to: 5 }]);
      expect(transaction?.selection).toEqual({ anchor: 2, head: 2 });
    }
  });

  it("falls back to one unit backward when the browser gave no range", () => {
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentBackward",
        range: { from: 4, to: 4 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 3, to: 4 }]);
  });

  it("falls back to one unit forward when the browser gave no range", () => {
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentForward",
        range: { from: 4, to: 4 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 4, to: 5 }]);
  });

  it("falls back over a whole emoji rather than half a surrogate pair", () => {
    // ADR 0004 recorded this as knowingly wrong and left it to M6. Deleting one position
    // leaves a lone surrogate: a `?` the user did not type and cannot type away.
    const THUMBS_UP = "\u{1F44D}";
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentBackward",
        doc: createDoc(THUMBS_UP),
        range: { from: 2, to: 2 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 0, to: 2 }]);
  });

  it("falls back over a whole ZWJ sequence", () => {
    const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentBackward",
        doc: createDoc(FAMILY),
        range: { from: 8, to: 8 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 0, to: 8 }]);
  });

  it("falls back over a whole atom, which is still exactly one position", () => {
    // The other half of "one character": ADR 0005 makes an atom one position wide however
    // long its label, so the same fallback has to mean two different things.
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentBackward",
        doc: { nodes: [textNode("hi "), atomNode("@Alice", "u_1")] },
        range: { from: 4, to: 4 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 3, to: 4 }]);
  });

  it("falls back forwards over a whole character too", () => {
    const THUMBS_UP = "\u{1F44D}";
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentForward",
        doc: createDoc(`${THUMBS_UP}x`),
        range: { from: 0, to: 0 },
        rangeFromBrowser: false,
      })
    );
    expect(transaction?.steps).toEqual([{ type: "delete", from: 0, to: 2 }]);
  });

  it("trusts a collapsed range from the browser instead of widening it", () => {
    // The browser saying "delete nothing" is information, not an omission — widening it
    // here is how a word delete becomes a character delete.
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentBackward",
        range: { from: 4, to: 4 },
        rangeFromBrowser: true,
      })
    );
    expect(transaction?.steps).toEqual([]);
  });

  it("never deletes past the start of the document", () => {
    const transaction = transactionFor(
      intent({ inputType: "deleteContentBackward", range: { from: 0, to: 0 } })
    );
    expect(transaction?.steps).toEqual([]);
  });

  it("never deletes past the end of the document", () => {
    const transaction = transactionFor(
      intent({
        inputType: "deleteContentForward",
        range: { from: 10, to: 10 },
      })
    );
    expect(transaction?.steps).toEqual([]);
  });

  it("takes word and line deletes wholesale from the browser's range", () => {
    for (const inputType of [
      "deleteWordBackward",
      "deleteWordForward",
      "deleteSoftLineBackward",
      "deleteHardLineForward",
    ]) {
      const transaction = transactionFor(
        intent({ inputType, range: { from: 4, to: 9 }, rangeFromBrowser: true })
      );
      expect(transaction?.steps).toEqual([{ type: "delete", from: 4, to: 9 }]);
    }
  });

  it("never widens an exact-range deletion", () => {
    for (const inputType of ["deleteByCut", "deleteByDrag", "deleteContent"]) {
      const transaction = transactionFor(
        intent({ inputType, range: { from: 3, to: 3 } })
      );
      expect(transaction?.steps).toEqual([]);
    }
  });
});

describe("transactionFor — unknown input", () => {
  it("returns null rather than guessing", () => {
    expect(transactionFor(intent({ inputType: "formatBold" }))).toBeNull();
    expect(transactionFor(intent({ inputType: "historyUndo" }))).toBeNull();
    expect(transactionFor(intent({ inputType: "" }))).toBeNull();
  });

  it("refuses insertCompositionText, which the composition events own", () => {
    // Handling it here as well would apply the composed text a second time; see ADR 0009.
    expect(
      transactionFor(intent({ inputType: "insertCompositionText", text: "に" }))
    ).toBeNull();
  });
});
