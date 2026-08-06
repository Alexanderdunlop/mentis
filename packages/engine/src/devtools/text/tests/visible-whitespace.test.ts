import { describe, expect, it } from "vitest";
import { visibleWhitespace, WHITESPACE } from "../visible-whitespace";

// Named, not typed literally — an invisible character in a test is an untrustworthy test.
const { noBreakSpace, zeroWidthSpace, zeroWidthNoBreakSpace, tab, newline } =
  WHITESPACE;

describe("visibleWhitespace", () => {
  it("marks spaces, newlines and tabs", () => {
    expect(visibleWhitespace(`a b${newline}c${tab}d`)).toBe("a·b⏎c⇥d");
  });

  it("distinguishes a non-breaking space from a normal one", () => {
    expect(visibleWhitespace("a b")).toBe("a·b");
    expect(visibleWhitespace(`a${noBreakSpace}b`)).toBe("a⍽b");
  });

  it("marks zero-width characters", () => {
    expect(visibleWhitespace(`a${zeroWidthSpace}b`)).toBe("a⌀b");
    expect(visibleWhitespace(`a${zeroWidthNoBreakSpace}b`)).toBe("a⌀b");
  });

  it("leaves other characters alone", () => {
    expect(visibleWhitespace("héllo👋")).toBe("héllo👋");
  });

  it("is length-preserving, so selection offsets stay valid", () => {
    const samples = [
      "a b",
      `a${noBreakSpace}b`,
      `x${tab}y${newline}z`,
      "plain",
      zeroWidthSpace,
      "",
    ];
    for (const sample of samples) {
      expect(visibleWhitespace(sample)).toHaveLength(sample.length);
    }
  });

  it("maps every whitespace source it declares", () => {
    for (const source of Object.values(WHITESPACE)) {
      expect(visibleWhitespace(source)).not.toBe(source);
    }
  });
});
