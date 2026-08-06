import { describe, expect, it } from "vitest";
import { createDoc } from "../create-doc";
import { diffDocs } from "../diff-docs";
import { atomNode, textNode } from "../nodes";
import type { Doc } from "../types";

const doc = (...nodes: Doc["nodes"]): Doc => ({ nodes });

describe("diffDocs", () => {
  it("returns null for identical documents", () => {
    expect(diffDocs(createDoc("hello"), createDoc("hello"))).toBeNull();
  });

  it("narrows an insertion to the characters that changed", () => {
    // The IME case: one text node gained two characters in the middle.
    expect(diffDocs(createDoc("abc"), createDoc("abXYc"))).toEqual({
      from: 2,
      to: 2,
      slice: [textNode("XY")],
    });
  });

  it("narrows a deletion to the characters that changed", () => {
    expect(diffDocs(createDoc("abXYc"), createDoc("abc"))).toEqual({
      from: 2,
      to: 4,
      slice: [],
    });
  });

  it("narrows a replacement", () => {
    expect(diffDocs(createDoc("abXc"), createDoc("abYc"))).toEqual({
      from: 2,
      to: 3,
      slice: [textNode("Y")],
    });
  });

  it("handles an append", () => {
    expect(diffDocs(createDoc("ab"), createDoc("abc"))).toEqual({
      from: 2,
      to: 2,
      slice: [textNode("c")],
    });
  });

  it("handles a prepend", () => {
    expect(diffDocs(createDoc("bc"), createDoc("abc"))).toEqual({
      from: 0,
      to: 0,
      slice: [textNode("a")],
    });
  });

  it("handles filling an empty document", () => {
    expect(diffDocs(createDoc(""), createDoc("hi"))).toEqual({
      from: 0,
      to: 0,
      slice: [textNode("hi")],
    });
  });

  it("handles emptying a document", () => {
    expect(diffDocs(createDoc("hi"), createDoc(""))).toEqual({
      from: 0,
      to: 2,
      slice: [],
    });
  });

  it("keeps a repeated character from confusing the prefix and suffix scan", () => {
    expect(diffDocs(createDoc("aaa"), createDoc("aaaa"))).toEqual({
      from: 3,
      to: 3,
      slice: [textNode("a")],
    });
  });

  describe("with atoms", () => {
    const before = doc(textNode("hi "), atomNode("@Alice", "user-1"), textNode("x"));

    it("leaves an untouched atom out of the diff", () => {
      const after = doc(textNode("hi "), atomNode("@Alice", "user-1"), textNode("xy"));
      // Position 4 is just past the one-wide atom.
      expect(diffDocs(before, after)).toEqual({
        from: 5,
        to: 5,
        slice: [textNode("y")],
      });
    });

    it("reports a removed atom in position space, not character space", () => {
      const after = doc(textNode("hi "), textNode("x"));
      expect(diffDocs(before, after)).toEqual({
        from: 3,
        to: 4,
        slice: [],
      });
    });

    it("reports an added atom", () => {
      const after = doc(
        textNode("hi "),
        atomNode("@Alice", "user-1"),
        atomNode("@Bob", "user-2"),
        textNode("x")
      );
      expect(diffDocs(before, after)).toEqual({
        from: 4,
        to: 4,
        slice: [atomNode("@Bob", "user-2")],
      });
    });

    it("notices an atom whose value changed but whose label did not", () => {
      const after = doc(textNode("hi "), atomNode("@Alice", "user-9"), textNode("x"));
      expect(diffDocs(before, after)).toEqual({
        from: 3,
        to: 4,
        slice: [atomNode("@Alice", "user-9")],
      });
    });

    it("does not narrow across a node boundary", () => {
      // Only a lone changed text node is narrowed; anything else stays node-level, so an
      // atom can never be half-replaced.
      const after = doc(textNode("hi "), atomNode("@Zed", "user-3"), textNode("y"));
      const diff = diffDocs(before, after)!;
      expect(diff.from).toBe(3);
      expect(diff.to).toBe(5);
    });
  });
});
