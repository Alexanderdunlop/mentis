import { useCallback, useState } from "react";
import type { MentionItem } from "../../platform/types";

type MentionModalState =
  | {
      query: string;
    }
  | false;

type useMentionModalProps = {
  options: MentionItem[];
};

export const useMentionModal = ({ options }: useMentionModalProps) => {
  const [modalState, setModalState] = useState<MentionModalState>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const filteredOptions = options.filter((option) =>
    option.label.includes(modalState === false ? "" : modalState.query)
  );

  const highlightOption = options[highlightedIndex];

  const updateModalState = useCallback((state: MentionModalState) => {
    setModalState(state);
    setHighlightedIndex(0);
  }, []);

  const moveHighlight = useCallback(
    (direction: "up" | "down") => {
      if (filteredOptions.length === 0) return;

      setHighlightedIndex((prev) => {
        if (direction === "down") {
          return prev >= filteredOptions.length - 1 ? 0 : prev + 1;
        } else {
          return prev <= 0 ? filteredOptions.length - 1 : prev - 1;
        }
      });
    },
    [filteredOptions]
  );

  const closeModal = useCallback(() => {
    setModalState(false);
    setHighlightedIndex(0);
  }, []);

  return {
    modalState,
    filteredOptions,
    highlightedIndex,
    highlightOption,
    updateModalState,
    moveHighlight,
    closeModal,
  };
};
