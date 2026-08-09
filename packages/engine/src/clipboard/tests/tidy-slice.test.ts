import { describe, expect, it } from "vitest";
import { atomNode, textNode } from "../../model/nodes";
import { tidySlice } from "../tidy-slice";

describe("tidySlice", () => {
  it("joins whitespace that only doubled up once nodes were merged", () => {
    // `<b>a </b><i> b</i>` collapses to "a " and " b" — neither is wrong on its own.
    expect(tidySlice([textNode("a  b")])).toEqual([textNode("a b")]);
  });

  it("removes the spaces a block boundary leaves beside its newline", () => {
    expect(tidySlice([textNode("one \n two")])).toEqual([textNode("one\ntwo")]);
  });

  it("trims the indentation the fragment opens and closes with", () => {
    expect(tidySlice([textNode("\n  hello  \n")])).toEqual([textNode("hello")]);
  });

  it("trims across atoms without touching what is between them", () => {
    expect(
      tidySlice([
        textNode("\n hi "),
        atomNode("@Alice", "u_1"),
        textNode(" there \n"),
      ])
    ).toEqual([textNode("hi "), atomNode("@Alice", "u_1"), textNode(" there")]);
  });

  it("drops a slice that was nothing but layout whitespace", () => {
    expect(tidySlice([textNode("  \n  ")])).toEqual([]);
  });

  it("leaves an atom-only slice alone", () => {
    expect(tidySlice([atomNode("@Bob", "u_2")])).toEqual([atomNode("@Bob", "u_2")]);
  });
});
