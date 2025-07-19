import type { MentionOption } from "../types/MentionInput.types";

type InsertMentionIntoDOMProps = {
  element: HTMLElement;
  option: MentionOption;
  mentionStart: number;
  mentionQuery: string;
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName?: string;
};

export const insertMentionIntoDOM = ({
  element,
  option,
  mentionStart,
  mentionQuery,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
}: InsertMentionIntoDOMProps): void => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Find the text content and calculate the actual character positions
  const text = element.textContent || "";
  const triggerIndex = text.lastIndexOf(
    trigger,
    mentionStart + mentionQuery.length
  );

  if (triggerIndex === -1) return;

  // Create the mention element
  const mentionElement = document.createElement("span");
  mentionElement.className = chipClassName ?? "mention-chip";
  mentionElement.contentEditable = "false";
  mentionElement.dataset.value = option.value;
  mentionElement.dataset.label = option.label;
  mentionElement.textContent = keepTriggerOnSelect
    ? `${trigger}${option.label}`
    : option.label;

  // Find the text node containing the trigger and replace only that part
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let textNode: Text | null = null;
  let currentOffset = 0;

  // Find the text node containing the trigger
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;

    if (currentOffset + nodeLength > triggerIndex) {
      textNode = node;
      break;
    }
    currentOffset += nodeLength;
  }

  if (!textNode) return;

  // Calculate the position within the text node
  const nodeOffset = triggerIndex - currentOffset;
  const beforeText = textNode.textContent?.substring(0, nodeOffset) || "";
  const afterText =
    textNode.textContent?.substring(nodeOffset + mentionQuery.length + 1) || "";

  // Create document fragment to hold the new content
  const fragment = document.createDocumentFragment();

  if (beforeText) {
    fragment.appendChild(document.createTextNode(beforeText));
  }

  fragment.appendChild(mentionElement);

  // Add a space after the mention
  const spaceNode = document.createTextNode(" ");
  fragment.appendChild(spaceNode);

  if (afterText) {
    fragment.appendChild(document.createTextNode(afterText));
  }

  // Replace the text node with the fragment
  textNode.parentNode?.replaceChild(fragment, textNode);

  // Set cursor position immediately after the space
  const newRange = document.createRange();
  newRange.setStart(spaceNode, 1); // Position after the space
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);
};
