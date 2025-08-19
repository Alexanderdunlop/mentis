import type { MentionData } from "../types/MentionInput.types";

export const extractMentionData = (element: HTMLElement): MentionData => {
  const mentions: MentionData["mentions"] = [];
  let displayValue = "";
  let dataValue = "";
  let currentIndex = 0;

  // Walk through all child nodes
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      displayValue += textContent;
      dataValue += textContent;
      currentIndex += textContent.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // Check if this is a mention chip
      if (element.dataset.value && element.dataset.label) {
        const chipText = element.textContent || "";
        const startIndex = currentIndex;

        mentions.push({
          label: element.dataset.label,
          value: element.dataset.value,
          startIndex,
          endIndex: startIndex + chipText.length,
        });

        // displayValue shows the label (what user sees)
        displayValue += chipText;
        // dataValue shows the value (actual data)
        dataValue += element.dataset.value;
        currentIndex += chipText.length;
      } else if (tagName === "br") {
        // Handle <br> elements as newlines
        displayValue += "\n";
        dataValue += "\n";
        currentIndex += 1;
      } else if (tagName === "div" && element.childNodes.length === 0) {
        // Handle empty <div> elements as newlines (contentEditable creates these for Enter)
        displayValue += "\n";
        dataValue += "\n";
        currentIndex += 1;
      } else {
        // Handle <div> with content and other block elements that should add newlines
        const isBlockElement = ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName);
        const hasContent = element.childNodes.length > 0;
        
        // Add newline before block element (except for the first element)
        if (isBlockElement && hasContent && (displayValue.length > 0 || dataValue.length > 0)) {
          displayValue += "\n";
          dataValue += "\n";
          currentIndex += 1;
        }
        
        // Recursively process child nodes
        for (const child of Array.from(element.childNodes)) {
          walkNodes(child);
        }
        
        // Add newline after block element (except for the last element in the container)
        if (isBlockElement && hasContent && element.nextSibling) {
          displayValue += "\n";
          dataValue += "\n";
          currentIndex += 1;
        }
      }
    }
  };

  // Process all child nodes
  for (const child of Array.from(element.childNodes)) {
    walkNodes(child);
  }

  return {
    displayValue,
    dataValue,
    mentions,
  };
};
