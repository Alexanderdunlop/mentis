import type { MentionData } from "../types/MentionInput.types";

export const extractMentionData = (element: HTMLElement): MentionData => {
  const mentions: MentionData["mentions"] = [];
  let displayText = "";
  let rawText = "";
  let currentIndex = 0;

  // Walk through all child nodes
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      displayText += textContent;
      rawText += textContent;
      currentIndex += textContent.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

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

        // displayText shows the label (what user sees)
        displayText += chipText;
        // rawText shows the value (actual data)
        rawText += element.dataset.value;
        currentIndex += chipText.length;
      } else {
        // Recursively process child nodes
        for (const child of Array.from(element.childNodes)) {
          walkNodes(child);
        }
      }
    }
  };

  // Process all child nodes
  for (const child of Array.from(element.childNodes)) {
    walkNodes(child);
  }

  return {
    displayText,
    rawText,
    mentions,
  };
};
