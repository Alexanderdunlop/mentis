import { describe, it, expect } from "vitest";
import { extractQuery } from "../extract-query";

describe("extractQuery", () => {
  it("should extract valid query without whitespace", () => {
    const result = extractQuery({
      text: "hi @john",
      startIndex: 3,
      endIndex: 7,
    });

    expect(result).toEqual({
      query: "john",
      isValid: true,
    });
  });

  it("should extract query with special characters", () => {
    const result = extractQuery({
      text: "hi @user-123",
      startIndex: 3,
      endIndex: 11,
    });

    expect(result).toEqual({
      query: "user-123",
      isValid: true,
    });
  });

  it("should extract empty query", () => {
    const result = extractQuery({
      text: "hi @",
      startIndex: 3,
      endIndex: 3,
    });

    expect(result).toEqual({
      query: "",
      isValid: true,
    });
  });

  it("should extract single character query", () => {
    const result = extractQuery({
      text: "hi @j",
      startIndex: 3,
      endIndex: 4,
    });

    expect(result).toEqual({
      query: "j",
      isValid: true,
    });
  });

  it("should mark query as invalid when it contains space", () => {
    const result = extractQuery({
      text: "hi @john doe",
      startIndex: 3,
      endIndex: 11,
    });

    expect(result).toEqual({
      query: "john doe",
      isValid: false,
    });
  });

  it("should mark query as invalid when it contains newline", () => {
    const result = extractQuery({
      text: "hi @john\ndoe",
      startIndex: 3,
      endIndex: 11,
    });

    expect(result).toEqual({
      query: "john\ndoe",
      isValid: false,
    });
  });

  it("should mark query as invalid when it contains tab", () => {
    const result = extractQuery({
      text: "hi @john\tdoe",
      startIndex: 3,
      endIndex: 11,
    });

    expect(result).toEqual({
      query: "john\tdoe",
      isValid: false,
    });
  });

  it("should mark query as invalid when it starts with space", () => {
    const result = extractQuery({
      text: "hi @ john",
      startIndex: 3,
      endIndex: 8,
    });

    expect(result).toEqual({
      query: " john",
      isValid: false,
    });
  });

  it("should mark query as invalid when it ends with space", () => {
    const result = extractQuery({
      text: "hi @john ",
      startIndex: 3,
      endIndex: 8,
    });

    expect(result).toEqual({
      query: "john ",
      isValid: false,
    });
  });

  it("should mark query as invalid when it contains multiple spaces", () => {
    const result = extractQuery({
      text: "hi @john  doe",
      startIndex: 3,
      endIndex: 12,
    });

    expect(result).toEqual({
      query: "john  doe",
      isValid: false,
    });
  });

  it("should handle query with numbers", () => {
    const result = extractQuery({
      text: "User @123",
      startIndex: 5,
      endIndex: 8,
    });

    expect(result).toEqual({
      query: "123",
      isValid: true,
    });
  });

  it("should handle query with mixed characters", () => {
    const result = extractQuery({
      text: "hi @user_123-test",
      startIndex: 3,
      endIndex: 16,
    });

    expect(result).toEqual({
      query: "user_123-test",
      isValid: true,
    });
  });

  it("should handle query at start of text", () => {
    const result = extractQuery({
      text: "@john",
      startIndex: 0,
      endIndex: 4,
    });

    expect(result).toEqual({
      query: "john",
      isValid: true,
    });
  });

  it("should handle query at end of text", () => {
    const result = extractQuery({
      text: "hi @john",
      startIndex: 3,
      endIndex: 7,
    });

    expect(result).toEqual({
      query: "john",
      isValid: true,
    });
  });

  it("should handle query in middle of text", () => {
    const result = extractQuery({
      text: "hi @john there",
      startIndex: 3,
      endIndex: 7,
    });

    expect(result).toEqual({
      query: "john",
      isValid: true,
    });
  });

  it("should handle empty text", () => {
    const result = extractQuery({
      text: "",
      startIndex: 0,
      endIndex: 0,
    });

    expect(result).toEqual({
      query: "",
      isValid: true,
    });
  });

  it("should handle query with only whitespace", () => {
    const result = extractQuery({
      text: "hi @   ",
      startIndex: 3,
      endIndex: 6,
    });

    expect(result).toEqual({
      query: "   ",
      isValid: false,
    });
  });

  it("should handle query with mixed whitespace types", () => {
    const result = extractQuery({
      text: "hi @j o\th\ne",
      startIndex: 3,
      endIndex: 10,
    });

    expect(result).toEqual({
      query: "j o\th\ne",
      isValid: false,
    });
  });
});
