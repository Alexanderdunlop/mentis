import { describe, expect, it } from "vitest";
import { createDoc } from "../create-doc";
import { docText } from "../doc-text";
import { applyTransaction, replaceRange } from "../transaction";

describe("applyTransaction", () => {
  it("applies steps in order", () => {
    const applied = applyTransaction(createDoc("hello"), {
      steps: [
        { type: "delete", from: 0, to: 1 },
        { type: "insert", at: 0, text: "J" },
      ],
    });
    expect(docText(applied.doc)).toBe("Jello");
  });

  it("carries the selection through", () => {
    const applied = applyTransaction(createDoc("ab"), {
      steps: [{ type: "insert", at: 2, text: "c" }],
      selection: { anchor: 3, head: 3 },
    });
    expect(applied.selection).toEqual({ anchor: 3, head: 3 });
  });

  it("is a no-op with no steps", () => {
    const doc = createDoc("ab");
    expect(docText(applyTransaction(doc, { steps: [] }).doc)).toBe("ab");
  });

  it("inverts a multi-step transaction back to the original", () => {
    const doc = createDoc("hello world");
    const transaction = { steps: replaceRange(0, 5, "goodbye") };

    const applied = applyTransaction(doc, transaction);
    expect(docText(applied.doc)).toBe("goodbye world");

    const undone = applyTransaction(applied.doc, applied.inverse);
    expect(docText(undone.doc)).toBe("hello world");
  });

  it("orders inverse steps in reverse, so undo unwinds correctly", () => {
    const applied = applyTransaction(createDoc("abc"), {
      steps: [
        { type: "delete", from: 0, to: 1 },
        { type: "insert", at: 0, text: "Z" },
      ],
    });
    expect(applied.inverse.steps).toEqual([
      { type: "delete", from: 0, to: 1 },
      { type: "insert", at: 0, text: "a" },
    ]);
  });

  it("marks the inverse as history, so undo is distinguishable from a user edit", () => {
    const applied = applyTransaction(createDoc("a"), {
      steps: [{ type: "insert", at: 1, text: "b" }],
      origin: "user",
    });
    expect(applied.inverse.origin).toBe("history");
  });

  it("survives a round trip through several transactions", () => {
    let doc = createDoc("one");
    const inverses = [];

    for (const step of [
      { type: "insert", at: 3, text: "\ntwo" },
      { type: "delete", from: 0, to: 1 },
      { type: "insert", at: 0, text: "O" },
    ] as const) {
      const applied = applyTransaction(doc, { steps: [step] });
      doc = applied.doc;
      inverses.unshift(applied.inverse);
    }
    expect(docText(doc)).toBe("One\ntwo");

    for (const inverse of inverses) {
      doc = applyTransaction(doc, inverse).doc;
    }
    expect(docText(doc)).toBe("one");
  });
});

describe("replaceRange", () => {
  it("emits delete then insert for a real replacement", () => {
    expect(replaceRange(1, 3, "X")).toEqual([
      { type: "delete", from: 1, to: 3 },
      { type: "insert", at: 1, text: "X" },
    ]);
  });

  it("omits the delete for a collapsed range", () => {
    expect(replaceRange(2, 2, "X")).toEqual([
      { type: "insert", at: 2, text: "X" },
    ]);
  });

  it("omits the insert for empty text", () => {
    expect(replaceRange(1, 3, "")).toEqual([
      { type: "delete", from: 1, to: 3 },
    ]);
  });

  it("emits nothing when there is nothing to do", () => {
    expect(replaceRange(2, 2, "")).toEqual([]);
  });
});
