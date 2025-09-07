import React from "react";
import type { MentionItem } from "../platform/types";

type MentionModalState =
  | {
      query: string;
    }
  | false;

type MentionModalProps = {
  options: MentionItem[];
  modalState: MentionModalState;
};

export const MentionModal = ({ options, modalState }: MentionModalProps) => {
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
      {filteredOptions.map((option) => (
        <div key={option.value} className="mention-option">
          {option.label}
        </div>
      ))}
    </div>
  );
};
