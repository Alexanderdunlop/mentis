import type { MentionData } from "../types/MentionInput.types";

export const extractMentionData = (element: HTMLElement): MentionData => {
  const mentions: MentionData["mentions"] = [];
  let displayValue = "";
  let dataValue = "";
  let currentIndex = 0;

  const BLOCK_ELEMENTS = ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6"];

  const addNewline = () => {
    displayValue += "\n";
    dataValue += "\n";
    currentIndex += 1;
  };

  const walkChildNodes = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      walkNodes(child);
    }
  };

  // Walk through all child nodes
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      displayValue += textContent;
      dataValue += textContent;
      currentIndex += textContent.length;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const childElement = node as HTMLElement;
    const tagName = childElement.tagName.toLowerCase();

    // Check if this is a mention chip
    if (childElement.dataset.value && childElement.dataset.label) {
      const chipText = childElement.textContent || "";
      const startIndex = currentIndex;

      mentions.push({
        label: childElement.dataset.label,
        value: childElement.dataset.value,
        startIndex,
        endIndex: startIndex + chipText.length,
      });

      // displayValue shows the label (what user sees)
      displayValue += chipText;
      // dataValue shows the value (actual data)
      dataValue += childElement.dataset.value;
      currentIndex += chipText.length;
      return;
    }

    // Handle <br> elements as newlines
    if (tagName === "br") {
      addNewline();
      return;
    }

    if (BLOCK_ELEMENTS.includes(tagName)) {
      // Handle empty block elements as newlines (contentEditable creates these
      // for Enter)
      if (childElement.childNodes.length === 0) {
        addNewline();
        return;
      }

      // A block element starts a new line, unless it opens the content
      if (displayValue.length > 0 || dataValue.length > 0) {
        addNewline();
      }
    }

    // Inline wrappers such as <strong> carry no meaning of their own, and
    // block elements have already contributed their newline, so in both cases
    // keep walking to reach the text and chips inside
    walkChildNodes(childElement);
  };

  walkChildNodes(element);

  // Remove the <br> element if it's the only child of the parent element
  if (
    element.childNodes.length === 1 &&
    element.childNodes[0] instanceof HTMLElement &&
    element.childNodes[0].tagName.toLowerCase() === "br"
  ) {
    element.removeChild(element.childNodes[0]);
  }

  // Remove the empty <div> element if it's the only child of the parent element
  if (
    element.childNodes.length === 1 &&
    element.childNodes[0] instanceof HTMLElement &&
    element.childNodes[0].tagName.toLowerCase() === "div" &&
    element.childNodes[0].textContent === ""
  ) {
    element.removeChild(element.childNodes[0]);
  }

  return {
    displayValue,
    dataValue,
    mentions,
  };
};
