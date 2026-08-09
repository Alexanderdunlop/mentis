import { describe, expect, it } from "vitest";
import { collapseWhitespace } from "../collapse-whitespace";

const NBSP = String.fromCodePoint(0x00a0);

describe("collapseWhitespace", () => {
  it("turns source indentation into a single space, as HTML layout would", () => {
    expect(collapseWhitespace("\n    hi\n")).toBe(" hi ");
  });

  it("collapses tabs and newlines alike", () => {
    expect(collapseWhitespace("a\t\t b\n\nc")).toBe("a b c");
  });

  it("does not collapse a non-breaking space, which is why authors use it", () => {
    expect(collapseWhitespace(`a${NBSP}${NBSP}b`)).toBe(`a${NBSP}${NBSP}b`);
  });

  it("leaves text with no runs untouched", () => {
    expect(collapseWhitespace("hello world")).toBe("hello world");
  });
});
