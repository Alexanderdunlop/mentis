import React, { useCallback, useEffect, useRef } from "react";
import {
  handleInput,
  type MentionQueryDetectedEvent,
} from "../../input/handle-input";
import type { MentionCoreAPI } from "../../core/types";
import type { ContentEditableElement, MentionItem } from "../../platform/types";
import { cn } from "../../helpers/cn";
import { MentionModal } from "./MentionModal";
import { useMentionModal } from "../hooks/useMentionModal";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useMentionCore } from "../hooks/useMentionCore";

type MentionInputProps = {
  value?: string | undefined;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  trigger?: string;
  options: MentionItem[];
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const MentionInputV2: React.FC<MentionInputProps> = ({
  value,
  className,
  style,
  placeholder,
  trigger,
  options,
  onChange,
  onFocus,
  onBlur,
}: MentionInputProps) => {
  const {
    modalState,
    highlightedIndex,
    highlightOption,
    closeModal,
    updateModalState,
    moveHighlight,
  } = useMentionModal({ options });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
    closeModal();
  }, [onBlur, closeModal]);

  const handleInputEvent = useCallback(
    (
      e: Event,
      contentEditable: ContentEditableElement,
      core: MentionCoreAPI
    ) => {
      if (!contentEditable || !core) return;
      // TODO: Should trigger be passed here?
      handleInput({
        e,
        contentEditable,
        core,
      });
    },
    [trigger]
  );

  const handleMentionQueryDetected = useCallback(
    (event: MentionQueryDetectedEvent) => {
      updateModalState({
        query: event.query,
      });
    },
    [updateModalState]
  );

  const handleMentionQueryCleared = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const { contentEditable, initializeContentEditable, updateProgrammatically } =
    useMentionCore({
      value,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onInput: handleInputEvent,
      onChange,
      onMentionQueryDetected: handleMentionQueryDetected,
      onMentionQueryCleared: handleMentionQueryCleared,
    });

  useEffect(() => {
    if (!containerRef.current) return;
    initializeContentEditable({
      container: containerRef.current,
      placeholder,
      className: cn("content-editable-input", className),
      style,
      trigger,
      options,
    });
  }, []);

  useKeyboardNavigation({
    contentEditable,
    isModalOpen: modalState !== false,
    onArrowUp: () => moveHighlight("up"),
    onArrowDown: () => moveHighlight("down"),
    onEnter: () => {
      if (!highlightOption) return;
      console.log("On Enter", highlightOption);
      // handleMentionSelect(highlightOption);
    },
    onEscape: () => closeModal(),
  });

  useEffect(() => {
    if (value === undefined) return;
    updateProgrammatically(value);
  }, [value]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <MentionModal
        options={options}
        modalState={modalState}
        highlightedIndex={highlightedIndex}
      />
    </div>
  );
};
