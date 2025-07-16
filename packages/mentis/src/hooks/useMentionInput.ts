import { useState, useRef, useMemo, type ChangeEvent } from "react";
import type { MentionOption } from "../types/MentionInput.types";
import { isSingleTriggerMention } from "../utils/isSingleTriggerMention";

type UseMentionInputProps = {
  options: MentionOption[];
  defaultValue?: string;
  keepTriggerOnSelect?: boolean;
  trigger?: string;
  onChange?: (value: string) => void;
};

export function useMentionInput({
  options,
  defaultValue = "",
  keepTriggerOnSelect = false,
  trigger = "@",
  onChange,
}: UseMentionInputProps) {
  const [value, setValue] = useState<string>(defaultValue);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [search, setSearch] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
    onChange?.(val);
    const triggerIndex = val.lastIndexOf(trigger);
    const isSingleTrigger = isSingleTriggerMention(val, triggerIndex, trigger);

    if (!isSingleTrigger) {
      setShowModal(false);
      setSearch("");
      setHighlightedIndex(0);
      return;
    }

    setShowModal(true);
    setSearch(val.slice(triggerIndex + trigger.length));
    setHighlightedIndex(0); // Reset highlight on new search
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
  };

  const filteredOptions = useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().startsWith(search.toLowerCase())
      ),
    [options, search]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showModal || filteredOptions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev === 0 ? filteredOptions.length - 1 : prev - 1
        );
        break;
      case "Tab":
      case "Enter":
        event.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setShowModal(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: MentionOption) => {
    const input = inputRef.current as HTMLInputElement;
    const start = input.selectionStart ?? 0;
    const triggerIndex = value.lastIndexOf(trigger, start - 1);

    if (triggerIndex === -1) {
      return;
    }

    const before = value.slice(0, triggerIndex);
    const after = value.slice(start);

    const newValue = keepTriggerOnSelect
      ? `${before}${trigger}${option.label} ${after}`
      : `${before}${option.label} ${after}`;

    setValue(newValue);
    onChange?.(newValue);
    setShowModal(false);
    setSearch("");
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        before.length +
          option.label.length +
          1 +
          (keepTriggerOnSelect ? trigger.length : 0),
        before.length +
          option.label.length +
          1 +
          (keepTriggerOnSelect ? trigger.length : 0)
      );
    }, 0);
  };

  return {
    inputRef,
    value,
    showModal,
    modalPosition,
    highlightedIndex,
    filteredOptions,
    handleChange,
    handleKeyDown,
    handleSelect,
  };
}
