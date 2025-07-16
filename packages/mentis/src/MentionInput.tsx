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
  trigger,
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
    trigger,
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
        slotsProps={slotsProps}
        trigger={trigger}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
      />
      {showModal && (
        <MentionListbox
          inputRef={inputRef}
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
