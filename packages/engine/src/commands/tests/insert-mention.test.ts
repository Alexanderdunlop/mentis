import { describe, expect, it } from "vitest";
import { createDoc } from "../../model/create-doc";
import { docLength } from "../../model/doc-length";
import { mentions } from "../../model/mentions";
import { atomNode, textNode } from "../../model/nodes";
import { applyTransaction } from "../../model/transaction";
import { insertMention } from "../insert-mention";

const apply = (text: string, at: number, to = at) =>
  applyTransaction(
    createDoc(text),
    insertMention({
      label: "@Alice",
      value: "user-1",
      range: { from: at, to },
    })
  );

describe("insertMention", () => {
  it("inserts an atom followed by a space", () => {
    const { doc } = apply("hi ", 3);
    expect(doc.nodes).toEqual([
      textNode("hi "),
      atomNode("@Alice", "user-1"),
      textNode(" "),
    ]);
  });

  it("leaves the caret after the trailing space, outside the atom", () => {
    const { selection } = apply("hi ", 3);
    // 3 + one for the atom + one for the space.
    expect(selection).toEqual({ anchor: 5, head: 5 });
  });

  it("measures the atom as one position, not as its label length", () => {
    const { doc, selection } = apply("", 0);
    expect(docLength(doc)).toBe(2);
    expect(selection?.head).toBe(2);
  });

  it("replaces the range it is given, which is how a trigger and query disappear", () => {
    const { doc } = apply("hi @al", 3, 6);
    expect(doc.nodes).toEqual([
      textNode("hi "),
      atomNode("@Alice", "user-1"),
      textNode(" "),
    ]);
  });

  it("omits the trailing space when asked", () => {
    const { doc, selection } = applyTransaction(
      createDoc(""),
      insertMention({
        label: "@Alice",
        value: "user-1",
        range: { from: 0, to: 0 },
        trailingSpace: false,
      })
    );
    expect(doc.nodes).toEqual([atomNode("@Alice", "user-1")]);
    expect(selection).toEqual({ anchor: 1, head: 1 });
  });

  it("records the value, so two mentions sharing a label stay distinct", () => {
    let doc = createDoc("");
    for (const value of ["user-1", "user-2"]) {
      doc = applyTransaction(
        doc,
        insertMention({
          label: "@Alex",
          value,
          range: { from: docLength(doc), to: docLength(doc) },
        })
      ).doc;
    }
    expect(mentions(doc).map((mention) => mention.value)).toEqual([
      "user-1",
      "user-2",
    ]);
  });

  it("is undoable back to the original document", () => {
    const doc = createDoc("hi ");
    const applied = applyTransaction(
      doc,
      insertMention({ label: "@Alice", value: "user-1", range: { from: 3, to: 3 } })
    );
    const undone = applyTransaction(applied.doc, applied.inverse);
    expect(undone.doc).toEqual(doc);
  });
});
