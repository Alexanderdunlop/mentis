import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import type { MentionOption } from "../types/MentionInput.types";
import { getCaretPosition } from "../utils/getCaretPosition";
import { getTextContent } from "../utils/getTextContent";
import { detectMentionTrigger } from "../utils/detectMentionTrigger";
import { filterMentionOptions } from "../utils/filterMentionOptions";
import { insertMentionIntoDOM } from "../utils/insertMentionIntoDOM";
import { parseMentionsInText } from "../utils/parseMentionsInText";
import { convertTextToChips } from "../utils/convertTextToChips";

type UseContentEditableMentionProps = {
  options: MentionOption[];
  defaultValue: string;
  keepTriggerOnSelect: boolean;
  trigger: string;
  autoConvertMentions: boolean;
  chipClassName?: string;
  onChange?: (value: string) => void;
};

export function useContentEditableMention({
  options,
  defaultValue,
  keepTriggerOnSelect,
  trigger,
  autoConvertMentions,
  chipClassName,
  onChange,
}: UseContentEditableMentionProps) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [mentionQuery, setMentionQuery] = useState<string>("");

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      defaultValue &&
      editorRef.current &&
      editorRef.current.textContent !== defaultValue
    ) {
      editorRef.current.textContent = defaultValue;
    }
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return filterMentionOptions(options, mentionQuery);
  }, [options, mentionQuery]);

  const handleInput = (e?: Event): void => {
    if (!editorRef.current) return;

    const text = getTextContent(editorRef.current);
    const caretPos = getCaretPosition(editorRef.current);

    // Check if user just typed a space or pressed enter - good time to convert mentions
    if (autoConvertMentions) {
      const inputEvent = e as InputEvent;
      if (
        inputEvent?.data === " " ||
        inputEvent?.inputType === "insertParagraph"
      ) {
        // Use setTimeout to ensure DOM has updated before conversion
        setTimeout(
          () =>
            convertTextToChips({
              editorRef,
              options,
              keepTriggerOnSelect,
              trigger,
              chipClassName,
            }),
          0
        );
      }
    }

    onChange?.(text);

    const mentionDetection = detectMentionTrigger(
      text,
      caretPos,
      trigger,
      editorRef.current
    );

    if (!mentionDetection.isActive) {
      setShowModal(false);
      return;
    }

    setMentionQuery(mentionDetection.query);
    setShowModal(true);
    setHighlightedIndex(0);
    setMentionStart(mentionDetection.start);

    setModalPosition({
      top: editorRef.current.offsetTop + editorRef.current.offsetHeight,
      left: editorRef.current.offsetLeft,
    });
  };

  const handleModalKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setShowModal(false);
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (showModal && filteredOptions.length > 0) {
      handleModalKeyDown(e);
      return;
    }
  };

  const handleSelect = (option: MentionOption): void => {
    if (!editorRef.current) return;

    insertMentionIntoDOM({
      element: editorRef.current,
      option,
      mentionStart,
      mentionQuery,
      trigger,
      keepTriggerOnSelect,
      chipClassName,
    });

    setShowModal(false);

    const newText = getTextContent(editorRef.current);
    onChange?.(newText);

    // Focus the editor after insertion
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  const handleFocus = (): void => {
    editorRef.current?.classList.remove("empty");
  };

  const handleBlur = (): void => {
    if (editorRef.current?.textContent === "") {
      editorRef.current.classList.add("empty");
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");

    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Parse the text and convert mentions to chips
    const fragment = parseMentionsInText({
      text,
      options,
      trigger,
      keepTriggerOnSelect,
      chipClassName,
    });
    range.insertNode(fragment);

    // Move cursor to the end of the inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    // Update the text content
    const newText = getTextContent(editorRef.current);
    onChange?.(newText);
  };

  return {
    editorRef,
    showModal,
    modalPosition,
    highlightedIndex,
    filteredOptions,
    handleInput,
    handleKeyDown,
    handleSelect,
    handleFocus,
    handleBlur,
    handlePaste,
  };
}
