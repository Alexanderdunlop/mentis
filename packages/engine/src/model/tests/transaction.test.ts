import { describe, expect, it } from "vitest";
import { createDoc } from "../create-doc";
import { docText } from "../doc-text";
import { atomNode, textNode } from "../nodes";
import {
  applyTransaction,
  replaceRange,
  replaceWithText,
} from "../transaction";
import type { Step } from "../steps/types";

describe("applyTransaction", () => {
  it("applies steps in order", () => {
    const applied = applyTransaction(createDoc("hello"), {
      steps: [
        { type: "delete", from: 0, to: 1 },
        { type: "insert", at: 0, slice: [textNode("J")] },
      ],
    });
    expect(docText(applied.doc)).toBe("Jello");
  });

  it("carries the selection through", () => {
    const applied = applyTransaction(createDoc("ab"), {
      steps: [{ type: "insert", at: 2, slice: [textNode("c")] }],
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
    const applied = applyTransaction(doc, {
      steps: replaceWithText(0, 5, "goodbye"),
    });
    expect(docText(applied.doc)).toBe("goodbye world");

    const undone = applyTransaction(applied.doc, applied.inverse);
    expect(docText(undone.doc)).toBe("hello world");
  });

  it("orders inverse steps in reverse, so undo unwinds correctly", () => {
    const applied = applyTransaction(createDoc("abc"), {
      steps: [
        { type: "delete", from: 0, to: 1 },
        { type: "insert", at: 0, slice: [textNode("Z")] },
      ],
    });
    expect(applied.inverse.steps).toEqual([
      { type: "delete", from: 0, to: 1 },
      { type: "insert", at: 0, slice: [textNode("a")] },
    ]);
  });

  it("marks the inverse as history, so undo is distinguishable from a user edit", () => {
    const applied = applyTransaction(createDoc("a"), {
      steps: [{ type: "insert", at: 1, slice: [textNode("b")] }],
      origin: "user",
    });
    expect(applied.inverse.origin).toBe("history");
  });

  it("survives a round trip through several transactions", () => {
    let doc = createDoc("one");
    const inverses = [];

    const steps: Step[] = [
      { type: "insert", at: 3, slice: [textNode("\ntwo")] },
      { type: "delete", from: 0, to: 1 },
      { type: "insert", at: 0, slice: [textNode("O")] },
    ];

    for (const step of steps) {
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

  it("restores a deleted mention as a mention, not as its label text", () => {
    // The reason steps carry slices rather than strings: a string-based inverse would
    // bring the chip back as plain text, silently, and only on undo.
    const doc = applyTransaction(createDoc("hi "), {
      steps: [{ type: "insert", at: 3, slice: [atomNode("@Alice", "user-1")] }],
    }).doc;

    const deleted = applyTransaction(doc, {
      steps: [{ type: "delete", from: 3, to: 4 }],
    });
    expect(deleted.doc.nodes).toEqual([textNode("hi ")]);

    const undone = applyTransaction(deleted.doc, deleted.inverse);
    expect(undone.doc.nodes).toEqual([
      textNode("hi "),
      atomNode("@Alice", "user-1"),
    ]);
  });
});

describe("replaceRange", () => {
  it("emits delete then insert for a real replacement", () => {
    expect(replaceRange(1, 3, [textNode("X")])).toEqual([
      { type: "delete", from: 1, to: 3 },
      { type: "insert", at: 1, slice: [textNode("X")] },
    ]);
  });

  it("omits the delete for a collapsed range", () => {
    expect(replaceRange(2, 2, [textNode("X")])).toEqual([
      { type: "insert", at: 2, slice: [textNode("X")] },
    ]);
  });

  it("omits the insert for an empty slice", () => {
    expect(replaceRange(1, 3, [])).toEqual([{ type: "delete", from: 1, to: 3 }]);
  });

  it("emits nothing when there is nothing to do", () => {
    expect(replaceRange(2, 2, [])).toEqual([]);
  });

  it("inserts an atom", () => {
    expect(replaceRange(0, 0, [atomNode("@Bob", "user-2")])).toEqual([
      { type: "insert", at: 0, slice: [atomNode("@Bob", "user-2")] },
    ]);
  });
});

describe("replaceWithText", () => {
  it("wraps text into a slice", () => {
    expect(replaceWithText(1, 3, "X")).toEqual([
      { type: "delete", from: 1, to: 3 },
      { type: "insert", at: 1, slice: [textNode("X")] },
    ]);
  });

  it("emits only a delete for empty text", () => {
    expect(replaceWithText(1, 3, "")).toEqual([
      { type: "delete", from: 1, to: 3 },
    ]);
  });
});
