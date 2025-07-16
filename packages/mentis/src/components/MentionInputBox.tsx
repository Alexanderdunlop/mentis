import React from "react";
import type { MentionInputProps } from "../types/MentionInput.types";

type MentionInputBoxProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  showModal: boolean;
  filteredOptions: MentionInputProps["options"];
  highlightedIndex: number;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  slotsProps?: MentionInputProps["slotsProps"];
};

export const MentionInputBox: React.FC<MentionInputBoxProps> = ({
  inputRef,
  value,
  showModal,
  filteredOptions,
  highlightedIndex,
  handleChange,
  handleKeyDown,
  slotsProps,
}) => (
  <input
    className="mention-input"
    placeholder="Type @ to mention someone"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={showModal}
    {...slotsProps?.input}
    ref={inputRef}
    value={value}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    aria-haspopup="listbox"
    aria-controls={showModal ? "mention-listbox" : undefined}
    aria-activedescendant={
      showModal && filteredOptions.length > 0
        ? `mention-option-${filteredOptions[highlightedIndex].value}`
        : undefined
    }
  />
);

export type { MentionInputBoxProps };
