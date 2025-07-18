import React from "react";
import "./MentionInput.css";
import type { MentionInputProps } from "./types/MentionInput.types";
import { useContentEditableMention } from "./hooks/useContentEditableMention";
import { MentionListbox } from "./components/MentionListbox";

export const MentionInput: React.FC<MentionInputProps> = ({
  defaultValue,
  options,
  slotsProps,
  keepTriggerOnSelect,
  trigger = "@",
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
        aria-controls={showModal ? "mention-listbox" : undefined}
        {...slotsProps?.contentEditable}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
      {showModal && (
        <MentionListbox
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
