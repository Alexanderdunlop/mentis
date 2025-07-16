import React from "react";
import "./MentionInput.css";
import type { MentionInputProps } from "./types/MentionInput.types";
import { useMentionInput } from "./hooks/useMentionInput";
import { MentionInputBox } from "./components/MentionInputBox";
import { MentionListbox } from "./components/MentionListbox";

export const MentionInput: React.FC<MentionInputProps> = ({
  defaultValue,
  options,
  slotsProps,
  keepTriggerOnSelect,
  onChange,
}) => {
  const {
    inputRef,
    value,
    showModal,
    modalPosition,
    highlightedIndex,
    filteredOptions,
    handleChange,
    handleKeyDown,
    handleSelect,
  } = useMentionInput({
    options,
    defaultValue,
    keepTriggerOnSelect,
    onChange,
  });

  return (
    <div className="mention-input-container" {...slotsProps?.container}>
      <MentionInputBox
        inputRef={inputRef}
        value={value}
        showModal={showModal}
        filteredOptions={filteredOptions}
        highlightedIndex={highlightedIndex}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
        slotsProps={slotsProps}
      />
      {showModal && (
        <MentionListbox
          inputRef={inputRef}
          modalPosition={modalPosition}
          filteredOptions={filteredOptions}
          highlightedIndex={highlightedIndex}
          handleSelect={handleSelect}
          slotsProps={slotsProps}
        />
      )}
    </div>
  );
};
