import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi, describe } from "vitest";
import userEvent from "@testing-library/user-event";
import { MentionInput } from "../src/components/MentionInput";
import { extractMentionData } from "../src/utils/extractMentionData";
import { reconstructFromDataValue } from "../src/utils/reconstructFromDataValue";

const options = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
];

describe("Newline handling", () => {
  test("Should preserve newlines in dataValue and displayValue when pressing Enter", async () => {
    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Type some text, then press Enter, then type more text
    await user.type(editorElement, "First line{enter}Second line");

    // Check that onChange was called with newlines preserved
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        displayValue: "First line\nSecond line",
        dataValue: "First line\nSecond line",
        mentions: [],
      })
    );
  });

  test("Should extract newlines correctly from contentEditable with <br> elements", () => {
    // Create a test element with <br> tags
    const testElement = document.createElement("div");
    testElement.innerHTML = "First line<br>Second line<br>Third line";

    const result = extractMentionData(testElement);

    expect(result.displayValue).toBe("First line\nSecond line\nThird line");
    expect(result.dataValue).toBe("First line\nSecond line\nThird line");
    expect(result.mentions).toEqual([]);
  });

  test("Should extract newlines correctly from contentEditable with empty <div> elements", () => {
    // Create a test element with empty div tags (contentEditable creates these for Enter)
    const testElement = document.createElement("div");
    testElement.innerHTML = "First line<div></div>Second line";

    const result = extractMentionData(testElement);

    expect(result.displayValue).toBe("First line\nSecond line");
    expect(result.dataValue).toBe("First line\nSecond line");
    expect(result.mentions).toEqual([]);
  });

  test("Should reconstruct HTML correctly with newlines", () => {
    const dataValue = "First line\nSecond line\nThird line";
    
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "@",
      keepTriggerOnSelect: true,
      chipClassName: "mention-chip",
    });

    expect(result).toBe("First line<br>Second line<br>Third line");
  });

  test("Should handle newlines with mentions correctly", () => {
    // Create a test element with mentions and newlines
    const testElement = document.createElement("div");
    testElement.innerHTML = 'Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span><br>How are you?';

    const result = extractMentionData(testElement);

    expect(result.displayValue).toBe("Hello @John Doe\nHow are you?");
    expect(result.dataValue).toBe("Hello john\nHow are you?");
    expect(result.mentions).toEqual([
      {
        label: "John Doe",
        value: "john",
        startIndex: 6,
        endIndex: 15,
      },
    ]);
  });

  test("Should reconstruct HTML correctly with mentions and newlines", () => {
    const dataValue = "Hello john\nHow are you?";
    
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "@",
      keepTriggerOnSelect: true,
      chipClassName: "mention-chip",
    });

    expect(result).toBe('Hello <span class="mention-chip" data-value="john" data-label="John Doe" contenteditable="false">@John Doe</span><br>How are you?');
  });

  test("Should handle multiple newlines correctly", () => {
    // Create a test element with multiple newlines
    const testElement = document.createElement("div");
    testElement.innerHTML = "Line 1<br><br>Line 3<br><br><br>Line 6";

    const result = extractMentionData(testElement);

    expect(result.displayValue).toBe("Line 1\n\nLine 3\n\n\nLine 6");
    expect(result.dataValue).toBe("Line 1\n\nLine 3\n\n\nLine 6");
    expect(result.mentions).toEqual([]);
  });

  test("Should reconstruct multiple newlines correctly", () => {
    const dataValue = "Line 1\n\nLine 3\n\n\nLine 6";
    
    const result = reconstructFromDataValue({
      dataValue,
      options,
      trigger: "@",
      keepTriggerOnSelect: true,
      chipClassName: "mention-chip",
    });

    expect(result).toBe("Line 1<br><br>Line 3<br><br><br>Line 6");
  });
});
