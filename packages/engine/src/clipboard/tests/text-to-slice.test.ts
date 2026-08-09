import { describe, expect, it } from "vitest";
import { textNode } from "../../model/nodes";
import { textToSlice } from "../text-to-slice";

const NBSP = String.fromCodePoint(0x00a0);

describe("textToSlice", () => {
  it("is one text node, because a flat document has nothing else to be", () => {
    expect(textToSlice("hello world")).toEqual([textNode("hello world")]);
  });

  it("normalises on the way in, so nothing downstream has to ask", () => {
    expect(textToSlice(`a\r\nb${NBSP}c`)).toEqual([textNode("a\nb c")]);
  });

  it("keeps deliberate runs of spaces — plain text has no layout to blame", () => {
    expect(textToSlice("a    b")).toEqual([textNode("a    b")]);
  });

  it("yields nothing for an empty string rather than an empty node", () => {
    expect(textToSlice("")).toEqual([]);
  });
});
