import { describe, it, expect } from "vitest";
import { findTriggerBackward } from "../find-trigger-backward";

describe("findTriggerBackward", () => {
  it("should find trigger at start of text", () => {
    const result = findTriggerBackward({
      text: "@john",
      startPosition: 5,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 0,
    });
  });

  it("should find trigger in middle of text", () => {
    const result = findTriggerBackward({
      text: "hi @john",
      startPosition: 8,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should find trigger at end of text", () => {
    const result = findTriggerBackward({
      text: "hello@",
      startPosition: 6,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 5,
    });
  });

  it("should return not found when trigger is not present", () => {
    const result = findTriggerBackward({
      text: "hello world",
      startPosition: 11,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should return not found when trigger is after whitespace", () => {
    const result = findTriggerBackward({
      text: "hi @john",
      startPosition: 8,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should return not found when whitespace is encountered before trigger", () => {
    const result = findTriggerBackward({
      text: "hi @ john",
      startPosition: 9,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should return not found when newline is encountered before trigger", () => {
    const result = findTriggerBackward({
      text: "hi\n@john",
      startPosition: 8,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should return not found when tab is encountered before trigger", () => {
    const result = findTriggerBackward({
      text: "hi\t@john",
      startPosition: 8,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should handle different trigger characters", () => {
    const result = findTriggerBackward({
      text: "Check #feature",
      startPosition: 13,
      trigger: "#",
    });

    expect(result).toEqual({
      found: true,
      position: 6,
    });
  });

  it("should handle cursor at trigger position", () => {
    const result = findTriggerBackward({
      text: "hi @",
      startPosition: 4,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should handle cursor at start of text", () => {
    const result = findTriggerBackward({
      text: "@hello",
      startPosition: 0,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should handle empty text", () => {
    const result = findTriggerBackward({
      text: "",
      startPosition: 0,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should find trigger when cursor is right after it", () => {
    const result = findTriggerBackward({
      text: "hi @john",
      startPosition: 4,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should return not found when multiple triggers exist but whitespace separates them", () => {
    const result = findTriggerBackward({
      text: "hi @john and @jane",
      startPosition: 18,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 13,
    });
  });

  it("should find closest trigger when multiple exist without whitespace", () => {
    const result = findTriggerBackward({
      text: "hi@john@jane",
      startPosition: 11,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 7,
    });
  });

  it("should handle trigger with special characters", () => {
    const result = findTriggerBackward({
      text: "hi @user-123",
      startPosition: 12,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 3,
    });
  });

  it("should return not found when start position is 0", () => {
    const result = findTriggerBackward({
      text: "hello",
      startPosition: 0,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should handle single character text with trigger", () => {
    const result = findTriggerBackward({
      text: "@",
      startPosition: 1,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 0,
    });
  });

  it("should handle single character text without trigger", () => {
    const result = findTriggerBackward({
      text: "a",
      startPosition: 1,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should return not found when trigger is at start but cursor is at start", () => {
    const result = findTriggerBackward({
      text: "@hello",
      startPosition: 1,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 0,
    });
  });

  it("should return not found when whitespace is encountered immediately before cursor", () => {
    const result = findTriggerBackward({
      text: "hi @ john",
      startPosition: 9,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });

  it("should find trigger when no whitespace separates it from cursor", () => {
    const result = findTriggerBackward({
      text: "hi@john",
      startPosition: 7,
      trigger: "@",
    });

    expect(result).toEqual({
      found: true,
      position: 2,
    });
  });

  it("should return not found when only whitespace exists before cursor", () => {
    const result = findTriggerBackward({
      text: "   ",
      startPosition: 3,
      trigger: "@",
    });

    expect(result).toEqual({
      found: false,
    });
  });
});
