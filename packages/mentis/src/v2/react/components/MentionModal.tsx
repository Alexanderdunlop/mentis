import React from "react";
import type { MentionItem } from "../../platform/types";
import { cn } from "../../helpers/cn";

type MentionModalState =
  | {
      query: string;
    }
  | false;

type MentionModalProps = {
  options: MentionItem[];
  modalState: MentionModalState;
  highlightedIndex: number;
};

export const MentionModal = ({
  options,
  modalState,
  highlightedIndex,
}: MentionModalProps) => {
  console.log("modalState", modalState);
  if (modalState === false || options.length === 0) return null;

  const filteredOptions = options.filter((option) =>
    option.label.includes(modalState.query)
  );

  return (
    <div className="mention-modal">
      {!filteredOptions.length && (
        <div className="mention-no-options">No items found</div>
      )}
      {filteredOptions.map((option, index) => (
        <div
          key={option.value}
          className={cn(
            "mention-option",
            index === highlightedIndex
              ? "mention-option-highlighted"
              : undefined
          )}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};
