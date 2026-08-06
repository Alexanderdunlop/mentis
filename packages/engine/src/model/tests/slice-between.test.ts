import { describe, expect, it } from "vitest";
import { createDoc } from "../create-doc";
import { docLength } from "../doc-length";
import { docText } from "../doc-text";
import { mentions } from "../mentions";
import { atomNode, nodeText, textNode } from "../nodes";
import { sliceBetween, sliceLength, sliceText } from "../slice-between";
import { textBetween } from "../text-between";
import type { Doc } from "../types";

/** "hi " + @Alice + "there" — nine positions, fourteen visible characters. */
const withAtom: Doc = {
  nodes: [textNode("hi "), atomNode("@Alice", "user-1"), textNode("there")],
};

describe("sliceBetween", () => {
  it("takes a substring from plain text", () => {
    expect(sliceBetween(createDoc("hello"), 1, 3)).toEqual([textNode("el")]);
  });

  it("is empty for a collapsed range", () => {
    expect(sliceBetween(createDoc("hello"), 2, 2)).toEqual([]);
  });

  it("normalises a reversed range", () => {
    expect(sliceBetween(createDoc("hello"), 3, 1)).toEqual([textNode("el")]);
  });

  it("clamps past the document end", () => {
    expect(sliceBetween(createDoc("hi"), 1, 99)).toEqual([textNode("i")]);
  });

  it("includes an atom the range covers whole", () => {
    expect(sliceBetween(withAtom, 3, 4)).toEqual([atomNode("@Alice", "user-1")]);
  });

  it("excludes an atom the range only reaches the edge of", () => {
    expect(sliceBetween(withAtom, 0, 3)).toEqual([textNode("hi ")]);
    expect(sliceBetween(withAtom, 4, 9)).toEqual([textNode("there")]);
  });

  it("returns a mixed run in order", () => {
    expect(sliceBetween(withAtom, 1, 6)).toEqual([
      textNode("i "),
      atomNode("@Alice", "user-1"),
      textNode("th"),
    ]);
  });

  it("returns the whole document for a full range", () => {
    expect(sliceBetween(withAtom, 0, docLength(withAtom))).toEqual(withAtom.nodes);
  });

  it("returns a normalised slice", () => {
    // No empty text nodes at the seams where the range cut mid-node.
    expect(sliceBetween(withAtom, 3, 9).map(nodeText)).toEqual(["@Alice", "there"]);
  });
});

describe("sliceLength vs sliceText", () => {
  it("measures an atom as one position but many characters", () => {
    const slice = sliceBetween(withAtom, 3, 4);
    expect(sliceLength(slice)).toBe(1);
    expect(sliceText(slice)).toBe("@Alice");
  });

  it("agrees for plain text", () => {
    const slice = sliceBetween(createDoc("hello"), 0, 5);
    expect(sliceLength(slice)).toBe(5);
    expect(sliceText(slice)).toHaveLength(5);
  });
});

describe("docText vs docLength", () => {
  it("diverges once the document holds an atom", () => {
    expect(docText(withAtom)).toBe("hi @Alicethere");
    expect(docLength(withAtom)).toBe(9);
  });

  it("agrees for a document of plain text", () => {
    const doc = createDoc("hello\nworld");
    expect(docText(doc)).toHaveLength(docLength(doc));
  });
});

describe("textBetween", () => {
  it("measures in positions but returns characters", () => {
    // Range 3–4 is one position wide and yields six characters.
    expect(textBetween(withAtom, 3, 4)).toBe("@Alice");
  });

  it("reads plain text normally", () => {
    expect(textBetween(createDoc("hello"), 1, 3)).toBe("el");
  });
});

describe("mentions", () => {
  it("lists mentions with their positions", () => {
    expect(mentions(withAtom)).toEqual([
      { label: "@Alice", value: "user-1", at: 3 },
    ]);
  });

  it("is empty for a document with no atoms", () => {
    expect(mentions(createDoc("plain"))).toEqual([]);
  });

  it("distinguishes two mentions sharing a label", () => {
    const doc: Doc = {
      nodes: [atomNode("@Alex", "user-1"), textNode(" and "), atomNode("@Alex", "user-2")],
    };
    expect(mentions(doc)).toEqual([
      { label: "@Alex", value: "user-1", at: 0 },
      { label: "@Alex", value: "user-2", at: 6 },
    ]);
  });
});
