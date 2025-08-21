import { describe, test, expect } from "vitest";
import { processPaste } from "../processPaste";

describe("processPaste", () => {
  test("should process single line text paste", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "Hello world",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(1);
    const div = editorRef.firstChild as HTMLDivElement;
    expect(div.tagName.toLowerCase()).toBe("div");
    expect(div.textContent).toBe("Hello world");

    document.body.removeChild(editorRef);
  });

  test("should process multi-line text paste", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "Line 1\nLine 2\nLine 3",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(3);

    const divs = Array.from(editorRef.childNodes) as HTMLDivElement[];
    expect(divs[0].textContent).toBe("Line 1");
    expect(divs[1].textContent).toBe("Line 2");
    expect(divs[2].textContent).toBe("Line 3");

    document.body.removeChild(editorRef);
  });

  test("should handle empty lines with BR elements", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "Line 1\n\nLine 3",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(3);

    const divs = Array.from(editorRef.childNodes) as HTMLDivElement[];
    expect(divs[0].textContent).toBe("Line 1");
    expect(divs[1].firstChild?.nodeName).toBe("BR");
    expect(divs[2].textContent).toBe("Line 3");

    document.body.removeChild(editorRef);
  });

  test("should handle whitespace-only lines as empty", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "Line 1\n   \n\t\nLine 4",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(4);

    const divs = Array.from(editorRef.childNodes) as HTMLDivElement[];
    expect(divs[0].textContent).toBe("Line 1");
    expect(divs[1].firstChild?.nodeName).toBe("BR");
    expect(divs[2].firstChild?.nodeName).toBe("BR");
    expect(divs[3].textContent).toBe("Line 4");

    document.body.removeChild(editorRef);
  });

  test("should append new content to existing content", () => {
    const editorRef = document.createElement("div");
    editorRef.innerHTML = "Existing content";
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "New content",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.textContent).toBe("Existing contentNew content");

    document.body.removeChild(editorRef);
  });

  test("should position cursor at the end after pasting", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "Line 1\nLine 2",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    const selection = window.getSelection();
    expect(selection).toBeTruthy();
    expect(selection!.rangeCount).toBe(1);

    const range = selection!.getRangeAt(0);
    const lastDiv = editorRef.lastChild as HTMLDivElement;
    expect(range.startContainer).toBe(lastDiv.firstChild);
    expect(range.startOffset).toBe("Line 2".length);

    document.body.removeChild(editorRef);
  });

  test("should handle null editorRef gracefully", () => {
    const clipboardData = {
      getData: () => "Some text",
    } as unknown as DataTransfer;

    expect(() =>
      processPaste({ editorRef: null, clipboardData })
    ).not.toThrow();
  });

  test("should handle empty clipboard text", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(1);
    const div = editorRef.firstChild as HTMLDivElement;
    expect(div.firstChild?.nodeName).toBe("BR");

    document.body.removeChild(editorRef);
  });

  test("should handle clipboard text with only whitespace", () => {
    const editorRef = document.createElement("div");
    document.body.appendChild(editorRef);

    const clipboardData = {
      getData: () => "   \n\t\n  ",
    } as unknown as DataTransfer;

    processPaste({ editorRef, clipboardData });

    expect(editorRef.childNodes.length).toBe(3);

    const divs = Array.from(editorRef.childNodes) as HTMLDivElement[];
    divs.forEach((div) => {
      expect(div.firstChild?.nodeName).toBe("BR");
    });

    document.body.removeChild(editorRef);
  });
});
