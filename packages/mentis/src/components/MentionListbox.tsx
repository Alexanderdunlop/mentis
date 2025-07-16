import React from "react";
import type { MentionInputProps } from "../types/MentionInput.types";
import { getOptionClassName } from "../utils/getOptionClassName";

type MentionListboxProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  modalPosition: { top: number };
  filteredOptions: MentionInputProps["options"];
  highlightedIndex: number;
  slotsProps?: MentionInputProps["slotsProps"];
  handleSelect: (option: MentionInputProps["options"][number]) => void;
};

export const MentionListbox: React.FC<MentionListboxProps> = ({
  inputRef,
  modalPosition,
  filteredOptions,
  highlightedIndex,
  slotsProps,
  handleSelect,
}) => (
  <div
    className="mention-listbox"
    {...slotsProps?.listbox}
    id="mention-listbox"
    role="listbox"
    style={{
      top:
        modalPosition.top -
        (inputRef.current?.getBoundingClientRect().top || 0),
    }}
  >
    {filteredOptions.length === 0 && (
      <div className="mention-no-options" {...slotsProps?.noOptions}>
        No items found
      </div>
    )}
    {filteredOptions.length > 0 &&
      filteredOptions.map((option, idx) => (
        <div
          {...slotsProps?.option}
          className={getOptionClassName(idx, highlightedIndex, slotsProps)}
          key={option.value}
          id={`mention-option-${option.value}`}
          role="option"
          aria-selected={idx === highlightedIndex}
          onMouseDown={() => handleSelect(option)}
        >
          {option.label}
        </div>
      ))}
  </div>
);
