import { describe, it, expect } from "vitest";
import { replaceMentionItem } from "../replaceMentionItem";

describe("replaceMentionItem", () => {
  it("should replace single mention with HTML span", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "Hello @john how are you?",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span> how are you?'
    );
  });

  it("should replace multiple mentions with same label", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "Hello @john, @john is here",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span>, <span class="mention-chip" data-mention="john">@john</span> is here'
    );
  });

  it("should handle different trigger characters", () => {
    const result = replaceMentionItem({
      trigger: "#",
      text: "Check out #feature",
      mentionItem: { label: "feature", value: "feature" },
    });

    expect(result).toBe(
      'Check out <span class="mention-chip" data-mention="feature">#feature</span>'
    );
  });

  it("should handle empty text", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe("");
  });

  it("should handle text without mentions", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "Hello world",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe("Hello world");
  });

  it("should handle mention at start of text", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "@john hello",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe(
      '<span class="mention-chip" data-mention="john">@john</span> hello'
    );
  });

  it("should handle mention at end of text", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "Hello @john",
      mentionItem: { label: "john", value: "john" },
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span>'
    );
  });

  it("should handle special characters in mention label", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "Hello @john-doe",
      mentionItem: { label: "john-doe", value: "john-doe" },
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john-doe">@john-doe</span>'
    );
  });

  it("should handle numeric mention labels", () => {
    const result = replaceMentionItem({
      trigger: "@",
      text: "User @123",
      mentionItem: { label: "123", value: "123" },
    });

    expect(result).toBe(
      'User <span class="mention-chip" data-mention="123">@123</span>'
    );
  });
});
