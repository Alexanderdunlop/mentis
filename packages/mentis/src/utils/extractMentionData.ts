import type { MentionData } from "../types/MentionInput.types";
import { checkAndRemoveSoloBreakpoint } from "./extractMentionData/checkAndRemoveSoloBreakpoint";
import { extractTextAndMentionsFromNodes } from "./extractMentionData/extractTextAndMentionsFromNodes";
import { removeAllChildNodes } from "./extractMentionData/removeAllChildNodes";
import { removeElementEmptyChildrenNodes } from "./extractMentionData/removeElementEmptyChildrenNodes";

export const extractMentionData = (element: HTMLElement): MentionData => {
  const extractedTextAndMentions = extractTextAndMentionsFromNodes({
    element,
  });

  // If the displayValue is empty, remove all the child nodes.
  if (extractedTextAndMentions.displayValue === "") {
    removeAllChildNodes(element);
  }

  // If there is only one node and it's a <br> element, remove it.
  checkAndRemoveSoloBreakpoint(element);

  // Find any empty string or empty div and delete them.
  removeElementEmptyChildrenNodes(element);

  return {
    displayValue: extractedTextAndMentions.displayValue,
    dataValue: extractedTextAndMentions.dataValue,
    mentions: extractedTextAndMentions.mentions,
  };
};
