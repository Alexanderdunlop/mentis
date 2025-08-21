import type { MentionData } from "../../types/MentionInput.types";
// import { flattenNodes } from "./flattenNodes";

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
  const children = Array.from(element.childNodes);
  // const nodes = flattenNodes(element, true);

  let displayValue = "";
  let dataValue = "";
  const mentions: MentionData["mentions"] = [];

  children.forEach((node, index) => {
    // All children should be divs
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      node instanceof HTMLElement &&
      node.tagName.toLowerCase() !== "div"
    ) {
      return;
    }

    // Only for the first div don't add a newline
    if (index !== 0) {
      displayValue += "\n";
      dataValue += "\n";
      return;
    }

    const divChildren = Array.from(node.childNodes);

    divChildren.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent || "";
        displayValue += textContent;
        dataValue += textContent;
        return;
      }

      if (
        child.nodeType === Node.ELEMENT_NODE &&
        child instanceof HTMLElement &&
        child.tagName.toLowerCase() === "span" &&
        child.className === "mention-chip"
      ) {
        const chipText = child.textContent || "";
        mentions.push({
          label: child.dataset.label || "",
          value: child.dataset.value || "",
          // TODO: Fix this
          startIndex: 0,
          // TODO: Fix this
          endIndex: 0 + chipText.length,
        });

        displayValue += chipText;
        dataValue += child.dataset.value;
        // TODO: Add current Index

        return;
      }
    });

    // console.log("node", node);
    // if (node.nodeType === Node.TEXT_NODE) {
    //   const textContent = node.textContent || "";
    //   displayValue += textContent;
    //   dataValue += textContent;
    // } else if (node.nodeType === Node.ELEMENT_NODE) {
    //   const nodeElement = node as HTMLElement;
    //   const tagName = nodeElement.tagName.toLowerCase();

    //   if (tagName === "span" && nodeElement.className === "mention-chip") {
    //     console.log("nodeElement", nodeElement);
    //   }

    //   if (tagName === "br") {
    //     displayValue += "\n";
    //     dataValue += "\n";
    //     return;
    //   }

    //   console.log("node", node);
    //   console.log("nodeElement", nodeElement);

    //   if (nodeElement.dataset.value && nodeElement.dataset.label) {
    //     const chipText = nodeElement.textContent || "";
    //     mentions.push({
    //       label: nodeElement.dataset.label,
    //       value: nodeElement.dataset.value,
    //       // TODO: Fix this
    //       startIndex: 0,
    //       // TODO: Fix this
    //       endIndex: 0 + chipText.length,
    //     });

    //     displayValue += chipText;
    //     dataValue += nodeElement.dataset.value;
    //     // TODO: Add current Index

    //     return;
    //   }
    // }
  });

  // Drop the last newline if there are two in a row at the end.
  // if (displayValue.endsWith("\n\n")) {
  //   displayValue = displayValue.slice(0, -1);
  //   dataValue = dataValue.slice(0, -1);
  // }

  return {
    displayValue,
    dataValue,
    mentions,
  };
};
