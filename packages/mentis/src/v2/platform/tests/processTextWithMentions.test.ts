import { describe, it, expect } from "vitest";
import { processTextWithMentions } from "../processTextWithMentions";

describe("processTextWithMentions", () => {
  it("should process text with single mention", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @john how are you?",
      options: [{ label: "john", value: "john" }],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span> how are you?'
    );
  });

  it("should process text with multiple different mentions", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @john and @jane, how are you?",
      options: [
        { label: "john", value: "john" },
        { label: "jane", value: "jane" },
      ],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span> and <span class="mention-chip" data-mention="jane">@jane</span>, how are you?'
    );
  });

  it("should process text with multiple same mentions", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @john, @john is here",
      options: [{ label: "john", value: "john" }],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span>, <span class="mention-chip" data-mention="john">@john</span> is here'
    );
  });

  it("should handle empty options array", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @john how are you?",
      options: [],
    });

    expect(result).toBe("Hello @john how are you?");
  });

  it("should handle empty text", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "",
      options: [{ label: "john", value: "john" }],
    });

    expect(result).toBe("");
  });

  it("should handle text without mentions", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello world",
      options: [{ label: "john", value: "john" }],
    });

    expect(result).toBe("Hello world");
  });

  it("should handle different trigger characters", () => {
    const result = processTextWithMentions({
      trigger: "#",
      text: "Check out #feature and #bug",
      options: [
        { label: "feature", value: "feature" },
        { label: "bug", value: "bug" },
      ],
    });

    expect(result).toBe(
      'Check out <span class="mention-chip" data-mention="feature">#feature</span> and <span class="mention-chip" data-mention="bug">#bug</span>'
    );
  });

  it("should process mentions in correct order", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @alice @bob @charlie",
      options: [
        { label: "bob", value: "bob" },
        { label: "alice", value: "alice" },
        { label: "charlie", value: "charlie" },
      ],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="alice">@alice</span> <span class="mention-chip" data-mention="bob">@bob</span> <span class="mention-chip" data-mention="charlie">@charlie</span>'
    );
  });

  it("should handle special characters in mention labels", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @user-123 and @user_456",
      options: [
        { label: "user-123", value: "user-123" },
        { label: "user_456", value: "user_456" },
      ],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="user-123">@user-123</span> and <span class="mention-chip" data-mention="user_456">@user_456</span>'
    );
  });

  it("should handle mixed case mention labels", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @John and @JANE",
      options: [
        { label: "John", value: "John" },
        { label: "JANE", value: "JANE" },
      ],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="John">@John</span> and <span class="mention-chip" data-mention="JANE">@JANE</span>'
    );
  });

  it("should handle mentions with different values than labels", () => {
    const result = processTextWithMentions({
      trigger: "@",
      text: "Hello @john",
      options: [{ label: "john", value: "john_doe" }],
    });

    expect(result).toBe(
      'Hello <span class="mention-chip" data-mention="john">@john</span>'
    );
  });
});
