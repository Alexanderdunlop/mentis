import { describe, expect, it } from "vitest";
import { createDoc } from "../create-doc";
import { atomAhead, nodeAhead } from "../node-ahead";
import { atomNode, textNode } from "../nodes";

const ALICE = atomNode("@Alice", "u_1");

describe("nodeAhead", () => {
  it("looks into the node containing the position", () => {
    expect(nodeAhead(createDoc("abc"), 1)).toEqual({
      node: textNode("abc"),
      offset: 1,
    });
  });

  it("crosses a node boundary rather than stalling at a trailing edge", () => {
    // The whole reason this exists. `resolvePosition` puts position 2 at the *end of*
    // "ab"; the character ahead belongs to the next node, and a caller that missed this
    // would look at "ab" with no offset left to step into.
    const doc = { nodes: [textNode("ab"), textNode("cd")] };
    expect(nodeAhead(doc, 2)).toEqual({ node: textNode("cd"), offset: 0 });
  });

  it("returns null at the end of the document", () => {
    expect(nodeAhead(createDoc("abc"), 3)).toBeNull();
    expect(nodeAhead(createDoc("abc"), 99)).toBeNull();
  });

  it("returns null for an empty document", () => {
    expect(nodeAhead({ nodes: [] }, 0)).toBeNull();
  });

  it("finds an atom that begins at the position", () => {
    const doc = { nodes: [textNode("ab"), ALICE] };
    expect(nodeAhead(doc, 2)).toEqual({ node: ALICE, offset: 0 });
  });
});

describe("atomAhead", () => {
  it("finds an atom at the start of the document", () => {
    expect(atomAhead({ nodes: [ALICE, textNode(" hi")] }, 0)).toEqual(ALICE);
  });

  it("finds a trailing atom", () => {
    expect(atomAhead({ nodes: [textNode("ab"), ALICE] }, 2)).toEqual(ALICE);
  });

  it("is null one position later, where the atom is already behind", () => {
    // An atom is one position wide (ADR 0005), so position 1 is past this one. Getting
    // this wrong would clamp a delete that should belong to the following text.
    expect(atomAhead({ nodes: [ALICE, textNode(" hi")] }, 1)).toBeNull();
  });

  it("is null in plain text and at the end of the document", () => {
    expect(atomAhead(createDoc("abc"), 1)).toBeNull();
    expect(atomAhead({ nodes: [textNode("ab"), ALICE] }, 3)).toBeNull();
  });

  it("is null between two atoms only for the second one's far side", () => {
    const doc = { nodes: [ALICE, atomNode("@Bob", "u_2")] };
    expect(atomAhead(doc, 0)).toEqual(ALICE);
    expect(atomAhead(doc, 1)).toEqual(atomNode("@Bob", "u_2"));
    expect(atomAhead(doc, 2)).toBeNull();
  });
});
