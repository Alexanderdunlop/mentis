import { describe, it, expect } from "vitest";
import { calculateRange } from "../range-calculator";

describe("calculateRange", () => {
  it("should return selection range when selectionStart !== selectionEnd", () => {
    const result = calculateRange({
      inputType: "insertText",
      currentPosition: 5,
      selectionStart: 2,
      selectionEnd: 7,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 2,
      endIndex: 7,
    });
  });

  it("should handle deleteContentBackward input type", () => {
    const result = calculateRange({
      inputType: "deleteContentBackward",
      currentPosition: 5,
      selectionStart: 5,
      selectionEnd: 5,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 4,
      endIndex: 5,
    });
  });

  it("should handle deleteContentBackward at beginning of text", () => {
    const result = calculateRange({
      inputType: "deleteContentBackward",
      currentPosition: 0,
      selectionStart: 0,
      selectionEnd: 0,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 0,
      endIndex: 0,
    });
  });

  it("should handle deleteContentForward input type", () => {
    const result = calculateRange({
      inputType: "deleteContentForward",
      currentPosition: 5,
      selectionStart: 5,
      selectionEnd: 5,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 5,
      endIndex: 6,
    });
  });

  it("should handle deleteContentForward at end of text", () => {
    const result = calculateRange({
      inputType: "deleteContentForward",
      currentPosition: 10,
      selectionStart: 10,
      selectionEnd: 10,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 10,
      endIndex: 10,
    });
  });

  it("should handle default case for other input types", () => {
    const result = calculateRange({
      inputType: "insertText",
      currentPosition: 5,
      selectionStart: 5,
      selectionEnd: 5,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 5,
      endIndex: 5,
    });
  });

  it("should handle insertText input type", () => {
    const result = calculateRange({
      inputType: "insertText",
      currentPosition: 3,
      selectionStart: 3,
      selectionEnd: 3,
      textLength: 8,
    });

    expect(result).toEqual({
      startIndex: 3,
      endIndex: 3,
    });
  });

  it("should handle insertFromPaste input type", () => {
    const result = calculateRange({
      inputType: "insertFromPaste",
      currentPosition: 7,
      selectionStart: 7,
      selectionEnd: 7,
      textLength: 15,
    });

    expect(result).toEqual({
      startIndex: 7,
      endIndex: 7,
    });
  });

  it("should handle selection at beginning with deleteContentBackward", () => {
    const result = calculateRange({
      inputType: "deleteContentBackward",
      currentPosition: 1,
      selectionStart: 1,
      selectionEnd: 1,
      textLength: 5,
    });

    expect(result).toEqual({
      startIndex: 0,
      endIndex: 1,
    });
  });

  it("should handle selection near end with deleteContentForward", () => {
    const result = calculateRange({
      inputType: "deleteContentForward",
      currentPosition: 8,
      selectionStart: 8,
      selectionEnd: 8,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 8,
      endIndex: 9,
    });
  });

  it("should prioritize selection range over input type", () => {
    const result = calculateRange({
      inputType: "deleteContentBackward",
      currentPosition: 5,
      selectionStart: 1,
      selectionEnd: 3,
      textLength: 10,
    });

    expect(result).toEqual({
      startIndex: 1,
      endIndex: 3,
    });
  });
});
