import { describe, it, expect } from "vitest";
import { findMentionsInTextWithTrigger } from "../findMentionsInTextWithTrigger";

describe("findMentionsInTextWithTrigger", () => {
  it("should find mentions with @ trigger", () => {
    const result = findMentionsInTextWithTrigger("Hello @Alice and @Bob", "@");
    expect(result).toHaveLength(2);
    expect(result[0].match[0]).toBe("@Alice");
    expect(result[1].match[0]).toBe("@Bob");
  });

  it("should return empty array when no mentions found", () => {
    const result = findMentionsInTextWithTrigger("Hello world", "@");
    expect(result).toHaveLength(0);
  });

  it("should handle custom trigger character", () => {
    const result = findMentionsInTextWithTrigger("Hello #Alice and #Bob", "#");
    expect(result).toHaveLength(2);
    expect(result[0].match[0]).toBe("#Alice");
    expect(result[1].match[0]).toBe("#Bob");
  });
});
