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

type UseContentEditableMentionProps = {
  options: MentionOption[];
  defaultValue?: string;
  keepTriggerOnSelect?: boolean;
  trigger?: string;
  onChange?: (value: string) => void;
};

export function useContentEditableMention({
  options,
  defaultValue = "",
  keepTriggerOnSelect = false,
  trigger = "@",
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

  const handleInput = (): void => {
    if (!editorRef.current) return;

    const text = getTextContent(editorRef.current);
    const caretPos = getCaretPosition(editorRef.current);

    onChange?.(text);

    const mentionDetection = detectMentionTrigger(text, caretPos, trigger);

    if (!mentionDetection.isActive) {
      setShowModal(false);
      return;
    }

    setMentionQuery(mentionDetection.query);
    setShowModal(true);
    setHighlightedIndex(0);
    setMentionStart(mentionDetection.start);

    const rect = editorRef.current.getBoundingClientRect();
    setModalPosition({
      top: rect.bottom,
      left: rect.left,
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

  const handleBackspace = (e: KeyboardEvent<HTMLDivElement>): void => {
    const selection = window.getSelection();

    // Handle backspace near mention chips
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // If cursor is right before a mention chip, move it to after the chip
      if (range.collapsed && range.startContainer.nextSibling) {
        const nextSibling = range.startContainer.nextSibling;
        if (
          nextSibling.nodeType === Node.ELEMENT_NODE &&
          (nextSibling as Element).classList.contains("mention-chip")
        ) {
          e.preventDefault();
          // Position cursor after the chip
          const newRange = document.createRange();
          newRange.setStartAfter(nextSibling);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
      }

      // If cursor is at the start of a text node and previous sibling is a mention chip
      if (
        range.collapsed &&
        range.startOffset === 0 &&
        range.startContainer.previousSibling
      ) {
        const prevSibling = range.startContainer.previousSibling;
        if (
          prevSibling.nodeType === Node.ELEMENT_NODE &&
          (prevSibling as Element).classList.contains("mention-chip")
        ) {
          e.preventDefault();
          // Remove the mention chip
          prevSibling.remove();
          return;
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (showModal && filteredOptions.length > 0) {
      handleModalKeyDown(e);
      return;
    }

    if (e.key === "Backspace") {
      handleBackspace(e);
      return;
    }
  };

  const handleSelect = (option: MentionOption): void => {
    if (!editorRef.current) return;

    insertMentionIntoDOM(
      editorRef.current,
      option,
      mentionStart,
      mentionQuery,
      trigger,
      keepTriggerOnSelect
    );

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
    document.execCommand("insertText", false, text);
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
