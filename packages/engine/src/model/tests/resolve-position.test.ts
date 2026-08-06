import { describe, expect, it } from "vitest";
import { createDoc, emptyDoc } from "../create-doc";
import { normalise } from "../normalise";
import { clampPosition, resolvePosition } from "../resolve-position";
import type { Doc } from "../types";

/** Built directly, bypassing normalise, to exercise the multi-node case M2 introduces. */
const twoNodes: Doc = { nodes: [{ type: "text", text: "ab" }, { type: "text", text: "cd" }] };

describe("resolvePosition", () => {
  it("finds a position inside the only node", () => {
    expect(resolvePosition(createDoc("hello"), 3)).toEqual({
      index: 0,
      offset: 3,
    });
  });

  it("resolves the start of the document", () => {
    expect(resolvePosition(createDoc("hello"), 0)).toEqual({
      index: 0,
      offset: 0,
    });
  });

  it("resolves the end of the document to the end of the last node", () => {
    expect(resolvePosition(createDoc("hello"), 5)).toEqual({
      index: 0,
      offset: 5,
    });
  });

  it("prefers the earlier node at a boundary between two", () => {
    // Position 2 is both the end of "ab" and the start of "cd"; the stated rule is
    // that the earlier node wins.
    expect(resolvePosition(twoNodes, 2)).toEqual({ index: 0, offset: 2 });
  });

  it("resolves into the second node past the boundary", () => {
    expect(resolvePosition(twoNodes, 3)).toEqual({ index: 1, offset: 1 });
  });

  it("clamps a position past the end", () => {
    expect(resolvePosition(createDoc("ab"), 99)).toEqual({
      index: 0,
      offset: 2,
    });
  });

  it("clamps a negative position", () => {
    expect(resolvePosition(createDoc("ab"), -5)).toEqual({
      index: 0,
      offset: 0,
    });
  });

  it("has no node to land in for an empty document", () => {
    expect(resolvePosition(emptyDoc(), 0)).toEqual({ index: 0, offset: 0 });
  });

  it("counts a newline as one position", () => {
    expect(resolvePosition(createDoc("a\nb"), 2)).toEqual({
      index: 0,
      offset: 2,
    });
  });
});

describe("clampPosition", () => {
  it("bounds to the document", () => {
    const doc = createDoc("abc");
    expect(clampPosition(doc, -1)).toBe(0);
    expect(clampPosition(doc, 2)).toBe(2);
    expect(clampPosition(doc, 99)).toBe(3);
  });
});

describe("normalise", () => {
  it("drops empty text nodes", () => {
    expect(normalise({ nodes: [{ type: "text", text: "" }] }).nodes).toEqual([]);
  });

  it("merges adjacent text nodes, so equal text means equal structure", () => {
    expect(normalise(twoNodes).nodes).toEqual([{ type: "text", text: "abcd" }]);
  });

  it("leaves an already-canonical document unchanged", () => {
    const doc = createDoc("abc");
    expect(normalise(doc)).toEqual(doc);
  });
});
