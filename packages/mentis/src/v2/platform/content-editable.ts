import type {
  ContentEditableAPI,
  ContentEditableElement,
  SelectionRange,
} from "./types";

const createContentEditableAPI = (
  element: HTMLDivElement
): ContentEditableAPI => {
  const getText = (): string => {
    return element.textContent || "";
  };

  const setText = (text: string): void => {
    const htmlText = text.replace(/ /g, "&nbsp;");
    element.innerHTML = htmlText;
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

  const addEventListener = (event: string, callback: Function): void => {
    element.addEventListener(event, callback as EventListener);
  };

  return {
    getText,
    setText,
    getCursorPosition,
    setCursorPosition,
    getSelectionRange,
    addEventListener,
  };
};

type CreateContentEditableProps = {
  container: HTMLDivElement;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
};

export const createContentEditable = ({
  container,
  className,
  style,
  placeholder,
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
  // Set placeholder
  if (placeholder) {
    element.setAttribute("data-placeholder", placeholder);
  }
  container.appendChild(element);

  return {
    element,
    api: createContentEditableAPI(element),
  };
};
