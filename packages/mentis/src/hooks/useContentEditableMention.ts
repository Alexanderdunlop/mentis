import { useRef, useEffect, type KeyboardEvent } from "react";
import type { MentionOption, MentionData } from "../types/MentionInput.types";
import { insertMentionIntoDOM } from "../utils/insertMentionIntoDOM";
import { extractMentionData } from "../utils/extractMentionData";
import { removeTriggerAndQuery } from "../utils/removeTriggerAndQuery";
import { useMentionState } from "./useMentionState";
import { useMentionInput } from "./useMentionInput";
import { useMentionPaste } from "./useMentionPaste";
import { useMentionFocus } from "./useMentionFocus";

type UseContentEditableMentionProps = {
  options: MentionOption[];
  value: string;
  keepTriggerOnSelect: boolean;
  trigger: string;
  autoConvertMentions: boolean;
  chipClassName: string;
  onChange?: (value: MentionData) => void;
};

export function useContentEditableMention({
  options,
  value,
  keepTriggerOnSelect,
  trigger,
  autoConvertMentions,
  chipClassName,
  onChange,
}: UseContentEditableMentionProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Centralized state management
  const {
    showModal,
    modalPosition,
    highlightedIndex,
    mentionStart,
    mentionQuery,
    filteredOptions,
    openModal,
    closeModal,
    resetSelection,
    updateSelection,
    handleKeyboardNavigation,
    getSelectedOption,
  } = useMentionState(options);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeModal]);

  // Input processing
  const { processInput } = useMentionInput({
    editorRef,
    options,
    trigger,
    keepTriggerOnSelect,
    autoConvertMentions,
    chipClassName,
    value,
    onChange,
    onMentionDetection: (detection) => {
      if (!detection.isActive) {
        closeModal();
        resetSelection();
        return;
      }

      updateSelection(detection.start, detection.query);
      openModal(editorRef);
    },
  });

  // Paste handling
  const { handlePaste } = useMentionPaste({
    editorRef,
    options,
    trigger,
    keepTriggerOnSelect,
    chipClassName,
    onChange,
  });

  // Focus handling
  const { handleFocus, handleBlur } = useMentionFocus({
    editorRef,
  });

  // Event handlers
  const handleInput = (e?: Event): void => {
    processInput(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const key = e.key;

    // Handle keyboard navigation
    if (handleKeyboardNavigation(key)) {
      if (key === "Escape") {
        closeModal();
      }
      e.preventDefault();
      return;
    }

    // Handle selection
    if (showModal && filteredOptions.length > 0) {
      if (key === "Enter" || key === "Tab") {
        e.preventDefault();
        const selectedOption = getSelectedOption();
        if (selectedOption) {
          handleSelect(selectedOption);
        }
      }
    }
  };

  const handleSelect = (option: MentionOption): void => {
    if (!editorRef.current) return;

    // Check if value is a function and call it
    if (typeof option.value === "function") {
      option.value();

      // Remove the trigger and any text after it
      removeTriggerAndQuery(
        editorRef.current,
        trigger,
        mentionStart,
        mentionQuery
      );

      closeModal();
      resetSelection();
      return;
    }

    insertMentionIntoDOM({
      element: editorRef.current,
      option: {
        ...option,
        value: option.value,
      },
      mentionStart,
      mentionQuery,
      trigger,
      keepTriggerOnSelect,
      chipClassName,
    });

    closeModal();
    resetSelection();

    const mentionData = extractMentionData(editorRef.current);
    onChange?.(mentionData);

    // Focus the editor after insertion
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  return {
    editorRef,
    showModal,
    modalPosition,
    highlightedIndex,
    filteredOptions,
    handleInput,
    handleKeyDown,
    handleSelect,
    handleFocus,
    handleBlur,
    handlePaste,
  };
}
