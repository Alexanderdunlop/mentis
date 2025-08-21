import { describe, test, expect, vi, afterEach } from "vitest";
import { processInput } from "./processInput";

describe("processInput", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should iterate through and log all child nodes after text replacement", async () => {
    const editorRef = document.createElement("div");

    const textNode = document.createTextNode("Hello ");
    editorRef.appendChild(textNode);

    const divElement = document.createElement("div");
    divElement.textContent = "world";
    editorRef.appendChild(divElement);

    const anotherTextNode = document.createTextNode("!");
    editorRef.appendChild(anotherTextNode);

    const initialChildCount = editorRef.childNodes.length;
    expect(initialChildCount).toBe(3);

    processInput(editorRef);

    // Verify that each child node is a div
    const childNodes = Array.from(editorRef.childNodes);
    childNodes.forEach((child) => {
      expect((child as HTMLElement).tagName.toLowerCase()).toBe("div");
    });
  });

  test("should move cursor to the last replaced div when converting text nodes", () => {
    const editorRef = document.createElement("div");
    const textNode = document.createTextNode("Hello world");
    editorRef.appendChild(textNode);

    document.body.appendChild(editorRef);

    processInput(editorRef);

    expect(editorRef.childNodes.length).toBe(1);
    const replacedDiv = editorRef.firstChild as HTMLDivElement;
    expect(replacedDiv.tagName.toLowerCase()).toBe("div");
    expect(replacedDiv.textContent).toBe("Hello world");

    // Verify the cursor is positioned at the end of the div content
    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(replacedDiv.firstChild); // Should be the text node inside the div
    expect(range.endContainer).toBe(replacedDiv.firstChild);
    expect(range.startOffset).toBe("Hello world".length); // Cursor at end of text
    expect(range.endOffset).toBe("Hello world".length);

    // Clean up
    document.body.removeChild(editorRef);
  });

  test("should handle empty text node replacement and cursor positioning", () => {
    const editorRef = document.createElement("div");
    const emptyTextNode = document.createTextNode("");
    editorRef.appendChild(emptyTextNode);

    document.body.appendChild(editorRef);

    processInput(editorRef);

    expect(editorRef.childNodes.length).toBe(1);
    const replacedDiv = editorRef.firstChild as HTMLDivElement;
    expect(replacedDiv.tagName.toLowerCase()).toBe("div");
    expect(replacedDiv.textContent).toBe("");

    // Verify the cursor is positioned inside the empty div
    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    expect(range.startContainer).toBe(replacedDiv); // Should be positioned inside the empty div
    expect(range.endContainer).toBe(replacedDiv);
    expect(range.startOffset).toBe(0); // Cursor at start of empty div
    expect(range.endOffset).toBe(0);

    // Clean up
    document.body.removeChild(editorRef);
  });
});
