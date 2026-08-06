import { describe, expect, it } from "vitest";
import { createDoc, emptyDoc } from "../create-doc";
import { docLength } from "../doc-length";
import { docText } from "../doc-text";
import { atomNode, textNode } from "../nodes";
import { applyStep } from "../steps/apply-step";
import type { Step } from "../steps/types";
import type { Doc } from "../types";

const text = (doc: Doc): string => docText(doc);
const insert = (at: number, ...slice: Doc["nodes"]): Step => ({
  type: "insert",
  at,
  slice,
});

/** "hi " + @Alice + " there" — one atom in the middle, positions 3 and 4 either side. */
const withAtom = (): Doc =>
  applyStep(createDoc("hi there"), insert(3, atomNode("@Alice", "user-1"))).doc;

describe("applyStep — insert", () => {
  it("inserts into the middle of a node", () => {
    expect(text(applyStep(createDoc("hello"), insert(2, textNode("XY"))).doc)).toBe(
      "heXYllo"
    );
  });

  it("inserts at the start and end", () => {
    expect(text(applyStep(createDoc("bc"), insert(0, textNode("a"))).doc)).toBe("abc");
    expect(text(applyStep(createDoc("ab"), insert(2, textNode("c"))).doc)).toBe("abc");
  });

  it("inserts into an empty document", () => {
    const { doc } = applyStep(emptyDoc(), insert(0, textNode("hi")));
    expect(text(doc)).toBe("hi");
    expect(doc.nodes).toHaveLength(1);
  });

  it("clamps a position past the end", () => {
    expect(text(applyStep(createDoc("ab"), insert(99, textNode("c"))).doc)).toBe("abc");
  });

  it("keeps a newline as one character", () => {
    const { doc } = applyStep(createDoc("ab"), insert(1, textNode("\n")));
    expect(text(doc)).toBe("a\nb");
    expect(docLength(doc)).toBe(3);
  });

  it("leaves the document normalised", () => {
    const { doc } = applyStep(createDoc("ab"), insert(1, textNode("X")));
    expect(doc.nodes).toEqual([textNode("aXb")]);
  });
});

describe("applyStep — atoms", () => {
  it("inserts an atom, splitting the surrounding text", () => {
    const doc = withAtom();
    expect(doc.nodes).toEqual([
      textNode("hi "),
      atomNode("@Alice", "user-1"),
      textNode("there"),
    ]);
  });

  it("counts an atom as one position however long its label", () => {
    const doc = withAtom();
    expect(docLength(doc)).toBe(9); // "hi " + 1 + "there"
    expect(docText(doc)).toBe("hi @Alicethere");
    // The two coordinate spaces genuinely differ — ADR 0005.
    expect(docText(doc).length).not.toBe(docLength(doc));
  });

  it("inserts before an atom at its leading edge", () => {
    const { doc } = applyStep(withAtom(), insert(3, textNode("X")));
    expect(doc.nodes).toEqual([
      textNode("hi X"),
      atomNode("@Alice", "user-1"),
      textNode("there"),
    ]);
  });

  it("inserts after an atom at its trailing edge", () => {
    const { doc } = applyStep(withAtom(), insert(4, textNode("X")));
    expect(doc.nodes).toEqual([
      textNode("hi "),
      atomNode("@Alice", "user-1"),
      textNode("Xthere"),
    ]);
  });

  it("deletes an atom whole", () => {
    const { doc } = applyStep(withAtom(), { type: "delete", from: 3, to: 4 });
    expect(doc.nodes).toEqual([textNode("hi there")]);
  });

  it("removes an atom caught in a wider range", () => {
    const { doc } = applyStep(withAtom(), { type: "delete", from: 1, to: 6 });
    expect(doc.nodes).toEqual([textNode("here")]);
  });

  it("keeps an atom the range only touches at its edge", () => {
    const { doc } = applyStep(withAtom(), { type: "delete", from: 0, to: 3 });
    expect(doc.nodes).toEqual([atomNode("@Alice", "user-1"), textNode("there")]);
  });

  it("keeps two atoms with the same label and different values distinct", () => {
    // The thing mentis v1 cannot do, because it re-derives mentions from rendered text.
    let doc = applyStep(emptyDoc(), insert(0, atomNode("@Alex", "user-1"))).doc;
    doc = applyStep(doc, insert(1, atomNode("@Alex", "user-2"))).doc;

    expect(doc.nodes).toEqual([
      atomNode("@Alex", "user-1"),
      atomNode("@Alex", "user-2"),
    ]);
    expect(docLength(doc)).toBe(2);
  });

  it("never merges adjacent atoms", () => {
    let doc = applyStep(emptyDoc(), insert(0, atomNode("a", "1"))).doc;
    doc = applyStep(doc, insert(1, atomNode("b", "2"))).doc;
    expect(doc.nodes).toHaveLength(2);
  });
});

describe("applyStep — delete", () => {
  it("deletes a range", () => {
    expect(
      text(applyStep(createDoc("hello"), { type: "delete", from: 1, to: 3 }).doc)
    ).toBe("hlo");
  });

  it("deletes everything, leaving no nodes", () => {
    const { doc } = applyStep(createDoc("hi"), { type: "delete", from: 0, to: 2 });
    expect(text(doc)).toBe("");
    expect(doc.nodes).toHaveLength(0);
  });

  it("is a no-op for a collapsed range", () => {
    expect(
      text(applyStep(createDoc("hi"), { type: "delete", from: 1, to: 1 }).doc)
    ).toBe("hi");
  });

  it("normalises a reversed range", () => {
    expect(
      text(applyStep(createDoc("hello"), { type: "delete", from: 3, to: 1 }).doc)
    ).toBe("hlo");
  });

  it("clamps a range past the end", () => {
    expect(
      text(applyStep(createDoc("hi"), { type: "delete", from: 1, to: 99 }).doc)
    ).toBe("h");
  });
});

describe("applyStep — inverses", () => {
  const roundTrip = (doc: Doc, step: Step): Doc => {
    const applied = applyStep(doc, step);
    return applyStep(applied.doc, applied.inverse).doc;
  };

  it("an insert inverts to the original", () => {
    expect(text(roundTrip(createDoc("hello"), insert(2, textNode("XY"))))).toBe(
      "hello"
    );
  });

  it("a delete inverts to the original, restoring the removed text", () => {
    expect(
      text(roundTrip(createDoc("hello"), { type: "delete", from: 1, to: 3 }))
    ).toBe("hello");
  });

  it("restores a deleted newline", () => {
    expect(
      text(roundTrip(createDoc("a\nb"), { type: "delete", from: 1, to: 2 }))
    ).toBe("a\nb");
  });

  it("restores a deleted atom with its value intact", () => {
    expect(roundTrip(withAtom(), { type: "delete", from: 3, to: 4 }).nodes).toEqual(
      [textNode("hi "), atomNode("@Alice", "user-1"), textNode("there")]
    );
  });

  it("restores a mixed range of text and atoms", () => {
    expect(roundTrip(withAtom(), { type: "delete", from: 1, to: 6 }).nodes).toEqual(
      [textNode("hi "), atomNode("@Alice", "user-1"), textNode("there")]
    );
  });

  it("names the inverse of an insert as a delete of the positions it added", () => {
    const { inverse } = applyStep(createDoc("ab"), insert(1, textNode("XYZ")));
    expect(inverse).toEqual({ type: "delete", from: 1, to: 4 });
  });

  it("measures an atom insert as one position in its inverse", () => {
    const { inverse } = applyStep(createDoc("ab"), insert(1, atomNode("@long", "v")));
    expect(inverse).toEqual({ type: "delete", from: 1, to: 2 });
  });

  it("captures the removed slice in the inverse of a delete", () => {
    const { inverse } = applyStep(createDoc("hello"), {
      type: "delete",
      from: 1,
      to: 3,
    });
    expect(inverse).toEqual({
      type: "insert",
      at: 1,
      slice: [textNode("el")],
    });
  });
});
