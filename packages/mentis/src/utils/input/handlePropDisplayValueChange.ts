import { getTextContent } from "../getTextContent";
import { processInput } from "./processInput";

export const handlePropDisplayValueChange = (
  editorRef: HTMLDivElement | null,
  displayValue: string
) => {
  if (!editorRef) return;

  const currentText = getTextContent(editorRef);

  // If the current text is the same as the display value, do nothing.
  if (currentText === displayValue) {
    return;
  }

  if (displayValue === "") {
    // Clear all content including mention chips and ensure truly empty for CSS :empty
    editorRef.innerHTML = "";
    editorRef.textContent = "";
    return;
  }

  editorRef.innerHTML = "";
  editorRef.textContent = displayValue;

  // TODO: Handle chips and mentions
  processInput(editorRef);
};
