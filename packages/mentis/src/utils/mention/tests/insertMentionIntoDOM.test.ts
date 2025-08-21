import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { insertMentionIntoDOM } from "../insertMentionIntoDOM";

describe("insertMentionIntoDOM", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.contentEditable = "true";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should insert mention with trigger when keepTriggerOnSelect is true", () => {
    container.textContent = "Hello @al";

    insertMentionIntoDOM({
      element: container,
      option: { label: "Alice", value: "alice" },
      mentionStart: 6,
      mentionQuery: "al",
      trigger: "@",
      keepTriggerOnSelect: true,
      chipClassName: "mention-chip",
    });

    const mentionElement = container.querySelector(".mention-chip");
    expect(mentionElement).toBeTruthy();
    expect(mentionElement?.textContent).toBe("@Alice");
    expect(mentionElement?.getAttribute("data-value")).toBe("alice");
    expect(mentionElement?.getAttribute("data-label")).toBe("Alice");
  });

  it("should insert mention without trigger when keepTriggerOnSelect is false", () => {
    container.textContent = "Hello @al";

    insertMentionIntoDOM({
      element: container,
      option: { label: "Alice", value: "alice" },
      mentionStart: 6,
      mentionQuery: "al",
      trigger: "@",
      keepTriggerOnSelect: false,
      chipClassName: "mention-chip",
    });

    const mentionElement = container.querySelector(".mention-chip");
    expect(mentionElement).toBeTruthy();
    expect(mentionElement?.textContent).toBe("Alice");
  });

  it("should add space after mention when needed", () => {
    container.textContent = "Hello @alworld";

    insertMentionIntoDOM({
      element: container,
      option: { label: "Alice", value: "alice" },
      mentionStart: 6,
      mentionQuery: "al",
      trigger: "@",
      keepTriggerOnSelect: false,
      chipClassName: "mention-chip",
    });

    const textAfterMention = container.textContent;
    expect(textAfterMention).toContain("Alice world");
  });
});
