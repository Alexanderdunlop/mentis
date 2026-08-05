/**
 * Inserts a line break at the current caret position inside `element`.
 *
 * `document.execCommand` is deprecated but still gives the best result in a
 * real browser: it keeps the caret on the new line and leaves the undo stack
 * intact. It is missing in DOM implementations used for testing, so fall back
 * to a Range-based `<br>` insertion there.
 */
export const insertNewlineAtCaret = (element: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return;

  if (typeof document.execCommand === "function") {
    document.execCommand("insertText", false, "\n");
    return;
  }

  range.deleteContents();

  const lineBreak = document.createElement("br");
  range.insertNode(lineBreak);

  // Move the caret after the break so subsequent typing lands on the new line
  range.setStartAfter(lineBreak);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // execCommand emits an input event of its own, so emit one here too and keep
  // both paths looking the same to the input handler
  element.dispatchEvent(
    typeof InputEvent === "function"
      ? new InputEvent("input", { bubbles: true, inputType: "insertLineBreak" })
      : new Event("input", { bubbles: true })
  );
};
