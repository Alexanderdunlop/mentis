import { useState } from "react";
import type { MentionOption } from "../types/MentionInput.types";
import { filterMentionOptions } from "../utils/filterMentionOptions";

export function useMentionState(options: MentionOption[]) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [mentionQuery, setMentionQuery] = useState<string>("");

  const filteredOptions = filterMentionOptions(options, mentionQuery);

  const updateModalPosition = (
    editorRef: React.RefObject<HTMLDivElement | null>
  ): void => {
    if (editorRef.current) {
      setModalPosition({
        top: editorRef.current.offsetTop + editorRef.current.offsetHeight,
        left: editorRef.current.offsetLeft,
      });
    }
  };

  const openModal = (
    editorRef: React.RefObject<HTMLDivElement | null>
  ): void => {
    setShowModal(true);
    updateModalPosition(editorRef);
  };

  const closeModal = (): void => {
    setShowModal(false);
  };

  const resetSelection = (): void => {
    setHighlightedIndex(0);
    setMentionStart(0);
    setMentionQuery("");
  };

  const updateSelection = (start: number, query: string): void => {
    setMentionStart(start);
    setMentionQuery(query);
    setHighlightedIndex(0);
  };

  const handleKeyboardNavigation = (key: string): boolean => {
    if (!showModal || filteredOptions.length === 0) {
      return false;
    }

    switch (key) {
      case "ArrowDown":
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        return true;
      case "ArrowUp":
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        return true;
      case "Escape":
        return true;
      default:
        return false;
    }
  };

  const getSelectedOption = (): MentionOption | undefined => {
    return filteredOptions[highlightedIndex];
  };

  return {
    // State
    showModal,
    modalPosition,
    highlightedIndex,
    mentionStart,
    mentionQuery,
    filteredOptions,

    // Actions
    openModal,
    closeModal,
    resetSelection,
    updateSelection,
    handleKeyboardNavigation,
    getSelectedOption,
  };
}
