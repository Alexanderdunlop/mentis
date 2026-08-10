import { describe, expect, it } from "vitest";
import { positionAfter, positionBefore } from "../adjacent-position";
import { createDoc } from "../create-doc";
import { atomNode, textNode } from "../nodes";
import type { Doc } from "../types";

const THUMBS_UP = "\u{1F44D}";
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";

const doc = (...nodes: Doc["nodes"]): Doc => ({ nodes });

describe("positionBefore — the two things 'one character' means", () => {
  it("is one position for an atom, however long its label reads", () => {
    // ADR 0005: an atom is one position wide, so stepping over `@Alice` is a step of 1.
    const withMention = doc(textNode("hi "), atomNode("@Alice", "u_1"));
    expect(positionBefore(withMention, 4)).toBe(3);
  });

  it("is the whole grapheme for an emoji, not one code unit", () => {
    // The bug ADR 0004 recorded and deferred: deleting one position leaves a lone
    // surrogate, which renders as `?` and cannot be typed away.
    expect(positionBefore(createDoc(THUMBS_UP), 2)).toBe(0);
  });

  it("takes an entire ZWJ sequence as one character", () => {
    expect(positionBefore(createDoc(FAMILY), 8)).toBe(0);
  });

  it("is an ordinary step through plain text", () => {
    expect(positionBefore(createDoc("hello"), 5)).toBe(4);
  });

  it("stops at the start of the document", () => {
    expect(positionBefore(createDoc("hello"), 0)).toBe(0);
    expect(positionBefore(createDoc(""), 0)).toBe(0);
  });

  it("crosses out of a node into the one before it", () => {
    const mixed = doc(textNode(`a${THUMBS_UP}`), atomNode("@Bob", "u_2"), textNode("b"));
    // Positions: a=0, emoji=1..2, atom=3, "b"=4. Total length 5.
    expect(positionBefore(mixed, 5)).toBe(4); // over "b"
    expect(positionBefore(mixed, 4)).toBe(3); // over the whole atom
    expect(positionBefore(mixed, 3)).toBe(1); // over the whole emoji
    expect(positionBefore(mixed, 1)).toBe(0); // over "a"
  });
});

describe("positionAfter", () => {
  it("steps over a whole atom", () => {
    const withMention = doc(atomNode("@Alice", "u_1"), textNode(" hi"));
    expect(positionAfter(withMention, 0)).toBe(1);
  });

  it("steps over a whole grapheme", () => {
    expect(positionAfter(createDoc(THUMBS_UP), 0)).toBe(2);
    expect(positionAfter(createDoc(FAMILY), 0)).toBe(8);
  });

  it("stops at the end of the document", () => {
    expect(positionAfter(createDoc("hello"), 5)).toBe(5);
    expect(positionAfter(createDoc(""), 0)).toBe(0);
  });

  it("crosses out of a node into the one after it", () => {
    const mixed = doc(textNode("a"), atomNode("@Bob", "u_2"), textNode(`${THUMBS_UP}b`));
    // Positions: "a"=0, atom=1, emoji=2..3, "b"=4. Total length 5.
    expect(positionAfter(mixed, 0)).toBe(1); // over "a"
    expect(positionAfter(mixed, 1)).toBe(2); // over the whole atom
    expect(positionAfter(mixed, 2)).toBe(4); // over the whole emoji
    expect(positionAfter(mixed, 4)).toBe(5); // over "b"
  });
});

describe("the two are inverses across a document of nasty input", () => {
  it("walks forwards and back to where it started", () => {
    const nasty = doc(
      textNode(`a${THUMBS_UP}${FAMILY}`),
      atomNode("@Alice", "u_1"),
      textNode(`e\u{0301}\u{1F1F3}\u{1F1FF}`)
    );

    const visited: number[] = [];
    for (let at = 0; at < 30; ) {
      visited.push(at);
      const next = positionAfter(nasty, at);
      if (next === at) break;
      at = next;
    }

    for (const at of visited) {
      if (at === 0) continue;
      expect(positionAfter(nasty, positionBefore(nasty, at))).toBe(at);
    }
  });
});
