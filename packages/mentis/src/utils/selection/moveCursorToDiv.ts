export const moveCursorToDiv = (div: HTMLDivElement | HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  selection.removeAllRanges();

  if (div.firstChild) {
    if (div.firstChild.nodeType === Node.TEXT_NODE) {
      // Text node - position at the end of the text
      const textLength = div.firstChild.textContent?.length || 0;
      range.setStart(div.firstChild, textLength);
      range.setEnd(div.firstChild, textLength);
    } else if (div.firstChild.nodeName === "BR") {
      // BR element - position before the BR
      range.setStartBefore(div.firstChild);
      range.setEndBefore(div.firstChild);
    } else {
      // Other element - position at the end of its content
      range.setStart(div.firstChild, div.firstChild.childNodes.length);
      range.setEnd(div.firstChild, div.firstChild.childNodes.length);
    }
  } else {
    // Empty div - position inside the div
    range.setStart(div, 0);
    range.setEnd(div, 0);
  }

  selection.addRange(range);
};
