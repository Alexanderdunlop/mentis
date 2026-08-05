import { describe, test, expect, vi, afterEach } from "vitest";
import { insertNewlineAtCaret } from "../../src/utils/insertNewlineAtCaret";

const renderEditor = (textContent: string) => {
  const element = document.createElement("div");
  element.contentEditable = "true";
  element.textContent = textContent;
  document.body.appendChild(element);
  return element;
};

const placeCaretAtEnd = (element: HTMLElement) => {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
};

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
  vi.unstubAllGlobals();
  // @ts-expect-error execCommand is absent in the test DOM, so drop any stub
  delete document.execCommand;
});

describe("insertNewlineAtCaret", () => {
  test("should delegate to execCommand when it is available", () => {
    const execCommand = vi.fn();
    // @ts-expect-error execCommand is absent in the test DOM
    document.execCommand = execCommand;

    const element = renderEditor("First line");
    placeCaretAtEnd(element);

    insertNewlineAtCaret(element);

    expect(execCommand).toHaveBeenCalledWith("insertText", false, "\n");
    // execCommand owns the DOM mutation, so nothing is inserted by hand
    expect(element.innerHTML).toBe("First line");
  });

  test("should insert a <br> at the caret when execCommand is unavailable", () => {
    const element = renderEditor("First line");
    placeCaretAtEnd(element);

    insertNewlineAtCaret(element);

    expect(element.innerHTML).toBe("First line<br>");
  });

  test("should leave the caret after the inserted <br>", () => {
    const element = renderEditor("First line");
    placeCaretAtEnd(element);

    insertNewlineAtCaret(element);

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const lineBreak = element.querySelector("br");

    expect(range?.collapsed).toBe(true);
    expect(range?.startContainer).toBe(element);
    expect(range?.startOffset).toBe(
      Array.from(element.childNodes).indexOf(lineBreak as ChildNode) + 1
    );
  });

  test("should emit an input event so the change is picked up", () => {
    const element = renderEditor("First line");
    placeCaretAtEnd(element);

    const onInput = vi.fn();
    element.addEventListener("input", onInput);

    insertNewlineAtCaret(element);

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput.mock.calls[0][0].bubbles).toBe(true);
  });

  test("should do nothing when there is no selection", () => {
    const element = renderEditor("First line");
    window.getSelection()?.removeAllRanges();

    insertNewlineAtCaret(element);

    expect(element.innerHTML).toBe("First line");
  });

  test("should do nothing when the caret is outside the element", () => {
    const element = renderEditor("First line");
    const outside = renderEditor("Somewhere else");
    placeCaretAtEnd(outside);

    insertNewlineAtCaret(element);

    expect(element.innerHTML).toBe("First line");
    expect(outside.innerHTML).toBe("Somewhere else");
  });
});
