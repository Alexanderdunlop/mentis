import type { MentionData } from "../../types/MentionInput.types";
import { flattenNodes } from "./flattenNodes";

type ExtractTextAndMentionsFromNodesProps = {
  element: HTMLElement;
};

type ExtractTextAndMentionsFromNodesResponse = {
  displayValue: string;
  dataValue: string;
  mentions: MentionData["mentions"];
};

export const extractTextAndMentionsFromNodes = ({
  element,
}: ExtractTextAndMentionsFromNodesProps): ExtractTextAndMentionsFromNodesResponse => {
  const nodes = flattenNodes(element, true);

  let displayValue = "";
  let dataValue = "";
  const mentions: MentionData["mentions"] = [];

  nodes.forEach((node) => {
    console.log("node", node);
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      displayValue += textContent;
      dataValue += textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const nodeElement = node as HTMLElement;
      const tagName = nodeElement.tagName.toLowerCase();

      if (tagName === "span" && nodeElement.className === "mention-chip") {
        console.log("nodeElement", nodeElement);
      }

      if (tagName === "br") {
        displayValue += "\n";
        dataValue += "\n";
        return;
      }

      console.log("node", node);
      console.log("nodeElement", nodeElement);

      if (nodeElement.dataset.value && nodeElement.dataset.label) {
        const chipText = nodeElement.textContent || "";
        mentions.push({
          label: nodeElement.dataset.label,
          value: nodeElement.dataset.value,
          // TODO: Fix this
          startIndex: 0,
          // TODO: Fix this
          endIndex: 0 + chipText.length,
        });

        displayValue += chipText;
        dataValue += nodeElement.dataset.value;
        // TODO: Add current Index

        return;
      }
    }
  });

  // Drop the last newline if there are two in a row at the end.
  if (displayValue.endsWith("\n\n")) {
    displayValue = displayValue.slice(0, -1);
    dataValue = dataValue.slice(0, -1);
  }

  return {
    displayValue,
    dataValue,
    mentions,
  };
};
