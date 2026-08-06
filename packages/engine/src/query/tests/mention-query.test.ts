import { describe, expect, it } from "vitest";
import { createDoc, emptyDoc } from "../../model/create-doc";
import { atomNode, textNode } from "../../model/nodes";
import type { Doc } from "../../model/types";
import { isWhitespace } from "../../model/is-whitespace";
import { mentionQuery } from "../mention-query";

const NBSP = String.fromCodePoint(0x00a0);

const at = (doc: Doc, caret: number, triggers?: string[]) =>
  mentionQuery({ doc, selection: { anchor: caret, head: caret }, triggers });

describe("mentionQuery — finding a query", () => {
  it("detects a trigger with no query yet", () => {
    expect(at(createDoc("@"), 1)).toEqual({
      trigger: "@",
      query: "",
      from: 0,
      to: 1,
    });
  });

  it("detects a query as it is typed", () => {
    expect(at(createDoc("hi @al"), 6)).toEqual({
      trigger: "@",
      query: "al",
      from: 3,
      to: 6,
    });
  });

  it("excludes the trigger from the query but includes it in the range", () => {
    const query = at(createDoc("@bob"), 4)!;
    expect(query.query).toBe("bob");
    // The range covers the trigger, so replacing it removes the `@` too.
    expect(query.from).toBe(0);
    expect(query.to).toBe(4);
  });

  it("reads only up to the caret, not to the end of the word", () => {
    expect(at(createDoc("@alice"), 3)?.query).toBe("al");
  });

  it("supports an alternative trigger", () => {
    expect(mentionQuery({
      doc: createDoc("see #bug"),
      selection: { anchor: 8, head: 8 },
      triggers: ["#"],
    })).toEqual({ trigger: "#", query: "bug", from: 4, to: 8 });
  });

  it("reports which of several triggers opened the query", () => {
    expect(at(createDoc("#tag"), 4, ["@", "#"])?.trigger).toBe("#");
  });
});

describe("mentionQuery — when there is no query", () => {
  it("returns null for an empty document", () => {
    expect(at(emptyDoc(), 0)).toBeNull();
  });

  it("returns null with no trigger anywhere", () => {
    expect(at(createDoc("hello world"), 11)).toBeNull();
  });

  it("closes the query at whitespace after the trigger", () => {
    expect(at(createDoc("@al bob"), 7)).toBeNull();
  });

  it("closes the query at a newline", () => {
    expect(at(createDoc("@al\nbob"), 7)).toBeNull();
  });

  it("treats a non-breaking space as a boundary too", () => {
    // The archived v2 branch compared against " " and missed this case entirely.
    expect(at(createDoc(`@al${NBSP}bob`), 7)).toBeNull();
  });

  it("returns null when the caret is before the trigger", () => {
    expect(at(createDoc("hi @al"), 2)).toBeNull();
  });

  it("returns null for a range selection", () => {
    expect(
      mentionQuery({
        doc: createDoc("hi @al"),
        selection: { anchor: 3, head: 6 },
      })
    ).toBeNull();
  });

  it("returns null with no selection at all", () => {
    expect(mentionQuery({ doc: createDoc("@al"), selection: null })).toBeNull();
  });

  it("ignores a query longer than the limit", () => {
    const long = `@${"a".repeat(65)}`;
    expect(
      mentionQuery({
        doc: createDoc(long),
        selection: { anchor: long.length, head: long.length },
        maxQueryLength: 64,
      })
    ).toBeNull();
  });
});

describe("mentionQuery — word start", () => {
  it("requires the trigger to start a word, so an email address does not trigger", () => {
    expect(at(createDoc("name@example"), 12)).toBeNull();
  });

  it("accepts a trigger at the very start of the document", () => {
    expect(at(createDoc("@al"), 3)).not.toBeNull();
  });

  it("accepts a trigger after a space", () => {
    expect(at(createDoc("hi @al"), 6)).not.toBeNull();
  });

  it("accepts a trigger after a newline", () => {
    expect(at(createDoc("hi\n@al"), 6)).not.toBeNull();
  });

  it("accepts a trigger after a non-breaking space", () => {
    expect(at(createDoc(`hi${NBSP}@al`), 6)).not.toBeNull();
  });
});

describe("mentionQuery — atoms are hard boundaries", () => {
  const afterAtom: Doc = {
    nodes: [textNode("hi "), atomNode("@Alice", "user-1"), textNode("@al")],
  };

  it("finds a query in the text following an atom", () => {
    // "hi " is 3, the atom is 1, so the trailing text starts at position 4.
    expect(mentionQuery({
      doc: afterAtom,
      selection: { anchor: 7, head: 7 },
    })).toEqual({ trigger: "@", query: "al", from: 4, to: 7 });
  });

  it("returns null with the caret on an atom's trailing edge", () => {
    expect(mentionQuery({ doc: afterAtom, selection: { anchor: 4, head: 4 } })).toBeNull();
  });

  it("never scans back through an atom to find a trigger", () => {
    // The trigger here is the atom's own label text, which is not document text at all.
    const doc: Doc = {
      nodes: [atomNode("@Alice", "user-1"), textNode("bob")],
    };
    expect(mentionQuery({ doc, selection: { anchor: 4, head: 4 } })).toBeNull();
  });

  it("reports positions in position space, not character space", () => {
    // The atom contributes 1, not the 6 characters of "@Alice".
    expect(mentionQuery({
      doc: afterAtom,
      selection: { anchor: 7, head: 7 },
    })?.from).toBe(4);
  });
});

describe("isWhitespace", () => {
  it("matches the obvious ones", () => {
    for (const char of [" ", "\n", "\t"]) expect(isWhitespace(char)).toBe(true);
  });

  it("matches a non-breaking space, unlike an equality check", () => {
    expect(isWhitespace(NBSP)).toBe(true);
    expect(NBSP === " ").toBe(false);
  });

  it("rejects ordinary characters", () => {
    for (const char of ["a", "@", "_", "-"]) expect(isWhitespace(char)).toBe(false);
  });
});
