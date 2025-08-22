import type { InputEventType } from "./types";

export type CalculateRangeProps = {
  inputType: InputEventType;
  currentPosition: number;
  selectionStart: number;
  selectionEnd: number;
  textLength: number;
};

export type Range = {
  startIndex: number;
  endIndex: number;
};

export const calculateRange = ({
  inputType,
  currentPosition,
  selectionStart,
  selectionEnd,
  textLength,
}: CalculateRangeProps): Range => {
  if (selectionStart !== selectionEnd) {
    return {
      startIndex: selectionStart,
      endIndex: selectionEnd,
    };
  }

  switch (inputType) {
    case "deleteContentBackward":
      return {
        startIndex: Math.max(0, currentPosition - 1),
        endIndex: currentPosition,
      };
    case "deleteContentForward":
      return {
        startIndex: currentPosition,
        endIndex: Math.min(textLength, currentPosition + 1),
      };
    default:
      return {
        startIndex: currentPosition,
        endIndex: currentPosition,
      };
  }
};
