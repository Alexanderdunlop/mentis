export const removeTriggerAndQuery = (
  element: HTMLElement,
  trigger: string,
  mentionStart: number,
  mentionQuery: string
): void => {
  const text = element.textContent || "";
  const triggerIndex = text.lastIndexOf(
    trigger,
    mentionStart + mentionQuery.length
  );

  if (triggerIndex === -1) return;

  // Find the text node containing the trigger
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let textNode: Text | null = null;
  let currentOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;

    if (currentOffset + nodeLength > triggerIndex) {
      textNode = node;
      break;
    }
    currentOffset += nodeLength;
  }

  if (textNode) {
    const nodeOffset = triggerIndex - currentOffset;
    const beforeText = textNode.textContent?.substring(0, nodeOffset) || "";

    // Replace the text node with only the text before the trigger
    if (beforeText) {
      textNode.textContent = beforeText;
    } else {
      textNode.parentNode?.removeChild(textNode);
    }

    // Set cursor position at the end of the remaining text
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      if (beforeText) {
        range.setStart(textNode, beforeText.length);
        range.setEnd(textNode, beforeText.length);
      } else {
        // If no text before trigger, position cursor at the beginning of the element
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};
