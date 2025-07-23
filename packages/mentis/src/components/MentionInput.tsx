import React from "react";
import type { MentionInputProps } from "../types/MentionInput.types";
import { useContentEditableMention } from "../hooks/useContentEditableMention";
import { MentionModal } from "./MentionModal";
import { cn } from "../utils/cn";

export const MentionInput: React.FC<MentionInputProps> = ({
  value = "",
  options,
  slotsProps,
  keepTriggerOnSelect = true,
  trigger = "@",
  autoConvertMentions = false,
  onChange,
  onKeyDown,
}) => {
  const {
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
  } = useContentEditableMention({
    options,
    value,
    keepTriggerOnSelect,
    trigger,
    autoConvertMentions,
    chipClassName: cn("mention-chip", slotsProps?.chipClassName),
    onChange,
    onKeyDown,
  });

  return (
    <div className="mention-input-container" {...slotsProps?.container}>
      <div
        data-placeholder={`Type ${trigger} to mention someone`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showModal}
        aria-activedescendant={
          showModal && filteredOptions.length > 0
            ? `mention-option-${filteredOptions[highlightedIndex].value}`
            : undefined
        }
        aria-haspopup="listbox"
        aria-controls={showModal ? "mention-modal" : undefined}
        {...slotsProps?.contentEditable}
        className={cn(
          "content-editable-input",
          slotsProps?.contentEditable?.className
        )}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => handleInput(e.nativeEvent)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
      {showModal && (
        <MentionModal
          modalPosition={modalPosition}
          filteredOptions={filteredOptions}
          highlightedIndex={highlightedIndex}
          slotsProps={slotsProps}
          handleSelect={handleSelect}
        />
      )}
    </div>
  );
};
