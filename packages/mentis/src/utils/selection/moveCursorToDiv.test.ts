import { describe, test, expect } from "vitest";
import { moveCursorToDiv } from "./moveCursorToDiv";

describe("moveCursorToDiv", () => {
  test("should move cursor to the end of text content in div", () => {
    const div = document.createElement("div");
    const textNode = document.createTextNode("Hello world");
    div.appendChild(textNode);

    document.body.appendChild(div);

    moveCursorToDiv(div);

    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(textNode);
    expect(range.endContainer).toBe(textNode);
    expect(range.startOffset).toBe("Hello world".length); // Cursor at end of text
    expect(range.endOffset).toBe("Hello world".length);

    document.body.removeChild(div);
  });

  test("should move cursor before BR element", () => {
    const div = document.createElement("div");
    const brElement = document.createElement("br");
    div.appendChild(brElement);

    document.body.appendChild(div);

    moveCursorToDiv(div);

    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(div);
    expect(range.endContainer).toBe(div);
    expect(range.startOffset).toBe(0); // Cursor before BR (at start of div)
    expect(range.endOffset).toBe(0);

    document.body.removeChild(div);
  });

  test("should move cursor to end of other element content", () => {
    const div = document.createElement("div");
    const spanElement = document.createElement("span");
    spanElement.textContent = "Some content";
    div.appendChild(spanElement);

    document.body.appendChild(div);

    moveCursorToDiv(div);

    // Verify the cursor is positioned at the end of the span's content
    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(spanElement);
    expect(range.endContainer).toBe(spanElement);
    expect(range.startOffset).toBe(1); // Cursor at end of span (1 child node)
    expect(range.endOffset).toBe(1);

    document.body.removeChild(div);
  });

  test("should move cursor inside empty div", () => {
    const div = document.createElement("div");

    document.body.appendChild(div);

    moveCursorToDiv(div);

    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(div);
    expect(range.endContainer).toBe(div);
    expect(range.startOffset).toBe(0); // Cursor at start of empty div
    expect(range.endOffset).toBe(0);

    document.body.removeChild(div);
  });
});
