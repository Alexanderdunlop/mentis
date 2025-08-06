import { describe, test, expect } from "vitest";
import { extractMentionData } from "../../src/utils/extractMentionData";

describe("extractMentionData", () => {
  test("should extract plain text without mentions", () => {
    const element = document.createElement("div");
    element.textContent = "Hello world";

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "Hello world",
      dataValue: "Hello world",
      mentions: [],
    });
  });

  test("should extract single mention chip", () => {
    const element = document.createElement("div");
    const mentionChip = document.createElement("span");
    mentionChip.className = "mention-chip";
    mentionChip.dataset.value = "john";
    mentionChip.dataset.label = "John Doe";
    mentionChip.textContent = "@John Doe";
    element.appendChild(mentionChip);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "@John Doe",
      dataValue: "john",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 9,
        },
      ],
    });
  });

  test("should extract multiple mention chips", () => {
    const element = document.createElement("div");

    const mentionChip1 = document.createElement("span");
    mentionChip1.className = "mention-chip";
    mentionChip1.dataset.value = "john";
    mentionChip1.dataset.label = "John Doe";
    mentionChip1.textContent = "@John Doe";

    const mentionChip2 = document.createElement("span");
    mentionChip2.className = "mention-chip";
    mentionChip2.dataset.value = "jane";
    mentionChip2.dataset.label = "Jane Smith";
    mentionChip2.textContent = "@Jane Smith";

    element.appendChild(mentionChip1);
    element.appendChild(document.createTextNode(" and "));
    element.appendChild(mentionChip2);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "@John Doe and @Jane Smith",
      dataValue: "john and jane",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 9,
        },
        {
          label: "Jane Smith",
          value: "jane",
          startIndex: 14,
          endIndex: 25,
        },
      ],
    });
  });

  test("should extract mixed content with text and mentions", () => {
    const element = document.createElement("div");

    element.appendChild(document.createTextNode("Hello "));

    const mentionChip = document.createElement("span");
    mentionChip.className = "mention-chip";
    mentionChip.dataset.value = "john";
    mentionChip.dataset.label = "John Doe";
    mentionChip.textContent = "@John Doe";
    element.appendChild(mentionChip);

    element.appendChild(document.createTextNode(", how are you?"));

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "Hello @John Doe, how are you?",
      dataValue: "Hello john, how are you?",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 6,
          endIndex: 15,
        },
      ],
    });
  });

  test("should handle nested elements that are not mention chips", () => {
    const element = document.createElement("div");

    const boldElement = document.createElement("strong");
    boldElement.textContent = "Hello ";
    element.appendChild(boldElement);

    const mentionChip = document.createElement("span");
    mentionChip.className = "mention-chip";
    mentionChip.dataset.value = "john";
    mentionChip.dataset.label = "John Doe";
    mentionChip.textContent = "@John Doe";
    element.appendChild(mentionChip);

    const italicElement = document.createElement("em");
    italicElement.textContent = "!";
    element.appendChild(italicElement);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "Hello @John Doe!",
      dataValue: "Hello john!",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 6,
          endIndex: 15,
        },
      ],
    });
  });

  test("should handle elements with dataset but not mention chips", () => {
    const element = document.createElement("div");

    const regularElement = document.createElement("span");
    regularElement.dataset.something = "value";
    regularElement.textContent = "Hello";
    element.appendChild(regularElement);

    const mentionChip = document.createElement("span");
    mentionChip.className = "mention-chip";
    mentionChip.dataset.value = "john";
    mentionChip.dataset.label = "John Doe";
    mentionChip.textContent = "@John Doe";
    element.appendChild(mentionChip);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "Hello@John Doe",
      dataValue: "Hellojohn",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 5,
          endIndex: 14,
        },
      ],
    });
  });

  test("should handle empty element", () => {
    const element = document.createElement("div");

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "",
      dataValue: "",
      mentions: [],
    });
  });

  test("should handle element with only whitespace", () => {
    const element = document.createElement("div");
    element.textContent = "   \n\t  ";

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "   \n\t  ",
      dataValue: "   \n\t  ",
      mentions: [],
    });
  });

  test("should handle mention chip with empty text content", () => {
    const element = document.createElement("div");
    const mentionChip = document.createElement("span");
    mentionChip.className = "mention-chip";
    mentionChip.dataset.value = "john";
    mentionChip.dataset.label = "John Doe";
    mentionChip.textContent = "";
    element.appendChild(mentionChip);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "",
      dataValue: "john",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 0,
        },
      ],
    });
  });

  test("should handle complex nested structure", () => {
    const element = document.createElement("div");

    // Create a complex structure: <div>Hello <strong>@John Doe</strong> and <em>@Jane Smith</em>!</div>
    element.appendChild(document.createTextNode("Hello "));

    const strongElement = document.createElement("strong");
    const mentionChip1 = document.createElement("span");
    mentionChip1.className = "mention-chip";
    mentionChip1.dataset.value = "john";
    mentionChip1.dataset.label = "John Doe";
    mentionChip1.textContent = "@John Doe";
    strongElement.appendChild(mentionChip1);
    element.appendChild(strongElement);

    element.appendChild(document.createTextNode(" and "));

    const emElement = document.createElement("em");
    const mentionChip2 = document.createElement("span");
    mentionChip2.className = "mention-chip";
    mentionChip2.dataset.value = "jane";
    mentionChip2.dataset.label = "Jane Smith";
    mentionChip2.textContent = "@Jane Smith";
    emElement.appendChild(mentionChip2);
    element.appendChild(emElement);

    element.appendChild(document.createTextNode("!"));

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "Hello @John Doe and @Jane Smith!",
      dataValue: "Hello john and jane!",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 6,
          endIndex: 15,
        },
        {
          label: "Jane Smith",
          value: "jane",
          startIndex: 20,
          endIndex: 31,
        },
      ],
    });
  });

  test("should handle mention chips with different trigger characters", () => {
    const element = document.createElement("div");

    const mentionChip1 = document.createElement("span");
    mentionChip1.className = "mention-chip";
    mentionChip1.dataset.value = "john";
    mentionChip1.dataset.label = "John Doe";
    mentionChip1.textContent = "#John Doe";

    const mentionChip2 = document.createElement("span");
    mentionChip2.className = "mention-chip";
    mentionChip2.dataset.value = "jane";
    mentionChip2.dataset.label = "Jane Smith";
    mentionChip2.textContent = "!Jane Smith";

    element.appendChild(mentionChip1);
    element.appendChild(document.createTextNode(" and "));
    element.appendChild(mentionChip2);

    const result = extractMentionData(element);

    expect(result).toEqual({
      displayValue: "#John Doe and !Jane Smith",
      dataValue: "john and jane",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 9,
        },
        {
          label: "Jane Smith",
          value: "jane",
          startIndex: 14,
          endIndex: 25,
        },
      ],
    });
  });
});
