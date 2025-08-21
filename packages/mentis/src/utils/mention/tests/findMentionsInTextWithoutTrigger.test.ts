import { describe, it, expect } from "vitest";
import { findMentionsInTextWithoutTrigger } from "../findMentionsInTextWithoutTrigger";

describe("findMentionsInTextWithoutTrigger", () => {
  it("should find mentions without trigger", () => {
    const options = [
      { label: "Alice", value: "alice" },
      { label: "Bob", value: "bob" },
    ];
    const result = findMentionsInTextWithoutTrigger(
      "Hello Alice and Bob",
      options
    );
    expect(result).toHaveLength(2);
    expect(result[0].match[0]).toBe("Alice");
    expect(result[1].match[0]).toBe("Bob");
  });

  it("should return empty array when no mentions found", () => {
    const options = [
      { label: "Alice", value: "alice" },
      { label: "Bob", value: "bob" },
    ];
    const result = findMentionsInTextWithoutTrigger("Hello world", options);
    expect(result).toHaveLength(0);
  });

  it("should handle case insensitive matching", () => {
    const options = [{ label: "Alice", value: "alice" }];
    const result = findMentionsInTextWithoutTrigger(
      "Hello alice and ALICE",
      options
    );
    expect(result).toHaveLength(2);
    expect(result[0].match[0]).toBe("alice");
    expect(result[1].match[0]).toBe("ALICE");
  });
});
