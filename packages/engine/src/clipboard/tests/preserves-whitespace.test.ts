import { describe, expect, it } from "vitest";
import { preservesWhitespace } from "../preserves-whitespace";

describe("preservesWhitespace", () => {
  it("recognises the elements that are significant without saying so", () => {
    expect(preservesWhitespace("pre", null)).toBe(true);
    expect(preservesWhitespace("TEXTAREA", null)).toBe(true);
  });

  it("recognises the declarations that say so", () => {
    for (const value of ["pre", "pre-wrap", "break-spaces"]) {
      expect(preservesWhitespace("span", `white-space: ${value};`)).toBe(true);
    }
  });

  it("reads the declaration the engine's own copy writes", () => {
    expect(preservesWhitespace("span", "white-space:pre-wrap;")).toBe(true);
  });

  it("does not mistake pre-line for a preserving context", () => {
    // `pre-line` keeps newlines but still collapses spaces, so for our purposes it is a
    // collapsing context. This is the case the negative lookahead exists for.
    expect(preservesWhitespace("span", "white-space: pre-line")).toBe(false);
  });

  it("is false for an ordinary element", () => {
    expect(preservesWhitespace("div", null)).toBe(false);
    expect(preservesWhitespace("div", "color: red")).toBe(false);
  });
});
