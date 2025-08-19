import type { MentionData } from "../types/MentionInput.types";

export const extractMentionData = (element: HTMLElement): MentionData => {
  const mentions: MentionData["mentions"] = [];
  let displayValue = "";
  let dataValue = "";
  let currentIndex = 0;

  // Walk through all child nodes
  const walkNodes = (node: Node) => {
    let shouldAddNewline = true;
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      displayValue += textContent;
      dataValue += textContent;
      currentIndex += textContent.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
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
      } else if (tagName === "br" && shouldAddNewline) {
        // Handle <br> elements as newlines
        displayValue += "\n";
        dataValue += "\n";
        currentIndex += 1;
        shouldAddNewline = false;
      } else if (
        tagName === "div" &&
        element.childNodes.length === 0 &&
        shouldAddNewline
      ) {
        // Handle empty <div> elements as newlines (contentEditable creates these for Enter)
        displayValue += "\n";
        dataValue += "\n";
        currentIndex += 1;
        shouldAddNewline = false;
      } else {
        // Handle <div> with content and other block elements that should add newlines
        const isBlockElement = [
          "div",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
        ].includes(tagName);
        const hasContent = childElement.childNodes.length > 0;

        // Add newline before block element (except for the first element)
        // Add newline after block element (except for the last element in the container)
        if (
          isBlockElement &&
          hasContent &&
          (displayValue.length > 0 ||
            dataValue.length > 0 ||
            childElement.nextSibling) &&
          shouldAddNewline
        ) {
          displayValue += "\n";
          dataValue += "\n";
          currentIndex += 1;
          shouldAddNewline = false;
        }
      }
    }
  };

  // Process all child nodes
  for (const child of Array.from(element.childNodes)) {
    walkNodes(child);
  }

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
