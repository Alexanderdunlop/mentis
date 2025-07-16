import React from "react";
import type { MentionInputProps } from "../types/MentionInput.types";

type MentionInputBoxProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  showModal: boolean;
  filteredOptions: MentionInputProps["options"];
  highlightedIndex: number;
  slotsProps?: MentionInputProps["slotsProps"];
  trigger?: string;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
};

export const MentionInputBox: React.FC<MentionInputBoxProps> = ({
  inputRef,
  value,
  showModal,
  filteredOptions,
  highlightedIndex,
  trigger,
  slotsProps,
  handleChange,
  handleKeyDown,
}) => (
  <input
    className="mention-input"
    placeholder={`Type ${trigger} to mention someone`}
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
