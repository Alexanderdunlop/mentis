import { describe, expect, it } from "vitest";
import { createDoc, emptyDoc } from "../create-doc";
import { docText } from "../doc-text";
import { applyStep } from "../steps/apply-step";
import type { Step } from "../steps/types";
import type { Doc } from "../types";

const text = (doc: Doc): string => docText(doc);

describe("applyStep — insert", () => {
  it("inserts into the middle of a node", () => {
    const { doc } = applyStep(createDoc("hello"), {
      type: "insert",
      at: 2,
      text: "XY",
    });
    expect(text(doc)).toBe("heXYllo");
  });

  it("inserts at the start and end", () => {
    expect(
      text(applyStep(createDoc("bc"), { type: "insert", at: 0, text: "a" }).doc)
    ).toBe("abc");
    expect(
      text(applyStep(createDoc("ab"), { type: "insert", at: 2, text: "c" }).doc)
    ).toBe("abc");
  });

  it("inserts into an empty document", () => {
    const { doc } = applyStep(emptyDoc(), { type: "insert", at: 0, text: "hi" });
    expect(text(doc)).toBe("hi");
    expect(doc.nodes).toHaveLength(1);
  });

  it("clamps a position past the end", () => {
    const { doc } = applyStep(createDoc("ab"), {
      type: "insert",
      at: 99,
      text: "c",
    });
    expect(text(doc)).toBe("abc");
  });

  it("keeps a newline as one character", () => {
    const { doc } = applyStep(createDoc("ab"), {
      type: "insert",
      at: 1,
      text: "\n",
    });
    expect(text(doc)).toBe("a\nb");
    expect(text(doc)).toHaveLength(3);
  });

  it("leaves the document as a single normalised node", () => {
    const { doc } = applyStep(createDoc("ab"), {
      type: "insert",
      at: 1,
      text: "X",
    });
    expect(doc.nodes).toEqual([{ type: "text", text: "aXb" }]);
  });
});

describe("applyStep — delete", () => {
  it("deletes a range", () => {
    const { doc } = applyStep(createDoc("hello"), {
      type: "delete",
      from: 1,
      to: 3,
    });
    expect(text(doc)).toBe("hlo");
  });

  it("deletes everything, leaving no nodes", () => {
    const { doc } = applyStep(createDoc("hi"), {
      type: "delete",
      from: 0,
      to: 2,
    });
    expect(text(doc)).toBe("");
    expect(doc.nodes).toHaveLength(0);
  });

  it("is a no-op for a collapsed range", () => {
    const { doc } = applyStep(createDoc("hi"), {
      type: "delete",
      from: 1,
      to: 1,
    });
    expect(text(doc)).toBe("hi");
  });

  it("normalises a reversed range", () => {
    const { doc } = applyStep(createDoc("hello"), {
      type: "delete",
      from: 3,
      to: 1,
    });
    expect(text(doc)).toBe("hlo");
  });

  it("clamps a range past the end", () => {
    const { doc } = applyStep(createDoc("hi"), {
      type: "delete",
      from: 1,
      to: 99,
    });
    expect(text(doc)).toBe("h");
  });
});

describe("applyStep — inverses", () => {
  const roundTrip = (start: string, step: Step): string => {
    const doc = createDoc(start);
    const applied = applyStep(doc, step);
    return text(applyStep(applied.doc, applied.inverse).doc);
  };

  it("an insert inverts to the original", () => {
    expect(roundTrip("hello", { type: "insert", at: 2, text: "XY" })).toBe(
      "hello"
    );
  });

  it("a delete inverts to the original, restoring the removed text", () => {
    expect(roundTrip("hello", { type: "delete", from: 1, to: 3 })).toBe("hello");
  });

  it("restores text deleted from an empty-ing document", () => {
    expect(roundTrip("hi", { type: "delete", from: 0, to: 2 })).toBe("hi");
  });

  it("restores a deleted newline", () => {
    expect(roundTrip("a\nb", { type: "delete", from: 1, to: 2 })).toBe("a\nb");
  });

  it("names the inverse of an insert as a delete of what it added", () => {
    const { inverse } = applyStep(createDoc("ab"), {
      type: "insert",
      at: 1,
      text: "XYZ",
    });
    expect(inverse).toEqual({ type: "delete", from: 1, to: 4 });
  });

  it("captures the removed text in the inverse of a delete", () => {
    const { inverse } = applyStep(createDoc("hello"), {
      type: "delete",
      from: 1,
      to: 3,
    });
    expect(inverse).toEqual({ type: "insert", at: 1, text: "el" });
  });
});
