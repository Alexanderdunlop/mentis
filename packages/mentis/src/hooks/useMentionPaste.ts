import type { ClipboardEvent } from "react";
import type { MentionOption, MentionData } from "../types/MentionInput.types";
import { parseMentionsInText } from "../utils/parseMentionsInText";
import { extractMentionData } from "../utils/extractMentionData";
import { filterOutOptionFunctions } from "../utils/filterOutOptionFunctions";

type UseMentionPasteProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  options: MentionOption[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
  onChange?: (value: MentionData) => void;
};

export function useMentionPaste({
  editorRef,
  options,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
  onChange,
}: UseMentionPasteProps) {
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");

    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const optionsWithoutFunctions = filterOutOptionFunctions(options);

    // Parse the text and convert mentions to chips
    const fragment = parseMentionsInText({
      text,
      options: optionsWithoutFunctions,
      trigger,
      keepTriggerOnSelect,
      chipClassName,
    });
    range.insertNode(fragment);

    // Move cursor to the end of the inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    const mentionData = extractMentionData(editorRef.current);
    onChange?.(mentionData);
  };

  return {
    handlePaste,
  };
}
