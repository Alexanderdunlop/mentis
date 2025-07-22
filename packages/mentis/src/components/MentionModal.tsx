import React from "react";
import type { MentionInputProps } from "../types/MentionInput.types";
import { getOptionClassName } from "../utils/getOptionClassName";

type MentionModalProps = {
  modalPosition: { top: number; left: number };
  filteredOptions: MentionInputProps["options"];
  highlightedIndex: number;
  slotsProps?: MentionInputProps["slotsProps"];
  handleSelect: (option: MentionInputProps["options"][number]) => void;
};

export const MentionModal: React.FC<MentionModalProps> = ({
  modalPosition,
  filteredOptions,
  highlightedIndex,
  slotsProps,
  handleSelect,
}) => (
  <div
    className="mention-modal"
    {...slotsProps?.modal}
    id="mention-modal"
    role="listbox"
    style={{
      top: modalPosition.top,
      left: modalPosition.left,
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
          key={typeof option.value === "function" ? option.label : option.value}
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
