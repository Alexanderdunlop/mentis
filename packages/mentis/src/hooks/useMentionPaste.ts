import type { ClipboardEvent } from "react";
import type { MentionOption, MentionData } from "../types/MentionInput.types";
import { parseMentionsInText } from "../utils/parseMentionsInText";
import { extractMentionData } from "../utils/extractMentionData";
import { filterOutOptionFunctions } from "../utils/filterOutOptionFunctions";

type CreateAndInsertFragmentProps = {
  text: string;
  options: MentionOption[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
  selection: Selection;
  range: Range;
};

const splitTextIntoLines = (text: string): string[] => {
  return text.split("\n");
};

const createAndInsertFragment = ({
  text,
  options,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
  selection,
  range,
}: CreateAndInsertFragmentProps): DocumentFragment => {
  const optionsWithoutFunctions = filterOutOptionFunctions(options);
  const fragment = parseMentionsInText({
    text,
    options: optionsWithoutFunctions,
    trigger,
    keepTriggerOnSelect,
    chipClassName,
  });
  range.insertNode(fragment);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  return fragment;
};

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

    const lines = splitTextIntoLines(text);

    for (const line of lines) {
      createAndInsertFragment({
        text: line,
        options,
        trigger,
        keepTriggerOnSelect,
        chipClassName,
        selection,
        range,
      });
    }

    const mentionData = extractMentionData(editorRef.current);
    onChange?.(mentionData);
  };

  return {
    handlePaste,
  };
}
