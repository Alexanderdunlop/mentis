import { describe, expect, it } from "vitest";
import { transactionFor } from "../transaction-for";
import type { InputIntent } from "../types";

const intent = (over: Partial<InputIntent>): InputIntent => ({
  inputType: "insertText",
  text: null,
  range: { from: 0, to: 0 },
  rangeFromBrowser: false,
  docLength: 10,
  ...over,
});

describe("transactionFor — insertion", () => {
  it("inserts typed text at a collapsed caret", () => {
    const transaction = transactionFor(
      intent({ inputType: "insertText", text: "a", range: { from: 3, to: 3 } })
    );
    expect(transaction).toEqual({
      steps: [{ type: "insert", at: 3, text: "a" }],
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
      { type: "insert", at: 2, text: "X" },
    ]);
    expect(transaction?.selection).toEqual({ anchor: 3, head: 3 });
  });

  it("turns Enter into a single newline character", () => {
    for (const inputType of ["insertParagraph", "insertLineBreak"]) {
      const transaction = transactionFor(
        intent({ inputType, range: { from: 3, to: 3 } })
      );
      expect(transaction?.steps).toEqual([
        { type: "insert", at: 3, text: "\n" },
      ]);
      expect(transaction?.selection).toEqual({ anchor: 4, head: 4 });
    }
  });

  it("handles paste, drop and autocorrect replacement as insertions", () => {
    for (const inputType of [
      "insertFromPaste",
      "insertFromDrop",
      "insertReplacementText",
      "insertCompositionText",
    ]) {
      const transaction = transactionFor(
        intent({ inputType, text: "hi", range: { from: 1, to: 4 } })
      );
      expect(transaction?.steps).toEqual([
        { type: "delete", from: 1, to: 4 },
        { type: "insert", at: 1, text: "hi" },
      ]);
    }
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
        docLength: 10,
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
});
