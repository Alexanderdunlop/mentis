import type { MentionOption } from "../types/MentionInput.types";
import { getCaretPosition } from "./getCaretPosition";

type ConvertTextToChipsProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  options: MentionOption[];
  keepTriggerOnSelect: boolean;
  trigger: string;
  chipClassName?: string;
};

export const convertTextToChips = ({
  editorRef,
  options,
  keepTriggerOnSelect,
  trigger,
  chipClassName,
}: ConvertTextToChipsProps): void => {
  if (!editorRef.current) return;

  const selection = window.getSelection();
  const currentCaretPos = getCaretPosition(editorRef.current);

  // Check if there are any mentions that should be converted to chips
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = editorRef.current.innerHTML;

  // Only process text nodes that aren't already inside chips
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Check if this text node is inside a mention chip
      let parent = node.parentNode;
      while (parent && parent !== tempDiv) {
        if (parent.nodeType === Node.ELEMENT_NODE) {
          const element = parent as Element;
          if (element.classList.contains("mention-chip")) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        parent = parent.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let hasChanges = false;
  const textNodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const nodeText = textNode.textContent || "";

    // Check for mentions that need to be converted
    const mentionWithTriggerRegex = new RegExp(
      `\\${trigger}([a-zA-Z0-9_]+)(?=\\s|$)`,
      "g"
    );
    let match;
    const replacements: Array<{ start: number; end: number; option: any }> = [];

    while ((match = mentionWithTriggerRegex.exec(nodeText)) !== null) {
      const mentionText = match[1];
      const matchingOption = options.find(
        (option) =>
          option.label.toLowerCase() === mentionText.toLowerCase() ||
          option.value.toLowerCase() === mentionText.toLowerCase()
      );

      if (matchingOption) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          option: matchingOption,
        });
      }
    }

    // When keepTriggerOnSelect is false, also check for standalone mentions
    if (!keepTriggerOnSelect && options.length > 0) {
      const mentionWithoutTriggerRegex = new RegExp(
        `\\b(${options
          .map((opt) =>
            [opt.label, opt.value]
              .map((val) => val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
              .join("|")
          )
          .join("|")})(?=\\s|$)`,
        "gi"
      );

      while ((match = mentionWithoutTriggerRegex.exec(nodeText)) !== null) {
        const mentionText = match[0];
        const matchingOption = options.find(
          (option) =>
            option.label.toLowerCase() === mentionText.toLowerCase() ||
            option.value.toLowerCase() === mentionText.toLowerCase()
        );

        if (matchingOption) {
          // Check if this overlaps with any trigger-based replacement
          const overlaps = replacements.some(
            (r) =>
              match!.index < r.end && match!.index + match![0].length > r.start
          );

          if (!overlaps) {
            replacements.push({
              start: match.index,
              end: match.index + match[0].length,
              option: matchingOption,
            });
          }
        }
      }
    }

    if (replacements.length > 0) {
      hasChanges = true;
      // Sort replacements by position (reverse order for easier processing)
      replacements.sort((a, b) => b.start - a.start);

      // Apply replacements
      for (const replacement of replacements) {
        const beforeText = nodeText.substring(0, replacement.start);
        const afterText = nodeText.substring(replacement.end);

        // Create mention chip
        const mentionElement = document.createElement("span");
        mentionElement.className = chipClassName ?? "mention-chip";
        mentionElement.contentEditable = "false";
        mentionElement.dataset.value = replacement.option.value;
        mentionElement.dataset.label = replacement.option.label;
        mentionElement.textContent = keepTriggerOnSelect
          ? `${trigger}${replacement.option.label}`
          : replacement.option.label;

        // Create fragment with replacement
        const fragment = document.createDocumentFragment();
        if (beforeText) {
          fragment.appendChild(document.createTextNode(beforeText));
        }
        fragment.appendChild(mentionElement);
        if (afterText) {
          fragment.appendChild(document.createTextNode(afterText));
        }

        // Replace the text node
        textNode.parentNode?.replaceChild(fragment, textNode);
        break; // Process one replacement at a time to avoid issues
      }
    }
  }

  if (hasChanges) {
    // Update the editor content
    editorRef.current.innerHTML = tempDiv.innerHTML;

    // Restore caret position (approximately)
    if (selection && selection.rangeCount > 0) {
      try {
        const range = document.createRange();
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );

        let charCount = 0;
        let targetNode = null;
        let targetOffset = 0;

        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const nodeLength = node.textContent?.length || 0;

          if (charCount + nodeLength >= currentCaretPos) {
            targetNode = node;
            targetOffset = currentCaretPos - charCount;
            break;
          }
          charCount += nodeLength;
        }

        if (targetNode) {
          range.setStart(
            targetNode,
            Math.min(targetOffset, targetNode.textContent?.length || 0)
          );
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (e) {
        // If caret positioning fails, focus at the end
        editorRef.current.focus();
      }
    }
  }
};
