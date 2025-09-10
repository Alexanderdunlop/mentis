import { useEffect } from "react";
import type { ContentEditableElement } from "../../platform/types";

type KeyboardNavigationProps = {
  contentEditable: ContentEditableElement | null;
  isModalOpen: boolean;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onEscape: () => void;
};

export const useKeyboardNavigation = ({
  contentEditable,
  isModalOpen,
  onArrowUp,
  onArrowDown,
  onEnter,
  onEscape,
}: KeyboardNavigationProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          onArrowDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          onArrowUp();
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          onEnter();
          break;
        case "Escape":
          e.preventDefault();
          onEscape();
          break;
      }
    };

    if (!contentEditable) return;

    contentEditable.api.addEventListener("keydown", handleKeyDown);
    return () => {
      contentEditable.api.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, onArrowUp, onArrowDown, onEnter, onEscape, contentEditable]);
};
