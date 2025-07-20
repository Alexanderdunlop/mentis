import { useEffect } from "react";
import type { MentionOption, MentionData } from "../types/MentionInput.types";
import { getTextContent } from "../utils/getTextContent";
import { getCaretPosition } from "../utils/getCaretPosition";
import { detectMentionTrigger } from "../utils/detectMentionTrigger";
import { convertTextToChips } from "../utils/convertTextToChips";
import { extractMentionData } from "../utils/extractMentionData";

type UseMentionInputProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  options: MentionOption[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  autoConvertMentions: boolean;
  chipClassName: string;
  defaultValue: string;
  onChange?: (value: MentionData) => void;
  onMentionDetection: (detection: {
    isActive: boolean;
    query: string;
    start: number;
  }) => void;
};

export function useMentionInput({
  editorRef,
  options,
  trigger,
  keepTriggerOnSelect,
  autoConvertMentions,
  chipClassName,
  defaultValue,
  onChange,
  onMentionDetection,
}: UseMentionInputProps) {
  useEffect(() => {
    if (
      defaultValue &&
      editorRef.current &&
      editorRef.current.textContent !== defaultValue
    ) {
      editorRef.current.textContent = defaultValue;
    }
  }, [defaultValue, editorRef]);

  const handleChipInput = (chip: Element): void => {
    if (!editorRef.current) return;

    // Remove the chip element
    chip.remove();

    // Trigger onChange with updated data
    const mentionData = extractMentionData(editorRef.current);
    onChange?.(mentionData);
  };

  const isInsideChip = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    // Check if we're inside a chip element
    if (container.nodeType === Node.ELEMENT_NODE) {
      const element = container as Element;
      if (element.classList.contains(chipClassName)) {
        return true;
      }
    } else if (container.nodeType === Node.TEXT_NODE) {
      // Check if the text node is inside a chip
      let parent = container.parentElement;
      while (parent && parent !== editorRef.current) {
        if (parent.classList.contains(chipClassName)) {
          return true;
        }
        parent = parent.parentElement;
      }
    }

    return false;
  };

  const processInput = (e?: Event): void => {
    if (!editorRef.current) return;

    const inputEvent = e as InputEvent;

    // Check if the current selection is inside a chip
    if (isInsideChip()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        let chipElement: Element | null = null;

        if (container.nodeType === Node.ELEMENT_NODE) {
          const element = container as Element;
          if (element.classList.contains(chipClassName)) {
            chipElement = element;
          }
        } else if (container.nodeType === Node.TEXT_NODE) {
          let parent = container.parentElement;
          while (parent && parent !== editorRef.current) {
            if (parent.classList.contains(chipClassName)) {
              chipElement = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }

        if (chipElement) {
          handleChipInput(chipElement);
          return;
        }
      }
    }

    const text = getTextContent(editorRef.current);
    const caretPos = getCaretPosition(editorRef.current);

    // Check if user just typed a space or pressed enter - good time to convert mentions
    if (autoConvertMentions) {
      if (
        inputEvent?.data === " " ||
        inputEvent?.inputType === "insertParagraph"
      ) {
        // Use setTimeout to ensure DOM has updated before conversion
        setTimeout(
          () =>
            convertTextToChips({
              editorRef,
              options,
              keepTriggerOnSelect,
              trigger,
              chipClassName,
            }),
          0
        );
      }
    }

    if (editorRef.current) {
      const mentionData = extractMentionData(editorRef.current);
      onChange?.(mentionData);
    }

    const mentionDetection = detectMentionTrigger(
      text,
      caretPos,
      trigger,
      editorRef.current
    );

    onMentionDetection(mentionDetection);
  };

  return {
    processInput,
    handleChipInput,
    isInsideChip,
  };
}
