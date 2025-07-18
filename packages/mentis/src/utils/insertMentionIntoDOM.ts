import type { MentionOption } from "../types/MentionInput.types";

export const insertMentionIntoDOM = (
  element: HTMLElement,
  option: MentionOption,
  mentionStart: number,
  mentionQuery: string,
  trigger: string,
  keepTriggerOnSelect: boolean
): void => {
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
  mentionElement.className = "mention-chip";
  mentionElement.contentEditable = "false";
  mentionElement.dataset.value = option.value;
  mentionElement.dataset.label = option.label;
  mentionElement.textContent = keepTriggerOnSelect
    ? `${trigger}${option.label}`
    : option.label;

  // Clear the element and rebuild with the mention
  const beforeMention = text.substring(0, triggerIndex);
  const afterMention = text.substring(triggerIndex + mentionQuery.length + 1);

  element.innerHTML = "";

  if (beforeMention) {
    element.appendChild(document.createTextNode(beforeMention));
  }

  element.appendChild(mentionElement);

  // Add a space after the mention
  const spaceNode = document.createTextNode(" ");
  element.appendChild(spaceNode);

  if (afterMention) {
    element.appendChild(document.createTextNode(afterMention));
  }

  // Set cursor position immediately after the space
  const newRange = document.createRange();
  newRange.setStart(spaceNode, 1); // Position after the space
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);
};
