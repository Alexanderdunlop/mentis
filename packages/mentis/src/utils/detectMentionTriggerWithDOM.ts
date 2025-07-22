type DetectMentionTriggerWithDOMProps = {
  text: string;
  caretPosition: number;
  trigger: string;
  element: HTMLElement;
  chipClassName: string;
};

type DetectMentionTriggerWithDOMResult = {
  isActive: boolean;
  start: number;
  query: string;
};

export const detectMentionTriggerWithDOM = ({
  text,
  caretPosition,
  trigger,
  element,
  chipClassName,
}: DetectMentionTriggerWithDOMProps): DetectMentionTriggerWithDOMResult => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { isActive: false, start: -1, query: "" };
  }

  const range = selection.getRangeAt(0);

  // Check if cursor is inside or immediately after a chip
  const cursorContainer = range.startContainer;
  const cursorOffset = range.startOffset;

  // If cursor is inside a chip, don't trigger mention
  if (cursorContainer.nodeType === Node.ELEMENT_NODE) {
    const elementAtCursor = cursorContainer.childNodes[cursorOffset];
    if (
      elementAtCursor &&
      elementAtCursor.nodeType === Node.ELEMENT_NODE &&
      chipClassName
        .split(" ")
        .some((cls) => (elementAtCursor as Element).classList.contains(cls))
    ) {
      return { isActive: false, start: -1, query: "" };
    }
  }

  // If cursor is in text node, check if it's inside a chip
  if (cursorContainer.nodeType === Node.TEXT_NODE) {
    let parentElement = cursorContainer.parentElement;
    while (parentElement && parentElement !== element) {
      if (
        chipClassName
          .split(" ")
          .some((cls) => parentElement?.classList.contains(cls))
      ) {
        return { isActive: false, start: -1, query: "" };
      }
      parentElement = parentElement.parentElement;
    }
  }

  // Build a map of text positions to determine if trigger is in actual text or chip
  const textPositionMap = buildTextPositionMap(element, chipClassName);

  // Find the last trigger before caret position that's in actual text
  let lastTriggerIndex = -1;
  let searchPos = caretPosition - 1;

  while (searchPos >= 0) {
    const triggerIndex = text.lastIndexOf(trigger, searchPos);
    if (triggerIndex === -1) break;

    // Check if this trigger is in actual text content (not inside a chip)
    if (textPositionMap[triggerIndex] === "text") {
      lastTriggerIndex = triggerIndex;
      break;
    }

    searchPos = triggerIndex - 1;
  }

  if (lastTriggerIndex === -1) {
    return { isActive: false, start: -1, query: "" };
  }

  const textAfterTrigger = text.substring(lastTriggerIndex + 1, caretPosition);
  const hasSpace = textAfterTrigger.includes(" ");

  if (hasSpace) {
    return { isActive: false, start: -1, query: "" };
  }

  return {
    isActive: true,
    start: lastTriggerIndex,
    query: textAfterTrigger.toLowerCase(),
  };
};

const buildTextPositionMap = (
  element: HTMLElement,
  chipClassName: string
): Record<number, "text" | "chip"> => {
  const map: Record<number, "text" | "chip"> = {};
  let position = 0;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      const isInChip = chipClassName
        .split(" ")
        .some((cls) =>
          (node?.parentElement as Element)?.classList.contains(cls)
        );

      for (let i = 0; i < textContent.length; i++) {
        map[position + i] = isInChip ? "chip" : "text";
      }
      position += textContent.length;
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      chipClassName
        .split(" ")
        .some((cls) => (node as Element).classList.contains(cls))
    ) {
      // Skip processing text inside chips as they're handled by their text nodes
    }
  }

  return map;
};
