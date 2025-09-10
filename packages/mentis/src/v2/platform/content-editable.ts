import { processTextWithMentions } from "./processTextWithMentions";
import type {
  ContentEditableAPI,
  ContentEditableElement,
  MentionItem,
  SelectionRange,
} from "./types";

type CreateContentEditableAPIProps = {
  element: HTMLDivElement;
  trigger: string;
  options: MentionItem[];
};

const createContentEditableAPI = ({
  element,
  trigger,
  options,
}: CreateContentEditableAPIProps): ContentEditableAPI => {
  const getText = (): string => {
    return element.textContent || "";
  };

  // Just been thinking this setText works really well, it shouldn't handle much more.
  // Instead we should store the mentions in a array with their position and value.
  // Then we use the array to determine which value to use in the span.
  // This solves the issue around equal labels but different values.
  // NEED to make a note that copying and pasting will not be able to determine which value it used, as it'll go based off the label.
  // Could have an option for users to copy the value instead of the label.
  const setText = (text: string): void => {
    const htmlText = text.replace(/ /g, "&nbsp;");

    // TODO: Convert values to mentions
    // ISSUE is it needs to update the text
    // Also it needs to update the cursor position
    // Also it needs to emit the stateChanged event after they are all done

    // NOTE: Converts labels to mentions
    const textWithMentions = processTextWithMentions({
      trigger,
      text: htmlText,
      options,
    });

    element.innerHTML = textWithMentions;

    if (text.endsWith("\n")) {
      element.appendChild(document.createElement("br"));
    }

    // NOTE: What happens here when the labels are the same but the values are different?
    // TODO: Could add an event when user selects a mention?

    console.log(element);
  };

  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  };

  const setCursorPosition = (position: number): void => {
    const selection = window.getSelection();
    if (!selection) return;

    let charCount = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const nodeLength = textNode.textContent?.length || 0;

      if (charCount + nodeLength >= position) {
        const range = document.createRange();
        range.setStart(textNode, position - charCount);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      charCount += nodeLength;
    }
  };

  const getSelectionRange = (): SelectionRange => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const pos = getCursorPosition();
      return { startIndex: pos, endIndex: pos };
    }

    const range = selection.getRangeAt(0);

    // Get start position
    const preStartRange = range.cloneRange();
    preStartRange.selectNodeContents(element);
    preStartRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preStartRange.toString().length;

    // Get end position
    const preEndRange = range.cloneRange();
    preEndRange.selectNodeContents(element);
    preEndRange.setEnd(range.endContainer, range.endOffset);
    const endIndex = preEndRange.toString().length;

    return { startIndex, endIndex };
  };

  const getTrigger = (): string => {
    return trigger;
  };

  const addEventListener = (event: string, callback: Function): void => {
    element.addEventListener(event, callback as EventListener);
  };

  const removeEventListener = (event: string, callback: Function): void => {
    element.removeEventListener(event, callback as EventListener);
  };

  return {
    getText,
    setText,
    getCursorPosition,
    setCursorPosition,
    getSelectionRange,
    getTrigger,
    addEventListener,
    removeEventListener,
  };
};

type CreateContentEditableProps = {
  container: HTMLDivElement;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  trigger?: string;
  options: MentionItem[];
};

export const createContentEditable = ({
  container,
  className,
  style,
  placeholder,
  trigger = "@",
  options,
}: CreateContentEditableProps): ContentEditableElement => {
  // Check and remove existing element
  const existingElement = container.querySelector("div");
  if (existingElement) {
    existingElement.remove();
  }

  // Create new element
  const element = document.createElement("div");
  // Set attributes
  element.contentEditable = "true";
  // Apply styles
  element.className = className || "";
  if (style) {
    Object.assign(element.style, style);
  }
  element.style.whiteSpace = "pre-wrap";
  // Set placeholder
  if (placeholder) {
    element.setAttribute("data-placeholder", placeholder);
  }
  container.appendChild(element);

  return {
    element,
    api: createContentEditableAPI({ element, trigger, options }),
  };
};
