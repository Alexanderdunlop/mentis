import { calculateRange } from "./range-calculator";
import type { SelectionRange } from "../platform/types";
import type { InputEventType } from "./types";

export type ProcessInputProps = {
  inputType: InputEventType;
  text: string;
  currentText: string;
  currentPosition: number;
  selectionRange: SelectionRange;
};

export type TextChange = {
  newText: string;
  startIndex: number;
  endIndex: number;
  type: "INSERT" | "DELETE" | "REPLACE" | "FALLBACK";
};

export const processInput = async ({
  inputType,
  text,
  currentText,
  currentPosition,
  selectionRange,
}: ProcessInputProps): Promise<TextChange> => {
  const { startIndex, endIndex } = calculateRange({
    inputType,
    currentPosition,
    selectionStart: selectionRange.startIndex,
    selectionEnd: selectionRange.endIndex,
    textLength: currentText.length,
  });

  switch (inputType) {
    case "insertText":
      const insertTextType = startIndex === endIndex ? "INSERT" : "REPLACE";
      return {
        newText: text,
        startIndex,
        endIndex,
        type: insertTextType,
      };
    case "deleteContentBackward":
      const deleteBackwardText = currentText.slice(
        currentPosition - 1,
        currentPosition
      );
      return {
        newText: deleteBackwardText,
        startIndex,
        endIndex,
        type: "DELETE",
      };
    case "deleteContentForward":
      const deleteContentForwardText = currentText.slice(
        currentPosition,
        currentPosition + 1
      );
      return {
        newText: deleteContentForwardText,
        startIndex,
        endIndex,
        type: "DELETE",
      };
    case "insertFromPaste":
      const clipboardText = await navigator.clipboard.readText();

      const insertFromPasteType =
        startIndex === endIndex ? "INSERT" : "REPLACE";

      return {
        newText: clipboardText,
        startIndex,
        endIndex,
        type: insertFromPasteType,
      };
    default:
      console.warn("Unhandled input type:", inputType);
      return {
        newText: currentText,
        startIndex,
        endIndex,
        type: "FALLBACK",
      };
  }
};
