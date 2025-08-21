import { addSpaceIfNeeded } from "../addSpaceIfNeeded";
import { type MentionOptionWithoutFunction } from "../filterOutOptionFunctions";

type InsertMentionIntoDOMProps = {
  element: HTMLElement;
  option: MentionOptionWithoutFunction;
  mentionStart: number;
  mentionQuery: string;
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
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
  // Find the text content and calculate the actual character positions
  const text = element.textContent || "";
  const triggerIndex = text.lastIndexOf(
    trigger,
    mentionStart + mentionQuery.length
  );

  if (triggerIndex === -1) return;

  // Create the mention element
  const mentionElement = document.createElement("span");
  mentionElement.className = chipClassName;
  mentionElement.contentEditable = "true";
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

  const spaceNeeded = addSpaceIfNeeded({
    text,
    startIndex: triggerIndex + mentionQuery.length + 1,
    matchLength: 0,
  });

  let spaceNode = document.createTextNode(" ");
  if (spaceNeeded) {
    fragment.appendChild(spaceNode);
  }

  if (afterText) {
    fragment.appendChild(document.createTextNode(afterText));
  }

  // Replace the text node with the fragment
  textNode.parentNode?.replaceChild(fragment, textNode);

  const selection = window.getSelection();
  if (!selection) return;

  // Set cursor position immediately after the space
  const newRange = document.createRange();
  selection.removeAllRanges();

  newRange.setStart(spaceNeeded ? spaceNode : mentionElement, 1);
  newRange.setEnd(spaceNeeded ? spaceNode : mentionElement, 1);
  newRange.collapse(true);
  selection.addRange(newRange);
};
