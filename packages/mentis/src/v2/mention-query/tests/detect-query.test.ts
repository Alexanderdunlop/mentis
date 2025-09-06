import { describe, it, expect } from "vitest";
import { detectMentionQuery } from "../detect-query";

describe("detectMentionQuery", () => {
  it("should return no query when text is empty", () => {
    const result = detectMentionQuery("", 0, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should return no query when trigger is not found", () => {
    const result = detectMentionQuery("hello world", 5, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should return no query when trigger is found but query contains whitespace", () => {
    const result = detectMentionQuery("hi @hello world", 10, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should return valid query when trigger is found and query is valid", () => {
    const result = detectMentionQuery("hi @john", 7, "@");

    expect(result).toEqual({
      query: {
        query: "john",
        startIndex: 3,
      },
      shouldShowModal: true,
    });
  });

  it("should handle different trigger characters", () => {
    const result = detectMentionQuery("Check #feature", 12, "#");

    expect(result).toEqual({
      query: {
        query: "featur",
        startIndex: 6,
      },
      shouldShowModal: true,
    });
  });

  it("should handle cursor at trigger position", () => {
    const result = detectMentionQuery("hi @", 4, "@");

    expect(result).toEqual({
      query: {
        query: "",
        startIndex: 3,
      },
      shouldShowModal: true,
    });
  });

  it("should handle cursor at start of text", () => {
    const result = detectMentionQuery("@hello", 0, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should handle cursor at end of text", () => {
    const result = detectMentionQuery("@hello", 6, "@");

    expect(result).toEqual({
      query: {
        query: "hello",
        startIndex: 0,
      },
      shouldShowModal: true,
    });
  });

  it("should handle single character text with trigger", () => {
    const result = detectMentionQuery("@", 1, "@");

    expect(result).toEqual({
      query: {
        query: "",
        startIndex: 0,
      },
      shouldShowModal: true,
    });
  });

  it("should handle query with special characters", () => {
    const result = detectMentionQuery("hi @user-123", 10, "@");

    expect(result).toEqual({
      query: {
        query: "user-12",
        startIndex: 3,
      },
      shouldShowModal: true,
    });
  });

  it("should return no query when trigger is found but query has newline", () => {
    const result = detectMentionQuery("hi @john\n", 8, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should return no query when trigger is found but query has tab", () => {
    const result = detectMentionQuery("hi @john\t", 8, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should handle multiple triggers in text", () => {
    const result = detectMentionQuery("hi @john and @jane", 12, "@");

    expect(result).toEqual({
      query: null,
      shouldShowModal: false,
    });
  });

  it("should handle trigger at beginning of word", () => {
    const result = detectMentionQuery("hello@world", 6, "@");

    expect(result).toEqual({
      query: {
        query: "w",
        startIndex: 5,
      },
      shouldShowModal: true,
    });
  });

  it("should handle cursor at end of query", () => {
    const result = detectMentionQuery("hi @john", 8, "@");

    expect(result).toEqual({
      query: {
        query: "john",
        startIndex: 3,
      },
      shouldShowModal: true,
    });
  });

  it("should handle cursor in middle of query", () => {
    const result = detectMentionQuery("hi @john", 6, "@");

    expect(result).toEqual({
      query: {
        query: "joh",
        startIndex: 3,
      },
      shouldShowModal: true,
    });
  });

  it("should handle query with numbers", () => {
    const result = detectMentionQuery("User @123", 9, "@");

    expect(result).toEqual({
      query: {
        query: "123",
        startIndex: 5,
      },
      shouldShowModal: true,
    });
  });
});
