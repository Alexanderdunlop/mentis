import { describe, test, expect } from "vitest";
import { removeCurrentlySelectedText } from "../removeCurrentlySelectedText";

describe("removeCurrentlySelectedText", () => {
  test("should remove selected text content and clean up empty nodes", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span>world</span>!";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const spanElement = container.querySelector("span")!;
    range.setStart(spanElement.firstChild!, 0);
    range.setEnd(spanElement.firstChild!, 5);

    selection!.removeAllRanges();
    selection!.addRange(range);

    expect(selection!.toString()).toBe("world");

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("Hello !");

    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("span")!.textContent).toBe("");

    document.body.removeChild(container);
  });

  test("should handle selection spanning multiple elements", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span>world</span> <strong>test</strong>!";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const spanElement = container.querySelector("span")!;
    const strongElement = container.querySelector("strong")!;
    range.setStart(spanElement.firstChild!, 0);
    range.setEnd(strongElement.firstChild!, 4); // "test" is 4 characters

    selection!.removeAllRanges();
    selection!.addRange(range);

    expect(selection!.toString()).toBe("world test");

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("Hello !");

    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector("strong")).toBeNull();

    document.body.removeChild(container);
  });

  test("should preserve non-empty elements after cleanup", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span>world</span> <strong>test</strong>!";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const spanElement = container.querySelector("span")!;
    range.setStart(spanElement.firstChild!, 0);
    range.setEnd(spanElement.firstChild!, 5);

    selection!.removeAllRanges();
    selection!.addRange(range);

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("Hello  test!");

    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("span")!.textContent).toBe("");

    expect(container.querySelector("strong")).toBeTruthy();
    expect(container.querySelector("strong")!.textContent).toBe("test");

    document.body.removeChild(container);
  });

  test("should handle selection with no range", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello world";
    document.body.appendChild(container);

    const selection = window.getSelection();
    selection!.removeAllRanges();

    expect(selection!.rangeCount).toBe(0);

    expect(() => removeCurrentlySelectedText()).not.toThrow();
    expect(container.textContent).toBe("Hello world");

    document.body.removeChild(container);
  });

  test("should handle selection with no selection object", () => {
    const originalGetSelection = window.getSelection;
    window.getSelection = () => null;

    const container = document.createElement("div");
    container.innerHTML = "Hello world";
    document.body.appendChild(container);

    expect(() => removeCurrentlySelectedText()).not.toThrow();
    expect(container.textContent).toBe("Hello world");

    window.getSelection = originalGetSelection;

    document.body.removeChild(container);
  });

  test("should clean up nested empty elements", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span><em></em></span> world";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const textNodes = Array.from(container.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE
    );
    range.setStart(textNodes[0], 0);
    range.setEnd(
      textNodes[textNodes.length - 1],
      textNodes[textNodes.length - 1].textContent!.length
    );

    selection!.removeAllRanges();
    selection!.addRange(range);

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("");

    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector("em")).toBeNull();

    // Clean up
    document.body.removeChild(container);
  });

  test("should remove only selected text and keep partial element content", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span>world</span>!";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const spanElement = container.querySelector("span")!;
    range.setStart(spanElement.firstChild!, 0);
    range.setEnd(spanElement.firstChild!, 2);

    selection!.removeAllRanges();
    selection!.addRange(range);

    expect(selection!.toString()).toBe("wo");

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("Hello rld!");
    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("span")!.textContent).toBe("rld");

    document.body.removeChild(container);
  });

  test("should handle selection spanning multiple elements partially", () => {
    const container = document.createElement("div");
    container.innerHTML = "Hello <span>world</span> <strong>test</strong>!";

    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();

    const spanElement = container.querySelector("span")!;
    const strongElement = container.querySelector("strong")!;
    range.setStart(spanElement.firstChild!, 2);
    range.setEnd(strongElement.firstChild!, 2);

    selection!.removeAllRanges();
    selection!.addRange(range);

    expect(selection!.toString()).toBe("rld te");

    removeCurrentlySelectedText();

    expect(container.textContent).toBe("Hello wost!");
    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("span")!.textContent).toBe("wo");
    expect(container.querySelector("strong")).toBeTruthy();
    expect(container.querySelector("strong")!.textContent).toBe("st");

    document.body.removeChild(container);
  });
});
