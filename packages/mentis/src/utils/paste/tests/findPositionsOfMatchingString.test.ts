import { describe, it, expect } from "vitest";
import { findPositionsOfMatchingString } from "../findPositionsOfMatchingString";

describe("findPositionsOfMatchingString", () => {
  it("should find single occurrence", () => {
    const result = findPositionsOfMatchingString("hello world", "world");
    expect(result).toEqual([6]);
  });

  it("should find multiple occurrences", () => {
    const result = findPositionsOfMatchingString("hello hello hello", "hello");
    expect(result).toEqual([0, 6, 12]);
  });

  it("should return empty array when no match found", () => {
    const result = findPositionsOfMatchingString("hello world", "xyz");
    expect(result).toEqual([]);
  });

  it("should handle empty string", () => {
    const result = findPositionsOfMatchingString("", "hello");
    expect(result).toEqual([]);
  });
});
