import { describe, test, expect } from "vitest";
import { reconstructFromDataValue } from "../../src/utils/reconstructFromDataValue";
import type { MentionOption } from "../../src/types/MentionInput.types";

describe("reconstructFromDataValue", () => {
  const options: MentionOption[] = [
    { label: "John Doe", value: "john" },
    { label: "Jane Smith", value: "jane" },
    { label: "Bob Johnson", value: "bob" },
  ];

  const defaultProps = {
    trigger: "@",
    keepTriggerOnSelect: true,
    chipClassName: "mention-chip",
  };

  test("should return empty string for empty dataValue", () => {
    const result = reconstructFromDataValue({
      dataValue: "",
      options,
      ...defaultProps,
    });

    expect(result).toBe("");
  });

  test("should return plain text when no mentions found", () => {
    const dataValue = "Hello world, how are you?";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe("Hello world, how are you?");
  });

  test("should reconstruct single mention at the beginning", () => {
    const dataValue = "john, how are you?";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      '<span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>, how are you?'
    );
  });

  test("should reconstruct single mention in the middle", () => {
    const dataValue = "Hello john, how are you?";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>, how are you?'
    );
  });

  test("should reconstruct single mention at the end", () => {
    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>'
    );
  });

  test("should reconstruct multiple mentions", () => {
    const dataValue = "Hello john and jane!";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span> and <span class="mention-chip" data-value="jane" data-label="Jane Smith" contenteditable="false">@Jane Smith</span>!'
    );
  });

  test("should reconstruct consecutive mentions", () => {
    const dataValue = "johnjane";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      '<span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span><span class="mention-chip" data-value="jane" data-label="Jane Smith" contenteditable="false">@Jane Smith</span>'
    );
  });

  test("should handle keepTriggerOnSelect = false", () => {
    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "@",
      keepTriggerOnSelect: false,
      chipClassName: "mention-chip",
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">John Doe</span>'
    );
  });

  test("should handle different trigger character", () => {
    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "#",
      keepTriggerOnSelect: true,
      chipClassName: "mention-chip",
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">#John Doe</span>'
    );
  });

  test("should handle custom chip class name", () => {
    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "@",
      keepTriggerOnSelect: true,
      chipClassName: "custom-chip-class",
    });

    expect(result).toBe(
      'Hello <span class="custom-chip-class" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>'
    );
  });

  test("should handle mention not found in options (fallback to plain text)", () => {
    const dataValue = "Hello unknown_user";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe("Hello unknown_user");
  });

  test("should handle partial matches correctly", () => {
    const dataValue = "Hello john_doe"; // This should NOT match "john"
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe("Hello john_doe");
  });

  test("should handle overlapping mention values (prioritize first match)", () => {
    const optionsWithOverlap: MentionOption[] = [
      { label: "John", value: "jo" },
      { label: "John Doe", value: "john" },
    ];

    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options: optionsWithOverlap,
      ...defaultProps,
    });

    // Should match "jo" first since it appears earlier in the string
    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="jo" data-label="John" contenteditable="false">@John</span>hn'
    );
  });

  test("should handle repeated mention values", () => {
    const dataValue = "john says hi to john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      '<span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span> says hi to <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>'
    );
  });

  test("should handle options with updated labels", () => {
    const updatedOptions: MentionOption[] = [
      { label: "Johnny Doe", value: "john" }, // Label changed from "John Doe"
      { label: "Jane Smith", value: "jane" },
    ];

    const dataValue = "Hello john and jane";
    const result = reconstructFromDataValue({
      dataValue,
      options: updatedOptions,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="Johnny Doe" contenteditable="false">@Johnny Doe</span> and <span class="mention-chip" data-value="jane" data-label="Jane Smith" contenteditable="false">@Jane Smith</span>'
    );
  });

  test("should handle only dataValue with mentions", () => {
    const dataValue = "john";
    const result = reconstructFromDataValue({
      dataValue,
      options,
      ...defaultProps,
    });

    expect(result).toBe(
      '<span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span>'
    );
  });

  test("should handle function options (ignore them)", () => {
    const optionsWithFunctions: MentionOption[] = [
      { label: "John Doe", value: "john" },
      { label: "Alert", value: () => alert("test") },
      { label: "Jane Smith", value: "jane" },
    ];

    const dataValue = "Hello john and jane";
    const result = reconstructFromDataValue({
      dataValue,
      options: optionsWithFunctions,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span> and <span class="mention-chip" data-value="jane" data-label="Jane Smith" contenteditable="false">@Jane Smith</span>'
    );
  });

  test("should handle empty options array", () => {
    const dataValue = "Hello john";
    const result = reconstructFromDataValue({
      dataValue,
      options: [],
      ...defaultProps,
    });

    expect(result).toBe("Hello john");
  });

  test("should handle complex dataValue with special characters", () => {
    const specialOptions: MentionOption[] = [
      { label: "User One", value: "user-123" },
      { label: "User Two", value: "user_456" },
    ];

    const dataValue = "Hello user-123 and user_456!";
    const result = reconstructFromDataValue({
      dataValue,
      options: specialOptions,
      ...defaultProps,
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-value="user-123" data-label="User One" contenteditable="false">@User One</span> and <span class="mention-chip" data-value="user_456" data-label="User Two" contenteditable="false">@User Two</span>!'
    );
  });
});