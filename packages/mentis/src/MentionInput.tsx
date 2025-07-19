import React from "react";
import type { MentionInputProps } from "./types/MentionInput.types";
import { useContentEditableMention } from "./hooks/useContentEditableMention";
import { MentionModal } from "./components/MentionModal";

export const MentionInput: React.FC<MentionInputProps> = ({
  defaultValue = "",
  options,
  slotsProps,
  keepTriggerOnSelect = true,
  trigger = "@",
  autoConvertMentions = false,
  onChange,
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
    defaultValue,
    keepTriggerOnSelect,
    trigger,
    autoConvertMentions,
    onChange,
  });

  return (
    <div className="mention-input-container" {...slotsProps?.container}>
      <div
        className="content-editable-input"
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
